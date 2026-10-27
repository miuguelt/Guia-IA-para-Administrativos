(function (root) {
  'use strict';
  function format(value) {
    if (value === null || value === undefined) return 'Sin dato';
    return typeof value === 'number' ? new Intl.NumberFormat('es-CO', { maximumFractionDigits: 4 }).format(value) : String(value);
  }

  function element(doc, name, text, className) {
    const node = doc.createElement(name);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function chart(doc, result) {
    const figure = element(doc, 'figure', undefined, 'result-chart');
    figure.append(element(doc, 'figcaption', result.unit));
    const values = result.points.map(point => point.value).filter(Number.isFinite);
    const low = Math.min(0, ...values), high = Math.max(0, ...values), span = high - low || 1;
    figure.append(element(doc, 'p', `Escala común: ${format(low)} a ${format(high)}.`, 'lab-muted'));
    const list = element(doc, 'ul', undefined, 'result-bars');
    for (const point of result.points) {
      const item = element(doc, 'li');
      item.append(element(doc, 'span', point.label, 'result-bar-label'));
      const track = element(doc, 'span', undefined, 'result-bar-track');
      track.setAttribute('aria-hidden', 'true');
      track.style.setProperty('--result-zero', `${-low / span * 100}%`);
      if (Number.isFinite(point.value)) {
        const bar = element(doc, 'i');
        bar.dataset.value = point.value;
        bar.style.left = `${(Math.min(0, point.value) - low) / span * 100}%`;
        bar.style.width = `${Math.abs(point.value) / span * 100}%`;
        track.append(bar);
      }
      item.append(track, element(doc, 'strong', format(point.value)));
      list.append(item);
    }
    figure.append(list);
    return figure;
  }

  function donut(doc, composition) {
    const total = composition.parts.reduce((sum, part) => sum + part.value, 0);
    const figure = element(doc, 'figure', undefined, 'result-donut');
    figure.append(element(doc, 'figcaption', composition.title));
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 42 42');
    svg.setAttribute('aria-hidden', 'true');
    const list = element(doc, 'ul');
    const percent = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    let offset = 25;
    composition.parts.forEach((part, index) => {
      const share = part.value / total * 100;
      const ring = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
      for (const [name, value] of [['cx', 21], ['cy', 21], ['r', 15.915], ['fill', 'none'], ['stroke-width', 6],
        ['stroke-dasharray', `${share} ${100 - share}`], ['stroke-dashoffset', offset]]) ring.setAttribute(name, value);
      ring.dataset.part = index % 5;
      svg.append(ring);
      offset -= share;
      const item = element(doc, 'li', `${part.label}: ${format(part.value)} ${part.value === 1 ? composition.singular : composition.unit} · ${percent.format(share)} %`);
      item.dataset.part = index % 5;
      list.append(item);
    });
    figure.append(svg, list);
    return figure;
  }

  function table(doc, result) {
    const details = element(doc, 'details', undefined, 'result-data');
    details.append(element(doc, 'summary', `Revisar la tabla del resultado · ${result.rows.length} ${result.rows.length === 1 ? 'fila' : 'filas'}`));
    const holder = element(doc, 'div', undefined, 'lab-table-wrap');
    holder.tabIndex = 0;
    holder.setAttribute('role', 'region');
    holder.setAttribute('aria-label', 'Tabla del resultado simulado');
    const grid = element(doc, 'table');
    grid.createCaption().textContent = 'Resultado de la selección actual. El CSV conserva los valores sin redondear; una celda vacía indica un dato ausente o no calculable.';
    const head = grid.createTHead().insertRow();
    for (const label of result.headers) { const cell = element(doc, 'th', label); cell.scope = 'col'; head.append(cell); }
    const body = grid.createTBody();
    for (const row of result.rows) {
      const line = body.insertRow();
      for (const value of row) line.insertCell().textContent = format(value);
    }
    holder.append(grid); details.append(holder);
    return details;
  }

  function render(output, result) {
    const doc = output.ownerDocument;
    output.replaceChildren();
    output.append(element(doc, 'h4', result.title));
    const metrics = element(doc, 'dl', undefined, 'result-metrics');
    for (const [label, value, unit] of result.metrics) {
      const pair = element(doc, 'div');
      pair.append(element(doc, 'dt', label), element(doc, 'dd', `${format(value)}${unit ? ' ' + unit : ''}`));
      metrics.append(pair);
    }
    output.append(metrics);
    if (!result.count) {
      output.append(element(doc, 'p', 'Sin resultados para esta selección. Cambia los filtros o restablece el ejemplo para continuar.', 'lab-callout'));
    } else {
      if (result.chart) output.append(chart(doc, result.chart));
      else output.append(element(doc, 'blockquote', result.rows[0][0], 'result-claim'));
      if (result.composition?.parts.some(part => part.value > 0)) output.append(donut(doc, result.composition));
      output.append(table(doc, result));
      if (result.sourceUrl?.startsWith('https://')) {
        const link = element(doc, 'a', 'Abrir la página de la fuente original ↗', 'button button-outline');
        link.href = result.sourceUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.dataset.resultSource = '';
        output.append(link);
      }
    }
    output.append(element(doc, 'p', result.note, 'lab-callout'));
  }
  root.AnalysisResultsView = { render };
})(window);
