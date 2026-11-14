# Auditoría y refactorización de la arquitectura ADC

## Alcance y estado

Revisión del código propio, entradas HTML, carga de scripts y estilos, catálogos, almacenamiento, autenticación, documentos, editor visual, herramientas Node, pruebas y publicación. El inventario reproducible está en [arquitectura-inventario.json](arquitectura-inventario.json) y el orden de carga completo en [arquitectura-mapa.md](arquitectura-mapa.md). Las dependencias de terceros se inventarían por nombre; no se modifica ni se audita internamente cada línea de PDF.js, pdf-lib o Supabase. No se leen credenciales ni datos de usuarios.

La aplicación es una web estática modular con scripts clásicos y estado compartido, no una SPA con enrutador de framework. Las secciones se muestran/ocultan sobre `index.html`. El SDK de Supabase es la excepción compilada desde un módulo ES. No se migró a otro framework ni se cambiaron los recorridos visuales.

## Mapa por responsabilidad

| Capa | Archivos/directorios | Responsabilidad y contratos |
| --- | --- | --- |
| Entrada | `ADC_Ingreso_Editable.html`, `assets/js/acceso/`, `assets/css/acceso/` | Login, registro, ojo de contraseña, marca animada y temas. `autenticacion.js` adapta el formulario al servicio; el modo demo conserva su controlador histórico. |
| Sesión | `interfaz/inicio-local.js`, `interfaz/sesion.js` | Redirección inicial, sesión comprobada, separación de propietarios de borradores y cierre. `adc-preview=1` no autentica en modo real. |
| Base y estado | `core/estado.js`, `core/inicializacion.js`, `css/base.css` | Estado histórico global y arranque de perfil. Mantener identificadores y orden de inicialización. |
| Reglas transversales | `core/mnc.js`, `core/cursos.js`, `core/validacion-guiada.js` | MNC, ordinales académicos, avisos y continuación guiada. No duplicar estas reglas dentro de formularios nuevos. |
| Perfil | `perfil/*.js`, `css/perfil/`, `datos/escuelas-chaco.js` | Datos personales, instituciones/cargos, geografía, contactos y respaldos. `adc_v08` y borradores locales son contratos históricos. |
| Navegación y búsqueda | `interfaz/navegacion.js`, `tramites/catalogo-datos.js`, `busqueda-inteligente.js`, `buscador.js`, `ayuda.js` | Secciones, catálogo, códigos parciales MBIT y accesos a un mismo formulario. |
| Calendario | `calendario/*.js`, `css/calendario/` | Agenda y solicitudes; consume el estado del proyecto. |
| Formularios especializados | `tramites/dj01*.js`, `dj02*.js`, `ol01.js`, `sc01.js`, `dl01-*.js`, `bd02.js` | Reglas, perfil, borrador y documento específicos. DJ-01, DJ-02, OL-01, SC-01 y DL-01 continúan protegidos. |
| Motor genérico de documentos | `tramites/formularios-oficiales*.js`, `datos/formularios-pdf.js` | Esquemas del catálogo y lienzo compartido. DP-01 usa el modo sobre PDF original registrado; no se supone que todos los catálogos tengan ya esa calidad. |
| PDF y presentación | `documentos/*.js`, `assets/formularios/`, `vendor/pdf-lib/`, `interfaz/espacio-trabajo.js` | Plantillas, utilidades, colocación de campos y ajustes de vista. `pdf-campos.js` conserva el PDF original y ajusta el texto hasta el mínimo acordado. |
| Editor visual | `editor/comun.js`, `editor/*.js`, `acceso/editor.js`, `css/editor/` | Utilidades comunes, dos motores con variantes, imágenes/PDF, capas y guardado visual. |
| Servicio remoto | `servicios/supabaseClient.js` → `supabase-runtime.js` | Único cliente oficial, autenticación y perfil mínimo de tester. RLS reside en `supabase/migrations/`. No equivale a sincronización del perfil docente. |
| Guardado local | `tools/ajustes-store.cjs`, `local-editor-bridge.cjs`, `importar-ajustes.cjs` | Un único almacenamiento versionable, con respaldo y escritura atómica. HTTP restringido a loopback/orígenes autorizados. |
| Construcción y publicación | `build.cjs`, `publicar.cjs`, `config/publicacion.json`, `.github/workflows/pages.yml` | Compilar SDK, filtrar secretos y publicar sólo el artefacto web. `log-in` es la rama del piloto. |
| Soporte | `tests/`, `docs/`, `tools/auditar-arquitectura.cjs` | Regresión funcional, reglas de arquitectura y mapa reproducible. |

