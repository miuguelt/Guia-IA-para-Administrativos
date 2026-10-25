/* Contratos del contexto y las etapas Docker; no inicia contenedores ni usa red. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const docker = read('Dockerfile');
const stages = docker.split(/^FROM /mu).filter(Boolean);
const builder = stages.find(stage => /AS course-builder/iu.test(stage));
const runtime = stages.find(stage => /^nginx:/u.test(stage));
const rules = read('.dockerignore').split(/\r?\n/u).map(line => line.trim()).filter(line => line && !line.startsWith('#'));

test('Docker recibe el registro canónico, las fuentes educativas completas y las descripciones seguras', () => {
  assert.match(builder, /^COPY deliverables\.registry\.json \.\/deliverables\.registry\.json$/mu);
  assert.match(builder, /^COPY content\/ \.\/content\/$/mu);
  assert.match(builder, /^COPY docs\/ \.\/docs\/$/mu);
  assert.match(builder, /^COPY materiales\/analisis-datos\/ \.\/materiales\/analisis-datos\/$/mu);
  assert.match(builder, /^COPY materiales\/validacion\/ \.\/materiales\/validacion\/$/mu);
  assert.match(builder, /^COPY materiales\/ia\/fuentes-comunes\/ \.\/materiales\/ia\/fuentes-comunes\/$/mu);
  assert.match(builder, /^COPY css\/ \.\/css\/$/mu);
  assert.match(builder, /^COPY js\/ \.\/js\/$/mu, 'El constructor escribe js/lab-source-data.js y versiona cada script.');
  const tasks = JSON.parse(read('content/ai-task-briefs.json'));
  assert.equal(Object.keys(tasks).length, 30);
  for (const task of Object.values(tasks)) {
    for (const source of task.sourceFiles) {
      assert.ok(fs.existsSync(path.join(ROOT, source)), source);
      assert.match(source, /^materiales\/(?:retos|analisis-datos|ia\/fuentes-comunes)\//u, 'Toda fuente se genera o entra por un COPY declarado.');
    }
  }
  for (const name of ['reto-00-descripciones-seguras.csv', 'reto-04-talento-humano-seguro.csv', 'eco-lote.csv', 'eco-criterios.csv']) {
    assert.ok(fs.existsSync(path.join(ROOT, 'materiales/ia/fuentes-comunes', name)), name);
  }
});

test('Docker ejecuta CSV, encargos IA, curso, documentos con estilo y paquetes de análisis en ese orden', () => {
  const commands = [...builder.matchAll(/python scripts\/([\w-]+\.py)([^&\r\n]*)/gu)]
    .map(match => ({script: match[1], options: match[2].replace(/\\\s*$/u, '').trim()}));
  assert.deepEqual(commands.map(command => command.script), [
    'build-challenge-materials.py', 'build-ai-task-kits.py', 'build-course.py',
    'build-styled-documents.py', 'build-analysis-materials.py'
  ]);
  assert.equal(commands[3].options, '--format-downloads', 'Los Word y Excel publicados reciben el mismo estilo que en el build local.');
  const local = JSON.parse(read('package.json')).scripts.build;
  const localScripts = [...local.matchAll(/python scripts\/([\w-]+\.py)/gu)].map(match => match[1]);
  assert.deepEqual(commands.map(command => command.script), localScripts);
  for (const dependency of ['python-docx', 'openpyxl', 'Markdown', 'reportlab', 'pypdf']) {
    assert.ok(read('requirements-build.txt').split(/\r?\n/u).some(line => line.startsWith(dependency + '==')), dependency);
  }
});

test('NGINX publica los documentos regenerados y los 28 paquetes completos desde el constructor', () => {
  assert.match(runtime, /^COPY --from=course-builder \/workspace\/docs\/ \/usr\/share\/nginx\/html\/docs\/$/mu);
  assert.match(runtime, /^COPY --from=course-builder \/workspace\/materiales\/ia\/ \/usr\/share\/nginx\/html\/materiales\/ia\/$/mu);
  assert.match(runtime, /^COPY --from=course-builder \/workspace\/materiales\/retos\/ \/usr\/share\/nginx\/html\/materiales\/retos\/$/mu);
  assert.match(runtime, /^COPY --from=course-builder \/workspace\/materiales\/analisis-datos\/ \/usr\/share\/nginx\/html\/materiales\/analisis-datos\/$/mu);
  assert.doesNotMatch(runtime, /^COPY docs\//mu, 'Una copia del anfitrión no reemplaza los documentos que acaba de generar el constructor.');
  assert.match(runtime, /^COPY --from=course-builder \/workspace\/css\/ \/usr\/share\/nginx\/html\/css\/$/mu, 'css/course.css se publica tal como lo generó el constructor.');
  assert.match(runtime, /^COPY --from=course-builder \/workspace\/js\/ \/usr\/share\/nginx\/html\/js\/$/mu, 'js/lab-source-data.js se publica tal como lo generó el constructor.');
  assert.doesNotMatch(runtime, /^COPY (?:css|js)\//mu, 'Una copia del anfitrión no reemplaza los recursos versionados por el constructor.');
  assert.ok(fs.existsSync(path.join(ROOT, 'css/documents.css')));
  assert.match(read('scripts/build-styled-documents.py'), /root \/ "docs\/lectura"/u);
  assert.match(read('scripts/build-analysis-materials.py'), /AI_LABS/u);
});

test('el contexto permite Markdown, Word, Excel y PDF educativos sin incluir secretos ni estado del IDE', () => {
  assert.ok(rules.includes('!docs/'));
  assert.ok(rules.includes('!docs/**'), 'La excepción cubre guías, ejercicios, DOCX, XLSX y PDF oficiales, incluso nombres con espacios.');
  assert.ok(rules.includes('!materiales/ia/**/*.md'));
  assert.ok(rules.includes('!materiales/analisis-datos/**/*.md'));
  assert.ok(rules.includes('!materiales/validacion/*.md'));
  assert.ok(rules.includes('docs/architecture/'), 'La arquitectura interna no es una descarga del curso.');
  for (const excluded of ['.git', '.env', '.env.*', 'node_modules/', 'output/', '.codex', '**/.codex', '.agents', '**/.agents']) {
    assert.ok(rules.includes(excluded), excluded);
  }
  for (const source of [
    'docs/Documentos/Cartilla_aprendices_retos_IA_SENA_Bogota.docx',
    'docs/Documentos/Guia_facilitador_IA_SENA_Bogota.docx',
    'docs/Documentos/Materiales_practica_IA_SENA_Bogota.xlsx',
    'docs/Documentos/Informe Programa de Formación Complementaria (1).pdf',
    'docs/analisis-datos/guia-laboratorio.md', 'docs/ejercicios/plantilla-informe-productividad.md'
  ]) {
    assert.ok(fs.existsSync(path.join(ROOT, source)), source);
    assert.ok(!rules.includes(source), 'La fuente no tiene una exclusión individual: ' + source);
  }
});
