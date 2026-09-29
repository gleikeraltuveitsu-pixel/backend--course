# course-progress-evidence-01-07

Paquete de evidencia para el diagnóstico acumulativo 7 en 1.
Generado automáticamente — completa las secciones marcadas con [COMPLETAR] antes de ejecutar el prompt.

## Metadata

* studentId: [COMPLETAR — tu identificador de estudiante, sin datos personales extra]
* promptVersion: ITSU-CHECKPOINT-01-07-1.0
* rubricVersion: BACKEND-01-07-R1
* generatedAt: 2026-09-29T14:24:05.091Z (EXECUTED_NOW)
* repoRoot: backend--course
* commit: 57f05dc (EXECUTED_NOW)
* repositorioRemoto: https://github.com/gleikeraltuveitsu-pixel/backend--course.git (EXECUTED_NOW) — verifica que sea TU repositorio antes de continuar
* modeloUtilizado: [COMPLETAR después de ejecutar el prompt]

### Contexto de git (informativo, EXECUTED_NOW)

El curso se trabaja en computadoras compartidas: el historial local puede
estar incompleto o pertenecer a otra sesión sin que falte trabajo real.
Este contexto NO es evidencia requerida — la evidencia son los archivos
del repositorio remoto del estudiante y sus respuestas. La ausencia de
commits aquí no debe interpretarse como evidencia faltante.

```text
57f05dc Clase 7: diagnostico de incidentes y errores observables - taller completado 12/12
9cc7bc9 Clase 6: BUG-106 y FEATURE-206 - taller completado 12/12
ca36145 trabajo 6
d1971d0 trabajo 6
6d76b71 Clase 5: autenticacion JWT, propiedad y permisos - taller completado 12/12
2e3ae5a Clase 04: Ejercicios - PostgreSQL, integridad e historia
e9bfe38 Clase 3: implementacion Entrega 03 - modulo requests, PATCH con maquina de estados y filtros
6ec9fa8 Clase 3: documentación y modelo de recursos
```

## Evidencia por clase

Los archivos listados existen en el repositorio (FOUND). Un archivo de salida guardado, como validation-evidence.txt, es TEXTO: demuestra que se guardó, no que se ejecutó (NOT_VERIFIED como ejecución).

### Clase 01 — Fundamentos de backend

* NOT_FOUND: ningún artefacto esperado de esta clase

### Clase 02 — HTTP y contratos

* FOUND: activities/clase2/actividad-2-api-full/recursos/docs/http-contract.md
* FOUND: activities/clase3/http-contract.md
* FOUND: activities/clase3/recursos/request-api-v3-solucion/docs/http-contract.md
* FOUND: activities/clase3/recursos/request-api-v3-starter/docs/http-contract.md
* FOUND: activities/clase4/recursos/request-api-v4-starter/docs/http-contract.md
* FOUND: activities/clase4/request-api-v4/docs/http-contract.md
* FOUND: activities/clase5/request-api-v5-starter/docs/http-contract.md

Extracto de activities/clase2/actividad-2-api-full/recursos/docs/http-contract.md (redactado automáticamente):

```text
# Contrato HTTP — Request API Full

> **Contrato escrito antes de la implementación.** Este documento define la promesa
> que hace la API. El código es la manera de cumplirla.

## Recurso

Una **solicitud de mantenimiento** (`request`) representa un problema reportado en
las instalaciones de una institución educativa (proyector roto, silla dañada, Wi-Fi
caído, etc.). Cada solicitud tiene un identificador, un título descriptivo, una
descripción detallada, un estado de seguimiento y un nivel de prioridad.

### Forma del recurso

| Campo         | Tipo    | Obligatorio | Quién lo asigna | Notas |
| ------------- | ------- | ----------- | --------------- | ----- |
| `id`          | number  | Sí          | Servidor        | Autoincremental, empieza en 1 |
| `title`       | string  | Sí          | Cliente         | No puede estar vacío |
| `description` | string  | Sí          | Cliente         | Descripción del problema |
| `status`      | string  | Sí          | Servidor        | Siempre `"open"` al crear |
| `priority`    | string  | Sí          | Cliente         | `"low"`, `"medium"` o `"high"` |

---

## Endpoint 1 — Listar solicitudes

| Elemento              | Valor |
| --------------------- | ----- |
| Método                | `GET` |
| Ruta                  | `/requests` |
[... 119 líneas más]
```

