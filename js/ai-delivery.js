/* Recepción de documentos de IA, enlaces de Canva y edición reactiva con autoguardado local. */
(function (root, factory) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./result-import.js') : root.ResultImport, node ? require('./ai-result-store.js') : root.AIResultStore, node ? require('./ai-delivery-view.js') : root.AIDeliveryView);
  if (node) module.exports = api;
  if (root) root.AIDelivery = api;
})(typeof window === 'undefined' ? null : window, function (importer, store, view) {
  'use strict';

  function readResultFile(file, win) {
    return importer.readFile(file, win);
  }

  function bind(root, mounted, artifact, document) {
    if (root.dataset.deliveryReady === 'true') return false;
    root.dataset.deliveryReady = 'true';
    const input = root.querySelector('[data-result-file]');
    const status = root.querySelector('[data-result-status]');
    const save = root.querySelector('[data-result-save]');
    const folder = root.querySelector('[data-result-folder]');
    const retry = root.querySelector('[data-result-retry]');
    const paste = root.querySelector('[data-result-paste]');
    const text = root.querySelector('[data-result-text]');
    const canvaInput = root.querySelector('[data-result-canva]');
    const canvaBtn = root.querySelector('[data-result-canva-btn]');
    const preview = root.querySelector('[data-result-preview]');
    let pending = null;
    let revision = 0;
    let selectedInput = input;
    let retryTarget = input;

    function report(message, state = 'success') {
      status.textContent = message;
      status.dataset.state = state;
      status.setAttribute('role', state === 'error' ? 'alert' : 'status');
      status.setAttribute('aria-live', state === 'error' ? 'assertive' : 'polite');
      if (retry) {
        retry.hidden = state !== 'error';
        retry.textContent = retryTarget === save ? 'Reintentar guardado' : 'Seleccionar de nuevo';
      }
    }

    view.paintRecord(root, artifact, mounted.store.leer(artifact.id));

    async function receive(event) {
      selectedInput = event.currentTarget;
      retryTarget = selectedInput;
      const files = selectedInput === paste
        ? [new document.defaultView.File([text.value], 'resultado-pegado.txt', { type: 'text/plain' })]
        : Array.from(selectedInput.files);
      if (selectedInput !== paste) selectedInput.value = '';
      const current = ++revision;
      pending = null;
      save.disabled = true;
      root.setAttribute('aria-busy', 'false');
      if (!files.length) {
        view.paintRecord(root, artifact, mounted.store.leer(artifact.id));
        report('Selección cancelada. Se conserva el documento guardado.', 'idle');
        return;
      }
      root.querySelector('[data-result-review]').disabled = true;
      root.querySelectorAll('[data-result-download]').forEach(button => { button.disabled = true; });
      root.setAttribute('aria-busy', 'true');
      report('Leyendo los archivos en este navegador…', 'loading');
      try {
        const imported = await importer.importSelection(files, artifact, document.defaultView);
        if (current !== revision) return;
        pending = imported.result;
        view.showPreview(root, artifact, pending.fields, pending.elaboratedProduct || null);
        root.querySelector('[data-result-info]').textContent = 'Vista previa sin guardar. Guarda el borrador para revisar y descargar esta versión.';
        save.disabled = false;
        const skipped = !imported.ignored ? '' : imported.ignored === 1 ? ' Se omitió 1 archivo adicional.' : ` Se omitieron ${imported.ignored} archivos adicionales.`;
        const answers = Object.keys(pending.fields).length;
        report(`Archivo listo: ${imported.source}. ${answers} ${answers === 1 ? 'respuesta' : 'respuestas'}. Al guardar se actualizarán esas respuestas y se conservarán las demás. La revisión quedará pendiente.${skipped}`);
      } catch (error) {
        if (current === revision) {
          view.paintRecord(root, artifact, mounted.store.leer(artifact.id));
          report(error?.message || 'No se pudieron cargar los archivos. Vuelve a seleccionarlos o extrae el ZIP y elige resultado.html.', 'error');
        }
      } finally {
        if (current === revision) root.setAttribute('aria-busy', 'false');
      }
    }

    input.addEventListener('change', receive);
    if (paste && text) {
      paste.addEventListener('click', receive);
      text.addEventListener('input', () => {
        revision += 1;
        pending = null;
        save.disabled = true;
        root.setAttribute('aria-busy', 'false');
        view.paintRecord(root, artifact, mounted.store.leer(artifact.id));
        report(`Texto cambiado. Selecciona «${paste.textContent.trim()}» para revisar esta versión antes de guardarla.`, 'idle');
      });
    }
    if (canvaBtn && canvaInput) {
      canvaBtn.addEventListener('click', () => {
        try {
          const result = importer.registerCanvaLink(canvaInput.value, artifact);
          const currentRecord = mounted.store.leer(artifact.id);
          const mergedFields = { ...currentRecord.values, ...result.fields };
          pending = { ...result, fields: mergedFields };
          const saved = store.commitResult(mounted, pending, document);
          view.paintRecord(root, artifact, saved);
          pending = null;
          save.disabled = true;
          report('Enlace de Canva registrado. Borrador guardado localmente.');
        } catch (error) {
          retryTarget = canvaBtn;
          report(error.message, 'error');
        }
      });
    }
    if (preview) {
      preview.addEventListener('input', event => {
        const fieldInput = event.target.closest('[data-field-input]');
        if (!fieldInput) return;
        const key = fieldInput.dataset.fieldInput;
        const val = fieldInput.value;
        if (pending) {
          pending.fields[key] = val.trim();
        }
        try {
          const record = store.saveInlineField(mounted, artifact.id, key, val, document);
          const card = fieldInput.closest('[data-field-key]');
          if (card) {
            const hasVal = Boolean(val.trim());
            card.dataset.trafficState = hasVal ? 'detected' : 'pending';
            card.classList.toggle('traffic-light-card--detected', hasVal);
            card.classList.toggle('traffic-light-card--pending', !hasVal);
            const badge = card.querySelector('.traffic-badge');
            if (badge) {
              badge.textContent = hasVal ? 'Detectado' : 'Pendiente';
              badge.className = `traffic-badge traffic-badge--${hasVal ? 'detected' : 'pending'}`;
            }
            const pText = card.querySelector('[data-field-text]');
            if (pText) pText.textContent = val;
          }
          const missing = root.ownerDocument.defaultView.AIResultModel.missingFields(artifact, record);
          const review = root.querySelector('[data-result-review]');
          if (review) review.disabled = missing.length > 0;
          report('Borrador guardado localmente.');
        } catch (error) {
          report(error.message, 'error');
        }
      });
    }
    if (folder) {
      folder.addEventListener('change', receive);
      if (!('webkitdirectory' in folder)) {
        root.querySelector('[data-result-folder-control]').hidden = true;
        root.querySelector('[data-result-folder-help]').hidden = false;
      }
    }
    if (retry) retry.addEventListener('click', () => retryTarget.click());
    save.addEventListener('click', () => {
      if (!pending) return;
      try {
        const record = store.commitResult(mounted, pending, document);
        view.paintRecord(root, artifact, record);
        pending = null;
        save.disabled = true;
        input.value = '';
        report('Documento guardado como borrador. Borrador guardado localmente. Revisa el resultado con sus fuentes o pide a la IA una corrección.');
      } catch (error) {
        retryTarget = save;
        report(error.message, 'error');
      }
    });
    root.querySelector('[data-result-review]').addEventListener('click', () => {
      try {
        view.paintRecord(root, artifact, store.confirmReview(mounted, artifact.id, document));
        report('Revisión registrada por ti. La valoración y la aprobación corresponden al instructor.');
      } catch (error) { report(error.message, 'error'); }
    });
    root.querySelectorAll('[data-result-download]').forEach(button => {
      button.addEventListener('click', () => view.downloadDocument(root, artifact, mounted.store.leer(artifact.id), button.dataset.resultDownload));
    });
    return true;
  }

  function init({ document, mounted }) {
    let count = 0;
    document.querySelectorAll('[data-ai-delivery]').forEach(root => {
      const artifact = mounted.registro.artifacts.find(item => item.id === root.dataset.aiDelivery);
      if (artifact && bind(root, mounted, artifact, document)) count += 1;
    });
    return count;
  }
  return { readResultFile, init };
});
