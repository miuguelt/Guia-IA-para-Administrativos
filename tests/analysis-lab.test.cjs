const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const model = require('../js/analysis-lab-model.js');
const root = path.resolve(__dirname, '..');

const fixtures = {
  exoplanetas: [
    { pl_name: 'A b', hostname: 'A', pl_orbper: '10', pl_rade: '2', st_teff: '5000', st_rad: '1' },
    { pl_name: 'A c', hostname: 'A', pl_orbper: '20', pl_rade: '4', st_teff: '5000', st_rad: '1' },
    { pl_name: '<B>', hostname: 'B', pl_orbper: '', pl_rade: '3', st_teff: '', st_rad: '2' },
    { pl_name: 'C b', hostname: 'C', pl_orbper: '2', pl_rade: '1', st_teff: '6000', st_rad: '2' },
    { pl_name: 'C c', hostname: 'C', pl_orbper: '3', pl_rade: '1', st_teff: '6100', st_rad: '2' }
  ],
  poblacion: [
    { pais: 'Colombia', codigo: 'COL', anio: '2020', poblacion: '100' },
    { pais: 'Colombia', codigo: 'COL', anio: '2021', poblacion: '110' },
    { pais: 'Perú', codigo: 'PER', anio: '2020', poblacion: '60' },
    { pais: 'Perú', codigo: 'PER', anio: '2021', poblacion: '' }
  ],
  clima: [
    { fecha: '2024-01-01', temperatura_c: '0', precipitacion_mm: '2' },
    { fecha: '2024-01-02', temperatura_c: '-999', precipitacion_mm: '0' },
    { fecha: '2024-01-03', temperatura_c: '-2', precipitacion_mm: '3' }
  ],
  sismos: [
    { id: 'e1', fecha: '2024-01-01', latitud: '4', longitud: '-74', profundidad_km: '10', magnitud: '5', tipo_magnitud: 'mw' },
    { id: 'e2', fecha: '2024-01-02', latitud: '0', longitud: '0', profundidad_km: '20', magnitud: '6', tipo_magnitud: 'mb' }
  ]
};

test('el modelo conserva ceros, descarta ausentes y no cuenta anfitrionas repetidas ni contradictorias', () => {
  assert.equal(model.numeric('0'), 0);
  for (const value of ['', null, undefined, 'NaN', '-999', Infinity]) assert.equal(model.numeric(value), null);
  const planets = model.prepare(fixtures, 'planetas', {});
  assert.equal(planets.points.length, 4);
  assert.equal(planets.excluded, 1);
  assert.equal(planets.total, 5);
  const stars = model.prepare(fixtures, 'estrellas', {});
  assert.deepEqual(stars.points.map(p => p.label), ['A']);
  assert.equal(stars.conflicts, 1);
  assert.equal(stars.duplicates, 1);
  assert.equal(model.prepare({}, 'planetas').points.length, 0);
  assert.throws(() => model.prepare(fixtures, 'desconocida'), /vista/iu);
});

test('los filtros, unidades e índices se calculan sobre los registros seleccionados', () => {
  const col = model.prepare(fixtures, 'poblacion', { country: 'COL', indexed: true });
  assert.deepEqual(col.points.map(p => p.y), [100, 110]);
  assert.equal(col.filtered, 2);
  assert.equal(model.prepare(fixtures, 'poblacion', { country: 'PER', year: '2021' }).points.length, 0);
  const climate = model.prepare(fixtures, 'clima');
  assert.deepEqual(climate.points.map(p => p.y), [0, -2]);
  assert.equal(model.prepare(fixtures, 'clima', { rain: true }).points.length, 3);
  const quakes = model.prepare(fixtures, 'sismos');
  assert.equal(quakes.points[0].x, -74);
  assert.equal(quakes.points[0].y, 4);
  assert.equal(quakes.points[1].value, 6);
  assert.equal(model.prepare(fixtures, 'sismos', { year: '2023' }).points.length, 0);
});

