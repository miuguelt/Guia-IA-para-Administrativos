"""Pruebas offline y compuerta de funciones de los tableros de referencia del laboratorio."""
import ast
import importlib.util
import io
import json
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
CODE = ROOT / 'materiales/analisis-datos/codigo'
TARGET = CODE / 'analysis_dashboards.py'
sys.path.insert(0, str(CODE))
SPEC = importlib.util.spec_from_file_location('analysis_dashboards', TARGET)
BOARDS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BOARDS)
DATA = sys.modules['analysis_data']


class AnalysisDashboardTests(unittest.TestCase):
    covered = set()

    @classmethod
    def setUpClass(cls):
        cls.previous_profile = sys.getprofile()
        sys.setprofile(cls.record_calls)

    @staticmethod
    def record_calls(frame, event, arg):
        if event == 'call' and frame.f_code.co_filename == str(TARGET):
            AnalysisDashboardTests.covered.add((frame.f_code.co_name, frame.f_code.co_firstlineno))

    @classmethod
    def tearDownClass(cls):
        sys.setprofile(cls.previous_profile)
        tree = ast.parse(TARGET.read_text(encoding='utf-8'))
        expected = {(node.name if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) else '<lambda>', node.lineno)
                    for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda))}
        missing = expected - cls.covered
        if missing:
            raise AssertionError(f'Funciones sin ejecutar: {sorted(missing)}')
        print(f'Cobertura de funciones de analysis_dashboards.py: {len(expected)}/{len(expected)} (100 %).')

    def fixture_fetch(self, url):
        fixtures = {
            'exoplanetas': [
                dict(pl_name='A b', hostname='A', discoverymethod='Transit', pl_rade=2.0, pl_orbper=4.0, st_teff=5500, st_rad=1.0),
                dict(pl_name='B b', hostname='B', discoverymethod='Transit', pl_rade=3.0, pl_orbper=8.0, st_teff=None, st_rad=None)],
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
        for key, config in DATA.DATASETS.items():
            if config['url'] == url:
                return json.dumps(fixtures[key]).encode('utf-8')
        raise AssertionError(f'URL no prevista: {url}')

    def test_indicadores_de_los_tableros_coinciden_con_las_cifras_de_control(self):
        base = ROOT / 'materiales/analisis-datos'
        self.assertEqual(BOARDS.format_es(4332), '4.332')
        self.assertEqual(BOARDS.format_es(1816.08, 2), '1.816,08')
        expected = {
            'exoplanetas': [('Planetas', '4.332'), ('Anfitrionas únicas', '3.282'),
                            ('Mediana del radio', '2,39 R⊕'), ('Sin temperatura estelar', '110')],
            'sismos': [('Eventos', '133'), ('Magnitud máxima', '7,5'),
                       ('Mediana de profundidad', '10 km'), ('Tipos de magnitud', '4')],
            'clima': [('Días válidos', '366'), ('Temperatura media', '19,67 °C'),
                      ('Precipitación acumulada', '1.816,08 mm'), ('Días con lluvia ≥ 1 mm', '247')],
            'poblacion': [('Colombia', '+35,29 %'), ('Ecuador', '+42,92 %'), ('Perú', '+28,65 %'),
                          ('Población conjunta 2024', '105,24 millones')],
        }
        for name, kpis in expected.items():
            rows = DATA.read_csv(base / 'datos' / f'{name}.csv', name)
            self.assertEqual(BOARDS.dashboard_kpis(name, rows), kpis, name)
        self.assertEqual(BOARDS.document_kpis(base), [('Referencias del inventario', '10'), ('PDF incluidos', '3'),
                                                      ('Afirmaciones verificadas', '3'), ('Páginas revisadas', '49 de 293')])
        with self.assertRaises(ValueError):
            BOARDS.dashboard_kpis('otro', [])

    def test_tableros_de_referencia_se_generan_con_los_datos_del_paquete(self):
        with TemporaryDirectory() as folder:
            base = Path(folder)
            DATA.refresh(base, fetcher=self.fixture_fetch)
            boards = BOARDS.create_dashboards(base, base / 'tableros')
            self.assertEqual([file.name for file in boards], [f'tablero-{name}.png' for name in DATA.DATASETS])
            for file in boards:
                self.assertTrue(file.read_bytes().startswith(b'\x89PNG'))
                self.assertGreater(file.stat().st_size, 40_000)
            board = BOARDS.create_document_dashboard(ROOT / 'materiales/analisis-datos', base / 'tableros')
            self.assertEqual(board.name, 'tablero-documentos.png')
            self.assertTrue(board.read_bytes().startswith(b'\x89PNG'))
            with patch('sys.stdout', new_callable=io.StringIO) as output:
                self.assertEqual(BOARDS.main(['--base', str(base), '--salida', str(base / 'cli')]), 0)
                self.assertIn('tablero-sismos.png', output.getvalue())
                self.assertNotIn('tablero-documentos.png', output.getvalue())
            self.assertTrue((base / 'cli/tablero-clima.png').is_file())

    def test_dona_agrupa_sectores_minimos_sin_ocultar_sus_conteos(self):
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots()
        BOARDS.donut(ax, ['mww', 'mb', 'mwb', 'mwr'], [78, 53, 1, 1], 'Tipos')
        labels = [text.get_text() for text in ax.texts]
        plt.close(fig)
        self.assertEqual(len(labels), 3)
        self.assertTrue(any(label.startswith('Otros: mwb 1, mwr 1') for label in labels))


if __name__ == '__main__':
    unittest.main()
