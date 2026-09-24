// Suite de health y readiness (OPS-703).
//
// El caso interesante es "/ready cuando la base está caída" SIN tocar las
// credenciales reales: createHealthRouter acepta una función de verificación
// INYECTABLE — se le entrega una que lanza, montada sobre una mini app
// express descartable. Con salud (immutable) y disponibilidad (mutable).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/database/pool.js';
import { createHealthRouter } from '../src/routes/health.routes.js';
import { cleanupCreatedData, closePool } from './helpers/cleanup.js';

after(async () => {
  await cleanupCreatedData();
  await closePool();
});

test('GET /health answers 200 ok without touching PostgreSQL', async () => {
  // Prueba doble: /health responde aunque la base esté "caída" porque el
  // middleware nunca consulta PostgreSQL.
  const realQuery = pool.query.bind(pool);
  pool.query = async () => { throw new Error('database is down'); };
  try {
    const response = await request(app).get('/health');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok' });
  } finally {
    pool.query = realQuery;
  }
});

test('GET /ready answers 200 when PostgreSQL responds', async () => {
  const response = await request(app).get('/ready');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ready', database: 'available' });
});

test('GET /ready answers 503 when the database check fails', async () => {
  // Router con una verificación inyectada que siempre falla: no se toca la
  // base real. El 503 es un estado controlado, no un crash.
  const failingRouter = createHealthRouter({
    checkDatabase: async () => { throw new Error('check failed'); }
  });
  const tinyApp = express();
  tinyApp.use(failingRouter);

  const response = await request(tinyApp).get('/ready');
  assert.equal(response.status, 503);
  assert.deepEqual(response.body, { status: 'not_ready', database: 'unavailable' });
});

test('the readiness response never reveals connection details', async () => {
  // La verificación falla mencionando host y puerto: ni uno ni otro pueden
  // aparecer en el body (no revelar infraestructura).
  const failingRouter = createHealthRouter({
    checkDatabase: async () => {
      throw new Error('connection refused to db.supabase.example:5432 user=postgres');
    }
  });
  const tinyApp = express();
  tinyApp.use(failingRouter);

  const response = await request(tinyApp).get('/ready');
  assert.equal(response.status, 503);
  const raw = JSON.stringify(response.body);
  assert.ok(!/supabase|5432|postgres|SELECT/i.test(raw), 'response leaks internals');
  assert.deepEqual(response.body, { status: 'not_ready', database: 'unavailable' });
});