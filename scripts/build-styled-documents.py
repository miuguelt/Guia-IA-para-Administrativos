"""Publica versiones de lectura y aplica estilo a los documentos sin cambiar datos.

Uso habitual: python scripts/build-styled-documents.py
Después de validar la web: python scripts/build-styled-documents.py --format-downloads
Las fuentes Markdown y los PDF oficiales se conservan; las páginas permiten imprimir
o guardar una copia en PDF desde el navegador.
"""
import argparse
import csv
from html import escape
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit, urlunsplit


sys.path.insert(0, str(Path(__file__).resolve().parent))
import document_download_styles as DOWNLOAD_STYLES
from document_download_styles import docx_signature, stabilize_package, style_docx, style_workbook, workbook_signature


ROOT = Path(__file__).resolve().parents[1]
GROUPS = ("Guías para el aprendiz", "Prácticas y plantillas", "Laboratorio de datos y documentos",
          "Acompañamiento del instructor", "Revisión de la guía", "Antecedentes históricos")


def document_sources(root):
    """Inventaría fuentes legibles, sin publicar documentación de arquitectura."""
    root = Path(root)
    sources = [path for path in (root / "docs").rglob("*.md")
               if "lectura" not in path.relative_to(root / "docs").parts
               and "architecture" not in path.relative_to(root / "docs").parts]
    sources.extend((root / "materiales").rglob("*.md"))
    sources.extend((root / "materiales/retos").glob("*-ficha.csv"))
    if (root / "materiales/retos/registro-tiempos.csv").exists():
        sources.append(root / "materiales/retos/registro-tiempos.csv")
    return sorted(sources)


def document_group(source, text, root):
    """Distingue las instrucciones actuales de antecedentes y apoyos del instructor."""
    relative = source.relative_to(root).as_posix()
    if "ARCHIVO HISTÓRICO" in text[:800].upper():
        return "Antecedentes históricos"
    if "analisis-datos/" in relative:
        return "Laboratorio de datos y documentos"
    if "/ejercicios/" in relative or relative.startswith("materiales/") or source.stem == "evidencias-template":
        return "Prácticas y plantillas"
    if source.stem.startswith(("revision-", "validacion-", "plan-", "estilo-")):
        return "Revisión de la guía"
    if re.match(r"0[1-5]-", source.stem) or source.stem in ("instrumentos-evaluacion", "cronograma-detallado"):
        return "Acompañamiento del instructor"
    return "Guías para el aprendiz"


