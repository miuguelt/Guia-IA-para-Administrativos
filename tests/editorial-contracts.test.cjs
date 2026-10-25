const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const read = file => fs.readFileSync(file, 'utf8');

test('el cierre de MG-A02 usa los casos de la ruta base y conserva la variante jurídica aparte', () => {
  const registry = JSON.parse(read('deliverables.registry.json'));
  const artifact = registry.artifacts.find(item => item.id === 'MG-A02');
  assert.match(artifact.instructions, /PC-01.*PC-03/u);
  assert.doesNotMatch(artifact.instructions, /VJ-01/u);
  const tasks = JSON.parse(read('content/ai-task-briefs.json'));
  assert.match(tasks['variante-juridica'].chatPrompt, /VJ-01/u);
});

test('las instrucciones de preparación no ofrecen importar una evidencia curricular inexistente', () => {
  const task = JSON.parse(read('content/ai-task-briefs.json')).preparacion;
  assert.equal(task.artifactId, null);
  for (const prompt of [task.chatPrompt, task.idePrompt]) {
    assert.doesNotMatch(prompt, /pegar el bloque JSON completo en «Guarda tu evidencia»/iu);
    assert.match(prompt, /comprobacion: Comprobación/u);
  }
});

test('las explicaciones de porcentaje incluyen la conversión a porcentaje', () => {
  for (const file of ['content/challenge-guidance.json', 'content/ai-task-briefs.json', 'js/interactive-aids-data.js', 'docs/validacion-con-aprendices.md']) {
    assert.doesNotMatch(read(file), /42 ÷ 840 = 5\s*%/u, file);
  }
});

test('la práctica distingue la preparación del aprendiz de la evaluación del instructor', () => {
  const { Simulator } = require('../js/case-practices.js');
  const dom = new JSDOM(read('index.html'), { url: 'https://guia.example/' });
  const root = dom.window.document.querySelector('[data-case-id]');
  new Simulator({ container: root }).render();
  assert.match(root.querySelector('[data-case-summary]').textContent, /evaluación de la evidencia corresponde al instructor/u);
  assert.doesNotMatch(root.textContent, /no aprueba una evidencia/u);
  dom.window.close();
});

test('las ayudas explican capacidades y riesgos sin garantizar resultados', () => {
  const data = require('../js/interactive-aids-data.js');
  const explanations = data.SAFETY_SCENARIOS.map(item => item.explanation).join(' ');
  assert.doesNotMatch(explanations, /asegura un tono claro|ahorra tiempo de redacción/u);
  assert.doesNotMatch(data.PROMPT_COMPARISONS.pqrs.vague.riskAnalysis, /generarás un reclamo oficial/u);
  const decision = require('../js/decision-simulator.js').answerQuestion('q2', 'yes');
  assert.match(decision.text, /comprueba|verifica/iu);
});

test('las instrucciones del laboratorio distinguen la versión web al generar el PDF', () => {
  const dom = new JSDOM(read('content/analisis-datos/laboratorios.html'));
  const notes = [...dom.window.document.querySelectorAll('.result-skeleton')];
  assert.equal(notes.length, 5);
  assert.ok(notes.every(note => /versión web/u.test(note.textContent)));
  dom.window.close();
});

test('el paquete documental nombra el espacio de entrega vigente', () => {
  assert.doesNotMatch(read('materiales/analisis-datos/documentos/fichas-corpus.md'), /en Documenta/u);
  assert.match(read('materiales/analisis-datos/documentos/fichas-corpus.md'), /«Guarda tu evidencia»/u);
});
