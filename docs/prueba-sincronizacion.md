# Prueba aislada de sincronización

## Preparación online separada

El código aprobado quedó guardado en el commit `5fdd103` de `pruebas/sincronizacion`. No se integró en `main` ni se cambió GitHub Pages.

Se publicó un Site independiente: **https://adc-sync-staging-jose-202611.affectionatecarrot8.chatgpt.site/**. La versión 1 quedó desplegada correctamente (Sites confirmó `succeeded`). Su identidad está en `config/sincronizacion-staging.json`. Conserva acceso privado del propietario: ingresar con su cuenta de ChatGPT antes de iniciar sesión en ADC. Las cuentas ficticias y sus claves están únicamente en `.adc-tools/acceso-staging.txt`, ignorado por Git.

`npm run staging:sync:provision` requiere un token administrativo vigente en `SUPABASE_ACCESS_TOKEN` dentro de `.env.local`. Crea o recupera por nombre un proyecto de prueba exclusivamente en una organización Free, rechaza las referencias de producción, aplica las dos migraciones solamente allí y comprueba RLS. Si el proyecto aún inicia, informa su estado y permite continuar sin duplicarlo. Guarda su estado, referencia y contraseña de base únicamente en `.env.sync-staging.local` (ignorado por Git); no modifica las variables de producción. No utiliza service_role.

La confirmación por correo se deshabilita sólo en el nuevo staging para permitir cuentas ficticias. No se configura SMTP ni se envían datos personales reales. `npm run staging:sync:prepare` genera la copia de publicación en `.adc-tools/sync-staging-site/dist`, con configuración pública exclusiva de staging y un aviso visible. No ejecuta el build de producción ni cambia sus archivos generados. Luego falta desplegar esa copia mediante Sites y probar cuentas reales de Auth de staging, no los tokens simulados del sandbox.

Se utilizó el token administrativo que el usuario había proporcionado y autorizado previamente, guardándolo sólo en `.env.local`. Se creó el proyecto separado `wpjypfxmtgodllkchgzi`; no se cambió el proyecto de producción. El control del navegador habitual continuaba desconectado, por lo que las operaciones se hicieron mediante las APIs oficiales y el flujo de Sites.

Las pruebas reales de `tools/sync-staging-verify.cjs` comprobaron registro/login de dos cuentas ficticias, recuperación del perfil, RLS de lectura/inserción/edición/borrado entre propietarios, CAS y tombstones. `tools/sync-staging-browser.cjs` verificó el artefacto de publicación servido localmente en Chrome contra Supabase real, sin mocks: dos contextos limpios de Ana y uno de Bruno, sin errores JavaScript. La publicación hospedada quedó confirmada por Sites; no se automatizó el acceso privado hospedado a través de la puerta de ChatGPT. Falta la comprobación del propietario desde sus dos dispositivos reales.

La prueba online detectó que SQLSTATE `40001` produce reintentos continuos en ciertas versiones de PostgREST. La migración `202611140002_adc_sync_conflict_http.sql`, aplicada sólo en staging, usa `PT409` y mantiene el mensaje `ADC_SYNC_CONFLICT` compatible con el frontend. La prueba online del conflicto pasó tras el cambio. Referencia oficial: https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b . No se debe aplicar únicamente la primera migración al habilitar producción.

Rama local: `pruebas/sincronizacion`. No se integra en `main` hasta la aprobación visual y funcional. Los cambios pendientes anteriores se conservaron sin commit.

## Iniciar

Ejecutar `npm run dev:sync-sandbox` y abrir **http://127.0.0.1:8877/**. Si Node/npm no están en PATH, usar `tools\npm-local.cmd run dev:sync-sandbox`.

Este servidor escucha únicamente en loopback. Sirve la aplicación actual con una configuración pública de prueba generada en memoria; no modifica `config-publica.js`, no lee `.env`, no ejecuta build ni aplica migraciones remotas. Una política CSP restringe las conexiones del navegador al mismo origen. No publica en GitHub Pages.

