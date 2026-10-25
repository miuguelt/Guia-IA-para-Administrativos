const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const target = require.resolve('../js/course-tools.js');

function setup(html) {
  const dom = new JSDOM(html, {runScripts:'outside-only'});
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    delete require.cache[target];
    require(target);
    dom.window.CourseTools.init();
  } finally {
    delete global.window;
    delete global.document;
  }
  return dom;
}

test('el compositor incluye la fuente literal y pide completar lo que falta', () => {
  const dom = setup('<input id="prompt-context" value="Caso PC-01"><input id="prompt-task" value="Separar los pendientes"><textarea id="prompt-source">No consta la hora.</textarea><p id="prompt-preview"></p>');
  const doc = dom.window.document;
  assert.match(doc.getElementById('prompt-preview').textContent, /No consta la hora\./u);
  assert.match(doc.getElementById('prompt-preview').textContent, /Caso PC-01/u);
  const source = doc.getElementById('prompt-source');
  source.value = '<img src=x onerror=alert(1)>\nNo inventes una fecha.';
  source.dispatchEvent(new dom.window.Event('input'));
  assert.ok(doc.getElementById('prompt-preview').textContent.includes(source.value));
  assert.equal(doc.getElementById('prompt-preview').querySelector('img'), null);
  for (const id of ['prompt-context','prompt-task','prompt-source']) {
    const input = doc.getElementById(id);
    const before = input.value;
    input.value = '   ';
    input.dispatchEvent(new dom.window.Event('input'));
    assert.match(doc.getElementById('prompt-preview').textContent, /Completa/iu);
    input.value = before;
    input.dispatchEvent(new dom.window.Event('input'));
  }
  dom.window.close();
});

test('la tasa distingue datos vacíos, cero válido y valores fuera de rango', () => {
  const dom = setup('<input id="ratio-numerator" value="42"><input id="ratio-denominator" value="840"><output id="ratio-result"></output><p id="ratio-status"></p>');
  const doc = dom.window.document;
  assert.equal(doc.getElementById('ratio-result').textContent, '5 %');
  for (const [numerator, denominator, expected, message] of [['','840','—',/Completa/u], ['0','840','0 %',/0 ÷ 840/u], ['42','','—',/Completa/u], ['42','0','—',/mayor que cero/u], ['-1','840','—',/Revisa/u], ['841','840','—',/Revisa/u], ['Infinity','840','—',/Revisa/u], ['42','Infinity','—',/Revisa/u], ['no numérico','840','—',/Revisa/u]]) {
    doc.getElementById('ratio-numerator').value = numerator;
    doc.getElementById('ratio-denominator').value = denominator;
    doc.getElementById('ratio-numerator').dispatchEvent(new dom.window.Event('input'));
    doc.getElementById('ratio-denominator').dispatchEvent(new dom.window.Event('input'));
    assert.equal(doc.getElementById('ratio-result').textContent, expected);
    assert.match(doc.getElementById('ratio-status').textContent, message);
  }
  dom.window.close();
});

test('las herramientas toleran páginas sin controles o con controles incompletos', () => {
  for (const html of ['', '<input id="prompt-context"><input id="ratio-numerator">', '<input id="prompt-context"><input id="prompt-task"><p id="prompt-preview"></p>']) {
    const dom = setup(html);
    assert.equal(typeof dom.window.CourseTools.init, 'function');
    assert.equal(dom.window.document.querySelectorAll('img').length, 0);
    dom.window.close();
  }
});

const checkMarkup = '<form data-knowledge-check><fieldset><legend>¿Qué puedes confirmar?</legend><label><input type="radio" name="decision" value="a" data-correct="true" data-feedback="La fuente conserva la fecha pendiente.">Pedir la fecha</label><label><input type="radio" name="decision" value="b" data-feedback="La urgencia no aprueba la reserva.">Aprobar</label><label><input type="radio" name="decision" value="c">Consultar</label></fieldset><button type="button" data-check-submit>Comprobar respuesta</button><button type="reset">Volver a intentar</button><p data-check-feedback role="status" aria-live="polite">Elige una opción.</p></form>';

