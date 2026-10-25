const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const source = () => fs.readFileSync('js/challenge-guide.js', 'utf8');
function fixture(storage = true) {
  const dom = new JSDOM(`<section class="module-page" id="m01-fundamentos"><button data-open-challenge="reto-0">Abrir reto</button><article id="reto-0"><details><summary>Reto</summary><div data-challenge-guide="reto-0"><nav>${[0,1,2,3].map(n => `<button data-stage-select="${n}">Paso ${n+1}</button>`).join('')}</nav><p data-stage-status role="status"></p>${[0,1,2,3].map(n=>`<section data-challenge-stage="${n}"><h4>Paso ${n+1}</h4></section>`).join('')}<button data-stage-previous>Anterior</button><button data-stage-next>Siguiente paso</button></div></details></article></section>`, {runScripts:'outside-only', url:'http://localhost/'});
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  const calls = [];
  dom.window.CourseTabs = { show: (...args) => calls.push(args) };
  if (!storage) Object.defineProperty(dom.window, 'sessionStorage', {get(){throw new Error('Sin almacenamiento');}});
  vm.runInContext(source(), dom.getInternalVMContext(), {filename:path.resolve('js/challenge-guide.js')});
  return {dom, document: dom.window.document, calls};
}

test('el reto avanza, retrocede y recuerda el paso sin marcar aprobación', () => {
  const {dom, document, calls} = fixture();
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  const root = document.querySelector('[data-challenge-guide]');
  assert.equal(root.querySelector('[data-stage-previous]').disabled, true);
  assert.equal(root.querySelectorAll('[data-challenge-stage]:not([hidden])').length, 1);
  assert.match(root.querySelector('[data-stage-status]').textContent, /Paso 1 de 4/);
  root.querySelector('[data-stage-next]').click();
  assert.equal(root.querySelector('[data-challenge-stage="1"]').hidden, false);
  assert.equal(dom.window.sessionStorage.getItem('aula-reto-paso:reto-0'), '1');
  root.querySelector('[data-stage-previous]').click();
  root.querySelector('[data-stage-select="3"]').click();
  assert.equal(root.querySelector('[data-stage-next]').disabled, true);
  assert.match(root.querySelector('[data-stage-status]').textContent, /Paso 4 de 4/);
  assert.equal(root.querySelector('[data-stage-select="3"]').getAttribute('aria-current'), 'step');
  assert.equal(root.querySelectorAll('[aria-current="step"]').length, 1);
  document.querySelector('[data-open-challenge]').click();
  assert.equal(document.querySelector('details').open, true);
  assert.deepEqual(calls[0], ['m01-fundamentos', 'resuelve', true]);
  dom.window.ChallengeGuide.init(document);
  assert.equal(root.querySelector('[data-challenge-stage="3"]').hidden, false);
  dom.window.close();
});

test('teclado, datos guardados inválidos y almacenamiento bloqueado conservan la ruta', () => {
  const {dom, document} = fixture(false);
  dom.window.ChallengeGuide.init(document);
  const first = document.querySelector('[data-stage-select="0"]');
  for (const [key, expected] of [['End',3],['ArrowLeft',2],['ArrowRight',3],['Home',0],['ArrowUp',0],['ArrowDown',1]]) {
    first.dispatchEvent(new dom.window.KeyboardEvent('keydown', {key, bubbles:true, cancelable:true}));
    assert.equal(document.querySelector(`[data-challenge-stage="${expected}"]`).hidden, false);
  }
  first.dispatchEvent(new dom.window.KeyboardEvent('keydown', {key:'x',bubbles:true}));
  document.querySelector('[data-stage-next]').click();
  assert.equal(document.querySelector('[data-challenge-stage="2"]').hidden, false);
  dom.window.CourseTabs = undefined;
  document.querySelector('[data-open-challenge]').click();
  const missing = document.createElement('button'); missing.dataset.openChallenge='ausente'; document.body.append(missing);
  dom.window.ChallengeGuide.init(document); missing.click();
  dom.window.close();
  for (const value of ['2','-1','invalido','99','1.5']) {
    const f = fixture();
    f.dom.window.sessionStorage.setItem('aula-reto-paso:reto-0', value);
    f.dom.window.ChallengeGuide.init(f.document);
    assert.equal(f.document.querySelector(`[data-challenge-stage="${value==='2'?'2':'0'}"]`).hidden, false);
    f.dom.window.close();
  }
});

