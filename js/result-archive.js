/* Abre ZIP en memoria y limita su contenido antes de descomprimirlo. */
(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('fflate') : root.fflate);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ResultArchive = api;
})(typeof window === 'undefined' ? null : window, function (zip) {
  'use strict';
    const invalid = 'No se pudo abrir el ZIP. Puede estar dañado, tener contraseña o usar una compresión incompatible. Extrae su contenido y selecciona resultado.html o resultado.json, según el encargo.';

  function checksum(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function unpack(buffer, name) {
    if (!zip) throw new Error('No se cargó el lector de ZIP. Recarga la página o extrae el archivo y selecciona resultado.html o resultado.json, según el encargo.');
    const bytes = new Uint8Array(buffer);
    const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const candidates = new Map();
    let count = 0, total = 0;
    try {
      let end = bytes.length - 22;
      while (end >= Math.max(0, bytes.length - 65557) && (data.getUint32(end, true) !== 0x06054b50 || end + 22 + data.getUint16(end + 20, true) !== bytes.length)) end -= 1;
      if (end < 0 || data.getUint32(end, true) !== 0x06054b50 || data.getUint16(end + 4, true) || data.getUint16(end + 6, true)) throw new Error(invalid);
      let offset = data.getUint32(end + 16, true);
      // La biblioteca interpreta nombres y tamaños; esta pasada solo inspecciona, sin extraer.
      zip.unzipSync(bytes, {filter(entry) {
        if (++count > 500) throw new Error('El ZIP contiene más de 500 entradas. Divide la entrega en paquetes más pequeños.');
        if (data.getUint32(offset, true) !== 0x02014b50) throw new Error(invalid);
        const flags = data.getUint16(offset + 8, true);
        const crc = data.getUint32(offset + 16, true);
        offset += 46 + data.getUint16(offset + 28, true) + data.getUint16(offset + 30, true) + data.getUint16(offset + 32, true);
        if (!/\.(json|txt|md)$/iu.test(entry.name) || /(^|\/)\.|^__MACOSX\//u.test(entry.name)) return false;
        if (flags & 1 || entry.compression !== 0 && entry.compression !== 8) throw new Error(invalid);
        if (entry.originalSize > 1048576) throw new Error('Un resultado dentro del ZIP supera 1 MB. Pide a la IA un archivo más breve.');
        total += entry.originalSize;
        if (total > 5242880) throw new Error('Los resultados del ZIP superan 5 MB sin comprimir. Selecciona solo el resultado que necesitas.');
        if (candidates.has(entry.name)) throw new Error('El ZIP contiene nombres de archivo repetidos. Extrae la entrega y elige una sola versión.');
        candidates.set(entry.name, {crc, size:entry.originalSize});
        return false;
      }});
      const extracted = zip.unzipSync(bytes, {filter:entry => candidates.has(entry.name)});
      const files = Object.entries(extracted).map(([path, content]) => {
        const metadata = candidates.get(path);
        if (content.length !== metadata.size || checksum(content) !== metadata.crc) throw new Error(invalid);
        return {name:name + ' / ' + path, text:zip.strFromU8(content)};
      });
      return {files, count, size:total};
    } catch (error) {
      if (error instanceof Error && /^(El ZIP|Un resultado|Los resultados|No se pudo abrir)/u.test(error.message)) throw error;
      throw new Error(invalid);
    }
  }
  return {unpack};
});