## Rutas reales

| Acceso | Destino / implementación |
| --- | --- |
| `/` o `/index.html`, bajo el prefijo de Pages | La guardia de sesión redirige a `ADC_Ingreso_Editable.html` si no hay cuenta verificada por el SDK. |
| `ADC_Ingreso_Editable.html` | Login/registro. Al ingresar se navega a `index.html` del mismo directorio. |
| Mi perfil docente | Sección `#profile`, mediante `tab('profile')`. |
| Mis trámites | `#tramites`; categorías y búsqueda deben converger en las mismas acciones. |
| DL-01 | Sección `#license`, reglas y adaptadores `dl01-*`. |
| DJ-01 / DJ-02 | `#dj` / `#dj02`, módulos especializados. |
| OL-01 / SC-01 / BD-02 | `#adcOL` / `#adcSC01` / `#adcBD02`. |
| Otros formularios | `#adcOfficialForm`, con identidad `data-adc-form-id`. |
| Calendario | `#adcCalendar`, `tab('calendar')`. |
| `localhost:3005/session` | Sesión efímera del puente, requiere origen local autorizado. |
| `localhost:3005/commit-local` | Guardar diseño visual en archivos, no un commit de Git. |

No se crearon URLs de framework para estas secciones: hacerlo cambiaría los contratos existentes. Las rutas anteriores son direcciones HTML reales o secciones internas, según se indica.

## Duplicidades detectadas y acciones implementadas

### 1. Dos motores visuales casi iguales

Antes de esta refactorización, una comparación literal por líneas encontró 952 líneas comunes entre los motores de ingreso (1025 líneas) y principal (1116 líneas). No significa que puedan intercambiarse: difieren en anotaciones de líneas, colocación de botones, overlays, áreas de documento, borradores y arranque.

**Implementado:** `assets/js/editor/comun.js` extrae el registro de elementos y referencias, estado original de estilos/details, reglas de edición y contención, enlaces seguros, límites numéricos, saneamiento de HTML, construcción de secciones, geometría y paleta. Ambos motores llaman las mismas funciones; cada pantalla conserva su propio estado. Se retiran las copias originales sin cambiar IDs ni claves de borradores.

**Pendiente deliberado:** operaciones y gestos con diferencias reales continúan en cada motor. Una fusión completa requiere parametrizar esas diferencias y ampliar pruebas de líneas/overlays; no se reemplazó todo por un motor único afirmando equivalencia inexistente.

### 2. Estilos repetidos de Ajustes

Se encontraron 49 líneas iniciales idénticas en ambas hojas de estilo.

**Implementado:** pasan a `assets/css/editor/base.css`, cargado antes de cada variante. Los archivos originales mantienen las reglas que sí difieren. Se conserva orden de cascada, medidas, colores y selección azul.

### 3. Escritura del diseño duplicada en CLI y servidor

El importador y el puente validaban, mezclaban y escribían el mismo registro con implementaciones separadas. El importador tenía una protección de rutas y temporales menos completa que el puente.

**Implementado:** `tools/ajustes-store.cjs` centraliza validación, mezcla por pantalla, revisión, ruta fija, respaldo y escritura atómica. El puente conserva su HTTP/token/origen; el CLI conserva su interfaz y `--check`. No se ejecuta Git. El importador también obtiene respaldo y comprobación de modificaciones concurrentes durante la escritura.

### 4. Consulta de perfil mínimo repetida

El servicio repetía la selección de columnas por ID y verificaba dos veces la cuenta al guardar el nombre del tester.

**Implementado:** helper privado `ensureTesterProfile()` y constructor de consulta compartido en el servicio existente. `profile()` y `saveTesterName()` reutilizan esa lógica después de verificar al usuario. Se mantienen columnas, manejo de creación simultánea, errores y RLS; no se cambió la base remota.

## Hallazgos pendientes, priorizados

