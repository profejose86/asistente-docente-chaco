
const adc43Zooms=[];
function adc43Fit(){
 for(const item of adc43Zooms){
  const papers=[...item.host.querySelectorAll(item.selector)];
  if(!papers.length||!item.host.clientWidth)continue;
  papers.forEach(paper=>paper.style.zoom='1');
  const widest=Math.max(...papers.map(paper=>paper.offsetWidth));
  const fit=Math.min(1,(item.host.clientWidth-4)/widest);
  if(!Number.isFinite(fit)||fit<=0)continue;
  const percent=item.scale===null?Math.max(45,Math.floor(fit*100)):Math.round(item.scale*100);
  papers.forEach(paper=>paper.style.zoom=String(percent/100));
  item.label.textContent=(item.scale===null?'Automático · ':'')+percent+' %';
  if(item.slider)item.slider.value=String(percent);
 }
}
(()=>{
 const menu=$('adcTramitesMenu'),chooser=menu.firstElementChild,catalog=menu.querySelector('.adc-form-catalog');
 const frequent=$('frecuentes'),title=frequent.previousElementSibling;
 const aside=document.createElement('section');aside.id='adc43Frequent';aside.append(title,frequent);
 menu.classList.add('adc43-catalog-layout');menu.prepend(aside);
 if(catalog)menu.append(catalog);
 const request=$('license'),workspace=document.createElement('div');
 workspace.className='adc43-work';request.before(workspace);
 workspace.append($('adcDocsDock'),request,$('dj02'),$('adcOL'));
 const institution=$('escuelaSelect');institution.closest('.fields').prepend(institution.closest('label'));
 institution.addEventListener('change',()=>{if(adcDocsContext)adcDocsRender()});
 $('adcDocsEditor').addEventListener('toggle',()=>{if(adcDocsContext)adcDocsRender()});
 function align(){
  const data=request.querySelector('.adc-request-heading')?.closest('section');
  const offset=workspace.dataset.view==='license'&&data?data.getBoundingClientRect().top-workspace.getBoundingClientRect().top:0;
  workspace.style.setProperty('--adc43-align',Math.max(0,offset)+'px');
 }
 function zoom(host,selector){
  if(!host)return;
  const bar=document.createElement('div');bar.className='toolbar adc43-zoom';
  bar.setAttribute('aria-label','Zoom del formulario');
  const item={host,selector,scale:null,label:document.createElement('output')};
  for(const [text,delta] of [['−',-.1],['+',.1],['Ajustar al ancho',0],['Restablecer',null]]){
   const b=document.createElement('button');b.type='button';b.className='alt';b.textContent=text;
   b.onclick=()=>{
    const paper=host.querySelector(selector);
    if(!paper)return;
    item.scale=delta?Math.max(.45,Math.min(1.10,(Number(paper.style.zoom)||1)+delta)):null;
    if(!delta){host.scrollLeft=0;host.scrollTop=0}
    adc43Fit();
   };bar.append(b);
  }
  bar.append(item.label);host.after(bar);host.style.overflowX='auto';adc43Zooms.push(item);
  new MutationObserver(adc43Fit).observe(host,{childList:true});
  // Add the slider after the design editor indexes the original elements.
  queueMicrotask(()=>{
   const slider=document.createElement('input');slider.type='range';slider.min='45';slider.max='110';slider.step='1';
   slider.setAttribute('aria-label','Zoom de la vista previa');
   slider.addEventListener('input',()=>{item.scale=Number(slider.value)/100;adc43Fit()});
   item.slider=slider;bar.prepend(slider);
   if(typeof ResizeObserver!=='undefined')new ResizeObserver(adc43Fit).observe(host);
   adc43Fit();
  });
 }
 zoom($('dj02Preview'),'.dj02-paper');
 zoom($('adcOL').querySelector('.adc-ol-scroll'),'.adc-ol-paper');
 const sheet=$('adcOLSheet');
 const resetSheet=()=>{sheet.style.width='';sheet.style.marginLeft='';adc43Fit()};
 sheet.querySelector('.adc43-zoom button:last-of-type')?.addEventListener('click',resetSheet);
 for(const [id,left] of [['adcOLLeft',true],['adcOLRight',false]]){
  const handle=$(id);let drag;
  handle.onpointerdown=event=>{
   if(event.button!==0)return;
   const rect=sheet.getBoundingClientRect();
   drag={id:event.pointerId,x:event.clientX,left:rect.left,right:rect.right,margin:parseFloat(sheet.style.marginLeft)||0};
   handle.setPointerCapture(event.pointerId);
  };
  handle.onpointermove=event=>{
   if(drag?.id!==event.pointerId)return;
   const delta=event.clientX-drag.x,min=Math.min(380,document.documentElement.clientWidth-16);
   const edge=left?Math.max(8,Math.min(drag.left+delta,drag.right-min)):Math.max(drag.left+min,Math.min(drag.right+delta,document.documentElement.clientWidth-8));
   sheet.style.width=(left?drag.right-edge:edge-drag.left)+'px';
   if(left)sheet.style.marginLeft=(drag.margin+edge-drag.left)+'px';
   adc43Fit();
  };
  handle.onlostpointercapture=()=>{drag=null};
  handle.ondblclick=resetSheet;
 }
 window.addEventListener('resize',resetSheet);

 const observer=new ResizeObserver(()=>{align();adc43Fit()});
 observer.observe(workspace);observer.observe(request.firstElementChild);
 window.addEventListener('resize',()=>{align();adc43Fit()});
})();
