const test = require('node:test');
const assert = require('node:assert/strict');
const simulator = require('../js/simulators.js');
const portfolio = require('../js/portafolio.js');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

async function setupFileOrigin() {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  console.on('error', (...args) => errors.push(args.join(' ')));
  const dom = new JSDOM(read('index.html'), {
    url: 'file:///C:/Guia/index.html#ecobogota',
    runScripts: 'outside-only',
    virtualConsole: console
  });
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear()
  };
  dom.window.scrollTo = () => {};
  dom.window.HTMLMediaElement.prototype.pause = () => {};
  Object.defineProperty(dom.window, 'localStorage', { configurable: true, value: storage });
  dom.window.fetch = () => { throw new Error('La guía intentó usar la red.'); };
  for (const script of ['js/vendor/devbrain-learner-sdk.js', 'js/registro-entregables.js', 'js/course-tabs.js', 'js/course-dialog.js', 'js/course-tools.js', 'js/simulators.js', 'js/portafolio.js', 'js/evidence-accessibility.js', 'js/calendar-print.js', 'js/vendor/fflate.js','js/result-archive.js','js/ai-result-model.js','js/result-import.js', 'js/ai-result-store.js', 'js/ai-delivery-view.js', 'js/ai-delivery.js', 'js/course-app.js']) {
    dom.window.eval(read(script));
  }
  await new Promise(resolve => dom.window.setTimeout(resolve, 30));
  return { dom, window: dom.window, document: dom.window.document, errors };
}

test('el inventario define diez residuos y la clave local usa el prefijo solicitado', () => {
  assert.equal(simulator.STORAGE_KEY, 'guia_refactor_sena_ecobogota_v1');
  assert.equal(simulator.ITEMS.length, 10);
  assert.deepEqual(simulator.ITEMS.reduce((counts, item) => {
    counts[item.color] = (counts[item.color] || 0) + 1;
    return counts;
  }, {}), { white: 5, green: 2, black: 3 });
});

test('la predicción admite enteros entre cero y diez y rechaza otros valores', () => {
  assert.equal(simulator.validatePrediction('0'), true);
  assert.equal(simulator.validatePrediction('10'), true);
  assert.equal(simulator.validatePrediction('2.5'), false);
  assert.equal(simulator.validatePrediction('-1'), false);
  assert.equal(simulator.validatePrediction('11'), false);
  assert.equal(simulator.validatePrediction(''), false);
});

test('el diagnóstico conserva la respuesta y distingue acierto de error', () => {
  const initial = simulator.createInitialState();
  const right = simulator.setDiagnosis(initial, 'white');
  const wrong = simulator.setDiagnosis(initial, 'black');
  const invalid = simulator.setDiagnosis(initial, 'blue');
  assert.equal(right.diagnostic.correct, true);
  assert.equal(wrong.diagnostic.correct, false);
  assert.equal(invalid, initial);
});

test('la clasificación requiere iniciar, seleccionar un residuo y usar un color válido', () => {
  const initial = simulator.createInitialState();
  assert.equal(simulator.startSimulation(initial, '2').ok, true);
  assert.equal(simulator.chooseWaste(initial, 'cascara-banano').ok, false);
  const started = simulator.startSimulation(initial, '2').state;
  assert.equal(simulator.chooseWaste(started, 'no-existe').ok, false);
  const selected = simulator.chooseWaste(started, 'botella-plastica').state;
  assert.equal(simulator.classifyWaste(selected, 'blue').ok, false);
  assert.equal(simulator.classifyWaste(selected, 'white').correct, true);
});

test('el primer intento informa el color correcto y no permite cambiar una respuesta inicial', () => {
  const started = simulator.startSimulation(simulator.createInitialState(), '4').state;
  const selected = simulator.chooseWaste(started, 'cascara-banano').state;
  const wrong = simulator.classifyWaste(selected, 'black');
  const repeated = simulator.classifyWaste(wrong.state, 'green');
  assert.equal(wrong.correct, false);
  assert.match(wrong.message, /cáscara de banano.*verde.*negra/i);
  assert.equal(repeated.ok, false);
  assert.equal(Object.keys(repeated.state.answers).length, 1);
});

