const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os'),fs=require('node:fs');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
function seed(){
  adcSetSharedField('perfilApellidos','PRUEBA');adcSetSharedField('perfilNombres','ANA');adcSetSharedField('dni','30123456');
  inst=[];for(const name of ['Escuela A','Escuela B'])addInst({name,level:'Secundario',entries:[]});
  const fields=Object.fromEntries(dj02Fields.map(key=>[key,({Dni:'30123456',Clase:'1980',Presentada:'Escuela A',Sexo:'F'})[key]||'Dato '+key]));
  const row=(i)=>({articulo:'309',inciso:'B',motivo:'Antecedente '+i,desde:'2026-10-01',hasta:'2026-10-02',unidad:i%2?'Escuela A':'Escuela B',disposicion:String(i)});
  adcUserStorage.setItem('adc_dj02_v1',JSON.stringify({fields,rows:Array.from({length:22},(_,i)=>row(i)),pending:[{dni:'30123456',records:[{...row(99),motivo:'Pendiente de origen DL-01'}]}]}));
}
test('DJ02-VPI-01: prueba aislada, gestos protegidos, ciclo de licencias y salida equivalente',{timeout:120000},async()=>{
  const server=require('../tools/motor01-preview.cjs').createMotor01Server();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true}),output=fs.mkdtempSync(path.join(os.tmpdir(),'adc-dj02-vpi-'));
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},hasTouch:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
    await context.route(/^https:\/\//,route=>route.abort());await context.route('**/assets/datos/ajustes-pagina.json',route=>route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    const base=`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1&adc-inicio=1`;
    await page.goto(base+'&adc-dj02-vpi=1');await page.evaluate(seed);await page.evaluate(()=>adcMT2Documents.open('dj02'));
    const frame=page.locator('[data-adc-dj02-vpi-trial]'),viewport=frame.locator('.adc-mt2-viewport'),slider=frame.locator('.adc-pdf-navigation input');
    assert.equal(await frame.count(),1);assert.equal(await slider.getAttribute('min'),'25');assert.equal(await slider.getAttribute('max'),'200');
    assert.ok(await page.locator('.adc58-page-shell').count()>1);assert.equal(await page.locator('#dj02 .adc43-zoom').isVisible(),false);
    const field=page.locator('#dj02Preview [data-field=disposicion]').first();await field.fill('EDITADO VPI');await field.dispatchEvent('change');
    const before=await page.evaluate(()=>adcUserStorage.getItem('adc_dj02_v1'));
    await field.dispatchEvent('wheel',{deltaY:-100});await field.dispatchEvent('dblclick');assert.equal(await frame.getAttribute('class').then(value=>value.includes('adc-pdf-expanded')),false);
    await slider.evaluate(el=>{el.value='150';el.dispatchEvent(new Event('input',{bubbles:true}))});assert.equal(await field.inputValue(),'EDITADO VPI');
    assert.equal(await page.evaluate(()=>adcUserStorage.getItem('adc_dj02_v1')),before);
    await frame.evaluate(el=>{el.requestFullscreen=()=>Promise.reject(Error('Prueba fallback'))});
    const historyLength=await page.evaluate(()=>history.length);
    await viewport.dispatchEvent('dblclick');assert.equal(await frame.evaluate(el=>el.classList.contains('adc-pdf-expanded')),true);
    await viewport.dispatchEvent('dblclick');assert.equal(await frame.evaluate(el=>el.classList.contains('adc-pdf-expanded')),false);
    assert.equal(await page.evaluate(()=>history.length),historyLength);
    await viewport.evaluate(el=>{
      for(let i=0;i<2;i++){
        const touch=new Touch({identifier:1,target:el,clientX:50,clientY:70});
        el.dispatchEvent(new TouchEvent('touchstart',{touches:[touch],changedTouches:[touch],bubbles:true}));
        el.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[touch],bubbles:true,cancelable:true}));
      }
    });assert.equal(await frame.evaluate(el=>el.classList.contains('adc-pdf-expanded')),true);
    await frame.locator('.adc-pdf-floating-fullscreen').click();assert.equal(await frame.evaluate(el=>el.classList.contains('adc-pdf-expanded')),false);
    await slider.evaluate(el=>{el.value='50';el.dispatchEvent(new Event('input',{bubbles:true}))});
    const prior=await slider.inputValue();
    await viewport.evaluate(el=>{
      const touches=distance=>[new Touch({identifier:1,target:el,clientX:50,clientY:70}),new Touch({identifier:2,target:el,clientX:50+distance,clientY:70})];
      el.dispatchEvent(new TouchEvent('touchstart',{touches:touches(50),bubbles:true,cancelable:true}));
      el.dispatchEvent(new TouchEvent('touchmove',{touches:touches(80),bubbles:true,cancelable:true}));
      el.dispatchEvent(new TouchEvent('touchend',{touches:[],bubbles:true}));
    });assert.ok(Number(await slider.inputValue())>Number(prior));
    const beforeWheel=Number(await slider.inputValue());await viewport.dispatchEvent('wheel',{deltaY:-100,clientX:100,clientY:100});assert.ok(Number(await slider.inputValue())>beforeWheel);
    const protectedZoom=await slider.inputValue();await field.dispatchEvent('wheel',{deltaY:-100});await field.dispatchEvent('dblclick');
    assert.equal(await slider.inputValue(),protectedZoom);assert.equal(await frame.evaluate(el=>el.classList.contains('adc-pdf-expanded')),false);
    await slider.focus();await slider.press('ArrowLeft');assert.ok(Number(await slider.inputValue())<Number(protectedZoom));
    await slider.evaluate(el=>{el.value='150';el.dispatchEvent(new Event('input',{bubbles:true}))});
    await frame.locator('.adc-pdf-floating-fullscreen').click();await viewport.evaluate(el=>el.scrollLeft=100);
    await page.evaluate(()=>{document.activeElement?.blur();getSelection().removeAllRanges()});
    const rect=await viewport.boundingBox();const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.outerHTML.slice(0,220),{x:rect.x+200,y:rect.y+100});await page.mouse.move(rect.x+200,rect.y+100);await page.mouse.down();await page.mouse.move(rect.x+170,rect.y+100);await page.mouse.up();
    const drag=await viewport.evaluate(el=>({left:el.scrollLeft,width:el.clientWidth,scroll:el.scrollWidth,selection:String(getSelection()),classes:document.body.className}));
    assert.ok(drag.left>100,'Arrastre del fondo '+JSON.stringify({drag,hit,rect}));
    await frame.locator('.adc-pdf-floating-fullscreen').click();
    assert.equal(await field.inputValue(),'EDITADO VPI');assert.equal(await page.evaluate(()=>adcUserStorage.getItem('adc_dj02_v1')),before);
    await page.locator('#dj02').getByRole('button',{name:'+ Agregar licencia anterior',exact:true}).click();
    const added=page.locator('#dj02Preview tr.adc58-pending').last();
    for(const [key,value] of Object.entries({articulo:'309',motivo:'Licencia de prueba VPI',desde:'2026-11-01',hasta:'2026-11-02',unidad:'Escuela A'})){
      await added.locator(`[data-field=${key}]`).fill(value);await added.locator(`[data-field=${key}]`).dispatchEvent('change');
    }
    const id=await added.getAttribute('data-license'),record=()=>page.locator(`#dj02Preview tr[data-license="${id}"]`);
    await record().getByRole('button',{name:/Licencia otorgada/}).click();assert.match(await record().innerText(),/Otorgada/);
    await record().getByRole('button',{name:/Eliminar/}).click();assert.equal(await record().count(),0);
    await page.locator('#dj02').getByRole('button',{name:'Licencias eliminadas',exact:true}).click();await record().getByRole('button',{name:/Restaurar/}).click();
    await page.locator('#dj02').getByRole('button',{name:'Volver a licencias',exact:true}).click();assert.equal(await record().count(),1);
    await page.locator('#dj02HistoryFilter').selectOption('Escuela A');assert.equal(await page.locator('#dj02Preview [data-field=unidad]').evaluateAll(nodes=>nodes.every(el=>el.value==='Escuela A')),true);
    await page.locator('#dj02HistoryFilter').selectOption('');await page.evaluate(()=>dj02Save());
    const saved=await page.evaluate(()=>adcUserStorage.getItem('adc_dj02_v1'));await page.locator('.adc-mt2-document-back').click();await page.evaluate(()=>adcMT2Documents.open('dj02'));
    assert.equal(await page.evaluate(()=>adcUserStorage.getItem('adc_dj02_v1')),saved);
    for(const width of [390,1440]){
      await page.setViewportSize({width,height:1000});await frame.locator('[data-viewer-action=width]').click();
      const theme=width===390?'dark':'light';if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#adcThemeSwitch').click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.equal(await page.locator('#dj02Preview').evaluate(el=>getComputedStyle(el).overflow),'visible');
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.screenshot({path:path.join(output,`dj02-${width}.png`),fullPage:true});
    }
    // Comparar salida de impresión a PDF con el recorrido anterior, usando exactamente el mismo registro.
    const baseline=await context.newPage();await baseline.goto(base);await baseline.evaluate(value=>{adcSetSharedField('perfilApellidos','PRUEBA');adcSetSharedField('perfilNombres','ANA');adcSetSharedField('dni','30123456');adcUserStorage.setItem('adc_dj02_v1',value);tab('dj02')},saved);
    for(const tab of [page,baseline]){
      await tab.locator('#dj02 [data-view=print]').click();const review=tab.locator('.adc-review:visible');if(await review.count())await review.getByRole('button',{name:'Continuar igual',exact:true}).click();
      await tab.evaluate(()=>document.body.classList.add('dj02-print-mode'));await tab.emulateMedia({media:'print'});
    }
    const bytes=await Promise.all([page.pdf({preferCSSPageSize:true}),baseline.pdf({preferCSSPageSize:true})]);
    const summaries=[];for(const buffer of bytes)summaries.push(await page.evaluate(async data=>{
      const directory=new URL('assets/vendor/pdfjs/',location.href),pdfjs=await import(directory.href+'pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc=directory.href+'pdf.worker.min.mjs';
      const pdf=await pdfjs.getDocument({data:Uint8Array.from(data),isEvalSupported:false}).promise,result=[];
      for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);result.push({size:page.view,text:(await page.getTextContent()).items.map(item=>item.str).join(' ')})}await pdf.destroy();return result;
    },Array.from(buffer)));
    assert.deepEqual(summaries[0],summaries[1]);fs.writeFileSync(path.join(output,'DJ02-VPI.pdf'),bytes[0]);
    assert.deepEqual(errors,[]);console.log('Prueba DJ02-VPI-01: '+output);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
