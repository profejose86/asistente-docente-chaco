"use strict";

// Coordenadas en puntos, medidas sobre las dos páginas del PDF adjunto.
(() => {
  const width = 612.12;
  const height = 1008.12;
  const draftKey = 'adc-bd02-borrador-v1';
  const oldDraftKey = 'adc-official-form-bd02-draft-v1';
  const fields = [];
  const choices = [];
  const dates = [];
  function text(key, label, page, x, y, boxWidth, options = {}) {
    fields.push({
      key,
      label,
      page,
      x,
      y,
      width: boxWidth,
      height: 12,
      fontSize: 12,
      fontFamily: 'sans',
      ...options
    });
  }
  function date(key, label, page, y, xs = [120, 147, 174], widths = [22, 22, 38], row = null) {
    dates.push({
      key,
      label,
      page,
      y,
      xs,
      widths,
      row
    });
    for (const [index, part] of ['day', 'month', 'year'].entries()) {
      text(`${key}.${part}`, `${label}, ${['día', 'mes', 'año'][index]}`, page, xs[index], y, widths[index], {
        maxLength: index === 2 ? 4 : 2,
        mnc: false,
        date: key,
        ...(row !== null && key.endsWith('.fechaAlta') ? {entry: `alta.${part}`} : {}),
        row,
        part
      });
    }
  }
  text('numeroDisposicion', 'Número de disposición de baja', 0, 304, 159.3, 133, {
    mnc: false,
    fontSize: 9.96
  });
  text('actuacionSimple.serie', 'Actuación simple, serie después de A', 0, 270, 126.8, 14, {
    maxLength: 3,
    mnc: false,
    fontSize: 9.96,
    fontFamily: 'serif'
  });
  text('actuacionSimple.numero', 'Actuación simple, número', 0, 289, 126.8, 39.5, {
    maxLength: 8,
    mnc: false,
    fontSize: 9.96,
    fontFamily: 'serif'
  });
  text('actuacionSimple.anio', 'Actuación simple, último grupo', 0, 333, 126.8, 23, {
    maxLength: 5,
    mnc: false,
    fontSize: 9.96,
    fontFamily: 'serif'
  });
  text('apellido', 'Apellido', 0, 276, 212.4, 298, {
    required: true,
    profile: 'perfilApellidos'
  });
  text('nombres', 'Nombres', 0, 109, 233, 465, {
    required: true,
    profile: 'perfilNombres'
  });
  text('dni', 'DNI', 0, 101, 253.6, 204, {
    required: true,
    profile: 'dni',
    mnc: false
  });
  choices.push({
    key: 'sexo',
    label: 'Sexo',
    page: 0,
    profile: 'sexo',
    required: true,
    options: [['F', 382.75, 255.14], ['M', 419.95, 255.14]]
  });
  text('codigoOficina', 'Código de oficina', 0, 163, 274.3, 192, {
    required: true,
    institution: 'office'
  });
  text('codigoAnexo', 'Código de anexo', 0, 464, 274.3, 114);
  text('establecimiento', 'Unidad educativa', 0, 162, 294.9, 215, {
    required: true,
    institution: 'name'
  });
  text('nivelModalidad', 'Nivel y modalidad', 0, 473, 294.9, 106, {
    institution: 'level'
  });
  text('categoria', 'Categoría', 0, 113, 322.6, 120);
  text('zona', 'Zona', 0, 268, 322.6, 107);
  text('jornada', 'Jornada', 0, 429, 322.6, 150);
  text('localidad', 'Localidad o paraje', 0, 159, 343.3, 420, {
    institution: 'localidad'
  });
  const rows = [{
    page: 0,
    top: 390.5,
    revista: 507.31,
    motivo: 527.11
  }, {
    page: 0,
    top: 680.3,
    revista: 797.02,
    motivo: 816.82
  }, {
    page: 1,
    top: 78,
    revista: 194.78,
    motivo: 214.58
  }, {
    page: 1,
    top: 321.2,
    revista: 437.93,
    motivo: 457.75
  }, {
    page: 1,
    top: 564.3,
    revista: 681.22,
    motivo: 701.02
  }];
  rows.forEach((row, index) => {
    const prefix = `cargos.${index}`;
    const label = name => `${name}, cargo ${index + 1}`;
    const add = (key, name, x, dy, boxWidth, options = {}) => text(`${prefix}.${key}`, label(name), row.page, x, row.top + dy, boxWidth, {
      row: index,
      ...options
    });
    add('codigoCargo', 'Código de cargo / horas', 158, -2, 98, {
      mnc: false,
      entry: 'cargoCode',
      rowRequired: true
    });
    add('descripcionCargo', 'Descripción del cargo', 333, -2, 242, {
      mnc: false,
      entry: 'description',
      rowRequired: true
    });
    date(`${prefix}.fechaAlta`, label('Fecha de alta'), row.page, row.top + 18.1, undefined, undefined, index);
    add('instrumentoAlta', 'Resolución / disposición de alta', 451, 19.7, 122);
    date(`${prefix}.fechaBaja`, label('Fecha de baja'), row.page, row.top + 40, undefined, undefined, index);
    add('anio', 'Año', 67, 62, 42, {
      entry: 'year', academicPart: 'year'
    });
    add('division', 'División o sección', 225, 62, 99, {
      entry: 'division', academicPart: 'division'
    });
    add('turno', 'Turno', 375, 62, 75, {
      entry: 'turno'
    });
    add('horas', 'Horas cátedra', 534, 62, 40, {
      entry: 'hours'
    });
    add('especialidad', 'Especialidad', 111, 75.7, 263);
    add('planEstudio', 'Plan de estudio', 473, 75.7, 103);
    add('asignatura', 'Asignatura', 100, 95.5, 474, {
      entry: 'subject'
    });
    choices.push({
      key: `${prefix}.situacionRevista`,
      label: label('Situación de revista'),
      page: row.page,
      row: index,
      entry: 'revista',
      options: [['Titular', 212.57, row.revista], ['Interino', 300.41, row.revista], ['Suplente', 397.63, row.revista]]
    });
    for (let digit = 0; digit < 5; digit++) text(`${prefix}.codigoMotivo.${digit}`, label(`Código de motivo, dígito ${digit + 1}`), row.page, 143.78 + digit * 13.8, row.motivo, 11.52, {
      row: index,
      maxLength: 1,
      mnc: false,
      align: 'center'
    });
    add('descripcionMotivo', 'Descripción del motivo, primera línea', 288, 135.1, 286);
    add('descripcionMotivoContinuacion', 'Descripción del motivo, segunda línea', 36, 154.5, 536, {fontSize: 9.96, fontFamily: 'serif'});
    add('instrumento', 'Instrumento legal, sólo titulares', 139, 172.4, 431, {
      mnc: false
    });
  });
  text('observaciones', 'Observaciones', 1, 123, 796.6, 455);
  date('fecha', 'Fecha de firma', 1, 873.2, [90, 122, 154], [25, 25, 42]);
  text('notificacion', 'Notificación del docente', 1, 172, 920.8, 158);
  text('aclaracion', 'Aclaración de firma', 1, 341, 920.8, 212, {
    profile: 'fullName'
  });
  const section = document.createElement('section');
  section.id = 'adcBD02';
  section.className = 'hide';
  section.innerHTML = `
    <button type="button" class="alt" data-bd02-back>← Volver a Mis trámites</button>
    <h2 tabindex="-1">Disposición de baja · BD-02</h2>
    <label class="adc-bd02-school">¿De qué institución vas a gestionar la baja? <select data-bd02-school required><option value="">Seleccionar institución</option></select></label>
    <fieldset class="adc-bd02-entries"><legend>Seleccioná las horas cátedra o cargos que vas a dar de baja</legend><div data-bd02-entries></div><p class="small">Podés seleccionar hasta cinco. Solo se incluyen los seleccionados; los recuadros restantes se anulan con una cruz.</p></fieldset>
    <p>Verificá los datos del Perfil Docente y completá el trámite sobre las dos páginas del formulario adjunto.</p>
    <div class="toolbar adc-bd02-actions">
      <button type="button" data-bd02-action="preview">Ver Vista Preliminar</button>
      <button type="button" data-bd02-action="download">Descargar PDF Completado</button>
      <button type="button" data-bd02-action="print">Imprimir</button>
    </div>
    <p class="small">El borrador se guarda en este dispositivo. Usá X en los campos opcionales vacíos para marcar No corresponde. Las firmas y sellos se realizan sobre el impreso.</p>
    <div data-bd02-review role="status"></div>
    <div data-bd02-conflicts aria-live="polite"></div>
    <p data-bd02-status role="status" aria-live="polite"></p>
    <div class="toolbar adc-bd02-tools">
      <button type="button" class="alt" data-bd02-zoom="out" aria-label="Reducir zoom BD-02">−</button>
      <output data-bd02-zoom-value>100%</output>
      <button type="button" class="alt" data-bd02-zoom="in" aria-label="Aumentar zoom BD-02">+</button>
      <button type="button" class="alt" data-bd02-zoom="fit">Ajustar al ancho</button>
      <button type="button" class="alt" data-bd02-pending>Revisar datos pendientes</button>
    </div>
    <div class="adc-bd02-viewport" tabindex="0" role="region" aria-label="BD-02 oficial editable">
      <div class="adc-bd02-size"><form class="adc-bd02-document" autocomplete="off"></form></div>
    </div>
    <div class="toolbar adc-bd02-actions">
      <button type="button" data-bd02-action="preview">Ver Vista Preliminar</button>
      <button type="button" data-bd02-action="download">Descargar PDF Completado</button>
      <button type="button" data-bd02-action="print">Imprimir</button>
    </div>
    <div class="adc-bd02-preview" data-bd02-preview hidden></div>
    <a href="assets/formularios/BD-02.pdf" target="_blank" rel="noopener">Abrir PDF original adjunto</a>`;
  document.querySelector('.wrap > footer').before(section);
  const form = section.querySelector('form');
  const status = section.querySelector('[data-bd02-status]');
  const viewport = section.querySelector('.adc-bd02-viewport');
  const size = section.querySelector('.adc-bd02-size');
  const preview = section.querySelector('[data-bd02-preview]');
  const school = section.querySelector('[data-bd02-school]');
  const controls = new Map();
  const radios = new Map();
  const mnc = new Map();
  const pages = [];
  let values = {};
  let marked = new Set();
  let touched = new Set();
  let origin = new Set();
  let acknowledged = {};
  let warnings = [];
  let legacySnapshot = null;
  let legacyReviewed = true;
  let selectedSchool = '';
  let selectedSchoolName = '';
  let selectedEntries = [];
  let entryDrafts = {};
  let selectionInitialized = false;
  let initialized = false;
  let revision = 0;
  let zoom = 1;
  let fit = true;
  let pdfBytes;
  let fontPromise;
  let measuringFonts = {};
  let previewUrl;

  const measure = document.createElement('canvas').getContext('2d');
  const availableKeys = new Set([...fields, ...choices].map(field => field.key));
  function position(node, box) {
    Object.assign(node.style, {
      left: `${box.x / width * 100}%`,
      top: `${box.y / height * 100}%`,
      width: `${box.width / width * 100}%`,
      height: `${box.height / height * 100}%`
    });
  }
  for (let page = 0; page < 2; page++) {
    const sheet = document.createElement('div');
    sheet.className = 'adc-bd02-page';
    sheet.dataset.bd02Page = String(page + 1);
    const image = document.createElement('img');
    image.src = `assets/formularios/BD-02-pagina-${page + 1}.png`;
    image.alt = `BD-02 oficial, página ${page + 1} de 2`;
    sheet.append(image);
    form.append(sheet);
    pages.push(sheet);
  }
  function unusedBox(row) {
    const firstOnSecondPage = row.page === 1 && row.top === 78;
    return {x: 29, y: firstOnSecondPage ? 74 : row.top - 14.5, width: 557, height: firstOnSecondPage ? 213 : 224};
  }
  rows.forEach((row, index) => {
    const box = unusedBox(row);
    const cross = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    cross.dataset.bd02Unused = String(index);
    cross.classList.add('adc-bd02-unused');
    cross.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    cross.setAttribute('aria-label', `Bloque ${index + 1} sin utilizar`);
    for (const [x1, x2] of [[0, box.width], [box.width, 0]]) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      for (const [name, value] of Object.entries({x1, y1:0, x2, y2:box.height, stroke:'black', 'stroke-width':72/25.4})) line.setAttribute(name, String(value));
      cross.append(line);
    }
    position(cross, box);
    pages[row.page].append(cross);
  });
  for (const field of fields) {
    const host = document.createElement('div');
    host.className = 'adc-bd02-field';
    position(host, field);
    const input = document.createElement('input');
    input.name = field.key;
    input.dataset.bd02Field = field.key;
    input.setAttribute('aria-label', field.label);
    input.title = field.label;
    input.autocomplete = 'off';
    input.style.fontSize = `${field.fontSize * 96 / 72}px`;
    if (field.align) input.style.textAlign = field.align;
    if (field.maxLength) {
      input.maxLength = field.maxLength;
      input.inputMode = 'numeric';
      input.pattern = '[0-9]*';
    }
    host.append(input);
    pages[field.page].append(host);
    controls.set(field.key, input);
    if (adcMnc.eligible({
      ...field,
      type: 'text'
    })) {
      const controller = adcMnc.bind(input, {
        onChange: isMarked => {
          if (isMarked) marked.add(field.key);else marked.delete(field.key);
          touched.add(field.key);
          origin.delete(field.key);
          acknowledged[field.key] = profileValue(field);
          changed();
        }
      });
      mnc.set(field.key, controller);
      controller.button.dataset.bd02Mnc = field.key;
      controller.line.dataset.bd02MncLine = field.key;
    }
  }
  for (const choice of choices) {
    const items = [];
    for (const [value, x, y] of choice.options) {
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = choice.key;
      input.value = value;
      input.className = 'adc-bd02-choice';
      input.dataset.bd02Choice = choice.key;
      input.setAttribute('aria-label', `${choice.label}: ${value}`);
      position(input, {
        x,
        y,
        width: 11.52,
        height: 11.52
      });
      pages[choice.page].append(input);
      items.push(input);
    }
    radios.set(choice.key, items);
  }
  for (const group of dates) {
    const calendar = document.createElement('input');
    calendar.type = 'date';
    calendar.className = 'adc-bd02-calendar';
    calendar.dataset.bd02Calendar = group.key;
    calendar.setAttribute('aria-label', `Elegir ${group.label.toLowerCase()} en calendario`);
    position(calendar, {
      x: group.xs[2] + group.widths[2] + 2,
      y: group.y,
      width: 15,
      height: 14
    });
    calendar.addEventListener('change', () => {
      if (!calendar.value) return;
      const [year, month, day] = calendar.value.split('-');
      for (const [part, value] of Object.entries({
        day,
        month,
        year
      })) {
        const key = `${group.key}.${part}`;
        values[key] = value;
        controls.get(key).value = value;
        touched.add(key);
        acknowledged[key] = profileValue(fields.find(field => field.key === key));
      }
      changed();
    });
    pages[group.page].append(calendar);
  }
  function institutions() {
    return typeof inst === 'undefined' ? [] : inst;
  }
  function institution() {
    return institutions().find(item => String(item.id) === selectedSchool);
  }
  function entryId(entry, index) {
    return String(entry.djUid || `legacy:${index}:${entry.type}:${entry.cargoCode || ''}:${entry.subject || entry.cargoName || ''}:${entry.course || ''}`);
  }
  function selectedEntry(row) {
    return (institution()?.entries || []).find((entry, index) => entryId(entry, index) === selectedEntries[row]);
  }
  function stashEntries() {
    selectedEntries.forEach((id, row) => {
      const prefix = `cargos.${row}.`;
      const snapshot = {values: {}, marked: [], touched: [], origin: [], acknowledged: {}};
      for (const field of [...fields, ...choices].filter(field => field.row === row)) {
        const key = field.key.slice(prefix.length);
        snapshot.values[key] = values[field.key] || '';
        for (const [name, set] of [['marked', marked], ['touched', touched], ['origin', origin]]) if (set.has(field.key)) snapshot[name].push(key);
        if (field.key in acknowledged) snapshot.acknowledged[key] = acknowledged[field.key];
      }
      entryDrafts[`${selectedSchoolName}\n${id}`] = snapshot;
    });
  }
  function restoreEntries() {
    for (const field of [...fields, ...choices].filter(field => field.row != null)) {
      const suffix = field.key.replace(/^cargos\.\d+\./, '');
      const snapshot = entryDrafts[`${selectedSchoolName}\n${selectedEntries[field.row]}`];
      values[field.key] = snapshot?.values[suffix] || '';
      for (const [name, set] of [['marked', marked], ['touched', touched], ['origin', origin]]) {
        set.delete(field.key);
        if (snapshot?.[name].includes(suffix)) set.add(field.key);
      }
      delete acknowledged[field.key];
      if (snapshot && suffix in snapshot.acknowledged) acknowledged[field.key] = snapshot.acknowledged[suffix];
    }
  }
  function renderEntries() {
    const list = section.querySelector('[data-bd02-entries]');
    list.replaceChildren();
    const entries = institution()?.entries || [];
    if (!entries.length) list.textContent = 'Seleccioná una institución con horas o cargos registrados en Mi Perfil Docente.';
    entries.forEach((entry, index) => {
      const id = entryId(entry, index);
      const label = document.createElement('label');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.dataset.bd02Entry = id;
      check.checked = selectedEntries.includes(id);
      check.disabled = !check.checked && selectedEntries.length >= 5;
      const hours = (entry.schedule || []).slice(0, 5).reduce((sum, value) => sum + Number(value || 0), 0);
      label.append(check, document.createTextNode(`${index + 1}. ${entry.type === 'cargo' ? entry.cargoName || 'Cargo' : `${entry.subject || 'Horas cátedra'} · ${window.adcAcademic.course(entry)} · ${hours} h`} · ${entry.revista || 'Revista sin indicar'} · ${entry.turno || 'Turno sin indicar'}`));
      check.addEventListener('change', () => {
        readControls();
        stashEntries();
        selectedEntries = check.checked ? [...selectedEntries, id] : selectedEntries.filter(value => value !== id);
        restoreEntries();
        renderEntries();
        syncProfile();
      });
      list.append(label);
    });
  }
  function profileValue(field) {
    if (field.profile === 'fullName') return [values.nombres, values.apellido].filter(Boolean).join(' ');
    if (field.profile) return document.getElementById(field.profile)?.value || '';
    const current = institution();
    if (field.institution) return String(current?.[field.institution] || '');
    if (!field.entry || !current) return '';
    const entry = selectedEntry(field.row);
    if (!entry) return '';
    if (field.entry.startsWith('alta.')) {
      const raw = entry.djPeriods?.at(-1)?.desde || '';
      const [year, month, day] = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw.split('-') : [];
      return ({year, month, day})[field.part] || '';
    }
    const course = entry.adcCourseParts || (typeof splitCourse === 'function' ? splitCourse(entry.course) : {});
    const data = {
      cargoCode: entry.cargoCode || (entry.type !== 'cargo' && typeof codigoHorasNivel === 'function' ? codigoHorasNivel(current.level) : ''),
      description: entry.type === 'cargo' ? entry.cargoName : 'Horas cátedra',
      subject: entry.type === 'cargo' ? '' : entry.subject,
      year: course.year,
      division: course.division,
      turno: entry.turno,
      revista: entry.revista,
      hours: entry.type === 'cargo' ? '' : (entry.schedule || []).slice(0, 5).reduce((sum, hours) => sum + Number(hours || 0), 0) || ''
    };
    return String(data[field.entry] || '');
  }
  function readControls() {
    for (const [key, input] of controls) {
      const field = fields.find(field => field.key === key);
      if (!field.academicPart || input.value !== displayed(field, values[key])) values[key] = input.value;
    }
    for (const [key, items] of radios) values[key] = items.find(input => input.checked)?.value || '';
  }
  function save() {
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        values,
        marked: [...marked],
        touched: [...touched],
        origin: [...origin],
        acknowledged,
        selectedSchool,
        selectedSchoolName: institution()?.name || selectedSchoolName,
        selectedEntries,
        entryDrafts,
        selectionInitialized,
        warnings,
        legacySnapshot,
        legacyReviewed
      }));
    } catch (error) {
      status.textContent = `No se pudo guardar el borrador. ${error.message}`;
    }
  }
  function invalidate() {


    revision++;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    preview.replaceChildren();
    preview.hidden = true;
  }
  function rowUsed(index) {
    return Boolean(selectedEntries[index]) || [...availableKeys].some(key => key.startsWith(`cargos.${index}.`) && String(values[key] || '').trim());
  }
  function onlyTitulares() {
    const used = rows.map((row, index) => index).filter(rowUsed);
    return used.length > 0 && used.every(index => values[`cargos.${index}.situacionRevista`] === 'Titular');
  }
  function required(field) {
    if (field.required) return true;
    if (field.key === 'numeroDisposicion') return rows.some((row, index) => rowUsed(index)) && !onlyTitulares();
    if (field.row === undefined || field.row === null || !rowUsed(field.row)) return false;
    if (field.rowRequired || field.date || field.key.endsWith('.situacionRevista')) return true;
    return field.key.endsWith('.instrumento') && values[`cargos.${field.row}.situacionRevista`] === 'Titular';
  }
  function fieldTypeface(field) {
    return field.fontFamily === 'serif' ? '"Times New Roman", Times, serif' : 'Arial, Helvetica, sans-serif';
  }
  function displayed(field, value) {
    return field.academicPart ? window.adcAcademic.part(value, field.academicPart) : String(value ?? '');
  }
  function textLayout(value, field) {
    const font = measuringFonts[field.fontFamily];
    const content = pdfText(displayed(field, value));
    // Medimos a 1 pt: las métricas PDF y navegador escalan linealmente.
    measure.font = `100px ${fieldTypeface(field)}`;
    let unitWidth = measure.measureText(content).width / 100;
    let unitHeight = 1;
    if (font) {
      try {
        unitWidth = Math.max(unitWidth, font.widthOfTextAtSize(content, 1));
        unitHeight = font.heightAtSize(1, {descender: true});
      } catch {
        return {size: 7, width: Infinity};
      }
    }
    const fitted = Math.min(field.fontSize, (field.width - 2) / (unitWidth || 1), (field.height - .8) / unitHeight);
    const size = Math.max(7, Math.floor(fitted * 100) / 100);
    return {size, width: unitWidth * size};
  }
  function textWidth(value, field) {
    return textLayout(value, field).width;
  }
  function dateValue(group) {
    return ['year', 'month', 'day'].map(part => {
      const value = String(values[`${group.key}.${part}`] || '');
      return value && part !== 'year' ? value.padStart(2, '0') : value;
    }).join('-');
  }
  function issues() {
    const errors = [];
    for (const field of fields) {
      const value = String(values[field.key] || '');
      let message = '';
      if (required(field) && !value.trim()) message = `Completá ${field.label.toLowerCase()}.`;
      if (value && textWidth(value, field) > field.width - 2) message = `El texto de «${field.label}» excede su casillero incluso a 7 puntos. Se conserva completo en el borrador. Hay que acordar cómo ajustarlo antes de exportar; no se recorta ni se reduce más.`;
      if (field.maxLength && value && !/^[0-9]+$/.test(value)) message = `Usá números en ${field.label.toLowerCase()}.`;
      if (field.key === 'dni' && value && !/^\d{7,8}$/.test(value.replace(/\./g, ''))) message = 'Ingresá un DNI de 7 u 8 dígitos.';
      if (field.key === 'numeroDisposicion' && onlyTitulares() && value) message = 'Para egreso exclusivo de titulares, dejá vacío el número de disposición.';
      if (field.key.endsWith('.instrumento') && value && values[`cargos.${field.row}.situacionRevista`] && values[`cargos.${field.row}.situacionRevista`] !== 'Titular') message = `El instrumento legal del cargo ${field.row + 1} está reservado a titulares. Revisá el dato conservado.`;
      if (message) errors.push({
        key: field.key,
        message,
        missing: required(field) && !value.trim()
      });
    }
    for (const choice of choices) if (required(choice) && !choice.options.some(option => option[0] === values[choice.key])) errors.push({
      key: choice.key,
      message: `Seleccioná ${choice.label.toLowerCase()}.`,
      missing: !values[choice.key]
    });
    for (const group of dates) {
      const parts = ['day', 'month', 'year'].map(part => values[`${group.key}.${part}`] || '');
      if (!parts.some(Boolean)) continue;
      const [day, month, year] = parts.map(Number);
      const date = new Date(year, month - 1, day);
      if (parts[2].length !== 4 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) errors.push({
        key: `${group.key}.day`,
        message: `Revisá ${group.label.toLowerCase()}: la fecha está incompleta o no es válida.`,
        missing: parts.some(part => !part)
      });
      if (group.key.endsWith('.fechaBaja')) {
        const start = dateValue({
          key: group.key.replace('fechaBaja', 'fechaAlta')
        });
        if (/^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(dateValue(group)) && dateValue(group) < start) errors.push({
          key: `${group.key}.day`,
          message: 'La baja debe ser igual o posterior al alta.'
        });
      }
    }
    if (!selectedSchool || !selectedEntries.length) errors.push({key: 'establecimiento', message: 'Seleccioná la institución y al menos un cargo u horas cátedra para gestionar la baja.'});
    if (selectedEntries.some((id, row) => !selectedEntry(row))) errors.push({key: 'establecimiento', message: 'Un cargo seleccionado ya no está en el perfil. Revisá la selección antes de exportar.'});
    if (!rows.some((row, index) => rowUsed(index))) errors.push({
      key: 'cargos.0.codigoCargo',
      message: 'Completá al menos un bloque de cargo.'
    });
    if (!legacyReviewed) errors.push({
      key: 'apellido',
      message: 'Revisá los datos recuperados del borrador anterior antes de generar el PDF.'
    });
    return errors;
  }
  function refresh() {
    rows.forEach((row, index) => {
      const unused = !rowUsed(index);
      section.querySelector(`[data-bd02-unused="${index}"]`).toggleAttribute('hidden', !unused);
      for (const field of fields.filter(field => field.row === index)) {
        controls.get(field.key).closest('.adc-bd02-field').hidden = unused;
        controls.get(field.key).disabled = unused;
      }
      for (const choice of choices.filter(field => field.row === index)) for (const input of radios.get(choice.key)) input.hidden = unused;
      for (const date of dates.filter(field => field.row === index)) section.querySelector(`[data-bd02-calendar="${date.key}"]`).hidden = unused;
    });
    for (const field of fields) {
      const input = controls.get(field.key);
      const layout = textLayout(values[field.key] || '', field);
      input.style.fontFamily = fieldTypeface(field);
      input.style.fontSize = `${layout.size * 96 / 72}px`;
      input.dataset.bd02FontSize = String(layout.size);
      input.required = required(field);
      input.setAttribute('aria-required', String(input.required));
      input.title = `${field.label}${input.required ? ' (obligatorio)' : ''}${origin.has(field.key) ? ' · Perfil Docente' : ''}`;
      mnc.get(field.key)?.refresh();
    }
    const errors = issues();
    for (const input of controls.values()) input.setCustomValidity('');
    for (const error of errors) controls.get(error.key)?.setCustomValidity(error.message);
    const pending = section.querySelector('[data-bd02-pending]');
    pending.hidden = !errors.length;
    const pendingGroups=new Set(errors.map(error=>fields.find(field=>field.key===error.key)?.date||error.key));
    pending.textContent = `Revisar datos pendientes (${pendingGroups.size})`;
    const review = section.querySelector('[data-bd02-review]');
    review.replaceChildren();
    for (const warning of [...warnings, ...errors.filter(error => error.message.includes('excede')).map(error => error.message)]) {
      const text = document.createElement('p');
      text.textContent = warning;
      review.append(text);
    }
    if (institution()?.entries.length > 5) {
      const text = document.createElement('p');
      text.textContent = 'La plantilla admite hasta cinco cargos por trámite. Seleccioná cuáles vas a dar de baja; los demás no se incluyen.';
      review.append(text);
    }
    if (selectedSchool && !institution()) {
      const text = document.createElement('p');
      text.textContent = 'La institución vinculada ya no se encuentra en el perfil. El borrador conserva sus datos para que los verifiques.';
      review.append(text);
    }
    if (!legacyReviewed) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'alt';
      button.textContent = 'Ya revisé los datos recuperados';
      button.addEventListener('click', () => {
        legacyReviewed = true;
        save();
        refresh();
      });
      review.append(button);
    }
    if (legacySnapshot) {
      const backup = document.createElement('button');
      backup.type = 'button';
      backup.className = 'alt';
      backup.textContent = 'Descargar respaldo del borrador anterior';
      backup.addEventListener('click', () => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(legacySnapshot, null, 2)], {
          type: 'application/json'
        }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'BD-02-borrador-anterior.json';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      });
      review.append(backup);
    }
  }
  function conflicts() {
    const container = section.querySelector('[data-bd02-conflicts]');
    container.replaceChildren();
    for (const field of [...fields, ...choices]) {
      if (!field.profile && !field.institution && !field.entry) continue;
      if ((field.institution || field.entry) && !institution()) continue;
      const next = profileValue(field);
      if (field.key === 'dni' && next.replace(/\D/g, '') === String(values[field.key] || '').replace(/\D/g, '')) continue;
      if (!touched.has(field.key) && !marked.has(field.key) || next === String(values[field.key] || '') || acknowledged[field.key] === next) continue;
      const notice = document.createElement('div');
      notice.className = 'adc-bd02-conflict';
      const text = document.createElement('p');
      text.textContent = `${field.label}: el perfil contiene «${next || 'sin dato'}». El borrador conserva ${marked.has(field.key) ? 'la marca No corresponde' : 'tu corrección'}.`;
      notice.append(text);
      for (const useProfile of [false, true]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'alt';
        button.textContent = useProfile ? 'Usar dato del perfil' : 'Conservar mi dato';
        button.addEventListener('click', () => {
          acknowledged[field.key] = next;
          if (useProfile) {
            mnc.get(field.key)?.set(false, false);
            marked.delete(field.key);
            values[field.key] = next;
            touched.delete(field.key);
            origin.add(field.key);
            write();
            invalidate();
          }
          save();
          refresh();
          conflicts();
        });
        notice.append(button);
      }
      container.append(notice);
    }
  }
  function write() {
    for (const [key, input] of controls) {
      input.value = displayed(fields.find(field => field.key === key), values[key]);
      mnc.get(key)?.set(marked.has(key), false);
    }
    for (const [key, items] of radios) for (const input of items) input.checked = input.value === values[key];
    for (const group of dates) {
      const calendar = section.querySelector(`[data-bd02-calendar="${group.key}"]`);
      calendar.value = dateValue(group);
    }
  }
  function syncProfile() {
    for (const field of [...fields, ...choices]) {
      if (!field.profile && !field.institution && !field.entry) continue;
      if ((field.institution || field.entry) && !institution()) continue;
      if (marked.has(field.key) || (touched.has(field.key) && String(values[field.key] || '').trim())) continue;
      const next = profileValue(field);
      if (origin.has(field.key) || !String(values[field.key] || '').trim()) {
        values[field.key] = next;
        if (next) origin.add(field.key);
      }
    }
    write();
    invalidate();
    save();
    refresh();
    conflicts();
  }
  function changed() {
    readControls();
    if (!touched.has('aclaracion') && !marked.has('aclaracion')) {
      values.aclaracion = [values.nombres, values.apellido].filter(Boolean).join(' ');
      controls.get('aclaracion').value = values.aclaracion;
      if (values.aclaracion) origin.add('aclaracion');
    }
    invalidate();
    save();
    refresh();
    conflicts();
  }
  function migrate(old) {
    legacySnapshot = old;
    legacyReviewed = false;
    const previous = old.values || {};
    if (Object.keys(previous).some(key => /^cargos\.[5-9]\d*\./.test(key))) warnings.push('El borrador anterior incluye más de cinco cargos. Los excedentes se conservan en el respaldo y requieren acordar cómo presentarlos en la plantilla de dos páginas.');
    const schools = new Set(Object.entries(previous).filter(([key, value]) => /^cargos\.\d+\.establecimiento$/.test(key) && value).map(([, value]) => value));
    if (schools.size > 1) warnings.push('El borrador anterior contiene distintas instituciones. Esta plantilla tiene un único encabezado institucional. Revisá qué cargos corresponden al establecimiento indicado.');
    for (const field of [...fields, ...choices]) {
      let value = previous[field.key];
      if (field.key === 'nivelModalidad') value = [previous['cargos.0.nivel'], previous['cargos.0.modalidad']].filter(Boolean).join(' / ');
      if (field.institution && value === undefined) value = previous[`cargos.0.${field.key}`];
      if (value === undefined && ['codigoAnexo', 'categoria', 'zona', 'jornada'].includes(field.key)) value = previous[`cargos.0.${field.key}`];
      if (field.key.endsWith('.descripcionCargo') && value === undefined) value = previous[field.key.replace('descripcionCargo', 'cargo')];
      if (field.key.includes('.codigoMotivo.')) value = String(previous[field.key.replace(/\.\d$/, '')] || '')[Number(field.key.split('.').at(-1))] || '';
      if (value !== undefined) {
        values[field.key] = String(value);
        touched.add(field.key);
      }
    }
    for (const group of dates) {
      const raw = String(previous[group.key] || '');
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [year, month, day] = raw.split('-');
        for (const [part, value] of Object.entries({
          day,
          month,
          year
        })) {
          values[`${group.key}.${part}`] = value;
          touched.add(`${group.key}.${part}`);
        }
      }
    }
    for (let index = 0; index < 5; index++) {
      if (String(previous[`cargos.${index}.codigoMotivo`] || '').length > 5) warnings.push(`El código de motivo del cargo ${index + 1} supera los cinco casilleros. El dato completo se conserva en el respaldo y necesita revisión.`);
    }
    for (const key of old.marked || []) {
      if (mnc.has(key) && !String(values[key] || '').trim()) marked.add(key);else warnings.push(`La marca anterior de «${key}» necesita revisión en la plantilla oficial. Se conservan el texto y la decisión original en el respaldo del borrador.`);
    }
    warnings.unshift('Se recuperó el borrador del diseño anterior. Verificá la institución y los cinco bloques sobre el PDF adjunto. El borrador anterior permanece guardado.');
  }
  function load() {
    let rawCurrent;
    let rawPrevious;
    try {
      rawCurrent = localStorage.getItem(draftKey);
      const draft = JSON.parse(rawCurrent || 'null');
      if (draft && typeof draft === 'object' && !Array.isArray(draft)) {
        values = draft.values || {};
        marked = new Set(draft.marked || []);
        touched = new Set(draft.touched || []);
        origin = new Set(draft.origin || []);
        acknowledged = draft.acknowledged || {};
        selectedSchool = String(draft.selectedSchool || '');
        selectedSchoolName = String(draft.selectedSchoolName || '');
        selectedEntries = draft.selectedEntries || [];
        entryDrafts = draft.entryDrafts || {};
        selectionInitialized = draft.selectionInitialized === true;
        warnings = draft.warnings || [];
        legacySnapshot = draft.legacySnapshot || null;
        legacyReviewed = draft.legacyReviewed !== false;
      } else {
        rawPrevious = localStorage.getItem(oldDraftKey);
        const old = JSON.parse(rawPrevious || 'null');
        if (old) migrate(old);
      }
    } catch (error) {
      legacySnapshot = {
        rawCurrent,
        rawPrevious
      };
      legacyReviewed = false;
      warnings.push(`No se pudo recuperar el borrador: ${error.message}`);
    }
    for (const key of [...marked]) if (!mnc.has(key)) marked.delete(key);
  }
  function updateSchoolOptions() {
    school.replaceChildren(new Option('Seleccionar institución', ''));
    for (const item of institutions()) school.append(new Option(item.name || 'Institución sin nombre', String(item.id)));
    if (!institution() && selectedSchoolName) {
      const restored = institutions().find(item => item.name === selectedSchoolName);
      if (restored) selectedSchool = String(restored.id);
    }
    if (!selectionInitialized) {
      // Conservamos los bloques de borradores anteriores; un trámite nuevo exige selección explícita.
      selectedEntries = (institution()?.entries || []).map(entryId).filter((id, index) => rowUsed(index));
      selectionInitialized = true;
    }
    selectedSchoolName = institution()?.name || selectedSchoolName;
    school.value = selectedSchool;
    renderEntries();
  }
  function updateZoom() {
    if (!viewport.clientWidth) return;
    if (fit) zoom = Math.min(1, (viewport.clientWidth - 24) / (width * 96 / 72));
    zoom = Math.max(.25, Math.min(2, zoom));
    form.style.transform = `scale(${zoom})`;
    size.style.width = `${width * 96 / 72 * zoom}px`;
    size.style.height = `${(height * 2 + 18) * 96 / 72 * zoom}px`;
    section.querySelector('[data-bd02-zoom-value]').textContent = `${Math.round(zoom * 100)}%`;
  }
  async function font() {
    if (!fontPromise) fontPromise = (async () => {
      const document = await PDFLib.PDFDocument.create();
      measuringFonts.sans = await document.embedFont(PDFLib.StandardFonts.Helvetica);
      measuringFonts.serif = await document.embedFont(PDFLib.StandardFonts.TimesRoman);
      return measuringFonts;
    })();
    return fontPromise;
  }
  const guidedReview = adcGuidedValidation.create({root:section, save:changed, collect:() => {
    const groups = new Map();
    for (const issue of issues().filter(issue => issue.missing)) {
      const field = fields.find(field => field.key === issue.key);
      const group = field?.date;
      const key = group || issue.key;
      if (!groups.has(key)) groups.set(key,{key,label:group ? dates.find(date=>date.key===group).label : field?.label || choices.find(choice=>choice.key===key)?.label || issue.message,controls:[]});
      const input=controls.get(issue.key) || radios.get(issue.key)?.[0];
      if(input)groups.get(key).controls.push(input);
    }
    return [...groups.values()];
  }});
  function validate(allowMissing = false) {
    readControls();
    refresh();
    const all = issues();
    const errors = allowMissing ? all.filter(error => !error.missing) : all;
    if (!errors.length) return true;
    status.textContent = errors[0].message;
    const control = controls.get(errors[0].key) || radios.get(errors[0].key)?.[0];
    control?.focus();
    control?.scrollIntoView({
      block: 'center',
      inline: 'nearest'
    });
    control?.reportValidity();
    return false;
  }
  async function completedPdf() {
    if (!pdfBytes) {
      const response = await fetch('assets/formularios/BD-02.pdf');
      if (!response.ok) throw Error('No se pudo cargar el PDF adjunto.');
      pdfBytes = await response.arrayBuffer();
    }
    const pdf = await PDFLib.PDFDocument.load(pdfBytes.slice(0));
    const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    const fonts = {sans: font, serif: await pdf.embedFont(PDFLib.StandardFonts.TimesRoman)};
    const pdfForm = pdf.getForm();
    const pdfPages = pdf.getPages();
    const originalAnnotations = pdfPages.map(page => page.node.Annots()?.asArray().slice() || []);
    for (const field of fields) {
      if (field.row != null && !rowUsed(field.row)) continue;
      const input = pdfForm.createTextField(`BD02.${field.key}`);
      input.setText(marked.has(field.key) ? '' : pdfText(displayed(field, values[field.key])));
      input.addToPage(pdfPages[field.page], {
        x: field.x,
        y: height - field.y - field.height,
        width: field.width,
        height: field.height,
        borderWidth: 0,
        borderColor: undefined,
        backgroundColor: undefined,
        font: fonts[field.fontFamily]
      });
      input.setFontSize(textLayout(values[field.key] || '', field).size);
      if (field.align === 'center') input.setAlignment(PDFLib.TextAlignment.Center);
      input.updateAppearances(fonts[field.fontFamily]);
    }
    for (const choice of choices.filter(field => field.row == null || rowUsed(field.row))) for (const [value, x, y] of choice.options) {
      const check = pdfForm.createCheckBox(`BD02.${choice.key}.${value}`);
      check.addToPage(pdfPages[choice.page], {
        x: x + 1,
        y: height - y - 10.52,
        width: 9.52,
        height: 9.52,
        borderWidth: 0,
        borderColor: undefined,
        backgroundColor: undefined
      });
      if (values[choice.key] === value) check.check();
    }
    pdfForm.updateFieldAppearances(font);
    pdfForm.flatten();
    // Flatten elimina los campos. Conservamos sólo las anotaciones originales
    // para evitar referencias a widgets retirados en el PDF final.
    pdfPages.forEach((page, index) => {
      const key = PDFLib.PDFName.of('Annots');
      if (originalAnnotations[index].length) page.node.set(key, pdf.context.obj(originalAnnotations[index]));else page.node.delete(key);
    });
    pdf.catalog.delete(PDFLib.PDFName.of('AcroForm'));
    for (const field of fields) if (marked.has(field.key) && (field.row == null || rowUsed(field.row))) adcMnc.drawPdf(pdfPages[field.page], field);
    rows.forEach((row, index) => {
      if (rowUsed(index)) return;
      const box = unusedBox(row);
      const page = pdfPages[row.page];
      const left = box.x, right = box.x + box.width, top = height - box.y, bottom = top - box.height;
      for (const [start, end] of [[{x:left,y:top},{x:right,y:bottom}],[{x:right,y:top},{x:left,y:bottom}]]) page.drawLine({start,end,color:PDFLib.rgb(0,0,0),thickness:72/25.4});
    });
    return pdf.save({
      useObjectStreams: false
    });
  }
  async function action(action, reviewed=false) {
    if (!window.PDFLib) {
      status.textContent = 'Revisá la conexión para cargar la biblioteca PDF.';
      return;
    }
    try {await font();} catch(error) {status.textContent=error.message;return;}
    if (!validate(true) || (!reviewed&&!await guidedReview.review({action})) || !validate(true)) return;
    const currentRevision = revision;
    const buttons = [...section.querySelectorAll('[data-bd02-action]')];
    buttons.forEach(button => button.disabled = true);
    status.textContent = 'Preparando el PDF…';
    try {
      await font();
      if (!validate(true)) return;
      const bytes = await completedPdf();
      if (currentRevision !== revision) {
        status.textContent = 'Los datos cambiaron. Volvé a generar el PDF.';
        return;
      }
      const url = URL.createObjectURL(new Blob([bytes], {
        type: 'application/pdf'
      }));
      if (action === 'preview') {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = url;
        const frame = document.createElement('iframe');
        frame.title = 'Vista preliminar de BD-02 completado';
        frame.src = url;
        preview.replaceChildren(frame);
        preview.hidden = false;
        preview.scrollIntoView({
          block: 'start'
        });
        status.textContent = 'Vista preliminar lista.';
      } else if (action === 'download') {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'BD-02-completado.pdf';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        status.textContent = 'PDF descargado con las dos páginas de la plantilla adjunta.';
      } else {
        const frame = document.createElement('iframe');
        frame.className = 'adc-bd02-print-frame';
        frame.title = 'BD-02 preparado para imprimir';
        frame.addEventListener('load', () => {
          try {
            frame.contentWindow.focus();
            frame.contentWindow.print();
            status.textContent = 'Se abrió el diálogo de impresión.';
          } catch (error) {
            status.textContent = `No se pudo imprimir: ${error.message}`;
          }
        }, {
          once: true
        });
        frame.src = url;
        document.body.append(frame);
        setTimeout(() => {
          frame.remove();
          URL.revokeObjectURL(url);
        }, 60000);
      }
    } catch (error) {
      fontPromise = null;
      status.textContent = `No se pudo generar el PDF: ${error.message}`;
    } finally {
      buttons.forEach(button => button.disabled = false);
    }
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('focusout', event => {
    const field = fields.find(field => field.key === event.target.dataset.bd02Field);
    if (field?.academicPart) event.target.value = displayed(field, values[field.key]);
  });
  form.addEventListener('input', event => {
    const key = event.target.dataset.bd02Field || event.target.dataset.bd02Choice;
    if (!key) return;
    touched.add(key);
    origin.delete(key);
    const field = [...fields, ...choices].find(field => field.key === key);
    acknowledged[key] = profileValue(field);
    changed();
    if (event.target.maxLength === 1 && event.target.value && key.includes('.codigoMotivo.')) {
      const index = Number(key.split('.').at(-1));
      controls.get(key.replace(/\d$/, String(index + 1)))?.focus();
    }
  });
  form.addEventListener('paste', event => {
    const key = event.target.dataset.bd02Field;
    if (!key?.includes('.codigoMotivo.')) return;
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').trim();
    const index = Number(key.split('.').at(-1));
    if (!/^\d+$/.test(pasted) || pasted.length > 5 - index) {
      status.textContent = 'El código debe contener números y caber en los cinco casilleros. Revisá el texto que querés pegar.';
      return;
    }
    for (const [offset, value] of [...pasted].entries()) {
      const target = key.replace(/\d$/, String(index + offset));
      controls.get(target).value = value;
      touched.add(target);
    }
    changed();
    controls.get(key.replace(/\d$/, String(Math.min(4, index + pasted.length))))?.focus();
  });
  form.addEventListener('keydown', event => {
    const key = event.target.dataset.bd02Field;
    if (!key?.includes('.codigoMotivo.')) return;
    const index = Number(key.split('.').at(-1));
    if (event.key === 'Backspace' && !event.target.value || event.key === 'ArrowLeft') controls.get(key.replace(/\d$/, String(index - 1)))?.focus();
    if (event.key === 'ArrowRight') controls.get(key.replace(/\d$/, String(index + 1)))?.focus();
  });
  form.addEventListener('change', event => {
    if (event.target.dataset.bd02Choice) changed();
  });
  school.addEventListener('change', () => {
    readControls();
    stashEntries();
    selectedSchool = school.value;
    selectedSchoolName = institution()?.name || '';
    selectedEntries = [];
    restoreEntries();
    for (const field of fields.filter(field => field.institution)) {
      values[field.key] = ''; touched.delete(field.key); origin.delete(field.key); marked.delete(field.key);
    }
    renderEntries();
    syncProfile();
  });
  section.querySelector('[data-bd02-back]').addEventListener('click', () => tab('tramites'));
  section.querySelector('[data-bd02-pending]').addEventListener('click', async () => {if(await guidedReview.review({guided:true}))action('preview',true);});
  section.querySelectorAll('[data-bd02-action]').forEach(button => button.addEventListener('click', () => action(button.dataset.bd02Action)));
  section.querySelectorAll('[data-bd02-zoom]').forEach(button => button.addEventListener('click', () => {
    fit = button.dataset.bd02Zoom === 'fit';
    if (!fit) zoom += button.dataset.bd02Zoom === 'in' ? .15 : -.15;
    updateZoom();
  }));
  new ResizeObserver(updateZoom).observe(viewport);
  document.addEventListener('input', event => {
    if (initialized && event.target.closest('#profile')) syncProfile();
  });
  document.addEventListener('change', event => {
    if (initialized && event.target.closest('#profile')) syncProfile();
  });
  window.adcBD02Open = () => {
    if (!initialized) {
      load();
      initialized = true;
    }
    updateSchoolOptions();
    syncProfile();
    tab('bd02');
    updateZoom();
    section.querySelector('h2').focus();
    if (window.PDFLib) font().then(refresh).catch(error => {
      status.textContent = error.message;
    });
  };
})();
