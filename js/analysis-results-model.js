(function (root, factory) {
  'use strict';
  const base = typeof module === 'object' && module.exports ? require('./analysis-lab-model.js') : root.AnalysisLabModel;
  const api = factory(base);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AnalysisResultsModel = api;
})(typeof window === 'undefined' ? globalThis : window, function (base) {
  'use strict';
  const number = base.numeric;

  function median(values) {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length ? (sorted[middle] + sorted[Math.floor((sorted.length - 1) / 2)]) / 2 : null;
  }

  function distribution(values, unit) {
    const bins = base.histogram(values, 12);
    const interval = new Intl.NumberFormat('es-CO', { maximumSignificantDigits: 4, useGrouping: false });
    return { headers: [`Desde (${unit})`, `Hasta (${unit})`, 'Cantidad'],
      rows: bins.map(bin => [bin.low, bin.high, bin.count]),
      chart: { unit: 'Cantidad de registros', points: bins.map(bin => ({ label: `${interval.format(bin.low)}–${interval.format(bin.high)} ${unit}`, value: bin.count })) } };
  }

  function nasa(data, options) {
    const stars = options.variable === 'estrellas', period = options.variable === 'periodo';
    const prepared = base.prepare(data, stars ? 'estrellas' : 'planetas');
    const values = prepared.points.map(point => period ? point.x : point.y);
    const unit = period ? 'días' : stars ? 'radios solares' : 'radios terrestres';
    const middle = median(values);
    return { ...distribution(values, unit), count: values.length, median: middle,
      title: stars ? 'Radios de estrellas anfitrionas únicas' : period ? 'Distribución del periodo orbital' : 'Distribución del radio planetario',
      metrics: [[stars ? 'Estrellas representadas' : 'Planetas representados', values.length], ['Mediana', middle, unit], ['Filas omitidas', prepared.excluded]],
      note: stars ? `Las anfitrionas idénticas se agrupan. Se excluyen ${prepared.conflicts} anfitrionas con parámetros discrepantes para revisarlas; una fila de planeta no equivale a una estrella distinta.`
        : 'La mediana divide los valores ordenados en dos mitades. Esta selección de detecciones por tránsito no permite inferir habitabilidad ni describir todos los planetas.' };
  }

  function population(data, options) {
    const start = number(options.start ?? 2000), end = number(options.end ?? 2024);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start >= end) throw new Error('El año inicial debe ser anterior al año final. Elige dos años válidos.');
    const groups = new Map();
    for (const row of data.poblacion || []) {
      if (!groups.has(row.codigo)) groups.set(row.codigo, { name: row.pais });
      if (Number(row.anio) === start) groups.get(row.codigo).start = number(row.poblacion);
      if (Number(row.anio) === end) groups.get(row.codigo).end = number(row.poblacion);
    }
    const rows = [];
    for (const group of groups.values()) {
      if (group.start == null || group.end == null || group.start < 0 || group.end < 0) continue;
      rows.push([group.name, group.start, group.end, group.end - group.start, group.start > 0 ? 100 * (group.end / group.start - 1) : null]);
    }
    const indexed = options.variable === 'indice';
    return { title: `Cambio de población entre ${start} y ${end}`, count: rows.length,
      metrics: [['Países comparables', rows.length], ['Año inicial', String(start)], ['Año final', String(end)]],
      headers: ['País', `${start} (personas)`, `${end} (personas)`, 'Cambio (personas)', 'Cambio (%)'], rows,
      chart: { unit: indexed ? `Índice final (base ${start} = 100)` : 'Cambio (%)', points: rows.map(row => ({ label: row[0], value: row[4] === null ? null : indexed ? 100 + row[4] : row[4] })) },
      composition: { title: `Participación en ${end} dentro de los países comparables`, unit: 'personas', singular: 'persona', parts: rows.map(row => ({ label: row[0], value: row[2] })) },
      note: `Calcula el porcentaje como 100 × (población final / población inicial − 1). ${indexed ? 'El índice compara cada país con su propia base; 100 significa que conserva el valor inicial.' : 'El porcentaje compara crecimiento relativo; la tabla conserva el tamaño en personas.'} Una base de cero deja el porcentaje sin calcular. La serie no demuestra causas del cambio.` };
  }

  function climate(data, options) {
    const months = new Map(), temperatures = [], rain = [];
    let count = 0;
    for (const row of data.clima || []) {
      const date = new Date(row.fecha + 'T00:00:00Z');
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== row.fecha || options.month && row.fecha.slice(5, 7) !== options.month) continue;
      count += 1;
      const key = row.fecha.slice(0, 7);
      if (!months.has(key)) months.set(key, { temperatures: [], rain: [] });
      const month = months.get(key), temperature = number(row.temperatura_c), precipitation = number(row.precipitacion_mm);
      if (temperature !== null) { month.temperatures.push(temperature); temperatures.push(temperature); }
      if (precipitation !== null && precipitation >= 0) { month.rain.push(precipitation); rain.push(precipitation); }
    }
    const sum = values => values.length ? values.reduce((total, value) => total + value, 0) : null;
    const mean = values => values.length ? sum(values) / values.length : null;
    const rows = [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, month]) => [key, month.temperatures.length, mean(month.temperatures), month.rain.length, sum(month.rain)]);
    const precipitation = options.variable === 'lluvia';
    return { title: precipitation ? 'Precipitación acumulada por mes' : 'Temperatura media por mes', count, mean: mean(temperatures), rain: sum(rain),
      metrics: [['Media de los días válidos', mean(temperatures), '°C'], ['Precipitación acumulada', sum(rain), 'mm'], ['Días válidos: temperatura / lluvia', `${temperatures.length} / ${rain.length}`]],
      headers: ['Mes', 'Días con temperatura', 'Temperatura media (°C)', 'Días con lluvia', 'Precipitación (mm)'], rows,
      chart: { unit: precipitation ? 'Precipitación acumulada (mm)' : 'Temperatura media (°C)', points: rows.map(row => ({ label: row[0], value: row[precipitation ? 4 : 2] })) },
      note: 'La media se calcula con todos los días válidos, sin dar el mismo peso a meses de distinta duración. La lluvia se suma. Cero es un dato; −999 y las celdas vacías se omiten. Son datos de rejilla en hora solar local (LST), no de una estación urbana.' };
  }

  function earthquakes(data, options) {
    const minimum = number(options.magnitude ?? 5);
    if (minimum === null || minimum < 5 || minimum > 10) throw new Error('Elige una magnitud mínima entre 5 y 10. El catálogo incluido comienza en 5.');
    const selected = (data.sismos || []).filter(row => number(row.magnitud) !== null && Number(row.magnitud) >= minimum);
    const depths = selected.map(row => number(row.profundidad_km)).filter(value => value !== null);
    const daily = options.variable === 'dias';
    const chart = daily ? { unit: 'Eventos por día (UTC)', points: Array.from({ length: 31 }, (_, i) => {
      const day = `2024-01-${String(i + 1).padStart(2, '0')}`;
      return { label: day, value: selected.filter(row => row.fecha.slice(0, 10) === day).length };
    }) } : distribution(depths, 'km').chart;
    const maximum = selected.length ? Math.max(...selected.map(row => Number(row.magnitud))) : null;
    const types = new Map();
    for (const row of selected) types.set(row.tipo_magnitud || 'Sin tipo', (types.get(row.tipo_magnitud || 'Sin tipo') || 0) + 1);
    return { title: daily ? 'Conteo diario de eventos en enero de 2024' : 'Distribución de profundidades', count: selected.length, median: median(depths),
      metrics: [['Eventos seleccionados', selected.length], ['Magnitud máxima', maximum], ['Mediana de profundidad', median(depths), 'km']],
      headers: daily ? ['Fecha UTC', 'Eventos seleccionados'] : ['ID', 'Fecha UTC', 'Magnitud', 'Profundidad (km)', 'Tipo de magnitud'],
      rows: daily ? chart.points.map(point => [point.label, point.value]) : selected.map(row => [row.id, row.fecha, Number(row.magnitud), number(row.profundidad_km), row.tipo_magnitud]), chart,
      composition: { title: 'Eventos por tipo de magnitud', unit: 'eventos', singular: 'evento', parts: [...types].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value })) },
      note: `Selección mundial de enero de 2024 con magnitud ≥ ${minimum}. El conteo diario conserva los días sin eventos seleccionados. Consulta los tipos de magnitud en la tabla de la vista de profundidades. Este catálogo no estima daños, riesgo local ni eventos futuros.` };
  }

  function documents(data, options) {
    const row = (data.documentos || [])[Number(options.document ?? 0)];
    const stage = options.stage || 'referencia';
    const status = stage === 'contexto' ? 'Ejemplo verificado en la fuente' : stage === 'pagina' ? 'Página localizada; pendiente contrastar el contexto' : 'Pendiente localizar y contrastar la página';
    return { title: 'De una afirmación a su evidencia', count: row ? 1 : 0,
      metrics: [['Afirmaciones en el ejemplo', (data.documentos || []).length], ['Página PDF del ejemplo', row?.pagina_pdf ?? null], ['Etapa ilustrada', stage === 'contexto' ? 'Contrastar el contexto' : stage === 'pagina' ? 'Localizar la página' : 'Registrar la referencia']],
      headers: ['Afirmación', 'Documento', 'Página PDF', 'Tipo', 'Estado ilustrado', 'Límite de interpretación', 'Fuente (URL)'],
      rows: row ? [[row.afirmacion, row.id_documento, row.pagina_pdf, row.tipo, status, row.limite_interpretacion, row.url_evidencia]] : [],
      sourceUrl: row?.url_evidencia,
      note: 'Este simulador muestra las etapas de un ejemplo revisado; cambiar la etapa no certifica tu lectura ni completa tu evidencia. Abre la página original, revisa el contexto y registra tu propia comprobación. Conserva la edición y distingue una proyección de una observación.' };
  }

  function simulate(data, name, options = {}) {
    const scenarios = { nasa, poblacion: population, clima: climate, sismos: earthquakes, documentos: documents };
    if (!Object.hasOwn(scenarios, name)) throw new Error('El simulador seleccionado no existe.');
    return scenarios[name](data, options);
  }

  function toCSV(result) {
    const cell = value => {
      let text = String(value ?? '');
      if (typeof value !== 'number' && /^[\s]*[=+@\-\t\r]/u.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    return '\uFEFF' + [result.headers, ...result.rows].map(row => row.map(cell).join(',')).join('\r\n');
  }
  return { simulate, toCSV };
});
