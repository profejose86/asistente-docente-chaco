// Reglas del Studio, independientes de la pantalla y del transporte de guardado.
(() => {
 const roots='#dj,#dj02,#license';
 const isOriginalField=node=>node.matches('input,select,textarea')&&!node.closest('.adc-design-created');
 function anchored(node){
  if(!(node instanceof Element))return false;
  if(node.closest(roots)&&isOriginalField(node))return true;
  return [...node.querySelectorAll('input,select,textarea')].some(field=>field.closest(roots)&&isOriginalField(field));
 }
 const structural=new Set(['style','front','documentTransform','hideOriginal','removeAdded','restoreStyle','reorder','group','split','fold','unfold','always','restoreFold','detailsOpen','duplicate']);
 const locked=node=>node instanceof Element&&!!(node.closest('[data-adc-studio-locked]')||node.querySelector('[data-adc-studio-locked]'));
 const canDuplicate=node=>node instanceof Element&&!anchored(node)&&!node.matches('input,select,textarea,form,main,body,html')&&!node.querySelector('input,select,textarea,form');
 function allows(op,resolve){
  const node=resolve(op.target);if(!node)return true;
  if(['replacePdfBackground','backgroundOffset'].includes(op.kind))return !node.closest('[data-adc-studio-locked]')&&!anchored(node);
  if(op.kind!=='studioLock'&&locked(node))return false;
  if(op.destination&&locked(resolve(op.destination)))return false;
  if(op.kind==='studioLayer')return !anchored(node)&&!node.matches('html,body,main');
  if(['text','relativeBox'].includes(op.kind)&&anchored(node))return false;
  if(!structural.has(op.kind))return true;
  if(op.kind==='style'&&!['x','y','width','height','center'].some(key=>Object.hasOwn(op,key)))return true;
  return !anchored(node)&&(!op.destination||!anchored(resolve(op.destination)));
 }
 const isUi=node=>node instanceof Element&&!!node.closest('#adcDesignPanel,#adcDesignGear,#adcDesignMarks,#adcDocumentSelection,#adcDesignContext,[data-adc-studio-ui]');
 const uid=()=> 'new-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
 window.adcStudioPolicy=Object.freeze({anchored,locked,allows,isUi,uid,canDuplicate,pxPerCm:96/2.54});
})();
