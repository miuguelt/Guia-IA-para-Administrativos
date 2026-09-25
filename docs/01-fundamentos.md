# Estación 01: Diagnóstico de Procesos, Mapeo de Flujos y Criterio de Viabilidad para IA
**Programa:** Implementación de herramientas de inteligencia artificial en la optimización de la productividad (21720210 V1)  
**Ambiente de Formación:** Redes CIMI · SENA Girón  
**Fase Pedagógica:** Reflexión inicial · **Duración:** 6 horas (Presencial + Taller)  
**Resultado de Aprendizaje (RAP):** RA1. Establecer uso de la inteligencia artificial según requerimientos de optimización del proceso productivo.  
**Evidencia Asociada:** MG-A01 (Evidencia de Conocimiento - Matriz de Viabilidad y Diagnóstico)

---

## 1. Fundamentos: ¿Por qué y cuándo automatizar con Inteligencia Artificial?

En la gestión administrativa moderna, el tiempo laboral suele disiparse en actividades de bajo valor intelectual pero alta carga operativa: transcribir datos de un formato a otro, redactar respuestas rutinarias a quejas repetitivas, ordenar notas de reuniones y consolidar planillas.

Sin embargo, el error más común al intentar "innovar" con tecnología es aplicar Inteligencia Artificial a problemas que se resuelven mejor con una simple fórmula de Excel, o peor aún, intentar usar IA en procesos con datos altamente confidenciales donde el riesgo legal supera cualquier beneficio.

### 1.1 Tipos de Tecnologías de Automatización en la Administración

```text
┌─────────────────────────┬──────────────────────────────────┬─────────────────────────────────┐
│ TECNOLOGÍA              │ ¿PARA QUÉ SIRVE?                 │ EJEMPLO ADMINISTRATIVO          │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────────┤
│ Reglas Fijas / Macros   │ Tareas mecánicas, estructuradas, │ Liquidar horas fijas en Excel,  │
│ (Automatización clásica)│ números exactos, sin ambigüedad. │ enviar recordatorios de fechas. │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────────┤
│ Inteligencia Artificial │ Procesar lenguaje natural, texto │ Clasificar quejas (PQRS),       │
│ Generativa (LLMs)       │ no estructurado, redactar actas. │ resumir documentos, borradores. │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────────┤
│ Inteligencia Artificial │ Predecir comportamientos futuros,│ Detectar deserción de aprendices│
│ Predictiva (ML)         │ encontrar patrones en datos.     │ proyectar compras trimestrales. │
├─────────────────────────┼──────────────────────────────────┼─────────────────────────────────┤
│ Proceso Manual Estricto │ Casos de alto riesgo jurídico,   │ Conceptos disciplinarios graves,│
│ (Criterio Humano Puro)  │ datos médicos reservados.        │ despidos, fallos de tutela.     │
└─────────────────────────┴──────────────────────────────────┴─────────────────────────────────┘
```

### 1.2 La Regla de los Tres Filtros de Viabilidad
Antes de llevar una tarea a una IA, el administrativo debe pasarla por tres preguntas filtro:
1. **Filtro de Confidencialidad:** ¿Contiene datos personales sensibles (salud, cédulas, expedientes disciplinarios)? Si la respuesta es sí y no se pueden anonimizar, **SE PROHÍBE EL USO DE IA PÚBLICA**.
2. **Filtro de Aritmética:** ¿La tarea consiste principalmente en sumar, multiplicar o conciliar cifras numéricas exactas? Si la respuesta es sí, **USE EXCEL O UNA MACRO, NO UN LLM**.
3. **Filtro de Variabilidad:** ¿La entrada es texto variado, desordenado, con faltas de ortografía o redacción libre (correos, actas)? Si la respuesta es sí, **LA IA ES LA HERRAMIENTA ÓPTIMA**.

---

## 2. Ejemplo Resuelto: Evaluación de Viabilidad en Proceso Real

### Proceso Evaluado: Recepción y Respuesta a Peticiones de Certificados de Estudio
- **Situación:** La coordinación recibe diariamente 30 correos de ex-aprendices solicitando duplicados de diplomas o certificaciones de horas cursadas. Los aprendices escriben de formas muy distintas ("hola me llamo pablo quiero mi diploma", "Solicitud formal de certificado ficha 2410...").
- **Diagnóstico del Proceso:**
  - *Entrada:* Texto no estructurado (correo electrónico).
  - *Tarea:* Identificar el tipo de certificado, el programa de formación y verificar si el aprendiz adjuntó copia del documento de identidad.
  - *Decisión Técnica:* **VIABILIDAD ALTA PARA IA GENERATIVA**.
  - *Diseño de la Solución:* Un asistente de IA analiza el cuerpo del correo, extrae los datos clave a una tabla normalizada y redacta el borrador de respuesta indicando si falta algún requisito.
  - *Control Humano (HITL):* La secretaria revisa la tabla generada en 15 segundos y da clic en "Aprobar y Enviar".
  - *Impacto medido:* Reducción de tiempo de 8 minutos por correo a 1 minuto por correo (Ahorro del 87.5% de tiempo).

