# Mapa de archivos y dependencias de ADC

Generado con `npm run architecture:audit`. Complementa la auditoría razonada en [arquitectura-auditoria.md](arquitectura-auditoria.md). El inventario JSON contiene nombres de archivos, módulos, funciones, claves de almacenamiento y referencias; no contiene datos de usuarios ni credenciales.

## Entradas web

### ADC_Ingreso_Editable.html

Scripts en orden de carga:

- `assets/js/editor/modo-local.js`
- `assets/datos/config-publica.js`
- `assets/js/servicios/supabase-runtime.js`
- `assets/js/acceso/ingreso.js`
- `assets/js/acceso/autenticacion.js`
- `assets/js/acceso/visibilidad-clave.js`
- `assets/js/acceso/marca.js`
- `assets/js/editor/acceso-ajustes.js`
- `assets/js/editor/ajustes-proyecto-datos.js`
- `assets/js/editor/documentos.js`
- `assets/js/editor/elementos.js`
- `assets/js/editor/puente-local.js`
- `assets/js/editor/ajustes-proyecto.js`
- `assets/js/editor/studio-politicas.js`
- `assets/js/editor/studio-operaciones.js`
- `assets/js/editor/studio-directo.js`
- `assets/js/editor/studio-guias.js`
- `assets/js/editor/studio.js`
- `assets/js/editor/comun.js`
- `assets/js/acceso/editor.js`

Hojas de estilo en orden de carga:

- `assets/css/acceso/autenticacion.css`
- `assets/css/acceso/ingreso.css`
- `assets/css/acceso/marca.css`
- `assets/css/editor/base.css`
- `assets/css/acceso/editor.css`
- `assets/css/editor/acceso-ajustes.css`
- `assets/css/editor/studio.css`

### index.html

Scripts en orden de carga:

- `assets/js/editor/modo-local.js`
- `assets/datos/config-publica.js`
- `assets/js/servicios/supabase-runtime.js`
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
- `assets/js/editor/puente-local.js`
- `assets/js/editor/ajustes-proyecto.js`
- `assets/js/editor/studio-politicas.js`
- `assets/js/editor/studio-operaciones.js`
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
- `assets/js/tramites/formularios-oficiales.js`
- `assets/js/tramites/bd02.js`
- `assets/js/tramites/busqueda-inteligente.js`
- `assets/js/tramites/buscador.js`
- `assets/js/tramites/dl01-interfaz.js`

Hojas de estilo en orden de carga:

- `assets/css/acceso/autenticacion.css`
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
- `assets/css/tramites/bd02.css`
- `assets/css/tramites/dl01.css`

## Módulos de código propio

