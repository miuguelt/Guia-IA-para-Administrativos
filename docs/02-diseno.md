# Estación 02: Arquitectura del Prompting Seguro, Prevención de Deriva y Protocolos Anti-Alucinación
**Programa:** Implementación de herramientas de inteligencia artificial en la optimización de la productividad (21720210 V1)  
**Ambiente de Formación:** Redes CIMI · SENA Girón  
**Fase Pedagógica:** Contextualización · **Duración:** 10 horas (Presencial + Taller de Laboratorio)  
**Resultado de Aprendizaje (RAP):** RA2. Programar proceso automatizado de acuerdo con diseño y tipo de inteligencia artificial.  
**Evidencia Asociada:** MG-A02 (Evidencia de Producto - Catálogo de Prompts Blindados y Decálogo Anti-Deriva)

---

## 1. Ingeniería de Prompts Administrativos: De la Ambigüedad a la Precisión

Para un administrativo, un **prompt** no es una "pregunta" o un saludo casual; es una **especificación técnica de trabajo** entregada a un motor de procesamiento lingüístico.  

Si el administrativo escribe: *"Redáctame un correo para unos aprendices que no entregaron tareas"*, obtendrá una respuesta genérica, probablemente con expresiones mexicanas o españolas ("chicos", "deberes", "vosotros"), tutores en lugar de instructores, y un tono que no encaja con la solemnidad del SENA.

### 1.1 La Arquitectura R-C-I-R-S (Blindaje en 5 Capas)

Para garantizar resultados 100% útiles y sin desvíos, todo requerimiento profesional debe seguir esta estructura:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ARQUITECTURA R-C-I-R-S                                │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ 1. ROL        │ Define el perfil, autoridad y nivel de formalidad técnica.  │
│               │ "Actúa como Asistente de Coordinación Académica del SENA..."│
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 2. CONTEXTO   │ Antecedentes, marco normativo y documentos de referencia.   │
│               │ "El reglamento del aprendiz fija el debido proceso en..."   │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 3. INSTRUCCIÓN│ Verbo imperativo exacto y meta concreta sin rodeos.         │
│               │ "Elabora una citación formal a Comité de Evaluación para..."│
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 4. RESTRICCIÓN│ Delimitación negativa: qué NO hacer bajo ninguna causa.     │
│ (Anti-Riesgo) │ "No inventes fechas. Usa estrictamente el texto dado..."    │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 5. SALIDA     │ Estructura visual exacta del resultado.                     │
│               │ "Entrega en formato tabla Markdown con 4 columnas: [...]"   │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 2. El Mecanismo de Delimitadores: La Muralla contra la Confusión

Uno de los errores más frecuentes es mezclar las instrucciones con los datos a procesar en un solo bloque de texto continuo. La IA puede confundir una frase del usuario con una orden.  
**Solución técnica:** El uso de delimitadores claros (como triples comillas `"""` o etiquetas XML `<documento> </documento>`).

### Ejemplo Comparativo

#### Prompt Malo (Vulnerable a Alucinación y Deriva):
> *"Resume este correo y dime qué hacer con este aprendiz que debe una plata y pide paz y salvo: Hola buenos días necesito mi paz y salvo urgente ficha 2825410... "*

#### Prompt Blindado con R-C-I-R-S y Delimitadores:
```text
[ROL]
Actúa como profesional de Gestión Documental del SENA Centro CIMI Girón.

[CONTEXTO]
Estás procesando solicitudes de paz y salvo de aprendices que culminaron etapa productiva.

[INSTRUCCIÓN]
Analiza el correo electrónico delimitado entre las etiquetas <correo> y </correo>. Extrae en una lista estructurada:
1. Nombre completo del aprendiz.
2. Número de ficha y cédula.
3. Motivo por el cual no le han firmado el paz y salvo.
4. Dependencia competente que debe resolver la novedad.

[RESTRICCIONES CRÍTICAS]
- Limítate EXCLUSIVAMENTE a la información contenida dentro de <correo>.
- Si el aprendiz NO menciona su número de cédula o número de ficha exacto, escribe estrictamente 'DATO NO SUMINISTRADO'. Bajo ninguna circunstancia inventes o deduzcas números.
- No incluyas saludos ni despedidas en tu análisis; entrega únicamente la lista estructurada.

[SALIDA ESPERADA]
Formato de lista numerada con viñetas en negrita.

<correo>
Buenos dias señores coordinacion de redes cimi me urge el paz y salvo por q ya termine etapa productiva el mes pasado y la empresa tech solutions me va a contratar pero me piden el papel ya. El monitor dice q tengo un libro en biblioteca pero ya lo devolvi. Mi ficha creo q es la 2825410 me llamo Juan Perez.
</correo>
```

