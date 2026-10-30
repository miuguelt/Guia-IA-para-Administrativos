/* Contrato de resultados generados por IA; incluye extracción tolerante de texto libre y Markdown. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AIResultModel = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';

  const FIELD_SYNONYMS = {
    reto00_semaforo_datos: ['reto 0', 'semaforo', 'mapa de carga', 'carga de trabajo', 'cinco tarjetas', 'privacidad', 'tarjetas'],
    proceso_seleccionado: ['tarea', 'necesidad administrativa', 'proceso seleccionado', 'proceso'],
    matriz_viabilidad: ['viabilidad', 'entradas', 'pasos y salidas', 'matriz'],
    analisis_riesgo_ley1581: ['ley 1581', 'riesgo', 'datos sensibles', 'controles de uso', 'proteccion de datos'],
    metrica_linea_base: ['linea base', 'frecuencia', 'metrica', 'medicion'],
    reto01_prompt_crtt: ['reto 1', 'prompt crtt', 'instruccion crtt', 'crtt'],
    reto01_verificacion: ['verificacion', 'apartado fuente', 'urg 01', 'lote de solicitudes', 'requisitos'],
    uso_ia_y_revision: ['uso de ia', 'revision humana', 'herramienta', 'autocomprobacion', 'bitacora'],
    pqrs_borrador: ['reto 2', 'dos borradores', 'borradores de respuesta', 'pc 01', 'pc 03', 'pqrs'],
    pqrs_verificacion: ['verificacion pqrs', 'hechos', 'peticion', 'vacios'],
    prompt_maestro_rcirs: ['reto 3', 'prompt maestro', 'instruccion reutilizable', 'asistente de rol'],
    pruebas_de_estres: ['tres pruebas', 'pruebas', 'pc 02', 'casos de prueba'],
    protocolo_anti_deriva: ['anti deriva', 'protocolo', 'deriva', 'control'],
    triage_50_mensajes: ['reto 4', 'bandeja', '50 mensajes', 'priorizacion', 'triage'],
    acta_ejecutiva_reunion: ['reto 5', 'acta', 'reunion', 'acuerdos', 'linea de tiempo'],
    normalizacion_datos_sofia: ['reto 6', 'normalizacion', 'limpieza', '30 registros', 'regla reproducible'],
    diseno_flujo_hitl: ['reto 7', 'flujo', 'diagrama', 'ramas', 'revision humana'],
    calculos_y_visualizacion: ['reto 8', 'calculos', 'tasas', 'presupuesto', 'grafico', 'gastos'],
    auditoria_afirmaciones: ['reto 9', 'auditoria', 'afirmaciones', 'orden intrusa', 'citas'],
    analisis_trazable_contratos: ['integrador', 'contratos', '24 contratos', 'trazabilidad', 'sim ct 008'],
    prueba_individual_transferencia: ['prueba individual', 'caso nuevo', 'desempeno individual'],
    informe_ejecutivo_y_plan: ['informe ejecutivo', 'plan de accion', 'borrador de teams'],
    piloto_30_dias: ['piloto', '30 dias', 'transferencia', 'mejora']
  };

  function normalizeKeyText(value) {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gu, ' ')
      .replace(/\s+/gu, ' ')
      .trim();
  }

  function isValidCanvaUrl(url) {
    return typeof url === 'string' && /^https?:\/\/(?:www\.)?canva\.com\/(?:design|proto|p)\/[a-zA-Z0-9_-]+/iu.test(url.trim());
  }

  function matchFieldForHeader(headerText, artifact) {
    const norm = normalizeKeyText(headerText);
    if (!norm) return null;
    for (const field of artifact.fields) {
      const keyNorm = normalizeKeyText(field.key.replace(/_/gu, ' '));
      const labelNorm = normalizeKeyText(field.label);
      if (norm === keyNorm || norm === labelNorm || norm.includes(keyNorm) || norm.includes(labelNorm) || (labelNorm.length >= 5 && labelNorm.includes(norm) && norm.length >= 4)) {
        return field.key;
      }
      const synonyms = FIELD_SYNONYMS[field.key] || [];
      if (synonyms.some(syn => norm.includes(syn))) {
        return field.key;
      }
    }
    return null;
  }

  const TOO_LARGE = 'El resultado supera el tamaño permitido de 1 MB. Pide a la IA una versión más breve de la página.';

  function validateResult(text, artifact, options = {}) {
    if (typeof text !== 'string' || text.length > 1048576) throw new Error(TOO_LARGE);
    if (options && options.tolerant) return parseTolerantResult(text, artifact);
    let data;
    try { data = JSON.parse(text.replace(/^\uFEFF/, '')); } catch (_) { throw new Error('No se pudieron leer los datos del resultado. Pide a la IA: «Revisa el bloque de datos del final de la página, corrígelo y entrégame la página completa».'); }
    if (!data || Array.isArray(data) || data.schemaVersion !== 1) throw new Error('Los datos del resultado no tienen la forma que pide el encargo. Pide a la IA: «Usa exactamente el bloque de datos que indica el encargo y entrégame la página completa».');
    if (data.artifactId !== artifact.id) throw new Error(`Este archivo corresponde a otra evidencia. Aquí se recibe ${artifact.id}.`);
    const allowed = new Set(['schemaVersion', 'artifactId', 'fields', 'tool', 'elaboratedProduct']);
    if (Object.keys(data).some(key => !allowed.has(key))) throw new Error('El resultado trae datos que el encargo no pide. Pide a la IA: «Deja en el bloque de datos solo lo que indica el encargo y entrégame la página completa».');
    if (!data.fields || typeof data.fields !== 'object' || Array.isArray(data.fields) || !Object.keys(data.fields).length) throw new Error('El documento no contiene respuestas. Pide a la IA el resultado, no el modelo vacío.');
    const keys = new Set(artifact.fields.map(field => field.key));
    for (const [key, value] of Object.entries(data.fields)) {
      if (!keys.has(key)) throw new Error(`El campo «${key}» no pertenece a esta evidencia. Comprueba que elegiste el resultado de este módulo.`);
      if (typeof value !== 'string' || !value.trim() || value.length > 120000) throw new Error('Cada respuesta debe ser un texto con contenido y de máximo 120.000 caracteres. Los datos ausentes deben quedar como pendientes.');
    }
    if (data.tool !== undefined && (typeof data.tool !== 'string' || data.tool.length > 200)) throw new Error('La herramienta debe aparecer como un texto breve. Pide a la IA que ajuste ese dato.');
    const out = {
      artifactId: data.artifactId,
      fields: Object.fromEntries(Object.entries(data.fields).map(([key, value]) => [key, value.trim()])),
      tool: data.tool?.trim() || 'No identificado'
    };
    if (data.elaboratedProduct && typeof data.elaboratedProduct === 'object') {
      out.elaboratedProduct = data.elaboratedProduct;
    }
    return out;
  }

  function parseTolerantResult(text, artifact) {
    if (typeof text !== 'string' || text.length > 1048576) throw new Error(TOO_LARGE);
    const clean = text.replace(/^\uFEFF/, '').trim();
    if (!clean) throw new Error('El archivo está vacío. Pega la respuesta generada por la IA.');
    if (clean.startsWith('{') || clean.startsWith('[')) {
      return validateResult(clean, artifact);
    }
    const fields = {};
    const unmappedBlocks = [];
    const lines = clean.replace(/\r\n/gu, '\n').split('\n');
    let currentKey = null;
    let buffer = [];
    let unmappedHeader = false;

    const flush = () => {
      const content = buffer.join('\n').trim();
      if (content) {
        if (currentKey) {
          fields[currentKey] = fields[currentKey] ? `${fields[currentKey]}\n\n${content}` : content;
        } else if (unmappedHeader) {
          unmappedBlocks.push(content);
        }
      }
      buffer = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      const headingMatch = line.match(/^(?:#{1,4}\s+(.+)|\*\*(.+?)\*\*\s*:?\s*(.*)|(?:-\s+|\d+\.\s+)?([^:]{3,65}):\s+(.+))$/u);
      if (headingMatch) {
        const candidateHeader = headingMatch[1] || headingMatch[2] || headingMatch[4];
        const inlineContent = headingMatch[3] || headingMatch[5] || '';
        const matched = matchFieldForHeader(candidateHeader, artifact);
        if (matched) {
          flush();
          currentKey = matched;
          unmappedHeader = false;
          if (inlineContent.trim()) buffer.push(inlineContent.trim());
          continue;
        }
        if (headingMatch[1]) {
          flush();
          currentKey = null;
          unmappedHeader = true;
          continue;
        }
      }
      buffer.push(rawLine);
    }
    flush();

    if (unmappedBlocks.length) {
      const remainingKeys = artifact.fields.map(f => f.key).filter(k => !fields[k]);
      unmappedBlocks.forEach((block, idx) => {
        const targetKey = remainingKeys[idx] || artifact.fields[0].key;
        fields[targetKey] = fields[targetKey] ? `${fields[targetKey]}\n\n${block}` : block;
      });
    }

    if (!Object.keys(fields).length) {
      const words = clean.split(/\s+/u).filter(Boolean);
      if (isValidCanvaUrl(clean)) {
        fields[artifact.fields[0].key] = `Diseño elaborado en Canva: ${clean}`;
      } else if (words.length >= 4 && clean.length >= 20) {
        const paragraphs = clean.split(/\n\s*\n/u).map(p => p.trim()).filter(Boolean);
        if (paragraphs.length > 1 && artifact.fields.length > 1) {
          paragraphs.forEach((p, idx) => {
            const key = artifact.fields[Math.min(idx, artifact.fields.length - 1)].key;
            fields[key] = fields[key] ? `${fields[key]}\n\n${p}` : p;
          });
        } else {
          fields[artifact.fields[0].key] = clean;
        }
      } else {
        throw new Error('No se identificaron las partes de la evidencia. Pega la página completa que generó la IA o una respuesta con un título para cada parte.');
      }
    }

    const canvaMatch = clean.match(/https?:\/\/(?:www\.)?canva\.com\/(?:design|proto|p)\/[a-zA-Z0-9_-]+[^\s)"]*/iu);
    const out = {
      artifactId: artifact.id,
      fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, String(v).slice(0, 120000).trim()])),
      tool: 'Texto / Markdown de IA'
    };
    if (canvaMatch) {
      out.elaboratedProduct = {
        kind: 'canva_link',
        name: 'Diseño en Canva',
        url: canvaMatch[0],
        format: 'canva',
        registeredAt: new Date().toISOString()
      };
    }
    return out;
  }

  // Los campos acumulativos guardan una sección por reto para que un resultado nuevo no borre el anterior.
  const CUMULATIVE_FIELDS = ['uso_ia_y_revision'];
  const SECTION_HEADING = /^### (Reto \d+|Integrador|Prueba individual|Cierre del módulo|Variante [^\n]+)$/u;

  function splitSections(text) {
    const intro = [];
    const sections = new Map();
    let current = null;
    String(text || '').replace(/\r\n/gu, '\n').split('\n').forEach(line => {
      const heading = line.match(SECTION_HEADING);
      if (heading) {
        current = heading[1];
        sections.set(current, []);
      } else {
        (current === null ? intro : sections.get(current)).push(line);
      }
    });
    return { intro: intro.join('\n').trim(), sections };
  }

  function mergeCumulativeField(previous, incoming, label) {
    const next = splitSections(incoming);
    if (label && !next.sections.size) {
      next.sections.set(label, [next.intro]);
      next.intro = '';
    }
    if (!next.sections.size) return String(incoming).trim();
    const merged = splitSections(previous);
    next.sections.forEach((lines, name) => merged.sections.set(name, lines));
    const blocks = [...merged.sections]
      .sort(([a], [b]) => a.localeCompare(b, 'es', { numeric: true }))
      .map(([name, lines]) => `### ${name}\n\n${lines.join('\n').trim()}`);
    return [next.intro || merged.intro, ...blocks].filter(Boolean).join('\n\n');
  }

  function prepareRecord(previous, result, artifact) {
    const values = { ...previous.values, ...result.fields };
    CUMULATIVE_FIELDS.forEach(key => {
      if (result.fields[key] !== undefined) values[key] = mergeCumulativeField(previous.values?.[key], result.fields[key], result.label);
    });
    const record = {
      values,
      checks: Object.fromEntries(artifact.checklist.map((_, index) => ['c' + index, false])),
      status: 'borrador'
    };
    const product = result.elaboratedProduct || previous.elaboratedProduct;
    if (product) record.elaboratedProduct = product;
    return record;
  }

  function missingFields(artifact, record) {
    return artifact.fields.filter(field => field.required !== false && !String(record.values[field.key] || '').trim()).map(field => field.label);
  }

  function documentText(artifact, record) {
    const reviewed = artifact.checklist.length > 0 && artifact.checklist.every((_, index) => record.checks?.['c' + index] === true);
    const review = reviewed ? 'Revisión confirmada por el aprendiz en la guía. La valoración del instructor permanece pendiente.' : 'La revisión humana y la valoración del instructor permanecen pendientes hasta que se realicen.';
    const lines = [`# ${artifact.id} · ${artifact.name}`, '', 'Documento preparado con IA. ' + review, ''];
    if (record.elaboratedProduct) {
      const prod = record.elaboratedProduct;
      lines.push(`## Producto elaborado registrado`, '', `${prod.name || 'Entregable'}${prod.url ? ' (' + prod.url + ')' : ''}${prod.format ? ' [' + prod.format.toUpperCase() + ']' : ''}`, '');
    }
    artifact.fields.forEach(field => { lines.push(`## ${field.label}`, '', String(record.values[field.key] || 'Pendiente.'), ''); });
    lines.push('El contenido recibido no equivale a una aprobación institucional ni a un juicio de evaluación.');
    return lines.join('\n');
  }

  function documentHtml(artifact, record) {
    const escape = value => String(value).replace(/[&<>"']/gu, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const title = artifact.id + ' · ' + artifact.name;
    const review = documentText(artifact, record).split('\n')[2];
    const prodSection = record.elaboratedProduct
      ? `<section class="product-registered"><h2>Producto elaborado registrado</h2><div class="answer">${escape(record.elaboratedProduct.name || 'Entregable')}${record.elaboratedProduct.url ? ' · ' + escape(record.elaboratedProduct.url) : ''}</div></section>`
      : '';
    const sections = artifact.fields.map(field => `<section><h2>${escape(field.label)}</h2><div class="answer">${escape(record.values[field.key] || 'Pendiente.')}</div></section>`).join('');
    return `<!doctype html><html lang="es-CO"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>body{margin:0;background:#edf2ee;color:#24382d;font:16px/1.7 system-ui,sans-serif}main{max-width:860px;margin:32px auto;padding:48px;background:white;border:1px solid #cfdbd2;border-top:8px solid #245844;border-radius:12px}h1{font-size:28px;line-height:1.25}h2{font-size:19px;margin:0 0 12px;color:#245844}section{margin:24px 0;padding:22px;border:1px solid #cfdbd2;border-radius:8px}.answer{white-space:pre-wrap;overflow-wrap:anywhere}.notice,footer{font-size:13px;color:#53675a}footer{border-top:1px solid #cfdbd2;padding-top:18px}@media(max-width:600px){main{margin:12px;padding:22px}section{padding:16px}}@media print{body{background:white}main{border:0;margin:0;padding:0}h2{break-after:avoid}section{border-color:#a8b8ad}footer{margin-top:24px}@page{size:A4;margin:20mm}}</style></head><body><main><header><p class="notice">EVIDENCIA DE APRENDIZAJE · DOCUMENTO PREPARADO CON IA</p><h1>${escape(title)}</h1><p class="notice">${escape(review)}</p></header>${prodSection}${sections}<footer>Conserva los archivos fuente y los anexos del chat o del IDE. Este documento no constituye una aprobación institucional ni un juicio de evaluación.</footer></main></body></html>`;
  }

  return {
    normalizeKeyText,
    isValidCanvaUrl,
    matchFieldForHeader,
    validateResult,
    parseTolerantResult,
    CUMULATIVE_FIELDS,
    mergeCumulativeField,
    prepareRecord,
    missingFields,
    documentText,
    documentHtml
  };
});
