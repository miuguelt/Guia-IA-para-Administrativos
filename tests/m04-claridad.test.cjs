const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { visibleWords } = require('./helpers/visible-words.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function moduleFour() {
  const dom = new JSDOM(read('index.html'));
  const page = dom.window.document.getElementById('m04-validacion');
  return { dom, page, learn: page.querySelector('[data-panel="aprende"]') };
}

test('Aprende del módulo 04 recorre cifra, gráfico y afirmación ligados a sus retos', () => {
  const { dom, learn } = moduleFour();
  const steps = [...learn.querySelectorAll('[data-lesson-step]')];
  assert.deepEqual(steps.map(step => step.dataset.lessonStep), ['1', '2', '3']);
  for (const step of steps) assert.equal(step.closest('details'), null, 'los pasos se leen sin abrir desplegables');
  assert.deepEqual(steps.map(step => step.querySelector('[data-open-challenge]')?.dataset.openChallenge),
    ['reto-8', 'reto-8', 'reto-9']);
  ['Reto 8', 'Reto 8', 'Reto 9'].forEach((name, index) =>
    assert.match(steps[index].querySelector('[data-practice-in]').textContent, new RegExp(name, 'u')));
  dom.window.close();
});

test('cada paso usa las cifras y afirmaciones de las fuentes de los retos', () => {
  const { dom, learn } = moduleFour();
  const [figure, chart, claim] = learn.querySelectorAll('[data-lesson-step]');
  assert.match(figure.textContent, /42 deserciones ÷ 840 matriculados × 100 = 5,0 %/u);
  assert.equal(42 / 840 * 100, 5);
  assert.match(figure.textContent, /misma IA/u);
  assert.match(figure.textContent, /no dice por qué/u);
  assert.match(chart.textContent, /COP/u);
  assert.match(chart.textContent, /cero/u);
  assert.match(chart.textContent, /enero a marzo de 2026/u);
  assert.match(chart.textContent, /no consta/u);
  for (const state of ['Respaldada', 'Contradicha', 'No consta']) assert.match(claim.textContent, new RegExp(state, 'u'));
  assert.equal(claim.querySelectorAll('.data-safety-card').length, 3);
  assert.match(claim.textContent, /A2/u);
  assert.match(claim.textContent, /Aprobación/u);
  assert.match(claim.textContent, /OI-1/u);
  assert.doesNotMatch(claim.textContent, /A3|A4/u, 'el paso no resuelve por adelantado el resto del Reto 9');
  dom.window.close();
});

test('Aprende del módulo 04 evita la jerga de auditoría y el diagrama de vértices', () => {
  const { dom, page, learn } = moduleFour();
  assert.doesNotMatch(learn.textContent, /triangul|V[ée]rtice|alucinaci|jam[aá]s|Prohibido|Dictamen|Auditoría analítica/iu);
  assert.equal(page.querySelector('.triage-concept-block'), null);
  assert.match(learn.querySelector('.learning-timing').textContent, /Observa/u);
  dom.window.close();
});

test('la lectura visible de Aprende del módulo 04 cabe en 900 palabras', () => {
  const { dom, learn } = moduleFour();
  const words = visibleWords(learn);
  assert.ok(words <= 900, `Aprende muestra ${words} palabras`);
  dom.window.close();
});

test('el comprobador de tasas nombra el paso que refuerza', () => {
  const { dom, page } = moduleFour();
  const lab = page.querySelector('[data-panel="observa"] .ratio-lab');
  assert.match(lab.querySelector('.eyebrow').textContent, /paso 1/iu);
  for (const button of lab.querySelectorAll('button')) assert.doesNotMatch(button.textContent, /MG-A0/u);
  dom.window.close();
});
