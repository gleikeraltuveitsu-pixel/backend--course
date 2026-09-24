// Helper de hash de contraseñas. Este módulo conoce criptografía y nada
// más: sin Express, sin SQL, sin HTTP. Jamás loguea sus entradas.
//
// Formato almacenado (versionable y autodescriptivo):
//   scrypt$1$N=16384,r=8,p=1$<salt base64url>$<derived key base64url>
// La verificación lee los parámetros del valor almacenado, así que los
// hashes viejos siguen funcionando si los defaults cambian en el futuro.
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const FORMAT_VERSION = 1;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

export async function hashPassword(password) {
  // Una salt aleatoria nueva por contraseña: dos contraseñas iguales jamás
  // comparten hash.
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await scrypt(password, salt, KEY_BYTES, SCRYPT_PARAMS);
  const params = `N=${SCRYPT_PARAMS.N},r=${SCRYPT_PARAMS.r},p=${SCRYPT_PARAMS.p}`;
  return [
    'scrypt',
    FORMAT_VERSION,
    params,
    salt.toString('base64url'),
    derivedKey.toString('base64url')
  ].join('$');
}

export async function verifyPassword(password, storedHash) {
  // Un valor almacenado malformado significa "no coincide", nunca un crash.
  const parts = typeof storedHash === 'string' ? storedHash.split('$') : [];
  if (parts.length !== 5 || parts[0] !== 'scrypt') return false;

  const [, , paramsPart, saltPart, keyPart] = parts;
  let salt;
  let expectedKey;
  let params;
  try {
    salt = Buffer.from(saltPart, 'base64url');
    expectedKey = Buffer.from(keyPart, 'base64url');
    params = Object.fromEntries(paramsPart.split(',').map((pair) => {
      const [name, value] = pair.split('=');
      return [name, Number(value)];
    }));
  } catch {
    return false;
  }
  if (!salt.length || !expectedKey.length || !params.N || !params.r || !params.p) return false;

  const derivedKey = await scrypt(password, salt, expectedKey.length, params);
  // Comparación en tiempo constante: la respuesta tarda lo mismo si difiere
  // el primer byte o el último.
  return timingSafeEqual(derivedKey, expectedKey);
}