# Transition map — ciclo de vida de una solicitud

> Fase 1 · se completa **antes de usar IA y antes de tocar código**.
> Lo que no aparece como transición permitida está prohibido: los huecos también son reglas.

## Estados

* `open` — recién reportada, aún sin atender.
* `in_progress` — en atención por el equipo.
* `resolved` — el equipo cree que está lista; falta que quien reportó confirme.
* `closed` — confirmada como terminada. **Terminal.**
* `cancelled` — interrumpida y no se resolverá. **Terminal.**

## Transiciones permitidas

| Desde         | Hacia          | ¿Qué la dispara?                                |
| ------------- | -------------- | ----------------------------------------------- |
| `open`        | `in_progress`  | El equipo comienza a atender.                   |
| `open`        | `cancelled`    | Se cancela antes de ser atendida.               |
| `in_progress` | `resolved`     | El equipo resuelve y marca la solicitud.        |
| `in_progress` | `cancelled`    | Se cancela mientras está en atención.           |
| `resolved`    | `closed`       | Quien reportó confirma la resolución.           |
| `resolved`    | `in_progress`  | La resolución no convenció; se reabre.          |

Camino feliz: `open → in_progress → resolved → closed`. Salidas laterales: `open →
cancelled` y `in_progress → cancelled`. Retorno: `resolved → in_progress`.

## Transiciones inválidas notables

| Intento                     | Por qué se rechaza                                   |
| --------------------------- | ---------------------------------------------------- |
| `open → closed`             | No se puede cerrar sin atender; falta el recorrido.  |
| `open → resolved`           | No se resuelve lo que nunca se atendió.              |
| `resolved → cancelled`      | Si ya se resolvió, se confirma o se reabre, no se cancela. |
| salir de `closed`           | `closed` es terminal.                                |
| salir de `cancelled`        | `cancelled` es terminal.                             |

## Estados terminales

`closed` y `cancelled` no admiten transiciones de salida: ninguna flecha sale de ellos. Si
se intenta modificar (cualquier campo, incluyendo `status`) una solicitud en estado
terminal, la API responde `409` con `REQUEST_IN_TERMINAL_STATUS`.

## Justificación

El mapa distingue dos formas de terminar con una historia distinta: `closed` culmina el
trabajo (nadie lo reabre), mientras que `cancelled` lo interrumpe (podría, en otro sistema,
reabrirse; aquí no). El retorno `resolved → in_progress` existe porque `resolved` es una
afirmación del equipo que quien reportó puede refutar; `closed` en cambio es la confirmación
final y por eso no tiene salida. No hay `open → closed`: cerrar sin atender destruiría el
registro de trabajo. La cancelación solo es posible `open` o `in_progress`, porque una
solicitud ya resuelta no debe descartarse como cancelada.

Esta decisión (PATCH con máquina de estados en lugar de acciones con nombre, y cancelar en
lugar de borrar) es la que se registra en la nota `project/docs/decisions/001-cancel-
instead-of-delete.md`.
