// Entorno LOCAL descartable. No lee .env ni contacta servicios externos.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
const root=path.resolve(__dirname,'..');
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
const tokens=ids.map((id,i)=>`fixture-local-${i}-${id}`);
const user=id=>({id,aud:'authenticated',role:'authenticated',email:id===ids[0]?'ana@example.test':'bruno@example.test',app_metadata:{},user_metadata:{}});
function session(index){return {access_token:tokens[index],refresh_token:tokens[index],expires_at:Math.floor(Date.now()/1000)+86400,expires_in:86400,token_type:'bearer',user:user(ids[index])};}
async function createSandbox(){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated;insert into auth.users values('${ids[0]}'),('${ids[1]}');`);
 await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/202611140001_adc_user_records.sql'),'utf8'));
 let queue=Promise.resolve();
 function queryAs(id,sql,args=[]){
  const task=queue.then(()=>db.transaction(async tx=>{
   await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);return (await tx.query(sql,args)).rows;
  }));queue=task.catch(()=>{});return task;
 }
 const server=http.createServer(async(req,res)=>{
  // Sólo loopback: ni red local, ni orígenes externos, ni archivos privados.
  const address=server.address(),origin=`http://127.0.0.1:${address.port}`;
  const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data,(_,v)=>typeof v==='bigint'?Number(v):v));};
  if(![new URL(origin).host,`localhost:${address.port}`].includes(req.headers.host))return json({message:'Host no permitido'},403);
  if(req.headers.origin&&! [origin,`http://localhost:${address.port}`].includes(req.headers.origin))return json({message:'Origen no permitido'},403);
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'");
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,origin).pathname);}catch{return json({message:'Ruta inválida'},400);}
  try{
   if(pathname==='/sandbox-session.js'){
    const index=new URL(req.url,origin).searchParams.get('account')==='b'?1:0;
    const seed={nombre:index?'Prueba, Bruno':'Prueba, Ana',apellidos:'Prueba',nombres:index?'Bruno':'Ana',inst:[]};
    res.setHeader('Content-Type','application/javascript');return res.end(`localStorage.setItem('adc-supabase-auth',${JSON.stringify(JSON.stringify(session(index)))});if(!localStorage.getItem('sandbox-seeded')){localStorage.setItem('adc_v08',${JSON.stringify(JSON.stringify(seed))});localStorage.setItem('adc-auth-local-owner',${JSON.stringify(ids[index])});localStorage.setItem('sandbox-seeded','true');}location.replace('/index.html');`);
   }
   if(pathname==='/sandbox-account'){
    const account=new URL(req.url,origin).searchParams.get('account')==='b'?'b':'a';
    res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(`<title>Cuenta ficticia ADC</title><script src="/sandbox-session.js?account=${account}"></script>`);
   }
   if(pathname==='/assets/datos/config-publica.js'){
    res.setHeader('Content-Type','application/javascript');return res.end('window.adcConfig=Object.freeze('+JSON.stringify({authMode:'supabase',supabaseUrl:origin,supabaseAnonKey:'sb_publishable_sandbox_local_only',googleAuthEnabled:false,environment:'sandbox-local'})+');');
   }
   if(pathname.startsWith('/auth/v1/')||pathname.startsWith('/rest/v1/')){
    const token=(req.headers.authorization||'').replace(/^Bearer /,'');let index=tokens.indexOf(token);
    let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>9*1024*1024)return json({message:'Solicitud demasiado grande'},413);}
    const body=text?JSON.parse(text):{};
    if(pathname==='/auth/v1/token'){index=tokens.indexOf(body.refresh_token);return index<0?json({message:'Sólo cuentas ficticias'},401):json(session(index));}
    if(index<0)return json({message:'Sesión ficticia requerida'},401);
    const id=ids[index];
    if(pathname==='/auth/v1/user')return json(user(id));
    if(pathname==='/auth/v1/logout'){res.writeHead(204);return res.end();}
    if(pathname==='/rest/v1/adc_tester_profiles')return json({id,display_name:'Prueba local',created_at:'2026-01-01',updated_at:'2026-01-01'});
    if(pathname==='/rest/v1/adc_user_records'&&req.method==='GET'){
     const params=new URL(req.url,origin).searchParams;
     // La identidad se aplica en PostgreSQL mediante RLS, no por el filtro HTTP.
     const requested=(params.get('owner_id')||'eq.'+id).replace(/^eq\./,'');
     const after=(params.get('record_key')||'gt.').replace(/^gt\./,'');
     return json(await queryAs(id,'select * from public.adc_user_records where owner_id=$1 and record_key>$2 order by record_key limit 200',[requested,after]));
    }
    if(pathname==='/rest/v1/rpc/adc_sync_put'&&req.method==='POST')return json((await queryAs(id,'select * from public.adc_sync_put($1,$2,$3,$4)',[body.p_key,body.p_raw,body.p_expected_revision,body.p_schema_version||1]))[0]);
    return json({message:'Ruta no disponible en el sandbox'},404);
   }
   if(req.method!=='GET')return json({message:'Método no permitido'},405);
   if(pathname==='/'||pathname==='/sandbox'){
    res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ADC · Prueba aislada de sincronización</title><style>body{font:18px system-ui;max-width:800px;margin:60px auto;padding:20px;background:#eef3fa;color:#14263e}a{display:block;background:#2453a3;color:white;padding:18px;margin:16px 0;border-radius:10px}li{margin:14px 0}</style><h1>ADC · Prueba aislada</h1><p><strong>Sin conexión a Supabase de producción.</strong> Cuentas ficticias y PostgreSQL en memoria. No ingreses información real.</p><a href="/sandbox-account?account=a">Entrar como Ana · Cuenta A</a><a href="/sandbox-account?account=b">Entrar como Bruno · Cuenta B</a><ol><li>Entrá como Ana y autorizá la importación en «Mis datos / sincronización».</li><li>Abrí esta misma dirección en otro perfil de Chrome o en incógnito y entrá como Ana: debe recuperar el perfil.</li><li>Entrá como Bruno: no debe ver los datos de Ana.</li><li>Probá editar simultáneamente y revisar el conflicto antes de elegir una versión.</li></ol><p>Los datos remotos de prueba desaparecen al detener el servidor. Los borradores locales quedan sólo en este origen y perfil de navegador. Para repetir desde cero usá un perfil limpio.</p></html>`);
   }
   const segments=pathname.split(/[\\/]/).filter(Boolean);
   if(segments.some(s=>s.startsWith('.')||['node_modules','tools','tests','supabase','materiales'].includes(s.toLowerCase())))return json({message:'Archivo privado'},403);
   const file=path.resolve(root,'.'+pathname),ext=path.extname(file).toLowerCase();
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.pdf':'application/pdf','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.wasm':'application/wasm'};
   if(!types[ext]||!file.startsWith(root+path.sep))return json({message:'Archivo no permitido'},403);
   const real=await fs.promises.realpath(file);if(!real.toLowerCase().startsWith(root.toLowerCase()+path.sep))return json({message:'Archivo no permitido'},403);
   res.setHeader('Content-Type',types[ext]);res.end(await fs.promises.readFile(real));
  }catch(error){json({code:error.code||'SANDBOX_ERROR',message:error.message},error.code==='40001'?409:500);}
 });
 return {server,close:async()=>{if(server.listening)await new Promise(resolve=>server.close(resolve));await queue;await db.close();}};
}
if(require.main===module)createSandbox().then(({server})=>server.listen(8877,'127.0.0.1',()=>console.log('ADC sandbox aislado: http://127.0.0.1:8877/ · detener: Ctrl+C'))).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={createSandbox,ids,tokens};