### Clase 03 — Recursos, estado y reglas

* FOUND: activities/clase3/resource-model.md
* FOUND: activities/clase3/test-matrix.md
* FOUND: activities/clase3/transition-map.md

Extracto de activities/clase3/resource-model.md (redactado automáticamente):

```text
# Resource model — Request

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> No toda palabra del requerimiento se convierte en ruta o campo: parte del trabajo es
> decidir qué entra, qué espera y qué se pregunta.

## Nombre del recurso

**Request** (solicitud de soporte). Representa una incidencia reportada por un usuario y el
recorrido que sigue hasta que se resuelve o se cancela. En una frase: "una petición de ayuda
que alguien registró y que el equipo atiende".

## Propiedades

| Propiedad     | Tipo   | Ejemplo                                   |
| ------------- | ------ | ----------------------------------------- |
| `id`          | number | `1`                                       |
| `title`       | string | `"Projector does not turn on"`            |
| `description` | string | `"The projector in room 204 shows no image."` |
| `status`      | string | `"open"`                                  |
| `priority`    | string | `"high"`                                  |
| `createdAt`   | string | `"2026-08-27T12:00:00.000Z"`              |
| `updatedAt`   | string | `"2026-08-27T14:30:00.000Z"`              |

## Campos requeridos

* `title` — sin título no puede existir una solicitud (invariante 2).
* `id` — siempre existe y lo asigna el servidor (invariante 1).

La solicitud puede existir sin `description` (toma `""`) y sin `priority` (toma `medium`),
[... 49 líneas más]
```

### Clase 04 — PostgreSQL y persistencia

* FOUND: activities/clase4/recursos/request-api-v4-starter/database/migrations/001_create_requests.sql
* FOUND: activities/clase4/recursos/request-api-v4-starter/database/migrations/002_create_request_status_history.sql
* FOUND: activities/clase4/request-api-v4/database/migrations/001_create_requests.sql
* FOUND: activities/clase4/request-api-v4/database/migrations/002_create_request_status_history.sql
* FOUND: activities/clase5/request-api-v5-starter/database/migrations/001_create_requests.sql
* FOUND: activities/clase5/request-api-v5-starter/database/migrations/002_create_request_status_history.sql
* FOUND: activities/clase5/request-api-v5-starter/database/migrations/003_create_users.sql
* FOUND: activities/clase5/request-api-v5-starter/database/migrations/004_add_request_ownership.sql
* FOUND: activities/clase5/request-api-v5-starter/database/migrations/005_add_history_actor.sql
* FOUND: activities/clase6/database/migrations/001_create_users.sql
* FOUND: activities/clase6/database/migrations/002_create_requests.sql
* FOUND: activities/clase6/database/migrations/003_create_request_history.sql
* … 13 archivo(s) más con el mismo patrón

### Clase 05 — Autenticación y autorización

* FOUND: activities/clase5/request-api-v5-starter/activities/class-05/README.md
* FOUND: activities/clase5/request-api-v5-starter/activities/class-05/access-matrix.md
* FOUND: activities/clase5/request-api-v5-starter/activities/class-05/ai-usage.md
* FOUND: activities/clase5/request-api-v5-starter/activities/class-05/auth-contract.md
* FOUND: activities/clase5/request-api-v5-starter/activities/class-05/decision-log.md
* FOUND: activities/clase5/request-api-v5-starter/activities/class-05/reflection.md
* FOUND: activities/clase5/request-api-v5-starter/activities/class-05/threat-cases.md
* FOUND: activities/clase5/request-api-v5-starter/activities/class-05/validation-evidence.md — salida guardada, NOT_VERIFIED como ejecución
* FOUND: activities/clase5/request-api-v5-starter/scripts/validate-class-05.js

