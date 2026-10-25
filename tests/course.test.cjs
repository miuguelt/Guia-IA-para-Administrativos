/* Integración del DOM y SDK local; no sustituye una revisión visual en navegador. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { labelEvidenceFields } = require('../js/evidence-accessibility.js');
const calendarPrint = require('../js/calendar-print.js');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const tick = window => new Promise(resolve => window.setTimeout(resolve, 50));

test('la navegación ofrece recursos agrupados y un cierre visible del menú móvil', () => {
  const dom = new JSDOM(read('content/shell.html'));
  const document = dom.window.document;
  const resources = document.querySelector('details.resources-menu');
  assert.ok(resources, 'Los recursos deben quedar agrupados en un desplegable');
  assert.ok(resources.querySelector('summary').textContent.includes('Recursos'));
  assert.equal(resources.querySelectorAll('.resource-item').length, 4);
  assert.ok(document.querySelector('.sidebar-close[aria-label="Cerrar menú"]'));
  const css = read('css/course-responsive.css');
  assert.match(css, /body\.navigation-ready\.menu-open \.course-sidebar[^}]*visibility:\s*visible/isu);
  assert.match(css, /\.course-sidebar[^}]*transition:\s*transform[^;]*visibility/isu);
  assert.match(css, /body\.navigation-ready \.sidebar-close\s*\{\s*display:\s*inline-grid/isu);
  assert.match(css, /\.resources-menu\s*\{[^}]*order:\s*2/isu);
  assert.match(css, /\.course-progress-container\s*\{[^}]*order:\s*3[^}]*flex:\s*1 1 100%[^}]*margin-left:\s*0/isu);
  assert.match(css, /\.topbar-location\s*\{[^}]*flex:\s*1 1 150px/isu);
  dom.window.close();
});

test('la preparación delega un mismo informe a la IA y conserva un testigo verificable sin transcribir datos', () => {
  const dom = new JSDOM(read('content/preparation.html'));
  const page = dom.window.document.querySelector('#preparacion');
  assert.match(page.querySelector('.page-intro').textContent, /IA/iu);
  assert.match(page.querySelector('.page-intro').textContent, /informe.*Bienestar/iu);
  assert.match(page.querySelector('[data-panel="archivos"]').textContent, /bienestar\.csv/u);
  const published = new JSDOM(read('index.html'));
  const sharedMaterials = published.window.document.querySelector('.challenge-shared-materials');
  assert.ok(sharedMaterials.querySelector('a[download][href="materiales/ia/recursos-compartidos.zip"]'));
  assert.match(sharedMaterials.textContent, /bienestar\.csv/u);
  published.window.close();
  assert.match(page.querySelector('[data-panel="archivos"]').textContent, /bienestar\.csv.*paquete común/iu);
  for (const panel of page.querySelectorAll('[data-panel]:not([data-panel="archivos"])')) {
    const copy = panel.querySelector('[data-copy]');
    assert.ok(copy, `${panel.dataset.panel}: falta una instrucción copiable para delegar la tarea`);
    assert.ok(page.querySelector(`[id="${copy.dataset.copy}"]`));
  }
  const prompt = page.querySelector('#preparation-prompt').textContent;
  assert.match(prompt, /Centro A.*840.*42/su);
  assert.match(prompt, /no consta/iu);
  assert.match(prompt, /cero/iu);
  assert.match(prompt, /no.*causas/iu);
  const review = page.querySelector('[data-panel="hoja"]');
  assert.match(review.textContent, /testigo/iu);
  assert.match(review.querySelector('.calculation-proof').textContent, /42\s*÷\s*840\s*×\s*100\s*=\s*5\s*%/u);
  assert.equal(review.querySelectorAll('input, textarea').length, 0);
  assert.match(review.textContent, /84.*10\s*%/su);
  assert.match(review.textContent, /cero.*pendiente/su);
  assert.doesNotMatch(page.textContent, /escribe los encabezados|Selecciona D2|Inserta una tabla|crea una hoja/iu);
  assert.match(page.querySelector('[data-panel="documento"]').textContent, /mismo chat/iu);
  assert.match(page.querySelector('[data-panel="diseno"]').textContent, /opcional/iu);
  assert.match(page.textContent, /preparación.*generación.*revisión.*corrección/isu);
  dom.window.close();
});

test('los retos delegan el procesamiento y los paquetes conservan esa consigna', () => {
  const dom = new JSDOM(read('index.html'));
  for (const id of ['reto-4', 'reto-5', 'reto-6', 'reto-8', 'reto-7', 'reto-integrador']) {
    const card = dom.window.document.getElementById(id);
    assert.match(card.querySelector('.tool-route').textContent, /(?:adj[uú]nt|entr[eé]g|usa).*(?:chat autorizado|Antigravity)/isu, `${id}: la ruta debe entregar la fuente a una herramienta autorizada`);
    assert.ok(card.querySelector('[data-ai-task]'), `${id}: falta una instrucción concreta`);
    assert.match(card.querySelector('[data-ai-task]').textContent, /fuente|original|minuto|fila/iu);
    assert.equal(card.querySelectorAll('[data-ai-review-checks] > li').length, 3, `${id}: faltan los tres controles de revisión`);
    const prompt = card.querySelector('[data-ai-task]');
    assert.ok(prompt.closest('details:not([open])'), `${id}: el encargo completo debe poder consultarse sin saturar el recorrido`);
    assert.ok(card.querySelector(`[data-copy="${prompt.id}"]`), `${id}: el encargo completo debe poder copiarse`);
  }
  assert.doesNotMatch(dom.window.document.querySelector('#m03-implementacion').textContent, /escribe en G5|copia hacia abajo|reproducir la fórmula/iu);
  dom.window.close();
});

test('la preparación conecta cinco prácticas en una hora y publica la fuente editable', () => {
  const source = new JSDOM(read('content/preparation.html')
    .replace('{{PREPARATION_LEARN}}', read('content/productivity/preparacion.html'))
    .replace(/\{\{PREPARATION_(?:OBSERVE|SOLVE)\}\}/gu, ''));
  const published = new JSDOM(read('index.html'));
  const page = source.window.document.querySelector('#preparacion');
  const comparable = published.window.document.querySelector('#preparacion');
  for (const panel of page.querySelectorAll('.tool-lesson[data-panel]')) {
    const publishedPanel = comparable.querySelector(`.tool-lesson[data-panel="${panel.dataset.panel}"]`).cloneNode(true);
    publishedPanel.querySelectorAll('.knowledge-review, .practice-route').forEach(section => section.remove());
    assert.equal(publishedPanel.outerHTML.replace(/>\s+</gu, '><'), panel.outerHTML.replace(/>\s+</gu, '><'), panel.dataset.panel);
  }
  const tools = [...page.querySelectorAll('[data-tab]')];
  assert.deepEqual(tools.map(tool => tool.dataset.tab), ['archivos', 'chat', 'hoja', 'documento', 'diseno']);
  assert.equal(tools.reduce((minutes, tool) => minutes + Number(tool.querySelector('small').textContent.match(/(\d+) min/u)[1]), 0), 60);
  assert.equal(page.querySelectorAll('[data-panel]').length, 5);
  assert.deepEqual([...page.querySelectorAll('[data-next-tool]')].map(button => button.dataset.nextTool), ['chat', 'hoja', 'documento', 'diseno']);
  assert.ok(page.querySelector('[data-panel="diseno"] a[href="#m01-fundamentos"]'));
  assert.equal(page.querySelector('[data-copy="preparation-prompt"]').dataset.copy, page.querySelector('#preparation-prompt').id);
  const chat = page.querySelector('[data-panel="chat"]');
  assert.ok(chat.querySelector('[data-writing-example]'), 'Falta la práctica de edición de una respuesta');
  assert.match(chat.querySelector('[data-writing-example]').textContent, /42.*840.*5\s*%/su);
  assert.match(chat.querySelector('[data-writing-example]').textContent, /periodo no consta/iu);
  assert.match(chat.querySelector('.check-note').textContent, /IA entrega el cálculo y el resumen/iu);
  assert.match(page.querySelector('[data-panel="documento"] .paper-demo').textContent, /¿A qué periodo/iu);
  assert.match(page.querySelector('[data-panel="documento"] .check-note').textContent, /propuesta queda pendiente de aprobación/iu);
  assert.match(page.querySelector('.slide-demo').textContent, /periodo no consta/iu);
  assert.match(page.querySelector('[data-panel="hoja"] .check-note').textContent, /84.*10\s*%/u);
  const figures = read('materiales/retos/bienestar.csv').split(/\r?\n/u).find(row => row.startsWith('Centro A;')).split(';');
  assert.equal(Number(figures[2]) / Number(figures[1]) * 100, 5);
  assert.match(page.querySelector('.slide-metric').textContent, /5\s*%.*42.*840/su);
  for (const link of page.querySelectorAll('a[download]')) assert.ok(fs.existsSync(path.join(root, link.getAttribute('href'))));
  source.window.close();
  published.window.close();
});

test('el módulo 01 enseña a diagnosticar, mide una referencia y conserva sus ocho horas', () => {
  const dom = new JSDOM(read('index.html'));
  const page = dom.window.document.querySelector('#m01-fundamentos');
  const learn = page.querySelector('[data-panel="aprende"]');
  const observe = page.querySelector('[data-panel="observa"]');
  const solve = page.querySelector('[data-panel="resuelve"]');
  const diagnosis = solve.querySelector('[data-diagnosis]');
  assert.ok(diagnosis, 'Falta una ruta concreta para diagnosticar la tarea');
  assert.match(diagnosis.textContent, /unidad de trabajo/iu);
  assert.match(diagnosis.textContent, /incluye la revisión/iu);
  assert.match(diagnosis.textContent, /pendiente/iu);
  const baseline = observe.querySelector('[data-baseline-example]');
  assert.ok(baseline, 'Falta un ejemplo de línea base');
  const minutes = [...baseline.querySelectorAll('[data-measured-minutes]')].map(row => Number(row.dataset.measuredMinutes));
  assert.deepEqual(minutes, [6, 8, 7]);
  assert.equal(minutes.reduce((sum, value) => sum + value, 0) / minutes.length, 7);
  assert.match(baseline.textContent, /7 min por solicitud/iu);
  assert.match(baseline.textContent, /no demuestra un ahorro/iu);
  assert.equal(learn.querySelector('[data-baseline-example]'), null, 'El ejemplo resuelto debe aparecer en Observa');
  const review = solve.querySelector('[data-module-review]');
  assert.ok(review);
  const challengeMinutes = [...solve.querySelectorAll('.challenge-summary-meta')].map(meta => Number(meta.textContent.match(/(\d+) min/u)[1]));
  assert.deepEqual(challengeMinutes, [75, 165]);
  for (const [selector, expected] of [['#reto-0', 75], ['#reto-1', 165], ['[data-diagnosis]', 135]]) {
    const block = page.querySelector(selector);
    const timedSteps = block.matches('[data-diagnosis]') ? 'ol > li' : '[data-challenge-stage="2"] details ol > li';
    const steps = [...block.querySelectorAll(timedSteps)].map(step => Number(step.textContent.match(/(\d+) min/u)[1]));
    assert.equal(steps.reduce((sum, value) => sum + value, 0), expected, `La ruta de ${selector} debe caber en su tiempo`);
  }
  assert.equal(Number(learn.querySelector('.learning-timing').dataset.minutes) + Number(diagnosis.dataset.minutes) + Number(review.dataset.minutes) + challengeMinutes.reduce((sum, value) => sum + value, 0), 480);
  const lineamiento = read('materiales/retos/lineamiento-ficticio.csv');
  const sections = lineamiento.split(/\r?\n/u).slice(4).filter(Boolean).map(row => row.split(';')[0]);
  assert.equal(sections.length, 8);
  const urgentRows = observe.querySelectorAll('[data-urgent-example] tbody tr');
  assert.equal(urgentRows.length, 5);
  for (const row of urgentRows) {
    assert.ok(sections.includes(row.cells[2].textContent.trim()), 'El ejemplo debe citar apartados existentes');
  }
  assert.match(observe.querySelector('[data-urgent-example]').textContent, /no define excepciones/iu);
  assert.match(page.querySelector('#reto-0').textContent, /A y D/iu);
  assert.match(page.querySelector('#reto-0 [data-ai-task]').textContent, /Para B genera dos versiones.*sin identificadores/iu);
  assert.match(page.querySelector('#reto-1 [data-ai-task]').textContent, /Contexto, Rol, Tarea y Tono.*fuente, límites, formato y criterio/u);
  assert.match(page.querySelector('#reto-1 [data-ai-task]').textContent, /Genera una tabla.*ocho apartados/isu);
  assert.ok(page.querySelector('[data-panel="documenta"] [data-db-evidence="MG-A01"]'));
  dom.window.close();
});

async function setup(hash = '#inicio', saved = {}) {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  console.on('error', (...args) => errors.push(args.join(' ')));
  const dom = new JSDOM(read('index.html'), {
    url: 'http://curso.test/' + hash, runScripts: 'outside-only', virtualConsole: console
  });
  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLMediaElement.prototype.pause = () => {};
  Object.entries(saved).forEach(([key, value]) => window.localStorage.setItem(key, value));
  for (const script of ['js/vendor/devbrain-learner-sdk.js', 'js/registro-entregables.js', 'js/course-tabs.js', 'js/course-dialog.js', 'js/course-tools.js', 'js/simulators.js', 'js/portafolio.js', 'js/evidence-accessibility.js', 'js/calendar-print.js', 'js/case-practices-model.js', 'js/case-practices-store.js', 'js/case-practices-view.js', 'js/case-practices.js', 'js/course-app.js']) window.eval(read(script));
  await tick(window);
  return { dom, window, document: window.document, errors };
}

test('la ayuda común abre su apartado y permite regresar al reto sin perder el paso', async () => {
  const { dom, window, document, errors } = await setup('#reto-4');
  const page = document.getElementById('m03-implementacion');
  assert.equal(page.hidden, false);
  const selected = page.querySelector('[data-tab][aria-selected="true"]').dataset.tab;
  window.location.hash = '#metodo-comun';
  await tick(window);
  assert.equal(window.location.hash, '#preparacion');
  assert.equal(document.getElementById('preparacion').hidden, false);
  assert.equal(document.activeElement.id, 'metodo-comun-title');
  window.location.hash = '#reto-4';
  await tick(window);
  assert.equal(page.hidden, false);
  assert.equal(page.querySelector('[data-tab][aria-selected="true"]').dataset.tab, selected);
  assert.deepEqual(errors, []);
  dom.window.close();
});

test('el menú móvil abre en la búsqueda y se cierra con el botón visible o Escape', async () => {
  const { dom, document } = await setup();
  const toggle = document.querySelector('.menu-toggle');
  const close = document.querySelector('.sidebar-close');
  const search = document.querySelector('#course-nav input');
  const scrim = document.getElementById('menu-scrim');

  toggle.click();
  assert.equal(document.body.classList.contains('menu-open'), true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(scrim.hidden, false);
  assert.equal(document.activeElement, search);

  close.click();
  assert.equal(document.body.classList.contains('menu-open'), false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(scrim.hidden, true);
  assert.equal(document.activeElement, toggle);

  toggle.click();
  scrim.click();
  assert.equal(document.body.classList.contains('menu-open'), false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(scrim.hidden, true);
  assert.equal(document.activeElement, toggle);

  toggle.click();
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(document.body.classList.contains('menu-open'), false);
  assert.equal(document.activeElement, toggle);
  dom.window.close();
});

test('el menú de recursos se cierra al elegir una opción', async () => {
  const { dom, document } = await setup();
  const resources = document.querySelector('.resources-menu');
  resources.querySelector('summary').click();
  assert.equal(resources.open, true);
  document.querySelector('[data-open-templates]').click();
  assert.equal(resources.open, false);
  dom.window.close();
});

test('las doce decisiones publicadas dan retroalimentación y permiten repetirlas en el recorrido real', async () => {
  const { dom, window, document, errors } = await setup('#m02-diseno');
  document.querySelector('#m02-diseno [data-tab="observa"]').click();
  assert.equal(document.querySelector('#m02-diseno [data-panel="observa"]').hidden, false);
  const checks = [...document.querySelectorAll('[data-knowledge-check]')];
  assert.equal(checks.length, 12);
  for (const form of checks) {
    const wrong = form.querySelector('input[data-correct="false"]');
    wrong.click();
    form.querySelector('[data-check-submit]').click();
    assert.equal(form.dataset.state, 'review');
    assert.ok(form.querySelector('[data-check-feedback]').textContent.includes(wrong.dataset.feedback));
    const correct = form.querySelector('input[data-correct="true"]');
    correct.click();
    form.querySelector('[data-check-submit]').click();
    assert.equal(form.dataset.state, 'correct');
    assert.ok(form.querySelector('[data-check-feedback]').textContent.includes(correct.dataset.feedback));
    form.querySelector('[type="reset"]').click();
    assert.equal(form.querySelector(':checked'), null);
  }
  assert.equal(document.querySelectorAll('[data-db-evidence]').length, 8);
  assert.ok(document.querySelector('#m02-diseno [data-next-phase="resuelve"]'));
  assert.deepEqual(errors, []);
  dom.window.close();
});

test('el recorrido nuevo avanza y copia las instrucciones completas con su contexto', async () => {
  const { dom, window, document, errors } = await setup('#preparacion');
  const copied = [];
  Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: async value => copied.push(value) } });
  for (const key of ['archivos', 'chat', 'hoja', 'documento']) {
    const panel = document.querySelector(`#preparacion [data-panel="${key}"]`);
    assert.equal(panel.hidden, false);
    const next = panel.querySelector('[data-next-tool]');
    next.click();
    assert.equal(document.querySelector('#preparacion [aria-selected="true"]').dataset.tab, next.dataset.nextTool);
  }
  const preparationButtons = [...document.querySelectorAll('#preparacion [data-copy]')];
  const taskButtons = [...document.querySelectorAll('.challenge-card [data-ai-task]')].map(prompt => {
    const button = prompt.closest('.challenge-card').querySelector(`[data-copy="${prompt.id}"]`);
    assert.ok(button, `${prompt.id}: falta copiar el encargo completo`);
    return button;
  });
  assert.equal(taskButtons.length, 11);
  assert.ok(preparationButtons.some(button => button.dataset.copy === 'preparation-report-prompt'));
  const buttons = [...preparationButtons, ...taskButtons];
  assert.ok([...buttons].some(button => button.dataset.copy === 'ai-task-reto-9-chat'));
  for (const button of buttons) {
    button.click();
    await tick(window);
    assert.equal(copied.at(-1), document.getElementById(button.dataset.copy).textContent.trim());
  }
  assert.equal(copied.length, buttons.length);
  assert.deepEqual(errors, []);
  dom.window.close();
});

test('al abrir: una vista, seis módulos y siete formularios con los complementos', async () => {
  const { dom, document, errors } = await setup();
  assert.deepEqual(errors, []);
  assert.equal(document.querySelectorAll('[data-learning-module]').length, 6);
  assert.equal([...document.querySelectorAll('.module-page')].filter(p => p.style.display !== 'none').length, 1);
  assert.equal(document.querySelectorAll('[data-db-evidence-mounted="true"]').length, 8);
  assert.ok(document.querySelector('[data-db-evidence-dossier] .dbe-dossier'));
  assert.match(document.getElementById('home-evidence-status').textContent, /0 de 5 evidencias curriculares/);
  assert.match(document.getElementById('home-evidence-status').textContent, /EcoBogotá \(complementaria\): pendiente/);
  assert.equal(document.querySelector('[aria-current="page"]').hash, '#inicio');
  dom.window.close();
});

test('al avanzar: las flechas cambian la pestaña y Retomar refleja la última lección', async () => {
  const { dom, window, document } = await setup();
  window.guiaDevBrainApp.navigation.showPage('m02-diseno');
  await tick(window);
  const first = document.querySelector('#m02-diseno [data-tab="aprende"]');
  first.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(document.querySelector('#m02-diseno [aria-selected="true"]').dataset.tab, 'observa');
  assert.equal(document.activeElement.dataset.tab, 'observa');
  assert.equal(document.querySelector('#m02-diseno [data-panel="observa"]').hidden, false);
  window.guiaDevBrainApp.navigation.showPage('inicio');
  await tick(window);
  assert.equal(document.getElementById('resume-learning').hash, '#m02-diseno');
  dom.window.close();
});

test('desde un reto o una URL inválida: nunca deja el contenido vacío', async () => {
  const deep = await setup('#reto-9');
  assert.equal(deep.window.location.hash, '#m04-validacion');
  assert.equal(deep.document.querySelector('#m04-validacion [aria-selected="true"]').dataset.tab, 'resuelve');
  assert.ok(deep.document.querySelector('#reto-9 > details').open);
  deep.dom.window.close();
  const invalid = await setup('#no-existe');
  assert.equal(invalid.window.location.hash, '#inicio');
  assert.equal(invalid.document.getElementById('inicio').style.display, 'block');
  invalid.dom.window.close();
});

test('desde el portafolio: el enlace dinámico abre Documenta', async () => {
  const { dom, window, document } = await setup('#portafolio');
  const link = document.querySelector('[data-db-evidence-dossier] a[href="#m01-fundamentos"]');
  assert.ok(link, 'El SDK debe ofrecer el enlace a la evidencia pendiente');
  link.click();
  await tick(window);
  assert.equal(window.location.hash, '#m01-fundamentos');
  assert.equal(document.querySelector('#m01-fundamentos [aria-selected="true"]').dataset.tab, 'documenta');
  dom.window.close();
});

test('al escribir y volver a abrir: restaura el borrador sin perder el campo', async () => {
  const first = await setup('#m01-fundamentos');
  const field = first.document.querySelector('[data-db-evidence="MG-A01"] textarea');
  field.value = 'Prueba sintética de conservación del borrador.';
  field.dispatchEvent(new first.window.Event('input', { bubbles: true }));
  field.dispatchEvent(new first.window.Event('change', { bubbles: true }));
  await tick(first.window);
  const saved = Object.fromEntries(Object.keys(first.window.localStorage).map(k => [k, first.window.localStorage.getItem(k)]));
  assert.equal(first.document.querySelector('[data-db-evidence="MG-A01"]').dataset.dbEvidenceStatus, 'borrador');
  first.dom.window.close();
  const next = await setup('#m01-fundamentos', saved);
  assert.equal(next.document.querySelector('[data-db-evidence="MG-A01"] textarea').value, 'Prueba sintética de conservación del borrador.');
  assert.match(next.document.getElementById('home-evidence-status').textContent, /1 en borrador/);
  next.dom.window.close();
});

test('abrir la ayuda de Documenta conserva las respuestas y no completa las evidencias', async () => {
  const { dom, window, document, errors } = await setup('#m01-fundamentos');
  document.querySelector('#m01-fundamentos [data-tab="documenta"]').click();
  const container = document.querySelector('[data-db-evidence="MG-A01"]');
  const fields = [...container.querySelectorAll('.dbe-formulario input, .dbe-formulario textarea')];
  assert.ok(fields.length > 3);
  assert.ok(fields.every(field => field.value === ''));
  fields[0].value = 'Mi resultado contrastado con el apartado fuente.';
  fields[0].dispatchEvent(new window.Event('input', { bubbles: true }));
  const before = fields.map(field => field.value);
  for (const guide of document.querySelectorAll('[data-evidence-writing-guide]')) {
    guide.querySelector('summary').click();
    assert.equal(guide.open, true);
  }
  await tick(window);
  assert.deepEqual(fields.map(field => field.value), before);
  assert.notEqual(container.dataset.dbEvidenceStatus, 'lista');
  assert.ok([...document.querySelectorAll('[data-db-evidence]:not([data-db-evidence="MG-A01"]) .dbe-formulario textarea')].every(field => field.value === ''));
  assert.deepEqual(errors, []);
  dom.window.close();
});

test('el botón de eliminación borra las evidencias y las prácticas de esta guía', async () => {
  const saved = {
    sena_bogota_ia_administrativos_21720210_perfil: 'perfil ficticio',
    sena_bogota_ia_administrativos_21720210_sdk_case_practice_m01: JSON.stringify({ version: 1 }),
    guia_refactor_sena_ecobogota_v1: JSON.stringify({ version: 1 }),
    otra_guia: 'se conserva'
  };
  const { dom, window, document } = await setup('#portafolio', saved);
  window.confirm = () => true;
  document.getElementById('clear-local-data').click();
  assert.equal(window.localStorage.getItem('sena_bogota_ia_administrativos_21720210_perfil'), null);
  assert.equal(window.localStorage.getItem('sena_bogota_ia_administrativos_21720210_sdk_case_practice_m01'), null);
  assert.equal([...Object.keys(window.localStorage)].some(key => key.includes('case_practice_')), false);
  assert.equal(window.localStorage.getItem('guia_refactor_sena_ecobogota_v1'), null);
  assert.equal(window.localStorage.getItem('otra_guia'), 'se conserva');
  dom.window.close();
});

test('EcoBogotá ofrece ECO-A02 y consulta el avance anterior sin sobrescribirlo', async () => {
  const {dom,window,document} = await setup('#ecobogota');
  const legacy = {version:1,started:true,prediction:2,answers:{},explanation:'Registro anterior del aprendiz.'};
  window.localStorage.setItem(window.EcoBogotaSimulator.STORAGE_KEY,JSON.stringify(legacy));
  window.EcoPortfolio.init({document,simulator:window.EcoBogotaSimulator});
  assert.equal(document.querySelector('[data-db-evidence="ECO-A02"]').dataset.dbEvidenceMounted,'true');
  assert.equal(document.querySelector('[data-db-evidence="ECO-A01"]').closest('[data-ai-storage]').hidden,true);
  assert.equal(document.querySelector('[data-ai-delivery="ECO-A01"]'),null);
  assert.equal(document.querySelector('[data-db-evidence="ECO-A02"]').dataset.dbEvidenceStatus,'pendiente');
  assert.equal(window.localStorage.getItem(window.EcoBogotaSimulator.STORAGE_KEY),JSON.stringify(legacy));
  assert.match(document.getElementById('eco-portfolio-explanation').textContent,/Registro anterior/);
  assert.ok(document.querySelector('#eco-legacy-records'));
  assert.equal(document.querySelector('#eco-prediction'),null);
  dom.window.close();
});

test('registro publicado y duración: coinciden con el curso de 40 horas', async () => {
  const { dom, window } = await setup();
  const registry = JSON.parse(read('deliverables.registry.json'));
  const manifest = JSON.parse(read('guide.manifest.json'));
  assert.deepEqual(JSON.parse(JSON.stringify(window.DevBrainRegistroEntregables)), registry);
  assert.equal(registry.artifacts.reduce((sum, a) => sum + a.station.minutes, manifest.platform.preparation.minutes), 2160);
  assert.equal(manifest.duration.hours, 40);
  assert.equal(manifest.duration.directHours, 36);
  assert.equal(manifest.duration.autonomousHours, 4);
  assert.equal(manifest.duration.directHours + manifest.duration.autonomousHours, 40);
  const allIds = [...window.document.querySelectorAll('[id]')].map(element => element.id);
  assert.equal(new Set(allIds).size, allIds.length, 'Los identificadores deben ser únicos');
  for (const link of window.document.querySelectorAll('a[href^="#"]')) assert.ok(window.document.getElementById(link.hash.slice(1)), link.hash);
  dom.window.close();
});

test('la aplicación presenta las 40 horas de la cohorte y distingue la duración oficial publicada', () => {
  const manifest = JSON.parse(read('guide.manifest.json'));
  const registry = JSON.parse(read('deliverables.registry.json'));
  const activeText = [
    manifest.guide.summary,
    manifest.duration.recommendedTotalHours,
    manifest.duration.breakdownStatus,
    manifest.sources.find(source => /Betowa/i.test(source.title))?.use,
    registry.sourceStatus,
    read('content/home.html'),
    read('content/calendar.html'),
    read('docs/evidencias-template.md')
  ].filter(Boolean).join('\n');

  assert.equal(manifest.duration.hours, 40);
  assert.equal(manifest.duration.directHours + manifest.duration.autonomousHours, 40);
  assert.match(manifest.guide.summary, /cohorte tiene una duración propuesta de 40 horas: 36 directas y 4 autónomas/i);
  assert.match(manifest.duration.recommendedTotalHours, /esta cohorte: 40 horas/i);
  assert.match(activeText, /duración.{0,35}48 horas/i);
  assert.doesNotMatch(activeText, /máxim[oa].{0,35}48 horas/i);
  assert.match(read('content/home.html'), /cohorte.{0,35}40 horas/i);
  assert.match(read('content/calendar.html'), /Total de esta cohorte/i);
  assert.match(read('docs/evidencias-template.md'), /Duración propuesta para esta cohorte:.*40 horas.*36 directas.*4 autónomas/i);
});

test('los cinco módulos ofrecen prácticas con fuentes, ayudas y avance independiente de las evidencias', async () => {
  const { dom, document, window, errors } = await setup('#m03-implementacion');
  assert.equal(document.querySelectorAll('video').length, 0);
  assert.equal(window.guiaDevBrainApp.simulators.get('case-practice'), window.CasePractices.Simulator);
  for (const panel of document.querySelectorAll('[data-simulator="case-practice"]')) {
    assert.ok(panel.classList.contains('case-ready'));
    assert.equal(panel.querySelectorAll('[data-case-stage]').length, 4);
    assert.equal(panel.querySelectorAll('[data-case-stage]:not([hidden])').length, 1);
    assert.ok(panel.querySelector('[data-case-source] a[download]'));
    assert.equal(panel.querySelectorAll('[data-pqrs-transfer], [data-cleaner-transfer]').length, 0);
    panel.querySelector('[data-case-go="3"]').click();
    assert.equal(panel.querySelector('[data-case-stage="3"]').hidden, false);
  }
  assert.equal(document.getElementById('course-progress-bar').value, 0);
  assert.deepEqual(errors, []);
  dom.window.close();
});

test('el taller de instrucciones compone una instrucción verificable a partir de sus campos', async () => {
  const { dom, window, document } = await setup('#m02-diseno');
  const context = document.getElementById('prompt-context');
  const task = document.getElementById('prompt-task');
  const source = document.getElementById('prompt-source');
  assert.ok(context && task && source, 'Falta la herramienta breve de instrucciones con su fuente');
  context.value = 'PQRS ficticia PC-01';
  task.value = 'Separar hechos y datos que faltan';
  source.value = 'Caso ficticio: el enlace del calendario abre una sesión vieja.';
  context.dispatchEvent(new window.Event('input', { bubbles: true }));
  task.dispatchEvent(new window.Event('input', { bubbles: true }));
  source.dispatchEvent(new window.Event('input', { bubbles: true }));
  const prompt = document.getElementById('prompt-preview').textContent;
  assert.match(prompt, /PQRS ficticia PC-01/);
  assert.match(prompt, /Separar hechos y datos que faltan/);
  assert.match(prompt, /fuente/);
  assert.match(prompt, /no consta/i);
  assert.match(prompt, /el enlace del calendario abre una sesión vieja/u);
  dom.window.close();
});

test('la mini calculadora resuelve 42 de 840 y detiene un denominador cero', async () => {
  const { dom, window, document } = await setup('#m04-validacion');
  const numerator = document.getElementById('ratio-numerator');
  const denominator = document.getElementById('ratio-denominator');
  assert.ok(numerator && denominator, 'Falta la calculadora de tasas');
  assert.match(document.getElementById('ratio-result').textContent, /5\s?%/);
  denominator.value = '0';
  denominator.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.match(document.getElementById('ratio-status').textContent, /mayor que cero/i);
  assert.equal(document.getElementById('ratio-result').textContent.trim(), '—');
  dom.window.close();
});

test('reto de limpieza usa las filas reales del libro y muestra duración antes de abrirlo', async () => {
  const { dom, document } = await setup('#m03-implementacion');
  const card = document.getElementById('reto-6');
  assert.match(card.textContent, /SIM-0002[^\n]{0,50}fila 6|SIM-0002/);
  assert.match(card.textContent, /SIM-0003/);
  assert.match(card.textContent, /E5|E6|E7/);
  const summary = card.querySelector('details summary');
  assert.match(summary.textContent, /120 min/);
  assert.match(summary.textContent, /MG-A03/);
  dom.window.close();
});

test('el recorrido aclara el plan adaptado de 40 h frente al programa listado en 48 h', async () => {
  const { dom, document } = await setup();
  const context = [...document.querySelectorAll('#inicio .course-context')].find(section => /Ficha técnica del programa/u.test(section.textContent));
  assert.ok(context, 'La referencia curricular debe seguir disponible en el contexto del curso');
  assert.equal(context.open, false);
  assert.match(context.textContent, /plan.{0,30}40 horas/i);
  assert.match(context.textContent, /programa.{0,80}48 horas/i);
  assert.match(context.textContent, /no equival|no sustitu|adaptación/i);
  dom.window.close();
});

test('el nuevo flujo, los ejemplos y los tiempos son parte del cronograma y del portafolio', async () => {
  const { dom, document } = await setup('#m03-implementacion');
  const module = document.getElementById('m03-implementacion');
  const challenge = document.getElementById('reto-7');
  assert.ok(challenge, 'El Reto 7 debe aparecer en el módulo de flujos');
  assert.match(challenge.textContent, /tres casos de prueba/i);
  assert.match(challenge.querySelector('.tool-route').textContent, /IA genera el diagrama y simula los tres casos/iu);
  assert.match(challenge.textContent, /no conecta cuentas ni despliega una automatización/iu);
  assert.equal(challenge.querySelectorAll('[data-ai-review-checks] > li').length, 3);
  assert.ok(challenge.querySelector('.flow-visual'));
  assert.match(challenge.querySelector('details summary').textContent, /60 min/);
  assert.match(document.querySelector('#calendario').textContent, /Reto 7/);
  assert.match(document.querySelector('#calendario').textContent, /30 \+ 120 \+ 60 \+ 240 \+ 45 \+ 30 \+ 15 = 540/);
  assert.equal(document.querySelectorAll('.challenge-card').length, 11, 'Diez retos breves y el reto integrador');
  assert.ok(document.querySelector('#m01-fundamentos .learning-timing'));
  assert.ok(document.querySelector('#m02-diseno .learning-timing'));
  assert.ok(document.querySelector('#m03-implementacion .learning-timing'));
  assert.ok(document.querySelector('#m04-validacion .learning-timing'));
  assert.match(document.querySelector('#m04-validacion').dataset.navMeta, /3 h 30/);
  assert.match(document.querySelector('#m05-cierre').dataset.navMeta, /5 h 30/);
  assert.ok(document.querySelectorAll('a[download][href$=".csv"]').length >= 11);
  dom.window.close();
});

test('cada reto presenta y permite descargar los archivos que necesita', async () => {
  const { dom, document } = await setup('#m01-fundamentos');
  assert.match(document.querySelector('#m01-fundamentos [data-panel="resuelve"] .panel-heading').textContent, /Aprende.*Observa.*explicaciones y los ejemplos/i);
  const expectedChallenges = [
    'reto-0', 'reto-1', 'reto-2', 'reto-3', 'reto-4', 'reto-5',
    'reto-6', 'reto-7', 'reto-8', 'reto-9', 'reto-integrador'
  ];
  const expectedMaterials = {
    'reto-0': [],
    'reto-1': [],
    'reto-2': [],
    'reto-3': [],
    'reto-4': [],
    'reto-5': [],
    'reto-6': [],
    'reto-7': [],
    'reto-8': [],
    'reto-9': [],
    'reto-integrador': []
  };
  assert.deepEqual([...document.querySelectorAll('.challenge-card')].map(card => card.id), expectedChallenges);
  for (const id of expectedChallenges) {
    const card = document.getElementById(id);
    const materials = card.querySelector('.challenge-materials');
    assert.ok(materials, `${id}: debe indicar sus archivos de trabajo`);
    assert.equal(materials.closest('[data-challenge-stage]').dataset.challengeStage, '0', `${id}: los materiales deben estar en el primer paso`);
    assert.equal(card.querySelectorAll('[data-challenge-stage]').length, 4, `${id}: preparar, encargar, revisar y guardar`);
    assert.match(materials.textContent, /archivos para resolver este reto/iu);
    assert.match(materials.textContent, /paquete.*IA/i);
    const packageDownload = card.querySelector('a.ai-kit-primary[download][href$=".zip"]');
    assert.ok(packageDownload, `${id}: debe ofrecer un paquete para IA`);
    assert.match(packageDownload.textContent, /descargar.*paquete/i);
    const downloads = materials.querySelectorAll('a.challenge-file-download[download]');
    assert.deepEqual([...downloads].map(link => link.getAttribute('href')), expectedMaterials[id], `${id}: debe enlazar solo sus fuentes propias`);
    for (const link of downloads) {
      const relative = link.getAttribute('href').replaceAll('/', path.sep);
      const file = path.join(root, relative);
      assert.ok(fs.existsSync(file), `${id}: no existe ${link.getAttribute('href')}`);
      assert.ok(fs.statSync(file).size > 0, `${id}: el archivo está vacío`);
      assert.match(link.textContent, new RegExp(link.getAttribute('download').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      assert.equal(link.closest('.challenge-material-item').querySelector('code').textContent, link.getAttribute('download'), `${id}: debe identificar cada archivo`);
    }
    const packagePath = path.join(root, packageDownload.getAttribute('href').replaceAll('/', path.sep));
    assert.ok(fs.existsSync(packagePath), `${id}: no existe el paquete completo`);
    assert.ok(fs.statSync(packagePath).size > 0, `${id}: el paquete está vacío`);
  }
  assert.equal(document.querySelectorAll('a[href="materiales/ia/recursos-compartidos.zip"][download]').length, 1);
  const lineamiento = fs.readFileSync(path.join(root, 'materiales/retos/lineamiento-ficticio.csv'), 'utf8');
  assert.match(lineamiento, /La ficha no pide datos personales/iu);
  const pqrs = fs.readFileSync(path.join(root, 'materiales/retos/pqrs-complejas.csv'), 'utf8');
  assert.match(pqrs, /PC-01;Acceso y horario/iu);
  assert.match(pqrs, /PC-03;Cancelación/iu);
  const correos = fs.readFileSync(path.join(root, 'materiales/retos/correos-50.csv'), 'utf8');
  assert.match(correos, /C-050/iu);
  const casosIndividuales = fs.readFileSync(path.join(root, 'materiales/retos/casos-individuales.csv'), 'utf8');
  assert.match(casosIndividuales, /IND-08/iu);
  const variantes = {
    'reto-02-variante-juridica.csv': [/VJ-01;Jurídica/u, /VJ-02;Jurídica/u, /plazo.*por confirmar con el área jurídica/iu],
    'reto-04-variante-talento-humano.csv': [/TH-01;Talento humano/u, /TH-05;Talento humano/u, /no la cargues al chat/iu, /cuenta bancaria/iu],
    'reto-05-variante-retencion-documental.csv': [/RD-01;Actas/u, /no es la tabla de retención documental del SENA/iu],
    'reto-06-variante-inventario-documental.csv': [/ID-01;/u, /ID-08;/u, /ID-03;Contratos;[^\r\n]*;;/u],
    'reto-09-variante-cita-inexistente.csv': [/A5;/u, /apartado 12/iu, /ocho apartados/iu]
  };
  for (const [nombre, patrones] of Object.entries(variantes)) {
    const contenido = fs.readFileSync(path.join(root, 'materiales/retos', nombre), 'utf8');
    assert.match(contenido, /ficticio|ficticia|didáctica|de práctica/iu, `${nombre}: debe identificar su material de práctica`);
    assert.match(contenido, /Variante opcional/iu, `${nombre}: debe declararse opcional`);
    assert.match(contenido, /sin tiempo adicional/iu, `${nombre}: no debe ampliar el horario`);
    for (const patron of patrones) assert.match(contenido, patron, `${nombre}: falta ${patron}`);
  }
  const reto2 = document.getElementById('reto-2').querySelector('[data-ai-task-key]').textContent;
  assert.match(reto2, /Variante por área/iu);
  const dockerfile = read('Dockerfile');
  assert.match(dockerfile, /FROM python:[^\n]+ AS course-builder/iu);
  assert.match(dockerfile, /build-challenge-materials\.py[\s\S]*build-ai-task-kits\.py[\s\S]*build-course\.py[\s\S]*build-styled-documents\.py --format-downloads[\s\S]*build-analysis-materials\.py/iu);
  assert.match(dockerfile, /COPY --from=course-builder[\s\S]*materiales\/retos[\s\S]*\/usr\/share\/nginx\/html\/materiales\/retos/iu);
  const dockerignore = read('.dockerignore');
  assert.match(dockerignore, /!docs\//u);
  assert.match(dockerignore, /!docs\/\*\*/u);
  assert.match(dockerignore, /!materiales\/ia\/\*\*\/\*\.md/u);
  dom.window.close();
});

