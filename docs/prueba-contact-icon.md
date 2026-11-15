# Prueba aislada del componente de cuenta

## Integración en la entrada normal — 15/11/2026

El avatar y el selector de tema aprobados se integraron en la página normal. `interfaz/cuenta.js` presenta las acciones existentes de `interfaz/sesion.js` y `adcSyncUI` dentro del menú. Usa la inicial de la cuenta verificada, texto seguro y los identificadores `adcProfileBtn`, `adcProfileMenu`, `adcLogoutBtn` y `adcSyncBtn`. La demo identifica expresamente su condición. La apariencia responsive conserva el círculo de 55 × 49 px, letra de 40 px, fondo exterior transparente y flecha inferior.

Login y aplicación cargan los mismos `tema/inicial.js`, `tema/controles.js` y `interfaz/selector-tema.css`. El marcado del selector coincide en ambas entradas. Se reutiliza la clave existente `adc-login-theme`; si aún no existe, se lee la preferencia histórica `adc_theme`. Esta última permanece conservada y no recibe nuevas escrituras. El controlador de tema duplicado del login y los estilos antiguos del selector principal se retiraron.

En la aplicación, el contenido aprobado del selector se conserva en un `template` y se presenta en `DOMContentLoaded`, después del registro del editor. El marcado inicial histórico se mantiene para conservar los índices `base-*` de todos los controles posteriores. La cuenta también se monta después de ese registro.

`tests/cuenta-online.test.cjs` prueba la entrada normal con prefijo `/adc/`, ambos temas, teclado, apertura/cierre, transparencia, ausencia de solapamientos, persistencia entre login y aplicación, preferencia histórica y anchos de 280 a 1920 px. Las pruebas de sesión y sincronización recorren las acciones desde el nuevo menú usando el SDK con servicios aislados.

La suite completa de esta integración terminó con 117 pruebas aprobadas, cero fallos y cero omisiones. Incluye los editores históricos y las verificaciones de documentos, sesión y sincronización. También se regeneró el inventario y pasó `architecture:check`.

## Integración de Datos personales en la página normal

`assets/js/perfil/presentacion.js` y `assets/css/perfil/datos-personales.css` presentan la distribución aprobada en `index.html`. Se ejecuta después del registro histórico del editor, moviendo los controles existentes y conservando sus IDs y listeners. La prueba de Contact-Icon reutiliza estos archivos y conserva únicamente su bloqueo de navegación aislado. La página normal mantiene la navegación y las revisiones guiadas existentes de cada formulario.

Nacimiento completo y celular se guardan en `adc_v08.perfilDJ`, con las funciones existentes de `datos-personales.js` y `respaldos.js`. Los años anteriores sin día/mes permanecen conservados y se informa que falta completar la fecha. El año entregado a declaraciones se normaliza a cuatro dígitos, sin separador de miles. El título visible de hasta dos líneas conserva su valor completo y el control histórico `perfilTitulo`. El teléfono fijo anterior permanece separado del celular y se conserva para sus consumidores existentes.

Se mantienen las etiquetas y separaciones aprobadas, el título de 12 cm en escritorio, asteriscos junto a las leyendas y el bloque de domicilio reorganizado. La precarga de correo verificado completa sólo un campo vacío y dispara el guardado delegado existente. No introduce almacenamiento ni clientes adicionales.

`tests/perfil-normal.test.cjs` comprueba la entrada normal, filas alineadas, ambos temas y anchos de 320 a 1440 px, fechas válidas e inválidas, respaldo, recarga, título completo, celular, fijo histórico, IDs únicos, perfil anterior con sólo año y precarga SC-01. La prueba de sincronización también verifica nacimiento y celular entre dos contextos aislados de la misma cuenta.

La suite completa de la integración del perfil terminó con 118 pruebas aprobadas, cero fallos y cero omisiones. Incluye los editores históricos, documentos PDF y las comprobaciones de sesión, aislamiento y sincronización con servicios simulados o bases locales de prueba.

## Registro histórico de la prueba aislada — aclaraciones del 15/11/2026

El perfil y la vista aislada se versionan en `Contact-Icon`. `Forms-testing` utiliza esa base y añade los formularios preparados. Subir estas ramas no integra ni publica cambios en `main`. La vista se abre con `node tools/contact-icon-preview.cjs` en `http://127.0.0.1:8891/index.html?adc-preview=1`.

