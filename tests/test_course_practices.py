"""Fuentes, composición y cobertura verificable del constructor de prácticas."""
import csv
import importlib.util
import inspect
import json
import shutil
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('course_practices_target', ROOT / 'scripts/course_practices.py')
PRACTICES = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PRACTICES)


class PracticeTests(unittest.TestCase):
    covered = set()

    def call(self, name, *args):
        result = getattr(PRACTICES, name)(*args)
        self.covered.add(name)
        return result

    def test_extractos_conservan_las_filas_y_campos_exactos(self):
        cases = json.loads((ROOT / 'content/case-practices.json').read_text(encoding='utf-8'))
        for case in cases.values():
            records = self.call('source_records', case['sources'])
            for record in records:
                with (ROOT / 'materiales/retos' / record['file']).open(encoding='utf-8-sig', newline='') as stream:
                    rows = list(csv.reader(stream, delimiter=';'))
                self.assertEqual(record['fields'], list(zip(rows[3], rows[record['row'] - 1])))
        rows = self.call('source_records', cases['m03-implementacion']['sources'])
        self.assertEqual([row['row'] for row in rows], [5, 6, 7, 16, 23])
        self.assertEqual(rows[1]['fields'][4][1], 'FINALIZADO ')
        self.assertEqual(rows[2]['fields'][4][1], '')
        rate = self.call('source_records', cases['m04-validacion']['sources'])[0]
        self.assertEqual([value for _, value in rate['fields']][1:3], ['840', '42'])
        contracts = self.call('source_records', cases['m05-cierre']['sources'])
        self.assertEqual(int(contracts[0]['fields'][5][1]) - int(contracts[0]['fields'][4][1]), 1250000)
        self.assertEqual(contracts[1]['fields'][1][1], 'Centro A')

    def test_controles_y_datos_comparten_identificadores_y_escapan_texto(self):
        cases = json.loads((ROOT / 'content/case-practices.json').read_text(encoding='utf-8'))
        for module in cases:
            output = self.call('practice_html', module, '<button data-cleaner-transfer>Transferir</button>', '<p>Solución con fuente.</p>', '')
            soup = BeautifulSoup(output, 'html.parser')
            data = json.loads(soup.select_one('[data-case-spec]').string)
            self.assertEqual(len(soup.select('[data-case-stage]')), 4)
            self.assertFalse(soup.select('[data-cleaner-transfer]'))
            for question in data['questions']:
                form = soup.select_one(f'[data-case-question="{question["id"]}"]')
                self.assertEqual(form.legend.get_text(), question['prompt'])
                self.assertTrue(form.select_one('[data-case-feedback][role="status"]'))
        q = {'id': 'seguro', 'prompt': '<script> & una decisión', 'hint': '<img>', 'type': 'choice', 'options': [('x', '<img>')], 'expected': 'x'}
        output = self.call('question_html', 'prueba', q)
        soup = BeautifulSoup(output, 'html.parser')
        self.assertFalse(soup.select('script,img'))
        self.assertEqual(soup.legend.get_text(), q['prompt'])
        self.assertEqual(self.call('pending_prompt', {'type': 'rate'}), "Completa el cálculo y comprueba tu respuesta.")
        self.assertEqual(self.call('pending_prompt', {'type': 'choice'}), "Elige una opción y comprueba tu respuesta.")

    def test_web_conserva_lectura_sin_javascript_y_separa_compilacion_documental(self):
        soup = BeautifulSoup((ROOT / 'index.html').read_text(encoding='utf-8'), 'html.parser')
        for practice in soup.select('[data-simulator="case-practice"]'):
            self.assertTrue(all(not stage.has_attr('hidden') for stage in practice.select('[data-case-stage]')))
            self.assertTrue(practice.select_one('[data-case-solution] [data-ai-cycle]'))
            self.assertEqual(len(practice.select('[data-knowledge-check]')), 2)
        scripts = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['scripts']
        self.assertNotIn('--format-downloads', scripts['build'])
        self.assertIn('--format-downloads', scripts['build:documents'])

    def test_revision_cambia_solo_si_cambia_el_caso_o_su_fuente(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'content').mkdir()
            shutil.copy2(ROOT / 'content/case-practices.json', root / 'content/case-practices.json')
            shutil.copytree(ROOT / 'materiales/retos', root / 'materiales/retos')
            def revision(module):
                page = BeautifulSoup(self.call('practice_html', module, '', '', '', root), 'html.parser')
                return json.loads(page.select_one('[data-case-spec]').string)['revision']
            before = revision('m01-fundamentos')
            other = revision('m02-diseno')
            source = root / 'materiales/retos/reto-01-solicitud-urgente.csv'
            source.write_text(source.read_text(encoding='utf-8').replace('18 personas', '19 personas'), encoding='utf-8')
            self.assertNotEqual(revision('m01-fundamentos'), before)
            self.assertEqual(revision('m02-diseno'), other)

    def test_z_todas_las_funciones_del_constructor_tienen_aserciones(self):
        functions = {name for name, value in vars(PRACTICES).items() if inspect.isfunction(value) and value.__module__ == PRACTICES.__name__}
        self.assertEqual(self.covered, functions)


if __name__ == '__main__':
    unittest.main()
