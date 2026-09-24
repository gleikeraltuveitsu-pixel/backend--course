// Capa HTTP del módulo requests: extrae path, query, body y el actor
// autenticado, invoca la operación y devuelve resultados como respuestas
// HTTP. No contiene SQL ni reglas de dominio. El router asume que app.js lo
// montó detrás de `authenticate`, así que req.auth siempre está presente.
//
// INC-701: el identificador del path se valida ANTES de llamar al servicio
// y, por tanto, ANTES de cualquier SQL. Un formato inválido es problema del
// consumidor (400), no un fallo interno (500).
//
// Desde OPS-703 no hay try/catch: un error no manejado se propaga por sí
// solo hasta el error-handler central, que traduce a la respuesta correcta.

import express from 'express';
import {
  listRequests,
  getRequest,
  createRequest,
  patchRequest,
  getHistory
} from './requests.service.js';
import { AppError } from '../../app-error.js';

const router = express.Router();

// INC-701 · Valida el identificador del path.
// Un identificador válido es un entero POSITIVO en formato completo:
//   - solo dígitos (`/^[1-9]\d*$/`) descarta texto, decimales, signos, cero
//     y `12abc` — un parseInt ingenuo aceptaría '12abc' como 12.
//   - `Number.isSafeInteger` descarta números fuera del rango seguro de
//     JavaScript (evita perder precisión al pasarlo al SQL como bigint).
// Si el formato es inválido se responde 400 y la consulta SQL NUNCA se
// ejecuta; si es válido pero no existe, sigue siendo 404 (no cambia).
function parseRequestId(raw) {
  const value = String(raw);
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new AppError('contract', 'INVALID_REQUEST_ID',
      'Request id must be a positive integer.');
  }
  return Number(value);
}

// Lista con filtros opcionales (status, priority) sobre la colección.
router.get('/', async (req, res) => {
  const { status, priority } = req.query;
  res.status(200).json(await listRequests(req.auth, { status, priority }));
});

// Una solicitud por su identificador.
router.get('/:id', async (req, res) => {
  res.status(200).json(await getRequest(req.auth, parseRequestId(req.params.id)));
});

// Historial de cambios de una solicitud (id validado igual que GET /:id).
router.get('/:id/history', async (req, res) => {
  res.status(200).json(await getHistory(req.auth, parseRequestId(req.params.id)));
});

// Creación: el body se valida en el servicio (reglas de dominio).
router.post('/', async (req, res) => {
  res.status(201).json(await createRequest(req.auth, req.body));
});

// Actualización parcial (id validado antes de cualquier consulta).
router.patch('/:id', async (req, res) => {
  res.status(200).json(await patchRequest(req.auth, parseRequestId(req.params.id), req.body));
});

export default router;