# Revisión del Asistente Docente Chaco, versión 60

Fecha de revisión: 11 de noviembre de 2026.

Archivo de la primera revisión: `Asistente_Docente_Chaco_v0_9_16_60.html`. La segunda revisión, al final del informe, corresponde al `index.html` actual.

## Alcance y evidencia

Revisión de solo lectura del HTML y de las dos conversaciones compartidas por el usuario. Se cotejaron los pedidos visibles en esas copias con la implementación actual. Las copias incluyen imágenes y archivos adjuntos cuyo contenido completo no se inspeccionó. Por ello, este informe no certifica haber recuperado cada pedido de toda la historia del proyecto.

Se comprobaron sintácticamente 19 bloques JavaScript mediante el compilador de Node, sin errores. Esto verifica sintaxis, pero no ejecución, cálculos ni interacción con el DOM.

La herramienta de Chrome rechazó la navegación al archivo local por su política de protocolos. La captura de pantalla de aplicaciones externas tampoco está disponible en este dispositivo. No se realizaron pruebas interactivas, impresión real ni evaluación visual directa. Los estados siguientes describen evidencia del código, salvo indicación expresa.

## Resultado general

La versión contiene un flujo amplio de perfil docente, instituciones y cargos, solicitudes DL-01, declaraciones DJ-01 y DJ-02, OL-01, calendario y editor de diseño. Las últimas propuestas de convertir el editor en un lienzo libre están implementadas parcialmente. No hay evidencia suficiente para afirmar que todas las funciones operen correctamente en navegador.

## Pedidos e implementación

| Pedido recuperado | Evidencia en la versión 60 | Evaluación |
| --- | --- | --- |
| Separar apellidos, nombres y DNI | Campos de perfil y sincronización con formularios | Presente. Falta comprobar la disposición visual de los tres campos y datos antiguos. |
| DJ-02 manipulable | Tabla HTML, celdas y controles de edición | Presente. No se reduce a una imagen fija. La fidelidad respecto de los PDF adjuntos requiere comparación visual. |
| Nombres alineados a la izquierda y en negrita | Renderizado y ajuste de campos personales | Revisar visualmente todos los campos y la impresión. No se certifica la alineación final. |
| Letras ajustadas a los recuadros | `fitAll`, medición con canvas y tamaños mínimos | Presente en un renderizador anterior. El renderizador final vuelve a construir la tabla. Hay que verificar el alcance efectivo de ese ajuste en la vista final. |
| Pendientes DL-01 dentro del DJ-02 | Migración y registro `adc58`, estados pending/granted/deleted | Presente. Las pendientes se muestran en edición. |
| Confirmar licencia desde su fila | Acción Licencia otorgada y validación de campos/fechas | Presente. Confirmar con datos válidos e inválidos sigue pendiente de prueba. |
| Eliminar, deshacer y restaurar | Estado anterior conservado, sección Licencias eliminadas | Presente. Restaurar recupera otorgada o pendiente según el estado previo. |
| Reimprimir sin duplicar ni revivir eliminadas | Firma por DNI, motivo y período, registro de filas fuente | Protección explícita. Requiere pruebas con varias instituciones y solicitudes distintas del mismo período. |
| Excluir inasistencias justificadas del DJ-02 | Filtro al migrar pendientes, proyectar e imprimir | Presente. Verificar variantes históricas de nomenclatura. |
| Carga manual de antecedentes | Creación de licencia manual | Presente. La nueva licencia comienza pendiente y necesita confirmación, incluso si se carga como antecedente ya otorgado. |
| Imprimir solamente otorgadas | Vista de impresión filtra por estado y valida datos | Presente. Falta comprobar PDF, saltos de página y retorno tras cancelar impresión. |
| Filas vacías de altura razonable | Altura mediana de las filas ocupadas | Presente. Paginación con espacio estimado de 442 píxeles. |
| Acciones que acompañen cada fila con zoom | Botones insertados dentro de la fila | Presente estructuralmente. Verificar legibilidad y espacio con zoom. |
| Tuerquita arrastrable | Eventos de puntero, umbral de 5 píxeles y posición persistida | Presente. El arrastre requiere Ajustes abierto. |
| Tira flotante de herramientas | Panel flotante de hasta 365 píxeles de ancho | Parcial. Continúa siendo un panel con varias filas, no la tira compacta propuesta. |
| Notas, rectángulos y óvalos | Operación annotation y color elegible | Presente. El dibujo queda limitado al contenedor anfitrión. |
| Anotar libremente sobre toda la pantalla | Restricción de dibujo dentro del área elegida | Parcial. Puede impedir atravesar columnas o límites de secciones. |
| Mantener anotaciones al cerrar Ajustes | CSS las muestra solo con adcDesignActive | Pendiente. Al cerrar Ajustes desaparecen. |
| Clic derecho para editar, eliminar y mover | Menú de tres acciones | Presente para elementos elegibles. No cubre indiscriminadamente todo nodo del HTML. |
| Mover y ajustar tamaño con la misma herramienta | Arrastre interior y bordes de tamaño | Presente. Revisar controles protegidos y selección de elementos originales. |
| Seleccionar sin mover accidentalmente | Arranque en pointerdown y comprobación de desplazamiento en pointerup | Hay umbral de 3 píxeles antes de guardar el movimiento. Falta probar la comodidad del gesto. Corrección de la primera revisión. |
| Doble clic para renombrar | Se encontró doble clic para restablecer área de hoja | El gesto general de doble clic para editar botones y cajas no se encontró. La edición existe mediante panel/menú. |
| Crear cajas y botones | Operaciones box y button | Presente. Los botones nuevos pueden quedar sin acción y se identifican como tales. |
| Eliminar originales de forma reversible | hideOriginal y Deshacer | Presente. Un control oculto puede dificultar completar el trámite hasta recuperarlo. |
| Desplegables automáticos | Cálculo de dirección y creación de panel | Parcial. La elección Auto se resuelve a una dirección al crear. Verificar adaptación posterior al mover o cambiar tamaño de ventana. |
| Deshacer y rehacer | Pila de operaciones y reversas | Presente. Rehacer descarta la operación si no puede aplicarla. Revisar consistencia en ese caso. |
| Exportar e importar distribución | JSON con esquema y validación, rollback de importación | Presente. Hay límites de tamaño y cantidad de operaciones. |
| Guardar borrador | Guardado explícito en localStorage | Presente. Los cambios de diseño requieren guardar o exportar para conservarlos. |
| Nuevo lienzo desde cero | No se encontró acción correspondiente | Pendiente. Nueva sección permite ampliar la página existente. |
| Duplicar y alinear varios elementos | Centrados por referencia disponibles | Parcial. No se encontró duplicado general ni selección múltiple para alineación colectiva. |
| OL-01 con escuelas del perfil | adcOLStart carga instituciones y change actualiza cargos | Presente. Hay un retorno temprano al reabrir el mismo borrador que merece comprobarse tras modificar instituciones. |
| Zoom de hoja completa en OL-01 | Zoom aplicado al contenedor del papel, rango 45–110 % | Presente. Validación visual y de impresión pendiente. |