test('el resultado compara la predicción con el lote y detalla errores después de diez respuestas', () => {
  let state = simulator.startSimulation(simulator.createInitialState(), '4').state;
  for (const item of simulator.ITEMS) {
    state = simulator.chooseWaste(state, item.id).state;
    state = simulator.classifyWaste(state, item.id === 'botella-plastica' ? 'black' : item.color).state;
  }
  const result = simulator.summarize(state);
  assert.equal(result.complete, true);
  assert.equal(result.correct, 9);
  assert.equal(result.total, 10);
  assert.equal(result.organicCount, 2);
  assert.equal(result.prediction, 4);
  assert.equal(result.predictionDifference, 2);
  assert.deepEqual(result.errors.map(error => error.itemId), ['botella-plastica']);
  assert.equal(simulator.updateExplanation(state, 'Separé la botella por material.').explanation, 'Separé la botella por material.');
});

test('el estado local se guarda, se restaura y se recupera ante datos dañados o almacenamiento bloqueado', () => {
  const state = simulator.createInitialState();
  const memory = new Map();
  const storage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key)
  };
  assert.equal(simulator.saveState(storage, state), true);
  assert.deepEqual(simulator.loadState(storage), state);
  memory.set(simulator.STORAGE_KEY, '{');
  assert.deepEqual(simulator.loadState(storage), simulator.createInitialState());
  assert.equal(simulator.saveState({ setItem() { throw new Error('bloqueado'); } }, state), false);
  assert.equal(simulator.resetState(storage).version, 1);
  assert.equal(memory.has(simulator.STORAGE_KEY), false);
});

