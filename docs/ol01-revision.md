# Revisión local de OL-01

## Cambios

- Los datos del perfil se precargan y las correcciones hechas en el formulario sobreviven a una reapertura. El borrador completo se guarda por contexto en `adc-ol01-draft-*`, sin escribir el perfil ni el historial. Se mantiene el almacenamiento anterior.
- Presentada ante contiene las instituciones del perfil. Una solicitud DL-01 del mismo DNI y motivo puede sugerir una institución sólo si no hay ambigüedad ni instituciones eliminadas. No reemplaza una selección explícita.
- La escuela carga todas sus filas. Los encuadres incompatibles se bloquean e identifican los cargos. El cambio de escuela actualiza filas, encuadre y localidad, conservando el resto de datos aplicables.
- El catálogo activa automáticamente el bloque familiar. El motivo y sus fechas/encuadre permanecen habilitados siempre. Los datos del familiar anulado se conservan en el borrador y se omiten en las salidas.
- La doble diagonal y el grisado terminan en la coordenada vertical 489 del PDF, por encima de Lugar y fecha y la firma. No se modifica el PDF base. La firma permanece vacía.
- Las seis acciones superiores/inferiores comparten la misma validación estricta y generación. La guía reutilizable enumera bloqueos a la izquierda, enfoca el primero y conserva el borde hasta corregir; el pulso dura dos segundos y se elimina con movimiento reducido.
- Las correcciones de perfil tienen un acceso directo y un botón para retomar OL-01.

## Fuentes y límites deliberados

- Se reutilizan `mapping`, las reglas de duelo y el calendario existentes. No se ampliaron las exclusiones legales ni se modificaron otros formularios.
- Familia: códigos 151/152, 155 y 156 y artículos 309-D, 331-E y 340-E provienen de `docs/referencias/nomenclatura-licencias.json`, registros de la página 1. Su condición sigue siendo documental; la aplicabilidad del OL-01 y la antigüedad que corresponda deben confirmarse antes de emitirlo. Una prórroga no titular queda pendiente expresamente.
- Se conserva el alcance anterior para enfermedad común y exámenes en Superior. Para Secundario se conserva únicamente la salida de prueba con marca de no válida para presentar. Los otros motivos con aplicabilidad pendiente bloquean la salida.
- Donación de sangre tiene duración documental de un día: sugiere Hasta igual a Desde y valida la igualdad. Esto no levanta el bloqueo de aplicabilidad pendiente. Duelo conserva su cómputo existente y permite mantener una fecha manual.
- La sugerencia de presentación requiere horarios y cobertura institucional conocida: IES San Fernando Rey, 2026. Fuera de esa cobertura, se explica la falta y se permite completar manualmente. No se confunde el calendario nacional parcial con un calendario institucional completo.
- No se calcula un saldo disponible: el historial no tiene una constancia de integridad anual. Se indica que falta confirmar saldo, antigüedad y licencias registradas. No se inventan días disponibles.
- Las claves de borrador permanecen locales en el navegador/origen, dentro del aislamiento de sesión existente. No se enviaron datos a Supabase ni se modificó su esquema.

## Verificación

Pruebas en Chrome automatizado con perfil e historial ficticios, sin conectarse a servicios remotos: seis acciones con pendientes, foco, pulso y movimiento reducido; sugerencia de escuela inequívoca y ambigua; cambio de institución; cargos compatibles/incompatibles; un día; salto del fin de semana y del feriado del 23/11/2026; conservación de fecha manual; activación/anulación/restauración del familiar y borrador; generación, descarga e invocación de impresión; ausencia de widgets PDF; anchos de celular, tablet y escritorio; acceso desde catálogo y buscador mediante las pruebas de navegación existentes.

Se renderizó el PDF de prueba con Poppler y se cotejó visualmente con el lienzo: datos superiores, dos filas, doble X, localidad/fecha y espacio de firma. Los archivos de inspección están en `.adc-tools/ol01-review/` y no se incorporan a Git.

Pendientes de revisión humana: conformidad visual, impresión física y confirmación normativa de motivos/niveles aún pendientes. No se prueban datos privados ni calendarios institucionales no disponibles. No se realizó commit ni push de esta etapa.

La suite completa ejecutó 98 pruebas: 94 pasaron y cuatro agotaron el tiempo de espera (acceso a Ajustes, reemplazo de fondo SC-01, botones del login y edición inline). Las cuatro pasaron al repetir sus archivos secuencialmente. La ejecución final específica de OL-01 pasó 4/4 pruebas; `architecture:check` y `git diff --check` también pasaron.

El visor PDF nativo de Chrome headless puede capturar el clic posterior a una descarga y no siempre notifica `load`. La prueba de impresión activa el mismo botón con Enter y simula únicamente el evento de carga y la API del diálogo; la validación y la generación/descarga del PDF se ejecutan realmente. Esto no acredita una impresión física ni la apertura del diálogo en el Chrome visible. Se agregó un aviso de recuperación con el enlace de apertura del PDF si el visor no confirma la carga en 15 segundos.

## Archivos de esta revisión

- `assets/js/tramites/ol01.js`: estado, reglas, perfil, filas, borrador, documento y acciones.
- `assets/js/core/validacion-guiada.js` y `assets/css/interfaz/validacion-guiada.css`: guía estricta reutilizable, sin reemplazar la revisión anterior de otros formularios.
- `assets/js/calendario/solicitudes.js`: expone la cobertura del calendario existente para OL-01.
- `assets/css/tramites/ol01.css`: controles de filas y acciones adaptables; no cambia cajas oficiales.
- `tests/ol01-guia.test.cjs`, `tests/ol01-interfaz.test.cjs`, `tests/ol01-perfil.test.cjs` y `tests/formularios-oficiales.test.cjs`: nuevas comprobaciones y adaptación del contrato estricto de OL-01.
- `AGENTS.md` y este informe: reglas de reutilización, fuentes y límites.
