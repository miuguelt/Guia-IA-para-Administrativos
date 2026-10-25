# Práctica de población: compara periodos y territorios

La IA prepara la comparación con datos públicos reales del Banco Mundial. La ampliación usa anexos oficiales del DANE. Tú revisas las fuentes y los resultados, sin transcribirlos. No incorpores registros personales; esta práctica pertenece al laboratorio independiente.

**Pregunta preparada:** ¿cuánto cambió la población de Colombia, Perú y Ecuador entre dos años comunes?

**Fuentes:** `datos/poblacion.csv`, `diccionario.csv` y `fuentes.json`. El paquete para IA los conserva bajo `fuentes/`. El CSV usa coma y UTF-8. Una fila representa un país y un año; `poblacion` está expresada en personas.

**Ejemplo:** un cambio de 100 a 110 personas equivale a 10 personas y al 10 %. Este ejemplo explica la operación; no es un dato del archivo.

## En tres pasos

1. **Entrega el encargo.** Descarga el [paquete de población](../../ia/lab-poblacion.zip). Adjunta las fuentes y copia el [encargo para chat](../../ia/lab-poblacion/ENCARGO-CHAT.md), o abre la carpeta en Antigravity o Codex y usa el [encargo para IDE](../../ia/lab-poblacion/ENCARGO-IDE.md). La pregunta y los productos ya están definidos.
2. **Revisa lo generado.** La IA genera la inspección país-año, la selección de dos años comunes, la tabla de valores iniciales y finales, diferencias y porcentajes. Prepara líneas de evolución, barras de cambio, tablas equivalentes, conclusión y documento de análisis. Aplica los tres criterios siguientes y pide ajustes.
3. **Descarga y conserva.** Pide datos calculados, gráficos, procedimiento, documento y `resultado.json` para `LAB-A01`. Recibe el JSON en «Guarda tu evidencia» y guarda después de revisar la vista. La revisión humana no realizada permanece pendiente; descargar no equivale a aprobación institucional.

## Revisa tres criterios

- **Cobertura y versión.** Contrasta tres filas con el original y la [ficha del indicador SP.POP.TOTL](https://data.worldbank.org/indicator/SP.POP.TOTL). Los dos años deben estar presentes en los tres países, con unidades, consulta y versión visibles.
- **Operación y representación.** Comprueba en el cálculo de control generado la fórmula `(final − inicial) / inicial × 100`. Un extremo ausente o un valor inicial cero deja el porcentaje pendiente con su motivo. No se suman años como habitantes distintos ni se mezclan personas y millones sin indicarlo.
- **Interpretación.** Revisa que la conclusión distinga cambio absoluto y relativo, sin atribuir causas que estos datos no documentan. Los gráficos y sus tablas deben usar los mismos años y países.

## Ampliación DANE opcional

Pide a la IA una pirámide a partir de `datos/piramide-santander-2024.csv`: edad, hombres y mujeres de Santander, área total, en 2024. Son 101 grupos de edad; 100 significa 100 años y más. La proyección se basa en CNPV 2018 y fue actualizada en 2025.

La IA debe conservar la versión del manifiesto y el enlace a [proyecciones de población del DANE](https://www.dane.gov.co/index.php/estadisticas-por-tema/demografia-y-poblacion/proyecciones-de-poblacion). Revisa escalas simétricas y la suma de hombres y mujeres. Las coordenadas negativas a la izquierda no significan población negativa. La explicación debe distinguir proyección, estimación y conteo observado; esta tabla y la internacional no tienen cifras intercambiables.
