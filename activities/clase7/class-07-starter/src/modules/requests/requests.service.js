// Capa de coordinación del módulo requests. Desde la clase 5 cada operación
// recibe el actor autenticado: el servicio aplica la política del módulo,
// conserva las reglas de caso de uso de las clases 3-4 y define unidades de
// trabajo. No hay SQL ni códigos de estado HTTP aquí.

import { withTransaction } from '../../database/transaction.js';
import {
  findAll,
  findById,
  insertRequest,
  updateRequest,
  insertHistoryEvent,
  findHistory
} from './requests.store.js';
import { mapRequestRow, mapHistoryEventRow } from './request.mapper.js';
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

// INC-702 · Primera defensa: la APLICACIÓN valida la prioridad ANTES de
// ejecutar SQL. Antes solo existía la restricción CHECK de PostgreSQL, que
// rechazaba el valor tarde (500 en lugar de 400) y dejaba el error técnico
// en el log. La restricción SE CONSERVA intacta como segunda defensa: si la
// aplicación falla u otro proceso escribe en la tabla, la integridad sigue
// protegida. Eliminar la restricción no sería una corrección aceptable.
// `required` fuerza el valor cuando lo exige la operación (p. ej. crear);
// por defecto acepta ausencia (usa el default de la base).
function assertValidPriority(priority, { required = false } = {}) {
  if (priority === undefined && !required) return;
  if (priority === undefined || !PRIORITIES.includes(priority)) {
    throw new AppError('contract', 'INVALID_PRIORITY',
      'Priority must be low, medium or high.');
  }
}

// Campos que el servidor controla sobre las solicitudes. Enviarlos es una
// violación del contrato y se responde explícitamente — nunca se ignora en
// silencio (ignorar "role": "agent" le enseñaría al cliente que intentarlo
// no cuesta nada).
const SERVER_CONTROLLED_FIELDS = ['id', 'createdBy', 'createdAt', 'updatedAt', 'changedBy'];

// Un recurso ajeno responde exactamente igual que uno inexistente: mismo
// status, mismo code, mismo mensaje. Una respuesta distinta confirmaría
// que el recurso existe.
function notFound(id) {
  return new AppError('resource', 'REQUEST_NOT_FOUND', `Request ${id} does not exist.`);
}

function forbidden(message) {
  return new AppError('forbidden', 'FORBIDDEN', message);
}

function rejectServerControlledFields(body, extra = []) {
  for (const field of [...SERVER_CONTROLLED_FIELDS, ...extra]) {
    if (body && field in body) {
      throw new AppError('contract', 'SERVER_CONTROLLED_FIELD',
        `The field "${field}" is controlled by the server.`);
    }
  }
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

  // Los agentes ven toda la colección; los requesters ven la propia,
  // delimitada EN EL SQL mismo — el WHERE vive en el store, no en
  // JavaScript. Cargar todo y filtrar en JS enviaría datos ajenos al
  // proceso solo para descartarlos.
  const scope = canListAllRequests(actor)
    ? filters
    : { ...filters, createdBy: actor.userId };

  const rows = await findAll(scope);
  return rows.map(mapRequestRow);
}

export async function getRequest(actor, id) {
  const row = await findById(id);
  if (!row) throw notFound(id);

  const request = mapRequestRow(row);
  if (!canViewRequest(actor, request)) throw notFound(id);
  return request;
}

