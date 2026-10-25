(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LabDataLoader = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const pending = new WeakMap();

  function isReady(doc) {
    const source = doc.getElementById('lab-source-data');
    return Boolean(source && source.textContent.trim());
  }

  // Los datos del laboratorio pesan cientos de KB: se cargan al abrirlo, no con la guía.
  function ensure(doc, win) {
    const source = doc.getElementById('lab-source-data');
    if (!source) return Promise.reject(new Error('No se encontró el contenedor de datos del laboratorio.'));
    if (source.textContent.trim()) return Promise.resolve(source);
    if (pending.has(source)) return pending.get(source);
    const promise = new Promise((resolve, reject) => {
      const fill = () => {
        source.textContent = JSON.stringify(win.LabSourceData);
        win.dispatchEvent(new win.CustomEvent('lab-data:ready'));
        resolve(source);
      };
      if (win.LabSourceData) { fill(); return; }
      const script = doc.createElement('script');
      const fail = message => {
        pending.delete(source);
        script.remove();
        win.dispatchEvent(new win.CustomEvent('lab-data:error', { detail: { message } }));
        reject(new Error(message));
      };
      script.src = source.dataset.src;
      script.addEventListener('load', () => {
        if (win.LabSourceData) fill();
        else fail('El archivo del laboratorio no definió los datos. Descarga el paquete del laboratorio para continuar.');
      });
      script.addEventListener('error', () => fail('No fue posible cargar los datos del laboratorio. Recarga la página o descarga el paquete del laboratorio.'));
      doc.head.append(script);
    });
    pending.set(source, promise);
    return promise;
  }

  return { ensure, isReady };
});