test('la práctica pide una opción, explica un error y permite corregirlo sin bloquear el recorrido', () => {
  const dom = setup(checkMarkup);
  const form = dom.window.document.querySelector('form');
  const submit = form.querySelector('[data-check-submit]');
  const feedback = form.querySelector('[data-check-feedback]');
  submit.click();
  assert.match(feedback.textContent, /elige una opción/iu);
  assert.equal(form.dataset.state, 'empty');
  assert.equal(dom.window.document.activeElement, form.querySelector('input[type="radio"]'));
  form.querySelector('[value="b"]').click();
  submit.click();
  assert.equal(form.dataset.state, 'review');
  assert.match(feedback.textContent, /Revisa.*urgencia no aprueba/isu);
  form.querySelector('[value="a"]').click();
  assert.equal(form.dataset.state, 'pending');
  assert.doesNotMatch(feedback.textContent, /urgencia/iu);
  submit.click();
  assert.equal(form.dataset.state, 'correct');
  assert.match(feedback.textContent, /Correcto.*fecha pendiente/isu);
  assert.equal(feedback.getAttribute('aria-live'), 'polite');
  assert.ok([...form.querySelectorAll('input, button')].every(control => !control.disabled));
  form.querySelector('[type="reset"]').click();
  assert.equal(form.querySelector(':checked'), null);
  assert.equal(form.dataset.state, 'pending');
  assert.match(feedback.textContent, /elige una opción/iu);
  dom.window.close();
});

test('la práctica usa texto seguro y una explicación de respaldo si falta la retroalimentación', () => {
  const dom = setup(checkMarkup);
  const form = dom.window.document.querySelector('form');
  const option = form.querySelector('[value="b"]');
  option.dataset.feedback = '<img src=x onerror=alert(1)> Consulta la fuente.';
  option.click();
  form.querySelector('[data-check-submit]').click();
  assert.match(form.querySelector('[data-check-feedback]').textContent, /<img/u);
  assert.equal(form.querySelector('[data-check-feedback] img'), null);
  form.querySelector('[value="c"]').click();
  form.querySelector('[data-check-submit]').click();
  assert.match(form.querySelector('[data-check-feedback]').textContent, /consulta la explicación/iu);
  dom.window.close();
});

test('la práctica se inicia una sola vez y tolera controles incompletos', () => {
  const dom = setup(checkMarkup + '<form data-knowledge-check></form><form data-knowledge-check><button data-check-submit type="button">Comprobar</button></form>');
  global.document = dom.window.document;
  dom.window.CourseTools.init();
  delete global.document;
  const form = dom.window.document.querySelector('form');
  let updates = 0;
  const feedback = form.querySelector('[data-check-feedback]');
  const descriptor = Object.getOwnPropertyDescriptor(dom.window.Node.prototype, 'textContent');
  Object.defineProperty(feedback, 'textContent', { get() { return descriptor.get.call(this); }, set(value) { updates += 1; descriptor.set.call(this, value); } });
  form.querySelector('[value="a"]').checked = true;
  form.querySelector('[data-check-submit]').click();
  assert.equal(updates, 1);
  assert.equal(form.dataset.state, 'correct');
  assert.equal(dom.window.document.querySelectorAll('[data-check-ready="true"]').length, 1);
  dom.window.close();
});

test('iniciar las herramientas conserva los campos vacíos y las respuestas existentes', () => {
  const html = `
    <button data-scaffold-target="MG-A01">Cargar plantilla</button>
    <span id="scaffold-status-MG-A01"></span>
    <div data-db-evidence="MG-A01">
      <input id="campo-1" placeholder="Ejemplo para campo 1" value="">
      <textarea id="campo-2" placeholder="Ejemplo para campo 2">Dato previo conservado</textarea>
    </div>
  `;
  const dom = setup(html);
  const doc = dom.window.document;
  const button = doc.querySelector('[data-scaffold-target="MG-A01"]');
  const status = doc.getElementById('scaffold-status-MG-A01');
  const campo1 = doc.getElementById('campo-1');
  const campo2 = doc.getElementById('campo-2');

  let inputFired = 0;
  campo1.addEventListener('input', () => { inputFired += 1; });

  button.click();
  assert.equal(campo1.value, '');
  assert.equal(campo2.value, 'Dato previo conservado');
  assert.equal(inputFired, 0);
  assert.equal(status.textContent, '');

  // Un botón antiguo tampoco debe convertir sus ejemplos en respuestas guardadas.
  button.click();
  assert.equal(campo1.value, '');
  assert.equal(campo2.value, 'Dato previo conservado');

  dom.window.close();
});

