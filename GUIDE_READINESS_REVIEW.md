# Revisión integral de la guía

## Actualización vigente · 26 de octubre de 2026

Se revisó la interfaz en el navegador a 390, 1100 y 1440 px y se auditaron el contenido y la capa CSS/JS. Los cambios corrigen fallos visibles, rehacen el selector de situaciones de la portada y retiran afirmaciones imprecisas.

### Interfaz

- **Módulos sin columna vacía.** La tarjeta lateral de cada módulo medía unos 550 px junto a una lectura de 5 200 px. Ahora acompaña la lectura fija bajo las pestañas cuando la ventana mide al menos 1100 × 800 px.
- **Barras fijas.** Entre 901 y 1399 px la barra superior mide 142 px y tapaba las pestañas, que se fijaban a 76 px. `course-app.js` publica la altura real en `--topbar-h`, y las pestañas, los anclajes y el panel de modo la usan.
- **Selector de situaciones.** Pasó de unos 3 450 px a 1 400 px en escritorio. Las fichas son botones con `aria-pressed`, los filtros también, y elegir una ficha no reconstruye la lista: el foco se conserva y un aviso oculto anuncia la ficha abierta. En una columna, la ficha se lleva a la vista y recibe el foco. Los iconos son SVG en lugar de emojis. Sin JavaScript se leen todas las fichas.
- **Copia de instrucciones.** El selector usa el botón genérico del aula, que selecciona el texto si el portapapeles falla en lugar de anunciar una copia que no ocurrió.
- **Manual del portafolio.** «Imprimir o guardar en PDF» imprime solo el manual. La descarga en Markdown no necesita JavaScript.
- **Menús de la barra.** Mi avance, Modo y Recursos se abren de a uno y se cierran con Escape o con un clic fuera. El cambio de modo ya no registra un clic global en la página.
- **Retomar.** La flecha del botón queda como decoración para los lectores de pantalla.

### Contenido

- **Situaciones de oficina y aprendizaje.** El catálogo separa ocho situaciones de oficina y cuatro formas de aprender con IA, que ahora tienen su propio bloque. Cada ficha enlaza al reto con su título exacto y distingue «Practícala en» de «Técnica relacionada». Se corrigieron muestras que chocaban con las fuentes (PC-01 y URG-01), se retiraron las tutelas y las citas a normas sin fuente, y la herramienta sugerida es «el chat que habilite tu entidad».
- **Una sola fuente.** `scripts/sync-html-situations.py` genera el selector, el bloque de aprendizaje y el manual desde `content/office-situations.json`. Se retiró `update-office-situations.py`, que sobrescribía el JS con otra copia del catálogo.
- **Ley 1581.** Se cita como régimen de protección de datos personales. Se corrigieron el artículo 4, los artículos 5 y 6 y una fuente inexistente, y se separaron los datos sensibles de las credenciales, los datos bancarios y la información reservada.
- **Rótulos sobrios.** Se cambiaron «Blindaje», «Escudo», «Regla de oro», «Estándar de Oro», «Antipatrón», «1 clic», «dictamen» y otros términos por nombres descriptivos. Los productos de los encargos usan el nombre de `visualArtifact`.
- **Prueba individual separada.** El encargo de equipo del integrador ya no incluye IND-01 ni `casos-individuales.csv`. La prueba tiene su propio paquete, `prueba-individual`, que se resuelve después del trabajo en equipo y en un chat aparte: la IA pregunta qué dato revisaría la persona antes de mostrar la solución. Su resultado solo llena el campo `prueba_individual` de MG-A05 y se suma a lo que ya guardó el equipo. El encargo de la evidencia MG-A05 toma la prueba de `resultado-prueba-individual.html` o la deja pendiente.
- **Correcciones puntuales.** Fórmula de la tasa, funciones de Excel en español (ESPACIOS y MAYUSC), tiempo duplicado del módulo 04, texto que nunca se mostraba en el módulo 05 y botones que prometían transferir a la evidencia (el contenido llega como borrador).

### Verificación

- `npm run build`, `npm run check:redaccion`, 349 pruebas JavaScript y 89 Python. La cobertura de funciones de `js/*.js` es 100 %.
- Falla una prueba previa a estos cambios: `auditoria-guia.test.cjs` espera `if-no-files-found: error` en `.github/workflows/calidad.yml`.
- `npm run test:browser:layout` ahora incluye la portada, el portafolio y los anchos de 1024 y 1100 px. Pasan todos salvo dos casos que no dependen de estos cambios: EcoBogotá, que `devbrain-prose.js` excluye a propósito de la justificación, y la portada con zoom al 200 % cuando la pasada viene de 2560 px (aislada, pasa).