def render_reading_page(source, destination, root, mapping):
    """Convierte Markdown, conserva el contenido y reubica enlaces e imágenes."""
    import markdown
    from bs4 import BeautifulSoup

    text = source.read_text(encoding="utf-8-sig")
    engine = markdown.Markdown(extensions=["tables", "fenced_code", "sane_lists", "toc"],
                               extension_configs={"toc": {"toc_depth": "2-3"}})
    content = BeautifulSoup(engine.convert(text), "html.parser")
    title = content.find("h1")
    title = title.get_text(" ", strip=True) if title else source.stem.replace("-", " ").capitalize()
    for tag in content.find_all(["a", "img"]):
        attribute = "src" if tag.name == "img" else "href"
        parts = urlsplit(tag.get(attribute, ""))
        if parts.scheme or parts.netloc or not parts.path:
            continue
        target = (source.parent / unquote(parts.path)).resolve()
        target = mapping.get(target, target)
        relative = os.path.relpath(target, destination.parent).replace(os.sep, "/")
        tag[attribute] = urlunsplit(("", "", relative, parts.query, parts.fragment))
    for table in content.find_all("table"):
        wrapper = content.new_tag("div", attrs={"class": "table-wrap", "tabindex": "0", "role": "region", "aria-label": "Tabla de apoyo"})
        table.wrap(wrapper)
    css = os.path.relpath(root / "css/documents.css", destination.parent).replace(os.sep, "/")
    prose_css = os.path.relpath(root / "docs/lectura/devbrain-prose.css", destination.parent).replace(os.sep, "/")
    prose_js = os.path.relpath(root / "docs/lectura/devbrain-prose.js", destination.parent).replace(os.sep, "/")
    library = os.path.relpath(root / "docs/lectura/index.html", destination.parent).replace(os.sep, "/")
    web = os.path.relpath(root / "index.html", destination.parent).replace(os.sep, "/")
    original = os.path.relpath(source, destination.parent).replace(os.sep, "/")
    group = document_group(source, text, root)
    note = ("Este documento conserva su contexto de origen. Para realizar el curso, sigue la guía web vigente."
            if group == "Antecedentes históricos" else "Consulta el contenido por apartados y conserva el archivo fuente si necesitas editarlo.")
    return f'''<!doctype html>
<html lang="es-CO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>{escape(title)} · Biblioteca de la guía</title>
<link rel="stylesheet" href="{escape(css, quote=True)}"><link rel="stylesheet" href="{escape(prose_css, quote=True)}" data-devbrain-prose>
<script defer src="{escape(prose_js, quote=True)}" data-devbrain-prose-runtime></script></head><body>
<a class="skip-link" href="#documento">Ir al documento</a>
<nav class="reader-nav" aria-label="Acciones del documento"><a href="{escape(library, quote=True)}">← Biblioteca</a>
<a href="{escape(web, quote=True)}#preparacion">Abrir guía web</a><a href="{escape(original, quote=True)}" download>Descargar fuente Markdown</a>
<span>Imprime o guarda en PDF con Ctrl+P</span></nav>
<div class="reading-layout"><aside class="reading-sidebar"><p class="eyebrow">En este documento</p>
<details open><summary>Ver apartados</summary>{engine.toc}</details></aside>
<main id="documento" class="document-sheet"><header class="document-header"><p class="eyebrow">Guía IA para administrativos</p>
<span class="document-badge">{escape(group)}</span><p class="document-context">{note}</p></header>
<article class="document-content">{content}</article>
<footer class="document-footer">Guía IA para administrativos · Versión de lectura de <a href="{escape(original, quote=True)}">{escape(source.name)}</a>.
Las decisiones y los pendientes conservan el estado del archivo fuente.</footer></main></div></body></html>'''


