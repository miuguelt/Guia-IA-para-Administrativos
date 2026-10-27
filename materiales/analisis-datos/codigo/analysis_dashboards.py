"""Tableros de referencia del laboratorio: indicadores y gráficos con los datos incluidos.

Uso sin conexión:
    python codigo/analysis_dashboards.py --base . --salida codigo/resultados
"""
import argparse
import csv
from datetime import datetime
import json
import math
from pathlib import Path
import statistics

from analysis_data import BASE, DATASETS, read_csv, summarize, validate_bundle


PALETTE = ('#156b8a', '#c07a1a', '#75439a', '#3b7d4f', '#5b6770')
BOARD_TITLES = {
    'exoplanetas': ('Exoplanetas detectados por tránsito', 'NASA Exoplanet Archive · descubrimientos hasta 2024 · una fila por planeta'),
    'poblacion': ('Población de Colombia, Ecuador y Perú', 'Banco Mundial · SP.POP.TOTL · 2000–2024 · estimaciones publicadas'),
    'clima': ('Temperatura y precipitación diarias en 2024', 'NASA POWER · celda de rejilla cercana a Bogotá · hora solar local'),
    'sismos': ('Sismos de magnitud 5 o mayor en enero de 2024', 'USGS · catálogo global · fechas UTC · no predice eventos'),
}


def format_es(value, decimals=0):
    """Escribe cifras con punto de miles y coma decimal, como en la guía."""
    return f'{value:,.{decimals}f}'.replace(',', '_').replace('.', ',').replace('_', '.')


def dashboard_kpis(name, rows):
    """Resume cada conjunto en los indicadores que encabezan su tablero."""
    summary = summarize(name, rows)
    if name == 'exoplanetas':
        return [('Planetas', format_es(summary['filas'])),
                ('Anfitrionas únicas', format_es(summary['anfitrionas_unicas'])),
                ('Mediana del radio', format_es(summary['mediana_radio_terrestre'], 2) + ' R⊕'),
                ('Sin temperatura estelar', format_es(summary['planetas_sin_temperatura_estelar']))]
    if name == 'sismos':
        return [('Eventos', format_es(summary['filas'])),
                ('Magnitud máxima', format_es(summary['magnitud_maxima'], 1)),
                ('Mediana de profundidad', format_es(summary['mediana_profundidad_km']) + ' km'),
                ('Tipos de magnitud', format_es(len(summary['tipos_magnitud'])))]
    if name == 'clima':
        valid = len(rows) - max(summary['dias_sin_temperatura'], summary['dias_sin_precipitacion'])
        rainy = sum(row['precipitacion_mm'] != '' and row['precipitacion_mm'] >= 1 for row in rows)
        return [('Días válidos', format_es(valid)),
                ('Temperatura media', format_es(summary['temperatura_media_c'], 2) + ' °C'),
                ('Precipitación acumulada', format_es(summary['precipitacion_total_disponible_mm'], 2) + ' mm'),
                ('Días con lluvia ≥ 1 mm', format_es(rainy))]
    countries = [item for item in summary['paises'].values() if 'pais' in item]
    order = {'Colombia': 0, 'Ecuador': 1, 'Perú': 2}
    countries.sort(key=lambda item: order.get(item['pais'], 3))
    kpis = [(item['pais'], f"+{format_es(item['cambio_porcentual'], 2)} %") for item in countries]
    total = sum(item['poblacion_final'] for item in countries)
    return kpis + [(f"Población conjunta {countries[0]['anio_final']}", format_es(total / 1e6, 2) + ' millones')]


def read_documents(base=BASE):
    """Lee el manifiesto documental y la matriz verificada del laboratorio."""
    folder = Path(base) / 'documentos'
    with (folder / 'manifiesto.csv').open(encoding='utf-8-sig', newline='') as handle:
        manifest = list(csv.DictReader(handle))
    with (folder / 'ejemplo-verificado.csv').open(encoding='utf-8-sig', newline='') as handle:
        verified = list(csv.DictReader(handle))
    return manifest, verified


