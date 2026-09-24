// El único puente entre las filas SQL (snake_case) y la representación HTTP
// que promete el contrato (camelCase). Una fila no es automáticamente la
// respuesta HTTP.
//
// La conversión de tipos también vive aquí: los BIGINT de Postgres llegan
// como strings en el driver y se convierten a Number para el contrato.

export function mapRequestRow(row) {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapHistoryEventRow(row) {
  // Cada tipo de evento expone SOLO sus propios campos. changed_by queda
  // interno: el contrato de FEATURE-206 no lo incluye.
  if (row.type === 'priority_changed') {
    return {
      id: Number(row.id),
      type: row.type,
      fromPriority: row.from_priority,
      toPriority: row.to_priority,
      createdAt: row.created_at
    };
  }
  return {
    id: Number(row.id),
    type: row.type,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    createdAt: row.created_at
  };
}