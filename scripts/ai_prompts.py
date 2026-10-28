"""Arma la instrucción visible y el bloque técnico de cada reto desde una sola fuente.

La web, ENCARGO-CHAT.md y LEEME.html usan estas funciones, así que el texto
copiado coincide siempre con el del paquete.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "content/ai-task-briefs.json"
COACH = json.loads((ROOT / "content/prompt-coach.json").read_text(encoding="utf-8"))
PARTS = [(part["key"], part["label"]) for part in COACH["parts"]]
WORD_RANGE = (70, 150)


def has_brief(task):
    return "brief" in task


def visible_text(task):
    """Instrucción que el aprendiz lee: partes CRTT, límites y técnica del reto."""
    brief = task["brief"]
    lines = [f"{label}: {brief[key]}" for key, label in PARTS]
    lines.append(f"Técnica · {brief['tecnica']['nombre']}: {brief['tecnica']['frase']}")
    return "\n".join(lines)


def comparison_field(task):
    keys = task["fieldKeys"]
    return "uso_ia_y_revision" if "uso_ia_y_revision" in keys else keys[-1]


def technical_block(task, mode="chat"):
    """Formato para guardar: se copia junto con la instrucción, pero no se muestra al principio."""
    compare = COACH["compare"].replace("{campo}", comparison_field(task))
    prompt = task["idePrompt" if mode == "ide" else "chatPrompt"]
    return "\n\n".join([COACH["technicalHeading"], compare, prompt])


def copy_text(task, mode="chat"):
    return visible_text(task) + "\n\n" + technical_block(task, mode)


def coach_text(task):
    brief = task["brief"]
    return COACH["coach"].replace("{meta}", brief["meta"]).replace("{tecnica}", brief["tecnica"]["nombre"])


def template_text(task):
    return "\n".join(task["brief"].get("huecos", []))


def repair_text(task):
    checks = " ".join(f"{index}) {check}" for index, check in enumerate(task["checks"], 1))
    return COACH["repair"].replace("{checks}", checks)


def validate_brief(key, task):
    """Explica qué falta en la instrucción visible de un reto."""
    brief = task["brief"]
    level = brief.get("apoyo")
    if level not in COACH["levels"]:
        raise ValueError(f"{key}: el nivel de apoyo debe ser comentado, huecos o propio.")
    for part, label in PARTS:
        if not str(brief.get(part, "")).strip():
            raise ValueError(f"{key}: falta la parte {part} ({label}).")
    technique = brief.get("tecnica", {})
    if not technique.get("nombre") or not technique.get("frase") or not brief.get("meta"):
        raise ValueError(f"{key}: la técnica necesita nombre y frase, y el brief necesita una meta.")
    if (level == "comentado") != ("notas" in brief) or ("notas" in brief and set(brief["notas"]) != {part for part, _ in PARTS}):
        raise ValueError(f"{key}: solo el nivel comentado lleva notas, una por cada parte.")
    holes = brief.get("huecos", [])
    if (level == "huecos") != bool(holes) or any("___" not in line for line in holes):
        raise ValueError(f"{key}: solo el nivel con huecos lleva plantilla, y cada línea marca sus espacios con ___.")
    if any("[" in line or "]" in line for line in holes):
        raise ValueError(f"{key}: la plantilla usa ___ en lugar de corchetes.")
    words = len(visible_text(task).split())
    if not WORD_RANGE[0] <= words <= WORD_RANGE[1]:
        raise ValueError(f"{key}: la instrucción visible tiene {words} palabras; debe tener entre {WORD_RANGE[0]} y {WORD_RANGE[1]}.")


def load_catalog(path=None):
    catalog = json.loads(Path(path or CATALOG).read_text(encoding="utf-8"))
    for key, task in catalog.items():
        if has_brief(task):
            validate_brief(key, task)
    return catalog
