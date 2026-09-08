// ============================================================================
// STARTER NOTE — Stations 6 and 7 evolve this file. It arrives working
// exactly as in class 04 (with AppError now imported from the shared
// src/app-error.js). Target changes:
//
//   * every exported operation receives the actor first:
//       listRequests(actor, filters) · getRequest(actor, id)
//       createRequest(actor, input) · patchRequest(actor, id, body)
//       getHistory(actor, id)
//   * reject server-controlled fields explicitly (400 SERVER_CONTROLLED_FIELD):
//       id, createdBy, createdAt, updatedAt, changedBy — and status on POST;
//   * createRequest: createdBy = actor.userId (never from the body); the
//     birth history records the creator as changed_by;
//   * listRequests: requester -> scope with { createdBy: actor.userId } in
//     the store call; agent -> everything;
//   * getRequest/getHistory: a foreign request answers the SAME 404 as a
//     missing one (do not reveal existence);
//   * patchRequest: apply the policy BEFORE writing, all-or-nothing (a
//     mixed body with a forbidden field changes NOTHING -> 403), and pass
//     actor.userId as changedBy to insertStatusHistory;
//   * the class 3-4 rules stay: terminal states and transitions keep
//     answering 409 — for every role.
//
// New error categories available: AppError('forbidden', 'FORBIDDEN', ...)
// -> 403. See src/app-error.js.
// ============================================================================

import { withTransaction } from '../../database/transaction.js';
import {
  findAll,
  findById,
  insertRequest,
  updateRequest,
  insertStatusHistory,
  findHistory
} from './requests.store.js';
import { mapRequestRow, mapHistoryRow } from './request.mapper.js';
import { STATUSES, isValidStatus, isTerminal, canTransition } from './request-status.js';
import {
  canListAllRequests,
  canViewRequest,
  canViewHistory,
  canCreateRequest,
  canEditContent,
  canChangePriority,
  canChangeStatus
} from './request.policy.js';
import { AppError } from '../../app-error.js';

const PRIORITIES = ['low', 'medium', 'high'];
const UPDATABLE_FIELDS = ['title', 'description', 'priority', 'status'];

// Fields the client may never send on requests; the server controls them.
const SERVER_CONTROLLED_REQUEST_FIELDS = ['id', 'createdBy', 'createdAt', 'updatedAt', 'changedBy'];
const SERVER_CONTROLLED_REQUEST_FIELDS_ON_CREATE = [
  ...SERVER_CONTROLLED_REQUEST_FIELDS,
  'status'
];

function assertNoServerControlledFields(body, fields) {
  for (const field of fields) {
    if (body[field] !== undefined) {
      throw new AppError('contract', 'SERVER_CONTROLLED_FIELD',
        `The field "${field}" is controlled by the server and cannot be set by the client.`);
    }
  }
}

function assertValidPriority(priority) {
  if (!PRIORITIES.includes(priority)) {
    throw new AppError('contract', 'INVALID_PRIORITY',
      `Unknown priority "${priority}". Valid values: ${PRIORITIES.join(', ')}.`);
  }
}

function notFound(id) {
  return new AppError('resource', 'REQUEST_NOT_FOUND', `Request ${id} does not exist.`);
}

export async function listRequests(actor, filters) {
  if (filters.status !== undefined && !isValidStatus(filters.status)) {
    throw new AppError('contract', 'INVALID_FILTER',
      `Unknown status "${filters.status}". Valid values: ${STATUSES.join(', ')}.`);
  }
  if (filters.priority !== undefined && !PRIORITIES.includes(filters.priority)) {
    throw new AppError('contract', 'INVALID_FILTER',
      `Unknown priority "${filters.priority}". Valid values: ${PRIORITIES.join(', ')}.`);
  }

  const storeFilters = canListAllRequests(actor)
    ? { ...filters }
    : { ...filters, createdBy: actor.userId };

  const rows = await findAll(storeFilters);
  return rows.map(mapRequestRow);
}

export async function getRequest(actor, id) {
  const row = await findById(id);
  if (!row || !canViewRequest(actor, mapRequestRow(row))) {
    // A foreign request (or a legacy one for a requester) answers the SAME
    // 404 as a missing one: existence is never revealed.
    throw notFound(id);
  }
  return mapRequestRow(row);
}

