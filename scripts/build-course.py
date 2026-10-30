"""Compila el curso estático desde content/; requiere beautifulsoup4.

El HTML se puede leer sin JavaScript. DevBrain navega entre vistas y las
pestañas organizan lecciones y herramientas sin calificar las visitas.
"""
from html import escape
import csv
import hashlib
import json
from pathlib import Path
import re
import sys
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
sys.path.insert(0, str(ROOT / "scripts"))
from course_guidance import guided_intro, guided_challenge, challenge_map, shared_materials_panel
from course_delivery import attach_deliveries
from course_practices import practice_html
from course_demo import render_demo
SHARED_MATERIALS = json.loads((CONTENT / "shared-challenge-materials.json").read_text(encoding="utf-8"))
TASKS = json.loads((CONTENT / "ai-task-briefs.json").read_text(encoding="utf-8"))
CHALLENGES = {k: TASKS[k] for k in TASKS if k.startswith("reto-")}
CHALLENGE_MATERIALS = {k: [] for k in CHALLENGES}
LEARNING_PATHS = json.loads((CONTENT / "learning-paths.json").read_text(encoding="utf-8"))
OFFICE_SITUATIONS = json.loads((CONTENT / "office-situations.json").read_text(encoding="utf-8"))
MODULES = [
    ("m01-fundamentos", "01", "Descubre qué hace la IA por ti", "Martes", "8 h", "RA1 y RA2", "chat", "MG-A01",
     LEARNING_PATHS["m01-fundamentos"]["product"],
     '<p data-mode-only="aula">Después de los retos, dedica 135 min al diagnóstico de abajo. La IA te entrevista sobre la tarea que más tiempo te quita y tú compruebas su propuesta; los tiempos sin medir quedan pendientes.</p><p data-module-review data-minutes="60">Revisa la evidencia 1 (MG-A01) y guarda el archivo en «Guarda tu evidencia». La IA reúne el mapa de carga, el lote de solicitudes y el diagnóstico. En el curso con instructor, esta revisión ocupa 60 min incluidos en las 8 horas del módulo.</p>'),
    ("m02-diseno", "02", "Diseña instrucciones claras", "Miércoles", "9 h", "RA2", "chat", "MG-A02",
     LEARNING_PATHS["m02-diseno"]["product"],
     '<p data-mode-only="aula">Reserva los últimos 60 min de la jornada para la revisión entre pares y el registro de MG-A02. Están incluidos en las 9 horas del módulo.</p>'),
    ("m03-implementacion", "03", "Resuelve tareas de tu área", "Jueves", "9 h", "RA1 y RA2", "hoja", "MG-A03",
     LEARNING_PATHS["m03-implementacion"]["product"], ""),
    ("m04-validacion", "04", "Verifica lo que obtienes", "Viernes", "3 h 30 min", "RA2", "hoja", "MG-A04",
     LEARNING_PATHS["m04-validacion"]["product"], ""),
    ("m05-cierre", "05", "Presenta una mejora", "Viernes", "5 h 30 min", "RA1 y RA2", "diseno", "MG-A05",
     LEARNING_PATHS["m05-cierre"]["product"], ""),
]
TOOLS = {
    "chat": ("Asistente de IA y fuente", "Encarga el procesamiento y el borrador; comprueba los datos y pide los ajustes en el mismo chat."),
    "hoja": ("IA para analizar archivos", "Entrega el archivo, pide el análisis o la limpieza y contrasta la salida sin reconstruir la tabla."),
    "diseno": ("IA para generar productos", "Pide el informe y la lámina a partir del análisis revisado; conserva la fuente y sus límites."),
}
PHASES = [("aprende", "Aprende"), ("observa", "Observa"), ("resuelve", "Resuelve"), ("documenta", "Guarda tu evidencia")]
# Un paréntesis con el código, un RA tras un punto medio o un código suelto; los nombres de archivo no se tocan.
EVIDENCE_CODE = re.compile(r"\s*\(MG-A0[1-5](?: a MG-A0[1-5])?\)|\s*·\s*RA[12](?: y RA[12])?\b|(?<![\w-])MG-A0([1-5])(?![\w.-])")
PLAIN_TAGS = {"script", "style", "pre", "code", "textarea"}
LINK_SKIP = PLAIN_TAGS | {"a", "summary", "button", "abbr", "label", "legend", "h1", "h2", "h3", "h4", "h5", "h6"}


EVIDENCE_NAMES = {item["id"]: item["name"] for item in json.loads((ROOT / "deliverables.registry.json").read_text(encoding="utf-8"))["artifacts"]}


def html(node):
    return str(node) if node else ""


