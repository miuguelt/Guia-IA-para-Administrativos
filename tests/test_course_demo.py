"""Comprueba la demostración breve de Inicio: datos de práctica, encargo copiable y ejemplo verificable."""
import copy
import importlib.util
import inspect
import json
from pathlib import Path
import re
import unittest

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("course_demo", ROOT / "scripts/course_demo.py")
DEMO = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(DEMO)
SPEC_DATA = json.loads((ROOT / "content/prompt-coach.json").read_text(encoding="utf-8"))["demo"]


class CourseDemoTests(unittest.TestCase):
    covered = set()

    def call(self, name, *args, **kwargs):
        result = getattr(DEMO, name)(*args, **kwargs)
        self.covered.add(name)
        return result

    def test_lee_los_mensajes_despues_del_titulo_y_los_avisos(self):
        messages = self.call("load_messages", ROOT / SPEC_DATA["source"], 12)
        self.assertEqual([item["Código"] for item in messages], [f"C-{n:03}" for n in range(1, 13)])
        self.assertEqual(messages[0]["Plazo"], "Hoy 16:00")
        self.assertEqual(messages[4]["Personas afectadas"], "80")
        self.assertEqual(len(self.call("load_messages", ROOT / SPEC_DATA["source"], 3)), 3)

    def test_el_encargo_incluye_los_doce_mensajes_y_sus_limites(self):
        messages = self.call("load_messages", ROOT / SPEC_DATA["source"], 12)
        prompt = self.call("demo_prompt", SPEC_DATA, messages)
        for item in messages:
            self.assertIn(f"{item['Código']} | {item['Asunto']}", prompt)
        self.assertNotIn("{mensajes}", prompt)
        for part in ("Contexto:", "Rol:", "Tarea:", "Tono:", "Límites:"):
            self.assertIn(part, prompt)
        self.assertRegex(prompt, r"no contienen datos reales")
        self.assertRegex(prompt, r"(?i)no inventes")

    def test_la_demostracion_se_copia_y_su_ejemplo_coincide_con_la_fuente(self):
        markup = self.call("render_demo")
        page = BeautifulSoup(markup, "html.parser")
        section = page.select_one("section#demo-inicio")
        self.assertIsNotNone(section)
        prompt = section.select_one("pre#demo-inicio-prompt")
        button = section.select_one("button[data-copy]")
        self.assertEqual(button["data-copy"], "demo-inicio-prompt")
        self.assertRegex(button["data-copy-message"], r"chat de IA")
        self.assertNotRegex(button["data-copy-message"], r"IDE|adjunta")
        self.assertIn("C-012", prompt.get_text())
        self.assertTrue(prompt.find_parent("details"), "El mensaje largo queda plegado; el botón lo copia completo")
        self.assertRegex(section.get_text(" ", strip=True), r"no contienen datos reales")
        self.assertTrue(section.select_one('a[href="#reto-4"]'))
        rows = {item["Código"]: item for item in self.call("load_messages", ROOT / SPEC_DATA["source"], SPEC_DATA["count"])}
        sample = section.select("tbody tr")
        self.assertEqual(len(sample), 3)
        for row in sample:
            code, _, reason = [cell.get_text(" ", strip=True) for cell in row.select("th, td")]
            self.assertIn(code, rows)
            source = " ".join(rows[code].values())
            for number in re.findall(r"\d+(?::\d+)?", reason):
                self.assertIn(number, source, f"{code}: {number} no está en el mensaje")
        self.assertNotRegex(section.get_text(" ", strip=True), r"(?i)ahorr(a|arás)\s+\d")

    def test_rechaza_un_ejemplo_que_cita_un_mensaje_ausente(self):
        broken = copy.deepcopy(SPEC_DATA)
        broken["sample"][0][0] = "C-049"
        with self.assertRaisesRegex(ValueError, "C-049"):
            self.call("render_demo", broken)
        escaped = copy.deepcopy(SPEC_DATA)
        escaped["title"] = "<b>Prueba</b> & error"
        markup = self.call("render_demo", escaped)
        self.assertIn("&lt;b&gt;Prueba&lt;/b&gt; &amp; error", markup)

    @classmethod
    def tearDownClass(cls):
        production = {name for name, item in inspect.getmembers(DEMO, inspect.isfunction) if item.__module__ == DEMO.__name__}
        if production != cls.covered:
            raise AssertionError("Funciones sin prueba con aserciones: " + str(production - cls.covered))


if __name__ == "__main__":
    unittest.main()
