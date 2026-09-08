# AI usage

Este archivo solo puede tener contenido DESPUÉS del checkpoint
`class-05-access-design` (matriz + contrato + amenazas completos).

## My design before AI

Diseñé la matriz de acceso (qué operación puede hacer cada rol), el contrato
de auth (métodos, rutas, bodies, respuestas y errores de register/login/me) y
los doce casos adversariales, todo en `activities/class-05/`. Con eso el
checkpoint `class-05-access-design` quedó en verde y el límite de «IA apagada»
se levantó.

## What I asked

Pedí que se implementaran las estaciones 2 a 7 sobre el starter v5: el store
y mapper de `users`, el `register` con allowlist y normalización, el
`login` y la firma/verificación de JWT con `jose`, el middleware
`authenticate`, la propiedad (`created_by`/`changed_by`) en el módulo de
solicitudes y las políticas de autorización de `request.policy.js`.

## What the AI proposed

Implementó cada una de las piezas siguiendo las notas del starter:
- `users.store.js` y `user.mapper.js` (con `password_hash` eliminado en el cruce).
- `auth.service.js`: allowlist de campos, `INVALID_EMAIL`/`INVALID_PASSWORD`,
  hash con `hashPassword`, duplicados como `409 ACCOUNT_CANNOT_BE_CREATED`,
  login con un único `401 INVALID_CREDENTIALS`.
- `token.js` con `SignJWT`/`jwtVerify` (HS256, iss, aud, iat, exp).
- `authenticate.js` con esquema Bearer estricto y `req.auth`.
- `requests.*` con autorización all-or-nothing, scope SQL por `created_by` y
  `404` para recursos ajenos.

## What I accepted

Todo lo anterior. Acepté también que la política se evaluara sobre la
representación HTTP (camelCase, `mapRequestRow`) y no sobre la fila SQL cruda
— fue la corrección que destrabó el check 10 del validador.

## What I rejected

Ninguna propuesta de diseño fue descartada; el código final es una iteración
de la propuesta inicial corregida contra el validador.

## Security mistakes I detected

- El `PATCH` mixto de campos: sin revisar toda la política antes de escribir,
  un requester habría podido cambiar prioridad «de contrabando».
- Pasar la fila SQL cruda a las políticas (bug real): `created_by` ≠
  `createdBy`, lo que hacía fallar la política de propiedad.
- Decodificar en lugar de verificar el token (frameworks: siempre `jwtVerify`).

## How I verified the implementation

Ejecutando el validador por estación (`setup`, `access-design`, `register`,
`password`, `login`, `authentication`, `ownership`, `authorization`) y la
boss battle integral `npm run validate:class-05` → `12/12 · CLASS 05 COMPLETED`.
También probé el arranque del servidor (node src/server.js).

## What I still do not understand

Cómo gestionar la revocación de tokens (HS256 sin lista negra) y si la firma
simétrica es suficiente para el alcance del taller frente a un atacante que
lograra el secreto. La promoción de agentes también queda fuera de la API.