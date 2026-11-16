# Formularios preparados sobre PDF original

El registro actual habilita diez documentos editables sobre sus PDF originales: DP-01, CF-01, SR-01, Reubicación, Traslado transitorio, Formulario N°3, Formulario N°6, BD-07, Descuento por Seguro y Solicitud de Beneficio de Incapacidad. El motor y la geometría son compartidos; las reglas y los campos dependen de cada formulario.

La [Solicitud de Beneficio de Incapacidad](incapacidad-pdf-piloto.md) incorpora el visor piloto. Por autorización posterior, [Solicitud de Descuento por Seguro](descuento-seguro-pdf-original.md) reutiliza ese mismo visor; no se activa automáticamente en otros formularios.

El [Formulario N°3 de modificación de datos de identificación](formulario-3-pdf-original.md) también utiliza el PDF original aportado, con cajas alineadas y conservación de borradores anteriores.

El [Formulario N°6 de datos de familiares](formulario-6-pdf-original.md) conserva su página horizontal y siete filas, con edición, MNC y revisión de registros históricos que excedan el original.

[BD-07, Opción de Seguros](bd07-pdf-original.md), utiliza también el PDF aportado, sus cajas y las opciones Sí/No originales, manteniendo borradores y correcciones.

Reubicación utiliza el PDF horizontal aportado y sus ocho filas de controles: [configuración y cambios del catálogo](reubicacion-pdf-original.md).

SR-01 también utiliza ahora este motor con el PDF aportado en `materiales/`, sus controles y las nueve columnas originales. Ver [configuración y pruebas de SR-01](sr01-pdf-original.md). CF-01 usa el mismo patrón sobre el PDF aportado, con tres establecimientos y nueve filas de cargos: [configuración y revisión de CF-01](cf01-pdf-original.md). La [Solicitud de Traslado Transitorio](traslado-transitorio-pdf.md) conserva sus dos páginas e incorpora edición en pantalla completa. Los apartados siguientes documentan la implementación original de DP-01 y su revisión histórica.

DP-01 es el primer modelo editable para incorporar documentos preparados en serie. Conserva el PDF original, una página de 612 × 1008 puntos, la navegación de ADC y las acciones superiores e inferiores de vista preliminar, descarga e impresión. El papel se muestra completo; el zoom permite acercarlo.

DJ-01, DJ-02, OL-01, SC-01 y DL-01 están protegidos por indicación del usuario. Sus implementaciones y recursos propios no se modifican. SC-01 es una referencia de apariencia y comportamiento. El nuevo modo del motor compartido se activa únicamente cuando el registro del formulario contiene coordenadas.

## Estructura reutilizable

- `assets/datos/formularios-pdf.js`: PDF, imágenes, dimensiones y coordenadas de los ocho documentos registrados.
- `assets/js/documentos/pdf-campos.js`: geometría común para escribir valores, ajustar la letra y dibujar MNC. No reconstruye el diseño oficial.
- `assets/js/tramites/formularios-oficiales-datos.js`: campos y condiciones particulares de cada formulario.
- `assets/js/tramites/formularios-oficiales.js`: reutiliza validación, edición, borradores, conflictos con el perfil y acciones PDF.
- `assets/css/tramites/formularios-oficiales.css`: nuevas reglas limitadas al modo `overlay`.
- `tests/pdf-campos.test.cjs`: geometría, fuente, casilleros y año impreso.

## Datos y edición

Se configuraron situación de revista y sexo sobre sus casillas oficiales; fechas; datos personales; establecimiento; cargo/horas; motivo e instrumento legal; reemplazado; observaciones; firmas y notificación. No se insertan firmas gráficas ni se atribuyen firmas a sus responsables.

Se precargan los datos personales disponibles. Si hay una única institución identificada, se sugieren sus datos disponibles; con varias se puede elegir o escribir su nombre. Las correcciones y MNC se conservan al actualizar el perfil.

Los borradores permanecen en `adc-official-form-dp01-draft-v1`. El antiguo campo que reunía código y descripción del motivo del reemplazado se conserva y se muestra como dato heredado. No se adivina su división ni se elimina.

MNC se ofrece en campos opcionales vacíos permitidos. Excluye radios, casilleros separados, firmas y campos obligatorios. La línea mide el 70% centrado y 0,5 mm. Los vacíos sin marcar permanecen sin línea.

## Tipografía y exportación

El cuerpo del original utiliza principalmente Arial de 12 puntos. Se utiliza Helvetica, alternativa de métricas similares disponible en PDF, y Arial en el lienzo. El tamaño base es 12 puntos, con sectores de 9, 10 y 11 por su espacio. Solo se reduce el campo necesario, nunca por debajo de 7 puntos. Ante un desborde se conserva el dato completo, se avisa y se detiene la exportación para revisar una solución.

La exportación agrega valores al PDF original, sin utilizar la imagen PNG como documento de salida. El resultado es estático, sin widgets; el borrador de ADC permanece editable. La impresión utiliza ese mismo resultado. La impresión física sigue pendiente de comprobación.

## Fuente y excepción pendiente

Carpeta: https://drive.google.com/drive/folders/1AZpunmuWaPrB-qXgHyaaCjGGRwAEqSy3

Origen: `DP-01-Disposicion-de-Alta.pdf`, copiado a `assets/formularios/DP-01.pdf` sin modificar sus bytes.

SHA-256: `88d14c87d6de22b1caf0dc17281f0737e5de6ebfc8dca927c48f145f894024a8`.

El usuario autorizó corregir únicamente el **2009 impreso en Desde**. Se cubre ese número mediante un rectángulo blanco de 22,2 × 10,7 puntos, medido sobre los caracteres originales, y se coloca el año seleccionado en el mismo sector. La corrección se aplica al lienzo y al PDF completado, incluso si el campo queda vacío o se marca MNC. El PDF fuente no se modifica. Se comprobaron fechas de 2026 y 2030.

## Estado del bloque actual

BD-07, Formulario N°3 y Formulario N°6 se incorporaron al motor compartido y tienen pruebas específicas de catálogo, campos, borradores y PDF original. El bloque está en la rama `Forms-testing`; no se hizo push ni publicación. Para el estado de cada formulario, consultar su documentación enlazada arriba.

## Verificación local de DP-01

Pasaron 51 pruebas. Se comprobaron los controles superiores e inferiores, precarga personal, correcciones históricas, MNC y su geometría en el PDF, borradores, variantes titular/interino/suplente, datos cortos y largos, errores por desborde, año impreso y anchos de celular/escritorio. Se compararon visualmente el lienzo y el PDF estático generado con datos ficticios. Los archivos propios de los cinco formularios protegidos permanecen sin cambios; sus verificaciones existentes también pasaron. La impresión se probó como acción del navegador, sin imprimir físicamente.

En la verificación local del bloque actual pasaron 42 pruebas relacionadas con documentos PDF, formularios comunes y búsqueda MBIT. También pasó `architecture:check`. No se verificó una publicación online.
