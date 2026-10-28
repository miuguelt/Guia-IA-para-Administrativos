const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { visibleWords } = require('./helpers/visible-words.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function moduleFive() {
  const dom = new JSDOM(read('index.html'));
  const page = dom.window.document.getElementById('m05-cierre');
  return { dom, page, learn: page.querySelector('[data-panel="aprende"]') };
}

test('Aprende del módulo 05 recorre hallazgo, esfuerzo y prueba de 30 días', () => {
  const { dom, learn } = moduleFive();
  const steps = [...learn.querySelectorAll('[data-lesson-step]')];
  assert.deepEqual(steps.map(step => step.dataset.lessonStep), ['1', '2', '3']);
  for (const step of steps) {
    assert.equal(step.closest('details'), null, 'los pasos se leen sin abrir desplegables');
    assert.equal(step.querySelector('[data-open-challenge]')?.dataset.openChallenge, 'reto-integrador');
    assert.match(step.querySelector('[data-practice-in]').textContent, /reto integrador/iu);
  }
  dom.window.close();
});

test('cada paso usa los datos de contratos y el ciclo completo de tiempos', () => {
  const { dom, learn } = moduleFive();
  const [finding, effort, pilot] = learn.querySelectorAll('[data-lesson-step]');
  assert.match(finding.textContent, /SIM-CT-008/u);
  assert.match(finding.textContent, /\$25\.650\.000 − \$24\.400\.000 = \$1\.250\.000 COP/u);
  assert.equal(25650000 - 24400000, 1250000);
  assert.match(finding.textContent, /fila 21.*Centro A/su);
  assert.match(finding.textContent, /SIM-CT-012.*SIM-CT-021/su);
  assert.match(finding.textContent, /pregunta/iu);
  const minutes = [...effort.querySelectorAll('.task-step__title')].map(node => Number.parseInt(node.textContent, 10));
  assert.deepEqual(minutes, [4, 2, 5, 2]);
  assert.equal(minutes.reduce((sum, value) => sum + value, 0), 13);
  assert.match(effort.textContent, /13 min/u);
  assert.match(effort.textContent, /12 min/u);
  assert.match(effort.textContent, /ilustrativ/iu);
  assert.match(effort.textContent, /pendiente/u);
  assert.equal(pilot.querySelectorAll('.task-step').length, 4);
  assert.match(pilot.textContent, /Semana 1.*Semana 4/su);
  assert.match(pilot.textContent, /autoriza/iu);
  assert.match(pilot.textContent, /no se envía/iu);
  dom.window.close();
});

test('Aprende del módulo 05 evita la jerga y el diagrama de tres principios', () => {
  const { dom, page, learn } = moduleFive();
  assert.doesNotMatch(learn.textContent, /gobernanza|Principio \d|trazabilidad|jam[aá]s|Prohibido|nunca calificar|Restringido|Salvedad/iu);
  assert.equal(page.querySelector('.triage-concept-block'), null);
  assert.match(learn.querySelector('.learning-timing').textContent, /Observa/u);
  dom.window.close();
});

test('la lectura visible de Aprende del módulo 05 cabe en 900 palabras', () => {
  const { dom, learn } = moduleFive();
  const words = visibleWords(learn);
  assert.ok(words <= 900, `Aprende muestra ${words} palabras`);
  dom.window.close();
});

test('la calculadora de tiempos nombra el paso que refuerza y no muestra códigos', () => {
  const { dom, page } = moduleFive();
  const calculator = page.querySelector('[data-panel="observa"] #productivity-roi-calculator');
  assert.match(calculator.querySelector('.tool-tag').textContent, /paso 2/iu);
  for (const button of calculator.querySelectorAll('button')) assert.doesNotMatch(button.textContent, /MG-A0/u);
  dom.window.close();
});