export async function createRequest(actor, input) {
  if (!canCreateRequest(actor)) {
    throw forbidden('Only requesters can create requests.');
  }

  // El status también es controlado por el servidor al crear: una solicitud
  // nace abierta.
  rejectServerControlledFields(input, ['status']);

  const { title, description, priority } = input ?? {};

  if (typeof title !== 'string' || title.trim() === '') {
    throw new AppError('contract', 'TITLE_REQUIRED', 'A request needs a non-empty title.');
  }

  // INC-702 · Validación de contrato ANTES de la transacción (y por tanto
  // antes del INSERT). Si la prioridad es desconocida, responde 400 y la
  // restricción CHECK de PostgreSQL nunca llega a ejecutarse.
  assertValidPriority(priority);

  // La creación es una unidad de trabajo: la solicitud Y su evento de
  // nacimiento (NULL -> open) ocurren juntas o no ocurren. El dueño y el
  // actor del historial vienen de la identidad autenticada, jamás del body.
  const row = await withTransaction(async (client) => {
    const created = await insertRequest({
      title: title.trim(),
      description: typeof description === 'string' ? description : null,
      priority: priority ?? 'medium',
      createdBy: actor.userId
    }, client);
    await insertHistoryEvent({
      requestId: created.id,
      type: 'status_changed',
      fromStatus: null,
      toStatus: created.status,
      changedBy: actor.userId
    }, client);
    return created;
  });

  return mapRequestRow(row);
}

export async function patchRequest(actor, id, body) {
  rejectServerControlledFields(body);

  const changes = {};
  for (const field of UPDATABLE_FIELDS) {
    if (body?.[field] !== undefined) changes[field] = body[field];
  }

  if (Object.keys(changes).length === 0) {
    throw new AppError('contract', 'NO_UPDATABLE_FIELDS',
      `The body must include at least one of: ${UPDATABLE_FIELDS.join(', ')}.`);
  }
  if (changes.title !== undefined && (typeof changes.title !== 'string' || changes.title.trim() === '')) {
    throw new AppError('contract', 'TITLE_REQUIRED', 'The title cannot be empty.');
  }
  if (changes.status !== undefined && !isValidStatus(changes.status)) {
    throw new AppError('contract', 'INVALID_STATUS',
      `Unknown status "${changes.status}". Valid values: ${STATUSES.join(', ')}.`);
  }
  // INC-702 · La prioridad se valida AQUÍ, fuera de la transacción: si es
  // inválida, responde 400 antes de haber ejecutado cualquier SQL.
  assertValidPriority(changes.priority);
  if (changes.title !== undefined) changes.title = changes.title.trim();

  // Leer, autorizar contra el estado ACTUAL, validar, escribir y registrar
  // el historial — todo con el mismo cliente, como una unidad de trabajo.
  const row = await withTransaction(async (client) => {
    const current = await findById(id, client);
    if (!current) throw notFound(id);

    const request = mapRequestRow(current);
    if (!canViewRequest(actor, request)) throw notFound(id);

    // La autorización es todo-o-nada: un body que mezcla un cambio permitido
    // con uno prohibido se rechaza entero. Sin sorpresas parciales.
    const wantsContent = changes.title !== undefined || changes.description !== undefined;
    const wantsPriority = changes.priority !== undefined;
    const wantsStatus = changes.status !== undefined;

    if (wantsContent && !canEditContent(actor, request)) {
      throw forbidden('Only the owner can edit title and description, and only while the request is open.');
    }
    if (wantsPriority && !canChangePriority(actor)) {
      throw forbidden('Only agents can change the priority.');
    }
    if (wantsStatus && !canChangeStatus(actor)) {
      throw forbidden('Only agents can change the status.');
    }

    // Las reglas de las clases 3-4 siguen vigentes — para todo rol.
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
    // El actor del historial es la identidad autenticada — changedBy jamás
    // puede llegar del body. Cada tipo de cambio deja su propio evento.
    if (statusChanges) {
      await insertHistoryEvent({
        requestId: id,
        type: 'status_changed',
        fromStatus: current.status,
        toStatus: changes.status,
        changedBy: actor.userId
      }, client);
    }
    if (changes.priority !== undefined && changes.priority !== current.priority) {
      await insertHistoryEvent({
        requestId: id,
        type: 'priority_changed',
        fromPriority: current.priority,
        toPriority: changes.priority,
        changedBy: actor.userId
      }, client);
    }
    return updated;
  });

  return mapRequestRow(row);
}

export async function getHistory(actor, id) {
  const row = await findById(id);
  if (!row) throw notFound(id);

  const request = mapRequestRow(row);
  if (!canViewHistory(actor, request)) throw notFound(id);

  const rows = await findHistory(id);
  return rows.map(mapHistoryEventRow);
}