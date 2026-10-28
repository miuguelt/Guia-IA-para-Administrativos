(function (root, factory) {
  'use strict';
  const model = typeof module === 'object' && module.exports ? require('./case-practices-model.js') : root.CasePracticesModel;
  const api = factory(model);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CasePracticesView = api;
})(typeof window === 'undefined' ? globalThis : window, function (model) {
  'use strict';
  function value(form) {
    const fields = [...form.querySelectorAll('[data-case-value]')];
    return fields.length ? fields.map(input => input.value).join('|') : form.querySelector('input[type="radio"]:checked')?.value || '';
  }
  function render(root, spec, state, saved) {
    root.classList.add('case-ready');
    root.querySelectorAll('[data-case-stage]').forEach(stage => { stage.hidden = Number(stage.dataset.caseStage) !== state.step; });
    root.querySelectorAll('[data-case-go]').forEach(button => { button.setAttribute('aria-current', Number(button.dataset.caseGo) === state.step ? 'step' : 'false'); });
    for (const question of spec.questions) {
      const form = root.querySelector(`[data-case-question="${question.id}"]`);
      const item = state.answers[question.id];
      form.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = input.value === item?.value; });
      const fields = [...form.querySelectorAll('[data-case-value]')];
      fields.forEach((input, index) => { input.value = item?.value.split('|')[index] || ''; });
      const preview = form.querySelector('[data-case-instruction-preview]');
      if (preview) preview.textContent = fields.every(input => input.value) ? fields.map(input => input.selectedOptions[0].textContent).join(' ') : 'Selecciona las cuatro partes para leer el encargo completo.';
      const feedback = form.querySelector('[data-case-feedback]');
      const checked = item?.checked;
      const result = checked ? model.evaluate(question, item.value) : null;
      form.dataset.state = checked ? result.correct ? 'correct' : 'review' : 'pending';
      const hintItems = Array.isArray(question.hints) && question.hints.length ? question.hints : (question.hint ? [question.hint] : []);
      const hintCount = state.hints.filter(id => id === question.id).length;
      const help = hintCount > 0;
      feedback.textContent = checked ? `${result.text}${help || state.solutionViewed ? ' Comprobación con ayuda consultada.' : ''} Intentos: ${item.attempts}.`
        : model.pendingPrompt(question);
      const hint = form.querySelector('[data-case-hint-text]');
      if (hint) {
        hint.hidden = !help;
        if (help) {
          hint.textContent = hintItems.length > 1
            ? hintItems.slice(0, hintCount).map((text, idx) => `Pista ${idx + 1} de ${hintItems.length}: ${text}`).join(' · ')
            : hintItems[0] || '';
        }
      }
      const hintBtn = form.querySelector('[data-case-hint]');
      if (hintBtn) {
        hintBtn.disabled = hintCount >= hintItems.length && hintItems.length > 1;
        hintBtn.textContent = hintCount === 0 || hintItems.length <= 1 ? 'Consultar una pista'
          : hintCount < hintItems.length ? `Consultar siguiente pista (${hintCount + 1} de ${hintItems.length})`
          : `Pistas consultadas (${hintItems.length} de ${hintItems.length})`;
      }
      const details = form.querySelector('[data-case-help]');
      if (details && help) details.open = true;
    }
    const solution = root.querySelector('[data-case-solution]');
    if (solution) solution.open = state.solutionViewed;
    const stats = model.summary(spec, state);
    root.dataset.caseState = stats.label;
    root.querySelector('[data-case-summary]').textContent = `${stats.label} · ${stats.correct} de ${stats.total} decisiones comprobadas.${state.solutionViewed || state.hints.length ? ' Has consultado ayudas.' : ''} Esta práctica te ayuda a prepararte; la evaluación de la evidencia corresponde al instructor.`;
    root.querySelector('[data-case-save-status]').textContent = saved ? 'Avance guardado en este navegador. Puedes retomar esta etapa después.' : 'No se pudo guardar el avance. Puedes continuar en esta sesión; evita recargar hasta que el almacenamiento esté disponible.';
    const summary = root.ownerDocument.querySelector('[data-practice-summary]');
    if (summary && root.dataset.simulator === 'case-practice') {
      const roots = [...root.ownerDocument.querySelectorAll('[data-simulator="case-practice"]')];
      summary.textContent = `Prácticas comprobadas: ${roots.filter(node => node.dataset.caseState === 'Comprobada').length} de ${roots.length}. Se muestran por separado de las evidencias.`;
    }
  }
  return { value, render };
});
