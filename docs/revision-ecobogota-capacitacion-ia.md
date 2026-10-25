# EcoBogotá · capacitación con IA

Actualización: 24 de octubre de 2026.

La práctica permite crear un video, una infografía editable en Canva o una simulación de oficina. El aprendizaje consiste en dar contexto y fuentes a la IA, evaluar una primera versión, solicitar ajustes y conservar un recurso útil. El diagnóstico, la predicción y el puntaje del simulador anterior dejaron de ser requisitos.

## Recorrido y contratos

Los cuatro pasos son comprender el encargo, elegir el formato y preparar la solicitud, crear y mejorar, y verificar y conservar. Cada ruta tiene su paquete autosuficiente, un encargo para chat, uno para IDE, ilustraciones didácticas y tres comprobaciones. Las solicitudes que se copian en la web se incorporan desde el catálogo canónico durante la construcción.

ECO-A02 conserva `contexto`, `encargo`, `material` y `verificacion`. La importación genera un borrador; la revisión requiere una acción posterior del aprendiz. El recurso multimedia se conserva por separado del informe y del respaldo estructurado. Un guion o diseño se identifica como preparación pendiente de producción cuando la herramienta no puede producir el recurso final.

ECO-A01 conserva sus identificadores y datos anteriores. No tiene un formulario de edición en el recorrido actual: sus registros se consultan en el portafolio y el resumen histórico se lee sin escribir en el almacenamiento. Una estación histórica oculta e inerte conserva la compatibilidad del SDK y sus respaldos; no ofrece un receptor ni controles de edición al aprendiz. La sincronización del receptor usa las estaciones montadas, de modo que la consulta histórica no desplace el destino de ECO-A02 o LAB-A01.

La práctica sigue siendo complementaria. MG-A01 a MG-A05, su porcentaje de avance y su alcance curricular se conservan.

## Imágenes, fuentes y límites

Se retiró la fotografía decorativa del recorrido y del paquete actualizado. Las diez ilustraciones de residuos quedan como referencias consultables. El texto explica que los criterios proceden de las fuentes y que el programa local de aprovechamiento de orgánicos no está confirmado.

La generación ocurre en la herramienta elegida por el aprendiz. La guía incluye un ejemplo autónomo de simulación, generado con IA y comprobado mediante pruebas automatizadas, con revisión humana pendiente. No genera un video ni un diseño de Canva y no acredita una ejecución externa del aprendiz. Los encargos piden declarar las limitaciones reales y separar la autocomprobación de la IA de la revisión humana.

## Verificación reproducible

- `npm run build`: regenera los 30 paquetes, la web y los documentos de lectura.
- `npm run check:redaccion` y `npm test`: redacción, contratos, importación, errores, borradores, revisión, descargas y conservación de registros.
- `npm run test:coverage:all`: compuerta del 100 % de funciones de producción JavaScript.
- `npm run test:browser:eco`: las tres rutas en 320, 390, 768, 1440, 1920 y 2560 px; zoom al 200 % desde 768 px, equivalente a un ancho mínimo de 384 CSS px. Incluye teclado, carga de imágenes, texto completo y estados de recepción. Guarda capturas y mediciones en `output/revision-eco/visual/`.
- La auditoría de composición existente también comprueba la guía independiente al 200 % desde 720 px e impresión.

La integración continua ejecuta las pruebas y publica cobertura y evidencia visual. Los resultados locales se conservan en `output/revision-eco/`; la ejecución remota queda pendiente hasta que se publique el cambio en el repositorio.
