const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),modules=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(modules,'playwright')),{PDFDocument}=require(path.join(modules,'pdf-lib'));
test('Descuento por Seguro: original, selección múltiple, borrador y PDF bajo prefijo',{timeout:120000},async()=>{
 const output=path.join(root,'.adc-tools/descuento-seguro');fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,decodeURIComponent(pathname.slice(5)));
  if(!pathname.startsWith('/adc/')||!file.startsWith(root+path.sep))return res.writeHead(404).end();
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https:\/\//,r=>r.abort());await page.route('**/assets/datos/ajustes-pagina.json',r=>r.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
  await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`);
  await page.locator('#perfilApellidos').fill('Pérez');await page.locator('#perfilNombres').fill('Juan Pablo');await page.locator('#dni').fill('30123456');
  await page.evaluate(()=>{inst=[{id:1,name:'EES N° 83',entries:[]},{id:2,name:'EES N° 12',entries:[]}];localStorage.setItem('adc_v08',JSON.stringify(data()))});
  const open=async()=>{await page.evaluate(()=>tab('tramites'));await page.locator('.adc-form-catalog [data-adc-official-form=seguro-descuento]').click()};await open();
  const field=key=>page.locator(`[data-adc-field="${key}"]`);
  assert.equal(await page.locator('[data-adc-official-title]').innerText(),'Solicitud de Descuento por Seguro');
  assert.equal(await page.locator('.adc-form-catalog [data-adc-official-form=seguro-descuento] strong').innerText(),'Solicitud de Descuento por Seguro');
  assert.equal(await page.locator('#adcOfficialForm').getAttribute('data-adc-document-mode'),'overlay');
  assert.equal(await field('apellido').inputValue(),'Pérez');assert.equal(await field('nombres').inputValue(),'Juan Pablo');assert.equal(await field('firmaDirector').count(),0);
  const schoolList=await field('escuela').getAttribute('list');assert.ok(schoolList);assert.deepEqual(await page.locator(`#${schoolList} option`).evaluateAll(options=>options.map(o=>o.value)),['EES N° 83','EES N° 12']);
  await field('escuela').fill('EES N° 12');await field('escuela').press('Tab');assert.equal(await field('escuela').inputValue(),'EES N° 12');
  for(const [key,value] of Object.entries({fecha:'2026-11-16',destinatario:'Dirección de Administración',escuela:'83',lugar:'Resistencia',fechaFirma:'2026-11-16'}))await field(key).fill(value);
  const familiar=field('seguros').locator('xpath=self::*[@value="Seguro de vida familiar"]'),colectivo=field('seguros').locator('xpath=self::*[@value="Seguro de vida colectivo"]');
  await familiar.click();assert.equal(await familiar.isChecked(),true);await familiar.click();assert.equal(await familiar.isChecked(),false);
  await colectivo.click();assert.equal(await familiar.isChecked(),false);assert.equal(await colectivo.isChecked(),true);await colectivo.click();assert.equal(await colectivo.isChecked(),false);
  assert.notEqual(await familiar.evaluate(el=>getComputedStyle(el).borderStyle),'none');
  await familiar.check();await field('destinatario').fill('');await page.locator('[data-adc-mnc=destinatario]').click();
  const frame=page.locator('.adc-pdf-viewer'),viewport=frame.locator('.adc-document-viewport'),nav=frame.locator('.adc-pdf-navigation');
  const action=name=>nav.locator(`[data-viewer-action="${name}"]`),zoom=async()=>Number(await nav.locator('input').inputValue());
  const setZoom=async n=>nav.locator('input').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))},String(n));
  assert.equal(await page.locator('#adcOfficialForm').getAttribute('data-adc-smart-viewer'),'true');
  await setZoom(100);await action('in').click();assert.equal(await zoom(),110);await action('out').click();assert.equal(await zoom(),100);
  await setZoom(200);await action('in').click();assert.equal(await zoom(),200);await setZoom(25);await action('out').click();assert.equal(await zoom(),25);
  await setZoom(150);await viewport.scrollIntoViewIfNeeded();let box=await viewport.boundingBox();await page.mouse.move(box.x+25,box.y+60);await page.mouse.wheel(0,-100);assert.ok(await zoom()>150);
  await viewport.evaluate(el=>{el.scrollTop=240;el.scrollLeft=180});const before=await viewport.evaluate(el=>[el.scrollTop,el.scrollLeft]);
  await page.mouse.move(box.x+25,box.y+60);await page.mouse.down();await page.mouse.move(box.x+65,box.y+110,{steps:5});await page.mouse.up();
  const after=await viewport.evaluate(el=>[el.scrollTop,el.scrollLeft]);assert.ok(after[0]<before[0]);assert.ok(after[1]<before[1]);
  assert.equal(await frame.locator('.adc-pdf-scroll').isVisible(),false);await viewport.focus();const keyboardBefore=await viewport.evaluate(el=>el.scrollTop);await viewport.press('PageDown');await page.waitForFunction(before=>document.querySelector('#adcOfficialForm .adc-document-viewport').scrollTop>before,keyboardBefore);
  await action('page').click();assert.ok(await page.locator('[data-adc-official-sheet]').evaluate(el=>el.getBoundingClientRect().height<=el.closest('.adc-document-viewport').clientHeight+1));
  await action('width').click();await field('apellido').scrollIntoViewIfNeeded();const oldZoom=await zoom(),inputBox=await field('apellido').boundingBox();await page.mouse.move(inputBox.x+5,inputBox.y+5);await page.mouse.wheel(0,-30);assert.equal(await zoom(),oldZoom);
  await field('apellido').fill('Pérez');assert.equal(await frame.evaluate(el=>el.classList.contains('adc-pdf-grabbing')),false);await field('apellido').press('Tab');await page.evaluate(()=>document.activeElement.blur());
  await page.mouse.move(2,2);await page.waitForTimeout(2100);assert.equal(await nav.evaluate(el=>getComputedStyle(el).opacity),'0');await nav.locator('input').focus();await page.waitForTimeout(1900);assert.equal(await nav.evaluate(el=>getComputedStyle(el).opacity),'1');
  await action('fullscreen').click();assert.equal(await frame.evaluate(el=>document.fullscreenElement===el),true);await action('fullscreen').click();
  await frame.evaluate(el=>el.requestFullscreen=undefined);await action('fullscreen').click();assert.ok(await frame.evaluate(el=>el.classList.contains('adc-pdf-expanded')));await page.keyboard.press('Escape');
  await setZoom(100);
  await page.evaluate(()=>{window.testLines=[];window.testTexts=[];const draw=PDFLib.PDFPage.prototype.drawLine;PDFLib.PDFPage.prototype.drawLine=function(o){testLines.push(o);return draw.call(this,o)};const text=PDFLib.PDFPage.prototype.drawText;PDFLib.PDFPage.prototype.drawText=function(value,o){testTexts.push({value,x:o.x,y:o.y,size:o.size});return text.call(this,value,o)}});
  const download=page.waitForEvent('download');await page.locator('[data-adc-official-action=download]').first().click();await(await download).saveAs(path.join(output,'completado.pdf'));
  const pdf=await PDFDocument.load(fs.readFileSync(path.join(output,'completado.pdf')));assert.equal(pdf.getPageCount(),1);assert.deepEqual(pdf.getPage(0).getSize(),{width:612,height:1008});assert.equal(pdf.getForm().getFields().length,0);
  const originalLines=await page.evaluate(()=>testLines.splice(0)),originalTexts=await page.evaluate(()=>testTexts.splice(0));await setZoom(200);
  const second=page.waitForEvent('download');await page.locator('[data-adc-official-action=download]').first().click();await(await second).saveAs(path.join(output,'zoom-200.pdf'));assert.deepEqual(await page.evaluate(()=>testLines.splice(0)),originalLines);
  assert.deepEqual(await page.evaluate(()=>testTexts.splice(0)),originalTexts);
  const enlarged=await PDFDocument.load(fs.readFileSync(path.join(output,'zoom-200.pdf')));assert.deepEqual(enlarged.getPage(0).getSize(),pdf.getPage(0).getSize());
  for(const button of await page.locator('[data-adc-official-action=preview]').all()){
   const old=await page.locator('[data-adc-official-preview]').evaluate(el=>el.querySelector('iframe')?.src||null);
   await button.click();await page.waitForFunction(previous=>{const el=document.querySelector('[data-adc-official-preview] iframe');return el&&el.src!==previous},old);
   assert.deepEqual(await page.evaluate(()=>testTexts.splice(0)),originalTexts);assert.deepEqual(await page.evaluate(()=>testLines.splice(0)),originalLines);
  }
  await page.evaluate(()=>{window.open=()=>({addEventListener(event,callback){callback()},print(){window.testPrint=true}})});
  await page.locator('[data-adc-official-action=print]').first().click();await page.waitForFunction(()=>window.testPrint===true);assert.deepEqual(await page.evaluate(()=>testTexts.splice(0)),originalTexts);assert.deepEqual(await page.evaluate(()=>testLines.splice(0)),originalLines);
  assert.equal(await page.evaluate(()=>testLines.some(o=>o.thickness===.8)),false);
  await colectivo.check();assert.equal(await familiar.isChecked(),true);await page.reload();await open();assert.equal(await familiar.isChecked(),true);assert.equal(await colectivo.isChecked(),true);assert.equal(await field('escuela').inputValue(),'83');assert.equal(await field('destinatario').isEditable(),false);
  assert.equal(await field('apellido').inputValue(),'Pérez');assert.equal(await field('nombres').inputValue(),'Juan Pablo');assert.equal((await field('dni').inputValue()).replace(/\D/g,''),'30123456');
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:1000});await action('width').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const bounds=await frame.boundingBox(),controls=await nav.boundingBox();assert.ok(controls.y+controls.height<=bounds.y+bounds.height+1);
   if(width===390){await setZoom(100);await viewport.scrollIntoViewIfNeeded();const b=await viewport.boundingBox(),x=b.x+25,y=b.y+100,session=await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y-30,id:1},{x,y:y+30,id:2}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-50,id:1},{x,y:y+50,id:2}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(await zoom()>100);
    await viewport.evaluate(el=>el.scrollTop=100);const start=await viewport.evaluate(el=>el.scrollTop);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y+60,id:1}]});for(let delta=10;delta<=60;delta+=10)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+60-delta,id:1}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);assert.ok(await viewport.evaluate(el=>el.scrollTop)>start);await session.detach();
    await frame.screenshot({path:path.join(output,'visor-movil.png')});
   }
  }
  await page.locator('html').evaluate(el=>el.dataset.theme='dark');await frame.screenshot({path:path.join(output,'visor-oscuro.png')});await page.locator('html').evaluate(el=>el.dataset.theme='light');
  await page.locator('#adcOfficialForm').screenshot({path:path.join(output,'lienzo.png')});
  const long='Apellido extenso '.repeat(50);await field('apellido').fill(long);await page.waitForFunction(()=>document.querySelector('[data-adc-official-status]').dataset.adcLayoutError==='true');assert.equal(await field('apellido').inputValue(),long);
  await open();await setZoom(100);await action('in').click();assert.equal(await zoom(),110);
  await page.evaluate(()=>tab('tramites'));await page.locator('.adc-form-catalog [data-adc-official-form=bd07]').click();assert.equal(await nav.isVisible(),false);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/formularios/Descuento-por-Seguro.pdf'))).digest('hex'),'57acd40a1bc5002656f0d31216dc37efcd602a0f408e74017085d806962be4c5');assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
