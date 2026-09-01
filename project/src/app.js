// app.js
// Configuración de la aplicación: middlewares y montaje de módulos.
// No abre ningún puerto; eso lo hace server.js.

import express from 'express';
import requestsRoutes from './modules/requests/requests.routes.js';

const app = express();

// Parsea los cuerpos JSON entrantes en req.body.
app.use(express.json());

// Cada ruta del módulo requests se sirve bajo /requests.
app.use('/requests', requestsRoutes);

export default app;
