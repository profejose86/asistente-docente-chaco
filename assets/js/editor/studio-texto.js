// Edición in situ: una única operación text, con el mismo undo y guardado del motor.
(() => {
 let controller=null;
 const placeholderSelector='input:not([type]),input[type=text],input[type=email],input[type=password],input[type=tel],input[type=url],input[type=search],input[type=number],textarea';
 const labelWithFields=node=>node.matches('label')&&!!node.querySelector('input,textarea,select')&&[...node.childNodes].some(child=>child.nodeType===3&&child.textContent.trim());
 const surfaceEligible=node=>node.matches(placeholderSelector)||labelWithFields(node);
 const editableSelector=placeholderSelector+',h1,h2,h3,h4,h5,h6,p,span,label,small,strong,summary,a,td,th,li,button';
 function attach(api,ui){
  let editing=null,lastDown=null;
  const helpers=window.adcEditorCommon.createHelpers(api.panel),policy=window.adcStudioPolicy;
  function finish(save=true){
   const state=editing;if(!state)return;editing=null;
   const {node,html,attributes,surface}=state;
   if(surface){surface.remove();document.body.classList.remove('adc-studio-typing');if(save&&surface.value!==html)api.commit({kind:state.surfaceKind,target:api.keyFor(node),text:surface.value});api.select(node);window.dispatchEvent(new Event('adc:studio-text-end'));ui.updateBadge();return;}
   const buffer=document.createElement('div');buffer.append(helpers.cleanHtml(node.innerHTML,false));const next=buffer.innerHTML;
   node.innerHTML=html;
   for(const [key,value] of Object.entries(attributes)){if(value===null)node.removeAttribute(key);else node.setAttribute(key,value);}
   document.body.classList.remove('adc-studio-typing');
   if(node.isConnected){
    if(save&&next!==html)api.commit({kind:'text',target:api.keyFor(node),html:next});
    api.select(node);api.say(save?'Texto aplicado al borrador. Commit to local guarda el archivo.':'Edición de texto cancelada.');
   }
   window.dispatchEvent(new Event('adc:studio-text-end'));ui.updateBadge();
  }
  function begin(node){
   if(!ui.active()||!['','size'].includes(api.tool())||!node?.isConnected||policy.isUi(node)||policy.locked(node)||(!surfaceEligible(node)&&(policy.anchored(node)||!helpers.canEditText(node))))return false;
   if(editing?.node===node)return true;
   finish();api.select(node);api.setTool('');
   if(surfaceEligible(node)){
    const surface=document.createElement('input'),r=node.getBoundingClientRect();surface.type='text';surface.value=labelWithFields(node)?[...node.childNodes].filter(child=>child.nodeType===3).map(child=>child.textContent).join('').trim():node.getAttribute('placeholder')||'';surface.dataset.adcStudioUi='';surface.id='adcStudioPlaceholderEditor';surface.setAttribute('aria-label',labelWithFields(node)?'Editar etiqueta':'Editar placeholder');Object.assign(surface.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:Math.max(32,r.height)+'px',zIndex:'2147483647'});document.body.append(surface);editing={node,html:surface.value,surface,surfaceKind:labelWithFields(node)?'labelText':'placeholder'};document.body.classList.add('adc-studio-typing');surface.focus();surface.select();surface.addEventListener('blur',()=>finish());window.dispatchEvent(new Event('adc:studio-text-start'));return true;
   }
   const attributes=Object.fromEntries(['contenteditable','role','aria-label','aria-multiline','tabindex','data-adc-studio-editing'].map(key=>[key,node.getAttribute(key)]));
   editing={node,html:node.innerHTML,attributes};node.contentEditable='true';node.dataset.adcStudioEditing='';node.setAttribute('role','textbox');node.setAttribute('aria-multiline','true');node.setAttribute('aria-label','Editar texto en pantalla');node.tabIndex=0;
   document.body.classList.add('adc-studio-typing');node.focus({preventScroll:true});
   const selection=getSelection(),range=document.createRange();range.selectNodeContents(node);selection.removeAllRanges();selection.addRange(range);
   api.say('Escribí aquí. Enter o clic afuera aplica; Shift+Enter agrega una línea; Esc cancela.');window.dispatchEvent(new Event('adc:studio-text-start'));return true;
  }
  controller={begin,finish,isEditing:node=>!!editing&&(!node||(editing.surface||editing.node).contains(node)),
   double(event){
    if(!ui.active()||policy.isUi(event.target))return;
    if((editing?.surface||editing?.node)?.contains(event.target)){event.stopImmediatePropagation();return;}
    const node=event.target.closest?.(editableSelector);if(!node||!begin(node))return;
    event.preventDefault();event.stopImmediatePropagation();
   },
   pointer(event){
    if(editing){if((editing.surface||editing.node).contains(event.target)){event.stopImmediatePropagation();return;}finish();}
    if(!ui.active()||!['','size'].includes(api.tool())||event.button!==0||policy.isUi(event.target)){lastDown=null;return;}
    const node=event.target.closest?.(editableSelector);if(!node||policy.locked(node)||(!surfaceEligible(node)&&(!helpers.canEditText(node)||policy.anchored(node)))){lastDown=null;return;}
    const now=performance.now(),double=event.detail>=2||lastDown?.node===node&&now-lastDown.time<500&&Math.hypot(event.clientX-lastDown.x,event.clientY-lastDown.y)<8;
    lastDown={node,time:now,x:event.clientX,y:event.clientY};
    if(double&&begin(node)){event.preventDefault();event.stopImmediatePropagation();}
   },
   click(event){if((editing?.surface||editing?.node)?.contains(event.target)){if(!editing.surface)event.preventDefault();event.stopImmediatePropagation();}},
   key(event){
    if(!editing||event.isComposing)return;
    if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();event.stopImmediatePropagation();finish();}
    else if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();finish(false);}
   },
   paste(event){
    if(editing?.surface||!(editing?.surface||editing?.node)?.contains(event.target))return;event.preventDefault();event.stopImmediatePropagation();
    const text=event.clipboardData?.getData('text/plain')||'',selection=getSelection();if(!selection.rangeCount)return;
    const range=selection.getRangeAt(0);if(!editing.node.contains(range.commonAncestorContainer))return;
    range.deleteContents();const node=document.createTextNode(text);range.insertNode(node);range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);
   }
  };
  window.addEventListener('blur',()=>finish());
  new MutationObserver(()=>{if(api.panel.hidden)finish();}).observe(api.panel,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('focusout',event=>{if(editing?.node===event.target)finish();},true);
 }
 // Registrados antes que los handlers históricos: conservan caret y selección nativa.
 for(const [name,method] of [['dblclick','double'],['pointerdown','pointer'],['click','click'],['keydown','key'],['paste','paste']])window.addEventListener(name,event=>controller?.[method](event),true);
 window.adcStudioText=Object.freeze({attach,begin:node=>controller?.begin(node),finish:save=>controller?.finish(save),isEditing:node=>controller?.isEditing(node)||false});
})();
