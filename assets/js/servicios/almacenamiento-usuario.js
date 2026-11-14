// Persistencia por cuenta. No reemplaza Storage ni modifica sus prototipos.
(() => {
 const native=localStorage,real=window.adcConfig?.authMode==='supabase';
 const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
 const exact=new Set(['adc_v08','adc_dj02_v1','adc_dj_institution_order','adc_dj_presented_at','adc_dj_page2_details','adc_v091618_ack','adc_documentos_tramite_v1','adc.calendar.v1','adc_calendar_2026_personal_v1']);
 function category(key){
  if(exact.has(key)||/^adc-(?:official-form-.+-draft-v1|sc01-borrador-v1|bd02-borrador-v\d+|ol01-(?:draft|mnc)-.+)$/.test(key))return key==='adc_v08'?'perfil e instituciones':/calendar/.test(key)?'calendario personal':'formularios e historiales (pueden contener datos sensibles)';
  if(/^adc[-_]/.test(key)&&!/^adc-(?:supabase|auth|user|sync|account)/.test(key)&&!['adc_theme','adc-login-theme'].includes(key))return 'sólo local: preferencias, editor o caché';
  return null;
 }
 let scope=null,locked=false;const seen=new Map(),bootstrap=new Map();
 if(real){try{const cached=JSON.parse(native.getItem('adc-supabase-auth')||'null');const candidate=cached?.user?.id||sessionStorage.getItem('adc-account-context');if(uuid(candidate))scope=candidate;}catch{}}
 const prefix=()=>`adc-user-v1:${scope}:record:`;
 const physical=key=>prefix()+encodeURIComponent(key);
 const notify=detail=>window.dispatchEvent(new CustomEvent('adc:user-storage',{detail}));
 const persist=(key,value)=>{try{native.setItem(key,value)}catch(error){notify({type:'storage-error',message:'No se pudo guardar en este dispositivo (espacio o almacenamiento no disponible). Conservá la pantalla abierta y exportá tus datos; este cambio no está confirmado.'});throw error}};
 function legacyOwner(){return native.getItem('adc-auth-local-owner')}
 function legacyKeys(){return Object.keys(native).filter(key=>category(key)!==null)}
 function envelope(key){
  const raw=native.getItem(physical(key));if(!raw)return null;
  const record=JSON.parse(raw);if(record.format!==1||!(typeof record.value==='string'||record.value===null))throw Error('Registro local incompatible; conservá un respaldo.');return record;
 }
 function get(key){
  if(!real)return native.getItem(key);
  if(!category(key))return null;
  if(locked)throw Error('La cuenta cambió. Recargá la página antes de editar.');
  if(!scope)return bootstrap.get(key)??null;
  const row=envelope(key);if(!seen.has(key))seen.set(key,row?.localRevision||0);
  return row?row.value:legacyOwner()===scope?native.getItem(key):null;
 }
 function set(key,value){
  if(!real)return value===null?native.removeItem(key):persist(key,String(value));
  if(!category(key))throw Error('Esta clave no pertenece al almacenamiento de usuario.');
  if(locked)throw Error('La cuenta cambió. Recargá la página antes de guardar.');
  if(!scope){bootstrap.set(key,value);return;} // Inicialización oculta: se reinicia al verificar la cuenta.
  const row=envelope(key),revision=row?.localRevision||0,raw=value===null?null:String(value);
  if(row?.value===raw)return;
  if(seen.has(key)&&seen.get(key)!==revision){
   const candidate={key,value:raw,baseRevision:row?.baseRevision||0,createdAt:new Date().toISOString()};
   persist(`adc-user-v1:${scope}:candidate:${crypto.randomUUID()}`,JSON.stringify(candidate));notify({type:'local-conflict',key});throw Error('Otra pestaña modificó este dato. Tu versión se conservó para resolver el conflicto.');
  }
  const next={format:1,value:raw,localRevision:revision+1,baseRevision:row?.baseRevision||0,dirty:true};
  persist(physical(key),JSON.stringify(next));seen.set(key,next.localRevision);notify({type:'change',key});
 }
 function keys(){
  if(!real)return legacyKeys();if(!scope||locked)return [];
  const local=Object.keys(native).filter(key=>key.startsWith(prefix())).map(key=>decodeURIComponent(key.slice(prefix().length)));
  return [...new Set([...local,...(legacyOwner()===scope?legacyKeys():[])])];
 }
 const metaKey=()=>`adc-user-v1:${scope}:sync-meta`;
 const api={
  getItem:get,setItem:set,removeItem:key=>set(key,null),category,
  syncable:key=>category(key)!==null&&!category(key).startsWith('sólo local'),
  keys,scope:()=>scope,
  bind(id){if(!uuid(id))throw Error('Cuenta inválida.');const changed=scope!==id;scope=id;locked=false;sessionStorage.setItem('adc-account-context',id);bootstrap.clear();if(changed)seen.clear();return changed},
  lock(){locked=true;sessionStorage.removeItem('adc-account-context');notify({type:'locked'})},
  entries(){return keys().filter(api.syncable).map(key=>{const row=envelope(key);return {key,...(row||{format:1,value:get(key),localRevision:0,baseRevision:0,dirty:true})}})},
  metadata(){try{const value=JSON.parse(native.getItem(metaKey())||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}},
  metadataSet(value){persist(metaKey(),JSON.stringify(value))},
  legacy(){return {owner:legacyOwner(),count:legacyKeys().length,compatible:legacyKeys().filter(api.syncable).length}},
  claimLegacy(){if(!scope||locked)throw Error('Verificá la sesión.');if(legacyOwner()&&legacyOwner()!==scope)throw Error('Los datos locales pertenecen a otra cuenta.');persist('adc-auth-local-owner',scope)},
  stageLegacy(){
   api.claimLegacy();if(api.metadata().legacyStaged)return false;let changed=false;
   for(const key of legacyKeys().filter(api.syncable)){
    const raw=native.getItem(key),current=envelope(key);
    if(current&&current.value!==raw){
     if(!api.candidates().some(item=>item.key===key&&item.value===raw))persist(`adc-user-v1:${scope}:candidate:${crypto.randomUUID()}`,JSON.stringify({key,value:raw,baseRevision:current.baseRevision,createdAt:new Date().toISOString(),source:'importación anterior'}));
    }else if(!current){api.chooseLocal(key,raw,0);changed=true;}
   }
   api.metadataSet({...api.metadata(),legacyStaged:true});return changed;
  },
  applyRemote(row){
   const prior=envelope(row.record_key);persist(physical(row.record_key),JSON.stringify({format:1,value:row.deleted?null:row.payload.raw,localRevision:(prior?.localRevision||0)+1,baseRevision:row.revision,dirty:false}));
  },
  acknowledge(snapshot,row){
   const current=envelope(snapshot.key);
   if(!current){persist(physical(snapshot.key),JSON.stringify({format:1,value:snapshot.value,localRevision:snapshot.localRevision,baseRevision:row.revision,dirty:false}));return;}
   persist(physical(snapshot.key),JSON.stringify({...current,baseRevision:row.revision,dirty:current.localRevision!==snapshot.localRevision||current.value!==snapshot.value}));
  },
  backup(key,value){persist(`adc-user-v1:${scope}:backup:${crypto.randomUUID()}`,JSON.stringify({key,value,createdAt:new Date().toISOString()}))},
  chooseLocal(key,value,remoteRevision){
   const row=envelope(key);persist(physical(key),JSON.stringify({format:1,value,localRevision:(row?.localRevision||0)+1,baseRevision:remoteRevision,dirty:true}));
  },
  candidates(){if(!scope)return [];const start=`adc-user-v1:${scope}:candidate:`;return Object.keys(native).filter(key=>key.startsWith(start)).map(id=>({id,...JSON.parse(native.getItem(id))}))},
  resolveCandidate(id){if(id.startsWith(`adc-user-v1:${scope}:candidate:`))native.removeItem(id)}
 };
 window.adcUserStorage=Object.freeze(api);
})();
