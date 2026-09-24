// Suite de pruebas del contrato de errores.
//
// Estas son las pruebas de REGRESIÓN que blindan INC-701 e INC-702: hoy
// fallarían si revirtiéramos la corrección. Siguen el patrón
// Prepare -> Act -> Check de las pruebas existentes y usan los helpers de
// test/helpers/ (datos únicos por corrida y limpieza exacta de lo creado).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/database/pool.js';
import { createUser, createRequestAs } from './helpers/test-data.js';
import { loginAs } from './helpers/test-auth.js';
import { cleanupCreatedData, closePool } from './helpers/cleanup.js';

after(async () => {
  await cleanupCreatedData();
  await closePool();
});

// ------------------------------------------------- INC-701 regresión

test('an alphabetic id answers 400 INVALID_REQUEST_ID, not 500', async () => {
  // Prepare: un usuario registrado con su token.
  const owner = await createUser({ name: 'alphaid' });
  const token = await loginAs(owner);

  // Act: pedir una solicitud cuyo id no es ni siquiera un número.
  const response = await request(app)
    .get('/requests/not-a-number')
    .set('Authorization', `Bearer ${token}`);

  // Check: el formato inválido es problema del consumidor -> 400 tipado.
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'INVALID_REQUEST_ID');
});

test('decimal, zero and negative ids are rejected the same way', async () => {
  const owner = await createUser({ name: 'edgeids' });
  const token = await loginAs(owner);

  // Casos límite que un parseInt ingenuo aceptaría: '1.5' -> 1, '0',
  // '-3', y '12abc' -> 12. La validación debe rechazar el VALOR COMPLETO.
  for (const bad of ['1.5', '0', '-3', '12abc']) {
    const response = await request(app)
      .get(`/requests/${bad}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(response.status, 400, `expected 400 for "${bad}"`);
    assert.equal(response.body.error.code, 'INVALID_REQUEST_ID', `code for "${bad}"`);
  }
});

test('a well-formed id that matches nothing still answers 404', async () => {
  const owner = await createUser({ name: 'missing' });
  const token = await loginAs(owner);

  const response = await request(app)
    .get('/requests/999999999')
    .set('Authorization', `Bearer ${token}`);

  // Formato válido pero sin recurso = recurso faltante (404), NO 400.
  // La corrección de INC-701 no debe cambiar este comportamiento.
  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'REQUEST_NOT_FOUND');
});

// ------------------------------------------------- INC-702 regresión

test('an invalid priority answers 400 INVALID_PRIORITY before touching SQL', async () => {
  // Prepare: un dueño con una solicitud y un agente con token.
  const owner = await createUser({ name: 'badprio-owner' });
  const agent = await createUser({ name: 'badprio-agent', role: 'agent' });
  const ownerToken = await loginAs(owner);
  const agentToken = await loginAs(agent);
  const created = await createRequestAs(ownerToken, { priority: 'medium' });

  // Act: el agente intenta fijar una prioridad fuera del contrato.
  const response = await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ priority: 'critical' });

  // Check 1: 400 tipado, no 500 (la restricción CHECK nunca debió saltar).
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'INVALID_PRIORITY');

  // Check 2 (prueba de que NO se tocó SQL): la solicitud sigue con su
  // prioridad original. Si el UPDATE se hubiera ejecutado, cambiaría.
  const recheck = await request(app)
    .get(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${ownerToken}`);
  assert.equal(recheck.status, 200);
  assert.equal(recheck.body.priority, 'medium');
});

test('a valid priority change still works after the fix', async () => {
  const owner = await createUser({ name: 'goodprio-owner' });
  const agent = await createUser({ name: 'goodprio-agent', role: 'agent' });
  const ownerToken = await loginAs(owner);
  const agentToken = await loginAs(agent);
  const created = await createRequestAs(ownerToken, { priority: 'low' });

  const response = await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ priority: 'high' });

  // Una "corrección" que rompe el caso válido no es una corrección.
  assert.equal(response.status, 200);
  assert.equal(response.body.priority, 'high');
});

// ------------------------------------------------- manejador central de errores

test('an unexpected error answers a generic 500 without internal details', async () => {
  const owner = await createUser({ name: 'boom' });
  const token = await loginAs(owner);

  // Saboteamos pool.query un instante (técnica del validador): cualquier
  // consulta lanza un error inesperado sin romper la base real.
  const realQuery = pool.query.bind(pool);
  pool.query = async () => { throw new Error('synthetic internal surprise'); };
  try {
    const response = await request(app)
      .get('/requests')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 500);
    assert.equal(response.body.error.code, 'INTERNAL_ERROR');
    assert.equal(response.body.error.message, 'An unexpected error occurred.');

    // El detalle interno (mensaje y stack) NO viaja en la respuesta.
    const raw = JSON.stringify(response.body);
    assert.ok(!raw.includes('synthetic internal surprise'), 'message leaked');
    assert.ok(!raw.includes('node_modules'), 'stack leaked');
  } finally {
    pool.query = realQuery;
  }
});

test('every error body shares the same shape: error.code, error.message, requestId', async () => {
  const owner = await createUser({ name: 'shape' });
  const token = await loginAs(owner);

  const response = await request(app)
    .get('/requests/999999999')
    .set('Authorization', `Bearer ${token}`);

  // El contrato de OPS-703: los tres campos existen y son strings, y el
  // requestId del body coincide con el header X-Request-Id de la respuesta.
  assert.equal(response.status, 404);
  assert.equal(typeof response.body.error.code, 'string');
  assert.equal(typeof response.body.error.message, 'string');
  assert.equal(typeof response.body.requestId, 'string');
  assert.equal(response.body.requestId, response.headers['x-request-id']);
});