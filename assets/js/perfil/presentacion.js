// Distribución aprobada. Conserva controles y el registro histórico del editor.
(()=>{
 document.addEventListener('DOMContentLoaded',()=>{
 const personal=document.querySelector('#profile > section');personal.classList.add('adc-preview-personal');
 document.getElementById('perfilApellidos').placeholder='Ej.: Pérez';document.getElementById('perfilNombres').placeholder='Ej.: Juan Pablo';
 // Fecha completa visible; el contrato histórico sigue recibiendo el año.
 const legacyYear=document.getElementById('perfilClase'),year=legacyYear.closest('label');
 for(const node of year.childNodes)if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim()){node.textContent='Fecha de nacimiento';break;}
 const birth=document.createElement('input');birth.id='perfilNacimiento';birth.type='text';birth.inputMode='numeric';birth.placeholder='dd/mm/aaaa';birth.maxLength=10;birth.setAttribute('aria-label','Fecha de nacimiento, día mes y año');
 legacyYear.before(birth);legacyYear.type='hidden';
 birth.addEventListener('input',adcSyncBirthDate);
 const cellLabel=document.createElement('label'),cell=document.createElement('input');cell.id='perfilCelular';cell.type='tel';cell.autocomplete='tel';cell.placeholder='Ej.: 3624539175';cellLabel.append(document.createTextNode('Celular'),cell);personal.querySelector('.fields').append(cellLabel);
 const titleSource=document.getElementById('perfilTitulo'),title=document.createElement('textarea');title.id='perfilTituloEdicion';title.rows=1;title.placeholder=titleSource.placeholder;titleSource.before(title);titleSource.type='hidden';
 const resizeTitle=()=>{title.style.height='42px';title.style.height=Math.max(42,Math.min(64,title.scrollHeight+2))+'px'};
 title.addEventListener('input',()=>{titleSource.value=title.value;titleSource.dispatchEvent(new Event('input',{bubbles:true}));resizeTitle()});
 title.addEventListener('change',()=>titleSource.dispatchEvent(new Event('change',{bubbles:true})));
 for(const label of personal.querySelectorAll('label')){
  const caption=document.createElement('span');caption.className='adc-preview-caption';
  while(label.firstChild&&!['INPUT','SELECT','TEXTAREA'].includes(label.firstChild.nodeName))caption.append(label.firstChild);
  label.prepend(caption);
 }
 const arrangeProfile=()=>{
  const phone=document.getElementById('perfilTelefonoFijo'),address=personal.querySelector('.adc-profile-address .fields');
  if(!phone||!address)return false;
  const fields=personal.querySelector('.fields');fields.classList.add('adc-preview-personal-grid');
  const positions={perfilNacimiento:'birth',sexo:'sex',correo:'email',perfilCelular:'phone',perfilTitulo:'title',perfilRegistro:'registration',perfilOtorgado:'issuer',perfilAntiguedadVista:'seniority',perfilInicioActividad:'start'};
  for(const [id,area] of Object.entries(positions)){const label=document.getElementById(id).closest('label');label.style.gridArea=area;fields.append(label);}
  for(const id of ['perfilDomicilio','perfilNumeroCalle','perfilUnidad','perfilManzana','perfilBarrio','perfilLocalidad','perfilCodigoPostal','perfilDepartamento']){
   const label=document.getElementById(id).closest('label');label.dataset.adcAddressField=id;label.style.removeProperty('grid-area');address.append(label);
  }
  const labels={perfilUnidad:'Depto., casa, UF y N.º',perfilManzana:'Manzana, torre, parcela',sexo:'Sexo',correo:'Correo electrónico',perfilAntiguedadVista:'Antigüedad docente',perfilInicioActividad:'Inicio de actividad docente (opcional)'};
  for(const label of personal.querySelectorAll('label')){
   let caption=label.querySelector('.adc-preview-caption');if(!caption){caption=document.createElement('span');caption.className='adc-preview-caption';while(label.firstChild&&!['INPUT','SELECT','TEXTAREA'].includes(label.firstChild.nodeName))caption.append(label.firstChild);label.prepend(caption);}
   const id=label.querySelector('input:not([type=hidden]),select')?.id;
   if(labels[id]){for(const node of caption.childNodes)if(node.nodeType===Node.TEXT_NODE){node.textContent=labels[id];break;}}
  }
  document.getElementById('perfilDomicilio').placeholder='Calle, Av., S/N';phone.placeholder='Ej.: 3624539175';
  const titleRow=document.createElement('div');titleRow.className='adc-preview-title-row';fields.append(titleRow);
  for(const id of ['perfilTitulo','perfilRegistro']){const label=document.getElementById(id).closest('label');label.style.removeProperty('grid-area');titleRow.append(label);}
  const previous=document.createElement('details');previous.className='adc-preview-old-phone';const summary=document.createElement('summary');summary.textContent='Teléfono fijo guardado anteriormente';previous.append(summary,phone.closest('label'));address.parentElement.after(previous);
  const legacyHint=document.createElement('small');legacyHint.className='small';birth.after(legacyHint);
  window.adcPreviewRefreshProfile=()=>{title.value=titleSource.value;resizeTitle();previous.hidden=!phone.value;legacyHint.textContent=!birth.value&&legacyYear.value?'Año conservado del perfil anterior: '+adcPersonalDigits(legacyYear.value)+'. Completá día y mes para registrar tu fecha.':'';legacyHint.hidden=!legacyHint.textContent;};
  adcRestorePersonalExtras(adcPersonalExtra);adcPrefillAccountEmail();
  const required=[['perfilTituloEdicion','Título que posee'],['perfilRegistro','N.º de registro'],['perfilOtorgado','Otorgado por'],['perfilAntiguedadVista','Antigüedad docente']];
  for(const [id] of required){const control=document.getElementById(id);control.required=true;control.closest('label').dataset.previewRequired='';const caption=control.closest('label').querySelector('.adc-preview-caption');for(const mark of control.closest('label').querySelectorAll('[data-adc-pending],#antiguedadAlerta'))caption.append(mark);}
  document.getElementById('perfilDomicilio').closest('label').querySelectorAll('[data-adc-pending]').forEach(mark=>mark.hidden=true);
  window.addEventListener('resize',resizeTitle);
  return true;
 };
 if(!arrangeProfile()){const observer=new MutationObserver(()=>{if(arrangeProfile())observer.disconnect()});observer.observe(personal,{childList:true,subtree:true});}
 },{once:true});
})();