test('compatibilidad de la versión anterior: el simulador bloquea la IA hasta clasificar diez residuos y conserva puntaje, correcciones y descarga', async () => {
  const dom = new JSDOM(read('tests/fixtures/ecobogota-v1.html'), { url: 'http://curso.test/#ecobogota' });
  const { document, localStorage } = dom.window;
  const downloads = [];
  const blobs = [];
  dom.window.URL.createObjectURL = blob => { blobs.push(blob); return 'blob:eco-attempt'; };
  dom.window.URL.revokeObjectURL = () => {};
  dom.window.setTimeout = callback => { callback(); return 1; };
  dom.window.HTMLAnchorElement.prototype.click = function () { downloads.push({ href: this.href, name: this.download }); };
  assert.equal(simulator.init({ document, storage: localStorage }), true);
  assert.equal(simulator.init({ document, storage: localStorage }), true);
  assert.equal(document.querySelectorAll('#ecobogota [data-waste-id]').length, 10);
  for (const item of simulator.ITEMS) {
    const button = document.querySelector(`[data-waste-id="${item.id}"]`);
    assert.ok(button.textContent.includes(item.name), `El nombre de ${item.id} debe seguir visible`);
    const image = button.querySelector('img');
    assert.equal(image.getAttribute('src'), item.illustration);
    assert.equal(image.getAttribute('alt'), '', 'La imagen del botón es decorativa porque el nombre queda como texto');
    assert.equal(image.getAttribute('aria-hidden'), 'true');
  }
  assert.equal(document.getElementById('eco-ai-task-gate').hidden, true);
  assert.equal(document.getElementById('eco-attempt-download').disabled, true);
  assert.equal(document.querySelector('#eco-fase-4 [data-ai-task="eco"]').closest('[hidden]'), document.getElementById('eco-ai-task-gate'));

  document.querySelector('[data-diagnosis-answer="black"]').click();
  assert.match(document.getElementById('eco-diagnosis-feedback').textContent, /caneca blanca, no en la negra/i);
  document.querySelector('[data-diagnosis-answer="white"]').click();
  assert.match(document.getElementById('eco-diagnosis-feedback').textContent, /Correcto/);

  const prediction = document.getElementById('eco-prediction');
  const form = document.getElementById('eco-prediction-form');
  prediction.value = '11';
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.match(document.getElementById('eco-prediction-feedback').textContent, /entre 0 y 10/);
  assert.equal(document.getElementById('eco-simulator').hidden, false);
  prediction.value = '4';
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(document.getElementById('eco-simulator').hidden, false);

  document.querySelector('[data-waste-id="botella-plastica"]').click();
  document.querySelector('[data-bin="black"]').click();
  for (const item of simulator.ITEMS) {
    if (item.id === 'botella-plastica') continue;
    document.querySelector(`[data-waste-id="${item.id}"]`).click();
    document.querySelector(`[data-bin="${item.color}"]`).click();
  }
  assert.equal(document.getElementById('eco-simulator-results').hidden, false);
  assert.equal(document.getElementById('eco-ai-task-gate').hidden, false);
  assert.equal(document.querySelector('#eco-fase-4 [data-ai-task="eco"]').closest('[hidden]'), null);
  assert.equal(document.getElementById('eco-attempt-download').disabled, false);
  assert.equal(document.getElementById('eco-score').textContent, '9 de 10');
  assert.equal(document.getElementById('eco-initial-score').textContent, '9 de 10');
  assert.match(document.getElementById('eco-error-list').textContent, /botella plástica.*blanca/i);
  assert.match(document.getElementById('eco-prediction-result').textContent, /Predijiste 4.*tiene 2.*\+2/);
  const chart = document.getElementById('eco-comparison-chart');
  assert.equal(chart.hidden, false);
  assert.match(chart.textContent, /Tu primer intento[\s\S]*Lote de referencia/);
  assert.match(document.getElementById('eco-chart-text').textContent, /Tu primer intento: blanca 4, negra 4, verde 2\. Lote de referencia: blanca 5, negra 3, verde 2\./);

  document.getElementById('eco-correct-errors').click();
  assert.equal(document.querySelector('[data-waste-id="botella-plastica"]').disabled, false);
  document.querySelector('[data-waste-id="botella-plastica"]').click();
  document.querySelector('[data-bin="white"]').click();
  assert.equal(document.getElementById('eco-score').textContent, '9 de 10');
  assert.equal(document.getElementById('eco-final-score').textContent, '10 de 10');
  assert.equal(JSON.parse(localStorage.getItem(simulator.STORAGE_KEY)).answers['botella-plastica'], 'black');
  assert.deepEqual(JSON.parse(localStorage.getItem(simulator.STORAGE_KEY)).corrections.map(entry => entry.color), ['white']);

  const explanation = document.getElementById('eco-explanation');
  explanation.value = 'La botella limpia es aprovechable y va en la caneca blanca.';
  explanation.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(JSON.parse(localStorage.getItem(simulator.STORAGE_KEY)).explanation, explanation.value);
  assert.equal(document.getElementById('eco-storage-status').textContent, 'Guardado en este navegador.');
  document.getElementById('eco-attempt-download').click();
  assert.equal(downloads[0].name, 'intento-simulador.json');
  const downloaded = JSON.parse(await blobs[0].text());
  assert.equal(downloaded.clasificacionInicial.puntaje.aciertos, 9);
  assert.equal(downloaded.correcciones[0].canecaElegida, 'white');
  assert.equal(Object.hasOwn(downloaded, 'explicacion'), false, 'El archivo estructurado no exporta texto libre que pueda incluir datos personales');
  assert.equal(document.querySelector('[data-waste-id="frasco-vidrio"]').disabled, true);
  document.getElementById('eco-simulator-reset').click();
  assert.equal(localStorage.getItem(simulator.STORAGE_KEY), null);
  assert.equal(document.getElementById('eco-simulator-results').hidden, true);
  dom.window.close();
});

