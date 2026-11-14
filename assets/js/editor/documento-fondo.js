// Fondos intercambiables y geometría relativa sin recrear campos ni sus enlaces.
(() => {
 const pageSelector='.adc-design-pdf-page,#adcSC01Sheet';
 const states=new WeakMap(),ready=new Map();
 const pageOf=node=>node?.closest?.(pageSelector);
 const rootOf=node=>node?.closest?.('.adc-design-pdf')||pageOf(node);
 const pagesOf=root=>root?.matches('.adc-design-pdf')?[...root.querySelectorAll('.adc-design-pdf-page')]:root?.matches(pageSelector)?[root]:[];
 function bounds(page){const r=page.getBoundingClientRect(),sx=r.width/page.offsetWidth||1,sy=r.height/page.offsetHeight||1;return {left:r.left+page.clientLeft*sx,top:r.top+page.clientTop*sy,width:page.clientWidth,height:page.clientHeight,sx,sy};}
 function box(node,page){const r=node.getBoundingClientRect(),b=bounds(page);return {left:((r.left-b.left)/b.sx+page.scrollLeft)/b.width*100,top:((r.top-b.top)/b.sy+page.scrollTop)/b.height*100,width:r.width/b.sx/b.width*100,height:r.height/b.sy/b.height*100};}
 function place(node,op){
  if(!pageOf(node.parentElement))return;
  const before=node.getAttribute('style'),x=node.dataset.adcDesignX,y=node.dataset.adcDesignY;
  Object.assign(node.style,{position:'absolute',boxSizing:'border-box',margin:'0',left:op.left+'%',top:op.top+'%',width:op.width+'%',height:op.height+'%',maxWidth:'none',minWidth:'0',minHeight:'0',translate:'none'});delete node.dataset.adcDesignX;delete node.dataset.adcDesignY;
  return ()=>{if(before===null)node.removeAttribute('style');else node.setAttribute('style',before);if(x===undefined)delete node.dataset.adcDesignX;else node.dataset.adcDesignX=x;if(y===undefined)delete node.dataset.adcDesignY;else node.dataset.adcDesignY=y;};
 }
 function eligible(node,page){return node!==page&&node.parentElement===page&&!node.matches('img,canvas,.adc-doc-bg-layer,.adc-sc01-not-applicable-tooltip');}
 function normalize(op,resolve){
  const node=resolve(op.target),page=pageOf(node),result={...op};delete result.space;
  if(!page||op.unit==='percent'||op.kind==='relativeBox')return result;
  const b=bounds(page);if(!b.width||!b.height)return result;
  if(['box','button','image','section'].includes(op.kind)&&node===page){
   const local=op.kind==='image',sx=local?1:b.sx,sy=local?1:b.sy;
   for(const [key,dimension,scale]of [['left','width',sx],['width','width',sx],['top','height',sy],['height','height',sy]])if(Number.isFinite(op[key]))result[key]=op[key]/scale/b[dimension]*100;
   result.unit='percent';return result;
  }
  if(op.kind==='style'&&eligible(node,page)&&['x','y','width','height'].some(key=>Number.isFinite(op[key]))){
   const geometry=box(node,page),local=op.space==='local',sx=local?1:b.sx,sy=local?1:b.sy;
   if(Number.isFinite(op.x))geometry.left+=op.x/sx/b.width*100;if(Number.isFinite(op.y))geometry.top+=op.y/sy/b.height*100;
   if(Number.isFinite(op.width))geometry.width=op.width/(local?1:b.sx)/b.width*100;if(Number.isFinite(op.height))geometry.height=op.height/(local?1:b.sy)/b.height*100;
   return {kind:'relativeBox',target:op.target,...geometry};
  }
  return result;
 }
 async function prepare(src){
  if(!ready.has(src))ready.set(src,(async()=>{const pdf=await adcVisualElements.openPdf(src),images=[];for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i),viewport=page.getViewport({scale:1.5}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;images.push(canvas.toDataURL('image/png'));}return images;})().catch(error=>{ready.delete(src);throw error;}));
  return ready.get(src);
 }
 const backgrounds=page=>[...page.children].filter(node=>node.matches('img,canvas,.adc-doc-bg-layer'));
 function offset(root,value){for(const page of pagesOf(root))for(const bg of backgrounds(page)){bg.style.translate=value.x+'% '+value.y+'%';bg.style.clipPath=`inset(${Math.max(0,-value.y)}% ${Math.max(0,value.x)}% ${Math.max(0,value.y)}% ${Math.max(0,-value.x)}%)`;}}
 function apply(op,node){
  if(op.kind==='relativeBox')return place(node,op);
  const pages=pagesOf(node);if(!pages.length)return;
  const previous=states.get(node)||{x:0,y:0};
  if(op.kind==='backgroundOffset'){
   const before=pages.flatMap(page=>backgrounds(page).map(bg=>[bg,bg.style.translate,bg.style.clipPath]));states.set(node,{...previous,x:op.x,y:op.y});offset(node,op);
   return ()=>{states.set(node,previous);for(const [bg,translate,clip]of before){bg.style.translate=translate;bg.style.clipPath=clip;}};
  }
  if(op.kind!=='replacePdfBackground')return;
  let cancelled=false;const original=pages.flatMap(page=>backgrounds(page).map(bg=>[bg,bg.getAttribute('style')])),layers=[],isolation=pages.map(page=>[page,page.style.isolation]),oldStatus=node.dataset.adcBackgroundState,oldError=node.dataset.adcBackgroundError;
  const state={...previous,src:op.src,pending:true,error:undefined};states.set(node,state);node.dataset.adcBackgroundState='loading';delete node.dataset.adcBackgroundError;
  prepare(op.src).then(images=>{
   if(cancelled)return;if(images.length!==pages.length)throw Error('El PDF debe conservar la cantidad de páginas del documento.');
   pages.forEach((page,index)=>{const img=document.createElement('img');img.className='adc-doc-bg-layer';img.alt='PDF de fondo reemplazado, página '+(index+1);img.src=images[index];Object.assign(img.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'fill',pointerEvents:'none',zIndex:'-1'});page.style.isolation='isolate';page.append(img);layers.push(img);});
   original.forEach(([bg])=>bg.style.visibility='hidden');state.pending=false;offset(node,states.get(node)||state);node.dataset.adcBackgroundState='ready';window.dispatchEvent(new Event('adc:document-background'));
  }).catch(error=>{if(cancelled)return;state.error=error.message;state.pending=false;node.dataset.adcBackgroundState='error';node.dataset.adcBackgroundError=error.message;window.dispatchEvent(new Event('adc:document-background'));});
  return ()=>{cancelled=true;layers.forEach(bg=>bg.remove());original.forEach(([bg,style])=>{if(style===null)bg.removeAttribute('style');else bg.setAttribute('style',style);});isolation.forEach(([page,value])=>page.style.isolation=value);states.set(node,previous);if(oldStatus===undefined)delete node.dataset.adcBackgroundState;else node.dataset.adcBackgroundState=oldStatus;if(oldError===undefined)delete node.dataset.adcBackgroundError;else node.dataset.adcBackgroundError=oldError;};
 }
 async function pdfTemplate(sheet,original,lib){
  const root=rootOf(sheet),state=states.get(root);if(!state||(!state.src&&!state.x&&!state.y))return original;
  if(state.pending)await prepare(state.src);if(state.error)throw Error(state.error);
  const base=await lib.PDFDocument.load(original.slice(0)),source=state.src?Uint8Array.from(atob(state.src.split(',')[1]),c=>c.charCodeAt(0)):original;
  const doc=await lib.PDFDocument.create(),embedded=await doc.embedPdf(source);if(embedded.length!==base.getPageCount())throw Error('Cantidad de páginas incompatible.');
  embedded.forEach((background,index)=>{const {width,height}=base.getPage(index).getSize(),page=doc.addPage([width,height]);page.drawPage(background,{x:width*state.x/100,y:-height*state.y/100,width,height});});return doc.save();
 }
 function attach(api){
  const fieldset=document.createElement('fieldset');fieldset.innerHTML='<legend>Fondo del documento</legend><p>Seleccioná el documento o uno de sus campos. Se conservan las cajas. El PDF nuevo debe tener la misma cantidad de páginas. Cada flecha ajusta el fondo 0,5 mm.</p>';
  const current=document.createElement('output');current.dataset.backgroundTarget='';fieldset.append(current);
  const input=document.createElement('input');input.type='file';input.accept='application/pdf,.pdf';input.hidden=true;input.dataset.replacePdfBackground='';fieldset.append(input);
  const button=document.createElement('button');button.type='button';button.textContent='Reemplazar PDF de fondo';button.title='Reemplaza sólo el fondo del documento seleccionado, conservando campos y cajas.';button.dataset.backgroundReplace='';fieldset.append(button);
  let target=null,lastRoot=null;
  function selected(){const root=rootOf(api.selected());if(root?.getClientRects().length)lastRoot=root;return root||lastRoot?.isConnected&&lastRoot.getClientRects().length&&lastRoot||null;}
  button.onclick=()=>{target=selected();if(!target){api.say('Seleccioná una página de PDF agregado o el formulario SC-01.');return;}input.click();};
  input.onchange=async()=>{const file=input.files[0];input.value='';if(!file)return;button.disabled=true;try{
   if(!target?.isConnected)throw Error('El documento ya no está disponible.');if(file.size>5000000)throw Error('Elegí un PDF de hasta 5 MB.');const root=target;
   const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(new Blob([file],{type:'application/pdf'}));});
   api.say('Comprobando el PDF de reemplazo…');const images=await prepare(src);if(images.length!==pagesOf(root).length)throw Error('El PDF debe conservar la cantidad de páginas. No se reemplazó el fondo.');
   if(adcStudioPolicy.locked(root)&&root.closest('[data-adc-studio-locked]'))throw Error('Desbloqueá el documento antes de reemplazarlo.');
   for(const page of pagesOf(root))for(const child of [...page.children].filter(n=>eligible(n,page)&&n.matches('.adc-design-created,.adc-interactive-card')&&!adcStudioPolicy.locked(n))){const geometry=box(child,page);api.commit({kind:'relativeBox',target:api.keyFor(child),...geometry});}
   if(api.commit({kind:'replacePdfBackground',target:api.keyFor(root),src}))api.say('Fondo reemplazado. Las cajas se conservan; verificá la alineación y guardá con Commit to local.');
  }catch(error){api.say(error.message||'No se pudo reemplazar el fondo.');}finally{button.disabled=false;}};
  const values={};for(const [axis,label]of [['x','Horizontal (%)'],['y','Vertical (%)']]){const wrap=document.createElement('label');wrap.textContent=label;const value=document.createElement('input');value.type='number';value.step='.01';value.min='-10';value.max='10';value.value='0';value.dataset.backgroundOffset=axis;value.title='Desplaza sólo el fondo; las cajas permanecen en su lugar.';wrap.append(value);fieldset.append(wrap);values[axis]=value;value.onchange=()=>calibrate(axis,Number(value.value),true);}
  function calibrate(axis,value,absolute=false){const root=selected();if(!root){api.say('Seleccioná primero un documento.');return;}const prior=states.get(root)||{x:0,y:0},next={x:prior.x,y:prior.y};next[axis]=Math.max(-10,Math.min(10,absolute?value:prior[axis]+value));if(!Number.isFinite(next[axis]))return;if(api.commit({kind:'backgroundOffset',target:api.keyFor(root),...next})){for(const key of ['x','y'])values[key].value=next[key].toFixed(3);api.say('Fondo calibrado. Las cajas no se desplazaron.');}}
  for(const [label,axis,direction]of [['←','x',-1],['→','x',1],['↑','y',-1],['↓','y',1]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.title='Ajustar el fondo 0,5 mm '+label;b.dataset.backgroundNudge=axis+direction;b.onclick=()=>{const root=selected(),page=pagesOf(root)[0];if(!page){api.say('Seleccioná primero un documento.');return;}const points=axis==='x'?(Number(page.dataset.pdfWidth)||612):(Number(page.dataset.pdfHeight)||1008);calibrate(axis,direction*.5*72/25.4/points*100);};fieldset.append(b);}
  const reset=document.createElement('button');reset.type='button';reset.textContent='Restablecer offset';reset.title='Devuelve el fondo al origen sin cambiar las cajas.';reset.onclick=()=>{const root=selected();if(root)api.commit({kind:'backgroundOffset',target:api.keyFor(root),x:0,y:0});};fieldset.append(reset);
  function sync(){const root=selected(),value=states.get(root)||{x:0,y:0};values.x.value=value.x.toFixed(3);values.y.value=value.y.toFixed(3);current.textContent=root?'Documento: '+(root.id==='adcSC01Sheet'?'SC-01':root.getAttribute('aria-label')||'PDF agregado'):'Sin documento seleccionado.';}
  window.addEventListener('adc:studio-selection',sync);window.addEventListener('adc:studio-change',sync);window.addEventListener('adc:document-background',()=>{sync();const root=selected();if(root?.dataset.adcBackgroundError)api.say(root.dataset.adcBackgroundError);});api.panel.append(fieldset);sync();
 }
 window.adcDocumentBackground=Object.freeze({normalize,place,apply,attach,pdfTemplate,pageOf,rootOf,prepare});
})();