test('el Reto 0 identifica el dato de salud como sensible y coincide con su archivo', async () => {
  const { dom, document } = await setup('#m01-fundamentos');
  const challenge = document.getElementById('reto-0');
  const cards = fs.readFileSync(path.join(root, 'materiales/retos/reto-00-tarjetas-semaforo.csv'), 'utf8');
  assert.match(challenge.querySelector('.tool-route').textContent, /identificación, salud o credenciales no se adjuntan/iu);
  assert.match(challenge.querySelector('[data-ai-task]').textContent, /C:.*información de salud que no se carga/iu);
  assert.match(challenge.querySelector('[data-ai-review-checks]').textContent, /C y E no se cargan/iu);
  assert.doesNotMatch(challenge.textContent, /reporte real de salud/i);
  assert.match(cards, /<DATO_DE_SALUD_FICTICIO>/u);
  dom.window.close();
});

test('los archivos de práctica no repiten la aclaración en cada registro', () => {
  const contracts = read('materiales/retos/contratos.csv').replace(/^\uFEFF/u, '');
  const contractRows = contracts.trimEnd().split(/\r?\n/u);
  assert.match(contractRows[0], /^Datos de práctica para el reto integrador/u);
  assert.doesNotMatch(contracts, /hackathon/iu);
  assert.match(contractRows[3], /^Código;Centro;Tipo de proceso;Fecha/u);
  assert.doesNotMatch(contractRows.slice(4).join('\n'), /Registro ficticio de práctica/u);

  const messages = read('materiales/retos/correos-50.csv').replace(/^\uFEFF/u, '');
  assert.match(messages.split(/\r?\n/u)[0], /^Mensajes de práctica para priorización/u);
  assert.doesNotMatch(messages, /Coordinación ficticia|plazo simulado|Referencia simulada|No responder con nombres ni datos de personas/u);
  assert.equal(messages.trimEnd().split(/\r?\n/u).length, 54);
});