test('las herramientas toleran botones antiguos sin rellenar los campos de ejemplo', () => {
  const html = `
    <button data-scaffold-target="INEXISTENTE">Cargar</button>
    <span id="scaffold-status-INEXISTENTE"></span>
    <button data-scaffold-target="">Sin objetivo</button>
    <button data-scaffold-target="SIN-STATUS">Sin estado</button>
    <div data-db-evidence="SIN-STATUS">
      <input placeholder="Texto de prueba">
    </div>
  `;
  const dom = setup(html);
  const doc = dom.window.document;

  const btnInexistente = doc.querySelector('[data-scaffold-target="INEXISTENTE"]');
  const statusInexistente = doc.getElementById('scaffold-status-INEXISTENTE');
  btnInexistente.click();
  assert.equal(statusInexistente.textContent, '');

  const btnSinObjetivo = doc.querySelector('[data-scaffold-target=""]');
  btnSinObjetivo.click();

  const btnSinStatus = doc.querySelector('[data-scaffold-target="SIN-STATUS"]');
  btnSinStatus.click();
  const inputSinStatus = doc.querySelector('[data-db-evidence="SIN-STATUS"] input');
  assert.equal(inputSinStatus.value, '');

  // Idempotencia de inicialización
  global.document = doc;
  dom.window.CourseTools.init();
  delete global.document;

  dom.window.close();
});

test('focusEvidenceField enfoca, desplaza y realza el campo de evidencia destino', () => {
  const dom = setup('<input id="campo-test"><div id="campo-sin-metodos"></div>');
  const doc = dom.window.document;
  const tools = dom.window.CourseTools;

  // Manejo de argumentos inválidos
  assert.equal(tools.focusEvidenceField(null, 'campo-test'), false);
  assert.equal(tools.focusEvidenceField(doc, null), false);
  assert.equal(tools.focusEvidenceField(doc, ''), false);
  assert.equal(tools.focusEvidenceField(doc, 'no-existe'), false);

  const input = doc.getElementById('campo-test');
  let scrolledOpts = null;
  let focusOpts = null;
  input.scrollIntoView = (opts) => { scrolledOpts = opts; };
  input.focus = (opts) => { focusOpts = opts; };

  // Ejecución exitosa con opciones predeterminadas
  const ok = tools.focusEvidenceField(doc, 'campo-test');
  assert.equal(ok, true);
  assert.deepEqual(scrolledOpts, { block: 'center', behavior: 'auto' });
  assert.deepEqual(focusOpts, { preventScroll: true });
  assert.ok(input.classList.contains('dbe-field--highlighted'));

  // Ejecución con desplazamiento suave
  tools.focusEvidenceField(doc, 'campo-test', { smooth: true });
  assert.deepEqual(scrolledOpts, { block: 'center', behavior: 'smooth' });

  // Tolerancia a elementos sin métodos scrollIntoView o focus
  const div = doc.getElementById('campo-sin-metodos');
  delete div.scrollIntoView;
  delete div.focus;
  const okDiv = tools.focusEvidenceField(doc, 'campo-sin-metodos');
  assert.equal(okDiv, true);
  assert.ok(div.classList.contains('dbe-field--highlighted'));

  dom.window.close();
});

test('focusEvidenceField retira el realce al escribir, perder el foco o cumplirse el tiempo límite', async () => {
  const dom = setup('<input id="campo-a"><input id="campo-b"><input id="campo-c">');
  const doc = dom.window.document;
  const tools = dom.window.CourseTools;

  // 1. Limpieza ante evento input
  const campoA = doc.getElementById('campo-a');
  tools.focusEvidenceField(doc, 'campo-a');
  assert.ok(campoA.classList.contains('dbe-field--highlighted'));
  campoA.dispatchEvent(new dom.window.Event('input'));
  assert.ok(!campoA.classList.contains('dbe-field--highlighted'));

  // 2. Limpieza ante evento blur
  const campoB = doc.getElementById('campo-b');
  tools.focusEvidenceField(doc, 'campo-b');
  assert.ok(campoB.classList.contains('dbe-field--highlighted'));
  campoB.dispatchEvent(new dom.window.Event('blur'));
  assert.ok(!campoB.classList.contains('dbe-field--highlighted'));

  // 3. Limpieza automática tras cumplirse el temporizador
  const campoC = doc.getElementById('campo-c');
  tools.focusEvidenceField(doc, 'campo-c', { timeout: 30 });
  assert.ok(campoC.classList.contains('dbe-field--highlighted'));
  await new Promise(resolve => setTimeout(resolve, 60));
  assert.ok(!campoC.classList.contains('dbe-field--highlighted'));

  // 4. Tolerancia cuando no existe defaultView ni setTimeout
  const fakeDoc = {
    getElementById: () => ({
      classList: { remove() {}, add() {} },
      addEventListener() {},
      removeEventListener() {}
    })
  };
  assert.equal(tools.focusEvidenceField(fakeDoc, 'cualquiera'), true);

  dom.window.close();
});

