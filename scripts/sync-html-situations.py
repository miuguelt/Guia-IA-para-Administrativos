#!/usr/bin/env python3
"""Genera desde content/office-situations.json el selector de la portada, el bloque
«Aprender con IA» y el manual del portafolio, con su descarga en Markdown.

El HTML se escribe entre marcadores <!-- situaciones:NOMBRE --> y <!-- /situaciones:NOMBRE -->,
de modo que el resto de cada página se conserva. Ejecuta `python scripts/sync-html-situations.py`
después de editar el JSON y luego `npm run build`.
"""

from html import escape
import json
from pathlib import Path
import re
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
DATA_PATH = CONTENT / "office-situations.json"
LEARNING = "aprendizaje-continuo"
FILTERS = (("todas", "Todas"), ("sede-coordinacion", "Gestión de sede"), ("gestion-documental", "Gestión documental"))

ICONS = {
    "comite": '<circle cx="9" cy="7" r="3.5"/><path d="M2 20v-1a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v1M17 3.5a3.5 3.5 0 0 1 0 7M22 20v-1a4 4 0 0 0-3-3.9"/>',
    "plataforma": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    "cuenta": '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    "peticion": '<path d="M5 5h14l2 8v6H3v-6z"/><path d="M3 13h5l2 3h4l2-3h5"/>',
    "acta": '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v2H9zM9 10h6M9 14h6M9 18h3"/>',
    "tabla": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
    "oficio": '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    "flujo": '<rect x="3" y="3" width="7" height="5" rx="1"/><rect x="14" y="16" width="7" height="5" rx="1"/><path d="M6.5 8v5h11v3"/>',
    "idea": '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
    "pregunta": '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>',
    "conversacion": '<path d="M4 5h16v10H9l-5 4z"/>',
    "ruta": '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
}


