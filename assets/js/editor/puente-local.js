(() => {
 if(!document.documentElement.hasAttribute('data-adc-local-editor'))return;
 const endpoint='http://localhost:3005';
 window.adcLocalEditorBridge={attach({panel,say,snapshot}){
  const button=document.createElement('button');button.type='button';button.dataset.commitLocal='';button.textContent='Commit to local';
  const help=document.createElement('p');help.textContent='Guarda el diseño en los archivos fuente de este proyecto, con respaldo. No hace git commit ni push.';
  panel.prepend(button,help);let lastRevision=null;
  async function request(route,options={}){
   const response=await fetch(endpoint+route,{...options,mode:'cors',credentials:'omit',signal:AbortSignal.timeout(15000)});
   const result=await response.json();if(!response.ok)throw Error(result.message||'No se pudo guardar.');return result;
  }
  button.onclick=async event=>{
   event.stopPropagation();button.disabled=true;
   try{
    const {changes,page}=snapshot();
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(page)));
    const expectedRevision=lastRevision||Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');
    say('Guardando en el proyecto local…');
    const session=await request('/session');
    const result=await request('/commit-local',{method:'POST',headers:{'Content-Type':'application/json','X-ADC-Editor-Token':session.token},body:JSON.stringify({changes,expectedRevision})});
    lastRevision=result.revision;
    say(result.changed?'Guardado local completo. Respaldo creado. Podés recargar para comprobar; falta git commit si querés versionarlo.':'El proyecto ya tiene estos ajustes. Sin cambios pendientes de guardar.');
   }catch(error){say(error instanceof TypeError||error.name==='TimeoutError'?'No se pudo conectar al puente. Ejecutá npm run editor:bridge en la carpeta del proyecto y volvé a guardar.':error.message);}
   finally{button.disabled=false;}
  };
 }};
})();