def learning_support(ident):
    """Publica objetivos, conceptos y práctica con retroalimentación por módulo."""
    data = LEARNING_PATHS[ident]
    goal = data["goal"][0].lower() + data["goal"][1:]
    terms = ''.join(f'<div><dt>{escape(term)}</dt><dd>{escape(definition)}</dd></div>'
                    for term, definition in data["terms"])
    learn = f'''<section class="learning-start" aria-labelledby="{ident}-goal-title"><span class="eyebrow">TU META EN ESTE MÓDULO</span><h2 id="{ident}-goal-title">Un resultado que puedes comprobar</h2><p data-learning-goal>Al terminar, podrás {escape(goal)}</p><p class="learning-product"><strong>Vas a obtener:</strong> {escape(data["product"])}</p><details class="term-guide"><summary>Conceptos que usarás · con ejemplos</summary><dl class="learning-terms">{terms}</dl></details></section>'''
    if ident == "preparacion":
        facts = ''.join(f'<div><dt>{escape(title)}</dt><dd>{escape(detail)}</dd></div>'
                        for title, detail in data["setup"])
        learn = f'''<section class="learning-start preparation-start" aria-labelledby="{ident}-goal-title"><h2 id="{ident}-goal-title">Antes de comenzar</h2><p data-learning-goal>Al terminar, podrás {escape(goal)}</p><dl class="preparation-facts">{facts}</dl><p class="preparation-entry-note">Puedes empezar sin saber fórmulas ni programar. Usarás el archivo que ya está preparado y las instrucciones que encontrarás en cada paso.</p><details class="term-guide"><summary>¿Hay una palabra nueva? Consulta estos conceptos</summary><dl class="learning-terms">{terms}</dl></details></section>'''
    checks = []
    assert len(data["checks"]) == 2, ident
    for index, check in enumerate(data["checks"], 1):
        assert len(check["options"]) == 3 and sum(option.get("correct", False) for option in check["options"]) == 1, ident
        check_id = f"check-{ident}-{index}"
        options = ''.join(f'''<label class="check-option"><input type="radio" name="{check_id}" value="{option_index}" aria-describedby="{check_id}-feedback" data-correct="{str(option.get('correct', False)).lower()}" data-feedback="{escape(option['feedback'], quote=True)}"><span>{escape(option['text'])}</span></label>'''
                          for option_index, option in enumerate(check["options"]))
        checks.append(f'''<form id="{check_id}" class="knowledge-check" data-knowledge-check data-state="pending"><p class="check-scenario">{escape(check['scenario'])}</p><fieldset><legend>{index}. {escape(check['question'])}</legend>{options}</fieldset><div class="check-actions"><button type="button" class="button button-primary" data-check-submit>Comprobar respuesta</button><button type="reset" class="text-button">Volver a intentar</button></div><p id="{check_id}-feedback" class="check-feedback" data-check-feedback role="status" aria-live="polite" aria-atomic="true">Elige una opción y comprueba tu respuesta.</p><details class="check-explanation"><summary>Consultar la explicación</summary><p>{escape(check['explanation'])}</p></details></form>''')
    observe = f'''<section class="knowledge-review" aria-labelledby="{ident}-check-title"><div class="panel-heading"><span class="eyebrow">ANTES DEL RETO</span><h3 id="{ident}-check-title">Comprueba lo esencial</h3><p>Cada respuesta trae su razón y puedes intentarlo de nuevo.</p></div><div class="knowledge-checks">{''.join(checks)}</div></section>'''
    if ident == "preparacion":
        observe = observe.replace("ANTES DEL RETO", "PARA CERRAR LA PRÁCTICA").replace("Cada respuesta trae su razón y puedes intentarlo de nuevo.", "Responde estas dos preguntas sobre lo que acabas de practicar. Comprueba tu respuesta y consulta la explicación si necesitas repasar.")
    learn += (CONTENT / "productivity" / f"{ident}.html").read_text(encoding="utf-8")
    return {"learn": learn, "observe": observe}


