// QA del artefacto de staging con Chrome y Supabase REAL, sin mocks de red.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const {assertIsolated}=require('./sync-staging.cjs');
async function run(){
 const root=path.resolve(__dirname,'..'),state=JSON.parse(fs.readFileSync(path.join(root,'.env.sync-staging.local'),'utf8'));assertIsolated(state.ref);
 const dist=path.join(root,'.adc-tools/sync-staging-site/dist'),server=http.createServer((req,res)=>{
  const file=path.resolve(dist,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(dist+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(error,bytes)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.pdf':'application/pdf'})[path.extname(file)]||'application/octet-stream');res.end(bytes);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
 try{
  async function login(key){const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/ADC_Ingreso_Editable.html');
   const account=state.accounts[key];await page.evaluate(async({email,password})=>{await adcAuth.signIn(email,password)},account);
   await page.goto(base+'/index.html');await page.waitForSelector('#adcSessionBar',{timeout:30000});return page;
  }
  const a=await login('a');assert.equal(await a.locator('#perfilNombres').inputValue(),'Ana');assert.equal(await a.evaluate(()=>adcUserStorage.scope()),state.accounts.a.id);
  const second=await login('a');assert.equal(await second.locator('#perfilNombres').inputValue(),'Ana');
  await a.locator('#adcSessionBar').getByRole('button',{name:'Mis datos / sincronización',exact:true}).click();
  if(!await a.locator('#adcSyncConsent').isVisible())await a.locator('#adcSyncPanel summary').click();
  await a.locator('#adcSyncConsent').check();await a.getByRole('button',{name:'Autorizar e importar los datos compatibles',exact:true}).click();
  await a.waitForFunction(()=>adcSyncUI.engine.state().status==='saved');
  await a.evaluate(()=>{const p=JSON.parse(adcUserStorage.getItem('adc_v08'));p.nombres='Ana prueba online';p.nombre='Prueba, Ana prueba online';adcUserStorage.setItem('adc_v08',JSON.stringify(p));});
  await a.evaluate(()=>adcSyncUI.engine.run());
  await a.waitForFunction(()=>adcSyncUI.engine.state().status==='saved');
  await second.reload();await second.waitForSelector('#adcSessionBar');assert.equal(await second.locator('#perfilNombres').inputValue(),'Ana prueba online');
  await a.evaluate(()=>{const p=JSON.parse(adcUserStorage.getItem('adc_v08'));p.nombres='Ana';p.nombre='Prueba, Ana';adcUserStorage.setItem('adc_v08',JSON.stringify(p));});
  await a.evaluate(()=>adcSyncUI.engine.run());
  await a.waitForFunction(()=>adcSyncUI.engine.state().status==='saved');await second.reload();await second.waitForSelector('#adcSessionBar');assert.equal(await second.locator('#perfilNombres').inputValue(),'Ana');
  const b=await login('b');assert.equal(await b.locator('#perfilNombres').inputValue(),'Bruno');assert.equal(await b.evaluate(()=>adcUserStorage.scope()),state.accounts.b.id);
  await second.screenshot({path:path.join(root,'.adc-tools/sync-staging-ana-real.png')});await b.screenshot({path:path.join(root,'.adc-tools/sync-staging-bruno-real.png')});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:['Chrome y cliente ADC contra Auth real','perfil A desde dos contextos limpios','consentimiento y cambio guardado/recuperado en segunda sesión','perfil B aislado','sin errores JavaScript'],note:'Artefacto de publicación servido localmente; conexiones Auth/REST reales al staging.'}));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
if(require.main===module)run().catch(error=>{console.error(error.message);process.exitCode=1;});
