// Política de autorización del módulo requests. Funciones puras sobre un
// actor y (cuando corresponde) una representación de solicitud: sin SQL, sin
// HTTP. El middleware establece QUIÉN es el actor; estas funciones deciden
// QUÉ puede hacer; el servicio conserva las reglas de caso de uso.
//
// Matriz de acceso del taller (baseline fijo — el validador depende de él):
//   listar todas las solicitudes .. agent
//   listar sus propias ........... requester (acotado en SQL, no en JS)
//   ver / historial .............. agent: cualquiera · requester: propias
//   crear ........................ requester
//   editar título/descripción .... requester, propia, mientras esté abierta
//   cambiar prioridad ............ agent
//   cambiar estado ............... agent (la máquina de estados sigue rigiendo)

export function canListAllRequests(actor) {
  return actor.role === 'agent';
}

export function canViewRequest(actor, request) {
  if (actor.role === 'agent') return true;
  return request.createdBy === actor.userId;
}

export function canViewHistory(actor, request) {
  return canViewRequest(actor, request);
}

export function canCreateRequest(actor) {
  return actor.role === 'requester';
}

export function canEditContent(actor, request) {
  return actor.role === 'requester'
    && request.createdBy === actor.userId
    && request.status === 'open';
}

export function canChangePriority(actor) {
  return actor.role === 'agent';
}

export function canChangeStatus(actor) {
  return actor.role === 'agent';
}