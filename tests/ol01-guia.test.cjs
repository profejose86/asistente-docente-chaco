const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(runtime,'playwright'));
test('OL-01: guía estricta, perfil, historial, cargos, fechas, familiar y salidas', {timeout:120000},async()=>{
 const server=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(error,bytes)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.pdf':'application/pdf'})[path.extname(file)]||'application/octet-stream');res.end(bytes)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const output=path.join(root,'.adc-tools/ol01-review');fs.mkdirSync(output,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')||r.request().url().startsWith('blob:')?r.continue():r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?adc-preview=1`);
  await page.evaluate(()=>{
   inst=[];nextId=1;addInst({name:'IES San Fernando Rey',level:'Superior',localidad:'Resistencia',entries:[{type:'cargo',cargoName:'Bedel',revista:'Titular',schedule:[1,1,1,1,1]},{type:'asignatura',subject:'Historia',year:'2',division:'1',revista:'Titular',schedule:[2,0,0,0,0]}]});
   addInst({name:'Institución de prueba',level:'Superior',localidad:'Barranqueras',entries:[{type:'cargo',cargoName:'Secretario',revista:'Interino',schedule:[1,0,0,0,0]}]});
   for(const [key,value] of Object.entries({perfilApellidos:'Prueba',perfilNombres:'Docente',dni:'12345678',sexo:'F',perfilDomicilio:'Calle de prueba 123',perfilLocalidad:'Fontana'}))$(key).value=value;
   adcOLStart(false);
  });
  assert.deepEqual(errors,[]);
  // Todas las acciones, incluso los duplicados, bloquean y enfocan sin permitir omisiones.
  for(const action of ['preview','download','print'])for(const index of [0,1]){
   await page.locator(`[data-ol-action=${action}]`).nth(index).click();
   assert.equal(await page.locator('#adcOLPreview iframe').count(),0);
   assert.equal(await page.locator('.adc-pending-card').isVisible(),true);
   assert.equal(await page.evaluate(()=>document.activeElement.name),'school');
  }
  await page.waitForTimeout(2100);
  assert.equal(await page.locator('[name=school]').evaluate(n=>n.classList.contains('adc-pending-pulse')),false);
  assert.equal(await page.locator('#adcOL [name=school]').evaluate(n=>n.classList.contains('adc-pending-field')),true);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('[data-ol-action=preview]').first().click();
  assert.equal(await page.locator('#adcOL [name=school]').evaluate(n=>getComputedStyle(n).animationName),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{
   const records=[{motivo:dj02Motivo('Enfermedad o lesión común'),unidad:inst[0].name,desde:'2026-11-20',hasta:'2026-11-20'}];
   localStorage.setItem('adc_dj02_v1',JSON.stringify({pending:[{dni:'12345678',records}]}));adcOLPick('Enfermedad o lesión común');
  });
  assert.equal(await page.locator('#adcOL [name=school]').inputValue(),'1');
  assert.equal(await page.locator('#adcOLPosts input:checked').count(),2);
  assert.equal((await page.locator('#adcOL [name=place]').inputValue()).toLowerCase(),'resistencia');
  assert.equal(await page.locator('#adcOL [name=law]').inputValue(),'111');
  await page.locator('#adcOL [name=from]').fill('2026-11-20');await page.locator('#adcOL [name=until]').fill('2026-11-20');
  // Lunes 23 no laborable -> martes 24, usando horarios de la institución.
  assert.equal(await page.locator('#adcOL [name=signDate]').inputValue(),'2026-11-24');
  await page.locator('#adcOL [name=signDate]').fill('2026-11-25');
  await page.locator('#adcOL [name=until]').fill('2026-11-24');
  assert.equal(await page.locator('#adcOL [name=signDate]').inputValue(),'2026-11-25');
  await page.evaluate(()=>{inst[0].entries[1].revista='Interino';adcOLPosts('1');adcOLSyncRule()});
  await page.locator('[data-ol-action=preview]').first().click();
  assert.match(await page.locator('.adc-pending-card').textContent(),/Encuadres distintos.*Bedel.*Historia/s);
  await page.evaluate(()=>{inst[0].entries[1].revista='Titular';adcOLPosts('1');adcOLSyncRule()});
  await page.locator('#adcOL [name=school]').selectOption('2');
  assert.equal(await page.locator('#adcOLPosts input:checked').count(),1);
  assert.equal(await page.locator('#adcOL [name=place]').inputValue(),'Barranqueras');
  assert.equal(await page.locator('#adcOL [name=law]').inputValue(),'113');
  await page.locator('#adcOL [name=school]').selectOption('1');
  await page.evaluate(()=>adcOLPick('Donación de sangre'));
  await page.locator('#adcOL [name=from]').fill('2026-11-26');
  assert.equal(await page.locator('#adcOL [name=until]').inputValue(),'2026-11-26');
  await page.locator('#adcOL [name=until]').fill('2026-11-27');
  assert.match(await page.evaluate(()=>adcOLPending().map(i=>i.message).join(' ')),/deben coincidir/);
  await page.evaluate(()=>adcOLPick('Enfermedad de un miembro del grupo familiar'));
  for(const [key,value] of Object.entries({surname:'Familiar',given:'Prueba',dni:'23456789',address:'Domicilio familiar',relation:'Madre'}))await page.locator(`#adcOL [name=${key}]`).fill(value);
  await page.locator('#adcOL [name=sex][value=F]').check();
  assert.equal(await page.locator('#adcOL [name=reason]').isEnabled(),true);
  assert.equal(await page.locator('#adcOL [name=law]').inputValue(),'151');
  assert.equal(await page.locator('#adcOLRelativeCross').isHidden(),true);
  await page.locator('#adcOLSheet').screenshot({path:path.join(output,'familiar-editable.png')});
  await page.evaluate(()=>adcOLPick('Enfermedad o lesión común'));
  assert.equal(await page.locator('#adcOL [name=surname]').isDisabled(),true);
  assert.equal(await page.locator('#adcOLRelativeCross').isVisible(),true);
  await page.evaluate(()=>adcOLPick('Enfermedad de un miembro del grupo familiar'));
  assert.equal(await page.locator('#adcOL [name=surname]').inputValue(),'Familiar');
  await page.locator('#adcOLPosts input').last().uncheck();
  await page.evaluate(()=>{adcOLSaveDraft();adcOLDraftKey=null;adcOLStart(false)});
  assert.equal(await page.locator('#adcOL [name=surname]').inputValue(),'Familiar');
  assert.equal(await page.locator('#adcOLPosts input:checked').count(),1);
  await page.locator('#adcOLPosts input').last().check();
  await page.evaluate(()=>adcOLPick('Enfermedad o lesión común'));
  await page.locator('#adcOL [name=from]').fill('2026-11-24');await page.locator('#adcOL [name=until]').fill('2026-11-25');
  await page.locator('[data-ol-action=preview]').first().click();
  await page.waitForSelector('#adcOLPreview iframe');
  const bytes=await page.locator('#adcOLPreview iframe').evaluate(async n=>Array.from(new Uint8Array(await(await fetch(n.src)).arrayBuffer())));
  fs.writeFileSync(path.join(output,'OL-01-prueba.pdf'),Buffer.from(bytes));
  await page.locator('#adcOLSheet').screenshot({path:path.join(output,'lienzo.png')});
  const download=page.waitForEvent('download');await page.locator('[data-ol-action=download]').last().click();assert.match((await download).suggestedFilename(),/OL-01/);
  await page.evaluate(()=>{
   window.olPrintCalls=0;
   const listen=HTMLIFrameElement.prototype.addEventListener;
   HTMLIFrameElement.prototype.addEventListener=function(type,handler,options){
    if(type==='load'&&this.title==='Vista previa de impresión del OL-01'){this.olPrintLoad=handler;return}
    return listen.call(this,type,handler,options);
   };
  });
  // El visor PDF nativo de Chrome headless puede capturar el siguiente clic
  // tras descargar. Enter activa el mismo botón y comprueba también su acceso por teclado.
  await page.locator('[data-ol-action=print]').first().focus();
  await page.locator('[data-ol-action=print]').first().press('Enter');
  await page.waitForFunction(()=>$('adcOLPreview').querySelector('iframe')?.olPrintLoad);
  // Chrome headless no siempre emite load en su visor nativo. Se simulan sólo
  // ese evento y la API de impresión; la validación y el PDF anterior son reales.
  await page.evaluate(()=>{const frame=$('adcOLPreview').querySelector('iframe');Object.defineProperty(frame,'contentWindow',{value:{focus(){},print(){window.olPrintCalls++}}});frame.olPrintLoad()});
  assert.equal(await page.evaluate(()=>window.olPrintCalls),1);
  // El resultado lleva los campos y la X, sin widgets ni datos familiares anulados.
  const pdfLib=require(path.join(runtime,'pdf-lib'));const pdf=await pdfLib.PDFDocument.load(Uint8Array.from(bytes));assert.equal(pdf.getForm().getFields().length,0);
  for(const width of [390,768,1440]){
   await page.setViewportSize({width,height:1000});await page.waitForTimeout(150);
   const overflow=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(n=>n.getClientRects().length&&n.getBoundingClientRect().right>innerWidth+2&&!n.closest('.adc-ol-scroll')).map(n=>n.tagName+'#'+n.id+'.'+n.className).slice(0,10));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,JSON.stringify(overflow));
  }
  // Historial ambiguo no propone una escuela.
  await page.evaluate(()=>{localStorage.removeItem('adc-ol01-draft-standalone');localStorage.setItem('adc_dj02_v1',JSON.stringify({pending:inst.map(s=>({dni:'12345678',records:[{motivo:dj02Motivo('Enfermedad o lesión común'),unidad:s.name}]}))}));adcOLDraftKey=null;adcOLStart(false);adcOLPick('Enfermedad o lesión común')});
  assert.equal(await page.locator('#adcOL [name=school]').inputValue(),'');assert.deepEqual(errors,[]);
  // Conserva las correcciones personales al regresar desde el perfil.
  await page.locator('#adcOL [name=teacherGiven]').fill('Corrección conservada');
  await page.evaluate(()=>{$('perfilNombres').value='Otro nombre del perfil';adcOLStart(false)});
  assert.equal(await page.locator('#adcOL [name=teacherGiven]').inputValue(),'Corrección conservada');
  await page.locator('#adcOL [name=teacherSurname]').fill('');
  await page.locator('[data-ol-action=preview]').first().click();
  assert.equal(await page.evaluate(()=>document.activeElement.name),'teacherSurname');
  await page.locator('.adc-pending-card').getByRole('button',{name:'Corregir en Mi perfil docente'}).first().click();
  assert.equal(await page.locator('#profile').isVisible(),true);
  await page.locator('#perfilApellidos').fill('Actualizado');
  await page.getByRole('button',{name:'Retomar OL-01',exact:true}).click();
  assert.equal((await page.locator('#adcOL [name=teacherSurname]').inputValue()).toLowerCase(),'actualizado');
  assert.equal(await page.locator('#adcOL [name=teacherGiven]').inputValue(),'Corrección conservada');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});

