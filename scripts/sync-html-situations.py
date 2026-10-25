#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sincroniza content/home.html y content/portfolio.html con las 12 situaciones
de content/office-situations.json.
"""

import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"

data = json.loads((CONTENT / "office-situations.json").read_text(encoding="utf-8"))
situations = data["situations"]

# 1. Actualizar las 3 tarjetas en home.html
home_path = CONTENT / "home.html"
home_text = home_path.read_text(encoding="utf-8")

dimension_links_map = {
    "Comités de evaluación:": 'comites-evaluacion',
    "Novedades en plataformas:": 'novedades-plataformas',
    "Cuentas de cobro:": 'cuentas-cobro',
    "Radicación de PQRS:": 'pqrs-urgentes',
    "Actas y compromisos:": 'actas-reunion',
    "Normalización de tablas:": 'limpieza-excel',
    "Comunicaciones oficiales:": 'comunicaciones-oficiales',
    "Diseño de procedimientos:": 'diseno-procedimientos',
    "Explicaciones a tu medida:": 'explicaciones-medida',
    "Preguntas de comprobación:": 'preguntas-comprobacion',
    "Práctica deliberada:": 'practica-deliberada',
    "Rutas paso a paso:": 'rutas-paso-a-paso'
}

# Reemplazar viñetas de dimensions-grid para agregar el enlace de acción interactivo si no lo tienen
for prefix, sit_id in dimension_links_map.items():
    # Buscar patrón de la viñeta
    pattern = rf'(<li><strong>{re.escape(prefix)}</strong>\s*([^<]+?))</li>'
    def replace_bullet(match):
        text_content = match.group(2).strip()
        # Si ya tiene el enlace, conservarlo
        if 'dimension-link-action' in text_content:
            return match.group(0)
        return f'<li><strong>{prefix}</strong> {text_content} <a href="#situaciones-oficina" class="dimension-link-action" data-open-situation="{sit_id}">Ver ficha y prompt <span aria-hidden="true">→</span></a></li>'
    home_text = re.sub(pattern, replace_bullet, home_text)

# 2. Actualizar el cuerpo pre-renderizado de #situaciones-oficina en home.html
# Generar filters bar
filters_html = [
    '<div aria-label="Filtrar situaciones por categoría" class="situation-filters-bar" role="tablist">',
    '  <button aria-selected="true" class="situation-filter-btn is-active" data-situation-category="todas" role="tab" type="button">Todas las situaciones <span class="filter-count">(12)</span></button>',
    '  <button aria-selected="false" class="situation-filter-btn" data-situation-category="sede-coordinacion" role="tab" type="button">Gestión de sede <span class="filter-count">(4)</span></button>',
    '  <button aria-selected="false" class="situation-filter-btn" data-situation-category="gestion-documental" role="tab" type="button">Gestión documental <span class="filter-count">(4)</span></button>',
    '  <button aria-selected="false" class="situation-filter-btn" data-situation-category="aprendizaje-continuo" role="tab" type="button">Aprendizaje continuo <span class="filter-count">(4)</span></button>',
    '</div>'
]

# Generar cards grid
cards_html = ['<div class="situations-cards-grid" role="list">']
for i, s in enumerate(situations):
    is_sel = (i == 0)
    cards_html.append(f'''  <article aria-current="{'true' if is_sel else 'false'}" class="situation-picker-card{' is-selected' if is_sel else ''}" data-situation-id="{s['id']}" role="listitem" tabindex="0">
    <div class="picker-card-top"><span aria-hidden="true" class="picker-card-icon">{s['icon']}</span><span class="picker-card-category">{s['categoryLabel']}</span></div>
    <h3 class="picker-card-title">{s['shortTitle']}</h3>
    <p class="picker-card-desc">{s['problemDescription']}</p>
    <div class="picker-card-bottom"><span class="picker-card-format">{s['productFormat']}</span><span class="picker-card-action">{'Seleccionada ✓' if is_sel else 'Ver solución →'}</span></div>
  </article>''')
cards_html.append('</div>')

# Primer detalle: comites-evaluacion
first_sit = situations[0]
first_detail_html = f'''<div aria-labelledby="detail-title-{first_sit['id']}" class="situation-detail-panel" id="situation-detail-{first_sit['id']}" role="region">
  <header class="detail-panel-header">
    <div class="detail-header-copy">
      <span class="detail-category-badge">{first_sit['categoryLabel']}</span>
      <h3 id="detail-title-{first_sit['id']}"><span aria-hidden="true" class="detail-icon">{first_sit['icon']}</span> {first_sit['title']}</h3>
      <p class="detail-lead">{first_sit['problemDescription']}</p>
    </div>
    <div class="detail-format-tag"><small>Producto elaborado</small><strong>{first_sit['productFormat']}</strong></div>
  </header>
  <div class="detail-shields-grid">
    <div class="detail-shield-card shield-tool">
      <div class="shield-badge">1. Herramienta de IA</div>
      <h4>¿Qué IA y software usar?</h4>
      <p>{first_sit['recommendedAiTool']}</p>
    </div>
    <div class="detail-shield-card shield-security">
      <div class="shield-badge">2. Ley 1581 de 2012</div>
      <h4>Blindaje de seguridad y privacidad</h4>
      <p>{first_sit['securityShield']}</p>
    </div>
    <div class="detail-shield-card shield-accuracy">
      <div class="shield-badge">3. Escudo de exactitud</div>
      <h4>Regla de oro: «no consta»</h4>
      <p>{first_sit['accuracyShield']}</p>
    </div>
  </div>
  <div class="detail-sample-data-box" style="margin: 16px 0; padding: 14px; background: #eef4f1; border-radius: 8px; border-left: 3px solid #225746;">
    <div style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: #225746; margin-bottom: 6px;">📋 Datos de práctica preparados (copiar para probar):</div>
    <p style="margin: 0; font-size: 0.88rem; color: #233e33; line-height: 1.5;">{first_sit['sampleData']}</p>
  </div>
  <section aria-labelledby="prompt-heading-{first_sit['id']}" class="detail-prompt-section">
    <div class="detail-prompt-head">
      <div>
        <span class="eyebrow">INSTRUCCIÓN LISTA PARA APLICAR</span>
        <h4 id="prompt-heading-{first_sit['id']}">Prompt base estructurado (1 clic)</h4>
      </div>
      <button aria-describedby="copy-status-{first_sit['id']}" class="button button-primary btn-copy-prompt" data-copy-situation-prompt="{first_sit['id']}" type="button"><span aria-hidden="true">📋</span> Copiar prompt base</button>
    </div>
    <div class="prompt-code-wrap">
      <pre class="detail-prompt-pre"><code class="detail-prompt-code">{first_sit['basePrompt']}</code></pre>
    </div>
    <p aria-live="polite" class="copy-status-msg" id="copy-status-{first_sit['id']}" role="status"></p>
  </section>
  <footer class="detail-panel-footer">
    <div class="detail-transfer-note"><strong>¿Quieres profundizar en esta técnica?</strong><span>Practica esta solución con archivos reales en el recorrido del aula.</span></div>
    <a class="button button-outline" data-open-challenge="{first_sit['challengeId']}" href="{first_sit['challengeLink']}">Ir a la práctica: {first_sit['challengeName']} <span aria-hidden="true">→</span></a>
  </footer>
</div>'''

new_selector_body = f'''<div class="office-situations-selector-body" data-office-situations-selector-container="" id="office-situations-selector-container">
<div class="office-selector-component">
{chr(10).join(filters_html)}
<div class="office-selector-layout">
<div class="selector-cards-col">
{chr(10).join(cards_html)}
</div>
<div class="selector-detail-col">
{first_detail_html}
</div>
</div>
</div>
</div>'''

# Reemplazar office-situations-selector-body en home.html
body_pattern = r'<div class="office-situations-selector-body".*?</div>\s*</div>\s*</div>\s*</div>'
home_text = re.sub(body_pattern, new_selector_body, home_text, flags=re.DOTALL)
home_path.write_text(home_text, encoding="utf-8")
print("content/home.html actualizado con las 12 situaciones y enlaces interactivos.")

# 3. Actualizar portfolio.html
portfolio_path = CONTENT / "portfolio.html"
portfolio_text = portfolio_path.read_text(encoding="utf-8")

manual_cards = []
for i, s in enumerate(situations):
    sample_box = ""
    if s.get("sampleData"):
        sample_box = f'<div style="margin: 12px 0; padding: 10px 12px; background: #f2f7f4; border-radius: 6px; font-size: 0.85rem; color: #284639;"><strong>Muestra de práctica:</strong> {s["sampleData"]}</div>'
    
    card_html = f'''      <article class="manual-item-card" id="manual-card-{s['id']}">
        <div class="manual-item-header">
          <div class="manual-item-title-wrap">
            <span class="manual-item-icon" aria-hidden="true">{s['icon']}</span>
            <div>
              <span class="manual-item-badge">{s['categoryLabel']}</span>
              <h3>{i + 1}. {s['title']}</h3>
            </div>
          </div>
          <span class="manual-format-pill">{s['productFormat']}</span>
        </div>
        <p class="manual-item-problem"><strong>Situación:</strong> {s['problemDescription']}</p>
        <div class="manual-shields-row">
          <div class="manual-shield-col shield-tool"><strong>Herramienta:</strong><p>{s['recommendedAiTool']}</p></div>
          <div class="manual-shield-col shield-legal"><strong>Seguridad (Ley 1581):</strong><p>{s['securityShield']}</p></div>
          <div class="manual-shield-col shield-accuracy"><strong>Exactitud («no consta»):</strong><p>{s['accuracyShield']}</p></div>
        </div>
        {sample_box}
        <div class="manual-prompt-wrapper">
          <div class="manual-prompt-bar">
            <strong>Prompt base probado:</strong>
            <button type="button" class="button button-secondary btn-copy-prompt" data-copy-situation-prompt="{s['id']}" aria-describedby="manual-copy-status-{s['id']}">Copiar prompt</button>
          </div>
          <pre class="manual-prompt-code"><code>{s['basePrompt']}</code></pre>
          <p class="copy-status-msg" id="manual-copy-status-{s['id']}" role="status" aria-live="polite"></p>
        </div>
        <div class="manual-item-footer">
          <span>Práctica en el aula: <a href="{s['challengeLink']}">{s['challengeName']}</a></span>
        </div>
      </article>'''
    manual_cards.append(card_html)

manual_grid_html = '<div class="manual-items-grid">\n' + '\n\n'.join(manual_cards) + '\n    </div>'

# Reemplazar en portfolio.html
portfolio_pattern = r'<div class="manual-items-grid">.*?</div>\s*</div>\s*</section>'
replacement_portfolio = manual_grid_html + '\n  </div>\n</section>'
portfolio_text = re.sub(portfolio_pattern, replacement_portfolio, portfolio_text, flags=re.DOTALL)

# Actualizar texto explicativo de la cabecera
portfolio_text = portfolio_text.replace(
    'Consulta las seis situaciones frecuentes de oficina',
    'Consulta las doce soluciones prácticas de oficina y autoaprendizaje socrático'
)

portfolio_path.write_text(portfolio_text, encoding="utf-8")
print("content/portfolio.html actualizado con las 12 fichas completas.")
