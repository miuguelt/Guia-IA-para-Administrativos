"""Pruebas offline y compuerta de funciones del módulo de datos oficiales."""
import importlib.util
import ast
import inspect
import io
import json
import csv
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'materiales/analisis-datos/codigo/analysis_data.py'
SPEC = importlib.util.spec_from_file_location('analysis_data', TARGET)
DATA = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(DATA)


class AnalysisDataTests(unittest.TestCase):
    covered = set()

    @classmethod
    def setUpClass(cls):
        cls.previous_profile = sys.getprofile()
        sys.setprofile(cls.record_calls)

    @staticmethod
    def record_calls(frame, event, arg):
        if event == 'call' and frame.f_code.co_filename == str(TARGET):
            AnalysisDataTests.covered.add((frame.f_code.co_name, frame.f_code.co_firstlineno))

    @classmethod
    def tearDownClass(cls):
        sys.setprofile(cls.previous_profile)
        tree = ast.parse(TARGET.read_text(encoding='utf-8'))
        expected = {(node.name if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) else '<lambda>', node.lineno)
                    for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda))}
        missing = expected - cls.covered
        if missing:
            raise AssertionError(f'Funciones sin ejecutar: {sorted(missing)}')
        print(f'Cobertura de funciones de analysis_data.py: {len(expected)}/{len(expected)} (100 %).')

    def fixtures(self):
        return {
            'exoplanetas': [
                dict(pl_name='A b', hostname='A', discoverymethod='Transit', pl_rade=2.0,
                     pl_orbper=4.0, st_teff=5500, st_rad=1.0),
                dict(pl_name='B b', hostname='B', discoverymethod='Transit', pl_rade=3.0,
                     pl_orbper=8.0, st_teff=None, st_rad=None)],
            'poblacion': [{'page': 1, 'pages': 1, 'total': 2, 'lastupdated': '2026-10-08'}, [
                {'country': {'value': 'Colombia'}, 'countryiso3code': 'COL', 'date': '2000', 'value': 100},
                {'country': {'value': 'Colombia'}, 'countryiso3code': 'COL', 'date': '2024', 'value': 150}]],
            'clima': {'properties': {'parameter': {
                'T2M': {'20240228': 10.0, '20240229': 14.0},
                'PRECTOTCORR': {'20240228': 2.0, '20240229': -999.0}}},
                'header': {'fill_value': -999.0, 'time_standard': 'LST'},
                'geometry': {'coordinates': [-74.072, 4.711, 1790.38]}},
            'sismos': {'features': [
                {'id': 'a', 'properties': {'time': 1704067200000, 'mag': 5.0, 'magType': 'mw'},
                 'geometry': {'coordinates': [-74.0, 4.0, 10.0]}},
                {'id': 'b', 'properties': {'time': 1704153600000, 'mag': 6.0, 'magType': 'mb'},
                 'geometry': {'coordinates': [-75.0, 5.0, 20.0]}}]},
        }

    def fixture_fetch(self, url):
        for key, config in DATA.DATASETS.items():
            if config['url'] == url:
                return json.dumps(self.fixtures()[key]).encode('utf-8')
        raise AssertionError(f'URL no prevista: {url}')

    def test_contratos_publicados(self):
        self.assertEqual(set(DATA.DATASETS), {'exoplanetas', 'poblacion', 'clima', 'sismos'})
        self.assertEqual(DATA.DATASETS['clima']['fields'], ['fecha', 'temperatura_c', 'precipitacion_mm'])
        self.assertIn('default_flag', DATA.DATASETS['exoplanetas']['url'])
        self.assertNotIn('top+', DATA.DATASETS['exoplanetas']['url'].lower())

    def test_errores_orientan_al_aprendiz_con_el_tratamiento_de_tu(self):
        with self.assertRaisesRegex(ValueError, 'recorre todas las páginas'):
            DATA.normalize('poblacion', [{'pages': 2}, []])
        with self.assertRaisesRegex(ValueError, 'divide la consulta'):
            DATA.normalize('sismos', {'features': [None] * 20000})

    def test_numeros_faltantes_y_validacion(self):
        self.assertEqual(DATA.finite_number(0), 0)
        self.assertEqual(DATA.finite_number('2.5'), 2.5)
        self.assertEqual(DATA.finite_number(None, nullable=True), '')
        self.assertEqual(DATA.finite_number(-999, nullable=True, missing=-999), '')
        for invalid in [None, 'texto', float('nan'), float('inf'), True]:
            with self.assertRaises(ValueError):
                DATA.finite_number(invalid)

    def test_normalizacion_conserva_observaciones_y_unidades(self):
        fixtures = self.fixtures()
        planets = DATA.normalize('exoplanetas', fixtures['exoplanetas'])
        self.assertEqual(planets[0]['pl_rade'], 2)
        self.assertEqual(planets[1]['st_teff'], '')
        population = DATA.normalize('poblacion', fixtures['poblacion'])
        self.assertEqual(population[1], {'pais': 'Colombia', 'codigo': 'COL', 'anio': 2024, 'poblacion': 150})
        climate = DATA.normalize('clima', fixtures['clima'])
        self.assertEqual(climate[1]['fecha'], '2024-02-29')
        self.assertEqual(climate[1]['precipitacion_mm'], '')
        earthquakes = DATA.normalize('sismos', fixtures['sismos'])
        self.assertEqual(earthquakes[0]['longitud'], -74)
        self.assertEqual(earthquakes[0]['latitud'], 4)
        self.assertEqual(earthquakes[0]['fecha'], '2024-01-01T00:00:00Z')
        with self.assertRaises(ValueError):
            DATA.normalize('inventado', {})
        with self.assertRaises(ValueError):
            DATA.normalize('exoplanetas', [])
        with self.assertRaises(ValueError):
            DATA.normalize('exoplanetas', [fixtures['exoplanetas'][0]] * 2)
        fixtures['poblacion'][0]['pages'] = 2
        with self.assertRaises(ValueError):
            DATA.normalize('poblacion', fixtures['poblacion'])
        fixtures['clima']['header']['time_standard'] = 'UTC'
        with self.assertRaises(ValueError):
            DATA.normalize('clima', fixtures['clima'])

    def test_csv_codificacion_tipos_y_esquema(self):
        with TemporaryDirectory() as folder:
            path = Path(folder) / 'clima.csv'
            rows = DATA.normalize('clima', self.fixtures()['clima'])
            DATA.write_csv(path, DATA.DATASETS['clima']['fields'], rows)
            self.assertEqual(DATA.read_csv(path, 'clima'), rows)
            path.write_text('fecha,error\n2024-01-01,1\n', encoding='utf-8')
            with self.assertRaises(ValueError):
                DATA.read_csv(path, 'clima')

    def test_descarga_acotada_errores_y_sin_red_en_suite(self):
        observed = []
        def opener(request, timeout):
            observed.append((request.full_url, timeout))
            return io.BytesIO(b'{"value": 42}')
        self.assertEqual(DATA.fetch_bytes('https://example.org/data', opener=opener), b'{"value": 42}')
        self.assertEqual(observed[0][0], 'https://example.org/data')
        with self.assertRaises(ValueError):
            DATA.fetch_bytes('http://example.org', opener=opener)
        with self.assertRaisesRegex(ValueError, 'reduce la consulta'):
            DATA.fetch_bytes('https://example.org', opener=opener, max_bytes=5)
        with self.assertRaises(OSError):
            DATA.fetch_bytes('https://example.org', opener=lambda *a, **k: (_ for _ in ()).throw(OSError('sin red')))

    def test_preparacion_refresco_integridad_y_manifiesto(self):
        with TemporaryDirectory() as folder:
            base = Path(folder)
            item = DATA.prepare_dataset('clima', self.fixture_fetch(DATA.DATASETS['clima']['url']), base, '2026-10-18T12:00:00Z')
            self.assertEqual(item['filas'], 2)
            self.assertEqual(item['metadatos']['time_standard'], 'LST')
            manifest = DATA.refresh(base, fetcher=self.fixture_fetch)
            self.assertEqual(len(manifest['datasets']), 4)
            self.assertTrue((base / 'diccionario.csv').is_file())
            self.assertEqual(DATA.validate_bundle(base)['filas']['poblacion'], 2)
            raw = base / 'datos/clima.csv'
            raw.write_text(raw.read_text(encoding='utf-8') + '\n', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'SHA256'):
                DATA.validate_bundle(base)

    def test_resumenes_tienen_calculos_verificables(self):
        fixtures = self.fixtures()
        planets = DATA.summarize('exoplanetas', DATA.normalize('exoplanetas', fixtures['exoplanetas']))
        self.assertEqual(planets['mediana_radio_terrestre'], 2.5)
        self.assertEqual(planets['anfitrionas_unicas'], 2)
        population = DATA.summarize('poblacion', DATA.normalize('poblacion', fixtures['poblacion']))
        self.assertEqual(population['paises']['COL']['cambio_porcentual'], 50)
        climate = DATA.summarize('clima', DATA.normalize('clima', fixtures['clima']))
        self.assertEqual(climate['temperatura_media_c'], 12)
        self.assertEqual(climate['precipitacion_total_disponible_mm'], 2)
        self.assertEqual(climate['dias_sin_precipitacion'], 1)
        earthquakes = DATA.summarize('sismos', DATA.normalize('sismos', fixtures['sismos']))
        self.assertEqual(earthquakes['magnitud_maxima'], 6)
        self.assertEqual(earthquakes['mediana_profundidad_km'], 15)
        with self.assertRaises(ValueError):
            DATA.summarize('otro', [])
        with self.assertRaises(ValueError):
            DATA.summarize('clima', [])

    def test_analisis_figuras_y_cli(self):
        with TemporaryDirectory() as folder:
            base = Path(folder)
            DATA.refresh(base, fetcher=self.fixture_fetch)
            result = DATA.analyze(base, base / 'salida')
            self.assertEqual(result['clima']['temperatura_media_c'], 12)
            self.assertEqual(json.loads((base / 'salida/resumen.json').read_text(encoding='utf-8')), result)
            figures = DATA.create_figures(base, base / 'figuras')
            self.assertEqual(len(figures), 4)
            for file in figures:
                self.assertTrue(file.read_bytes().startswith(b'\x89PNG'))
                self.assertIn('<svg', file.with_suffix('.svg').read_text(encoding='utf-8'))
            with patch('sys.stdout', new_callable=io.StringIO) as output:
                self.assertEqual(DATA.main(['validar', '--base', str(base)]), 0)
                self.assertIn('poblacion', output.getvalue())
                self.assertEqual(DATA.main(['analizar', '--base', str(base), '--salida', str(base/'cli')]), 0)
                self.assertEqual(DATA.main(['figuras', '--base', str(base), '--salida', str(base/'cli')]), 0)
                with patch.object(DATA, 'fetch_bytes', side_effect=self.fixture_fetch):
                    self.assertEqual(DATA.main(['refrescar', '--base', str(base)]), 0)

    def test_archivos_reales_y_notebooks_ejecutables(self):
        base = ROOT / 'materiales/analisis-datos'
        report = DATA.validate_bundle(base)
        self.assertEqual(report['filas']['poblacion'], 75)
        self.assertEqual(report['filas']['clima'], 366)
        self.assertGreater(report['filas']['exoplanetas'], 100)
        self.assertGreater(report['filas']['sismos'], 10)
        for number, name in enumerate(DATA.DATASETS, 1):
            notebook = json.loads((base / 'cuadernos' / f'{number:02}-{name}.ipynb').read_text(encoding='utf-8'))
            self.assertEqual(notebook['nbformat'], 4)
            scope = {'BASE_MODULO': base, 'MOSTRAR_FIGURAS': False}
            with patch('sys.stdout', new_callable=io.StringIO), patch.object(DATA, 'fetch_bytes', side_effect=AssertionError('red prohibida')):
                for cell in notebook['cells']:
                    if cell['cell_type'] == 'code':
                        exec(compile(''.join(cell['source']), f'{name}.ipynb', 'exec'), scope)
            self.assertEqual(scope['resultado']['filas'], report['filas'][name])

    def test_dane_piramide_extrae_edades_y_reconcilia_totales(self):
        header = ['DP', 'DPNOM', 'AÑO', 'ÁREA GEOGRÁFICA', 'Total', 'Hombres', 'Mujeres',
                  'Hombres 0 años', 'Hombres 1 año', 'Mujeres 0 años', 'Mujeres 1 año']
        source = ['68', 'Santander', 2024, 'Total', 100, 45, 55, 20, 25, 30, 25]
        rows = DATA.normalize_dane(header, source)
        self.assertEqual(rows, [{'edad': 0, 'hombres': 20, 'mujeres': 30}, {'edad': 1, 'hombres': 25, 'mujeres': 25}])
        source[4] = 101
        with self.assertRaises(ValueError):
            DATA.normalize_dane(header, source)
        source[4] = 100
        with TemporaryDirectory() as folder:
            base = Path(folder)
            DATA.refresh(base, fetcher=self.fixture_fetch)
            class Sheet:
                def iter_rows(self, min_row=1, max_row=None, values_only=False):
                    return iter([header] if min_row == 9 else [source])
            class Workbook:
                def __getitem__(self, key):
                    return Sheet()
                def close(self):
                    pass
            item = DATA.refresh_dane(base, fetcher=lambda url: b'fixture-xlsx', workbook_loader=lambda stream, **kwargs: Workbook())
            self.assertEqual(item['total'], 100)
            self.assertFalse(any((base/'originales').glob('*.xlsx')))
            self.assertEqual(DATA.validate_dane(base)['total'], 100)
            DATA.refresh(base, fetcher=self.fixture_fetch)
            self.assertEqual(DATA.validate_dane(base)['total'], 100)
            with (base/'diccionario.csv').open(encoding='utf-8-sig', newline='') as handle:
                dictionary = list(csv.DictReader(handle))
            extension = [row for row in dictionary if row['conjunto'] == 'dane_santander']
            self.assertEqual([row['columna'] for row in extension], ['edad', 'hombres', 'mujeres'])
            self.assertEqual(extension[1]['unidad'], 'personas')
            self.assertIn('100 años y más', extension[0]['unidad'])
            picture = DATA.create_pyramid(base, base/'piramide')
            self.assertTrue(picture.read_bytes().startswith(b'\x89PNG'))
            self.assertIn('Hombres', picture.with_suffix('.svg').read_text(encoding='utf-8'))
        real = DATA.validate_dane(ROOT/'materiales/analisis-datos')
        self.assertEqual(real['total'], 2380650)
        self.assertEqual(real['hombres'], 1168768)
        self.assertEqual(real['mujeres'], 1211882)


if __name__ == '__main__':
    unittest.main()
