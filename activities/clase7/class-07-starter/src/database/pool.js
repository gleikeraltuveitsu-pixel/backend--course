// Único pool compartido de todo el proceso. Cada módulo que necesite la base
// importa ESTE pool; nadie crea uno propio.
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

// Falla temprano con un mensaje accionable en lugar de un error críptico en
// la primera consulta minutos después.
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Los clientes inactivos pueden emitir 'error' (por ejemplo cuando el
// servidor cierra la conexión o el proyecto se pausa). Sin este handler ese
// evento reventaría todo el proceso; con él, la API sigue viva y la
// siguiente consulta falla de forma controlada (traducida a 503 por el
// manejador de errores).
pool.on("error", (error) => {
  console.error("[pool] idle client error:", error.code ?? error.message);
});