def module_page(spec, next_id):
    ident, number, title, day, duration, outcome, tool, evidence, product, support = spec
    source = BeautifulSoup((CONTENT / "lessons" / f"{ident}.html").read_text(encoding="utf-8"), "html.parser")
    section = source.select_one("section.station")
    assert section and section.select_one(f'[data-db-evidence="{evidence}"]'), ident
    description = section.select_one(".station-desc").get_text(" ", strip=True)
    hero = section.select_one(".module-hero")
    knowledge = section.select_one(".learning-block")
    practice_widgets = []
    for node in section.select(".tool-lab, .ratio-lab"):
        if node.get('id') in {'prompt-compare-simulator', 'pqrs-evaluator-simulator', 'data-cleaner-simulator', 'decision-simulator', 'anonymization-simulator', 'prompt-lab', 'productivity-roi-calculator'} or 'ratio-lab' in node.get('class', []):
            practice_widgets.append(html(node.extract()))
        else:
            knowledge.append(node.extract())
    for timing in section.select(".learning-timing"):
        if not timing.find_parent(class_="tool-lab") and not timing.find_parent(class_="ratio-lab") and timing not in knowledge.descendants:
            knowledge.append(timing.extract())
    solution = knowledge.select_one('.worked-example[data-ai-cycle]')
    solution_html = html(solution.extract()) if solution else ''
    examples = [html(node.extract()) for node in knowledge.select(".worked-example")]
    tool_name, tool_description = TOOLS[tool]
    prerequisite = f'''<div class="prerequisite"><div><strong>Antes de empezar · {tool_name}</strong>
      <p>{tool_description}</p></div><a href="#preparacion" data-open-tool="{tool}">Repasar la herramienta ↗</a></div>'''
    support_content = learning_support(ident)
    learn = support_content["learn"] + prerequisite + html(hero) + html(knowledge)
    closing_tasks = "".join(html(node) for node in section.select(".challenge-steps"))
    learn = guided_intro(ident, learn)
    observe = '<div class="panel-heading"><h2>Practica con un caso y comprueba tus decisiones.</h2></div>'
    observe += practice_html(ident, ''.join(practice_widgets), solution_html, support_content['observe']) + "".join(examples)
    if ident == 'm03-implementacion':
        observe += (CONTENT / 'examples-m03.html').read_text(encoding='utf-8')
    challenges = []
    for i, card in enumerate(section.select("article.challenge-card")):
        challenge_id = card["id"]
        heading = card.h3.extract()
        opened = " open" if i == 0 else ""
        meta = card.select_one(".challenge-meta")
        material_specs = CHALLENGE_MATERIALS[challenge_id]
        task = TASKS[challenge_id]
        shared_paths = {item["href"] for item in SHARED_MATERIALS}
        shared_specs = [item for item in SHARED_MATERIALS if item["href"] in task["sourceFiles"]]
        material_rows = []
        for material in material_specs:
            material_path = (ROOT / material["href"]).resolve()
            assert material_path.is_relative_to(ROOT) and material_path.is_file(), material["href"]
            filename = material["href"].rsplit("/", 1)[-1]
            material_href = escape(material["href"], quote=True)
            escaped_filename = escape(filename, quote=True)
            material_rows.append(f'''<li class="challenge-material-item"><div><span class="challenge-material-kind">{escape(material["kind"])}</span><code>{escape(filename)}</code><strong>{escape(material["name"])}</strong><p>{escape(material["detail"])}</p></div><a class="challenge-download challenge-file-download" href="{material_href}" download="{escaped_filename}" aria-label="Descargar {escape(material["name"], quote=True)} · {escaped_filename}">Descargar {escape(filename)} <span aria-hidden="true">↓</span></a></li>''')
        shared_note = ""
        if shared_specs:
            shared_names = ", ".join(escape(item["name"]) for item in shared_specs)
            filenames = ", ".join("<code>" + escape(Path(item["href"]).name) + "</code>" for item in shared_specs)
            shared_note = f'<p class="challenge-shared-note"><strong>Este reto también usa:</strong> {shared_names} ({filenames}). El ZIP de este reto ya los incluye en su carpeta fuentes/; también están en «Recursos comunes».</p>'
        own_note = ("El paquete para IA incluye estas fuentes propias. Descárgalas por separado solo si las necesitas fuera del paquete."
                    if material_specs else
                    "Este reto trabaja con el recurso común indicado arriba. El paquete para IA incluye el encargo y esa fuente en su carpeta fuentes/.")
        individual_files = (f'<details class="individual-files"><summary>Descargar {len(material_specs)} archivo' + ("s" if len(material_specs) != 1 else "") + ' por separado</summary><ul class="challenge-material-list">' + "".join(material_rows) + '</ul></details>') if material_specs else ''
        material_block = f'''<section class="challenge-materials" aria-labelledby="{challenge_id}-materiales-title"><div class="challenge-materials-heading"><span class="eyebrow">ARCHIVOS DE ESTE RETO</span><h4 id="{challenge_id}-materiales-title">Archivos para resolver este reto</h4><p>{own_note}</p></div>{shared_note}{individual_files}</section>'''
        body = guided_challenge(card, material_block)
        summary_meta = "".join(f'<span data-mode-only="aula">{escape(item.get_text(" ", strip=True))}</span>' if any(word in item.get_text(" ", strip=True) for word in ("Martes", "Miércoles", "Jueves", "Viernes")) else f'<span>{escape(item.get_text(" ", strip=True))}</span>' for item in (meta.select("span") if meta else []))
        count_label = "archivo propio" if len(material_specs) == 1 else "archivos propios"
        badge = f'{len(material_specs)} {count_label}' if material_specs else "Recurso común"
        if task.get("inlineSources") and not task["sourceFiles"]:
            badge = "Textos en la página"
        challenges.append(f'<article class="challenge-card" id="{card["id"]}" data-material-count="{len(material_specs)}"><details name="retos-{ident}"{opened}><summary><div class="challenge-summary-copy">{heading}<span class="challenge-summary-meta">{summary_meta}</span></div><span class="challenge-summary-count">{badge}</span></summary><div class="challenge-body">{body}</div></details></article>')
    titles = [(card["id"], card.select_one("h3").get_text(" ", strip=True)) for card in BeautifulSoup("".join(challenges), "html.parser").select("article.challenge-card")]
    solve = ('<div class="panel-heading"><h2>Resuelve un reto a la vez.</h2></div>'
             + challenge_map(titles, evidence) + "".join(challenges)
             + "".join(html(node) for node in section.select(".individual-test")))
    if support:
        solve += f'<div class="transfer-tip"><strong>Aplicación y revisión incluidas</strong>{support}</div>'
    solve += closing_tasks
    transfer = LEARNING_PATHS[ident]['transfer']
    solve += f'<section class="transfer-check" data-transfer-check><h3>Antes de cerrar: prueba con otro caso</h3><p>{escape(transfer["scenario"])}</p><p><strong>{escape(transfer["question"])}</strong></p><details><summary>Contrastar mi decisión</summary><p>{escape(transfer["answer"])}</p></details></section>'
    document = f'<div data-db-evidence="{evidence}"></div>'
    tabs = "".join(f'<button type="button" data-tab="{key}"><b aria-hidden="true">{i+1}</b>{label}</button>' for i, (key, label) in enumerate(PHASES))
    panels = []
    for i, ((key, label), body) in enumerate(zip(PHASES, [learn, observe, solve, document])):
        if i < 3:
            next_key, next_label = PHASES[i+1]
            action = f'<button type="button" class="button button-primary" data-next-phase="{next_key}">Continuar con {next_label} <span aria-hidden="true">→</span></button>'
        else:
            label = "Abrir mi Portafolio de Evidencias" if next_id == "portafolio" else "Continuar al siguiente módulo"
            action = f'<a class="button button-primary" href="#{next_id}">{label} <span aria-hidden="true">→</span></a>'
        back = ''
        if i > 0:
            previous_key, previous_label = PHASES[i-1]
            back = f'<button type="button" class="phase-back" data-next-phase="{previous_key}"><span aria-hidden="true">←</span> Volver a {previous_label}</button>'
        panels.append(f'<div class="lesson-panel" data-panel="{key}">{body}<div class="phase-footer">{back}<small>Paso {i+1} de 4 · Módulo {number}</small>{action}</div></div>')
    return f'''<section id="{ident}" class="module-page station" data-nav-title="{title}" data-nav-number="{number}" data-nav-meta="{day} · {duration}" data-learning-module>
      <header class="lesson-header"><div class="page-kicker"><span class="eyebrow">MÓDULO {number}<span data-mode-only="aula"> · {day.upper()}</span></span><span class="quiet-badge" data-mode-only="aula">{duration} de formación directa</span><span class="quiet-badge" data-mode-only="autonomo">{len(titles)} {"reto" if len(titles) == 1 else "retos"} · a tu ritmo</span></div>
      <h1 tabindex="-1">{title}.</h1><p class="lesson-description">{escape(description)}</p>
      <div class="lesson-meta"><span data-mode-only="aula"><strong>Resultado:</strong> {outcome.replace("RA", '<abbr title="Resultado de Aprendizaje">RA</abbr>', 1)}</span><span><strong>Evidencia {int(number)} · {escape(EVIDENCE_NAMES[evidence])}</strong><small data-mode-only="aula"> ({evidence})</small></span><span data-mode-only="aula"><strong>Fechas:</strong> por confirmar</span></div></header>
      
      <div class="lesson-workspace" data-tabs="lesson"><div class="lesson-tabs" data-tablist aria-label="Pasos del módulo {number}">{tabs}</div>{''.join(panels)}</div>
    </section>'''


