// Acceso a datos de los usuarios. Solo consultas parametrizadas; devuelve
// filas y no sabe nada de HTTP ni de hashing. La columna password_hash jamás
// viaja más allá de la capa de servicio — el mapper la descarta.
import { pool } from '../../database/pool.js';

const USER_COLUMNS = `
  id,
  email,
  password_hash,
  role,
  created_at
`;

export async function findByEmail(email, db = pool) {
  const result = await db.query(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findById(id, db = pool) {
  const result = await db.query(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function insertUser({ email, passwordHash }, db = pool) {
  // id, role y created_at los genera la base. role NO es un parámetro a
  // propósito: el registro no puede elegirlo.
  const result = await db.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING ${USER_COLUMNS}`,
    [email, passwordHash]
  );
  return result.rows[0];
}