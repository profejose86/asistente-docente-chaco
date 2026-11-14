// Herramientas compartidas de imágenes y eliminación visual reversible.
(() => {
  const moduleURL=new URL('../../vendor/pdfjs/pdf.min.mjs',document.currentScript.src),workerURL=new URL('pdf.worker.min.mjs',moduleURL);
  let renderer;
  const pdfs=new Map();
  async function openPdf(src){
    if(pdfs.has(src))return pdfs.get(src);
    const task=(async()=>{
      renderer||=import(moduleURL.href);const pdfjs=await renderer;pdfjs.GlobalWorkerOptions.workerSrc=workerURL.href;
      const bytes=Uint8Array.from(atob(src.split(',')[1]),char=>char.charCodeAt(0));
      const pdf=await pdfjs.getDocument({data:bytes,isEvalSupported:false,stopAtErrors:true,standardFontDataUrl:new URL('standard_fonts/',moduleURL).href,wasmUrl:new URL('wasm/',moduleURL).href}).promise;
      if(pdf.numPages>20){await pdf.destroy();throw Error('El PDF supera las 20 páginas.');}return pdf;
    })();
    pdfs.set(src,task);try{return await task;}catch(error){pdfs.delete(src);throw error;}
  }
  const validSource=value=>typeof value==='string'&&value.length<=700000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
  function apply(op,{node,register}){
    if(op.kind==='documentTransform')return window.adcDocumentEditor?.apply(op,node);
    if(op.kind==='front'){
      if(!Number.isInteger(op.level)||op.level<1||op.level>5000)return;
      const previous=[];
      for(let current=node;current&&current!==document.body;current=current.parentElement){
        const computed=getComputedStyle(current);
        if(current!==node&&computed.position==='static'&&computed.transform==='none'&&computed.translate==='none'&&computed.opacity==='1'&&computed.isolation!=='isolate')continue;
        previous.push([current,current.style.position,current.style.zIndex]);
        if(computed.position==='static')current.style.position='relative';
        current.style.zIndex=String(op.level);
      }
      return ()=>{for(const [element,position,zIndex] of previous){element.style.position=position;element.style.zIndex=zIndex;}};
    }
    if(op.kind==='pdf'){
      if(!/^data:application\/pdf;base64,[A-Za-z0-9+/]+={0,2}$/.test(op.src||'')||op.src.length>7000000||!/^new-[a-z0-9-]+$/i.test(op.id||'')||!node.matches('main,section,article,div'))return;
      const wrapper=document.createElement('div');wrapper.className='adc-design-created adc-design-pdf';
      Object.assign(wrapper.style,{position:'relative',width:'100%',maxWidth:'100%',height:'auto'});
      wrapper.setAttribute('aria-label',op.title||'PDF agregado');wrapper.textContent='Cargando PDF…';register(wrapper,op.id);node.append(wrapper);
      let cancelled=false,observer;
      openPdf(op.src).then(async pdf=>{
        if(cancelled)return;wrapper.replaceChildren();
        const pages=[];
        for(let index=0;index<pdf.numPages;index++){
          const page=await pdf.getPage(index+1);if(cancelled)return;
          const viewport=page.getViewport({scale:1}),outer=document.createElement('div'),paper=document.createElement('div'),canvas=document.createElement('canvas');
          outer.className='adc-design-pdf-viewport';paper.className='adc-design-pdf-page';paper.dataset.pdfWidth=viewport.width;paper.dataset.pdfHeight=viewport.height;
          Object.assign(outer.style,{position:'relative',width:'100%',marginBottom:'12px'});
          Object.assign(paper.style,{position:'relative',width:viewport.width+'px',height:viewport.height+'px',transformOrigin:'0 0',background:'#fff',color:'#111'});
          Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});
          canvas.setAttribute('aria-label','Página '+(index+1));paper.append(canvas);outer.append(paper);wrapper.append(outer);register(paper,op.id+'/'+index);pages.push({outer,paper,width:viewport.width,height:viewport.height});
          const render=page.getViewport({scale:1.5});canvas.width=Math.ceil(render.width);canvas.height=Math.ceil(render.height);
          await page.render({canvasContext:canvas.getContext('2d'),viewport:render}).promise;
        }
        const fit=()=>{for(const {outer,paper,width,height} of pages){const scale=wrapper.clientWidth/width||1;paper.style.transform='scale('+scale+')';paper.dataset.adcPdfScale=scale;outer.style.height=height*scale+'px';}};
        observer=new ResizeObserver(fit);observer.observe(wrapper);fit();
      }).catch(error=>{if(!cancelled)wrapper.textContent='No se pudo mostrar el PDF: '+error.message;});
      return ()=>{cancelled=true;observer?.disconnect();wrapper.remove();};
    }
    if(op.kind==='replaceImage'){
      if(!node.matches('img')||!validSource(op.src))return;
      const before=node.getAttribute('src');node.src=op.src;
      return ()=>before===null?node.removeAttribute('src'):node.setAttribute('src',before);
    }
    if(op.kind!=='image'||!node.matches('main,section,article,aside,div,header,footer')||!validSource(op.src)||!/^new-[a-z0-9-]+$/i.test(op.id||''))return;
    if(![op.left,op.top,op.width,op.height].every(value=>Number.isFinite(value)&&Math.abs(value)<=5000)||op.width<24||op.height<20)return;
    const wrapper=document.createElement('div'),image=document.createElement('img');
    wrapper.className='adc-design-created adc-design-image';image.src=op.src;image.alt=String(op.alt||'Imagen agregada').slice(0,180);image.draggable=false;
    Object.assign(wrapper.style,{position:'absolute',left:op.left+'px',top:op.top+'px',width:op.width+'px',height:op.height+'px',zIndex:'5'});
    Object.assign(image.style,{display:'block',width:'100%',height:'100%',objectFit:'contain',pointerEvents:'none'});
    const position=node.style.position;
    if(getComputedStyle(node).position==='static')node.style.position='relative';
    wrapper.append(image);register(wrapper,op.id);register(image,op.id+'/0');node.append(wrapper);
    return ()=>{wrapper.remove();node.style.position=position;};
  }
  function attach(api){
    const {panel,say}=api;
    const designButton=target=>target instanceof Element?target.closest('button,[role="button"],input[type="button"],input[type="submit"]'):null;
    const freeEdit=()=>!panel.hidden&&['','size'].includes(api.tool());
    window.addEventListener('click',event=>{
      if(freeEdit()&&designButton(event.target)&&!event.target.closest('#adcDesignPanel,#adcDesignGear,#adcDesignContext')){
        event.preventDefault();event.stopImmediatePropagation();
        say('Doble clic para seleccionar y ajustar el botón. Para usarlo normalmente, cerrá Ajustes.');
      }
    },true);
    window.addEventListener('dblclick',event=>{
      const node=designButton(event.target);
      if(!freeEdit()||!node||node.closest('#adcDesignPanel,#adcDesignGear,#adcDesignContext'))return;
      event.preventDefault();event.stopImmediatePropagation();
      api.select(node);api.setTool('size');say('Botón seleccionado. Arrastrá para moverlo o usá sus bordes para ajustar el tamaño. Se permiten solapamientos.');
    },true);
    const tools=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Agregar y borrar elementos';tools.append(legend);panel.append(tools);
    const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.hidden=true;input.dataset.imageImport='';tools.append(input);
    const pdfInput=document.createElement('input');pdfInput.type='file';pdfInput.accept='application/pdf,.pdf';pdfInput.hidden=true;pdfInput.dataset.pdfImport='';tools.append(pdfInput);
    let mode='',source='',drag=null,replacing=null,suppressNextClick=false;
    const preview=document.createElement('div');Object.assign(preview.style,{position:'fixed',border:'2px dashed #2453a3',background:'#2453a322',pointerEvents:'none',zIndex:'2147483646'});preview.hidden=true;document.body.append(preview);
    const cancel=()=>{mode='';source='';drag=null;replacing=null;preview.hidden=true;api.setTool('');};
    function button(label,action,key){
      const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.elementAction=key;
      button.onclick=event=>{event.stopPropagation();action();};tools.append(button);return button;
    }
    button('Agregar imagen',()=>{cancel();input.click();},'add-image');
    button('Agregar PDF',()=>{cancel();pdfInput.click();},'add-pdf');
    button('Ajustar PDF al ancho',()=>{
      const selected=api.selected(),pdf=selected?.closest('.adc-design-pdf');
      if(!pdf){say('Seleccioná primero el PDF agregado.');return;}
      api.commit({kind:'style',target:api.keyFor(pdf),width:pdf.parentElement.clientWidth});
    },'fit-pdf');
    pdfInput.onchange=async()=>{
      const file=pdfInput.files[0];pdfInput.value='';if(!file)return;
      try{
        if(file.size>5000000)throw Error('Elegí un PDF de hasta 5 MB.');
        say('Comprobando las páginas del PDF…');
        const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(new Blob([file],{type:'application/pdf'}));});
        await openPdf(src);
        const selected=api.selected();
        const host=[selected?.closest('section,article,main'),...document.querySelectorAll('#adcOfficialForm,#adcLoginCanvas,#profile,#tramites,main,.wrap')].find(node=>node?.getClientRects().length&&getComputedStyle(node).visibility!=='hidden');
        if(!host)throw Error('Seleccioná una sección donde colocar el PDF.');
        const id='new-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
        if(api.commit({kind:'pdf',target:api.keyFor(host),id,src,title:file.name})){api.select(api.resolve(id));api.setTool('size');say('PDF agregado como fondo editable. Sus cajas y botones se guardan en la copia JSON; su integración al PDF final se revisa aparte.');}
      }catch(error){say(error.message||'No se pudo abrir el PDF.');}
    };
    button('Reemplazar imagen',()=>{cancel();mode='replace';api.setTool('element-image');say('Hacé clic en la imagen que querés reemplazar. Esc cancela.');},'replace-image');
    button('Borrar elementos',()=>{cancel();mode='delete';api.setTool('element-delete');say('Hacé clic en el elemento que querés ocultar. Podés recuperarlo con Deshacer. Esc cancela.');},'delete');
    button('Mover / cambiar tamaño con el mouse',()=>{cancel();api.setTool('size');say('Seleccioná el elemento. Arrastrá para moverlo o usá los bordes para cambiar su tamaño.');},'resize');
    button('Agregar caja',()=>{cancel();api.setTool('box');},'add-box');
    button('Agregar sección',()=>{cancel();api.setTool('section');},'add-section');
    button('Agregar botón',()=>{cancel();api.setTool('button');},'add-button');
    button('Agregar desplegable',()=>{cancel();api.setTool('dropdown');},'add-dropdown');
    button('Cancelar herramienta',cancel,'cancel');
    input.onchange=async()=>{
      const file=input.files[0];input.value='';if(!file)return;
      try{
        if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>500000)throw Error('Elegí una imagen PNG, JPG o WebP de hasta 500 KB.');
        const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
        if(!validSource(data))throw Error('Formato de imagen no admitido.');
        const image=new Image();image.src=data;await image.decode();
        if(replacing){api.commit({kind:'replaceImage',target:api.keyFor(replacing),src:data});cancel();return;}
        source=data;mode='image';api.setTool('element-image');say('Dibujá con el mouse el espacio de la imagen sobre la página. Esc cancela.');
      }catch(error){cancel();say(error.message||'No se pudo leer la imagen.');}
    };
    const usable=target=>target instanceof Element&&!target.closest('#adcDesignPanel,#adcDesignGear,#adcDesignMarks,#adcDesignContext,[data-adc-studio-ui]');
    document.addEventListener('pointerdown',event=>{
      if(!mode||panel.hidden||event.button!==0||!usable(event.target))return;
      suppressNextClick=true;
      event.preventDefault();event.stopImmediatePropagation();
      if(mode==='delete'){
        const node=event.target.closest('.adc-design-created')||event.target.closest('img,h1,h2,h3,h4,p,span,label,button,a,section,article,div');
        if(!node||node.matches('main,body,html')||node.closest('svg'))return;
        if(confirm('¿Ocultar este elemento de la página? Podés recuperarlo con Deshacer. Esto no elimina datos guardados ni cambia el PDF oficial.'))api.commit({kind:'hideOriginal',target:api.keyFor(node)});
        cancel();return;
      }
      if(mode==='replace'){
        replacing=event.target.closest('img')||event.target.closest('.adc-design-image')?.querySelector('img');
        if(replacing)input.click();else say('Seleccioná una imagen.');return;
      }
      const host=event.target.closest('div,section,article,main,header,footer');
      if(!host)return;
      drag={host,x:event.clientX,y:event.clientY};preview.hidden=false;
      Object.assign(preview.style,{left:drag.x+'px',top:drag.y+'px',width:'0px',height:'0px'});
    },true);
    document.addEventListener('pointermove',event=>{
      if(!drag)return;event.preventDefault();event.stopImmediatePropagation();
      Object.assign(preview.style,{left:Math.min(drag.x,event.clientX)+'px',top:Math.min(drag.y,event.clientY)+'px',width:Math.abs(event.clientX-drag.x)+'px',height:Math.abs(event.clientY-drag.y)+'px'});
    },true);
    document.addEventListener('pointerup',event=>{
      if(!drag)return;event.preventDefault();event.stopImmediatePropagation();
      const {host,x,y}=drag,rect=host.getBoundingClientRect(),sx=rect.width?host.offsetWidth/rect.width:1,sy=rect.height?host.offsetHeight/rect.height:1;
      const id='new-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
      const op={kind:'image',target:api.keyFor(host),id,src:source,alt:'Imagen agregada',left:(Math.min(x,event.clientX)-rect.left)*sx-host.clientLeft+host.scrollLeft,top:(Math.min(y,event.clientY)-rect.top)*sy-host.clientTop+host.scrollTop,width:Math.abs(event.clientX-x)*sx,height:Math.abs(event.clientY-y)*sy};
      cancel();
      if(op.width<24||op.height<20){say('Dibujá un espacio más grande para la imagen.');return;}
      if(api.commit(op)){api.select(api.resolve(id));api.setTool('size');say('Imagen agregada. Podés moverla y ajustar sus bordes con el mouse.');}
    },true);
    // Captura en window antes del editor histórico: el clic final del trazado
    // no debe cambiar la selección ni activar un botón situado debajo.
    window.addEventListener('click',event=>{if((mode||suppressNextClick)&&usable(event.target)){suppressNextClick=false;event.preventDefault();event.stopImmediatePropagation();}},true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')cancel();});
    const copy=document.createElement('button');copy.type='button';copy.textContent='Guardar copia de modificaciones (JSON)';copy.dataset.layoutCopy='';panel.append(copy);
    copy.onclick=event=>{event.stopPropagation();panel.querySelector('[data-act="save"]').click();panel.querySelector('[data-project-export]').click();};
  }
  function normalize(op,resolve){
    const node=resolve(op.target),page=node?.closest('.adc-design-pdf-page');
    if(node?.matches('.adc-design-pdf')&&op.kind==='style'){op={...op};delete op.height;}
    if(op.kind==='image')return op; // El trazado de imágenes ya convierte la escala del contenedor.
    if(!page)return op;
    const scale=Number(page.dataset.adcPdfScale)||1;
    const result={...op};
    for(const key of ['left','top','width','height','x','y','x1','y1','x2','y2'])if(typeof result[key]==='number')result[key]/=scale;
    return result;
  }
  function defer(op,resolve,apply){
    if(!/^new-[a-z0-9-]+(?:\/\d+)*$/i.test(op.target)||resolve(op.target))return;
    let reverse;
    const observer=new MutationObserver(()=>{if(resolve(op.target)){reverse=apply(op);observer.disconnect();}});
    observer.observe(document.body,{childList:true,subtree:true});
    return ()=>{observer.disconnect();reverse?.();};
  }
  window.adcVisualElements={apply,attach,validSource,normalize,defer};
})();
