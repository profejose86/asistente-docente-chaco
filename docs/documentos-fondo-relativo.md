# Fondos reemplazables y posiciones relativas

## Uso local

1. Abrir SC-01 o un PDF incorporado con «Agregar PDF» y abrir Ajustes.
2. Seleccionar el documento, una página o una caja que pertenezca a él.
3. En **Elementos / Documentos → Fondo del documento**, pulsar **Reemplazar PDF de fondo** y elegir el PDF. El panel indica qué documento se está ajustando.
4. Revisar la alineación. Las flechas desplazan únicamente el fondo **0,5 mm por pulsación**, según las medidas lógicas del documento; los valores Horizontal/Vertical permiten afinar en porcentajes. Restablecer offset devuelve el fondo al origen. Deshacer/Rehacer permite revertir el reemplazo o la calibración.
5. Guardar con **Commit to local**. No ejecuta Git ni publica cambios.

El PDF debe tener la misma cantidad de páginas, hasta 20 páginas y 5 MB. Un archivo dañado o una cantidad incompatible se rechaza antes de cambiar el documento. El registro completo conserva el límite previo de 12 MB.

## Qué se conserva

Se mantiene el contenedor lógico de cada página, su tamaño y su relación con los controles. El PDF nuevo se ajusta a ese marco. Se sustituyen sólo las capas de fondo; no se recrean inputs, cajas o tarjetas ni se cambian sus IDs, nombres, clases, valores o listeners. El fondo está recortado al marco y detrás de los controles. Los archivos oficiales originales permanecen intactos.

SC-01 ya usaba porcentajes en sus campos originales. Las cajas, botones, imágenes y secciones nuevas colocadas sobre una página ahora se guardan con `unit: "percent"`. Los movimientos y dimensiones de overlays directos de la página se guardan como `relativeBox` con `left`, `top`, `width` y `height` porcentuales. Al reemplazar un fondo se registran posiciones relativas para las cajas y tarjetas directas compatibles, conservando su geometría visible.

Los ajustes anteriores en píxeles siguen siendo válidos y se reproducen sin una migración destructiva. Los elementos fuera de documentos conservan su sistema anterior. Los contenedores anidados o diseños de flujo que no son overlays directos tampoco se convierten indiscriminadamente a posicionamiento absoluto. Los campos anclados y candados conservan sus protecciones.

## Arquitectura y persistencia

- `assets/js/editor/documento-fondo.js`: resolución de documento/páginas, geometría relativa, preparación del PDF, capas, calibración y adaptación de la plantilla de exportación.
- `elementos.js`: reutiliza el lector PDF.js existente y evita volver a convertir las medidas porcentuales por el zoom.
- `studio-operaciones.js`: delega `replacePdfBackground`, `backgroundOffset` y `relativeBox`; mantiene el historial del motor.
- `ajustes-proyecto-datos.js`: amplía el contrato v1 de forma compatible y valida fuentes, medidas y unidades.
- Ambos motores: normalizan sólo las ediciones nuevas compatibles; los datos se guardan en `assets/datos/ajustes-pagina.json` mediante el mismo puente con revisión, respaldo y escritura atómica.
- SC-01: una llamada al adaptador de fondo antes de generar el PDF conserva sus validaciones, campos, MNC y aplanado. Vista preliminar, descarga e impresión consumen la misma generación y por ello usan el fondo y offset nuevos.

## Alcance y límites

Esta versión habilita el reemplazo en **SC-01 y PDFs agregados desde Ajustes**. Otros formularios oficiales requieren conectar y comprobar sus propios adaptadores de exportación antes de habilitar el reemplazo; no se alteraron sus módulos. No se copia la lógica de SC-01 a los demás formularios.

La sustitución conserva el marco: no agrega ni quita páginas ni cambia automáticamente la estructura de campos. Un PDF con otra relación de aspecto se ajusta a las dimensiones existentes. Los porcentajes no detectan cambios de distribución interna o casilleros que hayan cambiado de lugar; en esos casos hace falta una revisión visual y, si corresponde, reajustar cajas. El offset corrige desplazamientos, no rotación ni deformación de un escaneo.

El adaptador de SC-01 aplica el fondo a su PDF final. No convierte automáticamente notas o controles nuevos arbitrarios de ADC Studio en campos del PDF final: esa capacidad sigue requiriendo el esquema de exportación correspondiente. Los PDFs agregados al editor conservan su función de lienzo y sus overlays web.

## Verificación

**95 pruebas aprobadas, 0 fallidas y 0 omitidas** en la suite completa, más las repeticiones dirigidas de reemplazo y documentos. Las pruebas usan archivos temporales y PDFs de prueba, incluido SC-01 escalado al doble de resolución. Comprueban identidad y valores de los inputs, conservación de tarjetas, geometría, deshacer/rehacer, rechazo de archivos incompatibles, zoom, arrastre de cajas, validación del contrato y guardado/recuperación mediante el puente. Se verificó el fondo nuevo en un PDF final aplanado de 612 × 1008 puntos y se inspeccionaron renders del lienzo y del PDF. Sin commit ni push ni cambios en los ajustes personales existentes.