test('el simulador presenta un aviso cuando el navegador impide guardar', () => {
  const dom = new JSDOM(read('tests/fixtures/ecobogota-v1.html'), { url: 'http://curso.test/#ecobogota' });
  const blockedStorage = {
    getItem() { throw new Error('bloqueado'); },
    setItem() { throw new Error('bloqueado'); },
    removeItem() { throw new Error('bloqueado'); }
  };
  assert.equal(simulator.init({ document: dom.window.document, storage: blockedStorage }), true);
  dom.window.document.querySelector('[data-diagnosis-answer="white"]').click();
  assert.match(dom.window.document.getElementById('eco-storage-status').textContent, /bloqueó el guardado/);
  const prediction = dom.window.document.getElementById('eco-prediction');
  prediction.value = '2';
  dom.window.document.getElementById('eco-prediction-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  for (const item of simulator.ITEMS) {
    dom.window.document.querySelector(`[data-waste-id="${item.id}"]`).click();
    dom.window.document.querySelector(`[data-bin="${item.color}"]`).click();
  }
  assert.equal(dom.window.document.getElementById('eco-ai-task-gate').hidden, false);
  assert.equal(dom.window.document.getElementById('eco-attempt-download').disabled, false);
  assert.match(dom.window.document.getElementById('eco-storage-status').textContent, /bloqueó el guardado/);
  dom.window.document.getElementById('eco-simulator-reset').click();
  assert.match(dom.window.document.getElementById('eco-storage-status').textContent, /no permitió borrar el guardado anterior/);
  dom.window.close();
});

test('el modelo separa puntaje inicial de correcciones y exporta un registro sin datos personales', () => {
  let state = simulator.startSimulation(simulator.createInitialState(), '2').state;
  for (const item of simulator.ITEMS) {
    state = simulator.chooseWaste(state, item.id).state;
    state = simulator.classifyWaste(state, item.id === 'frasco-vidrio' ? 'black' : item.color).state;
  }
  const initial = simulator.summarize(state);
  assert.equal(initial.correct, 9);
  assert.equal(initial.complete, true);
  assert.equal(simulator.beginCorrections(state).ok, true);
  state = simulator.beginCorrections(state).state;
  assert.equal(state.activeWasteId, 'frasco-vidrio');
  assert.equal(simulator.chooseWaste(state, 'caja-carton').ok, false);
  state = simulator.chooseWaste(state, 'frasco-vidrio').state;
  state = simulator.classifyWaste(state, 'green').state;
  assert.equal(simulator.summarize(state).correct, 9);
  assert.equal(simulator.summarize(state).finalCorrect, 9);
  state = simulator.chooseWaste(state, 'frasco-vidrio').state;
  state = simulator.classifyWaste(state, 'white').state;
  const result = simulator.summarize(state);
  assert.equal(result.correct, 9);
  assert.equal(result.finalCorrect, 10);
  assert.equal(result.corrections.length, 2);
  assert.equal(result.corrections[0].correct, false);
  assert.equal(result.corrections[1].correct, true);
  assert.equal(result.correctionComplete, true);
  const attempt = simulator.createSimulatorAttempt(state);
  assert.equal(attempt.artifactId, 'ECO-A01');
  assert.equal(attempt.recordType, 'intento-simulador');
  assert.deepEqual(Object.keys(attempt), ['schemaVersion', 'artifactId', 'recordType', 'diagnostico', 'prediccion', 'clasificacionInicial', 'correcciones']);
  assert.equal(attempt.clasificacionInicial.puntaje.aciertos, 9);
  assert.equal(attempt.clasificacionInicial.respuestas.length, 10);
  assert.equal(attempt.correcciones.length, 2);
  assert.doesNotMatch(JSON.stringify(attempt), /nombre|correo|documento|identidad|tel[eé]fono/i);
  const legacyArtifact = JSON.parse(read('deliverables.registry.json')).artifacts.find(item => item.id === 'ECO-A01');
  assert.deepEqual(legacyArtifact.fields.map(field => field.key), ['diagnostico', 'prediccion', 'resultado', 'explicacion']);
  assert.deepEqual(Object.keys(simulator.evidenceValues(state)), ['diagnostico', 'prediccion', 'resultado', 'explicacion']);
  assert.match(simulator.evidenceValues(state).resultado, /9 de 10.*10 de 10/);
  const memory = new Map();
  assert.equal(simulator.saveState({ setItem: (key, value) => memory.set(key, value) }, state), true);
  assert.deepEqual(simulator.loadState({ getItem: key => memory.get(key) }), state);
});

test('el intento completo desbloquea la tarea aunque incluya respuestas equivocadas', () => {
  let state = simulator.startSimulation(simulator.createInitialState(), '0').state;
  for (const item of simulator.ITEMS) {
    state = simulator.chooseWaste(state, item.id).state;
    state = simulator.classifyWaste(state, 'black').state;
  }
  assert.equal(simulator.summarize(state).complete, true);
  assert.equal(simulator.summarize(state).correct, 3);
  assert.equal(simulator.summarize(state).correctionComplete, false);
  assert.equal(simulator.beginCorrections(state).ok, true);
});

