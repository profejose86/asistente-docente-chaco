const {chromium}=require('C:/Users/CONECTIA BA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.png':'image/png','.css':'text/css','.pdf':'application/pdf'})[path.extname(file)]||'text/plain'});res.end(error?'Missing':data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',route=>route.fulfill({path:'C:/Users/CONECTIA BA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdf-lib/dist/pdf-lib.min.js',contentType:'text/javascript'}));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.evaluate(()=>{inst[0].name='IES San Fernando Rey';addInst({name:'EES 83'});localStorage.setItem('adc_v08',JSON.stringify(data()));});
  await page.locator('#adcTramitesToggle').click();await page.locator('#tabSC01').click();
  const school=page.locator('#adcSC01Sheet [name=institucion]');
  if(await school.inputValue()!=='IES San Fernando Rey')throw Error('Falta selección inicial');
  const picker=page.getByLabel('Desplegar instituciones del perfil',{exact:true});
  if(await picker.locator('option').count()!==2)throw Error('Faltan opciones');
  await picker.selectOption({label:'EES 83'});
  if(await school.inputValue()!=='EES 83')throw Error('Fallo de selector');
  await school.fill('San Fernando');await school.blur();
  if(await school.inputValue()!=='EES 83')throw Error('No se restaura selección válida');
  await picker.selectOption({label:'IES San Fernando Rey'});
  await page.locator('#adcDesignGear').click();
  await page.locator('#adcAnnotationWidth').fill('5');
  await page.locator('#adcAnnotationWidth').dispatchEvent('change');
  await page.locator('#adcDesignPanel [data-act=line]').click();
  const field=page.getByLabel('Motivo de la solicitud',{exact:true});
  await field.scrollIntoViewIfNeeded();
  const box=await field.boundingBox();
  await page.mouse.move(box.x+10,box.y+box.height-1);
  await page.mouse.down();await page.mouse.move(box.x+250,box.y+box.height-1,{steps:12});await page.mouse.up();
  const line=page.locator('#adcSC01Sheet .adc-design-annotation.line');
  if(await line.count()!==1)throw Error('No se dibujó la línea en SC-01');
  if(await line.evaluate(node=>node.style.getPropertyValue('--adc-note-width'))!=='5px')throw Error('Grosor incorrecto');
  await page.locator('#adcAnnotationWidth').fill('7');await page.locator('#adcAnnotationWidth').dispatchEvent('change');
  if(await line.evaluate(node=>node.style.getPropertyValue('--adc-note-width'))!=='7px')throw Error('No cambia grosor seleccionado');
  await page.locator('#adcDesignPanel [data-act=save]').click();
  await page.reload();await page.locator('#adcTramitesToggle').click();await page.locator('#tabSC01').click();
  await page.locator('#adcDesignGear').click();
  if(await line.count()!==1)throw Error('No se recuperó la línea');
  if(await line.evaluate(node=>node.style.getPropertyValue('--adc-note-width'))!=='7px')throw Error('No se recuperó grosor');
  await field.scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(root,'tmp/sc01-lineas.png')});
  if(errors.length)throw Error(errors.join('\n'));
  console.log('OK: instituciones, selector, selección válida, línea horizontal, grosor, guardado y recuperación');
 }finally{await browser.close();server.close();}
})();
