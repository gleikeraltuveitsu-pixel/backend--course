# Matriz de acceso — Request API v5

Dos roles exactos: `requester` y `agent`. Sin `admin`.

La matriz es fija (baseline del taller) y la implementación converge en ella.

| Operación | Anónimo | Requester | Agent |
| --------- | ------: | --------: | ----: |
| `POST /auth/register` | Sí | Sí | Sí |
| `POST /auth/login` | Sí | Sí | Sí |
| `GET /auth/me` | No | Sí | Sí |
| `GET /requests` | No | Propias | Sí |
| `GET /requests/:id` | No | Propia | Sí |
| `GET /requests/:id/history` | No | Propia | Sí |
| `POST /requests` | No | Sí | No |
| Editar título/descripción | No | Propia y abierta | No |
| Cambiar prioridad | No | No | Sí |
| Cambiar estado | No | No | Sí |

## Campos controlados por el servidor

El cliente JAMÁS puede enviar estos campos. Intentarlo produce un `400` con
`error.code = SERVER_CONTROLLED_FIELD`, y el body completo se rechaza (nada
se aplica parcialmente).

Registro (`POST /auth/register`):
- `role` (el servidor siempre asigna `requester` en el alta)
- `id` (lo genera la base como UUID)
- `createdAt` (lo genera la base)
- `updatedAt` (no aplica a usuarios)
- `createdBy` (no existe en el alta de usuario)
- `passwordHash` (nunca llega del cliente)

Solicitudes (`POST /requests`):
- `id` · `status` (nace `open`) · `createdAt` · `updatedAt`
- `createdBy` (sale del token verificado, nunca del body)

Solicitudes (`PATCH /requests/:id`):
- `id` · `createdBy` · `createdAt` · `updatedAt`
- `changedBy` (el actor de la historia sale del token, no del body)

## Solicitudes heredadas

Las solicitudes sin propietario (`created_by IS NULL`) pertenecen a nadie:
solo los `agent` las ven. Un `requester` jamás matchea un `created_by IS
NULL`, por lo que recibe el mismo `404` que una solicitud inexistente — así
no se revela la existencia del recurso. Los agents las ven porque el
workflow completo (prioridad, estado, historia) es trabajo del agente.
