const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const model = require('../js/case-practices-model.js');
const { Simulator } = require('../js/case-practices.js');
const page = () => new JSDOM(fs.readFileSync('index.html', 'utf8'), { url: 'https://guia.example/', pretendToBeVisual: true });
const spec = root => JSON.parse(root.querySelector('[data-case-spec]').textContent);

test('los cinco casos sustituyen videos, conservan fuentes y evalúan lo que muestran', () => {
  const dom = page();
  const roots = [...dom.window.document.querySelectorAll('[data-simulator="case-practice"]')];
  assert.equal(roots.length, 5);
  assert.equal(dom.window.document.querySelectorAll('video').length, 0);
  for (const root of roots) {
    const data = spec(root);
    assert.equal(root.querySelectorAll('[data-case-stage]').length, 4);
    if (data.id === 'm01-fundamentos') {
      // M01 muestra la bandeja y el lineamiento en la página: no hay archivo que descargar.
      assert.equal(root.querySelectorAll('[data-case-source] a[download]').length, 0);
      assert.ok(root.querySelectorAll('[data-case-source] .case-source-record').length >= 6);
      assert.match(root.querySelector('[data-case-source]').textContent, /URG-01.*SAL-05/su);
    } else if (data.id === 'm02-diseno') {
      // M02 muestra los tres mensajes sin la columna que anticipaba lo que falta.
      assert.equal(root.querySelectorAll('[data-case-source] a[download]').length, 0);
      assert.equal(root.querySelectorAll('[data-case-source] .case-source-record').length, 3);
      assert.doesNotMatch(root.querySelector('[data-case-source]').textContent, /Dato faltante/u);
    } else {
      assert.ok(root.querySelector('[data-case-source] a[download]'));
    }
    assert.ok(data.questions.length >= (data.id === 'm02-diseno' ? 5 : 6));
    for (const q of data.questions) {
      assert.ok(root.querySelector(`[data-case-question="${q.id}"]`));
      assert.ok(q.reference);
      assert.ok(Array.isArray(q.hints) && q.hints.length === 3, `${data.id}:${q.id} debe tener 3 niveles de pistas`);
    }
  }
  const audit = spec(roots[3]).questions.find(q => q.id === 'periodo');
  assert.match(audit.prompt, /periodo|semestre/iu);
  assert.equal(model.evaluate(audit, 'not-stated').correct, true);
  dom.window.close();
});

test('el modelo valida decisiones y cálculos, conserva pendientes y deriva el avance', () => {
  const dom = page();
  for (const root of dom.window.document.querySelectorAll('[data-simulator="case-practice"]')) {
    const data = spec(root);
    let state = model.initial(data);
    assert.equal(model.summary(data, state).label, 'Sin empezar');
    for (const q of data.questions) {
      assert.equal(model.evaluate(q, '').correct, false);
      state = model.answer(data, state, q.id, q.expected, true);
      assert.equal(state.answers[q.id].attempts, 1);
    }
    assert.equal(model.summary(data, state).label, 'Comprobada');
    const first = data.questions[0];
    state = model.answer(data, state, first.id, '', false);
    assert.equal(model.summary(data, state).complete, false);
    state = model.answer(data, state, first.id, 'incorrecto', true);
    assert.equal(model.summary(data, state).label, 'Por corregir');
    assert.equal(model.restore(data, { ...state, revision: -1 }).step, 0);
    assert.deepEqual(model.restore(data, state), state);
    assert.deepEqual(model.restore(data, null), model.initial(data));
    assert.deepEqual(model.answer(data, state, 'ausente', 'x', true), state);
  }
  const rate = { type: 'rate', expected: '42|840|5', reference: 'Bienestar', explanation: '42 ÷ 840 = 5 %.' };
  assert.equal(model.evaluate(rate, '42|0|5').correct, false);
  assert.match(model.evaluate(rate, '42|0|5').text, /denominador.*mayor que cero/iu);
  assert.match(model.evaluate(rate, '900|840|5').text, /numerador.*entre cero/iu);
  assert.equal(model.evaluate(rate, '0|840|0').correct, false);
  assert.equal(model.evaluate(rate, '42|840|5,0').correct, true);
  assert.equal(model.evaluate(rate, '42|840|Infinity').correct, false);
  dom.window.close();
});

