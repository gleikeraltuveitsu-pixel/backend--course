// Capa de coordinación de la autenticación: reglas de registro, verificación
// de credenciales y emisión de tokens. Sin SQL (users.store), sin criptografía
// (password.js, token.js), sin códigos de estado HTTP (categorías de AppError).
import { AppError } from '../../app-error.js';
import {
  hashPassword,
  verifyPassword,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH
} from './password.js';
import { issueToken, TOKEN_TTL_SECONDS } from './token.js';
import { findByEmail, findById, insertUser } from '../users/users.store.js';
import { mapUserRow } from '../users/user.mapper.js';

// Campos controlados por el servidor. Enviarlos se rechaza explícitamente —
// un "role": "agent" ignorado en silencio le enseñaría al cliente que
// intentarlo no cuesta nada.
const SERVER_CONTROLLED_FIELDS = ['role', 'id', 'createdAt', 'updatedAt', 'createdBy', 'passwordHash'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// El mismo error genérico para todo fallo de login: un atacante no debe
// averiguar si el email existe.
function invalidCredentials() {
  return new AppError('auth', 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
}

// Se verifica contra él cuando el email no existe, para que ambos caminos de
// login hagan trabajo comparable y el tiempo revele menos. Se calcula una vez,
// perezosamente.
let fallbackHashPromise = null;
function fallbackHash() {
  fallbackHashPromise ??= hashPassword('workshop-timing-fallback-not-a-real-password');
  return fallbackHashPromise;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function assertValidPassword(password) {
  if (typeof password !== 'string') {
    throw new AppError('contract', 'INVALID_PASSWORD', 'A password is required.');
  }
  // Puntos de código, no unidades UTF-16: las frases de contraseña pueden
  // usar cualquier alfabeto, espacios incluidos. La longitud es la única
  // regla — sin cuotas arbitrarias de símbolos.
  const length = [...password].length;
  if (length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) {
    throw new AppError('contract', 'INVALID_PASSWORD',
      `The password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`);
  }
}

export async function register(body) {
  const input = body ?? {};

  for (const field of SERVER_CONTROLLED_FIELDS) {
    if (field in input) {
      throw new AppError('contract', 'SERVER_CONTROLLED_FIELD',
        field === 'role'
          ? 'Role is controlled by the server.'
          : `The field "${field}" is controlled by the server.`);
    }
  }

  if (typeof input.email !== 'string' || !EMAIL_PATTERN.test(input.email.trim())) {
    throw new AppError('contract', 'INVALID_EMAIL', 'A valid email is required.');
  }
  assertValidPassword(input.password);

  const email = normalizeEmail(input.email);

  // 409 genérico: la respuesta no confirma que el email esté tomado.
  const duplicate = () => new AppError('domain', 'ACCOUNT_CANNOT_BE_CREATED',
    'The account cannot be created with the supplied information.');

  if (await findByEmail(email)) {
    throw duplicate();
  }

  const passwordHash = await hashPassword(input.password);
  try {
    const row = await insertUser({ email, passwordHash });
    return mapUserRow(row);
  } catch (error) {
    // 23505 = unique_violation: alguien registró el mismo email entre nuestra
    // comprobación y nuestro insert. La misma respuesta genérica.
    if (error.code === '23505') throw duplicate();
    throw error;
  }
}

export async function login(body) {
  const { email, password } = body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw invalidCredentials();
  }

  const user = await findByEmail(normalizeEmail(email));
  if (!user) {
    // Igual hacer trabajo comparable y luego fallar con el mismo error.
    await verifyPassword(password, await fallbackHash());
    throw invalidCredentials();
  }

  const passwordMatches = await verifyPassword(password, user.password_hash);
  if (!passwordMatches) {
    throw invalidCredentials();
  }

  return {
    accessToken: await issueToken({ id: user.id, role: user.role }),
    tokenType: 'Bearer',
    expiresIn: TOKEN_TTL_SECONDS
  };
}

export async function getCurrentUser(actor) {
  const row = await findById(actor.userId);
  if (!row) {
    // Token válido para una cuenta que ya no existe: sin identidad.
    throw new AppError('auth', 'INVALID_TOKEN', 'The token is invalid or has expired.');
  }
  const user = mapUserRow(row);
  return { id: user.id, email: user.email, role: user.role };
}