# Arquitectura de Asistente Docente Chaco

## Antes de implementar

- Consultar `docs/arquitectura-auditoria.md` y `docs/estructura.md`. El mapa de carga actual está en `docs/arquitectura-mapa.md`; el inventario se regenera con `npm run architecture:audit`.
- Revisar `git status` y conservar los cambios locales. No hacer commit, push o cambios de rama sin autorización aplicable del usuario. Tras la unificación aprobada, sólo se mantiene `main` local y `origin/main`; Pages publica desde `main`. Crear nuevas ramas únicamente cuando el usuario lo solicite para una nueva etapa. No recrear `log-in` ni `log-in-2` automáticamente.
- Reutilizar los módulos existentes antes de crear otro motor, componente o servicio. No agregar un framework ni mover archivos masivamente como efecto secundario.

## Contratos que deben conservarse

- Mantener identidad visual, accesibilidad, navegación, responsive y comportamiento aprobado. Preservar IDs del DOM, nombres públicos `adc*`, orden de scripts, claves/versiones de almacenamiento, correcciones del usuario y borradores históricos.
- DJ-01, DJ-02, OL-01, SC-01 y DL-01 son implementaciones protegidas: no reescribir sus plantillas ni módulos específicos sin un pedido explícito para ese formulario. Una auditoría general no levanta esta protección.
- Para MNC reutilizar `core/mnc.js`, sus adaptadores y la geometría de 0,5 mm / 70%. Para años y divisiones usar `core/cursos.js`. Para validación guiada, `core/validacion-guiada.js`.
- Guía de bloqueos: reutilizar `adcGuidedValidation.createBlocking({root, collect, save})`. Cada formulario aporta sus requisitos y conflictos en orden documental (`key`, `message`, `controls`, y opcionalmente `reveal`/`profile`). Todas sus acciones de salida deben invocar el mismo `check()`. La tarjeta naranja enumera los bloqueos, abre secciones, desplaza/enfoca el primer control y aplica borde pulsante durante 2 segundos seguido de borde fijo; movimiento reducido elimina la animación. `refresh()` retira marcas al corregir y `cancel()` termina la revisión. Integrado inicialmente sólo en OL-01; no sustituir las revisiones con omisión autorizada de los demás formularios sin pedido específico.
- OL-01 conserva el PDF oficial y usa el catálogo para activar el bloque familiar, nunca radios mutuamente excluyentes con el motivo. Mantener las cajas y los datos familiares en borrador, pero excluirlos de las salidas cuando no aplican. Las sugerencias de presentación requieren cobertura del calendario institucional; no inferir saldo anual de un historial cuya integridad no esté acreditada.
- Los controles nuevos del OL-01 se insertan en `DOMContentLoaded`, después del registro histórico del editor: no desplazar los índices `base-*` de los ajustes existentes. Mantener este orden al extender su interfaz.
- Los documentos nuevos usan el catálogo y, cuando corresponde, `datos/formularios-pdf.js`, `documentos/pdf-campos.js` y el lienzo de `tramites/formularios-oficiales.js`. No inventar requisitos legales ni modificar el PDF oficial sin autorización.

## Módulos compartidos

- Editor visual: `editor/comun.js` contiene registro, saneamiento, geometría y utilidades comunes; `editor/documentos.js`, `editor/elementos.js` y `editor/ajustes-proyecto*.js` son las extensiones compartidas. Los motores de ingreso y aplicación mantienen diferencias intencionales. No copiar sus utilidades a módulos nuevos.
- Estilos comunes de Ajustes: `assets/css/editor/base.css`; las variantes por pantalla y `studio.css` se cargan después. ADC Studio puede abrirse local y online mediante cinco clics/toques o Tab, con visibilidad por pestaña/cuenta. Sólo el puente y Commit to local están restringidos a localhost.
- ADC Studio: reutilizar `studio-politicas.js`, `studio-operaciones.js`, `studio-directo.js`, `studio-guias.js` y `studio.js`. No crear otro historial ni otra persistencia. Los campos y contenedores originales de DJ-01/DJ-02/DL-01 están anclados para nuevas ediciones estructurales; notas y burbujas siguen admitidas.
- Guardado visual: usar `tools/ajustes-store.cjs` desde el puente o importadores. Preservar validación, respaldo, control de revisión y escritura atómica. No permitir rutas ni comandos recibidos del navegador.
- Supabase: único cliente en `servicios/supabaseClient.js`; `supabase-runtime.js` se genera con `npm run build`, no se edita manualmente. No crear clientes de base de datos en componentes visuales ni exponer claves privadas. Los datos docentes continúan locales mientras no se acuerde otra política.
- Rutas y recursos deben funcionar bajo el prefijo de GitHub Pages, no sólo en `/`. Antes de renombrar archivos, verificar referencias estáticas y dinámicas.

## Verificación y documentación

- Ejecutar `npm run architecture:check` y las pruebas relacionadas con el cambio. Después de una refactorización transversal ejecutar la suite completa y compilar el cliente si cambió su fuente.
- Actualizar el mapa cuando cambien módulos o dependencias. `docs/structure-manifest.json` y `tools/verify-structure.cjs --baseline` describen una extracción histórica, no el objetivo actual de la aplicación.
- Informar límites de las verificaciones. No afirmar que se probó online cuando sólo se usaron fixtures locales. No hacer cambios remotos en Supabase para pruebas de refactorización.
