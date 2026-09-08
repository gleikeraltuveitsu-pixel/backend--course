// ============================================================================
// STARTER NOTE — Stations 2, 3 and 4 live here.
//
// Contracts to honor (see docs/http-contract.md and your auth-contract.md):
//
//   register(body) -> { id, email, role: 'requester', createdAt }
//     * allowlist: only email and password may arrive. Any server-controlled
//       field present in the body (role, id, createdAt, updatedAt, createdBy,
//       passwordHash) -> AppError('contract', 'SERVER_CONTROLLED_FIELD', ...).
//       Reject explicitly — never ignore silently.
//     * email: required, basic format, normalize (trim + lowercase) BEFORE
//       storing -> AppError('contract', 'INVALID_EMAIL', ...) otherwise.
//     * password: string of 15..128 characters (Unicode and spaces allowed,
//       no arbitrary composition rules) -> AppError('contract',
//       'INVALID_PASSWORD', ...) otherwise. NEVER log it.
//     * duplicate email -> AppError('domain', 'ACCOUNT_CANNOT_BE_CREATED',
//       'The account cannot be created with the supplied information.')
//       — generic on purpose: do not confirm that the email exists.
//       (pg raises error.code '23505' on a unique violation.)
//     * store ONLY the hash produced by hashPassword — never the password.
//
//   login(body) -> { accessToken, tokenType: 'Bearer', expiresIn: <seconds> }
//     * EVERY failure (unknown email, wrong password, anything else) answers
//       the SAME AppError('auth', 'INVALID_CREDENTIALS',
//       'Email or password is incorrect.') — identical bytes, no clues.
//     * verify with verifyPassword against the stored hash.
//
//   getCurrentUser(actor) -> { id, email, role }
//     * actor comes from req.auth (station 5). Never return password
//       material of any kind.
// ============================================================================
import { AppError } from '../../app-error.js';
import {
  hashPassword,
  verifyPassword,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH
} from './password.js';
import { issueToken, verifyToken, TOKEN_TTL_SECONDS } from './token.js';
import { findByEmail, findById, insertUser } from '../users/users.store.js';
import { mapUserRow } from '../users/user.mapper.js';

// Fields the server controls at registration; the client may never send them.
const SERVER_CONTROLLED_USER_FIELDS = ['role', 'id', 'createdAt', 'updatedAt', 'createdBy', 'passwordHash'];

function assertNoServerControlledFields(body) {
  for (const field of SERVER_CONTROLLED_USER_FIELDS) {
    if (body[field] !== undefined) {
      throw new AppError('contract', 'SERVER_CONTROLLED_FIELD',
        `The field "${field}" is controlled by the server and cannot be set by the client.`);
    }
  }
}

export async function register(body) {
  const input = body ?? {};

  assertNoServerControlledFields(input);

  const { email, password } = input;

  if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    throw new AppError('contract', 'INVALID_EMAIL', 'A valid email is required.');
  }

  if (typeof password !== 'string'
    || password.length < PASSWORD_MIN_LENGTH
    || password.length > PASSWORD_MAX_LENGTH) {
    throw new AppError('contract', 'INVALID_PASSWORD',
      `The password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const passwordHash = await hashPassword(password);

  try {
    const row = await insertUser({ email: normalizedEmail, passwordHash });
    return mapUserRow(row);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('domain', 'ACCOUNT_CANNOT_BE_CREATED',
        'The account cannot be created with the supplied information.');
    }
    throw error;
  }
}

export async function login(body) {
  const { email, password } = body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError('auth', 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError('auth', 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw new AppError('auth', 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  const accessToken = await issueToken(user);
  return { accessToken, tokenType: 'Bearer', expiresIn: TOKEN_TTL_SECONDS };
}

export async function getCurrentUser(actor) {
  const user = await findById(actor.userId);
  if (!user) {
    throw new AppError('auth', 'INVALID_TOKEN', 'The token no longer references a valid account.');
  }
  return mapUserRow(user);
}
