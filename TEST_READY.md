# Estado de pruebas de la guía · 26 de octubre de 2026

Esta es la verificación más reciente. Acompaña la revisión de interfaz, contenido y prueba individual descrita en [GUIDE_READINESS_REVIEW.md](GUIDE_READINESS_REVIEW.md).

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | Aprobada: 32 CSV administrativos, 31 paquetes para IA (se agregó `prueba-individual`), 119 documentos de lectura, 11 paquetes de retos y cinco paquetes de análisis. |
| `npm run check:redaccion` | Aprobada: sin expresiones bloqueadas en las fuentes editables. |
| `npm test` | Aprobada: 352 pruebas JavaScript y 91 Python, sin fallas ni omisiones. La prueba del workflow se alineó con el cambio de `if-no-files-found: error` a `warn` que se publicó el 25 de octubre. |
| `npm run test:coverage:all` | Aprobada: 100 % de funciones, 99,37 % de líneas y 90,82 % de ramas. |
| Contrato educativo estricto | Aprobado sin errores ni advertencias. |
| Entregables estrictos | Aprobados: ocho artefactos y ocho estaciones. Advertencia previa sin cambios: ECO-A01 y ECO-A02 comparten el orden 6. |
| Navegador real (Edge) | 229 comprobaciones aprobadas en 320, 390, 768, 1024, 1100, 1440, 1920 y 2560 px, zoom al 200 % e impresión; ahora incluye la portada y el portafolio. Fallan seis: la introducción de EcoBogotá no se justifica desde 768 px porque `devbrain-prose.js` excluye esa página desde el commit `23e8265`. La compuerta no se modificó; la decisión queda pendiente. |
| Revisión visual | Portada, selector de situaciones, módulos 03 y 05 y portafolio revisados a 390, 1100 y 1440 px, sin desplazamiento horizontal. El desplazamiento suave hacia la ficha en el celular no se pudo observar porque el panel del navegador estaba oculto. |
| Validador de reglas del workspace | Sin errores en las fuentes modificadas. `index.html` (1,16 MB, generado) sigue sobre el presupuesto léxico de 900 KB, como antes de esta revisión, y se valida a través de sus fuentes en `content/`. |

Siguen pendientes el aval curricular de las 40 horas frente a las 48 publicadas, la decisión sobre la justificación de EcoBogotá y la observación del recorrido con aprendices.

## Registro anterior · 25 de octubre de 2026

Esta fue la verificación vigente hasta la revisión del 26 de octubre. Acompaña la revisión de resolubilidad y de interfaz descrita en [GUIDE_READINESS_REVIEW.md](GUIDE_READINESS_REVIEW.md). La cobertura corresponde al alcance de su compuerta: el JavaScript directo de `js/` y el verificador editorial.

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | Aprobada: 32 CSV administrativos, 30 paquetes para IA, 117 documentos de lectura, 11 paquetes de retos y cinco paquetes de análisis. Genera además `css/course.css` y `js/lab-source-data.js`. |
| `npm run check:redaccion` | Aprobada: sin expresiones bloqueadas en las fuentes editables. |
| `npm test` | Aprobada: 352 pruebas JavaScript y 77 Python, sin fallas ni omisiones. |
| `npm run test:coverage:all` | Aprobada: 100 % de funciones, 99,44 % de líneas y 90,15 % de ramas. El porcentaje de ramas es menor que el del 24 de octubre (91,68 %), con un conjunto distinto de archivos: desde entonces se incorporó `js/office-situations-selector.js` (83,82 % de ramas). Los archivos nuevos de esta revisión están al 100 % de ramas. |
| Contrato educativo estricto | Aprobado sin errores ni advertencias, después de retirar el recorte con puntos suspensivos de las tarjetas de situaciones. |
| Entregables estrictos | Aprobados: ocho artefactos y ocho estaciones. Advertencia previa sin cambios: ECO-A01 y ECO-A02 comparten el orden 6. |
| Navegador real (Edge) | 120 comprobaciones aprobadas y ninguna fallida en 320, 390, 768, 1440, 1920 y 2560 px, zoom al 200 % e impresión. |
| Revisión visual | Barra superior en dos filas a 320 y 390 px, sin desplazamiento horizontal. Menú agrupado, ubicación por paso, paso 2 de los retos y panel «Guarda tu evidencia» revisados a 320 y 1100 px. |
| Validador de reglas del workspace | Sin errores en los archivos modificados; solo avisos del objetivo de 250 líneas. Siguen errores ajenos a esta revisión: `js/office-situations-selector.js` y `js/simulators.js` superan 400 líneas, hay dos scripts en `output/` y notas en `.agents/`. `index.html` bajó de 1,55 MB a 945 KB, pero sigue sobre el presupuesto léxico de 900 KB, por lo que se valida a través de sus fuentes en `content/`. |

