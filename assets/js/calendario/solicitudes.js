
(()=>{
const ids=['desde','hasta','presentacion'], source='https://www.argentina.gob.ar/normativa/nacional/ley-27399-281835/texto';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const key='adc.calendar.v1';
let openMonth=null, adjustedUntil=null;
let catalog=read(key,{version:0,events:[]}), automatic={}, pickEnd=false, verified=false, marked=false, verifyContext="";
const panel=$('adcSharedCalendar'), year=$('adcSharedYear'), day=$('adcCalDay');
const fields=()=>Object.fromEntries(ids.map(id=>[id,$(id).value]));
const versions=()=> 'Base nacional/IES 2026 · revisión '+catalog.version;
const school=()=>inst.find(i=>String(i.id)===$('escuelaSelect').value);
const isIES=i=>/^(?:(?:ies|instituto de educacion superior) )?san fernando rey$/.test(norm(i?.name).replace(/[."'“”‘’]/g,'').replace(/\s+/g,' ').trim());
const weekday=d=>new Date(d+'T12:00:00Z').getUTCDay();
function plus(d,n){const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}
const names={'01-01':'Año Nuevo','03-24':'Memoria por la Verdad y la Justicia','04-02':'Malvinas','05-01':'Día del Trabajo','05-25':'Revolución de Mayo','06-20':'General Manuel Belgrano','07-09':'Independencia','12-08':'Inmaculada Concepción','12-25':'Navidad'};
const movable={'2027-02-08':'Carnaval','2027-02-09':'Carnaval','2027-03-26':'Viernes Santo','2027-06-21':'General Martín Miguel de Güemes','2027-08-16':'General José de San Martín','2027-10-11':'Diversidad Cultural','2027-11-20':'Soberanía Nacional (traslado pendiente de confirmar)'};
function matches(e,i){
 if(e.scope==='Nacional')return true;
 if(!i)return false;
 if(e.scope==='Provincia del Chaco')return true;
 const [kind,...parts]=e.scope.split(':');
 const prop={Localidad:'locality',Institución:'name',Nivel:'level'}[kind];
 return Boolean(prop&&norm(prop==='locality'?i?.locality||$('adcCalendarLocality').value:i?.[prop])&&norm(prop==='locality'?i?.locality||$('adcCalendarLocality').value:i[prop])===norm(parts.join(':').trim()));
}
function events(d){
 const list=catalog.events.filter(e=>e.date===d);
 const national=names[d.slice(5)]||movable[d];
 if(national)list.push({label:national,scope:'Nacional',source,closed:true,type:'Feriado'});
 list.push(...adcCalEvents.filter(([a,b])=>a<=d&&d<=b).map(([, ,label])=>({label,scope:'Institución: IES San Fernando Rey',source:'Calendario institucional 2026 incluido en ADC',closed:/^(feriado|asueto)/i.test(label),type:'Escolar',ies:true})));
 return list;
}
function closed(d,i){return events(d).filter(e=>e.closed&&(e.ies?isIES(i):matches(e,i)))}
window.adcOLCalendarClosed=(d,i)=>closed(d,i).length>0||(d.startsWith('2026-')&&adcSummaryHolidays2026.has(d.slice(5)));
// Feriados nacionales de 2026 que no cubre la base de fechas fijas.
const adcSummaryHolidays2026=new Set([
 '02-16','02-17','04-03','06-15','08-17','10-12','11-23'
]);
window.adcRequestDaySummary=()=>{
 const {desde,hasta}=fields(), institution=school();
 if(!desde||!hasta||hasta<desde)return '';
 const total=(Date.parse(hasta)-Date.parse(desde))/86400000+1;
 let working='pendiente de verificar';
 if(isIES(institution)&&desde.startsWith('2026-')&&hasta.startsWith('2026-')){
  let count=0;
  for(let d=desde;d<=hasta;d=plus(d,1)){
   if(![0,6].includes(weekday(d))&&!adcSummaryHolidays2026.has(d.slice(5))&&!closed(d,institution).length)count++;
  }
  working=String(count);
 }
 return ' · Días corridos: '+total+' · Días hábiles: '+working;
};
function count(start,n,unit,i){
 const excluded=[], pending=new Set();
 for(let k=0;k<3700;k++){
  const d=plus(start,k);
  if(unit!=='corridos'){
   if(d.slice(0,4)!=='2026'||!isIES(i))pending.add(d.slice(0,4));
   const reasons=closed(d,i).map(e=>e.label);
   if([0,6].includes(weekday(d)))reasons.unshift('Fin de semana');
   if(reasons.length){excluded.push(d+' · '+reasons.join(', '));continue}
  }
  if(--n===0)return {date:d,excluded,pending:[...pending]};
 }
}
const chacoClock=new Intl.DateTimeFormat('en-CA',{
 timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit',
 hour:'2-digit',minute:'2-digit',hourCycle:'h23'
});
const dutyLabel=new Intl.DateTimeFormat('es-AR',{
 weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'
});
function nextDuty(end,entries,i,now=new Date()){
 const parts=Object.fromEntries(chacoClock.formatToParts(now).map(({type,value})=>[type,value]));
 const today=parts.year+'-'+parts.month+'-'+parts.day, time=parts.hour+':'+parts.minute;
 const intervals=entries.flatMap(e=>e.djIntervals||[]).filter(v=>v.start&&v.end&&v.end>v.start&&Number(v.day)>=0&&Number(v.day)<7)
  .sort((a,b)=>a.start.localeCompare(b.start));
 const first=plus(end,1)>today?plus(end,1):today;
 if(!intervals.length)return null;
 let skipped='';
 for(let k=0;k<366;k++){
  const d=plus(first,k), slots=intervals.filter(v=>Number(v.day)===(weekday(d)+6)%7), holiday=closed(d,i).length>0;
  const slot=holiday?null:slots.find(v=>d!==today||v.end>time);
  if(slot)return {date:d,time:slot.start,today:d===today,inProgress:d===today&&slot.start<=time,skipped};
  if(d===today)skipped=holiday?'Hoy figura como día no laborable para esta institución.':
   slots.length?'Tus horarios de hoy ya terminaron.':'Hoy no tenés una obligación registrada en esta institución.';
 }
 return null;
}
function rule(){
 if(selected!=='Duelo')return null;
 const relation=adcDueloRelation(), i=school();
 const statuses=[...new Set((i?.entries||[]).map(e=>e.revista))];
 if(!relation||!statuses.length||statuses.some(s=>!['Titular','Interino','Suplente'].includes(s)))return null;
 return {n:[0,8,2,1][relation[1]],unit:statuses.every(s=>s==='Suplente')?'hábiles':statuses.includes('Suplente')?'laborables / hábiles':'laborables'};
}
function recalc(){
 const f=fields(), r=rule(), i=school();
 const result=r?.n&&date(f.desde)?count(f.desde,r.n,r.unit,i):null;
 const until=$('hasta'), old=automatic.hasta;
 const context=JSON.stringify([selected,f.desde,i?.id,r?.n,$('adcDueloRelation').value]);
 if(adjustedUntil&&adjustedUntil.context!==context)adjustedUntil=null;
 const oneDay=classify()==='inasistencia';
 until.readOnly=oneDay;
 if(oneDay){until.value=f.desde;automatic.hasta=until.value;}
 else if(result&&!adjustedUntil||!until.value||until.value===old){
  until.value=result?.date||''; automatic.hasta=until.value;
 }
 $('adcUntilEstimate').textContent=result?.pending.length&&until.value===result.date&&until.value===automatic.hasta?'Fecha estimada':'';
 $('adcCalExplanation').textContent=oneDay?'La inasistencia justificada se brinda un día a la vez.':result?
  r.n+' días '+r.unit+' desde '+fmt(f.desde)+'. '+(result.excluded.length?'Exclusiones: '+result.excluded.join('; ')+'. ':'')+
  (result.pending.length?'Falta confirmar el calendario escolar y los asuetos aplicables de '+result.pending.join(', ')+'. ':'')+
  (until.value!==result.date?'Sugerencia: '+fmt(result.date)+'. Se conservó la fecha ingresada.':''):
  'Hasta: completá la fecha manualmente si el motivo, el parentesco o la regla de cómputo requieren confirmación.';
 const duty=selected&&date(f.desde)&&date(until.value)&&until.value>=f.desde&&i?nextDuty(until.value,i.entries||[],i):null;
 const suggested=duty?.date||'', presentation=$('presentacion');
 const manual=Boolean(presentation.value&&presentation.value!==automatic.presentacion);
 if(!manual){presentation.value=suggested;automatic.presentacion=suggested;}
 const estimated=duty&&(duty.date.slice(0,4)!=='2026'||until.value.slice(0,4)!=='2026'||!isIES(i)||Boolean($('adcUntilEstimate').textContent));
 const label=duty?(duty.today?'hoy':dutyLabel.format(Date.parse(duty.date)))+' a las '+duty.time:'';
 let notice='';
 if(selected){
  if(!date(until.value)||until.value<f.desde)notice='Completá Hasta para calcular la fecha de presentación.';
  else if(!i)notice='Elegí una institución.';
  else if(manual)notice='Fecha ingresada manualmente.'+(duty&&presentation.value!==suggested?' ADC sugiere '+label+(estimated?' (calendario pendiente de verificar)':'')+'.':'');
  else if(!duty)notice='Cargá los horarios de esta institución en Mi perfil docente o ingresá la fecha de presentación manualmente.';
  else notice=(estimated?'Fecha estimada. Se calculó con el horario cargado y el calendario disponible. ':'Fecha sugerida. ')+
   (duty.inProgress?'Hoy tenés una obligación en curso en esta institución.':
    (duty.skipped?duty.skipped+' ':'')+'Tu próxima obligación en esta institución '+(duty.today?'empieza ':'es ')+label+'.')+
   ' Podés editar la fecha.';
 }
 $('adcPresentationRule').textContent=notice;
 $('adcPresentationEstimate').textContent='';

 syncRange(Boolean(result&&automatic.hasta===until.value),Boolean(result&&adjustedUntil));
 return {hasta:result?.date||'',presentacion:suggested,excluded:result?.excluded||[]};
}
const monthName=new Intl.DateTimeFormat('es-AR',{month:'long',timeZone:'UTC'});
function monthButton(label,action,aria=label){
 const button=document.createElement('button');
 button.type='button';button.textContent=label;button.dataset.monthAction=action;
 button.setAttribute('aria-label',aria);
 return button;
}
function moveMonth(delta){
 const target=new Date(Date.UTC(Number(year.value),openMonth+delta,1));
 const nextYear=String(target.getUTCFullYear());
 if(!Array.from(year.options).some(option=>option.value===nextYear))return false;
 year.value=nextYear;openMonth=target.getUTCMonth();
 return true;
}
function render(){
 const y=Number(year.value), root=$('adcCalMonths');
 root.replaceChildren();
 if(openMonth===null){
  const months=document.createElement('div');months.className='adc-month-menu';
  for(let m=0;m<12;m++)months.append(monthButton(monthName.format(new Date(Date.UTC(y,m,1))),String(m)));
  root.append(months);
 }else{
  const m=openMonth;
  root.append(monthButton('Volver a los meses','back'),monthButton('Ir al calendario escolar','school'));
  const month=document.createElement('section');
  const first=new Date(Date.UTC(y,m,1));
  const nav=document.createElement('div');nav.className='adc-month-nav';
  const prev=monthButton('←','prev','Mes anterior'), next=monthButton('→','next','Mes siguiente');
  const available=Array.from(year.options,option=>Number(option.value));
  prev.disabled=m===0&&!available.includes(y-1);
  next.disabled=m===11&&!available.includes(y+1);
  const title=document.createElement('strong');title.textContent=monthName.format(first)+' '+y;
  title.tabIndex=-1;nav.append(prev,title,next);month.append(nav);
  const grid=document.createElement('div');grid.className='adc-date-grid';month.append(grid);
  for(const label of ['Lu','Ma','Mi','Ju','Vi','Sá','Do']){const span=document.createElement('small');span.textContent=label;grid.append(span)}
  for(let j=0;j<(first.getUTCDay()+6)%7;j++)grid.append(document.createElement('span'));
  for(let n=1;n<=new Date(Date.UTC(y,m+1,0)).getUTCDate();n++){
   const iso=new Date(Date.UTC(y,m,n)).toISOString().slice(0,10), es=events(iso), b=document.createElement('button');
   b.type='button';b.textContent=n;b.dataset.date=iso;b.setAttribute('aria-label',iso+(es.length?' · '+es.map(e=>e.label).join(', '):''));b.setAttribute('aria-pressed',String(day.value===iso&&!(pickEnd&&$('hasta').value===iso)));
   if($('desde').value===iso||!pickEnd&&$('hasta').value===iso)b.classList.add('adc-chosen-date');
   if(es.length)b.classList.add(es.some(e=>e.type==='Feriado')?'adc-holiday':es.some(e=>e.closed)?'adc-closure':'adc-school-event');
   grid.append(b);
  }
  root.append(month);
 }
 $('adcCalStatus').textContent=(y!==2026||!isIES(school())?'Calendario escolar de Chaco pendiente de confirmar. ':'Calendario institucional 2026. ')+versions();
 showDay();
}
function showDay(){
 const list=events(day.value), area=$('adcCalDayInfo');
 area.textContent=list.length?list.map(e=>e.type+' · '+e.label+' · '+e.scope+' · '+e.source).join('\n'):'Sin eventos registrados para esta fecha.';
}
year.addEventListener('change',()=>{openMonth=null;render()});
function syncRange(calculated=Boolean(rule()&&automatic.hasta&&automatic.hasta===$('hasta').value), adjusted=Boolean(adjustedUntil&&rule())){
 $('adcRangeFrom').value=fmt($('desde').value)||'Sin seleccionar';
 const until=$('adcRangeUntil');
 until.textContent=pickEnd?'Seleccioná otra fecha':fmt($('hasta').value)||'Seleccioná una fecha';
 until.disabled=classify()==='inasistencia'||!$('desde').value;
 until.classList.toggle('adc-range-waiting',pickEnd);
 $('adcDatePickHint').textContent=pickEnd?'Elegí Hasta':calculated?'Hasta calculado':adjusted?'Hasta ajustado':'Elegí Desde';
 $('adcRangeNotice').textContent=calculated?'Fecha estimada según la duración del permiso. Podés ajustarla en la solicitud.':'';
}
function pickHint(){syncRange()}
$('adcCloseRequestCalendar').onclick=()=>{panel.open=false;panel.querySelector('summary').focus()};
$('adcRangeUntil').onclick=()=>{
 pickEnd=true;
 if(openMonth===null){
  const target=$('hasta').value||$('desde').value;
  if(Array.from(year.options).some(option=>option.value===target.slice(0,4)))year.value=target.slice(0,4);
  openMonth=Number(target.slice(5,7))-1;
 }
 syncRange();render();
};
function markAdjustedUntil(){
 const r=rule();
 adjustedUntil=r&&$('hasta').value?{context:JSON.stringify([selected,$('desde').value,school()?.id,r.n,$('adcDueloRelation').value])}:null;
 delete automatic.hasta;
}
$('adcCalMonths').addEventListener('click',e=>{
 const action=e.target.dataset.monthAction;
 if(action!==undefined){
  if(action==='school'){adcOpenSchoolMonth(Number(year.value),openMonth);return}
  if(action==='back')openMonth=null;
  else if(action==='prev'||action==='next'){if(!moveMonth(action==='prev'?-1:1))return}
  else openMonth=Number(action);
  render();
  $('adcCalMonths').querySelector(openMonth===null?'.adc-month-menu button':'.adc-month-nav strong')?.focus();
  return;
 }
 const iso=e.target.dataset.date;
 if(!iso)return;
 day.value=iso;
 if(pickEnd){
  if(iso<$('desde').value){showDay();$('adcDatePickHint').textContent='Hasta debe ser igual o posterior a Desde.';return}
  $('hasta').value=iso;markAdjustedUntil();pickEnd=false;
  $('hasta').dispatchEvent(new Event('change',{bubbles:true}));
 }else{
  $('desde').value=iso;adjustedUntil=null;
  if(rule()||$('hasta').value<iso){$('hasta').value='';delete automatic.hasta}
  pickEnd=classify()!=='inasistencia'&&!rule()&&selected!=='Duelo';
  $('desde').dispatchEvent(new Event('change',{bubbles:true}));
 }
 pickHint();render();$('adcCalMonths').querySelector('[aria-pressed="true"]')?.focus();
});
$('adcResetDatePick').onclick=()=>{pickEnd=false;pickHint()};
$('adcCalAdd').addEventListener('click',()=>{
 const label=$('adcEventLabel').value.trim(), source=$('adcEventSource').value.trim(), scope=$('adcEventScope').value.trim(), type=$('adcEventType').value;
 if(!date(day.value)||!label||!source||!(/^(Nacional|Provincia del Chaco)$/.test(scope)||/^(Localidad|Institución|Nivel):\s*\S/.test(scope))){$('adcCalUpdate').textContent='Completá fecha, motivo, fuente y alcance válido.';return}
 const event={date:day.value,label,source,scope,type,closed:type!=='Escolar'};
 const events=catalog.events.filter(e=>!(e.date===event.date&&e.scope===scope&&e.label===label));
 const updated={version:catalog.version+1,events:[...events,event]};
 try{write(key,updated)}catch{$('adcCalUpdate').textContent='No se pudo guardar la actualización.';return}
 catalog=updated;render();review();
 $('adcCalUpdate').textContent='Actualización guardada. '+versions();
});
ids.forEach(id=>$(id).addEventListener('input',()=>{if(id==='hasta')markAdjustedUntil();else delete automatic[id]}));
$('desde').addEventListener('change',()=>{
 if($('hasta').value&&$('hasta').value<$('desde').value){$('hasta').value='';delete automatic.hasta;review()}
});
$('presentacion').addEventListener('change',()=>review());
$('adcCalendarLocality').addEventListener('change',()=>review());
function clearRequestMarks(){
 for(const el of document.querySelectorAll('[data-adc-invalid]')){
  delete el.dataset.adcInvalid;el.removeAttribute('aria-invalid');
  const hint=document.getElementById('adc-error-'+el.id);
  if(hint){el.setAttribute('aria-describedby',(el.getAttribute('aria-describedby')||'').split(' ').filter(x=>x!==hint.id).join(' '));hint.remove()}
 }
}
function verify(r,focus=false){
 const issues=new Map();
 const add=(id,msg)=>{if(!issues.has(id))issues.set(id,msg)};
 const from=$('desde').value, until=$('hasta').value, presented=$('presentacion').value;
 if(!selected)add('buscar','Elegí un trámite.');
 if(!date(from))add('desde','Ingresá la fecha de inicio.');
 if(!date(until)||until<from)add('hasta','Ingresá un Hasta igual o posterior a Desde.');
 if(classify()==='inasistencia'&&until!==from)add('desde','La inasistencia justificada debe abarcar un solo día.');
 if(!r.i?.name.trim())add('escuelaSelect','Elegí una institución válida.');
 if(!date(presented))add('presentacion','Ingresá la fecha de presentación.');
 if(selected==='Duelo'&&!adcDueloRelation())add('adcDueloRelation','Elegí el parentesco.');
 if(selected==='Duelo'&&$('pago').value!=='con')add('pago','Seleccioná con goce de haberes.');
 if(selected==='Asuntos particulares'&&$('pago').value!=='sin')add('pago','Seleccioná sin goce de haberes.');
 const profile=r.messages.filter(m=>/Mi perfil docente|No se encontraron|solo para titulares|No existe un código confirmado|Confirmá el encuadre/.test(m));
 if(selected==='Duelo'&&adcDueloRelation()&&r.rows.some(({e})=>!adcDueloCode(e.revista,adcDueloRelation())[0]))
  add('adcDueloRelation','Confirmá el encuadre del parentesco para la situación de revista.');
 if(adcDL01Ready.has(selected)&&selected!=='Duelo'&&r.rows.some(({e})=>!mapping(e)[0]))
  profile.push('Revisá la situación de revista en Mi perfil docente y la forma de pago del trámite.');
 const encuadre=r.messages.find(m=>m.startsWith('No existe un código confirmado'));
 if(encuadre)add('pago',encuadre);
 clearRequestMarks();
 for(const [id,msg] of issues){
  const el=$(id), hint=document.createElement('small');
  el.dataset.adcInvalid='';el.setAttribute('aria-invalid','true');
  hint.id='adc-error-'+id;hint.className='adc-field-error';hint.textContent=msg;
  el.after(hint);el.setAttribute('aria-describedby',[el.getAttribute('aria-describedby'),hint.id].filter(Boolean).join(' '));
 }
 const valid=!issues.size&&!profile.length;
 const button=$('adcVerifyRequest');
 button.classList.toggle('adc-request-ok',verified&&valid);
 button.classList.toggle('adc-request-error',verified&&!valid);
 button.textContent=!verified?'Verificar datos':valid?'Todos los datos están OK':'Verificar los datos marcados en anaranjado';
 if(profile.length){
  const notice=document.createElement('p');
  notice.className='adc-field-error';notice.textContent=profile.join(' · ');
  $('review').prepend(notice);
  if(focus&&!issues.size){notice.tabIndex=-1;notice.focus()}
 }
 if(focus&&issues.size)$(issues.keys().next().value).focus();
}
$('adcVerifyRequest').onclick=()=>{verified=true;marked=true;review(true)};
for(const event of ['input','change'])$('license').addEventListener(event,()=>{
 adcInvalidatePDF();
 verified=false;if(marked)review();
});
const originalReview=review;
review=function(focus=false){
 recalc();
 const result=originalReview();
 adcInvalidatePDF();
 const context=JSON.stringify([selected,fields(),school()?.id,$('adcDueloRelation').value,$('pago').value]);
 if(!focus&&context!==verifyContext)verified=false;
 verifyContext=context;
 if(marked)verify(result,focus);
 return result;
};
adcDueloSuggest=function(){ $('adcDueloHint').textContent=adcDueloRelation()?'':'Elegí un parentesco de la lista.';review() };
const clearDialog=$('adcClearDialog');
$('adcClearRequest').onclick=()=>{
 clearDialog.returnValue='';
 clearDialog.showModal();
};
clearDialog.addEventListener('close',()=>{
 if(clearDialog.returnValue!=='clear')return;
 adcInvalidatePDF(true);
 for(const id of ['desde','hasta','presentacion','adcDueloRelation','disposicion'])$(id).value='';
 $('escuelaSelect').selectedIndex=$('escuelaSelect').options.length?0:-1;
 $('pago').value='con';
 $('justifica').value=classify()==='inasistencia'?'si':'';
 adcDueloAutoUntil='';
 automatic={};adjustedUntil=null;pickEnd=false;verified=false;
 $('adcVerifyRequest').classList.remove('adc-request-ok','adc-request-error');
 $('adcVerifyRequest').textContent='Verificar datos';
 clearRequestMarks();
 marked=false;
 if($('adcPendingForms')){
  for(const input of $('adcPendingForms').querySelectorAll('input[type="radio"]'))input.checked=false;
  $('adcPendingPrintHint').textContent='';
  $('adcPendingFormPreview').replaceChildren();
 }
 day.value='';adcDueloSuggest();
 if(panel.open)render();
});
const originalChoose=choose;
choose=function(reason){if(reason!==selected){for(const id of ['hasta','presentacion'])if(automatic[id]===$(id).value)$(id).value='';automatic={};adjustedUntil=null;pickEnd=false;verified=false}originalChoose(reason)};
window.adcDateSnapshot=()=>({reason:selected,school:school()?.name,values:fields(),version:versions()});
window.adcStoreIssuedDates=snapshot=>{try{write('adc.issuedDates.v1',[...read('adc.issuedDates.v1',[]),snapshot])}catch{$('adcDraftStatus').textContent='El PDF se generó, pero no se pudo guardar su referencia de calendario.'}};
year.value='2027';day.value='2027-01-01';
 panel.addEventListener('toggle',()=>{pickEnd=false;if(panel.open){openMonth=null;pickHint();render()}});
})();
