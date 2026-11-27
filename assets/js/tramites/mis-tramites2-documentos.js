// Registro y adaptadores de MT2. Los motores conservan plantillas, validación y borradores.
(() => {
  const teacher='Formularios docentes',admin='Formularios para administrativos';
  const specialized=[
    {id:'dj01',code:'DJ-01',title:'Cargos y horarios',group:teacher,view:'dj',size:'#djPreview',open:()=>tab('dj')},
    {id:'dj02',code:'DJ-02',title:'Licencias anteriores',group:teacher,view:'dj02',size:'#dj02Preview',open:()=>{document.getElementById('adcDJ02FromSelector').hidden=true;return tab('dj02')}},
    {id:'ol01',code:'OL-01',title:'Solicitud de licencia',group:teacher,view:'ol01',size:'.adc-ol-paper',viewport:'.adc-ol-scroll',open:()=>adcOLStart(false)},
    {id:'sc01',code:'SC-01',title:'Certificación de servicios docentes',group:teacher,view:'sc01',size:'#adcSC01Sheet',viewport:'.adc-sc01-scroll',open:()=>adcSC01Open()},
    {id:'dl01',code:'DL-01',title:'Licencias y permisos',group:admin,view:'license',size:'#pdfResult',open:reason=>Boolean(reason&&adcDL01Ready.has(reason)&&adcDL01Open(reason))}
  ];
  const adminIds=new Set(['dp01','bd02','md01','dl02','il01','tp01','df01','si01','ba01','bd01']);
  const adapters=new Map();let owned=null,back=null;
  function records(){
    const extra=window.adcFormSearchMetadata||{};
    const custom=specialized.map(item=>({...item,officialName:extra[item.id]?.officialName||item.title,keywords:extra[item.id]?.keywords||[],status:'available'}));
    const generic=(window.adcOfficialFormsData||[]).map(item=>({id:item.id,code:item.code||'',displayCode:item.catalogCode||item.code||'',title:item.catalogTitle||item.title,officialName:item.title,keywords:[...(item.keywords||[]),...(extra[item.id]?.keywords||[])],group:adminIds.has(item.id)?admin:teacher,status:item.catalogState==='pending'?'pending':item.status||'available'}));
    return [...custom.filter(item=>item.id!=='dl01'),...generic.filter(item=>item.group===teacher),custom.find(item=>item.id==='dl01'),...generic.filter(item=>item.group===admin)];
  }
  function attach(definition){
    if(adapters.has(definition.id))return adapters.get(definition.id);
    const size=document.querySelector(definition.size);if(!size)return null;
    let viewport=definition.viewport&&document.querySelector(definition.viewport);
    if(!viewport){viewport=document.createElement('div');size.before(viewport);viewport.append(size);}
    const host=size.closest('#dj,#dj02,#adcOL,#adcSC01,#license,#adcMT2DL01Workspace');
    const oldZoom=size.style.zoom,oldWidth=size.style.width,isDJ02=definition.id==='dj02';
    const dj02Trial=isDJ02&&new URL(location.href).searchParams.get('adc-dj02-vpi')==='1';
    const minScale=dj02Trial ? .25 : isDJ02 ? .05 : .25;let scale=1,naturalWidth=1,fitMode='width';
    function update(value){scale=value;size.style.zoom=String(scale);api.sync();}
    function measure(){
      const pages=isDJ02?[...size.querySelectorAll('.adc58-page-shell')]:[];
      naturalWidth=pages.length?Math.max(...pages.map(page=>page.offsetWidth)):Math.max(size.offsetWidth,size.scrollWidth,1);
      size.style.width=naturalWidth+'px';
    }
    function fit(mode){
      fitMode=mode;if(isDJ02)measure();
      const width=naturalWidth;
      const height=Math.max(size.scrollHeight,size.getBoundingClientRect().height/scale,1);
      update(Math.max(minScale,Math.min(2,(viewport.clientWidth-24)/width,mode==='page'?(viewport.clientHeight-24)/height:2)));
    }
    const api=adcPdfViewer.create({viewport,size,minScale,getScale:()=>scale,setScale(value){fitMode=null;update(value)},fit,doubleActivateFullscreen:()=>true,toggleFullscreenOnDoubleActivate:()=>true,floatingFullscreen:()=>true});
    const frame=viewport.parentElement;frame.dataset.mt2Viewer=definition.id;
    if(dj02Trial){
      frame.dataset.adcDj02VpiTrial='';
      // Protección local adicional; no reemplaza ni duplica los gestos del VPI.
      const protect=event=>{
        if(frame.classList.contains('adc-mt2-viewer-active')&&(String(getSelection()).trim()||event.target.closest('.dj02-matches,.adc58-row-actions')))event.stopImmediatePropagation();
      };
      for(const event of ['wheel','dblclick','touchstart'])viewport.addEventListener(event,protect,{capture:true,passive:true});
    }
    host.classList.add('adc-mt2-viewer-host');
    if(isDJ02){
      let pending;const refit=()=>{cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>{if(frame.classList.contains('adc-mt2-viewer-active')&&fitMode)fit(fitMode)});};
      new ResizeObserver(refit).observe(viewport);
      new MutationObserver(refit).observe(size,{childList:true});
    }
    const adapter={enable(){frame.classList.add('adc-mt2-viewer-active');viewport.classList.add('adc-mt2-viewport');size.style.zoom='1';naturalWidth=Math.max(size.offsetWidth,size.scrollWidth,1);size.style.width=naturalWidth+'px';api.setEnabled(true);requestAnimationFrame(()=>fit('width'));},disable(){api.setEnabled(false);frame.classList.remove('adc-mt2-viewer-active');viewport.classList.remove('adc-mt2-viewport');size.style.zoom=oldZoom;size.style.width=oldWidth;adc43Fit();}};
    adapters.set(definition.id,adapter);return adapter;
  }
  function release(){
    document.body.removeAttribute('data-adc-mt2-dl01-ready');document.querySelectorAll('[data-mt2-dl01-aux]').forEach(node=>node.removeAttribute('data-mt2-dl01-aux'));
    if(owned?.adapter)owned.adapter.disable();
    if(owned?.mounted){const {actions,actionsAnchor,pages,workspace,printFrame,url}=owned.mounted;pages.replaceChildren();if(actionsAnchor)actionsAnchor.replaceWith(actions);else actions.remove();printFrame?.remove();if(url)URL.revokeObjectURL(url);workspace.hidden=true;if(back)document.querySelector('body > .wrap').prepend(back);}
    if(owned?.view==='official')adcOfficialForms.releaseViewer();owned=null;if(back)back.hidden=true;document.body.removeAttribute('data-adc-mt2-document');document.body.removeAttribute('data-adc-mt2-reason');
  }
  function open(id,{reason=null,trigger=null}={}){
    const record=records().find(item=>item.id===id);if(!record||record.status==='pending')return false;
    const definition=specialized.find(item=>item.id===id);
    // DL-01 siempre requiere motivo; no reutilizar silenciosamente una solicitud anterior.
    if(id==='dl01'&&(!reason||!adcDL01Ready.has(reason)))return false;
    if(owned&&window.tab('tramites2')===false)return false;
    const previous=owned;
    const result=id==='incapacidad'&&window.adcMotor01Pilot?adcMotor01Pilot.abrir().estado==='abierto':definition?definition.open(reason)!==false:id==='bd02'?adcBD02Open()!==false:adcOfficialForms.open(id,{trigger,smartViewer:true});
    if(!result)return false;
    if(id==='dj02')document.getElementById('adcDJ02FromSelector').hidden=!reason;
    if(previous?.adapter)previous.adapter.disable();
    const adapter=definition?attach(definition):null;adapter?.enable();
    owned={id,view:definition?.view||(id==='bd02'?'bd02':'official'),adapter};
    document.body.dataset.adcMt2Document=id;
    for(const button of document.querySelectorAll('button'))if(/^← Volver a Mis trámites/.test(button.textContent.trim())&&button!==back)button.dataset.mt2LegacyBack='';
    if(reason)document.body.dataset.adcMt2Reason=reason;else document.body.removeAttribute('data-adc-mt2-reason');
    if(back){back.hidden=false;document.querySelector('body > .wrap').prepend(back);}
    return true;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    if(!document.getElementById('adcTramites2'))return;
    back=document.createElement('button');back.type='button';back.className='adc-mt2-document-back';back.textContent='← Volver a Mis trámites 2';back.hidden=true;back.onclick=()=>{if(owned?.mounted)release();tab('tramites2')};
    document.querySelector('body > .wrap').prepend(back);
    const onViewChange=next=>{if(owned&&next!==owned.view)release()};
    if(window.adcNavigation?.onNavigate)window.adcNavigation.onNavigate(onViewChange);
    else{
      const previous=window.tab;
      window.tab=function(next){
        const result=previous.apply(this,arguments);if(result===false)return false;
        onViewChange(next);return result;
      };
    }
    // Las salidas de los motores se dirigen al catálogo propietario de esta apertura.
    document.addEventListener('click',event=>{
      if(!owned)return;
      const button=event.target.closest('button');
      if(button&&button!==back&&(/^← Volver a Mis trámites/.test(button.textContent.trim())||button.id==='adcTramiteBack')){
        event.preventDefault();event.stopImmediatePropagation();tab('tramites2');
      }
    },true);
  },{once:true});
  function showDL01(){
    const frame=document.querySelector('[data-mt2-viewer=dl01]'),preview=document.querySelector('#pdfResult iframe[data-adc-preview-state=ready]');
    if(owned?.id!=='dl01'||!frame||!preview||!adcPDFRequest?.url||adcPDFRequest.key!==adcPDFRequestKey())return false;
    if(owned.mounted)return true;
    const sourcePages=[...preview.contentDocument.querySelectorAll('canvas')],root=document.getElementById('adcTramites2'),actions=document.querySelector('#pdfResult > .status');
    if(!root||!sourcePages.length||!actions)return false;
    let workspace=document.getElementById('adcMT2DL01Workspace');
    if(!workspace){
      workspace=document.createElement('section');workspace.id='adcMT2DL01Workspace';workspace.className='adc-mt2-viewer-host';workspace.setAttribute('aria-labelledby','adcMT2DL01Title');
      workspace.innerHTML='<h2 id="adcMT2DL01Title" tabindex="-1">DL-01 · Enfermedad o lesión común</h2><p data-mt2-dl01-context></p><div id="adcMT2DL01Pages" class="mt2-dl01-pages"></div>';root.append(workspace);
    }
    const title=workspace.querySelector('h2'),pages=workspace.querySelector('.mt2-dl01-pages');pages.replaceChildren();workspace.hidden=false;
    workspace.querySelector('[data-mt2-dl01-context]').textContent=[document.getElementById('escuelaSelect').selectedOptions[0]?.textContent,...['desde','hasta'].map(id=>`${id==='desde'?'Desde':'Hasta'} ${document.getElementById(id).value.split('-').reverse().join('/')}`)].filter(Boolean).join(' · ');
    for(const [index,source] of sourcePages.entries()){
      const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
      canvas.style.width=source.style.width;canvas.style.height=source.style.height;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`DL-01 completado · página ${index+1} de ${sourcePages.length}`);
      canvas.getContext('2d').drawImage(source,0,0);pages.append(canvas);
    }
    const actionsAnchor=document.createComment('Acciones originales DL-01');actions.before(actionsAnchor);
    owned.adapter.disable();(workspace.querySelector('.adc-pdf-viewer')||pages).before(actions);
    owned.view='tramites2';owned.mounted={actions,actionsAnchor,pages,workspace};
    window.tab('tramites2');document.body.dataset.adcMt2Dl01Ready='true';
    owned.adapter=attach({id:'dl01-mt2',size:'#adcMT2DL01Pages'});owned.adapter.enable();
    if(back)workspace.prepend(back);
    workspace.style.scrollMarginTop=((document.querySelector('.adc-start-header')?.offsetHeight||0)+16)+'px';
    title.focus({preventScroll:true});workspace.scrollIntoView({block:'start'});return true;
  }
  async function openIllness({institutionId,from,until,onStart=()=>{}}){
    const institution=inst.find(item=>String(item.id)===String(institutionId)),reason='Enfermedad o lesión común';
    if(!institution?.name?.trim())throw Error('Elegí una institución del perfil docente.');
    const profileField=id=>document.getElementById(id)?.value||'';
    const fields={nombre:profileField('nombre'),dni:profileField('dni'),sexo:profileField('sexo'),desde:from,hasta:until,pago:'con',presentacion:'',disposicion:'',justifica:''};
    if(!fields.nombre.trim()||!adcPersonalValid(fields.dni,7,8))throw Error('Completá el nombre y un DNI válido en Mi perfil docente.');
    if(!date(from)||!date(until)||until<from)throw Error('Completá un período válido en Desde y Hasta.');
    const rows=adcDL01Affected(institution,from,until);
    if(!rows.length)throw Error('No hay cargos u horas del perfil con actividad en ese período. Revisá las fechas y los horarios de la institución.');
    if(rows.some(({e})=>!mapping(e,reason,'con')[0]||!turnoNormalizado(e.turno)||turnoNormalizado(e.turno)==='Otro'||!dl01CodigoCargo(e,institution,reason)))throw Error('Completá turno, situación de revista y código de cargo/nivel en los cargos de esta institución del perfil docente.');
    const snapshot=structuredClone({fields,institution,rows,reason});
    if(window.tab('tramites2')===false)throw Error('No se pudo confirmar el guardado del documento anterior.');
    if(owned)release();
    onStart();
    const root=document.getElementById('adcTramites2');let workspace=document.getElementById('adcMT2DL01Workspace');
    if(!workspace){workspace=document.createElement('section');workspace.id='adcMT2DL01Workspace';workspace.className='adc-mt2-viewer-host';workspace.setAttribute('aria-labelledby','adcMT2DL01Title');workspace.innerHTML='<h2 id="adcMT2DL01Title" tabindex="-1">DL-01 · Enfermedad o lesión común</h2><p data-mt2-dl01-context></p><div id="adcMT2DL01Pages" class="mt2-dl01-pages"></div>';root.append(workspace);}
    const pages=workspace.querySelector('.mt2-dl01-pages');pages.replaceChildren();workspace.hidden=false;
    workspace.querySelector('[data-mt2-dl01-context]').textContent=`${snapshot.institution.name} · Desde ${fmt(from)} · Hasta ${fmt(until)}`;
    const actions=document.createElement('div');actions.className='status';
    const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Preparando DL-01 con los datos del perfil docente…';
    const download=document.createElement('a');download.textContent='Descargar DL-01 completado';download.download='DL-01-enfermedad-comun.pdf';download.hidden=true;
    const print=document.createElement('button');print.type='button';print.textContent='Imprimir DL-01';print.disabled=true;print.dataset.mt2Dl01Print='';actions.append(download,print,status);
    (workspace.querySelector('.adc-pdf-viewer')||pages).before(actions);
    const printFrame=document.createElement('iframe');printFrame.hidden=true;printFrame.title='Copia de impresión DL-01';printFrame.dataset.mt2Dl01PrintFrame='';workspace.append(printFrame);
    const mounted={actions,pages,workspace,printFrame,url:null},scope=window.adcUserStorage?.scope?.();
    owned={id:'dl01',view:'tramites2',adapter:null,mounted};
    const current=()=>owned?.mounted===mounted&&scope===window.adcUserStorage?.scope?.();
    document.body.dataset.adcMt2Document='dl01';document.body.dataset.adcMt2Reason=reason;document.body.dataset.adcMt2Dl01Ready='loading';
    if(back){back.hidden=false;workspace.prepend(back)}workspace.style.scrollMarginTop=((document.querySelector('.adc-start-header')?.offsetHeight||0)+16)+'px';workspace.scrollIntoView({block:'start'});
    try{
      const result=await adcDL01BuildPdf(snapshot);if(!current())return false;
      for(const message of result.warnings){const warning=document.createElement('p');warning.className='warning';warning.textContent=message;actions.append(warning)}
      mounted.url=URL.createObjectURL(new Blob([result.pdf],{type:'application/pdf'}));download.href=mounted.url;download.hidden=false;
      const ready=await adcDL01ShowPreview(printFrame,result.pdf,mounted,print,status,{isCurrent:current});if(!current())return false;if(!ready)throw Error(status.textContent);
      for(const [index,source] of [...printFrame.contentDocument.querySelectorAll('canvas')].entries()){
        const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;canvas.style.width=source.style.width;canvas.style.height=source.style.height;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`DL-01 completado · página ${index+1} de ${result.pagesGenerated}`);canvas.getContext('2d').drawImage(source,0,0);pages.append(canvas);
      }
      try{adcDL01StorePending(adcPersonalDigits(snapshot.fields.dni),snapshot.rows.map(({e})=>{const [,ref]=mapping(e,reason,'con'),[articulo,inciso='']=ref.split('-');return {articulo,inciso,motivo:dj02Motivo(reason),desde:from,hasta:until,unidad:snapshot.institution.name,disposicion:''}}))}catch{status.textContent+=' El PDF está listo, pero no se pudo guardar su antecedente pendiente.'}
      owned.adapter=attach({id:'dl01-mt2',size:'#adcMT2DL01Pages'});owned.adapter.enable();document.body.dataset.adcMt2Dl01Ready='true';workspace.querySelector('h2').focus({preventScroll:true});return true;
    }catch(error){if(current())status.textContent=error.message;throw error;}
  }
  window.adcMT2Documents=Object.freeze({records,open,showDL01,openIllness});
})();
