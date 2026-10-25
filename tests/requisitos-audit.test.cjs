const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const registry = JSON.parse(read('deliverables.registry.json'));
const artifact = id => registry.artifacts.find(item => item.id === id);
const field = (id, key) => artifact(id).fields.find(item => item.key === key);
const rows = file => read(`materiales/retos/${file}`).split(/\r?\n/u).slice(4).filter(Boolean).map(line => line.split(';'));
const number = value => new Intl.NumberFormat('es-CO').format(value);

test('los ejemplos del portafolio conservan los importes completos de gastos y contratos', () => {
  const expenses = rows('gastos-q1.csv');
  const chart = field('MG-A04', 'grafico_y_filtros').placeholder;
  for (const center of ['Centro A', 'Centro B']) {
    const total = expenses.filter(row => row[0] === center).reduce((sum, row) => sum + Number(row[3]), 0);
    assert.ok(chart.includes(`${center} acumula ${number(total)} COP`), `${center}: falta ${number(total)} COP`);
  }
  const contracts = rows('contratos.csv').filter(row => row[0] === 'SIM-CT-008');
  const example = field('MG-A05', 'trazabilidad_hackathon').placeholder;
  for (const value of [Number(contracts[0][4]), Number(contracts[0][5]), Number(contracts[0][5]) - Number(contracts[0][4])]) {
    assert.ok(example.includes(`${number(value)} COP`), `Falta el importe completo ${number(value)} COP`);
  }
  assert.match(example, /fila 21.*Centro A.*diferencia 0 COP/iu);
});

test('el ejemplo de acta conserva acuerdos y responsables presentes en la transcripción', () => {
  const transcript = read('materiales/retos/transcripcion.csv');
  assert.match(transcript, /05:52;Coordinación;Sí, incluyamos ese campo/u);
  assert.match(transcript, /08:32;Coordinación;Prepara el borrador y me lo compartes/u);
  const example = field('MG-A03', 'reto05_acta').placeholder;
  assert.match(example, /05:52.*estado.*fecha/isu);
  assert.match(example, /08:32.*Apoyo administrativo.*borrador/isu);
  assert.match(example, /fecha.*pendiente/isu);
  assert.doesNotMatch(example, /Ninguna decisión|no se asignaron responsables|inicio de ciclo|convocados/iu);
});

test('los borradores de PQRS y la auditoría señalan los casos y apartados que realmente existen', () => {
  const pqrs = field('MG-A02', 'pqrs_borrador').placeholder;
  assert.match(pqrs, /PC-01/u);
  assert.match(pqrs, /PC-03/u);
  assert.match(read('content/lessons/m02-diseno.html'), /VJ-01 sustituye PC-03/u);
  assert.match(pqrs, /nueva fecha.*por confirmar/isu);
  assert.doesNotMatch(pqrs, /comité|sesione|fecha propuesta/iu);
  assert.match(artifact('MG-A02').instructions, /PC-01.*PC-03/isu);
  const audit = field('MG-A04', 'reto09_auditoria_respuesta').placeholder;
  assert.match(audit, /Aprobación.*IA no aprueba/isu);
  assert.match(audit, /Solicitud.*no pide datos personales/isu);
  assert.doesNotMatch(audit, /apartado «Datos»|prohíbe exigir/iu);
});

test('los criterios y el mapa de evidencias admiten conservar una instrucción correcta y siguen los RA de la fuente', () => {
  const instruments = read('docs/instrumentos-evaluacion.md');
  for (const challenge of ['1 · Prompt CRTT', '3 · Asistente de rol']) {
    const row = instruments.split(/\r?\n/u).find(line => line.startsWith(`| ${challenge} |`));
    assert.match(row, /conserv|mantener/iu, challenge);
    assert.match(row, /ajust|correg/iu, challenge);
  }
  assert.match(field('MG-A01', 'reto01_prompt_crtt').label, /conserv|revis/iu);
  const map = registry.submission.competencyMap;
  assert.match(map.find(item => item.artifacts.includes('MG-A02')).learningResult, /RA2/u);
  assert.match(map.find(item => item.artifacts.includes('MG-A03')).learningResult, /RA1/u);
  assert.match(instruments, /Formula prompts.*I-4/isu);
  assert.match(instruments, /Diseña proceso automatizado.*I-5/isu);
});

test('los apoyos de IA requieren registrar la verificación y no exigen formularios de medición de tiempos', () => {
  for (const item of registry.artifacts) {
    assert.match(item.aiAssist.log, /^Registra/u, item.id);
    assert.doesNotMatch(item.aiAssist.log, /Interacción registrada/u, item.id);
  }
  for (const [id, source] of [
    ['MG-A01', 'lineamiento-ficticio.csv'],
    ['MG-A02', 'pqrs-complejas.csv'],
    ['MG-A03', 'transcripcion.csv'],
    ['MG-A04', 'bienestar.csv'],
    ['MG-A05', 'contratos.csv']
  ]) assert.ok(artifact(id).aiAssist.prompt.includes(source), `${id}: falta identificar la fuente del encargo`);
  assert.equal(field('MG-A01', 'metrica_linea_base'), undefined);
  assert.equal(field('MG-A03', 'tiempo_medido_vs_manual'), undefined);
  assert.equal(field('MG-A05', 'cuantificacion_ahorro_horas'), undefined);
  assert.match(field('MG-A05', 'presentacion_y_revision').placeholder, /15 minutos.*8.*7/isu);
  const commitment = field('MG-A05', 'compromiso_transferencia').placeholder;
  assert.match(commitment, /piloto.*30 días/isu);
  assert.match(commitment, /calidad.*responsable/isu);
});

test('el manifiesto traza los cuatro criterios de la fuente curricular sin afirmar un aval', () => {
  const manifest = JSON.parse(read('guide.manifest.json'));
  const alignment = manifest.curricularAlignment;
  assert.equal(alignment.criteriaSource.page, 3);
  assert.ok(fs.existsSync(path.join(root, alignment.criteriaSource.path)));
  assert.equal(alignment.evaluationCriteria.length, 4);
  assert.deepEqual(alignment.evaluationCriteria.map(item => item.learningResult), ['RA1', 'RA1', 'RA2', 'RA2']);
  const maps = registry.submission.competencyMap;
  for (const item of alignment.evaluationCriteria) {
    assert.ok(item.text.length > 50);
    assert.ok(item.activities.length > 0);
    assert.ok(item.instruments.length > 0);
    assert.match(item.validationStatus, /confirm|pendiente/iu);
    for (const id of item.artifacts) {
      assert.ok(artifact(id), id);
      assert.ok(maps.some(map => map.artifacts.includes(id) && map.learningResult.includes(item.learningResult)), `${id}: ${item.learningResult}`);
    }
  }
});

test('la copia publicada contiene exactamente los ejemplos corregidos del registro canónico', () => {
  const context = { window: {} };
  vm.runInNewContext(read('js/registro-entregables.js'), context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.DevBrainRegistroEntregables)), registry);
});