test('la práctica guarda y recupera intentos, ayudas progresivas en 3 niveles y etapa sin escribir evidencias', () => {
  const dom = page();
  const root = dom.window.document.querySelector('[data-simulator="case-practice"]');
  const data = spec(root);
  const saved = new Map();
  const storage = { get: key => saved.get(key), set: (key, value) => saved.set(key, structuredClone(value)) };
  const plugin = new Simulator({ container: root, storage });
  plugin.render(); plugin.render();
  root.querySelector('[data-case-go="1"]').click();
  assert.equal(root.querySelector('[data-case-stage="0"]').hidden, true);
  const q = data.questions[0];
  const form = root.querySelector(`[data-case-question="${q.id}"]`);
  form.querySelector('[data-case-submit]').click();
  assert.match(form.querySelector('[data-case-feedback]').textContent, /elige|completa/iu);
  const input = [...form.querySelectorAll('input')].find(n => n.value === q.expected);
  input.checked = true; input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  form.querySelector('[data-case-submit]').click();
  assert.equal(form.dataset.state, 'correct');
  const hintBtn = form.querySelector('[data-case-hint]');
  const hintText = form.querySelector('[data-case-hint-text]');
  hintBtn.click();
  assert.equal(hintText.hidden, false);
  assert.match(hintText.textContent, /Pista 1 de 3:/);
  assert.doesNotMatch(hintText.textContent, /Pista 2 de 3:/);
  assert.match(hintBtn.textContent, /2 de 3/);
  hintBtn.click();
  assert.match(hintText.textContent, /Pista 1 de 3:.*Pista 2 de 3:/);
  assert.doesNotMatch(hintText.textContent, /Pista 3 de 3:/);
  assert.match(hintBtn.textContent, /3 de 3/);
  hintBtn.click();
  assert.match(hintText.textContent, /Pista 3 de 3:/);
  assert.equal(hintBtn.disabled, true);
  const solution = root.querySelector('[data-case-solution]');
  solution.open = true; solution.dispatchEvent(new dom.window.Event('toggle'));
  assert.equal(plugin.state.solutionViewed, true);
  assert.ok(saved.size === 1);
  assert.ok([...saved.keys()].every(key => key.startsWith('case_practice_')));
  plugin.destroy();
  const resumed = new Simulator({ container: root, storage }); resumed.render();
  assert.equal(resumed.state.step, 1);
  assert.equal(resumed.state.answers[q.id].attempts, 1);
  assert.ok(resumed.state.hints.includes(q.id));
  assert.equal(resumed.state.hints.filter(id => id === q.id).length, 3);
  root.querySelector('[data-case-reset]').click();
  assert.equal(resumed.state.step, 0);
  assert.equal(model.summary(data, resumed.state).label, 'Sin empezar');
  resumed.destroy(); dom.window.close();
});

test('un almacenamiento bloqueado informa el fallo y conserva el trabajo en memoria', () => {
  const dom = page();
  const root = dom.window.document.querySelector('[data-simulator="case-practice"]');
  const plugin = new Simulator({ container: root, storage: { get() { throw Error('bloqueado'); }, set() { throw Error('bloqueado'); } } });
  plugin.render(); root.querySelector('[data-case-go="2"]').click();
  assert.equal(plugin.state.step, 2);
  assert.match(root.querySelector('[data-case-save-status]').textContent, /no.*guardar|no.*guardó/iu);
  plugin.destroy(); dom.window.close();
});

test('los controles de cálculo admiten corrección, formulario y reinicio sin acreditar ayudas', () => {
  const dom = page();
  const root = dom.window.document.querySelector('#m04-validacion [data-simulator="case-practice"]');
  const plugin = new Simulator({container: root}); plugin.render();
  const form = root.querySelector('[data-case-question="tasa"]');
  const fields = [...form.querySelectorAll('[data-case-value]')];
  fields[0].value = '42'; fields[0].dispatchEvent(new dom.window.Event('input', {bubbles:true}));
  form.dispatchEvent(new dom.window.Event('submit', {bubbles:true,cancelable:true}));
  assert.match(form.querySelector('[data-case-feedback]').textContent, /completa/iu);
  ['42','840','5,0'].forEach((value,i) => { fields[i].value=value; fields[i].dispatchEvent(new dom.window.Event('input',{bubbles:true})); });
  form.dispatchEvent(new dom.window.Event('submit', {bubbles:true,cancelable:true}));
  assert.equal(form.dataset.state, 'correct');
  const end = root.querySelector('[data-case-question="cierre-1"]');
  const help = end.querySelector('[data-case-help]');
  help.open=true; help.dispatchEvent(new dom.window.Event('toggle'));
  assert.ok(plugin.state.hints.includes('cierre-1'));
  assert.equal(model.summary(plugin.spec,plugin.state).complete,false);
  end.dispatchEvent(new dom.window.Event('reset', {cancelable:true}));
  assert.equal(end.querySelector('input:checked'),null);
  plugin.destroy(); dom.window.close();
});

