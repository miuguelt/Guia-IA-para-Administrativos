"""Arma la demostración breve de Inicio con los correos de práctica del Reto 4."""
import csv
from html import escape
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEMO = json.loads((ROOT / "content" / "prompt-coach.json").read_text(encoding="utf-8"))["demo"]


def load_messages(path, count):
    """Lee los primeros mensajes del CSV; las filas de título y avisos no son registros."""
    with Path(path).open(encoding="utf-8-sig", newline="") as source:
        rows = list(csv.reader(source, delimiter=";"))
    header = next(index for index, row in enumerate(rows) if row and row[0] == "Código")
    return [dict(zip(rows[header], row)) for row in rows[header + 1:] if row and row[0]][:count]


def demo_prompt(spec, messages):
    """Inserta los mensajes en la instrucción para que el aprendiz no tenga que adjuntar archivos."""
    lines = "\n".join(f"{item['Código']} | {item['Asunto']} | {item['Cuerpo del mensaje']} | {item['Personas afectadas']} | {item['Plazo']}"
                      for item in messages)
    return spec["instruction"].replace("{mensajes}", lines)


def render_demo(spec=DEMO):
    """Publica el encargo copiable, un ejemplo de tres filas y la pregunta sobre el tiempo."""
    messages = load_messages(ROOT / spec["source"], spec["count"])
    codes = {item["Código"] for item in messages}
    missing = [code for code, _, _ in spec["sample"] if code not in codes]
    if missing:
        raise ValueError("El ejemplo cita mensajes que no están en la demostración: " + ", ".join(missing))
    rows = "".join(f'<tr><th scope="row">{escape(code)}</th><td>{escape(level)}</td><td>{escape(reason)}</td></tr>'
                   for code, level, reason in spec["sample"])
    return f'''<section class="home-demo" id="demo-inicio" aria-labelledby="demo-inicio-title"><span class="eyebrow">{escape(spec["eyebrow"])}</span><h2 id="demo-inicio-title">{escape(spec["title"])}</h2><p>{escape(spec["intro"])}</p><div class="home-demo-actions"><button type="button" class="button button-primary" data-copy="demo-inicio-prompt" data-copy-message="{escape(spec["copyMessage"])}">{escape(spec["copyLabel"])}</button><details class="home-demo-prompt"><summary>{escape(spec["detailsLabel"])}</summary><pre class="prompt-template" id="demo-inicio-prompt">{escape(demo_prompt(spec, messages))}</pre></details></div><div class="table-scroll" role="region" tabindex="0" aria-labelledby="demo-inicio-caption"><table class="home-demo-sample"><caption id="demo-inicio-caption">{escape(spec["sampleCaption"])}</caption><thead><tr><th scope="col">Código</th><th scope="col">Prioridad</th><th scope="col">Razón</th></tr></thead><tbody>{rows}</tbody></table></div><p class="home-demo-question">{escape(spec["question"])}</p><a href="#reto-4">{escape(spec["next"])} <span aria-hidden="true">→</span></a></section>'''
