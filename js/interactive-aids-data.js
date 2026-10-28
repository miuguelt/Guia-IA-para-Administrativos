(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CourseInteractiveAidsData = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  // 1. Simulador de Criterio y Seguridad (Semáforo de IA en la vida y el trabajo)
  const SAFETY_SCENARIOS = Object.freeze([
    Object.freeze({
      id: 'sc-1',
      title: 'Triaje y clasificación inicial de correspondencia',
      dimension: 'Gestión documental',
      description: 'Entregar a la IA un lote de solicitudes ciudadanas anonimizadas para que clasifique por tipo de trámite y proponga una lista de dependencias competentes.',
      expected: 'green',
      explanation: 'Recomendable con supervisión personal: puede ayudar a organizar el reparto documental. La persona encargada debe verificar las competencias antes de radicar.'
    }),
    Object.freeze({
      id: 'sc-2',
      title: 'Diagnóstico de síntomas o prescripción médica en bienestar',
      dimension: 'Salud y bienestar',
      description: 'Describir los síntomas de un funcionario o aprendiz y pedirle a la IA que recete un medicamento o indique el tratamiento definitivo.',
      expected: 'red',
      explanation: 'No recomendable / Prohibido: los modelos no tienen juicio clínico, no pueden auscultar ni asumen responsabilidad sobre la salud. Consulta siempre a un profesional médico.'
    }),
    Object.freeze({
      id: 'sc-3',
      title: 'Redacción de borrador formal de PQRS',
      dimension: 'Trabajo administrativo',
      description: 'Copiar el texto de una solicitud ciudadana autorizada para que la IA proponga un borrador de respuesta respetuoso, dejando visibles los datos pendientes.',
      expected: 'green',
      explanation: 'Recomendable con revisión humana: puede apoyar la redacción del borrador. La persona responsable debe revisar el tono y verificar los datos con la fuente antes de radicar.'
    }),
    Object.freeze({
      id: 'sc-4',
      title: 'Tratamiento de datos personales sensibles (Ley 1581)',
      dimension: 'Trabajo y privacidad',
      description: 'Cargar una lista con nombres, números de cédula, direcciones y antecedentes disciplinarios o de salud de ciudadanos para que la IA los ordene.',
      expected: 'red',
      explanation: 'No recomendable / Prohibido: viola la Ley 1581 de 2012 de protección de datos. La información sensible nunca debe subirse a asistentes externos sin anonimización estricta.'
    }),
    Object.freeze({
      id: 'sc-5',
      title: 'Cálculo presupuestal o liquidación sin calculadora',
      dimension: 'Trabajo y finanzas',
      description: 'Pedirle al chat que sume y liquide una nómina de diez empleados y usar directamente el total en el informe sin contrastar con fórmula ni calculadora.',
      expected: 'yellow',
      explanation: 'Precaución alta / Verificación obligatoria: la IA puede alucinar operaciones aritméticas con apariencia segura. Puedes pedirle la fórmula, pero debes comprobar el cálculo con una calculadora independiente.'
    }),
    Object.freeze({
      id: 'sc-6',
      title: 'Tutor de aprendizaje socrático y explicaciones',
      dimension: 'Aprendizaje personal',
      description: 'Pedirle a la IA: «Actúa como tutor pedagógico. Explícame el concepto de línea base con una analogía sencilla y hazme tres preguntas para comprobar si entendí».',
      expected: 'green',
      explanation: 'Recomendable como apoyo al aprendizaje: puedes pedir explicaciones y preguntas para comprobar tu comprensión. Contrasta las respuestas con el material de estudio.'
    })
  ]);

  // 2. Simulador de Auditoría de Salidas (Detector de Alucinaciones)
  const AUDIT_STATEMENTS = Object.freeze([
    Object.freeze({
      id: 'st-1',
      text: 'El Centro A registra 42 deserciones sobre 840 matriculados, lo que equivale a una tasa del 5,0 %.',
      status: 'verified',
      reason: 'Respaldado en la fuente: en bienestar.csv figuran exactamente 42 deserciones y 840 matriculados. El cálculo 42 ÷ 840 × 100 = 5 % es matemáticamente exacto.'
    }),
    Object.freeze({
      id: 'st-2',
      text: 'El Centro A registra 84 deserciones entre 840 matriculados.',
      status: 'hallucination',
        sourceStatus: 'contradicted',
      reason: 'Contradicha: bienestar.csv registra 42 deserciones para el Centro A, no 84. Corrige la cantidad y los cálculos que dependan de ella.'
    }),
    Object.freeze({
      id: 'st-3',
      text: 'La deserción en el Centro A se originó por dificultades en las rutas de transporte intermunicipal.',
      status: 'hallucination',
        sourceStatus: 'not-stated',
      reason: 'Alucinación de causa: la tabla solo contiene columnas numéricas de matrículas y deserciones. Atribuir causas de transporte es una invención sin sustento.'
    }),
    Object.freeze({
      id: 'st-4',
      text: 'Los datos de sedes complementarias quedan pendientes de confirmación con la coordinación académica.',
      status: 'hallucination',
        sourceStatus: 'not-stated',
      reason: 'Sin sustento: Bienestar no identifica sedes complementarias ni asigna esta confirmación a coordinación académica. Una frase prudente también necesita fuente. Retira esa mención o regístrala como una pregunta por verificar.'
    })
  ]);

  // 3. Comparador de Prompts CRTT
  const PROMPT_COMPARISONS = Object.freeze({
    pqrs: Object.freeze({
      title: 'Atención a PQRS · Caso PC-01',
      source: '«Me avisaron por el grupo que cambiaba el salón pero no sé si también la hora; el enlace del calendario abre una sesión vieja. ¿Me confirman cuál usar?».',
      vague: Object.freeze({
        prompt: 'Respóndele a este usuario que nos escribió por el salón.',
        simulatedOutput: 'Estimado usuario: Le confirmamos que la actividad se realizará mañana a las 8:00 a. m. en el Salón 204. Puede ingresar con el nuevo enlace enviado a su correo institucional.',
        riskAnalysis: 'Riesgo de desinformación: la IA inventó la hora (8:00 a. m.) y el salón (204), y aseguró que se envió un nuevo enlace. Si envías este borrador, podrías dar indicaciones equivocadas a la persona.'
      }),
      crtt: Object.freeze({
        prompt: 'Rol: Asistente administrativo. Contexto: Solicitud PC-01. Tarea: Redactar respuesta formal y cortés. Límites: Usa únicamente el caso. No inventes fecha, hora, salón ni enlaces. Si no constan, indica que quedan pendientes de confirmación oficial con el área de logística.',
        simulatedOutput: 'Recibimos su consulta sobre el salón y el horario. Para verificarla, necesitamos la fecha de la actividad y el enlace que consultó. Los datos vigentes quedan por confirmar con el área responsable.',
        riskAnalysis: 'Este borrador pide datos para verificar la consulta y conserva los pendientes. No afirma que se haya remitido una solicitud ni promete una actuación. Una instrucción estructurada también requiere contrastar cada respuesta con la fuente.'
      })
    })
  });

  // 4. Casos del Anonimizador (Módulo 01): misma taxonomía que el semáforo del Paso 1
  const ANONYMIZATION_LABELS = Object.freeze({ usar: 'Usar', reducir: 'Reducir', 'no-cargar': 'No cargar' });

  const ANONYMIZATION_CASES = Object.freeze([
    Object.freeze({
      id: 'anon-1',
      fragment: '«Taller para 18 personas. Sede, fecha y franja horaria por confirmar».',
      expected: 'usar',
      reason: 'Son datos de la actividad que la tarea necesita y no identifican a nadie. Comparte solo este fragmento en la herramienta autorizada.',
      sanitized: '«Taller para 18 personas. Sede, fecha y franja horaria por confirmar» (sin cambios).'
    }),
    Object.freeze({
      id: 'anon-2',
      fragment: '«Solicita la sala: Carlos Alberto Gómez Mendoza, C.C. 1.098.765.432, correo cgomez@ejemplo.co».',
      expected: 'reducir',
      reason: 'El nombre, la cédula y el correo identifican a la persona y no hacen falta para revisar la solicitud. Cambia el nombre por un rol y quita los números.',
      sanitized: '«Una persona del área de formación solicita la sala».'
    }),
    Object.freeze({
      id: 'anon-3',
      fragment: '«Dos asistentes al taller tienen incapacidad médica esta semana».',
      expected: 'no-cargar',
      reason: 'Es información de salud, un dato sensible según la Ley 1581 de 2012. No la pegues en ningún asistente; si afecta la reserva, la trata la persona responsable en los sistemas oficiales.',
      sanitized: '«El aforo final está pendiente de confirmar con la persona responsable».'
    }),
    Object.freeze({
      id: 'anon-4',
      fragment: '«Para reservar, entra al sistema de salas con el usuario y la contraseña de logística que aparecen en el correo».',
      expected: 'no-cargar',
      reason: 'Es una credencial. Nunca se comparte con un asistente; quien tiene el permiso entra al sistema de reservas.',
      sanitized: '«La reserva se registra en el sistema de salas con la cuenta de la persona autorizada».'
    })
  ]);

  // 5. Criterios de Evaluación PQRS (Módulo 02)
  const PQRS_CRITERIA = Object.freeze([
    Object.freeze({
      id: 'cortesia',
      title: 'Tratamiento institucional cortés',
      description: 'Usa saludo formal, lenguaje respetuoso y tono institucional claro.'
    }),
    Object.freeze({
      id: 'sin_invenciones',
      title: 'Sin datos inventados',
      description: 'No inventa hora, fecha, salón, enlaces ni gestiones realizadas que no consten en la fuente original.'
    }),
    Object.freeze({
      id: 'trazabilidad',
      title: 'Trazabilidad y datos pendientes',
      description: 'Menciona expresamente qué datos quedan pendientes de confirmar con el área responsable.'
    }),
    Object.freeze({
      id: 'decision_humana',
      title: 'Reserva de la decisión humana',
      description: 'No aprueba la solicitud por su cuenta; aclara que la confirmación corresponde a la coordinación.'
    })
  ]);

  // 6. Registros muestra para depuración de planillas (Módulo 03)
  const DATA_CLEANING_RECORDS = Object.freeze([
    Object.freeze({ fila: 5, codigo: 'SIM-0001', aprendiz: 'Aprendiz 001', sede: 'Vélez', estado: 'EN CURSO', fecha: '2026-03-01' }),
    Object.freeze({ fila: 6, codigo: 'SIM-0002', aprendiz: 'Aprendiz 002', sede: 'VÉLEZ', estado: 'FINALIZADO ', fecha: '1/3/26' }),
    Object.freeze({ fila: 7, codigo: 'SIM-0003', aprendiz: 'Aprendiz 003', sede: 'Puente Nacional', estado: '', fecha: '01-03-2026' }),
    Object.freeze({ fila: 16, codigo: 'SIM-0012', aprendiz: 'Aprendiz 012', sede: 'velez ', estado: 'pendiente ', fecha: '' }),
    Object.freeze({ fila: 23, codigo: 'SIM-0012', aprendiz: 'Aprendiz 019', sede: 'Vélez', estado: 'pendiente ', fecha: '' })
  ]);

  return { SAFETY_SCENARIOS, AUDIT_STATEMENTS, PROMPT_COMPARISONS, ANONYMIZATION_LABELS, ANONYMIZATION_CASES, PQRS_CRITERIA, DATA_CLEANING_RECORDS };
});
