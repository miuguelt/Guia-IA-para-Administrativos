const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { visibleWords } = require('./helpers/visible-words.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function moduleTwo() {
  const dom = new JSDOM(read('index.html'));
  const page = dom.window.document.getElementById('m02-diseno');
  return { dom, page, learn: page.querySelector('[data-panel="aprende"]') };
}

test('Aprende del módulo 02 recorre cuatro pasos ligados a sus retos', () => {
  const { dom, learn } = moduleTwo();
  const steps = [...learn.querySelectorAll('[data-lesson-step]')];
  assert.deepEqual(steps.map(step => step.dataset.lessonStep), ['1', '2', '3', '4']);
  for (const step of steps) assert.equal(step.closest('details'), null, 'los pasos se leen sin abrir desplegables');
  const targets = steps.map(step => step.querySelector('[data-practice-in]')?.textContent ?? '');
  assert.match(targets[0], /Reto 2/u);
  assert.match(targets[1], /Reto 2/u);
  assert.match(targets[2], /Reto 3/u);
  assert.match(targets[3], /Reto 3/u);
  assert.deepEqual(steps.map(step => step.querySelector('[data-open-challenge]')?.dataset.openChallenge),
    ['reto-2', 'reto-2', 'reto-3', 'reto-3']);
  dom.window.close();
});

test('cada paso enseña con los casos PQRS que usan los retos', () => {
  const { dom, learn } = moduleTwo();
  const [read1, task, proof] = learn.querySelectorAll('[data-lesson-step]');
  assert.equal(read1.querySelectorAll('.data-safety-card').length, 3);
  for (const word of [/pide/iu, /afirma/iu, /pendiente/iu]) assert.match(read1.textContent, word);
  assert.match(read1.textContent, /PC-01/u);
  assert.ok(task.querySelector('a[href="#crtt"]'), 'el paso 2 remite a la explicación de CRTT');
  assert.doesNotMatch(task.textContent, /Contexto,?\s+Rol,?\s+Tarea/u, 'CRTT se define solo en #crtt');
  const copy = task.querySelector('[data-copy]');
  assert.ok(copy, 'el paso 2 ofrece una instrucción lista para copiar');
  const prompt = task.querySelector(`#${copy.dataset.copy}`);
  assert.ok(prompt, 'el botón copia una instrucción existente');
  assert.match(prompt.textContent, /PC-01/u);
  assert.match(prompt.textContent, /No presentes .* como confirmados/u);
  assert.match(task.textContent, /área responsable/u);
  const draft = task.querySelector('[data-draft-example]');
  assert.ok(draft, 'el paso 2 muestra cómo se ve un buen borrador');
  assert.match(draft.textContent, /área responsable/u);
  const rows = [...proof.querySelectorAll('tbody tr')].map(row => row.textContent);
  assert.equal(rows.length, 3, 'el paso 3 prueba tres casos nuevos');
  for (const [index, code] of ['PC-02', 'PC-05', 'PC-07'].entries()) assert.match(rows[index], new RegExp(code, 'u'));
  assert.match(proof.textContent, /versión 1/iu);
  assert.match(proof.textContent, /versión 2/iu);
  assert.ok(proof.querySelector('[data-added-line]'), 'el paso 3 muestra la línea que corrige el fallo');
  assert.match(proof.textContent, /repite/iu);
  dom.window.close();
});

test('Aprende del módulo 02 evita la jerga legal y el diagrama de cinco columnas', () => {
  const { dom, page, learn } = moduleTwo();
  assert.doesNotMatch(learn.textContent, /radicaci[oó]n|1755|1437|aislamiento|jam[aá]s|triaje|actos administrativos|probatorio/iu);
  assert.equal(page.querySelector('.triage-concept-block'), null);
  assert.doesNotMatch(learn.querySelector('.learning-timing').textContent, /compositor/u);
  dom.window.close();
});

