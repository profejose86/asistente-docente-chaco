# MOTOR-01 — contrato propuesto de apertura, guardado y cierre

Fecha: 22/11/2026. Estado: **contrato objetivo, con implementación parcial autorizada por separado**. Deriva de la [línea base reconciliada](motor01-linea-base.md), con 18 pruebas seleccionadas aprobadas. Su redacción original no autorizó implementar la fachada ni modificar formularios protegidos.

Autorización posterior: el propietario aprobó probar primero apertura directa, guardado confirmado y salida segura con INCAPACIDAD. Esa implementación parcial se describe en [el piloto local](motor01-piloto-incapacidad.md). El resto de este documento continúa siendo el contrato objetivo, no una lista de capacidades ya implementadas.

## Alcance y evidencia

Se propone coordinar la pantalla existente `#adcOfficialForm` y los adaptadores actuales, comenzando experimentalmente por INCAPACIDAD y BD-02. No se crea otro visor, servicio de sincronización o almacenamiento. No se cambian PDF, coordenadas, IDs, orden histórico del editor, claves/versiones ni reglas administrativas.

Referencias inspeccionadas:

- `assets/js/tramites/formularios-oficiales.js`: `loadForm`, `save`, `persistCurrentValues`, `runAction`, revisión de generación y revocación de URLs.
- `assets/js/tramites/bd02.js`: persistencia especializada, contexto institucional, MNC recuperable y revisión.
- `assets/js/documentos/visor-pdf.js`: `adcPdfViewer.create`, `setEnabled` y `sync`; todavía no ofrece desmontaje.
- `assets/js/servicios/almacenamiento-usuario.js`: aislamiento, errores y conflictos de pestañas. `setItem` no devuelve un recibo ni una promesa; la ausencia de excepción no acredita sincronización remota.
- `assets/js/servicios/sincronizacion-usuario.js`, `assets/js/interfaz/sesion.js`: consentimiento, CAS, invalidación por cuenta y reinicio de modelos.

Las interfaces siguientes son propuestas, no APIs disponibles hoy. Los riesgos estáticos no se convierten en fallos reproducidos por describir este contrato.

## Identidad y entradas

Ambas entradas aportan directamente la identidad del documento; no se pide elegirlo nuevamente.

| Entrada | Solicitud | Comportamiento |
| --- | --- | --- |
| Formularios | `abrir({formId, modo:'nuevo', origen})` | Resolver el formulario. Si ya existe su borrador histórico, ofrecer continuar o iniciar uno nuevo; no limpiar ni sobrescribir automáticamente. |
| Mis trámites | `abrir({formId, instanceId, modo:'continuar', origen})` | Resolver exactamente ese borrador; si falta, informar sin sustituirlo por otro ni crear uno vacío. |
| Mis trámites | `abrir({formId, instanceId, modo:'consulta', origen})` | Mostrar el documento identificado sin autoguardado ni normalizaciones persistidas. Si el adaptador no permite consulta segura, declarar capacidad no disponible. |

`origen` contiene intención de navegación y referencia de foco, sin credenciales ni datos del formulario. La identidad de cuenta la entrega la sesión verificada; no se acepta un UID proporcionado por la tarjeta o URL.

En el primer experimento `instanceId` sólo puede representar el borrador histórico único del formulario mediante un alias en memoria. No se crean claves para varias instancias ni se simula que ya existen. Una identidad desconocida produce error explícito. La persistencia de múltiples instancias requiere diseño posterior, clasificación de claves y pruebas de sincronización.

Las claves actuales siguen siendo `adc-official-form-incapacidad-draft-v1` y `adc-bd02-borrador-v1`; BD-02 conserva la lectura de `adc-official-form-bd02-draft-v1`. Ningún parámetro de apertura se utiliza como ruta de archivo, clave arbitraria o comando.

## Operaciones y resultados

La futura fachada serializa las operaciones de transición; cada resultado tiene un estado explícito. No se interpreta `undefined`, un mensaje visual o un timeout como éxito.

| Operación conceptual | Resultado propuesto |
| --- | --- |
| `abrir(solicitud)` | `abierto`, `cancelado`, `bloqueado` o `error`, con identidad y causa cuando corresponda. |
| `guardar({motivo})` | `guardado-local`, `sin-cambios`, `conflicto`, `cuenta-invalida` o `error`, asociado a la edición exacta capturada. |
| `cerrar({motivo, destino})` | `cerrado`, `cancelado`, `bloqueado` o `error`. Si no se cierra, el documento y su estado se conservan. |

La fachada normaliza adaptadores síncronos/asíncronos mediante promesas. El adaptador debe propagar el resultado efectivo de persistencia. En particular, envolver el `persistCurrentValues()` actual en `Promise.resolve()` no resuelve su ausencia de resultado.

