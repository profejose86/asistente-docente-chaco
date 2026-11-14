// Administración sólo local; configuración y salida separadas de producción.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {readEnv,publicConfig}=require('./env.cjs');
const {authSettings}=require('./supabase-auth-settings.cjs');
const settings=require('../config/sincronizacion-staging.json');
const root=path.resolve(__dirname,'..'),stateFile=path.join(root,settings.localStateFile);
function readState(){return fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):{};}
function saveState(value){fs.writeFileSync(stateFile+'.tmp',JSON.stringify(value,null,2)+'\n',{mode:0o600});fs.renameSync(stateFile+'.tmp',stateFile);}
function assertIsolated(ref,production=readEnv(root)){
 const excluded=[production.SUPABASE_PROJECT_REF];
 try{excluded.push(new URL(production.SUPABASE_URL).hostname.split('.')[0]);}catch{}
 const live=fs.readFileSync(path.join(root,'assets/datos/config-publica.js'),'utf8');
 if(!/^[a-z]{20}$/.test(ref||'')||excluded.includes(ref)||live.includes('https://'+ref+'.supabase.co'))throw Error('Bloqueado: referencia inválida o pertenece a producción.');
 return ref;
}
function management(){
 const token=readEnv(root).SUPABASE_ACCESS_TOKEN;
 if(!token)throw Error('Falta SUPABASE_ACCESS_TOKEN en .env.local. Guardalo allí; no lo envíes al chat.');
 return async(route,method='GET',body)=>{
  const r=await fetch('https://api.supabase.com/v1'+route,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});
  if(!r.ok)throw Error('Supabase Management HTTP '+r.status+' en '+route+'; no se modificó producción.');
  return r.status===204?null:r.json();
 };
}
function stagingAuthOptions(env,previous={}){
 const scoped={ADC_SITE_URL:settings.siteUrl,ADC_EMAIL_CONFIRMATIONS_REQUIRED:'false'};
 for(const key of ['HOST','PORT','USER','PASSWORD','SENDER_EMAIL','SENDER_NAME'])if(env['ADC_STAGING_SMTP_'+key])scoped['SMTP_'+key]=env['ADC_STAGING_SMTP_'+key];
 const patch=authSettings(scoped,previous,false);
 const callbacks=[...patch.uri_allow_list.split(','),new URL('ADC_Ingreso_Editable',settings.siteUrl).href,new URL('ADC_Ingreso_Editable?flow=recovery',settings.siteUrl).href];
 patch.uri_allow_list=[...new Set(callbacks)].join(',');
 const id=env.ADC_STAGING_GOOGLE_CLIENT_ID,secret=env.ADC_STAGING_GOOGLE_CLIENT_SECRET;
 if(Boolean(id)!==Boolean(secret))throw Error('Completá ambas credenciales OAuth de staging antes de habilitar Google.');
 if(id){if(!id.endsWith('.apps.googleusercontent.com'))throw Error('Client ID OAuth de Google inválido.');Object.assign(patch,{external_google_enabled:true,external_google_client_id:id,external_google_secret:secret});}
 return {patch,googleEnabled:!!id||previous.external_google_enabled===true,passwordRecoveryEnabled:!!scoped.SMTP_HOST||!!(previous.smtp_host&&previous.smtp_admin_email)};
}
async function provision(){
 const request=management(),state=readState();
 if(!state.ref){
  const organizations=await request('/organizations'),slug=readEnv(root).SUPABASE_ORGANIZATION_SLUG;
  const org=slug?organizations.find(o=>o.slug===slug):organizations.length===1?organizations[0]:null;
  if(!org)throw Error('Indicá SUPABASE_ORGANIZATION_SLUG en .env.local para elegir la organización.');
  const details=await request('/organizations/'+encodeURIComponent(org.slug));
  if(details.plan!=='free')throw Error('Sólo se permite crear staging en una organización Free; no se habilitan cargos.');
  const projects=await request('/projects'),matches=projects.filter(p=>p.name===settings.projectName&&(p.organization_slug===org.slug||p.organization_id===org.id));
  if(matches.length>1)throw Error('Nombre duplicado: revisar proyectos antes de crear.');
  if(state.creationPending&&!matches.length)throw Error('Creación anterior incierta: revisar el panel antes de reintentar.');
  let project=matches[0];
  if(!project){
   state.dbPassword=crypto.randomBytes(32).toString('base64url');state.creationPending=true;saveState(state);
   project=await request('/projects','POST',{name:settings.projectName,organization_slug:org.slug,db_pass:state.dbPassword,region:settings.region,plan:'free'});
  }
  state.ref=assertIsolated(project.ref||project.id);state.creationPending=false;saveState(state);
 }
 const ref=assertIsolated(state.ref),project=await request('/projects/'+ref);
 if(project.name!==settings.projectName)throw Error('El proyecto no coincide con el staging autorizado.');
 if(project.status!=='ACTIVE_HEALTHY')return {ref,status:project.status,ready:false};
 const api=(route,method,body)=>request('/projects/'+ref+route,method,body),query=sql=>api('/database/query','POST',{query:sql});
 for(const [table,file]of [['adc_tester_profiles','202611130001_adc_tester_profiles.sql'],['adc_user_records','202611140001_adc_user_records.sql']]){
  const existing=await query(`select to_regclass('public.${table}') is not null as exists`);
  if(!existing[0]?.exists)await query(fs.readFileSync(path.join(root,'supabase/migrations',file),'utf8'));
 }
 await query(fs.readFileSync(path.join(root,'supabase/migrations/202611140002_adc_sync_conflict_http.sql'),'utf8'));
 const rows=await query("select c.relname,c.relrowsecurity,c.relforcerowsecurity,(select count(*)::int from pg_policies p where p.tablename=c.relname and p.schemaname='public') as policies from pg_class c where c.oid in ('public.adc_tester_profiles'::regclass,'public.adc_user_records'::regclass)");
 if(rows.length!==2||rows.some(r=>!r.relrowsecurity||!r.relforcerowsecurity||r.policies!==4))throw Error('RLS de staging no verificada.');
 const keys=await api('/api-keys'),all=Array.isArray(keys)?keys:keys.keys||keys.api_keys||[],key=all.find(k=>k.type==='publishable')||all.find(k=>k.name==='anon');
 state.publicKey=key?.api_key||key?.key;if(!state.publicKey)throw Error('Falta clave pública de staging.');
 publicConfig({ADC_AUTH_MODE:'supabase',SUPABASE_URL:'https://'+ref+'.supabase.co',SUPABASE_ANON_KEY:state.publicKey});
 const auth=stagingAuthOptions(readEnv(root),await api('/config/auth'));
 await api('/config/auth','PATCH',{...auth.patch,disable_signup:false});
 state.googleEnabled=auth.googleEnabled;state.passwordRecoveryEnabled=auth.passwordRecoveryEnabled;
 state.ready=true;saveState(state);return {ref,ready:true,rls:true,productionUntouched:true};
}
async function prepare(){
 const state=readState(),ref=assertIsolated(state.ref);if(!state.ready)throw Error('Primero configurar y verificar Supabase de staging.');
 const target=path.join(root,'.adc-tools/sync-staging-site'),dist=path.join(target,'dist');
 fs.mkdirSync(dist,{recursive:true});fs.cpSync(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});
 for(const file of ['index.html','ADC_Ingreso_Editable.html'])fs.copyFileSync(path.join(root,file),path.join(dist,file));
 const config=publicConfig({ADC_AUTH_MODE:'supabase',SUPABASE_URL:'https://'+ref+'.supabase.co',SUPABASE_ANON_KEY:state.publicKey,ADC_EMAIL_CONFIRMATIONS_REQUIRED:'false',ADC_GOOGLE_AUTH_ENABLED:String(state.googleEnabled===true),ADC_PASSWORD_RECOVERY_ENABLED:String(state.passwordRecoveryEnabled===true)});
 config.environment='sync-staging';
 fs.writeFileSync(path.join(dist,'assets/datos/config-publica.js'),'window.adcConfig=Object.freeze('+JSON.stringify(config)+');\n');
 fs.writeFileSync(path.join(dist,'build-info.json'),JSON.stringify({branch:'pruebas/sincronizacion',environment:'sync-staging',siteUrl:settings.siteUrl}));
 const banner='<div role="note" style="background:#fff1cc;color:#4b3300;padding:10px;text-align:center">ADC · STAGING AISLADO · Usar sólo datos ficticios</div>';
 for(const file of ['index.html','ADC_Ingreso_Editable.html']){const p=path.join(dist,file);fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/(<body\b[^>]*>)/i,'$1'+banner));}
 const env=readEnv(root),secrets=[env.SUPABASE_ACCESS_TOKEN,env.ADC_STAGING_GOOGLE_CLIENT_SECRET,env.ADC_STAGING_SMTP_PASSWORD,state.dbPassword,...Object.values(state.accounts||{}).map(v=>v.password)].filter(Boolean);
 function check(dir){for(const item of fs.readdirSync(dir)){const p=path.join(dir,item);if(fs.lstatSync(p).isSymbolicLink())throw Error('No publicar enlaces simbólicos');if(fs.statSync(p).isDirectory())check(p);else{const bytes=fs.readFileSync(p);if(secrets.some(s=>bytes.includes(Buffer.from(s))))throw Error('Secreto detectado en paquete');}}}check(dist);
 fs.writeFileSync(path.join(target,'package.json'),JSON.stringify({name:'adc-sync-staging',version:'1.0.0',private:true}));
 return {directory:target,siteUrl:settings.siteUrl,ref};
}
if(require.main===module)(process.argv.includes('--provision')?provision():prepare()).then(v=>console.log(JSON.stringify(v))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={assertIsolated,provision,prepare,stagingAuthOptions};