Extracto de activities/clase5/request-api-v5-starter/activities/class-05/auth-contract.md (redactado automáticamente):

```text
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
[... 33 líneas más]
```

Extracto de activities/clase5/request-api-v5-starter/activities/class-05/validation-evidence.md (redactado automáticamente):

```text
# Evidencia de validación — Clase 05

Pega aquí la salida del validador al cerrar cada estación (SIN secretos: el
validador ya evita imprimirlos, no agregues capturas de tu `.env`).

## stage setup

```
CLASS 05 VALIDATION — stage: setup

✓ Database connection
✓ Previous schema
✓ Authentication migrations
✓ Existing request endpoints
✓ No committed secrets

RESULT: 5/5
```

## stage access-design

```
CLASS 05 VALIDATION — stage: access-design

[01/03] access-matrix.md completed ....... PASS
[02/03] auth-contract.md completed ....... PASS
[03/03] threat-cases.md completed ........ PASS

RESULT: 3/3

[... 90 líneas más]
```

### Clase 06 — Onboarding y pruebas

* FOUND: activities/clase6/activities/class-06/README.md
* FOUND: activities/clase6/activities/class-06/validation-evidence.txt — salida guardada, NOT_VERIFIED como ejecución
* FOUND: activities/clase6/activities/class-06/work-log.md
* FOUND: activities/clase6/scripts/validate-class-06.js
* FOUND: activities/clase6/tickets/BUG-106.md
* FOUND: activities/clase6/tickets/FEATURE-206.md
* FOUND: activities/clase7/class-07-starter/scripts/validate-class-06.js
* FOUND: activities/clase8/class-08-starter/scripts/validate-class-06.js

Extracto de activities/clase6/activities/class-06/work-log.md (redactado automáticamente):

```text
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
[... 73 líneas más]
```

Extracto de activities/clase6/activities/class-06/validation-evidence.txt (redactado automáticamente):

```text
CLASS 06 FINAL VALIDATION

Environment
[01/12] Database is reachable .............. PASS
[02/12] Migrations are complete ............ PASS
[03/12] Seed data is available ............. PASS

Regression
[04/12] Valid empty collection returns 200 .. PASS
[05/12] Empty collection returns [] ........ PASS

History endpoint
[06/12] Authentication is required ......... PASS
[07/12] Owner can read history ............. PASS
[08/12] Stranger cannot read history ....... PASS
[09/12] Agent can read history ............. PASS
[10/12] Missing request returns 404 ........ PASS
[11/12] Events are ordered correctly ....... PASS
[12/12] Sensitive information is hidden .... PASS

Cleanup
Temporary validation data removed successfully.

FINAL RESULT: PASSED
```

### Clase 07 — Diagnóstico y errores

* FOUND: activities/clase7/class-07-starter/.gitignore
* FOUND: activities/clase7/class-07-starter/README.md
* FOUND: activities/clase7/class-07-starter/activities/class-07/README.md
* FOUND: activities/clase7/class-07-starter/activities/class-07/incident-report.md
* FOUND: activities/clase7/class-07-starter/activities/class-07/validation-evidence.txt — salida guardada, NOT_VERIFIED como ejecución
* FOUND: activities/clase7/class-07-starter/database/migrations/001_create_users.sql
* FOUND: activities/clase7/class-07-starter/database/migrations/002_create_requests.sql
* FOUND: activities/clase7/class-07-starter/database/migrations/003_create_request_history.sql
* FOUND: activities/clase7/class-07-starter/database/migrations/004_add_constraints_and_indexes.sql
* FOUND: activities/clase7/class-07-starter/incidents/INC-701-invalid-request-id.md
* FOUND: activities/clase7/class-07-starter/incidents/INC-702-invalid-priority.md
* FOUND: activities/clase7/class-07-starter/incidents/OPS-703-untraceable-errors.md
* … 52 archivo(s) más con el mismo patrón

Extracto de activities/clase7/class-07-starter/activities/class-07/incident-report.md (redactado automáticamente):

```text
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
[... 165 líneas más]
```

Extracto de activities/clase7/class-07-starter/activities/class-07/validation-evidence.txt (redactado automáticamente):

```text

