(() => {
 const color=value=>/^#[0-9a-f]{6}$/i.test(value||'');
 function theme(op){
  const root=document.documentElement,before=root.getAttribute('style'),old=root.getAttribute('data-adc-brand-theme'),stamp=root.dataset.adcThemeStamp;
  if(stamp&&op.stamp&&stamp>op.stamp)return ()=>{};
  root.dataset.adcBrandTheme='';if(op.stamp)root.dataset.adcThemeStamp=op.stamp;
  for(const [key,property] of [['primary','--adc-brand-primary'],['accent','--adc-brand-accent']])if(color(op[key]))root.style.setProperty(property,op[key]);
  if(color(op.primary))root.style.setProperty('--primary',op.primary);
  if(color(op.accent))root.style.setProperty('--accent',op.accent);
  window.dispatchEvent(new Event('adc:studio-theme'));
  return ()=>{if(before===null)root.removeAttribute('style');else root.setAttribute('style',before);if(old===null)root.removeAttribute('data-adc-brand-theme');else root.setAttribute('data-adc-brand-theme',old);if(stamp===undefined)delete root.dataset.adcThemeStamp;else root.dataset.adcThemeStamp=stamp;window.dispatchEvent(new Event('adc:studio-theme'));};
 }
 function restoreTheme(configuration){
  const all=Object.values(configuration.pages||{}).flatMap(page=>page.operations).filter(op=>op.kind==='theme').sort((a,b)=>(a.stamp||'').localeCompare(b.stamp||''));
  if(all.length)theme(all.at(-1));
 }
 function apply(op,{node,register}){
  if(op.kind==='theme')return theme(op);
  if(op.kind==='studioGuide'){
   const guide=document.createElement('div');guide.className='adc-design-created adc-studio-guide';guide.dataset.guideAxis=op.axis;
   guide.setAttribute('aria-label','Guía '+(op.axis==='x'?'vertical':'horizontal'));guide.tabIndex=0;
   Object.assign(guide.style,{position:'fixed',left:op.left+'px',top:op.top+'px',width:(op.axis==='x'?1:op.length)+'px',height:(op.axis==='x'?op.length:1)+'px'});
   register(guide,op.id);document.body.append(guide);return ()=>guide.remove();
  }
  if(op.kind==='preset'){
   const section=document.createElement('section');section.className='adc-design-created adc-studio-preset adc-preset-'+op.variant;
   const title=document.createElement('h3');title.textContent=op.title||'Nuevo bloque';section.append(title);
   if(op.body){const text=document.createElement('p');text.textContent=op.body;section.append(text);}
   if(op.width)section.style.width=op.width+'px';
   register(section,op.id);node.append(section);return ()=>section.remove();
  }
  if(op.kind==='duplicate'){
   if(window.adcStudioPolicy.anchored(node)||node.matches('input,select,textarea,form,main,body,html')||node.querySelector('input,select,textarea,form'))return;
   const clone=node.cloneNode(true);clone.querySelectorAll('script,iframe,object,embed,style').forEach(child=>child.remove());
   const nodes=[clone,...clone.querySelectorAll('*')],ids=new Map();
   for(const [index,child] of nodes.entries()){
    for(const attr of [...child.attributes])if(attr.name.startsWith('on')||attr.name.startsWith('data-'))child.removeAttribute(attr.name);
    if(child.matches('button')){child.type='button';child.classList.add('adc-design-unbound');child.disabled=false;}
    if(child.matches('a')){child.removeAttribute('href');child.setAttribute('aria-disabled','true');}
    if(child.id){const next=op.id+'-'+index;ids.set(child.id,next);child.id=next;}
   }
   for(const child of nodes)for(const attr of ['for','aria-labelledby','aria-describedby','aria-controls','href']){
    const value=child.getAttribute(attr);if(!value)continue;
    child.setAttribute(attr,attr==='href'&&value.startsWith('#')?'#'+(ids.get(value.slice(1))||value.slice(1)):value.split(' ').map(part=>ids.get(part)||part).join(' '));
   }
   clone.classList.add('adc-design-created');clone.removeAttribute('data-adc-design-selected');
   const x=(Number(node.dataset.adcDesignX)||0)+16,y=(Number(node.dataset.adcDesignY)||0)+16;
   clone.style.translate=x+'px '+y+'px';clone.dataset.adcDesignX=x;clone.dataset.adcDesignY=y;
   register(clone,op.id);node.after(clone);return ()=>clone.remove();
  }
 }
 window.adcStudioOperations=Object.freeze({apply,restoreTheme});
})();
