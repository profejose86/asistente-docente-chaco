# SR-01 sobre el PDF aportado

## Fuente y presentación

Se utiliza `materiales/17-FORMULARIO-SR-01-Solicitud-de-Reconocimiento-Medicos.pdf`, copiado sin cambiar sus bytes a `assets/formularios/SR-01.pdf`. El original tiene una página de **612 × 1008 puntos**. El PNG de fondo se renderizó a 144 dpi; el PDF de salida usa el documento vectorial original, no una captura.

SHA-256: `ec47028ba244717fdf2cc996c08d8fd386261ba2d929d7c320493ce1cb806f54`.

Los archivos de `materiales/` permanecen como fuentes locales excluidas de Git y del inventario de código. Sólo los recursos seleccionados para la aplicación se copian a `assets/formularios/`.

## Casilleros

Se midieron y configuraron los espacios de repartición, lugar y fecha, establecimiento sanitario, apellido/nombres y documento del docente, domicilio, residencia con bonificación, situación de revista, inicio de inasistencia, tipo/lugar de atención y familiar enfermo. En la segunda parte se ubican establecimiento, lugar/fecha, realización del reconocimiento, persona/documento examinado, justificación, motivo, fechas, días corridos, motivo de rechazo y su continuación, además de los espacios de firma y sello.

Los dos campos de apellido/nombres comparten la línea «Docente» del original. No se cambian sus claves ni se pierde el borrador anterior. Se añadieron los espacios de consultorio y continuación del motivo de no justificación que estaban en el PDF pero faltaban en el esquema.

La situación de revista y el tipo de atención conservan sus valores históricos, ahora como opciones sobre el papel. Los SI/NO impresos sin casilla se seleccionan con subrayado, evitando dibujar una X encima del texto oficial. Las otras X se sitúan dentro de los casilleros o al inicio del renglón correspondiente. Las firmas son opcionales y corresponden a sus responsables; no se insertan firmas gráficas ni se inventa una intervención profesional.

## Perfil, borradores y MNC

Se conservan la precarga de apellido, nombres, DNI y domicilio y las correcciones del usuario. La repartición admite las instituciones del Perfil Docente, usando la selección existente y sin adivinar una situación de revista cuando puede haber varios cargos. Los borradores siguen en `adc-official-form-sr01-draft-v1`.

MNC se ofrece únicamente donde corresponde: campos opcionales vacíos, sin radios, firmas ni campos obligatorios. Conserva la línea negra del 70% centrado y 0,5 mm. Marcar/desmarcar y recuperar el borrador reutiliza el motor existente.

## Nueve columnas de licencias

Se muestran las nueve columnas originales de Días/Motivos con sus cajas desde el inicio. El desplegable web **Organizar licencias previas** contiene las acciones para mover o quitar registros, sin superponer los botones al PDF. Si se quita una columna se puede volver a agregar hasta completar las nueve.

Los borradores anteriores podían contener hasta doce registros. Se conservan: los excedentes quedan editables debajo del documento y se pueden reorganizar o quitar con los mismos controles. Si un registro excedente tiene datos o MNC, la exportación se detiene con un aviso; no se recortan datos ni se agregan páginas a un formulario de una página.

## Fuente y tamaño de relleno

El cuerpo original usa principalmente Arial de 9,96 puntos; sus encabezados y demás tipografías permanecen en el PDF sin cambios. Los valores usan Arial en pantalla y Helvetica en PDF, a **10 puntos**, con **8,5 puntos** de base para los motivos de las columnas estrechas. El ajuste es por campo, hasta 7 puntos. Si un dato no entra, se conserva completo en el borrador y se avisa antes de exportar.

Las fechas correspondientes se muestran como día/mes/año. Los botones de calendario de SR-01 se mantienen dentro de cada caja para no tapar palabras contiguas del original.

## Comprobaciones

La suite completa terminó con **96 pruebas aprobadas, 0 fallidas y 0 omitidas**. También pasaron el control de arquitectura y `git diff --check`.

Se probaron precarga, conservación de datos, MNC y su geometría PDF, columnas y reordenado, persistencia, recuperación de registros antiguos, texto largo sin truncado y anchos de 320, 390 y 1500 px sin desbordamiento horizontal. Se verificaron descarga y vista previa y se inspeccionaron imágenes del lienzo y del PDF completado con datos ficticios.

El PDF completado conserva una sola página de 612 × 1008 puntos, sin campos AcroForm ni widgets. La impresión usa la misma generación; no se realizó impresión física. Los demás formularios mantienen sus fuentes y esquemas, y se ejecuta la suite general para detectar regresiones. No se hizo commit ni push.
