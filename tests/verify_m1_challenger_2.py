"""
Empirical Challenge & Verification Oracle for Milestone 1 (M1_R1_R2)
Agent: m1_chal_2 (critic, specialist)
Working Directory: C:\\Users\\Miguel\\Documents\\Aplicaciones\\_projects\\Guia IA para Administrativos

This oracle executes rigorous tests against:
1. content/challenge-compass.json (safety constraints, 2-click prompts, tool alignment, gold vs antipattern contrast, office transfer)
2. content/ai-task-briefs.json (authentic product outputs, visual artifacts, schema preservation)
3. index.html compiled output (DOM panels, buttons, copy targets, ID resolution)
4. Static build and unit test suites
"""

import json
import re
import sys
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
COMPASS_PATH = ROOT / "content" / "challenge-compass.json"
BRIEFS_PATH = ROOT / "content" / "ai-task-briefs.json"
INDEX_PATH = ROOT / "index.html"

EXPECTED_CHALLENGES = [
    "reto-0", "reto-1", "reto-2", "reto-3", "reto-4",
    "reto-5", "reto-6", "reto-7", "reto-8", "reto-9",
    "reto-integrador"
]

EXPECTED_TOOLS = {
    "reto-0": ["canva"],
    "reto-1": ["pdf", "word"],
    "reto-2": ["pdf", "word"],
    "reto-3": ["canva"],
    "reto-4": ["excel"],
    "reto-5": ["pdf", "word"],
    "reto-6": ["excel"],
    "reto-7": ["canva"],
    "reto-8": ["pdf", "word"],
    "reto-9": ["canva"],
    "reto-integrador": ["canva", "pdf"]
}

class OracleReport:
    def __init__(self):
        self.tests_run = 0
        self.passed = 0
        self.failed = 0
        self.failures = []
        self.metrics = {}

    def assert_true(self, condition, test_name, detail=""):
        self.tests_run += 1
        if condition:
            self.passed += 1
            print(f"  [PASS] {test_name}")
        else:
            self.failed += 1
            msg = f"{test_name}: {detail}" if detail else test_name
            print(f"  [FAIL] {msg}")
            self.failures.append(msg)

    def summary(self):
        print("\n" + "=" * 60)
        print(f"ORACLE RUN SUMMARY: {self.tests_run} tests | {self.passed} passed | {self.failed} failed")
        print("=" * 60)
        return self.failed == 0

