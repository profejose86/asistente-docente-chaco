const {test}=require('node:test'),assert=require('node:assert/strict');
const {createSandbox,ids,tokens}=require('../tools/sync-sandbox.cjs');
test('Sandbox en Chrome: importación autorizada, segundo dispositivo y cuenta B aislada',{timeout:90000},async()=>{
 const path=require('node:path'),os=require('node:os');
 const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
 const sandbox=await createSandbox();await new Promise(resolve=>sandbox.server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+sandbox.server.address().port,browser=await chromium.launch({channel:'chrome',headless:true});
 const failures=[];
 async function open(account){const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>failures.push(e.message));await page.goto(base+'/sandbox-account?account='+account);await page.waitForSelector('#adcSessionBar');return page;}
 try{
  const first=await open('a');await first.locator('#adcSyncConsent').check();
  await first.getByRole('button',{name:'Autorizar e importar los datos compatibles',exact:true}).click();
  await first.waitForFunction(()=>adcSyncUI.engine.state().status==='saved');
  await first.getByRole('button',{name:'Abrir los datos importados / recargar',exact:true}).click();await first.waitForSelector('#adcSessionBar');
  // Un dispositivo limpio no necesita datos legados: se autentica con el fixture
  // de A pero no pasa por la pantalla que crea el perfil local de ejemplo.
  const secondContext=await browser.newContext(),second=await secondContext.newPage();
  await second.goto(base+'/sandbox');await second.evaluate(s=>localStorage.setItem('adc-supabase-auth',s),await first.evaluate(()=>localStorage.getItem('adc-supabase-auth')));
  await second.goto(base+'/index.html');await second.waitForSelector('#adcSessionBar');assert.equal(await second.locator('#perfilNombres').inputValue(),'Ana');
  assert.equal(await first.locator('#adcInicio').isVisible(),true);await first.locator('#tabP').click();
  await first.locator('#perfilNombres').fill('Anabella');
  assert.equal(await first.evaluate(()=>JSON.parse(adcUserStorage.getItem('adc_v08')).nombres),'Anabella');
  assert.equal(await first.evaluate(()=>adcSyncUI.engine.state().status),'pending');
  // Recargar inmediatamente, antes del debounce remoto, no pierde la edición.
  await first.reload();await first.waitForSelector('#adcSessionBar');assert.equal(await first.locator('#perfilNombres').inputValue(),'Anabella');
  await first.waitForFunction(()=>adcSyncUI.engine.state().status==='saved');
  await second.reload();await second.waitForSelector('#adcSessionBar');assert.equal(await second.locator('#perfilNombres').inputValue(),'Anabella');
  await first.locator('#tabP').click();
  await first.locator('#correo').fill('anabella@example.test');await first.locator('#correo').blur();
  await first.waitForFunction(()=>adcSyncUI.engine.state().status==='saved');
  await second.reload();await second.waitForSelector('#adcSessionBar');assert.equal(await second.locator('#correo').inputValue(),'anabella@example.test');
  await second.screenshot({path:path.join(__dirname,'../.adc-tools/sync-ana-segundo-dispositivo.png'),fullPage:false});
  const other=await open('b');assert.equal(await other.locator('#perfilNombres').inputValue(),'Bruno');assert.equal(await other.evaluate(()=>adcUserStorage.scope()),ids[1]);
  await other.screenshot({path:path.join(__dirname,'../.adc-tools/sync-bruno-aislado.png'),fullPage:false});
  assert.deepEqual(failures,[]);
 }finally{await browser.close();await sandbox.close();}
});
test('Sandbox aislado: configuración local, RLS real y CAS sin producción',async()=>{
 const sandbox=await createSandbox();await new Promise(resolve=>sandbox.server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+sandbox.server.address().port;
 const api=(route,index=0,body)=>fetch(base+route,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+tokens[index],'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 try{
  const config=await (await fetch(base+'/assets/datos/config-publica.js')).text();assert.ok(config.includes(base));assert.ok(!config.includes('.supabase.co'));
  assert.equal((await fetch(base+'/.env.local')).status,403);
  assert.equal((await fetch(base+'/sandbox',{headers:{Origin:'https://external.example'}})).status,403);
  assert.match((await fetch(base+'/')).headers.get('content-security-policy'),/connect-src 'self'/);
  const draft={p_key:'adc_v08',p_raw:'{"inst":[],"nombres":"Ana"}',p_expected_revision:0,p_schema_version:1};
  let response=await api('/rest/v1/rpc/adc_sync_put',0,draft);assert.equal(response.status,200);assert.equal((await response.json()).owner_id,ids[0]);
  response=await api('/rest/v1/adc_user_records?owner_id=eq.'+ids[0],1);assert.deepEqual(await response.json(),[]);
  response=await api('/rest/v1/rpc/adc_sync_put',1,{...draft,p_raw:'{"inst":[],"nombres":"Bruno"}'});assert.equal((await response.json()).owner_id,ids[1]);
  response=await api('/rest/v1/rpc/adc_sync_put',0,draft);assert.equal(response.status,409);
  response=await api('/rest/v1/adc_user_records?owner_id=eq.'+ids[0]);assert.equal((await response.json())[0].payload.raw,draft.p_raw);
 }finally{await sandbox.close();}
});
