// Máxima universal N.º 1. Revisión transitoria: no escribe valores ni MNC.
(() => {
  let active;
  function create({root, collect, save = () => {}}) {
    let pending, omitted, current, done, total, mode, requestedAction;
    const panel = document.createElement('section');
    panel.className = 'adc-review'; panel.hidden = true;
    panel.setAttribute('role','region'); panel.setAttribute('aria-label','Revisión de datos pendientes');
    panel.setAttribute('aria-live','polite');
    document.body.append(panel);
    let highlighted = [];
    const items = () => collect().filter(item => item.controls?.some(input => input?.isConnected && !input.disabled));
    const remaining = () => items().filter(item => !omitted.has(item.key));
    function clearHighlight() {
      for (const input of highlighted) {
        input.classList.remove('adc-review-missing');
        const description = (input.getAttribute('aria-describedby') || '').split(' ').filter(id => id !== 'adc-review-field-help');
        if (description.length) input.setAttribute('aria-describedby',description.join(' ')); else input.removeAttribute('aria-describedby');
      }
      highlighted = [];
    }
    function finish(result) {
      clearHighlight(); panel.hidden = true; panel.replaceChildren(); mode = null;
      const resolve = pending; pending = null;
      if (active === api) active = null;
      resolve?.(result);
    }
    function element(tag, text) { const node=document.createElement(tag);node.textContent=text;return node; }
    function button(text, action) {
      const node=element('button',text);node.type='button';node.addEventListener('click',action);panel.append(node);return node;
    }
    function position() {
      if (mode !== 'field' || !current) return;
      const input = current.controls.find(input => input.isConnected && !input.disabled);
      if (!input) return;
      const box = input.getBoundingClientRect();
      const width = Math.min(320,innerWidth-24);
      panel.style.width = `${width}px`;
      const paper=input.closest('.adc-bd02-page,#adcSC01Sheet,.adc-ol-paper');
      const paperBox=paper?.getBoundingClientRect();
      if(paperBox && innerWidth-paperBox.right-24>=260){
        panel.style.width=`${Math.min(width,innerWidth-paperBox.right-24)}px`;
        panel.style.left=`${paperBox.right+12}px`;
        panel.style.top=`${Math.max(12,Math.min(innerHeight-panel.offsetHeight-12,box.top))}px`;
        return;
      }
      if(paperBox && paperBox.left-24>=260){
        const sideWidth=Math.min(width,paperBox.left-24);
        panel.style.width=`${sideWidth}px`;
        panel.style.left=`${paperBox.left-sideWidth-12}px`;
        panel.style.top=`${Math.max(12,Math.min(innerHeight-panel.offsetHeight-12,box.top))}px`;
        return;
      }
      panel.style.left = `${Math.max(12,Math.min(innerWidth-width-12,box.left))}px`;
      const height = panel.getBoundingClientRect().height;
      const below = box.bottom+12;
      panel.style.top = `${Math.max(12,Math.min(innerHeight-height-12,below+height < innerHeight-12 ? below : box.top-height-12))}px`;
    }
    function reset(stage) {
      clearHighlight();mode=stage;panel.replaceChildren();panel.removeAttribute('style');
      panel.dataset.adcReviewStage = stage;panel.hidden=false;
    }
    function completed() {
      reset('complete');panel.append(element('h3','Revisión finalizada'),element('p','Terminaste de revisar los datos pendientes. Algunos campos pueden permanecer en blanco.'));
      button(requestedAction==='download'?'Continuar con la descarga':requestedAction==='print'?'Continuar con la impresión':'Ver vista preliminar',()=>finish(true)).focus();
      button('Volver al formulario',()=>finish(false));
    }
    function showNext() {
      const list=remaining();
      if (!list.length) return completed();
      current=list[0]; current.reveal?.(); reset('field');
      total=done+list.length;
      panel.append(element('p',`Campo ${done+1} de ${total}`),element('h3',current.label));
      const help=element('p','Te falta completar este campo');help.id='adc-review-field-help';panel.append(help);
      highlighted=current.controls.filter(input=>input?.isConnected&&!input.disabled);
      for(const input of highlighted){
        input.classList.add('adc-review-missing');
        input.setAttribute('aria-describedby',`${input.getAttribute('aria-describedby')||''} adc-review-field-help`.trim());
      }
      const input=highlighted[0];
      input?.scrollIntoView({block:'center',inline:'nearest'});
      button('Editar',()=>current.controls.find(input=>input.isConnected&&!input.disabled)?.focus({preventScroll:true}));
      button('Guardar y siguiente',()=>{
        save();
        if(remaining().some(item=>item.key===current.key)){
          help.textContent='Este dato todavía está pendiente. Completalo o elegí Seguir igual.';
          current.controls.find(input=>input.isConnected&&!input.disabled)?.focus({preventScroll:true});return;
        }
        done++;showNext();
      });
      button('Seguir igual',()=>{omitted.add(current.key);done++;showNext();});
      button('Cancelar',()=>finish(false));
      position();input?.focus({preventScroll:true});
    }
    function summary() {
      const list=items();
      if(!list.length)return finish(true);
      reset('summary');panel.append(element('h3','Hay datos pendientes'),element('p',`Encontramos ${list.length} ${list.length===1?'campo incompleto':'campos incompletos'}. Podés revisarlos ahora o continuar con los espacios en blanco.`));
      panel.append(element('small','Un borrador incompleto no implica validación administrativa oficial.'));
      button('Revisar pendientes',showNext).focus();
      button('Continuar igual',()=>finish(true)).dataset.adcReviewContinue='';
      button('Cancelar',()=>finish(false));
    }
    const api={
      review({guided=false,action='preview'}={}) {
        active?.cancel();omitted=new Set();done=0;total=items().length;active=api;
        requestedAction=action;
        return new Promise(resolve=>{pending=resolve;if(!total)finish(true);else if(guided)showNext();else summary();});
      },
      cancel:()=>finish(false)
    };
    panel.addEventListener('keydown',event=>{if(event.key==='Escape')finish(false);});
    root.addEventListener('keydown',event=>{if(pending&&event.key==='Escape')finish(false);});
    root.addEventListener('input',()=>{if(mode==='field')position();});
    root.addEventListener('change',()=>{
      if(mode==='field' && !remaining().some(item=>item.key===current.key)) {
        const help=panel.querySelector('#adc-review-field-help');if(help)help.textContent='Dato actualizado. Podés guardar y pasar al siguiente.';
      }
    });
    const observer=new MutationObserver(()=>{if(pending && (root.hidden || root.closest('.hide')))finish(false);});
    for(let parent=root;parent&&parent!==document.body;parent=parent.parentElement)observer.observe(parent,{attributes:true,attributeFilter:['class','hidden']});
    window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
    return api;
  }
  function controls(root) {
    const groups=new Map();
    for(const input of root.querySelectorAll('input,select,textarea')) {
      if(input.disabled || input.type==='hidden' || input.closest('[hidden],.hide') || input.hasAttribute('data-adc-mnc-marked') || !input.required)continue;
      const key=input.name||input.id;
      const missing=['radio','checkbox'].includes(input.type) ? ![...root.querySelectorAll('input')].some(other=>other.name===input.name&&other.checked) : !input.value.trim();
      if(!missing)continue;
      if(!groups.has(key))groups.set(key,{key,label:input.getAttribute('aria-label')||input.labels?.[0]?.textContent.trim()||key,controls:[]});
      groups.get(key).controls.push(input);
    }
    return [...groups.values()];
  }
  window.adcGuidedValidation=Object.freeze({create,controls});
})();