def resolve_names(markup):
    """Resuelve {{MODULO:id}} y {{RETO:id}} con los nombres de la navegación y de cada reto."""
    modules = {"preparacion": ("00", "Prepara tus herramientas")}
    modules.update({spec[0]: (spec[1], spec[2]) for spec in MODULES})
    challenges = {}
    for spec in MODULES:
        lesson = BeautifulSoup((CONTENT / "lessons" / f"{spec[0]}.html").read_text(encoding="utf-8"), "html.parser")
        challenges.update({card["id"]: card.h3.get_text(" ", strip=True) for card in lesson.select("article.challenge-card")})

    def name(match):
        kind, ident = match.groups()
        if kind == "MODULO":
            number, title = modules[ident]
            return f"{number} · {title.split()[0]}"
        return escape(challenges[ident])

    return re.sub(r"\{\{(MODULO|RETO):([a-z0-9-]+)\}\}", name, markup)


def humanize_codes(soup):
    """Muestra «Evidencia N» en lugar de MG-A0N; el código y los RA quedan visibles solo en el curso con instructor."""
    changed = 0
    for text in soup.find_all(string=EVIDENCE_CODE):
        if any(parent.name in PLAIN_TAGS or parent.get("data-mode-only") == "aula" or "prompt-text" in (parent.get("class") or [])
               for parent in text.parents):
            continue
        pieces, last = [], 0
        for match in EVIDENCE_CODE.finditer(text):
            pieces.append(escape(text[last:match.start()], quote=False))
            code = escape(match.group(0), quote=False)
            pieces.append(f'Evidencia {match.group(1)}<span data-mode-only="aula"> ({code})</span>' if match.group(1)
                          else f'<span data-mode-only="aula">{code}</span>')
            last = match.end()
        pieces.append(escape(text[last:], quote=False))
        text.replace_with(*list(BeautifulSoup("".join(pieces), "html.parser").contents))
        changed += 1
    return changed


