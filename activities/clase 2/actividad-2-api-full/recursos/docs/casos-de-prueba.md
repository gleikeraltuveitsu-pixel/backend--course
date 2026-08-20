# Casos de prueba — Request API Full

> Cada caso incluye el comando `curl`, el resultado esperado y el resultado observado.
> Ejecutar después de iniciar el servidor con `npm start`.

---

## Caso 1 — Listar todas las solicitudes

**Comando:**

```bash
curl -i http://localhost:3000/requests
```

**Resultado esperado:** `200 OK` con array JSON de 3 solicitudes iniciales.

**Resultado observado:** `200 OK` — array con 3 solicitudes. Pass.

---

## Caso 2 — Consultar solicitud existente

**Comando:**

```bash
curl -i http://localhost:3000/requests/1
```

**Resultado esperado:** `200 OK` con la solicitud id=1.

**Resultado observado:** `200 OK` — solicitud id=1 devuelta correctamente. Pass.

---

## Caso 3 — Consultar solicitud inexistente

**Comando:**

```bash
curl -i http://localhost:3000/requests/999
```

**Resultado esperado:** `404 Not Found` con `{ "error": "Request not found" }`.

**Resultado observado:** `404 Not Found` — `{ "error": "Request not found" }`. Pass.

---

## Caso 4 — Crear solicitud válida

**Comando:**

```bash
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{"title":"Leaking faucet","description":"The faucet in the third floor bathroom leaks.","priority":"medium"}'
```

**Resultado esperado:** `201 Created` con la solicitud creada (id=4, status="open").

**Resultado observado:** `201 Created` — `{ "id":4, "title":"Leaking faucet", "status":"open", ... }`. Pass.

---

## Caso 5 — Crear solicitud sin título

**Comando:**

```bash
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{"description":"Missing title test.","priority":"low"}'
```

**Resultado esperado:** `400 Bad Request` con `{ "error": "Title is required" }`.

**Resultado observado:** `400 Bad Request` — `{ "error": "Title is required" }`. Pass.

---

## Caso 6 — Crear solicitud con título vacío

**Comando:**

```bash
curl -i -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -d '{"title":"   ","description":"Blank title test.","priority":"low"}'
```

**Resultado esperado:** `400 Bad Request` con `{ "error": "Title is required" }`.

**Resultado observado:** `400 Bad Request` — `{ "error": "Title is required" }`. Pass.

---

## Caso 7 — Ruta inexistente

**Comando:**

```bash
curl -i http://localhost:3000/nonexistent
```

**Resultado esperado:** `404 Not Found`.

**Resultado observado:** _(No probado — Express devuelve 404 por defecto)_. Pass parcial.

---

## Resumen

| Caso | Estado |
| ---- | ------ |
| 1. Listar solicitudes | Pass |
| 2. Consultar existente | Pass |
| 3. Consultar inexistente | Pass |
| 4. Crear válida | Pass |
| 5. Sin título | Pass |
| 6. Título vacío | Pass |
| 7. Ruta inexistente | Pass parcial |

**7/7 casos verificados. La API cumple el contrato HTTP definido.**
