# Lee documentos, localiza evidencia y registra lo pendiente

Estas fichas y plantillas se prepararon para aprender a analizar documentación. Las fuentes enlazadas son publicaciones oficiales. El conjunto reúne diez documentos y 293 páginas; no constituye una revisión sistemática ni una selección representativa de toda la investigación sobre población y temperatura.

## Qué contiene el paquete

- `manifiesto.csv`: diez fuentes con URL de ficha, URL de PDF, edición, idioma, páginas, condiciones de uso y alcance de revisión.
- `inventario.csv`: estado inicial de acceso, extracción y lectura que la IA actualiza en una copia según los archivos realmente procesados.
- `matriz-evidencia.csv`: estructura de referencia para que la IA genere afirmaciones y referencias, sin pedir al aprendiz que llene filas.
- `ejemplo-verificado.csv`: tres paráfrasis breves comprobadas en páginas originales del DANE.
- `fuentes-nasa/`: tres PDF sin modificaciones, cuyos registros NTRS indican uso público permitido. Conserva autores, créditos y condiciones de cada original.

Los PDF DANE no se redistribuyen. La metodología de 2021 exige autorización para su reproducción total o parcial en la página 2. Usa los enlaces oficiales para consultar los originales. Las otras publicaciones se enlazan o incluyen según lo registrado; no interpretes el acceso público como una autorización general para cualquier uso o carga en servicios externos.

La columna `sha256` identifica una copia comprobada. Para DANE corresponde al archivo consultado durante la preparación, aunque no se incluya; para los PDF NASA incluidos corresponde a sus bytes. Los otros enlaces NASA no tienen hash guardado. Un hash permite detectar cambios, pero no certifica la calidad del contenido.

## En tres pasos

1. **Entrega el encargo.** Descarga el [paquete documental](../../ia/lab-documentos.zip), adjunta las fuentes permitidas y copia [ENCARGO-CHAT.md](../../ia/lab-documentos/ENCARGO-CHAT.md). En Antigravity o Codex, abre la carpeta y copia [ENCARGO-IDE.md](../../ia/lab-documentos/ENCARGO-IDE.md). Los PDF con restricciones se consultan desde sus enlaces oficiales.
2. **Revisa lo generado.** La IA genera el inventario, la matriz de evidencia, la comparación de versiones y la síntesis, con documento, edición y página por afirmación. Abre dos referencias originales y pide los ajustes en la misma conversación. No necesitas transcribir citas ni llenar la matriz.
3. **Descarga y conserva.** Pide los archivos, el registro de cobertura y `resultado.json` para `LAB-A01`. Recibe el JSON en «Guarda tu evidencia» y guarda tras revisar la vista. La revisión humana no realizada permanece pendiente; el análisis de fragmentos no demuestra revisión integral.

## Primera lectura en español

### DANE-MET-2021: metodología general

