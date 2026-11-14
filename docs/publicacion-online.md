# Publicación online de ADC · Piloto

URL: https://profejose86.github.io/asistente-docente-chaco/

La publicación unificada utiliza **main**, que incorpora todos los cambios aprobados de `log-in` y `log-in-2`. Se conserva Supabase real y el registro directo sin confirmación de correo por decisión explícita del responsable. Cambiar la rama no cambia las cuentas, RLS ni los borradores. No se necesita SMTP para crear cuentas o ingresar en este modo.

## Flujo de publicación

1. Trabajar y revisar en `main`. Crear una rama futura sólo por pedido del usuario.
2. Ejecutar pruebas locales. `npm run test:ci` verifica configuración, RLS y preparación del artefacto; las pruebas de interfaz se ejecutan localmente con Chrome.
3. `npm run build:pages` compila y prepara `dist/` con sólo las entradas HTML y `assets/`.
4. Commit y push autorizados a `main` disparan `.github/workflows/pages.yml`.
5. GitHub Actions instala dependencias reproducibles, ejecuta las comprobaciones, construye el artefacto y publica en Pages. Las versiones de las acciones oficiales están fijadas por commit.
6. Verificar la ejecución y `build-info.json`, además de probar el ingreso en la URL pública.

El archivo `config/publicacion.json` centraliza repositorio, URL y `publishingBranch: main`. La variable del repositorio es `ADC_PAGES_BRANCH=main` y el workflow recibe pushes sólo de `main`. Se conserva `environment: staging` como configuración del piloto de autenticación; esta consolidación no convierte ni resetea la base de datos.

## Configuración pública de GitHub

Variables del repositorio, sin contraseñas ni claves privilegiadas:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (publishable/anon)
- `ADC_PAGES_BRANCH=main`
- `ADC_EMAIL_CONFIRMATIONS_REQUIRED=false`
- `ADC_PASSWORD_RECOVERY_ENABLED=false`

La compilación exige `ADC_AUTH_MODE=supabase`. Si faltan las claves públicas, falla y no publica accidentalmente el modo demo. `ADC_GOOGLE_AUTH_ENABLED=false` conserva Google sin activar hasta configurar ese proveedor.

El artefacto excluye `.env*`, `.git`, herramientas, dependencias, pruebas y migraciones SQL. Se rechazan enlaces simbólicos y coincidencias con credenciales privadas presentes en las variables locales. Los recursos HTML llevan una versión basada en el contenido para evitar mostrar scripts antiguos por caché.

## Supabase y registro sin correo

- Site URL: `https://profejose86.github.io/asistente-docente-chaco/`.
- Se permiten los callbacks de `ADC_Ingreso_Editable.html`, su variante de recuperación y las URLs locales para desarrollo.
- La confirmación por correo está desactivada **sólo para el piloto**. Una cuenta no acredita que su usuario sea dueño de la dirección que escribió.
- RLS continúa exigiendo el UUID autenticado y no otorga privilegios por correo, dominio ni nombre.
- Recuperación por correo desactivada: el botón informa que el administrador debe ayudar. No simula el envío de mensajes. Un restablecimiento manual futuro requiere comprobar la identidad del solicitante.
- El SDK maneja contraseñas/sesiones; ADC no guarda contraseñas de testers en tablas propias.
- La tabla remota inicial guarda sólo el ID, nombre opcional de tester y fechas. Mi Perfil Docente, instituciones y borradores actuales siguen en el navegador; no se sincronizan automáticamente entre dispositivos.

## Operaciones de configuración

`npm run supabase:online` prepara Auth y los callbacks online usando una credencial administrativa guardada sólo en `.env.local` o en el entorno del proceso. En este equipo puede usarse `tools\npm-local.cmd run supabase:online`. No colocar el token en GitHub Actions ni en el código público.

Para habilitar correo más adelante, completar localmente todas las variables `SMTP_*` de `.env.example`, volver a activar `ADC_EMAIL_CONFIRMATIONS_REQUIRED=true` y `ADC_PASSWORD_RECOVERY_ENABLED=true`, aplicar la configuración y actualizar las variables públicas de GitHub antes de publicar. Ningún script desactiva RLS ni resetea las tablas.

Antes de pasar de piloto a un uso estable: configurar correo, validar confirmación y recuperación con personas reales, revisar el acceso del grupo y decidir explícitamente qué datos docentes se sincronizarán. El límite de 50 es el alcance operativo del piloto, no una cuota automática implementada en Auth.

## Verificaciones y recuperación

Después de publicar, comprobar:

1. `build-info.json` corresponde al commit y a `main`.
2. La portada dirige al ingreso; `adc-preview=1` no salta la sesión real.
3. El registro nuevo abre ADC sin exigir correo, y cerrar sesión vuelve al ingreso.
4. Una cuenta no accede a datos de otra; el navegador avisa si conserva borradores de otro propietario.
5. Los formularios, su PDF y las herramientas de Ajustes siguen abriendo desde el catálogo.
6. `.env.local`, `tools/` y las migraciones no están presentes en el sitio publicado.

Si un despliegue falla, el anterior permanece disponible. Corregir el error y ejecutar de nuevo el workflow; no cambiar a modo demo para ocultarlo ni forzar un push sobre la historia. Para volver a una versión anterior, revisar un revert o republicar un commit aprobado sin borrar ramas o datos.
