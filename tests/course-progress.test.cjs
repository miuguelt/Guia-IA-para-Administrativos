const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const CourseProgress = require('../js/course-progress.js');

test('CourseProgress: estado inicial y constantes fundamentales', () => {
  const state = CourseProgress.createInitialState();
  assert.deepEqual(state.visitedModules, ['inicio']);
  assert.deepEqual(state.completedSimulators, []);
  assert.deepEqual(state.savedEvidences, []);
  assert.ok(CourseProgress.STORAGE_KEY.includes('progress'));
  assert.ok(CourseProgress.MODULE_IDS.includes('preparacion'));
  assert.ok(CourseProgress.MODULE_IDS.includes('m05-cierre'));
  assert.ok(CourseProgress.SIMULATORS['anonymization']);
  assert.ok(CourseProgress.SIMULATORS['roi']);
  assert.ok(CourseProgress.EVIDENCES.includes('MG-A05'));
});

test('CourseProgress: persistencia y tolerancia a fallos en loadProgress y saveProgress', () => {
  // Sin almacenamiento
  assert.deepEqual(CourseProgress.loadProgress(null), CourseProgress.createInitialState());
  assert.equal(CourseProgress.saveProgress(null, {}), false);

  // Almacenamiento simulado en memoria
  const mockStorage = {
    store: {},
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, val) {
      if (key === 'error_key') throw new Error('QuotaExceeded');
      this.store[key] = String(val);
    }
  };

  // Carga con almacenamiento vacío
  assert.deepEqual(CourseProgress.loadProgress(mockStorage), CourseProgress.createInitialState());

  // Guardado exitoso y recarga
  const testState = {
    visitedModules: ['inicio', 'preparacion'],
    completedSimulators: ['anonymization'],
    savedEvidences: ['MG-A01']
  };
  assert.equal(CourseProgress.saveProgress(mockStorage, testState), true);

  const loaded = CourseProgress.loadProgress(mockStorage);
  assert.deepEqual(loaded.visitedModules, ['inicio', 'preparacion']);
  assert.deepEqual(loaded.completedSimulators, ['anonymization']);
  assert.deepEqual(loaded.savedEvidences, ['MG-A01']);

  // Carga con JSON corrupto
  mockStorage.store[CourseProgress.STORAGE_KEY] = '{invalid_json...';
  assert.deepEqual(CourseProgress.loadProgress(mockStorage), CourseProgress.createInitialState());

  // Error al guardar
  const throwingStorage = {
    getItem() { return null; },
    setItem() { throw new Error('Storage write error'); }
  };
  assert.equal(CourseProgress.saveProgress(throwingStorage, testState), false);
  assert.equal(CourseProgress.saveProgress(mockStorage, null), false);
});

test('CourseProgress: mutaciones puras de módulos, simuladores y evidencias', () => {
  let state = CourseProgress.createInitialState();

  // Módulos
  state = CourseProgress.markModuleVisited(state, null);
  assert.deepEqual(state.visitedModules, ['inicio']);
  state = CourseProgress.markModuleVisited(state, 'inicio'); // duplicado
  assert.deepEqual(state.visitedModules, ['inicio']);
  state = CourseProgress.markModuleVisited(state, 'm01-fundamentos');
  assert.deepEqual(state.visitedModules, ['inicio', 'm01-fundamentos']);

  // Simuladores
  state = CourseProgress.markSimulatorCompleted(state, null);
  assert.equal(state.completedSimulators.length, 0);
  state = CourseProgress.markSimulatorCompleted(state, 'inexistente');
  assert.equal(state.completedSimulators.length, 0);
  state = CourseProgress.markSimulatorCompleted(state, 'anonymization');
  assert.deepEqual(state.completedSimulators, ['anonymization']);
  state = CourseProgress.markSimulatorCompleted(state, 'anonymization'); // duplicado
  assert.deepEqual(state.completedSimulators, ['anonymization']);

  // Evidencias
  state = CourseProgress.markEvidenceSaved(state, null);
  assert.equal(state.savedEvidences.length, 0);
  state = CourseProgress.markEvidenceSaved(state, 'MG-A01');
  assert.deepEqual(state.savedEvidences, ['MG-A01']);
  state = CourseProgress.markEvidenceSaved(state, 'MG-A01'); // duplicado
  assert.deepEqual(state.savedEvidences, ['MG-A01']);
});

