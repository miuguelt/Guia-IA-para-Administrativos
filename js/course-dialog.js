(function () {
  'use strict';

  function open(dialog, trigger) {
    if (!dialog) return;
    dialog.returnFocus = trigger;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    const first = dialog.querySelector('[data-dialog-close]');
    if (first) first.focus();
  }

  function close(dialog) {
    const trigger = dialog.returnFocus;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    if (trigger && trigger.isConnected) trigger.focus();
  }

  window.CourseDialogs = {
    init() {
      const diagram = document.getElementById('course-dialog');
      const glossary = document.getElementById('glossary-dialog');
      const templates = document.getElementById('templates-dialog');
      document.addEventListener('click', event => {
        const trigger = event.target.closest('[data-open-diagram], [data-open-glossary], [data-open-templates]');
        if (trigger && trigger.matches('[data-open-glossary]')) return open(glossary, trigger);
        if (trigger && trigger.matches('[data-open-templates]')) return open(templates, trigger);
        if (trigger && diagram) {
          const image = diagram.querySelector('#course-dialog-image');
          const heading = diagram.querySelector('#course-dialog-title');
          const owner = trigger.closest('[data-learning-module]');
          image.src = trigger.dataset.image;
          image.alt = trigger.dataset.alt || '';
          image.hidden = false;
          heading.textContent = `Mapa visual · ${owner?.dataset.navTitle || 'módulo'}`;
          return open(diagram, trigger);
        }
        const button = event.target.closest('[data-dialog-close]');
        if (button) close(button.closest('dialog'));
      });
      [diagram, glossary, templates].filter(Boolean).forEach(dialog => {
        dialog.addEventListener('click', event => {
          if (event.target === dialog) close(dialog);
        });
      });
    }
  };
})();