test('la normalización preserva un intento anterior y limpia correcciones inválidas', () => {
  const legacy = { ...simulator.createInitialState(), version: 1, started: true, prediction: 3, answers: { 'botella-plastica': 'white' } };
  assert.equal(simulator.normalizeState(legacy).answers['botella-plastica'], 'white');
  const invalid = simulator.normalizeState({ ...legacy, corrections: [{ itemId: 'no-existe', color: 'blue' }], correctionMode: true });
  assert.deepEqual(invalid.corrections, []);
  assert.equal(invalid.correctionMode, false);
  const cleared = simulator.normalizeState({ ...legacy, correctionMode: true, activeWasteId: 'botella-plastica' });
  assert.equal(cleared.activeWasteId, null);
});

test('el módulo no falla cuando falta documento, simulador o espacio de portafolio', () => {
  assert.equal(simulator.init({ document: null }), false);
  assert.equal(portfolio.init({ document: null }), false);
  const dom = new JSDOM('<main></main>');
  assert.equal(portfolio.init({ document: dom.window.document, simulator }), false);
  const page = new JSDOM(read('index.html'));
  assert.equal(portfolio.init({ document: page.window.document, simulator: null }), false);
  dom.window.close();
  page.window.close();
});

test('el portafolio consulta el registro anterior sin escribir en las evidencias', () => {
  const dom = new JSDOM(read('index.html'), { url: 'http://curso.test/#portafolio' });
  const { document, localStorage } = dom.window;
  let state = simulator.startSimulation(simulator.createInitialState(), '3').state;
  for (const item of simulator.ITEMS) {
    state = simulator.chooseWaste(state, item.id).state;
    state = simulator.classifyWaste(state, item.id === 'botella-plastica' ? 'black' : item.color).state;
  }
  state = simulator.updateExplanation(state, 'Separé los residuos por material y aprovechamiento.');
  simulator.saveState(localStorage, state);
  const report = portfolio.init({ document, storage: localStorage, simulator });
  assert.ok(report);
  assert.match(document.getElementById('eco-portfolio-status').textContent, /Lote completo: 9 de 10/);
  assert.match(document.getElementById('eco-portfolio-score').textContent, /9 de 10/);
  assert.match(document.getElementById('eco-portfolio-errors').textContent, /botella plástica.*blanca/i);

  state = simulator.updateExplanation(state, 'En otro lote verificaría el estado del material.');
  simulator.saveState(localStorage, state);
  dom.window.dispatchEvent(new dom.window.CustomEvent('ecobogota:updated', { detail: { state } }));
  report.refresh();
  assert.match(document.getElementById('eco-portfolio-explanation').textContent, /En otro lote/);
  dom.window.close();
});

