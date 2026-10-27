const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const tick=()=>new Promise(resolve=>setTimeout(resolve,100));
async function settled(root){
 for(let attempt=0;attempt<100&&root.getAttribute('aria-busy')==='true';attempt++)await tick();
 assert.equal(root.getAttribute('aria-busy'),'false');
}
async function ready(root){
 for(let attempt=0;attempt<100 && root.querySelector('[data-result-save]').disabled;attempt++) await tick();
 assert.equal(root.querySelector('[data-result-save]').disabled,false,root.querySelector('[data-result-status]').textContent);
}

async function fixture(folderSupported=true,withText=false){
 const dom=new JSDOM(`<section class="module-page"><section data-ai-delivery="MG-A02"><input type="file" data-result-file><p data-result-info></p><p data-result-status role="status"></p><div data-result-preview></div><button data-result-save disabled>Guardar</button><button data-result-review disabled>Revisé</button><button data-result-download="md" disabled>Documento</button><button data-result-download="json" disabled>JSON</button><button data-result-download="html" disabled>Imprimible</button></section><div hidden data-ai-storage><div data-db-evidence="MG-A02"></div></div></section><div data-db-evidence-dossier></div>`,{url:'http://aula.test',runScripts:'outside-only'});
 dom.window.HTMLElement.prototype.scrollIntoView=function(){};
 const receiver=dom.window.document.querySelector('[data-ai-delivery]');
 receiver.insertAdjacentHTML('beforeend','<div data-result-folder-control><input type="file" data-result-folder webkitdirectory multiple></div><p data-result-folder-help hidden>Selecciona el ZIP.</p><button data-result-retry hidden>Seleccionar de nuevo</button>');
 if(withText)receiver.insertAdjacentHTML('beforeend','<textarea data-result-text></textarea><button data-result-paste>Comprobar</button>');
 if(folderSupported)Object.defineProperty(dom.window.HTMLInputElement.prototype,'webkitdirectory',{configurable:true,value:true});
 for(const file of ['js/vendor/devbrain-learner-sdk.js','js/vendor/fflate.js','js/result-archive.js','js/ai-result-model.js','js/result-import.js','js/ai-result-store.js','js/ai-delivery-view.js','js/ai-delivery.js'])vm.runInContext(fs.readFileSync(file,'utf8'),dom.getInternalVMContext(),{filename:path.resolve(file)});
 const mounted=await dom.window.DevBrainSDK.evidence.montar({registro:{guideId:'prueba',artifacts:[{id:'MG-A02',name:'Instrucciones',fields:[{key:'borrador',label:'Borrador'},{key:'prueba',label:'Prueba'}],checklist:['Contrasta las fuentes.']}]},prefijo:'aula'});
 const root=dom.window.document.querySelector('[data-ai-delivery]');
 dom.window.AIDelivery.init({document:dom.window.document,mounted});
 return {dom,mounted,root,input:root.querySelector('input')};
}
function choose(f,text,name='resultado.json'){
 const file=new f.dom.window.File([text],name,{type:'application/json'});
 Object.defineProperty(f.input,'files',{configurable:true,value:[file]});
 f.input.dispatchEvent(new f.dom.window.Event('change'));
}

test('pega un resultado completo, rechaza errores y exige comprobar de nuevo si cambia el texto', async()=>{
 const f=await fixture(true,true);
 const text=f.root.querySelector('[data-result-text]'),paste=f.root.querySelector('[data-result-paste]');
 text.value=JSON.stringify({schemaVersion:1,artifactId:'MG-A02',fields:{borrador:'Respuesta pegada'}});
 paste.click();await ready(f.root);
 assert.equal(f.mounted.store.leer('MG-A02').values.borrador,undefined);
 paste.textContent='Comprobar la página';
 text.dispatchEvent(new f.dom.window.Event('input'));
 assert.match(f.root.querySelector('[data-result-status]').textContent,/«Comprobar la página»/u);
 assert.equal(f.root.querySelector('[data-result-save]').disabled,true);
 paste.click();await ready(f.root);f.root.querySelector('[data-result-save]').click();
 assert.equal(f.mounted.store.leer('MG-A02').values.borrador,'Respuesta pegada');
 text.value='incorrecto';paste.click();await settled(f.root);
 assert.equal(f.root.querySelector('[data-result-status]').getAttribute('role'),'alert');
 f.root.querySelector('[data-result-retry]').click();await settled(f.root);
 assert.equal(f.mounted.store.leer('MG-A02').values.borrador,'Respuesta pegada');
 f.dom.window.close();
});

