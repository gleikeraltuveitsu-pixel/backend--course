// requests.routes.js
// Capa HTTP del módulo requests. Solo conoce HTTP: recibe peticiones, valida
// la forma, delega al store la lógica de negocio y devuelve respuestas HTTP.
// La máquina de estados y las reglas viven en request-status.js; el array y
// los IDs viven en requests.store.js.

import express from 'express';
import {
  listRequests,
  filterRequests,
  findRequest,
  createRequest,
  updateRequest
} from './requests.store.js';
import { STATUSES, isValidStatus } from './request-status.js';

const router = express.Router();

const PRIORITIES = ['low', 'medium', 'high'];
const UPDATABLE_FIELDS = ['title', 'description', 'priority', 'status'];

// Toda respuesta de error usa la misma forma: code (máquina) + message (persona).
function errorBody(code, message) {
  return { error: { code, message } };
}

// GET /requests — listar la colección, con filtros opcionales ?status= y ?priority=.
// Un subconjunto vacío es información válida: 200 con [].
router.get('/', (req, res) => {
  const { status, priority } = req.query;

  if (status !== undefined && !isValidStatus(status)) {
    return res.status(400).json(errorBody(
      'UNKNOWN_STATUS',
      `Unknown status "${status}". Valid values: ${STATUSES.join(', ')}.`
    ));
  }

  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    return res.status(400).json(errorBody(
      'UNKNOWN_PRIORITY',
      `Unknown priority "${priority}". Valid values: ${PRIORITIES.join(', ')}.`
    ));
  }

  const results = (status !== undefined || priority !== undefined)
    ? filterRequests({ status, priority })
    : listRequests();

  res.status(200).json(results);
});

// GET /requests/:id — un recurso individual existe o no existe (404).
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const request = findRequest(id);

  if (!request) {
    return res.status(404).json(errorBody(
      'NOT_FOUND',
      `Request ${req.params.id} does not exist.`
    ));
  }

  res.status(200).json(request);
});

// POST /requests — el servidor controla id, fechas, estado inicial y prioridad por defecto.
// Campos del servidor que lleguen en el body se ignoran (nunca se recolectan).
router.post('/', (req, res) => {
  const { title, description, priority } = req.body ?? {};

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json(errorBody(
      'VALIDATION_ERROR',
      'A request needs a non-empty title.'
    ));
  }

  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    return res.status(400).json(errorBody(
      'UNKNOWN_PRIORITY',
      `Unknown priority "${priority}". Valid values: ${PRIORITIES.join(', ')}.`
    ));
  }

  const request = createRequest({
    title: title.trim(),
    description: typeof description === 'string' ? description : '',
    priority: priority ?? 'medium'
  });

  res.status(201).json(request);
});

// PATCH /requests/:id — actualización parcial de campos modificables, protegida
// por validación de forma (400) y por la máquina de estados (409).
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const request = findRequest(id);

  if (!request) {
    return res.status(404).json(errorBody(
      'NOT_FOUND',
      `Request ${req.params.id} does not exist.`
    ));
  }

  const body = req.body ?? {};
  const changes = {};
  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined) changes[field] = body[field];
  }

  if (Object.keys(changes).length === 0) {
    return res.status(400).json(errorBody(
      'VALIDATION_ERROR',
      `The body must include at least one of: ${UPDATABLE_FIELDS.join(', ')}.`
    ));
  }

  // Validación de forma: la petición tiene sentido mirando solo el body.
  if (changes.title !== undefined && (typeof changes.title !== 'string' || changes.title.trim() === '')) {
    return res.status(400).json(errorBody('VALIDATION_ERROR', 'The title cannot be empty.'));
  }

  if (changes.priority !== undefined && !PRIORITIES.includes(changes.priority)) {
    return res.status(400).json(errorBody(
      'UNKNOWN_PRIORITY',
      `Unknown priority "${changes.priority}". Valid values: ${PRIORITIES.join(', ')}.`
    ));
  }

  if (changes.status !== undefined && !isValidStatus(changes.status)) {
    return res.status(400).json(errorBody(
      'UNKNOWN_STATUS',
      `Unknown status "${changes.status}". Valid values: ${STATUSES.join(', ')}.`
    ));
  }

  // Reglas de negocio: la petición es válida de forma, pero puede chocar con el estado.
  if (changes.title !== undefined) changes.title = changes.title.trim();

  const result = updateRequest(id, changes);

  if (!result.ok) {
    const statusMap = {
      NOT_FOUND: 404,
      REQUEST_IN_TERMINAL_STATUS: 409,
      INVALID_STATUS_TRANSITION: 409
    };
    const messageMap = {
      NOT_FOUND: `Request ${id} does not exist.`,
      REQUEST_IN_TERMINAL_STATUS: `Request ${id} is ${request.status} and can no longer be modified.`,
      INVALID_STATUS_TRANSITION: `A request cannot move from ${request.status} to ${changes.status}.`
    };
    return res.status(statusMap[result.code]).json(errorBody(result.code, messageMap[result.code]));
  }

  res.status(200).json(result.request);
});

export default router;