def render_library(items, prose_css="devbrain-prose.css", prose_js="devbrain-prose.js"):
    """Organiza la biblioteca por propósito y deja visibles los formatos editables."""
    sections = []
    navigation = []
    for number, group in enumerate(GROUPS):
        selected = [item for item in items if item["group"] == group]
        if not selected:
            continue
        navigation.append(f'<a href="#grupo-{number}">{escape(group)}</a>')
        cards = []
        for item in selected:
            cards.append(f'''<article class="document-card"><p class="document-type">Documento de apoyo</p>
<h3><a class="reading-link" href="{escape(item['href'], quote=True)}">{escape(item['title'])}</a></h3>
<div class="card-actions"><a href="{escape(item['href'], quote=True)}">Leer e imprimir <span aria-hidden="true">→</span></a>
<a href="{escape(item['source'], quote=True)}" download>Fuente {escape(item.get('format', 'Markdown'))}</a></div></article>''')
        note = '<p>Conservan su contexto de origen y no son las instrucciones de esta cohorte.</p>' if group == "Antecedentes históricos" else ""
        sections.append(f'<section id="grupo-{number}" class="library-section"><h2>{group}</h2>{note}<div class="document-grid">{"".join(cards)}</div></section>')
    downloads = [
        ("Cartilla de aprendices", "../Documentos/Cartilla_aprendices_retos_IA_SENA_Bogota.docx", "Word · Material de origen de Bogotá"),
        ("Guía de facilitación", "../Documentos/Guia_facilitador_IA_SENA_Bogota.docx", "Word · Material de origen de Bogotá"),
        ("Libro de práctica", "../Documentos/Materiales_practica_IA_SENA_Bogota.xlsx", "Excel · Casos preparados para aprender"),
        ("Diccionario y datos del laboratorio", "../../materiales/analisis-datos/diccionario-y-datos.xlsx", "Excel · Datos públicos y sus fuentes"),
        ("Programa de formación", "../Documentos/Informe%20Programa%20de%20Formaci%C3%B3n%20Complementaria%20(1).pdf", "PDF · Fuente curricular oficial"),
    ]
    files = "".join(f'<a class="download-card" href="{href}" download><strong>{title}</strong><span>{description}</span></a>' for title, href, description in downloads)
    return f'''<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>Biblioteca de documentos · Guía IA para administrativos</title><link rel="stylesheet" href="../../css/documents.css"><link rel="stylesheet" href="{escape(prose_css, quote=True)}" data-devbrain-prose>
<script defer src="{escape(prose_js, quote=True)}" data-devbrain-prose-runtime></script></head><body>
<a class="skip-link" href="#biblioteca">Ir a los documentos</a><nav class="reader-nav" aria-label="Navegación"><a href="../../index.html#preparacion">← Volver a la guía web</a><span>Imprime o guarda cada documento en PDF con Ctrl+P</span></nav>
<main id="biblioteca" class="library-shell"><header class="library-hero"><p class="eyebrow">Recursos del curso</p><h1>Biblioteca de documentos</h1>
<p>Lee los apoyos con una presentación lista para imprimir. Cada documento incluye un índice y un enlace a su fuente editable.</p>
<p>Para realizar los retos en orden, empieza por la guía web. Los documentos amplían la explicación o permiten trabajar fuera de la página.</p></header>
<nav class="library-categories" aria-label="Grupos de documentos">{"".join(navigation)}</nav>
<section class="library-section"><h2>Archivos editables y fuente curricular</h2><p>La cartilla y la guía de facilitación conservan sus referencias de origen. La ruta web reúne los ajustes de la propuesta actual.</p><div class="download-grid">{files}</div></section>
{"".join(sections)}<footer class="document-footer">Guía IA para administrativos · Biblioteca de lectura y consulta.</footer></main></body></html>'''


def render_csv_sheet(source, destination, root):
    """Presenta los campos del CSV como referencia para el documento que genera la IA."""
    with source.open(encoding="utf-8-sig", newline="") as stream:
        rows = list(csv.reader(stream, delimiter=";"))
    fields = next((row for row in rows[2:] if len(row) > 1), None)
    if not fields:
        raise ValueError(f"La ficha no tiene campos: {source}")
    title = rows[0][0]
    note = rows[1][0] if len(rows) > 1 and rows[1] else ""
    css = os.path.relpath(root / "css/documents.css", destination.parent).replace(os.sep, "/")
    prose_css = os.path.relpath(root / "docs/lectura/devbrain-prose.css", destination.parent).replace(os.sep, "/")
    prose_js = os.path.relpath(root / "docs/lectura/devbrain-prose.js", destination.parent).replace(os.sep, "/")
    library = os.path.relpath(root / "docs/lectura/index.html", destination.parent).replace(os.sep, "/")
    original = os.path.relpath(source, destination.parent).replace(os.sep, "/")
    web = os.path.relpath(root / "index.html", destination.parent).replace(os.sep, "/")
    match = re.match(r'reto-(\d+)', source.stem)
    key = f'reto-{int(match.group(1))}' if match else 'MG-A01' if source.stem == 'diagnostico-tarea-ficha' else 'reto-integrador'
    kit = os.path.relpath(root / 'materiales/ia' / (key + '.zip'), destination.parent).replace(os.sep, '/')
    boxes = "".join(f'<section class="worksheet-field"><h2>{escape(field)}</h2></section>' for field in fields)
    return f'''<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<title>{escape(title)} · Ficha imprimible</title><link rel="stylesheet" href="{escape(css, quote=True)}"><link rel="stylesheet" href="{escape(prose_css, quote=True)}" data-devbrain-prose>
<script defer src="{escape(prose_js, quote=True)}" data-devbrain-prose-runtime></script></head><body>
<a class="skip-link" href="#documento">Ir a la ficha</a><nav class="reader-nav" aria-label="Acciones de la ficha"><a href="{escape(library, quote=True)}">← Biblioteca</a>
<a href="{escape(web, quote=True)}#preparacion">Abrir guía web</a><a href="{escape(original, quote=True)}" download>Fuente CSV editable</a><span>Imprime o guarda en PDF con Ctrl+P</span></nav>
<div class="worksheet-layout"><main id="documento" class="document-sheet"><header class="document-header"><p class="eyebrow">Guía IA para administrativos</p><span class="document-badge">Referencia de campos para la IA</span></header>
<article class="document-content"><h1>{escape(title)}</h1><p>{escape(note)}</p><p class="worksheet-guidance">La IA genera el documento con estos campos y completa una copia del CSV cuando se necesita. Usa el encargo del paquete; revisa el resultado y descarga los archivos. Las mediciones sin respaldo quedan pendientes.</p><p><a class="ai-kit-reference" href="{escape(kit, quote=True)}" download>Descargar el paquete y el encargo para IA</a></p>
<div class="worksheet-fields">{boxes}</div></article><footer class="document-footer">Guía IA para administrativos · Campos de <a href="{escape(original, quote=True)}">{escape(source.name)}</a>.</footer></main></div></body></html>'''


