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
    window.adcDocumentBackground?.attach(api);
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
    const ghRepo='profejose86/asistente-docente-chaco',ghPath='assets/datos/ajustes-pagina.json',ghBranch='main';
    let lastGithubRevision=null;
    const sha256Hex=async text=>{
      const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf),b=>b.toString(16).padStart(2,'0')).join('');
    };
    const fromBase64Utf8=b64=>{
      const bin=atob(String(b64||'').replace(/\s+/g,'')),bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    };
    const toBase64Utf8=text=>{
      const bytes=new TextEncoder().encode(text),parts=[];
      for(let i=0;i<bytes.length;i+=0x8000)parts.push(String.fromCharCode(...bytes.subarray(i,i+0x8000)));
      return btoa(parts.join(''));
    };
    const tokenKey=()=>{const id=window.adcEditorAccess?.owner?.();return id?'adc-auth-github-token:'+id:null;};
    const pushBtn=document.createElement('button');pushBtn.type='button';pushBtn.dataset.pushGithub='';pushBtn.hidden=true;
    pushBtn.textContent='⬆ Push to GitHub';pushBtn.title='Publica los ajustes visuales de esta pantalla directo en GitHub (rama main).';
    const pushOut=document.createElement('output');pushOut.dataset.pushGithubFeedback='';pushOut.id='adcPushGithubFeedback';
    pushOut.setAttribute('role','status');pushOut.setAttribute('aria-live','polite');pushOut.hidden=true;
    pushBtn.setAttribute('aria-describedby',pushOut.id);
    const ghDetails=document.createElement('details');ghDetails.dataset.githubConfig='';ghDetails.hidden=true;
    ghDetails.innerHTML='<summary title="Configura en este navegador tu token Fine-Grained de GitHub.">GitHub · Publicación directa (admin)</summary>'
      +'<p>Pegá un Fine-Grained Token con permiso <b>Contents: Read and write</b> únicamente en <code>asistente-docente-chaco</code>. Se guarda sólo en este navegador y no se sincroniza.</p>'
      +'<input type="password" data-github-token-input autocomplete="off" spellcheck="false" placeholder="github_pat_..." aria-label="Token de GitHub" title="Pegá tu Fine-Grained Personal Access Token de GitHub."> '
      +'<button type="button" data-github-token-save title="Guarda el token únicamente en este navegador local.">Guardar token</button> '
      +'<button type="button" data-github-token-clear title="Elimina el token guardado de este navegador.">Olvidar token</button>'
      +'<p data-github-token-status role="status"></p>';
    panel.prepend(pushBtn,pushOut);panel.append(ghDetails);
    const tokenInput=ghDetails.querySelector('[data-github-token-input]');
    const tokenSave=ghDetails.querySelector('[data-github-token-save]');
    const tokenClear=ghDetails.querySelector('[data-github-token-clear]');
    const tokenStatus=ghDetails.querySelector('[data-github-token-status]');
    const setPushState=(stateValue,label,message)=>{
      pushBtn.dataset.saveState=stateValue;pushBtn.textContent=label;
      pushBtn.setAttribute('aria-busy',String(stateValue==='saving'));
      pushOut.dataset.saveState=stateValue;pushOut.textContent=message;if(message)say(message);
    };
    const syncAdminUi=()=>{
      const active=Boolean(window.adcEditorAccess?.isAdmin?.());
      pushBtn.hidden=!active;pushOut.hidden=!active;ghDetails.hidden=!active;
      if(!document.documentElement.hasAttribute('data-adc-local-editor')){
        const disabledLocal=panel.querySelector('[data-studio-local-disabled]');
        if(disabledLocal)disabledLocal.hidden=active;
      }
      if(!active){tokenInput.value='';return;}
      const k=tokenKey(),has=Boolean(k&&localStorage.getItem(k));
      tokenStatus.textContent=has?'Estado: Token vinculado en este navegador.':'Estado: Sin token configurado en este navegador.';
    };
    window.addEventListener('adc:editor-admin',syncAdminUi);
    tokenSave.onclick=event=>{
      event.stopPropagation();
      const k=tokenKey();if(!k)return;
      const val=tokenInput.value.trim();
      if(!val||/\s/.test(val)){tokenStatus.textContent='Ingresá un token válido sin espacios.';tokenInput.focus();return;}
      localStorage.setItem(k,val);tokenInput.value='';ghDetails.open=false;
      tokenStatus.textContent='Estado: Token vinculado en este navegador.';
      setPushState('unchanged','⬆ Push to GitHub','Token vinculado en este navegador. Ya podés publicar directo a GitHub.');
    };
    tokenClear.onclick=event=>{
      event.stopPropagation();
      const k=tokenKey();if(k)localStorage.removeItem(k);
      tokenInput.value='';tokenStatus.textContent='Estado: Sin token configurado en este navegador.';
      setPushState('unchanged','⬆ Push to GitHub','Token eliminado de este navegador.');
    };
    const ghFetch=async(endpoint,token,options={})=>{
      const res=await fetch('https://api.github.com/repos/'+ghRepo+endpoint,{
        ...options,cache:'no-store',signal:AbortSignal.timeout(20000),
        headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28',...(options.headers||{})}
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok){
        if(res.status===401||res.status===403)throw Error('Token rechazado o sin permiso Contents (Read and write) en '+ghRepo+'.');
        throw Error(data.message||'Error de GitHub HTTP '+res.status+'.');
      }
      return data;
    };
    pushBtn.onclick=async event=>{
      event.stopPropagation();if(pushBtn.disabled)return;
      if(!window.adcEditorAccess?.isAdmin?.()){setPushState('error','⚠ Sólo admin','Requiere sesión de administrador.');return;}
      const k=tokenKey(),token=k?localStorage.getItem(k):null;
      if(!token){
        document.getElementById('adcStudioTab-proyecto')?.click();
        ghDetails.open=true;tokenInput.focus();
        setPushState('error','⬆ Push to GitHub','Configurá primero tu token Fine-Grained de GitHub en Proyecto / Borradores.');
        return;
      }
      window.adcStudioText?.finish();pushBtn.disabled=true;
      setPushState('saving','Publicando en GitHub…','Leyendo estado actual de main en GitHub…');
      try{
        if(!loaded)throw Error('Esperá que termine de cargar el diseño del proyecto antes de publicar.');
        const changes=collect(),basePage=projectPage||contract.empty().pages[scope];
        const expectedRevision=lastGithubRevision||await sha256Hex(JSON.stringify(basePage));
        const meta=await ghFetch('/contents/'+ghPath+'?ref='+encodeURIComponent(ghBranch),token);
        let remoteRaw;
        if(meta.content)remoteRaw=fromBase64Utf8(meta.content);
        else if(meta.sha){const blob=await ghFetch('/git/blobs/'+encodeURIComponent(meta.sha),token);remoteRaw=fromBase64Utf8(blob.content);}
        else throw Error('GitHub no devolvió el contenido actual de ajustes.');
        const remoteDoc=contract.validate(JSON.parse(remoteRaw)),beforeJson=JSON.stringify(remoteDoc);
        const remoteScopeRev=await sha256Hex(JSON.stringify(remoteDoc.pages[scope]||contract.empty().pages[scope]));
        if(remoteScopeRev!==expectedRevision)throw Error('Esta pantalla cambió en GitHub. Esperá ~1 min a que publique Pages, recargá y revisá antes de volver a guardar.');
        remoteDoc.pages[scope]=changes.pages[scope];contract.validate(remoteDoc);
        if(JSON.stringify(remoteDoc)===beforeJson){
          lastGithubRevision=remoteScopeRev;
          setPushState('unchanged','✓ Sin cambios nuevos','GitHub ya tiene estos ajustes. Sin cambios pendientes.');
          return;
        }
        const bodyText=JSON.stringify(remoteDoc,null,2)+'\n';
        if(new Blob([bodyText]).size>12e6)throw Error('El registro completo supera los 12 MB.');
        const putResult=await ghFetch('/contents/'+ghPath,token,{
          method:'PUT',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({message:'style(studio): actualizar ajustes visuales ('+scope+')',content:toBase64Utf8(bodyText),sha:meta.sha,branch:ghBranch})
        });
        projectPage=remoteDoc.pages[scope];
        lastGithubRevision=await sha256Hex(JSON.stringify(projectPage));
        const sha7=String(putResult.commit?.sha||'').slice(0,7);
        setPushState('saved','✓ Publicado en GitHub','✓ Commit '+sha7+' en main. Pages se actualiza en ~1 min; en tu PC ejecutá git pull.');
      }catch(error){
        setPushState('error','⚠ Reintentar GitHub',error.message||'No se pudo publicar en GitHub.');
      }finally{pushBtn.disabled=false;}
    };
    if((globalThis.adcUserStorage||localStorage).getItem('adc-project-backup-'+scope)){
      const restore=document.createElement('button');restore.type='button';restore.textContent='Recuperar borrador anterior';panel.append(restore);
      restore.onclick=event=>{event.stopPropagation();const saved=(globalThis.adcUserStorage||localStorage).getItem('adc-project-backup-'+scope);if(saved){api.restoreDraft(saved);location.reload();}};
    }
    fetch(source,{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('HTTP '+response.status);return response.json();}).then(configuration=>{
      projectPage=contract.validate(configuration).pages[scope];loaded=true;
      window.adcStudioOperations?.restoreTheme(configuration);
      if(!projectPage?.operations.length)return;
      if(api.hasDraft()){
        const use=document.createElement('button');use.type='button';use.textContent='Usar ajustes del proyecto';panel.append(use);
        use.onclick=event=>{
          event.stopPropagation();
          (globalThis.adcUserStorage||localStorage).setItem('adc-project-backup-'+scope,api.serialize());
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
      const observer=new MutationObserver(records=>{
        if(records.every(record=>record.target instanceof Element&&record.target.closest('#adcDesignPanel,#adcDesignMarks,#adcDevRulers,#adcDocumentSelection,#adcDesignContext,[data-adc-studio-ui]')))return;
        replay();
      });replay();
    }).catch(error=>say('No se cargaron ajustes del proyecto: '+error.message));
    window.adcStudio?.attach(api);
    syncAdminUi();
  }
  window.adcProjectLayout={describe,resolve,attach};
})();
