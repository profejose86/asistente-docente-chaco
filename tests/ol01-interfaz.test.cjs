const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const modules=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(modules,'playwright'));

test('OL-01: tiradores históricos no cubren la plantilla y permiten editar y generar PDF',async()=>{
  const server=http.createServer((req,res)=>{
    if(require('./support/demo-config.cjs').serve(req,res))return;
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(error,bytes)=>{
      if(error)return res.writeHead(404).end();
      res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(bytes);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')||route.request().url().startsWith('blob:')?route.continue():route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?adc-preview=1`);
    await page.evaluate(()=>{
      inst=[];addInst({name:'IES San Fernando Rey',localidad:'Resistencia',office:'1438',level:'Superior',entries:[{type:'asignatura',subject:'Matemática',course:'2 1',revista:'Titular',turno:'Mañana',schedule:[2,0,0,0,0,0,0]}]});
      adcSetSharedField('perfilApellidos','Prueba');adcSetSharedField('perfilNombres','Docente');adcSetSharedField('dni','12345678');tab('tramites');
      $('sexo').value='M';$('perfilDomicilio').value='Calle de prueba';$('perfilLocalidad').value='Barranqueras';
    });
    await page.locator('.adc-form-catalog button').filter({hasText:'OL-01'}).click();
    // Reproduce también un ajuste guardado: no se elimina del almacenamiento.
    await page.locator('#adcOLLeft').evaluate(button=>Object.assign(button.style,{height:'1010px',width:'1331px',translate:'-31px'}));
    for(const width of [320,390,768,1440]){
      await page.setViewportSize({width,height:1000});
      for(const id of ['adcOLLeft','adcOLRight']){
        const bounds=await page.locator('#'+id).boundingBox();
        assert.ok(bounds.width<=28&&bounds.height<=24,`${id} a ${width}px`);
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`sin desborde a ${width}px `+await page.evaluate(()=>JSON.stringify([...document.querySelectorAll('body *')].filter(n=>n.getClientRects().length&&n.getBoundingClientRect().right>innerWidth+2&&!n.closest('.adc-ol-scroll')).map(n=>[n.tagName,n.id,n.className,n.getBoundingClientRect().width]).slice(0,10))));
      const input=page.locator('#adcOL [name=teacherGiven]');
      await input.click();
      assert.equal(await page.evaluate(()=>document.activeElement.name),'teacherGiven');
    }
    await page.locator('#adcOLQuery').fill('enfermedad');
    await page.locator('#adcOLSuggestions button').filter({hasText:'Enfermedad o lesión común'}).click();
    const school=await page.locator('#adcOL [name=school] option').nth(1).getAttribute('value');
    await page.locator('#adcOL [name=school]').selectOption(school);
    assert.ok(await page.locator('#adcOLPosts input:checked').count());
    await page.locator('#adcOL [name=from]').fill('2026-12-01');
    await page.locator('#adcOL [name=until]').fill('2026-12-02');
    await page.locator('#adcOL [data-ol-action=preview]').first().click();
    await page.waitForSelector('#adcOLPreview iframe');
    const pdf=await page.locator('#adcOLPreview iframe').evaluate(async frame=>{
      const bytes=await(await fetch(frame.src)).arrayBuffer();return {length:bytes.byteLength,pages:(await PDFLib.PDFDocument.load(bytes)).getPageCount()};
    });
    assert.equal(pdf.pages,1);assert.ok(pdf.length>10000);
    assert.match(await page.locator('#adcOLStatus').textContent(),/lista/);
    assert.deepEqual(errors,[]);
    const output=fs.mkdtempSync(path.join(os.tmpdir(),'adc-ol01-layout-'));
    await page.locator('#adcOLSheet').screenshot({path:path.join(output,'formulario.png')});
    console.log('Vista OL-01 verificada:',output);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
