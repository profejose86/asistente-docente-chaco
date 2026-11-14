# Cierre de sincronización y acceso — 14/11/2026

El usuario aprobó la sincronización entre PC y celular y autorizó reunir los cambios pendientes, integrar en `main`, hacer push a `origin/main` y aplicar las dos migraciones a Supabase de producción sin borrar ni reiniciar datos.

## Cambios incluidos

- Aislamiento local por cuenta, consentimiento explícito, primera importación idempotente y conservación de los originales del navegador.
- Sincronización versionada por documento, control de concurrencia, conflictos revisables, copia local sin conexión y estado visible de guardado.
- Autoguardado del Perfil Docente desde los controles reales. La corrección se verificó escribiendo Anabella, recargando y entrando desde otra sesión; el usuario la comprobó también desde su celular.
- Advertencia de contraseña exclusiva ADC en ingreso, registro y cambio de clave. Modo claro ámbar y modo oscuro con gradiente rosa giratorio; soporte de movimiento reducido.
- Configuración y guía de OAuth Google y SMTP separadas para staging. Ambas funciones continúan desactivadas mientras no existan las credenciales requeridas y pruebas reales.
- Cambios pendientes de catálogo y documento Reubicación incluidos en el primer commit de la rama, sin sustituir los formularios protegidos.
- Pruebas de sincronización, RLS y controles de staging agregadas al conjunto de CI de publicación. Recuperación por correo desactivada por defecto en Pages si no hay una variable explícita que la habilite.

## Supabase de producción

Proyecto: `tdjbpgoelqvuoaydinxo`. El staging separado conserva su proyecto `wpjypfxmtgodllkchgzi` y no se intercambian claves ni cuentas entre ellos.

Se aplicaron `202611140001_adc_user_records.sql` y `202611140002_adc_sync_conflict_http.sql`. Se verificaron columnas, RLS activada y forzada, las cuatro políticas exclusivas de `authenticated` con propietario `auth.uid()`, RPC con seguridad invoker y conflictos `PT409`. El conteo de perfiles existentes se mantuvo en cuatro antes y después. Las migraciones no escriben datos en esos perfiles ni suben el almacenamiento de los navegadores.

La sincronización requiere la autorización del usuario en cada dispositivo. Las personas con datos anteriores deben aceptar la importación; no se copian automáticamente por publicar esta versión. La revisión de privacidad y retención de datos sensibles sigue pendiente; no se afirma cumplimiento legal ni cifrado de extremo a extremo.

## Verificaciones de cierre

- Suite completa: 111/111 pruebas aprobadas; ninguna fallida ni omitida.
- CI de publicación ampliada: 22/22 pruebas aprobadas.
- `npm run build`, `npm run architecture:check` y `git diff --check`: aprobados.
- Revisión previa de las variables de GitHub: Pages publica `main`, apunta al Supabase de producción y mantiene Google y recuperación por correo desactivados.
- Los secretos, cuentas ficticias y credenciales administrativas permanecen únicamente en archivos locales ignorados; no se incluyen en los commits ni en el paquete web.

La rama de pruebas y el Site privado se conservan como referencia. No se eliminan automáticamente con esta integración. Las guías anteriores describen la etapa de staging; este documento registra la autorización posterior de producción.
