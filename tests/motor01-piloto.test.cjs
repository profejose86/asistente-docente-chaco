const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const key='adc-official-form-incapacidad-draft-v1';
test('MOTOR-01: apertura directa, guardado comprobado y salidas bloqueadas sin pérdida',{timeout:90000},async()=>{
  const server=require('../tools/motor01-preview.cjs').createMotor01Server();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https:\/\//,route=>route.abort());
    await page.route('**/assets/datos/ajustes-pagina.json',route=>route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    const url=`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`;
    await page.goto(url);assert.equal(await page.locator('[data-adc-motor01-entry]').count(),0);
    await page.goto(url+'&adc-motor01=incapacidad');
    const entry=page.locator('[data-adc-motor01-entry]'),form=page.locator('#adcOfficialForm'),field=name=>form.locator(`[data-adc-field="${name}"]`);
    assert.equal(await page.locator('#adcTramitesMenu .adc-form-catalog [data-adc-motor01-entry]').count(),1);
    assert.equal(await page.locator('#profile').isVisible(),false);
    assert.equal(await entry.isVisible(),true);
    await page.locator('#tabP').click();
    assert.equal(await page.locator('#profile').isVisible(),true);assert.equal(await entry.isVisible(),false);
    assert.equal(await page.locator('#profile [data-adc-motor01-entry]').count(),0);
    await page.locator('#adcTramitesToggle').click();assert.equal(await entry.isVisible(),true);
    await page.evaluate(k=>{localStorage.setItem(k,JSON.stringify({schemaVersion:2,values:{apellido:'Histórico ficticio',observaciones:'Dato histórico'},marked:[]}));localStorage.setItem('adc-official-form-cf01-draft-v1','conservar otro borrador')},key);
    const beforeInvalid=await page.evaluate(k=>localStorage.getItem(k),key);
    assert.equal((await page.evaluate(()=>adcMotor01Pilot.abrir({formId:'dp01'}))).estado,'identidad-no-admitida');
    assert.equal((await page.evaluate(()=>adcMotor01Pilot.abrir({instanceId:'otro'}))).estado,'identidad-no-admitida');
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),beforeInvalid);
    await entry.getByRole('button',{name:'Abrir INCAPACIDAD',exact:true}).click();
    assert.equal(await form.getAttribute('data-adc-form-id'),'incapacidad');assert.equal(await field('apellido').inputValue(),'Histórico ficticio');
    await field('apellido').fill('Edición ficticia');
    assert.equal((await page.evaluate(()=>adcMotor01Pilot.guardar())).estado,'guardado-local');
    assert.equal(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key)).values.apellido,'Edición ficticia');
    // Otro intento de abrir la misma instancia no recarga ni pierde cambios sin evento.
    await field('apellido').evaluate(el=>el.value='Captura pendiente');
    assert.equal((await page.evaluate(()=>adcMotor01Pilot.abrir())).estado,'abierto');assert.equal(await field('apellido').inputValue(),'Captura pendiente');
    assert.equal(await entry.isVisible(),false);
    await page.evaluate(()=>{window.originalPilotStore=adcUserStorage;window.adcUserStorage={...adcUserStorage,setItem(){throw Error('Cuota simulada')}}});
    const disk=await page.evaluate(k=>localStorage.getItem(k),key);
    await form.locator('[data-adc-official-back]').click();
    assert.equal(await form.isVisible(),true);assert.equal(await field('apellido').inputValue(),'Captura pendiente');
    assert.equal(await entry.isVisible(),false);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),disk);
    assert.match(await form.locator('[data-adc-official-status]').innerText(),/sigue abierto/);
    assert.equal(await page.evaluate(()=>tab('profile')),false);assert.equal(await form.isVisible(),true);
    assert.equal((await page.evaluate(()=>adcMotor01Pilot.cerrar())).estado,'bloqueado');
    await page.evaluate(()=>document.querySelector('[data-adc-official-form=cf01]').click());
    assert.equal(await form.getAttribute('data-adc-form-id'),'incapacidad');
    assert.equal(await page.evaluate(()=>localStorage.getItem('adc-official-form-cf01-draft-v1')),'conservar otro borrador');
    // Una escritura silenciosamente omitida tampoco confirma el guardado.
    await field('apellido').evaluate(el=>el.value='Nueva captura sin persistir');
    await page.evaluate(()=>window.adcUserStorage={...originalPilotStore,setItem(){}});
    assert.equal((await page.evaluate(()=>adcMotor01Pilot.guardar())).estado,'error');
    assert.equal((await page.evaluate(()=>adcMotor01Pilot.cerrar())).estado,'bloqueado');
    await page.evaluate(()=>window.adcUserStorage=originalPilotStore);
    assert.equal((await page.evaluate(()=>adcMotor01Pilot.cerrar())).estado,'cerrado');
    assert.equal(await form.isVisible(),false);
    assert.equal(await entry.isVisible(),true);
    assert.equal(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key)).values.apellido,'Nueva captura sin persistir');
    await entry.getByRole('button',{name:'Abrir INCAPACIDAD',exact:true}).click();assert.equal(await field('apellido').inputValue(),'Nueva captura sin persistir');
    await field('apellido').fill('Salida por perfil');await page.locator('#tabP').click();assert.equal(await form.isVisible(),false);
    assert.equal(await entry.isVisible(),false);assert.equal(await page.locator('#profile').isVisible(),true);
    await page.reload();await entry.getByRole('button',{name:'Abrir INCAPACIDAD',exact:true}).click();
    assert.equal(await field('apellido').inputValue(),'Salida por perfil');
    assert.equal(await page.evaluate(()=>localStorage.getItem('adc-official-form-cf01-draft-v1')),'conservar otro borrador');
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
test('MOTOR-01: la URL sola no habilita el experimento en el servidor demo normal',{timeout:30000},async()=>{
  const server=require('./support/md01-server.cjs').createMd01Server();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage();await page.route(/^https:\/\//,r=>r.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1&adc-motor01=incapacidad`);
    assert.equal(await page.locator('[data-adc-motor01-entry]').count(),0);assert.equal(await page.evaluate(()=>typeof adcMotor01Pilot),'undefined');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
test('INCAPACIDAD: doble clic alterna pantalla completa y botón flotante restaura la vista',{timeout:60000},async()=>{
  const server=require('../tools/motor01-preview.cjs').createMotor01Server();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https:\/\//,r=>r.abort());
    await page.route('**/assets/datos/ajustes-pagina.json',r=>r.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1&adc-motor01=incapacidad`);
    await page.getByRole('button',{name:'Abrir INCAPACIDAD',exact:true}).click();
    const form=page.locator('#adcOfficialForm'),viewer=form.locator('.adc-pdf-viewer'),viewport=viewer.locator('.adc-document-viewport'),icon=viewer.locator('.adc-pdf-floating-fullscreen'),field=form.locator('[data-adc-field=apellido]');
    await field.fill('Prueba pantalla completa');
    await viewport.dblclick({position:{x:12,y:100}});
    await page.waitForFunction(()=>document.fullscreenElement?.classList.contains('adc-pdf-viewer'));
    assert.equal(await icon.getAttribute('aria-label'),'Restaurar vista del documento');
    await viewport.dblclick({position:{x:12,y:100}});await page.waitForFunction(()=>!document.fullscreenElement);
    await icon.click();await page.waitForFunction(()=>Boolean(document.fullscreenElement));
    await icon.click();await page.waitForFunction(()=>!document.fullscreenElement);
    await viewer.evaluate(el=>el.requestFullscreen=undefined);
    await viewport.dblclick({position:{x:12,y:100}});assert.equal(await viewer.evaluate(el=>el.classList.contains('adc-pdf-expanded')),true);
    await viewport.dblclick({position:{x:12,y:100}});assert.equal(await viewer.evaluate(el=>el.classList.contains('adc-pdf-expanded')),false);
    await field.dblclick();assert.equal(await viewer.evaluate(el=>el.classList.contains('adc-pdf-expanded')),false);
    for(const width of [390,1440]){
      await page.setViewportSize({width,height:1000});
      for(const theme of ['light','dark']){
        await page.locator('html').evaluate((el,t)=>el.dataset.theme=t,theme);
        await icon.scrollIntoViewIfNeeded();
        const box=await icon.boundingBox(),bounds=await viewer.boundingBox();
        assert.ok(box.width>=44&&box.height>=44);assert.ok(Math.abs(bounds.x+bounds.width-box.x-box.width-14)<2);assert.ok(Math.abs(box.y-bounds.y-14)<2);
        assert.equal(await icon.evaluate(el=>document.elementFromPoint(el.getBoundingClientRect().x+22,el.getBoundingClientRect().y+22)?.closest('.adc-pdf-floating-fullscreen')===el),true);
        await icon.tap();assert.equal(await viewer.evaluate(el=>el.classList.contains('adc-pdf-expanded')),true);
        await icon.tap();assert.equal(await viewer.evaluate(el=>el.classList.contains('adc-pdf-expanded')),false);
      }
    }
    await icon.focus();await icon.press('Enter');assert.equal(await viewer.evaluate(el=>el.classList.contains('adc-pdf-expanded')),true);
    await page.keyboard.press('Escape');assert.equal(await viewer.evaluate(el=>el.classList.contains('adc-pdf-expanded')),false);
    assert.equal(await field.inputValue(),'Prueba pantalla completa');
    assert.equal(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key)).values.apellido,'Prueba pantalla completa');assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
