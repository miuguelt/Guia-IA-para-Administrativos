const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const {crc32, deflateRawSync} = require('node:zlib');
const api = require('../js/result-import.js');

const artifact = {id:'MG-A02', fields:[{key:'borrador', label:'Borrador'}]};
const result = (id = artifact.id, text = 'Respuesta con fuente.') => JSON.stringify({schemaVersion:1, artifactId:id, fields:{borrador:text}});
const htmlResult = (id = artifact.id, text = 'Respuesta con fuente.') => '<!doctype html><html lang="es-CO"><body><main><h1>Resultado visual</h1><script type="application/json" id="devbrain-evidence-result">' + result(id, text) + '</script></main></body></html>';
function zip(entries, options = {}) {
  const local = [], central = [];
  let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const filename = Buffer.from(name), content = Buffer.from(text);
    const compressed = options.stored ? content : deflateRawSync(content);
    const header = Buffer.alloc(30), entry = Buffer.alloc(46);
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(options.stored ? 0 : 8, 8); header.writeUInt32LE(crc32(content), 14);
    header.writeUInt32LE(compressed.length, 18); header.writeUInt32LE(options.size ?? content.length, 22); header.writeUInt16LE(filename.length, 26);
    entry.writeUInt32LE(0x02014b50); entry.writeUInt16LE(20, 4); header.copy(entry, 6, 4, 30);
    entry.writeUInt32LE(offset, 42);
    local.push(header, filename, compressed); central.push(entry, filename);
    offset += header.length + filename.length + compressed.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
function file(win, contents, name, relativePath) {
  const value = new win.File([contents], name, {type:'application/octet-stream'});
  if (relativePath) Object.defineProperty(value, 'webkitRelativePath', {value:relativePath});
  return value;
}
async function fixture(t) {
  const dom = new JSDOM(''); t.after(() => dom.window.close()); return dom.window;
}

test('acepta JSON, TXT y Markdown por extensión, sin depender del tipo MIME', async t => {
  const win = await fixture(t);
  for (const [name, content] of [['RESULTADO.JSON', '\uFEFF' + result()], ['resultado.txt', result()], ['resultado.md', 'Salida de la IA\n```json\n' + result() + '\n```\nRevisión pendiente.']]) {
    const imported = await api.importSelection([file(win, content, name)], artifact, win);
    assert.equal(imported.result.fields.borrador, 'Respuesta con fuente.');
    assert.equal(imported.source, name);
    assert.equal(imported.ignored, 0);
  }
});

test('acepta el HTML visual y valida el resultado incrustado sin ejecutar su contenido', async t => {
  const win = await fixture(t);
  const html = htmlResult().replace('<main>', '<main><img src="no-existe" onerror="window.htmlImportExecuted=true"><script>window.htmlImportExecuted=true</script>');
  const imported = await api.importSelection([file(win, html, 'resultado.html')], artifact, win);
  assert.equal(imported.result.fields.borrador, 'Respuesta con fuente.');
  assert.equal(imported.source, 'resultado.html');
  assert.equal(imported.ignored, 0);
  assert.equal(win.htmlImportExecuted, undefined);
});

test('acepta el HTML pegado como texto y rechaza una evidencia HTML incompleta o de otro módulo', async t => {
  const win = await fixture(t);
  const pasted = await api.importSelection([file(win, htmlResult(), 'resultado-pegado.txt')], artifact, win);
  assert.equal(pasted.result.artifactId, artifact.id);
  await assert.rejects(api.importSelection([file(win, '<!doctype html><h1>Sin datos de evidencia</h1>', 'resultado.html')], artifact, win), /No se encontró.*resultado.*MG-A02/iu);
  await assert.rejects(api.importSelection([file(win, htmlResult('MG-A03'), 'resultado.html')], artifact, win), /corresponde a otra evidencia/iu);
});

test('extrae solo resultados de un ZIP real y encuentra la evidencia entre otras y anexos', async t => {
  const win = await fixture(t);
  for (const stored of [false, true]) {
    const archive = zip({'salida/resultado.json':result(), 'otra.json':result('MG-A03'), 'documento.pdf':'%PDF', 'LEEME.md':'Instrucciones', '__MACOSX/._resultado.json':'metadatos'}, {stored});
    const imported = await api.importSelection([file(win, archive, 'ENTREGA.ZIP')], artifact, win);
    assert.equal(imported.result.artifactId, artifact.id);
    assert.match(imported.source, /salida\/resultado.json/u);
    assert.equal(imported.ignored, 4);
  }
});

test('busca en subcarpetas y archivos múltiples sin leer los anexos binarios', async t => {
  const win = await fixture(t);
  const files = [file(win, 'PDF', 'anexo.pdf', 'Entrega/anexo.pdf'), file(win, result(), 'resultado.json', 'Entrega/sub/resultado.json')];
  const imported = await api.importSelection(files, artifact, win);
  assert.equal(imported.source, 'Entrega/sub/resultado.json');
  assert.equal(imported.ignored, 1);
});

test('explica vacíos, formatos incompatibles, resultados ausentes y versiones ambiguas', async t => {
  const win = await fixture(t);
  const cases = [
    [[], /selecciona/iu],
    [[file(win, 'PDF', 'entrega.pdf')], /JSON.*Word.*PDF/iu],
    [[file(win, '', 'resultado.json')], /vacío/iu],
    [[file(win, 'no es JSON', 'resultado.json')], /JSON/iu],
    [[file(win, '```json\n{}\n```\n```json\n{}\n```', 'resultado.md')], /un solo.*JSON/iu],
    [[file(win, zip({'anexo.pdf':'PDF'}), 'entrega.zip')], /no.*resultado.*MG-A02/iu],
    [[file(win, zip({'resultado.json':result('MG-A03')}), 'otra.zip')], /otra evidencia/iu],
    [[file(win, zip({'a.json':result(), 'b.json':result()}), 'versiones.zip')], /varias versiones.*elige/iu],
    [[file(win, result(), 'a.json'), file(win, result(), 'b.json')], /varias versiones.*elige/iu],
    [[file(win, 'no es zip', 'roto.zip')], /ZIP.*dañado.*contraseña/iu]
  ];
  for (const [files, message] of cases) await assert.rejects(api.importSelection(files, artifact, win), message);
});

test('aplica límites antes de leer y descomprimir', async t => {
  const win = await fixture(t);
  for (const [files, message] of [
    [[{name:'grande.json', size:1048577}], /1 MB/iu],
    [[{name:'grande.zip', size:20971521}], /20 MB/iu],
    [Array.from({length:501}, () => ({name:'anexo.pdf', size:1})), /500/iu],
    [[file(win, zip({'grande.json':'pequeño'}, {size:1048577}), 'bomba.zip')], /1 MB/iu],
    [[file(win, zip(Object.fromEntries(Array.from({length:501}, (_, i) => ['x' + i + '.pdf', '']))), 'muchos.zip')], /500/iu],
    [Array.from({length:6}, (_, i) => ({name:i + '.json', size:1048576})), /5 MB/iu]
  ]) await assert.rejects(api.importSelection(files, artifact, win), message);
});

test('informa errores y cancelaciones de lectura con una acción concreta', async () => {
  await assert.rejects(api.readFile({}, {FileReader:class {readAsText(){this.onerror();}}}), /leer.*selecciona/iu);
  await assert.rejects(api.readFile({}, {FileReader:class {readAsText(){this.onabort();}}}), /canceló.*selecciona/iu);
  await assert.rejects(api.readFile({}, {FileReader:class {readAsText(){throw new Error('NotReadableError');}}}), /leer.*selecciona/iu);
});

test('interrumpe una lectura que no responde y permite seleccionar el archivo otra vez', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  let aborted = false;
  const pending = api.readFile({}, {FileReader:class {readAsText(){} abort(){aborted=true;this.onabort();}}});
  const rejected = assert.rejects(pending, /lectura.*tardó.*selecciona/iu);
  t.mock.timers.tick(30000);
  await rejected;
  assert.equal(aborted, true);
});

