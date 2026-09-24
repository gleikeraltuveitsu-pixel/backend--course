// OPS-703 · Middleware de "no encontrado".
//
// Objetivo: cuando NINGUNA ruta coincide, responder con el mismo contrato
// JSON de error que el resto de la API, en lugar de la página HTML por
// defecto de Express.
//
// Vive en app.js DESPUÉS de todas las rutas y ANTES del manejador de
// errores: así solo se ejecuta cuando nada más respondió, y su error tipado
// es traducido por el manejador central de errores.
//
// El mensaje es genérico a propósito: devolver al cliente el path que
// escribió solo confirmaría rutas inexistentes y sería un vector para
// reflejar contenido arbitrario.
import { AppError } from '../app-error.js';

export function notFound(req, res, next) {
  next(new AppError('resource', 'ROUTE_NOT_FOUND', 'The requested route does not exist.'));
}