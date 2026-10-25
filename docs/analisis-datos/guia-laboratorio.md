# Explora datos y documentos con IA

Laboratorio complementario e independiente. Ruta inicial: 12 horas sugeridas. Ruta avanzada opcional: entre 12 y 16 horas adicionales. Estos tiempos no modifican la propuesta de 40 horas del recorrido administrativo, la referencia curricular de 48 horas ni las evidencias MG-A01 a MG-A05. Son estimaciones de aprendizaje, no promesas de ahorro.

Esta guía usa datos públicos reales de fuentes oficiales. Los archivos preparados conservan su procedencia y sus transformaciones. No incorpores expedientes, credenciales ni información personal de tu dependencia. Los documentos externos se obtienen desde sus portales; su disponibilidad pública no equivale a un permiso de redistribución o de carga en cualquier servicio.

La [versión web del laboratorio](../../index.html#laboratorio-datos) reúne ejemplos, exploradores, instrucciones por herramienta y descargas. Esta guía permite organizar y revisar el trabajo fuera del navegador. Los nombres, filtros y conteos exactos de las muestras están en [fuentes.json](../../materiales/analisis-datos/fuentes.json); las variables se describen en [diccionario.csv](../../materiales/analisis-datos/diccionario.csv).


## Forma de trabajo con IA

La IA prepara los archivos de la actividad con el encargo y las fuentes del paquete. El aprendiz entrega ese encargo a un chat autorizado o a Antigravity o Codex, revisa el resultado y descarga los productos. Los campos que se describen son la estructura de salida para la IA. Los datos ausentes, las mediciones no realizadas y las revisiones humanas no observadas quedan pendientes; el instructor conserva la valoración formal.

Los [encargos de la guía web](../../index.html#preparacion) están listos para usar. La conversación, el informe y el JSON generado conservan el trabajo sin transcribirlo en otra ficha. Si la herramienta no puede ejecutar la tarea, se conserva esa limitación como pendiente y se consulta una opción autorizada.

## Entrega el encargo y recibe los archivos

1. Descarga un paquete de la tabla y entrega su encargo al chat autorizado o al agente de Antigravity o Codex.
2. La IA realiza el análisis y genera tablas, gráficos e informe. Contrasta una referencia del resultado y pide corregir cualquier diferencia.
3. Descarga los archivos y el JSON de entrega. La IA conserva límites y pendientes; importa el archivo en la guía sin transcribir sus campos.

| Práctica | Paquete y encargo preparados | Producto que genera la IA |
| --- | --- | --- |
| Planetas | [Paquete NASA](../../materiales/ia/lab-nasa.zip) · [Chat](../../materiales/ia/lab-nasa/ENCARGO-CHAT.md) · [Antigravity o Codex](../../materiales/ia/lab-nasa/ENCARGO-IDE.md) | Distribución, figuras, tabla de control e informe. |
| Población | [Paquete](../../materiales/ia/lab-poblacion.zip) · [Chat](../../materiales/ia/lab-poblacion/ENCARGO-CHAT.md) · [IDE](../../materiales/ia/lab-poblacion/ENCARGO-IDE.md) | Comparación por país y periodo, gráficos e informe. |
| Clima | [Paquete](../../materiales/ia/lab-clima.zip) · [Chat](../../materiales/ia/lab-clima/ENCARGO-CHAT.md) · [IDE](../../materiales/ia/lab-clima/ENCARGO-IDE.md) | Medias de temperatura, acumulados de lluvia y cobertura. |
| Sismos | [Paquete](../../materiales/ia/lab-sismos.zip) · [Chat](../../materiales/ia/lab-sismos/ENCARGO-CHAT.md) · [IDE](../../materiales/ia/lab-sismos/ENCARGO-IDE.md) | Mapa, distribuciones, tabla e informe con límites. |
| Documentos | [Paquete](../../materiales/ia/lab-documentos.zip) · [Chat](../../materiales/ia/lab-documentos/ENCARGO-CHAT.md) · [IDE](../../materiales/ia/lab-documentos/ENCARGO-IDE.md) | Inventario, matriz de citas, cobertura e informe. |

Las ampliaciones siguientes explican los controles del procedimiento que se encarga al asistente. La ejecución propia queda pendiente si la cuenta no puede procesar los archivos; observar un simulador no acredita ese trabajo.

## 1. Qué podrás hacer

Formular una pregunta que pueda responderse con datos, encontrar una fuente oficial, revisar una tabla, elegir un gráfico, encargar cálculos a la IA y comprobar las conclusiones. También podrás comparar documentos y reconocer qué parte de una colección se revisó realmente. La ampliación enseña cómo conservar y repetir un procedimiento sobre volúmenes mayores.

No necesitas escribir código para empezar. Necesitas poder abrir archivos, comparar una salida con su fuente y explicar una decisión. Si una herramienta no puede ejecutar el análisis, pide que el informe conserve el pendiente y consulta otra herramienta autorizada; no presentes su explicación como un cálculo realizado.

## 2. Organiza tu carpeta y el tiempo

Conserva cuatro grupos de archivos: originales, datos preparados, resultados y documentación. No reemplaces la descarga original. Pide a la IA conservar la fecha y el nombre del conjunto con cada resultado para distinguir versiones.

| Trabajo de la ruta inicial | Tiempo sugerido |
| --- | ---: |
| Pregunta, fuente y herramienta | 1 hora |
| Descarga, diccionario e inspección | 2 horas |
| Primer análisis con chat web | 2 horas |
| Planetas y estrellas | 2 horas |
| Población, temperatura y sismos | 2 horas |
| Documentos con referencias | 2 horas |
| Presentación y revisión | 1 hora |

En los bloques con varios casos, observa todos los ejemplos y resuelve una variante delimitada. Puedes profundizar en los demás a tu ritmo. El instructor puede ajustar la distribución según acceso y experiencia sin confundirla con el horario del programa principal.

## 3. Sigue un procedimiento común

1. **Entrega el encargo.** Pide a la IA precisar la comparación, qué representa una fila, población, periodo y unidades. «¿Cómo cambia la población de tres países?» todavía necesita años y fuente.
2. **Encarga la preparación.** La IA usa los archivos del paquete y conserva consulta, versión, fecha y condiciones de uso. Si se amplía la fuente, debe obtenerla por una vía permitida y comprobar que sea una descarga válida.
3. **Inspecciona.** Pide columnas, tipos, filas, fechas, faltantes y duplicados. Compara varias filas con el original. Conserva los códigos como texto cuando sus ceros o longitud sean relevantes.
4. **Revisa la preparación.** Pide a la IA las reglas para fechas, unidades y valores ausentes, junto con original, transformación, conteos y motivos de exclusión. Un vacío no es cero; un extremo no es automáticamente un error.
5. **Visualiza.** Pide gráfico y tabla equivalente. Revisa una marca, un filtro y una cifra. Título, ejes, fuente, periodo y denominador deben coincidir con la pregunta.
6. **Valida y descarga.** Pide una comprobación independiente y contrasta su referencia. La IA entrega fuentes, reglas, conversación, código cuando exista, resultados y límites; deja pendientes las revisiones humanas no observadas.

Instrucción inicial para el chat:

> Examina el archivo antes de calcular. Explica qué representa cada fila, muestra las columnas y sus unidades e informa el total de registros, los faltantes y los identificadores repetidos. Muéstrame tres filas de control. No elimines ni completes datos. Si no puedes leer todo, indica qué revisaste y qué falta.

Después de revisar la respuesta:

> Responde esta pregunta con la tabla revisada. Explica los filtros y cálculos. Entrega un gráfico adecuado, la tabla que lo alimenta y una descripción textual. Incluye unidades, periodo, fuente y observaciones válidas. Separa lo que muestran los datos de lo que no permiten concluir. Conserva el procedimiento para repetirlo.

## 4. Elige la herramienta por la tarea

| Necesidad | Ruta | Evidencia que debes conservar |
| --- | --- | --- |
| Explorar una tabla acotada sin programar | ChatGPT o Gemini con análisis de archivos disponible | Archivo leído, tabla calculada, gráfico y comprobación. |
| Repetir un análisis sobre una carpeta | Codex o Antigravity | Plan, cambios, comandos, pruebas y resultados regenerados. |
| Entender cada cálculo | Jupyter o Google Colab | Cuaderno ejecutado en orden, entradas y salidas. |
| Comparar fuentes documentales | NotebookLM o chat con archivos; preparación por lotes con un agente | Inventario, citas comprobadas, matriz de evidencia y pendientes. |
| Revisar números de forma independiente | Excel, Sheets, Calc o calculadora | Fórmula, celdas o cantidades que corroboran el resultado. |

Abre en la web [los recorridos por herramienta](../../index.html#lab-herramientas). Cada uno explica qué entregar, qué pedir y cómo reconocer un error. La disponibilidad de funciones depende de cuenta, versión y organización. Tener los archivos en el computador no significa que el modelo de IA funcione sin conexión.

### Ruta breve para comprobar un CSV en Excel

El libro de práctica ya incluye una hoja de inicio, tablas filtrables, fórmulas y gráficos donde aportan a la lectura. Usa una copia de trabajo y conserva intactos el CSV y el original JSON.

1. En Excel, abre **Datos > Desde texto/CSV** y elige el CSV. Revisa la codificación UTF-8, el separador y la vista previa antes de cargar. Si tu versión muestra otros nombres, busca la opción para importar desde texto o CSV.
2. En la vista previa, comprueba que cada campo quede en su columna. Define como texto los códigos que deban conservar ceros iniciales; revisa que las fechas y los números se interpreten como valores y no como texto.
3. Carga el conjunto como tabla. Usa los filtros de sus encabezados para elegir país, fecha o categoría. Anota los criterios y compara el número de filas visibles con el archivo fuente.
4. Calcula en celdas aparte y conserva la fórmula. Para comparar dos años, usa `(valor final − valor inicial) / valor inicial × 100`; deja el resultado pendiente si falta un extremo o el inicial es cero. En población, no sumes años: cada fila representa un país en un año.
5. Inserta un gráfico desde la tabla filtrada solo si ayuda a responder la pregunta. Incluye título, unidad, periodo y fuente; comprueba un punto o barra frente a su fila y presenta también la tabla o una descripción breve.
6. Guarda el resultado como un archivo nuevo `.xlsx`. Registra el origen, los filtros, las fórmulas y los límites para que otra persona pueda repetir la comprobación.

Para consultas repetidas, Power Query puede importar y aplicar los mismos pasos de limpieza sin sobrescribir el archivo de origen. Revisa la vista previa y los tipos antes de actualizar: una transformación reproducible también puede estar mal configurada.

## 5. Cinco prácticas con una finalidad diferente

### A. Planetas y estrellas anfitrionas

Abre `datos/exoplanetas.csv`. Una fila representa un planeta. La selección incluye detecciones por tránsito hasta 2024, con radio y periodo positivos y sin las banderas de límite especificadas en la consulta. Es una selección del catálogo, no una muestra aleatoria del universo. El corte de descubrimiento no impide revisiones posteriores de los parámetros.

En [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/), localiza la tabla de sistemas planetarios y su diccionario. Reconoce `pl_name`, `hostname`, `pl_rade`, `pl_orbper`, `st_teff` y `st_rad`. Reproduce los filtros del manifiesto y descarga una copia nueva si quieres comparar versiones.

Pide a la IA un histograma de radio en radios terrestres y una dispersión de periodo en días frente a radio. Pide que compare escala lineal y logarítmica e informe valores omitidos. Para estudiar estrellas, encarga al agente el conteo de anfitrionas y la regla para parámetros discrepantes; no multipliques el peso de una estrella por su cantidad de planetas. El archivo inicial no incluye columnas de incertidumbre: para dibujar barras de error necesitas ampliar la consulta y leer sus definiciones.

**Entrega:** dos gráficos planetarios, una revisión de anfitrionas y una conclusión sobre la selección. Pide a la IA el archivo de salida según [ficha-nasa.md](../../materiales/analisis-datos/fichas/ficha-nasa.md).

### B. Población y territorio

Abre `datos/poblacion.csv`: Colombia, Perú y Ecuador, 2000–2024, indicador `SP.POP.TOTL` del Banco Mundial. Una fila corresponde a país y año; la unidad es personas. No sumes años como si fueran personas distintas.

En la [ficha oficial del indicador](https://data.worldbank.org/indicator/SP.POP.TOTL), selecciona países y periodo y revisa metadatos y descarga. Pide a la IA las líneas y el cambio entre dos años comunes: `(valor final − valor inicial) / valor inicial × 100`. Si falta alguno de los extremos o el inicial es cero, informa que esa operación no puede realizarse así.

La ampliación colombiana usa `datos/piramide-santander-2024.csv`: edades, hombres y mujeres de Santander en 2024, área total, según la proyección del DANE actualizada en 2025. La edad 100 reúne 100 años y más. Abre [proyecciones del DANE](https://www.dane.gov.co/index.php/estadisticas-por-tema/demografia-y-poblacion/proyecciones-de-poblacion), localiza el anexo del manifiesto y contrasta el extracto. Estos campos no están en el CSV internacional: son otra tabla y otra fuente. No presentes una proyección como un conteo observado ni compares versiones distintas sin explicar sus diferencias.

**Entrega:** evolución, comparación porcentual y nota de comparabilidad. Pide a la IA el archivo de salida según [ficha-poblacion.md](../../materiales/analisis-datos/fichas/ficha-poblacion.md).

### C. Temperatura y precipitación

Abre `datos/clima.csv`: consulta NASA POWER para coordenadas de Bogotá durante 2024. La serie usa hora solar local (LST), que no es la hora civil de Colombia. Corresponde a un producto de rejilla, no a una estación instalada en esa dirección.

En [NASA POWER](https://power.larc.nasa.gov/), localiza el visor, selecciona punto, periodo, frecuencia diaria y variables. Guarda metadatos y unidades. El manifiesto explica la transformación de `T2M` a `temperatura_c` y de `PRECTOTCORR` a acumulados diarios de `precipitacion_mm`.

Pide a la IA temperatura por fecha, distribuciones por mes y precipitación resumida con la operación adecuada a su unidad. Comprueba los días válidos que informa antes de comparar. El año sirve para explorar variación durante el periodo; no demuestra una tendencia climática de largo plazo.

**Entrega:** serie, comparación mensual y registro de cobertura. Pide a la IA el archivo de salida según [ficha-clima.md](../../materiales/analisis-datos/fichas/ficha-clima.md).

### D. Sismos

Abre `datos/sismos.csv`: catálogo global USGS, enero de 2024 en UTC, eventos de tipo `earthquake` y magnitud de al menos 5. Identifica `id`, fecha, coordenadas, profundidad, magnitud y tipo de magnitud.

En el [catálogo USGS](https://earthquake.usgs.gov/fdsnws/event/1/), conserva fechas, región y umbral de la consulta. Si amplías el volumen, divide la consulta en ventanas y verifica sus límites y los identificadores; no aceptes una respuesta truncada como completa.

Encarga a la IA el mapa de puntos, el histograma de profundidades y la comparación de conteos por periodo con el mismo criterio de selección. La magnitud no es la intensidad percibida ni una medida directa del daño. Estos gráficos no predicen dónde ocurrirá el próximo sismo.

**Entrega:** mapa con tabla equivalente, distribución y límites. Pide a la IA el archivo de salida según [ficha-sismos.md](../../materiales/analisis-datos/fichas/ficha-sismos.md).

### E. Documentos extensos

Usa el inventario y los enlaces del paquete documental para obtener informes oficiales del DANE. Empieza por metodología general, actualizaciones y notas técnicas. Compara pregunta, periodo, fuentes, supuestos y cambios entre versiones. Los documentos históricos se leen como antecedentes, no como instrucciones vigentes.

Encarga primero a la IA el inventario de archivos y páginas. Pide después la extracción y una matriz con: afirmación, documento, versión, página, evidencia breve, estado y revisión. Distingue número de página del archivo y número impreso cuando sean distintos. Comprueba cada cita en el original.

El archivo [Metodología general de proyecciones](https://www.dane.gov.co/files/censo2018/proyecciones-de-poblacion/Documento-metodologico-proyecciones.pdf) contiene en su segunda página una restricción de reproducción. El laboratorio entrega enlaces y fichas originales; no incluye ese PDF en los paquetes. No des por hecho que un resumen bibliográfico contiene todo el documento ni que una búsqueda sin resultados prueba ausencia de información.

**Entrega:** inventario, matriz y síntesis con cobertura declarada. Pide a la IA el archivo de salida según [ficha-documentos.md](../../materiales/analisis-datos/fichas/ficha-documentos.md).

## 6. Representa sin deformar

| Pregunta | Gráfico | Comprobación esencial |
| --- | --- | --- |
| Comparar grupos | Barras o puntos | Unidad, periodo, denominador y rango. |
| Seguir cambios | Líneas | Orden temporal, vacíos y frecuencia. |
| Examinar distribución | Histograma, caja y puntos | Intervalos, mediana, extremos y tamaño de grupo. |
| Relacionar variables | Dispersión | Escala, ausencias, concentración y sesgo. |
| Examinar composición | Barras al 100 % o pirámide | Categorías, grupos y total de referencia. |
| Ubicar eventos | Mapa y tabla | Coordenadas, cobertura y geometría. |
| Comparar combinaciones | Mapa de calor o pequeños múltiples | Misma escala y faltantes identificados. |
| Mostrar incertidumbre | Bandas o intervalos | Fuente o método de los límites. |

Una escala logarítmica facilita comparar razones cuando el rango es amplio; debes declararla y tratar ceros y negativos. No uses perspectiva 3D como decoración. La visualización debe ofrecer etiquetas, descripción, tabla, contraste y operación con teclado; la información no puede depender únicamente del color o del puntero.

## 7. Profundiza con una pregunta delimitada

La [ruta avanzada en la web](../../index.html#lab-avanzado) explica descripción, incertidumbre, regresión, PCA, agrupamiento, series, geografía y procesamiento por lotes. Cada método exige una decisión y una comprobación, no solo pedir al asistente que lo aplique.

- **Estadística:** distingue dispersión y error de estimación. Conserva tamaños de grupo y supuestos; una muestra grande también puede estar sesgada.
- **Modelos:** separa entrenamiento y evaluación antes de aprender transformaciones. Compara contra una referencia sencilla y revisa errores. Asociación no demuestra causalidad.
- **Tiempo:** reserva fechas futuras respecto del entrenamiento. No mezcles al azar los datos temporales ni calcules transformaciones usando información del tramo reservado.
- **Territorio:** comprueba códigos, geometrías y año. Un promedio territorial no describe a cada individuo.
- **Volumen:** encarga al agente medir bytes, tiempo y registros, seleccionar columnas y periodos y procesar por lotes con Parquet/DuckDB cuando corresponda. Nunca sustituyas una falla por otro conjunto sin declararlo.
- **Documentos:** pide al agente conservar las páginas procesadas, fallidas y pendientes. Revisa extracción y citas. Una búsqueda por fragmentos no certifica lectura exhaustiva.

En [catálogos para ampliar](../../index.html#lab-catalogos) encontrarás pasos para Gaia de ESA, NASA Earthdata, NOAA GHCN Daily y NASA NTRS. Gaia requiere elegir consulta y variables; Earthdata, producto y calidad; NOAA, estación y unidades; NTRS, documentos con acceso al texto. Los catálogos completos no son requisitos de descarga.

## 8. Revisa tu entrega

Entrega a la IA la estructura de la [ficha de análisis](../../materiales/analisis-datos/fichas/ficha-analisis.md) y el [registro de ejecución](../../materiales/analisis-datos/fichas/registro-ejecucion.csv). La entrega reúne una pregunta, fuente, procedimiento, resultado visual accesible, comprobación y límites. Pide que proponga una pregunta posterior compatible con las fuentes disponibles.

Antes de cerrar, verifica que otra persona pueda identificar la versión del archivo, reproducir un cálculo y volver a la evidencia de una afirmación. Si una parte no se ejecutó, déjala explícita. Este producto complementario no sustituye las evidencias curriculares ni genera por sí solo un juicio institucional.