### Pendientes

- Renombrar `Materiales_practica_IA_SENA_Bogota.xlsx` afecta paquetes y un libro editado a mano; se conserva.
- La observación con aprendices, el aval de las 40 horas y la confirmación de la cohorte siguen abiertos.

## Actualización anterior · 25 de octubre de 2026

La revisión recorrió la guía como una persona principiante y comprobó que cada reto pudiera resolverse solo con lo que la guía entrega. Las cifras de todos los retos coinciden con sus archivos. Los cambios corrigen lo que impedía avanzar, las contradicciones entre la web y los encargos, y la carga de la interfaz.

### Bloqueos corregidos

- **Registro de tiempos.** Siete encargos exigían `registro-tiempos.csv` y la IA se detenía si faltaba. Ahora el archivo es opcional: sin él, los tiempos y el ahorro quedan pendientes y la tarea continúa.
- **Archivo inexistente.** La preparación remitía a `00-LEE-PRIMERO.txt`, que no está en ningún paquete. Ahora remite a `LEEME.html`.
- **Descargas individuales.** Ocho de las quince fuentes comunes no tenían enlace propio. El bloque de recursos comunes ahora permite descargarlas una por una, y cada ZIP de reto incluye sus fuentes en `fuentes/`.
- **Producto que no se podía guardar.** Los encargos pedían a un chat de IA un producto «en Canva» o «en PDF/Word», mientras «Guarda tu evidencia» lee una página HTML con los datos integrados. Ahora cada encargo pide una sola página `resultado-<reto>.html` con el formato del producto. Pasarla a Canva, Word o Excel queda como paso opcional.

### Contradicciones y claridad

- **Numeración.** Los retos siguen el orden del recorrido: el flujo de atención pasó a ser el Reto 7, el presupuesto el Reto 8 y la auditoría el Reto 9. El cambio cubre la web, los encargos, los CSV, el libro de práctica, los Word, el registro y las pruebas.
- **Filas.** Todos los encargos con CSV usan la numeración de Excel: el encabezado es la fila 4 y el primer registro, la fila 5.
- **Reto 7.** El diagrama del flujo se pide en SVG integrado y no en Mermaid, que no se ve sin JavaScript.
- **CRTT y Reto 1.** CRTT se define igual en toda la guía: Contexto, Rol, Tarea y Tono, más fuente y límites. El Reto 1 pide los ocho apartados del lineamiento, marcados como aplica o no aplica.
- **Reto 9.** Su ejemplo resuelto aclara que la frase citada no está en el archivo del aprendiz.
- **Reto 8.** Ya no pide un presupuesto por matriculado que el encargo no solicita.
- **Reto 4.** Aclara que la hora de llegada es simulada.
- **Reto 5.** Acepta responsables solo si constan.
- **Integrador.** Pide señalar los conflictos de la columna Observación y ofrece una alternativa autónoma para la sustentación.
- **Glosario.** Explica HITL, TRIM (ESPACIOS en Excel), «pendiente» y «por confirmar».
- **Otros ajustes.** Se aclararon PC-01 a PC-08, la proporción 0,05 que muestra Excel y el resultado «sin cambios» de la variante de inventario.

### Interfaz

- **Barra superior.** En el celular pasa de cuatro filas (unos 300 px) a dos (111 px).
- **Menú.** Separa «Tu ruta», «Seguimiento» y «Complementos opcionales». Los modos de estudio se llaman igual en todas partes: «Por mi cuenta» y «Con instructor».
- **Ubicación y pasos.** La barra superior muestra el módulo y el paso abierto. Cada paso tiene «Volver», y solo un reto queda abierto a la vez.
- **Encargo principal primero.** En el paso 2 de cada reto, el encargo que se guarda como evidencia aparece antes. El método en dos tiempos queda como opción plegada.
- **«Guarda tu evidencia».** Muestra tres pasos y un solo selector. La carpeta, el pegado, la reparación y los límites quedan dentro de «¿Algo falló?».
- **Seguimiento del avance.** La cabecera de cada módulo nombra su evidencia. «Mi avance» y el portafolio muestran el estado de cada evidencia con nombres legibles.
- **Portada.** El recorrido aparece antes que la información institucional, y los conteos dicen «preparación y cinco módulos».
- **Accesibilidad.** Los textos atenuados alcanzan al menos 4,5:1 de contraste y ningún tamaño baja de 0,8rem. Se desactivó la división automática de palabras y se eliminaron los recortes con puntos suspensivos. Los controles miden 44 px y el menú ya no se desliza al cargar la página.
- **Rendimiento.** Las 17 hojas del curso se sirven como un solo `css/course.css`, generado en el mismo orden de cascada; las hojas de origen siguen siendo editables. Los datos del laboratorio (718 KB) se cargan solo al abrirlo, y cada recurso se versiona según su contenido. `index.html` pasó de 1,55 MB a 945 KB.

