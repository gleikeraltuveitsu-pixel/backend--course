# Class 07 incident report

Cada sección se completó MIENTRAS se investigaba, separando hechos de
interpretaciones: las hipótesis marcan "cómo se comprobaría"; la evidencia
solo registra lo observado. Nunca se pegaron cadenas de conexión ni tokens.

## Baseline

`npm run class-07:doctor` -> 7/7 PASS ("Environment ready for incident
response") tras reconstruir el esquema (el ledger de migraciones estaba
"registrado" sin tablas reales: vacié las tablas del taller, corrí
`npm run db:migrate` y `npm run db:seed`). Suite inicial: 20 pass / 17
todo, tal como describe el brief.

## Incident 701

### Report

Soporte dice que "some request identifiers return an internal server error":
un integrador construye enlaces hacia solicitudes y algunos devuelven 500,
"a veces funciona y a veces no".

### Reproduction

- Request: `GET /requests/not-a-number`
- Actor: ana (requester seed)
- Body: ninguno
- Comando: `npm run incidents:reproduce`

### Expected result

`400 Bad Request` con `INVALID_REQUEST_ID` ("Request id must be a positive
integer.") y `requestId` en el body.

### Actual result

`500 INTERNAL_ERROR`. El terminal mostraba el error técnico de PostgreSQL
(el driver recibía el string `not-a-number` en un `WHERE id = $1` sobre
bigint).

### Hypotheses

1. El route hace `Number(req.params.id)` y un valor no numérico llega
   al SQL antes de validar el formato. **Comprobación:** seguir el valor
   desde `req.params.id` hasta `requests.store.findById`; `not-a-number`
   nunca debería entrar a una consulta.
2. El driver pg lanza un error de parseo que ninguna capa traduce a un
   contrato HTTP. **Comprobación:** mirar la respuesta + log; el 500
   genérico confirma que el error escapó sin tipificar.

### Evidence

- Reproducción: `[INC-701] ... Actual: 500 INTERNAL_ERROR`.
- En `requests.routes.js` (antes del fix):
  `Number(req.params.id)` convertía `not-a-number` en `NaN` y pasaba `NaN`
  como parámetro; la consulta `findById` lo usaba directo contra bigint.
- `parseInt('12abc') === 12`, por lo que un `parseInt` ingenioso tampoco
  sería válido como validación (el brief lo señala explícitamente).

### Confirmed cause

Ausencia de validación del identificador en la capa HTTP: un formato
inválido se convertía a `NaN` y viajaba hasta PostgreSQL, que respondía con
un error de tipo no tipado (500) en lugar de un 400 de contrato.

### Correction

`src/modules/requests/requests.routes.js`: helper `parseRequestId` que
exige un entero positivo por completo (`/^[1-9]\d*$/`) y dentro del rango
seguro (`Number.isSafeInteger`). Se aplica en `GET /:id`, `GET /:id/history`
y `PATCH /:id` ANTES de llamar al servicio: el SQL nunca se ejecuta con
formato inválido; el 404 de un id bien formado que no existe no cambia.

### Regression test

`test/errors.test.js`: "an alphabetic id answers 400 INVALID_REQUEST_ID",
"decimal, zero and negative ids are rejected the same way" y "a well-formed
id that matches nothing still answers 404". Sin el fix, los primeros dos
fallaban (500); con el fix, pasan y el 404 se mantiene.

## Incident 702

### Report

Soporte: "updating some priorities produces an internal server error". Un
agente intentó marcar una solicitud como 'critical' y recibió un 500 sin
explicación.

### Reproduction

- Request: `PATCH /requests/1` con `{ "priority": "critical" }`
- Actor: maria (agent seed)
- Comando: `npm run incidents:reproduce`

### Expected result

`400 Bad Request` con `INVALID_PRIORITY` ("Priority must be low, medium or
high.") y `requestId`.

### Actual result

`500 INTERNAL_ERROR`. El terminal mostraba la infracción de la restricción
CHECK de PostgreSQL (`requests_priority_check`) rechazando `critical`.

### Hypotheses

1. La aplicación valida status y title pero NO priority: el valor inválido
   llega al UPDATE y la restricción de base lo rechaza tarde. **Comprobación:**
   revisar el PATCH en `requests.service.js`; ahí falta la validación.
2. La restricción CHECK no existe y "algo más" falla. **Comprobación:**
   `npm run db:migrate` (SKIPPED) y `\d requests` muestran el CHECK intacto
   (004_add_constraints_and_indexes.sql).

### Evidence

- Reproducción: `[INC-702] ... Actual: 500 INTERNAL_ERROR`.
- `requests.service.patchRequest` validaba `changes.status` (con
  `isValidStatus`) pero no `changes.priority`; la transacción
  (`withTransaction`) ejecutaba el UPDATE y recién ahí PostgreSQL
  rechazaba el valor.
- El CHECK existe tal cual: `requests_priority_check CHECK (priority IN
  ('low','medium','high'))` (migración 004).

### Confirmed cause

La restricción de PostgreSQL actuó porque la aplicación no validó: la
validación de prioridad era una responsabilidad que vivía SOLO en la base.
Corregir el 500 eliminando la restricción no sería una corrección: sería
eliminar la segunda defensa.

### Correction

`src/modules/requests/requests.service.js`: helper `assertValidPriority`
que lanza `INVALID_PRIORITY` (categoría `contract` -> 400) antes de
cualquier SQL. Se llama en `createRequest` (prioridad con default `medium`)
y en `patchRequest` (para `changes.priority`). La restricción CHECK de
PostgreSQL se conserva intacta como segunda defensa.

### Regression test

`test/errors.test.js`: "an invalid priority answers 400 INVALID_PRIORITY
before touching SQL" (además verifica que la solicitud NO cambió) y "a
valid priority change still works after the fix". Sin el fix, ambos
fallaban; con el fix, pasan.

## Error flow

- Where is the error created?
  En el módulo que detecta el problema: `AppError` (tipado) en servicios y
  middleware; errores no tipados (driver, JSON inválido) los lanza el
  código/a Express.
- How does it reach the error middleware?
  Express 5 reenvía él solo los errores lanzados y promesas rechazadas.
  Las rutas ya NO tienen try/catch ni `respondError`: todo termina en
  `errorHandler`, registrado al final de app.js. Si la respuesta ya empezó,
  delega con `next(error)`.
- What is returned to the client?
  Siempre el mismo formato JSON `{ error: { code, message }, requestId }`
  con el status según la categoría (400/401/403/404/409, 400 INVALID_JSON,
  503 DATABASE_UNAVAILABLE) o un 500 genérico `INTERNAL_ERROR`.
- What remains only in the server log?
  El detalle interno: name, message y stack del error inesperado, o
  code/message de la indisponibilidad de base. Nunca el mensaje, el stack,
  SQL, tablas, rutas ni cabeceras.

## Request ID

- Middleware `requestId` genera `req_<uuid>` (o acepta un header del cliente
  si cumple `/^[A-Za-z0-9._-]{1,64}$/`) y lo pone en `req.requestId` y en el
  header `X-Request-Id`.
- Lo probé con `npm run incidents:reproduce` y con `test/traceability.test.js`:
  la respuesta trae el header, el body del error trae el mismo id, y al
  capturar la consola durante una petición existe una línea JSON con el
  MISMO `requestId` — esa línea es el nexo que usará soporte.
- `test/traceability.test.js` también demuestra que un header hostil (300
  caracteres) se reemplaza y que el token/`Bearer `/`authorization` jamás
  aparecen en los logs.

## AI assistance

- Me ayudó a separar síntoma (500) de causa (validación ausente antes de
  SQL) y a ubicar los puntos exactos de corrección mínima.
- Propuso validar el formato COMPLETO del id (regex + rango seguro) y no
  `parseInt`, porque '12abc' se convertiría en 12.
- Verifiqué cada hipótesis ejecutando el validador, los tests y
  `incidents:reproduce` antes y después del cambio.
- Propuso inicialmente conservar el try/catch en las rutas; resultó
  incorrecto frente al objetivo de centralización (OPS-703), así que lo
  descarté en favor del errorHandler único.

## Remaining doubt

- Por qué Express 5 decide cuándo reenviar un cuerpo no parseado hacia el
  middleware de error exacto y cómo afecta a middlewares intermedios
  (requestLogger) en peticiones con JSON inválido.