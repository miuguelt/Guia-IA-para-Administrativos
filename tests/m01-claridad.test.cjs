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

test('Aprende recorre cuatro pasos y cada uno remite a su práctica', () => {
  const { dom, learn } = moduleOne();
  const steps = [...learn.querySelectorAll('[data-m01-step]')];
  assert.deepEqual(steps.map(step => step.dataset.m01Step), ['1', '2', '3', '4']);
  const targets = steps.map(step => step.querySelector('[data-practice-in]')?.textContent ?? '');
  assert.match(targets[0], /Reto 0/u);
  assert.match(targets[1], /Reto 1/u);
  assert.match(targets[2], /Reto 0/u);
  assert.match(targets[3], /diagnóstico/iu);
  assert.deepEqual(steps.slice(0, 3).map(step => step.querySelector('[data-open-challenge]')?.dataset.openChallenge), ['reto-0', 'reto-1', 'reto-0']);
  dom.window.close();
});

test('el paso 1 muestra cinco cargas de trabajo con lo que hace la IA, lo que haces tú y dónde se practica', () => {
  const { dom, page, learn } = moduleOne();
  const cards = [...learn.querySelectorAll('[data-m01-step="1"] .workload-card')];
  assert.deepEqual(cards.map(card => card.dataset.workload), ['correos', 'archivos', 'reuniones', 'datos', 'tareas']);
  const challenges = new Set([...page.ownerDocument.querySelectorAll('.challenge-card')].map(card => card.id));
  for (const card of cards) {
    assert.match(card.textContent, /La IA:/u, card.dataset.workload);
    assert.match(card.textContent, /Tú:/u, card.dataset.workload);
    const practice = card.querySelector('.workload-practice').textContent;
    const numbers = [...practice.matchAll(/\d+/gu)].map(match => `reto-${match[0]}`);
    assert.ok(numbers.length >= 1, card.dataset.workload);
    for (const id of numbers) assert.ok(challenges.has(id), `${card.dataset.workload}: ${id} no existe`);
  }
  const tryIt = learn.querySelector('[data-m01-step="1"] details[data-workload-prompts]:not([open])');
  assert.ok(tryIt, 'las instrucciones «Pruébalo hoy» van juntas y plegadas');
  const buttons = [...tryIt.querySelectorAll('[data-copy]')];
  assert.deepEqual(buttons.map(button => button.dataset.copy), cards.map(card => `m01-try-${card.dataset.workload}`));
  for (const button of buttons) {
    const prompt = page.ownerDocument.getElementById(button.dataset.copy);
    assert.ok(prompt && tryIt.contains(prompt), `${button.dataset.copy}: el botón copia su instrucción`);
    assert.match(prompt.textContent, /no |pendiente|yo /iu, `${button.dataset.copy}: la instrucción marca un límite`);
  }
  dom.window.close();
});