def link_crtt(soup):
    """Enlaza la primera mención de CRTT en la prosa de cada módulo con su explicación (#crtt)."""
    modules = {spec[0] for spec in MODULES}
    linked = 0
    for page in soup.select("section.module-page"):
        if page.get("id") not in modules:
            continue
        for text in page.find_all(string=re.compile(r"\bCRTT\b")):
            if any(parent.name in LINK_SKIP or parent.get("id") == "crtt" or "prompt-text" in (parent.get("class") or [])
                   for parent in text.parents):
                continue
            match = re.search(r"\bCRTT\b", text)
            link = soup.new_tag("a", href="#crtt")
            link.string = "CRTT"
            text.replace_with(text[:match.start()], link, text[match.end():])
            linked += 1
            break
    return linked


def content_version(source):
    """Firma el contenido con LF, como lo guarda Git, para que Windows y CI produzcan la misma versión."""
    return str(int(hashlib.sha256(Path(source).read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:12], 16))


def version_assets(html):
    """Versiona cada recurso local por su contenido para que el navegador no use copias antiguas."""
    def stamp(match):
        attribute, path = match.group(1), match.group(2)
        source = ROOT / path
        if not source.is_file():
            return match.group(0)
        return attribute + '="' + path + '?v=' + content_version(source) + '"'
    return re.sub(r'(src|href)="((?:js|css)/[^"?]+)\?v=[^"]*"', stamp, html)


def bundle_styles(shell, target=None):
    """Sirve las hojas del curso en una sola petición y conserva el orden de la cascada."""
    start, end = "<!-- css-bundle:start -->", "<!-- css-bundle:end -->"
    head, rest = shell.split(start, 1)
    block, tail = rest.split(end, 1)
    sources = re.findall(r'<link rel="stylesheet" href="([^"?]+)(?:\?[^"]*)?">', block)
    parts = []
    for source in sources:
        text = (ROOT / source).read_text(encoding="utf-8").lstrip("\ufeff").strip()
        parts.append("/* " + source + " */\n" + text + "\n")
    css = ("/* Generado por scripts/build-course.py desde las hojas de content/shell.html. "
           "Edita las hojas de origen, no este archivo. */\n" + "\n".join(parts))
    target = Path(target or ROOT / "css" / "course.css")
    target.write_text(css, encoding="utf-8", newline="\n")
    version = str(int(hashlib.sha256(css.encode("utf-8")).hexdigest()[:12], 16))
    return head + '<link rel="stylesheet" href="css/course.css?v=' + version + '">' + tail


