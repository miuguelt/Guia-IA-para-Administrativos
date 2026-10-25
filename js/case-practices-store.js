(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CasePracticesStore = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  function read(storage, key) {
    try { return storage?.get(key) ?? null; } catch { return null; }
  }
  function write(storage, key, state) {
    if (!storage) return false;
    try {
      storage.set(key, state);
      return JSON.stringify(storage.get(key)) === JSON.stringify(state);
    } catch { return false; }
  }
  return { read, write };
});
