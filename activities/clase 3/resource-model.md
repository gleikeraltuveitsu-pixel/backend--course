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
porque ambos tienen un valor por defecto sano.

## Campos opcionales

* `description` — si falta, el servidor le asigna `""`.
* `priority` — si falta, el servidor le asigna `"medium"`.

## Campos generados por el servidor

* `id` — no se acepta del cliente; lo asigna el servidor (contador interno).
* `createdAt` — momento de creación; lo pone el servidor.
* `updatedAt` — cambia en cada modificación; lo pone el servidor (invariante 7).
* `status` inicial — toda solicitud nueva comienza en `open` (invariante 3); el cliente no
  puede forzar otro estado al crear.

El servidor controla estos campos porque son su responsabilidad (identidad y trazabilidad),
no datos que el cliente deba decidir.

## Estados permitidos

Lista cerrada de valores de `status`:

* `open` — recién reportada, aún sin atender.
* `in_progress` — en atención por el equipo.
* `resolved` — el equipo cree que está resuelta; falta confirmar.
* `closed` — confirmada como terminada (terminal).
* `cancelled` — interrumpida sin resolverse (terminal).

## Reglas

* Nunca existirá una solicitud sin `id`.
* Nunca existirá una solicitud sin `title`.
* Toda solicitud nueva comienza en `open`.
* El valor de `status` siempre pertenecerá al conjunto de estados permitidos.
* Una solicitud en estado terminal (`closed` o `cancelled`) nunca admitirá modificaciones.
* No toda transición entre estados estará permitida.
* `updatedAt` siempre cambiará cuando la solicitud se modifique.
* `id`, `createdAt` y `updatedAt` siempre los controlará el servidor; los valores enviados
  por el cliente para estos campos se ignorarán.

## Dudas

* ¿Una solicitud `cancelled` puede volver a `open` (reabrirla)? El requerimiento no lo dice;
  hoy se asume que no, cancelar es terminal.
* ¿Debe existir una solicitud `resolved` que vuelva directamente a `cancelled`? Hemos
  decidido que no: si ya se resolvió, se confirma (`closed`) o se reabre (`in_progress`).
* ¿`description` es realmente opcional o el reporte debería exigirla? Se mantiene opcional
  para no bloquear reportes rápidos.