test('la lectura visible de Aprende del módulo 02 cabe en 900 palabras', () => {
  const { dom, learn } = moduleTwo();
  const words = visibleWords(learn);
  assert.ok(words <= 900, `Aprende muestra ${words} palabras`);
  dom.window.close();
});

test('en Observa cada simulador nombra el paso que refuerza y no muestra códigos', () => {
  const { dom, page } = moduleTwo();
  const observe = page.querySelector('[data-panel="observa"]');
  assert.match(observe.querySelector('#prompt-lab .eyebrow').textContent, /paso 2/iu);
  assert.match(observe.querySelector('#prompt-compare-simulator .eyebrow').textContent, /paso 2/iu);
  assert.match(observe.querySelector('#pqrs-evaluator-simulator .eyebrow').textContent, /paso 1/iu);
  for (const button of observe.querySelectorAll('button')) assert.doesNotMatch(button.textContent, /MG-A0/u);
  dom.window.close();
});

test('el paso 4 enseña cuándo usar la IA, una plantilla o a una persona', () => {
  const { dom, learn } = moduleTwo();
  const decide = learn.querySelector('[data-lesson-step="4"]');
  assert.ok(decide, 'existe el paso 4');
  const rows = [...decide.querySelectorAll('tbody tr')];
  assert.ok(rows.length >= 4, 'la tabla compara al menos cuatro situaciones');
  const choices = rows.map(row => row.querySelectorAll('td')[0]?.textContent ?? '').join(' | ');
  for (const option of [/plantilla/iu, /IA con tu instrucción/iu, /instrucción reutilizable/iu, /persona/iu]) assert.match(choices, option);
  assert.match(decide.textContent, /datos personales/iu, 'recuerda que los datos reales no van a un chat no autorizado');
  const questions = [...decide.querySelectorAll('[data-reuse-question]')].map(item => item.textContent);
  assert.equal(questions.length, 3, 'tres preguntas deciden si conviene guardar la instrucción');
  assert.match(questions.join(' '), /repite/iu);
  assert.match(questions.join(' '), /cambia/iu);
  assert.match(questions.join(' '), /comprobar/iu);
  dom.window.close();
});

test('Observa practica la decisión de usar IA sin autorreferencias ni rótulos de ficción', () => {
  const { dom, page } = moduleTwo();
  const observe = page.querySelector('[data-panel="observa"]');
  const text = observe.textContent;
  assert.match(text, /preguntan solo el horario/u);
  assert.match(text, /vale la pena guardar tu instrucción/u);
  assert.doesNotMatch(text, /en «Observa»/u);
  assert.doesNotMatch(text, /Fuente ficticia/u);
  dom.window.close();
});

test('los dilemas de los retos 2 y 3 usan un tono claro y uno decide cuándo usar el asistente', () => {
  const decisions = JSON.parse(read('content/challenge-decisions.json'));
  const text = JSON.stringify(decisions['reto-2']) + JSON.stringify(decisions['reto-3']);
  assert.doesNotMatch(text, /taxativ|resiliencia|nulidad|Vulnerabilidad crítica|Violación|actos administrativos|Parálisis|Foco superficial|Alcance erróneo|agnóstico/iu);
  assert.match(JSON.stringify(decisions['reto-3']), /envíe solas/u, 'el Reto 3 plantea si el asistente puede responder y enviar sin revisión');
});

const catalog = () => JSON.parse(read('content/ai-task-briefs.json'));

