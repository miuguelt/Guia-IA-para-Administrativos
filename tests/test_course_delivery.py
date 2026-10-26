"""La ruta de entrega recibe archivos y conserva el SDK sin exponer formularios."""
import importlib.util
import inspect
from pathlib import Path
import unittest
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]


class DeliveryMarkupTests(unittest.TestCase):
    def load(self):
        spec = importlib.util.spec_from_file_location('course_delivery', ROOT / 'scripts/course_delivery.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def test_reto_muestra_el_producto_sin_repetir_el_metodo_completo(self):
        module = self.load()
        compact = BeautifulSoup(module.render_task('reto-4', include_downloads=False), 'html.parser')
        action = compact.select_one('.ai-task-action').get_text()
        self.assertIn(module.TASKS['reto-4']['visualDescription'], action)
        self.assertNotIn('Descarga y extrae', action)
        self.assertNotIn('Guarda tu evidencia', action)
        self.assertEqual(len(compact.select('[data-copy]')), 2)
        complete = BeautifulSoup(module.render_task('reto-4'), 'html.parser')
        self.assertIn('Descarga y extrae', complete.select_one('.ai-task-action').get_text())

    def test_encargos_se_copian_completos_y_los_materiales_estan_disponibles(self):
        module = self.load()
        for key in module.TASKS:
            soup = BeautifulSoup(module.render_task(key), 'html.parser')
            buttons = soup.select('[data-copy]')
            self.assertEqual(len(buttons), 2, key)
            self.assertFalse(soup.select('input,textarea'))
            for button in buttons:
                prompt = soup.select_one('#' + button['data-copy'])
                self.assertIsNotNone(prompt)
                expected = module.TASKS[key]['chatPrompt' if button['data-copy'].endswith('-chat') else 'idePrompt']
                self.assertEqual(prompt.get_text(), expected)
                self.assertIn('fuente', prompt.get_text().lower())
                self.assertIn('prompt-text', prompt.get('class', []))
            if module.TASKS[key].get('visualArtifact'):
                self.assertTrue(any(prod in soup.get_text() for prod in ('Canva', 'PDF', 'Word', 'Excel')), key)
                self.assertIn('devbrain-evidence-result', soup.get_text(), key)
                self.assertIn(module.TASKS[key]['visualDescription'], soup.get_text(), key)
            for link in soup.select('a[download]'):
                self.assertTrue((ROOT / link['href']).is_file(), (key,link['href']))
            self.assertIn('Antigravity', soup.get_text())
        with self.assertRaises(KeyError):
            module.render_task('no-existe')

    def test_estacion_recibe_documento_sin_pedir_que_el_aprendiz_escriba_respuestas(self):
        module = self.load()
        artifacts = {item['id']: item for item in module.REGISTRY['artifacts']}
        self.assertNotIn('en papel', artifacts['MG-A03']['purpose'])
        self.assertNotIn('en papel', ' '.join(artifacts['MG-A03']['checklist']))
        self.assertIn('cálculo independiente', ' '.join(artifacts['MG-A04']['checklist']))
        soup = BeautifulSoup(module.render_delivery('MG-A02'), 'html.parser')
        heading = soup.select_one('.delivery-heading').get_text(' ', strip=True)
        self.assertIn('No prepares otra entrega', heading)
        self.assertNotRegex(heading, r'JSON|archivos técnicos')
        self.assertEqual(len(soup.select('input')), 2)
        self.assertEqual(soup.select_one('input')['type'], 'file')
        self.assertIn('.zip', soup.select_one('[data-result-file]')['accept'])
        self.assertIn('.html', soup.select_one('[data-result-file]')['accept'])
        self.assertTrue(soup.select_one('[data-result-file]').has_attr('multiple'))
        self.assertIsNotNone(soup.select_one('[data-result-folder][webkitdirectory][multiple]'))
        self.assertIsNotNone(soup.select_one('[data-result-retry][hidden]'))
        self.assertEqual(soup.select_one('[data-ai-delivery]')['data-ai-delivery'], 'MG-A02')
        self.assertFalse(soup.select('textarea:not([data-result-text])'))
        self.assertEqual(len(soup.select('[data-result-text]')), 1)
        self.assertIsNotNone(soup.select_one('label[for="result-text-MG-A02"]'))
        self.assertIsNotNone(soup.select_one('[data-result-paste]'))
        self.assertIsNotNone(soup.select_one('[data-result-save][disabled]'))
        self.assertIsNotNone(soup.select_one('[data-result-preview]'))
        self.assertIsNotNone(soup.select_one('[data-result-status][role="status"]'))
        self.assertIsNotNone(soup.select_one('[data-result-review]'))
        self.assertIn('instructor', soup.get_text())
        receive = soup.select_one('.delivery-receive')
        steps = [item.get_text(' ', strip=True) for item in receive.select('ol.delivery-steps > li')]
        self.assertEqual(len(steps), 3)
        self.assertIn('Copia el encargo', steps[0])
        self.assertIn('resultado-MG-A02.html', steps[1])
        self.assertIn('Elige', steps[2])
        help_box = receive.select_one('details.delivery-help')
        self.assertIsNotNone(help_box)
        self.assertIn('¿Algo falló?', help_box.select_one('summary').get_text())
        for selector in ('[data-result-folder-control]', '.delivery-local', '[data-result-text]', '.delivery-repair'):
            node = receive.select_one(selector)
            self.assertIsNotNone(node, selector)
            self.assertIsNotNone(node.find_parent('details', class_='delivery-help'), selector)
        visible = BeautifulSoup(str(receive), 'html.parser')
        visible.select_one('details.delivery-help').decompose()
        self.assertNotRegex(visible.get_text(' ', strip=True), r'MB|ZIP|Markdown|TXT|JSON')
        self.assertIsNone(soup.select_one('[data-result-file]').find_parent('details'))

    def test_siete_estaciones_siguen_en_el_sdk_y_las_cajas_anteriores_no_se_muestran(self):
        module = self.load()
        soup = BeautifulSoup(''.join(
            f'<div hidden inert data-ai-storage="ECO-A01"><div data-db-evidence="ECO-A01"></div></div>'
            if a['id'] == 'ECO-A01' else f'<div data-db-evidence="{a["id"]}"></div>'
            for a in module.REGISTRY['artifacts']), 'html.parser')
        module.attach_deliveries(soup)
        self.assertEqual(len(soup.select('[data-ai-delivery]')), 7)
        self.assertEqual(len(soup.select('[data-db-evidence]')), 8)
        for node in soup.select('[data-db-evidence]'):
            self.assertIsNotNone(node.find_parent(attrs={'data-ai-storage':True,'hidden':True}))
        module.attach_deliveries(soup)
        self.assertEqual(len(soup.select('[data-ai-delivery]')), 7)
        self.assertEqual({name for name,value in vars(module).items() if inspect.isfunction(value) and value.__module__==module.__name__}, {'render_task','render_delivery','attach_deliveries','attach_task_slots'})

    def test_encargo_aparte_se_publica_en_su_espacio_y_falla_si_no_existe(self):
        module = self.load()
        soup = BeautifulSoup('<section><div data-ai-task-slot="prueba-individual"></div></section>', 'html.parser')
        module.attach_task_slots(soup)
        card = soup.select_one('[data-ai-task-key="prueba-individual"]')
        self.assertIsNotNone(card)
        self.assertIsNone(soup.select_one('[data-ai-task-slot]'))
        self.assertIsNotNone(card.select_one('a[href="materiales/ia/prueba-individual.zip"][download]'))
        self.assertIn('IND-01', card.select_one('#ai-task-prueba-individual-chat').get_text())
        with self.assertRaises(KeyError):
            module.attach_task_slots(BeautifulSoup('<div data-ai-task-slot="no-existe"></div>', 'html.parser'))


if __name__ == '__main__':
    unittest.main()
