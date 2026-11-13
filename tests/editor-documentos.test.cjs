const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
test('Documentos: doble clic sostenido, ocho extremos, proporciones, deshacer y exportación',async()=>{
  const server=http.createServer((req,res)=>{
    if(require('./support/demo-config.cjs').serve(req,res))return;
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1800,height:2400}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?adc-preview=1`);
    await page.evaluate(()=>adcSC01Open());
    await page.locator('#adcDesignGear').click();
    const sheet=page.locator('#adcSC01Sheet');await sheet.scrollIntoViewIfNeeded();
    const before=await sheet.boundingBox();
    const start={x:before.x+before.width*.8,y:before.y+40};
    await page.mouse.click(start.x,start.y);
    await page.mouse.move(start.x,start.y);await page.mouse.down({clickCount:2});await page.mouse.move(start.x+35,start.y+28,{steps:6});await page.mouse.up();
    assert.equal(await sheet.getAttribute('data-adc-design-selected'),'');
    await page.waitForSelector('[data-document-grip=se]');
    assert.equal(await page.locator('[data-document-grip]').count(),8);
    const moved=await sheet.boundingBox();assert.ok(Math.abs(moved.x-before.x-35)<3);assert.ok(Math.abs(moved.y-before.y-28)<3);
    const grip=await page.locator('[data-document-grip=se]').boundingBox();
    await page.mouse.move(grip.x+7,grip.y+7);await page.mouse.down();await page.mouse.move(grip.x+67,grip.y+87,{steps:6});await page.mouse.up();
    const resized=await sheet.boundingBox();assert.ok(resized.width>moved.width+30);assert.ok(Math.abs(resized.width/resized.height-before.width/before.height)<0.001);
    await page.locator('[data-act=undo]').click();const undone=await sheet.boundingBox();assert.ok(Math.abs(undone.width-moved.width)<2);
    await page.locator('[data-act=redo]').click();assert.ok((await sheet.boundingBox()).width>moved.width+30);
    const download=page.waitForEvent('download');await page.locator('[data-project-export]').click();
    const data=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));assert.ok(data.pages.pagina.operations.some(op=>op.kind==='documentTransform'&&op.target==='project:#adcSC01Sheet'));
    await page.locator('#adcDesignGear').click();assert.equal(await page.locator('[data-document-grip]').count(),0);
    // Soporte común: páginas preparadas, BD-02, DJ-02 y visor nativo.
    await page.evaluate(()=>{adcSC01Open();const host=document.querySelector('#adcSC01');for(const className of ['adc-bd02-document','dj02-paper','adc-design-pdf']){const node=document.createElement('div');node.className=className;node.dataset.testPaper=className;Object.assign(node.style,{width:'400px',height:'200px',background:'#fff',marginLeft:'400px'});host.append(node);}const preview=document.createElement('div');preview.className='adc-official-preview';preview.dataset.testPaper='iframe';Object.assign(preview.style,{width:'400px',height:'200px',marginLeft:'400px'});const iframe=document.createElement('iframe');iframe.srcdoc='<p>PDF simulado</p>';Object.assign(iframe.style,{width:'100%',height:'100%'});preview.append(iframe);host.append(preview);});
    await page.locator('#adcDesignGear').click();
    for(const name of ['adc-bd02-document','dj02-paper','adc-design-pdf','iframe']){
      const paper=page.locator('[data-test-paper="'+name+'"]');await paper.scrollIntoViewIfNeeded();const r=await paper.boundingBox();await page.mouse.dblclick(r.x+30,r.y+30);assert.equal(await paper.getAttribute('data-adc-design-selected'),'');assert.equal(await page.locator('[data-document-grip]').count(),8);
    }
    await page.locator('#adcDesignGear').click();assert.equal(await page.locator('.adc-document-editor-shield').count(),0);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
