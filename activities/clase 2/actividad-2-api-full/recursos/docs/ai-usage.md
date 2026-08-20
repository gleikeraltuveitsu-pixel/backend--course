# Registro de uso de IA — Request API Full

> Documentar cada interacción con IA mientras se trabaja en el proyecto.
> No esperar al final: registrar en el momento.

---

## Interacción 1 — Análisis del Proyecto Lite

- **Herramienta:** opencode (asistente de código)
- **Fecha:** 2026-08-20
- **Contexto:** Se pidió analizar la API Lite existente y detectar inconsistencias HTTP.
- **Qué generó la IA:** Identificó 7 inconsistencias (rutas con verbos, status codes incorrectos, falta de validación).
- **Qué hice con eso:** Acepté el análisis completo. Las inconsistencias documentadas guiaron el contrato del Proyecto Full.
- **Qué rechacé:** Nada que rechazar — fue análisis puro, no generación de código.

---

## Interacción 2 — Contrato HTTP del Proyecto Full

- **Herramienta:** opencode
- **Fecha:** 2026-08-20
- **Contexto:** Se pidió escribir el contrato HTTP antes de implementar.
- **Qué generó la IA:**plantilla completa del contrato con los 3 endpoints, formas de recurso, reglas transversales y decisiones.
- **Qué hice con eso:** Revisé cada endpoint y confirmé que corrige las inconsistencias del Lite (201 en POST, 404 en GET, validación de title).
- **Qué rechacé:** Nada — el contrato es correcto y consistente.

---

## Interacción 3 — Implementación de endpoints

- **Herramienta:** opencode
- **Fecha:** 2026-08-20
- **Contexto:** Se pidió implementar los 3 endpoints en `requests.routes.js`.
- **Qué generó la IA:** Implementación de GET /, GET /:id, y POST / con validaciones.
- **Qué hice con eso:** Revisé cada endpoint contra el contrato. La implementación cumple el contrato.
- **Qué rechacé:** Nada — la implementación es correcta y sigue las restricciones del proyecto.

---

## Resumen de decisiones

| Decisión | Razón |
|----------|-------|
| Usar `201` en POST | El contrato lo define y es el estándar HTTP para creación |
| Validar `title` con `.trim()` | Evita que solo envíen espacios en blanco |
| Default `priority` a `"medium"` | El cliente no envía priority obligatoriamente |
| Default `description` a `""` | Permite crear solicitudes solo con título |
| `404` en GET por ID | El contrato lo define para recursos inexistentes |
