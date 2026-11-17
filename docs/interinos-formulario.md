# Interinos y Suplentes con expectativas

El usuario aprobó integrar `Interinos-Formulario` en `main` y publicar mediante GitHub Pages. Se habilita la ficha histórica `interinos` manteniendo `adc-official-form-interinos-draft-v1`. El título solicitado se presenta con FORMULARIO en el segundo renglón. El PDF de materiales se copia sin alterarlo a `assets/formularios/Interinos-Expectativas.pdf`, SHA-256 `a851f81274e3b0bd9299e36ee4e6fadaaeb746f3d430a9490ceae00c88ba09df`, una página de 595,32 × 841,92 puntos.

## Reutilización

- El registro preparado define las coordenadas. No se reconstruye la resolución ni se modifican sus textos legales. Las dos partes del nombre y las cinco filas de documentación conservan sus claves; documento y observación comparten el renglón correspondiente. Firma y declaración históricas se conservan como datos anteriores y no se imprimen automáticamente.
- VPI reutiliza `documentos/visor-pdf.js`: zoom, ajuste, desplazamiento y pantalla completa. Conserva una sola barra vertical nativa, como Incapacidad. MNC reutiliza `core/mnc.js`, con grosor de 0,5 mm y longitud del 70 %.
- ACC1 activa explícitamente las acciones y estilos existentes de Incapacidad. No crea otra persistencia. Los botones superiores e inferiores guardan el mismo borrador o lo limpian con confirmación, recuperando los datos del perfil. Los errores conservan el borrador anterior y no anuncian éxito.
- REV-01 usa `tramites/interinos-revision.js` sólo en esta ficha. El motor aporta sus validaciones, controles y conflictos; `adcGuidedValidation.createBlocking` conserva el énfasis y el bloqueo de errores. Las tarjetas propias sustituyen visualmente su resumen, sin duplicar las reglas. Desktop utiliza una columna lateral; móvil una bandeja contraída con contador, apertura, cierre, gesto y navegación al casillero.

## Alcance de la revisión

Se mantienen los requisitos ya definidos por el esquema (fecha, apellido, nombres, DNI y selección de titularidad) y sus validaciones de formato; también se impide exportar texto desbordado. Las diferencias con el perfil son avisos revisables: usar el dato del perfil o mantenerlo sólo en este formulario. No se sobrescribe el perfil desde la tarjeta.

El usuario autorizó adaptar la exigencia de identidad de REV-01 a **coherencia con el perfil**. ADC autentica la cuenta, pero no dispone de un DNI verificado: estas comprobaciones no prueban la identidad ni bloquean una corrección legítima de nombre. La interfaz lo informa. No hay campos de familiares o beneficiarios en esta plantilla; no se agregan validaciones de terceros inexistentes. No se modifica Supabase, autenticación ni sincronización.

La salida de vista preliminar, descarga e impresión comparte el mismo control de requisitos. La generación de bytes comprueba nuevamente los bloqueos y el ajuste geométrico; guardar un borrador no depende de que la revisión esté completa.

## Verificación

`tests/interinos-pdf.test.cjs` prueba con Chrome local bajo `/adc/`: precarga, tarjetas y contador, errores y avisos, navegación, apertura/cierre móvil, gestos emulados, iconos superiores e inferiores, recuperación, limpieza cancelada y confirmada, error de guardado, perfil y otro borrador intactos, temas, anchos 320/390/1500, pantalla completa y salida PDF. Se comparan coordenadas de texto entre descarga, vista preliminar a otro zoom e impresión simulada. El fondo original se verifica por hash y el PDF completado se renderiza para inspección visual.

Antes de integrar y publicar se ejecutó la suite completa con 120 pruebas aprobadas, ninguna fallida ni omitida. También pasaron el build y el control de arquitectura.

No se prueba una impresora física, trackpad real ni un dispositivo móvil físico; los gestos y la impresión se emulan. El documento tiene una página. No se afirma verificación online ni identidad acreditada.
