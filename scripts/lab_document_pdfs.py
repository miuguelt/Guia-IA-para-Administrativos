"""Regenera las dos guías PDF locales del laboratorio desde sus fuentes editables."""
from functools import partial
from html import escape
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]


def inline(node):
    """Conserva énfasis y separa los bloques internos de cada paso."""
    if isinstance(node, str):
        return escape(node).replace("\n", " ")
    text = "".join(inline(child) for child in node.children)
    if node.name in ("b", "strong"):
        return "<b>" + text + "</b>"
    if node.name in ("i", "em"):
        return "<i>" + text + "</i>"
    if node.name == "a" and node.get("href", "").startswith("https://"):
        return '<link href="' + escape(node["href"], quote=True) + '" color="#126780">' + text + "</link>"
    if node.name == "br":
        return "<br/>"
    if node.name in ("h3", "h4"):
        return "<b>" + text + "</b><br/>"
    if node.name in ("p", "blockquote"):
        return text + "<br/>"
    return text


def html_blocks(html):
    """Extrae una sola vez cada párrafo, tabla, instrucción y paso."""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")
    for controls in soup.select(".lab-actions"):
        controls.decompose()
    blocks = []
    for node in soup.select("h1,h2,h3,h4,p,pre,li,table,blockquote,div.lab-callout"):
        if any(parent.name in ("pre", "li", "table", "blockquote") or "lab-callout" in parent.get("class", [])
               for parent in node.parents):
            continue
        if node.name == "table":
            blocks.append({"kind": "table", "rows": [[inline(cell) for cell in row.select("th,td")] for row in node.select("tr")]})
        elif node.name in ("pre", "blockquote") or "lab-callout" in node.get("class", []):
            blocks.append({"kind": "prompt", "text": node.get_text(" ", strip=True)})
        else:
            text = inline(node)
            if node.name == "li" and node.parent.name == "ol" and not re.match(r"^(?:<b>)?\d+\.", text):
                position = list(node.parent.find_all("li", recursive=False)).index(node) + 1
                text = f"{position}. " + text
            blocks.append({"kind": node.name, "text": text})
    return blocks


def md_blocks(path):
    """Usa el mismo Markdown de la biblioteca para tablas y texto de las guías."""
    import markdown
    return html_blocks(markdown.markdown(Path(path).read_text(encoding="utf-8-sig"), extensions=["tables", "fenced_code", "sane_lists"]))


