// Script de reproducción de incidentes. Ejecuta los tres incidentes
// reportados contra TU código en ejecución e imprime expected vs actual —
// nada más. Nunca modifica código, nunca imprime tokens y se puede repetir
// cuantas veces haga falta: cada petición que envía es rechazada por el
// servidor (o debería serlo), así que no deja datos atrás.
//
// Usalo en dos momentos:
//   antes de corregir  -> cada incidente debería imprimir REPRODUCED
//   después de corregir -> cada incidente debería imprimir RESOLVED
import 'dotenv/config';
import app from '../src/app.js';
import { pool } from '../src/database/pool.js';

// Identidades del seed de la clase 06 (datos demo, seguros de mantener en
// el repo — solo existen dentro de tu propia base del taller).
const ANA = { email: 'ana.requester.seed@example.test', password: 'ana clave del taller 06' };
const MARIA = { email: 'maria.agent.seed@example.test', password: 'maria clave del taller 06' };

// La aplicación escribe logs JSON estructurados a la consola. Durante este
// script se recolectan aparte para que el reporte sea legible — y la sonda
// de OPS-703 pueda MOSTRAR la línea exacta que coincide con la respuesta.
const print = console.log.bind(console);
const printError = console.error.bind(console);
const appLogs = [];
console.log = (entry) => appLogs.push(String(entry));
console.error = (entry) => appLogs.push(String(entry));

const server = app.listen(0);
const port = server.address().port;
const BASE = `http://127.0.0.1:${port}`;

async function api(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json = null;
  try { json = await response.json(); } catch { /* non-JSON body */ }
  return { status: response.status, body: json, headers: response.headers };
}

async function login(user) {
  const response = await api('POST', '/auth/login', { body: user });
  if (response.status !== 200) {
    throw new Error(`Could not log in as ${user.email} (${response.status}). Run: npm run db:seed`);
  }
  return response.body.accessToken;
}

function describe(result) {
  const code = result.body?.error?.code ?? result.body?.status ?? '(no code)';
  return `${result.status} ${code}`;
}

function verdict(label, expected, ok) {
  print(`[${label.padEnd(7)}] ${ok ? 'RESOLVED' : 'REPRODUCED'}`);
  return ok;
}

let resolved = 0;
try {
  print('INCIDENT REPRODUCTION\n');

  const anaToken = await login(ANA);
  const mariaToken = await login(MARIA);

  // ------------------------------------------------------------- INC-701
  const inc701 = await api('GET', '/requests/not-a-number', { token: anaToken });
  print('[INC-701] Invalid request id');
  print('Request:  GET /requests/not-a-number  (as ana)');
  print('Expected: 400 INVALID_REQUEST_ID');
  print(`Actual:   ${describe(inc701)}`);
  const ok701 = inc701.status === 400 && inc701.body?.error?.code === 'INVALID_REQUEST_ID';
  if (verdict('INC-701', '400', ok701)) resolved += 1;
  print('');

  // ------------------------------------------------------------- INC-702
  // Una solicitud del seed en estado `open`: una prioridad inválida debe
  // rechazarse antes de que corra CUALQUIER regla de dominio, así que el
  // estado de la solicitud no importa para la corrección — pero elegir una
  // abierta mantiene la reproducción independiente de otras reglas.
  const open = await api('GET', '/requests?status=open', { token: mariaToken });
  const target = Array.isArray(open.body) ? open.body[0] : null;
  print('[INC-702] Invalid priority');
  if (!target) {
    print('Could not find an open seed request. Run: npm run db:seed');
  } else {
    const inc702 = await api('PATCH', `/requests/${target.id}`, {
      token: mariaToken,
      body: { priority: 'critical' }
    });
    print(`Request:  PATCH /requests/${target.id} { "priority": "critical" }  (as maria)`);
    print('Expected: 400 INVALID_PRIORITY');
    print(`Actual:   ${describe(inc702)}`);
    const ok702 = inc702.status === 400 && inc702.body?.error?.code === 'INVALID_PRIORITY';
    if (verdict('INC-702', '400', ok702)) resolved += 1;
  }
  print('');

  // ------------------------------------------------------------- OPS-703
  // Sonda de trazabilidad: toda respuesta de error debe llevar el header
  // X-Request-Id y el mismo id en el body, para que soporte pueda hallar el
  // log de esa petición.
  const probe = await api('GET', '/requests/999999999', { token: anaToken });
  const headerId = probe.headers.get('x-request-id');
  const bodyId = probe.body?.requestId;
  print('[OPS-703] Untraceable errors');
  print('Request:  GET /requests/999999999  (as ana)');
  print('Expected: X-Request-Id header, and the same requestId inside the error body');
  print(`Actual:   header ${headerId ? 'present' : 'missing'}, body requestId ${bodyId ? 'present' : 'missing'}`);
  const ok703 = Boolean(headerId) && Boolean(bodyId) && headerId === bodyId;
  if (ok703) {
    const logLine = appLogs.find((entry) => headerId && entry.includes(headerId));
    if (logLine) print(`Log line: ${logLine}`);
  }
  if (verdict('OPS-703', 'traceable', ok703)) resolved += 1;
  print('');

  print(resolved === 3
    ? 'All incidents are RESOLVED. Run npm test and the validator next.'
    : `${3 - resolved} incident(s) still REPRODUCED. Investigate before changing code at random.`);
} catch (error) {
  printError(`Reproduction failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  server.close();
  await pool.end();
}

