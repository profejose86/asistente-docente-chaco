# Código que hace funcionar Ajustes (la tuerquita)

La nueva interfaz se documenta en [ADC Studio](adc-studio.md): `studio.js`, `studio-directo.js`, `studio-guias.js`, `studio-politicas.js`, `studio-operaciones.js` y `assets/css/editor/studio.css`. Son extensiones compartidas de los motores y el guardado existentes.

Actualización de arquitectura: ambos motores reutilizan `assets/js/editor/comun.js` (registro, saneamiento, geometría y paleta) y `assets/css/editor/base.css`. El puente y el importador comparten `tools/ajustes-store.cjs`. Ver [auditoría modular](arquitectura-auditoria.md). Los dos motores siguen existiendo por sus diferencias intencionales.

Este es el mapa de la implementación actual. El editor tiene dos motores existentes: uno para el ingreso y otro para la página principal. Ambos reutilizan las herramientas y el guardado compartidos. Este documento no crea una segunda implementación ni cambia el funcionamiento.

## Archivos y estructura

```text
ADC_Ingreso_Editable.html           Botón y panel en la pantalla de ingreso
index.html                         Botón y panel en la aplicación
assets/
  css/
    acceso/editor.css              Apariencia del editor de ingreso
    editor/editor.css              Apariencia del editor de la aplicación
    editor/acceso-ajustes.css       Ocultamiento local, transparencia y botón maestro
  js/
    acceso/editor.js               Motor visual del ingreso
    editor/
      modo-local.js                Habilita herramientas sólo en HTTP de loopback
      acceso-ajustes.js            Cinco clics/toques o Tab y visibilidad por sesión
      editor.js                    Motor visual de la aplicación
      documentos.js                Selección, movimiento y escala del documento entero
      elementos.js                 Imágenes, PDF, capas y elementos añadidos
      ajustes-proyecto-datos.js     Contrato y validación de operaciones
      ajustes-proyecto.js           Referencias estables, carga y recopilación del diseño
      puente-local.js              Botón Commit to local y peticiones HTTP
  datos/
    ajustes-pagina.json            Diseño guardado y versionable
  vendor/pdfjs/                    Renderizador de los PDF añadidos por las herramientas
tools/
  local-editor-bridge.cjs           Backend que escribe el diseño en el proyecto
  dev-server.cjs                   Servidor de la página local
  importar-ajustes.cjs             Importación manual anterior, conservada como alternativa
package.json                       Comandos dev:editor y editor:bridge
```

## HTML: botón y herramientas

Los dos HTML contienen el botón `#adcDesignGear`, el panel `#adcDesignPanel`, el estado `[data-status]`, los botones `data-act` y las opciones `data-format`.

Ejemplo del enlace entre HTML y JavaScript:

```html
<button type="button" id="adcDesignGear" data-adc-locked
        aria-expanded="false" aria-controls="adcDesignPanel">⚙ Ajustes</button>
<aside id="adcDesignPanel" hidden aria-label="Editor de diseño">
  <!-- Los controles reales están en los HTML del proyecto. -->
  <button data-act="undo">Deshacer</button>
  <button data-act="redo">Rehacer</button>
  <button data-act="box">+ Caja</button>
</aside>
```

Este fragmento es ilustrativo: no debe reemplazar el panel completo existente. Los módulos compartidos añaden otros controles, incluyendo imágenes, PDF y Commit to local.

## Qué modificar para cada función

