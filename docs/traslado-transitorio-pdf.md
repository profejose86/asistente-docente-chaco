# Solicitud de Traslado Transitorio

## Documento y presentación

Se reemplaza la reconstrucción anterior de `traslado-inicial` por el archivo aportado en `materiales/Formulario para solicitar traslado transitorio.pdf`. La copia de aplicación, `assets/formularios/Traslado-Transitorio.pdf`, conserva sus bytes originales: dos páginas de 595 × 842 puntos, SHA-256 `cff4245d9e29aa52141b70c95e0ee7a80e1fc42284afae99d9c7256a99afd5b4`.

El título visible es **Solicitud de Traslado Transitorio**, sin el sufijo de nivel ni el código añadido al encabezado. Se conserva el identificador `traslado-inicial` y el código de búsqueda TRASLADO para no romper el catálogo ni los borradores.

El lienzo se amplía al ancho de la ventana. Su botón **Pantalla completa** utiliza la API del navegador y mantiene editables los controles superpuestos. Se sale con el botón visible **Salir de pantalla completa** o con Escape. Este comportamiento y el ajuste al ancho ampliado están habilitados sólo para este documento; los demás mantienen su presentación.

## Campos

La primera página contiene datos personales, establecimiento titular, actual y solicitado, transporte/distancia, licencias, otros cargos, antecedentes de traslados, tareas administrativas y concurso. La segunda conserva razones de salud, datos del cónyuge, otras causas, lugar/fecha y firma, informes de dirección/supervisión/regional y sus espacios de fecha y firma.

La precarga personal, borrador, correcciones, MNC, calendarios y acciones de PDF reutilizan el mismo motor de CF-01 y SR-01. Las firmas permanecen vacías por defecto y no admiten MNC. Las razones de salud se seleccionan con controles de opción, sin MNC; no se agregan requisitos legales.

El documento es un escaneo con texto OCR y ligera inclinación. Se conserva sin limpiar, recortar o rediseñar. La capa OCR no identifica una fuente fiable (`Untitled`): se utiliza Arial en pantalla y Helvetica en PDF, principalmente 9 puntos, 8 en fechas/casilleros estrechos y 7,5 en la respuesta corta de tareas administrativas. El ajuste mínimo es 7 puntos y el contenido que no cabe se conserva y se avisa antes de exportar.

## Compatibilidad

La clave sigue siendo `adc-official-form-traslado-inicial-draft-v1`. Los campos antiguos que mezclaban datos o no tienen un espacio equivalente (destino genérico, situación/cargo actual genéricos, fundamentos combinados, confirmación web de declaración, etc.) se mantienen como datos históricos con aviso; no se colocan sobre texto oficial ni se borran. La declaración jurada impresa y la firma del interesado permanecen en el PDF.

## Verificaciones

Chrome automatizado, con datos ficticios: título, dos fondos originales, precarga, campos de ambas páginas, MNC y exclusiones, guardado/reapertura, vista previa, descarga y entrada/salida real de pantalla completa. Se probaron anchos de 320, 390 y 1440 px sin desbordamiento horizontal.

Se renderizó el PDF completado y se revisaron visualmente ambas páginas y la captura de pantalla completa. El resultado mantiene dos páginas, sin campos AcroForm ni widgets. Se verificó que los datos personales y el informe de dirección figuren en sus páginas correspondientes. Las muestras están en `.adc-tools/traslado/`, excluidas de Git.

Quedan para revisión del usuario la conformidad visual y la impresión física. No se hizo commit ni push y se conservaron los cambios locales anteriores.
