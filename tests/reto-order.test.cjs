const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const expected = ['reto-0', 'reto-1', 'reto-2', 'reto-3', 'reto-4', 'reto-5', 'reto-6', 'reto-7', 'reto-8', 'reto-9', 'reto-integrador'];

test('los retos aparecen en la página en el mismo orden en que se recorren', () => {
  const dom = new JSDOM(read('index.html'));
  const ids = [...dom.window.document.querySelectorAll('article.challenge-card')].map(card => card.id);
  assert.deepEqual(ids, expected);
  for (const card of dom.window.document.querySelectorAll('article.challenge-card')) {
    if (card.id === 'reto-integrador') continue;
    const number = card.id.slice('reto-'.length);
    assert.match(card.querySelector('h3, h2').textContent, new RegExp(`Reto ${number}\\b`), card.id);
  }
  dom.window.close();
});

test('el catálogo de encargos y los títulos conservan el orden de recorrido', () => {
  const catalog = JSON.parse(read('content/ai-task-briefs.json'));
  assert.deepEqual(Object.keys(catalog).filter(key => key.startsWith('reto-')), expected);
  for (const key of expected.slice(0, -1)) {
    assert.ok(catalog[key].title.startsWith(`Reto ${key.slice(5)} · `), key);
  }
});

test('los módulos presentan los retos con la numeración vigente', () => {
  const home = read('content/home.html');
  assert.match(home, /Retos 4, 5, 6 y 7/u);
  assert.match(home, /Retos 8 y 9/u);
  assert.doesNotMatch(home, /Retos 4, 5, 6 y 9|Retos 7 y 8/u);
});

test('no quedan fuentes publicadas con los nombres anteriores de los retos 7, 8 y 9', () => {
  for (const old of ['reto-08-afirmaciones.csv', 'reto-09-casos-flujo.csv', 'reto-08-variante-cita-inexistente.csv']) {
    assert.equal(fs.existsSync(path.join(root, 'materiales/retos', old)), false, old);
  }
  for (const current of ['reto-07-casos-flujo.csv', 'reto-09-afirmaciones.csv', 'reto-09-variante-cita-inexistente.csv']) {
    assert.ok(fs.existsSync(path.join(root, 'materiales/retos', current)), current);
  }
});