def main():
    remove_duplicate_challenge_packages()
    pages = [(CONTENT / name).read_text(encoding="utf-8") for name in ["home.html", "preparation.html"]]
    pages[0] = pages[0].replace("{{DEMO_INICIO}}", render_demo())
    pages[1] = pages[1].replace("{{SHARED_MATERIALS}}", shared_materials_panel())
    preparation_support = learning_support("preparacion")
    for phase, markup in preparation_support.items():
        pages[1] = pages[1].replace("{{PREPARATION_" + phase.upper() + "}}", markup)
    for i, spec in enumerate(MODULES):
        next_id = MODULES[i + 1][0] if i < len(MODULES) - 1 else "portafolio"
        pages.append(module_page(spec, next_id))
    pages.append((CONTENT / "portfolio.html").read_text(encoding="utf-8"))
    pages.extend((CONTENT / name).read_text(encoding="utf-8") for name in ["calendar.html", "ecobogota.html"])
    lab = (CONTENT / "analisis-datos/page.html").read_text(encoding="utf-8")
    for fragment in ("fundamentos", "herramientas", "laboratorios", "avanzado"):
        lab = lab.replace("{{LAB_" + fragment.upper() + "}}", (CONTENT / f"analisis-datos/{fragment}.html").read_text(encoding="utf-8"))
    lab_data = {}
    for dataset in ("exoplanetas", "poblacion", "clima", "sismos"):
        with (ROOT / f"materiales/analisis-datos/datos/{dataset}.csv").open(encoding="utf-8-sig", newline="") as source:
            lab_data[dataset] = list(csv.DictReader(source))
    with (ROOT / "materiales/analisis-datos/documentos/ejemplo-verificado.csv").open(encoding="utf-8-sig", newline="") as source:
        lab_data["documentos"] = list(csv.DictReader(source))
    lab_script = "globalThis.LabSourceData = " + json.dumps(lab_data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (ROOT / "js" / "lab-source-data.js").write_text(lab_script, encoding="utf-8", newline="\n")
    lab_version = str(int(hashlib.sha256(lab_script.encode("utf-8")).hexdigest()[:12], 16))
    lab = lab.replace("{{LAB_DATA_SRC}}", "js/lab-source-data.js?v=" + lab_version)
    lab_parsed = BeautifulSoup(lab, "html.parser")
    for index, prompt in enumerate(lab_parsed.select(".lab-prompt"), 1):
        prompt["id"] = prompt.get("id", f"lab-prompt-{index}")
        button = lab_parsed.new_tag("button", type="button", attrs={"class": "button button-outline", "data-copy": prompt["id"]})
        button.string = "Copiar instrucción"
        prompt.insert_after(button)
    pages.append(str(lab_parsed))
    all_pages = resolve_names("\n".join(pages))
    parsed = BeautifulSoup(all_pages, "html.parser")
    for prompt in parsed.select("[data-eco-prompt]"):
        prompt.string = TASKS[prompt["data-eco-prompt"]]["chatPrompt"]
    attach_deliveries(parsed)
    humanize_codes(parsed)
    link_crtt(parsed)
    all_pages = str(parsed)
    fallback = '<ul>' + ''.join(f'<li><a href="#{p["id"]}" data-module-link="{p["id"]}"><span class="nav-number">{p["data-nav-number"]}</span><span>{p["data-nav-title"]}</span></a></li>' for p in parsed.select('.module-page')) + '</ul>'
    shell = version_assets(bundle_styles((CONTENT / "shell.html").read_text(encoding="utf-8")))
    result = shell.replace("{{FALLBACK_NAV}}", fallback).replace("{{PAGES}}", all_pages)
    templates_dialog = '<dialog id="templates-dialog" class="course-dialog" aria-labelledby="templates-title"><div class="dialog-bar"><h2 id="templates-title">Plantillas de prompts para la oficina</h2><button type="button" class="icon-button" data-dialog-close aria-label="Cerrar">×</button></div><div class="dialog-content"><p>Usa estas estructuras CRTT en tus tareas administrativas cotidianas. Puedes copiar el texto con el botón de cada tarjeta y ajustarlo con tu fuente de trabajo.</p><div class="templates-grid"><article class="template-card"><div class="template-card-head"><span class="badge-info">PQRS</span><h3>Atención y respuesta a solicitudes ciudadanas</h3><p>Para proyectar respuestas institucionales corteses y oportunas sin inventar datos.</p></div><pre class="template-code-preview" id="plantilla-oficina-1"><code>Rol: Asistente administrativo en atención al ciudadano.\nContexto: Solicitud formal de usuario sobre trámites del centro.\nTarea: Redactar respuesta institucional clara, respetuosa y comprensible.\nLímites: Usa exclusivamente los datos del radicado. No inventes fechas, números de radicado ni compromisos sin soporte. Todo dato no confirmado debe señalarse como «pendiente de validación con la coordinación».</code></pre><div class="template-card-foot"><button type="button" class="button button-secondary" data-copy="plantilla-oficina-1" data-copy-message="Plantilla copiada. Complétala en el chat con los datos de tu caso, sin información personal.">Copiar plantilla</button></div></article><article class="template-card"><div class="template-card-head"><span class="badge-info">ACTAS</span><h3>Acta de reunión con acuerdos y trazabilidad</h3><p>Para extraer compromisos y diferenciar acuerdos de simples deliberaciones.</p></div><pre class="template-code-preview" id="plantilla-oficina-2"><code>Rol: Secretario técnico de reunión administrativa.\nContexto: Notas o transcripción de la sesión de trabajo.\nTarea: Estructurar el acta separando: Asistentes, Objetivos, Acuerdos aprobados, Propuestas en discusión y Compromisos con responsable y fecha.\nLímites: Cada acuerdo debe indicar el minuto o apartado de origen. No presentes opiniones como acuerdos firmes si no hubo decisión aprobada.</code></pre><div class="template-card-foot"><button type="button" class="button button-secondary" data-copy="plantilla-oficina-2" data-copy-message="Plantilla copiada. Complétala en el chat con los datos de tu caso, sin información personal.">Copiar plantilla</button></div></article><article class="template-card"><div class="template-card-head"><span class="badge-info">LOGÍSTICA</span><h3>Solicitud y verificación de ambientes</h3><p>Para tramitar préstamos de salas o recursos comprobando requisitos y aforo.</p></div><pre class="template-code-preview" id="plantilla-oficina-3"><code>Rol: Auxiliar administrativo de logística y ambientes.\nContexto: Solicitud de reserva de sala o auditorio.\nTarea: Cotejar el pedido con el lineamiento institucional (aforo, anticipación mínima y recursos técnicos).\nLímites: La urgencia manifestada por el solicitante no aprueba la reserva. Prepara un borrador solicitando los datos faltantes y remite al funcionario competente para visto bueno.</code></pre><div class="template-card-foot"><button type="button" class="button button-secondary" data-copy="plantilla-oficina-3" data-copy-message="Plantilla copiada. Complétala en el chat con los datos de tu caso, sin información personal.">Copiar plantilla</button></div></article><article class="template-card"><div class="template-card-head"><span class="badge-info">DATOS</span><h3>Normalización reproducible de planillas</h3><p>Para estructurar y limpiar columnas en tablas sin perder información de origen.</p></div><pre class="template-code-preview" id="plantilla-oficina-4"><code>Rol: Analista de información administrativa.\nContexto: Planilla o tabla con registros sin procesar.\nTarea: Aplicar reglas reproducibles: eliminar espacios iniciales y finales en texto, normalizar estados a mayúsculas y señalar celdas vacías como «REVISAR».\nLímites: Conserva intactas las columnas originales de la fuente. No elimines filas de la tabla.</code></pre><div class="template-card-foot"><button type="button" class="button button-secondary" data-copy="plantilla-oficina-4" data-copy-message="Plantilla copiada. Complétala en el chat con los datos de tu caso, sin información personal.">Copiar plantilla</button></div></article></div></div></dialog>'
    course_dialog = '<dialog id="course-dialog" class="course-dialog" aria-labelledby="course-dialog-title"><div class="dialog-bar"><h2 id="course-dialog-title">Recurso del módulo</h2><button type="button" class="icon-button" data-dialog-close aria-label="Cerrar">×</button></div><div class="dialog-content"><img id="course-dialog-image" alt="" hidden></div></dialog>'
    glossary_dialog = '<dialog id="glossary-dialog" class="course-dialog" aria-labelledby="glossary-title"><div class="dialog-bar"><h2 id="glossary-title">Conceptos para consultar</h2><button type="button" class="icon-button" data-dialog-close aria-label="Cerrar">×</button></div><div class="dialog-content"><div class="glossary-list"><article><h3>IA generativa</h3><p>Produce contenido a partir de instrucciones y contexto. Su respuesta puede ser plausible y aun así incluir errores; contrástala con una fuente.</p></article><article><h3>IA predictiva</h3><p>Estima una categoría o un valor a partir de ejemplos históricos. Requiere datos pertinentes y una prueba con casos no usados para ajustarla. Una estimación no confirma lo que ocurrirá.</p></article><article><h3>Regla automatizada</h3><p>Aplica pasos explícitos y repetibles, como normalizar espacios en una hoja. Si la entrada está vacía o es ambigua, la regla debe dejar visible la revisión.</p></article><article><h3>Deriva de contexto</h3><p>En una conversación larga o con instrucciones contradictorias, la respuesta puede dejar de respetar parte del objetivo o de los límites. Repite las restricciones y revisa cada salida.</p></article><article><h3>Respuesta no sustentada</h3><p>Texto que suena convincente pero no se puede comprobar en la fuente disponible, incluidos datos o referencias inventados.</p></article><article><h3>Revisión humana</h3><p>Una persona competente compara con la fuente y decide si una salida puede usarse. La herramienta no aprueba ni envía el resultado.</p></article><article><h3>CRTT</h3><p>Contexto, Rol, Tarea y Tono: método para estructurar una instrucción clara a la IA. Se completa con fuente, límites y salida.</p></article><article><h3>Línea base</h3><p>Medida inicial de tiempo, volumen y calidad de una tarea antes de cambiar el método, incluyendo la revisión y corrección humana.</p></article><article><h3>Caso testigo</h3><p>Registro de control con cifras conocidas y verificadas (como el Centro A en bienestar.csv) que se comprueba antes de encargar el resto del trabajo para verificar que la IA leyó la fuente.</p></article><article><h3>No consta</h3><p>Estado formal que indica que un dato no está en la fuente y debe permanecer pendiente de confirmar, evitando suposiciones o afirmaciones causales sin sustento.</p></article><article><h3>Pendiente y por confirmar</h3><p>«Pendiente» marca una tarea o una revisión que todavía no ocurre. «Por confirmar» marca un dato que una persona responsable debe validar. En ambos casos no se completa con una suposición.</p></article><article><h3>HITL</h3><p>Sigla en inglés de «persona en el circuito»: el flujo se detiene en un punto definido para que una persona revise y decida antes de continuar.</p></article><article><h3>TRIM</h3><p>Función de hoja de cálculo que quita los espacios al inicio y al final de un texto. En Excel en español se llama ESPACIOS.</p></article><article><h3>Portafolio de Evidencias</h3><p>Espacio digital donde se compilan y contrastan las cinco evidencias curriculares (MG-A01 a MG-A05) antes de su valoración final por el instructor.</p></article></div><p class="source-links">Consulta también la <a href="https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth" target="_blank" rel="noopener noreferrer">historia de la IA en Dartmouth</a> y el artículo original de <a href="https://academic.oup.com/mind/article/LIX/236/433/986238" target="_blank" rel="noopener noreferrer">Alan Turing sobre máquinas e inteligencia</a>.</p></div></dialog>'
    result = result.replace("{{DIALOGS}}", course_dialog + glossary_dialog + templates_dialog)
    result = result.replace('<html lang="es-CO"', '<!-- Generado por scripts/build-course.py desde content/. -->\n<html lang="es-CO"', 1)
    registry = json.loads((ROOT / 'deliverables.registry.json').read_text(encoding='utf-8'))
    assert sorted(node['data-db-evidence'] for node in parsed.select('[data-db-evidence]')) == sorted(item['id'] for item in registry['artifacts'])
    assert len(parsed.select('[data-learning-module]')) == 6
    assert {card["id"] for card in parsed.select("article.challenge-card")} == set(CHALLENGES)
    assert len(OFFICE_SITUATIONS.get("situations", [])) == 14
    assert parsed.select_one("#situaciones-oficina") is not None
    assert parsed.select_one("#manual-situaciones-oficina") is not None
    (ROOT / 'index.html').write_text(result, encoding='utf-8', newline='\n')
    example_dir = ROOT / 'materiales/eco-capacitacion'
    example_dir.mkdir(parents=True, exist_ok=True)
    for source_name, target_name in [('eco-training-example.html', 'simulacion.html'), ('eco-training-example.json', 'resultado.json')]:
        (example_dir / target_name).write_bytes((CONTENT / source_name).read_bytes())
    print(f'Curso generado: 6 módulos, 5 evidencias curriculares, 2 complementos y 11 vistas de navegación; {len(CHALLENGES)} paquetes de retos y laboratorio de datos independiente.')


def remove_duplicate_challenge_packages(root=ROOT):
    """Retira solo los ZIP de retos en la ruta antigua, ya reemplazados por los paquetes únicos de IA."""
    package_directory = Path(root) / "materiales" / "retos" / "paquetes"
    removed = 0
    for challenge_id in CHALLENGES:
        obsolete = package_directory / (challenge_id + ".zip")
        if obsolete.is_file():
            obsolete.unlink()
            removed += 1
    if package_directory.is_dir() and not any(package_directory.iterdir()):
        package_directory.rmdir()
    return removed


if __name__ == '__main__':
    main()