### Pendientes

- Confirmar la sede: la web dice CGAO Vélez y los archivos Word y Excel se llaman «Bogota». Los nombres se conservan porque se enlazan desde fuera.
- Decidir si el paquete `materiales/ia/preparacion`, que no se enlaza desde la web, se alinea con la preparación o se retira.
- Proponer en la fuente canónica de DevBrain que `devbrain-prose.js` procese solo los nodos que cambian. Hoy vuelve a medir unos 1100 párrafos con cada cambio de la página.
- Ajustar los formatos del selector de situaciones de la portada, que todavía mencionan PDF, Word o Excel.
- Siguen abiertos el aval de las 40 horas, la confirmación de la cohorte y la observación con aprendices.

Las comprobaciones ejecutadas están en [TEST_READY.md](TEST_READY.md).

## Registro anterior · 24 de octubre de 2026

Se amplió la ruta del aprendiz para importar y revisar CSV en Excel, comprobar tipos, calcular cambios sin convertir vacíos en cero, elegir gráficos y conservar el procedimiento con Power Query. La explicación usa la ayuda vigente de Microsoft y está en la fuente canónica `content/analisis-datos/herramientas.html`; también se amplió la guía descargable y se actualizó el [registro de fuentes oficiales](docs/referencias-oficiales-vigencia.md).

Se regeneraron los documentos de lectura, los paquetes publicados y los PDF del laboratorio desde sus fuentes. El PDF del aprendiz tiene 33 páginas y el del instructor 6. Se renderizaron las 39 páginas para revisión visual. La interfaz y la guía descargable pasaron en Edge a 320, 390, 768, 1440, 1920 y 2560 px, zoom al 200 % e impresión.

La suite actual pasó con 267 pruebas JavaScript y 63 Python; la cobertura declarada alcanzó 100 % de funciones, 99,36 % de líneas y 91,68 % de ramas. Pasaron `npm run check:redaccion`, `Test-DevBrainEducationalGuide.ps1 -Strict` y `Test-GuideDeliverables.ps1 -Strict`.

Siguen pendientes tres validaciones de gestión: el aval de la adaptación de 40 horas frente a las 48 horas que publica Betowa, la confirmación de condiciones de la cohorte y la observación del recorrido con aprendices. La compuerta de presentación de código reporta dos copias del SDK compartido que difieren de `dist`; la excepción intencional está documentada en `docs/architecture/exceptions.md`. La compuerta de modularidad no halló una raíz Git y reporta dos archivos sobre 400 líneas, además de diez advertencias; el inventario registra el resultado y su alcance.

El resumen verificable más reciente está en [TEST_READY.md](TEST_READY.md), y el inventario de archivos, clasificación y acciones está en [docs/inventario-proyecto.xlsx](docs/inventario-proyecto.xlsx). Las secciones siguientes conservan las revisiones históricas con su fecha y alcance originales.

**Registro anterior · 21 de octubre de 2026:** [estudio autónomo y claridad del recorrido](docs/revision-autonomia.md). Incluye las dos modalidades, correcciones del portafolio, recepción por pegado y avance por evidencia revisada. La observación con principiantes permanece pendiente. Las secciones anteriores y los informes del 18 y 19 de octubre conservan su fecha y alcance.

La revisión vigente del 19 de octubre de 2026 está en [el recorrido con IA](docs/revision-flujo-ia.md) y [el estado de pruebas](TEST_READY.md): encargos completos, documentos descargables y recepción sin transcribir respuestas. Los resultados que siguen conservan el registro de la auditoría anterior.

La revisión específica sobre productividad, apoyos de comprensión e imágenes está en [docs/revision-productividad-ia.md](docs/revision-productividad-ia.md). Incluye los temas añadidos, cuatro esquemas y 145 combinaciones visuales. Su continuación corrigió la copia de ejemplos en evidencias, precisó el cierre y preparó seis casos de observación; esa revisión aprobó 152 pruebas JavaScript y 10 Python.