test('histogramas y escalas conservan frecuencias, límites y dominios constantes', () => {
  const bins = model.histogram([0, 1, 2, 3, 4], 2);
  assert.deepEqual(bins.map(b => b.count), [2, 3]);
  assert.equal(bins.reduce((n, b) => n + b.count, 0), 5);
  assert.deepEqual(model.histogram([], 5), []);
  assert.equal(model.histogram([2, 2, 2], 4).reduce((n, b) => n + b.count, 0), 3);
  assert.deepEqual(model.extent([], false), [0, 1]);
  assert.ok(model.extent([2, 2])[0] < 2);
  assert.deepEqual(model.extent([-1, 0, 10, 100], true), [10, 100]);
  assert.equal(model.scale(10, [1, 100], 0, 200, true), 100);
  assert.equal(model.scale(5, [0, 10], 0, 100), 50);
  const csv = model.toCSV([{ label: '=1+1', x: 1, y: 2, group: 'A,"B"' }]);
  assert.match(csv, /'=1\+1/);
  assert.match(csv, /"A,""B"""/);
});

test('el laboratorio se integra como complemento y conserva los seis módulos curriculares', () => {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  const doc = dom.window.document;
  const lab = doc.querySelector('#laboratorio-datos');
  assert.ok(lab, 'Falta el módulo independiente');
  assert.equal(doc.querySelectorAll('[data-learning-module]').length, 6);
  assert.equal(lab.hasAttribute('data-learning-module'), false);
  assert.ok(doc.querySelector('[data-module-link="laboratorio-datos"]'));
  assert.match(lab.textContent, /datos públicos reales/iu);
  assert.ok(lab.querySelector('[data-db-evidence="LAB-A01"]'));
  for (const id of ['lab-herramientas', 'lab-nasa', 'lab-poblacion', 'lab-clima', 'lab-sismos', 'lab-documentos', 'lab-avanzado']) assert.ok(doc.getElementById(id), id);
  const data = (() => { const context = { globalThis: {} }; require('node:vm').runInNewContext(fs.readFileSync(path.join(root, 'js/lab-source-data.js'), 'utf8'), context); return context.globalThis.LabSourceData; })();
  for (const name of Object.keys(fixtures)) assert.ok(data[name].length > 10, name);
  dom.window.close();
});

module.exports = { fixtures };

test('el explorador cambia datos, escalas y páginas, y exporta exactamente su selección', () => {
  const ui = require('../js/analysis-lab.js');
  const large = JSON.parse(JSON.stringify(fixtures));
  large.exoplanetas.push(...Array.from({ length: 30 }, (_, i) => ({ ...fixtures.exoplanetas[0], pl_name: `Extra ${i}`, pl_orbper: String(40 + i) })));
  const dom = new JSDOM(`<section id="laboratorio-datos"><div id="lab-explorer">
    <select id="lab-view"><option value="planetas">Planetas</option><option value="estrellas">Estrellas</option><option value="poblacion">Población</option><option value="clima">Clima</option><option value="sismos">Sismos</option></select>
    <select id="lab-mode"></select><label id="lab-country-wrap"><select id="lab-country"></select></label>
    <label id="lab-year-wrap"><select id="lab-year"></select></label>
    <label id="lab-log-wrap"><input id="lab-log" type="checkbox"></label>
    <label id="lab-index-wrap"><input id="lab-index" type="checkbox"></label>
    <label id="lab-rain-wrap"><input id="lab-rain" type="checkbox"></label>
    <h3 id="lab-chart-title"></h3><p id="lab-chart-summary" role="status"></p><p id="lab-chart-note"></p>
    <svg id="lab-chart"></svg><div id="lab-legend"></div><div id="lab-table"></div><p id="lab-table-page"></p>
    <button id="lab-prev">Anterior</button><button id="lab-next">Siguiente</button><button id="lab-download">CSV</button>
    </div><script id="lab-source-data" type="application/json">${JSON.stringify(large)}</script></section>`);
  const { window: win } = dom;
  const doc = win.document;
  win.AnalysisLabModel = model;
  let clicked = 0, exported;
  win.URL.createObjectURL = blob => { exported = blob; return 'blob:prueba'; };
  win.URL.revokeObjectURL = () => {};
  win.HTMLAnchorElement.prototype.click = function () { clicked += 1; assert.equal(this.download, 'seleccion-laboratorio.csv'); };
  assert.equal(ui.init(null, win), null);
  assert.equal(ui.init(doc, { AnalysisLabModel: null }), null);
  const api = ui.init(doc, win);
  assert.ok(api);
  assert.equal(ui.init(doc, win), api);
  const change = (id, value, checked = false) => {
    const control = doc.getElementById(id);
    if (control.type === 'checkbox') control.checked = checked; else control.value = value;
    control.dispatchEvent(new win.Event('change', { bubbles: true }));
  };
  assert.equal(doc.querySelectorAll('#lab-table tbody tr').length, 25);
  doc.querySelector('#lab-next').click();
  assert.equal(doc.querySelectorAll('#lab-table tbody tr').length, 9);
  assert.match(doc.querySelector('#lab-table-page').textContent, /Página 2 de 2.*34 registros/);
  doc.querySelector('#lab-prev').click();
  assert.equal(doc.querySelectorAll('#lab-table tbody tr').length, 25);
  change('lab-log', '', true);
  assert.match(doc.querySelector('#lab-chart-note').textContent, /logarítmica/iu);
  change('lab-mode', 'histogram');
  assert.equal(doc.querySelectorAll('#lab-chart rect[data-bin]').length, 12);
  change('lab-view', 'estrellas');
  assert.match(doc.querySelector('#lab-chart-summary').textContent, /1.*estrella/iu);
  change('lab-view', 'poblacion');
  change('lab-index', '', true);
  assert.match(doc.querySelector('#lab-chart-title').textContent, /100/);
  change('lab-mode', 'bars');
  assert.ok(doc.querySelector('#lab-year').value);
  change('lab-country', 'PER');
  assert.match(doc.querySelector('#lab-chart-summary').textContent, /Sin datos/);
  change('lab-year', '2020');
  assert.equal(doc.querySelectorAll('#lab-table tbody tr').length, 1);
  change('lab-view', 'clima');
  change('lab-rain', '', true);
  assert.match(doc.querySelector('#lab-chart-title').textContent, /precipitación/iu);
  change('lab-view', 'sismos');
  assert.equal(doc.querySelectorAll('#lab-chart circle').length, 2);
  change('lab-mode', 'histogram');
  doc.querySelector('#lab-download').click();
  assert.equal(clicked, 1);
  assert.ok(exported instanceof win.Blob);
  doc.querySelector('#lab-prev').click();
  doc.querySelector('#lab-next').click();
  assert.match(doc.querySelector('#lab-table-page').textContent, /1.*1/);
  assert.equal(doc.querySelector('#lab-next').disabled, true);
  dom.window.close();
});

test('el explorador informa JSON dañado y pagina sin ocultar el total de registros', () => {
  const ui = require('../js/analysis-lab.js');
  const dom = new JSDOM('<div id="lab-explorer"><p id="lab-chart-summary"></p></div><script id="lab-source-data">incorrecto</script>');
  dom.window.AnalysisLabModel = model;
  assert.equal(ui.init(dom.window.document, dom.window), null);
  assert.match(dom.window.document.querySelector('#lab-chart-summary').textContent, /No fue posible/);
  dom.window.close();
});