test('la página publicada carga activos locales y funciona en el origen file sin usar la red', async () => {
  const documentDom = new JSDOM(read('index.html'));
  for (const element of documentDom.window.document.querySelectorAll('script[src], link[rel="stylesheet"][href]')) {
    const attribute = element.hasAttribute('src') ? 'src' : 'href';
    const asset = element.getAttribute(attribute);
    assert.doesNotMatch(asset, /^(?:https?:)?\/\//i);
    assert.equal(fs.existsSync(path.join(root, asset.split(/[?#]/u, 1)[0])), true, `No existe el recurso local ${asset}`);
  }
  documentDom.window.close();

  const { dom, window, document, errors } = await setupFileOrigin();
  assert.deepEqual(errors, []);
  assert.equal(window.location.protocol, 'file:');
  assert.equal(window.location.hash, '#ecobogota');
  assert.equal(document.querySelectorAll('[data-db-evidence-mounted="true"]').length, 8);
  assert.equal(typeof window.EcoBogotaSimulator.init, 'function');
  assert.equal(typeof window.AIDelivery.init, 'function');
  assert.equal(document.querySelectorAll('[data-ai-delivery][data-delivery-ready="true"]').length, 7);
  for (const mount of document.querySelectorAll('[data-db-evidence-mounted="true"]')) {
    assert.equal(mount.closest('[data-ai-storage]').hidden, true, 'La interfaz del SDK no debe pedir digitación');
  }
  assert.equal(document.querySelectorAll('[data-ai-delivery] textarea:not([data-result-text]), [data-ai-delivery] [contenteditable="true"]').length, 0);
  dom.window.close();
});


test('exporta el Portafolio de Evidencias Consolidado en HTML/PDF y respaldo JSON con un clic', () => {
  const portfolio = require('../js/portafolio.js');
  const simulator = require('../js/simulators.js');
  const registry = JSON.parse(read('deliverables.registry.json'));
  const dom = new JSDOM(read('content/portfolio.html'), { url: 'http://curso.test/#portafolio' });
  const win = dom.window;
  const doc = win.document;

  assert.equal(portfolio.escapeHtml('<script>"\'&</script>'), '&lt;script&gt;&quot;&#39;&amp;&lt;/script&gt;');

  const prefix = 'sena_bogota_ia_administrativos_21720210';
  win.localStorage.setItem(`${prefix}_perfil_aprendiz`, JSON.stringify({
    name: 'Aprendiz Vélez',
    docNumber: '1098765432',
    ficha: '21720210',
    centro: 'CGAO Vélez',
    regional: 'Regional Santander',
    instructor: 'Instructor SENA'
  }));
  win.localStorage.setItem(`${prefix}_evidencia_MG-A01`, JSON.stringify({
    values: Object.fromEntries(registry.artifacts.find(a => a.id === 'MG-A01').fields.map(f => [f.key, 'Respuesta completa'])),
    checks: Object.fromEntries(registry.artifacts.find(a => a.id === 'MG-A01').checklist.map((_, i) => [`c_${i}`, true])),
    status: 'lista',
    updatedAt: '2026-10-25T00:00:00.000Z',
    elaboratedProduct: { kind: 'canva_link', name: 'Infografía Canva', url: 'https://www.canva.com/design/DAG101/view', format: 'canva' }
  }));
  win.localStorage.setItem(`${prefix}_evidencia_MG-A02`, JSON.stringify({
    values: { pqrs_borrador: 'Borrador parcial' },
    checks: { c_0: false },
    status: 'borrador',
    elaboratedProduct: { kind: 'file', name: 'respuesta-pqrs.pdf', format: 'pdf', size: 4096 }
  }));

  const downloads = [];
  win.URL.createObjectURL = blob => { downloads.push(blob); return 'blob:consolidated'; };
  win.URL.revokeObjectURL = () => {};

  const instance = portfolio.init({ document: doc, simulator, storage: win.localStorage, registry, prefix });
  assert.ok(instance);
  assert.equal(typeof instance.exportHtml, 'function');
  assert.equal(typeof instance.exportJson, 'function');

  const html = instance.exportHtml();
  assert.match(html, /Portafolio de Evidencias Consolidado · Curso 21720210 V1/u);
  assert.match(html, /Aprendiz Vélez/u);
  assert.match(html, /CGAO Vélez/u);
  assert.match(html, /https:\/\/www\.canva\.com\/design\/DAG101\/view/u);
  assert.match(html, /respuesta-pqrs\.pdf/u);
  assert.doesNotMatch(html, /\bdossier\b/iu);

  const jsonBackup = instance.exportJson();
  assert.equal(jsonBackup.summary.curricularTotal, 5);
  assert.equal(jsonBackup.summary.curricularReady, 1);
  assert.equal(jsonBackup.summary.curricularDraft, 1);
  assert.equal(jsonBackup.backup.evidencias['MG-A01'].elaboratedProduct.kind, 'canva_link');

  doc.getElementById('btn-export-consolidated-portfolio').click();
  assert.equal(downloads.length, 1);
  assert.match(doc.getElementById('consolidated-export-status').textContent, /Portafolio de Evidencias Consolidado descargado/u);

  doc.getElementById('btn-download-consolidated-json').click();
  assert.equal(downloads.length, 2);
  assert.match(doc.getElementById('consolidated-export-status').textContent, /Respaldo completo.*descargado/u);

  dom.window.close();
});
