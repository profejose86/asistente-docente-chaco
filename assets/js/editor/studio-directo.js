(() => {
 function attach(api,ui){
  const policy=window.adcStudioPolicy,frame=document.createElement('div');frame.id='adcStudioHover';frame.dataset.adcStudioUi='';frame.hidden=true;document.body.append(frame);
  let hover=null,gesture=null,blockClick=false,raf=0;
  const alignment=window.adcStudioAlignment.attach(api,ui);
  const documentNode=node=>node.matches('.adc-design-pdf,#adcSC01Sheet,#adcOLSheet,.adc-bd02-document,[data-adc-official-sheet],.dj02-paper,#dj .dj-preview,.adc-official-preview');
  const documentRatio=g=>Math.max(.1,g.side?.length===1?(['e','w'].includes(g.side)?g.width/g.rect.width:g.height/g.rect.height):Math.min(g.width/g.rect.width,g.height/g.rect.height));
  const candidate=target=>{
   if(!(target instanceof Element)||policy.isUi(target))return null;
   return target.closest('.adc-design-created')||target.closest('button,h1,h2,h3,h4,p,label,article,section,div,span,img,table');
  };
  const enabled=()=>ui.active()&&ui.direct()&&!window.adcStudioText.isEditing()&&['','size'].includes(api.tool());
  function paint(node){
   hover=node;
   if(!enabled()||!node?.isConnected||(policy.anchored(node)||policy.locked(node))||!node.getClientRects().length){frame.hidden=true;return;}
   const r=node.getBoundingClientRect();frame.hidden=false;Object.assign(frame.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
   if(!frame.children.length)for(const side of ['nw','n','ne','e','se','s','sw','w']){const grip=document.createElement('button');grip.type='button';grip.dataset.studioGrip=side;grip.title='Arrastrá para redimensionar desde '+side;grip.setAttribute('aria-label','Redimensionar '+side);frame.append(grip);}
  }
  function begin(event,node,side){
   if(!enabled()||event.button!==0||!node?.isConnected||(policy.anchored(node)||policy.locked(node)))return;
   event.preventDefault();event.stopImmediatePropagation();api.select(node);
   if(policy.isUi(document.activeElement))document.activeElement.blur();
   const computed=getComputedStyle(node),r=node.getBoundingClientRect();
   gesture={node,side,x:event.clientX,y:event.clientY,rect:r,style:node.getAttribute('style'),scale:ui.factor(node),pointer:event.pointerId,tx:parseFloat(node.dataset.adcDesignX)||parseFloat(computed.translate)||0,ty:parseFloat(node.dataset.adcDesignY)||parseFloat(computed.translate.split(' ')[1])||0,docScale:parseFloat(computed.scale)||1,dx:0,dy:0,width:r.width,height:r.height};
   node.setPointerCapture(event.pointerId);
  }
  window.addEventListener('pointermove',event=>{
   if(gesture){
    event.preventDefault();event.stopImmediatePropagation();const g=gesture;if(event.pointerId!==g.pointer)return;
    let dx=event.clientX-g.x,dy=event.clientY-g.y,width=g.rect.width,height=g.rect.height;
    if(g.side){
     if(g.side.includes('e'))width+=dx;if(g.side.includes('w'))width-=dx;
     if(g.side.includes('s'))height+=dy;if(g.side.includes('n'))height-=dy;
     width=Math.max(g.node.matches('.adc-studio-guide[data-guide-axis=x]')?1:24,width);height=Math.max(g.node.matches('.adc-studio-guide[data-guide-axis=y]')?1:24,height);
     dx=g.side.includes('w')?g.rect.width-width:0;dy=g.side.includes('n')?g.rect.height-height:0;
    }
    const free=event.altKey||event.shiftKey||!ui.snap();
    const edges=g.side?{x:g.side.includes('w')?['left']:g.side.includes('e')?['right']:[],y:g.side.includes('n')?['top']:g.side.includes('s')?['bottom']:[]}:undefined;
    const matched=alignment.align(g.node,{left:g.rect.left+dx,top:g.rect.top+dy,width,height},{free,...(edges?{edges}:{})});
    if(!g.side){dx+=matched.x;dy+=matched.y;}
    else{
     if(g.side.includes('e'))width+=matched.x;if(g.side.includes('w')){width-=matched.x;dx+=matched.x;}
     if(g.side.includes('s'))height+=matched.y;if(g.side.includes('n')){height-=matched.y;dy+=matched.y;}
    }
    Object.assign(g,{dx,dy,width,height});
    if(documentNode(g.node)&&g.side){g.node.style.scale=String(g.docScale*documentRatio(g));}
    else if(g.side)Object.assign(g.node.style,{boxSizing:'border-box',width:width/g.scale.x+'px',height:height/g.scale.y+'px',minWidth:'0',minHeight:'0'});
    g.node.style.translate=(g.tx+dx/g.scale.x)+'px '+(g.ty+dy/g.scale.y)+'px';paint(g.node);ui.updateBadge();alignment.render(g.node,event,matched,{x:dx,y:dy});return;
   }
   if(!enabled()||event.target.closest?.('#adcStudioHover'))return;
   cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>paint(candidate(event.target)));
  },true);
  window.addEventListener('pointerdown',event=>{
   const grip=event.target.closest?.('[data-studio-grip]');
   if(grip){begin(event,hover,grip.dataset.studioGrip);return;}
   if(!enabled()||policy.isUi(event.target))return;
   if(policy.locked(event.target)){event.preventDefault();event.stopImmediatePropagation();api.select(event.target.closest('[data-adc-studio-locked]')||event.target);return;}
   const node=candidate(event.target);if(!node||(policy.anchored(node)||policy.locked(node)))return;
   // Las líneas conservan la edición específica de sus extremos con botón derecho.
   if(node.matches('.adc-design-annotation.line'))return;
   begin(event,node,null);
  },true);
  function restore(g){if(g.style===null)g.node.removeAttribute('style');else g.node.setAttribute('style',g.style);}
  function finish(event,cancel=false){
   if(!gesture||event.pointerId!==gesture.pointer)return;
   const g=gesture;gesture=null;restore(g);alignment.hide();event.preventDefault();event.stopImmediatePropagation();
   if(g.node.hasPointerCapture(event.pointerId))g.node.releasePointerCapture(event.pointerId);
   if(!cancel&&Math.hypot(g.dx,g.dy)+Math.abs(g.width-g.rect.width)+Math.abs(g.height-g.rect.height)>2){
    const target=api.keyFor(g.node);
    if(documentNode(g.node)){
     const ratio=g.side?documentRatio(g):1;
     api.commit({kind:'documentTransform',target,x:g.tx+g.dx/g.scale.x,y:g.ty+g.dy/g.scale.y,scale:Math.min(5,Math.max(.1,g.docScale*ratio))});
    }else api.commit({kind:'style',target,space:'local',x:g.dx/g.scale.x,y:g.dy/g.scale.y,...(g.side?{width:g.width/g.scale.x,height:g.height/g.scale.y}:{})});
   }
   blockClick=true;setTimeout(()=>{blockClick=false;},0);paint(g.node);ui.updateBadge();
  }
  window.addEventListener('pointerup',event=>finish(event),true);window.addEventListener('pointercancel',event=>finish(event,true),true);
  window.addEventListener('click',event=>{if(blockClick&&!policy.isUi(event.target)){event.preventDefault();event.stopImmediatePropagation();}},true);
  window.addEventListener('keydown',event=>{
   if(!ui.active()||policy.isUi(event.target)||event.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
   if(event.key==='Escape'&&gesture){restore(gesture);gesture=null;frame.hidden=true;alignment.hide();return;}
   const node=api.selected();if(!node)return;
   if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='d'){
    event.preventDefault();event.stopImmediatePropagation();ui.duplicate();return;
   }
   if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();event.stopImmediatePropagation();api.commit({kind:'hideOriginal',target:api.keyFor(node)});frame.hidden=true;return;}
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
   event.preventDefault();event.stopImmediatePropagation();const step=event.shiftKey?10:1,scale=ui.factor(node);
   api.commit({kind:'style',target:api.keyFor(node),space:'local',x:(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0)/scale.x,y:(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0)/scale.y});paint(node);
  },true);
  new MutationObserver(()=>{if(api.panel.hidden){if(gesture){restore(gesture);gesture=null;}frame.hidden=true;alignment.hide();}}).observe(api.panel,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('blur',()=>{if(gesture){restore(gesture);gesture=null;frame.hidden=true;}alignment.hide();});
  window.addEventListener('adc:studio-text-start',()=>{frame.hidden=true;alignment.hide();});
  window.addEventListener('scroll',()=>paint(hover),true);window.addEventListener('resize',()=>paint(hover));
 }
 window.adcStudioDirect=Object.freeze({attach});
})();