test('CourseProgress: calcula el recorrido sin presentar un ahorro no medido', () => {
  // Estado base
  const s0 = CourseProgress.computeProgressStats(null);
  assert.equal(s0.percentage, 0);
  assert.equal(Object.hasOwn(s0, 'totalMinutes'), false);
  assert.equal(s0.coreModulesVisited, 0);
  assert.equal(s0.simulatorsDone, 0);
  assert.equal(s0.evidencesDone, 0);

  // Estado con avance
  const state = {
    visitedModules: ['inicio', 'preparacion', 'm01-fundamentos'],
    completedSimulators: ['anonymization', 'safety'], // 15 + 15 = 30 min
    savedEvidences: ['MG-A01'],
    reviewedEvidences: ['MG-A01']
  };
  const stats = CourseProgress.computeProgressStats(state);
  assert.equal(stats.coreModulesVisited, 2);
  assert.equal(stats.simulatorsDone, 2);
  assert.equal(stats.evidencesDone, 1);
  assert.equal(Object.hasOwn(stats, 'totalMinutes'), false);
  assert.ok(stats.percentage > 0 && stats.percentage < 100);

  // Estado 100%
  const fullState = {
    visitedModules: ['preparacion', 'm01-fundamentos', 'm02-diseno', 'm03-implementacion', 'm04-validacion', 'm05-cierre'],
    completedSimulators: Object.keys(CourseProgress.SIMULATORS),
    savedEvidences: [...CourseProgress.EVIDENCES],
    reviewedEvidences: [...CourseProgress.EVIDENCES]
  };
  const fullStats = CourseProgress.computeProgressStats(fullState);
  assert.equal(fullStats.percentage, 100);
  assert.equal(Object.hasOwn(fullStats, 'totalMinutes'), false);
});

test('CourseProgress: actualización de DOM y tolerancia a elementos ausentes', () => {
  // Sin documento
  assert.doesNotThrow(() => CourseProgress.updateDom(null, {}, {}));

  const dom = new JSDOM(`
    <div>
      <progress id="course-progress-bar" value="0" max="100"></progress>
      <span id="course-progress-percent">0%</span>
      <span id="course-progress-saved-time">0 min</span>
      <ul id="progress-checklist-items"></ul>
    </div>
  `);
  const doc = dom.window.document;

  const state = {
    visitedModules: ['inicio', 'm01-fundamentos'],
    completedSimulators: ['anonymization'],
    savedEvidences: ['MG-A01'],
    reviewedEvidences: ['MG-A01']
  };
  const stats = CourseProgress.computeProgressStats(state);

  CourseProgress.updateDom(doc, stats, state);

  const bar = doc.getElementById('course-progress-bar');
  const percent = doc.getElementById('course-progress-percent');
  const time = doc.getElementById('course-progress-saved-time');
  const list = doc.getElementById('progress-checklist-items');

  assert.equal(Number(bar.value), stats.percentage);
  assert.equal(percent.textContent, `${stats.percentage}%`);
  assert.equal(time.textContent, '1 de 5 evidencias revisadas');
  assert.ok(list.children.length > 5);

  dom.window.close();
});

