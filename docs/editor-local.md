# Editor visual local con guardado directo

La persistencia común del puente y del importador reside en `tools/ajustes-store.cjs`. El endpoint conserva su dirección y su contrato; las operaciones visuales compartidas viven en `assets/js/editor/comun.js`.

ADC Studio y la tuerquita pueden abrirse también online, con activación por pestaña. Sólo **Commit to local** y el puente están restringidos a HTTP en `localhost`, `127.0.0.1` o `::1`. La web publicada no se conecta al puente. Ver [ADC Studio](adc-studio.md).

## Iniciar

Desde la raíz del proyecto:

```powershell
npm run dev:editor
```

En esta PC también puede usarse el npm del entorno:

```powershell
.\tools\npm-local.cmd run dev:editor
```

Esto inicia la página en `http://localhost:8765/ADC_Ingreso_Editable.html` y el puente en `http://localhost:3005`. Si la página local ya está servida en el puerto 8765, iniciá solamente el puente:

```powershell
.\tools\npm-local.cmd run editor:bridge
```

No inicies dos puentes o dos servidores sobre el mismo puerto. Para otro puerto de la web, `PORT=...` se admite en `dev:editor`. Al iniciar el puente separado, `ADC_EDITOR_ORIGINS` permite definir explícitamente los orígenes HTTP de loopback separados por comas. No admite dominios externos.

## Editar y guardar

1. Abrí la página local y revelá Ajustes con cinco clics/toques en su zona o cinco pulsaciones de Tab.
2. Abrí Ajustes. Reutilizá las herramientas existentes de selección, arrastre, tamaño, texto, color, cajas, botones, notas, imágenes y PDF. Para editar texto desplegá **Editar texto** y usá **Aplicar texto**.
3. Pulsá **Commit to local**, al principio del panel. No hace falta descargar ni seleccionar archivos JSON.
4. Esperá **Guardado local completo**. Podés recargar o abrir otra pestaña sin borrador visual para verificarlo. Un borrador visual previo mantiene su prioridad hasta elegir **Usar ajustes del proyecto**.

El botón guarda únicamente la pantalla actual (`ingreso` o `pagina`). Conserva el diseño de la otra pantalla. Guarda en el archivo fuente versionable `assets/datos/ajustes-pagina.json`, que el editor compartido aplica al cargar. No regenera los HTML/PDF oficiales ni convierte una captura de la página en código. Conserva las operaciones diferidas de formularios cerrados. Una referencia nueva que no pueda resolverse requiere abrir el formulario correspondiente antes de guardar; no se inventan destinos.

Los valores introducidos normalmente en los formularios no se serializan: se envían operaciones explícitas del editor. Los textos, notas, imágenes y PDF añadidos mediante el editor sí forman parte del diseño y pueden publicarse después de un push; evitá datos personales reales en esas notas y recursos.

## Respaldo y concurrencia

- Cada escritura crea una copia anterior en `.adc-tools/editor-backups/`, carpeta ignorada por Git y bloqueada por el servidor web.
- El guardado usa un archivo temporal exclusivo y reemplazo por renombrado. Las peticiones no pueden elegir rutas, nombres de archivo ni comandos.
- El navegador envía la revisión de la pantalla que cargó. Si otra pestaña o VS Code la modificó, el puente devuelve **409** y conserva el archivo. Revisá ambos cambios antes de recargar; podés guardar el borrador o exportar una copia opcional para no perder la edición de esa pestaña.
- Si el puente no está iniciado o no responde, aparece el comando para iniciarlo y los cambios continúan en pantalla. No se borra el borrador.

## Alcance del puente

`tools/local-editor-bridge.cjs` escucha sólo en `127.0.0.1:3005`. `GET /session` entrega un token efímero únicamente a un origen local autorizado. `POST /commit-local` requiere ese token, JSON válido, una pantalla compatible y una revisión vigente. Limita el cuerpo a 12 MB y rechaza hosts, orígenes, propiedades, operaciones y rutas no admitidos. No debe publicarse ni exponerse en la red.

**Commit to local guarda archivos; no ejecuta `git commit`, `git add` ni `git push`.** Se decidió mantener el versionado separado para permitir revisar el diff antes de confirmarlo. El backend nunca incorpora contraseñas, sesiones de Supabase o borradores del perfil.
