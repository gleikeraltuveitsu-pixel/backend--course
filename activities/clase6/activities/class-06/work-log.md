# Class 06 work log

## Environment

**What did I configure?**
`.env` a partir de `.env.example`: `DATABASE_URL` copiada del diálogo Connect
de mi proyecto en Supabase, `JWT_SECRET` generado con `npm run generate:secret`
(no compartido ni commitado) y `PORT=3000`. El `.env` queda fuera de Git gracias
a `.gitignore`.

**Which command confirmed that it worked?**
`npm run class-06:doctor` pasó a "Environment ready" (base alcanzable, migraciones
y seed detectados). Luego `npm run validate:class-06` terminó en **PASSED 12/12**
y `npm test` en verde (21/21) .

## Request flow

- **Where does the request enter?** En `src/server.js` → `src/app.js`, que monta
  CORS, `express.json()`, `/auth` y `/requests`.
- **Where is authentication checked?** En `src/middleware/authenticate.js`: se
  monta antes de todo el router de `/requests` y de `/auth/me`. Verifica el JWT
  y construye `req.auth` (`{ userId, role }`); si falta o es inválido responde 401.
- **Where is authorization checked?** En `src/modules/requests/request.policy.js`
  (funciones puras `canViewRequest`, `canViewHistory`, `canEditContent`, etc.) y
  en el servicio `requests.service.js`, que las aplica dentro de cada operación.
  Los agentes ven todo; los requesters solo lo propio, y lo ajeno responde 404
  idéntico a lo inexistente (no se revela existencia).
- **Where is PostgreSQL accessed?** En `src/database/pool.js` (pool compartido) y
  `src/database/transaction.js` (unidad de trabajo por `PATCH` y creación). Las
  consultas viven en `src/modules/requests/requests.store.js` y `users.store.js`,
  siempre parametrizadas.

## Bug fixed

- **What was happening?** `GET /requests?status=closed` (colección válida sin
  coincidencias) respondía `404 REQUEST_NOT_FOUND`.
- **What should happen?** Una colección vacía NO es un recurso ausente: debe
  responder `200` con `[]`. El `404` queda para un recurso individual inexistente
  (o que no debe revelarse).
- **Which file did I modify?** `src/modules/requests/requests.service.js`: en
  `listRequests` se eliminó el `throw` cuando `rows.length === 0`; la lista se
  devuelve siempre mapeada, y vacía es `[]`.
- **Which test protects the behavior?** En `test/requests.test.js`:
  "BUG-106 regression: a valid filter with no matches returns 200 and []",
  que crea un requester sin solicitudes, pide `?status=closed` y exige
  `200` + `[]`.

## Feature implemented

- **What does GET /requests/:id/history do?** Devuelve el historial de eventos de
  una solicitud: el nacimiento (`status_changed` con `fromStatus: null`), los
  cambios de estado y los cambios de prioridad. Cada evento expone solo sus
  propios campos (`fromStatus/toStatus` o `fromPriority/toPriority`, `createdAt`,
  `id`); nunca `changedBy`, passwords, hashes ni tokens.
- **Who can use it?** El dueño de la solicitud y los agentes. Un requester ajeno
  recibe el mismo `404 REQUEST_NOT_FOUND` que una solicitud inexistente (misma
  política de visibilidad, no se inventó una regla nueva). Requiere token.
- **How is the result ordered?** De más antigua a más reciente por `createdAt`,
  con `id` como desempate estable cuando dos eventos comparten timestamp
  (`ORDER BY created_at, id` en `findHistory`).

## Test explained

Elijo "history events are ordered oldest first" (`test/requests.test.js`).

- **What data does it prepare?** Un requester dueño, un agente, y una solicitud
  creada por el dueño; el agente le hace dos `PATCH` (estado `in_progress` y luego
  prioridad `high`), dejando tres eventos: nacimiento + estado + prioridad.
- **What action does it perform?** `GET /requests/:id/history` con el token del
  dueño.
- **What does it check?** Que la lista de `createdAt` está cronológicamente
  ordenada (es igual a su versión ordenada) y que el primer evento es el
  nacimiento (`fromStatus === null`).
- **Which rule does it protect?** La regla 7 del ticket FEATURE-206: orden
  cronológico estable, con el evento de nacimiento primero.

## AI assistance

- **What did AI help me understand?** El mapa del repositorio: dónde entra la
  petición, dónde se monta `authenticate`, y cómo el servicio coordina policy +
  máquina de estados + unidad de trabajo con el store.
- **What code did it help produce?** La función `getHistory` en el servicio, la
  ruta `GET /:id/history` (registrada antes de `GET /:id` para que "history" no
  se intercepte como `:id`), los tests de regresión/feature y el arreglo del
  script `npm test` para que descubra la suite en Windows.
- **What did I verify myself?** Que `npm test` corriera 21/21 en verde y que
  `npm run validate:class-06` terminara en **PASSED 12/12** con limpieza
  exitosa; también que `GET /requests/999999999/history` y el historial ajeno
  respondieran exactamente el mismo 404.
- **What suggestion was incorrect or incomplete?** La IA asumió que el script
  `npm test` provisto descubriría la suite tal cual; en Windows (cmd.exe) el glob
  con comillas simples encontraba **0 tests**. La corrección real fue quitar las
  comillas del glob en `package.json` — un detalle de entorno que el propio
  `npm test` reveló, no la IA.

## Remaining doubt

El desempate estable por `id` asume que un `id` mayor siempre significa un evento
posterior. Con `CURRENT_TIMESTAMP` a nivel transacción, dos eventos del mismo
`PATCH` comparten timestamp y el orden queda garantizado por `id`, pero no tengo
claro si eso es un contrato documentado de PostgreSQL o una propiedad que hay que
probar más explícitamente (p. ej. con `clock_timestamp()` si llegáramos a
necesitar granularidad por evento dentro de una misma transacción).