| Función | Implementación principal |
| --- | --- |
| Mostrar sólo en localhost | `modo-local.js` y `acceso-ajustes.css` |
| Revelar después de cinco clics/toques o Tab | `acceso-ajustes.js`: contadores, `reveal()`, `lock()`, `identify()` |
| Conservar la visibilidad por pestaña/cuenta y ocultar al salir | `acceso-ajustes.js`: `sessionStorage` y evento `adc:auth-changed` |
| Abrir/cerrar Ajustes y mover la tuerquita | Ambos motores: `toggle()`, `positionSettings()`, eventos de puntero del botón |
| Identificar y seleccionar elementos | Ambos motores: `register()`, `keyFor()`, `resolve()`, `select()` |
| Mover y redimensionar cajas/botones | Ambos motores: `start()`, `geometry()`, `alignedGesture()` y eventos de puntero |
| Recuadro seleccionado, tiradores y reglas | Ambos motores: `mark()`, `scheduleMarks()`, `paintRulers()`; estilos del editor |
| Alinear y centrar | Ambos motores: `align()`, `centerRect()`, `showCenter()`, `drawGuide()` |
| Editar texto y su formato | Ambos motores: `format()`, `cleanHtml()`, operación `text` y controles `data-format` |
| Cambiar colores y apariencia | Ambos motores: paleta y operación `style` |
| Crear cajas, botones, secciones, desplegables y burbujas | Ambos motores: `apply()`, `makeSection()`, `toolClick()`, acciones `data-act` |
| Dibujar notas, recuadros, óvalos y líneas | Ambos motores: herramientas de anotación; el motor principal añade extremos de línea ajustables |
| Eliminar y recuperar elementos | Motores: `eraseSelected()`; `elementos.js`: operaciones reversibles de ocultamiento |
| Agregar o reemplazar imágenes | `elementos.js`: importación, validación y operaciones `image` / `replaceImage` |
| Agregar PDF y controles encima | `elementos.js`: `openPdf()`, operación `pdf`, colocación y referencias de elementos creados |
| Seleccionar/mover/escalar el formulario entero | `documentos.js`: `attach()`, `begin()`, `paint()`, operación `documentTransform` |
| Llevar lo seleccionado por encima de otros elementos | `elementos.js`: operación `front` y tratamiento de sus contextos de apilamiento |
| Deshacer/rehacer | Ambos motores: `operations`, `reversals`, `redo` y acciones `undo` / `redo` |
| Guardar/recuperar un borrador del navegador | Ambos motores: serialización, `load()`, almacenamiento local y restauración |
| Cargar el diseño guardado en el proyecto | `ajustes-proyecto.js`: `attach()`, carga del registro y repetición diferida de operaciones |
| Convertir selección interna en referencias persistentes | `ajustes-proyecto.js`: `describe()`, `resolve()`, `collect()` |
| Validar tipos de acciones, medidas y recursos | `ajustes-proyecto-datos.js`: `allowed`, `reference()`, `validate()` |
| Guardar directo con Commit to local | `puente-local.js`: `attach()`, `snapshot()`, hash de revisión y peticiones HTTP |
| Escribir el archivo fuente, crear respaldo y detectar conflictos | `local-editor-bridge.cjs`: `createBridge()`, `saveLayout()`, `safePath()`, `revision()` |

`commit(op)` dentro de los motores significa registrar una operación visual reversible. No es un commit de Git.

## Orden de carga

En el `head` se carga `modo-local.js`. Al final del documento se cargan:

1. `acceso-ajustes.js`.
2. `ajustes-proyecto-datos.js`.
3. `documentos.js`.
4. `elementos.js`.
5. `puente-local.js`.
6. `ajustes-proyecto.js`.
7. El motor correspondiente: `acceso/editor.js` para el ingreso o `editor/editor.js` para la aplicación.

Este orden permite que el motor entregue su API a los módulos compartidos. No se deben cargar los dos motores simultáneamente en la misma pantalla.

## Flujo de una edición

```text
Mouse / teclado / controles del panel
        ↓
Motor del ingreso o motor de la aplicación
        ↓
Operaciones visuales reversibles + DOM actualizado
        ↓
ajustes-proyecto.js: referencias estables y recopilación
        ↓
puente-local.js: GET /session y POST /commit-local
        ↓
local-editor-bridge.cjs: validar origen, token, contrato y revisión
        ↓
Respaldo en .adc-tools/editor-backups/
        ↓
Escritura de assets/datos/ajustes-pagina.json
        ↓
Al recargar: el módulo compartido vuelve a aplicar el diseño
```

El guardado no reescribe automáticamente los HTML, CSS o PDF originales: escribe las instrucciones de diseño en el registro fuente compartido. Tampoco guarda automáticamente los valores completados en formularios ni ejecuta Git.

## Ejecutar y probar

```powershell
.\tools\npm-local.cmd run dev:editor
```

Si la página local ya está funcionando:

```powershell
.\tools\npm-local.cmd run editor:bridge
```

Pruebas relacionadas: `acceso-ajustes.test.cjs`, `editor-botones.test.cjs`, `editor-documentos.test.cjs`, `editor-elementos.test.cjs`, `ajustes-proyecto.test.cjs`, `local-editor-bridge.test.cjs` y `local-editor-ui.test.cjs`.

Ver también [uso y límites del editor local](editor-local.md) y [ajustes visuales y borradores](ajustes-visuales.md).
