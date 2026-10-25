const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const model = require('../js/analysis-results-model.js');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const data = {
  exoplanetas: [
    { pl_name: 'A b', hostname: 'A', pl_orbper: '2', pl_rade: '1', st_teff: '5000', st_rad: '1' },
    { pl_name: 'A c', hostname: 'A', pl_orbper: '8', pl_rade: '3', st_teff: '5000', st_rad: '1' },
    { pl_name: 'B b', hostname: 'B', pl_orbper: '10', pl_rade: '2', st_teff: '', st_rad: '1' }
  ],
  poblacion: [
    { pais: 'Colombia', codigo: 'COL', anio: '2000', poblacion: '100' },
    { pais: 'Colombia', codigo: 'COL', anio: '2024', poblacion: '150' },
    { pais: 'Perú', codigo: 'PER', anio: '2000', poblacion: '0' },
    { pais: 'Perú', codigo: 'PER', anio: '2024', poblacion: '30' }
  ],
  clima: [
    { fecha: '2024-01-01', temperatura_c: '0', precipitacion_mm: '2' },
    { fecha: '2024-01-02', temperatura_c: '-999', precipitacion_mm: '0' },
    { fecha: '2024-02-01', temperatura_c: '6', precipitacion_mm: '' },
    { fecha: '2024-02-02', temperatura_c: '12', precipitacion_mm: '3' }
  ],
  sismos: [
    { id: 's1', fecha: '2024-01-01T01:00:00Z', magnitud: '5', profundidad_km: '10', tipo_magnitud: 'mb' },
    { id: 's2', fecha: '2024-01-03T01:00:00Z', magnitud: '7.5', profundidad_km: '30', tipo_magnitud: 'mww' }
  ],
  documentos: [{ id_documento: 'DANE-NOTA-2025', afirmacion: 'Proyección de la edición de 2025.', pagina_pdf: '27', tipo: 'Proyección publicada', limite_interpretacion: 'No es una observación.', url_evidencia: 'https://www.dane.gov.co/nota.pdf#page=27' }]
};

test('NASA calcula medianas y distribuciones sin duplicar estrellas ni convertir faltantes en cero', () => {
  const result = model.simulate(data, 'nasa', { variable: 'radio' });
  assert.equal(result.count, 3);
  assert.equal(result.median, 2);
  assert.equal(result.rows.reduce((n, row) => n + row[2], 0), 3);
  assert.ok(result.chart.points.every(point => !point.label.includes('.')), 'Los intervalos deben usar coma decimal.');
  assert.equal(model.simulate(data, 'nasa', { variable: 'periodo' }).median, 8);
  assert.equal(model.simulate(data, 'nasa', { variable: 'estrellas' }).count, 1);
  const conflict = structuredClone(data);
  conflict.exoplanetas[1].st_rad = '2';
  assert.equal(model.simulate(conflict, 'nasa', { variable: 'estrellas' }).count, 0);
  assert.equal(model.simulate({}, 'nasa', {}).median, null);
});

test('población compara extremos comunes y conserva denominadores nulos como no calculables', () => {
  const result = model.simulate(data, 'poblacion', { start: '2000', end: '2024' });
  assert.deepEqual(result.rows[0], ['Colombia', 100, 150, 50, 50]);
  assert.equal(result.rows[1][4], null);
  assert.equal(result.metrics[1][1], '2000');
  assert.equal(model.simulate(data, 'poblacion', { variable: 'indice' }).chart.points[0].value, 150);
  assert.throws(() => model.simulate(data, 'poblacion', { start: 2024, end: 2000 }), /año inicial/iu);
  assert.throws(() => model.simulate(data, 'poblacion', { start: '', end: 2024 }), /año/iu);
  assert.equal(model.simulate(data, 'poblacion', { start: 2001, end: 2024 }).count, 0);
  const missing = structuredClone(data);
  missing.poblacion[1].poblacion = '';
  assert.equal(model.simulate(missing, 'poblacion', {}).count, 1);
});

