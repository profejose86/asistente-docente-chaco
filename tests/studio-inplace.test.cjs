const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const contract=require('../assets/js/editor/ajustes-proyecto-datos.js'),root=path.resolve(__dirname,'..');
async function run(action){
 const server=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data);});
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({channel:'chrome',headless:true});
 try{const page=await browser.newPage({viewport:{width:1500,height:1100}});page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.route('**/assets/datos/ajustes-pagina.json',route=>route.fulfill({json:contract.empty()}));await page.goto('http://127.0.0.1:'+server.address().port+'/ADC_Ingreso_Editable.html');await require('./support/ajustes.cjs').clickGear(page);await action(page);assert.deepEqual(errors,[]);}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
async function exported(page){await page.locator('[aria-controls=adcStudioPane-proyecto]').click();const download=page.waitForEvent('download');await page.locator('[data-project-export]').click();return contract.validate(JSON.parse(fs.readFileSync(await(await download).path(),'utf8')));}
test('In-place: Enter, blur, Esc, pegado seguro y undo/redo usan operaciones text guardables',()=>run(async page=>{
 const title=page.locator('#adcLoginTitle'),before=await title.innerHTML();
 await title.dblclick();assert.equal(await title.getAttribute('contenteditable'),'true');await title.fill('Ingreso editable');await title.press('Enter');assert.equal(await title.textContent(),'Ingreso editable');assert.equal(await title.getAttribute('contenteditable'),null);
 await page.locator('[data-act=undo]').click();assert.equal(await title.innerHTML(),before);await page.locator('[data-act=redo]').click();assert.equal(await title.textContent(),'Ingreso editable');
 await title.dblclick();await title.fill('Guardar al salir');await page.locator('[aria-controls=adcStudioPane-proyecto]').click();assert.equal(await title.textContent(),'Guardar al salir');assert.equal(await title.getAttribute('contenteditable'),null);
 await title.dblclick();await title.fill('No guardar');await title.press('Escape');assert.equal(await title.textContent(),'Guardar al salir');
 await title.dblclick();await title.fill('');await title.evaluate(node=>{const transfer=new DataTransfer();transfer.setData('text/plain','<b>Texto seguro</b>');transfer.setData('text/html','<img src=x onerror="window.evil=true">');node.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:transfer}));});await title.press('Enter');assert.equal(await title.textContent(),'<b>Texto seguro</b>');assert.equal(await title.locator('img').count(),0);
 const data=await exported(page);assert.ok(data.pages.ingreso.operations.some(op=>op.kind==='text'&&op.target==='project:#adcLoginTitle'&&op.html.includes('&lt;b&gt;')));assert.equal(await page.locator('[data-adc-studio-editing]').count(),0);
}));
test('Duplicar: badge y Ctrl+D comparten comando; clases, estilos y texto de la copia se conservan',()=>run(async page=>{
 await page.getByLabel('Panel',{exact:true}).selectOption('horizontal');
 const card=page.locator('.adc-feature').first();await card.click({position:{x:100,y:8}});await page.locator('[data-studio-duplicate]').click();assert.equal(await page.locator('.adc-feature').count(),3);
 const copy=page.locator('.adc-feature').nth(1);assert.ok((await copy.getAttribute('class')).includes('adc-interactive-card'));assert.equal(await copy.evaluate(node=>getComputedStyle(node).backgroundColor),await card.evaluate(node=>getComputedStyle(node).backgroundColor));
 await copy.locator('strong').dblclick();await copy.locator('strong').fill('Tarjeta duplicada');await copy.locator('strong').press('Enter');assert.notEqual(await card.locator('strong').textContent(),'Tarjeta duplicada');
 await copy.click({position:{x:100,y:8}});await page.keyboard.press('Control+d');assert.equal(await page.locator('.adc-feature').count(),4);
 const data=await exported(page);assert.equal(data.pages.ingreso.operations.filter(op=>op.kind==='duplicate').length,2);assert.ok(data.pages.ingreso.operations.some(op=>op.kind==='text'&&op.target.startsWith('new-')));
}));
test('Smart Guides visibles durante arrastre: snap, cm, Alt libre y cancelación sin cambios',()=>run(async page=>{
 await page.evaluate(()=>{for(const [id,x] of [['moveBox',650],['anchorBox',800]]){const node=document.createElement('div');node.id=id;node.className='adc-design-created';Object.assign(node.style,{position:'fixed',left:x+'px',top:'700px',width:'100px',height:'60px',background:'#aaccee'});document.getElementById('adcLoginCanvas').append(node);}});
 await page.mouse.move(680,730);await page.mouse.down();await page.mouse.move(824,730,{steps:6});assert.ok(Math.abs((await page.locator('#moveBox').boundingBox()).x-800)<1);assert.ok(await page.locator('.adc-studio-laser.x').count());assert.ok(await page.locator('.adc-studio-laser.y').count());assert.match(await page.locator('#adcStudioDragMetrics').textContent(),/X 21\.17 cm/);await page.mouse.up();assert.equal(await page.locator('#adcStudioSmartGuides').isVisible(),false);
 await page.keyboard.down('Alt');await page.mouse.move(830,730);await page.mouse.down();await page.mouse.move(834,730,{steps:3});assert.ok(Math.abs((await page.locator('#moveBox').boundingBox()).x-804)<1);await page.keyboard.press('Escape');await page.mouse.up();await page.keyboard.up('Alt');assert.ok(Math.abs((await page.locator('#moveBox').boundingBox()).x-800)<1);assert.equal(await page.locator('#adcStudioSmartGuides').isVisible(),false);
}));

