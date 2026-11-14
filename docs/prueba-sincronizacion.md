# Prueba aislada de sincronización

## Preparación online separada

El código aprobado quedó guardado en el commit `5fdd103` de `pruebas/sincronizacion`. No se integró en `main` ni se cambió GitHub Pages.

Se registró un Site independiente, aún **sin desplegar**: su identidad y dirección prevista están en `config/sincronizacion-staging.json`. Una dirección prevista no prueba que exista una publicación funcional. El Site comienza con acceso privado del propietario.

`npm run staging:sync:provision` requiere un token administrativo vigente en `SUPABASE_ACCESS_TOKEN` dentro de `.env.local`. Crea o recupera por nombre un proyecto de prueba exclusivamente en una organización Free, rechaza las referencias de producción, aplica las dos migraciones solamente allí y comprueba RLS. Si el proyecto aún inicia, informa su estado y permite continuar sin duplicarlo. Guarda su estado, referencia y contraseña de base únicamente en `.env.sync-staging.local` (ignorado por Git); no modifica las variables de producción. No utiliza service_role.

La confirmación por correo se deshabilita sólo en el nuevo staging para permitir cuentas ficticias. No se configura SMTP ni se envían datos personales reales. `npm run staging:sync:prepare` genera la copia de publicación en `.adc-tools/sync-staging-site/dist`, con configuración pública exclusiva de staging y un aviso visible. No ejecuta el build de producción ni cambia sus archivos generados. Luego falta desplegar esa copia mediante Sites y probar cuentas reales de Auth de staging, no los tokens simulados del sandbox.

Al preparar esta etapa no había token administrativo guardado y el host de acceso al navegador estaba desconectado. Por eso no se creó todavía el proyecto Supabase remoto, no se desplegó el Site y no se ejecutaron pruebas online. La comprobación local del bloqueo de producción está en `tests/sync-staging.test.cjs`.

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
