const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const read = file => fs.readFileSync(file, 'utf8');
const registry = () => JSON.parse(read('deliverables.registry.json'));

test('EcoBogotá ofrece capacitación con IA desde el comienzo y cuatro pasos accionables', () => {
  const dom = new JSDOM(read('content/ecobogota.html'));
  const page = dom.window.document;
  assert.equal(page.querySelectorAll('.eco-phase').length, 4);
  assert.equal(page.querySelectorAll('input[name="eco-route"]').length, 3);
  assert.equal(page.querySelectorAll('[data-bin], #eco-prediction-form, #eco-ai-task-gate').length, 0);
  assert.ok(page.querySelector('[data-db-evidence="ECO-A02"]'));
  assert.equal(page.querySelectorAll('[data-ai-task]').length, 3);
  for (const task of page.querySelectorAll('[data-ai-task]')) {
    assert.equal(task.closest('[hidden]'), null);
    assert.ok(task.querySelector('button[data-copy]'));
    assert.ok(task.querySelector('a[download][href$=".zip"]'));
  }
  assert.doesNotMatch(read('content/ecobogota.html'), /intento-simulador|planta-ilustrativa/i);
  dom.window.close();
});

test('las tres rutas comparten fuentes y contrato y piden productos reales sin inventar su terminación', () => {
  const tasks = JSON.parse(read('content/ai-task-briefs.json'));
  const published = new JSDOM(read('index.html'));
  for (const key of ['eco', 'eco-canva', 'eco-simulacion']) {
    const task = tasks[key];
    assert.ok(task, key);
    assert.equal(task.artifactId, 'ECO-A02');
    assert.deepEqual(task.fieldKeys, ['contexto', 'encargo', 'material', 'verificacion']);
    assert.equal((task.learnerFiles || []).length, 0);
    for (const mode of ['chatPrompt', 'idePrompt']) {
      assert.doesNotMatch(task[mode], /intento-simulador|ECO-A01/);
      assert.match(task[mode], /preparación pendiente de producción/i);
      assert.match(task[mode], /revisión humana.*pendiente/i);
      assert.match(task[mode], /eco-criterios\.csv/);
    }
    assert.ok(task.guideImages.every(image => image.path.endsWith('.svg')));
    assert.equal(published.window.document.querySelector(`[data-eco-prompt="${key}"]`).textContent,task.chatPrompt);
    assert.ok(read(`materiales/ia/${key}/ENCARGO-CHAT.md`).includes(task.chatPrompt));
    const schema=JSON.parse(read(`materiales/ia/${key}/esquema-salida.json`));
    assert.equal(schema.properties.artifactId.const,'ECO-A02');
    assert.deepEqual(schema.properties.fields.required,task.fieldKeys);
  }
  assert.match(tasks.eco.chatPrompt, /60 a 90 segundos/);
  assert.match(tasks['eco-canva'].chatPrompt, /editable/);
  assert.match(tasks['eco-simulacion'].chatPrompt, /puesto de trabajo.*zona de alimentación.*orientación al personal/s);
  published.window.close();
});

test('la evidencia nueva valida sus campos sin aceptar registros anteriores ni modificar sus datos', () => {
  const model = require('../js/ai-result-model.js');
  const artifact = registry().artifacts.find(item => item.id === 'ECO-A02');
  assert.ok(artifact);
  const legacy = registry().artifacts.find(item => item.id === 'ECO-A01');
  assert.ok(legacy);
  assert.deepEqual(legacy.fields.map(field => field.key), ['diagnostico','prediccion','resultado','explicacion']);
  const text = JSON.stringify({schemaVersion:1,artifactId:'ECO-A02',fields:{contexto:'Personal de oficina',encargo:'Crear capacitación con IA',material:'Guion; producción pendiente',verificacion:'Revisión humana pendiente'},tool:'no identificado'});
  const result = model.validateResult(text, artifact);
  const previous = {values:{},checks:{},status:'pendiente'};
  const record = model.prepareRecord(previous,result,artifact);
  assert.equal(record.status,'borrador');
  assert.equal(record.values.material,'Guion; producción pendiente');
  assert.ok(Object.values(record.checks).every(value => value === false));
  assert.throws(() => model.validateResult(text.replace('ECO-A02','ECO-A01'),artifact), /otra evidencia/);
  assert.throws(() => model.validateResult(text.replace('"contexto":','"prediccion":'),artifact), /no pertenece/);
  assert.deepEqual(previous.values, {});
});

test('los registros anteriores quedan en una consulta de solo lectura', () => {
  const page = new JSDOM(read('content/portfolio.html')).window.document;
  const legacy = page.querySelector('#eco-legacy-records');
  assert.ok(legacy);
  assert.match(legacy.textContent,/versión anterior/i);
  assert.equal(legacy.querySelectorAll('input,textarea,[data-db-evidence]').length,0);
  assert.ok(legacy.querySelector('#eco-portfolio-summary'));
});

