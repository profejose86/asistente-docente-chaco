// Contrato compartido por el navegador y la herramienta de incorporación local.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.adcProjectLayoutData=api;
})(typeof window==='object'?window:globalThis,()=>{
  const schema='adc-project-layout-v1';
  const studioAllowed={theme:['primary','accent','stamp'],studioGuide:['id','axis','left','top','length'],preset:['id','variant','title','body','width'],duplicate:['id']};
  const allowed={
    ...studioAllowed,
    annotation:['id','shape','title','left','top','width','height','color','strokeWidth','reverse','x1','y1','x2','y2','stroke','flip'],
    image:['id','src','alt','left','top','width','height'],replaceImage:['src'],pdf:['id','src','title'],
    lineEndpoints:['x1','y1','x2','y2'],hideOriginal:[],front:['level'],documentTransform:['x','y','scale'],style:['x','y','width','height','center','background','color','strokeWidth'],text:['html'],
    reorder:['direction'],group:['destination'],split:['id','title','fold','open'],
    section:['id','title','fold','open','width','height','left','top'],box:['id','title','width','height','left','top','overlay'],
    button:['id','title','action','left','top','tone','width','height','overlay'],bubble:['id','title','tone','popup','left','top'],dropdown:['id','title','direction'],
    fold:['open'],detailsOpen:['open'],restoreStyle:[],restoreFold:[],always:[],unfold:[],removeAdded:[],hideOLEdges:[],removeBackground:[]
  };
  const scopes={pagina:'adc-design-v50',ingreso:'adc-login-design-v1'};
  function empty(){return {schema,pages:{pagina:{editorSchema:scopes.pagina,operations:[],targets:{}},ingreso:{editorSchema:scopes.ingreso,operations:[],targets:{}}}};}
  function reference(value){return typeof value==='string'&&value.length<=2000&&(value.startsWith('project:')&&value.length>8||/^new-[a-z0-9-]+(?:\/\d+)*$/i.test(value));}
  function validate(document){
    if(!document||document.schema!==schema||!document.pages||typeof document.pages!=='object'||Array.isArray(document.pages))throw Error('No es una exportación de ajustes del proyecto ADC.');
    if(Object.keys(document).some(key=>!['schema','pages'].includes(key)))throw Error('Metadatos no admitidos.');
    for(const [scope,page] of Object.entries(document.pages)){
      if(!Object.hasOwn(scopes,scope)||page.editorSchema!==scopes[scope])throw Error('Pantalla o versión de editor incompatible.');
      if(!Array.isArray(page.operations)||page.operations.length>2000||!page.targets||typeof page.targets!=='object'||Array.isArray(page.targets))throw Error('Lista de ajustes inválida.');
      if(Object.keys(page).some(key=>!['editorSchema','operations','targets'].includes(key)))throw Error('Datos de pantalla no admitidos.');
      for(const [ref,target] of Object.entries(page.targets)){
        if(!reference(ref)||!ref.startsWith('project:')||!target||typeof target!=='object'||Array.isArray(target)||!/^[a-z][a-z0-9-]*$/.test(target.tag||''))throw Error('Referencia de elemento inválida.');
        if(Object.entries(target).some(([key,value])=>!['tag','id','name','type'].includes(key)||typeof value!=='string'||value.length>500))throw Error('Identidad del elemento inválida.');
      }
      for(const op of page.operations){
        if(!op||!Object.hasOwn(allowed,op.kind)||!reference(op.target))throw Error('Acción o destino no admitido. Exportá con el botón del proyecto.');
        for(const [key,value] of Object.entries(op)){
          if(!['kind','target',...allowed[op.kind]].includes(key)||!['string','number','boolean'].includes(typeof value))throw Error('Propiedad no admitida en un ajuste.');
          if(typeof value==='number'&&(!Number.isFinite(value)||Math.abs(value)>5000))throw Error('Medida fuera de rango.');
          if(typeof value==='string'&&value.length>(key==='src'?7000000:30000))throw Error('Texto demasiado extenso.');
        }
        for(const ref of [op.target,...(op.destination?[op.destination]:[])]){
          if(!reference(ref)||ref.startsWith('project:')&&!Object.hasOwn(page.targets,ref))throw Error('Falta la identidad de un elemento referenciado.');
        }
        if(['image','replaceImage'].includes(op.kind)&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(op.src||''))throw Error('Imagen no admitida.');
        if(['image','replaceImage'].includes(op.kind)&&op.src.length>700000)throw Error('Imagen demasiado grande.');
        if(op.kind==='pdf'&&!/^data:application\/pdf;base64,[A-Za-z0-9+/]+={0,2}$/.test(op.src||''))throw Error('PDF no admitido.');
        if(op.kind==='documentTransform'&&(![op.x,op.y,op.scale].every(Number.isFinite)||op.scale<0.1||op.scale>5))throw Error('Escala de documento no admitida.');
        if(op.id&&!/^new-[a-z0-9-]+$/i.test(op.id))throw Error('Identificador de elemento creado inválido.');
        if(op.kind==='theme'&&(!/^\d{12,16}$/.test(op.stamp||'')||![op.primary,op.accent].some(Boolean)||[op.primary,op.accent].some(value=>value!==undefined&&!/^#[0-9a-f]{6}$/i.test(value))))throw Error('Tema no admitido.');
        if(op.kind==='studioGuide'&&(!op.id||!['x','y'].includes(op.axis)||![op.left,op.top,op.length].every(Number.isFinite)||op.length<24))throw Error('Guía no admitida.');
        if(op.kind==='preset'&&(!op.id||!['alert','heading','normativa'].includes(op.variant)))throw Error('Plantilla no admitida.');
        if(op.kind==='duplicate'&&!op.id)throw Error('Falta identificador de la copia.');
      }
    }
    return document;
  }
  return Object.freeze({schema,scopes,empty,validate,studioAllowed:Object.freeze(studioAllowed)});
});
