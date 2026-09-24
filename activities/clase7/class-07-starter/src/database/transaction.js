// Ejecuta una unidad de trabajo dentro de una única transacción. Cada
// consulta dentro de la unidad DEBE usar el cliente pasado a `work` —
// pool.query() podría tomar una conexión distinta y escaparse en silencio
// de la transacción.
import { pool } from "./pool.js";

export async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    // Revertir no es esconder: el llamador igual debe responder la petición.
    throw error;
  } finally {
    // Siempre devolver el préstamo — release devuelve la conexión al pool,
    // no cierra la base de datos.
    client.release();
  }
}