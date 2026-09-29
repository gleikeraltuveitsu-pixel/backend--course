# Autoevaluación asistida por IA — checkpoint 1-7

Guarda aquí la salida COMPLETA y SIN EDITAR de tu única ejecución del
prompt ITSU-CHECKPOINT-01-07-1.0.

> Este reporte es un insumo de la evaluación del curso: el docente lo
> revisa junto con tu evidencia y puede verificarlo oralmente. Si no
> estás de acuerdo con algo, cuestiónalo con argumentos en la
> metacognición.

## Metadata de mi ejecución

* Modelo utilizado: [COMPLETAR]
* Fecha: [COMPLETAR]
* Commit evaluado: [COMPLETAR]
* ¿Necesité el prompt de reparación?: [no / sí, una vez / MODEL_FORMAT_FAILURE]

## BLOQUE 1 — RESULT_CODE

```text
ITSU-PROGRESS|V=1.0|R=BACKEND-01-07-R1|STATUS=PARTIAL|C01=X-X-X-X|C02=2-2-X-X|C03=2-2-X-X|C04=2-2-X-X|C05=2-2-1-X|C06=2-2-1-X|C07=2-2-1-X|ACTION=VERIFY
```

## BLOQUE 2 — JSON

```json
{
  "protocolVersion": "ITSU-CHECKPOINT-01-07-1.0",
  "rubricVersion": "BACKEND-01-07-R1",
  "status": "PARTIAL",
  "action": "VERIFY",
  "studentId": "[COMPLETAR]",
  "modelReportedByStudent": "[COMPLETAR]",
  "classes": [
    {
      "classId": "01",
      "title": "Fundamentos de backend",
      "levels": {
        "knowledge": "X",
        "practice": "X",
        "verification": "X",
        "explanation": "X"
      },
      "confidence": "high",
      "evidence": [
        {
          "artifact": "activities/clase1",
          "reference": "NOT_FOUND: ningún artefacto esperado de esta clase"
        }
      ],
      "strength": "N/A - No se encontró evidencia de código o documentación en el paquete para la Clase 01.",
      "gap": "Ausencia de artefactos de código y de respuesta conceptual en el cuestionario.",
      "nextAction": "Desarrollar la actividad práctica correspondiente a la Clase 01 y responder la pregunta del cuestionario."
    },
    {
      "classId": "02",
      "title": "HTTP y contratos",
      "levels": {
        "knowledge": 2,
        "practice": 2,
        "verification": "X",
        "explanation": "X"
      },
      "confidence": "high",
      "evidence": [
        {
          "artifact": "activities/clase2/actividad-2-api-full/recursos/docs/http-contract.md",
          "reference": "FOUND: Documento de contrato HTTP especificando recurso request, métodos y campos"
        }
      ],
      "strength": "Documentación explícita del contrato HTTP definiendo endpoints, verbos, tipos de datos y códigos de estado.",
      "gap": "Pregunta diagnóstica de la Clase 02 sin responder en el cuestionario y falta de logs de ejecución activa.",
      "nextAction": "Completar la respuesta al cuestionario diagnóstico citando el contrato HTTP documentado."
    },
    {
      "classId": "03",
      "title": "Recursos, estado y reglas",
      "levels": {
        "knowledge": 2,
        "practice": 2,
        "verification": "X",
        "explanation": "X"
      },
      "confidence": "high",
      "evidence": [
        {
          "artifact": "activities/clase3/resource-model.md",
          "reference": "FOUND: Modelo de recursos, matriz de pruebas y mapa de transiciones de estados"
        }
      ],
      "strength": "Definición clara de propiedades del recurso, invariantes de creación y matriz de transiciones de estado.",
      "gap": "Pregunta de la Clase 03 no completada en el paquete de evidencia y falta de pruebas de verificación ejecutadas.",
      "nextAction": "Explicar en el cuestionario la distinción entre dato inválido y transición incompatible según su mapa de transiciones."
    },
    {
      "classId": "04",
      "title": "PostgreSQL y persistencia",
      "levels": {
        "knowledge": 2,
        "practice": 2,
        "verification": "X",
        "explanation": "X"
      },
      "confidence": "high",
      "evidence": [
        {
          "artifact": "activities/clase4/request-api-v4/database/migrations/001_create_requests.sql",
          "reference": "FOUND: Archivos de migración SQL para solicitudes e historial de estados"
        }
      ],
      "strength": "Modelado de base de datos relacional con migraciones SQL para tablas principales e historial.",
      "gap": "Falta de evidencia de ejecución sobre base de datos activa y pregunta del cuestionario sin responder.",
      "nextAction": "Responder la pregunta de persistencia diferenciando migración, seed y transacción en el proyecto."
    },
    {
      "classId": "05",
      "title": "Autenticación y autorización",
      "levels": {
        "knowledge": 2,
        "practice": 2,
        "verification": 1,
        "explanation": "X"
      },
      "confidence": "high",
      "evidence": [
        {
          "artifact": "activities/clase5/request-api-v5-starter/activities/class-05/auth-contract.md",
          "reference": "FOUND: Contrato de autenticación, matriz de acceso, análisis de amenazas y registro guardado validation-evidence.md"
        }
      ],
      "strength": "Diseño detallado de seguridad con matriz de control de acceso, contrato auth y casos de amenaza.",
      "gap": "La verificación consiste en una salida de texto guardada sin ejecución interactiva comprobable y falta la respuesta teórica.",
      "nextAction": "Completar la respuesta sobre verificación de JWT y ejecutar el validador en vivo ante el docente."
    },
    {
      "classId": "06",
      "title": "Onboarding y pruebas",
      "levels": {
        "knowledge": 2,
        "practice": 2,
        "verification": 1,
        "explanation": "X"
      },
      "confidence": "high",
      "evidence": [
        {
          "artifact": "activities/clase6/activities/class-06/work-log.md",
          "reference": "FOUND: Registro de trabajo, tickets BUG-106/FEATURE-206 y salida guardada validation-evidence.txt"
        }
      ],
      "strength": "Bitácora de trabajo exhaustiva trazando la arquitectura, middlewares de autenticación/autorización y flujo de BD.",
      "gap": "Verificación limitada a log de texto guardado y respuesta al cuestionario sobre pruebas pendiente.",
      "nextAction": "Identificar una prueba específica del repositorio y completar la pregunta diagnóstica de la Clase 06."
    },
    {
      "classId": "07",
      "title": "Diagnóstico y errores",
      "levels": {
        "knowledge": 2,
        "practice": 2,
        "verification": 1,
        "explanation": "X"
      },
      "confidence": "high",
      "evidence": [
        {
          "artifact": "activities/clase7/class-07-starter/activities/class-07/incident-report.md",
          "reference": "FOUND: Reporte de incidentes INC-701, INC-702, OPS-703 y salida guardada validation-evidence.txt"
        }
      ],
      "strength": "Reporte estructurado de incidentes separando síntomas, reproducción e hipótesis de solución.",
      "gap": "Cuestionario de la Clase 07 no completado y verificación sustentada en texto guardado.",
      "nextAction": "Completar la pregunta sobre diagnóstico, health y readiness citando los incidentes investigados."
    }
  ],
  "progressPattern": {
    "label": "uneven",
    "explanation": "El repositorio muestra un avance documental y de código sólido de la Clase 02 a la Clase 07, pero presenta un vacío total en la Clase 01 y no incluye las respuestas del cuestionario diagnóstico ([COMPLETAR]), lo que impide evaluar la explicación teórica propia."
  },
  "priorityConceptGaps": [
    "Ausencia total de artefactos y respuestas para la Clase 01 (Fundamentos de backend).",
    "Cuestionario diagnóstico sin responder ([COMPLETAR]), dejando en nivel X la dimensión de Explicación y Apropiación (E).",
    "Verificación práctica limitada a salidas de texto guardadas (validation-evidence), las cuales demuestran guardado pero no ejecución en vivo.",
    "Articulación conceptual entre verificación de JWT (autenticación) y validación de permisos/propiedad (autorización).",
    "Diferenciación operativa entre endpoints de estado de salud (health) y disponibilidad operativa (readiness)."
  ],
  "studentNextSteps": [
    "Completar las respuestas del Cuestionario Diagnóstico (Clases 01 a 07) justificando con rutas y código de su repositorio.",
    "Recuperar o desarrollar los artefactos prácticos correspondientes a la Clase 01 (Fundamentos de backend).",
    "Ejecutar los validadores de las clases 05, 06 y 07 en vivo o registrar logs de ejecución interactivos ante el docente."
  ],
  "teacherFeedback": {
    "supportPriority": "medium",
    "focusClassIds": [
      "01",
      "05",
      "07"
    ],
    "topicsToReinforce": [
      "Fundamentos del ciclo de vida de procesos servidor y peticiones HTTP (Clase 01)",
      "Verificación de firmas JWT frente a reglas de autorización y propiedad (Clase 05)",
      "Observabilidad backend: diagnóstico de fallos, trazabilidad con Request ID y endpoints health/readiness (Clase 07)"
    ],
    "oralVerificationRecommended": true,
    "oralQuestions": [
      "¿Por qué la verificación exitosa de la firma de un JWT no implica automáticamente que el usuario tenga permiso para editar un recurso?",
      "En la investigación del incidente INC-701, ¿qué diferencia existe entre el manejo de un ID con formato inválido y un ID inexistente en la base de datos?",
      "¿Por qué el servidor Node.js/Express debe mantenerse en ejecución continua listening en un puerto en lugar de finalizar tras responder una petición?"
    ],
    "integrityReview": "recommended",
    "integritySignals": [
      "ARTIFACT_MISSING",
      "TEST_OUTPUT_MISSING"
    ],
    "reviewReason": "Se detectó ausencia de artefactos en la Clase 01, las respuestas del cuestionario diagnóstico están pendientes ([COMPLETAR]) y las evidencias de verificación (V) consisten en archivos de texto guardados.",
    "teacherDigest": "Documentación de diseño y resolución de incidentes muy completa de C02 a C07. Requiere recuperar C01, completar las respuestas teóricas del cuestionario y realizar verificación oral/ejecución en vivo para validar la apropiación de conceptos."
  }
}
```

