# Sincronización de datos por cuenta — implementación local de staging

## Estado y activación

El código está implementado y se prueba con fixtures locales. **No se aplicó la migración al Supabase remoto, no se publicaron cambios ni se subieron datos reales.** Antes de habilitarlo en un entorno real debe revisarse y aplicar `supabase/migrations/202611140001_adc_user_records.sql`. El navegador nunca aplica migraciones. Si falta la tabla, se informa y se conserva el funcionamiento local.

No ejecutar un reset ni modificar los datos existentes para instalar esta función. Las migraciones anteriores de perfiles mínimos siguen siendo válidas. El cliente oficial se mantiene único en `servicios/supabaseClient.js`; `supabase-runtime.js` es una salida de `npm run build`.

## Inventario y clasificación previa

Se revisaron las llamadas de almacenamiento en perfil, inicialización, calendarios, catálogos, formularios especializados, formularios genéricos y editor. No se leyeron datos personales reales para esta auditoría.

| Categoría | Claves lógicas existentes | Tratamiento |
| --- | --- | --- |
| Perfil, instituciones, cargos, horarios, traslados y copias DJ-01 | `adc_v08` | Se sincroniza como agregado versionado; conserva su JSON y reglas actuales. Puede incluir datos sensibles dentro de historiales. |
| Historial de licencias, pendientes DL-01 y DJ-02 | `adc_dj02_v1` | Se sincroniza; incluye motivos de licencias y requiere consentimiento sensible. |
| Borradores especializados | `adc-sc01-borrador-v1`, `adc-bd02-borrador-v*`, `adc-ol01-draft-*`, `adc-ol01-mnc-*` | Se sincronizan por clave y contexto, sin alterar campos/MNC. |
| Catálogo de formularios, incluidos respaldos anteriores de BD-02 | `adc-official-form-*-draft-v1` | Se sincroniza cada borrador por separado. |
| Documentos/adjuntos de trámites | `adc_documentos_tramite_v1` | Se sincroniza con consentimiento explícito; límite de 2 MiB por registro. Los excesos se conservan y se informan como copia parcial. |
| Datos persistentes de DJ-01 | `adc_dj_institution_order`, `adc_dj_presented_at`, `adc_dj_page2_details`, `adc_v091618_ack` | Se sincronizan; no se cambian sus formatos. |
| Calendario personal y cierres/agregados del calendario de solicitudes | `adc_calendar_2026_personal_v1`, `adc.calendar.v1` | Se sincronizan. Las bases de feriados del código siguen siendo recursos del proyecto. |
| Frecuencia de trámites, zoom, anchos, editor principal y sus respaldos | `adc_v07_usage`, `adc_dj_side_width_19g`, `adc_dj_zoom_mode_19g`, `adc-design-*`, `adc-project-backup-*` | Se separan por cuenta localmente; no se suben. Pueden contener notas o imágenes: no se confunden con datos clínicos compatibles del formulario. |
| Tema visual | `adc_theme`, `adc-login-theme` | Preferencia del dispositivo, no se sincroniza. |
| Diseño público y editor de la pantalla de ingreso | `ajustes-pagina.json`, `adc-login-*` | Configuración del proyecto/dispositivo, no registro del docente ni sincronización. No colocar información personal en el diseño público. |
| Autenticación, propiedad anterior y metadatos de sincronización | `adc-supabase-auth`, `adc-auth-local-owner`, `adc-user-v1:*`, contexto en `sessionStorage` | Tokens nunca se copian a la tabla. Metadatos/candidatos/respaldos permanecen locales y separados por cuenta. |
| Estado temporal no guardado | selección de solapa, foco, URLs Blob, PDFs generados, campos todavía no persistidos por el formulario | No se sincroniza; no se inventa una persistencia nueva para cada interacción temporal. |

Claves desconocidas quedan fuera de la sincronización hasta clasificarlas. El calendario de otro año deberá incorporarse explícitamente si aparece una clave nueva. El permiso cubre las categorías indicadas, incluidos formularios futuros compatibles con el patrón de borrador, no preferencias ni claves de autenticación.

## Almacenamiento local y cuentas

`almacenamiento-usuario.js` es una fachada explícita usada por los módulos de datos. **No modifica `Storage.prototype` ni reemplaza globalmente `localStorage`.** En modo demo conserva el contrato anterior. En modo Supabase guarda cada registro en `adc-user-v1:<uid>:record:<clave>` con valor original, revisión local, revisión remota base y marca pendiente, en una sola escritura local.

Se adaptaron únicamente los accesos de persistencia de los formularios especializados; no sus plantillas ni sus reglas. Los modelos clásicos se reinician con una recarga al cambiar de identidad o hidratar datos remotos, antes de levantar la guardia visual. Un evento de cambio de cuenta bloquea la edición inmediatamente. Un refresco de token de la misma cuenta no reinicia la pantalla.

Las claves antiguas se mantienen intactas. Si ya tienen un propietario registrado, sólo esa cuenta puede usarlas/importarlas desde la interfaz. Si no tienen propietario, no se muestran como datos de una cuenta hasta que el usuario confirme que le pertenecen. No se puede inferir de forma fiable quién creó datos anónimos. Se ofrece usarlos sólo localmente o importarlos a la nube. Cambiar a otra cuenta abre su espacio propio, sin exigir borrar datos de la anterior.

La separación local es de aplicación, no cifrado ni aislamiento frente a una persona con acceso al perfil de Chrome, a herramientas de desarrollo o a código malicioso del mismo origen. Los originales sin cifrar se conservan por pedido del usuario. Para un equipo físicamente compartido se necesitan perfiles de navegador/SO separados y una revisión de amenazas adicional.

