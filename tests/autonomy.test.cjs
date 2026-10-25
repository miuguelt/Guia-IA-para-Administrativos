const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const read = path => fs.readFileSync(path, 'utf8');

test('el portafolio cuenta cinco evidencias, muestra el programa correcto y exporta respuestas recuperables', async () => {
  for (const script of ['js/vendor/devbrain-learner-sdk.js', 'js/vendor/devbrain-evidence.js']) {
    const dom = new JSDOM('<div data-db-evidence-dossier></div>' + ['MG-A01','MG-A02','MG-A03','MG-A04','MG-A05','ECO-A01','LAB-A01'].map(id=>`<div data-db-evidence="${id}"></div>`).join(''), {url:'http://aula.test',runScripts:'outside-only'});
    vm.runInContext(read(script), dom.getInternalVMContext());
    dom.window.localStorage.setItem('autonomia_apprentice_profile',JSON.stringify({name:'APRENDIZ ADSO',centro:'Centro declarado',docNumber:'',ficha:''}));
    const engine = dom.window.DevBrainSDK?.evidence || dom.window.DevBrainEvidence;
    const mounted = await engine.montar({registro:JSON.parse(read('deliverables.registry.json')),prefijo:'autonomia'});
    const root = dom.window.document.querySelector('[data-db-evidence-dossier]');
    assert.match(root.querySelector('.dbe-progreso__texto').textContent, /0 de 5/);
    assert.doesNotMatch(root.querySelector('.dossier-header').textContent, /ADSO/);
    assert.match(root.querySelector('.dossier-header').textContent, /21720210/);
    assert.equal(root.querySelector('.dbe-dossier__pendientes').querySelectorAll('li').length, 5);
    assert.doesNotMatch(root.querySelector('#disp-name').textContent, /ADSO/);
    assert.equal(root.querySelector('#disp-centro').textContent,'Centro declarado');
    mounted.store.guardar('MG-A01',{values:{proceso_seleccionado:'Consulta revisada'},checks:{}});
    let blob;
    dom.window.URL.createObjectURL = value => {blob=value;return 'blob:respaldo';};
    dom.window.URL.revokeObjectURL = () => {};
    dom.window.HTMLAnchorElement.prototype.click = function() {};
    root.querySelector('#btn-download-json').click();
    const data = JSON.parse(await new Promise(resolve=>{const reader=new dom.window.FileReader();reader.onload=()=>resolve(reader.result);reader.readAsText(blob);}));
    assert.equal(data.backup.evidencias['MG-A01'].values.proceso_seleccionado,'Consulta revisada');
    assert.equal(data.summary.total,5);
    assert.doesNotMatch(data.program,/ADSO/);
    const style=dom.window.document.createElement('style');
    style.textContent=read('css/ai-workflow.css');dom.window.document.head.append(style);
    const download=root.querySelector('#btn-download-md');
    assert.equal(download.closest('.evidence-form-card'),null);
    assert.notEqual(dom.window.getComputedStyle(download.parentElement).display,'none');
    const artifact=mounted.registro.artifacts.find(item=>item.id==='MG-A01');
    const importer=require('../js/result-import.js');
    const recovered=await importer.importSelection([new dom.window.File([JSON.stringify(data)],'respaldo.json')],artifact,dom.window);
    assert.equal(recovered.result.fields.proceso_seleccionado,'Consulta revisada');
    await assert.rejects(importer.importSelection([new dom.window.File([JSON.stringify({backup:{evidencias:{}}})],'vacio.json')],artifact,dom.window),/no contiene MG-A01/);
    const model=require('../js/ai-result-model.js');
    const recoveredRecord=model.prepareRecord(mounted.store.leer('MG-A01'),recovered.result,artifact);
    assert.equal(recoveredRecord.status,'borrador');
    assert.ok(Object.values(recoveredRecord.checks).every(value=>value===false));
    dom.window.close();
  }
});

