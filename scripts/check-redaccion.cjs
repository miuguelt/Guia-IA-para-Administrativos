/* Revisión determinista de la prosa editable; la lectura editorial sigue siendo necesaria. */
const fs = require('node:fs');
const path = require('node:path');

const reglas = [
  { id: 'rotulo-comprobacion', patron: /\bcomprobacion:\s*comprobacion\./gu, sugerencia: 'Conserve la clave comprobacion y escriba el rótulo «Comprobación» con tilde.' },
  { id: 'evaluacion-practica', patron: /\bEsta práctica no aprueba una evidencia\b/giu, sugerencia: 'Explique que la práctica prepara al aprendiz y que el instructor evalúa la evidencia.' },
  { id: 'encabezado-incompleto', patron: /\bLO ESENCIA\+/gu, sugerencia: 'Complete el encabezado: «Lo esencial».' },
  { id: 'pulsar', patron: /\bpuls(?:e|a|ar|en)\s+(?:el|la|los|las|un|una)\s+(?:bot[oó]n|tecla|enlace)\b/giu, sugerencia: 'Use «haga clic», «oprima» o «seleccione», según la acción.' },
  { id: 'ordenador', patron: /\bordenador(?:es)?\b/giu, sugerencia: 'Use «computador» o «equipo».' },
  { id: 'en-base-a', patron: /\ben base a\b/giu, sugerencia: 'Use «con base en» o «según».' },
  { id: 'hacer-click', patron: /\b(?:haga|hacer|haz)\s+click\b|\bclickear\b/giu, sugerencia: 'Use «haga clic» o «haz clic».' },
  { id: 'dossier', patron: /\bdossier\b/giu, sugerencia: 'Use «portafolio de evidencias» o «expediente», según el contexto.' },
  { id: 'checar', patron: /\bchec(?:ar|a|ando|o)\b/giu, sugerencia: 'Use «revisar» o «verificar».' },
  { id: 'computadora', patron: /\bcomputadora(?:s)?\b/giu, sugerencia: 'Use «computador».' },
  { id: 'fichero', patron: /\bfichero(?:s)?\b/giu, sugerencia: 'Use «archivo».' },
  { id: 'retos-incompletos', patron: /\b(?:nueve|9)\s+retos\s+breves\b/giu, sugerencia: 'La ruta actual contiene diez retos breves (0 a 9).' },
  { id: 'promesa-absoluta', patron: /\b(?:la\s+)?herramienta\s+definitiva\b|\bcero\s+alucinaciones\b|\bsin\s+un\s+solo\s+error\b|\bahorro\s+del\s+\d+\s*%|\b100\s*%\s*(?:citad[oa]s?|verificables)\b/giu, sugerencia: 'Sustituya la promesa por una capacidad comprobable y sus límites.' },
];

function analizarTexto(texto, archivo) {
  const hallazgos = [];
  texto.split(/\r?\n/u).forEach((linea, indice) => {
    const prosa = linea
      .replace(/`[^`]*`/gu, ' ')
      .replace(/<[^>]*>/gu, ' ')
      .replace(/https?:\/\/\S+/gu, ' ')
      .replace(/\bdata-db-evidence-dossier\b/gu, ' ')
      .replace(/\b[\w.-]+\.(?:docx|xlsx|pdf|json|js|html|md)\b/giu, ' ');
    for (const regla of reglas) {
      regla.patron.lastIndex = 0;
      for (const coincidencia of prosa.matchAll(regla.patron)) {
        hallazgos.push({ archivo, linea: indice + 1, columna: coincidencia.index + 1, regla: regla.id, sugerencia: regla.sugerencia });
      }
    }
  });
  return hallazgos.sort((a, b) => a.linea - b.linea || a.columna - b.columna);
}

function listarArchivos(directorio, extensiones) {
  if (!fs.existsSync(directorio)) return [];
  return fs.readdirSync(directorio, { withFileTypes: true }).flatMap(entrada => {
    const archivo = path.join(directorio, entrada.name);
    if (entrada.isDirectory()) return listarArchivos(archivo, extensiones);
    return extensiones.has(path.extname(entrada.name)) ? [archivo] : [];
  });
}

function revisarProyecto(raiz) {
  const archivos = [
    ...listarArchivos(path.join(raiz, 'content'), new Set(['.html', '.json'])),
    ...listarArchivos(path.join(raiz, 'docs'), new Set(['.md'])),
    ...['cartilla.txt', 'guia_facilitador.txt', 'materiales.txt', 'guide.manifest.json', 'deliverables.registry.json']
      .map(nombre => path.join(raiz, nombre)),
    ...listarArchivos(path.join(raiz, 'js'), new Set(['.js']))
      .filter(archivo => !path.relative(path.join(raiz, 'js'), archivo).split(path.sep).includes('vendor')
        && path.basename(archivo) !== 'registro-entregables.js'),
    ...listarArchivos(path.join(raiz, 'scripts'), new Set(['.py'])),
    ...['validacion', 'analisis-datos'].flatMap(nombre =>
      listarArchivos(path.join(raiz, 'materiales', nombre), new Set(['.md']))),
  ];
  return archivos.flatMap(archivo => analizarTexto(fs.readFileSync(archivo, 'utf8'), path.relative(raiz, archivo).replaceAll('\\', '/')));
}

function main(hallazgos = revisarProyecto(path.resolve(__dirname, '..')), salida = process.stdout, errores = process.stderr) {
  for (const h of hallazgos) errores.write(`${h.archivo}:${h.linea}: ${h.regla}. ${h.sugerencia}\n`);
  if (hallazgos.length) return 1;
  salida.write('Redacción: sin expresiones bloqueadas en las fuentes editables.\n');
  return 0;
}

module.exports = { analizarTexto, revisarProyecto, main };
if (require.main === module) process.exitCode = main();
