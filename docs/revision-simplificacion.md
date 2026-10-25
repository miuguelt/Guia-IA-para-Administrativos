# Reorganización y simplificación de la guía

## Alcance y criterio editorial

La revisión del 24 de octubre de 2026 conserva los diez retos breves, el integrador, las cinco evidencias curriculares, las dos modalidades de estudio y los complementos opcionales. La explicación necesaria se muestra antes de la práctica. Las ampliaciones y los esquemas de repaso se consultan cuando hacen falta.

La revisión no modifica la propuesta de 36 horas directas y cuatro autónomas, la referencia curricular de 48 horas ni las condiciones pendientes de validación. No genera documentos Word ni PDF. Los documentos históricos y los registros de versiones anteriores conservan su contenido.

## Inventario de superficies y método de revisión

| Superficie mantenida | Alcance y método | Evidencia |
| --- | --- | --- |
| Inicio y cronograma | Propósito, ruta, cantidades, horas y diferencias entre modalidades. Revisión de las fuentes HTML y de su correspondencia con los módulos. | `content/home.html`, `content/calendar.html` y pruebas del curso. |
| Preparación y cinco módulos | Introducciones, conceptos, ejemplos, decisiones, prácticas, ayudas y cierre. Revisión de los fragmentos HTML, los archivos JSON y su publicación por el generador. | Pruebas de simplificación, pedagogía, orientación y construcción. |
| Once retos y cinco evidencias | Fuentes, encargos completos, tres comprobaciones por reto, referencias y recepción del resultado. | Pruebas de entrega, importación y conservación de contenido. |
| EcoBogotá y laboratorio de datos | Ayuda común y requisitos específicos. Se conservan las tres rutas de capacitación, los cinco laboratorios, sus límites y las ampliaciones científicas. | Pruebas de complementos y sus materiales. |
| Portafolio | Recuperación de módulos, consolidación, respaldo y diferencia entre revisión y evaluación. | Pruebas de cierre y del SDK integrado. |
| Apoyos de lectura enlazados | Los Markdown vigentes y las fichas se publican mediante el constructor de la biblioteca. Las instrucciones de materiales independientes se conservan completas. No se aplica una eliminación automática de repeticiones entre documentos que se leen por separado. | Construcción y pruebas de documentos de lectura. La revisión visual de estos apoyos es representativa; no certifica cada documento de la biblioteca. |
| DOCX, PDF y antecedentes históricos | No se intervienen en esta entrega web. Sus verificaciones de edición y renderizado no aplican a este cambio. | No se invoca la generación ni el formato de descargas binarias. |

## Información reunida y ubicación de consulta

| Antes | Ahora y contenido conservado |
| --- | --- |
| Descarga, extracción del ZIP, carga en chat o IDE y uso de recursos comunes explicados en cada reto. | Preparación → «Cómo trabajar en los retos», con el ancla `metodo-comun`. Cada reto y ambos complementos enlazan allí. Los nombres de sus fuentes y sus restricciones permanecen en la actividad. |
| Objetivo, cabecera, resumen esencial y ruta de descarga repetían el mismo procedimiento. | Una entrada por módulo, con producto y tres decisiones propias. La meta y las definiciones se conservan; los ejemplos breves permanecen visibles. Se retiran las cabeceras y rutas genéricas duplicadas en la salida publicada. |
| La explicación completa estaba dentro de dos niveles de desplegables. | La explicación principal queda visible. Los esquemas que repasan esa explicación se reúnen al final del bloque como consulta; conservan su texto, cifras y referencias. Las ampliaciones históricas y predictivas siguen siendo opcionales. |
| El encargo mostraba otra vez el recorrido completo de descarga, revisión y guardado. | Dentro del reto muestra el producto específico. Los encargos completos para copiar y los paquetes independientes conservan sus instrucciones. |
| El paso de guardado repetía la misma instrucción en tres párrafos. | Una indicación de guardado y un acceso al espacio de evidencia. Se mantiene el aviso de revisión humana y valoración institucional pendientes. |
| La preparación y el módulo 4 usan el mismo caso de Bienestar. | La preparación enseña a cargar y comprobar una fuente; el módulo 4 retoma sus cifras para estudiar operaciones, unidades, gráficos y conclusiones. El caso no se elimina porque su propósito cambia. |
| Línea base en el módulo 1 y medición de mejora en el módulo 5. | El módulo 1 define la medida inicial. El módulo 5 indica cuándo puede reutilizarse y compara el ciclo completo; no exige inventar tiempos ni repetir una tarea manual. |
| El aviso de sesiones de 30 a 45 minutos aparecía en los cinco módulos. | Se conserva una sola vez en la ayuda de preparación. El cronograma amplía la organización de sesiones y el menú mantiene visible la modalidad elegida. |
| El portafolio volvía a explicar la importación inicial. | Su entrada parte de las evidencias ya guardadas y dirige al módulo correspondiente cuando falta alguna. Conserva las instrucciones de respaldo, recuperación y entrega. |

