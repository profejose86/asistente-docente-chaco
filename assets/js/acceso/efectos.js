// Tipeo real, sin forzar una línea que desbordaría la columna o el celular.
(() => {
 const title=document.querySelector('.main-title'),motion=matchMedia('(prefers-reduced-motion: reduce)');
 if(!title||motion.matches)return;
 const full=title.textContent,characters=Array.from(full),previousMin=title.style.minHeight,previousLabel=title.getAttribute('aria-label');
 let frame=0,done=false,last=full;
 const observer=new MutationObserver(()=>{if(title.textContent!==last)finish(false);});
 const watch=()=>observer.observe(title,{childList:true,subtree:true,characterData:true});
 function write(text){observer.disconnect();title.textContent=text;last=text;watch();}
 function measure(){
  const current=title.textContent;observer.disconnect();title.style.minHeight=previousMin;title.textContent=full;
  const height=title.getBoundingClientRect().height;title.textContent=current;title.style.minHeight=height+'px';watch();
 }
 function finish(restore=true){
  if(done)return;done=true;cancelAnimationFrame(frame);observer.disconnect();studio.disconnect();
  if(restore)title.textContent=full;
  title.style.minHeight=previousMin;
  if(previousLabel===null)title.removeAttribute('aria-label');else title.setAttribute('aria-label',previousLabel);
  window.removeEventListener('resize',measure);motion.removeEventListener('change',finishMotion);
 }
 const studio=new MutationObserver(()=>{if(document.body.classList.contains('adcDesignActive'))finish();});
 const finishMotion=()=>{if(motion.matches)finish();};
 title.setAttribute('aria-label',full);measure();write('');studio.observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',measure);motion.addEventListener('change',finishMotion);
 const start=performance.now();
 function tick(now){
  if(done)return;const progress=Math.min(1,(now-start)/2500),step=Math.floor(progress*40)/40;
  write(characters.slice(0,Math.floor(characters.length*step)).join(''));
  if(progress>=1)finish();else frame=requestAnimationFrame(tick);
 }
 frame=requestAnimationFrame(tick);
})();
