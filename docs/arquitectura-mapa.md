# Mapa de archivos y dependencias de ADC

Generado con `npm run architecture:audit`. Complementa la auditoría razonada en [arquitectura-auditoria.md](arquitectura-auditoria.md). El inventario JSON contiene nombres de archivos, módulos, funciones, claves de almacenamiento y referencias; no contiene datos de usuarios ni credenciales.

## Entradas web

### ADC_Ingreso_Editable.html

Scripts en orden de carga:

- `assets/js/editor/modo-local.js`
- `assets/datos/config-publica.js`
- `assets/js/servicios/supabase-runtime.js`
- `assets/js/tema/inicial.js`
- `assets/js/tema/controles.js`
- `assets/js/acceso/ingreso.js`
- `assets/js/acceso/autenticacion.js`
- `assets/js/acceso/visibilidad-clave.js`
- `assets/js/acceso/marca.js`
- `assets/js/editor/acceso-ajustes.js`
- `assets/js/editor/ajustes-proyecto-datos.js`
- `assets/js/editor/documentos.js`
- `assets/js/editor/elementos.js`
- `assets/js/editor/documento-fondo.js`
- `assets/js/editor/puente-local.js`
- `assets/js/editor/ajustes-proyecto.js`
- `assets/js/editor/studio-politicas.js`
- `assets/js/editor/studio-operaciones.js`
- `assets/js/editor/studio-texto.js`
- `assets/js/editor/studio-alineacion.js`
- `assets/js/editor/studio-directo.js`
- `assets/js/editor/studio-guias.js`
- `assets/js/editor/studio.js`
- `assets/js/editor/comun.js`
- `assets/js/acceso/editor.js`
- `assets/js/acceso/efectos.js`

Hojas de estilo en orden de carga:

- `assets/css/acceso/autenticacion.css`
- `assets/css/acceso/ingreso.css`
- `assets/css/acceso/marca.css`
- `assets/css/acceso/efectos.css`
- `assets/css/interfaz/selector-tema.css`
- `assets/css/editor/base.css`
- `assets/css/acceso/editor.css`
- `assets/css/editor/acceso-ajustes.css`
- `assets/css/editor/studio.css`

### index.html

Scripts en orden de carga:

- `assets/js/editor/modo-local.js`
- `assets/datos/config-publica.js`
- `assets/js/servicios/supabase-runtime.js`
- `assets/js/servicios/almacenamiento-usuario.js`
- `assets/js/servicios/sincronizacion-usuario.js`
- `assets/js/interfaz/sincronizacion.js`
- `assets/js/interfaz/cuenta.js`
- `assets/js/interfaz/sesion.js`
- `assets/js/interfaz/inicio-local.js`
- `assets/js/core/mnc.js`
- `assets/js/tema/inicial.js`
- `assets/js/tema/controles.js`
- `assets/vendor/pdf-lib/pdf-lib.min.js`
- `assets/js/documentos/plantillas-dl01.js`
- `assets/js/core/validacion-guiada.js`
- `assets/js/core/cursos.js`
- `assets/js/core/estado.js`
- `assets/js/tramites/catalogo-datos.js`
- `assets/js/interfaz/navegacion.js`
- `assets/js/perfil/instituciones.js`
- `assets/js/perfil/geografia.js`
- `assets/js/perfil/datos-personales.js`
- `assets/js/tramites/dj01-traslados.js`
- `assets/js/perfil/respaldos.js`
- `assets/js/tramites/solicitudes.js`
- `assets/js/tramites/dl01-reglas.js`
- `assets/js/documentos/pdf-utilidades.js`
- `assets/js/tramites/dl01-pdf.js`
- `assets/js/tramites/dj01.js`
- `assets/js/core/inicializacion.js`
- `assets/js/documentos/acciones.js`
- `assets/js/tramites/dj01-conflictos.js`
- `assets/js/tramites/dj01-guia.js`
- `assets/js/tramites/dj01-distribucion.js`
- `assets/js/tramites/dj01-zoom.js`
- `assets/js/tramites/dj02-base.js`
- `assets/js/tramites/dj02-plantilla.js`
- `assets/js/perfil/nombres.js`
- `assets/js/tramites/dj02-formulario.js`
- `assets/js/calendario/calendario.js`
- `assets/js/tramites/ayuda.js`
- `assets/js/calendario/solicitudes.js`
- `assets/js/tramites/ol01.js`
- `assets/js/interfaz/espacio-trabajo.js`
- `assets/js/editor/acceso-ajustes.js`
- `assets/js/editor/ajustes-proyecto-datos.js`
- `assets/js/editor/documentos.js`
- `assets/js/editor/elementos.js`
- `assets/js/editor/documento-fondo.js`
- `assets/js/editor/puente-local.js`
- `assets/js/editor/ajustes-proyecto.js`
- `assets/js/editor/studio-politicas.js`
- `assets/js/editor/studio-operaciones.js`
- `assets/js/editor/studio-texto.js`
- `assets/js/editor/studio-alineacion.js`
- `assets/js/editor/studio-directo.js`
- `assets/js/editor/studio-guias.js`
- `assets/js/editor/studio.js`
- `assets/js/editor/comun.js`
- `assets/js/editor/editor.js`
- `assets/js/tramites/dj02-registro.js`
- `assets/datos/escuelas-chaco.js`
- `assets/js/perfil/contactos-instituciones.js`
- `assets/js/tramites/sc01.js`
- `assets/js/tramites/formularios-oficiales-datos.js`
- `assets/datos/formularios-pdf.js`
- `assets/js/documentos/pdf-campos.js`
- `assets/js/documentos/visor-pdf.js`
- `assets/js/tramites/interinos-revision.js`
- `assets/js/tramites/formularios-oficiales.js`
- `assets/js/tramites/bd02.js`
- `assets/js/tramites/busqueda-inteligente.js`
- `assets/js/tramites/buscador.js`
- `assets/js/tramites/dl01-interfaz.js`
- `assets/js/perfil/autoguardado.js`
- `assets/js/perfil/presentacion.js`
- `assets/js/interfaz/inicio.js`
- `assets/js/tramites/mis-tramites2-documentos.js`
- `assets/js/tramites/mis-tramites2.js`

