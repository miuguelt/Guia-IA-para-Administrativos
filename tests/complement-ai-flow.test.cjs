const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = file => new JSDOM(read(file)).window.document;

test('cada laboratorio ofrece un encargo listo, un ejemplo y tres pasos', () => {
  const document = source('content/analisis-datos/laboratorios.html');
  for (const id of ['lab-nasa', 'lab-poblacion', 'lab-clima', 'lab-sismos', 'lab-documentos']) {
    const activity = document.querySelector(`#${id}`);
    const assignment = activity.querySelector(`[data-ai-task="${id}"]`);
    assert.ok(assignment, id);
    assert.equal(assignment.querySelectorAll('.ai-workflow > li').length, 3, id);
    assert.ok(assignment.querySelector('.ai-example'), id);
    for (const name of ['ENCARGO-CHAT.md', 'ENCARGO-IDE.md']) {
      assert.ok(assignment.querySelector(`a[href="materiales/ia/${id}/${name}"][download]`), `${id}/${name}`);
    }
    assert.ok(assignment.querySelector(`a[href="materiales/ia/${id}.zip"][download]`), id);
    assert.match(assignment.textContent, /revisa|comprueba/i);
    assert.match(assignment.textContent, /descarga/i);
  }
});

test('cada laboratorio muestra el tablero de referencia que la IA debe producir', () => {
  const document = source('content/analisis-datos/laboratorios.html');
  const boards = { 'lab-nasa': 'exoplanetas', 'lab-poblacion': 'poblacion', 'lab-clima': 'clima', 'lab-sismos': 'sismos', 'lab-documentos': 'documentos' };
  for (const [id, board] of Object.entries(boards)) {
    const figure = document.querySelector(`[data-ai-task="${id}"] figure.lab-board`);
    assert.ok(figure, id);
    const image = figure.querySelector('img');
    const src = `materiales/analisis-datos/codigo/resultados/tablero-${board}.png`;
    assert.equal(image.getAttribute('src'), src, id);
    assert.ok(fs.statSync(path.join(root, src)).size > 40000, id);
    assert.ok(image.getAttribute('alt').length > 80, id);
    assert.equal(image.getAttribute('loading'), 'lazy', id);
    assert.ok(Number(image.getAttribute('width')) > 0 && Number(image.getAttribute('height')) > 0, id);
    assert.ok(figure.querySelector(`a[href="${src}"]`), id);
    assert.match(figure.querySelector('figcaption').textContent, /cifras de control/u, id);
  }
});

test('EcoBogotá ofrece las tres rutas de capacitación sin un simulador previo', () => {
  const eco = source('content/ecobogota.html');
  assert.equal(eco.querySelectorAll('[data-ai-task]').length, 3);
  assert.equal(eco.querySelector('#eco-ai-task-gate'), null);
  assert.equal(eco.querySelector('#eco-attempt-download'), null);
  assert.equal(eco.querySelectorAll('[data-bin]').length, 0);
  for (const task of eco.querySelectorAll('[data-ai-task]')) {
    assert.equal(task.closest('[hidden]'), null);
    assert.ok(task.querySelector('[data-copy]'));
  }
});

