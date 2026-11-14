
(() => {
 const panel = document.getElementById('adcDesignPanel');
 const gear = document.getElementById('adcDesignGear');
 const editor = document.getElementById('adcDesignText');
 const status = panel.querySelector('[data-status]');
 const formatting = document.getElementById('adcDesignFormatting');
 const storageKey = 'adc-login-design-v1';
 const palette=window.adcEditorCommon.palette;
 const paletteBox=document.getElementById('adcDesignPalette');
 let tool='',cut=null,dirty=false,frame=0;
 const marks=document.createElement('div');marks.id='adcDesignMarks';document.body.append(marks);
 const rulers=document.createElement('div');rulers.id='adcDevRulers';rulers.setAttribute('aria-hidden','true');document.body.append(rulers);
 const rulesSwitch=document.getElementById('adcDevRules');
 rulesSwitch.onchange=()=>scheduleMarks();
 const keepNotes=document.getElementById('adcKeepNotes');
 try{keepNotes.checked=localStorage.getItem('adc-login-keep-notes')==='true'}catch{}
 function showNotes(){document.body.classList.toggle('adc-keep-notes',keepNotes.checked)}
 keepNotes.onchange=()=>{showNotes();try{localStorage.setItem('adc-login-keep-notes',String(keepNotes.checked))}catch{}};
 showNotes();
 const instructions={line:'Arrastrá para dibujar una línea.',note:'Dibujá dónde querés escribir la nota.',rectangle:'Arrastrá para dibujar el recuadro.',ellipse:'Arrastrá para dibujar el óvalo.','doc-size':'Elegí la vista previa y arrastrá ↔ o ↕. Esc cancela.',move:'Agarrá los seis puntitos. Soltá para mover. Esc cancela.', 'center-area':'Revisá el centro de la columna.','center-peer':'Tocá la sección de referencia.','center-screen':'Revisá la guía y pulsá Aplicar centrado.',size:'Arrastrá el centro para mover o un borde para ajustar.',section:'Dibujá el cuadro y soltá.',box:'Dibujá la caja y soltá.',split:'Hacé clic entre dos elementos para empezar.',button:'Dibujá el botón y soltá.',bubble:'Hacé clic junto al elemento.',dropdown:'Elegí un control para ubicar el panel.',fold:'Elegí la sección que querés plegar.',erase:'Apuntá y mantené presionado para eliminar. También podés seleccionar y pulsar Eliminar.'};
 const foldSummaries=new WeakMap();
 const selector = 'header,nav,main,footer,section,article,aside,form,div,details,summary,h1,h2,h3,h4,h5,h6,p,span,small,strong,label,button,a,input,textarea,select,table,thead,tbody,tr,th,td,ul,ol,li';
 let selected, grouping, range, drag, suppressClick=false;
 let operations = [], redo = [], reversals = [];
 const {keys,originals,originalDetailsOpen,register,keyFor,resolve}=window.adcEditorCommon.createRegistry({panel,gear,selector});
 const say = message => { status.textContent = message+(dirty?' · Cambios sin guardar':''); };
 const {canEditText,canContain,actionAllowed,safeHref,numeric,cleanHtml}=window.adcEditorCommon.createHelpers(panel);
 const makeSection=op=>window.adcEditorCommon.makeSection(op,register);
 function apply(op) {
   const node = resolve(op.target);
   if (!node?.matches(selector+',img') || panel.contains(node) || node === gear) return;
   if(['image','replaceImage','pdf','front','documentTransform'].includes(op.kind))return window.adcVisualElements?.apply(op,{node,register});
   if(op.kind==='hideOriginal'){
     const before=node.hasAttribute('data-adc-design-hidden');
     node.setAttribute('data-adc-design-hidden','');
     return ()=>node.toggleAttribute('data-adc-design-hidden',before);
   }
   if(op.kind==='annotation'&&canContain(node)){
     if(!['note','rectangle','ellipse','line'].includes(op.shape)||![op.left,op.top,op.width,op.height].every(numeric))return;
     const annotation=document.createElement('p');
     annotation.className='adc-design-created adc-design-annotation '+op.shape;
     annotation.textContent=op.title||'';
     annotation.setAttribute('aria-label',op.shape==='note'?'Nota':op.shape==='ellipse'?'Óvalo':op.shape==='line'?'Línea':'Recuadro');
     Object.assign(annotation.style,{left:op.left+'px',top:op.top+'px',width:op.width+'px',height:op.height+'px'});
     if(/^#[0-9a-f]{6}$/i.test(op.color||''))annotation.style.setProperty('--adc-note-color',op.color);
     const stroke=Math.max(1,Math.min(20,Number(op.stroke)||3));
     annotation.style.borderWidth=stroke+'px';
     if(op.shape==='line'){
       const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
       svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');
       const line=document.createElementNS(svg.namespaceURI,'line');
       line.setAttribute('x1','0');line.setAttribute('x2','100');
       line.setAttribute('y1',op.flip?'100':'0');line.setAttribute('y2',op.flip?'0':'100');
       line.setAttribute('vector-effect','non-scaling-stroke');line.style.strokeWidth=stroke;
       svg.append(line);annotation.append(svg);
     }
     register(annotation,op.id);node.append(annotation);
     return ()=>annotation.remove();
   }
   if (op.kind === 'style') {
     const before = node.getAttribute('style');
     if (numeric(op.x) && numeric(op.y)) {
       const x = (parseFloat(node.dataset.adcDesignX) || 0) + op.x;
       const y = (parseFloat(node.dataset.adcDesignY) || 0) + op.y;
       node.style.translate = x + 'px ' + y + 'px';
       node.dataset.adcDesignX = x;
       node.dataset.adcDesignY = y;
     }
     if (numeric(op.width)) { node.style.boxSizing='border-box'; node.style.minWidth='0'; node.style.width = Math.max(24,op.width) + 'px'; node.style.maxWidth = 'min('+op.width+'px, calc(100vw - 16px))'; }
     if (numeric(op.height)) {node.style.height = Math.max(24,op.height) + 'px';node.style.minHeight='0';node.style.boxSizing='border-box';node.style.overflow='auto';}
     if (op.center) { node.style.marginInline = 'auto'; node.style.justifySelf = 'center'; }
     if (/^#[0-9a-f]{6}$/i.test(op.background || '')) node.style.backgroundColor = op.background;
     if (/^#[0-9a-f]{6}$/i.test(op.color || '')) node.style.color = op.color;
     return () => {
       if (before === null) node.removeAttribute('style'); else node.setAttribute('style',before);
       if (numeric(op.x) && numeric(op.y)) {
         node.dataset.adcDesignX = Number(node.dataset.adcDesignX) - op.x;
         node.dataset.adcDesignY = Number(node.dataset.adcDesignY) - op.y;
       }
     };
   }
   if(op.kind==='detailsOpen'&&node.matches('details')){
     const before=node.open;node.open=op.open===true;return ()=>{node.open=before};
   }
   if(op.kind==='hideOLEdges'&&node.id==='adcOLSheet'){
     node.classList.add('adc-no-ol-edges');return ()=>node.classList.remove('adc-no-ol-edges');
   }
   if(op.kind==='removeBackground'){
     const old=node.style.backgroundColor,priority=node.style.getPropertyPriority('background-color');
     node.style.removeProperty('background-color');
     return ()=>{if(old)node.style.setProperty('background-color',old,priority)};
   }
   if(op.kind==='removeAdded'&&keys.get(node)?.startsWith('new-')&&!node.querySelector('[id],input,select,textarea,form')){
     const parent=node.parentElement,next=node.nextSibling;
     const originalChild=[...node.querySelectorAll(selector)].some(child=>keys.get(child)?.startsWith('base-'));
     if(originalChild)return;
     node.remove();return ()=>parent.insertBefore(node,next?.parentNode===parent?next:null);
   }
   if(op.kind==='restoreStyle'){
     const before=node.getAttribute('style'),x=node.dataset.adcDesignX,y=node.dataset.adcDesignY;
     const original=originals.get(node);
     if(original==null)node.removeAttribute('style');else node.setAttribute('style',original);
     delete node.dataset.adcDesignX;delete node.dataset.adcDesignY;
     return ()=>{if(before==null)node.removeAttribute('style');else node.setAttribute('style',before);if(x!==undefined)node.dataset.adcDesignX=x;if(y!==undefined)node.dataset.adcDesignY=y};
   }
   if(op.kind==='always'&&node.matches('details')&&!node.querySelector(':scope>summary')?.hasAttribute('onclick')){
     const summary=node.querySelector(':scope>summary'),was=node.open;
     if(!summary)return;
     const heading=document.createElement('h3');heading.textContent=summary?.textContent||'';
     foldSummaries.set(node,summary);summary.replaceWith(heading);node.open=true;node.classList.add('adc-design-always');
     return ()=>{heading.replaceWith(summary);node.open=was;node.classList.remove('adc-design-always')};
   }
   if(op.kind==='restoreFold'&&node.matches('details.adc-design-always')){
     const heading=node.firstElementChild,summary=foldSummaries.get(node);
     if(!summary)return;
     heading.replaceWith(summary);node.classList.remove('adc-design-always');
     return ()=>{summary.replaceWith(heading);node.classList.add('adc-design-always');node.open=true};
   }
   if(op.kind==='fold'&&node.matches('section,article,aside')&&!node.querySelector(':scope > .adc-design-fold')){
     const button=document.createElement('button');button.type='button';button.className='alt adc-design-fold';
     const content=document.createElement('div');content.append(...node.childNodes);node.append(button,content);
     const update=open=>{content.hidden=!open;button.setAttribute('aria-expanded',String(open));button.textContent=open?'▾ Ocultar sección':'▸ Mostrar sección'};
     update(op.open===true);button.onclick=()=>update(content.hidden);
     return ()=>{node.prepend(...content.childNodes);button.remove();content.remove()};
   }
   if(op.kind==='unfold'&&node.matches('section,article,aside')){
     const button=node.querySelector(':scope > .adc-design-fold'),content=button?.nextElementSibling;
     if(!content)return;
     const children=[...content.childNodes];node.prepend(...children);button.remove();content.remove();
     return ()=>{content.append(...children);node.append(button,content)};
   }
   if (op.kind === 'text'  && canEditText(node)) {
     const before = [...node.childNodes];
     node.replaceChildren(cleanHtml(op.html,node.matches('button,label,a,summary,h1,h2,h3,h4,h5,h6,span,strong,small')));
     return () => node.replaceChildren(...before);
   }
   if (op.kind === 'reorder' || op.kind === 'group') {
     const parent = node.parentElement, next = node.nextSibling;
     if (!parent || node.matches('script,style,input,select,textarea,option,td,th,tr')) return;
     if (op.kind === 'group') {
       const destination = resolve(op.destination);
       if (!destination?.classList.contains('adc-design-section') || node.contains(destination) ||
           node.matches('summary,form,header,nav,main,footer,tr,td,th,thead,tbody') ||
           node.closest('form') !== destination.closest('form')) return;
       destination.append(node);
     } else {
       const sibling = op.direction < 0 ? node.previousElementSibling : node.nextElementSibling;
       if (!sibling || sibling.matches('summary,#adcDesignGear,#adcDesignPanel') || node.matches('summary')) return;
       if (op.direction < 0) parent.insertBefore(node,sibling); else sibling.after(node);
     }
     return () => parent.insertBefore(node,next?.parentNode === parent ? next : null);
   }
   if (!/^new-[a-z0-9-]+$/i.test(op.id || '')) return;
   if (op.kind === 'split' && canContain(node.parentElement) && !node.matches('summary,script,style')) {
     const tail = [...node.parentElement.children].slice([...node.parentElement.children].indexOf(node));
     const box = makeSection(op);
     node.before(box);
     box.append(...tail);
     return () => { box.before(...tail); box.remove(); };
   }
   if (!['section','box','button','dropdown','bubble'].includes(op.kind) || !(canContain(node)||['dropdown','bubble'].includes(op.kind))) return;
   let added;
   if (op.kind === 'section') added = makeSection(op);
   if (op.kind === 'box') { added = document.createElement('p'); added.className = 'adc-design-section'; added.textContent = op.title; }
   if (op.kind === 'button') {
     added = document.createElement('button');
     added.type = 'button';
     added.textContent = op.title;
     added.onclick = () => {
       const action = resolve(op.action);
       if (actionAllowed(action) && !action.disabled) action.click();
     };
   }
   if (op.kind === 'dropdown'||op.kind==='bubble') {
     added=document.createElement('div');added.className='adc-design-pop';
     const message=document.createElement('p');message.className='adc-design-note';message.textContent=op.title;
     if(palette[op.tone])message.style.backgroundColor=palette[op.tone];
     if(op.kind==='bubble'&&!op.popup)added.append(message);
     else{
      const toggle=document.createElement('button');toggle.type='button';toggle.className='alt';toggle.textContent=op.kind==='bubble'?'ⓘ':'▾ Ver panel';
      toggle.setAttribute('aria-expanded','false');message.hidden=true;
      message.classList.add('adc-design-fly');
      if(typeof message.showPopover==='function'){
       message.popover='auto';
       message.addEventListener('toggle',event=>{
        const opened=event.newState==='open';
        toggle.setAttribute('aria-expanded',String(opened));
        message.hidden=!opened;
       });
      }
      toggle.onclick=()=>{
       const opened=toggle.getAttribute('aria-expanded')==='true';
       toggle.setAttribute('aria-expanded',String(!opened));
       if(opened){
        if(message.popover&&message.matches(':popover-open'))message.hidePopover();
        message.hidden=true;
       }else{
        message.hidden=false;
        if(message.popover)message.showPopover();
        placePanel(toggle,message,op.direction);
       }
      };
      added.append(toggle,message);
     }
   }
   if(op.kind==='button'&&!op.action){added.classList.add('adc-design-unbound');added.disabled=true}
   if(op.kind==='button'&&!op.overlay)added.style.minWidth='112px';
   if(palette[op.tone]&&['box','button'].includes(op.kind)){
    added.style.backgroundColor=palette[op.tone];added.style.color=['azul','noche','tinta'].includes(op.tone)?'#ffffff':'#152844';
   }
   added.classList.add('adc-design-created');
   if(op.overlay)added.classList.add('adc-login-overlay');
   if(added.classList.contains('adc-design-unbound')) added.disabled=panel.hidden;
   register(added,op.id);
   if(['dropdown','bubble'].includes(op.kind)){
     const anchor=node.closest('label')||node;
     if(anchor.matches('button,a,input,select,textarea,label,summary,p,span,h1,h2,h3,h4,td,th')){
       if(anchor.matches('td,th'))anchor.append(added);
       else anchor.after(added);
     }else if(canContain(anchor))anchor.append(added);
     else return;
   }
   else node.append(added);
   if(numeric(op.width)&&numeric(op.height)){
     added.style.width=op.width+'px';added.style.height=op.height+'px';added.style.maxWidth='100%';added.style.overflow='auto';
   }
   if(node.matches('.adc-design-pdf-page')&&numeric(op.left)&&numeric(op.top)){
     Object.assign(added.style,{position:'absolute',left:op.left+'px',top:op.top+'px',margin:'0',zIndex:'5',boxSizing:'border-box',padding:'2px',fontSize:Math.max(7,Math.min(12,(op.height||20)-6))+'px',lineHeight:'1.2',borderRadius:'0'});
   }else if(op.overlay&&numeric(op.left)&&numeric(op.top)){
     added.style.left=op.left+'px';added.style.top=op.top+'px';
   }else if(numeric(op.left)&&numeric(op.top)){
     const r=added.getBoundingClientRect(),host=node.getBoundingClientRect();
     const x=host.left+op.left-r.left,y=host.top+op.top-r.top;
     added.style.translate=x+'px '+y+'px';added.dataset.adcDesignX=x;added.dataset.adcDesignY=y;
   }
   return () => added.remove();
 }
 function commit(op) {
   op=window.adcVisualElements?.normalize(op,resolve)||op;
   const reverse = apply(op);
   if (!reverse) { say('Esta acción requiere otro elemento o una sección compatible.'); return false; }
   operations.push(op); reversals.push(reverse); redo = [];dirty=true;scheduleMarks();
   say('Cambio aplicado al borrador.');
   return true;
 }
 function select(node) {
   if(node&&node!==selected&&window.adcVisualElements)commit({kind:'front',target:keyFor(node),level:Math.min(5000,1+Math.max(500,...operations.filter(op=>op.kind==='front').map(op=>op.level)))});
   selected?.removeAttribute('data-adc-design-selected');
   selected = node;
   if (!node) { paletteBox.hidden=true;formatting.hidden = true; editor.replaceChildren(); range = null;scheduleMarks(); return; }
   node.setAttribute('data-adc-design-selected','');
   const editable = canEditText(node)&&!node.matches('.rectangle,.ellipse,.line');
   formatting.hidden = !editable;
   editor.replaceChildren();
   if (editable) editor.append(cleanHtml(node.innerHTML,false));
   range = null;
   paletteBox.hidden=!node.matches('.adc-design-section,button,.adc-design-pop');
   scheduleMarks();
   const title = node.getAttribute('aria-label') || node.getAttribute('id') || node.querySelector('h1,h2,h3,summary')?.textContent || node.textContent.trim().slice(0,70);
   say((node.closest('header,nav,footer') ? 'Compartido · ' : 'Pantalla actual · ') + (title || node.localName));
 }
 function toggle() {
   const active = panel.hidden;
   panel.hidden = !active;
   gear.setAttribute('aria-expanded',String(active));
   document.querySelectorAll('.adc-design-unbound').forEach(button=>{button.disabled=!active});
   document.body.classList.toggle('adcDesignActive',active);
   document.body.classList.toggle('adcDesignMoving',active&&!tool);
   if (!active) { setTool('');select(null); grouping = null; }
   positionSettings();
   scheduleMarks();
   say(active ? 'Arrastrá la tuerquita para mover Ajustes.' : 'Modo navegación.');
 }
 const settingsPositionKey='adc-login-panel-position';
 const settingsMargin=8;
 let settingsPosition={x:settingsMargin,y:settingsMargin};
 let settingsDrag=null;
 let settingsMoved=false;
 try{
   const saved=JSON.parse(localStorage.getItem(settingsPositionKey)||'null');
   if(Number.isFinite(saved?.x)&&Number.isFinite(saved?.y))settingsPosition=saved;
 }catch{}
 function positionSettings(){
   const width=document.documentElement.clientWidth;
   const height=document.documentElement.clientHeight;
   const clamp=(value,max)=>Math.max(settingsMargin,Math.min(value,max-settingsMargin));
   const x=clamp(settingsPosition.x,width-gear.offsetWidth);
   const y=clamp(settingsPosition.y,height-gear.offsetHeight);
   gear.style.left=x+'px';
   gear.style.top=y+'px';
   if(panel.hidden)return;
   const below=height-y-gear.offsetHeight-2*settingsMargin;
   const above=y-2*settingsMargin;
   const placeBelow=below>=Math.min(panel.scrollHeight,height*.72)||below>=above;
   panel.style.left=clamp(x,width-panel.offsetWidth)+'px';
   panel.style.maxHeight=Math.min(height*.72,Math.max(0,placeBelow?below:above))+'px';
   panel.style.top=(placeBelow?y+gear.offsetHeight+settingsMargin:y-panel.offsetHeight-settingsMargin)+'px';
 }
 gear.onclick=event=>{
   if(settingsMoved&&event.detail>0){settingsMoved=false;return}
   toggle();
 };
 gear.addEventListener('pointerdown',event=>{
   settingsMoved=false;
   if(panel.hidden||!event.isPrimary||event.button!==0)return;
   const box=gear.getBoundingClientRect();
   settingsDrag={id:event.pointerId,x:event.clientX,y:event.clientY,left:box.left,top:box.top};
   gear.setPointerCapture(event.pointerId);
 });
 gear.addEventListener('pointermove',event=>{
   if(settingsDrag?.id!==event.pointerId)return;
   const dx=event.clientX-settingsDrag.x,dy=event.clientY-settingsDrag.y;
   if(!settingsMoved&&Math.hypot(dx,dy)<5)return;
   settingsMoved=true;
   gear.classList.add('adc-gear-dragging');
   settingsPosition={x:settingsDrag.left+dx,y:settingsDrag.top+dy};
   positionSettings();
 });
 function finishSettingsDrag(event){
   if(settingsDrag?.id!==event.pointerId)return;
   settingsDrag=null;
   gear.classList.remove('adc-gear-dragging');
   if(settingsMoved){
     settingsPosition={x:gear.offsetLeft,y:gear.offsetTop};
     try{localStorage.setItem(settingsPositionKey,JSON.stringify(settingsPosition))}catch{}
   }
 }
 for(const name of ['pointerup','pointercancel','lostpointercapture'])gear.addEventListener(name,finishSettingsDrag);
 const resetSettingsPosition=document.createElement('button');
 resetSettingsPosition.type='button';
 resetSettingsPosition.textContent='Volver a la esquina';
 resetSettingsPosition.onclick=()=>{
   settingsPosition={x:settingsMargin,y:settingsMargin};
   try{localStorage.removeItem(settingsPositionKey)}catch{}
   positionSettings();
 };
 panel.append(resetSettingsPosition);
 window.addEventListener('resize',positionSettings);
 if(typeof ResizeObserver==='function')new ResizeObserver(positionSettings).observe(panel);
 positionSettings();
 document.addEventListener('click',event => {
   if (panel.hidden || event.target.closest('#adcDesignContext') || event.target.closest('#adcThemeSwitch') || panel.contains(event.target) || gear.contains(event.target)||marks.contains(event.target)) return;
   if(suppressClick){event.preventDefault();event.stopImmediatePropagation();return}
   const node = event.target.closest(selector);
   if (!node || !keyFor(node)) return;
   event.preventDefault();
   event.stopImmediatePropagation();
   if (grouping) {
     const destination = node.closest('.adc-design-section');
     if (destination) { commit({kind:'group',target:grouping,destination:keyFor(destination)}); grouping = null; }
     else say('Elegí una sección creada con el editor.');
     return;
   }
   if(toolClick(node,event))return;
   select(node);
 },true);
 document.addEventListener('keydown',event => {
   if (!panel.hidden && event.key === 'Escape'){event.preventDefault();setTool('');grouping=null;say('Gesto cancelado. Elegí otra herramienta.');}
 });
 document.addEventListener('invalid',event => {
   for (let node = event.target.parentElement; node; node = node.parentElement) {
     if (node.matches('details.adc-design-section')) node.open = true;
     if(node.hidden&&node.previousElementSibling?.matches('.adc-design-fold'))node.previousElementSibling.click();
   }
 },true);
 document.addEventListener('selectionchange',() => {
   const selection = window.getSelection();
   if (selection.rangeCount && editor.contains(selection.anchorNode) && editor.contains(selection.focusNode)) range = selection.getRangeAt(0).cloneRange();
 });
 function format(command,value) {
   editor.focus();
   if (range) {
     const selection = window.getSelection();
     selection.removeAllRanges(); selection.addRange(range);
   }
   document.execCommand(command,false,value);
 }
 editor.addEventListener('paste',event => {
   event.preventDefault();
   document.execCommand('insertText',false,event.clipboardData.getData('text/plain'));
 });
 panel.addEventListener('mousedown',event => {
   if (event.target.closest('[data-format]')) event.preventDefault();
 });
 for (const [id,command] of [['Font','fontName'],['Size','fontSize'],['Color','foreColor'],['Mark','hiliteColor']]) {
   document.getElementById('adcDesign'+id).onchange = event => {
     if (event.target.value) format(command,event.target.value);
   };
 }
 function load(incoming) {
   const allowed={
     annotation:['id','shape','title','left','top','width','height','color','stroke','flip'],hideOriginal:[],front:['level'],documentTransform:['x','y','scale'],image:['id','src','alt','left','top','width','height'],replaceImage:['src'],pdf:['id','src','title'],style:['x','y','width','height','center','background','color'],text:['html'],
     reorder:['direction'],group:['destination'],split:['id','title','fold','open'],
     section:['id','title','fold','open','width','height','left','top'],box:['id','title','width','height','left','top','overlay'],
     button:['id','title','action','left','top','tone','width','height','overlay'],bubble:['id','title','tone','popup','left','top'],
     dropdown:['id','title','direction'],fold:['open'],detailsOpen:['open'],
     restoreStyle:[],restoreFold:[],always:[],unfold:[],removeAdded:[],hideOLEdges:[],removeBackground:[]
   };
   if(!Array.isArray(incoming)||incoming.length>2000||incoming.some(op=>{
     if(!op||!Object.hasOwn(allowed,op.kind)||typeof op.target!=='string')return true;
     return Object.entries(op).some(([key,value])=>!['kind','target',...allowed[op.kind]].includes(key)||
       !['string','number','boolean'].includes(typeof value));
   }))throw Error('Formato inválido');
   const prior=operations.slice(),priorRedo=redo;
   const reset=()=>{while(reversals.length)reversals.pop()();operations=[]};
   const replay=items=>{
     for(const op of items){
       const reverse=apply(op)||window.adcVisualElements?.defer(op,resolve,apply);if(!reverse)throw Error('Ajuste incompatible');
       operations.push(op);reversals.push(reverse);
     }
   };
   reset();
   try{replay(incoming)}catch(error){reset();replay(prior);redo=priorRedo;throw error}
   redo=[];select(null);
   return 0;
 }
 const serialize = () => JSON.stringify({schema:storageKey,operations},null,2);
 const importer = document.getElementById('adcDesignImport');
 importer.onchange = async () => {
   try {
     const file = importer.files[0];
     if (!file || file.size > 12e6) throw Error();
     const draft = JSON.parse(await file.text());
     if (draft.schema !== storageKey) throw Error();
     const skipped = load(draft.operations);
     dirty=true;say(skipped ? 'Importado. Cambios sin aplicar: ' + skipped : 'Borrador importado.');
   } catch { say('Elegí un JSON exportado desde esta versión de ADC.'); }
   importer.value = '';
 };
 panel.onclick = event => {
   const button = event.target.closest('button');
   if (!button) return;
   if (button.dataset.format) { format(button.dataset.format); return; }
   const act = button.dataset.act;
   if (act === 'navigate') { toggle(); return; }
   if (act === 'undo') {
     if (operations.length) { reversals.pop()(); redo.push(operations.pop());dirty=true;select(null); say('Cambio deshecho.'); }
     return;
   }
   if (act === 'redo') {
     const op = redo.pop();
     if (op) { const reverse = apply(op); if (reverse) { operations.push(op); reversals.push(reverse);dirty=true;scheduleMarks();say('Cambio rehecho.'); } }
     return;
   }
   if (act === 'save') {
     try { localStorage.setItem('adc-login-design-draft',serialize());dirty=false;say('Borrador guardado en este navegador.'); }
     catch { say('No se pudo guardar. Usá Exportar JSON.'); }
     return;
   }
   if (act === 'export') {
     const url = URL.createObjectURL(new Blob([serialize()],{type:'application/json'}));
     const link = document.createElement('a');
     link.href = url; link.download = 'ADC_ingreso_distribucion.json'; link.click();
     setTimeout(() => URL.revokeObjectURL(url),1000);
     return;
   }
   if (act === 'import') { importer.click(); return; }
   if(act==='center-apply'){
     if(centerPreview){
       const {node,reference}=centerPreview;
       const r=centerRect(node,reference),base=node.getBoundingClientRect();
       if(validMove(node,r)&&Math.abs(r.left-base.left)>.5)commit({kind:'style',target:keyFor(node),x:r.left-base.left,y:0});
       setTool('');
     }
     return;
   }
   if(['center-screen','center-peer','center-area'].includes(act)){
     if(!selected?.isConnected){say('Elegí el bloque que querés centrar.');return}
     setTool(act);
     if(act!=='center-peer')showCenter(selected,act==='center-area'?selected.parentElement:null);
     return;
   }
   if(instructions[act]){setTool(tool===act?'':act);return}
   if (!selected?.isConnected) { say('Primero seleccioná un elemento de la página.'); return; }
   const target = keyFor(selected);
   if(act==='delete'){eraseSelected(selected,true);return}
   if (act === 'parent') {
     const parent = selected.parentElement.closest(selector);
     if (parent) { keyFor(parent); select(parent); }
   }
   if (act === 'up' || act === 'down') commit({kind:'reorder',target,direction:act === 'up' ? -1 : 1});
   if (act === 'group') { grouping = target; say('Ahora seleccioná la sección de destino.'); }
   if (act === 'text') commit({kind:'text',target,html:editor.innerHTML});
   if (act === 'link') {
     const url = prompt('URL https:// o ancla de ADC (#nombre)');
     if (safeHref(url)) format('createLink',url);
   }
   if(act==='background'){setTool('');paletteBox.hidden=false;say('Elegí un fondo de la paleta.');}
 };
 const drawingTools=['section','box','button','note','rectangle','ellipse','line'];
 const blocks='header,nav,section,article,aside,details,.card,.adc-design-section';
 const protectedField='input,select,textarea,button,a,[contenteditable]';
 const id=()=> 'new-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
 const rect=window.adcEditorCommon.rect;
 const visible=node=>node.getClientRects().length&&getComputedStyle(node).visibility==='visible';
 const usable=node=>node!==panel&&!panel.contains(node)&&node!==gear&&!marks.contains(node)&&!node.closest('#adcDesignContext');
 function mark(name,r){
   const element=document.createElement('div');element.className=name;
   for(const key of ['left','top','width','height'])element.style[key]=r[key]+'px';
   marks.append(element);return element;
 }
 function ghost(r,bad=false,label=''){
   marks.replaceChildren();const guide=mark('adc-ghost'+(bad?' invalid':''),r);guide.textContent=label;
 }
 function siblings(node){return [...node.parentElement.children].filter(other=>other!==node&&usable(other)&&visible(other)&&!other.matches('script,style,summary'))}
 const overlaps=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
 function validMove(node,r){
   const left=0,right=document.documentElement.clientWidth;
   return r.left>=Math.min(left,node.getBoundingClientRect().left)-1&&r.right<=Math.max(right,node.getBoundingClientRect().right)+1&&r.top>=-scrollY&&r.bottom<=document.documentElement.scrollHeight-scrollY;
 }
 let centerPreview=null;
 const centerApply=panel.querySelector('[data-act="center-apply"]');
 const viewportWidth=()=>document.documentElement.clientWidth;
 const midpoint=r=>r.left+r.width/2;
 function centerRect(node,reference){
   const r=node.getBoundingClientRect();
   const x=reference?midpoint(reference.getBoundingClientRect()):viewportWidth()/2;
   return rect(x-r.width/2,r.top,r.width,r.height);
 }
 function showCenter(node,reference){
   centerPreview={node,reference};
   const r=centerRect(node,reference),bad=!validMove(node,r);
   ghost(r,bad,dimensions(r));
   if(tool==='center-area')mark('adc-area-reference',reference.getBoundingClientRect());
   drawGuide('x',midpoint(r),tool==='center-area'?'Centro de columna':reference?'Centro de sección':'Centro de pantalla');
   centerApply.hidden=false;centerApply.disabled=bad;
   say(bad?'El centro coincide con otro bloque o queda fuera del área.':'Revisá la posición y pulsá Aplicar centrado.');
 }
 const dimensions=r=>Math.round(r.width)+' × '+Math.round(r.height)+' px';
 function drawGuide(axis,position,label){
   const line=mark('adc-alignment '+axis,axis==='x'?rect(position,0,0,innerHeight):rect(0,position,viewportWidth(),0));
   const tag=document.createElement('span');tag.textContent=label;line.append(tag);
 }
 function align(r,node,edges,free,exclude=node){
   const sources=[...document.querySelectorAll(blocks)].filter(other=>other!==exclude&&!other.contains(exclude)&&!exclude.contains(other)&&usable(other)&&visible(other))
     .map(other=>other.getBoundingClientRect()).filter(other=>other.bottom>0&&other.top<innerHeight&&other.width>0);
   const found=[];
   for(const axis of ['x','y']){
     const names=axis==='x'?['left','midX','right']:['top','midY','bottom'];
     const value=(r,name)=>name==='midX'?midpoint(r):name==='midY'?r.top+r.height/2:r[name];
     const candidates=names.filter(name=>edges.includes(name)).flatMap(name=>sources.map(source=>({name,position:value(source,name),label:'Alineado'})));
     if(axis==='x'&&edges.includes('midX'))candidates.unshift({name:'midX',position:viewportWidth()/2,label:'Centro de pantalla'});
     let nearest=null;
     for(const candidate of candidates){
       const delta=candidate.position-value(r,candidate.name);
       if(Math.abs(delta)<=(free?.5:7)&&(!nearest||Math.abs(delta)<Math.abs(nearest.delta)))nearest={...candidate,delta};
     }
     if(nearest)found.push({...nearest,axis,delta:free?0:nearest.delta});
   }
   return found;
 }
 const allEdges=['left','midX','right','top','midY','bottom'];
 function alignedGesture(d,event){
   const r=geometry(d,event),draw=drawingTools.includes(d.kind);
   const edges=d.kind==='move'?allEdges:draw?[event.clientX<d.x?'left':'right',event.clientY<d.y?'top':'bottom']:[d.kind];
   const guides=align(r,d.node,edges,event.altKey);
   const x=guides.find(g=>g.axis==='x')?.delta||0,y=guides.find(g=>g.axis==='y')?.delta||0;
   if(d.kind==='move')return {r:rect(r.left+x,r.top+y,r.width,r.height),guides};
   const adjusted=geometry(d,{clientX:event.clientX+x,clientY:event.clientY+y});
   const finalGuides=guides.filter(g=>Math.abs(adjusted[g.name]-g.position)<1);
   return {r:adjusted,guides:finalGuides};
 }
 function placement(event){
   const host=event.target.closest('.adc-design-pdf-page')||event.target.closest('main')||event.target.closest(blocks);
   if(!host||!usable(event.target)||!canContain(host))return null;
   const base=host.getBoundingClientRect();
   const raw=rect(event.clientX,event.clientY,tool==='button'?112:145,tool==='button'?36:48);
   const guides=align(raw,host,allEdges,event.altKey);
   const r=rect(raw.left+(guides.find(g=>g.axis==='x')?.delta||0),raw.top+(guides.find(g=>g.axis==='y')?.delta||0),raw.width,raw.height);
   return {host,base,r,guides};
 }
 function setTool(next){
   centerPreview=null;centerApply.hidden=true;
   clearErase();previewErase(null);document.body.classList.toggle('adcEraser',next==='erase');
   tool=next;drag=null;cut=null;grouping=null;
   document.body.classList.toggle('adcDesignSizing',next==='size'||next==='doc-size');
   document.body.classList.toggle('adcDesignMoving',!next&&!panel.hidden);
   panel.querySelectorAll('[data-act]').forEach(button=>{if(instructions[button.dataset.act])button.setAttribute('aria-pressed',String(tool===button.dataset.act))});
   if(next)say(instructions[next]);
   scheduleMarks();
 }
 function paintRulers(){
   rulers.replaceChildren();
   if(panel.hidden||!rulesSwitch.checked||innerWidth<700)return;
   const wrap=document.querySelector('.wrap');
   if(!wrap)return;
   const r=wrap.getBoundingClientRect(),left=Math.max(20,r.left),right=Math.min(innerWidth-20,r.right);
   const top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);
   if(right<=left||bottom<=top)return;
   function rule(axis,x,y,w,h,origin){
     const element=document.createElement('div');element.className='adc-dev-rule '+axis;
     Object.assign(element.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
     const length=axis==='x'?w:h;
     const offset=(axis==='x'?x:y)-origin;
     for(let tick=Math.ceil(offset/100)*100;tick<offset+length-12;tick+=100){
       const label=document.createElement('span');label.textContent=tick;
       Object.assign(label.style,axis==='x'?{left:tick-offset+2+'px',top:'3px'}:{top:tick-offset+'px',left:'4px'});
       element.append(label);
     }
     rulers.append(element);
   }
   rule('x',left,top,right-left,18,r.left);
   rule('x',left,bottom-18,right-left,18,r.left);
   rule('y',left-20,top,20,bottom-top,r.top);
   rule('y',right,top,20,bottom-top,r.top);
 }
 const documentArea='#adcLoginCard';
 function scheduleMarks(){
   cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
     paintRulers();
     if(drag||cut)return;
     marks.replaceChildren();if(panel.hidden)return;
     if(centerPreview){showCenter(centerPreview.node,centerPreview.reference);return}
     if(tool==='move'){
       for(const node of document.querySelectorAll(blocks)){
         if(!usable(node)||!visible(node))continue;
         const r=node.getBoundingClientRect();
         if(r.width<32||r.top<0||r.top>innerHeight)continue;
         const grip=mark('adc-grip',rect(midpoint(r),r.top,24,24));
         grip.textContent='••\n••\n••';grip.title='Agarrá los seis puntitos';
         grip.onpointerdown=event=>{select(node);start(event,node,'move')};
       }
     }
     if(tool==='doc-size'&&selected?.matches(documentArea)&&visible(selected)){
       const r=selected.getBoundingClientRect();mark('adc-outline',r).textContent=dimensions(r);
       for(const [side,area,symbol,cursor] of [
         ['right',rect(r.right-14,r.top+r.height/2-12,28,24),'↔','ew-resize'],
         ['bottom',rect(midpoint(r)-14,r.bottom-12,28,24),'↕','ns-resize']
       ]){
         const handle=mark('adc-doc-grip',area);handle.textContent=symbol;handle.style.cursor=cursor;
         handle.title=side==='right'?'Ajustar el ancho':'Ajustar el alto';
         handle.onpointerdown=event=>start(event,selected,side);
       }
     }
     if(tool==='size'&&selected&&visible(selected)){
       const r=selected.getBoundingClientRect();mark('adc-outline',r).textContent=dimensions(r);
       const edges={left:rect(r.left-4,r.top,8,r.height),right:rect(r.right-4,r.top,8,r.height),top:rect(r.left,r.top-4,r.width,8),bottom:rect(r.left,r.bottom-4,r.width,8)};
       for(const [side,area] of Object.entries(edges)){
         if(selected.matches('.adc-design-pdf')&&['top','bottom'].includes(side))continue;
         const edge=mark('adc-edge',area);
         edge.style.cursor=['left','right'].includes(side)?'ew-resize':'ns-resize';
         edge.onpointerdown=event=>start(event,selected,side);
       }
     }
   });
 }
 function start(event,node,kind){
   if(event.button!==0)return;
   event.preventDefault();event.stopPropagation();
   drag={node,kind,x:event.clientX,y:event.clientY,base:node.getBoundingClientRect()};
 }
 document.addEventListener('pointerdown',event=>{
   if(panel.hidden||!usable(event.target)||grouping)return;
   if(!tool||tool==='size'){
     const created=event.target.closest('.adc-design-created');
     const control=event.target.closest(protectedField);
     if(control&&control!==selected&&(!created||(!created.matches('button,.adc-design-pop')&&created.contains(control))))return;
     const node=(selected?.contains(event.target)?selected:null)||created||event.target.closest(blocks);
     if(node&&usable(node)){select(node);start(event,node,'move');}
     return;
   }
   if(!drawingTools.includes(tool))return;
   const host=event.target.closest('.adc-design-pdf-page')||document.getElementById('adcLoginCanvas');
   if(host&&canContain(host))start(event,host,tool);
 },true);
 function geometry(d,event){
   const x=event.clientX-d.x,y=event.clientY-d.y,r=d.base;
   if(drawingTools.includes(d.kind))return rect(Math.min(d.x,event.clientX),Math.min(d.y,event.clientY),d.kind==='line'?Math.max(2,Math.abs(x)):Math.abs(x),d.kind==='line'?Math.max(2,Math.abs(y)):Math.abs(y));
   const viewport=document.documentElement.clientWidth;
   const minW=d.node.matches('.adc-design-annotation,.adc-login-overlay,.adc-design-image,.adc-design-pdf,.adc-design-pdf-page > .adc-design-created')?24:120;
   const w=d.kind==='left'?Math.min(r.right-8,Math.max(minW,r.width-x)):d.kind==='right'?Math.min(viewport-r.left-8,Math.max(minW,r.width+x)):r.width;
   const minH=d.node.matches('.adc-design-annotation,.adc-login-overlay,.adc-design-image,.adc-design-pdf,.adc-design-pdf-page > .adc-design-created')?24:44;
   const h=d.kind==='top'?Math.max(minH,r.height-y):d.kind==='bottom'?Math.max(minH,r.height+y):r.height;
   return rect(r.left+(d.kind==='move'?x:d.kind==='left'?r.width-w:0),r.top+(d.kind==='move'?y:d.kind==='top'?r.height-h:0),w,h);
 }
 document.addEventListener('pointermove',event=>{
   if(panel.hidden)return;
   if(drag){
     const {r,guides}=alignedGesture(drag,event);
     const bad=drag.kind==='move'&&!validMove(drag.node,r);
     const horizontal=['left','right'].includes(drag.kind),vertical=['top','bottom'].includes(drag.kind);
     const before=horizontal?drag.base.width:drag.base.height,after=horizontal?r.width:r.height;
     const delta=Math.round(after-before);
     const measure=(horizontal||vertical)?(horizontal?'Ancho: ':'Alto: ')+Math.round(before)+' → '+Math.round(after)+' px ('+(delta>0?'+':'')+delta+' px)':dimensions(r);
     ghost(r,bad,bad?'Sin espacio':measure);
     for(const g of guides)drawGuide(g.axis,g.position,g.label);return;
   }
   if(tool==='dropdown'){
     marks.replaceChildren();
     const control=event.target.closest(selector);
     if(!control||!usable(control))return;
     const r=control.getBoundingClientRect(),w=240,h=85;
     const available=directions(r,w+6,h+6);
     const side=available.includes('abajo')?'abajo':available[0]||'abajo';
     if(!side){ghost(r,true,'Sin espacio para el panel');return}
     const x=side==='izquierda'?r.left-w-6:side==='derecha'?r.right+6:Math.min(r.left,innerWidth-w-6);
     const y=side==='arriba'?r.top-h-6:side==='abajo'?r.bottom+6:Math.min(r.top,innerHeight-h-6);
     ghost(rect(Math.max(0,x),Math.max(0,y),w,h),false,'Clic para agregar un desplegable');
   }
   if(tool==='button'||tool==='bubble'){
     const preview=placement(event);
     if(!preview){marks.replaceChildren();return}
     ghost(preview.r,false,tool==='button'?'Botón':'Aviso');
     for(const g of preview.guides)drawGuide(g.axis,g.position,g.label);
   }
   if(tool==='split'){
     marks.replaceChildren();
     const host=event.target.closest('.adc-design-pdf-page')||event.target.closest('section,article,aside,.card,main');
     if(!host||!usable(event.target))return;
     const r=host.getBoundingClientRect(),y=event.clientY;
     const guide=mark('adc-cut'+(!gap(event)?' invalid':''),rect(r.left,y,r.width,18));
     guide.textContent=gap(event)?'✂ '+Math.round(y-r.top)+' px desde arriba':'✂ Mové la línea al espacio entre dos elementos';
   }
 });
 document.addEventListener('pointerup',event=>{
   if(!drag)return;
   const d=drag;drag=null;const {r}=alignedGesture(d,event),base=d.base;
   scheduleMarks();
   if(drawingTools.includes(d.kind)){
     suppressClick=true;
     setTimeout(()=>{suppressClick=false},0);
     if(d.kind==='line'?Math.hypot(event.clientX-d.x,event.clientY-d.y)<12:r.width<24||r.height<20){
       say('Dibujá una marca más grande.');return;
     }
     if(r.left<base.left-1||r.right>base.right+1||r.top<base.top-1||r.bottom>base.bottom+1){say('Dibujá dentro del área de trabajo.');return}
     const annotation=['note','rectangle','ellipse','line'].includes(d.kind);
     const placeholder={note:'Nota',section:'Nueva sección',button:'Nuevo botón',box:'Nueva caja'};
     const title=placeholder[d.kind]?prompt('Escribí el texto.',placeholder[d.kind]):'';
     if(title===null)return;
     const key=id();
     const shape=annotation?{shape:d.kind,color:document.getElementById('adcAnnotationColor').value,
       stroke:Number(document.getElementById('adcStroke').value),flip:(event.clientX-d.x)*(event.clientY-d.y)<0}:{};
     const overlay=['box','button'].includes(d.kind)?{overlay:true}:{};
     if(!commit({kind:annotation?'annotation':d.kind,target:keyFor(d.node),id:key,title,width:r.width,height:r.height,left:r.left-base.left,top:r.top-base.top,...shape,...overlay}))return;
     const added=resolve(key);
     if(added){
       setTool('size');select(added);
       say('Arrastrá el centro para mover o un borde para cambiar el tamaño.');
     }
     return;
   }
   if(Math.max(Math.abs(event.clientX-d.x),Math.abs(event.clientY-d.y))<3)return;
   suppressClick=true;
   setTimeout(()=>{suppressClick=false},0);
   if(d.kind==='move'&&!validMove(d.node,r)){say('Ese destino queda fuera del área de trabajo.');return}
   commit({kind:'style',target:keyFor(d.node),x:r.left-base.left,y:r.top-base.top,...(d.kind==='move'?{}:{width:r.width,height:r.height})});
 },true);
 document.addEventListener('pointercancel',()=>{drag=null;scheduleMarks()});
 window.addEventListener('scroll',scheduleMarks,true);window.addEventListener('resize',scheduleMarks);
 function gap(event){
   if(event.target.closest(protectedField))return null;
   const host=event.target.closest('.adc-design-pdf-page')||event.target.closest('section,article,aside,.card,main');
   if(!host)return null;
   const children=[...host.children].filter(node=>visible(node)&&!node.matches('script,style,summary'));
   return children.find((node,i)=>i>0&&children[i-1].getBoundingClientRect().bottom<=event.clientY&&node.getBoundingClientRect().top>=event.clientY);
 }
 function directions(r,w,h){
   return Object.entries({arriba:r.top>=h,abajo:innerHeight-r.bottom>=h,izquierda:r.left>=w,derecha:innerWidth-r.right>=w}).filter(([,fits])=>fits).map(([side])=>side);
 }
 function placePanel(toggle,message,direction){
   const r=toggle.getBoundingClientRect(),w=message.offsetWidth,h=message.offsetHeight;
   const available=directions(r,w+6,h+6),side=available.includes(direction)?direction:available[0]||'abajo';
   const x=side==='izquierda'?r.left-w-6:side==='derecha'?r.right+6:r.left;
   const y=side==='arriba'?r.top-h-6:side==='abajo'?r.bottom+6:r.top;
   message.style.left=Math.max(4,Math.min(x,innerWidth-w-4))+'px';message.style.top=Math.max(4,Math.min(y,innerHeight-h-4))+'px';
 }
 const swatches=Object.entries(palette).map(([name,color])=>'<button type="button" data-swatch="'+color+'" title="'+name+'" style="background:'+color+';color:'+(name==='azul'||name==='noche'||name==='tinta'?'white':'#152844')+'">'+name+'</button>').join('');
 paletteBox.innerHTML='<label>Aplicar a <select><option value="background">Fondo</option><option value="color">Texto</option></select></label><div>'+swatches+'</div>';
 paletteBox.addEventListener('click',event=>{
   const color=event.target.dataset.swatch;if(!color||!selected)return;
   const property=paletteBox.querySelector('select').value;commit({kind:'style',target:keyFor(selected),[property]:color});
 });
 let eraseTimer,erasePreview;
 function clearErase(){clearTimeout(eraseTimer)}
 function previewErase(node){
   erasePreview?.removeAttribute('data-erase-preview');
   erasePreview=node;node?.setAttribute('data-erase-preview','');
 }
 function eraseCandidate(node){
   if(node.closest('.adc-ol-edge'))return {node:node.closest('#adcOLSheet'),kind:'hideOLEdges',label:'las dos flechas laterales de ajuste del OL-01'};
   if(node.closest('input,select,textarea,[contenteditable]'))return null;
   const fold=node.closest('.adc-design-fold');
   if(fold)return {node:fold.parentElement,kind:'unfold',label:'el plegado de esta sección'};
   const restored=node.closest('details.adc-design-always');
   if(restored)return {node:restored,kind:'restoreFold',label:'el modo siempre visible y recuperar la flecha'};
   const summary=node.closest('summary');
   if(summary&&!summary.hasAttribute('onclick'))return {node:summary.parentElement,kind:'always',label:'la flecha de este desplegable'};
   const created=node.closest('.adc-design-created');
   const background=node.closest(selector);
   const styled=background?.style.backgroundColor&&operations.some(op=>op.target===keyFor(background)&&op.background);
   if(created)return {node:created,kind:'removeAdded',label:'este elemento agregado',background:styled?background:null};
   if(styled)return {node:background,kind:'removeBackground',label:'el fondo aplicado'};
   if(operations.some(op=>op.target===keyFor(node)&&op.kind==='style'))return {node,kind:'restoreStyle',label:'los ajustes de este bloque'};
   return null;
 }
 function eraseSelected(node,ask){
   const item=eraseCandidate(node);
   if(ask&&node.closest('summary')){
     const details=node.closest('details');
     if(details&&item?.kind==='always'){
       const choice=prompt('1. Dejar siempre visible · 2. Cambiar cómo se abre · 3. Restaurar el original','1');
       if(choice==='2'){commit({kind:'detailsOpen',target:keyFor(details),open:confirm('¿Empieza abierta?')});return}
       if(choice==='3'){commit({kind:'detailsOpen',target:keyFor(details),open:originalDetailsOpen.get(details)===true});return}
       if(choice!=='1')return;
       ask=false;
     }
   }
   if(!item){say(node.closest('input,select,textarea')?'Este campo pertenece al trámite.':'Este elemento está protegido o no tiene ajustes para quitar.');return}
   if(ask&&item.background){
     const choice=prompt('1. Eliminar elemento · 2. Quitar solo el fondo','1');
     if(choice==='2'){commit({kind:'removeBackground',target:keyFor(item.background)});return}
     if(choice!=='1')return;
   }else if(ask&&!confirm('¿Querés quitar '+item.label+'?'))return;
   if(commit({kind:item.kind,target:keyFor(item.node)})){previewErase(null);select(null);say('Eliminado. Podés recuperarlo con Deshacer.')}
 }
 document.addEventListener('pointerover',event=>{
   if(tool!=='erase'||!usable(event.target))return;
   const item=eraseCandidate(event.target);
   previewErase(item?.node||null);
   if(item)say('Mantené presionado para quitar '+item.label+'.');
 });
 document.addEventListener('pointerdown',event=>{
   if(tool!=='erase'||panel.hidden||event.button!==0||!usable(event.target))return;
   event.preventDefault();event.stopImmediatePropagation();
   const node=event.target.closest(selector);
   if(!node)return;
   select(node);clearErase();
   eraseTimer=setTimeout(()=>eraseSelected(node,false),550);
 },true);
 for(const name of ['pointerup','pointercancel','pointerout'])document.addEventListener(name,clearErase,true);
 document.addEventListener('dblclick',event=>{
   if(panel.hidden||!usable(event.target)||!['','size'].includes(tool))return;
   const node=event.target.closest('.adc-login-overlay,.adc-design-annotation.note');
   if(!node||!canEditText(node))return;
   select(node);formatting.open=true;editor.focus();
 });
 function toolClick(node,event){
   if(tool==='center-screen'||tool==='center-area')return true;
   if(tool==='center-peer'){
     const reference=node.closest(blocks);
     if(!reference||!selected||reference===selected||reference.contains(selected)||selected.contains(reference)){say('Elegí otra sección como referencia.');return true}
     showCenter(selected,reference);return true;
   }

   if(!tool){const created=node.closest('.adc-design-created');if(created){select(created);return true}if(node.closest('header,nav'))queueMicrotask(()=>say('Este ajuste se verá en todas las pantallas.'));return false}
   if(tool==='move'){select(node.closest(blocks)||node);say(instructions.move);return true}
   if(tool==='doc-size'){
     const area=node.closest(documentArea)||node.querySelector(documentArea);
     if(area){select(area);say(instructions['doc-size'])}else say('Elegí la vista previa de un documento.');
     return true;
   }
   if(tool==='size'){select(node.closest('.adc-design-created')||(selected?.contains(node)?selected:null)||node.closest(blocks)||node);say(instructions[tool]);return true}
   if(drawingTools.includes(tool))return true;
   if(tool==='split'){
     const next=gap(event);
     if(!cut){cut={x:event.clientX};say('Mové la línea y hacé clic para cortar.');return true}
     if(!next){say('Mové la línea al espacio entre dos elementos.');return true}
     commit({kind:'split',target:keyFor(next),id:id(),title:'Nueva sección'});cut=null;scheduleMarks();return true;
   }
   if(tool==='erase'){
     select(node);
     if(event.detail===0)eraseSelected(node,true);
     else say('Mantené presionada la goma o pulsá Eliminar.');
     return true;
   }
   if(tool==='fold'){
     const section=node.closest('section,article,aside');
     if(section&&usable(section))commit({kind:'fold',target:keyFor(section),open:confirm('¿La sección empieza abierta?')});
     return true;
   }
   const kind=tool;
   const place=kind==='bubble'?placement(event):null;
   const host=place?.host||(kind==='dropdown'?node:null);
   if(!host)return true;
   const title=prompt('Escribí el mensaje.');
   if(!title?.trim())return true;
   const op={kind,target:keyFor(host),id:id(),title:title.trim().slice(0,180)};
   if(place){op.left=place.r.left-place.base.left;op.top=place.r.top-place.base.top;}
   if(kind==='bubble'){
     const type=prompt('Información, Atención o Confirmación','Información');
     if(type===null)return true;
     op.tone=/atenci/i.test(type)?'aviso':/confirm/i.test(type)?'confirmacion':'claro';
     op.popup=confirm('¿Mostrar el mensaje al tocar un ícono?');
   }
   if(kind==='dropdown'){
     const available=directions(host.getBoundingClientRect(),240,85);
     const side=prompt('¿Dónde querés que se abra? Escribí auto, arriba, abajo, izquierda o derecha.','auto');
     if(side===null)return true;
     op.direction=['arriba','abajo','izquierda','derecha'].includes(side.trim().toLowerCase())?side.trim().toLowerCase():available[0]||'abajo';
   }
   if(commit(op)){
    setTool('');select(resolve(op.id));
    if(kind==='dropdown')say('Desplegable agregado. Pasá a Modo navegación y pulsá Ver panel.');
   }
   return true;
 }
 const contextMenu=document.createElement('div');
 contextMenu.id='adcDesignContext';contextMenu.hidden=true;
 contextMenu.setAttribute('aria-label','Acciones del elemento');
 document.body.append(contextMenu);
 function closeContextMenu(){contextMenu.hidden=true}
 document.addEventListener('pointerdown',event=>{
   if(!contextMenu.contains(event.target))closeContextMenu();
 },true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeContextMenu()});
 document.addEventListener('contextmenu',event=>{
   if(panel.hidden||!usable(event.target)||contextMenu.contains(event.target))return;
   const node=event.target.closest('.adc-design-created')||event.target.closest(selector);
   if(!node||!keyFor(node))return;
   event.preventDefault();setTool('');select(node);
   contextMenu.replaceChildren();
   const actions=[
     ['Editar',()=>{
       const message=node.matches('.adc-design-pop')?node.querySelector('.adc-design-note'):node;
       if(canEditText(message)&&!message.matches('.rectangle,.ellipse,.line')){select(message);formatting.open=true;editor.focus();say('Editá el texto y pulsá Aplicar texto.')}
       else {setTool('size');say('Arrastrá el centro para mover o un borde para ajustar.')}
     }],
     ['Eliminar',()=>{
       if(node.matches('.adc-design-created'))eraseSelected(node,true);
       else if(confirm('¿Ocultar este elemento? Podés recuperarlo con Deshacer.')){
         commit({kind:'hideOriginal',target:keyFor(node)});select(null);
       }
     }],
     ['Mover y ajustar',()=>setTool('size')]
   ];
   for(const [label,run] of actions){
     const button=document.createElement('button');button.type='button';button.textContent=label;
     button.onclick=()=>{closeContextMenu();run()};contextMenu.append(button);
   }
   contextMenu.hidden=false;
   contextMenu.style.left=Math.max(0,Math.min(event.clientX,innerWidth-contextMenu.offsetWidth))+'px';
   contextMenu.style.top=Math.max(0,Math.min(event.clientY,innerHeight-contextMenu.offsetHeight))+'px';
 });
 const initialLayout = [];
 try {
   const draft = JSON.parse(localStorage.getItem('adc-login-design-draft') || 'null');
   load(draft?.schema===storageKey?draft.operations:initialLayout);
   dirty=false;say('Distribución cargada.');
 } catch { say('No se pudo recuperar el borrador.'); }

 window.adcProjectLayout?.attach({
   commit,keyFor,select,setTool,selected:()=>selected,tool:()=>tool,
   scope:'ingreso',panel,say,baseline:initialLayout,
   operations:()=>operations.slice(),resolve,serialize,
   append:op=>{const reverse=apply(op);if(!reverse)return false;operations.push(op);reversals.push(reverse);return true;},
   refresh:op=>{const index=operations.indexOf(op);if(index<0)return false;const reverse=apply(op);if(!reverse)return false;reversals[index]=reverse;return true;},
   hasDraft:()=>["adc-login-design-draft"].some(key=>localStorage.getItem(key)),
   clearDraft:()=>["adc-login-design-draft"].forEach(key=>localStorage.removeItem(key)),
   restoreDraft:value=>localStorage.setItem('adc-login-design-draft',value)
 });
})();
