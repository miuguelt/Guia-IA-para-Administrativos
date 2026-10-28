const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM, VirtualConsole } = require('jsdom');
const { visibleWords } = require('./helpers/visible-words.cjs');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const scripts = ['js/vendor/devbrain-learner-sdk.js', 'js/registro-entregables.js', 'js/course-tabs.js', 'js/course-dialog.js', 'js/evidence-accessibility.js', 'js/calendar-print.js', 'js/course-mode.js', 'js/course-app.js'];
const MODULES = ['m01-fundamentos', 'm02-diseno', 'm03-implementacion', 'm04-validacion', 'm05-cierre'];
const ROUTE = ['inicio', 'preparacion', ...MODULES, 'portafolio', 'calendario'];

// Recorre la guía en «Por mi cuenta» con las cuatro pestañas abiertas y los desplegables cerrados.
async function route() {
  const dom = new JSDOM(read('index.html'), { url: 'http://volumen.test/#inicio', runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  for (const file of scripts) new vm.Script(read(file), { filename: path.join(root, file) }).runInContext(dom.getInternalVMContext());
  await new Promise(resolve => window.setTimeout(resolve, 35));
  window.CourseMode.apply(window.document, 'autonomo');
  window.document.querySelectorAll('.lesson-panel[data-panel]').forEach(panel => { panel.hidden = false; });
  return { dom, document: window.document };
}

function visibleText(node) {
  const copy = node.cloneNode(true);
  copy.querySelectorAll('details:not([open])').forEach(details => {
    [...details.childNodes].forEach(child => { if (child.nodeName !== 'SUMMARY') child.remove(); });
  });
  copy.querySelectorAll('script, [hidden], pre, code').forEach(child => child.remove());
  return copy.textContent.replace(/\s+/gu, ' ');
}

const visibleDetails = page => [...page.querySelectorAll('details')]
  .filter(details => !details.closest('[hidden]') && !details.parentElement.closest('details:not([open])')).length;

test('cada módulo cabe en una lectura breve: palabras y desplegables visibles', async () => {
  const { dom, document } = await route();
  for (const id of MODULES) {
    const page = document.getElementById(id);
    const words = visibleWords(page);
    // Antes de la fase C: de 2 941 a 3 469 palabras y hasta 29 desplegables visibles por módulo.
    assert.ok(words <= 2850, `${id}: muestra ${words} palabras`);
    assert.ok(visibleDetails(page) <= 28, `${id}: muestra ${visibleDetails(page)} desplegables`);
  }
  dom.window.close();
});

test('el aprendiz no ve códigos de evidencia, resultados de aprendizaje ni jerga técnica', async () => {
  const { dom, document } = await route();
  // El SDK externo rotula su botón de respaldo con «JSON» y su registro imprimible conserva los códigos institucionales.
  document.querySelectorAll('#btn-download-json, .dbe-dossier').forEach(node => node.remove());
  for (const id of ROUTE) {
    const text = visibleText(document.getElementById(id));
    assert.doesNotMatch(text, /(?<![\w-])MG-A0\d/u, `${id}: muestra un código MG-A0`);
    assert.doesNotMatch(text, /\bRA[12]\b/u, `${id}: muestra RA1 o RA2`);
    assert.doesNotMatch(text, /autocomprobaci/iu, `${id}: muestra «autocomprobación»`);
    assert.doesNotMatch(text, /\bJSON\b/u, `${id}: menciona JSON fuera de la ayuda`);
  }
  for (const id of MODULES) {
    assert.doesNotMatch(visibleText(document.getElementById(id)), /Antigravity|Codex/u, `${id}: el paso principal nombra un editor`);
  }
  assert.doesNotMatch(visibleText(document.querySelector('#preparacion [data-tabs="tools"]')), /Antigravity|Codex/u);
  dom.window.close();
});

test('el modo con instructor conserva los códigos de evidencia', async () => {
  const { dom, document } = await route();
  dom.window.CourseMode.apply(document, 'aula');
  for (const id of MODULES) assert.match(visibleText(document.getElementById(id)), /MG-A0\d/u, id);
  dom.window.close();
});

test('CRTT se explica en un solo lugar y los demás módulos enlazan ahí', async () => {
  const { dom, document } = await route();
  const definitions = ROUTE.reduce((sum, id) => sum + (visibleText(document.getElementById(id)).match(/Contexto,?\s+Rol,?\s+Tarea/gu) || []).length, 0);
  assert.ok(definitions <= 3, `CRTT se explica ${definitions} veces`);
  const anchor = document.querySelectorAll('#crtt');
  assert.equal(anchor.length, 1);
  assert.ok(anchor[0].closest('#m01-fundamentos'));
  for (const id of ['m02-diseno', 'm03-implementacion']) assert.ok(document.querySelector(`#${id} a[href="#crtt"]`), id);
  dom.window.close();
});

test('la preparación llega a la primera práctica en menos de 250 palabras', async () => {
  const { dom, document } = await route();
  const page = document.getElementById('preparacion');
  const workspace = page.querySelector('.preparation-workspace-intro');
  const before = document.createElement('div');
  for (const node of page.children) {
    if (node === workspace) break;
    before.append(node.cloneNode(true));
  }
  const words = visibleWords(before);
  assert.ok(words <= 250, `Antes de los cinco pasos hay ${words} palabras`);
  assert.ok(page.querySelector('[data-global-practice-note]').compareDocumentPosition(workspace) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.ok(page.querySelector('#metodo-comun'), 'La ayuda común conserva su ancla');
  dom.window.close();
});
