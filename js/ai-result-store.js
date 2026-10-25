/* Integración con el almacén canónico del SDK, con verificación real del guardado y edición en vivo. */
(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./ai-result-model.js') : root.AIResultModel);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AIResultStore = api;
})(typeof window === 'undefined' ? null : window, function (model) {
  'use strict';

  function artifactFor(mounted, id) {
    const artifact = mounted.registro.artifacts.find(item => item.id === id);
    if (!artifact) throw new Error('No se encontró la evidencia de destino. Vuelve al módulo correspondiente.');
    return artifact;
  }

  function saveVerified(store, artifact, update) {
    const saved = store.guardar(artifact.id, update);
    const actual = store.leer(artifact.id);
    if (actual.updatedAt !== saved.updatedAt || Object.entries(update.values || {}).some(([key, value]) => actual.values[key] !== value) || Object.entries(update.checks || {}).some(([key, value]) => actual.checks[key] !== value)) {
      throw new Error('No se pudo guardar en este navegador. Conserva el archivo descargado y libera espacio antes de intentar de nuevo.');
    }
    return actual;
  }

  function syncForm(mounted, id, document) {
    const artifact = artifactFor(mounted, id);
    const record = mounted.store.leer(id);
    artifact.fields.forEach(field => {
      const input = document.getElementById(`dbe-${id}-${field.key}`);
      if (input) input.value = record.values[field.key] || '';
    });
    artifact.checklist.forEach((_, index) => {
      const input = document.getElementById(`dbe-${id}-c${index}`);
      if (input) input.checked = record.checks['c' + index] === true;
    });
    const active = mounted.registro.artifacts.filter(item => document.querySelector(`[data-db-evidence="${item.id}"]`));
    const station = mounted.estaciones?.[active.indexOf(artifact)];
    if (station && typeof station.refrescar === 'function') station.refrescar();
    const calcState = document.defaultView?.DevBrainSDK?.evidence?.calcularEstado;
    const state = typeof calcState === 'function' ? calcState(artifact, record) : record.status;
    document.defaultView?.dispatchEvent(new document.defaultView.CustomEvent('devbrain:evidencia', { detail: { id, estado: state } }));
    return record;
  }

  function commitResult(mounted, result, document) {
    const artifact = artifactFor(mounted, result.artifactId);
    const update = model.prepareRecord(mounted.store.leer(artifact.id), result, artifact);
    saveVerified(mounted.store, artifact, update);
    mounted.store.registrarUsoIa({ artifactId: artifact.id, tool: result.tool, prompt: 'Encargo descargable de la actividad; resultado recibido.', verified: 'Revisión humana pendiente. La importación no comprueba las afirmaciones.', decision: 'Documento incorporado como borrador.' });
    return syncForm(mounted, artifact.id, document);
  }

  function saveInlineField(mounted, id, fieldKey, value, document) {
    const artifact = artifactFor(mounted, id);
    const previous = mounted.store.leer(id);
    const cleanVal = String(value || '').trim();
    const nextValues = { ...previous.values, [fieldKey]: cleanVal };
    const checks = Object.fromEntries(artifact.checklist.map((_, index) => ['c' + index, false]));
    const hasAny = Object.values(nextValues).some(v => String(v || '').trim());
    saveVerified(mounted.store, artifact, {
      values: nextValues,
      checks,
      status: hasAny ? 'borrador' : 'pendiente'
    });
    return syncForm(mounted, id, document);
  }

  function confirmReview(mounted, id, document) {
    const artifact = artifactFor(mounted, id);
    const record = mounted.store.leer(id);
    if (model.missingFields(artifact, record).length) throw new Error('Aún faltan resultados. Usa el encargo de cierre del módulo para que la IA genere el documento completo.');
    saveVerified(mounted.store, artifact, { checks: Object.fromEntries(artifact.checklist.map((_, index) => ['c' + index, true])), status: 'lista' });
    return syncForm(mounted, id, document);
  }

  return { artifactFor, saveVerified, syncForm, commitResult, saveInlineField, confirmReview };
});
