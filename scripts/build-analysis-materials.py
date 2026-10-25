"""Empaqueta fuentes y guías del laboratorio sin conexiones de red."""
from pathlib import Path
from html import unescape
import posixpath
import re
from urllib.parse import unquote, urlsplit, urlunsplit
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "materiales/analisis-datos"
LABS = {"nasa": "01-exoplanetas", "poblacion": "02-poblacion", "clima": "03-clima", "sismos": "04-sismos", "documentos": None}
AI_LABS = ("lab-nasa", "lab-poblacion", "lab-clima", "lab-sismos", "lab-documentos")


def package_path(source):
    """Asigna una ruta segura y estable a cada recurso local."""
    source = Path(source).resolve()
    try:
        relative = source.relative_to(ROOT.resolve())
    except ValueError as error:
        raise ValueError("El recurso está fuera de la carpeta de la guía.") from error
    if source.is_relative_to(BASE.resolve()):
        return source.relative_to(BASE.resolve()).as_posix()
    if source.is_relative_to((ROOT / "materiales/ia").resolve()):
        return "ia/" + source.relative_to((ROOT / "materiales/ia").resolve()).as_posix()
    if source.parent == (ROOT / "docs/analisis-datos").resolve():
        return source.name
    return "recursos/" + relative.as_posix()


def rewrite_reference(href, source, relative, entries, origins):
    """Incluye el destino de un enlace y devuelve su ubicación dentro del ZIP."""
    parts = urlsplit(unescape(href))
    if parts.scheme or parts.netloc or not parts.path:
        return href
    target = (Path(source).parent / unquote(parts.path)).resolve()
    if target == (ROOT / "index.html").resolve():
        return posixpath.relpath("LEEME.html", posixpath.dirname(relative) or ".")
    destination = package_path(target)
    if not target.is_file():
        raise FileNotFoundError(f"Falta un recurso enlazado: {target.relative_to(ROOT)}")
    if destination not in entries:
        entries[destination] = target.read_bytes()
        origins[destination] = target
    local = posixpath.relpath(destination, posixpath.dirname(relative) or ".")
    return urlunsplit(("", "", local, parts.query, parts.fragment))


def include_linked_resources(entries, origins):
    """Resuelve también los enlaces de instrucciones y páginas recién incluidas."""
    pending = sorted(origins)
    processed = set()
    patterns = (re.compile(r'(\[[^\]]+\]\()([^\n)]+)(\))'), re.compile(r'((?:href|src)=["\'])([^"\']+)(["\'])'))
    while pending:
        relative = pending.pop(0)
        processed.add(relative)
        if Path(relative).suffix.lower() not in (".md", ".html"):
            continue
        source = origins[relative]
        text = entries[relative].decode("utf-8-sig")
        selected = patterns if relative.endswith(".md") else patterns[1:]
        for pattern in selected:
            for match in reversed(list(pattern.finditer(text))):
                local = rewrite_reference(match.group(2), source, relative, entries, origins)
                text = text[:match.start(2)] + local + text[match.end(2):]
        entries[relative] = text.encode("utf-8")
        pending.extend(sorted(set(origins) - processed - set(pending)))