test('CourseProgress: ciclo de vida de init, eventos globales y API de control', () => {
  // Sin documento
  assert.equal(CourseProgress.init({ document: null }), false);

  const dom = new JSDOM(`
    <div>
      <button id="progress-checklist-toggle" aria-expanded="false" type="button">Progreso</button>
      <div id="progress-checklist-dropdown" hidden>
        <ul id="progress-checklist-items"></ul>
      </div>
      <progress id="course-progress-bar" value="0" max="100"></progress>
      <span id="course-progress-percent">0%</span>
      <span id="course-progress-saved-time">0 min</span>
    </div>
  `);
  const doc = dom.window.document;
  const win = dom.window;

  const memoryStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); }
  };

  const api = CourseProgress.init({ document: doc, storage: memoryStorage });
  assert.ok(api);
  assert.equal(typeof api.getState, 'function');
  assert.equal(typeof api.getStats, 'function');
  assert.equal(typeof api.refresh, 'function');
  assert.equal(typeof api.markModule, 'function');
  assert.equal(typeof api.markSimulator, 'function');
  assert.equal(typeof api.markEvidence, 'function');

  // Interacción con botón de lista de chequeo
  const toggleBtn = doc.getElementById('progress-checklist-toggle');
  const dropdown = doc.getElementById('progress-checklist-dropdown');
  assert.equal(dropdown.hidden, true);

  toggleBtn.click();
  assert.equal(dropdown.hidden, false);
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'true');

  toggleBtn.click();
  assert.equal(dropdown.hidden, true);
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'false');

  // Evento course:navigate
  win.dispatchEvent(new win.CustomEvent('course:navigate', { detail: { pageId: 'm02-diseno' } }));
  assert.ok(api.getState().visitedModules.includes('m02-diseno'));

  // Evento simulator:completed
  win.dispatchEvent(new win.CustomEvent('simulator:completed', { detail: { simulatorId: 'pqrs' } }));
  assert.ok(api.getState().completedSimulators.includes('pqrs'));

  // Evento evidence:saved
  win.dispatchEvent(new win.CustomEvent('evidence:saved', { detail: { evidenceId: 'MG-A02' } }));
  assert.ok(api.getState().savedEvidences.includes('MG-A02'));

  // Métodos de control directo
  api.markModule('m03-implementacion');
  assert.ok(api.getState().visitedModules.includes('m03-implementacion'));

  api.markSimulator('data-cleaner');
  assert.ok(api.getState().completedSimulators.includes('data-cleaner'));

  api.markEvidence('MG-A03');
  assert.ok(api.getState().savedEvidences.includes('MG-A03'));

  api.refresh();
  assert.equal(api.getStats().percentage, 0);

  dom.window.close();
});

test('CourseProgress: el complemento opcional y los registros repetidos no alteran el recorrido curricular', () => {
  const state = {
    visitedModules: ['preparacion', 'm01-fundamentos', 'm02-diseno', 'm03-implementacion', 'm04-validacion', 'm05-cierre'],
    completedSimulators: Object.keys(CourseProgress.SIMULATORS).filter(id => id !== 'ecobogota'),
    savedEvidences: ['MG-A01', 'MG-A02', 'MG-A03', 'MG-A04', 'MG-A05'],
    reviewedEvidences: [...CourseProgress.EVIDENCES]
  };
  const core = CourseProgress.computeProgressStats(state);
  assert.equal(core.percentage, 100);
  assert.equal(core.totalEvidencesCount, 5);
  assert.equal(core.totalSimulatorsCount, 7);
  const extra = CourseProgress.computeProgressStats({
    reviewedEvidences: [...state.reviewedEvidences, 'MG-A01', 'ECO-A01'],
    visitedModules: [...state.visitedModules, 'm01-fundamentos', 'ecobogota'],
    completedSimulators: [...state.completedSimulators, 'pqrs', 'ecobogota', 'desconocido'],
    savedEvidences: [...state.savedEvidences, 'MG-A01', 'ECO-A01', 'desconocido']
  });
  assert.deepEqual(extra, core);
});

