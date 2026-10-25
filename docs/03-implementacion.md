# Flujos administrativos y reglas reproducibles


**Encargos listos:** [Reto 4](../materiales/ia/reto-4/LEEME.html) · [Reto 5](../materiales/ia/reto-5/LEEME.html) · [Reto 6](../materiales/ia/reto-6/LEEME.html) · [Reto 7](../materiales/ia/reto-7/LEEME.html).

## Forma de trabajo con IA

La IA prepara los archivos de la actividad con el encargo y las fuentes del paquete. El aprendiz entrega ese encargo a un chat autorizado o a Antigravity o Codex, revisa el resultado y descarga los productos. Los campos que se describen son la estructura de salida para la IA. Los datos ausentes, las mediciones no realizadas y las revisiones humanas no observadas quedan pendientes; el instructor conserva la valoración formal.

Los [encargos de la guía web](../index.html#preparacion) están listos para usar. La conversación, el informe y el JSON generado conservan el trabajo sin transcribirlo en otra ficha. Si la herramienta no puede ejecutar la tarea, se conserva esa limitación como pendiente y se consulta una opción autorizada.

## Propósito y recorrido

El aprendiz entrega las fuentes del curso a la IA para clasificar mensajes, preparar un acta y normalizar un campo. Después encarga a la IA el diseño y la prueba de un flujo de solicitudes. Revisa referencias, excepciones y decisiones pendientes sin reconstruir a mano el procesamiento encargado.

El módulo ocupa nueve horas: 60 minutos de explicación y ensayo, 150 del Reto 4, 150 del Reto 5, 120 del Reto 6 y 60 del Reto 7. MG-A03 reúne los cuatro productos. Use I-5 de los [instrumentos de evaluación](instrumentos-evaluacion.md).

## Reto 4 · Clasificación con razones visibles

Entregue `correos-50.csv` al asistente autorizado: contiene 50 códigos, diez situaciones repetidas en cinco lotes. Pida una regla basada en señales textuales, personas afectadas y plazo explícito, la clasificación completa y diez borradores de situaciones distintas.

Compruebe los 50 códigos y contraste diez clasificaciones con la fuente. La prioridad sugerida es didáctica; la prioridad institucional depende del área. Revise los pendientes de cada borrador. La variante de talento humano sustituye cinco de los diez borradores y conserva sus restricciones de carga.

## Reto 5 · Acta con acuerdos y pendientes

Encargue el acta a partir de `transcripcion.csv`. Cada punto conserva minuto y frase de origen, distingue decisión, propuesta, compromiso o duda y deja pendientes responsables y fechas que no constan.

En 03:12 se pide confirmar contactos antes de enviar; no se afirma que Logística ya los confirmó. Use ese contraste para revisar el acta y conservarla como borrador. La variante documental añade su serie y subserie.

## Reto 6 · Limpieza sin perder el original

`datos-sofia.csv` tiene 30 registros, 29 códigos distintos y cuatro estados vacíos. SIM-0012 aparece en las filas 16 y 23 con aprendices distintos: ambas se conservan. Las referencias incluyen tres líneas iniciales y el encabezado; si la aplicación cambia la numeración, busque por código y contenido.

Pida un procedimiento que añada «Estado revisado», quite espacios, convierta a mayúsculas y marque «REVISAR» si falta el estado. Compruebe SIM-0002 → FINALIZADO y SIM-0003 → REVISAR. Los conteos esperados son 9 EN CURSO, 9 FINALIZADO, 8 PENDIENTE y 4 REVISAR. Conserve identificadores y fechas originales.

Distinga la propuesta de su ejecución. Si la herramienta no ejecuta el procedimiento, pida que el archivo indique ese límite y deje pendiente la comprobación del procesamiento.

La variante de inventario tiene ocho registros y otra regla: normalizar «Soporte» en una columna nueva. Sus cuatro incidencias involucran cinco filas: fechas ausentes, una pareja semejante, fechas invertidas y folios en cero. No aplique la regla de Estado a un archivo que no tiene ese campo.

## Reto 7 · Probar antes de automatizar

Solicite un diseño y una simulación de `reto-07-casos-flujo.csv`. Revise primero la urgencia, porque una solicitud completa también puede ser urgente. Las salidas esperadas son FL-01: resumen para revisión; FL-02: pregunta por la franja; FL-03: detención y consulta a una persona responsable.

El producto conserva activador, entradas, reglas, ramas y aprobación humana. La IA ejecuta la simulación en chat o en el IDE y genera el diagrama; no conecta cuentas ni despliega una automatización. El diseño se relaciona con RA1; la ejecución de la regla y su comprobación aportan a RA2. El instructor confirma la suficiencia de estas evidencias para la ficha.

## Aplicación al puesto

Pida identificar una tabla o trámite recurrente y explicar qué fuente, campo permitido y excepciones cambiarían. El curso trabaja con materiales de práctica; una prueba con fuentes reales requiere autorización.


## Apoyos para comprender antes del reto

Presente las cuatro tareas como aplicaciones del mismo método: identificar la fuente, encargar el producto, comprobar casos y pedir correcciones. Trabaje un producto a la vez. La ruta distingue los mensajes del Reto 4, el acta del Reto 5, la tabla del Reto 6 y el flujo del Reto 7.

Explique la regla reproducible con SIM-0002 y SIM-0003 antes de consultar los detalles sobre ejecución de código. El punto visible en FINALIZADO· representa el espacio final. El aprendiz solicita el procesamiento y revisa la salida; la disponibilidad de ejecución depende de la herramienta autorizada.

Las dos preguntas de «Observa» permiten comprobar el uso de una columna nueva y la conservación de las ocurrencias de SIM-0012. Pida explicar qué dato autoriza la transformación y qué queda para revisión. Las preguntas forman parte del tiempo de explicación del módulo.

Para observar la comprensión real del grupo, use la [pauta con aprendices](validacion-con-aprendices.md).
