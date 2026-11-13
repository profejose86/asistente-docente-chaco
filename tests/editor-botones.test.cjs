const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
for(const screen of ['ADC_Ingreso_Editable.html','index.html?adc-preview=1'])test(screen+': doble clic, arrastre sobre otro elemento, tamaño y navegación',async()=>{
  const server=http.createServer((req,res)=>{
    if(require('./support/demo-config.cjs').serve(req,res))return;
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1600,height:1200}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/${screen}`);
    await page.evaluate(()=>{
      const host=document.querySelector('#adcLoginCanvas,#profile');
      const button=document.createElement('button');button.id='adcMouseButton';button.type='button';button.textContent='Botón de prueba';
      Object.assign(button.style,{position:'fixed',left:'600px',top:'300px',width:'140px',height:'44px'});
      window.mouseActions=0;button.onclick=()=>window.mouseActions++;
      const blocker=document.createElement('div');blocker.id='adcMouseBlocker';Object.assign(blocker.style,{position:'fixed',left:'850px',top:'280px',width:'240px',height:'160px',background:'red',zIndex:'10'});
      host.append(button,blocker);
    });
    await page.locator('#adcDesignGear').click();
    await page.locator('#adcMouseButton').dblclick();
    assert.equal(await page.evaluate(()=>mouseActions),0);
    assert.equal(await page.locator('#adcMouseButton').getAttribute('data-adc-design-selected'),'');
    assert.equal(await page.locator('#adcMouseButton').evaluate(node=>getComputedStyle(node).outlineStyle),'dashed');
    await page.waitForSelector('#adcDesignMarks .adc-edge');
    await page.mouse.move(650,320);await page.mouse.down();await page.mouse.move(950,320,{steps:8});await page.mouse.up();
    let box=await page.locator('#adcMouseButton').boundingBox();assert.ok(box.x>880,'se permite cruzar y solapar el bloque');
    assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('button')?.id,{x:box.x+50,y:box.y+20}),'adcMouseButton');
    await page.waitForFunction(()=>document.querySelector('#adcDesignMarks .adc-edge'));
    await page.mouse.move(box.x+box.width,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width+60,box.y+box.height/2,{steps:6});await page.mouse.up();
    box=await page.locator('#adcMouseButton').boundingBox();assert.ok(box.width>180,'redimensionado con mouse');
    assert.equal(await page.locator('#adcMouseButton').evaluate(node=>getComputedStyle(node).outlineStyle),'dashed');
    await page.locator('[data-act=undo]').click();assert.ok((await page.locator('#adcMouseButton').boundingBox()).width<160);
    await page.locator('[data-act=redo]').click();assert.ok((await page.locator('#adcMouseButton').boundingBox()).width>180);
    const download=page.waitForEvent('download');await page.locator('[data-project-export]').click();
    const output=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
    const operations=Object.values(output.pages)[0].operations;
    assert.ok(operations.some(op=>op.kind==='front'&&op.target==='project:#adcMouseButton'));
    assert.ok(operations.some(op=>op.kind==='style'&&op.target==='project:#adcMouseButton'&&op.x>250));
    await page.locator('#adcDesignGear').click();await page.locator('#adcMouseButton').click();assert.equal(await page.evaluate(()=>mouseActions),1);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
