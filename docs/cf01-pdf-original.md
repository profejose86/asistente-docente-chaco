# CF-01 sobre el PDF aportado

Se copió `materiales/09-Formulario-CF-01.pdf` sin alterar sus bytes a `assets/formularios/CF-01.pdf`. La página original mide 612 × 1008 puntos. El PNG se renderizó a 120 dpi exclusivamente para el lienzo; la descarga conserva el PDF vectorial original.

SHA-256: `43b0685c984aa8a381d243ec3a47f1867bb58a89bfa44922d0e9b8cb44600a22`.

## Controles

Se reutiliza el motor de SR-01: PDF original visible, cajas alineadas por coordenadas en puntos, vista preliminar, descarga, impresión, MNC y borrador local. Las dos barras de acciones se conservan.

Los campos cubren organismo solicitante, apellido y nombres, género, CUIL, teléfono, domicilio, tres establecimientos con sus datos institucionales y tres filas de cargos por establecimiento. Cada fila contiene denominación, situación de revista T/I/S, asignatura, año, división, turno y horas cátedra. Se incorporaron los campos de número de unidad educativa que faltaban en el modelo anterior, los cargos de las filas segunda y tercera, período, funciones a afectar, notificación y espacios de firma. Las firmas quedan vacías por defecto y no admiten MNC.

La precarga existente se mantiene para apellido, nombres, domicilio y teléfono fijo; se agregó el género desde `sexo`. No se inventan CUIL, números de escuelas ni situaciones de revista. El DNI no tiene casillero en este original: si existía en un borrador se conserva con un aviso, sin imprimirlo en otro lugar.

El original usa Calibri, principalmente 11,04 puntos, con texto secundario de 9/9,96. El relleno utiliza la alternativa del motor compartido (Arial en pantalla / Helvetica en PDF), 11 puntos en texto general, 9 en tablas y notificación, 10 en fechas y firmas. El ajuste se reduce por campo hasta 7 puntos; si no cabe, se conserva el contenido y se bloquea la exportación con una explicación.

## Borradores anteriores

La clave continúa siendo `adc-official-form-cf01-draft-v1`. Se conservan claves de los cargos originales y se añaden sufijos 2/3 para las nuevas filas, sin reordenar automáticamente datos históricos.

Los establecimientos adicionales y los códigos de oficina/anexo o nombres antiguos sin equivalente quedan editables debajo del documento con aviso. Si contienen datos o MNC, impiden exportar hasta su revisión. El organizador de establecimientos permite reordenar los bloques completos o quitar excedentes. No se agregan páginas al PDF oficial.

El Anexo IV es un documento separado: se conserva su enlace y los datos previos con avisos, sin mezclarlos con esta página. Las fechas históricas de notificación DD/MM/AAAA se convierten a ISO para el calendario; el texto que no se pueda interpretar se conserva en `legacy_fechaNotificacion` con un aviso para revisarlo.

## Comprobaciones

Pruebas automatizadas en Chrome con datos ficticios: precarga, tres establecimientos/nueve cargos, selección de revista sin MNC indebida, marcado/desmarcado, recuperación de borrador, fechas, ordinales, anchos de 320/390/1500 px, descarga y vista preliminar. Se probaron también datos antiguos que exceden el PDF y conversión de la fecha de notificación.

Se renderizó el PDF completado y se cotejó visualmente con el lienzo: sin cambios al diseño base ni superposición con etiquetas, una sola página, nueve cargos presentes y cero widgets/campos interactivos en el PDF final. La suite de regresión de formularios y SR-01 pasó 35 pruebas. La impresión reutiliza el mismo PDF; queda pendiente la impresión física y la conformidad visual del usuario.

Las capturas y el PDF con datos de prueba están en `.adc-tools/cf01/`, excluidos de Git. No se realizó commit ni push. Los cambios pendientes anteriores de OL-01 se conservaron.
