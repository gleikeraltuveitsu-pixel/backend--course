// OPS-703 · Endpoints operativos.
//
// Dos preguntas DISTINTAS:
//   GET /health  "¿El proceso está vivo?"      -> NUNCA toca PostgreSQL
//   GET /ready   "¿Puede hacer trabajo útil?"  -> comprueba PostgreSQL barato
//
// Un proceso puede estar vivo y aun así no atender tráfico (base caída):
// health sirve a los orquestadores para saber si reiniciar, ready para
// saber si enrutar tráfico. Por eso /ready responde 503 (disponible no)
// cuando la base falla, y no 500: el fallo de disponibilidad es un estado
// ESPERADO y controlado, no un bug.
import express from 'express';
import { pool } from '../database/pool.js';

// createHealthRouter acepta la verificación de base INYECTADA: así los
// tests entregan una función que falla sin tocar credenciales reales.
// Por defecto se usa la consulta más barata posible contra el pool compartido.
export function createHealthRouter({ checkDatabase } = {}) {
  const router = express.Router();

  // GET /health  -> 200 { "status": "ok" }. No hace ninguna consulta, por
  // eso responde aunque la base esté caída: "el proceso respira".
  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // GET /ready -> comprueba la base. La respuesta NO revela host, puerto,
  // usuario, SQL ni stack: solo si la base está disponible o no.
  router.get('/ready', async (req, res) => {
    try {
      const check = checkDatabase ?? (() => pool.query('SELECT 1'));
      await check();
      res.status(200).json({ status: 'ready', database: 'available' });
    } catch {
      res.status(503).json({ status: 'not_ready', database: 'unavailable' });
    }
  });

  return router;
}

export const healthRoutes = createHealthRouter();