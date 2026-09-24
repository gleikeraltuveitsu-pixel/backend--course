// Suite de trazabilidad (OPS-703).
//
// Verifica que una petición, su respuesta y su línea de log comparten el
// MISMO requestId, y —la parte más difícil— que los logs contienen lo que
// deben y NO contienen lo que no deben. Para inspeccionar las líneas se
// intercepta console.log/console.error durante una petición real y se
// analiza cada línea como JSON.
//
// El request logger escribe en el evento 'finish' de la respuesta: tras la
// petición hay que esperar unos milisegundos antes de restaurar la consola.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import request from 'supertest';
import app from '../src/app.js';
import { createUser } from './helpers/test-data.js';
import { loginAs } from './helpers/test-auth.js';
import { cleanupCreatedData, closePool } from './helpers/cleanup.js';

after(async () => {
  await cleanupCreatedData();
  await closePool();
});

// Helper: ejecuta fn mientras captura todas las líneas escritas a la
// consola; espera un instante para que el logger en 'finish' alcance a
// escribir su línea antes de restaurar.
async function captureLogs(fn) {
  const lines = [];
  const realLog = console.log;
  const realError = console.error;
  console.log = (line) => lines.push(String(line));
  console.error = (line) => lines.push(String(line));
  try {
    const result = await fn();
    await sleep(60);
    return { result, lines };
  } finally {
    console.log = realLog;
    console.error = realError;
  }
}

// Convierte cada línea capturada en objeto JSON (descartando las que no
// sean JSON válido, p. ej. el mensaje de arranque de otros módulos).
function jsonLines(lines) {
  return lines
    .map((line) => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean);
}

test('every response carries an X-Request-Id header', async () => {
  const response = await request(app).get('/health');

  // Cualquier ruta debe responder con el header, sin excepción.
  assert.ok(response.headers['x-request-id'], 'X-Request-Id header missing');
});

test('an error body carries the same requestId as the header', async () => {
  const owner = await createUser({ name: 'trace-id' });
  const token = await loginAs(owner);

  const response = await request(app)
    .get('/requests/999999999')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.body.requestId, response.headers['x-request-id']);
});

test('a well-formed client X-Request-Id is kept', async () => {
  // El cliente puede proponer un id razonable: se respeta.
  const response = await request(app)
    .get('/health')
    .set('X-Request-Id', 'frontend-trace-42');

  assert.equal(response.headers['x-request-id'], 'frontend-trace-42');
});

test('a suspicious client X-Request-Id is replaced, never trusted', async () => {
  // Header con 300 caracteres de basura: se descarta y se genera otro.
  const junk = 'junk'.repeat(75);
  const response = await request(app)
    .get('/health')
    .set('X-Request-Id', junk);

  const header = response.headers['x-request-id'];
  assert.ok(header, 'no request id generated');
  assert.notEqual(header, junk, 'server trusted a hostile header');
  assert.ok(header.startsWith('req_'), 'server-generated id expected');
});

test('the log line of a request carries the same requestId as the response', async () => {
  const owner = await createUser({ name: 'trace-log' });
  const token = await loginAs(owner);

  const { result, lines } = await captureLogs(() =>
    request(app)
      .get('/requests/999999999')
      .set('Authorization', `Bearer ${token}`));

  const headerId = result.headers['x-request-id'];
  assert.ok(headerId, 'response has no X-Request-Id header');

  // Al menos una línea JSON lleva el requestId de la respuesta: esa línea
  // es la "unión" que soporte usará para rastrear el incidente.
  const match = jsonLines(lines).find((entry) => entry.requestId === headerId);
  assert.ok(match, `no log line carries ${headerId}`);
  assert.equal(match.status, 404);
});

test('the Authorization header and the token never reach the log', async () => {
  const owner = await createUser({ name: 'no-leak' });
  const token = await loginAs(owner);

  const { lines } = await captureLogs(async () => {
    await request(app)
      .get('/requests')
      .set('Authorization', `Bearer ${token}`);
    await request(app)
      .get('/requests/999999999')
      .set('Authorization', `Bearer ${token}`);
  });

  // Un token filtrado es una credencial viva: ningún log puede contenerlo
  // ni el esquema de autenticación ('Bearer ') ni el nombre del header.
  const leaky = lines.filter((line) =>
    line.includes(token) || /Bearer /.test(line) || /authorization/i.test(line));
  assert.deepEqual(leaky, [], 'credentials reached the log');
});