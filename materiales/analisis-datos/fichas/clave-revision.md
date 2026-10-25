# Clave de revisión para el instructor

Esta clave corresponde al laboratorio independiente y a sus datos públicos. Compruebe la versión en `fuentes.json` antes de usar los valores. Una descarga posterior puede cambiar; no ajuste el resultado del aprendiz para hacerlo coincidir sin revisar primero la fuente.

## Muestra inicial consultada el 18 de octubre de 2026 en Colombia

| Caso | Control de estructura | Control numérico de referencia |
| --- | --- | --- |
| Exoplanetas | 4.332 planetas y 3.282 nombres de anfitrionas; selección por tránsito. | Mediana de `pl_rade`: 2,39 radios terrestres. |
| Población | 75 combinaciones: tres países y 25 años, 2000–2024. | Colombia: 39.089.934 personas en 2000 y 52.886.363 en 2024; cambio aproximado 35,2941 %. |
| Pirámide DANE | Santander 2024, área total, 101 edades; 100 agrupa 100 años y más. | Total: 2.380.650 personas; 1.168.768 hombres y 1.211.882 mujeres. Proyección actualizada en 2025. |
| Clima | 366 fechas de 2024; consulta POWER para Bogotá en LST. | Media de temperatura aproximada: 19,669617 °C; precipitación acumulada: 1.816,08 mm, con la cobertura y transformación del manifiesto. |
| Sismos | 133 eventos globales de enero de 2024, magnitud de al menos 5. | Máxima magnitud de la descarga: 7,5; conserve el tipo de magnitud de los eventos. |

Estos valores describen la descarga conservada. No son una actualización automática de la fuente. Compare con el original y con el resumen generado por los scripts. La hora de descarga del manifiesto está en UTC; el día indicado aquí corresponde a Colombia.

## Relaciones que deben quedar claras

**NASA:** no acepte comparar métodos de descubrimiento con el archivo inicial porque todos los registros son de tránsito. Una fila representa un planeta, no una estrella; revisar anfitrionas requiere una regla que no oculte parámetros discrepantes. No hay columnas de incertidumbre para inventar barras de error. Una escala logarítmica debe ser explícita y no admite ceros o negativos en su forma habitual.

**Población:** el denominador del cambio porcentual es el valor inicial. No se suman años como habitantes distintos. El CSV internacional no tiene edad ni sexo; la pirámide usa el extracto DANE separado. Compruebe la suma de edades, el grupo abierto de 100 años y más y la simetría de las escalas. Una proyección del DANE no debe etiquetarse como observación censal ni equipararse sin revisión a otra serie.

**Clima:** un año bisiesto tiene 366 días, pero el conteo de fechas no sustituye revisar valores válidos. La muestra es un producto de rejilla; no es una estación urbana. LST no equivale a la hora civil colombiana. El manifiesto informa las unidades y la transformación de precipitación. Un solo año no sustenta una tendencia climática prolongada.

**Sismos:** compruebe identificadores, UTC, umbral y ventana. Magnitud, intensidad y daño son conceptos diferentes. La ausencia de puntos bajo un filtro no significa ausencia de riesgo. No acepte predicciones del próximo evento derivadas del gráfico.

**Documentos:** use las afirmaciones del ejemplo verificado del paquete como controles pequeños. Revise página del archivo, página impresa y versión. «No encontrada» no significa «falsa». La cobertura necesita denominadores; un PDF cargado puede no haberse extraído completo. Respete las condiciones de cada documento y no redistribuya los informes restringidos.

## Preguntas para observar comprensión

1. ¿Qué cambia en su conclusión si falta un mes o un grupo?
2. ¿Cómo sabe que una fila representa un objeto y no otra medición del mismo objeto?
3. ¿Qué cifra puede recalcular sin depender de la respuesta del asistente?
4. ¿Qué parte del corpus quedó sin revisar y por qué?
5. ¿Qué necesitaría para pasar de describir una relación a sostener una explicación causal?

No exija una interpretación única cuando varias estén sustentadas. Solicite que el aprendiz muestre su evidencia y corrija el alcance cuando sea necesario.
