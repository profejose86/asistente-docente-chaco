# Google y recuperación de contraseña — staging ADC

Estado: el código de Google y de recuperación ya existe y reutiliza `supabaseClient.js`. Faltan las credenciales OAuth y un SMTP propio para habilitar y probar esos servicios. No se activan indicadores públicos para simular una integración inexistente. Producción no cambia.

## Crear las credenciales de Google

1. Entrar con la cuenta Google administradora en https://console.cloud.google.com/ y crear o elegir un proyecto separado llamado **ADC Staging**.
2. Abrir **Google Auth Platform** (o **APIs y servicios → Pantalla de consentimiento OAuth**). Configurar el nombre **Asistente Docente Chaco — Pruebas**, correo de soporte y contacto del responsable.
3. Elegir audiencia **Externa** y mantener el estado **Pruebas**. Agregar como usuarios de prueba los correos Google que se usarán para comprobar el ingreso. Solicitar sólo identidad básica (`openid`, correo y perfil); no acceso a Gmail, Drive ni Calendario.
4. En **Clientes → Crear cliente**, elegir **Aplicación web**. Nombre: **ADC Sync Staging Web**.
5. Si solicita origen JavaScript autorizado, cargar exactamente:

   `https://adc-sync-staging-jose-202611.affectionatecarrot8.chatgpt.site`

6. En **URI de redireccionamiento autorizados**, cargar exactamente:

   `https://wpjypfxmtgodllkchgzi.supabase.co/auth/v1/callback`

   Es el callback del Supabase de staging, no el de producción ni la página de ingreso de ADC.
7. Guardar el Client ID y Client Secret sólo en `C:\PaginaDocente\.env.local`:

   ```dotenv
   ADC_STAGING_GOOGLE_CLIENT_ID=CLIENT_ID.apps.googleusercontent.com
   ADC_STAGING_GOOGLE_CLIENT_SECRET=CLIENT_SECRET
   ```

   No pegarlos en el chat ni agregarlos a Git. El secreto se envía únicamente a la configuración administrativa de Supabase, nunca al navegador.
8. Avisar que están guardados. Se ejecuta `npm run staging:sync:provision`, se verifica el proveedor, se prepara y publica de nuevo sólo el staging. El indicador público de Google se activa únicamente cuando el proveedor está configurado.
9. El propietario completa personalmente el ingreso y consentimiento en Google. Comprobar retorno a ADC, perfil propio, cambio de cuenta y acceso desde otro dispositivo. La puerta privada de ChatGPT del sitio es independiente del login Google de ADC.

Google puede cambiar los nombres de sus menús o pedir información adicional de marca/dominio. Antes de salir del modo de prueba se debe revisar la audiencia, los requisitos de verificación y las páginas públicas de privacidad reales; no inventar esos documentos.

## Olvidé mi contraseña

El flujo implementado envía un enlace y muestra una pantalla para elegir una nueva clave ADC. No muestra ni recupera la contraseña anterior. Mantiene la respuesta genérica para no confirmar qué correos tienen una cuenta.

El correo predeterminado de Supabase restringe destinatarios y tiene límites muy bajos; no se debe habilitar para todos los testers sin un proveedor de correo adecuado. Para habilitarlo en staging, guardar la configuración SMTP entregada por el proveedor:

```dotenv
ADC_STAGING_SMTP_HOST=servidor_del_proveedor
ADC_STAGING_SMTP_PORT=587
ADC_STAGING_SMTP_USER=usuario_smtp
ADC_STAGING_SMTP_PASSWORD=credencial_smtp
ADC_STAGING_SMTP_SENDER_EMAIL=remitente_autorizado
ADC_STAGING_SMTP_SENDER_NAME=Asistente Docente Chaco - Pruebas
```

Se configura exclusivamente el proyecto de staging y las URLs de retorno, incluidas las rutas con y sin `.html` de Sites. La recuperación no se habilita en el paquete web hasta contar con SMTP configurado. Confirmación de registro y recuperación son funciones distintas: desactivar la confirmación de correo no reemplaza el servicio de envío.

Luego probar con un buzón real autorizado: solicitar enlace, verificar entrega y caducidad, abrirlo en el mismo navegador que lo solicitó (flujo PKCE actual), definir una contraseña nueva, comprobar el login y que un enlace usado no vuelva a servir. Las pruebas actuales con API simulada no acreditan entrega de correo real. Las cuentas ficticias `@example.com` no reciben correos.

Quien usa Google inicia sesión en Google; una clave ADC independiente sólo aplica al ingreso con correo y contraseña. Recuperar una contraseña de Google corresponde a Google, no a ADC.

## Advertencia visible

Ingreso, registro y cambio de clave incluyen una leyenda indicando que la contraseña ADC debe ser exclusiva y distinta de la del correo. ADC nunca pide conocer la clave de Gmail. Es una recomendación: la aplicación no puede comprobar si se reutiliza una contraseña externa.

Referencias oficiales: [Google en Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls).