Siguen pendientes el aval curricular de las 40 horas frente a las 48 publicadas, la confirmación de la sede (la web dice CGAO Vélez; los archivos Word y Excel se llaman «Bogota») y la observación del recorrido con aprendices.

## Registro anterior · 24 de octubre de 2026

Esta fue la verificación vigente hasta la revisión del 25 de octubre. La cobertura corresponde al alcance declarado por su compuerta —JavaScript de `js/` y el verificador editorial— y no certifica todos los archivos del repositorio ni las copias locales del SDK compartido.

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | Aprobada: 32 CSV administrativos, 28 paquetes para IA, 111 documentos de lectura, 11 paquetes de retos y cinco paquetes de análisis; seis módulos, cinco evidencias curriculares y dos complementos. |
| `npm run check:redaccion` | Aprobada: sin expresiones bloqueadas en las fuentes editables. |
| `npm test` | Aprobada: 267 pruebas JavaScript y 63 pruebas Python, sin fallas ni omisiones. |
| `npm run test:coverage:all` | Aprobada: 100 % de funciones, 99,36 % de líneas y 91,68 % de ramas en el alcance descrito. |
| Contrato educativo y entregables estrictos | Aprobados sin errores ni advertencias. La compuerta de entregables reporta siete artefactos y siete estaciones. |
| Navegador real | Edge sin desbordamiento ni recorte en 320, 390, 768, 1440, 1920 y 2560 px, además de zoom al 200 %. La guía descargable y su impresión también pasan. |
| PDF del laboratorio | Regenerados desde fuentes editables: guía del aprendiz de 33 páginas y guía del instructor de 6 páginas. Se renderizaron e inspeccionaron visualmente las 39 páginas; no se observan cortes de texto ni tablas fuera de página. |
| Presentación de código | Pendiente: las copias locales `js/vendor/devbrain-evidence.js` y `js/vendor/devbrain-learner-sdk.js` difieren de la distribución compartida. La adaptación deliberada de esta guía está explicada en `docs/architecture/exceptions.md`; se requiere incorporarla a la fuente compartida antes de sincronizar. |
| Modularidad | El análisis completo reporta dos errores y diez advertencias. Marca `materiales/analisis-datos/codigo/analysis_data.py` (546 líneas) y `js/simulators.js` (563 líneas) sobre el límite de 400. La herramienta no identificó una raíz Git y no pudo distinguir el estado heredado de lo nuevo. |

La ficha oficial consultada del SENA muestra 48 horas; esta propuesta conserva 40. Siguen pendientes el aval curricular, la confirmación de datos de la cohorte y la observación con aprendices. Las políticas de las herramientas, las autorizaciones institucionales y la comprensión del grupo no se certifican con estas pruebas técnicas.

El [inventario del proyecto](docs/inventario-proyecto.xlsx) incluye rutas de `output/`, artefactos, fuentes y publicaciones; allí se consultan los conteos exactos, las exclusiones, el método y la acción prevista por archivo. Las fuentes oficiales consultadas el 24 de octubre se reúnen en [referencias de vigencia](docs/referencias-oficiales-vigencia.md).

## Registro anterior · 18 de octubre de 2026

