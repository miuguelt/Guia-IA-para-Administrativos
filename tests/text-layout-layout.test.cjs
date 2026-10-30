const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const styles = fs.readFileSync(path.join(__dirname, '..', 'css', 'guided-experience.css'), 'utf8');
const learningStyles = fs.readFileSync(path.join(__dirname, '..', 'css', 'course-learning.css'), 'utf8');
const responsiveStyles = fs.readFileSync(path.join(__dirname, '..', 'css', 'course-responsive.css'), 'utf8');
const caseStyles = fs.readFileSync(path.join(__dirname, '..', 'css', 'case-practices.css'), 'utf8');
const documentStyles = fs.readFileSync(path.join(__dirname, '..', 'css', 'documents.css'), 'utf8');
const moduleOne = fs.readFileSync(path.join(__dirname, '..', 'content', 'lessons', 'm01-fundamentos.html'), 'utf8');
const readingDocument = fs.readFileSync(path.join(__dirname, '..', 'docs', 'lectura', 'materiales--retos--reto-01-ficha.html'), 'utf8');

test('la prosa ajusta su alineación a la región y conserva todo su ancho', () => {
  const reading = fs.readFileSync(path.join(__dirname, '..', 'css/guide-reading.css'), 'utf8');
  const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.doesNotMatch(reading, /container-type:\s*inline-size/u);
  assert.doesNotMatch(reading, /@container\s*\(min-width:\s*40rem\)/u);
  assert.match(reading, /text-align:\s*var\(--text-align-reading/u);
  assert.match(index, /data-devbrain-prose-runtime/u);
  assert.match(reading, /text-align-last:\s*start/u);
  assert.doesNotMatch(styles, /grid-template-columns:[^;]*\d+ch/u);
});

test('la explicación y el apoyo relacionado aprovechan todo el ancho sin dejar columnas vacías', () => {
  assert.match(styles, /\.module-explanation\s*\{[^}]*inline-size:\s*100%/s);
  assert.match(styles, /\.module-explanation\s*>\s*\.module-reading\s*\{[^}]*inline-size:\s*100%/s);
  assert.match(styles, /\.module-explanation\s*>\s*\.productivity-lesson\s*\{[^}]*inline-size:\s*100%/s);
});

test('la introducción distribuye prosa y pasos relacionados en columnas amplias', () => {
  assert.match(styles, /\.lesson-panel\s*\{[^}]*container-type:\s*inline-size/s);
  assert.match(styles, /@container\s+lesson-panel\s*\(min-width:\s*58rem\)/);
  assert.match(styles, /\.module-brief\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1.2fr\)\s+minmax\(0,\s*1fr\)/s);
  assert.match(styles, /\.module-brief\s*>\s*\.module-concept-map\s*\{[^}]*grid-column:\s*2/s);
});

test('el texto ocupa su columna sin truncarse y ajusta la alineación al ancho real', () => {
  assert.match(styles, /\.brief-lead\s*>\s*p\s*\{[^}]*width:\s*100%/s);
  assert.match(styles, /\.brief-lead\s*>\s*p\s*\{[^}]*text-align:\s*var\(--text-align-reading,\s*start\)/s);
  assert.doesNotMatch(styles, /\.brief-lead\s*>\s*p\s*\{[^}]*text-overflow:\s*ellipsis/s);
  assert.doesNotMatch(styles, /\.brief-lead\s*>\s*p\s*\{[^}]*line-clamp/s);
});

test('los controles de selección conservan visible su opción completa', () => {
  assert.doesNotMatch(caseStyles, /text-overflow\s*:\s*ellipsis/iu);
});

