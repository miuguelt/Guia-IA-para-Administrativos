const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const tick = window => new Promise(resolve => window.setTimeout(resolve, 35));

function run(dom, filename) {
  new vm.Script(read(filename), { filename: path.join(root, filename) }).runInContext(dom.getInternalVMContext());
}

async function setup(options = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', (...values) => errors.push(values.join(' ')));
  const dom = new JSDOM(read('index.html'), {
    url: 'http://runtime.test/' + (options.hash || '#inicio'),
    runScripts: 'outside-only',
    virtualConsole,
  });
  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLMediaElement.prototype.pause = () => {};
  for (const file of ['js/vendor/devbrain-learner-sdk.js', 'js/registro-entregables.js', 'js/course-tabs.js', 'js/course-dialog.js', 'js/evidence-accessibility.js', 'js/calendar-print.js', 'js/lab-source-data.js', 'js/lab-data-loader.js', 'js/analysis-lab-model.js', 'js/analysis-lab.js', 'js/analysis-results-model.js', 'js/analysis-results-view.js', 'js/analysis-results.js']) {
    run(dom, file);
  }
  if (options.withoutLabLoader) delete window.LabDataLoader;
  if (options.labDataFailure) window.LabDataLoader.ensure = () => Promise.reject(new Error(options.labDataFailure));
  if (options.navigationFailure) window.DevBrainSDK.createApp = () => { throw new Error('Navegación indisponible para la prueba.'); };
  if (options.evidenceFailure) window.DevBrainSDK.evidence.montar = () => Promise.reject(new Error('Registro indisponible para la prueba.'));
  if (options.saved) for (const [key, value] of Object.entries(options.saved)) window.localStorage.setItem(key, value);
  run(dom, 'js/course-app.js');
  await tick(window);
  return { dom, window, document: window.document, errors };
}

test('sin el cargador diferido el laboratorio usa los datos ya incluidos en la página', async () => {
  const { dom, document } = await setup({ hash: '#laboratorio-datos', withoutLabLoader: true });
  assert.match(document.getElementById('lab-chart-summary').textContent, /No fue posible leer los datos incluidos/u);
  dom.window.close();
});

test('si los datos del laboratorio no cargan, el resumen explica cómo continuar', async () => {
  const { dom, document } = await setup({ hash: '#laboratorio-datos', labDataFailure: 'No fue posible cargar los datos del laboratorio.' });
  assert.equal(document.getElementById('lab-chart-summary').textContent, 'No fue posible cargar los datos del laboratorio.');
  assert.equal(document.querySelectorAll('#lab-chart circle').length, 0);
  dom.window.close();
});

