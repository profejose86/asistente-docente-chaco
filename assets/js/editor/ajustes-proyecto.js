// Registro visual compartido; el puente local guarda sólo operaciones de diseño.
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
    let projectPage=null,loaded=false,pendingProject=[];
    window.adcDocumentEditor?.attach(api);
    window.adcVisualElements?.attach(api);
    const button=document.createElement('button');button.type='button';button.dataset.projectExport='';
    button.textContent='Exportar ajustes al proyecto';panel.append(button);
    const help=document.createElement('p');help.textContent=window.adcLocalEditorBridge?'Usá Commit to local para guardar directamente. La exportación manual queda como respaldo opcional. No se envían los valores del perfil ni los campos completados de los formularios.':'Exportá los ajustes y compartí el archivo con Codex para incorporarlo al código. Los datos del perfil y los borradores no se incluyen automáticamente.';panel.append(help);
    function collect(){
        const items=api.operations(),base=api.baseline;
        if(base.some((op,index)=>JSON.stringify(op)!==JSON.stringify(items[index])))throw Error('El borrador reemplazó la distribución base. Usá la exportación completa para revisarlo antes de incorporarlo.');
        const targets={},operations=items.slice(base.length).map(original=>{
          const op={...original};
          for(const key of ['target','destination'])if(op[key]){
            if(op[key].startsWith('new-'))continue;
            if(op[key].startsWith('project:')&&projectPage?.targets[op[key]]){targets[op[key]]=projectPage.targets[op[key]];continue;}
            const node=api.resolve(op[key]);
            if(!node)throw Error('Abrí el formulario que ajustaste antes de exportar. Falta un elemento del borrador.');
            const description=describe(node);op[key]=description.reference;targets[op[key]]=description.identity;
          }
          return op;
        });
        // Los formularios aún cerrados conservan sus operaciones pendientes.
        for(const original of pendingProject){
          operations.push({...original});
          for(const key of ['target','destination'])if(original[key]?.startsWith('project:'))targets[original[key]]=projectPage.targets[original[key]];
        }
        const output={schema:contract.schema,pages:{[scope]:{editorSchema:contract.scopes[scope],operations,targets}}};
        contract.validate(output);
        return output;
    }
    button.onclick=event=>{
      event.stopPropagation();
      try{
        const output=collect();
        const json=JSON.stringify(output,null,2)+'\n';
        if(new Blob([json]).size>12e6)throw Error('La copia supera los 12 MB. Incorporá estos ajustes antes de agregar más archivos.');
        const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
        const link=document.createElement('a');link.href=url;link.download='ADC_ajustes_'+scope+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
        say('Ajustes exportados. Falta incorporar el archivo al proyecto antes del commit.');
      }catch(error){say(error.message);}
    };
    window.adcLocalEditorBridge?.attach({panel,say,snapshot:()=>{
      if(!loaded)throw Error('Esperá que termine de cargar el diseño del proyecto antes de guardar.');
      return {changes:collect(),page:projectPage||contract.empty().pages[scope]};
    }});
    if(localStorage.getItem('adc-project-backup-'+scope)){
      const restore=document.createElement('button');restore.type='button';restore.textContent='Recuperar borrador anterior';panel.append(restore);
      restore.onclick=event=>{event.stopPropagation();const saved=localStorage.getItem('adc-project-backup-'+scope);if(saved){api.restoreDraft(saved);location.reload();}};
    }
    fetch(source,{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('HTTP '+response.status);return response.json();}).then(configuration=>{
      projectPage=contract.validate(configuration).pages[scope];loaded=true;
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
      const pending=projectPage.operations.slice(),applied=new Map();pendingProject=pending;
      const replay=()=>{
        observer.disconnect();
        for(const [op,previous] of applied){
          if(!api.operations().includes(op)){applied.delete(op);continue;}
          const node=api.resolve(op.target);
          if(node&&node!==previous&&api.refresh(op))applied.set(op,node);
        }
        const blocked=new Set();
        for(let index=0;index<pending.length;){
          const op=pending[index],references=[op.target,...(op.destination?[op.destination]:[])];
          if(references.some(ref=>blocked.has(ref)||ref.startsWith('project:')&&!resolve(ref,projectPage.targets[ref]))||!api.append(op)){
            references.forEach(ref=>blocked.add(ref));index++;continue;
          }
          applied.set(op,api.resolve(op.target));
          pending.splice(index,1);
        }
        observer.observe(document.body,{childList:true,subtree:true});
      };
      const observer=new MutationObserver(replay);replay();
    }).catch(error=>say('No se cargaron ajustes del proyecto: '+error.message));
  }
  window.adcProjectLayout={describe,resolve,attach};
})();