test('la web conecta el mapa, los cuatro pasos y el formulario de evidencia del módulo', () => {
  const dom = new JSDOM(fs.readFileSync('index.html', 'utf8'), {runScripts:'outside-only', url:'http://localhost/'});
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  for (const file of ['js/course-tabs.js', 'js/course-tools.js', 'js/challenge-guide.js']) vm.runInContext(fs.readFileSync(file,'utf8'), dom.getInternalVMContext(), {filename:path.resolve(file)});
  dom.window.CourseTabs.init({get:()=>null,set:()=>{}});
  dom.window.ChallengeGuide.init(dom.window.document);
  dom.window.CourseTools.initEvidenceBridges(dom.window.document);
  const document = dom.window.document;
  for (const card of document.querySelectorAll('.challenge-card')) {
    const page = card.closest('.module-page');
    page.querySelector(`[data-open-challenge="${card.id}"]`).click();
    assert.equal(page.querySelector('[data-panel="resuelve"]').hidden,false);
    assert.equal(card.querySelector('details').open,true);
    assert.equal(page.querySelectorAll('.challenge-card > details[open]').length, 1, 'El mapa mantiene un solo reto abierto para concentrar la práctica.');
    assert.equal(document.activeElement,card.querySelector('summary'));
    const guide = card.querySelector('[data-challenge-guide]');
    for (let i=0;i<3;i++) guide.querySelector('[data-stage-next]').click();
    assert.equal(guide.querySelector('[data-challenge-stage="3"]').hidden,false);
    card.querySelector('.challenge-deliverable-bridge [data-open-evidence-field]').click();
    const panel = page.querySelector('[data-panel="documenta"]');
    assert.equal(panel.hidden,false);
    assert.ok(panel.querySelector('[data-db-evidence]'));
  }
  assert.equal(document.querySelectorAll('.lesson-visual').length,5);
  dom.window.close();
});

test('abrir un reto desde su título cierra los demás retos del módulo', () => {
  const dom = new JSDOM(`<section class="module-page" id="m03"><article class="challenge-card" id="reto-4"><details open><summary>Reto 4</summary><p>Cuerpo</p></details></article><article class="challenge-card" id="reto-5"><details><summary>Reto 5</summary><p>Cuerpo</p></details></article></section><section class="module-page" id="m04"><article class="challenge-card" id="reto-8"><details open><summary>Reto 8</summary></details></article></section><article class="challenge-card" id="suelto"><details><summary>Reto suelto</summary></details></article>`, { runScripts: 'outside-only' });
  vm.runInContext(source(), dom.getInternalVMContext(), {filename:path.resolve('js/challenge-guide.js')});
  const document = dom.window.document;
  document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  const [four, five] = ['reto-4', 'reto-5'].map(id => document.querySelector(`#${id} > details`));
  five.open = true;
  five.dispatchEvent(new dom.window.Event('toggle'));
  assert.equal(four.open, false);
  assert.equal(five.open, true);
  assert.equal(document.querySelector('#reto-8 > details').open, true, 'Otro módulo conserva su reto abierto');
  const loose = document.querySelector('#suelto > details');
  loose.open = true;
  loose.dispatchEvent(new dom.window.Event('toggle'));
  assert.equal(loose.open, true);
  assert.equal(five.open, true, 'Un reto fuera de un módulo no cierra los demás');
  five.open = false;
  five.dispatchEvent(new dom.window.Event('toggle'));
  assert.equal(four.open, false);
  dom.window.close();
});
