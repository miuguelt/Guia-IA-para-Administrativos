const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const OfficeSituationsSelector = require('../js/office-situations-selector.js');

test('DEFAULT_SITUATIONS contiene exactamente las 12 situaciones requeridas en tres dimensiones', () => {
  const items = OfficeSituationsSelector.DEFAULT_SITUATIONS;
  assert.equal(items.length, 12);
  const ids = items.map(s => s.id);
  assert.deepEqual(ids, [
    'comites-evaluacion',
    'novedades-plataformas',
    'cuentas-cobro',
    'pqrs-urgentes',
    'actas-reunion',
    'limpieza-excel',
    'comunicaciones-oficiales',
    'diseno-procedimientos',
    'explicaciones-medida',
    'preguntas-comprobacion',
    'practica-deliberada',
    'rutas-paso-a-paso'
  ]);

  const byDimension = {
    'sede-coordinacion': 0,
    'gestion-documental': 0,
    'aprendizaje-continuo': 0
  };

  for (const s of items) {
    assert.ok(s.id, 'id requerido');
    assert.ok(s.title, 'title requerido');
    assert.ok(s.icon, 'icon requerido');
    assert.ok(s.category, 'category requerida');
    assert.ok(s.categoryLabel, 'categoryLabel requerida');
    assert.ok(s.dimension, 'dimension requerida');
    assert.ok(s.dimensionLabel, 'dimensionLabel requerida');
    assert.ok(s.problemDescription, 'problemDescription requerida');
    assert.ok(s.recommendedAiTool, 'recommendedAiTool requerida');
    assert.match(s.securityShield, /Ley 1581/i, 'debe citar Ley 1581');
    assert.match(s.accuracyShield, /no consta|indelegable|humano/i, 'debe citar exactitud');
    assert.ok(s.basePrompt && s.basePrompt.length > 50, 'basePrompt debe ser sustantivo');
    assert.ok(s.challengeLink && s.challengeLink.startsWith('#'), 'challengeLink debe ser ancla válida');
    assert.ok(s.challengeName, 'challengeName requerido');
    assert.ok(s.productFormat, 'productFormat requerido');
    if (byDimension[s.dimension] !== undefined) {
      byDimension[s.dimension] += 1;
    }
  }

  assert.equal(byDimension['sede-coordinacion'], 4, '4 situaciones en sede y coordinación');
  assert.equal(byDimension['gestion-documental'], 4, '4 situaciones en gestión documental y flujos');
  assert.equal(byDimension['aprendizaje-continuo'], 4, '4 situaciones en aprendizaje continuo socrático');
});

test('escapeHtml sanea caracteres especiales y tolera valores nulos', () => {
  assert.equal(OfficeSituationsSelector.escapeHtml(null), '');
  assert.equal(OfficeSituationsSelector.escapeHtml(undefined), '');
  assert.equal(OfficeSituationsSelector.escapeHtml('<script>"alert(\'x\')&1"</script>'), '&lt;script&gt;&quot;alert(&#39;x&#39;)&amp;1&quot;&lt;/script&gt;');
  assert.equal(OfficeSituationsSelector.escapeHtml(123), '123');
});

test('createSelectorState genera estado consistente por defecto y con parámetros', () => {
  const defaultState = OfficeSituationsSelector.createSelectorState();
  assert.equal(defaultState.activeCategory, 'todas');
  assert.equal(defaultState.selectedSituationId, 'comites-evaluacion');
  assert.equal(defaultState.searchQuery, '');
  assert.equal(defaultState.situations.length, 12);

  const customState = OfficeSituationsSelector.createSelectorState(
    OfficeSituationsSelector.DEFAULT_SITUATIONS,
    'gestion-documental',
    'limpieza-excel',
    '  EXCEL  '
  );
  assert.equal(customState.activeCategory, 'gestion-documental');
  assert.equal(customState.selectedSituationId, 'limpieza-excel');
  assert.equal(customState.searchQuery, 'excel');

  const emptyState = OfficeSituationsSelector.createSelectorState([]);
  assert.equal(emptyState.selectedSituationId, 'comites-evaluacion');
});

