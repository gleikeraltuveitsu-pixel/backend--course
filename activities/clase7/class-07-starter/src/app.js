// Configuración de la aplicación: middlewares y montaje de módulos. Este
// archivo NO abre ningún puerto (eso lo hace server.js).
//
// OPS-703: el orden del montaje es la semántica de la aplicación. En
// Express, cada middleware "ve" solo lo que ocurrió ANTES en este archivo:
//   - requestId       da a TODA petición un identificador único antes de
//                     que cualquier cosa loguee o responda
//   - requestLogger   una línea JSON por petición terminada (escucha
//                     'finish' de la respuesta)
//   - healthRoutes    /health (vida) y /ready (disponibilidad), públicos
//   - notFound        responde 404 JSON si ninguna ruta coincidió
//   - errorHandler    UN lugar traduce errores a respuestas del contrato;
//                     DEBE ir al último para ver todo lo anterior
import express from 'express';
import { corsPolicy } from './middleware/cors.js';
import { requestId } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { authenticate } from './middleware/authenticate.js';
import { notFound } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRoutes } from './routes/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import requestsRoutes from './modules/requests/requests.routes.js';

const app = express();

// CORS primero: los preflights deben responderse antes que cualquier otra
// cosa. corsPolicy además corta los OPTIONS (204) sin seguir la cadena.
app.use(corsPolicy);

// El identificador de petición se asigna ANTES de parsear el body: así cada
// respuesta —incluidas las de body inválido— lleva su X-Request-Id.
app.use(requestId);

// El log de petición se suscribe también antes del parseo, para que toda
// petición terminada —sin importar cómo termine— deje su línea de log.
app.use(requestLogger);

// Parsea los bodies JSON entrantes y los deja en req.body. Si el JSON es
// inválido, Express lanza un error que el errorHandler traduce a 400.
app.use(express.json());

// /health y /ready son públicos: un orquestador debe poder preguntar sin
// token. Solo comprueban vida/disponibilidad, nunca exponen datos.
app.use(healthRoutes);

// /auth mezcla rutas públicas (register, login) y una protegida (/me), así
// que el módulo aplica `authenticate` internamente donde lo necesita.
app.use('/auth', authRoutes);

// Cada ruta de /requests necesita un actor confiable: authenticate corre
// primero y construye req.auth, o responde 401 y el router nunca ejecuta.
app.use('/requests', authenticate, requestsRoutes);

// Si llegamos aquí sin respuesta, ninguna ruta coincidió -> 404 del contrato.
app.use(notFound);

// El manejador de errores SIEMPRE al final: convierte en respuestas del
// contrato cualquier error que hayan lanzado los pasos anteriores.
app.use(errorHandler);

export default app;