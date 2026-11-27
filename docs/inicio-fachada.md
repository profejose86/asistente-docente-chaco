# Inicio — fachada en revisión

Fecha: 23/11/2026. Rama creada y activada por pedido del propietario: `inicio`, desde HEAD `407052bd6bdc99f2b3e47abba658e3efca09b200`. Se conservaron los cambios locales anteriores; crear la rama no equivale a un commit ni a un respaldo adicional. No se hizo commit, push o publicación.

## Referencia preservada

El HTML aportado se conserva íntegro en [prototipos/inicio-original.html](prototipos/inicio-original.html), SHA-256 `a4f69a00f74fbff8ac26ca5db14c0ee3a75a85cd20170e044b5e7e5dfbf72129`. No se depende de la disponibilidad del chat o del enlace externo para recuperar esta referencia.

El original contiene Tailwind por CDN, tipografía remota, un nombre ficticio, conteos fijos, datos de ejemplo y funciones simuladas de guardado, revisión, impresión y pantalla completa. Es material de diseño, no una implementación funcional aprobada. No se ejecuta dentro de ADC ni se publica con sus recursos web.

## Adaptación local

Se reutilizan los colores azul marino `#0B192C`, naranja `#D66824` y azul `#144D9C`, la cabecera, el saludo y la distribución de tres tarjetas: Perfil Docente, Mis trámites y Mi agenda. Se mantiene una presentación cercana, legible y profesional. El CSS está limitado a `body.adc-inicio-shell`; no se incorpora Tailwind ni un framework.

`assets/js/interfaz/inicio.js` sólo se activa con `adc-inicio=1`. Monta después del registro histórico del editor, conserva IDs y controles existentes y delega la navegación en `tab`. La nueva cabecera se monta separada de la anterior para no heredar sus medidas guardadas. En esta vista se reutilizan el selector de tema y el menú de cuenta existentes; la cabecera anterior se oculta únicamente durante la prueba. La guardia de autenticación no se modifica.

La bienvenida usa el nombre actual del perfil mediante `textContent` o «profe» si no hay nombre. El contador se obtiene del catálogo existente; las instituciones se cuentan desde `inst`. No se inventan borradores DJ-01, recordatorios, verificación de identidad ni estado de sincronización. Los enlaces abren las secciones existentes, sin copiar formularios protegidos.

La pestaña **Mis trámites 2** es una sección independiente de prueba. Conecta INCAPACIDAD con `adcMotor01Pilot` y su persistencia/guardado comprobado, sin otro visor, iframe de aplicación ni almacenamiento nuevo. No presenta el visor maestro como terminado y todavía no incorpora BD-02. Las salidas continúan pasando por la barrera de guardado del piloto; un fallo conserva el documento activo. El catálogo habitual sigue en Mis trámites.

## Revisar localmente

Ejecutar `node tools/inicio-preview.cjs` con el Node instalado. Reutiliza `tools/motor01-preview.cjs` y escucha sólo en loopback, sin compilar ni escribir configuración:

`http://127.0.0.1:8913/adc/index.html?adc-preview=1&adc-inicio=1&adc-motor01=incapacidad`

Este puerto tiene almacenamiento de navegador separado del piloto de `8912` y de producción. Usar datos ficticios. El parámetro de Inicio no autentica ni omite la sesión en modo Supabase. Sin `adc-inicio=1` se conserva la presentación habitual.

## Verificación

`tests/inicio.test.cjs` comprueba: referencia por hash, activación exclusiva por parámetro, saludo real, tarjetas, navegación a perfil/calendario/catálogo/Mis trámites 2, tema y menú de cuenta reutilizados, conservación de borradores y bloqueo de salida ante cuota simulada. Inspecciona 320/390/768/1024/1440 px en claro/oscuro, comprueba ausencia de desborde/superposición y genera capturas en un temporal. Se inspeccionan visualmente escritorio y celular.

Los resultados corresponden a datos ficticios y servicios locales, no a cuentas remotas, dispositivos físicos ni una publicación. Los módulos y dependencias nuevos se incluyen en el mapa con la herramienta existente. La integración permanente al Inicio de la aplicación requiere revisión del propietario; no se activa globalmente la fachada por esta prueba.

Resultado del 23/11/2026: **20 pruebas seleccionadas aprobadas, cero fallos**. `node --test --test-concurrency=1 tests/inicio.test.cjs tests/motor01-piloto.test.cjs tests/arquitectura.test.cjs tests/pdf-campos.test.cjs tests/sincronizacion.test.cjs` aprobó 18. En una copia temporal, `node --test --test-concurrency=1 tests/perfil-normal.test.cjs tests/incapacidad-pdf.test.cjs` aprobó 2; se evita escribir capturas históricas sobre el proyecto. Se utilizó el Node existente, sin instalar dependencias. `architecture:check` mediante `node tools/auditar-arquitectura.cjs --check` y `git diff --check` aprobaron. Se inspeccionaron las capturas de escritorio claro y celular oscuro, corrigiendo la cabecera heredada y la superposición de pestañas antes de la validación final. No se ejecutó la suite completa ni se recompiló Supabase: su fuente no cambió.

Selector de tema (23/11/2026): la fachada muestra sol, Modo claro, interruptor azul y Modo oscuro con luna. Reutiliza el mismo control, eventos y clave adc-login-theme. En pantallas angostas ocupa una fila propia. Verificado con teclado y en cinco anchos, sin modificar el acceso habitual ni los formularios.

Actualización del selector de tema (27/11/2026): se restauró el botón compartido Light/Dark de la pantalla de ingreso (`#adcSharedThemeContent` y `selector-tema.css`) quitando la sobreescritura visual de `inicio.js` e `inicio.css`, manteniendo `position:static;margin:0` dentro de `.adc-start-tools`, el soporte por teclado, la clave `adc-login-theme` y el diseño responsivo.
