// server.js
// Punto de entrada: solo levanta el servidor. No conoce rutas ni módulos.

import app from './app.js';

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Request API is running on http://localhost:${PORT}`);
});