## Resultado y alcance

Se revisaron la preparación, los cinco módulos de aplicación, los diez retos breves, el integrador, la prueba individual, los materiales descargables, los instrumentos y el Portafolio de Evidencias. La revisión incluyó las fuentes editables, su publicación local, los datos del libro y el comportamiento de la web.

La secuencia principal permite pasar de una tarea guiada a una aplicación independiente. Se corrigieron vacíos en los paquetes, contradicciones en los ejemplos, afirmaciones sin fuente y problemas de interfaz. **La revisión técnica y editorial no acredita todavía la comprensión del grupo ni la equivalencia curricular de la adaptación de 40 horas.**

La fuente vigente de la experiencia es la web. Los documentos originales se usaron como antecedentes o fuentes de contraste; no se generaron documentos Word ni PDF en esta intervención.

## Requisitos, conceptos y progresión

| Etapa | Qué se enseña antes de exigirlo | Producto y relación con el siguiente paso |
| --- | --- | --- |
| Preparación · 60 min | Fuente, instrucción, borrador, tasa y «no consta»; carga o fragmento alternativo; comprobación con calculadora. | Informe breve sobre Bienestar. El aprendiz practica entregar, encargar, comprobar y corregir antes de resolver los retos. |
| Módulo 01 · 480 min | Entradas y salidas, datos necesarios, límites de uso, elección de herramienta, CRTT y línea base. | MG-A01: diagnóstico, decisiones de datos e instrucción contrastada. Aporta contexto y límites para redactar. |
| Módulo 02 · 540 min | Petición, afirmación de la persona, confirmación y vacío; estructura de una instrucción reutilizable. | MG-A02: dos borradores y tres pruebas de la misma versión, incluida una entrada incompleta. Prepara reglas que se puedan repetir. |
| Módulo 03 · 540 min | Clasificación con señales, acuerdos frente a propuestas, normalización sin pérdida y ramas con revisión humana. | MG-A03: bandeja, acta, tabla y flujo probado. Conserva referencias y excepciones para la auditoría. |
| Módulo 04 · 210 min | Numerador, denominador, unidad, periodo, población y respaldo de una afirmación. | MG-A04: cálculos y gráfico revisados, auditoría y correcciones. Limita las conclusiones del integrador. |
| Módulo 05 · 330 min | Diferencia frente a incumplimiento, resultado individual frente a equipo, tiempos comparables y propuesta de piloto. | MG-A05: análisis trazable, productos revisados, caso nuevo y transferencia. Consolida lo que se produjo durante la ruta. |

Los tiempos directos suman 2160 minutos, incluida la preparación: 36 horas. Las cuatro horas autónomas completan las 40 de la propuesta. Las actividades conservan ejemplos resueltos, comprobaciones con explicación, práctica y evidencia. Las preguntas y los simuladores preparan decisiones; no sustituyen la ejecución propia con IA.

Los cuatro criterios de la página 3 del diseño curricular suministrado se trazan en `guide.manifest.json` y en [los instrumentos](docs/instrumentos-evaluacion.md): selección de herramienta, diseño del proceso, formulación de instrucciones y validación de resultados. Las etiquetas de RA de la web se contrastan con el mapa de las cinco evidencias. La coincidencia documental no constituye aval institucional.

## Materiales de todos los ejercicios

Hay **32 CSV únicos, 38 referencias de descarga y 11 paquetes ZIP**. Las variantes son opcionales y sustituyen partes expresamente indicadas del trabajo. Cada paquete reúne la consigna, los pasos, los archivos y una ficha; los archivos del ZIP coinciden con las descargas individuales.

