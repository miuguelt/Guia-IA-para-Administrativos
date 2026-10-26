"""Pruebas del generador de situaciones de oficina, aprendizaje con IA y manual."""
import copy
import importlib.util
import inspect
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest import mock
from urllib.parse import unquote

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("sync_situations_test_target", ROOT / "scripts" / "sync-html-situations.py")
SYNC = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SYNC)


class OfficeSituationsTests(unittest.TestCase):
    covered = set()

    def call(self, name, *args, **kwargs):
        self.covered.add(name)
        return getattr(SYNC, name)(*args, **kwargs)

    def setUp(self):
        self.data = self.call("load")

    def test_carga_valida_campos_iconos_y_relacion_con_el_reto(self):
        self.assertEqual(len(self.data["situations"]), 12)
        broken = copy.deepcopy(self.data)
        broken["situations"][0]["icon"] = "🏛️"
        with TemporaryDirectory() as directory:
            path = Path(directory) / "catalogo.json"
            path.write_text(json.dumps(broken, ensure_ascii=False), encoding="utf-8")
            with self.assertRaises(AssertionError):
                self.call("load", path)
            broken["situations"][0]["icon"] = "comite"
            broken["situations"][0]["challengeLink"] = None
            path.write_text(json.dumps(broken, ensure_ascii=False), encoding="utf-8")
            with self.assertRaises(AssertionError):
                self.call("load", path)

    def test_separa_oficina_y_aprendizaje_y_dibuja_iconos_decorativos(self):
        office, learning = self.call("split", self.data["situations"])
        self.assertEqual((len(office), len(learning)), (8, 4))
        svg = BeautifulSoup(self.call("icon", "tabla"), "html.parser").svg
        self.assertEqual(svg["aria-hidden"], "true")
        self.assertEqual(svg["stroke"], "currentColor")

    def test_parrafos_escapan_texto_y_conservan_saltos(self):
        html = self.call("paragraphs", "Uno <b>\nDos\n\nTres")
        self.assertEqual(html, "<p>Uno &lt;b&gt;<br>Dos</p><p>Tres</p>")

    def test_enlace_distingue_practica_tecnica_relacionada_y_ausencia_de_reto(self):
        items = {item["id"]: item for item in self.data["situations"]}
        self.assertIn("Practícala en", self.call("practice_link", items["actas-reunion"]))
        self.assertIn("Técnica relacionada en", self.call("practice_link", items["comites-evaluacion"]))
        self.assertEqual(self.call("practice_link", items["rutas-paso-a-paso"]), "")

    def test_ficha_e_instruccion_usan_rotulos_sobrios_y_el_boton_generico_de_copia(self):
        item = self.data["situations"][3]
        prompt = BeautifulSoup(self.call("prompt_block", item, "x-"), "html.parser")
        button = prompt.select_one("[data-copy]")
        self.assertEqual(button["data-copy"], "x-prompt-pqrs-urgentes")
        self.assertEqual(prompt.select_one("pre")["id"], "x-prompt-pqrs-urgentes")
        panel = BeautifulSoup(self.call("detail_panel", item), "html.parser")
        self.assertEqual([dt.get_text() for dt in panel.select("dt")], ["Herramienta sugerida", "Cuidado de datos", "Exactitud"])
        self.assertEqual(panel.article["data-situation-detail"], "pqrs-urgentes")
        manual = BeautifulSoup(self.call("detail_panel", item, prefix="manual-", heading="h4"), "html.parser")
        self.assertEqual(manual.article["id"], "manual-pqrs-urgentes")
        self.assertIsNone(manual.article.get("data-situation-detail"))
        self.assertTrue(manual.select_one("h4"))

    def test_selector_aprendizaje_y_manual_son_coherentes_con_el_catalogo(self):
        office, learning = self.call("split", self.data["situations"])
        selector = BeautifulSoup(self.call("selector_html", office), "html.parser")
        self.assertEqual([button.get_text(" ", strip=True) for button in selector.select("[data-situation-filter]")], ["Todas 8", "Gestión de sede 4", "Gestión documental 4"])
        self.assertEqual(len(selector.select("[aria-pressed='true'][data-situation-id]")), 1)
        self.assertEqual(len(selector.select("[data-situation-detail]")), 8)
        cards = BeautifulSoup(self.call("learning_html", learning), "html.parser")
        self.assertEqual(len(cards.select(".learning-ai-card")), 4)
        self.assertEqual(len(cards.select(".learning-ai-example")), 4)
        without_example = copy.deepcopy(learning[:1])
        without_example[0].pop("learningExample")
        self.assertFalse(BeautifulSoup(self.call("learning_html", without_example), "html.parser").select(".learning-ai-example"))
        markdown = self.call("manual_markdown", self.data)
        self.assertEqual(markdown.count("\n### "), 12)
        self.assertIn("Técnica relacionada", markdown)
        self.assertIn("Se practica en", markdown)
        manual = BeautifulSoup(self.call("manual_html", office, learning, markdown), "html.parser")
        link = manual.select_one("a[download]")
        self.assertEqual(unquote(link["href"].split(",", 1)[1]), markdown)
        self.assertEqual(len(manual.select(".manual-item-card")), 12)

    def test_regiones_marcadas_se_reemplazan_y_fallan_si_faltan(self):
        text = "a<!-- situaciones:selector -->viejo<!-- /situaciones:selector -->b"
        self.assertEqual(self.call("replace_region", text, "selector", "nuevo"), "a<!-- situaciones:selector -->nuevo<!-- /situaciones:selector -->b")
        with self.assertRaises(AssertionError):
            self.call("replace_region", "sin marcadores", "selector", "x")

    def test_las_paginas_publicadas_coinciden_con_el_generador(self):
        home = (ROOT / "content" / "home.html").read_text(encoding="utf-8")
        portfolio = (ROOT / "content" / "portfolio.html").read_text(encoding="utf-8")
        rendered_home, rendered_portfolio = self.call("render", home, portfolio, self.data)
        self.assertEqual(rendered_home, home, "Ejecuta python scripts/sync-html-situations.py")
        self.assertEqual(rendered_portfolio, portfolio, "Ejecuta python scripts/sync-html-situations.py")

    def test_escritura_conserva_el_final_de_linea_y_main_actualiza_las_paginas(self):
        with TemporaryDirectory() as directory:
            crlf, lf = Path(directory) / "crlf.html", Path(directory) / "lf.html"
            crlf.write_bytes(b"a\r\nb\r\n")
            self.call("write_preserving_newlines", crlf, "x\ny\n")
            self.call("write_preserving_newlines", lf, "x\ny\n")
            self.assertEqual(crlf.read_bytes(), b"x\r\ny\r\n")
            self.assertEqual(lf.read_bytes(), b"x\ny\n")
            content = Path(directory) / "content"
            content.mkdir()
            for name in ("home.html", "portfolio.html"):
                (content / name).write_bytes((ROOT / "content" / name).read_bytes())
            with mock.patch.object(SYNC, "CONTENT", content), mock.patch("builtins.print"):
                self.call("main")
            self.assertEqual((content / "home.html").read_bytes(), (ROOT / "content" / "home.html").read_bytes())

    @classmethod
    def tearDownClass(cls):
        functions = {name for name, value in vars(SYNC).items() if inspect.isfunction(value) and value.__module__ == SYNC.__name__}
        missing = functions - cls.covered
        assert not missing, f"Funciones sin prueba: {sorted(missing)}"


if __name__ == "__main__":
    unittest.main()
