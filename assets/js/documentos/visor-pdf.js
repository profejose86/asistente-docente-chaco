// Navegación visual. La escala y el PDF siguen perteneciendo al motor del formulario.
(() => {
  function create({viewport,size,getScale,setScale,fit,doubleActivateFullscreen=()=>false,
    toggleFullscreenOnDoubleActivate=()=>false,exitFullscreenOnBack=()=>false}) {
    const frame=document.createElement('div');
    frame.className='adc-pdf-viewer';
    viewport.before(frame);
    frame.append(viewport);
    const controls=document.createElement('div');
    controls.className='adc-pdf-navigation';
    controls.dataset.adcStudioUi='';
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label','Zoom y vista del documento');
    controls.innerHTML=`<button type="button" data-viewer-action="out" aria-label="Alejar documento">−</button>
      <input type="range" min="25" max="200" step="1" value="100" aria-label="Zoom del documento">
      <output aria-live="polite">100 %</output>
      <button type="button" data-viewer-action="in" aria-label="Acercar documento">+</button>
      <button type="button" data-viewer-action="page">Ajustar a pantalla</button>
      <button type="button" data-viewer-action="width">Ajustar al ancho</button>
      <button type="button" data-viewer-action="fullscreen" aria-pressed="false">Pantalla completa</button>`;
    const vertical=document.createElement('input');
    vertical.type='range';vertical.min='0';vertical.max='100';vertical.step='.1';vertical.value='0';
    vertical.className='adc-pdf-scroll';
    vertical.dataset.adcStudioUi='';
    vertical.setAttribute('aria-label','Posición vertical del documento');
    vertical.setAttribute('aria-orientation','vertical');
    frame.append(controls,vertical);
    const slider=controls.querySelector('input');
    const output=controls.querySelector('output');
    const fullButton=controls.querySelector('[data-viewer-action=fullscreen]');
    let enabled=false,timer,drag=null,pinch=null,controlsActive=false,previousOverflow='';
    let fullscreenPending=false,historyEntry=null,historyCleanup=null,finishHistoryCleanup=null;
    const interactive='input,textarea,select,button,a,label,[contenteditable],.adc-document-editor-shield';
    const editing=()=>document.body.classList.contains('adcDesignActive');
    const blocked=target=>editing()||Boolean(target.closest(interactive));
    let tapStart=null,lastTap=null,lastTouchTime=-Infinity;
    function resetTaps(){tapStart=null;lastTap=null;}
    function enterFullscreen(){
      if((document.fullscreenElement===frame||frame.classList.contains('adc-pdf-expanded'))&&!toggleFullscreenOnDoubleActivate())return;
      fullscreen();
    }
    viewport.addEventListener('dblclick',event=>{
      if(!enabled||!doubleActivateFullscreen()||blocked(event.target)||performance.now()-lastTouchTime<700)return;
      event.preventDefault();enterFullscreen();
    });
    viewport.addEventListener('touchstart',event=>{
      lastTouchTime=performance.now();
      if(!enabled||!doubleActivateFullscreen()||event.touches.length!==1||blocked(event.target)){
        resetTaps();return;
      }
      const touch=event.touches[0];
      tapStart={id:touch.identifier,x:touch.clientX,y:touch.clientY,time:performance.now()};
    },{passive:true});
    viewport.addEventListener('touchmove',event=>{
      const touch=[...event.touches].find(item=>item.identifier===tapStart?.id);
      if(!touch||event.touches.length!==1||Math.hypot(touch.clientX-tapStart.x,touch.clientY-tapStart.y)>12)resetTaps();
    },{passive:true});
    viewport.addEventListener('touchend',event=>{
      const start=tapStart;
      tapStart=null;lastTouchTime=performance.now();
      const touch=[...event.changedTouches].find(item=>item.identifier===start?.id);
      if(!enabled||!doubleActivateFullscreen()||!start||!touch||event.touches.length||blocked(event.target)||lastTouchTime-start.time>350){
        resetTaps();return;
      }
      if(Math.hypot(touch.clientX-start.x,touch.clientY-start.y)>12){resetTaps();return;}
      if(lastTap&&lastTouchTime-lastTap.time<400&&Math.hypot(touch.clientX-lastTap.x,touch.clientY-lastTap.y)<28){
        if(event.cancelable)event.preventDefault();
        resetTaps();enterFullscreen();
      }else lastTap={x:touch.clientX,y:touch.clientY,time:lastTouchTime};
    },{passive:false});
    viewport.addEventListener('touchcancel',resetTaps,{passive:true});
    const clamp=value=>Math.max(.25,Math.min(2,value));
    function schedule(){
      clearTimeout(timer);
      timer=setTimeout(()=>{
        if(drag||pinch||controlsActive||controls.matches(':hover,:focus-within')||vertical.matches(':hover,:focus'))return;
        frame.classList.remove('adc-pdf-controls-visible');
      },1700);
    }
    function reveal(){
      if(!enabled)return;
      frame.classList.add('adc-pdf-controls-visible');schedule();
    }
    function sync(){
      if(!enabled)return;
      const percent=Math.round(getScale()*100);
      slider.value=String(percent);output.textContent=percent+' %';
      const maximum=viewport.scrollHeight-viewport.clientHeight;
      vertical.disabled=maximum<=1;
      vertical.value=maximum>0?String(viewport.scrollTop/maximum*100):'0';
      vertical.setAttribute('aria-valuetext',Math.round(Number(vertical.value))+' % del recorrido');
    }
    function scaleAt(value,point){
      const rect=viewport.getBoundingClientRect();
      const anchor=point||{x:rect.left+viewport.clientWidth/2,y:rect.top+viewport.clientHeight/2};
      const before=size.getBoundingClientRect(),old=getScale();
      const x=(anchor.x-before.left)/old,y=(anchor.y-before.top)/old;
      setScale(clamp(value));
      const after=size.getBoundingClientRect();
      viewport.scrollLeft+=after.left+x*getScale()-anchor.x;
      viewport.scrollTop+=after.top+y*getScale()-anchor.y;
      sync();reveal();
    }
    function leaveExpanded(){
      if(frame.classList.contains('adc-pdf-expanded')){
        frame.classList.remove('adc-pdf-expanded');document.body.style.overflow=previousOverflow;
      }
      fullButton.textContent='Pantalla completa';fullButton.setAttribute('aria-pressed','false');
      if(historyEntry){
        const entry=historyEntry;
        historyEntry=null;
        if(history.state?.adcPdfFullscreen===entry){
          historyCleanup=new Promise(resolve=>{finishHistoryCleanup=resolve;});
          history.back();
        }
      }
    }
    async function fullscreen(){
      if(fullscreenPending)return;
      fullscreenPending=true;
      try{
        if(document.fullscreenElement===frame){await document.exitFullscreen();return;}
        if(frame.classList.contains('adc-pdf-expanded')){leaveExpanded();sync();return;}
        if(historyCleanup)await historyCleanup;
        if(!enabled)return;
        try{
          if(!frame.requestFullscreen)throw Error('Sin pantalla completa nativa');
          await frame.requestFullscreen();
        }catch{
          previousOverflow=document.body.style.overflow;
          document.body.style.overflow='hidden';frame.classList.add('adc-pdf-expanded');
        }
        if(exitFullscreenOnBack()){
          const entry=crypto.randomUUID();
          try{
            history.pushState({...history.state,adcPdfFullscreen:entry},'');
            historyEntry=entry;
          }catch{
            historyEntry=null;
          }
        }
        fullButton.textContent='Salir de pantalla completa';fullButton.setAttribute('aria-pressed','true');reveal();
      }finally{
        fullscreenPending=false;
      }
    }
    window.addEventListener('popstate',()=>{
      if(finishHistoryCleanup){
        const resolve=finishHistoryCleanup;
        historyCleanup=null;finishHistoryCleanup=null;
        resolve();
      }
      if(historyEntry&&history.state?.adcPdfFullscreen!==historyEntry){
        historyEntry=null;
        if(document.fullscreenElement===frame||frame.classList.contains('adc-pdf-expanded'))fullscreen();
      }
    });
    controls.addEventListener('click',event=>{
      const action=event.target.closest('[data-viewer-action]')?.dataset.viewerAction;
      if(action==='out')scaleAt(getScale()-.1);
      if(action==='in')scaleAt(getScale()+.1);
      if(action==='page'||action==='width'){fit(action);sync();reveal();}
      if(action==='fullscreen')fullscreen();
    });
    slider.addEventListener('input',()=>scaleAt(Number(slider.value)/100));
    vertical.addEventListener('input',()=>{
      viewport.scrollTop=Number(vertical.value)/100*(viewport.scrollHeight-viewport.clientHeight);reveal();
    });
    viewport.addEventListener('scroll',()=>{sync();reveal();},{passive:true});
    frame.addEventListener('pointermove',reveal,{passive:true});
    frame.addEventListener('pointerdown',reveal,{passive:true});
    frame.addEventListener('focusin',reveal);
    frame.addEventListener('focusout',schedule);
    for(const bar of [controls,vertical]){
      bar.addEventListener('pointerdown',()=>{controlsActive=true;reveal();clearTimeout(timer)});
      bar.addEventListener('pointerenter',()=>{reveal();clearTimeout(timer)});
      bar.addEventListener('pointerleave',schedule);
      bar.addEventListener('pointerup',schedule);
    }
    document.addEventListener('pointerup',()=>{controlsActive=false;schedule()});
    document.addEventListener('pointercancel',()=>{controlsActive=false;schedule()});
    viewport.addEventListener('wheel',event=>{
      if(!enabled||event.ctrlKey||blocked(event.target))return;
      // Ctrl+rueda conserva el zoom de accesibilidad del navegador.
      event.preventDefault();
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?viewport.clientHeight:1);
      scaleAt(getScale()*Math.exp(-Math.max(-100,Math.min(100,delta))*.0015),{x:event.clientX,y:event.clientY});
    },{passive:false});
    viewport.addEventListener('pointerdown',event=>{
      if(!enabled||event.pointerType!=='mouse'||event.button!==0||blocked(event.target)||String(getSelection()).trim())return;
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
      viewport.setPointerCapture(event.pointerId);frame.classList.add('adc-pdf-grabbing');event.preventDefault();
    });
    viewport.addEventListener('pointermove',event=>{
      if(drag?.id!==event.pointerId)return;
      if(editing()){endDrag();return;}
      viewport.scrollLeft=drag.left-(event.clientX-drag.x);
      viewport.scrollTop=drag.top-(event.clientY-drag.y);sync();
    });
    function endDrag(){drag=null;frame.classList.remove('adc-pdf-grabbing');schedule();}
    viewport.addEventListener('pointerup',endDrag);
    viewport.addEventListener('pointercancel',endDrag);
    viewport.addEventListener('lostpointercapture',endDrag);
    function touchGeometry(touches){
      const [a,b]=touches;
      return {distance:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2};
    }
    viewport.addEventListener('touchstart',event=>{
      if(!enabled||event.touches.length!==2||[...event.touches].some(touch=>blocked(touch.target)))return;
      const geometry=touchGeometry(event.touches);
      pinch={...geometry,scale:getScale()};
      if(event.cancelable)event.preventDefault();reveal();
    },{passive:false});
    viewport.addEventListener('touchmove',event=>{
      if(!pinch||event.touches.length!==2)return;
      if(event.cancelable)event.preventDefault();
      const geometry=touchGeometry(event.touches);
      scaleAt(pinch.scale*geometry.distance/Math.max(1,pinch.distance),geometry);
      viewport.scrollLeft-=geometry.x-pinch.x;viewport.scrollTop-=geometry.y-pinch.y;
      pinch.x=geometry.x;pinch.y=geometry.y;
    },{passive:false});
    const endPinch=()=>{pinch=null;schedule()};
    viewport.addEventListener('touchend',endPinch);viewport.addEventListener('touchcancel',endPinch);
    document.addEventListener('keydown',event=>{
      if(enabled&&event.key==='Escape'&&frame.classList.contains('adc-pdf-expanded')){leaveExpanded();fullButton.focus();}
    });
    document.addEventListener('fullscreenchange',()=>{
      if(enabled&&!document.fullscreenElement)leaveExpanded();
      requestAnimationFrame(sync);
    });
    new ResizeObserver(sync).observe(viewport);
    function setEnabled(value){
      resetTaps();lastTouchTime=-Infinity;
      enabled=Boolean(value);frame.classList.toggle('adc-pdf-viewer-active',enabled);
      controls.hidden=!enabled;vertical.hidden=!enabled;
      if(enabled){reveal();sync();}
      else{endDrag();endPinch();clearTimeout(timer);leaveExpanded();if(document.fullscreenElement===frame)document.exitFullscreen().catch(()=>{});}
    }
    setEnabled(false);
    return Object.freeze({setEnabled,sync});
  }
  window.adcPdfViewer=Object.freeze({create});
})();
