"""Adapta los Word y las notas del libro de práctica al trabajo con encargos de IA.

Se ejecuta una vez al cambiar las instrucciones: python scripts/document_ai_instructions.py.
Conserva las fuentes anteriores sin sobrescribirlas. El formato posterior del build
no modifica el contenido ni requiere repetir esta migración.
"""
import json
from pathlib import Path
import re
import shutil
import sys

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE
from openpyxl import load_workbook

sys.path.insert(0, str(Path(__file__).resolve().parent))
from document_download_styles import stabilize_package, style_docx, style_workbook

ROOT = Path(__file__).resolve().parents[1]
FILES = ("Cartilla_aprendices_retos_IA_SENA_Bogota.docx",
         "Guia_facilitador_IA_SENA_Bogota.docx", "Materiales_practica_IA_SENA_Bogota.xlsx")
WORKBOOK_NOTES = {
    ("Leeme", "C15"): "Fichas de referencia: la IA completa una copia y genera los documentos; el aprendiz revisa las fuentes y descarga el resultado.",
    ("Leeme", "A17"): "Comparte solo las pestañas necesarias con una herramienta autorizada. Copia el encargo de materiales/ia, adjunta las fuentes o abre la carpeta en Antigravity o Codex. La IA genera y completa una copia; tú revisas y descargas. No agregues datos personales ni inventes mediciones. Si no hay acceso, observa una demostración y deja pendiente tu ejecución con IA.",
    ("Leeme", "A11"): "Reto 8",
    ("Leeme", "A12"): "Reto integrador",
    ("Fichas de reto", "A61"): "Reto 8 · Lectura de presupuesto",
    ("Fichas de reto", "A2"): "La IA completa estas fichas sobre una copia con los datos de práctica. Tú revisas las fuentes y descargas el resultado; no necesitas llenar filas. Usa el encargo de materiales/ia/reto-0.zip a reto-7.zip o reto-integrador.zip. Los datos ausentes y la revisión humana no realizada quedan pendientes. No agregues información personal ni decisiones institucionales reales."
}


ORIGIN_NUMBERING = (re.compile(r"\bReto 7\b"), "Reto 8")


def renumber_origin(paragraph):
    """El presupuesto era el Reto 7 de origen; la ruta vigente lo presenta como Reto 8."""
    pattern, replacement = ORIGIN_NUMBERING
    if not pattern.search(paragraph.text):
        return
    for run in paragraph.runs:
        run.text = pattern.sub(replacement, run.text)
    if pattern.search(paragraph.text):
        paragraph.text = pattern.sub(replacement, paragraph.text)


def paragraphs(document):
    """Recorre cada párrafo editable, incluidas las tablas, una sola vez."""
    yield from document.paragraphs
    seen = set()
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell._tc in seen:
                    continue
                seen.add(cell._tc)
                yield from cell.paragraphs


def schedule_signature(document):
    """Aísla horarios, minutos por paso y columnas de agenda de origen."""
    result = []
    for paragraph in document.paragraphs:
        text = paragraph.text
        if text.startswith(("Tiempo:", "Duración planificada:")):
            result.append(text)
        match = re.match(r"^\d+\. (\d+ min) · ", text)
        if match:
            result.append(match.group(1))
    for table in document.tables:
        heading = table.cell(0, 0).text
        if heading in ("Día", "Hora", "Min"):
            count = 3 if heading == "Día" else 1
            result.extend(tuple(cell.text for cell in row.cells[:count]) for row in table.rows[1:])
    return tuple(result)


def add_link(paragraph, label, target):
    """Crea un enlace relativo válido en Word y deja visible su ruta."""
    link = OxmlElement("w:hyperlink")
    link.set(qn("r:id"), paragraph.part.relate_to(target, RELATIONSHIP_TYPE.HYPERLINK, is_external=True))
    run = OxmlElement("w:r")
    text = OxmlElement("w:t")
    text.text = label
    run.append(text)
    link.append(run)
    paragraph._p.append(link)