test('el recorrido real importa ECO-A02, guarda, revisa y descarga sin alterar ECO-A01', async () => {
  const dom = new JSDOM(read('index.html'), {url:'http://curso.test/#ecobogota',runScripts:'outside-only'});
  const win = dom.window;
  win.HTMLElement.prototype.scrollIntoView = function () {};
  for (const script of ['js/vendor/devbrain-learner-sdk.js','js/registro-entregables.js','js/vendor/fflate.js','js/result-archive.js','js/ai-result-model.js','js/result-import.js','js/ai-result-store.js','js/ai-delivery-view.js','js/ai-delivery.js']) win.eval(read(script));
  const mounted = await win.DevBrainSDK.evidence.montar({registro:win.DevBrainRegistroEntregables,prefijo:'eco-prueba'});
  mounted.store.guardar('ECO-A01',{values:{explicacion:'Explicación anterior'},checks:{}});
  const legacy = JSON.stringify(mounted.store.leer('ECO-A01'));
  win.AIDelivery.init({document:win.document,mounted});
  const receiver = win.document.querySelector('[data-ai-delivery="ECO-A02"]');
  assert.ok(receiver);
  const text = receiver.querySelector('[data-result-text]');
  const paste = receiver.querySelector('[data-result-paste]');
  text.value = '{error}';
  paste.click();
  for (let i=0;i<30 && receiver.getAttribute('aria-busy')==='true';i++) await new Promise(resolve => win.setTimeout(resolve,25));
  assert.equal(receiver.querySelector('[data-result-status]').getAttribute('role'),'alert',receiver.querySelector('[data-result-status]').textContent);
  assert.equal(receiver.querySelector('[data-result-save]').disabled,true);
  const values = {contexto:'Personal de oficina; video',encargo:'Crear con fuentes',material:'Guion; preparación pendiente de producción',verificacion:'La IA contrastó fuentes; revisión humana pendiente.'};
  text.value = JSON.stringify({schemaVersion:1,artifactId:'ECO-A02',fields:values,tool:'no identificado'});
  paste.click();
  for (let i=0;i<30 && receiver.getAttribute('aria-busy')==='true';i++) await new Promise(resolve => win.setTimeout(resolve,25));
  assert.equal(receiver.querySelector('[data-result-save]').disabled,false);
  receiver.querySelector('[data-result-save]').click();
  assert.equal(mounted.store.leer('ECO-A02').status,'borrador');
  assert.equal(win.document.querySelector('[data-db-evidence="ECO-A02"]').dataset.dbEvidenceStatus,'borrador');
  assert.equal(mounted.store.leer('ECO-A02').values.material,values.material);
  assert.match(receiver.querySelector('[data-result-preview]').textContent,/preparación pendiente/);
  const downloads=[];
  win.URL.createObjectURL = blob => { downloads.push(blob);return 'blob:eco'; };
  win.URL.revokeObjectURL = () => {};
  win.HTMLAnchorElement.prototype.click = function () { assert.match(this.download,/ECO-A02/); };
  receiver.querySelector('[data-result-download="json"]').click();
  assert.equal(downloads.length,1);
  receiver.querySelector('[data-result-review]').click();
  assert.equal(mounted.store.leer('ECO-A02').status,'lista');
  assert.equal(JSON.stringify(mounted.store.leer('ECO-A01')),legacy);
  dom.window.close();
});

test('la consulta histórica avisa si el navegador bloquea el almacenamiento', () => {
  const dom = new JSDOM(read('content/portfolio.html'),{url:'http://curso.test'});
  Object.defineProperty(dom.window,'localStorage',{get(){throw new Error('bloqueado');}});
  const portfolio = require('../js/portafolio.js');
  assert.equal(portfolio.init({document:dom.window.document,simulator:require('../js/simulators.js')}),false);
  assert.match(dom.window.document.querySelector('#eco-portfolio-status').textContent,/bloqueó el almacenamiento/);
  dom.window.close();
});

test('el ejemplo completo ofrece tres situaciones sustentadas y un registro identificado como ejemplo', () => {
  const source = read('content/eco-training-example.html');
  const dom = new JSDOM(source);
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('[data-office-scene]').length,3);
  assert.equal(doc.querySelectorAll('[data-office-scene] details').length,6);
  assert.equal(doc.querySelectorAll('script[src]:not([src="devbrain-prose.js"]),script:not([type="application/json"]):not([src="devbrain-prose.js"]),link[href]:not([href="devbrain-prose.css"]),img[src^="http"]').length,0);
  assert.ok(doc.querySelector('link[href="devbrain-prose.css"]'));
  assert.ok(doc.querySelector('script[src="devbrain-prose.js"]'));
  assert.match(doc.body.textContent,/programa local.*no está confirmado/i);
  assert.match(doc.body.textContent,/revisión humana.*pendiente/i);
  for(const scene of doc.querySelectorAll('[data-office-scene]')) {
    assert.ok(scene.querySelector('h2'));
    for(const decision of scene.querySelectorAll('details')) {
      assert.ok(decision.querySelector('summary').textContent.trim());
      assert.match(decision.textContent,/criterio|fuente/i);
    }
  }
  const record=JSON.parse(read('content/eco-training-example.json'));
  const artifact=registry().artifacts.find(item=>item.id==='ECO-A02');
  const valid=require('../js/ai-result-model.js').validateResult(JSON.stringify(record),artifact);
  assert.match(valid.fields.contexto,/ejemplo consultable/i);
  assert.match(valid.fields.verificacion,/revisión humana.*pendiente/i);
  assert.equal(read('materiales/eco-capacitacion/simulacion.html'),source);
  assert.deepEqual(JSON.parse(read('materiales/eco-capacitacion/resultado.json')),record);
  dom.window.close();
});
