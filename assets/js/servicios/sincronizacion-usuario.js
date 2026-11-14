// Repositorio versionado por documento. No mezcla formularios ni hace escrituras globales.
(() => {
 function create({store,remote,onState=()=>{}}){
  let owner=null,epoch=0,busy=null,state={status:'local',message:'Datos guardados sólo en este dispositivo.',conflicts:[],verified:0};
  const emit=patch=>{state={...state,...patch};onState(state);return state};
  function compatible(key,raw){
   if(raw===null)return true;
   if(typeof raw!=='string'||new TextEncoder().encode(raw).length>2*1024*1024)return false;
   if(key==='adc_dj_presented_at')return true;
   try{
    const data=JSON.parse(raw);
    if(key==='adc_v08'){
     if(!data||typeof data!=='object'||!Array.isArray(data.inst)||!data.inst.every(i=>i&&typeof i==='object'&&(i.entries==null||Array.isArray(i.entries))))return false;
     if(typeof globalThis.validateProfileBackup==='function')globalThis.validateProfileBackup(data);
    }
    return data!==null&&typeof data==='object';
   }catch{return false;}
  }
  const valid=row=>row.owner_id===owner&&row.schema_version===1&&Number.isSafeInteger(Number(row.revision))&&Number(row.revision)>0&&typeof row.record_key==='string'&&store.syncable(row.record_key)&&row.payload&&Object.hasOwn(row.payload,'raw')&&(row.deleted?row.payload.raw===null:compatible(row.record_key,row.payload.raw));
  const same=(local,row)=>local.value===(row.deleted?null:row.payload.raw);
  function active(token){if(token!==epoch||!owner||store.scope()!==owner)throw Error('La cuenta cambió; operación detenida.');}
  async function run({boot=false}={}){
   if(busy)return busy;
   const token=epoch,account=owner;
   busy=(async()=>{
    emit({status:'pending',message:'Comprobando datos de tu cuenta…',conflicts:[],verified:0});
    const rows=await remote.list(account);active(token);
    if(rows.some(row=>!valid(row)))throw Error('Hay registros remotos de una versión no compatible. No se reemplazó ningún dato.');
    const cloud=new Map(rows.map(row=>[row.record_key,{...row,revision:Number(row.revision)}])),local=new Map(store.entries().map(row=>[row.key,row]));
    const conflicts=store.candidates().filter(item=>store.syncable(item.key)).map(item=>({key:item.key,kind:'local',candidateId:item.id})),issues=[];let changed=false,verified=0;
    for(const row of cloud.values()){
     const here=local.get(row.record_key);
     if(here&&same(here,row)){store.acknowledge(here,row);verified++;continue;}
     if(!here||(!here.dirty&&here.baseRevision!==row.revision)){
      if(boot){store.applyRemote(row);changed=true;verified++;}
      else conflicts.push({key:row.record_key,local:here?.value??null,remote:row,kind:'remote-update'});
     }else if(here.baseRevision!==row.revision)conflicts.push({key:row.record_key,local:here.value,remote:row,kind:'conflict'});
    }
    for(const row of local.values())if(!cloud.has(row.key)&&row.baseRevision>0)conflicts.push({key:row.key,local:row.value,remote:null,kind:'remote-missing'});
    if(store.metadata().consent?.version===1){
     for(const snapshot of store.entries()){
      active(token);if(store.metadata().consent?.version!==1)throw Error('La sincronización se pausó.');if(conflicts.some(item=>item.key===snapshot.key))continue;
      const existing=cloud.get(snapshot.key);if(existing&&same(snapshot,existing))continue;
      if(!snapshot.dirty&&existing)continue;
      if(!compatible(snapshot.key,snapshot.value)){issues.push(snapshot.key);continue;}
      let saved;
      try{saved=await remote.put(account,snapshot.key,snapshot.value,snapshot.baseRevision);active(token)}catch(error){
       if(error.code==='40001'||String(error.message).includes('ADC_SYNC_CONFLICT')){
        const latest=await remote.list(account);active(token);conflicts.push({key:snapshot.key,local:snapshot.value,remote:latest.find(row=>row.record_key===snapshot.key)||null,kind:'conflict'});continue;
       }
       throw error;
      }
      if(!valid(saved)||saved.record_key!==snapshot.key||!same(snapshot,saved))throw Error('La respuesta del guardado no coincide con los datos enviados. La copia local se conserva.');
      store.acknowledge(snapshot,saved);verified++;
     }
     // Relectura: no anunciar copia completa sólo porque los POST respondieron bien.
     const confirmed=await remote.list(account);active(token);const checked=new Map(confirmed.map(row=>[row.record_key,row]));
     for(const snapshot of store.entries()){
      if(conflicts.some(item=>item.key===snapshot.key)||issues.includes(snapshot.key))continue;
      const row=checked.get(snapshot.key);
      if(!row||!valid(row)||!same(snapshot,row)){
       if(row&&valid(row)&&snapshot.dirty&&snapshot.baseRevision===Number(row.revision))continue;
       if(row)conflicts.push({key:snapshot.key,local:snapshot.value,remote:row,kind:'conflict'});
       else throw Error('No se pudo verificar la copia remota completa. Los datos locales se conservan.');
      }
     }
    }
    active(token);
    const enabled=store.metadata().consent?.version===1;
    const dirty=store.entries().some(row=>row.dirty);
    const status=issues.length?'error':conflicts.length?'conflict':enabled?(dirty?'pending':'saved'):'local';
    if(enabled&&!issues.length&&!conflicts.length&&!dirty)store.metadataSet({...store.metadata(),lastVerifiedAt:new Date().toISOString(),migrationComplete:true});
    emit({status,conflicts,verified,message:issues.length?'Copia parcial: se verificaron los registros compatibles, pero no se subieron estos registros por formato incompatible o tamaño mayor de 2 MiB: '+issues.join(', ')+'. Se conservan localmente.':conflicts.length?'Hay versiones distintas. Elegí cómo resolverlas; no se sobrescribieron silenciosamente.':enabled?(dirty?'Hay cambios locales pendientes de sincronizar.':'Copia remota completa verificada. Los originales locales se conservan.'):'Sincronización desactivada. Los datos de este dispositivo no se suben.'});
    return {changed,...state};
   })().catch(error=>{if(token===epoch)emit({status:'error',message:['42P01','PGRST205'].includes(error.code)?'La sincronización todavía no está habilitada en el servidor: falta aplicar la migración de datos. Continuás guardando localmente.':'No se pudo sincronizar: '+error.message+'. Los datos locales se conservan.'});return {changed:false,...state}}).finally(()=>{busy=null});
   return busy;
  }
  return {
   state:()=>state,
   localError(message){emit({status:'error',message})},
   async prepare(id){owner=id;epoch++;return run({boot:true})},
   run:()=>run(),
   stop(){owner=null;epoch++;emit({status:'locked',message:'La sesión cambió. Recargá antes de continuar.',conflicts:[]})},
   async enable(){if(!owner)throw Error('Iniciá sesión.');store.metadataSet({...store.metadata(),consent:{version:1,at:new Date().toISOString(),categories:['perfil','historiales','borradores incluidos datos sensibles','calendario']}});return run()},
   disable(){epoch++;store.metadataSet({...store.metadata(),consent:null});emit({status:'local',message:'Sincronización pausada. La copia remota existente no se elimina.'})},
   resolve(key,choice){
    const conflict=state.conflicts.find(item=>item.key===key);if(!conflict)throw Error('El conflicto ya cambió. Volvé a comprobar.');
    store.backup(key,{local:conflict.local,remote:conflict.remote});
    if(choice==='remote'){
     if(conflict.remote)store.applyRemote(conflict.remote);else store.chooseLocal(key,null,0);
    }else if(choice==='local')store.chooseLocal(key,conflict.local,Number(conflict.remote?.revision)||0);
    else throw Error('Elegí una versión válida.');
    emit({status:'pending',message:'Decisión guardada localmente. Recargá para aplicar y verificar.',conflicts:state.conflicts.filter(item=>item!==conflict)});
   }
  };
 }
 window.adcUserSync=Object.freeze({create});
})();
