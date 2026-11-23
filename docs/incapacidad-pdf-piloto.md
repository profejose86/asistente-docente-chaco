# Solicitud de beneficio de incapacidad y visor piloto

La ficha `incapacidad` muestra el título «Formulario de Solicitud de Beneficio de Incapacidad». Conserva su ID, las claves de campos y `adc-official-form-incapacidad-draft-v1`. Se reutilizan el catálogo, el lienzo de `formularios-oficiales.js`, MNC, validación guiada, borradores y `pdf-campos.js`.

## Original y edición

`assets/formularios/Incapacidad.pdf` es una copia íntegra de `materiales/33-SOLICITUD-del-Beneficio-de-Incapacidad-Total-y-Permanente.pdf`. SHA-256 `485c8224765c7a5e8b5edadb458618307cb329a98691fce543d6a7742cbc2ce0`. Tiene una página de 612,12 × 1008,12 puntos y carece de campos AcroForm originales. Su imagen de fondo se renderizó a doble resolución. La exportación agrega exclusivamente los datos al PDF original.

Los controles cubren identidad, nacimiento, organismo y servicio, ocupación, función, capitales, domicilio, lugares y fechas de solicitud y certificación. Apellido, nombres, DNI y domicilio reutilizan la precarga de perfil existente. Los importes se ingresan expresamente. Las firmas, sellos e impresión digital se realizan sobre el impreso. Los valores históricos de esos campos y de las manifestaciones libres se conservan en el borrador y se muestran como complementos para revisión.

Por autorización posterior del usuario, el `19` preimpreso del nacimiento se oculta mediante la superposición `replacePrintedYear` y se reemplaza visualmente por puntos. El año completo se presenta centrado en su casillero, tanto en pantalla como en la vista preliminar y el PDF. Se verificaron 1986 y 2001. El archivo PDF base conserva su hash original y las cajas mantienen sus coordenadas y dimensiones. No se inventa el día ni el mes a partir de un año aislado.

## Inspección de visores existentes

| Implementación | Presentación y navegación |
| --- | --- |
| DJ-01 | Hoja HTML con controles propios de escala y barra que aparece al interactuar. `dj01-zoom.js` administra su visibilidad. |
| DJ-02 | Hoja HTML `.dj02-paper`, escala CSS y ajuste compartido en `interfaz/espacio-trabajo.js`. |
| OL-01 | Papel propio `.adc-ol-paper` y recursos oficiales, escala CSS y contenedor desplazable. |
| SC-01 | Imagen de la plantilla con controles posicionados, salida PDF e iframe para presentación. |
| BD-02 | Dos imágenes oficiales y controles en puntos, `transform:scale`, tamaño desplazable e iframe para salidas. |
| DL-01 | Implementación específica con sus adaptadores de plantilla, reglas y generación. |
| Motor de formularios oficiales | HTML editable sobre imagen original y canvas de valores, escala CSS visual y PDF mediante pdf-lib. |
| Editor de documentos | Imágenes y PDF multipágina, geometría propia y protección de iframes con escudo de edición. |

El piloto usa el motor de formularios oficiales y sus coordenadas. No sustituye la presentación de los otros documentos.

## Navegación del piloto

`assets/js/documentos/visor-pdf.js` expone `adcPdfViewer.create`. Recibe el contenedor y adaptadores de escala y ajuste del motor. Se crea una sola instancia y se habilita únicamente con `smartViewer:true` en la configuración de incapacidad. Las demás fichas mantienen sus controles existentes.

La barra inferior contiene menos, deslizador 25–200 %, porcentaje, más, ajuste a pantalla, ajuste al ancho y pantalla completa. Los botones cambian diez puntos porcentuales. La barra vertical sincroniza un rango accesible con el recorrido real. El contenedor reserva espacio para ambas barras, conserva el desplazamiento nativo y adapta sus controles a móvil. La escala al ancho se recalcula al cambiar las dimensiones. El ajuste a pantalla considera ancho y altura.

