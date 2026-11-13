(() => {
  const forms = window.adcOfficialFormsData;
  if (!Array.isArray(forms)) throw new Error('No se cargó el catálogo de formularios oficiales.');
  const formById = new Map(forms.map(form => [form.id,form]));
  const sourcePage = 'https://dirdocumentacion.educacion.chaco.gob.ar/formularios-planillas/';
  const lineStart = adcMnc.geometry.start;
  const lineEnd = adcMnc.geometry.end;
  const pdfLineThickness = adcMnc.geometry.thickness;
  const section = document.createElement('section');
  section.id = 'adcOfficialForm';
  section.className = 'hide adc-official-form';
  section.innerHTML = `
    <button type="button" class="alt" data-adc-official-back>← Volver a Mis trámites</button>
    <h2 tabindex="-1" data-adc-official-title></h2>
    <p class="small" data-adc-official-description></p>
    <div class="small" data-adc-official-notices></div>
    <div class="warning adc-official-privacy" data-adc-official-privacy hidden></div>
    <div class="toolbar adc-official-actions">
      <button type="button" data-adc-official-action="preview">Ver Vista Preliminar</button>
      <button type="button" data-adc-official-action="download">Descargar PDF Completado</button>
      <button type="button" data-adc-official-action="print">Imprimir</button>
    </div>
    <p class="small" data-adc-official-mnc-help>Usá la X para marcar «No corresponde» en los campos opcionales vacíos. Verificá el documento antes de presentarlo.</p>
    <p class="small" data-adc-official-status role="status" aria-live="polite"></p>
    <div data-adc-profile-conflicts aria-live="polite"></div>
    <div class="adc-document-tools" aria-label="Controles del documento">
      <button type="button" class="alt" data-adc-zoom="out" aria-label="Reducir zoom">−</button>
      <output data-adc-zoom-value aria-live="polite">100%</output>
      <button type="button" class="alt" data-adc-zoom="in" aria-label="Aumentar zoom">+</button>
      <button type="button" class="alt" data-adc-zoom="fit">Ajustar al ancho</button>
      <button type="button" class="alt" data-adc-document-pending>Revisar datos pendientes</button>
    </div>
    <div class="adc-document-viewport" tabindex="0" role="region" aria-label="Documento editable">
      <div class="adc-document-size"><form data-adc-official-sheet autocomplete="off"></form></div>
    </div>
    <div class="toolbar adc-official-actions" aria-label="Acciones del formulario">
      <button type="button" data-adc-official-action="preview">Ver Vista Preliminar</button>
      <button type="button" data-adc-official-action="download">Descargar PDF Completado</button>
      <button type="button" data-adc-official-action="print">Imprimir</button>
    </div>
    <div class="adc-official-preview" data-adc-official-preview hidden></div>
    <a data-adc-official-source target="_blank" rel="noopener">Consultar fuente oficial del formulario</a>`;
  const footer = document.querySelector('.wrap > footer');
  if (footer) footer.before(section);
  else document.querySelector('.wrap').append(section);
  const title = section.querySelector('[data-adc-official-title]');
  const description = section.querySelector('[data-adc-official-description]');
  const privacy = section.querySelector('[data-adc-official-privacy]');
  const status = section.querySelector('[data-adc-official-status]');
  const sheet = section.querySelector('[data-adc-official-sheet]');
  const preview = section.querySelector('[data-adc-official-preview]');
  const sourceLink = section.querySelector('[data-adc-official-source]');
  let activeForm = null;
  let returnFocus = null;
  let values = {};
  let marked = new Set();
  let profileOrigin = new Set();
  let touched = new Set();
  let rowCounts = {};
  let pdfUrl = null;
  let revision = 0;
  let draftWarnings = [];
  let profileAcknowledged = {};
  let zoom = 1;
  let fitWidth = true;
  let documentLayout = null;
  let layoutFonts = null;
  let fontsPromise = null;
  let layoutFrame = null;
  const pointToPixel = 96/72;
  const paperGap = 18;
  const preparedDocument = () => window.adcPreparedPdfForms?.[activeForm?.id];
  const viewport = section.querySelector('.adc-document-viewport');
  const documentSize = section.querySelector('.adc-document-size');

  function matches(condition) {
    if (!condition) return true;
    return condition.values.includes(String(values[condition.key] || ''));
  }
  function available(field,path) {
    return matches(field.when) && (!field.legacyOnly || !isEmptyValue(values[path]) || marked.has(path));
  }
  function invalidatePreview() {
    revision++;
    if (!preview.hidden) status.textContent = 'Los datos cambiaron. Generá nuevamente la vista preliminar.';
    preview.replaceChildren();
    preview.hidden = true;
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    pdfUrl = null;
  }

  function normalized(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  }
  function profileValue(field) {
    return field.profileId ? document.getElementById(field.profileId)?.value || '' : '';
  }
  function presented(field, value) {
    if (field.academicPart === 'course') return window.adcAcademic.course(value);
    return field.academicPart ? window.adcAcademic.part(value,field.academicPart,field.academicFormat) : value;
  }
  function storageKey(form) {
    return `adc-official-form-${form.id}-draft-v1`;
  }
  function save() {
    if (!activeForm || preparedDocument()) return;
    try {
      localStorage.setItem(storageKey(activeForm),JSON.stringify({
        schemaVersion:2,values,marked:[...marked],profileOrigin:[...profileOrigin],touched:[...touched],rowCounts,draftWarnings,profileAcknowledged
      }));
    } catch (error) {
      status.textContent = `No se pudo guardar el borrador en este dispositivo. ${error.message}`;
    }
  }
  function baseFieldPath(repeatKey,index,fieldKey) {
    return `${repeatKey}.${index}.${fieldKey}`;
  }
  function rowCount(repeatField) {
    const min = Math.max(0,Number(repeatField.minRows) || 0);
    const initial = Math.max(min,Number(repeatField.initialRows ?? min));
    const max = Math.max(min,Number(repeatField.maxRows) || 50);
    const saved = Number(rowCounts[repeatField.key]);
    return Math.max(min,Math.min(max,Number.isFinite(saved) && saved >= 0 ? saved : initial));
  }
  function fieldsFor(form=activeForm) {
    if (!form) return [];
    const result = [];
    for (const group of form.sections) {
      for (const field of group.fields) {
        if (!available(field,field.key)) continue;
        if (field.type !== 'repeat') {
          result.push({...field,path:field.key});
          continue;
        }
        for (let index=0; index<rowCount(field); index++) {
          for (const child of field.fields) {
            const path = baseFieldPath(field.key,index,child.key);
            if (available(child,path)) result.push({...child,path,repeatKey:field.key,repeatLabel:field.label,repeatIndex:index});
          }
        }
      }
    }
    return result;
  }
  function allControls(path) {
    return [...sheet.querySelectorAll('[data-adc-field]')].filter(node => node.dataset.adcField === path);
  }
  function fieldControl(path) {
    return allControls(path).find(node => !['radio','checkbox'].includes(node.type));
  }
  function updateMnc(path,field) {
    const input = fieldControl(path);
    if (!input) return;
    const isMarked = marked.has(path);
    adcMnc.apply(input,isMarked,{allowRequired:field.allowMnc === true});
    input.required = Boolean((field.required || (field.requiredWhen && matches(field.requiredWhen))) && !isMarked);
    if (isMarked) input.setCustomValidity('');
    for (const button of [...sheet.querySelectorAll('[data-adc-mnc]')].filter(node => node.dataset.adcMnc === path)) {
      button.hidden = !isMarked && Boolean(input.value.trim());
      button.setAttribute('aria-pressed',String(isMarked));
      button.setAttribute('aria-label',isMarked
        ? `Quitar el tachado de ${field.label.toLowerCase()} y volver a editar`
        : `Tachar ${field.label.toLowerCase()} si no corresponde`);
      button.classList.toggle('is-marked',isMarked);
    }
    for (const line of [...sheet.querySelectorAll('[data-adc-mnc-line]')].filter(node => node.dataset.adcMncLine === path)) {
      line.hidden = !isMarked;
    }
  }
  const addTooltip = adcMnc.help;
  function renderSimpleField(field,path,parent) {
    const wrapper = document.createElement('div');
    wrapper.className = `adc-official-field${field.wide ? ' wide' : ''}`;
    wrapper.dataset.adcFieldWrapper = path;
    const id = `adcOfficial${activeForm.id}${path}`.replace(/[^a-zA-Z0-9_-]/g,'_');
    const label = document.createElement('label');
    label.htmlFor = id;
    const required = field.required || (field.requiredWhen && matches(field.requiredWhen));
    label.textContent = `${field.label}${required ? ' *' : ''}`;
    wrapper.append(label);
    if (field.type === 'choices' || field.type === 'checks') {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'adc-official-options';
      const legend = document.createElement('legend');
      legend.textContent = `${field.label}${required ? ' *' : ''}`;
      fieldset.append(legend);
      const selectedValues = Array.isArray(values[path]) ? values[path] : [values[path]].filter(Boolean);
      for (const option of field.options || []) {
        const optionLabel = document.createElement('label');
        const input = document.createElement('input');
        input.type = field.type === 'checks' ? 'checkbox' : 'radio';
        input.name = field.type === 'checks' ? `${id}-${option}` : id;
        input.value = option;
        input.dataset.adcField = path;
        input.required = Boolean(field.required && field.type === 'choices');
        input.checked = selectedValues.includes(option);
        const text = document.createElement('span');
        text.textContent = option;
        optionLabel.append(input,text);
        fieldset.append(optionLabel);
      }
      wrapper.replaceChildren(fieldset);
      parent.append(wrapper);
      return;
    }
    const control = document.createElement('div');
    control.className = 'adc-official-control';
    const input = field.type === 'textarea' ? document.createElement('textarea') : document.createElement(field.type === 'select' ? 'select' : 'input');
    input.id = id;
    input.dataset.adcField = path;
    input.required = Boolean(required);
    input.setAttribute('aria-label',field.label);
    if (field.type === 'select') {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Seleccioná una opción';
      input.append(placeholder);
      for (const option of field.options || []) {
        const item = document.createElement('option');
        item.value = option;
        item.textContent = option;
        input.append(item);
      }
      if (values[path] && !(field.options || []).includes(values[path])) {
        const legacy = document.createElement('option');
        legacy.value = values[path];
        legacy.textContent = `${values[path]} (borrador anterior: revisá la opción)`;
        input.append(legacy);
      }
    } else {
      if (field.type !== 'textarea') {
        input.type = field.type === 'email' || field.type === 'tel' || field.type === 'number' || field.type === 'date'
          ? field.type : 'text';
      }
      if (field.inputmode) input.inputMode = field.inputmode;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.maxLength) input.maxLength = field.maxLength;
    }
    input.value = String(presented(field,values[path]) ?? '');
    if (field.academicPart) input.addEventListener('blur', () => {
      input.value = String(presented(field,values[path]) ?? '');
    });
    control.append(input);
    if (field.profileId) {
      const origin = document.createElement('span');
      origin.className = 'adc-document-origin';
      origin.textContent = profileOrigin.has(path) ? 'Dato del Perfil Docente' : 'Dato editable del formulario';
      input.title = origin.textContent;
      control.append(origin);
    }
    const supportsMnc = adcMnc.eligible(field);
    if (supportsMnc && (!field.required || field.allowMnc)) {
      control.classList.add('has-mnc');
      const button = document.createElement('button');
      const tooltip = document.createElement('span');
      const line = document.createElement('span');
      button.type = 'button';
      button.className = 'adc-official-mnc';
      button.dataset.adcMnc = path;
      button.setAttribute('aria-describedby',`${id}-tooltip`);
      tooltip.id = `${id}-tooltip`;
      tooltip.className = 'adc-official-mnc-tooltip';
      tooltip.setAttribute('role','tooltip');
      tooltip.textContent = 'Tachar si no corresponde';
      tooltip.hidden = true;
      button.append(document.createTextNode('X'),tooltip);
      line.className = 'adc-official-mnc-line';
      line.dataset.adcMncLine = path;
      line.setAttribute('aria-hidden','true');
      line.hidden = true;
      addTooltip(button,tooltip);
      control.append(button,line);
    }
    wrapper.append(control);
    if (field.legacyOnly) {
      const note = document.createElement('small');
      note.textContent = 'Dato conservado del borrador anterior. Complemento ADC pendiente de revisión.';
      wrapper.append(note);
    }
    parent.append(wrapper);
  }
  function swapRows(field,first,second) {
    for (const child of field.fields) {
      const a = baseFieldPath(field.key,first,child.key);
      const b = baseFieldPath(field.key,second,child.key);
      [values[a],values[b]] = [values[b],values[a]];
      [profileAcknowledged[a],profileAcknowledged[b]] = [profileAcknowledged[b],profileAcknowledged[a]];
      for (const set of [marked,touched,profileOrigin]) {
        const hasA = set.has(a),hasB = set.has(b);
        set.delete(a); set.delete(b);
        if (hasA) set.add(b);
        if (hasB) set.add(a);
      }
    }
    invalidatePreview();
    renderFields();
    save();
  }
  function renderRepeat(field,parent) {
    const group = document.createElement('div');
    group.className = 'adc-official-repeat wide';
    const heading = document.createElement('div');
    heading.className = 'adc-official-repeat-heading';
    const label = document.createElement('h4');
    label.textContent = field.label;
    heading.append(label);
    group.append(heading);
    const count = rowCount(field);
    for (let index=0; index<count; index++) {
      const row = document.createElement('fieldset');
      row.className = 'adc-official-repeat-row';
      row.dataset.adcRepeatRow = `${field.key}.${index}`;
      const legend = document.createElement('legend');
      legend.textContent = `${field.label} ${index+1}`;
      row.append(legend);
      const fields = document.createElement('div');
      fields.className = 'fields';
      for (const child of field.fields) {
        const path = baseFieldPath(field.key,index,child.key);
        if (available(child,path)) renderSimpleField(child,path,fields);
      }
      row.append(fields);
      const order = document.createElement('div');
      order.className = 'adc-official-row-actions';
      for (const [label,offset] of [['Subir',-1],['Bajar',1]]) {
        const move = document.createElement('button');
        move.type = 'button'; move.className = 'alt'; move.textContent = label;
        move.disabled = index+offset < 0 || index+offset >= count;
        move.setAttribute('aria-label',`${label} ${field.label.toLowerCase()} ${index+1}`);
        move.addEventListener('click',() => swapRows(field,index,index+offset));
        order.append(move);
      }
      row.append(order);
      if (count > Number(field.minRows || 0)) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'alt';
        remove.textContent = 'Quitar';
        remove.setAttribute('aria-label',`Quitar ${field.label.toLowerCase()} ${index+1}`);
        remove.addEventListener('click',() => {
          for (let rowIndex=index; rowIndex<count-1; rowIndex++) {
            for (const child of field.fields) {
              const from = baseFieldPath(field.key,rowIndex+1,child.key);
              const to = baseFieldPath(field.key,rowIndex,child.key);
              values[to] = values[from];
              profileAcknowledged[to] = profileAcknowledged[from];
              delete values[from];
              delete profileAcknowledged[from];
              for (const set of [marked,touched,profileOrigin]) {
                if (set.has(from)) set.add(to);
                else set.delete(to);
                set.delete(from);
              }
            }
          }
          for (const child of field.fields) {
            const lastPath = baseFieldPath(field.key,count-1,child.key);
            delete values[lastPath];
            delete profileAcknowledged[lastPath];
            marked.delete(lastPath);
            touched.delete(lastPath);
            profileOrigin.delete(lastPath);
          }
          rowCounts[field.key] = count-1;
          invalidatePreview();
          renderFields();
          save();
        });
        order.append(remove);
      }
      group.append(row);
    }
    const max = Math.max(0,Number(field.maxRows) || 50);
    if (count < max) {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'alt';
      add.dataset.adcRepeatAdd = field.key;
      add.textContent = field.addLabel || `Agregar ${field.label.toLowerCase()}`;
      add.addEventListener('click',() => {
        rowCounts[field.key] = count+1;
        invalidatePreview();
        renderFields();
        save();
      });
      group.append(add);
    }
    parent.append(group);
  }
  function renderFields() {
    if (!activeForm) return;
    sheet.replaceChildren();
    if (preparedDocument()) {
      layoutDocument();
      section.querySelector('[data-adc-profile-conflicts]').replaceChildren();
      return;
    }
    for (const group of activeForm.sections) {
      if (!group.fields.some(field => available(field,field.key))) continue;
      const sectionFields = document.createElement('section');
      sectionFields.className = 'adc-official-section';
      const heading = document.createElement('h3');
      heading.textContent = group.title;
      sectionFields.append(heading);
      if (group.notice) {
        const note = document.createElement('p');
        note.className = 'small'; note.textContent = group.notice;
        sectionFields.append(note);
      }
      const grid = document.createElement('div');
      grid.className = 'fields';
      for (const field of group.fields) {
        if (!available(field,field.key)) continue;
        if (field.type === 'repeat') renderRepeat(field,grid);
        else renderSimpleField(field,field.key,grid);
      }
      sectionFields.append(grid);
      sheet.append(sectionFields);
    }
    for (const field of formFields()) updateMnc(field.path,field);
    layoutDocument();
    renderProfileConflicts();
  }
  function formFields() {
    return fieldsFor(activeForm);
  }
  function requestLayout() {
    if (layoutFrame !== null) cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {layoutFrame=null;layoutDocument();});
  }
  function updateZoom() {
    if (!documentLayout || !viewport.clientWidth) return;
    if (fitWidth) zoom = Math.min(1,(viewport.clientWidth-24)/(documentLayout.width*pointToPixel));
    zoom = Math.max(.25,Math.min(2,zoom));
    sheet.style.transform = `scale(${zoom})`;
    documentSize.style.width = `${documentLayout.width*pointToPixel*zoom}px`;
    documentSize.style.height = `${sheet.offsetHeight*zoom}px`;
    section.querySelector('[data-adc-zoom-value]').textContent = `${Math.round(zoom*100)}%`;
  }
  function place(element,box,height=box.height) {
    const top = (documentLayout.height-box.y-height+box.page*(documentLayout.height+paperGap))*pointToPixel;
    Object.assign(element.style,{left:`${box.x*pointToPixel}px`,top:`${top}px`,width:`${(box.width || 511.28)*pointToPixel}px`,height:`${height*pointToPixel}px`});
  }
  function updatePending() {
    const pending = formFields().filter(field => {
      const message = validationMessage(field);
      const inputs = allControls(field.path);
      inputs.forEach(input => input.setCustomValidity(message));
      return inputs.some(input => !input.disabled && !input.validity.valid);
    });
    const button = section.querySelector('[data-adc-document-pending]');
    button.hidden = pending.length === 0;
    button.textContent = `Revisar datos pendientes (${pending.length})`;
  }
  function layoutDocument() {
    if (!activeForm) return;
    if (layoutFrame !== null) { cancelAnimationFrame(layoutFrame); layoutFrame=null; }
    const prepared = preparedDocument();
    if (prepared) {
      documentLayout = {width: prepared.pages[0].width, height: prepared.pages[0].height};
      let top = 0;
      sheet.replaceChildren();
      for (const [index, page] of prepared.pages.entries()) {
        const image = document.createElement('img');
        image.className = 'adc-document-page adc-prepared-pdf-page';
        image.dataset.adcPage = String(index + 1);
        image.src = page.image;
        image.alt = `${activeForm.code}, página ${index + 1} de ${prepared.pages.length}. Documento preparado sin campos editables.`;
        Object.assign(image.style, {top: `${top * pointToPixel}px`, width: `${page.width * pointToPixel}px`, height: `${page.height * pointToPixel}px`});
        image.addEventListener('error', () => {status.textContent = 'No se pudo mostrar la imagen. Podés abrir el PDF original desde Vista preliminar.';});
        sheet.append(image);
        top += page.height + paperGap;
      }
      Object.assign(sheet.style, {width: `${documentLayout.width * pointToPixel}px`, height: `${(top - paperGap) * pointToPixel}px`});
      section.querySelector('[data-adc-document-pending]').hidden = true;
      updateZoom();
      return;
    }
    documentLayout = createLayout();
    const previousPages = new Map([...sheet.querySelectorAll('.adc-document-page')].map(canvas => [Number(canvas.dataset.adcPage),canvas]));
    sheet.querySelectorAll('.adc-document-continuation').forEach(element => element.remove());
    const totalHeight = documentLayout.pages.length*(documentLayout.height+paperGap)-paperGap;
    Object.assign(sheet.style,{width:`${documentLayout.width*pointToPixel}px`,height:`${totalHeight*pointToPixel}px`});
    documentLayout.pages.forEach((commands,index) => {
      const ratio = Math.min(2,Math.max(1.5,window.devicePixelRatio || 1));
      const key = `${ratio}:${JSON.stringify(commands)}`;
      const previous = previousPages.get(index+1);
      if (previous?.adcCommandsKey === key) return;
      previous?.remove();
      const canvas = document.createElement('canvas');
      canvas.adcCommandsKey = key;
      canvas.className = 'adc-document-page';
      canvas.setAttribute('aria-hidden','true');
      canvas.dataset.adcPage = String(index+1);
      canvas.width = Math.ceil(documentLayout.width*pointToPixel*ratio);
      canvas.height = Math.ceil(documentLayout.height*pointToPixel*ratio);
      Object.assign(canvas.style,{top:`${index*(documentLayout.height+paperGap)*pointToPixel}px`,width:`${documentLayout.width*pointToPixel}px`,height:`${documentLayout.height*pointToPixel}px`});
      const context = canvas.getContext('2d');
      context.scale(pointToPixel*ratio,pointToPixel*ratio);
      const color = rgb => `rgb(${Math.round(rgb.red*255)},${Math.round(rgb.green*255)},${Math.round(rgb.blue*255)})`;
      for (const command of commands) {
        if (command.kind === 'text') {
          if (command.optionText) continue;
          context.font = `${command.font.name === 'bold' ? 'bold' : 'normal'} ${command.size}px Arial`;
          context.fillStyle = color(command.color);
          context.fillText(command.text,command.x,documentLayout.height-command.y);
        }
        if (command.kind === 'rectangle') {
          const top = documentLayout.height-command.y-command.height;
          if (command.color) {context.fillStyle=color(command.color);context.fillRect(command.x,top,command.width,command.height);}
          if (command.borderColor) {context.strokeStyle=color(command.borderColor);context.lineWidth=command.borderWidth;context.strokeRect(command.x,top,command.width,command.height);}
        }
        if (command.kind === 'line') {
          context.strokeStyle=color(command.color);context.lineWidth=command.thickness;
          context.beginPath();context.moveTo(command.start.x,documentLayout.height-command.start.y);context.lineTo(command.end.x,documentLayout.height-command.end.y);context.stroke();
        }
      }
      sheet.prepend(canvas);
    });
    for (const [number,canvas] of previousPages) if (number > documentLayout.pages.length) canvas.remove();
    for (const box of documentLayout.fields) {
      let input = fieldControl(box.field.path);
      if (box.continuation) {
        const continuation = document.createElement('button');
        continuation.type = 'button'; continuation.className = 'adc-document-continuation';
        continuation.setAttribute('aria-label',`Editar continuación de ${box.field.label}`);
        continuation.title = 'Editar este campo';
        continuation.addEventListener('click',() => {input?.focus();input?.scrollIntoView({block:'center',inline:'nearest'});});
        place(continuation,box);sheet.append(continuation);continue;
      }
      const wrapper = [...sheet.querySelectorAll('[data-adc-field-wrapper]')].find(element => element.dataset.adcFieldWrapper === box.field.path);
      if (!wrapper) continue;
      wrapper.classList.add('adc-document-field');
      place(wrapper,box);
      if (box.options) {
        const labels = wrapper.querySelectorAll('.adc-official-options label');
        box.options.forEach((option,index) => {
          const label = labels[index];
          Object.assign(label.style,{top:`${(box.y+box.height-option.y-9)*pointToPixel}px`,left:`${8*pointToPixel}px`,width:`${(box.width-16)*pointToPixel}px`,height:`${option.lines.length*12*pointToPixel}px`});
          label.querySelector('span').textContent = option.lines.join('\n');
        });
      } else if (input) {
        const multiline = box.field.type === 'textarea' || (box.field.type === 'text' && box.lines.length > 1);
        if ((input.tagName === 'TEXTAREA') !== multiline && ['text','textarea'].includes(box.field.type)) {
          const replacement = document.createElement(multiline ? 'textarea' : 'input');
          for (const attribute of input.attributes) replacement.setAttribute(attribute.name,attribute.value);
          if (!multiline) replacement.type = 'text';
          replacement.value = input.value;
          const focused = document.activeElement === input;
          const selection = [input.selectionStart,input.selectionEnd];
          input.replaceWith(replacement);input=replacement;
          if (focused) {input.focus({preventScroll:true});input.setSelectionRange(...selection);}
        }
        const origin = wrapper.querySelector('.adc-document-origin');
        if (origin) {
          origin.textContent = profileOrigin.has(box.field.path) ? 'Dato del Perfil Docente' : 'Dato editable del formulario';
          input.title = origin.textContent;
        }
      }
    }
    for (const action of documentLayout.actions) {
      const element = action.row
        ? [...sheet.querySelectorAll('[data-adc-repeat-row]')].find(row => row.dataset.adcRepeatRow === action.row)?.querySelector('.adc-official-row-actions')
        : [...sheet.querySelectorAll('[data-adc-repeat-add]')].find(button => button.dataset.adcRepeatAdd === action.add);
      if (element) place(element,action,20);
    }
    updatePending();
    updateZoom();
  }
  function renderProfileConflicts() {
    const container = section.querySelector('[data-adc-profile-conflicts]');
    container.replaceChildren();
    for (const field of formFields()) {
      if (!field.profileId || field.repeatIndex > 0 || (!touched.has(field.path) && !marked.has(field.path))) continue;
      const next = profileValue(field);
      if (next === String(values[field.path] || '') || profileAcknowledged[field.path] === next) continue;
      const notice = document.createElement('div');
      notice.className = 'adc-profile-conflict';
      const text = document.createElement('p');
      text.textContent = `${field.label}: el perfil contiene «${next || 'sin dato'}». Revisá la diferencia con el borrador${marked.has(field.path) ? ' marcado No corresponde' : ''}.`;
      notice.append(text);
      for (const useProfile of [false,true]) {
        const button = document.createElement('button');
        button.type = 'button';button.className = 'alt';button.textContent = useProfile ? 'Usar dato del perfil' : 'Conservar en el formulario';
        button.addEventListener('click',() => {
          profileAcknowledged[field.path] = next;
          if (useProfile) {
            values[field.path]=next;marked.delete(field.path);touched.delete(field.path);
            if (next) profileOrigin.add(field.path); else profileOrigin.delete(field.path);
            invalidatePreview();renderFields();
          } else renderProfileConflicts();
          save();
        });
        notice.append(button);
      }
      container.append(notice);
    }
  }
  function readFieldValue(field) {
    const controls = allControls(field.path);
    if (field.type === 'choices') return controls.find(input => input.checked)?.value || '';
    if (field.type === 'checks') return controls.filter(input => input.checked).map(input => input.value);
    const value = controls.find(input => input.type !== 'radio' && input.type !== 'checkbox')?.value || '';
    return field.academicPart && value === presented(field,values[field.path]) ? values[field.path] : value;
  }
  function persistCurrentValues() {
    for (const field of formFields()) values[field.path] = readFieldValue(field);
    save();
  }
  function updateProfileFields(profileId) {
    if (!activeForm || preparedDocument()) return;
    let changed = false;
    for (const field of formFields()) {
      if (field.profileId !== profileId || (field.repeatIndex > 0) || marked.has(field.path) || touched.has(field.path)) continue;
      const next = profileValue(field);
      if (profileOrigin.has(field.path) || !String(values[field.path] || '').trim()) {
        values[field.path] = next;
        if (next) profileOrigin.add(field.path);
        else profileOrigin.delete(field.path);
        changed = true;
      }
    }
    if (changed) {
      invalidatePreview();
      renderFields();
      save();
    }
    renderProfileConflicts();
  }
  function loadDraft(form) {
    values = {};
    marked = new Set();
    profileOrigin = new Set();
    touched = new Set();
    rowCounts = {};
    draftWarnings = [];
    profileAcknowledged = {};
    let draftVersion = 0;
    try {
      const draft = JSON.parse(localStorage.getItem(storageKey(form)) || 'null');
      if (draft && typeof draft === 'object' && !Array.isArray(draft)) {
        values = draft.values && typeof draft.values === 'object' ? draft.values : {};
        marked = new Set(Array.isArray(draft.marked) ? draft.marked : []);
        profileOrigin = new Set(Array.isArray(draft.profileOrigin) ? draft.profileOrigin : []);
        touched = new Set(Array.isArray(draft.touched) ? draft.touched : []);
        rowCounts = draft.rowCounts && typeof draft.rowCounts === 'object' ? draft.rowCounts : {};
        draftWarnings = Array.isArray(draft.draftWarnings) ? draft.draftWarnings : [];
        draftVersion = Number(draft.schemaVersion) || 0;
        profileAcknowledged = draft.profileAcknowledged && typeof draft.profileAcknowledged === 'object' ? draft.profileAcknowledged : {};
      }
    } catch (error) {
      status.textContent = `No se pudo recuperar el borrador guardado. ${error.message}`;
    }
    for (const [from,to] of form.migrations || []) {
      if (draftVersion >= 2) break;
      if (!Object.prototype.hasOwnProperty.call(values,to) && (!isEmptyValue(values[from]) || marked.has(from) || touched.has(from))) {
        values[to] = values[from] ?? '';
        if (marked.has(from)) marked.add(to);
        if (touched.has(from)) touched.add(to);
        if (profileOrigin.has(from)) profileOrigin.add(to);
      }
    }
    for (const field of fieldsFor(form)) {
      if (!['choices','checks'].includes(field.type)) continue;
      const previous = Array.isArray(values[field.path]) ? values[field.path] : [values[field.path]].filter(Boolean);
      const unknown = previous.filter(value => !field.options.includes(value));
      if (!unknown.length) continue;
      values[`legacy_${field.key}`] = unknown.join(', ');
      values[field.path] = field.type === 'checks' ? previous.filter(value => field.options.includes(value)) : '';
      const warning = `Revisá ${field.label}: hay opciones del borrador anterior conservadas como complemento ADC.`;
      if (!draftWarnings.includes(warning)) draftWarnings.push(warning);
    }
    for (const field of fieldsFor(form)) {
      if (!adcMnc.eligible(field) && marked.has(field.path)) {
        marked.delete(field.path);
        const warning = `Revisá ${field.label}: el borrador lo marcaba No corresponde y las reglas actuales de este campo ya no admiten MNC.`;
        if (!draftWarnings.includes(warning)) draftWarnings.push(warning);
      }
      if (marked.has(field.path)) values[field.path] = '';
    }
    for (const group of form.sections) {
      for (const field of group.fields.filter(item => item.type === 'repeat')) rowCounts[field.key] = rowCount(field);
    }
    for (const field of fieldsFor(form)) {
      if (!field.profileId || field.repeatIndex > 0 || marked.has(field.path) || touched.has(field.path)) continue;
      if (profileOrigin.has(field.path) || !String(values[field.path] || '').trim()) {
        const value = profileValue(field);
        values[field.path] = value;
        if (value) profileOrigin.add(field.path);
      }
    }
  }
  function markNotApplicable(path) {
    const field = formFields().find(item => item.path === path);
    const input = fieldControl(path);
    if (!field || !input) return;
    if (!adcMnc.eligible(field)) return;
    const next = !marked.has(path);
    if (next && String(input.value || '').trim()) {
      status.textContent = 'Solo se puede tachar un campo vacío.';
      return;
    }
    if (next) {
      marked.add(path);
      touched.add(path);
      profileOrigin.delete(path);
    } else marked.delete(path);
    values[path] = input.value;
    if (field.profileId) profileAcknowledged[path] = profileValue(field);
    invalidatePreview();
    updateMnc(path,field);
    layoutDocument();
    renderProfileConflicts();
    status.textContent = '';
    if (!next) input.focus();
    save();
  }
  function onFieldChange(event) {
    const input = event.target.closest('[data-adc-field]');
    if (!input) return;
    const path = input.dataset.adcField;
    const field = formFields().find(item => item.path === path);
    if (!field) return;
    const controls = allControls(path);
    if (field.type === 'checks') values[path] = controls.filter(item => item.checked).map(item => item.value);
    else if (field.type === 'choices') {
      if (input.checked) values[path] = input.value;
    } else values[path] = input.value;
    touched.add(path);
    profileOrigin.delete(path);
    if (field.profileId) profileAcknowledged[path] = profileValue(field);
    input.setCustomValidity('');
    invalidatePreview();
    updateMnc(path,field);
    save();
    const controlsConditions = activeForm.sections.some(group => group.fields.some(item => item.when?.key === path || item.requiredWhen?.key === path));
    if (controlsConditions) renderFields();
    else {
      requestLayout();
      renderProfileConflicts();
    }
  }
  function isEmptyValue(value) {
    return Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim();
  }
  function validationMessage(field) {
    const value = values[field.path];
    const required = field.required || (field.requiredWhen && matches(field.requiredWhen));
    let message = required && !marked.has(field.path) && isEmptyValue(value) ? `Completá ${field.label.toLowerCase()}.` : '';
    if (field.requiredOptions && field.requiredOptions.some(option => !Array.isArray(value) || !value.includes(option))) message = `Confirmá los requisitos de ${field.label.toLowerCase()}.`;
    if (field.conditionalOption && matches(field.conditionalOption.when) && (!Array.isArray(value) || !value.includes(field.conditionalOption.option))) message = 'Adjuntá el acta de defunción autenticada para esta causal.';
    if (field.requireOneOf) {
      const hasDestination = field.requireOneOf.some(key => !isEmptyValue(values[field.repeatKey ? baseFieldPath(field.repeatKey,field.repeatIndex,key) : key]));
      if (!hasDestination) message = 'Completá la jurisdicción nueva o la jurisdicción alternativa.';
    }
    if (field.type === 'select' && !isEmptyValue(value) && !field.options.includes(value)) message = 'Revisá la opción conservada del borrador anterior.';
    if (field.document && !isEmptyValue(value)) {
      const documentTypeKey = field.documentTypeKey || 'tipoDocumento';
      const documentTypePath = field.repeatKey ? baseFieldPath(field.repeatKey,field.repeatIndex,documentTypeKey) : documentTypeKey;
      const documentType = values[documentTypePath] || 'DNI';
      const pattern = documentType === 'CUIL' ? /^\d{11}$/ : ['LC','LE'].includes(documentType) ? /^\d{1,8}$/ : /^\d{7,8}$/;
      if (!pattern.test(String(value).replace(/[.\s-]/g,''))) message = documentType === 'CUIL' ? 'Ingresá los 11 dígitos del CUIL.' : 'Revisá el número y el tipo de documento.';
    }
    const startPath = field.repeatKey ? baseFieldPath(field.repeatKey,field.repeatIndex,field.after) : field.after;
    if (field.after && value && values[startPath] && value < values[startPath]) message = 'La fecha final debe ser igual o posterior a la fecha inicial.';
    return message;
  }
  function missingField(field) {
    return Boolean(validationMessage(field)) && (isEmptyValue(values[field.path]) || field.requiredOptions || field.conditionalOption || field.requireOneOf);
  }
  const guidedReview = adcGuidedValidation.create({root:section,save:persistCurrentValues,collect:()=>formFields().filter(missingField).map(field=>({key:field.path,label:`${field.label}${field.repeatLabel ? ` — ${field.repeatLabel} ${field.repeatIndex+1}` : ''}`,get controls(){return allControls(field.path);}}))});
  function validate(allowMissing = false) {
    persistCurrentValues();
    let firstInvalid = null;
    for (const field of formFields()) {
      const message = validationMessage(field);
      for (const input of allControls(field.path)) {
        input.setCustomValidity(message);
        if (allowMissing && (missingField(field) || (!message && !input.value && input.validity.valueMissing))) continue;
        if (!input.disabled && !input.checkValidity() && !firstInvalid) firstInvalid = input;
      }
    }
    if (!firstInvalid) return true;
    status.textContent = 'Completá los datos obligatorios indicados antes de continuar.';
    firstInvalid.reportValidity();
    firstInvalid.scrollIntoView({block:'center',behavior:'smooth'});
    return false;
  }
  function pdfString(value) {
    return typeof pdfText === 'function' ? pdfText(value) : String(value ?? '').replace(/[\u0000-\u001f]/g,' ').trim();
  }
  function wrap(text,font,size,maxWidth) {
    const paragraphs = String(text ?? '').split(/\r?\n/);
    if (paragraphs.length > 1) return paragraphs.flatMap(paragraph => wrap(paragraph,font,size,maxWidth));
    const words = pdfString(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    const parts = [];
    for (const word of words) {
      let part = '';
      for (const character of word) {
        if (part && font.widthOfTextAtSize(part+character,size) > maxWidth) {
          parts.push(part); part = '';
        }
        part += character;
      }
      if (part) parts.push(part);
    }
    for (const word of parts) {
      const next = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(next,size) > maxWidth) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }
  async function loadLayoutFonts() {
    if (!window.PDFLib) return;
    if (!fontsPromise) fontsPromise = (async() => {
      const document = await PDFLib.PDFDocument.create();
      layoutFonts = {
        regular:await document.embedFont(PDFLib.StandardFonts.Helvetica),
        bold:await document.embedFont(PDFLib.StandardFonts.HelveticaBold)
      };
    })();
    await fontsPromise;
  }
  function createLayout() {
    const measure = document.createElement('canvas').getContext('2d');
    function font(name) {
      return {name,widthOfTextAtSize(text,size) {
        if (layoutFonts) {
          try { return layoutFonts[name].widthOfTextAtSize(text,size); } catch {}
        }
        measure.font = `${name === 'bold' ? 'bold' : 'normal'} ${size}px Arial`;
        return measure.measureText(text).width;
      }};
    }
    const regular = font('regular'),bold = font('bold');
    const rgb = (red,green,blue) => ({type:'RGB',red,green,blue});
    const layout = {pages:[],fields:[],actions:[],width:595.28,height:841.89};
    const pageSize = [595.28,841.89];
    const margin = 42;
    const width = pageSize[0]-margin*2;
    let page;
    let y;
    function newPage() {
      const commands = [];
      layout.pages.push(commands);
      page = {
        drawText:(text,options) => commands.push({kind:'text',text,...options}),
        drawRectangle:options => commands.push({kind:'rectangle',...options}),
        drawLine:options => commands.push({kind:'line',...options})
      };
      y = pageSize[1]-margin;
      for (const line of wrap(activeForm.title,bold,15,width)) {
        page.drawText(line,{x:margin,y,size:15,font:bold,color:rgb(0.08,0.16,0.27)});
        y -= 18;
      }
      page.drawText(pdfString(activeForm.code || 'Formulario ADC'),{x:margin,y,size:9,font:bold,color:rgb(0.14,0.32,0.64)});
      page.drawText('Borrador generado en ADC · Verificar antes de presentar',{x:margin+100,y,size:8,font:regular,color:rgb(0.35,0.4,0.48)});
      y -= 12;
      page.drawLine({start:{x:margin,y},end:{x:margin+width,y},color:rgb(0.75,0.79,0.84),thickness:0.6});
      y -= 17;
    }
    function ensureSpace(height) {
      if (!page || y-height < margin) newPage();
    }
    function drawTextLines(lines,x,top,font,size,color,maxWidth) {
      for (const line of lines) {
        ensureSpace(size+3);
        page.drawText(line,{x,y:y-size,font,size,color,maxWidth});
        y -= size+3;
      }
    }
    function drawField(field) {
      const value = presented(field,values[field.path]);
      const isMarked = marked.has(field.path);
      const shown = Array.isArray(value) ? value.join(', ') : value;
      const lines = isMarked ? [''] : wrap(shown,regular,9,width-16);
      let offset = 0;
      if (field.type === 'choices' || field.type === 'checks') {
        const options = field.options.map(option => ({value:option,lines:wrap(option,regular,9,width-34)}));
        const height = options.reduce((sum,option) => sum+option.lines.length*12+5,12);
        const labelLines = wrap(field.label+(field.required ? ' *' : ''),bold,9,width);
        ensureSpace(height+labelLines.length*12+12);
        drawTextLines(labelLines,margin,y,bold,9,rgb(.15,.2,.28),width);
        const boxY = y-height;
        page.drawRectangle({x:margin,y:boxY,width,height,color:rgb(1,1,1),borderColor:rgb(.78,.81,.86),borderWidth:.6});
        const selected = Array.isArray(value) ? value : [value];
        let optionY = y-16;
        for (const option of options) {
          option.y = optionY;
          page.drawRectangle({x:margin+8,y:optionY,width:9,height:9,borderColor:rgb(.25,.3,.38),borderWidth:.6});
          if (selected.includes(option.value)) {
            page.drawLine({start:{x:margin+9,y:optionY+1},end:{x:margin+16,y:optionY+8},thickness:.8,color:rgb(0,0,0)});
            page.drawLine({start:{x:margin+9,y:optionY+8},end:{x:margin+16,y:optionY+1},thickness:.8,color:rgb(0,0,0)});
          }
          option.lines.forEach((text,index) => page.drawText(text,{x:margin+24,y:optionY-index*12,size:9,font:regular,color:rgb(.08,.1,.13),fieldValue:field.path,optionText:true}));
          optionY -= option.lines.length*12+5;
        }
        layout.fields.push({field,page:layout.pages.length-1,x:margin,y:boxY,width,height,options});
        y = boxY-10;
        return;
      }
      do {
        const required = field.required || (field.requiredWhen && matches(field.requiredWhen));
        const label = `${field.label}${required ? ' *' : ''}${offset ? ' (continuación)' : ''}${field.legacyOnly ? ' · Complemento ADC del borrador anterior' : ''}`;
        const labelLines = wrap(label,bold,9,width);
        ensureSpace(labelLines.length*12+40);
        drawTextLines(labelLines,margin,y,bold,9,rgb(0.15,0.2,0.28),width);
        const capacity = Math.max(1,Math.floor((y-margin-26)/11));
        const chunk = lines.slice(offset,offset+capacity);
        const minimum = field.type === 'textarea' || field.signature ? 42 : 25;
        const boxHeight = Math.max(minimum,chunk.length*11+14);
        const boxY = y-boxHeight;
        layout.fields.push({field,page:layout.pages.length-1,x:margin,y:boxY,width,height:boxHeight,continuation:offset>0,lines:chunk});
        page.drawRectangle({x:margin,y:boxY,width,height:boxHeight,color:rgb(1,1,1),borderColor:rgb(0.78,0.81,0.86),borderWidth:0.6});
        if (isMarked) {
          const center = boxY+boxHeight/2;
          page.drawLine({start:{x:margin+width*lineStart,y:center},end:{x:margin+width*lineEnd,y:center},color:rgb(0,0,0),thickness:pdfLineThickness});
        } else {
          chunk.forEach((line,index) => page.drawText(line,{x:margin+8,y:boxY+boxHeight-13-index*11,size:9,font:regular,color:rgb(0.08,0.1,0.13),fieldValue:field.path,continuation:offset>0}));
        }
        y = boxY-10;
        offset += chunk.length;
        if (offset < lines.length) newPage();
      } while (offset < lines.length);
    }
    newPage();
    for (const notice of activeForm.notices || []) {
      drawTextLines(wrap(notice,regular,9,width),margin,y,regular,9,rgb(0.2,0.25,0.3),width);
      y -= 8;
    }
    for (const group of activeForm.sections) {
      if (!group.fields.some(field => available(field,field.key))) continue;
      const noticeHeight = group.notice ? wrap(group.notice,regular,9,width).length*12+6 : 0;
      ensureSpace(80+Math.min(noticeHeight,180));
      page.drawText(pdfString(group.title),{x:margin,y:y-12,size:11,font:bold,color:rgb(0.12,0.24,0.4),maxWidth:width});
      y -= 22;
      if (group.notice) {
        drawTextLines(wrap(group.notice,regular,9,width),margin,y,regular,9,rgb(0.2,0.25,0.3),width);
        y -= 6;
      }
      const repeatKeys = new Set(group.fields.filter(field => field.type === 'repeat').map(field => field.key));
      let previousRepeat = '';
      const groupFields = formFields().filter(item => group.fields.some(source => source.type !== 'repeat' && source.key === item.path) || [...repeatKeys].some(key => item.path.startsWith(`${key}.`)));
      for (const [index,field] of groupFields.entries()) {
        const repeatId = field.repeatLabel ? `${field.repeatKey}.${field.repeatIndex}` : '';
        if (repeatId && repeatId !== previousRepeat) {
          ensureSpace(80);
          page.drawText(`${pdfString(field.repeatLabel)} ${field.repeatIndex+1}`,{x:margin,y:y-10,size:9,font:bold,color:rgb(0.25,0.3,0.38)});
          y -= 18;
        }
        previousRepeat = repeatId;
        drawField(field);
        const next = groupFields[index+1];
        if (repeatId && (!next || next.repeatKey !== field.repeatKey || next.repeatIndex !== field.repeatIndex)) {
          ensureSpace(24);
          layout.actions.push({row:repeatId,page:layout.pages.length-1,x:margin,y:y-20});
          y -= 28;
        }
      }
      for (const repeat of group.fields.filter(field => field.type === 'repeat' && rowCount(field) < (field.maxRows || 50))) {
        ensureSpace(24);
        layout.actions.push({add:repeat.key,page:layout.pages.length-1,x:margin,y:y-20});
        y -= 28;
      }
    }
    return layout;
  }
  async function createPdf() {
    const prepared = preparedDocument();
    if (prepared) {
      const response = await fetch(prepared.pdf);
      if (!response.ok) throw new Error('No se pudo cargar el PDF preparado. Intentá nuevamente.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (new TextDecoder().decode(bytes.slice(0,5)) !== '%PDF-') throw new Error('El archivo recibido no es un PDF válido.');
      return bytes;
    }
    if (!window.PDFLib) throw new Error('Revisá tu conexión para cargar la biblioteca PDF.');
    await loadLayoutFonts();
    layoutDocument();
    const layout = documentLayout;
    const pdf = await PDFLib.PDFDocument.create();
    const fonts = {regular:await pdf.embedFont(PDFLib.StandardFonts.Helvetica),bold:await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold)};
    for (const commands of layout.pages) {
      const page = pdf.addPage([layout.width,layout.height]);
      for (const command of commands) {
        const {kind,text,font,fieldValue,continuation,optionText,...options} = command;
        if (kind === 'text') page.drawText(text,{...options,font:fonts[font.name]});
        if (kind === 'rectangle') page.drawRectangle(options);
        if (kind === 'line') page.drawLine(options);
      }
    }
    return pdf.save();
  }
  async function runAction(action,reviewed=false) {
    if (!activeForm) return;
    if (!preparedDocument() && (!validate(true) || (!reviewed&&!await guidedReview.review({action})) || !validate(true))) return;
    const buttons = [...section.querySelectorAll('[data-adc-official-action]')];
    buttons.forEach(button => {button.disabled = true;});
    status.textContent = 'Generando el PDF…';
    const actionRevision = revision;
    const actionForm = activeForm;
    try {
      const bytes = await createPdf();
      if (actionRevision !== revision || actionForm !== activeForm) {
        status.textContent = 'Los datos cambiaron durante la generación. Volvé a generar el PDF.';
        return;
      }
      const nextUrl = URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
      const previousUrl = pdfUrl;
      pdfUrl = nextUrl;
      const existingFrame = preview.querySelector('iframe');
      if (existingFrame) existingFrame.src = nextUrl;
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      if (action === 'preview') {
        const frame = document.createElement('iframe');
        frame.title = `Vista preliminar de ${activeForm.title}`;
        frame.src = pdfUrl;
        preview.replaceChildren(frame);
        preview.hidden = false;
        preview.scrollIntoView({block:'start',behavior:'smooth'});
        status.textContent = 'Vista preliminar lista.';
      } else if (action === 'download') {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${activeForm.code || activeForm.id}${preparedDocument() ? '_original' : '_ADC'}.pdf`.replace(/[^\w.-]+/g,'_');
        link.click();
        status.textContent = preparedDocument() ? 'PDF original descargado, sin cambios.' : 'PDF descargado. El archivo es una copia estática y no se puede editar como formulario.';
      } else if (action === 'print') {
        const printWindow = window.open(pdfUrl,'_blank');
        if (!printWindow) throw new Error('El navegador bloqueó la ventana del PDF. Permití ventanas emergentes e intentá nuevamente.');
        printWindow.addEventListener('load',() => window.setTimeout(() => printWindow.print(),300),{once:true});
        status.textContent = 'Preparando el PDF para imprimir…';
      }
    } catch (error) {
      status.textContent = `No se pudo generar el PDF. ${error.message}`;
    } finally {
      buttons.forEach(button => {button.disabled = false;});
    }
  }
  function loadForm(form,trigger) {
    invalidatePreview();
    activeForm = form;
    const prepared = preparedDocument();
    section.dataset.adcDocumentMode = prepared ? 'original' : 'editable';
    returnFocus = trigger;
    loadDraft(form);
    const notices = section.querySelector('[data-adc-official-notices]');
    notices.replaceChildren();
    for (const message of draftWarnings) {
      const paragraph = document.createElement('p');
      paragraph.textContent = message; notices.append(paragraph);
    }
    for (const source of form.extraSources || []) {
      const link = document.createElement('a');
      link.href = source.url; link.textContent = source.label;
      link.target = '_blank'; link.rel = 'noopener'; notices.append(link);
    }
    title.textContent = `${form.title}${form.code ? ` · ${form.code}` : ''}`;
    description.textContent = 'Revisá los datos del documento y completá los campos pendientes. El borrador se guarda en este dispositivo.';
    section.querySelector('[data-adc-official-mnc-help]').hidden = Boolean(prepared);
    section.querySelectorAll('[data-adc-official-action="download"]').forEach(button => {
      button.textContent = prepared ? 'Descargar PDF' : 'Descargar PDF Completado';
    });
    if (prepared) {
      description.textContent = 'Prueba de la pantalla común: PDF preparado en su diseño original. Los campos editables, la precarga y las preguntas se configurarán después de aprobar esta base.';
      notices.replaceChildren();
      const note = document.createElement('p');
      note.className = 'warning'; note.textContent = prepared.note; notices.append(note);
    }
    privacy.hidden = !form.sensitive;
    privacy.textContent = form.sensitive
      ? 'Este trámite puede incluir información sensible. El borrador se guarda únicamente en este dispositivo y no se envía a un servidor.'
      : 'Los datos del formulario permanecen en este dispositivo; la aplicación no los envía a un servidor.';
    sourceLink.href = form.sourceUrl || sourcePage;
    sourceLink.textContent = form.sourceUrl ? 'Consultar documento oficial' : 'Consultar formularios y planillas oficiales';
    if (prepared) {
      sourceLink.href = prepared.source;
      sourceLink.textContent = 'Ver carpeta de origen en Drive';
    }
    preview.replaceChildren();
    preview.hidden = true;
    status.textContent = '';
    renderFields();
    save();
    tab('official');
    updateZoom();
    if (!prepared) loadLayoutFonts().then(() => {if (activeForm) layoutDocument();}).catch(() => {});
    title.focus();
  }
  function replaceCatalogCards() {
    for (const card of document.querySelectorAll('.adc-form-grid .adc-catalog-pending')) {
      const cardTitle = card.querySelector('strong')?.textContent || '';
      const form = forms.find(item => normalized(item.catalogTitle) === normalized(cardTitle));
      if (!form) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'adc-catalog-active';
      button.dataset.adcOfficialForm = form.id;
      button.innerHTML = card.innerHTML;
      const smalls = [...button.querySelectorAll('small')];
      const progress = smalls.find(item => normalized(item.textContent) === 'proximamente');
      if (progress) progress.textContent = 'Completar y descargar';
      else {
        const action = document.createElement('small');
        action.textContent = 'Completar y descargar';
        button.append(action);
      }
      card.replaceWith(button);
    }
  }
  section.querySelector('[data-adc-official-back]').addEventListener('click',() => {
    tab('tramites');
    returnFocus?.focus();
  });
  sheet.addEventListener('submit',event => event.preventDefault());
  section.addEventListener('click',event => {
    const button = event.target.closest('[data-adc-official-action]');
    if (button) runAction(button.dataset.adcOfficialAction);
    const mnc = event.target.closest('[data-adc-mnc]');
    if (mnc) markNotApplicable(mnc.dataset.adcMnc);
  });
  section.addEventListener('input',onFieldChange);
  section.addEventListener('change',onFieldChange);
  section.querySelector('[data-adc-document-pending]').addEventListener('click',async() => {if(await guidedReview.review({guided:true}))runAction('preview',true);});
  section.querySelectorAll('[data-adc-zoom]').forEach(button => button.addEventListener('click',() => {
    const action = button.dataset.adcZoom;
    fitWidth = action === 'fit';
    if (!fitWidth) zoom += action === 'in' ? .15 : -.15;
    updateZoom();
  }));
  new ResizeObserver(updateZoom).observe(viewport);
  document.addEventListener('input',event => {
    if (event.target.closest('#profile [id]')) updateProfileFields(event.target.id);
  });
  document.addEventListener('change',event => {
    if (event.target.closest('#profile [id]')) updateProfileFields(event.target.id);
  });
  document.addEventListener('click',event => {
    const trigger = event.target.closest('[data-adc-official-form]');
    const form = trigger && formById.get(trigger.dataset.adcOfficialForm);
    if (form?.id === 'bd02' && window.adcBD02Open) window.adcBD02Open();
    else if (form) loadForm(form,trigger);
  });
  replaceCatalogCards();
})();