test('editar el texto mientras se lee un archivo cancela la vista previa anterior y libera el estado de carga',async()=>{
 const f=await fixture(true,true);
 let reader;
 f.dom.window.FileReader=class {readAsText(){reader=this;}};
 choose(f,'pendiente');
 assert.equal(f.root.getAttribute('aria-busy'),'true');
 const text=f.root.querySelector('[data-result-text]');text.value='Versión nueva';text.dispatchEvent(new f.dom.window.Event('input'));
 assert.equal(f.root.getAttribute('aria-busy'),'false');
 reader.result=JSON.stringify({schemaVersion:1,artifactId:'MG-A02',fields:{borrador:'Archivo anterior'}});reader.onload();
 await tick();
 assert.equal(f.root.querySelector('[data-result-save]').disabled,true);
 assert.equal(f.mounted.store.leer('MG-A02').values.borrador,undefined);
 f.dom.window.close();
});

test('recibe un archivo real, muestra las respuestas sin ejecutarlas y guarda después de revisar la vista',async()=>{
 const f=await fixture();
 choose(f,JSON.stringify({schemaVersion:1,artifactId:'MG-A02',fields:{borrador:'<img src=x onerror=alert(1)>',prueba:'No consta la fecha.'},tool:'Antigravity'}));
 await ready(f.root);
 assert.equal(f.root.querySelector('[data-result-save]').disabled,false);
 assert.equal(f.mounted.store.leer('MG-A02').status,'pendiente');
 assert.equal(f.root.querySelector('[data-result-preview] img'),null);
 assert.match(f.root.querySelector('[data-result-preview]').textContent,/<img src=x/);
 f.root.querySelector('[data-result-save]').click();
 assert.equal(f.mounted.resumen().detalle[0].estado,'borrador');
 assert.equal(f.root.querySelector('[data-result-review]').disabled,false);
 f.root.querySelector('[data-result-review]').click();
 assert.equal(f.mounted.resumen().detalle[0].estado,'lista');
 assert.match(f.root.querySelector('[data-result-status]').textContent,/instructor/iu);
 assert.equal(f.root.querySelector('[data-result-preview] textarea:not([data-field-input])'),null);
 const downloads=[];
 f.dom.window.URL.createObjectURL=blob=>{downloads.push(blob);return 'blob:prueba';};
 f.dom.window.URL.revokeObjectURL=url=>assert.equal(url,'blob:prueba');
 f.dom.window.HTMLAnchorElement.prototype.click=function(){assert.match(this.download,/MG-A02\.(md|json|html)/);};
 f.root.querySelectorAll('[data-result-download]').forEach(button=>button.click());
 assert.equal(downloads.length,3);
 assert.equal(downloads[2].type,'text/html;charset=utf-8');
 choose(f,JSON.stringify({schemaVersion:1,artifactId:'MG-A02',fields:{borrador:'Versión todavía sin guardar'}}));
 await ready(f.root);
 assert.equal(f.root.querySelector('[data-result-review]').disabled,true,'La vista previa nueva no permite confirmar la versión anterior.');
 assert.ok([...f.root.querySelectorAll('[data-result-download]')].every(button=>button.disabled));
 assert.match(f.root.querySelector('[data-result-info]').textContent,/sin guardar/iu);
 choose(f,'No es JSON','incorrecto.docx'); await tick();
 assert.equal(f.root.querySelector('[data-result-review]').disabled,true,'La revisión confirmada sigue registrada después de descartar el archivo inválido.');
 assert.match(f.root.querySelector('[data-result-preview]').textContent,/No consta la fecha/u);
 assert.doesNotMatch(f.root.querySelector('[data-result-preview]').textContent,/Versión todavía sin guardar/u);
 f.dom.window.AIDelivery.init({document:f.dom.window.document,mounted:f.mounted});
 assert.equal(f.root.dataset.deliveryReady,'true');
 f.dom.window.close();
});