## Hallazgos y riesgos concretos

1. **Restablecer zoom tiene la misma lógica que Ajustar al ancho.** Ambos botones dejan la escala en null y llaman al mismo ajuste. Si Restablecer debe significar 100 %, el comportamiento actual no expresa esa distinción.
2. **La altura del DJ-02 es estimada.** El cálculo usa cantidad de caracteres y limita la fila a 112 píxeles. Textos muy extensos, palabras largas, fuentes o anchos modificados pueden exceder esa estimación. Debe verificarse desbordamiento y paginación con medición real.
3. **Licencias vinculadas comparten estado.** Eliminar o confirmar una licencia modifica todas sus instituciones. Hay aviso explícito, pero puede sorprender si se actúa desde un filtro por escuela.
4. **La identidad de una licencia usa DNI, motivo y período.** Agrupa solicitudes coincidentes. Dos solicitudes independientes con esos mismos valores podrían unificarse. La decisión funcional requiere casos reales.
5. **Los antecedentes manuales arrancan pendientes.** Esto añade una confirmación a una licencia histórica ya otorgada. Conviene aclararlo en el flujo y verificar que la persona entienda por qué aún no aparece al imprimir.
6. **Datos guardados por navegador y origen.** Perfil, licencias y diseño usan localStorage. La copia local y la página de GitHub tienen almacenamientos distintos. El traslado de datos debe probarse mediante exportación e importación.
7. **El editor aplica operaciones sobre elementos identificados.** Cambios estructurales de futuras versiones pueden volver incompatible un borrador. La importación ya intenta revertir fallos, pero conviene probar migraciones representativas.
8. **Hay renderizadores y funciones reemplazados posteriormente.** DJ-02 acumula implementaciones anteriores y una capa final que sobrescribe funciones. Leer una función anterior no basta para demostrar el comportamiento vigente. Esto aumenta el costo de mantenimiento y el riesgo de regresión.
9. **La edición exige descubrir herramientas y diálogos.** El panel contiene muchas acciones y utiliza prompts para varias entradas. La amplitud de funciones puede resultar difícil para usuarios sin experiencia.

## Sugerencias de experiencia de uso

