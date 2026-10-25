# Propuesta de módulo independiente: explora datos y documentos con IA

**Estado:** plan aprobado por el usuario e implementado; comprobaciones y límites en `analisis-datos/validacion.md`.  
**Fecha de consulta de fuentes:** 18 de octubre de 2026, Colombia.  
**Decisión confirmada:** ruta inicial sin programación y ruta avanzada opcional.  
**Supuesto:** la expresión «codes» de la solicitud se refiere a OpenAI Codex.


## Forma de trabajo con IA

La IA prepara los archivos de la actividad con el encargo y las fuentes del paquete. El aprendiz entrega ese encargo a un chat autorizado o a Antigravity o Codex, revisa el resultado y descarga los productos. Los campos que se describen son la estructura de salida para la IA. Los datos ausentes, las mediciones no realizadas y las revisiones humanas no observadas quedan pendientes; el instructor conserva la valoración formal.

Los [encargos de la guía web](../index.html#preparacion) están listos para usar. La conversación, el informe y el JSON generado conservan el trabajo sin transcribirlo en otra ficha. Si la herramienta no puede ejecutar la tarea, se conserva esa limitación como pendiente y se consulta una opción autorizada.

## 1. Resultado y ubicación

Crear un laboratorio independiente al que se acceda desde el menú de la guía, con entrada, índice, materiales y cierre propios. Su nombre propuesto es **Explora datos y documentos con IA**. Tendrá una dirección interna directa, `#laboratorio-datos`, y podrá recorrerse sin completar los módulos administrativos.

El aprendiz aprenderá a formular una pregunta, encontrar información oficial, revisar su calidad, encargar el análisis a una herramienta de IA, explorar gráficos y comprobar las conclusiones. La ruta avanzada permitirá repetir el proceso sobre más archivos o registros y conservar los pasos de cálculo.

La ampliación conservará la adaptación vigente de 40 horas, la referencia curricular de 48 horas, los retos existentes y las cinco evidencias MG-A01 a MG-A05. El tiempo y los productos del laboratorio se identificarán como complementarios. Sus actividades no modificarán el porcentaje de avance del recorrido principal ni producirán por sí solas una calificación institucional.

**Dedicación propuesta:** 12 horas para la ruta inicial y entre 12 y 16 horas adicionales para quien realice todos los talleres avanzados. Son estimaciones pedagógicas que se ajustarán después de probar las actividades con aprendices.

## 2. Organización del recorrido

| Bloque | Ruta inicial: qué podrá hacer el aprendiz | Ruta avanzada opcional |
| --- | --- | --- |
| 1. De la pregunta a la fuente | Definir qué quiere comparar; localizar una fuente oficial; descargar una muestra y reconocer su diccionario. | Usar consultas a servicios de datos, filtros, paginación y un registro reproducible de descargas. |
| 2. Antes de calcular | Identificar filas, variables, unidades, fechas, vacíos, duplicados y valores extraños. | Construir validaciones automáticas y conservar un informe de limpieza con entradas y salidas. |
| 3. Escoger un gráfico | Comparar barras, líneas, histogramas, dispersión y tablas; explicar por qué un gráfico responde a una pregunta. | Añadir cajas, intervalos, mapas, pequeños múltiplos, mapas de calor y controles interactivos. |
| 4. Planetas y estrellas | Explorar tamaños, periodos orbitales y características de estrellas anfitrionas. | Separar tablas de planetas y estrellas; estudiar incertidumbre, escalas logarítmicas y sesgos de detección. |
| 5. Población y territorio | Comparar población entre años y lugares, con cifras absolutas y proporciones. | Construir pirámides por edad y sexo, tasas de variación y mapas con divisiones territoriales compatibles. |
| 6. Tiempo, temperatura y eventos | Reconocer evolución temporal, distribución y estacionalidad en temperatura y sismos. | Agregar por periodos, comparar series, detectar anomalías y evaluar un pronóstico sencillo. |
| 7. Documentos extensos y colecciones | Comparar informes con una matriz de afirmaciones, fuentes y páginas. | Inventariar carpetas, extraer texto y tablas, aplicar OCR cuando corresponda y consultar por fragmentos con referencias. |
| 8. Reproducir y comunicar | Entregar un gráfico, su tabla, una conclusión comprobada y sus límites. | Procesar volúmenes mayores por lotes; guardar consultas, código, versiones y resultados verificables. |

Cada bloque seguirá las fases que ya utiliza la guía: **Aprende, Observa, Resuelve y Documenta**. Incluirá una explicación breve, un ejemplo resuelto, instrucciones copiables para la IA, una práctica y una comprobación concreta. Los términos técnicos aparecerán junto a una explicación en lenguaje común.

## 3. Cinco laboratorios con información oficial

### A. NASA: planetas y estrellas anfitrionas

**Pregunta:** ¿cómo se distribuyen los tamaños y periodos orbitales de los planetas conocidos y qué características tienen sus estrellas?

La fuente será el [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/). El aprendiz abrirá las tablas de sistemas planetarios, seleccionará columnas, aplicará filtros y descargará CSV. El diccionario oficial permitirá reconocer `pl_name`, `hostname`, `pl_rade`, `pl_orbper`, `st_teff` y `st_rad`, con sus unidades. Se empezará con una muestra congelada y después se repetirá la consulta sobre el archivo actualizado.

Se construirán un histograma de radios, una dispersión de radio frente a periodo orbital y una comparación de temperatura y radio de estrellas anfitrionas. Una tabla independiente de estrellas evitará contar la misma estrella por cada planeta; los valores discrepantes se resolverán con una regla documentada antes de eliminar duplicados. La vista explicará ausencias, incertidumbre y sesgos de observación. El archivo describe exoplanetas y sus anfitrionas; no representa un censo de todas las estrellas. La elección entre `ps` con `default_flag=1` y `pscomppars` quedará documentada para evitar duplicaciones y combinaciones de parámetros mal interpretadas. [Diccionario y estructura de las tablas](https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html).

**Producto:** explorador con filtros y tabla accesible, tres gráficos y una nota que distinga patrón observado de conclusión científica.

### B. Población: Colombia y comparación internacional

**Pregunta:** ¿cómo cambia la estructura de una población y qué diferencia hay entre un conteo, una estimación y una proyección?

En el [portal de proyecciones del DANE](https://www.dane.gov.co/index.php/estadisticas-por-tema/demografia-y-poblacion/proyecciones-de-poblacion), el aprendiz elegirá el nivel territorial, la serie por área, sexo y edad y la versión del anexo. Descargará el archivo, identificará hojas y encabezados y conservará la nota metodológica correspondiente. El taller local trabajará con Santander y una comparación territorial delimitada; el filtro exacto se fijará al verificar el anexo.

La comparación internacional usará el indicador de población total `SP.POP.TOTL` del Banco Mundial, con países y periodo explícitos. Enseñará cómo pasar de la descarga del portal a una consulta reproducible. [Estructura de la API del Banco Mundial](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures).

Se producirán barras, líneas y una pirámide poblacional. La revisión comprobará denominadores, grupos de edad, periodos, categorías territoriales y versiones. Una proyección no se rotulará como población efectivamente observada, ni se mezclarán cifras nacionales y subnacionales como si tuvieran el mismo alcance.

**Producto:** comparación visual acompañada de una ficha de fuente y una explicación de lo que permiten afirmar los datos.

### C. Temperatura y precipitación: NASA POWER

**Pregunta:** ¿cómo varían la temperatura y la precipitación durante el año en un lugar seleccionado?

El aprendiz abrirá el visor de [NASA POWER](https://power.larc.nasa.gov/), seleccionará coordenadas, periodo, frecuencia y variables y descargará CSV. La versión avanzada repetirá la selección mediante su [servicio de datos](https://power.larc.nasa.gov/docs/services/api/). Se explicarán `T2M`, las variables de precipitación escogidas, sus unidades, el tratamiento de valores ausentes y el estándar horario de la descarga.

Las vistas incluirán líneas temporales, cajas por mes y un calendario de colores. La comparación dejará claro que un producto de rejilla no equivale a una estación instalada en la dirección elegida. Un periodo breve servirá para aprender a descargar y revisar; las preguntas sobre clima exigirán una ventana temporal pertinente.

**Producto:** tablero temporal con filtros, conteos de observaciones válidas y explicación de cobertura y límites.

### D. Sismos: USGS

**Pregunta:** ¿dónde y cuándo aparecen los eventos del catálogo seleccionado y cómo se distribuyen sus magnitudes y profundidades?

El aprendiz abrirá el [catálogo y servicio oficial de USGS](https://earthquake.usgs.gov/fdsnws/event/1/), delimitará fechas y región y obtendrá CSV o GeoJSON. Revisará identificador, fecha, coordenadas, magnitud, tipo de magnitud y profundidad. La ruta avanzada dividirá consultas grandes en ventanas y comprobará duplicados y totales.

Se crearán un mapa, un histograma y una serie de conteos. La explicación distinguirá magnitud de intensidad y señalará que los cambios de detección o cobertura afectan los conteos. Estos gráficos no se presentarán como un método para predecir sismos.

**Producto:** mapa acompañado de tabla y dos gráficos, con filtros y notas sobre la selección del catálogo.

### E. Documentos: de un conjunto de informes a una colección mayor

**Pregunta:** ¿qué supuestos, periodos y métodos sostienen una cifra y cómo cambian entre documentos?

El corpus inicial propuesto estará en español: metodología general de proyecciones del DANE, su actualización posterior a COVID-19, la [nota técnica de julio de 2025](https://www.dane.gov.co/files/censo2018/proyecciones-de-poblacion/Nacional/NotaTecnica-PPED-jul2025.pdf) y documentos de la [serie de metodologías demográficas aplicadas](https://www.dane.gov.co/index.php/estadisticas-por-tema/demografia-y-poblacion/metodologias-demograficas-aplicadas). La IA preparará el inventario con título, fecha, versión y URL, y obtendrá los documentos permitidos desde el portal oficial. El aprendiz revisará las referencias y la cobertura real de acceso. La comparación distinguirá antecedentes metodológicos de instrucciones vigentes.

Para ampliar el ejercicio se utilizará una selección temática del [NASA Technical Reports Server](https://ntrs.nasa.gov/), empezando con documentos públicos que tengan texto completo accesible. El [buscador](https://ntrs.nasa.gov/search) permite acotar por fecha, tipo, tema y otros campos. Una ficha bibliográfica no se confundirá con un documento descargado o leído.

El proceso será: inventario → detección de duplicados → extracción de texto y tablas → OCR cuando haga falta → revisión de extracción → división por secciones → consulta → comparación de afirmaciones → comprobación en páginas originales. Se conservará un registro de archivos y páginas procesados, fallidos y pendientes. Las respuestas incluirán archivo, página o sección y evidencia; si no existe soporte, indicarán que no se encontró.

**Producto:** matriz de documentos y afirmaciones, mapa de temas, cronología de versiones y un informe con referencias verificadas. La búsqueda por fragmentos se enseñará como ayuda para localizar evidencia, no como garantía de haber revisado toda la colección.

## 4. Herramientas y ejemplos operativos

La selección se hará según la tarea, el tamaño de los archivos, los permisos y el producto esperado. La guía distinguirá las capacidades de la herramienta de las características que dependen de la cuenta o del plan contratado.

| Necesidad | Opción principal propuesta | Ejemplo que se desarrollará |
| --- | --- | --- |
| Empezar sin programar | Chat web que permita adjuntar y analizar archivos; ChatGPT como recorrido explícito y Gemini como alternativa documentada. | Adjuntar el CSV de población; pedir revisión de columnas, cálculo, gráfico, tabla de resultados y explicación; comprobar una cifra y descargar la salida. |
| Construir un análisis reproducible con acompañamiento | Codex sobre una carpeta de trabajo. | Encargar el análisis NASA; revisar su plan; ejecutar limpieza y pruebas; abrir un gráfico HTML y repetir el proceso con una descarga nueva. |
| Trabajar por tareas y revisar artefactos | Google Antigravity, con la versión e interfaz utilizadas identificadas. | Encargar el tablero de temperatura; revisar fuente, plan, código y resultados; comprobar la correspondencia entre tabla y gráfico. |
| Consultar un conjunto de documentos | NotebookLM, denominado Gemini Notebook en la documentación consultada, y chat con archivos para la entrada; Codex o Antigravity para preparación y procesamiento por lotes. | Comparar metodologías del DANE y comprobar las citas contra las páginas originales. |
| Examinar y aprender el cálculo paso a paso | Jupyter o Google Colab. | Encargar al agente la ejecución del cuaderno y una repetición con otro periodo o filtro; revisar los archivos resultantes. |
| Revisar tablas y limpieza | Excel, Sheets o Calc; OpenRefine como ampliación. | Examinar tipos y duplicados y comparar el archivo original con la tabla preparada. |
| Visualizar y comunicar | Plotly para exploración; Matplotlib para gráficos estáticos; Power BI como ruta de tablero cuando el entorno lo permita. | Filtrar puntos, consultar una tabla equivalente y exportar un gráfico legible con unidades y fuente. |
| Consultar archivos mayores | DuckDB con Parquet y procesamiento por lotes; pandas para las muestras que quepan en memoria. | Seleccionar columnas y periodos antes de cargar resultados, agrupar y visualizar una tabla resumida. |

Cada recorrido detallará qué abrir, qué archivo entregar, qué encargo preparado entregar, cómo reconocer el resultado esperado, qué revisar y cómo resolver un error habitual. Las alternativas tendrán su propio ejemplo cuando cambie el procedimiento. No se asumirá que adjuntar archivos o crear gráficos está habilitado en todas las cuentas.

La redacción de los recorridos se apoyará en la documentación oficial consultada: [archivos y superficies de ChatGPT](https://learn.chatgpt.com/docs/artifacts-viewer), [aplicación de escritorio](https://learn.chatgpt.com/docs/app), [agente de Antigravity](https://antigravity.google/docs/agent/), [archivos y gráficos en Gemini](https://support.google.com/gemini/answer/14903178?hl=es-419) y [consulta con citas en Gemini Notebook](https://support.google.com/gemininotebook/answer/16179559?hl=es-419). El tutorial distinguirá chat web, aplicación, extensión y terminal; una capacidad documentada para una superficie no se atribuirá automáticamente a las demás.

Los ejemplos usarán carpetas separadas para originales, datos preparados, resultados y documentación. El aprendiz pedirá a la IA que conserve la fuente y explique las transformaciones. Los mensajes se diseñarán alrededor de una tarea verificable, no de una petición genérica de «analizar todo».

## 5. Análisis profundo y grandes volúmenes

La ampliación cubrirá las principales familias de problemas: descripción, comparación de grupos, relaciones entre variables, evolución temporal, territorio y documentos. La ruta avanzada incorporará incertidumbre, valores atípicos, datos faltantes, correlación y regresión con supuestos explícitos. Un ejercicio de pronóstico separará entrenamiento y evaluación por tiempo y comparará contra una referencia sencilla. Se presentarán PCA y agrupamiento como exploración opcional, con sensibilidad al escalado y sin atribuir significado causal a sus grupos.

El tamaño se explicará con tres medidas: filas, bytes y complejidad del contenido. Una colección de PDF puede exigir más trabajo que una tabla grande. La demostración crecerá de muestra pequeña a conjunto completo delimitado y luego a particiones, sin pedir al aprendiz que cargue archivos enormes en el chat o el navegador.

El directorio de fuentes incluirá [NASA Earthdata](https://search.earthdata.nasa.gov/), [ESA Gaia](https://gea.esac.esa.int/archive/), [NOAA GHCN Daily](https://www.ncei.noaa.gov/pub/data/ghcn/daily/) y los portales oficiales utilizados en los talleres. Para cada uno registrará tema, formato, acceso, condiciones de uso, filtros, forma de obtener una muestra y método de ampliación. Se explicarán CSV, JSON, Parquet, GeoJSON y, como orientación especializada, FITS y NetCDF. Gaia se atribuirá a ESA; no se presentará como un catálogo de NASA.

Las ampliaciones mostrarán una consulta acotada de estrellas en Gaia, un área y dos fechas de un producto Earthdata y una estación meteorológica de NOAA. Los requisitos de cuenta y las banderas de calidad se documentarán por fuente. La estrategia de consulta de archivos se apoyará en [DuckDB y Parquet](https://duckdb.org/docs/current/data/parquet/overview); el volumen completo no se convertirá en requisito para iniciar.

Las prácticas medirán registros leídos, filas válidas, descartes justificados, archivos fallidos, tiempo y tamaño de salida. No se prometerá una capacidad fija sin medirla en el equipo y la herramienta usados. La ruta local funcionará con muestras guardadas; las actualizaciones en línea tendrán instrucciones separadas y control de errores.

## 6. Diseño visual y accesibilidad

Se propone una galería que relacione pregunta, tipo de variable y gráfico, con ejemplos correctos y engañosos que el aprendiz pueda comparar. Los controles permitirán cambiar filtros, agrupación y escala y observar cómo cambia la conclusión.

Cada visualización tendrá título descriptivo, unidades, periodo, fuente, tabla de datos y explicación textual. Los colores tendrán contraste suficiente y no serán la única señal. Se revisarán navegación con teclado, foco visible, ampliación de texto, pantalla pequeña y movimiento reducido. Las vistas complejas ofrecerán una alternativa estática o tabular.

El 3D y la animación se reservarán para preguntas espaciales o temporales que los justifiquen. El gráfico científico deberá conservar cantidades y relaciones; no se sustituirá por una ilustración generada que parezca contener resultados.

## 7. Materiales que se entregarán

1. Una guía web independiente y una guía descargable del laboratorio en Markdown y PDF, generada después de validar la web.
2. Cinco paquetes de práctica, uno por laboratorio, con consigna, instrucciones para herramientas, ficha de trabajo y criterios de revisión.
3. Muestras de datos oficiales en CSV y un libro XLSX de consulta, con diccionario de variables, unidades y hoja de procedencia. Solo se redistribuirán los recursos cuyas condiciones lo permitan.
4. Un manifiesto de fuentes con URL, versión, fecha de consulta, licencia o condiciones, filtros, tamaño, conteo y huella del archivo cuando corresponda.
5. Cuadernos y scripts reproducibles para la ruta avanzada, con dependencias, instrucciones de ejecución y pruebas de los cálculos.
6. Gráficos HTML explorables y salidas estáticas, acompañados de sus tablas.
7. Inventario documental, matriz de afirmaciones y citas, registro de archivos fallidos y plantilla de informe.
8. Rúbrica del instructor, clave de revisión separada y paquete ZIP por laboratorio; un índice permitirá escoger descargas sin obtener todo el material.

El PDF del DANE [Metodología general de proyecciones](https://www.dane.gov.co/files/censo2018/proyecciones-de-poblacion/Documento-metodologico-proyecciones.pdf) contiene una restricción de reproducción en su segunda página. Se distribuirán enlaces y fichas originales, sin incorporar ese informe al ZIP salvo que se obtenga autorización. La disponibilidad pública se comprobará por separado del permiso para redistribuir o cargar un documento en un servicio externo.

El aviso actual sobre materiales preparados para aprender deberá precisar que corresponde a los casos administrativos del recorrido original. El laboratorio declarará que usa datos públicos reales y distinguirá cualquier ejemplo generado para probar errores. Mantendrá la restricción de no cargar información institucional o personal reservada.

## 8. Implementación por capas y agentes

| Capa y responsable | Entradas y salida | Dependencia | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- |
| Fuentes y datos, agente de datos | Portales oficiales → muestras, diccionarios, consultas y manifiesto. | Alcance aprobado. | Una descarga reproducible por caso; unidades, filtros, permisos y límites documentados. | Investigación inicial realizada; producción pendiente. |
| Herramientas y documentos, agente técnico | Documentación oficial y muestras → recorridos, cuadernos y flujo documental. | Contratos de datos definidos. | Un ejemplo ejecutable por Codex, Antigravity y chat web; citas y cobertura documental comprobables. | Investigación inicial realizada; ejecución pendiente. |
| Pedagogía y redacción, agente editorial | Objetivos y resultados → lecciones, consignas, descargables y rúbrica. | Casos y herramientas definidos. | Instrucciones comprensibles, progresión de dificultad y coherencia entre práctica y producto. | Diseño inicial realizado; elaboración pendiente. |
| Integración y accesibilidad, agente coordinador | Entregas anteriores → módulo web y navegación. | Contratos de contenido y recursos estables. | Acceso independiente, carga proporcionada, teclado y tabla alternativa; curso principal conservado. | Arquitectura revisada; implementación pendiente. |
| Verificación final, coordinación y revisión cruzada | Cambio integrado → pruebas, evidencia visual y reporte. | Entregas integradas. | Compuertas completas aprobadas y limitaciones declaradas. | Pendiente. |

Durante esta preparación participaron tres agentes especializados y la coordinación. Se aplicaron habilidades de hojas de cálculo, documentación oficial de OpenAI, PDF, visualización, redacción en español de Colombia y verificación por capas, según el trabajo de cada rol. La implementación mantendrá archivos asignados por responsable para evitar ediciones simultáneas.

Las fuentes del módulo se ubicarán en `content/analisis-datos/`; los materiales, en `materiales/analisis-datos/`; y los documentos propios, en `docs/analisis-datos/`. La integración usará `scripts/build-course.py`, los estilos y el SDK existentes. La ubicación exacta de los componentes se fijará al implementar, respetando los contratos de navegación, persistencia y evidencias del proyecto. `index.html` se regenerará desde sus fuentes.

El registro de productos complementarios usará el mecanismo central del SDK cuando corresponda, sin convertirlos en requisitos de las evidencias curriculares actuales. Se conservarán los cambios previos que ya existen en el directorio de trabajo.

## 9. Verificación y aceptación

- Escribir primero las pruebas del comportamiento nuevo y confirmar el fallo esperado antes de implementar.
- Verificar resultados numéricos, unidades, denominadores, nulos, duplicados, límites de fechas y orden temporal contra muestras conocidas.
- Probar descargas fallidas, respuestas vacías, cambios de esquema, paginación y reanudación cuando formen parte del código entregado.
- Probar citas y conteos documentales: un archivo fallido no podrá aparecer como procesado; una respuesta sin respaldo deberá quedar pendiente.
- Comprobar que los filtros del gráfico y su tabla muestran el mismo conjunto de datos, incluso cuando esté vacío.
- Comprobar navegación independiente, progreso del recorrido principal, impresión, teclado y presentación en diferentes tamaños de pantalla.
- Validar fuentes y paquetes: todos los enlaces y archivos prometidos deberán existir; los datos de muestra y los resultados deberán corresponder a la misma versión.
- Ejecutar `npm run build`, `npm run check:redaccion`, `npm test` y `npm run test:coverage:all`; ampliar la compuerta Python a los scripts de producción nuevos y mantener el objetivo de 100 % de funciones con aserciones reales. Integrar las verificaciones en la CI existente.
- Ejecutar las compuertas de guías educativas antes de publicar y `validate-rules.ps1` antes de un commit. La publicación se tratará como un paso posterior con su alcance concreto.
- Revisar la página completa y renderizar los documentos finales para comprobar legibilidad, cortes, tablas y referencias. El verificador de expresiones no reemplaza esta lectura.

**Evidencia de esta fase:** revisión de estructura y contratos del repositorio; consulta de fuentes oficiales; tres agentes de investigación; consultas pequeñas a NASA Exoplanet Archive, NASA POWER, Banco Mundial y USGS con respuesta HTTP 200 reportada por el agente de datos. Esto comprueba acceso a esas muestras, no la finalización de los futuros laboratorios ni una auditoría completa de los catálogos.

Consultas de prueba conservadas para repetir la comprobación:

- [NASA: tres planetas con campos de sus estrellas anfitrionas](https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+top+3+pl_name,hostname,pl_rade,pl_orbper,st_teff,st_rad+from+pscomppars+order+by+pl_name&format=json).
- [NASA POWER: tres días de enero de 2024 en coordenadas de Bogotá](https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR&community=AG&longitude=-74.0721&latitude=4.7110&start=20240101&end=20240103&format=JSON).
- [Banco Mundial: población de Colombia, Perú y Ecuador entre 2020 y 2022](https://api.worldbank.org/v2/country/COL;PER;ECU/indicator/SP.POP.TOTL?date=2020:2022&format=json&per_page=100).
- [USGS: dos eventos del catálogo en enero de 2024](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2024-01-01&endtime=2024-02-01&minmagnitude=5&eventtype=earthquake&limit=2&orderby=time-asc).

Los límites de tres planetas y dos eventos sirven para verificar acceso y estructura. No producen una muestra representativa ni bastan para las conclusiones de los talleres.

**Comprobación local durante la preparación:** `npm run check:redaccion` pasó; `npm test` pasó con 152 pruebas JavaScript y 10 pruebas Python. Son verificaciones del estado actual de la guía y del documento de propuesta; todavía no verifican un módulo implementado.

## 10. Decisión y cierre

El usuario aprobó este alcance y solicitó continuar. Se implementaron el módulo independiente, los cinco laboratorios, las dos rutas, los ejemplos por herramienta y sus materiales. Los apartados anteriores conservan el plan acordado como antecedente; el estado final y las comprobaciones se encuentran en [validacion.md](analisis-datos/validacion.md).

La publicación remota y la validación pedagógica con aprendices no forman parte de esta ejecución local.
