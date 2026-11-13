# Supabase en ADC: staging

Integración local para un grupo previsto de 15–50 testers. No se migran automáticamente los perfiles docentes ni los formularios. Los datos y esquemas de staging pueden cambiar con migraciones; ningún script resetea datos automáticamente.

## Estado y alcance

Estado verificado el 13/11/2026: proyecto **Asistente Docente Chaqueño - Staging**, referencia pública `tdjbpgoelqvuoaydinxo`, creado en organización Free y región São Paulo. Migración aplicada y cuatro políticas RLS verificadas en Supabase. ADC local utiliza ahora `ADC_AUTH_MODE=supabase`.

Actualización del piloto: por autorización expresa se desactivó la confirmación obligatoria de correo y se preparó la URL de GitHub Pages. La recuperación por correo queda temporalmente desactivada y muestra un aviso. Las referencias siguientes a confirmación/SMTP describen el modo habitual que se retomará al conectar correo. Ver [publicación online](publicacion-online.md) para los valores vigentes.

Se probaron dos cuentas QA remotas: ingreso con contraseña, operación sobre perfil propio, bloqueo de lectura y escritura entre usuarios, bloqueo anónimo y login/logout desde Chrome contra el servidor local. Las dos cuentas y sus filas de prueba se eliminaron al finalizar. El correo de confirmación real de un tester no se probó: **SMTP propio sigue pendiente** para abrir la prueba al grupo completo.

El token administrativo utilizado para configurar el proyecto se retiró de `.env.local` después de las verificaciones. Como fue compartido en el chat, se recomienda revocarlo en Supabase; retirarlo del archivo no lo revoca. No es necesario para el funcionamiento normal de ADC.

- Cliente oficial `@supabase/supabase-js` 2.119.0 instalado con npm y fijado en `package-lock.json`.
- Correo/contraseña, registro con confirmación, recuperación, cambio de contraseña y cierre de sesión conectados al SDK. Las pruebas de navegador usan respuestas controladas; no constituyen una prueba contra un proyecto remoto.
- Google sólo se habilita si se configura su proveedor en Supabase y `ADC_GOOGLE_AUTH_ENABLED=true`. Haber iniciado sesión en el panel de Supabase con GitHub no habilita automáticamente Google ni GitHub para los usuarios de ADC.
- Tabla `public.adc_tester_profiles`: `id` vinculado a `auth.users`, nombre opcional de hasta 80 caracteres y fechas administradas por Postgres. No duplica correos, DNI, contraseñas ni licencias.
- RLS y FORCE RLS activadas; SELECT, INSERT, UPDATE y DELETE únicamente sobre el ID autenticado. El usuario no puede cambiar el ID ni las fechas mediante la API.
- Los registros mínimos se crean al primer acceso autenticado. El nombre de prueba se puede actualizar mediante `adcAuth.saveTesterName(...)`; es independiente de Mi Perfil Docente.

## Organización de archivos

```text
.env.local                         # Privado, ignorado por Git
.env.example                       # Variables y guía, sin credenciales
package.json / package-lock.json   # Dependencias reproducibles
assets/datos/config-publica.js      # Sólo URL y clave pública; generado
assets/js/servicios/
  supabaseClient.js                # Fuente modular del cliente oficial
  supabase-runtime.js              # Bundle local para navegador estático
assets/js/acceso/autenticacion.js  # Login, registro y recuperación reales
assets/js/interfaz/sesion.js       # Sesión y cierre en la aplicación
assets/css/acceso/autenticacion.css
supabase/migrations/
  202611130001_adc_tester_profiles.sql
tools/env.cjs / build.cjs / dev-server.cjs
tools/configurar-supabase.cjs      # Administración local, nunca frontend
tools/npm-local.cmd               # npm del entorno actual de Windows
tests/supabase-*.test.cjs
```

## Cuenta, proyecto y credenciales

La cuenta de administración de Supabase puede usar GitHub. No hace falta inventar una contraseña para esa cuenta. La contraseña de la base de datos es distinta: la herramienta de creación genera una aleatoria y la guarda únicamente en `.env.local`, ignorado por Git. Se recomienda conservarla también en un gestor de contraseñas; no en el README ni en un commit.

El código no puede crear recursos remotos hasta tener una sesión de navegador operable o un token de gestión autorizado. No extraer cookies ni contraseñas del perfil de Chrome para resolverlo.

Con un token guardado **sólo localmente** en `SUPABASE_ACCESS_TOKEN`, la herramienta puede crear el proyecto y extraer automáticamente sus claves públicas. Si hay varias organizaciones, indicar `SUPABASE_ORGANIZATION_SLUG`. La creación exige una organización Free y se detiene si el plan no puede verificarse como Free.

```powershell
.\tools\npm-local.cmd run supabase:create
# Esperar a que el proyecto esté listo en el panel.
.\tools\npm-local.cmd run supabase:check
.\tools\npm-local.cmd run supabase:configure
```

