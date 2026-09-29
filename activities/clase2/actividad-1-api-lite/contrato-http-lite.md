# Contrato HTTP — Request API Lite (Análisis)

> Documento generado a partir del código fuente (`server.js`).
> Describe lo que la API **realmente hace**, no lo que debería hacer.

## Recurso

Una **solicitud de mantenimiento** (`request`) representa un problema reportado en las instalaciones de una institución educativa. Contiene un título, una descripción, un estado de seguimiento y un nivel de prioridad.

### Forma del recurso

| Campo         | Tipo    | Obligatorio | Quién lo asigna | Notas |
| ------------- | ------- | ----------- | --------------- | ----- |
| `id`          | number  | Sí          | Servidor        | Autoincremental, empieza en 1 |
| `title`       | string  | Sí*         | Cliente         | *No se valida en el servidor |
| `description` | string  | Sí*         | Cliente         | *No se valida en el servidor |
| `status`      | string  | Sí          | Servidor        | Siempre `"open"` al crear |
| `priority`    | string  | Sí*         | Cliente         | *No se valida en el servidor |

---

## Endpoint 1 — Listar solicitudes

| Elemento              | Valor |
| --------------------- | ----- |
| Método                | `GET` |
| Ruta                  | `/getRequests` |
| Entrada               | Ninguna |
| Respuesta de éxito    | `200 OK` — array JSON con todas las solicitudes |
| Respuestas de error   | Ninguna definida |

**Ejemplo de respuesta**

```json
[
  {
    "id": 1,
    "title": "Projector does not turn on",
    "description": "The projector in room 204 shows no image during class.",
    "status": "open",
    "priority": "high"
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
| Respuestas de error   | `200 OK` con `{ "error": "Request not found" }` cuando no existe |

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

> **Nota:** El error devuelve status `200`, lo cual es incorrecto. Debería ser `404`.

---

## Endpoint 3 — Crear una solicitud

| Elemento              | Valor |
| --------------------- | ----- |
| Método                | `POST` |
| Ruta                  | `/requests` |
| Entrada               | Body JSON con `title`, `description`, `priority` |
| Respuesta de éxito    | `200 OK` con la solicitud creada |
| Respuestas de error   | Ninguna — no valida campos |

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

---

## Reglas transversales

1. `Content-Type`: `application/json` (implícito por `express.json()` y `res.json()`).
2. Ruta inexistente: no hay manejo — Express devuelve `404` por defecto con HTML.
3. Cuerpo de error: `{ "error": "<mensaje>" }` — solo en el caso de ID no encontrado.
4. Campos ignorados: el servidor no ignora campos extra — simplemente no los almacena.

## Inconsistencias detectadas

Ver archivo: `inconsistencias-lite.md`
