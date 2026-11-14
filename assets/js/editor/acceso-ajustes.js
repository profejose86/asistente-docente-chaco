(() => {
 const gear=document.getElementById('adcDesignGear'),panel=document.getElementById('adcDesignPanel');
 if(!gear||!panel)return;
 const key='adc-adjustments-tab-session';
 let owner=null,ready=false,clicks=0,tabs=0;
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}};
 const save=value=>{try{if(value)sessionStorage.setItem(key,JSON.stringify(value));else sessionStorage.removeItem(key);}catch{}};
 function lock(){
  // Cerrar mediante el editor para limpiar selección y herramientas activas.
  if(gear.getAttribute('aria-expanded')==='true'&&!gear.hasAttribute('data-adc-locked'))gear.click();
  gear.setAttribute('data-adc-locked','');clicks=0;tabs=0;
 }
 function reveal(){gear.removeAttribute('data-adc-locked');save({owner,visible:true});clicks=0;tabs=0;}
 function identify(id){
  owner=id||'anonymous';ready=true;
  const saved=read();lock();if(saved?.owner===owner&&saved.visible)gear.removeAttribute('data-adc-locked');else save(null);
 }
 // Captura previa al editor: los primeros cinco clics no abren ni arrastran herramientas.
 window.addEventListener('pointerdown',event=>{
  if(gear.hasAttribute('data-adc-locked')&&gear.contains(event.target))event.stopImmediatePropagation();
 },true);
 window.addEventListener('click',event=>{
  if(!gear.hasAttribute('data-adc-locked')||!gear.contains(event.target))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(ready&&++clicks>=5)reveal();
 },true);
 window.addEventListener('keydown',event=>{
  if(!gear.hasAttribute('data-adc-locked')||!ready||event.repeat)return;
  if(event.key==='Tab'){if(++tabs>=5)reveal();}else tabs=0;
 },true);
 window.addEventListener('adc:auth-changed',event=>{
  if(event.detail?.event==='SIGNED_OUT'){save(null);lock();owner='anonymous';ready=true;}
  else if(['SIGNED_IN','INITIAL_SESSION'].includes(event.detail?.event))identify(event.detail.userId);
 });
 const auth=window.adcAuth;
 if(window.adcConfig?.authMode==='supabase'){
  const initialOwner=owner;
  Promise.resolve(auth?.ready).then(()=>auth?.user()).then(user=>{if(owner===initialOwner)identify(user?.id);}).catch(()=>{save(null);lock();ready=false;});
 }else identify(null);
})();
