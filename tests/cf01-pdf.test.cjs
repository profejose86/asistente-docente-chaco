const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),modules=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(modules,'playwright')),{PDFDocument}=require(path.join(modules,'pdf-lib'));
test('CF-01: original, tres establecimientos y nueve cargos, perfil, MNC, borrador y PDF', {timeout:120000},async()=>{
 const output=path.join(root,'.adc-tools/cf01');fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.pdf':'application/pdf','.png':'image/png','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1900},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/assets/datos/ajustes-pagina.json',route=>route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
  await page.route(/^https:\/\//,route=>route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?adc-preview=1`);
  const open=()=>page.evaluate(()=>document.querySelector('[data-adc-official-form=cf01]').click());
  const field=key=>page.locator(`[data-adc-field="${key}"]`);
  await page.evaluate(()=>{for(const [id,value] of Object.entries({perfilApellidos:'Gomez',perfilNombres:'Jose Miguel',perfilDomicilio:'Guido Spano 1647',sexo:'M'}))$(id).value=value});await open();
  assert.equal(await page.locator('#adcOfficialForm').getAttribute('data-adc-document-mode'),'overlay');
  assert.equal(await page.locator('.adc-prepared-background').getAttribute('src'),'assets/formularios/CF-01-pagina-1.png');
  assert.equal(await field('apellido').inputValue(),'Gomez');assert.equal(await field('nombres').inputValue(),'Jose Miguel');assert.equal(await field('genero').inputValue(),'M');
  assert.equal(await field('dni').count(),0);assert.equal(await page.locator('.adc-prepared-overflow-field').count(),0);
  assert.equal(await page.locator('[data-adc-repeat-row]').count(),3);assert.equal(await page.locator('[data-adc-repeat-add]').count(),0);
  for(const [key,value] of Object.entries({organismoSolicitante:'Ministerio de Educacion',cuil:'20-32938226-9',telefono:'3624000000',periodoDesde:'2026-11-14',periodoHasta:'2026-12-14',fechaNotificacion:'2026-11-14',funcionesAreas:'Tareas administrativas y apoyo a biblioteca.'}))await field(key).fill(value);
  for(let school=0;school<3;school++){
   for(const [key,value] of Object.entries({numeroUE:String(83+school),establecimiento:'EES '+(83+school),nivel:'Secundario',categoria:'Primera',zona:'Urbana',jornada:'Simple',localidad:'Resistencia',modalidad:'Comun',especialidad:'Educacion'}))await field(`funciones.${school}.${key}`).fill(value);
   for(const row of ['', '2','3']){
    for(const [key,value] of Object.entries({denominacionCargo:'Profesor',asignatura:'Historia',anio:'2',division:'1',turno:'Manana',horasCatedra:'3'}))await field(`funciones.${school}.${key}${row}`).fill(value);
    await field(`funciones.${school}.situacionRevista${row}`).locator('xpath=self::*[@value="Titular"]').check();
   }
  }
  await field('telefono').fill('');await page.locator('[data-adc-mnc=telefono]').click();
  assert.equal(await field('telefono').isEditable(),false);await page.locator('[data-adc-mnc=telefono]').click();assert.equal(await field('telefono').isEditable(),true);await page.locator('[data-adc-mnc=telefono]').click();
  assert.equal(await page.locator('[data-adc-mnc="funciones.0.situacionRevista"]').count(),0);assert.equal(await page.locator('[data-adc-mnc=firmaOrganismo]').count(),0);
  for(const width of [320,390,1500]){await page.setViewportSize({width,height:1900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  await page.evaluate(()=>document.activeElement.blur());await page.waitForFunction(()=>!document.querySelector('[data-adc-official-status]').dataset.adcLayoutError);
  await page.locator('#adcOfficialForm').screenshot({path:path.join(output,'lienzo.png')});
  const download=page.waitForEvent('download');await page.locator('[data-adc-official-action=download]').first().click();await(await download).saveAs(path.join(output,'completado.pdf'));
  const pdf=await PDFDocument.load(fs.readFileSync(path.join(output,'completado.pdf')));assert.equal(pdf.getPageCount(),1);assert.deepEqual(pdf.getPage(0).getSize(),{width:612,height:1008});assert.equal(pdf.getForm().getFields().length,0);
  await page.locator('[data-adc-official-action=preview]').first().focus();await page.locator('[data-adc-official-action=preview]').first().press('Enter');await page.waitForSelector('[data-adc-official-preview] iframe');
  await page.reload();await open();assert.equal(await field('telefono').isEditable(),false);assert.equal(await field('funciones.2.asignatura3').inputValue(),'Historia');
  // Un borrador con más establecimientos y campos antiguos se mantiene visible para revisión.
  await page.evaluate(()=>{localStorage.setItem('adc-official-form-cf01-draft-v1',JSON.stringify({schemaVersion:2,rowCounts:{funciones:4},values:{'funciones.3.asignatura':'Historia antigua','funciones.0.codigoOficina':'1234',anexoCuil:'CEIC antiguo',fechaNotificacion:'14/11/2026'},touched:['fechaNotificacion']}))});await open();
  assert.equal(await field('funciones.3.asignatura').inputValue(),'Historia antigua');assert.equal(await field('funciones.0.codigoOficina').inputValue(),'1234');assert.equal(await field('fechaNotificacion').inputValue(),'2026-11-14');assert.match(await page.locator('[data-adc-official-notices]').textContent(),/CEIC antiguo/);
  assert.match(await page.locator('[data-adc-official-status]').textContent(),/excede/);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/formularios/CF-01.pdf'))).digest('hex'),'43b0685c984aa8a381d243ec3a47f1867bb58a89bfa44922d0e9b8cb44600a22');assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
