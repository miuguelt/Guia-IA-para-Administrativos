(function () {
  'use strict';
  const prefix = 'sena_bogota_ia_administrativos_21720210';
  const pages = [...document.querySelectorAll('.module-page')];
  const modules = pages.map(page => ({ id: page.id, title: page.dataset.navTitle }));
  const ids = new Set(modules.map(module => module.id));
  const status = document.getElementById('devbrain-status');
  const menuButton = document.querySelector('.menu-toggle');
  const menuCloseButton = document.querySelector('.sidebar-close');
  const sidebar = document.getElementById('course-sidebar');
  const menuScrim = document.getElementById('menu-scrim');
  let app;
  let pending = null;
  let initial = true;

  window.CourseDialogs?.init();
  window.CourseTools?.init();
  window.EcoBogotaSimulator?.init();
  window.DecisionSimulator?.init();
  window.InteractiveAids?.init();
  const learningProgress = window.CourseProgress?.init();
  window.CourseMode?.init(document);

  // El SDK interpreta cada ancla como una vista; normalizar antes de navegar.
  function normalizeHash() {
    const hash = location.hash.slice(1);
    if (!hash || ids.has(hash)) return;
    if (hash === 'contenido') {
      const current = app ? app.navigation.getCurrentPage() : 'inicio';
      history.replaceState(null, '', '#' + current);
      document.getElementById('contenido').focus({ preventScroll: true });
      return;
    }
    const element = document.getElementById(hash);
    const parent = element && element.closest('.module-page');
    const route = parent ? parent.id : 'inicio';
    if (element && element.classList.contains('challenge-card')) {
      pending = { page: route, tab: 'resuelve', challenge: element };
    } else if (element && (route === 'laboratorio-datos' || hash === 'metodo-comun')) {
      pending = { page: route, anchor: element };
    }
    history.replaceState(null, '', '#' + route);
    if (app && app.navigation.getCurrentPage() === route) applyPending(route);
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuScrim.hidden = true;
  }

  function applyPending(pageId) {
    if (!pending || pending.page !== pageId) return;
    if (pending.anchor) {
      const anchor = pending.anchor;
      queueMicrotask(() => {
        const heading = anchor.querySelector('h2, h3') || anchor;
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
        anchor.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
      pending = null;
      return;
    }
    window.CourseTabs.show(pageId, pending.tab);
    if (pending.challenge) {
      const card = pending.challenge;
      card.querySelector('details').open = true;
      queueMicrotask(() => {
        card.querySelector('summary').focus({ preventScroll: true });
        card.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    }
    pending = null;
  }

  function openLaboratory() {
    const loader = window.LabDataLoader;
    if (!loader) { window.AnalysisLab?.init(document, window); return; }
    loader.ensure(document, window)
      .then(() => window.AnalysisLab?.init(document, window))
      .catch(error => {
        const summary = document.getElementById('lab-chart-summary');
        if (summary) summary.textContent = error.message;
      });
  }

  function onNavigate({ pageId }) {
    const page = document.getElementById(pageId);
    if (!page) return;
    window.DevBrainCalendarPrint.setPrintView(document.body, pageId);
    document.getElementById('current-location').textContent = page.dataset.navTitle;
    document.title = page.dataset.navTitle + ' · Aula de IA';
    document.querySelectorAll('[data-module-link]').forEach(link => {
      if (link.dataset.moduleLink === pageId) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    closeMenu();
    syncTopbarHeight();
    window.CourseTabs.locate?.(pageId);
    if (pageId === 'laboratorio-datos') openLaboratory();
    applyPending(pageId);
    window.dispatchEvent(new CustomEvent('course:navigate', { detail: { pageId } }));
    if (page.hasAttribute('data-learning-module')) {
      app.storage.set('last_lesson', pageId);
      updateResume();
    }
    if (!initial) {
      const heading = page.querySelector('h1');
      if (heading) heading.focus({ preventScroll: true });
    }
    initial = false;
  }

  // Títulos que separan la ruta obligatoria de los complementos opcionales.
  function groupNavigation() {
    const groups = { inicio: 'Tu ruta', portafolio: 'Seguimiento', ecobogota: 'Complementos opcionales' };
    for (const [pageId, label] of Object.entries(groups)) {
      const item = document.querySelector(`#course-nav [data-module-link="${pageId}"]`)?.closest('li');
      if (!item) continue;
      const heading = document.createElement('li');
      heading.className = 'nav-group-label';
      heading.textContent = label;
      item.before(heading);
    }
  }

  function enhanceNavigation() {
    document.querySelectorAll('#course-nav [data-module-link]').forEach(link => {
      const page = document.getElementById(link.dataset.moduleLink);
      const number = document.createElement('span');
      number.className = 'nav-number';
      number.setAttribute('aria-hidden', 'true');
      number.textContent = page.dataset.navNumber;
      link.prepend(number);
      const meta = document.createElement('small');
      meta.className = 'nav-meta';
      meta.textContent = page.dataset.navMeta;
      link.querySelector('.module-title').append(meta);
    });
    groupNavigation();
    const search = document.querySelector('#course-nav input');
    search.setAttribute('aria-label', 'Filtrar módulos por nombre');
    search.placeholder = 'Buscar un módulo…';
    const empty = document.createElement('p');
    empty.className = 'nav-empty';
    empty.textContent = 'No hay módulos con ese nombre.';
    empty.hidden = true;
    document.getElementById('course-nav').append(empty);
    search.addEventListener('input', () => {
      document.getElementById('course-nav').classList.toggle('is-filtering', search.value.trim() !== '');
      empty.hidden = [...document.querySelectorAll('#course-nav li:not(.nav-group-label)')].some(item => item.style.display !== 'none');
    });
    updateResume();
  }

  function updateResume() {
    const last = app.storage.get('last_lesson');
    if (ids.has(last)) {
      const resume = document.getElementById('resume-learning');
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      resume.href = '#' + last;
      resume.replaceChildren('Retomar: ' + document.getElementById(last).dataset.navTitle + ' ', arrow);
    }
  }

  function evidenceSummary() {
    const states = [...document.querySelectorAll('[data-db-evidence-status]')];
    const curricular = states.filter(element => /^MG-A0[1-5]$/u.test(element.dataset.dbEvidence));
    const ready = curricular.filter(element => element.dataset.dbEvidenceStatus === 'lista').length;
    const drafts = curricular.filter(element => element.dataset.dbEvidenceStatus === 'borrador').length;
    const eco = states.find(element => element.dataset.dbEvidence === 'ECO-A02');
    const ecoStatus = eco?.dataset.dbEvidenceStatus === 'lista' ? 'lista para revisión' : eco?.dataset.dbEvidenceStatus === 'borrador' ? 'en borrador' : 'pendiente';
    document.getElementById('home-evidence-status').textContent = `${ready} de ${curricular.length} evidencias curriculares listas · ${drafts} en borrador · EcoBogotá (complementaria): ${ecoStatus}`;
  }

  // Las barras internas se fijan debajo de la barra superior, cuya altura cambia con el ancho y el zoom.
  function syncTopbarHeight() {
    const topbar = document.querySelector('.course-topbar');
    const height = getComputedStyle(topbar).position === 'sticky' ? topbar.offsetHeight : 0;
    document.documentElement.style.setProperty('--topbar-h', height + 'px');
  }

  // Mi avance, Modo y Recursos forman un grupo: solo uno queda abierto a la vez.
  function closeTopbarMenus(keep) {
    let closed = null;
    document.querySelectorAll('.course-topbar details[open]').forEach(menu => {
      if (menu === keep) return;
      menu.open = false;
      closed = menu.querySelector('summary');
    });
    const toggle = document.getElementById('progress-checklist-toggle');
    const dropdown = document.getElementById('progress-checklist-dropdown');
    if (dropdown !== keep && !dropdown.hidden) {
      dropdown.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      closed = toggle;
    }
    return closed;
  }

  document.querySelectorAll('.course-topbar details').forEach(menu => {
    menu.addEventListener('toggle', () => { if (menu.open) closeTopbarMenus(menu); });
  });
  document.getElementById('progress-checklist-toggle').addEventListener('click', () => {
    const dropdown = document.getElementById('progress-checklist-dropdown');
    if (!dropdown.hidden) closeTopbarMenus(dropdown);
  });
  syncTopbarHeight();
  window.addEventListener('resize', syncTopbarHeight);
  window.addEventListener('load', syncTopbarHeight);
  // La barra cambia de alto cuando se cargan el avance y los menús, sin que cambie la ventana.
  if (window.ResizeObserver) new window.ResizeObserver(syncTopbarHeight).observe(document.querySelector('.course-topbar'));

  normalizeHash();
  window.addEventListener('hashchange', normalizeHash);
  try {
    app = window.DevBrainSDK.createApp({
      guideId: 'sena-bogota-ia-administrativos-21720210',
      storagePrefix: prefix + '_sdk',
      routerContainer: document.getElementById('course-pages'),
      sidebarContainer: document.getElementById('course-nav'),
      modules
    });
    window.guiaDevBrainApp = app;
    if (window.AnalysisResults) app.simulators.register(window.AnalysisResults.Simulator);
    if (window.CasePractices) app.simulators.register(window.CasePractices.Simulator);
    app.simulators.init();
    if (window.CasePractices) {
      for (const container of document.querySelectorAll('[data-challenge-decisions]')) {
        new window.CasePractices.Simulator({ container, storage: app.storage }).render();
      }
    }
    window.CourseTabs.init(app.storage);
    enhanceNavigation();
    app.navigation.onNavigate(onNavigate);
    document.body.classList.add('navigation-ready');
    // El menú se oculta sin deslizarse al cargar; la animación queda para cuando se abre.
    window.setTimeout(() => document.body.classList.add('menu-animated'), 0);
    onNavigate({ pageId: app.navigation.getCurrentPage() });
  } catch (error) {
    pages.forEach(page => { page.style.display = 'block'; });
    document.body.classList.remove('navigation-ready');
    status.textContent = 'La navegación no pudo iniciarse. Puedes leer la guía completa y registrar el trabajo en tu copia del libro.';
    console.error('No fue posible iniciar la navegación del curso.', error);
  }

  menuButton.addEventListener('click', () => {
    const expanded = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', expanded);
    menuButton.setAttribute('aria-expanded', String(expanded));
    menuScrim.hidden = !expanded;
    if (expanded) (sidebar.querySelector('#course-nav input') || sidebar.querySelector('a')).focus();
  });
  menuCloseButton.addEventListener('click', () => {
    closeMenu();
    menuButton.focus();
  });
  menuScrim.addEventListener('click', () => {
    closeMenu();
    menuButton.focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (document.body.classList.contains('menu-open')) {
      closeMenu();
      menuButton.focus();
      return;
    }
    closeTopbarMenus(null)?.focus();
  });
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('contenido').focus();
  });
  window.DevBrainCalendarPrint.bindPrintAction(document, window);
  document.addEventListener('click', event => {
    if (!event.target.closest('.course-topbar details, .course-progress-container')) closeTopbarMenus(null);
    if (event.target.closest('.resources-panel .resource-item')) {
      document.querySelector('.resources-menu').open = false;
    }
    const link = event.target.closest('a');
    if (!link) return;
    const fromPortfolio = link.closest('[data-db-evidence-dossier]') && modules.some(module => '#' + module.id === link.hash);
    if (link.matches('[data-open-tool], [data-open-evidence], [data-open-phase]') || fromPortfolio) {
      pending = { page: link.hash.slice(1), tab: link.dataset.openTool || link.dataset.openPhase || 'documenta' };
      if (app && app.navigation.getCurrentPage() === pending.page) applyPending(pending.page);
    }
  });

  // Montar las evidencias aunque falle la navegación, para conservar acceso al trabajo.
  if (window.DevBrainSDK && window.DevBrainSDK.evidence) {
    window.DevBrainSDK.evidence.montar({
      registro: window.DevBrainRegistroEntregables || 'deliverables.registry.json',
      prefijo: prefix,
      dossierHref: '#portafolio'
    }).then(mounted => {
      learningProgress?.connect(mounted);
      window.AIDelivery?.init({ document, mounted });
      window.DevBrainEvidenceAccessibility.labelEvidenceFields(document);
      status.textContent = 'Tus evidencias están disponibles. Los cambios se guardan en este navegador.';
      evidenceSummary();
      window.addEventListener('devbrain:evidencia', evidenceSummary);
      window.EcoPortfolio?.init({ document, simulator: window.EcoBogotaSimulator });
    }).catch(error => {
      status.textContent = 'No fue posible cargar las evidencias. Conserva tu trabajo en la copia del libro e informa al instructor.';
      console.error('No fue posible montar las evidencias.', error);
    });
  }
  document.getElementById('clear-local-data').addEventListener('click', () => {
    if (!confirm('Se borrarán el perfil, las evidencias, las prácticas y la posición de lectura de esta guía en este navegador. Exporta primero lo que necesites. ¿Deseas continuar?')) return;
    Object.keys(localStorage).filter(key => key.startsWith(prefix + '_') || key.startsWith('guia_refactor_sena_')).forEach(key => localStorage.removeItem(key));
    location.reload();
  });
})();