El recibo conceptual incluye identidad del documento, generación de cuenta, número de edición capturada y estado local; no incorpora tokens ni crea una versión de almacenamiento nueva. Es metadato en memoria, distinto de las revisiones CAS existentes. Los errores se muestran en lenguaje del docente, sin exponer trazas ni datos privados.

## Estados y concurrencia

Estados de sesión de documento: `sin-documento`, `abriendo`, `activo`, `guardando`, `cerrando`, `error-recuperable` y `bloqueado-por-cuenta`. Los cambios sin guardar son un atributo de edición, no un indicador de sincronización.

Cada operación captura identidad de documento, generación de apertura, generación de cuenta y edición. Al terminar comprueba que siguen vigentes antes de modificar pantalla, foco, estado o URLs. Se descartan también los bloques `catch`/`finally` antiguos: no deben habilitar botones o escribir avisos en un documento nuevo.

Solicitudes duplicadas de apertura del mismo documento no recargan ni sobrescriben la edición activa. Dos solicitudes diferentes se serializan; la segunda invalida preparaciones que aún no hayan activado un documento. No se descartan guardados en curso fingiendo que se canceló una escritura ya recibida.

Un solo documento permanece montado y editable. Preparar la configuración del siguiente no monta un segundo visor ni decodifica todas sus páginas. Los PDF y recursos se cargan al necesitarlos; no se precargan todos los documentos.

## Apertura y cambio de formulario

1. Comprobar sesión, ID permitido, modo y capacidades del adaptador. Resolver configuración del destino sin modificar el documento activo ni guardar un borrador nuevo.
2. Si hay un documento activo, solicitar `cerrar({motivo:'cambio-formulario', destino})`. La cancelación o fallo de guardado conserva el actual y cancela la transición.
3. Tras confirmar persistencia local, retener su identidad, contexto y foco de retorno para recuperación. Desmontar de forma controlada antes de montar el siguiente.
4. Cargar el borrador identificado y montar el adaptador nuevo. Normalizaciones necesarias para presentar datos se mantienen separadas de la escritura, especialmente en consulta.
5. Activar únicamente si la operación sigue vigente. Anunciar título y estado real; enfocar el encabezado sin perder los datos de retorno.
6. Si falla la carga o montaje, liberar el montaje parcial y ofrecer reabrir el documento anterior desde su copia local confirmada, o volver al catálogo. No reintentar en bucle ni recurrir automáticamente a otra cuenta o borrador.

Si la preparación falla antes del cierre, el documento anterior permanece montado. Si el desmontaje falla, la transición se bloquea y se ofrece recuperación; no se monta otro visor sobre recursos de propiedad incierta.

## Guardado local y fallos

1. Capturar valores, marcas MNC, valores recuperables, filas, selecciones y contexto mediante el adaptador, sin validación administrativa obligatoria para guardar un borrador incompleto.
2. Guardar con la fachada `adcUserStorage` existente y el formato propio del formulario. No usar un fallback nuevo a `localStorage` en modo autenticado ni saltar la protección de otra pestaña.
3. Devolver éxito sólo cuando el almacenamiento local confirma esa captura en el contexto de cuenta válido. No considerar durables los datos del bootstrap previo a verificar sesión. Una comprobación de lectura nunca debe adoptar silenciosamente una revisión ajena ni sustituir la captura propia.
4. Marcar persistida sólo la edición capturada. Si hubo cambios mientras se guardaba, conservan estado pendiente. Para cerrar se bloquea brevemente la edición, se captura y confirma la versión final; si no puede confirmarse, se conserva la pantalla.
5. Si hay cuota, almacenamiento no disponible o conflicto de pestañas, mantener valores en memoria y bloquear la salida ordinaria. Ofrecer reintentar, permanecer o resolver el conflicto mediante mecanismos existentes. Un candidato conservado para resolver un conflicto no equivale a guardado confirmado.

El experimento no incorpora «salir perdiendo cambios» como atajo. Una eventual exportación de recuperación necesita formato y privacidad definidos en otra etapa; no se promete que descargar un PDF conserve un borrador editable o MNC recuperable.

El estado remoto se informa por separado: local, pendiente, verificado, conflicto o error. Estar sin conexión no impide cerrar si la copia local está confirmada. El cierre no exige consentimiento nuevo ni espera sincronización remota; tampoco anuncia que terminó. La outbox y los conflictos pertenecen al servicio existente.

## Cierre y recursos

Una salida ordinaria captura y guarda antes de desmontar. Incluye volver al catálogo, cambiar de formulario y navegación interna que abandone el documento. Cancelar una revisión cancela esa revisión; no equivale a cerrar el documento o descartar datos.

El adaptador debe poder liberar idempotentemente sus recursos: listeners propios, `ResizeObserver`/`MutationObserver`, temporizadores, frames de animación, capturas de puntero, gestos, solicitudes cancelables, canvas/imágenes e iframes propios. Cancela guías, retira resaltados y sale de pantalla completa sólo si la posee. No borra recursos compartidos de sesión, sincronización o editor.

