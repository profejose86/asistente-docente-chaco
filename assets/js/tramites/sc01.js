// Casilleros medidos sobre el PDF oficial de 612 x 1008 puntos.
(() => {
  const fields = [
    ['fecha','Fecha de emisión',145,166,110,12],
    ['apellido','Apellido del agente',40,194,530,12,'perfilApellidos'],
    ['nombres','Nombres del agente',40,222,530,12,'perfilNombres'],
    ['calle','Calle y domicilio',73,294,348,12,'perfilDomicilio'],
    ['numeroCalle','Número de calle',447,294,123,12],
    ['unidad','Departamento, casa o unidad funcional',40,322,172,12],
    ['manzana','Manzana o torre',220,322,172,12],
    ['barrio','Barrio',400,322,170,12],
    ['localidad','Localidad',40,350,226,12,'perfilLocalidad'],
    ['codigoPostal','Código postal',274,350,63,12],
    ['departamento','Departamento provincial',345,350,225,12],
    ['telefonoFijo','Teléfono fijo',82,364,220,12],
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
  const section = document.createElement('section');
  section.id = 'adcSC01';
  section.className = 'hide';
  section.innerHTML = `
    <button type="button" class="alt" onclick="adcBackToTramites()">← Volver a Mis trámites</button>
    <h2 tabindex="-1">Solicitud de certificación de servicios docentes · SC-01</h2>
    <p>Completá los casilleros resaltados sobre el formulario. Revisá los datos antes de descargarlo.</p>
    <div class="toolbar">
      <button type="button" id="adcSC01Profile" class="alt">Cargar datos del perfil</button>
      <button type="button" id="adcSC01Download">Descargar PDF completado</button>
      <a class="adc-sc01-action" href="assets/formularios/SC-01.pdf" target="_blank" rel="noopener">Ver original</a>
    </div>
    <p class="small">El borrador se guarda en este navegador. El Rubro II y las firmas corresponden a sus responsables. En pantallas pequeñas podés desplazar el formulario horizontalmente.</p>
    <p id="adcSC01Status" role="status" aria-live="polite"></p>
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
  function position(node, box) {
    node.style.left = `${box.x / 612 * 100}%`;
    node.style.top = `${box.y / 1008 * 100}%`;
    node.style.width = `${box.width / 612 * 100}%`;
    node.style.height = `${box.height / 1008 * 100}%`;
  }
  for (const field of fields) {
    const input = document.createElement('input');
    input.name = field.key;
    input.setAttribute('aria-label', field.label);
    input.title = field.label;
    input.maxLength = field.key === 'fecha' ? 10 : 120;
    if (field.key === 'fecha') input.placeholder = 'dd/mm/aaaa';
    input.className = 'adc-sc01-field';
    position(input, field);
    sheet.append(input);
  }
  for (const choice of choices) {
    for (const [value,x,y] of choice.options) {
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = choice.key;
      input.value = value;
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
  function read() { return Object.fromEntries(new FormData(sheet)); }
  function write(values) {
    for (const input of sheet.elements) {
      if (input.type === 'radio') input.checked = values[input.name] === input.value;
      else input.value = String(values[input.name] || '').slice(0,input.maxLength);
    }
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
    const number = (document.getElementById('dni')?.value || '').replace(/\D/g,'');
    digits.forEach((digit,index) => {values[digit.name] = number[index] || '';});
    write(values);
    save();
  }
  sheet.addEventListener('submit',event => event.preventDefault());
  sheet.addEventListener('input',save);
  section.querySelector('#adcSC01Profile').addEventListener('click',() => {
    fromProfile();
    status.textContent = 'Datos del perfil cargados. Revisá el domicilio y completá los datos restantes.';
  });
  section.querySelector('#adcSC01Download').addEventListener('click',async event => {
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
      for (const field of fields) {
        const textField = form.createTextField(`SC01.${field.key}`);
        const value = values[field.key] || '';
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
      sheet.elements.fecha.value = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
      let draft;
      try { draft = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch {}
      if (draft && typeof draft === 'object' && !Array.isArray(draft)) write(draft);
      else fromProfile();
      initialized = true;
    }
    tab('sc01');
    section.querySelector('h2').focus();
  };
})();
