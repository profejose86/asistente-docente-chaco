# Cliente Supabase

El cliente oficial `@supabase/supabase-js` 2.119.0 está fijado en `package-lock.json`. `tools/build.cjs` lo compila junto con `assets/js/servicios/supabaseClient.js` en `supabase-runtime.js` para usarlo sin CDN en la aplicación estática. Licencia MIT adjunta.

No incluye claves de administración. La configuración pública se genera por separado desde `.env.local`.