Abre [Metodología general de proyecciones de población y estudios demográficos (PPED)](https://www.dane.gov.co/files/censo2018/proyecciones-de-poblacion/Documento-metodologico-proyecciones.pdf), de marzo de 2021. Tiene 106 páginas.

Pregunta de lectura: ¿qué componentes usa para describir el cambio poblacional? Localiza la introducción en la página PDF 5. La afirmación E01 resume el enfoque y conserva la edición. Revisa después el contenido para ubicar diseño estadístico, fuentes y procesamiento. No atribuyas a esta edición los cambios publicados posteriormente.

### DANE-ACT-POSTCOVID: actualización de 2023

Abre [Nota metodológica actualización general de proyecciones de población y estimaciones demográficas (POST COVID19)](https://www.dane.gov.co/files/censo2018/proyecciones-de-poblacion/Nota-metodologica-actualizacion-proyecciones-ActPostCOVID.pdf), de marzo de 2023. Tiene 23 páginas.

Pregunta de lectura: ¿cómo compara las fuentes para migración interna? Revisa la página PDF 14, que también tiene el número impreso 14. La afirmación E02 identifica las cuatro fuentes de la tabla 1. Lee sus columnas antes de resumir: la presencia de una fuente no significa que tenga la misma calidad o representatividad que las demás.

### DANE-NOTA-2025: actualización posterior

Abre [Proyecciones de población. Actualización 2025](https://www.dane.gov.co/files/censo2018/proyecciones-de-poblacion/Nacional/NotaTecnica-PPED-jul2025.pdf), de julio de 2025. Tiene 28 páginas.

Pregunta de lectura: ¿qué resultado futuro presenta y bajo qué edición? Revisa la página PDF 27, con número impreso 27. La afirmación E03 registra un máximo poblacional proyectado en 2043 y un horizonte hasta 2070. El lenguaje debe conservar la palabra «proyectado»; no conviertas un escenario en un hecho observado.

## Ampliación NASA: instrumentos, modelos y datos ambientales

Cada fila del manifiesto enlaza una ficha NTRS y un PDF. Los títulos originales se conservan en inglés; las preguntas siguientes orientan la lectura en español. Puedes pedir traducción de un fragmento, pero verifica unidades, siglas y nombres de instrumentos en el original.

| Identificador | Páginas | Pregunta de lectura | Acceso en este paquete |
| --- | ---: | --- | --- |
| NASA-20240004645 | 12 | ¿Qué observaciones se comparan con la simulación de temperaturas atmosféricas? | Enlace oficial |
| NASA-20240012020 | 19 | ¿Cómo difieren las caracterizaciones de temperatura superficial? | Enlace oficial |
| NASA-20240000673 | 56 | ¿Qué variables pretende medir el receptor lidar y qué supuestos usa? | PDF incluido |
| NASA-20240015083 | 22 | ¿Cómo se relacionan temperatura superficial y detección de nubes? | Enlace oficial |
| NASA-20240008072 | 16 | ¿Cómo presenta la aplicación los datos ambientales de misiones espaciales? | Enlace oficial |
| NASA-20240014707 | 1 | ¿Qué muestra el póster y qué detalles metodológicos no caben en él? | PDF incluido |
| NASA-20240005581 | 10 | ¿Qué procedimiento combina información de varios sensores? | PDF incluido |

Las preguntas son propuestas de trabajo. La preparación comprobó accesibilidad y páginas; no revisó exhaustivamente las conclusiones de los siete documentos. La página 3 del documento NASA-20240008072 se inspeccionó visualmente como ejemplo de una presentación con información gráfica. No se incluyó una afirmación científica de ese documento en la matriz verificada.

Para ampliar el conjunto, pide a la IA un inventario temático en [NTRS](https://ntrs.nasa.gov/). Revisa tipo de documento, fecha y derechos en la ficha y el apartado `Available Downloads`. El [servicio oficial](https://ntrs.nasa.gov/api/openapi/) permite automatizar búsqueda y metadatos. La IA debe descargar por lotes razonables y conservar los archivos fallidos como pendientes, sin inventar acceso.

## Revisa tres criterios de la matriz generada

- **Referencia localizable.** La IA debe generar una afirmación breve por evidencia, con identificador exacto del manifiesto, versión, enlace y sección, tabla o figura. `pagina_pdf` cuenta desde la primera hoja; `pagina_impresa` conserva el número visible o su ausencia. No se presume que coincidan. El fragmento `#page=14` abre una página en visores compatibles.
- **Soporte y sentido.** Revisa dos páginas completas con título, unidades, notas, población y periodo. La salida debe distinguir observación, paráfrasis metodológica, hipótesis, proyección e interpretación; una cita cercana no respalda automáticamente una afirmación.
- **Límite y honestidad.** Pide a la IA corregir la matriz sin inventar páginas ni comprobaciones humanas. Una afirmación sin respaldo queda pendiente o no encontrada; ese estado no equivale a falsa. La explicación debe declarar el alcance de la búsqueda.

Las tres afirmaciones de ejemplo se revisaron con extracción de texto y representación visual de las páginas originales el 18 de octubre de 2026. Son paráfrasis, no citas textuales extensas. El ejemplo demuestra cómo registrar evidencia; no acredita una lectura completa de las tres publicaciones.

## Cómo escalar el proceso

**Inventario:** la IA asigna identificadores estables, detecta duplicados y separa versiones. Genera conteos de documentos esperados, disponibles y excluidos con motivo, conservando URL y fecha de consulta.

**Legibilidad y OCR:** la IA prueba la extracción por página y aplica reconocimiento óptico de caracteres a una copia cuando corresponda. Tú verificas cifras, signos negativos, columnas, encabezados y notas. Un texto vacío puede indicar página sin contenido o extracción fallida; debe quedar pendiente hasta comprobarlo.

**Extracción y segmentación:** la IA guarda texto con documento, página y sección, y conserva tablas y figuras con sus títulos y notas. Divide por apartados coherentes, sin separar una explicación de su unidad o denominador.

**Consulta:** la IA comienza con términos y filtros del inventario y puede añadir búsqueda por significado. Debe entregar evidencia localizable. Una revisión exhaustiva requiere recorrer todos los documentos y comunicar su cobertura; recuperar fragmentos relevantes no demuestra cobertura total.

**Validación:** revisa una muestra con documentos largos, escaneados, tablas y varios idiomas, y contrasta las cifras que sustentan el informe. Pide a la IA incorporar al registro los errores detectados y las páginas pendientes, sin atribuirse esa revisión.

**Visualización:** pide a la IA gráficos por año o tipo, cobertura de extracción y temas por documento, con tablas equivalentes. La matriz de temas debe distinguir presencia, ausencia comprobada, no revisado y fallo de extracción. El número de menciones no es una medida automática de calidad científica.

## Comprobaciones del conjunto

- Deben existir diez identificadores distintos en el manifiesto.
- La suma de páginas debe ser 293; tres PDF incluidos suman 67 páginas.
- Los archivos incluidos deben conservar el hash registrado.
- Cada afirmación del ejemplo debe referir un identificador existente y una página dentro de su documento.
- El inventario inicial deja la extracción completa pendiente. No lo marques como terminado sin ejecutar y revisar ese trabajo.
- El número de documentos descargados, extraídos y revisados debe comunicarse por separado.

Para continuar, usa el encargo preparado del paquete y las instrucciones de herramientas. La comparación de fuentes de migración o de métodos de medición de temperatura requiere una pregunta delimitada y evidencia localizable; la IA no debe prometer analizar todo sin declarar su cobertura.