`supabase:create` intenta reutilizar el staging por nombre/referencia, evita duplicados y nunca imprime la contraseña. `supabase:configure` aplica la migración sólo si falta la tabla, comprueba las cuatro políticas y sus expresiones, configura redirecciones locales con confirmación de correo y escribe `SUPABASE_URL`/`SUPABASE_ANON_KEY` en `.env.local`. La consulta administrativa usa una API de gestión documentada como experimental: si cambia o no está disponible, aplicar la migración desde SQL Editor o con Supabase CLI. No ejecutar un reset para resolver un error.

Alternativa sin token de gestión:

1. Crear un proyecto dedicado llamado **Asistente Docente Chaqueño - Staging**, en organización Free; elegir una región cercana, como São Paulo si está disponible.
2. Ejecutar la migración SQL en el SQL Editor del proyecto.
3. Copiar desde **Connect / API Keys** la URL base y la clave **publishable** (recomendada) o **anon** a `.env.local`.
4. Cambiar `ADC_AUTH_MODE=supabase` y ejecutar `build`.
5. En Auth configurar Site URL `http://127.0.0.1:8765` y permitir `http://127.0.0.1:8765/**` y, si se usa, `http://localhost:8765/**`. Conservar confirmación de correo y ajustar la política de contraseñas al mínimo de 12 caracteres de la interfaz.

No pegar tokens de gestión, `service_role`, claves `sb_secret_...` ni contraseñas en el código del navegador. El generador rechaza estas claves. La clave publishable/anon es pública por diseño; la autorización de los datos depende de RLS.

## Ejecutar localmente

En este equipo se preparó npm local porque npm no estaba en PATH:

```powershell
cd C:\PaginaDocente
.\tools\npm-local.cmd run build
.\tools\npm-local.cmd run dev
```

Con Node.js/npm instalados normalmente pueden usarse `npm ci`, `npm run build` y `npm run dev`. Abrir `http://127.0.0.1:8765/ADC_Ingreso_Editable.html`. Mantener ese origen para conservar los borradores; localhost y 127.0.0.1 tienen almacenamientos separados.

El servidor sirve sólo recursos web y bloquea `.env`, `.git`, `tools`, `tests`, `node_modules`, `supabase` y enlaces fuera de la carpeta. No volver a servir la raíz del proyecto con `python -m http.server`: permitiría descargar archivos administrativos y variables locales. Sólo puede haber un servidor en el puerto 8765.

## Modos y sesiones

- `ADC_AUTH_MODE=demo`: conserva la revisión actual sin cuenta. No representa una conexión real a Supabase. El generador rechaza combinar este modo con claves configuradas.
- `ADC_AUTH_MODE=supabase`: requiere claves válidas y sesión verificada con Supabase. `adc-preview=1` no evita esa comprobación. Si falta la conexión o la tabla, la aplicación permanece bloqueada con un mensaje.
- El servidor de desarrollo no necesita un backend privilegiado para las operaciones del usuario: el SDK usa su JWT y RLS. `.env.local` no se lee desde el navegador; `build` genera únicamente las variables públicas.
- Las contraseñas de los testers no se guardan en tablas ni en almacenamiento propio de ADC. El SDK administra la sesión y renovación en el navegador.
- Antes de usar borradores históricos se pide asociarlos explícitamente a la cuenta. Si el dispositivo está asociado a otra cuenta, se bloquea la vista y se indica usar otro perfil de Chrome. Cerrar sesión conserva los borradores del propietario.
- Esta protección de interfaz no cifra localStorage ni convierte los archivos HTML/PDF públicos en recursos privados. RLS protege los registros de Supabase; los documentos locales siguen en el dispositivo.

## Preparar a los testers

Probar primero registro, confirmación en el mismo navegador (PKCE), ingreso, cierre y recuperación. La recuperación usa la URL de ingreso con `?flow=recovery`. No quitar la confirmación de correo para ocultar un problema de SMTP o de redirecciones.

Para 15–50 personas, verificar la configuración de entrega de correo/SMTP y los límites del proveedor antes de invitar al grupo. El número 50 es el alcance previsto, no una cuota implementada automáticamente. Después de la prueba inicial, considerar registro por invitación y cerrar el registro público en Auth si corresponde.

Antes de publicar en GitHub Pages, agregar su URL exacta al allowlist de Auth, generar la configuración pública de staging y verificar el flujo online. GitHub Pages no lee `.env.local` por sí solo. Nunca subir ese archivo ni el token administrativo. Conservar los cambios en `log-in` hasta aprobarlos.

## Verificaciones

`npm run test:auth` ejecuta:

- validación de variables públicas y rechazo de claves privilegiadas;
- SDK oficial en Chrome con API simulada: registro, error de credenciales, login, recuperación, cambio de contraseña, perfil mínimo, logout y aislamiento de cuenta local;
- migración sobre PostgreSQL WASM aislado con roles reales: dos usuarios, anon, acceso sin JWT, privilegios de columnas, políticas RLS y borrado en cascada.

La prueba remota requiere el proyecto configurado. No confundir una prueba local aprobada con haber creado o desplegado la base de datos en Supabase.

Referencias: [cliente JS](https://supabase.com/docs/reference/javascript/auth), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [claves públicas y secretas](https://supabase.com/docs/guides/getting-started/api-keys), [usuarios y perfiles](https://supabase.com/docs/guides/auth/managing-user-data), [Management API](https://supabase.com/docs/reference/api/introduction).
