(() => {
 if(!document.documentElement.hasAttribute('data-adc-local-editor'))return;
 const endpoint='http://localhost:3005';
 window.adcLocalEditorBridge={attach({panel,say,snapshot}){
  const button=document.createElement('button');button.type='button';button.dataset.commitLocal='';button.textContent='Commit to local';
  const feedback=document.createElement('output');feedback.dataset.commitFeedback='';feedback.id='adcCommitLocalFeedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');button.setAttribute('aria-describedby',feedback.id);
  const help=document.createElement('p');help.textContent='Guarda el diseño en los archivos fuente de este proyecto, con respaldo. No hace git commit ni push.';
  panel.prepend(button,feedback,help);let lastRevision=null;
  function state(value,label,message){button.dataset.saveState=value;button.textContent=label;button.setAttribute('aria-busy',String(value==='saving'));feedback.textContent=message;feedback.dataset.saveState=value;if(message)say(message);}
  async function request(route,options={}){
   const response=await fetch(endpoint+route,{...options,mode:'cors',credentials:'omit',signal:AbortSignal.timeout(15000)});
   const result=await response.json();if(!response.ok)throw Error(result.message||'No se pudo guardar.');return result;
  }
  button.onclick=async event=>{
   event.stopPropagation();if(button.disabled)return;window.adcStudioText?.finish();button.disabled=true;
   state('saving','Guardando…','Guardando los ajustes en el proyecto local…');
   try{
    const {changes,page}=snapshot();
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(page)));
    const expectedRevision=lastRevision||Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');
    say('Guardando en el proyecto local…');
    const session=await request('/session');
    const result=await request('/commit-local',{method:'POST',headers:{'Content-Type':'application/json','X-ADC-Editor-Token':session.token},body:JSON.stringify({changes,expectedRevision})});
    lastRevision=result.revision;
    state(result.changed?'saved':'unchanged',result.changed?'✓ Guardado local':'✓ Sin cambios nuevos',result.changed?'Guardado local completo. Respaldo creado. Podés recargar para comprobar; falta git commit si querés versionarlo.':'El proyecto ya tiene estos ajustes. Sin cambios pendientes de guardar.');
   }catch(error){state('error','⚠ Reintentar guardado',error instanceof TypeError||error.name==='TimeoutError'?'No se pudo conectar al puente. Ejecutá npm run editor:bridge en la carpeta del proyecto y volvé a guardar.':error.message);}
   finally{button.disabled=false;}
  };
 }};
})();