test('restaura reglas del comparador y tolera especificaciones o almacenamiento inválidos', () => {
  const dom=page();
  const root=dom.window.document.querySelector('#m03-implementacion [data-simulator="case-practice"]');
  const values=new Map(); const storage={get:key=>values.get(key),set:(key,state)=>values.set(key,structuredClone(state))};
  let plugin=new Simulator({container:root,storage}); plugin.render();
  const checkbox=root.querySelector('.case-tools input[type="checkbox"]');
  checkbox.checked=true; checkbox.dispatchEvent(new dom.window.Event('change'));
  checkbox.dispatchEvent(new dom.window.Event('input'));
  assert.equal(plugin.state.tools['0'],true);
  plugin.destroy(); plugin=new Simulator({container:root,storage}); plugin.render();
  assert.equal(checkbox.checked,true);
  root.querySelector('[data-case-reset]').click(); assert.equal(checkbox.checked,false);
  plugin.destroy();
  const specNode=root.querySelector('[data-case-spec]'); specNode.textContent='{';
  const invalid=new Simulator({container:root}); invalid.render();
  assert.match(root.querySelector('[data-case-save-status]').textContent,/no se pudo iniciar/iu);
  invalid.destroy();
  const data={revision:1,questions:[{id:'legacy',hint:'Pista simple'}]};
  const restored=model.restore(data,{version:1,revision:1,step:99,hints:['ausente','legacy','legacy'],answers:{},tools:{'0':true,'1':'42',bad:'x','2':null}});
  assert.equal(restored.step,0); assert.deepEqual(restored.hints,['legacy']); assert.deepEqual(restored.tools,{'0':true,'1':'42'});
  const store=require('../js/case-practices-store.js');
  assert.equal(store.read(null,'x'),null);
  assert.equal(store.write(null,'x',{}),false);
  assert.equal(store.write({set(){},get(){return null;}},'x',{}),false);
  assert.ok(Number.isNaN(model.number('2e3')));
  dom.window.close();
});

test('el encargo se construye por partes y conserva el texto completo al retomar', () => {
  const dom=page();
  const root=dom.window.document.querySelector('#m02-diseno [data-simulator="case-practice"]');
  const saved=new Map(); const storage={get:key=>saved.get(key),set:(key,state)=>saved.set(key,structuredClone(state))};
  let plugin=new Simulator({container:root,storage}); plugin.render();
  const form=root.querySelector('[data-case-question="encargo"]');
  form.querySelector('[data-case-submit]').click();
  assert.match(form.querySelector('[data-case-feedback]').textContent,/completa/iu);
  ['caso','analiza','claro','verifica'].forEach((value,index)=>{
    const select=form.querySelectorAll('select')[index]; select.value=value; select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
  });
  assert.match(form.querySelector('[data-case-instruction-preview]').textContent,/auxiliar de atención.*respetuoso.*pregúntalo/su);
  form.querySelector('[data-case-submit]').click(); assert.equal(form.dataset.state,'correct');
  plugin.destroy(); plugin=new Simulator({container:root,storage}); plugin.render();
  assert.equal(form.querySelector('select').value,'caso'); assert.equal(form.dataset.state,'correct');
  plugin.destroy(); dom.window.close();
});

test('imprime únicamente la práctica y restaura la vista incluso si falla la impresión', () => {
  const dom=page(); const doc=dom.window.document;
  const root=doc.querySelector('[data-simulator="case-practice"]');
  const plugin=new Simulator({container:root}); plugin.render();
  let calls=0;
  dom.window.print=()=>{
    calls+=1;
    assert.equal(doc.body.dataset.printCase,root.dataset.caseId);
    assert.equal(doc.querySelectorAll('.case-print-page').length,1);
    assert.ok(root.classList.contains('case-print-target'));
    assert.equal(root.querySelector('[data-case-solution]').open,true);
    assert.equal(plugin.state.solutionViewed,false);
  };
  root.querySelector('[data-case-print]').click();
  assert.equal(calls,1); assert.equal(doc.body.hasAttribute('data-print-case'),false);
  assert.equal(root.querySelector('[data-case-solution]').open,false);
  assert.equal(doc.querySelectorAll('.case-print-page').length,0);
  dom.window.print=()=>{throw Error('indisponible');};
  root.querySelector('[data-case-print]').click();
  assert.match(root.querySelector('[data-case-save-status]').textContent,/no se pudo imprimir/iu);
  assert.equal(doc.body.hasAttribute('data-print-case'),false);
  plugin.destroy(); dom.window.close();
});

test('el texto de espera describe la acción que pide cada tipo de pregunta', () => {
  assert.equal(model.pendingPrompt({ type: 'choice' }), 'Elige una opción y comprueba tu respuesta.');
  assert.equal(model.pendingPrompt({}), 'Elige una opción y comprueba tu respuesta.');
  assert.equal(model.pendingPrompt({ type: 'rate' }), 'Completa el cálculo y comprueba tu respuesta.');
  assert.equal(model.pendingPrompt({ type: 'amount' }), 'Completa el cálculo y comprueba tu respuesta.');
  assert.equal(model.pendingPrompt({ type: 'instruction' }), 'Selecciona las cuatro partes y comprueba tu respuesta.');
});