| Ejercicio | Insumos comprobados | Comprobación que puede realizar el aprendiz |
| --- | --- | --- |
| Preparación | `bienestar.csv` y alternativa de un centro en la web. | Centro A: 42 ÷ 840 × 100 = 5 %. Periodo no consta; no se infieren causas. |
| Reto 0 | Cinco tarjetas y ficha del semáforo. | Cinco decisiones, dos fragmentos reducidos y una autorización pendiente. |
| Reto 1 | Solicitud URG-01, ocho apartados del lineamiento, ficha CRTT y diagnóstico. | No confirma reserva ni convierte «mañana» en una fecha inventada. Ajusta la instrucción o justifica conservarla. |
| Reto 2 | PC-01 y PC-03, ficha y variante jurídica opcional. | Separa petición, afirmaciones y vacíos. No anuncia remisiones o plazos ausentes. |
| Reto 3 | PC-01, PC-02 y PC-03, con ficha de tres pruebas. | Prueba la misma versión; PC-02 conserva el soporte faltante como pendiente. |
| Reto 4 | 50 mensajes, ficha, tiempos y variante de talento humano. | Conserva los 50 códigos, explica diez situaciones en cinco lotes y revisa diez borradores. |
| Reto 5 | 20 intervenciones con minuto, ficha, tiempos y retención documental opcional. | Distingue propuestas, acuerdos y compromisos; cita intervención y minuto. No inventa responsables ni fechas. |
| Reto 6 | 30 registros, ficha, tiempos e inventario documental opcional. | Conserva 29 códigos distintos, cuatro estados vacíos y las dos ocurrencias de SIM-0012. La variante tiene su propia regla. |
| Reto 7 | FL-01, FL-02 y FL-03, ficha y tiempos. | Prueba solicitudes completa, incompleta y urgente. La urgencia se revisa antes de dar una ruta normal. |
| Reto 8 | Bienestar, Gastos Q1 y ficha de análisis. | Distingue diez centros de Bienestar de los ocho de Gastos Q1; contrasta moneda, periodo y denominadores. |
| Reto 9 | Lineamiento, cuatro afirmaciones, orden intrusa, ficha y afirmación A5 opcional. | Distingue respaldo, contradicción y ausencia de información; trata la orden intrusa por separado. |
| Integrador y prueba individual | 24 contratos, directriz, ocho casos nuevos, ficha ampliada y tiempos. | Conserva las dos filas de SIM-CT-008, formula preguntas sin concluir incumplimientos y separa el desempeño individual. |

Las nueve exportaciones provenientes del XLSX se comparan celda a celda, incluidas las fechas y fórmulas. La preparación enseña a extraer ZIP, leer `LEEME.html`, trabajar en copias y recuperar un CSV abierto en una sola columna o con tildes dañadas.

## Correcciones incorporadas

- El paquete del Reto 1 ya contiene la solicitud que antes solo aparecía en «Observa» y la ficha del diagnóstico. Puede trabajarse con sus archivos descargados.
- El integrador dispone de campos de prueba individual y tiempos por etapa. El registro compartido permite medir durante los retos, sin reconstruir tiempos de memoria.
- El integrador solicita el plan de acción y el borrador de Teams exigidos por Directriz, con responsables y fechas pendientes cuando no constan.
- Los importes incompletos del registro se restituyeron. El ejemplo de acta reconoce los acuerdos y el responsable que sí aparecen en la transcripción.
- PC-01 no presenta como realizada una remisión ausente. Las instrucciones y las rúbricas permiten conservar una respuesta correcta con justificación.
- La auditoría no da respaldo a una afirmación por sonar prudente, ni anuncia éxito cuando todavía hay respuestas incorrectas.
- El simulador de limpieza conserva los valores de cinco filas reales del CSV y ambas ocurrencias de SIM-0012. Su transferencia identifica que es una muestra, sin certificar el procesamiento de los 30 registros.
- La calculadora distingue supuestos y mediciones, conserva costos adicionales y recalcula antes de copiar o transferir. El indicador de avance dejó de inventar minutos ahorrados y permite completar el recorrido sin EcoBogotá.
- La guía complementaria elimina garantías de privacidad, cuotas ilimitadas, plazos y procedimientos no confirmados. La portada anuncia lo que realmente se enseña.
- La web conserva la guía complementaria en la configuración de despliegue. Se corrigió un atributo SVG inválido y el contenido se adapta a 320 px sin desbordar la página.
- La CI instala Pillow, publica el archivo de cobertura que realmente produce y ejecuta todas las suites `*.test.cjs`. El paso de cobertura usa Bash explícito para conservar el fallo de la compuerta al pasar su salida a `tee`. La cobertura atribuye los módulos cargados dentro del navegador de prueba.
- Las ayudas interactivas se separaron en cinco módulos de 26 a 291 líneas, con pruebas de equivalencia de la API y del orden de carga del navegador. La compuerta modular terminó sin errores.
- Las copias del SDK utilizadas se alinearon con su distribución canónica. La evaluación ya no aparece preseleccionada como cumplida.

## Evidencia técnica y sus límites

