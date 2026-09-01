# Solución docente — Request API v3 (Clase 03)

> **Material del docente.** No se comparte con estudiantes antes de la fecha de entrega.
> Después de la entrega puede usarse para la retroalimentación grupal.

## Ejecutar

```bash
cd request-api-v3-solucion
npm install
node src/server.js
```

## Guion de demostración (verificación completa)

Con el servidor corriendo, en otra terminal:

```bash
# 1. Colección y filtros
curl -i http://localhost:3000/requests
curl -i "http://localhost:3000/requests?status=open"
curl -i "http://localhost:3000/requests?priority=high"
curl -i "http://localhost:3000/requests?status=open&priority=high"
curl -i "http://localhost:3000/requests?status=resolved"        # 200 []
curl -i "http://localhost:3000/requests?status=abierta"         # 400 INVALID_FILTER

# 2. Recurso individual
curl -i http://localhost:3000/requests/1                        # 200
curl -i http://localhost:3000/requests/999                      # 404 REQUEST_NOT_FOUND

# 3. Creación
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{ "title": "Projector failure", "priority": "high" }'     # 201, id 4, open, fechas
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" -d '{}'                    # 400 TITLE_REQUIRED
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{ "title": "X", "priority": "urgent" }'                    # 400 INVALID_PRIORITY
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{ "title": "Y", "status": "closed" }'                      # 201 y status open: se ignora

# 4. Actualización parcial y máquina de estados (sobre la solicitud 1, en open)
curl -i -X PATCH http://localhost:3000/requests/1 \
  -H "Content-Type: application/json" -d '{ "priority": "low" }'         # 200
curl -i -X PATCH http://localhost:3000/requests/1 \
  -H "Content-Type: application/json" -d '{ "status": "closed" }'        # 409 INVALID_STATUS_TRANSITION
curl -i -X PATCH http://localhost:3000/requests/1 \
  -H "Content-Type: application/json" -d '{ "status": "in_progress" }'   # 200
curl -i -X PATCH http://localhost:3000/requests/1 \
  -H "Content-Type: application/json" -d '{ "status": "resolved" }'      # 200
curl -i -X PATCH http://localhost:3000/requests/1 \
  -H "Content-Type: application/json" -d '{ "status": "closed" }'        # 200 (resolved → closed)
curl -i -X PATCH http://localhost:3000/requests/1 \
  -H "Content-Type: application/json" -d '{ "priority": "high" }'        # 409 REQUEST_IN_TERMINAL_STATUS
curl -i -X PATCH http://localhost:3000/requests/2 \
  -H "Content-Type: application/json" -d '{ "id": 99 }'                  # 400 NO_UPDATABLE_FIELDS
curl -i -X PATCH http://localhost:3000/requests/2 \
  -H "Content-Type: application/json" -d '{ "status": "abierta" }'       # 400 INVALID_STATUS

# 5. Pérdida de datos al reiniciar (demostración de la clase)
#    Crear una solicitud (queda con id 4 o 5), detener el servidor (Ctrl+C),
#    levantarlo de nuevo y consultar:
curl -i http://localhost:3000/requests/4                        # 404: la memoria murió con el proceso
```

## Qué mirar al revisar entregas

1. **Historial**: ¿existe el commit/marca `class-03-design` antes de cualquier código nuevo?
   ¿Los archivos de diseño se escribieron antes de la implementación?
2. **Contrato ↔ implementación**: elegir dos filas de su `test-matrix.md` y ejecutarlas.
   ¿El resultado observado coincide con el declarado?
3. **Máquina de estados en un solo lugar**: buscar `canTransition` (o equivalente).
   Si las transiciones están repetidas dentro de los handlers, la cohesión no se logró.
4. **409 vs 400**: pedir que expliquen la diferencia con su propio código en pantalla.
5. **Campos del servidor**: enviar `id` o `createdAt` en un PATCH y verificar que se ignoran.
6. **Decisión 001**: ¿tiene costos reconocidos en ambas opciones, o es propaganda de la
   opción elegida?
7. **ai-usage.md**: ¿registra algo rechazado? Un registro sin rechazos suele indicar
   revisión superficial.

## Errores frecuentes en las entregas

* Implementar la máquina de estados dentro del router (funciona, pero duplica la regla y
  pierde el punto de cohesión).
* Devolver `404` para colecciones vacías filtradas.
* Devolver `400` para transiciones inválidas (confunde forma con regla).
* Olvidar `updatedAt` al modificar.
* `array.length + 1` como generador de IDs.
* Agregar `DELETE` o persistencia en archivo "de regalo": está fuera del contrato.
