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

async function setup(hash = '#inicio', extra = []) {
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(read('index.html'), { url: 'http://navegacion.test/' + hash, runScripts: 'outside-only', virtualConsole });
  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  const files = [...scripts.slice(0, -1), ...extra, scripts.at(-1)];
  for (const file of files) new vm.Script(read(file), { filename: path.join(root, file) }).runInContext(dom.getInternalVMContext());
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
  window.location.hash = '#preparacion';
  await tick(window);
  document.querySelector('#preparacion [data-tab="chat"]').click();
  assert.equal(step.textContent, 'Pide el análisis', 'El paso se nombra sin su duración');
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
  const dates = [...meta.querySelectorAll('[data-mode-only="aula"]')].find(node => /Fechas/u.test(node.textContent));
  assert.ok(dates);
  assert.equal(dates.hidden, true);
  dom.window.close();
});

test('por mi cuenta, la cabecera del módulo no muestra horas, códigos curriculares ni jornadas', async () => {
  const { dom, window, document } = await setup('#m01-fundamentos');
  const visibleText = node => {
    const clone = node.cloneNode(true);
    clone.querySelectorAll('[hidden]').forEach(hidden => hidden.remove());
    return clone.textContent.replace(/\s+/gu, ' ');
  };
  for (const [ident, count] of [['m01-fundamentos', '2 retos'], ['m03-implementacion', '4 retos'], ['m05-cierre', '1 reto']]) {
    window.CourseMode.apply(document, 'autonomo');
    const header = document.querySelector(`#${ident} .lesson-header`);
    const text = visibleText(header);
    assert.doesNotMatch(text, /formación directa|RA\d|MG-A0|MARTES|JUEVES|VIERNES/u, `${ident}: ${text}`);
    assert.ok(text.includes(`${count} · a tu ritmo`), `${ident}: ${text}`);
    assert.match(text, /Evidencia \d · /u);
    window.CourseMode.apply(document, 'aula');
    const classroom = visibleText(header);
    assert.match(classroom, /de formación directa/u);
    assert.match(classroom, /RA\d/u);
    assert.match(classroom, /MG-A0\d/u);
  }
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

test('Mi avance, Modo y Recursos se abren de a uno y se cierran con Escape o al hacer clic fuera', async () => {
  const { dom, window, document } = await setup('#inicio', ['js/course-progress.js']);
  const resources = document.querySelector('.resources-menu');
  const mode = document.querySelector('.study-mode-switch');
  const progressToggle = document.getElementById('progress-checklist-toggle');
  const dropdown = document.getElementById('progress-checklist-dropdown');
  const toggled = menu => new Promise(resolve => menu.addEventListener('toggle', resolve, { once: true }));
  let opened = toggled(resources);
  resources.open = true;
  await opened;
  opened = toggled(mode);
  mode.open = true;
  await opened;
  assert.equal(resources.open, false, 'Abrir Modo cierra Recursos');
  progressToggle.click();
  assert.equal(dropdown.hidden, false);
  assert.equal(mode.open, false, 'Abrir Mi avance cierra Modo');
  opened = toggled(resources);
  resources.open = true;
  await opened;
  assert.equal(dropdown.hidden, true, 'Abrir Recursos cierra Mi avance');
  assert.equal(progressToggle.getAttribute('aria-expanded'), 'false');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(resources.open, false);
  assert.equal(document.activeElement, resources.querySelector('summary'), 'Escape devuelve el foco al menú que estaba abierto');
  progressToggle.click();
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(dropdown.hidden, true);
  assert.equal(document.activeElement, progressToggle);
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(document.activeElement, progressToggle, 'Sin menús abiertos, Escape no mueve el foco');
  mode.open = true;
  document.querySelector('#inicio h1').click();
  assert.equal(mode.open, false, 'Un clic fuera cierra el menú');
  progressToggle.click();
  dropdown.click();
  assert.equal(dropdown.hidden, false, 'Un clic dentro del panel lo mantiene abierto');
  dom.window.close();
});

test('las barras internas se fijan bajo la altura real de la barra superior', async () => {
  const { dom, window, document } = await setup('#m02-diseno');
  const topbar = document.querySelector('.course-topbar');
  const style = document.createElement('style');
  style.textContent = '.course-topbar { position: sticky; }';
  document.head.append(style);
  Object.defineProperty(topbar, 'offsetHeight', { configurable: true, get: () => 142 });
  window.dispatchEvent(new window.Event('resize'));
  assert.equal(document.documentElement.style.getPropertyValue('--topbar-h'), '142px');
  style.textContent = '.course-topbar { position: static; }';
  window.dispatchEvent(new window.Event('resize'));
  assert.equal(document.documentElement.style.getPropertyValue('--topbar-h'), '0px', 'Una barra que no se fija no desplaza las demás');
  const css = read('css/guided-experience.css') + read('css/tokens.css');
  assert.match(css, /--topbar-h:\s*\d+px/u);
  assert.match(css, /\.lesson-tabs\s*\{[^}]*top:\s*var\(--topbar-h\)/u);
  assert.match(css, /\.module-explanation > \.productivity-lesson\s*\{[^}]*position:\s*sticky/u);
  dom.window.close();
});

test('Retomar conserva la flecha como decoración', async () => {
  const { dom, window, document } = await setup('#m03-implementacion');
  window.guiaDevBrainApp.navigation.showPage('inicio');
  await tick(window);
  const resume = document.getElementById('resume-learning');
  assert.equal(resume.hash, '#m03-implementacion');
  assert.match(resume.textContent, /^Retomar: Resuelve tareas de tu área/u);
  assert.equal(resume.querySelector('[aria-hidden="true"]').textContent, '→');
  dom.window.close();
});

test('copiar una instrucción de situación usa el texto exacto y su propio mensaje', async () => {
  const { dom, window, document } = await setup('#inicio');
  const copied = [];
  Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: async value => copied.push(value) } });
  const button = document.querySelector('#situaciones-oficina [data-copy="prompt-pqrs-urgentes"]');
  button.click();
  await tick(window);
  assert.equal(copied[0], document.getElementById('prompt-pqrs-urgentes').textContent.trim());
  assert.match(document.getElementById('course-notice').textContent, /^Instrucción copiada/u);
  dom.window.close();
});