test('Studio avanzado: etiquetas y placeholders conservan valor, ID, name y listeners',()=>run(async page=>{
 const input=page.locator('#adcLoginEmail');await input.evaluate(n=>{n.placeholder='Ej.: Gomez';n.value='dato@adc.test';n.dataset.binding='perfil.email';n.addEventListener('change',()=>window.sameInput=true);window.originalInput=n;});
 const rect=await input.boundingBox();await page.mouse.dblclick(rect.x+50,rect.y+rect.height/2);const editor=page.locator('#adcStudioPlaceholderEditor');await editor.fill('Nuevo ejemplo');await editor.press('Enter');assert.equal(await input.getAttribute('placeholder'),'Nuevo ejemplo');assert.equal(await input.inputValue(),'dato@adc.test');
 await page.locator('[data-act=undo]').click();assert.equal(await input.getAttribute('placeholder'),'Ej.: Gomez');await page.locator('[data-act=redo]').click();
 const label=page.locator('label').filter({has:input});const lr=await label.boundingBox();await page.mouse.dblclick(lr.x+40,lr.y+5);await editor.fill('Correo del docente');await editor.press('Enter');assert.match(await label.textContent(),/Correo del docente/);assert.equal(await input.getAttribute('name'),'email');assert.equal(await input.getAttribute('data-binding'),'perfil.email');assert.equal(await input.evaluate(n=>n===window.originalInput),true);await input.dispatchEvent('change');assert.equal(await page.evaluate(()=>window.sameInput),true);
 const data=await exported(page);assert.ok(data.pages.ingreso.operations.some(op=>op.kind==='placeholder'));assert.ok(data.pages.ingreso.operations.some(op=>op.kind==='labelText'));
}));

test('Studio avanzado: capas reversibles, candado, paleta y brocha sin copiar identidad',()=>run(async page=>{
 await page.getByLabel('Panel',{exact:true}).selectOption('horizontal');
 await page.locator('.adc-feature').first().evaluate(n=>n.id='styleSource');const card=page.locator('#styleSource');await card.click({position:{x:100,y:8}});const originalIndex=await card.evaluate(n=>[...n.parentNode.children].indexOf(n));
 await page.locator('[data-studio-layer=front]').click();assert.equal(await card.evaluate(n=>n===n.parentNode.lastElementChild),true);await page.locator('[data-act=undo]').click();assert.equal(await card.evaluate(n=>[...n.parentNode.children].indexOf(n)),originalIndex);
 await card.click({position:{x:100,y:8}});await page.locator('[data-studio-layer=back]').click();assert.equal(await card.evaluate(n=>n===n.parentNode.firstElementChild),true);
 await page.locator('[data-studio-lock]').click();assert.equal(await card.getAttribute('data-adc-studio-locked'),'');const before=await card.boundingBox();await page.mouse.move(before.x+80,before.y+8);await page.mouse.down();await page.mouse.move(before.x+130,before.y+30);await page.mouse.up();const after=await card.boundingBox();assert.ok(Math.abs(after.x-before.x)<1&&Math.abs(after.y-before.y)<1);await page.locator('[data-studio-lock]').click();assert.equal(await card.getAttribute('data-adc-studio-locked'),null);
 await page.locator('[data-studio-palette] summary').click();await page.locator('[data-studio-swatch="#2453a3"]').click();assert.equal(await card.evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(36, 83, 163)');await page.locator('[data-studio-copy-style]').click();
 await page.locator('[data-studio-duplicate]').click();const copy=page.locator('.adc-feature').nth(1);await copy.evaluate(n=>{n.style.backgroundColor='red';n.style.fontFamily='monospace';});await page.locator('[data-studio-paste-style]').click();assert.equal(await copy.evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(36, 83, 163)');assert.equal(await copy.evaluate(n=>n===document.querySelector('.adc-feature')),false);
 const data=await exported(page);for(const kind of ['studioLayer','studioLock','studioFormat'])assert.ok(data.pages.ingreso.operations.some(op=>op.kind===kind));
}));