test('los retos del módulo 02 usan mensajes en la página sin la respuesta escrita', () => {
  const tasks = catalog();
  for (const key of ['reto-2', 'reto-3', 'MG-A02', 'variante-juridica']) {
    const task = tasks[key];
    assert.deepEqual(task.sourceFiles, [], `${key}: no se descarga ni se adjunta un archivo`);
    assert.ok(task.inlineSources?.length, `${key}: trae los mensajes en el encargo`);
    const texts = task.inlineSources.map(source => source.text).join(' ');
    assert.doesNotMatch(texts, /Dato faltante|cuidado|Punto que revisa|No se indica|no hay fecha nueva|queda por confirmar/iu, `${key}: la fuente no trae la respuesta`);
    assert.doesNotMatch(task.chatPrompt, /pqrs-complejas\.csv|numeración de Excel/u, key);
  }
  const testCases = tasks['reto-3'].inlineSources.map(source => source.text).join(' ');
  for (const code of ['PC-02', 'PC-05', 'PC-07']) assert.match(testCases, new RegExp(code, 'u'));
  assert.doesNotMatch(testCases, /PC-01|PC-03/u, 'el Reto 3 prueba con casos que no se usaron para escribir la instrucción');
  assert.match(tasks['reto-3'].chatPrompt, /versión 1.*Reto 2/su);
  assert.match(tasks['reto-3'].chatPrompt, /PC-07.*persona responsable/su);
  const { dom, page } = moduleTwo();
  for (const id of ['reto-2', 'reto-3']) {
    const card = page.querySelector(`#${id}`);
    assert.ok(card.querySelector('[data-inline-sources]'), `${id}: los mensajes se copian desde la página`);
    assert.equal(card.querySelector('.ai-kit-primary'), null, `${id}: no pide descargar el paquete`);
  }
  assert.doesNotMatch(page.querySelector('[data-panel="observa"]').textContent, /Dato faltante o cuidado/u);
  dom.window.close();
});

test('el Reto 2 pide el intento antes de mostrar la referencia y usa un solo chat', () => {
  const { dom, page } = moduleTwo();
  const coached = page.querySelector('#reto-2 .ai-task-coached');
  assert.equal(coached.dataset.support, 'huecos');
  assert.equal(coached.querySelector('.crtt-annotated'), null, 'la referencia no aparece antes del intento');
  const steps = [...coached.querySelectorAll('.coach-steps > li')].map(item => item.textContent);
  assert.match(steps[0], /chat nuevo/u);
  assert.match(steps[2], /ese mismo chat/u);
  assert.doesNotMatch(steps.join(' '), /misma conversación/u);
  dom.window.close();
});

test('Observa del módulo 02 nombra sus etapas por la acción y evita la jerga', () => {
  const { dom, page } = moduleTwo();
  const observe = page.querySelector('[data-panel="observa"]');
  const stages = [...observe.querySelectorAll('[data-case-stage] > h4')].map(title => title.textContent);
  assert.deepEqual(stages, ['1. Lee los mensajes', '2. Separa lo que piden', '3. Arma la instrucción', '4. Revisa y decide']);
  assert.doesNotMatch(observe.textContent, /discrepancia|fuente autorizada|contrastarse|Consulta los extractos conservados/iu);
  const ids = JSON.parse(observe.querySelector('[data-case-spec]').textContent).questions.map(question => question.id);
  assert.equal(ids.filter(id => /pc01/u.test(id)).length, 0, 'PC-01 ya se resolvió en Aprende; la práctica usa PC-02 y PC-03');
  dom.window.close();
});

test('el módulo 02 nombra CRTT siempre igual: cuatro partes más fuente, límites y salida', () => {
  const tasks = catalog();
  for (const key of ['reto-3', 'MG-A02']) {
    assert.doesNotMatch(tasks[key].chatPrompt, /formato y criterio de aceptación/u, key);
    assert.match(tasks[key].chatPrompt, /CRTT \(contexto, rol, tarea y tono\) más fuente, límites y salida/u, key);
  }
  const registry = JSON.parse(read('deliverables.registry.json'));
  const field = registry.artifacts.find(item => item.id === 'MG-A02').fields.find(item => item.key === 'prompt_maestro_rcirs');
  assert.match(field.hint, /más fuente, límites y salida/u);
});
