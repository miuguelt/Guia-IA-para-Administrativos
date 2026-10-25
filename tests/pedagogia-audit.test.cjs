const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const aids = require('../js/interactive-aids.js');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('los borradores guiados de PC-01 no afirman gestiones que la fuente no confirma', () => {
  const comparison = aids.PROMPT_COMPARISONS.pqrs.crtt;
  assert.doesNotMatch(comparison.simulatedOutput, /hemos remitido|ya remitimos|le informaremos/iu);
  assert.match(comparison.simulatedOutput, /fecha.*enlace/iu);
  const dom = new JSDOM(read('content/lessons/m02-diseno.html'));
  const widget = dom.window.document.querySelector('#pqrs-evaluator-simulator');
  assert.doesNotMatch(widget.textContent, /hemos remitido|le informaremos/iu);
  assert.match(widget.textContent, /fuente.*PC-01/iu);
  dom.window.close();
});

test('una precaución sin referencia no se certifica como afirmación respaldada', () => {
  const result = aids.auditStatement(aids.createAuditState(), 3, 'hallucination');
  assert.equal(result.isCorrect, true);
  assert.match(result.reason, /no consta|no identifica/iu);
  let state = aids.createAuditState();
  for (let index = 0; index < aids.AUDIT_STATEMENTS.length; index++) {
    state = aids.auditStatement(state, index, 'verified').state;
  }
  assert.equal(state.completed, false, 'Haber respondido todo no demuestra una revisión correcta');
});

test('la muestra de limpieza conserva valores, filas y ambas ocurrencias del CSV', () => {
  const lines = read('materiales/retos/datos-sofia.csv').split(/\r?\n/u);
  assert.equal(aids.DATA_CLEANING_RECORDS.length, 5);
  for (const record of aids.DATA_CLEANING_RECORDS) {
    const row = lines[record.fila - 1].split(';');
    assert.deepEqual([record.codigo, record.aprendiz, record.fecha, record.estado, record.sede],
      [row[0], row[1], row[3], row[4], row[5]], `Fila ${record.fila}`);
  }
  let state = aids.createDataCleanerState();
  for (const rule of ['trim_spaces', 'uppercase_states', 'flag_empty_review']) {
    state = aids.applyCleaningRules(state, rule, true).state;
  }
  const result = aids.applyCleaningRules(state, 'trim_spaces', true);
  assert.deepEqual(result.cleaned.map(row => row.estado), ['EN CURSO', 'FINALIZADO', 'REVISAR', 'PENDIENTE', 'PENDIENTE']);
  assert.deepEqual(result.cleaned.map(row => row.sede), aids.DATA_CLEANING_RECORDS.map(row => row.sede));
  assert.deepEqual(result.cleaned.filter(row => row.codigo === 'SIM-0012').map(row => row.fila), [16, 23]);
  const summary = aids.getDataCleanerSummaryText(state);
  assert.match(summary, /muestra.*5.*30/iu);
  assert.match(summary, /no demuestra.*archivo completo/iu);
  const dom = new JSDOM(read('content/lessons/m03-implementacion.html'));
  const doc = dom.window.document;
  aids.init(doc);
  for (const input of doc.querySelectorAll('[data-clean-rule] input')) {
    input.checked = true;
    input.dispatchEvent(new dom.window.Event('change'));
  }
  const table = doc.querySelector('.cleaner-table');
  assert.match(table.textContent, /Estado original.*Estado revisado/isu);
  const rows = [...doc.querySelectorAll('#data-cleaner-tbody tr')];
  assert.equal(rows.length, 5);
  assert.match(rows[1].textContent, /FINALIZADO·.*FINALIZADO/isu);
  assert.match(rows[3].textContent, /Aprendiz 012/iu);
  assert.match(rows[4].textContent, /Aprendiz 019/iu);
  dom.window.close();
});

test('el balance conserva costos adicionales y distingue un supuesto de una medición', () => {
  const params = { taskName: 'Revisar una solicitud', weeklyVolume: 15, manualMinutes: 12, aiMinutes: 13 };
  const hypothetical = aids.calculateProductivityRoi(params);
  assert.equal(hypothetical.valid, true);
  assert.equal(hypothetical.savedMinutes, -15);
  assert.match(hypothetical.summaryText, /supuesto|hipotético/iu);
  assert.match(hypothetical.summaryText, /ahorro.*pendiente/iu);
  const measured = aids.calculateProductivityRoi({ ...params, measurementStatus: 'medido' });
  assert.match(measured.summaryText, /observad/iu);
  assert.match(measured.summaryText, /adicional|aumento/iu);
  assert.equal(aids.calculateProductivityRoi({ ...params, aiMinutes: Infinity }).valid, false);
});