def load(path=DATA_PATH):
    """Lee el catálogo y comprueba que cada ficha tenga los campos que se publican."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    required = ("id", "category", "categoryLabel", "title", "shortTitle", "icon", "problemDescription", "recommendedAiTool",
                "securityShield", "accuracyShield", "sampleData", "basePrompt", "practiceRelation", "productFormat")
    for item in data["situations"]:
        missing = [key for key in required if not item.get(key)]
        assert not missing, f"{item.get('id')}: faltan {missing}"
        assert item["icon"] in ICONS, f"{item['id']}: icono desconocido {item['icon']}"
        assert item["practiceRelation"] in {"practica", "relacionada", "ninguna"}, item["id"]
        assert (item["practiceRelation"] == "ninguna") == (not item.get("challengeLink")), item["id"]
    return data


def split(situations):
    """Separa las situaciones de oficina de las formas de aprender con IA."""
    office = [item for item in situations if item["category"] != LEARNING]
    learning = [item for item in situations if item["category"] == LEARNING]
    return office, learning


def icon(name):
    """Pictograma decorativo que hereda el color del texto."""
    return f'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>'


def paragraphs(text):
    """Convierte bloques separados por línea en blanco en párrafos y conserva los saltos de lista."""
    blocks = [block for block in text.split("\n\n") if block.strip()]
    return "".join("<p>" + "<br>".join(escape(line) for line in block.split("\n")) + "</p>" for block in blocks)


def practice_link(item):
    """Enlace al reto: «Practica» cuando el reto trabaja la misma tarea y «Técnica relacionada» si solo comparte el método."""
    if item["practiceRelation"] == "ninguna":
        return ""
    label = "Practícala en" if item["practiceRelation"] == "practica" else "Técnica relacionada en"
    return f'<p class="detail-practice"><span>{label}</span> <a href="{escape(item["challengeLink"])}">{escape(item["challengeName"])} <span aria-hidden="true">→</span></a></p>'


def prompt_block(item, prefix):
    """Instrucción para copiar; reutiliza el botón genérico [data-copy] del aula."""
    target = f"{prefix}prompt-{item['id']}"
    return (f'<div class="detail-prompt-section"><div class="detail-prompt-head"><h4>Instrucción para copiar</h4>'
            f'<button class="button button-primary" type="button" data-copy="{target}" data-copy-message="Instrucción copiada. Pégala en el chat junto con la muestra o tus datos sin información personal.">Copiar instrucción</button></div>'
            f'<pre class="situation-prompt" id="{target}"><code>{escape(item["basePrompt"])}</code></pre></div>')


def detail_panel(item, prefix="", heading="h3", extra_class=""):
    """Ficha completa de una situación; la misma estructura sirve a la portada y al manual."""
    ident = escape(item["id"])
    title_id = f"{prefix}detail-title-{ident}"
    attributes = f' id="{prefix}situation-detail-{ident}" data-situation-detail="{ident}"' if not prefix else f' id="{prefix}{ident}"'
    return (f'<article class="situation-detail-panel{extra_class}"{attributes} aria-labelledby="{title_id}">'
            f'<header class="detail-panel-header"><span class="detail-category-badge">{escape(item["categoryLabel"])}</span>'
            f'<{heading} id="{title_id}" tabindex="-1">{escape(item["title"])}</{heading}>'
            f'<p class="detail-lead">{escape(item["problemDescription"])}</p>'
            f'<p class="detail-product"><strong>Producto:</strong> {escape(item["productFormat"])}</p></header>'
            f'<dl class="detail-facts"><div class="fact-tool"><dt>Herramienta sugerida</dt><dd>{escape(item["recommendedAiTool"])}</dd></div>'
            f'<div class="fact-care"><dt>Cuidado de datos</dt><dd>{escape(item["securityShield"])}</dd></div>'
            f'<div class="fact-accuracy"><dt>Exactitud</dt><dd>{escape(item["accuracyShield"])}</dd></div></dl>'
            f'<div class="detail-sample"><h4>Datos de práctica</h4><p>{escape(item["sampleData"])}</p></div>'
            f'{prompt_block(item, prefix)}{practice_link(item)}</article>')


def selector_html(office):
    """Filtros, lista compacta de fichas y paneles de detalle de las situaciones de oficina."""
    counts = {key: sum(1 for item in office if key in ("todas", item["category"])) for key, _ in FILTERS}
    filters = "".join(
        f'<button class="situation-filter-btn" type="button" data-situation-filter="{key}" aria-pressed="{str(key == "todas").lower()}">{label} <span class="filter-count">{counts[key]}</span></button>'
        for key, label in FILTERS)
    cards = "".join(
        f'<li data-situation-category="{escape(item["category"])}"><button class="situation-picker-card" type="button" data-situation-id="{escape(item["id"])}" '
        f'aria-pressed="{str(index == 0).lower()}" aria-controls="situation-detail-{escape(item["id"])}">'
        f'<span class="picker-card-icon">{icon(item["icon"])}</span><span class="picker-card-category">{escape(item["categoryLabel"])}</span>'
        f'<span class="picker-card-title">{escape(item["shortTitle"])}</span><span class="picker-card-action">{"Ficha abierta" if index == 0 else "Ver ficha"}</span></button></li>'
        for index, item in enumerate(office))
    details = "".join(detail_panel(item) for item in office)
    return (f'<div class="office-selector" data-office-selector>'
            f'<div class="situation-filters" role="group" aria-label="Filtrar situaciones por tipo">{filters}</div>'
            f'<div class="office-selector-layout"><ul class="situation-list" aria-label="Situaciones de oficina">{cards}</ul>'
            f'<div class="selector-detail-col">{details}</div></div>'
            f'<span class="visually-hidden" role="status" data-situation-announcer></span></div>')


def learning_html(learning):
    """Tarjetas de aprendizaje con un ejemplo de conversación y la instrucción para copiar."""
    cards = []
    for item in learning:
        example = item.get("learningExample")
        dialogue = ""
        if example:
            dialogue = (f'<details class="learning-ai-example"><summary>Ver un ejemplo de conversación</summary>'
                        f'<p><strong>Tu pedido:</strong> {escape(example["question"])}</p>'
                        f'<div class="learning-ai-answer"><strong>Respuesta de ejemplo</strong>{paragraphs(example["answer"])}</div>'
                        f'<p><strong>Para comprobar:</strong> {escape(example["reflection"])}</p></details>')
        cards.append(f'<article class="learning-ai-card" id="aprender-{escape(item["id"])}">'
                     f'<h3><span class="picker-card-icon">{icon(item["icon"])}</span>{escape(item["title"])}</h3>'
                     f'<p>{escape(item["problemDescription"])}</p>'
                     f'<p class="learning-ai-care"><strong>Cuidado:</strong> {escape(item["securityShield"])} {escape(item["accuracyShield"])}</p>'
                     f'{dialogue}{prompt_block(item, "aprender-")}{practice_link(item)}</article>')
    return '<div class="learning-ai-grid">' + "".join(cards) + "</div>"


def manual_html(office, learning, markdown):
    """Manual imprimible del portafolio con sus acciones de descarga e impresión."""
    groups = (("Situaciones de oficina", office), ("Aprender con IA", learning))
    html = [f'<div class="manual-toolbar-actions"><a class="button button-primary" href="data:text/markdown;charset=utf-8,{quote(markdown)}" download="manual-situaciones-oficina.md">Descargar en Markdown (.md)</a>'
            '<button class="button button-outline" type="button" id="btn-print-manual">Imprimir o guardar en PDF</button></div>']
    for title, items in groups:
        panels = "".join(detail_panel(item, prefix="manual-", heading="h4", extra_class=" manual-item-card") for item in items)
        html.append(f'<section class="manual-group"><h3>{title}</h3><div class="manual-items-grid">{panels}</div></section>')
    # El consolidado del portafolio (js/portafolio.js) anexa el contenido de este contenedor.
    return html[0] + '<div class="manual-items-container" id="manual-situaciones-content">' + "".join(html[1:]) + "</div>"


def manual_markdown(data):
    """Versión en Markdown del manual para guardar o compartir."""
    office, learning = split(data["situations"])
    lines = ["# Situaciones de oficina y aprendizaje con IA", "", data["description"], ""]
    for title, items in (("Situaciones de oficina", office), ("Aprender con IA", learning)):
        lines += [f"## {title}", ""]
        for item in items:
            lines += [f"### {item['title']}", "", item["problemDescription"], "",
                      f"- **Producto:** {item['productFormat']}",
                      f"- **Herramienta sugerida:** {item['recommendedAiTool']}",
                      f"- **Cuidado de datos:** {item['securityShield']}",
                      f"- **Exactitud:** {item['accuracyShield']}",
                      f"- **Datos de práctica:** {item['sampleData']}"]
            if item["practiceRelation"] != "ninguna":
                relation = "Se practica en" if item["practiceRelation"] == "practica" else "Técnica relacionada"
                lines.append(f"- **{relation}:** {item['challengeName']}")
            lines += ["", "Instrucción para copiar:", "", "```text", item["basePrompt"], "```", ""]
    return "\n".join(lines)


def replace_region(text, name, html):
    """Sustituye el contenido entre los marcadores de una región y falla si no existen."""
    pattern = re.compile(rf"(<!-- situaciones:{name} -->).*?(<!-- /situaciones:{name} -->)", re.DOTALL)
    assert pattern.search(text), f"Faltan los marcadores situaciones:{name}"
    return pattern.sub(lambda match: match.group(1) + html + match.group(2), text, count=1)


def render(home, portfolio, data):
    """Devuelve la portada y el portafolio con las tres regiones actualizadas."""
    office, learning = split(data["situations"])
    home = replace_region(home, "selector", selector_html(office))
    home = replace_region(home, "aprendizaje", learning_html(learning))
    portfolio = replace_region(portfolio, "manual", manual_html(office, learning, manual_markdown(data)))
    return home, portfolio


def write_preserving_newlines(path, text):
    """Escribe el archivo con el mismo final de línea que ya tenía."""
    path = Path(path)
    crlf = path.exists() and b"\r\n" in path.read_bytes()
    body = text.replace("\r\n", "\n")
    path.write_bytes((body.replace("\n", "\r\n") if crlf else body).encode("utf-8"))


def main():
    data = load()
    home_path, portfolio_path = CONTENT / "home.html", CONTENT / "portfolio.html"
    home, portfolio = render(home_path.read_text(encoding="utf-8"), portfolio_path.read_text(encoding="utf-8"), data)
    write_preserving_newlines(home_path, home)
    write_preserving_newlines(portfolio_path, portfolio)
    print("Situaciones sincronizadas en content/home.html y content/portfolio.html.")


if __name__ == "__main__":
    main()