- Dar prioridad a seleccionar, mover, ajustar tamaño y editar texto dentro de una selección persistente.
- Mostrar una tira compacta con herramientas frecuentes y un acceso claro a opciones avanzadas.
- Incorporar Mantener anotaciones visibles con controles inferiores operables al cerrar el editor.
- Definir claramente qué pertenece al formulario, qué es una anotación y qué se guarda en cada exportación.
- Mostrar el estado de guardado y facilitar la recuperación de borradores.
- Explicar en el propio botón o confirmación cuándo una acción afecta a varias instituciones.
- Mantener estados Pendiente, Otorgada y Eliminada con texto legible y mensajes breves de resultado.
- Sustituir los diálogos de texto libre por formularios visibles donde haya opciones conocidas.
- Evaluar contraste, foco de teclado, tamaño de controles, pantallas pequeñas y zoom antes de certificar una apariencia profesional.
- Reservar el informe visual definitivo hasta observar la aplicación renderizada y su impresión.

## Pruebas que faltan para cerrar la validación funcional

1. Cargar un perfil nuevo y otro guardado anteriormente, comprobar nombres, DNI, escuelas, cargos y horarios.
2. Generar DL-01 dos veces, comprobar una sola licencia, confirmar y revisar vista imprimible.
3. Eliminar y restaurar pendientes y otorgadas, regenerar una eliminada y comprobar que continúa eliminada.
4. Repetir con una licencia vinculada a dos instituciones y con filtros por escuela.
5. Crear antecedente manual, confirmar, guardar, recargar y comprobar persistencia.
6. Introducir fechas inválidas, datos incompletos e inasistencias justificadas.
7. Probar tablas vacías, textos muy largos y varias páginas, exportar a PDF y comparar con los formularios de referencia.
8. Arrastrar la tuerquita a los cuatro bordes, cambiar tamaño de ventana y recargar.
9. Crear nota, recuadro, óvalo, caja, botón y desplegable, mover y redimensionar cada uno, editar y deshacer.
10. Renombrar un botón original y comprobar que conserva su acción. Ocultarlo y recuperarlo.
11. Exportar borrador, importar el mismo, intentar uno inválido y comprobar recuperación del diseño previo.
12. Probar el selector del OL-01, modificar instituciones en el perfil, volver al borrador y verificar actualización.
13. Probar zoom mínimo, máximo, Ajustar al ancho y Restablecer, además de la impresión.
14. Verificar teclado, foco, móvil, contraste, legibilidad y cantidad de pasos para un docente sin experiencia.

## Cierre de esta revisión

El informe identifica funciones presentes, cumplimiento parcial y verificaciones pendientes. No certifica funcionamiento visual ni normativo. La sintaxis JavaScript pasó. No se modificó el HTML, no se publicaron cambios ni se convirtió esta lista en una implementación. Los pendientes quedan documentados para que el usuario decida posteriormente las actividades por realizar.

## Segunda revisión del código actual

Esta revisión corresponde al `index.html` de 4.717.508 bytes presente en la carpeta al momento del pedido de rechequeo. El archivo contiene la aplicación completa. En el estado de Git observado figura eliminada la copia `Asistente_Docente_Chaco_2.html`. Esa eliminación ya estaba presente antes de esta revisión y debe aclararse antes de una futura publicación. El informe anterior estaba referido a otro nombre de archivo y por eso debe leerse con esta actualización.

### Comprobaciones realizadas

- Los 19 bloques JavaScript actuales compilan sin errores de sintaxis.
- Se ejecutaron las funciones reales de registro DJ-02 extraídas del HTML en un contexto aislado de Node, con datos sintéticos en memoria. Pasaron alta pendiente, confirmación, inclusión de otorgadas, exclusión de eliminadas, regeneración sin duplicación ni restauración accidental, restauración del estado otorgado, rechazo de fecha imposible y exclusión de inasistencia justificada. Esto valida esos recorridos de lógica, sin certificar la interfaz ni todos los casos posibles.
- No se ejecutaron pruebas visuales, de impresión ni de interacción. La restricción previa de navegación local sigue siendo una limitación de la evidencia disponible. Una prueba sobre una dirección web autorizada y accesible permitiría completar esa parte.
- Se revisaron el respaldo general, la sincronización entre pestañas, los gestos del editor y la escala de la vista previa.

### Correcciones al informe anterior

El editor sí verifica un desplazamiento mínimo de 3 píxeles antes de guardar una operación de movimiento o tamaño (`index.html`, línea 5456). La observación anterior sobre un posible clic que guarda movimiento era incompleta. Puede mejorar la respuesta visual del gesto, pero no corresponde presentarlo como ausencia total de umbral.

La protección contra duplicación y la restauración de licencias ahora tienen pruebas de lógica ejecutadas. La prueba integral de generar un PDF y observar su registro desde la interfaz continúa pendiente.

### Prioridades para mejorar la ejecución