test('getSituationById recupera situación directa o mediante alias de compatibilidad', () => {
  const found = OfficeSituationsSelector.getSituationById(OfficeSituationsSelector.DEFAULT_SITUATIONS, 'actas-reunion');
  assert.ok(found);
  assert.equal(found.shortTitle, 'Redactar actas de reunión');

  // Fallback con ID por defecto
  const fallback = OfficeSituationsSelector.getSituationById(null, 'comites-evaluacion');
  assert.ok(fallback);

  // Alias para mantener compatibilidad con IDs anteriores
  const aliasCanva = OfficeSituationsSelector.getSituationById(OfficeSituationsSelector.DEFAULT_SITUATIONS, 'diseno-canva');
  assert.ok(aliasCanva);
  assert.equal(aliasCanva.id, 'diseno-procedimientos');

  const notFound = OfficeSituationsSelector.getSituationById(OfficeSituationsSelector.DEFAULT_SITUATIONS, 'inexistente_total');
  assert.equal(notFound, null);
});

test('renderSituationDetail maneja situación nula y renderSituationCards maneja lista vacía', () => {
  const detailEmpty = OfficeSituationsSelector.renderSituationDetail(null);
  assert.match(detailEmpty, /situation-detail-placeholder/);

  const cardsEmpty = OfficeSituationsSelector.renderSituationCards([]);
  assert.match(cardsEmpty, /situations-empty-notice/);
});

test('renderManual delega en renderManualSection correctamente', () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="manual-box"></div></body></html>');
  const box = dom.window.document.getElementById('manual-box');
  const html = OfficeSituationsSelector.renderManual(box, OfficeSituationsSelector.DEFAULT_SITUATIONS);
  assert.ok(html.includes('manual-item-card'));
  assert.ok(box.children.length > 0);
  dom.window.close();
});

test('copyPromptToClipboard maneja fallo en writeText de forma segura', async () => {
  const dom = new JSDOM('<!doctype html><html><body><button id="btn">Copiar</button><div id="notif"></div></body></html>');
  const btn = dom.window.document.getElementById('btn');
  const notif = dom.window.document.getElementById('notif');
  const mockNavigator = {
    clipboard: {
      writeText: () => Promise.reject(new Error('Permiso denegado'))
    }
  };
  const res = await OfficeSituationsSelector.copyPromptToClipboard('Texto de prueba', btn, notif, mockNavigator);
  assert.equal(res, true);
  assert.equal(btn.textContent, '¡Prompt copiado al portapapeles!');
  dom.window.close();
});

test('getCategories extrae las 3 dimensiones con conteos exactos de 4 elementos', () => {
  const cats = OfficeSituationsSelector.getCategories(OfficeSituationsSelector.DEFAULT_SITUATIONS);
  assert.equal(cats[0].id, 'todas');
  assert.equal(cats[0].count, 12);

  const sede = cats.find(c => c.id === 'sede-coordinacion');
  assert.ok(sede);
  assert.equal(sede.count, 4);

  const doc = cats.find(c => c.id === 'gestion-documental');
  assert.ok(doc);
  assert.equal(doc.count, 4);

  const ap = cats.find(c => c.id === 'aprendizaje-continuo');
  assert.ok(ap);
  assert.equal(ap.count, 4);
});

test('filterSituations filtra por dimensión y por término de búsqueda', () => {
  const items = OfficeSituationsSelector.DEFAULT_SITUATIONS;

  const all = OfficeSituationsSelector.filterSituations(items, { category: 'todas' });
  assert.equal(all.length, 12);

  const sede = OfficeSituationsSelector.filterSituations(items, { category: 'sede-coordinacion' });
  assert.equal(sede.length, 4);
  assert.equal(sede[0].id, 'comites-evaluacion');

  const bySearchTitle = OfficeSituationsSelector.filterSituations(items, { category: 'todas', search: 'actas' });
  assert.equal(bySearchTitle.length, 1);
  assert.equal(bySearchTitle[0].id, 'actas-reunion');

  const bySearchSofia = OfficeSituationsSelector.filterSituations(items, { category: 'todas', search: 'zajuna' });
  assert.equal(bySearchSofia.length, 1);
  assert.equal(bySearchSofia[0].id, 'novedades-plataformas');

  const bySearchSocratic = OfficeSituationsSelector.filterSituations(items, { category: 'todas', search: 'analogías' });
  assert.ok(bySearchSocratic.length >= 1);

  const noResults = OfficeSituationsSelector.filterSituations(items, { category: 'todas', search: 'inexistente_xyz' });
  assert.equal(noResults.length, 0);

  const defaultFilter = OfficeSituationsSelector.filterSituations();
  assert.equal(defaultFilter.length, 12);
});