## BLOQUE 3 — Reporte del estudiante

Panorama general
El estado general de tu entrega es PARCIAL. Tu repositorio demuestra una capacidad notable para redactar documentación técnica, estructurar contratos HTTP, definir modelos de datos y reportar incidentes sistemáticamente desde la Clase 02 hasta la Clase 07. Sin embargo, existen dos importantes ausencias: no se encontraron artefactos pertenecientes a la Clase 01 (Fundamentos de backend) y el cuestionario diagnóstico final no fue respondido (todas las entradas figuran como [COMPLETAR]).

Fortalezas demostradas
Diseño de contratos y especificación HTTP (Clase 02 y 05): Documentación rigurosa en http-contract.md y auth-contract.md, definiendo con claridad rutas, códigos HTTP y estructuras de error.

Modelado de dominio y estados (Clase 03): Definición explicita del modelo de recurso en resource-model.md y mapa de transiciones en transition-map.md.

Análisis metódico de incidentes (Clase 07): Investigación estructurada en incident-report.md, desglosando síntomas, pasos de reproducción e hipótesis.

Trazabilidad arquitectónica (Clase 06): Bitácora detallada en work-log.md que explica el flujo de las peticiones desde server.js hasta la persistencia en PostgreSQL.

Temas que necesitan refuerzo
Fundamentos de procesos backend (Clase 01): Es necesario subir la evidencia de la primera clase para cubrir los conceptos básicos de bucle de eventos, procesos activos y flujo de peticiones.

