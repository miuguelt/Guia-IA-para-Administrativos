# Estación 04: Auditoría de Datos, Detección de Errores e IA Predictiva con Human-in-the-Loop
**Programa:** Implementación de herramientas de inteligencia artificial en la optimización de la productividad (21720210 V1)  
**Ambiente de Formación:** Redes CIMI · SENA Girón  
**Fase Pedagógica:** Apropiación (Parte 2) · **Duración:** 10 horas (Laboratorio Forense de Datos)  
**Resultado de Aprendizaje (RAP):** RA2. Programar proceso automatizado de acuerdo con diseño y tipo de inteligencia artificial.  
**Evidencia Asociada:** MG-A04 (Evidencia de Desempeño - Matriz de Auditoría Cruzada y Protocolo HITL)

---

## 1. La Trampa de los Datos Numéricos y la IA Predictiva

Existe una falsa creencia entre muchos profesionales: asumir que si una herramienta de IA es capaz de redactar un ensayo brillante, también es capaz de auditar un presupuesto o sumar una columna contable con precisión infalible.

**La realidad técnica:** Los Modelos de Lenguaje Grande (LLMs) procesan números como cadenas de caracteres o *tokens*. No realizan operaciones en un circuito aritmético como un procesador o una hoja de cálculo, sino que predicen qué número suele aparecer después en un texto similar.  
Por esta razón, un administrativo que confíe ciegamente en una IA para aprobar una factura o liquidar un contrato está asumiendo un riesgo operativo inaceptable.

En esta estación combinamos la potencia de la **IA Generativa**, las capacidades de la **IA Predictiva** (detección de patrones y tendencias) y el **Criterio Humano (Human-in-the-Loop)** para auditar datos administrativos con 100% de certeza.

---

## 2. Diferenciación Práctica: IA Generativa vs. IA Predictiva

```text
┌────────────────────────────┬─────────────────────────────┬─────────────────────────────┐
│ CRITERIO                   │ INTELIGENCIA GENERATIVA     │ INTELIGENCIA PREDICTIVA     │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ ¿Qué produce?              │ Contenido nuevo (texto,     │ Probabilidades, categorías, │
│                            │ tablas, correos, código).   │ proyecciones numéricas.     │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Entrada típica             │ Texto libre, documentos.    │ Tablas de datos históricos. │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Aplicación en el CIMI      │ Redactar informes, actas,   │ Proyectar consumo de fibra  │
│                            │ estructurar quejas ciudadan.│ predecir deserción escolar. │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Riesgo principal           │ Alucinación de datos.       │ Sobreajuste o sesgo en base │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Control requerido          │ Restricción estricta R-C-I-R│ Validación estadística y    │
│                            │ y delimitadores cerrados.   │ contraste con histórico.    │
└────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

---

## 3. Laboratorio Forense: La Prueba de Estrés a la Tabla de Suministros

Abra el [Caso de Estudio 04: Tabla de Compras y Suministros](file:///c:/Users/Miguel/Documents/Aplicaciones/_projects/Guia%20IA%20para%20Administrativos/docs/ejercicios/caso-04-tabla-suministros-con-trampas.md).

### Procedimiento de Implementación (Ciclo Iterativo V.E.R.A.)

**Iteración 1: El Error del Prompt Inocente (Sycophancy)**
1. Ingrese a la IA la tabla y pídale: *"Revisa esta tabla de compras del CIMI y dime si está correcta para aprobarla"*.
2. **Revisar:** Observe cómo la IA, motivada por el sesgo de complacencia (*sycophancy*), frecuentemente felicita la presentación y concluye que *"los cálculos están bien organizados y el total de $13.113.000 cuadra"*. 
3. Documente en su plantilla de evidencias este falso positivo. Esto demuestra por qué nunca se debe confiar un presupuesto ciegamente a un LLM.

**Iteración 2: El Prompt de Auditoría Forense**
4. Aplique el siguiente prompt con instrucciones cruzadas y restrictivas:

```text
Actúa como Auditor Contable y de Control Interno del SENA CIMI.
Examina minuciosamente la tabla de compras delimitada entre <factura> y </factura>.

