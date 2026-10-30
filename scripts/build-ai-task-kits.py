"""Publica encargos listos para chats y agentes de IDE, sin conexión de red."""
import argparse
from html import escape
import json
from pathlib import Path
import re
import sys
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ai_prompts import COACH, PARTS, has_brief, visible_text, technical_block, copy_text, coach_text, template_text, repair_text, inline_sources_text, attach_note, practice_texts_markdown


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "content/ai-task-briefs.json"
SHARED_CATALOG = ROOT / "content/shared-challenge-materials.json"
OUTPUT = ROOT / "materiales/ia"
MEASUREMENT = (
    "Tarea;Estado;Preparación (min);Generación (min);Revisión (min);Corrección (min);"
    "Total asistido (min);Referencia manual equivalente;Ahorro;Fuente;Revisión humana\n"
    "Práctica del paquete;pendiente;pendiente;pendiente;pendiente;pendiente;pendiente;"
    "pendiente;pendiente;No hay mediciones observadas en este paquete;pendiente\n"
)


def load_catalog(path=None):
    """Verifica fuentes locales y el contrato de campos del portafolio."""
    catalog = json.loads(Path(path or CATALOG).read_text(encoding="utf-8"))
    registry = json.loads((ROOT / "deliverables.registry.json").read_text(encoding="utf-8"))
    shared = json.loads(SHARED_CATALOG.read_text(encoding="utf-8"))
    shared_paths = {item["href"] for item in shared}
    shared_by_path = {item["href"]: set(item["usedBy"]) for item in shared}
    known = {a["id"]: {f["key"] for f in a["fields"]} for a in registry["artifacts"]}
    for key, task in catalog.items():
        if not re.fullmatch(r"[A-Za-z0-9-]+", key):
            raise ValueError("El identificador del paquete no es válido: " + key)
        max_checks = 5 if key == "eco" else 3
        if not 1 <= len(task["checks"]) <= max_checks:
            raise ValueError("El paquete necesita entre una y cinco comprobaciones: " + key)
        artifact = task["artifactId"]
        fields = task["fieldKeys"]
        if not fields or len(fields) != len(set(fields)):
            raise ValueError("Los campos deben ser únicos y no estar vacíos: " + key)
        if artifact and (artifact not in known or not set(fields) <= known[artifact]):
            raise ValueError("El paquete contiene un campo desconocido: " + key)
        inline = task.get("inlineSources", [])
        if not task["sourceFiles"] and not inline:
            raise ValueError("El paquete necesita archivos o textos de práctica: " + key)
        inline_ids = [source.get("id", "") for source in inline]
        if len(inline_ids) != len(set(inline_ids)) or not all(
                re.fullmatch(r"[a-z0-9-]+", source.get("id", "")) and source.get("title", "").strip() and source.get("text", "").strip()
                for source in inline):
            raise ValueError("Cada texto de práctica necesita id único, título y texto: " + key)
        source_entries = set()
        for source in task["sourceFiles"]:
            candidate = (ROOT / source).resolve()
            if not candidate.is_relative_to(ROOT) or not candidate.is_file():
                raise ValueError("No se puede publicar la fuente: " + source)
            relative = package_source_path(source)
            if relative in source_entries:
                raise ValueError("El nombre de la fuente se repite: " + source)
            source_entries.add(relative)
            if source in shared_paths and key not in shared_by_path[source]:
                raise ValueError("El paquete declara un recurso común sin registrarlo como uso: " + key + " · " + source)
        if task.get("visualArtifact") and not task.get("visualDescription"):
            raise ValueError("El paquete visual necesita una descripción para el aprendiz: " + key)
    return catalog


def package_source_path(source):
    """Conserva las rutas que usan los metadatos del laboratorio."""
    path = Path(source)
    laboratory = Path("materiales/analisis-datos")
    relative = path.relative_to(laboratory) if path.is_relative_to(laboratory) else Path(path.name)
    return "fuentes/" + relative.as_posix()


