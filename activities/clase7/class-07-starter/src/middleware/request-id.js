// OPS-703 · Middleware de Request ID.
//
// Objetivo: cada petición recibe UN identificador que la acompaña — dentro
// de los logs, en el body de cada error y de vuelta al cliente en el header
// X-Request-Id de la respuesta. Identifica la PETICIÓN, no al usuario:
// no es un secreto, pero jamás se usa el JWT como identificador.
//
// Un header X-Request-Id enviado por el cliente solo se acepta si tiene un
// formato razonable (alfanumérico, punto, guion, guion bajo, máx. 64
// caracteres); cualquier otra cosa se reemplaza por uno generado por el
// servidor. Un header es entrada del cliente: nunca se confía tal cual.
import { randomUUID } from 'node:crypto';

// Formato "aburrido" y predecible que aceptamos como id venido del cliente.
// No permite espacios, ni caracteres raros, ni valores que podrían
// inyectarse en un log como texto arbitrario.
const CLIENT_REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export function requestId(req, res, next) {
  // 1. Lee el header opcional que manda el cliente (si existe).
  const incoming = req.headers['x-request-id'];

  // 2. Solo se conserva si cumple el formato. Si no, se sustituye por uno
  //    generado: `req_` + UUID v4. Un UUID es barato de generar y su
  //    unicidad no depende de ningún estado compartido.
  const id = typeof incoming === 'string' && CLIENT_REQUEST_ID_PATTERN.test(incoming)
    ? incoming
    : `req_${randomUUID()}`;

  // 3. Lo guardamos en la petición para que el resto de middleware, las
  //    rutas y el manejador de errores puedan usarlo.
  req.requestId = id;

  // 4. Lo enviamos de vuelta en la respuesta. El cliente podrá usarlo para
  //    reportar el incidente y soporte podrá buscarlo en los logs.
  res.set('X-Request-Id', id);

  // 5. Continúa la cadena de middleware.
  next();
}