// Emisión y verificación de tokens. Este módulo conoce JWTs y nada más:
// sin SQL, sin requests, sin Express.
import 'dotenv/config';
import { SignJWT, jwtVerify } from 'jose';

// Falla temprano: una API que firma tokens con un secreto vacío es peor
// que una API que se niega a arrancar.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required.');
}

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);
const ALGORITHM = 'HS256';
const ISSUER = process.env.JWT_ISSUER ?? 'backend-course-api';
const AUDIENCE = process.env.JWT_AUDIENCE ?? 'backend-course-client';

export const TOKEN_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS ?? 3600);

// El payload lleva identidad y rol — nada sensible. Un JWT está FIRMADO, no
// cifrado: quien lo tenga puede LEER esos claims.
export async function issueToken(user) {
  const issuedAt = Math.floor(Date.now() / 1000);
  return await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
    .setSubject(user.id)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + TOKEN_TTL_SECONDS)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .sign(SECRET_KEY);
}

// Decodificar permite leer; verificar permite confiar. jwtVerify comprueba
// la firma, el algoritmo, iss, aud y exp — todos, cada vez.
export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, SECRET_KEY, {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE
  });
  return payload;
}