Esta revisión registra comprobaciones ejecutadas sobre la web y sus materiales. El informe completo está en [GUIDE_READINESS_REVIEW.md](GUIDE_READINESS_REVIEW.md). Los resultados no constituyen aval curricular ni demuestran comprensión con aprendices.

| Comprobación | Resultado observado |
| --- | --- |
| `npm run build` | Aprobada: 32 CSV, seis módulos formativos, diez vistas y 11 ZIP. |
| `npm run check:redaccion` | Aprobada. La lectura editorial también revisó secuencia, fuentes, ejemplos y criterios. |
| `npm test` | Aprobada: 152 pruebas JavaScript y 10 Python, sin omisiones. |
| `npm run test:coverage:all` | Aprobada: 100 % de funciones, 99,74 % de líneas y 86,16 % de ramas en los 16 JavaScript directos de `js/` y el verificador editorial. |
| Funciones del constructor y microlecciones | Compuerta equivalente de Python aprobada dentro de `npm test`. |
| Contrato educativo estricto | Aprobado, sin errores ni advertencias. |
| Entregables estrictos | Aprobados: cinco evidencias curriculares y un complemento, seis montajes. |
| Presentación de código | Aprobada, sin hallazgos; copias del SDK alineadas con su distribución canónica. |
| Modularidad | Aprobada: cero errores y siete advertencias. Las ayudas interactivas se dividen en cinco módulos menores de 400 líneas. |
| Navegador real | 145 combinaciones entre diez vistas, pestañas y anchos de 320, 390, 768, 1440 y 2560 px sin desbordamiento de página. Cuatro SVG adicionales con texto dentro del dibujo; las tablas anchas se desplazan dentro del bloque. Consola final sin errores ni advertencias. |
| Continuación de registro y cierre | Cinco ayudas con teclado en 390 y 1440 px sin modificar campos; borrador conservado tras recarga; dos archivos de observación accesibles. Sin JavaScript: diez vistas, once paquetes y ayuda con teclado en 390 px sin desbordamiento. |
| `db verify guia-ia-para-administrativos` | Pendiente: la configuración central no declara `test_cmd`. Pasaron sintaxis, modularidad y auditoría de calidad; el comando no ejecutó el build ni las pruebas npm. |

La cobertura no se extiende al SDK compartido ni a las seis funciones de los generadores auxiliares de ilustraciones. No se rebajaron umbrales para aprobar.

La revisión de espacios con `git diff --check` señala espacios al final de líneas en la copia canónica de `devbrain-learner-sdk.js`. Se conserva idéntica a `dist`; corregir ese formato requiere actualizar la fuente compartida y volver a sincronizar.

La CI ejecuta build, comprueba salidas generadas, revisa redacción, corre todas las suites y publica `cobertura-completa.txt`. El paso con `tee` utiliza Bash explícito para propagar el fallo de cobertura. No se ejecutó una publicación remota ni una construcción de contenedor durante esta revisión.

Evidencia local:

La ejecución vigente del registro y cierre está en `output/cierre-suite.log`, `output/cierre-cobertura.log`, `output/cierre-compuerta-educativa.json`, `output/playwright/cierre-recorrido.log` y `output/playwright/cierre-sin-javascript.log`. El [análisis de contenido e imágenes](docs/revision-productividad-ia.md) detalla sus límites y conserva las comprobaciones anteriores. Los archivos siguientes corresponden a la auditoría inicial.

- `output/auditoria-suite-final.log`.
- `output/auditoria-cobertura-final.log`.
- `output/auditoria-compuerta-educativa-final.json`.
- `output/auditoria-entregables-final.log`.
- `output/auditoria-presentacion-codigo-final.json`.
- `output/auditoria-db-verify-final.log`.
- `output/playwright/auditoria-recorrido-final.log` y capturas del módulo 03 en celular y del módulo 05 en escritorio.

Antes de declarar cumplimiento completo faltan el aval de la adaptación de 40 horas frente a 48, la observación con aprendices, la confirmación de condiciones de la cohorte y los ajustes canónicos del SDK para programa y evidencias opcionales. La inspección visual realizada no equivale a una auditoría completa de accesibilidad con tecnologías de asistencia.
