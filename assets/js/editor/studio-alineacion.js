(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.adcStudioAlignment=api;})(typeof window==='object'?window:globalThis,()=>{
 let current=null;
 const axisEdges={x:['left','center','right'],y:['top','middle','bottom']};
 const value=(rect,edge)=>({left:rect.left,center:rect.left+rect.width/2,right:rect.left+rect.width,top:rect.top,middle:rect.top+rect.height/2,bottom:rect.top+rect.height})[edge];
 function match(rect,sources,{threshold=7,free=false,edges=axisEdges}={}){
  const guides=[];
  for(const axis of ['x','y']){
   let best=null;
   for(const ownEdge of edges[axis]||[])for(const source of sources){
    const candidates=source.axis?(source.axis===axis?[axis==='x'?'left':'top']:[]):source.edges?.[axis]||axisEdges[axis];
    for(const sourceEdge of candidates){
     // Centros entre sí; bordes entre sí. Una guía explícita admite ambos.
     if(!source.axis&&['center','middle'].includes(ownEdge)!==['center','middle'].includes(sourceEdge))continue;
     const position=value(source.rect,sourceEdge),delta=position-value(rect,ownEdge);
     if(!Number.isFinite(delta)||Math.abs(delta)>threshold)continue;
     const rank=ownEdge===sourceEdge?0:1;
     if(!best||Math.abs(delta)<Math.abs(best.delta)||Math.abs(delta)===Math.abs(best.delta)&&rank<best.rank)best={axis,position,delta,ownEdge,sourceEdge,rank,label:source.label||'Bloque'};
    }
   }
   if(best)guides.push(best);
  }
  return {x:free?0:guides.find(guide=>guide.axis==='x')?.delta||0,y:free?0:guides.find(guide=>guide.axis==='y')?.delta||0,guides,free};
 }
 function attach(api,ui){
  const layer=document.createElement('div');layer.id='adcStudioSmartGuides';layer.dataset.adcStudioUi='';layer.hidden=true;document.body.append(layer);
  const badge=document.createElement('output');badge.id='adcStudioDragMetrics';badge.setAttribute('aria-label','Medidas del arrastre en centímetros');
  const free=event=>event.altKey||event.shiftKey||!ui.snap();
  function align(node,rect,options={}){
   const sources=[];
   for(const other of document.querySelectorAll('section,article,header,nav,h1,h2,.adc-design-created,.adc-interactive-card')){
    if(other===node||other.contains(node)||node.contains(other)||window.adcStudioPolicy.isUi(other)||!other.getClientRects().length||getComputedStyle(other).visibility==='hidden')continue;
    const r=other.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)continue;
    sources.push({rect:r,axis:other.matches('.adc-studio-guide')?other.dataset.guideAxis:null,label:other.matches('.adc-studio-guide')?'Guía':'Bloque'});
   }
   sources.push({rect:{left:0,top:0,width:innerWidth,height:innerHeight},edges:{x:['center'],y:['middle']},label:'Pantalla'});
   return match(rect,sources,options);
  }
  function render(node,event,result={guides:[]},delta={x:0,y:0}){
   if(!ui.active())return hide();layer.hidden=false;layer.replaceChildren();
   for(const guide of result.guides){
    const line=document.createElement('div');line.className='adc-studio-laser '+guide.axis;line.style[guide.axis==='x'?'left':'top']=guide.position+'px';line.dataset.alignment=guide.ownEdge;
    const label=document.createElement('span');label.textContent=guide.label+' · '+({center:'centro',middle:'centro',left:'izquierda',right:'derecha',top:'arriba',bottom:'abajo'})[guide.sourceEdge]+(result.free?' · libre':'');line.append(label);layer.append(line);
   }
   const r=node.getBoundingClientRect(),cm=value=>(value/window.adcStudioPolicy.pxPerCm).toFixed(2);
   badge.textContent='X '+cm(r.left+scrollX)+' cm · Y '+cm(r.top+scrollY)+' cm · Δ '+cm(delta.x)+' / '+cm(delta.y)+' cm';layer.append(badge);
   badge.style.left=Math.max(8,Math.min(innerWidth-badge.offsetWidth-8,event.clientX+16))+'px';badge.style.top=Math.max(8,Math.min(innerHeight-badge.offsetHeight-8,event.clientY+18))+'px';
  }
  function hide(){layer.hidden=true;layer.replaceChildren();}
  current={align,render,hide,free};return current;
 }
 return Object.freeze({match,attach,get current(){return current;}});
});
