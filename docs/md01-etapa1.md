# MD-01 — estado local y antecedente de etapa 1

## Reconciliación del 22/11/2026

La inspección AUD-01 + MOTOR-01 encontró que el código local avanzó respecto del informe histórico que sigue debajo. El registro `md01` de `assets/datos/formularios-pdf.js` contiene `stage:'editable'`, campos y coordenadas sobre el PDF original, cuatro filas oficiales y controles fuera del documento para conservar hasta ocho movimientos históricos. Los excedentes con datos requieren revisión antes de exportar.

`assets/js/tramites/formularios-oficiales.js` incorpora una variante específica de MNC para MD-01: permisos por campo, confirmación al anular contenido, valor recuperable, persistencia en `md01MncValues`/`md01MncConfirmed` y traslado de ese estado al reordenar filas. Esto describe código existente; no reconstruye autorizaciones anteriores ni acredita publicación o validez administrativa.

La clave continúa siendo `adc-official-form-md01-draft-v1`. La apertura editable puede normalizar el JSON y agregar campos vacíos/metadatos. La conservación debe comprobarse por los valores, marcas y filas históricos, no por identidad literal del JSON. ACC1 (Guardar/Limpiar) y el panel REV-01 siguen pendientes; la guía básica existente no equivale a ese panel.

La primera línea base de MOTOR-01 aprobó BD-02 y DL-02 y falló en las dos pruebas de MD-01: una buscaba controles después de recargar sin reabrir el formulario; la otra exigía JSON inmutable. La revisión autorizada corrige esas secuencias y expectativas sin cambiar código de aplicación. Resultados y límites: [línea base reconciliada](motor01-linea-base.md).

## Antecedente histórico: etapa 1

El texto siguiente conserva el alcance y las verificaciones registrados para la etapa 1 sin edición. No describe el estado local actual ni acredita que el servidor mencionado siga activo.

El usuario aprobó aplicar únicamente la etapa 1 después de revisar el parche y condicionó la aplicación a aislar los selectores CSS y conservar las referencias. Se trabaja en `MD01-Formulario`, sin commit, push, merge ni publicación.

## Cambios aplicados

- El registro `assets/datos/formularios-pdf.js` incorpora exclusivamente `md01`: original, imagen, dimensiones 612,12 × 1008,12 puntos, zoom y controles del visor existente, pantalla completa, ícono gris y doble clic/toque para alternar. No habilita Atrás del navegador.
- En `assets/css/tramites/formularios-oficiales.css` se agregan reglas con selectores exclusivos de `#adcOfficialForm[data-adc-form-id=md01]`. No se modifican las reglas anteriores de DP-01, BD-02, INCAPACIDAD ni otros formularios. El margen móvil y la posición del botón evitan el documento, la barra vertical y el avatar superior.
- Se copia sin modificaciones el original de materiales a `assets/formularios/MD-01.pdf`, SHA-256 `e28ec2b53445bbfa20b04d48b399281534b76d4114e89ec368be47a0036b874a`. La imagen reproduce su única página.

El formulario está en modo `original`: no ofrece campos editables, ACC1, MNC ni REV-01. El borrador existente, incluidas hasta ocho filas históricas, se conserva sin escritura ni migración. Vista preliminar y descarga entregan el PDF original. Las etapas posteriores continúan pendientes y requieren la revisión de los cambios compartidos solicitada por el usuario.

## Evidencia y alcance

`tests/md01-vpi.test.cjs` carga los archivos reales bajo un prefijo `/adc/`, con modo demo de prueba y datos ficticios. Comprueba modo original, ausencia de edición/MNC/acciones de borrador/panel, zoom, rueda y arrastre, pantalla completa nativa y alternativa, doble clic, Esc en la alternativa, toque, modos claro/oscuro, movimiento reducido y anchos 320/390/1440. La descarga y ambas vistas preliminares coinciden byte por byte con el original. Verifica recuperación y conservación del borrador con una octava fila y de otro formulario.

La prueba genérica excluye MD-01 de la rutina de formularios editables y delega esta etapa a la prueba específica. Las pruebas de DP-01, BD-02 e INCAPACIDAD verifican regresiones. Se comparan las configuraciones anteriores del registro y los estilos anteriores, y se verifican hashes de los módulos de referencia contra el estado previo a esta aplicación.

La vista local `http://127.0.0.1:8901/index.html?adc-preview=1` sirve el código aplicado; sólo utiliza una configuración demo y apertura directa de MD-01 en la respuesta del servidor local. No es una publicación ni una autenticación de producción. Las capturas se guardan en `.adc-tools/md01-etapa1/`.

No se prueban dispositivos táctiles físicos, trackpad real ni impresión física. Se preservan los cambios locales preexistentes de BD-02 y DL-02: esta etapa no los aprueba, modifica ni integra por separado.
