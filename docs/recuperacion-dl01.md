# Comprobación y acceso a DL-01

Revisión del 13 de noviembre de 2026, a partir del aviso del usuario de que DL-01 había dejado de estar disponible.

## Evidencia

El HTML original `Asistente_Docente_Chaco_v0_9_16_60.html` se conserva en el historial local, commit `61ba27c`. Incluye la función `generatePDF` y los cinco motivos habilitados de DL-01. El código actual conserva la generación en `assets/js/tramites/dl01-pdf.js`, las reglas en `assets/js/tramites/dl01-reglas.js` y las plantillas en `assets/js/documentos/plantillas-dl01.js`.

## Fallo reproducido y corrección localizada

Desde Mis trámites, la tarjeta original «Licencias y permisos · DL-01» únicamente enfocaba el buscador. No escribía DL-01 ni mostraba la selección del motivo. Los resultados de búsqueda tenían una acción específica que la tarjeta original no compartía.

Se centralizó esa acción en `openDL01`, dentro de `assets/js/tramites/buscador.js`. La tarjeta del catálogo y sus resultados de búsqueda ahora escriben DL-01, restablecen el filtro de categoría, muestran los motivos y enfocan su buscador. No se cambiaron el PDF, las reglas, los datos personales ni los documentos preparados de DP-01.

## Verificaciones

- Chrome abrió la pregunta de motivo desde la tarjeta real del catálogo.
- Una prueba aislada con docente, escuela, asignatura y fechas ficticias generó DL-01 por enfermedad o lesión común. El PDF resultante tenía una página y 164739 bytes, con vista previa y enlace de descarga. No hubo errores de JavaScript.
- Las cuatro pruebas de `tests/mbit.test.cjs` pasaron, incluida la regresión del acceso desde el catálogo y las aperturas de los 31 registros.
- Los datos de prueba se usaron en un contexto de navegador aislado; no se modificó el perfil del navegador del usuario.

Esta comprobación confirma un fallo de acceso y la generación del caso probado. No demuestra que se haya identificado todavía cualquier otra mejora visual o funcional histórica a la que pueda referirse el usuario. La impresión física no se probó. La corrección se conserva en la rama local `log-in`; su publicación mediante push se realizará por separado.

## Distribución y conexión con el perfil

La revisión posterior confirmó que operaciones de diseño históricas estaban asignando unos 235 píxeles de altura al botón Volver y 897 píxeles al encabezado de la solicitud. `assets/css/tramites/dl01.css` elimina esas dimensiones en el uso normal de DL-01. Las operaciones guardadas se conservan y siguen disponibles al abrir Ajustes.

`assets/js/tramites/dl01-interfaz.js` se carga después del editor para conservar sus identificadores históricos. Muestra los datos disponibles del perfil y los cursos/cargos de la institución seleccionada antes de las fechas. Si existe una sola institución con nombre y no hay selección, la selecciona automáticamente. Con varias instituciones, conserva la elección del usuario. El resumen se actualiza al cambiar la institución, las fechas o el perfil y señala los registros afectados por el período según la lógica existente.

El calendario de la solicitud se presenta abierto y dentro del flujo de la página. Su año inicial y día de referencia siguen la fecha actual de Argentina, dentro de los años disponibles, en vez de fijarse siempre en 2027. Se conservaron las reglas existentes: inasistencia de un día, duración de Duelo por parentesco, resumen de días corridos/hábiles y próxima presentación a partir de intervalos horarios registrados. No se agregaron nuevas interpretaciones legales ni se usaron los topes anuales como duración automática de una solicitud. Las fechas ingresadas manualmente permanecen protegidas por el mecanismo existente.

El resumen no crea horarios ni datos personales. Si el perfil se guardó en GitHub Pages, es necesario exportarlo e importarlo para disponer de esos datos en localhost, porque ambos sitios tienen almacenamientos distintos.

`tests/dl01-interfaz.test.cjs` comprueba la selección de institución, cursos/cargos, conservación del perfil guardado, calendario interactivo, cálculos existentes, fechas manuales y anchos de 320, 390, 768 y 1440 píxeles. La suite completa pasó 47 pruebas durante esta revisión.

## Accesos y vista previa antes de imprimir

`adcDL01Open` centraliza la apertura desde el motivo buscado, el código DL-01, la tarjeta del catálogo y la lista de formularios necesarios del trámite. Si ya se inició una solicitud compatible, el catálogo y la búsqueda por código vuelven a esa misma solicitud sin borrar institución, fechas ni forma de pago. Si no hay un motivo elegido, siguen mostrando la elección inicial del motivo.

La biblioteca `pdf-lib` 1.17.1 ahora está incluida con su licencia en `assets/vendor/pdf-lib/`. No se requiere un CDN para generar el documento. La vista previa usa un visor ancho y al terminar la generación recibe el foco y se desplaza a pantalla. Durante el proceso se indica el estado y se evitan pulsaciones duplicadas. Los errores no controlados por la función original se presentan en pantalla y rehabilitan el botón.

La prueba de DL-01 recorre los cuatro accesos reales, genera el PDF desde el botón visible con las conexiones externas bloqueadas, comprueba que la vista previa sea visible y permite descargar el resultado. También comprueba la selección automática de la plantilla de dos páginas con tres cursos afectados. No se han cambiado las coordenadas ni los PDF base. La impresión física continúa pendiente de verificación del usuario.
