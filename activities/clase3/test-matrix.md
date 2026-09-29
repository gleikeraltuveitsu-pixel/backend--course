# Test matrix — Entrega 03

> Fase 1: se declara el resultado **esperado**. Fase 5: se ejecuta cada caso con `curl`
> contra el proyecto corriendo y se registra el resultado **observado** (línea de estado
> literal y cuerpo). La columna observado se llena ejecutando, no copiando la esperada.

| Caso                   | Petición                      | Estado previo | Resultado esperado | Resultado observado |
| ---------------------- | ----------------------------- | ------------- | ------------------ | ------------------- |
| Crear correctamente    | `POST /requests`              | —             | `201`              | `201` con id 4, estado `open` y fechas |
| Crear sin título       | `POST /requests`              | —             | `400`              | `400` `VALIDATION_ERROR` "A request needs a non-empty title." |
| Consultar inexistente  | `GET /requests/999`           | —             | `404`              | `404` `NOT_FOUND` "Request 999 does not exist." |
| Filtrar sin resultados | `GET /requests?status=closed` | —             | `200 []`           | `200 []` tras reinicio |
| Cambiar prioridad      | `PATCH /requests/1`           | `open`        | `200`              | `200`, priority `low`, `updatedAt` refrescado |
| Transición válida      | `PATCH /requests/1`           | `open`        | `200`              | `200`, status `in_progress` |
| Transición inválida    | `PATCH /requests/1`           | `open`        | `409`              | `409` `INVALID_STATUS_TRANSITION` (open → closed) |
| Modificar cerrada      | `PATCH /requests/1`           | `closed`      | `409`              | `409` `REQUEST_IN_TERMINAL_STATUS` |

> Agrega tus propios casos debajo (mínimo dos).

| Caso | Petición | Estado previo | Resultado esperado | Resultado observado |
| ---- | -------- | ------------- | ------------------ | ------------------- |
| Filtro con valor desconocido | `GET /requests?status=abierta` | — | `400` | `400` `UNKNOWN_STATUS` |
| Filtro por prioridad | `GET /requests?priority=low` | — | `200` | `200` con solo la solicitud de prioridad `low` |
| Body sin campos modificables | `PATCH /requests/1` (`{"id":1}`) | `open` | `400` | `400` `VALIDATION_ERROR` "at least one of: title, description, priority, status." |
| Crear con prioridad inválida | `POST /requests` (`{"priority":"urgent"}`) | — | `400` | `400` `UNKNOWN_PRIORITY` |
| Crear ignorando `status` del cliente | `POST /requests` (`{"status":"closed"}`) | — | `201` estado `open` | `201`, estado `open` (status del cliente ignorado) |

## Evidencia

_(Salidas de `curl -i` de al menos los casos de transición inválida y de solicitud
terminal: la prueba de que las reglas están protegidas.)_

```txt
===== TRANSICIÓN INVÁLIDA: open → closed (solicitud 1) =====
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8

{"error":{"code":"INVALID_STATUS_TRANSITION","message":"A request cannot move from open to closed."}}

===== SOLICITUD TERMINAL: se lleva a closed y se intenta modificar =====
(curl -s -X PATCH /requests/1 {status:in_progress} → 200)
(curl -s -X PATCH /requests/1 {status:resolved} → 200)
(curl -s -X PATCH /requests/1 {status:closed} → 200)
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8

{"error":{"code":"REQUEST_IN_TERMINAL_STATUS","message":"Request 1 is closed and can no longer be modified."}}
```