const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const readDocument = (file) => new JSDOM(fs.readFileSync(path.join(root, file), 'utf8')).window.document;

test('Los once retos encargan el producto a la IA y ofrecen tres comprobaciones concretas', () => {
  const cards = fs.readdirSync(path.join(root, 'content/lessons')).flatMap((file) => [...readDocument(`content/lessons/${file}`).querySelectorAll('.challenge-card')]);
  assert.equal(cards.length, 11);
  for (const card of cards) {
    assert.match(card.querySelector('.tool-route').textContent, /chat|Antigravity/u, card.id);
    assert.match(card.querySelector('[data-ai-task]').textContent, /genera|Genera|Devuelve/u, card.id);
    assert.equal(card.querySelectorAll('[data-ai-review-checks] > li').length, 3, card.id);
    assert.match(card.textContent, /descarga|Descarga/u, card.id);
    assert.doesNotMatch(card.textContent, /completa (?:la |una )?ficha|escribe una instrucción|redacta la plantilla|en papel/u, card.id);
  }
});

test('Cada módulo presenta una idea, un ejemplo y tres acciones antes de las ampliaciones', () => {
  for (const file of fs.readdirSync(path.join(root, 'content/lessons'))) {
    const document = readDocument(`content/lessons/${file}`);
    const lesson = document.querySelector('[data-ai-quick-lesson]');
    assert.ok(lesson, file);
    assert.equal(lesson.querySelectorAll('ol > li').length, 3, file);
    assert.ok(lesson.querySelector('[data-ai-mini-example]'), file);
    assert.ok(document.querySelector('details[data-lesson-extension]:not([open])'), file);
  }
});

test('La preparación conserva cinco pasos y un informe descargable sin transcripción de respuestas', () => {
  const document = readDocument('content/preparation.html');
  assert.equal(document.querySelectorAll('.tool-lesson[data-panel]').length, 5);
  assert.match(document.querySelector('#preparation-document-prompt').textContent, /descargable/u);
  assert.match(document.querySelector('[data-panel="diseno"]').textContent, /no consta|pendiente/u);
  assert.doesNotMatch(document.querySelector('[data-panel="hoja"]').textContent, /escribe 42|calculadora para/u);
  assert.match(document.body.textContent, /Antigravity/u);
});

test('La portada y el portafolio explican el recorrido por archivo generado sin diligenciamiento', () => {
  const home = readDocument('content/home.html');
  const portfolio = readDocument('content/portfolio.html');
  assert.match(home.querySelector('.hero-lead, .hero-copy p, .page-intro').textContent, /preparación/u);
  assert.ok(home.querySelector('a[href="#preparacion"]'));
  assert.match(home.querySelector('.hero-copy p').textContent, /encargo/iu);
  assert.match(portfolio.querySelector('.page-intro').textContent, /cinco evidencias.*guardaste/isu);
  assert.equal(portfolio.querySelectorAll('.portfolio-links a[data-open-evidence]').length, 5);
  assert.doesNotMatch(portfolio.querySelector('.page-intro').textContent, /diligenciamiento|se completan/u);
});