## Validación y límites

Las pruebas nuevas comprueban la visibilidad de la explicación, la ausencia de rutas genéricas duplicadas, la conservación del texto de enseñanza y los identificadores, los enlaces de ayuda y la navegación de regreso al reto. La copia de encargos se verifica contra su texto canónico completo, sin exigir una palabra particular.

La revisión visual en Edge abarca las once vistas a 320, 390, 768, 1440, 1920 y 2560 px, además de una emulación del espacio disponible con ampliación al 200 %. Se comprobaron las modalidades autónoma y con instructor: 154 combinaciones sin desbordamiento del panel ni recorte de prosa, con alineación inicial por debajo de 40 rem y justificación desde ese ancho real de lectura. Los desplegables se abrieron para comprobar también los textos extensos. Las capturas de 320 y 1440 px y la revisión de detalle del módulo 2 son muestras representativas; no cubren cada estado de cada simulador. La emulación no equivale a una prueba con el control de zoom del navegador.

La lectura se organiza en una columna continua para la explicación y otra para el apoyo relacionado cuando hay espacio. En ventanas estrechas, ambas se apilan. Las regiones aprovechan todo el ancho disponible, sin límites en caracteres. La prosa se justifica cuando su región alcanza 40 rem; en regiones menores y en la última línea conserva la alineación inicial. El comportamiento se comprueba con el ancho real del texto y el apoyo compartido de lectura. Las instrucciones que son código mantienen sus saltos y permiten desplazamiento horizontal dentro del bloque.

| Comprobación | Evidencia de esta iteración |
| --- | --- |
| Construcción desde fuentes | `output/simplificacion-build.txt`. |
| Suite completa y cobertura | Pasaron 289 pruebas JavaScript y 70 Python. La compuerta de archivos directos de `js/` y del verificador editorial registró 100 % de funciones, 99,37 % de líneas y 91,60 % de ramas. Este alcance no certifica todo el repositorio ni las dependencias compartidas. Resultados: `output/simplificacion-pruebas-final.txt` y `output/simplificacion-cobertura-final.txt`. |
| Navegación, copia, recepción, revisión, exportación y recuperación | Suite de integración JavaScript, incluidas las pruebas del enlace a la ayuda común y el regreso al reto. |
| Ajuste visual de las once vistas | `output/simplificacion-layout-autonomo.json`, `output/simplificacion-layout-aula.json` y sus registros de ejecución. |
| Contrato educativo y entregables | Ambas compuertas estrictas pasaron. Entregables mantiene una advertencia sobre el orden compartido de ECO-A01, histórico, y ECO-A02, vigente. |
| Presentación de código | La compuerta conserva dos hallazgos previos: las copias locales de `devbrain-evidence.js` y `devbrain-learner-sdk.js` difieren de `dist/`. La adaptación del portafolio está documentada en [Excepciones de arquitectura](architecture/exceptions.md). No se sustituyen esas copias dentro de esta revisión editorial. |

La observación con aprendices sigue pendiente: las pruebas automáticas y la revisión editorial no demuestran por sí solas comprensión humana. La pauta de observación se conserva en [Validación con aprendices](validacion-con-aprendices.md). La comprobación visual de toda la biblioteca de lectura y el zoom nativo del navegador también quedan pendientes; esta entrega no declara una auditoría visual exhaustiva de todos los documentos.