| Prioridad | Hallazgo comprobado | Cambio propuesto para una etapa posterior | Criterio de aceptación |
| --- | --- | --- | --- |
| Alta | `exportJSON()` usa `data()`, que exporta perfil, instituciones e historial DJ-01. No incluye el registro separado `adc_dj02_v1`, el borrador de diseño ni todos los ajustes del calendario. | Crear respaldo integral con versión de esquema y restauración validada. Mantener compatibilidad con respaldos de perfil anteriores. | Exportar, abrir en un origen limpio y recuperar perfil, licencias con sus estados, diseño y calendario. |
| Alta | El evento `storage` del DJ-02 llama a `safeWrite()`. Esa función vuelve a guardar usando los campos personales de la pestaña receptora. | Recibir cambios mediante lectura y actualización de vista, evitando escribir como respuesta a una notificación. Definir cómo resolver modificaciones simultáneas. | Dos pestañas abiertas conservan el último cambio y no generan escrituras recíprocas ni reemplazan datos recientes por campos antiguos. La pérdida y el bucle son riesgos derivados del código, todavía sin reproducción en navegador. |
| Alta | Se permite editar una licencia otorgada. Si los nuevos datos son inválidos, imprimir se bloquea, pero la licencia conserva el estado otorgada. | Definir si una modificación relevante requiere reconfirmar y mostrarlo claramente. | Modificar motivo, institución o fechas deja un estado coherente y evita imprimir una modificación sin revisión cuando esa sea la regla elegida. |
| Media | Reabrir OL-01 con el mismo identificador de borrador retorna antes de reconstruir instituciones. | Sincronizar las opciones del perfil conservando los campos ya completados. | Agregar o renombrar escuela en el perfil se refleja al reabrir OL-01 y mantiene los datos del borrador. Es un riesgo estático pendiente de reproducción. |
| Media | Ajustar al ancho y Restablecer asignan el mismo modo automático. Además, el ajuste automático tiene un mínimo del 45 %. | Definir Restablecer como 100 % si esa es la intención. Permitir ajuste efectivo al ancho cuando el contenedor sea menor al mínimo, o indicar desplazamiento horizontal. | Cada botón cumple su etiqueta y el contenido es accesible en pantalla angosta. |
| Media | Paginación por altura estimada y limitada a 112 píxeles. | Medir el contenido renderizado para distribuir páginas y recalcular tras editar. | Motivos e instituciones extensos quedan completos, sin superposiciones ni cortes al imprimir. |
| Media | El HTML descarga pdf-lib desde jsDelivr. | Evaluar alojar una copia versionada de la biblioteca y comunicar fallos de carga. | Generar PDF con dependencia disponible y mostrar un mensaje recuperable cuando no carga. La conexión a esa CDN condiciona hoy esa función. |
| Media | La aplicación tiene unos 4,7 MB y múltiples renderizadores sustituidos por capas posteriores. | Medir arranque y edición antes de optimizar. Después consolidar un módulo por responsabilidad y revisar qué recursos conviene cargar al abrir cada trámite. | Medición antes/después con el mismo perfil, sin pérdida de comportamiento ni borradores. El tamaño por sí solo no demuestra lentitud. |
| Media | Guardar diseño es una acción explícita y no se encontró aviso beforeunload. | Añadir estado visible de cambios pendientes y recuperación de borrador. | Cerrar o recargar con cambios tiene un resultado claro y recuperable. |

### Orden recomendado de trabajo

1. Acordar `index.html` como archivo principal y aclarar el destino de la copia eliminada antes de un futuro commit.
2. Completar respaldo y restauración integral. Es el requisito para probar migraciones y avanzar con datos recuperables.
3. Resolver recepción de cambios entre pestañas y probar edición simultánea.
4. Ejecutar los recorridos principales con un perfil sintético y una dirección web autorizada, capturar fallos de consola y PDF, y completar la evidencia visual del informe.
5. Resolver inconsistencias de OL-01, zoom y paginación que esas pruebas confirmen.
6. Simplificar el editor con tira de herramientas, selección persistente, doble clic y anotaciones visibles al cerrar, conforme a los pedidos previos.
7. Medir rendimiento y consolidar código manteniendo compatibilidad con respaldos existentes.

Para los primeros pasos alcanzan el navegador, la terminal y los archivos actuales. La sincronización entre distintos dispositivos o cuentas requeriría posteriormente diseñar almacenamiento en servidor, autenticación y reglas de acceso. Publicar el HTML actualmente conserva datos por navegador y origen.

Esta segunda revisión actualiza únicamente el informe local. No se realizaron cambios al código de la aplicación, commits ni push a GitHub.

## Plan de reorganización del proyecto

Estado del plan: propuesto y documentado. La ejecución de la reorganización queda para una etapa posterior. Fecha: 11 de noviembre de 2026.

### Objetivo y condiciones de compatibilidad