| Archivo | Líneas | Funciones con nombre |
| --- | ---: | ---: |
| `assets/datos/config-publica.js` | 3 | 0 |
| `assets/datos/escuelas-chaco.js` | 2 | 0 |
| `assets/datos/formularios-pdf.js` | 58 | 0 |
| `assets/js/acceso/autenticacion.js` | 56 | 3 |
| `assets/js/acceso/editor.js` | 962 | 34 |
| `assets/js/acceso/ingreso.js` | 59 | 2 |
| `assets/js/acceso/marca.js` | 12 | 0 |
| `assets/js/acceso/visibilidad-clave.js` | 25 | 1 |
| `assets/js/calendario/calendario.js` | 988 | 22 |
| `assets/js/calendario/solicitudes.js` | 360 | 17 |
| `assets/js/core/cursos.js` | 45 | 4 |
| `assets/js/core/estado.js` | 4 | 0 |
| `assets/js/core/inicializacion.js` | 18 | 0 |
| `assets/js/core/mnc.js` | 72 | 7 |
| `assets/js/core/validacion-guiada.js` | 139 | 11 |
| `assets/js/documentos/acciones.js` | 16 | 3 |
| `assets/js/documentos/pdf-campos.js` | 65 | 2 |
| `assets/js/documentos/pdf-utilidades.js` | 28 | 6 |
| `assets/js/documentos/plantillas-dl01.js` | 3 | 0 |
| `assets/js/editor/acceso-ajustes.js` | 41 | 3 |
| `assets/js/editor/ajustes-proyecto-datos.js` | 58 | 3 |
| `assets/js/editor/ajustes-proyecto.js` | 133 | 4 |
| `assets/js/editor/comun.js` | 91 | 8 |
| `assets/js/editor/documentos.js` | 96 | 4 |
| `assets/js/editor/editor.js` | 1053 | 38 |
| `assets/js/editor/elementos.js` | 197 | 6 |
| `assets/js/editor/modo-local.js` | 3 | 0 |
| `assets/js/editor/puente-local.js` | 28 | 1 |
| `assets/js/editor/studio-directo.js` | 105 | 6 |
| `assets/js/editor/studio-guias.js` | 36 | 2 |
| `assets/js/editor/studio-operaciones.js` | 54 | 3 |
| `assets/js/editor/studio-politicas.js` | 22 | 2 |
| `assets/js/editor/studio.js` | 144 | 11 |
| `assets/js/interfaz/espacio-trabajo.js` | 91 | 3 |
| `assets/js/interfaz/inicio-local.js` | 10 | 0 |
| `assets/js/interfaz/navegacion.js` | 13 | 5 |
| `assets/js/interfaz/sesion.js` | 32 | 2 |
| `assets/js/perfil/contactos-instituciones.js` | 100 | 5 |
| `assets/js/perfil/datos-personales.js` | 96 | 12 |
| `assets/js/perfil/geografia.js` | 152 | 4 |
| `assets/js/perfil/instituciones.js` | 155 | 21 |
| `assets/js/perfil/nombres.js` | 6 | 2 |
| `assets/js/perfil/respaldos.js` | 36 | 8 |
| `assets/js/servicios/supabase-runtime.js` | 30 | generado |
| `assets/js/servicios/supabaseClient.js` | 69 | 3 |
| `assets/js/tema/controles.js` | 15 | 1 |
| `assets/js/tema/inicial.js` | 1 | 0 |
| `assets/js/tramites/ayuda.js` | 33 | 0 |
| `assets/js/tramites/bd02.js` | 1139 | 37 |
| `assets/js/tramites/buscador.js` | 110 | 7 |
| `assets/js/tramites/busqueda-inteligente.js` | 56 | 3 |
| `assets/js/tramites/catalogo-datos.js` | 14 | 0 |
| `assets/js/tramites/dj01-conflictos.js` | 146 | 9 |
| `assets/js/tramites/dj01-distribucion.js` | 64 | 3 |
| `assets/js/tramites/dj01-guia.js` | 122 | 6 |
| `assets/js/tramites/dj01-traslados.js` | 71 | 6 |
| `assets/js/tramites/dj01-zoom.js` | 31 | 3 |
| `assets/js/tramites/dj01.js` | 396 | 53 |
| `assets/js/tramites/dj02-base.js` | 188 | 24 |
| `assets/js/tramites/dj02-formulario.js` | 52 | 3 |
| `assets/js/tramites/dj02-plantilla.js` | 48 | 7 |
| `assets/js/tramites/dj02-registro.js` | 386 | 27 |
| `assets/js/tramites/dl01-interfaz.js` | 115 | 2 |
| `assets/js/tramites/dl01-pdf.js` | 211 | 11 |
| `assets/js/tramites/dl01-reglas.js` | 108 | 14 |
| `assets/js/tramites/formularios-oficiales-datos.js` | 1273 | 0 |
| `assets/js/tramites/formularios-oficiales.js` | 1230 | 49 |
| `assets/js/tramites/mnc-adaptadores.js` | 49 | 1 |
| `assets/js/tramites/ol01.js` | 441 | 31 |
| `assets/js/tramites/sc01.js` | 744 | 26 |
| `assets/js/tramites/solicitudes.js` | 120 | 7 |
| `supabase/migrations/202611130001_adc_tester_profiles.sql` | 36 | 0 |
| `tests/acceso-ajustes.test.cjs` | 33 | 0 |
| `tests/ajustes-proyecto.test.cjs` | 71 | 0 |
| `tests/arquitectura.test.cjs` | 20 | 0 |
| `tests/cursos.test.cjs` | 32 | 0 |
| `tests/dl01-interfaz.test.cjs` | 161 | 0 |
| `tests/editor-botones.test.cjs` | 49 | 0 |
| `tests/editor-comun.test.cjs` | 21 | 0 |
| `tests/editor-documentos.test.cjs` | 46 | 0 |
| `tests/editor-elementos.test.cjs` | 77 | 0 |
| `tests/formularios-oficiales.test.cjs` | 672 | 1 |
| `tests/geografia.test.cjs` | 60 | 0 |
| `tests/ingreso.test.cjs` | 63 | 0 |
| `tests/local-editor-bridge.test.cjs` | 40 | 0 |
| `tests/local-editor-ui.test.cjs` | 36 | 0 |
| `tests/mbit.test.cjs` | 145 | 0 |
| `tests/ol01-interfaz.test.cjs` | 63 | 0 |
| `tests/ol01-perfil.test.cjs` | 54 | 1 |
| `tests/pdf-blank-line.test.cjs` | 23 | 0 |
| `tests/pdf-campos.test.cjs` | 33 | 0 |
| `tests/publicacion.test.cjs` | 29 | 0 |
| `tests/studio-contrato.test.cjs` | 17 | 0 |
| `tests/studio.test.cjs` | 58 | 1 |
| `tests/supabase-auth.test.cjs` | 68 | 0 |
| `tests/supabase-config.test.cjs` | 13 | 0 |
| `tests/supabase-management.test.cjs` | 21 | 0 |
| `tests/supabase-rls.test.cjs` | 46 | 0 |
| `tests/support/ajustes.cjs` | 15 | 0 |
| `tests/support/demo-config.cjs` | 10 | 1 |
| `tools/ajustes-store.cjs` | 39 | 5 |
| `tools/auditar-arquitectura.cjs` | 73 | 3 |
| `tools/build.cjs` | 12 | 1 |
| `tools/configurar-supabase.cjs` | 78 | 5 |
| `tools/dev-server.cjs` | 28 | 1 |
| `tools/env.cjs` | 31 | 2 |
| `tools/extract-nomenclatura.py` | 108 | 0 |
| `tools/importar-ajustes.cjs` | 24 | 1 |
| `tools/local-editor-bridge.cjs` | 45 | 1 |
| `tools/publicar.cjs` | 38 | 2 |
| `tools/supabase-auth-settings.cjs` | 21 | 1 |
| `tools/verify-structure.cjs` | 46 | 0 |

## Referencias literales ausentes

Ninguna en el alcance del análisis.

## Límites

El grafo estático no resuelve destinos calculados, `onclick` heredados ni todos los accesos por variables. Las rutas funcionales se documentan en la auditoría; los archivos sin referencias literales no se borran automáticamente. `docs/structure-manifest.json` es una referencia histórica y no define por sí solo la arquitectura vigente.
