# Decisión 001: Cancelar solicitudes en lugar de borrarlas

## Contexto

Los requerimientos de la clase 03 incluyen "cancelar una solicitud" y "preservar el historial
de la solicitud". Una lectura ingenua convierte "cancelar" en `DELETE /requests/:id`,
eliminando físicamente el elemento del array. Tuvimos que decidir qué significa realmente
cancelar para este sistema.

## Opciones

### Opción 1: Borrar físicamente la solicitud

Beneficios:

* Implementación más simple posible (`array.splice`).
* La colección solo contiene ítems "activos"; no se necesitan filtros.
* Coincide con la expectativa del acrónimo CRUD.

Costos:

* El historial de la solicitud desaparece: nadie puede responder "¿qué pasó con la #42?".
* Funcionalidades futuras (comentarios, auditoría) mantendrían referencias a una solicitud
  que ya no existe.
* Nada puede recuperarse después de una eliminación accidental.
* Borrar también rompe las suposiciones de secuencia de `id` de cualquier cliente que haya
  cacheado la lista.

### Opción 2: Preservarla con estado `cancelled`

Beneficios:

* La solicitud y su historial sobreviven; la auditoría y la recuperación siguen siendo posibles.
* Los comentarios y referencias futuras se mantienen válidos.
* La cancelación se convierte en parte del ciclo de vida: la máquina de estados controla
  cuándo se permite (desde `open` o `in_progress`, nunca desde `resolved` o `closed`).

Costos:

* Las solicitudes canceladas siguen ocupando memoria y aparecen en listados sin filtro; los
  consumidores deben filtrar por estado cuando solo quieren ítems activos.
* Aparecen nuevas reglas: ¿qué se puede hacer con una solicitud cancelada? (Respuesta: nada
  — es terminal.)
* La API no tiene un verdadero `DELETE`, lo cual puede sorprender a consumidores que esperan
  CRUD completo.

## Decisión

Opción 2. No implementamos `DELETE /requests/:id`. La cancelación es una transición controlada:
`PATCH /requests/:id` con `{ "status": "cancelled" }`, permitida desde `open` e
`in_progress`. `cancelled` es un estado terminal.

Esta es una decisión para ESTE dominio, no una regla universal: en dominios con requisitos de
eliminación legal (datos personales), la eliminación física sería obligatoria.

## Consecuencias

¿Qué ganamos?

* Historial completo de cada solicitud, incluyendo las interrumpidas.
* Una única vía de modificación (`PATCH`) protegida por la máquina de estados.

¿Qué complejidad aparece?

* Los listados que solo quieren solicitudes activas deben filtrar (`?status=open` etc.).
* La regla de estado terminal (`409 REQUEST_IN_TERMINAL_STATUS`) existe sobre todo porque
  los ítems cancelados permanecen.

¿Qué ya no se puede hacer?

* Eliminar físicamente una solicitud a través de la API.

¿Qué podría cambiar después?

* Si la colección crece, podríamos necesitar una vista "archivada" o filtros por defecto.
* Si aparecen requisitos legales de eliminación, necesitaremos una ruta de eliminación real
  con sus propias reglas, documentada como una nueva decisión que sustituya esta.