test('el laboratorio abre enlaces internos, conserva el curso y guarda su evidencia complementaria', async () => {
  const { dom, window, document, errors } = await setup({ hash: '#lab-clima' });
  assert.equal(window.location.hash, '#laboratorio-datos');
  assert.ok(document.getElementById('lab-clima').contains(document.activeElement));
  assert.ok(document.querySelectorAll('#lab-chart circle').length > 10);
  assert.equal(document.querySelectorAll('[data-simulator="analysis-result"] table').length, 5);
  assert.equal(window.guiaDevBrainApp.simulators.get('analysis-result'), window.AnalysisResults.Simulator);
  const changeResult = (id, value) => {
    const control = document.getElementById(id);
    control.value = value;
    control.dispatchEvent(new window.Event('change', { bubbles: true }));
  };
  changeResult('result-nasa-variable', 'estrellas');
  assert.match(document.querySelector('#lab-sim-nasa h4').textContent, /estrellas anfitrionas/iu);
  changeResult('result-pop-start', '2010');
  changeResult('result-pop-variable', 'indice');
  assert.match(document.querySelector('#lab-sim-poblacion figure').textContent, /base 2010 = 100/u);
  changeResult('result-climate-month', '02');
  changeResult('result-climate-variable', 'lluvia');
  assert.equal(document.querySelectorAll('#lab-sim-clima tbody tr').length, 1);
  assert.match(document.querySelector('#lab-sim-clima tbody').textContent, /2024-0229/u);
  changeResult('result-quake-min', '8');
  assert.match(document.querySelector('#lab-sim-sismos [data-result-output]').textContent, /Sin resultados/u);
  assert.equal(document.querySelector('#lab-sim-sismos [data-result-download]').disabled, true);
  changeResult('result-quake-min', '5');
  changeResult('result-quake-variable', 'dias');
  assert.equal(document.querySelectorAll('#lab-sim-sismos tbody tr').length, 31);
  changeResult('result-doc-source', '2');
  changeResult('result-doc-stage', 'contexto');
  assert.match(document.querySelector('#lab-sim-documentos tbody').textContent, /Proyección publicada/u);
  assert.match(document.querySelector('#lab-sim-documentos [data-result-source]').href, /#page=27$/u);
  assert.equal(document.querySelector('[data-db-evidence="LAB-A01"]').dataset.dbEvidenceMounted, 'true');
  const field = document.getElementById('dbe-LAB-A01-pregunta');
  field.value = '¿Cómo cambia la temperatura durante 2024?';
  field.dispatchEvent(new window.Event('change', { bubbles: true }));
  await tick(window);
  assert.match(document.getElementById('home-evidence-status').textContent, /0 de 5 evidencias curriculares/);
  window.location.hash = '#lab-nasa';
  await tick(window);
  assert.equal(window.location.hash, '#laboratorio-datos');
  assert.ok(document.getElementById('lab-nasa').contains(document.activeElement));
  assert.deepEqual(errors, []);
  dom.window.close();
});

test('el runtime navega a un reto, conserva acceso por teclado y borra solo datos de esta guía', async () => {
  const { dom, window, document } = await setup({ hash: '#reto-9' });
  assert.equal(window.location.hash, '#m04-validacion');
  assert.equal(document.querySelector('#reto-9 > details').open, true);
  assert.equal(document.activeElement, document.querySelector('#reto-9 summary'));
  const menu = document.querySelector('.menu-toggle');
  menu.click();
  assert.equal(menu.getAttribute('aria-expanded'), 'true');
  document.getElementById('menu-scrim').click();
  assert.equal(menu.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, menu);
  menu.click();
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(document.body.classList.contains('menu-open'), false);
  document.querySelector('.skip-link').click();
  assert.equal(document.activeElement.id, 'contenido');

  const search = document.querySelector('#course-nav input');
  search.value = 'nombre que no corresponde a ningún módulo';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(document.querySelector('.nav-empty').hidden, false);
  search.value = '';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(document.querySelector('.nav-empty').hidden, true);

  window.guiaDevBrainApp.navigation.showPage('m01-fundamentos');
  const link = document.createElement('a');
  link.href = '#m01-fundamentos';
  document.querySelector('[data-db-evidence-dossier]').append(link);
  link.click();
  assert.equal(document.querySelector('#m01-fundamentos [aria-selected="true"]').dataset.tab, 'documenta');
  assert.equal(document.getElementById('resume-learning').hash, '#m01-fundamentos');
  window.location.hash = '#contenido';
  await tick(window);
  assert.equal(window.location.hash, '#m01-fundamentos');
  const field = document.querySelector('#m01-fundamentos [data-db-evidence] textarea');
  field.value = 'Revisión de la fuente y del dato pendiente.';
  field.dispatchEvent(new window.Event('input', { bubbles: true }));
  field.dispatchEvent(new window.Event('change', { bubbles: true }));
  await tick(window);
  assert.match(document.getElementById('home-evidence-status').textContent, /1 en borrador/u);

  window.localStorage.setItem('sena_bogota_ia_administrativos_21720210_prueba', 'se elimina');
  window.localStorage.setItem('guia_refactor_sena_prueba', 'se elimina');
  window.localStorage.setItem('otra_guia', 'se conserva');
  window.confirm = () => false;
  document.getElementById('clear-local-data').click();
  assert.equal(window.localStorage.getItem('sena_bogota_ia_administrativos_21720210_prueba'), 'se elimina');
  window.confirm = () => true;
  document.getElementById('clear-local-data').click();
  assert.equal(window.localStorage.getItem('sena_bogota_ia_administrativos_21720210_prueba'), null);
  assert.equal(window.localStorage.getItem('guia_refactor_sena_prueba'), null);
  assert.equal(window.localStorage.getItem('otra_guia'), 'se conserva');
  dom.window.close();
});

test('los errores de navegación y evidencias dejan mensajes y contenido consultable', async () => {
  const navigation = await setup({ navigationFailure: true });
  assert.equal(navigation.document.body.classList.contains('navigation-ready'), false);
  assert.ok([...navigation.document.querySelectorAll('.module-page')].every(page => page.style.display === 'block'));
  assert.ok(navigation.errors.some(message => message.includes('No fue posible iniciar la navegación')));
  assert.equal(navigation.document.querySelectorAll('[data-db-evidence-mounted="true"]').length, 8);
  navigation.dom.window.close();

  const evidence = await setup({ evidenceFailure: true });
  assert.equal(evidence.document.body.classList.contains('navigation-ready'), true);
  assert.match(evidence.document.getElementById('devbrain-status').textContent, /No fue posible cargar las evidencias.*Conserva tu trabajo/u);
  assert.ok(evidence.errors.some(message => message.includes('No fue posible montar las evidencias')));
  evidence.window.guiaDevBrainApp.navigation.showPage('m02-diseno');
  assert.equal(evidence.document.getElementById('m02-diseno').style.display, 'block');
  evidence.dom.window.close();
});

test('las pestañas mantienen foco, guardan la fase y ofrecen selección si falla el portapapeles', async () => {
  const { dom, window, document } = await setup({ hash: '#m02-diseno' });
  const first = document.querySelector('#m02-diseno [data-tab="aprende"]');
  document.querySelector('#m02-diseno [data-tab="observa"]').click();
  assert.equal(document.querySelector('#m02-diseno [aria-selected="true"]').dataset.tab, 'observa');
  first.click();
  assert.equal(document.querySelector('#m02-diseno [aria-selected="true"]').dataset.tab, 'aprende');
  for (const [key, expected] of [['End', 'documenta'], ['Home', 'aprende'], ['ArrowRight', 'observa'], ['ArrowLeft', 'documenta']]) {
    first.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true }));
    assert.equal(document.querySelector('#m02-diseno [aria-selected="true"]').dataset.tab, expected);
    assert.equal(document.activeElement.dataset.tab, expected);
  }
  const next = document.querySelector('#m02-diseno [data-next-phase="resuelve"]');
  next.click();
  assert.equal(document.querySelector('#m02-diseno [aria-selected="true"]').dataset.tab, 'resuelve');
  assert.equal(window.guiaDevBrainApp.storage.get('tabs_m02-diseno'), 'resuelve');

  const timers = [];
  const originalTimeout = window.setTimeout.bind(window);
  window.setTimeout = (callback, duration, ...args) => duration === 4500 ? (timers.push(callback), 0) : originalTimeout(callback, duration, ...args);
  const copied = [];
  Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: async text => copied.push(text) } });
  const button = document.querySelector('[data-copy]');
  button.click();
  await tick(window);
  assert.equal(copied[0], document.getElementById(button.dataset.copy).textContent.trim());
  assert.match(document.getElementById('course-notice').textContent, /Encargo copiado/u);
  timers.pop()();
  assert.equal(document.getElementById('course-notice').hidden, true);

  window.navigator.clipboard.writeText = async () => { throw new Error('Portapapeles indisponible para la prueba.'); };
  button.click();
  await tick(window);
  assert.equal(window.getSelection().toString().trim(), document.getElementById(button.dataset.copy).textContent.trim());
  assert.match(document.getElementById('course-notice').textContent, /Ctrl\+C/u);
  window.CourseTabs.show('m02-diseno', 'aprende', true);
  assert.equal(document.activeElement, first);
  dom.window.close();
});

