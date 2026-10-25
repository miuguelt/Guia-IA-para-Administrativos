# Plan de mejora de la guía web

## Alcance y decisiones de trabajo

- La guía actual enseña herramientas de inteligencia artificial para tareas administrativas del programa SENA 21720210. Se conserva su contenido y su registro de evidencias.
- EcoBogotá se integrará como una ruta práctica complementaria, con cuatro fases y un simulador de separación en la fuente. Esta decisión mantiene la información existente mientras se verifica la relación curricular del caso ambiental.
- La web continuará usando el generador `scripts/build-course.py`, las fuentes de `content/` y el SDK local `devbrain-learner-sdk`. La carpeta ya tiene CSS modular y no tiene un `style.css`; los estilos existentes se conservarán y se añadirá la capa de tokens y estilos de EcoBogotá.
- No se afirmará un código de programa ni un RAP ambiental hasta confirmar su nombre y versión en una fuente curricular oficial. Véase la marca `[VERIFICAR]` en `README.md`.
- La práctica usará datos ficticios y funcionará sin llamadas de red al abrir `index.html` desde `file://`. Los enlaces de consulta externos solo se abrirán cuando el aprendiz los seleccione.

## Auditoría inicial (E0)

- La página publicada se genera desde `content/` y `scripts/build-course.py`; editar solo `index.html` rompería el flujo de publicación.
- El proyecto ya tiene `lang="es-CO"`, navegación adaptable, foco visible, cinco módulos de formación, cuatro pasos por módulo, un portafolio institucional y persistencia mediante el SDK local.
- La arquitectura usa `css/course-shell.css`, `css/course-learning.css`, `css/tool-lab.css` y `css/course-responsive.css`; no existe `style.css`.
- La carga del registro de evidencias para `file://` se resuelve con `js/registro-entregables.js`; este archivo se genera desde `deliverables.registry.json` con `Publish-GuideEvidenceRegistry.ps1`.
- No se encontró un simulador de clasificación de residuos. Las pruebas existentes usan Node y jsdom, y verifican la guía publicada y el SDK. Las fuentes y pruebas actuales tienen cambios previos sin confirmar en Git; se preservarán.
- La Resolución 2184 de 2019 confirma los recipientes blanco, negro y verde para la separación en la fuente. La oferta SENA consultada no confirma un programa con el nombre exacto “Técnico en Sistemas de Gestión Ambiental” ni el RAP citado en el prompt.

## Archivos previstos

| Archivo | Acción prevista |
| --- | --- |
| `content/ecobogota.html` | Crear la ruta complementaria: bienvenida, diagnóstico, tres módulos breves y simulador de transferencia. |
| `content/home.html` y `content/portfolio.html` | Enlazar la práctica, separar las cinco evidencias curriculares del registro complementario y añadir la lista para el instructor. |
| `content/shell.html` | Conectar los archivos locales de tokens, estilos y lógica de EcoBogotá. |
| `scripts/build-course.py` | Incluir la ruta complementaria en el curso publicado y ajustar metadatos de compilación. |
| `css/tokens.css` | Crear tokens para paleta, superficies, tinta, bordes y foco accesible. |
| `css/styles.css` | Crear estilos de la ruta EcoBogotá sin retirar las hojas modulares existentes. |
| `css/course-shell.css` | Aplicar tokens compartidos y conservar contraste y navegación existentes. |
| `css/course-responsive.css` | Ajustar la ruta nueva a pantallas pequeñas y reglas de impresión si se requieren. |
| `js/simulators.js` | Crear reglas de clasificación, diagnóstico y estado del simulador. |
| `js/portafolio.js` | Integrar el resultado ambiental con el registro oficial del SDK, sin duplicar su exportación institucional. |
| `js/course-app.js` | Inicializar la integración complementaria después de montar las evidencias del SDK. |
| `deliverables.registry.json` | Añadir, si el contrato del SDK lo permite, la evidencia de clasificación y los criterios de revisión. |
| `js/registro-entregables.js` | Regenerar únicamente con el publicador canónico si cambia el registro JSON. |
| `tests/course.test.cjs` | Cubrir el diagnóstico, los diez residuos, la predicción, la explicación, la persistencia y el montaje local. |
| `tests/` | Añadir pruebas específicas solo si el alcance lo requiere y mantenerlas en la suite existente. |
| `package.json` y `.github/workflows/calidad.yml` | Ejecutar las nuevas pruebas y publicar su informe de cobertura en CI. |
| `README.md` | Documentar supuestos, alcance, fuentes curriculares verificadas y pasos para probar la guía. |
| `DESIGN.md` | Actualizar la dirección visual y los tokens si la nueva paleta se incorpora a todo el aula. |
| `index.html` | Regenerar con `npm run build`; no editar manualmente. |

