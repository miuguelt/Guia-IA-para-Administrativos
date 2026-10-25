const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('los enlaces y recursos locales de la guía llevan a archivos o secciones existentes', () => {
  const dom = new JSDOM(read('index.html'));
  for (const node of dom.window.document.querySelectorAll('[href], [src], [poster]')) {
    const value = node.getAttribute('href') || node.getAttribute('src') || node.getAttribute('poster');
    if (/^(?:https?:|data:|mailto:|tel:)/u.test(value)) continue;
    if (value.startsWith('#')) {
      assert.ok(dom.window.document.getElementById(decodeURIComponent(value.slice(1))), value);
    } else {
      const file = decodeURIComponent(value.split(/[?#]/u)[0]);
      assert.ok(fs.existsSync(path.join(root, file)), value);
    }
  }
  dom.window.close();
});

test('las orientaciones complementarias conservan los límites de cuentas, datos y fuentes', () => {
  const tools = read('docs/herramientas-y-preparacion.md');
  const manual = read('docs/guia-practica-ia-administrativos-sena.md');
  for (const text of [tools, manual]) {
    assert.doesNotMatch(text, /total privacidad|sin restricciones de cuotas|sin restricciones ni cuotas|en cualquier asistente/iu);
    assert.match(text, /cuenta.*autorizad|autorizad.*cuenta/iu);
    assert.match(text, /cuotas/iu);
    assert.match(text, /modelos en la nube/iu);
  }
  assert.doesNotMatch(manual, /2 y 3 días|plazo de 24 horas|estará disponible el próximo viernes|menos de 10 minutos/iu);
  assert.match(manual, /plazo.*(?:no consta|por confirmar)/isu);
  assert.match(manual, /(?:propuesta|propuestas).*(?:acuerdo|acuerdos)/isu);
  assert.match(manual, /(?:duplicado|duplicados).*(?:conserva|conservar)/isu);
});

test('la portada declara la adaptación y anuncia solo aprendizajes que sí enseña', () => {
  const dom = new JSDOM(read('content/home.html'));
  const text = dom.window.document.body.textContent;
  assert.doesNotMatch(text, /aprende[^.]*plazos de ley/iu);
  const roadmap = dom.window.document.querySelector('.home-roadmap-banner');
  assert.match(roadmap.textContent, /36.*directas.*4.*autónomas/isu);
  assert.match(roadmap.textContent, /48.*validación/isu);
  dom.window.close();
});

test('la preparación enseña a extraer los paquetes y recuperar un CSV mal abierto', () => {
  const dom = new JSDOM(read('content/preparation.html'));
  const support = dom.window.document.querySelector('[data-file-help]');
  assert.ok(support);
  assert.match(support.textContent, /Extraer todo/iu);
  assert.match(support.textContent, /LEEME\.html/u);
  assert.doesNotMatch(support.textContent, /00-LEE-PRIMERO/u);
  assert.match(support.textContent, /punto y coma.*UTF-8/isu);
  assert.match(support.textContent, /una sola columna/iu);
  dom.window.close();
});

test('CI instala el renderizador usado por la suite y publica el informe de cobertura que genera', () => {
  assert.match(read('requirements-build.txt'), /^Pillow==\d+\.\d+\.\d+$/imu);
  const workflow = read('.github/workflows/calidad.yml');
  assert.match(workflow, /tee cobertura-completa\.txt/u);
  assert.match(workflow, /run: npm run test:coverage:all \| tee cobertura-completa\.txt\r?\n\s+shell: bash/u);
  assert.match(workflow, /path: cobertura-completa\.txt/u);
  assert.match(workflow, /if-no-files-found: error/u);
});

test('los diagramas SVG usan dimensiones válidas y el despliegue conserva la guía complementaria enlazada', () => {
  const dom = new JSDOM(read('content/preparation.html'));
  for (const svg of dom.window.document.querySelectorAll('svg')) {
    assert.notEqual(svg.getAttribute('height'), 'auto');
  }
  const docker = read('Dockerfile');
  assert.match(docker, /COPY --from=course-builder \/workspace\/docs\/ \/usr\/share\/nginx\/html\/docs\//u);
  assert.match(read('.dockerignore'), /!docs\/\*\*/u);
  dom.window.close();
});

test('las etiquetas de RA de cada módulo coinciden con el mapa de su evidencia', () => {
  const dom = new JSDOM(read('index.html'));
  const registry = JSON.parse(read('deliverables.registry.json'));
  for (const artifact of registry.artifacts.filter(item => item.id.startsWith('MG-'))) {
    const map = registry.submission.competencyMap.find(item => item.artifacts.includes(artifact.id));
    const page = dom.window.document.getElementById(artifact.station.sectionId);
    assert.ok(page.querySelector('.lesson-meta').textContent.includes(map.learningResult), artifact.id);
  }
  dom.window.close();
});
