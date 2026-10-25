(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AnalysisLabModel = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const views = Object.freeze({
    planetas: { dataset: 'exoplanetas', title: 'Radio y periodo orbital', x: 'Periodo orbital (días)', y: 'Radio (radios terrestres)', modes: ['scatter', 'histogram'] },
    estrellas: { dataset: 'exoplanetas', title: 'Estrellas anfitrionas sin duplicados', x: 'Temperatura efectiva (K)', y: 'Radio (radios solares)', modes: ['scatter', 'histogram'] },
    poblacion: { dataset: 'poblacion', title: 'Población por país y año', x: 'Año', y: 'Población (personas)', modes: ['lines', 'bars'] },
    clima: { dataset: 'clima', title: 'Temperatura diaria en la rejilla de Bogotá', x: 'Fecha de 2024 (LST)', y: 'Temperatura a 2 m (°C)', modes: ['lines', 'histogram'] },
    sismos: { dataset: 'sismos', title: 'Ubicación de los eventos seleccionados', x: 'Longitud (°)', y: 'Latitud (°)', modes: ['map', 'histogram'] }
  });

  function numeric(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const result = Number(value);
    return Number.isFinite(result) && result !== -999 ? result : null;
  }

  function prepare(data, view, options = {}) {
    const meta = views[view];
    if (!meta) throw new Error('La vista seleccionada no existe.');
    const source = data[meta.dataset] || [];
    const rows = source.filter(row => (!options.country || row.codigo === options.country)
      && (!options.year || String(row.anio || row.fecha?.slice(0, 4)) === String(options.year)));
    let points = [];
    let duplicates = 0;
    const conflicting = new Set();
    const stars = new Map();
    for (const row of rows) {
      let x, y, label, group = '', value;
      if (view === 'planetas') {
        x = numeric(row.pl_orbper); y = numeric(row.pl_rade); label = row.pl_name;
        group = row.discoverymethod || 'Método no informado';
        if (x !== null && x <= 0 || y !== null && y <= 0) continue;
      } else if (view === 'estrellas') {
        x = numeric(row.st_teff); y = numeric(row.st_rad); label = row.hostname;
        if (x === null || y === null || x <= 0 || y <= 0 || !label) continue;
        if (stars.has(label)) {
          const prior = stars.get(label);
          if (prior.x !== x || prior.y !== y) conflicting.add(label);
          else duplicates += 1;
          continue;
        }
        stars.set(label, { x, y });
      } else if (view === 'poblacion') {
        x = numeric(row.anio); y = numeric(row.poblacion); label = `${row.pais} · ${row.anio}`; group = row.pais;
      } else if (view === 'clima') {
        x = numeric(Date.parse(row.fecha + 'T00:00:00Z'));
        y = numeric(options.rain ? row.precipitacion_mm : row.temperatura_c); label = row.fecha;
      } else {
        x = numeric(row.longitud); y = numeric(row.latitud); label = `${row.id} · ${row.fecha}`;
        value = numeric(row.magnitud); group = row.tipo_magnitud || 'Tipo no informado';
        if (x !== null && Math.abs(x) > 180 || y !== null && Math.abs(y) > 90) continue;
      }
      if (x !== null && y !== null) points.push({ label: String(label), x, y, group, value: value ?? y });
    }
    if (view === 'estrellas') points = points.filter(point => !conflicting.has(point.label));
    points.sort((a, b) => a.x - b.x || a.label.localeCompare(b.label));
    if (view === 'poblacion' && options.indexed) {
      const bases = new Map();
      for (const point of points) {
        if (!bases.has(point.group)) bases.set(point.group, point.y);
        const base = bases.get(point.group);
        point.y = base > 0 ? point.y * 100 / base : null;
        point.value = point.y;
      }
      points = points.filter(point => point.y !== null);
    }
    return { points, total: source.length, filtered: rows.length, excluded: rows.length - points.length,
      duplicates, conflicts: conflicting.size, meta };
  }

  function histogram(values, count = 12) {
    const clean = values.filter(value => Number.isFinite(value));
    if (!clean.length) return [];
    const [minimum, maximum] = extent(clean);
    const size = (maximum - minimum) / count;
    const bins = Array.from({ length: count }, (_, index) => ({ low: minimum + size * index, high: minimum + size * (index + 1), count: 0 }));
    for (const value of clean) bins[Math.min(count - 1, Math.max(0, Math.floor((value - minimum) / size)))].count += 1;
    return bins;
  }

  function extent(values, logarithmic = false) {
    const valid = values.filter(value => Number.isFinite(value) && (!logarithmic || value > 0));
    if (!valid.length) return logarithmic ? [1, 10] : [0, 1];
    let low = Math.min(...valid), high = Math.max(...valid);
    if (low === high) {
      const margin = Math.abs(low) * 0.1 || 1;
      low -= margin; high += margin;
    }
    return [low, high];
  }

  function scale(value, domain, start, end, logarithmic = false) {
    const [low, high] = logarithmic ? domain.map(Math.log10) : domain;
    return start + ((logarithmic ? Math.log10(value) : value) - low) / (high - low) * (end - start);
  }

  function toCSV(points) {
    const cell = value => {
      let text = String(value ?? '');
      if (/^[=+@\-]/u.test(text) && typeof value !== 'number') text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    return '\uFEFF' + ['registro,x,y,grupo,valor', ...points.map(point => [point.label, point.x, point.y, point.group, point.value].map(cell).join(','))].join('\r\n');
  }
  return { views, numeric, prepare, histogram, extent, scale, toCSV };
});
