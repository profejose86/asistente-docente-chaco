
/* v0.9.16.19j: mostrar zoom al mover mouse; ocultar tras inactividad. */
(function(){
 const bar=document.querySelector('#dj .adc-dj-view-controls');
 const dj=document.getElementById('dj');
 const history=document.getElementById('djHistory');
 if(!bar||!dj)return;
 let timer=null;
 const active=()=>!dj.classList.contains('hide')&&(!history||history.classList.contains('hide'));
 function hide(){
   if(bar.matches(':hover')||bar.contains(document.activeElement))return;
   bar.classList.remove('adc-zoom-visible');
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(hide,1700)}
 function reveal(){
   if(!active()){bar.classList.remove('adc-zoom-visible');return}
   bar.classList.add('adc-zoom-visible');schedule();
 }
 document.addEventListener('pointermove',e=>{
   if(e.pointerType==='mouse'||e.pointerType==='pen')reveal();
 },{passive:true});
 bar.addEventListener('pointerenter',()=>{clearTimeout(timer);if(active())bar.classList.add('adc-zoom-visible')});
 bar.addEventListener('pointerleave',schedule);
 bar.addEventListener('focusin',()=>{clearTimeout(timer);if(active())bar.classList.add('adc-zoom-visible')});
 bar.addEventListener('focusout',schedule);
 bar.addEventListener('pointerdown',()=>{clearTimeout(timer);bar.classList.add('adc-zoom-visible')});
 bar.addEventListener('pointerup',schedule);
 document.addEventListener('keydown',e=>{if(active()&&e.key==='Tab')reveal()});
 document.addEventListener('touchstart',e=>{if(active()&&e.target.closest('#dj'))reveal()},{passive:true});
})();
