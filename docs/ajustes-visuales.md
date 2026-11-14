# Ajustes visuales que pueden incluirse en Git

**Guardado directo local:** ahora podés usar **Commit to local**, sin descargar JSON. Iniciá `npm run dev:editor` o `npm run editor:bridge` si el servidor web ya está activo. Ver [instrucciones del editor local](editor-local.md). La tuerquita y el panel se ocultan en sitios externos, incluida la web publicada; el diseño guardado sí se aplica al publicarlo.

La tuerquita conserva su borrador y sus opciones de deshacer/rehacer. El botón **Exportar ajustes al proyecto**, al final del panel tanto del ingreso como de la aplicación, descarga `ADC_ajustes_ingreso.json` o `ADC_ajustes_pagina.json`.

## Flujo de trabajo

1. Abrir la página local mediante el servidor HTTP y ajustar con la tuerquita.
2. Mantener abierto el formulario ajustado y pulsar **Exportar ajustes al proyecto**. Si se ajustaron varios formularios dinámicos, exportar cada uno mientras esté abierto y revisar su incorporación: no se inventan destinos para elementos que ya no están presentes.
3. Compartir el archivo exportado o indicar a Codex dónde quedó guardado. El navegador no modifica por sí solo los archivos fuente.
4. Comprobar e incorporar localmente:

   ```powershell
   node tools/importar-ajustes.cjs "ruta\ADC_ajustes_pagina.json" --check
   node tools/importar-ajustes.cjs "ruta\ADC_ajustes_pagina.json"
   ```

5. Revisar el cambio de `assets/datos/ajustes-pagina.json`, recargar y verificar el resultado. Luego solicitar commit y, por separado, push cuando corresponda.

Cada importación reemplaza el conjunto exportado de su pantalla; conserva el de la otra pantalla. Para combinar exportaciones parciales de formularios diferentes, Codex debe revisar y combinar sus operaciones antes de importar, evitando perder las anteriores. No importar archivos de terceros sin revisarlos.

## Conservación y alcance

- Los ajustes usan selectores e identidades estructurales, no los índices numéricos históricos. Los formularios genéricos incluyen su identificador para evitar aplicar un ajuste de DP-01 a otro formulario.
- La distribución histórica base no se exporta automáticamente. Si el borrador reemplazó esa base, se pide usar la exportación JSON anterior para revisión manual. Ambos botones anteriores de importar/exportar siguen disponibles.
- Un borrador local existente tiene prioridad. **Usar ajustes del proyecto** respalda ese borrador y carga la configuración del repositorio. **Recuperar borrador anterior** permite volver al respaldo. El respaldo se conserva en ese navegador; no es un archivo Git.
- Los ajustes destinados a un formulario todavía cerrado esperan a que sus elementos existan. Al reconstruir sus elementos se reaplican; deshacer no vuelve a aplicar una operación retirada.
- No se extraen automáticamente valores de inputs, contraseñas, Perfil Docente ni borradores de trámites. Los textos que el usuario modifica expresamente con el editor sí forman parte de la exportación: revisar el JSON antes de compartirlo.
- Este flujo guarda ajustes visuales que ya soporta la tuerquita. Crear una caja o un botón visual no programa su comportamiento ni modifica automáticamente las coordenadas o la lógica del PDF descargado. Esos cambios requieren implementación y verificación aparte.
- Las referencias estructurales sin ID pueden necesitar revisión si cambia la estructura HTML. Una referencia ausente no se sustituye silenciosamente por otro elemento.
- No hay un servidor que permita escribir archivos arbitrarios, ni commit/push automático. El importador valida tamaño, esquema, acciones y referencias y escribe únicamente el registro de ajustes del proyecto.

## Archivos

- `assets/js/editor/ajustes-proyecto.js`: exportación y carga en el navegador.
- `assets/js/editor/ajustes-proyecto-datos.js`: contrato compartido y validación.
- `assets/datos/ajustes-pagina.json`: configuración versionable de página e ingreso, inicialmente vacía.
- `tools/importar-ajustes.cjs`: incorporación local y modo de comprobación.
- `tests/ajustes-proyecto.test.cjs`: contrato, importador aislado y flujo en Chrome.

No se editaron las implementaciones propias de DJ-01, DJ-02, OL-01, SC-01 ni DL-01 para esta función.

## Imágenes, PDF y herramientas con el mouse

### Seleccionar y ajustar documentos completos

Con Ajustes abierto, hacer clic sobre el fondo del documento para seleccionarlo. Mantener presionado el segundo clic y arrastrar para moverlo. También puede hacerse doble clic y luego arrastrar la selección. Aparecen ocho controles azules: cuatro bordes y cuatro esquinas. Todos cambian la escala conservando las proporciones, incluyendo las cajas y los datos superpuestos; no se estira únicamente la imagen de fondo.

Funciona sobre los lienzos de SC-01, OL-01, BD-02, DJ-01, DJ-02, formularios oficiales preparados y documentos agregados con la tuerquita. Para visores PDF nativos se selecciona el contenedor mediante una capa transparente, disponible sólo mientras Ajustes está abierto. Al cerrar Ajustes se recupera el uso normal del visor y de los campos.

