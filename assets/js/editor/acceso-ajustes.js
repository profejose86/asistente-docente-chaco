(() => {
 const gear=document.getElementById('adcDesignGear'),panel=document.getElementById('adcDesignPanel');
 if(!gear||!panel)return;
 const key='adc-adjustments-tab-session',realAuth=window.adcConfig?.authMode==='supabase';
 let owner=null,ready=false,allowed=!realAuth,clicks=0,tabs=0;
 if(realAuth)gear.setAttribute('data-adc-forbidden','');
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}};
 const save=value=>{try{if(value)sessionStorage.setItem(key,JSON.stringify(value));else sessionStorage.removeItem(key);}catch{}};
 const notifyAdmin=()=>window.dispatchEvent(new CustomEvent('adc:editor-admin',{detail:{isAdmin:realAuth&&allowed,userId:realAuth&&allowed?owner:null}}));
 function lock(){
  // Cerrar mediante el editor para limpiar selección y herramientas activas.
  if(gear.getAttribute('aria-expanded')==='true'&&!gear.hasAttribute('data-adc-locked'))gear.click();
  gear.setAttribute('data-adc-locked','');clicks=0;tabs=0;
 }
 function reveal(){gear.removeAttribute('data-adc-locked');save({owner,visible:true});clicks=0;tabs=0;}
 function identify(id,adminAllowed=!realAuth){
  allowed=realAuth?Boolean(id&&adminAllowed):true;
  gear.toggleAttribute('data-adc-forbidden',realAuth&&!allowed);
  owner=id||'anonymous';ready=true;
  const saved=read();lock();
  if(!allowed){save(null);notifyAdmin();return;}
  if(saved?.owner===owner&&saved.visible)gear.removeAttribute('data-adc-locked');else save(null);
  notifyAdmin();
 }
 window.adcEditorAccess=Object.freeze({
  isAdmin:()=>realAuth&&allowed,
  owner:()=>realAuth&&allowed?owner:null
 });
 // Captura previa al editor: los primeros cinco clics no abren ni arrastran herramientas.
 window.addEventListener('pointerdown',event=>{
  if((gear.hasAttribute('data-adc-locked')||!allowed)&&gear.contains(event.target))event.stopImmediatePropagation();
 },true);
 window.addEventListener('click',event=>{
  if(!gear.contains(event.target)||!gear.hasAttribute('data-adc-locked')&&allowed)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(ready&&allowed&&++clicks>=5)reveal();
 },true);
 window.addEventListener('keydown',event=>{
  if(!gear.hasAttribute('data-adc-locked')||!ready||!allowed||event.repeat)return;
  if(event.key==='Tab'){if(++tabs>=5)reveal();}else tabs=0;
 },true);
 const auth=window.adcAuth;
 const checkServerAdmin=()=>Promise.resolve(auth?.user()).then(u=>{
  const ok=Boolean(u&&(auth?.isAdminUser?auth.isAdminUser(u):u.app_metadata?.adc_role==='admin'));
  identify(u?.id||null,ok);
 }).catch(()=>identify(null,false));
 window.addEventListener('adc:auth-changed',event=>{
  if(event.detail?.event==='SIGNED_OUT'){
   save(null);lock();owner='anonymous';ready=true;allowed=!realAuth;
   gear.toggleAttribute('data-adc-forbidden',realAuth);notifyAdmin();
  }else if(['SIGNED_IN','INITIAL_SESSION'].includes(event.detail?.event)){
   if(realAuth)checkServerAdmin();else identify(event.detail.userId,true);
  }
 });
 if(realAuth){
  const initialOwner=owner;
  Promise.resolve(auth?.ready).then(()=>auth?.user()).then(u=>{
   if(owner===initialOwner){
    const ok=Boolean(u&&(auth?.isAdminUser?auth.isAdminUser(u):u.app_metadata?.adc_role==='admin'));
    identify(u?.id||null,ok);
   }
  }).catch(()=>{save(null);lock();gear.setAttribute('data-adc-forbidden','');ready=false;allowed=false;notifyAdmin();});
 }else identify(null,true);
})();