def test_challenge_compass_schema_and_completeness(oracle):
    print("\n--- Test Suite 1: Schema & Completeness in challenge-compass.json ---")
    oracle.assert_true(COMPASS_PATH.exists(), "COMPASS_FILE_EXISTS", f"Path {COMPASS_PATH} not found")
    if not COMPASS_PATH.exists():
        return None

    with open(COMPASS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    oracle.assert_true(len(data) == 11, "EXACT_11_CHALLENGES", f"Found {len(data)} challenges, expected 11")

    for ident in EXPECTED_CHALLENGES:
        oracle.assert_true(ident in data, f"HAS_CHALLENGE_{ident}", f"Missing challenge {ident}")
        if ident not in data:
            continue
        c_data = data[ident]
        oracle.assert_true("compass" in c_data, f"{ident}_HAS_COMPASS")
        oracle.assert_true("twoClickPrompts" in c_data, f"{ident}_HAS_TWO_CLICK_PROMPTS")
        oracle.assert_true("comparison" in c_data, f"{ident}_HAS_COMPARISON")
        oracle.assert_true("officeTransfer" in c_data, f"{ident}_HAS_OFFICE_TRANSFER")

        # Check compass stations
        compass = c_data.get("compass", {})
        for station in ["diagnosis", "toolCombination", "goldenRule", "productFormat"]:
            val = compass.get(station, "")
            oracle.assert_true(isinstance(val, str) and len(val.strip()) > 15,
                               f"{ident}_COMPASS_STATION_{station}_POPULATED",
                               f"Length is {len(val.strip())}")

    return data

def test_prompt_click1_safety_and_rigor(oracle, compass_data):
    print("\n--- Test Suite 2: Click 1 Safety, Anti-Hallucination & Rigor ---")
    # 3 Pillars of Prompt Safety
    pillar_grounding = [
        "con base en", "con base exclusiva", "csv", "fuente", "señal textual",
        "coteja", "transcripción", "lineamiento", "directriz", "analiza"
    ]
    pillar_uncertainty = [
        "no consta", "consta / no consta", "dato faltante", "vacíos", "revisar",
        "pendiente", "ausentes", "por confirmar", "falta"
    ]
    pillar_boundary = [
        "no inventes", "sin inventar", "no asumas", "sin prometer", "prohíbe",
        "parada de seguridad", "reserva la decisión", "orden intrusa", "robustez",
        "ley 1581", "datos personales", "sin calificar", "deja constancia"
    ]

    for ident, c_data in compass_data.items():
        click1 = c_data.get("twoClickPrompts", {}).get("click1", {})
        prompt = click1.get("prompt", "")
        title = click1.get("title", "")
        purpose = click1.get("purpose", "")

        oracle.assert_true(len(prompt.strip()) >= 100, f"{ident}_CLICK1_LENGTH_ROBUST",
                           f"Click 1 prompt too short ({len(prompt.strip())} chars)")
        oracle.assert_true("Solución Segura" in title or "Segura" in title,
                           f"{ident}_CLICK1_TITLE_SAFE", f"Title: {title}")
        oracle.assert_true(len(purpose.strip()) > 20, f"{ident}_CLICK1_PURPOSE_POPULATED")

        # Multi-pillar safety test
        prompt_lower = prompt.lower()
        has_grounding = any(k in prompt_lower for k in pillar_grounding)
        has_uncertainty = any(k in prompt_lower for k in pillar_uncertainty)
        has_boundary = any(k in prompt_lower for k in pillar_boundary)

        oracle.assert_true(has_grounding, f"{ident}_CLICK1_HAS_GROUNDING_PILLAR",
                           f"No grounding keyword found in '{prompt}'")
        oracle.assert_true(has_uncertainty or has_boundary, f"{ident}_CLICK1_HAS_SAFETY_OR_UNCERTAINTY_PILLAR",
                           f"Neither uncertainty handling nor safety boundary found in '{prompt}'")

        # Challenge-specific safety/grounding checks
        if ident == "reto-0":
            oracle.assert_true("1581" in prompt and "no inventes" in prompt_lower,
                               "RETO_0_LEY_1581_AND_NO_INVENTES")
        elif ident == "reto-1":
            oracle.assert_true("ocho requisitos" in prompt_lower or "8 requisitos" in prompt_lower,
                               "RETO_1_EIGHT_REQUIREMENTS")
            oracle.assert_true("consta" in prompt_lower, "RETO_1_CONSTA_NO_CONSTA")
        elif ident == "reto-2":
            oracle.assert_true("pc-01" in prompt_lower and "pc-03" in prompt_lower, "RETO_2_CASES_PC01_PC03")
            oracle.assert_true("no asumas" in prompt_lower or "no constan" in prompt_lower,
                               "RETO_2_NO_UNAUTHORIZED_COMMITMENTS")
        elif ident == "reto-3":
            oracle.assert_true("crtt" in prompt_lower and "pc-02" in prompt_lower, "RETO_3_CRTT_AND_PC02")
        elif ident == "reto-4":
            oracle.assert_true("50" in prompt_lower and "c-001" in prompt_lower, "RETO_4_50_EMAILS_AND_C001")
            oracle.assert_true("borrador" in prompt_lower, "RETO_4_DRAFT_LABELED")
        elif ident == "reto-5":
            oracle.assert_true("transcripci" in prompt_lower or "minuto" in prompt_lower, "RETO_5_MINUTES_AND_TRANSCRIPT")
        elif ident == "reto-6":
            oracle.assert_true("revisar" in prompt_lower and "sim-0012" in prompt_lower, "RETO_6_REVISAR_AND_SIM0012")
        elif ident == "reto-7":
            oracle.assert_true("centro a" in prompt_lower and ("840" in prompt or "5" in prompt), "RETO_7_CENTRO_A_ANCHOR")
            oracle.assert_true("causal" in prompt_lower, "RETO_7_NON_CAUSALITY_ENFORCED")
        elif ident == "reto-8":
            oracle.assert_true("oi-1" in prompt_lower and ("intrusa" in prompt_lower or "inyecci" in prompt_lower),
                               "RETO_8_PROMPT_INJECTION_ISOLATION")
        elif ident == "reto-9":
            oracle.assert_true("fl-03" in prompt_lower and ("urgente" in prompt_lower or "parada" in prompt_lower),
                               "RETO_9_HUMAN_STOP_GATE")
        elif ident == "reto-integrador":
            oracle.assert_true("sim-ct-008" in prompt_lower and ("1.250.000" in prompt or "12" in prompt),
                               "RETO_INT_SIM_CT_008_DISCREPANCY")

def test_prompt_click2_tool_targeting(oracle, compass_data):
    print("\n--- Test Suite 3: Click 2 Authentic Tool Targeting ---")
    for ident, expected_tools in EXPECTED_TOOLS.items():
        c_data = compass_data.get(ident, {})
        click2 = c_data.get("twoClickPrompts", {}).get("click2", {})
        prompt = click2.get("prompt", "")
        title = click2.get("title", "")
        button = click2.get("buttonLabel", "")
        purpose = click2.get("purpose", "")

        oracle.assert_true(len(prompt.strip()) >= 80, f"{ident}_CLICK2_LENGTH_ROBUST",
                           f"Click 2 prompt length: {len(prompt.strip())}")
        oracle.assert_true(len(purpose.strip()) > 15, f"{ident}_CLICK2_PURPOSE_POPULATED")

        full_text = f"{title} {button} {prompt}".lower()
        tool_matched = any(t in full_text for t in expected_tools)
        oracle.assert_true(tool_matched, f"{ident}_CLICK2_TARGETS_{expected_tools}",
                           f"Expected one of {expected_tools} in Click 2. Found title='{title}', button='{button}'")

def test_gold_vs_antipattern_contrast(oracle, compass_data):
    print("\n--- Test Suite 4: Estándar de Oro vs Antipatrón Contrast ---")
    for ident, c_data in compass_data.items():
        comparison = c_data.get("comparison", {})
        gold = comparison.get("goldStandard", "")
        anti = comparison.get("antipattern", "")

        oracle.assert_true(len(gold.strip()) >= 40, f"{ident}_GOLD_STANDARD_LENGTH",
                           f"Gold standard too brief: {len(gold.strip())}")
        oracle.assert_true(len(anti.strip()) >= 40, f"{ident}_ANTIPATTERN_LENGTH",
                           f"Antipattern too brief: {len(anti.strip())}")

        # Compute token overlap (Jaccard similarity) to ensure non-trivial distinction
        gold_tokens = set(re.findall(r"\w+", gold.lower()))
        anti_tokens = set(re.findall(r"\w+", anti.lower()))
        intersection = gold_tokens.intersection(anti_tokens)
        union = gold_tokens.union(anti_tokens)
        jaccard_sim = len(intersection) / len(union) if union else 1.0

        # They must provide real contrast, so Jaccard similarity must be <= 0.40
        oracle.assert_true(jaccard_sim <= 0.40, f"{ident}_GOLD_ANTI_MEANINGFUL_CONTRAST",
                           f"Jaccard similarity is {jaccard_sim:.2f} (should be <= 0.40)")

def test_office_transfer_presence(oracle, compass_data):
    print("\n--- Test Suite 5: Transferencia a la Oficina ---")
    for ident, c_data in compass_data.items():
        transfer = c_data.get("officeTransfer", "")
        oracle.assert_true(len(transfer.strip()) >= 35, f"{ident}_OFFICE_TRANSFER_POPULATED",
                           f"Office transfer too brief ({len(transfer.strip())} chars)")
        # Must describe a real administrative task context
        admin_keywords = [
            "ventanilla", "aprendiz", "ciudadano", "solicitud", "auditorio",
            "transporte", "pqrs", "derechos de petición", "atención",
            "buzón", "actas", "comité", "sofia plus", "informes", "rendición",
            "interventoría", "procedimientos", "meci", "iso 9001", "consejo de centro"
        ]
        has_context = any(kw in transfer.lower() for kw in admin_keywords)
        oracle.assert_true(has_context, f"{ident}_OFFICE_TRANSFER_REALISTIC_CONTEXT",
                           f"Transfer text: '{transfer}'")

def test_ai_task_briefs_alignment(oracle):
    print("\n--- Test Suite 6: ai-task-briefs.json Product & Schema Alignment ---")
    oracle.assert_true(BRIEFS_PATH.exists(), "BRIEFS_FILE_EXISTS")
    if not BRIEFS_PATH.exists():
        return

    with open(BRIEFS_PATH, "r", encoding="utf-8") as f:
        briefs = json.load(f)

    for ident, expected_tools in EXPECTED_TOOLS.items():
        oracle.assert_true(ident in briefs, f"{ident}_IN_BRIEFS")
        if ident not in briefs:
            continue
        item = briefs[ident]
        output = item.get("output", "").lower()
        tool_matched = any(t in output for t in expected_tools)
        oracle.assert_true(tool_matched, f"{ident}_BRIEF_OUTPUT_ALIGNED",
                           f"Output: '{item.get('output')}', expected tool in {expected_tools}")

        # Check visualArtifact if present
        if "visualArtifact" in item:
            va = item["visualArtifact"].lower()
            oracle.assert_true(any(t in va for t in expected_tools),
                               f"{ident}_VISUAL_ARTIFACT_ALIGNED", f"Artifact: '{item['visualArtifact']}'")

        # Check fieldKeys preserved
        field_keys = item.get("fieldKeys", [])
        oracle.assert_true(isinstance(field_keys, list) and len(field_keys) >= 2,
                           f"{ident}_FIELD_KEYS_PRESERVED", f"Keys: {field_keys}")

def test_index_html_dom_rendering(oracle):
    print("\n--- Test Suite 7: index.html DOM Rendering & ID Resolution ---")
    oracle.assert_true(INDEX_PATH.exists(), "INDEX_HTML_EXISTS")
    if not INDEX_PATH.exists():
        return

    content = INDEX_PATH.read_text(encoding="utf-8")
    soup = BeautifulSoup(content, "html.parser")

    for ident in EXPECTED_CHALLENGES:
        section = soup.find(id=ident)
        oracle.assert_true(section is not None, f"{ident}_SECTION_EXISTS_IN_INDEX")
        if not section:
            continue

        # Check decision-compass-panel
        compass_panel = section.select_one(".decision-compass-panel")
        oracle.assert_true(compass_panel is not None, f"{ident}_HAS_COMPASS_PANEL")

        if compass_panel:
            steps = compass_panel.select(".compass-step")
            oracle.assert_true(len(steps) == 4, f"{ident}_HAS_EXACTLY_4_STEPS",
                               f"Found {len(steps)} steps")

            # Check 2-click container
            two_click = compass_panel.select_one(".prompt-2clicks-container")
            oracle.assert_true(two_click is not None, f"{ident}_HAS_TWO_CLICK_CONTAINER")

            # Check Click 1 button and target pre
            btn_seguro = compass_panel.select_one(f'button[data-copy="{ident}-prompt-seguro"]')
            oracle.assert_true(btn_seguro is not None, f"{ident}_HAS_BTN_PROMPT_SEGURO")
            pre_seguro = soup.find(id=f"{ident}-prompt-seguro")
            oracle.assert_true(pre_seguro is not None, f"{ident}_HAS_PRE_PROMPT_SEGURO",
                               f"Target #{ident}-prompt-seguro not found")

            # Check Click 2 button and target pre
            btn_prod = compass_panel.select_one(f'button[data-copy="{ident}-prompt-produccion"]')
            oracle.assert_true(btn_prod is not None, f"{ident}_HAS_BTN_PROMPT_PRODUCCION")
            pre_prod = soup.find(id=f"{ident}-prompt-produccion")
            oracle.assert_true(pre_prod is not None, f"{ident}_HAS_PRE_PROMPT_PRODUCCION",
                               f"Target #{ident}-prompt-produccion not found")

            # Check gold vs antipattern
            gold_anti = compass_panel.select_one(".gold-vs-antipattern-panel")
            oracle.assert_true(gold_anti is not None, f"{ident}_HAS_GOLD_ANTI_PANEL")
            if gold_anti:
                gold_card = gold_anti.select_one(".gold-standard")
                anti_card = gold_anti.select_one(".antipattern")
                oracle.assert_true(gold_card is not None and anti_card is not None,
                                   f"{ident}_HAS_BOTH_GOLD_AND_ANTI_CARDS")

            # Check office transfer panel
            transfer_panel = compass_panel.select_one(".office-transfer-panel")
            oracle.assert_true(transfer_panel is not None, f"{ident}_HAS_OFFICE_TRANSFER_PANEL")

def main():
    print("================================================================")
    print("STARTING EMPIRICAL CHALLENGE ORACLE FOR MILESTONE 1 (M1_R1_R2)")
    print("================================================================")
    oracle = OracleReport()

    compass_data = test_challenge_compass_schema_and_completeness(oracle)
    if compass_data:
        test_prompt_click1_safety_and_rigor(oracle, compass_data)
        test_prompt_click2_tool_targeting(oracle, compass_data)
        test_gold_vs_antipattern_contrast(oracle, compass_data)
        test_office_transfer_presence(oracle, compass_data)

    test_ai_task_briefs_alignment(oracle)
    test_index_html_dom_rendering(oracle)

    success = oracle.summary()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