---

## 3. Contraejemplo en Vivo: Cómo provocar y detectar la "Deriva Contextual" (*Context Drift*)

En el laboratorio de Redes CIMI, los aprendices experimentarán la degradación de un chat largo:
1. Si en un hilo de chat se redacta primero una citación, luego se pide una receta de cocina, luego una lista de compras y en el mensaje 15 se pide revisar un contrato, **la IA mezclará el tono y olvidará las restricciones iniciales**.
2. **Protocolo de Prevención:** La **Regla de la Nueva Sesión**. Toda tarea administrativa crítica que inicie debe comenzar en un hilo de chat limpio y nuevo con su respectivo prompt maestro estructurado.

---

## 4. Práctica Guiada (Protocolo V.E.R.A.)

Para dominar la arquitectura de prompts, aplicaremos por primera vez el **Protocolo V.E.R.A.** (Verificar, Ejecutar TDD, Revisar, Atribuir).

Utilice el [Caso de Estudio 02: Conjunto de PQRS](file:///c:/Users/Miguel/Documents/Aplicaciones/_projects/Guia%20IA%20para%20Administrativos/docs/ejercicios/caso-02-dataset-pqrs-desordenadas.md):

**Iteración 1 (El Fallo):**
- Tome el caso `PQRS-002` (la queja de convivencia contra el instructor por el rack sin fluido eléctrico).
- Pida a la IA: *"Hazme un resumen de esta queja"*. 
- Note cómo la IA asume hechos ("el instructor es negligente") que no constan en el documento original. Esto es un riesgo legal para el SENA.

**Iteración 2 (El Blindaje R-C-I-R-S):**
- Redacte un prompt estructurado que extraiga:
  - Hechos objetivos reportados.
  - Testigos o firmas aportadas.
  - Alerta de riesgo (conflicto potencial instructor-aprendiz).
  - Petición concreta de la vocera.
- **[RESTRICCIÓN CRÍTICA]:** Instruya explícitamente a la IA: *"No asumas posturas, no emitas juicios de valor sobre el instructor, cíñete exclusivamente a los hechos narrados"*.

**Iteración 3 (Verificación y Atribución):**
- Pruebe el prompt en el navegador. 
- Verifique que el resumen extraído es neutral, objetivo y sirve como insumo legal para un comité de evaluación. Si aún hay adjetivos calificativos inventados, ajuste la restricción y repita.

---

## 5. Taller Autónomo y Registro de Evidencia MG-A02

El aprendiz debe construir y registrar en su portafolio de evidencias:

1. **Catálogo de 3 Prompts Blindados para su Área de Trabajo:**
   - Prompt 1: Para clasificación y respuesta formal a comunicaciones externas.
   - Prompt 2: Para síntesis y extracción de compromisos en reuniones de trabajo.
   - Prompt 3: Para revisión de coherencia y estilo institucional de circulares.
2. **Matriz de Pruebas de Estrés:**
   - Evidencia de haber probado cada prompt con una entrada desordenada.
   - Demostración de cómo las restricciones evitaron que la IA alucinara.
3. **Declaración del Decálogo Anti-Deriva:** Los 5 hábitos operativos que aplicará en su computador para evitar pérdidas de rumbo y daño a documentos oficiales.

### Lista de Chequeo de Aceptación (Criterio de Evaluación RA2)
- [ ] Los 3 prompts implementan rigurosamente la estructura R-C-I-R-S.
- [ ] Se utilizan delimitadores claros (`"""` o etiquetas XML) para separar instrucciones de datos.
- [ ] Se declaran restricciones negativas explícitas contra alucinaciones (*"Si no consta, escribe NO DISPONIBLE"*).
- [ ] Se comprueba que la salida entregada es directamente utilizable sin necesidad de reescritura masiva.
