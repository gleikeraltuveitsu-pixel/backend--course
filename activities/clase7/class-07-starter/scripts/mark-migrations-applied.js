// Marca todos los archivos de migración como aplicados en schema_migrations
// SIN ejecutar el SQL. (Utilidad de entorno: repara un ledger desincronizado;
// no forma parte de la corrección de los incidentes.)
import 'dotenv/config';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/database/pool.js';

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), '..', 'database', 'migrations'
);

async function main() {
  console.log('Marking migration files as applied...\n');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    try {
      await pool.query(
        'INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [file]
      );
      console.log(`[MARKED] ${file}`);
      count += 1;
    } catch (error) {
      console.error(`Failed to mark ${file}:`, error.message);
    }
  }

  console.log(`\nDone. ${count} migration(s) processed.`);
}

try {
  await main();
} catch (error) {
  console.error('Error:', error.message || error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
