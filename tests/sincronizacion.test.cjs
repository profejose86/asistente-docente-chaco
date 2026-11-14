const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
class Storage{
 constructor(seed={}){for(const [key,value] of Object.entries(seed))this.setItem(key,value)}
 getItem(key){return Object.hasOwn(this,key)?this[key]:null}
 setItem(key,value){Object.defineProperty(this,key,{value:String(value),enumerable:true,writable:true,configurable:true})}
 removeItem(key){delete this[key]}
}
function device(seed={},id=a){
 const localStorage=new Storage(seed),sessionStorage=new Storage({'adc-account-context':id});
 const c={localStorage,sessionStorage,adcConfig:{authMode:'supabase'},TextEncoder,crypto:require('node:crypto').webcrypto,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},dispatchEvent(){}};c.window=c;vm.createContext(c);
 for(const file of ['almacenamiento-usuario','sincronizacion-usuario'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/servicios/'+file+'.js'),'utf8'),c);
 c.adcUserStorage.bind(id);return {store:c.adcUserStorage,factory:c.adcUserSync,localStorage,c};
}
function server(){
 const rows=new Map();let writes=0,offline=false;
 return {rows,get writes(){return writes},set offline(value){offline=value},
  async list(owner){if(offline)throw Error('Sin red');return structuredClone([...rows.values()].filter(row=>row.owner_id===owner))},
  async put(owner,key,raw,revision){if(offline)throw Error('Sin red');const id=owner+'/'+key,old=rows.get(id);if((old?.revision||0)!==revision)throw Object.assign(Error('ADC_SYNC_CONFLICT'),{code:'40001'});writes++;const row={owner_id:owner,record_key:key,schema_version:1,revision:revision+1,payload:{raw},deleted:raw===null};rows.set(id,row);return structuredClone(row)}
 };
}
const profile=name=>JSON.stringify({nombre:name,inst:[{name:'Escuela',entries:[]}]});
test('Sincronización: consentimiento, importación completa/idempotente y otro dispositivo',async()=>{
 const cloud=server(),raw=profile('Ana');const d=device({'adc-auth-local-owner':a,adc_v08:raw,'adc-sc01-borrador-v1':'{"values":{"motivo":"dato medico"}}',adc_theme:'dark','adc-design-draft-v60':'{"operations":[]}'});
 const sync=d.factory.create({store:d.store,remote:cloud});await sync.prepare(a);assert.equal(cloud.writes,0);assert.equal(d.store.getItem('adc_v08'),raw);
 await sync.enable();assert.equal(sync.state().status,'saved');assert.equal(cloud.writes,2);assert.equal(d.localStorage.getItem('adc_v08'),raw);assert.equal(d.store.metadata().migrationComplete,true);
 await sync.run();await sync.enable();assert.equal(cloud.writes,2);
 assert.ok([...cloud.rows.values()].every(row=>row.record_key!=='adc_theme'&&!row.record_key.includes('design')));
 const other=device(),replica=other.factory.create({store:other.store,remote:cloud});const result=await replica.prepare(a);assert.equal(result.changed,true);assert.equal(other.store.getItem('adc_v08'),raw);assert.equal(cloud.writes,2);assert.equal(other.store.metadata().consent,undefined);
});
test('Sincronización: cuentas aisladas, datos originales sin dueño y archivos no compatibles',async()=>{
 const cloud=server(),d=device({adc_v08:profile('Sin dueño')});assert.equal(d.store.getItem('adc_v08'),null);
 const sync=d.factory.create({store:d.store,remote:cloud});await sync.prepare(a);assert.equal(cloud.writes,0);d.store.stageLegacy();await sync.enable();assert.equal(cloud.writes,1);
 d.store.bind(b);assert.equal(d.store.getItem('adc_v08'),null);assert.throws(()=>d.store.stageLegacy(),/otra cuenta/);assert.equal(d.localStorage.getItem('adc_v08'),profile('Sin dueño'));
 const syncB=d.factory.create({store:d.store,remote:cloud});await syncB.prepare(b);assert.equal(d.store.getItem('adc_v08'),null);d.store.setItem('adc_v08',profile('B'));await syncB.enable();assert.equal(cloud.rows.get(a+'/adc_v08').payload.raw,profile('Sin dueño'));assert.equal(cloud.rows.get(b+'/adc_v08').payload.raw,profile('B'));
 d.store.setItem('adc-sc01-borrador-v1','texto incompatible');d.store.setItem('adc.calendar.v1','{"events":[]}');await syncB.run();assert.equal(syncB.state().status,'error');assert.match(syncB.state().message,/Copia parcial/);assert.equal(d.store.getItem('adc-sc01-borrador-v1'),'texto incompatible');assert.ok(cloud.rows.has(b+'/adc.calendar.v1'));
});
test('Sincronización: dos dispositivos no se pisan y la elección local usa CAS',async()=>{
 const cloud=server(),d1=device(),d2=device();d1.store.setItem('adc_v08',profile('Original'));
 const s1=d1.factory.create({store:d1.store,remote:cloud}),s2=d2.factory.create({store:d2.store,remote:cloud});await s1.prepare(a);await s1.enable();await s2.prepare(a);await s2.enable();
 d1.store.getItem('adc_v08');d2.store.getItem('adc_v08');d1.store.setItem('adc_v08',profile('Equipo 1'));d2.store.setItem('adc_v08',profile('Equipo 2'));await s2.run();await s1.run();
 assert.equal(s1.state().status,'conflict');assert.equal(cloud.rows.get(a+'/adc_v08').payload.raw,profile('Equipo 2'));assert.equal(d1.store.getItem('adc_v08'),profile('Equipo 1'));
 s1.resolve('adc_v08','local');await s1.run();assert.equal(s1.state().status,'saved');assert.equal(cloud.rows.get(a+'/adc_v08').revision,3);assert.equal(cloud.rows.get(a+'/adc_v08').payload.raw,profile('Equipo 1'));assert.ok(Object.keys(d1.localStorage).some(key=>key.includes(':backup:')));
});
test('Sincronización: fallos de red y verificación no anuncian éxito; los borrados usan tombstone',async()=>{
 const cloud=server(),d=device(),sync=d.factory.create({store:d.store,remote:cloud});await sync.prepare(a);d.store.setItem('adc_v08',profile('Ana'));cloud.offline=true;await sync.enable();assert.equal(sync.state().status,'error');assert.equal(d.store.metadata().migrationComplete,undefined);assert.equal(d.store.entries()[0].dirty,true);
 cloud.offline=false;await sync.run();assert.equal(sync.state().status,'saved');d.store.removeItem('adc_v08');await sync.run();assert.equal(cloud.rows.get(a+'/adc_v08').deleted,true);
 const bad=server(),d2=device(),s2=d2.factory.create({store:d2.store,remote:bad});await s2.prepare(a);d2.store.setItem('adc_v08',profile('No confirmado'));const put=bad.put.bind(bad);bad.put=async(...args)=>{const row=await put(...args);bad.offline=true;return row};await s2.enable();assert.equal(s2.state().status,'error');assert.equal(d2.store.metadata().migrationComplete,undefined);assert.equal(d2.store.getItem('adc_v08'),profile('No confirmado'));
});
test('Sincronización: carrera entre lectura y escritura, error de esquema y cambio de cuenta',async()=>{
 const cloud=server(),d=device(),sync=d.factory.create({store:d.store,remote:cloud});await sync.prepare(a);d.store.setItem('adc_v08',profile('Local'));
 let once=true;const put=cloud.put.bind(cloud);cloud.put=async(owner,key,raw,rev)=>{if(once){once=false;await put(owner,key,profile('Otro dispositivo'),rev)}return put(owner,key,raw,rev)};
 await sync.enable();assert.equal(sync.state().status,'conflict');assert.equal(d.store.getItem('adc_v08'),profile('Local'));
 const foreign={list:async()=>[{owner_id:b,record_key:'adc_v08',schema_version:1,revision:1,payload:{raw:profile('Ajeno')},deleted:false}],put};const s2=d.factory.create({store:d.store,remote:foreign});await s2.prepare(a);assert.equal(s2.state().status,'error');assert.equal(d.store.getItem('adc_v08'),profile('Local'));
 let release;const waiting={list:()=>new Promise(resolve=>release=resolve),put};const s3=d.factory.create({store:d.store,remote:waiting});const task=s3.prepare(a);s3.stop();d.store.bind(b);release([]);await task;assert.equal(d.store.getItem('adc_v08'),null);
});
test('Almacenamiento: dos pestañas conservan candidatos en vez de sobrescribir y no migran solas',()=>{
 const d=device({'adc-auth-local-owner':a,adc_v08:profile('Anterior')});d.store.getItem('adc_v08');const other=device({},a);other.c.localStorage=d.localStorage; // Instanciar otra vista sobre el mismo Storage real.
 const c={...d.c,window:null,adcUserStorage:undefined,sessionStorage:new Storage({'adc-account-context':a})};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/servicios/almacenamiento-usuario.js'),'utf8'),c);
 c.adcUserStorage.getItem('adc_v08');d.store.setItem('adc_v08',profile('Pestaña 1'));assert.throws(()=>c.adcUserStorage.setItem('adc_v08',profile('Pestaña 2')),/Otra pestaña/);assert.equal(d.store.getItem('adc_v08'),profile('Pestaña 1'));assert.equal(d.store.candidates()[0].value,profile('Pestaña 2'));
 d.store.stageLegacy();assert.ok(d.store.candidates().some(row=>row.value===profile('Anterior')));const count=d.store.candidates().length;d.store.stageLegacy();assert.equal(d.store.candidates().length,count);assert.equal(d.localStorage.getItem('adc_v08'),profile('Anterior'));
});
test('Arranque: si falta el adaptador en modo real, no hay fallback a claves compartidas',()=>{
 const c={adcConfig:{authMode:'supabase'},document:{documentElement:{classList:{add(){}}}}};c.window=c;vm.createContext(c);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/interfaz/inicio-local.js'),'utf8'),c);
 assert.equal(c.adcUserStorage.getItem('adc_v08'),null);assert.throws(()=>c.adcUserStorage.setItem('adc_v08','x'),/almacenamiento privado/);
});
test('Almacenamiento: una falla de cuota no confirma guardado ni reemplaza el original',()=>{
 const d=device({'adc-auth-local-owner':a,adc_v08:profile('Original')});const events=[];d.c.dispatchEvent=event=>events.push(event.detail);
 d.localStorage.setItem=()=>{throw Error('QuotaExceededError')};assert.throws(()=>d.store.setItem('adc_v08',profile('Nuevo')),/QuotaExceededError/);
 assert.equal(d.store.getItem('adc_v08'),profile('Original'));assert.equal(events[0].type,'storage-error');assert.match(events[0].message,/no está confirmado/);
});
