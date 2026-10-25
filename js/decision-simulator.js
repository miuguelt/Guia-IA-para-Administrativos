(function (root, factory) {
  'use strict';
  const simulator = factory();
  if (typeof module === 'object' && module.exports) module.exports = simulator;
  if (root) root.DecisionSimulator = simulator;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';

  const NODES = {
    q1: {
      text: '¿La tarea requiere aprobar, autorizar, decidir sobre personas o confirmar datos que no están en la fuente?',
      yes: 'r_human1',
      no: 'q2'
    },
    q2: {
      text: '¿La tarea consiste en reglas exactas (contar, sumar, filtrar datos vacíos, aplicar formatos)?',
      yes: 'r_rule',
      no: 'q3'
    },
    q3: {
      text: '¿La tarea requiere estimar resultados futuros a partir de datos históricos?',
      yes: 'r_predictive',
      no: 'q4'
    },
    q4: {
      text: '¿La tarea consiste en redactar, resumir, extraer conceptos, o estructurar texto libre a partir de una fuente dada?',
      yes: 'r_generative',
      no: 'r_human2'
    },
    r_human1: {
      text: '<strong>REVISIÓN HUMANA:</strong> La IA no puede asumir tu responsabilidad ni inventar autorizaciones. Esta tarea requiere tu criterio.',
      isResult: true
    },
    r_human2: {
      text: '<strong>REVISIÓN HUMANA:</strong> Para tareas no definidas por los otros casos, lo mejor es mantener la ejecución bajo el criterio de una persona.',
      isResult: true
    },
    r_rule: {
      text: '<strong>REGLA AUTOMATIZADA:</strong> Usa fórmulas o macros para aplicar pasos reproducibles. Comprueba las entradas, las reglas y el resultado.',
      isResult: true
    },
    r_predictive: {
      text: '<strong>IA PREDICTIVA:</strong> Usa un modelo predictivo. Requiere entrenamiento con datos pertinentes y una validación rigurosa.',
      isResult: true
    },
    r_generative: {
      text: '<strong>IA GENERATIVA:</strong> Usa un asistente como Gemini, ChatGPT o Claude para procesar el texto, pero siempre verifica sus resultados.',
      isResult: true
    }
  };

  function createInitialState() {
    return { currentNode: 'q1' };
  }

  function answerQuestion(nodeId, answer) {
    const node = NODES[nodeId];
    if (!node || node.isResult) return null;
    const nextNodeId = answer === 'yes' ? node.yes : node.no;
    const nextNode = NODES[nextNodeId];
    return {
      node: nextNodeId,
      isResult: !!nextNode.isResult,
      text: nextNode.text
    };
  }

  function render(document, root, state) {
    const questionDiv = root.querySelector('.decision-question');
    const resultDiv = root.querySelector('#decision-result');
    const questionText = root.querySelector('#decision-question-text');
    const resultText = root.querySelector('#decision-result-text');

    const node = NODES[state.currentNode];

    if (node.isResult) {
      questionDiv.hidden = true;
      resultDiv.hidden = false;
      resultText.innerHTML = node.text;
    } else {
      questionDiv.hidden = false;
      resultDiv.hidden = true;
      questionText.textContent = node.text;
    }
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
          render(document, root, state);
        }
      });
    });

    const resetBtn = root.querySelector('#decision-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state = createInitialState();
        render(document, root, state);
      });
    }

    root.dataset.ready = 'true';
    render(document, root, state);
    return true;
  }

  return {
    NODES,
    createInitialState,
    answerQuestion,
    init
  };
});
