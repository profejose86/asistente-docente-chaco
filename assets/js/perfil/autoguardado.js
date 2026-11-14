// El formulario es la fuente de los cambios: guardar al editar, no sólo al pulsar Guardar.
(() => {
 if(window.adcConfig?.authMode!=='supabase')return;
 function mount(){
  const profile=document.getElementById('profile'),store=window.adcUserStorage;
  if(!profile||!store)return;
  const manual=profile.querySelector('button[onclick="save()"]');
  const notice=manual?.parentElement.querySelector('p.small');
  if(manual)manual.textContent='Guardar perfil ahora';
  if(notice)notice.textContent='El perfil se guarda automáticamente en este dispositivo al editarlo. Se sincroniza con tu cuenta sólo si lo autorizás en «Mis datos / sincronización». Sin conexión, los cambios quedan pendientes.';
  const status=document.createElement('p');status.id='adcProfileSaveStatus';status.className='small';status.setAttribute('role','status');manual?.parentElement.append(status);
  function persist(){
   if(document.documentElement.classList.contains('adc-auth-pending')||!store.scope())return false;
   try{
    const raw=JSON.stringify(data());
    if(raw!==store.getItem('adc_v08'))store.setItem('adc_v08',raw);
    status.textContent='Cambios del perfil guardados en este dispositivo.';return true;
   }catch(error){status.textContent='No se pudo guardar el perfil: '+error.message;return false;}
  }
  // Los listeners de cada control actualizan primero el modelo. La delegación
  // conserva el comportamiento de campos dinámicos e instituciones nuevas.
  for(const event of ['input','change'])profile.addEventListener(event,e=>{
   if(e.target.matches('input:not([type="file"]),select,textarea'))persist();
  });
  profile.addEventListener('click',e=>{
   const button=e.target.closest('button');if(!button)return;
   if(button.closest('#instituciones')||button.getAttribute('onclick')==='addInst()')persist();
  });
  window.adcProfileDraft={save:persist};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
