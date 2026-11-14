// Interfaz compartida de ADC Studio. No duplica el motor ni escribe archivos por sí sola.
(() => {
 const P=()=>window.adcStudioPolicy;
 const tips={navigate:'Cierra Studio para volver a usar la página normalmente.',undo:'Revierte la última operación visual.',redo:'Recupera la última operación deshecha.',delete:'Oculta el elemento seleccionado; Deshacer permite recuperarlo.',parent:'Selecciona el contenedor exterior del elemento.',up:'Sube el elemento en el orden de sus hermanos.',down:'Baja el elemento en el orden de sus hermanos.',group:'Agrupa la selección en una sección creada por el editor.',split:'Divide una sección a partir del punto indicado.',section:'Dibuja una nueva sección con título.',box:'Dibuja una caja de texto editable.',button:'Crea un botón visual; los botones sin acción configurada no ejecutan trámites.',dropdown:'Coloca un desplegable junto al control seleccionado.',fold:'Convierte una sección compatible en un bloque plegable.',bubble:'Agrega una burbuja explicativa junto al elemento.',background:'Abre la paleta para cambiar el fondo.',size:'Selecciona y ajusta tamaño o posición; también puedes usar la manipulación directa.', 'doc-size':'Mueve o escala el documento junto con todos sus campos.',note:'Dibuja una nota con texto libre.',rectangle:'Dibuja un recuadro de referencia.',ellipse:'Dibuja un óvalo de referencia.',line:'Dibuja una línea y ajusta el grosor y color.',erase:'Oculta elementos seleccionados mediante la goma; no elimina datos del perfil.',text:'Aplica el texto editado a la selección.',link:'Agrega un enlace seguro al texto seleccionado.',save:'Guarda un borrador visual en este navegador.',export:'Descarga el borrador completo como JSON opcional.',import:'Recupera un borrador compatible desde un archivo JSON.', 'center-area':'Centra la selección dentro de su columna.', 'center-screen':'Centra la selección respecto de la pantalla.', 'center-peer':'Elige otro bloque como referencia para centrar.', 'center-apply':'Confirma el centrado que muestran las guías.'};
 const fieldTips={'add-image':'Importa PNG, JPG o WebP de hasta 500 KB.','replace-image':'Elige una imagen existente y reemplázala conservando su espacio.','add-pdf':'Agrega un PDF de hasta 5 MB y 20 páginas como documento editable.','fit-pdf':'Ajusta el PDF añadido al ancho de su contenedor.','delete':'Oculta el elemento sin borrar el PDF oficial ni los datos docentes.','cancel':'Cancela la herramienta actual sin guardar un gesto incompleto.'};
 function attach(api){
  const {panel,say}=api;if(panel.dataset.adcStudio)return;panel.dataset.adcStudio='';document.body.classList.add('adc-studio-mounted');
  const original=[...panel.children],top=document.createElement('div');top.className='adc-studio-top';
  const title=document.createElement('strong');title.textContent='ADC Studio';top.append(title);
  const global=document.createElement('div');global.className='adc-studio-global';top.append(global);
  const tabs=document.createElement('div');tabs.className='adc-studio-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Herramientas de ADC Studio');
  const content=document.createElement('div');content.className='adc-studio-content';
  const groups={organizacion:'Organización',elementos:'Elementos / Documentos',dibujo:'Dibujo / Anotaciones',proyecto:'Proyecto / Borradores',plantillas:'Plantillas'};
  const panes={},tabButtons={};
  function openTab(key){
   for(const name of Object.keys(groups)){panes[name].hidden=name!==key;tabButtons[name].setAttribute('aria-selected',String(name===key));tabButtons[name].tabIndex=name===key?0:-1;}
   panel.dataset.studioTab=key;
  }
  function button(label,title,run,parent=global){const b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;b.onclick=event=>{event.stopPropagation();run(event);};parent.append(b);return b;}
  for(const [key,label] of Object.entries(groups)){
   const b=button(label,'Muestra las herramientas de '+label,()=>openTab(key),tabs);b.id='adcStudioTab-'+key;b.setAttribute('role','tab');b.setAttribute('aria-controls','adcStudioPane-'+key);tabButtons[key]=b;
   const pane=document.createElement('section');pane.id='adcStudioPane-'+key;pane.setAttribute('role','tabpanel');pane.setAttribute('aria-labelledby',b.id);panes[key]=pane;content.append(pane);
  }
  tabs.onkeydown=event=>{const keys=Object.keys(groups),current=keys.indexOf(panel.dataset.studioTab);if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();event.stopPropagation();const index=event.key==='Home'?0:event.key==='End'?keys.length-1:(current+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length;openTab(keys[index]);tabButtons[keys[index]].focus();};
  panel.replaceChildren(top,tabs,content);
  const commit=original.find(node=>node.matches('[data-commit-local]'));
  if(commit)top.insertBefore(commit,global);
  else{const unavailable=button('Commit to local','El guardado directo sólo funciona en la página local de tu PC.',()=>{},top);unavailable.disabled=true;unavailable.dataset.studioLocalDisabled='';top.insertBefore(unavailable,global);}
  const globalActs=new Set(['navigate','undo','redo']);
  for(const node of original){
   if(node===commit)continue;
   if(node.matches('[data-status]')){top.append(node);continue;}
   if(node.matches('br,strong'))continue;
   for(const item of [node,...node.querySelectorAll('[data-act]')])if(globalActs.has(item.dataset.act))global.append(item);
   // Retirar sólo atajos duplicados; conservar una única acción canónica.
   node.querySelectorAll('[data-element-action="resize"],[data-element-action="add-box"],[data-element-action="add-section"],[data-element-action="add-button"],[data-element-action="add-dropdown"]').forEach(item=>item.remove());
   if(globalActs.has(node.dataset.act)||!node.textContent.trim()&&!node.matches('input,div,details'))continue;
   let key='proyecto';
   if(node.matches('#adcDesignFormatting,#adcDesignPalette,fieldset')||node.querySelector('[data-act="box"],[data-act="button"],[data-act="dropdown"]'))key='elementos';
   else if(node.querySelector('[data-act="parent"],[data-act="size"],[data-act="section"]'))key='organizacion';
   else if(node.matches('label')||node.querySelector('[data-act="note"]'))key='dibujo';
   if(node.children.length||node.textContent.trim())panes[key].append(node);
  }
  function selectControl(label,values,change,parent=global){const wrap=document.createElement('label');wrap.textContent=label+' ';const select=document.createElement('select');select.setAttribute('aria-label',label);select.title=label;for(const [value,text] of values){const option=new Option(text,value);select.append(option);}select.onchange=()=>change(select.value);wrap.append(select);parent.append(wrap);return select;}
  const layout=selectControl('Panel',[['vertical','Vertical'],['horizontal','Horizontal']],value=>{panel.dataset.orientation=value;try{sessionStorage.setItem('adc-studio-orientation',value);}catch{}window.dispatchEvent(new Event('resize'));});
  try{layout.value=sessionStorage.getItem('adc-studio-orientation')||'vertical';}catch{}panel.dataset.orientation=layout.value;
  const device=selectControl('Vista',[['actual','Actual'],['desktop','Escritorio'],['tablet','Tablet'],['phone','Celular']],value=>{if(value!=='actual')preview(value);});
  const units=selectControl('Unidades',[['cm','cm'],['px','px']],()=>{updateBadge();window.dispatchEvent(new Event('adc:studio-units'));});
  const direct=document.createElement('label');direct.innerHTML='<input type="checkbox" checked> Edición directa';direct.querySelector('input').title='Activa la selección, arrastre y ocho tiradores al pasar el mouse, sin elegir una herramienta.';global.append(direct);
  const snap=document.createElement('label');snap.innerHTML='<input id="adcStudioSnap" type="checkbox" checked> Imantar';global.append(snap);snap.title='Alinea suavemente a bloques y guías. Shift o Alt desactiva el imán durante el gesto.';
  snap.querySelector('input').title=snap.title;
  layout.title='Alterna entre panel vertical compacto y horizontal extendido.';device.title='Simula el diseño actual en un viewport de escritorio, tablet o celular sin ejecutar trámites.';units.title='Alterna píxeles CSS y centímetros CSS: 96 px equivalen a 2,54 cm.';
  function tooltip(root){for(const control of root.querySelectorAll('button,input,select')){
   if(control.title)continue;
   const byId={adcDevRules:'Muestra u oculta las reglas movibles y sus guías.',adcKeepNotes:'Mantiene las anotaciones visibles al cerrar el panel.',adcAnnotationWidth:'Ajusta el grosor del trazo seleccionado en píxeles.',adcStroke:'Define el grosor de las próximas anotaciones en píxeles.',adcAnnotationColor:'Elige el color de la anotación.',adcDesignFont:'Cambia la fuente del texto seleccionado.',adcDesignSize:'Cambia el tamaño del texto seleccionado.',adcDesignColor:'Cambia el color de la letra.',adcDesignMark:'Resalta el texto con el color elegido.',adcDesignImport:'Carga un borrador visual JSON compatible.'};
   control.title=byId[control.id]||tips[control.dataset.act]||fieldTips[control.dataset.elementAction]||(control.dataset.format?'Aplica el formato '+control.dataset.format+' al texto seleccionado.':control.hasAttribute('data-commit-local')?'Escribe el diseño en archivos locales, con respaldo; no hace git commit ni push.':control.hasAttribute('data-project-export')?'Descarga ajustes con referencias estables para incorporarlos al proyecto.':'Acción: '+(control.textContent.trim()||control.getAttribute('aria-label')||control.type)+'.');
  }}
  tooltip(panel);openTab('organizacion');
  // El motor de formato decide qué puede editarse; la solapa se abre al solicitar texto.
  // Controles añadidos después por la carga asíncrona del proyecto van a su solapa.
  const observe=new MutationObserver(()=>{for(const node of [...panel.children])if(![top,tabs,content].includes(node))panes.proyecto.append(node);tooltip(panel);});observe.observe(panel,{childList:true});
  const themeBox=document.createElement('fieldset');themeBox.innerHTML='<legend>Identidad institucional</legend><p>Colores maestros; no cambian la plantilla PDF oficial.</p>';
  for(const [key,label,initial] of [['primary','Azul institucional','#2453a3'],['accent','Acento institucional','#d9822b']]){
   const wrap=document.createElement('label');wrap.textContent=label+' ';const input=document.createElement('input');input.type='color';input.value=initial;input.title='Modifica '+label.toLowerCase()+' en toda la interfaz al guardar el tema.';input.dataset.studioTheme=key;wrap.append(input);themeBox.append(wrap);
  }
  function syncTheme(){for(const [key,fallback] of [['primary','#2453a3'],['accent','#d9822b']])themeBox.querySelector('[data-studio-theme='+key+']').value=document.documentElement.style.getPropertyValue('--adc-brand-'+key)||fallback;}
  window.addEventListener('adc:studio-theme',syncTheme);syncTheme();
  const host=()=>document.getElementById(api.scope==='ingreso'?'adcLoginCanvas':'profile');
  button('Aplicar colores','Aplica los colores institucionales como una operación reversible y guardable.',()=>{api.commit({kind:'theme',target:api.keyFor(host()),primary:themeBox.querySelector('[data-studio-theme=primary]').value,accent:themeBox.querySelector('[data-studio-theme=accent]').value,stamp:String(Date.now())});},themeBox);panes.proyecto.prepend(themeBox);
  const presets=[['alert','Aviso al docente','Verificá la información antes de presentar el trámite.'],['heading','Encabezado de sección','Organizá aquí los datos del trámite.'],['normativa','Referencia normativa','Completá la norma y su fuente oficial; no se incorpora normativa inventada.']];
  const presetsHelp=document.createElement('p');presetsHelp.textContent='Insertá un bloque, luego editá su texto o posición. No modifica requisitos del trámite.';panes.plantillas.append(presetsHelp);
  for(const [variant,title,body] of presets)button(title,'Inserta '+title.toLowerCase()+' en la sección visible seleccionada.',()=>{
   const selected=api.selected(),candidate=selected?.closest('section,article,main,div');
   const target=candidate&&!P().isUi(candidate)&&candidate.getClientRects().length?candidate:api.scope==='ingreso'?host():[...document.querySelectorAll('#profile,#tramites,#license,#dj,#dj02,#adcOfficialForm,#adcOL,#adcSC01,#adcBD02')].find(node=>node.getClientRects().length);
   if(!target){say('Abrí una sección antes de insertar la plantilla.');return;}
   const id=P().uid();if(api.commit({kind:'preset',target:api.keyFor(target),id,variant,title,body})){api.select(api.resolve(id));say('Plantilla insertada. Podés editar sus textos y moverla.');}
  },panes.plantillas);
  const history=document.createElement('details');history.className='adc-studio-history';history.innerHTML='<summary title="Ver las últimas acciones y volver al estado elegido.">Historial / Time travel</summary><div></div>';top.append(history);
  let historySignature='';
  const labels={style:'Movimiento / tamaño / estilo',text:'Edición de texto',front:'Cambio de capa',preset:'Plantilla pedagógica',studioGuide:'Guía de referencia',theme:'Colores institucionales',duplicate:'Duplicación',hideOriginal:'Elemento ocultado',annotation:'Anotación',documentTransform:'Documento movido / escalado'};
  function updateHistory(){
   if(!api.history)return;const {operations,redo}=api.history(),all=[...operations,...redo.slice().reverse()],signature=operations.length+':'+all.length+':'+all.slice(-1).map(op=>op.kind+op.target);if(signature===historySignature)return;historySignature=signature;
   const list=history.querySelector('div');list.replaceChildren();const floor=api.baseline.length;
   button('Estado inicial de esta distribución','Vuelve al estado anterior a los ajustes adicionales, conservando la distribución base.',()=>travel(floor),list);
   all.slice(Math.max(floor,all.length-20)).forEach((op,index)=>{
    const count=Math.max(floor,all.length-20)+index+1;
    const b=button(count+'. '+(labels[op.kind]||op.kind)+(count===operations.length?' · actual':''),'Vuelve al estado después de esta acción; podés avanzar de nuevo con Rehacer.',()=>travel(count),list);b.dataset.historyCount=count;
   });
  }
  function travel(count){const {operations,redo}=api.history();if(count<api.baseline.length||count>operations.length+redo.length)return;const direction=count<operations.length?'undo':'redo';for(let i=0;i<Math.abs(count-operations.length);i++)panel.querySelector('[data-act='+direction+']').click();updateHistory();}
  panel.addEventListener('click',()=>queueMicrotask(()=>{updateHistory();updateBadge();}));
  window.addEventListener('adc:studio-change',()=>{updateHistory();updateBadge();});
  const badge=document.createElement('aside');badge.id='adcStudioInspector';badge.dataset.adcStudioUi='';badge.hidden=true;
  const measures=document.createElement('output');badge.append(measures);
  const positionFields={};
  for(const key of ['x','y','width','height']){const label=document.createElement('label');label.textContent=({x:'X',y:'Y',width:'Ancho',height:'Alto'})[key];const input=document.createElement('input');input.type='number';input.step='.01';input.title='Ajusta '+label.textContent.toLowerCase()+' en las unidades elegidas.';input.setAttribute('aria-label','Inspector '+key);label.append(input);badge.append(label);positionFields[key]=input;input.onchange=()=>setMeasure(key,Number(input.value));}
  const badgeColor=document.createElement('input');badgeColor.type='color';badgeColor.title='Color de fondo del elemento seleccionado';badgeColor.setAttribute('aria-label','Color del elemento');badgeColor.onchange=()=>{const n=api.selected();if(n)api.commit({kind:'style',target:api.keyFor(n),background:badgeColor.value});};badge.append(badgeColor);
  button('Al frente','Lleva el elemento seleccionado por encima de las otras capas.',()=>{const n=api.selected();if(n)api.commit({kind:'front',target:api.keyFor(n),level:Math.min(5000,1+Math.max(500,...api.operations().filter(op=>op.kind==='front').map(op=>op.level)))});},badge);
  button('Texto','Abre el editor de texto de la selección.',()=>{openTab('elementos');const formatting=panel.querySelector('#adcDesignFormatting');if(!formatting.hidden)formatting.open=true;},badge);
  document.body.append(badge);
  const factor=node=>{const r=node.getBoundingClientRect();return {x:r.width/(node.offsetWidth||r.width)||1,y:r.height/(node.offsetHeight||r.height)||1};};
  function updateBadge(){
   const n=api.selected();if(panel.hidden||!n?.isConnected||!n.getClientRects().length){badge.hidden=true;return;}
   const r=n.getBoundingClientRect(),unit=units.value,conversion=unit==='cm'?P().pxPerCm:1;badge.hidden=false;
   measures.textContent=(P().anchored(n)?'🔒 Estructura protegida · ':'')+(r.width/conversion).toFixed(2)+' × '+(r.height/conversion).toFixed(2)+' '+unit;
   const values={x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height};for(const [key,input] of Object.entries(positionFields)){if(document.activeElement!==input)input.value=(values[key]/conversion).toFixed(2);input.disabled=P().anchored(n);}
   let left=Math.max(8,Math.min(innerWidth-badge.offsetWidth-8,r.left)),top=Math.max(8,Math.min(innerHeight-badge.offsetHeight-8,r.top>badge.offsetHeight+16?r.top-badge.offsetHeight-8:r.bottom+8));
   const area=panel.getBoundingClientRect();if(left<area.right&&left+badge.offsetWidth>area.left&&top<area.bottom&&top+badge.offsetHeight>area.top){if(area.right+badge.offsetWidth+16<innerWidth)left=area.right+8;else top=Math.min(innerHeight-badge.offsetHeight-8,area.bottom+8);}
   badge.style.left=left+'px';badge.style.top=top+'px';
  }
  function setMeasure(key,value){
   const n=api.selected();if(!n||!Number.isFinite(value)||P().anchored(n))return;const r=n.getBoundingClientRect(),scale=factor(n),pixels=value*(units.value==='cm'?P().pxPerCm:1),op={kind:'style',target:api.keyFor(n)};
   if(key==='x'||key==='y'){op.x=key==='x'?(pixels-r.left-scrollX)/scale.x:0;op.y=key==='y'?(pixels-r.top-scrollY)/scale.y:0;}else op[key]=pixels/scale[key==='width'?'x':'y'];
   api.commit(op);updateBadge();
  }
  function preview(kind){
   const width={desktop:1280,tablet:820,phone:390}[kind];
   const source=document.body.cloneNode(true);
   const canvases=[...document.body.querySelectorAll('canvas')];
   for(const [index,canvas] of [...source.querySelectorAll('canvas')].entries()){
    try{const image=document.createElement('img');image.src=canvases[index].toDataURL('image/png');image.alt='Vista del documento';for(const name of ['class','style','width','height'])if(canvas.hasAttribute(name))image.setAttribute(name,canvas.getAttribute(name));canvas.replaceWith(image);}catch{canvas.setAttribute('aria-label','Este lienzo no pudo copiarse a la vista previa.');}
   }
   const originals=[...document.body.querySelectorAll('input,textarea,select')],clones=[...source.querySelectorAll('input,textarea,select')];
   // IDs estables permiten copiar valores de vista sin escribir borradores.
   for(const [index,clone] of clones.entries()){const original=originals[index];if(!original)continue;if(original.type==='password'||/password/i.test(original.name+' '+original.id+' '+original.autocomplete)){clone.removeAttribute('value');clone.value='';clone.type='password';continue;}if(clone.tagName==='TEXTAREA')clone.textContent=original.value;else if(clone.tagName==='SELECT')[...clone.options].forEach((option,i)=>option.selected=original.options[i]?.selected);else{clone.setAttribute('value',original.value);clone.toggleAttribute('checked',original.checked);}}
   source.querySelectorAll('script,#adcDesignPanel,#adcDesignGear,#adcDesignMarks,#adcDevRulers,#adcDocumentSelection,#adcDesignContext,[data-adc-studio-ui]').forEach(node=>node.remove());
   for(const node of source.querySelectorAll('*'))for(const attr of [...node.attributes])if(attr.name.startsWith('on'))node.removeAttribute(attr.name);
   source.classList.remove('adcDesignActive','adcDesignSizing','adcDesignMoving','adcEraser');
   const modal=document.createElement('dialog');modal.dataset.adcStudioUi='';modal.className='adc-studio-device';const label=document.createElement('p');label.textContent=kind+' · '+width+' px · Vista del diseño actual. Los trámites no se ejecutan aquí.';modal.append(label);
   const closePreview=()=>{modal.close();modal.remove();device.value='actual';};button('Cerrar vista','Vuelve al editor sin modificar el diseño.',closePreview,modal);modal.addEventListener('cancel',event=>{event.preventDefault();closePreview();});
   const scroller=document.createElement('div'),iframe=document.createElement('iframe');scroller.className='adc-studio-device-scroll';iframe.title='Simulación '+kind;iframe.setAttribute('sandbox','');iframe.style.width=width+'px';iframe.style.height='70vh';
   const head=[...document.head.querySelectorAll('link[rel=stylesheet],style')].map(node=>node.outerHTML).join('');
   iframe.srcdoc='<!doctype html><html lang="es" data-theme="'+document.documentElement.dataset.theme+'" style="'+document.documentElement.style.cssText.replaceAll('"','&quot;')+'"'+(document.documentElement.hasAttribute('data-adc-brand-theme')?' data-adc-brand-theme':'')+'><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+location.href.replaceAll('"','&quot;')+'">'+head+'</head>'+source.outerHTML+'</html>';
   scroller.append(iframe);modal.append(scroller);document.body.append(modal);modal.showModal();
  }
  const ui={openTab,button,units:()=>units.value,active:()=>!panel.hidden,direct:()=>direct.querySelector('input').checked,snap:()=>snap.querySelector('input').checked,updateBadge,factor,host};
  window.adcStudioDirect?.attach(api,ui);window.adcStudioGuides?.attach(api,ui);
  window.addEventListener('adc:studio-selection',updateBadge);window.addEventListener('scroll',updateBadge,true);window.addEventListener('resize',updateBadge);
  new MutationObserver(()=>{updateBadge();updateHistory();}).observe(panel,{attributes:true,attributeFilter:['hidden']});
  updateHistory();tooltip(panel);
 }
  window.adcStudio=Object.freeze({attach,freeMode:()=>document.getElementById('adcStudioSnap')?.checked===false});
})();
