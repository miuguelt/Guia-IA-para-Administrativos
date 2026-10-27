"""Publica encargos completos y recepción de resultados sin digitación del aprendiz."""
from html import escape
import json
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
TASKS = json.loads((ROOT / 'content/ai-task-briefs.json').read_text(encoding='utf-8'))
REGISTRY = json.loads((ROOT / 'deliverables.registry.json').read_text(encoding='utf-8'))
SHARED_MATERIALS = json.loads((ROOT / 'content/shared-challenge-materials.json').read_text(encoding='utf-8'))


def render_task(key, include_downloads=True):
    """Permite copiar el encargo sin editarlo ni abrir su contrato completo."""
    task = TASKS[key]
    ident = 'ai-task-' + key
    variants = ''.join(f'<a href="materiales/ia/{escape(name)}.zip" download>{escape(data["title"])}</a>'
                       for name, data in TASKS.items() if data.get('parentTask') == key)
    optional = f'<details class="ai-task-variants"><summary>Probar una variante por área · dentro del mismo tiempo</summary><div>{variants}</div></details>' if variants else ''
    shared_paths = {item['href'] for item in SHARED_MATERIALS}
    own_sources = [Path(source).name for source in task['sourceFiles'] if source not in shared_paths]
    shared_sources = [Path(source).name for source in task['sourceFiles'] if source in shared_paths]
    sources = ', '.join(own_sources) or 'No requiere archivos propios'
    shared = (' <strong>Recurso común:</strong> ' + escape(', '.join(shared_sources))
              + '. Ya viene en la carpeta fuentes/ del paquete y también en «Recursos comunes».' if shared_sources else '')
    action = ('Descarga y extrae el paquete. Adjunta solo las fuentes que enumera el encargo; todas están en la carpeta fuentes/ del paquete. Copia el encargo completo y pide este producto elaborado: ' + task['visualDescription'] + ' Revisa las comprobaciones de tu entrega y guárdala en «Guarda tu evidencia».'
              if task.get('visualArtifact') else
              'Descarga el paquete, adjunta sus fuentes al chat o abre la carpeta en tu IDE. Copia el encargo de la opción que uses.')
    if not include_downloads and task.get('visualArtifact'):
        action = task['visualDescription']
    download_links = ''
    if include_downloads:
        download_links = f'<div class="ai-task-downloads"><a href="materiales/ia/{escape(key)}.zip" download>Descargar paquete para IA (.zip) ↓</a>'
        if task.get('visualArtifact'):
            download_links += f'<a href="materiales/ia/{escape(key)}/LEEME.html" target="_blank" rel="noopener noreferrer">Abrir instrucciones ↗</a></div>'
        else:
            download_links += f'<a href="materiales/ia/{escape(key)}/LEEME.html" target="_blank" rel="noopener noreferrer">Abrir instrucciones con formato ↗</a></div>'
    chat_download = '' if task.get('visualArtifact') else f'<a href="materiales/ia/{escape(key)}/ENCARGO-CHAT.md" download>Descargar encargo para chat</a>'
    ide_download = '' if task.get('visualArtifact') else f'<a href="materiales/ia/{escape(key)}/ENCARGO-IDE.md" download>Descargar encargo para IDE</a>'
    return f'''<section class="ai-task-card" data-ai-task-key="{escape(key)}"><span class="eyebrow">UN ENCARGO LISTO PARA USAR</span><h3>{escape(task['title'])}</h3><p class="ai-task-output"><strong>La IA te entrega:</strong> {escape(task['output'])}</p><p class="ai-task-action">{escape(action)}</p><div class="ai-task-actions"><button type="button" class="button button-primary" data-copy="{ident}-chat">Copiar para un chat</button><details class="ide-option"><summary>Opción avanzada: trabajar en Antigravity o Codex</summary><button type="button" class="button button-secondary" data-copy="{ident}-ide">Copiar el encargo para Antigravity o Codex</button></details></div>{download_links}<details class="ai-task-reference"><summary>Consultar fuentes y encargos completos</summary><p><strong>Archivos propios que recibe la IA:</strong> {escape(sources)}.{shared}</p><h4>Para el chat</h4><pre class="prompt-text" id="{ident}-chat" data-ai-task>{escape(task['chatPrompt'])}</pre>{chat_download}<h4>Para Antigravity u otro IDE</h4><pre class="prompt-text" id="{ident}-ide">{escape(task['idePrompt'])}</pre>{ide_download}</details>{optional}</section>'''


