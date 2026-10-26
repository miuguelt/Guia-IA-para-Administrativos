/* Situaciones de oficina: muestra una ficha a la vez sin reconstruir el contenido generado. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.OfficeSituationsSelector = api;
    api.init(root.document);
  }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';

  function announce(container, message) {
    container.querySelector('[data-situation-announcer]').textContent = message;
  }

  function select(container, id) {
    const card = container.querySelector(`[data-situation-id="${id}"]`);
    if (!card) return false;
    container.querySelectorAll('[data-situation-id]').forEach(item => {
      const active = item === card;
      item.setAttribute('aria-pressed', String(active));
      item.querySelector('.picker-card-action').textContent = active ? 'Ficha abierta' : 'Ver ficha';
    });
    container.querySelectorAll('[data-situation-detail]').forEach(panel => { panel.hidden = panel.dataset.situationDetail !== id; });
    announce(container, 'Mostrando: ' + card.querySelector('.picker-card-title').textContent);
    return true;
  }

  // En una sola columna la ficha queda debajo de la lista: se lleva a la vista y recibe el foco.
  function reveal(container, id, win) {
    const panel = container.querySelector(`[data-situation-detail="${id}"]`);
    const top = panel.getBoundingClientRect().top;
    if (top >= 0 && top <= win.innerHeight * 0.6) return false;
    const reduce = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panel.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    panel.querySelector('h3').focus({ preventScroll: true });
    return true;
  }

  function filter(container, category) {
    container.querySelectorAll('[data-situation-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.situationFilter === category));
    });
    const items = [...container.querySelectorAll('[data-situation-category]')];
    items.forEach(item => { item.hidden = category !== 'todas' && item.dataset.situationCategory !== category; });
    const visible = items.filter(item => !item.hidden);
    const current = container.querySelector('[data-situation-id][aria-pressed="true"]');
    if (current.closest('[data-situation-category]').hidden) select(container, visible[0].querySelector('[data-situation-id]').dataset.situationId);
    const shown = container.querySelector('[data-situation-id][aria-pressed="true"] .picker-card-title').textContent;
    announce(container, `${visible.length} situaciones en la lista. Mostrando: ${shown}`);
    return visible.length;
  }

  // Imprime solo el manual y devuelve la vista de impresión anterior al terminar.
  function printManual(doc, win) {
    const previous = doc.body.dataset.printView;
    doc.body.dataset.printView = 'manual-situaciones';
    win.addEventListener('afterprint', () => {
      if (previous) doc.body.dataset.printView = previous;
      else delete doc.body.dataset.printView;
    }, { once: true });
    win.print();
  }

  function init(doc) {
    if (!doc) return false;
    const container = doc.querySelector('[data-office-selector]');
    const print = doc.getElementById('btn-print-manual');
    if (print) print.addEventListener('click', () => printManual(doc, doc.defaultView));
    if (!container) return false;
    select(container, container.querySelector('[data-situation-id]').dataset.situationId);
    container.classList.add('is-enhanced');
    container.addEventListener('click', event => {
      const filterButton = event.target.closest('[data-situation-filter]');
      if (filterButton) {
        filter(container, filterButton.dataset.situationFilter);
        return;
      }
      const card = event.target.closest('[data-situation-id]');
      if (card && select(container, card.dataset.situationId)) reveal(container, card.dataset.situationId, doc.defaultView);
    });
    return true;
  }

  return { select, filter, reveal, printManual, init };
});