test('la prueba individual tiene su propio encargo después del trabajo en equipo', async () => {
  const { dom, document } = await setup('#m05-cierre');
  const individual = document.getElementById('prueba-individual');
  assert.ok(individual, 'Falta el bloque de la prueba individual');
  assert.equal(individual.closest('.challenge-card'), null, 'No se mezcla con el reto en equipo');
  assert.equal(individual.closest('[data-panel]').dataset.panel, 'resuelve');
  assert.ok(individual.querySelector('[data-ai-task-key="prueba-individual"] a[href="materiales/ia/prueba-individual.zip"][download]'));
  assert.match(individual.textContent, /45 min/iu);
  const team = document.querySelector('#reto-integrador [data-ai-task]').textContent;
  assert.doesNotMatch(team, /IND-01|casos-individuales/u);
  dom.window.close();
});

test('copiar el encargo de referencia une la instrucción visible con su formato para guardar', async () => {
  const { dom, window, document } = await setup('#m03-implementacion');
  const copied = [];
  Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: async value => copied.push(value) } });
  const markdown = read('materiales/ia/reto-4/ENCARGO-CHAT.md');
  const match = markdown.match(/## 1\. Encargo de referencia\n\n````text\n([\s\S]*?)\n````\n\n## 2\. Formato para guardar[^\n]*\n\n````text\n([\s\S]*?)\n````/u);
  assert.ok(match, 'El paquete separa la referencia y el formato para guardar');
  const button = document.querySelector('#reto-4 [data-copy="ai-task-reto-4-chat"][data-copy-append="ai-task-reto-4-chat-tecnico"]');
  button.click();
  await tick(window);
  assert.equal(copied[0], `${match[1]}\n\n${match[2]}`);
  assert.match(document.getElementById('course-notice').textContent, /^Encargo copiado con su formato para guardar/u);
  const broken = document.createElement('button');
  broken.dataset.copy = 'no-existe';
  broken.dataset.copyAppend = 'ai-task-reto-4-chat-tecnico';
  const parts = window.CourseTabs.copyParts(document, broken);
  assert.equal(parts.nodes.length, 0);
  assert.equal(parts.text, '');
  dom.window.close();
});

test('si el portapapeles falla, abre el formato para guardar y selecciona todo el encargo', async () => {
  const { dom, window, document } = await setup('#m03-implementacion');
  Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Bloqueado'); } } });
  const technical = document.getElementById('ai-task-reto-4-chat-tecnico');
  assert.equal(technical.closest('details').open, false);
  document.querySelector('#reto-4 [data-copy="ai-task-reto-4-chat"][data-copy-append]').click();
  await tick(window);
  assert.equal(technical.closest('details').open, true);
  assert.equal(document.getElementById('ai-task-reto-4-chat').closest('details').open, true);
  const selected = window.getSelection().toString();
  assert.match(selected, /Contexto: Adjunto correos-50\.csv/u);
  assert.match(selected, /Formato para guardar/u);
  assert.match(document.getElementById('course-notice').textContent, /Ctrl\+C/u);
  dom.window.close();
});
