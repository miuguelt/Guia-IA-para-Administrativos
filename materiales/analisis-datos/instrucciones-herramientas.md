# Trabaja con datos oficiales y conserva la evidencia

Este material pertenece al laboratorio independiente de análisis de datos. Los archivos numéricos son extractos de fuentes públicas oficiales; las preguntas y los recorridos se prepararon para aprender. Consulta la procedencia de cada archivo antes de reutilizarlo. Usa únicamente los archivos públicos de la práctica en las herramientas externas.

## En tres pasos

1. **Entrega el encargo preparado.** Descarga el paquete de [NASA](../ia/lab-nasa.zip), [población](../ia/lab-poblacion.zip), [clima](../ia/lab-clima.zip), [sismos](../ia/lab-sismos.zip) o [documentos](../ia/lab-documentos.zip). Adjunta sus fuentes al chat autorizado y copia ENCARGO-CHAT.md; en Antigravity o Codex, abre la carpeta y copia ENCARGO-IDE.md. Conserva las carpetas y los originales.
2. **Revisa la producción de la IA.** La IA genera inspección, tablas, gráficos o matriz de evidencia, conclusión, procedimiento y documento. La pregunta y los productos están definidos en el paquete. Contrasta una cifra o cita con el original y solicita los ajustes en la misma conversación; no necesitas escribir ni transcribir respuestas.
3. **Descarga los archivos.** Pide los resultados y `resultado.json` para `LAB-A01`. Recibe ese JSON en «Guarda tu evidencia», revisa la vista y guarda el borrador. La revisión humana no realizada permanece pendiente; una importación no es aprobación institucional.

No necesitas usar todas las herramientas. Las opciones siguientes amplían el procedimiento del encargo; la IA ejecuta los cálculos y prepara los documentos.

## ChatGPT o Gemini en el navegador

Adjunta el CSV y su documentación mediante el control de archivos. Pide una inspección de columnas, unidades, fechas, duplicados y valores ausentes. Verifica tres filas antes de solicitar una conclusión. Si tu cuenta no ejecuta cálculos sobre archivos, usa el cuaderno de la práctica.

Instrucción inicial:

```text
Describe los archivos adjuntos y verifica su estructura. Indica qué representa cada
fila, las unidades, el periodo, los duplicados y los valores ausentes. Muéstrame tres
filas identificadas para compararlas con el original. Después responde mi pregunta
con una tabla calculada y un gráfico. Explica filtros y fórmulas. No inventes valores.
```

Pide una figura adecuada para la pregunta: barras para comparar categorías, líneas para tiempo, histograma para distribución y dispersión para relaciones. Solicita el dato calculado detrás de cada punto o barra. Descarga la tabla, la imagen y el procedimiento; conserva las decisiones que tomaste durante el chat.

Para explorar con controles, pide zoom, filtros y una tabla equivalente. Comprueba que los controles modifiquen tanto el gráfico como el conteo. La disponibilidad de visualizaciones depende de la cuenta y la superficie.