def document_blocks(root):
    """Reúne web, fichas y figuras locales sin consultar ni modificar fuentes oficiales."""
    root = Path(root)
    base = root / "materiales/analisis-datos"
    learner = [
        {"kind": "h1", "text": "Explora datos y documentos con IA"},
        {"kind": "p", "text": "Laboratorio independiente. Ruta inicial sin programación: 12 horas sugeridas. Ruta avanzada opcional: entre 12 y 16 horas adicionales."},
        {"kind": "p", "text": "Datos públicos reales de fuentes oficiales, descargados el 18 de octubre de 2026, hora de Colombia. Consulta filtros, transformaciones, unidades y límites en fuentes.json y diccionario.csv. Este módulo no cambia las horas ni las cinco evidencias curriculares del curso."},
        {"kind": "p", "text": "Recorre las secciones en orden: método, herramientas, cinco laboratorios y ampliación. Los enlaces azules abren las fuentes oficiales. En el paquete, empieza por LEEME.md; descomprime todos sus archivos. Los CSV usan UTF-8, coma como separador y punto decimal. El explorador interactivo está en la versión web del módulo."},
        {"kind": "p", "text": "Los archivos entregados permiten trabajar sin volver a descargar. Para usar un chat web, carga el CSV indicado en cada ficha. Con Codex o Antigravity, abre la carpeta completa y pide ejecutar el procedimiento. Conserva los originales y comprueba resultados antes de sacar conclusiones."},
    ]
    for name in ("fundamentos", "herramientas", "laboratorios", "avanzado"):
        learner += [{"kind": "section"}] + html_blocks((root / f"content/analisis-datos/{name}.html").read_text(encoding="utf-8"))
    learner += [{"kind": "section"}, {"kind": "h1", "text": "Figuras de referencia"}]
    captions = {
        "exoplanetas": "Planetas seleccionados de NASA Exoplanet Archive. El radio se expresa en radios terrestres y el periodo, en días. Selección por tránsito y descubrimiento hasta 2024; revisa el sesgo de detección.",
        "poblacion": "Población de Colombia, Perú y Ecuador, 2000-2024. Banco Mundial, indicador SP.POP.TOTL. Son personas, no tasas; compara también crecimiento relativo.",
        "clima": "Temperatura y precipitación de la celda NASA POWER correspondiente a Bogotá en 2024. Son datos diarios de rejilla en tiempo solar local, no una estación urbana.",
        "sismos": "Eventos USGS de enero de 2024 con magnitud igual o mayor que 5. La cuadrícula de coordenadas ubica eventos; no representa riesgo ni predice sismos.",
        "piramide-santander-2024": "Proyección DANE para Santander, 2024, actualización de 2025. Total: 2.380.650 personas. Hombres: 1.168.768. Mujeres: 1.211.882. Edades simples; el último grupo es abierto.",
    }
    for name, caption in captions.items():
        learner += [{"kind": "image", "path": str(base / "codigo/resultados" / f"{name}.png")}, {"kind": "p", "text": caption}]
    learner += [{"kind": "page"}, {"kind": "h1", "text": "Fichas para registrar tu análisis"}]
    for name in ("ficha-analisis", "ficha-nasa", "ficha-poblacion", "ficha-clima", "ficha-sismos", "ficha-documentos"):
        learner += [{"kind": "section"}] + md_blocks(base / "fichas" / f"{name}.md")
    instructor = md_blocks(root / "docs/analisis-datos/guia-instructor.md")
    for name in ("rubrica-instructor", "clave-revision"):
        instructor += [{"kind": "page"}] + md_blocks(base / "fichas" / f"{name}.md")
    return {"guia-laboratorio": learner, "guia-instructor": instructor}


def pdf_styles():
    """Define una jerarquía legible con fuentes portables y bordes discretos."""
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib import colors
    fonts = Path("C:/Windows/Fonts")
    family = "Arial" if (fonts / "arial.ttf").exists() else "Helvetica"
    if family == "Arial":
        for name, file in (("Arial", "arial.ttf"), ("Arial-Bold", "arialbd.ttf"), ("Arial-Italic", "ariali.ttf"), ("Arial-BoldItalic", "arialbi.ttf")):
            pdfmetrics.registerFont(TTFont(name, str(fonts / file)))
        pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="Arial-Bold", italic="Arial-Italic", boldItalic="Arial-BoldItalic")
    return {
        "p": ParagraphStyle("body", fontName=family, fontSize=10, leading=14, spaceAfter=7, textColor=colors.HexColor("#21343C")),
        "h1": ParagraphStyle("title", fontName=family + "-Bold", fontSize=24, leading=29, spaceAfter=18, spaceBefore=12, textColor=colors.HexColor("#123E4B"), keepWithNext=True),
        "h2": ParagraphStyle("section", fontName=family + "-Bold", fontSize=17, leading=21, spaceAfter=10, spaceBefore=18, textColor=colors.HexColor("#123E4B"), keepWithNext=True),
        "h3": ParagraphStyle("subsection", fontName=family + "-Bold", fontSize=12, leading=16, spaceAfter=7, spaceBefore=12, keepWithNext=True),
        "h4": ParagraphStyle("detail", fontName=family + "-Bold", fontSize=10, leading=14, spaceAfter=6, spaceBefore=9, keepWithNext=True),
        "li": ParagraphStyle("list", fontName=family, fontSize=10, leading=14, spaceAfter=8, leftIndent=12, bulletIndent=0),
        "prompt": ParagraphStyle("prompt", fontName=family, fontSize=9, leading=13, spaceAfter=12, spaceBefore=5, backColor=colors.HexColor("#EEF4F5"), borderColor=colors.HexColor("#CADCE0"), borderWidth=.6, borderPadding=9),
        "cell": ParagraphStyle("cell", fontName=family, fontSize=8.5, leading=11.5),
        "head": ParagraphStyle("head", fontName=family + "-Bold", fontSize=8.5, leading=11.5, textColor=colors.white),
    }


