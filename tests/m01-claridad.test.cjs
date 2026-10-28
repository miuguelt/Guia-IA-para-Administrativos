const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { visibleWords, visibleButtons } = require('./helpers/visible-words.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function moduleOne() {
  const dom = new JSDOM(read('index.html'));
  const page = dom.window.document.getElementById('m01-fundamentos');
  return { dom, page, learn: page.querySelector('[data-panel="aprende"]') };
}

test('Aprende recorre tres pasos en el orden de la práctica', () => {
  const { dom, learn } = moduleOne();
  const steps = [...learn.querySelectorAll('[data-m01-step]')];
  assert.deepEqual(steps.map(step => step.dataset.m01Step), ['1', '2', '3']);
  const targets = steps.map(step => step.querySelector('[data-practice-in]')?.textContent ?? '');
  assert.match(targets[0], /Reto 0/u);
  assert.match(targets[1], /Reto 1/u);
  assert.match(targets[2], /diagnóstico/iu);
  assert.equal(steps[0].querySelector('[data-open-challenge]')?.dataset.openChallenge, 'reto-0');
  assert.equal(steps[1].querySelector('[data-open-challenge]')?.dataset.openChallenge, 'reto-1');
  dom.window.close();
});

test('cada paso enseña con la solicitud de sala que usan los retos', () => {
  const { dom, learn } = moduleOne();
  const [data, roles, task] = learn.querySelectorAll('[data-m01-step]');
  for (const verb of ['Usar', 'Reducir', 'No cargar']) assert.match(data.textContent, new RegExp(verb, 'u'));
  assert.equal(data.querySelectorAll('.data-safety-card').length, 3);
  const rows = [...roles.querySelectorAll('tbody tr')].map(row => row.cells[0].textContent.trim());
  assert.deepEqual(rows, ['Regla', 'IA', 'Persona']);
  assert.match(roles.textContent, /sede.*fecha.*franja/su);
  assert.match(roles.textContent, /Contexto, Rol, Tarea y Tono/u);
  assert.match(roles.textContent, /Logística/u);
  assert.equal(task.querySelectorAll('.task-step').length, 4);
  assert.match(task.textContent, /pendiente/u);
  assert.match(task.textContent, /no calculas ni cronometras/iu);
  const copy = task.querySelector('[data-copy]');
  assert.ok(copy, 'El paso 3 debe ofrecer una instrucción lista para copiar');
  const prompt = task.querySelector(`#${copy.dataset.copy}`);
  assert.ok(prompt, 'El botón debe copiar una instrucción existente');
  assert.match(prompt.textContent, /no apruebes/iu);
  assert.match(prompt.textContent, /pendiente/iu);
  assert.doesNotMatch(task.textContent, /anota cuánto tarda|tiempo de partida/iu);
  dom.window.close();
});

test('Aprende evita la jerga de radicación y no se adelanta a explicar CRTT', () => {
  const { dom, learn } = moduleOne();
  assert.doesNotMatch(learn.textContent, /radicaci[oó]n|SOFIA|triaje|V[ií]a 1/u);
  assert.equal(learn.querySelector('.triage-concept-block, .module-roadmap-connection'), null);
  assert.doesNotMatch(learn.querySelector('.module-brief').textContent, /CRTT/u);
  dom.window.close();
});

test('la lectura visible de Aprende cabe en 900 palabras', () => {
  const { dom, learn } = moduleOne();
  const words = visibleWords(learn);
  assert.ok(words <= 900, `Aprende muestra ${words} palabras`);
  dom.window.close();
});

test('el conteo visible no incluye el contenido de los desplegables cerrados', () => {
  const dom = new JSDOM('<div id="p"><p>uno dos</p><details><summary>tres</summary><p>oculto oculto oculto</p><button>no</button></details><details open><summary>cuatro</summary><p>cinco</p><button>sí</button></details><p hidden>oculto</p><script>x y</script><a class="button">ir</a><div class="phase-footer">pie <button>no</button></div></div>');
  const node = dom.window.document.getElementById('p');
  assert.equal(visibleWords(node), 7);
  assert.equal(visibleButtons(node), 2);
  dom.window.close();
});

