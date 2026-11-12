# OL-01 · Solicitud de licencia

Extracción de `Asistente_Docente_Chaco_v0_9_16_60(2).html`. Conserva la maqueta del formulario, las coordenadas de los campos, las plantillas y las reglas que usa ese archivo. El ancho mínimo de la hoja queda en 840 px y el zoom conserva el rango 45–110 %. Ajustá esos valores después de ver cómo entra en el contenedor del proyecto.

- `ol-01.html` contiene el fragmento que se inserta en la vista del trámite.
- `ol-01.css` contiene los estilos del formulario y su barra de zoom.
- `ol-01.mjs` exporta `montarOL01`. El módulo toma los datos y las reglas del proyecto anfitrión.
- `plantillas/` reúne los dos fondos de pantalla, los dos PDF de impresión y la fuente de la vista previa.

## Montaje

1. Insertá el fragmento HTML en el contenedor de la ruta. Cargá su CSS y conservá la carpeta `plantillas` junto al módulo y la hoja de estilos.
2. Llamá a `montarOL01` una vez, cuando exista el elemento `#adcOL` y esté listo el catálogo. Si tu proyecto usa un empaquetador, configurá la entrega de los activos para que las rutas resueltas con `import.meta.url` encuentren los archivos.
3. Usá `abrir(false)` para entrar desde el menú de trámites o `abrir(true)` para precargar el contexto del DL-01. `showOL01` debe mostrar la vista. Si el contenedor estaba oculto, podés llamar a `ajustarVista()` al mostrarlo.
4. Probá con el servidor local del proyecto. El módulo usa `fetch` para cargar el PDF base al generar la impresión.

Ejemplo de conexión si tu proyecto conserva los nombres del HTML 60. Las referencias de la derecha provienen de tu aplicación.

```js
import { montarOL01 } from './ol-01/ol-01.mjs';

const ol01 = montarOL01({
  root: document.getElementById('adcOL'),
  getInstitutions: () => inst,
  getSelectedReason: () => selected,
  showOL01: () => tab('ol01'),
  backToTramites: adcBackToTramites,
  tramites,
  adcTramiteLabel,
  norm,
  mapping,
  affected,
  adcDueloRelations,
  adcDueloCode,
  adcDueloRelation,
  isCalendarClosed: (iso, escuela) => window.adcOLCalendarClosed(iso, escuela),
  date,
  fmt,
  pdfText,
  adcPersonalValid,
  adcPersonalFormat,
  getPdfLib: () => window.PDFLib
});

ol01.abrir(false);
```

## Dependencias que hay que conectar

| Área | Contrato de la versión 60 |
| --- | --- |
| Instituciones y cargos | `getInstitutions()` devuelve escuelas con `id`, `name`, `level` y `entries`. Cada cargo aporta `type`, `cargoName` o `subject` y `course`, y `revista`. |
| Perfil docente | `getHostField(id)` devuelve un elemento con `.value`. Los identificadores heredados son `perfilApellidos`, `perfilNombres`, `dni`, `sexo`, `perfilDomicilio` y `perfilLocalidad`. Si el proyecto usa un estado central, adaptá el lector a ese estado. |
| DL-01 | `getSelectedReason()` devuelve el motivo actual. `affected()` devuelve filas con la referencia al cargo en `.e`. El formulario lee `escuelaSelect`, `desde`, `hasta` y `pago` mediante `getHostField`. |
| Encuadre | `tramites` contiene filas con nombre, categoría y palabras de búsqueda. `mapping(cargo, motivo, pago)` devuelve el par código y artículo. Los auxiliares de Duelo y `isCalendarClosed(fechaISO, escuela)` se conectan a las reglas y al calendario del proyecto. |
| PDF | `getPdfLib()` devuelve la biblioteca con `PDFDocument` y `StandardFonts`. El HTML de origen carga pdf-lib 1.17.1. También se reutilizan los auxiliares de fecha, DNI y normalización de texto del proyecto. |
| Estilos comunes | El fragmento conserva clases generales de ADC como `toolbar`, `alt`, `small`, `warning` y `status`. Usá los estilos comunes de tu aplicación o vinculá sus equivalentes. |

## Rama e integración

Creá la rama desde la base que uses para desarrollar. Por ejemplo, si ya estás en esa base:

```bash
git switch -c OL-01
```

Copiá esta carpeta a la ubicación que corresponda a los formularios de tu proyecto. Para indicar la ubicación exacta y preparar el cambio integrado, hace falta el repositorio o una copia, la rama base, el árbol de carpetas y los archivos que manejan las rutas, el perfil docente, el catálogo de licencias y los PDF. Un `package.json`, si existe, permite identificar cómo se montan y sirven esos archivos. Se puede trabajar con esos archivos por separado si el repositorio es privado.

Se verificó la sintaxis del módulo y se extrajeron los activos binarios directamente del adjunto. Falta verificar el montaje, el tamaño en pantalla y la generación de PDF con los datos y las rutas del repositorio.
