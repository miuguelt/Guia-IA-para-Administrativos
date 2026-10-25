# Sistema visual del aula

## Dirección

Una guía editorial de aprendizaje con tarjetas tipo Bento y diagramas de procesos. La interfaz prioriza lectura completa, fuentes visibles, acciones previsibles y una jerarquía tranquila; evita decoraciones que compitan con los ejemplos.

## Tokens

| Uso | Token |
| --- | --- |
| Verde institucional de marca | `--sena-primary: #39a900` |
| Tinta principal | `--ink: #1e293b` |
| Verde oscuro para texto y acciones | `--green: #225746` |
| Verde oscuro de navegación | `--green-dark: #153e38` |
| Resalte y avance | `--lime: #d5edaa` |
| Fondo general | `--paper: #f8fafc` |
| Superficie | `--surface: #ffffff` |
| Bordes y separadores | `--line: #dce3da` |
| Texto secundario | `--muted: #475569` |
| Foco visible | `--focus-ring: #155eef` |

Los colores de diagramas y videos se ajustan a estos mismos tonos. Los avisos legales o de validación usan un acento ámbar con texto y contraste propios; el significado también aparece escrito.

El verde SENA `#39a900` identifica la marca y los acentos. Los textos y botones principales usan el verde oscuro para conservar el contraste sobre superficies claras.

## Tipografía y estructura

- Sistema de fuentes: Segoe UI y fuentes sans-serif disponibles.
- Encabezados cortos, descripciones de ancho completo y párrafos de lectura cómoda.
- Inicio en tarjetas ordenadas por la secuencia; cada módulo mantiene cuatro pasos con acciones de avance.
- Tiempo, herramienta, día y evidencia aparecen antes de abrir cada reto.
- Diagramas en tarjetas con ampliación; fotografías y video tienen texto alternativo o transcripción.
- Las rejillas se reducen a una columna cuando el texto ya no cabe con comodidad; las tablas conservan desplazamiento horizontal.

## Controles y estados

- Botones y campos tienen un objetivo táctil mínimo de 42 px y un contorno de foco visible.
- El menú móvil abre como panel lateral con fondo atenuado y puede cerrarse con Escape, con el botón o al navegar.
- Diálogo visual y glosario usan `<dialog>`, título identificable, acción de cierre y foco devuelto al activador.
- Las herramientas de página indican cuándo el resultado es local. La calculadora muestra el resultado válido o describe el error; el compositor conserva su vista previa y marca el contenido vacío como pendiente.
- El estado de navegación y el guardado de evidencias se delegan al SDK oficial del aula.

## Prácticas con fuentes

- Cada módulo tiene un caso con cuatro etapas: fuente, decisiones, comprobación y revisión del resultado.
- Los controles usan texto legible, foco visible y respuestas con referencia. Los cálculos explican la operación; los errores permiten corregir sin bloquear el reto.
- Las ayudas y soluciones se registran como consulta; abrirlas no completa la práctica. Los intentos se guardan por separado de las evidencias.
- Los comparadores de PQRS, limpieza y tasa se consultan dentro del caso. Sus ensayos no se transfieren a una evidencia.
- Las fuentes se presentan en tarjetas adaptables que conservan filas, encabezados, vacíos y espacios del archivo original.
- Sin JavaScript se pueden leer las cuatro etapas y abrir la solución. Al imprimir se muestran juntas.
- El Reto 7 conserva el diagrama HTML con las rutas completa, incompleta y urgente.

## Práctica complementaria EcoBogotá

- La ruta usa las cuatro fases SENA: reflexión, contextualización, apropiación y transferencia.
- La práctica se presenta como complementaria hasta confirmar su programa, código y resultado de aprendizaje en una fuente curricular oficial.
- El simulador funciona con teclado y clic. Guarda el avance localmente y lo copia al Portafolio de Evidencias mediante el SDK.

## Alcance educativo que se declara

- La secuencia publicada es una propuesta adaptada de 40 horas (36 directas y 4 autónomas). La oferta SENA consultada indica 48 horas; el instructor confirma la equivalencia curricular.
- La práctica de RA2 diseña y verifica en papel las ramas de un flujo. No se conectan cuentas ni se entrega una automatización desplegada.
- La guía utiliza datos sintéticos. Los resultados del ejemplo no describen personas, centros o procesos institucionales reales.
