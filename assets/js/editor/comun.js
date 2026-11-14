// Utilidades comunes del editor. Cada pantalla mantiene su propio estado.
(() => {
 const palette={azul:'#2453a3',claro:'#e8eef8',aviso:'#fff5dc',confirmacion:'#e9f7ef',blanco:'#ffffff',noche:'#19283d',tinta:'#152844'};
 function createRegistry({panel,gear,selector}){
  const elements=new Map(),keys=new WeakMap(),originals=new WeakMap(),originalDetailsOpen=new WeakMap();
 function register(element, key) {
   keys.set(element, key);
   if(element.isConnected)window.adcProjectLayout?.describe(element);
   if(element.matches('details')&&!originalDetailsOpen.has(element))originalDetailsOpen.set(element,element.open);
   if(!originals.has(element))originals.set(element,element.getAttribute("style"));
   elements.set(key, element);
 }
 document.querySelectorAll(selector).forEach((element, index) => {
   if (element !== gear && !panel.contains(element) && element !== panel) register(element, 'base-' + index);
 });
 function keyFor(element) {
   if (!element) return null;
   if (!keys.has(element)) {
     const parent = element.parentElement?.closest(selector);
     if (!parent || !document.body.contains(parent)) return null;
     register(element, keyFor(parent) + '/' + [...element.parentElement.children].indexOf(element));
   }
   return keys.get(element);
 }
 function resolve(key) {
   if(typeof key==='string'&&key.startsWith('project:'))return window.adcProjectLayout?.resolve(key);
   if (elements.get(key)?.isConnected) return elements.get(key);
   if (typeof key !== 'string' || !key.includes('/')) return null;
   const parent = resolve(key.slice(0,key.lastIndexOf('/')));
   const child = parent?.children[Number(key.slice(key.lastIndexOf('/')+1))];
   if (child) register(child,key);
   return child;
 }

  return {keys,originals,originalDetailsOpen,register,keyFor,resolve};
 }
 function createHelpers(panel){
 const canEditText = node => node?.matches('h1,h2,h3,h4,h5,h6,p,span,small,strong,label,button,a,summary,td,th,li') &&
   !node.querySelector('input,select,textarea,button,table,form,svg') && !node.closest('script,style');
 const canContain = node => node?.matches('main,header,footer,section,article,aside,form,div,details') &&
   !node.closest('table') && !panel.contains(node);
 const actionAllowed = node => node?.matches('button') && !panel.contains(node) &&
   /^(←|volver|verificar|generar vista previa|ajustar al ancho|restablecer)/i.test(node.textContent.trim());
 const safeHref = value => /^(https?:\/\/[^\s]+|#[\w-]+)$/i.test(value || '');
 const numeric = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 5000;
 function cleanHtml(html, inline) {
   const parsed = new DOMParser().parseFromString(String(html).slice(0,30000), 'text/html');
   const output = document.createDocumentFragment();
   const tags = new Set('b strong i em u span br a font'.split(' ').concat(inline ? [] : 'div p ul ol li blockquote'.split(' ')));
   function copy(source, target) {
     for (const child of source.childNodes) {
       if (child.nodeType === 3) { target.append(document.createTextNode(child.textContent)); continue; }
       if (child.nodeType !== 1 || child.matches('script,style,iframe,object,template')) continue;
       const tag = child.localName;
       if (!tags.has(tag) || (tag === 'a' && inline)) { copy(child,target); continue; }
       const item = document.createElement(tag);
       if (tag === 'a' && safeHref(child.getAttribute('href'))) item.setAttribute('href',child.getAttribute('href'));
       if (tag === 'font') for (const attr of ['face','size','color']) {
         const value = child.getAttribute(attr);
         if (value && /^[\w #,-]{1,40}$/.test(value)) item.setAttribute(attr,value);
       }
       for (const prop of ['color','backgroundColor','fontWeight','fontStyle','fontFamily','fontSize','textDecoration','textAlign','marginLeft']) {
         const value = child.style[prop];
         if ((value && !/[();]/.test(value)) || /^rgba?\([\d\s,.]+\)$/.test(value)) item.style[prop] = value;
       }
       copy(child,item);
       target.append(item);
     }
   }
   copy(parsed.body,output);
   return output;
 }

  return {canEditText,canContain,actionAllowed,safeHref,numeric,cleanHtml};
 }
 function makeSection(op,register){
   const box = document.createElement(op.fold ? 'details' : 'section');
   box.className = 'adc-design-section';
   if (op.fold) box.open = !!op.open;
   const title = document.createElement(op.fold ? 'summary' : 'h3');
   title.textContent = String(op.title || 'Nueva sección').slice(0,180);
   box.append(title);
   register(box,op.id);
   register(title,op.id + '-title');
   return box;

 }
 const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
 window.adcEditorCommon=Object.freeze({palette:Object.freeze(palette),createRegistry,createHelpers,makeSection,rect});
})();
