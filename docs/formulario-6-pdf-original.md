# Formulario N°6 sobre el PDF original

El catálogo y la cabecera muestran **Alta / Baja / Modificación de Datos de Familiares** y, en otro renglón, **Formulario N°6**. Se conservan el ID `form-6`, el código interno `N° 6`, los alias anteriores y la clave `adc-official-form-form-6-draft-v1`.

## Original y distribución

El archivo aportado `materiales/11-FORMULARIO-N°6-de-Alta-Baja-Modificacion-datos-del-familiares.pdf` se copia íntegramente a `assets/formularios/Formulario-6.pdf`. SHA-256: `483f5689e65091dbeafd96570047369e110b10f4ad33e692f5594a2bc7679252`. Conserva una página horizontal de 1008,12 × 612,12 puntos y sus siete filas. La imagen de fondo se renderiza desde el mismo PDF a 144 dpi.

Se reutilizan el motor de documentos preparados, el lienzo común, los controles repetibles, el zoom/pantalla completa, la validación y MNC de 0,5 mm / 70%. Las coordenadas están en `assets/datos/formularios-pdf.js`; no se crea otro motor, servicio ni almacenamiento.

Las cajas comprenden agente, parentesco, tipo/número de documento, sexo, nombre completo, nacimiento con día/mes/año en sus casilleros, asignaciones, nivel/curso, incapacidad, asignación doble, ayuda escolar y hecho familiar. Apellido, nombres, documento y sexo del agente mantienen sus vínculos con el perfil. Las opciones Sí/No se presentan como selectores en las celdas vacías e imprimen su texto; Alta/Modificación/Baja utiliza las casillas ya impresas.

La acción general, hecho generador, asignación solicitada, documentación, lugar y fecha ocupan sus espacios comunes. También se alinean las cajas de certificación y las de los sectores reservados. Las firmas y sellos quedan para el impreso; no se cambia el texto legal ni se asignan responsabilidades administrativas al docente.

## Borradores y límites

Los borradores anteriores admitían hasta diez familiares. Se conservan todos los registros, valores, correcciones, marcas y controles de orden. Las filas octava a décima se muestran debajo de la planilla como excedentes y detienen la exportación si contienen datos: nunca se recortan ni se inventa otra página oficial.

Los campos antiguos por familiar de acción, asignación solicitada, hecho generador, fecha del hecho y documentación se conservan como complementos editables para revisión. El PDF pide estos datos una sola vez. No se mezclan, deducen ni transfieren silenciosamente a la declaración común. Si contienen información, se avisa antes de exportar para que el usuario revise su correspondencia; sus originales permanecen en el mismo borrador hasta una edición explícita. Las observaciones, firmas y certificaciones históricas sin casillero equivalente también se conservan y se informan.

Las fechas guardadas en `dd/mm/aaaa` se adaptan a los controles sin alterar su significado. Las que no pueden interpretarse quedan conservadas como texto anterior con aviso. Los textos largos se ajustan hasta 7 pt; si no caben, la salida se detiene y el contenido permanece íntegro.

## Verificación

`tests/form6-pdf.test.cjs` verifica catálogo y búsqueda bajo un prefijo `/adc/`, perfil, edición de siete filas, alineación, fechas partidas, opciones, orden de familiares, MNC, recuperación, excedentes históricos, independencia de la acción global, hash y PDF de una página con las dimensiones originales. Se inspeccionaron el lienzo y el PDF completado con datos ficticios. La prueba genérica A4 dibujada deja este formulario a su prueba específica, como los otros documentos preparados.

Se aprobaron 36 pruebas relacionadas: N°6, N°3, MBIT, motor de formularios y geometría PDF. Las pruebas son locales; no hubo publicación ni cambios remotos. Los formularios protegidos y el trabajo previo de DJ-01 quedan conservados.

Vista de revisión local: `http://127.0.0.1:8891/index.html?adc-preview=1&adc-form=form-6`. Se versiona en `Forms-testing`; la integración y publicación desde `main` permanecen fuera de esta etapa.
