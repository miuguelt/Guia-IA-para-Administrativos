/* Selector de situaciones: contenido generado desde el catálogo y comportamiento en el navegador. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const selector = require('../js/office-situations-selector.js');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const catalog = JSON.parse(read('content/office-situations.json')).situations;
const office = catalog.filter(item => item.category !== 'aprendizaje-continuo');
const learning = catalog.filter(item => item.category === 'aprendizaje-continuo');

function homeDom() {
  const dom = new JSDOM(read('content/home.html'), { url: 'http://aula.test/' });
  dom.window.HTMLElement.prototype.scrollIntoView = function (options) { this.scrolledWith = options; };
  return dom;
}

test('el catálogo separa ocho situaciones de oficina y cuatro formas de aprender con IA', () => {
  assert.equal(catalog.length, 12);
  assert.deepEqual(office.map(item => item.id), ['comites-evaluacion', 'novedades-plataformas', 'cuentas-cobro', 'pqrs-urgentes', 'actas-reunion', 'limpieza-excel', 'comunicaciones-oficiales', 'diseno-procedimientos']);
  assert.deepEqual(learning.map(item => item.id), ['explicaciones-medida', 'preguntas-comprobacion', 'practica-deliberada', 'rutas-paso-a-paso']);
  const titles = new Set(Object.values(JSON.parse(read('content/ai-task-briefs.json'))).map(brief => brief.title.replace(' ✦', '')));
  titles.add('Preparación · Crea tu primer informe con IA');
  for (const item of catalog) {
    if (item.practiceRelation === 'ninguna') continue;
    assert.ok(titles.has(item.challengeName), `${item.id}: el reto enlazado no existe con ese título (${item.challengeName})`);
  }
  const text = JSON.stringify(catalog);
  assert.doesNotMatch(text, /Blindaje|Escudo|Regla de oro|1 clic|Copilot|Gemini|a nivel nacional|tutela|funcionario|Roleplay|HITL|PC-01|directivos|archivos reales|base real/u);
});

test('la portada publica el selector generado sin emojis ni rótulos engañosos', () => {
  const dom = homeDom();
  const doc = dom.window.document;
  const section = doc.getElementById('situaciones-oficina');
  const cards = [...section.querySelectorAll('[data-situation-id]')];
  assert.deepEqual(cards.map(card => card.dataset.situationId), office.map(item => item.id));
  for (const card of cards) {
    assert.equal(card.tagName, 'BUTTON');
    assert.ok(doc.getElementById(card.getAttribute('aria-controls')), card.dataset.situationId);
    assert.equal(card.querySelector('svg').getAttribute('aria-hidden'), 'true');
  }
  const filters = [...section.querySelectorAll('[data-situation-filter]')].map(button => [button.dataset.situationFilter, button.querySelector('.filter-count').textContent]);
  assert.deepEqual(filters, [['todas', '8'], ['sede-coordinacion', '4'], ['gestion-documental', '4']]);
  assert.equal(section.querySelectorAll('[role="tab"], [role="tablist"]').length, 0);
  assert.doesNotMatch(section.textContent, /Ver solución|Blindaje|Escudo|1 clic|\p{Extended_Pictographic}/u);
  for (const button of section.querySelectorAll('[data-copy]')) assert.ok(doc.getElementById(button.dataset.copy), button.dataset.copy);
  const learningCards = doc.querySelectorAll('#aprender-con-ia .learning-ai-card');
  assert.equal(learningCards.length, 4);
  assert.match(doc.getElementById('aprender-rutas-paso-a-paso').textContent, /Reto 6/u);
  assert.equal(doc.querySelector('#aprender-rutas-paso-a-paso .detail-practice'), null, 'Sin reto relacionado no se muestra enlace');
  dom.window.close();
});

test('el manual del portafolio reúne las doce fichas y descarga el mismo contenido en Markdown', () => {
  const dom = new JSDOM(read('content/portfolio.html'));
  const doc = dom.window.document;
  const manual = doc.getElementById('manual-situaciones-oficina');
  assert.equal(manual.querySelectorAll('.manual-item-card').length, 12);
  assert.deepEqual([...manual.querySelectorAll('.manual-group > h3')].map(node => node.textContent), ['Situaciones de oficina', 'Aprender con IA']);
  const download = manual.querySelector('a[download="manual-situaciones-oficina.md"]');
  const markdown = decodeURIComponent(download.getAttribute('href').replace('data:text/markdown;charset=utf-8,', ''));
  assert.equal((markdown.match(/^### /gmu) || []).length, 12);
  assert.match(markdown, /Instrucción para copiar/u);
  assert.ok(manual.querySelector('#btn-print-manual'));
  dom.window.close();
});

test('al iniciar se ve una ficha y elegir otra actualiza estado, rótulos y anuncio sin rehacer la lista', () => {
  const dom = homeDom();
  const doc = dom.window.document;
  assert.equal(selector.init(doc), true);
  const container = doc.querySelector('[data-office-selector]');
  assert.ok(container.classList.contains('is-enhanced'));
  assert.deepEqual([...container.querySelectorAll('[data-situation-detail]')].filter(panel => !panel.hidden).map(panel => panel.dataset.situationDetail), ['comites-evaluacion']);
  const target = container.querySelector('[data-situation-id="limpieza-excel"]');
  target.focus();
  target.click();
  assert.equal(doc.activeElement === target || doc.activeElement.id === 'detail-title-limpieza-excel', true);
  assert.equal(target.getAttribute('aria-pressed'), 'true');
  assert.equal(target.querySelector('.picker-card-action').textContent, 'Ficha abierta');
  assert.equal(container.querySelector('[data-situation-id="comites-evaluacion"] .picker-card-action').textContent, 'Ver ficha');
  assert.equal(doc.getElementById('situation-detail-limpieza-excel').hidden, false);
  assert.equal(doc.getElementById('situation-detail-comites-evaluacion').hidden, true);
  assert.equal(container.querySelector('[data-situation-announcer]').textContent, 'Mostrando: Normalizar tablas en Excel');
  assert.equal(container.querySelector('[data-situation-id="limpieza-excel"]'), target, 'La tarjeta sigue siendo el mismo nodo');
  assert.equal(selector.select(container, 'no-existe'), false);
  dom.window.close();
});

test('en una columna la ficha se lleva a la vista, recibe el foco y respeta el movimiento reducido', () => {
  const dom = homeDom();
  const { document: doc } = dom.window;
  selector.init(doc);
  const container = doc.querySelector('[data-office-selector]');
  const panel = doc.getElementById('situation-detail-actas-reunion');
  panel.getBoundingClientRect = () => ({ top: 2400 });
  container.querySelector('[data-situation-id="actas-reunion"]').click();
  assert.deepEqual(panel.scrolledWith, { block: 'start', behavior: 'smooth' });
  assert.equal(doc.activeElement, doc.getElementById('detail-title-actas-reunion'));
  panel.getBoundingClientRect = () => ({ top: 120 });
  panel.scrolledWith = null;
  assert.equal(selector.reveal(container, 'actas-reunion', dom.window), false, 'Con la ficha a la vista no se desplaza');
  assert.equal(panel.scrolledWith, null);
  panel.getBoundingClientRect = () => ({ top: -300 });
  const reduced = { innerHeight: 800, matchMedia: query => ({ matches: query.includes('reduce') }) };
  assert.equal(selector.reveal(container, 'actas-reunion', reduced), true);
  assert.equal(panel.scrolledWith.behavior, 'auto');
  dom.window.close();
});

test('los filtros ocultan las otras categorías y mantienen visible una ficha de la lista', () => {
  const dom = homeDom();
  const doc = dom.window.document;
  selector.init(doc);
  const container = doc.querySelector('[data-office-selector]');
  const visibleIds = () => [...container.querySelectorAll('[data-situation-category]')].filter(item => !item.hidden).map(item => item.querySelector('[data-situation-id]').dataset.situationId);
  container.querySelector('[data-situation-filter="gestion-documental"]').click();
  assert.deepEqual(visibleIds(), ['actas-reunion', 'limpieza-excel', 'comunicaciones-oficiales', 'diseno-procedimientos']);
  assert.equal(container.querySelector('[data-situation-filter="gestion-documental"]').getAttribute('aria-pressed'), 'true');
  assert.equal(container.querySelector('[data-situation-filter="todas"]').getAttribute('aria-pressed'), 'false');
  assert.equal(container.querySelector('[data-situation-id][aria-pressed="true"]').dataset.situationId, 'actas-reunion');
  assert.equal(doc.getElementById('situation-detail-actas-reunion').hidden, false);
  assert.equal(container.querySelector('[data-situation-announcer]').textContent, '4 situaciones en la lista. Mostrando: Redactar actas de reunión');
  container.querySelector('[data-situation-id="comunicaciones-oficiales"]').click();
  assert.equal(selector.filter(container, 'todas'), 8);
  assert.equal(container.querySelector('[data-situation-id][aria-pressed="true"]').dataset.situationId, 'comunicaciones-oficiales', 'Volver a todas conserva la ficha elegida');
  dom.window.close();
});

test('imprimir el manual cambia la vista de impresión y la restaura al terminar', () => {
  const dom = new JSDOM(read('content/portfolio.html'));
  const { window } = dom;
  let printed = 0;
  window.print = () => { printed += 1; };
  assert.equal(selector.init(window.document), false, 'Sin selector en la página solo se conecta la impresión');
  window.document.body.dataset.printView = 'portafolio';
  window.document.getElementById('btn-print-manual').click();
  assert.equal(printed, 1);
  assert.equal(window.document.body.dataset.printView, 'manual-situaciones');
  window.dispatchEvent(new window.Event('afterprint'));
  assert.equal(window.document.body.dataset.printView, 'portafolio');
  delete window.document.body.dataset.printView;
  selector.printManual(window.document, window);
  window.dispatchEvent(new window.Event('afterprint'));
  assert.equal('printView' in window.document.body.dataset, false);
  const css = read('css/course-responsive.css');
  assert.match(css, /body\[data-print-view="manual-situaciones"\] #manual-situaciones-oficina/u);
  dom.window.close();
});

test('el módulo se registra en el navegador y se inicia solo', () => {
  assert.equal(selector.init(null), false);
  const dom = new JSDOM(read('content/home.html'), { runScripts: 'outside-only' });
  new vm.Script(read('js/office-situations-selector.js'), { filename: path.join(root, 'js/office-situations-selector.js') }).runInContext(dom.getInternalVMContext());
  assert.equal(typeof dom.window.OfficeSituationsSelector.select, 'function');
  assert.ok(dom.window.document.querySelector('[data-office-selector]').classList.contains('is-enhanced'));
  dom.window.close();
});
