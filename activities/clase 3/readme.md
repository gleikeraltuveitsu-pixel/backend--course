# Entrega 03 · Recursos, estado y reglas

Proyecto transversal de la clase 3 de Desarrollo Backend. Se pasa de "tres rutas que
funcionan" a "un modelo, un contrato y reglas que protegen el sistema".

## Fase 1 · Diseño (sin IA)

* `resource-model.md` — el recurso `Request`, sus propiedades, campos generados por el
  servidor y reglas.
* `http-contract.md` — contrato HTTP completo (intención, path, query, body, respuestas y
  errores por endpoint).
* `transition-map.md` — máquina de estados del ciclo de vida.
* `test-matrix.md` — casos de prueba con resultado esperado y observado.

## Fase 5 · Implementación y verificación

El código vive en el proyecto transversal: `project/`. La verificación de la matriz con
`curl` queda registrada en `test-matrix.md`.

* `ai-usage.md` — uso y rechazos de IA durante la entrega.
* `reflection.md` — reflexión personal sobre lo aprendido.

## Recursos del ejercicio

* `recursos/request-api-v3-starter/` — punto de partida (clase 2 terminada) por si el
  proyecto propio no está sano.
* `recursos/request-api-v3-solucion/` — solución de referencia del docente.

## Decisión registrada

`project/docs/decisions/001-cancel-instead-of-delete.md` — se cancela por estado y no se
borra.