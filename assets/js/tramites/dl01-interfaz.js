// Conecta DL-01 con los datos existentes, sin copiar ni modificar el perfil.
(() => {
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
        ? document.querySelector('#pdfResult iframe[src]') : null;
      generationStatus.textContent = preview ? 'DL-01 listo. Verificá la plantilla y sus datos antes de descargar o imprimir.' : 'No se generó un PDF nuevo. Revisá los avisos o los datos pendientes e intentá nuevamente.';
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
