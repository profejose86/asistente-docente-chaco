// Conecta DL-01 con los datos existentes, sin copiar ni modificar el perfil.
(() => {
  const pdfModuleURL = new URL('../../vendor/pdfjs/pdf.min.mjs',document.currentScript.src);
  window.adcDL01ShowPreview = async function(frame,bytes,request,printButton,status) {
    const current = () => frame.isConnected && adcPDFRequest === request;
    printButton.disabled = true;
    frame.dataset.adcPreviewState = 'loading';
    status.textContent = 'Preparando las páginas para vista previa e impresión…';
    let pdf;
    let loadTimer;
    try {
      const loaded = new Promise((resolve,reject) => {
        frame.addEventListener('load',() => {clearTimeout(loadTimer);resolve();},{once:true});
        loadTimer = setTimeout(() => reject(new Error('La vista previa no terminó de cargar.')),10000);
      });
      frame.srcdoc = '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>DL-01 para imprimir</title><style>body{margin:0;padding:12px;background:#e8edf3}canvas{display:block;max-width:100%;height:auto;margin:0 auto 12px;background:white}@media print{html,body{margin:0;padding:0;background:white}canvas{max-width:none;width:var(--paper-width);height:var(--paper-height);margin:0;break-after:page}canvas:last-child{break-after:auto}}</style></head><body></body></html>';
      await loaded;
      if (!current()) return false;
      const pdfjs = await import(pdfModuleURL.href);
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs',pdfModuleURL).href;
      pdf = await pdfjs.getDocument({
        data:Uint8Array.from(bytes),isEvalSupported:false,disableFontFace:true,
        standardFontDataUrl:new URL('standard_fonts/',pdfModuleURL).href,
        wasmUrl:new URL('wasm/',pdfModuleURL).href
      }).promise;
      for (let number=1;number<=pdf.numPages;number++) {
        if (!current()) return false;
        const page = await pdf.getPage(number);
        const paper = page.getViewport({scale:1});
        const viewport = page.getViewport({scale:2});
        const canvas = frame.contentDocument.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = paper.width+'pt';
        canvas.style.setProperty('--paper-width',paper.width+'pt');
        canvas.style.setProperty('--paper-height',paper.height+'pt');
        canvas.setAttribute('role','img');
        canvas.setAttribute('aria-label','Página '+number+' de '+pdf.numPages+' del DL-01');
        if (number===1) {
          const style = frame.contentDocument.createElement('style');
          style.textContent = '@page{size:'+paper.width+'pt '+paper.height+'pt;margin:0}';
          frame.contentDocument.head.append(style);
        }
        frame.contentDocument.body.append(canvas);
        await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
      }
      if (!current()) return false;
      frame.dataset.adcPreviewState = 'ready';
      printButton.disabled = false;
      printButton.onclick = () => {
        if (!current() || !frame.contentWindow) {
          status.textContent = 'Volvé a generar el DL-01 antes de imprimir.';
          return;
        }
        try {
          frame.contentWindow.focus();
          frame.contentWindow.print();
          status.textContent = 'Impresión solicitada. Revisá el diálogo del navegador.';
        } catch (error) {
          status.textContent = 'No se pudo iniciar la impresión. Usá Abrir PDF en otra pestaña. '+error.message;
        }
      };
      status.textContent = 'Vista previa lista. Podés imprimir con el botón Imprimir DL-01.';
      return true;
    } catch (error) {
      if (current()) {
        frame.dataset.adcPreviewState = 'error';
        status.textContent = 'El PDF está generado, pero no se pudo mostrar la vista previa. Usá Abrir PDF en otra pestaña o descargalo. '+error.message;
      }
      return false;
    } finally {
      clearTimeout(loadTimer);
      if (pdf) await pdf.destroy();
    }
  };
  const root = document.getElementById('license');
  const schoolSelect = document.getElementById('escuelaSelect');
  const calendar = document.getElementById('adcSharedCalendar');
  const heading = root.querySelector('.adc-request-heading');
  const schoolLabel = schoolSelect.closest('label');
  const summary = document.createElement('div');
  summary.id = 'adcDL01ProfileSummary';
  summary.setAttribute('aria-live','polite');
  // Se ejecuta después del registro del editor para conservar sus identificadores históricos.
  heading.before(schoolLabel,summary);
  calendar.querySelector('summary').textContent = 'Calendario de la solicitud · elegir fechas';
  document.getElementById('adcRequestTitle').textContent = 'DL-01 · Licencias y permisos';
  window.adcDL01Open = function(reason) {
    if (!reason && (!adcRequestStarted || !adcDL01Ready.has(selected))) return false;
    if (reason && !adcDL01Ready.has(reason)) return false;
    if (reason) choose(reason);
    selectOnlySchool();
    tab('license');
    adcDocsStart(reason || selected);
    return true;
  };

  const generationStatus = document.createElement('p');
  generationStatus.id = 'adcDL01GenerationStatus';
  generationStatus.setAttribute('role','status');
  generationStatus.setAttribute('aria-live','polite');
  document.getElementById('pdfResult').before(generationStatus);
  const originalGenerate = generatePDF;
  let generating = false;
  generatePDF = async function(...args) {
    if (generating) return;
    generating = true;
    const button = document.getElementById('adcConfiguredDL01');
    button.disabled = true;
    button.setAttribute('aria-busy','true');
    generationStatus.textContent = 'Preparando la vista previa de DL-01…';
    const previousRequest = adcPDFRequest;
    try {
      await originalGenerate(...args);
      const preview = adcPDFRequest !== previousRequest && adcPDFRequest?.url
        ? document.querySelector('#pdfResult iframe[data-adc-preview-state="ready"]') : null;
      const generated = adcPDFRequest !== previousRequest && adcPDFRequest?.url;
      generationStatus.textContent = preview ? 'DL-01 listo. Verificá la plantilla y sus datos antes de descargar o imprimir.' : generated ? 'El PDF está generado. La vista previa no está disponible; podés abrirlo en otra pestaña o descargarlo.' : 'No se generó un PDF nuevo. Revisá los avisos o los datos pendientes e intentá nuevamente.';
      if (preview) {
        document.getElementById('pdfResult').tabIndex = -1;
        document.getElementById('pdfResult').focus({preventScroll:true});
        document.getElementById('pdfResult').scrollIntoView({block:'start'});
      }
    } catch (error) {
      console.error('Generación DL-01:',error);
      generationStatus.textContent = `No se pudo generar DL-01. ${error.message}`;
    } finally {
      generating = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  };

  function selectOnlySchool() {
    const schools = inst.filter(item => String(item.name || '').trim());
    if (!schoolSelect.value && schools.length === 1) schoolSelect.value = String(schools[0].id);
  }
  function showProfile() {
    const title = document.createElement('h3');
    title.textContent = 'Datos del Perfil Docente';
    const personal = document.createElement('p');
    const name = document.getElementById('nombre').value.trim();
    const dni = document.getElementById('dni').value.trim();
    personal.textContent = name || dni ? [name,dni ? `DNI: ${dni}` : 'DNI pendiente'].filter(Boolean).join(' · ') : 'No hay datos personales cargados en este navegador. Revisá Mi perfil docente o importá tu respaldo.';
    const institution = inst.find(item => String(item.id) === schoolSelect.value);
    const label = document.createElement('p');
    label.textContent = institution ? `Cursos y cargos de ${institution.name}:` : 'Elegí una institución para cargar sus cursos y cargos.';
    summary.replaceChildren(title,personal,label);
    if (!institution) return;
    const list = document.createElement('ul');
    const affectedEntries = new Set(affected().map(item => item.e));
    for (const entry of institution.entries || []) {
      const line = document.createElement('li');
      const description = entry.type === 'cargo' ? entry.cargoName || 'Cargo sin descripción' : [entry.subject || 'Asignatura sin nombre',window.adcAcademic.course(entry)].filter(Boolean).join(' · ');
      const hours = (entry.schedule || []).reduce((sum,value) => sum + (Number(value) || 0),0);
      const affectedLabel = affectedEntries.has(entry) ? 'Incluido en el período' : '';
      line.textContent = [description,entry.revista || 'Situación de revista pendiente',turnoNormalizado(entry.turno),entry.type === 'cargo' ? '' : `${hours} h semanales`,affectedLabel].filter(Boolean).join(' · ');
      list.append(line);
    }
    if (!list.childElementCount) label.textContent = 'Esta institución todavía no tiene cursos ni cargos registrados. Completalos en Mi perfil docente.';
    summary.append(list);
  }
  const previousReview = review;
  review = function(...args) {
    const result = previousReview(...args);
    showProfile();
    return result;
  };
  const previousChoose = choose;
  choose = function(...args) {
    selectOnlySchool();
    previousChoose(...args);
    calendar.open = true;
    showProfile();
  };
  const previousUpdateSelect = updateSelect;
  updateSelect = function(...args) {
    previousUpdateSelect(...args);
    selectOnlySchool();
    if (!root.classList.contains('hide')) review();
    else showProfile();
  };
  for (const event of ['input','change']) document.getElementById('profile').addEventListener(event, () => {
    if (!root.classList.contains('hide')) review();
  });
  selectOnlySchool();
  showProfile();
})();
