// Copia de consulta del padrón público. Se conserva fuente y fecha del registro.
(() => {
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\./g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const ignored = new Set('escuela escuelas instituto institutos educacion educativa superior secundaria primaria nro numero n ies ees eep egb ep de del la el las los san'.split(' '));
  function candidates(name) {
    const query = normalize(name);
    const tokens = query.split(' ').filter(token => !ignored.has(token));
    if (!tokens.length) return [];
    const rows = window.adcEscuelasChaco?.registros || [];
    const exact = rows.filter(row => normalize(row.nombre) === query || row.cue === query);
    if (exact.length) return exact;
    return rows.filter(row => {
      const words = normalize(row.nombre).split(' ');
      return tokens.every(token => /^\d+$/.test(token) ? words.includes(token) : words.some(word => word.startsWith(token)));
    }).slice(0,30);
  }
  function apply(school, record) {
    school.cue = record.cue;
    school.direccion = record.direccion;
    school.telefono = record.telefono;
    school.correo = record.correo;
    school.localidad = record.localidad;
    school.contactoFuente = window.adcEscuelasChaco.fuente;
    school.contactoFecha = window.adcEscuelasChaco.actualizado;
    school.contactoNombre = school.name;
    school.contactoVerificar = 'direccion,telefono,correo';
    document.dispatchEvent(new CustomEvent('adc-school-contact-updated',{detail:{id:school.id}}));
  }
  window.adcSchoolContacts = {candidates, apply};
  window.adcSchoolContactsRender = () => {
    for (const input of document.querySelectorAll('#instituciones input[data-k="name"]')) {
      const school = inst.find(item => item.id === Number(input.dataset.i));
      if (!school || input.dataset.contactosListos) continue;
      input.dataset.contactosListos = '1';
      const panel = document.createElement('fieldset');
      panel.className = 'adc-school-contacts';
      panel.innerHTML = '<legend>Dirección y contacto de la institución</legend><p class="small" role="status"></p><select aria-label="Elegir establecimiento del padrón oficial" hidden></select><div class="fields"></div>';
      const note = panel.querySelector('p');
      const select = panel.querySelector('select');
      const controls = [];
      for (const [key,label] of [['direccion','Dirección'],['telefono','Teléfono'],['correo','Correo electrónico']]) {
        const wrapper = document.createElement('label');
        const warning = document.createElement('span');
        const control = document.createElement('input');
        wrapper.append(label+' ',warning,control);
        control.value = school[key] || '';
        warning.className = 'adc-contact-warning';
        warning.textContent = school.contactoFuente && school[key] && (school.contactoVerificar || '').split(',').includes(key) ? '⚠ Verificar' : '';
        control.addEventListener('input',() => {
          school[key] = control.value;
          school.contactoVerificar = (school.contactoVerificar || '').split(',').filter(value => value !== key).join(',');
          warning.textContent = '';
        });
        controls.push({key,control,warning});
        panel.querySelector('.fields').append(wrapper);
      }
      input.closest('.fields').after(panel);
      function showSource() {
        note.replaceChildren();
        if (!school.contactoFuente) return;
        const link = document.createElement('a');
        link.href = school.contactoFuente;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = `Padrón oficial · ${school.contactoFecha}. Verificá la dirección, el teléfono y el correo.`;
        note.append(link);
      }
      function choose(record) {
        apply(school,record);
        for (const {key,control,warning} of controls) {
          control.value = school[key] || '';
          warning.textContent = school[key] ? '⚠ Verificar' : '';
        }
        showSource();
      }
      function lookup() {
        const name = input.value.trim();
        if (school.name !== name) return;
        if (school.contactoNombre === name) return;
        if (school.contactoFuente && school.contactoNombre !== name) {
          for (const {key,control,warning} of controls) {school[key] = '';control.value = '';warning.textContent = '';}
          school.contactoFuente = '';
          school.cue = '';
        }
        const matches = candidates(name);
        select.replaceChildren(new Option('Elegí la sede y localidad',''));
        matches.forEach((record,index) => select.add(new Option(`${record.nombre} · ${record.localidad} · CUE ${record.cue}`,String(index))));
        select.hidden = matches.length < 2;
        if (matches.length === 1) choose(matches[0]);
        else note.textContent = matches.length ? 'Hay varias coincidencias. Elegí la sede correcta para cargar sus contactos.' : 'No se encontró una coincidencia en el padrón. Podés completar los contactos manualmente.';
        select.onchange = () => {if(select.value !== '') choose(matches[Number(select.value)]);};
      }
      input.addEventListener('change',lookup);
      showSource();
      if (!school.contactoFuente && !school.direccion && !school.telefono && !school.correo && school.name) lookup();
    }
  };
  adcSchoolContactsRender();
})();
