# Práctica NASA: planetas y estrellas anfitrionas

La IA analiza datos públicos reales de NASA Exoplanet Archive y prepara los archivos. Tú contrastas el resultado con sus fuentes. Esta práctica pertenece al laboratorio independiente; no añadas información personal.

**Pregunta preparada:** ¿cómo se distribuyen los radios y periodos orbitales de los planetas seleccionados?

**Fuentes:** `datos/exoplanetas.csv`, `diccionario.csv` y `fuentes.json`. El paquete para IA los conserva bajo `fuentes/`. El CSV usa coma y UTF-8. Una fila representa un planeta; `hostname` puede repetirse porque una estrella tiene varios planetas.

La descarga usa `ps`, `default_flag=1`, detección por tránsito, descubrimiento hasta 2024 y filtros de radio y periodo indicados en el manifiesto. No representa todos los exoplanetas ni todas las estrellas.

**Ejemplo:** una anfitriona con dos planetas aporta dos filas; eso no demuestra que sus parámetros estelares coincidan.

## En tres pasos

1. **Entrega el encargo.** Descarga el [paquete NASA](../../ia/lab-nasa.zip). Adjunta las fuentes y copia el [encargo para chat](../../ia/lab-nasa/ENCARGO-CHAT.md), o abre la carpeta en Antigravity o Codex y usa el [encargo para IDE](../../ia/lab-nasa/ENCARGO-IDE.md). No necesitas redactar instrucciones ni llenar una ficha.
2. **Revisa lo generado.** La IA genera inspección, conteos, mediana de `pl_rade`, histograma de radios y dispersión de `pl_orbper` frente a `pl_rade`, con tablas equivalentes. Prepara la regla para anfitrionas repetidas, la conclusión y el documento con fuentes y límites. Aplica los tres criterios siguientes y pide ajustes en la misma conversación.
3. **Descarga y conserva.** Pide tablas, gráficos, procedimiento, documento y `resultado.json` para `LAB-A01`. Recibe el JSON en «Guarda tu evidencia», revisa la vista y guarda el borrador. La revisión humana no realizada queda pendiente; importar no acredita aprobación del instructor.

## Revisa tres criterios

- **Selección y faltantes.** Contrasta tres planetas por nombre con el original y la consulta de [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/). Comprueba filtros, unidades y datos estelares ausentes, sin valores inventados.
- **Cálculos y figuras.** Abre el cálculo de control de la mediana generado por la IA. Revisa conteo, unidades y escalas lineal y logarítmica; los valores deben ser positivos al usar logaritmo. Las tablas deben corresponder a los gráficos.
- **Anfitrionas y alcance.** Comprueba el número de anfitrionas distintas y la regla para conflictos en `st_teff` o `st_rad`. No se promedian ni eliminan discrepancias por defecto. La conclusión debe reconocer la selección y el sesgo de detección.

## Ampliación opcional

Pide a la IA repetir el procedimiento desde el original. Para comparar métodos de descubrimiento o errores de medición, encarga otra consulta: esos contrastes no se resuelven con las columnas y filtros iniciales.
