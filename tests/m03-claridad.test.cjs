const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { visibleWords } = require('./helpers/visible-words.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function moduleThree() {
  const dom = new JSDOM(read('index.html'));
  const page = dom.window.document.getElementById('m03-implementacion');
  return { dom, page, learn: page.querySelector('[data-panel="aprende"]') };
}

test('Aprende del módulo 03 dedica un paso a cada reto, en su orden', () => {
  const { dom, learn } = moduleThree();
  const steps = [...learn.querySelectorAll('[data-lesson-step]')];
  assert.deepEqual(steps.map(step => step.dataset.lessonStep), ['1', '2', '3', '4']);
  for (const step of steps) assert.equal(step.closest('details'), null, 'los pasos se leen sin abrir desplegables');
  assert.deepEqual(steps.map(step => step.querySelector('[data-open-challenge]')?.dataset.openChallenge),
    ['reto-4', 'reto-5', 'reto-6', 'reto-7']);
  steps.forEach((step, index) => assert.match(step.querySelector('[data-practice-in]').textContent, new RegExp(`Reto ${index + 4}`, 'u')));
  dom.window.close();
});

test('cada paso enseña con un dato real de la fuente de su reto', () => {
  const { dom, learn } = moduleThree();
  const [inbox, minutes, table, flow] = learn.querySelectorAll('[data-lesson-step]');
  assert.match(inbox.textContent, /C-001/u);
  assert.match(inbox.textContent, /50 códigos/u);
  assert.match(inbox.textContent, /sin enviar/u);
  assert.match(minutes.textContent, /05:52/u);
  assert.match(minutes.textContent, /04:16/u);
  assert.match(minutes.textContent, /no consta/u);
  assert.match(table.textContent, /SIM-0003/u);
  assert.match(table.textContent, /REVISAR/u);
  assert.match(table.textContent, /SIM-0012/u);
  assert.match(flow.textContent, /FL-01.*FL-02.*FL-03/su);
  assert.match(flow.textContent, /urgen/iu);
  for (const step of [inbox, minutes, table, flow]) {
    assert.ok(step.querySelector('.data-safety-card, .task-step'), 'cada paso muestra entrada, salida y comprobación');
  }
  dom.window.close();
});

test('Aprende del módulo 03 evita la jerga y el diagrama de cuatro columnas', () => {
  const { dom, page, learn } = moduleThree();
  assert.doesNotMatch(learn.textContent, /triaje|auditab|jam[aá]s|Prohibido|no destructiva|Trazabilidad institucional/u);
  assert.equal(page.querySelector('.triage-concept-block'), null);
  const timing = learn.querySelector('.learning-timing');
  assert.match(timing.textContent, /Observa/u);
  dom.window.close();
});

test('la lectura visible de Aprende del módulo 03 cabe en 900 palabras', () => {
  const { dom, learn } = moduleThree();
  const words = visibleWords(learn);
  assert.ok(words <= 900, `Aprende muestra ${words} palabras`);
  dom.window.close();
});

test('el simulador de limpieza nombra el paso que refuerza y no muestra códigos', () => {
  const { dom, page } = moduleThree();
  const simulator = page.querySelector('[data-panel="observa"] #data-cleaner-simulator');
  assert.match(simulator.querySelector('.eyebrow').textContent, /paso 3/iu);
  for (const button of simulator.querySelectorAll('button')) assert.doesNotMatch(button.textContent, /MG-A0/u);
  dom.window.close();
});