test('los enlaces locales del curso apuntan a archivos publicados', async () => {
  const { dom, document } = await setup();
  const missing = [];
  for (const link of document.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href');
    if (!href || /^(?:[a-z]+:|\/\/|#)/iu.test(href)) continue;
    const localPath = href.split(/[?#]/u, 1)[0];
    if (localPath && !fs.existsSync(path.join(root, localPath))) missing.push(href);
  }
  assert.deepEqual(missing, [], `Enlaces locales sin archivo: ${missing.join(', ')}`);
  dom.window.close();
});

test('el libro maestro está incluido en la imagen web que publica sus enlaces', () => {
  const workbook = 'docs/Documentos/Materiales_practica_IA_SENA_Bogota.xlsx';
  assert.ok(fs.existsSync(path.join(root, workbook)), 'Debe existir el libro maestro enlazado');
  assert.match(read('Dockerfile'), /COPY --from=course-builder \/workspace\/docs\/ \/usr\/share\/nginx\/html\/docs\//u);
});

test('el cronograma se puede imprimir sin ofrecer un PDF inexistente', async () => {
  const { dom, window, document } = await setup('#calendario');
  const printButton = document.getElementById('print-calendar');
  assert.ok(printButton, 'Debe haber una acción visible para imprimir o guardar el cronograma');
  assert.equal(document.body.dataset.printView, 'calendario');
  assert.doesNotMatch(read('content/calendar.html'), /output\/pdf\/cronograma-formativo-40h\.pdf/u);
  assert.match(read('css/course-responsive.css'), /body\[data-print-view="calendario"\][^{]*\{[^}]*display:\s*none\s*!important/su);
  let printed = false;
  window.print = () => { printed = true; };
  printButton.click();
  assert.equal(printed, true);
  dom.window.close();
});

test('el portafolio contiene el desbordamiento horizontal y deja consultarlo con teclado', async () => {
  const { dom, document } = await setup('#portafolio');
  const dossier = document.querySelector('[data-db-evidence-dossier]');
  const css = read('css/course-responsive.css');
  assert.equal(dossier.getAttribute('role'), 'region');
  assert.equal(dossier.getAttribute('tabindex'), '0');
  assert.match(dossier.getAttribute('aria-label'), /desplazamiento horizontal/i);
  assert.match(css, /\[data-db-evidence-dossier\][^{]*\{[^}]*overflow-x:\s*auto/su);
  assert.match(css, /\.dbe-chequeo__item input\[type="checkbox"\][^{]*\{[^}]*min-height:\s*42px/su);
  dom.window.close();
});

test('los campos para registrar el uso de IA tienen nombre accesible', async () => {
  const { dom, document } = await setup('#portafolio');
  const fields = [...document.querySelectorAll('[data-db-evidence] .dbe-ia input[placeholder]')];
  assert.ok(fields.length > 0, 'El portafolio debe cargar los campos de registro de uso de IA');
  for (const field of fields) {
    assert.equal(field.getAttribute('aria-label'), field.getAttribute('placeholder'), `${field.id}: debe anunciar el propósito del campo`);
  }
  dom.window.close();
});

test('la mejora de etiquetas conserva nombres ya definidos y completa los que faltan', () => {
  const dom = new JSDOM('<div data-db-evidence><label for="visible">Nombre visible</label><input id="visible" placeholder="Nombre visible"><input id="plain" placeholder="Nombre por completar"><input id="aria" aria-label="Nombre accesible" placeholder="Ayuda"><span id="labelledby-name">Nombre vinculado</span><input id="labelledby" aria-labelledby="labelledby-name" placeholder="Ayuda"></div><input id="outside" placeholder="Fuera de evidencia">');
  const { document } = dom.window;
  assert.equal(labelEvidenceFields(document), 1);
  assert.equal(document.getElementById('visible').getAttribute('aria-label'), null);
  assert.equal(document.getElementById('plain').getAttribute('aria-label'), 'Nombre por completar');
  assert.equal(document.getElementById('aria').getAttribute('aria-label'), 'Nombre accesible');
  assert.equal(document.getElementById('labelledby').getAttribute('aria-label'), null);
  assert.equal(document.getElementById('outside').getAttribute('aria-label'), null);
  dom.window.close();
});

test('la impresión prepara la vista del calendario y llama a la ventana del navegador', () => {
  const dom = new JSDOM('<button id="print-calendar" type="button">Imprimir</button>');
  const { document } = dom.window;
  let printed = false;
  calendarPrint.setPrintView(document.body, 'calendario');
  calendarPrint.bindPrintAction(document, { print: () => { printed = true; } });
  document.getElementById('print-calendar').click();
  assert.equal(document.body.dataset.printView, 'calendario');
  assert.equal(printed, true);
  dom.window.close();
});

test('la aplicación declara un favicon vectorial local', () => {
  assert.match(read('content/shell.html'), /rel="icon"[^>]*href="media\/aula-ia\.svg"/u);
  assert.ok(fs.statSync(path.join(root, 'media/aula-ia.svg')).size > 0);
});
