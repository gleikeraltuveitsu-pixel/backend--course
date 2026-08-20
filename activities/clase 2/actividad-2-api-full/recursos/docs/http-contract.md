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
| Entrada               | Ninguna |
| Respuesta de éxito    | `200 OK` — array JSON con todas las solicitudes |
| Respuestas de error   | Ninguna (devuelve array vacío `[]` si no hay datos) |

**Ejemplo de respuesta**

```json
[
  {
    "id": 1,
    "title": "Projector does not turn on",
    "description": "The projector in room 204 shows no image during class.",
    "status": "open",
    "priority": "high"
  },
  {
    "id": 2,
    "title": "Broken chair in the lab",
    "description": "One chair in the computer lab has a loose back rest.",
    "status": "in-progress",
    "priority": "medium"
  }
]
```

---

## Endpoint 2 — Consultar una solicitud

| Elemento              | Valor |
| --------------------- | ----- |
| Método                | `GET` |
| Ruta                  | `/requests/:id` |
| Entrada               | `id` (path param) — se convierte a `Number()` |
| Respuesta de éxito    | `200 OK` — objeto JSON con la solicitud |
| Respuestas de error   | `404 Not Found` con `{ "error": "Request not found" }` |

**Ejemplo de respuesta (éxito)**

```json
{
  "id": 1,
  "title": "Projector does not turn on",
  "description": "The projector in room 204 shows no image during class.",
  "status": "open",
  "priority": "high"
}
```

**Ejemplo de respuesta (error)**

```json
{
  "error": "Request not found"
}
```

---

## Endpoint 3 — Crear una solicitud

| Elemento              | Valor |
| --------------------- | ----- |
| Método                | `POST` |
| Ruta                  | `/requests` |
| Entrada               | Body JSON con `title` (string, obligatorio), `description` (string), `priority` (string) |
| Respuesta de éxito    | `201 Created` con la solicitud creada como JSON |
| Respuestas de error   | `400 Bad Request` con `{ "error": "Title is required" }` si falta `title` o está vacío |

**Ejemplo de body de la petición**

```json
{
  "title": "Leaking faucet",
  "description": "The faucet in the third floor bathroom leaks.",
  "priority": "medium"
}
```

**Ejemplo de respuesta (éxito)**

```json
{
  "id": 4,
  "title": "Leaking faucet",
  "description": "The faucet in the third floor bathroom leaks.",
  "status": "open",
  "priority": "medium"
}
```

**Ejemplo de respuesta (error de validación)**

```json
{
  "error": "Title is required"
}
```

---

## Reglas transversales

1. `Content-Type`: `application/json` en todas las respuestas.
2. Ruta inexistente: `404 Not Found` con `{ "error": "Not found" }`.
3. Cuerpo de error: siempre `{ "error": "<mensaje descriptivo>" }`.
4. Campos ignorados: el servidor descarta cualquier campo no definido en la forma del recurso.

## Decisiones que tomaste y por qué

- **`201` en POST en vez de `200`**: el estado `201 Created` indica explícitamente que se
  creó un recurso, lo cual es más preciso que un `200` genérico.
- **`404` en GET por ID**: si el recurso no existe, el cliente debe saberlo con un estado
  apropiado, no con un `200` que enmascara el error.
- **Validación de `title` en POST**: sin esta validación la API aceptaría solicitudes sin
  título, lo cual no tiene sentido para el dominio. Se devuelve `400` con un mensaje claro.
- **`status` siempre `"open"` al crear**: el servidor define el estado inicial; el cliente
  no puede asignar un estado arbitrario al crear una solicitud.