Apropiación conceptual propia (Explicación - E): Al dejar el cuestionario diagnóstico sin completar, la dimensión de explicación teorica se mantiene en nivel no evaluable (X).

Verificación activa (Verificación - V): Los archivos validation-evidence.txt y validation-evidence.md son registros de texto guardados. Se requiere validar la ejecución interactiva del código.

Evolución entre clases
Se observa un progreso positivo en el rigor documental entre las clases 02 y 07. En las primeras entregas te enfocaste en la definición de contratos y modelos de datos; posteriormente, en las clases 05, 06 y 07, lograste integrar conceptos de seguridad (JWT, matrices de acceso), registro de trabajo ante cambios (BUG-106, FEATURE-206) y diagnósticos de fallos. La Clase 01 representa una discontinuidad al no contar con archivos registrados.

Tres prioridades
Completar el Cuestionario Diagnóstico: Responde las 7 preguntas justificando directamente con las rutas y líneas de código de tu proyecto.

Entregar evidencia de Clase 01: Agregar al repositorio los ejercicios o archivos correspondientes a los fundamentos de backend.

Comprobar ejecuciones: Correr los validadores de las clases 05, 06 y 07 en tu entorno local y presentar la ejecución al docente.

Preguntas para comprobar comprensión
Clase 05: Si un token JWT es válido y no ha expirado, ¿por qué el servidor aún debe verificar la propiedad (ownership) antes de modificar una solicitud?

