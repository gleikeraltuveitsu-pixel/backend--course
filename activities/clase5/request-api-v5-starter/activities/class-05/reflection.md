# Reflexión — Clase 05

Responde con tus palabras al cerrar el taller:

1. **¿Qué diferencia hay entre identidad, autenticación y autorización?**

   Identidad es «quién soy»: la colección de atributos que me distinguen (mi
   id y mi rol). Autenticación es «probandólo»: el proceso que verifica que
   quien dice ser yo soy (login con password, verificación de un JWT). La
   autorización es «qué puedo hacer»: una vez autenticado, las reglas que
   deciden si una operación concreta está permitida para ese actor. En la API,
   `authenticate` establece `req.auth` (quién), y `request.policy.js` decide
   qué operaciones puede hacer (qué).

2. **¿Por qué `createdBy` y `changedBy` nunca llegan desde el body?**

   Porque son hechos sobre la petición, no datos del recurso. Si el cliente
   pudiera elegirlos, cualquiera registraría solicitudes como si fueran de
   otro o escribiría el historial con el actor que quisiera: es *mass
   assignment*. Ambos se derivan del token verificado
   (`req.auth.userId`), que es la única identidad de confianza. Enviarlos
   desde el body produce `400 SERVER_CONTROLLED_FIELD` — se rechazan
   explícitamente, no se ignoran.

3. **¿Qué diferencia hay entre `401` y `403`? ¿Y por qué a veces `404`?**

   `401` significa «no sé quién eres»: falta el token, es inválido o venció,
   o el login falló. `403` significa «sé quién eres y no te dejo»: actor
   autenticado intentando una operación para la que no tiene permiso (un
   requester cambiando prioridad). `404` se usa a veces cuando el recurso
   existe pero no debe revelarse: si una solicitud ajena respondiera `403`,
   confirmaría que existe. Responder `404` idéntico al de una inexistente
   vuelve imposible mapear recursos ajenos (contra IDOR).

4. **¿Por qué decodificar un JWT no permite confiar en él?**

   Decodificar solo separa los tres segmentos (header.payload.signature) y
   lee el payload en base64; cualquiera puede hacerlo con un token ajeno, e
   incluso podría editar el payload y re-codificarlo. Lo que hace confiable
   al token es la **verificación**: comprobar la firma (que solo quien conoce
   el secreto pudo producir), más el algoritmo, el issuer, el audience y la
   expiración. El validador lo demuestra: un token con `role: "agent"` editado
   a mano responde `401`.

5. **¿Por qué el `agent` sigue sujeto a la máquina de estados?**

   Porque el rol decide quién puede operar, pero la máquina de estados decide
   qué es un cambio válido del dominio. Que un agente pueda cambiar el estado
   no le da derecho a saltar de `open` a `closed` sin pasar por
   `in_progress`/`resolved`: no es una cuestión de permisos sino de reglas del
   negocio. Los roles nunca bypassan las reglas; el validador lo exige con `409
   INVALID_STATUS_TRANSITION` incluso para agentes.

6. **¿Qué intentó romper el validador y qué limitación conserva esta solución?**

   El validador intentó romper: el escalamiento de rol en el registro, la
   enumeración de cuentas (logins idénticos), el almacenamiento de passwords
   en claro, los tokens editados/vencidos/forjados, la propiedad forjada
   (`createdBy`), el acceso a recursos ajenos (IDOR), los bodies mixtos en
   `PATCH`, el acceso de requester a solicitudes heredadas, y las fugas de
   datos sensibles en las respuestas. Limitación que conserva: el secreto de
   firma es compartido (HS256); un atacante con el `JWT_SECRET` podría firmar
   tokens de cualquier rol. Además el `agent` se crea por SQL directo, no por
   un endpoint: la promoción es manual/profesoral y no existe aún gestión de
   agentes por la API. En producción usaríamos claves asimétricas (RS256/EdDSA)
   y un flujo de autorización más granular (p. ej. scopes), además de de un
   sistema de rotación/revocación de tokens.