- Nacimiento se edita como `dd/mm/aaaa`, se conserva en el agregado `adc_v08` y se recupera después de recargar o importar un respaldo. La fecha válida se serializa como ISO; fechas incompletas se conservan como borrador y se marcan inválidas. La UI valida fechas imposibles y futuras. El botón manual no confirma guardado de una fecha inválida.
- El año se obtiene de nacimiento y alimenta `perfilClase`/`perfilDJ.clase` para los consumidores existentes. Estos identificadores son adaptadores internos: no hay un segundo editor visible ni una leyenda «Clase» en la vista del perfil o editor compartido. Los respaldos antiguos conservan su año y muestran una indicación para completar día/mes, sin inferirlos.
- Las etiquetas actuales son Sexo, Correo electrónico, Celular, Título que posee, N.º de registro, Otorgado por, Antigüedad docente e Inicio de actividad docente (opcional). El celular se guarda en `perfilDJ.celular`; el fijo histórico conserva su dato y sus conexiones, dentro de un detalle que aparece cuando hay valor previo. No se convierte un fijo en celular.
- El correo de la cuenta verificada completa sólo un campo vacío. No reemplaza correcciones del docente; comprueba la cuenta y el espacio de almacenamiento antes de aplicar la respuesta asíncrona. En esta demo se prueba mediante servicio simulado.
- Título usa una caja de 12 cm en escritorio y el registro ocupa el ancho restante de esa fila con separación de 12 px. El título largo utiliza hasta dos renglones visibles y conserva todo el texto, con desplazamiento interno si excede ese espacio. En móvil las cajas se apilan.
- Las marcas obligatorias se muestran junto a las leyendas. Título, registro, otorgante y antigüedad deben estar completos antes de salir del perfil hacia otras solapas en esta vista. Se reutiliza `adcGuidedValidation.createBlocking`; guardar/exportar borradores incompletos sigue permitido. Inicio de actividad es opcional; domicilio y número de calle no tienen asterisco en el perfil. Esto no elimina requisitos propios de documentos protegidos.
- Leyendas y cajas tienen separación uniforme de 4 px; filas, 10 px. La caja visible del título se vincula al control original `perfilTitulo`, conservando la precarga de documentos. El domicilio usa «Depto., casa, UF y N.º» y conserva los datos existentes.

Los cambios funcionales reutilizan `perfil/datos-personales.js` y `perfil/respaldos.js`. La disposición visual permanece en el servidor/fixtures de preview; `index.html` y los módulos de formularios protegidos permanecen intactos. No se introdujo un cliente Supabase, persistencia alternativa ni migración remota.

Las pruebas verifican fechas imposibles/bisiestas/futuras, año recibido por `djPerfilPage2`, precarga SC-01, respaldo, restauración de perfiles antiguos, recarga con fecha/celular/título completo, correo de cuenta sin pisar correcciones, bloqueo al salir, temas y alineación en varios anchos. La suite completa y la prueba específica se ejecutan localmente; no equivalen a una prueba online con datos reales.

## Registro de etapas anteriores

Las notas siguientes describen etapas anteriores: las limitaciones antiguas de fecha sólo en memoria y teléfono fijo visible fueron superadas por el estado vigente indicado arriba.

Rama local: `Contact-Icon`. Git no admite espacios en nombres de ramas. No se integró el componente a `index.html`, no se cambió `main` y no se realizó commit ni push. Los cambios pendientes de la auditoría anterior se conservaron.

Abrir `tests/fixtures/contact-icon.html` en el navegador para revisar el ejemplo. Conserva el HTML, CSS y comportamiento suministrados; únicamente elimina los escapes del mensaje, coloca CSS/JS en sus etiquetas y agrega un documento y contenedor de prueba alineado a la derecha. No carga servicios, sesión ni datos reales.

Prueba automatizada: `node --test tests/contact-icon.test.cjs`, usando Chrome mediante Playwright instalado en este equipo.

Verificado: estado inicial oculto; apertura y cierre repetidos; `aria-expanded` y `aria-controls`; Enter/Espacio; toque; menú dentro del ancho del contenedor de prueba a 320, 390, 768 y 1440 px; ausencia de errores JavaScript y peticiones de red. Los botones internos conservan el estado y no navegan ni cierran una sesión.

Resultado: una prueba aprobada y `architecture:check` correcto. Se inspeccionó además una captura del ejemplo.

Límites observados del código original:

- Sincronización y cierre de sesión carecen de manejadores; sólo está implementado el despliegue del menú.
- Escape y clic exterior no cierran el panel.
- El título y el correo heredan el color negro del navegador sobre fondo azul oscuro: contraste insuficiente en esta vista aislada.
- El botón toma su apariencia nativa, con avatar y flecha en líneas distintas; falta un nombre accesible descriptivo de su acción.
- La prueba de ancho corresponde al contenedor alineado a la derecha. El resultado dentro de la cabecera real y con sus estilos todavía no fue probado.

No se corrigieron estos puntos para mantener el ejemplo original como objeto de prueba. Una integración futura debe reutilizar la sesión y sincronización existentes (`adcAuth` y adaptadores), respetando los contratos de la aplicación.

## Vista en la web, ajustada a la referencia

