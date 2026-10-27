const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const { Simulator } = require('../js/case-practices.js');

const EXPECTED_KEYS = [
  'reto-0', 'reto-1', 'reto-2', 'reto-3', 'reto-4',
  'reto-5', 'reto-6', 'reto-7', 'reto-8', 'reto-9',
  'reto-integrador'
];

const EXPECTED_UNFORESEEN_TYPES = new Set([
  'la IA inventa un dato',
  'aparece un dato sensible',
  'cambia un requisito',
  'la herramienta no está disponible'
]);

test('challenge-decisions.json define los 11 retos con 2 dilemas, 1 imprevisto y 3 niveles de pistas', () => {
  const raw = JSON.parse(fs.readFileSync('content/challenge-decisions.json', 'utf8'));
  assert.deepEqual(Object.keys(raw), EXPECTED_KEYS);
  const coveredTypes = new Set();

  for (const key of EXPECTED_KEYS) {
    const item = raw[key];
    assert.ok(item.title && item.intro, `${key}: requiere title e intro`);
    assert.equal(item.questions.length, 3, `${key}: requiere exactamente 3 preguntas`);
    const dilemmas = item.questions.filter(q => q.kind === 'dilemma');
    const unforeseen = item.questions.filter(q => q.kind === 'unforeseen');
    assert.equal(dilemmas.length, 2, `${key}: requiere 2 dilemas`);
    assert.equal(unforeseen.length, 1, `${key}: requiere 1 imprevisto`);
    const uType = unforeseen[0].unforeseenType;
    assert.ok(EXPECTED_UNFORESEEN_TYPES.has(uType), `${key}: tipo de imprevisto inválido: ${uType}`);
    coveredTypes.add(uType);

    for (const q of item.questions) {
      assert.equal(q.options.length, 3, `${key}:${q.id} debe tener 3 opciones`);
      assert.ok(q.expected, `${key}:${q.id} requiere expected`);
      assert.ok(q.explanation && q.reference, `${key}:${q.id} requiere explanation y reference`);
      assert.ok(Array.isArray(q.hints) && q.hints.length === 3, `${key}:${q.id} requiere 3 pistas`);
      q.options.forEach((opt, idx) => {
        const val = Array.isArray(opt) ? opt[0] : String(idx);
        assert.ok(q.feedbacks && q.feedbacks[val], `${key}:${q.id} requiere feedback para la opción ${val}`);
      });
    }
  }
  assert.deepEqual(coveredTypes, EXPECTED_UNFORESEEN_TYPES, 'Deben cubrirse los 4 tipos de imprevistos');
});

function balance(questions) {
  const positions = [0, 0, 0];
  let longest = 0;
  for (const { options, correct, id } of questions) {
    positions[correct] += 1;
    const lengths = options.map(text => text.length);
    if (lengths[correct] === Math.max(...lengths)) longest += 1;
    const distractors = lengths.filter((_, index) => index !== correct);
    const mean = distractors.reduce((sum, value) => sum + value, 0) / distractors.length;
    assert.ok(lengths[correct] <= mean * 1.25, `${id}: la opción correcta mide ${lengths[correct]} y la media de las otras ${mean.toFixed(0)}`);
  }
  return { positions, longest };
}

test('la respuesta correcta no se adivina por su posición ni por ser la más larga', () => {
  const raw = JSON.parse(fs.readFileSync('content/challenge-decisions.json', 'utf8'));
  const questions = Object.values(raw).flatMap(item => item.questions).map(q => ({ id: q.id, options: q.options, correct: Number(q.expected) }));
  assert.equal(questions.length, 33);
  const { positions, longest } = balance(questions);
  positions.forEach((count, index) => assert.ok(count >= 9 && count <= 13, `Posición ${index}: ${count} respuestas correctas`));
  assert.ok(longest <= 11, `La correcta es la más larga en ${longest} de 33 preguntas`);
});

test('las comprobaciones de cada módulo tampoco delatan la respuesta por su longitud', () => {
  const paths = JSON.parse(fs.readFileSync('content/learning-paths.json', 'utf8'));
  const questions = Object.values(paths).flatMap(path => path.checks || []).map(check => ({ id: check.question, options: check.options.map(option => option.text), correct: check.options.findIndex(option => option.correct) }));
  assert.ok(questions.length >= 12);
  const { longest } = balance(questions);
  assert.ok(longest <= Math.ceil(questions.length / 3), `La correcta es la más larga en ${longest} de ${questions.length} comprobaciones`);
});

test('reto-00-tarjetas-semaforo.csv no incluye columna de pista que regale la respuesta', () => {
  const lines = fs.readFileSync('materiales/retos/reto-00-tarjetas-semaforo.csv', 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  assert.equal(lines[3], 'Código;Fragmento');
  for (const row of lines.slice(4)) {
    assert.equal(row.split(';').length, 2);
  }
});

test('cada reto renderiza Decide con tu resultado en el Paso 3, evalúa con un clic y no bloquea Siguiente paso', () => {
  const dom = new JSDOM(fs.readFileSync('index.html', 'utf8'), { url: 'https://guia.example/', pretendToBeVisual: true });
  const doc = dom.window.document;
  const containers = [...doc.querySelectorAll('[data-challenge-decisions]')];
  assert.equal(containers.length, 11);

  for (const container of containers) {
    const stage2 = container.closest('[data-challenge-stage="2"]');
    assert.ok(stage2, `${container.dataset.challengeDecisions} debe estar en el Paso 3 (data-challenge-stage="2")`);
    assert.equal(container.querySelectorAll('.case-question').length, 3);
    const guide = container.closest('[data-challenge-guide]');
    const nextBtn = guide.querySelector('[data-stage-next]');
    assert.equal(nextBtn.disabled, false, 'El bloque formativo no bloquea el botón Siguiente paso');
  }

  const first = containers[0];
  const saved = new Map();
  const storage = { get: k => saved.get(k), set: (k, v) => saved.set(k, structuredClone(v)) };
  const sim = new Simulator({ container: first, storage });
  sim.render();
  const data = JSON.parse(first.querySelector('[data-case-spec]').textContent);
  const q = data.questions[0];
  const form = first.querySelector(`[data-case-question="${q.id}"]`);
  const radio = [...form.querySelectorAll('input[type="radio"]')].find(r => r.value === q.expected);
  radio.checked = true;
  radio.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

  assert.equal(form.dataset.state, 'correct', 'Evalúa inmediatamente al elegir una opción con un clic');
  assert.equal(sim.state.answers[q.id].attempts, 1);
  assert.ok(saved.has('challenge_decisions_' + first.dataset.challengeDecisions));

  const hintBtn = form.querySelector('[data-case-hint]');
  const hintText = form.querySelector('[data-case-hint-text]');
  hintBtn.click();
  assert.match(hintText.textContent, /Pista 1 de 3:/);
  hintBtn.click();
  assert.match(hintText.textContent, /Pista 2 de 3:/);
  hintBtn.click();
  assert.match(hintText.textContent, /Pista 3 de 3:/);
  assert.equal(hintBtn.disabled, true);

  sim.destroy();
  dom.window.close();
});
