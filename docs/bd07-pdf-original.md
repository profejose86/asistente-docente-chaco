# BD-07 sobre el PDF original

El catálogo y la cabecera muestran **Opción de Seguros** y, en otro renglón, **BD-07**. Se conservan el ID `bd07`, el código de búsqueda y la clave `adc-official-form-bd07-draft-v1`.

## Original y edición

Se utiliza el archivo aportado `materiales/28-FORMULARIO-BD-07-Opcion-de-seguros.pdf`, copiado íntegramente a `assets/formularios/BD-07.pdf`. SHA-256: `9a96b9b098f20d7a2cfe90a0260d9d1248e2d511789db98c703b1dea2b17571e`. Conserva su página de 595,32 × 842,04 puntos, incluido el espacio en blanco del original. No se recorta ni reconstruye. La imagen de fondo se renderiza desde ese mismo PDF a 144 dpi. El original no contiene campos AcroForm ni widgets.

Las coordenadas medidas se registran en `assets/datos/formularios-pdf.js`. El motor compartido coloca cajas para lugar, fecha, expediente, apellido, nombres, DNI, número de unidad educativa, nivel, nombre de la unidad y aclaración de firma. Los datos del agente y la aclaración reciben los valores disponibles del perfil. Si hay una única institución identificada, se sugieren nombre y nivel; con varias se conserva el selector existente mediante lista de nombres. No se infiere un número de unidad educativa desde su denominación.

La opción de continuar con el seguro conserva las alternativas Sí/No del esquema y se ubica sobre los cuadrados impresos. Es una elección explícita, sin valor predeterminado. Se mantiene la validación y no se admite MNC en esas opciones. La firma se realiza sobre el impreso, sin insertar una firma gráfica ni atribuirla al docente.

Se reutilizan el lienzo, perfil, borrador, revisión de diferencias, fechas, zoom, validación guiada, PDF y MNC de 0,5 mm / 70% existentes. No hay nuevo motor, cliente ni almacenamiento. Los textos se ajustan hasta 7 pt; si no caben, la salida se detiene y el borrador conserva el contenido íntegro.

## Compatibilidad

Se conservan las correcciones y decisiones guardadas. `establecimiento` y `firma` anteriores que no tienen una caja equivalente permanecen en el borrador y se muestran como datos de revisión, sin trasladarlos silenciosamente a otro campo ni exportarlos como firma. Las fechas anteriores `dd/mm/aaaa` se adaptan al control de fecha mediante el contrato compartido. Los originales no interpretables quedan conservados con aviso.

La plantilla mantiene el aviso impreso de uso para trámite jubilatorio y el texto de la opción de seguros, sin agregar asesoramiento, condiciones ni requisitos legales.

## Verificación

`tests/bd07-pdf.test.cjs` verifica catálogo y búsqueda bajo el prefijo `/adc/`, título en dos renglones, perfil, institución, correcciones, alineación de cajas, opciones excluyentes y sin selección inicial, MNC, fecha, descarga con las dimensiones y página originales, texto excedido, recarga y conservación de borradores anteriores. Se inspeccionaron el lienzo y el PDF completado con datos ficticios. La prueba genérica A4 dibujada deja BD-07 a su prueba específica, como los otros documentos preparados.

La vista de revisión local está en `http://127.0.0.1:8891/index.html?adc-preview=1&adc-form=bd07`. El trabajo se versiona en `Forms-testing`; no se integra a `main` ni se realizan operaciones sobre datos remotos.

Resultado final: 36 pruebas relacionadas aprobadas, cero fallos y cero omisiones. architecture:check y git diff --check correctos. La URL directa se verificó en Chrome con 12 controles y cero errores JavaScript. No se verificó una publicación online.
