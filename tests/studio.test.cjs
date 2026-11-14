const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const contract=require('../assets/js/editor/ajustes-proyecto-datos.js'),root=path.resolve(__dirname,'..');
async function withPage(run){
 const server=http.createServer((req,res)=>{
  if(require('./support/demo-config.cjs').serve(req,res))return;
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data);});
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{const page=await browser.newPage({viewport:{width:1500,height:1100}});page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/assets/datos/ajustes-pagina.json',r=>r.fulfill({json:contract.empty()}));await run(page,'http://127.0.0.1:'+server.address().port);assert.deepEqual(errors,[]);}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
test('Studio: pestañas, edición directa, inspector cm, duplicación, historial, presets, colores y simulador seguro',()=>withPage(async(page,base)=>{
 await page.goto(base+'/ADC_Ingreso_Editable.html');await require('./support/ajustes.cjs').clickGear(page);
 assert.equal(await page.locator('[role=tab]').count(),5);assert.equal(await page.locator('[data-commit-local]').isVisible(),true);
 assert.equal(await page.locator('[data-element-action=add-box]').count(),0);assert.equal(await page.locator('#adcDesignPanel button:not([title])').count(),0);
 await page.getByLabel('Panel',{exact:true}).selectOption('horizontal');assert.ok((await page.locator('#adcDesignPanel').boundingBox()).width>800);await page.getByLabel('Panel',{exact:true}).selectOption('vertical');
 await page.evaluate(()=>{const b=document.createElement('button');b.id='studioTest';b.type='button';b.textContent='Bloque de prueba';Object.assign(b.style,{position:'fixed',left:'800px',top:'720px',width:'180px',height:'60px'});document.getElementById('adcLoginCanvas').append(b);});
 const node=page.locator('#studioTest');await page.mouse.move(860,750);await page.waitForSelector('#adcStudioHover:not([hidden])');assert.equal(await page.locator('[data-studio-grip]').count(),8);
 await page.mouse.down();await page.mouse.move(900,770,{steps:5});await page.mouse.up();let box=await node.boundingBox();assert.ok(box.x>825);assert.equal(await page.locator('#adcStudioInspector').isVisible(),true);
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(60);const edge=page.locator('[data-studio-grip=e]');await edge.hover();await page.mouse.down();await page.mouse.move(box.x+box.width+45,box.y+box.height/2,{steps:5});await page.mouse.up();box=await node.boundingBox();assert.ok(box.width>210);
 await page.keyboard.press('ArrowRight');await page.keyboard.press('Control+d');assert.equal(await page.locator('button').filter({hasText:'Bloque de prueba'}).count(),2);
 await page.keyboard.press('Delete');assert.equal(await page.locator('[data-adc-design-hidden]').count(),1);await page.locator('[data-act=undo]').click();assert.equal(await page.locator('[data-adc-design-hidden]').count(),0);
 await page.locator('.adc-studio-history summary').click();const count=await page.locator('[data-history-count]').count();assert.ok(count>1);await page.locator('[data-history-count]').first().click();await page.locator('[data-act=redo]').click();
 await page.getByRole('tab',{name:'Plantillas',exact:true}).click();await page.getByRole('button',{name:'Aviso al docente',exact:true}).click();assert.equal(await page.locator('.adc-preset-alert').count(),1);
 await page.getByRole('tab',{name:'Proyecto / Borradores',exact:true}).click();await page.locator('[data-studio-theme=primary]').fill('#345678');await page.getByRole('button',{name:'Aplicar colores',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--adc-brand-primary')),'#345678');
 const download=page.waitForEvent('download');await page.locator('[data-project-export]').click();const saved=contract.validate(JSON.parse(fs.readFileSync(await(await download).path(),'utf8')));assert.ok(saved.pages.ingreso.operations.some(op=>op.kind==='theme'));
 await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=4;canvas.height=4;canvas.getContext('2d').fillRect(0,0,4,4);document.getElementById('adcLoginCanvas').append(canvas);});
 await page.locator('#adcLoginPassword').fill('NO-DEBE-SALIR-EN-PREVIEW');await page.getByLabel('Vista',{exact:true}).selectOption('phone');await page.waitForSelector('.adc-studio-device iframe');
 const frame=page.frameLocator('.adc-studio-device iframe');assert.equal(await frame.locator('#adcDesignPanel').count(),0);assert.equal(await frame.locator('#adcLoginPassword').inputValue(),'');assert.equal(await frame.locator('body').evaluate(()=>innerWidth),390);assert.equal(await frame.locator('canvas').count(),0);assert.match(await frame.locator('img[alt="Vista del documento"]').getAttribute('src'),/^data:image\/png/);await page.getByRole('button',{name:'Cerrar vista',exact:true}).click();
}));
test('Studio: reglas movibles/redimensionables, guías guardables y snapping sin grilla con Alt',()=>withPage(async(page,base)=>{
 await page.goto(base+'/ADC_Ingreso_Editable.html');await require('./support/ajustes.cjs').clickGear(page);
 const ruler=page.locator('.adc-studio-ruler.x'),initial=await ruler.boundingBox();
 const grip=page.locator('.adc-studio-ruler.x [data-ruler-move]');await grip.hover();await page.mouse.down();await page.mouse.move(initial.x-12+20,initial.y+12+25,{steps:4});await page.mouse.up();let moved=await ruler.boundingBox();assert.ok(moved.x>initial.x+10);assert.ok(moved.y>initial.y+15);
 const resize=page.locator('.adc-studio-ruler.x [data-ruler-resize]');const resizeBox=await resize.boundingBox();await resize.hover();await page.mouse.down();await page.mouse.move(resizeBox.x+resizeBox.width/2+40,resizeBox.y+12,{steps:4});await page.mouse.up();assert.ok((await ruler.boundingBox()).width>moved.width+30);
 const beforeCancel=await ruler.boundingBox();await grip.hover();await page.mouse.down();await page.mouse.move(beforeCancel.x+70,beforeCancel.y+45,{steps:3});await page.keyboard.press('Escape');await page.mouse.up();assert.deepEqual(await ruler.boundingBox(),beforeCancel);
 const vertical=await page.locator('.adc-studio-ruler.y').boundingBox();await page.mouse.move(vertical.x+12,vertical.y+80);await page.mouse.down();await page.mouse.move(800,400,{steps:5});await page.mouse.up();assert.equal(await page.locator('.adc-studio-guide').count(),1);
 await page.evaluate(()=>{const b=document.createElement('button');b.id='snapTest';b.textContent='Imán';Object.assign(b.style,{position:'fixed',left:'650px',top:'700px',width:'120px',height:'40px'});document.getElementById('adcLoginCanvas').append(b);});
 await page.mouse.move(680,720);await page.mouse.down();await page.mouse.move(825,720,{steps:4});await page.mouse.up();assert.ok(Math.abs((await page.locator('#snapTest').boundingBox()).x-800)<2);
 await page.keyboard.down('Alt');await page.mouse.move(830,720);await page.mouse.down();await page.mouse.move(833,720,{steps:3});await page.mouse.up();await page.keyboard.up('Alt');assert.ok((await page.locator('#snapTest').boundingBox()).x>801);
 await page.getByRole('tab',{name:'Proyecto / Borradores',exact:true}).click();const download=page.waitForEvent('download').catch(async error=>{throw Error('Exportacion: '+await page.locator('[data-status]').textContent());});await page.locator('[data-project-export]').click();const data=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));assert.ok(data.pages.ingreso.operations.some(op=>op.kind==='studioGuide'));
}));
test('Studio: campos oficiales y contenedores anclados; notas y presets siguen permitidos',()=>withPage(async(page,base)=>{
 await page.goto(base+'/index.html?adc-preview=1');await require('./support/ajustes.cjs').clickGear(page);
 await page.evaluate(()=>{document.getElementById('license').classList.remove('hide');const box=document.createElement('div');box.id='officialLocked';Object.assign(box.style,{position:'fixed',left:'850px',top:'300px',width:'250px',height:'100px',background:'#fff'});box.innerHTML='<label>Dato obligatorio<input id="officialRequired" name="obligatorio" required value="Conservar"></label>';document.getElementById('license').append(box);});
 const before=await page.locator('#officialLocked').boundingBox();await page.mouse.move(900,380);await page.mouse.down();await page.mouse.move(1000,430,{steps:5});await page.mouse.up();assert.deepEqual(await page.locator('#officialLocked').boundingBox(),before);await page.keyboard.press('Delete');assert.equal(await page.locator('#officialRequired').inputValue(),'Conservar');assert.equal(await page.locator('#officialRequired').getAttribute('required'),'');
 assert.equal(await page.evaluate(()=>adcStudioPolicy.allows({kind:'text',target:'test'},()=>document.getElementById('officialLocked'))),false);
 for(const id of ['dj','dj02','license'])assert.equal(await page.evaluate(id=>{const node=document.createElement('input');node.required=true;document.getElementById(id).append(node);const anchored=adcStudioPolicy.anchored(node);node.remove();return anchored;},id),true);
 await page.getByRole('tab',{name:'Plantillas',exact:true}).click();await page.getByRole('button',{name:'Aviso al docente',exact:true}).click();assert.ok(await page.locator('.adc-preset-alert').count());
}));
test('Studio online: cinco clics revelan el panel sólo en esa pestaña, sin acceso al puente local',()=>withPage(async(page,base)=>{
 const local=[];page.on('request',request=>{if(request.url().includes('localhost:3005'))local.push(request.url());});
 await page.route('https://adc-online.example/**',async route=>{const response=await fetch(base+new URL(route.request().url()).pathname);await route.fulfill({status:response.status,headers:{'Content-Type':response.headers.get('content-type')},body:Buffer.from(await response.arrayBuffer())});});
 await page.goto('https://adc-online.example/ADC_Ingreso_Editable.html');assert.equal(await page.locator('html').getAttribute('data-adc-local-editor'),null);
 for(let i=0;i<4;i++)await page.locator('#adcDesignGear').click();assert.notEqual(await page.locator('#adcDesignGear').getAttribute('data-adc-locked'),null);
 await page.locator('#adcDesignGear').click();await require('./support/ajustes.cjs').clickGear(page);assert.equal(await page.getByRole('tab',{name:'Plantillas',exact:true}).isVisible(),true);assert.equal(await page.locator('[data-commit-local]').count(),0);assert.equal(await page.locator('[data-studio-local-disabled]').isDisabled(),true);assert.deepEqual(local,[]);
}));
