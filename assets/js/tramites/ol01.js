
const adcOLTemplate='assets/formularios/ol01/ol-01-general.pdf';
const adcOLMaleTemplate='assets/formularios/ol01/ol-01-masculino.pdf';
const adcOLPaperImages=['assets/formularios/ol01/ol-01-general.png','assets/formularios/ol01/ol-01-masculino.png'];
const adcSIEPortal='https://gobiernodigital.chaco.gob.ar/login';
const adcDocsNames={'DL-01':'DL-01 · Licencias y permisos','DJ-02':'DJ-02 · Licencias anteriores','OL-01':'OL-01 · Solicitud de licencia'};
const adcDocsDefaults={'Enfermedad o lesión común':[
 ['Secundario','DL-01','license','ready'],['Secundario','Dictamen Médico','link','ready'],
 ['Superior','DL-01','license','ready'],['Superior','DJ-02','dj02','ready'],
 ['Superior','OL-01','ol01','ready'],['Superior','Dictamen Médico','link','ready']
].map(([level,document,action,state])=>({level,document,action,state,url:action==='link'?adcSIEPortal:''}))};
const adcDocsDock=$('adcDocsDock'),adcDocsPanel=$('adcDocsPanel');
const adcDocsForm=$('adcDocsForm'),adcOLForm=$('adcOLForm');
adcOLForm.noValidate=true;
const adcOLFields=adcOLForm.elements;
$('adcOLBack').addEventListener('click',adcBackToTramites);
const adcOLGuided=adcGuidedValidation.create({root:adcOLForm,collect:()=>{
 const relative=adcOLForm.elements.mode.value==='relative';
 const keys=['teacherSurname','teacherGiven','teacherDni','from','until','law','article','description','place','signDate',...(relative?['surname','given','dni','sex','address','relation']:['reason'])];
 return keys.map(key=>({key,input:adcOLForm.elements[key]})).filter(({input})=>input&&!input.disabled&&!input.value.trim()&&!input.hasAttribute('data-adc-mnc-marked')).map(({key,input})=>({key,label:input.getAttribute('aria-label')||input.labels?.[0]?.textContent.trim()||key,controls:[input]}));
}});
let adcDocsContext='',adcDocsView='',adcDocsEditing=-1;
let adcOLUrl='',adcOLGeneration=0;
const adcDocsKey='adc_documentos_tramite_v1';
function adcDocsData(){
 try{return JSON.parse(localStorage.getItem(adcDocsKey)||'{}')||{}}catch{return {}}
}
function adcDocsItems(){return adcDocsData()[adcDocsContext]??adcDocsDefaults[adcDocsContext]??[]}
function adcDocsURL(value){
 try{const url=new URL(value);return url.protocol==='https:'?url.href:''}catch{return ''}
}
function adcDocsResetEditor(){
 adcDocsEditing=-1;adcDocsForm.reset();$('adcDocsDelete').hidden=true;
}
function adcDocsRender(){
 $('adcDocsReason').textContent=adcTramiteLabel(adcDocsContext);
 const list=adcDocsItems();
 const root=$('adcDocsRows');root.replaceChildren();
 const school=inst.find(i=>String(i.id)===$('escuelaSelect').value);
 const level=norm(school?.level).trim();
 const selectedLevel=level==='secundario'?'Secundario':['superior','terciario'].includes(level)?'Superior':'';
 const onlyDL=adcDocsContext==='Inasistencias (justificada)';
 const entries=(onlyDL?[{level:'',document:'DL-01',action:'license',state:'ready'}]:list)
  .map((item,index)=>({item,index})).filter(({item})=>onlyDL||!selectedLevel||item.level===selectedLevel);
 if(adcDocsContext==='Enfermedad o lesión común'){
  const order={license:0,dj02:1,ol01:2,link:3};
  entries.sort((a,b)=>(order[a.item.action]??4)-(order[b.item.action]??4));
 }
 if(!selectedLevel&&!onlyDL){
  const note=document.createElement('p');note.className='small';
  if(adcDocsContext==='Enfermedad o lesión común'){
   note.textContent='DJ-02 y OL-01 corresponden a Nivel Superior.';
   root.append(note);
  }
 }
 { 
  const shown=new Set();
  const rows=document.createElement('ul');
  for(const {index,item} of entries){
   if(!selectedLevel&&!$('adcDocsEditor').open&&shown.has(item.document))continue;
   shown.add(item.document);
   const row=document.createElement('li');
   const name=document.createElement('span');name.textContent=adcDocsNames[item.document]||item.document;
   const dictamen=adcDocsContext==='Enfermedad o lesión común'&&item.action==='link'&&norm(item.document)==='dictamen medico';
   const url=dictamen&&(!item.url||item.url==='https://www.tugobiernodigital.com.ar/')?adcSIEPortal:adcDocsURL(item.url);
   const available=(item.state==='ready'||dictamen)&&(item.action==='link'?url:item.action!=='license'||adcDL01Ready.has(adcDocsContext));
   const action=document.createElement(item.action==='link'&&available?'a':'button');
   action.className='adc-doc-action';
   action.textContent=item.action==='link'?'Dictamen Médico · Ir al SIE':name.textContent;
   if(action.tagName==='A'){action.href=url;action.target='_blank';action.rel='noopener noreferrer'}
   else{action.type='button';action.disabled=!available;action.onclick=()=>adcDocsNavigate(item.action)}
   const active=item.action===adcDocsView;
   if(active){row.setAttribute('aria-current','true');action.setAttribute('aria-current','page')}
   if(!available)action.textContent+=' · Pendiente';
   const edit=document.createElement('button');edit.type='button';edit.className='alt adc-doc-config';edit.textContent='Configurar';edit.setAttribute('aria-label','Configurar '+item.document);
   edit.onclick=()=>{
    adcDocsEditing=index;$('adcDocsEditor').open=true;
    for(const key of ['level','document','action','url','state'])adcDocsForm.elements[key].value=item[key];
    $('adcDocsDelete').hidden=false;adcDocsForm.elements.document.focus();
   };
   row.append(action);if(!onlyDL)row.append(edit);rows.append(row);
  }
  if(rows.childElementCount){
   root.append(rows);
   if(adcDocsContext==='Enfermedad o lesión común'&&entries.some(({item})=>item.action==='link'&&norm(item.document)==='dictamen medico')){
    const note=document.createElement('p');note.className='small';
    note.textContent='Dictamen Médico · En Tu Gobierno Digital, entrá al SIE (Sistema Integral de Educación) → Reconocimiento médico para realizar la gestión en línea.';
    root.append(note);
   }
  }
  else{const note=document.createElement('p');note.className='small';note.textContent='Requisitos pendientes de confirmar';root.append(note)}
 }
}
function adcDocsSave(items){
 const data=adcDocsData();data[adcDocsContext]=items;
 try{localStorage.setItem(adcDocsKey,JSON.stringify(data))}
 catch{$('adcDocsStatus').textContent='El navegador no pudo guardar el cambio.';return}
 adcDocsResetEditor();adcDocsRender();$('adcDocsStatus').textContent='Requisitos guardados.';
}
adcDocsForm.addEventListener('submit',event=>{
 event.preventDefault();
 const item=Object.fromEntries(new FormData(adcDocsForm));item.document=item.document.trim();
 if(!item.document||item.url&&!adcDocsURL(item.url)||item.action==='link'&&item.state==='ready'&&!adcDocsURL(item.url)){
  $('adcDocsStatus').textContent='Completá el nombre y, si corresponde, un enlace HTTPS válido.';return;
 }
 const items=[...adcDocsItems()];items[adcDocsEditing<0?items.length:adcDocsEditing]=item;adcDocsSave(items);
});
$('adcDocsDelete').onclick=()=>adcDocsSave(adcDocsItems().filter((_,index)=>index!==adcDocsEditing));
function adcDocsFocusRequest(){
 const heading=document.querySelector('#license .adc-request-heading h2');
 heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});
}
function adcDocsNavigate(view){
 if(view==='ol01')adcOLStart(true);
 else{tab(view);if(view==='license')adcDocsFocusRequest();else $('dj02').querySelector('h2').scrollIntoView({block:'start'})}
}
function adcDocsOnTab(view){
 adcDocsView=view;
 if(view==='tramites'){adcDocsContext='';adcDocsResetEditor();$('adcDocsEditor').open=false}
 adcDocsDock.hidden=!adcDocsContext||!['license','dj02','ol01'].includes(view);
 adcDocsDock.parentElement.dataset.view=view;
 if(!adcDocsDock.hidden)adcDocsRender();
 requestAnimationFrame(adc43Fit);
}
function adcDocsStart(reason){
 adcDocsContext=reason;adcDocsResetEditor();$('adcDocsEditor').open=false;$('adcDocsStatus').textContent='';
 adcDocsOnTab('license');
 const heading=$('adcRequestTitle');
 heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});
}
function adcOLInvalidate(){
 const hadPreview=Boolean(adcOLUrl);
 if(hadPreview)adcOLPreviewStale=true;
 adcOLGeneration++;
 if(adcOLUrl)URL.revokeObjectURL(adcOLUrl);
 adcOLUrl='';$('adcOLPreview').replaceChildren();
 return hadPreview||adcOLPreviewStale;
}
function adcOLPosts(schoolId,contextual=false){
 const group=$('adcOLPosts');group.replaceChildren();
 const school=inst.find(i=>String(i.id)===schoolId);
 const relevant=contextual&&schoolId===$('escuelaSelect').value?new Set(affected().map(row=>row.e)):null;
 for(const [index,entry] of (school?.entries||[]).entries()){
  const cargo=adcOLCargo(entry);if(!cargo)continue;
  const label=document.createElement('label'),box=document.createElement('input');
  box.type='checkbox';box.setAttribute('form','adcOLForm');box.name='post';box.value=String(index);box.checked=!relevant?.size||relevant.has(entry);
  box.dataset.entryKey=entry.djUid||JSON.stringify([cargo,entry.revista,index]);
  box.setAttribute('aria-label','Incluir '+[school.name,cargo,entry.revista||'Sin situación de revista'].join(' · '));
  for(const value of [school.name,cargo,entry.revista||'']){
   const span=document.createElement('span');span.textContent=value;span.title=value;label.append(span);
  }
  label.title=[school.name,cargo,entry.revista||'Sin situación de revista'].join(' · ');
  label.children[1].prepend(box);group.append(label);
 }
}
function adcOLRefreshSchools(){
 const school=adcOLForm.elements.school;
 const selectedSchool=school.value;
 const checks=new Map([...$('adcOLPosts').querySelectorAll('input[name=post]')].map(input=>[input.dataset.entryKey,input.checked]));
 school.replaceChildren(new Option('Seleccioná una institución',''),...inst.map(item=>{
  const option=new Option(item.name,String(item.id));option.title=item.name;return option;
 }));
 school.value=selectedSchool;
 school.title=school.selectedOptions[0]?.title||'';
 adcOLNoSchools.hidden=inst.length>0;
 adcOLPosts(school.value);
 for(const input of $('adcOLPosts').querySelectorAll('input[name=post]')){
  if(checks.has(input.dataset.entryKey))input.checked=checks.get(input.dataset.entryKey);
 }
 adcOLSyncRule();
 adcOLInvalidate();
}
function adcOLCargo(e){return e.type==='cargo'?e.cargoName:[e.subject,window.adcAcademic.course(e)].filter(Boolean).join(' · ')}
const adcOLConfirmedReason='Enfermedad o lesión común';
const adcOLFamilyReason='Enfermedad de un miembro del grupo familiar';
const adcOLFamilyPeriod=document.createElement('select');
adcOLFamilyPeriod.id='adcOLFamilyPeriod';
adcOLFamilyPeriod.setAttribute('aria-label','Período de la licencia por enfermedad de familiar');
adcOLFamilyPeriod.add(new Option('Seleccioná el período',''));
adcOLFamilyPeriod.add(new Option('Solicitud inicial','initial'));
adcOLFamilyPeriod.add(new Option('Prórroga','extension'));
const adcOLFamilyPeriodLabel=document.createElement('label');
adcOLFamilyPeriodLabel.id='adcOLFamilyPeriodLabel';
adcOLFamilyPeriodLabel.hidden=true;
adcOLFamilyPeriodLabel.append('2. ¿Esta solicitud es inicial o una prórroga? ',adcOLFamilyPeriod);
const adcOLFamilyInfo=document.createElement('div');
adcOLFamilyInfo.id='adcOLFamilyInfo';
adcOLFamilyInfo.className='status';
adcOLFamilyInfo.hidden=true;
adcOLFamilyInfo.setAttribute('role','status');
const adcOLFamilyDays=document.createElement('input');
adcOLFamilyDays.id='adcOLFamilyDays';
adcOLFamilyDays.type='number';adcOLFamilyDays.min='1';adcOLFamilyDays.step='1';
adcOLFamilyDays.placeholder='Ej.: 3';
const adcOLFamilyDaysLabel=document.createElement('label');
adcOLFamilyDaysLabel.id='adcOLFamilyDaysLabel';
adcOLFamilyDaysLabel.hidden=true;
adcOLFamilyDaysLabel.append('4. ¿Cuántos días corridos vas a solicitar? ',adcOLFamilyDays);
const adcOLFamilySchool=document.createElement('select');
adcOLFamilySchool.id='adcOLFamilySchool';
adcOLFamilySchool.setAttribute('aria-controls','adcOLPosts');
const adcOLFamilySchoolLabel=document.createElement('label');
adcOLFamilySchoolLabel.id='adcOLFamilySchoolLabel';
adcOLFamilySchoolLabel.hidden=true;
adcOLFamilySchoolLabel.append('3. ¿En qué institución vas a presentar? ',adcOLFamilySchool);
adcOLFamilySchool.addEventListener('change',()=>{
 adcOLFields.school.value=adcOLFamilySchool.value;
 adcOLFields.school.dispatchEvent(new Event('change',{bubbles:true}));
 if(adcOLFamilySchool.value&&!adcOLFamilyDays.disabled)adcOLFocusStep(adcOLFamilyDays);
});
function adcOLFocusStep(control){
 control.focus({preventScroll:true});
 control.scrollIntoView({block:'center',behavior:'smooth'});
}
function adcOLVerifyForm(){
 if(!adcOLFamilyDays.value||!adcOLFamilyDays.checkValidity())return;
 adcOLFields.teacherSurname.focus({preventScroll:true});
 $('adcOLSheet').scrollIntoView({block:'start',behavior:'smooth'});
}
adcOLFamilyDays.addEventListener('keydown',event=>{
 if(event.key==='Enter'){event.preventDefault();adcOLVerifyForm();}
});
adcOLFamilyDays.addEventListener('blur',event=>{
 if(event.relatedTarget)return;
 adcOLVerifyForm();
});
let adcOLFamilySuggestedUntil='';
const adcOLSupport=document.createElement('div');
adcOLSupport.id='adcOLSupport';
const adcOLNoSchools=document.createElement('p');
adcOLNoSchools.id='adcOLNoSchools';
adcOLNoSchools.hidden=inst.length>0;
adcOLNoSchools.append('No hay instituciones en Mi perfil docente. ');
const adcOLProfileLink=document.createElement('button');
adcOLProfileLink.type='button';
adcOLProfileLink.className='alt';
adcOLProfileLink.textContent='Ir a Mi perfil docente para agregarlas';
adcOLProfileLink.addEventListener('click',()=>tab('profile'));
adcOLNoSchools.append(adcOLProfileLink);
const adcOLUntilHint=document.createElement('p');
adcOLUntilHint.id='adcOLUntilHint';
adcOLUntilHint.className='small';
adcOLUntilHint.setAttribute('role','status');
const adcOLUseProfileAddress=document.createElement('button');
adcOLUseProfileAddress.type='button';
adcOLUseProfileAddress.className='alt';
adcOLUseProfileAddress.id='adcOLUseProfileAddress';
adcOLUseProfileAddress.textContent='Usar mi domicilio';
adcOLUseProfileAddress.hidden=true;
function adcOLAddressCopied(copied){
 adcOLUseProfileAddress.setAttribute('aria-pressed',String(copied));
 adcOLUseProfileAddress.textContent=copied?'Borrar domicilio copiado':'Usar mi domicilio';
}
adcOLAddressCopied(false);
adcOLFields.address.addEventListener('input',()=>adcOLAddressCopied(false));
adcOLUseProfileAddress.addEventListener('click',()=>{
 const clear=adcOLUseProfileAddress.getAttribute('aria-pressed')==='true';
 const address=$('perfilDomicilio').value.trim();
 if(!clear&&!address){$('adcOLStatus').textContent='Completá el domicilio en Mi perfil docente o escribilo en el formulario.';return}
 adcOLFields.address.value=clear?'':address;
 adcOLFields.address.dispatchEvent(new Event('input',{bubbles:true}));
 adcOLAddressCopied(!clear);
});
adcOLSupport.append(adcOLFamilyPeriodLabel,adcOLNoSchools,adcOLUntilHint,adcOLUseProfileAddress);
$('adcOLRuleStatus').after(adcOLSupport);
const adcOLSignDateHint=document.createElement('p');
adcOLSignDateHint.id='adcOLSignDateHint';
adcOLSignDateHint.className='small';
adcOLSignDateHint.setAttribute('role','status');
adcOLFields.signDate.setAttribute('aria-describedby',adcOLSignDateHint.id);
$('adcOLSheet').after(adcOLSignDateHint);
const adcOLFamilyRelationList=document.createElement('datalist');
adcOLFamilyRelationList.id='adcOLFamilyRelationOptions';
document.body.append(adcOLFamilyRelationList);
adcOLFields.relation.setAttribute('list',adcOLFamilyRelationList.id);
const adcOLFamilyRelationMap=new Map();
const adcOLFamilyRelations=adcDueloRelations.map(([name,,aliases=''])=>[name,aliases.split(' ').filter(Boolean)]);
adcOLFamilyRelations.push(['Madre',['ma','mamá']],['Padre',['pa','papá']],['Hijo/a',['hi']]);
for(const [name,aliases] of adcOLFamilyRelations){
 for(const value of new Set([name,...aliases])){
  const key=norm(value).trim();
  if(!key)continue;
  adcOLFamilyRelationMap.set(key,name);
  adcOLFamilyRelationList.append(new Option(name,value));
 }
}
const adcOLGenerateButton=document.querySelector('#adcOL button[form="adcOLForm"][type="submit"]');
adcOLGenerateButton.textContent='Ver vista preliminar';
const adcOLDownloadButton=document.createElement('button');
adcOLDownloadButton.type='button';
adcOLDownloadButton.id='adcOLDownload';
adcOLDownloadButton.textContent='Descargar PDF';
const adcOLPrintButton=document.createElement('button');
adcOLPrintButton.type='button';
adcOLPrintButton.id='adcOLPrint';
adcOLPrintButton.textContent='Imprimir';
const adcOLPdfActions=document.createElement('div');
adcOLPdfActions.className='toolbar adc-ol-pdf-actions';
adcOLPdfActions.setAttribute('aria-label','Acciones del PDF');
adcOLGenerateButton.parentElement.insertBefore(adcOLPdfActions,adcOLGenerateButton);
adcOLPdfActions.append(adcOLGenerateButton,adcOLDownloadButton,adcOLPrintButton);
const adcOLTopActions=document.createElement('section');
adcOLTopActions.className='adc-ol-actions-top';
const adcOLTopToolbar=document.createElement('div');
adcOLTopToolbar.className='toolbar adc-ol-pdf-actions';
adcOLTopToolbar.setAttribute('aria-label','Acciones del PDF antes del formulario');
let adcOLRequestedAction='preview';
function adcOLRunAction(action){
 if(action==='download'&&adcOLUrl){adcOLDownloadPdf();return}
 if(action==='print'&&adcOLUrl){adcOLPrintPdf();return}
 adcOLRequestedAction=action;adcOLForm.requestSubmit();
}
adcOLGenerateButton.type='button';
adcOLGenerateButton.addEventListener('click',()=>adcOLRunAction('preview'));
for(const [action,label] of [['preview','Ver vista preliminar'],['download','Descargar PDF'],['print','Imprimir']]){
 const button=document.createElement('button');
 button.type='button';button.textContent=label;button.dataset.olAction=action;
 button.addEventListener('click',()=>adcOLRunAction(action));
 adcOLTopToolbar.append(button);
}
adcOLTopActions.append(adcOLTopToolbar);
const adcOLTopStatus=document.createElement('p');
adcOLTopStatus.id='adcOLTopStatus';adcOLTopStatus.setAttribute('role','status');
adcOLTopActions.append(adcOLTopStatus);
new MutationObserver(()=>{adcOLTopStatus.textContent=$('adcOLStatus').textContent;}).observe($('adcOLStatus'),{childList:true,subtree:true,characterData:true});
function adcOLMountTopActions(){
 $('adcOLSheet').before(adcOLTopActions);
 adcOLSupport.append(adcOLSignDateHint);
 $('adcOLSuggestions').after(adcOLFamilyPeriodLabel,adcOLFamilySchoolLabel,adcOLFamilyInfo,adcOLFamilyDaysLabel);
 adcOLFields.address.before(adcOLUseProfileAddress);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',adcOLMountTopActions,{once:true});
else adcOLMountTopActions();
function adcOLDownloadPdf(){
 if(!adcOLUrl)return;
 const link=document.createElement('a');
 link.href=adcOLUrl;link.download='OL-01_solicitud_de_licencia.pdf';link.click();
}
function adcOLPrintPdf(){
 const frame=$('adcOLPreview').querySelector('iframe');
 frame?.contentWindow?.print();
}
adcOLDownloadButton.addEventListener('click',()=>adcOLRunAction('download'));
adcOLPrintButton.addEventListener('click',()=>adcOLRunAction('print'));
let adcOLSignDateManual=false,adcOLSuggestedSignDate='',adcOLPreviewStale=false,adcOLUntilManual=false;
adcOLFields.until.addEventListener('input',()=>{adcOLUntilManual=true});
adcOLFields.signDate.addEventListener('input',()=>{
 adcOLSignDateManual=true;
 adcOLSuggestSignDate();
});
const adcOLCatalog=tramites.filter(row=>/licencias|permisos/i.test(row[1])&&!/^inasistencias?\b/i.test(row[0]));
function adcOLFamilyMapping(entry,period){
 const status=norm(entry.revista).trim();
 const options={
  titular:{initial:['151','309-D'],extension:['152','309-D']},
  'funcionario politico':{initial:['153','309-D'],extension:['154','309-D']},
  interino:{initial:['155','331-E']},
  suplente:{initial:['156','340-E']}
 }[status];
 if(!options)return null;
 if(!period)return {needsPeriod:true};
 const values=options[period||'initial'];
 const days={titular:{initial:28,extension:30},'funcionario politico':{initial:28,extension:30},interino:{initial:10},suplente:{initial:5}};
 return values?{code:values[0],article:values[1],days:days[status][period],minimumMonths:['interino','suplente'].includes(status)?4:0}:null;
}
function adcOLFamilySummary(entries,rule){
 const active=adcOLFields.catalogReason.value===adcOLFamilyReason;
 adcOLFamilyPeriodLabel.hidden=!active;adcOLFamilyInfo.hidden=!active;
 adcOLFamilySchoolLabel.hidden=!active;
 adcOLFamilyDaysLabel.hidden=!active;
 adcOLFamilyDays.disabled=!active||!rule.row;
 adcOLFamilyInfo.replaceChildren();
 if(!active){
  if(!adcOLUntilManual&&adcOLFamilySuggestedUntil&&adcOLFields.until.value===adcOLFamilySuggestedUntil)adcOLFields.until.value='';
  adcOLFamilySuggestedUntil='';
  return;
 }
 const period=adcOLFamilyPeriod.value;
 const title=document.createElement('strong');
 title.textContent=period==='initial'?'Solicitud inicial':period==='extension'?'Prórroga':'Elegí el tipo de solicitud';
 adcOLFamilyInfo.append(title);
 const statuses=[...new Set(entries.map(entry=>entry.revista).filter(Boolean))];
 for(const status of statuses.length?statuses:['Titular','Interino','Suplente']){
  const detail=document.createElement('p');
  const mapping=adcOLFamilyMapping({revista:status},period);
  const index={titular:0,'funcionario politico':0,interino:1,suplente:2}[norm(status).trim()];
  detail.textContent=status+' · '+(!period
   ?adcDurations[adcOLFamilyReason]?.[index]||'Revisá el encuadre de esta situación de revista.'
   :mapping
    ?mapping.days+' días por año.'+(mapping.minimumMonths?' Requiere '+mapping.minimumMonths+' meses de antigüedad en el cargo y establecimiento.':'')+' Código '+mapping.code+' · Artículo '+mapping.article+'.'
    :'La nomenclatura incorporada no registra una prórroga para esta situación de revista. Verificá el encuadre con Secretaría.');
  adcOLFamilyInfo.append(detail);
 }
 const note=document.createElement('p');
 note.className='small';
 note.textContent='El tope anual y los días de esta solicitud se verifican considerando las licencias ya utilizadas.';
 adcOLFamilyInfo.append(note);
 const mapping=entries.length&&adcOLFamilyMapping(entries[0],period);
 const limit=rule.row?mapping?.days:0;
 if(limit)adcOLFamilyDays.max=String(limit);else adcOLFamilyDays.removeAttribute('max');
 const days=Number(adcOLFamilyDays.value);
 if(limit&&adcOLFamilyDays.value&&(!Number.isInteger(days)||days<1||days>limit)){
  const warning=document.createElement('p');
  warning.textContent='Ingresá entre 1 y '+limit+' días. Verificá también el saldo anual disponible.';
  adcOLFamilyInfo.append(warning);
  if(!adcOLUntilManual&&adcOLFields.until.value===adcOLFamilySuggestedUntil)adcOLFields.until.value='';
  adcOLFamilySuggestedUntil='';
  return;
 }
 const from=adcOLFields.from.value;
 if(!limit||!adcOLFamilyDays.value||!date(from)){
  if(!adcOLUntilManual&&adcOLFamilySuggestedUntil&&adcOLFields.until.value===adcOLFamilySuggestedUntil)adcOLFields.until.value='';
  adcOLFamilySuggestedUntil='';
  return;
 }
 const end=new Date(from+'T12:00:00Z');
 end.setUTCDate(end.getUTCDate()+days-1);
 const until=end.toISOString().slice(0,10);
 adcOLFamilySuggestedUntil=until;
 if(!adcOLUntilManual)adcOLFields.until.value=until;
 const calculation=document.createElement('p');
 calculation.textContent=days+' día(s) corridos desde '+fmt(from)+' hasta '+fmt(until)+', contando Desde como el primer día.';
 if(adcOLUntilManual&&adcOLFields.until.value!==until)calculation.append(' La fecha Hasta fue ajustada manualmente.');
 adcOLFamilyInfo.append(calculation);
}
function adcOLResolve(reason,school,entries,pay,relation){
 if(!reason)return {message:'1. Confirmá un motivo de la lista.'};
 if(!school)return {message:'2. Elegí en qué escuela vas a presentar la solicitud.'};
 if(!entries.length)return {message:'Elegí al menos un cargo u hora cátedra.'};
 if(reason==='Exámenes'){
  const excluded=entries.filter(e=>e.revista==='Suplente');
  if(excluded.length)return {message:'Exámenes no corresponde a estos cargos suplentes: '+excluded.map(adcOLCargo).join(', ')+'. Desmarcalos para continuar con los cargos titulares o interinos.'};
 }
 if(reason===adcOLFamilyReason){
  if(entries.some(entry=>!entry.revista))return {message:'Completá la situación de revista de los cargos seleccionados en Mi perfil docente antes de determinar el encuadre.'};
  const statuses=new Set(entries.map(entry=>norm(entry.revista).trim()));
  if(statuses.size>1){
   const details=entries.map(entry=>{
    const mapped=adcOLFamilyMapping(entry,adcOLFamilyPeriod.value);
    const label=adcOLCargo(entry)+' · '+entry.revista;
    return label+' ('+(mapped?.code?mapped.code+' / '+mapped.article:mapped?.needsPeriod?'código según período':'sin variante verificada')+')';
   });
   return {message:'Los cargos seleccionados requieren encuadres distintos o no compatibles: '+details.join('; ')+'. Ajustá la selección antes de generar el PDF.'};
  }
  const familyMapping=adcOLFamilyMapping(entries[0],adcOLFamilyPeriod.value);
  if(familyMapping?.needsPeriod)return {message:'Elegí si corresponde la solicitud inicial o una prórroga para aplicar el código del nomenclador.'};
  if(familyMapping){
   const row={code:familyMapping.code,article:familyMapping.article,description:adcTramiteLabel(reason),label:adcOLCargo(entries[0])+' · '+entries[0].revista};
   return {row,confirmed:true,previewOnly:false,message:'Encuadre tomado de la nomenclatura local; confirmá su vigencia normativa antes de presentar.'};
  }
  return {manualEncadre:true,message:'No hay una variante verificada para esta situación de revista. Completá Ley N.º y Artículo N.º manualmente y confirmá el encuadre antes de presentar.'};
 }
 const rows=entries.map(e=>{
  const blood={Titular:['381','320-C'],Interino:['382','334-B'],Suplente:['383','343-B']};
  const [code,article]=reason==='Duelo'?adcDueloCode(e.revista,relation):reason==='Donación de sangre'?blood[e.revista]||['','']:mapping(e,reason,pay);
  return {code,article,description:adcTramiteLabel(reason),label:adcOLCargo(e)+' · '+(e.revista||'Sin situación de revista')};
 });
 if(rows.some(row=>!row.code||!row.article))return {message:reason==='Duelo'&&!relation?'Encuadre pendiente: confirmá el parentesco del fallecido.':'Encuadre pendiente de verificar para el motivo y los cargos seleccionados.'};
 const first=rows[0];
 if(rows.some(row=>row.code!==first.code||row.article!==first.article||row.description!==first.description))
  return {message:'Encuadres distintos. Seleccioná cargos compatibles: '+rows.map(row=>row.label+' ('+row.code+' / '+row.article+')').join('; ')};
 const confirmed=[adcOLConfirmedReason,'Exámenes'].includes(reason)&&['superior','terciario'].includes(norm(school.level).trim());
 const previewOnly=norm(school.level).trim()==='secundario';
 return {row:first,confirmed,previewOnly,message:previewOnly?'Nivel Secundario: vista previa de prueba, no válida para presentar.':confirmed?'Encuadre tomado del DL-01 según la situación de revista seleccionada.':'Encuadre disponible. Uso del OL-01 pendiente de confirmar para este motivo y nivel.'};
}
function adcOLSelection(){
 const data=new FormData(adcOLForm),school=inst.find(i=>String(i.id)===adcOLForm.elements.school.value);
 const entries=data.getAll('post').map(index=>school?.entries[Number(index)]).filter(Boolean);
 return {school,entries,rule:adcOLResolve(data.get('catalogReason'),school,entries,$('pago').value,adcOLRelation())};
}
function adcOLManualDateNote(){
 const value=adcOLFields.signDate.value;
 return adcOLSignDateManual?'Fecha manual: '+(value?fmt(value):'sin completar')+'. ':'';
}
function adcOLSuggestSignDate(){
 const fields=adcOLForm.elements,{school}=adcOLSelection();
 if(!adcOLSignDateManual&&adcOLSuggestedSignDate&&fields.signDate.value===adcOLSuggestedSignDate)fields.signDate.value='';
 adcOLSuggestedSignDate='';
 const manual=adcOLManualDateNote();
 if(!school){adcOLSignDateHint.textContent=manual;return}
 if(!fields.until.value||!date(fields.until.value)){adcOLSignDateHint.textContent=manual+'Completá Hasta para calcular el primer día con actividad posterior.';return}
 if(fields.until.value.slice(0,4)!=='2026'){adcOLSignDateHint.textContent=manual+'El calendario con cierres verificados disponible en ADC cubre 2026; ingresá la fecha manualmente para otro año.';return}
 if(typeof window.adcOLCalendarClosed!=='function'){adcOLSignDateHint.textContent=manual+'No está disponible el calendario de cierres; ingresá la fecha manualmente.';return}
 const jobs=(school.entries||[]).filter(entry=>adcOLCargo(entry));
 if(!jobs.length||jobs.some(entry=>!Array.isArray(entry.schedule)||!entry.schedule.some(hours=>Number(hours)>0))){
  adcOLSignDateHint.textContent=manual+'Completá los horarios de '+school.name+' en Mi perfil docente o ingresá la fecha manualmente.';
  return;
 }
 const start=new Date(fields.until.value+'T12:00:00Z');
 let suggestion='';
 for(let offset=1;offset<=366;offset++){
  const day=new Date(start);day.setUTCDate(day.getUTCDate()+offset);
  const iso=day.toISOString().slice(0,10),weekday=(day.getUTCDay()+6)%7;
  if(iso.slice(0,4)!=='2026')break;
  if(jobs.some(entry=>Number(entry.schedule[weekday])>0)&&!window.adcOLCalendarClosed(iso,school)){suggestion=iso;break}
 }
 if(!suggestion){adcOLSignDateHint.textContent=manual+'No se encontró una fecha sugerida dentro del calendario cargado; ingresala manualmente.';return}
 adcOLSuggestedSignDate=suggestion;
 if(!adcOLSignDateManual)fields.signDate.value=suggestion;
 adcOLSignDateHint.textContent=manual+(adcOLSignDateManual?'Nueva sugerencia: ':'Sugerencia: ')+fmt(suggestion)+'; primer día posterior a Hasta con actividad en '+school.name+'.';
}
adcOLFamilyPeriod.addEventListener('change',()=>{
 adcOLSyncRule();
 const stale=adcOLInvalidate();
 $('adcOLStatus').textContent=stale?'Cambiaste datos del PDF. Generá una vista preliminar nueva para descargar o imprimir.':'';
 if(adcOLFamilyPeriod.value&&!adcOLFamilySchool.disabled)adcOLFocusStep(adcOLFamilySchool);
});
adcOLFamilyDays.addEventListener('input',()=>{
 adcOLUntilManual=false;
 adcOLSyncRule();
 adcOLInvalidate();
});
const adcOLQuery=$('adcOLQuery'),adcOLSuggestions=$('adcOLSuggestions');
let adcOLAutoUntil='';
function adcOLFind(query){
 const tokens=norm(query).trim().split(/\s+/).filter(Boolean);
 return adcOLCatalog.map(row=>{
  const title=norm(adcTramiteLabel(row[0])),words=norm(row.join(' '));
  const score=tokens.every(t=>words.includes(t))?tokens.filter(t=>title.includes(t)).length: -1;
  return {row,score};
 }).filter(item=>item.score>=0).sort((a,b)=>b.score-a.score).map(item=>item.row);
}
function adcOLSuggest(){
 adcOLSuggestions.replaceChildren();
 for(const row of adcOLFind(adcOLQuery.value)){
  const button=document.createElement('button');button.type='button';button.className='alt';
  button.textContent=adcTramiteLabel(row[0])+' · '+row[1];
  button.onclick=()=>adcOLPick(row[0],true);adcOLSuggestions.append(button);
 }
 if(!adcOLSuggestions.children.length)adcOLSuggestions.textContent='Sin coincidencias.';
 adcOLSuggestions.hidden=false;
}
function adcOLPick(reason,guide=false){
 const changedReason=adcOLFields.catalogReason.value!==reason;
 adcOLFields.catalogReason.value=reason;
 adcOLQuery.value=reason?adcTramiteLabel(reason):'';
 adcOLFields.reason.value=adcOLQuery.value;
 if(changedReason){adcOLFields.law.value='';adcOLFields.article.value='';adcOLFamilyPeriod.value=''}
 adcOLFields.mode.value=reason===adcOLFamilyReason?'relative':'reason';
 adcOLSuggestions.hidden=true;
 adcOLFields.bereavement.value='';
 adcOLMode();adcOLSyncRule();
 const stale=adcOLInvalidate();
 $('adcOLStatus').textContent=stale?'Cambiaste datos del PDF. Generá una vista preliminar nueva para descargar o imprimir.':'';
 if(guide){
  if(reason===adcOLFamilyReason)adcOLFocusStep(adcOLFamilyPeriod);
  else{adcOLFields.school.classList.add('adc-ol-step-next');adcOLFields.school.focus()}
 }
}
function adcOLRelation(){
 const query=norm(adcOLFields.bereavement.value).trim();
 return adcDueloRelations.find(([name,,aliases=''])=>[norm(name),...norm(aliases).split(' ').filter(Boolean)].includes(query));
}
function adcOLBereavementEnd(start,days,school,isClosed){
 if(!date(start)||!days)return '';
 for(let d=new Date(start+'T12:00:00Z'),i=0;i<366;i++,d.setUTCDate(d.getUTCDate()+1)){
  const iso=d.toISOString().slice(0,10);
  if(![0,6].includes(d.getUTCDay())&&!isClosed(iso,school)&&!--days)return iso;
 }
 return '';
}
function adcOLBereavement(rule,school){
 const f=adcOLFields,isDuelo=f.catalogReason.value==='Duelo',active=isDuelo&&f.mode.value!=='relative',relation=adcOLRelation();
 $('adcOLKin').hidden=!active;
 f.bereavement.disabled=!active;
 if(!adcOLUntilManual&&adcOLAutoUntil&&f.until.value===adcOLAutoUntil)f.until.value='';
 adcOLAutoUntil='';
 const lines=f.reason.value.split('\n');
 const prefix='Parentesco del fallecido: ';
 if(lines[0]?.startsWith(prefix))lines.shift();
 if(lines[1]?.startsWith(prefix))lines.splice(1,1);
 if(active&&relation){
  if(lines[0]?.trim()!=='Duelo'){
   if(!lines[0]?.trim())lines.shift();
   lines.unshift('Duelo');
  }
  lines.splice(1,0,prefix+relation[0]);
 }
 f.reason.value=lines.join('\n');
 if(!active||!relation||!rule.row||!school)return '';
 const days=[0,8,2,1][relation[1]];
 const suggestion=adcOLBereavementEnd(f.from.value,days,school,window.adcOLCalendarClosed);
 if(!adcOLUntilManual&&suggestion)f.until.value=suggestion;
 adcOLAutoUntil=suggestion;
 return days+' día(s) hábiles.'+(suggestion?(adcOLUntilManual?' Hasta manual: '+(f.until.value?fmt(f.until.value):'sin completar')+'. Sugerencia: '+fmt(suggestion)+'.':' Hasta estimado: '+fmt(suggestion)+' según el calendario cargado.'):' Elegí Desde para calcular Hasta.');
}
adcOLQuery.addEventListener('focus',adcOLSuggest);
adcOLQuery.addEventListener('input',()=>{
 adcOLFields.catalogReason.value='';adcOLFields.mode.value='reason';adcOLMode();adcOLSyncRule();
 const stale=adcOLInvalidate();
 $('adcOLStatus').textContent=stale?'Cambiaste datos del PDF. Generá una vista preliminar nueva para descargar o imprimir.':'';
 adcOLSuggest();
});
adcOLQuery.addEventListener('keydown',event=>{
 if(event.key==='Escape'){adcOLSuggestions.hidden=true;return}
 if(!['ArrowDown','Enter'].includes(event.key))return;
 event.preventDefault();
 if(adcOLSuggestions.hidden)adcOLSuggest();
 const first=adcOLSuggestions.querySelector('button');
 if(event.key==='Enter')first?.click();else first?.focus();
});
adcOLSuggestions.addEventListener('keydown',event=>{
 if(event.key==='Escape'){adcOLQuery.focus();adcOLSuggestions.hidden=true;return}
 const next=event.key==='ArrowDown'?event.target.nextElementSibling:event.key==='ArrowUp'?event.target.previousElementSibling:null;
 if(next){event.preventDefault();next.focus()}
});
document.addEventListener('click',event=>{if(event.target!==adcOLQuery&&!adcOLSuggestions.contains(event.target))adcOLSuggestions.hidden=true});
$('listaTramites').addEventListener('click',event=>{
 const result=event.target.closest('button[data-adc-tramite]');
 if(result?.dataset.adcTramite===adcOLFamilyReason)queueMicrotask(()=>adcOLStart(true));
});
$('adcOLKinOptions').replaceChildren(...adcDueloRelations.flatMap(([name,,aliases=''])=>[new Option(name,name),...aliases.split(' ').filter(Boolean).map(alias=>new Option(name,alias))]));
function adcOLSyncRule(){
 const fields=adcOLForm.elements,{school,entries,rule}=adcOLSelection();
 if(rule.row){fields.law.value=rule.row.code;fields.article.value=rule.row.article}
 else if(!rule.manualEncadre){fields.law.value='';fields.article.value=''}
 fields.description.value=rule.row?.description||(fields.catalogReason.value?adcTramiteLabel(fields.catalogReason.value):'');
 const bereavementMessage=adcOLBereavement(rule,school);
 $('adcOLRuleStatus').textContent=[rule.message,bereavementMessage].filter(Boolean).join('\n');
 $('adcOLRuleStatus').className=rule.confirmed&&!rule.message.includes('vigencia normativa')?'status':'warning';
 adcOLFamilySummary(entries,rule);
 adcOLNoSchools.hidden=inst.length>0;
 fields.school.disabled=inst.length===0;
 adcOLFamilySchool.replaceChildren(...[...fields.school.options].map(option=>new Option(option.text,option.value)));
 adcOLFamilySchool.value=fields.school.value;
 adcOLFamilySchool.disabled=fields.school.disabled;
 adcOLFamilySchool.title=fields.school.title;
 fields.school.classList.toggle('adc-ol-step-next',Boolean(fields.catalogReason.value&&!school));
 adcOLUntilHint.textContent=fields.catalogReason.value===adcOLFamilyReason
  ?'Indicá los días de esta solicitud y Desde para calcular Hasta en días corridos. Verificá el saldo anual y la antigüedad exigida.'
  :fields.catalogReason.value==='Duelo'&&!adcOLAutoUntil
   ?'Elegí el parentesco y Desde para calcular Hasta; si faltan datos del calendario, completala manualmente.'
   :fields.catalogReason.value&&fields.catalogReason.value!=='Duelo'&&!adcOLAutoUntil
    ?'No hay una regla de cómputo verificada para Hasta en este motivo. Completá la fecha manualmente.'
    :'';
 adcOLSuggestSignDate();
}
let adcOLDraftKey=null;
function adcOLMode(){
 const fields=adcOLForm.elements,relative=fields.mode.value==='relative';
 fields.reason.disabled=relative;
 for(const key of ['surname','given','dni','address','relation'])fields[key].disabled=!relative;
 for(const input of fields.sex)input.disabled=!relative;
 $('adcOLReasonCross').toggleAttribute('hidden',!relative);$('adcOLRelativeCross').toggleAttribute('hidden',relative);
 adcOLUseProfileAddress.hidden=!relative;
}
function adcOLPaperVariant(){
 $('adcOLPaperImage').src=adcOLPaperImages[adcOLForm.elements.teacherSex.value==='M'?1:0];
}
function adcOLSyncTeacherProfile(){
 const fields=adcOLForm.elements;
 const profileFields={
  teacherSurname:'perfilApellidos',
  teacherGiven:'perfilNombres',
  teacherDni:'dni',
  teacherSex:'sexo',
  teacherAddress:'perfilDomicilio',
  teacherLocality:'perfilLocalidad'
 };
 let changed=false;
 for(const [field,id] of Object.entries(profileFields)){
  if(fields[field].adcMnc?.marked)continue;
  const value=$(id).value;
  if(fields[field].value!==value){fields[field].value=value;changed=true}
 }
 const place=$('perfilLocalidad').value;
 if(!fields.place.adcMnc?.marked&&fields.place.value!==place){fields.place.value=place;changed=true}
 if(changed)adcOLInvalidate();
 adcOLPaperVariant();
}
function adcOLStart(contextual){
 const key=contextual?JSON.stringify([selected,$('escuelaSelect').value,$('desde').value,$('hasta').value]):'standalone';
 if(adcOLDraftKey===key){adcOLRefreshSchools();adcOLSyncTeacherProfile();adcOLMode();adcOLSyncRule();tab('ol01');$('adcOLTitle').focus();return}
 adcOLDraftKey=key;adcOLInvalidate();adcOLPreviewStale=false;adcOLSignDateManual=false;adcOLUntilManual=false;adcOLSuggestedSignDate='';adcOLFamilyPeriod.value='';adcOLForm.reset();
 adcOLFamilyDays.value='';adcOLFamilySuggestedUntil='';
 adcOLAddressCopied(false);
 const fields=adcOLForm.elements;
 fields.school.replaceChildren(new Option('Seleccioná una institución',''),...inst.map(i=>{
  const option=new Option(i.name,String(i.id));option.title=i.name;return option;
 }));
 fields.school.title=fields.school.selectedOptions[0]?.title||'';
 adcOLNoSchools.hidden=inst.length>0;
 if(contextual){
  fields.school.value=$('escuelaSelect').value;fields.reason.value=adcTramiteLabel(selected);
  fields.from.value=$('desde').value;fields.until.value=$('hasta').value;
  adcOLUntilManual=Boolean(fields.until.value);

 }
 adcOLAutoUntil='';
 const reason=contextual&&adcOLCatalog.some(row=>row[0]===selected)?selected:'';
 fields.catalogReason.value=reason;adcOLQuery.value=reason?adcTramiteLabel(reason):'';
 fields.mode.value=reason===adcOLFamilyReason?'relative':'reason';
 adcOLSuggestions.hidden=true;
 if(reason==='Duelo')fields.bereavement.value=adcDueloRelation()?.[0]||'';
 adcOLPosts(fields.school.value,contextual);adcOLSyncRule();
 adcOLSyncTeacherProfile();
 adcOLMode();$('adcOLStatus').textContent='';
 $('adcOLSource').textContent=contextual?'Datos tomados de la solicitud. Podés ajustarlos para este OL-01.':'Completá la solicitud con los datos de tu perfil docente.';
 tab('ol01');$('adcOLTitle').focus();
}
$('adcOL').addEventListener('change',event=>{
 const name=event.target.name;
 if(name==='school'){
  adcOLFields.law.value='';adcOLFields.article.value='';
  adcOLPosts(event.target.value);adcOLFields.school.classList.remove('adc-ol-step-next');
  adcOLFields.school.title=adcOLFields.school.selectedOptions[0]?.title||'';
 }
 if(name==='post'){adcOLFields.law.value='';adcOLFields.article.value=''}
 if(name==='bereavement'&&adcOLRelation())adcOLFields.bereavement.value=adcOLRelation()[0];
 if(name==='relation'){
  const canonical=adcOLFamilyRelationMap.get(norm(adcOLFields.relation.value).trim());
  if(canonical)adcOLFields.relation.value=canonical;
 }
 if(['school','post','bereavement','from','until','mode','relation'].includes(name)){
  adcOLSyncRule();
  const stale=adcOLInvalidate();
  $('adcOLStatus').textContent=stale?'Cambiaste datos del PDF. Generá una vista preliminar nueva para descargar o imprimir.':'';
 }
});
for(const input of adcOLForm.elements.teacherSex)input.addEventListener('change',adcOLPaperVariant);
$('adcOL').addEventListener('input',event=>{
 adcOLMode();
 if(['from','until'].includes(event.target.name)&&adcOLFields.catalogReason.value===adcOLFamilyReason)adcOLSyncRule();
 if(['from','until'].includes(event.target.name))adcOLSuggestSignDate();
 const stale=adcOLInvalidate();
 $('adcOLStatus').textContent=stale?'Cambiaste datos del PDF. Generá una vista preliminar nueva para descargar o imprimir.':'';
});
function adcOLDraw(page,font,values){
 function put(value,x,top,w,center=false,size=10){
  const text=pdfText(value).replace(/[\r\n]+/g,' ').replace(/[^\x20-\x7e\xa0-\xff]/g,'?');
  if(!text)return;
  const fitted=Math.min(size,size*w/font.widthOfTextAtSize(text,size));
  if(fitted<5)throw Error('Un dato supera el espacio disponible. Abrevialo para generar el OL-01.');
  const width=font.widthOfTextAtSize(text,fitted);
  page.drawText(text,{x:x+(center?(w-width)/2:0),y:page.getHeight()-top,size:fitted,font});
 }
 function markSex(value,male,female,top){
  if(value!=='M'&&value!=='F')return;
  const x=value==='M'?male:female,y=page.getHeight()-top;
  for(const sign of [-1,1])page.drawLine({start:{x:x-3.6,y:y-3.6*sign},end:{x:x+3.6,y:y+3.6*sign},thickness:1.05});
 }
 put(values.surname,94,144,296);put(values.given,96,175,294);
 put(values.dni,83,199,167,true);markSex(values.sex,312.9,342,201.8);
 put(values.address,96,227,310);put(values.locality,96,254,310);put(values.school,130,280,272);
 const lines=[[578,144,210],[435,164,355],[435,179,355],[435,194,355],[435,209,355],[435,222,355],[435,237,355],[435,252,355]];
 const paragraphs=(values.reason||'').split(/\r?\n/).map(line=>line.trim().split(/\s+/).filter(Boolean));
 for(const [x,y,w] of lines){
  if(!paragraphs.length)break;
  const words=paragraphs[0];
  let line='';
  while(words.length&&font.widthOfTextAtSize(pdfText([line,words[0]].filter(Boolean).join(' ')).replace(/[^\x20-\x7e\xa0-\xff]/g,'?'),10)<=w)
   line=[line,words.shift()].filter(Boolean).join(' ');
  if(!line&&words.length)line=words.shift();
  put(line,x,y,w);
  if(!words.length)paragraphs.shift();
 }
 if(paragraphs.some(words=>words.length))throw Error('El motivo supera el espacio del formulario. Resumilo para continuar.');
 put(values.from,494,273,100,true);put(values.until,664,273,125,true);
 put(values.law,461,293,42,true);put(values.article,559,293,38,true);put(values.description,671,293,121,false,9);
 function cell(value,x,y,width,center=false){
  const text=pdfText(value).replace(/[^\x20-\x7e\xa0-\xff]/g,'?');
  if(font.widthOfTextAtSize(text,8)<=width){put(text,x,y,width,center,8);return}
  const words=text.split(/\s+/), lines=['',''];
  for(let i=0;i<2;i++){
   while(words.length&&font.widthOfTextAtSize([lines[i],words[0]].filter(Boolean).join(' '),6.3)<=width)
    lines[i]=[lines[i],words.shift()].filter(Boolean).join(' ');
  }
  if(words.length){put(text,x,y,width,center,8);return}
  put(lines[0],x,y-3.2,width,center,6.3);put(lines[1],x,y+3.2,width,center,6.3);
 }
 values.entries.forEach((entry,index)=>{
  const y=371+index*14.72;
  cell(values.school,40,y,141);cell(entry.cargo,189,y,126);cell(entry.revista,323,y,91,true);
 });
 put(values.place,458,505,78,true);put(values.signDate,539,505,80,true);
 if(values.previewOnly)put('VISTA PREVIA DE PRUEBA - NIVEL SECUNDARIO - NO VÁLIDA PARA PRESENTAR',36,29,768,true,11);
 if(values.cross){
  const h=page.getHeight();
  if(values.relative){
   const [x,right,top,bottom]=[435,805,145,257];
   page.drawLine({start:{x,y:h-top},end:{x:right,y:h-bottom},thickness:1.3});
   page.drawLine({start:{x,y:h-bottom},end:{x:right,y:h-top},thickness:1.3});
  }else{
   const [x,right,top,bottom]=[422.8,805.3,320.9,489];
   page.drawLine({start:{x,y:h-bottom},end:{x:right,y:h-top},thickness:1.3});
  }
 }
 if(values.relative){
  const r=values.relative;
  put(r.surname,479,357,292);put(r.given,482,388,293);put(r.dni,473,412,166,true);
  markSex(r.sex,699,728.1,415.8);
  put(r.address,481,441,305);put(r.relation,534,467,251);
 }
}
adcOLForm.addEventListener('submit',async event=>{
 event.preventDefault();
 const requestedAction=adcOLRequestedAction;
 adcOLRequestedAction='preview';
 if(!await adcOLGuided.review())return;
 adcOLInvalidate();const generation=adcOLGeneration;
 const note=$('adcOLStatus'),fields=adcOLForm.elements;
 const v=Object.fromEntries(new FormData(adcOLForm)),{school,entries:posts,rule}=adcOLSelection();
 const relative=v.mode==='relative';
 function missing(key,message){
  note.textContent=message;
  const field=fields[key];
  (field?.focus?field:field?.[0])?.focus();
 }
 if(!v.catalogReason){missing('catalogReason','Confirmá un motivo de la lista.');adcOLQuery.focus();return}
 if(!school){missing('school','Elegí en qué escuela vas a presentar la solicitud.');return}
 if(v.catalogReason===adcOLFamilyReason&&adcOLFamilyDays.value&&rule.row){
  const limit=adcOLFamilyMapping(posts[0],adcOLFamilyPeriod.value)?.days;
  const days=Number(adcOLFamilyDays.value);
  if(!Number.isInteger(days)||days<1||days>limit){
   note.textContent='Revisá los días solicitados: deben estar entre 1 y '+limit+'.';
   adcOLFamilyDays.focus();return;
  }
 }
 if(!rule.confirmed&&!rule.previewOnly&&!rule.manualEncadre){note.textContent=rule.message;return}
 const surname=v.teacherSurname.trim(),given=v.teacherGiven.trim();
 if(v.teacherDni&&!adcPersonalValid(v.teacherDni,7,8)){note.textContent='Revisá el DNI en la plantilla.';return}
 const entries=posts.map(e=>({cargo:adcOLCargo(e),revista:e.revista||''}));
 if(entries.length>12){note.textContent='El OL-01 admite hasta 12 filas.';return}
 if((v.from&&!date(v.from))||(v.until&&!date(v.until))||(v.from&&v.until&&v.until<v.from)){missing('until','Revisá el rango entre Desde y Hasta.');return}
 if(rule.row&&((v.law.trim()&&v.law.trim()!==rule.row.code)||(v.article.trim()&&v.article.trim()!==rule.row.article))){missing('law','El código y el artículo deben coincidir con el encuadre del cargo seleccionado.');return}
 if(relative){
  if(v.dni&&!adcPersonalValid(v.dni,7,8)){missing('dni','Ingresá un DNI válido del pariente.');return}
 }
 if(!window.PDFLib){note.textContent='Se necesita conexión para cargar la biblioteca PDF.';return}
 const displayDate=iso=>iso.split('-').reverse().join('/');
 try{
  const {PDFDocument,StandardFonts}=window.PDFLib;
  const template=await fetch(v.teacherSex==='M'?adcOLMaleTemplate:adcOLTemplate);
  if(!template.ok)throw Error('No se pudo cargar la plantilla ('+template.status+'). Volvé a intentar.');
  const pdf=await PDFDocument.load(await template.arrayBuffer());
  const font=await pdf.embedFont(StandardFonts.HelveticaBold);
  adcOLDraw(pdf.getPage(0),font,{...v,cross:true,previewOnly:rule.previewOnly,reason:relative?'':v.reason||'',surname,given,school:school.name,entries,dni:adcPersonalFormat(v.teacherDni,'dni'),sex:v.teacherSex,address:v.teacherAddress,locality:v.teacherLocality,from:displayDate(v.from),until:displayDate(v.until),signDate:displayDate(v.signDate),relative:v.mode==='relative'?{...v,dni:adcPersonalFormat(v.dni,'dni')}:null});
  const result=await pdf.save();if(generation!==adcOLGeneration)return;
  adcOLUrl=URL.createObjectURL(new Blob([result],{type:'application/pdf'}));
  const preview=document.createElement('iframe');preview.title='Vista previa de impresión del OL-01';
  if(requestedAction==='print')preview.addEventListener('load',()=>{
   if(generation===adcOLGeneration)adcOLPrintPdf();
  },{once:true});
  preview.src=adcOLUrl;
  $('adcOLPreview').append(preview);
  adcOLPreviewStale=false;adcOLDownloadButton.disabled=false;adcOLPrintButton.disabled=false;
  if(requestedAction==='download')adcOLDownloadPdf();
  note.textContent=rule.manualEncadre?rule.message+' El PDF es un borrador; verificá los datos con Secretaría.':rule.previewOnly?'Vista previa de prueba para Secundario. No válida para presentar.':rule.message;
  $('adcOLPreview').scrollIntoView({block:'start'});
 }catch(error){if(generation===adcOLGeneration)note.textContent='No se pudo generar el OL-01. '+error.message}
});
