// Presentación de la cuenta. Las acciones pertenecen a sesión y sincronización.
(() => {
 function mount(bar,user){
  if(document.getElementById('adcProfileBtn'))return;
  const menu=document.createElement('div');menu.id='adcProfileMenu';menu.hidden=true;
  const heading=document.createElement('strong');heading.textContent='Mi cuenta docente';
  for(const button of bar.querySelectorAll('button')){
   if(button.textContent==='Cerrar sesión')button.id='adcLogoutBtn';
   if(button.textContent==='Mis datos / sincronización')button.id='adcSyncBtn';
  }
  menu.append(heading,...bar.childNodes);
  const trigger=document.createElement('button');trigger.type='button';trigger.id='adcProfileBtn';
  trigger.setAttribute('aria-label','Mi cuenta docente');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',menu.id);
  const avatar=document.createElement('span');avatar.className='adc-avatar';avatar.setAttribute('aria-hidden','true');
  const name=user?.user_metadata?.display_name||user?.user_metadata?.full_name||document.getElementById('perfilNombres')?.value||user?.email||'Docente';
  avatar.textContent=Array.from(String(name).trim())[0]?.toLocaleUpperCase('es')||'D';
  const arrow=document.createElement('span');arrow.textContent='⌄';arrow.setAttribute('aria-hidden','true');
  trigger.append(avatar,arrow);bar.classList.add('adc-account');bar.append(trigger,menu);
  const close=()=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false')};
  trigger.addEventListener('click',()=>{menu.hidden=!menu.hidden;trigger.setAttribute('aria-expanded',String(!menu.hidden))});
  document.addEventListener('click',event=>{if(!bar.contains(event.target))close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){close();trigger.focus()}});
  bar.addEventListener('focusout',event=>{if(!bar.contains(event.relatedTarget))close()});
  menu.addEventListener('click',event=>{if(event.target.closest('button'))close()});
 }
 window.adcAccount=Object.freeze({mount});
 // La demo usa el mismo componente y no representa una cuenta autenticada.
 if(window.adcConfig?.authMode!=='supabase')document.addEventListener('DOMContentLoaded',()=>{
  if(document.getElementById('adcProfileBtn'))return;
  const bar=document.createElement('aside');bar.id='adcSessionBar';bar.className='adc-session-bar';
  const label=document.createElement('small');label.textContent='Vista de demostración';
  const logout=document.createElement('button');logout.type='button';logout.textContent='Cerrar sesión';
  logout.onclick=()=>location.assign(new URL('ADC_Ingreso_Editable.html',location.href).href);
  bar.append(label,logout);document.body.append(bar);mount(bar,{email:'Docente'});
 });
})();