test('los diálogos muestran la imagen o el recurso solicitado y devuelven el foco al cierre', async () => {
  const { dom, window, document } = await setup();
  const diagram = document.createElement('button');
  diagram.dataset.openDiagram = ''; diagram.dataset.image = 'media/productividad-ciclo.svg'; diagram.dataset.alt = 'Ciclo de comprobación'; document.body.append(diagram);
  for (const [selector, id] of [['[data-open-glossary]', 'glossary-dialog'], ['[data-open-templates]', 'templates-dialog'], ['[data-open-diagram]', 'course-dialog']]) {
    const trigger = document.querySelector(selector);
    const dialog = document.getElementById(id);
    trigger.click();
    assert.equal(dialog.hasAttribute('open'), true, id);
    assert.equal(document.activeElement, dialog.querySelector('[data-dialog-close]'));
    if (id === 'course-dialog') {
      assert.equal(dialog.querySelector('img').getAttribute('src'), trigger.dataset.image);
      assert.equal(dialog.querySelector('img').alt, trigger.dataset.alt);
      assert.match(dialog.querySelector('#course-dialog-title').textContent, /Mapa visual/u);
    }
    dialog.querySelector('[data-dialog-close]').click();
    assert.equal(dialog.hasAttribute('open'), false);
    assert.equal(document.activeElement, trigger);
    trigger.click();
    dialog.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(dialog.hasAttribute('open'), false);
    assert.equal(document.activeElement, trigger);
  }
  dom.window.close();
});

test('el menú lateral se puede alternar y cerrar con el botón de cierre, el fondo y Escape', async () => {
  const { dom, window, document } = await setup();
  const menuButton = document.querySelector('.menu-toggle');
  const menuCloseButton = document.querySelector('.sidebar-close');
  const menuScrim = document.getElementById('menu-scrim');

  menuButton.click();
  assert.equal(document.body.classList.contains('menu-open'), true);
  menuCloseButton.click();
  assert.equal(document.body.classList.contains('menu-open'), false);

  menuButton.click();
  assert.equal(document.body.classList.contains('menu-open'), true);
  menuScrim.click();
  assert.equal(document.body.classList.contains('menu-open'), false);

  menuButton.click();
  assert.equal(document.body.classList.contains('menu-open'), true);
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(document.body.classList.contains('menu-open'), false);

  document.querySelector('.skip-link').click();
  dom.window.close();
});
