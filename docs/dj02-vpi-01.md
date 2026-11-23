# DJ02-VPI-01 — primera prueba aislada en Mis Trámites 2

23/11/2026. Rama `inicio`, conservada. Prueba local autorizada por las instrucciones adjuntas; no sustituye el recorrido habitual. Sin commit, push, pull, merge o publicación.

## A. Referencia y diferencias

Se inspeccionó `materiales/Asistente_Docente_Chaco_v0_9_16_60.html`. SHA-256: `60b98cd595c5893bd67979e225f4564eb644873d8d0dcfc2225f640118f88dbd`; coincide con la copia encontrada inicialmente en Descargas. Ambas se conservaron sin modificaciones.

La implementación final efectiva es el bloque ADC 58: `dj02Open` en línea 6028, `dj02Preview` en 6034, `dj02Save` en 6037 y `dj02Print` en 6041. Se revisaron además `render`, `newLicense`, `updateField`, `stateAction`, `paginate`, `adc58Read`, `adc58Project` y `adc58Transition`. No se copiaron definiciones anteriores reemplazadas.

El proyecto ya conserva esa experiencia en `dj02-registro.js`. Actualmente añade validación guiada antes de previsualizar/imprimir y `adcUserStorage` en lugar de acceso directo a `localStorage`. Se conservaron estas mejoras y la clave lógica existente `adc_dj02_v1`.

## B. Funciones reutilizadas

Edición directa de filas, sugerencias, pendientes procedentes de DL-01, confirmación de otorgamiento, eliminación recuperable, listado de eliminadas, recuperación, filtro institucional, paginación, guardado y salida de impresión. No se reescribió ninguna de estas funciones ni se cambiaron relaciones normativas.

## C. Adaptaciones del VPI

Se reutiliza `adcPdfViewer.create` con `setEnabled`, `sync` y sus callbacks de escala/ajuste. La API ya admite `minScale`: no se modificó el visor compartido en esta etapa. `adc-dj02-vpi=1` activa exclusivamente la prueba DJ-02 con rango 25–200 %. Sin ese parámetro se conserva el encuadre MT2 anterior. En celular puede necesitar desplazamiento horizontal al alcanzar el mínimo de 25 %.

Se mantienen zoom con rueda, pinza y teclado, ajuste a pantalla/ancho, arrastre del fondo, botón gris flotante, doble clic y doble toque para maximizar/restaurar. No se habilita historial ni botón Atrás como salida de pantalla completa. Las barras nativas duplicadas se ocultan en la prueba; permanece la barra vertical del maestro. Los controles `adc43Zooms` siguen conservados en el código original, inactivos/ocultos al utilizar el VPI.

Una protección local adicional bloquea gestos sobre selección de texto, sugerencias y acciones de fila; el VPI ya protege inputs, textareas, selectores, botones y enlaces. No se duplica el motor de gestos ni se agregan observadores a los del adaptador existente. Los campos mantienen apariencia de documento en modo oscuro; barras y avisos adoptan el tema.

Se corrigió exclusivamente en la prueba un problema real de impresión: el selector histórico que oculta hermanos de `.dj02-preview` ocultaba también el contenedor nuevo. La regla local permite atravesarlo y recupera el zoom de impresión histórico de las páginas, independientemente del zoom visual. No se cambian coordenadas ni plantillas.

## D. Archivos de esta etapa

- `assets/js/tramites/mis-tramites2-documentos.js`: activación aislada y protección local.
- `assets/css/tramites/mis-tramites2.css`: estilos limitados a la prueba y compatibilidad de impresión.
- `tests/dj02-vpi-prueba.test.cjs`: ciclo funcional y comparación de salida.
- Este informe, referencia en `mt2-visor-compartido.md` y mapa/inventario regenerados.

No se modificaron en esta etapa `visor-pdf.js`, `dj02-registro.js`, formularios modelo, DJ-01, DL-01, autenticación, sincronización o Supabase. Se preservaron sus cambios locales previos.

## E. Vista local

`http://127.0.0.1:8913/adc/index.html?adc-preview=1&adc-inicio=1&adc-motor01=incapacidad&adc-dj02-vpi=1`

Entrar en Mis Trámites 2 y abrir DJ-02. Quitar `adc-dj02-vpi=1` vuelve al recorrido previo. Este parámetro no publica la prueba ni omite autenticación real.

## F. Pruebas y resultados

La prueba dedicada aprobó con datos ficticios: 22 antecedentes, una solicitud pendiente de DL-01 y una licencia manual agregada. Verifica edición, multipágina, zoom sin cambios de persistencia, maximizar/restaurar, doble clic, doble toque, rueda, pinza simulada, teclado y arrastre real con mouse. Comprueba protección de campos, confirmación, eliminación, restauración, filtro institucional, guardado, cierre y reapertura. Genera capturas en 390 px oscuro y 1440 px claro.

La salida PDF de impresión se compara con el recorrido anterior del proyecto actual utilizando exactamente el mismo registro: coinciden cantidad de páginas, dimensiones y texto por página. No es una comparación binaria ni píxel a píxel contra el monolito histórico. No se corrigen aquí los criterios de paginación existentes del modelo.

También aprobaron seis pruebas relacionadas de adaptadores MT2, búsqueda/asistente, piloto MOTOR-01 y generación DL-01 desde el popup de enfermedad. Se ejecutan arquitectura y comprobación de formato. Los resultados son locales en Chromium; el tacto se simuló, sin dispositivo físico, Supabase remoto o publicación. Capturas y PDF se guardan en un temporal con datos ficticios.

## G. Pendientes

Revisión y aprobación del propietario antes de sustituir el recorrido habitual; prueba en dispositivo táctil físico y comparación exhaustiva de impresiones reales. La auditoría de paginación histórica y el contrato completo MOTOR-01 siguen fuera del alcance de esta prueba.

## H. Riesgos compartidos y cierre

Cambiar gestos o DOM del VPI compartido podría afectar otros formularios; no se hicieron tales cambios. Cualquier modificación futura que los afecte requiere la autorización prevista en el archivo de instrucciones. Se mantuvieron almacenamiento, motores y controles anteriores. **Detenerse después de esta primera prueba; no integrar ni sustituir automáticamente.**
