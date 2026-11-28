// MT2-01: presentación aislada. Datos y apertura pertenecen al catálogo existente.
(() => {
  document.addEventListener('DOMContentLoaded',()=>{
    const root=document.getElementById('adcTramites2');
    if(!root||!window.adcMT2Documents||!window.adcMBITSearch)return;
    const search=window.adcMBITSearch.search;
    const forms=window.adcMT2Documents.records().map(source=>({...source,id:`form:${source.id}`,nativeId:source.id,displayCode:source.displayCode||source.code,kind:'form',source:{...source,actionLabel:source.id==='dl01'?'Elegir motivo':'Abrir formulario'}}));
    const reasons=tramites.map(item=>({id:`reason:${item[0]}`,kind:'reason',title:item[3],officialName:item[0],category:item[1],keywords:[item[2]],reason:item[0],status:'available'}));
    const groups=['Formularios docentes','Formularios para administrativos'];
    const formById=id=>forms.find(item=>item.nativeId===id);
    const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node};
    const button=(text,cls)=>{const node=el('button',text,cls);node.type='button';return node};
    root.innerHTML=`<div class="mt2-heading"><p class="mt2-kicker">Tus gestiones, más cerca</p><h1 id="adcTramites2Title" tabindex="-1">Mis trámites</h1><p>Encontrá el formulario que necesitás o contanos qué trámite querés hacer.</p></div>
      <div class="mt2-layout"><aside class="mt2-panel mt2-frequent"><h2>Mis trámites frecuentes</h2><p class="mt2-muted">Tus accesos habituales, a mano.</p><div data-mt2-frequent></div><p class="mt2-footnote">Seleccioná un motivo para revisar el recorrido disponible.</p></aside>
      <div class="mt2-main"><div class="mt2-panel mt2-search"><h2>¿Qué trámite necesitás hacer?</h2><p class="mt2-muted">Buscá por nombre, motivo o código. Vos elegís cuándo continuar.</p><label for="adcMT2Search">Buscar trámite o formulario</label><div class="mt2-input-wrap"><span aria-hidden="true">⌕</span><input id="adcMT2Search" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="adcMT2Suggestions" autocomplete="off" placeholder="Ej.: enfermedad, duelo, DL-01, DJ-02"><button type="button" data-mt2-clear aria-label="Limpiar búsqueda" hidden>×</button></div><p class="mt2-results-status" data-mt2-count role="status" aria-live="polite"></p><div id="adcMT2Suggestions" role="listbox" aria-label="Sugerencias de trámites y formularios" hidden></div><div data-mt2-selected></div></div>
      <div class="mt2-panel mt2-catalog"><div class="mt2-catalog-heading"><div><h2>Catálogo de formularios</h2><p class="mt2-muted">¿Ya sabés cuál necesitás? Abrilo directamente desde acá.</p></div><span class="mt2-total"></span></div><div class="mt2-category-tabs" role="tablist" aria-label="Categorías de formularios"></div><div id="adcMT2Catalog" class="mt2-grid" role="tabpanel"></div></div></div></div><p data-adc-start-status role="status" aria-live="polite"></p>`;
    const input=root.querySelector('#adcMT2Search'),suggestions=root.querySelector('#adcMT2Suggestions'),count=root.querySelector('[data-mt2-count]'),clear=root.querySelector('[data-mt2-clear]'),selected=root.querySelector('[data-mt2-selected]'),grid=root.querySelector('#adcMT2Catalog');
    const total=root.querySelector('.mt2-total');total.textContent=`${forms.length} formularios`;
    let results=[],active=-1,category=groups[0],chosenForm=null;
    const preview=window.adcMT2Preview?.create({root,openForm:record=>openForm(record),startAssistant:(record,trigger)=>startAssistant(record,trigger)})||null;
    const firstStep=el('span','Primer paso: escribí acá','mt2-first-step-note');firstStep.id='adcMT2FirstStep';firstStep.hidden=true;
    input.closest('.mt2-input-wrap').before(firstStep);input.setAttribute('aria-describedby',firstStep.id);
    const stopAttention=()=>{input.classList.remove('mt2-search-start');firstStep.hidden=true;};
    input.addEventListener('focus',stopAttention);
    let visible=!root.classList.contains('hide');
    new MutationObserver(()=>{
      const next=!root.classList.contains('hide');
      if(next&&!visible){input.classList.remove('mt2-search-start');void input.offsetWidth;input.classList.add('mt2-search-start');firstStep.hidden=false;}
      if(!next){stopAttention();preview?.hide();}
      visible=next;
    }).observe(root,{attributes:true,attributeFilter:['class']});
    function hideSuggestions(){preview?.hide();suggestions.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
    function openForm(record){
      preview?.hide();
      if(record.status==='pending')return;
      if(record.nativeId==='dl01'){
        hideSuggestions();
        const label=el('label','Motivo de licencia'),select=el('select');select.id='adcMT2DL01Reason';label.htmlFor=select.id;
        select.append(new Option('Seleccioná el motivo',''),...reasons.map(item=>new Option(item.title,item.reason)));
        const next=button('Continuar','mt2-open');next.disabled=true;select.onchange=()=>next.disabled=!select.value;
        next.onclick=()=>startAssistant(reasons.find(item=>item.reason===select.value),next);
        selected.replaceChildren(el('p','Elegí el motivo para revisar las preguntas y el formulario correspondiente.','mt2-muted'),label,select,next);select.focus();return;
      }
      if(!adcMT2Documents.open(record.nativeId,{trigger:document.activeElement}))root.querySelector('[data-adc-start-status]').textContent='No se pudo abrir el documento. Revisá los avisos de guardado.';
    }
    function actionFor(record){const action=button(record.source.actionLabel||'Abrir formulario','mt2-open');action.addEventListener('click',event=>{event.stopPropagation();openForm(record)});return action;}
    function chooseForm(record){
      preview?.hide();
      hideSuggestions();selected.replaceChildren();chosenForm=record;renderCatalog();
      const card=el('div',undefined,'mt2-choice');card.append(el('small','Formulario seleccionado'),el('h3',`${record.displayCode||record.code} · ${record.officialName||record.title}`),actionFor(record));selected.append(card);
    }
    function cardFor(record){
      const card=button('', 'mt2-card');card.dataset.mt2Form=record.nativeId;
      card.disabled=record.status==='pending';
      card.append(el('span',record.displayCode||record.code,'mt2-code'),el('strong',record.title),el('span',record.source.actionLabel||'Abrir formulario','mt2-card-action'));
      if(record.nativeId==='incapacidad')card.dataset.adcStartPilot='';
      card.addEventListener('click',event=>{event.stopPropagation();openForm(record)});return card;
    }
    const tabs=root.querySelector('.mt2-category-tabs');
    const priority=el('div',undefined,'mt2-priority');priority.hidden=true;
    const priorityTitle=el('h3','Formularios destacados para tu búsqueda');
    const priorityNote=el('p','Coincidencias y recorridos disponibles. Revisá cuáles corresponden antes de completar.','mt2-muted');
    const priorityGrid=el('div',undefined,'mt2-grid');priorityGrid.dataset.mt2Priority='';
    priority.append(priorityTitle,priorityNote,priorityGrid);tabs.before(priority);
    function priorityForms(){
      const found=new Map();
      if(input.value.trim()){
        for(const record of search(forms,input.value))found.set(record.nativeId,{record,note:'Coincide con tu búsqueda'});
        if(search(reasons,input.value).some(record=>adcDL01Ready.has(record.reason))){
          const record=formById('dl01');if(record&&record.status!=='pending'&&!found.has(record.nativeId))found.set(record.nativeId,{record,note:'Recorrido disponible · confirmá el motivo'});
        }
      }
      if(chosenForm)found.set(chosenForm.nativeId,{record:chosenForm,note:'Seleccionado para revisar'});
      return found;
    }
    function renderCatalog(){
      const highlighted=priorityForms();priority.hidden=!highlighted.size;
      priorityGrid.replaceChildren(...[...highlighted.values()].map(({record,note})=>{const card=cardFor(record);card.classList.add('mt2-card-gold');card.insertBefore(el('span',note,'mt2-match-note'),card.querySelector('.mt2-card-action'));return preview?preview.wrapPriorityCard(card,record):card;}));
      const entries=forms.filter(item=>item.group===category&&!highlighted.has(item.nativeId));
      grid.replaceChildren(...entries.map(record=>{const card=cardFor(record);return preview?preview.wrapCatalogCard(card,record):card;}));
      for(const tab of tabs.children){const current=tab.dataset.group===category;tab.setAttribute('aria-selected',String(current));tab.tabIndex=current?0:-1;}
      grid.setAttribute('aria-labelledby',tabs.querySelector('[aria-selected=true]').id);
    }
    groups.forEach((name,index)=>{const tab=button(name);tab.id=`adcMT2Category${index}`;tab.dataset.group=name;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',grid.id);tab.onclick=()=>{preview?.hide();category=name;renderCatalog()};tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?groups.length-1:(index+(event.key==='ArrowRight'?1:-1)+groups.length)%groups.length;preview?.hide();category=groups[next];renderCatalog();tabs.children[next].focus()});tabs.append(tab)});
    renderCatalog();
    function renderFrequent(){
      const host=root.querySelector('[data-mt2-frequent]');
      const seen=new Set();host.replaceChildren();
      const ranked=Object.keys(usage).sort((a,b)=>usage[b]-usage[a]);
      for(const reason of [...new Set([...ranked,'Enfermedad o lesión común','Asuntos particulares','Exámenes','Duelo'])].slice(0,4)){
        const record=reasons.find(item=>item.reason===reason);if(!record||seen.has(record.id))continue;seen.add(record.id);
        const item=button(record.title,'mt2-frequent-button');item.addEventListener('click',()=>startAssistant(record,item));host.append(item);
      }
    }
    renderFrequent();    function highlight(){
      const options=[...suggestions.children];options.forEach((option,index)=>option.setAttribute('aria-selected',String(index===active)));
      if(options[active]){input.setAttribute('aria-activedescendant',options[active].id);options[active].scrollIntoView({block:'nearest'});preview?.showForKeyboard(results[active],options[active]);}else{input.removeAttribute('aria-activedescendant');preview?.hide();}
    }
    function predict(){
      preview?.hide();
      clear.hidden=!input.value;active=-1;input.removeAttribute('aria-activedescendant');
      renderCatalog();
      if(!input.value.trim()){results=[];suggestions.replaceChildren();count.textContent='';hideSuggestions();return;}
      results=search([...forms,...reasons],input.value).slice(0,12);
      suggestions.replaceChildren(...results.map((record,index)=>{
        const option=button('','mt2-option');option.id=`adcMT2Option${index}`;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.tabIndex=-1;
        option.append(el('span',record.title),el('small',record.kind==='reason'?'Motivo · revisar recorrido':`Formulario · ${record.displayCode||record.code}`));
        option.addEventListener('click',()=>selectSuggestion(record,option));preview?.bindOption(option,record);return option;
      }));
      count.textContent=results.length?`${results.length} sugerencias. Elegí una para continuar.`:'No encontramos coincidencias. Probá con otra palabra o usá el catálogo.';
      suggestions.hidden=!results.length;input.setAttribute('aria-expanded',String(Boolean(results.length)));
    }
    suggestions.addEventListener('scroll',()=>preview?.hide(),{passive:true});
    function selectSuggestion(record,trigger){if(record.kind==='form')chooseForm(record);else startAssistant(record,trigger);}
    input.addEventListener('input',()=>{stopAttention();chosenForm=null;selected.replaceChildren();predict()});
    input.addEventListener('keydown',event=>{
      if(event.key==='Escape'){hideSuggestions();return;}
      if(['ArrowDown','ArrowUp'].includes(event.key)&&results.length){event.preventDefault();suggestions.hidden=false;input.setAttribute('aria-expanded','true');active=active<0?(event.key==='ArrowDown'?0:results.length-1):(active+(event.key==='ArrowDown'?1:-1)+results.length)%results.length;highlight();}
      if(event.key==='Enter'&&!suggestions.hidden&&results.length){event.preventDefault();selectSuggestion(results[active<0?0:active],input)}
    });
    clear.onclick=()=>{input.value='';chosenForm=null;selected.replaceChildren();predict();input.focus()};

    const dialog=el('dialog',undefined,'mt2-dialog');dialog.setAttribute('aria-labelledby','adcMT2AssistantTitle');
    const top=el('div',undefined,'mt2-dialog-heading'),title=el('h2','Asistente de trámites');title.id='adcMT2AssistantTitle';
    const close=button('×','mt2-dialog-close');close.setAttribute('aria-label','Cerrar asistente');top.append(title,close);
    const progress=el('p',undefined,'mt2-progress'),body=el('div',undefined,'mt2-question'),footer=el('div',undefined,'mt2-dialog-footer');
    progress.setAttribute('aria-live','polite');dialog.append(top,progress,body,footer);root.append(dialog);
    const sessions=new Map();let session=null,returnFocus=null;
    const unknown={value:'unknown',label:'No lo sé todavía'};
    function steps(){
      if(!adcDL01Ready.has(session.record.reason)){
        const options=['dl01','dj02','ol01'].map(id=>formById(id)).filter(Boolean).map(record=>({value:record.nativeId,label:record.code+' · '+record.title}));
        return [{key:'form',question:'¿Tu institución te indicó qué formulario necesitás?',options:[...options,unknown],note:'La asociación automática de este motivo está pendiente. Elegí sólo si tenés una indicación de tu institución.'}];
      }
      const items=[{key:'revista',question:'¿Cuál es la situación de revista del cargo de este trámite?',options:[...['Titular','Interino','Suplente'].map(value=>({value,label:value})),unknown],note:'Se usa para consultar las correspondencias ya registradas en ADC. No modifica tu perfil.'}];
      if(session.answers.revista==='unknown')return items;
      if(session.record.reason==='Duelo')items.push({key:'relation',question:'¿Cuál es tu vínculo con la persona fallecida?',select:true,options:[...adcDueloRelations.map(([value])=>({value,label:value})),unknown],note:'Se conserva el catálogo de parentescos del recorrido de Duelo existente.'});
      if(session.record.reason==='Inasistencias (justificada)')items.push({key:'pay',question:'¿La inasistencia se tramita con o sin goce de haberes?',options:[{value:'con',label:'Con goce de haberes'},{value:'sin',label:'Sin goce de haberes'}].concat(unknown),note:'Si todavía no está indicado, elegí «No lo sé todavía» para revisar el caso sin inferirlo.'});
      return items;
    }
    function answer(key,value){session.answers[key]=value;session.index++;renderAssistant();}
    function showResult(){
      progress.textContent='Revisión del recorrido';body.replaceChildren();footer.replaceChildren();
      const reason=session.record.reason;let record=null,detail='';
      if(adcDL01Ready.has(reason)){
        let legal=['',''];
        if(session.answers.revista!=='unknown'){
          if(reason==='Duelo')legal=adcDueloCode(session.answers.revista,adcDueloRelations.find(([name])=>name===session.answers.relation));
          else legal=mapping({revista:session.answers.revista},reason,session.answers.pay||'con');
        }
        if(legal[0]){record=formById('dl01');detail='El recorrido DL-01 está configurado en ADC para este motivo y las respuestas indicadas. Revisá los datos y la aplicabilidad antes de presentar el documento.';}
        else detail='No hay una correspondencia completa confirmada para estas respuestas. No seleccionamos un formulario automáticamente. Revisá el caso con tu institución; podés consultar las alternativas del catálogo.';
      }else if(session.answers.form!=='unknown'){
        record=formById(session.answers.form);detail='Formulario elegido según tu indicación institucional. La asociación automática de este motivo sigue pendiente de validación.';
      }else detail='La pregunta o asociación necesaria para decidir este motivo no está configurada. Consultá con tu institución; el catálogo permanece disponible.';
      chosenForm=record;renderCatalog();
      if(record){body.append(el('p',record.displayCode||record.code,'mt2-result-code'),el('h3',record.officialName||record.title),el('p',detail));const open=button(`Abrir ${record.displayCode||record.code}`,'mt2-open');open.onclick=()=>{
        closeAssistant();
        if(!adcMT2Documents.open(record.nativeId,{reason,trigger:returnFocus}))root.querySelector('[data-adc-start-status]').textContent=record.nativeId==='dl01'&&!adcDL01Ready.has(reason)?'Este motivo todavía no tiene un recorrido DL-01 configurado. Elegí otro formulario indicado por tu institución.':'No se pudo abrir el documento. Revisá los avisos de guardado e intentá nuevamente.';
      };footer.append(open);}
      else {body.append(el('h3','Este caso requiere revisión'),el('p',detail));const manual=button('Volver al catálogo','mt2-open');manual.onclick=closeAssistant;footer.append(manual);}
      const review=button('Revisar respuestas','mt2-secondary');review.onclick=()=>{session.index=0;renderAssistant()};footer.prepend(review);
      body.querySelector('h3').tabIndex=-1;body.querySelector('h3').focus({preventScroll:true});
    }
    function renderAssistant(){
      const list=steps();if(session.index>=list.length){showResult();return;}
      const step=list[session.index];progress.textContent=`Pregunta ${session.index+1} de ${list.length} · ${session.record.title}`;
      body.replaceChildren(el('h3',step.question),el('p',step.note,'mt2-muted'));footer.replaceChildren();
      body.querySelector('h3').tabIndex=-1;
      if(step.select){
        const label=el('label','Parentesco'),select=el('select');select.id='adcMT2Relation';label.htmlFor=select.id;
        select.append(new Option('Seleccioná una opción',''),...step.options.map(option=>new Option(option.label,option.value)));
        select.value=session.answers[step.key]||'';body.append(label,select);
        const next=button('Continuar','mt2-open');next.disabled=!select.value;select.onchange=()=>next.disabled=!select.value;next.onclick=()=>answer(step.key,select.value);footer.append(next);
      }else{
        const options=el('div',undefined,'mt2-answer-options');
        for(const option of step.options){const choice=button(option.label,'mt2-answer');choice.setAttribute('aria-pressed',String(session.answers[step.key]===option.value));choice.onclick=()=>answer(step.key,option.value);options.append(choice)}body.append(options);
      }
      if(session.index){const back=button('Pregunta anterior','mt2-secondary');back.onclick=()=>{session.index--;renderAssistant()};footer.prepend(back);}
      body.querySelector('h3').focus({preventScroll:true});
    }
    function startAssistant(record,trigger){
      preview?.hide();
      if(record.reason==='Enfermedad o lesión común'){
        startIllness(record,trigger);
        return;
      }
      title.textContent='Asistente de trámites';returnFocus=trigger;session=sessions.get(record.id)||{record,answers:{},index:0};sessions.set(record.id,session);
      if(!dialog.open)dialog.showModal();renderAssistant();
    }
    function startIllness(record,trigger){
      hideSuggestions();returnFocus=trigger;title.textContent=record.title;progress.textContent='Paso 1 de 2';
      const schools=inst.filter(item=>String(item.name||'').trim());
      const label=el('label','¿En qué institución vas a presentar?'),school=el('select');school.id='adcMT2IllnessSchool';school.required=true;label.htmlFor=school.id;
      school.append(new Option('Seleccioná una institución',''),...schools.map(item=>new Option(item.name,String(item.id))));
      body.replaceChildren(label,school);footer.replaceChildren();
      if(!schools.length){body.append(el('p','Agregá una institución y sus cargos en tu perfil docente para continuar.','mt2-muted'));const profile=button('Completar perfil docente','mt2-open');profile.onclick=()=>{closeAssistant();tab('profile')};footer.append(profile);}
      else{
        const next=button('Continuar','mt2-open');next.disabled=true;school.onchange=()=>next.disabled=!school.value;
        next.onclick=()=>{
          progress.textContent='Paso 2 de 2';
          const form=el('form'),dates=el('div',undefined,'mt2-license-dates');
          const from=el('input'),until=el('input');from.type=until.type='date';from.required=until.required=true;from.id='adcMT2IllnessFrom';until.id='adcMT2IllnessUntil';
          for(const [field,text] of [[from,'Desde'],[until,'Hasta']]){const wrapper=el('label',text);wrapper.htmlFor=field.id;wrapper.append(field);dates.append(wrapper);}
          const feedback=el('p');feedback.setAttribute('role','status');
          const submit=button('Abrir DL-01 en el visor','mt2-open');submit.type='submit';form.append(el('p',schools.find(item=>String(item.id)===school.value).name,'mt2-muted'),dates,feedback,submit);body.replaceChildren(form);footer.replaceChildren();
          const back=button('Cambiar institución','mt2-secondary');back.onclick=()=>startIllness(record,trigger);footer.append(back);
          from.onchange=()=>{until.min=from.value;until.setCustomValidity('')};until.oninput=()=>until.setCustomValidity('');
          addIllnessCalendar({form,from,until,institution:schools.find(item=>String(item.id)===school.value),submit});
          form.onsubmit=async event=>{
            event.preventDefault();if(!form.reportValidity())return;
            if(until.value<from.value){until.setCustomValidity('Hasta debe ser igual o posterior a Desde.');until.reportValidity();return;}
            submit.disabled=true;back.disabled=true;feedback.textContent='Preparando DL-01 con los datos de tu perfil docente…';
            try{
              await adcMT2Documents.openIllness({institutionId:school.value,from:from.value,until:until.value,onStart:()=>dialog.close()});
              chosenForm=formById('dl01');renderCatalog();
            }catch(error){feedback.textContent=error.message;root.querySelector('[data-adc-start-status]').textContent=error.message;}
            finally{submit.disabled=false;back.disabled=false;}
          };
          from.focus();
        };footer.append(next);
      }
      if(!dialog.open)dialog.showModal();school.focus();
    }
    function addIllnessCalendar({form,from,until,institution,submit}){
      const calendar=window.adcRequestCalendarView;if(!calendar)return;
      const daysLabel=el('label','Días indicados (opcional)'),days=el('input');days.type='number';days.min='1';days.max='366';days.step='1';days.id='adcMT2IllnessDays';daysLabel.htmlFor=days.id;daysLabel.append(days);
      const estimate=el('p',undefined,'mt2-muted');estimate.setAttribute('role','status');
      const useEstimate=button('Usar fecha estimada','mt2-secondary');useEstimate.hidden=true;
      const toggle=button('Abrir Calendario de Agenda Escolar','mt2-secondary'),panel=el('dialog',undefined,'mt2-agenda-picker');panel.id='adcMT2IllnessCalendar';panel.setAttribute('aria-label','Calendario de Agenda Escolar');toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded','false');
      const heading=el('div',undefined,'mt2-agenda-heading'),headingText=el('strong','Calendario escolar'),year=el('input');year.type='number';year.min='1900';year.max='2100';year.value=String(typeof adcSchoolYear==='undefined'?2026:adcSchoolYear);year.setAttribute('aria-label','Año del calendario');heading.append(headingText,year);
      const targets=el('div',undefined,'mt2-agenda-targets'),pickFrom=button('Marcar Desde','mt2-secondary'),pickUntil=button('Marcar Hasta','mt2-secondary');targets.append(pickFrom,pickUntil);
      const hint=el('p',undefined,'mt2-muted'),months=el('div',undefined,'mt2-agenda-months'),coverage=el('p',undefined,'mt2-muted'),legend=el('p',undefined,'mt2-agenda-legend'),closeCalendar=button('Cerrar calendario','mt2-secondary');
      hint.setAttribute('role','status');legend.innerHTML='<span class="adc-holiday">Feriado</span> · <span class="adc-closure">Asueto / cierre</span> · <span class="adc-school-event">Evento escolar</span>';
      const actions=el('div',undefined,'mt2-license-actions');
      toggle.insertAdjacentHTML('afterbegin','<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/></svg>');
      form.querySelector('.mt2-license-dates').before(daysLabel,estimate,useEstimate);
      submit.before(actions);actions.append(toggle,submit);
      panel.append(heading,targets,hint,months,coverage,legend,closeCalendar);form.append(panel);
      let month=null,target='from',manualUntil=false,lastEstimate='',suggested='';
      function positionCalendar(){
        if(!panel.open)return;
        const anchor=dialog.getBoundingClientRect();panel.style.width=Math.min(560,anchor.width-24,innerWidth-32)+'px';
        panel.style.left=Math.max(16,Math.min(anchor.left+12,innerWidth-panel.offsetWidth-16))+'px';
        const below=until.getBoundingClientRect().bottom+8;
        const top=Math.max(16,Math.min(below,innerHeight-220));
        panel.style.top=top+'px';panel.style.maxHeight=(innerHeight-top-16)+'px';
      }
      function render(){
        const y=Number(year.value);if(!year.checkValidity()||!y)return;
        calendar.render(months,y,month,{from:from.value,until:until.value,selectedDay:target==='from'?from.value:until.value,pickEnd:false,years:Array.from({length:201},(_,i)=>1900+i),institution,scoped:true,schoolLink:false});
        coverage.textContent=calendar.status(y,institution);hint.textContent=target==='from'?'Elegí Desde en el calendario.':'Elegí Hasta en el calendario.';
        pickFrom.setAttribute('aria-pressed',String(target==='from'));pickUntil.setAttribute('aria-pressed',String(target==='until'));pickUntil.disabled=!from.value;
        positionCalendar();
      }
      function estimateUntil(){
        suggested=calendar.estimateCorridos(from.value,days.value?Number(days.value):0)||'';
        if(suggested&&(!manualUntil||until.value===lastEstimate)){until.value=suggested;lastEstimate=suggested;manualUntil=false;}
        else if(!suggested&&!manualUntil&&until.value===lastEstimate){until.value='';lastEstimate='';}
        until.min=from.value;until.setCustomValidity('');
        estimate.textContent=suggested?`Hasta estimado: ${suggested.split('-').reverse().join('/')} · ${days.value} día(s) corridos, contando Desde. Podés ajustarlo manualmente.`:'Ingresá los días indicados para estimar Hasta, o elegí ambas fechas manualmente.';
        useEstimate.hidden=!suggested||until.value===suggested;render();
      }
      from.addEventListener('change',()=>{estimateUntil();render()});until.addEventListener('input',()=>{manualUntil=true;estimateUntil()});days.addEventListener('input',estimateUntil);
      from.addEventListener('focus',()=>{target='from';render()});until.addEventListener('focus',()=>{target='until';render()});
      useEstimate.onclick=()=>{manualUntil=false;estimateUntil()};
      pickFrom.onclick=()=>{target='from';render()};pickUntil.onclick=()=>{target='until';render()};
      toggle.onclick=()=>{month=null;if(from.value)year.value=from.value.slice(0,4);render();if(!panel.open)panel.showModal();window.addEventListener('resize',positionCalendar);toggle.setAttribute('aria-expanded','true');positionCalendar();months.querySelector('button')?.focus()};
      panel.addEventListener('close',()=>{window.removeEventListener('resize',positionCalendar);toggle.setAttribute('aria-expanded','false')});
      panel.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target===year){event.preventDefault();year.blur();month=null;render();months.querySelector('button')?.focus()}});
      closeCalendar.onclick=()=>{panel.close();toggle.setAttribute('aria-expanded','false');toggle.focus()};
      panel.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();closeCalendar.click()});
      panel.addEventListener('click',event=>{if(event.target!==panel)return;event.stopPropagation();const rect=panel.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeCalendar.click()});
      year.onchange=()=>{month=null;render()};
      months.onclick=event=>{
        const control=event.target.closest('button');if(!control)return;
        const action=control.dataset.monthAction,iso=control.dataset.date;
        if(action!==undefined){
          if(action==='back')month=null;
          else if(action==='prev'||action==='next'){const value=new Date(Date.UTC(Number(year.value),month+(action==='next'?1:-1),1));year.value=String(value.getUTCFullYear());month=value.getUTCMonth()}
          else month=Number(action);
          render();months.querySelector('.adc-month-nav strong,button')?.focus();return;
        }
        if(!iso)return;
        if(target==='until'&&iso<from.value){hint.textContent='Hasta debe ser igual o posterior a Desde.';return;}
        if(target==='from'){from.value=iso;if(until.value&&until.value<iso){until.value='';manualUntil=false;}estimateUntil();target='until';}
        else{until.value=iso;manualUntil=true;estimateUntil();}
        render();months.querySelector(`[data-date="${iso}"]`)?.focus();
      };
      estimateUntil();
    }
    function closeAssistant(){if(dialog.open)dialog.close();(returnFocus?.isConnected?returnFocus:input).focus({preventScroll:true});}
    close.onclick=closeAssistant;dialog.addEventListener('cancel',event=>{event.preventDefault();closeAssistant()});
    dialog.addEventListener('click',event=>{const box=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))closeAssistant()});
  },{once:true});
})();
