const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(runtime,'playwright')),{PDFDocument}=require(path.join(runtime,'pdf-lib'));
test('Interinos: PDF original, VPI, MNC, ACC1 y revisión de coherencia aislada',{timeout:120000},async()=>{
 const output=path.join(root,'.adc-tools/interinos');fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,decodeURIComponent(url.pathname.slice(5)));
  if(!url.pathname.startsWith('/adc/')||!file.startsWith(root+path.sep))return res.writeHead(404).end();
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1100},acceptDownloads:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https:\/\//,r=>r.abort());await page.route('**/assets/datos/ajustes-pagina.json',r=>r.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
  await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`);
  for(const [id,value] of Object.entries({perfilApellidos:'Pérez',perfilNombres:'Ana María',dni:'30123456',perfilNacimiento:'25/10/1986',perfilCelular:'3624539175',correo:'ana@example.com'}))await page.locator('#'+id).fill(value);
  await page.evaluate(()=>localStorage.setItem('adc_v08',JSON.stringify(data())));
  const open=async(id='interinos')=>{await page.evaluate(()=>tab('tramites'));await page.locator(`.adc-form-catalog [data-adc-official-form="${id}"]`).click()};await open();
  const field=k=>page.locator(`[data-adc-field="${k}"]`),review=page.locator('.adc-interinos-review'),action=k=>page.locator(`[data-adc-official-action="${k}"]`);
  assert.equal(await page.locator('[data-adc-official-title]').innerText(),'SOLICITUD DE INSCRIPCION DE DOCENTES INTERINOS Y SUPLENTES CON EXPECTATIVAS\nFORMULARIO');
  assert.equal(await field('apellido').inputValue(),'Pérez');assert.equal(await field('fechaNacimiento').inputValue(),'1986-10-25');assert.equal(await field('celular').inputValue(),'3624539175');
  assert.equal(await page.locator('#adcOfficialForm').getAttribute('data-adc-smart-viewer'),'true');assert.equal(await review.isVisible(),true);assert.match(await review.innerText(),/No verifican la identidad/);
  for(const name of ['preview','download','print']){assert.equal(await action(name).count(),2);for(const b of await action(name).all())assert.equal(await b.locator('svg').count(),1)}
  for(const name of ['save','clear'])assert.equal(await page.locator(`[data-adc-draft-action="${name}"]`).count(),2);
  await action('preview').first().click();assert.equal(await page.locator('[data-adc-official-preview] iframe').count(),0);assert.ok(await review.locator('[data-severity=blocking]').count()>=2);
  await field('fecha').fill('2026-11-16');await field('titular').locator('xpath=self::*[@value="Sí"]').check();await field('lugar').fill('Resistencia');
  await field('apellido').fill('Pérez de Gómez');await page.waitForFunction(()=>document.querySelector('[data-adc-profile-conflicts]').children.length===1);
  await review.getByRole('button',{name:'Mantener solo en este formulario'}).click();assert.equal(await page.locator('#perfilApellidos').inputValue(),'Pérez');assert.equal(await field('apellido').inputValue(),'Pérez de Gómez');
  await field('dni').fill('123');await action('preview').first().click();assert.ok(await review.locator('[data-severity=blocking]').count());
  await field('dni').fill('30123456');await field('telefono').fill('');await page.locator('[data-adc-mnc=telefono]').click();assert.equal(await field('telefono').isEditable(),false);
  await field('documentacion.0.documento').fill('Copia de DNI');await field('documentacion.0.observacion').fill('Adjunta');
  await page.waitForFunction(()=>document.querySelector('.adc-interinos-review').dataset.pendingCount==='0');
  await page.evaluate(()=>{window.draws=[];const original=PDFLib.PDFPage.prototype.drawText;PDFLib.PDFPage.prototype.drawText=function(text,o){draws.push({text,x:o.x,y:o.y,size:o.size});return original.call(this,text,o)}});
  const download=page.waitForEvent('download');await action('download').first().click();await(await download).saveAs(path.join(output,'completado.pdf'));
  const pdf=await PDFDocument.load(fs.readFileSync(path.join(output,'completado.pdf')));assert.equal(pdf.getPageCount(),1);assert.ok(Math.abs(pdf.getPage(0).getHeight()-841.92)<.01);const draws=await page.evaluate(()=>window.draws.splice(0));
  const zoom=page.locator('.adc-pdf-navigation input');await zoom.evaluate(el=>{el.value='200';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await action('preview').last().click();await page.waitForSelector('[data-adc-official-preview] iframe');assert.deepEqual(await page.evaluate(()=>window.draws.splice(0)),draws);
  await page.evaluate(()=>window.open=()=>({addEventListener(event,cb){cb()},print(){window.printCalled=true}}));await action('print').first().click();await page.waitForFunction(()=>window.printCalled);assert.deepEqual(await page.evaluate(()=>window.draws.splice(0)),draws);
  await page.locator('[data-adc-draft-action=save]').first().click();await page.reload();await open();assert.equal(await field('apellido').inputValue(),'Pérez de Gómez');assert.equal(await field('documentacion.0.observacion').inputValue(),'Adjunta');assert.equal(await field('telefono').isEditable(),false);
  const saved=await page.evaluate(()=>localStorage.getItem('adc-official-form-interinos-draft-v1'));
  await page.locator('[data-adc-draft-action=clear]').first().click();await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('adc-official-form-interinos-draft-v1')),saved);
  await page.evaluate(()=>{window.realStore=adcUserStorage;window.adcUserStorage={...realStore,setItem(){throw Error('Cuota simulada')}}});await page.locator('[data-adc-draft-action=save]').last().click();assert.match(await page.locator('[data-adc-draft-status]').first().textContent(),/No se pudo guardar/);await page.evaluate(()=>window.adcUserStorage=realStore);
  const profile=await page.evaluate(()=>localStorage.getItem('adc_v08'));await page.evaluate(()=>localStorage.setItem('adc-official-form-form-3-draft-v1','{"values":{"apellido":"Otro borrador"}}'));
  await page.locator('[data-adc-draft-action=clear]').last().click();await page.getByRole('button',{name:'Sí, limpiar formulario',exact:true}).click();assert.equal(await field('apellido').inputValue(),'Pérez');assert.equal(await field('documentacion.0.documento').inputValue(),'');assert.equal(await field('telefono').isEditable(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('adc_v08')),profile);assert.match(await page.evaluate(()=>localStorage.getItem('adc-official-form-form-3-draft-v1')),/Otro borrador/);
  await page.reload();await open();assert.equal(await field('fecha').inputValue(),'');
  for(const width of [320,390,1500]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(width<900){const toggle=review.locator('.adc-interinos-review-toggle');assert.equal(await toggle.getAttribute('aria-expanded'),'false');await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');await review.locator('[data-review-key=fecha]').getByRole('button',{name:'Ir al campo'}).click();assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await field('fecha').evaluate(el=>el===document.activeElement),true);await toggle.click();await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    await toggle.evaluate(el=>{el.dispatchEvent(new TouchEvent('touchstart',{touches:[new Touch({identifier:1,target:el,clientY:600})]}));el.dispatchEvent(new TouchEvent('touchend',{changedTouches:[new Touch({identifier:1,target:el,clientY:500})]}))});assert.equal(await toggle.getAttribute('aria-expanded'),'true');await review.getByRole('button',{name:'Cerrar revisión ×'}).click();
    if(width===390){
     await page.locator('.adc-pdf-navigation [data-viewer-action=width]').click();const viewport=page.locator('#adcOfficialForm .adc-document-viewport');await viewport.scrollIntoViewIfNeeded();const box=await viewport.boundingBox(),x=box.x+25,y=box.y+100,session=await page.context().newCDPSession(page),before=Number(await zoom.inputValue());
     await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y-30,id:1},{x,y:y+30,id:2}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-50,id:1},{x,y:y+50,id:2}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(Number(await zoom.inputValue())>before);await session.detach();
     await page.locator('#adcOfficialForm').screenshot({path:path.join(output,'movil.png')});
    }
   }
  }
  for(const theme of ['light','dark']){await page.locator('html').evaluate((el,t)=>el.dataset.theme=t,theme);await page.locator('#adcOfficialForm').screenshot({path:path.join(output,theme+'.png')})}
  await open('bd07');assert.equal(await review.isVisible(),false);assert.equal(await page.locator('[data-adc-draft-action=save]').first().isVisible(),false);await open();assert.equal(await review.isVisible(),true);
  await open();assert.equal(await review.count(),1);assert.equal(await page.locator('.adc-interinos-workspace').count(),1);
  await page.locator('.adc-pdf-navigation [data-viewer-action=fullscreen]').click();assert.equal(await page.evaluate(()=>Boolean(document.fullscreenElement)),true);await page.locator('.adc-pdf-navigation [data-viewer-action=fullscreen]').click();
  await page.evaluate(()=>localStorage.setItem('adc-official-form-interinos-draft-v1',JSON.stringify({schemaVersion:2,values:{apellido:'Apellido histórico',fecha:'16/11/2026',firma:'Firma anterior conservada',declaracion:'Declaración histórica', 'documentacion.4.documento':'Quinto documento','documentacion.4.observacion':'Corregido'},touched:['apellido'],rowCounts:{documentacion:5}})));
  await open();assert.equal(await field('apellido').inputValue(),'Apellido histórico');assert.equal(await field('fecha').inputValue(),'2026-11-16');assert.equal(await field('documentacion.4.documento').inputValue(),'Quinto documento');assert.equal(await field('documentacion.4.observacion').inputValue(),'Corregido');assert.match(await page.locator('[data-adc-official-notices]').innerText(),/Firma anterior conservada|Declaración histórica/);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/formularios/Interinos-Expectativas.pdf'))).digest('hex'),'a851f81274e3b0bd9299e36ee4e6fadaaeb746f3d430a9490ceae00c88ba09df');assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
