/* Recorrido del reto: solo recuerda la etapa abierta; el SDK conserva las evidencias. */
(function () {
  'use strict';
  const initialized = new WeakSet();

  function setup(root) {
    if (initialized.has(root)) return;
    initialized.add(root);
    const stages = [...root.querySelectorAll('[data-challenge-stage]')];
    const buttons = [...root.querySelectorAll('[data-stage-select]')];
    const previous = root.querySelector('[data-stage-previous]');
    const next = root.querySelector('[data-stage-next]');
    const status = root.querySelector('[data-stage-status]');
    const key = 'aula-reto-paso:' + root.dataset.challengeGuide;
    let position = 0;
    try {
      const stored = Number(sessionStorage.getItem(key));
      if (Number.isInteger(stored) && stored >= 0 && stored < stages.length) position = stored;
    } catch (_) { /* El recorrido funciona con almacenamiento bloqueado. */ }

    function show(index, focus = false) {
      position = Math.max(0, Math.min(stages.length - 1, index));
      stages.forEach((stage, i) => { stage.hidden = i !== position; });
      buttons.forEach((button, i) => {
        if (i === position) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      previous.disabled = position === 0;
      next.disabled = position === stages.length - 1;
      status.textContent = `Paso ${position + 1} de ${stages.length} · ${buttons[position].textContent.replace(/^\d+/, '').trim()}. El guardado se hace en «Guarda tu evidencia».`;
      try { sessionStorage.setItem(key, String(position)); } catch (_) { /* Sin persistencia, conserva el paso en esta vista. */ }
      if (focus) {
        const heading = stages[position].querySelector('h4');
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
        (root.closest('.challenge-card') || root).scrollIntoView({ block: 'start', behavior: 'auto' });
      }
    }
    buttons.forEach(button => {
      button.addEventListener('click', () => show(Number(button.dataset.stageSelect), true));
      button.addEventListener('keydown', event => {
        const changes = {ArrowLeft: position - 1, ArrowUp: position - 1, ArrowRight: position + 1, ArrowDown: position + 1, Home: 0, End: stages.length - 1};
        if (!(event.key in changes)) return;
        event.preventDefault();
        show(changes[event.key]);
        buttons[position].focus();
      });
    });
    previous.addEventListener('click', () => show(position - 1, true));
    next.addEventListener('click', () => show(position + 1, true));
    root.classList.add('challenge-guide-ready');
    show(position);
  }

  function openChallenge(event) {
    const button = event.currentTarget;
    const card = document.getElementById(button.dataset.openChallenge);
    if (!card) return;
    const page = card.closest('.module-page');
    if (window.CourseTabs) window.CourseTabs.show(page.id, 'resuelve', true);
    page.querySelectorAll('.challenge-card > details').forEach(details => { details.open = details.parentElement === card; });
    card.querySelector('details').open = true;
    card.querySelector('summary').focus({ preventScroll: true });
    card.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  // Un reto abierto a la vez: el aprendiz no pierde la secuencia entre varios retos.
  function closeOthers(event) {
    const details = event.currentTarget;
    if (!details.open) return;
    const page = details.closest('.module-page');
    if (!page) return;
    page.querySelectorAll('.challenge-card > details').forEach(other => {
      if (other !== details) other.open = false;
    });
  }

  function init(documentRoot) {
    documentRoot.querySelectorAll('[data-challenge-guide]').forEach(setup);
    documentRoot.querySelectorAll('.challenge-card > details').forEach(details => {
      if (initialized.has(details)) return;
      initialized.add(details);
      details.addEventListener('toggle', closeOthers);
    });
    documentRoot.querySelectorAll('[data-open-challenge]').forEach(button => {
      if (initialized.has(button)) return;
      initialized.add(button);
      button.addEventListener('click', openChallenge);
    });
  }
  window.ChallengeGuide = { init };
  document.addEventListener('DOMContentLoaded', () => init(document));
})();
