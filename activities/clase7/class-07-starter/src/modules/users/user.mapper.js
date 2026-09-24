// El único puente entre las filas de usuarios y su representación HTTP.
// password_hash existe en la fila y deliberadamente NO existe aquí: ninguna
// ruta puede filtrar lo que el mapper nunca expone.
export function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at
  };
}