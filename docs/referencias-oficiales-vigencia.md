# Fuentes oficiales y vigencia

**Consulta documental:** 24 de octubre de 2026. Este registro ayuda a verificar afirmaciones que pueden cambiar. La fecha corresponde a la consulta de las páginas enlazadas; no garantiza que sigan iguales después.

## Formación y decisiones institucionales

| Fuente | Qué confirma y para qué se usa | Alcance pendiente |
| --- | --- | --- |
| [Oferta del SENA en Betowa](https://betowa.sena.edu.co/oferta/implementacion-de-herramientas-de-inteligencia-artificial-en-la-optimizacion-de-la-productividad?level=11&modality=V&offertype=company&programId=229107) | La ficha vigente consultada identifica el programa complementario virtual **Implementación de herramientas de inteligencia artificial en la optimización de la productividad** con duración de **48 horas**. | La propuesta de esta guía suma 36 horas directas y cuatro autónomas. Instructor y coordinación deben confirmar la vigencia curricular, el alcance y si procede alguna equivalencia. No se cambia esa propuesta por inferencia. Fechas, sede, grupo, cuentas y canal de entrega también siguen por confirmar. |

## Protección de datos y cuentas de IA

| Fuente | Afirmación usada | Límite para la guía |
| --- | --- | --- |
| [Ley Estatutaria 1581 de 2012 · Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981) | Norma de referencia para el tratamiento de datos personales en Colombia. | La guía no interpreta un caso concreto ni reemplaza el concepto jurídico o las instrucciones institucionales. |
| [Circular Externa 002 de 2024 · SIC](https://sedeelectronica.sic.gov.co/transparencia/normativa/circular-externa-2-de-2024-de-la-superintendencia-de-industria-y-comercio-lineamientos-sobre-el-tratamiento-de-datos) | La SIC publicó lineamientos sobre tratamiento de datos personales en sistemas de inteligencia artificial el 21 de agosto de 2024. | El curso presenta una regla preventiva para practicar; el responsable institucional debe determinar su aplicación y las autorizaciones correspondientes. |
| [Uso de datos para mejorar modelos · OpenAI](https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance) | Las cuentas personales tienen controles para el uso de contenido nuevo en la mejora de modelos. OpenAI indica que los espacios Business, Enterprise, Edu y la API no se usan con ese fin por defecto. | No equivale a autorización de carga ni describe por sí solo retención, acceso institucional, conectores, acciones o acuerdos específicos. La cuenta y el espacio de trabajo pueden cambiar qué controles están disponibles. |
| [Chat temporal · OpenAI](https://help.openai.com/en/articles/8914046-temporary-chat-in-chatgpt) | Mientras permanece temporal, la conversación no se usa para mejorar modelos; OpenAI puede conservar una copia hasta 30 días por motivos de seguridad. Si se guarda, pasa a regirse por la configuración habitual. | «Temporal» no significa que el contenido nunca se retenga ni autoriza tratar información institucional. |
| [Privacidad de Gemini Apps · Google](https://support.google.com/gemini/answer/13594961?hl=es) | Con Keep Activity activado, chats y archivos compartidos se guardan en Actividad y pueden emplearse para mejorar servicios, con revisión humana. Google indica que ciertos datos revisados por proveedores se conservan hasta tres años desconectados de la cuenta. Con Keep Activity desactivado, los chats futuros no aparecen en Actividad ni se usan para entrenar modelos, salvo excepciones como el envío de comentarios; se conservan 72 horas para responder, procesar comentarios y proteger el servicio. | Las condiciones dependen de cuenta, país, funciones y configuración. Desactivar la actividad no sustituye la autorización institucional ni controla otras aplicaciones conectadas. |
| [Carga y análisis de archivos en Gemini Apps · Google](https://support.google.com/gemini/answer/14903178?hl=es-ES) | La función admite varios tipos de archivo; el acceso, las capacidades y los límites dependen de la cuenta, la función y el plan. | No se fijan cuotas en materiales del curso porque pueden variar. Comprueba las condiciones que aparecen en la cuenta antes de iniciar. |

## Herramientas de análisis

| Fuente | Afirmación usada | Límite para la guía |
| --- | --- | --- |
| [Abrir archivos CSV UTF-8 correctamente en Excel · Microsoft Support](https://support.microsoft.com/es-es/excel/opening-csv-utf-8-files-correctly-in-excel) | Microsoft recomienda importar desde Datos con Power Query cuando el CSV UTF-8 no se abre correctamente de forma directa; la vista previa permite revisar el archivo. | Los controles pueden variar entre versiones. La guía recomienda comprobar codificación, separador y columnas antes de cargar. |
| [Importar o exportar archivos de texto · Microsoft Support](https://support.microsoft.com/es-es/excel/get-started/import-or-export-text-txt-or-csv-files) | Excel permite importar texto o CSV y escoger cargar los datos o transformarlos en Power Query. | La interpretación automática de tipos debe revisarse; códigos, fechas y ceros iniciales pueden requerir tratamiento explícito. |
| [Importar datos de orígenes con Power Query · Microsoft Support](https://support.microsoft.com/es-es/excel/import-data-from-data-sources-power-query) | Power Query ofrece vista previa y pasos para conectar y transformar archivos CSV. | La repetición de pasos no valida por sí sola una transformación; se deben contrastar tipos, filas y resultados con la fuente. |

## Fuentes de las muestras del laboratorio

El manifiesto [fuentes.json](../materiales/analisis-datos/fuentes.json) conserva la consulta, fecha de descarga, filtros, transformaciones, conteos, unidades, límites y hashes de los archivos usados. Las páginas oficiales se contrastaron para la edición de esta guía:

| Muestra | Fuente oficial y dato que define | Cuidado de interpretación |
| --- | --- | --- |
| Exoplanetas | [NASA Exoplanet Archive · definiciones de PS y PSCompPars](https://exoplanetarchive.ipac.caltech.edu/docs/API_TD_columns.html). La consulta del manifiesto usa la tabla vigente `ps` y siete columnas definidas por la documentación del archivo. | `ps` contiene soluciones por planeta y referencia. La selección por tránsito hasta 2024 y por filtros de radio y periodo no es una muestra aleatoria del universo; la descarga puede cambiar si el archivo actualiza parámetros. |
| Población | [Banco Mundial · población total, SP.POP.TOTL](https://data.worldbank.org/indicator/SP.POP.TOTL). | Las estimaciones pueden revisarse y diferir de DANE por metodología, versión o periodo de referencia. |
| Pirámide de Santander | [DANE · proyecciones de población](https://www.dane.gov.co/index.php/estadisticas-por-tema/demografia-y-poblacion/proyecciones-de-poblacion) y [nota técnica de la actualización 2025](https://www.dane.gov.co/files/censo2018/proyecciones-de-poblacion/Nacional/NotaTecnica-PPED-jul2025.pdf). | El CSV es un extracto de proyección para 2024 con base en CNPV 2018; no es un conteo censal ni se redistribuye el libro original completo. |
| Clima | [NASA POWER · Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/). | El servicio ofrece UTC y hora solar local (LST); la consulta usa LST. El punto es un producto de rejilla, no una estación ubicada en Bogotá. |
| Sismos | [USGS · FDSN Event Web Service](https://earthquake.usgs.gov/fdsnws/event/1/USGS). | La consulta fija ventana, UTC, tipo y magnitud mínima; el catálogo y sus eventos pueden revisarse. Magnitud no equivale a intensidad percibida ni a daño. |

## Revisión antes de reutilizar

1. Abre el enlace oficial y verifica fecha, versión, alcance y condiciones de uso.
2. Conserva la consulta y los filtros con cada descarga. Una actualización puede producir valores distintos aunque la pregunta no cambie.
3. Contrasta los cambios de políticas o interfaces de proveedores antes de enseñar una ruta de menú o un límite.
4. Confirma con instructor, coordinación o responsable de protección de datos los campos institucionales pendientes. No los completes por inferencia.

