const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('los seis módulos tienen un objetivo concreto, conceptos, dos decisiones con explicación y una ruta de productos', () => {
  const dom = new JSDOM(read('index.html'));
  const pages = [...dom.window.document.querySelectorAll('[data-learning-module]')];
  for (const page of pages) {
    assert.ok(page.querySelector('[data-learning-goal]')?.textContent.trim(), `${page.id}: falta el objetivo`);
    if (page.id === 'preparacion') {
      assert.equal(page.querySelectorAll('.method-route').length, 0, 'La preparación tiene una sola ruta: sus cinco pasos');
      assert.equal(page.querySelectorAll('.tool-selector [data-tab]').length, 5);
    } else {
      assert.equal(page.querySelectorAll('.method-route').length, 0, 'El método común no se repite en ' + page.id);
      assert.ok(page.querySelector('a[href="#metodo-comun"]'), page.id);
    }
    assert.ok(page.querySelectorAll('.learning-terms dt').length >= 3, page.id);
    const checks = [...page.querySelectorAll('[data-knowledge-check]')];
    assert.equal(checks.length, 2, page.id);
    for (const check of checks) {
      assert.ok(check.querySelector('legend')?.textContent.trim());
      const options = [...check.querySelectorAll('input[type="radio"]')];
      assert.equal(options.length, 3);
      assert.equal(options.filter(option => option.dataset.correct === 'true').length, 1);
      assert.ok(options.every(option => option.dataset.feedback?.length > 35));
      assert.equal(new Set(options.map(option => option.name)).size, 1);
      assert.ok(check.querySelector('details p')?.textContent.trim());
      const status = check.querySelector('[data-check-feedback]');
      assert.ok(status.id);
      assert.ok(options.every(option => option.getAttribute('aria-describedby')?.includes(status.id)));
    }
    assert.ok(page.querySelectorAll('.practice-route ol > li').length >= 3, page.id);
    if (page.id !== 'preparacion') {
      assert.ok(page.querySelector('[data-panel="aprende"] [data-learning-goal]'));
      assert.ok(page.querySelector('[data-panel="observa"] [data-knowledge-check]'));
      assert.ok(page.querySelector('[data-panel="resuelve"] .practice-route'));
    }
  }
  assert.equal(new Set([...dom.window.document.querySelectorAll('[data-knowledge-check]')].map(form => form.id)).size, 12);
  dom.window.close();
});

