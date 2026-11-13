# Estructura y ejecución

La entrada de la aplicación es `index.html`. Los estilos están en `assets/css/` y los scripts en `assets/js/`, agrupados por área.

En la rama `log-in`, la entrada local y online abre `ADC_Ingreso_Editable.html`. El botón Ingresar permite acceder a `index.html?adc-preview=1` con los campos vacíos durante los ajustes. `assets/js/interfaz/inicio-local.js` conserva su nombre por compatibilidad y aplica ahora el recorrido también en GitHub Pages. El parámetro de navegación no autentica al usuario. La pantalla muestra un aviso de demostración sin autenticación real. El registro conserva su validación y sus acciones de demostración. El perfil sigue utilizando el almacenamiento del mismo origen. Antes de habilitar cuentas reales se debe reemplazar este acceso de prueba por autenticación y sesiones verificadas. La publicación de prueba utiliza esta rama sin fusionarla con `main`.

La pantalla de acceso conserva su entrada en `ADC_Ingreso_Editable.html`. Sus estilos y comportamiento se organizan en `assets/css/acceso/` y `assets/js/acceso/`, con archivos separados para ingreso y Ajustes. Los fondos Light/Dark y el logo se guardan en `assets/img/acceso/`. El editor de acceso conserva sus claves de almacenamiento y permanece separado del editor de formularios.

```text
PaginaDocente/
├── ADC_Ingreso_Editable.html
├── index.html
├── assets/
│   ├── css/
│   │   ├── acceso/ (ingreso.css, editor.css)
│   │   ├── base.css
│   │   ├── calendario/
│   │   ├── documentos/
│   │   ├── editor/
│   │   ├── interfaz/
│   │   ├── perfil/
│   │   └── tramites/
│   ├── img/
│   │   └── acceso/ (fondos y logo)
│   └── js/
│       ├── acceso/ (ingreso.js, editor.js)
│       ├── calendario/
│       ├── core/
│       ├── documentos/
│       ├── editor/
│       ├── interfaz/
│       ├── perfil/
│       ├── tema/
│       └── tramites/
├── docs/
│   ├── estructura.md
│   └── structure-manifest.json
├── tools/
│   └── verify-structure.cjs
└── REVIEW_ADC_v60.md
```

## Carga y dependencias

El orden de las etiquetas de `index.html` conserva el de la aplicación previa. Los scripts son clásicos y síncronos. Comparten funciones y variables globales utilizadas por los eventos HTML. Cambiar su orden, convertirlos individualmente a módulos o agregar `async`/`defer` requiere revisar esas dependencias.

Las hojas CSS también conservan su posición y precedencia originales. `base.css` incluye reglas históricas de varias áreas. Las reglas de impresión permanecen junto al bloque del que proceden para conservar la cascada.

El núcleo histórico se distribuye entre `core/estado.js`, `interfaz/navegacion.js`, `perfil/instituciones.js`, `perfil/datos-personales.js`, `perfil/respaldos.js`, `tramites/catalogo-datos.js`, `tramites/solicitudes.js`, `tramites/dl01-reglas.js`, `tramites/dl01-pdf.js`, `tramites/dj01-traslados.js`, `tramites/dj01.js`, `documentos/plantillas-dl01.js` y `documentos/pdf-utilidades.js`. `core/inicializacion.js` ejecuta el arranque después de cargar esas declaraciones. Los bloques DJ-02 conservan sus reemplazos sucesivos. El inventario detallado está en `funciones-respaldo.md`.

Las plantillas, imágenes y fuentes incrustadas permanecen en sus bloques originales extraídos. Su traslado a recursos independientes requiere implementar carga asíncrona y recuperación de errores. La biblioteca PDF continúa usando la URL y versión original.

## Desarrollo

Abrir `index.html` desde el entorno habitual. La carpeta completa constituye la aplicación y debe acompañar al HTML. Para desarrollo y pruebas de recursos se recomienda un servidor HTTP local disponible en el equipo. La publicación bajo una subcarpeta funciona con las rutas relativas utilizadas en la entrada.

