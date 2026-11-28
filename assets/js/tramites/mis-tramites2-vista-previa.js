// MT2-01: vista previa en miniatura bajo demanda para sugerencias y formularios destacados.
(() => {
  const STATIC_IMAGES = Object.freeze({
    dj01: ['assets/formularios/miniaturas/dj01.png', 'assets/formularios/miniaturas/dj01-pagina-2.png'],
    dj02: 'assets/formularios/miniaturas/dj02.png',
    ol01: 'assets/formularios/miniaturas/ol01.png',
    sc01: 'assets/formularios/SC-01-plantilla.png',
    dl01: 'assets/formularios/miniaturas/dl01.png',
    bd02: ['assets/formularios/BD-02-pagina-1.png', 'assets/formularios/BD-02-pagina-2.png'],
    'form-1': 'assets/formularios/miniaturas/form-1.png',
    'form-5': 'assets/formularios/miniaturas/form-5.png',
    'form-7': 'assets/formularios/miniaturas/form-7.png',
    df01: 'assets/formularios/miniaturas/df01.png',
    tp01: 'assets/formularios/miniaturas/tp01.png',
    si01: 'assets/formularios/miniaturas/si01.png',
    ba01: 'assets/formularios/miniaturas/ba01.png',
    bd01: 'assets/formularios/miniaturas/bd01.png',
    beneficiarios: 'assets/formularios/miniaturas/beneficiarios.png',
    'acta-designacion': 'assets/formularios/miniaturas/acta-designacion.png'
  });

  const SPECIALIZED_SECTIONS = Object.freeze({
    dj01: [
      { title: 'Datos del docente', fields: ['Apellido y nombres', 'DNI / CUIL', 'Domicilio y localidad'] },
      { title: 'Cargos e instituciones', fields: ['Establecimiento y nivel', 'Situación de revista y horas'] },
      { title: 'Horarios y firma', fields: ['Grilla semanal por turno', 'Declaración jurada y firma'] }
    ],
    dj02: [
      { title: 'Identificación docente', fields: ['Apellido y nombres', 'DNI y domicilio', 'Título y antigüedad'] },
      { title: 'Licencias anteriores', fields: ['Artículo e inciso', 'Desde / Hasta y disposición'] },
      { title: 'Presentación', fields: ['Establecimiento', 'Firma del docente'] }
    ],
    ol01: [
      { title: 'Datos del agente', fields: ['Apellido y nombres', 'DNI / Edad', 'Establecimiento'] },
      { title: 'Motivo y período', fields: ['Artículo / causa', 'Desde – Hasta y observaciones'] },
      { title: 'Grupo familiar y anexos', fields: ['Declaración familiar (si aplica)', 'Firma y respaldo'] }
    ],
    dl01: [
      { title: 'Establecimiento y cargos', fields: ['Institución del perfil', 'Cargos afectados por horario'] },
      { title: 'Motivo e imputación', fields: ['Causal legal (Ley 647-E)', 'Con o sin goce de haberes'] },
      { title: 'Período y firmas', fields: ['Desde – Hasta', 'Firma docente y dirección'] }
    ]
  });

  const OPEN_DELAY_MS = 35;
  const SWITCH_DELAY_MS = 0;
  const CLOSE_DELAY_MS = 180;

  const node = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };

  function resolveImages(nativeId) {
    const prepared = window.adcPreparedPdfForms?.[nativeId];
    if (prepared?.pages?.length) {
      const pages = prepared.pages.map(page => page?.image).filter(Boolean);
      if (pages.length) return pages;
    }
    const entry = STATIC_IMAGES[nativeId];
    return Array.isArray(entry) ? entry.filter(Boolean) : entry ? [entry] : [];
  }

  function resolveSections(nativeId) {
    if (SPECIALIZED_SECTIONS[nativeId]) return SPECIALIZED_SECTIONS[nativeId];
    const form = (window.adcOfficialFormsData || []).find(item => item.id === nativeId);
    if (!form?.sections?.length) {
      return [{ title: 'Datos del documento', fields: ['Identificación del agente', 'Establecimiento y trámite', 'Fecha y firma'] }];
    }
    return form.sections.slice(0, 3).map(section => {
      const visibleFields = (section.fields || []).filter(field => !field.legacyOnly);
      const labels = (visibleFields.length ? visibleFields : section.fields || [])
        .slice(0, 3)
        .map(field => field.label || field.key);
      return {
        title: section.title || 'Sección del formulario',
        fields: labels.length ? labels : ['Campos del formulario']
      };
    });
  }

  function buildStructuredSheet(code, title, sections, badgeLabel = '') {
    const sheet = node('div', undefined, 'mt2-preview-sheet mt2-preview-doc');
    const brand = node('div', undefined, 'mt2-preview-doc-brand');
    brand.append(node('span', 'ADC', 'mt2-preview-doc-mark'), node('span', 'Asistente Docente Chaco'));
    const heading = node('div', undefined, 'mt2-preview-doc-title');
    heading.textContent = [code, title].filter(Boolean).join(' · ');
    sheet.append(brand, heading);
    if (badgeLabel) sheet.append(node('p', badgeLabel, 'mt2-preview-doc-badge'));

    const body = node('div', undefined, 'mt2-preview-doc-sections');
    for (const section of sections.slice(0, 3)) {
      const block = node('div', undefined, 'mt2-preview-doc-section');
      block.append(node('strong', section.title));
      const fieldsRow = node('div', undefined, 'mt2-preview-doc-fields');
      for (const label of section.fields.slice(0, 3)) {
        const field = node('div', undefined, 'mt2-preview-doc-field');
        field.append(node('span', label), node('i', ''));
        fieldsRow.append(field);
      }
      block.append(fieldsRow);
      body.append(block);
    }
    sheet.append(body);
    return sheet;
  }

  function createModalZoomController({ modal, zoomBar, modalBody }) {
    const outBtn = node('button', '−');
    outBtn.type = 'button';
    outBtn.dataset.mt2Zoom = 'out';
    outBtn.setAttribute('aria-label', 'Alejar');

    const output = node('output', '100 %');
    output.dataset.mt2ZoomOutput = '';
    output.setAttribute('aria-live', 'polite');

    const inBtn = node('button', '+');
    inBtn.type = 'button';
    inBtn.dataset.mt2Zoom = 'in';
    inBtn.setAttribute('aria-label', 'Acercar');

    const widthBtn = node('button', 'Ajustar ancho');
    widthBtn.type = 'button';
    widthBtn.dataset.mt2Zoom = 'width';
    widthBtn.setAttribute('aria-pressed', 'true');

    const fitBtn = node('button', 'Ajustar hoja');
    fitBtn.type = 'button';
    fitBtn.dataset.mt2Zoom = 'fit';
    fitBtn.setAttribute('aria-pressed', 'false');

    zoomBar.append(outBtn, output, inBtn, widthBtn, fitBtn);

    let media = null;
    let imgs = [];
    let mode = 'width';
    let scale = 1;
    const MIN_SCALE = 0.35;
    const MAX_SCALE = 2.5;
    const pan = { active: false, moved: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 };

    const readyImgs = () => imgs.filter(el => el.isConnected && el.naturalWidth > 0 && el.naturalHeight > 0);

    function applyScale(nextScale, nextMode = mode) {
      const ready = readyImgs();
      if (!ready.length || !media) return;
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale));
      mode = nextMode;
      for (const el of ready) {
        el.style.width = `${Math.round(el.naturalWidth * scale)}px`;
        el.style.height = `${Math.round(el.naturalHeight * scale)}px`;
      }
      output.textContent = `${Math.round(scale * 100)} %`;
      widthBtn.setAttribute('aria-pressed', String(mode === 'width'));
      fitBtn.setAttribute('aria-pressed', String(mode === 'fit'));
      outBtn.disabled = scale <= MIN_SCALE + 0.01;
      inBtn.disabled = scale >= MAX_SCALE - 0.01;
      media.classList.toggle('can-pan', media.scrollWidth > media.clientWidth + 1 || media.scrollHeight > media.clientHeight + 1);
    }

    function fitTo(targetMode) {
      const ready = readyImgs();
      if (!ready.length || !media) return;
      const availW = Math.max(120, media.clientWidth - 28);
      const availH = Math.max(120, media.clientHeight - 28);
      const maxW = Math.max(...ready.map(el => el.naturalWidth));
      const first = ready[0];
      const scaleW = Math.min(1.6, availW / maxW);
      const next = targetMode === 'fit'
        ? Math.min(1.6, availW / first.naturalWidth, availH / first.naturalHeight)
        : scaleW;
      applyScale(next, targetMode);
    }

    function reset() {
      pan.active = false;
      media?.classList.remove('is-panning', 'can-pan');
      media = null;
      imgs = [];
      mode = 'width';
      scale = 1;
      zoomBar.hidden = true;
      modalBody.classList.remove('is-structured');
    }

    function attach(targetMedia) {
      reset();
      const targetImgs = targetMedia ? [...targetMedia.querySelectorAll('img')] : [];
      if (!targetImgs.length) {
        modalBody.classList.add('is-structured');
        return;
      }
      media = targetMedia;
      imgs = targetImgs;
      zoomBar.hidden = false;

      for (const el of targetImgs) {
        el.addEventListener('error', () => {
          if (imgs.includes(el) && !targetMedia.querySelector('img')) {
            reset();
            modalBody.classList.add('is-structured');
          }
        }, { once: true });
        el.addEventListener('load', () => {
          if (modal.open && imgs.includes(el)) {
            if (mode !== 'manual') fitTo(mode);
            else applyScale(scale, 'manual');
          }
        });
        el.addEventListener('click', () => {
          if (pan.moved) {
            pan.moved = false;
            return;
          }
          fitTo(mode === 'fit' ? 'width' : 'fit');
        });
      }
      if (readyImgs().length) fitTo('width');

      targetMedia.addEventListener('wheel', event => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        applyScale(scale + (event.deltaY < 0 ? 0.15 : -0.15), 'manual');
      }, { passive: false });

      targetMedia.addEventListener('pointerdown', event => {
        if (event.pointerType === 'touch' || event.button !== 0 || !targetMedia.classList.contains('can-pan')) return;
        pan.active = true;
        pan.moved = false;
        pan.startX = event.clientX;
        pan.startY = event.clientY;
        pan.scrollLeft = targetMedia.scrollLeft;
        pan.scrollTop = targetMedia.scrollTop;
        targetMedia.classList.add('is-panning');
      });
    }

    window.addEventListener('pointermove', event => {
      if (!pan.active || !media) return;
      const dx = event.clientX - pan.startX;
      const dy = event.clientY - pan.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) pan.moved = true;
      media.scrollLeft = pan.scrollLeft - dx;
      media.scrollTop = pan.scrollTop - dy;
    });
    window.addEventListener('pointerup', () => {
      if (!pan.active) return;
      pan.active = false;
      media?.classList.remove('is-panning');
    });

    outBtn.addEventListener('click', () => applyScale(scale - 0.25, 'manual'));
    inBtn.addEventListener('click', () => applyScale(scale + 0.25, 'manual'));
    widthBtn.addEventListener('click', () => fitTo('width'));
    fitBtn.addEventListener('click', () => fitTo('fit'));

    return Object.freeze({
      attach,
      refit() {
        if (modal.open && readyImgs().length && mode !== 'manual') fitTo(mode);
      },
      reset
    });
  }

  function buildVisualForForm(nativeId, code, title, isModal = false, onLoad = null) {
    const imageUrls = resolveImages(nativeId);
    const sections = resolveSections(nativeId);
    if (!imageUrls.length) return buildStructuredSheet(code, title, sections);

    const multipage = imageUrls.length > 1;
    const baseClass = isModal ? 'mt2-preview-modal-media' : 'mt2-preview-sheet mt2-preview-sheet-image';
    const frame = node('div', undefined, multipage ? `${baseClass} is-multipage` : baseClass);
    const container = isModal && multipage ? node('div', undefined, 'mt2-preview-modal-stack') : frame;
    if (container !== frame) frame.append(container);

    for (const [index, imageUrl] of imageUrls.entries()) {
      const pageWrap = multipage ? node('div', undefined, isModal ? 'mt2-preview-modal-page' : 'mt2-preview-page') : null;
      if (pageWrap) {
        pageWrap.append(node('span', `Hoja ${index + 1} de ${imageUrls.length}`, 'mt2-preview-page-tag'));
      }
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = multipage
        ? `Vista previa de ${[code, title].filter(Boolean).join(' · ')} · hoja ${index + 1} de ${imageUrls.length}`
        : `Vista previa de ${[code, title].filter(Boolean).join(' · ')}`;
      if (typeof onLoad === 'function') {
        img.addEventListener('load', () => {
          if (frame.isConnected) onLoad();
        }, { once: true });
      }
      img.src = imageUrl;
      img.addEventListener('error', () => {
        if (!frame.isConnected) return;
        if (index === 0) {
          frame.replaceWith(buildStructuredSheet(code, title, sections));
        } else {
          (pageWrap || img).remove();
        }
        if (typeof onLoad === 'function') onLoad();
      }, { once: true });
      if (pageWrap) {
        pageWrap.append(img);
        container.append(pageWrap);
      } else {
        container.append(img);
      }
    }
    return frame;
  }

  function buildReasonVisual(record, onMediaLoad = null) {
    const reason = record.reason || record.title || '';
    const isIllness = reason === 'Enfermedad o lesión común';
    const isReady = typeof adcDL01Ready !== 'undefined' && adcDL01Ready.has(reason);
    const wrap = node('div', undefined, 'mt2-preview-route');

    const pillText = isIllness
      ? 'Recorrido guiado en 2 pasos · Formulario DL-01'
      : isReady
        ? 'Recorrido guiado · Formulario DL-01'
        : 'Asociación automática pendiente';
    wrap.append(node('span', pillText, isReady ? 'mt2-preview-route-pill' : 'mt2-preview-route-pill is-pending'));

    if (isReady) {
      wrap.append(buildVisualForForm('dl01', 'DL-01', 'Licencias y permisos', false, onMediaLoad));
      wrap.append(
        node(
          'p',
          isIllness
            ? 'Elegís institución y período Desde / Hasta para generar el DL-01 con tus cargos afectados.'
            : 'Confirmás situación de revista y detalle para preparar el formulario DL-01.'
        )
      );
    } else {
      wrap.append(
        node('p', 'Este motivo todavía no tiene asignación automática validada.'),
        node('p', 'En el asistente podés revisar las opciones y elegir el formulario indicado por tu institución.')
      );
    }

    if (isReady && typeof adcDurations !== 'undefined' && Array.isArray(adcDurations[reason])) {
      const titular = adcDurations[reason][0];
      if (titular && titular !== '?') {
        wrap.append(node('p', `Referencia titular: ${titular}`, 'mt2-preview-route-duration'));
      }
    }
    return wrap;
  }

  function create({ root, openForm, startAssistant }) {
    if (!root) return null;

    const card = node('aside', undefined, 'mt2-preview-popover');
    card.id = 'adcMT2PreviewCard';
    card.hidden = true;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-labelledby', 'adcMT2PreviewHeading');

    const cardHeader = node('div', undefined, 'mt2-preview-header');
    const cardTitleWrap = node('div', undefined, 'mt2-preview-title-wrap');
    cardTitleWrap.insertAdjacentHTML(
      'afterbegin',
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg>'
    );
    const cardHeading = node('strong', 'Vista previa del formulario');
    cardHeading.id = 'adcMT2PreviewHeading';
    cardTitleWrap.append(cardHeading);

    const cardClose = node('button', '×', 'mt2-preview-close');
    cardClose.type = 'button';
    cardClose.setAttribute('aria-label', 'Cerrar vista previa');
    cardHeader.append(cardTitleWrap, cardClose);

    const cardBody = node('div', undefined, 'mt2-preview-body');
    const cardFooter = node('div', undefined, 'mt2-preview-footer');
    card.append(cardHeader, cardBody, cardFooter);
    root.append(card);

    const modal = node('dialog', undefined, 'mt2-preview-modal');
    modal.id = 'adcMT2PreviewModal';
    modal.setAttribute('aria-labelledby', 'adcMT2PreviewModalTitle');
    const modalHead = node('div', undefined, 'mt2-preview-modal-head');
    const modalTitle = node('h2', 'Vista previa');
    modalTitle.id = 'adcMT2PreviewModalTitle';
    const modalClose = node('button', '×', 'mt2-preview-modal-close');
    modalClose.type = 'button';
    modalClose.setAttribute('aria-label', 'Cerrar vista ampliada');
    modalHead.append(modalTitle, modalClose);
    const modalZoomBar = node('div', undefined, 'mt2-preview-zoombar');
    modalZoomBar.hidden = true;
    const modalBody = node('div', undefined, 'mt2-preview-modal-body');
    const modalFoot = node('div', undefined, 'mt2-preview-modal-foot');
    modal.append(modalHead, modalZoomBar, modalBody, modalFoot);
    root.append(modal);
    const modalZoom = createModalZoomController({ modal, zoomBar: modalZoomBar, modalBody });

    let activeRecord = null;
    let activeAnchor = null;
    let activeVerticalOnly = false;
    let modalReturnFocus = null;
    let openTimer = null;
    let closeTimer = null;
    let suppressFocusPreview = false;
    let lastTouchTs = 0;

    const restoreFocusSafely = target => {
      if (!target?.isConnected) return;
      suppressFocusPreview = true;
      try {
        target.focus({ preventScroll: true });
      } finally {
        suppressFocusPreview = false;
      }
    };

    const clearTimers = () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      openTimer = null;
      closeTimer = null;
    };

    const supportsFineHover = () => window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches !== false;

    function hide({ restoreFocus = false } = {}) {
      clearTimers();
      const targetAnchor = activeAnchor;
      activeRecord = null;
      activeAnchor = null;
      activeVerticalOnly = false;
      if (!card.hidden) {
        card.hidden = true;
        card.removeAttribute('data-side');
        card.removeAttribute('data-mode');
      }
      if (restoreFocus && targetAnchor?.isConnected) {
        restoreFocusSafely(targetAnchor);
      }
    }

    function scheduleClose() {
      clearTimeout(openTimer);
      openTimer = null;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => hide(), CLOSE_DELAY_MS);
    }

    function openModal(record, trigger = activeAnchor) {
      if (!record) return;
      const isReasonReady = record.kind === 'reason' && typeof adcDL01Ready !== 'undefined' && adcDL01Ready.has(record.reason);
      if (record.kind !== 'form' && !isReasonReady) return;
      hide();
      modalReturnFocus = trigger?.isConnected ? trigger : null;
      if (isReasonReady) {
        modalTitle.textContent = `${record.title || record.reason} · Formulario DL-01`;
        const visual = buildVisualForForm('dl01', 'DL-01', 'Licencias y permisos', true);
        modalBody.replaceChildren(
          visual,
          node('p', 'Este motivo guía la preparación del formulario oficial DL-01 · Licencias y permisos.', 'mt2-muted')
        );
        modalFoot.replaceChildren();
        const closeBtn = node('button', 'Cerrar', 'mt2-secondary');
        closeBtn.type = 'button';
        closeBtn.onclick = () => closeModal();
        const startBtn = node('button', 'Revisar recorrido', 'mt2-open');
        startBtn.type = 'button';
        startBtn.onclick = () => {
          const target = modalReturnFocus;
          closeModal(false);
          startAssistant(record, target);
        };
        modalFoot.append(closeBtn, startBtn);
      } else {
        const code = record.displayCode || record.code || '';
        const name = record.officialName || record.title || '';
        modalTitle.textContent = [code, name].filter(Boolean).join(' · ') || 'Vista previa';
        const visual = buildVisualForForm(record.nativeId, code, name, true);
        modalBody.replaceChildren(
          visual,
          node('p', [record.group, record.status === 'pending' ? 'En preparación' : 'Disponible'].filter(Boolean).join(' · '), 'mt2-muted')
        );
        modalFoot.replaceChildren();
        const closeBtn = node('button', 'Cerrar', 'mt2-secondary');
        closeBtn.type = 'button';
        closeBtn.onclick = () => closeModal();
        modalFoot.append(closeBtn);
        if (record.status !== 'pending') {
          const openBtn = node('button', record.source?.actionLabel || 'Abrir formulario', 'mt2-open');
          openBtn.type = 'button';
          openBtn.onclick = () => {
            closeModal(false);
            openForm(record);
          };
          modalFoot.append(openBtn);
        }
      }
      if (!modal.open) modal.showModal();
      modalZoom.attach(modalBody.querySelector('.mt2-preview-modal-media'));
      modalZoom.refit();
      modalClose.focus({ preventScroll: true });
    }

    function closeModal(restore = true) {
      modalZoom.reset();
      if (modal.open) modal.close();
      if (restore && modalReturnFocus?.isConnected) {
        restoreFocusSafely(modalReturnFocus);
      }
      modalReturnFocus = null;
    }

    function positionCard(anchor, verticalOnly = activeVerticalOnly) {
      if (!anchor?.isConnected) return;
      const rect = anchor.getBoundingClientRect();
      if (!rect.width && !rect.height) {
        hide();
        return;
      }
      card.style.visibility = 'hidden';
      card.hidden = false;

      const w = card.offsetWidth || 316;
      const h = card.offsetHeight || 280;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 12;
      const gap = 10;
      const headerBottom = (document.querySelector('.adc-start-header')?.getBoundingClientRect().bottom || 0) + 8;
      const minTop = Math.max(margin, headerBottom);
      const maxTop = Math.max(minTop, vh - h - margin);
      const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

      let side;
      let left;
      let top;

      if (verticalOnly) {
        const spaceBelow = vh - margin - rect.bottom - gap;
        const spaceAbove = rect.top - minTop - gap;
        if (h <= spaceBelow || spaceBelow >= spaceAbove) {
          side = 'bottom';
          top = clamp(rect.bottom + gap, minTop, maxTop);
        } else {
          side = 'top';
          top = clamp(rect.top - gap - h, minTop, maxTop);
        }
        left = clamp(rect.left + (rect.width - w) / 2, margin, vw - w - margin);
      } else {
        side = 'right';
        left = rect.right + 14;
        top = clamp(rect.top + rect.height / 2 - Math.min(h * 0.35, 90), minTop, maxTop);
        if (left + w > vw - margin) {
          if (rect.left - 14 - w >= margin) {
            side = 'left';
            left = rect.left - 14 - w;
          } else if (rect.bottom + gap + h <= vh - margin) {
            side = 'bottom';
            top = rect.bottom + gap;
            left = clamp(rect.left + (rect.width - w) / 2, margin, vw - w - margin);
          } else {
            side = rect.top - gap - h >= minTop ? 'top' : 'bottom';
            top = side === 'top' ? rect.top - gap - h : clamp(rect.bottom + gap, minTop, maxTop);
            left = clamp(rect.left + (rect.width - w) / 2, margin, vw - w - margin);
          }
        }
      }

      card.dataset.side = side;
      card.style.left = `${Math.round(left)}px`;
      card.style.top = `${Math.round(top)}px`;
      if (side === 'left' || side === 'right') {
        const arrowY = clamp(rect.top + rect.height / 2 - top, 24, Math.max(24, h - 24));
        card.style.setProperty('--mt2-arrow-y', `${Math.round(arrowY)}px`);
      } else {
        const arrowX = clamp(rect.left + rect.width / 2 - left, 24, Math.max(24, w - 24));
        card.style.setProperty('--mt2-arrow-x', `${Math.round(arrowX)}px`);
      }
      card.style.visibility = '';
    }

    function renderRecord(record, anchor, { verticalOnly = false, mode = 'hover' } = {}) {
      activeRecord = record;
      activeAnchor = anchor;
      activeVerticalOnly = verticalOnly;
      card.dataset.mode = mode;
      cardBody.replaceChildren();
      cardFooter.replaceChildren();
      const onMediaLoad = () => {
        if (!card.hidden && activeRecord === record && activeAnchor === anchor) {
          positionCard(anchor, verticalOnly);
        }
      };

      if (record.kind === 'reason') {
        cardHeading.textContent = 'Vista previa del recorrido';
        const caption = node('div', undefined, 'mt2-preview-caption');
        caption.append(
          node('strong', record.title || record.reason),
          node('small', record.category || 'Motivo de licencia o permiso')
        );
        cardBody.append(caption, buildReasonVisual(record, onMediaLoad));
        if (typeof adcDL01Ready !== 'undefined' && adcDL01Ready.has(record.reason)) {
          const expandBtn = node('button', 'Ver completo', 'mt2-secondary mt2-preview-expand');
          expandBtn.type = 'button';
          expandBtn.onclick = () => openModal(record, activeAnchor);
          cardFooter.append(expandBtn);
        }
        const startBtn = node('button', 'Revisar recorrido', 'mt2-open');
        startBtn.type = 'button';
        startBtn.onclick = () => {
          const target = activeAnchor;
          hide();
          startAssistant(record, target);
        };
        cardFooter.append(startBtn);
      } else {
        const code = record.displayCode || record.code || '';
        const name = record.officialName || record.title || '';
        const pageCount = resolveImages(record.nativeId).length;
        cardHeading.textContent = 'Vista previa del formulario';
        const caption = node('div', undefined, 'mt2-preview-caption');
        caption.append(
          node('strong', [code, name].filter(Boolean).join(' · ')),
          node('small', [record.group || 'Catálogo de formularios', pageCount > 1 ? `${pageCount} hojas` : ''].filter(Boolean).join(' · '))
        );
        cardBody.append(buildVisualForForm(record.nativeId, code, name, false, onMediaLoad), caption);

        const expandBtn = node('button', 'Ver completo', 'mt2-secondary mt2-preview-expand');
        expandBtn.type = 'button';
        expandBtn.onclick = () => openModal(record, activeAnchor);
        cardFooter.append(expandBtn);

        if (record.status !== 'pending') {
          const openBtn = node('button', record.source?.actionLabel || 'Abrir formulario', 'mt2-open');
          openBtn.type = 'button';
          openBtn.onclick = () => {
            hide();
            openForm(record);
          };
          cardFooter.append(openBtn);
        }
      }

      positionCard(anchor);
    }

    function showDelayed(record, anchor, { verticalOnly = false } = {}) {
      if (!supportsFineHover() || !record || !anchor) return;
      clearTimers();
      if (!card.hidden && activeRecord === record && activeAnchor === anchor) return;
      const delay = card.hidden ? OPEN_DELAY_MS : SWITCH_DELAY_MS;
      openTimer = setTimeout(() => {
        if (!anchor.isConnected || root.classList.contains('hide') || modal.open) return;
        renderRecord(record, anchor, { verticalOnly, mode: verticalOnly ? 'hover' : 'suggestion' });
      }, delay);
    }

    function showForKeyboard(record, anchor) {
      if (!record || !anchor || !anchor.isConnected || root.classList.contains('hide') || modal.open) return;
      clearTimers();
      const verticalOnly = anchor.classList.contains('mt2-card');
      renderRecord(record, anchor, { verticalOnly, mode: 'keyboard' });
    }

    function showForTouch(record, anchor) {
      if (!record || !anchor || !anchor.isConnected || root.classList.contains('hide') || modal.open) return;
      clearTimers();
      renderRecord(record, anchor, { verticalOnly: true, mode: 'touch' });
    }

    function attachTarget(element, record, { onFocusVisible = false, verticalOnly = false } = {}) {
      element.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch') return;
        lastTouchTs = 0;
        showDelayed(record, element, { verticalOnly });
      });
      element.addEventListener('pointerleave', event => {
        if (event.pointerType === 'touch') return;
        if (!card.hidden && card.contains(event.relatedTarget)) return;
        scheduleClose();
      });
      if (onFocusVisible) {
        element.addEventListener('focus', () => {
          if (!suppressFocusPreview && element.matches(':focus-visible')) showForKeyboard(record, element);
        });
        element.addEventListener('blur', event => {
          if (card.contains(event.relatedTarget)) return;
          scheduleClose();
        });
      }
    }

    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      clearTimeout(closeTimer);
      closeTimer = null;
    });
    card.addEventListener('pointerleave', event => {
      if (event.pointerType === 'touch') return;
      if (activeAnchor?.contains(event.relatedTarget)) return;
      scheduleClose();
    });
    cardClose.addEventListener('click', () => hide({ restoreFocus: true }));

    modalClose.addEventListener('click', () => closeModal());
    modal.addEventListener('cancel', event => {
      event.preventDefault();
      closeModal();
    });
    modal.addEventListener('click', event => {
      if (event.target !== modal) return;
      const box = modal.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) {
        closeModal();
      }
    });

    window.addEventListener('scroll', () => {
      if (card.hidden) return;
      if (card.dataset.mode === 'touch') positionCard(activeAnchor, activeVerticalOnly);
      else hide();
    }, { passive: true });
    window.addEventListener('resize', () => {
      if (!card.hidden) hide();
      modalZoom.refit();
    }, { passive: true });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !card.hidden && !modal.open) {
        hide({ restoreFocus: card.contains(document.activeElement) });
      }
    });
    document.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') lastTouchTs = Date.now();
      else if (event.pointerType === 'mouse') lastTouchTs = 0;
      if (card.hidden) return;
      if (card.contains(event.target) || activeAnchor?.contains(event.target)) return;
      hide();
    });
    root.addEventListener('touchstart', () => { lastTouchTs = Date.now(); }, { passive: true });

    function wrapCard(targetCard, record, itemClass) {
      attachTarget(targetCard, record, { onFocusVisible: true, verticalOnly: true });
      const item = node('div', undefined, itemClass);

      item.addEventListener('click', event => {
        const fromTouch = Date.now() - lastTouchTs < 900 || !supportsFineHover();
        if (!fromTouch) return;
        if (card.hidden || activeAnchor !== targetCard) {
          event.preventDefault();
          event.stopPropagation();
          showForTouch(record, targetCard);
          return;
        }
        hide();
      }, { capture: true });

      item.append(targetCard);
      return item;
    }

    return Object.freeze({
      bindOption(option, record) {
        attachTarget(option, record);
      },
      wrapPriorityCard(priorityCard, record) {
        return wrapCard(priorityCard, record, 'mt2-priority-item');
      },
      wrapCatalogCard(catalogCard, record) {
        return wrapCard(catalogCard, record, 'mt2-catalog-item');
      },
      showForKeyboard,
      hide
    });
  }

  window.adcMT2Preview = Object.freeze({ create });
})();
