> **ARCHIVO HISTÓRICO — NO USAR COMO MATERIAL DE ESTA COHORTE.** Este contenido fue preparado para Redes CIMI/Girón y no se ha validado para la propuesta de cohorte del CGAO, Subsede Vélez, Regional Santander. Para esta formación use la [guía vigente](../../index.html), la [cartilla de aprendices](../Documentos/Cartilla_aprendices_retos_IA_SENA_Bogota.docx), el [libro de práctica](../Documentos/Materiales_practica_IA_SENA_Bogota.xlsx) y la [guía de herramientas y preparación](../herramientas-y-preparacion.md). No cargue datos personales o institucionales reales en servicios de IA externos. Funciones, nombres y permisos de herramientas pueden cambiar; verifique el acceso con el equipo formador.

# Caso de Estudio 02: Conjunto de PQRS Reales para Tratamiento No Estructurado
**Curso:** Implementación de herramientas de IA en la optimización de la productividad (21720210 V1)  
**Ambiente:** Redes CIMI - SENA Girón  
**Uso didáctico:** Clasificación, extracción de entidades y respuesta asistida (Estaciones 02 y 03)

---

## 1. Instrucciones de Seguridad y Buenas Prácticas
> **ADVERTENCIA DE PRIVACIDAD (Ley 1581 de 2012):**  
> En este ejercicio, los nombres, números de cédula, correos y fichas son datos de práctica; no corresponden a registros reales.  
> **Regla de Oro Administrativa:** Jamás ingrese nombres reales, números de documento, direcciones o información médica en herramientas de IA comerciales públicas sin anonimización previa.

---

## 2. Conjunto de Datos de Entrada (5 PQRS de Prueba)

### PQRS-001: Petición de Paz y Salvo con Inconsistencias
```text
De: aprendiz_juan_perez@correo-simulado.com
Fecha: 28 de Octubre de 2026, 08:14
Asunto: URGENTEEEEE MI PAZ Y SALVO POR FAVOR

Buenos dias señores coordinacion de redes cimi me urge el paz y salvo por q ya termine etapa productiva el mes pasado y la empresa tech solutions me va a contratar fijo pero me piden el papel del sena ya ya ya. Mi instructor carlos no me contesta y el monitor de redes dice q tengo un libro de cableado estructurado en la biblioteca pero eso yo ya lo devolvi hace como seis meses y no me quieren firmar. Mi ficha creo q es la 2825410 o 2825419 no me acuerdo bien soy tecnologo en gestion de redes de datos me llamo Juan Carlos Perez Gomez cc 1098765432 de giron. Porfa ayudenme que no quiero perder el trabajo.
```

---

### PQRS-002: Queja Grave de Convivencia e Incidente de Laboratorio
```text
De: maria_rodriguez_aprendiz@correo-simulado.com
Fecha: 29 de Octubre de 2026, 11:32
Asunto: Queja formal contra instructor y solicitud de revision de nota

Respetado Coordinador del CIMI:
Por medio de la presente manifiesto mi inconformidad con lo ocurrido el dia martes 27 de octubre en el ambiente de Redes CIMI durante la clase de Enrutamiento Avanzado. El instructor encargado del módulo nos calificó con D (Deficiente) a todo el grupo 2891122 argumentando que no entregamos la topología OSPF completa. Sin embargo, el rack de comunicaciones número 3 se encontraba sin fluido eléctrico por mantenimiento y las tarjetas de red de los routers Cisco estaban averiadas, situación que le fue informada a las 8:00 a.m. Adicionalmente, el instructor se dirigió a nosotros con palabras desobligantes y tono intimidatorio, diciendo que 'así nunca nos íbamos a graduar'. Solicito comité de evaluación extraordinario, peritaje del estado de los equipos del ambiente y asignación de un instructor par para la reevaluación de la evidencia práctica. Anexo firmas de 18 aprendices.
Atentamente, Maria Fernanda Rodriguez (Vocera de la Ficha 2891122).
```

---

