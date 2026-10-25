"""Comprueba claridad estructural y conservación de los contratos del recorrido."""
import importlib.util
from pathlib import Path
import unittest
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('simplificacion_build', ROOT / 'scripts/build-course.py')
BUILD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILD)


class SimplificacionTests(unittest.TestCase):
    def test_la_web_carga_el_estilo_de_lectura_despues_de_las_reglas_compartidas(self):
        shell = BeautifulSoup((ROOT / 'content/shell.html').read_text(encoding='utf-8'), 'html.parser')
        styles = [link['href'].split('?')[0] for link in shell.select('link[rel="stylesheet"]')]
        self.assertGreater(styles.index('css/guide-reading.css'), styles.index('css/guided-experience.css'))
        self.assertIn('devbrain-prose.css', styles)
        self.assertIsNotNone(shell.select_one('script[src="devbrain-prose.js"]'))
        style = (ROOT / 'css/guide-reading.css').read_text(encoding='utf-8')
        runtime = (ROOT / 'devbrain-prose.js').read_text(encoding='utf-8')
        self.assertIn('text-align: var(--text-align-reading, start);', style)
        self.assertIn('text-align-last: start;', style)
        self.assertIn('width >= 40 * rem', runtime)
        self.assertIn('white-space: pre;', style)

    def test_explicacion_esencial_visible_y_un_solo_objetivo(self):
        for index, spec in enumerate(BUILD.MODULES):
            page = BeautifulSoup(BUILD.module_page(spec, 'portafolio'), 'html.parser')
            learn = page.select_one('[data-panel="aprende"]')
            self.assertEqual(len(learn.select('[data-learning-goal]')), 1, spec[0])
            self.assertFalse(learn.select('.ai-quick-lesson, .module-hero, .method-route'), spec[0])
            self.assertFalse(page.select('.autonomous-route'), spec[0])
            block = learn.select_one('.learning-block')
            self.assertIsNotNone(block, spec[0])
            self.assertIsNotNone(learn.select_one('.module-reading > .learning-block'), spec[0])
            self.assertIsNotNone(learn.select_one('.module-explanation > .productivity-lesson'), spec[0])
            self.assertIsNone(block.find_parent('details'), spec[0])
            for region in learn.select('.module-explanation [aria-labelledby]'):
                for ident in region['aria-labelledby'].split():
                    self.assertIsNotNone(page.select_one('#' + ident), ident)
            self.assertFalse(block.select(':scope > details[data-lesson-extension]'), spec[0])
            self.assertEqual(len(learn.select('.module-concept-map li')), 3)
            self.assertEqual(len(page.select('[data-knowledge-check]')), 2)
            self.assertIsNotNone(page.select_one('[data-db-evidence="MG-A0' + str(index + 1) + '"]'))

    def test_ayuda_comun_accesible_desde_cada_reto_y_complemento(self):
        preparation = BeautifulSoup((ROOT / 'content/preparation.html').read_text(encoding='utf-8'), 'html.parser')
        help_section = preparation.select_one('#metodo-comun')
        self.assertIsNotNone(help_section)
        self.assertIsNone(help_section.find_parent('details'))
        self.assertEqual(len(preparation.select('.autonomous-route')), 1)
        for spec in BUILD.MODULES:
            page = BeautifulSoup(BUILD.module_page(spec, 'portafolio'), 'html.parser')
            for card in page.select('.challenge-card'):
                self.assertEqual(len(card.select('a[href="#metodo-comun"]')), 1, card['id'])
                self.assertEqual(len(card.select('.file-help-inline')), 0, card['id'])
                self.assertEqual(len(card.select('[data-ai-review-checks] > li')), 3, card['id'])
                self.assertIsNotNone(card.select_one('.stage-save-tip'))
        for relative in ['ecobogota.html', 'analisis-datos/page.html']:
            page = BeautifulSoup((ROOT / 'content' / relative).read_text(encoding='utf-8'), 'html.parser')
            self.assertIsNotNone(page.select_one('a[href="#metodo-comun"]'), relative)

    def test_las_explicaciones_originales_conservan_su_texto_y_referencias(self):
        for spec in BUILD.MODULES:
            source = BeautifulSoup((ROOT / 'content/lessons' / (spec[0] + '.html')).read_text(encoding='utf-8'), 'html.parser')
            page = BeautifulSoup(BUILD.module_page(spec, 'portafolio'), 'html.parser')
            for node in source.select('.learning-block > details.course-context'):
                for summary in node.select(':scope > summary'):
                    summary.decompose()
                for widget in node.select('.tool-lab, .ratio-lab'):
                    widget.decompose()
                for text in node.stripped_strings:
                    self.assertIn(text, page.get_text(' ', strip=True), spec[0])
            for card in source.select('.challenge-card'):
                self.assertIsNotNone(page.select_one('#' + card['id']))


if __name__ == '__main__':
    unittest.main()
