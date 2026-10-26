/* Regla 7.4: la prosa amplia se justifica salvo dentro de una escena interactiva. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const copies = ['devbrain-prose.js', 'materiales/eco-capacitacion/devbrain-prose.js'];

function render(file, markup) {
  const dom = new JSDOM(`<!doctype html><body>${markup}</body>`);
  const { window } = dom;
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.HTMLElement.prototype.getBoundingClientRect = function () { return { width: Number(this.dataset.width || 0) }; };
  const prose = require(path.join(root, file));
  const layout = prose.initProseLayout(window.document, window);
  return { dom, document: window.document, layout };
}

for (const file of copies) {
  test(`${file}: EcoBogotá se justifica y solo la escena interactiva conserva su alineación`, () => {
    const { dom, document, layout } = render(file, `
      <section id="ecobogota" class="eco-training"><p id="eco" data-width="704">Introducción de la práctica.</p></section>
      <p id="angosta" data-width="320">Texto en una columna angosta.</p>
      <section data-office-scene="puesto"><p id="escena" data-width="704">Diálogo de la simulación.</p></section>`);
    assert.equal(document.getElementById('eco').style.textAlign, 'justify');
    assert.equal(document.getElementById('angosta').style.textAlign, 'start');
    assert.equal(document.getElementById('escena').style.textAlign, '', 'La escena interactiva no se modifica');
    layout.destroy();
    assert.equal(document.getElementById('eco').style.textAlign, '');
    dom.window.close();
  });
}

test('las dos copias del ajuste de prosa son iguales', () => {
  const [main, eco] = copies.map(file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/gu, '\n'));
  assert.equal(eco, main);
});
