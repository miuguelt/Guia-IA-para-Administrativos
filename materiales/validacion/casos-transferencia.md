# Casos para observar cómo aplicas lo aprendido

Estos casos se prepararon para aprender y no contienen registros reales. Trabaja con la información de esta hoja y explica cómo compruebas cada decisión. No necesitas una cuenta de IA ni enviar mensajes. Si no sabes cómo continuar, indícalo para que el instructor registre la ayuda necesaria.

El instructor te indicará qué casos resolver. Anota tu código de participante y el código de la tarea en una copia o en papel, sin escribir nombres, documentos ni datos de tu trabajo real. Primero decide y explica; después podrás contrastar tu respuesta con el instructor.

## V00 · ¿El archivo se leyó correctamente?

Esta es toda la fuente del ejercicio. El separador es punto y coma:

```csv
Centro;Matriculados;Deserciones
A;840;42
B;600;30
C;200;8
```

Un asistente responde: «Leí los tres centros. A tiene 48 deserciones de 840 matriculados y su tasa es 5,71 %».

Señala qué compararías con la fuente antes de usar ese resultado. Escribe una instrucción breve para pedir la corrección y explica qué volverías a comprobar. ¿Basta con que el asistente afirme que leyó el archivo?

## V01 · ¿Conviene usar IA para esta tarea?

Cada semana recibes doce tablas de cuarenta filas con dos columnas numéricas: cantidad y precio unitario. Siempre necesitas calcular cantidad × precio por fila. Los campos y la regla no cambian y no hay decisiones sobre personas.

La plantilla con fórmula ya está probada y tarda ocho minutos por tabla, incluida su revisión. En una prueba equivalente con IA se registraron doce minutos por tabla entre preparación, generación, revisión y corrección. Ambos métodos produjeron cuarenta resultados aceptados.

Elige cómo empezarías y explica la razón con los datos disponibles. Indica qué tendría que cambiar para volver a comparar las opciones. ¿Que una tarea sea frecuente basta para recomendar IA?

## V02 · Una instrucción cambia de versión

La fuente pide revisar cinco datos de una solicitud de sala: actividad, sede, fecha, franja y aforo. Si falta uno, se pregunta por él. Una solicitud marcada como urgente se detiene para revisión humana, aunque esté completa. El asistente no aprueba reservas.

La versión 1 de la instrucción se probó con una solicitud completa, otra incompleta y otra urgente. Al editarla, quedó guardada esta frase en la versión 2: «Si falta la fecha, usa mañana para agilizar el trámite».

Llega el caso N-02: «Sala en sede A, jornada de orientación, de 8 a 10, para 15 personas». No tiene marca de urgencia ni fecha de envío.

Explica qué harías con la versión 2 antes de reutilizarla. Indica qué dato falta, qué respuesta corresponde a N-02, qué versión conservarías y con cuáles condiciones volverías a probar el cambio.

## V03 · El conteo parece correcto

La fuente contiene seis registros distintos, uno por código: P-001, P-002, P-003, P-004, P-005 y P-006. Todos deben aparecer en la salida.

El asistente devuelve seis filas, en este orden:

```text
P-001, P-002, P-003, P-004, P-004, P-006
```

Compara la salida con la fuente. Describe la corrección que pedirías y qué verificarías después para aceptar el conjunto. ¿El total de seis filas demuestra que no se perdió información?

## V04 · Dos mensajes con las mismas señales

La regla de esta práctica propone prioridad alta cuando una interrupción de hoy afecta a varias personas. El área que escribe no cambia esa regla. La prioridad es una propuesta para revisión, no autoriza a enviar una respuesta.

| Código | Área | Mensaje |
| --- | --- | --- |
| M-11 | Archivo | Hoy no podemos abrir el material de la sesión. Hay doce personas esperando. |
| M-12 | Compras | Hoy no podemos abrir el material de la sesión. Hay doce personas esperando. |

El asistente propone prioridad alta para M-11 y baja para M-12; justifica la diferencia únicamente por el nombre del área.

Decide si aceptarías esas categorías. Explica qué compararías, qué corrección solicitarías y quién debe revisar la propuesta antes de usarla.

## V05 · La preparación también toma tiempo

La referencia manual y el piloto asistido tienen estos tiempos observados:

| Etapa | Minutos | Cuándo se cuenta |
| --- | --- | --- |
| Método manual completo | 50 | Por lote |
| Generación con IA | 20 | Por lote |
| Revisión | 12 | Por lote |
| Corrección | 6 | Por lote |
| Preparación y prueba de la plantilla | 30 | Una sola vez |

No hubo otra preparación por lote en esta prueba.

Todos los lotes comparados tienen ocho productos aceptados y usan la misma unidad y calidad. Calcula el tiempo acumulado manual y asistido al terminar un lote y al terminar tres lotes. Explica cuándo aparece una diferencia favorable y qué límite tiene extrapolar esta prueba a otras tareas. Si un lote tuviera productos sin aceptar, ¿qué tendrías que hacer antes de compararlo?