test('la transferencia de productividad recalcula las entradas actuales y rechaza datos inválidos', () => {
  const dom = new JSDOM(read('content/lessons/m05-cierre.html'));
  const doc = dom.window.document;
  const target = doc.createElement('textarea');
  target.id = 'dbe-MG-A05-compromiso_transferencia';
  doc.body.append(target);
  aids.init(doc);
  assert.equal(doc.querySelector('#roi-manual-time').value, '');
  doc.querySelector('#roi-manual-time').value = '12';
  doc.querySelector('#roi-ai-time').value = '13';
  doc.querySelector('#roi-volume').value = '15';
  doc.querySelector('#roi-calc-btn').click();
  doc.querySelector('#roi-ai-time').value = '14';
  doc.querySelector('[data-roi-transfer]').click();
  assert.match(target.value, /14 min/iu);
  assert.match(target.value, /supuesto|hipotético/iu);
  target.value = '';
  doc.querySelector('#roi-ai-time').value = '';
  doc.querySelector('[data-roi-transfer]').click();
  assert.equal(target.value, '');
  assert.match(doc.querySelector('#roi-result-box').textContent, /mayores a cero/iu);
  dom.window.close();
});

test('el Reto 1 admite conservar una instrucción correcta con su revisión sustentada', () => {
  const dom = new JSDOM(read('content/lessons/m01-fundamentos.html'));
  const reto = dom.window.document.querySelector('#reto-1');
  assert.match(reto.textContent, /si la instrucción cumple, consérvala/iu);
  assert.doesNotMatch(reto.textContent, /guarda ambas instrucciones/iu);
  dom.window.close();
});

test('el integrador cumple el plan de acción de Directriz sin exigir registro de tiempos', () => {
  const dom = new JSDOM(read('content/lessons/m05-cierre.html'));
  const reto = dom.window.document.querySelector('#reto-integrador');
  const prompt = reto.querySelector('[data-ai-task]');
  assert.match(prompt.textContent, /plan de acción/iu);
  assert.match(prompt.textContent, /responsables.*fechas.*pendientes/iu);
  assert.doesNotMatch(reto.textContent, /registro-tiempos\.csv/iu);
  assert.match(reto.textContent, /piloto.*30 días|compromiso/iu);
  dom.window.close();
});

test('la auditoría publicada distingue el periodo ausente de una cifra contradicha', () => {
  const dom = new JSDOM(read('index.html'));
  const root = dom.window.document.querySelector('#m04-validacion [data-simulator="case-practice"]');
  const spec = JSON.parse(root.querySelector('[data-case-spec]').textContent);
  const model = require('../js/case-practices-model.js');
  const period = spec.questions.find(q => q.id === 'periodo');
  const number = spec.questions.find(q => q.id === 'cifra');
  assert.match(root.querySelector('[data-case-question="periodo"] legend').textContent, /primer semestre/iu);
  assert.equal(model.evaluate(period, 'not-stated').correct, true);
  assert.equal(model.evaluate(period, 'contradicted').correct, false);
  assert.equal(model.evaluate(number, 'contradicted').correct, true);
  assert.equal(model.evaluate(number, 'not-stated').correct, false);
  dom.window.close();
});

test('la tabla ancha del simulador se puede recorrer con teclado en su propia región', () => {
  const dom = new JSDOM(read('content/lessons/m03-implementacion.html'));
  const region = dom.window.document.querySelector('#data-cleaner-simulator .table-scroll');
  assert.equal(region.tabIndex, 0);
  assert.equal(region.getAttribute('role'), 'region');
  assert.match(region.getAttribute('aria-label'), /muestra.*estados|estados.*muestra/iu);
  assert.equal(region.querySelector('table').querySelectorAll('thead th').length, 7);
  dom.window.close();
});

test('la carga publicada conserva la API y el comportamiento de los simuladores en el navegador', () => {
  const shell = new JSDOM(read('content/shell.html'));
  const scripts = [...shell.window.document.querySelectorAll('script[src]')]
    .map(script => script.getAttribute('src').split('?')[0])
    .filter(filename => /^js\/interactive-aids(?:-[\w-]+)?\.js$/u.test(filename));
  const dom = new JSDOM(read('content/lessons/m03-implementacion.html'), { runScripts: 'outside-only' });
  for (const filename of scripts) {
    new vm.Script(read(filename), { filename: path.join(root, filename) }).runInContext(dom.getInternalVMContext());
  }
  const browser = dom.window.InteractiveAids;
  assert.ok(browser);
  assert.deepEqual(Object.keys(browser).sort(), Object.keys(aids).sort());
  const params = { weeklyVolume: 20, manualMinutes: 12, aiMinutes: 13, measurementStatus: 'medido' };
  assert.deepEqual(JSON.parse(JSON.stringify(browser.calculateProductivityRoi(params))), aids.calculateProductivityRoi(params));
  assert.equal(browser.init(dom.window.document), true);
  const input = dom.window.document.querySelector('[data-clean-rule="trim_spaces"] input');
  input.checked = true;
  input.dispatchEvent(new dom.window.Event('change'));
  assert.match(dom.window.document.querySelector('#data-cleaner-count').textContent, /3 de 5/iu);
  dom.window.close();
  shell.window.close();
});
