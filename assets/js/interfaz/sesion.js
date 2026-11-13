(() => {
 if(window.adcConfig?.authMode!=='supabase')return;
 const auth=window.adcAuth,url=new URL(location.href),login=()=>location.replace(new URL('ADC_Ingreso_Editable.html',url).href);
 document.documentElement.classList.add('adc-auth-pending');
 const ready=document.readyState==='loading'?new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true})):Promise.resolve();
 async function screen(text,buttons=[]){
  await ready;let gate=document.getElementById('adcAuthGate');if(!gate){gate=document.createElement('section');gate.id='adcAuthGate';gate.setAttribute('role','status');document.body.append(gate);}gate.replaceChildren();
  const p=document.createElement('p');p.textContent=text;gate.append(p);
  for(const [label,run] of buttons){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=run;gate.append(button);}
 }
 const exit=async()=>{try{await auth.signOut();login();}catch{await screen('No se pudo cerrar la sesión. Revisá la conexión.',[['Reintentar',exit]]);}};
 const failed=()=>screen('No se pudo validar la sesión o preparar tu perfil de prueba. Revisá la conexión y la configuración de Supabase.',[['Reintentar',()=>location.reload()],['Volver al ingreso',login]]);
 async function unlock(user){
  await ready;await auth.profile();
  const ownerKey='adc-auth-local-owner',owner=localStorage.getItem(ownerKey);
  if(owner&&owner!==user.id){await screen('Este navegador tiene borradores de otra cuenta. Para conservarlos, usá otro perfil de Chrome con tu cuenta.',[['Cerrar sesión',exit]]);return;}
  if(!owner){
   const hasDrafts=Object.keys(localStorage).some(key=>/^adc[_-]/.test(key)&&!/^adc-supabase-auth/.test(key)&&!['adc-auth-local-owner','adc-login-theme','adc-theme'].includes(key));
   if(hasDrafts){await screen('Este navegador ya tiene datos docentes. ¿Querés conservarlos y usarlos con esta cuenta? No se subirán automáticamente.',[['Usar mis datos de este navegador',()=>{localStorage.setItem(ownerKey,user.id);unlock(user).catch(failed);} ],['Cerrar sesión',exit]]);return;}
   localStorage.setItem(ownerKey,user.id);
  }
  document.getElementById('adcAuthGate')?.remove();document.documentElement.classList.remove('adc-auth-pending');
  if(!document.getElementById('adcSessionBar')){
   const bar=document.createElement('aside');bar.id='adcSessionBar';bar.className='adc-session-bar';
   const label=document.createElement('span');label.textContent='Cuenta de prueba: '+(user.email||'autenticada');
   const button=document.createElement('button');button.type='button';button.textContent='Cerrar sesión';button.onclick=exit;bar.append(label,button);document.body.append(bar);
  }
 }
 (async()=>{try{if(!auth?.configured)throw Error('Supabase sin configurar');await auth.ready;const user=await auth.user();if(!user){login();return;}await unlock(user);}catch{await failed();}})();
 window.addEventListener('adc:auth-changed',event=>{if(event.detail?.event==='SIGNED_OUT')login();else if(event.detail?.event==='SIGNED_IN'&&localStorage.getItem('adc-auth-local-owner')&&localStorage.getItem('adc-auth-local-owner')!==event.detail.userId)location.reload();});
})();
