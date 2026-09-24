// OPS-703 · Middleware de log de peticiones.
//
// Objetivo: UNA línea JSON por petición terminada, sea cual sea el
// resultado. El módulo de logger (src/logging/logger.js) ya formatea y
// escribe las líneas; este middleware solo decide CUÁNDO registrar y QUÉ
// campos incluir.
//
// Un log seguro usa una ALLOWLIST (lista blanca) explícita de campos, nunca
// el objeto completo de la petición: así el header Authorization, el token,
// las contraseñas y el body jamás llegan a una línea de log por accidente.
import { logger } from '../logging/logger.js';

export function requestLogger(req, res, next) {
  // Hora de inicio: hrtime es tiempo monótono (no depende del reloj del
  // sistema), perfecto para medir duraciones.
  const startedAt = process.hrtime.bigint();

  // 'finish' se dispara cuando la respuesta ya fue enviada al cliente. Es
  // el ÚNICO momento en que el status code final se conoce con certeza.
  res.on('finish', () => {
    // Duración en milisegundos: la diferencia de bigints se convierte a
    // número y se divide por 1e6 (nanosegundos -> milisegundos).
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

    // ALLOWLIST explícita. Cada campo se decide aquí, nunca se copia el
    // objeto req ni sus headers.
    const fields = {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs)
    };

    // El id del actor solo se registra si la autenticación ya corrió y lo
    // dejó en req.auth. No es un secreto, pero tampoco un dato obligatorio.
    if (req.auth) {
      fields.userId = req.auth.userId;
    }

    // El manejador de errores deja aquí el código del error (p. ej.
    // INTERNAL_ERROR) para que la línea de log lo incluya.
    if (res.locals.errorCode) {
      fields.errorCode = res.locals.errorCode;
    }

    // Status >= 500 es un fallo para el equipo: nivel error. El resto es
    // info. El evento distingue los dos casos de una ojeada.
    const ok = res.statusCode >= 500;
    if (ok) {
      logger.error('request_failed', fields);
    } else {
      logger.info('request_completed', fields);
    }
  });

  // NUNCA retrasar la petición esperando el log: se registra asíncronamente
  // en 'finish' y aquí solo se continúa la cadena.
  next();
}