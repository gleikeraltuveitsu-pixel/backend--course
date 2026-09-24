// Imprime un valor criptográficamente aleatorio apto para JWT_SECRET.
// Pega la salida en tu .env local — nunca lo subas, nunca lo compartas.
import { randomBytes } from 'node:crypto';

console.log(randomBytes(32).toString('base64url'));
console.log('\nPaste this value as JWT_SECRET in your local .env file.');
console.log('Do not commit it. Do not share it. Do not paste it into an AI chat.');
