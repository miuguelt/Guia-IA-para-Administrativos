const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const aids = require('../js/interactive-aids.js');

test('el semáforo de seguridad evalúa escenarios en las distintas dimensiones humanas', () => {
  let state = aids.createSafetyState();
  assert.equal(state.currentIndex, 0);
  assert.equal(state.score, 0);

  // Escenario fuera de rango
  const invalid = aids.classifyScenario(state, 99, 'green');
  assert.equal(invalid.ok, false);

  // Escenario 0: triaje de correspondencia -> green
  const r0 = aids.classifyScenario(state, 0, 'green');
  assert.equal(r0.ok, true);
  assert.equal(r0.isCorrect, true);
  assert.match(r0.explanation, /Recomendable/iu);
  state = r0.state;
  assert.equal(state.score, 1);

  // Escenario 1: diagnóstico médico -> elección incorrecta 'green' vs expected 'red'
  const r1 = aids.classifyScenario(state, 1, 'green');
  assert.equal(r1.ok, true);
  assert.equal(r1.isCorrect, false);
  assert.equal(r1.expected, 'red');
  assert.match(r1.explanation, /No recomendable/iu);
  state = r1.state;
  assert.equal(state.score, 1);
});

test('el simulador de auditoría detecta alucinaciones y valida cifras fidedignas', () => {
  let state = aids.createAuditState();
  assert.equal(state.completed, false);

  // Fuera de rango
  assert.equal(aids.auditStatement(state, -1, 'verified').ok, false);

  // Afirmación 1: 42 sobre 840 (5%) -> verified
  const a0 = aids.auditStatement(state, 0, 'verified');
  assert.equal(a0.ok, true);
  assert.equal(a0.isCorrect, true);
  assert.equal(a0.expected, 'verified');
  state = a0.state;

  // Afirmación 2: periodo inventado -> hallucination
  const a1 = aids.auditStatement(state, 1, 'hallucination');
  assert.equal(a1.isCorrect, true);
  state = a1.state;

  // Afirmación 3: causa inventada -> hallucination
  const a2 = aids.auditStatement(state, 2, 'hallucination');
  assert.equal(a2.isCorrect, true);
  state = a2.state;

  // Afirmación 4: mención prudente sin respaldo en Bienestar.
  const a3 = aids.auditStatement(state, 3, 'hallucination');
  assert.equal(a3.isCorrect, true);
  assert.equal(a3.allDone, true);
  state = a3.state;
  assert.equal(state.completed, true);
});

test('el comparador de prompts gestiona estados predeterminados', () => {
  const state = aids.createPromptCompareState();
  assert.equal(state.selectedPreset, 'pqrs');
  assert.equal(state.mode, 'crtt');
});

test('el simulador de anonimización (Ley 1581) clasifica fragmentos y genera síntesis', () => {
  let state = aids.createAnonymizationState();
  assert.equal(state.currentIndex, 0);
  assert.equal(state.score, 0);

  // Fuera de rango
  const invalid = aids.classifyAnonymizationItem(state, -1, 'usar');
  assert.equal(invalid.ok, false);

  // Caso 0: datos de la actividad -> usar
  const c0 = aids.classifyAnonymizationItem(state, 0, 'usar');
  assert.equal(c0.ok, true);
  assert.equal(c0.isCorrect, true);
  assert.equal(c0.expected, 'usar');
  state = c0.state;
  assert.equal(state.score, 1);

  // Caso 1: identificación de la persona solicitante -> reducir (no cargar es un error)
  const c1 = aids.classifyAnonymizationItem(state, 1, 'no-cargar');
  assert.equal(c1.isCorrect, false);
  assert.equal(c1.expected, 'reducir');
  state = c1.state;

  // Resumen con las etiquetas del semáforo, no con claves técnicas
  const summary = aids.getAnonymizationSummaryText(state);
  assert.match(summary, /Ley 1581 de 2012/iu);
  assert.match(summary, /Clasificación: Usar/u);
  assert.match(summary, /Clasificación: No cargar/u);
  assert.match(summary, /Clasificación: pendiente/u);
  assert.doesNotMatch(summary, /no-cargar|NO-CARGAR/u);
});

