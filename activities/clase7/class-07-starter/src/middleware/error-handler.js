// OPS-703 · Manejador central de errores.
//
// Objetivo: UN solo lugar donde un error se convierte en una respuesta
// HTTP, reemplazando los try/catch repetidos dentro de cada ruta. Express 5
// reenvía aquí, por sí solo, los errores lanzados y las promesas
// rechazadas — una vez que este middleware está registrado en la posición
// correcta en app.js (SIEMPRE después de las rutas, porque solo ve lo que
// ocurrió ANTES en el archivo).
//
// Express reconoce un middleware de error porque declara EXACTAMENTE cuatro
// parámetros (error, req, res, next). No quites ninguno, aunque no lo uses.
//
// Contrato de respuestas: un error nunca daña la respuesta — todo error
// responde con { error: { code, message }, requestId }. El requestId
// permite a soporte relacionar la respuesta con la línea de log.
import { AppError } from '../app-error.js';
import { logger } from '../logging/logger.js';

// Traducción de la categoría tipada a código HTTP. La misma tabla vivía
// antes en src/http/respond-error.js; este middleware la reemplaza.
const CATEGORY_STATUS = {
  contract: 400,   // el cliente rompió el contrato de la petición
  auth: 401,       // no hay identidad confiable
  forbidden: 403,  // actor identificado, operación no permitida
  resource: 404,   // el recurso no existe (o no debe revelarse)
  domain: 409      // conflicto con el estado actual del recurso
};

// Códigos de error que indican que la base de datos no está disponible.
// Cualquier otro código es un error inesperado (500).
const INFRASTRUCTURE_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', '57P03'];

// Construye el body de error común para todo el contrato.
function errorBody(code, message, requestId) {
  return { error: { code, message }, requestId };
}

export function errorHandler(error, req, res, next) {
  // Si la respuesta ya empezó a enviarse no podemos cambiarla: delegamos.
  // Romper una respuesta a medias es peor que dejar que Express la cierre.
  if (res.headersSent) {
    return next(error);
  }

  // El campo requestId viene del middleware request-id, que corre al inicio
  // de la cadena. Cada rama responde con el mismo id de la petición.
  const requestId = req.requestId;

  // 1) Error de aplicación tipado (AppError): el contrato promete su code y
  //    message tal cual. La categoría decide el status HTTP.
  if (error instanceof AppError) {
    res.locals.errorCode = error.code;
    return res.status(CATEGORY_STATUS[error.category] ?? 500)
      .json(errorBody(error.code, error.message, requestId));
  }

  // 2) Body que no es JSON válido: Express lanza un error con este type.
  //    Es un problema del consumidor (400), no un fallo interno.
  if (error.type === 'entity.parse.failed') {
    res.locals.errorCode = 'INVALID_JSON';
    return res.status(400).json(errorBody(
      'INVALID_JSON',
      'The request body must be valid JSON.',
      requestId
    ));
  }

  // 3) La base de datos no está disponible (o se cerró la conexión):
  //    respuesta controlada 503. Se registra el detalle interno filtrado —
  //    la cadena de conexión JAMÁS va al log ni a la respuesta.
  if (INFRASTRUCTURE_CODES.includes(error.code) || /Connection terminated/i.test(error.message ?? '')) {
    res.locals.errorCode = 'DATABASE_UNAVAILABLE';
    logger.error('database_unavailable', {
      requestId,
      code: error.code ?? 'unknown',
      message: error.message ?? 'database unreachable'
    });
    return res.status(503).json(errorBody(
      'DATABASE_UNAVAILABLE',
      'The service cannot access its data store.',
      requestId
    ));
  }

  // 4) Cualquier otra cosa es INESPERADO: el cliente recibe un 500 genérico
  //    (nunca el mensaje, el stack, el SQL, nombres de tablas o rutas) y el
  //    DETALLE real queda SOLO en el log del servidor.
  res.locals.errorCode = 'INTERNAL_ERROR';
  logger.error('unhandled_error', {
    requestId,
    name: error.name ?? 'Error',
    message: error.message ?? 'unknown error',
    stack: error.stack ?? ''
  });
  return res.status(500).json(errorBody(
    'INTERNAL_ERROR',
    'An unexpected error occurred.',
    requestId
  ));
}