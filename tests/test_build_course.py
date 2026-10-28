"""Pruebas de funciones del generador estático del curso."""
import importlib.util
import hashlib
import inspect
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from zipfile import ZipFile

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("build_course_test_target", ROOT / "scripts" / "build-course.py")
BUILD_COURSE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILD_COURSE)



class BuildCourseTests(unittest.TestCase):
    covered_functions = set()

    @classmethod
    def setUpClass(cls):
        (ROOT / "output").mkdir(parents=True, exist_ok=True)





    def call_production_function(self, name, *args):
        function = getattr(BUILD_COURSE, name)
        result = function(*args)
        self.covered_functions.add(name)
        return result

    def test_apoyo_pedagogico_conserva_objetivos_preguntas_y_texto_seguro(self):
        for ident in ["preparacion", *(spec[0] for spec in BUILD_COURSE.MODULES)]:
            support = self.call_production_function("learning_support", ident)
            self.assertEqual(set(support), {"learn", "observe"})
            parsed = BeautifulSoup("".join(support.values()), "html.parser")
            self.assertTrue(parsed.select_one("[data-learning-goal]").get_text(" ", strip=True))
            self.assertEqual(len(parsed.select("[data-knowledge-check]")), 2)
            self.assertEqual(len(parsed.select("[data-correct='true']")), 2)
            self.assertFalse(parsed.select(".practice-route, .method-route"), "Los pasos viven en cada reto y en la preparación")
            self.assertTrue(BeautifulSoup(support["learn"], "html.parser").select_one("[data-productivity-topic]"), ident)
        data = BUILD_COURSE.LEARNING_PATHS["preparacion"]
        original = data["goal"]
        try:
            data["goal"] = '<img src="x"> & una decisión'
            support = self.call_production_function("learning_support", "preparacion")
            parsed = BeautifulSoup(support["learn"], "html.parser")
            self.assertFalse(parsed.select("img"))
            self.assertIn('<img src="x"> & una decisión', parsed.get_text())
        finally:
            data["goal"] = original
        option = data["checks"][0]["options"][0]
        correct = option["correct"]
        try:
            option["correct"] = False
            with self.assertRaises(AssertionError):
                self.call_production_function("learning_support", "preparacion")
        finally:
            option["correct"] = correct

    def test_preparacion_publica_un_inicio_breve_sin_duplicar_los_pasos(self):
        support = self.call_production_function("learning_support", "preparacion")
        parsed = BeautifulSoup(support["learn"], "html.parser")
        self.assertEqual(len(parsed.select(".preparation-facts > div")), 3)
        self.assertFalse(parsed.select(".method-route"))
        self.assertIn("bienestar.csv", parsed.get_text())
        data = BUILD_COURSE.LEARNING_PATHS["preparacion"]
        original = data["setup"]
        try:
            data["setup"] = [["<img>", '<script> & "archivo"']]
            safe = self.call_production_function("learning_support", "preparacion")
            parsed = BeautifulSoup(safe["learn"], "html.parser")
            self.assertFalse(parsed.select("img, script"))
            self.assertIn('<script> & "archivo"', parsed.get_text())
        finally:
            data["setup"] = original
        for ident in ("preparacion", *(spec[0] for spec in BUILD_COURSE.MODULES)):
            self.assertNotIn("steps", BUILD_COURSE.LEARNING_PATHS[ident], ident)
            self.assertNotIn("practice", BUILD_COURSE.LEARNING_PATHS[ident], ident)

    def test_los_codigos_de_evidencia_se_muestran_como_nombres_sencillos(self):
        markup = ('<p>Retos 0 y 1 · MG-A01</p><p>Consolida el portafolio (MG-A05).</p><span>MG-A03 · RA2</span>'
                  '<p>Las cinco evidencias (MG-A01 a MG-A05).</p><summary>Usa resultado-MG-A01.html</summary>'
                  '<pre>"artifactId": "MG-A02"</pre><p data-mode-only="aula">Revisa MG-A04</p><p class="prompt-text">Copia MG-A04</p>'
                  '<script>const id = "MG-A03";</script><p>Sin códigos</p><p data-mode-only="autonomo">Guarda la evidencia 2 (MG-A02).</p>')
        soup = BeautifulSoup(markup, "html.parser")
        self.assertEqual(self.call_production_function("humanize_codes", soup), 5)

        def texts(mode):
            copy = BeautifulSoup(str(soup), "html.parser")
            for node in copy.select("[data-mode-only]"):
                if not node.decomposed and node["data-mode-only"] != mode:
                    node.decompose()
            return [node.get_text() for node in copy.find_all(["p", "span", "summary", "pre", "script"], recursive=False)]

        self.assertEqual(texts("autonomo"), ["Retos 0 y 1 · Evidencia 1", "Consolida el portafolio.", "Evidencia 3",
                                             "Las cinco evidencias.", "Usa resultado-MG-A01.html", '"artifactId": "MG-A02"',
                                             "Copia MG-A04", 'const id = "MG-A03";', "Sin códigos", "Guarda la evidencia 2."])
        self.assertEqual(texts("aula"), ["Retos 0 y 1 · Evidencia 1 (MG-A01)", "Consolida el portafolio (MG-A05).", "Evidencia 3 (MG-A03) · RA2",
                                         "Las cinco evidencias (MG-A01 a MG-A05).", "Usa resultado-MG-A01.html", '"artifactId": "MG-A02"',
                                         "Revisa MG-A04", "Copia MG-A04", 'const id = "MG-A03";', "Sin códigos"])
        self.assertEqual(self.call_production_function("humanize_codes", soup), 0, "Una segunda pasada no cambia nada")

    def test_la_primera_mencion_de_crtt_en_cada_modulo_enlaza_a_su_explicacion(self):
        soup = BeautifulSoup('<section class="module-page" id="m01-fundamentos"><div id="crtt"><p>CRTT ordena</p></div><p>Usa CRTT.</p></section>'
                             '<section class="module-page" id="m02-diseno"><h3>Aplica CRTT</h3><p>Tu <a href="#x">CRTT</a> previa.</p>'
                             '<p>Tu CRTT del Reto 1 y otra CRTT.</p><pre>CRTT</pre></section>'
                             '<section class="module-page" id="portafolio"><p>CRTT</p></section>', "html.parser")
        self.assertEqual(self.call_production_function("link_crtt", soup), 2)
        links = soup.select('a[href="#crtt"]')
        self.assertEqual([link.find_parent("section")["id"] for link in links], ["m01-fundamentos", "m02-diseno"])
        self.assertEqual(links[1].parent.get_text(), "Tu CRTT del Reto 1 y otra CRTT.")
        self.assertIsNone(soup.select_one("#crtt a, h3 a, #portafolio a"))

    def test_los_nombres_de_modulos_y_retos_salen_de_una_sola_fuente(self):
        markup = "<b>{{MODULO:preparacion}}</b><b>{{MODULO:m03-implementacion}}</b><a>{{RETO:reto-4}}</a><a>{{RETO:reto-integrador}}</a>"
        resolved = self.call_production_function("resolve_names", markup)
        self.assertEqual(resolved, "<b>00 · Prepara</b><b>03 · Resuelve</b><a>Reto 4 · Bandeja de 50 mensajes con razones visibles</a><a>Reto integrador · Plan, análisis y sustentación</a>")
        with self.assertRaises(KeyError):
            BUILD_COURSE.resolve_names("{{RETO:reto-99}}")
        for name in ("home.html", "calendar.html"):
            self.assertIn("{{", (ROOT / "content" / name).read_text(encoding="utf-8"), name)
        page = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("{{MODULO:", page)
        self.assertNotIn("{{RETO:", page)
        parsed = BeautifulSoup(page, "html.parser")
        titles = {card["id"]: card.select_one("h3").get_text(" ", strip=True) for card in parsed.select("article.challenge-card")}
        calendar = parsed.select('#calendario a[href^="#reto-"]')
        self.assertGreaterEqual(len(calendar), 10)
        for link in calendar:
            self.assertEqual(link.get_text(" ", strip=True), titles[link["href"][1:]])
        navigation = {spec[1]: spec[2].split()[0] for spec in BUILD_COURSE.MODULES}
        for badge in parsed.select("#inicio .roadmap-card .badge-station"):
            number, verb = badge.get_text(" ", strip=True).split(" · ")
            self.assertEqual(verb, navigation.get(number, "Prepara"))

    def test_las_plantillas_se_copian_con_el_boton_comun_sin_codigo_en_linea(self):
        page = BeautifulSoup((ROOT / "index.html").read_text(encoding="utf-8"), "html.parser")
        self.assertFalse(page.select("[onclick]"))
        buttons = page.select("#templates-dialog [data-copy]")
        self.assertEqual(len(buttons), 4)
        for button in buttons:
            target = page.select_one("#" + button["data-copy"])
            self.assertIn("Rol:", target.get_text())
            self.assertIn("sin información personal", button["data-copy-message"])

    def test_html_serializa_nodos_y_admite_vacios(self):
        node = BeautifulSoup("<strong>Fuente</strong>", "html.parser").strong
        self.assertEqual(self.call_production_function("html", node), "<strong>Fuente</strong>")
        self.assertEqual(self.call_production_function("html", None), "")

    def test_module_page_muestra_descargas_y_rutas_para_todos_los_modulos(self):
        for index, spec in enumerate(BUILD_COURSE.MODULES):
            next_id = BUILD_COURSE.MODULES[index + 1][0] if index < len(BUILD_COURSE.MODULES) - 1 else "portafolio"
            page = self.call_production_function("module_page", spec, next_id)
            parsed = BeautifulSoup(page, "html.parser")
            cards = parsed.select("article.challenge-card")
            self.assertTrue(cards, spec[0])
            for card in cards:
                materials = card.select_one(".challenge-materials")
                self.assertIsNotNone(materials, card["id"])
                self.assertIs(materials.find_parent(attrs={"data-challenge-stage": "0"}), card.select_one('[data-challenge-stage="0"]'))
                self.assertEqual(len(card.select('[data-challenge-stage]')), 4)
                if BUILD_COURSE.CHALLENGE_MATERIALS[card["id"]]:
                    self.assertTrue(card.select("a.challenge-download[download]"), card["id"])
                else:
                    self.assertFalse(card.select("a.challenge-download[download]"), card["id"])
                self.assertIn("Archivos para resolver este reto", card.get_text(" ", strip=True))
                self.assertTrue(card.select_one("a.ai-kit-primary[href$='.zip']"), card["id"])
                self.assertTrue(any(prod in card.get_text(" ", strip=True) for prod in ("Canva", "PDF", "Word", "Excel")), card["id"])
                self.assertIsNotNone(card.select_one(".decision-compass-panel"), card["id"])
                self.assertIsNone(card.select_one(".prompt-2clicks-container"), card["id"])
                self.assertIsNone(card.select_one(f'[data-copy="{card["id"]}-prompt-seguro"]'), card["id"])
                self.assertIsNone(card.select_one(f'[data-copy="{card["id"]}-prompt-produccion"]'), card["id"])
            observe = parsed.select_one('[data-panel="observa"]')
            practice = observe.select_one('[data-simulator="case-practice"]')
            self.assertIsNotNone(practice, spec[0])
            self.assertEqual(len(practice.select('[data-case-stage]')), 4)
            self.assertTrue(practice.select_one('[data-case-source] a[download]'))
            self.assertFalse(observe.select('video, .media-panel'))
            self.assertEqual(len(practice.select('[data-knowledge-check]')), 2)
            self.assertTrue(practice.select_one('[data-case-solution] [data-ai-cycle]'))

    def test_todos_los_retos_tienen_un_paquete_completo_con_guia_y_archivos(self):
        for index, spec in enumerate(BUILD_COURSE.MODULES):
            next_id = BUILD_COURSE.MODULES[index + 1][0] if index < len(BUILD_COURSE.MODULES) - 1 else "portafolio"
            page = self.call_production_function("module_page", spec, next_id)
            parsed = BeautifulSoup(page, "html.parser")
            for challenge_id, materials in BUILD_COURSE.CHALLENGE_MATERIALS.items():
                card = parsed.select_one(f"#{challenge_id}")
                if card is None:
                    continue
                package_path = ROOT / "materiales" / "ia" / f"{challenge_id}.zip"
                self.assertTrue(package_path.is_file(), f"{challenge_id}: no se generó el paquete")
                with ZipFile(package_path) as package:
                    names = set(package.namelist())
                    self.assertTrue(all(item.date_time == (2026, 10, 19, 0, 0, 0) for item in package.infolist()), 'Los paquetes deben ser reproducibles al reconstruir la guía en CI.')
                    expected = {"fuentes/" + Path(item["href"]).name for item in materials}
                    self.assertTrue(expected <= names, challenge_id)
                    self.assertIn("LEEME.html", names)
                    self.assertIn("ENCARGO-CHAT.md", names)
                    self.assertIn("ENCARGO-IDE.md", names)
                    instructions = BeautifulSoup(package.read("LEEME.html").decode("utf-8"), "html.parser").get_text(" ", strip=True)
                    for material in materials:
                        filename = Path(material["href"]).name
                        self.assertEqual(
                            package.read("fuentes/" + filename),
                            (ROOT / material["href"]).read_bytes(),
                            f"{challenge_id}: {filename} debe coincidir con la descarga individual",
                        )
                self.assertRegex(instructions, r"(?i)Cómo trabajar", challenge_id)
                self.assertRegex(instructions, r"(?i)Archivos incluidos", challenge_id)
                self.assertIn(card.select_one("h3").get_text(" ", strip=True), instructions, challenge_id)
                for material in materials:
                    self.assertIn(Path(material["href"]).name, instructions, challenge_id)
                self.assertIn("Comprobaciones antes de conservar", instructions, challenge_id)
                prompt = card.select_one('[data-ai-task]')
                if prompt:
                    prompt_text = " ".join(" ".join(pre.get_text(' ', strip=True) for pre in prompt.select('pre')).split())
                    self.assertIn(prompt_text, " ".join(instructions.split()), challenge_id)
                    self.assertIn('asistente de aprendizaje', instructions, challenge_id)
                self.assertFalse(card.select_one("a.challenge-package-download"), challenge_id)
        shared = json.loads((ROOT / "content" / "shared-challenge-materials.json").read_text(encoding="utf-8"))
        with ZipFile(ROOT / "materiales" / "ia" / "recursos-compartidos.zip") as package:
            self.assertEqual(set(package.namelist()), {"fuentes/" + Path(item["href"]).name for item in shared})
        published = BeautifulSoup((ROOT / "index.html").read_text(encoding="utf-8"), "html.parser")
        self.assertEqual(len(published.select('a[href="materiales/ia/recursos-compartidos.zip"]')), 1)

    def test_retirar_paquetes_antiguos_conserva_archivos_ajenos(self):
        with TemporaryDirectory(dir=ROOT / "output") as directory:
            root = Path(directory)
            old = root / "materiales" / "retos" / "paquetes"
            old.mkdir(parents=True)
            (old / "reto-0.zip").write_bytes(b"copia anterior")
            (old / "nota-del-instructor.txt").write_text("Conservar", encoding="utf-8")
            removed = self.call_production_function("remove_duplicate_challenge_packages", root)
            self.assertEqual(removed, 1)
            self.assertFalse((old / "reto-0.zip").exists())
            self.assertEqual((old / "nota-del-instructor.txt").read_text(encoding="utf-8"), "Conservar")

    def test_las_hojas_del_curso_se_sirven_en_un_solo_archivo_con_el_mismo_orden(self):
        shell = (ROOT / "content" / "shell.html").read_text(encoding="utf-8")
        block = shell.split("<!-- css-bundle:start -->", 1)[1].split("<!-- css-bundle:end -->", 1)[0]
        sources = [link["href"].split("?")[0] for link in BeautifulSoup(block, "html.parser").select('link[rel="stylesheet"]')]
        self.assertGreaterEqual(len(sources), 10)
        with TemporaryDirectory(dir=ROOT / "output") as directory:
            target = Path(directory) / "course.css"
            published = self.call_production_function("bundle_styles", shell, target)
            css = target.read_text(encoding="utf-8")
            positions = [css.index("/* " + source + " */") for source in sources]
            self.assertEqual(positions, sorted(positions))
            for source in sources:
                self.assertIn((ROOT / source).read_text(encoding="utf-8").lstrip("﻿").strip(), css)
            links = [link["href"] for link in BeautifulSoup(published, "html.parser").select('link[rel="stylesheet"]')]
            bundle = [href for href in links if href.startswith("css/course.css?v=")]
            self.assertEqual(len(bundle), 1)
            self.assertRegex(bundle[0], r"\?v=\d+$")
            self.assertFalse(set(sources) & {href.split("?")[0] for href in links})
            self.assertIn("css/guide-reading.css", " ".join(links))
            self.assertEqual(self.call_production_function("bundle_styles", shell, target), published)
        index = BeautifulSoup((ROOT / "index.html").read_text(encoding="utf-8"), "html.parser")
        served = [link["href"].split("?")[0] for link in index.select('link[rel="stylesheet"]')]
        self.assertIn("css/course.css", served)
        self.assertLessEqual(len(served), 6)

    def test_cada_recurso_local_cambia_de_version_cuando_cambia_su_contenido(self):
        html = '<link rel="stylesheet" href="css/tokens.css?v=1"><script defer src="js/course-mode.js?v=2"></script><script src="https://ejemplo.test/a.js?v=3"></script><link href="css/no-existe.css?v=4">'
        versioned = self.call_production_function("version_assets", html)
        for asset in ("css/tokens.css", "js/course-mode.js"):
            digest = str(int(hashlib.sha256((ROOT / asset).read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:12], 16))
            self.assertIn(asset + "?v=" + digest, versioned)
        self.assertIn("https://ejemplo.test/a.js?v=3", versioned)
        self.assertIn("css/no-existe.css?v=4", versioned)
        index = BeautifulSoup((ROOT / "index.html").read_text(encoding="utf-8"), "html.parser")
        for node in index.select('script[src^="js/"], link[href^="css/"]'):
            url = node.get("src") or node.get("href")
            path, version = url.split("?v=")
            self.assertEqual(version, self.call_production_function("content_version", ROOT / path), path)

    def test_la_version_no_depende_del_final_de_linea_de_la_copia_local(self):
        with TemporaryDirectory(dir=ROOT / "output") as directory:
            lf, crlf, changed = Path(directory) / "lf.js", Path(directory) / "crlf.js", Path(directory) / "changed.js"
            lf.write_bytes(b"const a = 1;\nconst b = 2;\n")
            crlf.write_bytes(b"const a = 1;\r\nconst b = 2;\r\n")
            changed.write_bytes(b"const a = 1;\nconst b = 3;\n")
            version = self.call_production_function("content_version", lf)
            self.assertEqual(version, str(int(hashlib.sha256(b"const a = 1;\nconst b = 2;\n").hexdigest()[:12], 16)))
            self.assertEqual(self.call_production_function("content_version", crlf), version)
            self.assertNotEqual(self.call_production_function("content_version", changed), version)

    def test_main_genera_una_pagina_consistente_y_cubre_todas_las_funciones(self):
        output = ROOT / "index.html"
        before = output.read_text(encoding="utf-8")
        result = self.call_production_function("main")
        after = output.read_text(encoding="utf-8")
        self.assertIsNone(result)
        self.assertEqual(after, before)
        parsed = BeautifulSoup(after, "html.parser")
        self.assertEqual(len(parsed.select("article.challenge-card")), len(BUILD_COURSE.CHALLENGE_MATERIALS))


    def test_z_todas_las_funciones_de_produccion_tienen_pruebas(self):
        self.assertEqual(self.call_production_function("html", None), "")
        for index, spec in enumerate(BUILD_COURSE.MODULES):
            next_id = BUILD_COURSE.MODULES[index + 1][0] if index < len(BUILD_COURSE.MODULES) - 1 else "portafolio"
            page = self.call_production_function("module_page", spec, next_id)
            self.assertIn("Archivos para resolver este reto", page)
            self.assertTrue(any(prod in page for prod in ("Canva", "PDF", "Word", "Excel")), spec[0])
        self.call_production_function("main")
        production_functions = {
            name for name, value in vars(BUILD_COURSE).items()
            if inspect.isfunction(value) and value.__module__ == BUILD_COURSE.__name__
        }
        self.assertEqual(self.covered_functions, production_functions)



if __name__ == "__main__":
    unittest.main()