## Etapas y registro de verificación

| Etapa | Trabajo | Verificación y estado |
| --- | --- | --- |
| E0 | Leer HTML, CSS, JavaScript, reglas, contenido y pruebas; crear este plan. | **Completada.** Auditoría documentada arriba; Git ya contiene cambios previos que se preservarán. |
| E1 | Preparar HTML semántico, tokens, estilos y navegación accesible para la ruta nueva. | **Completada.** Se añadieron `css/tokens.css` y `css/styles.css`; el aula conserva su CSS modular. Los controles nuevos son elementos nativos con foco visible. |
| E2 | Implementar la bienvenida EcoBogotá, el diagnóstico y los controles visuales adaptables. | **Completada.** La ruta aparece en la portada y en la navegación, y registra el diagnóstico. |
| E3 | Añadir la secuencia de contextualización y los módulos blanco, negro y verde con fuentes visibles. | **Completada.** Se añadieron las cuatro fases; los tres bloques tienen menos de 150 palabras y enlazan la Resolución 2184 de 2019 y la guía oficial de MinAmbiente. |
| E4 | Implementar la predicción y clasificación de diez residuos con retroalimentación específica. | **Completada.** El primer intento queda contado, las respuestas repetidas se bloquean, los errores indican la caneca correcta y el lote solo se completa al clasificar los diez residuos. |
| E5 | Guardar explicación y resultados en el Portafolio de Evidencias institucional del SDK; habilitar impresión mediante su función oficial. | **Completada.** `ECO-A01` se integró al registro publicado por el generador canónico. Diagnóstico, predicción, puntaje y explicación se sincronizan con el SDK. La página añade la lista orientadora para el instructor. El botón de impresión y las reglas `@media print` existen; no se pudo abrir una vista previa real del archivo en el navegador integrado. |
| E6 | Regenerar la web, ejecutar pruebas de redacción y la suite, comprobar `file://` y revisar teclado, impresión y contenido completo. | **Completada con límite de inspección visual.** `npm run build`, `npm run check:redaccion`, `npm test` (36 pruebas), `npm run test:coverage` y `npm run test:coverage:eco` pasan. Los dos módulos nuevos alcanzan 100 % de funciones y líneas. La prueba de `file://` usa jsdom, activos locales y una trampa para detectar `fetch`; no reporta errores. Browser Use bloqueó la navegación directa a `file://`, por lo que no se pudo revisar visualmente la página ni el diálogo de impresión en una ventana real. |

## Criterios de cierre

- El contenido vigente de la guía administrativa sigue disponible.
- EcoBogotá presenta el caso, un diagnóstico, los tres colores de separación, una práctica de diez residuos, la predicción previa y la explicación de errores.
- Los resultados se guardan localmente y pasan al portafolio del SDK; el juicio final permanece a cargo del instructor.
- La ruta nueva funciona con mouse y teclado, incluye foco visible y no depende de redes de distribución de contenido (CDN), bibliotecas externas ni peticiones de red.
- `npm run build`, `npm run check:redaccion`, `npm test` y la comprobación local de la guía se ejecutan con resultados documentados.
