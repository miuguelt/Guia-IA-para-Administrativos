(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CasePracticesModel = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  function initial(spec) {
    return { version: 1, revision: spec.revision, step: 0, answers: {}, hints: [], tools: {}, solutionViewed: false };
  }
  function number(value, amount = false) {
    const text = String(value ?? '').trim();
    if (!text || !/^-?\d+(?:[.,]\d+)*$/u.test(text)) return NaN;
    return Number((amount ? text.replaceAll('.', '') : text).replace(',', '.'));
  }
  function evaluate(question, value) {
    let correct, validation = '';
    if (question.type === 'rate') {
      const values = String(value).split('|').map(item => number(item));
      const expected = question.expected.split('|').map(item => number(item));
      correct = values.length === 3 && values.every(Number.isFinite) && values[1] > 0 && values[0] >= 0 && values[0] <= values[1]
        && values.every((item, index) => item === expected[index]) && Math.abs(values[0] / values[1] * 100 - values[2]) < 1e-9;
      if (values.length !== 3 || !values.every(Number.isFinite)) validation = 'Completa los tres campos con números válidos. Usa coma o punto para los decimales.';
      else if (values[1] <= 0) validation = 'El denominador debe ser mayor que cero; la tasa no se puede calcular con un total nulo.';
      else if (values[0] < 0 || values[0] > values[1]) validation = 'El numerador debe estar entre cero y el total de matriculados.';
    } else if (question.type === 'amount') {
      correct = number(value, true) === Number(question.expected);
    } else correct = String(value) === question.expected;
    return { correct, text: `${correct ? 'Correcto.' : 'Revisa esta decisión.'} ${validation || question.feedbacks?.[value] || question.explanation} Fuente: ${question.reference}` };
  }
  function pendingPrompt(question) {
    if (question.type === 'rate' || question.type === 'amount') return 'Completa el cálculo y comprueba tu respuesta.';
    if (question.type === 'instruction') return 'Selecciona las cuatro partes y comprueba tu respuesta.';
    return 'Elige una opción y comprueba tu respuesta.';
  }
  function answer(spec, state, id, value, checked) {
    if (!spec.questions.some(question => question.id === id)) return state;
    const previous = state.answers[id];
    return { ...state, answers: { ...state.answers, [id]: { value: String(value), checked: Boolean(checked), attempts: (previous?.attempts || 0) + (checked ? 1 : 0) } } };
  }
  function restore(spec, raw) {
    const state = initial(spec);
    if (!raw || raw.version !== 1 || raw.revision !== spec.revision) return state;
    state.step = Number.isInteger(raw.step) && raw.step >= 0 && raw.step < 4 ? raw.step : 0;
    state.solutionViewed = raw.solutionViewed === true;
    if (raw.tools && typeof raw.tools === 'object') {
      for (const [key, value] of Object.entries(raw.tools)) {
        if (/^\d{1,3}$/u.test(key) && (typeof value === 'boolean' || typeof value === 'string' && value.length <= 80)) state.tools[key] = value;
      }
    }
    if (Array.isArray(raw.hints)) {
      const counts = {};
      state.hints = raw.hints.filter(id => {
        const q = spec.questions.find(item => item.id === id);
        if (!q) return false;
        const max = Array.isArray(q.hints) && q.hints.length ? q.hints.length : 1;
        counts[id] = (counts[id] || 0) + 1;
        return counts[id] <= max;
      });
    }
    for (const q of spec.questions) {
      const item = raw.answers?.[q.id];
      if (item && typeof item.value === 'string' && item.value.length <= 500 && Number.isSafeInteger(item.attempts) && item.attempts >= 0) {
        state.answers[q.id] = { value: item.value, checked: item.checked === true && item.attempts > 0, attempts: item.attempts };
      }
    }
    return state;
  }
  function summary(spec, state) {
    let correct = 0, wrong = 0;
    for (const q of spec.questions) {
      const item = state.answers[q.id];
      if (item?.checked) {
        if (evaluate(q, item.value).correct) correct += 1;
        else wrong += 1;
      }
    }
    const complete = correct === spec.questions.length;
    const started = state.step > 0 || Object.keys(state.answers).length > 0 || state.hints.length > 0 || state.solutionViewed;
    return { correct, total: spec.questions.length, complete, label: complete ? 'Comprobada' : wrong ? 'Por corregir' : started ? 'En curso' : 'Sin empezar' };
  }
  return { initial, number, evaluate, pendingPrompt, answer, restore, summary };
});
