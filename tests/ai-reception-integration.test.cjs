/* Integración de los siete receptores publicados con el registro y SDK reales. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const REGISTRY = JSON.parse(read('deliverables.registry.json'));
const ACTIVE_ARTIFACTS = REGISTRY.artifacts.filter(item => item.id !== 'ECO-A01');
const PREFIX = 'sena_bogota_ia_administrativos_21720210';
const plain = value => JSON.parse(JSON.stringify(value));

function snapshot(window) {
  return Object.keys(window.localStorage).sort().map(key => [key, window.localStorage.getItem(key)]);
}

async function until(predicate, description, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, 'La condición no se cumplió: ' + description);
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

async function fixture(saved = []) {
  const dom = new JSDOM(read('index.html'), {
    url: 'http://guia-integracion.test/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const window = dom.window;
  Object.defineProperty(window.HTMLInputElement.prototype, 'webkitdirectory', {configurable:true, value:true});
  for (const [key, value] of saved) window.localStorage.setItem(key, value);
  window.HTMLElement.prototype.scrollIntoView = function () {};
  const scripts = [...window.document.querySelectorAll('script[src]')]
    .map(node => node.getAttribute('src').split('?')[0])
    .filter(source => source === 'js/vendor/devbrain-learner-sdk.js' || source === 'js/registro-entregables.js' || source === 'js/vendor/fflate.js' || /^js\/(ai[^/]*|result-(archive|import))\.js$/u.test(source));
  assert.equal(scripts.length, 9, 'El índice carga el SDK, el registro, la biblioteca ZIP y los seis módulos de recepción.');
  for (const script of scripts) {
    vm.runInContext(read(script), dom.getInternalVMContext(), {filename: path.join(ROOT, script)});
  }
  assert.deepEqual(plain(window.DevBrainRegistroEntregables), REGISTRY, 'El registro publicado coincide con su fuente canónica.');
  const mounted = await window.DevBrainSDK.evidence.montar({
    registro: window.DevBrainRegistroEntregables, prefijo: PREFIX, dossierHref: '#portafolio'
  });
  assert.deepEqual(plain(mounted.huerfanos), []);
  assert.equal(window.AIDelivery.init({document: window.document, mounted}), 7);
  return {dom, window, document: window.document, mounted};
}

function envelope(artifact, suffix) {
  return {
    schemaVersion: 1, artifactId: artifact.id,
    fields: Object.fromEntries(artifact.fields.map(field => [field.key,
      `${artifact.id} / ${field.key}: ${suffix}. Fuente de prueba; revisión humana pendiente.`])),
    tool: 'Antigravity · prueba de integración'
  };
}

function choose(fixture, root, payload) {
  const input = root.querySelector('[data-result-file]');
  const file = new fixture.window.File([JSON.stringify(payload)], 'resultado.json', {type: 'application/json'});
  assert.ok(file instanceof fixture.window.File);
  Object.defineProperty(input, 'files', {configurable: true, value: [file]});
  input.dispatchEvent(new fixture.window.Event('change', {bubbles: true}));
}

function state(fixture, id) {
  return fixture.mounted.resumen().detalle.find(item => item.id === id).estado;
}

test('los siete receptores publicados reciben archivos reales, conservan borradores y exigen revisión', async t => {
  const fixtureLive = await fixture();
  t.after(() => fixtureLive.dom.window.close());
  const ids = ACTIVE_ARTIFACTS.map(artifact => artifact.id);
  assert.equal(ids.length, 7);
  assert.deepEqual([...fixtureLive.document.querySelectorAll('[data-ai-delivery]')].map(root => root.dataset.aiDelivery).sort(), [...ids].sort());

  const expectedAfterReload = new Map();
  for (let index = 0; index < ACTIVE_ARTIFACTS.length; index += 1) {
    const artifact = ACTIVE_ARTIFACTS[index];
    await t.test(artifact.id + ': lectura, identidad, borrador, revisión y corrección parcial', async () => {
      const root = fixtureLive.document.querySelector(`[data-ai-delivery="${artifact.id}"]`);
      const save = root.querySelector('[data-result-save]');
      const review = root.querySelector('[data-result-review]');
      const status = root.querySelector('[data-result-status]');
      assert.equal(root.querySelectorAll('textarea:not([data-result-text])').length, 0, 'El receptor no exige redactar respuestas.');
      const storage = fixtureLive.document.querySelector(`[data-ai-storage="${artifact.id}"]`);
      assert.ok(storage?.hidden, 'El formulario del SDK permanece dentro del almacén oculto.');
      for (const field of artifact.fields) {
        const input = fixtureLive.document.getElementById(`dbe-${artifact.id}-${field.key}`);
        assert.ok(input, 'El SDK monta la clave real: ' + field.key);
        assert.ok(input.closest('[hidden]'), 'El campo no aparece como formulario manual: ' + field.key);
      }

      const initialStorage = snapshot(fixtureLive.window);
      const other = ACTIVE_ARTIFACTS[(index + 1) % ACTIVE_ARTIFACTS.length];
      choose(fixtureLive, root, envelope(other, 'Identidad cruzada'));
      await until(() => /corresponde a otra evidencia/iu.test(status.textContent), artifact.id + ': rechazo de identidad cruzada');
      assert.equal(save.disabled, true);
      assert.equal(state(fixtureLive, artifact.id), 'pendiente');
      assert.deepEqual(snapshot(fixtureLive.window), initialStorage);

      const complete = envelope(artifact, 'Resultado completo');
      const firstKey = artifact.fields[0].key;
      complete.fields[firstKey] += ' <img src=x onerror="window.inyeccion=true">';
      choose(fixtureLive, root, complete);
      await until(() => !save.disabled, artifact.id + ': previsualización del archivo completo');
      assert.match(status.textContent, /Archivo listo/iu);
      assert.equal(root.querySelectorAll('[data-result-preview] details').length, artifact.fields.length);
      assert.equal(root.querySelector('[data-result-preview] img'), null);
      assert.equal(fixtureLive.window.inyeccion, undefined);
      assert.match(root.querySelector('[data-result-preview]').textContent, /<img src=x/u);
      for (const value of Object.values(complete.fields)) assert.ok(root.querySelector('[data-result-preview]').textContent.includes(value));
      assert.deepEqual(snapshot(fixtureLive.window), initialStorage, 'Leer y previsualizar no guarda datos ni bitácora.');
      assert.equal(state(fixtureLive, artifact.id), 'pendiente');

      save.click();
      const draft = plain(fixtureLive.mounted.store.leer(artifact.id));
      assert.deepEqual(draft.values, complete.fields);
      assert.equal(draft.status, 'borrador');
      assert.equal(state(fixtureLive, artifact.id), 'borrador');
      assert.ok(artifact.checklist.every((_, number) => draft.checks['c' + number] === false));
      assert.equal(review.disabled, false);
      assert.ok([...root.querySelectorAll('[data-result-download]')].every(button => !button.disabled));
      assert.match(status.textContent, /guardado como borrador/iu);

      review.click();
      const reviewed = plain(fixtureLive.mounted.store.leer(artifact.id));
      assert.equal(reviewed.status, 'lista');
      assert.equal(state(fixtureLive, artifact.id), 'lista');
      assert.ok(artifact.checklist.every((_, number) => reviewed.checks['c' + number] === true));
      assert.match(status.textContent, /valoración y la aprobación corresponden al instructor/iu);

      const reviewedStorage = snapshot(fixtureLive.window);
      const partial = {schemaVersion: 1, artifactId: artifact.id, fields: {[firstKey]: 'Corrección parcial conservada; revisión pendiente.'}, tool: 'Chat de prueba'};
      choose(fixtureLive, root, partial);
      await until(() => !save.disabled, artifact.id + ': lectura del archivo parcial');
      assert.equal(state(fixtureLive, artifact.id), 'lista', 'Seleccionar otra versión todavía no modifica el registro.');
      assert.deepEqual(snapshot(fixtureLive.window), reviewedStorage);
      save.click();
      const corrected = plain(fixtureLive.mounted.store.leer(artifact.id));
      assert.deepEqual(corrected.values, {...complete.fields, ...partial.fields});
      assert.equal(corrected.status, 'borrador');
      assert.equal(state(fixtureLive, artifact.id), 'borrador');
      assert.ok(artifact.checklist.every((_, number) => corrected.checks['c' + number] === false), 'La corrección exige revisar de nuevo todos los criterios.');
      expectedAfterReload.set(artifact.id, corrected);
    });
  }

  await t.test('una nueva carga conserva los siete borradores y sus respuestas sin volver a importar', async () => {
    const persisted = snapshot(fixtureLive.window);
    const restored = await fixture(persisted);
    t.after(() => restored.dom.window.close());
    for (const artifact of ACTIVE_ARTIFACTS) {
      assert.deepEqual(plain(restored.mounted.store.leer(artifact.id)), expectedAfterReload.get(artifact.id));
      assert.equal(state(restored, artifact.id), 'borrador');
      const root = restored.document.querySelector(`[data-ai-delivery="${artifact.id}"]`);
      assert.ok(root.querySelector('[data-result-preview]').textContent.includes('Corrección parcial conservada'));
      assert.equal(root.querySelector('[data-result-review]').disabled, false);
      assert.equal(root.querySelector('[data-result-save]').disabled, true);
    }
    assert.equal(restored.mounted.store.leerBitacora().length, ids.length * 2);
  });
});

test('las siete estaciones reciben ZIP y carpetas; un ZIP dañado conserva el borrador', async t => {
  const live = await fixture();
  t.after(() => live.dom.window.close());
  const {zipSync, strToU8} = require('fflate');
  for (const artifact of ACTIVE_ARTIFACTS) {
    const root = live.document.querySelector(`[data-ai-delivery="${artifact.id}"]`);
    const save = root.querySelector('[data-result-save]'), status = root.querySelector('[data-result-status]');
    const input = root.querySelector('[data-result-file]'), folder = root.querySelector('[data-result-folder]');
    const payload = envelope(artifact, 'Entregado en ZIP');
    const archive = zipSync({'salida/resultado.json':strToU8(JSON.stringify(payload)), 'anexo.pdf':strToU8('Anexo de prueba')});
    Object.defineProperty(input, 'files', {configurable:true, value:[new live.window.File([archive], 'entrega.zip')]});
    input.dispatchEvent(new live.window.Event('change'));
    assert.equal(root.getAttribute('aria-busy'), 'true');
    await until(() => !save.disabled, artifact.id + ': ZIP listo');
    assert.match(status.textContent, /salida\/resultado.json/u);
    assert.match(status.textContent, /omitió 1 archivo/u);
    save.click();
    assert.deepEqual(plain(live.mounted.store.leer(artifact.id).values), payload.fields);
    const stored = snapshot(live.window);
    Object.defineProperty(input, 'files', {configurable:true, value:[new live.window.File(['ZIP dañado'], 'entrega.zip')]});
    input.dispatchEvent(new live.window.Event('change'));
    await until(() => status.getAttribute('role') === 'alert', artifact.id + ': aviso de error');
    assert.match(status.textContent, /ZIP.*dañado.*Extrae/iu);
    assert.equal(root.getAttribute('aria-busy'), 'false');
    assert.equal(save.disabled, true);
    assert.equal(root.querySelector('[data-result-retry]').hidden, false);
    assert.deepEqual(snapshot(live.window), stored);

    const correction = envelope(artifact, 'Entregado en carpeta');
    const result = new live.window.File([JSON.stringify(correction)], 'resultado.json', {type:''});
    Object.defineProperty(result, 'webkitRelativePath', {value:'Entrega/sub/resultado.json'});
    Object.defineProperty(folder, 'files', {configurable:true, value:[result]});
    folder.dispatchEvent(new live.window.Event('change'));
    await until(() => !save.disabled, artifact.id + ': carpeta lista');
    assert.equal(status.getAttribute('role'), 'status');
    assert.equal(root.querySelector('[data-result-retry]').hidden, true);
    assert.match(status.textContent, /Entrega\/sub\/resultado.json/u);
    save.click();
    assert.deepEqual(plain(live.mounted.store.leer(artifact.id).values), correction.fields);
  }
});
