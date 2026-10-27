const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function moduleOne() {
  const dom = new JSDOM(read('index.html'));
  const page = dom.window.document.getElementById('m01-fundamentos');
  return { dom, page, learn: page.querySelector('[data-panel="aprende"]') };
}

// Texto que el aprendiz ve sin abrir desplegables ni pasar de pestaña.
function visibleWords(panel) {
  const copy = panel.cloneNode(true);
  copy.querySelectorAll('details:not([open])').forEach(details => {
    [...details.childNodes].forEach(node => { if (node.nodeName !== 'SUMMARY') node.remove(); });
  });
  copy.querySelectorAll('.phase-footer').forEach(node => node.remove());
  const walker = copy.ownerDocument.createTreeWalker(copy, 4);
  const parts = [];
  while (walker.nextNode()) parts.push(walker.currentNode.nodeValue);
  return parts.join(' ').split(/\s+/u).filter(Boolean).length;
}

test('Aprende recorre tres pasos en el orden de la práctica', () => {
  const { dom, learn } = moduleOne();
  const steps = [...learn.querySelectorAll('[data-m01-step]')];
  assert.deepEqual(steps.map(step => step.dataset.m01Step), ['1', '2', '3']);
  const targets = steps.map(step => step.querySelector('[data-practice-in]')?.textContent ?? '');
  assert.match(targets[0], /Reto 0/u);
  assert.match(targets[1], /Reto 1/u);
  assert.match(targets[2], /diagnóstico/iu);
  assert.equal(steps[0].querySelector('[data-open-challenge]')?.dataset.openChallenge, 'reto-0');
  assert.equal(steps[1].querySelector('[data-open-challenge]')?.dataset.openChallenge, 'reto-1');
  dom.window.close();
});

test('cada paso enseña con la solicitud de sala que usan los retos', () => {
  const { dom, learn } = moduleOne();
  const [data, roles, task] = learn.querySelectorAll('[data-m01-step]');
  for (const verb of ['Usar', 'Reducir', 'No cargar']) assert.match(data.textContent, new RegExp(verb, 'u'));
  assert.equal(data.querySelectorAll('.data-safety-card').length, 3);
  const rows = [...roles.querySelectorAll('tbody tr')].map(row => row.cells[0].textContent.trim());
  assert.deepEqual(rows, ['Regla', 'IA', 'Persona']);
  assert.match(roles.textContent, /sede.*fecha.*franja/su);
  assert.match(roles.textContent, /Contexto, Rol, Tarea y Tono/u);
  assert.match(roles.textContent, /Logística/u);
  assert.equal(task.querySelectorAll('.task-step').length, 4);
  assert.match(task.textContent, /pendiente/u);
  assert.match(task.textContent, /no tienes que cronometrar/iu);
  dom.window.close();
});

test('Aprende evita la jerga de radicación y no se adelanta a explicar CRTT', () => {
  const { dom, learn } = moduleOne();
  assert.doesNotMatch(learn.textContent, /radicaci[oó]n|SOFIA|triaje|V[ií]a 1/u);
  assert.equal(learn.querySelector('.triage-concept-block, .module-roadmap-connection'), null);
  assert.doesNotMatch(learn.querySelector('.module-brief').textContent, /CRTT/u);
  dom.window.close();
});

test('la lectura visible de Aprende cabe en 900 palabras', () => {
  const { dom, learn } = moduleOne();
  const words = visibleWords(learn);
  assert.ok(words <= 900, `Aprende muestra ${words} palabras`);
  dom.window.close();
});

test('el conteo visible no incluye el contenido de los desplegables cerrados', () => {
  const dom = new JSDOM('<div id="p"><p>uno dos</p><details><summary>tres</summary><p>oculto oculto oculto</p></details><details open><summary>cuatro</summary><p>cinco</p></details><div class="phase-footer">pie</div></div>');
  assert.equal(visibleWords(dom.window.document.getElementById('p')), 5);
  dom.window.close();
});
