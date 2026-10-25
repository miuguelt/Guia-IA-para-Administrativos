# Arquitectura del aula de IA

## Fuentes y compilación

El curso es una web estática. `index.html` se genera desde `content/` con `py scripts/build-course.py` (Python y beautifulsoup4). Se conserva HTML completo para lectura sin JavaScript. La compilación no descarga recursos ni necesita un servidor.

- `content/shell.html`: navegación, cabecera y puntos de integración.
- `content/home.html`, `preparation.html`, `calendar.html`, `portfolio.html`: vistas de orientación.
- `content/lessons/`: contenido pedagógico de los cinco módulos de aplicación.
- `content/productivity/`: apoyos de los seis módulos para selección de tareas, revisión de archivos, corrección, reutilización y medición. El constructor los incorpora desde una sola fuente; sus esquemas están en `media/productividad-*.svg` y sus estilos en `css/productivity.css`.
- `scripts/build-course.py`: distribuye cada lección entre Aprende, Observa, Resuelve y Documenta. Conserva los diez retos breves, el integrador y los cinco puntos de montaje curriculares; agrega dos productos complementarios.
- `scripts/course_guidance.py`: compone la entrada breve, el mapa de retos y las cuatro etapas de cada práctica desde `content/module-orientation.json`, `content/orientation/` y `content/challenge-guidance.json`. Recibe los nodos originales del constructor y los distribuye sin eliminar consignas ni criterios.
- `js/challenge-guide.js`: controla la etapa visible y el acceso desde el mapa. Recuerda únicamente la etapa abierta en `sessionStorage`; el SDK conserva la responsabilidad de guardar evidencias y calcular el avance. Sin JavaScript se pueden leer todas las etapas.
- `scripts/build-styled-documents.py`, `scripts/document_download_styles.py`: publican las lecturas imprimibles en `docs/lectura/` y aplican formato a Word y Excel. Las firmas de contenido y la comparación binaria comprueban conservación e idempotencia. No modifican el PDF curricular oficial.
- `scripts/lab_document_pdfs.py`: construye las dos guías PDF locales del laboratorio desde las fuentes editables. La compilación genera los documentos antes de armar los paquetes de análisis; no depende de scripts temporales de `output/`.
- `css/course-shell.css`, `course-learning.css`, `tool-lab.css`, `course-responsive.css`: apariencia por responsabilidad.
- `content/case-practices.json` y `scripts/course_practices.py`: casos, decisiones y extractos de filas originales. El constructor produce controles, datos de evaluación y referencias desde la misma definición.
- `js/case-practices-model.js`, `case-practices-store.js`, `case-practices-view.js` y `case-practices.js`: evaluación pura, guardado verificado, presentación y plugin del SDK. Cada caso usa una clave independiente con versión y revisión; una revisión incompatible reinicia solo esa práctica.
- `media/`: esquemas e ilustraciones de apoyo. Los cinco MP4 y sus carteles se retiraron al sustituirse por prácticas.

Seis módulos formativos se presentan en once vistas: inicio, preparación, cinco módulos, cronograma, EcoBogotá, laboratorio de datos y portafolio. EcoBogotá y el laboratorio de datos son complementos opcionales. Preparación usa 60 min del martes; los cinco módulos restantes suman 2100 min. Total: 2160 min directos y 240 autónomos.

El laboratorio vive en `content/analisis-datos/`. El constructor incrusta sus cuatro CSV principales como JSON seguro para funcionar sin red. `analysis-lab-model.js` prepara series, exclusiones, duplicados, escalas y exportaciones; `analysis-lab.js` dibuja SVG y tablas paginadas cuando se abre el laboratorio. El SDK conserva la navegación y el producto opcional LAB-A01. El adaptador del curso resuelve anclas internas y cuenta solo MG-A01 a MG-A05 para el avance curricular.

`materiales/analisis-datos/codigo/analysis_data.py` valida fuentes y hashes, reproduce transformaciones y genera figuras con Matplotlib. `scripts/build-analysis-materials.py` crea cinco ZIP deterministas. Los cuadernos incluyen los cuatro conjuntos básicos para ejecutar la validación sin conexión. Las pruebas verifican datos, paquetes, cuadernos, navegación y cobertura de todas las funciones de producción añadidas.

## Navegación y datos

`js/course-app.js` entrega los contenedores reales de vistas y menú a `DevBrainSDK.createApp`. El SDK administra navegación, almacenamiento y evidencias. `js/course-tabs.js` organiza las pestañas y su acceso por teclado; no implementa simuladores, calificaciones ni puntos.

Los cinco simuladores de resultados del laboratorio se registran como un único plugin `analysis-result` en `app.simulators`. El modelo `analysis-results-model.js` calcula sobre los CSV incluidos, reutiliza la validación numérica, la agrupación de estrellas y los histogramas de `analysis-lab-model.js`, y entrega tablas sin redondear. `analysis-results-view.js` presenta las métricas, las barras y la tabla; `analysis-results.js` conecta los formularios y la descarga. La matriz documental procede de `documentos/ejemplo-verificado.csv` y se incorpora con el generador de la web. Los simuladores no escriben en las evidencias ni califican al aprendiz. Las pruebas de modelo, interfaz e integración con el SDK forman parte de `npm test` y de la compuerta general de cobertura de funciones en CI.

