# Inconsistencias Detectadas — Request API Lite

> Análisis del código fuente (`server.js`) frente a buenas prácticas HTTP/REST.

## Inconsistencias críticas

### 1. Ruta `/getRequests` incluye el verbo HTTP
- **Archivo:** `server.js:35`
- **Problema:** La ruta contiene el nombre del método (`get`), lo cual rompe la convención REST. Los recursos se nombran con sustantivos, no con verbos.
- **Corrección esperada:** `GET /requests`

### 2. `POST /requests` devuelve `200` en vez de `201`
- **Archivo:** `server.js:62`
- **Problema:** Al crear un recurso, el status code correcto es `201 Created`. El `200` indica éxito genérico.
- **Corrección esperada:** `res.status(201).json(newRequest)`

### 3. `GET /requests/:id` devuelve `200` cuando el recurso no existe
- **Archivo:** `server.js:43-45`
- **Problema:** Devuelve `{ "error": "Request not found" }` con status `200`. El cliente no puede distinguir entre éxito y error.
- **Corrección esperada:** `res.status(404).json({ error: 'Request not found' })`

---

## Inconsistencias moderadas

### 4. No se validan campos obligatorios en POST
- **Archivo:** `server.js:50-63`
- **Problema:** Si el cliente envía `{}` (body vacío), el servidor crea una solicitud con `title: undefined`. No hay validación.
- **Corrección esperada:** Verificar que `title` exista y no esté vacío. Devolver `400 Bad Request` si falta.

### 5. No hay endpoints de actualización ni eliminación
- **Problema:** La API solo permite leer y crear. No hay `PUT`, `PATCH` ni `DELETE`.
- **Impacto:** La API es incompleta para un sistema real de gestión de solicitudes.

---

## Inconsistencias menores

### 6. Formato de error no estandarizado
- **Problema:** Solo hay un caso de error (`GET /requests/:id` con ID inexistente). No hay convención para errores de validación, rutas inexistentes, etc.

### 7. No se valida `Content-Type` en POST
- **Problema:** Si el cliente envía un body que no es JSON, `express.json()` lo ignora silenciosamente y `req.body` queda como `undefined`.

---

## Resumen de estados HTTP utilizados vs esperados

| Endpoint | Estado real | Estado esperado |
| ---------- | ----------- | --------------- |
| `GET /getRequests` | `200` | `200` (pero ruta incorrecta) |
| `GET /requests/:id` (existe) | `200` | `200` |
| `GET /requests/:id` (no existe) | `200` | `404` |
| `POST /requests` (válido) | `200` | `201` |
| `POST /requests` (sin title) | `200` (crea incompleto) | `400` |
| Ruta inexistente | `404` (HTML de Express) | `404` JSON |

---

## Conclusión

La API funciona a nivel básico pero tiene **3 inconsistencias críticas** que rompen el contrato HTTP correcto: naming de rutas, status code de creación, y manejo de errores. Estas son exactamente las que el Proyecto Full busca corregir de forma estructurada.