export async function createRequest(actor, input) {
  const body = input ?? {};

  assertNoServerControlledFields(body, SERVER_CONTROLLED_REQUEST_FIELDS_ON_CREATE);

  if (!canCreateRequest(actor)) {
    throw new AppError('forbidden', 'FORBIDDEN',
      'Only requesters can create requests.');
  }

  const { title, description, priority } = body;

  if (typeof title !== 'string' || title.trim() === '') {
    throw new AppError('contract', 'TITLE_REQUIRED', 'A request needs a non-empty title.');
  }
  if (priority !== undefined) assertValidPriority(priority);

  // Creation is a unit of work: the request AND its birth history
  // (NULL -> open) happen together or not at all. The creator comes from
  // the verified token, never from the body.
  const row = await withTransaction(async (client) => {
    const created = await insertRequest({
      title: title.trim(),
      description: typeof description === 'string' ? description : null,
      priority: priority ?? 'medium',
      createdBy: actor.userId
    }, client);
    await insertStatusHistory(created.id, null, created.status, actor.userId, client);
    return created;
  });

  return mapRequestRow(row);
}

export async function patchRequest(actor, id, body) {
  const input = body ?? {};

  assertNoServerControlledFields(input, SERVER_CONTROLLED_REQUEST_FIELDS);

  const changes = {};
  for (const field of UPDATABLE_FIELDS) {
    if (input[field] !== undefined) changes[field] = input[field];
  }

  if (Object.keys(changes).length === 0) {
    throw new AppError('contract', 'NO_UPDATABLE_FIELDS',
      `The body must include at least one of: ${UPDATABLE_FIELDS.join(', ')}.`);
  }
  if (changes.title !== undefined && (typeof changes.title !== 'string' || changes.title.trim() === '')) {
    throw new AppError('contract', 'TITLE_REQUIRED', 'The title cannot be empty.');
  }
  if (changes.priority !== undefined) assertValidPriority(changes.priority);
  if (changes.status !== undefined && !isValidStatus(changes.status)) {
    throw new AppError('contract', 'INVALID_STATUS',
      `Unknown status "${changes.status}". Valid values: ${STATUSES.join(', ')}.`);
  }
  if (changes.title !== undefined) changes.title = changes.title.trim();

  // Read, validate against the current state, write and record history —
  // all with the same client, as one unit of work.
  const row = await withTransaction(async (client) => {
    const current = await findById(id, client);
    if (!current) {
      throw notFound(id);
    }

    // Policies speak the HTTP representation (camelCase createdBy/status),
    // not the raw SQL row.
    const currentView = mapRequestRow(current);

    // A requester never matches an ownerless/foreign request: answer the
    // same 404 as a missing one, so ownership boundaries stay invisible.
    if (!canViewRequest(actor, currentView)) {
      throw notFound(id);
    }

    // Authorization BEFORE any write, all-or-nothing: if any field in the
    // body is not permitted for this actor, NOTHING changes.
    const denies = Object.keys(changes)
      .filter((field) => {
        if (field === 'title' || field === 'description') return !canEditContent(actor, currentView);
        if (field === 'priority') return !canChangePriority(actor);
        if (field === 'status') return !canChangeStatus(actor);
        return true;
      });
    if (denies.length > 0) {
      throw new AppError('forbidden', 'FORBIDDEN',
        'You are not allowed to perform this operation.');
    }

    if (isTerminal(current.status)) {
      throw new AppError('domain', 'REQUEST_IN_TERMINAL_STATUS',
        `Request ${id} is ${current.status} and can no longer be modified.`);
    }

    const statusChanges = changes.status !== undefined && changes.status !== current.status;
    if (statusChanges && !canTransition(current.status, changes.status)) {
      throw new AppError('domain', 'INVALID_STATUS_TRANSITION',
        `A request cannot move from ${current.status} to ${changes.status}.`);
    }

    const updated = await updateRequest(id, changes, client);
    if (statusChanges) {
      await insertStatusHistory(id, current.status, changes.status, actor.userId, client);
    }
    return updated;
  });

  return mapRequestRow(row);
}

export async function getHistory(actor, id) {
  const request = await findById(id);
  if (!request || !canViewHistory(actor, mapRequestRow(request))) {
    // Same principle as getRequest: a foreign or legacy request answers
    // the same 404 as one that does not exist.
    throw notFound(id);
  }
  const rows = await findHistory(id);
  return rows.map(mapHistoryRow);
}