Tu única misión es encontrar discrepancias, errores de cálculo o anomalías de catálogo.
Aplica estrictamente las siguientes comprobaciones:
1. Multiplica de forma independiente 'Cantidad' por 'Valor Unitario' en cada fila y compara con 'Subtotal Facturado'.
2. Suma todos los subtotales calculados y compáralos con el total declarado.
3. Verifica la coherencia de fechas en el calendario gregoriano (ej. cantidad de días por mes).
4. Revisa códigos SKU duplicados con descripciones diferentes.

Reporta los hallazgos en una TABLA DE NOVEDADES AUDITADAS:
| Fila | Campo | Valor Declarado | Valor Real Auditado | Impacto Financiero / Operativo |
```

**Iteración 3: Comprobación Excel (HITL - Human in the Loop)**
5. **Verificar y Atribuir:** Abra Microsoft Excel (o Google Sheets). Copie los datos y ejecute las multiplicaciones de Cantidad por Valor Unitario manualmente utilizando fórmulas deterministas (`=B2*C2`).
6. Compare la tabla de novedades entregada por la IA con sus cálculos en Excel. Si la IA falló en alguna multiplicación (alucinación matemática), usted debe detectarlo y corregirlo. El administrativo firma la auditoría final, no la máquina.

### Los 4 Hallazgos que el Administrativo Debe Confirmar
1. **Ítem 4 (Switch Cisco):** Facturado en $4.700.000 cuando 2 x $2.850.000 = **$5.700.000** (Diferencia de $1.000.000 COP a favor del proveedor).
2. **Total General:** El total real de la compra es **$14.113.000 COP**, no los $13.113.000 facturados.
3. **Ítem 7 (Transceiver SFP+):** Fecha de entrega registrada como `31/09/2026`. Septiembre solo tiene 30 días. Error de captura que bloquearía los sistemas contables.
4. **Ítems 1 y 6:** Código SKU `CAB-UTP-6A` asignado tanto a una bobina de 305m ($680.000) como a un patch cord ($18.000).

---

## 4. El Protocolo Human-in-the-Loop (HITL) en 3 Pasos

Para blindar la operación administrativa del centro, todo reporte con datos cuantitativos debe seguir el flujo HITL:

```text
[1. DETECCIÓN ASISTIDA] ──> [2. COMPROBACIÓN EXCEL] ──> [3. FIRMA RESPONSABLE]
La IA señala posibles        El funcionario verifica     El administrativo emite
anomalías y redacta la       las operaciones con         el concepto bajo su
tabla comparativa.           fórmulas matemáticas.       responsabilidad y firma.
```

---

## 5. Taller Autónomo y Registro de Evidencia MG-A04

El aprendiz debe registrar en su portafolio de evidencias:

1. **Informe de Auditoría de la Tabla de Suministros (Caso 04):**
   - Tabla de discrepancias encontradas con indicación de valores reales vs. valores declarados.
   - Diagnóstico del impacto financiero de no haber detectado el desfase de $1.000.000 COP.
2. **Diseño de un Ejercicio Predictivo Simple:**
   - Proyección estimada del consumo de conectores RJ45 y cable UTP para el primer trimestre de 2027 basada en el histórico de 2026.
3. **Protocolo HITL Formalizado:**
   - Lista de verificación en 5 puntos que aplicará en su puesto de trabajo antes de firmar cualquier trámite administrativo.

### Lista de Chequeo de Aceptación (Criterio de Evaluación RA2)
- [ ] Se identificaron las 4 trampas deliberadas del dataset sin omitir la fecha inexistente ni el SKU duplicado.
- [ ] Se demostró la diferencia conceptual entre la predicción de tokens de un LLM y el cálculo determinista de una hoja de cálculo.
- [ ] El protocolo HITL declara explícitamente los pasos de verificación humana obligatoria.
- [ ] No se acepta ningún resultado numérico sin contrastación de fórmulas.
