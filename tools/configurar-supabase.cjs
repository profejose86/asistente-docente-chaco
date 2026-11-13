// Herramienta administrativa local. Nunca se incluye ni se importa en el navegador.
const fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto');
const {readEnv,publicConfig}=require('./env.cjs');
const {build}=require('./build.cjs');
const {authSettings}=require('./supabase-auth-settings.cjs');
const root=path.resolve(__dirname,'..');
function management(token){
 if(!token)throw Error('Falta SUPABASE_ACCESS_TOKEN en .env.local. No lo pegues en el chat.');
 return async(endpoint,method='GET',body)=>{
  const response=await fetch('https://api.supabase.com/v1'+endpoint,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('La API de Supabase devolvió HTTP '+response.status+'. Revisá el token, sus permisos y el estado del proyecto.');
  return response.status===204?null:response.json();
 };
}
async function createProject(options={}){
 const env=options.env||readEnv(root),request=options.request||management(env.SUPABASE_ACCESS_TOKEN),write=options.write||writeLocal,name='Asistente Docente Chaqueño - Staging';
 if(env.SUPABASE_PROJECT_REF){const existing=await request('/projects/'+encodeURIComponent(env.SUPABASE_PROJECT_REF));return {project:existing.ref||existing.id,status:existing.status,created:false};}
 let organizations=await request('/organizations');
 if(!organizations.length)organizations=[await request('/organizations','POST',{name:'Asistente Docente Chaqueño'})];
 const organization=env.SUPABASE_ORGANIZATION_SLUG?organizations.find(org=>org.slug===env.SUPABASE_ORGANIZATION_SLUG):organizations.length===1?organizations[0]:null;
 if(!organization)throw Error('Elegí la organización con SUPABASE_ORGANIZATION_SLUG; hay más de una disponible.');
 const details=await request('/organizations/'+encodeURIComponent(organization.slug));
 if(details.plan!=='free')throw Error('Esta herramienta sólo crea el staging en una organización Free. No se habilitaron cargos.');
 const projects=await request('/projects');
 const existing=projects.filter(project=>project.name===name&&(project.organization_slug===organization.slug||project.organization_id===organization.id));
 if(existing.length>1)throw Error('Hay más de un staging con ese nombre. Seleccioná su referencia sin crear duplicados.');
 if(existing.length){const project=existing[0];write({SUPABASE_PROJECT_REF:project.ref||project.id,SUPABASE_ORGANIZATION_SLUG:organization.slug});return {project:project.ref||project.id,status:project.status,created:false};}
 const password=crypto.randomBytes(32).toString('base64url');
 write({SUPABASE_DB_PASSWORD:password,SUPABASE_ORGANIZATION_SLUG:organization.slug});
 const project=await request('/projects','POST',{name,organization_slug:organization.slug,db_pass:password,region:'sa-east-1',plan:'free'});
 const ref=project.ref||project.id;if(!/^[a-z]{20}$/.test(ref))throw Error('Revisá el panel: la API no devolvió una referencia de proyecto reconocida. No repitas la creación sin comprobarlo.');
 write({SUPABASE_PROJECT_REF:ref});return {project:ref,status:project.status,created:true};
}
function validPolicies(rows){
 const expected={adc_tester_select_own:'SELECT',adc_tester_insert_own:'INSERT',adc_tester_update_own:'UPDATE',adc_tester_delete_own:'DELETE'};
 const own=expression=>String(expression||'').toLowerCase().replace(/as\s+uid/g,'').replace(/[\s()]/g,'')==='selectauth.uid=id';
 const authenticatedOnly=roles=>roles==='{authenticated}'||Array.isArray(roles)&&roles.length===1&&roles[0]==='authenticated';
 return rows.length===4&&rows.every(row=>row.cmd===expected[row.policyname]&&row.permissive==='PERMISSIVE'&&authenticatedOnly(row.roles)&&
  (row.cmd==='INSERT'?row.qual===null&&own(row.with_check):row.cmd==='UPDATE'?own(row.qual)&&own(row.with_check):own(row.qual)&&row.with_check===null));
}
function writeLocal(values){
 const file=path.join(root,'.env.local');let text=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
 for(const [key,value] of Object.entries(values)){
  if(/[\r\n]/.test(value))throw Error('Valor de configuración inválido.');
  const line=key+'='+value,re=new RegExp('^'+key+'=.*$','m');text=re.test(text)?text.replace(re,line):text+'\n'+line;
 }
 fs.writeFileSync(file,text.trimEnd()+'\n',{mode:0o600});
}
async function configure({apply=false,online=false}={}){
 const env=readEnv(root),ref=env.SUPABASE_PROJECT_REF,token=env.SUPABASE_ACCESS_TOKEN;
 if(!token||!ref)throw Error('Faltan SUPABASE_ACCESS_TOKEN y SUPABASE_PROJECT_REF en .env.local. No los pegues en el chat.');
 if(!/^[a-z]{20}$/.test(ref))throw Error('SUPABASE_PROJECT_REF no es una referencia válida.');
 const request=management(token),api=(endpoint,method,body)=>request('/projects/'+ref+endpoint,method,body);
 const query=sql=>api('/database/query','POST',{query:sql});
 const url='https://'+ref+'.supabase.co';
 if(env.SUPABASE_URL&&env.SUPABASE_URL.replace(/\/$/,'')!==url)throw Error('La URL local pertenece a otro proyecto. Revisá la referencia antes de aplicar.');
 const before=await query("select to_regclass('public.adc_tester_profiles') is not null as exists");
 if(!apply)return {project:ref,tableExists:before[0]?.exists===true,applied:false};
 if(!before[0]?.exists)await query(fs.readFileSync(path.join(root,'supabase/migrations/202611130001_adc_tester_profiles.sql'),'utf8'));
 const verification=await query("select c.relrowsecurity as rls,c.relforcerowsecurity as forced,(select count(*)::int from pg_policies where schemaname='public' and tablename='adc_tester_profiles' and policyname in ('adc_tester_select_own','adc_tester_insert_own','adc_tester_update_own','adc_tester_delete_own')) as policies from pg_class c where c.oid='public.adc_tester_profiles'::regclass");
 const policies=await query("select policyname,cmd,roles,permissive,qual,with_check from pg_policies where schemaname='public' and tablename='adc_tester_profiles'");
 if(!verification[0]?.rls||!verification[0]?.forced||verification[0]?.policies!==4||!validPolicies(policies))throw Error('El esquema existente no coincide con las políticas previstas. No se reseteó ni se modificó automáticamente.');
 const keys=await api('/api-keys');
 const rows=Array.isArray(keys)?keys:keys.keys||keys.api_keys||[];
 const selected=rows.find(key=>key.type==='publishable')||rows.find(key=>key.name==='anon');
 const key=selected?.api_key||selected?.key;if(!key)throw Error('No se encontró la clave pública. Copiá la publishable/anon desde Connect.');
 publicConfig({ADC_AUTH_MODE:'supabase',SUPABASE_URL:url,SUPABASE_ANON_KEY:key});
 const previousAuth=await api('/config/auth');
 const settings=authSettings(env,previousAuth,online);
 await api('/config/auth','PATCH',settings);
 writeLocal({SUPABASE_URL:url,SUPABASE_ANON_KEY:key,ADC_AUTH_MODE:'supabase',ADC_SITE_URL:settings.site_url});
 await build();
 return {project:ref,rls:true,policies:4,applied:true};
}
if(require.main===module)(process.argv.includes('--create-project')?createProject():configure({apply:process.argv.includes('--apply'),online:process.argv.includes('--online')})).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={configure,validPolicies,createProject};