| Prioridad | Evidencia / impacto | Recomendación |
| --- | --- | --- |
| Alta | Scripts clásicos comparten `$`, `inst`, `tab`, `render` y funciones de formularios; `core/inicializacion.js` envuelve `render`. Un cambio de orden puede romper módulos aunque no cambie la UI. | Migrar por adaptadores explícitos, manteniendo temporalmente la API global. Agregar pruebas de dependencias antes de retirar globals. |
| Alta | Plantillas incrustadas agrandan módulos: OL-01 ronda 2 MB, `plantillas-dl01.js` 470 KB y DJ-01 449 KB en el inventario inicial; tamaño de archivo no equivale a peso de lógica. | En una fase autorizada para esos formularios, extraer recursos binarios inmutables a `assets/formularios/` con verificación visual/hash. No borrar ni mover ahora los formularios protegidos. |
| Alta | `formularios-oficiales.js` reúne render, perfil, borrador, repetibles, validación y PDF en más de 1200 líneas. | Separar adaptadores internos por responsabilidad conservando el lienzo, esquemas y el contrato del catálogo; hacerlo formulario por formulario con pruebas. |
| Media | Persistencia del perfil y de formularios usa múltiples claves locales y particularidades de cada borrador. | Crear repositorios por dominio con migraciones versionadas; no hacer un reemplazo global de `localStorage` ni guardar datos docentes en Supabase sin acuerdo. |
| Media | Utilidades de nombres, fechas, escape y normalización aparecen en dominios diferentes. Las variantes no siempre tienen la misma semántica. | Reutilizar `core/cursos.js` y reglas existentes; extraer helpers nuevos sólo con casos de prueba que distingan fechas civiles, plazos y códigos. |
| Media | Hay más de un formato/flujo de exportación PDF. | Reutilizar `pdf-campos.js` para plantillas preparadas y los adaptadores MNC; preservar los flujos especializados aprobados. No unificar por fuerza una plantilla dibujada con una oficial de fondo. |
| Media | `docs/estructura.md` conservaba párrafos demo que podían interpretarse como autenticación vigente. | Aclarar explícitamente que el acceso sin datos corresponde sólo a demo; Supabase es el modo del piloto. |
| Media | `docs/structure-manifest.json` conserva hashes de una extracción antigua. | Mantenerlo como referencia histórica. Usar el inventario y `architecture:check` para la estructura actual. |
| Baja | Existen strings visuales/paneles similares en los dos HTML. | Un componente de panel podría reducir duplicación, pero cambiar su creación altera índices históricos `base-*`. Conservar hasta migrar referencias y respaldos con pruebas específicas. |

Estos son riesgos o deuda arquitectónica; no se presentan como fallos funcionales reproducidos cuando no hay una prueba que los demuestre.

## Contrato para futuras secciones

1. Buscar primero servicio, regla y componente existentes en este mapa.
2. Agregar datos al catálogo y usar el motor adecuado; no copiar un formulario entero para un caso parecido.
3. Mantener datos, lógica de negocio, UI y efectos de almacenamiento separados. Servicios no deben depender del panel visual.
4. Conservar estilos compartidos y tokens. Las variantes sólo agregan diferencias necesarias.
5. Mantener rutas relativas compatibles con Pages, IDs, borradores y APIs públicas.
6. Añadir pruebas del contrato nuevo y actualizar el mapa. `AGENTS.md` registra estas reglas para futuras tareas en este repositorio; no es una memoria automática fuera de él.

## Verificación y límites

Verificación realizada: **71 pruebas aprobadas, cero fallos**, ejecutando `npm test`. Incluye editor de ambas pantallas, gestos, documentos, guardado directo y conflictos, esquema de 26 formularios, perfil/precarga, navegación, búsqueda MBIT, MNC y PDF, autenticación con SDK y API simulada, y RLS sobre PostgreSQL aislado. Se añadió una prueba de arquitectura y otra del registro/saneamiento compartido. El cliente Supabase se recompiló correctamente con `npm run build`.

El inventario no detectó referencias literales ausentes. Esto no sustituye las pruebas de rutas calculadas, cubiertas parcialmente por las pruebas funcionales. No se probó una publicación nueva en GitHub Pages ni una cuenta real remota en esta tarea: la web online no se actualizó.

No se borraron archivos por aparentar falta de uso: el análisis literal no prueba que un módulo dinámico esté muerto. No se cambiaron datos remotos, políticas RLS ni proveedores de correo. No se hizo commit ni push. Los cambios locales anteriores, incluidos el puente y la documentación de Ajustes, permanecen conservados.
