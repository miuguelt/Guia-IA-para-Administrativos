const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const sharedMaterials = JSON.parse(read('content/shared-challenge-materials.json'));
const aiTasks = JSON.parse(read('content/ai-task-briefs.json'));
const inventory = JSON.parse(execFileSync('python', ['-c', [
  'import csv,json',
  'from datetime import date,datetime',
  'from pathlib import Path',
  'from openpyxl import load_workbook',
  'paths=list(Path("materiales/retos").glob("*.csv"))+[Path("materiales/ia/fuentes-comunes/reto-00-descripciones-seguras.csv")]',
  'tables={p.name:list(csv.reader(p.open(encoding="utf-8-sig",newline=""),delimiter=";")) for p in paths}',
  'mapping={"lineamiento-ficticio.csv":"Lineamiento ficticio","pqrs-complejas.csv":"PQRS complejas","correos-50.csv":"Correos 50","transcripcion.csv":"Transcripcion","datos-sofia.csv":"Datos SOFIA","bienestar.csv":"Bienestar","gastos-q1.csv":"Gastos Q1","contratos.csv":"Contratos","directriz.csv":"Directriz"}',
  'workbook=load_workbook("docs/Documentos/Materiales_practica_IA_SENA_Bogota.xlsx",data_only=False)',
  'source_tables={}',
  'for filename,sheet in mapping.items():',
  '    source_rows=list(workbook[sheet].values)',
  '    populated=[(row,column) for row,values in enumerate(source_rows,1) for column,value in enumerate(values,1) if value is not None]',
  '    last_row=max(row for row,column in populated)',
  '    last_column=max(column for row,column in populated)',
  '    source_tables[filename]=[[v.strftime("%Y-%m-%d") if isinstance(v,(date,datetime)) else "" if v is None else str(v) for v in row[:last_column]] for row in source_rows[:last_row]]',
  'workbook.close()',
  'print(json.dumps({"tables":tables,"sourceTables":source_tables},ensure_ascii=True))',
].join('\n')], { cwd: root, encoding: 'utf8' }));
const tables = inventory.tables;

test('los nueve archivos fuente conservan las celdas, fechas y fórmulas del libro de práctica', () => {
  assert.equal(Object.keys(inventory.sourceTables).length, 9);
  for (const [filename, rows] of Object.entries(inventory.sourceTables)) {
    assert.deepEqual(tables[filename], rows, filename);
  }
});

test('los diez retos y el integrador declaran sus fuentes propias sin fichas de diligenciamiento', () => {
  const challengeKeys = Object.keys(aiTasks).filter(k => /^reto-(?:[0-9]|integrador)$/u.test(k));
  assert.deepEqual(challengeKeys.sort(), [
    'reto-0', 'reto-1', 'reto-2', 'reto-3', 'reto-4', 'reto-5',
    'reto-6', 'reto-7', 'reto-8', 'reto-9', 'reto-integrador',
  ].sort());
  for (const challenge of challengeKeys) {
    const files = aiTasks[challenge].sourceFiles;
    assert.ok(Array.isArray(files), challenge);
    for (const file of files) {
      assert.ok(fs.existsSync(path.join(root, file)), `${challenge}: ${file}`);
      const base = path.basename(file);
      if (tables[base]) {
        assert.ok(tables[base].length >= 4, file);
      }
    }
  }
});

test('las fuentes reutilizadas tienen un solo registro y pertenecen al paquete común', () => {
  const sharedPaths = sharedMaterials.map(file => file.href);
  assert.equal(new Set(sharedPaths).size, sharedPaths.length);
  const challengeKeys = Object.keys(aiTasks).filter(key =>
    /^(?:preparacion|reto-(?:[0-9]|integrador)|MG-A0[1-5]|variante-)/u.test(key));
  const usage = new Map();
  for (const key of challengeKeys) {
    for (const source of aiTasks[key].sourceFiles) {
      usage.set(source, [...(usage.get(source) || []), key]);
    }
  }
  for (const [source, users] of usage) {
    if (users.length < 2) continue;
    const shared = sharedMaterials.find(file => file.href === source);
    assert.ok(shared, `${source} se usa en ${users.join(', ')} y debe estar en el paquete común`);
    assert.deepEqual([...shared.usedBy].sort(), [...users].sort(), source);
  }
  for (const [key, task] of Object.entries(aiTasks)) {
    if (!key.startsWith('reto-')) continue;
    const uniqueFiles = (task.sourceFiles || []).filter(f => (usage.get(f) || []).length === 1);
    for (const file of uniqueFiles) {
      assert.ok(!sharedPaths.includes(file), `${key}: ${file} es exclusiva y no debe estar en paquete común`);
    }
  }
});

test('el paquete del Reto 1 incluye la solicitud urgente completa de Observa', () => {
  const name = 'reto-01-solicitud-urgente.csv';
  const sourcePath = `materiales/retos/${name}`;
  const packagePath = `materiales/ia/reto-1/fuentes/${name}`;
  assert.ok(aiTasks['reto-1'].sourceFiles.includes(sourcePath), 'La fuente debe estar declarada por el encargo canónico del Reto 1.');
  assert.equal(fs.existsSync(path.join(root, packagePath)), true, 'El paquete descargable del Reto 1 debe contener la solicitud.');
  assert.equal(read(packagePath), read(sourcePath), 'La copia publicada debe conservar exactamente la fuente canónica.');
  assert.ok(tables[name], 'Falta la solicitud necesaria para probar el lineamiento sin abrir la web.');
  const request = tables[name][4];
  assert.equal(request[0], 'URG-01');
  assert.equal(request[1], 'Necesito una sala mañana para un taller de 18 personas. ¿Puedes aprobarla porque es urgente?');
  assert.match(request[2], /no consta/iu);
  const dom = new JSDOM(read('content/lessons/m01-fundamentos.html'));
  assert.ok(dom.window.document.querySelector('[data-urgent-example] [data-ai-source]').textContent.includes(request[1]));
  dom.window.close();
});

test('la guía usa los resultados HTML como entrega y no manda diligenciar fichas descargables', () => {
  const html = read('index.html');
  assert.match(html, /resultado(?:-[a-z0-9<>&;_-]+)?\.html/iu);
  assert.doesNotMatch(html, /selecciona el JSON|diligencia la ficha/iu);
  assert.equal(Object.values(aiTasks).flatMap(t => t.sourceFiles || []).filter(file => file.endsWith('-ficha.csv')).length, 0);
});

test('los encargos y el paquete compartido no exigen registro-tiempos.csv como requisito de entrega', () => {
  const name = 'registro-tiempos.csv';
  assert.ok(tables[name], 'El archivo opcional registro-tiempos.csv se conserva en disco como recurso de consulta.');
  const reference = sharedMaterials.find(file => file.href.endsWith(name));
  assert.equal(reference, undefined, 'registro-tiempos.csv no debe figurar como insumo obligatorio en shared-challenge-materials.json');
  for (const [key, task] of Object.entries(aiTasks)) {
    assert.ok(!(task.sourceFiles || []).some(file => file.endsWith(name)), `${key}: no debe exigir ${name}`);
  }
});

test('la guía ofrece el paquete común en un solo punto de descarga', () => {
  const dom = new JSDOM(read('index.html'));
  assert.equal(dom.window.document.querySelectorAll('a[href="materiales/ia/recursos-compartidos.zip"][download]').length, 1);
  dom.window.close();
});
