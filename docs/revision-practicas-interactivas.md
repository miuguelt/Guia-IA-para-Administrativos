# Revisión de recursos y prácticas con fuentes

> Antecedente: este documento conserva el estado observado en su fecha de revisión. El recorrido vigente de EcoBogotá y su evidencia ECO-A02 se describen en [capacitación con IA](revision-ecobogota-capacitacion-ia.md).

Fecha de revisión: 21 de octubre de 2026.

Los cinco videos mostraban láminas con texto durante quince segundos, sin audio. La secuencia temporal no aportaba una demostración de ejecución y repetía los ejemplos escritos. Se reemplazaron por cinco prácticas locales con 31 decisiones, referencias, cálculos, ayudas y recuperación del avance.

## Decisiones por recurso

| Recurso | Decisión y utilidad |
| --- | --- |
| Solicitud de sala | Sustituir el video por decisiones sobre datos disponibles, fecha de referencia, anticipación, disponibilidad y autorización. El aprendiz corrige un borrador que aprueba sin respaldo. |
| PQRS | Sustituir el video por tres casos, un encargo construido con cuatro selectores y revisión de un borrador. El comparador y el evaluador existentes quedan como herramientas del caso. |
| Limpieza | Sustituir el video por un contraste de cinco filas y reglas ejecutables. Se conservan los originales, los vacíos y ambas ocurrencias de SIM-0012. |
| Tasa | Sustituir el video por cálculo y auditoría. Periodo ausente, cifra contradicha y causa sin respaldo tienen respuestas distintas. Se retiró el formulario antiguo cuyo enunciado no correspondía a la afirmación evaluada. |
| Contratos | Sustituir el video por selección de ocurrencia, diferencia en COP, pendientes y pregunta con fila y centro. La fila 21 se conserva por separado. |
| Ejemplos resueltos | Integrarlos como solución consultable de cada práctica. Los ejemplos de otras tareas, gráficos y medición se conservan. |
| Preguntas de cierre | Integrarlas en la cuarta etapa, con los mismos criterios y retroalimentación específica. |
| Archivos multimedia retirados | Retirar cinco MP4, cinco carteles PNG, sus referencias y el generador. Los esquemas HTML y SVG que aportan otras explicaciones se conservan. |

## Recorrido revisado

| Vistas | Resultado |
| --- | --- |
| Inicio y preparación | La portada explica la práctica con decisiones. Preparación conserva sus cinco pasos y el aviso que distingue los casos administrativos de las fuentes públicas del laboratorio. |
| M01 a M05 | Cada sección «Observa» comienza con una práctica de cuatro etapas. Los retos, las duraciones y las evidencias curriculares se conservan. Los ensayos permiten continuar con pendientes. |
| Cronograma | Explica cómo retomar las prácticas dentro de las sesiones existentes, sin añadir horas a la propuesta. |
| EcoBogotá | Se conserva el simulador de clasificación, su retroalimentación y su condición complementaria. |
| Laboratorio | Se conservan los cinco simuladores de resultados, las fuentes, filtros, unidades, localizadores y paquetes. Sus datos públicos no se presentan como registros administrativos preparados. |
| Portafolio | Distingue los intentos de práctica de MG-A01 a MG-A05. Los comparadores integrados ya no transfieren un ensayo a las evidencias. |

Se corrigieron la compresión de la cabecera en pantallas medianas y el desbordamiento de las pestañas al ampliar. La acción «Imprimir esta práctica» aísla el caso, abre sus explicaciones durante la impresión y restaura la vista después; no altera el formato institucional del portafolio.

## Guardado y comprobación

El plugin usa el registro de simuladores y el almacenamiento del SDK. Conserva respuestas, intentos, etapa, ayudas y selecciones de las herramientas. Verifica cada escritura mediante una lectura. Si el navegador impide guardar, mantiene el trabajo de la sesión e informa el fallo.

El estado «Comprobada» exige respuestas verificadas; consultar la solución no lo concede. La firma de la definición y los extractos invalida solo el caso modificado. El borrado general incluye las prácticas y conserva claves de otras guías.

Las pruebas cubren entradas incompletas, denominador cero, estados alternos, corrección de errores, conservación de filas, restauración, impresión y almacenamiento bloqueado. Los constructores comprueban las filas originales y la coincidencia entre enunciado, controles y definición evaluada.

La revisión en Chromium abarca las once vistas, ambos modos de estudio y anchos de 320, 768, 1040, 1440 y 1920 píxeles; también las etapas de las prácticas con herramientas abiertas. Comprueba recuperación después de recargar, independencia del porcentaje curricular, foco, mensajes accesibles, impresión y ampliación al 200 %. Sin JavaScript se pueden leer las veinte etapas. La revisión de accesibilidad usa controles, foco y árbol accesible del navegador; no constituye una sesión de prueba con un lector de pantalla externo.

Los registros de ejecución quedan en `output/practicas-tests-final.log`, `output/practicas-cobertura-final.log` y `output/playwright/auditoria.log`. Las pruebas forman parte de las suites existentes y de la compuerta de funciones al 100 % en CI; no se redujeron umbrales.

La compilación habitual genera web, lecturas HTML y paquetes. La actualización de Word, Excel y PDF queda en `npm run build:documents`, para una solicitud documental explícita. Esta entrega no publica la guía en un servidor remoto.
