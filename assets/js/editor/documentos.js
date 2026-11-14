// Edición visual del documento completo: nunca redimensionar sólo el fondo.
(() => {
  const papers='.adc-design-pdf,#adcSC01Sheet,#adcOLSheet,.adc-bd02-document,[data-adc-official-sheet],.dj02-paper,#dj .dj-preview,.adc-official-preview,.adc-sc01-preview,.adc-bd02-preview';
  const frameProperties=['scale','translate'];
  const snapshot=node=>Object.fromEntries(frameProperties.map(key=>[key,node.style[key]]));
  const restore=(node,frame)=>{for(const key of frameProperties)node.style[key]=frame[key];};
  function apply(op,node){
    if(![op.x,op.y,op.scale].every(Number.isFinite)||Math.abs(op.x)>5000||Math.abs(op.y)>5000||op.scale<0.1||op.scale>5)return;
    const before=snapshot(node);node.style.scale=String(op.scale);node.style.translate=op.x+'px '+op.y+'px';
    return ()=>restore(node,before);
  }
  function attach(api){
    let gesture=null,lastDown=null,suppressClick=false,frame=0;
    const layer=document.createElement('div');layer.id='adcDocumentSelection';
    Object.assign(layer.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'9001'});document.body.append(layer);
    const rootFor=target=>{
      if(!(target instanceof Element)||target.closest('#adcDesignPanel,#adcDesignGear,#adcDesignMarks,#adcDocumentSelection,#adcDesignContext,[data-adc-studio-ui]'))return null;
      const imported=target.closest('.adc-design-pdf');if(imported)return imported;
      return target.closest(papers)||target.closest('.adc-document-editor-shield')?.parentElement||target.closest('iframe,object,embed')?.parentElement||null;
    };
    const enabled=()=>!api.panel.hidden&&['','size','doc-size'].includes(api.tool());
    const selected=()=>{const node=api.selected();return node?.isConnected&&(node.matches(papers)||node.querySelector(':scope > iframe,:scope > object,:scope > embed'))?node:null;};
    const stop=event=>{event.preventDefault();event.stopImmediatePropagation();};
    function paint(){
      layer.replaceChildren();const node=selected();if(!enabled()||!node)return;
      const r=node.getBoundingClientRect();if(!r.width||!r.height)return;
      const outline=document.createElement('div');Object.assign(outline.style,{position:'absolute',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',border:'2px dashed #0082d9',boxSizing:'border-box'});layer.append(outline);
      for(const [side,x,y,cursor] of [['nw',r.left,r.top,'nwse-resize'],['n',r.left+r.width/2,r.top,'ns-resize'],['ne',r.right,r.top,'nesw-resize'],['e',r.right,r.top+r.height/2,'ew-resize'],['se',r.right,r.bottom,'nwse-resize'],['s',r.left+r.width/2,r.bottom,'ns-resize'],['sw',r.left,r.bottom,'nesw-resize'],['w',r.left,r.top+r.height/2,'ew-resize']]){
        const grip=document.createElement('div');grip.dataset.documentGrip=side;grip.setAttribute('role','button');grip.setAttribute('aria-label','Ajustar documento '+side);
        Object.assign(grip.style,{position:'absolute',left:(x-7)+'px',top:(y-7)+'px',width:'14px',height:'14px',background:'#fff',border:'2px solid #0082d9',boxSizing:'border-box',pointerEvents:'auto',cursor,touchAction:'none'});layer.append(grip);
      }
    }
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(paint);};
    function begin(event,node,side){
      if(window.adcStudioPolicy?.anchored(node)){api.say('Documento oficial anclado: agreg? notas sin mover sus campos.');return;}
      api.select(node);api.setTool('doc-size');
      const computed=getComputedStyle(node),parts=computed.translate.split(' '),component=(value,size)=>value?.endsWith('%')?parseFloat(value)*size/100:parseFloat(value)||0;
      gesture={node,side,x:event.clientX,y:event.clientY,rect:node.getBoundingClientRect(),before:snapshot(node),scale:parseFloat(computed.scale)||1,tx:component(parts[0],node.offsetWidth),ty:component(parts[1],node.offsetHeight),current:null,pointerId:event.pointerId};
      suppressClick=true;stop(event);schedule();
    }
    window.addEventListener('pointerdown',event=>{
      if(!enabled()||event.button!==0)return;
      const grip=event.target.closest?.('[data-document-grip]'),node=grip?selected():rootFor(event.target);if(!node)return;
      const now=performance.now(),double=event.detail>=2||lastDown?.node===node&&now-lastDown.time<500&&Math.hypot(event.clientX-lastDown.x,event.clientY-lastDown.y)<8;
      lastDown={node,time:now,x:event.clientX,y:event.clientY};
      if(grip){begin(event,node,grip.dataset.documentGrip);return;}
      if(double||api.selected()===node&&!event.target.closest('input,textarea,select,button,a,[contenteditable]')){begin(event,node,'move');return;}
      if(!event.target.closest('input,textarea,select,button,a,[contenteditable]')){
        stop(event);suppressClick=true;api.select(node);api.setTool('doc-size');api.say('Documento seleccionado. Segundo clic sostenido para arrastrar; bordes y esquinas para ampliar sin deformar.');schedule();
      }
    },true);
    window.addEventListener('dblclick',event=>{const node=rootFor(event.target);if(enabled()&&node){stop(event);api.select(node);api.setTool('doc-size');schedule();}},true);
    window.addEventListener('pointermove',event=>{
      const g=gesture;if(!g||event.pointerId!==g.pointerId)return;stop(event);
      let dx=event.clientX-g.x,dy=event.clientY-g.y,ratio=1;
      if(g.side!=='move'){
        const rx=g.side.includes('e')?1+dx/g.rect.width:g.side.includes('w')?1-dx/g.rect.width:1;
        const ry=g.side.includes('s')?1+dy/g.rect.height:g.side.includes('n')?1-dy/g.rect.height:1;
        ratio=g.side.length===2?(Math.abs(rx-1)>Math.abs(ry-1)?rx:ry):g.side==='e'||g.side==='w'?rx:ry;
        ratio=Math.max(0.1/g.scale,Math.min(5/g.scale,ratio));
      }
      const targetLeft=g.side==='move'?g.rect.left+dx:g.side.includes('w')?g.rect.right-g.rect.width*ratio:g.rect.left;
      const targetTop=g.side==='move'?g.rect.top+dy:g.side.includes('n')?g.rect.bottom-g.rect.height*ratio:g.rect.top;
      restore(g.node,g.before);g.node.style.scale=String(g.scale*ratio);
      const actual=g.node.getBoundingClientRect(),parent=g.node.parentElement,parentRect=parent.getBoundingClientRect(),sx=parent.offsetWidth?parentRect.width/parent.offsetWidth:1,sy=parent.offsetHeight?parentRect.height/parent.offsetHeight:1;
      const x=g.tx+(targetLeft-actual.left)/(sx||1),y=g.ty+(targetTop-actual.top)/(sy||1);
      g.node.style.translate=x+'px '+y+'px';g.current={kind:'documentTransform',target:api.keyFor(g.node),x,y,scale:g.scale*ratio};schedule();
    },true);
    const finish=(event,cancel)=>{const g=gesture;if(!g)return;stop(event);gesture=null;restore(g.node,g.before);if(!cancel&&g.current)api.commit(g.current);schedule();};
    window.addEventListener('pointerup',event=>finish(event,false),true);
    window.addEventListener('pointercancel',event=>finish(event,true),true);
    window.addEventListener('keydown',event=>{if(event.key==='Escape'&&gesture){restore(gesture.node,gesture.before);gesture=null;schedule();}},true);
    window.addEventListener('click',event=>{if(suppressClick&&!event.target.closest?.('#adcDesignPanel,#adcDesignGear')){suppressClick=false;stop(event);}},true);
    window.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);
    // Un iframe nativo no propaga los gestos al documento padre. En Ajustes,
    // un escudo transparente permite seleccionar su contenedor sin navegar dentro.
    const shields=new Map();
    const update=()=>{
      for(const iframe of document.querySelectorAll('iframe,object[type="application/pdf"],embed[type="application/pdf"]')){
        if(iframe.closest('#adcDesignPanel,[data-adc-studio-ui]')||!iframe.getClientRects().length)continue;
        const parent=iframe.parentElement;
        if(!api.panel.hidden&&!shields.has(parent)){
          const shield=document.createElement('div');shield.className='adc-document-editor-shield';
          const position=parent.style.position;if(getComputedStyle(parent).position==='static')parent.style.position='relative';
          Object.assign(shield.style,{position:'absolute',inset:'0',zIndex:'20',background:'transparent',cursor:'move'});parent.append(shield);shields.set(parent,{shield,position});
        }
      }
      if(api.panel.hidden)for(const [parent,{shield,position}] of shields){shield.remove();parent.style.position=position;shields.delete(parent);}
      schedule();
    };
    const observer=new MutationObserver(records=>{if(records.every(record=>record.target instanceof Element&&(record.target.closest('#adcDocumentSelection,#adcDesignMarks,#adcDevRulers,[data-adc-studio-ui]')||record.type==='childList'&&record.target.closest('#adcDesignPanel'))))return;observer.disconnect();update();observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','data-adc-design-selected']});});
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','data-adc-design-selected']});update();
  }
  window.adcDocumentEditor={apply,attach};
})();
