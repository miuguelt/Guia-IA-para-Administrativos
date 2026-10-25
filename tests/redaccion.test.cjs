const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { analizarTexto, revisarProyecto, main } = require('../scripts/check-redaccion.cjs');

test('detecta regionalismos, anglicismos innecesarios y frases confusas', () => {
  const hallazgos = analizarTexto('Pulse el botón del ordenador. En base a ello, haga click para ver el dossier.', 'ejemplo.md');
  assert.deepEqual(hallazgos.map(h => h.regla), ['pulsar', 'ordenador', 'en-base-a', 'hacer-click', 'dossier']);
  assert.ok(hallazgos.every(h => h.archivo === 'ejemplo.md' && h.linea === 1 && h.sugerencia));
});

test('distingue el imperativo practica del sustantivo práctica y detecta mensajes ambiguos comprobados', () => {
  assert.deepEqual(analizarTexto('Practica con un caso. Esta práctica te ayuda a prepararte. Comprueba qué falta y cómo continuar.', 'ejemplo.md'), []);
  assert.deepEqual(analizarTexto('Esta práctica no aprueba una evidencia. LO ESENCIA+', 'ejemplo.md').map(item => item.regla), ['evaluacion-practica', 'encabezado-incompleto']);
});

test('revisa la tilde del rótulo Comprobación y conserva la clave técnica comprobacion', () => {
  assert.equal(analizarTexto('- comprobacion: comprobacion. Genera esta sección.', 'encargo.json')[0]?.regla, 'rotulo-comprobacion');
  assert.deepEqual(analizarTexto('- comprobacion: Comprobación. Genera esta sección. Usa la clave `comprobacion`.', 'encargo.json'), []);
});

test('incluye mensajes de todos los scripts propios y materiales mantenidos sin recorrer proveedores', () => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'redaccion-guia-'));
  try {
    for (const carpeta of ['content', 'docs', 'js/vendor', 'scripts', 'materiales/validacion']) fs.mkdirSync(path.join(raiz, carpeta), { recursive: true });
    for (const nombre of ['cartilla.txt', 'guia_facilitador.txt', 'materiales.txt', 'guide.manifest.json', 'deliverables.registry.json']) fs.writeFileSync(path.join(raiz, nombre), 'Texto de prueba.');
    fs.writeFileSync(path.join(raiz, 'js/result-import.js'), "const mensaje = 'Haga click aquí';");
    fs.writeFileSync(path.join(raiz, 'js/vendor/externo.js'), 'El ordenador.');
    fs.writeFileSync(path.join(raiz, 'scripts/course_delivery.py'), "mensaje = 'El ordenador está listo'");
    fs.writeFileSync(path.join(raiz, 'materiales/validacion/casos.md'), 'Checar los datos.');
    assert.deepEqual(revisarProyecto(raiz).map(item => item.regla).sort(), ['checar', 'hacer-click', 'ordenador']);
  } finally {
    assert.ok(path.basename(raiz).startsWith('redaccion-guia-'));
    fs.rmSync(raiz, { recursive: true, force: true });
  }
});

test('respeta identificadores técnicos, rutas y nombres de archivos citados', () => {
  const texto = 'Use `data-db-evidence-dossier`, `dossierHref` y `Guia_facilitador_IA_SENA_Bogota.docx`.\n' +
    'Escriba «portafolio de evidencias» y haga clic en el botón.';
  assert.deepEqual(analizarTexto(texto, 'ejemplo.md'), []);
});

test('indica la línea de un hallazgo en texto HTML o Markdown', () => {
  const hallazgos = analizarTexto('<p>Abra el archivo.</p>\n<p>Checar los datos.</p>', 'vista.html');
  assert.equal(hallazgos.length, 1);
  assert.equal(hallazgos[0].linea, 2);
  assert.equal(hallazgos[0].regla, 'checar');
});

test('señala promesas absolutas que requieren evidencia', () => {
  const hallazgos = analizarTexto('La herramienta definitiva ofrece cero alucinaciones y un ahorro del 80%.', 'historia.md');
  assert.deepEqual(hallazgos.map(h => h.regla), ['promesa-absoluta', 'promesa-absoluta', 'promesa-absoluta']);
});