def output_model(task):
    """El modelo deja los resultados vacíos para que la IA los genere."""
    return {"schemaVersion": 1, "artifactId": task["artifactId"],
            "fields": {key: "" for key in task["fieldKeys"]}, "tool": "no identificado"}


def output_schema(task):
    """Limita el archivo generado al sobre y a las claves canónicas."""
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "Resultado generado · " + task["title"],
        "type": "object", "additionalProperties": False,
        "required": ["schemaVersion", "artifactId", "fields", "tool"],
        "properties": {
            "schemaVersion": {"const": 1}, "artifactId": {"const": task["artifactId"]},
            "fields": {"type": "object", "additionalProperties": False,
                       "required": task["fieldKeys"],
                       "properties": {key: {"type": "string", "minLength": 1}
                                      for key in task["fieldKeys"]}},
            "tool": {"type": "string", "minLength": 1}
        }
    }


def coached_markdown(key, task, mode, sources):
    """Guía el intento propio en el chat y separa la referencia del formato para guardar."""
    brief = task["brief"]
    level = brief["apoyo"]
    start = ("Abre la carpeta extraída en Antigravity o Codex y escribe tu instrucción en su agente."
             if mode == "ide" else
             "Abre un chat autorizado y escribe ahí tu instrucción.")
    if level == "comentado":
        guide = "\n".join("- **" + label + ":** " + brief[part] + " _" + brief["notas"][part] + "_" for part, label in PARTS)
    elif level == "huecos":
        guide = "````text\n" + template_text(task) + "\n````"
    else:
        guide = "\n".join("- **" + part["label"] + ":** " + part["question"] for part in COACH["parts"])
    checks = "\n".join(str(i) + ". " + check for i, check in enumerate(task["checks"], 1))
    return (
        "# " + task["title"] + "\n\n"
        "Los casos y archivos se prepararon para aprender y no contienen registros reales.\n\n"
        "**Vas a obtener:** " + task["output"] + "\n\n"
        "**Técnica de este reto · " + brief["tecnica"]["nombre"] + ":** " + brief["tecnica"]["frase"] + "\n\n"
        "## Hazlo con IA\n\n"
        "1. Descarga el ZIP de este reto y extrae su carpeta.\n"
        "2. " + start + " Si quieres que la IA la revise antes de ejecutarla, envía primero el mensaje de «Revisión de tu instrucción».\n"
        "3. " + COACH["levels"][level]["step"] + attach_note(task) + "\n"
        "4. Copia en la misma conversación, en un solo mensaje, los bloques «1. Encargo de referencia» y «2. Formato para guardar». La IA compara tu intento con la referencia y prepara resultado-" + key + ".html.\n"
        "5. Revisa «Comprueba antes de conservar». Si un punto falla, usa el ajuste de abajo.\n"
        "6. Guarda la página en «Guarda tu evidencia». La revisión humana sigue pendiente hasta que la realices.\n\n"
        "## Archivos para adjuntar\n\n" + sources + "\n\n"
        + practice_texts_markdown(task) +
        "## Revisión de tu instrucción\n\n````text\n" + coach_text(task) + "\n````\n\n"
        "## Antes: escribe tu intento\n\n" + guide + "\n\n"
        "## 1. Encargo de referencia\n\n````text\n" + visible_text(task) + "\n````\n\n"
        "## 2. Formato para guardar (cópialo en el mismo mensaje)\n\n````text\n" + technical_block(task, mode) + "\n````\n\n"
        "## Comprueba antes de conservar\n\n" + checks + "\n\n"
        "## Si necesitas un ajuste\n\n"
        "Copia esta instrucción en la misma conversación:\n\n> " + repair_text(task) + "\n\n"
        "El producto elaborado incluye los datos y campos que recupera el Portafolio de Evidencias. Revisa y selecciona este mismo archivo; no prepares otra entrega.\n\n"
        "[Abrir guía de trabajo](LEEME.html)\n"
    )


