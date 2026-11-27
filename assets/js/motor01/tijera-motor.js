// MOTOR-01 · TIJ-01: Tijera inteligente por dos puntos (A -> guía -> B) en entorno experimental VPI Maestro.
// Opera únicamente sobre casilleros rectangulares experimentales en coordenadas normalizadas de página.
(() => {
  const MIN_BOX_PX = 16;
  const MAX_AXIS_ANGLE_DEG = 15;
  const MIN_SEGMENT_PX = 8;

  const DEFAULT_BOXES = Object.freeze([
    { id: 'tij-box-1', page: 1, x: 10, y: 18, w: 36, h: 14, label: 'Casillero 1', value: 'Dato titular 1' },
    { id: 'tij-box-2', page: 1, x: 10, y: 38, w: 36, h: 14, label: 'Casillero 2', value: 'Dato titular 2' },
    { id: 'tij-box-3', page: 1, x: 58, y: 18, w: 32, h: 14, label: 'Casillero 3', value: 'Dato lateral' }
  ]);

  const EXCLUDED_TARGET_SELECTOR = [
    '#adcDesignPanel',
    '#adcDesignGear',
    '#adcDesignContext',
    '[data-adc-studio-ui]:not(.tij-preview-svg)',
    'button',
    'a',
    'input',
    'textarea',
    'select',
    'label',
    '[contenteditable]',
    '[data-vpi-interactive]',
    '[data-vpi-resize]',
    '.vpi-bottom-bar',
    '.vpi-floating-fullscreen',
    '.vpi-vertical-scroll',
    '.acc1-group',
    '.vpi-maestro-sidebar',
    'header',
    'nav'
  ].join(',');

  const round4 = value => Math.round(value * 10000) / 10000;
  const clampPct = value => Math.max(0, Math.min(100, value));
  const cloneBoxes = list => (Array.isArray(list) ? list.map(item => ({ ...item })) : []);

  function isValidBoxList(list) {
    return (
      Array.isArray(list) &&
      list.every(
        item =>
          item &&
          typeof item.id === 'string' &&
          Number.isInteger(item.page) &&
          [item.x, item.y, item.w, item.h].every(Number.isFinite) &&
          item.w > 0 &&
          item.h > 0
      )
    );
  }

  function uniqueChildId(baseId, usedIds) {
    let n = 2;
    while (usedIds.has(`${baseId}-p${n}`)) n++;
    const nextId = `${baseId}-p${n}`;
    usedIds.add(nextId);
    return nextId;
  }

  function computeCutPlan({ pageNumber = 1, pageWidth, pageHeight, pointA, pointB, boxes, minBoxPx = MIN_BOX_PX, maxAngleDeg = MAX_AXIS_ANGLE_DEG }) {
    if (!Number.isFinite(pageWidth) || !Number.isFinite(pageHeight) || pageWidth <= 0 || pageHeight <= 0 || !pointA || !pointB) {
      return { valid: false, axis: 'invalid', reason: 'invalid-geometry', affectedIds: [], invalidIds: [], message: 'Geometría de página o puntos inválida.' };
    }
    const ax = (pointA.x / 100) * pageWidth;
    const ay = (pointA.y / 100) * pageHeight;
    const bx = (pointB.x / 100) * pageWidth;
    const by = (pointB.y / 100) * pageHeight;
    const dx = bx - ax;
    const dy = by - ay;
    const lengthPx = Math.hypot(dx, dy);

    if (lengthPx < MIN_SEGMENT_PX) {
      return {
        valid: false,
        axis: 'short',
        reason: 'short',
        affectedIds: [],
        invalidIds: [],
        line: { x1: ax, y1: ay, x2: bx, y2: by },
        message: 'Marcá un punto B más separado de A para trazar el corte.'
      };
    }

    const angleH = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI;
    const angleV = (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI;
    let axis = 'diagonal';
    if (angleH <= maxAngleDeg) axis = 'horizontal';
    else if (angleV <= maxAngleDeg) axis = 'vertical';

    if (axis === 'diagonal') {
      return {
        valid: false,
        axis: 'diagonal',
        reason: 'diagonal',
        affectedIds: [],
        invalidIds: [],
        line: { x1: ax, y1: ay, x2: bx, y2: by },
        message: 'Corte diagonal no admitido: el editor solo admite cajas rectangulares (trazá horizontal o vertical).'
      };
    }

    const cutPx = axis === 'horizontal' ? (ay + by) / 2 : (ax + bx) / 2;
    const cutPct = axis === 'horizontal' ? round4((cutPx / pageHeight) * 100) : round4((cutPx / pageWidth) * 100);
    const segMinX = Math.min(ax, bx);
    const segMaxX = Math.max(ax, bx);
    const segMinY = Math.min(ay, by);
    const segMaxY = Math.max(ay, by);
    const line =
      axis === 'horizontal'
        ? { x1: ax, y1: cutPx, x2: bx, y2: cutPx }
        : { x1: cutPx, y1: ay, x2: cutPx, y2: by };

    const affectedIds = [];
    const invalidIds = [];
    for (const box of boxes || []) {
      if (box.page !== pageNumber) continue;
      const bx1 = (box.x / 100) * pageWidth;
      const by1 = (box.y / 100) * pageHeight;
      const bx2 = ((box.x + box.w) / 100) * pageWidth;
      const by2 = ((box.y + box.h) / 100) * pageHeight;

      if (axis === 'horizontal') {
        if (cutPx > by1 + 0.5 && cutPx < by2 - 0.5 && segMaxX > bx1 + 0.5 && segMinX < bx2 - 0.5) {
          affectedIds.push(box.id);
          if (cutPx - by1 < minBoxPx || by2 - cutPx < minBoxPx) invalidIds.push(box.id);
        }
      } else if (cutPx > bx1 + 0.5 && cutPx < bx2 - 0.5 && segMaxY > by1 + 0.5 && segMinY < by2 - 0.5) {
        affectedIds.push(box.id);
        if (cutPx - bx1 < minBoxPx || bx2 - cutPx < minBoxPx) invalidIds.push(box.id);
      }
    }

    if (invalidIds.length) {
      return {
        valid: false,
        axis,
        reason: 'too-small',
        affectedIds,
        invalidIds,
        line,
        message: 'El corte generaría una caja menor al mínimo permitido (16 px). Ajustá el trazado.'
      };
    }

    if (!affectedIds.length) {
      return {
        valid: false,
        axis,
        reason: 'empty',
        affectedIds: [],
        invalidIds: [],
        line,
        message: 'El segmento A–B no atraviesa ninguna caja editable.'
      };
    }

    const usedIds = new Set((boxes || []).map(item => item.id));
    const affectedSet = new Set(affectedIds);
    const nextBoxes = [];
    for (const box of boxes || []) {
      if (!affectedSet.has(box.id)) {
        nextBoxes.push({ ...box });
        continue;
      }
      if (axis === 'horizontal') {
        const h1 = round4(cutPct - box.y);
        const splitY = round4(box.y + h1);
        const h2 = round4(box.y + box.h - splitY);
        nextBoxes.push({ ...box, h: h1 });
        nextBoxes.push({
          id: uniqueChildId(box.id, usedIds),
          page: box.page,
          x: box.x,
          y: splitY,
          w: box.w,
          h: h2,
          label: `${box.label} (parte 2)`,
          value: '',
          parentId: box.id
        });
      } else {
        const w1 = round4(cutPct - box.x);
        const splitX = round4(box.x + w1);
        const w2 = round4(box.x + box.w - splitX);
        nextBoxes.push({ ...box, w: w1 });
        nextBoxes.push({
          id: uniqueChildId(box.id, usedIds),
          page: box.page,
          x: splitX,
          y: box.y,
          w: w2,
          h: box.h,
          label: `${box.label} (parte 2)`,
          value: '',
          parentId: box.id
        });
      }
    }

    return {
      valid: true,
      axis,
      cutPct,
      affectedIds,
      invalidIds: [],
      line,
      nextBoxes,
      message: `Corte ${axis} listo sobre ${affectedIds.length} caja(s).`
    };
  }

  let activeEntry = null;
  let boundPages = [];
  let pageMap = new Map();
  let boxes = [];
  let tijeraActive = false;
  let pointA = null;
  let editorHooks = null;
  let viewerApi = null;
  let dirtyNotifier = null;
  let confirmLineTimer = null;
  let suppressNextViewportClick = false;
  let suppressResetTimer = null;
  let lastPlan = null;

  function isVpiMaestroVisible() {
    const allowed = Boolean(window.adcMotor01Maestro?.isAllowed?.());
    const mt2 = document.getElementById('adcTramites2');
    const panel = document.getElementById('adcVpiMaestro');
    return Boolean(allowed && mt2 && !mt2.classList.contains('hide') && panel && !panel.hidden);
  }

  function isAvailable() {
    return Boolean(isVpiMaestroVisible() && activeEntry?.id && boundPages.length);
  }

  function sayEditor(message) {
    if (message) editorHooks?.say?.(message);
  }

  function clearConfirmTimer() {
    if (confirmLineTimer) {
      clearTimeout(confirmLineTimer);
      confirmLineTimer = null;
    }
  }

  function scheduleSuppressReset() {
    if (suppressResetTimer) clearTimeout(suppressResetTimer);
    suppressResetTimer = setTimeout(() => {
      suppressNextViewportClick = false;
      suppressResetTimer = null;
    }, 300);
  }

  function clearGuideHighlights() {
    for (const boxEl of document.querySelectorAll('#adcVpiMaestro .tij-box')) {
      boxEl.classList.remove('is-affected', 'is-invalid');
    }
  }

  function clearPreviewSvg() {
    clearConfirmTimer();
    clearGuideHighlights();
    for (const item of boundPages) {
      item.svg?.replaceChildren();
    }
  }

  function createSvgNode(tag, attrs = {}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    return node;
  }

  function renderPointAMarker(pageItem, pt) {
    if (!pageItem?.svg || !pt) return;
    const ax = (pt.x / 100) * pageItem.width;
    const ay = (pt.y / 100) * pageItem.height;
    const scale = viewerApi?.getDiagnostics?.()?.scale || 1;
    const r = Math.max(3, Math.min(18, 6 / Math.max(0.25, scale)));
    pageItem.svg.append(
      createSvgNode('circle', {
        class: 'tij-point-a',
        cx: ax,
        cy: ay,
        r,
        'vector-effect': 'non-scaling-stroke'
      })
    );
  }

  function renderPreview(pointB) {
    if (!pointA) return null;
    const pageItem = pageMap.get(pointA.pageNumber);
    if (!pageItem?.svg) return null;
    clearConfirmTimer();
    clearGuideHighlights();
    pageItem.svg.replaceChildren();

    const plan = computeCutPlan({
      pageNumber: pointA.pageNumber,
      pageWidth: pageItem.width,
      pageHeight: pageItem.height,
      pointA,
      pointB,
      boxes
    });
    lastPlan = plan;

    if (plan.line) {
      const invalid = plan.axis === 'diagonal' || plan.reason === 'too-small';
      pageItem.svg.append(
        createSvgNode('line', {
          class: `tij-guide-line ${invalid ? 'is-invalid' : plan.valid ? 'is-valid' : ''}`.trim(),
          x1: plan.line.x1,
          y1: plan.line.y1,
          x2: plan.line.x2,
          y2: plan.line.y2,
          'vector-effect': 'non-scaling-stroke'
        })
      );
    }
    renderPointAMarker(pageItem, pointA);

    if (plan.affectedIds?.length) {
      const affectedSet = new Set(plan.affectedIds);
      const invalidSet = new Set(plan.invalidIds || []);
      for (const el of pageItem.boxLayer?.querySelectorAll('[data-tij-box-id]') || []) {
        const id = el.dataset.tijBoxId;
        if (invalidSet.has(id)) el.classList.add('is-invalid');
        else if (affectedSet.has(id)) el.classList.add('is-affected');
      }
    }
    return plan;
  }

  function showConfirmLine(pageNumber, line) {
    const pageItem = pageMap.get(pageNumber);
    if (!pageItem?.svg || !line) return;
    clearConfirmTimer();
    pageItem.svg.replaceChildren();
    pageItem.svg.append(
      createSvgNode('line', {
        class: 'tij-confirm-line',
        x1: line.x1,
        y1: line.y1,
        x2: line.x2,
        y2: line.y2,
        'vector-effect': 'non-scaling-stroke'
      })
    );
    confirmLineTimer = setTimeout(() => {
      pageItem.svg?.replaceChildren();
      confirmLineTimer = null;
    }, 450);
  }

  function renderBoxes() {
    for (const pageItem of boundPages) {
      const layer = pageItem.boxLayer;
      if (!layer) continue;
      layer.replaceChildren();
      for (const box of boxes) {
        if (box.page !== pageItem.pageNumber) continue;
        const el = document.createElement('div');
        el.className = 'tij-box';
        el.dataset.tijBoxId = box.id;
        el.style.left = `${box.x}%`;
        el.style.top = `${box.y}%`;
        el.style.width = `${box.w}%`;
        el.style.height = `${box.h}%`;

        const label = document.createElement('span');
        label.className = 'tij-box-label';
        label.textContent = box.label || box.id;
        el.append(label);

        if (box.value) {
          const val = document.createElement('span');
          val.className = 'tij-box-value';
          val.textContent = box.value;
          el.append(val);
        }
        layer.append(el);
      }
    }
  }

  function pageForPoint(clientX, clientY, fallbackPageNumber = null) {
    for (const item of boundPages) {
      const r = item.element.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return { item, rect: r };
      }
    }
    if (fallbackPageNumber != null) {
      const item = pageMap.get(fallbackPageNumber);
      if (item?.element?.isConnected) {
        return { item, rect: item.element.getBoundingClientRect() };
      }
    }
    return null;
  }

  function toPagePercent(rect, clientX, clientY) {
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: round4(clampPct(((clientX - rect.left) / rect.width) * 100)),
      y: round4(clampPct(((clientY - rect.top) / rect.height) * 100))
    };
  }

  function isExcludedTarget(target) {
    return !(target instanceof Element) || Boolean(target.closest(EXCLUDED_TARGET_SELECTOR));
  }

  function commitCut(plan) {
    const docId = activeEntry?.id;
    if (!docId || !editorHooks?.recordTransaction) return false;
    const beforeSnapshot = cloneBoxes(boxes);
    const afterSnapshot = cloneBoxes(plan.nextBoxes);
    const applyCut = () => {
      if (activeEntry?.id !== docId) return false;
      boxes = cloneBoxes(afterSnapshot);
      renderBoxes();
      dirtyNotifier?.();
      return true;
    };
    const undoCut = () => {
      if (activeEntry?.id !== docId) return false;
      clearPreviewSvg();
      pointA = null;
      boxes = cloneBoxes(beforeSnapshot);
      renderBoxes();
      dirtyNotifier?.();
      return true;
    };
    const committed = editorHooks.recordTransaction({
      kind: 'splitBoxes',
      label: `Corte ${plan.axis} TIJ-01`,
      applyFn: applyCut,
      undoFn: undoCut
    });
    if (committed) {
      sayEditor(`Corte ${plan.axis} aplicado sobre ${plan.affectedIds.length} caja(s). Tijera lista para otro corte.`);
    }
    return committed;
  }

  function cancelPending() {
    if (!pointA) return false;
    pointA = null;
    lastPlan = null;
    clearPreviewSvg();
    return true;
  }

  function setActive(flag, hooks = null) {
    const next = Boolean(flag && isAvailable());
    if (hooks) editorHooks = hooks;
    tijeraActive = next;
    document.body.classList.toggle('adcTijeraActive', next);
    if (!next) {
      pointA = null;
      lastPlan = null;
      clearPreviewSvg();
    }
    return tijeraActive;
  }

  function bindDocument(entry, pages, { viewer = null, onDirty = null } = {}) {
    unbindDocument();
    if (!entry?.id || !Array.isArray(pages) || !pages.length) return;
    activeEntry = entry;
    viewerApi = viewer;
    dirtyNotifier = onDirty;

    const draft = window.adcMotor01Drafts?.load?.(entry.id);
    boxes = isValidBoxList(draft?.state?.boxes) ? cloneBoxes(draft.state.boxes) : cloneBoxes(DEFAULT_BOXES);

    boundPages = pages.map(page => {
      const boxLayer = document.createElement('div');
      boxLayer.className = 'tij-box-layer';
      boxLayer.dataset.tijLayer = 'boxes';

      const svg = createSvgNode('svg', {
        class: 'tij-preview-svg',
        viewBox: `0 0 ${page.width} ${page.height}`,
        preserveAspectRatio: 'none',
        'aria-hidden': 'true'
      });
      svg.dataset.tijLayer = 'preview';
      svg.dataset.adcStudioUi = '';

      page.element.append(boxLayer, svg);
      return { ...page, boxLayer, svg };
    });
    pageMap = new Map(boundPages.map(item => [item.pageNumber, item]));
    renderBoxes();
  }

  function unbindDocument() {
    pointA = null;
    lastPlan = null;
    clearConfirmTimer();
    if (tijeraActive) {
      tijeraActive = false;
      document.body.classList.remove('adcTijeraActive');
      editorHooks?.deactivateTool?.();
    }
    for (const item of boundPages) {
      item.boxLayer?.remove();
      item.svg?.remove();
    }
    boundPages = [];
    pageMap = new Map();
    boxes = [];
    activeEntry = null;
    viewerApi = null;
    dirtyNotifier = null;
  }

  function resetDocumentBoxes() {
    if (!activeEntry?.id) return;
    pointA = null;
    lastPlan = null;
    clearPreviewSvg();
    boxes = cloneBoxes(DEFAULT_BOXES);
    renderBoxes();
  }

  // Listener en fase de captura en window (antes de Studio direct-drag y editor heredado)
  window.addEventListener(
    'pointerdown',
    event => {
      if (event.button !== 0 || !isVpiMaestroVisible()) return;
      const inShell = event.target instanceof Element && event.target.closest('#adcVpiMaestro [data-vpi-shell]');
      if (!inShell) return;

      // Fuera de Tijera y con el editor abierto, permitir pan nativo del visor sobre el viewport sin que Studio arrastre el contenedor.
      if (!tijeraActive || !isAvailable()) {
        if (
          document.body.classList.contains('adcDesignActive') &&
          event.target.closest('.vpi-viewport') &&
          !isExcludedTarget(event.target)
        ) {
          if (viewerApi?.beginPan?.(event)) {
            suppressNextViewportClick = true;
            scheduleSuppressReset();
            event.stopImmediatePropagation();
          }
        }
        return;
      }

      if (isExcludedTarget(event.target)) return;
      const hit = pageForPoint(event.clientX, event.clientY);
      if (!hit) return;
      const coords = toPagePercent(hit.rect, event.clientX, event.clientY);
      if (!coords) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      suppressNextViewportClick = true;
      scheduleSuppressReset();

      if (!pointA) {
        clearConfirmTimer();
        pointA = { pageNumber: hit.item.pageNumber, x: coords.x, y: coords.y };
        lastPlan = null;
        clearGuideHighlights();
        hit.item.svg.replaceChildren();
        renderPointAMarker(hit.item, pointA);
        sayEditor('Punto A fijado. Mové el cursor y hacé un segundo clic en B para cortar. Esc cancela.');
        return;
      }

      if (hit.item.pageNumber !== pointA.pageNumber) {
        cancelPending();
        sayEditor('Los puntos A y B deben marcarse en la misma página. Corte cancelado.');
        return;
      }

      const plan = renderPreview(coords);
      if (!plan?.valid) {
        const msg = plan?.message || 'Corte no válido.';
        pointA = null;
        clearPreviewSvg();
        sayEditor(msg);
        return;
      }

      const pageNumber = pointA.pageNumber;
      pointA = null;
      lastPlan = null;
      clearGuideHighlights();
      if (commitCut(plan)) {
        showConfirmLine(pageNumber, plan.line);
      } else {
        clearPreviewSvg();
      }
    },
    true
  );

  window.addEventListener(
    'pointermove',
    event => {
      if (!tijeraActive || !pointA || !isAvailable()) return;
      const hit = pageForPoint(event.clientX, event.clientY, pointA.pageNumber);
      if (!hit || hit.item.pageNumber !== pointA.pageNumber) return;
      const coords = toPagePercent(hit.rect, event.clientX, event.clientY);
      if (!coords) return;
      renderPreview(coords);
    },
    true
  );

  window.addEventListener(
    'click',
    event => {
      if (!suppressNextViewportClick) return;
      if (event.target instanceof Element && event.target.closest('#adcVpiMaestro [data-vpi-shell]')) {
        suppressNextViewportClick = false;
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.adcMotor01Tijera = Object.freeze({
    MIN_BOX_PX,
    MAX_AXIS_ANGLE_DEG,
    computeCutPlan,
    isAvailable,
    isActive: () => tijeraActive,
    setActive,
    bindDocument,
    unbindDocument,
    cancelPending,
    resetDocumentBoxes,
    exportBoxes: () => (activeEntry?.id ? cloneBoxes(boxes) : null),
    getState: () => ({
      active: tijeraActive,
      available: isAvailable(),
      docId: activeEntry?.id || null,
      pointA: pointA ? { ...pointA } : null,
      lastPlan: lastPlan ? { axis: lastPlan.axis, valid: lastPlan.valid, reason: lastPlan.reason || null, affectedIds: [...(lastPlan.affectedIds || [])] } : null,
      boxes: cloneBoxes(boxes)
    })
  });
})();