---

## 3. Contraejemplo de Riesgo: El Fallo por Automatización a Ciegas

### Caso: "La Liquidación de Contratistas con ChatGPT"
- **El Error:** Un auxiliar administrativo intentó acelerar la liquidación mensual de 20 instructores contratistas pegando el reporte de asistencia en ChatGPT y pidiéndole: *"Multiplica las horas por $48.500 y dame la tabla final para firmar la orden de pago"*.
- **La Falla:** La IA multiplicó correctamente 16 de las filas, pero en 4 filas calculó valores con diferencias de hasta $350.000 COP debido a la naturaleza estocástica de los tokens numéricos.
- **Consecuencia:** La coordinación firmó la cuenta de cobro con errores y Control Interno devolvió el trámite 2 semanas después, bloqueando el pago a los instructores e iniciando un proceso de indagación administrativa.
- **Lección Aprendida:** **La IA Generativa no es una calculadora**. Toda operación matemática debe ser ejecutada mediante fórmulas de hoja de cálculo.

---

## 4. El Protocolo V.E.R.A. (Metodología de Trabajo Profesional)

Para evitar estos errores operativos, durante todas las estaciones de este curso aplicaremos de forma obligatoria el **Protocolo V.E.R.A.**, el cual rige el trabajo administrativo asistido por IA:

1. **V**erificar la viabilidad: Asegurar que la tarea no incluye cálculos ciegos o datos confidenciales sin sanitizar.
2. **E**jecutar (TDD - Test Driven Development): Probar el prompt en un caso controlado antes de aplicarlo masivamente.
3. **R**evisar y Refinar: Detectar alucinaciones, sesgos de complacencia o pérdida de contexto, y ajustar las instrucciones.
4. **A**tribuir (HITL): El humano asume la responsabilidad legal y final, firmando el documento o aprobando el dato, jamás delegando la firma a la máquina.

---

## 5. Práctica Guiada: Análisis de los 8 Procesos de Redes CIMI

Abra el documento [Caso de Estudio 01](file:///c:/Users/Miguel/Documents/Aplicaciones/_projects/Guia%20IA%20para%20Administrativos/docs/ejercicios/caso-01-procesos-redes-cimi.md) y analice los 8 procesos del área:
1. P1: Radicación de PQRS de Aprendices
2. P2: Elaboración de Actas de Comité
3. P3: Liquidación de Honorarios de Instructores
4. P4: Redacción de Comunicados y Circulares
5. P5: Detección Temprana de Deserción
6. P6: Inventario de Equipos de Laboratorio
7. P7: Conceptos Disciplinarios Confidenciales
8. P8: Preguntas Frecuentes de Aspirantes

---

## 6. Taller Autónomo y Registro de Evidencia MG-A01

Complete en el formulario interactivo de esta estación (o en su archivo Markdown de evidencias) los siguientes campos obligatorios:

1. **Selección del Proceso:** Elija uno de los procesos del centro (o uno equivalente de su propio puesto de trabajo administrativo).
2. **Flujograma de Entrada y Salida:** Describa el proceso actual (quién entrega la información, cómo llega, qué operaciones manuales se hacen y a quién se entrega el resultado).
3. **Matriz de Viabilidad Diligenciada:**
   - ¿Por qué es viable para IA?
   - ¿Qué tipo de IA requiere (Generativa, Predictiva, Híbrida)?
   - ¿Qué datos sensibles deben ser filtrados antes de procesar?
   - ¿Cuál es el riesgo mayor si la IA falla y cómo se previene?
4. **Métrica Proyectada de Productividad:** Tiempo manual actual vs. Tiempo estimado asistido con IA.

### Lista de Chequeo de Aceptación (Criterio de Evaluación RA1)
- [ ] El proceso seleccionado tiene justificación técnica clara (no es un capricho tecnológico).
- [ ] Se identifican con precisión las entradas, transformaciones y salidas del proceso.
- [ ] Se declaran los riesgos de confidencialidad y la postura frente a la Ley 1581 de 2012.
- [ ] No se delegan operaciones matemáticas críticas puramente a modelos de lenguaje sin salvaguarda.