El adaptador de almacenamiento del SDK conserva la última lección y pestaña. Visitar una sección no acredita aprendizaje. Los enlaces del calendario abren el reto; los del portafolio abren «Guarda tu evidencia», incluidos los que genera el SDK. Una URL desconocida vuelve a inicio.

El prefijo de evidencias se mantiene en `sena_bogota_ia_administrativos_21720210` para conservar borradores previos. El perfil, campos y autochequeos se guardan solo en el navegador. El portafolio y el juicio formal siguen a cargo del SDK y del instructor.

`deliverables.registry.json` es la fuente de campos y criterios. Después de editarla, regenerar `js/registro-entregables.js` con el script canónico `Publish-GuideEvidenceRegistry.ps1 -Path . -Apply`; el nombre del comando corresponde al empaquetado local, no a publicación remota. No editar la copia JavaScript a mano.

`content/ai-task-briefs.json` define 28 encargos completos para chat e IDE. `scripts/build-ai-task-kits.py` publica fuentes permitidas, modelo, esquema JSON y encargos descargables. `scripts/course_delivery.py` genera sus controles de copia y la recepción de resultados. La fuente común del semáforo contiene descripciones seguras; las tarjetas originales se consultan localmente con el instructor.

Documenta recibe únicamente un archivo JSON de hasta 1 MB. `ai-result-model.js` valida versión, evidencia, claves y límites; `ai-delivery-view.js` muestra el contenido mediante texto seguro. Leer no guarda. `ai-delivery.js` conecta la selección, vista previa, guardado y descarga. `ai-result-store.js` reúne respuestas parciales, invalida los criterios previos y verifica el guardado mediante el almacén real del SDK. Los montajes originales siguen presentes en un contenedor oculto, sin modificar el proveedor ni duplicar el almacenamiento. Los puentes de los retos enfocan el selector de archivos.

La confirmación del aprendiz es explícita y solo se habilita cuando están las respuestas requeridas; no realiza una evaluación del contenido. El portafolio explica las diferencias pendientes en los datos del SDK antes de la exportación. Los casos de `materiales/validacion/` y su registro vacío sirven para observar comprensión; el Dockerfile los incluye junto con las fuentes de los retos.

## Verificación

Antes de editar textos, consulte la [guía editorial de español de Colombia](../estilo-redaccion-es-co.md). El archivo `AGENTS.md` local la recuerda, pero DevBrain lo excluye del control de versiones; esta guía editorial y las pruebas sí forman parte del proyecto.

`npm ci --ignore-scripts` instala las dependencias de prueba; `npm test` ejecuta integración del DOM con el SDK local mediante JSDOM, datos, materiales, pedagogía y redacción. Comprueba montaje, navegación, teclado, enlaces profundos, regreso desde el portafolio, conservación de borradores, coincidencia del registro y datos curriculares. `npm run check:redaccion` revisa las fuentes editables; `npm run test:coverage:all` exige 100 % de funciones de los JavaScript directos de `js/` y del verificador editorial. La suite atribuye explícitamente los archivos ejecutados dentro de JSDOM para evitar omisiones en la medición. La revisión automática no sustituye la lectura editorial ni la inspección visual en un navegador.

Antes de publicar, ejecutar `Test-DevBrainEducationalGuide.ps1 -Path . -Strict` y `Test-GuideDeliverables.ps1 -Path . -Strict`. Antes de cualquier commit, ejecutar el validador canónico del workspace y revisar los cambios preparados.

La vista previa utiliza el puerto declarado en el manifiesto y el arranque autorizado del proyecto. No crear servidores alternos ni modificar servicios compartidos para suplir una vista previa averiada.

## Seguimiento de prácticas

El plugin `case-practice` se registra junto con `analysis-result` antes de inicializar el registro de simuladores. Usa `app.storage`; las claves `case_practice_<módulo>` permanecen en el espacio del SDK. El estado conserva etapa, respuestas, número de intentos, ayudas y selecciones de las herramientas. La corrección se recalcula desde la definición vigente; no se confía en una marca de acierto guardada. La revisión efectiva se calcula con SHA-256 sobre la definición, las preguntas de cierre y los extractos originales: un cambio invalida únicamente los intentos del caso afectado. Cada escritura se comprueba con una lectura porque el adaptador del SDK captura internamente los fallos del navegador. Un fallo mantiene el trabajo en memoria y muestra un aviso.

Las prácticas no escriben en los montajes de evidencias. Sus controles de transferencia se retiraron de los comparadores integrados. «Mi avance» muestra un resumen independiente que no interviene en el porcentaje curricular. La eliminación general incluye las prácticas mediante el prefijo existente. Las fuentes, las cuatro etapas y las soluciones están en el HTML estático; JavaScript organiza las etapas. La impresión muestra las etapas juntas.

La compilación habitual publica lecturas HTML y paquetes; el comando `build:documents` aplica el formato de documentos y regenera los PDF únicamente cuando se solicita.
