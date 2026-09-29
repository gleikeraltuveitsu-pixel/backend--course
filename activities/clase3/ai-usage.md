# Registro de uso de IA — Entrega 03

> Fecha: 2026-09-01. Proyecto transversal, clase 3.

## Cómo se usó la IA en esta entrega

La IA se usó como **redactor asistente**, solo después de completar la fase de diseño
(resource-model, http-contract, transition-map, test-matrix) escrita a mano. La IA no tomó
decisiones de diseño.

## Lo que se hizo con IA

1. **Redacción del código** de la capa HTTP (`requests.routes.js`), de `app.js`,
   `server.js` y `package.json`, respetando las funciones ya declaradas en
   `requests.store.js` y `request-status.js` (escritos sin IA).
2. **Generación de la nota de decisión** `docs/decisions/001-cancel-instead-of-delete.md`
   a partir de la decisión ya tomada en `transition-map.md`.
3. **Rellenar la matriz de pruebas** con el resultado observado obtenido ejecutando cada
   caso con `curl`.

## Lo que se rechazó de la IA

1. **`DELETE /requests/:id` para "cancelar"**: la IA propuso (y el starter de recursos lo
   sugiere) borrar físicamente. Se rechazó: la decisión 001 registra por qué se cancela por
   estado y no se borra.
2. **Base de datos o persistencia en archivo**: la IA propuso persistir los datos. Se
   rechazó: el alcance de esta entrega exige explícitamente memoria en proceso; los datos
   se pierden al reiniciar y eso es comportamiento esperado.
3. **Devolver `400` para transiciones inválidas**: la IA propuso 400 para todo error de
   body. Se rechazó: la transición inválida es una regla de negocio y debe responder `409`.
4. **Códigos de error literales distintos del contrato**: la IA propuso nombres propios
   (`INVALID_FILTER`, `REQUEST_NOT_FOUND`, etc.). Se normalizaron a los códigos declarados
   en `http-contract.md` (`VALIDATION_ERROR`, `UNKNOWN_STATUS`, `UNKNOWN_PRIORITY`,
   `NOT_FOUND`, `INVALID_STATUS_TRANSITION`, `REQUEST_IN_TERMINAL_STATUS`).
5. **Máquina de estados dentro del router**: la IA tendió a duplicar las transiciones en
   el handler. Se corrigió para que la regla viva en un solo lugar
   (`request-status.js`) y el store la consulte.

## Verificación

Cada caso declarado en la matriz de pruebas se ejecutó manualmente con `curl`. Los
resultados observados coinciden con los esperados.