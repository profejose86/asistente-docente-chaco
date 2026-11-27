// MOTOR-01 · VPI-01: visor PDF inteligente experimental con carga bajo demanda,
// redimensionamiento horizontal gradual, pan libre 2D, zoom y pantalla completa.
(() => {
  const pdfModuleURL = new URL('../../vendor/pdfjs/pdf.min.mjs', document.currentScript.src);
  const workerURL = new URL('pdf.worker.min.mjs', pdfModuleURL).href;
  const standardFontDataUrl = new URL('standard_fonts/', pdfModuleURL).href;
  const wasmUrl = new URL('wasm/', pdfModuleURL).href;
  const PT_TO_PX = 96 / 72;
  const PAGE_GAP = 16;
  const MIN_SCALE = 0.25;
  const MAX_SCALE = 2.0;

  let pdfjsPromise = null;
  function loadPdfJs() {
    if (!pdfjsPromise) {
      pdfjsPromise = import(pdfModuleURL.href).then(mod => {
        mod.GlobalWorkerOptions.workerSrc = workerURL;
        return mod;
      });
    }
    return pdfjsPromise;
  }

  function create({ host, onStateChange = () => {} }) {
    if (!host) throw new Error('VPI-01 requiere un contenedor host.');
    const controller = new AbortController();
    const { signal } = controller;

    const shell = document.createElement('div');
    shell.className = 'vpi-shell';
    shell.dataset.vpiShell = 'true';

    const resizeLeft = document.createElement('button');
    resizeLeft.type = 'button';
    resizeLeft.className = 'vpi-resize-handle vpi-resize-left';
    resizeLeft.dataset.vpiResize = 'left';
    resizeLeft.dataset.vpiInteractive = '';
    resizeLeft.setAttribute('role', 'slider');
    resizeLeft.setAttribute('aria-label', 'Ancho del visor desde el borde izquierdo');
    resizeLeft.title = 'Arrastrá o usá flechas izquierda/derecha para ajustar el ancho';
    resizeLeft.innerHTML = '<span aria-hidden="true">↔</span>';

    const resizeRight = document.createElement('button');
    resizeRight.type = 'button';
    resizeRight.className = 'vpi-resize-handle vpi-resize-right';
    resizeRight.dataset.vpiResize = 'right';
    resizeRight.dataset.vpiInteractive = '';
    resizeRight.setAttribute('role', 'slider');
    resizeRight.setAttribute('aria-label', 'Ancho del visor desde el borde derecho');
    resizeRight.title = 'Arrastrá o usá flechas izquierda/derecha para ajustar el ancho';
    resizeRight.innerHTML = '<span aria-hidden="true">↔</span>';

    const makeBottomHandle = (side, ariaLabel) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `vpi-resize-handle vpi-resize-bottom vpi-resize-${side}`;
      btn.dataset.vpiResize = side;
      btn.dataset.vpiInteractive = '';
      btn.setAttribute('role', 'slider');
      btn.setAttribute('aria-orientation', 'vertical');
      btn.setAttribute('aria-label', ariaLabel);
      btn.title = 'Arrastrá hacia abajo o arriba para ajustar el alto (doble clic para volver al alto por defecto)';
      btn.innerHTML = '<span aria-hidden="true">↕</span>';
      return btn;
    };
    const resizeBottomLeft = makeBottomHandle('bottom-left', 'Alto del visor desde el borde inferior izquierdo');
    const resizeBottomRight = makeBottomHandle('bottom-right', 'Alto del visor desde el borde inferior derecho');

    const floatingFullscreen = document.createElement('button');
    floatingFullscreen.type = 'button';
    floatingFullscreen.className = 'vpi-floating-fullscreen';
    floatingFullscreen.dataset.vpiInteractive = '';
    floatingFullscreen.setAttribute('aria-label', 'Maximizar documento');
    floatingFullscreen.setAttribute('aria-pressed', 'false');
    floatingFullscreen.title = 'Maximizar documento';
    floatingFullscreen.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path data-expand-icon d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/><path data-restore-icon d="M3 9h6V3m6 0v6h6M9 21v-6H3m12 6v-6h6"/></svg>';

    const viewport = document.createElement('div');
    viewport.className = 'vpi-viewport';
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Visor PDF inteligente experimental');

    const emptyNotice = document.createElement('p');
    emptyNotice.className = 'vpi-empty-notice';
    emptyNotice.textContent = 'Elegí un PDF arriba para cargarlo bajo demanda en el visor VPI-01.';

    const sizer = document.createElement('div');
    sizer.className = 'vpi-canvas-sizer';
    sizer.hidden = true;

    const stage = document.createElement('div');
    stage.className = 'vpi-stage';
    sizer.append(stage);
    viewport.append(emptyNotice, sizer);

    const verticalScroll = document.createElement('input');
    verticalScroll.type = 'range';
    verticalScroll.min = '0';
    verticalScroll.max = '100';
    verticalScroll.step = '0.1';
    verticalScroll.value = '0';
    verticalScroll.disabled = true;
    verticalScroll.className = 'vpi-vertical-scroll';
    verticalScroll.dataset.vpiInteractive = '';
    verticalScroll.setAttribute('aria-label', 'Posición vertical del documento');
    verticalScroll.setAttribute('aria-orientation', 'vertical');

    const controls = document.createElement('div');
    controls.className = 'vpi-bottom-bar';
    controls.dataset.vpiInteractive = '';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Controles de zoom y pantalla completa');
    controls.innerHTML = `
      <button type="button" data-vpi-action="out" aria-label="Alejar documento">−</button>
      <input type="range" data-vpi-zoom-slider min="25" max="200" step="1" value="100" aria-label="Zoom del documento">
      <output data-vpi-zoom-output aria-live="polite">100 %</output>
      <button type="button" data-vpi-action="in" aria-label="Acercar documento">+</button>
      <button type="button" data-vpi-action="width">Ajustar al ancho</button>
      <button type="button" data-vpi-action="page">Ajustar a pantalla</button>
      <button type="button" data-vpi-action="fullscreen" aria-pressed="false">Pantalla completa</button>`;

    shell.append(resizeLeft, resizeRight, resizeBottomLeft, resizeBottomRight, floatingFullscreen, viewport, verticalScroll, controls);
    host.append(shell);

    const zoomSlider = controls.querySelector('[data-vpi-zoom-slider]');
    const zoomOutput = controls.querySelector('[data-vpi-zoom-output]');
    const fullBottomBtn = controls.querySelector('[data-vpi-action="fullscreen"]');

    let destroyed = false;
    let requestToken = 0;
    let activeEntry = null;
    let activeBytes = null;
    let pdfDoc = null;
    let loadingTask = null;
    const renderTasks = new Set();
    let pageMeta = [];
    let baseWidth = 0;
    let baseHeight = 0;
    let scale = 1;
    let zoomMode = 'width';
    let sessionWidth = null;
    let sessionHeight = null;
    let loadedCount = 0;
    let releasedCount = 0;
    let lastRenderedScale = 0;
    let renderPass = 0;
    let activeRenderWait = Promise.resolve();
    let crispTimer = null;
    let hideTimer = null;
    let controlsActive = false;
    let dragPan = null;
    let resizeDrag = null;
    let verticalResizeDrag = null;
    let pinch = null;
    let tapStart = null;
    let lastTap = null;
    let lastTouchTime = -Infinity;
    let previousBodyOverflow = '';
    let fullscreenPending = false;

    const interactiveSelector = 'input,textarea,select,button,a,label,[contenteditable],[data-vpi-interactive],[data-vpi-resize]';
    const isInteractive = target => Boolean(target?.closest?.(interactiveSelector));
    const isTijeraActive = () => document.body.classList.contains('adcTijeraActive');
    const clampScale = value => Math.max(MIN_SCALE, Math.min(MAX_SCALE, Number(value) || 1));
    const expanded = () => document.fullscreenElement === shell || shell.classList.contains('vpi-expanded');

    function widthLimits() {
      const hostWidth = Math.max(240, Math.floor(host.clientWidth || shell.parentElement?.clientWidth || 900));
      const minWidth = Math.min(320, hostWidth);
      return { minWidth, maxWidth: hostWidth };
    }

    function applyContainerWidth(nextWidth) {
      const { minWidth, maxWidth } = widthLimits();
      if (expanded()) {
        shell.style.width = '';
        return;
      }
      if (nextWidth === null) {
        const initial = Math.min(maxWidth, 820);
        shell.style.width = initial + 'px';
      } else {
        const clamped = Math.round(Math.max(minWidth, Math.min(maxWidth, nextWidth)));
        sessionWidth = clamped;
        shell.style.width = clamped + 'px';
      }
      const current = Math.round(shell.getBoundingClientRect().width || maxWidth);
      for (const handle of [resizeLeft, resizeRight]) {
        handle.setAttribute('aria-valuemin', String(minWidth));
        handle.setAttribute('aria-valuemax', String(maxWidth));
        handle.setAttribute('aria-valuenow', String(current));
        handle.setAttribute('aria-valuetext', `${current} píxeles de ancho`);
      }
    }

    function heightLimits() {
      const minHeight = window.innerWidth <= 650 ? 320 : 360;
      const defaultHeight = Math.round(
        Math.max(minHeight, window.innerWidth <= 650 ? window.innerHeight * 0.76 : Math.min(window.innerHeight * 0.68, 780))
      );
      const maxHeight = Math.max(defaultHeight + 400, Math.min(2200, Math.round(window.innerHeight * 2)));
      return { minHeight, defaultHeight, maxHeight };
    }

    function applyContainerHeight(nextHeight) {
      const { minHeight, defaultHeight, maxHeight } = heightLimits();
      if (expanded()) {
        shell.style.height = '';
        return;
      }
      if (nextHeight === null) {
        sessionHeight = null;
        shell.style.height = '';
      } else {
        const clamped = Math.round(Math.max(minHeight, Math.min(maxHeight, nextHeight)));
        sessionHeight = clamped;
        shell.style.height = clamped + 'px';
      }
      const current = Math.round(shell.getBoundingClientRect().height || defaultHeight);
      for (const handle of [resizeBottomLeft, resizeBottomRight]) {
        handle.setAttribute('aria-valuemin', String(minHeight));
        handle.setAttribute('aria-valuemax', String(maxHeight));
        handle.setAttribute('aria-valuenow', String(current));
        handle.setAttribute('aria-valuetext', `${current} píxeles de alto`);
      }
    }

    function notifyState() {
      if (destroyed) return;
      onStateChange(getDiagnostics());
    }

    function revealControls() {
      if (destroyed) return;
      shell.classList.add('vpi-controls-visible');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (
          dragPan ||
          resizeDrag ||
          verticalResizeDrag ||
          pinch ||
          controlsActive ||
          controls.matches(':hover,:focus-within') ||
          verticalScroll.matches(':hover,:focus') ||
          floatingFullscreen.matches(':hover,:focus-visible') ||
          resizeLeft.matches(':hover,:focus-visible') ||
          resizeRight.matches(':hover,:focus-visible') ||
          resizeBottomLeft.matches(':hover,:focus-visible') ||
          resizeBottomRight.matches(':hover,:focus-visible')
        ) {
          return;
        }
        shell.classList.remove('vpi-controls-visible');
      }, 1700);
    }

    function syncFullscreenButtons() {
      const isFull = expanded();
      const label = isFull ? 'Restaurar vista del documento' : 'Maximizar documento';
      floatingFullscreen.setAttribute('aria-label', label);
      floatingFullscreen.title = label;
      floatingFullscreen.setAttribute('aria-pressed', String(isFull));
      fullBottomBtn.textContent = isFull ? 'Salir de pantalla completa' : 'Pantalla completa';
      fullBottomBtn.setAttribute('aria-pressed', String(isFull));
    }

    function syncUi() {
      if (destroyed) return;
      syncFullscreenButtons();
      const percent = Math.round(scale * 100);
      zoomSlider.value = String(percent);
      zoomOutput.textContent = `${percent} %`;
      for (const modeButton of controls.querySelectorAll('[data-vpi-action="width"],[data-vpi-action="page"]')) {
        modeButton.setAttribute('aria-pressed', String(zoomMode === modeButton.dataset.vpiAction));
      }
      const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      verticalScroll.disabled = !activeEntry || maxScroll <= 1;
      verticalScroll.value = maxScroll > 0 ? String((viewport.scrollTop / maxScroll) * 100) : '0';
      verticalScroll.setAttribute('aria-valuetext', `${Math.round(Number(verticalScroll.value))} % del recorrido`);
      notifyState();
    }

    function applyScale(nextScale, { skipCrisp = false } = {}) {
      scale = clampScale(nextScale);
      if (baseWidth > 0 && baseHeight > 0) {
        sizer.style.width = `${Math.round(baseWidth * scale)}px`;
        sizer.style.height = `${Math.round(baseHeight * scale)}px`;
        stage.style.transform = `scale(${scale})`;
        if (!skipCrisp) scheduleCrispRender();
      }
      syncUi();
    }

    function fit(mode, options) {
      zoomMode = mode === 'page' ? 'page' : 'width';
      if (!baseWidth || !baseHeight || !pageMeta.length) {
        syncUi();
        return;
      }
      const availableWidth = Math.max(120, viewport.clientWidth - 24);
      const availableHeight = Math.max(120, viewport.clientHeight - 24);
      const firstPageHeight = pageMeta[0].baseHeight;
      const ratioWidth = availableWidth / baseWidth;
      const target = zoomMode === 'page' ? Math.min(ratioWidth, availableHeight / firstPageHeight) : ratioWidth;
      applyScale(target, options);
    }

    function scaleAt(nextScale, point) {
      zoomMode = 'manual';
      const clamped = clampScale(nextScale);
      if (!baseWidth || !baseHeight) {
        applyScale(clamped);
        return;
      }
      const rect = viewport.getBoundingClientRect();
      const anchor = point || { x: rect.left + viewport.clientWidth / 2, y: rect.top + viewport.clientHeight / 2 };
      const before = sizer.getBoundingClientRect();
      const oldScale = scale;
      const relX = (anchor.x - before.left) / oldScale;
      const relY = (anchor.y - before.top) / oldScale;
      applyScale(clamped);
      const after = sizer.getBoundingClientRect();
      viewport.scrollLeft += after.left + relX * scale - anchor.x;
      viewport.scrollTop += after.top + relY * scale - anchor.y;
      syncUi();
      revealControls();
    }

    async function renderPagesAtScale(token) {
      if (!pdfDoc || token !== requestToken || destroyed) return;
      clearTimeout(crispTimer);
      const pass = ++renderPass;
      for (const task of [...renderTasks]) {
        try { task.cancel(); } catch {}
      }
      await activeRenderWait.catch(() => {});
      if (!pdfDoc || token !== requestToken || pass !== renderPass || destroyed) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const renderScale = Math.min(3, Math.max(1.25, scale * dpr));
      lastRenderedScale = renderScale;
      const job = (async () => {
        for (const item of pageMeta) {
          if (token !== requestToken || pass !== renderPass || destroyed || !pdfDoc) return;
          const page = await pdfDoc.getPage(item.pageNumber);
          if (token !== requestToken || pass !== renderPass || destroyed) return;
          const pdfViewport = page.getViewport({ scale: renderScale * PT_TO_PX });
          const canvas = item.canvas;
          canvas.width = Math.max(1, Math.ceil(pdfViewport.width));
          canvas.height = Math.max(1, Math.ceil(pdfViewport.height));
          const ctx = canvas.getContext('2d');
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const task = page.render({ canvasContext: ctx, viewport: pdfViewport });
          renderTasks.add(task);
          try {
            await task.promise;
            if (token === requestToken && pass === renderPass) canvas.dataset.vpiRendered = 'true';
          } catch (error) {
            if (error?.name !== 'RenderingCancelledException' && token === requestToken && pass === renderPass) throw error;
          } finally {
            renderTasks.delete(task);
          }
        }
      })();
      activeRenderWait = job;
      await job;
    }

    function scheduleCrispRender() {
      if (!pdfDoc) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const desired = Math.min(3, Math.max(1.25, scale * dpr));
      if (Math.abs(desired - lastRenderedScale) < 0.18) return;
      clearTimeout(crispTimer);
      const token = requestToken;
      crispTimer = setTimeout(() => {
        renderPagesAtScale(token).catch(() => {});
      }, 140);
    }

    async function unloadPdf() {
      requestToken++;
      clearTimeout(crispTimer);
      for (const task of [...renderTasks]) {
        try { task.cancel(); } catch {}
      }
      renderTasks.clear();
      const hadActive = Boolean(activeEntry || pdfDoc || pageMeta.length);
      activeEntry = null;
      activeBytes = null;
      if (hadActive) releasedCount++;
      for (const item of pageMeta) {
        item.canvas.width = 0;
        item.canvas.height = 0;
      }
      pageMeta = [];
      stage.replaceChildren();
      stage.style.width = '';
      stage.style.height = '';
      stage.style.transform = '';
      sizer.hidden = true;
      sizer.style.width = '';
      sizer.style.height = '';
      emptyNotice.hidden = false;
      baseWidth = 0;
      baseHeight = 0;
      lastRenderedScale = 0;
      syncUi();
      if (loadingTask) {
        const task = loadingTask;
        loadingTask = null;
        try { await task.destroy(); } catch {}
      }
      if (pdfDoc) {
        const doc = pdfDoc;
        pdfDoc = null;
        try { await doc.cleanup(); } catch {}
        try { await doc.destroy(); } catch {}
      }
      return { releasedCount };
    }

    async function loadPdf(entry) {
      if (!entry?.pdf || destroyed) return false;
      await unloadPdf();
      const token = ++requestToken;
      emptyNotice.hidden = false;
      emptyNotice.textContent = `Cargando ${entry.code || entry.title}…`;
      try {
        const response = await fetch(entry.pdf);
        if (!response.ok) throw new Error(`HTTP ${response.status} al cargar ${entry.pdf}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (token !== requestToken || destroyed) return false;
        if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') {
          throw new Error('El recurso seleccionado no es un PDF válido.');
        }
        const retainedCopy = bytes.slice();
        const pdfjs = await loadPdfJs();
        if (token !== requestToken || destroyed) return false;
        loadingTask = pdfjs.getDocument({
          data: bytes,
          isEvalSupported: false,
          disableFontFace: true,
          standardFontDataUrl,
          wasmUrl
        });
        const loaded = await loadingTask.promise;
        if (token !== requestToken || destroyed) {
          try { await loaded.destroy(); } catch {}
          return false;
        }
        pdfDoc = loaded;
        activeEntry = entry;
        activeBytes = retainedCopy;
        loadedCount++;
        const meta = [];
        let maxW = 0;
        let totalH = 0;
        for (let number = 1; number <= pdfDoc.numPages; number++) {
          const page = await pdfDoc.getPage(number);
          if (token !== requestToken || destroyed) return false;
          const vp = page.getViewport({ scale: 1 });
          const pageW = vp.width * PT_TO_PX;
          const pageH = vp.height * PT_TO_PX;
          maxW = Math.max(maxW, pageW);
          totalH += pageH + (number > 1 ? PAGE_GAP : 0);
          const wrapper = document.createElement('div');
          wrapper.className = 'vpi-page';
          wrapper.dataset.page = String(number);
          wrapper.style.width = `${pageW}px`;
          wrapper.style.height = `${pageH}px`;
          const canvas = document.createElement('canvas');
          canvas.className = 'vpi-page-canvas';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `${entry.code || entry.title} · página ${number} de ${pdfDoc.numPages}`);
          wrapper.append(canvas);
          stage.append(wrapper);
          meta.push({ pageNumber: number, widthPt: vp.width, heightPt: vp.height, baseWidth: pageW, baseHeight: pageH, wrapper, canvas });
        }
        pageMeta = meta;
        baseWidth = maxW;
        baseHeight = totalH;
        stage.style.width = `${baseWidth}px`;
        stage.style.height = `${baseHeight}px`;
        sizer.hidden = false;
        emptyNotice.hidden = true;
        // Regla VPI-01 C: nunca auto-expandir el contenedor por detectar orientación horizontal.
        applyContainerWidth(sessionWidth);
        applyContainerHeight(sessionHeight);
        if (zoomMode === 'manual') applyScale(scale, { skipCrisp: true });
        else fit(zoomMode, { skipCrisp: true });
        viewport.scrollLeft = 0;
        viewport.scrollTop = 0;
        await renderPagesAtScale(token);
        if (token !== requestToken || destroyed) return false;
        syncUi();
        revealControls();
        return true;
      } catch (error) {
        if (token === requestToken && !destroyed) {
          emptyNotice.hidden = false;
          emptyNotice.textContent = `No se pudo abrir el PDF. ${error.message}`;
          notifyState();
        }
        return false;
      }
    }

    function leaveExpanded() {
      if (shell.classList.contains('vpi-expanded')) {
        shell.classList.remove('vpi-expanded');
        document.body.style.overflow = previousBodyOverflow;
      }
      applyContainerWidth(sessionWidth);
      applyContainerHeight(sessionHeight);
      if (zoomMode !== 'manual') fit(zoomMode);
      else syncUi();
    }

    async function toggleFullscreen() {
      if (fullscreenPending || destroyed) return;
      fullscreenPending = true;
      try {
        if (document.fullscreenElement === shell) {
          await document.exitFullscreen();
          return;
        }
        if (shell.classList.contains('vpi-expanded')) {
          leaveExpanded();
          return;
        }
        try {
          if (!shell.requestFullscreen) throw new Error('Sin fullscreen nativo');
          await shell.requestFullscreen();
        } catch {
          previousBodyOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
          shell.classList.add('vpi-expanded');
        }
        shell.style.width = '';
        shell.style.height = '';
        if (zoomMode !== 'manual') fit(zoomMode);
        else syncUi();
        revealControls();
      } finally {
        fullscreenPending = false;
      }
    }

    function handleContainerResized(newWidth) {
      applyContainerWidth(newWidth);
      if (zoomMode === 'manual') {
        syncUi();
      } else {
        fit(zoomMode);
      }
      revealControls();
    }

    function handleContainerHeightResized(newHeight) {
      applyContainerHeight(newHeight);
      if (zoomMode === 'page') {
        fit('page');
      } else {
        syncUi();
      }
      revealControls();
    }

    // Eventos de controles inferiores y barra vertical
    controls.addEventListener('click', event => {
      const action = event.target.closest('[data-vpi-action]')?.dataset.vpiAction;
      if (!action) return;
      if (action === 'out') scaleAt(scale - 0.1);
      if (action === 'in') scaleAt(scale + 0.1);
      if (action === 'width' || action === 'page') { fit(action); revealControls(); }
      if (action === 'fullscreen') toggleFullscreen();
    });

    zoomSlider.addEventListener('input', () => scaleAt(Number(zoomSlider.value) / 100));

    verticalScroll.addEventListener('input', () => {
      const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      viewport.scrollTop = (Number(verticalScroll.value) / 100) * maxScroll;
      revealControls();
    });

    viewport.addEventListener('scroll', () => { syncUi(); revealControls(); }, { passive: true });
    shell.addEventListener('pointermove', revealControls, { passive: true });
    shell.addEventListener('pointerdown', revealControls, { passive: true });
    shell.addEventListener('focusin', revealControls);
    shell.addEventListener('focusout', () => { hideTimer && clearTimeout(hideTimer); revealControls(); });

    for (const bar of [controls, verticalScroll, floatingFullscreen, resizeLeft, resizeRight, resizeBottomLeft, resizeBottomRight]) {
      bar.addEventListener('pointerdown', () => { controlsActive = true; revealControls(); clearTimeout(hideTimer); });
      bar.addEventListener('pointerenter', () => { revealControls(); clearTimeout(hideTimer); });
      bar.addEventListener('pointerleave', revealControls);
      bar.addEventListener('pointerup', () => { controlsActive = false; revealControls(); });
    }
    document.addEventListener('pointerup', () => { controlsActive = false; }, { signal });
    document.addEventListener('pointercancel', () => { controlsActive = false; }, { signal });

    // Rueda sin Ctrl para zoom centrado en puntero
    viewport.addEventListener('wheel', event => {
      if (!activeEntry || event.ctrlKey || isInteractive(event.target)) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1);
      const factor = Math.exp(-Math.max(-100, Math.min(100, delta)) * 0.0015);
      scaleAt(scale * factor, { x: event.clientX, y: event.clientY });
    }, { passive: false });

    // Pan libre con mouse (vertical, horizontal y diagonal)
    function startPan(event) {
      if (!activeEntry || event.pointerType !== 'mouse' || event.button !== 0 || isInteractive(event.target) || isTijeraActive() || String(getSelection()).trim()) return false;
      dragPan = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
      viewport.setPointerCapture(event.pointerId);
      shell.classList.add('vpi-grabbing');
      event.preventDefault();
      return true;
    }

    viewport.addEventListener('pointerdown', startPan);

    viewport.addEventListener('pointermove', event => {
      if (dragPan?.id !== event.pointerId) return;
      if (isTijeraActive()) { endPan(); return; }
      viewport.scrollLeft = dragPan.left - (event.clientX - dragPan.x);
      viewport.scrollTop = dragPan.top - (event.clientY - dragPan.y);
      syncUi();
    });

    function endPan() {
      if (!dragPan) return;
      dragPan = null;
      shell.classList.remove('vpi-grabbing');
      revealControls();
    }
    viewport.addEventListener('pointerup', endPan);
    viewport.addEventListener('pointercancel', endPan);
    viewport.addEventListener('lostpointercapture', endPan);

    // Pinza de 2 dedos y doble toque táctil para pantalla completa
    function touchMetrics(touches) {
      const [a, b] = touches;
      return { distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
    }
    const resetTaps = () => { tapStart = null; lastTap = null; };

    viewport.addEventListener('dblclick', event => {
      if (!activeEntry || isInteractive(event.target) || isTijeraActive() || performance.now() - lastTouchTime < 700) return;
      event.preventDefault();
      toggleFullscreen();
    });

    viewport.addEventListener('touchstart', event => {
      lastTouchTime = performance.now();
      if (!activeEntry) { resetTaps(); return; }
      if (event.touches.length === 2 && ![...event.touches].some(t => isInteractive(t.target))) {
        resetTaps();
        pinch = { ...touchMetrics(event.touches), scale };
        if (event.cancelable) event.preventDefault();
        revealControls();
        return;
      }
      if (event.touches.length !== 1 || isInteractive(event.target) || isTijeraActive()) { resetTaps(); return; }
      const touch = event.touches[0];
      tapStart = { id: touch.identifier, x: touch.clientX, y: touch.clientY, time: lastTouchTime };
    }, { passive: false });

    viewport.addEventListener('touchmove', event => {
      if (pinch && event.touches.length === 2) {
        if (event.cancelable) event.preventDefault();
        const metrics = touchMetrics(event.touches);
        scaleAt(pinch.scale * (metrics.distance / Math.max(1, pinch.distance)), metrics);
        viewport.scrollLeft -= metrics.x - pinch.x;
        viewport.scrollTop -= metrics.y - pinch.y;
        pinch.x = metrics.x;
        pinch.y = metrics.y;
        return;
      }
      const touch = [...event.touches].find(item => item.identifier === tapStart?.id);
      if (!touch || event.touches.length !== 1 || Math.hypot(touch.clientX - tapStart.x, touch.clientY - tapStart.y) > 12) resetTaps();
    }, { passive: false });

    viewport.addEventListener('touchend', event => {
      if (pinch && event.touches.length < 2) { pinch = null; revealControls(); }
      const start = tapStart;
      tapStart = null;
      lastTouchTime = performance.now();
      const touch = [...event.changedTouches].find(item => item.identifier === start?.id);
      if (!activeEntry || !start || !touch || event.touches.length || isInteractive(event.target) || lastTouchTime - start.time > 350) {
        resetTaps();
        return;
      }
      if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 12) { resetTaps(); return; }
      if (lastTap && lastTouchTime - lastTap.time < 400 && Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < 28) {
        if (event.cancelable) event.preventDefault();
        resetTaps();
        toggleFullscreen();
      } else {
        lastTap = { x: touch.clientX, y: touch.clientY, time: lastTouchTime };
      }
    }, { passive: false });

    viewport.addEventListener('touchcancel', () => { resetTaps(); pinch = null; }, { passive: true });

    // Tiradores superiores de redimensionamiento horizontal
    for (const [handle, side] of [[resizeLeft, 'left'], [resizeRight, 'right']]) {
      handle.addEventListener('pointerdown', event => {
        if (event.button !== 0 || expanded()) return;
        event.preventDefault();
        event.stopPropagation();
        const startWidth = shell.getBoundingClientRect().width;
        resizeDrag = { id: event.pointerId, startX: event.clientX, startWidth, side };
        handle.setPointerCapture(event.pointerId);
        shell.classList.add('vpi-resizing');
        revealControls();
      });
      handle.addEventListener('pointermove', event => {
        if (resizeDrag?.id !== event.pointerId || resizeDrag.side !== side) return;
        const delta = event.clientX - resizeDrag.startX;
        const outward = side === 'left' ? -delta : delta;
        // Como el contenedor está centrado, duplicar el desplazamiento mantiene el borde bajo el puntero.
        handleContainerResized(resizeDrag.startWidth + outward * 2);
      });
      const endResize = () => {
        if (!resizeDrag || resizeDrag.side !== side) return;
        resizeDrag = null;
        shell.classList.remove('vpi-resizing');
        revealControls();
      };
      handle.addEventListener('pointerup', endResize);
      handle.addEventListener('pointercancel', endResize);
      handle.addEventListener('lostpointercapture', endResize);
      handle.addEventListener('keydown', event => {
        if (expanded()) return;
        const { minWidth, maxWidth } = widthLimits();
        const current = sessionWidth ?? Math.round(shell.getBoundingClientRect().width);
        const step = event.shiftKey ? 48 : 16;
        let next = null;
        if (event.key === 'ArrowLeft') next = current + (side === 'left' ? step : -step);
        if (event.key === 'ArrowRight') next = current + (side === 'left' ? -step : step);
        if (event.key === 'Home') next = minWidth;
        if (event.key === 'End') next = maxWidth;
        if (next === null) return;
        event.preventDefault();
        handleContainerResized(next);
      });
    }

    // Tiradores inferiores de redimensionamiento vertical
    for (const [handle, side] of [[resizeBottomLeft, 'bottom-left'], [resizeBottomRight, 'bottom-right']]) {
      handle.addEventListener('pointerdown', event => {
        if (event.button !== 0 || expanded()) return;
        event.preventDefault();
        event.stopPropagation();
        const startHeight = shell.getBoundingClientRect().height;
        verticalResizeDrag = { id: event.pointerId, startY: event.clientY, startHeight, side };
        handle.setPointerCapture(event.pointerId);
        shell.classList.add('vpi-resizing');
        revealControls();
      });
      handle.addEventListener('pointermove', event => {
        if (verticalResizeDrag?.id !== event.pointerId || verticalResizeDrag.side !== side) return;
        const deltaY = event.clientY - verticalResizeDrag.startY;
        handleContainerHeightResized(verticalResizeDrag.startHeight + deltaY);
      });
      const endVerticalResize = () => {
        if (!verticalResizeDrag || verticalResizeDrag.side !== side) return;
        verticalResizeDrag = null;
        shell.classList.remove('vpi-resizing');
        revealControls();
      };
      handle.addEventListener('pointerup', endVerticalResize);
      handle.addEventListener('pointercancel', endVerticalResize);
      handle.addEventListener('lostpointercapture', endVerticalResize);
      handle.addEventListener('dblclick', event => {
        if (expanded()) return;
        event.preventDefault();
        event.stopPropagation();
        handleContainerHeightResized(null);
      });
      handle.addEventListener('keydown', event => {
        if (expanded()) return;
        const { minHeight, maxHeight } = heightLimits();
        const current = sessionHeight ?? Math.round(shell.getBoundingClientRect().height);
        const step = event.shiftKey ? 48 : 16;
        let next = null;
        if (event.key === 'ArrowDown') next = current + step;
        if (event.key === 'ArrowUp') next = current - step;
        if (event.key === 'Home') next = minHeight;
        if (event.key === 'End') next = maxHeight;
        if (next === null) return;
        event.preventDefault();
        handleContainerHeightResized(next);
      });
    }

    floatingFullscreen.addEventListener('click', toggleFullscreen);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && shell.classList.contains('vpi-expanded')) {
        leaveExpanded();
        floatingFullscreen.focus({ preventScroll: true });
      }
    }, { signal });

    document.addEventListener('fullscreenchange', () => {
      if (destroyed) return;
      if (!document.fullscreenElement) leaveExpanded();
      requestAnimationFrame(() => {
        if (zoomMode !== 'manual') fit(zoomMode);
        else syncUi();
      });
    }, { signal });

    const observer = new ResizeObserver(() => {
      if (destroyed || resizeDrag || verticalResizeDrag) return;
      applyContainerWidth(sessionWidth);
      applyContainerHeight(sessionHeight);
      if (activeEntry && zoomMode !== 'manual') fit(zoomMode);
      else syncUi();
    });
    observer.observe(host);

    applyContainerWidth(null);
    applyContainerHeight(null);
    syncUi();

    function getDiagnostics() {
      return {
        activeId: activeEntry?.id || null,
        activeCode: activeEntry?.code || null,
        orientation: activeEntry?.orientation || null,
        pageCount: pageMeta.length,
        widthPt: pageMeta[0]?.widthPt || 0,
        heightPt: pageMeta[0]?.heightPt || 0,
        scale: Number(scale.toFixed(4)),
        percent: Math.round(scale * 100),
        zoomMode,
        containerWidth: Math.round(shell.getBoundingClientRect().width || 0),
        containerHeight: Math.round(shell.getBoundingClientRect().height || 0),
        sessionWidth,
        sessionHeight,
        loadedCount,
        releasedCount,
        activeCanvases: stage.querySelectorAll('canvas').length,
        renderedCanvases: stage.querySelectorAll('canvas[data-vpi-rendered="true"]').length,
        expanded: expanded()
      };
    }

    async function destroy() {
      if (destroyed) return;
      await unloadPdf();
      destroyed = true;
      clearTimeout(hideTimer);
      clearTimeout(crispTimer);
      observer.disconnect();
      controller.abort();
      if (shell.classList.contains('vpi-expanded')) document.body.style.overflow = previousBodyOverflow;
      shell.remove();
    }

    return Object.freeze({
      shell,
      viewport,
      loadPdf,
      unloadPdf,
      fit,
      setZoom: value => scaleAt(value),
      setContainerWidth: width => handleContainerResized(width),
      setContainerHeight: height => handleContainerHeightResized(height),
      toggleFullscreen,
      beginPan: startPan,
      getPages: () => pageMeta.map(item => ({ pageNumber: item.pageNumber, width: item.baseWidth, height: item.baseHeight, element: item.wrapper })),
      getActiveBytes: () => (activeBytes ? activeBytes.slice() : null),
      getDiagnostics,
      destroy
    });
  }

  window.adcMotor01Vpi = Object.freeze({ create });
})();
