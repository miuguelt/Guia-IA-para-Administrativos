# Guía de IA para tareas administrativas

La web acompaña una propuesta de cohorte del Centro de Gestión Agroempresarial del Oriente (CGAO), Subsede Vélez, Regional Santander. Incluye preparación, cinco módulos de aplicación, diez retos breves, un integrador y cinco evidencias curriculares. EcoBogotá y el laboratorio de datos son complementos opcionales.

La propuesta suma 36 horas directas y cuatro autónomas. La referencia curricular indica 48 horas; la adaptación necesita validación del instructor y no acredita por sí sola el programa completo. Fechas, ambiente, cuentas y canal de entrega siguen por confirmar.

## Recorrido y materiales

La versión 1.4 ofrece el modo «Por mi cuenta» como opción inicial y conserva «Con instructor» en la barra superior. El primer recorrido permite avanzar por sesiones y completar el integrador con IND-01. El segundo conserva jornadas, equipos e instrumentos. La [revisión de autonomía](docs/revision-autonomia.md) documenta los cambios y la observación con principiantes que sigue pendiente.

El cierre «Guarda tu evidencia» también acepta el bloque JSON completo generado por el chat. El portafolio muestra cinco evidencias curriculares y permite descargar un respaldo con sus respuestas. Al recuperarlo desde un módulo, las respuestas vuelven como borrador para revisar. El porcentaje de avance usa la revisión registrada en las evidencias; las visitas y los simuladores se muestran por separado.

Abra [index.html](index.html). El aprendiz empieza en preparación y continúa por Aprende, Observa, Resuelve y Guarda tu evidencia. En cada reto descarga un paquete con su encargo y todas sus fuentes, copia el encargo al chat o a Antigravity, revisa tres puntos y descarga la página `resultado-<reto>.html`. Las fuentes y fichas de referencia siguen disponibles; no se exige transcribir respuestas ni completar formularios.

Hay 30 paquetes para IA: preparación, 11 retos, cinco evidencias de módulo, cinco laboratorios, tres rutas de EcoBogotá y cinco variantes por área. Incluyen fuentes permitidas, encargos para chat e IDE, un modelo y un esquema de salida. [Las instrucciones de MG-A02](materiales/ia/MG-A02/LEEME.html) muestran el recorrido. Los encargos piden documentos con formato y `resultado.json`; los datos, las mediciones y las autorizaciones sin evidencia quedan pendientes.

El Reto 1 incluye la solicitud urgente y la ficha del diagnóstico. Los retos 4, 5, 6 y 7 y el integrador comparten un registro de tiempos. La ficha del integrador separa la prueba individual y el trabajo de equipo. Los materiales administrativos no contienen registros reales. El laboratorio independiente utiliza datos públicos reales y documenta su procedencia.

Cada módulo comienza con una explicación breve, un esquema del método y el producto esperado. La explicación completa queda disponible en un desplegable. En «Resuelve», un mapa relaciona los retos con su evidencia. Cada reto organiza cuatro pasos: Prepara, Pide a la IA, Revisa y Recibe. La etapa abierta se recuerda durante la sesión y no modifica el avance ni el estado de la evidencia.

En «Guarda tu evidencia» se siguen tres pasos visibles y se selecciona la página `resultado-<reto>.html` que generó la IA. Las alternativas quedan en «¿Algo falló?»: un PDF o una imagen del diseño (se registra el archivo y las respuestas quedan pendientes), un ZIP, una carpeta, un pegado o un TXT, Markdown o JSON con el resultado. La lectura ocurre en el navegador. Los límites son 1 MB por resultado, 20 MB por ZIP, 5 MB entre los resultados y 500 archivos. Si hay varias versiones para la misma evidencia, se debe elegir una. Los errores de formato, lectura o tamaño se explican junto al selector y permiten volver a seleccionar el archivo.

La vista previa es de lectura; guardar conserva las otras respuestas y registra un borrador. Los errores de carga conservan lo que ya estaba guardado. Una nueva importación deja la revisión pendiente. El aprendiz confirma los criterios después de contrastarlos; esa confirmación no constituye aprobación institucional ni valoración del instructor. Los documentos y respaldos se pueden descargar sin volver a escribirlos.

La [biblioteca de documentos](docs/lectura/index.html) reúne versiones de lectura e impresión de las guías y fichas, con su fuente editable. Los Word y Excel usan formato uniforme sin cambiar textos, cifras, fórmulas ni validaciones. El PDF curricular oficial conserva su presentación de origen.

Los seis módulos incorporan apoyos para elegir tareas, verificar archivos, corregir y reutilizar instrucciones, controlar lotes y medir productos aceptados. Sus fuentes están en `content/productivity/`; cuatro esquemas SVG acompañan las decisiones principales. El [análisis de contenido e imágenes](docs/revision-productividad-ia.md) explica qué se reforzó y qué requiere observación con aprendices.

La [revisión de preparación de la guía](GUIDE_READINESS_REVIEW.md) registra comprobaciones, cambios y pendientes. La [pauta de observación con aprendices](docs/validacion-con-aprendices.md) permite comprobar comprensión y autonomía; su aplicación con personas sigue pendiente.

