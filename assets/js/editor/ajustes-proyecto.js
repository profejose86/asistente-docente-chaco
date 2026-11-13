// Puente de ajustes visuales. No escribe archivos ni exporta datos de formularios.
(() => {
  const contract=window.adcProjectLayoutData;
  const source=new URL('../../datos/ajustes-pagina.json',document.currentScript.src);
  const references=new WeakMap(),elements=new Map();
  function describe(node){
    if(references.has(node))return references.get(node);
    const parts=[];
    for(let current=node;current&&current.nodeType===1;current=current.parentElement){
      let part=current.localName;
      if(current.id){part='#'+CSS.escape(current.id);}
      else if(current.parentElement){
        const siblings=[...current.parentElement.children].filter(other=>other.localName===current.localName);
        part+=':nth-of-type('+(siblings.indexOf(current)+1)+')';
      }
      if(current.id==='adcOfficialForm'&&current.dataset.adcFormId)part+='[data-adc-form-id="'+CSS.escape(current.dataset.adcFormId)+'"]';
      parts.unshift(part);
      if(current.id)break;
    }
    let selector=parts.join(' > ');
    const form=node.closest('#adcOfficialForm[data-adc-form-id]');
    if(form&&form!==node&&!selector.startsWith('#adcOfficialForm'))selector='#adcOfficialForm[data-adc-form-id="'+CSS.escape(form.dataset.adcFormId)+'"] '+selector;
    const result={reference:'project:'+selector,identity:{tag:node.localName}};
    for(const key of ['id','name','type'])if(node.hasAttribute(key))result.identity[key]=node.getAttribute(key);
    references.set(node,result);elements.set(result.reference,node);return result;
  }
  function resolve(reference,identity){
    try{
      let node=elements.get(reference);
      if(!node?.isConnected){
        const nodes=document.querySelectorAll(reference.slice(8));
        if(nodes.length!==1)return null;
        node=nodes[0];
      }
      if(identity&&Object.entries(identity).some(([key,value])=>(key==='tag'?node.localName:node.getAttribute(key))!==value))return null;
      const formScope=reference.match(/#adcOfficialForm\[data-adc-form-id="(?:\\.|[^"\\])*"\]/)?.[0];
      if(formScope&&!node.closest(formScope))return null;
      if(node.closest('#adcDesignPanel,script,style'))return null;
      elements.set(reference,node);return node;
    }catch{return null;}
  }
  function attach(api){
    const {scope,panel,say}=api;
    let projectPage=null;
    window.adcVisualElements?.attach(api);
    const button=document.createElement('button');button.type='button';button.dataset.projectExport='';
    button.textContent='Exportar ajustes al proyecto';panel.append(button);
    const help=document.createElement('p');help.textContent='Exportá los ajustes y compartí el archivo con Codex para incorporarlo al código. Los datos del perfil y los borradores no se incluyen automáticamente.';panel.append(help);
    button.onclick=event=>{
      event.stopPropagation();
      try{
        const items=api.operations(),base=api.baseline;
        if(base.some((op,index)=>JSON.stringify(op)!==JSON.stringify(items[index])))throw Error('El borrador reemplazó la distribución base. Usá la exportación completa para revisarlo antes de incorporarlo.');
        const targets={},operations=items.slice(base.length).map(original=>{
          const op={...original};
          for(const key of ['target','destination'])if(op[key]){
            if(op[key].startsWith('new-'))continue;
            const node=api.resolve(op[key]);
            if(!node)throw Error('Abrí el formulario que ajustaste antes de exportar. Falta un elemento del borrador.');
            const description=describe(node);op[key]=description.reference;targets[op[key]]=description.identity;
          }
          return op;
        });
        const output={schema:contract.schema,pages:{[scope]:{editorSchema:contract.scopes[scope],operations,targets}}};
        contract.validate(output);
        const json=JSON.stringify(output,null,2)+'\n';
        if(new Blob([json]).size>12e6)throw Error('La copia supera los 12 MB. Incorporá estos ajustes antes de agregar más archivos.');
        const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
        const link=document.createElement('a');link.href=url;link.download='ADC_ajustes_'+scope+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
        say('Ajustes exportados. Falta incorporar el archivo al proyecto antes del commit.');
      }catch(error){say(error.message);}
    };
    if(localStorage.getItem('adc-project-backup-'+scope)){
      const restore=document.createElement('button');restore.type='button';restore.textContent='Recuperar borrador anterior';panel.append(restore);
      restore.onclick=event=>{event.stopPropagation();const saved=localStorage.getItem('adc-project-backup-'+scope);if(saved){api.restoreDraft(saved);location.reload();}};
    }
    fetch(source,{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('HTTP '+response.status);return response.json();}).then(configuration=>{
      projectPage=contract.validate(configuration).pages[scope];
      if(!projectPage?.operations.length)return;
      if(api.hasDraft()){
        const use=document.createElement('button');use.type='button';use.textContent='Usar ajustes del proyecto';panel.append(use);
        use.onclick=event=>{
          event.stopPropagation();
          localStorage.setItem('adc-project-backup-'+scope,api.serialize());
          api.clearDraft();location.reload();
        };
        say('Se conservó tu borrador local. Podés exportarlo o elegir los ajustes del proyecto.');return;
      }
      const pending=projectPage.operations.slice(),applied=new Map();
      const replay=()=>{
        observer.disconnect();
        for(const [op,previous] of applied){
          if(!api.operations().includes(op)){applied.delete(op);continue;}
          const node=api.resolve(op.target);
          if(node&&node!==previous&&api.refresh(op))applied.set(op,node);
        }
        while(pending.length){
          const op=pending[0];
          if(op.target.startsWith('project:')&&!resolve(op.target,projectPage.targets[op.target]))break;
          if(op.destination?.startsWith('project:')&&!resolve(op.destination,projectPage.targets[op.destination]))break;
          if(!api.append(op))break;
          applied.set(op,api.resolve(op.target));
          pending.shift();
        }
        observer.observe(document.body,{childList:true,subtree:true});
      };
      const observer=new MutationObserver(replay);replay();
    }).catch(error=>say('No se cargaron ajustes del proyecto: '+error.message));
  }
  window.adcProjectLayout={describe,resolve,attach};
})();