test('importa la página visual resultado.html sin ejecutar su contenido y guarda la misma evidencia',async()=>{
 const f=await fixture();
 f.dom.window.__contenidoEjecutado=false;
 const payload=JSON.stringify({schemaVersion:1,artifactId:'MG-A02',fields:{borrador:'Tarjeta visual revisada',prueba:'La fuente respalda el dato.'},tool:'Asistente de práctica'}).replace(/</g,'\\u003c');
 const html=`<!doctype html><html lang="es-CO"><body><h1>Respuestas verificables</h1><script>window.__contenidoEjecutado=true</script><script type="application/json" id="devbrain-evidence-result">${payload}</script></body></html>`;
 choose(f,html,'resultado.html');
 await ready(f.root);
 assert.equal(f.dom.window.__contenidoEjecutado,false);
 assert.match(f.root.querySelector('[data-result-preview]').textContent,/Tarjeta visual revisada/u);
 f.root.querySelector('[data-result-save]').click();
 assert.equal(f.mounted.store.leer('MG-A02').values.borrador,'Tarjeta visual revisada');
 assert.equal(f.mounted.store.leer('MG-A02').values.prueba,'La fuente respalda el dato.');
 assert.equal(f.mounted.store.leer('MG-A02').status,'borrador');
 f.dom.window.close();
});

test('rechaza archivos incorrectos y permite corregirlos sin borrar respuestas guardadas',async()=>{
 const f=await fixture();
 f.mounted.store.guardar('MG-A02',{values:{borrador:'Se conserva'},checks:{c0:false}});
 choose(f,'Texto','resultado.docx'); await settled(f.root);
 assert.match(f.root.querySelector('[data-result-status]').textContent,/formato no se puede incorporar.*página/iu);
 choose(f,'JSON inválido'); await settled(f.root);
 assert.match(f.root.querySelector('[data-result-status]').textContent,/datos del resultado/iu);
 choose(f,JSON.stringify({schemaVersion:1,artifactId:'MG-A03',fields:{borrador:'otro'}}));await settled(f.root);
 assert.equal(f.root.querySelector('[data-result-save]').disabled,true);
 assert.equal(f.mounted.store.leer('MG-A02').values.borrador,'Se conserva');
 Object.defineProperty(f.input,'files',{configurable:true,value:[]});
 f.input.dispatchEvent(new f.dom.window.Event('change'));await tick();
 Object.defineProperty(f.input,'files',{configurable:true,value:[{name:'grande.json',size:1048577}]});
 f.input.dispatchEvent(new f.dom.window.Event('change'));await tick();
 assert.match(f.root.querySelector('[data-result-status]').textContent,/1 MB/iu);
 f.root.querySelector('[data-result-review]').disabled=false;f.root.querySelector('[data-result-review]').click();
 assert.match(f.root.querySelector('[data-result-status]').textContent,/faltan/iu);
 choose(f,JSON.stringify({schemaVersion:1,artifactId:'MG-A02',fields:{prueba:'Parcial'},tool:'Chat'}));await settled(f.root);
 f.root.querySelector('[data-result-save]').click();
 assert.equal(f.mounted.store.leer('MG-A02').values.borrador,'Se conserva');
 f.root.querySelector('[data-result-save]').disabled=false;f.root.querySelector('[data-result-save]').click();
 f.dom.window.close();
});

