# Prueba de la pantalla común para documentos preparados

## Alcance aprobado para esta primera muestra

DP-01 utiliza el PDF de la carpeta «Formularios para cargar» compartida por el usuario. Se muestra directamente dentro de la pantalla común de ADC, con navegación general, Volver a Mis trámites, título y acciones superiores e inferiores de vista preliminar, descarga e impresión.

Esta etapa permite aprobar el documento y la pantalla antes de configurar campos, precarga, MNC y preguntas específicas. No presenta los controles históricos de DP-01 como si estuvieran alineados al PDF. Tampoco considera validado el documento para su presentación administrativa.

## Archivos y reutilización

- `assets/datos/formularios-pdf.js` registra únicamente los documentos habilitados para esta prueba y sus recursos. Actualmente contiene solo DP-01.
- `assets/formularios/DP-01.pdf` conserva los bytes del archivo preparado en Drive. Tiene una página de 612 × 1008 puntos.
- `assets/formularios/DP-01-pagina-1.png` es una representación a 144 ppp para el lienzo. No se utiliza para generar el PDF de descarga.
- `assets/js/tramites/formularios-oficiales.js` reutiliza la pantalla común existente y el flujo de acciones. Cuando el documento está registrado como preparado, muestra sus páginas y entrega el PDF original sin reconstruirlo.

Las seis acciones, tres superiores y tres inferiores, utilizan el mismo PDF. En este modo no se exige completar datos, no se generan líneas automáticas ni se escriben borradores. Los borradores anteriores y la definición histórica de DP-01 permanecen conservados. Los formularios no registrados siguen utilizando su comportamiento previo.

## Fuente y observación pendiente

Carpeta compartida: https://drive.google.com/drive/folders/1AZpunmuWaPrB-qXgHyaaCjGGRwAEqSy3

Archivo de origen: `DP-01-Disposicion-de-Alta.pdf`.

SHA-256: `88d14c87d6de22b1caf0dc17281f0737e5de6ebfc8dca927c48f145f894024a8`.

El original incluye «2009» impreso en la fecha Desde. Se conserva y se advierte en pantalla. Hace falta decidir con el usuario qué versión final se utilizará antes de habilitar un campo de fecha sobre ese sector.

## Próximos pasos sujetos a revisión

1. Aprobar visualmente la pantalla y confirmar la versión del documento.
2. Medir y configurar los campos sobre el PDF, sin cambiar su diseño.
3. Incorporar precarga, edición, borradores y MNC en los campos permitidos.
4. Agregar las preguntas y reglas particulares de DP-01.
5. Extender el patrón a otro documento únicamente después de aprobar este ejemplo.

No se eliminan documentos ni se publica esta prueba hasta que el usuario revise el resultado.
