# Registro de decisiones — Clase 05

Una entrada por decisión no obvia: qué decidiste, qué alternativas había y por
qué. Como mínimo: dónde guardas la identidad del actor, por qué los recursos
ajenos responden lo que responden, y qué pasa con las solicitudes heredadas.

## La identidad del actor vive en `req.auth`

**Decisión:** el middleware `authenticate` construye `req.auth = { userId, role }`
a partir del payload del token **verificado** (no decodificado) y es la única
fuente de identidad de confianza. Cada ruta protegida recibe el actor como
primer argumento de su operación de servicio.

**Alternativas:** leer el token en cada ruta, o confiar en `req.body.createdBy`.
Descartadas: repetir la verificación en cada handler multiplica la superficie de
error, y los valores que llegan del body son exactamente lo que el atacante
controla.

**Por qué:** la identidad debe originarse en un solo punto (el middleware) y
propagarse por un canal no falsificable (`req.auth`). El JWT se firma, no se
cifra: el payload no lleva material sensible, solo `sub` y `role`.

## Los recursos ajenos responden `404`, no `403`

**Decisión:** en `getRequest` y `getHistory`, una solicitud ajena (o heredada,
para un requester) responde el MISMO `404 REQUEST_NOT_FOUND` que una
inexistente. También en `patchRequest` cuando el recurso no es del actor.

**Alternativas:** responder `403` (identidad válida pero prohibido).

**Por qué:** `403` confirma la existencia del recurso; `404` no revela nada.
La pregunta «¿existe el request 42?» no tiene respuesta distinguible entre
«no existe» y «no es tuyo». Es la defensa clásica contra IDOR: no hay forma de
mapear el catálogo de recursos ajenos.

## Las solicitudes heredadas pertenecen a nadie

**Decisión:** `created_by IS NULL` solo lo ven los `agent`. En SQL, el scope
de listado de un `requester` es `created_by = $userId`, y ningún requester
puede igualar un `NULL`; además el `404` de acceso directo lo confirma.

**Por qué:** son filas de las clases 3-4 que preceden a la tabla de usuarios.
Son trabajo del agente (prioridad, estado, historia), así que el agente las ve
en el listado completo y en el acceso directo. Un requester jamás debe poder
distinguirlas de «no existe».

## Autorización all-or-nothing en `PATCH`

**Decisión:** si el body mezcla un campo permitido con uno prohibido, la
respuesta es `403 FORBIDDEN` y NADA se actualiza. La política se aplica sobre
todos los campos ANTES de escribir.

**Alternativas:** aplicar la parte permitida y rechazar solo la prohibida.

**Por qué:** aplicar una parte del body mezclado permite a un atacante
"colar" cambios prohibidos disfrazados de actualizaciones inocentes. Evaluar
el cuerpo completo como una unidad hace el rechazo predecible.

## `401` vs `403` vs `404`

**Decisión:** sin identidad (o con token inválido/vencido) → `401`. Identidad
válida pero operación no autorizada → `403`. Recurso inexistente O ajeno →
`404`. Conflicto con el estado (email duplicado, transición inválida, estado
terminal) → `409`.

**Por qué:** la semántica exacta evita que cada error filtre información: el
`401` no dice qué falló exactamente, el login falla con bytes idénticos para
email desconocido y password equivocada, y el `404` unifica «no existe» con
«no te pertenece».