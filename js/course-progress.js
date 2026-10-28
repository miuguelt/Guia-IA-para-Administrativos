(function (root, factory) {
  'use strict';
  const progress = factory();
  if (typeof module === 'object' && module.exports) module.exports = progress;
  if (root) root.CourseProgress = progress;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  const STORAGE_KEY = 'sena_bogota_ia_administrativos_21720210_progress';
  const MODULE_IDS = Object.freeze([
    'inicio',
    'preparacion',
    'm01-fundamentos',
    'm02-diseno',
    'm03-implementacion',
    'm04-validacion',
    'm05-cierre',
    'calendario',
    'ecobogota',
    'laboratorio-datos',
    'portafolio'
  ]);

  const SIMULATORS = Object.freeze({
    'anonymization': { label: 'Semáforo de datos de la sala (M01)', minutes: 15 },
    'decision': { label: '¿Regla, IA o Persona? (M01)', minutes: 10 },
    'safety': { label: 'Semáforo de seguridad (M01)', minutes: 15 },
    'pqrs': { label: 'Evaluador de respuestas PQRS (M02)', minutes: 20 },
    'data-cleaner': { label: 'Depurador de planillas (M03)', minutes: 25 },
    'audit': { label: 'Auditoría de cifras y alucinaciones (M04)', minutes: 20 },
    'roi': { label: 'Calculadora de impacto y ROI (M05)', minutes: 25 },
    'ecobogota': { label: 'Simulador EcoBogotá · opcional', optional: true }
  });

  const EVIDENCES = Object.freeze([
    'MG-A01',
    'MG-A02',
    'MG-A03',
    'MG-A04',
    'MG-A05'
  ]);

  const MODULE_NAMES = Object.freeze({
    'inicio': 'Inicio',
    'preparacion': 'Preparación',
    'm01-fundamentos': 'Módulo 01 · Comprende el problema',
    'm02-diseno': 'Módulo 02 · Diseña instrucciones claras',
    'm03-implementacion': 'Módulo 03 · Resuelve tareas de tu área',
    'm04-validacion': 'Módulo 04 · Verifica lo que obtienes',
    'm05-cierre': 'Módulo 05 · Presenta una mejora',
    'calendario': 'Cronograma',
    'ecobogota': 'Práctica EcoBogotá',
    'laboratorio-datos': 'Laboratorio de datos',
    'portafolio': 'Portafolio de Evidencias'
  });

  const CHALLENGES = Object.freeze([
    'reto-0',
    'reto-1',
    'reto-2',
    'reto-3',
    'reto-4',
    'reto-5',
    'reto-6',
    'reto-7',
    'reto-8',
    'reto-9',
    'reto-integrador'
  ]);

  const CHALLENGE_NAMES = Object.freeze({
    'reto-0': 'Reto 0 · Decide qué información compartir',
    'reto-1': 'Reto 1 · Convierte el lineamiento en una respuesta verificable',
    'reto-2': 'Reto 2 · Prepara dos respuestas para revisión',
    'reto-3': 'Reto 3 · Prueba una instrucción reutilizable',
    'reto-4': 'Reto 4 · Bandeja de 50 mensajes con razones visibles',
    'reto-5': 'Reto 5 · Acta que distingue acuerdo de intención',
    'reto-6': 'Reto 6 · Datos desordenados con una regla reproducible',
    'reto-7': 'Reto 7 · Diseña el flujo antes de automatizar',
    'reto-8': 'Reto 8 · Presupuesto, tasa y gráfico con unidades',
    'reto-9': 'Reto 9 · Auditoría de una respuesta convincente',
    'reto-integrador': 'Reto integrador · Plan, análisis y sustentación'
  });

  const CHALLENGE_MODULES = Object.freeze({
    'reto-0': 'preparacion',
    'reto-1': 'm01-fundamentos',
    'reto-2': 'm02-diseno',
    'reto-3': 'm02-diseno',
    'reto-4': 'm03-implementacion',
    'reto-5': 'm03-implementacion',
    'reto-6': 'm03-implementacion',
    'reto-7': 'm03-implementacion',
    'reto-8': 'm04-validacion',
    'reto-9': 'm04-validacion',
    'reto-integrador': 'm05-cierre'
  });

  const EVIDENCE_STATES = Object.freeze({
    reviewed: { mark: '✓', item: 'revisada', label: 'Revisada' },
    saved: { mark: '◐', item: 'guardada, falta tu revisión', label: 'Guardada, falta tu revisión' },
    pending: { mark: '○', item: 'pendiente', label: 'Pendiente' }
  });

  function evidenceState(state, id) {
    if (state.reviewedEvidences?.includes(id)) return EVIDENCE_STATES.reviewed;
    if (state.savedEvidences?.includes(id)) return EVIDENCE_STATES.saved;
    return EVIDENCE_STATES.pending;
  }

  function createInitialState() {
    return {
      visitedModules: ['inicio'],
      completedSimulators: [],
      savedEvidences: [],
      reviewedEvidences: [],
      reviewedChallenges: []
    };
  }

  function loadProgress(storage) {
    if (!storage) return createInitialState();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw);
      return {
        visitedModules: Array.isArray(parsed?.visitedModules) ? parsed.visitedModules : ['inicio'],
        completedSimulators: Array.isArray(parsed?.completedSimulators) ? parsed.completedSimulators : [],
        savedEvidences: Array.isArray(parsed?.savedEvidences) ? parsed.savedEvidences : [],
        reviewedEvidences: Array.isArray(parsed?.reviewedEvidences) ? parsed.reviewedEvidences : [],
        reviewedChallenges: Array.isArray(parsed?.reviewedChallenges) ? parsed.reviewedChallenges : []
      };
    } catch {
      return createInitialState();
    }
  }

  function saveProgress(storage, state) {
    if (!storage || !state) return false;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  function markModuleVisited(state, moduleId) {
    if (!moduleId || state.visitedModules.includes(moduleId)) return state;
    return {
      ...state,
      visitedModules: [...state.visitedModules, moduleId]
    };
  }

  function markSimulatorCompleted(state, simulatorId) {
    if (!simulatorId || !SIMULATORS[simulatorId] || state.completedSimulators.includes(simulatorId)) return state;
    return {
      ...state,
      completedSimulators: [...state.completedSimulators, simulatorId]
    };
  }

  function markEvidenceSaved(state, evidenceId) {
    if (!evidenceId || state.savedEvidences.includes(evidenceId)) return state;
    return {
      ...state,
      savedEvidences: [...state.savedEvidences, evidenceId]
    };
  }

  function markChallengeReviewed(state, challengeId) {
    if (!challengeId || !CHALLENGES.includes(challengeId)) return state;
    const reviewed = Array.isArray(state.reviewedChallenges) ? state.reviewedChallenges : [];
    if (reviewed.includes(challengeId)) return state;
    return {
      ...state,
      reviewedChallenges: [...reviewed, challengeId]
    };
  }

  function getNextChallenge(state) {
    const s = state || createInitialState();
    const reviewed = Array.isArray(s.reviewedChallenges) ? s.reviewedChallenges : [];
    const nextId = CHALLENGES.find(id => !reviewed.includes(id)) || null;
    if (!nextId) return null;
    return {
      id: nextId,
      name: CHALLENGE_NAMES[nextId] || nextId,
      moduleId: CHALLENGE_MODULES[nextId] || null,
      moduleName: MODULE_NAMES[CHALLENGE_MODULES[nextId]] || null
    };
  }

  function computeProgressStats(state) {
    const s = state || createInitialState();
    const coreSimulators = Object.keys(SIMULATORS).filter(id => !SIMULATORS[id].optional);
    const totalSimulatorsCount = coreSimulators.length;
    const totalEvidencesCount = EVIDENCES.length;
    const totalCoreModules = 6; // preparacion + m01 a m05

    const coreModulesVisited = ['preparacion', 'm01-fundamentos', 'm02-diseno', 'm03-implementacion', 'm04-validacion', 'm05-cierre']
      .filter(id => s.visitedModules.includes(id)).length;

    const simulatorsDone = coreSimulators.filter(id => s.completedSimulators.includes(id)).length;
    const evidencesDone = EVIDENCES.filter(id => s.savedEvidences.includes(id)).length;

    const reviewedCount = EVIDENCES.filter(id => s.reviewedEvidences?.includes(id)).length;
    const percentage = Math.round(reviewedCount / totalEvidencesCount * 100);

    const challengesDone = CHALLENGES.filter(id => s.reviewedChallenges?.includes(id)).length;
    const totalChallengesCount = CHALLENGES.length;

    return {
      percentage,
      coreModulesVisited,
      totalCoreModules,
      simulatorsDone,
      totalSimulatorsCount,
      evidencesDone,
      reviewedCount,
      totalEvidencesCount,
      challengesDone,
      totalChallengesCount
    };
  }

  function updateDom(doc, stats, state) {
    if (!doc) return;
    const progressBar = doc.getElementById('course-progress-bar');
    const percentEl = doc.getElementById('course-progress-percent');
    const savedTimeEl = doc.getElementById('course-progress-saved-time');
    const checklistList = doc.getElementById('progress-checklist-items');

    if (progressBar) {
      progressBar.value = stats.percentage;
      progressBar.setAttribute('aria-valuenow', String(stats.percentage));
    }
    if (percentEl) {
      percentEl.textContent = `${stats.percentage}%`;
    }
    if (savedTimeEl) {
      savedTimeEl.textContent = `${stats.reviewedCount} de ${stats.totalEvidencesCount} evidencias revisadas`;
      savedTimeEl.title = 'Revisión registrada por ti. La valoración institucional permanece pendiente.';
    }
    if (state) {
      doc.querySelectorAll('[data-evidence-status]').forEach(node => {
        node.textContent = evidenceState(state, node.dataset.evidenceStatus).label;
      });
    }
    const nextChallengeEl = doc.getElementById('next-challenge-link');
    if (nextChallengeEl) {
      const next = getNextChallenge(state);
      if (next) {
        nextChallengeEl.hidden = false;
        nextChallengeEl.textContent = `Siguiente reto: ${next.name}`;
        nextChallengeEl.href = `#${next.id}`;
        if (next.moduleId) {
          nextChallengeEl.dataset.targetModule = next.moduleId;
        }
      } else {
        nextChallengeEl.hidden = true;
      }
    }

    if (checklistList && state) {
      checklistList.replaceChildren();

      // Evidencias: lo único que suma al porcentaje de avance.
      const evidenceHeader = doc.createElement('li');
      evidenceHeader.className = 'checklist-section-title';
      evidenceHeader.textContent = 'Evidencias del curso · cuentan para el avance';
      checklistList.append(evidenceHeader);
      EVIDENCES.forEach((id, index) => {
        const status = evidenceState(state, id);
        const item = doc.createElement('li');
        item.className = `checklist-item ${status === EVIDENCE_STATES.reviewed ? 'is-done' : 'is-pending'}`;
        item.textContent = `${status.mark} Evidencia ${index + 1} · ${status.item}`;
        checklistList.append(item);
      });

      // Módulos
      const modHeader = doc.createElement('li');
      modHeader.className = 'checklist-section-title';
      modHeader.textContent = 'Módulos consultados · no suman al avance';
      checklistList.append(modHeader);

      ['preparacion', 'm01-fundamentos', 'm02-diseno', 'm03-implementacion', 'm04-validacion', 'm05-cierre'].forEach(modId => {
        const item = doc.createElement('li');
        const done = state.visitedModules.includes(modId);
        item.className = `checklist-item ${done ? 'is-done' : 'is-pending'}`;
        item.textContent = `${done ? '✓' : '○'} ${MODULE_NAMES[modId]}`;
        checklistList.append(item);
      });

      // Simuladores
      const simHeader = doc.createElement('li');
      simHeader.className = 'checklist-section-title';
      simHeader.textContent = 'Simuladores ensayados · práctica opcional';
      checklistList.append(simHeader);

      Object.entries(SIMULATORS).forEach(([id, meta]) => {
        const item = doc.createElement('li');
        const done = state.completedSimulators.includes(id);
        item.className = `checklist-item ${done ? 'is-done' : 'is-pending'}`;
        item.textContent = `${done ? '✓' : '○'} ${meta.label}`;
        checklistList.append(item);
      });

      // Retos
      const retosHeader = doc.createElement('li');
      retosHeader.className = 'checklist-section-title';
      retosHeader.textContent = 'Retos de práctica · no suman al avance';
      checklistList.append(retosHeader);

      CHALLENGES.forEach(id => {
        const item = doc.createElement('li');
        const done = state.reviewedChallenges?.includes(id);
        item.className = `checklist-item ${done ? 'is-done' : 'is-pending'}`;
        item.textContent = `${done ? '✓' : '○'} ${CHALLENGE_NAMES[id] || id}`;
        checklistList.append(item);
      });
    }
  }

  function init(options = {}) {
    const doc = options.document || (typeof window === 'undefined' ? null : window.document);
    if (!doc) return false;
    const storage = options.storage || (typeof window === 'undefined' ? null : window.localStorage);

    let state = loadProgress(storage);
    let source;
    let stats = computeProgressStats(state);
    updateDom(doc, stats, state);

    const toggleBtn = doc.getElementById('progress-checklist-toggle');
    const dropdown = doc.getElementById('progress-checklist-dropdown');

    if (toggleBtn && dropdown) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = !dropdown.hidden;
        dropdown.hidden = isOpen;
        toggleBtn.setAttribute('aria-expanded', String(!isOpen));
      });
    }

    const refresh = () => {
      if (source) state = {...state, reviewedEvidences: EVIDENCES.filter(id => {
        const artifact = source.registro.artifacts.find(item => item.id === id);
        return artifact && doc.defaultView.DevBrainSDK.evidence.calcularEstado(artifact, source.store.leer(id)) === 'lista';
      })};
      stats = computeProgressStats(state);
      saveProgress(storage, state);
      updateDom(doc, stats, state);
    };

    const handleNavigate = event => {
      const pageId = event?.detail?.pageId;
      if (pageId && MODULE_IDS.includes(pageId)) {
        state = markModuleVisited(state, pageId);
        refresh();
      }
    };

    const handleSimulator = event => {
      const simId = event?.detail?.simulatorId;
      if (simId) {
        state = markSimulatorCompleted(state, simId);
        refresh();
      }
    };

    const handleEvidence = event => {
      const eviId = event?.detail?.evidenceId;
      if (eviId) {
        state = markEvidenceSaved(state, eviId);
        refresh();
      }
    };

    const handleChallenge = event => {
      const chId = event?.detail?.challengeId;
      if (chId) {
        state = markChallengeReviewed(state, chId);
        refresh();
      }
    };

    const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
    if (win) {
      win.addEventListener('course:navigate', handleNavigate);
      win.addEventListener('simulator:completed', handleSimulator);
      win.addEventListener('evidence:saved', handleEvidence);
      win.addEventListener('challenge:reviewed', handleChallenge);
    }

    return {
      getState: () => state,
      getStats: () => stats,
      refresh,
      connect: mounted => { source = mounted; refresh(); return mounted.store.suscribir(refresh); },
      markModule: id => { state = markModuleVisited(state, id); refresh(); },
      markSimulator: id => { state = markSimulatorCompleted(state, id); refresh(); },
      markEvidence: id => { state = markEvidenceSaved(state, id); refresh(); },
      markChallenge: id => { state = markChallengeReviewed(state, id); refresh(); },
      getNextChallenge: () => getNextChallenge(state)
    };
  }

  return {
    STORAGE_KEY,
    MODULE_IDS,
    SIMULATORS,
    EVIDENCES,
    MODULE_NAMES,
    CHALLENGES,
    CHALLENGE_NAMES,
    CHALLENGE_MODULES,
    createInitialState,
    loadProgress,
    saveProgress,
    markModuleVisited,
    markSimulatorCompleted,
    markEvidenceSaved,
    markChallengeReviewed,
    getNextChallenge,
    computeProgressStats,
    updateDom,
    init
  };
});
