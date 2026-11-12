
/* v0.9.16.19g: solo preferencias visuales de DJ-01; no altera datos ni impresión. */
(function(){
 const layout=document.querySelector('#dj .dj-layout'),side=document.querySelector('#dj .dj-side'),grip=document.getElementById('adcDjSplitter');
 const preview=document.querySelector('#dj .dj-preview'),sheet=document.getElementById('djPreview');
 const slider=document.getElementById('adcDjZoom'),value=document.getElementById('adcDjZoomValue');
 const fitBtn=document.getElementById('adcDjFit'),resetBtn=document.getElementById('adcDjResetPanel');
 if(!layout||!side||!grip||!preview||!sheet||!slider)return;
 const sideKey='adc_dj_side_width_19g',zoomKey='adc_dj_zoom_mode_19g';
 const isNarrow=()=>window.matchMedia('(max-width:700px)').matches;
 const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
 let width=Number(localStorage.getItem(sideKey))||355;
 let zoomPref=localStorage.getItem(zoomKey)||'auto';
 function setWidth(n,save){
   const available=Math.max(245,layout.getBoundingClientRect().width-235);
   width=clamp(n,245,available);
   layout.style.setProperty('--adc-dj-side-width',width+'px');
   if(save)try{localStorage.setItem(sideKey,String(Math.round(width)))}catch(e){}
   applyZoom();
 }
 function applyZoom(){
   let pct;
   if(zoomPref==='auto'){
     // Hoja 1 usa una tabla de 980px; la hoja 2 puede llegar a 1120px.
     const available=Math.max(250,preview.clientWidth-24);
     pct=clamp(Math.floor(available/1120*100),45,100);
     value.textContent='Automático · '+pct+'%';
   }else{
     pct=clamp(Number(zoomPref)||75,45,110);
     value.textContent=pct+'%';
   }
   slider.value=String(pct);
   sheet.style.setProperty('--adc-dj-zoom',String(pct/100));
   // La barra sigue el área de la vista previa, pero permanece fija al viewport.
   const r=preview.getBoundingClientRect();
   if(!isNarrow()){
     const w=Math.max(230,Math.min(680,r.width-20,window.innerWidth-24));
     const x=Math.max(12,Math.min(window.innerWidth-w-12,r.left+(r.width-w)/2));
     const controls=document.querySelector('#dj .adc-dj-view-controls');
     if(controls){controls.style.left=x+'px';controls.style.right='auto';controls.style.width=w+'px';}
   }else{
     const controls=document.querySelector('#dj .adc-dj-view-controls');
     if(controls){controls.style.removeProperty('left');controls.style.removeProperty('right');controls.style.removeProperty('width');}
   }

 }
 let active=null;
 grip.addEventListener('pointerdown',e=>{
   if(isNarrow()||e.button!==0)return;
   e.preventDefault();active={id:e.pointerId,startX:e.clientX,startWidth:width};
   grip.setPointerCapture(e.pointerId);grip.classList.add('adc-dragging');
 });
 grip.addEventListener('pointermove',e=>{if(active&&e.pointerId===active.id)setWidth(active.startWidth+e.clientX-active.startX,false)});
 function stop(e){if(!active||e.pointerId!==active.id)return;active=null;grip.classList.remove('adc-dragging');setWidth(width,true)}
 grip.addEventListener('pointerup',stop);grip.addEventListener('pointercancel',stop);
 grip.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setWidth(width+(e.key==='ArrowRight'?30:-30),true)}else if(e.key==='Home'){e.preventDefault();setWidth(245,true)}});
 slider.addEventListener('input',()=>{zoomPref=String(slider.value);try{localStorage.setItem(zoomKey,zoomPref)}catch(e){}applyZoom()});
 fitBtn.addEventListener('click',()=>{zoomPref='auto';try{localStorage.setItem(zoomKey,zoomPref)}catch(e){}applyZoom()});
 resetBtn.addEventListener('click',()=>{setWidth(355,true);zoomPref='auto';try{localStorage.setItem(zoomKey,zoomPref)}catch(e){}applyZoom()});
 window.addEventListener('resize',()=>{if(!isNarrow())setWidth(width,false);else applyZoom()});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>applyZoom()).observe(preview);
 setWidth(width,false);applyZoom();
})();