def page_footer(canvas, doc):
    """Dibuja folio y procedencia sin interferir con el área de contenido."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#CFDEE2"))
    canvas.line(46, 42, A4[0] - 46, 42)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#526570"))
    canvas.drawString(46, 28, "Datos y documentos con IA | Laboratorio independiente")
    canvas.drawRightString(A4[0] - 46, 28, str(doc.page))
    canvas.restoreState()


def main(root=ROOT, output=None):
    """Publica ambas guías PDF locales con metadatos y paginación reproducibles."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen.canvas import Canvas
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, CondPageBreak
    root = Path(root)
    output = Path(output) if output else root / "docs/analisis-datos"
    output.mkdir(parents=True, exist_ok=True)
    styles = pdf_styles()
    pages = {}
    for name, blocks in document_blocks(root).items():
        story = []
        for block in blocks:
            kind = block["kind"]
            if kind == "section":
                story.append(CondPageBreak(200))
            elif kind == "page":
                if story and not isinstance(story[-1], PageBreak):
                    story.append(PageBreak())
            elif kind == "image":
                image = Image(block["path"])
                ratio = min(500 / image.imageWidth, 520 / image.imageHeight)
                image.drawWidth = image.imageWidth * ratio
                image.drawHeight = image.imageHeight * ratio
                story.extend([CondPageBreak(image.drawHeight + 75), image, Spacer(1, 12)])
            elif kind == "table":
                rows = block["rows"]
                if not rows:
                    continue
                columns = max(map(len, rows))
                matrix = [[Paragraph(cell, styles["head" if number == 0 else "cell"]) for cell in row] + [""] * (columns - len(row)) for number, row in enumerate(rows)]
                table = Table(matrix, colWidths=[(A4[0] - 92) / columns] * columns, repeatRows=1, hAlign="LEFT")
                table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1B4258")), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F0F5F6")]),
                    ("GRID", (0, 0), (-1, -1), .4, colors.HexColor("#CFDEE2")),
                ]))
                story.extend([table, Spacer(1, 12)])
            else:
                text = block["text"].replace("\u2011", "-").replace("\u2013", "-").replace("\u2014", "-")
                if kind == "h2" and "Documenta" in text:
                    story.append(CondPageBreak(260))
                elif kind == "h2" and "Cómo aplicar la rúbrica" in text:
                    story.append(CondPageBreak(320))
                if kind == "prompt":
                    text = escape(text).replace("\n", "<br/>")
                numbered = re.match(r"^(?:<b>)?\d+\.", text)
                story.append(Paragraph(text, styles.get(kind, styles["p"]), bulletText="•" if kind == "li" and not numbered else None))
        while story and isinstance(story[-1], PageBreak):
            story.pop()
        target = output / f"{name}.pdf"
        doc = SimpleDocTemplate(str(target), pagesize=A4, rightMargin=46, leftMargin=46, topMargin=40, bottomMargin=58,
                                title="Explora datos y documentos con IA" if name == "guia-laboratorio" else "Orientaciones para el instructor",
                                author="Guía IA para Administrativos", pageCompression=1, invariant=1)
        doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer, canvasmaker=partial(Canvas, invariant=1))
        pages[name] = doc.page
    return pages


if __name__ == "__main__":
    print(main())