def main(root=ROOT, output=None, format_downloads=False):
    """Regenera las páginas; el formato binario requiere una opción explícita."""
    root = Path(root)
    output = Path(output) if output else root / "docs/lectura"
    output.mkdir(parents=True, exist_ok=True)
    sources = document_sources(root)
    mapping = {source.resolve(): output / ("--".join(source.relative_to(root).with_suffix("").parts) + ".html")
               for source in sources}
    items = []
    from bs4 import BeautifulSoup
    for source in sources:
        destination = mapping[source.resolve()]
        page = render_csv_sheet(source, destination, root) if source.suffix == ".csv" else render_reading_page(source, destination, root, mapping)
        destination.write_text(page, encoding="utf-8")
        soup = BeautifulSoup(page, "html.parser")
        items.append({"title": soup.select_one(".document-content h1").get_text(" ", strip=True)
                      if soup.select_one(".document-content h1") else source.stem,
                      "group": document_group(source, source.read_text(encoding="utf-8-sig"), root),
                      "href": destination.name,
                      "source": os.path.relpath(source, output).replace(os.sep, "/"),
                      "format": "CSV" if source.suffix == ".csv" else "Markdown"})
    prose_css = os.path.relpath(root / "docs/lectura/devbrain-prose.css", output).replace(os.sep, "/")
    prose_js = os.path.relpath(root / "docs/lectura/devbrain-prose.js", output).replace(os.sep, "/")
    (output / "index.html").write_text(render_library(items, prose_css, prose_js), encoding="utf-8")
    (output / "manifest.json").write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if format_downloads:
        for path in sorted((root / "docs/Documentos").glob("*.docx")):
            style_docx(path)
        for relative in ("docs/Documentos/Materiales_practica_IA_SENA_Bogota.xlsx", "materiales/analisis-datos/diccionario-y-datos.xlsx"):
            path = root / relative
            if path.exists():
                style_workbook(path)
        if (root / "content/analisis-datos/fundamentos.html").exists():
            import lab_document_pdfs
            lab_document_pdfs.main(root)
    return len(items)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--format-downloads", action="store_true", help="Aplica estilo a DOCX y XLSX tras validar la web.")
    options = parser.parse_args()
    print(f"Documentos de lectura generados: {main(format_downloads=options.format_downloads)}")
