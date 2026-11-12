const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(runtime,'playwright'));
const root=path.resolve(__dirname,'..');

test('Ajustes permite superponer creaciones y recuperar su orden y posición',{timeout:60000},async()=>{
 const server=http.createServer((request,response)=>{
  const file=path.resolve(root,'.'+new URL(request.url,'http://local').pathname.replace(/^\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
  fs.readFile(file,(error,bytes)=>{
   if(error){response.writeHead(404).end();return;}
   response.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.pdf':'application/pdf'})[path.extname(file)]||'application/octet-stream');
   response.end(bytes);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1200}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
   if(route.request().url().includes('cdn.jsdelivr.net/npm/pdf-lib'))return route.fulfill({path:path.join(runtime,'pdf-lib/dist/pdf-lib.min.js'),contentType:'application/javascript'});
   if(route.request().url().startsWith('http://127.0.0.1:'))return route.continue();
   return route.abort();
  });
  const url=`http://127.0.0.1:${server.address().port}`;
  await page.goto(url);
  await page.evaluate(()=>adcOLStart(false));
  await page.locator('#adcDesignGear').click();
  await page.locator('#adcOLSheet').scrollIntoViewIfNeeded();
  const paper=await page.locator('.adc-ol-paper').boundingBox();
  await page.locator('#adcDesignPanel [data-act=box]').click();
  await page.mouse.move(paper.x+150,paper.y+8);
  await page.mouse.down();await page.mouse.move(paper.x+300,paper.y+40,{steps:8});await page.mouse.up();
  const box=page.locator('#adcOL > .adc-design-created').filter({hasText:'Escribí acá'});
  assert.equal(await box.count(),1);
  assert.equal(await box.evaluate(node=>node.style.position),'absolute');

  const replies=['Botón de prueba','0','azul'];
  page.on('dialog',dialog=>dialog.accept(replies.shift()||'auto'));
  await page.locator('#adcDesignPanel [data-act=button]').click();
  await page.mouse.click(paper.x+420,paper.y+16);
  const button=page.locator('#adcOL > button.adc-design-created');
  assert.equal(await button.count(),1);
  async function drag(locator,x,y,fromRight=false){
   const bounds=await locator.boundingBox();
   await page.mouse.move(bounds.x+(fromRight?bounds.width-12:12),bounds.y+bounds.height/2);
   await page.mouse.down();await page.mouse.move(x,y,{steps:12});await page.mouse.up();
  }
  const buttonBounds=await button.boundingBox();
  await drag(box,buttonBounds.x-100,buttonBounds.y+buttonBounds.height/2);
  const boxBounds=await box.boundingBox();
  assert.ok(boxBounds.x+boxBounds.width>buttonBounds.x,'La caja debe poder solaparse con el botón');
  assert.ok(Number(await box.evaluate(node=>node.style.zIndex))>Number(await button.evaluate(node=>node.style.zIndex)));
  await drag(button,buttonBounds.x+60,buttonBounds.y+buttonBounds.height/2+8,true);
  assert.ok(Number(await button.evaluate(node=>node.style.zIndex))>Number(await box.evaluate(node=>node.style.zIndex)));
  assert.equal(await button.evaluate(node=>{
   const a=node.getBoundingClientRect(),b=document.querySelector('#adcOL > .adc-design-created:not(button)').getBoundingClientRect();
   const x=(Math.max(a.left,b.left)+Math.min(a.right,b.right))/2;
   const y=(Math.max(a.top,b.top)+Math.min(a.bottom,b.bottom))/2;
   return document.elementFromPoint(x,y)?.closest('.adc-design-created')===node;
  }),true,'El último elemento movido debe recibir los clics en el área superpuesta');
  const before=await button.boundingBox();
  const position=await button.evaluate(node=>[node.style.left,node.style.top,node.style.translate]);
  await page.locator('#adcDesignPanel [data-act=save]').click();
  await page.reload();await page.evaluate(()=>adcOLStart(false));
  await page.locator('#adcDesignGear').click();
  const after=await button.boundingBox();
  assert.ok(Math.abs(before.width-after.width)<1&&Math.abs(before.height-after.height)<1);
  assert.deepEqual(await button.evaluate(node=>[node.style.left,node.style.top,node.style.translate]),position);
  assert.ok(Number(await button.evaluate(node=>node.style.zIndex))>Number(await box.evaluate(node=>node.style.zIndex)));
  assert.equal(await page.locator('#adcOL > .adc-design-created').count(),2);
  await page.locator('#adcOLSheet').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(os.tmpdir(),'adc-editor-superposicion.png')});
  assert.deepEqual(errors,[]);
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
});
