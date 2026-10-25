(function (root, factory) {
  'use strict';
  const simulator = factory();
  if (typeof module === 'object' && module.exports) module.exports = simulator;
  if (root) root.EcoBogotaSimulator = simulator;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const STORAGE_KEY = 'guia_refactor_sena_ecobogota_v1';
  const BINS = Object.freeze({
    white: Object.freeze({ label: 'blanca', category: 'residuos aprovechables' }),
    black: Object.freeze({ label: 'negra', category: 'residuos no aprovechables' }),
    green: Object.freeze({ label: 'verde', category: 'residuos orgánicos aprovechables' })
  });
  const ITEMS = Object.freeze([
    Object.freeze({ id: 'botella-plastica', name: 'Botella plástica limpia y vacía', color: 'white', illustration: 'media/ecobogota-residuos/botella-plastica.svg' }),
    Object.freeze({ id: 'frasco-vidrio', name: 'Frasco de vidrio limpio', color: 'white', illustration: 'media/ecobogota-residuos/frasco-vidrio.svg' }),
    Object.freeze({ id: 'lata-aluminio', name: 'Lata de aluminio vacía', color: 'white', illustration: 'media/ecobogota-residuos/lata-aluminio.svg' }),
    Object.freeze({ id: 'caja-carton', name: 'Caja de cartón limpia y seca', color: 'white', illustration: 'media/ecobogota-residuos/caja-carton.svg' }),
    Object.freeze({ id: 'hoja-papel', name: 'Hoja de papel limpia', color: 'white', illustration: 'media/ecobogota-residuos/hoja-papel.svg' }),
    Object.freeze({ id: 'cascara-banano', name: 'Cáscara de banano', color: 'green', illustration: 'media/ecobogota-residuos/cascara-banano.svg' }),
    Object.freeze({ id: 'restos-verduras', name: 'Restos de verduras', color: 'green', illustration: 'media/ecobogota-residuos/restos-verduras.svg' }),
    Object.freeze({ id: 'servilleta-sucia', name: 'Servilleta usada con comida', color: 'black', illustration: 'media/ecobogota-residuos/servilleta-sucia.svg' }),
    Object.freeze({ id: 'papel-higienico', name: 'Papel higiénico usado', color: 'black', illustration: 'media/ecobogota-residuos/papel-higienico.svg' }),
    Object.freeze({ id: 'papel-metalizado', name: 'Papel metalizado', color: 'black', illustration: 'media/ecobogota-residuos/papel-metalizado.svg' })
  ]);

  function createInitialState() {
    return {
      version: 1,
      diagnostic: null,
      prediction: null,
      started: false,
      activeWasteId: null,
      answers: {},
      corrections: [],
      correctionMode: false,
      explanation: ''
    };
  }

  function validatePrediction(value) {
    if (value === '' || value === null || value === undefined) return false;
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 && number <= ITEMS.length;
  }

  function setDiagnosis(state, answer) {
    if (!Object.hasOwn(BINS, answer)) return state;
    return {
      ...state,
      diagnostic: {
        answer,
        correct: answer === 'white',
        feedback: answer === 'white'
          ? 'Correcto: la botella plástica limpia va en la caneca blanca de residuos aprovechables.'
          : `La botella plástica limpia va en la caneca blanca, no en la ${BINS[answer].label}.`
      }
    };
  }

  function startSimulation(state, prediction) {
    if (state.started) return { state, ok: false, message: 'El lote ya comenzó. Continúa con la clasificación guardada.' };
    if (!validatePrediction(prediction)) {
      return { state, ok: false, message: 'Escribe un número entero entre 0 y 10 antes de iniciar.' };
    }
    return {
      state: { ...state, prediction: Number(prediction), started: true, activeWasteId: ITEMS[0].id },
      ok: true,
      message: 'Predicción guardada. El primer residuo está seleccionado; elige la caneca que corresponda.'
    };
  }

  function correctedItemIds(state) {
    return new Set((state.corrections || []).filter(entry => entry.correct).map(entry => entry.itemId));
  }

  function summarize(state) {
    const answers = state.answers || {};
    const answeredItems = ITEMS.filter(item => Object.hasOwn(answers, item.id));
    const errors = answeredItems.filter(item => answers[item.id] !== item.color).map(item => ({
      itemId: item.id,
      item: item.name,
      selected: answers[item.id],
      expected: item.color,
      corrected: correctedItemIds(state).has(item.id)
    }));
    const correct = answeredItems.length - errors.length;
    const organicCount = ITEMS.filter(item => item.color === 'green').length;
    const complete = answeredItems.length === ITEMS.length;
    const remainingErrors = errors.filter(error => !error.corrected);
    const firstPassCounts = Object.fromEntries(Object.keys(BINS).map(color => [
      color, answeredItems.filter(item => answers[item.id] === color).length
    ]));
    const referenceCounts = Object.fromEntries(Object.keys(BINS).map(color => [
      color, ITEMS.filter(item => item.color === color).length
    ]));
    const corrections = (state.corrections || []).map(entry => {
      const item = ITEMS.find(candidate => candidate.id === entry.itemId);
      return item ? {
        itemId: item.id,
        item: item.name,
        selected: entry.color,
        expected: item.color,
        correct: entry.color === item.color
      } : null;
    }).filter(Boolean);
    const correctedCount = errors.filter(error => error.corrected).length;
    return {
      complete,
      assigned: answeredItems.length,
      correct,
      finalCorrect: correct + correctedCount,
      total: ITEMS.length,
      organicCount,
      prediction: state.prediction,
      predictionDifference: validatePrediction(state.prediction) ? Number(state.prediction) - organicCount : null,
      errors,
      remainingErrors,
      corrections,
      correctionComplete: complete && remainingErrors.length === 0,
      firstPassCounts,
      referenceCounts
    };
  }

  function chooseWaste(state, itemId) {
    if (!state.started) return { state, ok: false, message: 'Escribe tu predicción e inicia el lote antes de clasificar.' };
    const item = ITEMS.find(candidate => candidate.id === itemId);
    if (!item) return { state, ok: false, message: 'No se encontró ese residuo en el lote.' };
    if (state.correctionMode) {
      const summary = summarize(state);
      if (!summary.errors.some(error => error.itemId === itemId)) {
        return { state, ok: false, message: 'Solo puedes corregir respuestas equivocadas del primer intento.' };
      }
      if (summary.errors.find(error => error.itemId === itemId)?.corrected) {
        return { state, ok: false, message: 'Ese error ya quedó corregido.' };
      }
      return { state: { ...state, activeWasteId: itemId }, ok: true, message: `Seleccionaste ${item.name} para corregir tu respuesta.` };
    }
    if (Object.hasOwn(state.answers, itemId)) return { state, ok: false, message: 'Ese residuo ya quedó clasificado en el primer intento.' };
    return { state: { ...state, activeWasteId: itemId }, ok: true, message: `Seleccionaste: ${item.name}. Ahora elige una caneca.` };
  }

  function beginCorrections(state) {
    const summary = summarize(state);
    if (!summary.complete) return { state, ok: false, message: 'Completa primero las diez respuestas del lote.' };
    if (!summary.remainingErrors.length) return { state, ok: false, message: 'No tienes errores pendientes por corregir.' };
    const next = { ...state, correctionMode: true, activeWasteId: summary.remainingErrors[0].itemId };
    return { state: next, ok: true, message: 'Selecciona un error del primer intento y vuelve a clasificarlo.' };
  }

  function classifyWaste(state, color) {
    if (!state.started) return { state, ok: false, message: 'Inicia el lote antes de clasificar.' };
    if (!Object.hasOwn(BINS, color)) return { state, ok: false, message: 'Elige una de las tres canecas disponibles.' };
    if (!state.activeWasteId) return { state, ok: false, message: 'Primero selecciona un residuo del lote.' };
    const item = ITEMS.find(candidate => candidate.id === state.activeWasteId);
    if (!item) return { state, ok: false, message: 'No se encontró el residuo seleccionado.' };
    const correct = item.color === color;
    const feedback = correct
      ? `Correcto: ${item.name.toLowerCase()} va en la caneca ${BINS[color].label}.`
      : `${item.name} va en la caneca ${BINS[item.color].label} porque corresponde a ${BINS[item.color].category}; la clasificaste en la ${BINS[color].label}.`;
    if (state.correctionMode) {
      if (!summarize(state).errors.some(error => error.itemId === item.id && !error.corrected)) {
        return { state, ok: false, message: 'Solo puedes corregir errores pendientes del primer intento.' };
      }
      const corrections = [...state.corrections, { itemId: item.id, color, correct }];
      const nextState = { ...state, corrections };
      const remainingErrors = summarize(nextState).remainingErrors;
      const activeWasteId = correct ? remainingErrors[0]?.itemId || null : item.id;
      const correctionMode = remainingErrors.length > 0;
      const next = { ...nextState, activeWasteId, correctionMode };
      return {
        state: next,
        ok: true,
        correct,
        complete: summarize(next).complete,
        correctionComplete: !correctionMode,
        message: correctionMode && correct ? `${feedback} Ahora revisa el siguiente error.` : feedback
      };
    }
    if (Object.hasOwn(state.answers, item.id)) return { state, ok: false, message: 'Ese residuo ya quedó clasificado en el primer intento.' };
    const next = {
      ...state,
      activeWasteId: null,
      answers: { ...state.answers, [item.id]: color }
    };
    return { state: next, ok: true, correct, complete: summarize(next).complete, message: feedback };
  }

  function updateExplanation(state, explanation) {
    return { ...state, explanation: String(explanation ?? '') };
  }

  function normalizeState(value) {
    const initial = createInitialState();
    if (!value || value.version !== 1 || typeof value !== 'object') return initial;
    const answers = {};
    if (value.answers && typeof value.answers === 'object') {
      ITEMS.forEach(item => {
        if (Object.hasOwn(BINS, value.answers[item.id])) answers[item.id] = value.answers[item.id];
      });
    }
    const diagnostic = value.diagnostic && Object.hasOwn(BINS, value.diagnostic.answer)
      ? setDiagnosis(initial, value.diagnostic.answer).diagnostic
      : null;
    const started = value.started === true && validatePrediction(value.prediction);
    const partial = {
      ...initial,
      diagnostic,
      prediction: started ? Number(value.prediction) : null,
      started,
      answers,
      corrections: [],
      explanation: typeof value.explanation === 'string' ? value.explanation : ''
    };
    if (Array.isArray(value.corrections)) {
      partial.corrections = value.corrections.filter(entry => {
        const item = ITEMS.find(candidate => candidate.id === entry?.itemId);
        return item && Object.hasOwn(BINS, entry.color) && Object.hasOwn(answers, item.id) && answers[item.id] !== item.color;
      }).map(entry => {
        const item = ITEMS.find(candidate => candidate.id === entry.itemId);
        return { itemId: item.id, color: entry.color, correct: entry.color === item.color };
      });
    }
    const correctionMode = value.correctionMode === true && summarize(partial).complete && summarize(partial).remainingErrors.length > 0;
    const activeCandidate = ITEMS.some(item => item.id === value.activeWasteId) ? value.activeWasteId : null;
    const activeWasteId = correctionMode
      ? summarize(partial).remainingErrors.some(error => error.itemId === activeCandidate) ? activeCandidate : summarize(partial).remainingErrors[0].itemId
      : started && activeCandidate && !Object.hasOwn(answers, activeCandidate) ? activeCandidate : null;
    return { ...partial, correctionMode, activeWasteId };
  }

  function saveState(storage, state) {
    try {
      if (!storage) return false;
      storage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadState(storage) {
    try {
      if (!storage) return createInitialState();
      const saved = storage.getItem(STORAGE_KEY);
      return saved ? normalizeState(JSON.parse(saved)) : createInitialState();
    } catch (error) {
      return createInitialState();
    }
  }

  function resetState(storage) {
    try {
      if (storage) storage.removeItem(STORAGE_KEY);
    } catch (error) {
      return createInitialState();
    }
    return createInitialState();
  }

  function evidenceValues(state) {
    const result = summarize(state);
    const diagnostic = state.diagnostic ? state.diagnostic.feedback : '';
    const prediction = validatePrediction(state.prediction) ? String(state.prediction) : '';
    const classification = result.complete
      ? `${result.correct} de ${result.total} correctos en el primer intento; ${result.finalCorrect} de ${result.total} después de las correcciones. Predicción: ${result.prediction}; residuos orgánicos aprovechables en el lote: ${result.organicCount}. ${result.errors.map(error => `${error.item}: primera respuesta, caneca ${BINS[error.selected]?.label || 'sin identificar'}; corresponde a ${BINS[error.expected].label}${error.corrected ? '; corregido en la revisión' : ''}.`).join(' ')}`
      : result.assigned ? `${result.assigned} de ${result.total} residuos clasificados; falta completar el lote.` : '';
    return {
      diagnostico: diagnostic,
      prediccion: prediction,
      resultado: classification,
      explicacion: state.explanation || ''
    };
  }

  function createSimulatorAttempt(state) {
    const summary = summarize(state);
    return {
      schemaVersion: 1,
      artifactId: 'ECO-A01',
      recordType: 'intento-simulador',
      diagnostico: {
        seleccion: state.diagnostic?.answer || null,
        correcta: state.diagnostic ? state.diagnostic.correct : null
      },
      prediccion: {
        residuosOrganicosEstimados: validatePrediction(state.prediction) ? Number(state.prediction) : null,
        residuosOrganicosEnElLote: summary.organicCount
      },
      clasificacionInicial: {
        puntaje: { aciertos: summary.correct, total: summary.total },
        respuestas: ITEMS.filter(item => Object.hasOwn(state.answers || {}, item.id)).map(item => ({
          codigoResiduo: item.id,
          residuo: item.name,
          canecaElegida: state.answers[item.id],
          canecaEsperada: item.color,
          correcta: state.answers[item.id] === item.color
        }))
      },
      correcciones: summary.corrections.map(entry => ({
        codigoResiduo: entry.itemId,
        residuo: entry.item,
        canecaElegida: entry.selected,
        canecaEsperada: entry.expected,
        correcta: entry.correct
      }))
    };
  }

  function renderWasteItems(document, list, state, onSelect) {
    if (list.dataset.ready === 'true') return;
    ITEMS.forEach(item => {
      const row = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'eco-waste-item';
      button.dataset.wasteId = item.id;
      const image = document.createElement('img');
      image.src = item.illustration;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.decoding = 'async';
      const label = document.createElement('span');
      label.className = 'eco-waste-name';
      label.textContent = item.name;
      button.append(image, label);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => onSelect(item.id));
      const status = document.createElement('span');
      status.className = 'eco-waste-status';
      row.append(button, status);
      list.append(row);
    });
    list.dataset.ready = 'true';
  }

  function updateChart(document, root, summary) {
    Object.keys(BINS).forEach(color => {
      const firstCount = summary.firstPassCounts[color];
      const referenceCount = summary.referenceCounts[color];
      const firstBar = root.querySelector(`[data-chart-bar="first-${color}"]`);
      const referenceBar = root.querySelector(`[data-chart-bar="reference-${color}"]`);
      firstBar.style.width = `${firstCount * 10}%`;
      referenceBar.style.width = `${referenceCount * 10}%`;
      firstBar.firstElementChild.textContent = String(firstCount);
      referenceBar.firstElementChild.textContent = String(referenceCount);
      root.querySelector(`[data-chart-value="first-${color}"]`).textContent = String(firstCount);
      root.querySelector(`[data-chart-value="reference-${color}"]`).textContent = String(referenceCount);
    });
    root.querySelector('#eco-chart-text').textContent = `Comparación de cantidades por caneca. Tu primer intento: blanca ${summary.firstPassCounts.white}, negra ${summary.firstPassCounts.black}, verde ${summary.firstPassCounts.green}. Lote de referencia: blanca ${summary.referenceCounts.white}, negra ${summary.referenceCounts.black}, verde ${summary.referenceCounts.green}.`;
  }

  function render(document, root, state) {
    const diagnosticFeedback = root.querySelector('#eco-diagnosis-feedback');
    const diagnosisAnswer = state.diagnostic?.answer || '';
    root.querySelectorAll('[data-diagnosis-answer]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.diagnosisAnswer === diagnosisAnswer));
    });
    diagnosticFeedback.textContent = state.diagnostic?.feedback || 'Elige una opción para comprobar este criterio.';
    const predictionInput = root.querySelector('#eco-prediction');
    if (document.activeElement !== predictionInput) predictionInput.value = state.prediction ?? '';
    root.querySelector('#eco-prediction-feedback').textContent = state.started ? 'Predicción guardada.' : '';
    root.querySelector('#eco-prediction').disabled = state.started;
    root.querySelector('#eco-start-simulator').disabled = state.started;
    root.querySelector('#eco-simulator').hidden = false;
    const summary = summarize(state);
    const list = root.querySelector('[data-eco-lot]');
    list.querySelectorAll('[data-waste-id]').forEach(button => {
      const id = button.dataset.wasteId;
      const item = ITEMS.find(candidate => candidate.id === id);
      const answer = state.answers[id];
      const assigned = Boolean(answer);
      const error = summary.errors.find(candidate => candidate.itemId === id);
      const canCorrect = state.correctionMode && error && !error.corrected;
      button.disabled = !state.started || (state.correctionMode ? !canCorrect : assigned);
      button.setAttribute('aria-pressed', String(state.activeWasteId === id));
      button.classList.toggle('is-selected', state.activeWasteId === id);
      const status = button.nextElementSibling;
      status.textContent = !assigned ? 'Sin clasificar' : answer === item.color
        ? 'Correcto en el primer intento'
        : error?.corrected ? `Error inicial: caneca ${BINS[item.color].label}; ya corregido` : `Error inicial: caneca ${BINS[item.color].label}`;
    });
    root.querySelectorAll('[data-bin]').forEach(button => {
      button.disabled = !state.started || !state.activeWasteId || (summary.complete && !state.correctionMode);
    });
    root.querySelector('#eco-simulator-status').textContent = state.activeWasteId
      ? `${summary.assigned} de ${summary.total} residuos clasificados. Elemento seleccionado${state.correctionMode ? ' para corregir' : ''}: ${ITEMS.find(item => item.id === state.activeWasteId).name}.`
      : `${summary.assigned} de ${summary.total} residuos clasificados${summary.complete ? ' en el primer intento' : ''}.`;
    root.querySelector('#eco-simulator-results').hidden = !summary.complete;
    root.querySelector('#eco-score').textContent = `${summary.correct} de ${summary.total}`;
    root.querySelector('#eco-initial-score').textContent = `${summary.correct} de ${summary.total}`;
    root.querySelector('#eco-final-score').textContent = `${summary.finalCorrect} de ${summary.total}`;
    const difference = summary.predictionDifference;
    root.querySelector('#eco-prediction-result').textContent = difference === null
      ? ''
      : `Predijiste ${summary.prediction}; el lote tiene ${summary.organicCount} residuos orgánicos aprovechables. Diferencia: ${difference > 0 ? '+' : ''}${difference}.`;
    const errors = root.querySelector('#eco-error-list');
    errors.replaceChildren();
    summary.errors.forEach(error => {
      const item = document.createElement('li');
      const correction = error.corrected ? ' Ya la corregiste en el segundo registro.' : ' Puedes volver a clasificarla.';
      item.textContent = `${error.item}: elegiste la caneca ${BINS[error.selected].label}; la correcta es la ${BINS[error.expected].label}.${correction}`;
      errors.append(item);
    });
    root.querySelector('#eco-correct-errors').hidden = summary.errors.length === 0;
    root.querySelector('#eco-correct-errors').disabled = summary.correctionComplete;
    root.querySelector('#eco-correction-status').textContent = state.correctionMode
      ? 'Estás revisando solo las respuestas equivocadas del primer intento.'
      : summary.correctionComplete && summary.errors.length ? 'Terminaste la revisión. El puntaje inicial se conserva.' : '';
    root.querySelector('#eco-comparison-chart').hidden = !summary.complete;
    if (summary.complete) updateChart(document, root, summary);
    root.querySelector('#eco-ai-gate-message').hidden = summary.complete;
    root.querySelector('#eco-ai-task-gate').hidden = !summary.complete;
    const download = root.querySelector('#eco-attempt-download');
    download.disabled = !summary.complete;
    const explanation = root.querySelector('#eco-explanation');
    explanation.closest('.eco-explanation').hidden = !summary.complete;
    if (document.activeElement !== explanation) explanation.value = state.explanation;
    root.querySelector('#eco-explanation-status').textContent = summary.complete
      ? 'El intento y tus correcciones se guardan en este navegador. El primer puntaje permanece disponible.'
      : '';
  }

  function init(options = {}) {
    const document = options.document || (typeof window === 'undefined' ? null : window.document);
    if (!document) return false;
    const root = document.querySelector('#ecobogota');
    if (!root || !root.querySelector('[data-eco-lot]')) return false;
    if (root.dataset.ready === 'true') return true;
    let storage = options.storage || null;
    if (!options.storage) {
      try {
        storage = document.defaultView.localStorage;
      } catch (error) {
        storage = null;
      }
    }
    let state = loadState(storage);
    const list = root.querySelector('[data-eco-lot]');
    const status = root.querySelector('#eco-simulator-status');

    const publish = (message = '') => {
      render(document, root, state);
      const saved = saveState(storage, state);
      if (!saved) root.querySelector('#eco-storage-status').textContent = 'El navegador bloqueó el guardado; descarga una copia del intento.';
      else root.querySelector('#eco-storage-status').textContent = 'Guardado en este navegador.';
      if (message) status.textContent = message;
      document.defaultView.dispatchEvent(new document.defaultView.CustomEvent('ecobogota:updated', { detail: { state } }));
    };

    renderWasteItems(document, list, state, itemId => {
      const selection = chooseWaste(state, itemId);
      if (selection.ok) {
        state = selection.state;
        publish(selection.message);
      } else status.textContent = selection.message;
    });
    root.querySelectorAll('[data-diagnosis-answer]').forEach(button => {
      button.addEventListener('click', () => {
        state = setDiagnosis(state, button.dataset.diagnosisAnswer);
        publish(state.diagnostic?.feedback || 'Elige una de las canecas disponibles.');
      });
    });
    root.querySelector('#eco-prediction-form').addEventListener('submit', event => {
      event.preventDefault();
      const started = startSimulation(state, root.querySelector('#eco-prediction').value);
      root.querySelector('#eco-prediction-feedback').textContent = started.message;
      if (!started.ok) return;
      state = started.state;
      publish(started.message);
    });
    root.querySelectorAll('[data-bin]').forEach(button => {
      button.addEventListener('click', () => {
        const classified = classifyWaste(state, button.dataset.bin);
        if (!classified.ok) {
          status.textContent = classified.message;
          return;
        }
        state = classified.state;
        publish(classified.message);
      });
    });
    root.querySelector('#eco-correct-errors').addEventListener('click', () => {
      const corrections = beginCorrections(state);
      if (!corrections.ok) {
        root.querySelector('#eco-correction-status').textContent = corrections.message;
        return;
      }
      state = corrections.state;
      publish(corrections.message);
    });
    root.querySelector('#eco-attempt-download').addEventListener('click', event => {
      event.preventDefault();
      if (!summarize(state).complete) return;
      const attempt = JSON.stringify(createSimulatorAttempt(state), null, 2);
      try {
        const window = document.defaultView;
        const url = window.URL.createObjectURL(new window.Blob([attempt], { type: 'application/json;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'intento-simulador.json';
        link.hidden = true;
        root.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        root.querySelector('#eco-storage-status').textContent = 'Descargaste intento-simulador.json, sin datos personales.';
      } catch (error) {
        root.querySelector('#eco-storage-status').textContent = 'No fue posible iniciar la descarga. Vuelve a intentarlo en este navegador.';
      }
    });
    root.querySelector('#eco-explanation').addEventListener('input', event => {
      state = updateExplanation(state, event.currentTarget.value);
      const saved = saveState(storage, state);
      root.querySelector('#eco-storage-status').textContent = saved
        ? 'Guardado en este navegador.'
        : 'El navegador bloqueó el guardado; descarga una copia del intento.';
      document.defaultView.dispatchEvent(new document.defaultView.CustomEvent('ecobogota:updated', { detail: { state } }));
    });
    root.querySelector('#eco-simulator-reset').addEventListener('click', () => {
      let persistedCleared = true;
      try {
        if (storage) storage.removeItem(STORAGE_KEY);
      } catch (error) {
        persistedCleared = false;
      }
      state = createInitialState();
      root.querySelector('#eco-prediction-feedback').textContent = '';
      render(document, root, state);
      root.querySelector('#eco-storage-status').textContent = persistedCleared
        ? 'El lote se reinició y se borró de este navegador.'
        : 'El lote se reinició en esta sesión, pero el navegador no permitió borrar el guardado anterior.';
      status.textContent = 'El lote se reinició. Puedes responder de nuevo.';
      document.defaultView.dispatchEvent(new document.defaultView.CustomEvent('ecobogota:updated', { detail: { state } }));
    });
    root.dataset.ready = 'true';
    render(document, root, state);
    return true;
  }

  return {
    STORAGE_KEY,
    BINS,
    ITEMS,
    createInitialState,
    validatePrediction,
    setDiagnosis,
    startSimulation,
    chooseWaste,
    classifyWaste,
    summarize,
    beginCorrections,
    createSimulatorAttempt,
    updateExplanation,
    normalizeState,
    saveState,
    loadState,
    resetState,
    evidenceValues,
    init
  };
});
