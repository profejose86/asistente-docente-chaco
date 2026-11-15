const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'..'),a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
const user=id=>({id,aud:'authenticated',role:'authenticated',email:id===a?'a@example.test':'b@example.test',app_metadata:{},user_metadata:{}});
const session=id=>({access_token:[Buffer.from('{"alg":"HS256"}').toString('base64url'),Buffer.from(JSON.stringify({sub:id,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'test'].join('.'),refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user:user(id)});
test('Sync en Chrome y SDK: consentimiento, dos dispositivos, conflicto, red y cambio de cuenta',{timeout:120000},async()=>{
 const server=http.createServer((req,res)=>{if(require('./support/demo-config.cjs').serve(req,res))return;const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data)})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});
 const rows=new Map(),writes=[],errors=[];let offline=false,holdUser=false,releaseUser,holdRecords=false,releaseRecords;
 const raw=JSON.stringify({nombre:'Gomez, Jose',apellidos:'Gomez',nombres:'Jose',dni:'12345678',sexo:'M',perfilDJ:{domicilio:'Domicilio privado'},inst:[]});
 async function pageFor(id,seed={}){
  const context=await browser.newContext(),page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({s,seed})=>{if(!localStorage.getItem('fixture-seeded')){for(const [k,v]of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('adc-supabase-auth',JSON.stringify(s));localStorage.setItem('fixture-seeded','true')}},{s:session(id),seed});
  await page.route('**/assets/datos/config-publica.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.adcConfig='+JSON.stringify({authMode:'supabase',supabaseUrl:'https://adc-sync-test.supabase.co',supabaseAnonKey:'sb_publishable_test',googleAuthEnabled:false})}));
  await page.route('https://adc-sync-test.supabase.co/**',async r=>{
   const req=r.request(),url=new URL(req.url());let owner;try{owner=JSON.parse(Buffer.from(req.headers().authorization.split(' ')[1].split('.')[1],'base64url')).sub}catch{}
   const json=(body,status=200)=>r.fulfill({status,contentType:'application/json',json:body});
   if(url.pathname.endsWith('/user')){if(holdUser){holdUser=false;await new Promise(resolve=>releaseUser=resolve)}return json(user(owner))}
   if(url.pathname.endsWith('/logout'))return r.fulfill({status:204});
   if(url.pathname==='/rest/v1/adc_tester_profiles')return json({id:owner,display_name:'',created_at:'2026-01-01',updated_at:'2026-01-01'});
   if(offline)return json({message:'Sin conexion de prueba'},503);
   if(url.pathname==='/rest/v1/adc_user_records'){
    if(holdRecords){holdRecords=false;await new Promise(resolve=>releaseRecords=resolve)}
    assert.equal(url.searchParams.get('owner_id'),'eq.'+owner);return json([...rows.values()].filter(row=>row.owner_id===owner));
   }
   if(url.pathname==='/rest/v1/rpc/adc_sync_put'){
    const body=req.postDataJSON(),key=owner+'/'+body.p_key,prior=rows.get(key);assert.ok([a,b].includes(owner));
    if((prior?.revision||0)!==body.p_expected_revision)return json({code:'40001',message:'ADC_SYNC_CONFLICT'},409);
    const row={owner_id:owner,record_key:body.p_key,schema_version:1,revision:(prior?.revision||0)+1,payload:{raw:body.p_raw},deleted:body.p_raw===null};rows.set(key,row);writes.push({owner,...body});return json(row);
   }
   return json({message:'Ruta inesperada'},500);
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);await page.waitForSelector('#adcSessionBar');return page;
 }
 async function authorize(page){
  await page.locator('#adcProfileBtn').click();
  await page.locator('#adcSessionBar').getByRole('button',{name:'Mis datos / sincronización',exact:true}).click();
  if(!await page.locator('#adcSyncConsent').isVisible())await page.locator('#adcSyncPanel summary').click();
  await page.locator('#adcSyncConsent').check();await page.getByRole('button',{name:'Autorizar e importar los datos compatibles',exact:true}).click();
 }
 try{
  const p1=await pageFor(a,{'adc-auth-local-owner':a,adc_v08:raw,'adc-sc01-borrador-v1':'{"motivo":"dato medico ficticio"}'});
  assert.equal(writes.length,0);assert.match(await p1.locator('#adcSyncPanel').textContent(),/información médica/);
  await p1.getByRole('button',{name:'Ahora no; conservar sólo localmente',exact:true}).click();assert.equal(writes.length,0);assert.equal(await p1.evaluate(()=>localStorage.getItem('adc_v08')),raw);
  await authorize(p1);await p1.waitForFunction(()=>adcSyncUI.engine.state().status==='saved');assert.equal(await p1.evaluate(()=>localStorage.getItem('adc_v08')),raw);
  await p1.getByRole('button',{name:'Abrir los datos importados / recargar',exact:true}).click();await p1.waitForSelector('#adcSessionBar');
  const originalWrites=writes.length,p2=await pageFor(a);assert.equal(await p2.evaluate(()=>adcUserStorage.getItem('adc_v08')),raw);assert.equal(writes.length,originalWrites);assert.equal(await p2.locator('#perfilApellidos').inputValue(),'Gomez');
  await authorize(p2);await p2.waitForFunction(()=>adcSyncUI.engine.state().status==='saved');
  // El borrador de incapacidad viaja por el mismo repositorio de cuenta.
  await p1.evaluate(()=>tab('tramites'));
  await p1.locator('.adc-form-catalog [data-adc-official-form=incapacidad]').click();
  await p1.locator('[data-adc-field=ministerio]').fill('Ministerio recuperado en otro dispositivo');
  await p1.waitForFunction(()=>adcSyncUI.engine.state().status==='saved');
  assert.match(rows.get(a+'/adc-official-form-incapacidad-draft-v1').payload.raw,/Ministerio recuperado en otro dispositivo/);
  await p2.evaluate(()=>adcSyncUI.engine.run());
  await p2.reload();await p2.waitForSelector('#adcSessionBar');
  await p2.evaluate(()=>tab('tramites'));
  await p2.locator('.adc-form-catalog [data-adc-official-form=incapacidad]').click();
  assert.equal(await p2.locator('[data-adc-field=ministerio]').inputValue(),'Ministerio recuperado en otro dispositivo');
  await p1.evaluate(()=>adcSyncUI.engine.disable());await p2.evaluate(()=>adcSyncUI.engine.disable());
  await p1.evaluate(()=>{const d=JSON.parse(adcUserStorage.getItem('adc_v08'));d.apellidos='Equipo Uno';d.nombre='Equipo Uno, Jose';adcUserStorage.setItem('adc_v08',JSON.stringify(d))});
  await p2.evaluate(()=>{const d=JSON.parse(adcUserStorage.getItem('adc_v08'));d.apellidos='Equipo Dos';d.nombre='Equipo Dos, Jose';adcUserStorage.setItem('adc_v08',JSON.stringify(d))});
  await p1.evaluate(()=>adcSyncUI.engine.enable());await p1.waitForFunction(()=>adcSyncUI.engine.state().status==='saved');
  await p2.evaluate(()=>adcSyncUI.engine.enable());await p2.waitForFunction(()=>adcSyncUI.engine.state().status==='conflict');assert.match(await p2.locator('#adcSyncPanel').textContent(),/Versiones diferentes/);assert.match(rows.get(a+'/adc_v08').payload.raw,/Equipo Uno/);
  await p2.evaluate(()=>adcSyncUI.engine.resolve('adc_v08','remote'));await p2.reload();await p2.waitForSelector('#adcSessionBar');assert.match(await p2.locator('#perfilApellidos').inputValue(),/Equipo Uno/);
  offline=true;await p2.evaluate(()=>{adcUserStorage.setItem('adc-sc01-borrador-v1','{"motivo":"sin red"}');return adcSyncUI.engine.run()});assert.equal(await p2.evaluate(()=>adcSyncUI.engine.state().status),'error');assert.match(await p2.evaluate(()=>adcUserStorage.getItem('adc-sc01-borrador-v1')),/sin red/);
  offline=false;await p2.evaluate(()=>adcSyncUI.engine.run());assert.equal(await p2.evaluate(()=>adcSyncUI.engine.state().status),'saved');
  await p1.evaluate(s=>localStorage.setItem('adc-supabase-auth',JSON.stringify(s)),session(b));await p1.reload();await p1.waitForSelector('#adcSessionBar');assert.equal(await p1.evaluate(()=>adcUserStorage.scope()),b);assert.equal(await p1.evaluate(()=>adcUserStorage.getItem('adc-sc01-borrador-v1')),null);assert.equal(await p1.locator('#perfilApellidos').inputValue(),'');assert.equal(await p1.evaluate(()=>localStorage.getItem('adc_v08')),raw);
  // Cambiar la credencial persistida mientras se verifica A no debe enviar
  // el documento de A con el JWT nuevo de B (petición fijada por operación).
  holdUser=true;
  const pending=p2.evaluate(id=>adcAuth.syncRecords.put(id,'adc-official-form-sync-test-draft-v1','{"values":{}}',0),a);
  while(!releaseUser)await new Promise(resolve=>setTimeout(resolve,10));
  await p2.evaluate(s=>localStorage.setItem('adc-supabase-auth',JSON.stringify(s)),session(b));releaseUser();
  const saved=await pending;assert.equal(saved.owner_id,a);assert.equal(rows.has(b+'/adc-official-form-sync-test-draft-v1'),false);
  // La identidad cambia mientras el guard está leyendo datos de A. Ninguna
  // continuación antigua puede levantar la guardia y mostrar A bajo B.
  await p1.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>new MutationObserver(()=>{
   const owner=JSON.parse(localStorage.getItem('adc-supabase-auth')||'null')?.user?.id;
   if(owner&&window.adcUserStorage?.scope()!==owner&&!document.documentElement.classList.contains('adc-auth-pending'))sessionStorage.setItem('fixture-guard-leak','true');
  }).observe(document.documentElement,{attributes:true,attributeFilter:['class']})));
  holdRecords=true;await p1.evaluate(s=>localStorage.setItem('adc-supabase-auth',JSON.stringify(s)),session(a));
  await p1.reload({waitUntil:'domcontentloaded'});while(!releaseRecords)await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(await p1.locator('html').evaluate(n=>n.classList.contains('adc-auth-pending')),true);
  await p1.evaluate(s=>localStorage.setItem('adc-supabase-auth',JSON.stringify(s)),session(b));releaseRecords();
  await p1.waitForSelector('#adcSessionBar');assert.equal(await p1.evaluate(()=>adcUserStorage.scope()),b);assert.equal(await p1.locator('#perfilApellidos').inputValue(),'');assert.equal(await p1.evaluate(()=>sessionStorage.getItem('fixture-guard-leak')),null);
  assert.ok(writes.every(req=>req.owner===a));assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
