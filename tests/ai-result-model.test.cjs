const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const modulePath = path.resolve('js/ai-result-model.js');
const artifact = {id:'MG-A02',name:'Instrucciones',fields:[{key:'borrador',label:'Borrador',required:true},{key:'prueba',label:'Prueba',required:true}],checklist:['Contrasta la fuente.']};

test('el resultado admite respuestas parciales y conserva datos pendientes sin inventarlos', () => {
  const model = require(modulePath);
  const result = model.validateResult(JSON.stringify({schemaVersion:1,artifactId:'MG-A02',fields:{borrador:'  Fecha: no consta.  '},tool:'Gemini'}),artifact);
  assert.deepEqual(result,{artifactId:'MG-A02',fields:{borrador:'Fecha: no consta.'},tool:'Gemini'});
  const record = model.prepareRecord({values:{prueba:'Caso pendiente'},checks:{c0:true}},result,artifact);
  assert.deepEqual(record.values,{prueba:'Caso pendiente',borrador:'Fecha: no consta.'});
  assert.equal(record.checks.c0,false);
  assert.equal(record.status,'borrador');
  assert.deepEqual(model.missingFields(artifact,{values:result.fields}),['Prueba']);
  assert.deepEqual(model.missingFields(artifact,record),[]);
  const text = model.documentText(artifact,record);
  assert.match(text,/# MG-A02.*Instrucciones/su);
  assert.match(text,/Borrador.*Fecha: no consta.*Prueba.*Caso pendiente/su);
  assert.match(text,/revisión humana.*pendiente/iu);
  assert.match(model.documentText(artifact,{...record,checks:{c0:true}}),/Revisión confirmada por el aprendiz/iu);
});

test('valida formato, identidad, claves y límites del documento antes de modificar la evidencia', () => {
  const model = require(modulePath);
  const base = {schemaVersion:1,artifactId:'MG-A02',fields:{borrador:'Resultado'}};
  assert.equal(model.validateResult(JSON.stringify(base),artifact).tool,'No identificado');
  for(const payload of ['no-json','null','[]',JSON.stringify({...base,schemaVersion:2}),JSON.stringify({...base,artifactId:'MG-A03'}),JSON.stringify({...base,checks:{c0:true}}),JSON.stringify({...base,fields:[]}),JSON.stringify({...base,fields:{}}),JSON.stringify({...base,fields:{otra:'Valor'}}),JSON.stringify({...base,fields:{borrador:1}}),JSON.stringify({...base,fields:{borrador:' '}}),JSON.stringify({...base,fields:{borrador:'x'.repeat(120001)}}),JSON.stringify({...base,tool:1})]) {
    assert.throws(()=>model.validateResult(payload,artifact),Error,payload.slice(0,80));
  }
  assert.throws(()=>model.validateResult('x'.repeat(1048577),artifact),/tamaño/iu);
  assert.throws(()=>model.validateResult('{"schemaVersion":1,"artifactId":"MG-A02","fields":{"__proto__":"ataque"}}',artifact),/campo/iu);
  assert.equal({}.ataque,undefined);
  assert.deepEqual(model.missingFields({...artifact,fields:[{key:'opcional',label:'Opcional',required:false}]},{values:{}}),[]);
  assert.match(model.documentText(artifact,{values:{}}),/Pendiente/u);
  const html = model.documentHtml({...artifact,name:'Informe <sin aprobación>'},{values:{borrador:'<script>alert(1)</script>',prueba:'Fuente verificada'},checks:{c0:true}});
  assert.match(html,/<!doctype html>/iu);
  assert.match(html,/lang="es-CO"/u);
  assert.match(html,/border:/u);
  assert.match(html,/Informe &lt;sin aprobación&gt;/u);
  assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/u);
  assert.doesNotMatch(html,/<script>/u);
  assert.match(html,/Revisión confirmada/u);
  assert.match(model.documentHtml(artifact,{values:{}}),/Pendiente/u);
  assert.ok(fs.existsSync(modulePath));
});

