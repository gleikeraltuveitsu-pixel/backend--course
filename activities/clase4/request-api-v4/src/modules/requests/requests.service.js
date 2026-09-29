// Coordination layer. Applies process rules, validates transitions and
// defines units of work. No SQL and no HTTP status codes here:
// throw typed errors and let the routes translate them.

import { withTransaction } from "../../database/transaction.js";
import {
  isValidStatus,
  isTerminal,
  canTransition,
  STATUSES
} from "./request-status.js";
import {
  findAll,
  findById,
  insertRequest,
  updateRequest,
  insertStatusHistory,
  findHistory
} from "./requests.store.js";
import { mapRequestRow, mapHistoryRow } from "./request.mapper.js";

const PRIORITIES = ["low", "medium", "high"];
const UPDATABLE_FIELDS = ["title", "description", "priority", "status"];

export class AppError extends Error {
  constructor(category, code, message) {
    super(message);
    this.category = category;
    this.code = code;
  }
}

export async function listRequests(filters = {}) {
  if (filters.status !== undefined && !isValidStatus(filters.status)) {
    throw new AppError(
      "contract",
      "INVALID_FILTER",
      `Unknown status "${filters.status}". Valid values: ${STATUSES.join(", ")}.`
    );
  }

  if (filters.priority !== undefined && !PRIORITIES.includes(filters.priority)) {
    throw new AppError(
      "contract",
      "INVALID_FILTER",
      `Unknown priority "${filters.priority}". Valid values: ${PRIORITIES.join(", ")}.`
    );
  }

  const rows = await findAll(filters);
  return rows.map(mapRequestRow);
}

export async function getRequest(id) {
  const row = await findById(id);
  if (!row) {
    throw new AppError(
      "resource",
      "REQUEST_NOT_FOUND",
      `Request ${id} does not exist.`
    );
  }
  return mapRequestRow(row);
}

export async function createRequest({ title, description, priority }) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new AppError(
      "contract",
      "TITLE_REQUIRED",
      "A request needs a non-empty title."
    );
  }

  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    throw new AppError(
      "contract",
      "INVALID_PRIORITY",
      `Unknown priority "${priority}". Valid values: ${PRIORITIES.join(", ")}.`
    );
  }

  const finalPriority = priority ?? "medium";

  const created = await withTransaction(async (client) => {
    const request = await insertRequest(
      { title: title.trim(), description: description ?? "", priority: finalPriority },
      client
    );
    await insertStatusHistory(request.id, null, request.status, client);
    return request;
  });

  return mapRequestRow(created);
}

export async function patchRequest(id, body) {
  const row = await findById(id);
  if (!row) {
    throw new AppError(
      "resource",
      "REQUEST_NOT_FOUND",
      `Request ${id} does not exist.`
    );
  }

  const changes = {};
  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined) changes[field] = body[field];
  }

  if (Object.keys(changes).length === 0) {
    throw new AppError(
      "contract",
      "NO_UPDATABLE_FIELDS",
      `The body must include at least one of: ${UPDATABLE_FIELDS.join(", ")}.`
    );
  }

  if (changes.title !== undefined && (typeof changes.title !== "string" || changes.title.trim() === "")) {
    throw new AppError("contract", "TITLE_REQUIRED", "The title cannot be empty.");
  }

  if (changes.priority !== undefined && !PRIORITIES.includes(changes.priority)) {
    throw new AppError(
      "contract",
      "INVALID_PRIORITY",
      `Unknown priority "${changes.priority}". Valid values: ${PRIORITIES.join(", ")}.`
    );
  }

  if (changes.status !== undefined && !isValidStatus(changes.status)) {
    throw new AppError(
      "contract",
      "INVALID_STATUS",
      `Unknown status "${changes.status}". Valid values: ${STATUSES.join(", ")}.`
    );
  }

  if (isTerminal(row.status)) {
    throw new AppError(
      "domain",
      "REQUEST_IN_TERMINAL_STATUS",
      `Request ${id} is ${row.status} and can no longer be modified.`
    );
  }

  if (changes.status !== undefined && changes.status !== row.status &&
      !canTransition(row.status, changes.status)) {
    throw new AppError(
      "domain",
      "INVALID_STATUS_TRANSITION",
      `A request cannot move from ${row.status} to ${changes.status}.`
    );
  }

  if (changes.title !== undefined) changes.title = changes.title.trim();

  const previousStatus = row.status;

  const updated = await withTransaction(async (client) => {
    const result = await updateRequest(id, changes, client);
    if (changes.status !== undefined && changes.status !== previousStatus) {
      await insertStatusHistory(id, previousStatus, changes.status, client);
    }
    return result;
  });

  return mapRequestRow(updated);
}

export async function getHistory(id) {
  const row = await findById(id);
  if (!row) {
    throw new AppError(
      "resource",
      "REQUEST_NOT_FOUND",
      `Request ${id} does not exist.`
    );
  }

  const rows = await findHistory(id);
  return rows.map(mapHistoryRow);
}
