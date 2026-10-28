"""Presentación del recorrido breve; conserva el contenido y los contratos del curso."""
from html import escape
import hashlib
import json
from pathlib import Path
import sys
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parent))
from course_delivery import render_task
from ai_prompts import repair_text

CONTENT = Path(__file__).resolve().parents[1] / "content"
ORIENTATION = json.loads((CONTENT / "module-orientation.json").read_text(encoding="utf-8"))
GUIDANCE = json.loads((CONTENT / "challenge-guidance.json").read_text(encoding="utf-8"))
SHARED_MATERIALS = json.loads((CONTENT / "shared-challenge-materials.json").read_text(encoding="utf-8"))
TASKS = json.loads((CONTENT / "ai-task-briefs.json").read_text(encoding="utf-8"))
COMPASS_PATH = CONTENT / "challenge-compass.json"
COMPASS = json.loads(COMPASS_PATH.read_text(encoding="utf-8")) if COMPASS_PATH.is_file() else {}
DECISIONS_PATH = CONTENT / "challenge-decisions.json"
DECISIONS = json.loads(DECISIONS_PATH.read_text(encoding="utf-8")) if DECISIONS_PATH.is_file() else {}
STAGES = [("Prepara", "Descarga el paquete para IA"), ("Pide a la IA", "Escribe tu instrucción y compárala con la referencia"),
          ("Revisa", "Comprueba tu resultado"), ("Descarga", "Conserva el resultado para tu evidencia")]