Organizar el código para localizar y corregir errores, ampliar los trámites y mantener una interfaz coherente. La migración debe conservar perfil, licencias, calendario, borradores y documentos generados. Ningún plan puede garantizar ausencia absoluta de errores. Cada etapa tendrá una comparación con el comportamiento anterior y un punto de recuperación.

La aplicación seguirá teniendo una entrada principal `index.html`. Adoptamos nombres de archivos en minúsculas, sin espacios ni tildes y con guiones. Las claves de almacenamiento y los nombres de propiedades de datos existentes conservan su escritura actual hasta una migración explícita.

### Inventario que condiciona el orden

- 23 bloques de estilos en el HTML. Sus reglas se superponen y el orden determina qué estilo se aplica.
- 19 bloques JavaScript propios y una referencia externa a pdf-lib 1.17.1. Algunos bloques ejecutan cambios sobre el DOM al cargarse y reemplazan funciones anteriores.
- 58 atributos de eventos como onclick, onchange e input encontrados por inspección. Dependen de funciones accesibles globalmente.
- Siete referencias con datos base64 y plantillas PDF grandes dentro de scripts. Extraerlas a archivos cambiará su carga de inmediata a asíncrona.
- El editor identifica elementos para recuperar operaciones de diseño. Cambiar jerarquías, orden de nodos o elementos indexados puede volver incompatibles los borradores.
- Varios bloques crean HTML y CSS desde JavaScript. Un movimiento automático de etiquetas no alcanza para dividir correctamente el proyecto.

### Árbol objetivo

Los archivos se crearán cuando tengan una responsabilidad concreta y contenido extraído y verificado. Este árbol describe el destino, sin exigir crear archivos vacíos.

```text
PaginaDocente/
├── index.html
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   ├── componentes.css
│   │   ├── perfil.css
│   │   ├── calendario.css
│   │   ├── tramites.css
│   │   ├── editor.css
│   │   └── impresion.css
│   ├── js/
│   │   ├── app.js
│   │   ├── core/
│   │   │   ├── almacenamiento.js
│   │   │   ├── respaldos.js
│   │   │   ├── fechas.js
│   │   │   └── validaciones.js
│   │   ├── perfil/
│   │   │   ├── perfil.js
│   │   │   └── instituciones.js
│   │   ├── calendario/
│   │   │   └── calendario.js
│   │   ├── tramites/
│   │   │   ├── catalogo.js
│   │   │   ├── dl01.js
│   │   │   ├── dj01.js
│   │   │   ├── dj02-registro.js
│   │   │   ├── dj02-vista.js
│   │   │   └── ol01.js
│   │   ├── documentos/
│   │   │   ├── plantillas.js
│   │   │   ├── pdf.js
│   │   │   └── impresion.js
│   │   └── editor/
│   │       ├── editor.js
│   │       ├── operaciones.js
│   │       ├── seleccion.js
│   │       └── anotaciones.js
│   ├── plantillas/
│   │   ├── dl01.pdf
│   │   ├── ol01.pdf
│   │   └── [otras plantillas verificadas]
│   ├── imagenes/
│   └── vendor/
│       └── pdf-lib-1.17.1.min.js
├── data/
│   ├── tramites.json
│   └── calendario-escolar-2026.json
├── docs/
│   ├── REVIEW_ADC_v60.md
│   ├── estructura.md
│   └── pruebas-manuales.md
└── tests/
    ├── licencias.test.js
    ├── respaldos.test.js
    └── fechas.test.js
```

La primera edición del informe continuará en la raíz hasta la etapa documental. Al moverlo, se corregirán sus enlaces y se conservará su historial. Las plantillas tendrán nombres definitivos después de identificar cuál usa cada trámite y si existen variantes. Los datos de `data/` serán exclusivamente catálogos públicos y calendarios de referencia. Los perfiles y licencias personales pertenecen al almacenamiento del usuario.

### Responsabilidades y dependencias

| Área | Responsabilidad | Dependencias admitidas |
| --- | --- | --- |
| core | Lectura/escritura, migración, respaldo y validación compartida | APIs del navegador y funciones puras de la misma área |
| perfil | Datos del docente, instituciones, cargos y horarios | core |
| calendario | Presentación y cálculo de calendario y eventos | core y calendario de referencia |
| tramites | Estado y reglas de cada trámite, con una vista definida | core, perfil, calendario y documentos |
| documentos | Carga de plantillas y generación/impresión de documentos | core, recursos y biblioteca PDF |
| editor | Selección y operaciones reversibles del diseño | DOM, core y referencias estables a elementos |
| app | Inicialización y navegación, conexión de las áreas | Interfaces públicas de las áreas anteriores |

Los trámites entregarán datos explícitos a documentos. El módulo PDF no leerá campos de formularios por su cuenta una vez completada la migración. El editor conservará sus operaciones sin apropiarse del estado de las licencias. Se evitarán dependencias circulares, con contratos pequeños definidos a partir de los usos reales.

