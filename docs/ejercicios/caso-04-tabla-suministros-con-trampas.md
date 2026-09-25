# Caso de Estudio 04: Tabla de Compras y Suministros con Trampas Deliberadas
**Curso:** Implementación de herramientas de IA en la optimización de la productividad (21720210 V1)  
**Ambiente:** Redes CIMI - SENA Girón  
**Uso didáctico:** Auditoría de datos, detección de alucinaciones y validación cruzada (Estación 04)

---

## 1. El Riesgo de Delegar Cálculos y Auditorías a Ciegas
> **PRINCIPIO CRÍTICO DE INTELIGENCIA ARTIFICIAL:**  
> Los Modelos de Lenguaje (LLMs como ChatGPT, Copilot o Claude) **NO son calculadoras**. Son predictores estadísticos de palabras y tokens.  
> Cuando un administrativo le pide a una IA: *"Suma esta columna y dime si los totales cuadran"*, la IA frecuentemente:
> 1. Responde con un número plausible que parece correcto, pero tiene un error de cálculo sutil.
> 2. Asume que los datos están bien porque tienen formato de tabla.
> 3. Alucina descripciones de productos que no existen en la lista.

---

## 2. Conjunto de Datos Tabular: Ejecución Presupuestal Suministros Redes CIMI

A continuación se presenta la tabla de compras reportada por un proveedor de insumos de telecomunicaciones para los ambientes del CIMI. Esta tabla contiene **4 trampas y errores sutiles** deliberadamente introducidos para evaluar el criterio del administrativo y la capacidad de la IA.

| Ítem | Código SKU | Descripción del Producto | Cantidad | Valor Unitario (COP) | Subtotal Facturado (COP) | Fecha de Entrega | Estado de Recepción |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | CAB-UTP-6A | Bobina Cable UTP Cat 6A 305m 100% Cobre | 4 | $ 680.000 | $ 2.720.000 | 12/10/2026 | Recibido Conforme |
| 2 | CON-RJ45-6 | Conectores RJ45 Blindados Cat 6A (Caja x 100) | 10 | $ 125.000 | $ 1.250.000 | 14/10/2026 | Recibido Conforme |
| 3 | HER-CRIMP-01 | Pinza Ponchadora Profesional RJ45/RJ11 | 6 | $ 95.000 | $ 570.000 | 14/10/2026 | Recibido Conforme |
| 4 | SW-CISCO-L2 | Switch Administrable 24 Puertos Gigabit PoE+ | 2 | $ 2.850.000 | $ 4.700.000 | 18/10/2026 | En Bodega |
| 5 | FIB-CLEAN-01 | Cassette Limpiador de Conectores Ópticos | 5 | $ 85.000 | $ 425.000 | 20/10/2026 | Recibido Conforme |
| 6 | CAB-UTP-6A | Patch Cord Cat 6A 2 Metros Azul | 30 | $ 18.000 | $ 540.000 | 22/10/2026 | Recibido Conforme |
| 7 | MOD-SFP-10G | Transceiver Óptico SFP+ 10Gbps SR 850nm | 8 | $ 160.000 | $ 1.280.000 | 31/09/2026 | Pendiente Almacén |
| 8 | HER-PELACAB | Pelador de Fibra Óptica Tres Agujeros | 4 | $ 72.000 | $ 288.000 | 25/10/2026 | Recibido Conforme |
| 9 | BAT-UPS-12V | Batería Sellada 12V 9Ah para UPS Rack | 6 | $ 110.000 | $ 660.000 | 26/10/2026 | Recibido Conforme |
| 10 | KIT-FUSION-01 | Cuchilla de Precisión para Fibra (Cleaver) | 2 | $ 340.000 | $ 680.000 | 28/10/2026 | Recibido Conforme |

**TOTAL FACTURADO DECLARADO POR PROVEEDOR:** **$ 13.113.000 COP**

---

## 3. Las 4 Trampas Ocultas (Guía Confidencial para el Instructor / Verificación)

1. **Trampa A (Cálculo Aritmético Erróneo en Ítem 4):**  
   - 2 unidades de Switch a $2.850.000 equivalen a **$5.700.000**, pero la tabla factura **$4.700.000** (error de $1.000.000 de desfase).
2. **Trampa B (Total Facturado Inconsistente):**  
   - Si se suman los subtotales tal como están escritos en la tabla:  
     $2.720.000 + $1.250.000 + $570.000 + $4.700.000 + $425.000 + $540.000 + $1.280.000 + $288.000 + $660.000 + $680.000 = **$13.113.000**.  
     Sin embargo, si se calcula con los valores unitarios reales corregidos, la suma debe ser **$14.113.000**.
3. **Trampa C (Código SKU Duplicado e Incoherente en Ítems 1 y 6):**  
   - El código `CAB-UTP-6A` se asignó tanto a una *Bobina de 305m* como a un *Patch Cord de 2 metros*. Esto colapsará los inventarios y kardex si se procesa sin corrección.
4. **Trampa D (Fecha Imposible en el Calendario en Ítem 7):**  
   - La fecha de entrega del ítem 7 es `31/09/2026`. ¡Septiembre solo tiene 30 días! Si un sistema contable o de inventario automatizado intenta registrar esa fecha, generará un error fatal o inconsistencia de base de datos.

---

## 4. Ejercicio de Auditoría en Parejas (Humano vs IA)

1. **Fase 1 (Prueba a la IA sin restricciones):**  
   Pegue la tabla en la IA con el prompt: *"Revisa esta tabla y dime si todo está en orden para proceder con el pago"*.  
   Observe si la IA detecta la fecha del 31 de septiembre, el SKU duplicado o la multiplicación del ítem 4. (En la mayoría de los casos, la IA responderá complacentemente que todo parece en orden).
2. **Fase 2 (Prompt de Auditoría Forense y Human-in-the-Loop):**  
   Aplique el prompt estructurado con instrucciones matemáticas explícitas y lista de comprobación de integridad.
3. **Fase 3 (Verificación Humana con Hoja de Cálculo):**  
   Corrobore cada operación en Excel/Calc con fórmulas nativas (`=CANTIDAD*VALOR_UNITARIO`) y contraste con el resultado arrojado por el modelo.
