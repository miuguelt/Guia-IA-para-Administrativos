(function (global) {
  'use strict';

  function setPrintView(body, pageId) {
    body.dataset.printView = pageId;
  }

  function bindPrintAction(documentRoot, windowObject) {
    documentRoot.getElementById('print-calendar').addEventListener('click', () => windowObject.print());
  }

  const api = { setPrintView, bindPrintAction };
  global.DevBrainCalendarPrint = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
