# Reubicación y cambios del catálogo

Se copia sin alterar sus bytes `materiales/46 - RESOLUCION 3694-23 Condicion de Reubicación.pdf` a `assets/formularios/Reubicacion.pdf`. El original tiene una página horizontal de 1008 × 612 puntos. SHA-256: `622fa6e79d02ec217f65bf14bd7b9e8f918675e11ea41b2e7c17aae2e62657d1`.

El título del catálogo y del lienzo es **Establecimiento donde se desempeña en condiciones de Reubicación**. Se conservan el ID `reubicacion`, el código REUBICACION y la clave de borrador. El título anterior queda como alias para reconocer la tarjeta original.

## Casilleros y compatibilidad

Se agregan 64 cajas sobre las ocho filas y ocho columnas originales: establecimiento/instituto, categoría, zona, cargo/asignatura/unidad curricular, horas cátedra, instrumento legal, localidad y región. El espacio de firma queda vacío por defecto y sin MNC. No se añaden datos personales al PDF.

Se reutiliza el motor preparado de CF-01 y SR-01 para borradores, MNC y sus medidas, reordenamiento, vista preliminar, descarga e impresión. Las filas vacías están permitidas: el original no identifica campos obligatorios. El organizador permite hasta ocho filas nuevas.

Los borradores anteriores podían tener doce cargos. Se conservan los excedentes debajo del documento y se bloquea su exportación si contienen datos o MNC. Los datos personales/fecha históricos sin casillero equivalente se conservan en avisos y no se imprimen en otro lugar.

El original usa principalmente Calibri 11,04 puntos. El relleno usa la alternativa compartida Arial en pantalla / Helvetica en PDF a 11 puntos, con reducción localizada hasta 7 puntos. El contenido que no cabe se conserva y genera un aviso.

## Catálogo

- «Completar y descargar» pasa a «Ingresar y Editar», incluida la tarjeta estática de SC-01. El formulario SC-01 no se modifica.
- En esta etapa histórica, «Inscripción de interinos y suplentes» permanecía como «Próximamente», deshabilitada. Posteriormente el usuario autorizó su [implementación con el PDF aportado](interinos-formulario.md), que habilita la ficha conservando sus borradores.
- No se cambian otros nombres, códigos, categorías o formularios.

## Verificación

Chrome con datos ficticios: tarjeta pendiente visible y deshabilitada, halo CSS, etiquetas del catálogo, ausencia de apertura predictiva de Interinos, título/fondo, ocho filas, MNC, reordenamiento, borrador, anchos de 320/390/1440 px, vista preliminar, descarga y conservación de datos históricos excedentes.

Se renderizó e inspeccionó el PDF completado: una página, ocho filas, original intacto y sin campos AcroForm ni widgets. Las muestras están en `.adc-tools/reubicacion/`, excluidas de Git. Quedan para revisión humana la impresión física y la conformidad visual final. No se realizó commit ni push.
