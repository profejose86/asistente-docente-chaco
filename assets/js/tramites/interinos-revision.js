// REV-01: presentación de observaciones; las reglas pertenecen al formulario.
(() => {
  function create({root,viewer,conflicts,collect,save}) {
    const workspace=document.createElement('div');workspace.className='adc-interinos-workspace';
    const panel=document.createElement('aside');panel.className='adc-interinos-review';panel.hidden=true;
    panel.setAttribute('aria-label','Revisión del formulario');
    const toggle=document.createElement('button');toggle.type='button';toggle.className='alt adc-interinos-review-toggle';
    toggle.setAttribute('aria-controls','adcInterinosReviewBody');
    const body=document.createElement('div');body.id='adcInterinosReviewBody';body.className='adc-interinos-review-body';
    const close=document.createElement('button');close.type='button';close.className='alt';close.textContent='Cerrar revisión ×';
    const info=document.createElement('p');info.className='small';info.textContent='Controles de coherencia con tu perfil. No verifican la identidad del titular.';
    const cards=document.createElement('div'),count=document.createElement('span');count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.className='small';
    const conflictHome=document.createComment('Observaciones del perfil');conflicts.before(conflictHome);
    body.append(close,info,count,cards);panel.append(toggle,body);
    let enabled=false,expanded=false,startY=null;
    const mobile=()=>matchMedia('(max-width:900px)').matches;
    function expand(value,focus=false){expanded=value;panel.dataset.expanded=String(value);toggle.setAttribute('aria-expanded',String(value));body.hidden=!value;if(focus)(value?close:toggle).focus({preventScroll:true})}
    function reveal(item){
      if(mobile())expand(false);
      const input=item.controls?.find(el=>el.isConnected&&!el.disabled);if(!input)return;
      for(let el=input.parentElement;el;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;
      input.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});input.focus({preventScroll:true});
    }
    const blockers=adcGuidedValidation.createBlocking({root,save,collect:()=>enabled?collect().filter(item=>item.blocking):[]});
    blockers.panel.dataset.adcInterinosBlocking='';panel.append(blockers.panel);
    function refresh(){
      if(!enabled)return;
      const items=collect();cards.replaceChildren();
      for(const item of items){
        const card=document.createElement('section');card.className='adc-interinos-review-card';card.dataset.reviewKey=item.key;card.dataset.severity=item.blocking?'blocking':'warning';
        const title=document.createElement('strong');title.textContent=item.title||item.label;
        const text=document.createElement('p');text.textContent=(item.blocking?'Requiere corrección. ':'Aviso revisable. ')+item.message;
        card.append(title,text);
        if(item.controls?.length){const go=document.createElement('button');go.type='button';go.className='alt';go.textContent='Ir al campo';go.onclick=()=>reveal(item);card.append(go)}
        if(item.action){const action=document.createElement('button');action.type='button';action.className='alt';action.textContent=item.actionLabel||'Revisar';action.onclick=item.action;card.append(action)}
        cards.append(card);
      }
      const n=items.length+conflicts.children.length,blocking=items.filter(item=>item.blocking).length;
      toggle.textContent=`🔔 Revisión del formulario (${n})`;
      count.textContent=n?`${n} pendientes · ${blocking} bloqueantes`:'Sin observaciones pendientes';
      panel.dataset.pendingCount=String(n);blockers.refresh();
    }
    function setEnabled(value){
      enabled=Boolean(value);panel.hidden=!enabled;
      if(enabled){if(!workspace.isConnected){viewer.before(workspace);workspace.append(viewer,panel)}body.append(conflicts);expand(!mobile());refresh()}
      else{blockers.cancel();conflictHome.after(conflicts);if(workspace.isConnected){workspace.before(viewer);workspace.remove()}conflicts.hidden=false;}
      root.classList.toggle('adc-interinos-review-enabled',enabled);
    }
    toggle.onclick=()=>expand(!expanded);close.onclick=()=>expand(false,true);
    toggle.addEventListener('touchstart',e=>{startY=e.touches[0]?.clientY},{passive:true});
    toggle.addEventListener('touchend',e=>{const end=e.changedTouches[0]?.clientY;if(startY!==null&&Math.abs(end-startY)>30)expand(end<startY);startY=null},{passive:true});
    close.addEventListener('touchstart',e=>{startY=e.touches[0]?.clientY},{passive:true});
    close.addEventListener('touchend',e=>{if(startY!==null&&e.changedTouches[0]?.clientY-startY>30)expand(false);startY=null},{passive:true});
    panel.addEventListener('keydown',e=>{if(e.key==='Escape'){expand(false,true);e.stopPropagation()}});
    matchMedia('(max-width:900px)').addEventListener('change',()=>expand(!mobile()));
    return Object.freeze({setEnabled,refresh,open(){refresh();expand(true)},check(){refresh();const ok=blockers.check();if(Number(panel.dataset.pendingCount))expand(true);return ok},canGenerate(){return !collect().some(item=>item.blocking)}});
  }
  window.adcInterinosReview=Object.freeze({create});
})();