test('informa fallos de lectura y tolera un destino sin estación',async()=>{
 const api=require('../js/ai-delivery.js');
 await assert.rejects(api.readResultFile({},{FileReader:class{readAsText(){this.onerror();}}}),/leer/iu);
 await assert.rejects(api.readResultFile({},{FileReader:class{readAsText(){this.onabort();}}}),/cancel/iu);
 const dom=new JSDOM('<section data-ai-delivery="no-existe"></section>');
 assert.equal(api.init({document:dom.window.document,mounted:{registro:{artifacts:[]}}}),0);
 dom.window.close();
});

test('el acceso desde el reto lleva al receptor del archivo y no al campo oculto del SDK',async()=>{
 const f=await fixture();
 const tools=require('../js/course-tools.js');
 assert.equal(tools.focusEvidenceField(f.dom.window.document,'dbe-MG-A02-borrador'),true);
 assert.equal(f.dom.window.document.activeElement,f.input);
 f.dom.window.close();
});

test('acepta texto con el resultado y anuncia un error accesible sin perder el borrador',async()=>{
 const f=await fixture();
 f.mounted.store.guardar('MG-A02',{values:{borrador:'Se conserva'},checks:{c0:false}});
 choose(f,JSON.stringify({schemaVersion:1,artifactId:'MG-A02',fields:{prueba:'Resultado en texto'}}),'resultado.TXT');
 await ready(f.root);
 assert.equal(f.root.querySelector('[data-result-save]').disabled,false);
 choose(f,'No es un archivo ZIP','dañado.zip');await settled(f.root);
 const status=f.root.querySelector('[data-result-status]');
 assert.equal(status.getAttribute('role'),'alert');
 assert.match(status.textContent,/ZIP.*dañado/iu);
 assert.equal(f.mounted.store.leer('MG-A02').values.borrador,'Se conserva');
 assert.equal(f.root.querySelector('[data-result-save]').disabled,true);
 assert.equal(f.root.querySelector('.delivery-receive')?.getAttribute('aria-busy')??f.root.getAttribute('aria-busy'),'false');
 f.dom.window.close();
});

test('recibe una carpeta, permite reintentar el mismo ZIP y conserva las respuestas ante corrupción',async()=>{
 const f=await fixture();
 const {zipSync,strToU8}=require('fflate');
 const payload=JSON.stringify({schemaVersion:1,artifactId:'MG-A02',fields:{borrador:'Contenido del ZIP',prueba:'Fuente contrastada'}});
 const archive=zipSync({'subcarpeta/resultado.json':strToU8(payload),'anexo.pdf':strToU8('PDF')});
 choose(f,archive,'entrega.zip');await ready(f.root);
 assert.match(f.root.querySelector('[data-result-status]').textContent,/omitió 1 archivo/iu);
 f.root.querySelector('[data-result-save]').click();
 const before=JSON.stringify(f.mounted.store.leer('MG-A02'));
 choose(f,'ZIP dañado','entrega.zip');await settled(f.root);
 assert.equal(f.root.querySelector('[data-result-retry]').hidden,false);
 let clicked=0;f.input.click=()=>{clicked++;};
 f.root.querySelector('[data-result-retry]').click();assert.equal(clicked,1);
 assert.equal(JSON.stringify(f.mounted.store.leer('MG-A02')),before);
 const folder=f.root.querySelector('[data-result-folder]');
 const result=new f.dom.window.File([payload],'resultado.json');
 Object.defineProperty(result,'webkitRelativePath',{value:'Entrega/sub/resultado.json'});
 Object.defineProperty(folder,'files',{configurable:true,value:[result,new f.dom.window.File(['PDF'],'informe.pdf')]});
 folder.dispatchEvent(new f.dom.window.Event('change'));await ready(f.root);
 assert.match(f.root.querySelector('[data-result-status]').textContent,/Entrega\/sub\/resultado.json/u);
 assert.equal(f.root.querySelector('[data-result-status]').getAttribute('role'),'status');
 assert.equal(f.root.querySelector('[data-result-retry]').hidden,true);
 assert.equal(f.root.querySelector('[data-result-folder-control]').hidden,false);
 f.dom.window.close();
});