def render_challenge_decisions(ident):
    """Genera el bloque de decisiones formativas y el imprevisto del Paso 3."""
    if ident not in DECISIONS:
        return ""
    raw = DECISIONS[ident]
    spec = json.loads(json.dumps(raw))
    spec["id"] = ident
    spec["version"] = 1
    items_html = []
    for question in spec["questions"]:
        question.setdefault("type", "choice")
        question["options"] = [item if isinstance(item, list) else [str(index), item]
                               for index, item in enumerate(question["options"])]
        q_ident = f"decision-{ident}-{question['id']}"
        controls = ''.join(
            f'<label class="check-option"><input type="radio" name="{q_ident}" value="{escape(str(value), quote=True)}" aria-describedby="{q_ident}-feedback"><span>{escape(label)}</span></label>'
            for value, label in question["options"]
        )
        initial_hint = question.get("hint") or (question["hints"][0] if question.get("hints") else "")
        kind_badge = '<span class="eyebrow">IMPREVISTO EN LA PRÁCTICA</span>' if question.get("kind") == "unforeseen" else '<span class="eyebrow">DILEMA DE VERIFICACIÓN</span>'
        items_html.append(
            f'<form id="{q_ident}" class="case-question" data-case-question="{escape(question["id"], quote=True)}" data-decision-kind="{escape(question.get("kind", "dilemma"), quote=True)}" data-state="pending">'
            f'<fieldset><legend>{kind_badge} {escape(question["prompt"])}</legend><div class="case-inputs">{controls}</div></fieldset>'
            f'<div class="check-actions"><button type="button" class="button button-primary" data-case-submit>Comprobar respuesta</button><button type="button" class="text-button" data-case-hint>Consultar una pista</button></div>'
            f'<p id="{q_ident}-feedback" data-case-feedback role="status" aria-live="polite">Elige una opción o completa el cálculo y comprueba tu respuesta.</p>'
            f'<p data-case-hint-text hidden>{escape(initial_hint)}</p></form>'
        )
    fingerprint = json.dumps({"definition": spec}, ensure_ascii=False, sort_keys=True)
    spec["revision"] = hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()[:16]
    payload = json.dumps(spec, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    title_id = f"decisions-{ident}-title"
    return (
        f'<section class="case-practice challenge-decisions" data-challenge-decisions="{escape(ident, quote=True)}" data-case-id="{escape(ident, quote=True)}" aria-labelledby="{title_id}">'
        f'<header class="case-header"><span class="eyebrow">CRITERIO ANTE EL RESULTADO</span><h4 id="{title_id}">Decide con tu resultado</h4>'
        f'<p>{escape(spec["intro"])}</p>'
        f'<p class="case-summary" data-case-summary role="status" aria-live="polite">Sin empezar</p></header>'
        f'<div class="challenge-decisions-list" data-case-stage="0">{"".join(items_html)}</div>'
        f'<footer class="case-footer"><button type="button" data-case-reset>Reiniciar estas decisiones</button>'
        f'<p data-case-save-status role="status" aria-live="polite">Activa JavaScript para guardar tus respuestas en este navegador.</p></footer>'
        f'<script type="application/json" data-case-spec>{payload}</script></section>'
    )


def render_challenge_compass(ident):
    """Genera la Brújula de Decisión, el estándar de oro y la transferencia."""
    if ident not in COMPASS:
        return ""
    data = COMPASS[ident]
    compass = data["compass"]
    comparison = data["comparison"]
    transfer = data["officeTransfer"]

    return f'''<div class="decision-compass-panel" aria-labelledby="{ident}-compass-title"><div class="compass-header"><span class="eyebrow">CÓMO DECIDIR CON IA</span><h4 id="{ident}-compass-title">Cuatro decisiones antes de empezar</h4></div><div class="decision-compass-grid"><div class="compass-step"><span class="compass-step-num">1</span><div class="compass-step-body"><strong>Diagnóstico de la situación</strong><p>{escape(compass["diagnosis"])}</p></div></div><div class="compass-step"><span class="compass-step-num">2</span><div class="compass-step-body"><strong>Combinación de IA y herramienta</strong><p>{escape(compass["toolCombination"])}</p></div></div><div class="compass-step"><span class="compass-step-num">3</span><div class="compass-step-body"><strong>Límite de datos y decisión</strong><p>{escape(compass["goldenRule"])}</p></div></div><div class="compass-step"><span class="compass-step-num">4</span><div class="compass-step-body"><strong>Formato del producto</strong><p>{escape(compass["productFormat"])}</p></div></div></div><div class="gold-vs-antipattern-panel"><div class="comparison-card gold-standard"><span class="comparison-tag">Resultado esperado</span><strong>Lo que muestra un buen producto</strong><p>{escape(comparison["goldStandard"])}</p></div><div class="comparison-card antipattern"><span class="comparison-tag">Error frecuente</span><strong>Lo que debes evitar</strong><p>{escape(comparison["antipattern"])}</p></div></div><div class="office-transfer-panel"><span class="eyebrow">TRANSFERENCIA A LA OFICINA</span><strong>Aplicación en tu labor cotidiana</strong><p>{escape(transfer)}</p></div></div>'''


def render_office_step(ident):
    """Hace visible en «Recibe» el paso del resultado revisado a la herramienta de oficina."""
    product = COMPASS.get(ident, {}).get("compass", {}).get("productFormat", "")
    marker = "Paso a la oficina:"
    if marker not in product:
        return ""
    step = product.split(marker, 1)[1].strip()
    return f'<p class="stage-office-step"><strong>Llévalo a la oficina:</strong> {escape(step)}</p>'


def guided_intro(ident, full_content):
    """Muestra la explicación esencial y reúne los esquemas de consulta."""
    data = ORIENTATION[ident]
    visual = (CONTENT / "orientation" / f"{ident}.html").read_text(encoding="utf-8")
    concepts = ''.join(f'<li><span aria-hidden="true">{i}</span><div><strong>{escape(title)}</strong><p>{escape(detail)}</p></div></li>'
                       for i, (title, detail) in enumerate(data["concepts"], 1))
    content = BeautifulSoup(full_content, "html.parser")
    # La meta, los conceptos y los ejemplos permanecen; se retiran las rutas genéricas repetidas.
    for heading in content.select('.learning-start > h2'):
        heading.name = 'h3'
        heading.string = 'Tu meta'
    for node in content.select('.method-route, .learning-product, .learning-start > h2, .learning-start > .eyebrow'):
        node.decompose()
    for hero in content.select('.module-hero'):
        timing = hero.select_one('.phase-label')
        if timing:
            hero.insert_before(timing.extract())
        hero.decompose()
    for quick in content.select('.ai-quick-lesson'):
        example = quick.select_one('[data-ai-mini-example]')
        if example:
            quick.insert_before(example.extract())
        quick.decompose()
    for details in content.select('.learning-block > details.course-context'):
        if details.has_attr('data-preserve-accordion') or 'secondary-theory' in details.get('class', []):
            continue
        summary = details.find('summary', recursive=False)
        if summary:
            summary.decompose()
        details.unwrap()
    for diagram in content.select('.learning-block .native-diagram'):
        if diagram.get('data-diagram-visible') == 'true' or diagram.has_attr('data-diagram-visible'):
            continue
        title = diagram.select_one('h3, h4')
        reference = content.new_tag('details', attrs={'class': 'reference-library'})
        summary = content.new_tag('summary')
        summary.string = 'Consultar el esquema: ' + (title.get_text(' ', strip=True) if title else 'resumen visual')
        reference.append(summary)
        block = diagram.find_parent(class_='learning-block')
        reference.append(diagram.extract())
        block.append(reference)
    for node in content.select('#prompt-lab, #prompt-compare-simulator, #pqrs-evaluator-simulator, #data-cleaner-simulator, #decision-simulator, #anonymization-simulator, #productivity-roi-calculator, .ratio-lab'):
        node.decompose()
    productivity = content.select_one('.productivity-lesson')
    productivity_html = str(productivity.extract()) if productivity else ''
    return f'''<section class="module-brief" aria-labelledby="{ident}-brief-title"><div class="brief-lead"><span class="eyebrow">EMPIEZA AQUÍ</span><h2 id="{ident}-brief-title">{escape(data["question"])}</h2><p>{escape(data["essential"])}</p></div><ol class="module-concept-map" aria-label="Decisiones de este módulo">{concepts}</ol>{visual}<div class="brief-product"><span aria-hidden="true">↳</span><div><strong>Al terminar, tendrás</strong><p>{escape(data["product"])}</p></div></div><aside class="brief-review"><strong>Una comprobación concreta</strong><p>{escape(data["review"])}</p></aside><a href="#metodo-comun">Consultar cómo trabajar y guardar el resultado →</a></section><div class="module-explanation"><div class="module-reading">{content}</div>{productivity_html}</div><button type="button" class="button button-primary" data-next-phase="observa">Abrir la práctica del módulo <span aria-hidden="true">→</span></button>'''


def challenge_map(titles, evidence):
    """Relaciona cada reto con su resultado y conserva el orden pedagógico."""
    cards = ''.join(f'<button type="button" class="challenge-map-card" data-open-challenge="{escape(ident)}"><span class="challenge-map-number" aria-hidden="true">{i:02}</span><span><strong>{escape(title)}</strong><small>{escape(GUIDANCE[ident]["result"])}</small></span><span aria-hidden="true">↗</span></button>'
                    for i, (ident, title) in enumerate(titles, 1))
    count = f'{len(titles)} reto' + ("s" if len(titles) != 1 else "")
    return f'''<section class="challenge-map" aria-label="Retos de este módulo"><div class="challenge-map-heading"><span class="eyebrow">TU PRÁCTICA</span><span>{count} <span aria-hidden="true">→</span> {escape(evidence)}</span></div><div class="challenge-map-grid">{cards}</div><p>Abre un reto después de ensayar el caso. Sus cuatro pasos te indican qué archivo usar, qué encargo copiar, cómo revisar el resultado y dónde guardarlo.</p></section>'''


def shared_materials_panel():
    """Publica una sola descarga común antes de que comience la primera práctica."""
    items = ''.join(
        f'<li><a download href="{escape(item["href"], quote=True)}"><strong>{escape(item["name"])}</strong><code>{escape(Path(item["href"]).name)}</code></a><span>{escape(item["detail"])}</span></li>'
        for item in SHARED_MATERIALS
    )
    count = len(SHARED_MATERIALS)
    return f'''<aside class="challenge-shared-materials" aria-labelledby="shared-materials-title"><div><span class="eyebrow">UNA DESCARGA PARA VARIAS PRÁCTICAS</span><h2 id="shared-materials-title">Guarda estos archivos antes de comenzar</h2><p>El paquete reúne {count} archivos que se vuelven a usar en la preparación, los retos, el integrador y sus variantes. Cada ZIP de reto ya trae los que necesita; descarga este paquete si prefieres tenerlos todos juntos.</p><a class="button button-primary" href="materiales/ia/recursos-compartidos.zip" download>Descargar paquete de recursos comunes (.zip) ↓</a></div><details><summary>Descargar los archivos uno por uno</summary><p>Usa esta opción si tu equipo no permite extraer archivos ZIP.</p><ul>{items}</ul></details></aside>'''


def guided_challenge(card, materials):
    """Expone un encargo y tres controles; conserva el detalle para consulta."""
    ident = card["id"]
    data = GUIDANCE[ident]
    task = TASKS[ident]
    tag_factory = BeautifulSoup("", "html.parser")
    shared_paths = {item["href"] for item in SHARED_MATERIALS}
    own_sources = [Path(path).name for path in task["sourceFiles"] if path not in shared_paths]
    shared_sources = [Path(path).name for path in task["sourceFiles"] if path in shared_paths]
    summary = card.find(lambda node: node.name == "p" and node.find("strong")
                        and node.find("strong").get_text(" ", strip=True).startswith("Vas a obtener"))
    if summary:
        label = summary.find("strong")
        label.replace_with("Vas a obtener: ")
        for sibling in list(summary.contents):
            if isinstance(sibling, str) and sibling.strip():
                sibling.extract()
        summary.append(task["output"])
    source_note = card.select_one(".tool-route")
    if source_note:
        label = source_note.find("strong")
        label_text = label.get_text(" ", strip=True) if label else "Prepara las fuentes:"
        previous_text = source_note.get_text(" ", strip=True)
        task_note = previous_text[len(label_text):].strip()
        source_note.clear()
        source_note.append(label or "Archivos para este encargo: ")
        details = [task_note] if task_note else []
        missing_own = [name for name in own_sources if name.casefold() not in task_note.casefold()]
        if missing_own:
            details.append("Fuentes propias: " + ", ".join(missing_own) + ".")
        missing_shared = [name for name in shared_sources if name.casefold() not in task_note.casefold()]
        if missing_shared:
            details.append("Recurso común: " + ", ".join(missing_shared)
                           + "; ya viene en la carpeta fuentes/ del paquete.")
        if not any(label in task_note.casefold() for label in ("chat autorizado", "antigravity", "codex")):
            details.append("En un chat autorizado o en Antigravity/Codex, adjunta solo estas fuentes y conserva intactos los originales.")
        source_note.append(" " + " ".join(details))
    checks_list = card.select_one("[data-ai-review-checks]")
    if checks_list:
        checks_list.clear()
        for check in task["checks"]:
            item = tag_factory.new_tag("li")
            item.string = check
            checks_list.append(item)
    for repair in card.select(".prompt-text"):
        repair.clear()
        repair.append(repair_text(task))
    for details in card.select("details.course-context"):
        summary_node = details.find("summary")
        if not summary_node or not summary_node.get_text(" ", strip=True).startswith("Consultar la distribución del tiempo"):
            continue
        summary_node.string = "Tiempo sugerido para cada paso"
        details["data-stage-timing"] = ""
        list_node = details.find("ol")
        if list_node:
            source_text = ", ".join(own_sources + shared_sources)
            if len(list_node.find_all("li", recursive=False)) >= 5:
                steps = [
                    "Descarga el paquete de este reto y elige «Extraer todo».",
                    ("Adjunta " + source_text + ". " if source_text else "Adjunta las fuentes que enumera el encargo. ")
                    + "Usa solo esos archivos; todos están en la carpeta fuentes/ del paquete, incluidos los recursos comunes.",
                    "Escribe tu instrucción en el chat, pide la revisión y después copia el encargo de referencia en la misma conversación.",
                    "Abre el producto obtenido y comprueba los criterios de esta actividad. Si un dato o fuente falla, copia la solicitud de ajuste y vuelve a revisar.",
                    "Adjunta tu entrega en «Guarda tu evidencia». La revisión humana queda pendiente hasta que la realices.",
                ]
            else:
                steps = [
                    (("Descarga y extrae el paquete. Adjunta " + source_text + ". ") if source_text else "Descarga y extrae el paquete; adjunta las fuentes que enumera el encargo. ")
                    + "Todas las fuentes, incluidas las comunes, están en la carpeta fuentes/ del paquete.",
                    "Escribe tu instrucción en el chat, pide la revisión y después copia el encargo de referencia en la misma conversación.",
                    "Abre el producto obtenido y comprueba los criterios de esta actividad. Si un dato o fuente falla, copia la solicitud de ajuste y vuelve a revisar.",
                    "Adjunta tu entrega en «Guarda tu evidencia». La revisión humana queda pendiente hasta que la realices.",
                ]
            old_items = list(list_node.find_all("li", recursive=False))
            for item, text in zip(old_items, steps):
                duration = item.find("strong")
                duration_text = duration.get_text(" ", strip=True) if duration else ""
                item.clear()
                if duration_text:
                    strong = tag_factory.new_tag("strong")
                    strong.string = duration_text
                    item.append(strong)
                    item.append(" ")
                item.append(text)
        break
    save_note = card.find(lambda node: node.name == "p" and node.find("strong")
                          and node.find("strong").get_text(" ", strip=True).startswith("Guarda el resultado"))
    if save_note:
        save_note.decompose()
    bridge = card.select_one(".challenge-deliverable-bridge .bridge-info")
    if bridge:
        # El botón del puente ya nombra su destino; el aviso repetía el paso 4.
        bridge.decompose()
    groups = [[], [], [], []]
    # El paso 3 muestra las comprobaciones y una acción; los apoyos quedan plegados.
    review = {"checks": [], "copy": [], "repair": [], "timing": [], "example": []}
    for node in card.find_all(recursive=False):
        if node.has_attr("data-ai-task") or node.get("data-copy", "").endswith("-ai-prompt"):
            continue
        classes = set(node.get("class", []))
        text = node.get_text(" ", strip=True)
        if "challenge-meta" in classes:
            continue
        if "challenge-deliverable-bridge" in classes or text.startswith(("Criterio:", "Se acepta cuando:", "Guarda el resultado:", "Guarda tu evidencia:")):
            groups[3].append(str(node))
        elif node.has_attr('data-ai-review-checks'):
            review["checks"].append(str(node))
        elif node.get('data-copy', '').endswith('-ajuste'):
            review["copy"].append(str(node))
        elif node.get('id', '').endswith('-ajuste') or text.startswith('Si falta algo:'):
            review["repair"].append(str(node))
        elif node.name == 'details' and node.has_attr('data-stage-timing'):
            review["timing"].append(str(node))
        elif node.name == 'details':
            node.find('summary').decompose()
            review["example"].append(node.decode_contents())
        elif "tool-route" in classes:
            groups[0].append(str(node))
        else:
            groups[1].append(str(node))
    sources_reference = ''.join(groups[0])
    groups[0] = [f'<a class="button button-primary ai-kit-primary" href="materiales/ia/{ident}.zip" download>Descargar paquete del reto ↓</a><p>Extrae el ZIP con «Extraer todo». Trae el encargo y, en la carpeta <code>fuentes/</code>, todo lo que vas a adjuntar.</p>',
                 f'<details class="ai-source-reference"><summary>Consultar archivos individuales y referencias</summary>{sources_reference}{materials}</details>',
                 '<p class="file-help-link"><a href="#metodo-comun">Ayuda: abrir el paquete, usar el encargo y guardar el resultado →</a></p>']
    compass_html = render_challenge_compass(ident)
    details_content = compass_html + ''.join(groups[1])
    more_details = f'<details class="ai-source-reference"><summary>Antes de copiar: decisiones clave y ejemplos</summary>{details_content}</details>' if details_content else ''
    groups[1] = [render_task(ident, include_downloads=False), more_details]
    preview = f'''<figure class="output-preview"><table><caption>Ejemplo de comprobación · úsalo para revisar tu trabajo</caption><tbody><tr><th scope="row">Fuente</th><td>{escape(data["source"])}</td></tr><tr><th scope="row">Qué revisas</th><td>{escape(data["review"])}</td></tr><tr><th scope="row">Resultado</th><td>{escape(data["output"])}</td></tr></tbody></table></figure>'''
    groups[2] = ['<div class="stage-main"><p class="stage-check-intro">Abre tu página de resultado y revisa estos tres puntos con la fuente:</p>',
                 *review["checks"],
                 '<p class="stage-repair">Si alguno falla, copia la solicitud de ajuste, envíala en el mismo chat y vuelve a revisar.</p>',
                 *review["copy"],
                 '<details class="ai-source-reference"><summary>Ver el texto que se copia</summary>' + ''.join(review["repair"]) + '</details></div>',
                 '<div class="stage-support"><details class="ai-source-reference"><summary>Ver un ejemplo resuelto</summary>' + ''.join(review["example"]) + preview + '</details>',
                 '<details class="ai-source-reference challenge-decisions-practice"><summary>Ensaya con tres errores frecuentes</summary>' + render_challenge_decisions(ident) + '</details>',
                 *review["timing"], '</div>']
    groups[3].insert(0, f'<p class="stage-save-tip">Selecciona la página resultado-{ident}.html en «Guarda tu evidencia»; no prepares otra entrega. La revisión humana y la valoración del instructor siguen pendientes.</p>')
    groups[3].insert(1, render_office_step(ident))
    buttons = ''.join(f'<button type="button" data-stage-select="{i}" aria-controls="{ident}-stage-{i}"><span aria-hidden="true">{i+1}</span>{title}</button>' for i, (title, _) in enumerate(STAGES))
    panels = ''.join(f'<section id="{ident}-stage-{i}" class="challenge-stage" data-challenge-stage="{i}" aria-labelledby="{ident}-stage-title-{i}"><h4 id="{ident}-stage-title-{i}"><span>Paso {i+1}.</span> {detail}</h4>{"".join(groups[i])}</section>' for i, (_, detail) in enumerate(STAGES))
    return f'''<div class="challenge-result"><span class="eyebrow">EL RESULTADO QUE VAS A GUARDAR</span><p>{escape(data["result"])}</p></div><div data-challenge-guide="{ident}"><nav class="challenge-stage-nav" aria-label="Pasos de este reto">{buttons}</nav><p class="challenge-stage-status" data-stage-status role="status" aria-live="polite">Cuatro pasos para resolver el reto. Avanzar entre pasos no guarda ni aprueba una evidencia.</p>{panels}<div class="challenge-stage-actions"><button type="button" class="button button-secondary" data-stage-previous>← Paso anterior</button><span>El guardado se hace en «Guarda tu evidencia».</span><button type="button" class="button button-primary" data-stage-next>Siguiente paso →</button></div></div>'''
