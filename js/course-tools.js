(function () {
  'use strict';
  const formatted = value => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(value);

  const CourseTools = {
    init() {
      const context = document.getElementById('prompt-context');
      const task = document.getElementById('prompt-task');
      const source = document.getElementById('prompt-source');
      const preview = document.getElementById('prompt-preview');
      const updatePrompt = () => {
        if (!context || !task || !preview) return;
        if (!context.value.trim() || !task.value.trim() || !source?.value.trim()) {
          preview.textContent = 'Completa el contexto, la tarea y el fragmento ficticio para preparar la instrucción.';
          return;
        }
        preview.textContent = `Ayúdame como asistente de organización en este caso: ${context.value.trim()}. Necesito ${task.value.trim()}. Usa únicamente la fuente que incluyo abajo. Devuelve una tabla con afirmación, frase fuente y pendiente, con un tono claro y respetuoso. Marca «no consta» si falta un dato; conserva fechas y decisiones sin añadir información.\n\nFuente:\n${source.value.trim()}`;
      };
      [context, task, source].filter(Boolean).forEach(input => input.addEventListener('input', updatePrompt));

      const numerator = document.getElementById('ratio-numerator');
      const denominator = document.getElementById('ratio-denominator');
      const result = document.getElementById('ratio-result');
      const status = document.getElementById('ratio-status');
      const updateRatio = () => {
        if (!numerator || !denominator || !result || !status) return;
        if (!numerator.value.trim() || !denominator.value.trim()) {
          result.textContent = '—';
          status.textContent = 'Completa el numerador y el denominador para calcular la tasa.';
          return;
        }
        const top = Number(numerator.value);
        const bottom = Number(denominator.value);
        if (!Number.isFinite(top) || top < 0 || !Number.isFinite(bottom) || bottom <= 0 || top > bottom) {
          result.textContent = '—';
          status.textContent = bottom <= 0 ? 'El denominador debe ser mayor que cero.' : 'Revisa los valores: el numerador debe estar entre cero y el denominador.';
          return;
        }
        const rate = top / bottom * 100;
        result.textContent = `${formatted(rate)} %`;
        status.textContent = `${formatted(top)} ÷ ${formatted(bottom)} = ${formatted(top / bottom)}. Confirma la operación en la fuente.`;
      };
      [numerator, denominator].filter(Boolean).forEach(input => input.addEventListener('input', updateRatio));
      updatePrompt();
      updateRatio();

      document.querySelectorAll('[data-knowledge-check]').forEach(form => {
        if (form.closest('[data-simulator="case-practice"]')) return;
        const feedback = form.querySelector('[data-check-feedback]');
        const submit = form.querySelector('[data-check-submit]');
        if (!feedback || !submit || form.dataset.checkReady === 'true') return;
        form.dataset.checkReady = 'true';
        submit.addEventListener('click', () => {
          const selected = form.querySelector('input[type="radio"]:checked');
          if (!selected) {
            form.dataset.state = 'empty';
            feedback.textContent = 'Elige una opción antes de comprobar tu respuesta.';
            form.querySelector('input[type="radio"]')?.focus();
            return;
          }
          const correct = selected.dataset.correct === 'true';
          form.dataset.state = correct ? 'correct' : 'review';
          const explanation = selected.dataset.feedback || 'Consulta la explicación y vuelve a comprobar tu respuesta.';
          feedback.textContent = `${correct ? 'Correcto.' : 'Revisa esta decisión.'} ${explanation}`;
        });
        form.addEventListener('change', () => {
          form.dataset.state = 'pending';
          feedback.textContent = 'Comprueba la opción que acabas de elegir.';
        });
        form.addEventListener('reset', () => {
          form.dataset.state = 'pending';
          feedback.textContent = 'Elige una opción y comprueba tu respuesta.';
        });
      });

      if (typeof document !== 'undefined') {
        initEvidenceBridges(document);
      }
    },
    focusEvidenceField,
    initEvidenceBridges
  };

  function focusEvidenceField(doc, targetFieldId, options = {}) {
    if (!doc || !targetFieldId) return false;
    const requested = doc.getElementById(targetFieldId);
    if (!requested) return false;
    const field = requested.closest?.('[data-ai-storage]')
      ? requested.closest('.module-page')?.querySelector('[data-result-file]')
      : requested;
    if (!field) return false;

    const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
    if (typeof field.scrollIntoView === 'function') {
      field.scrollIntoView({ block: 'center', behavior: options.smooth ? 'smooth' : 'auto' });
    }
    if (typeof field.focus === 'function') {
      field.focus({ preventScroll: true });
    }

    field.classList.remove('dbe-field--highlighted');
    void field.offsetWidth;
    field.classList.add('dbe-field--highlighted');

    const cleanup = () => {
      field.classList.remove('dbe-field--highlighted');
      field.removeEventListener('input', cleanup);
      field.removeEventListener('blur', cleanup);
    };
    field.addEventListener('input', cleanup, { once: true });
    field.addEventListener('blur', cleanup, { once: true });
    if (win && typeof win.setTimeout === 'function') {
      const timeoutMs = typeof options.timeout === 'number' ? options.timeout : 3000;
      win.setTimeout(cleanup, timeoutMs);
    }
    return true;
  }

  function initEvidenceBridges(doc = (typeof window === 'undefined' ? null : window.document)) {
    if (!doc) return false;

    doc.querySelectorAll('[data-open-evidence-field]').forEach(button => {
      if (button.dataset.bridgeReady === 'true') return;
      button.dataset.bridgeReady = 'true';
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-open-evidence-field');
        const pageId = button.getAttribute('data-module-target') || button.closest('.module-page')?.id;
        const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
        const courseTabs = win?.CourseTabs || (typeof CourseTabs !== 'undefined' ? CourseTabs : null);
        if (pageId && courseTabs?.show) {
          courseTabs.show(pageId, 'documenta', false);
        }
        if (!focusEvidenceField(doc, targetId)) {
          if (win && typeof win.setTimeout === 'function') {
            win.setTimeout(() => focusEvidenceField(doc, targetId), 120);
          }
        }
      });
    });

    doc.querySelectorAll('[data-scroll-target]').forEach(button => {
      if (button.dataset.scrollReady === 'true') return;
      button.dataset.scrollReady = 'true';
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-scroll-target');
        focusEvidenceField(doc, targetId);
      });
    });

    return true;
  }

  if (typeof window !== 'undefined') {
    window.CourseTools = CourseTools;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseTools;
  }
})();