test('los pasos 2 a 4 enseñan quién hace cada parte, el semáforo y la comprobación', () => {
  const { dom, page, learn } = moduleOne();
  const [, roles, data, check] = learn.querySelectorAll('[data-m01-step]');
  const rows = [...roles.querySelectorAll('tbody tr')].map(row => row.cells[0].textContent.trim());
  assert.deepEqual(rows, ['Regla', 'IA', 'Persona']);
  assert.match(roles.textContent, /Contar correos.*sumar una columna/su);
  assert.match(roles.textContent, /la IA no aprueba/u);
  for (const verb of ['Usar', 'Reducir', 'No cargar']) assert.match(data.textContent, new RegExp(verb, 'u'));
  assert.equal(data.querySelectorAll('.data-safety-card').length, 3);
  assert.match(data.textContent, /Ley 1581 de 2012/u);
  assert.equal(check.querySelectorAll('.m01-checks > li').length, 3);
  assert.match(check.textContent, /incluida la revisión/u);
  assert.match(check.textContent, /No calculas ni cronometras/u);
  const copy = check.querySelector('[data-copy]');
  const prompt = page.ownerDocument.getElementById(copy.dataset.copy);
  assert.match(prompt.textContent, /No apruebes nada/u);
  assert.match(prompt.textContent, /pendiente/u);
  assert.doesNotMatch(prompt.textContent, /\[|\]/u, 'la instrucción no deja huecos por llenar');
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

test('el ejemplo breve de Aprende muestra un uso cotidiano con volumen y una decisión humana', () => {
  const { dom, learn } = moduleOne();
  const mini = learn.querySelector('[data-ai-mini-example]');
  assert.ok(mini, 'cada lección conserva su ejemplo breve');
  assert.match(mini.textContent, /30 correos/u);
  assert.match(mini.textContent, /sin remitentes/u);
  assert.match(mini.textContent, /Tú decides/u);
  dom.window.close();
});

test('la duración de Aprende describe lo que realmente contiene Observa', () => {
  const { dom, learn } = moduleOne();
  const timing = learn.querySelector('.learning-timing');
  assert.equal(timing.dataset.minutes, '45');
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
  assert.match(stage.querySelector('#anonymization-simulator').textContent, /paso 3/iu);
  assert.match(stage.querySelector('#decision-simulator').textContent, /paso 2/iu);
  dom.window.close();
});

test('Observa muestra la bandeja y el lineamiento en la página, sin descargas', () => {
  const { dom, page } = moduleOne();
  const source = page.querySelector('#practice-m01-fundamentos-0 [data-case-source]');
  assert.equal(source.querySelectorAll('a[download]').length, 0);
  const headings = [...source.querySelectorAll('.case-source-record h4')].map(node => node.textContent);
  for (const code of ['URG-01', 'SAL-02', 'SAL-05']) assert.ok(headings.includes(`Bandeja · ${code}`), code);
  assert.ok(headings.includes('Lineamiento · Urgencia'));
  assert.match(source.textContent, /no necesitas descargar archivos/u);
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

test('el simulador de decisión usa ejemplos de varias cargas y el reparto Regla, IA y Persona', () => {
  const { dom, page } = moduleOne();
  const simulator = page.querySelector('#decision-simulator');
  assert.ok(simulator.querySelector('#decision-progress'));
  assert.ok(simulator.querySelector('#decision-question-example'));
  assert.match(simulator.querySelector('.tool-lab-heading').textContent, /Regla, IA o Persona/u);
  assert.match(simulator.querySelector('.tool-lab-heading').textContent, /sumar una columna.*correos.*reserva/su);
  assert.doesNotMatch(simulator.textContent, /predictiva|Generativa/iu);
  dom.window.close();
});

test('los retos del módulo 01 entregan sus textos para copiar en lugar de archivos', () => {
  const { dom, page } = moduleOne();
  const expected = { 'reto-0': ['semana'], 'reto-1': ['bandeja', 'lineamiento'] };
  for (const [id, sources] of Object.entries(expected)) {
    const card = page.querySelector(`#${id}`);
    const inline = card.querySelector('[data-challenge-stage="0"] .inline-sources');
    assert.deepEqual([...inline.querySelectorAll('[data-inline-source]')].map(node => node.dataset.inlineSource), sources, id);
    assert.match(card.querySelector('[data-challenge-stage="0"] h4').textContent, /Copia los textos de práctica/u);
    assert.equal(card.querySelectorAll('a[href$=".csv"], a[href$=".zip"]').length, 0, `${id}: no ofrece CSV ni ZIP`);
  }
  assert.equal(page.querySelectorAll('[data-panel="aprende"] a[href$=".csv"], [data-panel="observa"] a[href$=".csv"], [data-panel="resuelve"] a[href$=".csv"]').length, 0);
  const inbox = page.querySelector('#reto-1 [data-inline-source="bandeja"] pre').textContent;
  assert.equal((inbox.match(/^(?:URG|SAL)-\d{2} · /gmu) || []).length, 5);
  const guideline = page.querySelector('#reto-1 [data-inline-source="lineamiento"] pre').textContent;
  assert.equal((guideline.match(/^\d\. /gmu) || []).length, 8);
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
  assert.match(diagnosis.querySelector('#diagnostico-ai-prompt').textContent, /mapa de carga del Reto 0/u);
  const bridge = diagnosis.querySelector('.transfer-tip');
  assert.match(bridge.textContent, /Reto 1/u);
  assert.match(bridge.textContent, /varias solicitudes/u);
  dom.window.close();
});
