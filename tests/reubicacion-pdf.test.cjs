const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),modules=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(modules,'playwright')),{PDFDocument}=require(path.join(modules,'pdf-lib'));
test('Catálogo: próximos, acciones y Reubicación sobre el PDF original', {timeout:120000},async()=>{
 const output=path.join(root,'.adc-tools/reubicacion');fs.mkdirSync(output,{recursive:true});
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
  await page.evaluate(()=>{tab('tramites');const card=document.querySelector('[data-adc-official-form=interinos]');for(let n=card.parentElement;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;});
  const pending=page.locator('[data-adc-official-form=interinos]');assert.equal(await pending.isVisible(),true);assert.equal(await pending.isDisabled(),true);assert.match(await pending.textContent(),/Próximamente/);
  assert.notEqual(await pending.evaluate(n=>getComputedStyle(n).boxShadow),'none');await pending.screenshot({path:path.join(output,'interinos-proximamente.png')});
  assert.equal(await page.locator('.adc-form-catalog').getByText('Completar y descargar',{exact:true}).count(),0);
  assert.ok(await page.locator('.adc-form-catalog').getByText('Ingresar y Editar',{exact:true}).count()>15);
  assert.equal(await page.evaluate(()=>adcMBIT.records().some(record=>record.id==='interinos')),false);
  await page.locator('#buscar').fill('interinos');assert.equal(await page.locator('#adcFormMatches [data-adc-official-form=interinos]').count(),0);
  const open=()=>page.evaluate(()=>document.querySelector('[data-adc-official-form=reubicacion]').click());const field=key=>page.locator(`[data-adc-field="${key}"]`);await open();
  assert.equal(await page.locator('[data-adc-official-title]').textContent(),'Establecimiento donde se desempeña en condiciones de Reubicación');assert.equal(await page.locator('.adc-prepared-background').getAttribute('src'),'assets/formularios/Reubicacion-pagina-1.png');assert.equal(await page.locator('[data-adc-repeat-row]').count(),8);
  for(let row=0;row<8;row++)for(const [key,value] of Object.entries({establecimiento:'Instituto '+(row+1),categoria:'1',zona:'Urbana',cargoAsignatura:'Profesor',horas:'3',instrumento:'Resolucion 123',localidad:'Resistencia',region:'I'}))await field(`destinos.${row}.${key}`).fill(value);
  await field('destinos.0.zona').fill('');await page.locator('[data-adc-mnc="destinos.0.zona"]').click();assert.equal(await field('destinos.0.zona').isEditable(),false);await page.locator('[data-adc-mnc="destinos.0.zona"]').click();assert.equal(await field('destinos.0.zona').isEditable(),true);await page.locator('[data-adc-mnc="destinos.0.zona"]').click();assert.equal(await page.locator('[data-adc-mnc=firmaDocente]').count(),0);
  await page.locator('.adc-prepared-repeat-tools summary').click();await page.getByRole('button',{name:'Bajar cargos para reubicación 1',exact:true}).click();assert.equal(await field('destinos.1.establecimiento').inputValue(),'Instituto 1');await page.getByRole('button',{name:'Subir cargos para reubicación 2',exact:true}).click();await page.locator('.adc-prepared-repeat-tools summary').click();
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:1100});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  await page.evaluate(()=>document.activeElement.blur());await page.waitForFunction(()=>!document.querySelector('[data-adc-official-status]').dataset.adcLayoutError);
  await page.locator('#adcOfficialForm').screenshot({path:path.join(output,'lienzo.png')});
  const download=page.waitForEvent('download');await page.locator('[data-adc-official-action=download]').first().click();await(await download).saveAs(path.join(output,'completado.pdf'));
  const pdf=await PDFDocument.load(fs.readFileSync(path.join(output,'completado.pdf')));assert.equal(pdf.getPageCount(),1);assert.deepEqual(pdf.getPage(0).getSize(),{width:1008,height:612});assert.equal(pdf.getForm().getFields().length,0);
  await page.locator('[data-adc-official-action=preview]').first().focus();await page.locator('[data-adc-official-action=preview]').first().press('Enter');await page.waitForSelector('[data-adc-official-preview] iframe');
  await page.reload();await open();assert.equal(await field('destinos.0.zona').isEditable(),false);assert.equal(await field('destinos.7.establecimiento').inputValue(),'Instituto 8');
  await page.evaluate(()=>{localStorage.setItem('adc-official-form-reubicacion-draft-v1',JSON.stringify({schemaVersion:2,rowCounts:{destinos:12},values:{'destinos.11.establecimiento':'Registro historico',dni:'12345678'},touched:['destinos.11.establecimiento']}))});await open();assert.equal(await field('destinos.11.establecimiento').inputValue(),'Registro historico');assert.match(await page.locator('[data-adc-official-status]').textContent(),/excede/);assert.match(await page.locator('[data-adc-official-notices]').textContent(),/12345678/);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/formularios/Reubicacion.pdf'))).digest('hex'),'622fa6e79d02ec217f65bf14bd7b9e8f918675e11ea41b2e7c17aae2e62657d1');assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