def render_delivery(ident):
    """Recibe archivos o carpetas; las respuestas siguen perteneciendo al SDK."""
    artifact = next(item for item in REGISTRY['artifacts'] if item['id'] == ident)
    task = render_task(ident) if ident in TASKS else ''
    criteria = ''.join(f'<li>{escape(text)}</li>' for text in artifact['checklist'])
    visual = bool(TASKS.get(ident, {}).get('visualArtifact'))
    if visual:
        # Cada resultado de reto completa sus campos; el encargo integrado queda como alternativa.
        expected = ''.join(f'<li><code>resultado-{escape(key)}.html</code> · {escape(data["title"])}</li>'
                           for key, data in TASKS.items()
                           if data.get('artifactId') == ident and data.get('kind') in ('challenge', 'individual'))
        heading = f'''<div class="delivery-heading"><span class="eyebrow">{ident} · TU EVIDENCIA</span><h2 id="delivery-title-{ident}">Guarda los resultados de tus retos</h2><p>Sube la página que te entregó la IA en cada reto. Cada archivo completa su parte de la evidencia; no prepares otra entrega.</p><ul class="delivery-expected" data-expected-results>{expected}</ul></div>'''
        task = f'<details class="delivery-integrated"><summary>¿Prefieres reunir todo en una página? Usa el encargo integrado (resultado-{escape(ident)}.html)</summary>{task}</details>' if task else ''
        selection = f'''<h3>Guarda tus resultados en tres pasos</h3><ol class="delivery-steps"><li><strong>Elige</strong> la página <code>resultado-reto-N.html</code> de un reto.</li><li><strong>Revisa</strong> la vista previa y guarda el borrador.</li><li><strong>Repite</strong> con cada reto y, al final, confirma tu revisión.</li></ol><label class="delivery-file-label" for="result-file-{ident}">Elegir mi resultado</label><input type="file" id="result-file-{ident}" accept=".html,.pdf,.png,.jpg,.jpeg,.webp,.xlsx,.csv,.docx,.json,.zip,.txt,.md,text/html,application/pdf,image/png,image/jpeg,image/webp,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json,application/zip,application/x-zip-compressed,text/plain,text/markdown" multiple data-result-file aria-describedby="result-local-{ident}">'''
        folder_help = 'Este navegador no permite seleccionar carpetas. Selecciona tu producto elaborado o comprime la carpeta en un ZIP.'
        paste = f'''<details class="delivery-paste"><summary>Pegar el resultado si la IA no pudo guardar archivos</summary><p>Pide el resultado completo con el bloque de evidencia integrado. Pega el contenido aquí; la guía lo leerá como texto y no ejecutará sus scripts.</p><label for="result-text-{ident}">Texto o resultado completo</label><textarea id="result-text-{ident}" data-result-text rows="6" spellcheck="false" aria-describedby="result-local-{ident}"></textarea><button type="button" class="button button-secondary" data-result-paste>Comprobar el texto pegado</button></details>'''
        repair_text = f'Genera de nuevo tu producto elaborado para {ident}. Conserva las fuentes, revisa los criterios, incluye los datos de evidencia y no inventes cifras, autorizaciones ni revisión humana. No crees un JSON separado.'
        downloads = ''
    else:
        heading = f'''<div class="delivery-heading"><span class="eyebrow">{ident} · DOCUMENTO GENERADO CON IA</span><h2 id="delivery-title-{ident}">Recibe el resultado, sin volver a escribirlo</h2><p>La IA prepara documentos y un resultado estructurado que puedes guardar en el Portafolio de Evidencias.</p></div>'''
        selection = f'''<h3>Guarda tu resultado en tres pasos</h3><ol class="delivery-steps"><li><strong>Copia el encargo</strong> de arriba en tu chat con IA y adjunta las fuentes del paquete.</li><li><strong>Descarga</strong> el resultado que te entrega la IA.</li><li><strong>Elige</strong> ese archivo aquí y revisa la vista previa antes de guardar. Si hay varias versiones, elige solo una.</li></ol><label class="delivery-file-label" for="result-file-{ident}">Elegir archivos de la IA (.json, .zip, .txt, .md)</label><input type="file" id="result-file-{ident}" accept=".json,.zip,.txt,.md,application/json,application/zip,application/x-zip-compressed,text/plain,text/markdown" multiple data-result-file aria-describedby="result-local-{ident}">'''
        folder_help = 'Este navegador no permite seleccionar carpetas. Selecciona resultado.json o comprime la carpeta en un ZIP.'
        paste = f'''<details class="delivery-paste"><summary>Pegar el resultado completo del chat</summary><p>Si el chat no crea archivos, pídele un único bloque JSON con el esquema del paquete. Copia ese bloque completo y pégalo aquí; no redactes ni transcribas las respuestas.</p><label for="result-text-{ident}">Resultado completo generado por la IA</label><textarea id="result-text-{ident}" data-result-text rows="6" spellcheck="false" aria-describedby="result-local-{ident}"></textarea><button type="button" class="button button-secondary" data-result-paste>Comprobar el resultado pegado</button></details>'''
        repair_text = f'Genera de nuevo un resultado estructurado para {ident} con las claves del paquete. Conserva solo información respaldada; no inventes tiempos, autorizaciones ni revisión humana. Entrega el bloque completo sin comentarios; no me pidas editarlo.'
        downloads = '''<div class="delivery-downloads"><button type="button" class="button button-secondary" data-result-download="html" disabled>Descargar documento para imprimir (.html)</button><button type="button" class="button button-secondary" data-result-download="md" disabled>Descargar documento (.md)</button><button type="button" class="button button-secondary" data-result-download="json" disabled>Descargar respaldo (.json)</button></div>'''
    task_before, task_after = ('', task) if visual else (task, '')
    return f'''<section class="ai-delivery" data-ai-delivery="{ident}" aria-labelledby="delivery-title-{ident}">{heading}{task_before}<section class="delivery-receive"><span class="delivery-step">GUARDA TU RESULTADO</span>{selection}<p data-result-info></p><p data-result-status class="delivery-status" role="status" aria-live="polite">Selecciona el archivo cuando la IA lo haya generado.</p><button type="button" class="button button-secondary" data-result-retry hidden>Seleccionar de nuevo</button><details class="delivery-help"><summary>¿Algo falló? Otras formas de entregar</summary><p class="delivery-local" id="result-local-{ident}">El archivo se lee en este navegador; no se envía a ningún servidor. Usa solo los materiales de práctica, sin datos personales reales. También se aceptan un PDF o una imagen de tu diseño (el Portafolio registra el archivo y deja las respuestas pendientes), un ZIP, una carpeta o un TXT, Markdown o JSON con el resultado. Límites: 1 MB por resultado, 20 MB por ZIP, 5 MB entre resultados y 500 archivos.</p><div data-result-folder-control><label class="delivery-file-label" for="result-folder-{ident}">Elegir una carpeta con el resultado</label><input type="file" id="result-folder-{ident}" webkitdirectory directory multiple data-result-folder aria-describedby="result-local-{ident}"></div><p data-result-folder-help hidden>{folder_help}</p>{paste}<details class="delivery-repair"><summary>Si el resultado tiene un error de formato</summary><p id="repair-{ident}">{escape(repair_text)}</p><button type="button" class="copy-button" data-copy="repair-{ident}">Copiar solicitud de corrección</button></details></details><div data-result-preview class="result-preview"></div><button type="button" class="button button-primary" data-result-save disabled>Guardar borrador en el Portafolio de Evidencias</button></section>{task_after}<section class="delivery-review"><h3>Revisa y conserva</h3><details class="delivery-criteria"><summary>Qué debes comprobar antes de confirmar</summary><ul>{criteria}</ul></details><button type="button" class="button button-secondary" data-result-review disabled>Confirmo que revisé los criterios</button><p>La importación no comprueba el contenido. La confirmación registra tu revisión; la valoración corresponde al instructor.</p>{downloads}</section></section>'''


def attach_task_slots(soup):
    """Publica en su lugar los encargos que no pertenecen a un reto, como la prueba individual."""
    for slot in soup.select('[data-ai-task-slot]'):
        slot.replace_with(BeautifulSoup(render_task(slot['data-ai-task-slot']), 'html.parser'))


def attach_deliveries(soup):
    """Oculta la interfaz de digitación del SDK y conserva sus siete estaciones."""
    attach_task_slots(soup)
    for mount in soup.select('[data-db-evidence]'):
        if mount.find_parent(attrs={'data-ai-storage': True}):
            continue
        wrapper = soup.new_tag('div')
        wrapper['hidden'] = ''
        wrapper['data-ai-storage'] = mount['data-db-evidence']
        mount.wrap(wrapper)
        wrapper.insert_before(BeautifulSoup(render_delivery(mount['data-db-evidence']), 'html.parser'))
