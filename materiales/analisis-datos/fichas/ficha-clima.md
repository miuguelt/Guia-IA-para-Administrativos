# Práctica de temperatura y precipitación

La IA analiza datos públicos reales de NASA POWER y prepara tablas, gráficos y documento. Tú revisas el alcance y las operaciones con sus fuentes. No incorpores información personal; esta práctica pertenece al laboratorio independiente.

**Pregunta preparada:** ¿cómo varían temperatura y precipitación durante 2024 en la celda consultada para Bogotá?

**Fuentes:** `datos/clima.csv`, `diccionario.csv` y `fuentes.json`. El paquete para IA los conserva bajo `fuentes/`. El CSV usa coma y UTF-8. La fecha representa un día en hora solar local (LST), no el horario civil de Colombia.

**Ejemplo:** un mes con días ausentes no se compara automáticamente con uno completo. La cobertura debe acompañar el promedio o acumulado.

## En tres pasos

1. **Entrega el encargo.** Descarga el [paquete de clima](../../ia/lab-clima.zip). Adjunta las fuentes y copia el [encargo para chat](../../ia/lab-clima/ENCARGO-CHAT.md), o abre la carpeta en Antigravity o Codex y usa el [encargo para IDE](../../ia/lab-clima/ENCARGO-IDE.md). Conserva el original.
2. **Revisa lo generado.** La IA genera inspección diaria, criterio de cobertura, tabla mensual de días esperados y válidos, media de temperatura y acumulado de precipitación. Prepara línea de temperatura, comparación mensual, tablas equivalentes, conclusión y documento con faltantes y límites. Aplica los tres criterios siguientes y solicita ajustes.
3. **Descarga y conserva.** Pide tablas, gráficos, código o cuaderno ejecutado, documento y `resultado.json` para `LAB-A01`. Recibe el JSON en «Guarda tu evidencia», revisa la vista y guarda el borrador. La revisión humana no realizada queda pendiente; la IA no la acredita por sí sola.

## Revisa tres criterios

- **Producto y tiempo.** Contrasta punto, periodo, frecuencia y variables con [NASA POWER](https://power.larc.nasa.gov/) y el manifiesto. Una celda de rejilla no es una estación instalada en la dirección consultada. Debe conservarse LST y la transformación desde `T2M` y `PRECTOTCORR`.
- **Cobertura y operación.** Un año bisiesto completo puede tener 366 fechas, pero cada variable requiere su conteo de valores válidos. Abre el cálculo de control de un mes generado por la IA: no se suman °C diarios para resumir temperatura ni se convierten faltantes en cero. La precipitación acumulada requiere intervalos completos y unidades compatibles.
- **Figuras y conclusión.** Revisa que tablas y gráficos tengan el mismo periodo y criterio explícito de cobertura. Los extremos no se borran por intuición. Un año no demuestra una tendencia climática de largo plazo.

## Ampliación opcional

Pide a la IA un procedimiento repetible. Para pronosticar, encarga una serie más larga apropiada, la reserva del tramo final y una comparación contra una referencia simple. Comprueba que ese futuro reservado no se use para entrenar ni elegir transformaciones.
