const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const tick = window => new Promise(resolve => window.setTimeout(resolve, 35));
const scripts = ['js/vendor/devbrain-learner-sdk.js', 'js/registro-entregables.js', 'js/course-tabs.js', 'js/course-dialog.js', 'js/evidence-accessibility.js', 'js/calendar-print.js', 'js/course-mode.js', 'js/course-app.js'];

async function setup(hash = '#inicio') {
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(read('index.html'), { url: 'http://navegacion.test/' + hash, runScripts: 'outside-only', virtualConsole });
  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  for (const file of scripts) new vm.Script(read(file), { filename: path.join(root, file) }).runInContext(dom.getInternalVMContext());
  await tick(window);
  return { dom, window, document: window.document };
}

test('el menú separa la ruta, el seguimiento y los complementos opcionales', async () => {
  const { dom, document } = await setup();
  const items = [...document.querySelectorAll('#course-nav li')];
  const labels = items.filter(item => item.classList.contains('nav-group-label')).map(item => item.textContent.trim());
  assert.deepEqual(labels, ['Tu ruta', 'Seguimiento', 'Complementos opcionales']);
  const order = items.map(item => item.classList.contains('nav-group-label') ? item.textContent.trim() : item.querySelector('[data-module-link]').dataset.moduleLink);
  assert.deepEqual(order, ['Tu ruta', 'inicio', 'preparacion', 'm01-fundamentos', 'm02-diseno', 'm03-implementacion', 'm04-validacion', 'm05-cierre', 'Seguimiento', 'portafolio', 'calendario', 'Complementos opcionales', 'ecobogota', 'laboratorio-datos']);
  dom.window.close();
});

test('al filtrar el menú se ocultan los títulos de grupo y el aviso de vacío funciona', async () => {
  const { dom, window, document } = await setup();
  const search = document.querySelector('#course-nav input');
  search.value = 'zzzz';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.ok(document.getElementById('course-nav').classList.contains('is-filtering'));
  assert.equal(document.querySelector('.nav-empty').hidden, false);
  search.value = '';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(document.getElementById('course-nav').classList.contains('is-filtering'), false);
  dom.window.close();
});

test('la barra superior muestra el módulo y el paso abierto', async () => {
  const { dom, window, document } = await setup('#m02-diseno');
  const step = document.querySelector('[data-location-step]');
  assert.equal(document.getElementById('current-location').textContent, 'Diseña instrucciones claras');
  assert.equal(step.hidden, false);
  assert.equal(step.textContent, 'Aprende');
  document.querySelector('#m02-diseno [data-tab="resuelve"]').click();
  assert.equal(step.textContent, 'Resuelve');
  document.querySelector('#m01-fundamentos [data-tab="observa"]').click();
  assert.equal(step.textContent, 'Resuelve', 'Un módulo oculto no cambia la ubicación visible');
  window.location.hash = '#portafolio';
  await tick(window);
  assert.equal(step.hidden, true);
  dom.window.close();
});

test('cada paso después del primero permite volver al anterior', async () => {
  const { dom, document } = await setup('#m03-implementacion');
  const page = document.getElementById('m03-implementacion');
  const footers = [...page.querySelectorAll('.lesson-panel .phase-footer')];
  assert.equal(footers.length, 4);
  assert.equal(footers[0].querySelector('.phase-back'), null);
  const expected = ['aprende', 'observa', 'resuelve'];
  footers.slice(1).forEach((footer, index) => {
    const back = footer.querySelector('.phase-back');
    assert.ok(back, `Paso ${index + 2}`);
    assert.equal(back.dataset.nextPhase, expected[index]);
    assert.match(back.textContent, /Volver/u);
  });
  page.querySelector('[data-tab="resuelve"]').click();
  footers[2].querySelector('.phase-back').click();
  assert.equal(page.querySelector('[data-tab="observa"]').getAttribute('aria-selected'), 'true');
  dom.window.close();
});

test('la cabecera del módulo nombra la evidencia y solo muestra fechas en el curso con instructor', async () => {
  const { dom, document } = await setup('#m01-fundamentos');
  const meta = document.querySelector('#m01-fundamentos .lesson-meta');
  assert.match(meta.textContent, /Evidencia 1 · Diagnóstico, Semáforo de Datos y Prompt CRTT/u);
  const dates = meta.querySelector('[data-mode-only="aula"]');
  assert.ok(dates);
  assert.match(dates.textContent, /Fechas/u);
  assert.equal(dates.hidden, true);
  dom.window.close();
});

test('sin elemento de ubicación, cambiar de paso no falla', () => {
  const dom = new JSDOM('<section class="module-page" id="m01"><div data-tabs><div data-tablist><button data-tab="aprende"><b>1</b>Aprende</button><button data-tab="observa"><b>2</b>Observa</button></div><div data-panel="aprende"></div><div data-panel="observa"></div></div></section>', { runScripts: 'outside-only' });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  new vm.Script(read('js/course-tabs.js')).runInContext(dom.getInternalVMContext());
  dom.window.CourseTabs.init(null);
  dom.window.CourseTabs.locate('m01');
  dom.window.document.querySelector('[data-tab="observa"]').click();
  assert.equal(dom.window.document.querySelector('[data-tab="observa"]').getAttribute('aria-selected'), 'true');
  dom.window.close();
});

test('el menú lateral no se anima al cargar la página, solo al abrirlo después', async () => {
  const { dom, window, document } = await setup('#inicio');
  assert.ok(document.body.classList.contains('navigation-ready'));
  assert.ok(document.body.classList.contains('menu-animated'), 'La animación se habilita después del primer cuadro');
  const css = read('css/ux-refinements.css');
  assert.match(css, /body\.navigation-ready:not\(\.menu-animated\) \.course-sidebar\s*\{[^}]*transition:\s*none/su);
  dom.window.close();
});