test('rechaza corrupción, cifrado y compresión incompatible sin extraer resultados', async t => {
  const win = await fixture(t);
  const stored = zip({'resultado.json':result()}, {stored:true});
  const corrupted = Buffer.from(stored);
  corrupted[30 + Buffer.byteLength('resultado.json') + 2] ^= 1;
  const encrypted = Buffer.from(stored), incompatible = Buffer.from(stored);
  const central = stored.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));
  encrypted.writeUInt16LE(0x801, central + 8);
  incompatible.writeUInt16LE(99, central + 10);
  for (const content of [Buffer.alloc(0), zip({}), corrupted, encrypted, incompatible]) {
    await assert.rejects(api.importSelection([file(win, content, 'entrega.zip')], artifact, win), /ZIP|resultado válido/iu);
  }
});

test('la biblioteca ZIP publicada es la versión local fijada y conserva su licencia', () => {
  assert.deepEqual(fs.readFileSync('js/vendor/fflate.js'), fs.readFileSync('node_modules/fflate/umd/index.js'));
  assert.deepEqual(fs.readFileSync('js/vendor/fflate.LICENSE'), fs.readFileSync('node_modules/fflate/LICENSE'));
  assert.equal(require('../package.json').dependencies.fflate, '0.8.3');
});

test('acepta productos elaborados multimodales, enlaces de Canva y respaldos del portafolio', async t => {
  const win = await fixture(t);
  const pdfFile = file(win, '%PDF-1.7 contenido real del informe ejecutivo SENA', 'informe-final.pdf');
  const importedPdf = await api.importSelection([pdfFile], artifact, win);
  assert.equal(importedPdf.result.elaboratedProduct.format, 'pdf');
  assert.match(importedPdf.result.fields.borrador, /informe-final\.pdf/u);

  const csvFile = file(win, '# Borrador\nFila 1; Normalizada con fórmula reproducible.', 'limpieza.csv');
  const importedCsv = await api.importSelection([csvFile], artifact, win);
  assert.equal(importedCsv.result.elaboratedProduct.format, 'csv');
  assert.match(importedCsv.result.fields.borrador, /Normalizada con fórmula/u);

  await assert.rejects(api.importSelection([{ name: 'enorme.pdf', size: 20971521 }], artifact, win), /20 MB/iu);

  const canvaRes = api.registerCanvaLink('https://www.canva.com/design/DAG555/view', artifact);
  assert.equal(canvaRes.elaboratedProduct.kind, 'canva_link');
  assert.throws(() => api.registerCanvaLink('https://sitio-invalido.com', artifact), /enlace válido de Canva/iu);

  const backupJson = JSON.stringify({
    backup: {
      evidencias: {
        'MG-A02': { values: { borrador: 'Recuperado del respaldo' } }
      }
    }
  });
  const fromBackup = api.parseText(backupJson, artifact, win, 'respaldo.json');
  assert.equal(fromBackup.fields.borrador, 'Recuperado del respaldo');
  assert.throws(() => api.parseText(JSON.stringify({ backup: { evidencias: {} } }), artifact, win, 'respaldo.json'), /no contiene MG-A02/iu);
});

module.exports = {zip, file, result};
