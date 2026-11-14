# Prueba aislada de sincronización

Rama local: `pruebas/sincronizacion`. No se integra en `main` hasta la aprobación visual y funcional. Los cambios pendientes anteriores se conservaron sin commit.

## Iniciar

Ejecutar `npm run dev:sync-sandbox` y abrir **http://127.0.0.1:8877/**. Si Node/npm no están en PATH, usar `tools\npm-local.cmd run dev:sync-sandbox`.

Este servidor escucha únicamente en loopback. Sirve la aplicación actual con una configuración pública de prueba generada en memoria; no modifica `config-publica.js`, no lee `.env`, no ejecuta build ni aplica migraciones remotas. Una política CSP restringe las conexiones del navegador al mismo origen. No publica en GitHub Pages.

La base es PostgreSQL PGlite descartable en memoria. Ejecuta la migración real y sus políticas RLS con el rol `authenticated`. El adaptador HTTP local simula las rutas necesarias de Supabase Auth/PostgREST; el frontend conserva el cliente oficial existente. Las cuentas Ana y Bruno son fixtures sin contraseñas reales. **No es una prueba de Supabase alojado, SMTP, OAuth ni endurecimiento del proveedor de autenticación.** No ingresar datos personales reales.

## Recorrido

1. Entrar como Ana (A). Se prepara un perfil ficticio local. Rechazar la importación: no debe subirse nada. Luego abrir «Mis datos / sincronización», leer el aviso y autorizar.
2. Abrir la misma dirección en incógnito o un perfil distinto de Chrome y entrar como Ana. Debe recuperar el perfil de la base de prueba. Autorizar sincronización en ese dispositivo si se quiere guardar cambios desde allí.
3. Entrar como Bruno (B): debe tener su propio perfil y no acceder al de Ana. Las cuentas están separadas por namespace local y RLS remota.
4. Para probar conflicto: pausar sincronización en ambas sesiones de Ana, editar el mismo dato en ambas, reactivar primero una y luego la otra. La segunda debe pedir elegir, conservando ambas versiones.
5. Las pruebas automatizadas adicionales simulan cortes de red, errores de guardado, importación repetida y cambios de identidad durante operaciones.

Usar siempre el mismo host (`127.0.0.1`); `localhost` es otro origen de almacenamiento. Las cuentas sólo existen en este sandbox. Al detener el proceso se pierde la base remota ficticia; los borradores locales del origen permanecen. Para repetir desde cero, usar perfiles temporales nuevos. No borrar el almacenamiento de la aplicación de producción.

## Validación y siguiente etapa

`npm run test:sync` ejecuta pruebas con fixtures, navegador y PostgreSQL local. Esta etapa no crea proyecto Supabase ni publicación remota. Una validación online posterior requiere un proyecto Supabase de staging independiente, configuración de build específica y un despliegue de preview separado de GitHub Pages de producción. La rama por sí sola no aísla una base de datos.

Resultados del 14/11/2026: suite focalizada inicial 11/11; verificación adicional del sandbox HTTP y recorrido Chrome contra PGlite 2/2. Se verificaron importación autorizada, recuperación en un contexto limpio, cuenta B separada, RLS y CAS. Capturas locales de evidencia: `.adc-tools/sync-ana-segundo-dispositivo.png` y `.adc-tools/sync-bruno-aislado.png` (ignoradas por Git, sin datos reales). El control de arquitectura pasó, sin referencias ausentes.