def adapt_docx(source, destination, tasks, replacements):
    """Actualiza consignas y añade los once encargos sin reescribir la agenda."""
    document = Document(source)
    before = schedule_signature(document)
    instructor = "facilitador" in destination.name
    for paragraph in list(paragraphs(document)):
        text = paragraph.text
        revised = text.replace("propone un plan de análisis", "propón un plan de análisis").replace(
            "Luego propone borradores", "Luego propón borradores").replace(
            "Evaluación retroalimentación y premiación", "Evaluación, retroalimentación y premiación").replace(
            "Facilitador valida alcance y secuencia.", "El facilitador valida el alcance y la secuencia.")
        if revised != text:
            paragraph.text = revised
            text = revised
        match = re.match(r"^(\d+\. \d+ min · )(.*)$", text)
        prefix, action = (match.group(1), match.group(2)) if match else ("", text)
        if action in replacements:
            paragraph.text = prefix + replacements[action]
            continue
        renumber_origin(paragraph)
        text = paragraph.text
        if text.startswith("Si no hay acceso a IA:"):
            paragraph.text = "Si no hay acceso a IA: observa una demostración y revisa sus fuentes. Conserva como pendiente tu ejecución propia con IA; una observación no acredita haber generado el producto."
        elif text.startswith("Alternativa:"):
            paragraph.text = "Alternativa de acceso: presente una demostración con archivos preparados y conserve pendiente la ejecución propia del aprendiz con IA. La revisión y la evaluación humanas no se atribuyen a una herramienta."
        elif text.startswith("Herramientas y recursos:"):
            paragraph.text = "Herramientas y recursos: chat autorizado o carpeta en Antigravity o Codex; fuentes del paquete, encargo completo y criterios de revisión. La IA genera los documentos y el aprendiz los contrasta y descarga."
    anchor = next(paragraph._p for paragraph in document.paragraphs if paragraph.text in ("Antes de empezar", "Cómo usar este kit"))
    heading = document.add_paragraph("Recorrido vigente con documentos generados por IA", "Heading 1")
    anchor.addprevious(heading._p)
    context = document.add_paragraph("Esta versión adapta las instrucciones del material de origen de Bogotá. La ruta vigente incluye 10 retos breves, del 0 al 9, y un reto integrador. La propuesta tiene 40 horas: 36 horas directas y 4 autónomas. La oferta oficial consultada publica 48 horas; la adaptación requiere aprobación curricular y no constituye equivalencia. Las actividades de origen que aparecen después usan la numeración vigente de los retos; sus horarios se conservan como antecedentes, no como una agenda aprobada de la cohorte actual.")
    anchor.addprevious(context._p)
    steps = [
        "1. Copia el encargo completo y adjunta las fuentes del paquete al chat autorizado, o abre su carpeta en Antigravity o Codex. No necesitas redactar el prompt ni llenar fichas.",
        "2. La IA calcula, organiza los registros y genera el resultado indicado por el encargo y sus anexos. Revisa una cifra o afirmación con la fuente; pide los ajustes en la misma conversación.",
        "3. Descarga los archivos. En «Guarda tu evidencia», selecciona resultado.html o el archivo del formato indicado por el paquete, revisa la vista y guarda el borrador. Confirma tu revisión solo después de realizarla; la valoración corresponde al instructor."
    ]
    if instructor:
        steps = ["1. Entregue el paquete y muestre cómo copiar el encargo y adjuntar las fuentes o abrir la carpeta en Antigravity o Codex. No solicite transcribir prompts ni llenar fichas.",
                 "2. Pida a la IA el resultado indicado por el encargo y sus anexos. Acompañe la comprobación del aprendiz contra una cifra o afirmación de la fuente y la solicitud de ajustes.",
                 "3. Muestre la descarga y la recepción de resultado.html o del formato indicado por el paquete en «Guarda tu evidencia». El guardado deja un borrador y la confirmación registra la revisión del aprendiz; la valoración corresponde al instructor."]
    for text in steps + ["Los casos y archivos se prepararon para aprender y no contienen registros reales. No se requieren datos personales. Las mediciones y comprobaciones que no hayan ocurrido deben quedar pendientes."]:
        paragraph = document.add_paragraph(text)
        anchor.addprevious(paragraph._p)
    table = document.add_table(rows=1, cols=2)
    table.cell(0, 0).text = "Encargo vigente"
    table.cell(0, 1).text = "Paquete con fuentes e instrucciones"
    for ident in [f"reto-{number}" for number in range(10)] + ["reto-integrador"]:
        cells = table.add_row().cells
        cells[0].text = tasks[ident]["title"]
        add_link(cells[1].paragraphs[0], f"materiales/ia/{ident}.zip", f"../../materiales/ia/{ident}.zip")
    anchor.addprevious(table._tbl)
    note = document.add_paragraph("Los paquetes contienen ENCARGO-CHAT.md, ENCARGO-IDE.md, fuentes, modelo-salida.json y esquema-salida.json. El encargo se copia sin editarlo. El texto entre corchetes de un modelo señala un dato pendiente y no se presenta como un resultado. La conversación se conserva junto con los archivos; importar o descargar no demuestra una revisión humana ni una aprobación institucional.")
    anchor.addprevious(note._p)
    section = document.add_paragraph("Actividades del material de origen adaptadas para IA", "Heading 1")
    anchor.addprevious(section._p)
    if schedule_signature(document) != before:
        raise ValueError("La adaptación no puede cambiar los horarios ni minutos de la agenda de origen.")
    for table in document.tables:
        if table.cell(0, 0).text in ("Regla", "Actividad"):
            for row in table.rows[:-1]:
                for cell in row.cells:
                    for paragraph in cell.paragraphs:
                        paragraph.paragraph_format.keep_with_next = True
    document.save(destination)
    style_docx(destination)