> class-07-request-api@7.0.0 validate:class-07
> node scripts/validate-class-07.js

CLASS 07 INCIDENT VALIDATION

Baseline
[01/12] Existing contract preserved .......... PASS

Input and errors
[02/12] Invalid id returns 400 ............... PASS
[03/12] Invalid priority returns 400 ......... PASS
[04/12] Unknown request returns 404 .......... PASS
[05/12] Invalid transition returns 409 ....... PASS
[06/12] Unexpected errors return 500 ......... PASS
[07/12] Internal details remain hidden ....... PASS

Traceability
[08/12] Response contains request id ......... PASS
[09/12] Log contains the same request id ..... PASS
[10/12] Authorization header is not logged ... PASS

Operation
[11/12] Health endpoint responds ............. PASS
[12/12] Readiness checks PostgreSQL .......... PASS

Cleanup
Temporary validation data removed successfully.

FINAL RESULT: PASSED
[... 1 líneas más]
```

## Estado previo a la clase 8

* Validadores disponibles (clases 1-7): activities/clase5/request-api-v5-starter/scripts/validate-class-05.js, activities/clase6/scripts/validate-class-06.js, activities/clase7/class-07-starter/scripts/validate-class-06.js, activities/clase7/class-07-starter/scripts/validate-class-07.js, activities/clase8/class-08-starter/scripts/validate-class-06.js, activities/clase8/class-08-starter/scripts/validate-class-07.js
* Carpetas de pruebas: activities/clase6/test, activities/clase7/class-07-starter/test, activities/clase8/class-08-starter/test
* Último commit antes del taller: 57f05dc

## Cuestionario diagnóstico (responde aquí, 3-6 líneas cada una)

Sé específico: cita archivos o rutas concretas de TU proyecto cuando puedas. La extensión no suma.

### Pregunta clase 01

Describe qué ocurre desde que una petición llega al backend hasta que sale una respuesta y explica por qué el servidor debe permanecer activo.

Respuesta: [COMPLETAR]

### Pregunta clase 02

Elige un endpoint del proyecto y explica cómo método, ruta, body y status forman su contrato.

Respuesta: [COMPLETAR]

### Pregunta clase 03

Explica, usando una solicitud del proyecto, la diferencia entre representación, dato inválido y transición incompatible con el estado actual.

Respuesta: [COMPLETAR]

### Pregunta clase 04

Explica la diferencia entre migración, seed y transacción, e indica dónde aparece cada concepto en el proyecto.

Respuesta: [COMPLETAR]

### Pregunta clase 05

Explica la diferencia entre autenticación y autorización y por qué un JWT decodificado todavía debe verificarse.

Respuesta: [COMPLETAR]

### Pregunta clase 06

Elige una prueba del proyecto, identifica preparación, acción y comprobación, y explica qué regresión protege.

Respuesta: [COMPLETAR]

### Pregunta clase 07

Describe un fallo investigado distinguiendo síntoma, hipótesis y causa; luego indica qué señal correspondería a health o readiness.

Respuesta: [COMPLETAR]

---
Nota de seguridad: este paquete fue generado excluyendo .env y redactando
posibles secretos. Revisa una vez más antes de pegarlo en un modelo:
si ves una credencial real, reemplázala por [REDACTED] y avisa al docente.