test('el recorrido principal encarga la producción y conserva pendiente la revisión humana', () => {
  for (const file of ['content/analisis-datos/page.html', 'content/analisis-datos/fundamentos.html', 'content/analisis-datos/herramientas.html', 'content/analisis-datos/avanzado.html', 'content/ecobogota.html']) {
    const document = source(file);
    for (const details of document.querySelectorAll('details:not([open])')) details.remove();
    assert.doesNotMatch(document.body.textContent, /(?:escribe|completa|diligencia|anota) (?:tu|una|el|la|los|las|qué|con tus)/iu, file);
  }
  for (const file of ['docs/01-fundamentos.md', 'docs/02-diseno.md', 'docs/03-implementacion.md', 'docs/04-validacion.md', 'docs/05-cierre.md', 'docs/evidencias-template.md', 'docs/analisis-datos/guia-laboratorio.md']) {
    const text = read(file);
    assert.match(text, /La IA prepara los archivos/iu, file);
    assert.match(text, /pendiente/iu, file);
  }
  assert.doesNotMatch(read('docs/evidencias-template.md'), /Diligénciela|Completar en la tarjeta|Documento de identidad:/u);
  assert.doesNotMatch(read('docs/analisis-datos/guia-laboratorio.md'), /Completa \[ficha|Escribe qué comparas|Primero registra archivos/u);
  assert.doesNotMatch(read('docs/cronograma-detallado.md'), /pueden completarse sin una cuenta de IA/u);
});

test('los complementos conservan alcance, fuentes y evidencias independientes', () => {
  const lab = read('content/analisis-datos/page.html');
  assert.match(lab, /12 HORAS/);
  assert.match(lab, /12–16 HORAS/);
  assert.match(lab, /40 horas/);
  assert.match(lab, /48 horas/);
  assert.match(lab, /data-db-evidence="LAB-A01"/);
  const eco = read('content/ecobogota.html');
  assert.match(eco, /data-db-evidence="ECO-A02"/);
  assert.match(eco, /Resolución 2184 de 2019/);
  assert.match(eco, /materiales\/ia\/eco\/ENCARGO-IDE.md/);
  assert.match(eco, /alineación curricular|Alineación curricular/);
  assert.doesNotMatch(eco, /intento-simulador\.json/);
  assert.match(eco, /#eco-fase-3/);
  assert.match(eco, /Bolsa verde depende/iu);
  assert.doesNotMatch(eco, /Responde el diagnóstico para continuar|95\s*%/);
});

test('las cinco fichas descargables entregan un encargo completo sin espacios para transcribir', () => {
  for (const name of ['nasa', 'poblacion', 'clima', 'sismos', 'documentos']) {
    const file = `materiales/analisis-datos/fichas/ficha-${name}.md`;
    const text = read(file).replace(/\r\n/gu, '\n');
    const steps = text.split('## En tres pasos\n')[1]?.split('\n## ')[0];
    const review = text.split('## Revisa tres criterios\n')[1]?.split('\n## ')[0];
    assert.ok(steps, file);
    assert.equal([...steps.matchAll(/^\d\. /gmu)].length, 3, file);
    assert.ok(review, file);
    assert.equal([...review.matchAll(/^- /gmu)].length, 3, file);
    assert.match(text, /La IA genera/iu, file);
    assert.match(text, /resultado\.json/u, file);
    assert.match(text, /LAB-A01/u, file);
    assert.match(text, /revisión humana.*pendiente/iu, file);
    assert.doesNotMatch(text, /^- [^\n]+:\s*$/mu, file);
    assert.doesNotMatch(text, /^\d\. (?:Calcula|Escribe|Redacta|Completa)\b/gmu, file);
    for (const target of [`../../ia/lab-${name}.zip`, `../../ia/lab-${name}/ENCARGO-CHAT.md`, `../../ia/lab-${name}/ENCARGO-IDE.md`]) {
      assert.ok(text.includes(`](${target})`), target);
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(file), target)), target);
    }
  }
});

test('las fichas conservan filtros, unidades, versiones y límites científicos', () => {
  const nasa = read('materiales/analisis-datos/fichas/ficha-nasa.md');
  for (const token of ['NASA Exoplanet Archive', '`ps`', '`default_flag=1`', 'tránsito', '2024', '`pl_rade`', '`pl_orbper`', '`st_teff`', '`st_rad`']) assert.ok(nasa.includes(token), token);
  const population = read('materiales/analisis-datos/fichas/ficha-poblacion.md');
  for (const token of ['Banco Mundial', 'SP.POP.TOTL', 'Colombia', 'Perú', 'Ecuador', '101', '100 años y más', 'CNPV 2018', '2025', '(final − inicial) / inicial × 100']) assert.ok(population.includes(token), token);
  const climate = read('materiales/analisis-datos/fichas/ficha-clima.md');
  for (const token of ['NASA POWER', '2024', 'LST', '366', '`T2M`', '`PRECTOTCORR`']) assert.ok(climate.includes(token), token);
  assert.match(climate, /no demuestra una tendencia climática/iu);
  const earthquakes = read('materiales/analisis-datos/fichas/ficha-sismos.md');
  for (const token of ['USGS', 'enero de 2024', 'UTC', '`earthquake`', 'longitud y latitud']) assert.ok(earthquakes.includes(token), token);
  assert.match(earthquakes, /magnitud(?: de)? al menos 5/iu);
  assert.match(earthquakes, /no.*predecir sismos/iu);
  const corpus = read('materiales/analisis-datos/documentos/fichas-corpus.md');
  for (const token of ['293', '67 páginas', '106 páginas', '23 páginas', '28 páginas', '2043', '2070', 'NASA-20240004645', 'NASA-20240012020', 'NASA-20240000673', 'NASA-20240015083', 'NASA-20240008072', 'NASA-20240014707', 'NASA-20240005581']) assert.ok(corpus.includes(token), token);
});

test('las guías descargables del aprendiz delegan el registro y mantienen pendiente la revisión no realizada', () => {
  for (const file of ['materiales/analisis-datos/fichas/ficha-analisis.md', 'materiales/analisis-datos/instrucciones-herramientas.md', 'materiales/analisis-datos/documentos/fichas-corpus.md']) {
    const text = read(file);
    assert.match(text, /resultado\.json/u, file);
    assert.match(text, /Antigravity/u, file);
    assert.doesNotMatch(text, /Completa (?:los espacios|sus campos)|## Cómo completar la matriz|^\d\. Escribe\b|^- [^\n]+:\s*$/gmu, file);
    assert.match(text, /revisión humana.*pendiente/iu, file);
  }
});
