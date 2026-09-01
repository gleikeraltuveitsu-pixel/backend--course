# HTTP contract — Request API v3

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> Para cada endpoint: intención, path, query, body, respuesta exitosa, errores y un ejemplo.
> El ejemplo obliga a decidir los detalles que la tabla esconde.

## Formato de error (común a toda la API)

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "A request cannot move from open to closed."
  }
}
```

Todo cuerpo de error tiene la misma forma: un objeto `error` con un `code` (lo lee un
programa, se compara con `if`) y un `message` (lo lee una persona). Códigos de error
definidos:

| Código                        | Cuándo                        |
| ----------------------------- | ----------------------------- |
| `VALIDATION_ERROR`            | Falta un campo requerido, body sin modificables, JSON inválido |
| `UNKNOWN_STATUS`              | Filtro o body con un `status` fuera del conjunto permitido |
| `UNKNOWN_PRIORITY`            | Filtro o body con una `priority` fuera del conjunto permitido |
| `NOT_FOUND`                   | La solicitud no existe        |
| `INVALID_STATUS_TRANSITION`   | Se intentó una transición prohibida |
| `REQUEST_IN_TERMINAL_STATUS`  | Se intentó modificar una solicitud terminal |

---

## `GET /requests`

* **Intención**: listar la colección de solicitudes, opcionalmente filtrada.
* **Path**: `GET /requests`
* **Query**:
  * `status` — filtra por estado; valores válidos: `open`, `in_progress`, `resolved`,
    `closed`, `cancelled`.
  * `priority` — filtra por prioridad; valores válidos: `low`, `medium`, `high`.
  * Ambos filtros son combinables (`?status=open&priority=high`).
* **Body**: ninguno.
* **Respuesta exitosa**: `200` con un array de solicitudes. Sin coincidencias: `200` con
  `[]` (un subconjunto vacío es información válida y completa, no un error).
* **Errores**: `400` si `status` o `priority` toman un valor desconocido (`UNKNOWN_STATUS`
  o `UNKNOWN_PRIORITY`).

**Ejemplo**

```http
GET /requests?status=open&priority=high HTTP/1.1

HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "title": "Projector does not turn on",
    "description": "The projector in room 204 shows no image.",
    "status": "open",
    "priority": "high",
    "createdAt": "2026-08-27T12:00:00.000Z",
    "updatedAt": "2026-08-27T12:00:00.000Z"
  }
]
```

---

## `GET /requests/:id`

* **Intención**: obtener una solicitud en concreto por su identificador.
* **Path**: `GET /requests/:id` (`:id` es un número).
* **Respuesta exitosa**: `200` con la representación JSON de la solicitud.
* **Errores**: `404` (`NOT_FOUND`) si no existe ninguna solicitud con ese `id`. "No existe
  este recurso exacto" es distinto de "no hay resultados en un filtro".

**Ejemplo**

```http
GET /requests/1 HTTP/1.1

HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 1,
  "title": "Projector does not turn on",
  "description": "The projector in room 204 shows no image.",
  "status": "open",
  "priority": "high",
  "createdAt": "2026-08-27T12:00:00.000Z",
  "updatedAt": "2026-08-27T12:00:00.000Z"
}
```

---

## `POST /requests`

* **Intención**: crear una solicitud nueva.
* **Body**: campos aceptados: `title` (requerido y no vacío), `description` (opcional,
  default `""`), `priority` (opcional, default `medium`). Los campos que el servidor
  controla — `id`, `status`, `createdAt`, `updatedAt` — se ignoran si el cliente los envía.
* **Respuesta exitosa**: `201` con la solicitud creada (con `id`, estado `open`, prioridad
  efectiva y fechas).
* **Errores**:
  * `400` (`VALIDATION_ERROR`) si falta `title` o está vacío.
  * `400` (`UNKNOWN_PRIORITY`) si `priority` no pertenece a `low|medium|high`.

**Ejemplo**

```http
POST /requests HTTP/1.1
Content-Type: application/json

{ "title": "Broken chair in the lab", "priority": "medium" }

HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 4,
  "title": "Broken chair in the lab",
  "description": "",
  "status": "open",
  "priority": "medium",
  "createdAt": "2026-08-27T15:00:00.000Z",
  "updatedAt": "2026-08-27T15:00:00.000Z"
}
```

---

## `PATCH /requests/:id`

* **Intención**: actualizar parcialmente una solicitud. Campos modificables: `title`,
  `description`, `priority`, `status` (uno o varios por petición). Los campos del servidor
  (`id`, `createdAt`, `updatedAt`) se ignoran si se envían. `updatedAt` lo actualiza el
  servidor en cada modificación (invariante 7).
* **Body**: al menos un campo modificable con un valor válido.
* **Respuesta exitosa**: `200` con la solicitud actualizada.
* **Errores**: la tabla completa a continuación.

| Situación                          | Estado | Código de error             |
| ---------------------------------- | -----: | --------------------------- |
| Modificación correcta              | 200    | —                           |
| Body sin campos modificables       | 400    | `VALIDATION_ERROR`          |
| Prioridad desconocida              | 400    | `UNKNOWN_PRIORITY`          |
| Estado desconocido                 | 400    | `UNKNOWN_STATUS`            |
| Solicitud inexistente              | 404    | `NOT_FOUND`                 |
| Transición inválida                | 409    | `INVALID_STATUS_TRANSITION` |
| Modificación de solicitud terminal | 409    | `REQUEST_IN_TERMINAL_STATUS` |

Los `400` son de forma (se resuelven mirando solo la petición). Los `409` son de negocio
(la petición está bien formada, pero choca con el estado actual del recurso).

**Ejemplo (éxito y ejemplo de 409)**

```http
PATCH /requests/42 HTTP/1.1
Content-Type: application/json

{ "status": "closed" }

HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "A request cannot move from open to closed."
  }
}
```

```http
PATCH /requests/42 HTTP/1.1
Content-Type: application/json

{ "status": "in_progress" }

HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 42,
  "title": "Wi-Fi drops in the library",
  "description": "The connection drops every few minutes.",
  "status": "in_progress",
  "priority": "low",
  "createdAt": "2026-08-27T12:00:00.000Z",
  "updatedAt": "2026-08-27T15:10:00.000Z"
}
```
