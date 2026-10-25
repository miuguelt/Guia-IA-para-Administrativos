const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { analizarTexto } = require('../scripts/check-redaccion.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Documenta recibe archivos de IA y exige guardar y confirmar la revisión por separado', () => {
  const dom = new JSDOM(read('index.html'));
  const doc = dom.window.document;
  const artifacts = JSON.parse(read('deliverables.registry.json')).artifacts.filter(item => item.id !== 'ECO-A01');
  assert.equal(doc.querySelectorAll('[data-scaffold-target]').length, 0);
  const deliveries = [...doc.querySelectorAll('[data-ai-delivery]')];
  assert.deepEqual(deliveries.map(delivery => delivery.dataset.aiDelivery), artifacts.map(artifact => artifact.id));
  assert.equal(deliveries.length, 7);
  for (const delivery of deliveries) {
    const artifact = artifacts.find(item => item.id === delivery.dataset.aiDelivery);
    const input = delivery.querySelector('[data-result-file]');
    assert.equal(input.type, 'file');
    const acceptedExtensions = input.accept.split(',');
    const visualArtifact = ['MG-A01', 'MG-A02', 'MG-A03', 'MG-A04', 'MG-A05'].includes(artifact.id);
    for (const extension of visualArtifact ? ['.html', '.json', '.zip', '.txt', '.md'] : ['.json', '.zip', '.txt', '.md']) {
      assert.ok(acceptedExtensions.includes(extension), `${artifact.id}: falta ${extension}`);
    }
    assert.equal(input.multiple, true);
    const folder = delivery.querySelector('[data-result-folder]');
    assert.equal(folder.type, 'file');
    assert.ok(folder.hasAttribute('webkitdirectory'));
    assert.equal(folder.multiple, true);
    assert.ok(delivery.querySelector(`label[for="${folder.id}"]`));
    assert.equal(delivery.querySelector('[data-result-retry]').hidden, true);
    assert.ok(delivery.querySelector(`label[for="${input.id}"]`));
    assert.equal(delivery.querySelectorAll('input:not([type="file"]), textarea:not([data-result-text]), select, [contenteditable="true"]').length, 0);
    assert.ok(delivery.querySelector('[data-result-preview]'));
    assert.equal(delivery.querySelector('[data-result-status]').getAttribute('role'), 'status');
    assert.equal(delivery.querySelector('[data-result-save]').disabled, true);
    assert.equal(delivery.querySelector('[data-result-review]').disabled, true);
    assert.match(delivery.querySelector('[data-result-save]').textContent, /borrador/iu);
    assert.match(delivery.querySelector('[data-result-review]').textContent, /Confirmo que revisé/iu);
    const outputDownloads = [...delivery.querySelectorAll('[data-result-download]')].map(button => [button.dataset.resultDownload, button.disabled]);
    assert.deepEqual(outputDownloads, visualArtifact ? [] : [['html', true], ['md', true], ['json', true]]);
    const criteria = delivery.querySelector('.delivery-criteria');
    assert.equal(criteria.tagName, 'DETAILS');
    assert.equal(criteria.open, false);
    assert.deepEqual([...criteria.querySelectorAll('li')].map(item => item.textContent), artifact.checklist);
    assert.match(delivery.textContent, /La importación no comprueba el contenido/iu);
    assert.match(delivery.textContent, /valoración corresponde al instructor/iu);
    const mount = doc.querySelector(`[data-db-evidence="${artifact.id}"]`);
    const storage = mount.closest('[data-ai-storage]');
    assert.equal(storage.dataset.aiStorage, artifact.id);
    assert.equal(storage.hidden, true, `La digitación del SDK de ${artifact.id} debe permanecer oculta`);
  }
  assert.doesNotMatch(read('js/course-tools.js'), /input\.value\s*=\s*input\.placeholder/u);
  dom.window.close();
});

