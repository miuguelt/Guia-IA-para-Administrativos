const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { visibleWords, visibleButtons } = require('./helpers/visible-words.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const TASKS = JSON.parse(read('content/ai-task-briefs.json'));
const EVIDENCES = ['MG-A01', 'MG-A02', 'MG-A03', 'MG-A04', 'MG-A05'];

function published() {
  const dom = new JSDOM(read('index.html'));
  return { dom, document: dom.window.document };
}

function closedAncestor(node) {
  const details = node.closest('details');
  return Boolean(details) && !details.open;
}

test('el paso «Comprueba» de cada reto muestra una sola acción y pliega los apoyos', () => {
  const { dom, document } = published();
  const cards = [...document.querySelectorAll('.challenge-card')];
  assert.equal(cards.length, 11);
  for (const card of cards) {
    const stage = card.querySelector('[data-challenge-stage="2"]');
    const words = visibleWords(stage);
    assert.ok(words <= 150, `${card.id}: el paso 3 muestra ${words} palabras`);
    assert.ok(visibleButtons(stage) <= 2, `${card.id}: el paso 3 muestra ${visibleButtons(stage)} botones`);
    assert.equal(stage.querySelectorAll('[data-ai-review-checks] > li').length, 3, card.id);
    assert.ok(closedAncestor(stage.querySelector('[data-challenge-decisions]')), `${card.id}: los dilemas van plegados`);
    assert.ok(closedAncestor(stage.querySelector('.prompt-text[id$="-ajuste"]')), `${card.id}: el texto del ajuste va plegado`);
    const examples = [...stage.querySelectorAll('details > summary')].filter(summary => /ejemplo/iu.test(summary.textContent));
    assert.equal(examples.length, 1, `${card.id}: un solo desplegable de ejemplo`);
    const example = examples[0].parentElement;
    assert.ok(example.querySelector('.output-preview'), card.id);
    assert.equal(stage.querySelector('.stage-review-tip'), null, card.id);
    assert.ok(![...stage.querySelectorAll(':scope > p')].some(p => p.textContent.startsWith('Si falta algo:')), card.id);
  }
  dom.window.close();
});

test('los pasos «Descarga» y «Conserva» no repiten instrucciones', () => {
  const { dom, document } = published();
  for (const card of document.querySelectorAll('.challenge-card')) {
    const download = card.querySelector('[data-challenge-stage="0"]');
    if (download.querySelector('.inline-sources')) {
      // Sin archivos: la nota de fuentes encabeza los textos que se copian.
      assert.ok(download.querySelector('.inline-sources > .tool-route'), card.id);
      assert.doesNotMatch(download.textContent, /Extraer todo/u, card.id);
    } else {
      assert.ok(closedAncestor(download.querySelector('.tool-route')), `${card.id}: la lista de fuentes va plegada`);
      assert.match(download.textContent, /Extraer todo/u, card.id);
    }
    const keep = card.querySelector('[data-challenge-stage="3"]');
    assert.doesNotMatch(keep.textContent, /Guarda tu evidencia:/u, card.id);
    assert.equal(keep.querySelectorAll('.stage-save-tip').length, 1, card.id);
    assert.equal(keep.querySelector('.bridge-info')?.textContent.trim() ?? '', '', card.id);
    const words = visibleWords(keep);
    assert.ok(words <= 70, `${card.id}: el paso 4 muestra ${words} palabras`);
  }
  dom.window.close();
});

test('«Guarda tu evidencia» empieza por subir los resultados de los retos', () => {
  const { dom, document } = published();
  for (const id of EVIDENCES) {
    const delivery = document.querySelector(`[data-ai-delivery="${id}"]`);
    const file = delivery.querySelector('[data-result-file]');
    const integrated = delivery.querySelector('[data-ai-task-key]');
    assert.ok(file.compareDocumentPosition(integrated) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING, `${id}: el selector va antes del encargo integrado`);
    assert.ok(closedAncestor(integrated), `${id}: el encargo integrado es opcional`);
    assert.match(integrated.closest('details').querySelector('summary').textContent, new RegExp(`resultado-${id}\\.html`, 'u'));
    const expected = Object.entries(TASKS)
      .filter(([, task]) => task.artifactId === id && ['challenge', 'individual'].includes(task.kind))
      .map(([key]) => `resultado-${key}.html`);
    const listed = [...delivery.querySelectorAll('[data-expected-results] li')].map(item => item.textContent);
    assert.equal(listed.length, expected.length, id);
    expected.forEach((name, index) => assert.match(listed[index], new RegExp(name.replace('.', '\\.'), 'u'), id));
    const words = visibleWords(delivery);
    assert.ok(words <= 200, `${id}: la recepción muestra ${words} palabras`);
  }
  dom.window.close();
});
