const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'),{chromium}=require(path.join(runtime,'playwright'));
test('MD-01 local editable: VPI y conservación semántica del borrador histórico',{timeout:120000},async()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'adc-md01-vpi-'));
 const server=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,decodeURIComponent(pathname.slice(5)));
  if(!pathname.startsWith('/adc/')||!file.startsWith(root+path.sep))return res.writeHead(404).end();
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https:\/\//,r=>r.abort());await page.route('**/assets/datos/ajustes-pagina.json',r=>r.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
  await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`);
  const draft='{"schemaVersion":2,"values":{"apellido":"Borrador ficticio","movimientos.7.codigoCargo":"999"},"rowCounts":{"movimientos":8},"marked":["observaciones"]}';
  await page.evaluate(value=>{localStorage.setItem('adc-official-form-md01-draft-v1',value);localStorage.setItem('adc-official-form-cf01-draft-v1','otro borrador');},draft);
  const open=async id=>{await page.evaluate(()=>tab('tramites'));await page.locator(`.adc-form-catalog [data-adc-official-form="${id}"]`).click()};await open('md01');
  const assertHistoricalDraft=async()=>{
   const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('adc-official-form-md01-draft-v1'))),historical=JSON.parse(draft);
   for(const [key,value] of Object.entries(historical.values))assert.deepEqual(saved.values[key],value,`Dato histórico conservado: ${key}`);
   assert.deepEqual(saved.rowCounts,historical.rowCounts);assert.deepEqual(saved.marked,historical.marked);
   assert.equal(await page.locator('[data-adc-field="apellido"]').inputValue(),historical.values.apellido);
   assert.equal(await page.locator('[data-adc-field="movimientos.7.codigoCargo"]').inputValue(),'999');
   assert.equal(await page.evaluate(()=>localStorage.getItem('adc-official-form-cf01-draft-v1')),'otro borrador');
  };
  await assertHistoricalDraft();
  const frame=page.locator('.adc-pdf-viewer'),viewport=frame.locator('.adc-document-viewport'),nav=frame.locator('.adc-pdf-navigation'),icon=frame.locator('.adc-pdf-floating-fullscreen');
  const action=name=>nav.locator(`[data-viewer-action="${name}"]`),setZoom=async value=>nav.locator('input').evaluate((el,n)=>{el.value=String(n);el.dispatchEvent(new Event('input',{bubbles:true}))},value);
  await page.waitForFunction(()=>document.querySelector('.adc-prepared-background')?.naturalWidth>0);
  assert.equal(await page.locator('#adcOfficialForm').getAttribute('data-adc-document-mode'),'overlay');assert.ok(await page.locator('[data-adc-field]').count()>0);assert.equal(await page.locator('[data-adc-mnc=observaciones]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.adc-interinos-review').count(),0);
  assert.equal(await page.locator('[data-adc-draft-action=save]:visible').count(),0);assert.equal(await frame.locator('.adc-pdf-scroll').isVisible(),false);
  assert.equal(await page.evaluate(()=>Boolean(adcPreparedPdfForms.md01.exitFullscreenOnBack)),false);
  await setZoom(200);await action('in').click();assert.equal(await nav.locator('input').inputValue(),'200');await setZoom(25);await action('out').click();assert.equal(await nav.locator('input').inputValue(),'25');await setZoom(100);
  await viewport.hover({position:{x:12,y:100}});await page.mouse.wheel(0,-100);assert.ok(Number(await nav.locator('input').inputValue())>100);
  await setZoom(200);await viewport.evaluate(el=>{el.scrollTop=240;el.scrollLeft=180});const before=await viewport.evaluate(el=>[el.scrollTop,el.scrollLeft]),bounds=await viewport.boundingBox();await page.mouse.move(bounds.x+12,bounds.y+100);await page.mouse.down();await page.mouse.move(bounds.x+52,bounds.y+150,{steps:5});await page.mouse.up();const after=await viewport.evaluate(el=>[el.scrollTop,el.scrollLeft]);assert.ok(after[0]<before[0]&&after[1]<before[1]);await setZoom(100);
  await icon.focus();await icon.press('Enter');assert.equal(await frame.evaluate(el=>document.fullscreenElement===el),true);await icon.click();assert.equal(await page.evaluate(()=>Boolean(document.fullscreenElement)),false);
  await frame.evaluate(el=>el.requestFullscreen=undefined);await viewport.dblclick({position:{x:12,y:100}});assert.equal(await frame.evaluate(el=>el.classList.contains('adc-pdf-expanded')),true);await viewport.dblclick({position:{x:12,y:100}});assert.equal(await frame.evaluate(el=>el.classList.contains('adc-pdf-expanded')),false);await icon.click();await page.keyboard.press('Escape');assert.equal(await frame.evaluate(el=>el.classList.contains('adc-pdf-expanded')),false);
  const original=fs.readFileSync(path.join(root,'assets/formularios/MD-01.pdf'));
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});await viewport.hover({position:{x:12,y:100}});await action('width').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);if(width<650){await icon.tap();assert.equal(await frame.evaluate(el=>el.classList.contains('adc-pdf-expanded')),true);await icon.tap();assert.equal(await frame.evaluate(el=>el.classList.contains('adc-pdf-expanded')),false)}for(const theme of ['light','dark']){await page.locator('html').evaluate((el,t)=>el.dataset.theme=t,theme);await frame.screenshot({path:path.join(output,`vpi-${width}-${theme}.png`)})}}
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await icon.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  await page.reload();await open('md01');await assertHistoricalDraft();
  await open('incapacidad');assert.equal(await icon.isVisible(),true);await open('md01');assert.equal(await icon.count(),1);assert.equal(await page.locator('.adc-pdf-viewer').count(),1);
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'e28ec2b53445bbfa20b04d48b399281534b76d4114e89ec368be47a0036b874a');assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
