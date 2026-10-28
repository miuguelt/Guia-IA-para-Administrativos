(function (root, factory) {
  'use strict';
  const simulator = factory();
  if (typeof module === 'object' && module.exports) module.exports = simulator;
  if (root) root.DecisionSimulator = simulator;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  // Mismo reparto que la tabla del Paso 2: Regla, IA y Persona.
  const NODES = {
    q1: {
      step: 1,
      text: '¿La tarea exige aprobar, autorizar o decidir algo que la fuente no resuelve?',
      example: 'Ejemplo: confirmar si hay sala o decidir cómo atender la urgencia.',
      yes: 'r_persona',
      no: 'q2'
    },
    q2: {
      step: 2,
      text: '¿Basta con comprobar si un dato está o no está, sin redactar nada?',
      example: 'Ejemplo: revisar si la solicitud trae sede, fecha y franja horaria.',
      yes: 'r_regla',
      no: 'q3'
    },
    q3: {
      step: 3,
      text: '¿Hay que redactar, resumir u ordenar texto a partir de una fuente autorizada?',
      example: 'Ejemplo: escribir el mensaje que pide los datos que faltan.',
      yes: 'r_ia',
      no: 'r_delimitar'
    },
    r_persona: {
      isResult: true,
      label: 'Persona',
      reason: 'Aprobar es una responsabilidad. Logística confirma la sala o propone alternativas; la IA puede preparar el borrador, pero no aprueba ni inventa autorizaciones.'
    },
    r_regla: {
      isResult: true,
      label: 'Regla',
      reason: 'Una lista de chequeo o una fórmula detecta si falta sede, fecha o franja. No necesita IA; comprueba que la lista incluya todos los campos del lineamiento.'
    },
    r_ia: {
      isResult: true,
      label: 'IA',
      reason: 'El asistente redacta el borrador con la fuente que le entregas. Tú lo revisas contra esa fuente antes de usarlo.'
    },
    r_delimitar: {
      isResult: true,
      label: 'Persona',
      reason: 'La tarea todavía no está delimitada. Descríbela con el Paso 3 (entrada, pasos, salida y control) y vuelve a responder.'
    }
  };

  const TOTAL_QUESTIONS = 3;

  // Las tres tareas de la solicitud de sala y las respuestas que las describen.
  const CASE_TASKS = {
    approve: { label: 'Aprobar la sala', answers: ['yes'] },
    detect: { label: 'Detectar datos faltantes', answers: ['no', 'yes'] },
    draft: { label: 'Redactar el mensaje', answers: ['no', 'no', 'yes'] }
  };

  function createInitialState() {
    return { currentNode: 'q1' };
  }

  function answerQuestion(nodeId, answer) {
    const node = NODES[nodeId];
    if (!node || node.isResult) return null;
    const nextNodeId = answer === 'yes' ? node.yes : node.no;
    const nextNode = NODES[nextNodeId];
    return { node: nextNodeId, isResult: Boolean(nextNode.isResult), label: nextNode.label, text: nextNode.reason || nextNode.text };
  }

  function walk(answers) {
    let nodeId = 'q1';
    for (const answer of answers) {
      const next = answerQuestion(nodeId, answer);
      if (!next) return null;
      nodeId = next.node;
    }
    return NODES[nodeId].isResult ? NODES[nodeId] : null;
  }

  function render(root, state) {
    const questionDiv = root.querySelector('.decision-question');
    const resultDiv = root.querySelector('#decision-result');
    const questionText = root.querySelector('#decision-question-text');
    const example = root.querySelector('#decision-question-example');
    const progress = root.querySelector('#decision-progress');
    const resultText = root.querySelector('#decision-result-text');
    const node = NODES[state.currentNode];

    questionDiv.hidden = Boolean(node.isResult);
    resultDiv.hidden = !node.isResult;
    if (node.isResult) {
      const label = root.ownerDocument.createElement('strong');
      label.textContent = node.label;
      resultText.replaceChildren(label, `: ${node.reason}`);
      return;
    }
    questionText.textContent = node.text;
    if (example) example.textContent = node.example;
    if (progress) progress.textContent = `Pregunta ${node.step} de ${TOTAL_QUESTIONS}`;
  }

  function init(options = {}) {
    const document = options.document || (typeof window === 'undefined' ? null : window.document);
    if (!document) return false;
    const root = document.querySelector('#decision-simulator');
    if (!root) return false;
    if (root.dataset.ready === 'true') return true;

    let state = createInitialState();

    root.querySelectorAll('[data-decision]').forEach(button => {
      button.addEventListener('click', () => {
        const next = answerQuestion(state.currentNode, button.dataset.decision);
        if (next) {
          state.currentNode = next.node;
          render(root, state);
          const win = document.defaultView;
          if (next.isResult && win) win.dispatchEvent(new win.CustomEvent('simulator:completed', { detail: { simulatorId: 'decision' } }));
        }
      });
    });

    const resetBtn = root.querySelector('#decision-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state = createInitialState();
        render(root, state);
      });
    }

    root.dataset.ready = 'true';
    render(root, state);
    return true;
  }

  return { NODES, CASE_TASKS, createInitialState, answerQuestion, walk, init };
});