test('la preparación presenta la tarea, los recursos y el producto antes de la práctica', () => {
  const dom = new JSDOM(read('index.html'));
  const page = dom.window.document.querySelector('#preparacion');
  const start = page.querySelector('.learning-start');
  assert.match(page.querySelector('h1').textContent, /informe.*IA/iu);
  assert.ok(page.querySelector('.page-intro').textContent.trim().split(/\s+/u).length <= 60);
  assert.deepEqual([...start.querySelectorAll('.preparation-facts dt')].map(term => term.textContent), ['Tu tarea', 'Qué necesitas', 'Qué vas a guardar']);
  assert.match(start.textContent, /bienestar\.csv.*chat autorizado.*Antigravity/isu);
  assert.match(start.textContent, /caso testigo.*840.*42.*5\s*%/isu);
  assert.match(start.textContent, /sin.*fórmulas.*programar/iu);
  const terms = [...start.querySelectorAll('.learning-terms dt')].map(term => term.textContent);
  for (const term of ['Asistente de IA', 'Instrucción', 'Fuente', 'Borrador', 'Tasa', 'No consta']) assert.ok(terms.includes(term), term);
  const warning = page.querySelector('[data-global-practice-note]');
  const workspace = page.querySelector('[data-tabs="tools"]');
  assert.ok(warning.compareDocumentPosition(workspace) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(page.querySelectorAll('br').length, 0, 'El texto debe fluir sin saltos de línea forzados');
  dom.window.close();
});

test('los pasos de preparación están numerados y explican dónde ejecutar la tarea', () => {
  const dom = new JSDOM(read('content/preparation.html'));
  const page = dom.window.document.querySelector('#preparacion');
  assert.deepEqual([...page.querySelectorAll('.tool-monogram')].map(number => number.textContent), ['1', '2', '3', '4', '5']);
  const instructions = page.querySelector('#preparation-workspace-note');
  assert.match(instructions.textContent, /chat autorizado.*Antigravity/iu);
  assert.match(instructions.textContent, /guía.*(?:copia|copiar)/iu);
  assert.equal(page.querySelector('[data-tabs="tools"]').getAttribute('aria-describedby'), instructions.id);
  const slide = page.querySelector('[data-optional-slide]');
  assert.ok(slide.matches('details:not([open])'));
  assert.ok(slide.querySelector('[data-copy="preparation-slide-prompt"]'));
  dom.window.close();
});

test('la instrucción copiable conserva fuente, cálculo, salida y límites en bloques legibles', () => {
  const dom = new JSDOM(read('content/preparation.html'));
  const prompt = dom.window.document.querySelector('#preparation-prompt');
  assert.ok(prompt.querySelectorAll('p').length >= 4);
  const text = prompt.textContent;
  assert.match(text, /bienestar\.csv.*Bienestar/su);
  assert.match(text, /Centro A.*840.*42.*no consta/su);
  assert.match(text, /deserciones.*matriculados.*100/su);
  assert.match(text, /80 palabras/u);
  assert.match(text, /(?:matriculados|denominador).*cero.*pendiente/su);
  assert.match(text, /No.*causas/su);
  assert.match(text, /fórmulas.*cantidades/su);
  assert.match(text, /orden.*archivo.*contenido.*no.*instrucción/su);
  assert.doesNotMatch(text, /[.!?][A-ZÁÉÍÓÚÑ]/u, 'Los párrafos no deben quedar unidos al copiar');
  dom.window.close();
});

test('el ejemplo de gráfico comunica los totales reales, la moneda y el periodo de Gastos Q1', () => {
  const dom = new JSDOM(read('index.html'));
  const chart = dom.window.document.querySelector('[data-guided-chart]');
  assert.ok(chart);
  const rows = read('materiales/retos/gastos-q1.csv').split(/\r?\n/u).slice(4).filter(Boolean).map(row => row.split(';'));
  for (const bar of chart.querySelectorAll('[data-chart-center]')) {
    const total = rows.filter(row => row[0] === bar.dataset.chartCenter).reduce((sum, row) => sum + Number(row[3]), 0);
    assert.equal(Number(bar.dataset.chartValue), total);
    assert.ok(bar.textContent.includes(new Intl.NumberFormat('es-CO').format(total)));
  }
  assert.match(chart.textContent, /enero.*marzo.*2026/isu);
  assert.match(chart.textContent, /COP/u);
  assert.match(chart.textContent, /fuente.*gastos/isu);
  dom.window.close();
});

test('la preparación se adapta al espacio disponible y las cuatro etapas evitan una tarjeta aislada', () => {
  assert.match(read('css/tool-lab.css'), /\.preparation-page\s*\{[^}]*container-name:\s*preparation/su);
  assert.match(read('css/course-responsive.css'), /@container preparation\s*\(max-width:\s*60rem\)\s*\{[^}]*\.tool-workspace\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/su);
  assert.match(read('css/learning-support.css'), /@container\s*\(min-width:\s*34rem\)\s*\{[^}]*\.practice-route ol:has\(> li:nth-child\(4\)\)[^{]*\{[^}]*repeat\(2,/su);
  const dom = new JSDOM(read('index.html'));
  const titles = [...dom.window.document.querySelectorAll('#m05-cierre .practice-route li > strong')];
  assert.equal(titles.length, 4);
  assert.ok(titles.every(title => !/^Etapa\s+\d/u.test(title.textContent)), 'La lista ya muestra el número de cada etapa');
  dom.window.close();
});

test('los recursos de aprendizaje cambian de versión para evitar estilos y controles antiguos en caché', () => {
  const dom = new JSDOM(read('content/shell.html'));
  for (const asset of ['css/tool-lab.css', 'css/learning-support.css', 'css/course-responsive.css', 'js/course-tools.js']) {
    const node = dom.window.document.querySelector(`[href^="${asset}"], [src^="${asset}"]`);
    const url = node.getAttribute('href') || node.getAttribute('src');
    assert.match(url, /\?v=\d+$/u, asset);
    assert.ok(fs.existsSync(path.join(root, url.split('?')[0])));
  }
  dom.window.close();
});

test('los ejemplos explican la decisión y el integrador entrega la página para revisión humana', () => {
  const dom = new JSDOM(read('index.html'));
  for (const page of dom.window.document.querySelectorAll('[data-learning-module]:not(#preparacion)')) {
    const cycle = page.querySelector('[data-ai-cycle]');
    assert.ok(cycle.querySelector('.example-reason')?.textContent.trim(), page.id);
    for (const [index, part] of ['source', 'instruction', 'response', 'review'].entries()) {
      assert.equal(cycle.querySelector(`[data-ai-${part}]`).dataset.step, String(index + 1), page.id);
    }
  }
  assert.ok(dom.window.document.querySelector('#m01-fundamentos [data-prediction-extension] summary'));
  const integratorPrompt = dom.window.document.querySelector('#reto-integrador [data-ai-task]').textContent;
  assert.match(integratorPrompt, /calcula y contrasta cada hallazgo.*fila y el centro.*resultado-reto-integrador\.html/isu);
  assert.doesNotMatch(integratorPrompt, /espera mi revisión|genera también un plan de acción descargable|plan-accion\.docx/iu);
  dom.window.close();
});

test('cada módulo conecta fuente, instrucción, respuesta y revisión con una tarea de trabajo', () => {
  const dom = new JSDOM(read('index.html'));
  const pages = [...dom.window.document.querySelectorAll('[data-learning-module]')];
  assert.equal(pages.length, 6);
  for (const page of pages) {
    const cycle = page.querySelector('[data-ai-cycle]');
    assert.ok(cycle, `${page.id}: falta una práctica completa de IA`);
    for (const part of ['source', 'instruction', 'response', 'review']) {
      assert.ok(cycle.querySelector(`[data-ai-${part}]`)?.textContent.trim(), `${page.id}: falta ${part}`);
    }
    if (page.id !== 'preparacion') {
      assert.ok(page.querySelector('[data-transfer-task]')?.textContent.trim(), `${page.id}: falta el vínculo con una tarea del puesto`);
    }
  }
  assert.doesNotMatch(dom.window.document.querySelector('#m02-diseno .module-brief').textContent, /\busted\b/iu);
  assert.doesNotMatch(dom.window.document.querySelector('#reto-3').textContent, /qué error observaste en PC-02/iu);
  const reusable = dom.window.document.querySelector('#reto-3 [data-ai-review-checks]');
  assert.match(reusable.textContent, /misma versión.*PC-01, PC-02 y PC-03/isu);
  assert.match(reusable.textContent, /Si cambia la versión.*pruebas.*tres casos/isu);
  assert.match(dom.window.document.querySelector('#reto-3 [data-ai-task]').textContent, /revisión humana.*realizada|No presentes.*revisión humana/iu);
  assert.match(dom.window.document.querySelector('#reto-2 .tool-route').textContent, /VJ-01 sustituye PC-03.*dos casos/iu);
  assert.match(dom.window.document.querySelector('#reto-9 .tool-route').textContent, /añade A5.*apartado citado exista/iu);
  assert.match(dom.window.document.querySelector('#reto-integrador [data-ai-task]').textContent, /calcula.*comprometido menos planeado/iu);
  assert.match(dom.window.document.querySelector('#reto-integrador [data-ai-review-checks]').textContent, /piloto de 30 días.*preguntas pendientes.*revisión conservan su estado real/iu);
  const instruments = read('docs/instrumentos-evaluacion.md');
  assert.doesNotMatch(instruments, /tres falsedades/iu);
  const template = read('docs/evidencias-template.md');
  for (const label of ['Reto 0', 'Reto 7', 'Reto 9', 'Prueba individual']) assert.ok(template.includes(label), label);
  dom.window.close();
});

test('la variante documental tiene su propia regla y distingue incidencias de filas', () => {
  const source = read('materiales/retos/reto-06-variante-inventario-documental.csv');
  assert.match(source, /normaliza Soporte/iu);
  assert.doesNotMatch(source, /cuatro filas|aplica la regla a estas filas/iu);
  const rows = source.split(/\r?\n/u).filter(line => /^ID-\d+;/u.test(line)).map(line => line.split(';'));
  assert.equal(rows.length, 8);
  assert.equal(rows.filter(row => !row[3] || !row[4]).length, 1);
  assert.equal(rows.filter(row => row[3] && row[4] && row[3] > row[4]).length, 1);
  assert.equal(rows.filter(row => Number(row[5]) === 0).length, 1);
  assert.deepEqual(rows[4].slice(1), rows[5].slice(1));
  assert.notEqual(rows[4][0], rows[5][0]);
  const variant = JSON.parse(read('content/ai-task-briefs.json'))['variante-inventario-documental'];
  assert.ok(variant.sourceFiles.some(source => /reto-06-variante-inventario-documental\.csv/u.test(source)));
  assert.match(read(variant.sourceFiles.find(source => /reto-06-variante-inventario-documental\.csv/u.test(source))), /normaliza Soporte/iu);
});

test('las evidencias identifican cómo se hizo la práctica y conservan las condiciones del curso', () => {
  const registry = JSON.parse(read('deliverables.registry.json'));
  for (const artifact of registry.artifacts.filter(item => /^MG-A/u.test(item.id))) {
    assert.ok(artifact.fields.some(field => field.key === 'uso_ia_y_revision'), artifact.id);
  }
  const manifest = JSON.parse(read('guide.manifest.json'));
  assert.equal(manifest.duration.hours, 40);
  assert.equal(manifest.duration.directHours, 36);
  assert.equal(registry.artifacts.filter(item => /^MG-A/u.test(item.id)).reduce((sum, item) => sum + item.station.minutes, manifest.platform.preparation.minutes), 2160);
  assert.match(read('content/home.html'), /la práctica manual no demuestra/iu);
});

test('los ejemplos y las excepciones coinciden con las fuentes de trabajo', () => {
  const rows = name => read(`materiales/retos/${name}`).split(/\r?\n/u).slice(4).filter(Boolean).map(line => line.split(';'));
  const states = rows('datos-sofia.csv');
  assert.equal(states.length, 30);
  assert.equal(new Set(states.map(row => row[0])).size, 29);
  const counts = {};
  for (const row of states) {
    const state = row[4].trim().toUpperCase() || 'REVISAR';
    counts[state] = (counts[state] || 0) + 1;
  }
  assert.deepEqual(counts, {'EN CURSO':9, FINALIZADO:9, REVISAR:4, PENDIENTE:8});
  assert.deepEqual(states.map((row, index) => row[0] === 'SIM-0012' ? index + 5 : null).filter(Boolean), [16,23]);
  assert.match(read('docs/03-implementacion.md'), /9 EN CURSO, 9 FINALIZADO, 8 PENDIENTE y 4 REVISAR/u);

  const requests = rows('reto-07-casos-flujo.csv');
  assert.ok(requests[0].slice(1,6).every(Boolean));
  assert.equal(requests[1][4], '');
  assert.ok(requests[2].slice(1,6).every(Boolean));
  assert.equal(requests[2][6], 'Sí');
  const dom = new JSDOM(read('index.html'));
  assert.match(dom.window.document.querySelector('#reto-7 [data-ai-task]').textContent, /primero la urgencia.*aunque tenga todos los datos/isu);
  assert.match(dom.window.document.querySelector('#reto-7 .branch-key').textContent, /FL-03, completa y urgente.*detención/isu);
  const audit = dom.window.document.querySelector('#reto-9');
  assert.equal(audit.querySelectorAll('.tool-route').length, 1);
  const claims = rows('reto-09-afirmaciones.csv');
  assert.equal(claims.filter(row => /^A[1-4]$/u.test(row[0])).length, 4);
  assert.ok(claims.some(row => row.some(cell => /El registro debe conservarse durante cinco años/u.test(cell))), 'La afirmación sin respaldo debe conservarse en la fuente descargable');
  const sharedMaterials = dom.window.document.querySelector('.challenge-shared-materials');
  assert.ok(sharedMaterials.querySelector('a[download][href="materiales/ia/recursos-compartidos.zip"]'));
  assert.match(sharedMaterials.textContent, /reto-09-afirmaciones\.csv/u);
  assert.ok(JSON.parse(read('content/ai-task-briefs.json'))['MG-A04'].sourceFiles.includes('materiales/retos/reto-09-afirmaciones.csv'));
  assert.match(audit.querySelector('[data-ai-task]').textContent, /no la ejecutes/iu);

  const contracts = rows('contratos.csv');
  const repeated = contracts.filter(row => row[0] === 'SIM-CT-008');
  assert.equal(repeated.length, 2);
  assert.equal(repeated[0][1], 'Centro H');
  assert.equal(Number(repeated[0][5]) - Number(repeated[0][4]), 1250000);
  assert.equal(repeated[0][3], '');
  assert.equal(repeated[0][6], 'Por confirmar');
  assert.equal(Number(repeated[1][5]) - Number(repeated[1][4]), 0);
  assert.equal(repeated[1][1], 'Centro A');
  const dateConflict = contracts.find(row => row[0] === 'SIM-CT-012');
  assert.ok(dateConflict[3]);
  assert.match(dateConflict[7], /Falta fecha/u);
  const supportConflict = contracts.find(row => row[0] === 'SIM-CT-021');
  assert.equal(supportConflict[6], 'Documentos completos');
  assert.match(supportConflict[7], /pendiente/u);
  assert.match(dom.window.document.querySelector('#m05-cierre').textContent, /SIM-CT-012.*SIM-CT-021/isu);

  const wellbeing = rows('bienestar.csv');
  const expenses = rows('gastos-q1.csv');
  assert.equal(wellbeing.length, 10);
  assert.equal(Number(wellbeing[0][2]) / Number(wellbeing[0][1]) * 100, 5);
  assert.equal(new Set(expenses.map(row => row[0])).size, 8);
  assert.deepEqual([...new Set(expenses.map(row => row[1]))], ['Enero','Febrero','Marzo']);
  assert.ok(expenses.every(row => row[2] === '2026 Q1'));
  dom.window.close();
});

test('la aplicación aclara los datos de práctica al inicio y evita repetirlo en cada prompt', () => {
  const source = new JSDOM(read('content/preparation.html'));
  const note = source.window.document.querySelectorAll('#preparacion [data-global-practice-note]');
  assert.equal(note.length, 1);
  assert.match(note[0].textContent, /materiales? de práctica|datos de práctica/iu);
  assert.match(note[0].textContent, /no (?:son|contienen|cargues)|no.*reales/iu);
  const home = new JSDOM(read('content/home.html'));
  assert.equal(home.window.document.querySelectorAll('[data-global-practice-note]').length, 0);

  const published = new JSDOM(read('index.html'));
  assert.equal(published.window.document.querySelectorAll('[data-global-practice-note]').length, 1);
  const realWorkGuidance = published.window.document.querySelector('#preparacion .legal-note')?.textContent || '';
  assert.match(realWorkGuidance, /confirma con tu entidad.*herramientas.*autorizadas/iu);
  assert.doesNotMatch(realWorkGuidance, /materiales? de práctica|no cargues/iu);
  for (const prompt of published.window.document.querySelectorAll('[data-ai-task], [data-ai-instruction]')) {
    assert.doesNotMatch(prompt.textContent, /\b(?:datos?|archivos?|fuentes?|solicitudes?|casos?|mensajes?|registros?)\s+fictici[oa]s?\b/iu, prompt.id || prompt.textContent.slice(0, 70));
  }
  for (const section of published.window.document.querySelectorAll('#preparacion, #m04-validacion')) {
    assert.doesNotMatch(section.textContent, /\b(?:deserciones|tasa)\s+simuladas?\b/iu, section.id);
  }
  source.window.close();
  home.window.close();
  published.window.close();
});

test('la guía conecta módulos consecutivos con una orientación breve, un ejemplo y encargos listos', () => {
  const dom = new JSDOM(read('index.html'));
  const prep = dom.window.document.querySelector('#preparacion');
  assert.ok(prep.querySelector('[data-panel="diseno"] a[href="#m01-fundamentos"]'));
  const modules = [
    ['m01-fundamentos', 'm02-diseno', /solicitud|reserva/iu],
    ['m02-diseno', 'm03-implementacion', /CRTT/iu],
    ['m03-implementacion', 'm04-validacion', /código, fila o minuto/iu],
    ['m04-validacion', 'm05-cierre', /cifra.*causa|operaciones.*fuentes/isu],
    ['m05-cierre', 'portafolio', /informe.*diferencias|hallazgos/isu]
  ];
  for (const [id, next, topic] of modules) {
    const page = dom.window.document.getElementById(id);
    const brief = page.querySelector('.module-brief');
    assert.match(brief.textContent, topic, id);
    assert.equal(brief.querySelectorAll('.module-concept-map > li').length, 3, id);
    assert.ok(page.querySelector('[data-ai-mini-example]')?.textContent.trim(), id);
    assert.ok(page.querySelector('[data-panel="documenta"] .phase-footer a[href="#' + next + '"]'), id);
    assert.ok(page.querySelector('[data-panel="aprende"] .module-explanation .learning-block'), id);
    assert.equal(page.querySelector('.module-explanation').closest('details'), null, id);
    for (const card of page.querySelectorAll('.challenge-card')) {
      assert.equal(card.querySelectorAll('[data-ai-review-checks] > li').length, 3, card.id);
      assert.ok(card.querySelector('[data-copy]'), card.id);
    }
  }
  dom.window.close();
});

test('los conceptos canónicos (caso testigo, CRTT, línea base, no consta, Portafolio de Evidencias) están definidos formalmente', () => {
  const paths = JSON.parse(read('content/learning-paths.json'));

  // Validar términos en preparacion
  const prepTerms = paths['preparacion'].terms.map(([t]) => t.toLowerCase());
  assert.ok(prepTerms.some(t => t.includes('testigo') || t.includes('ancla')), 'Falta término caso testigo en M00');
  assert.ok(prepTerms.some(t => t.includes('no consta')), 'Falta término No consta en M00');
  assert.ok(prepTerms.some(t => t.includes('portafolio')), 'Falta término Portafolio de Evidencias en M00');

  // Validar términos en M01, M02
  const m01Terms = paths['m01-fundamentos'].terms.map(([t]) => t.toLowerCase());
  assert.ok(m01Terms.some(t => t.includes('línea base')), 'Falta término Línea base en M01');
  assert.ok(m01Terms.some(t => t.includes('crtt')), 'Falta término CRTT en M01');

  const m02Terms = paths['m02-diseno'].terms.map(([t]) => t.toLowerCase());
  assert.ok(m02Terms.some(t => t.includes('crtt')), 'Falta término CRTT en M02');

  // Validar presencia en el glosario global de index.html
  const dom = new JSDOM(read('index.html'));
  const glossary = dom.window.document.querySelector('#glossary-dialog');
  assert.ok(glossary, 'Debe existir el diálogo del glosario');
  const glossaryText = glossary.textContent;
  for (const canonical of ['CRTT', 'Línea base', 'Caso testigo', 'No consta', 'Portafolio de Evidencias']) {
    assert.match(glossaryText, new RegExp(canonical, 'iu'), `El glosario global debe definir ${canonical}`);
  }
  dom.window.close();
});

