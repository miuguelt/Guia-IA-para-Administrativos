const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const view = require('../js/ai-delivery-view.js');
const model = require('../js/ai-result-model.js');

const artifact = {
  id: 'MG-A02', name: 'Instrucciones',
  fields: [{ key: 'borrador', label: 'Borrador' }, { key: 'prueba', label: 'Prueba' }],
  checklist: ['Contrasta la fuente.', 'Conserva los datos pendientes.']
};
const markup = '<section data-ai-delivery="MG-A02"><input type="file" data-result-file><p data-result-info></p><p data-result-status></p><div data-result-preview></div><button data-result-save disabled>Guardar</button><button data-result-review disabled>Confirmo que revisé los criterios</button><button data-result-download="md" disabled>Markdown</button><button data-result-download="json" disabled>JSON</button><button data-result-download="html" disabled>HTML</button></section>';

function fixture() {
  const dom = new JSDOM(markup, { url: 'http://aula.test', runScripts: 'outside-only' });
  return { dom, root: dom.window.document.querySelector('section') };
}

test('la revisión confirmada se muestra al montar y depende de los criterios guardados', () => {
  const { dom, root } = fixture();
  view.paintRecord(root, artifact, { values: { borrador: 'Respuesta con fuente.', prueba: 'PC-01: no consta la fecha.' }, checks: { c0: true, c1: true }, status: 'borrador' });
  assert.match(root.querySelector('[data-result-info]').textContent, /revisión.*registrada|revisado.*ti/iu);
  assert.match(root.querySelector('[data-result-info]').textContent, /instructor.*pendiente|pendiente.*instructor/iu);
  assert.equal(root.querySelector('[data-result-review]').disabled, true);
  assert.match(root.querySelector('[data-result-review]').textContent, /revisión confirmada/iu);
  assert.ok([...root.querySelectorAll('[data-result-download]')].every(button => !button.disabled));
  assert.equal(root.querySelectorAll('.result-topic').length, 2);
  dom.window.close();
});

test('las respuestas completas sin todos los criterios revisados conservan la revisión pendiente', () => {
  const { dom, root } = fixture();
  for (const checks of [undefined, { c0: true, c1: false }, { c0: 'true', c1: true }]) {
    view.paintRecord(root, artifact, { values: { borrador: 'Respuesta.', prueba: 'Prueba.' }, checks, status: 'lista' });
    assert.match(root.querySelector('[data-result-info]').textContent, /antes de confirmar/iu);
    assert.equal(root.querySelector('[data-result-review]').disabled, false);
    assert.equal(root.querySelector('[data-result-review]').textContent, 'Confirmo que revisé los criterios');
  }
  dom.window.close();
});

test('un documento vacío o incompleto no se anuncia revisado aunque sus marcas estén activas', () => {
  const { dom, root } = fixture();
  view.paintRecord(root, artifact, { values: {}, checks: { c0: true, c1: true }, status: 'lista' });
  assert.match(root.querySelector('[data-result-info]').textContent, /Aún no/iu);
  assert.ok([...root.querySelectorAll('[data-result-download]')].every(button => button.disabled));
  assert.equal(root.querySelector('[data-result-review]').disabled, true);
  view.paintRecord(root, artifact, { values: { borrador: 'Archivo parcial.' }, checks: { c0: true, c1: true }, status: 'lista' });
  assert.match(root.querySelector('[data-result-info]').textContent, /Faltan 1 resultados/u);
  assert.doesNotMatch(root.querySelector('[data-result-info]').textContent, /revisión.*registrada|revisado.*ti/iu);
  assert.equal(root.querySelector('[data-result-review]').disabled, true);
  assert.equal(root.querySelector('[data-result-review]').textContent, 'Confirmo que revisé los criterios');
  assert.equal(root.querySelectorAll('.result-topic').length, 1);
  dom.window.close();
});

test('recibir un archivo parcial reinicia la revisión y completarlo habilita una comprobación nueva', () => {
  const { dom, root } = fixture();
  const previous = { values: {}, checks: { c0: true, c1: true } };
  const partial = model.prepareRecord(previous, { fields: { borrador: 'Borrador nuevo.' } }, artifact);
  view.paintRecord(root, artifact, partial);
  assert.deepEqual(partial.checks, { c0: false, c1: false });
  assert.equal(root.querySelector('[data-result-review]').disabled, true);
  const complete = model.prepareRecord(partial, { fields: { prueba: 'Tres salidas con fuente.' } }, artifact);
  view.paintRecord(root, artifact, complete);
  assert.equal(root.querySelector('[data-result-review]').disabled, false);
  assert.equal(root.querySelector('[data-result-review]').textContent, 'Confirmo que revisé los criterios');
  assert.match(root.querySelector('[data-result-preview]').textContent, /Borrador nuevo.*Tres salidas/su);
  dom.window.close();
});

test('la vista previa nueva no permite confirmar ni descargar la versión guardada hasta decidir qué recibir', async () => {
  const { dom, root } = fixture();
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  const mount = dom.window.document.createElement('div');
  mount.dataset.dbEvidence = artifact.id;
  dom.window.document.body.append(mount);
  const dossier = dom.window.document.createElement('div');
  dossier.dataset.dbEvidenceDossier = '';
  dom.window.document.body.append(dossier);
  for (const file of ['js/vendor/devbrain-learner-sdk.js', 'js/vendor/fflate.js','js/result-archive.js','js/ai-result-model.js','js/result-import.js', 'js/ai-result-store.js', 'js/ai-delivery-view.js', 'js/ai-delivery.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), dom.getInternalVMContext(), { filename: file });
  }
  const mounted = await dom.window.DevBrainSDK.evidence.montar({ registro: { guideId: 'vista-revision', artifacts: [artifact] }, prefijo: 'aula' });
  mounted.store.guardar(artifact.id, { values: { borrador: 'Borrador guardado.', prueba: 'Prueba guardada.' }, checks: { c0: true, c1: true }, status: 'lista' });
  dom.window.AIDelivery.init({ document: dom.window.document, mounted });
  assert.equal(root.querySelector('[data-result-review]').disabled, true);
  const input = root.querySelector('[data-result-file]');
  const file = new dom.window.File([JSON.stringify({ schemaVersion: 1, artifactId: artifact.id, fields: { borrador: 'Versión nueva todavía sin guardar.' } })], 'resultado.json', { type: 'application/json' });
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  input.dispatchEvent(new dom.window.Event('change'));
  for (let attempt = 0; attempt < 250 && root.querySelector('[data-result-save]').disabled; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.equal(root.querySelector('[data-result-save]').disabled, false);
  assert.equal(root.querySelector('[data-result-review]').disabled, true);
  assert.ok([...root.querySelectorAll('[data-result-download]')].every(button => button.disabled));
  assert.equal(mounted.store.leer(artifact.id).values.borrador, 'Borrador guardado.');
  root.querySelector('[data-result-save]').click();
  assert.equal(root.querySelector('[data-result-review]').disabled, false);
  assert.equal(root.querySelector('[data-result-review]').textContent, 'Confirmo que revisé los criterios');
  assert.equal(mounted.store.leer(artifact.id).checks.c0, false);
  assert.equal(mounted.store.leer(artifact.id).values.prueba, 'Prueba guardada.');
  dom.window.close();
});