test('los puentes de evidencia activan la pestaña documenta y posicionan al aprendiz en el campo correspondiente', () => {
  const html = `
    <div id="m01-fundamentos" class="module-page">
      <button id="btn-modulo-implicito" data-open-evidence-field="dbe-reto-1">Ir a reto 1</button>
      <input id="dbe-reto-1">
    </div>
    <div id="m02-diseno" class="module-page">
      <button id="btn-modulo-explicito" data-module-target="m02-diseno" data-open-evidence-field="dbe-reto-2">Ir a reto 2</button>
      <input id="dbe-reto-2">
    </div>
    <button id="btn-sin-modulo" data-open-evidence-field="dbe-reto-3">Ir a reto 3</button>
    <input id="dbe-reto-3">
  `;
  const dom = setup(html);
  const doc = dom.window.document;
  const win = dom.window;

  const tabCalls = [];
  win.CourseTabs = {
    show: (page, tab, updateHistory) => {
      tabCalls.push({ page, tab, updateHistory });
    }
  };

  // Botón con módulo implícito deducido por clase .module-page
  const btn1 = doc.getElementById('btn-modulo-implicito');
  btn1.click();
  assert.deepEqual(tabCalls[0], { page: 'm01-fundamentos', tab: 'documenta', updateHistory: false });
  assert.ok(doc.getElementById('dbe-reto-1').classList.contains('dbe-field--highlighted'));

  // Botón con módulo explícito data-module-target
  const btn2 = doc.getElementById('btn-modulo-explicito');
  btn2.click();
  assert.deepEqual(tabCalls[1], { page: 'm02-diseno', tab: 'documenta', updateHistory: false });
  assert.ok(doc.getElementById('dbe-reto-2').classList.contains('dbe-field--highlighted'));

  // Botón sin módulo contenedor (no llama CourseTabs.show pero sí enfoca)
  const btn3 = doc.getElementById('btn-sin-modulo');
  btn3.click();
  assert.equal(tabCalls.length, 2);
  assert.ok(doc.getElementById('dbe-reto-3').classList.contains('dbe-field--highlighted'));

  // Tolerancia cuando CourseTabs no está disponible en la ventana
  win.CourseTabs = null;
  btn1.click();
  assert.ok(doc.getElementById('dbe-reto-1').classList.contains('dbe-field--highlighted'));

  dom.window.close();
});

test('los puentes de evidencia reintentan enfocar el campo si el formulario se monta de forma asíncrona', async () => {
  const html = `
    <button id="btn-async" data-open-evidence-field="dbe-campo-asincrono">Completar evidencia</button>
  `;
  const dom = setup(html);
  const doc = dom.window.document;

  const btn = doc.getElementById('btn-async');
  btn.click();

  // El campo aún no está en el DOM
  assert.equal(doc.getElementById('dbe-campo-asincrono'), null);

  // Se monta asíncronamente en el siguiente ciclo
  const field = doc.createElement('textarea');
  field.id = 'dbe-campo-asincrono';
  doc.body.append(field);

  // Esperar a que el temporizador de reintento (~120ms) se ejecute
  await new Promise(resolve => setTimeout(resolve, 180));

  assert.ok(field.classList.contains('dbe-field--highlighted'));

  dom.window.close();
});

test('los botones de desplazamiento directo enfocan la evidencia de la misma vista', () => {
  const html = `
    <button id="btn-scroll" data-scroll-target="dbe-ECO-A01-explicacion">Registrar explicación</button>
    <textarea id="dbe-ECO-A01-explicacion"></textarea>
  `;
  const dom = setup(html);
  const doc = dom.window.document;

  const btn = doc.getElementById('btn-scroll');
  const textarea = doc.getElementById('dbe-ECO-A01-explicacion');

  btn.click();
  assert.ok(textarea.classList.contains('dbe-field--highlighted'));

  dom.window.close();
});

test('initEvidenceBridges es idempotente y tolera llamadas sin documento', () => {
  const tools = require(target);
  assert.equal(tools.initEvidenceBridges(null), false);

  const html = `
    <button id="b1" data-open-evidence-field="f1">B1</button>
    <button id="b2" data-scroll-target="f2">B2</button>
    <input id="f1"><input id="f2">
  `;
  const dom = setup(html);
  const doc = dom.window.document;

  const b1 = doc.getElementById('b1');
  const b2 = doc.getElementById('b2');

  // Comprobar que CourseTools.init() ya los marcó como listos
  assert.equal(b1.dataset.bridgeReady, 'true');
  assert.equal(b2.dataset.scrollReady, 'true');

  // Segunda inicialización no duplica eventos
  let clicksF1 = 0;
  const f1 = doc.getElementById('f1');
  f1.focus = () => { clicksF1 += 1; };

  dom.window.CourseTools.initEvidenceBridges(doc);
  b1.click();
  assert.equal(clicksF1, 1);

  dom.window.close();
});