test('OL-01: doble diagonal PDF, límites y omisión del pariente anulado',()=>{
 const vm=require('node:vm'),source=fs.readFileSync(path.join(root,'assets/js/tramites/ol01.js'),'utf8');
 const lines=[],texts=[],rectangles=[];
 const context={pdfText:v=>String(v||''),PDFLib:{rgb:(...v)=>v}};vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function adcOLDraw('),source.indexOf("adcOLForm.addEventListener('submit'")),context);
 const page={getHeight:()=>595.32,drawText:t=>texts.push(t),drawLine:l=>lines.push(l),drawRectangle:r=>rectangles.push(r)};
 const font={widthOfTextAtSize:(t,n)=>t.length*n/2};
 context.adcOLDraw(page,font,{entries:[],cross:true,relative:null,place:'Resistencia',signDate:'25/11/2026'});
 assert.equal(lines.length,2);assert.equal(rectangles.length,1);
 assert.equal(lines[0].start.x,422.8);assert.equal(lines[0].end.x,805.3);
 assert.equal(lines[0].end.y,595.32-489);assert.equal(lines[1].start.y,595.32-489);
 assert.ok(rectangles[0].y>595.32-505);assert.ok(texts.includes('Resistencia'));assert.ok(texts.includes('25/11/2026'));
 assert.ok(!texts.includes('Familiar'));
 lines.length=0;texts.length=0;rectangles.length=0;
 context.adcOLDraw(page,font,{entries:[],cross:false,reason:'Asistencia familiar',from:'24/11/2026',until:'25/11/2026',law:'151',article:'309-D',relative:{surname:'Familiar',given:'Prueba',dni:'23456789',address:'Casa',relation:'Madre'}});
 assert.equal(lines.length,0);assert.equal(rectangles.length,0);assert.ok(texts.includes('Familiar'));assert.ok(texts.includes('Asistencia familiar'));assert.ok(texts.includes('151'));
});