test('el anonimizador usa la misma taxonomía y el mismo caso que el semáforo de Aprende', () => {
  const keys = Object.keys(aids.ANONYMIZATION_LABELS);
  assert.deepEqual(keys, ['usar', 'reducir', 'no-cargar']);
  assert.deepEqual(Object.values(aids.ANONYMIZATION_LABELS), ['Usar', 'Reducir', 'No cargar']);
  const expected = aids.ANONYMIZATION_CASES.map(item => item.expected);
  for (const value of expected) assert.ok(keys.includes(value), `clave desconocida: ${value}`);
  for (const key of keys) assert.ok(expected.includes(key), `ningún caso ejercita «${key}»`);
  const identification = aids.ANONYMIZATION_CASES.find(item => /C\.C\./u.test(item.fragment));
  assert.equal(identification.expected, 'reducir', 'la identificación se reduce, como en la tarjeta amarilla');
  for (const item of aids.ANONYMIZATION_CASES) {
    assert.doesNotMatch(`${item.fragment} ${item.reason} ${item.sanitized}`, /SOFIA|semiprivad/iu);
    assert.match(`${item.fragment} ${item.reason}`, /sala|reserva|taller|solicit/iu, `${item.id} debe pertenecer a la solicitud de sala`);
  }
});

test('el evaluador de respuestas PQRS valida criterios institucionales y genera texto', () => {
  let state = aids.createPqrsEvaluatorState();
  assert.deepEqual(state.checkedCriteria, {});

  // Toggle primer criterio
  const res1 = aids.togglePqrsCriterion(state, 'cortesia', true);
  state = res1.state;
  assert.equal(res1.checkedCount, 1);
  assert.equal(res1.allPassed, false);

  // Marcar todos los criterios oficiales
  aids.PQRS_CRITERIA.forEach(crit => {
    state = aids.togglePqrsCriterion(state, crit.id, true).state;
  });
  const resAll = aids.togglePqrsCriterion(state, 'cortesia', true);
  assert.equal(resAll.allPassed, true);

  const summary = aids.getPqrsSummaryText(state);
  assert.match(summary, /Caso PC-01/iu);
  assert.match(summary, /\[CUMPLE\]/iu);
});

test('el saneador de planillas aplica reglas reproducibles y produce reporte', () => {
  let state = aids.createDataCleanerState();
  assert.equal(state.activeRules.trim_spaces, false);

  // Activar regla de espacios
  const r1 = aids.applyCleaningRules(state, 'trim_spaces', true);
  state = r1.state;
  assert.equal(state.activeRules.trim_spaces, true);
  assert.ok(r1.transformedCount > 0);

  // Activar mayúsculas
  const r2 = aids.applyCleaningRules(state, 'uppercase_states', true);
  state = r2.state;
  assert.equal(state.activeRules.uppercase_states, true);

  // Activar REVISAR en vacíos
  const r3 = aids.applyCleaningRules(state, 'flag_empty_review', true);
  state = r3.state;
  assert.equal(state.activeRules.flag_empty_review, true);

  // Texto consolidado
  const summary = aids.getDataCleanerSummaryText(state);
  assert.match(summary, /Reporte de normalización/iu);
  assert.match(summary, /REVISAR/iu);
});