Cada Blob URL tiene propietario y consumidor identificados. La vista se retira antes de revocarla. Si una ventana de impresión/descarga todavía necesita sus bytes, su ciclo de vida se gestiona aparte; el cierre del formulario no debe invalidarla prematuramente ni mantenerla indefinidamente sin control. Disparar `print()` no acredita impresión física.

`setEnabled(false)` del visor actual no satisface por sí solo este contrato de desmontaje. Su futura ampliación requiere autorización y pruebas; crear un visor nuevo no es la solución propuesta.

Al terminar se restaura el foco al disparador si sigue conectado, o a un destino accesible del catálogo. Un error recuperable conserva el foco en la acción pertinente y se anuncia mediante el estado accesible existente.

## Cuenta, recarga y cierre del navegador

Un cambio de cuenta o bloqueo invalida inmediatamente operaciones y oculta datos conforme a la sesión existente. Nunca guarda el snapshot anterior usando la cuenta nueva ni restaura en ella el formulario anterior. El retorno al documento previo sólo es admisible bajo la misma cuenta verificada.

El cierre de sesión solicitado utiliza la barrera de guardado mientras la cuenta original sigue válida. La expiración o revocación inesperada prioriza bloquear datos; no promete persistir una captura después del bloqueo. No se crea una copia de emergencia fuera del aislamiento existente ni un nuevo depósito en memoria accesible por otra cuenta.

Recarga, cierre de pestaña o terminación del proceso no pueden garantizar un guardado asíncrono. Se reutiliza el guardado frecuente y se propone aviso nativo de salida sólo mientras exista edición no persistida. No se depende de `beforeunload` para sincronizar ni se afirma protección ante cierre forzado. Esta capacidad debe comprobarse por navegador.

Una actualización remota mientras hay edición activa no hidrata silenciosamente el modelo. Se conserva la resolución explícita y, cuando corresponda, el reinicio de modelos previsto en `sesion.js`.

## Adaptadores y límites del experimento

| Responsabilidad común | Responsabilidad del formulario |
| --- | --- |
| Identidad, transiciones y recibos | Captura/restauración del formato histórico |
| VPI y propiedad de recursos | PDF, páginas, coordenadas y excepciones autorizadas |
| ACC1 y resultado de persistencia | Reglas de limpieza y precarga del perfil |
| Presentación de incidencias | Requisitos, conflictos y política de omisión/bloqueo |
| Transiciones MNC | Permisos, condiciones y valores recuperables propios |

Guardar no exige corregir blancos administrativos. Generar salida sigue usando las validaciones autorizadas de cada formulario. El contrato no activa REV, ACC1 o MNC en documentos que todavía no los tengan ni convierte coherencia con el perfil en identidad legal.

El primer experimento propone INCAPACIDAD y BD-02, desactivado por defecto y accesible desde una entrada aislada. Conserva las pantallas actuales, claves y APIs públicas. La navegación ordinaria sigue intacta hasta aprobación independiente.

Si falla, se desactiva la entrada experimental. Retomar por la pantalla anterior requiere haber confirmado el borrador en su formato original y bajo la misma cuenta. No se ejecutan migraciones remotas ni transformaciones irreversibles para habilitar esta reversión.

## Criterios de aceptación antes de implementar y liberar

| Caso futuro | Resultado exigido |
| --- | --- |
| Nuevo con borrador existente | No limpiar silenciosamente; continuar o cancelar conserva el anterior. |
| Continuar una identidad inexistente | Error explícito, sin nuevo borrador ni selección de otro documento. |
| Consulta | Cero escrituras de borrador/perfil causadas por apertura, zoom o cierre. |
| Cuota agotada al cambiar | Documento anterior y edición conservados; destino no activado. |
| Edición durante guardado | No anunciar persistida una edición posterior a la captura. |
| Conflicto entre pestañas | No sobrescribir; conservar candidato y resolución existente. |
| Sin conexión y guardado local válido | Cierre permitido; estado remoto pendiente, sin falso verificado. |
| Cambio de cuenta durante apertura/guardado/generación | Ningún resultado anterior aparece o se guarda bajo la nueva cuenta. |
| Fallo del siguiente PDF | Liberación parcial y recuperación explícita del anterior bajo la misma cuenta. |
| Veinte alternancias | Una instancia activa; sin acumulación de listeners/observadores propios ni URLs sin propietario. Medir frente a línea base. |
| MNC, filas y PDF | Valores recuperables y excedentes conservados; misma geometría y reglas de salida. |
| Reversión | Recorrido anterior recupera el borrador sin conversión destructiva. |
| Teclado, móvil y temas | Foco, avisos, contraste, movimiento reducido y prefijo Pages conservados. |

Estas pruebas están diseñadas, no ejecutadas. La implementación mínima futura debe demostrar primero identidad, propagación del guardado y cierre seguro; luego ciclo de vida y apertura aislada. Ninguna API propuesta se presenta como disponible ni como trabajo ya probado.
