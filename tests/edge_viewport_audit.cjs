const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.isReady = new Promise((resolve) => {
      this.ws.onopen = resolve;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        this.callbacks.get(msg.id)(msg);
        this.callbacks.delete(msg.id);
      }
    };
  }

  async send(method, params = {}) {
    await this.isReady;
    const msgId = this.id++;
    return new Promise((resolve) => {
      this.callbacks.set(msgId, (res) => {
        if (res.error) {
          console.error(`CDP Error in ${method}:`, res.error);
        }
        resolve(res.result);
      });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res && res.result ? res.result.value : null;
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('=' .repeat(70));
  console.log('REAL BROWSER (MICROSOFT EDGE HEADLESS) RESPONSIVE & OVERFLOW AUDIT');
  console.log('=' .repeat(70));

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const portServer = http.createServer();
  await new Promise((resolve, reject) => {
    portServer.once('error', reject);
    portServer.listen(0, '127.0.0.1', resolve);
  });
  const port = portServer.address().port;
  await new Promise((resolve, reject) => portServer.close(error => error ? reject(error) : resolve()));
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devbrain-edge-layout-'));
  const failures = [];

  const edgeProc = spawn(edgePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  try {
    let version = null;
    for (let i = 0; i < 30; i++) {
      try {
        version = await getJson(`http://127.0.0.1:${port}/json/version`);
        if (version && version.webSocketDebuggerUrl) break;
      } catch (e) {
        await wait(200);
      }
    }

    if (!version || !version.webSocketDebuggerUrl) {
      throw new Error('Failed to connect to Edge remote debugging port');
    }

    console.log(`Connected to Edge: ${version.Browser}`);
    
    // Get existing tab or create
    const tabs = await getJson(`http://127.0.0.1:${port}/json/list`);
    const tab = tabs.find(candidate => candidate.type === 'page' && candidate.url === 'about:blank')
      || tabs.find(candidate => candidate.type === 'page');
    if (!tab || !tab.webSocketDebuggerUrl) {
      throw new Error('No target tab found in Edge');
    }
    const cdp = new CDPClient(tab.webSocketDebuggerUrl);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    const htmlPath = path.resolve('index.html').replace(/\\/g, '/');
    const targetUrl = `file:///${htmlPath}`;
    console.log(`Navigating to ${targetUrl}...`);
    await cdp.send('Page.navigate', { url: targetUrl });
    await wait(1500);

    const pageState = await cdp.evaluate(`({ href: location.href, title: document.title, ready: document.readyState, stations: document.querySelectorAll('.module-page.station').length })`);
    console.log(`Loaded page: ${JSON.stringify(pageState)}`);

    const viewports = [
      { label: '320', width: 320 },
      { label: '390', width: 390 },
      { label: '768', width: 768 },
      { label: '1024', width: 1024 },
      { label: '1100', width: 1100 },
      { label: '1440', width: 1440 },
      { label: '1920', width: 1920 },
      { label: '2560', width: 2560 },
      { label: '200% zoom (360 CSS px from 720 device px)', width: 720, zoom: 200 }
    ].filter(vp => !process.env.DEVBRAIN_LAYOUT_AUDIT_WIDTH || vp.width === Number(process.env.DEVBRAIN_LAYOUT_AUDIT_WIDTH));
    const stations = [
      { id: 'inicio', name: 'Portada' },
      { id: 'portafolio', name: 'Portafolio' },
      { id: 'preparacion', name: 'Preparación' },
      { id: 'm01-fundamentos', name: 'Módulo 01' },
      { id: 'm02-diseno', name: 'Módulo 02' },
      { id: 'm03-implementacion', name: 'Módulo 03' },
      { id: 'm04-validacion', name: 'Módulo 04' },
      { id: 'm05-cierre', name: 'Módulo 05' },
      { id: 'ecobogota', name: 'Práctica EcoBogotá' }
    ].filter(station => !process.env.DEVBRAIN_LAYOUT_AUDIT_STATION || station.id === process.env.DEVBRAIN_LAYOUT_AUDIT_STATION);

    const auditResults = [];

    for (const vp of viewports) {
      const viewportLabel = vp.zoom ? vp.label : `${vp.label}px`;
      const zoom = vp.zoom ? vp.zoom / 100 : 1;
      const cssWidth = Math.round(vp.width / zoom);
      console.log(`\n>>> TESTING VIEWPORT: ${viewportLabel} (height 900px) <<<`);
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: cssWidth,
        height: Math.round(900 / zoom),
        deviceScaleFactor: zoom,
        mobile: vp.zoom ? false : vp.width < 768
      });
      // El ajuste de la prosa responde a ResizeObserver; con zoom necesita más de un cuadro para asentarse.
      await wait(800);

      // Check document overflow
      const docOverflow = await cdp.evaluate(`
        ({
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth
        })
      `);

      console.log(`  Document horizontal overflow: ${docOverflow.hasHorizontalScroll ? 'FAIL (Overflowing!)' : 'PASS (Clean)'} (scrollWidth=${docOverflow.scrollWidth}px vs viewport=${docOverflow.innerWidth}px)`);
      if (docOverflow.hasHorizontalScroll) failures.push(`${viewportLabel}: desbordamiento horizontal de página (${docOverflow.scrollWidth}/${docOverflow.innerWidth}px).`);

      for (const st of stations) {
        // Activate station via hash and tabs
        await cdp.evaluate(`
          window.location.hash = '#${st.id}';
          if (window.CourseTabs && typeof window.CourseTabs.show === 'function') {
            window.CourseTabs.show('${st.id}', 'aprende');
          }
        `);
        if (st.id === 'ecobogota') {
          await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' });
          await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab' });
        }
        await wait(300);

        const stationAudit = await cdp.evaluate(`
          (() => {
            const station = document.getElementById('${st.id}');
            if (!station) return { error: 'station not found' };
            station.querySelectorAll('details').forEach(details => { details.open = true; });

            const docWidth = window.innerWidth;
            const stationScrollWidth = station.scrollWidth;
            const stationClientWidth = station.clientWidth;
            const stationOverflow = stationScrollWidth > stationClientWidth + 1;
            const stationRect = station.getBoundingClientRect();
            const overflowingChildren = stationOverflow
              ? Array.from(station.querySelectorAll('*'))
                  .map(el => ({ el, rect: el.getBoundingClientRect() }))
                  .filter(item => {
                    const outside = item.rect.width && item.rect.right > stationRect.right + 1;
                    const innerOverflow = item.el.scrollWidth > item.el.clientWidth + 1;
                    if (!outside && !innerOverflow) return false;
                    let parent = item.el.parentElement;
                    while (parent && parent !== station) {
                      const overflowX = getComputedStyle(parent).overflowX;
                      if (['auto', 'scroll', 'hidden', 'clip'].includes(overflowX)) return false;
                      parent = parent.parentElement;
                    }
                    return true;
                  })
                  .sort((a, b) => b.rect.right - a.rect.right)
                  .slice(0, 5)
                  .map(({ el, rect }) => ({ tag: el.tagName.toLowerCase(), className: typeof el.className === 'string' ? el.className.slice(0, 60) : '', text: el.textContent.trim().slice(0, 50), right: Math.round(rect.right), stationRight: Math.round(stationRect.right), width: Math.round(rect.width) }))
              : [];
            const ecoIntro = station.id === 'ecobogota' ? station.querySelector('.eco-training-hero .page-intro') : null;
            // La portada presenta su texto en la columna del héroe, junto a la ilustración del caso.
            const homeIntro = station.id === 'inicio' ? station.querySelector('.hero-copy > p') : null;
            const brief = ecoIntro ? ecoIntro.parentElement : homeIntro ? homeIntro.parentElement : station.querySelector('.module-brief') || station;
            const intro = ecoIntro || homeIntro || brief?.querySelector(':scope > .page-intro') || brief?.querySelector(':scope > p, :scope > .brief-lead > p');
            const briefRect = brief?.getBoundingClientRect();
            const briefStyle = brief ? getComputedStyle(brief) : null;
            const introStyle = intro ? getComputedStyle(intro) : null;
            const introWidth = intro ? intro.getBoundingClientRect().width : 0;
            let maxWidthPx = Number.POSITIVE_INFINITY;
            if (introStyle && introStyle.maxWidth !== 'none') {
              const probe = document.createElement('span');
              probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;white-space:nowrap;font-family:' + introStyle.fontFamily + ';font-size:' + introStyle.fontSize + ';width:' + introStyle.maxWidth;
              document.body.appendChild(probe);
              maxWidthPx = probe.getBoundingClientRect().width;
              probe.remove();
            }
            const contentLeft = briefRect && briefStyle
              ? briefRect.left + parseFloat(briefStyle.borderLeftWidth) + parseFloat(briefStyle.paddingLeft)
              : 0;
            const contentWidth = brief && briefStyle
              ? brief.clientWidth - parseFloat(briefStyle.paddingLeft) - parseFloat(briefStyle.paddingRight)
              : 0;
            const conceptMap = brief?.querySelector(':scope > .module-concept-map');
            const conceptMapRect = conceptMap?.getBoundingClientRect();
            const conceptMapUsesSecondColumn = conceptMapRect && intro && conceptMapRect.left > contentLeft + introWidth + 2;
            const columnGap = briefStyle ? parseFloat(briefStyle.columnGap) || 0 : 0;
            const introColumnWidth = conceptMapUsesSecondColumn
              ? conceptMapRect.left - contentLeft - columnGap
              : contentWidth;
            const expectedIntroWidth = introStyle ? Math.min(introColumnWidth, maxWidthPx) : 0;
            const naturalTextIssues = [];
            const naturalText = station.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, dd, dt, summary, blockquote, figcaption, label');
            naturalText.forEach((el) => {
              if (!el.getClientRects().length) return;
              const style = getComputedStyle(el);
              if (style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none' && style.webkitLineClamp !== '0') {
                naturalTextIssues.push(el.tagName.toLowerCase() + ' usa recorte o límite de líneas');
              }
              if (style.whiteSpace === 'nowrap' || style.wordBreak === 'break-all' || style.wordBreak === 'break-word' || style.overflowWrap === 'anywhere') {
                naturalTextIssues.push(el.tagName.toLowerCase() + ' impide el ajuste natural (' + [style.whiteSpace, style.wordBreak, style.overflowWrap].join(', ') + '): ' + el.textContent.trim().slice(0, 70));
              }
              let ancestor = el;
              while (ancestor && ancestor !== station.parentElement) {
                const ancestorStyle = getComputedStyle(ancestor);
                const clipsY = ['hidden', 'clip'].includes(ancestorStyle.overflowY);
                const clipsX = ['hidden', 'clip'].includes(ancestorStyle.overflowX);
                if (clipsY && ancestor.scrollHeight > ancestor.clientHeight + 1) naturalTextIssues.push(el.tagName.toLowerCase() + ' queda recortado en altura');
                if (clipsX && ancestor.scrollWidth > ancestor.clientWidth + 1) naturalTextIssues.push(el.tagName.toLowerCase() + ' queda recortado en ancho');
                ancestor = ancestor.parentElement;
              }
            });
            const introFillsColumn = intro && Math.abs(introWidth - expectedIntroWidth) <= 2;
            let ecoUsability = null;
            if (station.id === 'ecobogota') {
              const phaseLinks = Array.from(station.querySelectorAll('.eco-phase-nav a'));
              const residueImages = Array.from(station.querySelectorAll('.eco-residue-card img'));
              const focusTarget = phaseLinks[0];
              focusTarget?.focus();
              const focusStyle = focusTarget ? getComputedStyle(focusTarget) : null;
              ecoUsability = {
                phaseLinkCount: phaseLinks.length,
                phaseLinksHaveTargets: phaseLinks.every(link => Boolean(document.querySelector(link.getAttribute('href')))),
                focusVisible: Boolean(focusTarget && focusTarget.matches(':focus-visible') && focusStyle.outlineStyle !== 'none' && parseFloat(focusStyle.outlineWidth) >= 3),
                buttonTargets: Array.from(station.querySelectorAll('.eco-phase-nav .button, .eco-route-panel .button'))
                  .filter(el => el.getClientRects().length).map(el => ({ text: el.textContent.trim(), height: Math.round(el.getBoundingClientRect().height), width: Math.round(el.getBoundingClientRect().width) })),
                imagesHaveAlt: Array.from(station.querySelectorAll('img')).every(img => img.hasAttribute('alt')
                  && (Boolean(img.getAttribute('alt')?.trim())
                    || (img.getAttribute('aria-hidden') === 'true'
                      && Boolean(img.closest('figure')?.querySelector('figcaption')?.textContent.trim())))),
                residueIllustrationCount: residueImages.length,
                residueIllustrationsLoaded: residueImages.every(img => img.complete && img.naturalWidth > 0),
                residueButtonsLabeled: residueImages.length === 10 && residueImages.every(img => Boolean(img.closest('figure')?.querySelector('figcaption')?.textContent.trim())),
                routeCount: station.querySelectorAll('input[name="eco-route"]').length,
                deliveryAvailable: Boolean(station.querySelector('[data-ai-delivery="ECO-A02"]'))
              };
              focusTarget?.blur();
            }

            // Check all diagrams inside station
            const diagrams = station.querySelectorAll('.native-diagram, .triage-concept-block, .interactive-diagram-card');
            const diagramData = [];

            diagrams.forEach((d, idx) => {
              const dRect = d.getBoundingClientRect();
              const dScroll = d.scrollWidth;
              const dClient = d.clientWidth;
              const title = d.querySelector('.native-diagram__title, h3, h4')?.textContent?.trim() || 'Sin título';
              
              // Check cards inside diagram
              const cards = d.querySelectorAll('.native-diagram__card, article');
              const cardData = [];
              cards.forEach(c => {
                const cRect = c.getBoundingClientRect();
                cardData.push({
                  width: Math.round(cRect.width),
                  height: Math.round(cRect.height),
                  left: Math.round(cRect.left),
                  right: Math.round(cRect.right),
                  overflowsViewport: cRect.right > docWidth + 1
                });
              });

              // Check if diagram has SVGs
              const svgs = d.querySelectorAll('svg');
              const svgData = [];
              svgs.forEach(s => {
                const sRect = s.getBoundingClientRect();
                const texts = s.querySelectorAll('text');
                const textMetrics = [];
                texts.forEach(t => {
                  const tRect = t.getBoundingClientRect();
                  textMetrics.push({
                    text: t.textContent.trim(),
                    renderedHeightPx: Math.round(tRect.height * 10) / 10,
                    renderedWidthPx: Math.round(tRect.width * 10) / 10
                  });
                });
                svgData.push({
                  width: Math.round(sRect.width),
                  height: Math.round(sRect.height),
                  textCount: texts.length,
                  minTextHeight: textMetrics.length ? Math.min(...textMetrics.map(m => m.renderedHeightPx)) : null,
                  samples: textMetrics.slice(0, 3)
                });
              });

              // Check typography font-sizes inside diagram
              const allTextNodes = d.querySelectorAll('h3, h4, p, span, li, strong');
              let minFontSize = 999;
              allTextNodes.forEach(tn => {
                const fs = parseFloat(window.getComputedStyle(tn).fontSize);
                if (fs < minFontSize) minFontSize = fs;
              });

              diagramData.push({
                idx: idx + 1,
                title: title.substring(0, 40),
                rectWidth: Math.round(dRect.width),
                scrollWidth: dScroll,
                clientWidth: dClient,
                overflowX: getComputedStyle(d).overflowX,
                overflowingText: Array.from(d.querySelectorAll('h3, h4, p, span, li, strong'))
                  .filter(el => el.getClientRects().length && el.scrollWidth > el.clientWidth + 1)
                  .slice(0, 5)
                  .map(el => ({ tag: el.tagName.toLowerCase(), text: el.textContent.trim().slice(0, 70), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth })),
                overflowsContainer: dScroll > dClient + 1,
                overflowsViewport: dRect.right > docWidth + 1,
                minFontSize: minFontSize === 999 ? null : minFontSize,
                cardsCount: cards.length,
                cards: cardData,
                svgs: svgData
              });
            });

            return {
              stationId: '${st.id}',
              stationOverflow,
              stationScrollWidth,
              stationClientWidth,
              overflowingChildren,
              introText: intro ? {
                width: Math.round(introWidth),
                expectedColumnWidth: Math.round(expectedIntroWidth),
                fillsColumn: introFillsColumn,
                alignment: introStyle.textAlign,
                expectedAlignment: introWidth >= 40 * parseFloat(getComputedStyle(document.documentElement).fontSize) ? 'justify' : 'start',
                lastLineAlignment: introStyle.textAlignLast,
                rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
                lineCount: Math.max(1, Math.round(intro.getBoundingClientRect().height / parseFloat(introStyle.lineHeight)))
              } : null,
              naturalTextIssues: [...new Set(naturalTextIssues)],
              ecoUsability,
              diagrams: diagramData
            };
          })()
        `);

        if (!stationAudit || stationAudit.error) {
          const message = stationAudit?.error || 'el navegador no devolvió el diagnóstico del módulo';
          console.error(`    [${st.name}] FAIL: ${message}`);
          failures.push(`${viewportLabel} ${st.name}: ${message}.`);
          continue;
        }

        console.log(`    [${st.name}] station overflow: ${stationAudit.stationOverflow ? 'FAIL' : 'PASS'} (scrollWidth=${stationAudit.stationScrollWidth}px)`);
        if (stationAudit.stationOverflow) console.log(`      station overflow details: ${JSON.stringify(stationAudit.overflowingChildren)}`);
        const introText = stationAudit.introText;
        const introPass = introText && introText.fillsColumn && introText.alignment === introText.expectedAlignment && introText.lastLineAlignment === 'start' && stationAudit.naturalTextIssues.length === 0;
        console.log(`      ${introPass ? 'PASS' : 'FAIL'} Introductory text: ${introText?.width ?? 'missing'}px / ${introText?.expectedColumnWidth ?? 'n/a'}px; align=${introText?.alignment ?? 'n/a'}; ${introText?.lineCount ?? 0} line(s)`);
        for (const issue of stationAudit.naturalTextIssues) console.log(`        [FAIL] ${issue}`);
        if (!introPass) failures.push(`${viewportLabel} ${st.name}: prosa recortada, alineada incorrectamente o que no llena su columna.`);
        if (stationAudit.stationOverflow) failures.push(`${viewportLabel} ${st.name}: el panel de módulo se desborda.`);
        if (stationAudit.ecoUsability) {
          const usability = stationAudit.ecoUsability;
          const controlsPass = usability.buttonTargets.every(control => control.height >= 44 && control.width > 0);
          const ecoPass = usability.phaseLinkCount === 2 && usability.phaseLinksHaveTargets && usability.focusVisible
            && controlsPass && usability.imagesHaveAlt && usability.residueIllustrationCount === 10
            && usability.residueIllustrationsLoaded && usability.residueButtonsLabeled
            && usability.routeCount === 3 && usability.deliveryAvailable;
          console.log(`      ${ecoPass ? 'PASS' : 'FAIL'} EcoBogotá controles y acceso: ${JSON.stringify(usability)}`);
          if (!ecoPass) failures.push(`${viewportLabel} ${st.name}: navegación, foco, controles o imágenes accesibles incompletos.`);
        }
        for (const dg of stationAudit.diagrams) {
          const status = (!dg.overflowsContainer && !dg.overflowsViewport) ? 'PASS' : 'FAIL';
          if (status === 'FAIL') failures.push(`${viewportLabel} ${st.name}: el diagrama ${dg.title} se desborda.`);
          console.log(`      ${status} Diagram "${dg.title}": width=${dg.rectWidth}px, minFont=${dg.minFontSize}px, overflowContainer=${dg.overflowsContainer}, overflowViewport=${dg.overflowsViewport}`);
          if (dg.overflowsContainer || dg.overflowsViewport) console.log(`        overflow details: ${JSON.stringify({ scrollWidth: dg.scrollWidth, clientWidth: dg.clientWidth, overflowX: dg.overflowX, overflowingText: dg.overflowingText })}`);
          if (dg.svgs && dg.svgs.length > 0) {
            for (const s of dg.svgs) {
              console.log(`        SVG rendered: ${s.width}x${s.height}px | texts=${s.textCount} | minTextHeight=${s.minTextHeight}px`);
              if (s.minTextHeight !== null && s.minTextHeight < 8) {
                console.log(`        [ADVERSARIAL WARNING] SVG text rendered height is ${s.minTextHeight}px (< 8px! Ilegible en móvil)`);
              }
            }
          }
          if (dg.cards && dg.cards.some(c => c.overflowsViewport)) {
            console.log(`        [FAIL] One or more cards overflow viewport:`, dg.cards.filter(c => c.overflowsViewport));
          }
        }
      }
    }

    if (!process.env.DEVBRAIN_LAYOUT_AUDIT_STATION || process.env.DEVBRAIN_LAYOUT_AUDIT_STATION === 'ecobogota') {
      const guidePath = path.resolve('materiales/ia/eco/LEEME.html').replace(/\\/g, '/');
      const guideUrl = `file:///${guidePath}`;
      await cdp.send('Page.navigate', { url: guideUrl });
      await wait(350);
      for (const vp of viewports) {
        const viewportLabel = vp.zoom ? vp.label : `${vp.label}px`;
        const zoom = vp.zoom ? vp.zoom / 100 : 1;
        const cssWidth = Math.round(vp.width / zoom);
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: cssWidth,
          height: Math.round(900 / zoom),
          deviceScaleFactor: zoom,
          mobile: vp.zoom ? false : vp.width < 768
        });
        await wait(150);
        const guideAudit = await cdp.evaluate(`(() => {
          const grid = document.querySelector('.eco-residue-grid');
          const figures = Array.from(document.querySelectorAll('.eco-residue-card'));
          const images = figures.map(figure => figure.querySelector('img'));
          return {
            width: window.innerWidth,
            scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
            figureCount: figures.length,
            imagesLoaded: images.every(image => image && image.complete && image.naturalWidth > 0),
            imagesHaveTextAlternatives: images.every(image => Boolean(image?.alt.trim())),
            captionsVisible: figures.every(figure => {
              const caption = figure.querySelector('figcaption');
              return Boolean(caption?.textContent.trim()) && caption.clientWidth > 0 && caption.clientHeight > 0;
            }),
            columns: grid ? getComputedStyle(grid).gridTemplateColumns.split(/\\s+/).length : 0,
            textOverflow: Array.from(document.querySelectorAll('h1,h2,h3,figcaption,li,summary'))
              .some(element => element.getClientRects().length && element.scrollWidth > element.clientWidth + 1)
          };
        })()`);
        const expectedColumns = cssWidth < 640 ? 1 : cssWidth < 960 ? 2 : 3;
        const guidePass = guideAudit && guideAudit.scrollWidth <= guideAudit.width + 1
          && guideAudit.figureCount === 10 && guideAudit.imagesLoaded && guideAudit.imagesHaveTextAlternatives
          && guideAudit.captionsVisible && guideAudit.columns === expectedColumns && !guideAudit.textOverflow;
        console.log(`\n>>> GUÍA DESCARGABLE: ${viewportLabel} <<<`);
        console.log(`  ${guidePass ? 'PASS' : 'FAIL'} Ilustraciones, pies, columnas y ancho: ${JSON.stringify(guideAudit)}`);
        if (!guidePass) failures.push(`${viewportLabel} Guía EcoBogotá: ilustraciones incompletas o composición con desbordamiento.`);
      }

      await cdp.send('Emulation.setEmulatedMedia', { media: 'print' });
      await wait(150);
      const printAudit = await cdp.evaluate(`(() => {
        const grid = document.querySelector('.eco-residue-grid');
        return {
          printMedia: matchMedia('print').matches,
          columns: grid ? getComputedStyle(grid).gridTemplateColumns.split(/\\s+/).length : 0,
          figureCount: document.querySelectorAll('.eco-residue-card').length,
          documentFits: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= window.innerWidth + 1
        };
      })()`);
      const printPass = printAudit?.printMedia && printAudit.columns === 2 && printAudit.figureCount === 10 && printAudit.documentFits;
      console.log(`\n>>> GUÍA DESCARGABLE: impresión <<<`);
      console.log(`  ${printPass ? 'PASS' : 'FAIL'} Galería y páginas imprimibles: ${JSON.stringify(printAudit)}`);
      if (!printPass) failures.push('Guía EcoBogotá: la galería no se compone en dos columnas al imprimir.');
      await cdp.send('Emulation.setEmulatedMedia', { media: '' });
    }

    cdp.close();
    console.log(`\nResultado: ${failures.length ? `${failures.length} problema(s)` : 'sin problemas de ajuste, recorte o desbordamiento'}.`);
    if (failures.length) {
      for (const failure of failures) console.error(`  - ${failure}`);
      process.exitCode = 1;
    }
  } finally {
    edgeProc.kill('SIGKILL');
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch(e) {}
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
