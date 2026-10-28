"""Comprueba la instrucción visible, el bloque técnico y los apoyos para escribir en el chat."""
import copy
import importlib.util
import inspect
import json
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("ai_prompts", ROOT / "scripts/ai_prompts.py")
PROMPTS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PROMPTS)
CATALOG = json.loads((ROOT / "content/ai-task-briefs.json").read_text(encoding="utf-8"))
COACH = json.loads((ROOT / "content/prompt-coach.json").read_text(encoding="utf-8"))
SUPPORT = {
    **{f"reto-{i}": "comentado" for i in range(3)},
    **{f"reto-{i}": "huecos" for i in range(3, 7)},
    **{f"reto-{i}": "propio" for i in range(7, 10)},
    "reto-integrador": "propio",
}


class AiPromptsTests(unittest.TestCase):
    covered = set()

    def call(self, name, *args, **kwargs):
        result = getattr(PROMPTS, name)(*args, **kwargs)
        self.covered.add(name)
        return result

    def test_los_retos_retiran_el_apoyo_de_forma_gradual(self):
        catalog = self.call("load_catalog")
        briefed = {key for key, task in catalog.items() if self.call("has_brief", task)}
        self.assertEqual(briefed, set(SUPPORT))
        for key, level in SUPPORT.items():
            self.assertEqual(catalog[key]["brief"]["apoyo"], level, key)
        names = [catalog[key]["brief"]["tecnica"]["nombre"] for key in SUPPORT]
        self.assertEqual(len(names), len(set(names)), "Cada reto practica una técnica distinta")
        self.assertFalse(self.call("has_brief", catalog["MG-A01"]))

    def test_la_instruccion_visible_muestra_las_partes_crtt_y_la_tecnica(self):
        task = CATALOG["reto-4"]
        text = self.call("visible_text", task)
        lines = text.split("\n")
        self.assertEqual([line.split(":", 1)[0] for line in lines],
                         ["Contexto", "Rol", "Tarea", "Tono", "Límites", "Técnica · Pide que la IA pregunte antes"])
        self.assertTrue(lines[0].startswith("Contexto: Adjunto correos-50.csv"))
        for key in SUPPORT:
            words = len(self.call("visible_text", CATALOG[key]).split())
            self.assertTrue(70 <= words <= 150, f"{key}: {words} palabras")

    def test_el_bloque_tecnico_conserva_el_encargo_completo_y_pide_comparar(self):
        task = CATALOG["reto-4"]
        chat = self.call("technical_block", task)
        ide = self.call("technical_block", task, "ide")
        self.assertTrue(chat.startswith(COACH["technicalHeading"]))
        self.assertIn("«Mi intento y la referencia»", chat)
        self.assertIn("al comienzo del campo uso_ia_y_revision", chat)
        self.assertTrue(chat.endswith(task["chatPrompt"]))
        self.assertTrue(ide.endswith(task["idePrompt"]))
        copied = self.call("copy_text", task)
        self.assertEqual(copied, self.call("visible_text", task) + "\n\n" + chat)
        self.assertEqual(self.call("copy_text", task, "ide"), self.call("visible_text", task) + "\n\n" + ide)
        for code in re.findall(r"\b(?:C-\d{3}|SIM-\d{4}|SIM-CT-\d{3}|PC-\d{2}|FL-\d{2}|URG-\d{2}|OI-\d)\b", " ".join(task["checks"])):
            self.assertIn(code, copied)

    def test_el_entrenador_revisa_sin_ejecutar_y_usa_la_tecnica_del_reto(self):
        task = CATALOG["reto-7"]
        text = self.call("coach_text", task)
        self.assertIn(task["brief"]["meta"], text)
        self.assertIn("«Descompón en pasos y condiciones»", text)
        self.assertIn("No la ejecutes todavía", text)
        self.assertNotIn("{", text)

    def test_la_plantilla_solo_existe_en_el_nivel_con_huecos(self):
        self.assertEqual(self.call("template_text", CATALOG["reto-4"]), "\n".join(CATALOG["reto-4"]["brief"]["huecos"]))
        self.assertEqual(self.call("template_text", CATALOG["reto-0"]), "")
        self.assertEqual(self.call("template_text", CATALOG["reto-8"]), "")

    def test_el_ajuste_usa_las_comprobaciones_propias_del_reto(self):
        task = CATALOG["reto-6"]
        text = self.call("repair_text", task)
        for index, check in enumerate(task["checks"], 1):
            self.assertIn(f"{index}) {check}", text)
        self.assertIn("página completa", text)
        self.assertNotIn("{", text)

    def test_el_campo_de_comparacion_es_el_registro_de_uso(self):
        self.assertEqual(self.call("comparison_field", CATALOG["reto-4"]), "uso_ia_y_revision")
        self.assertEqual(self.call("comparison_field", {"fieldKeys": ["a", "b"]}), "b")

    def test_la_validacion_explica_cada_brief_incompleto(self):
        base = copy.deepcopy(CATALOG["reto-3"])
        self.assertIsNone(self.call("validate_brief", "reto-3", base))
        cases = [
            ("apoyo", lambda b: b.update(apoyo="libre"), "nivel de apoyo"),
            ("parte", lambda b: b.pop("tono"), "tono"),
            ("huecos", lambda b: b.update(huecos=["Rol: actúa como asistente."]), "___"),
            ("corchetes", lambda b: b.update(huecos=["Rol: [escribe tu rol] ___"]), "corchetes"),
            ("notas", lambda b: b.update(notas={"contexto": "x"}), "notas"),
            ("largo", lambda b: b.update(tarea="palabra " * 200), "palabras"),
            ("tecnica", lambda b: b.update(tecnica={"nombre": "X"}), "técnica"),
        ]
        for label, change, message in cases:
            task = copy.deepcopy(base)
            change(task["brief"])
            with self.assertRaisesRegex(ValueError, message, msg=label):
                PROMPTS.validate_brief("reto-3", task)
        commented = copy.deepcopy(CATALOG["reto-0"])
        commented["brief"].pop("notas")
        with self.assertRaisesRegex(ValueError, "notas"):
            PROMPTS.validate_brief("reto-0", commented)

    @classmethod
    def tearDownClass(cls):
        production = {name for name, item in inspect.getmembers(PROMPTS, inspect.isfunction) if item.__module__ == PROMPTS.__name__}
        if production != cls.covered:
            raise AssertionError("Funciones sin prueba con aserciones: " + str(production - cls.covered))


if __name__ == "__main__":
    unittest.main()