def task_markdown(key, task, mode):
    """Entrega una instrucción completa que no pide personalización."""
    source_note = ("Los casos y archivos se prepararon para aprender y no contienen registros reales."
                   if task["sourceType"] == "practice" else
                   "El laboratorio incluye fuentes públicas oficiales con su procedencia y versión.")
    shared_paths = {item["href"] for item in json.loads(SHARED_CATALOG.read_text(encoding="utf-8"))}
    own_sources = [p for p in task["sourceFiles"] if p not in shared_paths]
    shared_sources = [p for p in task["sourceFiles"] if p in shared_paths]
    sources = "\n".join("- [" + Path(p).name + "](" + package_source_path(p) + ")"
                        for p in own_sources)
    if shared_sources:
        sources += ("\n" if sources else "") + "\n".join(
            "- [" + Path(p).name + "](" + package_source_path(p) + ") · recurso común; también está en «Recursos comunes»."
            for p in shared_sources)
    if not sources:
        sources = ("- No hay archivos que adjuntar: los textos de práctica van dentro del encargo."
                   if task.get("inlineSources") else
                   "- No hay archivos propios en este paquete. Adjunta el recurso común indicado arriba.")
    learner_files = "\n".join("- **" + name + "** · archivo estructurado descargado de la práctica; adjúntalo sin editar. No contiene texto libre ni datos personales."
                               for name in task.get("learnerFiles", []))
    guide_images = "\n\n".join("![" + image["alt"] + "](imagenes/" + image["name"] + ")\n\n" + image["caption"]
                               for image in task.get("guideImages", []) if not image.get("group"))
    residue_images = [image for image in task.get("guideImages", []) if image.get("group") == "residuos"]
    if residue_images:
        guide_images += ("\n\n" if guide_images else "") + "### Ilustraciones de los residuos del lote\n\n" + "\n\n".join(
            "![" + image["alt"] + "](imagenes/" + image["name"] + ")\n\n" + image["caption"]
            for image in residue_images)
    if has_brief(task):
        return coached_markdown(key, task, mode, sources)
    checks = "\n".join(str(i) + ". " + check for i, check in enumerate(task["checks"], 1))
    prompt = task["idePrompt" if mode == "ide" else "chatPrompt"]
    if task.get("inlineSources"):
        prompt += "\n\n" + inline_sources_text(task)
    start = ("Abre la carpeta extraída en Antigravity o Codex y pega el encargo en su agente."
             if mode == "ide" else
             "Abre un chat autorizado, adjunta las fuentes indicadas y copia el encargo completo.")
    if task.get("visualArtifact"):
        steps = (
            "1. Descarga el ZIP de este reto y extrae su carpeta.\n"
            "2. " + start + "\n"
            + ("3. Adjunta solo estos archivos: " + ", ".join(Path(p).name for p in task["sourceFiles"]) + ". Están en la carpeta fuentes/ de este paquete; en Antigravity o Codex ya quedan en su lugar. Conserva intactos los originales.\n"
               if task["sourceFiles"] else "3." + attach_note(task) + "\n")
            + "4. Abre ENCARGO-CHAT.md o ENCARGO-IDE.md, según la herramienta. Copia el texto completo y envíalo. El encargo pide este producto elaborado: " + task["output"] + " con este formato: " + task["visualDescription"] + " No necesitas llenar fichas ni preparar archivos adicionales.\n"
            "5. Revisa tu producto elaborado y verifica los puntos de «Comprueba antes de conservar». Si un punto falla, pide el ajuste indicado abajo y vuelve a revisar tu entrega.\n"
            "6. Guarda tu producto elaborado en «Guarda tu evidencia». La revisión humana sigue pendiente hasta que la realices.\n\n"
        )
        adjustment = "> Compara tu producto elaborado con las fuentes y cada punto de comprobación. Corrige solo lo que no coincida, conserva visibles cifras, citas y pendientes, y guarda de nuevo tu entrega sin inventar datos ni afirmar que una persona ya la revisó.\n\n"
        format_note = "El producto elaborado incluye los datos y campos que recupera el Portafolio de Evidencias. Revisa y selecciona este mismo archivo; no prepares otra entrega.\n\n"
        footer = "[Abrir guía de trabajo](LEEME.html)\n"
    else:
        steps = (
            "1. " + start + "\n"
            "2. Pide a la IA que genere los productos y sus archivos. No necesitas llenar fichas, redactar respuestas ni cambiar el encargo.\n"
            "3. Compara la salida con cada comprobación de abajo; si algo falla, pide una corrección.\n"
            "4. Descarga los productos. La revisión humana sigue pendiente.\n\n"
        )
        adjustment = "> Compara tu salida con las comprobaciones del encargo. Corrige cualquier diferencia contra las fuentes y vuelve a generar los archivos. Señala qué cambió y qué sigue pendiente, sin afirmar que yo ya hice la revisión.\n\n"
        format_note = "La IA puede organizar las mediciones disponibles en registro-medicion.csv; si no hay observaciones, conserva los tiempos y el ahorro como pendientes.\n\n"
        footer = "[Abrir guía imprimible](LEEME.html) · [Modelo de salida](modelo-salida.json) · [Esquema JSON](esquema-salida.json)\n"
    return (
        "# " + task["title"] + "\n\n" + source_note + "\n\n"
        "**Vas a obtener:** " + task["output"] + "\n\n"
        "## Hazlo con IA\n\n" + steps
        + "## Archivos para adjuntar\n\n" + sources
        + ("\n" + learner_files if learner_files else "") + "\n\n"
        + ("## Guía visual\n\n" + guide_images + "\n\n" if guide_images else "")
        + "## Encargo completo\n\n```text\n" + prompt + "\n```\n\n"
        "## Comprueba antes de conservar\n\n" + checks + "\n\n"
        "## Si necesitas un ajuste\n\n"
        "Copia esta instrucción en la misma conversación:\n\n"
        + adjustment + format_note + footer
    )