Fuentes: [archivos en ChatGPT](https://learn.chatgpt.com/docs/artifacts-viewer), [visualizaciones en ChatGPT](https://learn.chatgpt.com/docs/visualizations), [archivos y gráficos en Gemini](https://support.google.com/gemini/answer/14903178?hl=es-419).

## Codex en una carpeta local

1. Abre la carpeta del paquete en un chat del proyecto y copia ENCARGO-IDE.md. La IA identifica datos, cuaderno y herramientas; una imagen adjunta no concede acceso a toda una carpeta.
2. Pide a la IA ejecutar el plan, el programa o el cuaderno y repetirlo desde los originales en un entorno reiniciado. Revisa exclusiones, unidades y cualquier comando que solicite autorización, con su carpeta de destino.
3. Abre los archivos generados, contrasta tres resultados con las entradas y descarga código, documentos y respaldo JSON. Un paso que no se haya ejecutado debe quedar pendiente.

```text
Analiza los datos de esta carpeta y conserva los originales. Prepara un cuaderno
o programa que pueda ejecutar de nuevo. Documenta columnas, unidades, filtros
y tratamiento de valores ausentes. Crea las figuras y una tabla de control.
Ejecuta comprobaciones con aserciones sobre filas, fechas y cálculos.
Entrega los archivos resultantes e indica cualquier paso que no se haya ejecutado.
```

Para NASA, usa el archivo `exoplanetas.csv` y `01-exoplanetas.ipynb`. Compara radio y periodo orbital; revisa los valores positivos antes de usar una escala logarítmica. El conjunto de práctica contiene detecciones por tránsito, por lo que no sirve para comparar la frecuencia de todos los métodos de descubrimiento.

Fuentes: [aplicación](https://learn.chatgpt.com/docs/app), [archivos y visores por superficie](https://learn.chatgpt.com/docs/artifacts-viewer).

## Antigravity

1. Abre la carpeta de clima en Antigravity y copia ENCARGO-IDE.md. Pide al agente localizar `clima.csv`, su documentación y el entorno de ejecución; los controles dependen de la superficie disponible.
2. La IA ejecuta el análisis y corrige los errores antes de interpretar los datos. Revisa media mensual de temperatura, suma de precipitación y conteo de días válidos.
3. Abre figuras y tablas, comprueba filtros, fechas y ejes, y descarga el código y los resultados. La IA debe indicar si el HTML depende de recursos externos.

```text
Analiza clima.csv. Identifica el periodo, las coordenadas, la escala temporal
y la procedencia de los valores. Calcula temperatura media y precipitación
acumulada por mes, con días válidos. No conviertas datos ausentes en cero.
Crea dos paneles, una tabla y un filtro por fechas. Guarda el código y comprueba
los resultados. Explica el alcance de una serie de un año para estudiar el clima.
```

La documentación distingue varias superficies de Antigravity; los controles exactos dependen de la versión. Un artefacto puede ser un plan o una visualización. Verifica que el resultado gráfico provenga del archivo calculado y no sea una ilustración del resultado esperado.

Fuentes: [agente](https://antigravity.google/docs/agent/), [artefactos visuales](https://antigravity.google/blog/visualizing-with-the-help-of-antigravity).

## Jupyter y Colab

Elige uno de los cuadernos incluidos: `01-exoplanetas.ipynb`, `02-poblacion.ipynb`, `03-clima.ipynb` o `04-sismos.ipynb`. Conserva los CSV junto con la estructura de carpetas que espera el cuaderno.

En Colab, abre la opción de subir un cuaderno y carga el `.ipynb` preparado por la IA. Sube también sus archivos de datos: el cuaderno no arrastra automáticamente los archivos vecinos. Si la ruta difiere, pide a la IA el cuaderno corregido; no necesitas editar código.

En Jupyter, abre el cuaderno desde la carpeta del paquete y selecciona el entorno de Python preparado. Pide al agente del IDE ejecutarlo desde la primera celda y comprobar dependencias. Ante un archivo no encontrado, debe revisar nombre y ubicación antes de cambiar la lógica.

Para ampliar la práctica, pide a la IA otra selección del filtro y una explicación de la diferencia; contrasta ambos resultados con sus tablas. La IA debe repetir todo en una sesión reiniciada para detectar dependencias ocultas entre celdas. Descarga el cuaderno ejecutado y los resultados; los archivos de una sesión temporal de Colab pueden desaparecer.

Fuentes: [Jupyter](https://jupyter.org/), [Colab](https://research.google.com/colaboratory/faq.html).

## Documentos y citas

Abre `documentos/manifiesto.csv`. El conjunto de lectura tiene diez referencias; algunos PDF se obtienen desde el enlace oficial. No cargues un documento en un servicio externo si sus condiciones no permiten ese uso. Las fichas de trabajo y las plantillas son materiales propios del módulo.

Para una primera práctica, lee las tres fuentes DANE en el visor oficial y compara las afirmaciones de `ejemplo-verificado.csv`. La página se cuenta desde la primera hoja del PDF; también se registra el número impreso cuando existe. Conserva la edición del documento: una proyección publicada en 2025 describe un escenario, no una observación del futuro.

Para usar NotebookLM, que la documentación actual denomina Gemini Notebook, crea un cuaderno y agrega las fuentes permitidas del encargo documental. Pide a la IA la tabla con afirmación, documento, página, cita y limitación. Abre cada cita y revisa la página original. Si la respuesta no tiene apoyo, pide a la IA conservar `no encontrado`. Un resumen no certifica que se haya revisado cada página.

```text
Usa únicamente las fuentes seleccionadas. Compara sus métodos, periodos,
variables y limitaciones. Para cada afirmación indica documento y página;
si el visor no da página, indica sección y un fragmento que pueda localizar.
Separa resultados observados, supuestos y proyecciones. Registra no encontrado
cuando no haya respaldo y no combines cifras de ediciones distintas.
```

Para cientos de documentos, encarga a Codex o Antigravity el inventario, la detección de páginas sin texto, el reconocimiento óptico de caracteres (OCR) cuando corresponda y la extracción por página. La IA conserva originales, texto y fallos, y segmenta por secciones con identificador de documento. Los fragmentos sirven para explorar; una pregunta exhaustiva requiere recorridos completos y conteos verificables que tú puedas comprobar.

Fuentes: [citas y selección de fuentes](https://support.google.com/gemininotebook/answer/16179559?hl=es-419), [cuadernos y exportación](https://support.google.com/gemininotebook/answer/16206563?hl=es-419), [OCRmyPDF](https://ocrmypdf.readthedocs.io/en/latest/introduction.html).

## Revisa tres criterios

- **Fuente y cobertura.** La pregunta coincide con alcance, unidad y periodo; la consulta, los originales, las exclusiones y los datos ausentes están identificados.
- **Comprobación y representación.** Puedes contrastar tres resultados con datos o páginas originales. Los gráficos tienen título, ejes, unidades, fuente y tabla equivalente; el procedimiento permite repetirlos.
- **Conclusión y revisión.** La explicación distingue descripción, asociación, hipótesis y causalidad. Los fallos y la revisión humana que no haya ocurrido siguen pendientes; la IA no acredita esas acciones.

Para herramientas visuales adicionales, consulta la sección web de herramientas. Excel y Power Query ayudan con tablas y pasos de limpieza; Power BI conecta varias vistas; OpenRefine sirve para revisar categorías. pandas procesa tablas, DuckDB consulta archivos grandes y Parquet facilita lecturas por columnas. Plotly y Altair permiten exploración interactiva; Matplotlib permite preparar figuras exportables. Elige según la tarea y conserva siempre los datos calculados.
