(function (root, factory) {
  'use strict';
  const portfolio = factory();
  if (typeof module === 'object' && module.exports) module.exports = portfolio;
  if (root) root.EcoPortfolio = portfolio;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const DEFAULT_PREFIX = 'sena_bogota_ia_administrativos_21720210';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function readApprenticeProfile(document, storage, prefix = DEFAULT_PREFIX) {
    let saved = {};
    try {
      const raw = storage && storage.getItem(`${prefix}_perfil_aprendiz`);
      if (raw) saved = JSON.parse(raw) || {};
    } catch (_) { /* Ignora lectura fallida de perfil */ }
    const val = (id, key, fallback) => {
      const input = document && document.getElementById(id);
      const fromInput = input && typeof input.value === 'string' ? input.value.trim() : '';
      return fromInput || (saved[key] ? String(saved[key]).trim() : '') || fallback;
    };
    return {
      name: val('ev-name', 'name', 'Por confirmar'),
      docNumber: val('ev-doc', 'docNumber', 'Por confirmar'),
      ficha: val('ev-ficha', 'ficha', 'Por confirmar'),
      centro: val('ev-centro', 'centro', 'Servicio Nacional de Aprendizaje (SENA)'),
      regional: val('ev-regional', 'regional', 'Nacional / Por confirmar'),
      instructor: val('ev-instructor', 'instructor', 'Por confirmar')
    };
  }

  function collectPortfolioArtifacts(registry, storage, prefix = DEFAULT_PREFIX) {
    const artifacts = Array.isArray(registry?.artifacts) ? registry.artifacts.filter(a => a.id !== 'ECO-A01') : [];
    return artifacts.map(artifact => {
      let stored = { values: {}, checks: {}, status: 'pendiente', updatedAt: null };
      try {
        const raw = storage && storage.getItem(`${prefix}_evidencia_${artifact.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          stored = {
            values: parsed?.values && typeof parsed.values === 'object' ? parsed.values : {},
            checks: parsed?.checks && typeof parsed.checks === 'object' ? parsed.checks : {},
            status: ['pendiente', 'borrador', 'lista'].includes(parsed?.status) ? parsed.status : 'pendiente',
            updatedAt: parsed?.updatedAt ? String(parsed.updatedAt) : null,
            elaboratedProduct: parsed?.elaboratedProduct && typeof parsed.elaboratedProduct === 'object' ? parsed.elaboratedProduct : null
          };
        }
      } catch (_) { /* Conserva registro vacío ante error de JSON */ }
      const fields = (artifact.fields || []).map(field => ({
        key: field.key,
        label: field.label || field.key,
        value: String(stored.values[field.key] || '').trim()
      }));
      const checklist = (artifact.checklist || []).map((text, index) => ({
        text,
        checked: Boolean(stored.checks[`c_${index}`])
      }));
      const allFields = fields.length > 0 && fields.every(f => f.value.length > 0);
      const allChecks = checklist.length === 0 || checklist.every(c => c.checked);
      const computedStatus = allFields && allChecks && stored.status === 'lista'
        ? 'lista'
        : fields.some(f => f.value.length > 0) || stored.elaboratedProduct
          ? 'borrador'
          : 'pendiente';
      return {
        id: artifact.id,
        code: artifact.code || artifact.id,
        name: artifact.name || artifact.id,
        curricular: /^MG-A0[1-5]$/u.test(artifact.id),
        criterion: artifact.criterion || '',
        instrument: artifact.instrument || '',
        status: computedStatus,
        updatedAt: stored.updatedAt,
        elaboratedProduct: stored.elaboratedProduct || null,
        fields,
        checklist,
        rawRecord: stored
      };
    });
  }

  function buildConsolidatedBackupJson(options = {}) {
    const prefix = options.prefix || DEFAULT_PREFIX;
    const registry = options.registry || { guideId: 'sena-bogota-ia-administrativos-21720210', artifacts: [] };
    const apprentice = readApprenticeProfile(options.document, options.storage, prefix);
    const items = collectPortfolioArtifacts(registry, options.storage, prefix);
    const curricular = items.filter(item => item.curricular);
    const readyCount = curricular.filter(item => item.status === 'lista').length;
    const draftCount = curricular.filter(item => item.status === 'borrador').length;
    const evidencias = {};
    items.forEach(item => {
      const rec = {
        values: item.rawRecord.values,
        checks: item.rawRecord.checks,
        status: item.status,
        updatedAt: item.updatedAt
      };
      if (item.elaboratedProduct) rec.elaboratedProduct = item.elaboratedProduct;
      evidencias[item.id] = rec;
    });
    return {
      schemaVersion: 1,
      guideId: registry.guideId || 'sena-bogota-ia-administrativos-21720210',
      program: '21720210 V1 · Productividad Administrativa con IA',
      center: 'Servicio Nacional de Aprendizaje (SENA)',
      exportedAt: new Date().toISOString(),
      apprentice,
      summary: {
        curricularTotal: curricular.length,
        curricularReady: readyCount,
        curricularDraft: draftCount,
        curricularPending: curricular.length - readyCount - draftCount
      },
      backup: {
        prefijo: prefix,
        exportadoEn: new Date().toISOString(),
        evidencias
      }
    };
  }

  function buildConsolidatedPortfolioHtml(options = {}) {
    const backup = buildConsolidatedBackupJson(options);
    const items = collectPortfolioArtifacts(options.registry || { artifacts: [] }, options.storage, options.prefix || DEFAULT_PREFIX);
    const statusLabel = status => status === 'lista' ? 'Lista para revisión' : status === 'borrador' ? 'En borrador' : 'Pendiente';
    const renderProduct = prod => {
      if (!prod) return '<p class="prod-box prod-box--pending"><strong>Producto elaborado:</strong> Pendiente de adjuntar o registrar enlace.</p>';
      if (prod.kind === 'canva_link') {
        return `<p class="prod-box prod-box--ready"><strong>Diseño en Canva registrado:</strong> <a href="${escapeHtml(prod.url)}">${escapeHtml(prod.url)}</a></p>`;
      }
      return `<p class="prod-box prod-box--ready"><strong>Archivo elaborado adjunto:</strong> ${escapeHtml(prod.name)} (${escapeHtml(String(prod.format || '').toUpperCase())}, ${Number(prod.size || 0)} bytes)</p>`;
    };
    const cardsHtml = items.map(item => {
      const fieldsHtml = item.fields.map(f =>
        `<tr><th>${escapeHtml(f.label)}</th><td>${f.value ? escapeHtml(f.value) : '<em>Pendiente de completar</em>'}</td></tr>`
      ).join('');
      const checksHtml = item.checklist.map(c =>
        `<li><strong>${c.checked ? '[Revisado]' : '[Pendiente]'}</strong> ${escapeHtml(c.text)}</li>`
      ).join('');
      return `<section class="evidence-section" data-portfolio-artifact="${escapeHtml(item.id)}">
        <header class="evidence-header">
          <h2>${escapeHtml(item.code)} · ${escapeHtml(item.name)}</h2>
          <span class="status-pill status-pill--${escapeHtml(item.status)}">${escapeHtml(statusLabel(item.status))}</span>
        </header>
        ${renderProduct(item.elaboratedProduct)}
        <table class="fields-table"><tbody>${fieldsHtml}</tbody></table>
        <h3>Lista de comprobación</h3>
        <ul class="checks-list">${checksHtml}</ul>
      </section>`;
    }).join('\n');

    const manualNode = options.document && options.document.getElementById('manual-situaciones-content');
    const manualHtml = manualNode ? manualNode.innerHTML : '<p>Consulta el manual de situaciones de oficina en la guía interactiva.</p>';

    return `<!doctype html>
<html lang="es-CO">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Portafolio de Evidencias Consolidado · SENA 21720210 V1</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #162925; background: #f8faf8; margin: 0; padding: 2rem; line-height: 1.55; }
    main { max-inline-size: 100%; inline-size: 100%; box-sizing: border-box; background: #fff; padding: 2rem; border-radius: 12px; border: 1px solid #d0ddd8; }
    .inst-header { border-bottom: 3px solid #153e38; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .inst-kicker { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: #153e38; letter-spacing: 0.05em; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; background: #f1f6f4; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
    .evidence-section { border: 1px solid #d0ddd8; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.25rem; page-break-inside: avoid; }
    .evidence-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid #e3ece8; padding-bottom: 0.5rem; }
    .status-pill { padding: 0.25rem 0.7rem; border-radius: 999px; font-size: 0.85rem; font-weight: 700; }
    .status-pill--lista { background: #dcfce7; color: #14532d; }
    .status-pill--borrador { background: #fef3c7; color: #78350f; }
    .status-pill--pendiente { background: #f1f5f9; color: #475569; }
    .fields-table { inline-size: 100%; border-collapse: collapse; margin: 1rem 0; }
    .fields-table th, .fields-table td { border: 1px solid #d0ddd8; padding: 0.65rem; text-align: left; vertical-align: top; white-space: pre-wrap; }
    .fields-table th { inline-size: 28%; background: #f4f8f6; }
    .prod-box { padding: 0.65rem 0.9rem; border-radius: 6px; background: #eff6ff; border-left: 4px solid #1d4ed8; }
    @media print { body { background: #fff; padding: 0; } main { border: none; padding: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <main>
    <header class="inst-header">
      <div class="inst-kicker">Servicio Nacional de Aprendizaje · SENA · ${escapeHtml(backup.apprentice.regional)} · ${escapeHtml(backup.apprentice.centro)}</div>
      <h1>Portafolio de Evidencias Consolidado · Curso 21720210 V1</h1>
      <p>Resumen verificable de evidencias curriculares (MG-A01 a MG-A05), productos elaborados con IA y criterios de revisión humana.</p>
    </header>
    <section class="meta-grid" aria-label="Identificación del aprendiz">
      <div><strong>Aprendiz:</strong> ${escapeHtml(backup.apprentice.name)}</div>
      <div><strong>Documento:</strong> ${escapeHtml(backup.apprentice.docNumber)}</div>
      <div><strong>Ficha:</strong> ${escapeHtml(backup.apprentice.ficha)}</div>
      <div><strong>Instructor:</strong> ${escapeHtml(backup.apprentice.instructor)}</div>
      <div><strong>Avance curricular:</strong> ${backup.summary.curricularReady} de ${backup.summary.curricularTotal} listas (${backup.summary.curricularDraft} en borrador)</div>
    </section>
    ${cardsHtml}
    <section class="manual-annex">
      <h2>Anexo · Manual de situaciones de oficina con IA</h2>
      ${manualHtml}
    </section>
  </main>
</body>
</html>`;
  }

  function triggerDownload(win, content, fileName, mimeType) {
    const blob = new win.Blob([content], { type: mimeType });
    const url = win.URL.createObjectURL(blob);
    const link = win.document.createElement('a');
    link.href = url;
    link.download = fileName;
    win.document.body.append(link);
    link.click();
    link.remove();
    win.URL.revokeObjectURL(url);
  }

  function render(document, container, state, simulator) {
    const summary = simulator.summarize(state);
    container.querySelector('#eco-portfolio-status').textContent = !state.started
      ? 'Aún no hay resultados de esta práctica en el navegador.'
      : summary.complete
        ? `Lote completo: ${summary.correct} de ${summary.total} residuos correctos en la primera selección.`
        : `Clasificación en curso: ${summary.assigned} de ${summary.total} residuos.`;
    container.querySelector('#eco-portfolio-prediction').textContent = summary.prediction === null
      ? ''
      : `Predicción: ${summary.prediction}. Residuos orgánicos aprovechables en el lote: ${summary.organicCount}.`;
    container.querySelector('#eco-portfolio-score').textContent = summary.complete
      ? `Puntaje: ${summary.correct} de ${summary.total}.`
      : '';
    const errors = container.querySelector('#eco-portfolio-errors');
    errors.replaceChildren();
    summary.errors.forEach(error => {
      const item = document.createElement('li');
      const selected = simulator.BINS[error.selected].label;
      const expected = simulator.BINS[error.expected].label;
      item.textContent = `${error.item}: elegiste la caneca ${selected}; corresponde a la ${expected}.`;
      errors.append(item);
    });
    container.querySelector('#eco-portfolio-explanation').textContent = state.explanation
      ? `Explicación del aprendiz: ${state.explanation}`
      : '';
  }

  function init(options = {}) {
    const document = options.document || (typeof window === 'undefined' ? null : window.document);
    if (!document) return false;
    const container = document.getElementById('eco-portfolio-summary');
    if (!container) return false;
    const simulator = options.simulator || document.defaultView.EcoBogotaSimulator;
    if (!simulator) return false;
    let storage = options.storage || null;
    try {
      if (!storage) storage = document.defaultView.localStorage;
    } catch (error) {
      container.querySelector('#eco-portfolio-status').textContent = 'No se pueden consultar los registros anteriores: el navegador bloqueó el almacenamiento.';
      return false;
    }
    const win = document.defaultView;
    const registry = options.registry || win.DevBrainRegistroEntregables || { artifacts: [] };
    const prefix = options.prefix || DEFAULT_PREFIX;
    const statusEl = document.getElementById('consolidated-export-status');
    const btnHtml = document.getElementById('btn-export-consolidated-portfolio');
    if (btnHtml && !btnHtml.dataset.boundConsolidated) {
      btnHtml.dataset.boundConsolidated = 'true';
      btnHtml.addEventListener('click', () => {
        const html = buildConsolidatedPortfolioHtml({ document, storage, registry, prefix });
        triggerDownload(win, html, 'portafolio-evidencias-sena-21720210.html', 'text/html;charset=utf-8');
        if (statusEl) statusEl.textContent = 'Portafolio de Evidencias Consolidado descargado (.html imprimible / PDF).';
      });
    }
    const btnJson = document.getElementById('btn-download-consolidated-json');
    if (btnJson && !btnJson.dataset.boundConsolidated) {
      btnJson.dataset.boundConsolidated = 'true';
      btnJson.addEventListener('click', () => {
        const payload = buildConsolidatedBackupJson({ document, storage, registry, prefix });
        triggerDownload(win, JSON.stringify(payload, null, 2), 'respaldo-portafolio-21720210.json', 'application/json;charset=utf-8');
        if (statusEl) statusEl.textContent = 'Respaldo completo del Portafolio de Evidencias descargado (.json).';
      });
    }
    const refresh = state => {
      const current = state || simulator.loadState(storage);
      render(document, container, current, simulator);
    };
    refresh();
    win.addEventListener('ecobogota:updated', event => refresh(event.detail?.state));
    return {
      refresh: () => refresh(),
      exportHtml: () => buildConsolidatedPortfolioHtml({ document, storage, registry, prefix }),
      exportJson: () => buildConsolidatedBackupJson({ document, storage, registry, prefix })
    };
  }

  return {
    escapeHtml,
    readApprenticeProfile,
    collectPortfolioArtifacts,
    buildConsolidatedBackupJson,
    buildConsolidatedPortfolioHtml,
    triggerDownload,
    render,
    init
  };
});
