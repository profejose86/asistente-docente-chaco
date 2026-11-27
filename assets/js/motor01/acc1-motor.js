// MOTOR-01 · Fase 2: ACC1 — Acciones Comunes de Formulario (arriba y abajo del visor).
// Opera únicamente sobre el documento activo y borradores experimentales aislados.
(() => {
  const ICONS = {
    preview: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    print: '<path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6Z"/><path d="M17 11h1"/>',
    save: '<path d="M4 3h13l4 4v14H3V3h1Zm3 0v7h10V3M7 21v-7h10v7M14 4v4"/>',
    clear: '<path d="m16 3 3 3-8 8-3-3 8-8ZM8 11l5 5-5 6-6-6 6-5ZM4 16l4 4m-1-7 4 4"/>'
  };

  function create({ topMount, bottomMount, previewMount, drafts, getContext }) {
    if (!topMount || !bottomMount || !previewMount || !drafts || typeof getContext !== 'function') {
      throw new Error('ACC1 requiere topMount, bottomMount, previewMount, drafts y getContext.');
    }

    let destroyed = false;
    let activeDoc = null;
    let saveState = 'idle';
    let statusMessage = 'Elegí un formulario para habilitar las acciones.';
    let previewUrl = null;
    let printUrl = null;
    let printFrame = null;
    let returnFocus = null;

    const bars = [topMount, bottomMount].map((mount, index) => {
      const box = document.createElement('div');
      box.className = 'acc1-group';
      box.dataset.acc1Position = index === 0 ? 'top' : 'bottom';
      box.innerHTML = `
        <div class="acc1-primary-row" role="group" aria-label="Acciones principales del formulario">
          <button type="button" data-acc1-action="preview"><svg class="acc1-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS.preview}</svg>Ver Vista Preliminar</button>
          <button type="button" data-acc1-action="download"><svg class="acc1-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS.download}</svg>Descargar PDF Completado</button>
          <button type="button" data-acc1-action="print"><svg class="acc1-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS.print}</svg>Imprimir</button>
        </div>
        <div class="acc1-secondary-row" role="group" aria-label="Guardar o limpiar borrador experimental">
          <button type="button" class="alt" data-acc1-action="save"><svg class="acc1-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS.save}</svg>Guardar cambios</button>
          <button type="button" class="alt" data-acc1-action="clear"><svg class="acc1-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS.clear}</svg>Limpiar formulario</button>
          <span class="acc1-status" data-acc1-status data-save-state="idle" role="status" aria-live="polite"></span>
        </div>
        <p class="acc1-note" data-acc1-note></p>`;
      mount.replaceChildren(box);
      return box;
    });

    const confirmDialog = document.createElement('dialog');
    confirmDialog.className = 'acc1-confirm';
    confirmDialog.setAttribute('aria-labelledby', 'adcAcc1ClearQuestion');
    confirmDialog.innerHTML = `
      <p id="adcAcc1ClearQuestion">¿Querés limpiar los datos experimentales de este formulario? Esta acción eliminará únicamente el borrador de prueba activo, sin tocar los formularios productivos.</p>
      <div class="acc1-confirm-actions">
        <button type="button" class="alt" data-acc1-confirm="cancel" autofocus>Cancelar</button>
        <button type="button" data-acc1-confirm="yes">Sí, limpiar formulario</button>
      </div>`;
    bottomMount.append(confirmDialog);

    previewMount.classList.add('acc1-preview-wrap');
    previewMount.hidden = true;

    function revokePreview() {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
      }
      previewMount.replaceChildren();
      previewMount.hidden = true;
    }

    function revokePrint() {
      if (printUrl) {
        URL.revokeObjectURL(printUrl);
        printUrl = null;
      }
      if (printFrame) {
        printFrame.remove();
        printFrame = null;
      }
    }

    function syncBars() {
      if (destroyed) return;
      const hasDoc = Boolean(activeDoc?.id);
      const hasDraft = hasDoc && drafts.has(activeDoc.id);
      const downloadReason = 'Descargar PDF Completado está deshabilitado en Fase 2: disponible en Fase 3 (MNC-01) al conectar casilleros editables.';
      const noteText = !hasDoc
        ? 'Seleccioná un formulario del panel izquierdo para habilitar Vista preliminar, Imprimir y borrador aislado.'
        : hasDraft
          ? `${downloadReason}`
          : `${downloadReason} Limpiar formulario se habilita cuando exista un borrador experimental guardado.`;

      for (const box of bars) {
        const previewBtn = box.querySelector('[data-acc1-action="preview"]');
        const downloadBtn = box.querySelector('[data-acc1-action="download"]');
        const printBtn = box.querySelector('[data-acc1-action="print"]');
        const saveBtn = box.querySelector('[data-acc1-action="save"]');
        const clearBtn = box.querySelector('[data-acc1-action="clear"]');
        const statusEl = box.querySelector('[data-acc1-status]');
        const noteEl = box.querySelector('[data-acc1-note]');

        previewBtn.disabled = !hasDoc;
        printBtn.disabled = !hasDoc;
        saveBtn.disabled = !hasDoc;
        clearBtn.disabled = !hasDoc || !hasDraft;
        clearBtn.title = !hasDoc
          ? 'Abrí un formulario para limpiar su borrador experimental'
          : hasDraft
            ? 'Eliminar únicamente el borrador experimental de este formulario'
            : 'No hay borrador experimental guardado para limpiar';

        downloadBtn.disabled = true;
        downloadBtn.title = downloadReason;

        statusEl.dataset.saveState = saveState;
        statusEl.textContent = statusMessage;
        noteEl.textContent = noteText;
      }
    }

    function setSaveState(nextState, message) {
      saveState = nextState;
      statusMessage = message;
      syncBars();
    }

    function setDocument(entry) {
      revokePreview();
      revokePrint();
      if (confirmDialog.open) confirmDialog.close();
      activeDoc = entry || null;
      if (!activeDoc) {
        setSaveState('idle', 'Elegí un formulario para habilitar las acciones.');
        return;
      }
      const existing = drafts.load(activeDoc.id);
      if (existing) {
        setSaveState('local', `Borrador experimental cargado (${existing.savedAt ? existing.savedAt.slice(11, 19) : 'local'})`);
      } else {
        setSaveState('idle', `${activeDoc.code || activeDoc.id} listo · sin cambios guardados`);
      }
    }

    function runPreview() {
      const ctx = getContext();
      if (!ctx?.entry || !ctx.bytes?.length) {
        setSaveState('error', 'No hay bytes del PDF activo para previsualizar.');
        return;
      }
      revokePreview();
      previewUrl = URL.createObjectURL(new Blob([ctx.bytes], { type: 'application/pdf' }));
      const head = document.createElement('div');
      head.className = 'acc1-preview-head';
      const title = document.createElement('strong');
      title.textContent = `Vista preliminar · ${ctx.entry.code || ctx.entry.title}`;
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'alt';
      closeBtn.textContent = 'Cerrar vista preliminar';
      closeBtn.addEventListener('click', revokePreview);
      head.append(title, closeBtn);

      const frame = document.createElement('iframe');
      frame.className = 'acc1-preview-frame';
      frame.title = `Vista preliminar de ${ctx.entry.code || ctx.entry.title}`;
      frame.src = previewUrl;
      previewMount.append(head, frame);
      previewMount.hidden = false;
      previewMount.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function runPrint() {
      const ctx = getContext();
      if (!ctx?.entry || !ctx.bytes?.length) {
        setSaveState('error', 'No hay documento activo para imprimir.');
        return;
      }
      revokePrint();
      printUrl = URL.createObjectURL(new Blob([ctx.bytes], { type: 'application/pdf' }));
      printFrame = document.createElement('iframe');
      printFrame.hidden = true;
      printFrame.className = 'acc1-print-frame';
      printFrame.title = `Copia de impresión de ${ctx.entry.code || ctx.entry.title}`;
      printFrame.dataset.acc1PrintState = 'loading';
      printFrame.addEventListener('load', () => {
        if (!printFrame) return;
        printFrame.dataset.acc1PrintState = 'ready';
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch {
          // Navegadores restringidos pueden bloquear window.print() automático.
        }
      }, { once: true });
      printFrame.src = printUrl;
      bottomMount.append(printFrame);
    }

    function runSave() {
      const ctx = getContext();
      if (!ctx?.entry?.id) return;
      setSaveState('saving', 'Guardando borrador experimental…');
      const result = drafts.save(ctx.entry.id, {
        code: ctx.entry.code,
        diagnostics: ctx.diagnostics || null,
        ...(ctx.boxes ? { boxes: ctx.boxes } : {})
      });
      if (result.ok) {
        setSaveState('local', 'Guardado local experimental (no altera productivos)');
      } else {
        setSaveState('error', `No se pudo guardar localmente. ${result.error}`);
      }
    }

    function runClear(trigger) {
      if (!activeDoc?.id || !drafts.has(activeDoc.id)) return;
      returnFocus = trigger;
      const question = confirmDialog.querySelector('#adcAcc1ClearQuestion');
      question.textContent = `¿Querés limpiar los datos experimentales de ${activeDoc.code || activeDoc.id}? Esta acción eliminará únicamente su borrador de prueba aislado, sin tocar los formularios productivos.`;
      if (!confirmDialog.open) confirmDialog.showModal();
    }

    for (const box of bars) {
      box.addEventListener('click', event => {
        const btn = event.target.closest('[data-acc1-action]');
        if (!btn || btn.disabled) return;
        const action = btn.dataset.acc1Action;
        if (action === 'preview') runPreview();
        if (action === 'print') runPrint();
        if (action === 'save') runSave();
        if (action === 'clear') runClear(btn);
      });
    }

    confirmDialog.addEventListener('click', event => {
      const choice = event.target.closest('[data-acc1-confirm]')?.dataset.acc1Confirm;
      if (!choice) return;
      if (choice === 'cancel') {
        confirmDialog.close();
        return;
      }
      if (choice === 'yes' && activeDoc?.id) {
        const res = drafts.clear(activeDoc.id);
        confirmDialog.close();
        if (res.ok) {
          getContext()?.onClear?.();
          setSaveState('idle', 'Borrador experimental limpiado; productivos intactos.');
        }
        else setSaveState('error', `No se pudo limpiar el borrador. ${res.error}`);
      }
    });

    confirmDialog.addEventListener('close', () => {
      returnFocus?.focus?.({ preventScroll: true });
    });

    syncBars();

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      revokePreview();
      revokePrint();
      if (confirmDialog.open) confirmDialog.close();
      confirmDialog.remove();
      topMount.replaceChildren();
      bottomMount.replaceChildren();
    }

    return Object.freeze({
      setDocument,
      setSaveState,
      closePreview: revokePreview,
      destroy
    });
  }

  window.adcMotor01Acc1 = Object.freeze({ create });
})();