test('CourseProgress: «Mi avance» y el portafolio muestran nombres legibles y el estado de cada evidencia', () => {
  const dom = new JSDOM(`<ul id="progress-checklist-items"></ul><a><small data-evidence-status="MG-A01"></small></a><a><small data-evidence-status="MG-A02"></small></a><a><small data-evidence-status="MG-A03"></small></a>`);
  const doc = dom.window.document;
  const state = { visitedModules: ['m01-fundamentos'], completedSimulators: [], savedEvidences: ['MG-A01', 'MG-A02'], reviewedEvidences: ['MG-A01'] };
  CourseProgress.updateDom(doc, CourseProgress.computeProgressStats(state), state);
  const items = [...doc.querySelectorAll('#progress-checklist-items li')].map(item => item.textContent);
  assert.match(items[0], /Evidencias.*cuentan para el avance/u);
  assert.match(items[1], /✓ Evidencia 1 · revisada/u);
  assert.match(items[2], /◐ Evidencia 2 · guardada, falta tu revisión/u);
  assert.match(items[3], /○ Evidencia 3 · pendiente/u);
  assert.ok(items.some(text => /✓ Módulo 01/u.test(text)));
  assert.ok(items.some(text => /○ Preparación/u.test(text)));
  assert.ok(!items.some(text => /m0\d-|preparacion/u.test(text)), 'No se muestran identificadores internos');
  assert.deepEqual([...doc.querySelectorAll('[data-evidence-status]')].map(node => node.textContent), ['Revisada', 'Guardada, falta tu revisión', 'Pendiente']);
  dom.window.close();
});

test('CourseProgress: seguimiento de retos y enlace a siguiente reto', () => {
  assert.equal(CourseProgress.CHALLENGES.length, 11);
  assert.ok(CourseProgress.CHALLENGES.includes('reto-0'));
  assert.ok(CourseProgress.CHALLENGES.includes('reto-integrador'));
  assert.equal(typeof CourseProgress.CHALLENGE_NAMES['reto-0'], 'string');

  let state = CourseProgress.createInitialState();
  assert.deepEqual(state.reviewedChallenges, []);

  // markChallengeReviewed
  state = CourseProgress.markChallengeReviewed(state, null);
  assert.deepEqual(state.reviewedChallenges, []);
  state = CourseProgress.markChallengeReviewed(state, 'no-existe');
  assert.deepEqual(state.reviewedChallenges, []);
  state = CourseProgress.markChallengeReviewed(state, 'reto-0');
  assert.deepEqual(state.reviewedChallenges, ['reto-0']);
  state = CourseProgress.markChallengeReviewed(state, 'reto-0'); // duplicado
  assert.deepEqual(state.reviewedChallenges, ['reto-0']);

  // getNextChallenge
  const next1 = CourseProgress.getNextChallenge(state);
  assert.equal(next1.id, 'reto-1');
  assert.equal(next1.moduleId, 'm01-fundamentos');
  assert.ok(next1.name.includes('Reto 1'));

  // Completar todos
  let allDoneState = state;
  for (const ch of CourseProgress.CHALLENGES) {
    allDoneState = CourseProgress.markChallengeReviewed(allDoneState, ch);
  }
  assert.equal(CourseProgress.getNextChallenge(allDoneState), null);

  // DOM con next-challenge-link
  const dom = new JSDOM(`
    <div>
      <a id="next-challenge-link" hidden></a>
      <ul id="progress-checklist-items"></ul>
    </div>
  `);
  const doc = dom.window.document;
  CourseProgress.updateDom(doc, CourseProgress.computeProgressStats(state), state);
  const nextEl = doc.getElementById('next-challenge-link');
  assert.equal(nextEl.hidden, false);
  assert.equal(nextEl.getAttribute('href'), '#reto-1');
  assert.ok(nextEl.textContent.includes('Reto 1'));

  CourseProgress.updateDom(doc, CourseProgress.computeProgressStats(allDoneState), allDoneState);
  assert.equal(nextEl.hidden, true);

  // Init y evento challenge:reviewed
  const memoryStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); }
  };
  const api = CourseProgress.init({ document: doc, storage: memoryStorage });
  api.markChallenge('reto-0');
  assert.deepEqual(api.getState().reviewedChallenges, ['reto-0']);

  dom.window.dispatchEvent(new dom.window.CustomEvent('challenge:reviewed', { detail: { challengeId: 'reto-1' } }));
  assert.ok(api.getState().reviewedChallenges.includes('reto-1'));
  assert.equal(api.getNextChallenge().id, 'reto-2');

  dom.window.close();
});

