const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),modules=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(modules,'playwright')),{PDFDocument}=require(path.join(modules,'pdf-lib'));

test('Formulario N°3: original, catálogo, cajas alineadas, perfil, borrador, fechas, MNC y PDF',{timeout:120000},async()=>{
 const output=path.join(root,'.adc-tools/form3');fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const url=new URL(req.url,'http://localhost'),relative=decodeURIComponent(url.pathname.slice('/adc/'.length));
  const file=path.resolve(root,relative);if(!url.pathname.startsWith('/adc/')||!file.startsWith(root+path.sep))return res.writeHead(404).end();
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1800},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https:\/\//,route=>route.abort());
  await page.route('**/assets/datos/ajustes-pagina.json',route=>route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
  const url=`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`;
  await page.goto(url);await page.locator('#perfilApellidos').fill('Pérez');await page.locator('#perfilNombres').fill('Juan Pablo');await page.locator('#dni').fill('30123456');await page.locator('#sexo').selectOption('M');
  const open=async()=>{await page.evaluate(()=>tab('tramites'));await page.locator('.adc-form-catalog [data-adc-official-form="form-3"]').click()};
  await page.evaluate(()=>tab('tramites'));
  const card=page.locator('.adc-form-catalog [data-adc-official-form="form-3"]');
  assert.equal(await card.locator('strong').innerText(),'Modificación de Datos de Identificación del Agente');assert.equal(await card.locator('.adc-mbit-code').innerText(),'Formulario N°3');
  await page.locator('#buscar').fill('datos de identificación');assert.equal(await page.locator('#adcFormMatches button').filter({hasText:'Modificación de Datos de Identificación del Agente'}).count(),1);await page.locator('#buscar').fill('');
  await open();const field=key=>page.locator(`[data-adc-field="${key}"]`);
  assert.equal(await page.locator('#adcOfficialForm').getAttribute('data-adc-document-mode'),'overlay');
  assert.equal(await page.locator('[data-adc-official-title]').innerText(),'Modificación de Datos de Identificación del Agente\nFormulario N°3');
  assert.equal(await field('apellido').inputValue(),'Pérez');assert.equal(await field('nombres').inputValue(),'Juan Pablo');assert.equal((await field('dni').inputValue()).replace(/\D/g,''),'30123456');assert.equal(await field('sexoActual').inputValue(),'M');
  assert.equal(await field('apellidoNuevo').inputValue(),'');assert.equal(await field('firma').count(),0);assert.equal(await field('firmaRecepcion').count(),0);
  await field('tipoDocumentoActual').selectOption('DNI');
  for(const [key,value] of Object.entries({apellidoNuevo:'Pérez Gómez',nombresNuevos:'Juan Pablo',numeroDocumentoNuevo:'30123456',documentacion:'Copia DNI y partida de nacimiento',cambioSolicitado:'Rectificación de apellido',lugarPresentacion:'Resistencia',fecha:'2026-11-15',agenteAdministrativo:'Pérez, Juan Pablo',lugarRecepcion:'Resistencia',fechaRecepcion:'2026-11-15',escalafon:'Docente',itemNivel:'Secundario',modalidadAdministrativa:'Común',oficinaAdministrativa:'EES 83',operadorCarga:'Operador',fechaCarga:'2026-11-15',fechaEnvioDgp:'2026-11-16',fechaEnvioRemuneraciones:'2026-11-17'}))await field(key).fill(value);
  await field('tipoDocumentoNuevo').selectOption('DNI');await field('sexoNuevo').selectOption('M');
  await page.locator('[data-adc-mnc=jurisdiccion]').click();assert.equal(await field('jurisdiccion').isEditable(),false);
  for(const pair of [['apellido','nombres'],['apellidoNuevo','nombresNuevos'],['tipoDocumentoActual','dni','sexoActual'],['tipoDocumentoNuevo','numeroDocumentoNuevo','sexoNuevo'],['escalafon','itemNivel','modalidadAdministrativa','oficinaAdministrativa']]){
   const boxes=await Promise.all(pair.map(key=>page.locator(`[data-adc-field-wrapper="${key}"]`).boundingBox()));for(const box of boxes)assert.ok(Math.abs(box.y-boxes[0].y)<1);
  }
  await page.evaluate(()=>document.activeElement.blur());await page.waitForFunction(()=>!document.querySelector('[data-adc-official-status]').dataset.adcLayoutError);
  await page.locator('#adcOfficialForm').screenshot({path:path.join(output,'lienzo.png')});
  await page.evaluate(()=>{window.form3Lines=[];const draw=PDFLib.PDFPage.prototype.drawLine;PDFLib.PDFPage.prototype.drawLine=function(o){form3Lines.push(o);return draw.call(this,o)}});
  const download=page.waitForEvent('download');await page.locator('[data-adc-official-action=download]').first().click();await(await download).saveAs(path.join(output,'completado.pdf'));
  const pdf=await PDFDocument.load(fs.readFileSync(path.join(output,'completado.pdf')));assert.equal(pdf.getPageCount(),1);assert.deepEqual(pdf.getPage(0).getSize(),{width:612.12,height:1008.12});assert.equal(pdf.getForm().getFields().length,0);
  assert.ok(await page.evaluate(()=>form3Lines.some(o=>Math.abs(o.thickness-.5*72/25.4)<1e-8&&Math.abs(o.end.x-o.start.x-134*.7)<1e-8)));
  await page.reload();await open();assert.equal(await field('apellidoNuevo').inputValue(),'Pérez Gómez');assert.equal(await field('jurisdiccion').isEditable(),false);
  for(const width of [320,390,1500]){await page.setViewportSize({width,height:1800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  // Mismos identificador y clave de borrador: conservar valores antiguos sin casillero y fechas previas.
  await page.evaluate(()=>localStorage.setItem('adc-official-form-form-3-draft-v1',JSON.stringify({schemaVersion:2,values:{apellido:'Apellido corregido',nombres:'Nombre anterior',dni:'30123456',firma:'Firma histórica',verificacion:'Control anterior',fechaCarga:'15/11/2026',fechaEnvioDgp:'Texto administrativo antiguo'},touched:['apellido','nombres','dni']})));
  await open();assert.equal(await field('apellido').inputValue(),'Apellido corregido');assert.equal(await field('fechaCarga').inputValue(),'2026-11-15');
  assert.match(await page.locator('[data-adc-official-notices]').textContent(),/Firma histórica/);assert.match(await page.locator('[data-adc-official-notices]').textContent(),/Control anterior/);assert.match(await page.locator('[data-adc-official-notices]').textContent(),/Texto administrativo antiguo/);
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('adc-official-form-form-3-draft-v1')));assert.equal(draft.values.firma,'Firma histórica');assert.equal(draft.values.legacy_fechaEnvioDgp,'Texto administrativo antiguo');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/formularios/Formulario-3.pdf'))).digest('hex'),'5b9c3cb637fbee4fc4ca2f9b81ef20f85ee7f50fced19eb4bb67ab403a43d1d6');assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
