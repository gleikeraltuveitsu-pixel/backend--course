// PostgreSQL-backed store. Every function accepts an optional `db` parameter
// so the service can pass a transaction client instead of the pool.

import { pool } from "../../database/pool.js";

export async function findAll(filters = {}, db = pool) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (filters.status) {
    conditions.push(`status = $${index++}`);
    values.push(filters.status);
  }

  if (filters.priority) {
    conditions.push(`priority = $${index++}`);
    values.push(filters.priority);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await db.query(
    `SELECT id, title, description, priority, status, created_at, updated_at
     FROM requests ${where}
     ORDER BY id`,
    values
  );

  return result.rows;
}

export async function findById(id, db = pool) {
  const result = await db.query(
    `SELECT id, title, description, priority, status, created_at, updated_at
     FROM requests WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function insertRequest({ title, description, priority }, db = pool) {
  const result = await db.query(
    `INSERT INTO requests (title, description, priority)
     VALUES ($1, $2, $3)
     RETURNING id, title, description, priority, status, created_at, updated_at`,
    [title, description, priority]
  );

  return result.rows[0];
}

export async function updateRequest(id, changes, db = pool) {
  const fields = [];
  const values = [];
  let index = 1;

  if (changes.title !== undefined) {
    fields.push(`title = $${index++}`);
    values.push(changes.title);
  }

  if (changes.description !== undefined) {
    fields.push(`description = $${index++}`);
    values.push(changes.description);
  }

  if (changes.priority !== undefined) {
    fields.push(`priority = $${index++}`);
    values.push(changes.priority);
  }

  if (changes.status !== undefined) {
    fields.push(`status = $${index++}`);
    values.push(changes.status);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await db.query(
    `UPDATE requests SET ${fields.join(", ")}
     WHERE id = $${index}
     RETURNING id, title, description, priority, status, created_at, updated_at`,
    values
  );

  return result.rows[0] ?? null;
}

export async function insertStatusHistory(requestId, previousStatus, newStatus, db = pool) {
  await db.query(
    `INSERT INTO request_status_history (request_id, previous_status, new_status)
     VALUES ($1, $2, $3)`,
    [requestId, previousStatus, newStatus]
  );
}

export async function findHistory(requestId, db = pool) {
  const result = await db.query(
    `SELECT previous_status, new_status, changed_at
     FROM request_status_history
     WHERE request_id = $1
     ORDER BY changed_at`,
    [requestId]
  );

  return result.rows;
}
