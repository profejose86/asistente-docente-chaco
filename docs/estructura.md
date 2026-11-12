# Estructura y ejecución

La entrada de la aplicación es `index.html`. Los estilos están en `assets/css/` y los scripts en `assets/js/`, agrupados por área.

```text
PaginaDocente/
├── index.html
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   ├── calendario/
│   │   ├── documentos/
│   │   ├── editor/
│   │   ├── interfaz/
│   │   ├── perfil/
│   │   └── tramites/
│   └── js/
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

`core/inicializacion.js` restaura al iniciar el perfil local guardado en `adc_v08`; así los datos, incluido el DNI, están disponibles en los campos de Mi Perfil Docente. En SC-01, los datos personales se actualizan automáticamente desde ese perfil al abrir el trámite y cuando se modifica uno de sus campos; no se ofrece una acción para cargar otro perfil. Las acciones de vista preliminar, descarga e impresión aparecen antes y después del formulario. El PDF se aplana antes de mostrarse, descargarse o imprimirse, por lo que sus campos ya no son rellenables/editables como formulario. Cada campo opcional vacío de SC-01 tiene un control X que permite marcarlo individualmente como “no corresponde”; al volver a pulsarlo se quita la marca y el campo queda editable. La selección se conserva en el borrador y se representa en el PDF con una línea negra centrada del 70% del ancho del campo y 0,75 mm de grosor. Los campos opcionales sin marcar quedan vacíos, sin líneas automáticas. La línea se dibuja mediante `adcPdfDrawBlankLine` de `assets/js/documentos/pdf-utilidades.js`. Las pruebas unitarias se ejecutan con `node tests/geografia.test.cjs` y `node tests/pdf-blank-line.test.cjs`.

## Máxima MNC: marcar “No corresponde”

MNC significa “Marcar No Corresponde”. Esta regla es transversal: aplica a todos los formularios, GAPS, planillas y plantillas de la aplicación, no solo a SC-01. En cada campo opcional vacío debe ofrecerse una X al inicio; al activarla, muestra “Tachar si no corresponde” y traza una línea negra centrada que cubre el 70% del ancho del campo y tiene 0,75 mm de grosor. Al volver a pulsarla, quita la línea y permite editar el campo. Los campos obligatorios, radios y casillas de dígitos no se tachan; los campos vacíos no marcados permanecen sin línea automática. SC-01 es la implementación de referencia. Cuando se pida “aplicar la Máxima MNC”, debe respetarse este comportamiento en el documento correspondiente.
