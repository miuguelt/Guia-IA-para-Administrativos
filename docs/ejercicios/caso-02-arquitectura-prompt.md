> **ARCHIVO HISTÓRICO — NO USAR COMO MATERIAL DE ESTA COHORTE.** Este contenido fue preparado para Redes CIMI/Girón y no se ha validado para la propuesta de cohorte del CGAO, Subsede Vélez, Regional Santander. Para esta formación use la [guía vigente](../../index.html), la [cartilla de aprendices](../Documentos/Cartilla_aprendices_retos_IA_SENA_Bogota.docx), el [libro de práctica](../Documentos/Materiales_practica_IA_SENA_Bogota.xlsx) y la [guía de herramientas y preparación](../herramientas-y-preparacion.md). No cargue datos personales o institucionales reales en servicios de IA externos. Funciones, nombres y permisos de herramientas pueden cambiar; verifique el acceso con el equipo formador.

# Caso de Estudio 02: Arquitectura de Prompting y Control de Deriva
**Curso:** Implementación de herramientas de IA en la optimización de la productividad (21720210 V1)  
**Ambiente:** Redes CIMI - SENA Girón  
**Uso didáctico:** Diseño R-C-I-R-S y blindaje contra alucinaciones (Estación 02)

---

## 1. Contexto Operativo
En el área administrativa, el uso de prompts (instrucciones) genéricos ("hazme un resumen de esto", "escribe un correo sobre X") genera respuestas inexactas, en un tono inadecuado (demasiado coloquial o robótico) y a menudo omite restricciones legales de la entidad. 
Para resolver esto, el SENA implementa el protocolo **R-C-I-R-S**:
- **R (Rol):** Quién es la IA en este contexto.
- **C (Contexto):** Qué información de fondo necesita para entender la tarea.
- **I (Instrucción):** Cuál es la acción específica que debe realizar.
- **R (Restricciones):** Qué no debe hacer (ej. no inventar datos, no usar palabras extranjeras).
- **S (Salida):** En qué formato debe entregar el resultado (tabla, markdown, párrafo formal).

---

## 2. Utilidad de la IA en este Reto
La construcción de prompts estructurados permite:
- **Resultados Predecibles:** Al estandarizar el prompt, se obtienen respuestas uniformes independientemente del modelo (ChatGPT, Claude, Gemini) que se use.
- **Seguridad de la Información:** Al incluir restricciones claras, se reduce significativamente el riesgo de que la IA invente políticas o asuma procesos que el CIMI no aplica.
- **Ahorro de Tiempo a Largo Plazo:** Un buen prompt se diseña una vez y se guarda como "GEMA" (instrucción guardada) para ser reutilizado por todo el equipo, optimizando procesos repetitivos.

---

## 3. Retos de Aprendizaje: El Ciclo V.E.R.A.

Usted deberá redactar tres comunicados administrativos usando IA, experimentando con diferentes niveles de instrucción:

### Iteración 1: El Fallo Provocado (Prompt Genérico)
**Acción:** Ingrese a la herramienta de IA y escriba la siguiente instrucción pobre:
> *"Escribe una circular diciendo que los laboratorios de redes estarán cerrados la otra semana por mantenimiento de aires acondicionados y que las clases serán virtuales."*

**Análisis:**
- ¿Qué inventó la IA que no se le dijo? (¿Fechas exactas? ¿Nombres de plataformas virtuales?)
- ¿El tono suena como una circular oficial del SENA o suena a correo personal?

### Iteración 2: El Blindaje R-C-I-R-S (Prompt Robusto)
**Acción:** Diseñe un prompt profesional estructurado:
- **Rol:** Eres el Coordinador Académico de Redes CIMI del SENA Regional Santander.
- **Contexto:** Se realizará mantenimiento de los sistemas de refrigeración (aires acondicionados) del bloque de laboratorios de Redes desde el 09 al 13 de noviembre.
- **Instrucción:** Redacta una Circular Informativa dirigida a instructores y aprendices notificando la suspensión de actividades presenciales en esos ambientes, y el paso temporal a formación asistida por tecnologías (Teams).
- **Restricciones:** Tono institucional formal. NO inventes números de resolución ni firmas adicionales. El asunto debe ser claro.
- **Salida:** Formato Markdown con bloques de texto claros.

**Análisis:**
- Compare este resultado con el de la Iteración 1. Documente las mejoras en su hoja de reporte.

### Iteración 3: Control de Deriva
**Acción:** En la misma ventana de chat donde generó la circular, dígale a la IA:
> *"Ah, me equivoqué, no es para Redes, es para los laboratorios de Soldadura. Cámbialo. Y añade que si no asisten virtualmente pierden el trimestre."*

**Análisis:**
- ¿La IA mantuvo el tono institucional o se volvió amenazante?
- La "Deriva" ocurre cuando el chat se alarga y la IA olvida el Rol y Restricciones originales. Documente cómo el "botón de nuevo chat" (sesión limpia) previene este error.
