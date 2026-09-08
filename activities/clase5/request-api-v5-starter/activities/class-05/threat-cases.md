# Casos adversariales — Request API v5

Describe al menos ocho ataques que tu implementación deberá resistir, con el
resultado exacto esperado (código HTTP + `error.code`). Piensa como quien NO
respeta tu frontend: registro con `role`, `createdBy` inventado, IDs ajenos,
tokens editados o vencidos, bodies mixtos, headers extraños…

1. **Escalamiento de rol en registro.** `POST /auth/register` con
   `{ email, password, role: "agent" }` → `400 SERVER_CONTROLLED_FIELD`. El
   servidor asigna siempre `requester`; un `role` en el body no se ignora, se
   rechaza explícitamente.

2. **Forjar el propietario al crear.** `POST /requests` con `createdBy` en el
   body (de otro usuario) → `400 SERVER_CONTROLLED_FIELD`. `createdBy` sale del
   token verificado, nunca del body.

3. **Forjar el actor de la historia.** `PATCH /requests/:id` con `changedBy`
   en el body → `400 SERVER_CONTROLLED_FIELD`. `changedBy` de una transición
   sale del token del actor autenticado.

4. **Solicitud nacida cerrada.** `POST /requests` con `status: "closed"` →
   `400 SERVER_CONTROLLED_FIELD`. Toda solicitud nace `open`; el estado en el
   alta es controlado por el servidor.

5. **Acceso a solicitud ajena (IDOR).** `GET /requests/<bobId>` con token de
   Alice → `404 REQUEST_NOT_FOUND`, IDÉNTICO al de una solicitud inexistente.
   No se revela la existencia del recurso ajeno.

6. **Token editado a mano.** Modificar el payload de un JWT legítimo
   (ej. cambiar `role` a `agent`) y reenviarlo sin re-firmar → `401
   INVALID_TOKEN`. Decodificar no es verificar: la firma se comprueba.

7. **Token vencido.** Reenviar un JWT firmado correctamente pero con `exp`
   en el pasado → `401 INVALID_TOKEN`. Se comprueba `exp` en cada verificación.

8. **Token firmado por otra clave.** Presentar un token creado con un
   `JWT_SECRET` distinto → `401 INVALID_TOKEN`. La firma lo vuelve inútil.

9. **Body mixto en PATCH.** `PATCH /requests/:id` con
   `{ title: "...", priority: "low" }` por un `requester` → `403 FORBIDDEN`
   y NADA se aplica: la parte permitida tampoco. Autorización all-or-nothing.

10. **Cambio de estado prohibido.** `PATCH open -> closed` por un `agent` →
    `409 INVALID_STATUS_TRANSITION`. Los roles nunca saltan la máquina de
    estados de la clase 03.

11. **Header de autorización extraño.** `GET /auth/me` con
    `Authorization: Basic ...`, token desnudo o `Bearer ` vacío → `401
    AUTHENTICATION_REQUIRED`. Solo el esquema `Bearer` con token no vacío es
    una identidad de confianza.

12. **Solicitud heredada por un requester.** `GET /requests/<legacyId>` (una
    `created_by IS NULL`) con token de un `requester` → `404 REQUEST_NOT_FOUND`.
    Nadie es dueño de esas solicitudes; solo los agents las ven.
