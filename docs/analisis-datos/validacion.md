# Verificación del laboratorio de datos y documentos

## Actualización de verificación · 24 de octubre de 2026

Se amplió la ruta inicial de Excel en la web y en la guía del aprendiz. Incluye importación de CSV con revisión de UTF-8 y separador, tipos de columna, filtros, una regla de cambio porcentual con casos no calculables, elección de gráfico y rastro para repetir el análisis. La ruta se contrastó con la ayuda oficial de Microsoft, registrada en [fuentes de vigencia](../referencias-oficiales-vigencia.md). Los valores de los conjuntos originales no se modificaron.

La compilación generó 111 documentos de lectura, 28 paquetes para IA y cinco paquetes de análisis. Los PDF se regeneraron desde los archivos fuente: 33 páginas para el aprendiz y 6 para el instructor. Se renderizaron y revisaron visualmente las 39 páginas. La prueba real de Edge comprobó la interfaz y la guía descargable en 320, 390, 768, 1440, 1920 y 2560 px, al 200 % de zoom e impresión, sin desbordamientos ni texto recortado.

Las comprobaciones globales de esta versión pasaron: `npm test` (267 JavaScript y 63 Python), `npm run check:redaccion`, cobertura (100 % de funciones, 99,36 % de líneas y 91,68 % de ramas), contrato educativo estricto y entregables estrictos (siete artefactos y siete estaciones, sin errores ni advertencias).

La auditoría de modularidad reporta dos archivos por encima del límite de 400 líneas (`analysis_data.py`, 546; `js/simulators.js`, 563) y diez advertencias; el script no identificó una raíz Git, por lo que no distingue código previo de código nuevo. La presentación de código marca dos copias locales del SDK que difieren de la distribución compartida; su adaptación está documentada y requiere resolución en la fuente canónica compartida antes de sincronizar. No se sobrescribieron.

La ficha del curso complementario del SENA consultada registra 48 horas, mientras que esta propuesta totaliza 40. La equivalencia, las condiciones de la cohorte y la comprensión con aprendices siguen pendientes de validación institucional o humana. Este laboratorio es complementario y no reemplaza las evidencias curriculares.

El inventario completo, incluidas las rutas de `output/`, está en [inventario del proyecto](../inventario-proyecto.xlsx). Las páginas históricas de abajo conservan los resultados y alcances con los que se ejecutaron.

Fecha: 18 de octubre de 2026, Colombia. El módulo es independiente y opcional. Conserva los seis módulos formativos del curso, sus horas y las cinco evidencias curriculares. LAB-A01 utiliza el mecanismo central de evidencias y queda fuera de su porcentaje de avance.


## Forma de trabajo con IA

La IA prepara los archivos de la actividad con el encargo y las fuentes del paquete. El aprendiz entrega ese encargo a un chat autorizado o a Antigravity o Codex, revisa el resultado y descarga los productos. Los campos que se describen son la estructura de salida para la IA. Los datos ausentes, las mediciones no realizadas y las revisiones humanas no observadas quedan pendientes; el instructor conserva la valoración formal.

Los [encargos de la guía web](../../index.html#preparacion) están listos para usar. La conversación, el informe y el JSON generado conservan el trabajo sin transcribirlo en otra ficha. Si la herramienta no puede ejecutar la tarea, se conserva esa limitación como pendiente y se consulta una opción autorizada.

## Material entregado

- Cinco laboratorios con pasos de búsqueda, descarga, inspección, análisis y comprobación: NASA, población, clima, sismos y documentación.
- Explorador local con cinco vistas, controles de escala y selección, representación alternativa, tabla paginada y exportación CSV. Funciona con los datos incrustados sin solicitar servicios externos.
- Cinco ZIP reproducibles, cuatro cuadernos Jupyter, un programa de análisis, originales JSON y CSV preparados, diccionario y manifiesto con hashes.
- Libro XLSX de seis pestañas. Se compararon sus registros, valores, nulos y fechas contra los cinco CSV. La ampliación DANE se incluye en el diccionario.
- Guía del aprendiz de 28 páginas y guía del instructor de 6 páginas, con revisión visual de páginas, figuras, tablas y rúbrica. El Markdown es una guía de trabajo abreviada; el PDF reúne explicaciones y fichas.
- Diez referencias documentales que suman 293 páginas. Se distribuyen tres PDF NASA; los otros siete documentos se enlazan. La matriz de ejemplo registra tres afirmaciones verificadas y sus páginas, sin declarar lectura exhaustiva.

## Comprobaciones ejecutadas

Se escribieron y ejecutaron pruebas que fallaban antes de implementar el modelo, la interfaz, los paquetes y la ampliación del diccionario. Después se comprobaron resultados, filtros, duplicados, ausencias, exportación, errores y navegación. Las pruebas usan muestras conocidas y contrastan los CSV reales con los originales conservados.

La suite JavaScript pasa con 159 pruebas. La compuerta completa informa 100 % de funciones, 99,77 % de líneas y 88,85 % de ramas en su alcance declarado. Los dos archivos nuevos del explorador tienen 100 % de funciones y líneas. La suite Python incluye 23 pruebas; su compuerta comprueba las 22 funciones del analizador y la función del empaquetador, además de las funciones del constructor existente.

Los cuatro cuadernos se ejecutaron contra los datos locales. Se comprobó también un ZIP descomprimido con el comando de validación, sin red. La reconstrucción de paquetes produce los mismos bytes. Los datos publicados corresponden a 4.332 planetas, 75 filas de población, 366 días de clima, 133 sismos y 101 edades de la proyección de Santander.

Microsoft Edge se revisó a 1.440, 390 y 320 píxeles de ancho. Se comprobaron cinco vistas, tablas, enlaces internos, foco y ausencia de desbordamiento horizontal de página o errores de JavaScript. La información visual tiene descripción y tabla; los controles se manejan con teclado. Esta revisión no certifica compatibilidad con todos los lectores de pantalla.

Pasaron el verificador editorial, la compilación y las compuertas canónicas `Test-DevBrainEducationalGuide.ps1 -Strict` y `Test-GuideDeliverables.ps1 -Strict`, ambas sin advertencias. La CI ejecuta las suites JavaScript y Python, exige la cobertura de funciones JavaScript y publica su informe. Los controles Python de funciones fallan si se añade una función sin ejecutar en las pruebas.

## Límites de la validación

Los recorridos de ChatGPT, Gemini, Codex y Antigravity se documentaron con sus fuentes oficiales. La ejecución comprobada corresponde al código y los cuadernos incluidos; no se inició sesión en las cuentas de cada producto para repetir todos sus recorridos. Las capacidades visibles dependen de la cuenta y la versión.

La guía explica cómo escalar a catálogos, lotes de documentos, Parquet, DuckDB, formatos científicos y análisis estadístico. No se descargaron catálogos completos ni se midió el rendimiento sobre millones de registros o miles de PDF. La navegación y el análisis de las muestras funcionan localmente; una IA alojada requiere su conexión y acceso.

La duración sugerida y la comprensión de las actividades requieren validación pedagógica con aprendices. No se publicó el sitio ni se creó un commit. La actualización del índice de código registró 669 nodos y 1.105 relaciones con estado `degraded`; este índice auxiliar no interviene en la compilación ni en las pruebas aprobadas.
