(function (root, factory) {
  'use strict';
  const dependency = typeof module === 'object' && module.exports
    ? require('./interactive-aids-data.js') : root.CourseInteractiveAidsData;
  const api = factory(dependency);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CourseInteractiveAidsModel = api;
})(typeof window === 'undefined' ? globalThis : window, function (dependency) {
  'use strict';

  const { SAFETY_SCENARIOS, AUDIT_STATEMENTS, PROMPT_COMPARISONS, ANONYMIZATION_LABELS, ANONYMIZATION_CASES, PQRS_CRITERIA, DATA_CLEANING_RECORDS } = dependency;

  // --- Estados Iniciales ---

  function createSafetyState() {
    return {
      currentIndex: 0,
      answers: {},
      score: 0
    };
  }

  function createAuditState() {
    return {
      audited: {},
      completed: false
    };
  }

  function createPromptCompareState() {
    return {
      selectedPreset: 'pqrs',
      mode: 'crtt'
    };
  }

  function createAnonymizationState() {
    return {
      currentIndex: 0,
      answers: {},
      score: 0
    };
  }

  function createPqrsEvaluatorState() {
    return {
      checkedCriteria: {}
    };
  }

  function createDataCleanerState() {
    return {
      activeRules: {
        trim_spaces: false,
        uppercase_states: false,
        flag_empty_review: false
      }
    };
  }

  // --- Funciones Lógicas Puras ---

  function classifyScenario(state, scenarioIndex, choice) {
    if (scenarioIndex < 0 || scenarioIndex >= SAFETY_SCENARIOS.length) {
      return { ok: false, message: 'Índice de escenario fuera de rango.' };
    }
    const scenario = SAFETY_SCENARIOS[scenarioIndex];
    const isCorrect = choice === scenario.expected;
    const nextAnswers = { ...state.answers, [scenario.id]: choice };
    const correctCount = Object.keys(nextAnswers).filter(
      id => nextAnswers[id] === SAFETY_SCENARIOS.find(s => s.id === id).expected
    ).length;

    const nextState = {
      ...state,
      answers: nextAnswers,
      score: correctCount
    };

    return {
      ok: true,
      state: nextState,
      isCorrect,
      expected: scenario.expected,
      explanation: scenario.explanation
    };
  }

  function auditStatement(state, statementIndex, decision) {
    if (statementIndex < 0 || statementIndex >= AUDIT_STATEMENTS.length) {
      return { ok: false, message: 'Índice de afirmación fuera de rango.' };
    }
    const statement = AUDIT_STATEMENTS[statementIndex];
    const expected = statement.sourceStatus || statement.status;
      const answer = decision === 'hallucination' && statement.status === 'hallucination' ? expected : decision;
      const isCorrect = answer === expected;
    const nextAudited = { ...state.audited, [statement.id]: answer };
    const allDone = Object.keys(nextAudited).length === AUDIT_STATEMENTS.length;
    const correctCount = AUDIT_STATEMENTS.filter(item => nextAudited[item.id] === (item.sourceStatus || item.status)).length;
    const allCorrect = correctCount === AUDIT_STATEMENTS.length;

    const nextState = {
      ...state,
      audited: nextAudited,
      completed: allCorrect
    };

    return {
      ok: true,
      state: nextState,
      isCorrect,
      expected,
      reason: statement.reason,
      allDone,
      allCorrect,
      correctCount
    };
  }

  function classifyAnonymizationItem(state, itemIndex, classification) {
    if (itemIndex < 0 || itemIndex >= ANONYMIZATION_CASES.length) {
      return { ok: false, message: 'Índice fuera de rango.' };
    }
    const item = ANONYMIZATION_CASES[itemIndex];
    const isCorrect = classification === item.expected;
    const nextAnswers = { ...state.answers, [item.id]: classification };
    const correctCount = Object.keys(nextAnswers).filter(
      id => nextAnswers[id] === ANONYMIZATION_CASES.find(c => c.id === id).expected
    ).length;

    const nextState = {
      ...state,
      answers: nextAnswers,
      score: correctCount
    };

    return {
      ok: true,
      state: nextState,
      isCorrect,
      expected: item.expected,
      reason: item.reason,
      sanitized: item.sanitized
    };
  }

  function getAnonymizationSummaryText(state) {
    const lines = ['Semáforo de datos de la solicitud de sala (Ley 1581 de 2012). Borrador para revisar:'];
    ANONYMIZATION_CASES.forEach((item, idx) => {
      const choice = ANONYMIZATION_LABELS[state.answers[item.id]] || 'pendiente';
      lines.push(`${idx + 1}. ${item.fragment} -> Clasificación: ${choice}. ${item.reason} Versión segura: ${item.sanitized}`);
    });
    return lines.join('\n');
  }

  function togglePqrsCriterion(state, criterionKey, isChecked) {
    const nextCriteria = { ...state.checkedCriteria, [criterionKey]: Boolean(isChecked) };
    const checkedCount = Object.values(nextCriteria).filter(Boolean).length;
    const allPassed = checkedCount === PQRS_CRITERIA.length;
    return {
      state: { ...state, checkedCriteria: nextCriteria },
      checkedCount,
      totalCount: PQRS_CRITERIA.length,
      allPassed
    };
  }

  function getPqrsSummaryText(state) {
    const lines = ['Auditoría de borrador de respuesta a PQRS (Caso PC-01):', 'Ensayo guiado: esta lista no sustituye los dos borradores propios ni la ejecución del Reto 2 con IA.'];
    PQRS_CRITERIA.forEach(crit => {
      const isChecked = Boolean(state.checkedCriteria[crit.id]);
      lines.push(`- [${isChecked ? 'CUMPLE' : 'PENDIENTE'}] ${crit.title}: ${crit.description}`);
    });
    return lines.join('\n');
  }

  function applyCleaningRules(state, ruleKey, isEnabled) {
    const nextRules = { ...state.activeRules, [ruleKey]: Boolean(isEnabled) };
    const cleaned = DATA_CLEANING_RECORDS.map(rec => {
      let estado = rec.estado;

      if (nextRules.trim_spaces) {
        estado = estado.trim();
      }
      if (nextRules.uppercase_states && estado) {
        estado = estado.toUpperCase();
      }
      if (nextRules.flag_empty_review && !estado) {
        estado = 'REVISAR';
      }
      return { ...rec, estado };
    });

    const transformedCount = cleaned.filter((rec, idx) => {
      const orig = DATA_CLEANING_RECORDS[idx];
      return rec.estado !== orig.estado;
    }).length;

    return {
      state: { ...state, activeRules: nextRules },
      cleaned,
      transformedCount
    };
  }

  function getDataCleanerSummaryText(state) {
    const result = applyCleaningRules(state, 'dummy', false);
    const lines = ['Reporte de normalización reproducible de datos (Módulo 03):'];
    lines.push('Ensayo local de una muestra de 5 de los 30 registros de datos-sofia.csv. No demuestra el procesamiento del archivo completo ni la ejecución con IA del Reto 6.');
    lines.push(`Reglas activas: Espacios=${state.activeRules.trim_spaces ? 'SÍ' : 'NO'}, Mayúsculas=${state.activeRules.uppercase_states ? 'SÍ' : 'NO'}, Pendientes REVISAR=${state.activeRules.flag_empty_review ? 'SÍ' : 'NO'}`);
    lines.push('Muestra procesada:');
    result.cleaned.forEach(rec => {
      lines.push(`- Fila ${rec.fila}, ${rec.codigo}, ${rec.aprendiz}: Municipio original='${rec.sede}', Estado revisado='${rec.estado}', Fecha original='${rec.fecha || 'VACÍA'}'`);
    });
    return lines.join('\n');
  }

  function calculateProductivityRoi(params) {
    const taskName = (params?.taskName || 'Gestión de correspondencia y solicitudes').trim();
    const volume = Number(params?.weeklyVolume) || 0;
    const manualMin = Number(params?.manualMinutes) || 0;
    const aiMin = Number(params?.aiMinutes) || 0;
    const measurementStatus = params?.measurementStatus === 'medido' ? 'medido' : 'supuesto';

    if (![volume, manualMin, aiMin].every(Number.isFinite) || volume <= 0 || manualMin <= 0 || aiMin <= 0) {
      return {
        valid: false,
        error: 'Ingresa valores finitos mayores a cero para volumen y tiempos.'
      };
    }

    const manualWeeklyHours = (volume * manualMin) / 60;
    const aiWeeklyHours = (volume * aiMin) / 60;
    const savedHours = manualWeeklyHours - aiWeeklyHours;
    const savedMinutes = (volume * manualMin) - (volume * aiMin);
    const efficiencyPercent = Math.round(((manualMin - aiMin) / manualMin) * 100);

    const basis = measurementStatus === 'medido'
      ? 'Mediciones observadas de tareas equivalentes, con el mismo criterio de calidad y volumen semanal observado.'
      : 'Escenario hipotético con supuestos: el ahorro real queda pendiente de medición comparable.';
    const balance = savedMinutes < 0
      ? `Tiempo adicional: ${Math.abs(savedHours).toFixed(1)} horas/semana (${Math.abs(savedMinutes)} min).`
      : `Ahorro ${measurementStatus === 'medido' ? 'observado' : 'hipotético'}: ${savedHours.toFixed(1)} horas/semana (${savedMinutes} min).`;
    const summaryText = `Análisis de retorno de tiempo · Tarea: ${taskName}. ${basis} Volumen semanal: ${volume} trámites. Tiempo manual previo: ${manualMin} min/trámite (${manualWeeklyHours.toFixed(1)} h/sem). Tiempo con IA y revisión humana: ${aiMin} min/trámite (${aiWeeklyHours.toFixed(1)} h/sem). ${balance} Variación del tiempo: ${efficiencyPercent}%.`;

    return {
      valid: true,
      taskName,
      volume,
      manualMin,
      aiMin,
      measurementStatus,
      manualWeeklyHours: Number(manualWeeklyHours.toFixed(1)),
      aiWeeklyHours: Number(aiWeeklyHours.toFixed(1)),
      savedHours: Number(savedHours.toFixed(1)),
      savedMinutes,
      efficiencyPercent,
      summaryText
    };
  }

  // --- Funciones Auxiliares de Transferencia y Copiado ---

  function transferTextToField(doc, fieldId, text) {
    if (!doc || !fieldId || !text) return false;
    const field = doc.getElementById(fieldId);
    if (!field) return false;
    field.value = text;
    const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
    if (win) {
      field.dispatchEvent(new win.Event('input', { bubbles: true }));
      win.dispatchEvent(new win.CustomEvent('evidence:saved', { detail: { fieldId } }));
    }
    return true;
  }

  function copyTextToClipboard(text, win = (typeof window !== 'undefined' ? window : null)) {
    if (!win || !win.navigator?.clipboard?.writeText) return false;
    try {
      win.navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return { ...dependency, createSafetyState, createAuditState, createPromptCompareState, createAnonymizationState, createPqrsEvaluatorState, createDataCleanerState, classifyScenario, auditStatement, classifyAnonymizationItem, getAnonymizationSummaryText, togglePqrsCriterion, getPqrsSummaryText, applyCleaningRules, getDataCleanerSummaryText, calculateProductivityRoi, transferTextToField, copyTextToClipboard };
});
