function turnoNormalizado(value){const v=norm(value).trim();return ({manana:'Mañana',matutino:'Mañana',tarde:'Tarde',vespertino:'Vespertino',noche:'Noche',nocturno:'Noche',otro:'Otro'})[v]||'';}
function adcSchoolDefaults(name){
 const key=norm(name).replace(/[."'“”‘’]/g,'').replace(/\s+/g,' ').trim();
 return /^(?:(?:ies|instituto de educacion superior) )?san fernando rey$/.test(key)
  ? {level:'Superior',office:'1438'} : null;
}
function addInst(d={}){const nuevoId=nextId;perfilInstitucionesAbiertas.add(nuevoId);inst.push({id:nextId++,name:d.name||'',office:d.office||'',level:d.level??'Secundario',...adcSchoolDefaults(d.name),entries:(d.entries||[]).map(e=>({...e,turno:turnoNormalizado(e.turno)||'Otro',schedule:Array.isArray(e.schedule)?e.schedule:[0,0,0,0,0,0,0],djUid:e.djUid||djUid(),djIntervals:Array.isArray(e.djIntervals)?e.djIntervals:[],djPeriods:Array.isArray(e.djPeriods)?e.djPeriods:[]}))});render()}
function delInst(id){if(confirm('¿Eliminar institución y sus cursos?')){inst=inst.filter(x=>x.id!==id);render()}}
function addEntry(id){let i=inst.find(x=>x.id===id);let turnoPrevio=i.entries.length?turnoNormalizado(i.entries[i.entries.length-1].turno):'';const nuevoUid=djUid();perfilInstitucionesAbiertas.add(id);perfilCargosAbiertos.add(nuevoUid);i.entries.push({type:'asignatura',course:'',subject:'',cargoName:'',cargoCode:'',revista:'Interino',turno:turnoPrevio||'Otro',schedule:[0,0,0,0,0,0,0],djUid:nuevoUid,djIntervals:[],djPeriods:[]});render()}
function delEntry(id,n){let i=inst.find(x=>x.id===id);i.entries.splice(n,1);render()}
function updI(id,key,v){let i=inst.find(x=>x.id===id);i[key]=v;if(key==='name')updateSelect();if(key==='level')render()}
function updE(id,n,key,v){let e=inst.find(x=>x.id===id).entries[n];e[key]=key==='turno'?(turnoNormalizado(v)||'Otro'):v;if(key==='type')render()}
function adcCourseSuffix(part,value){
 if(!/^\d+$/.test(value))return '';
 if(part==='year')return '°';
 return ({1:'ra',2:'da',3:'ra',4:'ta',5:'ta',6:'ta',7:'ma',8:'va',9:'na',10:'ma'})[Number(value)]||'ª';
}
function adcCourseInput(i,n,entry,part,label){
 const raw=(entry.adcCourseParts||splitCourse(entry.course))[part];
 const value=raw.replace(/^(\d+)(?:[ºª°]|\.?(?:ro|ra|er|da|ta|ma|va|na))$/i,'$1');
 const suffix=adcCourseSuffix(part,value);
 return `<label>${label}<span class="adc-course-number"><input data-course-part="${part}" data-e="${i.id}" data-n="${n}" value="${esc(value)}" inputmode="numeric" pattern="[0-9]*" placeholder="Solo número"><span class="adc-course-suffix" aria-hidden="true"><span>${esc(value)}</span><b>${suffix}</b></span></span></label>`;
}
function updCoursePart(id,n,part,value){
 const entry=inst.find(x=>x.id===id).entries[n];
 const course={...(entry.adcCourseParts||splitCourse(entry.course)),[part]:value.replace(/[^0-9]/g,'')};
 entry.adcCourseParts=course;
 entry.course=[course.year,course.division].filter(Boolean).join(' ');
}
function adcCourseInputChanged(input){
 const digits=input.value.replace(/[^0-9]/g,'');
 if(input.value!==digits)input.value=digits;
 const mirror=input.nextElementSibling;
 mirror.firstElementChild.textContent=digits;
 mirror.lastElementChild.textContent=adcCourseSuffix(input.dataset.coursePart,digits);
 updCoursePart(Number(input.dataset.e),Number(input.dataset.n),input.dataset.coursePart,digits);
}

function updD(id,n,d,v){let e=inst.find(x=>x.id===id).entries[n];e.schedule[d]=Math.max(0,Number(v)||0);let el=$('total-'+id+'-'+n);if(el)el.textContent=e.schedule.slice(0,5).reduce((a,b)=>a+Number(b||0),0)+' horas cátedra por semana';profileRefreshWarnings(e.djUid)}
function codigoHorasNivel(level){const n=String(level||'').trim().toLowerCase();if(n==='secundario')return '111';if(n==='superior'||n==='terciario')return '166';return '';}

const perfilInstitucionesAbiertas=new Set();
const perfilCargosAbiertos=new Set();
const perfilHorariosAbiertos=new Set();
let perfilSeccionesInicializadas=false;
function perfilToggleInstitucion(id){
 const el=document.querySelector('[data-inst-panel="'+id+'"]');
 if(!el)return;
 const open=el.hidden;
 el.hidden=!open;
 const btn=document.querySelector('[data-inst-toggle="'+id+'"]');
 if(btn){btn.setAttribute('aria-expanded',String(open));btn.querySelector('[data-chevron]').textContent=open?'⌃':'⌄';}
 if(open)perfilInstitucionesAbiertas.add(id);else perfilInstitucionesAbiertas.delete(id);
}
function perfilToggleCargo(uid){
 const el=[...document.querySelectorAll('[data-cargo-panel]')].find(x=>x.dataset.cargoPanel===uid);
 if(!el)return;
 const open=el.hidden;el.hidden=!open;
 const btn=[...document.querySelectorAll('[data-cargo-toggle]')].find(x=>x.dataset.cargoToggle===uid);
 if(btn){btn.setAttribute('aria-expanded',String(open));btn.querySelector('[data-chevron]').textContent=open?'⌃':'⌄';}
 if(open)perfilCargosAbiertos.add(uid);else perfilCargosAbiertos.delete(uid);
}
function perfilActualizarResumenes(){
 for(const i of inst){
  const ib=document.querySelector('[data-inst-toggle="'+i.id+'"] .perfil-toggle-label');
  if(ib)ib.textContent=(i.name||'Institución')+' · '+i.entries.length+' cargo(s)';
  for(const e of i.entries){
   const cb=[...document.querySelectorAll('[data-cargo-toggle]')].find(n=>n.dataset.cargoToggle===e.djUid);
   if(!cb)continue;
   const label=cb.querySelector('.perfil-toggle-label');
   if(label)label.textContent=(e.type==='cargo'?(e.cargoName||'Cargo'):(e.subject||'Asignatura')+' · '+(djCourseOrdinal(e.course)||e.course||'Año/división sin indicar'))+' · '+e.schedule.slice(0,5).reduce((a,b)=>a+Number(b||0),0)+' h';
  }
 }
}
// Update summaries after the original profile input handlers have processed edits.
document.addEventListener('input',event=>{
 if(event.target.closest('#instituciones'))queueMicrotask(perfilActualizarResumenes);
});
document.addEventListener('change',event=>{
 if(event.target.closest('#instituciones'))queueMicrotask(perfilActualizarResumenes);
});
function perfilToggleHorarios(uid){
 const panel=[...document.querySelectorAll('[data-horarios-panel]')].find(x=>x.dataset.horariosPanel===uid);
 const btn=[...document.querySelectorAll('[data-horarios-toggle]')].find(x=>x.dataset.horariosToggle===uid);
 if(!panel||!btn)return;
 const abierto=panel.hidden;
 panel.hidden=!abierto;
 btn.setAttribute('aria-expanded',String(abierto));
 btn.querySelector('[data-chevron]').textContent=abierto?'⌃':'⌄';
 if(abierto)perfilHorariosAbiertos.add(uid);else perfilHorariosAbiertos.delete(uid);
}
function perfilPrepararAcordeones(){
 const root=$('instituciones');if(!root)return;
 for(const div of [...root.children]){
  const heading=div.querySelector(':scope > h3');if(!heading)continue;
  const id=Number(div.querySelector('[data-i]')?.dataset.i);
  const i=inst.find(x=>x.id===id);if(!i)continue;
  const btn=document.createElement('button');
  btn.type='button';btn.className='alt perfil-toggle';btn.dataset.instToggle=String(id);
  btn.setAttribute('aria-expanded',String(perfilInstitucionesAbiertas.has(id)));
  btn.innerHTML='<span class="perfil-toggle-label"></span><span data-chevron>'+(perfilInstitucionesAbiertas.has(id)?'⌃':'⌄')+'</span>';
  btn.querySelector('.perfil-toggle-label').textContent=(i.name||heading.textContent)+' · '+i.entries.length+' cargo(s)';
  heading.replaceWith(btn);
  const panel=document.createElement('div');panel.dataset.instPanel=String(id);
  while(btn.nextSibling)panel.append(btn.nextSibling);
  div.append(panel);panel.hidden=!perfilInstitucionesAbiertas.has(id);
  const box=panel.querySelector('[id^="entries-"]');if(!box)continue;
  for(let n=0;n<box.children.length;n++){
   const card=box.children[n], e=i.entries[n];if(!e)continue;
   const uid=e.djUid;
   const title=card.querySelector(':scope > strong');if(!title)continue;
   const cb=document.createElement('button');cb.type='button';cb.className='alt perfil-toggle perfil-cargo-toggle';
   cb.dataset.cargoToggle=uid;
   cb.setAttribute('aria-expanded',String(perfilCargosAbiertos.has(uid)));
   cb.innerHTML='<span class="perfil-toggle-label"></span><span data-chevron>'+(perfilCargosAbiertos.has(uid)?'⌃':'⌄')+'</span>';
   cb.querySelector('.perfil-toggle-label').textContent=(e.type==='cargo'?(e.cargoName||'Cargo'):(e.subject||'Asignatura')+' · '+(e.course||'Año/división sin indicar'))+' · '+e.schedule.slice(0,5).reduce((a,b)=>a+Number(b||0),0)+' h';
   title.replaceWith(cb);
   const body=document.createElement('div');body.dataset.cargoPanel=uid;
   while(cb.nextSibling)body.append(cb.nextSibling);
   card.append(body);body.hidden=!perfilCargosAbiertos.has(uid);
   // Tercer nivel: solo el bloque de intervalos, sin ocultar los datos editables del cargo.
   const extra=body.querySelector('[data-dj-extra]');
   if(extra){
     const horariosBtn=document.createElement('button');
     horariosBtn.type='button';horariosBtn.className='alt perfil-toggle perfil-horarios-toggle';
     horariosBtn.dataset.horariosToggle=uid;
     horariosBtn.setAttribute('aria-expanded',String(perfilHorariosAbiertos.has(uid)));
     horariosBtn.innerHTML='<span class="perfil-toggle-label">◷ Horarios de prestación (DJ-01)</span><span data-chevron>'+(perfilHorariosAbiertos.has(uid)?'⌃':'⌄')+'</span>';
     const horariosPanel=document.createElement('div');horariosPanel.dataset.horariosPanel=uid;
     extra.before(horariosBtn);extra.replaceWith(horariosPanel);horariosPanel.append(extra);
     horariosPanel.hidden=!perfilHorariosAbiertos.has(uid);
     horariosBtn.addEventListener('click',()=>perfilToggleHorarios(uid));
   }
   cb.addEventListener('click',()=>perfilToggleCargo(uid));
  }
  btn.addEventListener('click',()=>perfilToggleInstitucion(id));
 }
}
function render(){let root=$('instituciones');root.innerHTML='';inst.forEach((i,k)=>{let div=document.createElement('div');div.className='inst';div.innerHTML=`<h3>Institución ${k+1}</h3><div class="fields"><label>Nombre / número de institución<input data-i="${i.id}" data-k="name" value="${esc(i.name)}" placeholder="Ej.: EES Nº 83" list="adcKnownSchools"></label><label>Código de oficina (declarado por docente)<input data-i="${i.id}" data-k="office" value="${esc(i.office)}" placeholder="A verificar" ${adcSchoolDefaults(i.name)?'readonly':''}></label><label>Nivel / modalidad<select data-i="${i.id}" data-k="level" ${adcSchoolDefaults(i.name)?'disabled':''}><option value="">Elegí el nivel</option>${['Secundario','Superior','Primario','Otro'].map(x=>`<option ${x===i.level?'selected':''}>${x}</option>`).join('')}</select></label><label>Código de anexo<input disabled placeholder="Reservado para secretaría"></label></div><h3 style="margin-top:18px">Asignaturas y cargos</h3><div id="entries-${i.id}"></div><div class="toolbar"><button class="alt" onclick="addEntry(${i.id})">+ Agregar asignatura/cargo</button><button class="danger" onclick="delInst(${i.id})">Eliminar institución</button></div>`;root.append(div);let box=div.querySelector('#entries-'+i.id);i.entries.forEach((e,n)=>{let code=codigoHorasNivel(i.level);let el=document.createElement('div');el.className='inst';el.style.background='white';const revista=`<label>Situación de revista<input list="adcRevistaOptions" data-revista-i="${i.id}" data-revista-n="${n}" value="${esc(e.revista)}" placeholder="Escribí titular, ascenso o traslado"></label>`;el.innerHTML=`<strong>Asignatura / cargo ${n+1}</strong><div class="fields${e.type==='asignatura'?' adc-subject-fields':''}"><label>Tipo de prestación<select data-e="${i.id}" data-n="${n}" data-k="type"><option value="asignatura" ${e.type==='asignatura'?'selected':''}>Asignatura · horas cátedra</option><option value="cargo" ${e.type==='cargo'?'selected':''}>Cargo (ej.: bedel)</option></select></label>${e.type==='asignatura'?`${revista}<label>Código de Cargo/Hs. (automático)<input readonly value="${code}" placeholder="Sin código automático para este nivel"></label><label>Asignatura<input data-e="${i.id}" data-n="${n}" data-k="subject" value="${esc(e.subject)}" placeholder="Ej.: Inglés / Fonética IV"></label>${adcCourseInput(i,n,e,'year','Año')}${adcCourseInput(i,n,e,'division','División / sección')}`:`<label>Nombre del cargo<input data-e="${i.id}" data-n="${n}" data-k="cargoName" value="${esc(e.cargoName)}" placeholder="Ej.: Bedel"></label><label>Código de Cargo/Hs. (automático)<input readonly value="${code}" placeholder="Sin código automático para este nivel"></label>`}${e.type==='asignatura'?'':revista}<label>Turno<select data-e="${i.id}" data-n="${n}" data-k="turno">${['Mañana','Tarde','Noche','Vespertino','Otro'].map(x=>`<option ${x===e.turno?'selected':''}>${x}</option>`).join('')}</select></label></div><div class="small" style="margin-top:12px">${e.type==='cargo'?'Días de prestación (1 = trabaja ese día; no se computan horas cátedra de cargos)':'Cantidad de horas cátedra por día (secundario: 40 minutos por hora)'}</div><div class="daygrid">${days.map((d,j)=>`<label>${d}<input type="number" min="0" max="24" step="1" value="${Number(e.schedule[j])||0}" onchange="updD(${i.id},${n},${j},this.value)"></label>`).join('')}</div><div class="mini" id="total-${i.id}-${n}">${e.schedule.slice(0,5).reduce((a,b)=>a+Number(b||0),0)} ${e.type==='cargo'?'días/indicadores por semana':'horas cátedra por semana'}</div><button class="danger" onclick="delEntry(${i.id},${n})">Quitar asignatura/cargo</button>`;box.append(el)})});root.querySelectorAll('[data-revista-i]').forEach(input=>input.addEventListener('change',()=>adcRevistaPick(input,Number(input.dataset.revistaI),Number(input.dataset.revistaN))));
root.querySelectorAll('[data-i]').forEach(x=>{
 if(x.dataset.k==='name'){
  x.addEventListener('change',()=>{
   const school=inst.find(i=>i.id===Number(x.dataset.i));
   const previous=adcSchoolDefaults(school.name), next=adcSchoolDefaults(x.value);
   school.name=x.value;
   if(next)Object.assign(school,next);
   else if(previous)Object.assign(school,{level:'',office:''});
   if(next||previous)render();else updateSelect();
  });
 }else x.addEventListener('input',()=>updI(Number(x.dataset.i),x.dataset.k,x.value));
});root.querySelectorAll('[data-course-part]').forEach(x=>x.addEventListener('input',()=>adcCourseInputChanged(x)));root.querySelectorAll('[data-e]:not([data-course-part])').forEach(x=>x.addEventListener('change',()=>updE(Number(x.dataset.e),Number(x.dataset.n),x.dataset.k,x.value)));root.querySelectorAll('[data-e]:not([data-course-part])').forEach(x=>x.addEventListener('input',()=>{if(x.tagName==='INPUT')updE(Number(x.dataset.e),Number(x.dataset.n),x.dataset.k,x.value)}));updateSelect();djProfileExtras();perfilPrepararAcordeones()}
function updateSelect(){let s=$('escuelaSelect'),old=s.value;s.innerHTML='<option value="">Elegí una institución</option>'+inst.map(i=>`<option value="${i.id}">${esc(i.name||'Institución sin nombre')}</option>`).join('');if(inst.some(i=>String(i.id)===old))s.value=old}

// Antigüedad cronológica: meses completos desde la primera designación.
