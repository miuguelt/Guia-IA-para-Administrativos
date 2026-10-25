const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');

async function fixture(blocked=false){
  const dom=new JSDOM('<div data-db-evidence="MG-A02"></div><div data-db-evidence-dossier></div>',{url:'http://aula.test',runScripts:'outside-only'});
  dom.window.HTMLElement.prototype.scrollIntoView=function(){};
  const errors=[];dom.window.console.warn=(...args)=>errors.push(args[0]);
  vm.runInContext(fs.readFileSync('js/vendor/devbrain-learner-sdk.js','utf8'),dom.getInternalVMContext(),{filename:path.resolve('js/vendor/devbrain-learner-sdk.js')});
  const registry={guideId:'prueba',artifacts:[{id:'MG-A02',name:'Instrucciones',station:{sectionId:'m02'},fields:[{key:'borrador',label:'Borrador'},{key:'prueba',label:'Prueba'}],checklist:['Contrasta la fuente.']} ]};
  const mounted=await dom.window.DevBrainSDK.evidence.montar({registro:registry,prefijo:'aula'});
  if(blocked) Object.defineProperty(dom.window,'localStorage',{value:{getItem(){return null;},setItem(){throw new Error('Sin espacio');}}});
  return {dom,mounted,artifact:mounted.registro.artifacts[0],errors};
}

test('guarda mediante el SDK, conserva respuestas previas y exige revisión explícita',async()=>{
  const bridge=require('../js/ai-result-store.js');
  const {dom,mounted,artifact}=await fixture();
  mounted.store.guardar('MG-A02',{values:{prueba:'Prueba previa'},checks:{c0:true}});
  const result={artifactId:'MG-A02',fields:{borrador:'<script>no ejecutar</script>'},tool:'Antigravity'};
  const record=bridge.commitResult(mounted,result,dom.window.document);
  assert.equal(record.values.prueba,'Prueba previa');
  assert.equal(mounted.resumen().detalle[0].estado,'borrador');
  assert.equal(dom.window.document.getElementById('dbe-MG-A02-borrador').value,result.fields.borrador);
  assert.equal(dom.window.document.querySelector('[data-db-evidence]').dataset.dbEvidenceStatus,'borrador');
  assert.equal(mounted.store.leerBitacora()[0].tool,'Antigravity');
  assert.match(mounted.store.leerBitacora()[0].verified,/pendiente/iu);
  const reviewed=bridge.confirmReview(mounted,'MG-A02',dom.window.document);
  assert.equal(reviewed.checks.c0,true);
  assert.equal(mounted.resumen().detalle[0].estado,'lista');
  assert.equal(dom.window.document.getElementById('dbe-MG-A02-c0').checked,true);
  assert.notEqual(artifact.criterion,'Aprobado');
  dom.window.close();
});

test('archivo parcial, almacenamiento bloqueado y destino incorrecto no se anuncian como completos',async()=>{
  const bridge=require('../js/ai-result-store.js');
  const f=await fixture();
  assert.throws(()=>bridge.confirmReview(f.mounted,'MG-A02',f.dom.window.document),/faltan/iu);
  assert.throws(()=>bridge.commitResult(f.mounted,{artifactId:'otro',fields:{x:'a'}},f.dom.window.document),/evidencia/iu);
  bridge.commitResult(f.mounted,{artifactId:'MG-A02',fields:{borrador:'Parcial'},tool:'No identificado'},f.dom.window.document);
  assert.equal(f.mounted.resumen().listas,0);
  assert.throws(()=>bridge.confirmReview(f.mounted,'otro',f.dom.window.document),/evidencia/iu);
  f.dom.window.document.getElementById('dbe-MG-A02-borrador').remove();
  bridge.syncForm(f.mounted,'MG-A02',f.dom.window.document);
  f.dom.window.close();
  const blocked=await fixture(true);
  assert.throws(()=>bridge.commitResult(blocked.mounted,{artifactId:'MG-A02',fields:{borrador:'No guardado'},tool:'Chat'},blocked.dom.window.document),/guardar/iu);
  assert.equal(blocked.mounted.store.leer('MG-A02').status,'pendiente');
  blocked.dom.window.close();
});

test('saveInlineField guarda edición en línea y preserva productos elaborados',async()=>{
  const bridge=require('../js/ai-result-store.js');
  const f=await fixture();
  bridge.commitResult(f.mounted,{artifactId:'MG-A02',fields:{borrador:'Inicial'},tool:'Chat',elaboratedProduct:{kind:'canva_link',name:'Diseño',url:'https://www.canva.com/design/DAG1/view',format:'canva'}},f.dom.window.document);
  const updated=bridge.saveInlineField(f.mounted,'MG-A02','prueba','Completado en línea',f.dom.window.document);
  assert.equal(updated.values.prueba,'Completado en línea');
  assert.equal(updated.elaboratedProduct.kind,'canva_link');
  assert.throws(()=>bridge.saveInlineField(f.mounted,'no-existe','prueba','x',f.dom.window.document),/evidencia/iu);
  f.dom.window.close();
});
