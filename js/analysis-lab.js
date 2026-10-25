(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AnalysisLab = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const instances = new WeakMap();
  const palette = ['#245e6c', '#b45425', '#685299', '#247455'];
  const modeNames = { scatter: 'Dispersión', histogram: 'Histograma', lines: 'Líneas', bars: 'Barras de un año', map: 'Mapa de coordenadas' };

  function format(value) {
    return new Intl.NumberFormat('es-CO', { maximumSignificantDigits: 5 }).format(value);
  }

  function node(doc, name, attrs = {}, text = '') {
    const element = doc.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
    if (text) element.textContent = text;
    return element;
  }

  function draw(doc, model, points, view, mode, options, labels) {
    const svg = doc.getElementById('lab-chart');
    svg.replaceChildren();
    svg.setAttribute('viewBox', '0 0 840 420');
    svg.append(node(doc, 'title', {}, labels.title), node(doc, 'desc', {}, `${points.length} registros. La tabla después del gráfico contiene los mismos datos.`));
    const bins = mode === 'histogram' ? model.histogram(points.map(p => p.value)) : [];
    const groups = [...new Set(points.map(point => point.group))];
    let xd = model.extent(points.map(p => p.x), options.log), yd = model.extent(points.map(p => p.y));
    if (mode === 'histogram' && bins.length) { xd = [bins[0].low, bins.at(-1).high]; yd = [0, Math.max(...bins.map(bin => bin.count)) || 1]; }
    if (mode === 'bars') { xd = [-0.5, Math.max(points.length - 0.5, 0.5)]; yd = [0, Math.max(...points.map(p => p.y), 1)]; }
    if (mode === 'map') { xd = [-180, 180]; yd = [-90, 90]; }
    const x = value => model.scale(value, xd, 82, 804, mode === 'scatter' && options.log);
    const y = value => model.scale(value, yd, 344, 24);
    for (let i = 0; i <= 4; i += 1) {
      const fraction = i / 4;
      const xv = options.log && mode === 'scatter' ? 10 ** (Math.log10(xd[0]) + fraction * (Math.log10(xd[1]) - Math.log10(xd[0]))) : xd[0] + fraction * (xd[1] - xd[0]);
      const yv = yd[0] + fraction * (yd[1] - yd[0]);
      svg.append(node(doc, 'line', { x1: 82, x2: 804, y1: y(yv), y2: y(yv), stroke: '#d8e1e3' }));
      svg.append(node(doc, 'text', { x: 72, y: y(yv) + 4, 'text-anchor': 'end', class: 'lab-axis-tick' }, format(yv)));
      if (mode !== 'bars') {
        const tick = view === 'clima' && mode === 'lines' ? new Date(xv).toISOString().slice(5, 10) : format(xv);
        svg.append(node(doc, 'text', { x: x(xv), y: 366, 'text-anchor': 'middle', class: 'lab-axis-tick' }, tick));
      }
    }
    const xLabel = mode === 'histogram' ? labels.value : mode === 'bars' ? 'País' : labels.x;
    const yLabel = mode === 'histogram' ? 'Cantidad de registros' : labels.y;
    svg.append(node(doc, 'text', { x: 443, y: 405, 'text-anchor': 'middle', class: 'lab-axis-title' }, xLabel));
    svg.append(node(doc, 'text', { transform: 'translate(19 182) rotate(-90)', 'text-anchor': 'middle', class: 'lab-axis-title' }, yLabel));
    if (!points.length) return;
    if (mode === 'histogram') {
      for (const bin of bins) {
        const rect = node(doc, 'rect', { x: x(bin.low) + 1, y: y(bin.count), width: Math.max(0, x(bin.high) - x(bin.low) - 2), height: 344 - y(bin.count), fill: palette[0], 'data-bin': bin.count });
        rect.append(node(doc, 'title', {}, `${format(bin.low)} a ${format(bin.high)}: ${bin.count} registros`));
        svg.append(rect);
      }
    } else if (mode === 'bars') {
      points.forEach((point, index) => {
        svg.append(node(doc, 'rect', { x: x(index - 0.32), y: y(point.y), width: x(0.64) - x(0), height: 344 - y(point.y), fill: palette[index % palette.length] }));
        svg.append(node(doc, 'text', { x: x(index), y: 368, 'text-anchor': 'middle', class: 'lab-axis-tick' }, point.group));
      });
    } else {
      if (mode === 'lines') {
        for (const group of groups) {
          const subset = points.filter(point => point.group === group);
          let prior;
          const commands = subset.map(point => {
            const gap = !prior || point.x - prior.x > (view === 'clima' ? 86400000 * 1.5 : 1.5);
            prior = point;
            return `${gap ? 'M' : 'L'}${x(point.x)},${y(point.y)}`;
          });
          svg.append(node(doc, 'path', { d: commands.join(' '), stroke: palette[groups.indexOf(group) % palette.length], fill: 'none', 'stroke-width': 2.5 }));
        }
      }
      for (const point of points) {
        const circle = node(doc, 'circle', { cx: x(point.x), cy: y(point.y), r: mode === 'lines' ? 2 : 3.3, fill: palette[groups.indexOf(point.group) % palette.length], opacity: 0.72 });
        circle.append(node(doc, 'title', {}, `${point.label}: ${format(point.x)}, ${format(point.y)}`));
        svg.append(circle);
      }
    }
  }

  function init(doc, win) {
    const panel = doc?.getElementById('lab-explorer');
    const model = win?.AnalysisLabModel;
    if (!panel || !model) return null;
    if (instances.has(panel)) return instances.get(panel);
    const get = id => doc.getElementById(id);
    let data;
    try { data = JSON.parse(get('lab-source-data').textContent); }
    catch { get('lab-chart-summary').textContent = 'No fue posible leer los datos incluidos. Descarga los CSV y continúa con las instrucciones del laboratorio.'; return null; }
    const viewSelect = get('lab-view'), modeSelect = get('lab-mode');
    const country = get('lab-country'), year = get('lab-year');
    let page = 0, lastView = '', result;
    const setOptions = (select, entries) => {
      select.replaceChildren();
      for (const [value, label] of entries) {
        const option = doc.createElement('option'); option.value = value; option.textContent = label; select.append(option);
      }
    };
    setOptions(country, [['', 'Todos los países'], ...[...new Map((data.poblacion || []).map(row => [row.codigo, row.pais])).entries()]]);
    setOptions(year, [['', 'Todos los años'], ...[...new Set((data.poblacion || []).map(row => row.anio))].sort().map(value => [value, value])]);

    function table() {
      const holder = get('lab-table'); holder.replaceChildren();
      const element = doc.createElement('table');
      const caption = element.createCaption(); caption.textContent = 'Datos exactos de la selección; la descarga incluye todas sus filas.';
      const head = element.createTHead().insertRow();
      const headers = ['Registro', result.labels.x, result.labels.y, 'Grupo', result.labels.value];
      for (const title of headers) { const th = doc.createElement('th'); th.scope = 'col'; th.textContent = title; head.append(th); }
      const body = element.createTBody();
      page = Math.max(0, Math.min(page, Math.ceil(result.points.length / 25) - 1));
      for (const point of result.points.slice(page * 25, (page + 1) * 25)) {
        const tr = body.insertRow();
        const xText = viewSelect.value === 'clima' ? point.label : format(point.x);
        for (const value of [point.label, xText, format(point.y), point.group || '—', format(point.value)]) tr.insertCell().textContent = value;
      }
      holder.append(element);
      get('lab-table-page').textContent = `Página ${page + 1} de ${Math.max(1, Math.ceil(result.points.length / 25))} · ${result.points.length} registros en total.`;
      get('lab-prev').disabled = page === 0;
      get('lab-next').disabled = (page + 1) * 25 >= result.points.length;
    }

    function refresh() {
      const view = viewSelect.value, meta = model.views[view];
      if (view !== lastView) {
        setOptions(modeSelect, meta.modes.map(mode => [mode, modeNames[mode]]));
        country.value = ''; year.value = ''; page = 0; lastView = view;
      }
      const mode = modeSelect.value;
      for (const [id, visible] of [['lab-country-wrap', view === 'poblacion'], ['lab-year-wrap', view === 'poblacion'], ['lab-index-wrap', view === 'poblacion' && mode === 'lines'], ['lab-rain-wrap', view === 'clima'], ['lab-log-wrap', ['planetas', 'estrellas'].includes(view) && mode === 'scatter']]) get(id).hidden = !visible;
      if (view === 'poblacion' && mode === 'bars' && !year.value) year.value = year.options[year.options.length - 1].value;
      const options = { country: view === 'poblacion' ? country.value : '', year: view === 'poblacion' ? year.value : '',
        indexed: view === 'poblacion' && mode === 'lines' && get('lab-index').checked, rain: view === 'clima' && get('lab-rain').checked,
        log: ['planetas', 'estrellas'].includes(view) && mode === 'scatter' && get('lab-log').checked };
      result = model.prepare(data, view, options);
      result.labels = { ...meta, value: view === 'sismos' ? 'Magnitud (según el tipo registrado)' : meta.y };
      if (options.indexed) { result.labels.title = 'Población: índice 100 en el primer año visible de cada país'; result.labels.y = 'Índice (base 100)'; result.labels.value = result.labels.y; }
      if (options.rain) { result.labels.title = 'Precipitación diaria en la rejilla de Bogotá'; result.labels.y = 'Precipitación (mm/día)'; result.labels.value = result.labels.y; }
      get('lab-chart-title').textContent = result.labels.title;
      get('lab-chart-summary').textContent = result.points.length ? `${result.points.length} ${view === 'estrellas' ? 'estrellas' : 'registros'} representados · ${result.excluded} omitidos de ${result.filtered} seleccionados · ${result.total} filas en la fuente incluida.` : 'Sin datos válidos para esta selección. Cambia el país o el año; los valores ausentes no se convierten en cero.';
      let note = options.log ? 'Escala logarítmica en el eje horizontal: distancias iguales representan razones iguales.' : 'Escala lineal: distancias iguales representan diferencias iguales.';
      if (view === 'estrellas') note += ` Se agrupan anfitrionas idénticas; ${result.conflicts} anfitrionas con valores discrepantes se excluyen para revisión. No es un censo de estrellas.`;
      if (view === 'clima') note += ' Datos de rejilla y hora solar local (LST), no medición de una estación urbana. Las líneas se interrumpen ante días ausentes.';
      if (view === 'sismos') note += ' Catálogo limitado a enero de 2024 y magnitud ≥5. El mapa usa longitud y latitud; no predice eventos. Los tipos de magnitud se conservan en la tabla.';
      if (view === 'planetas') note += ' Selección explícita del catálogo NASA: consulta sus filtros y fecha en el manifiesto; no representa todos los planetas del universo.';
      if (view === 'poblacion') note += options.indexed ? ' Cada país se compara con su propio primer año visible; el índice no representa cantidad de personas.' : ' Un mismo país en años diferentes no representa personas que deban sumarse.';
      get('lab-chart-note').textContent = note;
      draw(doc, model, result.points, view, mode, options, result.labels);
      get('lab-legend').replaceChildren();
      const groups = [...new Set(result.points.map(point => point.group))].filter(Boolean);
      groups.forEach((group, index) => { const item = doc.createElement('span'); item.textContent = `${index + 1}. ${group}`; item.style.borderColor = palette[index % palette.length]; get('lab-legend').append(item); });
      table();
    }

    panel.addEventListener('change', () => { page = 0; refresh(); });
    get('lab-prev').addEventListener('click', () => { page -= 1; table(); });
    get('lab-next').addEventListener('click', () => { page += 1; table(); });
    get('lab-download').addEventListener('click', () => {
      const url = win.URL.createObjectURL(new win.Blob([model.toCSV(result.points)], { type: 'text/csv;charset=utf-8' }));
      const anchor = doc.createElement('a'); anchor.href = url; anchor.download = 'seleccion-laboratorio.csv'; anchor.click(); win.URL.revokeObjectURL(url);
    });
    const api = { refresh }; instances.set(panel, api); refresh(); return api;
  }
  return { init };
});
