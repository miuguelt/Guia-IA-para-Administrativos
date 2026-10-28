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

    def copied(self, soup, button):
        ids = [button['data-copy'], *button.get('data-copy-append', '').split()]
        return '\n\n'.join(soup.select_one('#' + ident).get_text().strip() for ident in ids)

    def test_reto_muestra_el_producto_sin_repetir_el_metodo_completo(self):
        module = self.load()
        compact = BeautifulSoup(module.render_task('MG-A02', include_downloads=False), 'html.parser')
        action = compact.select_one('.ai-task-action').get_text()
        self.assertIn(module.TASKS['MG-A02']['visualDescription'], action)
        self.assertNotIn('Descarga y extrae', action)
        self.assertNotIn('Guarda tu evidencia', action)
        self.assertEqual(len(compact.select('[data-copy]')), 2)
        complete = BeautifulSoup(module.render_task('MG-A02'), 'html.parser')
        self.assertIn('Descarga y extrae', complete.select_one('.ai-task-action').get_text())

    def test_los_retos_guian_a_escribir_en_el_chat_antes_de_copiar_la_referencia(self):
        module = self.load()
        prompts = module.sys.modules['ai_prompts']
        expected_buttons = {'comentado': 2, 'huecos': 3, 'propio': 2}
        for key, task in module.TASKS.items():
            if 'brief' not in task:
                continue
            with self.subTest(key=key):
                level = task['brief']['apoyo']
                soup = BeautifulSoup(module.render_task(key, include_downloads=False), 'html.parser')
                card = soup.select_one('.ai-task-coached')
                self.assertEqual(card['data-support'], level)
                self.assertFalse(soup.select('input,textarea'), 'La guía no pide escribir en la página')
                steps = card.select('.coach-steps > li')
                self.assertEqual(len(steps), 3)
                self.assertIn('Escribe tu instrucción en el chat', steps[1].get_text())
                self.assertIn(task['brief']['tecnica']['nombre'], card.select_one('.ai-task-technique').get_text())
                buttons = soup.select('[data-copy]')
                self.assertEqual(len(buttons), expected_buttons[level])
                copies = {button['data-copy'] + '|' + button.get('data-copy-append', ''): self.copied(soup, button) for button in buttons}
                ident = 'ai-task-' + key
                self.assertEqual(copies[f'{ident}-entrenador|'], prompts.coach_text(task))
                self.assertEqual(copies[f'{ident}-chat|{ident}-chat-tecnico'], prompts.copy_text(task))
                self.assertIsNotNone(card.select_one(f'.ide-option a[href="materiales/ia/{key}/ENCARGO-IDE.md"][download]'))
                if level == 'huecos':
                    self.assertEqual(copies[f'{ident}-plantilla|'], prompts.template_text(task))
                if level == 'comentado':
                    self.assertEqual(len(card.select('.crtt-annotated dd small')), 5)
                if level == 'propio':
                    self.assertEqual(len(card.select('.crtt-checklist li')), 5)
                    self.assertEqual(card.select_one('.ai-task-reference summary').get_text(), 'Ábrelo cuando termines tu instrucción')
                reference = card.select_one('[data-ai-task]')
                self.assertIn(task['chatPrompt'], reference.get_text())

    def test_encargos_se_copian_completos_y_los_materiales_estan_disponibles(self):
        module = self.load()
        for key in module.TASKS:
            if 'brief' in module.TASKS[key]:
                continue
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
        self.assertIn('no prepares otra entrega', heading.lower())
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
        self.assertIn('Elige', steps[0])
        self.assertIn('resultado-reto-N.html', steps[0])
        self.assertIn('Revisa', steps[1])
        self.assertIn('Repite', steps[2])
        expected = [item.get_text(' ', strip=True) for item in soup.select('[data-expected-results] > li')]
        self.assertEqual([text.split(' ')[0] for text in expected], ['resultado-reto-2.html', 'resultado-reto-3.html'])
        integrated = soup.select_one('[data-ai-task-key="MG-A02"]').find_parent('details', class_='delivery-integrated')
        self.assertIsNotNone(integrated)
        self.assertIn('resultado-MG-A02.html', integrated.select_one('summary').get_text())
        self.assertIsNone(receive.select_one('[data-ai-task-key]'))
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
        self.assertEqual({name for name,value in vars(module).items() if inspect.isfunction(value) and value.__module__==module.__name__}, {'render_task','render_coached_task','render_delivery','attach_deliveries','attach_task_slots'})

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
