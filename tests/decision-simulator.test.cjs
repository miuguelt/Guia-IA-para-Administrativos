const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

const simulator = require('../js/decision-simulator.js');

test('Decision simulator initializes correctly', () => {
  const dom = new JSDOM(`
    <div id="decision-simulator">
      <p id="decision-question-text"></p>
      <button data-decision="yes">Yes</button>
      <button data-decision="no">No</button>
      <div id="decision-result" hidden>
        <p id="decision-result-text"></p>
        <button id="decision-reset">Reset</button>
      </div>
      <div class="decision-question"></div>
    </div>
  `);
  const { document } = dom.window;
  const initResult = simulator.init({ document });
  assert.equal(initResult, true);
  assert.match(document.getElementById('decision-question-text').textContent, /aprobar, autorizar/i);
});

test('Decision simulator logic flows correctly', () => {
  const state = simulator.createInitialState();
  assert.equal(state.currentNode, 'q1');

  // Route Q1 Yes -> Human
  const res1 = simulator.answerQuestion('q1', 'yes');
  assert.equal(res1.isResult, true);
  assert.match(res1.text, /REVISIÓN HUMANA/);

  // Route Q1 No -> Q2
  const res2 = simulator.answerQuestion('q1', 'no');
  assert.equal(res2.isResult, false);
  assert.equal(res2.node, 'q2');

  // Route Q2 Yes -> Rule
  const res3 = simulator.answerQuestion('q2', 'yes');
  assert.equal(res3.isResult, true);
  assert.match(res3.text, /REGLA AUTOMATIZADA/);

  // Route Q2 No -> Q3
  const res4 = simulator.answerQuestion('q2', 'no');
  assert.equal(res4.isResult, false);
  assert.equal(res4.node, 'q3');

  // Route Q3 Yes -> Predictive
  const res5 = simulator.answerQuestion('q3', 'yes');
  assert.equal(res5.isResult, true);
  assert.match(res5.text, /IA PREDICTIVA/);

  // Route Q3 No -> Q4
  const res6 = simulator.answerQuestion('q3', 'no');
  assert.equal(res6.isResult, false);
  assert.equal(res6.node, 'q4');

  // Route Q4 Yes -> Generative
  const res7 = simulator.answerQuestion('q4', 'yes');
  assert.equal(res7.isResult, true);
  assert.match(res7.text, /IA GENERATIVA/);

  // Route Q4 No -> Human
  const res8 = simulator.answerQuestion('q4', 'no');
  assert.equal(res8.isResult, true);
  assert.match(res8.text, /REVISIÓN HUMANA/);
});

test('UI updates properly on interaction', () => {
  const dom = new JSDOM(`
    <div id="decision-simulator">
      <p id="decision-question-text"></p>
      <button data-decision="yes">Yes</button>
      <button data-decision="no">No</button>
      <div id="decision-result" hidden>
        <p id="decision-result-text"></p>
        <button id="decision-reset">Reset</button>
      </div>
      <div class="decision-question"></div>
    </div>
  `);
  const { document } = dom.window;
  simulator.init({ document });

  const btnNo = document.querySelector('[data-decision="no"]');
  const btnYes = document.querySelector('[data-decision="yes"]');
  const reset = document.getElementById('decision-reset');
  const resultDiv = document.getElementById('decision-result');
  const questionDiv = document.querySelector('.decision-question');

  // Click No -> should show q2
  btnNo.click();
  assert.match(document.getElementById('decision-question-text').textContent, /reglas exactas/i);

  // Click Yes -> should show rule result
  btnYes.click();
  assert.equal(resultDiv.hidden, false);
  assert.equal(questionDiv.hidden, true);
  assert.match(document.getElementById('decision-result-text').textContent, /REGLA AUTOMATIZADA/);

  // Click Reset -> should go back to q1
  reset.click();
  assert.equal(resultDiv.hidden, true);
  assert.equal(questionDiv.hidden, false);
  assert.match(document.getElementById('decision-question-text').textContent, /aprobar, autorizar/i);
});
