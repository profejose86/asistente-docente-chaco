// Persistencia experimental estrictamente aislada para MOTOR-01 (VPI Maestro).
// Usa claves `adc-motor01-exp-draft-v1:<id>` (sólo local, nunca sincronizables ni compartidas con productivos).
(() => {
  const KEY_PREFIX = 'adc-motor01-exp-draft-v1:';

  function keyFor(docId) {
    const clean = String(docId || '').trim();
    if (!clean || /[\r\n]/.test(clean)) throw new Error('Identificador de documento inválido.');
    return `${KEY_PREFIX}${clean}`;
  }

  function storage() {
    return globalThis.adcUserStorage || localStorage;
  }

  function load(docId) {
    try {
      const raw = storage().getItem(keyFor(docId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || parsed.experimental !== true) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function has(docId) {
    return load(docId) !== null;
  }

  function save(docId, payload = {}) {
    try {
      const store = storage();
      const key = keyFor(docId);
      const savedAt = new Date().toISOString();
      const raw = JSON.stringify({
        schemaVersion: 1,
        experimental: true,
        docId: String(docId),
        savedAt,
        state: payload && typeof payload === 'object' ? payload : {}
      });
      store.setItem(key, raw);
      if (store.getItem(key) !== raw) {
        throw new Error('No se pudo confirmar la escritura local.');
      }
      return { ok: true, state: 'local', savedAt, key };
    } catch (error) {
      return { ok: false, state: 'error', error: error.message || 'Error de almacenamiento' };
    }
  }

  function clear(docId) {
    try {
      const store = storage();
      const key = keyFor(docId);
      store.removeItem(key);
      if (store.getItem(key) != null) {
        throw new Error('No se pudo confirmar la limpieza local.');
      }
      return { ok: true, state: 'idle', key };
    } catch (error) {
      return { ok: false, state: 'error', error: error.message || 'Error al limpiar' };
    }
  }

  window.adcMotor01Drafts = Object.freeze({
    keyFor,
    load,
    has,
    save,
    clear
  });
})();
