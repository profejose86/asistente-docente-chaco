(() => {
 if(window.adcConfig?.authMode!=='supabase')return;
 const auth=window.adcAuth,store=window.adcUserStorage,url=new URL(location.href),login=()=>location.replace(new URL('ADC_Ingreso_Editable.html',url).href);
 let current=null,generation=0;
 document.documentElement.classList.add('adc-auth-pending');
 const ready=document.readyState==='loading'?new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true})):Promise.resolve();
 async function screen(text,buttons=[]){
  await ready;let gate=document.getElementById('adcAuthGate');if(!gate){gate=document.createElement('section');gate.id='adcAuthGate';gate.setAttribute('role','status');document.body.append(gate);}gate.replaceChildren();
  const p=document.createElement('p');p.textContent=text;gate.append(p);
  for(const [label,run] of buttons){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=run;gate.append(button);}
 }
 const exit=async()=>{
  document.documentElement.classList.add('adc-auth-pending');window.adcSyncUI?.stop();
  try{await auth.signOut();login()}catch{await screen('No se pudo cerrar la sesión. Revisá la conexión. Tus datos locales siguen conservados.',[['Reintentar',exit],['Volver a verificar mi sesión',()=>location.reload()]])}
 };
 const failed=()=>screen('No se pudo validar la sesión o preparar tu perfil de prueba. Revisá la conexión y la configuración de Supabase.',[['Reintentar',()=>location.reload()],['Volver al ingreso',login]]);
 async function unlock(user){
  const ticket=generation;
  await ready;await auth.profile();if(ticket!==generation)return;current=user.id;
  // Reiniciar los modelos clásicos si cambiaron la identidad o la copia cargada.
  if(store.bind(user.id)){location.reload();return;}
  const result=await window.adcSyncUI.prepare(user);
  if(ticket!==generation)return;
  const latest=await auth.user();
  if(ticket!==generation)return;
  if(latest?.id!==user.id){window.adcSyncUI.stop();location.reload();return;}
  if(result.changed){location.reload();return;}
  document.getElementById('adcAuthGate')?.remove();document.documentElement.classList.remove('adc-auth-pending');
  if(!document.getElementById('adcSessionBar')){
   const bar=document.createElement('aside');bar.id='adcSessionBar';bar.className='adc-session-bar';
   const label=document.createElement('span');label.textContent='Cuenta: '+(user.email||'autenticada');
   const button=document.createElement('button');button.type='button';button.textContent='Cerrar sesión';button.onclick=exit;bar.append(label,button);document.body.append(bar);
   window.adcSyncUI.mount(bar);
   window.adcAccount.mount(bar,user);
  }
 }
 (async()=>{try{if(!auth?.configured)throw Error('Supabase sin configurar');await auth.ready;const user=await auth.user();if(!user){store.lock();login();return;}await unlock(user)}catch{await failed()}})();
 window.addEventListener('adc:account-locked',()=>{generation++;document.documentElement.classList.add('adc-auth-pending')});
 window.addEventListener('adc:auth-changed',event=>{
  const {event:kind,userId}=event.detail||{};
  if(kind==='SIGNED_OUT'){document.documentElement.classList.add('adc-auth-pending');window.adcSyncUI?.stop();login()}
  else if(kind==='SIGNED_IN'&&(current||store.scope())&&(current||store.scope())!==userId){document.documentElement.classList.add('adc-auth-pending');window.adcSyncUI?.stop();location.reload()}
 });
})();
