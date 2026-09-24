// Capa HTTP del módulo auth: extrae el body, invoca el servicio y devuelve
// resultados. No tiene SQL, criptografía ni detalles de tokens.
//
// Desde OPS-703 no hay try/catch: un error lanzado aquí se propaga hasta el
// manejador central de errores, que produce TODAS las respuestas de error
// con el mismo formato (error.code, error.message, requestId).
import express from 'express';
import { register, login, getCurrentUser } from './auth.service.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = express.Router();

// Registro: crea la cuenta; 201 con el usuario mapeado.
router.post('/register', async (req, res) => {
  res.status(201).json(await register(req.body));
});

// Login: intercambia credenciales por un token Bearer.
router.post('/login', async (req, res) => {
  res.status(200).json(await login(req.body));
});

// /auth/me está protegido: responde "¿quién cree el servidor que soy?".
router.get('/me', authenticate, async (req, res) => {
  res.status(200).json(await getCurrentUser(req.auth));
});

export default router;