def task_html(key, task):
    """Ofrece una guía legible, imprimible y con documentos descargables."""
    title = escape(task["title"])
    shared_paths = {item["href"] for item in json.loads(SHARED_CATALOG.read_text(encoding="utf-8"))}
    own_sources = [p for p in task["sourceFiles"] if p not in shared_paths]
    shared_sources = [p for p in task["sourceFiles"] if p in shared_paths]
    sources = "".join('<li><a download href="' + escape(package_source_path(p), quote=True)
                      + '">' + escape(Path(p).name) + '</a></li>' for p in own_sources)
    sources += "".join('<li><a download href="' + escape(package_source_path(p), quote=True) + '">' + escape(Path(p).name)
                       + '</a> · recurso común; también está en «Recursos comunes».</li>' for p in shared_sources)
    if not sources:
        sources = ('<li>No hay archivos que adjuntar: los textos de práctica van dentro del encargo.</li>'
                   if task.get("inlineSources") else
                   '<li>Este paquete no incluye archivos propios. Adjunta el recurso común indicado en el encargo.</li>')
    learner_files = "".join('<li><strong>' + escape(name) + '</strong> · archivo estructurado descargado de la práctica; adjúntalo sin editar. No contiene texto libre ni datos personales.</li>'
                             for name in task.get("learnerFiles", []))
    guide_images = "".join('<figure><img alt="' + escape(image["alt"], quote=True)
                           + '" src="imagenes/' + escape(image["name"], quote=True) + '"><figcaption>'
                           + escape(image["caption"]) + '</figcaption></figure>'
                           for image in task.get("guideImages", []) if not image.get("group"))
    residue_images = [image for image in task.get("guideImages", []) if image.get("group") == "residuos"]
    if residue_images:
        guide_images += ('<section aria-labelledby="eco-residue-gallery-title" class="eco-residue-gallery">'
                         '<h3 id="eco-residue-gallery-title">Ilustraciones de los residuos del lote</h3>'
                         '<div class="eco-residue-grid">'
                         + ''.join('<figure class="eco-residue-card"><img alt="' + escape(image["alt"], quote=True)
                                   + '" decoding="async" src="imagenes/' + escape(image["name"], quote=True)
                                   + '"><figcaption>' + escape(image["caption"]) + '</figcaption></figure>'
                                   for image in residue_images)
                         + '</div></section>')
    checks = "".join("<li>" + escape(c) + "</li>" for c in task["checks"])
    notice = ("Materiales de práctica preparados para aprender, sin registros reales."
              if task["sourceType"] == "practice" else
              "Fuentes públicas oficiales: conserva la versión, procedencia, filtros y límites incluidos.")
    if task.get("visualArtifact"):
        file_names = ", ".join(escape(Path(path).name) for path in task["sourceFiles"]) or "ninguno; los textos de práctica van dentro del encargo"
        steps = ('<li>Descarga el ZIP de este reto y selecciona «Extraer todo» para abrir la carpeta.</li>'
                 '<li>Abre un chat autorizado o Antigravity/Codex. Adjunta solo estos archivos: <strong>' + file_names + '</strong>. Están en la carpeta fuentes/ de este paquete; en Antigravity o Codex ya quedan en su lugar.</li>'
                 '<li>Abre ENCARGO-CHAT.md para usar un chat o ENCARGO-IDE.md para usar Antigravity/Codex. Copia el encargo completo y envíalo; no necesitas escribir código ni llenar fichas.</li>'
                 '<li>Qué vas a crear: ' + escape(task["output"]) + ' con este formato: <strong>' + escape(task["visualDescription"]) + '</strong></li>'
                 '<li>Abre y revisa tu producto elaborado y verifica los puntos que aparecen en «Comprobaciones antes de conservar».</li>'
                 '<li>Si algo no coincide, pide este ajuste en la misma conversación: «Compara tu producto elaborado con las fuentes y los puntos de comprobación. Corrige solo lo que falla, conserva las cifras y los pendientes, y guarda de nuevo tu entrega. No inventes datos ni afirmes una revisión humana».</li>'
                 '<li>Guarda tu producto elaborado en «Guarda tu evidencia». La revisión humana sigue pendiente hasta que la realices.</li>')
        result_format = '<p class="notice">Revisa y selecciona este mismo producto en «Guarda tu evidencia». No prepares otra entrega.</p>'
        if has_brief(task):
            steps = ('<li>Descarga el ZIP de este reto y selecciona «Extraer todo» para abrir la carpeta.</li>'
                     '<li>Abre un chat autorizado. Si quieres que la IA revise tu instrucción antes de ejecutarla, envía primero el mensaje de «Revisión de tu instrucción» de ENCARGO-CHAT.md.</li>'
                     '<li>' + escape(COACH["levels"][task["brief"]["apoyo"]]["step"]) + ' Adjunta solo estos archivos: <strong>' + file_names + '</strong>. Están en la carpeta fuentes/ de este paquete.</li>'
                     '<li>Copia en la misma conversación el encargo completo de referencia. La IA compara tu intento con la referencia y prepara la página con este formato: <strong>' + escape(task["visualDescription"]) + '</strong></li>'
                     '<li>Revisa los puntos de «Comprobaciones antes de conservar». Si alguno falla, pide este ajuste: «' + escape(repair_text(task)) + '».</li>'
                     '<li>Guarda la página en «Guarda tu evidencia». La revisión humana sigue pendiente hasta que la realices.</li>')
    else:
        steps = '<li>Descarga el encargo para chat o IDE y los archivos fuente.</li><li>Adjunta las fuentes y, si la práctica genera un registro, inclúyelo sin editar. En Antigravity o Codex abre la carpeta y copia el encargo completo.</li><li>La IA genera el producto. Comprueba estos tres puntos y pide corrección si hace falta.</li><li>Descarga los productos. La revisión humana queda pendiente.</li>'
        result_format = '<nav class="links"><a download href="modelo-salida.json">Modelo JSON vacío</a><a download href="esquema-salida.json">Esquema del resultado</a><a download href="registro-medicion.csv">Registro con mediciones pendientes</a></nav>'
    return ('<!doctype html><html lang="es-CO"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>' + title + '</title><style>'
            '*{box-sizing:border-box}body{margin:0;background:#f1f5f3;color:#203c35;'
            'font:17px/1.6 Segoe UI,Arial,sans-serif}main{inline-size:100%;max-inline-size:100%;'
            'min-inline-size:0;box-sizing:border-box;margin:32px auto;'
            'padding:clamp(20px,5vw,52px);background:white;border:1px solid #cedbd3;'
            'border-radius:20px;box-shadow:0 8px 28px #163b2310}h1{font-size:clamp(28px,5vw,40px);'
            'line-height:1.2}h2{font-size:23px;margin-top:32px}a{color:#146044;'
            'overflow-wrap:break-word}a:focus-visible,summary:focus-visible{outline:3px solid #b87510;'
            'outline-offset:4px}li{margin:10px 0}.notice,.result{padding:18px;border-radius:12px;'
            'border:1px solid #c6dac9;background:#edf5ee}.kicker{font-size:13px;letter-spacing:.09em;'
            'text-transform:uppercase;font-weight:700}.links{display:flex;gap:12px;flex-wrap:wrap}'
            '.links a{border:1px solid #aac6b6;border-radius:9px;padding:10px 14px;min-height:44px;'
            'text-decoration:none}details{border:1px solid #cedbd3;border-radius:12px;padding:16px;'
            'margin:16px 0;min-width:0}summary{cursor:pointer;font-weight:600;min-height:44px}pre{white-space:pre;'
            'overflow-x:auto;max-width:100%;word-break:normal;overflow-wrap:normal;font:14px/1.6 Consolas,monospace}figure{margin:20px 0;padding:14px;'
            'border:1px solid #cedbd3;border-radius:14px}figure img{display:block;width:100%;max-width:720px;'
            'height:auto;margin:auto}figcaption{margin-top:9px;font-size:14px}.eco-residue-grid{display:grid;'
            'grid-template-columns:minmax(0,1fr);gap:12px}.eco-residue-card{min-width:0;margin:0;padding:12px;'
            'background:#f8faf8}.eco-residue-card img{max-width:180px;aspect-ratio:4/3;object-fit:contain;'
            'padding:4px;background:#f3f6f2;border-radius:10px}.eco-residue-card figcaption{max-width:100%;'
            'line-height:1.45}@media(min-width:640px){.eco-residue-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}'
            '@media(min-width:960px){.eco-residue-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}'
            'footer{margin-top:32px;font-size:14px}'
            '@media print{body{background:white}main{margin:0;border:0;box-shadow:none;padding:0}'
            'details:not([open]){display:none}.links{display:none}.eco-residue-grid{grid-template-columns:'
            'repeat(2,minmax(0,1fr))}.eco-residue-card{break-inside:avoid}a{color:inherit;text-decoration:none}}'
            ':where(p, dd, blockquote){--text-align-reading:start;box-sizing:border-box;inline-size:100%;'
            'max-inline-size:100%;min-inline-size:0;text-align:var(--text-align-reading);text-align-last:start;'
            'white-space:normal;word-break:normal;overflow-wrap:break-word;hyphens:none;-webkit-hyphens:none}'
            ':where(dd, blockquote){margin-inline:0}'
            '</style>'
            '<link rel="stylesheet" href="devbrain-prose.css" data-devbrain-prose>'
            '<script defer src="devbrain-prose.js" data-devbrain-prose-runtime></script></head>'
            '<body><main><p class="kicker">Guía de trabajo con IA · ' + escape(key) + '</p>'
            '<h1>' + title + '</h1><p class="notice">' + escape(notice) + '</p>'
            '<p class="result"><strong>Vas a obtener:</strong> ' + escape(task["output"]) + '</p>'
            '<h2>Cómo trabajar: paso a paso</h2><ol>' + steps + '</ol>'
            + ('<p class="notice">El producto elaborado es el entregable que necesitas para guardar esta evidencia.</p>' if task.get("visualArtifact") else '')
            + '<nav class="links" aria-label="Encargos descargables">'
            + '<a download href="ENCARGO-CHAT.md">Encargo para chat</a>'
            + '<a download href="ENCARGO-IDE.md">Encargo para Antigravity</a></nav>'
            + '<h2>Archivos incluidos y qué adjuntar</h2><ul>' + sources + learner_files + '</ul>'
            + ('<h2>Guía visual de la práctica</h2>' + guide_images if guide_images else '')
            + '<h2>Comprobaciones antes de conservar</h2><ol>' + checks + '</ol>'
            + ('<h2>Si necesitas corregir algo</h2><p>En la misma conversación, pide a la IA que compare tu producto elaborado con las fuentes y las comprobaciones. Debe corregir solo el punto que falla, conservar visibles las cifras, las citas y los pendientes, y guardar de nuevo tu entrega.</p>' if task.get("visualArtifact") else '')
            + '<details><summary>Consultar el encargo para chat</summary><pre>'
            + escape(copy_text(task) if has_brief(task) else task["chatPrompt"]) + '</pre></details>'
            + '<details><summary>Consultar el encargo para Antigravity</summary><pre>'
            + escape(copy_text(task, "ide") if has_brief(task) else task["idePrompt"]) + '</pre></details>'
            + '<h2>Formato del resultado</h2>' + result_format
            + '<footer>La revisión que hace la IA no sustituye tu revisión ni una aprobación institucional.</footer>'
            + '</main></body></html>\n')