test('ofrece una alternativa cuando el navegador no permite elegir carpetas',async()=>{
 const f=await fixture(false);
 assert.equal(f.root.querySelector('[data-result-folder-control]').hidden,true);
 assert.equal(f.root.querySelector('[data-result-folder-help]').hidden,false);
 f.dom.window.close();
});

test('reintenta el guardado si el almacenamiento falla y conserva la vista previa',async()=>{
 const f=await fixture();
 choose(f,JSON.stringify({schemaVersion:1,artifactId:'MG-A02',fields:{borrador:'Por guardar'}}));await ready(f.root);
 const original=f.dom.window.Storage.prototype.setItem;
 f.dom.window.Storage.prototype.setItem=function(){throw new f.dom.window.DOMException('Sin espacio','QuotaExceededError');};
 f.root.querySelector('[data-result-save]').click();
 assert.equal(f.root.querySelector('[data-result-status]').getAttribute('role'),'alert');
 assert.match(f.root.querySelector('[data-result-retry]').textContent,/guardado/iu);
 assert.match(f.root.querySelector('[data-result-preview]').textContent,/Por guardar/u);
 f.dom.window.Storage.prototype.setItem=original;
 f.root.querySelector('[data-result-retry]').click();
 assert.equal(f.mounted.store.leer('MG-A02').values.borrador,'Por guardar');
 assert.equal(f.root.querySelector('[data-result-retry]').hidden,true);
 f.dom.window.close();
});

test('una lectura anterior que termina tarde no reemplaza la selección más reciente',async()=>{
 const f=await fixture();
 const Reader=f.dom.window.FileReader,requests=[];
 f.dom.window.FileReader=class extends Reader{readAsText(file,encoding){requests.push(()=>super.readAsText(file,encoding));}};
 const envelope=text=>JSON.stringify({schemaVersion:1,artifactId:'MG-A02',fields:{borrador:text}});
 choose(f,envelope('Versión anterior'));
 choose(f,envelope('Versión vigente'));
 requests[1]();await ready(f.root);
 requests[0]();await tick();
 assert.match(f.root.querySelector('[data-result-preview]').textContent,/Versión vigente/u);
 assert.doesNotMatch(f.root.querySelector('[data-result-preview]').textContent,/Versión anterior/u);
 f.dom.window.close();
});

test('edita campos pendientes en línea con autoguardado y registra enlaces de Canva',async()=>{
 const f=await fixture();
 const canvaInput=f.dom.window.document.createElement('input');
 canvaInput.setAttribute('data-result-canva','');
 const canvaBtn=f.dom.window.document.createElement('button');
 canvaBtn.setAttribute('data-result-canva-btn','');
 f.root.append(canvaInput,canvaBtn);
 delete f.root.dataset.deliveryReady;
 f.dom.window.AIDelivery.init({document:f.dom.window.document,mounted:f.mounted});
 canvaInput.value='enlace-invalido';
 canvaBtn.click();
 assert.equal(f.root.querySelector('[data-result-status]').getAttribute('role'),'alert');
 canvaInput.value='https://www.canva.com/design/DAG888/view';
 canvaBtn.click();
 assert.match(f.root.querySelector('[data-result-status]').textContent,/Canva registrado.*Borrador guardado localmente/iu);
 assert.match(f.root.querySelector('[data-result-preview]').textContent,/Producto elaborado registrado/iu);

 const inlineInput=f.root.querySelector('[data-field-input="prueba"]');
 assert.ok(inlineInput);
 inlineInput.value='Respuesta completada en línea';
 inlineInput.dispatchEvent(new f.dom.window.Event('input',{bubbles:true}));
 assert.equal(f.mounted.store.leer('MG-A02').values.prueba,'Respuesta completada en línea');
 assert.match(f.root.querySelector('[data-result-status]').textContent,/Borrador guardado localmente/iu);
 assert.equal(f.root.querySelector('[data-result-review]').disabled,false);
 f.dom.window.close();
});
