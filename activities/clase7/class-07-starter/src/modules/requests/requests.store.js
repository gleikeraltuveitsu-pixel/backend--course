// Acceso a datos del módulo requests. Ejecuta consultas parametrizadas y
// devuelve filas (o null); no sabe nada de códigos de estado HTTP ni de
// transiciones de dominio.
//
// Cada función acepta un `db` opcional para que el servicio pueda pasar un
// cliente de transacción — con el pool compartido como default.
//
// Los valores van SIEMPRE parametrizados ($1, $2, ...): nunca se interpolan
// directamente en el SQL. Los nombres de columna vienen únicamente de este
// archivo — los identificadores jamás se derivan de entrada del cliente.
import { pool } from '../../database/pool.js';

// Columnas que el contrato expone de una solicitud.
const REQUEST_COLUMNS = `
  id,
  title,
  description,
  priority,
  status,
  created_by,
  created_at,
  updated_at
`;

export async function findAll(filters = {}, db = pool) {
  const conditions = [];
  const values = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }
  if (filters.priority) {
    values.push(filters.priority);
    conditions.push(`priority = $${values.length}`);
  }
  // El alcance por dueño ocurre AQUÍ, en SQL. Cargar todo y filtrar en
  // JavaScript enviaría los datos ajenos al proceso solo para tirarlos.
  if (filters.createdBy) {
    values.push(filters.createdBy);
    conditions.push(`created_by = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT ${REQUEST_COLUMNS} FROM requests ${where} ORDER BY id`,
    values
  );
  return result.rows;
}

export async function findById(id, db = pool) {
  const result = await db.query(
    `SELECT ${REQUEST_COLUMNS} FROM requests WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function insertRequest({ title, description, priority, createdBy }, db = pool) {
  // La base genera id, status default y ambos timestamps. createdBy viene
  // del servicio — del actor autenticado, jamás del body.
  const result = await db.query(
    `INSERT INTO requests (title, description, priority, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING ${REQUEST_COLUMNS}`,
    [title, description, priority, createdBy]
  );
  return result.rows[0];
}

export async function updateRequest(id, changes, db = pool) {
  const assignments = [];
  const values = [];

  // Solo los campos presentes en `changes` entran al SET (PATCH parcial).
  for (const field of ['title', 'description', 'priority', 'status']) {
    if (changes[field] !== undefined) {
      values.push(changes[field]);
      assignments.push(`${field} = $${values.length}`);
    }
  }

  values.push(id);
  const result = await db.query(
    `UPDATE requests
     SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}
     RETURNING ${REQUEST_COLUMNS}`,
    values
  );
  return result.rows[0] ?? null;
}

export async function insertHistoryEvent(event, db = pool) {
  // Un único escritor para los dos tipos de evento. El servicio decide QUÉ
  // campos lleva el evento; las columnas no usadas quedan NULL.
  const { requestId, type, fromStatus, toStatus, fromPriority, toPriority, changedBy } = event;
  await db.query(
    `INSERT INTO request_history
       (request_id, type, from_status, to_status, from_priority, to_priority, changed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [requestId, type, fromStatus ?? null, toStatus ?? null,
      fromPriority ?? null, toPriority ?? null, changedBy ?? null]
  );
}

export async function findHistory(requestId, db = pool) {
  // El más antiguo primero; el id es el desempate ESTABLE cuando dos eventos
  // comparten el mismo timestamp.
  const result = await db.query(
    `SELECT id, type, from_status, to_status, from_priority, to_priority, created_at
     FROM request_history
     WHERE request_id = $1
     ORDER BY created_at, id`,
    [requestId]
  );
  return result.rows;
}