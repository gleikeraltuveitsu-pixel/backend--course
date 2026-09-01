// requests.store.js
// Almacenamiento en memoria del recurso Request. No hay base de datos ni persistencia
// en archivo: el array vive mientras el proceso Node viva y se pierde al reiniciar
// (comportamiento esperado y documentado del alcance actual).

import { canTransition, isValidStatus, isTerminal, TRANSITIONS } from './request-status.js';

const REQUESTS = [
  {
    id: 1,
    title: 'Projector does not turn on',
    description: 'The projector in room 204 shows no image during class.',
    status: 'open',
    priority: 'high',
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z'
  },
  {
    id: 2,
    title: 'Broken chair in the lab',
    description: 'One chair in the computer lab has a loose back rest.',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2026-08-27T10:05:00.000Z',
    updatedAt: '2026-08-27T10:20:00.000Z'
  },
  {
    id: 3,
    title: 'Wi-Fi drops in the library',
    description: 'The connection drops every few minutes on the second floor.',
    status: 'open',
    priority: 'low',
    createdAt: '2026-08-27T10:10:00.000Z',
    updatedAt: '2026-08-27T10:10:00.000Z'
  }
];

// Contador del siguiente id. El servidor genera los id; el cliente no los asigna.
let nextId = 4;

// La fecha la genera el servidor, no el cliente.
function serverTimestamp() {
  return new Date().toISOString();
}

export function listRequests() {
  return REQUESTS;
}

export function findRequest(id) {
  return REQUESTS.find((request) => request.id === id);
}

// Filtra la colección por estado y/o prioridad. Ambos filtros son combinables.
export function filterRequests({ status, priority }) {
  return REQUESTS.filter((request) => {
    if (status !== undefined && request.status !== status) return false;
    if (priority !== undefined && request.priority !== priority) return false;
    return true;
  });
}

// Crea una solicitud nueva con los campos controlados por el servidor.
export function createRequest({ title, description, priority }) {
  const now = serverTimestamp();
  const request = {
    id: nextId,
    title,
    description: description || '',
    status: 'open', // invariante 3: toda solicitud nueva comienza en open.
    priority: priority || 'medium',
    createdAt: now,
    updatedAt: now
  };
  nextId += 1;
  REQUESTS.push(request);
  return request;
}

// Aplica una actualización parcial. `changes` ya pasó por validación de forma en las rutas.
// `status` solo puede cambiar si la transición está permitida por la máquina de estados.
// Devuelve un objeto { ok: true } en éxito, o { ok: false, code } en un choque de negocio.
export function updateRequest(id, changes) {
  const request = findRequest(id);
  if (!request) return { ok: false, code: 'NOT_FOUND' };
  if (isTerminal(request.status)) return { ok: false, code: 'REQUEST_IN_TERMINAL_STATUS' };

  if (changes.status !== undefined && changes.status !== request.status) {
    if (!canTransition(request.status, changes.status)) {
      return { ok: false, code: 'INVALID_STATUS_TRANSITION' };
    }
    request.status = changes.status;
  }

  if (changes.title !== undefined) request.title = changes.title;
  if (changes.description !== undefined) request.description = changes.description;
  if (changes.priority !== undefined) request.priority = changes.priority;

  request.updatedAt = serverTimestamp(); // invariante 7: updatedAt cambia al modificar.
  return { ok: true, request };
}

// Referencia expuesta para inspección (p. ej. resetear en pruebas). No es una ruta.
export function resetStore() {
  REQUESTS.length = 0;
  nextId = 1;
}