La rueda normal aplica zoom alrededor del cursor. Ctrl+rueda conserva el zoom del navegador. El arrastre con mouse funciona en zonas libres, excluye controles y selección de texto, y se suspende al activar el editor de diseño. Un dedo usa desplazamiento nativo. Dos dedos sobre una zona libre aplican zoom interno y traslado del centro del gesto cuando el navegador entrega los eventos táctiles. El zoom del navegador sigue disponible mediante sus controles, Ctrl+rueda y gestos fuera de la hoja. No se cambia la etiqueta viewport ni se impone un máximo de zoom del navegador.

Las barras aparecen al interactuar y se ocultan después de 1,7 segundos, conservando visibilidad con foco, hover o arrastre activo. Se respeta movimiento reducido. Pantalla completa usa la API nativa y ofrece un modo ampliado cuando esa API está ausente o falla. Escape cierra el modo ampliado y devuelve el foco al control.

## Verificación y extensión

### Ampliación de pantalla completa del 22/11/2026

Por pedido explícito del propietario, INCAPACIDAD activa `doubleActivateFullscreen`, `toggleFullscreenOnDoubleActivate` y `floatingFullscreen` del visor existente. El doble clic sobre el fondo entra y sale de pantalla completa; los campos editables continúan excluidos. El botón de 44 × 44 px queda flotante y visible arriba a la derecha, alterna Maximizar/Restaurar y conserva acceso por teclado, temas y salida con Escape. No se modifica el PDF, sus coordenadas ni los borradores. La configuración corresponde a INCAPACIDAD tanto en el acceso habitual como en el piloto local, sin publicación nueva.

`tests/motor01-piloto.test.cjs` verifica el doble clic en modo nativo y alternativo, el botón, la exclusión de campos, foco/Enter/Escape, posición y recepción del clic a 390/1440 px en ambos temas y conservación de datos. Las tres pruebas de ese archivo aprobaron. Los toques se emulan; no acreditan un dispositivo físico.

### Verificaciones históricas anteriores a la ampliación

`tests/incapacidad-pdf.test.cjs` usa Chrome con prefijo `/adc/`. Comprueba precarga, edición, MNC, borradores nuevos e históricos, ambos temas, anchos 320/390/1440, botones, teclado, límites de escala, rueda, arrastre horizontal/vertical, barra sincronizada, ocultamiento y foco, pantalla completa nativa y alternativa, y reaperturas sin listeners duplicados. Los gestos de dos dedos y el desplazamiento con un dedo se ejercitan mediante eventos táctiles CDP de Chrome. Una copia de configuración de dos páginas existe sólo dentro de la prueba para comprobar navegación multipágina.

La descarga se abre con pdf-lib y se comparan las instrucciones de texto exportadas al 100 % y al 200 %. Se conserva una página con las dimensiones originales. La impresión se comprueba sustituyendo la ventana de impresión por un receptor de prueba. El PDF completado se renderiza para inspeccionar alineación. No se ha probado impresión física, trackpad físico, dispositivos móviles reales, Safari ni una cuenta online. La interacción táctil real requiere revisión del piloto antes de ampliar el alcance.

Para habilitar otro formulario preparado se reutiliza el mismo controlador y se valida su geometría, edición y salida. La extensión requiere aprobación después de revisar este piloto.

La suite completa finalizó con 116 pruebas aprobadas, cero fallos y cero omisiones. También pasaron por separado las cuatro pruebas de incapacidad y geometría PDF. El mapa de arquitectura se regeneró y `architecture:check` y `git diff --check` finalizaron correctamente.

Después de aprobar el piloto, la integración con el avatar y el selector de tema de `main` pasó la suite completa de 117 pruebas. El modo ampliado alternativo se sitúa por encima de los controles de cuenta para mantener despejada la hoja. Se conserva la habilitación exclusiva del visor nuevo para incapacidad.