Las claves de almacenamiento y los identificadores del DOM conservan su definición anterior. Las operaciones del editor mantienen las referencias a los elementos originales.

## Verificación de la extracción

Ejecutar desde la raíz con Node instalado:

```powershell
node tools/verify-structure.cjs
```

La herramienta verifica existencia de los bloques y sintaxis de los scripts. Informa diferencias de hash respecto de la extracción inicial. Los bloques repartidos se concatenan para comparar su integridad. Agregar `--baseline` exige que la reconstrucción coincida exactamente con la referencia original. La corrección de OL-01 y los cambios posteriores de la entrada generan diferencias esperadas que deben revisarse. No regenerar la referencia automáticamente para ocultar una diferencia.

Esta comprobación acredita integridad del contenido extraído. Las pruebas en navegador deben verificar carga, estilos, eventos, almacenamiento e impresión. Las tareas funcionales pendientes están en el review.

## Próximas etapas

1. Validar el arranque y los recorridos principales en navegador.
2. Completar respaldo integral y recepción de cambios de otras pestañas.
3. Separar el núcleo histórico y consolidar cada trámite con pruebas específicas.
4. Extraer plantillas y catálogos cuando la carga de recursos esté definida.
5. Migrar eventos globales a interfaces explícitas y módulos de manera coordinada.

Esta estructura organiza los archivos actuales. El alojamiento sigue siendo estático y las interacciones existentes se ejecutan en JavaScript. La sincronización entre dispositivos requiere una etapa adicional de servidor y autenticación.

## Sincronización del perfil en OL-01

`assets/js/tramites/ol01.js` contiene `adcOLSyncTeacherProfile`, invocada tanto en la creación como en la reapertura del borrador. El perfil es la fuente de los datos personales al abrir el trámite. Las modificaciones de esos datos invalidan el PDF generado previamente.

La prueba de regresión se ejecuta con `node tests/ol01-perfil.test.cjs`. Esta corrección es posterior a la extracción y produce una diferencia esperada respecto del hash de OL-01 en el manifiesto inicial.

## Datos geográficos comunes

`assets/js/perfil/geografia.js` centraliza localidades del Chaco, departamentos y códigos postales de cuatro dígitos. Normaliza acentos y mayúsculas, contempla alias habituales y no completa valores para localidades que no reconoce. En el perfil y en SC-01 solo reemplaza campos vacíos o valores que ella misma había autocompletado; conserva los datos ingresados manualmente. SC-01 utiliza `adcVincularGeografiaChaco` para aplicar la misma regla cuando se escribe directamente en el formulario. Los demás trámites que usan los datos del perfil reciben los valores compartidos desde allí.

