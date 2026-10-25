(function (root, factory) {
  'use strict';
  const common = typeof module === 'object' && module.exports;
  const api = factory(common ? require('./case-practices-model.js') : root.CasePracticesModel,
    common ? require('./case-practices-view.js') : root.CasePracticesView,
    common ? require('./case-practices-store.js') : root.CasePracticesStore);
  if (common) module.exports = api;
  if (root) root.CasePractices = api;
})(typeof window === 'undefined' ? globalThis : window, function (model, view, store) {
  'use strict';
  class Simulator {
    static type = 'case-practice';
    constructor({ container, storage }) {
      this.container = container;
      this.storage = storage || container.ownerDocument.defaultView.guiaDevBrainApp?.storage;
      this.listeners = [];
      const decisionId = container.dataset.challengeDecisions;
      this.key = decisionId ? 'challenge_decisions_' + decisionId : 'case_practice_' + container.dataset.caseId;
    }
    listen(node, type, callback) {
      node.addEventListener(type, callback);
      this.listeners.push([node, type, callback]);
    }
    render() {
      if (this.listeners.length) return;
      try {
        this.spec = JSON.parse(this.container.querySelector('[data-case-spec]').textContent);
        if (!model || !view || !store || !Array.isArray(this.spec.questions) || !this.spec.questions.length) throw new Error('Definición incompleta.');
      }
      catch {
        this.container.querySelector('[data-case-save-status]').textContent = 'No se pudo iniciar la práctica. Puedes consultar las fuentes y la solución; recarga para volver a intentarlo.';
        return;
      }
      this.state = model.restore(this.spec, store.read(this.storage, this.key));
      this.toolControls = [...this.container.querySelectorAll('.case-tools input')];
      this.restoreTools();
      this.toolControls.forEach((input, index) => {
        this.listen(input, 'change', () => {
          this.state = { ...this.state, tools: { ...this.state.tools, [index]: input.type === 'checkbox' ? input.checked : input.value } };
          this.refresh();
        });
        this.listen(input, 'input', () => {
          this.state = { ...this.state, tools: { ...this.state.tools, [index]: input.type === 'checkbox' ? input.checked : input.value } };
          this.refresh();
        });
      });
      this.container.querySelectorAll('[data-case-go]').forEach(button => {
        this.listen(button, 'click', () => {
          this.state = { ...this.state, step: Number(button.dataset.caseGo) };
          this.refresh();
          this.container.querySelector(`[data-case-stage="${this.state.step}"] h4`).focus({ preventScroll: true });
        });
      });
      for (const question of this.spec.questions) {
        const form = this.container.querySelector(`[data-case-question="${question.id}"]`);
        this.listen(form, 'input', () => this.change(question, form));
        this.listen(form, 'change', () => this.change(question, form));
        this.listen(form.querySelector('[data-case-submit]'), 'click', () => this.submit(question, form));
        this.listen(form, 'submit', event => { event.preventDefault(); this.submit(question, form); });
        this.listen(form, 'reset', event => {
          event.preventDefault();
          this.state = model.answer(this.spec, this.state, question.id, '', false);
          this.refresh();
        });
        const hint = form.querySelector('[data-case-hint]');
        if (hint) this.listen(hint, 'click', () => this.help(question.id));
        const explanation = form.querySelector('[data-case-help]');
        if (explanation) this.listen(explanation, 'toggle', () => { if (explanation.open && !this.state.hints.includes(question.id)) this.help(question.id); });
      }
      const solution = this.container.querySelector('[data-case-solution]');
      if (solution) this.listen(solution, 'toggle', () => {
        if (solution.open && !this.state.solutionViewed) {
          this.state = { ...this.state, solutionViewed: true };
          this.refresh();
        }
      });
      const printBtn = this.container.querySelector('[data-case-print]');
      if (printBtn) this.listen(printBtn, 'click', () => this.print());
      const resetBtn = this.container.querySelector('[data-case-reset]');
      if (resetBtn) this.listen(resetBtn, 'click', () => {
        this.state = model.initial(this.spec);
        this.restoreTools();
        this.container.querySelectorAll('[data-case-help]').forEach(details => { details.open = false; });
        this.refresh();
      });
      this.refresh();
    }
    restoreTools() {
      const win = this.container.ownerDocument.defaultView;
      this.toolControls.forEach((input, index) => {
        if (input.type === 'checkbox') input.checked = this.state.tools[index] === true;
        else input.value = typeof this.state.tools[index] === 'string' ? this.state.tools[index] : input.defaultValue;
        input.dispatchEvent(new win.Event('input', { bubbles: false }));
        input.dispatchEvent(new win.Event('change', { bubbles: false }));
      });
    }
    change(question, form) {
      const val = view.value(form);
      const autoCheck = this.container.hasAttribute('data-challenge-decisions') && Boolean(val);
      if (autoCheck && this.state.answers[question.id]?.value === val && this.state.answers[question.id]?.checked) return;
      this.state = model.answer(this.spec, this.state, question.id, val, autoCheck);
      this.refresh();
    }
    submit(question, form) {
      const value = view.value(form);
      if (!value || (['rate', 'instruction'].includes(question.type) && value.split('|').some(item => !item.trim()))) {
        form.querySelector('[data-case-feedback]').textContent = 'Elige una opción o completa todos los valores antes de comprobar.';
        form.querySelector('input,select').focus();
        return;
      }
      this.state = model.answer(this.spec, this.state, question.id, value, true);
      this.refresh();
    }
    help(id) {
      const q = this.spec.questions.find(item => item.id === id);
      const max = Array.isArray(q?.hints) && q.hints.length ? q.hints.length : 1;
      const current = this.state.hints.filter(item => item === id).length;
      if (current < max) {
        this.state = { ...this.state, hints: [...this.state.hints, id] };
        this.refresh();
      }
    }
    refresh() {
      const saved = store.write(this.storage, this.key, this.state);
      view.render(this.container, this.spec, this.state, saved);
    }
    print() {
      const doc = this.container.ownerDocument;
      const page = this.container.closest('.module-page');
      const previous = doc.body.getAttribute('data-print-case');
      const details = [...this.container.querySelectorAll('details')].map(node => [node, node.open]);
      doc.body.dataset.printCase = this.container.dataset.caseId;
      page.classList.add('case-print-page');
      this.container.classList.add('case-print-target');
      details.forEach(([node]) => { node.open = true; });
      try { doc.defaultView.print(); }
      catch { this.container.querySelector('[data-case-save-status]').textContent = 'No se pudo imprimir. Inténtalo de nuevo desde el menú de tu navegador.'; }
      finally {
        if (previous === null) doc.body.removeAttribute('data-print-case');
        else doc.body.setAttribute('data-print-case', previous);
        page.classList.remove('case-print-page');
        this.container.classList.remove('case-print-target');
        details.forEach(([node, open]) => { node.open = open; });
      }
    }
    destroy() {
      for (const [node, type, callback] of this.listeners) node.removeEventListener(type, callback);
      this.listeners = [];
    }
  }
  return { Simulator };
});
