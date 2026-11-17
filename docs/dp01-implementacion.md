# DP-01 — implementación por etapas

## Alcance autorizado

Trabajo aislado en `pruebas/dp-01`. La rama se creó localmente y en GitHub por autorización del propietario. La publicación de Pages continúa en `main`.

## Flujo de revisión autorizado en staging

El propietario confirmó que el doble clic, el doble toque y la adaptación de pantalla funcionan correctamente en la publicación de prueba. También autorizó que, mientras se trabaje en este staging, cada modificación solicitada se implemente localmente, se verifique y se publique en el mismo enlace de staging como parte de la tarea, sin solicitar otra autorización de publicación por cada cambio. Confirmar el despliegue exitoso antes de indicarle que actualice el navegador. Si una comprobación o publicación falla, informar el estado real y continuar resolviendo el problema.

Esta autorización corresponde al entorno de prueba seleccionado y conserva las restricciones vigentes sobre integración a main, publicación de producción, cambios remotos de base de datos y decisiones administrativas pendientes. Un cambio de alcance o de entorno requiere la autorización que corresponda.

## Etapas 1 y 2

DP-01 activa `smartViewer` y `commonActions` en su registro de documento preparado. Reutiliza el visor de PDF y las acciones existentes. Se conservan PDF, imágenes, coordenadas, fuentes y validaciones. También permanece la excepción autorizada para cubrir el año 2009 impreso en Desde.

Por pedido posterior del propietario, VPI-01 agrega entrada a pantalla completa mediante doble clic o doble toque sobre el fondo del PDF. El visor compartido admite la opción `doubleActivateFullscreen`, habilitada exclusivamente para DP-01. Los campos, controles y el editor visual conservan su interacción. El doble toque descarta arrastres, pulsaciones prolongadas y pinzas; el gesto abre la vista, y los controles existentes permiten salir. La alternativa de pantalla ampliada se conserva si el navegador no permite pantalla completa nativa. Esta ampliación sigue local hasta una nueva publicación.

El borrador conserva su clave histórica `adc-official-form-dp01-draft-v1`. Guardar usa el almacenamiento de usuario existente. El estado mostrado confirma el guardado en el dispositivo. La limpieza confirmada genera un borrador nuevo del mismo formulario y precarga los datos disponibles del perfil. Si falla la escritura, restaura el estado anterior en memoria.

## Decisiones pendientes antes de la etapa 3

### Criterio aprobado para auditar MNC

El 17/11/2026 el propietario aprobó para Observaciones de DP-01 la confirmación al anular contenido y su recuperación al desmarcar. Este comportamiento sigue pendiente de implementación y pruebas. La conversación posterior solicita conservarlo como referencia para futuras auditorías individuales. La aplicación a otros formularios se resolverá en su alcance correspondiente.

En cada auditoría comprobar y presentar el estado de cada punto como implementado y probado, parcial, pendiente o no aplicable, con referencias al código y pruebas realizadas:

- Permisos MNC explícitos por campo, respetando obligatoriedad, radios, selección y casilleros de dígitos.
- Marcado directo de campos permitidos vacíos.
- Si un campo permitido tiene contenido, confirmación antes de anular. Cancelar conserva el texto y el estado original.
- Confirmar retira el texto visible y guarda el valor anterior para poder recuperarlo al desmarcar, sin superponer texto y línea.
- Desmarcar recupera el valor anterior cuando sea seguro, permite editar y restaura la obligatoriedad correspondiente.
- El borrador conserva tanto la marca como el valor recuperable. Recargar y cambiar de cuenta mantienen el aislamiento existente.
- Autocompletado y sincronización conservan la decisión MNC y detectan conflictos sin sobrescribir silenciosamente.
- Pantalla, vista preliminar, PDF e impresión conservan la línea negra centrada al 70 % con grosor de 0,5 mm.

Cuando falte una capacidad, explicar al propietario qué hace, qué formulario la tiene efectivamente implementada y qué requiere su incorporación. DP-01 sólo podrá presentarse como referencia implementada para confirmación y recuperación después de completar y probar ese trabajo.

- Aprobar por campo los permisos MNC y cualquier cambio de obligatoriedad. La tabla completa se presentó al propietario en la conversación.
- Confirmar el significado administrativo de Notificación, Aclaración y los campos de motivo e instrumento legal.
- Definir un mecanismo adecuado de verificación del titular. La sesión autenticada y la coherencia con el perfil declarado actualmente no acreditan por sí mismas la identidad legal.
- Comprobar un mecanismo autorizado para ofrecer actualización de datos no críticos del perfil. Los identificadores protegidos requieren otro procedimiento.

## Etapa 4 pendiente

El panel real de Interinos ofrece tarjetas, contador, foco y bandeja móvil. El resaltado al navegar, la categoría de sugerencias y la verificación de identidad solicitada requieren tratamiento exclusivo de DP-01, después de resolver las decisiones anteriores. La referencia permanece intacta.

## Verificaciones

`tests/dp01-experiencia.test.cjs` utiliza Chrome sin interfaz y datos ficticios. Comprueba límites y teclado del zoom, rueda, barra vertical única, acciones superiores e inferiores, persistencia tras recarga, limpieza cancelada y confirmada, conservación del perfil y otro documento, fallos de escritura, ausencia de descargas al guardar, anchos de 390 y 1440 píxeles y activación exclusiva del visor. Genera capturas ignoradas por Git en `.adc-tools/dp01/` para inspección visual.

Las pruebas de referencia cubren gestos táctiles, pantalla completa y salida PDF. La suite de formularios incluye la exportación de DP-01. Estas comprobaciones usan fixtures locales y no acceden a Supabase real. La comprobación de impresión automatizada no acredita una impresión física. Queda pendiente la revisión visual del propietario y la prueba manual en sus dispositivos.

## Vista online de las etapas 1 y 2

El propietario autorizó publicar la prueba el 17/11/2026. Se actualizó el sitio privado de staging existente, con su configuración pública de Supabase de staging y su aviso de datos ficticios. Sites confirmó despliegue exitoso `appgdep_6afc37dab44c81918f163bbf4e8fe714`, desde la copia de publicación `45e3e60b27b5caa829272c412b30e0b1bc7b0c3a`.

Enlace de revisión: https://adc-sync-staging-jose-202611.affectionatecarrot8.chatgpt.site/

El acceso exterior conserva la restricción al propietario de ChatGPT. La autenticación interna corresponde al entorno de pruebas. La confirmación del despliegue procede de Sites; queda pendiente la inspección del propietario en la página hospedada. Los cambios del repositorio ADC continúan locales en `pruebas/dp-01`, pendientes de commit. La copia de publicación tiene su propio repositorio de Sites.

El 17/11/2026 se publicó además el acceso a pantalla completa por doble clic y doble toque de DP-01, tras autorización del propietario. Sites confirmó el despliegue exitoso `appgdep_6afc3e7c33888191b216a58affed2ad8`, con fuente de publicación `e44459e8de456333bcd74b58e251897253beff8c`. Los tres archivos JavaScript publicados coincidieron por hash con la versión local probada. Se conserva el mismo enlace y configuración de staging. La comprobación del gesto sobre la publicación hospedada queda pendiente del propietario.
