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
    <p>Completá los casilleros resaltados. Los campos obligatorios se validan al descargar el PDF.</p>
    <div class="toolbar">
      <button type="button" id="adcSC01Profile" class="alt">Cargar datos del perfil</button>
      <button type="button" id="adcSC01Download">Descargar PDF completado</button>
      <a class="adc-sc01-action" href="assets/formularios/SC-01.pdf" target="_blank" rel="noopener">Ver original</a>
    </div>
    <p class="small">El borrador se guarda en este navegador. El Rubro II y las firmas corresponden a sus responsables. En pantallas pequeñas podés desplazar el formulario horizontalmente.</p>
    <p id="adcSC01Status" role="status" aria-live="polite"></p>
    <div id="adcSC01ContactNotice" class="adc-sc01-contact-notice" aria-live="polite" hidden></div>
    <div class="adc-sc01-scroll" role="region" aria-label="Formulario SC-01 editable" tabindex="0">
      <form id="adcSC01Sheet" aria-label="Datos del agente y del establecimiento" autocomplete="off">
        <img src="assets/formularios/SC-01-plantilla.png" alt="Plantilla oficial de solicitud de certificación de servicios docentes">
      </form>
    </div>
    <a href="https://dirdocumentacion.educacion.chaco.gob.ar/formularios-planillas/" target="_blank" rel="noopener">Fuente oficial del formulario</a>`;
  const footer = document.querySelector('.wrap > footer');
  if (footer) footer.before(section);
  else document.querySelector('.wrap').append(section);
  const sheet = section.querySelector('form');
  const status = section.querySelector('#adcSC01Status');
  let initialized = false;
  let pdfBytes;
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
    const badge = document.createElement('a');
    badge.className = 'adc-sc01-verify';
    badge.textContent = '⚠ Verificar';
    badge.target = '_blank';badge.rel = 'noopener';badge.hidden = true;
    badge.setAttribute('aria-label',`Verificar ${field.label.toLowerCase()} en el padrón oficial`);
    position(badge,{x:field.x+field.width-55,y:field.y,width:55,height:field.height});
    sheet.append(badge);
    contactBadges[field.key] = badge;
  }
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
  const institutions = document.createElement('datalist');
  institutions.id = 'adcSC01Institutions';
  sheet.elements.institucion.setAttribute('list',institutions.id);
  sheet.append(institutions);
  function updateInstitutions() {
    institutions.replaceChildren();
    for (const school of inst.filter(school => school.name.trim())) institutions.append(new Option(school.name,school.name));
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
      if (contactOrigin[key]) badge.href = contactOrigin[key];
      position(sheet.elements[key],{...field,width:field.width-(contactOrigin[key]?55:0)});
    }
    for (const [key,label] of [['direccionInstitucion','Dirección'],['telefonoInstitucion','Teléfono'],['correoInstitucion','Correo electrónico']]) {
      if (!contactOrigin[key]) continue;
      const line = document.createElement('p');
      const source = document.createElement('a');
      source.href = contactOrigin[key];
      source.target = '_blank';source.rel = 'noopener';
      source.textContent = 'Consultar padrón oficial';
      line.append(`⚠ Verificar ${label.toLowerCase()} de la institución. `,source);
      notice.append(line);
      const input = sheet.elements[key];
      input.title = `${label} · ⚠ Verificar con la institución`;
      input.classList.add('adc-sc01-unverified');
    }
    notice.hidden = !notice.childElementCount;
  }
  function loadInstitution() {
    const name = sheet.elements.institucion.value.trim();
    const school = inst.find(school => school.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());
    for (const [key,profileKey] of [['direccionInstitucion','direccion'],['telefonoInstitucion','telefono'],['correoInstitucion','correo']]) {
      const input = sheet.elements[key];
      input.value = school?.[profileKey] || '';
      input.classList.remove('adc-sc01-unverified');
      delete contactOrigin[key];
      if (school?.contactoFuente && input.value && (school.contactoVerificar || '').split(',').includes(profileKey)) contactOrigin[key] = school.contactoFuente;
    }
    showContactOrigin();
    save();
  }
  sheet.elements.institucion.addEventListener('input',loadInstitution);
  document.addEventListener('adc-school-contact-updated',() => {
    if (initialized) loadInstitution();
  });
  function read() { return {...Object.fromEntries(new FormData(sheet)),_dateOrigin:dateOrigin,_autoDate:lastAutoDate,_contactOrigin:contactOrigin}; }
  function write(values) {
    for (const input of sheet.elements) {
      if (input.type === 'radio') input.checked = values[input.name] === input.value;
      else if (input.name) input.value = String(values[input.name] || '').slice(0,input.maxLength > 0 ? input.maxLength : 120);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(values.fecha || '')) dateField.value = values.fecha.split('/').reverse().join('-');
    dateOrigin = values._dateOrigin || 'auto';
    lastAutoDate = values._autoDate || '';
    contactOrigin = values._contactOrigin && typeof values._contactOrigin === 'object' ? values._contactOrigin : {};
    for (const key of Object.keys(contactOrigin)) {
      if (contactOrigin[key] !== window.adcEscuelasChaco?.fuente) delete contactOrigin[key];
    }
    updateSurnameNote();
    showContactOrigin();
  }
  function save() {
    try { localStorage.setItem(storageKey,JSON.stringify(read())); }
    catch { status.textContent = 'No se pudo guardar el borrador. Descargá el PDF para conservarlo.'; }
  }
  function fromProfile() {
    const values = read();
    for (const field of fields.filter(field => field.profile)) values[field.key] = document.getElementById(field.profile)?.value || '';
    values.sexo = document.getElementById('sexo')?.value || '';
    values.tipoDocumento = 'DNI';
    values.telefonoFijo ||= '------';
    if (!values.numeroCalle) {
      const address = values.calle.match(/^(.+?)\s+(?:N[°º.]?\s*)?(\d+[a-zA-Z]?)$/i);
      if (address && !/^(ruta|km|kilometro)\b/i.test(address[1])) {values.calle = address[1];values.numeroCalle = address[2];}
    }
    const number = (document.getElementById('dni')?.value || '').replace(/\D/g,'');
    digits.forEach((digit,index) => {values[digit.name] = number[index] || '';});
    write(values);
    save();
  }
  sheet.addEventListener('submit',event => event.preventDefault());
  sheet.addEventListener('input',event => {
    updateSurnameNote();
    if (contactOrigin[event.target.name]) {
      delete contactOrigin[event.target.name];
      event.target.classList.remove('adc-sc01-unverified');
      showContactOrigin();
    }
    save();
  });
  section.querySelector('#adcSC01Profile').addEventListener('click',() => {
    fromProfile();
    status.textContent = 'Datos del perfil cargados. Revisá el domicilio y completá los datos restantes.';
  });
  section.querySelector('#adcSC01Download').addEventListener('click',async event => {
    for (const key of requiredFields) {
      const input = sheet.elements[key];
      input.setCustomValidity(input.value.trim() ? '' : 'Completá este dato obligatorio.');
    }
    const number = digits.map(digit => digit.value).join('');
    const type = sheet.querySelector('input[name="tipoDocumento"]:checked')?.value;
    const validNumber = type === 'CUIL' ? /^\d{11}$/.test(number) : /^\d{7,8}$/.test(number);
    digits[0].setCustomValidity(validNumber ? '' : type === 'CUIL' ? 'Ingresá los 11 dígitos del CUIL.' : 'Ingresá los 7 u 8 dígitos del documento.');
    if (!sheet.reportValidity()) {status.textContent = 'Completá los datos obligatorios indicados antes de descargar.';return;}
    const button = event.currentTarget;
    button.disabled = true;
    status.textContent = 'Preparando el PDF…';
    try {
      if (!window.PDFLib) throw Error('Revisá tu conexión y actualizá la página para cargar la biblioteca PDF.');
      if (!pdfBytes) {
        const response = await fetch('assets/formularios/SC-01.pdf');
        if (!response.ok) throw Error('No se pudo cargar la plantilla oficial.');
        pdfBytes = await response.arrayBuffer();
      }
      const pdf = await PDFLib.PDFDocument.load(pdfBytes.slice(0));
      const page = pdf.getPages()[0];
      const form = pdf.getForm();
      const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
      const values = read();
      if (values.sexo === 'M') page.drawRectangle({x:136,y:815,width:435,height:13,color:PDFLib.rgb(1,1,1)});
      for (const field of fields) {
        const textField = form.createTextField(`SC01.${field.key}`);
        const value = field.key === 'fecha' ? (values.fecha || '').split('-').reverse().join('/') : values[field.key] || '';
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
      const url = URL.createObjectURL(new Blob([await pdf.save()],{type:'application/pdf'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'SC-01-completado.pdf';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url),60000);
      status.textContent = 'PDF descargado. Conserva campos editables para realizar correcciones.';
    } catch (error) { status.textContent = `No se pudo generar el PDF. ${error.message}`; }
    finally { button.disabled = false; }
  });
  window.adcSC01Open = () => {
    if (!initialized) {
      const now = new Date();
      sheet.elements.fecha.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      let draft;
      try { draft = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch {}
      if (draft && typeof draft === 'object' && !Array.isArray(draft)) write(draft);
      else fromProfile();
      initialized = true;
    }
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    if (dateOrigin === 'auto') {dateField.value = today;lastAutoDate = today;}
    sheet.elements.telefonoFijo.value ||= '------';
    updateInstitutions();
    save();
    tab('sc01');
    section.querySelector('h2').focus();
  };
})();
