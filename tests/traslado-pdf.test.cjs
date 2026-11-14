const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),modules=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(modules,'playwright')),{PDFDocument}=require(path.join(modules,'pdf-lib'));
test('Traslado: dos páginas originales, título, campos, pantalla completa, MNC y PDF', {timeout:120000},async()=>{
 const output=path.join(root,'.adc-tools/traslado');fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.pdf':'application/pdf','.png':'image/png','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/assets/datos/ajustes-pagina.json',r=>r.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
  await page.route(/^https:\/\//,r=>r.abort());await page.goto(`http://127.0.0.1:${server.address().port}/index.html?adc-preview=1`);
  const open=()=>page.evaluate(()=>document.querySelector('[data-adc-official-form="traslado-inicial"]').click());
  const field=key=>page.locator(`[data-adc-field="${key}"]`);
  await page.evaluate(()=>{for(const [id,value] of Object.entries({perfilApellidos:'Gomez',perfilNombres:'Jose Miguel',dni:'32938226',perfilDomicilio:'Guido Spano 1647',perfilLocalidad:'Barranqueras'}))$(id).value=value});await open();
  assert.equal(await page.locator('[data-adc-official-title]').textContent(),'Solicitud de Traslado Transitorio');assert.equal(await page.locator('.adc-prepared-background').count(),2);
  assert.equal(await field('apellido').inputValue(),'Gomez');assert.equal(await field('dni').inputValue(),'32938226');
  await page.evaluate(()=>{
   const descriptor=adcOfficialFormsData.find(f=>f.id==='traslado-inicial');
   for(const section of descriptor.sections)for(const field of section.fields){
    if(field.signature||field.legacyOnly)continue;
    const input=document.querySelector(`[data-adc-field="${field.key}"]`);if(!input)continue;
    if(input.type==='radio'){input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));continue}
    if(input.value)continue;
    input.value=input.type==='date'?'2026-11-14':input.tagName==='SELECT'?input.options[1].value:/Categoria|Grupo|Antiguedad|tareasAdministrativas/.test(field.key)?'1':'Dato';input.dispatchEvent(new Event('input',{bubbles:true}));
   }
  });
  await field('titularNumero').fill('83');await field('actualNumero').fill('150');await field('solicitadoNumero').fill('85');
  await field('directorInforme').fill('Informe de la direccion de prueba');await field('supervisorInforme').fill('Informe del supervisor de prueba');await field('regionalInforme').fill('Dictamen regional de prueba');
  for(const key of ['firma','firmadirector','firmasupervisor','firmaregional'])assert.equal(await field(key).inputValue(),'');
  await field('telefono').fill('');await page.locator('[data-adc-mnc=telefono]').click();assert.equal(await field('telefono').isEditable(),false);await page.locator('[data-adc-mnc=telefono]').click();assert.equal(await field('telefono').isEditable(),true);await page.locator('[data-adc-mnc=telefono]').click();
  assert.equal(await page.locator('[data-adc-mnc=saludSolicitante]').count(),0);
  await page.evaluate(()=>document.activeElement.blur());await page.waitForFunction(()=>!document.querySelector('[data-adc-official-status]').dataset.adcLayoutError);
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:1100});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  await page.locator('[data-adc-document-fullscreen]').click();await page.waitForFunction(()=>document.fullscreenElement?.classList.contains('adc-document-viewport'));
  assert.equal(await field('apellido').isEditable(),true);await page.screenshot({path:path.join(output,'pantalla-completa.png')});
  await page.getByRole('button',{name:'Salir de pantalla completa',exact:true}).click();await page.waitForFunction(()=>!document.fullscreenElement);
  await page.locator('#adcOfficialForm').screenshot({path:path.join(output,'lienzo.png')});
  const download=page.waitForEvent('download');await page.locator('[data-adc-official-action=download]').first().click();await(await download).saveAs(path.join(output,'completado.pdf'));
  const pdf=await PDFDocument.load(fs.readFileSync(path.join(output,'completado.pdf')));assert.equal(pdf.getPageCount(),2);assert.equal(pdf.getForm().getFields().length,0);for(const p of pdf.getPages())assert.deepEqual(p.getSize(),{width:595,height:842});
  await page.locator('[data-adc-official-action=preview]').first().focus();await page.locator('[data-adc-official-action=preview]').first().press('Enter');await page.waitForSelector('[data-adc-official-preview] iframe');
  await page.reload();await open();assert.equal(await field('telefono').isEditable(),false);assert.equal(await field('directorInforme').inputValue(),'Informe de la direccion de prueba');
  const src=fs.readFileSync(path.join(root,'materiales/Formulario para solicitar traslado transitorio.pdf'));assert.equal(crypto.createHash('sha256').update(src).digest('hex'),'cff4245d9e29aa52141b70c95e0ee7a80e1fc42284afae99d9c7256a99afd5b4');assert.ok(src.equals(fs.readFileSync(path.join(root,'assets/formularios/Traslado-Transitorio.pdf'))));assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
