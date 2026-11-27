// Conecta la solapa experimental «VPI Maestro» dentro de Mis trámites en modo candado estricto.
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('adcTramites2');
    const registry = window.adcMotor01Registry;
    const vpiFactory = window.adcMotor01Vpi;
    if (!root || !registry || !vpiFactory) return;

    const realAuth = window.adcConfig?.authMode === 'supabase';
    const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    const hasAdminAccess = () => (realAuth ? Boolean(window.adcEditorAccess?.isAdmin?.()) : isLocalHost);

    const heading = root.querySelector('.mt2-heading');
    if (!heading) return;

    const subtabs = document.createElement('div');
    subtabs.className = 'vpi-maestro-subtabs';
    subtabs.setAttribute('role', 'group');
    subtabs.setAttribute('aria-label', 'Vistas de Mis trámites');
    subtabs.hidden = true;

    const catalogTab = document.createElement('button');
    catalogTab.type = 'button';
    catalogTab.id = 'adcMt2CatalogTab';
    catalogTab.className = 'vpi-maestro-subtab';
    catalogTab.setAttribute('aria-pressed', 'true');
    catalogTab.textContent = 'Catálogo de trámites';

    const maestroTab = document.createElement('button');
    maestroTab.type = 'button';
    maestroTab.id = 'adcVpiMaestroTab';
    maestroTab.className = 'vpi-maestro-subtab';
    maestroTab.setAttribute('aria-pressed', 'false');
    maestroTab.setAttribute('aria-controls', 'adcVpiMaestro');
    maestroTab.textContent = 'VPI Maestro';

    subtabs.append(catalogTab, maestroTab);
    heading.append(subtabs);

    const panel = document.createElement('section');
    panel.id = 'adcVpiMaestro';
    panel.className = 'vpi-maestro-panel';
    panel.setAttribute('aria-labelledby', 'adcVpiMaestroTab');
    panel.hidden = true;
    panel.innerHTML = `
      <div class="vpi-maestro-workspace">
        <aside class="vpi-maestro-sidebar" aria-labelledby="adcVpiSidebarTitle">
          <h2 id="adcVpiSidebarTitle" class="vpi-maestro-sidebar-title">¿Qué formulario estás buscando?</h2>
          <input type="search" class="vpi-maestro-filter" data-vpi-filter aria-label="¿Qué formulario estás buscando?" placeholder="Escribí código o nombre (ej.: DP-01, DL-02)…" autocomplete="off">
          <p class="vpi-maestro-count" data-vpi-count role="status" aria-live="polite"></p>
          <div class="vpi-maestro-picker" role="group" aria-label="Formularios disponibles VPI-01"></div>
        </aside>
        <div class="vpi-maestro-stage-col">
          <div class="vpi-maestro-header">
            <div>
              <p class="vpi-maestro-badge">MOTOR-01 · Fase 1 · Modo candado estricto</p>
              <h2>Entorno experimental VPI Maestro</h2>
              <p class="mt2-muted">Prueba aislada de VPI-01 sobre PDF reales bajo demanda. No modifica los formularios productivos ni sus borradores.</p>
            </div>
            <button type="button" class="vpi-maestro-unload" data-vpi-unload disabled>Descargar de memoria</button>
          </div>
          <div class="vpi-maestro-meta" role="status" aria-live="polite" data-vpi-meta></div>
          <div class="acc1-mount" data-acc1-top></div>
          <div class="vpi-maestro-host" data-vpi-host></div>
          <div class="acc1-mount" data-acc1-bottom></div>
          <div class="acc1-preview-wrap" data-acc1-preview hidden></div>
        </div>
      </div>`;

    const layout = root.querySelector('.mt2-layout');
    if (layout) layout.before(panel);
    else root.append(panel);

    const filterInput = panel.querySelector('[data-vpi-filter]');
    const countText = panel.querySelector('[data-vpi-count]');
    const picker = panel.querySelector('.vpi-maestro-picker');
    const unloadBtn = panel.querySelector('[data-vpi-unload]');
    const meta = panel.querySelector('[data-vpi-meta]');
    const host = panel.querySelector('[data-vpi-host]');
    const accTop = panel.querySelector('[data-acc1-top]');
    const accBottom = panel.querySelector('[data-acc1-bottom]');
    const accPreview = panel.querySelector('[data-acc1-preview]');

    let viewer = null;
    let acc1 = null;
    let activeMode = 'catalog';
    let selectedId = null;
    let rawManifestAttempted = false;

    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    function renderMeta(diag = viewer?.getDiagnostics()) {
      if (!diag?.activeId) {
        meta.textContent = `Sin PDF cargado en memoria · Liberaciones realizadas: ${diag?.releasedCount || 0}`;
        unloadBtn.disabled = true;
        return;
      }
      const entry = registry.byId(diag.activeId);
      const orientation = diag.widthPt > diag.heightPt ? 'Horizontal' : 'Vertical';
      meta.textContent = `${entry?.code || diag.activeId} (${orientation} · ${Math.round(diag.widthPt)} × ${Math.round(diag.heightPt)} pt · ${diag.pageCount} pág.) · Zoom ${diag.percent} % (${diag.zoomMode}) · Visor ${diag.containerWidth} × ${diag.containerHeight} px · Canvas activos: ${diag.activeCanvases} · Liberaciones: ${diag.releasedCount}`;
      unloadBtn.disabled = false;
    }

    function renderPicker() {
      const term = normalize(filterInput.value.trim());
      const matches = item => !term || normalize(`${item.code} ${item.title} ${item.dimensionsLabel}`).includes(term);
      const adcList = registry.catalog().filter(matches);
      const rawList = registry.raw().filter(matches);
      picker.replaceChildren();

      const appendGroup = (headingText, items) => {
        if (!items.length) return;
        const label = document.createElement('p');
        label.className = 'vpi-maestro-group-title';
        label.textContent = headingText;
        picker.append(label);
        for (const item of items) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'vpi-maestro-doc-btn';
          btn.dataset.vpiDoc = item.id;
          btn.setAttribute('aria-pressed', String(item.id === selectedId));
          const title = document.createElement('strong');
          title.textContent = item.code;
          const desc = document.createElement('small');
          desc.textContent = item.sourceGroup === 'raw' ? item.dimensionsLabel : `${item.title} · ${item.dimensionsLabel}`;
          btn.append(title, desc);
          btn.addEventListener('click', () => openDocument(item.id));
          picker.append(btn);
        }
      };

      appendGroup(`Catálogo ADC (${adcList.length})`, adcList);
      appendGroup(`Materiales crudos locales (${rawList.length})`, rawList);

      const totalShown = adcList.length + rawList.length;
      const totalAll = registry.list().length;
      countText.textContent = term ? `${totalShown} de ${totalAll} formularios` : `${totalAll} formularios disponibles`;
      if (!totalShown) {
        const empty = document.createElement('p');
        empty.className = 'mt2-muted';
        empty.textContent = 'Sin coincidencias para ese filtro.';
        picker.append(empty);
      }
    }

    async function ensureRawCatalogLoaded() {
      if (rawManifestAttempted) return;
      rawManifestAttempted = true;
      if (realAuth) return;
      try {
        const response = await fetch('__vpi-materiales/manifest.json', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        if (Array.isArray(payload?.files) && payload.files.length) {
          registry.registerRawFiles(payload.files);
          renderPicker();
        }
      } catch {
        // Sin endpoint local de materiales, se conserva únicamente el catálogo ADC.
      }
    }

    function ensureViewer() {
      if (!viewer) {
        viewer = vpiFactory.create({ host, onStateChange: renderMeta });
      }
      if (!acc1 && window.adcMotor01Acc1 && window.adcMotor01Drafts) {
        acc1 = window.adcMotor01Acc1.create({
          topMount: accTop,
          bottomMount: accBottom,
          previewMount: accPreview,
          drafts: window.adcMotor01Drafts,
          getContext: () => ({
            entry: selectedId ? registry.byId(selectedId) : null,
            bytes: viewer?.getActiveBytes?.() || null,
            diagnostics: viewer?.getDiagnostics?.() || null,
            boxes: window.adcMotor01Tijera?.exportBoxes?.() || null,
            onClear: () => window.adcMotor01Tijera?.resetDocumentBoxes?.()
          })
        });
      }
      return viewer;
    }

    function updatePickerButtons() {
      for (const btn of picker.querySelectorAll('[data-vpi-doc]')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.vpiDoc === selectedId));
      }
    }

    async function openDocument(id) {
      if (!hasAdminAccess()) return false;
      const entry = registry.byId(id);
      if (!entry) return false;
      setMode('maestro');
      const instance = ensureViewer();
      acc1?.setDocument(null);
      window.adcMotor01Tijera?.unbindDocument?.();
      selectedId = id;
      updatePickerButtons();
      const ok = await instance.loadPdf(entry);
      if (!ok && selectedId === id) {
        selectedId = null;
        updatePickerButtons();
        acc1?.setDocument(null);
      } else if (ok) {
        window.adcMotor01Tijera?.bindDocument?.(entry, instance.getPages?.() || [], {
          viewer: instance,
          onDirty: () => acc1?.setSaveState('idle', `${entry.code || entry.id} · cambios en casilleros sin guardar`)
        });
        acc1?.setDocument(entry);
      }
      renderMeta(instance.getDiagnostics());
      return ok;
    }

    async function closeDocument() {
      selectedId = null;
      updatePickerButtons();
      acc1?.setDocument(null);
      window.adcMotor01Tijera?.unbindDocument?.();
      if (viewer) {
        await viewer.unloadPdf();
        renderMeta(viewer.getDiagnostics());
      } else {
        renderMeta();
      }
    }

    function setMode(mode) {
      if (mode === 'maestro' && !hasAdminAccess()) mode = 'catalog';
      activeMode = mode;
      const showMaestro = mode === 'maestro';
      catalogTab.setAttribute('aria-pressed', String(!showMaestro));
      maestroTab.setAttribute('aria-pressed', String(showMaestro));
      panel.hidden = !showMaestro;
      if (layout) layout.hidden = showMaestro;
      if (showMaestro) {
        ensureViewer();
        ensureRawCatalogLoaded();
        renderMeta();
      } else if (viewer?.getDiagnostics().activeId) {
        closeDocument();
      }
    }

    function syncAccess() {
      const allowed = hasAdminAccess();
      subtabs.hidden = !allowed;
      if (!allowed && activeMode === 'maestro') {
        setMode('catalog');
      } else if (!allowed && viewer) {
        closeDocument();
      }
    }

    filterInput.addEventListener('input', renderPicker);
    catalogTab.addEventListener('click', () => setMode('catalog'));
    maestroTab.addEventListener('click', () => setMode('maestro'));
    unloadBtn.addEventListener('click', closeDocument);

    window.addEventListener('adc:editor-admin', syncAccess);
    window.addEventListener('adc:auth-changed', syncAccess);
    window.adcNavigation?.onNavigate?.(next => {
      if (next !== 'tramites2' && viewer?.getDiagnostics().activeId) {
        closeDocument();
      }
    });

    window.adcMotor01Maestro = Object.freeze({
      open: openDocument,
      close: closeDocument,
      setMode,
      isAllowed: hasAdminAccess,
      getDiagnostics: () => viewer?.getDiagnostics() || null
    });

    renderPicker();
    syncAccess();
  });
})();