Los resultados de la ejecución se conservan en `output/auditoria-suite-final.log`, `output/auditoria-cobertura-final.log`, `output/auditoria-compuerta-educativa-final.json`, `output/auditoria-presentacion-codigo-final.json` y `output/playwright/auditoria-recorrido-final.log`. El estado actualizado de las comprobaciones está en [TEST_READY.md](TEST_READY.md).

La inspección con Microsoft Edge recorrió **116 combinaciones** de las diez vistas, sus pestañas y anchos de 320, 768, 1440 y 2560 px. La revisión final no detectó desbordamiento horizontal de página. Las tablas anchas conservan desplazamiento propio. Se revisaron capturas del simulador de limpieza en celular y de la calculadora en escritorio. Esto no equivale a una auditoría completa de WCAG con tecnologías de asistencia.

La suite terminó con **137 pruebas de JavaScript y 10 de Python aprobadas**. La compuerta JavaScript registró **100 % de funciones, 99,74 % de líneas y 86,15 % de ramas** en 16 archivos directos de `js/` y el verificador editorial. Python comprueba las funciones del constructor del curso y de las microlecciones. Los generadores auxiliares de ilustraciones y el SDK compartido tienen un alcance distinto: no se declara cobertura del 100 % de todo el repositorio.

Un perfil temporal de Edge introducía hallazgos de extensiones ajenas a la guía. Se comprobó que no estuviera en uso y se conservó íntegro fuera del proyecto, en la ruta de `output/perfil-navegador-conservado.txt`. Las compuertas educativas y de presentación de código se repitieron sobre la carpeta real del proyecto.

## Pendientes antes de declarar cumplimiento completo

| Pendiente | Por qué falta evidencia | Acción y responsable |
| --- | --- | --- |
| Aval de 40 frente a 48 horas | La ruta es una adaptación y el diseño suministrado publica 48 horas. | Instructor y coordinación confirman vigencia, suficiencia, duración y condiciones de la ficha. |
| Alcance curricular del flujo | Un diagrama y sus pruebas no demuestran una automatización desplegada. La regla debe ejecutarse para acreditar esa parte del desempeño. | El instructor decide si estas evidencias satisfacen el criterio o requiere una implementación adicional. |
| Comprensión, dificultad y tiempos reales | La lectura editorial y los resultados automáticos no muestran cómo aprende una persona. | Aplicar [la pauta con tres a cinco aprendices](docs/validacion-con-aprendices.md), observar explicaciones y una variante sin ayuda, ajustar y repetir. |
| Metadatos institucionales del SDK | La fuente compartida conserva referencias fijas a ADSO en la hoja y exportación. No proceden del programa 21720210 de esta guía. | Parametrizar programa y metadatos en el SDK canónico y sincronizar esta guía; revisar el formato con el instructor antes de usar la exportación institucionalmente. |
| Complemento en el portafolio del SDK | La barra general del curso ya respeta la opcionalidad; el SDK aún incluye ECO-A01 en su denominador de seis artefactos. | Agregar soporte canónico de evidencias opcionales y comprobar consolidación con cinco evidencias curriculares. |
| Verificación DevBrain y auxiliares | La configuración central no declara `test_cmd`; seis funciones de generadores auxiliares de ilustraciones están fuera de la compuerta Python. La última ejecución de `db verify` pasó sintaxis, modularidad y auditoría de calidad, y falló únicamente por el comando de pruebas no declarado. | Completar el registro del comando `npm test` y la cobertura auxiliar sin reducir umbrales. El fallo de integración central no sustituye los resultados de npm ejecutados localmente. |
| Condiciones de la cohorte | Fechas, ambiente, grupo, cuentas autorizadas, canal y formato de entrega no están confirmados. | Coordinación e instructor diligencian esos datos antes de iniciar. |

Las limitaciones del SDK y de configuración central no se corrigieron modificando otros proyectos ni alterando las copias canónicas a mano. La guía está preparada para la validación con aprendices; los pendientes anteriores impiden presentarla como completamente avalada.

## Referencias externas contrastadas

El recurso complementario se revisó contra documentación primaria: [protección empresarial de Copilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/enterprise-data-protection), [carga de archivos en Gemini](https://support.google.com/gemini/answer/14903178?hl=es-419) y [planes de Antigravity](https://www.antigravity.google/docs/plans). Las condiciones del proveedor no confirman las licencias ni los permisos institucionales de la cohorte.

Se conservaron enlaces al texto oficial de la [Ley 1581 de 2012](https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981) y la [Ley 1755 de 2015](https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334). La guía no determina plazos jurídicos ni procedimientos de casos reales.
