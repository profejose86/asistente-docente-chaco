const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os'),fs=require('node:fs');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
test('MT2: catálogo y apertura con visor compartido sin la pantalla Mis trámites',{timeout:120000},async()=>{
  const server=require('../tools/motor01-preview.cjs').createMotor01Server();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));await page.route(/^https:\/\//,route=>route.abort());
    await page.route('**/assets/datos/ajustes-pagina.json',route=>route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1&adc-inicio=1&adc-motor01=incapacidad`);
    await page.locator('#adcTabTramites2').click();
    const records=await page.evaluate(()=>adcMT2Documents.records().map(({id,status})=>({id,status})));
    assert.equal(records.length,31);assert.equal(new Set(records.map(item=>item.id)).size,31);
    // El arranque histórico aún existe; las aperturas nuevas no consultan su pantalla.
    await page.evaluate(()=>{document.getElementById('adcTramitesMenu').remove();document.getElementById('frecuentes')?.remove()});
    const reason='Enfermedad o lesión común';
    for(const access of ['frequent','search','dl01']){
      if(access==='frequent')await page.locator('[data-mt2-frequent]').getByRole('button',{name:reason,exact:true}).click();
      if(access==='search'){
        await page.locator('#adcMT2Search').fill('enfermedad');
        await page.locator('#adcMT2Suggestions').getByRole('option').filter({hasText:reason}).click();
      }
      if(access==='dl01'){
        await page.locator('#adcMT2Search').fill('DL-01');
        await page.locator('#adcMT2Suggestions').getByRole('option').filter({hasText:'Formulario · DL-01'}).click();
        await page.locator('[data-mt2-selected] button').click();
        await page.locator('#adcMT2DL01Reason').selectOption(reason);
        await page.locator('[data-mt2-selected]').getByRole('button',{name:'Continuar',exact:true}).click();
      }
      assert.equal(await page.locator('#adcTramites2 .mt2-dialog').isVisible(),true);
      assert.equal(await page.locator('#adcMT2IllnessSchool').count(),1);
      assert.match(await page.locator('#adcTramites2 .mt2-dialog').innerText(),/¿En qué institución vas a presentar\?/);
      await page.locator('#adcTramites2 .mt2-dialog').getByRole('button',{name:'Cerrar asistente',exact:true}).click();
    }    for(const {id,status} of records){
      if(status==='pending')continue;
      assert.equal(await page.evaluate(id=>adcMT2Documents.open(id,{reason:id==='dl01'?'Enfermedad o lesión común':null}),id),true,id+' abre');
      assert.equal(await page.locator('body').getAttribute('data-adc-mt2-document'),id);
      assert.equal(await page.locator('.adc-pdf-viewer-active:visible').count(),1,id+' tiene un visor activo visible');
      assert.equal(await page.locator('.adc-pdf-viewer-active:visible .adc-pdf-floating-fullscreen').isVisible(),true,id+' tiene maximizar');
      if(['dj01','dj02','sc01','ol01','dl01','cf01'].includes(id)){
        const viewer=page.locator('.adc-pdf-viewer-active:visible');
        await viewer.locator('[data-viewer-action=in]').dispatchEvent('click');
        assert.match(await viewer.locator('output').innerText(),/\d+ %/);
        await viewer.locator('.adc-pdf-floating-fullscreen').click();
        assert.equal(await viewer.locator('.adc-pdf-floating-fullscreen').getAttribute('aria-pressed'),'true');
        await viewer.locator('.adc-pdf-floating-fullscreen').click();
        await page.waitForFunction(()=>!document.fullscreenElement&&!document.querySelector('.adc-pdf-expanded'));
        await page.waitForFunction(button=>button.getAttribute('aria-pressed')==='false',await viewer.locator('.adc-pdf-floating-fullscreen').elementHandle());
        assert.equal(await viewer.locator('.adc-pdf-floating-fullscreen').getAttribute('aria-pressed'),'false');
      }
      await page.locator('.adc-mt2-document-back').click();assert.equal(await page.locator('#adcTramites2').isVisible(),true);
    }
    assert.equal(await page.evaluate(()=>adcMT2Documents.open('dl01')),false,'DL-01 pide motivo explícito');
    assert.equal(await page.evaluate(()=>adcMT2Documents.open('inexistente')),false);
    assert.equal(await page.evaluate(()=>adcMT2Documents.open('sc01')),true);
    await page.locator('#adcSC01Sheet [name=motivo]').fill('Prueba local MT2');
    await page.locator('.adc-mt2-document-back').click();
    assert.equal(await page.evaluate(()=>adcMT2Documents.open('sc01')),true);
    assert.equal(await page.locator('#adcSC01Sheet [name=motivo]').inputValue(),'Prueba local MT2');
    assert.match(await page.evaluate(()=>adcUserStorage.getItem('adc-sc01-borrador-v1')),/Prueba local MT2/);
    await page.locator('.adc-mt2-document-back').click();
    const output=fs.mkdtempSync(path.join(os.tmpdir(),'adc-mt2-visores-'));
    for(const width of [320,390,1440]){
      await page.setViewportSize({width,height:1000});
      for(const id of ['dj02','sc01','cf01']){
        assert.equal(await page.evaluate(id=>adcMT2Documents.open(id),id),true);
        await page.waitForTimeout(150);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${id}/${width} sin desborde`);
        if(id==='dj02'){
          const geometry=()=>page.locator('[data-mt2-viewer=dj02] .adc-mt2-viewport').evaluate(viewport=>{
            const preview=document.getElementById('dj02Preview'),paper=preview.querySelector('.adc58-page-shell');
            return {viewport:viewport.clientWidth,scroll:viewport.scrollWidth,paper:paper.getBoundingClientRect().width,overflowX:getComputedStyle(preview).overflowX,overflowY:getComputedStyle(preview).overflowY};
          });
          let dimensions=await geometry();assert.ok(dimensions.paper<=dimensions.viewport,`Hoja completa a ${width}`);assert.ok(dimensions.scroll<=dimensions.viewport+1);
          assert.equal(dimensions.overflowX,'visible');assert.equal(dimensions.overflowY,'visible');
          await page.locator('#dj02 [data-view=edit]').click();await page.waitForTimeout(150);
          dimensions=await geometry();assert.ok(dimensions.scroll<=dimensions.viewport+1,'También encuadra las acciones al editar');
          await page.locator('#dj02 [data-view=print]').click();
          const review=page.locator('.adc-review:visible');if(await review.count())await review.getByRole('button',{name:'Continuar igual',exact:true}).click();
          await page.waitForTimeout(150);
        }
        await page.screenshot({path:path.join(output,`${id}-${width}.png`),fullPage:true});
        await page.locator('.adc-mt2-document-back').click();
      }
    }
    assert.deepEqual(errors,[]);console.log('Capturas de visores MT2: '+output);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
