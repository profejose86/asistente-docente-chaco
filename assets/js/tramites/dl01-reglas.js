function date(s){if(!s)return null;let [y,m,d]=s.split('-').map(Number);let v=new Date(y,m-1,d,12);return v.getFullYear()===y&&v.getMonth()===m-1&&v.getDate()===d?v:null}
function fmt(s){return s?s.split('-').reverse().join('/'):''}
function affected(){let i=inst.find(i=>String(i.id)===$('escuelaSelect').value),a=date($('desde').value),b=date($('hasta').value);if(!i||!a||!b||b<a)return [];let count=Math.round((b-a)/86400000)+1;if(count>366)return [];return i.entries.map(e=>{let h=0,dates=[];for(let k=0;k<count;k++){let d=new Date(a);d.setDate(d.getDate()+k);let weekday=(d.getDay()+6)%7;if(weekday>=5)continue;let n=Number(e.schedule[weekday]||0);if(n>0){h+=n;dates.push(d.toLocaleDateString('es-AR'))}}return {e,h,dates}}).filter(x=>x.h>0)}
function classify(){if(selected==='Inasistencias (justificada)')return 'inasistencia';if(selected==='Duelo')return 'permiso';return 'licencia'}
function mapping(e, reason=selected, pay=$('pago').value){if(reason==='Exámenes')return {Titular:['291','318-H'],Interino:['292','333-D']}[e.revista]||['',''];if(reason==='Asuntos particulares')return e.revista==='Titular'?['231','318-A']:['',''];if(reason==='Inasistencias (justificada)'){let p=pay;if(e.revista==='Titular'&&p==='con')return ['2131','323'];if(e.revista==='Titular'&&p==='sin')return ['2132','323'];if(e.revista==='Interino'&&p==='con')return ['2133','336'];if(e.revista==='Suplente'&&p==='con')return ['2134','345'];}if(reason==='Enfermedad o lesión común'){return {Titular:['111','309-B 1'],Interino:['113','331-A'],Suplente:['114','340-A']}[e.revista]||['',''];}return ['','']}
const adcDueloRelations=[
 ['Madre',1,'mamá'],['Padre',1,'papá'],['Hija',1],['Hijo',1],
 ['Cónyuge',1,'esposo esposa',true],['Hermana',1,'',true],['Hermano',1,'',true],
 ['Suegra',1,'',true],['Suegro',1,'',true],['Nuera',1,'',true],['Yerno',1,'',true],
 ['Abuela',2],['Abuelo',2],['Nieta',2],['Nieto',2],['Cuñada',2,'',true],['Cuñado',2,'',true],
 ['Tía',3],['Tío',3],['Sobrina',3],['Sobrino',3],['Prima hermana',3,'prima'],['Primo hermano',3,'primo'],
 ['Bisabuela',3],['Bisabuelo',3],['Bisnieta',3],['Bisnieto',3],['Tía abuela',3],['Tío abuelo',3]
];
let adcDueloAutoUntil='';
function adcDueloRelation(){
 const value=norm($('adcDueloRelation').value.trim());
 return adcDueloRelations.find(([name,,aliases=''])=>[norm(name),...norm(aliases).split(' ').filter(Boolean)].includes(value));
}
function adcDueloCode(revista,relation){
 if(!relation)return ['',''];
 const [,group,,review]=relation;
 const base={Titular:[340,'320-F'],Interino:[343,'334-E'],Suplente:[346,'343-E']}[revista];
 return base&&(!review||revista==='Titular')?[String(base[0]+group),base[1]]:['',''];
}
function adcDueloEnd(start,days,events){
 const skipped=[];
 let remaining=days;
 for(let d=new Date(start+'T12:00:00Z');Number.isFinite(+d)&&d.getUTCFullYear()===2026;d.setUTCDate(d.getUTCDate()+1)){
  const iso=d.toISOString().slice(0,10);
  const closed=events.some(([from,to,label])=>from<=iso&&iso<=to&&/^(feriado|asueto)/i.test(label));
  if(closed||[0,6].includes(d.getUTCDay()))skipped.push(iso);
  else if(--remaining===0)return {until:iso,skipped};
 }
 return null;
}
function adcDueloSuggest(){
 if(selected!=='Duelo')return;
 const until=$('hasta');
 if(adcDueloAutoUntil&&until.value===adcDueloAutoUntil)until.value='';
 adcDueloAutoUntil='';
 const relation=adcDueloRelation(), start=$('desde').value;
 const school=inst.find(i=>String(i.id)===$('escuelaSelect').value);
 const local=/^(?:(?:ies|instituto de educacion superior) )?san fernando rey$/.test(norm(school?.name).replace(/[."'“”‘’]/g,'').replace(/\s+/g,' ').trim());
 const count=relation?[0,8,2,1][relation[1]]:0;
 const result=local&&date(start)&&count?adcDueloEnd(start,count,adcCalEvents):null;
 $('adcDueloHint').textContent=!relation?'Elegí un parentesco de la lista.':count+' día(s) laborables. '+(result?'Calendario institucional 2026. '+(result.skipped.length?'Se omitieron: '+result.skipped.map(fmt).join(', ')+'.':'No se omitieron fechas.'):'Confirmá y cargá Hasta manualmente. El calendario aplicable no está disponible para todo el período.');
 if(result){
  until.value=result.until;
  adcDueloAutoUntil=result.until;
 }
 review();
}

function adcDurationLegend(){
 const legend=$('adcDurationLegend');
 if(!legend)return;
 const statuses=['Titular','Interino','Suplente'];
 const unknown='Duración por confirmar';
 let rules;
 switch(selected){
  case 'Duelo': {
   const relation=adcDueloRelation();
   if(!relation){legend.textContent='Seleccioná el parentesco para ver cuántos días corresponden.';return;}
   const days=[0,8,2,1][relation[1]];
   rules=statuses.map(status=>adcDueloCode(status,relation)[0]?days+(days===1?' día laborable':' días laborables'):unknown);
   break;
  }
  case 'Inasistencias (justificada)':
   rules=[$('pago').value==='sin'?'Hasta 4 días por año sin goce':'Hasta 10 días por año con goce','Hasta 5 días por año con goce','Hasta 3 días por año con goce'];
   break;
  default:
   rules=(adcDurations[selected]||['?','?','?']).map(rule=>rule==='?'?unknown:rule);
 }
 const groups=new Map();
 rules.forEach((rule,index)=>{
  if(!groups.has(rule))groups.set(rule,[]);
  groups.get(rule).push(statuses[index]);
 });
 legend.innerHTML=[...groups].map(([rule,labels])=>'<div><strong>'+esc(rule)+'</strong>'+(groups.size>1?' · '+labels.join(' e ').replace('Titular e Suplente','Titular y Suplente').replace('Interino e Suplente','Interino y Suplente'):'')+'</div>').join('');
}
function cargoProfileNotice(name,institution,position,fields){
 const record=String(name||'').trim()||'Cargo '+position+' · '+(institution||'Institución sin nombre');
 return 'Datos por completar en «'+record+'»: '+fields.join(', ')+'. Revisá Mi perfil docente → Mis instituciones.';
}
function dl01Cargo166(e,i){return selected==='Duelo'&&e.type==='cargo'&&i?.level==='Superior'}
function dl01CodigoCargo(e,i,motivo=selected){
 const nivel=codigoHorasNivel(i?.level);
 if(nivel||e.type!=='cargo'||motivo==='Inasistencias (justificada)')return nivel;
 return String(e.cargoCode||'').trim();
}
function review(){adcRequestFields();adcDurationLegend();let rows=affected(),i=inst.find(i=>String(i.id)===$('escuelaSelect').value),messages=[];if(!$('nombre').value.trim()||!adcPersonalValid($('dni').value,7,8))messages.push('Faltan nombre o DNI válidos en Mi perfil docente.');if(!date($('desde').value)||!date($('hasta').value)||$('hasta').value<$('desde').value)messages.push('Elegí fechas válidas.');if(!i)messages.push('Agregá una institución.');if(i&&!i.name.trim())messages.push('Falta nombre de institución.');if(!rows.length)messages.push('No se encontraron cursos/cargos afectados en esas fechas.');if(rows.some(x=>x.e.type!=='cargo'&&(!turnoNormalizado(x.e.turno)||turnoNormalizado(x.e.turno)==='Otro')))messages.push('Verificá el turno de cada asignatura/cargo en Mi perfil docente.');for(const {e} of rows){
 if(e.type!=='cargo')continue;
 const fields=[];
 if(!String(e.cargoName||'').trim())fields.push('nombre del cargo');
 if(!dl01CodigoCargo(e,i))fields.push('nivel con código de Cargo/Hs. disponible');
 if(!turnoNormalizado(e.turno)||turnoNormalizado(e.turno)==='Otro')fields.push('turno');
 if(!['Titular','Interino','Suplente'].includes(e.revista))fields.push('situación de revista');
 if(fields.length)messages.push(cargoProfileNotice(e.cargoName,i.name,i.entries.indexOf(e)+1,fields));
}if(rows.length>5)messages.push('Más de cinco asignaturas/cargos: se generarán formularios adicionales.');if(selected==='Asuntos particulares'&&rows.some(x=>x.e.revista!=='Titular'))messages.push('Asuntos particulares (231, art. 318-A) figura en el nomenclador solo para titulares. No se puede generar para interinos o suplentes.');if(selected==='Asuntos particulares'&&$('pago').value!=='sin')messages.push('Asuntos particulares corresponde sin goce de haberes; seleccioná esa forma de pago.');if(rows.some(x=>classify()==='inasistencia'&&!mapping(x.e)[0]))messages.push('No existe un código confirmado para esta situación de revista y forma de pago; revisá el encuadre antes de presentar el PDF.');let total=rows.filter(x=>x.e.type==='asignatura').reduce((a,x)=>a+x.h,0);if(selected==='Duelo'){
 const relation=adcDueloRelation();
 if(!relation)messages.push('Elegí un parentesco para calcular el permiso.');
 else for(const revista of new Set(rows.map(({e})=>e.revista))){
  const [code,article]=adcDueloCode(revista,relation);
  messages.push(code?revista+' · Código '+code+' · Art. '+article:revista+' · Confirmá el encuadre de este vínculo con Secretaría.');
 }
}
$('review').innerHTML=`<div class="${messages.length?'warning':'status'}">${messages.length?messages.map(esc).join(' · '):'Datos básicos listos para revisión.'}<br><b>${rows.length} asignaturas/cargos afectados · ${total} horas cátedra de asignaturas afectadas.${window.adcRequestDaySummary?.()||''}</b></div>`+(rows.length?`<table><thead><tr><th>Curso / cargo</th><th>Días afectados</th><th>Horas cátedra</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.e.type==='cargo'?x.e.cargoName:x.e.subject+' · '+window.adcAcademic.course(x.e))} · <b>Turno: ${esc(turnoNormalizado(x.e.turno)||'Sin definir')}</b></td><td>${esc(x.dates.join(', '))}</td><td>${x.e.type==='cargo'?'No aplica':x.h}</td></tr>`).join('')}</tbody></table>`:'');return {rows,i,messages}}
