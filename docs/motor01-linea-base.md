# MOTOR-01 — preservación y reconciliación de línea base

Fecha: 22/11/2026. Rama observada: `MD01-Formulario`. HEAD base: `407052bd6bdc99f2b3e47abba658e3efca09b200`. No se cambió de rama, hizo commit/push ni publicó.

## Preservación anterior a la reconciliación

Respaldo local externo: `C:\ADC-Respaldos\MOTOR01-etapa0-20261122-204134-f0917fae`. Contiene 346 archivos seleccionados, manifiesto SHA-256, diff contra HEAD, instrucciones y reconstrucción verificada. Se excluyeron credenciales, entornos privados, sesiones y seis capturas no revisadas. No incluye historial Git ni dependencias. No se restauró sobre el proyecto real. Es una copia local, no un paquete preparado para compartir.

La comprobación final de esa etapa encontró cero diferencias de hash en los originales preservados, mismo HEAD y mismos diez archivos modificados/diez nuevos. El manifiesto preserva el estado anterior; las modificaciones autorizadas posteriores de documentación y pruebas se distinguen de esa referencia.

## Primera línea base: resultados conservados

- `node tools/auditar-arquitectura.cjs --check`: aprobado; sin referencias ausentes, cargas duplicadas, rutas inseguras bajo prefijo ni colisiones de nombres.
- `node --test tests/arquitectura.test.cjs`: 2 aprobadas.
- `node --test --test-concurrency=1 tests/pdf-campos.test.cjs tests/sincronizacion.test.cjs`: 12 aprobadas, con almacenamiento y servidor simulados en memoria.
- En copia temporal independiente: `node --test --test-concurrency=1 tests/md01-vpi.test.cjs tests/md01-mnc.test.cjs tests/bd02-estandares.test.cjs tests/dl02-pdf.test.cjs`: BD-02 y DL-02 aprobaron; ambas pruebas de MD-01 fallaron. Total: 16 aprobadas, 2 fallidas.

MNC falló al buscar Observaciones tras recargar sin reabrir MD-01. VPI falló al exigir identidad literal del JSON histórico, incompatible con la normalización del formulario editable. No se atribuye la primera falla al producto ni se infiere pérdida de datos de la segunda.

## Reconciliación autorizada

Se preserva el informe histórico de etapa 1 y se agrega el estado editable actual de MD-01. Las pruebas vuelven a abrir MD-01 después de cada recarga y comprueban conservación de valores históricos, ocho filas, marcas y otro borrador. La prueba MNC mantiene las comprobaciones de cancelación, confirmación, recuperación, reordenamiento y salida PDF. Las capturas de las dos pruebas de MD-01 se dirigen a directorios temporales independientes.

El mapa y el inventario se regeneran con la herramienta existente para incluir la prueba MNC y su servidor. No se modifica código de aplicación, PDFs, permisos, reglas administrativas, claves, autenticación ni sincronización.

## Resultado de la nueva línea base

La ejecución posterior a la reconciliación aprobó **18 pruebas, cero fallos**:

| Comando | Entorno | Resultado |
| --- | --- | --- |
| `node --test --test-concurrency=1 tests/md01-vpi.test.cjs tests/md01-mnc.test.cjs` | Proyecto local; capturas/PDF en directorios temporales | 2 aprobadas |
| `node --test --test-concurrency=1 tests/arquitectura.test.cjs tests/pdf-campos.test.cjs tests/sincronizacion.test.cjs` | Proyecto local; fixtures temporales y datos simulados en memoria | 14 aprobadas |
| `node --test --test-concurrency=1 tests/bd02-estandares.test.cjs tests/dl02-pdf.test.cjs` | Copia temporal de la primera línea base; código de aplicación sin cambios respecto del original | 2 aprobadas |

Se ejecutaron `node tools/auditar-arquitectura.cjs` y `node tools/auditar-arquitectura.cjs --check` (equivalentes a `npm run architecture:audit` y `npm run architecture:check`). Se regeneraron únicamente el mapa y el inventario previstos y el control aprobó. `git diff --check` aprobó en el repositorio original; una primera invocación en la copia sin Git no era aplicable y se repitió en el directorio correcto.

Se utilizó el Node ya instalado en `C:\Users\CONECTIA BA\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, sin instalar dependencias. Comparación SHA-256 contra el manifiesto anterior: no se modificaron archivos de aplicación, estilos ni PDFs durante esta reconciliación; las diferencias corresponden a documentación, inventario/mapa y las dos pruebas autorizadas. El documento de línea base es nuevo. Rama y HEAD permanecen iguales.

Son pruebas seleccionadas, no la suite completa. La sincronización se ejercitó con servidor en memoria; la impresión de MD-01 se simuló. No se probaron servicios remotos, datos privados, dispositivos físicos ni una nueva publicación.

## Riesgos conservados y siguiente paso

| Componente | Estado | Riesgo / próxima acción |
| --- | --- | --- |
| Guardado al cambiar formulario | Riesgo estático | Propagar y comprobar resultado de persistencia antes de sustituir el documento. No se reprodujo pérdida. |
| Ciclo de vida VPI | API sin desmontaje confirmada | Diseñar cancelación y liberación; no se midió fuga de memoria. |
| Borradores | Claves actuales compatibles con clasificación existente | Diseñar identidad de instancia sin migración destructiva. |
| MNC | BD-02/MD-01 tienen variantes; DP-01 sigue restringido a vacíos | Separar transiciones de políticas y verificar por formulario antes de centralizar. |
| Privacidad | Mensajes generales desactualizados confirmados | Proponer mensajes acordes a persistencia local/sincronización autorizada. No se corrigen en esta etapa. |

El siguiente paso autorizado se documentó en [contrato propuesto de apertura, guardado y cierre](motor01-contrato-apertura-guardado-cierre.md). Es diseño documental; la fachada experimental requiere autorización posterior. MOTOR-01 permanece sin implementar. No se acredita impresión física, dispositivos reales, identidad legal, aplicabilidad normativa ni sincronización/publicación online de estos cambios.
