const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const simulator = require('../js/decision-simulator.js');

const markup = `
  <div id="decision-simulator">
    <div class="decision-question">
      <p id="decision-progress"></p>
      <p id="decision-question-text"></p>
      <p id="decision-question-example"></p>
      <button data-decision="yes">Sí</button>
      <button data-decision="no">No</button>
    </div>
    <div id="decision-result" hidden>
      <p id="decision-result-text"></p>
      <button id="decision-reset">Volver a empezar</button>
    </div>
  </div>
`;

function mount(html = markup) {
  const dom = new JSDOM(html);
  return { dom, document: dom.window.document };
}

test('el simulador arranca en la primera pregunta con su ejemplo de la solicitud de sala', () => {
  const { document } = mount();
  assert.equal(simulator.init({ document }), true);
  assert.equal(simulator.init({ document }), true, 'una segunda inicialización no duplica eventos');
  assert.match(document.getElementById('decision-question-text').textContent, /aprobar|autorizar/iu);
  assert.match(document.getElementById('decision-question-example').textContent, /sala|urgencia/iu);
  assert.equal(document.getElementById('decision-progress').textContent, 'Pregunta 1 de 3');
});

test('init devuelve false sin documento o sin el simulador en la página', () => {
  assert.equal(simulator.init({ document: null }), false);
  assert.equal(simulator.init({ document: new JSDOM('<p>sin simulador</p>').window.document }), false);
});

test('cada resultado es Regla, IA o Persona, como la tabla del Paso 2', () => {
  const results = Object.values(simulator.NODES).filter(node => node.isResult);
  assert.ok(results.length >= 3);
  for (const node of results) {
    assert.ok(['Regla', 'IA', 'Persona'].includes(node.label), `resultado inesperado: ${node.label}`);
    assert.ok(node.reason.length > 40, 'cada resultado explica el porqué');
  }
  assert.deepEqual([...new Set(results.map(node => node.label))].sort(), ['IA', 'Persona', 'Regla']);
});

test('las tres tareas de la solicitud de sala llegan al responsable correcto', () => {
  assert.equal(simulator.walk(simulator.CASE_TASKS.approve.answers).label, 'Persona');
  assert.equal(simulator.walk(simulator.CASE_TASKS.detect.answers).label, 'Regla');
  assert.equal(simulator.walk(simulator.CASE_TASKS.draft.answers).label, 'IA');
  assert.equal(simulator.walk(['no', 'no', 'no']).label, 'Persona', 'una tarea sin delimitar vuelve a la persona');
  assert.equal(simulator.walk(['no', 'no', 'no', 'yes']), null, 'respuestas sobrantes no producen resultado');
  assert.equal(simulator.walk(['no']), null, 'un recorrido incompleto no produce resultado');
});

test('answerQuestion avanza por el árbol y rechaza nodos finales o desconocidos', () => {
  assert.equal(simulator.createInitialState().currentNode, 'q1');
  assert.equal(simulator.answerQuestion('q1', 'no').node, 'q2');
  assert.equal(simulator.answerQuestion('q1', 'yes').isResult, true);
  assert.equal(simulator.answerQuestion('r_persona', 'yes'), null);
  assert.equal(simulator.answerQuestion('nada', 'yes'), null);
});

test('el simulador no nombra marcas comerciales ni se sale del alcance del módulo', () => {
  const text = JSON.stringify(simulator.NODES);
  assert.doesNotMatch(text, /Gemini|ChatGPT|Claude|Copilot|predictiv|macro/iu);
  assert.doesNotMatch(text, /<[a-z]/iu, 'los textos no llevan HTML');
});

test('la interfaz muestra el progreso, el resultado con su porqué y permite reiniciar', () => {
  const { document } = mount();
  simulator.init({ document });
  const yes = document.querySelector('[data-decision="yes"]');
  const no = document.querySelector('[data-decision="no"]');
  const question = document.querySelector('.decision-question');
  const result = document.getElementById('decision-result');

  no.click();
  assert.equal(document.getElementById('decision-progress').textContent, 'Pregunta 2 de 3');
  assert.match(document.getElementById('decision-question-text').textContent, /dato está o no está/iu);

  yes.click();
  assert.equal(result.hidden, false);
  assert.equal(question.hidden, true);
  const resultText = document.getElementById('decision-result-text');
  assert.equal(resultText.querySelector('strong').textContent, 'Regla');
  assert.match(resultText.textContent, /sede, fecha (?:o|y) franja/iu);

  document.getElementById('decision-reset').click();
  assert.equal(result.hidden, true);
  assert.equal(question.hidden, false);
  assert.equal(document.getElementById('decision-progress').textContent, 'Pregunta 1 de 3');
});

test('la interfaz funciona aunque falten los elementos opcionales de progreso y ejemplo', () => {
  const { document } = mount(markup.replace('<p id="decision-progress"></p>', '').replace('<p id="decision-question-example"></p>', '').replace('<button id="decision-reset">Volver a empezar</button>', ''));
  assert.equal(simulator.init({ document }), true);
  document.querySelector('[data-decision="yes"]').click();
  assert.equal(document.getElementById('decision-result-text').querySelector('strong').textContent, 'Persona');
});

test('al llegar a un resultado avisa al progreso que el simulador se completó', () => {
  const { dom, document } = mount();
  const events = [];
  dom.window.addEventListener('simulator:completed', event => events.push(event.detail.simulatorId));
  simulator.init({ document });
  document.querySelector('[data-decision="no"]').click();
  assert.deepEqual(events, [], 'una pregunta intermedia no completa el simulador');
  document.querySelector('[data-decision="yes"]').click();
  assert.deepEqual(events, ['decision']);
});