test('parsea texto libre, encabezados Markdown, enlaces de Canva y preserva productos elaborados', () => {
  const model = require(modulePath);
  assert.equal(model.normalizeKeyText('  Análisis de Riesgo · Ley 1581! '), 'analisis de riesgo ley 1581');
  assert.equal(model.isValidCanvaUrl('https://www.canva.com/design/DAG12345/view'), true);
  assert.equal(model.isValidCanvaUrl('https://example.com/design'), false);
  assert.equal(model.matchFieldForHeader('   ', artifact), null);
  assert.equal(model.matchFieldForHeader('Borrador de respuesta', artifact), 'borrador');
  const synArtifact = {
    id: 'MG-A01',
    name: 'Diagnóstico',
    fields: [
      { key: 'reto00_semaforo_datos', label: 'Semáforo de privacidad', required: true },
      { key: 'analisis_riesgo_ley1581', label: 'Análisis de riesgo', required: true }
    ],
    checklist: ['Verifica Ley 1581.']
  };
  assert.equal(model.matchFieldForHeader('Cinco tarjetas de evaluación', synArtifact), 'reto00_semaforo_datos');
  assert.equal(model.matchFieldForHeader('Sección desconocida', synArtifact), null);

  const mdInput = [
    '# Cinco tarjetas de evaluación',
    'Tarjeta 1 en rojo por datos sensibles.',
    '## Cinco tarjetas de evaluación',
    'Tarjeta 2 en verde.',
    '# Encabezado no mapeado',
    'Análisis detallado de la Ley 1581 con controles.',
    'Enlace: https://www.canva.com/design/DAG999/view'
  ].join('\n');
  const parsedMd = model.validateResult(mdInput, synArtifact, { tolerant: true });
  assert.equal(parsedMd.artifactId, 'MG-A01');
  assert.match(parsedMd.fields.reto00_semaforo_datos, /Tarjeta 1.*Tarjeta 2/su);
  assert.match(parsedMd.fields.analisis_riesgo_ley1581, /Ley 1581/u);
  assert.equal(parsedMd.elaboratedProduct.kind, 'canva_link');

  const inlineLabels = '**Borrador**: Texto inicial del oficio.\n- Prueba: Verificación con casos.';
  const parsedInline = model.parseTolerantResult(inlineLabels, artifact);
  assert.equal(parsedInline.fields.borrador, 'Texto inicial del oficio.');
  assert.equal(parsedInline.fields.prueba, 'Verificación con casos.');

  const multiPara = 'Primer párrafo extenso con más de cuatro palabras y veinte caracteres.\n\nSegundo párrafo extenso con el resultado de la prueba.';
  const parsedPara = model.parseTolerantResult(multiPara, artifact);
  assert.match(parsedPara.fields.borrador, /Primer párrafo/u);
  assert.match(parsedPara.fields.prueba, /Segundo párrafo/u);

  const singlePara = 'Un único párrafo suficientemente largo para asignarse al primer campo sin encabezados.';
  const parsedSingle = model.parseTolerantResult(singlePara, { ...artifact, fields: [artifact.fields[0]] });
  assert.match(parsedSingle.fields.borrador, /único párrafo/u);

  const onlyCanva = model.parseTolerantResult('https://www.canva.com/design/DAG777/view', artifact);
  assert.match(onlyCanva.fields.borrador, /canva\.com/iu);
  assert.equal(onlyCanva.elaboratedProduct.kind, 'canva_link');

  const jsonViaTolerant = model.parseTolerantResult(JSON.stringify({
    schemaVersion: 1,
    artifactId: 'MG-A02',
    fields: { borrador: 'Desde JSON' },
    elaboratedProduct: { kind: 'file', name: 'entrega.pdf', format: 'pdf', size: 1200 }
  }), artifact);
  assert.equal(jsonViaTolerant.elaboratedProduct.name, 'entrega.pdf');

  const recWithProd = model.prepareRecord({ values: {}, checks: {} }, onlyCanva, artifact);
  assert.match(model.documentText(artifact, recWithProd), /Producto elaborado registrado.*canva\.com/su);
  assert.match(model.documentHtml(artifact, recWithProd), /Producto elaborado registrado.*canva\.com/su);

  assert.throws(() => model.parseTolerantResult('   ', artifact), /vacío/iu);
  assert.throws(() => model.parseTolerantResult('corto', artifact), /No se identificaron las partes.*página completa/iu);
  assert.throws(() => model.parseTolerantResult('x'.repeat(1048577), artifact), /tamaño/iu);
});