### PQRS-003: Reclamo Confuso de Homologación y Traslado de Centro
```text
De: oscar_villamizar_99@correo-simulado.com
Fecha: 30 de Octubre de 2026, 15:45
Asunto: homologacion o traslado no se que hacer

hola buenas tardes mire le cuento yo venia estudiando en bogota en el centro de electricidad y telecomunicaciones y me toco venirme para bucaramanga a vivir con mi tia porque no tengo plata para el arriendo alla. hable con un señor alla y me dijo q fuera al cimi giron que alla me recibian en redes pero en la plataforma sofia plus me sale cancelada la matricula y yo no la cancele solo pedi aplazamiento pero no se si la carta llego. quiero saber cuando empiezan clases en giron si me valen lo que ya vi o me toca empezar desde cero y si hay auxilio de transporte para viajar desde el norte de bucaramanga hasta el cimi en giron. mi documento es 1095822331.
```

---

### PQRS-004: Solicitud de Certificado Laboral de Ex-Contratista
```text
De: ing_ramirez_telecom@correo-simulado.com
Fecha: 01 de Noviembre de 2026, 09:05
Asunto: Certificado de cumplimiento contractual y paz y salvo almacén

Apreciada Coordinación Administrativa CIMI:
Cordial saludo. Estuve vinculado como instructor contratista en el área de Redes durante el primer semestre de 2026 bajo la orden de servicio 4521. Requiero con urgencia el certificado de cumplimiento final y la constancia de que no adeudo equipos en el almacén general ni en el pañol de herramientas de Redes, con destino a la licitación pública del IDRD en la cual estoy participando. 
Agradezco indicarme el procedimiento exacto y el tiempo de respuesta, dado que el cierre de la convocatoria es el próximo viernes.
Cordialmente, Ing. Harold Ramirez Castro - C.C. 91.245.890.
```

---

### PQRS-005: Felicitación y Solicitud de Convenio Empresarial
```text
De: gerencia@fibraopticasantander.com.co
Fecha: 02 de Noviembre de 2026, 16:20
Asunto: Felicitaciones por aprendices en etapa práctica y propuesta de nuevo convenio

Estimado Subdirector y Coordinador Académico CIMI Girón:
Escribo en representación de Fibra Óptica Santander SAS. Queremos felicitar al centro por el excelente desempeño técnico y ético de los aprendices de la ficha 2789910 de Redes y Telecomunicaciones que culminaron sus 6 meses de contrato de aprendizaje con nosotros. De los 4 aprendices, vincularemos laboralmente a 3 como técnicos de planta. 
Asimismo, solicitamos información para suscribir un convenio especial con el SENA para recibir 10 nuevos aprendices en la convocatoria del mes de diciembre para tendido de redes FTTH en el área metropolitana de Bucaramanga. ¿Cuál es el contacto del líder de relaciones corporativas del centro?
Atentamente, Laura Viviana Mendoza - Gerente General.
```

---

## 3. Utilidad de la IA en este Reto
En este ejercicio, la IA demuestra su verdadero potencial como "procesador de texto no estructurado". La utilidad principal de la IA radica en:
- **Estructuración de Datos:** Transformar párrafos caóticos con jerga y errores ortográficos en formatos JSON o tablas tabulares estructuradas sin intervención manual.
- **Detección de Intenciones:** Identificar el tipo de solicitud (Petición, Queja, Felicitación) de manera probabilística, superando las limitaciones de los filtros tradicionales por palabras clave.
- **Redacción Institucional Asistida:** Acelerar el tiempo de respuesta inicial, generando borradores que cumplen con la Ley 1755 de 2015, permitiendo al funcionario concentrarse solo en la validación y firma.

---

## 4. Retos de Aprendizaje con este Dataset

1. **Reto de Extracción Estructurada:** Convertir el texto libre en una tabla JSON / Markdown normalizada con los campos: `ID`, `Remitente`, `Tipo_PQRS` (Petición, Queja, Reclamo, Sugerencia, Felicitación), `Nivel_Prioridad` (Alta, Media, Baja), `Competencia_Destino` (Coordinación Académica, Biblioteca, Almacén, Contratación, Relaciones Corporativas), `Datos_Faltantes`, `Requiere_Verificacion_Humana` (Sí/No).
2. **Reto Anti-Alucinación:** Diseñar el prompt con directivas explícitas de no invención: *Si el aprendiz no da su número de ficha exacto o dice 'creo que es', la IA debe marcar 'FICHA NO CONFIRMADA' y bajo ninguna circunstancia inventar un número de ficha válido*.
3. **Reto de Borrador Institucional:** Redactar la respuesta formal con el tono institucional SENA, citando plazos reales de respuesta según la normatividad colombiana (Ley 1755 de 2015: 15 días hábiles para peticiones, 10 para documentos/certificados, 30 para consultas).