test('la composición vuelve a una columna cuando falta ancho en el contenedor', () => {
  assert.match(styles, /\.module-brief\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(styles, /\.module-concept-map\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(styles, /@media\s*\(max-width:\s*680px\)/);
});

test('el encabezado fijo deja visible el inicio de la lección al navegar en móvil', () => {
  assert.doesNotMatch(responsiveStyles, /\.course-topbar\s*\{[^}]*position:\s*static/s, 'Una sola definición de posición para la barra');
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'css', 'course-shell.css'), 'utf8'), /scroll-padding-top:\s*calc\(var\(--topbar-h\)/u);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'js', 'course-app.js'), 'utf8'), /setProperty\('--topbar-h'/u);
});

test('la columna de lectura responde al ancho real del panel', () => {
  assert.match(styles, /\.lesson-panel\s*\{[^}]*container-type:\s*inline-size/);
  assert.match(styles, /@container\s+lesson-panel\s*\(min-width:\s*58rem\)/);
  assert.match(styles, /\.module-brief\s*>\s*\.module-concept-map\s*\{[^}]*grid-column:\s*2/s);
});

test('los encabezados extensos de las tarjetas de ciclo se ajustan en móvil', () => {
  assert.match(learningStyles, /\.correspondence-cycle\s*>\s*strong\s*\{[^}]*max-width:\s*100%/s);
  assert.match(learningStyles, /\.correspondence-cycle\s*>\s*strong\s*\{[^}]*overflow-wrap:\s*break-word/s);
});

test('las tarjetas de los pasos del módulo 01 se reducen al ancho disponible en móvil', () => {
  const courseStyles = fs.readFileSync(path.join(__dirname, '..', 'css', 'course.css'), 'utf8');
  assert.match(moduleOne, /class="data-safety-triptych"/);
  assert.match(moduleOne, /class="workload-grid"/);
  assert.match(learningStyles, /\.workload-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*220px\),\s*1fr\)\)/s);
  assert.match(learningStyles, /\.workload-card\s*\{[^}]*min-inline-size:\s*0/s);
  assert.match(courseStyles, /\.data-safety-triptych\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*250px\),\s*1fr\)\)/s);
  assert.match(courseStyles, /\.task-stepper\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*200px\),\s*1fr\)\)/s);
  assert.match(courseStyles, /\.task-delimitation-section \.prompt-bubble\s*\{[^}]*margin-inline:\s*0/s);
});

test('el módulo 01 no fija columnas mínimas que desborden en móvil', () => {
  assert.doesNotMatch(moduleOne, /minmax\(\d+px,/);
});

test('los contenedores y controles del laboratorio usan un quiebre de respaldo natural', () => {
  assert.match(responsiveStyles, /\.tool-lab-heading,\s*\.tool-header,\s*\.tool-body,\s*\.tool-footer\s*\{[^}]*overflow-wrap:\s*break-word/s);
  assert.match(responsiveStyles, /\.tool-lab-fields\s+\.check-option\s*>\s*:not\(input\)\s*\{[^}]*overflow-wrap:\s*break-word/s);
  assert.match(responsiveStyles, /\.tool-lab button,\s*#safety-scope-simulator button\s*\{[^}]*overflow-wrap:\s*break-word/s);
});

test('la fila del contador del simulador puede envolver sus botones en móvil', () => {
  assert.match(moduleOne, /<div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-top: 1rem;">[\s\S]{0,300}id="anon-score"/);
});

test('las páginas de lectura muestran todo el contenido de la hoja documental', () => {
  assert.doesNotMatch(documentStyles, /\.document-sheet\{[^}]*overflow:hidden\}/s);
  assert.match(documentStyles, /\.document-header\s*\{[^}]*border-radius:\s*14px\s+14px\s+0\s+0/s);
  assert.match(documentStyles, /\.document-footer\s*\{[^}]*border-radius:\s*0\s+0\s+14px\s+14px/s);
});

test('las páginas regeneradas conservan la hoja y el comportamiento adaptativo', () => {
  assert.match(readingDocument, /data-devbrain-prose(?:\s|>)/);
  assert.match(readingDocument, /data-devbrain-prose-runtime(?:\s|>)/);
});
