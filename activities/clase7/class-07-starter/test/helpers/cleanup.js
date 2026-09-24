// Helper de limpieza. Borra SOLO las filas que esta corrida de tests creó,
// por sus ids registrados, en orden de dependencias: history -> requests ->
// users. Nunca un DELETE general, nunca TRUNCATE — el seed y los datos
// propios del estudiante deben sobrevivir a cada corrida.
import { pool } from '../../src/database/pool.js';
import { createdUserIds, createdRequestIds } from './test-data.js';

export async function cleanupCreatedData() {
  if (createdRequestIds.length) {
    await pool.query(
      'DELETE FROM request_history WHERE request_id = ANY($1::bigint[])',
      [createdRequestIds]
    );
    await pool.query(
      'DELETE FROM requests WHERE id = ANY($1::bigint[])',
      [createdRequestIds]
    );
    createdRequestIds.length = 0;
  }
  if (createdUserIds.length) {
    await pool.query(
      'DELETE FROM request_history WHERE changed_by = ANY($1::uuid[])',
      [createdUserIds]
    );
    await pool.query(
      'DELETE FROM users WHERE id = ANY($1::uuid[])',
      [createdUserIds]
    );
    createdUserIds.length = 0;
  }
}

export async function closePool() {
  await pool.end();
}