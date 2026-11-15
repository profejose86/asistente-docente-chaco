const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),modules=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(modules,'playwright')),{PDFDocument}=require(path.join(modules,'pdf-lib'));

test('Formulario N°6: siete familiares, PDF horizontal, borrador, fechas, MNC y datos anteriores',{timeout:120000},async()=>{
 const output=path.join(root,'.adc-tools/form6');fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const url=new URL(req.url,'http://localhost'),relative=decodeURIComponent(url.pathname.slice('/adc/'.length));
  const file=path.resolve(root,relative);if(!url.pathname.startsWith('/adc/')||!file.startsWith(root+path.sep))return res.writeHead(404).end();
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1750,height:1450},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https:\/\//,route=>route.abort());await page.route('**/assets/datos/ajustes-pagina.json',route=>route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
  const url=`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`;await page.goto(url);
  await page.locator('#perfilApellidos').fill('Pérez');await page.locator('#perfilNombres').fill('Juan Pablo');await page.locator('#dni').fill('30123456');await page.locator('#sexo').selectOption('M');
  const open=async()=>{await page.evaluate(()=>tab('tramites'));await page.locator('.adc-form-catalog [data-adc-official-form="form-6"]').click()};
  await page.evaluate(()=>tab('tramites'));const card=page.locator('.adc-form-catalog [data-adc-official-form="form-6"]');
  assert.equal(await card.locator('strong').innerText(),'Alta / Baja / Modificación de Datos de Familiares');assert.equal(await card.locator('.adc-mbit-code').innerText(),'Formulario N°6');
  await page.locator('#buscar').fill('datos familiares');assert.equal(await page.locator('#adcFormMatches button').filter({hasText:'Alta / Baja / Modificación de Datos de Familiares'}).count(),1);await page.locator('#buscar').fill('');
  await open();const field=key=>page.locator(`[data-adc-field="${key}"]`);
  assert.equal(await page.locator('[data-adc-official-title]').innerText(),'Alta / Baja / Modificación de Datos de Familiares\nFormulario N°6');
  assert.equal(await page.locator('#adcOfficialForm').getAttribute('data-adc-document-mode'),'overlay');assert.equal(await page.locator('[data-adc-repeat-row]').count(),7);assert.equal(await page.locator('[data-adc-repeat-add]').count(),0);
  assert.equal(await field('apellido').inputValue(),'Pérez');assert.equal(await field('nombres').inputValue(),'Juan Pablo');assert.equal((await field('dni').inputValue()).replace(/\D/g,''),'30123456');
  await field('tipoDocumentoAgente').selectOption('DNI');
  for(let i=0;i<7;i++){
   for(const [key,value] of Object.entries({parentesco:'Hijo',dni:String(40123450+i),apellidoNombres:'Pérez Familiar '+(i+1),fechaNacimiento:`201${i}-02-15`,nivelEscolar:'Prim.',curso:'3',hecho:'Nacimiento'}))await field(`familiares.${i}.${key}`).fill(value);
   for(const [key,value] of Object.entries({tipoDocumento:'DNI',sexo:'M',correspondeAsignaciones:'Sí',incapacidad:'No',dobleAsignacion:'No',ayudaEscolar:'Sí'}))await field(`familiares.${i}.${key}`).selectOption(value);
   const boxes=await Promise.all(['parentesco','dni','apellidoNombres','fechaNacimiento','hecho'].map(key=>page.locator(`[data-adc-field-wrapper="familiares.${i}.${key}"]`).boundingBox()));for(const box of boxes)assert.ok(Math.abs(box.y-boxes[0].y)<1);
  }
  for(const [key,value] of Object.entries({hechoGenerador:'Nacimiento de hijo',fechaHecho:'2026-11-15',asignacionSolicitada:'Asignación familiar',documentacion:'Partida y DNI',lugarPresentacion:'Resistencia',fecha:'2026-11-15',agenteCertificado:'Pérez Juan Pablo',vigenciaCertificada:'2026-11-15',datosCertificados:'Vínculo y nacimiento',lugarRecepcion:'Resistencia',fechaRecepcion:'2026-11-15',jurisdiccion:'Educación',escalafon:'Docente',itemNivel:'Primario',modalidadAdministrativa:'Común',oficinaAdministrativa:'EES 83',operadorCarga:'Operador',fechaCarga:'2026-11-15',recibioRemuneraciones:'Oficina',fechaEnvioRemuneraciones:'2026-11-16'}))await field(key).fill(value);
  await field('accion').filter({has:undefined}).locator('xpath=self::*[@value="Alta"]').check();await field('accionCertificada').locator('xpath=self::*[@value="Alta"]').check();
  await field('familiares.6.nivelEscolar').fill('');await page.locator('[data-adc-mnc="familiares.6.nivelEscolar"]').click();assert.equal(await field('familiares.6.nivelEscolar').isEditable(),false);
  assert.equal(await field('firma').count(),0);assert.equal(await field('firmaRecepcion').count(),0);assert.equal(await page.locator('.adc-prepared-overflow-field').count(),0);
  await page.locator('.adc-prepared-repeat-tools summary').click();await page.getByRole('button',{name:'Bajar familiar 1',exact:true}).click();assert.equal(await field('familiares.1.apellidoNombres').inputValue(),'Pérez Familiar 1');await page.getByRole('button',{name:'Subir familiar 2',exact:true}).click();await page.locator('.adc-prepared-repeat-tools summary').click();
  for(const width of [320,390,1750]){await page.setViewportSize({width,height:1450});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  await page.evaluate(()=>document.activeElement.blur());await page.waitForFunction(()=>!document.querySelector('[data-adc-official-status]').dataset.adcLayoutError);await page.locator('#adcOfficialForm').screenshot({path:path.join(output,'lienzo.png')});
  await page.evaluate(()=>{window.form6Lines=[];const draw=PDFLib.PDFPage.prototype.drawLine;PDFLib.PDFPage.prototype.drawLine=function(o){form6Lines.push(o);return draw.call(this,o)}});
  const download=page.waitForEvent('download');await page.locator('[data-adc-official-action=download]').first().click();await(await download).saveAs(path.join(output,'completado.pdf'));
  const pdf=await PDFDocument.load(fs.readFileSync(path.join(output,'completado.pdf')));assert.equal(pdf.getPageCount(),1);assert.deepEqual(pdf.getPage(0).getSize(),{width:1008.12,height:612.12});assert.equal(pdf.getForm().getFields().length,0);
  assert.ok(await page.evaluate(()=>form6Lines.some(o=>Math.abs(o.thickness-.5*72/25.4)<1e-8&&Math.abs(o.end.x-o.start.x-31*.7)<1e-8)));
  await page.reload();await open();assert.equal(await field('familiares.6.apellidoNombres').inputValue(),'Pérez Familiar 7');assert.equal(await field('familiares.6.nivelEscolar').isEditable(),false);
  await page.evaluate(()=>localStorage.setItem('adc-official-form-form-6-draft-v1',JSON.stringify({schemaVersion:2,rowCounts:{familiares:10},values:{apellido:'Corrección anterior',nombres:'Nombre anterior',dni:'30123456','familiares.9.apellidoNombres':'Familiar histórico','familiares.0.accion':'Baja','familiares.0.documentacion':'Documento anterior','familiares.0.fechaNacimiento':'15/02/2010',firma:'Firma histórica',observaciones:'Nota conservada',fechaRecepcion:'15/11/2026'},touched:['apellido','nombres','dni']})));
  await open();assert.equal(await field('apellido').inputValue(),'Corrección anterior');assert.equal(await field('familiares.9.apellidoNombres').inputValue(),'Familiar histórico');assert.equal(await field('familiares.0.documentacion').inputValue(),'Documento anterior');assert.equal(await field('familiares.0.fechaNacimiento').inputValue(),'2010-02-15');assert.equal(await field('fechaRecepcion').inputValue(),'2026-11-15');
  assert.match(await page.locator('[data-adc-official-status]').textContent(),/siete filas|sin casillero/);assert.match(await page.locator('[data-adc-official-notices]').textContent(),/Firma histórica/);assert.match(await page.locator('[data-adc-official-notices]').textContent(),/Nota conservada/);
  assert.equal(await field('accion').filter({has:undefined}).evaluateAll(es=>es.some(e=>e.checked)),false);
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('adc-official-form-form-6-draft-v1')));assert.equal(draft.values['familiares.9.apellidoNombres'],'Familiar histórico');assert.equal(draft.values['familiares.0.accion'],'Baja');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/formularios/Formulario-6.pdf'))).digest('hex'),'483f5689e65091dbeafd96570047369e110b10f4ad33e692f5594a2bc7679252');assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