test('el cierre exige revisar contenido y datos de exportación antes de entregar', () => {
  const dom = new JSDOM(read('index.html'));
  const page = dom.window.document.getElementById('portafolio');
  assert.doesNotMatch(page.textContent, /listo para radicar/iu);
  const check = page.querySelector('[data-export-review]');
  assert.ok(check);
  assert.doesNotMatch(check.textContent, /ADSO/u);
  for (const term of [/programa/iu, /identificación/iu, /21720210/u, /EcoBogotá/u, /instructor/iu]) assert.match(check.textContent, term);
  const steps = [...page.querySelectorAll('.portfolio-ready-steps .ready-step')];
  assert.equal(steps.length, 3);
  assert.match(steps[0].textContent, /fuentes, resultados y pendientes/iu);
  assert.match(steps[0].textContent, /Pide los ajustes a la IA/iu);
  assert.match(steps[0].textContent, /observaciones y mediciones que no consten siguen pendientes/iu);
  assert.match(steps[1].textContent, /Importa y descarga/iu);
  assert.match(steps[1].textContent, /revis/iu);
  assert.match(steps[2].textContent, /canal acordado/iu);
  assert.match(steps[2].textContent, /Confirma con tu instructor el formato y los anexos/iu);
  assert.match(steps[2].textContent, /no equivale a aprobación institucional/iu);
  dom.window.close();
});

test('la observación tiene seis casos independientes, una ficha vacía y una clave separada', () => {
  const cases = read('materiales/validacion/casos-transferencia.md');
  const protocol = read('docs/validacion-con-aprendices.md');
  const record = read('materiales/validacion/registro-observacion.csv');
  const ids = [...cases.matchAll(/^## (V0[0-5])\b/gmu)].map(match => match[1]);
  assert.deepEqual(ids, ['V00', 'V01', 'V02', 'V03', 'V04', 'V05']);
  for (const id of ids) assert.match(protocol, new RegExp(`\\| ${id} \\|`, 'u'));
  assert.match(cases, /no contienen registros reales/iu);
  assert.doesNotMatch(cases, /clave de revisión|respuesta esperada/iu);
  assert.match(protocol, /casos-transferencia\.md/u);
  assert.match(protocol, /registro-observacion\.csv/u);
  assert.match(protocol, /sin registrar nombres/iu);
  const lines = record.trimEnd().split(/\r?\n/u);
  assert.match(lines[0], /sin datos personales/iu);
  assert.match(lines[3], /^Código de participante;Código de tarea;/u);
  assert.match(lines[3], /Ayuda.*Tiempo.*Imagen/iu);
  assert.equal(lines.length, 5);
  assert.ok(lines[4].split(';').every(value => value === ''), 'La ficha no contiene resultados inventados');
  for (const filename of ['casos-transferencia.md', 'registro-observacion.csv']) {
    assert.ok(fs.existsSync(path.resolve(root, 'docs', '../materiales/validacion', filename)));
    assert.deepEqual(analizarTexto(read(`materiales/validacion/${filename}`), filename), []);
  }
  assert.match(read('.dockerignore'), /!materiales\/validacion\/\*\.md/u);
  assert.match(read('Dockerfile'), /COPY materiales\/validacion\/ \/usr\/share\/nginx\/html\/materiales\/validacion\//u);
});

test('la clave de transferencia corresponde a los datos nuevos y conserva el costo inicial una sola vez', () => {
  const cases = read('materiales/validacion/casos-transferencia.md');
  const protocol = read('docs/validacion-con-aprendices.md');
  assert.match(cases, /A;840;42/u);
  assert.match(cases, /A tiene 48/iu);
  assert.match(cases, /P-001, P-002, P-003, P-004, P-004, P-006/u);
  assert.match(protocol, /P-005.*P-004/isu);
  const stages = Object.fromEntries([...cases.matchAll(/^\| (Método manual completo|Generación con IA|Revisión|Corrección|Preparación y prueba de la plantilla) \| (\d+) \|/gmu)].map(match => [match[1], Number(match[2])]));
  assert.equal(Object.keys(stages).length, 5);
  const manual = stages['Método manual completo'];
  const assisted = stages['Generación con IA'] + stages.Revisión + stages.Corrección;
  const setup = stages['Preparación y prueba de la plantilla'];
  assert.equal(assisted, 38);
  assert.equal(setup + assisted, 68);
  assert.equal(3 * manual - (setup + 3 * assisted), 6);
  assert.match(protocol, /68 frente a 50/u);
  assert.match(protocol, /144 frente a 150/u);
});
