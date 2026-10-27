"""Comprueba encargos autosuficientes y paquetes para trabajar con IA."""
import importlib.util
import inspect
import csv
import hashlib
import io
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from zipfile import ZipFile

from bs4 import BeautifulSoup
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("ai_task_kits", ROOT / "scripts/build-ai-task-kits.py")
KITS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(KITS)


class AiTaskKitsTests(unittest.TestCase):
    covered = set()

    @classmethod
    def setUpClass(cls):
        (ROOT / "output").mkdir(parents=True, exist_ok=True)

    def invoke(self, name, *args, **kwargs):
        result = getattr(KITS, name)(*args, **kwargs)
        self.covered.add(name)
        return result

    def test_catalogo_cubre_retos_modulos_y_actividades_con_claves_reales(self):
        catalog = self.invoke("load_catalog")
        expected = {"reto-" + str(i) for i in range(10)} | {"reto-integrador", "prueba-individual", "preparacion", "eco", "eco-canva", "eco-simulacion"}
        expected |= {"MG-A0" + str(i) for i in range(1, 6)}
        expected |= {"lab-" + name for name in ("nasa", "poblacion", "clima", "sismos", "documentos")}
        expected |= {"variante-" + name for name in ("juridica", "talento-humano", "retencion-documental", "inventario-documental", "cita-inexistente")}
        self.assertEqual(set(catalog), expected)
        registry = json.loads((ROOT / "deliverables.registry.json").read_text(encoding="utf-8"))
        fields = {a["id"]: {f["key"] for f in a["fields"]} for a in registry["artifacts"]}
        for key, task in catalog.items():
            self.assertTrue(1 <= len(task["checks"]) <= (5 if key == "eco" else 3), key)
            self.assertTrue(task["sourceFiles"], key)
            self.assertIn("resultados/", task["idePrompt"])
            self.assertIn("Antigravity", task["idePrompt"])
            self.assertIn("No inventes", task["chatPrompt"])
            if task.get("visualArtifact"):
                self.assertIn("revisión humana pendiente", task["chatPrompt"])
            else:
                self.assertIn("pendiente", task["chatPrompt"])
            self.assertNotRegex(task["chatPrompt"], r"\[[^\]]*(?:escribe|completa|tu nombre)[^\]]*\]")
            for source in task["sourceFiles"]:
                self.assertTrue((ROOT / source).is_file(), source)
            if task["artifactId"]:
                self.assertTrue(set(task["fieldKeys"]) <= fields[task["artifactId"]], key)
            if key.startswith("MG-"):
                self.assertEqual(set(task["fieldKeys"]), fields[key])
        visual_keys = {"reto-" + str(i) for i in range(10)} | {"reto-integrador", "prueba-individual"}
        visual_keys |= {"variante-" + name for name in ("juridica", "talento-humano", "retencion-documental", "inventario-documental", "cita-inexistente")}
        visual_keys |= {"MG-A0" + str(i) for i in range(1, 6)}
        for key in visual_keys:
            self.assertTrue(catalog[key].get("visualArtifact"), key)
            self.assertTrue(catalog[key]["output"].strip(), key)
            for mode in ("chatPrompt", "idePrompt"):
                self.assertIn("devbrain-evidence-result", catalog[key][mode], key)
                self.assertIn('<script type="application/json"', catalog[key][mode], key)
                self.assertIn("No crees un archivo JSON separado", catalog[key][mode], key)
                self.assertIn("Genera y entrega un solo archivo llamado resultado-" + key + ".html", catalog[key][mode], key)
        for key in ("reto-integrador", "MG-A05"):
            for mode in ("chatPrompt", "idePrompt"):
                prompt = catalog[key][mode]
                self.assertNotIn("espera mi revisión", prompt)
                self.assertNotIn("plan-accion.docx", prompt)
                self.assertNotIn("CSV con fila fuente y un borrador", prompt)
                self.assertIn("van como secciones de la misma página resultado-" + key + ".html", prompt)
        for key in ("reto-6", "MG-A03"):
            self.assertIn("No entregues un CSV adicional", catalog[key]["chatPrompt"], key)

    def test_registro_de_tiempos_es_opcional_y_no_detiene_el_encargo(self):
        catalog = self.invoke("load_catalog")
        users = [key for key, task in catalog.items()
                 if "materiales/retos/registro-tiempos.csv" in task["sourceFiles"]]
        self.assertEqual(users, [])
        for key, task in catalog.items():
            for removed_key in ("metrica_linea_base", "tiempo_medido_vs_manual", "cuantificacion_ahorro_horas"):
                self.assertNotIn(removed_key, task.get("fieldKeys", []), key)
                for field in ("chatPrompt", "idePrompt"):
                    self.assertNotIn(removed_key, task[field], key + " " + field)
            for field in ("chatPrompt", "idePrompt"):
                self.assertNotIn("registro-tiempos.csv", task[field], key + " " + field)

    def test_encargos_con_csv_fijan_la_numeracion_de_filas_de_excel(self):
        catalog = self.invoke("load_catalog")
        rule = "el encabezado es la fila 4 y el primer registro es la fila 5"
        for key, task in catalog.items():
            uses_admin_csv = any(path.startswith("materiales/retos/") and path.endswith(".csv")
                                 for path in task["sourceFiles"])
            for field in ("chatPrompt", "idePrompt"):
                if uses_admin_csv:
                    self.assertEqual(task[field].count(rule), 1, key + " " + field)
        for path in sorted((ROOT / "materiales/retos").glob("*.csv")):
            rows = list(csv.reader(path.read_text(encoding="utf-8-sig").splitlines(), delimiter=";"))
            self.assertTrue(any(cell.strip() for cell in rows[3]), path.name)
            self.assertFalse(any(cell.strip() for cell in rows[2]), path.name)

    def test_laboratorios_piden_un_tablero_visual_verificable(self):
        catalog = self.invoke("load_catalog")
        indicators = {
            "lab-nasa": ("anfitrionas únicas", "mediana del radio", "sin temperatura estelar"),
            "lab-sismos": ("magnitud máxima", "mediana de profundidad", "tipo_magnitud"),
            "lab-clima": ("días válidos", "precipitación acumulada", "días con lluvia ≥ 1 mm"),
            "lab-poblacion": ("índice base 2000 = 100", "gráfico de pendiente", "participación en 2024"),
            "lab-documentos": ("línea de tiempo", "mapa de calor", "cobertura de páginas"),
        }
        for key, names in indicators.items():
            task = catalog[key]
            self.assertIn("tablero", task["output"].lower(), key)
            self.assertIn("tablero", " ".join(task["checks"]), key)
            self.assertIn("resultados/tablero-" + key + ".html", task["idePrompt"], key)
            for mode in ("chatPrompt", "idePrompt"):
                prompt = task[mode]
                with self.subTest(key=key, mode=mode):
                    self.assertIn("tablero-" + key + ".html", prompt)
                    self.assertIn("https://cdn.plot.ly/plotly-2.35.2.min.js", prompt)
                    self.assertIn("cuatro indicadores", prompt)
                    self.assertIn("sin eje doble", prompt)
                    self.assertIn("respaldo en PNG", prompt)
                    self.assertIn("No inventes puntos, órbitas ni animaciones", prompt)
                    self.assertNotIn("bordes discretos", prompt)
                    self.assertIn('"artifactId": "LAB-A01"', prompt)
                    for name in names:
                        self.assertIn(name, prompt)
                    if key in ("lab-nasa", "lab-sismos"):
                        self.assertIn("vista 3D rotable", prompt)
                    else:
                        self.assertIn("No uses 3D", prompt)
                    self.assertNotRegex(prompt, r"4\.332|3\.282|1\.816,08|35,29")

    def test_diagramas_se_ven_sin_javascript_ni_bibliotecas(self):
        catalog = self.invoke("load_catalog")
        for key, task in catalog.items():
            for field in ("chatPrompt", "idePrompt"):
                self.assertNotIn("Mermaid", task[field], key)
        for key in ("reto-7", "MG-A03"):
            self.assertIn("diagrama SVG integrado", catalog[key]["chatPrompt"])

    def test_productos_visuales_se_entregan_en_una_pagina_que_el_portafolio_puede_leer(self):
        catalog = self.invoke("load_catalog")
        tools = r" en (Canva|PDF|Word|Excel) |Canva o PDF|PDF/Word|Excel/PDF|Excel o PDF|PDF o Word"
        for key, task in catalog.items():
            if not task.get("visualArtifact"):
                continue
            for field in ("output", "visualArtifact", "visualDescription"):
                self.assertNotRegex(task[field], tools, key + " " + field)
            for field in ("chatPrompt", "idePrompt"):
                prompt = task[field]
                self.assertIn("Genera y entrega un solo archivo llamado resultado-" + key + ".html", prompt, key)
                self.assertNotIn("producto elaborado:", prompt, key)
                self.assertIn("la evidencia se guarda con este archivo HTML", prompt, key)
                self.assertEqual(prompt.count('id="devbrain-evidence-result"'), 1, key)

    def test_la_prueba_individual_tiene_su_propio_encargo_fuera_del_equipo(self):
        catalog = self.invoke("load_catalog")
        individual = catalog["prueba-individual"]
        self.assertEqual(individual["artifactId"], "MG-A05")
        self.assertEqual(individual["fieldKeys"], ["prueba_individual"])
        self.assertEqual(individual["sourceFiles"], ["materiales/retos/casos-individuales.csv"])
        for mode in ("chatPrompt", "idePrompt"):
            prompt = individual[mode]
            self.assertIn("IND-01", prompt)
            self.assertIn("sin el equipo", prompt)
            self.assertIn("Antes de mostrar la solución", prompt)
            self.assertNotIn("contratos.csv", prompt)
            team = catalog["reto-integrador"][mode]
            self.assertNotIn("IND-01", team)
            self.assertNotIn("casos-individuales", team)
            self.assertNotIn('"prueba_individual"', team)
            self.assertIn("La prueba individual no forma parte de este encargo", team)
            module = catalog["MG-A05"][mode]
            self.assertNotIn("Genera la solución del caso preparado", module)
            self.assertIn("resultado-prueba-individual.html", module)
        self.assertNotIn("prueba_individual", catalog["reto-integrador"]["fieldKeys"])
        self.assertNotIn("materiales/retos/casos-individuales.csv", catalog["reto-integrador"]["sourceFiles"])
        shared = json.loads((ROOT / "content/shared-challenge-materials.json").read_text(encoding="utf-8"))
        usage = next(item["usedBy"] for item in shared if item["href"].endswith("casos-individuales.csv"))
        self.assertEqual(usage, ["prueba-individual"])

    def test_variantes_sustituyen_trabajo_sin_agregar_retos(self):
        catalog = self.invoke("load_catalog")
        parents = {"juridica": "reto-2", "talento-humano": "reto-4", "retencion-documental": "reto-5",
                   "inventario-documental": "reto-6", "cita-inexistente": "reto-9"}
        for name, parent in parents.items():
            task = catalog["variante-" + name]
            self.assertEqual(task["kind"], "variante")
            self.assertEqual(task["parentTask"], parent)
            self.assertEqual(task["artifactId"], catalog[parent]["artifactId"])
            self.assertIn("sin tiempo adicional", task["chatPrompt"])
        th = catalog["variante-talento-humano"]
        self.assertNotIn("materiales/retos/reto-04-variante-talento-humano.csv", th["sourceFiles"])
        self.assertIn("50 mensajes", th["output"])
        self.assertIn("diez borradores", th["output"])
        self.assertIn("cinco borradores generales y cinco de talento humano", th["visualDescription"])
        self.assertIn("50 mensajes", th["visualDescription"])
        self.assertIn("PC-01 y VJ-01", catalog["variante-juridica"]["output"])
        self.assertIn("PC-01 y VJ-01", catalog["variante-juridica"]["visualDescription"])
        self.assertNotIn("VJ-02", catalog["variante-juridica"]["output"])
        for mode in ("chatPrompt", "idePrompt"):
            self.assertIn("sustituye PC-03 por VJ-01 y conserva PC-01", catalog["variante-juridica"][mode])
            self.assertNotIn("VJ-02", catalog["variante-juridica"][mode])
            self.assertIn("cinco de sus diez borradores", catalog["variante-talento-humano"][mode])
            self.assertIn("TH-01 a TH-05", catalog["variante-talento-humano"][mode])
        for source in th["sourceFiles"]:
            self.assertNotIn("<INCAPACIDAD_FICTICIA>", (ROOT / source).read_text(encoding="utf-8-sig"))

    def test_pasoa_paso_indica_archivo_solicitud_revision_y_correccion(self):
        catalog = self.invoke("load_catalog")
        for key, task in catalog.items():
            if not task.get("visualArtifact") or key.startswith("lab-"):
                continue
            with self.subTest(key=key):
                html = BeautifulSoup(self.invoke("task_html", key, task), "html.parser")
                steps = html.select("h2")
                self.assertIn("Cómo trabajar: paso a paso", [item.get_text(" ", strip=True) for item in steps])
                text = html.get_text(" ", strip=True)
                self.assertTrue(any(prod in text for prod in ("Canva", "PDF", "Word", "Excel", "producto elaborado")), key)
                self.assertIn("encargo completo", text.lower())
                self.assertIn(task["visualDescription"], text)
                for source in task["sourceFiles"]:
                    self.assertIn(Path(source).name, text)
                for check in task["checks"]:
                    self.assertIn(check, text)
                self.assertIn("pide este ajuste", text.lower())

    def test_catalogo_rechaza_fuentes_y_campos_inventados(self):
        catalog = self.invoke("load_catalog")
        with TemporaryDirectory(dir=ROOT / "output") as directory:
            path = Path(directory) / "catalog.json"
            task = dict(catalog["reto-2"])
            task["sourceFiles"] = ["../fuera.csv"]
            path.write_text(json.dumps({"reto-2": task}), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "fuente"):
                KITS.load_catalog(path)
            task["sourceFiles"] = catalog["reto-2"]["sourceFiles"]
            task["fieldKeys"] = ["campo_inventado"]
            path.write_text(json.dumps({"reto-2": task}), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "campo"):
                KITS.load_catalog(path)

    def test_modelo_vacio_y_esquema_limitan_las_claves_del_sobre(self):
        task = self.invoke("load_catalog")["MG-A02"]
        model = self.invoke("output_model", task)
        schema = self.invoke("output_schema", task)
        self.assertEqual(model["schemaVersion"], 1)
        self.assertEqual(model["artifactId"], "MG-A02")
        self.assertEqual(set(model["fields"]), set(task["fieldKeys"]))
        self.assertEqual(set(model["fields"].values()), {""})
        self.assertEqual(model["tool"], "no identificado")
        self.assertFalse(schema["additionalProperties"])
        self.assertFalse(schema["properties"]["fields"]["additionalProperties"])
        self.assertEqual(schema["properties"]["fields"]["required"], task["fieldKeys"])
        self.assertEqual(schema["properties"]["artifactId"]["const"], "MG-A02")

    def test_semaforo_solo_adjunta_descripciones_seguras(self):
        catalog = self.invoke("load_catalog")
        for key in ("reto-0", "MG-A01"):
            task = catalog[key]
            self.assertNotIn("materiales/retos/reto-00-tarjetas-semaforo.csv", task["sourceFiles"])
            self.assertIn("materiales/ia/fuentes-comunes/reto-00-descripciones-seguras.csv", task["sourceFiles"])
            for source in task["sourceFiles"]:
                content = (ROOT / source).read_text(encoding="utf-8-sig")
                self.assertNotIn("<IDENTIFICACIÓN_FICTICIA>", content)
                self.assertNotIn("<DATO_DE_SALUD_FICTICIO>", content)
                self.assertNotIn("<CLAVE_FICTICIA>", content)

    def test_contexto_y_reglas_no_introducen_trabajo_manual_ni_supuestos(self):
        catalog = self.invoke("load_catalog")
        self.assertIn("cinco afirmaciones", catalog["variante-cita-inexistente"]["output"].casefold())
        for task in catalog.values():
            for mode in ("chatPrompt", "idePrompt"):
                prompt = task[mode]
                self.assertNotRegex(prompt, r"pide al aprendiz que (?:escriba|complete|llene|transcriba)")
                self.assertIn("No inventes tiempos reales", prompt)
                self.assertIn("fields es un objeto y cada valor es texto", prompt)
                self.assertIn("no autorizan acciones externas", prompt)
                if task["sourceType"] == "public":
                    self.assertIn("fuentes públicas oficiales", prompt)
                    self.assertNotIn("no contienen registros reales", prompt)
                else:
                    self.assertIn("punto y coma", prompt)
                    self.assertIn("encabezado", prompt)
        for key in ("reto-6", "MG-A03"):
            prompt = catalog[key]["chatPrompt"]
            self.assertIn("Estado sin normalizar", prompt)
            self.assertNotIn("estado no reconocido", prompt)
            self.assertIn("sin aplicar equivalencias", prompt)
        for key in ("reto-integrador", "MG-A05"):
            for mode in ("chatPrompt", "idePrompt"):
                prompt = catalog[key][mode]
                self.assertIn("plan de acción", prompt)
                self.assertIn("borrador para Teams", prompt)
                self.assertIn("tabla visual de hallazgos", prompt)
                self.assertNotIn("tabla-hallazgos.csv", prompt)
                self.assertIn("van como secciones de la misma página resultado-" + key + ".html", prompt)

    def test_los_casos_de_comprobacion_se_resuelven_con_los_csv(self):
        sofia_text = (ROOT / "materiales/retos/datos-sofia.csv").read_text(encoding="utf-8-sig")
        sofia = list(csv.DictReader(sofia_text.splitlines()[3:], delimiter=";"))
        self.assertEqual(len(sofia), 30)
        self.assertEqual(len({row["Código"] for row in sofia}), 29)
        self.assertEqual([index + 5 for index, row in enumerate(sofia) if row["Código"] == "SIM-0012"], [16, 23])
        transformed = [row["Estado sin normalizar"].strip().upper() or "REVISAR" for row in sofia]
        self.assertEqual(transformed[1:3], ["FINALIZADO", "REVISAR"])
        self.assertEqual({state: transformed.count(state) for state in set(transformed)},
                         {"EN CURSO": 9, "FINALIZADO": 9, "PENDIENTE": 8, "REVISAR": 4})
        bienestar_text = (ROOT / "materiales/retos/bienestar.csv").read_text(encoding="utf-8-sig")
        bienestar = list(csv.DictReader(bienestar_text.splitlines()[3:], delimiter=";"))
        self.assertEqual(len(bienestar), 10)
        self.assertEqual(int(bienestar[0]["Deserciones"]) / int(bienestar[0]["Aprendices matriculados"]) * 100, 5)
        contratos_text = (ROOT / "materiales/retos/contratos.csv").read_text(encoding="utf-8-sig")
        contratos = list(csv.DictReader(contratos_text.splitlines()[3:], delimiter=";"))
        repeated = [(index + 5, row["Centro"]) for index, row in enumerate(contratos) if row["Código"] == "SIM-CT-008"]
        self.assertEqual(repeated, [(12, "Centro H"), (21, "Centro A")])
        pqrs_text = (ROOT / "materiales/retos/pqrs-complejas.csv").read_text(encoding="utf-8-sig")
        pqrs = {row["Código"]: row for row in csv.DictReader(pqrs_text.splitlines()[3:], delimiter=";")}
        self.assertEqual(set(pqrs) & {"PC-01", "PC-02", "PC-03"}, {"PC-01", "PC-02", "PC-03"})
        self.assertIn("no sé qué soporte falta", pqrs["PC-02"]["Texto de la solicitud"])

    def test_fuentes_del_laboratorio_conservan_sus_rutas_y_son_legibles(self):
        self.assertEqual(self.invoke("package_source_path", "materiales/retos/bienestar.csv"), "fuentes/bienestar.csv")
        self.assertEqual(self.invoke("package_source_path", "materiales/analisis-datos/datos/clima.csv"), "fuentes/datos/clima.csv")
        self.assertEqual(self.invoke("package_source_path", "materiales/analisis-datos/documentos/fuentes-nasa/a.pdf"), "fuentes/documentos/fuentes-nasa/a.pdf")
        selected = {"lab-nasa": "exoplanetas", "lab-poblacion": "poblacion", "lab-clima": "clima", "lab-sismos": "sismos"}
        with TemporaryDirectory(dir=ROOT / "output") as directory:
            destination = Path(directory)
            self.invoke("build", destination)
            for key, dataset in selected.items():
                with ZipFile(destination / (key + ".zip")) as archive:
                    metadata = json.loads(archive.read("fuentes/fuentes.json"))
                    source = metadata["datasets"][dataset]
                    for member, digest in (("archivo", "sha256"), ("original", "sha256_original")):
                        payload = archive.read("fuentes/" + source[member])
                        self.assertEqual(hashlib.sha256(payload).hexdigest(), source[digest], key)
                    if key == "lab-poblacion":
                        dane = metadata["ampliaciones"]["dane_santander"]
                        self.assertEqual(hashlib.sha256(archive.read("fuentes/" + dane["archivo"])).hexdigest(), dane["sha256"])
            with ZipFile(destination / "lab-documentos.zip") as archive:
                manifest = list(csv.DictReader(archive.read("fuentes/documentos/manifiesto.csv").decode("utf-8").splitlines()))
                included = [row for row in manifest if row["archivo_incluido"]]
                self.assertEqual(len(manifest), 10)
                self.assertEqual(len(included), 3)
                for row in included:
                    payload = archive.read("fuentes/documentos/" + row["archivo_incluido"])
                    self.assertEqual(hashlib.sha256(payload).hexdigest(), row["sha256"])
                    pdf = PdfReader(io.BytesIO(payload))
                    self.assertEqual(len(pdf.pages), int(row["paginas"]))
                    self.assertTrue(pdf.pages[0].extract_text().strip())

    def test_regenerar_retira_solo_copias_planas_anteriores_sin_cambios(self):
        with TemporaryDirectory(dir=ROOT / "output") as directory:
            destination = Path(directory)
            legacy = destination / "lab-clima/fuentes/clima.csv"
            legacy.parent.mkdir(parents=True)
            legacy.write_bytes((ROOT / "materiales/analisis-datos/datos/clima.csv").read_bytes())
            personal = destination / "lab-clima/fuentes/notas-propias.md"
            personal.write_text("Conservar esta nota.", encoding="utf-8")
            changed = destination / "lab-clima/fuentes/clima.json"
            changed.write_text('{"nota":"copia modificada"}', encoding="utf-8")
            self.invoke("build", destination)
            self.assertFalse(legacy.exists())
            self.assertEqual(personal.read_text(encoding="utf-8"), "Conservar esta nota.")
            self.assertEqual(json.loads(changed.read_text(encoding="utf-8")), {"nota": "copia modificada"})
            self.assertTrue((destination / "lab-clima/fuentes/datos/clima.csv").is_file())

    def test_documentos_incluyen_encargo_fuentes_y_tres_comprobaciones(self):
        task = self.invoke("load_catalog")["reto-2"]
        md = self.invoke("task_markdown", "reto-2", task, "chat")
        html = self.invoke("task_html", "reto-2", task)
        self.assertIn(task["chatPrompt"], md)
        self.assertIn("No necesitas llenar", md)
        self.assertIn("pqrs-complejas.csv", html)
        self.assertIn("recursos comunes", html.lower())
        self.assertIn('href="fuentes/pqrs-complejas.csv"', html)
        self.assertIn("están en la carpeta fuentes/ de este paquete", html.lower())
        self.assertIn("<html lang=\"es-CO\">", html)
        self.assertIn("ENCARGO-IDE.md", html)
        self.assertTrue(any(prod in html for prod in ("Canva", "PDF", "Word", "Excel", "producto elaborado")))
        self.assertNotIn("esquema-salida.json", html)
        format_section = BeautifulSoup(html, "html.parser").find("h2", string="Formato del resultado").find_next_sibling()
        self.assertIn("No prepares otra entrega", format_section.get_text(" ", strip=True))
        self.assertNotRegex(format_section.get_text(" ", strip=True), r"JSON|bloque técnico")
        for check in task["checks"]:
            self.assertIn(check, md)
        ide = self.invoke("task_markdown", "reto-2", task, "ide")
        self.assertIn(task["idePrompt"], ide)
        task = dict(task, title="Comparar <texto> & fuentes")
        self.assertIn("Comparar &lt;texto&gt; &amp; fuentes", self.invoke("task_html", "prueba", task))

    def test_zip_es_reproducible_y_conserva_bytes(self):
        with TemporaryDirectory(dir=ROOT / "output") as directory:
            path = Path(directory)
            entries = {"b.csv": b"uno;dos\n1;2\n", "a.md": "Revisión".encode()}
            self.invoke("deterministic_zip", path / "a.zip", entries)
            self.invoke("deterministic_zip", path / "b.zip", dict(reversed(list(entries.items()))))
            self.assertEqual((path / "a.zip").read_bytes(), (path / "b.zip").read_bytes())
            with ZipFile(path / "a.zip") as archive:
                self.assertEqual(archive.namelist(), ["a.md", "b.csv"])
                self.assertEqual(archive.read("b.csv"), entries["b.csv"])

    def test_construccion_real_entrega_todos_los_archivos_y_fuentes(self):
        with TemporaryDirectory(dir=ROOT / "output") as directory:
            destination = Path(directory) / "ia"
            count = self.invoke("build", destination)
            catalog = self.invoke("load_catalog")
            self.assertEqual(count, len(catalog))
            for key, task in catalog.items():
                with ZipFile(destination / (key + ".zip")) as archive:
                    visual = bool(task.get("visualArtifact"))
                    required = ("ENCARGO-CHAT.md", "ENCARGO-IDE.md", "LEEME.html", "devbrain-prose.css", "devbrain-prose.js")
                    for asset, template in (("devbrain-prose.css", "prose-layout.css"), ("devbrain-prose.js", "prose-layout.js")):
                        self.assertEqual(archive.read(asset), (ROOT / "tools/text-layout/templates" / template).read_bytes(), key)
                        self.assertIn('href="devbrain-prose.css"' if asset.endswith(".css") else 'src="devbrain-prose.js"', archive.read("LEEME.html").decode("utf-8"), key)
                    if not visual:
                        required += ("modelo-salida.json", "esquema-salida.json", "registro-medicion.csv")
                    for name in required:
                        self.assertIn(name, archive.namelist(), key)
                        self.assertEqual(archive.read(name), (destination / key / name).read_bytes())
                    for source in task["sourceFiles"]:
                        self.assertEqual(archive.read(KITS.package_source_path(source)), (ROOT / source).read_bytes(), key)
                        self.assertEqual((destination / key / KITS.package_source_path(source)).read_bytes(), (ROOT / source).read_bytes(), key)
                    self.assertNotIn("no lo duplica", archive.read("ENCARGO-CHAT.md").decode("utf-8"), key)
                    if key in ("eco", "eco-canva", "eco-simulacion"):
                        self.assertFalse(task.get("learnerFiles"))
                        self.assertEqual(task["artifactId"], "ECO-A02")
                        residue_images = [image for image in task["guideImages"] if image.get("group") == "residuos"]
                        self.assertEqual(len(residue_images), 10)
                        self.assertEqual(len({image["itemId"] for image in residue_images}), 10)
                        for image in task["guideImages"]:
                            member = "imagenes/" + image["name"]
                            self.assertIn(member, archive.namelist())
                            self.assertEqual(archive.read(member), (ROOT / image["path"]).read_bytes())
                            self.assertIn(image["name"], archive.read("LEEME.html").decode("utf-8"))
                        guide = BeautifulSoup(archive.read("LEEME.html"), "html.parser")
                        figures = guide.select(".eco-residue-gallery figure")
                        self.assertEqual(len(figures), 10)
                        for figure in figures:
                            self.assertTrue(figure.select_one("img[alt]")["alt"].strip())
                            self.assertTrue(figure.select_one("figcaption").get_text(strip=True))
                        self.assertNotIn("imagenes/ecobogota-planta-ilustrativa.png", archive.namelist())
                        instructions = archive.read("ENCARGO-CHAT.md").decode("utf-8")
                        ide = archive.read("ENCARGO-IDE.md").decode("utf-8")
                        self.assertNotIn("intento-simulador.json", instructions)
                        self.assertNotIn("intento-simulador.json", ide)
                        self.assertIn("preparación pendiente de producción", catalog[key]["chatPrompt"])
                        self.assertIn("revisión humana", catalog[key]["chatPrompt"])
                        criteria = (ROOT / "materiales/ia/fuentes-comunes/eco-criterios.csv").read_text(encoding="utf-8")
                        self.assertIn("bolsa verde depende de que exista un programa local", criteria)
                        self.assertIn("\nblanca;", criteria)
                        self.assertIn("\nnegra;", criteria)
                        self.assertIn("\nverde;", criteria)
                    if visual:
                        self.assertNotIn("modelo-salida.json", archive.namelist())
                        self.assertNotIn("esquema-salida.json", archive.namelist())
                        self.assertNotIn("registro-medicion.csv", archive.namelist())
                    else:
                        self.assertIn("pendiente", archive.read("registro-medicion.csv").decode("utf-8"))
                    self.assertNotIn("[completar]", archive.read("ENCARGO-CHAT.md").decode("utf-8"))
            shared = json.loads((ROOT / "content/shared-challenge-materials.json").read_text(encoding="utf-8"))
            with ZipFile(destination / "recursos-compartidos.zip") as archive:
                self.assertEqual(set(archive.namelist()), {KITS.package_source_path(item["href"]) for item in shared})
                for item in shared:
                    self.assertEqual(archive.read(KITS.package_source_path(item["href"])), (ROOT / item["href"]).read_bytes())
            self.assertEqual(self.invoke("main", ["--output", str(destination)]), len(catalog))
            self.assertTrue((destination / "catalogo.json").is_file())

    @classmethod
    def tearDownClass(cls):
        production = {name for name, item in inspect.getmembers(KITS, inspect.isfunction) if item.__module__ == KITS.__name__}
        if production != cls.covered:
            raise AssertionError("Funciones sin prueba con aserciones: " + str(production - cls.covered))
        print("Cobertura de funciones de paquetes IA: " + str(len(cls.covered)) + "/" + str(len(production)) + " (100 %).")


if __name__ == "__main__":
    unittest.main()