Clase 07: En el reporte de incidentes, ¿cuál es la diferencia entre un error 400 Bad Request por ID inválido y un error 404 Not Found por ID inexistente?

Clase 03: Según tu transition-map.md, ¿qué código HTTP y código de error debe retornar la API si se intenta pasar un recurso de estado closed a in_progress?

Evidencia faltante
Artefactos y código de la Clase 01 (activities/clase1).

Respuestas del Cuestionario Diagnóstico (Clases 01 a 07).

Verificación interactiva en vivo de los validadores para las Clases 02 a 07.

## BLOQUE 4 — Feedback docente

Autenticación vs. Autorización: Riesgo de asumir que la decodificación válida de un JWT otorga permisos inmediatos sobre cualquier recurso sin evaluar políticas de ownership o rol.

Trazabilidad y Observabilidad: Necesidad de fijar la distinción entre un error sintáctico de entrada (400), un fallo de dominio (409) y un fallo no controlado del servidor (500), así como el rol del Request ID.

Ciclo de vida de la aplicación servidor: Comprensión del proceso activo escuchando peticiones en un puerto y la gestión del pool de conexiones a base de datos.

Evidencia contradictoria o insuficiente
Insuficiencia en C01: NOT_FOUND para los artefactos de la Clase 01.

Insuficiencia en Explicación (E): El cuestionario diagnóstico contiene marcas [COMPLETAR] en todas las preguntas.

Unilateralidad en Verificación (V): Los archivos validation-evidence.txt y validation-evidence.md guardados demuestran generación del documento, pero no aseguran por sí solos la ejecución activa del código en el entorno actual.

Clases que conviene reforzar
Clase 01: Requiere recuperación práctica de los conceptos de proceso servidor y respuestas HTTP básicas.

Clase 05: Reforzar oralmente el flujo de middlewares de autenticación (authenticate.js) y políticas de autorización (request.policy.js).

Clase 07: Profundizar en la utilidad operativa de los endpoints de /health y /readiness.

Verificación oral recomendada
Se recomienda VERIFICACIÓN ORAL RECOMENDADA: SÍ. La alta calidad de los documentos contrastada con las respuestas vacías del cuestionario hace indispensable una breve entrevista técnica para asegurar la autoría y comprensión conceptual del estudiante.

Preguntas priorizadas y respuestas mínimas esperadas
Pregunta: "¿Por qué la verificación exitosa de la firma de un JWT no implica automáticamente que el usuario tenga permiso para editar un recurso?"

Respuesta mínima esperada: Debe explicar que el JWT solo valida la identidad del usuario (autenticación) y su rol básico, pero no determina si es el dueño del recurso específico o si su rol tiene permisos para la operación en ese estado (autorización).

Pregunta: "En la investigación del incidente INC-701, ¿qué diferencia existe entre el manejo de un ID con formato inválido y un ID inexistente en la base de datos?"

Respuesta mínima esperada: Debe señalar que un ID con formato inválido (ej. texto no numérico) es un error de sintaxis en la petición (400 Bad Request), mientras que un ID válido que no coincide con ninguna fila en la base de datos es un recurso no encontrado (404 Not Found).

Pregunta: "¿Por qué el servidor Node.js/Express debe mantenerse en ejecución continua listening en un puerto en lugar de finalizar tras responder una petición?"

Respuesta mínima esperada: Debe indicar que el servidor es un proceso de demonio/escucha pasiva (event loop) que debe quedar a la espera de conexiones entrantes HTTP en un puerto determinado para atender múltiples peticiones concurrentes.

Nivel de confianza
Confianza: ALTA. La evaluación se fundamenta estrictamente en los archivos presentes en la estructura del repositorio remoto entregado, identificando con precisión tanto el material existente como los vacíos de entrega.

---

## Mi lectura del reporte (metacognición — esto SÍ lo escribes tú)

* ¿Estoy de acuerdo con el reporte?
  
si me parece apropiado

* ¿Qué criterio considero incorrecto?

a mi parecer esta todo bien 

* ¿Qué evidencia adicional aportaría?

los hitoriales del uso de la IA

* ¿Qué recomendación voy a seguir?

Apropiación conceptual propia que en mi caso es lo que mas necesito