### Etapa 0 — fijar la referencia y la recuperación

1. Identificar el `index.html` actual como referencia de esta migración y registrar su hash, recursos y orden de scripts/estilos.
2. Revisar la eliminación ya existente de la copia número 2 antes de registrar cualquier cambio futuro.
3. Recuperar respaldos representativos, incluyendo perfil antiguo y diseño con operaciones existentes. Usar datos sintéticos para las pruebas.
4. Implementar y validar el respaldo integral propuesto en la segunda revisión como cambio funcional independiente. La extracción mecánica de CSS/JS puede prepararse con copias de referencia mientras se completa este respaldo. Se corrige así cualquier interpretación de que ese respaldo impide siquiera preparar la reorganización.
5. Registrar el comportamiento inicial con recorridos manuales y pruebas de la lógica crítica. Los fallos existentes se anotarán para distinguirlos de regresiones.

Salida requerida: referencia recuperable, datos de prueba y lista de comprobaciones. Se conservará el mismo origen y ruta de entrada durante las comparaciones para no confundir un almacenamiento vacío con pérdida de datos.

### Etapa 1 — extracción mecánica conservando el orden

Comenzar por trasladar bloques completos a archivos externos, sin fusionar funciones ni cambiar sus nombres, sus eventos o su momento de ejecución. Durante esta etapa puede existir una carpeta temporal `assets/js/legacy/` con archivos numerados según el orden original y un archivo `docs/estructura.md` que mapee bloque original a archivo. Esa numeración es transitoria y no se usará como arquitectura definitiva.

Los estilos se extraerán manteniendo las posiciones y atributos de sus etiquetas. Si es necesario, se usarán temporalmente archivos numerados en `assets/css/legacy/`. Fusionarlos en base, componentes e impresión ocurrirá después de verificar la cascada. Mover todas las reglas de impresión al final podría cambiar su precedencia, por lo que esa agrupación requiere comparación específica.

El script mínimo que aplica el tema antes de pintar la página puede permanecer en la cabecera. Los demás scripts conservarán inicialmente sus etiquetas clásicas y su posición. No agregar `async`, `defer` ni `type="module"` indiscriminadamente, porque eso cambiaría ejecución y alcance de variables. Los manejadores HTML conservarán las funciones globales que invocan.

Salida requerida: mismo comportamiento y orden de inicialización, con el código más accesible en archivos separados. La cantidad de archivos por sí sola no se tomará como mejora de rendimiento.

### Etapa 2 — centralizar datos y almacenamiento

1. Inventariar las claves de perfil, historial, licencias, calendario, tema, posición de Ajustes y distribución.
2. Crear un acceso común que comunique lectura inválida, espacio insuficiente y fallo de guardado.
3. Mantener claves y esquemas legibles por los datos existentes. Si una migración resulta necesaria, versionarla, validar primero y conservar una recuperación del estado previo.
4. Resolver el manejador `storage` de DJ-02 con lectura al recibir cambios, y probar dos pestañas.
5. Hacer que exportación e importación integrales utilicen el mismo inventario de datos. Separar claramente restaurar todo de importar solamente un perfil.

Salida requerida: restauración comprobada, compatibilidad con los respaldos existentes y sincronización coherente. Se harán pruebas específicas de JSON inválido, datos parciales y fallos de escritura.

### Etapa 3 — consolidar áreas funcionales

Orden propuesto: utilidades puras, perfil e instituciones, calendario, registro DJ-02, vista DJ-02, DL-01, DJ-01 y OL-01. Para cada extracción se identificarán lectores, escritores, eventos y funciones que se reemplazan al final de la carga.

Los reemplazos de funciones se consolidarán solo después de documentar cuál es la versión efectiva y qué comportamiento anterior reutiliza. Se conservarán adaptadores globales para los atributos de eventos mientras existan. La migración a módulos ES se hará cuando las dependencias explícitas y el arranque estén listos, de forma coherente y con el punto de entrada probado.

Salida requerida por trámite: abrir, completar, validar, guardar, recargar y generar el resultado esperado. La consolidación irá acompañada de pruebas de regresión del comportamiento que se está moviendo.

### Etapa 4 — extraer plantillas y catálogos

Decodificar las plantillas incrustadas a archivos y comprobar sus hashes contra los bytes originales. Confirmar qué imágenes siguen utilizándose antes de eliminarlas del código. Alojar la misma versión de pdf-lib utilizada actualmente y conservar su licencia.

La carga de recursos se hará asíncrona con un estado visible de carga, recuperación de errores y bloqueo temporal del botón que requiere el recurso. La descarga se reutilizará durante la sesión. Los catálogos conservarán nombres de propiedades, orden relevante y tipos de datos.

