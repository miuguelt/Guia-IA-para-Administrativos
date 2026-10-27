/* Lectura segura de resultados y Semáforo Visual Reactivo de Campos (Detectado / Pendiente). */
(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./ai-result-model.js') : root.AIResultModel);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AIDeliveryView = api;
})(typeof window === 'undefined' ? null : window, function (model) {
  'use strict';

  function showPreview(root, artifact, values, elaboratedProduct = null) {
    const document = root.ownerDocument;
    const target = root.querySelector('[data-result-preview]');
    target.replaceChildren();
    if (elaboratedProduct) {
      const banner = document.createElement('div');
      banner.className = 'elaborated-product-banner';
      banner.dataset.elaboratedProduct = elaboratedProduct.kind || 'file';
      const strong = document.createElement('strong');
      strong.textContent = 'Producto elaborado registrado: ';
      const span = document.createElement('span');
      span.textContent = `${elaboratedProduct.name || 'Entregable'}${elaboratedProduct.url ? ' (' + elaboratedProduct.url + ')' : ''}`;
      banner.append(strong, span);
      target.append(banner);
    }
    const hasAnyValue = artifact.fields.some(field => values && values[field.key]);
    if (!hasAnyValue && !elaboratedProduct) return;

    artifact.fields.forEach(field => {
      const val = values && values[field.key] ? String(values[field.key]) : '';
      if (val) {
        const details = document.createElement('details');
        details.className = 'result-topic traffic-light-card traffic-light-card--detected';
        details.dataset.trafficState = 'detected';
        details.dataset.fieldKey = field.key;
        details.open = true;
        const title = document.createElement('summary');
        const labelSpan = document.createElement('span');
        labelSpan.className = 'traffic-field-label';
        labelSpan.textContent = field.label;
        const badge = document.createElement('span');
        badge.className = 'traffic-badge traffic-badge--detected';
        badge.textContent = 'Detectado';
        title.append(labelSpan, ' ', badge);
        const text = document.createElement('p');
        text.dataset.fieldText = field.key;
        text.textContent = val;
        const input = document.createElement('textarea');
        input.rows = 4;
        input.className = 'field-inline-input';
        input.dataset.fieldInput = field.key;
        input.value = val;
        input.setAttribute('aria-label', `Editar ${field.label}`);
        details.append(title, text, input);
        target.append(details);
      } else {
        const card = document.createElement('div');
        card.className = 'traffic-light-card traffic-light-card--pending';
        card.dataset.trafficState = 'pending';
        card.dataset.fieldKey = field.key;
        const head = document.createElement('div');
        head.className = 'traffic-card-head';
        const labelStrong = document.createElement('strong');
        labelStrong.className = 'traffic-field-label';
        labelStrong.textContent = field.label;
        const badge = document.createElement('span');
        badge.className = 'traffic-badge traffic-badge--pending';
        badge.textContent = 'Pendiente';
        head.append(labelStrong, ' ', badge);
        const input = document.createElement('textarea');
        input.rows = 3;
        input.className = 'field-inline-input';
        input.dataset.fieldInput = field.key;
        input.value = '';
        input.placeholder = field.hint || 'Pega aquí lo que generó la IA para esta parte';
        input.setAttribute('aria-label', `Completar ${field.label}`);
        card.append(head, input);
        target.append(card);
      }
    });
  }

  function paintRecord(root, artifact, record) {
    const hasData = artifact.fields.some(field => record.values[field.key]) || Boolean(record.elaboratedProduct);
    const missing = model.missingFields(artifact, record);
    const reviewed = hasData && !missing.length && artifact.checklist.length > 0 && artifact.checklist.every((_, index) => record.checks?.['c' + index] === true);
    root.querySelector('[data-result-info]').textContent = !hasData ? 'Aún no has recibido un documento de esta actividad.' : missing.length ? `Documento en borrador. Faltan ${missing.length} resultados; el encargo del módulo los reúne.` : reviewed ? 'Documento revisado por ti. La valoración del instructor permanece pendiente.' : 'Todas las respuestas están guardadas. Revisa los criterios antes de confirmar.';
    const review = root.querySelector('[data-result-review]');
    review.disabled = !hasData || missing.length > 0 || reviewed;
    review.textContent = reviewed ? 'Revisión confirmada' : 'Confirmo que revisé los criterios';
    root.querySelectorAll('[data-result-download]').forEach(button => { button.disabled = !hasData; });
    showPreview(root, artifact, record.values, record.elaboratedProduct || null);
  }

  function downloadDocument(root, artifact, record, format) {
    const document = root.ownerDocument;
    const win = document.defaultView;
    const fields = Object.fromEntries(Object.entries(record.values).filter(([, value]) => typeof value === 'string' && value.trim()));
    const payload = { schemaVersion: 1, artifactId: artifact.id, fields, tool: 'Consolidado de archivos recibidos en la guía' };
    if (record.elaboratedProduct) payload.elaboratedProduct = record.elaboratedProduct;
    const text = format === 'json' ? JSON.stringify(payload, null, 2) : format === 'html' ? model.documentHtml(artifact, record) : model.documentText(artifact, record);
    const blob = new win.Blob([text], { type: format === 'json' ? 'application/json;charset=utf-8' : format === 'html' ? 'text/html;charset=utf-8' : 'text/markdown;charset=utf-8' });
    const url = win.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = artifact.id + '.' + format;
    anchor.click();
    win.URL.revokeObjectURL(url);
  }

  return { showPreview, paintRecord, downloadDocument };
});