test('revisa las fuentes actuales de la guía y mantiene datos curriculares coherentes', () => {
  const raiz = path.resolve(__dirname, '..');
  const hallazgos = revisarProyecto(raiz);
  assert.deepEqual(hallazgos, []);
  const instrumentos = fs.readFileSync(path.join(raiz, 'docs/instrumentos-evaluacion.md'), 'utf8');
  const preparacion = fs.readFileSync(path.join(raiz, 'docs/herramientas-y-preparacion.md'), 'utf8');
  const cronograma = fs.readFileSync(path.join(raiz, 'docs/cronograma-detallado.md'), 'utf8');
  const validacion = fs.readFileSync(path.join(raiz, 'docs/04-validacion.md'), 'utf8');
  const manifiesto = JSON.parse(fs.readFileSync(path.join(raiz, 'guide.manifest.json'), 'utf8'));
  assert.match(instrumentos, /diez retos breves y el integrador/iu);
  assert.match(instrumentos, /\| 7 · Diseña el flujo/iu);
  assert.match(instrumentos, /\| 2 · PQRS \|[^\n]*dos borradores/iu);
  assert.match(preparacion, /Servicio Nacional de Aprendizaje \(SENA\) a nivel nacional/iu);
  assert.match(cronograma, /R4 150 \+ R5 150 \+ R6 120 \+ R7 60 = 480/iu);
  assert.match(cronograma, /R8 120 \+ R9 60 \+ integrador en equipo 240 = 420/iu);
  assert.match(cronograma, /\| 04 · Verifica lo que obtienes \| 210 \|/iu);
  assert.match(cronograma, /\| 05 · Presenta una mejora \| 330 \|/iu);
  assert.match(validacion, /120 min.*60 min/iu);
  assert.match(manifiesto.sources.find(fuente => fuente.title.startsWith('Cartilla de retos')).use, /siete retos/iu);
});

test('la orden informa éxito o falla con archivo y línea', () => {
  const salida = [];
  const errores = [];
  const out = { write: texto => salida.push(texto) };
  const err = { write: texto => errores.push(texto) };
  assert.equal(main([], out, err), 0);
  assert.match(salida.join(''), /sin expresiones bloqueadas/iu);
  assert.equal(main([{ archivo: 'ejemplo.md', linea: 2, regla: 'fichero', sugerencia: 'Use «archivo».' }], out, err), 1);
  assert.match(errores.join(''), /ejemplo\.md:2: fichero/iu);
});

test('las instrucciones del portafolio mantienen el tratamiento de tú', () => {
  const raiz = path.resolve(__dirname, '..');
  const registro = JSON.parse(fs.readFileSync(path.join(raiz, 'deliverables.registry.json'), 'utf8'));
  const textos = registro.artifacts.flatMap(artefacto => [
    artefacto.instructions,
    artefacto.nextStep,
    ...artefacto.fields.map(campo => campo.hint),
  ]).filter(Boolean);
  assert.equal(textos.filter(texto => /\b(?:siga|complete|indique|registre|diseñe|use|pruebe|separe|defina|extraiga|resuma|marque|anote|elija|justifique|contraste|clasifique|preserve|describa|incluya|compruebe|entregue|consolide|vincule|continúe)\b/iu.test(texto)).length, 0);
});

test('la guía editorial define un tono profesional, natural y sin frases forzadas', () => {
  const raiz = path.resolve(__dirname, '..');
  const guia = fs.readFileSync(path.join(raiz, 'docs/estilo-redaccion-es-co.md'), 'utf8');
  assert.match(guia, /profesional, respetuosa y cercana/iu);
  assert.match(guia, /natural y fácil de seguir/iu);
  assert.match(guia, /coloquialismos forzados/iu);
  assert.match(guia, /conservar la intención, los hechos y el nivel de certeza/iu);
});

test('incluye textos de scripts propios sin confundir selectores técnicos', () => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'redaccion-guia-'));
  try {
    for (const carpeta of ['content', 'docs', 'js', 'scripts']) fs.mkdirSync(path.join(raiz, carpeta));
    for (const nombre of ['cartilla.txt', 'guia_facilitador.txt', 'materiales.txt', 'guide.manifest.json', 'deliverables.registry.json']) {
      fs.writeFileSync(path.join(raiz, nombre), 'Texto de prueba.');
    }
    fs.writeFileSync(path.join(raiz, 'js/course-app.js'), "const selector = '[data-db-evidence-dossier]'; const mensaje = 'Haga click aquí';");
    fs.writeFileSync(path.join(raiz, 'scripts/build-course.py'), "titulo = 'El ordenador está listo'");
    fs.writeFileSync(path.join(raiz, 'content/learning-paths.json'), JSON.stringify({goal: 'Checar los datos'}));
    assert.deepEqual(revisarProyecto(raiz).map(h => h.regla), ['checar', 'hacer-click', 'ordenador']);
  } finally {
    assert.ok(path.resolve(raiz).startsWith(path.resolve(os.tmpdir()) + path.sep));
    assert.ok(path.basename(raiz).startsWith('redaccion-guia-'));
    fs.rmSync(raiz, { recursive: true, force: true });
  }
});

test('la pauta editorial transforma la solicitud en contenido y evita el eco de instrucciones', () => {
  const guia = fs.readFileSync(path.resolve(__dirname, '../docs/estilo-redaccion-es-co.md'), 'utf8');
  assert.match(guia, /intención de la solicitud/iu);
  assert.match(guia, /no copies sus palabras por inercia/iu);
  assert.match(guia, /cada sección aporte información nueva/iu);
  assert.match(guia, /no cambies términos precisos solo para buscar sinónimos/iu);
  assert.match(guia, /lectura completa/iu);
});