Las rutas serán relativas a la aplicación para funcionar tanto bajo una subcarpeta de GitHub Pages como en otro alojamiento. Evitar rutas que empiezan en `/assets` cuando la aplicación se sirve bajo `/ADC/`. Al adoptar módulos y `fetch`, el modo de desarrollo será un servidor HTTP local autorizado. Si se necesita distribución de un único HTML por doble clic, se evaluará una exportación autocontenida como entregable específico.

Salida requerida: PDF equivalente, recursos presentes, fallos de carga comprensibles y funcionamiento bajo la ruta de publicación real.

### Etapa 5 — organizar el editor sin invalidar diseños

1. Separar operaciones reversibles, selección y anotaciones desde sus límites actuales.
2. Conservar o mapear los identificadores de elementos y probar importación de borradores anteriores.
3. Añadir las mejoras de uso solicitadas como cambios separados de la extracción, con criterios propios.
4. Verificar anotaciones, zoom, desplazamiento, deshacer/rehacer y exclusión de marcas al imprimir.

Salida requerida: un borrador previo recupera su diseño y los botones originales siguen ejecutando la acción correspondiente.

### Etapa 6 — limpieza y preparación para publicación

Renombrar archivos transitorios a los nombres funcionales del árbol, retirar adaptadores sin usos y actualizar referencias. Mover documentación a `docs/` y dejar instrucciones de apertura, pruebas y respaldo. Medir carga inicial, apertura de trámites y respuesta con un perfil grande respecto de la referencia.

La futura publicación incluirá `index.html`, scripts, estilos, catálogos y recursos necesarios. Probar la entrada desde la dirección pública, los enlaces relativos y la generación de PDF antes de considerar terminada la migración. La publicación o push se hará cuando el usuario lo solicite.

### Comprobaciones que habilitan pasar de etapa

- Sintaxis y referencias a archivos correctas, sin recursos ausentes ni errores nuevos de consola.
- Perfil e instituciones conservados tras guardar y recargar, con importación de respaldo antiguo.
- DL-01 genera su documento y una solicitud repetida mantiene el registro esperado.
- DJ-01 conserva horarios, instituciones, historial y salida imprimible.
- DJ-02 confirma, elimina y restaura, filtra por escuela y conserva la paginación esperada.
- OL-01 actualiza instituciones y cargos y genera su documento con datos correctos.
- Calendario conserva sus eventos y cálculos de referencia.
- Editor recupera un borrador previo y conserva selección, movimiento, tamaño y reversión.
- Impresión comparada con ejemplos anteriores en contenido, páginas y alineación.
- Respaldo integral recuperable en un origen de prueba limpio.

Si aparece una regresión, se corrige dentro de la etapa o se recupera el conjunto de archivos de su punto anterior. Se evitará mezclar una extracción estructural con rediseño visual o cambios de reglas de licencias en una misma entrega.

### Próxima actividad propuesta

Preparar la referencia de la etapa 0 y la matriz de pruebas. Después extraer los estilos y scripts en su orden actual. El árbol final se alcanzará gradualmente. Esta actualización registra el plan y no ejecuta la reorganización ni realiza commits o push.

## Reorganización local aplicada

Se ejecutó la separación inicial del `index.html` actual. Se extrajeron 23 hojas CSS y 19 scripts propios a `assets/`, organizados por calendario, perfil, trámites, documentos, interfaz, tema y editor. El mapa de ejecución está documentado en `docs/estructura.md`.

La extracción conserva el contenido exacto de cada bloque, sus posiciones y su orden de carga. `docs/structure-manifest.json` registra los hashes y las etiquetas necesarias para reconstruir el HTML anterior. `node tools/verify-structure.cjs` comprobó recursos presentes, sintaxis de los 19 scripts y reconstrucción idéntica al archivo previo.

No se ejecutaron los cambios funcionales de respaldos, sincronización, zoom o editor. El núcleo histórico y las capas de reemplazo siguen presentes en archivos identificados. La consolidación de esas dependencias permanece como siguiente etapa del plan. Las plantillas y fuentes incrustadas conservan su modo de carga previo.

El archivo de entrada debe distribuirse junto a `assets/`. La estructura separada requiere publicar todos esos archivos. El cambio organiza el mantenimiento del código y conserva las interacciones existentes. Para almacenar datos compartidos entre dispositivos se necesitará diseñar posteriormente el servicio correspondiente.

La validación ejecutada es de integridad y sintaxis. Quedan pendientes las pruebas interactivas y visuales en navegador, incluyendo impresión y recuperación de borradores. No se certifica todavía la ejecución completa de todos los trámites.

### Distribución funcional adicional desde el respaldo

El núcleo histórico se dividió en 14 archivos por responsabilidad, conservando exactamente su contenido concatenado y su orden de evaluación. Hay archivos específicos de instituciones, datos personales, respaldos, navegación, catálogo, solicitudes, reglas DL-01, generación de PDF, DJ-01 y arranque. La entrada carga ahora 32 scripts propios.