test('selectSituation actualiza id seleccionado de forma inmutable', () => {
  const state = OfficeSituationsSelector.createSelectorState();
  const next = OfficeSituationsSelector.selectSituation(state, 'actas-reunion');
  assert.equal(next.selectedSituationId, 'actas-reunion');
  assert.equal(state.selectedSituationId, 'comites-evaluacion');

  const invalid = OfficeSituationsSelector.selectSituation(state, 'no-existe');
  assert.equal(invalid.selectedSituationId, 'comites-evaluacion');

  const fallback = OfficeSituationsSelector.selectSituation(null, 'cuentas-cobro');
  assert.equal(fallback.selectedSituationId, 'cuentas-cobro');
});

test('formatPromptForClipboard extrae prompt base o texto', () => {
  const sit = OfficeSituationsSelector.DEFAULT_SITUATIONS[0];
  assert.equal(OfficeSituationsSelector.formatPromptForClipboard(sit), sit.basePrompt);
  assert.equal(OfficeSituationsSelector.formatPromptForClipboard('mi prompt'), 'mi prompt');
  assert.equal(OfficeSituationsSelector.formatPromptForClipboard(null), '');
  assert.equal(OfficeSituationsSelector.formatPromptForClipboard({}), '');
});

test('generateManualMarkdown genera documento Markdown estructurado con 12 situaciones', () => {
  const md = OfficeSituationsSelector.generateManualMarkdown(OfficeSituationsSelector.DEFAULT_SITUATIONS);
  assert.match(md, /# Manual Práctico de Situaciones de Oficina con IA/);
  assert.match(md, /Ley 1581 de 2012/);
  assert.match(md, /«no consta»/);
  assert.match(md, /## 1\. 🏛️ Comités de evaluación/);
  assert.match(md, /## 12\. 🧭 Rutas paso a paso/);
  assert.doesNotMatch(md, /términos legales|Ley 1755|Deep Research|ChatGPT Enterprise|Falsa \/ No consta|citas falsas|Retos 3, 7, 9 e Integrador/u);
  assert.match(md, /```text/);
  assert.match(md, /## Regla de Oro Institucional/);

  const fallbackMd = OfficeSituationsSelector.generateManualMarkdown(null);
  assert.match(fallbackMd, /# Manual Práctico/);
});

test('generateManualHtml genera documento HTML imprimible con estilos y 12 tarjetas', () => {
  const html = OfficeSituationsSelector.generateManualHtml(OfficeSituationsSelector.DEFAULT_SITUATIONS);
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<html lang="es-CO">/);
  assert.match(html, /Manual Práctico de Situaciones de Oficina con IA/);
  assert.match(html, /@media print/);
  assert.match(html, /shield-legal/);
  assert.match(html, /shield-accuracy/);
  assert.match(html, /comites-evaluacion/);
  assert.match(html, /rutas-paso-a-paso/);

  const fallbackHtml = OfficeSituationsSelector.generateManualHtml(null);
  assert.match(fallbackHtml, /<!doctype html>/i);
});

test('downloadFile maneja entornos con y sin DOM de forma segura', () => {
  assert.equal(OfficeSituationsSelector.downloadFile('prueba.txt', 'contenido', 'text/plain', null), false);

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const doc = dom.window.document;
  const originalBlob = global.Blob;
  const originalURL = global.URL;

  global.Blob = dom.window.Blob || function (parts, opts) { this.parts = parts; this.opts = opts; };
  global.URL = {
    createObjectURL: () => 'blob:mock-url',
    revokeObjectURL: () => {}
  };

  try {
    const ok = OfficeSituationsSelector.downloadFile('prueba.txt', 'hola mundo', 'text/plain', doc);
    assert.equal(ok, true);
  } finally {
    global.Blob = originalBlob;
    global.URL = originalURL;
    dom.window.close();
  }
});

test('exportManualMarkdown y exportManualHtml ejecutan descargas y retornan contenido', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const doc = dom.window.document;

  const md = OfficeSituationsSelector.exportManualMarkdown(OfficeSituationsSelector.DEFAULT_SITUATIONS, 'test.md', doc);
  assert.match(md, /# Manual Práctico/);

  const html = OfficeSituationsSelector.exportManualHtml(OfficeSituationsSelector.DEFAULT_SITUATIONS, 'test.html', doc);
  assert.match(html, /<!doctype html>/i);

  dom.window.close();
});

test('printManual invoca window.print cuando está disponible', () => {
  let printed = false;
  const mockWin = {
    print: () => { printed = true; }
  };
  const res = OfficeSituationsSelector.printManual(mockWin);
  assert.equal(res, true);
  assert.equal(printed, true);

  assert.equal(OfficeSituationsSelector.printManual(null), false);
  assert.equal(OfficeSituationsSelector.printManual({}), false);
});

test('copyPromptToClipboard y copyPrompt actualizan botones y avisos con éxito', async () => {
  const dom = new JSDOM('<!doctype html><html><body><button id="btn">Copiar</button><p id="notify"></p></body></html>');
  const btn = dom.window.document.getElementById('btn');
  const notify = dom.window.document.getElementById('notify');

  let written = '';
  const mockNav = {
    clipboard: {
      writeText: async (t) => { written = t; }
    }
  };

  const ok = await OfficeSituationsSelector.copyPromptToClipboard('Hola prompt', btn, notify, mockNav);
  assert.equal(ok, true);
  assert.equal(written, 'Hola prompt');
  assert.equal(btn.textContent, '¡Prompt copiado al portapapeles!');
  assert.ok(btn.classList.contains('is-copied'));
  assert.match(notify.textContent, /copiado con éxito/);

  const ok2 = await OfficeSituationsSelector.copyPrompt({ basePrompt: 'Prompt desde objeto' }, btn, notify, mockNav);
  assert.equal(ok2, true);
  assert.equal(written, 'Prompt desde objeto');
  dom.window.close();
});

test('renderSituationDetail incluye datos de muestra y laboratorio socrático cuando corresponde', () => {
  const socraticSit = OfficeSituationsSelector.DEFAULT_SITUATIONS.find(s => s.id === 'explicaciones-medida');
  assert.ok(socraticSit);
  const detailHtml = OfficeSituationsSelector.renderSituationDetail(socraticSit);

  assert.match(detailHtml, /detail-sample-data-box/);
  assert.match(detailHtml, /Datos de práctica preparados/);
  assert.match(detailHtml, /detail-socratic-lab-card/);
  assert.match(detailHtml, /Laboratorio Socrático Interactivo/);
  assert.match(detailHtml, /Tu consulta \(método socrático\):/);
  assert.match(detailHtml, /Respuesta pedagógica de la IA:/);
  assert.match(detailHtml, /Pregunta de comprobación socrática:/);
});

test('init monta selector y manual con 12 situaciones e interactúa con filtros y tarjetas', () => {
  const html = `
    <!doctype html>
    <html>
    <body>
      <div id="office-situations-selector-container"></div>
      <div id="manual-situaciones-content"></div>
      <button id="btn-download-manual-md">Descargar MD</button>
      <button id="btn-download-manual-html">Descargar HTML</button>
      <button id="btn-print-manual">Imprimir</button>
    </body>
    </html>
  `;
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  let printed = false;
  dom.window.print = () => { printed = true; };

  const inst = OfficeSituationsSelector.init({ document: doc });
  assert.ok(inst);
  assert.equal(inst.situations.length, 12);

  // 1. Clic en filtro de categoría
  const filterBtn = doc.querySelector('[data-situation-category="gestion-documental"]');
  assert.ok(filterBtn);
  filterBtn.click();
  assert.equal(inst.state.activeCategory, 'gestion-documental');
  const cards = doc.querySelectorAll('.situation-picker-card');
  assert.equal(cards.length, 4);
  assert.equal(cards[0].getAttribute('data-situation-id'), 'actas-reunion');

  // 2. Clic en tarjeta de situación
  cards[0].click();
  assert.equal(inst.state.selectedSituationId, 'actas-reunion');
  assert.ok(doc.querySelector('#situation-detail-actas-reunion'));

  // 3. Teclado Enter en tarjeta de situación
  const allFilterBtn = doc.querySelector('[data-situation-category="todas"]');
  allFilterBtn.click();
  const excelCard = doc.querySelector('[data-situation-id="limpieza-excel"]');
  excelCard.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(inst.state.selectedSituationId, 'limpieza-excel');

  // 4. Copiar prompt en selector
  const copyBtn = doc.querySelector('[data-copy-situation-prompt="limpieza-excel"]');
  assert.ok(copyBtn);
  copyBtn.click();
  assert.equal(copyBtn.textContent, '¡Prompt copiado al portapapeles!');

  // 5. Copiar prompt en manual
  const manualCopyBtn = doc.querySelector('#manual-card-comites-evaluacion [data-copy-situation-prompt="comites-evaluacion"]');
  assert.ok(manualCopyBtn);
  manualCopyBtn.click();
  assert.equal(manualCopyBtn.textContent, '¡Prompt copiado al portapapeles!');

  // 6. Botones de descarga e impresión
  const btnMd = doc.getElementById('btn-download-manual-md');
  const btnHtml = doc.getElementById('btn-download-manual-html');
  const btnPrint = doc.getElementById('btn-print-manual');

  btnMd.click();
  btnHtml.click();
  btnPrint.click();
  assert.equal(printed, true);

  // 7. init tolerante con documento nulo
  assert.equal(OfficeSituationsSelector.initOfficeSituationsSelector({ document: null }), false);

  dom.window.close();
});

test('scrollIntoView se ejecuta al seleccionar una tarjeta si el método existe', () => {
  const html = `
    <!doctype html><html><body><div id="office-situations-selector-container"></div></body></html>
  `;
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  let scrolled = false;
  dom.window.Element.prototype.scrollIntoView = function () { scrolled = true; };

  OfficeSituationsSelector.init({ document: doc });
  const card = doc.querySelector('[data-situation-id="actas-reunion"]');
  assert.ok(card);
  card.click();
  assert.equal(scrolled, true);
  dom.window.close();
});

test('enlace con data-open-situation abre y enfoca la situación correspondiente', () => {
  const html = `
    <!doctype html>
    <html>
    <body>
      <div id="situaciones-oficina">
        <div id="office-situations-selector-container"></div>
      </div>
      <a href="#situaciones-oficina" id="test-trigger" data-open-situation="novedades-plataformas">Ver ficha</a>
    </body>
    </html>
  `;
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  let scrolled = false;
  doc.getElementById('situaciones-oficina').scrollIntoView = function () { scrolled = true; };

  const inst = OfficeSituationsSelector.init({ document: doc });
  assert.equal(inst.state.selectedSituationId, 'comites-evaluacion');

  const trigger = doc.getElementById('test-trigger');
  trigger.click();

  assert.equal(inst.state.selectedSituationId, 'novedades-plataformas');
  assert.equal(inst.state.activeCategory, 'sede-coordinacion');
  assert.equal(scrolled, true);

  dom.window.close();
});

test('revokeObjectUrlSafely ejecuta revoke o captura excepciones de forma segura', () => {
  let revoked = '';
  const mockUrlObj = {
    revokeObjectURL: (u) => { revoked = u; }
  };
  OfficeSituationsSelector.revokeObjectUrlSafely(mockUrlObj, 'blob:test-123');
  assert.equal(revoked, 'blob:test-123');

  OfficeSituationsSelector.revokeObjectUrlSafely(null, 'blob:xyz');
  OfficeSituationsSelector.revokeObjectUrlSafely({}, 'blob:xyz');

  const throwingUrlObj = {
    revokeObjectURL: () => { throw new Error('Revoke error'); }
  };
  OfficeSituationsSelector.revokeObjectUrlSafely(throwingUrlObj, 'blob:err');
});

test('downloadFile captura errores de creación de elementos y maneja fallback', () => {
  const throwingDoc = {
    createElement: () => { throw new Error('DOM restricted'); }
  };
  const res = OfficeSituationsSelector.downloadFile('archivo.txt', 'datos', 'text/plain', throwingDoc);
  assert.equal(res, false);
});

test('autoInit maneja documentos en carga, listos o nulos', () => {
  assert.equal(OfficeSituationsSelector.autoInit(null), false);

  const domReady = new JSDOM('<!doctype html><html><body><div id="office-situations-selector-container"></div></body></html>');
  assert.equal(OfficeSituationsSelector.autoInit(domReady.window.document), true);
  domReady.window.close();

  const domLoading = new JSDOM('<!doctype html><html><body><div id="office-situations-selector-container"></div></body></html>');
  Object.defineProperty(domLoading.window.document, 'readyState', { value: 'loading', configurable: true });
  assert.equal(OfficeSituationsSelector.autoInit(domLoading.window.document), true);
  domLoading.window.document.dispatchEvent(new domLoading.window.Event('DOMContentLoaded'));
  domLoading.window.close();
});

test('módulo se registra en window cuando se carga en un entorno de navegador', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  const targetPath = require.resolve('../js/office-situations-selector.js');

  try {
    delete require.cache[targetPath];
    require(targetPath);
    assert.ok(dom.window.OfficeSituationsSelector);
    assert.equal(dom.window.OfficeSituationsSelector.DEFAULT_SITUATIONS.length, 12);
  } finally {
    delete global.window;
    delete global.document;
    delete require.cache[targetPath];
    dom.window.close();
  }
});
