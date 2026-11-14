const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {createBridge}=require('../tools/local-editor-bridge.cjs'),contract=require('../assets/js/editor/ajustes-proyecto-datos.js');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'..');
test('Chrome: guardar texto con un clic, recargar desde fuente, proteger concurrencia y ocultar editor online',async()=>{
 const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'adc-editor-ui-'));fs.mkdirSync(path.join(workspace,'assets/datos'),{recursive:true});
 const target=path.join(workspace,'assets/datos/ajustes-pagina.json');fs.writeFileSync(target,JSON.stringify(contract.empty()));
 const app=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const file=req.url.split('?')[0]==='/assets/datos/ajustes-pagina.json'?target:path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);});
 });
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.address().port;
 const bridge=createBridge({root:workspace,origins:[base]});await new Promise(resolve=>bridge.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext();context.setDefaultTimeout(15000);
  // El puerto fijo público del cliente se redirige al puente efímero del test.
  await context.route('http://localhost:3005/**',async route=>{
   const request=route.request();const response=await fetch('http://127.0.0.1:'+bridge.address().port+new URL(request.url()).pathname,{method:request.method(),headers:{Origin:base,'Content-Type':'application/json',...(request.headers()['x-adc-editor-token']?{'X-ADC-Editor-Token':request.headers()['x-adc-editor-token']}: {})},...(request.postData()?{body:request.postData()}: {})});
   await route.fulfill({status:response.status,headers:{'Access-Control-Allow-Origin':base,'Access-Control-Allow-Headers':'Content-Type, X-ADC-Editor-Token','Content-Type':'application/json'},body:await response.text()});
  });
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/ADC_Ingreso_Editable.html');await require('./support/ajustes.cjs').clickGear(page);
  await page.locator('#adcLoginTitle').click();await page.locator('#adcDesignFormatting summary').click();await page.locator('#adcDesignText').fill('Bienvenido a ADC');await page.locator('[data-act=text]').click();
  await page.locator('[data-commit-local]').click();await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('Guardado local completo'));
  const saved=JSON.parse(fs.readFileSync(target));assert.ok(saved.pages.ingreso.operations.some(op=>op.kind==='text'&&op.html==='Bienvenido a ADC'));assert.deepEqual(saved.pages.pagina,contract.empty().pages.pagina);
  const fresh=await context.newPage();await fresh.goto(base+'/ADC_Ingreso_Editable.html');await fresh.waitForFunction(()=>document.querySelector('#adcLoginTitle').textContent==='Bienvenido a ADC');
  await require('./support/ajustes.cjs').clickGear(fresh);await fresh.locator('[data-commit-local]').click();await fresh.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('ya tiene estos ajustes'));
  const changed=JSON.parse(fs.readFileSync(target));changed.pages.ingreso.operations.push({kind:'style',target:'project:#adcLoginTitle',color:'#abcdef'});fs.writeFileSync(target,JSON.stringify(changed));
  await page.locator('[data-commit-local]').click();await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('Recargá y revisá'));assert.deepEqual(JSON.parse(fs.readFileSync(target)),changed);
  await page.route('https://adc-online.example/**',async route=>{const relative=new URL(route.request().url()).pathname;const response=await fetch(base+relative);await route.fulfill({status:response.status,headers:{'Content-Type':response.headers.get('content-type')},body:Buffer.from(await response.arrayBuffer())});});
  await page.goto('https://adc-online.example/ADC_Ingreso_Editable.html');assert.equal(await page.locator('#adcDesignGear').isVisible(),false);assert.equal(await page.locator('[data-commit-local]').count(),0);assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>bridge.close(resolve));await new Promise(resolve=>app.close(resolve));fs.rmSync(workspace,{recursive:true,force:true});}
});
