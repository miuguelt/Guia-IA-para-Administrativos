"""
Script de verificación empírica independiente para Milestone 1 (M1_R1_R2).
Pruebas de esfuerzo, oráculos y arnés de validación adversaria.
Verifica programáticamente:
1. content/challenge-compass.json (11 retos, 4 estaciones, 2 prompts en dos clics, comparativa, transferencia).
2. content/ai-task-briefs.json (productos auténticos Canva, PDF/Word, Excel sin resultado.html como salida obligatoria).
3. index.html (DOM renderizado: .decision-compass-panel con 4 estaciones, .prompt-2clicks-container con 2 botones data-copy y pre vinculados).
4. Pruebas de colisión de IDs, unicidad en el DOM, robustez ante placeholders, similitud de prompts y contrato con course-tabs.js.
"""

import json
from pathlib import Path
import re
import sys
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CHALLENGE_IDS = [
    "reto-0", "reto-1", "reto-2", "reto-3", "reto-4",
    "reto-5", "reto-6", "reto-7", "reto-8", "reto-9",
    "reto-integrador"
]

class EmpiricalVerifier:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0

    def assert_true(self, condition, message, challenge_id=None):
        prefix = f"[{challenge_id}] " if challenge_id else ""
        if condition:
            self.passed += 1
            self.results.append((True, f"PASS: {prefix}{message}"))
        else:
            self.failed += 1
            self.results.append((False, f"FAIL: {prefix}{message}"))
            print(f"❌ FAIL: {prefix}{message}", file=sys.stderr)

    def verify_challenge_compass_json(self):
        compass_file = ROOT / "content" / "challenge-compass.json"
        self.assert_true(compass_file.is_file(), "Existe content/challenge-compass.json")
        try:
            data = json.loads(compass_file.read_text(encoding="utf-8"))
        except Exception as e:
            self.assert_true(False, f"Error parseando JSON challenge-compass: {e}")
            return {}

        self.assert_true(len(data) == 11, f"Contiene exactamente 11 retos (encontrados: {len(data)})")
        
        for cid in CHALLENGE_IDS:
            self.assert_true(cid in data, "Reto presente en JSON", cid)
            if cid not in data:
                continue
            entry = data[cid]
            
            # Compass 4 estaciones
            compass = entry.get("compass", {})
            for station in ["diagnosis", "toolCombination", "goldenRule", "productFormat"]:
                val = compass.get(station, "")
                self.assert_true(isinstance(val, str) and len(val.strip()) >= 15,
                                f"Estación compass.{station} es string no vacío (longitud: {len(val.strip()) if isinstance(val, str) else 0})", cid)
                # Detección de placeholders reales (TODO, TBD, FIXME, PLACEHOLDER, [...], N/A)
                has_placeholder = bool(re.search(r'\b(TODO|TBD|FIXME|XXX|PLACEHOLDER|N/A)\b', val)) or "[...]" in val
                self.assert_true(not has_placeholder, f"Estación compass.{station} no contiene placeholders", cid)

            # Prompts en 2 Clics
            two_clicks = entry.get("twoClickPrompts", {})
            self.assert_true("click1" in two_clicks and "click2" in two_clicks, "Estructura twoClickPrompts contiene click1 y click2", cid)
            
            c1 = two_clicks.get("click1", {})
            c2 = two_clicks.get("click2", {})
            
            # Clic 1: Título y Label de Solución Segura
            c1_title = c1.get("title", "")
            c1_label = c1.get("buttonLabel", "")
            self.assert_true("solución segura" in c1_title.lower(), f"Título de click1 indica Solución Segura: '{c1_title}'", cid)
            self.assert_true("solución segura" in c1_label.lower(), f"Botón de click1 indica Solución Segura: '{c1_label}'", cid)
            self.assert_true(bool(c1.get("purpose")), "click1 tiene purpose", cid)
            
            p1 = c1.get("prompt", "")
            self.assert_true(isinstance(p1, str) and len(p1.strip()) >= 50, f"click1 prompt no vacío (>50 chars, len={len(p1)})", cid)
            
            # Clic 2: Título y Label de Producción
            c2_title = c2.get("title", "")
            c2_label = c2.get("buttonLabel", "")
            self.assert_true("producción" in c2_title.lower(), f"Título de click2 indica Producción: '{c2_title}'", cid)
            self.assert_true("producción" in c2_label.lower(), f"Botón de click2 indica Producción: '{c2_label}'", cid)
            self.assert_true(bool(c2.get("purpose")), "click2 tiene purpose", cid)
            
            p2 = c2.get("prompt", "")
            self.assert_true(isinstance(p2, str) and len(p2.strip()) >= 50, f"click2 prompt no vacío (>50 chars, len={len(p2)})", cid)
            
            # Comprobación de independencia y no redundancia
            self.assert_true(p1 != p2, "Prompt 1 y Prompt 2 son distintos", cid)
            words1 = set(p1.lower().split())
            words2 = set(p2.lower().split())
            jaccard = len(words1 & words2) / len(words1 | words2)
            self.assert_true(jaccard < 0.65, f"Prompt 1 y 2 son metodológicamente diferenciados (Jaccard={jaccard:.2f} < 0.65)", cid)
            
            # Intención de Clic 1 (Solución Segura y Exacta)
            p1_lower = p1.lower()
            safe_cues = [
                "segur", "ley 1581", "no inventes", "no const", "verific", "exact",
                "apartado", "fuente", "rigor", "normat", "auditor", "calidad",
                "robustez", "sin prometer", "reproducible", "parada", "humana",
                "soporte", "coteja", "ancla"
            ]
            has_safe = any(cue in p1_lower for cue in safe_cues)
            self.assert_true(has_safe, "Prompt 1 contiene indicaciones explícitas de rigor/auditoría/seguridad", cid)
            
            # Intención de Clic 2 (Producción en Canva / PDF / Excel)
            p2_lower = p2.lower()
            prod_cues = ["canva", "pdf", "word", "excel", "diagram", "infograf", "oficio", "acta", "tablero", "hoja de cálculo", "lámina", "presentación"]
            has_prod = any(cue in p2_lower for cue in prod_cues)
            self.assert_true(has_prod, "Prompt 2 contiene términos de producción en Canva, PDF/Word o Excel", cid)
            
            # Comparativa y transferencia
            comp = entry.get("comparison", {})
            self.assert_true(isinstance(comp.get("goldStandard"), str) and len(comp.get("goldStandard").strip()) > 20, "comparison tiene goldStandard sustantivo", cid)
            self.assert_true(isinstance(comp.get("antipattern"), str) and len(comp.get("antipattern").strip()) > 20, "comparison tiene antipattern sustantivo", cid)
            self.assert_true(isinstance(entry.get("officeTransfer"), str) and len(entry.get("officeTransfer").strip()) > 20, "officeTransfer es sustantivo", cid)

        return data

    def verify_ai_task_briefs_json(self):
        briefs_file = ROOT / "content" / "ai-task-briefs.json"
        self.assert_true(briefs_file.is_file(), "Existe content/ai-task-briefs.json")
        try:
            briefs = json.loads(briefs_file.read_text(encoding="utf-8"))
        except Exception as e:
            self.assert_true(False, f"Error parseando JSON ai-task-briefs: {e}")
            return {}

        for cid in CHALLENGE_IDS:
            self.assert_true(cid in briefs, "Reto presente en ai-task-briefs.json", cid)
            if cid not in briefs:
                continue
            item = briefs[cid]
            output = item.get("output", "")
            self.assert_true(bool(output), "output definido en ai-task-briefs.json", cid)
            
            # resultado.html no debe ser la salida requerida
            is_resultado_html_only = output.strip().lower() == "resultado.html" or output.strip().lower().startswith("página resultado.html")
            self.assert_true(not is_resultado_html_only, f"output no es solo resultado.html: '{output}'", cid)
            
            # El producto debe ser auténtico (Canva, PDF, Word, Excel)
            out_lower = output.lower()
            authentic = any(prod in out_lower for prod in ["canva", "pdf", "word", "excel"])
            self.assert_true(authentic, f"output menciona producto administrativo real (Canva, PDF, Word, Excel): '{output}'", cid)

        return briefs

    def verify_index_html_dom(self, compass_data):
        index_file = ROOT / "index.html"
        self.assert_true(index_file.is_file(), "Existe index.html")
        try:
            html_content = index_file.read_text(encoding="utf-8")
            soup = BeautifulSoup(html_content, "html.parser")
        except Exception as e:
            self.assert_true(False, f"Error parseando index.html: {e}")
            return

        all_ids = [tag["id"] for tag in soup.find_all(id=True)]
        id_counts = {}
        for x in all_ids:
            id_counts[x] = id_counts.get(x, 0) + 1

        for cid in CHALLENGE_IDS:
            challenge_node = soup.find(id=cid)
            self.assert_true(challenge_node is not None, "Nodo del reto existe en index.html", cid)
            if challenge_node is None:
                continue

            # 1. .decision-compass-panel existe
            compass_panel = challenge_node.select_one(".decision-compass-panel")
            self.assert_true(compass_panel is not None, ".decision-compass-panel existe en el DOM", cid)
            
            if compass_panel:
                # 4 estaciones
                steps = compass_panel.select(".compass-step")
                self.assert_true(len(steps) == 4, f"Contiene exactamente 4 estaciones (.compass-step) (encontradas: {len(steps)})", cid)
                
                expected_compass = compass_data.get(cid, {}).get("compass", {})
                if len(steps) == 4:
                    # Estación 1: Diagnóstico
                    self.assert_true("diagnóstico" in steps[0].get_text().lower(), "Estación 1 es Diagnóstico situacional", cid)
                    self.assert_true(expected_compass.get("diagnosis", "")[:20] in steps[0].get_text(), "Texto de Diagnóstico coincide con compass.json", cid)
                    
                    # Estación 2: Combinación
                    self.assert_true("combinación" in steps[1].get_text().lower(), "Estación 2 es Combinación IA + Herramienta", cid)
                    self.assert_true(expected_compass.get("toolCombination", "")[:20] in steps[1].get_text(), "Texto de Combinación coincide con compass.json", cid)
                    
                    # Estación 3: Regla de oro
                    self.assert_true("regla de oro" in steps[2].get_text().lower(), "Estación 3 es Regla de oro", cid)
                    self.assert_true(expected_compass.get("goldenRule", "")[:20] in steps[2].get_text(), "Texto de Regla de oro coincide con compass.json", cid)
                    
                    # Estación 4: Formato del producto
                    self.assert_true("formato" in steps[3].get_text().lower() or "producto" in steps[3].get_text().lower(), "Estación 4 es Formato del producto real", cid)
                    self.assert_true(expected_compass.get("productFormat", "")[:20] in steps[3].get_text(), "Texto de Formato coincide con compass.json", cid)

            # 2. .prompt-2clicks-container existe
            clicks_container = challenge_node.select_one(".prompt-2clicks-container")
            self.assert_true(clicks_container is not None, ".prompt-2clicks-container existe en el DOM", cid)
            
            expected_c1 = compass_data.get(cid, {}).get("twoClickPrompts", {}).get("click1", {})
            expected_c2 = compass_data.get(cid, {}).get("twoClickPrompts", {}).get("click2", {})

            if clicks_container:
                # Dos botones de copia con data-copy
                copy_buttons = clicks_container.select("button[data-copy]")
                self.assert_true(len(copy_buttons) == 2, f"Contiene exactamente 2 botones de copia data-copy (encontrados: {len(copy_buttons)})", cid)
                
                target1_id = f"{cid}-prompt-seguro"
                target2_id = f"{cid}-prompt-produccion"
                
                btn1 = clicks_container.select_one(f'button[data-copy="{target1_id}"]')
                btn2 = clicks_container.select_one(f'button[data-copy="{target2_id}"]')
                
                self.assert_true(btn1 is not None, f"Botón Clic 1 con data-copy='{target1_id}' existe", cid)
                self.assert_true(btn2 is not None, f"Botón Clic 2 con data-copy='{target2_id}' existe", cid)
                
                if btn1:
                    self.assert_true(expected_c1.get("buttonLabel", "") in btn1.get_text(), "Etiqueta de botón Clic 1 coincide", cid)
                    self.assert_true(btn1.get("type") == "button", "Botón Clic 1 tiene type='button'", cid)
                if btn2:
                    self.assert_true(expected_c2.get("buttonLabel", "") in btn2.get_text(), "Etiqueta de botón Clic 2 coincide", cid)
                    self.assert_true(btn2.get("type") == "button", "Botón Clic 2 tiene type='button'", cid)

            # 3. Resolución DOM a elementos <pre> correspondientes
            target1_id = f"{cid}-prompt-seguro"
            target2_id = f"{cid}-prompt-produccion"
            
            pre1 = soup.find(id=target1_id)
            pre2 = soup.find(id=target2_id)
            
            self.assert_true(pre1 is not None, f"Elemento #{target1_id} existe en el DOM", cid)
            self.assert_true(pre2 is not None, f"Elemento #{target2_id} existe en el DOM", cid)
            
            if pre1:
                self.assert_true(pre1.name == "pre", f"#{target1_id} es etiqueta <pre>", cid)
                self.assert_true(id_counts.get(target1_id, 0) == 1, f"ID #{target1_id} es único en index.html (aparece 1 vez)", cid)
                pre1_text = pre1.get_text().strip()
                self.assert_true(len(pre1_text) > 30, f"Contenido de <pre> #{target1_id} no está vacío ({len(pre1_text)} chars)", cid)
                self.assert_true(expected_c1.get("prompt", "").strip() == pre1_text, f"Texto de #{target1_id} coincide exactamente con prompt de click1", cid)
                
            if pre2:
                self.assert_true(pre2.name == "pre", f"#{target2_id} es etiqueta <pre>", cid)
                self.assert_true(id_counts.get(target2_id, 0) == 1, f"ID #{target2_id} es único en index.html (aparece 1 vez)", cid)
                pre2_text = pre2.get_text().strip()
                self.assert_true(len(pre2_text) > 30, f"Contenido de <pre> #{target2_id} no está vacío ({len(pre2_text)} chars)", cid)
                self.assert_true(expected_c2.get("prompt", "").strip() == pre2_text, f"Texto de #{target2_id} coincide exactamente con prompt de click2", cid)

            # 4. Paneles complementarios: comparativa y transferencia
            gold_panel = challenge_node.select_one(".gold-vs-antipattern-panel")
            self.assert_true(gold_panel is not None, ".gold-vs-antipattern-panel existe en el DOM", cid)
            transfer_panel = challenge_node.select_one(".office-transfer-panel")
            self.assert_true(transfer_panel is not None, ".office-transfer-panel existe en el DOM", cid)

    def run(self):
        print("=== INICIANDO VERIFICACIÓN EMPÍRICA CHALLENGER M1 ===")
        compass_data = self.verify_challenge_compass_json()
        briefs_data = self.verify_ai_task_briefs_json()
        self.verify_index_html_dom(compass_data)
        
        print("\n=== RESUMEN DE EJECUCIÓN ===")
        print(f"Total pruebas: {self.passed + self.failed}")
        print(f"Pasadas: {self.passed}")
        print(f"Fallidas: {self.failed}")
        
        if self.failed == 0:
            print("\n🎉 VEREDICTO EMPÍRICO: APROBADO (APPROVE)")
            return 0
        else:
            print("\n⚠️ VEREDICTO EMPÍRICO: CAMBIOS REQUERIDOS (REQUEST_CHANGES)")
            return 1

if __name__ == "__main__":
    verifier = EmpiricalVerifier()
    sys.exit(verifier.run())
