# Formulario N°3 sobre el PDF original

El catálogo presenta **Modificación de Datos de Identificación del Agente** y, en el renglón siguiente, **Formulario N°3**. El ID `form-3`, el código de búsqueda `N° 3` y la clave `adc-official-form-form-3-draft-v1` se conservan. Los nombres anteriores permanecen como alias y vocabulario de búsqueda. `catalogCode` permite presentar el código completo sin alterar su identidad interna.

## Original y controles

Se utiliza el archivo aportado `materiales/08-FORMULARIO-N°3-Modificacion-de-Datos-de-Identificacion-del-Agente.pdf`, copiado íntegramente a `assets/formularios/Formulario-3.pdf`. SHA-256: `5b9c3cb637fbee4fc4ca2f9b81ef20f85ee7f50fced19eb4bb67ab403a43d1d6`. Conserva una página de 612,12 × 1008,12 puntos. La imagen de fondo se renderiza desde ese mismo PDF a 144 dpi.

El registro existente `assets/datos/formularios-pdf.js` contiene las coordenadas medidas en puntos, desde la esquina superior izquierda. Se reutilizan el lienzo de `formularios-oficiales.js`, `pdf-campos.js`, la validación guiada, los borradores y la geometría MNC de 0,5 mm / 70%. No se crea un motor ni una persistencia nuevos.

Hay cajas para apellido, nombres, tipo/número de documento y sexo actuales y solicitados; documentación adjunta; cambio solicitado; lugar y fecha de presentación; datos de recepción; agente referido por la unidad administrativa; jurisdicción, escalafón, ítem/nivel, modalidad y oficina; operador y las tres fechas del sector reservado. Apellido, nombres, documento y sexo actuales reciben los datos disponibles del perfil; los datos solicitados permanecen independientes.

Las firmas y sellos quedan en sus espacios originales para completar sobre el impreso. El sector administrativo conserva su advertencia de responsabilidad de las oficinas. No se agregan requisitos legales.

## Conservación de borradores

No se elimina ninguna clave anterior. Los valores de firma, verificación y carga administrativa que no tienen una caja equivalente quedan guardados y se muestran como datos anteriores para revisar, sin exportarlos en un casillero inventado. Las fechas administrativas anteriores `dd/mm/aaaa` se adaptan al control de fecha; si no pueden interpretarse, el texto original se conserva como dato anterior con aviso. Las correcciones y MNC mantienen el flujo compartido.

El texto que excede la caja se ajusta hasta 7 pt con el motor existente. Si no cabe, se conserva completo y se detiene la salida con aviso; no se recorta. El PDF descargado agrega valores y MNC sobre el original, sin reconstruir su contenido ni cambiar dimensiones/paginación.

## Verificación local

`tests/form3-pdf.test.cjs` verifica la apertura desde catálogo/búsqueda bajo `/adc/`, título de dos renglones, perfil, edición, alineación de filas, fechas, recuperación, MNC, hash del original y PDF de una página con las dimensiones originales. Comprueba borradores con firmas/texto administrativo antiguos. Se inspeccionaron el lienzo y el PDF completado con datos ficticios.

La prueba genérica de documentos dibujados A4 excluye ahora `form-3`, del mismo modo que los otros PDF preparados: sus posiciones y dimensiones se comprueban en la prueba específica. También se ejecutan MBIT, formularios comunes y geometría PDF. Los resultados son locales, sin publicación ni cambios remotos.

En el servidor demo de revisión, `http://127.0.0.1:8891/index.html?adc-preview=1&adc-form=form-3` abre directamente este formulario desde su acción de catálogo. Es una ayuda de revisión local, no una ruta de autenticación ni un cambio del recorrido público.

Resultado final: 36 pruebas relacionadas aprobadas (Formulario N°3, MBIT, formularios comunes y geometría PDF), sin fallos ni omisiones; architecture:check y git diff --check correctos. La URL directa del servidor demo se abrió en Chrome: 26 controles y cero errores JavaScript.
