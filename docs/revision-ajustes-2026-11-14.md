# Revisión local de ADC Studio — 14/11/2026

Se revisaron los motores de `index.html` y `ADC_Ingreso_Editable.html`, los adaptadores compartidos y el puente local. Se conservaron los cambios existentes y el archivo de ajustes del usuario. Sin commit ni push.

Resultado final: **92 pruebas aprobadas, 0 fallidas y 0 omitidas** con `npm test`. La verificación de arquitectura y `git diff --check` también finalizaron correctamente. Se añadieron ocho escenarios de herramientas, repartidos entre ingreso y aplicación.

## Correcciones

- Deshacer/Rehacer cancela la herramienta activa. Reproducción anterior: plegar una sección, deshacer y pulsar otro texto podía volver a ejecutar el plegado.
- Agrupar reserva el siguiente clic para elegir destino; el arrastre directo ya no lo consume. El destino debe ser una sección creada por el editor y debe respetar el formulario de origen.
- La edición de texto por doble clic sólo se activa en selección/tamaño. No interrumpe dibujo, agrupación ni colocación de desplegables.
- Los dos importadores reutilizan las propiedades admitidas por el contrato compartido, incluyendo las dimensiones de botones y los atributos históricos de anotaciones. Se elimina la divergencia de sus listas locales.
- Escape, cancelación del puntero o pérdida de foco restaura el estado anterior de la regla que se estaba moviendo o redimensionando.
- El inspector tiene una × para apartarlo cuando tapa el elemento que se desea seleccionar. Reaparece al cambiar la selección.

## Cobertura de comprobación

| Área | Comprobaciones automatizadas |
| --- | --- |
| Acceso y panel | Cinco clics/toques o Tab, aislamiento por pestaña, cierre de sesión, orientación, solapas, ayudas y modo navegación. |
| Manipulación | Selección, arrastre, ocho tiradores, superposición, duplicación, capas, candados, medidas y atajos. |
| Texto y estilo | Edición en línea, etiquetas con controles, placeholders, confirmación/cancelación, formato, paletas y copiar/pegar estilo sin copiar datos ni identidad. |
| Organización | Subir/bajar, plegar, agrupar, separar, centrar y revertir las acciones. |
| Creación | Cajas, secciones, botones visuales, desplegables, burbujas; uso de estos últimos fuera del editor y recuperación tras recarga. |
| Anotaciones | Notas, recuadros, óvalos, líneas y grosor inicial; goma, eliminación y restauración. |
| Documentos | Importación de imagen, reemplazo, eliminación reversible, PDF multipágina, cajas sobre el documento, movimiento y escala conjunta. |
| Guías | Reglas movibles/redimensionables, cancelación, centímetros CSS, guías persistentes, imán y movimiento libre con Alt. |
| Estado | Deshacer/Rehacer, historial, guardar borrador, exportar/importar y recargar. |
| Puente | Escritura real en archivos temporales desde ambas entradas, respaldo, recuperación, sin cambios, desconexión, conflictos y aislamiento de pantallas. |
| Protecciones | Campos originales de formularios protegidos, conservación de IDs/valores/listeners y ausencia de contraseñas en la simulación. |

## Límites

Las pruebas usan Chrome automatizado y datos de prueba locales; no equivalen a pulsar manualmente cada combinación en la pestaña personal abierta del usuario. No se publicaron cambios ni se probaron en producción. El acceso nativo a esa ventana había fallado en la revisión anterior.

Los botones nuevos sin una acción configurada son visuales y quedan deshabilitados al salir de Ajustes; es intencional. Eliminar elementos oculta o retira ajustes reversibles: no elimina datos docentes ni modifica el PDF oficial. Las capas actúan dentro de sus contenedores y contextos de apilamiento.

Agregar un PDF y editar su apariencia web no integra automáticamente esos controles nuevos en el PDF final de un trámite: esa integración sigue requiriendo un esquema de campos específico. Tampoco se pueden editar como texto HTML las letras impresas dentro del PDF. El puente guarda el archivo de ajustes y no ejecuta Git.

Las pruebas no cubren todas las combinaciones de fuentes, archivos dañados, extensiones de Chrome o dispositivos físicos. Se debe seguir comprobando visualmente cada formulario oficial antes de presentarlo.
