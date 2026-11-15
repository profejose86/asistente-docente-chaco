# Revisión estructural — 14 de noviembre de 2026

## Resultado y alcance

La estructura actual no justifica borrar rutas ni fusionar módulos de forma automática. El inventario final recorre 277 archivos, con 217 módulos de texto y 135 archivos JavaScript propios (incluye este informe nuevo). Se excluyen dependencias instaladas, artefactos, temporales, material de trabajo y variables de entorno. Los 35 archivos de proveedores se inventarían por nombre, sin auditar internamente sus bibliotecas.

El análisis estático ampliado encontró **cero referencias ausentes, cero cargas repetidas de scripts/links dentro de cada entrada, cero rutas absolutas desde la raíz en las referencias examinadas, cero colisiones de nombres por mayúsculas y cero grupos de recursos propios idénticos por SHA-256**. Esto no prueba que todas las rutas calculadas sean correctas ni que no exista código equivalente escrito de otra manera.

## Arquitectura y recorridos

| Área | Diagnóstico | Criterio de conservación |
| --- | --- | --- |
| Entradas y sesión | Dos HTML con responsabilidades distintas; las redirecciones de acceso/sesión usan URL relativa a la ubicación actual. | Preservar ambos HTML y el prefijo de Pages. No son rutas duplicadas. |
| Navegación | `interfaz/navegacion.js` controla secciones mediante `tab()`, con efectos específicos al abrir perfil, calendario y formularios. | Los distintos accesos a un formulario deben converger en la misma acción. No reemplazar este contrato por un enrutador. |
| Catálogo y búsqueda | Catálogo, metadatos MBIT y esquemas aportan información complementaria. | No eliminar entradas porque compartan destino: varios motivos abren DL-01 con contexto distinto. |
| Formularios | Motor común y adaptadores sobre PDF conviven con implementaciones especializadas. | Reutilizar el motor para nuevas incorporaciones; respetar las cinco implementaciones protegidas. |
| Editor | Existe un módulo común, pero acceso y aplicación conservan motores con diferencias reales. | Las primeras 80 ventanas duplicadas detectadas pertenecen a esos dos motores. Es evidencia de similitud, no de intercambiabilidad ni un inventario completo de duplicación. |
| Persistencia y sincronización | Fachada por usuario, repositorio versionado y cliente Supabase compartido. El repositorio invalida operaciones al cambiar de cuenta y distingue conflictos. | Mantener formatos, consentimiento, outbox y CAS. Esta revisión no modifica datos ni políticas remotas. |
| Publicación | Workflow desde `main`, construcción de artefacto web y control de contenido privado. | No servir ni publicar la raíz administrativa como sitio. No hubo despliegue en esta revisión. |

## Prioridades técnicas

1. **Peso de carga de la aplicación.** `index.html` declara 72 scripts y 35 hojas de estilo: 5.560.531 bytes de JavaScript y 1.259.207 bytes de CSS, sumados desde disco. Acceso declara 24 scripts y 8 hojas: 424.667 y 32.372 bytes respectivamente. Son tamaños sin compresión; no son tiempos de descarga ni mediciones de red. OL-01 concentra 2.066.947 bytes de JS y 924.997 de CSS; escuelas, 822.068 bytes; plantillas DL-01, 470.132 bytes; DJ-01, 449.304 bytes. Recursos incrustados explican parte del tamaño. Extraer o cargar bajo demanda requiere una tarea específica con equivalencia visual y preservación del orden; los formularios protegidos necesitan pedido explícito.
2. **Acoplamiento por globales y orden.** `core/inicializacion.js` reemplaza `render` conservando la función previa y ejecuta arranques inmediatamente. La navegación invoca funciones de varios dominios. Antes de modularizar más, documentar y probar esos contratos; mover scripts puede romper el arranque aunque sus rutas existan.
3. **Motor común extenso.** `formularios-oficiales.js` mantiene 1.264 líneas con edición, perfil, repetibles, borrador y PDF. Dividir por responsabilidad sólo cuando una modificación concreta lo requiera y manteniendo su API pública. El catálogo de datos separado ya evita copiar el motor por formulario.
4. **Similitudes de editores.** Continuar usando `editor/comun.js`; cualquier extracción adicional debe distinguir gestos, overlays, índices históricos y arranque por pantalla. No se eliminó ninguna de estas variantes.
5. **Documentación desactualizada.** Las descripciones de DP-01 como único PDF preparado quedaron atrás: el registro actual también incluye Reubicación, Traslado transitorio, CF-01 y SR-01. Se actualizaron las referencias principales sin reescribir documentos históricos.

## Mejoras realizadas

Se amplió `tools/auditar-arquitectura.cjs` sin alterar la interfaz de la aplicación. Ahora reconoce comillas simples y dobles, omite comentarios HTML/CSS, inspecciona enlaces de navegación, recursos CSS y literales completos `assets/...` en scripts web. Normaliza consultas y fragmentos para detectar una misma carga con versiones diferentes, comprueba nombres con su capitalización exacta y detecta recursos propios idénticos.

`architecture:check` falla ante referencias ausentes, cargas repetidas, rutas desde la raíz o colisiones de mayúsculas. Los hashes idénticos se informan para revisión, sin borrar archivos. Se agregó una prueba aislada con rutas faltantes, CSS, nombres codificados, referencias externas y recursos idénticos. Se regeneraron mapa e inventario.

## Verificación y límites

La suite completa terminó con **111 pruebas aprobadas, cero fallos y cero omisiones**. La prueba de arquitectura ampliada se verificó además por separado: **2 pruebas aprobadas** con la versión final del auditor. `architecture:check` y `git diff --check` también finalizaron correctamente. Se usó `tools/npm-local.cmd` porque npm no está en PATH. La suite incluye construcción del artefacto publicable; no hubo cambios de fuente del cliente Supabase.

Las pruebas se ejecutan localmente, con Chrome y servicios simulados o bases aisladas según cada caso. No equivalen a una prueba online con una cuenta real ni a validación administrativa de los documentos. No se modificaron plantillas protegidas, IDs, almacenamiento, orden de scripts, ramas ni servicios remotos.

El escáner es deliberadamente estático: no interpreta JavaScript ni resuelve plantillas como `pagina-${page}.png`, referencias por variables, todos los imports posibles o eventos heredados. Sus contadores se refieren exclusivamente a referencias reconocidas. No se etiquetaron archivos como muertos a partir de la ausencia de referencias.
