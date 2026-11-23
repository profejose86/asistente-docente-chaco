# MOTOR-01 — prueba local inicial con INCAPACIDAD

Estado: implementación experimental local del primer paso autorizado. No es el motor completo ni una publicación. Conserva PDF, coordenadas, reglas, MNC, revisión, acciones y clave `adc-official-form-incapacidad-draft-v1` existentes.

## Acceso y aislamiento

Ejecutar `node tools/motor01-preview.cjs` con el Node instalado. El servidor escucha exclusivamente en `127.0.0.1:8912` y muestra este enlace:

`http://127.0.0.1:8912/adc/index.html?adc-preview=1&adc-motor01=incapacidad`

Usar únicamente datos ficticios. El puerto define un origen de navegador separado de la publicación y de otros puertos locales. Dentro de este origen se reutiliza el borrador histórico, sin limpiarlo automáticamente. El servidor responde configuración demo sólo en memoria; no compila, edita configuración pública ni conecta con Supabase. No exponer este servidor mediante un proxy público.

La URL por sí sola no habilita el piloto: requiere `motor01Pilot:true`, modo demo y hostname loopback. El servidor normal y la publicación no entregan esa capacidad. No se modifica `index.html` ni se cambia el acceso del catálogo habitual. El botón experimental se inserta en `DOMContentLoaded`, después del registro histórico del editor.

Por pedido del propietario, el acceso experimental se ubica dentro de **Mis trámites**, al comienzo del catálogo, con el título «Prueba MOTOR-01 · INCAPACIDAD». La URL de prueba abre esa sección. El acceso queda oculto al entrar en Perfil Docente o en un formulario y reaparece al volver al catálogo; no se deja contenido experimental al pie del perfil. Se conserva la tarjeta habitual de INCAPACIDAD, el formulario y la clave de borrador.

## Comportamiento implementado

- El botón Abrir INCAPACIDAD identifica directamente el formulario. Retoma el borrador local o utiliza la precarga existente si no hay uno. No ofrece varias instancias, consulta ni limpieza automática.
- `adcMotor01Pilot`, disponible sólo cuando se habilita la prueba, ofrece `abrir`, `guardar` y `cerrar`. Sólo admite `formId:'incapacidad'` e `instanceId:'historico'`; una identidad diferente no abre ni escribe.
- Reabrir la instancia activa no recarga el modelo ni reemplaza cambios.
- El guardado existente ahora propaga su resultado. En el piloto, además se compara la lectura local con la captura serializada; no se anuncia sincronización remota.
- Antes de volver al catálogo, cambiar de solapa mediante `tab` o abrir otro formulario del catálogo, se captura y confirma el guardado. Si falla o no coincide, el documento permanece abierto con sus controles y valores; se ofrece reintentar Guardar cambios.
- Guardar un borrador incompleto no requiere completar los requisitos administrativos para emitir el PDF.
- Al salir correctamente se cancela la revisión, se invalida la vista preliminar y se desactiva el visor reutilizado. No se crea un visor adicional.
- Por pedido posterior del propietario, INCAPACIDAD activa el doble clic de entrada/salida a pantalla completa y el botón flotante Maximizar/Restaurar arriba a la derecha. Reutiliza las opciones existentes del visor; no modifica los campos, el PDF ni las reglas del formulario.

## Verificación y límites

`tests/motor01-piloto.test.cjs` usa Chrome local, datos ficticios, HTTPS bloqueado y un puerto efímero. Comprueba apertura directa/histórica, identidades rechazadas sin escritura, repetición sin recarga, guardado, excepción de cuota, escritura omitida con cambios pendientes, salida por botón/solapa/catálogo/API, reintento, recarga, conservación de otro borrador y desactivación fuera del servidor experimental. No genera archivos dentro del proyecto.

Resultados locales de esta implementación:

| Comando | Resultado |
| --- | --- |
| `node --test --test-concurrency=1 tests/motor01-piloto.test.cjs` | 3 aprobadas tras agregar doble clic y botón flotante |
| `node --test --test-concurrency=1 tests/arquitectura.test.cjs tests/pdf-campos.test.cjs tests/sincronizacion.test.cjs` | 14 aprobadas |
| En copia temporal: `node --test --test-concurrency=1 tests/incapacidad-pdf.test.cjs tests/dp01-experiencia.test.cjs tests/md01-vpi.test.cjs tests/md01-mnc.test.cjs tests/dl02-pdf.test.cjs tests/bd02-estandares.test.cjs tests/formularios-oficiales.test.cjs` | 27 aprobadas y 1 fallida inicialmente |
| En la misma copia: `node --test tests/dl02-pdf.test.cjs` | 1 aprobada al repetir |

La falla inicial de DL-02 fue un timeout en `tests/dl02-pdf.test.cjs:119`: el canvas interceptó el clic del botón flotante. La repetición aprobada no elimina esa evidencia ni establece su causa. No se cambió DL-02 para ocultarla. El Node utilizado es el instalado en `C:\Users\CONECTIA BA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`. No se instalaron dependencias.

El inventario y mapa se actualizaron con `node tools/auditar-arquitectura.cjs` y el control `--check` aprobó; `git diff --check` también. Frente al manifiesto preservado, el único archivo existente de aplicación cambiado en esta etapa es `assets/js/tramites/formularios-oficiales.js`; PDFs, coordenadas, estilos e `index.html` conservan sus hashes. No es una suite completa ni una verificación online.

El piloto es síncrono y demo: no se presenta como prueba de cambio de cuenta, CAS remoto, cola asíncrona, consulta sin escritura o múltiples instancias. No intercepta cierre forzado del navegador ni garantiza recuperación de cambios no guardados ante ese cierre. Se conserva el visor persistente actual; todavía no implementa `destroy` ni demuestra liberación completa de observadores/listeners. BD-02 aún no está incorporado al piloto.

Las validaciones de emisión siguen siendo las anteriores. No se acredita identidad legal, validez administrativa, impresión física ni compatibilidad con dispositivos físicos. El contrato completo sigue en [diseño](motor01-contrato-apertura-guardado-cierre.md); sólo esta primera porción está implementada.

## Reversión

Cerrar el servidor de prueba y usar el acceso habitual deja el piloto deshabilitado. El borrador permanece en el origen de prueba; no se migra a producción. No se hicieron cambios remotos, commit, push ni publicación.