La tabla de localidades y departamentos toma como referencia la [API Georef Argentina](https://apis.datos.gob.ar/georef/api/localidades?provincia=Chaco&max=500); los códigos postales se contrastaron con el buscador de [Correo Argentino](https://www.correoargentino.com.ar/formularios/cpa). Los ejemplos que motivaron el cambio se corrigen según esa referencia: Barranqueras y Puerto Vilelas, 3503; Resistencia, 3500; Fontana, 3514. Estos son códigos postales numéricos, no el CPA alfanumérico completo.

`core/inicializacion.js` restaura al iniciar el perfil local guardado en `adc_v08`; así los datos, incluido el DNI, están disponibles en los campos de Mi Perfil Docente. En SC-01, los datos personales se actualizan automáticamente desde ese perfil al abrir el trámite y cuando se modifica uno de sus campos; no se ofrece una acción para cargar otro perfil. Las acciones de vista preliminar, descarga e impresión aparecen antes y después del formulario. El PDF se aplana antes de mostrarse, descargarse o imprimirse, por lo que sus campos ya no son rellenables/editables como formulario. Cada campo opcional vacío de SC-01 tiene un control X que permite marcarlo individualmente como “no corresponde”; además, el campo obligatorio “Calle” puede marcarse cuando está vacío. Marcar “Calle” como no correspondiente desactiva su validación obligatoria mientras permanezca marcado. Al volver a pulsar la X se quita la marca y el campo queda editable y vuelve a ser obligatorio. La selección se conserva en el borrador y se representa en el PDF con una línea negra centrada del 70% del ancho del campo y 0,5 mm de grosor. Los campos sin marcar quedan vacíos, sin líneas automáticas. La línea se dibuja mediante `adcPdfDrawBlankLine` de `assets/js/documentos/pdf-utilidades.js`. Las pruebas unitarias se ejecutan con `node tests/geografia.test.cjs` y `node tests/pdf-blank-line.test.cjs`.

## Máxima MNC: marcar “No corresponde”

MNC significa “Marcar No Corresponde”. Esta regla es transversal: aplica a todos los formularios, GAPS, planillas y plantillas de la aplicación, no solo a SC-01. En cada campo opcional vacío debe ofrecerse una X al inicio; al activarla, muestra “Tachar si no corresponde” y traza una línea negra centrada que cubre el 70% del ancho del campo y tiene 0,5 mm de grosor. Al volver a pulsarla, quita la línea y permite editar el campo. Los campos obligatorios, radios y casillas de dígitos no se tachan, salvo que el formulario habilite expresamente una excepción; en SC-01, “Calle” puede marcarse si está vacía y deja de ser obligatoria mientras permanezca marcada. Los campos vacíos no marcados permanecen sin línea automática. SC-01 es la implementación de referencia. Cuando se pida “aplicar la Máxima MNC”, debe respetarse este comportamiento en el documento correspondiente.

## Formularios incorporados al catálogo

`assets/js/tramites/formularios-oficiales-datos.js` define los formularios que estaban marcados como “Próximamente”; `assets/js/tramites/formularios-oficiales.js` los integra al catálogo, carga los datos de Mi Perfil Docente cuando corresponde y permite conservar borradores locales, previsualizar, descargar e imprimir. Los PDF se generan con diseño ADC y contenido estático; no son copias editables de las plantillas oficiales. Cada trámite incluye un enlace a su fuente, y los formularios sensibles muestran un aviso sobre el almacenamiento local. Los datos no se envían a un servidor. La MNC se aplica a los campos compatibles con los mismos valores globales: línea negra centrada del 70% del campo y 0,5 mm. Como la normativa y los requisitos pueden cambiar, verificá el contenido y la fuente oficial antes de presentar el PDF.

### Correcciones de la auditoría del 12 de noviembre de 2026

Los 26 esquemas incluyen campos y avisos recuperados de los documentos oficiales consultados. CF-01 incorpora el enlace al Anexo IV y permite registrar varios cargos de un establecimiento. DF-01 diferencia la documentación faltante por causal. DL-02 contempla permisos. BA-01 conserva los requisitos documentales y separa la intervención de Registro y Control. N.º 4 admite varios agentes y N.º 5 permite una única selección del conjunto oficial.

Los requisitos de entrada se identifican con un asterisco. Se validan también correo, documento, fechas relacionadas y condiciones del trámite. Las oficinas intervinientes completan sus propios bloques y las firmas y sellos se realizan sobre el impreso. Las firmas quedan fuera de MNC. SC-01 conserva la excepción explícita de Calle.

MNC se restaura después de incorporar los controles al DOM. Las marcas se conservan al mover filas y ante actualizaciones del perfil. La línea tiene 70% de ancho centrado y 0,5 mm, equivalentes a `0.5 * 72 / 25.4` puntos en el PDF. Los campos completos ocultan la X. Radios, casillas de selección y casilleros de un dígito quedan excluidos.

El texto del PDF continúa en nuevas páginas cuando supera el espacio disponible. Los cambios de datos, marcas o filas invalidan la vista preliminar. Una generación iniciada antes de un cambio se descarta y permite volver a generar con los datos actuales.

Los borradores mantienen sus claves locales anteriores y registran `schemaVersion: 2`. Las migraciones de N.º 4 y TP-01 se ejecutan una sola vez. Los datos complementarios anteriores se muestran cuando contienen información y se identifican como complemento ADC. Las opciones retiradas y las antiguas marcas que entran en conflicto con requisitos actuales generan avisos de revisión.

### Lienzo editable de los formularios incorporados

El motor compartido muestra los formularios incorporados como documentos A4 de ADC con controles editables sobre los casilleros. `createLayout` en `assets/js/tramites/formularios-oficiales.js` calcula en puntos las páginas, textos, opciones y cajas. El lienzo y el PDF consumen esa misma distribución. SC-01 y BD-02 utilizan implementaciones específicas sobre sus plantillas oficiales.

Los controles permiten verificar datos precargados del Perfil Docente, completar datos específicos y aplicar MNC en los campos permitidos. Al enfocar un dato vinculado al perfil aparece su procedencia. Las correcciones del usuario se conservan. Si el perfil contiene un valor diferente, un aviso permite conservar el borrador o adoptar expresamente el dato del perfil. Esta decisión también se guarda en el dispositivo.

El documento dispone de zoom, ajuste al ancho y un acceso al primer dato pendiente. Los grupos repetibles mantienen sus acciones para agregar, quitar y mover filas. El texto extenso crea páginas de continuación. Las continuaciones permiten volver al campo de origen para editar su contenido completo. Los bloques administrativos se identifican con los títulos y avisos de cada formulario.

El zoom modifica la presentación del lienzo. La descarga y la impresión usan las dimensiones A4 del documento, con las mismas posiciones de texto, opciones y marcas MNC. Los controles de edición y navegación se presentan en la interfaz. Las firmas y sellos conservan sus espacios en el documento impreso.

Ejecutar `node --test tests/*.test.cjs`. La prueba de formularios usa Chrome y Playwright cuando están disponibles, genera PDF de prueba en la carpeta temporal del sistema y verifica los 26 recorridos, adaptación, persistencia, MNC, filas y validación. Requiere el runtime local de Playwright y pdf-lib o informa la omisión. La comprobación histórica `node tools/verify-structure.cjs` admite módulos intercalados y conserva intacto el manifiesto inicial.

### Máxima MBIT — Búsqueda inteligente de trámites

Solo interviene en Mis trámites y su buscador. `assets/js/tramites/busqueda-inteligente.js` normaliza texto/códigos y ordena coincidencias exactas, nombres, palabras clave, prefijos y errores leves (una edición en palabras de al menos cinco caracteres). No aproxima códigos administrativos distintos. `assets/js/tramites/buscador.js` reúne los metadatos reales de `adcOfficialFormsData`, las tarjetas canónicas del catálogo y el vocabulario ampliable `adcFormSearchMetadata` de `catalogo-datos.js`; conserva sus acciones de apertura. No agrega otra lista independiente de formularios ni altera Mi perfil, Calendario, guardado, formularios, máximas anteriores o frecuentes.

Las variantes BD-02/BD02/BD_02/BD 02/bd 2 y equivalentes de otras familias se comparan sin reescribir códigos. Los esquemas pueden agregar `keywords`, `searchCategory` y `status`. Los formularios actuales se reconocen al incorporarse al catálogo existente, sin nuevas condiciones por código. Para módulos adicionales, `adcMBIT.register({id,code,title,officialName,category,keywords,status,open})` agrega una entrada canónica con acción explícita. El registro no permite duplicar los identificadores/códigos existentes. Solo los estados `available`, `published` o `ready` se publican en búsqueda; `draft`, `pending` y `unpublished` quedan excluidos. Registrar/publicar en catálogo no realiza operaciones Git.

El buscador actualiza resultados locales inmediatamente, mantiene texto y categoría y conserva nodos cuando el resultado no cambia. Durante una búsqueda o filtro muestra únicamente los resultados filtrados, ocultando el catálogo completo para evitar duplicados visibles; al limpiar se recupera. Conserva el recorrido DL-01 para elegir motivo y la sugerencia BL-01→DL-01. Agrega categorías de formularios, un botón Limpiar búsqueda y Escape. El contador distingue motivos de formularios y el mensaje sin coincidencias solo aparece si ambos están vacíos.

`assets/css/tramites/buscador.css` se limita a las tarjetas y resultados de este catálogo. Separa nombre, código y acción; agrega foco, hover de 2 px, transición de 180 ms, movimiento reducido y colores Light/Dark. No alcanza la sección lateral de frecuentes. `tests/mbit.test.cjs` verifica variantes, relevancia, tildes, sinónimos, aproximación acotada, filtros, contador, teclado, temas/móviles, ausencia de duplicados, conservación de frecuentes/uso, registro de formularios futuros según estado y apertura de todos los formularios del catálogo.

### Máxima universal N.º 1 — Validación inteligente, guiada y no bloqueante

El componente `assets/js/core/validacion-guiada.js` expone `adcGuidedValidation.create({root,collect,save})`. `collect()` devuelve únicamente pendientes aplicables, con `{key,label,controls}`; permite un getter de controles y `reveal()` para abrir un grupo plegado sin modificar sus datos. Cada formulario conserva sus condiciones de obligatoriedad y validaciones particulares. `save()` delega en su guardado existente. `review({guided,action})` devuelve una promesa booleana; `cancel()` detiene la revisión. Para nuevos formularios se reutiliza este contrato, sin copiar la máquina de revisión. `controls(root)` ofrece detección básica de controles HTML obligatorios, excluyendo desactivados, ocultos y MNC.

La advertencia inicial muestra solo cantidad y dos alternativas principales: Revisar pendientes y Continuar igual, además de Cancelar. La guía desplaza/enfoca el campo, agrega un resaltado y una ayuda cercana, muestra progreso y ofrece Editar, Guardar y siguiente, Seguir igual y Cancelar. Las omisiones son transitorias, no se guardan como datos ni como MNC. Al finalizar se ofrece abrir la vista preliminar (o continuar con descarga/impresión, según la acción inicial) o volver al formulario. Las fechas partidas se agrupan en un único pendiente en BD-02 y el documento en casilleros de SC-01 se revisa como un solo número. La lista se recalcula al avanzar para respetar condiciones y datos editados. Al cancelar o cambiar de solapa se retiran ayudas/resaltados; no se abre el PDF ni se pierde lo ingresado.

Los estilos se limitan a `.adc-review` y `.adc-review-missing` en `assets/css/interfaz/validacion-guiada.css`, con adaptación a móviles, anuncios accesibles, ayuda asociada al campo y exclusión de impresión. La interfaz aclara que un borrador incompleto no implica validación administrativa oficial. No se modifican las plantillas oficiales, la Máxima MNC ni los valores de perfil para omitir un pendiente.

Integraciones: todos los esquemas del motor `formularios-oficiales.js`; BD-02; SC-01; OL-01; DL-01; impresión de DJ-01 y vista/impresión de DJ-02. En DL-01 se puede generar el fondo oficial sin inventar fechas ni cargos afectados cuando no existe un período informado; un pequeño editor de datos personales faltantes reutiliza `adcSetSharedField` únicamente al escribir el usuario. DJ-01 incluye los datos compartidos y las fechas de designaciones seleccionadas, abriendo los grupos cuando corresponde. DJ-02 conserva su filtro de licencias otorgadas y la separación de registros del docente; la revisión no otorga licencias ni recupera eliminadas. Los errores de contenido, fechas imposibles, encuadres sin confirmar y restricciones normativas se siguen validando: continuar con blancos no autoriza datos incompatibles.

Pruebas Chrome: formulario completo sin advertencia; resumen de incompletos; edición y siguiente; omisión; cancelación; finalización; repetición; cambios condicionales; fechas agrupadas; campos opcionales excluidos; conservación de valores; adaptación móvil; vista/descarga de SC-01 incompleto; DL-01 sin fechas inventadas; OL-01 incompleto; llamadas de impresión DJ-01/DJ-02 mediante sustitución de `window.print` en la prueba. La salida física a impresora requiere verificación manual.

### Máxima universal N.º 2 — Cursos, años y divisiones

`assets/js/core/cursos.js` expone `window.adcAcademic`, cargado antes de los módulos de perfil y trámites. `part(valor, 'year')` presenta `3°`; `part(valor, 'division'|'section')` presenta `2.ª`. Reconoce indicadores previos y repetidos sin duplicarlos. Conserva letras y denominaciones no numéricas. `divisionStyle: 'abbreviated'` permite `1ra/2da/3ra` y `'bare'` mantiene `1ª` en DL-01. Los valores ajenos al contexto académico, fechas, antigüedad y números administrativos no se transforman. No se deduce el contexto del nombre de una etiqueta.

`parts(entrada)` obtiene los componentes originales desde `adcCourseParts`, un objeto año/división o la cadena histórica `course`; no modifica la entrada. `course(entrada,{labeled:true})` devuelve `2° Año — 1.ª División`. El formato histórico ambiguo `13 = 1 / 3` se habilita exclusivamente mediante `legacyPacked:true` para conservar el comportamiento previo de DJ-01. Los demás consumidores no inventan divisiones.

Integraciones: BD-02 (selector, campos académicos y PDF), DJ-01 y su historial, DL-01 y su resumen, OL-01, referencias de cargos en DJ-02 y traslados. Los formularios del motor común declaran explícitamente `academicPart:'year'|'division'|'section'|'course'` y opcionalmente `academicFormat`; así se formatean campos y PDF desde el mismo adaptador. Están declarados los campos académicos de CF-01, DP-01, BD-02, MD-01, DL-02 y BD-01. El año calendario de IL-01 queda excluido. SC-01 y los formularios sin campos académicos no reciben transformaciones.

Para nuevos formularios, utilizar este módulo y declarar el contexto en el esquema; no copiar lógica ni sobrescribir el perfil para modificar su apariencia. Los campos se muestran formateados al precargarlos/recuperarlos y al terminar la edición. Se conservan originales en el perfil y borradores para cálculos, búsquedas, comparación de correcciones y MNC. No se alteran los mecanismos existentes de guardado, impresión ni validación.

Pruebas: `tests/cursos.test.cjs` cubre variantes, estilos, históricos y exclusión de números no académicos. La prueba Chrome de formularios verifica datos originales, selección de cargos/instituciones, recuperación, campos académicos del catálogo, año calendario IL-01 y exportación PDF.

### BD-02 sobre el PDF adjunto

Tipografía BD-02: el PDF oficial usa predominantemente Arial/ArialMT de 12 pt; Actuación Simple y la continuación del motivo usan Times New Roman de 9,96 pt, y la etiqueta del número de disposición es de 9,96 pt. El relleno respeta esos sectores: Arial y Times New Roman en pantalla; Helvetica y Times-Roman (equivalentes estándar PDF) en la exportación. No se distribuyen archivos de fuentes propietarias. Estas fuentes estándar no requieren una descarga externa. Las fechas toman como referencia el texto Arial de 12 pt de sus etiquetas; los subrayados originales de 14,04 pt permanecen intactos.

Cada campo ajusta individualmente su tamaño a sus dimensiones originales y márgenes internos, contrastando métricas de navegador y PDF. La reducción se limita a 7 pt, no se modifica el texto guardado y el tamaño de referencia se recupera al acortarlo. Pantalla y PDF usan el mismo tamaño calculado. Si aun a 7 pt el texto no cabe, el borrador lo conserva completo y la generación solicita acordar una solución, sin recortarlo ni reducirlo más. Esta regla no altera la precarga, MNC, selección de cargos ni permisos para continuar con datos vacíos.

Los datos requeridos que estén vacíos generan un aviso antes de vista preliminar, descarga o impresión. El docente elige «Revisar pendientes» o «Continuar igual», mediante la Máxima universal N.º 1. Esta autorización vale solo para esa acción y esos datos; no se guarda como aceptación permanente ni agrega tachaduras al PDF. Número de disposición permanece editable y sin MNC. Los datos inválidos, textos excedidos, selección de institución/cargos ausente y revisión de borradores anteriores siguen requiriendo resolución. Para titulares se conserva la indicación oficial de no consignar número de disposición.

La recuperación del perfil admite `adcCourseParts` (año y división), generado por el editor de cursos. Su validación sigue restringida a esas dos propiedades y valores escalares; rechazar este objeto impedía restaurar perfiles válidos y dejaba sin datos disponibles la precarga.

`assets/formularios/BD-02.pdf` es una copia íntegra del archivo `02-FORMULARIO-BD-02-Disposicion-de-Baja.pdf` aportado por el usuario. Su SHA-256 es `cca9e0b1d1630a809e6faf4881d94680d557337bbb0450dbdcee17ca9ad7beff`. Tiene dos páginas de 612,12 × 1008,12 puntos y cinco bloques fijos de cargos.

`assets/js/tramites/bd02.js` posiciona los controles sobre las imágenes de las páginas originales. Sus coordenadas se midieron en puntos a partir del PDF. Los estilos específicos están en `assets/css/tramites/bd02.css`. La ficha BD-02 del catálogo abre esta implementación mediante `adcBD02Open`.

Se precargan los datos personales disponibles y la aclaración de firma. La institución puede seleccionarse del perfil y se vincula por nombre al recuperar el borrador, porque sus identificadores internos pueden cambiar al reiniciar la aplicación. Al iniciar se pregunta la institución y luego se seleccionan explícitamente hasta cinco cargos u horas cátedra, incluso cuando el perfil tiene más. Solo se precargan los seleccionados, incluyendo la fecha de alta del último período registrado. Los bloques se asignan en el orden de selección; al quitar y volver a seleccionar un cargo se recuperan sus correcciones y MNC mediante su identificador estable djUid. Los bloques no utilizados se anulan con dos diagonales negras de 1 mm (72/25,4 puntos) en pantalla y PDF; esta anulación de bloque es independiente de MNC de campos (0,5 mm). Los campos vacíos no marcados recuperan los datos disponibles del perfil. Las correcciones y MNC se conservan ante cambios de perfil y las diferencias se muestran para revisión.

Las fechas se completan en sus espacios de día, mes y año, conservando las barras y subrayados impresos. El calendario sólo es un control de edición. Los cinco casilleros del código de motivo admiten dígitos individuales, avance con el teclado y pegado de códigos que quepan. Radios, casilleros de dígitos y campos obligatorios quedan excluidos de MNC.

El borrador utiliza `adc-bd02-borrador-v1`. Los datos del anterior `adc-official-form-bd02-draft-v1` se recuperan para revisión y se conservan también como respaldo descargable. La plantilla mantiene sus dos páginas y sus cinco bloques. Se avisa cuando existen datos excedentes o textos demasiado largos. La exportación de texto que exceda el espacio se detiene para acordar su ajuste.

El PDF final carga la plantilla adjunta, agrega los datos, actualiza las apariencias y aplana los campos, siguiendo el flujo de SC-01. Después dibuja las líneas MNC de 0,5 mm y 70% centrado. Se retiran las referencias de los widgets generados y se conservan las anotaciones que tuviera el original. El archivo final mantiene las dos páginas y sus dimensiones. Las firmas y sellos se realizan sobre el impreso.

La muestra `output/pdf/BD-02-ejemplo.pdf` contiene datos ficticios para revisar la alineación y una marca MNC. Sus imágenes están en la misma carpeta. La conformidad visual del usuario precede al trabajo sobre otro formulario.