## Primera importación y consentimiento

El panel **Mis datos / sincronización** explica las categorías, el posible contenido médico/familiar, los adjuntos y el límite por registro. Activar requiere marcar una autorización explícita y pulsar **Autorizar e importar los datos compatibles**. El consentimiento se conserva por cuenta y dispositivo, con versión y fecha; otro dispositivo no empieza a subir cambios locales sólo por iniciar sesión.

**Ahora no** conserva todo localmente y mantiene la opción de decidir después. **Usar mis datos anteriores sólo en este dispositivo** vincula el espacio antiguo con esa cuenta sin habilitar subidas. Nunca se adopta automáticamente el espacio antiguo de otra cuenta.

La importación copia los registros compatibles usando sus mismas claves. Si el espacio anterior y el nuevo difieren, se conservan candidatos y se exige elegir. No se eliminan originales ni se fusionan formularios. El usuario puede recargar para aplicar las copias a los modelos visibles. La importación es idempotente por propietario/clave, compara valores y verifica el contenido mediante relectura remota. No confirma copia completa si hay conflictos, registros no compatibles, límites o errores. Los registros válidos pueden quedar copiados parcialmente; la interfaz informa la diferencia.

No se recuperan datos borrados del navegador. Un registro no importado no aparece mágicamente desde otro dispositivo.

## Datos remotos, versiones y conflictos

`adc_user_records` guarda una fila por propietario y clave de documento, con `schema_version`, `revision`, JSON que contiene el valor serializado original, marca de borrado y fecha de servidor. La revisión no la elige el navegador: se incrementa mediante trigger. Los borrados de aplicación son tombstones para evitar resurrecciones desde otro dispositivo.

`adc_sync_put` usa la revisión base esperada: inserta sólo cuando no existe la fila, o actualiza sólo si la revisión coincide. Devuelve `40001 / ADC_SYNC_CONFLICT` ante una carrera. El perfil sigue siendo un agregado porque contiene relaciones e identificadores de cargos; las ediciones concurrentes de sus campos se resuelven por documento, no con una fusión automática de campos. El resto de los formularios se escribe independientemente, sin reemplazar una única bolsa global de datos.

La RPC usa `security invoker`. La tabla activa y fuerza RLS; SELECT/INSERT/UPDATE/DELETE tienen políticas del propietario `auth.uid()`. Los permisos de columna impiden cambiar propietario, clave o revisión directamente. La función sólo usa el UID autenticado; no recibe un propietario elegido por el cliente. No se utiliza `service_role` ni un token de gestión. Cada petición fija el JWT previamente verificado para que un cambio de sesión durante una operación no envíe datos de A con las credenciales nuevas de B.

Al ingresar se leen los registros de la cuenta. Se hidratan sólo cuando no existen cambios locales en conflicto; si cambian los datos cargados, se recarga antes de mostrar la aplicación. Durante la edición no se sustituyen silenciosamente modelos activos. Las actualizaciones remotas se presentan para revisión, con comparación y descarga de ambas versiones completas. Se puede elegir Supabase o conservar la versión local; se respalda la alternativa y la siguiente escritura vuelve a comprobar la revisión. Una carrera adicional produce otro conflicto, no un overwrite forzado.

Dos pestañas sobre el mismo almacenamiento también detectan revisiones locales distintas y conservan un candidato en vez de perder la edición. Los respaldos de resolución permanecen locales.

## Estado, red y límites

La barra diferencia guardado local, pendiente, verificado, conflicto y error. Las escrituras locales son durables aunque falle la red. Se reintenta al volver la conexión, al guardar nuevos cambios o con **Comprobar y sincronizar ahora**. Los datos ya presentes se comparan antes de volver a escribir. **Pausar** detiene nuevas operaciones; una petición que el servidor ya recibió puede terminar, y la copia remota existente no se elimina.

No hay suscripción en tiempo real: se comprueba al ingresar, guardar y solicitar la comprobación. Un ingreso nuevo sin red sigue requiriendo la verificación de sesión que ya exigía ADC; una sesión abierta puede seguir guardando localmente. Es una implementación de staging, no un servicio de respaldo con garantía de disponibilidad.

No hay cifrado de extremo a extremo ni borrado remoto desde este panel. Antes de usar datos reales se deben revisar región/condiciones de alojamiento, retención, acceso administrativo, procedimiento de eliminación, consentimiento y normativa aplicable. No se afirma cumplimiento legal.

## Pruebas

- Fixtures de repositorio: consentimiento, copia idempotente y verificación, segundo dispositivo, dos cuentas, importación anónima/ajena, datos no compatibles, conflictos, carrera CAS, cambios durante operaciones, red, errores de verificación, tombstones y candidatos entre pestañas.
- Chrome con cliente oficial y API simulada: rechazo/aceptación de consentimiento, carga remota, conflicto y elección, error de red, cambio de cuenta en un navegador y fijación del JWT durante un cambio de credencial.
- PostgreSQL PGlite aislado: RLS forzada, cuatro políticas, inserción/lectura/actualización/borrado propios y ajenos, revisión inmutable, CAS, versiones, anonimato y restricciones del esquema.
- Se ejecutan también las regresiones del proyecto, build del cliente y control de arquitectura. No se modifican datos reales en Supabase.

La suite completa pasó 105/105 pruebas. Las comprobaciones focalizadas posteriores de sincronización y autenticación pasaron 12/12 (incluido el control de arquitectura), incluidas fallas de cuota, el arranque con adaptador no disponible y el cambio de cuenta durante la carga inicial. `npm run build`, `architecture:check` y `git diff --check` pasaron. Ninguna verificación requirió modificar Supabase remoto.