Hojas de estilo en orden de carga:

- `assets/css/acceso/autenticacion.css`
- `assets/css/interfaz/sincronizacion.css`
- `assets/css/interfaz/selector-tema.css`
- `assets/css/interfaz/cuenta.css`
- `assets/css/base.css`
- `assets/css/tramites/dj01-advertencias.css`
- `assets/css/tramites/dj01-distribucion.css`
- `assets/css/interfaz/navegacion.css`
- `assets/css/tramites/dj02-base.css`
- `assets/css/tramites/dj02-plantilla.css`
- `assets/css/calendario/base.css`
- `assets/css/tramites/catalogo.css`
- `assets/css/interfaz/fondo.css`
- `assets/css/interfaz/tema.css`
- `assets/css/interfaz/mnc.css`
- `assets/css/interfaz/validacion-guiada.css`
- `assets/css/perfil/revision.css`
- `assets/css/perfil/nombres.css`
- `assets/css/tramites/dj02-formulario.css`
- `assets/css/calendario/meses.css`
- `assets/css/calendario/solicitudes.css`
- `assets/css/tramites/buscador.css`
- `assets/css/calendario/navegacion.css`
- `assets/css/interfaz/dialogos.css`
- `assets/css/documentos/panel.css`
- `assets/css/tramites/ol01.css`
- `assets/css/interfaz/espacio-trabajo.css`
- `assets/css/editor/base.css`
- `assets/css/editor/editor.css`
- `assets/css/editor/acceso-ajustes.css`
- `assets/css/editor/studio.css`
- `assets/css/tramites/dj02-registro.css`
- `assets/css/interfaz/responsive.css`
- `assets/css/tramites/sc01.css`
- `assets/css/tramites/formularios-oficiales.css`
- `assets/css/tramites/interinos.css`
- `assets/css/tramites/bd02.css`
- `assets/css/tramites/dl01.css`
- `assets/css/perfil/datos-personales.css`
- `assets/css/interfaz/inicio.css`
- `assets/css/tramites/mis-tramites2.css`

## Módulos de código propio