`node tools/contact-icon-preview.cjs` sirve la aplicación en `http://127.0.0.1:8891/index.html?adc-preview=1`, con configuración demo sólo en memoria. No cambia el HTML principal ni la configuración de producción. La cuenta se inserta al terminar la carga histórica del editor y queda fija en la esquina superior derecha de la ventana, fuera de la cabecera. El menú está alineado a la derecha, adapta ancho/alto y no queda recortado.

Esta vista reutiliza directamente el HTML del selector de `ADC_Ingreso_Editable.html`, sus reglas de `assets/css/acceso/ingreso.css` y el bloque de tema de `assets/js/acceso/ingreso.js`. Sirve ese bloque en lugar del controlador de tema principal, preservando la secuencia de scripts y el ID `adcThemeSwitch`. Usa únicamente la clave existente del login `adc-login-theme` en el origen aislado de prueba; no escribe `adc_theme` ni crea persistencia nueva. Se ajusta la especificidad del CSS extraído para conservar su apariencia frente a los estilos de la página principal.

Los ajustes visuales y de accesibilidad de esta vista están en `tests/fixtures/contact-icon-web.css` y el servidor de prueba: cuenta con nombre accesible, Escape devuelve el foco, clic exterior cierra el panel y colores legibles según tema. El ejemplo original sigue intacto como referencia. Las acciones internas continúan sin conectar a servicios reales.

`tests/contact-icon-web.test.cjs` verifica ambos temas a 320, 390, 600, 768, 1024 y 1440 px; esquina de ventana, separación respecto al título/selector, panel dentro del viewport y sin elementos que lo tapen, teclado, ARIA, persistencia del tema del login y ausencia de peticiones externas. Se inspeccionaron capturas de escritorio y móvil. Los resultados son locales y no representan una publicación online.

### Ajuste responsive y cierre de sesión

El botón de cuenta conserva sólo el círculo y la flecha, con fondo, borde y sombra transparentes. Mantiene un contorno visible al navegar con teclado. Por el ajuste posterior solicitado, el círculo mide 60 × 60 px en todos los tamaños de pantalla y se reserva una franja superior para evitar el solapamiento con toda la cabecera, incluso cuando el editor histórico aplica ajustes de espaciado. En escritorio se conserva la ubicación aprobada.

La prueba ahora cubre 13 anchos entre 280 y 1440 px en ambos temas, incluyendo los límites de los media queries. Comprueba además transparencia y separación de la caja completa de la cabecera en pantallas pequeñas.

Por pedido posterior, Cerrar sesión deja de ser meramente visual en esta vista: en demo vuelve al login del mismo servidor; si hay un adaptador configurado, detiene la sincronización e invoca `adcAuth.signOut()` antes de navegar. Ante error conserva la pantalla, informa el fallo y permite reintentar. La ruta de login se sirve con configuración demo, sin conectar producción. Se verificaron el caso demo y los casos de éxito/error mediante un adaptador simulado; no se cerró una cuenta remota real. No hay un cambio en el servicio de autenticación de producción.

Mis datos / sincronización queda deshabilitado con una indicación de ruta pendiente. Las cuatro pruebas relacionadas y `architecture:check` pasaron. La fuente del login, los formularios y `index.html` permanecen sin modificaciones.

## Distribución de Datos personales
La vista aislada alinea las cajas de cada fila con altura de 42 px y espacio uniforme para leyendas y marcas de pendiente. Se conservan IDs, valores, avisos y lógica de nombres. Se muestra Apellido/s y Nombre/s con ejemplos Pérez y Juan Pablo. Clase se presenta como Año de nacimiento porque su contrato guarda sólo el año; no se convierte a fecha completa. La prueba verifica alineación a 900/1440 px, alturas en móvil, avisos al enfocar, composición del nombre y conservación del año con su formato histórico. Se inspeccionó la captura del perfil. No se modifican módulos de formularios ni index.html.


Ajuste posterior: el campo visible pasa a Fecha de nacimiento, con entrada dd/mm/aaaa y validación de fecha civil (incluye años bisiestos). El año se transmite al campo histórico perfilClase sin cambiar su ID ni formato. La fecha completa permanece sólo en memoria en esta previsualización: guardado, respaldo y sincronización de día/mes todavía no están integrados. No se infiere día ni mes de los años previamente guardados.


### Reorganización del perfil según la referencia
Se mueven los labels y controles existentes después del registro del editor, preservando IDs y listeners. Orden: nombres/DNI; fecha/sexo; correo/teléfono fijo; título/registro; otorgado por; antigüedad/inicio. Domicilio y localidad pasan al fieldset existente con filas de 6+6, 3+3+6 y 5+2+5 columnas, y una columna en móvil. Se compactan leyendas, separación de filas y margen del bloque de domicilio. No se inventa un celular ni se elimina el teléfono fijo compartido. Las pruebas verifican alineación, IDs únicos, respaldo validado y recuperación por data/applyData, geografía y precarga real de los controles de SC-01, sin modificar su módulo protegido. La fecha completa continúa sólo en memoria como se documentó anteriormente.
