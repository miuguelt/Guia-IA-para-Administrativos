const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const loader = require('../js/lab-data-loader.js');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function page(content = '') {
  const dom = new JSDOM(`<!doctype html><head></head><body><script id="lab-source-data" type="application/json" data-src="js/lab-source-data.js">${content}</script></body>`);
  return { dom, doc: dom.window.document, win: dom.window };
}

test('la página publicada no incrusta los datos del laboratorio y apunta a su archivo', () => {
  const html = read('index.html');
  const dom = new JSDOM(html);
  const source = dom.window.document.getElementById('lab-source-data');
  assert.equal(source.textContent.trim(), '');
  const src = source.dataset.src;
  assert.match(src, /^js\/lab-source-data\.js\?v=\d+$/u);
  assert.ok(fs.existsSync(path.join(root, src.split('?')[0])));
  assert.ok(Buffer.byteLength(html) < 1200000, 'index.html debe quedar por debajo de 1,2 MB');
  assert.ok(dom.window.document.querySelector('script[src^="js/lab-data-loader.js"]'));
  dom.window.close();
});

test('el archivo de datos define el mismo conjunto que usan los simuladores', () => {
  const context = { globalThis: {} };
  vm.runInNewContext(read('js/lab-source-data.js'), context);
  const data = context.globalThis.LabSourceData;
  for (const name of ['exoplanetas', 'poblacion', 'clima', 'sismos', 'documentos']) assert.ok(data[name].length > 2, name);
  assert.equal(data.documentos.length, 3);
});

test('isReady distingue el contenedor vacío del que ya tiene datos', () => {
  const empty = page();
  assert.equal(loader.isReady(empty.doc), false);
  const full = page('{"a":1}');
  assert.equal(loader.isReady(full.doc), true);
  assert.equal(loader.isReady(new JSDOM('<p></p>').window.document), false);
  empty.dom.window.close(); full.dom.window.close();
});

test('ensure usa los datos ya incluidos sin insertar otro script', async () => {
  const { dom, doc, win } = page('{"a":1}');
  const source = await loader.ensure(doc, win);
  assert.equal(source.textContent, '{"a":1}');
  assert.equal(doc.querySelectorAll('script[src]').length, 0);
  dom.window.close();
});

test('ensure carga el archivo una sola vez, llena el contenedor y avisa que los datos están listos', async () => {
  const { dom, doc, win } = page();
  let ready = 0;
  win.addEventListener('lab-data:ready', () => { ready += 1; });
  const first = loader.ensure(doc, win);
  const second = loader.ensure(doc, win);
  assert.equal(first, second);
  const script = doc.querySelector('script[src="js/lab-source-data.js"]');
  assert.ok(script);
  win.LabSourceData = { poblacion: [{ pais: 'Colombia' }] };
  script.dispatchEvent(new win.Event('load'));
  const source = await first;
  assert.deepEqual(JSON.parse(source.textContent), { poblacion: [{ pais: 'Colombia' }] });
  assert.equal(ready, 1);
  assert.equal(loader.isReady(doc), true);
  dom.window.close();
});

test('ensure reutiliza datos ya presentes en la ventana', async () => {
  const { dom, doc, win } = page();
  win.LabSourceData = { sismos: [] };
  await loader.ensure(doc, win);
  assert.equal(doc.querySelectorAll('script[src]').length, 0);
  assert.deepEqual(JSON.parse(doc.getElementById('lab-source-data').textContent), { sismos: [] });
  dom.window.close();
});

test('ensure explica el error y permite reintentar si el archivo no carga', async () => {
  const { dom, doc, win } = page();
  const notices = [];
  win.addEventListener('lab-data:error', event => notices.push(event.detail.message));
  const failed = loader.ensure(doc, win);
  doc.querySelector('script[src]').dispatchEvent(new win.Event('error'));
  await assert.rejects(failed, /No fue posible cargar los datos del laboratorio/u);
  assert.equal(doc.querySelectorAll('script[src]').length, 0);
  const retry = loader.ensure(doc, win);
  assert.notEqual(retry, failed);
  doc.querySelector('script[src]').dispatchEvent(new win.Event('load'));
  await assert.rejects(retry, /no definió los datos/u);
  assert.equal(notices.length, 2);
  assert.match(notices[0], /No fue posible cargar/u);
  await assert.rejects(loader.ensure(new JSDOM('<p></p>').window.document, win), /contenedor de datos/u);
  dom.window.close();
});
