"""Compone prácticas accesibles desde los casos y las filas de sus fuentes."""
import csv
import hashlib
import json
from html import escape
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
STAGES = ("Consulta la fuente", "Decide", "Comprueba", "Revisa tu resultado")


def source_records(sources, root=ROOT):
    """Lee filas físicas del CSV; conserva vacíos y espacios del original."""
    records = []
    for source in sources:
        if "records" in source:
            # Fuente en texto: el caso se lee en la página y no se descarga ningún archivo.
            records.extend({"label": record["label"], "fields": [tuple(field) for field in record["fields"]]}
                           for record in source["records"])
            continue
        path = root / "materiales/retos" / source["file"]
        with path.open(encoding="utf-8-sig", newline="") as stream:
            rows = list(csv.reader(stream, delimiter=";"))
        headers = rows[3]
        for number in source["rows"]:
            values = rows[number - 1]
            records.append({"file": source["file"], "row": number,
                            "fields": list(zip(headers, values))})
    return records


PENDING_PROMPTS = {
    "rate": "Completa el cálculo y comprueba tu respuesta.",
    "amount": "Completa el cálculo y comprueba tu respuesta.",
    "instruction": "Selecciona las cuatro partes y comprueba tu respuesta.",
}


def pending_prompt(question):
    """Nombra la acción que pide la pregunta antes de comprobarla."""
    return PENDING_PROMPTS.get(question.get("type"), "Elige una opción y comprueba tu respuesta.")


def question_html(module, question):
    """Publica controles y explicación desde el mismo enunciado evaluable."""
    ident = f"case-{module}-{question['id']}"
    if question.get("type") == "instruction":
        controls = ''
        for index, part in enumerate(question['parts']):
            options = ''.join(f'<option value="{escape(value, quote=True)}">{escape(label)}</option>' for value, label in part['options'])
            controls += f'<label>{escape(part["label"])}<select data-case-value="{index}" aria-describedby="{ident}-feedback"><option value="">Selecciona una opción</option>{options}</select></label>'
        controls += '<p data-case-instruction-preview>Selecciona las cuatro partes para leer el encargo completo.</p>'
    elif question.get("type") == "rate":
        controls = ''.join(f'<label>{label}<input type="text" inputmode="decimal" data-case-value="{index}" aria-describedby="{ident}-feedback" autocomplete="off"></label>'
                           for index, label in enumerate(("Deserciones", "Matriculados", "Tu resultado (%)")))
    elif question.get("type") == "amount":
        controls = f'<label>Diferencia en COP<input type="text" inputmode="decimal" data-case-value="0" aria-describedby="{ident}-feedback" autocomplete="off"></label>'
    else:
        controls = ''.join(f'<label class="check-option"><input type="radio" name="{ident}" value="{escape(str(value), quote=True)}" aria-describedby="{ident}-feedback"><span>{escape(label)}</span></label>'
                           for value, label in question["options"])
    initial_hint = question.get("hint") or (question["hints"][0] if question.get("hints") else "")
    return f'''<form id="{ident}" class="case-question" data-case-question="{escape(question['id'], quote=True)}" data-state="pending"><fieldset><legend>{escape(question['prompt'])}</legend><div class="case-inputs">{controls}</div></fieldset><div class="check-actions"><button type="button" class="button button-primary" data-case-submit>Comprobar respuesta</button><button type="button" class="text-button" data-case-hint>Consultar una pista</button></div><p id="{ident}-feedback" data-case-feedback role="status" aria-live="polite">{pending_prompt(question)}</p><p data-case-hint-text hidden>{escape(initial_hint)}</p></form>'''


