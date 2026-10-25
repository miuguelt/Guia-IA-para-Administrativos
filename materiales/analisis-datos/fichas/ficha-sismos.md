# Práctica de sismos: eventos, magnitudes y profundidad

La IA describe una selección pública real del catálogo USGS y genera los archivos. Tú revisas los filtros y los resultados. No incorpores información personal; esta práctica pertenece al laboratorio independiente.

**Pregunta preparada:** ¿cómo se distribuyen los eventos seleccionados en el espacio, el tiempo y la profundidad?

**Fuentes:** `datos/sismos.csv`, `diccionario.csv` y `fuentes.json`. El paquete para IA los conserva bajo `fuentes/`. El CSV usa coma y UTF-8. La descarga comprende eventos globales de enero de 2024 en UTC, tipo `earthquake` y magnitud de al menos 5.

**Ejemplo:** cambiar UTC por hora local puede trasladar un evento a otro día. El conteo diario debe declarar el estándar horario.

## En tres pasos

1. **Entrega el encargo.** Descarga el [paquete de sismos](../../ia/lab-sismos.zip). Adjunta las fuentes y copia el [encargo para chat](../../ia/lab-sismos/ENCARGO-CHAT.md), o abre la carpeta en Antigravity o Codex y usa el [encargo para IDE](../../ia/lab-sismos/ENCARGO-IDE.md). Conserva la consulta registrada.
2. **Revisa lo generado.** La IA genera la inspección de identificadores y variables, el mapa con base geográfica verificable, el histograma de profundidad y los conteos por día. Entrega tablas equivalentes, descripción, conclusión y documento con procedimiento y límites. Aplica los tres criterios siguientes y pide correcciones.
3. **Descarga y conserva.** Pide tablas, gráficos, mapa, procedimiento, documento y `resultado.json` para `LAB-A01`. Recibe el JSON en «Guarda tu evidencia» y guarda tras revisar la vista. La revisión humana no realizada sigue pendiente; el producto no es una predicción ni una aprobación institucional.

## Revisa tres criterios

- **Catálogo y filtros.** Compara fechas, umbral, tipo de evento y formato con el [servicio del catálogo USGS](https://earthquake.usgs.gov/fdsnws/event/1/) y el manifiesto. Comprueba identificadores únicos, profundidad y tipo de magnitud; una revisión posterior del catálogo puede cambiar registros.
- **Puntos y conteos.** Contrasta un evento, una profundidad y un conteo con el original. En GeoJSON el orden es longitud y latitud. Comprueba que el mapa coincida con su tabla y que la agrupación diaria mantenga UTC.
- **Límites.** La conclusión debe distinguir magnitud, intensidad percibida y daños. Este mapa no permite predecir sismos futuros ni interpretar ausencia de puntos como ausencia de riesgo.

## Ampliación opcional

Pide a la IA una descarga de un periodo mayor mediante ventanas acotadas. Revisa los límites entre ventanas, los identificadores y las restricciones del servicio: una respuesta truncada no representa todos los eventos que cumplen los filtros.
