(() => {
 function attach(api,ui){
  const root=document.createElement('div');root.id='adcStudioRulers';root.dataset.adcStudioUi='';document.getElementById('adcDevRulers').replaceChildren(root);
  let drag=null;const compact=innerWidth<700;
  const states={x:{left:compact?36:460,top:compact?innerHeight-56:90,length:Math.max(80,Math.min(500,innerWidth-(compact?80:500)))},y:{left:innerWidth-38,top:compact?innerHeight*.76:130,length:Math.min(400,innerHeight*(compact?.18:.6))}},rulers={};
  function render(){
   const visible=ui.active()&&document.getElementById('adcDevRules').checked;root.hidden=!visible;if(!visible)return;
   for(const axis of ['x','y']){
    const state=states[axis],ruler=rulers[axis];Object.assign(ruler.style,{left:state.left+'px',top:state.top+'px',width:(axis==='x'?state.length:24)+'px',height:(axis==='x'?24:state.length)+'px'});
    state.length=Math.max(80,Math.min(state.length,(axis==='x'?innerWidth:innerHeight)-80));
    state.left=Math.max(28,Math.min(state.left,innerWidth-(axis==='x'?state.length:24)-28));state.top=Math.max(28,Math.min(state.top,innerHeight-(axis==='y'?state.length:24)-28));
    Object.assign(ruler.style,{left:state.left+'px',top:state.top+'px',width:(axis==='x'?state.length:24)+'px',height:(axis==='x'?24:state.length)+'px'});
    const ticks=ruler.querySelector('.adc-studio-ticks');ticks.replaceChildren();const step=ui.units()==='cm'?96/2.54:40;
    ruler.style.setProperty('--studio-step',step+'px');
    for(let i=0;i*step<state.length;i++){const mark=document.createElement('span');mark.textContent=ui.units()==='cm'?i+'':i*40+'';mark.style[axis==='x'?'left':'top']=i*step+'px';ticks.append(mark);}
   }
  }
  for(const axis of ['x','y']){
   const ruler=document.createElement('div');ruler.className='adc-studio-ruler '+axis;ruler.dataset.rulerAxis=axis;
   ruler.title='Arrastrá desde la escala para crear una guía. Usá el agarre para mover la regla y el extremo para redimensionarla.';
   const move=document.createElement('button');move.type='button';move.dataset.rulerMove='';move.textContent='⠿';move.title='Arrastrá para mover esta regla.';
   const ticks=document.createElement('div');ticks.className='adc-studio-ticks';
   const resize=document.createElement('button');resize.type='button';resize.dataset.rulerResize='';resize.textContent='↔';resize.title='Arrastrá para cambiar la longitud de la regla.';
   ruler.append(ticks,move,resize);root.append(ruler);rulers[axis]=ruler;
   ruler.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();event.stopImmediatePropagation();const kind=event.target.closest('[data-ruler-move]')?'move':event.target.closest('[data-ruler-resize]')?'resize':'guide';drag={axis,kind,x:event.clientX,y:event.clientY,before:{...states[axis]},pointer:event.pointerId};ruler.setPointerCapture(event.pointerId);};
   ruler.onpointermove=event=>{if(!drag||event.pointerId!==drag.pointer)return;event.preventDefault();event.stopImmediatePropagation();const {before,kind}=drag,dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(kind==='move'){states[axis].left=Math.max(0,before.left+dx);states[axis].top=Math.max(0,before.top+dy);}else if(kind==='resize')states[axis].length=Math.max(80,Math.min(2000,before.length+(axis==='x'?dx:dy)));render();};
   ruler.onpointerup=event=>{if(!drag||event.pointerId!==drag.pointer)return;event.preventDefault();event.stopImmediatePropagation();if(drag.kind==='guide'){
    const host=ui.host(),state=states[axis];api.commit({kind:'studioGuide',target:api.keyFor(host),id:window.adcStudioPolicy.uid(),axis:axis==='x'?'y':'x',left:axis==='x'?state.left:event.clientX,top:axis==='x'?event.clientY:state.top,length:state.length});api.say('Guía creada. Se guarda con el diseño y no se imprime.');
   }drag=null;};
   ruler.onpointercancel=()=>{drag=null;};
  }
  document.getElementById('adcDevRules').addEventListener('change',render);window.addEventListener('adc:studio-units',render);window.addEventListener('resize',render);new MutationObserver(render).observe(api.panel,{attributes:true,attributeFilter:['hidden']});render();
 }
 window.adcStudioGuides=Object.freeze({attach});
})();