def document_kpis(base=BASE):
    """Cuenta referencias, archivos incluidos, citas verificadas y cobertura de páginas."""
    manifest, verified = read_documents(base)
    reviewed = sum(int(row['paginas_revisadas'] or 0) for row in manifest)
    total = sum(int(row['paginas']) for row in manifest)
    return [('Referencias del inventario', format_es(len(manifest))),
            ('PDF incluidos', format_es(sum(bool(row['archivo_incluido']) for row in manifest))),
            ('Afirmaciones verificadas', format_es(len(verified))),
            ('Páginas revisadas', f'{format_es(reviewed)} de {format_es(total)}')]


def dashboard_canvas(title, subtitle, kpis, left=.05, wspace=.55):
    """Prepara la composición común: encabezado, fila de indicadores y cuatro paneles."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.patches import FancyBboxPatch
    plt.rcParams.update({'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False,
                         'axes.titlesize': 11.5, 'axes.titleweight': 'bold', 'axes.titlelocation': 'left',
                         'axes.edgecolor': '#9aa5ae', 'axes.labelcolor': '#33404a', 'xtick.color': '#33404a',
                         'ytick.color': '#33404a', 'svg.fonttype': 'none'})
    fig = plt.figure(figsize=(15, 10.4), facecolor='#f4f6f8')
    grid = fig.add_gridspec(3, len(kpis) * 2, height_ratios=[.42, 1, 1], left=left, right=.97, top=.86,
                            bottom=.085, hspace=.42, wspace=wspace)
    fig.text(.05, .955, title, fontsize=19, fontweight='bold', color='#1d2a33')
    fig.text(.05, .92, subtitle, fontsize=11, color='#5b6770')
    for index, (label, value) in enumerate(kpis):
        tile = fig.add_subplot(grid[0, index * 2:index * 2 + 2])
        tile.set_axis_off()
        tile.add_patch(FancyBboxPatch((0, 0), 1, 1, boxstyle='round,pad=0,rounding_size=.08',
                                      transform=tile.transAxes, facecolor='white', edgecolor='#d5dce2'))
        tile.add_patch(FancyBboxPatch((0, 0), .025, 1, boxstyle='square,pad=0', transform=tile.transAxes,
                                      facecolor=PALETTE[index % len(PALETTE)], edgecolor='none'))
        tile.text(.09, .66, label, transform=tile.transAxes, fontsize=10.5, color='#5b6770')
        tile.text(.09, .24, value, transform=tile.transAxes, fontsize=19, fontweight='bold', color='#1d2a33')
    half = len(kpis)
    slots = [grid[1, :half], grid[1, half:], grid[2, :half], grid[2, half:]]
    return plt, fig, slots


def finish_board(plt, fig, target, note):
    """Agrega la nota de procedencia y guarda la imagen de referencia."""
    for ax in fig.axes:
        if ax.get_title() and getattr(ax, 'name', '') != '3d':
            ax.set_facecolor('white')
            ax.grid(alpha=.18)
    fig.text(.05, .016, note, fontsize=9, color='#5b6770')
    fig.savefig(target, dpi=110, facecolor=fig.get_facecolor())
    plt.close(fig)
    return target


def panel_title(fig, slot, text):
    """Escribe el título de un panel 3D en el borde izquierdo de su espacio."""
    box = slot.get_position(fig)
    fig.text(box.x0, box.y1 + .012, text, fontsize=11.5, fontweight='bold', color='#1d2a33')


def donut(ax, labels, values, title):
    """Dibuja una dona con porcentaje y conteo escritos junto a cada sector."""
    total = sum(values)
    small = [(label, value) for label, value in zip(labels, values) if value / total < .03]
    if len(small) > 1:
        kept = [(label, value) for label, value in zip(labels, values) if value / total >= .03]
        labels = [label for label, _ in kept] + ['Otros: ' + ', '.join(f'{label} {value}' for label, value in small)]
        values = [value for _, value in kept] + [sum(value for _, value in small)]
    ax.pie(values, colors=PALETTE[:len(values)], startangle=90, counterclock=False,
           wedgeprops={'width': .38, 'edgecolor': 'white'},
           labels=[f'{label}\n{format_es(value)} · {format_es(value / total * 100, 1)} %' for label, value in zip(labels, values)],
           textprops={'fontsize': 9, 'color': '#33404a'})
    ax.set_title(title)
    ax.set_aspect('equal')


def board_planets(plt, fig, slots, rows):
    """Distribución de radios, relación con el periodo, categorías y vista 3D estelar."""
    radios = [row['pl_rade'] for row in rows]
    low, high = math.log10(min(radios)), math.log10(max(radios))
    edges = [10 ** (low + (high - low) * step / 30) for step in range(31)] if high > low else [min(radios) * .9, max(radios) * 1.1]
    ax = fig.add_subplot(slots[0])
    ax.hist(radios, bins=edges, color=PALETTE[0], edgecolor='white')
    ax.set(xscale='log', xlabel='Radio (radios terrestres, escala logarítmica)', ylabel='Planetas',
           title='¿Cómo se reparten los tamaños?')
    ax = fig.add_subplot(slots[1])
    ax.scatter([row['pl_orbper'] for row in rows], radios, s=7, alpha=.35, color=PALETTE[2], linewidths=0)
    ax.set(xscale='log', yscale='log', xlabel='Periodo orbital (días)', ylabel='Radio (radios terrestres)',
           title='Periodo frente a radio (log-log)')
    categories = [('Tamaño Tierra (<1,25)', 0, 1.25), ('Supertierra (1,25–2)', 1.25, 2),
                  ('Subneptuno (2–6)', 2, 6), ('Gigante (6–15)', 6, 15), ('Supergigante (≥15)', 15, math.inf)]
    counts = [(label, sum(start <= value < end for value in radios)) for label, start, end in categories]
    counts = [item for item in counts if item[1]]
    donut(fig.add_subplot(slots[2]), [item[0] for item in counts], [item[1] for item in counts],
          'Categorías de tamaño (umbrales propios)')
    stellar = [row for row in rows if row['st_teff'] != '']
    ax = fig.add_subplot(slots[3], projection='3d')
    points = ax.scatter([math.log10(row['pl_orbper']) for row in stellar], [math.log10(row['pl_rade']) for row in stellar],
                        [row['st_teff'] for row in stellar], c=[row['st_teff'] for row in stellar], cmap='plasma', s=5, alpha=.6)
    fig.colorbar(points, ax=ax, shrink=.7, pad=.1, label='Temperatura estelar (K)')
    ax.set(xlabel='log₁₀ periodo (días)', ylabel='log₁₀ radio (R⊕)', zlabel='')
    ax.set_box_aspect(None, zoom=1.15)
    panel_title(fig, slots[3], f'Vista 3D: periodo, radio y temperatura ({format_es(len(rows) - len(stellar))} filas sin dato excluidas)')
    ax.view_init(elev=22, azim=-58)


def board_quakes(plt, fig, slots, rows):
    """Globo, conteo diario, tipos de magnitud y corte 3D de profundidad."""
    ax = fig.add_subplot(slots[0], projection='3d')
    steps = range(0, 361, 15)
    for lat in range(-60, 61, 30):
        ax.plot([math.cos(math.radians(lat)) * math.cos(math.radians(lon)) for lon in steps],
                [math.cos(math.radians(lat)) * math.sin(math.radians(lon)) for lon in steps],
                [math.sin(math.radians(lat))] * len(steps), color='#c8d1d8', linewidth=.6)
    for lon in range(0, 360, 30):
        ax.plot([math.cos(math.radians(lat)) * math.cos(math.radians(lon)) for lat in range(-90, 91, 10)],
                [math.cos(math.radians(lat)) * math.sin(math.radians(lon)) for lat in range(-90, 91, 10)],
                [math.sin(math.radians(lat)) for lat in range(-90, 91, 10)], color='#c8d1d8', linewidth=.6)
    globe = ax.scatter([math.cos(math.radians(row['latitud'])) * math.cos(math.radians(row['longitud'])) for row in rows],
                       [math.cos(math.radians(row['latitud'])) * math.sin(math.radians(row['longitud'])) for row in rows],
                       [math.sin(math.radians(row['latitud'])) for row in rows],
                       s=[(row['magnitud'] - 4.5) ** 2 * 14 for row in rows], c=[row['profundidad_km'] for row in rows],
                       cmap='viridis_r', alpha=.85, edgecolors='white', linewidths=.3)
    fig.colorbar(globe, ax=ax, shrink=.6, pad=.02, label='Profundidad (km)')
    ax.set_axis_off()
    ax.set_box_aspect((1, 1, 1), zoom=1.45)
    ax.view_init(elev=8, azim=170)
    panel_title(fig, slots[0], 'Globo: tamaño según magnitud, color según profundidad')
    days = {f'2024-01-{day:02}': 0 for day in range(1, 32)}
    for row in rows:
        if row['fecha'][:10] in days:
            days[row['fecha'][:10]] += 1
    ax = fig.add_subplot(slots[1])
    ax.bar(range(1, 32), list(days.values()), color=PALETTE[0])
    ax.set(xlabel='Día de enero de 2024 (UTC)', ylabel='Eventos', title='Conteo diario, con los días sin eventos en cero', xlim=(0, 32))
    types = {}
    for row in rows:
        types[row['tipo_magnitud']] = types.get(row['tipo_magnitud'], 0) + 1
    ordered = sorted(types.items(), key=lambda item: -item[1])
    donut(fig.add_subplot(slots[2]), [item[0] for item in ordered], [item[1] for item in ordered], 'Eventos por tipo_magnitud')
    ax = fig.add_subplot(slots[3], projection='3d')
    ax.scatter([row['longitud'] for row in rows], [row['latitud'] for row in rows], [-row['profundidad_km'] for row in rows],
               c=[row['profundidad_km'] for row in rows], cmap='viridis_r', s=[(row['magnitud'] - 4.5) ** 2 * 10 for row in rows],
               alpha=.85, edgecolors='white', linewidths=.3)
    ax.set(xlabel='Longitud (°)', ylabel='Latitud (°)', zlabel='Profundidad (km)', xlim=(-180, 180), ylim=(-90, 90))
    ax.set_box_aspect((2, 1.2, 1), zoom=1.2)
    panel_title(fig, slots[3], 'Vista 3D de profundidad · grados y km no comparten escala')
    ax.view_init(elev=18, azim=-70)


def board_climate(plt, fig, slots, rows):
    """Climograma en paneles separados, calendario, caja por mes y días con lluvia."""
    rows = sorted(rows, key=lambda row: row['fecha'])
    months = list(range(1, 13))
    names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    by_month = {month: [row for row in rows if int(row['fecha'][5:7]) == month] for month in months}
    rain = [math.fsum(row['precipitacion_mm'] for row in by_month[month] if row['precipitacion_mm'] != '') for month in months]
    temps = [[row['temperatura_c'] for row in by_month[month] if row['temperatura_c'] != ''] for month in months]
    inner = slots[0].subgridspec(2, 1, hspace=.12)
    top = fig.add_subplot(inner[0])
    top.bar(months, rain, color=PALETTE[0])
    top.set(ylabel='Lluvia (mm)', xticks=months)
    top.tick_params(labelbottom=False)
    top.set_title('Climograma: lluvia acumulada y temperatura media por mes (sin eje doble)')
    bottom = fig.add_subplot(inner[1], sharex=top)
    bottom.plot(months, [statistics.mean(values) if values else math.nan for values in temps], marker='o', color=PALETTE[1])
    bottom.set(ylabel='Temperatura (°C)', xticks=months)
    bottom.set_xticklabels(names)
    bottom.set_facecolor('white')
    bottom.grid(alpha=.18)
    first = datetime.fromisoformat(rows[0]['fecha'])
    weeks = (datetime.fromisoformat(rows[-1]['fecha']) - first).days // 7 + 2
    calendar = [[math.nan] * weeks for _ in range(7)]
    offset = first.weekday()
    for row in rows:
        position = (datetime.fromisoformat(row['fecha']) - first).days + offset
        calendar[position % 7][position // 7] = math.nan if row['temperatura_c'] == '' else row['temperatura_c']
    ax = fig.add_subplot(slots[1])
    cells = ax.imshow(calendar, aspect='auto', cmap='YlOrRd', interpolation='nearest')
    fig.colorbar(cells, ax=ax, shrink=.85, label='Temperatura media diaria (°C)')
    ax.set(yticks=range(7), yticklabels=['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], xlabel='Semana del año',
           title='Calendario de temperatura: un cuadro por día')
    ax.grid(False)
    ax = fig.add_subplot(slots[2])
    present = [month for month in months if temps[month - 1]]
    ax.boxplot([temps[month - 1] for month in present], positions=present, widths=.55, patch_artist=True,
               boxprops={'facecolor': '#d6e7ee', 'edgecolor': PALETTE[0]}, medianprops={'color': PALETTE[1]})
    ax.set(xticks=months, xticklabels=names, ylabel='Temperatura diaria (°C)', title='Variación de la temperatura dentro de cada mes')
    rainy = sum(row['precipitacion_mm'] != '' and row['precipitacion_mm'] >= 1 for row in rows)
    measured = sum(row['precipitacion_mm'] != '' for row in rows)
    donut(fig.add_subplot(slots[3]), ['Con lluvia ≥ 1 mm', 'Menos de 1 mm'], [rainy, measured - rainy],
          'Días con lluvia (umbral de 1 mm, convención propia)')


def board_population(plt, fig, slots, rows):
    """Tamaño, índice con base común, cambio porcentual y participación final."""
    series = {}
    for code in ('COL', 'ECU', 'PER'):
        values = sorted((row for row in rows if row['codigo'] == code and row['poblacion'] != ''), key=lambda row: row['anio'])
        if values:
            series[values[0]['pais']] = values
    colors = dict(zip(series, PALETTE))
    ax = fig.add_subplot(slots[0])
    for country, values in series.items():
        ax.plot([row['anio'] for row in values], [row['poblacion'] / 1e6 for row in values], color=colors[country], linewidth=2.2)
        ax.annotate(country, (values[-1]['anio'], values[-1]['poblacion'] / 1e6), xytext=(4, 0), textcoords='offset points',
                    color=colors[country], fontweight='bold', va='center')
    ax.set(xlabel='Año', ylabel='Población (millones)', title='Tamaño de la población')
    ax = fig.add_subplot(slots[1])
    for country, values in series.items():
        ax.plot([row['anio'] for row in values], [row['poblacion'] / values[0]['poblacion'] * 100 for row in values],
                color=colors[country], linewidth=2.2, label=country)
    ax.axhline(100, color='#9aa5ae', linewidth=.8)
    ax.set(xlabel='Año', ylabel='Índice (primer año = 100)', title='Crecimiento comparado: índice base 2000 = 100')
    ax.legend(frameon=False)
    ax = fig.add_subplot(slots[2])
    changes = [(values[-1]['poblacion'] / values[0]['poblacion'] - 1) * 100 for values in series.values()]
    bars = ax.barh(list(series), changes, color=[colors[country] for country in series])
    ax.bar_label(bars, labels=[f'{format_es(value, 2)} %' for value in changes], padding=4)
    ax.set(xlabel='Cambio porcentual entre extremos (%)', title='Cambio porcentual: 100 × (final / inicial − 1)')
    ax.invert_yaxis()
    donut(fig.add_subplot(slots[3]), list(series), [values[-1]['poblacion'] for values in series.values()],
          'Participación en la población conjunta del último año')


def create_dashboards(base=BASE, output=None):
    """Genera un tablero de referencia por conjunto, con las cifras de control visibles."""
    base = Path(base)
    validate_bundle(base)
    output = Path(output) if output is not None else base / 'codigo/resultados'
    output.mkdir(parents=True, exist_ok=True)
    builders = {'exoplanetas': board_planets, 'poblacion': board_population, 'clima': board_climate, 'sismos': board_quakes}
    paths = []
    for name in DATASETS:
        rows = read_csv(base / 'datos' / f'{name}.csv', name)
        plt, fig, slots = dashboard_canvas(*BOARD_TITLES[name], dashboard_kpis(name, rows))
        builders[name](plt, fig, slots, rows)
        note = f"Fuente: {DATASETS[name]['documentation']} · Datos: datos/{name}.csv · Filtros, fecha y unidades en fuentes.json"
        paths.append(finish_board(plt, fig, output / f'tablero-{name}.png', note))
    return paths


def create_document_dashboard(base=BASE, output=None):
    """Muestra cobertura documental con los estados del manifiesto, sin suponer lecturas."""
    base = Path(base)
    output = Path(output) if output is not None else base / 'codigo/resultados'
    output.mkdir(parents=True, exist_ok=True)
    manifest, verified = read_documents(base)
    plt, fig, slots = dashboard_canvas('Cobertura de un conjunto de diez documentos',
                                       'DANE y NASA NTRS · manifiesto del laboratorio · lectura con páginas localizables',
                                       document_kpis(base), left=.11)
    ids = [row['id'] for row in manifest]
    reviewed = [int(row['paginas_revisadas'] or 0) for row in manifest]
    pages = [int(row['paginas']) for row in manifest]
    ax = fig.add_subplot(slots[0])
    ax.barh(ids, reviewed, color=PALETTE[0], label='Páginas revisadas')
    ax.barh(ids, [total - done for total, done in zip(pages, reviewed)], left=reviewed, color='#d5dce2', label='Pendientes')
    ax.set(xlabel='Páginas del PDF', title='Páginas revisadas frente al total de cada documento')
    ax.invert_yaxis()
    ax.legend(frameon=False, loc='center right')
    cited = {row['id_documento'] for row in verified}
    checks = [('PDF en el paquete', 'No, enlace', lambda row: bool(row['archivo_incluido'])),
              ('Páginas revisadas', 'Pendiente', lambda row: bool(row['paginas_revisadas'])),
              ('Afirmación verificada', 'Pendiente', lambda row: row['id'] in cited),
              ('Revisión completa', 'No', lambda row: row['revision_completa'] == 'Sí')]
    matrix = [[1 if check(row) else 0 for _, _, check in checks] for row in manifest]
    ax = fig.add_subplot(slots[1])
    ax.imshow(matrix, cmap='Blues', vmin=-.4, vmax=1.4, aspect='auto')
    for y, line in enumerate(matrix):
        for x, value in enumerate(line):
            ax.text(x, y, 'Sí' if value else checks[x][1], ha='center', va='center', fontsize=8.5,
                    color='white' if value else '#33404a')
    ax.set(xticks=range(len(checks)), yticks=range(len(ids)), title='Mapa de estado (mismas filas que el panel izquierdo)')
    ax.set_xticklabels([label for label, _, _ in checks], fontsize=9)
    ax.set_yticklabels([])
    ax.grid(False)
    total_reviewed = sum(reviewed)
    donut(fig.add_subplot(slots[2]), ['Revisadas', 'Sin revisar'], [total_reviewed, sum(pages) - total_reviewed],
          'Cobertura de páginas del conjunto')
    agencies = sorted({row['organismo'] for row in manifest})
    ax = fig.add_subplot(slots[3])
    documents = [sum(row['organismo'] == agency for row in manifest) for agency in agencies]
    bars = ax.bar(agencies, [sum(int(row['paginas']) for row in manifest if row['organismo'] == agency) for agency in agencies],
                  color=PALETTE[:len(agencies)])
    ax.bar_label(bars, labels=[f'{count} documentos' for count in documents], padding=3)
    ax.margins(y=.14)
    ax.set(ylabel='Páginas', title='Páginas por organismo')
    return finish_board(plt, fig, output / 'tablero-documentos.png',
                        'Fuente: documentos/manifiesto.csv y documentos/ejemplo-verificado.csv · «Pendiente» no significa que el contenido no exista.')


def main(argv=None):
    """Genera los cuatro tableros de datos y, si existe el manifiesto, el documental."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', type=Path, default=BASE)
    parser.add_argument('--salida', type=Path)
    args = parser.parse_args(argv)
    boards = create_dashboards(args.base, args.salida)
    if (Path(args.base) / 'documentos/manifiesto.csv').is_file():
        boards.append(create_document_dashboard(args.base, args.salida))
    print(json.dumps([str(path) for path in boards], ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