test('clima pondera por días válidos, suma lluvia y conserva el cero y los meses vacíos', () => {
  const result = model.simulate(data, 'clima', {});
  assert.equal(result.mean, 6);
  assert.equal(result.rain, 5);
  assert.deepEqual(result.rows[0], ['2024-01', 1, 0, 2, 2]);
  assert.deepEqual(result.rows[1], ['2024-02', 2, 9, 1, 3]);
  const january = model.simulate(data, 'clima', { month: '01', variable: 'lluvia' });
  assert.equal(january.mean, 0);
  assert.equal(january.chart.points[0].value, 2);
  assert.equal(model.simulate(data, 'clima', { month: '12' }).count, 0);
  const invalid = { clima: [{ fecha: 'incorrecta', temperatura_c: '20' }, { fecha: '2024-02-30', temperatura_c: '20' }, { fecha: '2024-03-01', temperatura_c: '-999' }] };
  assert.equal(model.simulate(invalid, 'clima', {}).mean, null);
});

test('sismos filtra magnitud, conserva tipos y muestra los 31 días con sus ceros', () => {
  const result = model.simulate(data, 'sismos', { magnitude: 5, variable: 'dias' });
  assert.equal(result.count, 2);
  assert.equal(result.chart.points.length, 31);
  assert.equal(result.chart.points[1].value, 0);
  assert.equal(result.median, 20);
  assert.deepEqual(result.rows[1], ['2024-01-02', 0]);
  assert.equal(result.rows.reduce((total, row) => total + row[1], 0), 2);
  assert.equal(model.simulate(data, 'sismos').rows[1][4], 'mww');
  assert.equal(model.simulate(data, 'sismos', { magnitude: '6' }).count, 1);
  assert.equal(model.simulate(data, 'sismos', { magnitude: 8 }).count, 0);
  assert.throws(() => model.simulate(data, 'sismos', { magnitude: 'abc' }), /magnitud/iu);
  assert.throws(() => model.simulate(data, 'sismos', { magnitude: 4 }), /magnitud/iu);
  const missing = { sismos: [{ id: 'sin-profundidad', fecha: '2024-01-01', magnitud: '5', profundidad_km: '' }] };
  assert.equal(model.simulate(missing, 'sismos', {}).median, null);
});

test('documentos muestra localizadores y distingue el ejemplo de una revisión hecha por el aprendiz', () => {
  const pending = model.simulate(data, 'documentos', { document: '0', stage: 'referencia' });
  assert.match(pending.rows[0][4], /pendiente/iu);
  const located = model.simulate(data, 'documentos', { stage: 'pagina' });
  assert.match(located.rows[0][4], /contrastar/iu);
  const checked = model.simulate(data, 'documentos', { stage: 'contexto' });
  assert.equal(checked.rows[0][2], '27');
  assert.match(checked.rows[0][4], /ejemplo/iu);
  assert.match(checked.note, /no certifica/iu);
  assert.equal(checked.sourceUrl, data.documentos[0].url_evidencia);
  assert.equal(checked.rows[0].at(-1), data.documentos[0].url_evidencia);
  assert.equal(model.simulate(data, 'documentos', { document: '9' }).count, 0);
  assert.throws(() => model.simulate(data, 'otra', {}), /simulador/iu);
});