test('la exportación queda fuera del bloque de identificación que se oculta', () => {
  assert.doesNotMatch(read('js/vendor/devbrain-evidence.js'),/formCard\.appendChild\(dbeEl\('div',\s*\{\s*clase: 'evidence-actions-bar/s);
});

test('el diagnóstico está en Resuelve y cada familia de tareas tiene ejemplo previo', () => {
  const dom=new JSDOM(read('index.html'));
  const doc=dom.window.document;
  assert.ok(doc.querySelector('#m01-fundamentos [data-panel="resuelve"] [data-diagnosis]'));
  assert.equal(doc.querySelectorAll('#m01-fundamentos [data-diagnosis]').length,1);
  for (const id of ['reto-4','reto-5','reto-6','reto-7']) assert.ok(doc.querySelector(`#m03-implementacion [data-panel="observa"] [data-example-for="${id}"]`),id);
  assert.equal(doc.querySelector('#m01-fundamentos [data-tab="documenta"]').textContent.trim(),'4Guarda tu evidencia');
  assert.ok(doc.querySelector('[data-learning-mode="autonomo"]'));
  assert.ok(doc.querySelector('[data-learning-mode="aula"]'));
  assert.ok(doc.querySelector('.study-mode-switch').closest('header'), 'La modalidad debe permanecer disponible en la barra superior.');
  assert.match(doc.querySelector('#preparacion [data-capability-check]').textContent,/descarga|descargar/iu);
  dom.window.close();
});

test('las referencias de las lecciones y los paquetes usan el mismo encargo canónico', () => {
  const catalog=JSON.parse(read('content/ai-task-briefs.json'));
  for(const file of fs.readdirSync('content/lessons')){
    const dom=new JSDOM(read('content/lessons/'+file));
    for(const card of dom.window.document.querySelectorAll('article.challenge-card')){
      assert.equal(card.querySelector('[data-ai-task]').textContent,catalog[card.id].chatPrompt,card.id);
      assert.ok(read(`materiales/ia/${card.id}/ENCARGO-CHAT.md`).includes(catalog[card.id].chatPrompt),card.id);
    }
    dom.window.close();
  }
});

test('visitas, simulaciones y borradores no se presentan como evidencia revisada', () => {
  const progress=require('../js/course-progress.js');
  const visited={visitedModules:progress.MODULE_IDS,completedSimulators:Object.keys(progress.SIMULATORS),savedEvidences:progress.EVIDENCES};
  assert.equal(progress.computeProgressStats(visited).percentage,0);
  assert.equal(progress.computeProgressStats({...visited,reviewedEvidences:['MG-A01','ECO-A01','MG-A01']}).percentage,20);
});

test('las dos modalidades conservan elección, accesibilidad y una ruta útil sin almacenamiento', () => {
  const mode=require('../js/course-mode.js');
  assert.equal(mode.init(null),false);
  const dom=new JSDOM('<details class="study-mode-switch" open><summary><span data-mode-label></span></summary><button data-learning-mode="autonomo"></button><button data-learning-mode="aula"></button><p data-mode-status></p></details><div data-mode-only="autonomo">Individual</div><div data-mode-only="aula">Equipo</div>',{url:'http://aula.test'});
  const doc=dom.window.document;
  assert.equal(mode.init(doc),true);
  assert.equal(doc.body.dataset.learningMode,'autonomo');
  assert.equal(doc.querySelector('[data-mode-label]').textContent,'Por mi cuenta');
  doc.body.insertAdjacentHTML('beforeend','<nav id="course-nav"><a data-module-link="m01-fundamentos"><small class="nav-meta">Martes · 8 h</small></a></nav>');
  const style=doc.createElement('style');style.textContent=read('css/course-shell.css')+read('css/ai-workflow.css');doc.head.append(style);
  assert.equal(dom.window.getComputedStyle(doc.querySelector('.nav-meta')).display,'none');
  doc.querySelector('[data-learning-mode="aula"]').click();
  assert.equal(doc.querySelector('[data-mode-label]').textContent,'Con instructor');
  assert.equal(doc.querySelector('[data-mode-only="autonomo"]').hidden,true);
  assert.equal(doc.querySelector('[data-mode-only="aula"]').hidden,false);
  assert.equal(dom.window.getComputedStyle(doc.querySelector('.nav-meta')).display,'block');
  assert.equal(doc.querySelector('[data-learning-mode="aula"]').getAttribute('aria-pressed'),'true');
  assert.equal(dom.window.localStorage.getItem(mode.KEY),'aula');
  assert.equal(doc.querySelector('.study-mode-switch').open,false);
  assert.equal(doc.activeElement,doc.querySelector('.study-mode-switch > summary'));
  assert.equal(mode.init(new JSDOM('').window.document),false);
  const get=dom.window.Storage.prototype.getItem, set=dom.window.Storage.prototype.setItem;
  dom.window.Storage.prototype.getItem=()=>{throw Error('Sin acceso');};
  dom.window.Storage.prototype.setItem=()=>{throw Error('Sin espacio');};
  assert.equal(mode.init(doc),true);
  doc.querySelector('[data-learning-mode="autonomo"]').click();
  assert.match(doc.querySelector('[data-mode-status]').textContent,/no pudo recordar/);
  dom.window.Storage.prototype.getItem=get;dom.window.Storage.prototype.setItem=set;
  dom.window.close();
});

test('el avance lee la evidencia real, vuelve a borrador tras importar y conserva la separación institucional', async () => {
  const dom=new JSDOM('<div data-db-evidence="MG-A01"></div><span id="course-progress-saved-time"></span>',{url:'http://aula.test',runScripts:'outside-only'});
  vm.runInContext(read('js/vendor/devbrain-learner-sdk.js'),dom.getInternalVMContext());
  const progress=require('../js/course-progress.js').init({document:dom.window.document,storage:dom.window.localStorage});
  const mounted=await dom.window.DevBrainSDK.evidence.montar({registro:{artifacts:[{id:'MG-A01',fields:[{key:'dato',required:true}],checklist:['Fuente contrastada']}],submission:{}},prefijo:'avance-real'});
  const unsubscribe=progress.connect(mounted);
  mounted.store.guardar('MG-A01',{values:{dato:'Resultado'},checks:{c0:false},status:'borrador'});
  assert.equal(progress.getStats().percentage,0);
  mounted.store.guardar('MG-A01',{checks:{c0:true},status:'lista'});
  assert.equal(progress.getStats().percentage,20);
  mounted.store.guardar('MG-A01',{checks:{c0:false},status:'borrador'});
  assert.equal(progress.getStats().percentage,0);
  assert.match(dom.window.document.getElementById('course-progress-saved-time').textContent,/0 de 5.*revisadas/);
  if(typeof unsubscribe==='function')unsubscribe();
  dom.window.close();
});

test('la auditoría distingue contradicción y ausencia de información', () => {
  const { Simulator } = require('../js/case-practices.js');
  const dom = new JSDOM(read('index.html'));
  const root = dom.window.document.querySelector('#m04-validacion [data-simulator="case-practice"]');
  const plugin = new Simulator({container:root}); plugin.render();
  const choose = (id,value) => {
    const form=root.querySelector('[data-case-question="'+id+'"]');
    const input=form.querySelector('input[value="'+value+'"]');
    input.checked=true; input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
    form.querySelector('[data-case-submit]').click(); return form;
  };
  assert.equal(choose('cifra','not-stated').dataset.state,'review');
  assert.equal(choose('cifra','contradicted').dataset.state,'correct');
  assert.equal(choose('periodo','not-stated').dataset.state,'correct');
  root.querySelector('[data-case-reset]').click();
  assert.equal(root.querySelectorAll('input:checked').length,0);
  plugin.destroy(); dom.window.close();
});
