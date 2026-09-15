import 'dotenv/config';
import { pool } from '../src/database/pool.js';

const files = [
  '001_create_users.sql',
  '002_create_requests.sql',
  '003_create_request_history.sql',
  '004_add_constraints_and_indexes.sql'
];

for (const f of files) {
  await pool.query('INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [f]);
  console.log('Registrada: ' + f);
}

await pool.end();
console.log('Listo');
