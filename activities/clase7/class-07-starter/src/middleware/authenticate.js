// Middleware de autenticación: establece QUIÉN es el actor y nada más.
// Nunca decide qué puede hacer el actor — eso es autorización y vive en las
// políticas del módulo (request.policy.js).
//
// Los errores se reenvían con next(error): así el manejador central de
// errores (error-handler.js) produce TODAS las respuestas de error con el
// mismo formato, incluyendo el requestId. No se traduce aquí a HTTP.
import { AppError } from '../app-error.js';
import { verifyToken } from '../modules/auth/token.js';

const ROLES = ['requester', 'agent'];

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    // El esquema debe ser exactamente Bearer: "Basic ..." o un token a
    // secas no es una identidad confiable.
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new AppError('auth', 'AUTHENTICATION_REQUIRED',
        'This operation requires a Bearer token.');
    }
    const token = header.slice('Bearer '.length).trim();
    if (token === '') {
      throw new AppError('auth', 'AUTHENTICATION_REQUIRED',
        'This operation requires a Bearer token.');
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      // Alterado, caducado, issuer/audience/firma incorrectos: misma
      // respuesta. La respuesta jamás explica qué comprobación falló.
      throw new AppError('auth', 'INVALID_TOKEN',
        'The token is invalid or has expired.');
    }

    if (typeof payload.sub !== 'string' || !ROLES.includes(payload.role)) {
      throw new AppError('auth', 'INVALID_TOKEN',
        'The token is invalid or has expired.');
    }

    // La ÚNICA fuente confiable de identidad para el resto de la petición.
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch (error) {
    // Reenvía al manejador central: allí se traduce a 401/400/500.
    next(error);
  }
}