Los gestos se guardan como `documentTransform` en el borrador y en la copia JSON. Deshacer/rehacer y Escape durante el arrastre están disponibles. Estos ajustes cambian la presentación web: no alteran los datos, las dimensiones de la plantilla oficial ni la generación del PDF final.

La implementación compartida está en `assets/js/editor/documentos.js`. No se modificaron los archivos propios de los formularios. Una vista previa todavía cerrada no bloquea los ajustes pendientes de otros documentos.

### Botones y solapamientos

Con **Ajustes abierto**, hacer doble clic en un botón para seleccionarlo: aparece el borde azul entrecortado y se activa mover/ajustar tamaño. Arrastrar el botón para moverlo y sus bordes para redimensionarlo. El borde permanece visible durante la selección.

En el modo libre o de tamaño, los clics del mouse sobre los botones de la página se reservan para editar; para ejecutar sus acciones habituales, cerrar Ajustes. Los controles del panel conservan su funcionamiento.

Se permiten solapamientos entre elementos. El elemento seleccionado se trae al frente, incluyendo los contextos de apilamiento de sus contenedores cuando es necesario. Esta operación se guarda en el borrador y en la copia JSON, y puede deshacerse. Superponer no combina los datos ni la lógica de los elementos. Se conserva el límite del área de trabajo.

En **Agregar y borrar elementos** se encuentran:

- **Agregar imagen**: elegir PNG, JPG o WebP (hasta 500 KB) y dibujar su espacio con el mouse. Seleccionar y arrastrar sus bordes para cambiar el tamaño. El contenido de la imagen mantiene sus proporciones dentro del recuadro.
- **Reemplazar imagen**: activar la herramienta, tocar la imagen y elegir su reemplazo. Deshacer recupera la anterior.
- **Borrar elementos**: tocar el elemento y confirmar. Se oculta de manera reversible; no se eliminan datos guardados ni se modifica el PDF oficial que usan los botones de descarga de un trámite.
- **Agregar PDF**: elegir un PDF válido, sin contraseña, de hasta 5 MB y 20 páginas. Se incorpora en la sección seleccionada, o en el área visible de la aplicación. Cada página conserva sus proporciones y se muestra con PDF.js, con una capa donde pueden agregarse cajas, imágenes, anotaciones y botones. Se incluye el original en la copia JSON.
- **Ajustar PDF al ancho**: seleccionar el documento agregado y pulsar el botón. También puede modificarse su ancho con los bordes laterales; no se ofrece deformar su alto. Sus páginas se escalan en conjunto con sus elementos superpuestos. Mover el contenedor cambia la posición del conjunto.
- **Agregar caja / sección / botón / desplegable** reutiliza las herramientas existentes. En el PDF, las coordenadas se conservan en unidades del documento y se convierten al dibujar o ajustar con el mouse. Los botones nuevos requieren asignar una acción compatible; una caja visual no equivale a un campo de datos del formulario.
- **Guardar copia de modificaciones (JSON)** intenta guardar el borrador del navegador y descarga el archivo para incorporar al repositorio. Si se agota el almacenamiento del navegador por incluir documentos, conservar la descarga: la exportación funciona independientemente del guardado local. El conjunto exportado admite hasta 12 MB.

### Reemplazar un formulario y revisión de precisión

1. Seleccionar la sección del formulario que se está preparando.
2. Ocultar su documento anterior con **Borrar elementos**. El original del repositorio permanece intacto.
3. Agregar el nuevo PDF, ajustar su ancho y ubicarlo.
4. Dibujar cajas y anotaciones en cada página. Verificar especialmente los extremos y los márgenes después de cambiar el ancho.
5. Guardar la copia JSON y compartirla para incorporar sus ajustes y recursos al proyecto.

Este es un editor visual, no un reemplazo automático del motor de cada trámite. Los botones existentes de vista previa, descarga e impresión siguen usando su implementación y su plantilla actuales. Para que el PDF nuevo y sus campos formen parte del documento final, debe integrarse su configuración al motor del formulario y probarse antes de publicar. No se reasignan silenciosamente campos ni reglas de licencias.

Para una siguiente etapa se recomienda identificar cada caja con nombre y tipo de dato, indicar qué campo del Perfil Docente corresponde, ofrecer coordenadas finas en milímetros y añadir guías de alineación para casilleros. La validación, MNC y el PDF final se conectarían a esas definiciones, después de revisar visualmente cada documento.

Pruebas: `tests/editor-elementos.test.cjs` usa Chrome aislado en ingreso y aplicación: imagen agregada y redimensionada mediante el mouse, reemplazo/deshacer, eliminación/deshacer, PDF de dos páginas, caja superpuesta, conservación de coordenadas al escalar, copia JSON y recuperación de páginas y caja al recargar.
## Acceso discreto a Ajustes

El botón flotante empieza transparente y conserva su zona de clic por encima de la página. Cinco clics o toques sobre esa zona lo hacen visible; otro clic abre las herramientas. También se puede revelar con cinco pulsaciones consecutivas de Tab, sin impedir la navegación habitual del teclado.

La visibilidad se conserva al recargar únicamente en la sesión de esa pestaña (`sessionStorage`), asociada a la cuenta activa. Al cerrar sesión o cambiar de cuenta se oculta y se cierra el editor. No se guarda en el proyecto, en la exportación ni en Supabase. Esto es un acceso visual discreto, no un control de autorización.
