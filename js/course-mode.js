/* Dos formas de estudiar sobre los mismos materiales y evidencias. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CourseMode = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const KEY = 'sena_bogota_ia_administrativos_21720210_learning_mode';

  function apply(document, mode) {
    const value = mode === 'aula' ? 'aula' : 'autonomo';
    document.body.dataset.learningMode = value;
    document.querySelectorAll('[data-mode-label]').forEach(node => { node.textContent = value === 'aula' ? 'Con instructor' : 'Por mi cuenta'; });
    document.querySelectorAll('[data-mode-only]').forEach(node => { node.hidden = node.dataset.modeOnly !== value; });
    document.querySelectorAll('[data-learning-mode]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.learningMode === value)); });
    document.querySelectorAll('[data-mode-status]').forEach(node => {
      node.textContent = value === 'aula' ? 'Curso con instructor: sigue las jornadas y la asignación de casos.' : 'Por mi cuenta: trabaja a tu ritmo y retoma donde quedaste. La revisión propia no equivale a una aprobación institucional.';
    });
    return value;
  }

  function init(document) {
    if (!document || !document.querySelector('[data-learning-mode]')) return false;
    let saved;
    try { saved = document.defaultView.localStorage.getItem(KEY); } catch (_) { /* La ruta autónoma funciona sin persistencia. */ }
    apply(document, saved);
    document.querySelectorAll('[data-learning-mode]').forEach(button => {
      button.addEventListener('click', () => {
        const mode = apply(document, button.dataset.learningMode);
        try { document.defaultView.localStorage.setItem(KEY, mode); } catch (_) {
          document.querySelector('[data-mode-status]').textContent += ' El navegador no pudo recordar esta elección; conserva tus archivos antes de salir.';
        }
        const menu = button.closest('.study-mode-switch');
        if (menu) { menu.open = false; menu.querySelector('summary').focus(); }
      });
    });
    return true;
  }
  return {KEY, apply, init};
});