def main(destination=None):
    destination = Path(destination) if destination is not None else BASE / "paquetes"
    destination.mkdir(parents=True, exist_ok=True)
    for name, notebook in LABS.items():
        files = [BASE / "instrucciones-herramientas.md", BASE / "fuentes.json", BASE / "diccionario.csv",
                 *sorted((BASE / "fichas").glob("ficha-*.md")), *sorted((BASE / "fichas").glob("registro-*.csv"))]
        if notebook:
            files += [BASE / "codigo/analysis_data.py",
                      BASE / "cuadernos" / (notebook + ".ipynb"), *sorted((BASE / "datos").glob("*.csv")),
                      *sorted((BASE / "originales").glob("*.json")), *sorted((BASE / "codigo/resultados").glob("*.*"))]
        else:
            files += [p for p in sorted((BASE / "documentos").rglob("*")) if p.is_file()]
        entries = {p.relative_to(BASE).as_posix(): p.read_bytes() for p in files}
        origins = {p.relative_to(BASE).as_posix(): p for p in files}
        for extension in ("md", "pdf"):
            source = ROOT / "docs/analisis-datos" / ("guia-laboratorio." + extension)
            entries[source.name] = source.read_bytes()
            origins[source.name] = source
        for task in AI_LABS:
            resources = [ROOT / "materiales/ia" / (task + ".zip")]
            resources += [ROOT / "materiales/ia" / task / filename for filename in
                          ("ENCARGO-CHAT.md", "ENCARGO-IDE.md", "LEEME.html", "modelo-salida.json", "esquema-salida.json")]
            for source in resources:
                relative = package_path(source)
                entries[relative] = source.read_bytes()
                origins[relative] = source
        choices = "".join(f'<li><a href="ia/{task}/LEEME.html">{task}</a> · <a href="ia/{task}.zip">Paquete completo</a></li>' for task in AI_LABS)
        entries["LEEME.html"] = (
            '<!doctype html><html lang="es-CO"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>Laboratorio con IA sin conexión</title><style>body{font:17px/1.6 Segoe UI,Arial,sans-serif;color:#203c35;background:#f1f5f3;margin:0;padding:20px}main{max-width:860px;margin:auto;background:white;border:1px solid #cadbd5;border-radius:16px;padding:32px}a{color:#17604d}li{margin:14px 0}</style>'
            '<main><h1>Recursos del laboratorio con IA</h1><p>Este índice funciona sin conexión. Los encargos, las fuentes incluidas y los modelos de salida están dentro del paquete. La ejecución con un servicio de IA puede necesitar acceso a Internet y una cuenta autorizada.</p>'
            '<p><a href="guia-laboratorio.pdf">Abrir la guía PDF</a> · <a href="guia-laboratorio.md">Abrir la guía Markdown</a></p>'
            '<h2>Elige el encargo preparado</h2><ul>' + choices + '</ul><p>Entrega la carpeta al agente o adjunta al chat las fuentes indicadas. Revisa el resultado y conserva los archivos generados. Las revisiones humanas no realizadas siguen pendientes.</p>'
            '<p>Los enlaces a entidades oficiales conservan su dirección original y requieren conexión; los documentos con restricciones no se redistribuyen.</p></main></html>'
        ).encode("utf-8")
        include_linked_resources(entries, origins)
        entries["LEEME.md"] = (
            "# Laboratorio: " + name + "\n\n"
            "Descomprime el paquete completo y abre [LEEME.html](LEEME.html). Allí están los encargos para chat e IDE, las fuentes y los modelos de salida.\n\n"
            "Estos son datos públicos reales de fuentes oficiales. Las fuentes, los filtros y las condiciones de uso acompañan los archivos.\n\n"
            "La guía describe cinco casos. Sus cinco paquetes de IA, encargos, esquemas y fuentes enlazadas se incluyen en ia/; no necesitas la guía web para abrirlos.\n\n"
            + ("Los cuatro conjuntos básicos se incluyen juntos para que la validación del cuaderno funcione sin red. Los originales se conservan separados. "
               "Para empezar, entrega el encargo y las fuentes a la IA. El agente puede repetir el análisis con Python 3.11 o superior mediante "
               "`python codigo/analysis_data.py validar` y `python codigo/analysis_data.py analizar`. Las figuras requieren Matplotlib; "
               "la ampliación DANE usa openpyxl. Puedes instalar ambos con `python -m pip install matplotlib==3.11.0 openpyxl==3.1.5`. "
               "Los cuadernos/ permiten que el agente conserve la ejecución por etapas. Las acciones refrescar y refrescar-dane descargan una nueva versión; no las necesitas para esta práctica.\n"
               if notebook else "El inventario tiene diez referencias. Se incluyen tres PDF de NASA; los demás se consultan desde los enlaces oficiales. "
               "La IA genera la matriz de evidencia. No interpretes un documento registrado como documento leído; comprueba las páginas de las citas que vas a comunicar.\n")
        ).encode("utf-8")
        with ZipFile(destination / (name + ".zip"), "w", compression=ZIP_DEFLATED) as archive:
            for relative, payload in sorted(entries.items()):
                info = ZipInfo(relative, date_time=(2026, 10, 18, 0, 0, 0))
                info.compress_type = ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, payload)
    print("Paquetes de análisis generados: " + str(len(LABS)))


if __name__ == "__main__":
    main()
