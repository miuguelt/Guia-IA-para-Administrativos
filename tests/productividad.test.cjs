const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const ids = ['preparacion', 'm01-fundamentos', 'm02-diseno', 'm03-implementacion', 'm04-validacion', 'm05-cierre'];

test('los seis módulos publican un apoyo de productividad con práctica de recuperación y resultado comprobable', () => {
  const dom = new JSDOM(read('index.html'));
  for (const id of ids) {
    const section = dom.window.document.querySelector(`#${id} [data-productivity-topic]`);
    assert.ok(section, id);
    assert.ok(section.querySelector('h2, h3'), id);
    assert.ok(section.querySelector('[data-retrieval-check] summary'), id);
    assert.ok(section.querySelector('[data-retrieval-check] p')?.textContent.length > 60, id);
    assert.ok(section.querySelector('[data-productivity-criterion]')?.textContent.length > 40, id);
  }
  assert.equal(dom.window.document.querySelectorAll('[data-learning-module]').length, 6);
  dom.window.close();
});

test('la preparación distingue una respuesta generada de una acción y enseña a confirmar la lectura del archivo', () => {
  const dom = new JSDOM(read('index.html'));
  const section = dom.window.document.querySelector('#preparacion [data-productivity-topic]');
  assert.ok(section);
  assert.match(section.textContent, /no.*(?:accede|abre).*correo/isu);
  assert.match(section.textContent, /diez centros/iu);
  assert.match(section.textContent, /(?:leído|lectura).*(?:no|sin).*demuestra/isu);
  assert.match(section.textContent, /42.*840/isu);
  assert.ok(dom.window.document.querySelector('#preparacion [data-file-reading-check]'));
  const warning = dom.window.document.querySelector('#preparacion [data-global-practice-note]');
  const firstPractice = section.querySelector('[data-retrieval-check]');
  assert.ok(warning.compareDocumentPosition(firstPractice) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(dom.window.document.querySelectorAll('#preparacion .prep-flow-summary').length, 0, 'No repetir el recorrido antes de sus cinco pasos');
  dom.window.close();
});

test('la preparación contextualiza bienestar.csv como matrícula y deserción en diez centros y define el Centro A como caso testigo', () => {
  const dom = new JSDOM(read('content/productivity/preparacion.html'));
  const text = dom.window.document.body.textContent;
  assert.match(text, /matr[íi]cula\s+y\s+deserci[oó]n/iu, 'Debe explicitar el objeto de bienestar.csv');
  assert.match(text, /diez\s+centros\s+de\s+formaci[oó]n/iu, 'Debe identificar los diez centros del SENA');
  assert.match(text, /caso\s+testigo|ancla\s+de\s+control/iu, 'Debe denominar al Centro A como caso testigo o ancla de control');
  assert.match(text, /840\s+matriculados.*42\s+deserciones.*5\s*%/su, 'Debe asociar las tres métricas al control');
  dom.window.close();
});

test('la preparación fundamenta la verificación previa contra alucinaciones y define la secuencia lógica obligatoria', () => {
  const dom = new JSDOM(read('content/productivity/preparacion.html'));
  const text = dom.window.document.body.textContent;
  assert.match(text, /alucinaci[oó]n|804|alterar\s+cifras/iu, 'Debe advertir sobre la alteración o alucinación de datos como 804');
  assert.match(text, /Primero, verifica.*columnas.*diez centros.*caso testigo.*Solo después de comprobar.*lectura.*encarga el análisis/isu, 'La IA debe demostrar lectura y permitir contrastarla antes de encargar el análisis');
  const details = dom.window.document.querySelector('details.course-context');
  assert.ok(details && !details.open, 'La explicación extensa debe seguir disponible en una ampliación cerrada');
  dom.window.close();
});


test('elegir una tarea incluye frecuencia, revisión y riesgo y no promete ahorro universal', () => {
  const dom = new JSDOM(read('index.html'));
  const section = dom.window.document.querySelector('#m01-fundamentos [data-productivity-topic]');
  assert.ok(section);
  for (const term of [/frecuencia/iu, /revisi[oó]n/iu, /riesgo/iu, /método manual/iu]) assert.match(section.textContent, term);
  assert.ok(section.querySelectorAll('tbody tr').length >= 3);
  dom.window.close();
});

test('la recuperación enseña corrección puntual, versión de plantilla y traspaso de contexto verificado', () => {
  const dom = new JSDOM(read('index.html'));
  const section = dom.window.document.querySelector('#m02-diseno [data-productivity-topic]');
  assert.ok(section);
  const prompt = section.querySelector('[data-correction-prompt]');
  assert.match(prompt.textContent, /PC-01/u);
  assert.match(prompt.textContent, /fecha|hora/iu);
  assert.match(prompt.textContent, /conserva/iu);
  assert.match(section.textContent, /versión.*tres casos/isu);
  assert.match(section.textContent, /conversación nueva/iu);
  assert.match(section.textContent, /(?:no|sin).*borra.*(?:historial|memoria)/isu);
  assert.ok(section.querySelector('[data-copy]'));
  dom.window.close();
});

test('el trabajo por lotes conserva los 50 códigos y detecta omisiones y repeticiones', () => {
  const dom = new JSDOM(read('index.html'));
  const section = dom.window.document.querySelector('#m03-implementacion [data-productivity-topic]');
  assert.ok(section);
  for (const term of [/C-001.*C-025/su, /C-026.*C-050/su, /50 códigos/iu, /omit|omisi/iu, /repetid/iu]) assert.match(section.textContent, term);
  const codes = read('materiales/retos/correos-50.csv').split(/\r?\n/u)
    .map(row => row.match(/^(C-\d{3});/u)?.[1]).filter(Boolean);
  const expected = Array.from({ length: 50 }, (_, index) => `C-${String(index + 1).padStart(3, '0')}`);
  assert.deepEqual(codes, expected, 'Los lotes propuestos deben cubrir los códigos reales una sola vez');
  dom.window.close();
});

test('la revisión de sesgo compara casos equivalentes sin inventar perfiles ni causas', () => {
  const dom = new JSDOM(read('index.html'));
  const section = dom.window.document.querySelector('#m04-validacion [data-productivity-topic]');
  assert.ok(section);
  assert.match(section.textContent, /sesgo/iu);
  assert.match(section.textContent, /mismas.*(?:reglas|condiciones|señales)/isu);
  assert.match(section.textContent, /no.*(?:deduzcas|infieras).*personas/isu);
  dom.window.close();
});

test('la medición visual conserva calidad, costo inicial y balance de las dos primeras ejecuciones', () => {
  const dom = new JSDOM(read('index.html'));
  const section = dom.window.document.querySelector('#m05-cierre [data-productivity-topic]');
  assert.ok(section);
  const example = section.querySelector('[data-productivity-metrics]');
  assert.equal(Number(example.dataset.manualMinutes), 60);
  assert.equal(Number(example.dataset.assistedMinutes), 45);
  assert.equal(Number(example.dataset.setupMinutes), 20);
  assert.equal(Number(example.dataset.acceptedUnits), 10);
  assert.equal(60 - (45 + 20), -5);
  assert.equal(2 * 60 - (2 * 45 + 20), 10);
  for (const term of [/65/iu, /110/iu, /120/iu, /aceptad/iu, /ejemplo.*(?:ilustrativo|práctica)/isu]) assert.match(example.textContent, term);
  assert.match(section.textContent, /no.*(?:conviertas|equivale).*dinero/isu);
  dom.window.close();
});

test('las cuatro imágenes didácticas tienen explicación equivalente y metadatos accesibles', () => {
  const dom = new JSDOM(read('index.html'));
  const illustrations = [...dom.window.document.querySelectorAll('[data-productivity-visual]')];
  assert.equal(illustrations.length, 4);
  for (const figure of illustrations) {
    const img = figure.querySelector('img');
    assert.ok(img?.alt.length > 35);
    assert.ok(figure.querySelector('figcaption')?.textContent.length > 60);
    const target = img.getAttribute('src').split('?')[0];
    const svg = new JSDOM(read(target), { contentType: 'image/svg+xml' });
    assert.ok(svg.window.document.querySelector('title'));
    assert.ok(svg.window.document.querySelector('desc'));
    assert.equal(svg.window.document.querySelectorAll('script, foreignObject').length, 0);
    assert.match(svg.window.document.documentElement.getAttribute('viewBox'), /^0 0 /u);
    svg.window.close();
  }
  dom.window.close();
});

test('el registro de tiempos permite comprobar productos aceptados y errores, además de minutos', () => {
  const csv = read('materiales/retos/registro-tiempos.csv');
  for (const term of [/Unidades aceptadas/iu, /Errores u omisiones/iu, /Versión de la instrucción/iu, /Decisión.*continuar.*ajustar.*detener/iu]) assert.match(csv, term);
});

test('las explicaciones distinguen CRTT de sus controles y conservan los tiempos como ejemplo', () => {
  const paths = JSON.parse(read('content/learning-paths.json'));
  const term = paths['m02-diseno'].terms.find(([name]) => name === 'CRTT')[1];
  assert.match(term, /Contexto, Rol, Tarea y Tono/u);
  assert.match(term, /fuente.*límites|límites.*fuente/iu);
  const lesson = read('content/lessons/m02-diseno.html');
  assert.doesNotMatch(lesson, /entregue exactamente lo que necesitas/iu);
  assert.doesNotMatch(read('content/lessons/m05-cierre.html'), /tiempo manual real \(12 min\)/iu);
});
