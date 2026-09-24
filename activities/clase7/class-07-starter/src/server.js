// Punto de entrada: este archivo solo arranca el proceso. No conoce rutas.
import app from './app.js';

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`Request API is running on http://localhost:${PORT}`);
});