def practice_html(module, widgets, example, checks, root=ROOT):
    """Une fuente, decisiones, herramientas y cierre sin duplicar el caso."""
    spec = json.loads((root / "content/case-practices.json").read_text(encoding="utf-8"))[module]
    spec["id"] = module
    spec["version"] = 1
    for question in spec["questions"]:
        question.setdefault("type", "choice")
        if question["type"] == "choice":
            question["options"] = [item if isinstance(item, list) else [str(index), item]
                                   for index, item in enumerate(question["options"])]
        assert question["reference"] and (question.get("hint") or question.get("hints"))
    records = source_records(spec["sources"], root)
    source_html = []
    for record in records:
        fields = ''.join(f'<div><dt>{escape(key)}</dt><dd><code>{escape(value) if value else "No consta"}</code></dd></div>' for key, value in record["fields"])
        heading = record["label"] if "label" in record else f'{record["file"]} · fila {record["row"]}'
        source_html.append(f'<article class="case-source-record"><h4>{escape(heading)}</h4><dl>{fields}</dl></article>')
    links = ''.join(f'<a href="materiales/retos/{escape(source["file"], quote=True)}" download>Descargar {escape(source["file"])}</a>' for source in spec["sources"] if "file" in source)
    intro = spec.get("sourceIntro") or ('Consulta los extractos conservados del archivo original. Los espacios y los campos vacíos también son parte de la fuente.'
                                        if links else 'Lee estos mensajes y apartados del lineamiento. En el reto copiarás la bandeja completa; no necesitas descargar archivos.')
    # Cada módulo puede nombrar sus cuatro etapas por la acción que pide.
    stage_titles = tuple(spec.get("stages", STAGES))
    assert len(stage_titles) == len(STAGES), module
    links_html = '<div class="case-source-links">' + links + '</div>' if links else ''
    content = ['<div data-case-source><p>' + intro + '</p>' + links_html + '<div class="case-sources">' + ''.join(source_html) + '</div></div>', '', '', '']
    for question in spec["questions"]:
        content[question["stage"]] += question_html(module, question)
    if widgets:
        tools = BeautifulSoup(widgets, 'html.parser')
        for button in tools.select('[data-pqrs-transfer], [data-cleaner-transfer]'):
            button.decompose()
        content[2] += '<details class="case-tools"><summary>Refuerza tus decisiones con los simuladores del caso</summary>' + str(tools) + '</details>'
    final = BeautifulSoup(checks, "html.parser")
    for index, form in enumerate(final.select('[data-knowledge-check]')):
        key = f"cierre-{index + 1}"
        form['data-case-question'] = key
        form['class'] = form.get('class', []) + ['case-question']
        form.select_one('[data-check-submit]')['data-case-submit'] = ''
        form.select_one('[data-check-feedback]')['data-case-feedback'] = ''
        options = form.select('input[type="radio"]')
        expected = next(option['value'] for option in options if option['data-correct'] == 'true')
        spec['questions'].append({"id": key, "stage": 3, "type": "choice", "prompt": form.legend.get_text(' ', strip=True),
                                  "expected": expected, "options": [[option['value'], option.parent.get_text(' ', strip=True)] for option in options],
                                  "feedbacks": {option['value']: option['data-feedback'] for option in options},
                                  "explanation": form.select_one('.check-explanation p').get_text(' ', strip=True),
                                  "reference": "Fuentes del caso y explicación del módulo.",
                                  "hint": "Vuelve al extracto y distingue lo disponible de lo pendiente.",
                                  "hints": [
                                      "Orientación: Distingue los datos respaldados por el extracto de los que siguen pendientes.",
                                      "Dónde buscar: Vuelve al extracto original en la primera pestaña de esta práctica.",
                                      "Clave para resolver: Contrasta cada opción directamente con los campos de la fila fuente."
                                  ]})
        explanation = form.select_one('.check-explanation')
        explanation['data-case-help'] = key
        content[3] += str(form)
    content[3] += '<details data-case-solution class="case-solution"><summary>Consultar la solución explicada</summary><p>Consultar esta ayuda queda registrado; la práctica se comprueba con tus respuestas.</p>' + example + '</details>'
    title_id = f"practice-{module}-title"
    tabs = ''.join(f'<button type="button" data-case-go="{index}" aria-controls="practice-{module}-{index}"><span aria-hidden="true">{index + 1:02}</span> {title}</button>' for index, title in enumerate(stage_titles))
    stages = ''.join(f'<section id="practice-{module}-{index}" data-case-stage="{index}" aria-labelledby="practice-{module}-{index}-title"><h4 id="practice-{module}-{index}-title" tabindex="-1">{index + 1}. {title}</h4>{content[index]}</section>' for index, title in enumerate(stage_titles))
    fingerprint = json.dumps({'definition': spec, 'records': records}, ensure_ascii=False, sort_keys=True)
    spec['revision'] = hashlib.sha256(fingerprint.encode('utf-8')).hexdigest()[:16]
    payload = json.dumps(spec, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    return f'''<section class="case-practice" data-simulator="case-practice" data-case-id="{module}" aria-labelledby="{title_id}"><header class="case-header"><span class="eyebrow">PRÁCTICA CON FUENTES</span><h3 id="{title_id}">{escape(spec['title'])}</h3><p>{escape(spec['intro'])}</p><p>Esta práctica forma parte de la explicación del módulo. Puedes pasar al reto aunque tengas decisiones pendientes y volver a la práctica después.</p><p class="case-summary" data-case-summary role="status" aria-live="polite">Sin empezar</p></header><nav class="case-stage-nav" aria-label="Etapas de la práctica">{tabs}</nav>{stages}<footer class="case-footer"><button type="button" data-case-print>Imprimir esta práctica</button> <button type="button" data-case-reset>Reiniciar esta práctica</button><p data-case-save-status role="status" aria-live="polite">Activa JavaScript para guardar tus respuestas. La fuente y la solución se pueden leer sin activarlo.</p></footer><script type="application/json" data-case-spec>{payload}</script></section>'''
