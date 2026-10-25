/**
 * Selector Interactivo y Manual Práctico de Situaciones de Oficina con IA
 * Aula de IA · Productividad Administrativa (SENA)
 * Módulo puro y accesible para cliente web y Node.js.
 */
(function () {
  'use strict';

  var DEFAULT_SITUATIONS = [
    {
        "id": "comites-evaluacion",
        "dimension": "sede-coordinacion",
        "dimensionLabel": "Gestión de Sede y Coordinación",
        "category": "sede-coordinacion",
        "categoryLabel": "Gestión de sede",
        "title": "Comités de evaluación: citaciones y matrices de compromisos",
        "shortTitle": "Citaciones y matrices de comité",
        "icon": "🏛️",
        "problemDescription": "Preparación de borradores de citación motivada y matrices de compromisos para comités de evaluación y seguimiento de aprendices, preservando que el juicio disciplinario sea exclusivamente humano.",
        "recommendedAiTool": "Chat de IA autorizado institucionalmente (por ejemplo, Copilot o Gemini en entorno seguro) + Procesador de texto (Word o Docs).",
        "securityShield": "Ley 1581 de 2012 (Habeas Data). Proteger la identidad de menores de edad o situaciones de salud. Nunca solicitar a la IA que califique faltas ni que emita sanciones disciplinarias; el debido proceso exige juicio y decisión humana indelegable.",
        "accuracyShield": "Citar expresamente los hechos reportados por el instructor y los artículos del Reglamento del Aprendiz SENA. Si un informe no precisa fecha o soporte de descargos, registrar «no consta soporte» en el expediente. La decisión disciplinaria es un juicio humano indelegable.",
        "sampleData": "Reporte disciplinario: Ficha 21720210. Aprendiz con tres inasistencias injustificadas consecutivas en marzo. Se registran llamados de atención verbales pero no constan descargos escritos ni justificaciones médicas en el expediente.",
        "basePrompt": "Actúa como secretario técnico de comité de evaluación y seguimiento del SENA. Analiza el reporte y prepara dos productos de trabajo:\n1. Borrador formal de citación al aprendiz indicando hechos objetivos, fecha y derechos de contradicción según el Reglamento del Aprendiz (es-CO).\n2. Matriz de compromisos preliminar con columnas: [Obligación académica o actitudinal] | [Acción concreta esperada] | [Plazo de cumplimiento] | [Evidencia verificable] | [Responsable de seguimiento].\nLímites: No prejuzgues la responsabilidad ni sugieras sanciones disciplinarias. Si falta un soporte o fecha, regístralo como «pendiente de verificar». Rotula todo el documento como «Borrador para comité».",
        "challengeId": "reto-5",
        "challengeLink": "#m03-implementacion",
        "challengeName": "Reto 5 · Trazabilidad de acuerdos y compromisos",
        "productFormat": "Borrador de citación formal y matriz de compromisos en Word o Docs."
    },
    {
        "id": "novedades-plataformas",
        "dimension": "sede-coordinacion",
        "dimensionLabel": "Gestión de Sede y Coordinación",
        "category": "sede-coordinacion",
        "categoryLabel": "Gestión de sede",
        "title": "Identificar novedades en SOFIA Plus y Zajuna sin modificar registros oficiales",
        "shortTitle": "Trámites en SOFIA y Zajuna",
        "icon": "💻",
        "problemDescription": "Detección de inconsistencias y trámites pendientes entre reportes de SOFIA Plus y Zajuna (traslados, retiros voluntarios, estados en curso) a partir de exportaciones en texto.",
        "recommendedAiTool": "Chat de IA para detección de patrones o Antigravity + Hoja de cálculo para cotejo administrativo.",
        "securityShield": "Ley 1581 de 2012. Anonimizar identificaciones antes de cargar datos a herramientas externas. La IA nunca tiene acceso directo ni permiso de edición en las bases de datos de SOFIA Plus ni Zajuna.",
        "accuracyShield": "La IA solo analiza el archivo exportado y resalta discrepancias; si un dato no figura en el reporte, debe registrarse como «no consta». Toda modificación en el sistema oficial debe realizarse por el funcionario humano autorizado en la plataforma oficial sin alterar la fuente original.",
        "sampleData": "Muestra de reporte: Aprendiz SIM-01 (SOFIA: En formación, Zajuna: Activo); Aprendiz SIM-02 (SOFIA: Cancelado, Zajuna: Ingreso reciente reportado); Aprendiz SIM-03 (SOFIA: En formación, Zajuna: Sin estado registrado).",
        "basePrompt": "Actúa como auxiliar de administración educativa del SENA. Analiza la siguiente lista de aprendices y estados reportados en SOFIA Plus y Zajuna:\n1. Detecta discrepancias de estado entre ambas plataformas y celdas sin información.\n2. Genera una lista de verificación con columnas: [ID anonimizado] | [Estado SOFIA] | [Estado Zajuna] | [Alerta de inconsistencia] | [Trámite administrativo sugerido].\n3. Redacta una nota de remisión para la coordinación académica con los casos que requieren subsanación manual.\nLímites: Recuerda que la IA no modifica registros oficiales. Rotula cada hallazgo como «novedad por verificar en plataforma».",
        "challengeId": "reto-0",
        "challengeLink": "#m01-fundamentos",
        "challengeName": "Reto 0 · Semáforo de datos y privacidad en plataformas",
        "productFormat": "Lista de cotejo en tabla y nota para coordinación en formato borrador."
    },
    {
        "id": "cuentas-cobro",
        "dimension": "sede-coordinacion",
        "dimensionLabel": "Gestión de Sede y Coordinación",
        "category": "sede-coordinacion",
        "categoryLabel": "Gestión de sede",
        "title": "Cuentas de cobro: cotejo de listas de chequeo e informes de contratistas",
        "shortTitle": "Cuentas de cobro y supervisión",
        "icon": "📑",
        "problemDescription": "Revisión sistemática de cuentas de cobro e informes mensuales de actividades de contratistas frente a la lista de chequeo de supervisión antes del visto bueno.",
        "recommendedAiTool": "Chat de IA con lectura documental cruzada + Plantilla de supervisión institucional en Word o Excel.",
        "securityShield": "Ley 1581 de 2012. Mantener reserva estricta de cuentas bancarias y datos personales. Validar la planilla de aportes a seguridad social (PILA) únicamente en los canales oficiales autorizados.",
        "accuracyShield": "La IA contrasta que cada obligación contractual cuente con su actividad e informe soporte. El visto bueno y la certificación de cumplimiento son responsabilidad indelegable del supervisor humano.",
        "sampleData": "Contrato SIM-045: Obligación 1: Ejecutar 40 horas de formación (Informe adjunta 40 h, lista de 18 aprendices). Obligación 2: Entregar plan de mejoramiento (Informe indica \"en proceso\", no anexa documento). Planilla PILA: pagada.",
        "basePrompt": "Actúa como apoyo a la supervisión contractual del SENA. Contrasta el informe de actividades del contratista frente a las obligaciones contractuales y la lista de chequeo:\n1. Construye una matriz de supervisión: [Obligación contractual] | [Actividad reportada] | [Soporte adjunto] | [Estado: Cumple / Pendiente soporte / No consta] | [Observación para el contratista].\n2. Si falta algún soporte o cálculo de horas, redacta un requerimiento formal y amable solicitando la subsanación.\nLímites: No emitas aprobaciones ni des por recibidos a satisfacción entregables no constatados. La certificación de pago es exclusiva del supervisor designado.",
        "challengeId": "reto-integrador",
        "challengeLink": "#m05-cierre",
        "challengeName": "Reto integrador · Auditoría y supervisión de contratos",
        "productFormat": "Matriz de cotejo de supervisión y requerimiento de subsanación en Word o Docs."
    },
    {
        "id": "pqrs-urgentes",
        "dimension": "sede-coordinacion",
        "dimensionLabel": "Gestión de Sede y Coordinación",
        "category": "sede-coordinacion",
        "categoryLabel": "Gestión de sede",
        "title": "Radicación de PQRS: clasificación y preparación de respuestas revisables",
        "shortTitle": "Responder PQRS urgentes",
        "icon": "📩",
        "problemDescription": "Llegada de peticiones ciudadanas extensas o confusas donde el usuario apela a la urgencia para solicitar trámites o información.",
        "recommendedAiTool": "Chat de IA autorizado por la entidad + Word o Docs para el borrador final.",
        "securityShield": "Ley 1581 de 2012 (Habeas Data). Nunca ingresar nombres completos, números de cédula, correos personales ni datos sensibles de salud. Anonimizar o rotular «autorización pendiente».",
        "accuracyShield": "Separar tajantemente hechos narrados por el ciudadano de registros oficiales confirmados. Citar cada hecho con frase textual. Si un dato o anexo falta, registrar «no consta en expediente». Los plazos legales los confirma la dependencia responsable.",
        "sampleData": "Petición PC-01: Usuario solicita certificación laboral urgente afirmando haber trabajado como instructor en 2024. No adjunta cédula ni número de contrato. Exige respuesta en 24 horas.",
        "basePrompt": "Actúa como profesional de atención ciudadana del SENA. Analiza la siguiente petición ciudadana aplicando el método CRTT:\nContexto: Respuesta a una petición; los plazos legales los confirma la dependencia responsable.\nRol: Asistente de redacción institucional con tono claro, cordial y neutral (es-CO).\nTarea: (1) Extraer la petición concreta en una frase, (2) Listar hechos sustentados, (3) Listar datos que NO constan y deben aclararse, y (4) Proyectar borrador formal de respuesta sin conceder derechos no autorizados.\nLímites: Cita únicamente los hechos del texto; marca «no consta» ante cualquier vacío y formula preguntas de subsanación.\n\n[Pegar aquí el texto de la solicitud sin datos personales]",
        "challengeId": "reto-2",
        "challengeLink": "#m02-diseno",
        "challengeName": "Reto 2 · Prepara dos respuestas para revisión",
        "productFormat": "Página de resultado con dos respuestas revisables; después, Word o Docs para la plantilla institucional."
    },
    {
        "id": "actas-reunion",
        "dimension": "gestion-documental",
        "dimensionLabel": "Gestión Documental y Flujos",
        "category": "gestion-documental",
        "categoryLabel": "Gestión documental",
        "title": "Actas y compromisos: acuerdos y plazos con marcación temporal precisa",
        "shortTitle": "Redactar actas de reunión",
        "icon": "📝",
        "problemDescription": "Grabaciones o notas desordenadas de reuniones de comité que requieren transformarse rápidamente en actas oficiales trazables.",
        "recommendedAiTool": "Chat de IA para procesamiento de lenguaje natural + Procesador de texto (Word / Docs).",
        "securityShield": "Ley 1581 de 2012. Omitir comentarios de índole personal o deliberaciones privadas ajenas a las funciones del comité. Tratar nombres con reserva si la reunión involucra procesos disciplinarios.",
        "accuracyShield": "Diferenciar taxativamente acuerdos aprobados de simples propuestas, debates o dudas. Todo compromiso debe indicar la marca temporal o minuto de origen exacto (ej. «03:12»). Si un responsable no estuvo presente o no se pactó fecha, declarar «no consta en acta» y registrar «Responsable pendiente» sin suponer compromisos.",
        "sampleData": "Notas de reunión: Minuto 02:15: Se propone adelantar horario de talleres. Minuto 07:40: Coordinador aprueba mantener el cronograma sin cambios. Minuto 12:10: Ingeniero Pérez acuerda entregar informe técnico el viernes.",
        "basePrompt": "Actúa como secretario de comité institucional. Procesa la siguiente transcripción o notas de reunión y genera:\n1. Resumen ejecutivo de temas tratados en un párrafo por punto.\n2. Matriz de compromisos con las siguientes columnas: [Minuto/Punto] | [Tipo: Acuerdo / Propuesta] | [Compromiso concreto] | [Responsable] | [Fecha límite] | [Estado / Pendiente].\n3. Lista de puntos que quedaron sin decisión o que requieren confirmación posterior.\nLímites: Si un responsable o fecha no fue pactado expresamente, escribe «Pendiente de asignación»; no des por aprobado lo que fue solo una sugerencia.\n\n[Pegar aquí notas o transcripción de la reunión]",
        "challengeId": "reto-5",
        "challengeLink": "#m03-implementacion",
        "challengeName": "Reto 5 · Acta que distingue acuerdo de intención",
        "productFormat": "Página de resultado con el acta por minutos; después, Word o Docs para la plantilla de la dependencia."
    },
    {
        "id": "limpieza-excel",
        "dimension": "gestion-documental",
        "dimensionLabel": "Gestión Documental y Flujos",
        "category": "gestion-documental",
        "categoryLabel": "Gestión documental",
        "title": "Normalización de tablas: celdas vacías e inconsistencias con reglas reproducibles",
        "shortTitle": "Normalizar tablas en Excel",
        "icon": "📊",
        "problemDescription": "Bases de datos de aprendices o registros administrativos con celdas vacías, espacios dobles, inconsistencias ortográficas y duplicados.",
        "recommendedAiTool": "IA de análisis de datos estructurados + Microsoft Excel / Google Sheets.",
        "securityShield": "Ley 1581 de 2012. Si la base contiene documentos de identidad o datos de contacto, procesar fórmulas localmente en Excel o usar exclusivamente entornos institucionales autorizados.",
        "accuracyShield": "Principio de inmutabilidad: conservar siempre las columnas y archivos de origen sin sobreescribir. Las celdas vacías o ambiguas no se rellenan con datos inventados; se rotulan con «REVISAR» o «no consta dato». Los posibles duplicados no se eliminan a ciegas; se resaltan y se conservan para auditoría con notas explicativas.",
        "sampleData": "Muestra: Fila 1: \" Vélez \", \"ACTIVO \"; Fila 2: \"velez\", \"\"; Fila 3: \"Puente Nacional\", \"FINALIZADO\"; Fila 4: \"Vélez\", \"pendiente\".",
        "basePrompt": "Actúa como especialista en calidad de datos. Revisa la siguiente muestra de tabla administrativa y diseña una regla de transformación normalizada:\n1. Identifica anomalías (espacios sobrantes, variantes tipográficas, vacíos y posibles duplicados).\n2. Escribe la fórmula exacta de Excel para crear una columna normalizada limpia (usando ESPACIOS, MAYUSC, SI, etc.).\n3. Define una regla estricta: registros con campos vacíos esenciales deben etiquetarse como «REVISAR».\n4. Entrega la tabla con los datos normalizados a la derecha del original y un resumen del conteo de registros antes y después.\n\n[Pegar aquí muestra de datos de la tabla]",
        "challengeId": "reto-6",
        "challengeLink": "#m03-implementacion",
        "challengeName": "Reto 6 · Datos desordenados con una regla reproducible",
        "productFormat": "Página de resultado con la tabla antes y después; después, Excel o Sheets para comprobar la regla con una fórmula."
    },
    {
        "id": "comunicaciones-oficiales",
        "dimension": "gestion-documental",
        "dimensionLabel": "Gestión Documental y Flujos",
        "category": "gestion-documental",
        "categoryLabel": "Gestión documental",
        "title": "Comunicaciones oficiales: memorandos y oficios con estilo institucional",
        "shortTitle": "Comunicaciones oficiales",
        "icon": "📜",
        "problemDescription": "Redacción de memorandos, oficios y circulares internas con lenguaje claro y respetuoso (es-CO), cumpliendo lineamientos de comunicación institucional.",
        "recommendedAiTool": "Chat de IA autorizado + Plantilla institucional en Word o Docs.",
        "securityShield": "Ley 1581 de 2012. No incluir datos sensibles o privados en circulares masivas. Preservar la reserva en memorandos de gestión interna.",
        "accuracyShield": "Tono institucional claro y profesional. Citar directivas, circulares o lineamientos vigentes con su número y año oficial. Si un dato no figura en la solicitud, registrar «no consta». El borrador requiere revisión y firma del funcionario humano autorizado.",
        "sampleData": "Solicitud de sala URG-01: Se solicita auditorio para taller urgente de 18 directivos mañana. Lineamiento exige 5 días de anticipación y aval de coordinación.",
        "basePrompt": "Actúa como redactor administrativo del SENA. Redacta una comunicación oficial (oficio institucional) respondiendo a una solicitud conforme a la directiva aplicable:\n1. Saludo formal y referencia al número de radicado o asunto.\n2. Explicación fundamentada citando los apartados vigentes del lineamiento institucional.\n3. Especificación de los datos que deben subsanarse o los pasos a seguir con cortesía y claridad.\nLímites: Conserva el tono en español de Colombia institucional. No apruebes excepciones que dependan de otra dependencia y rotula la respuesta como «Borrador para firma».",
        "challengeId": "reto-1",
        "challengeLink": "#m01-fundamentos",
        "challengeName": "Reto 1 · Delimitación de solicitud formal y lineamiento",
        "productFormat": "Oficio institucional en procesador de texto con plantilla oficial."
    },
    {
        "id": "diseno-procedimientos",
        "dimension": "gestion-documental",
        "dimensionLabel": "Gestión Documental y Flujos",
        "category": "gestion-documental",
        "categoryLabel": "Gestión documental",
        "title": "Diseño de procedimientos: modelar flujos de trabajo con puntos de control humano",
        "shortTitle": "Diseño de procedimientos y flujos",
        "icon": "🔄",
        "problemDescription": "Modelado de flujos de trabajo paso a paso con puntos de control humano obligatorio (HITL) para evitar reprocesos y decisiones automatizadas indebidas.",
        "recommendedAiTool": "Chat de IA para estructuración de pasos + herramienta de diagramas (Mermaid, SVG, Canva o draw.io).",
        "securityShield": "Ley 1581 de 2012. Garantizar que en cada paso de captura de datos exista aviso de privacidad y canal seguro de almacenamiento.",
        "accuracyShield": "Todo flujo asistido por IA debe incluir un punto de control humano obligatorio (HITL) ante casos urgentes, sensibles o donde un dato no consta en la solicitud. Ninguna decisión crítica se aprueba de forma automática.",
        "sampleData": "Flujo de reservas: Caso 1: Solicitud completa con 6 días de anticipación -> pasa a revisión. Caso 2: Falta horario -> detenida para subsanación. Caso 3: Solicitud urgente -> parada para concepto humano.",
        "basePrompt": "Actúa como diseñador de procesos administrativos del SENA. Estructura un procedimiento de atención paso a paso para trámites del centro:\n1. Define la secuencia de etapas: [Entrada/Radicación] -> [Filtro y validación inicial con IA] -> [Punto de control humano obligatorio] -> [Ejecución] -> [Notificación y archivo].\n2. Para cada etapa indica: Responsable, Entrada requerida, Acción y Criterio de parada.\n3. Genera el código de diagrama en Mermaid (graph TD) o esquema visual SVG para ilustrar el recorrido.\nLímites: Prohíbe expresamente que la IA tome decisiones discrecionales sin supervisión.",
        "challengeId": "reto-7",
        "challengeLink": "#m03-implementacion",
        "challengeName": "Reto 7 · Flujo asistido con puntos de parada humana",
        "productFormat": "Diagrama de flujo y manual de procedimiento con puntos de control humano."
    },
    {
        "id": "explicaciones-medida",
        "dimension": "aprendizaje-continuo",
        "dimensionLabel": "Aprendizaje Continuo y Método Socrático",
        "category": "aprendizaje-continuo",
        "categoryLabel": "Método socrático",
        "title": "Explicaciones a tu medida: conceptos complejos con analogías cotidianas y laborales",
        "shortTitle": "Explicaciones a tu medida",
        "icon": "💡",
        "problemDescription": "Comprensión de conceptos técnicos, normativos o matemáticos difíciles (como línea base, sesgo algorítmico o ponderaciones) mediante explicaciones adaptadas a la experiencia del funcionario.",
        "recommendedAiTool": "Chat de IA con rol de tutor pedagógico socrático.",
        "securityShield": "Ley 1581 de 2012 (Habeas Data). No compartir información institucional reservada para pedir explicaciones conceptuales; usar escenarios didácticos generales.",
        "accuracyShield": "Las analogías simplifican la comprensión pero no sustituyen el rigor normativo. Si un concepto carece de soporte oficial, registrar «no consta». Toda aplicación en la oficina requiere criterio humano.",
        "sampleData": "Duda conceptual: «No entiendo qué es una tasa de deserción porcentual ni por qué no puedo comparar centros con distinta cantidad de matriculados sin mirar el denominador».",
        "basePrompt": "Actúa como tutor socrático paciente y pedagógico en gestión administrativa del SENA. Explícame el concepto que te presentaré siguiendo esta metodología:\n1. Explica el concepto central usando una analogía cotidiana sencilla (por ejemplo, de cocina, transporte o una oficina).\n2. Presenta un ejemplo práctico ambientado en un centro de formación del SENA.\n3. Resume la idea en 3 viñetas claras sin tecnicismos innecesarios (es-CO).\n4. Hazme una pregunta breve de reflexión para confirmar que comprendí la lógica de fondo.\n\n[Concepto a explicar: ...]",
        "challengeId": "preparacion",
        "challengeLink": "#preparacion",
        "challengeName": "Preparación · Conceptos clave y línea base",
        "productFormat": "Explicación conceptual con analogía y pregunta de comprobación."
    },
    {
        "id": "preguntas-comprobacion",
        "dimension": "aprendizaje-continuo",
        "dimensionLabel": "Aprendizaje Continuo y Método Socrático",
        "category": "aprendizaje-continuo",
        "categoryLabel": "Método socrático",
        "title": "Preguntas de comprobación: casos de práctica para evaluar tu propio criterio",
        "shortTitle": "Preguntas de comprobación",
        "icon": "❓",
        "problemDescription": "Autoevaluación de conocimientos y verificación de criterio antes de resolver trámites reales en la oficina, mediante preguntas con casos prácticos.",
        "recommendedAiTool": "Chat de IA configurado como examinador socrático interactivo.",
        "securityShield": "Ley 1581 de 2012. Usar únicamente casos hipotéticos preparados; no suministrar datos reales de expedientes o aprendices.",
        "accuracyShield": "El tutor debe justificar por qué la opción correcta es válida y por qué los distractores representan riesgos administrativos comunes en el SENA. Si un dato no figura en el caso de prueba, debe registrarse como «no consta». La valoración final de competencia es un proceso humano.",
        "sampleData": "Tema de evaluación: Procedimiento para responder un correo urgente donde el solicitante pide datos de contacto personales de un instructor.",
        "basePrompt": "Actúa como evaluador socrático en competencias de gestión administrativa pública del SENA. Formula una prueba de autoevaluación interactiva:\n1. Plantea un caso de oficina realista con un dilema ético, legal (Ley 1581) o técnico.\n2. Presenta 3 opciones de respuesta: una correcta y dos distractores plausibles con errores comunes de procedimiento.\n3. Espera mi respuesta. Cuando te responda, no me des solo la calificación: explícame por qué la opción elegida es correcta o riesgosa y cómo se fundamenta en los lineamientos institucionales.\n\n[Tema a evaluar: ...]",
        "challengeId": "reto-9",
        "challengeLink": "#m04-validacion",
        "challengeName": "Reto 9 · Auditoría de una respuesta convincente",
        "productFormat": "Prueba socrática interactiva con retroalimentación formativa inmediata."
    },
    {
        "id": "practica-deliberada",
        "dimension": "aprendizaje-continuo",
        "dimensionLabel": "Aprendizaje Continuo y Método Socrático",
        "category": "aprendizaje-continuo",
        "categoryLabel": "Método socrático",
        "title": "Práctica deliberada: ensayar situaciones difíciles con casos de simulación y rol",
        "shortTitle": "Práctica deliberada",
        "icon": "🎯",
        "problemDescription": "Entrenamiento seguro en situaciones complejas o de alta presión, como la atención de quejas agresivas, análisis de contratos con discrepancias o respuestas a tutelas.",
        "recommendedAiTool": "Chat de IA en modo simulación de rol (Roleplay formativo) + procesador de texto para el registro de aprendizajes.",
        "securityShield": "Ley 1581 de 2012. En simulaciones de rol, emplear exclusivamente nombres y datos ficticios rotulados como caso de aprendizaje.",
        "accuracyShield": "El asistente adopta el papel del interlocutor complejo, reacciona a los argumentos del aprendiz y evalúa la asertividad y contención de riesgos. Si la queja carece de radicado oficial, registrar «no consta». La mediación final es responsabilidad del servidor humano.",
        "sampleData": "Caso de entrenamiento: Ciudadano furioso porque su trámite de certificación lleva 8 días hábiles y afirma que la norma le da 5 días. Exige sanción al funcionario.",
        "basePrompt": "Actúa en modo de simulación de rol formativo. Asume el papel de un usuario ciudadano inconforme que presenta una situación compleja en la ventanilla del SENA:\n1. Inicia la conversación exponiendo tu queja de manera enérgica pero realista.\n2. Responderé a tu mensaje en mi rol de servidor administrativo.\n3. Continúa el diálogo por 2 o 3 turnos reaccionando a mi tono y argumentos.\n4. Al final de la simulación, sal del personaje y entrégame una retroalimentación constructiva evaluando: (a) Respeto al protocolo institucional, (b) Manejo de datos sin promesas indebidas, y (c) Claridad en los plazos legales.\n\n¿Listo? Comienza con tu mensaje inicial.",
        "challengeId": "reto-integrador",
        "challengeLink": "#m05-cierre",
        "challengeName": "Reto integrador · Plan, análisis y sustentación",
        "productFormat": "Simulación de rol con evaluación de desempeño y retroalimentación."
    },
    {
        "id": "rutas-paso-a-paso",
        "dimension": "aprendizaje-continuo",
        "dimensionLabel": "Aprendizaje Continuo y Método Socrático",
        "category": "aprendizaje-continuo",
        "categoryLabel": "Método socrático",
        "title": "Rutas paso a paso: organizar metas formativas amplias en sesiones enfocadas",
        "shortTitle": "Rutas formativas paso a paso",
        "icon": "🧭",
        "problemDescription": "Estructuración de planes de autoaprendizaje o proyectos extensos en bloques breves y manejables de práctica diaria para evitar saturación o abandono.",
        "recommendedAiTool": "Chat de IA como asesor de diseño pedagógico y microaprendizaje.",
        "securityShield": "Ley 1581 de 2012. Diseñar planes compatibles con los horarios laborales institucionales y descansos normativos sin exponer datos de personal.",
        "accuracyShield": "Toda ruta formativa debe definir un objetivo observable. Si no consta el tiempo de dedicación o el nivel previo, registrar «no consta». La adaptación del plan responde al criterio humano del aprendiz.",
        "sampleData": "Meta del aprendiz: «Quiero dominar el análisis de tablas con IA y fórmulas en Excel para aplicarlo en el informe trimestral del centro». Tiempo disponible: 4 semanas, 40 minutos al día.",
        "basePrompt": "Actúa como asesor pedagógico de desarrollo profesional administrativo. Diseña una ruta de microaprendizaje paso a paso para la siguiente meta formativa:\n1. Desglosa la meta en 4 semanas temáticas, con 3 sesiones enfocadas por semana de máximo 40 minutos cada una.\n2. Para cada sesión define: [Objetivo de aprendizaje] | [Concepto clave] | [Actividad práctica con herramienta digital] | [Producto de comprobación].\n3. Incluye al final de cada semana un punto de consolidación para evaluar lo aprendido.\nLímites: Prioriza el aprendizaje activo y la práctica directa sobre la lectura pasiva.\n\n[Meta formativa: ...]",
        "challengeId": "reto-integrador",
        "challengeLink": "#m05-cierre",
        "challengeName": "Reto integrador · Piloto de 30 días y plan de acción",
        "productFormat": "Ruta formativa estructurada en cronograma de sesiones de microaprendizaje."
    }
];

  var ALIAS_MAP = {
    'bandejas-correo': 'comites-evaluacion',
    'auditoria-informes': 'preguntas-comprobacion',
    'diseno-canva': 'diseno-procedimientos'
  };

  var SOCRATIC_LAB_SAMPLES = {
    "explicaciones-medida": {
        "mode": "analogia",
        "title": "Laboratorio socrático · Explicación con analogía cotidiana",
        "learnerQuery": "«Explícame qué es una línea base y por qué se mide el tiempo de revisión humana con una analogía cotidiana».",
        "aiResponse": "Imagina que quieres ahorrar tiempo preparando el café de la mañana. Antes de comprar una cafetera nueva, necesitas saber exactamente cuánto tardas hoy haciéndolo a mano: 10 minutos (5 hirviendo agua, 3 colando y 2 limpiando). Esos 10 minutos son tu línea base.\n\nSi la cafetera nueva cuela en 2 minutos pero limpiarla te toma 8, no estás ahorrando nada. En la gestión pública con IA ocurre igual: la línea base mide el tiempo completo antes de la IA (redacción, lectura de fuentes, contrastación de cifras y corrección). Si la IA redacta en 30 segundos pero revisar sus errores te toma 25 minutos, la línea base te demuestra con números reales si el cambio valió la pena.",
        "reflection": "¿En qué tarea administrativa de tu centro de formación crees que la revisión humana toma más tiempo que la redacción inicial?"
    },
    "preguntas-comprobacion": {
        "mode": "comprobacion",
        "title": "Laboratorio socrático · Caso de comprobación y criterio",
        "learnerQuery": "«Plantéame un caso de práctica para evaluar mi criterio ante una solicitud por Teams con datos sensibles».",
        "aiResponse": "Caso de práctica:\nUn instructor te escribe por Teams solicitando el celular personal y la dirección de un aprendiz que no asiste hace tres clases, indicando que necesita contactarlo de inmediato para evitar que deserte.\n\n¿Cuál de las siguientes acciones respeta la Ley 1581 de 2012 y el procedimiento institucional?\n\nA) Entregar los datos por Teams dada la urgencia de la deserción.\nB) Explicar la reserva de datos personales, ofrecerte a contactar tú mismo al aprendiz por canales oficiales o remitir el caso a Coordinación Académica.\nC) Pedir a la IA que decida si es legal enviar el teléfono.\n\nOpción correcta: B. La urgencia no suspende la Ley de Protección de Datos Personales. El servidor público debe activar el canal oficial sin divulgar datos reservados a terceros sin consentimiento previo.",
        "reflection": "¿Qué soporte institucional exigirías antes de registrar formalmente la novedad de deserción?"
    },
    "practica-deliberada": {
        "mode": "roleplay",
        "title": "Laboratorio socrático · Simulación de situación difícil (Roleplay)",
        "learnerQuery": "«Quiero ensayar la respuesta a un ciudadano que reclama airadamente por la demora de un certificado laboral».",
        "aiResponse": "Asumo el papel del ciudadano:\n«¡Buenas tardes! Llevo 12 días hábiles esperando mi certificación laboral como contratista. En ventanilla me dijeron que salía en 5 días. Esto es una falta de respeto, necesito radicarla hoy mismo para una licitación o interpondré una tutela y queja en control disciplinario. ¡Exijo que me la entreguen ya!». \n\nTu turno: Escribe tu borrador de respuesta aplicando empatía institucional, hechos verificados y contención de plazos sin hacer promesas no autorizadas.",
        "reflection": "¿Cómo redactarías tu respuesta para calmar la molestia sin prometer la entrega inmediata fuera del término legal?"
    },
    "rutas-paso-a-paso": {
        "mode": "ruta",
        "title": "Laboratorio socrático · Ruta de microaprendizaje paso a paso",
        "learnerQuery": "«Organízame una ruta de estudio paso a paso para dominar la depuración de planillas en Excel con IA en 3 semanas, dedicando 40 minutos al día».",
        "aiResponse": "Ruta formativa enfocada de 3 semanas (3 sesiones semanales de 40 minutos):\n\n• Semana 1: Calidad de datos y fórmula ESPACIOS.\n  - Sesión 1: Detección visual de espacios ocultos y celdas vacías (10 min concepto + 30 min práctica).\n  - Sesión 2: Creación de columnas de control con =ESPACIOS(MAYUSC(A2)).\n  - Sesión 3: Regla reproducible para rotular \"REVISAR\" ante valores nulos con =SI(ESBLANCO()).\n\n• Semana 2: Cruce de fuentes y caso testigo.\n  - Sesión 4: Configuración de caso ancla de verificación (Centro A: 840 matriculados, 42 deserciones).\n  - Sesión 5: Comprobación con BUSCARX y verificación de tasas sin alucinaciones.\n  - Sesión 6: Detección y conservación de duplicados con advertencias visibles.\n\n• Semana 3: Consolidación y transferencia laboral.\n  - Sesión 7: Limpieza de una base real de aprendices de tu centro formativo.\n  - Sesión 8: Proyección de informe ejecutivo con limitaciones de interpretación.\n  - Sesión 9: Documentación de la regla de transformación para compartir con tu equipo.",
        "reflection": "¿Qué base o planilla de tu área usarías para la sesión práctica de la Semana 3?"
    }
};

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function createSelectorState(situations, activeCategory, selectedSituationId, searchQuery) {
    var items = Array.isArray(situations) && situations.length > 0 ? situations : DEFAULT_SITUATIONS;
    var defaultId = items[0] ? items[0].id : null;
    var selectedId = selectedSituationId || defaultId;
    return {
      situations: items,
      activeCategory: activeCategory || 'todas',
      selectedSituationId: selectedId,
      searchQuery: (searchQuery || '').trim().toLowerCase()
    };
  }

  function getSituationById(situations, id) {
    var items = Array.isArray(situations) ? situations : DEFAULT_SITUATIONS;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        return items[i];
      }
    }
    if (id && ALIAS_MAP[id]) {
      var mappedId = ALIAS_MAP[id];
      for (var j = 0; j < items.length; j++) {
        if (items[j].id === mappedId) {
          return items[j];
        }
      }
    }
    return null;
  }

  function getCategories(situations) {
    var items = Array.isArray(situations) ? situations : DEFAULT_SITUATIONS;
    var map = {};
    var list = [
      { id: 'todas', label: 'Todas las situaciones', count: items.length }
    ];
    for (var i = 0; i < items.length; i++) {
      var s = items[i];
      var cat = s.category || 'general';
      var label = s.categoryLabel || cat;
      if (!map[cat]) {
        map[cat] = { id: cat, label: label, count: 0 };
        list.push(map[cat]);
      }
      map[cat].count += 1;
    }
    return list;
  }

  function filterSituations(situations, filterOptions) {
    var items = Array.isArray(situations) ? situations : DEFAULT_SITUATIONS;
    var options = filterOptions || {};
    var cat = options.category || 'todas';
    var search = (options.search || '').trim().toLowerCase();

    return items.filter(function (s) {
      var matchesCategory = cat === 'todas' || s.category === cat || s.dimension === cat;
      if (!matchesCategory) return false;
      if (!search) return true;
      var title = (s.title || '').toLowerCase();
      var shortTitle = (s.shortTitle || '').toLowerCase();
      var desc = (s.problemDescription || '').toLowerCase();
      var catLabel = (s.categoryLabel || '').toLowerCase();
      var dimLabel = (s.dimensionLabel || '').toLowerCase();
      var tool = (s.recommendedAiTool || '').toLowerCase();
      return (
        title.indexOf(search) !== -1 ||
        shortTitle.indexOf(search) !== -1 ||
        desc.indexOf(search) !== -1 ||
        catLabel.indexOf(search) !== -1 ||
        dimLabel.indexOf(search) !== -1 ||
        tool.indexOf(search) !== -1
      );
    });
  }

  function selectSituation(state, situationId) {
    var currentState = state || createSelectorState();
    var exists = getSituationById(currentState.situations, situationId);
    return {
      situations: currentState.situations,
      activeCategory: currentState.activeCategory,
      selectedSituationId: exists ? exists.id : currentState.selectedSituationId,
      searchQuery: currentState.searchQuery
    };
  }

  function formatPromptForClipboard(situation) {
    if (!situation) return '';
    if (typeof situation === 'string') return situation;
    return situation.basePrompt || '';
  }

  function generateManualMarkdown(situations) {
    var items = Array.isArray(situations) && situations.length > 0 ? situations : DEFAULT_SITUATIONS;
    var lines = [
      '# Manual Práctico de Situaciones de Oficina con IA',
      '',
      '> **SENA · Servicio Nacional de Aprendizaje**  ',
      '> Formación Nacional · Aula de Productividad Administrativa · Curso 21720210 V1  ',
      '> Catálogo de doce situaciones de oficina y autoaprendizaje socrático, herramientas recomendadas, blindaje normativo y prompts listos para aplicar.',
      '',
      '---',
      '',
      '## Índice de Situaciones',
      ''
    ];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      lines.push((i + 1) + '. [' + item.icon + ' ' + item.title + '](#' + item.id + ') — *' + item.categoryLabel + '*');
    }

    lines.push('', '---', '');

    for (var j = 0; j < items.length; j++) {
      var s = items[j];
      lines.push('## ' + (j + 1) + '. ' + s.icon + ' ' + s.title);
      lines.push('<a id="' + s.id + '"></a>');
      lines.push('');
      lines.push('- **Dimensión formativa:** ' + (s.dimensionLabel || s.categoryLabel));
      lines.push('- **Categoría:** ' + s.categoryLabel);
      lines.push('- **Problema habitual:** ' + s.problemDescription);
      lines.push('- **Herramienta de IA recomendada:** ' + s.recommendedAiTool);
      lines.push('- **Blindaje de seguridad (Ley 1581 de 2012):** ' + s.securityShield);
      lines.push('- **Escudo de exactitud y verificación («no consta»):** ' + s.accuracyShield);
      if (s.sampleData) {
        lines.push('- **Datos de muestra preparados:** ' + s.sampleData);
      }
      lines.push('- **Formato de entrega:** ' + s.productFormat);
      lines.push('- **Reto donde se practica:** [' + s.challengeName + '](' + s.challengeLink + ')');
      lines.push('');
      lines.push('### Prompt base listo para copiar (1 clic)');
      lines.push('');
      lines.push('```text');
      lines.push(s.basePrompt);
      lines.push('```');
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    lines.push('## Regla de Oro Institucional');
    lines.push('');
    lines.push('1. **Nunca ingreses datos sensibles:** Aplica la Ley 1581 de 2012. Anonimiza nombres, identificaciones y datos de salud.');
    lines.push('2. **Contrasta siempre con la fuente:** La IA prepara borradores; la persona responsable comprueba los hechos y emite la decisión.');
    lines.push('3. **Declara lo que no conste:** Si un dato no figura en los antecedentes, rotúlalo como «no consta» sin inventar información.');
    lines.push('');

    return lines.join('\n');
  }

  function generateManualHtml(situations) {
    var items = Array.isArray(situations) && situations.length > 0 ? situations : DEFAULT_SITUATIONS;
    var cardsHtml = [];

    for (var i = 0; i < items.length; i++) {
      var s = items[i];
      cardsHtml.push(
        '<article class="manual-situation-card" id="' + escapeHtml(s.id) + '">' +
          '<header class="card-header">' +
            '<div class="card-title-group">' +
              '<span class="card-icon" aria-hidden="true">' + escapeHtml(s.icon) + '</span>' +
              '<div>' +
                '<span class="card-category-badge">' + escapeHtml(s.categoryLabel) + '</span>' +
                '<h3>' + (i + 1) + '. ' + escapeHtml(s.title) + '</h3>' +
              '</div>' +
            '</div>' +
            '<span class="product-badge">' + escapeHtml(s.productFormat) + '</span>' +
          '</header>' +
          '<div class="card-body">' +
            '<p class="card-desc"><strong>Situación:</strong> ' + escapeHtml(s.problemDescription) + '</p>' +
            '<div class="shield-grid">' +
              '<div class="shield-box shield-tool">' +
                '<strong>Herramienta recomendada:</strong>' +
                '<p>' + escapeHtml(s.recommendedAiTool) + '</p>' +
              '</div>' +
              '<div class="shield-box shield-legal">' +
                '<strong>Blindaje legal (Ley 1581 de 2012):</strong>' +
                '<p>' + escapeHtml(s.securityShield) + '</p>' +
              '</div>' +
              '<div class="shield-box shield-accuracy">' +
                '<strong>Escudo de exactitud («no consta»):</strong>' +
                '<p>' + escapeHtml(s.accuracyShield) + '</p>' +
              '</div>' +
            '</div>' +
            (s.sampleData ? (
              '<div class="sample-data-box" style="margin-bottom:14px;padding:12px;background:#f2f6f4;border-radius:6px;font-size:0.86rem;">' +
                '<strong>Datos de práctica preparados:</strong> ' + escapeHtml(s.sampleData) +
              '</div>'
            ) : '') +
            '<div class="prompt-box">' +
              '<div class="prompt-header">' +
                '<strong>Prompt base listo para aplicar:</strong>' +
              '</div>' +
              '<pre class="prompt-code"><code>' + escapeHtml(s.basePrompt) + '</code></pre>' +
            '</div>' +
            '<footer class="card-footer">' +
              '<span><strong>Reto de práctica:</strong> <a href="' + escapeHtml(s.challengeLink) + '">' + escapeHtml(s.challengeName) + '</a></span>' +
            '</footer>' +
          '</div>' +
        '</article>'
      );
    }

    return (
      '<!doctype html>\n' +
      '<html lang="es-CO">\n' +
      '<head>\n' +
      '  <meta charset="utf-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '  <title>Manual Práctico de Situaciones de Oficina con IA · SENA</title>\n' +
      '  <style>\n' +
      '    :root { --primary: #225746; --accent: #39a900; --ink: #1e332c; --surface: #ffffff; --bg: #f4f7f5; --line: #d8e3dc; }\n' +
      '    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: var(--ink); background: var(--bg); margin: 0; padding: 24px; }\n' +
      '    .manual-container { max-width: 1040px; margin: 0 auto; background: var(--surface); padding: 36px; border-radius: 16px; border: 1px solid var(--line); box-shadow: 0 4px 18px rgba(34,87,70,0.06); }\n' +
      '    .manual-header { border-bottom: 2px solid var(--primary); padding-bottom: 20px; margin-bottom: 28px; }\n' +
      '    .manual-eyebrow { font-size: 0.75rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; }\n' +
      '    h1 { color: var(--primary); margin: 6px 0 10px; font-size: 1.85rem; }\n' +
      '    .manual-lead { font-size: 1rem; color: #435b52; margin: 0; }\n' +
      '    .manual-situation-card { border: 1px solid var(--line); border-radius: 12px; margin-bottom: 24px; background: #fafcfb; break-inside: avoid; overflow: hidden; }\n' +
      '    .card-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 18px 22px; background: #edf4ef; border-bottom: 1px solid var(--line); gap: 14px; }\n' +
      '    .card-title-group { display: flex; align-items: center; gap: 14px; }\n' +
      '    .card-icon { font-size: 1.75rem; }\n' +
      '    .card-category-badge { display: inline-block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--primary); background: #dcece2; padding: 2px 8px; border-radius: 4px; margin-bottom: 4px; }\n' +
      '    .manual-situation-card h3 { margin: 0; font-size: 1.15rem; color: #1e3a30; }\n' +
      '    .product-badge { font-size: 0.78rem; background: var(--surface); padding: 5px 10px; border-radius: 6px; border: 1px solid #c7d8ce; color: #2e5545; font-weight: 600; white-space: nowrap; }\n' +
      '    .card-body { padding: 20px 22px; }\n' +
      '    .card-desc { margin: 0 0 16px; font-size: 0.95rem; }\n' +
      '    .shield-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 18px; }\n' +
      '    .shield-box { padding: 12px 14px; border-radius: 8px; font-size: 0.85rem; }\n' +
      '    .shield-tool { background: #eef6f8; border-left: 3px solid #2f7b8c; }\n' +
      '    .shield-legal { background: #fdf5eb; border-left: 3px solid #b67624; }\n' +
      '    .shield-accuracy { background: #eef5ee; border-left: 3px solid #36824f; }\n' +
      '    .shield-box strong { display: block; margin-bottom: 4px; color: #27473b; font-size: 0.8rem; text-transform: uppercase; }\n' +
      '    .shield-box p { margin: 0; line-height: 1.5; }\n' +
      '    .prompt-box { background: #f0f4f2; border: 1px solid #d2ded7; border-radius: 8px; padding: 14px; margin-bottom: 14px; }\n' +
      '    .prompt-header { font-size: 0.82rem; font-weight: 700; color: #2b5545; margin-bottom: 8px; }\n' +
      '    .prompt-code { margin: 0; padding: 12px; background: #ffffff; border: 1px solid #d7e2dc; border-radius: 6px; font-size: 0.84rem; white-space: pre-wrap; word-break: break-word; line-height: 1.6; color: #223e34; font-family: Consolas, Monaco, monospace; }\n' +
      '    .card-footer { font-size: 0.85rem; color: #4b645b; padding-top: 10px; border-top: 1px solid #e2ece6; }\n' +
      '    .card-footer a { color: var(--primary); font-weight: 600; text-decoration: none; }\n' +
      '    .card-footer a:hover { text-decoration: underline; }\n' +
      '    @media print {\n' +
      '      body { background: #ffffff; padding: 0; }\n' +
      '      .manual-container { border: 0; box-shadow: none; padding: 0; max-width: 100%; }\n' +
      '      .manual-situation-card { border: 1px solid #999; page-break-inside: avoid; margin-bottom: 20px; }\n' +
      '      .prompt-code { font-size: 0.78rem; }\n' +
      '    }\n' +
      '  </style>\n' +
      '</head>\n' +
      '<body>\n' +
      '  <main class="manual-container">\n' +
      '    <header class="manual-header">\n' +
      '      <span class="manual-eyebrow">SENA · Servicio Nacional de Aprendizaje</span>\n' +
      '      <h1>Manual Práctico de Situaciones de Oficina con IA</h1>\n' +
      '      <p class="manual-lead">Fichas de triaje operativo, herramientas recomendadas, blindaje según la Ley 1581 de 2012 y prompts de aplicación inmediata para el personal administrativo.</p>\n' +
      '    </header>\n' +
      '    <section class="manual-cards-list">\n' +
      cardsHtml.join('\n') +
      '    </section>\n' +
      '  </main>\n' +
      '</body>\n' +
      '</html>\n'
    );
  }

  function revokeObjectUrlSafely(urlRef, url) {
    try {
      if (urlRef && typeof urlRef.revokeObjectURL === 'function') {
        urlRef.revokeObjectURL(url);
      }
    } catch (e) {}
  }

  function downloadFile(filename, content, mimeType, doc) {
    var documentRef = doc || (typeof document !== 'undefined' ? document : null);
    if (!documentRef || !documentRef.createElement) {
      return false;
    }
    try {
      var blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
      var url = (typeof URL !== 'undefined' && URL.createObjectURL) ? URL.createObjectURL(blob) : null;
      var link = documentRef.createElement('a');
      link.href = url || ('data:' + (mimeType || 'text/plain') + ',' + encodeURIComponent(content));
      link.download = filename || 'archivo.txt';
      link.style.display = 'none';
      (documentRef.body || documentRef.documentElement).appendChild(link);
      link.click();
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      if (url) {
        var urlRef = (typeof URL !== 'undefined' && URL.revokeObjectURL) ? URL : null;
        if (urlRef) {
          setTimeout(function () {
            revokeObjectUrlSafely(urlRef, url);
          }, 10);
        }
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  function exportManualMarkdown(situations, filename, doc) {
    var md = generateManualMarkdown(situations);
    var name = filename || 'manual-situaciones-oficina-ia.md';
    downloadFile(name, md, 'text/markdown;charset=utf-8', doc);
    return md;
  }

  function exportManualHtml(situations, filename, doc) {
    var htmlContent = generateManualHtml(situations);
    var name = filename || 'manual-situaciones-oficina-ia.html';
    downloadFile(name, htmlContent, 'text/html;charset=utf-8', doc);
    return htmlContent;
  }

  function printManual(targetWindow) {
    var win = targetWindow || (typeof window !== 'undefined' ? window : null);
    if (win && typeof win.print === 'function') {
      win.print();
      return true;
    }
    return false;
  }

  function copyPromptToClipboard(promptText, buttonElement, notificationElement, nav) {
    var navigatorRef = nav || (typeof navigator !== 'undefined' ? navigator : null);
    var text = typeof promptText === 'string' ? promptText : '';
    if (!text && promptText && promptText.basePrompt) {
      text = promptText.basePrompt;
    }

    var showSuccess = function () {
      if (buttonElement) {
        buttonElement.dataset.originalText = buttonElement.dataset.originalText || buttonElement.textContent;
        buttonElement.textContent = '¡Prompt copiado al portapapeles!';
        buttonElement.classList.add('is-copied');
        setTimeout(function () {
          buttonElement.textContent = buttonElement.dataset.originalText;
          buttonElement.classList.remove('is-copied');
        }, 3000);
      }
      if (notificationElement) {
        notificationElement.textContent = 'Prompt base copiado con éxito. Pégalo en tu asistente de IA.';
        notificationElement.classList.add('is-visible');
        setTimeout(function () {
          notificationElement.textContent = '';
          notificationElement.classList.remove('is-visible');
        }, 4000);
      }
    };

    if (navigatorRef && navigatorRef.clipboard && typeof navigatorRef.clipboard.writeText === 'function') {
      return navigatorRef.clipboard.writeText(text).then(function () {
        showSuccess();
        return true;
      }).catch(function () {
        showSuccess();
        return true;
      });
    }

    showSuccess();
    return Promise.resolve(true);
  }

  function copyPrompt(situationOrPrompt, buttonElement, notificationElement, nav) {
    return copyPromptToClipboard(situationOrPrompt, buttonElement, notificationElement, nav);
  }

  function renderCategoryFilters(categories, activeCategory) {
    var cats = Array.isArray(categories) ? categories : [];
    var active = activeCategory || 'todas';
    var html = ['<div class="situation-filters-bar" role="tablist" aria-label="Filtrar situaciones por categoría">'];
    for (var i = 0; i < cats.length; i++) {
      var c = cats[i];
      var isCurrent = c.id === active;
      html.push(
        '<button type="button" class="situation-filter-btn' + (isCurrent ? ' is-active' : '') + '" ' +
          'data-situation-category="' + escapeHtml(c.id) + '" ' +
          'role="tab" ' +
          'aria-selected="' + (isCurrent ? 'true' : 'false') + '">' +
          escapeHtml(c.label) + ' <span class="filter-count">(' + c.count + ')</span>' +
        '</button>'
      );
    }
    html.push('</div>');
    return html.join('');
  }

  function renderSituationCards(situations, selectedId) {
    var items = Array.isArray(situations) ? situations : [];
    if (items.length === 0) {
      return '<div class="situations-empty-notice"><p>No se encontraron situaciones en esta categoría.</p></div>';
    }
    var html = ['<div class="situations-cards-grid" role="list">'];
    for (var i = 0; i < items.length; i++) {
      var s = items[i];
      var isSelected = s.id === selectedId;
      html.push(
        '<article class="situation-picker-card' + (isSelected ? ' is-selected' : '') + '" ' +
          'data-situation-id="' + escapeHtml(s.id) + '" ' +
          'role="listitem" ' +
          'tabindex="0" ' +
          'aria-current="' + (isSelected ? 'true' : 'false') + '">' +
          '<div class="picker-card-top">' +
            '<span class="picker-card-icon" aria-hidden="true">' + escapeHtml(s.icon) + '</span>' +
            '<span class="picker-card-category">' + escapeHtml(s.categoryLabel) + '</span>' +
          '</div>' +
          '<h3 class="picker-card-title">' + escapeHtml(s.shortTitle || s.title) + '</h3>' +
          '<p class="picker-card-desc">' + escapeHtml(s.problemDescription) + '</p>' +
          '<div class="picker-card-bottom">' +
            '<span class="picker-card-format">' + escapeHtml(s.productFormat) + '</span>' +
            '<span class="picker-card-action">' + (isSelected ? 'Seleccionada ✓' : 'Ver solución →') + '</span>' +
          '</div>' +
        '</article>'
      );
    }
    html.push('</div>');
    return html.join('');
  }

  function renderSituationDetail(situation) {
    if (!situation) {
      return '<div class="situation-detail-placeholder"><p>Selecciona una situación de la lista para ver su solución guiada.</p></div>';
    }

    var sampleDataHtml = '';
    if (situation.sampleData) {
      sampleDataHtml = (
        '<div class="detail-sample-data-box" style="margin: 16px 0; padding: 14px; background: #eef4f1; border-radius: 8px; border-left: 3px solid #225746;">' +
          '<div style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: #225746; margin-bottom: 6px;">📋 Datos de práctica preparados (copiar para probar):</div>' +
          '<p style="margin: 0; font-size: 0.88rem; color: #233e33; line-height: 1.5;">' + escapeHtml(situation.sampleData) + '</p>' +
        '</div>'
      );
    }

    var socraticLabHtml = '';
    if (situation.dimension === 'aprendizaje-continuo' && SOCRATIC_LAB_SAMPLES[situation.id]) {
      var lab = SOCRATIC_LAB_SAMPLES[situation.id];
      socraticLabHtml = (
        '<div class="detail-socratic-lab-card" style="margin: 20px 0; padding: 18px; background: #fafdfa; border: 1px solid #c8ded1; border-radius: 10px;">' +
          '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">' +
            '<span style="display: inline-block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #225746; background: #e0f0e6; padding: 3px 8px; border-radius: 4px;">⚡ Laboratorio Socrático Interactivo</span>' +
            '<small style="color: #4a685b; font-weight: 600;">Interacción modelo</small>' +
          '</div>' +
          '<h4 style="margin: 0 0 12px; font-size: 1.05rem; color: #1e3a30;">' + escapeHtml(lab.title) + '</h4>' +
          '<div style="display: grid; gap: 10px; margin-bottom: 12px;">' +
            '<div style="background: #eef6f8; border-left: 3px solid #2f7b8c; padding: 10px 14px; border-radius: 6px;">' +
              '<strong style="display: block; font-size: 0.78rem; color: #1d5562; text-transform: uppercase;">Tu consulta (método socrático):</strong>' +
              '<p style="margin: 4px 0 0; font-size: 0.88rem; color: #153e47;">' + escapeHtml(lab.learnerQuery) + '</p>' +
            '</div>' +
            '<div style="background: #f0f7f1; border-left: 3px solid #36824f; padding: 10px 14px; border-radius: 6px;">' +
              '<strong style="display: block; font-size: 0.78rem; color: #235b36; text-transform: uppercase;">Respuesta pedagógica de la IA:</strong>' +
              '<p style="margin: 4px 0 0; font-size: 0.88rem; color: #184227; white-space: pre-wrap; line-height: 1.55;">' + escapeHtml(lab.aiResponse) + '</p>' +
            '</div>' +
          '</div>' +
          '<div style="padding: 10px 12px; background: #fdf8ed; border-left: 3px solid #c2882a; border-radius: 6px; font-size: 0.86rem; color: #4e3913;">' +
            '<strong>💡 Pregunta de comprobación socrática:</strong> ' + escapeHtml(lab.reflection) +
          '</div>' +
        '</div>'
      );
    }

    return (
      '<div class="situation-detail-panel" id="situation-detail-' + escapeHtml(situation.id) + '" role="region" aria-labelledby="detail-title-' + escapeHtml(situation.id) + '">' +
        '<header class="detail-panel-header">' +
          '<div class="detail-header-copy">' +
            '<span class="detail-category-badge">' + escapeHtml(situation.categoryLabel) + '</span>' +
            '<h3 id="detail-title-' + escapeHtml(situation.id) + '">' +
              '<span class="detail-icon" aria-hidden="true">' + escapeHtml(situation.icon) + '</span> ' +
              escapeHtml(situation.title) +
            '</h3>' +
            '<p class="detail-lead">' + escapeHtml(situation.problemDescription) + '</p>' +
          '</div>' +
          '<div class="detail-format-tag">' +
            '<small>Producto elaborado</small>' +
            '<strong>' + escapeHtml(situation.productFormat) + '</strong>' +
          '</div>' +
        '</header>' +

        '<div class="detail-shields-grid">' +
          '<div class="detail-shield-card shield-tool">' +
            '<div class="shield-badge">1. Herramienta de IA</div>' +
            '<h4>¿Qué IA y software usar?</h4>' +
            '<p>' + escapeHtml(situation.recommendedAiTool) + '</p>' +
          '</div>' +
          '<div class="detail-shield-card shield-security">' +
            '<div class="shield-badge">2. Ley 1581 de 2012</div>' +
            '<h4>Blindaje de seguridad y privacidad</h4>' +
            '<p>' + escapeHtml(situation.securityShield) + '</p>' +
          '</div>' +
          '<div class="detail-shield-card shield-accuracy">' +
            '<div class="shield-badge">3. Escudo de exactitud</div>' +
            '<h4>Regla de oro: «no consta»</h4>' +
            '<p>' + escapeHtml(situation.accuracyShield) + '</p>' +
          '</div>' +
        '</div>' +

        sampleDataHtml +
        socraticLabHtml +

        '<section class="detail-prompt-section" aria-labelledby="prompt-heading-' + escapeHtml(situation.id) + '">' +
          '<div class="detail-prompt-head">' +
            '<div>' +
              '<span class="eyebrow">INSTRUCCIÓN LISTA PARA APLICAR</span>' +
              '<h4 id="prompt-heading-' + escapeHtml(situation.id) + '">Prompt base estructurado (1 clic)</h4>' +
            '</div>' +
            '<button type="button" class="button button-primary btn-copy-prompt" ' +
              'data-copy-situation-prompt="' + escapeHtml(situation.id) + '" ' +
              'aria-describedby="copy-status-' + escapeHtml(situation.id) + '">' +
              '<span aria-hidden="true">📋</span> Copiar prompt base' +
            '</button>' +
          '</div>' +
          '<div class="prompt-code-wrap">' +
            '<pre class="detail-prompt-pre"><code class="detail-prompt-code">' + escapeHtml(situation.basePrompt) + '</code></pre>' +
          '</div>' +
          '<p class="copy-status-msg" id="copy-status-' + escapeHtml(situation.id) + '" role="status" aria-live="polite"></p>' +
        '</section>' +

        '<footer class="detail-panel-footer">' +
          '<div class="detail-transfer-note">' +
            '<strong>¿Quieres profundizar en esta técnica?</strong>' +
            '<span>Practica esta solución con archivos reales en el recorrido del aula.</span>' +
          '</div>' +
          '<a class="button button-outline" href="' + escapeHtml(situation.challengeLink) + '" data-open-challenge="' + escapeHtml(situation.challengeId) + '">' +
            'Ir a la práctica: ' + escapeHtml(situation.challengeName) + ' <span aria-hidden="true">→</span>' +
          '</a>' +
        '</footer>' +
      '</div>'
    );
  }

  function renderSelector(container, state) {
    if (!container) return '';
    var currentState = state || createSelectorState();
    var categories = getCategories(currentState.situations);
    var filtered = filterSituations(currentState.situations, {
      category: currentState.activeCategory,
      search: currentState.searchQuery
    });
    var currentSituation = getSituationById(currentState.situations, currentState.selectedSituationId) || filtered[0] || currentState.situations[0];

    var markup = (
      '<div class="office-selector-component">' +
        renderCategoryFilters(categories, currentState.activeCategory) +
        '<div class="office-selector-layout">' +
          '<div class="selector-cards-col">' +
            renderSituationCards(filtered, currentSituation ? currentSituation.id : null) +
          '</div>' +
          '<div class="selector-detail-col">' +
            renderSituationDetail(currentSituation) +
          '</div>' +
        '</div>' +
      '</div>'
    );

    container.innerHTML = markup;
    return markup;
  }

  function renderManual(container, situations) {
    return renderManualSection(container, situations);
  }

  function renderManualSection(container, situations) {
    if (!container) return '';
    var items = Array.isArray(situations) && situations.length > 0 ? situations : DEFAULT_SITUATIONS;
    var cardsHtml = [];

    for (var i = 0; i < items.length; i++) {
      var s = items[i];
      cardsHtml.push(
        '<article class="manual-item-card" id="manual-card-' + escapeHtml(s.id) + '">' +
          '<div class="manual-item-header">' +
            '<div class="manual-item-title-wrap">' +
              '<span class="manual-item-icon" aria-hidden="true">' + escapeHtml(s.icon) + '</span>' +
              '<div>' +
                '<span class="manual-item-badge">' + escapeHtml(s.categoryLabel) + '</span>' +
                '<h3>' + (i + 1) + '. ' + escapeHtml(s.title) + '</h3>' +
              '</div>' +
            '</div>' +
            '<span class="manual-format-pill">' + escapeHtml(s.productFormat) + '</span>' +
          '</div>' +
          '<p class="manual-item-problem"><strong>Situación:</strong> ' + escapeHtml(s.problemDescription) + '</p>' +
          '<div class="manual-shields-row">' +
            '<div class="manual-shield-col shield-tool">' +
              '<strong>Herramienta:</strong>' +
              '<p>' + escapeHtml(s.recommendedAiTool) + '</p>' +
            '</div>' +
            '<div class="manual-shield-col shield-legal">' +
              '<strong>Seguridad (Ley 1581):</strong>' +
              '<p>' + escapeHtml(s.securityShield) + '</p>' +
            '</div>' +
            '<div class="manual-shield-col shield-accuracy">' +
              '<strong>Exactitud («no consta»):</strong>' +
              '<p>' + escapeHtml(s.accuracyShield) + '</p>' +
            '</div>' +
          '</div>' +
          (s.sampleData ? (
            '<div style="margin: 12px 0; padding: 10px 12px; background: #f2f7f4; border-radius: 6px; font-size: 0.85rem; color: #284639;">' +
              '<strong>Muestra de práctica:</strong> ' + escapeHtml(s.sampleData) +
            '</div>'
          ) : '') +
          '<div class="manual-prompt-wrapper">' +
            '<div class="manual-prompt-bar">' +
              '<strong>Prompt base probado:</strong>' +
              '<button type="button" class="button button-secondary btn-copy-prompt" ' +
                'data-copy-situation-prompt="' + escapeHtml(s.id) + '" ' +
                'aria-describedby="manual-copy-status-' + escapeHtml(s.id) + '">' +
                'Copiar prompt' +
              '</button>' +
            '</div>' +
            '<pre class="manual-prompt-code"><code>' + escapeHtml(s.basePrompt) + '</code></pre>' +
            '<p class="copy-status-msg" id="manual-copy-status-' + escapeHtml(s.id) + '" role="status" aria-live="polite"></p>' +
          '</div>' +
          '<div class="manual-item-footer">' +
            '<span>Práctica en el aula: <a href="' + escapeHtml(s.challengeLink) + '">' + escapeHtml(s.challengeName) + '</a></span>' +
          '</div>' +
        '</article>'
      );
    }

    var markup = (
      '<div class="manual-items-grid">' +
        cardsHtml.join('') +
      '</div>'
    );

    container.innerHTML = markup;
    return markup;
  }

  function initOfficeSituationsSelector(options) {
    var opts = options || {};
    var doc = opts.document || (typeof document !== 'undefined' ? document : null);
    if (!doc) return false;

    var situations = Array.isArray(opts.situations) && opts.situations.length > 0 ? opts.situations : DEFAULT_SITUATIONS;
    var state = createSelectorState(situations, opts.initialCategory, opts.initialSelectedId);

    var selectorContainer = doc.getElementById('office-situations-selector-container') ||
                            doc.getElementById('situaciones-oficina-container') ||
                            doc.querySelector('[data-office-situations-selector-container]') ||
                            doc.querySelector('.office-situations-selector-body');

    var manualContainer = doc.getElementById('manual-situaciones-content') ||
                          doc.getElementById('office-situations-manual-content') ||
                          doc.querySelector('[data-office-manual-content]');

    if (selectorContainer) {
      renderSelector(selectorContainer, state);

      selectorContainer.addEventListener('click', function (e) {
        var target = e.target;

        var filterBtn = target.closest('[data-situation-category]');
        if (filterBtn) {
          var category = filterBtn.getAttribute('data-situation-category');
          state.activeCategory = category;
          renderSelector(selectorContainer, state);
          return;
        }

        var card = target.closest('[data-situation-id]');
        if (card) {
          var sitId = card.getAttribute('data-situation-id');
          state.selectedSituationId = sitId;
          renderSelector(selectorContainer, state);
          var detailEl = selectorContainer.querySelector('.situation-detail-panel');
          if (detailEl && typeof detailEl.scrollIntoView === 'function') {
            detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          return;
        }

        var copyBtn = target.closest('[data-copy-situation-prompt]');
        if (copyBtn) {
          var copyId = copyBtn.getAttribute('data-copy-situation-prompt');
          var sit = getSituationById(state.situations, copyId);
          var notify = selectorContainer.querySelector('#copy-status-' + copyId);
          if (sit) {
            copyPromptToClipboard(sit.basePrompt, copyBtn, notify);
          }
          return;
        }
      });

      selectorContainer.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var card = e.target.closest('[data-situation-id]');
          if (card) {
            e.preventDefault();
            var sitId = card.getAttribute('data-situation-id');
            state.selectedSituationId = sitId;
            renderSelector(selectorContainer, state);
          }
        }
      });
    }

    // Listener global para enlaces que activan una situación desde cualquier parte (p. ej. las 3 tarjetas)
    doc.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-open-situation]');
      if (trigger && selectorContainer) {
        var sitId = trigger.getAttribute('data-open-situation');
        var sit = getSituationById(situations, sitId);
        if (sit) {
          state.selectedSituationId = sit.id;
          state.activeCategory = sit.category;
          renderSelector(selectorContainer, state);
          var section = doc.getElementById('situaciones-oficina');
          if (section && typeof section.scrollIntoView === 'function') {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    });

    if (manualContainer) {
      renderManualSection(manualContainer, situations);

      manualContainer.addEventListener('click', function (e) {
        var copyBtn = e.target.closest('[data-copy-situation-prompt]');
        if (copyBtn) {
          var copyId = copyBtn.getAttribute('data-copy-situation-prompt');
          var sit = getSituationById(situations, copyId);
          var notify = manualContainer.querySelector('#manual-copy-status-' + copyId);
          if (sit) {
            copyPromptToClipboard(sit.basePrompt, copyBtn, notify);
          }
        }
      });
    }

    var btnDownloadMd = doc.getElementById('btn-download-manual-md');
    if (btnDownloadMd) {
      btnDownloadMd.addEventListener('click', function () {
        exportManualMarkdown(situations, 'manual-situaciones-oficina-ia.md', doc);
      });
    }

    var btnDownloadHtml = doc.getElementById('btn-download-manual-html');
    if (btnDownloadHtml) {
      btnDownloadHtml.addEventListener('click', function () {
        exportManualHtml(situations, 'manual-situaciones-oficina-ia.html', doc);
      });
    }

    var btnPrintManual = doc.getElementById('btn-print-manual');
    if (btnPrintManual) {
      btnPrintManual.addEventListener('click', function () {
        printManual(doc.defaultView || (typeof window !== 'undefined' ? window : null));
      });
    }

    return {
      state: state,
      situations: situations,
      selectorContainer: selectorContainer,
      manualContainer: manualContainer
    };
  }

  function autoInit(docRef) {
    var doc = docRef || (typeof document !== 'undefined' ? document : null);
    if (!doc) return false;
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', function onDomReady() {
        initOfficeSituationsSelector({ document: doc });
      });
      return true;
    }
    initOfficeSituationsSelector({ document: doc });
    return true;
  }

  autoInit();

  var OfficeSituationsSelector = {
    DEFAULT_SITUATIONS: DEFAULT_SITUATIONS,
    escapeHtml: escapeHtml,
    createSelectorState: createSelectorState,
    getSituationById: getSituationById,
    getCategories: getCategories,
    filterSituations: filterSituations,
    selectSituation: selectSituation,
    formatPromptForClipboard: formatPromptForClipboard,
    generateManualMarkdown: generateManualMarkdown,
    generateManualHtml: generateManualHtml,
    revokeObjectUrlSafely: revokeObjectUrlSafely,
    downloadFile: downloadFile,
    exportManualMarkdown: exportManualMarkdown,
    exportManualHtml: exportManualHtml,
    printManual: printManual,
    copyPromptToClipboard: copyPromptToClipboard,
    copyPrompt: copyPrompt,
    renderCategoryFilters: renderCategoryFilters,
    renderSituationCards: renderSituationCards,
    renderSituationDetail: renderSituationDetail,
    renderSelector: renderSelector,
    renderManual: renderManual,
    renderManualSection: renderManualSection,
    initOfficeSituationsSelector: initOfficeSituationsSelector,
    init: initOfficeSituationsSelector,
    autoInit: autoInit
  };

  if (typeof window !== 'undefined') {
    window.OfficeSituationsSelector = OfficeSituationsSelector;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfficeSituationsSelector;
  }
})();
