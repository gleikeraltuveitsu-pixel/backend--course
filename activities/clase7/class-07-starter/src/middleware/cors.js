// Política CORS para la entrega del frontend (05A). Un origen explícito del
// entorno — nunca "*": esta API responde a los navegadores que conocemos,
// con los headers de credenciales que elegimos.
import 'dotenv/config';

const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN;

export function corsPolicy(req, res, next) {
  const origin = req.headers.origin;

  // Solo se reconoce el origen configurado; el resto no recibe los headers
  // CORS y su navegador bloqueará la respuesta (ese es el control).
  if (ALLOWED_ORIGIN && origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  }

  // Los preflights terminan aquí: piden permiso, no datos.
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
}