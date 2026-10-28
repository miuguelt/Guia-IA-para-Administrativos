const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { visibleWords } = require('./helpers/visible-words.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function moduleTwo() {
  const dom = new JSDOM(read('index.html'));
  const page = dom.window.document.getElementById('m02-diseno');
  return { dom, page, learn: page.querySelector('[data-panel="aprende"]') };
}

test('Aprende del módulo 02 recorre tres pasos ligados a sus retos', () => {
  const { dom, learn } = moduleTwo();
  const steps = [...learn.querySelectorAll('[data-lesson-step]')];
  assert.deepEqual(steps.map(step => step.dataset.lessonStep), ['1', '2', '3']);
  for (const step of steps) assert.equal(step.closest('details'), null, 'los pasos se leen sin abrir desplegables');
  const targets = steps.map(step => step.querySelector('[data-practice-in]')?.textContent ?? '');
  assert.match(targets[0], /Reto 2/u);
  assert.match(targets[1], /Reto 2/u);
  assert.match(targets[2], /Reto 3/u);
  assert.deepEqual(steps.map(step => step.querySelector('[data-open-challenge]')?.dataset.openChallenge),
    ['reto-2', 'reto-2', 'reto-3']);
  dom.window.close();
});

test('cada paso enseña con los casos PQRS que usan los retos', () => {
  const { dom, learn } = moduleTwo();
  const [read1, task, proof] = learn.querySelectorAll('[data-lesson-step]');
  assert.equal(read1.querySelectorAll('.data-safety-card').length, 3);
  for (const word of [/pide/iu, /afirma/iu, /pendiente/iu]) assert.match(read1.textContent, word);
  assert.match(read1.textContent, /PC-01/u);
  assert.ok(task.querySelector('a[href="#crtt"]'), 'el paso 2 remite a la explicación de CRTT');
  assert.doesNotMatch(task.textContent, /Contexto,?\s+Rol,?\s+Tarea/u, 'CRTT se define solo en #crtt');
  const copy = task.querySelector('[data-copy]');
  assert.ok(copy, 'el paso 2 ofrece una instrucción lista para copiar');
  const prompt = task.querySelector(`#${copy.dataset.copy}`);
  assert.ok(prompt, 'el botón copia una instrucción existente');
  assert.match(prompt.textContent, /PC-01/u);
  assert.match(prompt.textContent, /No presentes .* como confirmados/u);
  assert.match(task.textContent, /área responsable/u);
  assert.equal(proof.querySelectorAll('.task-step').length, 4);
  for (const code of ['PC-01', 'PC-02', 'PC-03']) assert.match(proof.textContent, new RegExp(code, 'u'));
  assert.match(proof.textContent, /repite/iu);
  dom.window.close();
});

test('Aprende del módulo 02 evita la jerga legal y el diagrama de cinco columnas', () => {
  const { dom, page, learn } = moduleTwo();
  assert.doesNotMatch(learn.textContent, /radicaci[oó]n|1755|1437|aislamiento|jam[aá]s|triaje|actos administrativos|probatorio/iu);
  assert.equal(page.querySelector('.triage-concept-block'), null);
  assert.doesNotMatch(learn.querySelector('.learning-timing').textContent, /compositor/u);
  dom.window.close();
});

test('la lectura visible de Aprende del módulo 02 cabe en 900 palabras', () => {
  const { dom, learn } = moduleTwo();
  const words = visibleWords(learn);
  assert.ok(words <= 900, `Aprende muestra ${words} palabras`);
  dom.window.close();
});

test('en Observa cada simulador nombra el paso que refuerza y no muestra códigos', () => {
  const { dom, page } = moduleTwo();
  const observe = page.querySelector('[data-panel="observa"]');
  assert.match(observe.querySelector('#prompt-lab .eyebrow').textContent, /paso 2/iu);
  assert.match(observe.querySelector('#prompt-compare-simulator .eyebrow').textContent, /paso 2/iu);
  assert.match(observe.querySelector('#pqrs-evaluator-simulator .eyebrow').textContent, /paso 1/iu);
  for (const button of observe.querySelectorAll('button')) assert.doesNotMatch(button.textContent, /MG-A0/u);
  dom.window.close();
});
