(function (root, factory) {
  'use strict';
  const dependency = typeof module === 'object' && module.exports
    ? require('./interactive-aids-model.js') : root.CourseInteractiveAidsModel;
  const api = factory(dependency);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CourseInteractiveAidsWorkflow = api;
})(typeof window === 'undefined' ? globalThis : window, function (dependency) {
  'use strict';

  const { ANONYMIZATION_CASES, PQRS_CRITERIA, DATA_CLEANING_RECORDS, createAnonymizationState, createPqrsEvaluatorState, createDataCleanerState, classifyAnonymizationItem, getAnonymizationSummaryText, togglePqrsCriterion, getPqrsSummaryText, applyCleaningRules, getDataCleanerSummaryText, calculateProductivityRoi, transferTextToField, copyTextToClipboard } = dependency;

  function initAnonymizationWidget(doc) {
    const root = doc.getElementById('anonymization-simulator');
    if (!root || root.dataset.ready === 'true') return;

    let state = createAnonymizationState();
    const caseText = root.querySelector('#anon-case-text');
    const feedbackBox = root.querySelector('#anon-feedback');
    const scoreBox = root.querySelector('#anon-score');
    const prevBtn = root.querySelector('#anon-prev');
    const nextBtn = root.querySelector('#anon-next');
    const transferBtn = root.querySelector('[data-anon-transfer]');
    const copyBtn = root.querySelector('[data-anon-copy]');
    const choiceBtns = root.querySelectorAll('[data-anon-choice]');

    function render() {
      const item = ANONYMIZATION_CASES[state.currentIndex];
      if (caseText) caseText.textContent = item.fragment;
      if (prevBtn) prevBtn.disabled = state.currentIndex === 0;
      if (nextBtn) nextBtn.disabled = state.currentIndex === ANONYMIZATION_CASES.length - 1;

      const previousChoice = state.answers[item.id];
      if (previousChoice && feedbackBox) {
        const isCorrect = previousChoice === item.expected;
        feedbackBox.hidden = false;
        feedbackBox.className = `safety-feedback-box is-${isCorrect ? 'correct' : 'incorrect'}`;
        feedbackBox.textContent = `${isCorrect ? 'Clasificación correcta.' : 'Revisa este dato.'} ${item.reason} Ejemplo protegido: ${item.sanitized}`;
      } else if (feedbackBox) {
        feedbackBox.hidden = true;
        feedbackBox.textContent = '';
      }

      if (scoreBox) {
        scoreBox.textContent = `Casos clasificados: ${Object.keys(state.answers).length} de ${ANONYMIZATION_CASES.length}`;
      }
    }

    choiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.anonChoice;
        const result = classifyAnonymizationItem(state, state.currentIndex, choice);
        if (result.ok) {
          state = result.state;
          render();
          const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
          if (win && Object.keys(state.answers).length >= 2) {
            win.dispatchEvent(new win.CustomEvent('simulator:completed', { detail: { simulatorId: 'anonymization' } }));
          }
        }
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.currentIndex > 0) {
          state.currentIndex -= 1;
          render();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (state.currentIndex < ANONYMIZATION_CASES.length - 1) {
          state.currentIndex += 1;
          render();
        }
      });
    }

    if (transferBtn) {
      transferBtn.addEventListener('click', () => {
        const text = getAnonymizationSummaryText(state);
        transferTextToField(doc, 'dbe-MG-A01-reto00_semaforo_datos', text);
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = getAnonymizationSummaryText(state);
        copyTextToClipboard(text, doc.defaultView);
      });
    }

    root.dataset.ready = 'true';
    render();
  }

  function initPqrsEvaluatorWidget(doc) {
    const root = doc.getElementById('pqrs-evaluator-simulator');
    if (!root || root.dataset.ready === 'true') return;

    let state = createPqrsEvaluatorState();
    const criteriaBoxes = root.querySelectorAll('[data-pqrs-criterion]');
    const statusBox = root.querySelector('#pqrs-eval-status');
    const transferBtn = root.querySelector('[data-pqrs-transfer]');
    const copyBtn = root.querySelector('[data-pqrs-copy]');

    function update() {
      const summary = Object.values(state.checkedCriteria).filter(Boolean).length;
      if (statusBox) {
        statusBox.textContent = `Criterios cumplidos: ${summary} de ${PQRS_CRITERIA.length}`;
        statusBox.className = summary === PQRS_CRITERIA.length ? 'eval-status is-complete' : 'eval-status is-progress';
      }
      const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
      if (win && summary === PQRS_CRITERIA.length) {
        win.dispatchEvent(new win.CustomEvent('simulator:completed', { detail: { simulatorId: 'pqrs' } }));
      }
    }

    criteriaBoxes.forEach(box => {
      const key = box.dataset.pqrsCriterion;
      const checkbox = box.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          const res = togglePqrsCriterion(state, key, checkbox.checked);
          state = res.state;
          update();
        });
      }
    });

    if (transferBtn) {
      transferBtn.addEventListener('click', () => {
        const text = getPqrsSummaryText(state);
        transferTextToField(doc, 'dbe-MG-A02-pqrs_borrador', text) ||
          transferTextToField(doc, 'dbe-MG-A02-reto02_borradores', text);
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = getPqrsSummaryText(state);
        copyTextToClipboard(text, doc.defaultView);
      });
    }

    root.dataset.ready = 'true';
    update();
  }

  function initDataCleanerWidget(doc) {
    const root = doc.getElementById('data-cleaner-simulator');
    if (!root || root.dataset.ready === 'true') return;

    let state = createDataCleanerState();
    const ruleBoxes = root.querySelectorAll('[data-clean-rule]');
    const tbody = root.querySelector('#data-cleaner-tbody');
    const countEl = root.querySelector('#data-cleaner-count');
    const transferBtn = root.querySelector('[data-cleaner-transfer]');
    const copyBtn = root.querySelector('[data-cleaner-copy]');

    function renderTable() {
      const res = applyCleaningRules(state, 'dummy', false);
      if (tbody) {
        tbody.replaceChildren();
        res.cleaned.forEach(rec => {
          const tr = doc.createElement('tr');
          const original = DATA_CLEANING_RECORDS.find(item => item.fila === rec.fila);
          tr.innerHTML = `<td>${rec.fila}</td><td><code>${rec.codigo}</code></td><td>${rec.aprendiz}</td><td>${rec.sede}</td><td><code>${original.estado.replaceAll(' ', '·') || 'VACÍO'}</code></td><td><span class="badge-${rec.estado === 'REVISAR' ? 'warning' : 'info'}">${rec.estado || 'VACÍO'}</span></td><td>${rec.fecha || '—'}</td>`;
          tbody.appendChild(tr);
        });
      }
      if (countEl) {
        countEl.textContent = `Estados transformados en la muestra: ${res.transformedCount} de ${DATA_CLEANING_RECORDS.length}`;
      }
      const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
      if (win && res.transformedCount > 0) {
        win.dispatchEvent(new win.CustomEvent('simulator:completed', { detail: { simulatorId: 'data-cleaner' } }));
      }
    }

    ruleBoxes.forEach(box => {
      const ruleKey = box.dataset.cleanRule;
      const checkbox = box.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          const res = applyCleaningRules(state, ruleKey, checkbox.checked);
          state = res.state;
          renderTable();
        });
      }
    });

    if (transferBtn) {
      transferBtn.addEventListener('click', () => {
        const text = getDataCleanerSummaryText(state);
        transferTextToField(doc, 'dbe-MG-A03-reto06_regla', text) ||
          transferTextToField(doc, 'dbe-MG-A03-reto06_regla_tabla', text);
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = getDataCleanerSummaryText(state);
        copyTextToClipboard(text, doc.defaultView);
      });
    }

    root.dataset.ready = 'true';
    renderTable();
  }

  function initProductivityRoiWidget(doc) {
    const root = doc.getElementById('productivity-roi-calculator');
    if (!root || root.dataset.ready === 'true') return;

    const taskInput = root.querySelector('#roi-task-name');
    const volInput = root.querySelector('#roi-volume');
    const manualInput = root.querySelector('#roi-manual-time');
    const aiInput = root.querySelector('#roi-ai-time');
    const measurementInput = root.querySelector('#roi-measurement-status');
    const calcBtn = root.querySelector('#roi-calc-btn');
    const resultBox = root.querySelector('#roi-result-box');
    const transferBtn = root.querySelector('[data-roi-transfer]');
    const copyBtn = root.querySelector('[data-roi-copy]');

    let lastSummary = '';

    function calculate() {
      const params = {
        taskName: taskInput ? taskInput.value : '',
        weeklyVolume: volInput ? volInput.value : '',
        manualMinutes: manualInput ? manualInput.value : '',
        aiMinutes: aiInput ? aiInput.value : '',
        measurementStatus: measurementInput ? measurementInput.value : 'supuesto'
      };
      const res = calculateProductivityRoi(params);
      if (resultBox) {
        resultBox.hidden = false;
        if (res.valid) {
          lastSummary = res.summaryText;
          resultBox.className = 'prompt-output is-calculated';
          resultBox.textContent = res.summaryText;
          const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
          if (win) {
            win.dispatchEvent(new win.CustomEvent('simulator:completed', { detail: { simulatorId: 'roi' } }));
          }
        } else {
          lastSummary = '';
          resultBox.className = 'prompt-output is-error';
          resultBox.textContent = res.error;
        }
      }
    }

    if (calcBtn) calcBtn.addEventListener('click', calculate);

    if (transferBtn) {
      transferBtn.addEventListener('click', () => {
        calculate();
        if (lastSummary) {
          const transferred = transferTextToField(doc, 'dbe-MG-A05-compromiso_transferencia', lastSummary) ||
            transferTextToField(doc, 'dbe-MG-A05-cuantificacion_ahorro_horas', lastSummary) ||
            transferTextToField(doc, 'dbe-MG-A05-piloto_30_dias', lastSummary);
          if (!transferred) {
            const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
            if (win && win.dispatchEvent) {
              win.dispatchEvent(new win.CustomEvent('evidence:saved', { detail: { fieldId: 'dbe-MG-A05-compromiso_transferencia', text: lastSummary } }));
            }
          }
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        calculate();
        if (lastSummary) {
          copyTextToClipboard(lastSummary, doc.defaultView);
        }
      });
    }

    root.dataset.ready = 'true';
  }

  return { initAnonymizationWidget, initPqrsEvaluatorWidget, initDataCleanerWidget, initProductivityRoiWidget };
});
