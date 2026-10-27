/* Recibe resultados de archivos, carpetas, texto libre/Markdown o productos elaborados (Canva, PDF, Excel, Word). */
(function (root, factory) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const api = factory(node ? require('./ai-result-model.js') : root.AIResultModel, node ? require('./result-archive.js') : root.ResultArchive);
  if (node) module.exports = api;
  if (root) root.ResultImport = api;
})(typeof window === 'undefined' ? null : window, function (model, archive) {
  'use strict';
  const supported = /\.(json|html|txt|md)$/iu;
  const multimodal = /\.(pdf|png|jpg|jpeg|webp|xlsx|csv|docx)$/iu;
  const unsupported = 'Este formato no se puede incorporar. Selecciona la página de resultado (.html), un ZIP o un texto con el resultado. Conserva Word y PDF como anexos.';
  const VARIANT_LABELS = { juridica: 'jurídica', 'retencion-documental': 'retención documental' };

  // Recorta la página aunque el chat la entregue entre vallas de código o con texto alrededor.
  function extractHtml(text) {
    const source = String(text);
    const start = source.search(/<!doctype\s+html\b|<html\b/iu);
    if (start < 0) return null;
    const end = source.toLowerCase().lastIndexOf('</html>');
    return end < start ? null : source.slice(start, end + 7);
  }

  function labelFromName(name) {
    const base = String(name).split('/').pop().trim();
    const match = base.match(/^resultado-(reto-(\d+)|reto-integrador|prueba-individual|mg-a0\d|variante-([a-z0-9-]+))\.(?:html|json|md|txt)$/iu);
    if (!match) return null;
    if (match[2] !== undefined) return `Reto ${Number(match[2])}`;
    if (match[3]) return `Variante ${VARIANT_LABELS[match[3]] || match[3].replace(/-/gu, ' ')}`;
    const id = match[1].toLowerCase();
    return id === 'reto-integrador' ? 'Integrador' : id === 'prueba-individual' ? 'Prueba individual' : 'Cierre del módulo';
  }

  // Une resultados de retos distintos de una misma evidencia; un reto repetido o una respuesta en conflicto se explican.
  function combineResults(valid, artifact) {
    const labels = valid.map(entry => labelFromName(entry.source));
    const seen = new Map();
    valid.forEach((entry, index) => {
      const label = labels[index];
      if (!label) throw new Error('Hay varias versiones para esta evidencia. Elige un solo archivo de resultado o conserva los nombres resultado-reto-N.html que entrega la IA.');
      if (seen.has(label)) throw new Error(`Hay dos versiones ${/^(Prueba|Variante)/u.test(label) ? 'de la' : 'del'} ${label}: ${seen.get(label)} y ${entry.source}. Elige una y vuelve a seleccionar los archivos.`);
      seen.set(label, entry.source);
    });
    const fields = {}, owner = {}, tools = [];
    let product = null;
    valid.forEach((entry, index) => {
      Object.entries(entry.result.fields).forEach(([key, value]) => {
        if (model.CUMULATIVE_FIELDS.includes(key)) {
          fields[key] = model.mergeCumulativeField(fields[key], value, labels[index]);
          return;
        }
        if (key in fields && fields[key] !== value) {
          const field = artifact.fields.find(item => item.key === key);
          throw new Error(`${owner[key]} y ${labels[index]} traen respuestas distintas para «${field ? field.label : key}». Selecciona solo uno de esos dos resultados.`);
        }
        fields[key] = value;
        owner[key] = labels[index];
      });
      if (!tools.includes(entry.result.tool)) tools.push(entry.result.tool);
      product = product || entry.result.elaboratedProduct || null;
    });
    const result = { artifactId: artifact.id, fields, tool: tools.join(' · ') };
    if (product) result.elaboratedProduct = product;
    return { result, source: valid.map(entry => entry.source).join(', ') };
  }

  function readFile(file, win, binary = false) {
    return new Promise((resolve, reject) => {
      let timer;
      const fail = () => {
        clearTimeout(timer);
        reject(new Error('No se pudo leer el archivo. Comprueba que esté descargado y cerrado en otras aplicaciones; vuelve a seleccionarlo.'));
      };
      try {
        const reader = new win.FileReader();
        reader.onload = () => { clearTimeout(timer); resolve(binary ? reader.result : String(reader.result)); };
        reader.onerror = fail;
        reader.onabort = () => { clearTimeout(timer); reject(new Error('La lectura se canceló. Vuelve a seleccionar el archivo.')); };
        timer = setTimeout(() => {
          reject(new Error('La lectura tardó más de 30 segundos. Descarga el archivo en el computador y vuelve a seleccionarlo.'));
          reader.abort();
        }, 30000);
        if (binary) reader.readAsArrayBuffer(file);
        else reader.readAsText(file, 'UTF-8');
      } catch (_) { fail(); }
    });
  }

  function parseText(text, artifact, win, sourceName = '') {
    const start = text.trimStart();
    const page = /^(?:<!doctype\s+html\b|<html\b)/iu.test(start) ? start : extractHtml(text);
    if (page) {
      const document = new win.DOMParser().parseFromString(page, 'text/html');
      const blocks = document.querySelectorAll('script#devbrain-evidence-result[type="application/json"]');
      if (blocks.length !== 1 || !blocks[0].textContent.trim()) {
        const where = /(^|\/)resultado-pegado\.txt$/u.test(sourceName) ? 'el texto pegado' : sourceName ? sourceName.split('/').pop().trim() : 'la página';
        throw new Error(`No se encontró el resultado de ${artifact.id} dentro de ${where}. Pide a la IA: «Agrega al final de la página el bloque de datos que indica el encargo y entrégame la página completa».`);
      }
      return model.validateResult(blocks[0].textContent, artifact);
    }
    const blocks = [...text.matchAll(/^```(?:json)?[^\S\r\n]*\r?\n([\s\S]*?)^```[^\S\r\n]*$/gimu)];
    if (blocks.length > 1) throw new Error('El texto trae varios bloques de datos. Pide a la IA un solo bloque con el resultado.');
    const source = blocks.length ? blocks[0][1] : text;
    const trimmed = source.replace(/^\uFEFF/, '').trim();
    let data;
    try { data = JSON.parse(trimmed); } catch (_) { /* Si no es JSON, se evalúa según extensión o parser tolerante. */ }
    if (data?.schemaVersion === undefined && data?.backup?.evidencias) {
      const record = data.backup.evidencias[artifact.id];
      if (!record) throw new Error(`El respaldo no contiene ${artifact.id}. Elige un respaldo de este módulo.`);
      return model.validateResult(JSON.stringify({ schemaVersion: 1, artifactId: artifact.id, fields: record.values, tool: 'Respaldo del portafolio' }), artifact);
    }
    const isJsonExt = /\.json$/iu.test(sourceName) || blocks.length === 1 || trimmed.startsWith('{') || trimmed.startsWith('[');
    if (isJsonExt || data !== undefined) {
      return model.validateResult(source, artifact);
    }
    return model.parseTolerantResult(source, artifact);
  }

  function buildMultimodalResult(file, rawText, artifact) {
    const extMatch = file.name.match(/\.([a-z0-9]+)$/iu);
    const format = extMatch ? extMatch[1].toLowerCase() : 'archivo';
    const trimmed = String(rawText || '').trim();
    if (!file.size || (file.size <= 12 && /^(?:PDF|Texto|No es JSON)$/u.test(trimmed))) {
      throw new Error(unsupported);
    }
    const elaboratedProduct = {
      kind: 'file',
      name: file.name,
      format,
      size: file.size || trimmed.length,
      mimeType: file.type || 'application/octet-stream',
      registeredAt: new Date().toISOString()
    };
    let fields = {};
    if (format === 'csv' && trimmed.length >= 20) {
      try {
        fields = model.parseTolerantResult(trimmed, artifact).fields;
      } catch (_) { /* Usa resumen por defecto */ }
    }
    if (!Object.keys(fields).length) {
      const targetKey = artifact.fields[0].key;
      fields[targetKey] = `Producto elaborado adjunto: ${file.name} (${format.toUpperCase()}, ${elaboratedProduct.size} bytes). Revisión humana pendiente.`;
    }
    return {
      artifactId: artifact.id,
      fields,
      tool: `Producto elaborado (${format.toUpperCase()})`,
      elaboratedProduct
    };
  }

  function registerCanvaLink(url, artifact) {
    if (!model.isValidCanvaUrl(url)) {
      throw new Error('Ingresa un enlace válido de Canva (por ejemplo: https://www.canva.com/design/...).');
    }
    const cleanUrl = url.trim();
    const elaboratedProduct = {
      kind: 'canva_link',
      name: 'Diseño elaborado en Canva',
      url: cleanUrl,
      format: 'canva',
      registeredAt: new Date().toISOString()
    };
    const targetKey = artifact.fields[0].key;
    return {
      artifactId: artifact.id,
      fields: { [targetKey]: `Diseño en Canva registrado: ${cleanUrl}. Revisión humana pendiente.` },
      tool: 'Canva con IA',
      elaboratedProduct
    };
  }

  async function importSelection(selection, artifact, win) {
    const files = Array.from(selection);
    if (!files.length) throw new Error('Selecciona un archivo o una carpeta que contenga el resultado de la IA.');
    if (files.length > 500) throw new Error('La selección supera 500 archivos. Selecciona una carpeta más pequeña o solo la página de resultado.');
    let total = 0, count = 0;
    const hasPrimary = files.some(f => supported.test(f.name) || /\.zip$/iu.test(f.name));
    for (const file of files) {
      if (/\.zip$/iu.test(file.name)) {
        if (file.size > 20971520) throw new Error('El ZIP supera 20 MB. Extrae la entrega y selecciona solo la página de resultado.');
      } else if (supported.test(file.name)) {
        if (file.size > 1048576) throw new Error('El archivo supera 1 MB. Pide a la IA un resultado más breve.');
        total += file.size;
      } else if (!hasPrimary && multimodal.test(file.name)) {
        if (file.size > 20971520) throw new Error('El archivo elaborado supera 20 MB. Comprime o exporta una versión más liviana.');
        total += file.size;
      }
    }
    if (hasPrimary && total > 5242880) throw new Error('Los resultados seleccionados superan 5 MB. Selecciona solo el resultado que necesitas.');

    if (!hasPrimary && files.length === 1 && multimodal.test(files[0].name)) {
      const file = files[0];
      const text = await readFile(file, win, false);
      return {
        result: buildMultimodalResult(file, text, artifact),
        source: file.webkitRelativePath || file.name,
        ignored: 0
      };
    }

    const candidates = [];
    for (const file of files) {
      const name = file.webkitRelativePath || file.name;
      if (/\.zip$/iu.test(file.name)) {
        const unpacked = archive.unpack(await readFile(file, win, true), name);
        count += unpacked.count;
        total += unpacked.size;
        if (total > 5242880) throw new Error('Los resultados seleccionados superan 5 MB. Selecciona solo el resultado que necesitas.');
        candidates.push(...unpacked.files);
      } else {
        count += 1;
        if (supported.test(file.name) && !/(^|\/)\.|^__MACOSX\//u.test(name)) candidates.push({ name, text: await readFile(file, win) });
      }
      if (count > 500) throw new Error('La selección supera 500 archivos. Selecciona una carpeta más pequeña o solo la página de resultado.');
    }
    // Si hay páginas resultado-*.html, la guía y el encargo del paquete no compiten con ellas.
    const pages = candidates.filter(entry => /(?:^|[/\s])resultado[^/]*\.html$/iu.test(entry.name));
    const valid = [], errors = [];
    for (const entry of pages.length ? pages : candidates) {
      try {
        if (!entry.text.trim()) throw new Error('El archivo está vacío. Descarga de nuevo el resultado generado por la IA.');
        valid.push({ result: parseText(entry.text, artifact, win, entry.name), source: entry.name });
      } catch (error) { errors.push(error); }
    }
    if (valid.length > 1) return { ...combineResults(valid, artifact), ignored: count - valid.length };
    if (!valid.length) {
      if (errors.length === 1) throw errors[0];
      if (files.length === 1 && !supported.test(files[0].name) && !/\.zip$/iu.test(files[0].name)) throw new Error(unsupported);
      throw new Error(`No se encontró un resultado válido para ${artifact.id}. Selecciona la página de resultado que generó la IA; los anexos no reemplazan las respuestas.`);
    }
    const label = labelFromName(valid[0].source);
    if (label) valid[0].result.label = label;
    return { ...valid[0], ignored: count - 1 };
  }
  return { readFile, extractHtml, labelFromName, combineResults, parseText, buildMultimodalResult, registerCanvaLink, importSelection };
});