| Archivo | Líneas | Funciones con nombre | API global publicada |
| --- | ---: | ---: | --- |
| `assets/datos/config-publica.js` | 3 | 0 | `adcConfig` |
| `assets/datos/escuelas-chaco.js` | 2 | 0 | `adcEscuelasChaco` |
| `assets/datos/formularios-pdf.js` | 554 | 0 | `adcPreparedPdfForms` |
| `assets/js/acceso/autenticacion.js` | 66 | 4 |  |
| `assets/js/acceso/editor.js` | 956 | 34 |  |
| `assets/js/acceso/efectos.js` | 33 | 4 |  |
| `assets/js/acceso/ingreso.js` | 48 | 1 |  |
| `assets/js/acceso/marca.js` | 12 | 0 |  |
| `assets/js/acceso/visibilidad-clave.js` | 25 | 1 |  |
| `assets/js/calendario/calendario.js` | 988 | 22 |  |
| `assets/js/calendario/solicitudes.js` | 369 | 19 | `adcOLCalendarClosed`, `adcOLCalendarCoverage`, `adcRequestDaySummary`, `adcRequestCalendarView`, `adcDateSnapshot`, `adcStoreIssuedDates` |
| `assets/js/core/cursos.js` | 45 | 4 | `adcAcademic` |
| `assets/js/core/estado.js` | 4 | 0 |  |
| `assets/js/core/inicializacion.js` | 18 | 0 |  |
| `assets/js/core/mnc.js` | 72 | 7 | `adcMnc` |
| `assets/js/core/validacion-guiada.js` | 180 | 14 | `adcGuidedValidation` |
| `assets/js/documentos/acciones.js` | 16 | 3 |  |
| `assets/js/documentos/pdf-campos.js` | 117 | 3 | `adcPdfOverlay` |
| `assets/js/documentos/pdf-utilidades.js` | 28 | 6 |  |
| `assets/js/documentos/plantillas-dl01.js` | 3 | 0 |  |
| `assets/js/documentos/visor-pdf.js` | 266 | 13 | `adcPdfViewer` |
| `assets/js/editor/acceso-ajustes.js` | 41 | 3 |  |
| `assets/js/editor/ajustes-proyecto-datos.js` | 68 | 3 |  |
| `assets/js/editor/ajustes-proyecto.js` | 134 | 4 | `adcProjectLayout` |
| `assets/js/editor/comun.js` | 91 | 8 | `adcEditorCommon` |
| `assets/js/editor/documento-fondo.js` | 90 | 13 | `adcDocumentBackground` |
| `assets/js/editor/documentos.js` | 101 | 4 | `adcDocumentEditor` |
| `assets/js/editor/editor.js` | 1047 | 38 |  |
| `assets/js/editor/elementos.js` | 197 | 6 | `adcVisualElements` |
| `assets/js/editor/modo-local.js` | 3 | 0 |  |
| `assets/js/editor/puente-local.js` | 31 | 2 | `adcLocalEditorBridge` |
| `assets/js/editor/studio-alineacion.js` | 53 | 5 |  |
| `assets/js/editor/studio-directo.js` | 98 | 5 | `adcStudioDirect` |
| `assets/js/editor/studio-guias.js` | 38 | 3 | `adcStudioGuides` |
| `assets/js/editor/studio-operaciones.js` | 81 | 3 | `adcStudioOperations` |
| `assets/js/editor/studio-politicas.js` | 28 | 2 | `adcStudioPolicy` |
| `assets/js/editor/studio-texto.js` | 74 | 3 | `adcStudioText` |
| `assets/js/editor/studio.js` | 176 | 14 | `adcStudio` |
| `assets/js/interfaz/cuenta.js` | 37 | 1 | `adcAccount` |
| `assets/js/interfaz/espacio-trabajo.js` | 92 | 3 |  |
| `assets/js/interfaz/inicio-local.js` | 19 | 0 | `adcUserStorage` |
| `assets/js/interfaz/inicio.js` | 87 | 0 | `tab` |
| `assets/js/interfaz/navegacion.js` | 13 | 5 |  |
| `assets/js/interfaz/sesion.js` | 45 | 2 |  |
| `assets/js/interfaz/sincronizacion.js` | 83 | 2 | `adcSyncUI` |
| `assets/js/perfil/autoguardado.js` | 33 | 2 | `adcProfileDraft` |
| `assets/js/perfil/contactos-instituciones.js` | 100 | 5 | `adcSchoolContacts`, `adcSchoolContactsRender` |
| `assets/js/perfil/datos-personales.js` | 137 | 17 | `adcPreviewRefreshProfile`, `adcAplicarGeografiaPerfil` |
| `assets/js/perfil/geografia.js` | 152 | 4 | `adcAplicarGeografiaPerfil`, `adcVincularGeografiaChaco`, `adcBuscarGeografiaChaco` |
| `assets/js/perfil/instituciones.js` | 155 | 21 |  |
| `assets/js/perfil/nombres.js` | 6 | 2 |  |
| `assets/js/perfil/presentacion.js` | 53 | 0 | `adcPreviewRefreshProfile` |
| `assets/js/perfil/respaldos.js` | 36 | 8 | `adcAplicarGeografiaPerfil` |
| `assets/js/servicios/almacenamiento-usuario.js` | 89 | 7 | `adcUserStorage` |
| `assets/js/servicios/sincronizacion-usuario.js` | 100 | 4 | `adcUserSync` |
| `assets/js/servicios/supabase-runtime.js` | 30 | generado |  |
| `assets/js/servicios/supabaseClient.js` | 94 | 4 | `adcAuth` |
| `assets/js/tema/controles.js` | 20 | 1 |  |
| `assets/js/tema/inicial.js` | 5 | 0 |  |
| `assets/js/tramites/ayuda.js` | 33 | 0 |  |
| `assets/js/tramites/bd02.js` | 1399 | 48 | `adcBD02Open` |
| `assets/js/tramites/buscador.js` | 112 | 7 | `adcMBIT` |
| `assets/js/tramites/busqueda-inteligente.js` | 56 | 3 | `adcMBITSearch` |
| `assets/js/tramites/catalogo-datos.js` | 14 | 0 | `adcFormSearchMetadata` |
| `assets/js/tramites/dj01-conflictos.js` | 146 | 9 |  |
| `assets/js/tramites/dj01-distribucion.js` | 64 | 3 |  |
| `assets/js/tramites/dj01-guia.js` | 122 | 6 |  |
| `assets/js/tramites/dj01-traslados.js` | 71 | 6 |  |
| `assets/js/tramites/dj01-zoom.js` | 31 | 3 |  |
| `assets/js/tramites/dj01.js` | 417 | 55 |  |
| `assets/js/tramites/dj02-base.js` | 188 | 24 |  |
| `assets/js/tramites/dj02-formulario.js` | 52 | 3 | `dj02Preview` |
| `assets/js/tramites/dj02-plantilla.js` | 48 | 7 |  |
| `assets/js/tramites/dj02-registro.js` | 386 | 27 |  |
| `assets/js/tramites/dl01-interfaz.js` | 189 | 2 | `adcDL01ShowPreview`, `adcDL01Open` |
| `assets/js/tramites/dl01-pdf.js` | 224 | 11 |  |
| `assets/js/tramites/dl01-reglas.js` | 108 | 14 |  |
| `assets/js/tramites/formularios-oficiales-datos.js` | 1327 | 0 | `adcOfficialFormsData` |
| `assets/js/tramites/formularios-oficiales.js` | 1520 | 57 | `adcOfficialForms`, `tab`, `adcMotor01Pilot` |
| `assets/js/tramites/interinos-revision.js` | 60 | 5 | `adcInterinosReview` |
| `assets/js/tramites/mis-tramites2-documentos.js` | 109 | 8 | `tab`, `adcMT2Documents` |
| `assets/js/tramites/mis-tramites2.js` | 294 | 22 |  |
| `assets/js/tramites/mnc-adaptadores.js` | 49 | 1 |  |
| `assets/js/tramites/ol01.js` | 588 | 41 |  |
| `assets/js/tramites/sc01.js` | 745 | 26 | `adcSC01Open` |
| `assets/js/tramites/solicitudes.js` | 120 | 7 |  |
| `supabase/migrations/202611130001_adc_tester_profiles.sql` | 36 | 0 |  |
| `supabase/migrations/202611140001_adc_user_records.sql` | 54 | 0 |  |
| `supabase/migrations/202611140002_adc_sync_conflict_http.sql` | 22 | 0 |  |
| `tests/acceso-ajustes.test.cjs` | 33 | 0 |  |
| `tests/ajustes-proyecto.test.cjs` | 71 | 0 |  |
| `tests/arquitectura.test.cjs` | 50 | 0 |  |
| `tests/bd02-estandares.test.cjs` | 270 | 0 | `bd02Store`, `adcUserStorage` |
| `tests/bd07-pdf.test.cjs` | 49 | 0 | `bd07Lines` |
| `tests/cf01-pdf.test.cjs` | 52 | 0 |  |
| `tests/contact-icon-web.test.cjs` | 107 | 0 | `adcAuth`, `logoutCalls` |
| `tests/contact-icon.test.cjs` | 38 | 0 |  |
| `tests/cuenta-online.test.cjs` | 65 | 0 |  |
| `tests/cursos.test.cjs` | 32 | 0 |  |
| `tests/descuento-seguro-pdf.test.cjs` | 85 | 0 | `testLines`, `testTexts`, `open`, `testPrint` |
| `tests/dev-server.test.cjs` | 40 | 0 | `demo` |
| `tests/dj02-vpi-prueba.test.cjs` | 98 | 1 |  |
| `tests/dl01-interfaz.test.cjs` | 188 | 0 | `open`, `dlPrintCalls`, `testOriginalReview` |
| `tests/dl02-pdf.test.cjs` | 192 | 1 | `dl02OriginalOpen`, `open`, `dl02PrintRequested`, `dl02TouchResults` |
| `tests/documento-fondo.test.cjs` | 34 | 4 | `originalCard`, `originalSCInput`, `originalSCListener` |
| `tests/dp01-experiencia.test.cjs` | 191 | 0 | `dp01Tap`, `dp01OriginalStorage`, `adcUserStorage` |
| `tests/editor-botones.test.cjs` | 51 | 0 | `mouseActions` |
| `tests/editor-comun.test.cjs` | 21 | 0 | `evil` |
| `tests/editor-documentos.test.cjs` | 46 | 0 |  |
| `tests/editor-elementos.test.cjs` | 77 | 0 |  |
| `tests/editor-herramientas.test.cjs` | 48 | 3 | `__editorAuditCreate` |
| `tests/fecha-manual.test.cjs` | 76 | 0 |  |
| `tests/form3-pdf.test.cjs` | 54 | 0 | `form3Lines` |
| `tests/form6-pdf.test.cjs` | 54 | 0 | `form6Lines` |
| `tests/formularios-oficiales.test.cjs` | 673 | 1 | `testPdfLines`, `testPdfBoxes`, `testPrintCalls`, `print`, `fixtureSaves`, `fixtureReview`, `startReview`, `fixtureResult`, `testDpLines`, `testDpOriginalOpen`, `testDpPrintCount`, `open` |
| `tests/geografia.test.cjs` | 60 | 0 |  |
| `tests/incapacidad-pdf.test.cjs` | 373 | 0 | `incapacityDraws`, `savedIncapacityOpen`, `open`, `incapacityPrintRequested`, `adcPreparedPdfForms`, `originalIncapacityStore`, `adcUserStorage`, `incapacitySavingShown` |
| `tests/ingreso.test.cjs` | 63 | 0 |  |
| `tests/inicio.test.cjs` | 65 | 0 | `inicioStore`, `adcUserStorage` |
| `tests/interinos-pdf.test.cjs` | 67 | 0 | `draws`, `open`, `printCalled`, `realStore`, `adcUserStorage` |
| `tests/local-editor-bridge.test.cjs` | 40 | 0 |  |
| `tests/local-editor-ui.test.cjs` | 45 | 0 |  |
| `tests/mbit.test.cjs` | 145 | 0 | `testMBITOpened` |
| `tests/md01-mnc.test.cjs` | 44 | 0 | `drawLines`, `drawTexts`, `open`, `mdPrint`, `mdOriginalStore`, `adcUserStorage` |
| `tests/md01-vpi.test.cjs` | 47 | 0 |  |
| `tests/mis-tramites2-documentos.test.cjs` | 89 | 0 |  |
| `tests/mis-tramites2.test.cjs` | 83 | 0 |  |
| `tests/motor01-piloto.test.cjs` | 116 | 0 | `originalPilotStore`, `adcUserStorage` |
| `tests/mt2-enfermedad.test.cjs` | 77 | 0 |  |
| `tests/ol01-guia.test.cjs` | 156 | 1 | `olPrintCalls` |
| `tests/ol01-interfaz.test.cjs` | 64 | 0 |  |
| `tests/ol01-perfil.test.cjs` | 55 | 1 |  |
| `tests/pdf-blank-line.test.cjs` | 23 | 0 |  |
| `tests/pdf-campos.test.cjs` | 50 | 0 |  |
| `tests/perfil-normal.test.cjs` | 70 | 0 | `adcAuth` |
| `tests/publicacion.test.cjs` | 29 | 0 |  |
| `tests/reubicacion-pdf.test.cjs` | 37 | 0 |  |
| `tests/sincronizacion-browser.test.cjs` | 98 | 2 | `adcConfig` |
| `tests/sincronizacion-rls.test.cjs` | 35 | 0 |  |
| `tests/sincronizacion.test.cjs` | 73 | 2 |  |
| `tests/sr01-pdf.test.cjs` | 28 | 1 | `srLines` |
| `tests/studio-alineacion.test.cjs` | 12 | 0 |  |
| `tests/studio-contrato.test.cjs` | 26 | 0 |  |
| `tests/studio-inplace.test.cjs` | 54 | 2 | `evil`, `sameInput`, `originalInput` |
| `tests/studio.test.cjs` | 59 | 1 |  |
| `tests/supabase-auth.test.cjs` | 92 | 0 | `adcConfig` |
| `tests/supabase-config.test.cjs` | 13 | 0 |  |
| `tests/supabase-management.test.cjs` | 21 | 0 |  |
| `tests/supabase-rls.test.cjs` | 46 | 0 |  |
| `tests/support/ajustes.cjs` | 15 | 0 |  |
| `tests/support/demo-config.cjs` | 10 | 1 | `adcConfig` |
| `tests/support/md01-server.cjs` | 11 | 1 |  |
| `tests/sync-sandbox.test.cjs` | 53 | 1 |  |
| `tests/sync-staging.test.cjs` | 22 | 0 |  |
| `tests/traslado-pdf.test.cjs` | 50 | 0 |  |
| `tools/ajustes-store.cjs` | 39 | 5 |  |
| `tools/auditar-arquitectura.cjs` | 115 | 4 |  |
| `tools/build.cjs` | 12 | 1 | `adcConfig` |
| `tools/configurar-supabase.cjs` | 78 | 5 |  |
| `tools/contact-icon-preview.cjs` | 61 | 1 | `tab` |
| `tools/dev-server.cjs` | 39 | 2 |  |
| `tools/env.cjs` | 31 | 2 |  |
| `tools/extract-nomenclatura.py` | 108 | 0 |  |
| `tools/importar-ajustes.cjs` | 24 | 1 |  |
| `tools/inicio-preview.cjs` | 8 | 0 |  |
| `tools/local-editor-bridge.cjs` | 45 | 1 |  |
| `tools/motor01-preview.cjs` | 23 | 1 |  |
| `tools/publicar.cjs` | 38 | 2 |  |
| `tools/supabase-auth-settings.cjs` | 21 | 1 |  |
| `tools/sync-sandbox.cjs` | 79 | 3 | `adcConfig` |
| `tools/sync-staging-browser.cjs` | 36 | 2 |  |
| `tools/sync-staging-verify.cjs` | 51 | 2 |  |
| `tools/sync-staging.cjs` | 91 | 8 | `adcConfig` |
| `tools/verify-structure.cjs` | 46 | 0 |  |

