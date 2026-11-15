const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const os=require('node:os');
const path=require('node:path');
const {test}=require('node:test');

const root=path.resolve(__dirname,'..');
const runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(runtime,'playwright'));

test('DJ-01 permite escribir fechas completas en el mismo campo, sin ventana emergente',{timeout:120000},async()=>{
 const server=http.createServer((request,response)=>{
  if(require('./support/demo-config.cjs').serve(request,response))return;
  const file=path.resolve(root,'.'+new URL(request.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
  fs.readFile(file,(error,data)=>{
   if(error)return response.writeHead(404).end();
   response.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'application/octet-stream');
   response.end(data);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({locale:'fr-FR'});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route(/^https:\/\//,route=>route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?adc-preview=1`);
  await page.evaluate(()=>{
   addEntry(inst[0].id);
   const entry=inst[0].entries.at(-1);
   Object.assign(entry,{subject:'Inglés (demo)',course:'2 1',revista:'Interino',turno:'Mañana',schedule:[2,0,0,0,0,0,0]});
   entry.djPeriods=[{id:'periodo-prueba',desde:'',hasta:'2026-12-15',modo:'fecha'}];
   tab('dj');
   djRender();
  });
  await page.locator('#djCargoList .dj-accordion-toggle').first().click();
  await page.locator('#djCargoList .dj-course-toggle').first().click();
  const startDate=page.locator('#djCargoList [data-dj-period][data-field="desde"]').first();
  assert.equal(await startDate.getAttribute('type'),'text');
  assert.equal(await startDate.getAttribute('placeholder'),'DD/MM/AAAA');
  await startDate.click();
  await startDate.pressSequentially('11/12/2002');
  assert.equal(await startDate.inputValue(),'11/12/2002');
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.field),'desde');
  assert.equal(await page.locator('.adc-date-entry-dialog,.adc-date-manual-button').count(),0);
  await startDate.press('Tab');
  assert.equal(await page.evaluate(()=>inst[0].entries.at(-1).djPeriods.at(-1).desde),'2002-12-11');
  const until=page.locator('#djCargoList [data-dj-period][data-field="hasta"]').first();
  assert.equal(await until.getAttribute('type'),'text');
  assert.equal(await until.getAttribute('placeholder'),'DD/MM/AAAA');
  assert.equal(await until.inputValue(),'15/12/2026');
  await until.fill('05/03/2027');
  await until.press('Tab');
  assert.equal(await page.evaluate(()=>inst[0].entries.at(-1).djPeriods.at(-1).hasta),'2027-03-05');
  const invalidUntil=page.locator('#djCargoList [data-dj-period][data-field="hasta"]').first();
  await invalidUntil.fill('31/02/2027');
  await invalidUntil.press('Tab');
  assert.equal(await page.evaluate(()=>inst[0].entries.at(-1).djPeriods.at(-1).hasta),'2027-03-05');
  await page.evaluate(()=>{$('djPreview').innerHTML=djPreviewHTML({rows:djSnapshotRows()});});
  assert.match(await page.locator('#djPreview #djSheet1').innerText(),/11\/12\/2002/);
  assert.match(await page.locator('#djPreview #djSheet1').innerText(),/05\/03\/2027/);
  await page.locator('#djCargoList [data-dj-period][data-field="modo"]').first().selectOption('continua');
  assert.equal(await page.evaluate(()=>inst[0].entries.at(-1).djPeriods.at(-1).modo),'continua');
  assert.equal(await page.evaluate(()=>inst[0].entries.at(-1).djPeriods.at(-1).hasta),'');
  await page.locator('#djCargoList [data-dj-period][data-field="modo"]').first().selectOption('sin-termino');
  assert.equal(await page.evaluate(()=>inst[0].entries.at(-1).djPeriods.at(-1).modo),'sin-termino');
  assert.deepEqual(errors,[]);
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
});
