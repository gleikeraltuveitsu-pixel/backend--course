# Reflexión — Entrega 03

## ¿Qué aprendí que no sabía antes de esta clase?

La diferencia entre **validar la forma** (los `400`: el body tiene sentido mirándolo solo)
y **proteger una regla de negocio** (los `409`: la petición está bien formada pero choca
con el estado actual del recurso). Antes veía los errores de la API como una sola lista de
"cosas que fallan". Ahora entiendo que el mismo cuerpo puede ser aceptado hoy y rechazado
mañana, según el estado en que esté la solicitud.

## ¿Qué me costó más y cómo lo resolví?

Diseñar la máquina de estados sin caer en "una ruta por operación". Mi primer instinto fue
crear endpoints con nombre (`/cancel`, `/close`) como sugieren los requerimientos. La clase
insistió en que CRUD no decide las operaciones: la cancelación es una transición de estado
y debe pasar por `PATCH` con la máquina como guardián. Lo resolví dibujando el mapa de
transiciones (`open → in_progress/cancelled …`) antes de escribir código; una vez que la
tabla existió, la implementación fue casi mecánica.

## ¿Qué haría distinto la próxima vez?

Escribir yo mismo el cuerpo de todos los casos de error antes de implementar. Varios
detalles (p. ej. qué pasa si el cliente envía `id` en un `PATCH`) se decidieron sobre la
marcha y quedaron documentados después. Haberlos fijado en el contrato primero habría
ahorrado idas y vueltas.

## Idea que resume la clase

> Un modelo, un contrato y reglas que protegen el sistema — el recurso no es el JSON.

El JSON es solo la representación; el recurso es el ciclo de vida que las reglas protegen.