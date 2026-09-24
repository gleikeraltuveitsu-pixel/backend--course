// Reglas de dominio del ciclo de vida de una solicitud. Sin cambios desde
// la clase 03: las reglas puras de dominio no dependen de dónde viven los
// datos.

// Estados válidos del recurso.
export const STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'cancelled'];

// Estados terminales: una solicitud que llega aquí ya no se modifica.
export const TERMINAL_STATUSES = ['closed', 'cancelled'];

// Máquina de estados: de qué estado se puede ir a cuáles.
const ALLOWED_TRANSITIONS = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved: ['in_progress', 'closed'],
  closed: [],
  cancelled: []
};

export function isValidStatus(status) {
  return STATUSES.includes(status);
}

export function isTerminal(status) {
  return TERMINAL_STATUSES.includes(status);
}

export function canTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}