test('el ejemplo breve de Aprende orienta los pasos sin repetir el mensaje de la sala', () => {
  const { dom, learn } = moduleOne();
  const mini = learn.querySelector('[data-ai-mini-example]');
  assert.ok(mini, 'cada lección conserva su ejemplo breve');
  assert.doesNotMatch(mini.textContent, /18 personas/u, 'el mensaje ya aparece en la introducción');
  assert.match(mini.textContent, /compart/iu);
  assert.match(mini.textContent, /describ/iu);
  dom.window.close();
});

test('la duración de Aprende describe lo que realmente contiene Observa', () => {
  const { dom, learn } = moduleOne();
  const timing = learn.querySelector('.learning-timing');
  assert.equal(timing.dataset.minutes, '45');
  assert.doesNotMatch(timing.textContent, /dos preguntas/u);
  assert.match(timing.textContent, /Observa/u);
  dom.window.close();
});

test('en Observa los simuladores vienen después de las preguntas del paso Comprueba', () => {
  const { dom, page } = moduleOne();
  const stage = page.querySelector('#practice-m01-fundamentos-2');
  const tools = stage.querySelector('.case-tools');
  const questions = [...stage.querySelectorAll('.case-question')];
  assert.ok(tools && questions.length >= 1);
  const last = questions.at(-1);
  assert.ok(last.compareDocumentPosition(tools) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING, 'los simuladores no interrumpen las preguntas');
  assert.match(tools.querySelector('summary').textContent, /Refuerza/u);
  assert.match(stage.querySelector('#anonymization-simulator').textContent, /paso 1/iu);
  assert.match(stage.querySelector('#decision-simulator').textContent, /paso 2/iu);
  dom.window.close();
});

test('el anonimizador ofrece las mismas tres decisiones que el semáforo y no muestra códigos', () => {
  const { dom, page } = moduleOne();
  const simulator = page.querySelector('#anonymization-simulator');
  const choices = [...simulator.querySelectorAll('[data-anon-choice]')];
  assert.deepEqual(choices.map(button => button.dataset.anonChoice), ['usar', 'reducir', 'no-cargar']);
  assert.deepEqual(choices.map(button => button.textContent.trim()), ['Usar', 'Reducir', 'No cargar']);
  for (const button of simulator.querySelectorAll('button')) assert.doesNotMatch(button.textContent, /MG-A0/u);
  assert.doesNotMatch(simulator.textContent, /semiprivad|prohibido/iu);
  dom.window.close();
});

test('el simulador de decisión usa la solicitud de sala y el reparto Regla, IA y Persona', () => {
  const { dom, page } = moduleOne();
  const simulator = page.querySelector('#decision-simulator');
  assert.ok(simulator.querySelector('#decision-progress'));
  assert.ok(simulator.querySelector('#decision-question-example'));
  assert.match(simulator.querySelector('.tool-lab-heading').textContent, /Regla, IA o Persona/u);
  assert.doesNotMatch(simulator.textContent, /predictiva|Generativa/iu);
  dom.window.close();
});

test('las preguntas de opción múltiple no piden completar un cálculo', () => {
  const { dom, page } = moduleOne();
  for (const feedback of page.querySelectorAll('[data-panel="observa"] [data-case-feedback]')) {
    assert.doesNotMatch(feedback.textContent, /cálculo/u);
  }
  dom.window.close();
});

test('el cierre de Resuelve nombra el paso final y conecta con el módulo 02', () => {
  const { dom, page } = moduleOne();
  const diagnosis = page.querySelector('[data-panel="resuelve"] [data-diagnosis]');
  const summary = diagnosis.querySelector('summary');
  assert.match(summary.textContent, /^Paso final: cierra el diagnóstico de tu tarea/u);
  const minutes = summary.querySelector('[data-mode-only="aula"]');
  assert.ok(minutes, 'la duración del curso con instructor solo se muestra en modo aula');
  assert.match(minutes.textContent, /135 min/u);
  const bridge = diagnosis.querySelector('.transfer-tip');
  assert.match(bridge.textContent, /Reto 1/u);
  assert.match(bridge.textContent, /varias solicitudes/u);
  dom.window.close();
});
