"""Contratos del recorrido breve y de los retos guiados."""
import importlib.util
import inspect
import json
import csv
from pathlib import Path
import unittest
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("course_guidance", ROOT / "scripts/course_guidance.py")


class GuidanceTests(unittest.TestCase):
    def test_recorrido_conserva_todos_los_nodos_y_los_distribuye_en_cuatro_pasos(self):
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
        for source in (ROOT / "content/lessons").glob("*.html"):
            soup = BeautifulSoup(source.read_text(encoding="utf-8"), "html.parser")
            for card in soup.select("article.challenge-card"):
                original = card.get_text(" ", strip=True)
                ident = card["id"]
                card.h3.extract()
                card.select_one('.challenge-meta').extract()  # La cabecera exterior conserva los metadatos.
                materials = '<section class="challenge-materials"><a download href="fuente.csv">Fuente</a></section>'
                guided = BeautifulSoup(module.guided_challenge(card, materials), "html.parser")
                self.assertEqual(len(guided.select("[data-challenge-stage]")), 4, ident)
                self.assertEqual([n["data-challenge-stage"] for n in guided.select("[data-challenge-stage]")], ["0", "1", "2", "3"])
                self.assertEqual(len(guided.select("[data-stage-select]")), 4)
                inline = bool(module.TASKS[ident].get("inlineSources")) and not module.TASKS[ident]["sourceFiles"]
                if inline:
                    sources = guided.select_one('[data-challenge-stage="0"] .inline-sources')
                    self.assertIsNotNone(sources, ident)
                    self.assertIsNotNone(sources.select_one('.tool-route'), ident)
                    copy = sources.select_one('button[data-copy]')
                    ids = [copy["data-copy"], *copy.get("data-copy-append", "").split()]
                    self.assertEqual(ids, [f"fuente-{ident}-{s['id']}" for s in module.TASKS[ident]["inlineSources"]])
                    for node_id in ids:
                        self.assertIsNotNone(sources.select_one(f'details:not([open]) pre#{node_id}'), node_id)
                    self.assertIn("Copia los textos de práctica", guided.select_one('[data-challenge-stage="0"] h4').get_text())
                else:
                    self.assertIsNotNone(guided.select_one('[data-challenge-stage="0"] .challenge-materials'))
                self.assertIsNotNone(guided.select_one('[data-challenge-stage="2"] details.course-context > ol'))
                self.assertEqual(len(guided.select('[data-challenge-stage="2"] [data-ai-review-checks] > li')), 3)
                self.assertIsNotNone(guided.select_one(f'[data-challenge-stage="2"] [data-challenge-decisions="{ident}"]'), ident)
                self.assertEqual(len(guided.select('[data-challenge-stage="2"] [data-challenge-decisions] .case-question')), 3, ident)
                self.assertIsNotNone(guided.select_one('[data-challenge-stage="3"] .challenge-deliverable-bridge'))
                save_tip = guided.select_one('[data-challenge-stage="3"] .stage-save-tip').get_text(' ', strip=True)
                self.assertIn('no prepares otra entrega', save_tip.lower(), ident)
                self.assertNotRegex(save_tip, r'JSON|bloque técnico')
                self.assertIsNotNone(guided.select_one('.output-preview table caption'))
                self.assertEqual(len(guided.select('a.ai-kit-primary[download]')), 0 if inline else 1)
                self.assertTrue(any(prod in guided.get_text(' ', strip=True) for prod in ('Canva', 'PDF', 'Word', 'Excel')), ident)
                stage = guided.select_one('[data-challenge-stage="1"]')
                first = stage.find(class_=['ai-task-card', 'decision-compass-panel'])
                self.assertIn('ai-task-card', first.get('class'), ident + ': el encargo principal va primero')
                details_block = stage.select_one('.decision-compass-panel').find_parent('details')
                self.assertIsNotNone(details_block, ident)
                self.assertIn('Antes de copiar: decisiones clave y ejemplos', details_block.select_one('summary').get_text())
                self.assertIn(f'resultado-{ident}.html', save_tip, ident)
                self.assertNotRegex(save_tip, r'Canva, PDF, Word o Excel')
                self.assertIsNotNone(guided.select_one('[data-challenge-stage="1"] .decision-compass-panel'), ident)
                self.assertEqual(len(guided.select('[data-challenge-stage="1"] .decision-compass-grid .compass-step')), 4, ident)
                self.assertIsNone(guided.select_one('[data-challenge-stage="1"] .prompt-2clicks-container'), ident)
                self.assertIsNone(guided.select_one(f'[data-copy="{ident}-prompt-seguro"]'), ident)
                self.assertIsNone(guided.select_one(f'[data-copy="{ident}-prompt-produccion"]'), ident)
                self.assertIsNone(guided.select_one(f'#{ident}-prompt-seguro'), ident)
                self.assertIsNone(guided.select_one(f'#{ident}-prompt-produccion'), ident)
                self.assertIsNotNone(guided.select_one('[data-challenge-stage="1"] .gold-vs-antipattern-panel'), ident)
                self.assertIsNotNone(guided.select_one('[data-challenge-stage="1"] .office-transfer-panel'), ident)
                self.assertEqual(len(guided.select('[data-stage-status][role="status"]')), 1)
                for link in guided.select('.stage-documents a'):
                    self.assertTrue((ROOT / link['href']).is_file(), link['href'])
                # El encargo canónico reemplaza la copia y el botón redundantes;
                # el caso, las instrucciones y las comprobaciones se conservan.
                for redundant in card.select('[data-ai-task], [data-copy$="-ai-prompt"]'):
                    redundant.decompose()
                for text in card.stripped_strings:
                    self.assertIn(text, guided.get_text(" ", strip=True), ident)
                self.assertIsNotNone(guided.select_one('[data-challenge-stage="1"] [data-ai-task-key]'))
                self.assertEqual(len(guided.select('[data-challenge-stage="1"] [data-ai-task]')), 1)
                self.assertFalse(guided.select('textarea, input[type="text"]'))

    def test_entrada_muestra_el_producto_y_mapa_sin_ocultar_el_contenido_sin_js(self):
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
        for ident in json.loads((ROOT / "content/module-orientation.json").read_text(encoding="utf-8")):
            markup = module.guided_intro(ident, "<section class='learning-start'>Explicación íntegra</section>")
            soup = BeautifulSoup(markup, "html.parser")
            self.assertIsNotNone(soup.select_one(".module-brief"))
            self.assertIsNotNone(soup.select_one("[data-next-phase='observa']"))
            self.assertIsNotNone(soup.select_one(".module-explanation .learning-start"))
            self.assertEqual(len(soup.select(".module-concept-map li")), 3)
            self.assertIsNotNone(soup.select_one('.lesson-visual figcaption'))
            visual = soup.select_one('.lesson-visual')
            self.assertIsNotNone(soup.select_one('#' + visual['aria-labelledby']))
            self.assertFalse(soup.select("[hidden]"))
            self.assertIn("Explicación íntegra", soup.get_text())
        with self.assertRaises(KeyError):
            module.guided_intro("no-existe", "")

    def test_la_lectura_muestra_el_diagrama_y_pliega_los_bloques_secundarios(self):
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
        lesson = ('<div class="learning-block"><details class="course-context" data-lesson-extension=""><summary>Ampliar</summary>'
                  '<figure class="native-diagram" data-diagram-visible="true"><h3>Diagrama principal</h3></figure>'
                  '<section class="data-safety-triptych-section"><h3>Semáforo</h3></section>'
                  '<section class="m01-step data-safety-triptych-section"><h3>Paso propio del módulo 01</h3></section>'
                  '<section class="lesson-step data-safety-triptych-section"><h3>Paso propio del módulo 02</h3></section>'
                  '<div class="comparative-cards-grid"><h4>Comparación</h4></div><div class="course-context"><h4>Nota</h4></div>'
                  '<div class="transfer-tip">Puente al módulo siguiente</div><p data-transfer-task="">En tu trabajo</p></details></div>')
        soup = BeautifulSoup(module.guided_intro("m02-diseno", lesson), "html.parser")
        deeper = soup.select(".learning-block > details.lesson-deeper")
        self.assertEqual(len(deeper), 1)
        self.assertEqual(deeper[0].summary.get_text(strip=True), "Profundiza: riesgos frecuentes y comparaciones")
        self.assertEqual([node.get_text(" ", strip=True) for node in deeper[0].find_all(recursive=False)][1:],
                         ["Semáforo", "Comparación", "Nota", "Puente al módulo siguiente"])
        for visible in ("Diagrama principal", "Paso propio del módulo 01", "Paso propio del módulo 02", "En tu trabajo"):
            node = soup.find(string=visible)
            self.assertIsNone(node.find_parent("details"), visible)
        plain = BeautifulSoup(module.guided_intro("m01-fundamentos", '<div class="learning-block"><p>Sin bloques secundarios</p></div>'), "html.parser")
        self.assertFalse(plain.select(".lesson-deeper"))

    def test_mapa_ordena_los_retos_del_modulo_y_dirige_a_ids_reales(self):
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
        titles = [("reto-0", "Reto 0"), ("reto-1", "Reto 1")]
        soup = BeautifulSoup(module.challenge_map(titles, "MG-A01"), "html.parser")
        self.assertEqual([b["data-open-challenge"] for b in soup.select("button")], ["reto-0", "reto-1"])
        self.assertIn("MG-A01", soup.get_text())
        self.assertIn("2 retos", soup.get_text())
        self.assertIn("1 reto", module.challenge_map(titles[:1], "MG-A05"))
        shared = BeautifulSoup(module.challenge_map(titles, "MG-A01"), "html.parser")
        self.assertFalse(shared.select('.challenge-shared-materials'))
        self.assertFalse(BeautifulSoup(module.challenge_map(titles, "MG-A02"), "html.parser").select('.challenge-shared-materials'))
        materials = BeautifulSoup(module.shared_materials_panel(), "html.parser")
        self.assertEqual(len(materials.select('a[href="materiales/ia/recursos-compartidos.zip"][download]')), 1)
        self.assertIn('lineamiento-ficticio.csv', materials.get_text())
        self.assertNotIn('reto-00-descripciones-seguras.csv', materials.get_text())
        self.assertIn('gastos-q1.csv', materials.get_text())
        shared_hrefs = [item["href"] for item in json.loads((ROOT / "content/shared-challenge-materials.json").read_text(encoding="utf-8"))]
        self.assertEqual([a["href"] for a in materials.select('details li a[download]')], shared_hrefs)
        for href in shared_hrefs:
            self.assertTrue((ROOT / href).is_file(), href)
        self.assertEqual({name for name, value in vars(module).items() if inspect.isfunction(value) and value.__module__ == module.__name__}, {"guided_intro", "guided_challenge", "challenge_map", "shared_materials_panel", "render_challenge_compass", "render_challenge_decisions", "render_office_step", "inline_sources_html"})

    def test_cada_reto_muestra_el_paso_a_la_herramienta_de_oficina_en_recibe(self):
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
        compass = json.loads((ROOT / "content/challenge-compass.json").read_text(encoding="utf-8"))
        tools = ("Word", "Docs", "Excel", "Sheets", "Canva", "PowerPoint", "asistente reutilizable")
        for ident, data in compass.items():
            with self.subTest(ident=ident):
                product = data["compass"]["productFormat"]
                self.assertIn(f"resultado-{ident}.html", product)
                self.assertIn("Paso a la oficina:", product)
                step = BeautifulSoup(module.render_office_step(ident), "html.parser")
                text = step.select_one(".stage-office-step").get_text(" ", strip=True)
                self.assertTrue(text.startswith("Llévalo a la oficina:"), text)
                self.assertNotIn("Paso a la oficina", text)
                self.assertTrue(any(tool in text for tool in tools), text)
        self.assertEqual(module.render_office_step("no-existe"), "")
        sin_paso = {"reto-x": {"compass": {"productFormat": "Solo una página."}}}
        original = module.COMPASS
        try:
            module.COMPASS = sin_paso
            self.assertEqual(module.render_office_step("reto-x"), "")
        finally:
            module.COMPASS = original
        for source in (ROOT / "content/lessons").glob("*.html"):
            soup = BeautifulSoup(source.read_text(encoding="utf-8"), "html.parser")
            for card in soup.select("article.challenge-card"):
                ident = card["id"]
                guided = BeautifulSoup(module.guided_challenge(card, ""), "html.parser")
                self.assertIsNotNone(guided.select_one('[data-challenge-stage="3"] .stage-office-step'), ident)

    def test_el_paso_2_guia_a_escribir_en_el_chat_y_el_ajuste_es_propio_del_reto(self):
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
        tasks = json.loads((ROOT / "content/ai-task-briefs.json").read_text(encoding="utf-8"))
        for source in (ROOT / "content/lessons").glob("*.html"):
            soup = BeautifulSoup(source.read_text(encoding="utf-8"), "html.parser")
            for card in soup.select("article.challenge-card"):
                ident = card["id"]
                with self.subTest(ident=ident):
                    guided = BeautifulSoup(module.guided_challenge(card, ""), "html.parser")
                    stage = guided.select_one('[data-challenge-stage="1"]')
                    self.assertIn("Escribe tu instrucción y compárala con la referencia", stage.select_one("h4").get_text(" ", strip=True))
                    self.assertIsNotNone(stage.select_one(".ai-task-coached"))
                    self.assertIsNone(stage.select_one(".stage-crtt-tip"))
                    repair = guided.select_one('[data-challenge-stage="2"] .prompt-text')
                    if repair is not None:
                        for check in tasks[ident]["checks"]:
                            self.assertIn(check, repair.get_text())
                    self.assertNotIn("deja que la IA trabaje", guided.get_text())

    def test_render_challenge_compass_genera_brujula(self):
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
        markup = module.render_challenge_compass("reto-0")
        soup = BeautifulSoup(markup, "html.parser")
        self.assertIsNotNone(soup.select_one(".decision-compass-panel"))
        self.assertEqual(len(soup.select(".compass-step")), 4)
        self.assertIsNone(soup.select_one('[data-copy="reto-0-prompt-seguro"]'))
        self.assertIsNone(soup.select_one('[data-copy="reto-0-prompt-produccion"]'))
        self.assertIsNotNone(soup.select_one(".gold-vs-antipattern-panel"))
        self.assertIsNotNone(soup.select_one(".office-transfer-panel"))
        self.assertEqual([tag.get_text() for tag in soup.select(".comparison-tag")], ["Resultado esperado", "Error frecuente"])
        self.assertNotRegex(soup.get_text(), "Regla de oro|Estándar de Oro|Antipatrón|Habeas Data")
        self.assertEqual(module.render_challenge_compass("no-existe"), "")
        self.assertEqual(module.render_challenge_decisions("no-existe"), "")

    def test_los_ejemplos_visuales_coinciden_con_las_fuentes_y_no_amplian_los_retos(self):
        module = importlib.util.module_from_spec(SPEC)
        SPEC.loader.exec_module(module)
        ai_tasks = json.loads((ROOT / 'content/ai-task-briefs.json').read_text(encoding='utf-8'))
        challenge_keys = {k for k in ai_tasks if k.startswith('reto-')}
        self.assertEqual(set(module.GUIDANCE), challenge_keys)
        rows = list(csv.DictReader((ROOT / 'materiales/retos/bienestar.csv').read_text(encoding='utf-8-sig').splitlines()[3:], delimiter=';'))
        center = next(row for row in rows if row['Centro'] == 'Centro A')
        self.assertEqual(int(center['Deserciones']), 42)
        self.assertEqual(int(center['Aprendices matriculados']), 840)
        self.assertEqual(int(center['Deserciones']) / int(center['Aprendices matriculados']) * 100, 5)
        rows = list(csv.DictReader((ROOT / 'materiales/retos/datos-sofia.csv').read_text(encoding='utf-8-sig').splitlines()[3:], delimiter=';'))
        self.assertEqual(next(row for row in rows if row['Código']=='SIM-0002')['Estado sin normalizar'].strip().upper(), 'FINALIZADO')
        self.assertEqual(next(row for row in rows if row['Código']=='SIM-0003')['Estado sin normalizar'], '')
        self.assertEqual(len([row for row in rows if row['Código']=='SIM-0012']), 2)
        rows = list(csv.DictReader((ROOT / 'materiales/retos/reto-07-casos-flujo.csv').read_text(encoding='utf-8-sig').splitlines()[3:], delimiter=';'))
        self.assertEqual([row['Código'] for row in rows], ['FL-01', 'FL-02', 'FL-03'])
        self.assertEqual(rows[1]['Franja horaria'], '')
        self.assertEqual(rows[2]['Marcada como urgente'], 'Sí')


if __name__ == "__main__":
    unittest.main()