El inventario `docs/funciones-respaldo.md` identifica la ubicación de las funciones por archivo y orden de carga. Los 327 nombres únicos de funciones del respaldo se encontraron en la versión distribuida. Esa cobertura no sustituye la prueba interactiva de cada solapa. La sincronización de OL-01 permanece como corrección funcional explícita.

Se ejecutaron la verificación de recursos y sintaxis y la regresión de OL-01. El manifiesto admite un bloque original repartido entre varios archivos. Su modo habitual informa diferencias funcionales y `--baseline` exige igualdad con la extracción inicial. No se actualizó la referencia para ocultar diferencias. Las capas históricas del DJ-02 y las funciones compartidas continúan necesitando consolidación posterior.

El estado de Git ya incluía la eliminación de `Asistente_Docente_Chaco_2.html` antes de esta reorganización. Se conservó ese estado. Los cambios de esta etapa son locales, sin commit ni push.

## Comparación con respaldo y recuperación de OL-01

Se recibió `respaldo-original.html` y se compararon sus 19 bloques JavaScript con los archivos separados. Antes de la corrección, 18 bloques coincidían exactamente. La diferencia del núcleo corresponde al perfil de prueba, que en la versión actual está vacío. El respaldo incluye datos personales de ejemplo que no se incorporaron a la aplicación. También se encontraron diferencias de presentación ya existentes, como una referencia de calendario y la hoja responsive agregada a la entrada.

El autocompletado de OL-01 estaba presente tanto en el respaldo como en la versión reorganizada. La función `adcOLStart` retornaba al reabrir el mismo borrador antes de copiar los campos actuales del perfil. Ese recorrido existía también en el respaldo.

Se agregó `adcOLSyncTeacherProfile` en `assets/js/tramites/ol01.js`. Al abrir un OL-01 nuevo y al reabrir el mismo borrador se copian apellidos, nombres, DNI, sexo, domicilio y localidad desde el perfil. También se actualiza la localidad de emisión. Si cambian esos datos se invalida el PDF anterior, y la plantilla visual vuelve a seleccionarse según el sexo actual. La reapertura mantiene el motivo y otros campos del borrador. Por decisión basada en el pedido de autocompletado, los datos personales del perfil prevalecen sobre ediciones manuales de esos mismos campos al reabrir.

La prueba `node tests/ol01-perfil.test.cjs` pasó con datos sintéticos. Comprueba los seis campos, reapertura del borrador, actualización posterior del perfil, campos vaciados, cambio de sexo e invalidación del PDF solamente al cambiar datos. Los 19 scripts continúan pasando sintaxis. La comparación de nombres de funciones no encontró funciones del respaldo ausentes en los scripts actuales. Esa comparación acredita presencia, no equivalencia completa de comportamiento.

La comprobación de reconstrucción exacta describe la extracción inicial. A partir de esta corrección funcional, el hash de OL-01 difiere deliberadamente del manifiesto original. No se actualizó el hash para esconder esa diferencia. Las pruebas visuales e integrales permanecen pendientes. No se realizaron commits ni push.
# Referencia incorporada: nomenclatura de licencias (11/11/2026)

Se archivó el PDF aportado por el usuario en `docs/referencias/Nomenclatura.pdf`, junto con el catálogo legible `nomenclatura-licencias.md`, datos estructurados `nomenclatura-licencias.json` y extracción literal `nomenclatura-texto.txt`. El catálogo registra 46 motivos y 173 variantes: salud 50, otras licencias 68, permisos 43 y sección adicional de sanciones 12. Script reproducible: `tools/extract-nomenclatura.py` (requiere pdfplumber).

Los casilleros del código se concatenan completos: 1 / 1 / 1 = 111; 1 / 6 / 10 = 1610. También se preservan los componentes y una clave separada para evitar ambigüedades. Código y encuadre legal se almacenan por separado: para enfermedad común titular, el documento indica código 111 y encuadre 309-B 1).

Pendiente para futuros formularios: cotejar etiquetas y campos reales de DJ-01 y OL-01 antes de aplicar el pedido de colocar el código en «artículo» o «ley número». El PDF no identifica esos conceptos como equivalentes. Seleccionar por motivo, situación de revista y condiciones (prórroga, porcentaje de haberes, parentesco u otras), conservando observaciones y página fuente. No elegir una variante solamente por titular/interino/suplente. También existe Funcionario Político.

No se modificó la aplicación ni se conectaron estos datos a los formularios. No se verificó vigencia normativa. Quedan documentados texto recortado del traslado transitorio, variantes de escritura de Interino, salto del motivo 11 al 13 en otras licencias y sección adicional sin encabezado legible. Las aclaraciones de duelo de la página 6 se conservan sin reinterpretación. No se realizó push.