test('los resultados vacíos se pueden revisar y el CSV conserva cifras y neutraliza fórmulas', () => {
  for (const name of ['nasa', 'poblacion', 'clima', 'sismos', 'documentos']) assert.equal(model.simulate({}, name, {}).count, 0);
  const csv = model.toCSV({ headers: ['Texto', 'Valor', 'Ausente'], rows: [['=1+1', -2, null], ['A,"B"\nC', 0, '']] });
  assert.match(csv, /'=1\+1/u);
  assert.match(csv, /"-2"/u);
  assert.match(csv, /A,""B""\nC/u);
});

test('cada laboratorio publica un simulador con controles, tabla y alternativa sin JavaScript', () => {
  const dom = new JSDOM(read('index.html'));
  for (const name of ['nasa', 'poblacion', 'clima', 'sismos', 'documentos']) {
    const panel = dom.window.document.querySelector(`#lab-${name} [data-simulator="analysis-result"]`);
    assert.ok(panel, name);
    assert.ok(panel.querySelector('form'));
    assert.ok(panel.querySelector('[data-result-output][aria-live="polite"]'));
    assert.ok(panel.querySelector('noscript'));
  }
  const embedded = (() => { const context = { globalThis: {} }; require('node:vm').runInNewContext(fs.readFileSync(path.join(root, 'js/lab-source-data.js'), 'utf8'), context); return context.globalThis.LabSourceData; })();
  assert.equal(embedded.documentos.length, 3);
  assert.equal(model.simulate(embedded, 'nasa', {}).count, 4332);
  assert.equal(model.simulate(embedded, 'nasa', {}).median, 2.39);
  assert.equal(model.simulate(embedded, 'poblacion', {}).rows[0][2], 52886363);
  assert.ok(Math.abs(model.simulate(embedded, 'clima', {}).rain - 1816.08) < 1e-8);
  assert.equal(model.simulate(embedded, 'sismos', {}).count, 133);
  assert.equal(model.simulate(embedded, 'documentos', { document: '2' }).rows[0][2], '27');
  dom.window.close();
});

function setupUI(source = data, name = 'poblacion') {
  const dom = new JSDOM(`<section data-case="${name}"><form><input name="start" value="2000"><input name="end" value="2024"><button>Actualizar</button><button type="reset">Restablecer</button></form><div data-result-output aria-live="polite"></div><p data-result-status role="status"></p><button data-result-download>CSV</button><button data-result-retry>Reintentar</button></section><script id="lab-source-data" type="application/json">${JSON.stringify(source)}</script>`, { runScripts: 'outside-only' });
  const win = dom.window;
  win.AnalysisResultsModel = model;
  for (const file of ['js/analysis-results-view.js', 'js/analysis-results.js']) new vm.Script(read(file), { filename: path.join(root, file) }).runInContext(dom.getInternalVMContext());
  const panel = win.document.querySelector('section');
  const simulator = new win.AnalysisResults.Simulator({ container: panel });
  simulator.render(panel);
  return { dom, win, panel, simulator };
}

test('el plugin actualiza el resultado, valida, restablece, descarga y limpia sus eventos', async () => {
  const { dom, win, panel, simulator } = setupUI();
  assert.equal(win.AnalysisResults.Simulator.type, 'analysis-result');
  assert.match(panel.textContent, /Cambio de población entre 2000 y 2024/u);
  assert.equal(panel.querySelectorAll('tbody tr').length, 2);
  simulator.render(panel);
  let exported, clicked = 0, revoked;
  win.URL.createObjectURL = blob => { exported = blob; return 'blob:resultado'; };
  win.URL.revokeObjectURL = url => { revoked = url; };
  win.HTMLAnchorElement.prototype.click = function () { clicked += 1; assert.equal(this.download, 'resultado-poblacion.csv'); };
  panel.querySelector('[data-result-download]').click();
  assert.equal(clicked, 1);
  assert.ok(exported instanceof win.Blob);
  assert.equal(revoked, 'blob:resultado');
  const end = panel.querySelector('[name="end"]');
  end.value = '1999';
  end.dispatchEvent(new win.Event('change', { bubbles: true }));
  assert.match(panel.querySelector('[role="alert"]').textContent, /año inicial/iu);
  assert.equal(panel.querySelector('[data-result-download]').disabled, true);
  panel.querySelector('[data-result-download]').dispatchEvent(new win.Event('click'));
  assert.equal(clicked, 1);
  end.value = '2024';
  panel.querySelector('[data-result-retry]').click();
  assert.equal(panel.querySelector('[role="alert"]'), null);
  const submit = new win.Event('submit', { bubbles: true, cancelable: true });
  panel.querySelector('form').dispatchEvent(submit);
  assert.equal(submit.defaultPrevented, true);
  end.value = '2001';
  panel.querySelector('form').dispatchEvent(new win.Event('change'));
  assert.match(panel.textContent, /Sin resultados/iu);
  panel.querySelector('button[type="reset"]').click();
  await new Promise(resolve => win.queueMicrotask(resolve));
  assert.match(panel.querySelector('[data-result-output]').textContent, /2000 y 2024/u);
  delete win.URL.createObjectURL;
  panel.querySelector('[data-result-download]').click();
  assert.match(panel.querySelector('[data-result-status]').textContent, /No fue posible descargar/iu);
  simulator.destroy();
  end.value = '1999';
  end.dispatchEvent(new win.Event('change', { bubbles: true }));
  assert.equal(panel.querySelector('[role="alert"]'), null);
  dom.window.close();
});

test('el plugin se recupera de datos dañados y dependencias ausentes sin ocultar instrucciones', () => {
  const { dom, win, panel, simulator } = setupUI();
  const source = win.document.getElementById('lab-source-data');
  source.textContent = 'incorrecto';
  simulator.refresh();
  assert.match(panel.querySelector('[role="alert"]').textContent, /datos incluidos/iu);
  source.textContent = JSON.stringify(data);
  panel.querySelector('[data-result-retry]').click();
  assert.ok(panel.querySelector('table'));
  win.AnalysisResultsModel = null;
  simulator.refresh();
  assert.match(panel.querySelector('[role="alert"]').textContent, /recargar/iu);
  simulator.destroy();
  dom.window.close();
});

test('la vista muestra valores negativos, ausentes y documentos sin ejecutar contenido de las fuentes', () => {
  const { dom, win, panel, simulator } = setupUI(data, 'documentos');
  assert.match(panel.querySelector('[data-result-output]').textContent, /no certifica/iu);
  assert.match(panel.querySelector('.result-data summary').textContent, /· 1 fila$/u);
  assert.equal(panel.querySelector('[data-result-source]').href, data.documentos[0].url_evidencia);
  const unsafe = { ...model.simulate(data, 'poblacion'), chart: { unit: '%', points: [{ label: '<img onerror=alert(1)>', value: -10 }, { label: 'Cero', value: 0 }, { label: 'Ausente', value: null }] } };
  win.AnalysisResultsView.render(panel.querySelector('[data-result-output]'), unsafe);
  assert.equal(panel.querySelector('img'), null);
  assert.ok(panel.querySelector('[data-value="-10"]'));
  assert.match(panel.querySelector('[data-result-output]').textContent, /Sin dato/u);
  win.AnalysisResultsView.render(panel.querySelector('[data-result-output]'), { ...unsafe, count: 0 });
  assert.equal(panel.querySelectorAll('[data-value]').length, 0);
  const docResult = model.simulate(data, 'documentos');
  win.AnalysisResultsView.render(panel.querySelector('[data-result-output]'), { ...docResult, sourceUrl: 'javascript:alert(1)' });
  assert.equal(panel.querySelector('[data-result-source]'), null);
  simulator.destroy();
  dom.window.close();
});

function setupLazyUI() {
  const dom = new JSDOM(`<!doctype html><head></head><body><section data-case="poblacion"><form><input name="start" value="2000"><input name="end" value="2024"><button>Actualizar</button><button type="reset">Restablecer</button></form><div data-result-output aria-live="polite"></div><p data-result-status></p><button data-result-retry hidden>Reintentar</button><button data-result-download>Descargar</button></section><script id="lab-source-data" type="application/json" data-src="js/lab-source-data.js"></script></body>`, { runScripts: 'outside-only' });
  const win = dom.window;
  win.AnalysisResultsModel = model;
  for (const file of ['js/lab-data-loader.js', 'js/analysis-results-view.js', 'js/analysis-results.js']) new vm.Script(read(file), { filename: path.join(root, file) }).runInContext(dom.getInternalVMContext());
  const panel = win.document.querySelector('section');
  const simulator = new win.AnalysisResults.Simulator({ container: panel });
  simulator.render(panel);
  return { dom, win, panel, simulator };
}

test('al abrir la guía el simulador espera los datos sin descargarlos todavía', async () => {
  const { dom, win, panel, simulator } = setupLazyUI();
  assert.match(panel.querySelector('[data-result-output]').textContent, /se cargan al abrirlo/u);
  assert.equal(win.document.querySelectorAll('script[src]').length, 0);
  win.LabSourceData = data;
  await win.LabDataLoader.ensure(win.document, win);
  assert.equal(panel.querySelectorAll('tbody tr').length, 2);
  assert.equal(simulator.waiting, null);
  simulator.destroy();
  dom.window.close();
});

test('una acción del aprendiz pide los datos y un fallo de carga deja el reintento visible', async () => {
  const { dom, win, panel, simulator } = setupLazyUI();
  panel.querySelector('form').dispatchEvent(new win.Event('change', { bubbles: true }));
  panel.querySelector('form').dispatchEvent(new win.Event('change', { bubbles: true }));
  const scripts = win.document.querySelectorAll('script[src]');
  assert.equal(scripts.length, 1);
  scripts[0].dispatchEvent(new win.Event('error'));
  await new Promise(resolve => win.setTimeout(resolve, 0));
  assert.match(panel.querySelector('[role="alert"]').textContent, /No fue posible cargar los datos del laboratorio/u);
  assert.equal(panel.querySelector('[data-result-retry]').hidden, false);
  assert.equal(simulator.waiting, null);
  simulator.destroy();
  dom.window.close();
});
