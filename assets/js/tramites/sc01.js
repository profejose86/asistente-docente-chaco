// Casilleros medidos sobre el PDF oficial de 612 x 1008 puntos.
(() => {
  const fields = [
    ['fecha','Fecha de emisión',145,166,110,12],
    ['apellido','Apellido del agente',40,194,530,12,'perfilApellidos'],
    ['nombres','Nombres del agente',40,222,530,12,'perfilNombres'],
    ['calle','Calle y domicilio',73,294,348,12,'perfilDomicilio'],
    ['numeroCalle','Número de calle',447,294,123,12,'perfilNumeroCalle'],
    ['unidad','Departamento, casa o unidad funcional',40,322,172,12,'perfilUnidad'],
    ['manzana','Manzana o torre',220,322,172,12,'perfilManzana'],
    ['barrio','Barrio',400,322,170,12,'perfilBarrio'],
    ['localidad','Localidad',40,350,226,12,'perfilLocalidad'],
    ['codigoPostal','Código postal',274,350,63,12,'perfilCodigoPostal'],
    ['departamento','Departamento provincial',345,350,225,12,'perfilDepartamento'],
    ['telefonoFijo','Teléfono fijo',82,364,220,12,'perfilTelefonoFijo'],
    ['telefonoCelular','Teléfono celular',375,364,195,12],
    ['correo','Correo electrónico del agente',132,378,438,12,'correo'],
    ['institucion','Nombre de la institución',164,416,406,12],
    ['direccionInstitucion','Dirección de la institución',95,430,475,12],
    ['telefonoInstitucion','Teléfono de la institución',95,444,171,12],
    ['correoInstitucion','Correo de la institución',365,444,205,12],
    ['motivo','Motivo de la solicitud',139,488,431,12]
  ].map(([key,label,x,y,width,height,profile]) => ({key,label,x,y,width,height,profile}));
  const choices = [
    {key:'sexo',label:'Sexo',options:[['M',54,272],['F',102,272]]},
    {key:'tipoDocumento',label:'Tipo de documento',options:[['DNI',139,272],['LC',173,272],['LE',206,272],['CUIL',241,272]]},
    {key:'licencia',label:'Está en uso de licencia',options:[['SI',232,502],['NO',286,502]]}
  ];
  const storageKey = 'adc-sc01-borrador-v1';
  const requiredFields = new Set(['fecha','apellido','nombres','calle','localidad','institucion','motivo']);
  const notApplicableFields = fields.filter(field => !requiredFields.has(field.key) || field.key === 'calle');
  const notApplicableFieldKeys = new Set(notApplicableFields.map(field => field.key));
  const optionalStrike = adcMnc.geometry;
  const markedFields = new Set();
  const notApplicableButtons = new Map();
  const notApplicableLines = new Map();
  const extraProfile = document.createElement('fieldset');
  extraProfile.className = 'adc-profile-address';
  extraProfile.innerHTML = '<legend>Datos de domicilio para formularios</legend><div class="fields"></div>';
  let savedProfile = {};
  try { savedProfile = JSON.parse(localStorage.getItem('adc_v08') || '{}').perfilDJ || {}; } catch {}
  for (const field of fields.filter(field => ['numeroCalle','unidad','manzana','barrio','codigoPostal','departamento','telefonoFijo'].includes(field.key))) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.id = field.profile;
    input.value = String(savedProfile[field.key] || '');
    label.append(field.label,input);
    extraProfile.querySelector('.fields').append(label);
  }
  document.querySelector('#profile > section .fields').after(extraProfile);
  const section = document.createElement('section');
  section.id = 'adcSC01';
  section.className = 'hide';
  section.innerHTML = `
    <button type="button" class="alt" onclick="adcBackToTramites()">← Volver a Mis trámites</button>
    <h2 tabindex="-1">Solicitud de certificación de servicios docentes · SC-01</h2>
    <p>Los datos personales se toman de Mi Perfil Docente. Completá los datos del trámite; los campos obligatorios se validan antes de previsualizar, descargar o imprimir, salvo los que marques con MNC cuando el formulario lo permita.</p>
    <div class="toolbar adc-sc01-actions">
      <button type="button" data-adc-sc01-action="preview">Ver Vista Preliminar</button>
      <button type="button" data-adc-sc01-action="download">Descargar PDF Completado</button>
      <button type="button" data-adc-sc01-action="print">Imprimir</button>
    </div>
    <p class="small">El borrador se guarda en este navegador. El Rubro II y las firmas corresponden a sus responsables. En pantallas pequeñas podés desplazar el formulario horizontalmente. En los campos opcionales y en “Calle” cuando esté vacía, pulsá X para indicar que no corresponde; volvé a pulsarla para quitar la línea y editar.</p>
    <p id="adcSC01Status" role="status" aria-live="polite"></p>
    <div id="adcSC01ContactNotice" class="adc-sc01-contact-notice" aria-live="polite" hidden></div>
    <div class="adc-sc01-scroll" role="region" aria-label="Formulario SC-01 editable" tabindex="0">
      <form id="adcSC01Sheet" aria-label="Datos del agente y del establecimiento" autocomplete="off">
        <img src="assets/formularios/SC-01-plantilla.png" alt="Plantilla oficial de solicitud de certificación de servicios docentes">
      </form>
    </div>
    <div class="toolbar adc-sc01-actions" aria-label="Acciones del formulario">
      <button type="button" data-adc-sc01-action="preview">Ver Vista Preliminar</button>
      <button type="button" data-adc-sc01-action="download">Descargar PDF Completado</button>
      <button type="button" data-adc-sc01-action="print">Imprimir</button>
    </div>
    <div id="adcSC01Preview" class="adc-sc01-preview" role="region" aria-label="Vista preliminar del formulario" hidden></div>
    <a href="https://dirdocumentacion.educacion.chaco.gob.ar/formularios-planillas/" target="_blank" rel="noopener">Fuente oficial del formulario</a>`;
  const footer = document.querySelector('.wrap > footer');
  if (footer) footer.before(section);
  else document.querySelector('.wrap').append(section);
  const verificationBubble = document.createElement('div');
  verificationBubble.id = 'adcSC01VerifyBubble';
  verificationBubble.className = 'adc-sc01-verify-bubble';
  verificationBubble.setAttribute('role','status');
  verificationBubble.setAttribute('aria-live','polite');
  verificationBubble.setAttribute('aria-atomic','true');
  verificationBubble.textContent = 'Verificá que estos datos estén correctos antes de imprimir o presentar.';
  verificationBubble.hidden = true;
  document.body.append(verificationBubble);
  const sheet = section.querySelector('form');
  const status = section.querySelector('#adcSC01Status');
  let initialized = false;
  let pdfBytes;
  let previewUrl;
  let dateOrigin = 'auto';
  let lastAutoDate = '';
  let contactOrigin = {};
  function position(node, box) {
    node.style.left = `${box.x / 612 * 100}%`;
    node.style.top = `${box.y / 1008 * 100}%`;
    node.style.width = `${box.width / 612 * 100}%`;
    node.style.height = `${box.height / 1008 * 100}%`;
  }
  for (const field of fields) {
    const input = document.createElement('input');
    input.name = field.key;
    input.required = requiredFields.has(field.key);
    input.setAttribute('aria-label', field.label);
    input.title = field.label;
    input.maxLength = field.key === 'fecha' ? 10 : 120;
    if (field.key === 'fecha') input.placeholder = 'dd/mm/aaaa';
    input.className = 'adc-sc01-field';
    position(input, field);
    sheet.append(input);
  }
  for (const field of notApplicableFields) {
    const input = sheet.elements[field.key];
    const button = document.createElement('button');
    const tooltip = document.createElement('span');
    const line = document.createElement('span');
    button.type = 'button';
    button.className = 'adc-sc01-not-applicable';
    button.setAttribute('aria-label',`Tachar ${field.label.toLowerCase()} si no corresponde`);
    button.setAttribute('aria-pressed','false');
    tooltip.className = 'adc-sc01-not-applicable-tooltip';
    tooltip.id = `adcSC01NotApplicable${field.key}`;
    tooltip.setAttribute('role','tooltip');
    tooltip.textContent = 'Tachar si no corresponde';
    tooltip.hidden = true;
    button.setAttribute('aria-describedby',tooltip.id);
    button.append(document.createTextNode('X'),tooltip);
    line.className = 'adc-sc01-not-applicable-line';
    line.hidden = true;
    position(input,{...field,x:field.x+14,width:field.width-14});
    position(button,{...field,width:14});
    position(line,{
      x:field.x+field.width*optionalStrike.start,
      y:field.y+(field.height-optionalStrike.thickness)/2,
      width:field.width*(optionalStrike.end-optionalStrike.start),
      height:optionalStrike.thickness
    });
    line.style.top = `${(field.y+field.height/2)/1008*100}%`;
    line.style.height = '0.5mm';
    line.style.transform = 'translateY(-50%)';
    sheet.append(button,line);
    notApplicableButtons.set(field.key,button);
    notApplicableLines.set(field.key,line);
    adcMnc.help(button,tooltip);
    button.addEventListener('click',() => {
      const marked = !markedFields.has(field.key);
      if (!setNotApplicable(field.key,marked)) return;
      status.textContent = '';
      if (!marked) input.focus();
    });
  }
  const updateFormGeography=window.adcVincularGeografiaChaco(sheet.elements.localidad,sheet.elements.codigoPostal,sheet.elements.departamento);
  const dateField = sheet.elements.fecha;
  dateField.type = 'date';
  dateField.removeAttribute('maxlength');
  dateField.addEventListener('input',() => { dateOrigin = 'manual'; });
  const surnameNote = document.createElement('div');
  surnameNote.className = 'adc-sc01-surname-mask';
  surnameNote.hidden = true;
  position(surnameNote,{x:136,y:180,width:435,height:13});
  sheet.append(surnameNote);
  const contactBadges = {};
  for (const field of fields.filter(field => ['direccionInstitucion','telefonoInstitucion','correoInstitucion'].includes(field.key))) {
    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'adc-sc01-verify';
    badge.textContent = '⚠ Verificá antes de presentar';
    badge.hidden = true;
    badge.setAttribute('aria-label',`Verificar ${field.label.toLowerCase()} en el padrón oficial`);
    badge.setAttribute('aria-controls',verificationBubble.id);
    badge.setAttribute('aria-expanded','false');
    position(badge,{x:field.x+field.width-105,y:field.y,width:105,height:field.height});
    sheet.append(badge);
    contactBadges[field.key] = badge;
  }
  let activeVerifyButton;
  function closeVerificationBubble() {
    verificationBubble.hidden = true;
    for (const badge of Object.values(contactBadges)) badge.setAttribute('aria-expanded','false');
    activeVerifyButton = null;
  }
  section.addEventListener('click',event => {
    const badge = event.target.closest('.adc-sc01-verify');
    if (!badge) return;
    if (activeVerifyButton === badge && !verificationBubble.hidden) {
      closeVerificationBubble();
      return;
    }
    closeVerificationBubble();
    activeVerifyButton = badge;
    badge.setAttribute('aria-expanded','true');
    verificationBubble.hidden = false;
    const anchor = badge.getBoundingClientRect();
    const left = Math.max(8,Math.min(anchor.left,window.innerWidth-verificationBubble.offsetWidth-8));
    const above = anchor.top-verificationBubble.offsetHeight-8;
    const top = above >= 8 ? above : anchor.bottom+8;
    verificationBubble.style.left = `${left}px`;
    verificationBubble.style.top = `${Math.max(8,Math.min(top,window.innerHeight-verificationBubble.offsetHeight-8))}px`;
  });
  document.addEventListener('click',event => {
    if (activeVerifyButton && !event.target.closest('.adc-sc01-verify')) closeVerificationBubble();
  });
  document.addEventListener('keydown',event => {
    if (event.key !== 'Escape' || !activeVerifyButton) return;
    const button = activeVerifyButton;
    closeVerificationBubble();
    button.focus();
  });
  window.addEventListener('resize',closeVerificationBubble);
  window.addEventListener('scroll',closeVerificationBubble,true);
  for (const choice of choices) {
    for (const [value,x,y] of choice.options) {
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = choice.key;
      input.value = value;
      input.required = true;
      input.className = 'adc-sc01-choice';
      input.setAttribute('aria-label', `${choice.label}: ${value}`);
      input.title = `${choice.label}: ${value}`;
      position(input, {x,y,width:9,height:10});
      sheet.append(input);
    }
  }
  const digits = [];
  for (let index = 0; index < 11; index++) {
    const input = document.createElement('input');
    input.className = 'adc-sc01-field adc-sc01-digit';
    input.name = `documento${index}`;
    input.inputMode = 'numeric';
    input.maxLength = 1;
    input.setAttribute('aria-label', `Documento o CUIL, dígito ${index+1}`);
    position(input, {x:264+index*28.4,y:266,width:26,height:16});
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g,'');
      if (input.value) digits[index+1]?.focus();
    });
    input.addEventListener('paste', event => {
      const number = event.clipboardData.getData('text').replace(/\D/g,'');
      if (!number) return;
      event.preventDefault();
      for (let offset = 0; offset < number.length && index + offset < digits.length; offset++) digits[index + offset].value = number[offset];
      digits[Math.min(index + number.length,digits.length - 1)].focus();
      save();
    });
    digits.push(input);
    sheet.append(input);
  }
  const institutionField = fields.find(field => field.key === 'institucion');
  const institutionInput = sheet.elements.institucion;
  const schoolToggle = document.createElement('button');
  schoolToggle.type = 'button';
  schoolToggle.className = 'adc-sc01-school-toggle';
  schoolToggle.textContent = '▾';
  schoolToggle.setAttribute('aria-label','Mostrar instituciones sugeridas');
  schoolToggle.setAttribute('aria-haspopup','listbox');
  schoolToggle.setAttribute('aria-expanded','false');
  schoolToggle.title = 'Elegir una institución del perfil o del padrón';
  position(schoolToggle,{x:institutionField.x+institutionField.width-22,y:institutionField.y,width:22,height:institutionField.height});
  position(institutionInput,{...institutionField,width:institutionField.width-24});
  const schoolSuggestions = document.createElement('div');
  schoolSuggestions.className = 'adc-sc01-school-suggestions';
  schoolSuggestions.id = 'adcSC01SchoolSuggestions';
  schoolSuggestions.setAttribute('role','listbox');
  schoolSuggestions.setAttribute('aria-label','Instituciones sugeridas');
  schoolSuggestions.hidden = true;
  position(schoolSuggestions,{x:institutionField.x,y:institutionField.y+institutionField.height,width:institutionField.width,height:14});
  institutionInput.setAttribute('aria-autocomplete','list');
  institutionInput.setAttribute('aria-controls',schoolSuggestions.id);
  institutionInput.setAttribute('aria-expanded','false');
  institutionInput.placeholder = 'Escribí o elegí una institución';
  sheet.append(schoolToggle,schoolSuggestions);
  let activeSchoolSuggestion = -1;
  let selectedProfileSchoolId = null;
  let selectedDirectoryRecord = null;
  const normalizeInstitutionName = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const sameName = (left,right) => normalizeInstitutionName(left) === normalizeInstitutionName(right);
  const directoryInstitutions = (window.adcEscuelasChaco?.registros || []).map(record => ({
    record,
    name:String(record.nombre || '').trim(),
    localidad:String(record.localidad || ''),
    normalizedName:normalizeInstitutionName(record.nombre)
  }));
  function matchesNormalizedInstitution(normalizedName,query) {
    const words = normalizedName.split(' ');
    return normalizedName.includes(query) || query.split(' ').every(token => words.some(word => word.startsWith(token)));
  }
  const matchesInstitution = (name,query) => matchesNormalizedInstitution(normalizeInstitutionName(name),query);
  function institutionSuggestions(query) {
    const profileSchools = inst.filter(school => String(school.name || '').trim());
    if (!query) return profileSchools.slice(0,8).map(school => ({type:'profile',name:school.name,school}));
    const profileMatches = profileSchools
      .filter(school => matchesInstitution(school.name,query))
      .map(school => ({type:'profile',name:school.name,school}));
    const profileNames = new Set(profileMatches.map(suggestion => normalizeInstitutionName(suggestion.name)));
    const directoryMatches = [];
    const seen = new Set();
    if (query.length >= 2) {
      for (const institution of directoryInstitutions) {
        const {record,name,localidad,normalizedName} = institution;
        if (!name || !matchesNormalizedInstitution(normalizedName,query)) continue;
        const key = `${normalizedName}|${normalizeInstitutionName(localidad)}`;
        if (profileNames.has(normalizedName) || seen.has(key)) continue;
        seen.add(key);
        directoryMatches.push({type:'directory',name,localidad,record});
        if (directoryMatches.length >= 8) break;
      }
    }
    return [...profileMatches,...directoryMatches].slice(0,8);
  }
  function closeSchoolSuggestions() {
    schoolSuggestions.hidden = true;
    activeSchoolSuggestion = -1;
    institutionInput.setAttribute('aria-expanded','false');
    schoolToggle.setAttribute('aria-expanded','false');
    institutionInput.removeAttribute('aria-activedescendant');
  }
  function selectSchoolSuggestion(suggestion) {
    selectedProfileSchoolId = suggestion.type === 'profile' ? String(suggestion.school.id) : null;
    selectedDirectoryRecord = suggestion.type === 'directory' ? suggestion.record : null;
    institutionInput.value = suggestion.name;
    institutionInput.setCustomValidity('');
    loadInstitution();
    closeSchoolSuggestions();
  }
  function renderSchoolSuggestions(showAll = false) {
    const query = normalizeInstitutionName(institutionInput.value);
    const suggestions = institutionSuggestions(showAll ? '' : query);
    schoolSuggestions.replaceChildren();
    activeSchoolSuggestion = -1;
    institutionInput.removeAttribute('aria-activedescendant');
    suggestions.forEach((suggestion,index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.id = `adcSC01SchoolOption${index}`;
      option.className = 'adc-sc01-school-option';
      option.setAttribute('role','option');
      option.setAttribute('aria-selected','false');
      option.textContent = suggestion.type === 'directory' && suggestion.localidad
        ? `${suggestion.name} · ${suggestion.localidad}`
        : suggestion.name;
      option.addEventListener('mousedown',event => event.preventDefault());
      option.addEventListener('click',() => selectSchoolSuggestion(suggestion));
      schoolSuggestions.append(option);
    });
    if (!suggestions.length) {
      closeSchoolSuggestions();
      return;
    }
    position(schoolSuggestions,{x:institutionField.x,y:institutionField.y+institutionField.height,width:institutionField.width,height:Math.min(suggestions.length,8)*14});
    schoolSuggestions.hidden = false;
    institutionInput.setAttribute('aria-expanded','true');
    schoolToggle.setAttribute('aria-expanded','true');
  }
  schoolToggle.addEventListener('mousedown',event => event.preventDefault());
  schoolToggle.addEventListener('click',() => {
    if (schoolSuggestions.hidden) renderSchoolSuggestions(true);
    else closeSchoolSuggestions();
  });
  institutionInput.addEventListener('focus',() => renderSchoolSuggestions());
  institutionInput.addEventListener('blur',() => window.setTimeout(closeSchoolSuggestions,0));
  institutionInput.addEventListener('keydown',event => {
    const options = schoolSuggestions.querySelectorAll('.adc-sc01-school-option');
    if (event.key === 'Escape' && !schoolSuggestions.hidden) {
      event.preventDefault();
      closeSchoolSuggestions();
      return;
    }
    if (event.key === 'Enter' && !schoolSuggestions.hidden && activeSchoolSuggestion >= 0) {
      event.preventDefault();
      options[activeSchoolSuggestion]?.click();
      return;
    }
    if (!['ArrowDown','ArrowUp'].includes(event.key)) return;
    if (schoolSuggestions.hidden) renderSchoolSuggestions();
    const updatedOptions = schoolSuggestions.querySelectorAll('.adc-sc01-school-option');
    if (!updatedOptions.length) return;
    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    activeSchoolSuggestion = activeSchoolSuggestion < 0
      ? (event.key === 'ArrowDown' ? 0 : updatedOptions.length - 1)
      : (activeSchoolSuggestion + direction + updatedOptions.length) % updatedOptions.length;
    updatedOptions.forEach((option,index) => {
      const active = index === activeSchoolSuggestion;
      option.setAttribute('aria-selected',String(active));
      if (active) {
        institutionInput.setAttribute('aria-activedescendant',option.id);
        option.scrollIntoView({block:'nearest'});
      }
    });
  });
  section.addEventListener('click',event => {
    if (!event.target.closest('.adc-sc01-school-toggle,.adc-sc01-school-suggestions')) closeSchoolSuggestions();
  });
  function updateInstitutions() {
    const schools = inst.filter(school => school.name.trim());
    institutionInput.readOnly = false;
    institutionInput.placeholder = schools.length ? 'Escribí o elegí una institución' : 'Escribí el nombre de la institución';
    const current = schools.find(school => sameName(school.name,institutionInput.value));
    if (!institutionInput.value.trim() && schools.length) {
      selectedProfileSchoolId = String(schools[0].id);
      institutionInput.value = schools[0].name;
      loadInstitution();
    } else if (current && !sheet.elements.direccionInstitucion.value && !sheet.elements.telefonoInstitucion.value && !sheet.elements.correoInstitucion.value) {
      selectedProfileSchoolId = String(current.id);
      loadInstitution();
    }
  }
  function updateSurnameNote() {
    surnameNote.hidden = sheet.querySelector('input[name="sexo"]:checked')?.value !== 'M';
  }
  function showContactOrigin() {
    const notice = section.querySelector('#adcSC01ContactNotice');
    notice.replaceChildren();
    for (const [key,badge] of Object.entries(contactBadges)) {
      const field = fields.find(field => field.key === key);
      badge.hidden = !contactOrigin[key];
      position(sheet.elements[key],{...field,x:field.x+14,width:field.width-14-(contactOrigin[key]?105:0)});
    }
    for (const [key,label] of [['direccionInstitucion','Dirección'],['telefonoInstitucion','Teléfono'],['correoInstitucion','Correo electrónico']]) {
      if (!contactOrigin[key]) continue;
      const line = document.createElement('p');
      const source = document.createElement('a');
      source.href = contactOrigin[key];
      source.target = '_blank';source.rel = 'noopener';
      source.textContent = 'Consultar padrón oficial';
      line.append('Contactos obtenidos del padrón oficial. Verificá antes de presentar. ',source);
      if (!notice.childElementCount) notice.append(line);
      const input = sheet.elements[key];
      input.title = `${label} · ⚠ Verificar con la institución`;
      input.classList.add('adc-sc01-unverified');
    }
    notice.hidden = !notice.childElementCount;
  }
  function loadInstitution() {
    const name = institutionInput.value.trim();
    const school = inst.find(school => String(school.id) === selectedProfileSchoolId && sameName(school.name,name)) || inst.find(school => school.name && sameName(school.name,name));
    const directoryRecord = !school && selectedDirectoryRecord && sameName(selectedDirectoryRecord.nombre,name) ? selectedDirectoryRecord : null;
    if (school) selectedProfileSchoolId = String(school.id);
    for (const [key,profileKey] of [['direccionInstitucion','direccion'],['telefonoInstitucion','telefono'],['correoInstitucion','correo']]) {
      const input = sheet.elements[key];
      const value = school?.[profileKey] || directoryRecord?.[profileKey] || '';
      if (markedFields.has(key)) continue;
      input.value = value;
      updateNotApplicableControl(key);
      input.classList.remove('adc-sc01-unverified');
      delete contactOrigin[key];
      if (school?.contactoFuente && input.value && (school.contactoVerificar || '').split(',').includes(profileKey)) contactOrigin[key] = school.contactoFuente;
      if (directoryRecord?.[profileKey]) contactOrigin[key] = window.adcEscuelasChaco?.fuente || '';
    }
    showContactOrigin();
    save();
  }
  institutionInput.addEventListener('input',() => {
    selectedProfileSchoolId = null;
    selectedDirectoryRecord = null;
    institutionInput.setCustomValidity('');
    loadInstitution();
    renderSchoolSuggestions();
  });
  document.addEventListener('adc-school-contact-updated',() => {
    if (initialized) loadInstitution();
  });
  function setNotApplicable(key,marked,persist=true) {
    const input = sheet.elements[key];
    const button = notApplicableButtons.get(key);
    const line = notApplicableLines.get(key);
    if (!input || !button || !line) return false;
    if (!adcMnc.apply(input,marked,{allowRequired:key==='calle'})) return false;
    if (marked && input.value.trim()) {
      status.textContent = 'Solo se puede tachar un campo vacío.';
      return false;
    }
    if (marked) markedFields.add(key);
    else markedFields.delete(key);
    input.required = requiredFields.has(key) && !marked;
    if (key === 'calle' && marked) input.setCustomValidity('');
    input.readOnly = marked;
    line.hidden = !marked;
    button.hidden = !marked && Boolean(input.value.trim());
    button.setAttribute('aria-pressed',String(marked));
    const label = fields.find(field => field.key === key).label.toLowerCase();
    button.setAttribute('aria-label',marked
      ? `Quitar el tachado de ${label} y volver a editar`
      : `Tachar ${label} si no corresponde`);
    button.classList.toggle('is-marked',marked);
    if (persist) save();
    return true;
  }
  function updateNotApplicableControl(key) {
    const input = sheet.elements[key];
    const button = notApplicableButtons.get(key);
    if (input && button) button.hidden = !markedFields.has(key) && Boolean(input.value.trim());
  }
  function read() {
    return {...Object.fromEntries(new FormData(sheet)),_notApplicable:[...markedFields],_dateOrigin:dateOrigin,_autoDate:lastAutoDate,_contactOrigin:contactOrigin};
  }
  function write(values) {
    values = {...values};
    for (const key of values._notApplicable || []) if(notApplicableFieldKeys.has(key))values[key]='';
    for (const key of [...markedFields]) setNotApplicable(key,false,false);
    for (const input of sheet.elements) {
      if (input.type === 'radio') input.checked = values[input.name] === input.value;
      else if (input.name) input.value = String(values[input.name] || '').slice(0,input.maxLength > 0 ? input.maxLength : 120);
    }
    if (Array.isArray(values._notApplicable)) {
      for (const key of values._notApplicable) {
        if (notApplicableFieldKeys.has(key)) setNotApplicable(key,true,false);
      }
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(values.fecha || '')) dateField.value = values.fecha.split('/').reverse().join('-');
    dateOrigin = values._dateOrigin || 'auto';
    lastAutoDate = values._autoDate || '';
    contactOrigin = values._contactOrigin && typeof values._contactOrigin === 'object' ? values._contactOrigin : {};
    for (const key of Object.keys(contactOrigin)) {
      if (contactOrigin[key] !== window.adcEscuelasChaco?.fuente) delete contactOrigin[key];
    }
    updateFormGeography();
    for (const field of notApplicableFields) updateNotApplicableControl(field.key);
    updateSurnameNote();
    showContactOrigin();
  }
  function save() {
    try { localStorage.setItem(storageKey,JSON.stringify(read())); }
    catch { status.textContent = 'No se pudo guardar el borrador. Descargá el PDF para conservarlo.'; }
  }
  function splitAddress(values) {
    if (markedFields.has('calle') || markedFields.has('numeroCalle')) return;
    if (values.numeroCalle) return;
    const address = String(values.calle || '').match(/^(.+?)\s+(?:N[°º.]?\s*)?(\d+[a-zA-Z]?)$/i);
    if (address && !/^(ruta|km|kilometro)\b/i.test(address[1])) {values.calle = address[1];values.numeroCalle = address[2];}
  }
  function fromProfile() {
    const values = read();
    for (const field of fields.filter(field => field.profile && !markedFields.has(field.key))) values[field.key] = document.getElementById(field.profile)?.value || '';
    values.sexo = document.getElementById('sexo')?.value || '';
    values.tipoDocumento = 'DNI';
    splitAddress(values);
    const number = (document.getElementById('dni')?.value || '').replace(/\D/g,'');
    digits.forEach((digit,index) => {values[digit.name] = number[index] || '';});
    write(values);
    save();
  }
  const profileInputIds = new Set([...fields.map(field => field.profile).filter(Boolean),'dni','sexo']);
  function syncFromProfileEvent(event){
    if (initialized && profileInputIds.has(event.target.id)) fromProfile();
  }
  document.addEventListener('input',syncFromProfileEvent);
  document.addEventListener('change',syncFromProfileEvent);
  window.addEventListener('DOMContentLoaded',() => {
    if (initialized) fromProfile();
  });
  sheet.addEventListener('submit',event => event.preventDefault());
  sheet.addEventListener('input',event => {
    updateSurnameNote();
    if (event.target.name === 'localidad') {
      updateNotApplicableControl('codigoPostal');
      updateNotApplicableControl('departamento');
    } else if (notApplicableFieldKeys.has(event.target.name)) updateNotApplicableControl(event.target.name);
    if (contactOrigin[event.target.name]) {
      delete contactOrigin[event.target.name];
      event.target.classList.remove('adc-sc01-unverified');
      showContactOrigin();
    }
    save();
  });
  function scPending() {
    const pending=[...requiredFields].filter(key=>!sheet.elements[key].value.trim()&&!markedFields.has(key)).map(key=>({key,label:fields.find(field=>field.key===key).label,controls:[sheet.elements[key]]}));
    for(const choice of choices)if(!sheet.querySelector(`input[name="${choice.key}"]:checked`))pending.push({key:choice.key,label:choice.label,controls:[...sheet.querySelectorAll(`input[name="${choice.key}"]`)]});
    const number=digits.map(input=>input.value).join('');
    const length=sheet.querySelector('input[name="tipoDocumento"]:checked')?.value==='CUIL'?11:7;
    if(number.length<length)pending.push({key:'documento',label:'Número de documento',controls:digits.filter(input=>!input.value&&!input.disabled)});
    return pending;
  }
  const guidedReview=adcGuidedValidation.create({root:section,collect:scPending,save});
  function validateForm(allowMissing=false){
    for (const key of requiredFields) {
      const input = sheet.elements[key];
      input.setCustomValidity(input.value.trim() || markedFields.has(key) ? '' : 'Completá este dato obligatorio.');
    }
    const number = digits.map(digit => digit.value).join('');
    const type = sheet.querySelector('input[name="tipoDocumento"]:checked')?.value;
    const validNumber = type === 'CUIL' ? /^\d{11}$/.test(number) : /^\d{7,8}$/.test(number);
    digits[0].setCustomValidity(validNumber ? '' : type === 'CUIL' ? 'Ingresá los 11 dígitos del CUIL.' : 'Ingresá los 7 u 8 dígitos del documento.');
    const pendingControls=new Set(allowMissing?scPending().flatMap(item=>item.controls):[]);
    if(allowMissing && scPending().some(item=>item.key==='documento'))pendingControls.add(digits[0]);
    const invalid=[...sheet.elements].find(input=>!input.disabled&&!pendingControls.has(input)&&!input.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      status.textContent = 'Completá los datos obligatorios indicados antes de continuar.';
      return false;
    }
    return true;
  }
  async function createCompletedPdf(){
    if (!window.PDFLib) throw Error('Revisá tu conexión y actualizá la página para cargar la biblioteca PDF.');
    if (!pdfBytes) {
      const response = await fetch('assets/formularios/SC-01.pdf');
      if (!response.ok) throw Error('No se pudo cargar la plantilla oficial.');
      pdfBytes = await response.arrayBuffer();
    }
    const backgroundBytes=window.adcDocumentBackground?await adcDocumentBackground.pdfTemplate(sheet,pdfBytes,PDFLib):pdfBytes;
    const pdf = await PDFLib.PDFDocument.load(backgroundBytes.slice(0));
    const page = pdf.getPages()[0];
    const form = pdf.getForm();
    const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    const values = read();
    if (values.sexo === 'M') page.drawRectangle({x:136,y:815,width:435,height:13,color:PDFLib.rgb(1,1,1)});
    for (const field of fields) {
      const textField = form.createTextField(`SC01.${field.key}`);
      const rawValue = field.key === 'fecha' ? (values.fecha || '').split('-').reverse().join('/') : values[field.key] || '';
      const value = field.key === 'telefonoFijo' && String(rawValue).trim() === '------' ? '' : rawValue;
      textField.setText(value);
      textField.addToPage(page,{x:field.x,y:1008-field.y-field.height,width:field.width,height:field.height,borderWidth:0,borderColor:undefined,backgroundColor:field.key === 'fecha' ? PDFLib.rgb(1,1,1) : undefined,font});
      textField.setFontSize(Math.min(9,(field.width-4)/Math.max(1,font.widthOfTextAtSize(value || ' ',1))));
    }
    digits.forEach((digit,index) => {
      const textField = form.createTextField(`SC01.documento.${index+1}`);
      textField.setMaxLength(1);
      textField.setText(digit.value);
      textField.addToPage(page,{x:264+index*28.4,y:726,width:26,height:16,borderWidth:0,borderColor:undefined,backgroundColor:undefined,font});
      textField.setAlignment(PDFLib.TextAlignment.Center);
      textField.setFontSize(11);
    });
    for (const choice of choices) {
      for (const [value,x,y] of choice.options) {
        const checkbox = form.createCheckBox(`SC01.${choice.key}.${value}`);
        checkbox.addToPage(page,{x,y:1008-y-10,width:9,height:10,borderWidth:0,borderColor:undefined,backgroundColor:undefined});
        if (values[choice.key] === value) checkbox.check();
      }
    }
    form.updateFieldAppearances(font);
    form.flatten();
    for (const field of fields) {
      if (markedFields.has(field.key)) adcPdfDrawBlankLine(page,field,optionalStrike);
    }
    return pdf.save();
  }
  function showPreview(bytes){
    const preview = section.querySelector('#adcSC01Preview');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const frame = document.createElement('iframe');
    frame.title = 'Vista preliminar del formulario SC-01 completado';
    frame.src = previewUrl;
    preview.replaceChildren(frame);
    preview.hidden = false;
    preview.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function downloadPdf(bytes){
    const url = URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SC-01-completado.pdf';
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url),60000);
  }
  function printPdf(bytes){
    const url = URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const frame = document.createElement('iframe');
    let loaded = false;
    const cleanup = () => {URL.revokeObjectURL(url);frame.remove();};
    const loadTimeout = setTimeout(() => {
      if (loaded) return;
      status.textContent = 'No se pudo abrir el PDF para imprimir.';
      cleanup();
    },15000);
    frame.className = 'adc-sc01-print-frame';
    frame.title = 'Documento SC-01 preparado para imprimir';
    frame.addEventListener('load',() => {
      loaded = true;
      clearTimeout(loadTimeout);
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        status.textContent = 'Se abrió el diálogo de impresión.';
      } catch (error) {
        status.textContent = `No se pudo imprimir el formulario. ${error.message}`;
        cleanup();
      }
    },{once:true});
    frame.addEventListener('error',() => {
      clearTimeout(loadTimeout);
      status.textContent = 'No se pudo abrir el PDF para imprimir.';
      cleanup();
    },{once:true});
    frame.src = url;
    document.body.append(frame);
    setTimeout(cleanup,60000);
  }
  async function runPdfAction(action){
    if (!validateForm(true) || !await guidedReview.review({action}) || !validateForm(true)) return;
    const buttons = [...section.querySelectorAll('[data-adc-sc01-action]')];
    buttons.forEach(button => {button.disabled = true;});
    status.textContent = 'Preparando el PDF…';
    try {
      const bytes = await createCompletedPdf();
      if (action === 'preview') {
        showPreview(bytes);
        status.textContent = 'Vista preliminar lista.';
      } else if (action === 'download') {
        downloadPdf(bytes);
        status.textContent = 'PDF descargado y bloqueado para editar sus campos.';
      } else if (action === 'print') {
        printPdf(bytes);
        status.textContent = 'Preparando el formulario para imprimir…';
      }
    } catch (error) {
      status.textContent = `No se pudo generar el PDF. ${error.message}`;
    } finally {
      buttons.forEach(button => {button.disabled = false;});
    }
  }
  section.querySelectorAll('[data-adc-sc01-action]').forEach(button => {
    button.addEventListener('click',() => runPdfAction(button.dataset.adcSc01Action));
  });
  window.adcSC01Open = () => {
    if (!initialized) {
      const now = new Date();
      sheet.elements.fecha.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      let draft;
      try { draft = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch {}
      if (draft && typeof draft === 'object' && !Array.isArray(draft)) write(draft);
      initialized = true;
    }
    fromProfile();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    if (dateOrigin === 'auto') {dateField.value = today;lastAutoDate = today;}
    const values = read();
    splitAddress(values);
    write(values);
    if(sheet.elements.telefonoFijo.value.trim()==='------')sheet.elements.telefonoFijo.value='';
    updateInstitutions();
    save();
    tab('sc01');
    section.querySelector('h2').focus();
  };
})();