test('la calculadora de ROI evalúa tiempos y retorna ahorros o errores', () => {
  // Parámetros inválidos
  const err1 = aids.calculateProductivityRoi(null);
  assert.equal(err1.valid, false);
  const err2 = aids.calculateProductivityRoi({ weeklyVolume: 0, manualMinutes: 10, aiMinutes: 5 });
  assert.equal(err2.valid, false);

  // Parámetros válidos con ahorro
  const validRes = aids.calculateProductivityRoi({
    taskName: 'Respuestas a solicitudes',
    weeklyVolume: 20,
    manualMinutes: 30,
    aiMinutes: 10
  });
  assert.equal(validRes.valid, true);
  assert.equal(validRes.manualWeeklyHours, 10.0);
  assert.equal(validRes.aiWeeklyHours, 3.3);
  assert.ok(validRes.savedHours > 6);
  assert.ok(validRes.savedMinutes > 300);
  assert.equal(validRes.efficiencyPercent, 67);
  assert.match(validRes.summaryText, /Retorno de tiempo/iu);
});

test('las funciones auxiliares transfieren textos al DOM y copian al portapapeles con seguridad', () => {
  assert.equal(aids.transferTextToField(null, 'id', 'texto'), false);
  assert.equal(aids.transferTextToField({}, '', 'texto'), false);

  const dom = new JSDOM(`
    <div>
      <textarea id="target-field"></textarea>
    </div>
  `);
  const doc = dom.window.document;
  const target = doc.getElementById('target-field');

  let inputFired = false;
  target.addEventListener('input', () => { inputFired = true; });

  let evidenceSavedFired = false;
  dom.window.addEventListener('evidence:saved', () => { evidenceSavedFired = true; });

  assert.equal(aids.transferTextToField(doc, 'inexistente', 'texto'), false);
  assert.equal(aids.transferTextToField(doc, 'target-field', 'Contenido transferido'), true);
  assert.equal(target.value, 'Contenido transferido');
  assert.equal(inputFired, true);
  assert.equal(evidenceSavedFired, true);

  // copyTextToClipboard
  assert.equal(aids.copyTextToClipboard('texto', null), false);

  const mockWinWithClipboard = {
    navigator: {
      clipboard: {
        writeText: (t) => Promise.resolve(t)
      }
    }
  };
  assert.equal(aids.copyTextToClipboard('texto', mockWinWithClipboard), true);

  const mockWinThrowing = {
    navigator: {
      clipboard: {
        writeText: () => { throw new Error('Permission denied'); }
      }
    }
  };
  assert.equal(aids.copyTextToClipboard('texto', mockWinThrowing), false);

  dom.window.close();
});

