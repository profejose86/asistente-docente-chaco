/* ADC 58. Ledger operations keep the legacy store readable and preserve removed items. */
function adc58Dni(value){return String(value||'').replace(/\D/g,'')}
function adc58Id(){return 'lic-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,11)}
function adc58Normalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function adc58Excluded(row){return /^inasistencias?\s*(?:\(justificada\)|justificada)$/.test(adc58Normalize(row?.motivo))}
function adc58Signature(dni,record){
 return JSON.stringify([adc58Dni(dni),adc58Normalize(record.motivo),record.desde||'',record.hasta||'']);
}
function adc58RowKey(row){
 return JSON.stringify(['articulo','inciso','motivo','desde','hasta','unidad'].map(key=>String(row[key]||'').trim()));
}
function adc58Read(raw,currentDni){
 const store=JSON.parse(JSON.stringify(raw||{}));
 if(!store.adc58){
  const owner=adc58Dni(store.fields?.Dni)||currentDni;
  const licenses=[];
  for(const row of store.rows||[]){
   // Historical rows remain in storage, including previously recorded exceptions.
   const sourceKey=row.motivo&&row.desde&&row.hasta?adc58Signature(owner,row):'legacy-'+adc58Id();
   let license=licenses.find(item=>item.sourceKey===sourceKey);
   if(!license){license={id:adc58Id(),dni:owner,sourceKey,status:'granted',source:'legacy',records:[],sourceRecords:[]};licenses.push(license)}
   if(!license.records.some(record=>adc58RowKey(record)===adc58RowKey(row)))license.records.push({...row});
   license.sourceRecords.push(adc58RowKey(row));
  }
  store.adc58={version:1,licenses};
 }
 if(store.adc58.version!==1||!Array.isArray(store.adc58.licenses))throw Error('Registro DJ-02 incompatible');
 for(const draft of store.pending||[]){
  const dni=adc58Dni(draft.dni);
  if(!dni||!Array.isArray(draft.records))continue;
  for(const row of draft.records){
   if(adc58Excluded(row))continue;
   const sourceKey=adc58Signature(dni,row);
   let license=store.adc58.licenses.find(item=>item.sourceKey===sourceKey&&item.dni===dni);
   if(!license){
    license={id:adc58Id(),dni,sourceKey,status:'pending',source:'DL-01',records:[],sourceRecords:[],createdAt:new Date().toISOString()};
    store.adc58.licenses.push(license);
   }
   // A regenerated request cannot restore a deleted license.
   if(license.status==='deleted')continue;
   license.sourceRecords=license.sourceRecords||license.records.map(adc58RowKey);
   const incomingKey=adc58RowKey(row);
   if(license.sourceRecords.includes(incomingKey))continue;
   if(!license.records.some(record=>adc58RowKey(record)===incomingKey))license.records.push({...row});
   license.sourceRecords.push(incomingKey);
  }
 }
 store.pending=[];
 return store;
}
function adc58Project(store,dni){
 return store.adc58.licenses.filter(item=>item.dni===dni&&item.status==='granted')
  .flatMap(item=>item.records.filter(row=>!adc58Excluded(row)).map(row=>({...row})));
}
function adc58Transition(store,id,action){
 const license=store.adc58.licenses.find(item=>item.id===id);
 if(!license)throw Error('La licencia ya no está disponible. Actualizá la pantalla.');
 if(action==='delete'&&license.status!=='deleted'){
  license.previousStatus=license.status;license.status='deleted';license.deletedAt=new Date().toISOString();
 }else if(action==='restore'&&license.status==='deleted'){
  license.status=license.previousStatus==='granted'?'granted':'pending';delete license.deletedAt;
 }else if(action==='grant'&&license.status==='pending'){
  if(license.records.some(adc58Excluded))throw Error('Las inasistencias justificadas quedan fuera del DJ-02.');
  const valid=license.records.every(row=>row.motivo?.trim()&&row.articulo?.trim()&&row.unidad?.trim()&&
   /^\d{4}-\d{2}-\d{2}$/.test(row.desde||'')&&/^\d{4}-\d{2}-\d{2}$/.test(row.hasta||'')&&row.desde<=row.hasta&&
   Number.isFinite(Date.parse(row.desde))&&Number.isFinite(Date.parse(row.hasta))&&new Date(row.desde).toISOString().slice(0,10)===row.desde&&new Date(row.hasta).toISOString().slice(0,10)===row.hasta);
  if(!valid)throw Error('Completá motivo, artículo, institución y un período válido antes de confirmar.');
  license.status='granted';license.grantedAt=new Date().toISOString();
 }
 return license;
}
(function(){
 const root=$('dj02'),preview=$('dj02Preview');
 const storageKey='adc_dj02_v1', originalPreview=dj02Preview;
 let view='edit',showDeleted=false,ledger=null,rowRefs=[],undoDelete=null;
 const columns=['articulo','inciso','motivo','desde','hasta','disposicion','unidad'];
 const labels=['Artículo','Inciso','Motivo','Desde','Hasta','Disposición','Institución'];
 const currentDni=()=>adc58Dni($('dni').value);
 const notice=document.createElement('p');notice.id='adc58Status';notice.setAttribute('role','status');
 const tools=document.createElement('div');tools.className='toolbar adc58-toolbar';
 tools.innerHTML='<button type="button" data-view="edit">Editar licencias</button><button type="button" class="alt" data-view="print">Vista previa de impresión</button><span id="adc58Counts"></span>';
 preview.before(tools);
 const printButton=$('adcDJ02PrintButton');printButton.textContent='Imprimir DJ-02';
 const deletedButton=document.createElement('button');deletedButton.type='button';deletedButton.className='alt';deletedButton.textContent='Licencias eliminadas';
 printButton.after(deletedButton);
 const undoButton=document.createElement('button');undoButton.type='button';undoButton.className='alt';undoButton.textContent='Deshacer eliminación';undoButton.hidden=true;
 deletedButton.after(undoButton);undoButton.after(notice);
 const manualButton=root.querySelector('[onclick="dj02Add()"]');
 manualButton.textContent='+ Agregar licencia anterior';
 const rowRoot=$('dj02Rows'),pendingRoot=$('dj02Pending');
 rowRoot.hidden=true;pendingRoot.hidden=true;
 const filter=$('dj02HistoryFilter');
 // Retain the existing filter control, and move it into the single workspace.
 tools.before(filter.closest('.fields'));
 const filterHelp=filter.closest('.fields').nextElementSibling;
 if(filterHelp?.matches('p.small'))filterHelp.textContent='El filtro cambia las filas visibles y las páginas que vas a imprimir.';
 for(const p of root.querySelectorAll('p.small')){
  if(p.textContent.includes('Este filtro sirve para consultar'))p.textContent='El filtro selecciona las licencias visibles y las páginas que vas a imprimir.';
  if(p.textContent.includes('Desde el DL-01 generado'))p.textContent='Las solicitudes nuevas aparecen pendientes. Confirmá la licencia cuando haya sido otorgada.';
 }
 const subtitle=preview.previousElementSibling;
 const header=root.querySelector('h3');
 if(header)header.textContent='DJ-02 · Licencias registradas';
 const intro=[...root.querySelectorAll('p.small')].find(p=>p.textContent.includes('superposición de datos'));
 if(intro)intro.textContent='Revisá cada licencia en su fila. La vista de impresión incluye las otorgadas.';
 function say(message){notice.textContent=message}
 function read(){
  const raw=JSON.parse(localStorage.getItem(storageKey)||'{}');
  return adc58Read(raw,currentDni());
 }
 function write(change){
  const next=read();
  change?.(next);
  const dni=currentDni();
  next.fields={...next.fields,...Object.fromEntries(dj02Fields.map(key=>[key,dj02Val(key)]))};
  next.rows=adc58Project(next,dni);
  localStorage.setItem(storageKey,JSON.stringify(next));
  ledger=next;dj02Records=next.rows.map(row=>({...row}));dj02Loaded=true;
  return next;
 }
 function safeWrite(change){
  try{write(change);return true}catch(error){say('No se pudo guardar. '+error.message);return false}
 }
 function activeLicenses(){
  const filterValue=filter.value;
  return (ledger?.adc58.licenses||[]).filter(item=>item.dni===currentDni()&&
   (showDeleted?item.status==='deleted':item.status!=='deleted')&&
   item.records.some(row=>!adc58Excluded(row)&&(!filterValue||row.unidad===filterValue)));
 }
 function refreshOptions(){
  const names=[...new Set([...dj02Institutions(),...(ledger?.adc58.licenses||[]).filter(item=>item.dni===currentDni()).flatMap(item=>item.records.map(row=>row.unidad)).filter(Boolean)])];
  const prev=filter.value;
  filter.replaceChildren(...dj02Options(names,'Todas las instituciones',prev));filter.value=prev;
  $('dj02Instituciones').replaceChildren(...names.map(name=>new Option(name,name)));
 }
 function summarize(){
  const licenses=activeLicenses(),confirmed=licenses.filter(item=>item.status==='granted');
  const pending=licenses.filter(item=>item.status==='pending');
  $('adc58Counts').textContent=showDeleted?licenses.length+' eliminada(s)':confirmed.length+' licencia(s) para imprimir · '+pending.length+' pendiente(s)';
  deletedButton.textContent=showDeleted?'Volver a licencias':'Licencias eliminadas';
  for(const button of tools.querySelectorAll('[data-view]')){
   button.setAttribute('aria-pressed',String(button.dataset.view===view));
   button.classList.toggle('alt',button.dataset.view!==view);
  }
  manualButton.hidden=showDeleted||view==='print';
 }
 function stateAction(id,action){
  const license=ledger.adc58.licenses.find(item=>item.id===id);
  if(!license||license.dni!==currentDni())return;
  if(action==='grant'&&!confirm('¿Confirmás que esta licencia fue otorgada?'))return;
  if(!safeWrite(store=>adc58Transition(store,id,action)))return;
  if(action==='delete'){
   undoDelete={id,dni:currentDni()};undoButton.hidden=false;
   say('Licencia enviada a Licencias eliminadas. Podés recuperarla.');
  }else say(action==='restore'?'Licencia recuperada con su estado anterior.':'Licencia confirmada. Ya integra la vista de impresión.');
  render();
 }
 function newLicense(){
  if(!adcPersonalValid(currentDni(),7,8)){say('Completá un DNI válido en Mi perfil docente antes de agregar licencias.');return}
  const id=adc58Id();
  const row={articulo:'',inciso:'',motivo:'',desde:'',hasta:'',disposicion:'',unidad:filter.value||$('dj02Presentada').value};
  if(!safeWrite(store=>store.adc58.licenses.push({id,dni:currentDni(),status:'pending',source:'manual',records:[row]})))return;
  showDeleted=false;view='edit';render();
  preview.querySelector('[data-license="'+id+'"] input')?.focus();
  say('Cargá la licencia anterior y confirmala cuando los datos estén completos.');
 }
 function updateField(input){
  const row=input.closest('[data-license]'),licenseId=row.dataset.license,index=Number(row.dataset.record),field=input.dataset.field;
  const value=input.value;
  if(!safeWrite(store=>{
   const license=store.adc58.licenses.find(item=>item.id===licenseId&&item.dni===currentDni());
   if(!license||license.status==='deleted')throw Error('Esta licencia ya no está disponible para editar.');
   const record=license.records[index];
   if(!record||!columns.includes(field))throw Error('Campo no disponible.');
   if(record.catalogoDJ02&&['motivo','unidad'].includes(field)&&record[field]!==value){
    record.articulo='';record.inciso='';record.catalogoDJ02=false;
   }
   record[field]=value;
  }))return;
  say('DJ-02 guardado en este navegador.');
  const latest=ledger.adc58.licenses.find(item=>item.id===licenseId).records[index];
  for(const key of ['articulo','inciso']){
   const control=row.querySelector('[data-field="'+key+'"]');
   if(control)control.value=latest[key]||'';
  }
  row.style.height=rowHeight(latest)+'px';
  summarize();validatePrint();
 }
 // The original preview provides the calibrated personal fields and page header.
 function pageSkeleton(){
  const prior=dj02Records;dj02Records=[];
  originalPreview();
  dj02Records=prior;
  const paper=preview.querySelector('.dj02-paper');
  if(!paper)throw Error('No se pudo abrir la plantilla DJ-02.');
  return paper;
 }
 function rowHeight(record){
  // Unscaled CSS pixels. The institution/motive columns wrap at a readable font size.
  const lines=(text,max)=>Math.max(1,String(text||'').split(/\s+/).reduce((n,word)=>{
   const last=n[n.length-1];if(last+word.length+1>max)n.push(word.length);else n[n.length-1]+=word.length+1;return n;
  },[0]).length);
  return Math.max(42,Math.min(112,Math.max(lines(record.motivo,32),lines(record.unidad,19))*15+12));
 }
 function paginate(rows){
  const pages=[];let page=[],used=0;const space=442;
  for(const item of rows){
   const height=rowHeight(item.record);
   if(page.length&&used+height>space){pages.push(page);page=[];used=0}
   page.push({...item,height});used+=height;
  }
  pages.push(page);return pages;
 }
 function addCell(tr,record,key,item,editable){
  const td=document.createElement('td');
  if(editable){
   const input=document.createElement(key==='motivo'||key==='unidad'?'textarea':'input');
   if(input.tagName==='INPUT')input.type=['desde','hasta'].includes(key)?'date':'text';
   input.value=record[key]||'';input.dataset.field=key;input.setAttribute('aria-label',labels[columns.indexOf(key)]);
   if(key==='motivo')input.setAttribute('placeholder','Escribí el motivo');
   input.addEventListener('change',()=>updateField(input));
   td.append(input);
   if(key==='motivo'){
    const matches=document.createElement('span');matches.className='dj02-matches';matches.hidden=true;td.append(matches);
    input.addEventListener('input',()=>suggest(input,item,matches));
   }
  }else{
   const text=document.createElement('div');text.className='dj02-cell';
   text.textContent=['desde','hasta'].includes(key)?dj02Date(record[key]):record[key]||'';td.append(text);
  }
  tr.append(td);
 }
 function suggest(input,item,box){
  const terms=norm(input.value).split(/\s+/).filter(Boolean);
  box.replaceChildren();if(!terms.length){box.hidden=true;return}
  const matches=tramites.filter(([reason,category,keywords])=>reason!=='Inasistencias (justificada)'&&
   terms.every(term=>norm([reason,category,keywords].join(' ')).split(/\s+/).some(word=>word.startsWith(term)||(term.length>=4&&dj02Distance(word,term)<=1)))).slice(0,6);
  for(const [reason] of matches){
   const unit=ledger.adc58.licenses.find(lic=>lic.id===item.license.id)?.records[item.index]?.unidad;
   const statuses=[...new Set(inst.filter(s=>s.name.trim()===unit).flatMap(s=>s.entries.map(e=>e.revista)))];
   const variants=statuses.flatMap(revista=>[...new Set(['con','sin'].map(pay=>mapping({revista},reason,pay)[1]).filter(Boolean))].map(ref=>({ref,revista})));
   if(!variants.length)variants.push({ref:'',revista:''});
   for(const {ref,revista} of variants){
    const button=document.createElement('button');button.type='button';button.className='alt';
    button.textContent=dj02Motivo(reason)+(ref?' · '+ref+' · '+revista:'');
    button.addEventListener('pointerdown',event=>event.preventDefault());
    button.onclick=()=>{
     if(!safeWrite(store=>{
      const record=store.adc58.licenses.find(lic=>lic.id===item.license.id).records[item.index];
      const [articulo,inciso='']=ref.split('-');Object.assign(record,{motivo:dj02Motivo(reason),articulo,inciso,catalogoDJ02:true});
     }))return;
     render();if(reason==='Exámenes')showExam(item.record.unidad);
    };box.append(button);
   }
  }
  box.hidden=!box.childElementCount;
 }
 function showExam(unidad){
  const cargos=dj02ExamCargos(unidad);if(!cargos.length)return;
  // Reuse the existing profile-review flow for a historical exam record.
  const prior=dj02Records;dj02Records=[{unidad}];dj02ExamNotice(0);dj02Records=prior;
 }
 function render(){
  if(!ledger){if(!safeWrite())return}
  refreshOptions();summarize();
  let rows=[];
  for(const license of activeLicenses()){
   if(view==='print'&&license.status!=='granted')continue;
   license.records.forEach((record,index)=>{
    if(!adc58Excluded(record)&&(!filter.value||record.unidad===filter.value))rows.push({license,record,index});
   });
  }
  rowRefs=rows;
  const skeleton=pageSkeleton().cloneNode(true);
  preview.replaceChildren();
  for(const [pageIndex,items] of paginate(rows).entries()){
   const paper=skeleton.cloneNode(true),table=paper.querySelector('.dj02-license-table'),tbody=table.tBodies[0];
   paper.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
   paper.classList.add('adc58-paper');paper.dataset.page=String(pageIndex+1);
   tbody.replaceChildren();
   const editing=view==='edit';
   const shell=document.createElement('div');shell.className='adc58-page-shell';shell.append(paper);
   let heightUsed=0;
   for(const item of items){
    const tr=document.createElement('tr');tr.dataset.license=item.license.id;tr.dataset.record=String(item.index);
    tr.className=item.license.status==='pending'?'adc58-pending':'';
    tr.style.height=item.height+'px';heightUsed+=item.height;
    for(const key of columns)addCell(tr,item.record,key,item,editing&&!showDeleted);
    if(editing){
     const cell=tr.lastElementChild,actions=document.createElement('div');actions.className='adc58-row-actions';
     const state=document.createElement('span');state.textContent=showDeleted?'Eliminada':item.license.status==='pending'?'Pendiente':'Otorgada';
     actions.append(state);
     for(const [label,action] of (showDeleted?[['Restaurar','restore']]:item.license.status==='pending'?[['Licencia otorgada','grant'],['Eliminar','delete']]:[['Eliminar','delete']])){
      const button=document.createElement('button');button.type='button';button.textContent=label;button.className=action==='delete'?'alt':'';
      button.setAttribute('aria-label',label+' · '+item.record.motivo+' · '+item.record.unidad);
      button.onclick=()=>stateAction(item.license.id,action);actions.append(button);
     }
     cell.append(actions);
    }
    tbody.append(tr);
   }
   const heights=items.map(item=>item.height).sort((a,b)=>a-b);
   const emptyHeight=heights.length?heights[Math.floor(heights.length/2)]:48;
   const emptyCount=Math.max(0,Math.floor((442-heightUsed)/emptyHeight));
   for(let i=0;i<emptyCount;i++){
    const tr=document.createElement('tr');tr.style.height=emptyHeight+'px';tr.setAttribute('aria-hidden','true');
    for(const key of columns){const td=document.createElement('td');td.textContent=' ';tr.append(td)}tbody.append(tr);
   }
   table.style.height='auto';
   const pageNote=document.createElement('span');pageNote.className='adc58-page-number';pageNote.textContent='Hoja '+(pageIndex+1);paper.append(pageNote);
   preview.append(shell);
  }
  preview.classList.toggle('adc58-edit-mode',view==='edit');
  if(typeof adc43Zooms!=='undefined'){
   const zoom=adc43Zooms.find(item=>item.host===preview);
   if(zoom)zoom.selector='.adc58-page-shell';
  }
  rowRoot.replaceChildren();pendingRoot.replaceChildren();
  $('dj02Overflow').textContent=showDeleted?'Las licencias eliminadas conservan sus datos. Restaurar recupera la licencia en todas sus instituciones.':
   'Al eliminar o confirmar una licencia vinculada a varias instituciones, el cambio se aplica a todas.';
  validatePrint();
  requestAnimationFrame(()=>{if(typeof adc43Fit==='function')adc43Fit()});
 }
 function validatePrint(){
  const rows=dj02Records.filter(row=>!filter.value||row.unidad===filter.value);
  const problems=[];
  if(!rows.length)problems.push('No hay licencias otorgadas para imprimir en esta selección.');
  if(dj02Fields.some(key=>!dj02Val(key).trim())||!adcPersonalValid(dj02Val('Dni'),7,8)||!adcPersonalValid(dj02Val('Clase'),4))problems.push('Completá los datos personales y la institución de presentación.');
  if(rows.some(row=>!row.motivo?.trim()||!row.articulo?.trim()||!row.unidad?.trim()||!date(row.desde)||!date(row.hasta)||row.desde>row.hasta))problems.push('Revisá motivo, artículo, institución y fechas de las licencias otorgadas.');
  $('adcDJ02PrintStatus').textContent=problems.join(' ');
  printButton.disabled=problems.length>0||showDeleted;
  return !problems.length&&!showDeleted;
 }
 tools.addEventListener('click',event=>{
  const button=event.target.closest('[data-view]');if(!button)return;
  view=button.dataset.view;render();
 });
 deletedButton.onclick=()=>{showDeleted=!showDeleted;view='edit';render()};
 undoButton.onclick=()=>{
  if(!undoDelete||undoDelete.dni!==currentDni())return;
  if(!safeWrite(store=>adc58Transition(store,undoDelete.id,'restore')))return;
  undoDelete=null;undoButton.hidden=true;showDeleted=false;render();say('Licencia recuperada.');
 };
 filter.onchange=render;
 dj02Open=function(){
  const saved=dj02Stored();
  if(saved.fields?.Presentada)dj02Set('Presentada',saved.fields.Presentada);
  dj02SyncProfile();if(safeWrite()){refreshOptions();render()}
 };
 dj02Render=function(){if(safeWrite())render()};
 dj02Preview=function(){if(!root.classList.contains('hide')){if(safeWrite())render()}};
 dj02RenderPending=function(){pendingRoot.replaceChildren()};
 dj02Add=newLicense;
 dj02Save=function(){if(safeWrite()){render();say('DJ-02 guardado en este navegador.')}};
 dj02Remove=function(i){const row=rowRefs[i];if(row)stateAction(row.license.id,'delete')};
 dj02ConfirmDL01=function(){tab('dj02');dj02Open()};
 adcCheckDJ02Print=validatePrint;
 dj02Print=function(){
  if(!safeWrite()||!validatePrint())return;
  view='print';showDeleted=false;render();
  requestAnimationFrame(()=>{document.body.classList.add('dj02-print-mode');window.print()});
 };
 window.addEventListener('afterprint',()=>{document.body.classList.remove('dj02-print-mode');if(!root.classList.contains('hide'))render()});
 window.addEventListener('beforeprint',()=>{
  if(root.classList.contains('hide'))return;
  view='print';showDeleted=false;render();
 });
 window.addEventListener('storage',event=>{
  if(event.key===storageKey&&!root.classList.contains('hide')){if(safeWrite())render()}
 });
})();
