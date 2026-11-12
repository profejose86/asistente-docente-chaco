const adcRevistaChoices=['Titular','Suplente','Interino','Lic. por Ascenso de Jerarquía','Lic. por Traslado'];
let adcTransferDraft={};
function adcRevistaPick(input,id,n){
 const value=norm(input.value.trim());
 const choice=adcRevistaChoices.find(label=>norm(label)===value)||
  ({ascenso:adcRevistaChoices[3],traslado:adcRevistaChoices[4]})[value];
 const entry=inst.find(i=>i.id===id).entries[n];
 if(!choice){
  input.setCustomValidity('Elegí una situación de la lista.');
  input.reportValidity();
  input.value=entry.revista;
  input.setCustomValidity('');
  return;
 }
 if(adcRevistaChoices.indexOf(choice)<3){
  updE(id,n,'revista',choice);
  $('adcTransferNotice').hidden=true;
  input.value=choice;
  return;
 }
 input.value=entry.revista;
 const notice=$('adcTransferNotice');
 $('adcTransferNoticeText').textContent=choice===adcRevistaChoices[4]
  ?'Seleccionaste Lic. por Traslado. Verificá o modificá la declaración especial.'
  :'Seleccionaste Lic. por Ascenso de Jerarquía. Su declaración queda pendiente.';
 $('adcTransferNoticeLink').hidden=choice!==adcRevistaChoices[4];
 notice.hidden=false;
 notice.focus();
 notice.scrollIntoView({block:'start'});
}
function adcDjTransferMode(){return $('adcDjMode').value==='transfer';}
function adcDjSetMode(mode){
 $('adcDjMode').value=mode;
 $('djNew').classList.toggle('adc-dj-transfer',mode==='transfer');
 const form=$('adcTransferForm');
 form.hidden=mode!=='transfer';
 $('adcTransferStatus').hidden=form.hidden;
 if(!form.hidden)adcTransferOpen();
 djRender();
}
function adcTransferOpen(){
 const entries=djEntries(), draft=adcTransferDraft, form=$('adcTransferForm');
 const title=x=>x.i.name+' · '+(x.e.type==='cargo'?x.e.cargoName:[x.e.subject,x.e.course].filter(Boolean).join(' '));
 const destinations=draft.destinations||(draft.destination?[draft.destination]:[]);
 form.elements.destination.replaceChildren(...entries.map(x=>new Option(title(x),x.key,false,destinations.includes(x.key))));
 for(const key of ['resolution','from','affectedFrom','until','article'])form.elements[key].value=draft[key]??(key==='article'?'7-D':'');
 $('adcTransferOrigins').innerHTML=entries.filter(x=>x.e.revista==='Titular').map(x=>
  '<label><input type="checkbox" name="origins" value="'+esc(x.key)+'" '+((draft.origins||[]).includes(x.key)?'checked':'')+'> '+esc(title(x))+'</label>').join('')||'<p>Agregá primero los cargos o asignaturas titulares en Mi perfil docente.</p>';
 adcTransferUpdate(false);
}
function adcTransferUpdate(paint=true){
 const form=$('adcTransferForm'), fields=new FormData(form);
 const destinations=fields.getAll('destination');
 for(const box of form.querySelectorAll('[name="origins"]')){
  box.disabled=destinations.includes(box.value);
  if(box.disabled)box.checked=false;
 }
 const origins=[...form.querySelectorAll('[name="origins"]:checked')].map(box=>box.value);
 adcTransferDraft={destinations,origins,...Object.fromEntries(['resolution','from','affectedFrom','until','article'].map(key=>[key,String(fields.get(key)||'').trim()]))};
 $('adcTransferStatus').textContent=adcTransferIssues().join(' ')||'Revisá la declaración en el panel derecho.';
 if(paint)djRender();
}
function adcTransferIssues(){
 const d=adcTransferDraft, issues=[];
 if(!d.destinations?.length||!d.origins?.length)issues.push('Seleccioná el destino y las horas de origen afectadas.');
 if(!d.resolution||!d.article||!d.from||!d.affectedFrom)issues.push('Completá la resolución, el artículo y las fechas de inicio.');
 if(d.until&&(d.until<d.from||d.until<d.affectedFrom))issues.push('Revisá la fecha de finalización.');
 return issues;
}