test('widgets de seguridad, auditoría y comparador se inicializan y toleran interacciones', () => {
  assert.equal(aids.init(null), false);

  const html = `
    <div id="safety-scope-simulator">
      <h4 id="safety-scenario-title"></h4>
      <span id="safety-scenario-dim"></span>
      <p id="safety-scenario-desc"></p>
      <div id="safety-feedback" hidden></div>
      <div id="safety-score"></div>
      <button id="safety-prev" type="button">Anterior</button>
      <button id="safety-next" type="button">Siguiente</button>
      <button id="safety-reset" type="button">Reiniciar</button>
      <button data-safety-choice="green" type="button">Recomendable</button>
      <button data-safety-choice="amber" type="button">Precaución</button>
      <button data-safety-choice="red" type="button">Prohibido</button>
    </div>
    <div id="audit-statement-simulator">
      <div data-audit-row>
        <button data-audit-action="verified" type="button">Respaldado</button>
        <button data-audit-action="hallucination" type="button">Alucinación</button>
        <button data-audit-action="contradicted" type="button">Contradicha</button><button data-audit-action="not-stated" type="button">No consta</button><p data-audit-feedback hidden></p>
      </div>
      <div data-audit-row>
        <button data-audit-action="verified" type="button">Respaldado</button>
        <button data-audit-action="hallucination" type="button">Alucinación</button>
        <button data-audit-action="contradicted" type="button">Contradicha</button><button data-audit-action="not-stated" type="button">No consta</button><p data-audit-feedback hidden></p>
      </div>
      <div data-audit-row>
        <button data-audit-action="verified" type="button">Respaldado</button>
        <button data-audit-action="hallucination" type="button">Alucinación</button>
        <button data-audit-action="contradicted" type="button">Contradicha</button><button data-audit-action="not-stated" type="button">No consta</button><p data-audit-feedback hidden></p>
      </div>
      <div data-audit-row>
        <button data-audit-action="verified" type="button">Respaldado</button>
        <button data-audit-action="hallucination" type="button">Alucinación</button>
        <button data-audit-action="contradicted" type="button">Contradicha</button><button data-audit-action="not-stated" type="button">No consta</button><p data-audit-feedback hidden></p>
      </div>
      <div id="audit-summary" hidden></div>
      <button id="audit-reset" type="button">Reiniciar</button>
    </div>
    <div id="prompt-compare-simulator">
      <button id="prompt-mode-vague" type="button">Sin límites</button>
      <button id="prompt-mode-crtt" type="button">Con CRTT</button>
      <p id="prompt-display-text"></p>
      <p id="prompt-display-output"></p>
      <p id="prompt-display-analysis"></p>
    </div>
  `;

  const dom = new JSDOM(html);
  const doc = dom.window.document;

  assert.equal(aids.init(doc), true);
  assert.equal(aids.init(doc), true);

  // Semáforo
  doc.querySelector('[data-safety-choice="green"]').click();
  doc.querySelector('#safety-next').click();
  doc.querySelector('#safety-prev').click();
  doc.querySelector('#safety-reset').click();

  // Auditoría
  const rows = doc.querySelectorAll('[data-audit-row]');
  rows[0].querySelector('[data-audit-action="verified"]').click();
  rows[1].querySelector('[data-audit-action="not-stated"]').click();
  assert.equal(rows[1].dataset.auditedState, 'review');
  rows[1].querySelector('[data-audit-action="contradicted"]').click();
  assert.equal(rows[1].dataset.auditedState, 'correct');
  rows[2].querySelector('[data-audit-action="hallucination"]').click();
  rows[3].querySelector('[data-audit-action="hallucination"]').click();
  doc.querySelector('#audit-reset').click();

  // Comparador
  doc.querySelector('#prompt-mode-vague').click();
  doc.querySelector('#prompt-mode-crtt').click();

  dom.window.close();
});

