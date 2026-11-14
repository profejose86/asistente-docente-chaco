(() => {
 if(window.adcConfig?.authMode!=='supabase')return;
 const store=window.adcUserStorage;let panel,bar,account,accepted=false,timer,staged=false;
 const engine=adcUserSync.create({store,remote:adcAuth.syncRecords,onState:()=>render()});
 const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
 function button(label,run,parent=panel){const n=node('button',label);n.type='button';n.onclick=()=>Promise.resolve().then(run).catch(error=>{const p=node('p',error.message);p.setAttribute('role','alert');panel.append(p)});parent.append(n);return n}
 function render(){
  if(!panel)return;
  const state=engine.state(),open=panel.open;panel.replaceChildren(node('summary','Sincronización de mi cuenta'));panel.open=open;
  const message=node('p',state.message);message.setAttribute('role','status');message.dataset.adcSyncStatus=state.status;panel.append(message);
  if(state.verified)panel.append(node('small','Registros verificados en esta comprobación: '+state.verified+'.'));
  const label=bar?.querySelector('[data-sync-label]');if(label)label.textContent=state.status==='saved'?'Datos sincronizados y verificados':state.status==='pending'?'Guardado remoto pendiente':state.status==='error'?'Error de sincronización; copia local conservada':state.status==='conflict'?'Datos con conflictos por revisar':'Datos sólo en este dispositivo';
  const legacy=store.legacy(),eligible=!legacy.owner||legacy.owner===account.id;
  if(legacy.count&&eligible&&!store.metadata().legacyStaged){
   panel.append(node('p',`Este navegador conserva datos anteriores. Se detectaron ${legacy.compatible} registros compatibles para copiar. Los originales no se borrarán.`));
   button('Usar mis datos anteriores sólo en este dispositivo',()=>{store.stageLegacy();location.reload()});
  }else if(legacy.count&&!eligible)panel.append(node('p','Este navegador conserva datos anteriores de otra cuenta. No se mostrarán ni importarán en esta cuenta.'));
  panel.append(node('p','Al activar la sincronización se guardarán en tu cuenta de Supabase: perfil y domicilio, instituciones y horarios, historiales, borradores y adjuntos de trámites (pueden incluir información médica y de familiares), marcas MNC y calendario personal. Límite de 2 MiB por registro. Los ajustes de diseño, imágenes del editor, preferencias y cachés quedan sólo en este dispositivo. No se afirma cumplimiento legal sin una revisión específica.'));
  if(store.metadata().consent?.version!==1){
   const consent=node('label'),check=node('input');check.type='checkbox';check.id='adcSyncConsent';check.checked=accepted;consent.append(check,document.createTextNode(' Confirmo que los datos anteriores que importe me pertenecen y autorizo guardar estas categorías, incluidos los datos sensibles que haya completado, en mi cuenta de Supabase.'));
   panel.append(consent);
   const enable=button('Autorizar e importar los datos compatibles',async()=>{
    if(!accepted)return;
    if(eligible){staged=store.stageLegacy()||staged;}
    const wrap=document.querySelector('.wrap');if(wrap)wrap.inert=true;
    try{await engine.enable();}finally{if(wrap&&!staged)wrap.inert=false;render();}
   });enable.disabled=!accepted||state.status==='pending';check.onchange=()=>{accepted=check.checked;enable.disabled=!accepted};
   button('Ahora no; conservar sólo localmente',()=>{store.metadataSet({...store.metadata(),declinedAt:new Date().toISOString()});panel.open=false});
  }else{
   button('Comprobar y sincronizar ahora',()=>engine.run()).disabled=state.status==='pending';
   button('Pausar sincronización',()=>engine.disable());
  }
  if(staged)button('Abrir los datos importados / recargar',()=>location.reload());
  for(const conflict of state.conflicts.filter(item=>item.kind!=='local')){
   const box=node('section');box.className='adc-sync-conflict';box.append(node('h3','Versiones diferentes: '+conflict.key));
   const detail=node('details');detail.append(node('summary','Comparar versiones (pueden contener datos sensibles)'));
   for(const [label,raw] of [['Este dispositivo',conflict.local],['Tu cuenta en Supabase',conflict.remote?.payload.raw??null]]){
    detail.append(node('strong',label),node('pre',(raw??'(eliminado)').slice(0,5000)));
   }
   const download=node('button','Descargar ambas versiones completas');download.type='button';download.onclick=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(conflict,null,2)],{type:'application/json'}));const link=node('a');link.href=url;link.download='ADC-versiones-conflicto.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   };detail.append(download,node('small','La comparación en pantalla muestra hasta 5000 caracteres por versión; el respaldo conserva el contenido completo.'));box.append(detail);panel.append(box);
   button('Usar la versión de Supabase (respaldar la local)',()=>{engine.resolve(conflict.key,'remote');location.reload()},box);
   button('Conservar la versión local y comprobar antes de subir',()=>{engine.resolve(conflict.key,'local');location.reload()},box);
  }
  for(const candidate of store.candidates()){
   const box=node('section');box.className='adc-sync-conflict';box.append(node('h3','Dos versiones locales: '+candidate.key));
   const details=node('details');details.append(node('summary','Revisar versiones locales'),node('pre',JSON.stringify({propuesta:candidate.value,actual:store.getItem(candidate.key)},null,2)));box.append(details);panel.append(box);
   for(const [label,raw] of [['Conservar la propuesta',candidate.value],['Conservar la versión actual',store.getItem(candidate.key)]])button(label,()=>{
    store.backup(candidate.key,{propuesta:candidate.value,actual:store.getItem(candidate.key)});
    const current=store.entries().find(row=>row.key===candidate.key);store.chooseLocal(candidate.key,raw,current?.baseRevision||0);store.resolveCandidate(candidate.id);location.reload();
   },box);
  }
 }
 window.adcSyncUI={
  async prepare(user){account=user;return engine.prepare(user.id)},
  mount(sessionBar){
   bar=sessionBar;
   const label=node('span');label.dataset.syncLabel='';bar.append(label);button('Mis datos / sincronización',()=>{panel.open=!panel.open},bar);
   panel=node('details');panel.id='adcSyncPanel';panel.setAttribute('aria-label','Sincronización de datos');document.body.append(panel);render();
   const legacy=store.legacy();if(legacy.compatible&&(!legacy.owner||legacy.owner===account.id)&&!store.metadata().legacyStaged&&!store.metadata().declinedAt)panel.open=true;
  },
  stop(){window.dispatchEvent(new Event('adc:account-locked'));clearTimeout(timer);engine.stop();store.lock();panel?.remove()},
  engine
 };
 window.addEventListener('adc:user-storage',event=>{
  if(!account||!bar)return;
  if(event.detail.type==='storage-error'){clearTimeout(timer);engine.localError(event.detail.message);panel.open=true;return;}
  if(event.detail.type==='locked')return;
  clearTimeout(timer);
  if(store.metadata().consent?.version===1)timer=setTimeout(()=>engine.run(),1000);
  else if(panel){if(event.detail.type==='local-conflict')panel.open=true;render();}
 });
 window.addEventListener('online',()=>{if(store.metadata().consent?.version===1)engine.run()});
 window.addEventListener('storage',event=>{if(event.key==='adc-supabase-auth'){
  let next;try{next=JSON.parse(event.newValue||'null')?.user?.id}catch{}
  if(next!==store.scope()){document.documentElement.classList.add('adc-auth-pending');adcSyncUI.stop();location.reload()}
 }});
})();
