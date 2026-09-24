// Ejecutor de migraciones. Aplica cada archivo .sql pendiente de
// database/migrations en orden lexicográfico, una transacción por migración,
// y recuerda lo aplicado en la tabla schema_migrations — así que ejecutarlo
// dos veces es seguro.
//
// Nunca borra tablas y nunca re-ejecuta una migración ya aplicada.
import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/database/pool.js';

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), '..', 'database', 'migrations'
);

async function main() {
  console.log('DATABASE MIGRATIONS\n');

  // El ledger: quien recuerda qué cambios ya se aplicaron.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const appliedResult = await pool.query('SELECT name FROM schema_migrations');
  const applied = new Set(appliedResult.rows.map((row) => row.name));

  let pending = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[SKIPPED] ${file}`);
      continue;
    }

    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      // Una transacción por migración: se aplica completa o se revierte
      // completa. La fila del ledger se escribe DENTRO de la misma
      // transacción, así que una migración fallida nunca queda registrada.
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`[APPLIED] ${file}`);
      pending += 1;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`\n[FAILED] ${file}`);
      console.error(`Reason: ${error.message}`);
      console.error('The transaction was rolled back: this migration left no partial changes.');
      process.exitCode = 1;
      return;
    } finally {
      client.release();
    }
  }

  console.log('');
  console.log(pending > 0 ? 'Database schema is ready.' : 'No pending migrations.');
}

try {
  await main();
} catch (error) {
  console.error('Migration runner error:', error.code ?? error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