## Consumidores de recursos y módulos

| Destino | Referenciado desde |
| --- | --- |
| `assets/css/acceso/autenticacion.css` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/css/acceso/editor.css` | `ADC_Ingreso_Editable.html` |
| `assets/css/acceso/efectos.css` | `ADC_Ingreso_Editable.html` |
| `assets/css/acceso/ingreso.css` | `ADC_Ingreso_Editable.html` |
| `assets/css/acceso/marca.css` | `ADC_Ingreso_Editable.html` |
| `assets/css/base.css` | `index.html` |
| `assets/css/calendario/base.css` | `index.html` |
| `assets/css/calendario/meses.css` | `index.html` |
| `assets/css/calendario/navegacion.css` | `index.html` |
| `assets/css/calendario/solicitudes.css` | `index.html` |
| `assets/css/documentos/panel.css` | `index.html` |
| `assets/css/editor/acceso-ajustes.css` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/css/editor/base.css` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/css/editor/editor.css` | `index.html` |
| `assets/css/editor/studio.css` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/css/interfaz/cuenta.css` | `index.html` |
| `assets/css/interfaz/dialogos.css` | `index.html` |
| `assets/css/interfaz/espacio-trabajo.css` | `index.html` |
| `assets/css/interfaz/fondo.css` | `index.html` |
| `assets/css/interfaz/inicio.css` | `index.html` |
| `assets/css/interfaz/mnc.css` | `index.html` |
| `assets/css/interfaz/navegacion.css` | `index.html` |
| `assets/css/interfaz/responsive.css` | `index.html` |
| `assets/css/interfaz/selector-tema.css` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/css/interfaz/sincronizacion.css` | `index.html` |
| `assets/css/interfaz/tema.css` | `index.html` |
| `assets/css/interfaz/validacion-guiada.css` | `index.html` |
| `assets/css/perfil/datos-personales.css` | `index.html` |
| `assets/css/perfil/nombres.css` | `index.html` |
| `assets/css/perfil/revision.css` | `index.html` |
| `assets/css/tramites/bd02.css` | `index.html` |
| `assets/css/tramites/buscador.css` | `index.html` |
| `assets/css/tramites/catalogo.css` | `index.html` |
| `assets/css/tramites/dj01-advertencias.css` | `index.html` |
| `assets/css/tramites/dj01-distribucion.css` | `index.html` |
| `assets/css/tramites/dj02-base.css` | `index.html` |
| `assets/css/tramites/dj02-formulario.css` | `index.html` |
| `assets/css/tramites/dj02-plantilla.css` | `index.html` |
| `assets/css/tramites/dj02-registro.css` | `index.html` |
| `assets/css/tramites/dl01.css` | `index.html` |
| `assets/css/tramites/formularios-oficiales.css` | `index.html` |
| `assets/css/tramites/interinos.css` | `index.html` |
| `assets/css/tramites/mis-tramites2.css` | `index.html` |
| `assets/css/tramites/ol01.css` | `index.html` |
| `assets/css/tramites/sc01.css` | `index.html` |
| `assets/datos/ajustes-pagina.json` | `assets/js/editor/ajustes-proyecto.js` |
| `assets/datos/config-publica.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/datos/escuelas-chaco.js` | `index.html` |
| `assets/datos/formularios-pdf.js` | `index.html` |
| `assets/formularios/BD-02.pdf` | `assets/js/tramites/bd02.js` |
| `assets/formularios/BD-07-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/BD-07.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/CF-01-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/CF-01.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Descuento-por-Seguro-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Descuento-por-Seguro.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/DL-02-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/DL-02-pagina-2.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/DL-02.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/DP-01-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/DP-01.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Formulario-3-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Formulario-3.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Formulario-6-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Formulario-6.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Incapacidad-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Incapacidad.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Interinos-Expectativas-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Interinos-Expectativas.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/MD-01-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/MD-01.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Reubicacion-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Reubicacion.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/SC-01-plantilla.png` | `assets/js/tramites/sc01.js` |
| `assets/formularios/SC-01.pdf` | `assets/js/tramites/sc01.js` |
| `assets/formularios/SR-01-pagina-1.png` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/SR-01.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/formularios/Traslado-Transitorio.pdf` | `assets/datos/formularios-pdf.js` |
| `assets/img/acceso/fondo-escolar-dark.png` | `assets/css/acceso/ingreso.css` |
| `assets/img/acceso/fondo-escolar-light.png` | `assets/css/acceso/ingreso.css` |
| `assets/img/acceso/logo-adc.png` | `ADC_Ingreso_Editable.html` |
| `assets/js/acceso/autenticacion.js` | `ADC_Ingreso_Editable.html` |
| `assets/js/acceso/editor.js` | `ADC_Ingreso_Editable.html` |
| `assets/js/acceso/efectos.js` | `ADC_Ingreso_Editable.html` |
| `assets/js/acceso/ingreso.js` | `ADC_Ingreso_Editable.html` |
| `assets/js/acceso/marca.js` | `ADC_Ingreso_Editable.html` |
| `assets/js/acceso/visibilidad-clave.js` | `ADC_Ingreso_Editable.html` |
| `assets/js/calendario/calendario.js` | `index.html` |
| `assets/js/calendario/solicitudes.js` | `index.html` |
| `assets/js/core/cursos.js` | `index.html` |
| `assets/js/core/estado.js` | `index.html` |
| `assets/js/core/inicializacion.js` | `index.html` |
| `assets/js/core/mnc.js` | `index.html` |
| `assets/js/core/validacion-guiada.js` | `index.html` |
| `assets/js/documentos/acciones.js` | `index.html` |
| `assets/js/documentos/pdf-campos.js` | `index.html` |
| `assets/js/documentos/pdf-utilidades.js` | `index.html` |
| `assets/js/documentos/plantillas-dl01.js` | `index.html` |
| `assets/js/documentos/visor-pdf.js` | `index.html` |
| `assets/js/editor/acceso-ajustes.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/ajustes-proyecto-datos.js` | `ADC_Ingreso_Editable.html`, `index.html`, `tests/ajustes-proyecto.test.cjs`, `tests/bd02-estandares.test.cjs`, `tests/bd07-pdf.test.cjs`, `tests/cf01-pdf.test.cjs`, `tests/descuento-seguro-pdf.test.cjs`, `tests/dj02-vpi-prueba.test.cjs`, `tests/dl02-pdf.test.cjs`, `tests/documento-fondo.test.cjs`, `tests/dp01-experiencia.test.cjs`, `tests/editor-elementos.test.cjs`, `tests/editor-herramientas.test.cjs`, `tests/form3-pdf.test.cjs`, `tests/form6-pdf.test.cjs`, `tests/incapacidad-pdf.test.cjs`, `tests/inicio.test.cjs`, `tests/interinos-pdf.test.cjs`, `tests/local-editor-bridge.test.cjs`, `tests/local-editor-ui.test.cjs`, `tests/md01-mnc.test.cjs`, `tests/md01-vpi.test.cjs`, `tests/mis-tramites2-documentos.test.cjs`, `tests/mis-tramites2.test.cjs`, `tests/motor01-piloto.test.cjs`, `tests/mt2-enfermedad.test.cjs`, `tests/reubicacion-pdf.test.cjs`, `tests/sr01-pdf.test.cjs`, `tests/studio-contrato.test.cjs`, `tests/studio-inplace.test.cjs`, `tests/studio.test.cjs`, `tests/traslado-pdf.test.cjs`, `tools/ajustes-store.cjs`, `tools/importar-ajustes.cjs` |
| `assets/js/editor/ajustes-proyecto.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/comun.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/documento-fondo.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/documentos.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/editor.js` | `index.html` |
| `assets/js/editor/elementos.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/modo-local.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/puente-local.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/studio-alineacion.js` | `ADC_Ingreso_Editable.html`, `index.html`, `tests/studio-alineacion.test.cjs` |
| `assets/js/editor/studio-directo.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/studio-guias.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/studio-operaciones.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/studio-politicas.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/studio-texto.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/editor/studio.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/interfaz/cuenta.js` | `index.html` |
| `assets/js/interfaz/espacio-trabajo.js` | `index.html` |
| `assets/js/interfaz/inicio-local.js` | `index.html` |
| `assets/js/interfaz/inicio.js` | `index.html` |
| `assets/js/interfaz/navegacion.js` | `index.html` |
| `assets/js/interfaz/sesion.js` | `index.html` |
| `assets/js/interfaz/sincronizacion.js` | `index.html` |
| `assets/js/perfil/autoguardado.js` | `index.html` |
| `assets/js/perfil/contactos-instituciones.js` | `index.html` |
| `assets/js/perfil/datos-personales.js` | `index.html` |
| `assets/js/perfil/geografia.js` | `index.html` |
| `assets/js/perfil/instituciones.js` | `index.html` |
| `assets/js/perfil/nombres.js` | `index.html` |
| `assets/js/perfil/presentacion.js` | `index.html` |
| `assets/js/perfil/respaldos.js` | `index.html` |
| `assets/js/servicios/almacenamiento-usuario.js` | `index.html` |
| `assets/js/servicios/sincronizacion-usuario.js` | `index.html` |
| `assets/js/servicios/supabase-runtime.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/tema/controles.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/tema/inicial.js` | `ADC_Ingreso_Editable.html`, `index.html` |
| `assets/js/tramites/ayuda.js` | `index.html` |
| `assets/js/tramites/bd02.js` | `index.html` |
| `assets/js/tramites/buscador.js` | `index.html` |
| `assets/js/tramites/busqueda-inteligente.js` | `index.html` |
| `assets/js/tramites/catalogo-datos.js` | `index.html` |
| `assets/js/tramites/dj01-conflictos.js` | `index.html` |
| `assets/js/tramites/dj01-distribucion.js` | `index.html` |
| `assets/js/tramites/dj01-guia.js` | `index.html` |
| `assets/js/tramites/dj01-traslados.js` | `index.html` |
| `assets/js/tramites/dj01-zoom.js` | `index.html` |
| `assets/js/tramites/dj01.js` | `index.html` |
| `assets/js/tramites/dj02-base.js` | `index.html` |
| `assets/js/tramites/dj02-formulario.js` | `index.html` |
| `assets/js/tramites/dj02-plantilla.js` | `index.html` |
| `assets/js/tramites/dj02-registro.js` | `index.html` |
| `assets/js/tramites/dl01-interfaz.js` | `index.html` |
| `assets/js/tramites/dl01-pdf.js` | `index.html` |
| `assets/js/tramites/dl01-reglas.js` | `index.html` |
| `assets/js/tramites/formularios-oficiales-datos.js` | `index.html` |
| `assets/js/tramites/formularios-oficiales.js` | `index.html` |
| `assets/js/tramites/interinos-revision.js` | `index.html` |
| `assets/js/tramites/mis-tramites2-documentos.js` | `index.html` |
| `assets/js/tramites/mis-tramites2.js` | `index.html` |
| `assets/js/tramites/ol01.js` | `index.html` |
| `assets/js/tramites/sc01.js` | `index.html` |
| `assets/js/tramites/solicitudes.js` | `index.html` |
| `assets/vendor/pdf-lib/pdf-lib.min.js` | `index.html` |
| `assets/vendor/pdfjs/pdf.min.mjs` | `assets/js/editor/elementos.js`, `assets/js/tramites/dl01-interfaz.js` |
| `config/publicacion.json` | `tools/publicar.cjs`, `tools/supabase-auth-settings.cjs` |
| `config/sincronizacion-staging.json` | `tools/sync-staging.cjs` |
| `tests/support/ajustes.cjs` | `tests/ajustes-proyecto.test.cjs`, `tests/documento-fondo.test.cjs`, `tests/editor-botones.test.cjs`, `tests/editor-documentos.test.cjs`, `tests/editor-elementos.test.cjs`, `tests/editor-herramientas.test.cjs`, `tests/local-editor-ui.test.cjs`, `tests/studio-inplace.test.cjs`, `tests/studio.test.cjs` |
| `tests/support/demo-config.cjs` | `tests/acceso-ajustes.test.cjs`, `tests/ajustes-proyecto.test.cjs`, `tests/bd02-estandares.test.cjs`, `tests/bd07-pdf.test.cjs`, `tests/cf01-pdf.test.cjs`, `tests/cuenta-online.test.cjs`, `tests/descuento-seguro-pdf.test.cjs`, `tests/dl01-interfaz.test.cjs`, `tests/dl02-pdf.test.cjs`, `tests/documento-fondo.test.cjs`, `tests/dp01-experiencia.test.cjs`, `tests/editor-botones.test.cjs`, `tests/editor-documentos.test.cjs`, `tests/editor-elementos.test.cjs`, `tests/editor-herramientas.test.cjs`, `tests/fecha-manual.test.cjs`, `tests/form3-pdf.test.cjs`, `tests/form6-pdf.test.cjs`, `tests/formularios-oficiales.test.cjs`, `tests/incapacidad-pdf.test.cjs`, `tests/ingreso.test.cjs`, `tests/interinos-pdf.test.cjs`, `tests/local-editor-ui.test.cjs`, `tests/mbit.test.cjs`, `tests/md01-vpi.test.cjs`, `tests/ol01-guia.test.cjs`, `tests/ol01-interfaz.test.cjs`, `tests/perfil-normal.test.cjs`, `tests/reubicacion-pdf.test.cjs`, `tests/sincronizacion-browser.test.cjs`, `tests/sr01-pdf.test.cjs`, `tests/studio-inplace.test.cjs`, `tests/studio.test.cjs`, `tests/supabase-auth.test.cjs`, `tests/support/md01-server.cjs`, `tests/traslado-pdf.test.cjs`, `tools/contact-icon-preview.cjs`, `tools/motor01-preview.cjs` |
| `tests/support/md01-server.cjs` | `tests/md01-mnc.test.cjs`, `tests/motor01-piloto.test.cjs` |
| `tools/ajustes-store.cjs` | `tests/studio-contrato.test.cjs`, `tools/importar-ajustes.cjs`, `tools/local-editor-bridge.cjs` |
| `tools/auditar-arquitectura.cjs` | `tests/arquitectura.test.cjs` |
| `tools/build.cjs` | `tools/configurar-supabase.cjs`, `tools/dev-server.cjs`, `tools/publicar.cjs` |
| `tools/configurar-supabase.cjs` | `tests/supabase-management.test.cjs`, `tests/supabase-rls.test.cjs` |
| `tools/contact-icon-preview.cjs` | `tests/contact-icon-web.test.cjs` |
| `tools/dev-server.cjs` | `tests/dev-server.test.cjs`, `tests/support/md01-server.cjs`, `tools/motor01-preview.cjs` |
| `tools/env.cjs` | `tests/supabase-config.test.cjs`, `tools/build.cjs`, `tools/configurar-supabase.cjs`, `tools/publicar.cjs`, `tools/sync-staging.cjs` |
| `tools/local-editor-bridge.cjs` | `tests/documento-fondo.test.cjs`, `tests/local-editor-bridge.test.cjs`, `tests/local-editor-ui.test.cjs`, `tools/dev-server.cjs` |
| `tools/motor01-preview.cjs` | `tests/dj02-vpi-prueba.test.cjs`, `tests/inicio.test.cjs`, `tests/mis-tramites2-documentos.test.cjs`, `tests/mis-tramites2.test.cjs`, `tests/motor01-piloto.test.cjs`, `tests/mt2-enfermedad.test.cjs`, `tools/inicio-preview.cjs` |
| `tools/publicar.cjs` | `tests/publicacion.test.cjs` |
| `tools/supabase-auth-settings.cjs` | `tests/publicacion.test.cjs`, `tools/configurar-supabase.cjs`, `tools/sync-staging.cjs` |
| `tools/sync-sandbox.cjs` | `tests/sync-sandbox.test.cjs` |
| `tools/sync-staging.cjs` | `tests/sync-staging.test.cjs`, `tools/sync-staging-browser.cjs`, `tools/sync-staging-verify.cjs` |

## Referencias literales ausentes

Ninguna en el alcance del análisis.

## Límites

El grafo estático no resuelve destinos calculados, `onclick` heredados ni todos los accesos por variables. Las rutas funcionales se documentan en la auditoría; los archivos sin referencias literales no se borran automáticamente. `docs/structure-manifest.json` es una referencia histórica y no define por sí solo la arquitectura vigente.

## Integridad de rutas y recursos

| Control | Hallazgos |
| --- | ---: |
| Cargas repetidas de scripts/links por entrada | 0 |
| Rutas desde la raíz incompatibles con un prefijo Pages | 0 |
| Archivos cuya ruta sólo difiere en mayúsculas | 0 |
| Grupos de recursos propios idénticos (SHA-256) | 0 |

Se revisan atributos HTML con comillas simples/dobles, enlaces de navegación y recursos CSS (`url`/`@import`). Se excluyen comentarios y destinos externos, embebidos o fragmentos. Los recursos idénticos son candidatos de revisión, nunca una autorización de borrado. El inventario incluye todas las coincidencias de ocho líneas detectadas por este método; no demuestra equivalencia de comportamiento.
