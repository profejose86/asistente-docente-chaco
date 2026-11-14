// Prueba real exclusiva de staging. Crea únicamente dos identidades ficticias.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {assertIsolated}=require('./sync-staging.cjs');
const root=path.resolve(__dirname,'..'),file=path.join(root,'.env.sync-staging.local');
async function verify(){
 const state=JSON.parse(fs.readFileSync(file,'utf8')),ref=assertIsolated(state.ref),base='https://'+ref+'.supabase.co';
 if(!state.ready)throw Error('Staging no preparado');
 const save=()=>{fs.writeFileSync(file+'.tmp',JSON.stringify(state,null,2)+'\n',{mode:0o600});fs.renameSync(file+'.tmp',file);};
 async function api(route,{token,body,method=body?'POST':'GET',status=200,headers={}}={}){
  console.log('Verificando staging: '+method+' '+route.split('?')[0]);
  const r=await fetch(base+route,{method,headers:{apikey:state.publicKey,Authorization:'Bearer '+(token||state.publicKey),'Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
  const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=text}
  if(r.status!==status)throw Error('Staging HTTP '+r.status+' (esperado '+status+') en '+route.split('?')[0]+'; código '+(data?.code||data?.error_code||'desconocido'));
  return data;
 }
 state.accounts||={};const sessions={};
 for(const [key,name]of [['a','Ana'],['b','Bruno']]){
  let account=state.accounts[key];
  if(!account){account=state.accounts[key]={email:'adc.sync.'+key+'.'+crypto.randomBytes(5).toString('hex')+'@example.com',password:crypto.randomBytes(24).toString('base64url'),name};save();
   const result=await api('/auth/v1/signup',{body:{email:account.email,password:account.password}});
   if(!result.access_token)throw Error('Registro sin sesión: verificar confirmación de correo sólo en staging');
  }
  const session=await api('/auth/v1/token?grant_type=password',{body:{email:account.email,password:account.password}});sessions[key]=session;account.id=session.user.id;save();
  await api('/rest/v1/adc_tester_profiles',{token:session.access_token,body:{id:account.id,display_name:name+' (prueba ficticia)'},status:201,headers:{Prefer:'resolution=ignore-duplicates'}});
 }
 const a=sessions.a,b=sessions.b;
 const list=(session,owner=session.user.id)=>api('/rest/v1/adc_user_records?select=*&owner_id=eq.'+owner,{token:session.access_token});
 const put=(session,key,raw,revision,status=200)=>api('/rest/v1/rpc/adc_sync_put',{token:session.access_token,status,body:{p_key:key,p_raw:raw,p_expected_revision:revision,p_schema_version:1}});
 for(const [key,session]of Object.entries(sessions)){
  const rows=await list(session),prior=rows.find(r=>r.record_key==='adc_v08');
  const raw=JSON.stringify({nombre:'Prueba, '+state.accounts[key].name,apellidos:'Prueba',nombres:state.accounts[key].name,inst:[]});
  if(!prior)await put(session,'adc_v08',raw,0);
  else if(prior.payload.raw!==raw)await put(session,'adc_v08',raw,Number(prior.revision));
 }
 assert.deepEqual(await list(b,a.user.id),[]);
 assert.deepEqual(await list(a,b.user.id),[]);
 await api('/rest/v1/adc_user_records',{token:b.access_token,status:403,body:{owner_id:a.user.id,record_key:'adc-official-form-intrusion-draft-v1',payload:{raw:'{}'}}});
 for(const method of ['PATCH','DELETE'])assert.deepEqual(await api('/rest/v1/adc_user_records?owner_id=eq.'+a.user.id,{token:b.access_token,method,...(method==='PATCH'?{body:{payload:{raw:'intrusion'}}}:{}),headers:{Prefer:'return=representation'}}),[]);
 const key='adc-official-form-online-check-'+crypto.randomBytes(4).toString('hex')+'-draft-v1';
 await put(a,key,'{"values":{"motivo":"prueba ficticia"}}',0);
 await put(a,key,'{"values":{"motivo":"versión antigua"}}',0,409);
 const row=await put(a,key,null,1),deleted=Array.isArray(row)?row[0]:row;assert.equal(deleted.deleted,true);
 const loaded=await list(a);assert.equal(JSON.parse(loaded.find(r=>r.record_key==='adc_v08').payload.raw).nombres,'Ana');
 assert.equal(JSON.parse((await list(b)).find(r=>r.record_key==='adc_v08').payload.raw).nombres,'Bruno');
 const result={environment:'sync-staging',ref,passed:['registro y login de dos cuentas ficticias','perfil recuperado desde sesión nueva','RLS lectura cruzada bloqueada','RLS inserción ajena bloqueada','RLS edición y borrado ajenos bloqueados','conflicto CAS detectado','tombstone verificado'],productionUntouched:true};
 fs.mkdirSync(path.join(root,'.adc-tools'),{recursive:true});fs.writeFileSync(path.join(root,'.adc-tools/sync-staging-verification.json'),JSON.stringify(result,null,2));return result;
}
if(require.main===module)verify().then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={verify};
