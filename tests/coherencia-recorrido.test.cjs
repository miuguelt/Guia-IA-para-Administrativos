const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const json = file => JSON.parse(read(file));
const RETOS = ['reto-0', 'reto-1', 'reto-2', 'reto-3', 'reto-4', 'reto-5', 'reto-6', 'reto-7', 'reto-8', 'reto-9', 'reto-integrador'];

test('cada reto del 0 al 9 aparece en un solo día de la secuencia del manifiesto', () => {
  const days = json('guide.manifest.json').learningSequence.map(day => day.name);
  const numbers = days.map(name => {
    const found = new Set();
    for (const [, from, to] of name.matchAll(/(\d)\s*a\s*(\d)/gu)) {
      for (let n = Number(from); n <= Number(to); n += 1) found.add(n);
    }
    for (const [, list] of name.matchAll(/Retos?\s+([\d\s,y]+)/gu)) {
      for (const n of list.match(/\d/gu) || []) found.add(Number(n));
    }
    return found;
  });
  for (let reto = 0; reto <= 9; reto += 1) {
    assert.equal(numbers.filter(set => set.has(reto)).length, 1, `Reto ${reto}: ${days.join(' | ')}`);
  }
  assert.ok(numbers[2].has(7), 'El Reto 7 pertenece al Día 3');
});

test('la tabla de herramientas del instructor sigue la numeración vigente de los retos', () => {
  const rows = read('docs/herramientas-y-preparacion.md').split(/\r?\n/u).filter(line => /^\| \d\. /u.test(line));
  assert.deepEqual(rows.map(line => Number(line[2])), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.match(rows[7], /Diseño de flujo/u);
  assert.match(rows[8], /Presupuesto/u);
  assert.match(rows[9], /Auditoría/u);
});

test('la brújula promete la página que entrega la IA y un paso concreto a la herramienta de oficina', () => {
  const compass = json('content/challenge-compass.json');
  assert.deepEqual(Object.keys(compass), RETOS);
  for (const [id, data] of Object.entries(compass)) {
    const product = data.compass.productFormat;
    assert.match(product, new RegExp(`resultado-${id}\\.html`, 'u'), id);
    assert.match(product, /Paso a la oficina: .*(Word|Docs|Excel|Sheets|Canva|PowerPoint|asistente reutilizable)/u, id);
    assert.doesNotMatch(JSON.stringify(data), /Falsa|citas falsas|30 contratos|GTC 185|Ley 1755/u, id);
  }
  assert.match(compass['reto-6'].compass.productFormat, /=SI\(ESBLANCO/u);
  assert.match(compass['reto-8'].compass.productFormat, /=Deserciones\/Matriculados/u);
  assert.match(compass['reto-integrador'].compass.toolCombination, /24 contratos/u);
});

test('el producto de cada encargo describe una página de resultado y no un archivo de otra aplicación', () => {
  const briefs = json('content/ai-task-briefs.json');
  for (const id of RETOS) {
    assert.match(briefs[id].output, /^Página de resultado con /u, id);
    assert.doesNotMatch(briefs[id].output, /caso real|citas falsas|ejecución presupuestal|Canva|Excel|Word|PDF/u, id);
  }
  assert.doesNotMatch(read('content/ai-task-briefs.json'), /Verifica el Centro A con un cálculo independiente si tienes ejecución/u);
});

test('el banco de decisiones solo cita archivos de práctica existentes y no usa normas ajenas al curso', () => {
  const raw = read('content/challenge-decisions.json');
  const names = new Set(raw.match(/[\w-]+\.csv/gu));
  for (const name of names) {
    const exists = ['materiales/retos', 'materiales/ia/fuentes-comunes'].some(dir => fs.existsSync(path.join(ROOT, dir, name)));
    assert.ok(exists, `No existe el archivo citado: ${name}`);
  }
  assert.doesNotMatch(raw, /Ley 1952|Control Interno Disciplinario|CPACA|Contencioso|Estatuto Orgánico|circular oficial|fecha de grado|URGENTÍSIMO|error 500|Carlos Pérez|14:20/u);
  const transcript = read('materiales/retos/transcripcion.csv');
  for (const [, minute] of raw.matchAll(/minutos? (\d\d:\d\d)/gu)) {
    assert.match(transcript, new RegExp(`^${minute};`, 'mu'), `Minuto ${minute} ausente en la transcripción`);
  }
  assert.match(read('materiales/retos/correos-50.csv'), /^C-001;[^\n]*Portal de inscripción[^\n]*;35;Hoy 16:00/mu);
  assert.doesNotMatch(read('content/case-practices.json'), /[\s(]\.\d{3}\.\d{3}/u);
});

test('las situaciones de oficina quedan iguales en sus cuatro copias y sin promesas legales', () => {
  const files = ['content/office-situations.json', 'js/office-situations-selector.js', 'content/home.html', 'content/portfolio.html'];
  for (const file of files) {
    const text = read(file);
    assert.doesNotMatch(text, /términos legales|Ley 1755|Deep Research|ChatGPT Enterprise|Falsa \/ No consta|citas falsas|Retos 3, 7, 9 e Integrador/u, file);
  }
  const situations = json('content/office-situations.json').situations;
  const integradorSit = situations.find(item => item.challengeId === 'reto-integrador');
  assert.equal(integradorSit.challengeId, 'reto-integrador');
  assert.equal(integradorSit.challengeLink, '#m05-cierre');
});

test('la página publicada enseña CRTT y flujos antes de evaluarlos y cierra con el mapa de capacidades', () => {
  const dom = new JSDOM(read('index.html'));
  const doc = dom.window.document;
  const map = doc.getElementById('mapa-herramientas');
  assert.ok(map, 'Falta el mapa de herramientas en la preparación');
  assert.ok(map.closest('#preparacion'), 'El mapa debe estar en la preparación');
  assert.equal(map.querySelectorAll('tbody tr').length, 10);
  for (const tool of ['Canva', 'Excel', 'Word', 'NotebookLM', 'Antigravity', 'Gem']) assert.match(map.textContent, new RegExp(tool, 'u'), tool);

  const primer = doc.querySelector('#m01-fundamentos [data-crtt-primer]');
  assert.ok(primer, 'El Módulo 1 debe explicar CRTT antes del Reto 1');
  for (const part of ['Contexto', 'Rol', 'Tarea', 'Tono']) assert.match(primer.textContent, new RegExp(part, 'u'));
  assert.ok(doc.querySelector('#m03-implementacion [data-flow-primer]'), 'El Módulo 3 debe explicar el diagrama de flujo');

  assert.equal(doc.querySelectorAll('[data-challenge-stage="3"] .stage-office-step').length, RETOS.length);
  assert.equal(doc.querySelectorAll('[data-challenge-stage="1"] .stage-crtt-tip').length, 7);

  for (const id of ['ratio-numerator', 'ratio-denominator']) assert.equal(doc.getElementById(id).readOnly, false, id);

  const recap = doc.getElementById('lo-que-ya-sabes-hacer');
  assert.ok(recap && recap.closest('#portafolio'), 'El portafolio debe cerrar con las capacidades practicadas');
  assert.equal(recap.querySelectorAll('tbody tr').length, 8);
  assert.match(recap.textContent, /no cubre/u);
  assert.doesNotMatch(doc.body.innerHTML, /\{\{LAB_[A-Z_]+\}\}/u);
  dom.window.close();
});
