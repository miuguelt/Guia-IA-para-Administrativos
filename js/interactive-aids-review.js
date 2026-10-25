(function (root, factory) {
  'use strict';
  const dependency = typeof module === 'object' && module.exports
    ? require('./interactive-aids-model.js') : root.CourseInteractiveAidsModel;
  const api = factory(dependency);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CourseInteractiveAidsReview = api;
})(typeof window === 'undefined' ? globalThis : window, function (dependency) {
  'use strict';

  const { SAFETY_SCENARIOS, AUDIT_STATEMENTS, PROMPT_COMPARISONS, createSafetyState, createAuditState, createPromptCompareState, classifyScenario, auditStatement } = dependency;

  function initSafetyWidget(doc) {
    const root = doc.getElementById('safety-scope-simulator');
    if (!root || root.dataset.ready === 'true') return;

    let state = createSafetyState();
    const scenarioTitle = root.querySelector('#safety-scenario-title');
    const scenarioDim = root.querySelector('#safety-scenario-dim');
    const scenarioDesc = root.querySelector('#safety-scenario-desc');
    const feedbackBox = root.querySelector('#safety-feedback');
    const scoreBox = root.querySelector('#safety-score');
    const prevBtn = root.querySelector('#safety-prev');
    const nextBtn = root.querySelector('#safety-next');
    const resetBtn = root.querySelector('#safety-reset');
    const choiceBtns = root.querySelectorAll('[data-safety-choice]');

    function renderScenario() {
      const scenario = SAFETY_SCENARIOS[state.currentIndex];
      if (scenarioTitle) scenarioTitle.textContent = scenario.title;
      if (scenarioDim) scenarioDim.textContent = scenario.dimension;
      if (scenarioDesc) scenarioDesc.textContent = scenario.description;
      if (prevBtn) prevBtn.disabled = state.currentIndex === 0;
      if (nextBtn) nextBtn.disabled = state.currentIndex === SAFETY_SCENARIOS.length - 1;

      const previousChoice = state.answers[scenario.id];
      if (previousChoice) {
        const isCorrect = previousChoice === scenario.expected;
        if (feedbackBox) {
          feedbackBox.hidden = false;
          feedbackBox.className = `safety-feedback-box is-${isCorrect ? 'correct' : 'incorrect'}`;
          feedbackBox.textContent = `${isCorrect ? 'Decisión acertada.' : 'Atención con este caso.'} ${scenario.explanation}`;
        }
      } else if (feedbackBox) {
        feedbackBox.hidden = true;
        feedbackBox.textContent = '';
      }

      if (scoreBox) {
        scoreBox.textContent = `Casos evaluados: ${Object.keys(state.answers).length} de ${SAFETY_SCENARIOS.length}`;
      }
    }

    choiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.safetyChoice;
        const result = classifyScenario(state, state.currentIndex, choice);
        if (result.ok) {
          state = result.state;
          renderScenario();
          const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
          if (win && Object.keys(state.answers).length >= 3) {
            win.dispatchEvent(new win.CustomEvent('simulator:completed', { detail: { simulatorId: 'safety' } }));
          }
        }
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.currentIndex > 0) {
          state.currentIndex -= 1;
          renderScenario();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (state.currentIndex < SAFETY_SCENARIOS.length - 1) {
          state.currentIndex += 1;
          renderScenario();
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state = createSafetyState();
        renderScenario();
      });
    }

    root.dataset.ready = 'true';
    renderScenario();
  }

  function initAuditWidget(doc) {
    const root = doc.getElementById('audit-statement-simulator');
    if (!root || root.dataset.ready === 'true') return;

    let state = createAuditState();
    const statementRows = root.querySelectorAll('[data-audit-row]');
    const summaryBox = root.querySelector('#audit-summary');
    const resetBtn = root.querySelector('#audit-reset');

    statementRows.forEach((row, index) => {
      const verifyBtn = row.querySelector('[data-audit-action="verified"]');
      const hallucinateBtn = row.querySelector('[data-audit-action="hallucination"]');
      const feedbackEl = row.querySelector('[data-audit-feedback]');

      const handleChoice = (decision) => {
        const result = auditStatement(state, index, decision);
        if (!result.ok) return;
        state = result.state;
        row.dataset.auditedState = result.isCorrect ? 'correct' : 'review';
        if (feedbackEl) {
          feedbackEl.hidden = false;
          feedbackEl.textContent = `${result.isCorrect ? 'Correcto.' : 'Observa la fuente.'} ${result.reason}`;
        }
        if (verifyBtn) verifyBtn.disabled = result.isCorrect;
        if (hallucinateBtn) hallucinateBtn.disabled = result.isCorrect;
        row.querySelectorAll('[data-audit-action="contradicted"], [data-audit-action="not-stated"]').forEach(button => { button.disabled = result.isCorrect; });

        if (result.allDone && summaryBox) {
          summaryBox.hidden = false;
          summaryBox.textContent = result.allCorrect
            ? 'Revisión correcta: contrastaste las cuatro afirmaciones con la fuente.'
            : `Revisaste las cuatro afirmaciones; ${result.correctCount} coinciden con la fuente. Reintenta las decisiones que requieren ajuste.`;
          const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
          if (win && result.allCorrect) {
            win.dispatchEvent(new win.CustomEvent('simulator:completed', { detail: { simulatorId: 'audit' } }));
          }
        }
      };

      if (verifyBtn) verifyBtn.addEventListener('click', () => handleChoice('verified'));
      if (hallucinateBtn) hallucinateBtn.addEventListener('click', () => handleChoice('hallucination'));
      row.querySelectorAll('[data-audit-action="contradicted"], [data-audit-action="not-stated"]').forEach(button => { button.addEventListener('click', () => handleChoice(button.dataset.auditAction)); });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state = createAuditState();
        statementRows.forEach(row => {
          delete row.dataset.auditedState;
          const fb = row.querySelector('[data-audit-feedback]');
          if (fb) {
            fb.hidden = true;
            fb.textContent = '';
          }
          const vBtn = row.querySelector('[data-audit-action="verified"]');
          const hBtn = row.querySelector('[data-audit-action="hallucination"]');
          if (vBtn) vBtn.disabled = false;
          if (hBtn) hBtn.disabled = false;
          row.querySelectorAll('[data-audit-action="contradicted"], [data-audit-action="not-stated"]').forEach(button => { button.disabled = false; });
        });
        if (summaryBox) {
          summaryBox.hidden = true;
          summaryBox.textContent = '';
        }
      });
    }

    root.dataset.ready = 'true';
  }

  function initPromptCompareWidget(doc) {
    const root = doc.getElementById('prompt-compare-simulator');
    if (!root || root.dataset.ready === 'true') return;

    let state = createPromptCompareState();
    const vagueBtn = root.querySelector('#prompt-mode-vague');
    const crttBtn = root.querySelector('#prompt-mode-crtt');
    const promptTextEl = root.querySelector('#prompt-display-text');
    const outputTextEl = root.querySelector('#prompt-display-output');
    const analysisEl = root.querySelector('#prompt-display-analysis');

    function renderCompare() {
      const preset = PROMPT_COMPARISONS[state.selectedPreset];
      if (!preset) return;
      const data = preset[state.mode];

      if (vagueBtn) {
        vagueBtn.setAttribute('aria-pressed', String(state.mode === 'vague'));
        vagueBtn.classList.toggle('is-active', state.mode === 'vague');
      }
      if (crttBtn) {
        crttBtn.setAttribute('aria-pressed', String(state.mode === 'crtt'));
        crttBtn.classList.toggle('is-active', state.mode === 'crtt');
      }

      if (promptTextEl) promptTextEl.textContent = data.prompt;
      if (outputTextEl) outputTextEl.textContent = data.simulatedOutput;
      if (analysisEl) {
        analysisEl.textContent = data.riskAnalysis;
        analysisEl.className = `prompt-analysis-box ${state.mode === 'crtt' ? 'is-good' : 'is-risky'}`;
      }
    }

    if (vagueBtn) {
      vagueBtn.addEventListener('click', () => {
        state.mode = 'vague';
        renderCompare();
      });
    }

    if (crttBtn) {
      crttBtn.addEventListener('click', () => {
        state.mode = 'crtt';
        renderCompare();
      });
    }

    root.dataset.ready = 'true';
    renderCompare();
  }

  return { initSafetyWidget, initAuditWidget, initPromptCompareWidget };
});