def deterministic_zip(path, entries):
    """Orden y fecha fijos permiten verificar que un mismo paquete se repite."""
    with ZipFile(path, "w", compression=ZIP_DEFLATED) as archive:
        for relative, payload in sorted(entries.items()):
            info = ZipInfo(relative, date_time=(2026, 10, 19, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, payload)


def build(destination=None):
    """Genera documentos individuales y un ZIP autosuficiente por actividad."""
    destination = Path(destination or OUTPUT)
    destination.mkdir(parents=True, exist_ok=True)
    catalog = load_catalog()
    shared = json.loads(SHARED_CATALOG.read_text(encoding="utf-8"))
    for key, task in catalog.items():
        entries = {
            "ENCARGO-CHAT.md": task_markdown(key, task, "chat").encode("utf-8"),
            "ENCARGO-IDE.md": task_markdown(key, task, "ide").encode("utf-8"),
            "LEEME.html": task_html(key, task).encode("utf-8"),
            # Regla 7.4: cada guía descargada ajusta su prosa al ancho real de la región.
            "devbrain-prose.css": (ROOT / "tools/text-layout/templates/prose-layout.css").read_bytes(),
            "devbrain-prose.js": (ROOT / "tools/text-layout/templates/prose-layout.js").read_bytes()
        }
        if not task.get("visualArtifact"):
            entries.update({
                "modelo-salida.json": (json.dumps(output_model(task), ensure_ascii=False, indent=2) + "\n").encode("utf-8"),
                "esquema-salida.json": (json.dumps(output_schema(task), ensure_ascii=False, indent=2) + "\n").encode("utf-8"),
                "registro-medicion.csv": MEASUREMENT.encode("utf-8-sig")
            })
        for source in task["sourceFiles"]:
            relative = package_source_path(source)
            payload = (ROOT / source).read_bytes()
            entries[relative] = payload
            previous = destination / key / "fuentes" / Path(source).name
            if relative != "fuentes/" + Path(source).name and previous.is_file():
                if previous.resolve().is_relative_to(destination.resolve()) and previous.read_bytes() == payload:
                    previous.unlink()
        for image in task.get("guideImages", []):
            entries["imagenes/" + image["name"]] = (ROOT / image["path"]).read_bytes()
        for relative, payload in entries.items():
            path = destination / key / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)
        deterministic_zip(destination / (key + ".zip"), entries)
    shared_entries = {package_source_path(item["href"]): (ROOT / item["href"]).read_bytes() for item in shared}
    deterministic_zip(destination / "recursos-compartidos.zip", shared_entries)
    (destination / "catalogo.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return len(catalog)


def main(argv=None):
    """Permite regenerar paquetes desde la misma fuente que usa la web."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    options = parser.parse_args(argv)
    count = build(options.output)
    print("Paquetes listos para IA: " + str(count))
    return count


if __name__ == "__main__":
    main()
