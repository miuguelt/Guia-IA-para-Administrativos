/* Pestañas de lecciones y ejemplos. DevBrain conserva la navegación entre vistas. */
(function () {
  'use strict';
  const groups = new Map();
  let storage;
  let noticeTimer;
  let currentPage = null;

  // La barra superior nombra el paso abierto del módulo visible.
  function showStep(pageId, chosen) {
    if (pageId !== currentPage) return;
    const step = document.querySelector('[data-location-step]');
    if (!step) return;
    const label = chosen ? chosen.textContent.replace(/^\d+/u, '').trim() : '';
    step.textContent = label;
    step.hidden = !label;
  }

  function notify(message) {
    const notice = document.getElementById('course-notice');
    if (!notice) return;
    clearTimeout(noticeTimer);
    notice.textContent = message;
    notice.hidden = false;
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 4500);
  }

  function initGroup(root) {
    const page = root.closest('.module-page');
    const buttons = [...root.querySelectorAll('[data-tab]')];
    const panels = [...root.querySelectorAll('[data-panel]')];
    const list = root.querySelector('[data-tablist]');
    const key = 'tabs_' + page.id;
    list.setAttribute('role', 'tablist');
    buttons.forEach(button => {
      const id = page.id + '-' + button.dataset.tab;
      button.id = id + '-tab';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', id + '-panel');
    });
    panels.forEach(panel => {
      const id = page.id + '-' + panel.dataset.panel;
      panel.id = id + '-panel';
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', id + '-tab');
      panel.tabIndex = 0;
    });
    let current = null;
    function activate(value, focus = false) {
      const chosen = buttons.find(button => button.dataset.tab === value) || buttons[0];
      buttons.forEach(button => {
        const active = button === chosen;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      });
      panels.forEach(panel => { panel.hidden = panel.dataset.panel !== chosen.dataset.tab; });
      if (storage) storage.set(key, chosen.dataset.tab);
      if (focus) chosen.focus();
      current = chosen;
      showStep(page.id, chosen);
      return chosen;
    }
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(button.dataset.tab));
      button.addEventListener('keydown', event => {
        let next;
        if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % buttons.length;
        if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        activate(buttons[next].dataset.tab, true);
      });
    });
    root.querySelectorAll('[data-next-phase], [data-next-tool]').forEach(button => {
      button.addEventListener('click', () => {
        activate(button.dataset.nextPhase || button.dataset.nextTool, true);
        root.scrollIntoView({ block: 'start', behavior: 'auto' });
      });
    });
    root.classList.add('tabs-ready');
    activate(storage && storage.get(key));
    groups.set(page.id, { activate, current: () => current });
  }

  async function copy(button) {
    const target = document.getElementById(button.dataset.copy);
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      notify('Encargo copiado. Adjunta las fuentes indicadas o abre la carpeta del paquete en tu IDE.');
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      notify('Texto seleccionado. Usa Ctrl+C para copiarlo.');
    }
  }

  window.CourseTabs = {
    init(adapter) {
      storage = adapter;
      document.querySelectorAll('[data-tabs]').forEach(initGroup);
      document.querySelectorAll('[data-copy]').forEach(button => {
        button.addEventListener('click', () => copy(button));
      });
    },
    locate(pageId) {
      currentPage = pageId;
      const group = groups.get(pageId);
      showStep(pageId, group ? group.current() : null);
    },
    show(pageId, tab, focus = false) {
      const group = groups.get(pageId);
      if (group) group.activate(tab, focus);
    },
    notify
  };
})();
