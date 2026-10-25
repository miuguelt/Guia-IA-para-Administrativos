# Excepciones de arquitectura

## Adaptación local del portafolio · 21 de octubre de 2026

Las dos copias locales del motor de evidencias aceptan `submission.program`, `submission.context` y `submission.requiredArtifacts`. La configuración procede de `deliverables.registry.json`; la copia JavaScript se publica mediante el publicador canónico. La adaptación separa las acciones de exportación del formulario oculto, elimina rótulos de otro programa e incorpora respuestas al respaldo JSON. Los campos y las claves de las evidencias existentes se conservan.

Las pruebas de autonomía ejecutan ambos motores contra el mismo registro y comprueban conteo, programa, exportación y recuperación. Esta adaptación está limitada a la guía; no modifica el SDK compartido ni afirma que sus cambios ya estén integrados allí. Cuando el SDK compartido incorpore este contrato, se deben actualizar ambas copias juntas y conservar estas pruebas de compatibilidad.

## Registro de evidencias generado

- **Archivo:** `js/registro-entregables.js`.
- **Excepción:** el paquete generado tiene 624 líneas y supera el objetivo de 400 líneas; la línea base anterior registra 479 y está pendiente de reconciliación mediante el publicador canónico.
- **Razón:** el publicador canónico serializa los cinco formularios curriculares y el complemento EcoBogotá con sus criterios completos dentro de un solo módulo. El archivo no contiene lógica escrita a mano y permite que las evidencias funcionen sin `fetch` cuando el aula se abre localmente.
- **Fuente y responsable:** `deliverables.registry.json`; lo genera `Publish-GuideEvidenceRegistry.ps1`. La persona que mantiene el curso conserva los textos de aprendizaje y los campos; el equipo de DevBrain mantiene el generador.
- **Control:** no edites la copia JavaScript. Ejecuta el publicador después de cambiar el registro y conserva esta excepción mientras el paquete se mantenga generado. La línea base local registra el tamaño actual y bloquea su crecimiento accidental.
- **Plan de reducción:** solicitar al equipo de DevBrain que el publicador permita una representación JavaScript compacta manteniendo el mismo contrato y el soporte local. Al actualizar el generador, retirar esta excepción y reducir la línea base en conjunto.
