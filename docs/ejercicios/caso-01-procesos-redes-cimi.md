# Caso de Estudio 01: Catálogo de Procesos Administrativos - Redes CIMI
**Curso:** Implementación de herramientas de IA en la optimización de la productividad (21720210 V1)  
**Ambiente:** Redes CIMI - SENA Girón  
**Uso didáctico:** Taller de diagnóstico y matriz de viabilidad (Estación 01 - Reto MG-A01)

---

## 1. Contexto Operativo
En el Centro Industrial del Mantenimiento Integral (CIMI), la coordinación del área de Redes y Telecomunicaciones gestiona diariamente una alta carga administrativa. El personal de apoyo administrativo invierte entre el 60% y el 75% de su jornada laboral en tareas manuales de transcripción, archivo, redacción de respuestas rutinarias y consolidación de reportes en hojas de cálculo.

Para este ejercicio, el aprendiz debe evaluar los siguientes 8 procesos reales del centro, determinar su viabilidad para ser optimizados con IA y clasificar qué tipo de tecnología requiere (Regla simple / Macro tradicional vs. IA Generativa vs. IA Predictiva vs. No viable por confidencialidad).

---

## 2. Inventario de Procesos para Diagnóstico

### Proceso P1: Radicación y Pre-clasificación de PQRS de Aprendices
- **Descripción:** Llegan correos de aprendices con solicitudes heterogéneas (solicitud de paz y salvo, reclamos de notas, peticiones de aplazamiento, denuncias de convivencia). El funcionario debe leer cada correo, tipificar el tipo de solicitud, identificar la ficha del aprendiz y remitir al instructor o coordinador correspondiente.
- **Volumen:** 40 a 60 correos diarios.
- **Tiempo actual:** 3 a 4 horas diarias.
- **Dolor principal:** Textos desordenados, faltas de ortografía, datos incompletos.

### Proceso P2: Elaboración de Actas de Comité de Evaluación y Seguimiento
- **Descripción:** Durante las reuniones semanales de comité (2 horas de duración), se graban las intervenciones o se toman notas rápidas. Posteriormente, el administrativo pasa en limpio los acuerdos, las sanciones, los compromisos pedagógicos y la lista de asistentes en el formato institucional SENA.
- **Volumen:** 3 a 5 actas semanales (8 a 15 páginas cada una).
- **Tiempo actual:** 5 a 6 horas por acta.
- **Dolor principal:** Dificultad para resumir sin perder detalles jurídicos y compromisos con fechas límite.

### Proceso P3: Cálculo Matemático de Horas y Liquidación de Honorarios de Instructores
- **Descripción:** Revisar planillas de asistencia y cruzar las horas programadas en Sofía Plus con las horas efectivamente ejecutadas por cada instructor contratista, multiplicando por el valor hora pactado para emitir el certificado de cumplimiento.
- **Volumen:** 35 instructores mensuales.
- **Tiempo actual:** 2 días completos al final de cada mes.
- **Dolor principal:** Errores aritméticos humanos por cansancio visual.
- **Pregunta crítica para el aprendiz:** ¿Debe usar un modelo de lenguaje (LLM) para hacer estas operaciones matemáticas o es un riesgo crítico de alucinación?

### Proceso P4: Redacción de Memorandos y Circulares Informativas Internas
- **Descripción:** Redactar comunicados oficiales dirigidos a aprendices o instructores sobre fechas de matrículas, mantenimientos preventivos en los ambientes de Redes CIMI, o normas de seguridad en laboratorios.
- **Volumen:** 4 a 6 comunicados al mes.
- **Tiempo actual:** 1.5 horas por comunicado (redacción, estilo, tono formal SENA).
- **Dolor principal:** Bloqueo del redactor, inconsistencias en el tono formal e institucional.

### Proceso P5: Análisis y Detección Temprana de Aprendices en Riesgo de Deserción
- **Descripción:** Cruzar variables de fallas acumuladas, notas por debajo de 3.5 en las primeras 4 semanas, estrato socioeconómico y reporte de participación en talleres para identificar aprendices que probablemente abandonarán la formación antes del tercer trimestre.
- **Volumen:** 400 aprendices activos en el área.
- **Tiempo actual:** Se detecta tarde, cuando el aprendiz ya ha desertado.
- **Dolor principal:** Falta de capacidad de análisis predictivo sobre los datos existentes.

### Proceso P6: Consolidación y Verificación de Inventario de Equipos de Laboratorio
- **Descripción:** Comparar el listado físico de switches, routers, patch cords y herramientas de crimpado con el registro en el sistema de inventarios del centro. Se reportan novedades como equipos en mantenimiento, bajas o traslados entre ambientes.
- **Volumen:** Listado de 650 ítems.
- **Tiempo actual:** 16 horas al mes.
- **Dolor principal:** Nombres de modelos ligeramente diferentes ("Cisco Catalyst 2960" vs "Switch 2960-Cisco"), dificultando el cruce tradicional en Excel (BUSCARV).

### Proceso P7: Custodia y Emisión de Conceptos Disciplinarios Confidenciales
- **Descripción:** Documentos que contienen información médica reservada, antecedentes o testimonios confidenciales de aprendices en procesos sancionatorios graves.
- **Volumen:** 2 a 3 casos por trimestre.
- **Tiempo actual:** Variable.
- **Dolor principal:** Riesgo legal extremo si la información trasciende.
- **Pregunta crítica para el aprendiz:** ¿Se puede ingresar este texto a ChatGPT o Copilot gratuito en la nube? ¿Qué exige la Ley 1581 de 2012 de Habeas Data?

### Proceso P8: Generación de Respuestas a Preguntas Frecuentes de Aspirantes a Cursos
- **Descripción:** Responder dudas repetitivas que llegan al WhatsApp o correo institucional sobre requisitos de ingreso, horarios de cursos complementarios (como el curso 21720210), uso del uniforme y ubicación de los ambientes en el CIMI Girón.
- **Volumen:** 80 consultas semanales.
- **Tiempo actual:** 1.5 horas diarias.
- **Dolor principal:** Interrupción constante del trabajo profundo para responder siempre lo mismo.

---

## 3. Instrucción para el Aprendiz
1. Analice cada uno de los 8 procesos utilizando la **Matriz de Viabilidad de IA** suministrada en `docs/01-fundamentos.md`.
2. Para cada proceso defina:
   - Nivel de viabilidad (Alta, Media, Nula/Prohibida).
   - Tecnología sugerida (Regla fija / Excel tradicional, IA Generativa, IA Predictiva / Machine Learning, o Proceso Manual Estricto).
   - Riesgo potencial si la IA comete un error (Alucinación, filtración de datos sensibles, desvío de directrices).
   - Medida de salvaguarda y criterio humano requerido.
