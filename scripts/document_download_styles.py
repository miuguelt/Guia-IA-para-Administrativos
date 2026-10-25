"""Estilo reproducible de Word y Excel con conservación verificable de contenido."""
from io import BytesIO
import math
from pathlib import Path
import re
from xml.etree import ElementTree
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


def workbook_signature(path):
    """Captura valores, fórmulas, tipos, formatos numéricos, validaciones y reglas."""
    from openpyxl import load_workbook
    workbook = load_workbook(path)
    signature = []
    for sheet in workbook:
        values = tuple((cell.coordinate, cell.value, cell.data_type, cell.number_format)
                       for row in sheet for cell in row if cell.value is not None)
        validations = ElementTree.tostring(sheet.data_validations.to_tree())
        rules = tuple((str(key.sqref), tuple(ElementTree.tostring(rule.to_tree()) for rule in value))
                      for key, value in sheet.conditional_formatting._cf_rules.items())
        body_merges = tuple(sorted(str(item) for item in sheet.merged_cells.ranges if item.min_row >= 4))
        signature.append((sheet.title, values, validations, body_merges, rules))
    workbook.close()
    return tuple(signature)


def stabilize_package(path):
    """Normaliza los metadatos de construcción de OOXML para repetir el resultado."""
    with ZipFile(path) as archive:
        entries = {name: archive.read(name) for name in archive.namelist()}
    if "docProps/core.xml" in entries:
        core = entries["docProps/core.xml"].decode("utf-8")
        core = re.sub(r"(<dcterms:modified[^>]*>)[^<]*(</dcterms:modified>)", r"\g<1>2026-10-19T00:00:00Z\2", core)
        entries["docProps/core.xml"] = core.encode("utf-8")
    payload = BytesIO()
    with ZipFile(payload, "w", compression=ZIP_DEFLATED) as archive:
        for name, data in sorted(entries.items()):
            info = ZipInfo(name, date_time=(2026, 10, 19, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    Path(path).write_bytes(payload.getvalue())


def style_workbook(path):
    """Mejora legibilidad y presentación de impresión, sin cambiar las celdas."""
    from openpyxl import load_workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.worksheet.table import TableStyleInfo
    from openpyxl.utils import get_column_letter

    before = workbook_signature(path)
    workbook = load_workbook(path)
    border = Side(style="thin", color="D9E3EA")
    for sheet in workbook:
        table = next(iter(sheet.tables.values()), None)
        header = int(re.search(r"\d+", table.ref.split(":")[0])[0]) if table else next(
            (row[0].row for row in sheet if sum(cell.value is not None for cell in row) > 1), 4)
        used_columns = max((cell.column for row in sheet for cell in row if cell.value is not None), default=1)
        sheet.sheet_view.showGridLines = False
        sheet.freeze_panes = f"A{header + 1}"
        sheet.sheet_properties.pageSetUpPr.fitToPage = True
        sheet.sheet_properties.outlinePr.summaryRight = False
        sheet.sheet_properties.tabColor = "257E77"
        sheet.page_setup.orientation = "landscape" if used_columns > 5 else "portrait"
        sheet.page_setup.paperSize = sheet.PAPERSIZE_A4
        sheet.page_setup.fitToWidth = 1
        sheet.page_setup.fitToHeight = 0
        sheet.print_title_rows = f"{header}:{header}"
        sheet.print_area = f"A1:{get_column_letter(used_columns)}{sheet.max_row}"
        sheet.print_options.horizontalCentered = True
        sheet.oddFooter.center.text = "Guía IA para administrativos | Página &P de &N"
        sheet.oddFooter.center.size = 8
        sheet.oddFooter.center.color = "64748B"
        sheet.page_margins.left = sheet.page_margins.right = 0.3
        sheet.page_margins.top = sheet.page_margins.bottom = 0.45
        for column in range(1, used_columns + 1):
            samples = [str(sheet.cell(row, column).value or "") for row in range(header, min(sheet.max_row, header + 60) + 1)]
            width = max(15, min(55, max(map(len, samples), default=15) * 0.72))
            sheet.column_dimensions[get_column_letter(column)].width = width
        for row_number in range(1, header):
            if sheet.cell(row_number, 1).value is not None and used_columns > 1 and all(
                    sheet.cell(row_number, column).value is None for column in range(2, used_columns + 1)):
                target = f"A{row_number}:{get_column_letter(used_columns)}{row_number}"
                if target not in {str(item) for item in sheet.merged_cells.ranges}:
                    sheet.merge_cells(target)
        for row in sheet:
            lines = 1
            for cell in row:
                if cell.value is None:
                    continue
                cell.font = Font(name="Aptos", size=10, color="182B3A")
                cell.alignment = Alignment(vertical="top", wrap_text=True)
                if cell.row < header:
                    cell.font = Font(name="Aptos", size=18 if cell.row == 1 else 10,
                                     bold=cell.row == 1, color="173B51" if cell.row == 1 else "475569")
                    continue
                cell.border = Border(left=border, right=border, top=border, bottom=border)
                cell.fill = PatternFill("solid", fgColor="F0F6F8" if cell.row % 2 else "FFFFFF")
                if cell.row == header:
                    cell.font = Font(name="Aptos", size=10, bold=True, color="FFFFFF")
                    cell.fill = PatternFill("solid", fgColor="1B4258")
                width = sheet.column_dimensions[cell.column_letter].width
                lines = max(lines, math.ceil(len(str(cell.value)) / max(10, width)))
            sheet.row_dimensions[row[0].row].height = min(180, max(28, lines * 14 + 10))
        sheet.row_dimensions[1].height = 35
        title_width = sum(sheet.column_dimensions[get_column_letter(column)].width for column in range(1, used_columns + 1))
        for row_number in range(2, header):
            if sheet.cell(row_number, 1).value is not None:
                sheet.row_dimensions[row_number].height = max(28, math.ceil(len(str(sheet.cell(row_number, 1).value)) / max(20, title_width * .85)) * 14 + 10)
        for existing_table in sheet.tables.values():
            existing_table.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True,
                                                           showFirstColumn=False, showLastColumn=False)
    workbook.save(path)
    workbook.close()
    stabilize_package(path)
    if before != workbook_signature(path):
        raise ValueError(f"El formato alteró datos o validaciones de {path}")


def docx_signature(path):
    """Conserva el texto y los hipervínculos del cuerpo, incluidos los de tablas."""
    with ZipFile(path) as archive:
        body = ElementTree.fromstring(archive.read("word/document.xml"))
        text = tuple(item.text for item in body.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"))
        relationships = archive.read("word/_rels/document.xml.rels")
    return text, tuple(sorted((item.attrib.get("Target"), item.attrib.get("TargetMode"))
                             for item in ElementTree.fromstring(relationships)
                             if item.attrib.get("TargetMode") == "External"))


def style_docx(path):
    """Aplica tipografía, bordes de tablas y jerarquía sin reescribir el contenido."""
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Cm, Pt, RGBColor

    before = docx_signature(path)
    doc = Document(path)
    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor.from_string("243746")
    normal.paragraph_format.space_after = Pt(7)
    normal.paragraph_format.line_spacing = 1.12
    for name, size, color in (("Title", 27, "111827"), ("Subtitle", 12, "526575"),
                              ("Heading 1", 17, "173B51"), ("Heading 2", 13, "1D635F"), ("Heading 3", 11, "173B51")):
        style = doc.styles[name]
        style.font.name = "Aptos"
        style.font.size = Pt(size)
        style.font.color.rgb = RGBColor.from_string(color)
        style.font.bold = name != "Subtitle"
        style.paragraph_format.space_before = Pt(15 if name.startswith("Heading") else 5)
        style.paragraph_format.space_after = Pt(7)
        style.paragraph_format.keep_with_next = True
        for decoration in list(style.element.iter(qn("w:pBdr"))):
            decoration.getparent().remove(decoration)
    for paragraph in doc.paragraphs:
        paragraph.paragraph_format.widow_control = True
        for decoration in list(paragraph._p.iter(qn("w:pBdr"))):
            decoration.getparent().remove(decoration)
        for run in paragraph.runs:
            run.font.name = "Aptos"
            if paragraph.style.name == "Title":
                run.font.color.rgb = RGBColor.from_string("111827")
                run.font.size = Pt(27)
    major_headings = [index for index, paragraph in enumerate(doc.paragraphs) if paragraph.style.name == "Heading 1"]
    if major_headings and len(doc.paragraphs) - major_headings[-1] <= 10 and major_headings[-1] > 0:
        previous = doc.paragraphs[major_headings[-1] - 1]
        if not previous.text.strip():
            for page_break in list(previous._p.iter(qn("w:br"))):
                if page_break.get(qn("w:type")) == "page":
                    page_break.getparent().remove(page_break)
            previous.paragraph_format.space_after = Pt(0)
            previous.paragraph_format.space_before = Pt(0)
    for section in doc.sections:
        section.top_margin = Cm(1.8)
        section.bottom_margin = Cm(1.8)
        section.left_margin = Cm(1.8)
        section.right_margin = Cm(1.8)
        section.header_distance = Cm(0.7)
        section.footer_distance = Cm(0.7)
        header = section.header.paragraphs[0]
        header.text = "Material de origen · SENA Bogotá · Guía IA para administrativos"
        header.runs[0].font.size = Pt(8)
        header.runs[0].font.color.rgb = RGBColor.from_string("526575")
        footer = section.footer.paragraphs[0]
        footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        footer.text = "Guía IA para administrativos · Página "
        field = OxmlElement("w:fldSimple")
        field.set(qn("w:instr"), "PAGE")
        footer._p.append(field)
        footer.runs[0].font.size = Pt(8)
        footer.runs[0].font.color.rgb = RGBColor.from_string("526575")
    for table in doc.tables:
        table.autofit = True
        properties = table._tbl.tblPr
        for old in list(properties.findall(qn("w:tblBorders"))):
            properties.remove(old)
        borders = OxmlElement("w:tblBorders")
        for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
            element = OxmlElement(f"w:{edge}")
            for key, value in (("val", "single"), ("sz", "5"), ("color", "D4E0E7")):
                element.set(qn(f"w:{key}"), value)
            borders.append(element)
        properties.append(borders)
        for index, row in enumerate(table.rows):
            if index == 0:
                row_properties = row._tr.get_or_add_trPr()
                if row_properties.find(qn("w:tblHeader")) is None:
                    row_properties.append(OxmlElement("w:tblHeader"))
            for cell in row.cells:
                tcpr = cell._tc.get_or_add_tcPr()
                for old in list(tcpr.findall(qn("w:shd"))):
                    tcpr.remove(old)
                fill = OxmlElement("w:shd")
                fill.set(qn("w:fill"), "1B4258" if index == 0 else ("F0F6F8" if index % 2 else "FFFFFF"))
                tcpr.append(fill)
                for old in list(tcpr.findall(qn("w:tcMar"))):
                    tcpr.remove(old)
                margins = OxmlElement("w:tcMar")
                tcpr.append(margins)
                for edge in ("top", "left", "bottom", "right"):
                    for old in list(margins.findall(qn(f"w:{edge}"))):
                        margins.remove(old)
                    side = OxmlElement(f"w:{edge}")
                    side.set(qn("w:w"), "100")
                    side.set(qn("w:type"), "dxa")
                    margins.append(side)
                for paragraph in cell.paragraphs:
                    paragraph.paragraph_format.space_after = Pt(4)
                    if index == 0:
                        paragraph.paragraph_format.keep_with_next = True
                    for run in paragraph.runs:
                        run.font.name = "Aptos"
                        run.font.size = Pt(9)
                        run.font.color.rgb = RGBColor.from_string("FFFFFF" if index == 0 else "243746")
                        if index == 0:
                            run.font.bold = True
    doc.save(path)
    stabilize_package(path)
    if before != docx_signature(path):
        raise ValueError(f"El formato alteró el texto o los enlaces de {path}")