test('el registro de uso de IA guarda una sección por reto y reemplaza solo la del reto importado', () => {
  const model = require(modulePath);
  assert.deepEqual(model.CUMULATIVE_FIELDS, ['uso_ia_y_revision']);
  assert.equal(model.mergeCumulativeField('', 'Uso 4', 'Reto 4'), '### Reto 4\n\nUso 4');
  assert.equal(model.mergeCumulativeField('### Reto 4\n\nUso 4', 'Uso 5', 'Reto 5'), '### Reto 4\n\nUso 4\n\n### Reto 5\n\nUso 5');
  assert.equal(model.mergeCumulativeField('### Reto 5\n\nUso 5\n\n### Reto 4\n\nUso 4', 'Uso 4 corregido', 'Reto 4'), '### Reto 4\n\nUso 4 corregido\n\n### Reto 5\n\nUso 5');
  assert.equal(model.mergeCumulativeField('Registro anterior sin reto.', 'Uso 6', 'Reto 6'), 'Registro anterior sin reto.\n\n### Reto 6\n\nUso 6');
  assert.equal(model.mergeCumulativeField('### Reto 4\n\nUso 4', '### Reto 6\n\nUso 6\n\n### Reto 7\n\nUso 7'), '### Reto 4\n\nUso 4\n\n### Reto 6\n\nUso 6\n\n### Reto 7\n\nUso 7');
  assert.equal(model.mergeCumulativeField('### Reto 4\n\nUso 4', 'Texto sin reto'), 'Texto sin reto');
  assert.equal(model.mergeCumulativeField(undefined, '### Pasos\n\nTítulo propio de la IA', 'Reto 9'), '### Reto 9\n\n### Pasos\n\nTítulo propio de la IA');
  const usage = {...artifact, fields:[...artifact.fields, {key:'uso_ia_y_revision', label:'Uso de IA', required:true}]};
  const first = model.prepareRecord({values:{}, checks:{}}, {artifactId:'MG-A02', fields:{borrador:'B', uso_ia_y_revision:'Uso 4'}, tool:'Chat', label:'Reto 4'}, usage);
  const second = model.prepareRecord(first, {artifactId:'MG-A02', fields:{prueba:'P', uso_ia_y_revision:'Uso 5'}, tool:'Chat', label:'Reto 5'}, usage);
  assert.equal(second.values.uso_ia_y_revision, '### Reto 4\n\nUso 4\n\n### Reto 5\n\nUso 5');
  assert.equal(second.values.borrador, 'B');
  const unlabeled = model.prepareRecord(second, {artifactId:'MG-A02', fields:{borrador:'B2'}, tool:'Chat'}, usage);
  assert.equal(unlabeled.values.uso_ia_y_revision, second.values.uso_ia_y_revision, 'Un resultado sin ese campo conserva el registro');
});

test('los mensajes de error usan lenguaje llano y proponen qué pedir a la IA', () => {
  const model = require(modulePath);
  const base = {schemaVersion:1, artifactId:'MG-A02', fields:{borrador:'Resultado'}};
  const messages = ['no-json', JSON.stringify({...base, schemaVersion:2}), JSON.stringify({...base, extra:1}), JSON.stringify({...base, fields:{otra:'Valor'}}), 'x'.repeat(1048577)].map(payload => {
    try { model.validateResult(payload, artifact); } catch (error) { return error.message; }
    return '';
  });
  for (const message of messages) {
    assert.ok(message, 'Cada caso debe fallar');
    assert.doesNotMatch(message, /JSON|esquema|propiedades/u, message);
  }
  assert.match(messages[0], /Pide a la IA: «/u);
  assert.match(messages[2], /Pide a la IA: «/u);
});

test('el resultado de la prueba individual se suma a MG-A05 sin borrar el trabajo del equipo', () => {
  const model = require(modulePath);
  const registry = JSON.parse(fs.readFileSync(path.resolve('deliverables.registry.json'), 'utf8'));
  const tasks = JSON.parse(fs.readFileSync(path.resolve('content/ai-task-briefs.json'), 'utf8'));
  const mg = registry.artifacts.find(item => item.id === 'MG-A05');
  const teamKeys = tasks['reto-integrador'].fieldKeys;
  const individualKeys = tasks['prueba-individual'].fieldKeys;
  assert.deepEqual(individualKeys, ['prueba_individual']);
  assert.deepEqual([...teamKeys, ...individualKeys].sort(), mg.fields.map(field => field.key).sort(), 'Entre los dos encargos cubren MG-A05 sin repetir campos');
  const team = model.validateResult(JSON.stringify({ schemaVersion: 1, artifactId: 'MG-A05', fields: Object.fromEntries(teamKeys.map(key => [key, 'Equipo: ' + key])), tool: 'no identificado' }), mg);
  const individual = model.validateResult(JSON.stringify({ schemaVersion: 1, artifactId: 'MG-A05', fields: { prueba_individual: 'IND-01, fila 5: fecha y franja pendientes.' }, tool: 'no identificado' }), mg);
  const afterTeam = model.prepareRecord({ values: {}, checks: {} }, team, mg);
  const both = model.prepareRecord(afterTeam, individual, mg);
  assert.equal(both.values.prueba_individual, 'IND-01, fila 5: fecha y franja pendientes.');
  assert.equal(both.values.trazabilidad_hackathon, 'Equipo: trazabilidad_hackathon');
  assert.deepEqual(model.missingFields(mg, both), []);
  assert.equal(both.status, 'borrador', 'Importar no aprueba la evidencia');
});
