
(function(){
 const bubble=$('adcTramiteBubble');
 let timer;
 for(const id of ['frecuentes','listaTramites']){
  const list=$(id);
  list.addEventListener('click',event=>{
   const button=event.target.closest('button[data-adc-tramite]');
   if(!button||!list.contains(button))return;
   const name=button.dataset.adcTramite;
   adcLastCatalogTrigger={list:id,name};
   choose(name);
   clearTimeout(timer);
   const options=document.querySelectorAll('#frecuentes button[data-adc-tramite], #listaTramites button[data-adc-tramite]');
   for(const option of options)option.setAttribute('aria-pressed',String(option.dataset.adcTramite===selected));
   tab('license');
   adcDocsStart(name);
   const summary=$('elegido');
   bubble.textContent='Elegiste '+adcTramiteLabel(name);
   const anchor=summary.getBoundingClientRect();
   const left=Math.max(8,Math.min(anchor.left,window.innerWidth-bubble.offsetWidth-8));
   const above=anchor.top-bubble.offsetHeight-5;
   const top=anchor.bottom+5+bubble.offsetHeight<=window.innerHeight?anchor.bottom+5:above;
   bubble.style.left=left+'px';
   bubble.style.top=Math.max(8,Math.min(top,window.innerHeight-bubble.offsetHeight-8))+'px';
   timer=setTimeout(()=>{
    bubble.textContent='';
   },2000);
  });
 }
})();