La [guía de cuidado de datos](docs/guia-seguridad-y-riesgos-ia.md) y el [registro de fuentes oficiales y vigencia](docs/referencias-oficiales-vigencia.md) explican los límites de uso y las referencias consultadas el 24 de octubre de 2026. El [inventario completo del proyecto](docs/inventario-proyecto.xlsx) incluye los archivos visibles, su clasificación, los hallazgos y la acción prevista; los registros y cachés se identifican como artefactos preservados.

La pauta incluye una clave separada, [seis casos con sus datos](materiales/validacion/casos-transferencia.md) y [una ficha vacía de observación](materiales/validacion/registro-observacion.csv). Estos archivos son para validar la enseñanza; no añaden retos ni evidencias al recorrido.

## Laboratorio independiente de datos y documentos

La entrada `#laboratorio-datos` ofrece una ruta inicial de 12 horas sugeridas y una ampliación opcional de 12 a 16 horas. Reúne cinco laboratorios: planetas y estrellas NASA, población internacional y pirámide DANE, clima NASA POWER, sismos USGS y documentos oficiales. Explica cómo trabajar con chat web, Codex y Antigravity, elegir gráficos, comprobar resultados y aumentar el volumen de análisis.

Incluye un explorador accesible con tablas y exportación CSV, cinco paquetes ZIP, un libro XLSX con datos y diccionario, cuatro cuadernos, figuras y dos guías PDF. Los archivos están en `materiales/analisis-datos/` y `docs/analisis-datos/`; `fuentes.json` conserva consultas, fechas, filtros, unidades, condiciones y hashes. LAB-A01 se guarda mediante el SDK como producto complementario y no modifica el avance curricular. La evidencia de las comprobaciones se registra en [la validación del laboratorio](docs/analisis-datos/validacion.md).

## Fuentes editables y verificación

El contenido se edita en `content/`, el registro en `deliverables.registry.json` y la trazabilidad curricular en `guide.manifest.json`. Los CSV administrativos se generan desde el libro de práctica y `scripts/build-challenge-materials.py`; la página se construye con `scripts/build-course.py` y los paquetes científicos con `scripts/build-analysis-materials.py`. El análisis científico se repite con `materiales/analisis-datos/codigo/analysis_data.py`; solo sus acciones de actualización usan la red. No edite solo el HTML generado. La compilación también genera `css/course.css`, que une en orden de cascada las hojas listadas entre los marcadores `css-bundle` de `content/shell.html` (se editan las hojas de origen), y `js/lab-source-data.js`, que el laboratorio carga solo al abrirse. Cada recurso local se versiona con un hash de su contenido.

`content/module-orientation.json`, `content/orientation/` y `content/challenge-guidance.json` contienen la entrada breve, los cinco esquemas y los ejemplos de comprobación. `scripts/course_guidance.py` distribuye las instrucciones. `content/ai-task-briefs.json` alimenta `scripts/build-ai-task-kits.py` y `scripts/course_delivery.py` para publicar paquetes y encargos idénticos. `scripts/build-styled-documents.py` genera la biblioteca; `scripts/document_download_styles.py` aplica el formato reproducible de Word y Excel y verifica que su contenido se conserve.

`scripts/lab_document_pdfs.py` genera las dos guías PDF del laboratorio desde sus fuentes editables. La compilación aplica los formatos antes de empaquetar los materiales científicos, para que los ZIP contengan las versiones publicadas. El HTML y los once paquetes de retos conservan los mismos bytes cuando se reconstruyen sin cambiar las fuentes.

```powershell
python -m pip install -r requirements-build.txt
npm ci --ignore-scripts
npm run build
npm run check:redaccion
npm test
npm run test:coverage:all
```

Si cambia el registro, ejecute el publicador canónico `Publish-GuideEvidenceRegistry.ps1 -Path . -Apply` para actualizar su copia JavaScript. Ese comando prepara archivos locales.

La integración continua construye la guía, comprueba que sus salidas coincidan con las fuentes, ejecuta las pruebas y publica el informe de cobertura. La compuerta JavaScript abarca los archivos directos de `js/` y el verificador editorial; las funciones de los constructores del curso y de sus prácticas con fuentes tienen una comprobación equivalente en Python. El informe de revisión diferencia este alcance de los generadores auxiliares de ilustraciones.

La guía conserva los datos en el navegador actual. En equipos compartidos, cada aprendiz debe usar su perfil, exportar los productos al destino indicado y eliminar sus datos al terminar. Guardar o exportar una evidencia no equivale al juicio de evaluación del instructor.

## Prácticas con fuentes

Los cinco módulos sustituyen las láminas en video por decisiones con retroalimentación, cálculos y comparadores. El navegador conserva etapa, respuestas, intentos y ayudas mediante el adaptador del SDK. Este avance se muestra separado de las evidencias y no bloquea los retos. Las fuentes y soluciones se pueden consultar sin JavaScript.

`npm run build` compila la web y sus paquetes sin reformatear Word o Excel ni regenerar PDF. `npm run build:documents` queda reservado para una solicitud explícita de actualización documental. Los documentos existentes siguen disponibles.