def adapt_workbook(source, destination):
    """Modifica únicamente tres notas; no cambia datos, fórmulas ni validaciones."""
    workbook = load_workbook(source)
    for (sheet, cell), text in WORKBOOK_NOTES.items():
        workbook[sheet][cell] = text
    workbook.save(destination)
    workbook.close()
    style_workbook(destination)
    stabilize_package(destination)


def main(root=ROOT):
    """Conserva originales una vez y genera siempre desde esas mismas fuentes."""
    root = Path(root)
    folder = root / "docs/Documentos"
    backup = folder / "fuentes_originales"
    backup.mkdir(exist_ok=True)
    replacements = json.loads((ROOT / "content/document-ai-instructions.json").read_text(encoding="utf-8"))
    tasks = json.loads((root / "content/ai-task-briefs.json").read_text(encoding="utf-8"))
    for name in FILES:
        source, destination = backup / name, folder / name
        if not source.exists():
            shutil.copy2(destination, source)
        if destination.suffix == ".docx":
            adapt_docx(source, destination, tasks, replacements)
        else:
            adapt_workbook(source, destination)
    for name, text_name in zip(FILES[:2], ("cartilla.txt", "guia_facilitador.txt")):
        document = Document(folder / name)
        (root / text_name).write_text("\n".join(paragraph.text for paragraph in paragraphs(document)) + "\n", encoding="utf-8")
    workbook = load_workbook(folder / FILES[2], data_only=False)
    lines = ["Extracción del libro de práctica vigente. Los datos fuente se conservan sin cambios."]
    for sheet in workbook:
        lines.append(f"\n--- {sheet.title} ---")
        lines.extend("\t".join("" if cell.value is None else str(cell.value) for cell in row) for row in sheet)
    workbook.close()
    (root / "materiales.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return len(FILES)


if __name__ == "__main__":
    print(f"Documentos adaptados: {main()}")
