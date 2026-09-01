// request-status.js
// Máquina de estados del recurso Request. La regla de negocio vive en un solo lugar:
// aquí se definen los estados permitidos, las transiciones válidas y los estados terminales.
// Todo lo demás (rutas, store) consulta este módulo; nada redefine la regla por su cuenta.

export const STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'cancelled'];

// Transiciones permitidas: mapa de estado actual -> estados a los que puede pasar.
export const TRANSITIONS = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved: ['closed', 'in_progress'],
  closed: [],
  cancelled: []
};

export const TERMINAL_STATUSES = ['closed', 'cancelled'];

// Devuelve true si el valor dado es un estado válido.
export function isValidStatus(value) {
  return STATUSES.includes(value);
}

// Una transición está permitida solo si el estado actual puede pasar al estado destino.
export function canTransition(from, to) {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  return TRANSITIONS[from].includes(to);
}

// Un estado terminal no admite ninguna modificación posterior.
export function isTerminal(status) {
  return TERMINAL_STATUSES.includes(status);
}
