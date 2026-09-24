// Fábrica de datos de prueba. Cada corrida usa identificadores ÚNICOS (un
// runId aleatorio en cada email) para que las pruebas nunca choquen con el
// seed, con otras pruebas ni con una corrida anterior que haya crasheado.
// Todo id creado se registra para la limpieza.
import crypto from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import { pool } from '../../src/database/pool.js';

// Registros de lo creado: los consume helpers/cleanup.js al terminar.
export const createdUserIds = [];
export const createdRequestIds = [];

// Identificador único por corrida del runner de tests.
const runId = crypto.randomUUID().slice(0, 8);
let counter = 0;

export function uniqueEmail(name) {
  counter += 1;
  return `class07-test-${runId}-${name}-${counter}@example.test`;
}

export async function createUser({ name = 'user', role = 'requester' } = {}) {
  const email = uniqueEmail(name);
  const password = `una frase de prueba para ${name}`;
  const response = await request(app)
    .post('/auth/register')
    .send({ email, password });
  if (response.status !== 201) {
    throw new Error(`Could not register test user (${response.status}).`);
  }
  const id = response.body.id;
  createdUserIds.push(id);

  // El registro siempre crea 'requester' (esa regla tiene sus propias
  // pruebas). Las pruebas que necesitan un agente promueven a su PROPIO
  // usuario sintético directamente.
  if (role === 'agent') {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['agent', id]);
  }
  return { id, email, password, role };
}

export async function createRequestAs(token, fields = {}) {
  const response = await request(app)
    .post('/requests')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: `class07-test-${runId} request`, ...fields });
  if (response.status !== 201) {
    throw new Error(`Could not create test request (${response.status}).`);
  }
  createdRequestIds.push(response.body.id);
  return response.body;
}