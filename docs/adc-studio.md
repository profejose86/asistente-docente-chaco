# ADC Studio: edición visual y precisión

## Acceso y guardado

La tuerquita vuelve a estar disponible tanto localmente como online. Cinco clics/toques sobre su zona, o cinco pulsaciones de Tab, la revelan sólo en esa pestaña/cuenta. No es un sistema de permisos de servidor. Cerrar sesión vuelve a ocultarla.

**Commit to local** permanece arriba y funciona exclusivamente desde localhost, mediante el puente en `localhost:3005`. Online aparece deshabilitado con su explicación; allí se puede conservar un borrador en el navegador o exportar la copia opcional. El endpoint no acepta el origen público. No se hace commit de Git ni push mediante este botón.

## Panel

- Barra superior fija: guardado local, navegación, Deshacer/Rehacer, orientación Horizontal/Vertical, vista de dispositivo, unidades, edición directa, imán, mensajes e historial.
- Organización: seleccionar contenedor, orden, alineación, tamaño y agrupación.
- Elementos/Documentos: texto, colores, cajas, botones, desplegables, burbujas, imágenes y PDF. Se retiran los atajos duplicados de la antigua sección Agregar/Borrar; queda una acción canónica por función.
- Dibujo/Anotaciones: reglas, notas, figuras, líneas y grosores.
- Proyecto/Borradores: colores institucionales, borrador, importar/exportar y recuperación.
- Plantillas: aviso al docente, encabezado y referencia normativa. No incluyen reglas legales inventadas.

Los controles incluyen ayudas `title`. Las pestañas se pueden recorrer con flechas; la orientación se recuerda por pestaña.

## Edición directa e inspector

Con Studio abierto, pasar el puntero muestra un contorno y ocho tiradores. Arrastrar mueve el elemento; bordes/esquinas cambian su tamaño. Se permite solapar. **Shift o Alt** desactiva temporalmente el imán; la casilla Imantar permite desactivarlo para toda la sesión. Los documentos completos conservan la escala conjunta de fondo y controles.

El inspector junto a la selección muestra dimensiones, X/Y, color y capa. Las medidas numéricas editables usan la unidad elegida. Doble clic sobre texto abre su formato; también se puede usar Texto en el inspector.

Fuera de campos de texto y del panel:

- `Ctrl+D` / `Cmd+D`: duplica un elemento compatible, con nuevos IDs y sin copiar handlers. Un botón copiado es visual; no ejecuta la acción del original. No se duplican formularios o elementos con campos de datos.
- `Delete` / `Supr`: oculta la selección, reversible con Deshacer.
- Flechas: desplazan 1 px; `Shift` + flecha: 10 px.
- `Escape`: cancela el gesto o herramienta. Una pérdida de foco o pointercancel restaura un gesto incompleto.

## Precisión, reglas y guías

Las reglas nuevas tienen un agarre para moverlas y un extremo para ajustar su longitud. Arrastrar desde la escala crea una guía. Se guardan las guías como operaciones `studioGuide`; sólo se muestran con Studio activo y nunca se imprimen. Sirven como referencias magnéticas para otros elementos.

La conversión es **96 px CSS = 2,54 cm**. Son centímetros CSS del viewport, no una calibración física del monitor. El zoom de un documento cambia su tamaño visible. El cálculo de campos y líneas del PDF oficial conserva sus propias coordenadas en puntos y la geometría MNC; mover una guía no cambia requisitos ni escala de impresión del formulario.

## Protecciones

En DJ-01, DJ-02 y DL-01, los campos originales y contenedores que los incluyen no admiten nuevas operaciones de movimiento, escala, eliminación, reordenado, plegado o duplicación. Se protegen también los campos no marcados required para no alterar por accidente la estructura oficial. Se pueden editar textos seguros que no contengan controles y agregar notas, burbujas o bloques explicativos nuevos.

La carga de distribuciones aprobadas y borradores históricos se mantiene por compatibilidad. La protección actúa sobre nuevas acciones interactivas; no intenta reescribir retrospectivamente sus coordenadas. El estado base no se elimina con el historial.

## Temas y simulador

Los colores maestros de interfaz se guardan como operaciones `theme`, y al cargar el proyecto se toma el tema más reciente entre ambas pantallas. Cambian controles y acentos web; no recolorean el contenido del PDF oficial.

El selector de vista crea una copia del DOM y los estilos actuales en un iframe con viewport de **1280, 820 o 390 px**. Así se evalúan media queries, posiciones fijas y contenido flotante a ese ancho. Incluye cambios visuales sin guardar. No ejecuta scripts ni envía formularios; es una comprobación visual, no un emulador de hardware ni una prueba del comportamiento JavaScript del teléfono. Se vacían las contraseñas en esa copia.

## Historial y arquitectura

El historial muestra las últimas 20 acciones adicionales al estado base. Al elegir una acción se recorre la misma pila de Deshacer/Rehacer del motor, sin un historial paralelo. Los pasos posteriores quedan disponibles para Rehacer mientras no se cree una acción nueva. El historial de sesión no se almacena como bitácora remota.

Módulos compartidos:

- `studio.js`: panel, pestañas, tooltips, inspector, presets, tema e historial.
- `studio-directo.js`: gestos, snapping y atajos.
- `studio-guias.js`: reglas y creación de guías.
- `studio-politicas.js`: protección estructural, unidades e identificadores.
- `studio-operaciones.js`: aplicación reversible de tema, guías, presets y copias.
- `ajustes-proyecto-datos.js`: contrato v1 ampliado de forma compatible.

Los motores existentes siguen siendo responsables de operaciones, borradores y deshacer/rehacer. La persistencia sigue en `ajustes-pagina.json` con validación, revisión y respaldo mediante `tools/ajustes-store.cjs`. No se alteran los módulos específicos ni las plantillas de los formularios protegidos.

## Verificación

La suite completa ejecutó 77 pruebas correctamente. Se verificaron además las orientaciones del panel y anchos de 320, 390, 820 y 1500 px sin desbordamiento horizontal. Las pruebas de Studio cubren acceso online sin puente, activación por pestaña, campos anclados, movimiento, tamaño, duplicación, historial, temas, guías, snapping con Alt, persistencia y simulación a 390 px sin contraseñas. La captura de lienzos se convierte a imágenes para no dejar en blanco los PDF renderizados con canvas.
