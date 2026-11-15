let adcAntiguedadModo='auto';
// Extensión del perfil existente: sin claves de almacenamiento ni clientes nuevos.
let adcPersonalExtra={nacimiento:'',celular:''};
function adcBirthDate(value){
 const raw=String(value||'').trim(),match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw),iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
 if(!match&&!iso)return null;
 const [y,m,d]=iso?iso.slice(1).map(Number):[Number(match[3]),Number(match[2]),Number(match[1])],date=new Date(y,m-1,d),now=new Date();
 if(y<1000||date.getFullYear()!==y||date.getMonth()!==m-1||date.getDate()!==d||date>now)return null;
 return {year:String(y),iso:`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,display:`${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`};
}
function adcSyncBirthDate(){
 const input=$('perfilNacimiento');if(!input)return;
 const parsed=adcBirthDate(input.value),invalid=Boolean(input.value.trim())&&!parsed;
 input.setCustomValidity(invalid?'Ingresá una fecha de nacimiento válida con formato dd/mm/aaaa, que no sea futura.':'');
 input.setAttribute('aria-invalid',String(invalid));
 $('perfilClase').value=parsed?parsed.year:'';
 adcPersonalExtra.nacimiento=parsed?parsed.iso:input.value.trim();
 adcRefreshPending();
}
function adcPersonalExtras(){
 const birth=$('perfilNacimiento'),cell=$('perfilCelular');
 if(birth){const parsed=adcBirthDate(birth.value);adcPersonalExtra.nacimiento=parsed?parsed.iso:birth.value.trim();}
 if(cell)adcPersonalExtra.celular=cell.value;
 const parsed=adcBirthDate(adcPersonalExtra.nacimiento);
 return {...adcPersonalExtra,...(parsed?{clase:parsed.year}:{})};
}
function adcRestorePersonalExtras(profile={}){
 adcPersonalExtra={nacimiento:String(profile.nacimiento||''),celular:String(profile.celular||'')};
 const parsed=adcBirthDate(adcPersonalExtra.nacimiento),birth=$('perfilNacimiento'),cell=$('perfilCelular');
 if(birth){birth.value=parsed?parsed.display:adcPersonalExtra.nacimiento;birth.setCustomValidity(birth.value&&!parsed?'Ingresá una fecha de nacimiento válida con formato dd/mm/aaaa.':'');birth.setAttribute('aria-invalid',String(Boolean(birth.value)&&!parsed));}
 if(cell)cell.value=adcPersonalExtra.celular;
 if(parsed)$('perfilClase').value=parsed.year;
 if(typeof window.adcPreviewRefreshProfile==='function')window.adcPreviewRefreshProfile();
}
async function adcPrefillAccountEmail(){
 const auth=window.adcAuth,store=window.adcUserStorage,input=$('correo');if(!auth?.configured||!input||input.value.trim())return;
 const owner=store?.scope?.(),before=input.value;
 try{await auth.ready;const user=await auth.user();if(!user?.email||input.value!==before||owner!==store?.scope?.()||(store?.scope?.()&&store.scope()!==user.id))return;input.value=user.email;}catch{}
}
function adcAntiguedadManual(valor){
 const v=String(valor||'').trim(),hidden=$('perfilAntiguedad');
 adcAntiguedadModo='manual';
 hidden.value=/^\d+$/.test(v)?`${Number(v)} ${Number(v)===1?'año':'años'}`:v;
 adcRefreshPending();
 if(typeof djRender==='function'&&$('dj')&&!$('dj').classList.contains('hide'))djRender();
}
function adcActualizarAntiguedad(refrescar=true){
 const inicio=$('perfilInicioActividad'),salida=$('perfilAntiguedadVista'),oculto=$('perfilAntiguedad');
 if(!inicio||!salida||!oculto)return;
 const raw=inicio.value,hoy=new Date(),actual=new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate());
 let valido=false,resultado='';
 if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
  const [y,m,d]=raw.split('-').map(Number),fecha=new Date(y,m-1,d);
  if(fecha.getFullYear()===y&&fecha.getMonth()===m-1&&fecha.getDate()===d&&fecha<=actual){
   const meses=(actual.getFullYear()-y)*12+actual.getMonth()-(m-1)-(actual.getDate()<d?1:0);
   const anios=Math.floor(meses/12),resto=meses%12;
   resultado=`${anios} ${anios===1?'año':'años'}, ${resto} ${resto===1?'mes':'meses'}`;valido=true;
  }
 }
 if(adcAntiguedadModo!=='manual'){
  if(valido){oculto.value=resultado;salida.value=resultado;}
  else if(!raw){oculto.value='';salida.value='';}
 }
 inicio.setCustomValidity(raw&&!valido?'Ingresá una fecha válida que no sea futura.':'');
 adcRefreshPending();
 if(refrescar&&typeof djRender==='function'&&$('dj')&&!$('dj').classList.contains('hide'))djRender();
}
function adcSetAntiguedadAuto(){adcAntiguedadModo='auto';adcActualizarAntiguedad();}
function adcRefreshPending(){
 const fields=['nombre','dni','sexo','perfilClase','perfilLocalidad','perfilTitulo','perfilOtorgado','perfilRegistro','perfilAntiguedadVista'];
 fields.forEach(id=>{const el=$(id);if(!el)return;const empty=!String(id==='perfilAntiguedadVista'?$('perfilAntiguedad').value:el.value||'').trim();
 el.classList.toggle('adc-pending-input',empty);
 let label=el.closest('label');if(label){let mark=label.querySelector('[data-adc-pending]');if(!mark){mark=document.createElement('span');mark.dataset.adcPending='1';mark.className='adc-field-warning';mark.textContent='*';mark.title='Recordá completar este dato';const caption=label.querySelector('.adc-preview-caption');if(caption)caption.append(mark);else label.insertBefore(mark,label.firstChild.nextSibling)}mark.style.display=empty?'inline':'none';}
 });
 const ini=$('perfilInicioActividad');if(ini){const mark=$('inicioAlerta');if(mark)mark.style.display=ini.value?'none':'none';}
 const note=$('adcProfilePendingNote');if(note){const missing=adcMissingFields();note.textContent=missing.length?'⚠ Datos pendientes: '+missing.join(', ')+'. Podés completarlos ahora o desde Declaraciones juradas.':'✓ Los datos personales necesarios para DJ-01 están completos.';}
}
function adcMissingFields(){
 return [['nombre','Nombre y apellido'],['dni','DNI'],['sexo','Sexo'],['perfilClase','Año de nacimiento'],['perfilDomicilio','Domicilio'],['perfilLocalidad','Localidad'],['perfilTitulo','Título'],['perfilOtorgado','Otorgado por'],['perfilRegistro','N.º de registro'],['perfilAntiguedad','Antigüedad']].filter(([id])=>!String($(id)?.value||'').trim()).map(x=>x[1]);
}
function adcPersonalDigits(value){return String(value??'').replace(/\D/g,'')}
function adcPersonalFormat(value,id){
 const raw=String(value??'').trim();
 const digits=adcPersonalDigits(raw);
 if(!/^[\d.]+$/.test(raw)||!digits)return raw;
 if(id==='perfilClase'&&digits.length!==4)return raw;
 return digits.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
}
function adcPersonalValid(value,min,max=min){
 const raw=String(value??'').trim();
 const n=adcPersonalDigits(raw).length;
 return /^[\d.]+$/.test(raw)&&n>=min&&n<=max;
}
for(const id of ['dni','perfilRegistro','perfilClase']){
 $(id).addEventListener('blur',()=>{
  const field=$(id);
  field.value=adcPersonalFormat(field.value,id);
  field.dispatchEvent(new Event('input',{bubbles:true}));
 });
}
function adcSetSharedField(id,value){const el=$(id);if(!el)return;
 if(id==='perfilNacimiento'){el.value=value;adcSyncBirthDate();}
 else if(id==='perfilAntiguedad'){adcAntiguedadModo='manual';el.value=String(value||'').trim();$('perfilAntiguedadVista').value=value;}
 else el.value=['dni','perfilRegistro','perfilClase'].includes(id)?adcPersonalFormat(value,id):value;
 if(id==='perfilLocalidad'&&typeof window.adcAplicarGeografiaPerfil==='function')window.adcAplicarGeografiaPerfil();
 adcRefreshPending();(globalThis.adcUserStorage||localStorage).setItem('adc_v08',JSON.stringify(data()));
 if(typeof djRender==='function')djRender();
}
function adcSharedEditorHTML(){const fields=[['nombre','Nombre y apellido'],['dni','DNI'],['sexo','Sexo'],[$('perfilNacimiento')?'perfilNacimiento':'perfilClase',$('perfilNacimiento')?'Fecha de nacimiento':'Año de nacimiento'],['perfilDomicilio','Domicilio'],['perfilLocalidad','Localidad'],['perfilTitulo','Título que posee'],['perfilOtorgado','Otorgado por'],['perfilRegistro','N.º de registro'],['perfilAntiguedad','Antigüedad docente']];
 const missing=fields.filter(([id])=>!String($(id)?.value||'').trim());
 return `<div class="adc-shared-editor"><b>⚠ Datos personales pendientes (${missing.length})</b><p class="small">Completalos aquí sin salir de Declaraciones juradas. Se guardan también en Mi perfil docente.</p>${missing.length?missing.map(([id,label])=>`<label>${esc(label)} <span class="adc-field-warning" title="Recordá completar este dato">*</span><input data-adc-shared="${id}" value="" placeholder="Completar ${esc(label.toLowerCase())}"></label>`).join(''):'<p class="small">Todos los datos personales están completos.</p>'}</div>`;
}
function adcDeclarationState(){
 const missing=adcMissingFields();const rows=djSnapshotRows();const issues=adcDjTransferMode()?adcTransferIssues():[];
 if(!rows.length)issues.push('No hay cargos seleccionados');
 if($('perfilClase').value&&!adcPersonalValid($('perfilClase').value,4))issues.push('Revisá el año de la fecha de nacimiento.');
 if($('perfilNacimiento')?.value&&!adcBirthDate($('perfilNacimiento').value))issues.push('Revisá la fecha de nacimiento: debe ser válida y no futura.');
 rows.forEach((r,i)=>{
 if(r.type==='cargo'){
  const fields=[];
  if(!String(r.subject||'').trim())fields.push('nombre del cargo');
  if(!r.revista)fields.push('situación de revista');
  if(!r.period?.desde)fields.push('fecha de alta');
  if(r.period?.modo==='fecha'&&!r.period?.hasta)fields.push('fecha de baja');
  if(!r.affected&&(!r.intervals?.length||r.intervals.some(v=>!v.start||!v.end)))fields.push('horarios de ingreso y egreso');
  if(fields.length)issues.push(cargoProfileNotice(r.subject,r.institution,r.profilePosition||i+1,fields));
  return;
 }
 if(!r.period?.desde)issues.push('Falta fecha de alta en cargo '+(i+1));if(r.period?.modo==='fecha'&&!r.period?.hasta)issues.push('Falta fecha de baja en cargo '+(i+1));
 (r.intervals||[]).forEach(t=>{if(!t.start||!t.end)return;const a=t.start.split(':').map(Number),b=t.end.split(':').map(Number),delta=b[0]*60+b[1]-a[0]*60-a[1];if(r.type!=='cargo'&&delta!==40)issues.push('Intervalo de '+(i+1)+' no tiene 40 minutos');});});
 return {ready:missing.length===0&&issues.length===0,missing,issues};
}
function adcDeclarationBannerHTML(){const x=adcDeclarationState();return `<div class="adc-status ${x.ready?'ready':'draft'}">${x.ready?'✓ Lista para presentar':'! Borrador'}</div>${!x.ready?`<p class="small">${esc([...x.missing,...x.issues].slice(0,5).join(' · '))}${x.missing.length+x.issues.length>5?' · …':''}</p>`:''}`;}
window.addEventListener('DOMContentLoaded',()=>{adcActualizarAntiguedad(false);if(typeof window.adcAplicarGeografiaPerfil==='function')window.adcAplicarGeografiaPerfil();document.querySelectorAll('#profile input,#profile select').forEach(el=>el.addEventListener('change',adcRefreshPending));});
window.addEventListener('DOMContentLoaded',()=>{adcPrefillAccountEmail();});

