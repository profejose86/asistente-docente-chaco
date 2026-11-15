const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),modules=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(modules,'playwright')),{PDFDocument}=require(path.join(modules,'pdf-lib'));

test('BD-07: PDF original, cajas, perfil e institución, opción explícita, MNC y borrador',{timeout:120000},async()=>{
 const output=path.join(root,'.adc-tools/bd07');fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const url=new URL(req.url,'http://localhost'),relative=decodeURIComponent(url.pathname.slice('/adc/'.length));
  const file=path.resolve(root,relative);if(!url.pathname.startsWith('/adc/')||!file.startsWith(root+path.sep))return res.writeHead(404).end();
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1700},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https:\/\//,route=>route.abort());await page.route('**/assets/datos/ajustes-pagina.json',route=>route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
  const url=`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`;await page.goto(url);
  await page.locator('#perfilApellidos').fill('Pérez');await page.locator('#perfilNombres').fill('Juan Pablo');await page.locator('#dni').fill('30123456');
  await page.evaluate(()=>{inst=[{id:1,name:'EES N 83',level:'Secundario',entries:[]}];localStorage.setItem('adc_v08',JSON.stringify(data()))});
  const open=async()=>{await page.evaluate(()=>tab('tramites'));await page.locator('.adc-form-catalog [data-adc-official-form=bd07]').click()};
  await page.evaluate(()=>tab('tramites'));const card=page.locator('.adc-form-catalog [data-adc-official-form=bd07]');
  assert.equal(await card.locator('strong').innerText(),'Opción de Seguros');assert.equal(await card.locator('.adc-mbit-code').innerText(),'BD-07');
  await page.locator('#buscar').fill('opcion de seguros');assert.equal(await page.locator('#adcFormMatches button').filter({hasText:'Opción de Seguros'}).count(),1);await page.locator('#buscar').fill('');await open();
  const field=key=>page.locator(`[data-adc-field="${key}"]`);
  assert.equal(await page.locator('[data-adc-official-title]').innerText(),'Opción de Seguros\nBD-07');assert.equal(await page.locator('#adcOfficialForm').getAttribute('data-adc-document-mode'),'overlay');
  assert.equal(await field('apellido').inputValue(),'Pérez');assert.equal(await field('nombres').inputValue(),'Juan Pablo');assert.equal((await field('dni').inputValue()).replace(/\D/g,''),'30123456');
  assert.equal(await field('nombreEscuela').inputValue(),'EES N 83');assert.equal(await field('nivel').inputValue(),'Secundario');assert.equal(await field('numeroEscuela').inputValue(),'');assert.match(await field('aclaracionFirma').inputValue(),/Pérez/);
  assert.equal(await field('continuarSeguro').evaluateAll(es=>es.some(e=>e.checked)),false);
  for(const [key,value] of Object.entries({lugar:'Resistencia',fecha:'2026-11-15',numeroEscuela:'83',nivel:'Nivel corregido',aclaracionFirma:'Pérez, Juan Pablo'}))await field(key).fill(value);
  await field('continuarSeguro').locator('xpath=self::*[@value="Sí"]').check();await field('continuarSeguro').locator('xpath=self::*[@value="No"]').check();assert.equal(await field('continuarSeguro').locator('xpath=self::*[@value="Sí"]').isChecked(),false);
  await page.locator('[data-adc-mnc=actuacion]').click();assert.equal(await field('actuacion').isEditable(),false);assert.equal(await page.locator('[data-adc-mnc=continuarSeguro]').count(),0);assert.equal(await field('firma').count(),0);
  for(const keys of [['lugar','fecha'],['nombres','dni'],['numeroEscuela','nivel']]){const boxes=await Promise.all(keys.map(key=>page.locator(`[data-adc-field-wrapper="${key}"]`).boundingBox()));for(const box of boxes)assert.ok(Math.abs(box.y-boxes[0].y)<1)}
  for(const width of [320,390,1500]){await page.setViewportSize({width,height:1700});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  await page.evaluate(()=>document.activeElement.blur());await page.waitForFunction(()=>!document.querySelector('[data-adc-official-status]').dataset.adcLayoutError);await page.locator('#adcOfficialForm').screenshot({path:path.join(output,'lienzo.png')});
  await page.evaluate(()=>{window.bd07Lines=[];const draw=PDFLib.PDFPage.prototype.drawLine;PDFLib.PDFPage.prototype.drawLine=function(o){bd07Lines.push(o);return draw.call(this,o)}});
  const download=page.waitForEvent('download');await page.locator('[data-adc-official-action=download]').first().click();await(await download).saveAs(path.join(output,'completado.pdf'));
  const pdf=await PDFDocument.load(fs.readFileSync(path.join(output,'completado.pdf')));assert.equal(pdf.getPageCount(),1);assert.deepEqual(pdf.getPage(0).getSize(),{width:595.32,height:842.04});assert.equal(pdf.getForm().getFields().length,0);
  assert.ok(await page.evaluate(()=>bd07Lines.some(o=>Math.abs(o.thickness-.5*72/25.4)<1e-8&&Math.abs(o.end.x-o.start.x-170*.7)<1e-8)));
  await page.reload();await open();assert.equal(await field('continuarSeguro').locator('xpath=self::*[@value="No"]').isChecked(),true);assert.equal(await field('actuacion').isEditable(),false);assert.equal(await field('nivel').inputValue(),'Nivel corregido');
  const long='Apellido muy extenso '.repeat(30);await field('apellido').fill(long);await page.waitForFunction(()=>document.querySelector('[data-adc-official-status]').dataset.adcLayoutError==='true');assert.equal(await field('apellido').inputValue(),long);await field('apellido').press('Tab');
  await page.evaluate(()=>localStorage.setItem('adc-official-form-bd07-draft-v1',JSON.stringify({schemaVersion:2,values:{apellido:'Apellido anterior',nombres:'Nombre anterior',dni:'30123456',establecimiento:'Escuela histórica',firma:'Firma anterior',fecha:'15/11/2026',continuarSeguro:'Sí',aclaracionFirma:'Aclaración corregida'},touched:['apellido','nombres','dni','aclaracionFirma']})));
  await open();assert.equal(await field('apellido').inputValue(),'Apellido anterior');assert.equal(await field('fecha').inputValue(),'2026-11-15');assert.equal(await field('aclaracionFirma').inputValue(),'Aclaración corregida');assert.equal(await field('continuarSeguro').locator('xpath=self::*[@value="Sí"]').isChecked(),true);
  assert.match(await page.locator('[data-adc-official-notices]').textContent(),/Escuela histórica/);assert.match(await page.locator('[data-adc-official-notices]').textContent(),/Firma anterior/);
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('adc-official-form-bd07-draft-v1')));assert.equal(draft.values.establecimiento,'Escuela histórica');assert.equal(draft.values.firma,'Firma anterior');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/formularios/BD-07.pdf'))).digest('hex'),'9a96b9b098f20d7a2cfe90a0260d9d1248e2d511789db98c703b1dea2b17571e');assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
