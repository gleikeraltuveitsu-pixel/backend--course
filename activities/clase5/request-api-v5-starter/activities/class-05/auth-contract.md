# Contrato de autenticación — Request API v5

Documenta ANTES de implementar. Para cada endpoint: método, ruta, ¿público o
protegido?, body permitido, respuesta de éxito (código + forma) y CADA error
(código HTTP + `error.code`).

## POST /auth/register

- **Público**: Sí.
- **Body permitido**: solo `email` y `password`. Cualquier otro campo o un
  campo controlado por el servidor → `400 SERVER_CONTROLLED_FIELD`.
- **Éxito** `201`:
  ```json
  { "id": "<uuid>", "email": "<normalizado>", "role": "requester", "createdAt": "<iso>" }
  ```
- **Errores**:
  - `400 INVALID_EMAIL` — email ausente o sin formato válido.
  - `400 INVALID_PASSWORD` — password ausente o fuera de 15..128 caracteres.
  - `400 SERVER_CONTROLLED_FIELD` — el body trae un campo que el servidor controla.
  - `409 ACCOUNT_CANNOT_BE_CREATED` — el email ya existe (mensaje genérico,
    no confirma que la cuenta exista).

## POST /auth/login

- **Público**: Sí.
- **Body permitido**: solo `email` y `password`.
- **Éxito** `200`:
  ```json
  { "accessToken": "<jwt>", "tokenType": "Bearer", "expiresIn": 3600 }
  ```
- **Errores**:
  - `401 INVALID_CREDENTIALS` — ÚNICA respuesta para email desconocido o
    password incorrecta. Bytes idénticos en ambos casos (anti-enumeración).

## GET /auth/me

- **Público**: No. Requiere `Authorization: Bearer <token>`.
- **Body**: no lleva body.
- **Éxito** `200`:
  ```json
  { "id": "<uuid>", "email": "<email>", "role": "requester" }
  ```
- **Errores**:
  - `401 AUTHENTICATION_REQUIRED` — falta el header, o no es `Bearer`, o el
    Bearer está vacío.
  - `401 INVALID_TOKEN` — token alterado, vencido, issuer/audience incorrectos
    o firmado por otra clave. Una sola respuesta para todo.

## Semántica de errores

- `401` cuando NO existe identidad de confianza: falta/mal formado el token,
  o login con credenciales inválidas. El problema es «quién eres», no «qué
  puedes hacer».
- `403` cuando SÍ hay identidad pero la operación no está autorizada: un
  `requester` cambiando prioridad o estado, un `agent` editando contenido, un
  body mixto con un campo prohibido (rechazado completo). Actor identificado,
  acción prohibida.
- `404` cuando el recurso no existe O no debe revelarse su existencia: una
  solicitud ajena responde el MISMO 404 (mismo `code`) que una inexistente.
  Así no se filtra si el recurso existe.
- `409` cuando la operación choca con el estado actual del recurso: email
  duplicado, transición de estado inválida, solicitud en estado terminal.
