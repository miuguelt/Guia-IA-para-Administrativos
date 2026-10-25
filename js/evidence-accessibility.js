(function (global) {
  'use strict';

  function labelEvidenceFields(documentRoot) {
    let labeled = 0;
    documentRoot.querySelectorAll('[data-db-evidence] input[placeholder], [data-db-evidence] textarea[placeholder]').forEach(field => {
      const hasLabel = field.labels && field.labels.length > 0;
      if (!hasLabel && !field.hasAttribute('aria-label') && !field.hasAttribute('aria-labelledby')) {
        field.setAttribute('aria-label', field.getAttribute('placeholder'));
        labeled += 1;
      }
    });
    return labeled;
  }

  const api = { labelEvidenceFields };
  global.DevBrainEvidenceAccessibility = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