La base es PostgreSQL PGlite descartable en memoria. Ejecuta la migración real y sus políticas RLS con el rol `authenticated`. El adaptador HTTP local simula las rutas necesarias de Supabase Auth/PostgREST; el frontend conserva el cliente oficial existente. Las cuentas Ana y Bruno son fixtures sin contraseñas reales. **No es una prueba de Supabase alojado, SMTP, OAuth ni endurecimiento del proveedor de autenticación.** No ingresar datos personales reales.

## Recorrido

Corrección del guardado de perfil: la primera versión de staging dependía del botón manual «Guardar perfil», aunque la barra mostraba la última copia remota verificada. `perfil/autoguardado.js` ahora persiste los cambios reales de inputs/selects del perfil al editar y los cambios estructurales de instituciones al pulsar sus controles, sin esperar al debounce remoto. La barra pasa inmediatamente a pendiente y sólo vuelve a verificado después de la comprobación remota. El aviso antiguo de «sin servidor ni cuenta» se sustituye en modo autenticado. El modo demo conserva su contrato anterior.

Regresión comprobada: escribir «Anabella» en `#perfilNombres`, recargar antes del debounce, recuperar desde un segundo contexto limpio y volver a iniciar sesión. También se probó la edición del correo. Las pruebas focalizadas locales pasaron 12/12; Chrome contra Supabase real recuperó Anabella desde otra sesión. La cuenta ficticia A se conserva con ese nombre. La herramienta de verificación remota ya no restablece los perfiles existentes a «Ana/Bruno»: compara con sus valores actuales para conservar las modificaciones de quien prueba.

1. Entrar como Ana (A). Se prepara un perfil ficticio local. Rechazar la importación: no debe subirse nada. Luego abrir «Mis datos / sincronización», leer el aviso y autorizar.
2. Abrir la misma dirección en incógnito o un perfil distinto de Chrome y entrar como Ana. Debe recuperar el perfil de la base de prueba. Autorizar sincronización en ese dispositivo si se quiere guardar cambios desde allí.
3. Entrar como Bruno (B): debe tener su propio perfil y no acceder al de Ana. Las cuentas están separadas por namespace local y RLS remota.
4. Para probar conflicto: pausar sincronización en ambas sesiones de Ana, editar el mismo dato en ambas, reactivar primero una y luego la otra. La segunda debe pedir elegir, conservando ambas versiones.
5. Las pruebas automatizadas adicionales simulan cortes de red, errores de guardado, importación repetida y cambios de identidad durante operaciones.

Usar siempre el mismo host (`127.0.0.1`); `localhost` es otro origen de almacenamiento. Las cuentas sólo existen en este sandbox. Al detener el proceso se pierde la base remota ficticia; los borradores locales del origen permanecen. Para repetir desde cero, usar perfiles temporales nuevos. No borrar el almacenamiento de la aplicación de producción.

## Validación y siguiente etapa

`npm run test:sync` ejecuta pruebas con fixtures, navegador y PostgreSQL local. Esta etapa no crea proyecto Supabase ni publicación remota. Una validación online posterior requiere un proyecto Supabase de staging independiente, configuración de build específica y un despliegue de preview separado de GitHub Pages de producción. La rama por sí sola no aísla una base de datos.

Resultados del 14/11/2026: suite focalizada inicial 11/11; verificación adicional del sandbox HTTP y recorrido Chrome contra PGlite 2/2. Se verificaron importación autorizada, recuperación en un contexto limpio, cuenta B separada, RLS y CAS. Capturas locales de evidencia: `.adc-tools/sync-ana-segundo-dispositivo.png` y `.adc-tools/sync-bruno-aislado.png` (ignoradas por Git, sin datos reales). El control de arquitectura pasó, sin referencias ausentes.