test('widgets de anonimizador, PQRS, limpiador y calculadora de ROI interactúan y transfieren al DOM', () => {
  const html = `
    <div id="anonymization-simulator">
      <p id="anon-case-text"></p>
      <button data-anon-choice="reducir" type="button">Reducir</button>
      <button data-anon-choice="usar" type="button">Usar</button>
      <div id="anon-feedback" hidden></div>
      <div id="anon-score"></div>
      <button id="anon-prev" type="button">Anterior</button>
      <button id="anon-next" type="button">Siguiente</button>
      <button data-anon-transfer type="button">Transferir</button>
      <button data-anon-copy type="button">Copiar</button>
    </div>
    <div id="pqrs-evaluator-simulator">
      <div data-pqrs-criterion="cortesia">
        <input type="checkbox">
      </div>
      <div data-pqrs-criterion="sin_invenciones">
        <input type="checkbox">
      </div>
      <div data-pqrs-criterion="trazabilidad">
        <input type="checkbox">
      </div>
      <div data-pqrs-criterion="decision_humana">
        <input type="checkbox">
      </div>
      <div id="pqrs-eval-status"></div>
      <button data-pqrs-transfer type="button">Transferir</button>
      <button data-pqrs-copy type="button">Copiar</button>
    </div>
    <div id="data-cleaner-simulator">
      <div data-clean-rule="trim_spaces">
        <input type="checkbox">
      </div>
      <div data-clean-rule="uppercase_states">
        <input type="checkbox">
      </div>
      <div data-clean-rule="flag_empty_review">
        <input type="checkbox">
      </div>
      <div id="data-cleaner-count"></div>
      <table>
        <tbody id="data-cleaner-tbody"></tbody>
      </table>
      <button data-cleaner-transfer type="button">Transferir</button>
      <button data-cleaner-copy type="button">Copiar</button>
    </div>
    <div id="productivity-roi-calculator">
      <input id="roi-task-name" value="Elaboración de actas">
      <input id="roi-volume" value="10">
      <input id="roi-manual-time" value="30">
      <input id="roi-ai-time" value="10">
      <button id="roi-calc-btn" type="button">Calcular</button>
      <div id="roi-result-box" hidden></div>
      <button data-roi-transfer type="button">Transferir</button>
      <button data-roi-copy type="button">Copiar</button>
    </div>
    <!-- Campos de evidencia destino -->
    <textarea id="dbe-MG-A01-reto00_semaforo_datos"></textarea>
    <textarea id="dbe-MG-A02-reto02_borradores"></textarea>
    <textarea id="dbe-MG-A03-reto06_regla_tabla"></textarea>
    <textarea id="dbe-MG-A05-cuantificacion_ahorro_horas"></textarea>
  `;

  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const win = dom.window;

  win.navigator.clipboard = {
    writeText: () => Promise.resolve()
  };

  assert.equal(aids.init(doc), true);

  // 1. Anonimizador
  const sensibleBtn = doc.querySelector('[data-anon-choice="reducir"]');
  sensibleBtn.click();
  const anonNext = doc.getElementById('anon-next');
  anonNext.click();
  // Responder segundo caso para disparar el evento simulator:completed
  sensibleBtn.click();
  const anonPrev = doc.getElementById('anon-prev');
  anonPrev.click();
  const anonTransfer = doc.querySelector('[data-anon-transfer]');
  anonTransfer.click();
  assert.ok(doc.getElementById('dbe-MG-A01-reto00_semaforo_datos').value.length > 10);
  const anonCopy = doc.querySelector('[data-anon-copy]');
  anonCopy.click();

  // 2. Evaluador PQRS
  const pqrsBoxes = doc.querySelectorAll('[data-pqrs-criterion] input[type="checkbox"]');
  pqrsBoxes.forEach(box => {
    box.checked = true;
    box.dispatchEvent(new win.Event('change'));
  });
  const pqrsTransfer = doc.querySelector('[data-pqrs-transfer]');
  pqrsTransfer.click();
  assert.ok(doc.getElementById('dbe-MG-A02-reto02_borradores').value.length > 10);
  const pqrsCopy = doc.querySelector('[data-pqrs-copy]');
  pqrsCopy.click();

  // 3. Saneador de planillas
  const cleanBoxes = doc.querySelectorAll('[data-clean-rule] input[type="checkbox"]');
  cleanBoxes.forEach(box => {
    box.checked = true;
    box.dispatchEvent(new win.Event('change'));
  });
  const cleanTransfer = doc.querySelector('[data-cleaner-transfer]');
  cleanTransfer.click();
  assert.ok(doc.getElementById('dbe-MG-A03-reto06_regla_tabla').value.length > 10);
  const cleanCopy = doc.querySelector('[data-cleaner-copy]');
  cleanCopy.click();

  // 4. Calculadora de ROI
  const calcBtn = doc.getElementById('roi-calc-btn');
  calcBtn.click();
  const roiBox = doc.getElementById('roi-result-box');
  assert.equal(roiBox.hidden, false);
  assert.match(roiBox.textContent, /Ahorro/iu);

  const roiTransfer = doc.querySelector('[data-roi-transfer]');
  roiTransfer.click();
  assert.ok(doc.getElementById('dbe-MG-A05-cuantificacion_ahorro_horas').value.length > 10);
  const roiCopy = doc.querySelector('[data-roi-copy]');
  roiCopy.click();

  // Caso de error en ROI
  doc.getElementById('roi-volume').value = '-5';
  calcBtn.click();
  assert.match(roiBox.textContent, /mayores a cero/iu);

  dom.window.close();
});
