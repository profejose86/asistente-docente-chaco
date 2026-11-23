const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
test('Inicio: fachada aislada, navegación real, temas, perfil y borrador preservados',{timeout:90000},async()=>{
  const server=require('../tools/motor01-preview.cjs').createMotor01Server();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true}),output=fs.mkdtempSync(path.join(os.tmpdir(),'adc-inicio-'));
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https:\/\//,r=>r.abort());
    await page.route('**/assets/datos/ajustes-pagina.json',r=>r.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    const base=`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`;
    await page.goto(base);assert.equal(await page.locator('#adcInicio').count(),0);assert.equal(await page.locator('#profile').isVisible(),true);
    const key='adc-official-form-incapacidad-draft-v1',draft=JSON.stringify({schemaVersion:2,values:{apellido:'Prueba inicio',nombres:'Ana',dni:'30123456'},marked:[]});
    await page.evaluate(([key,value])=>{localStorage.setItem(key,value);localStorage.setItem('adc-official-form-cf01-draft-v1','conservar')},[key,draft]);
    await page.goto(base+'&adc-inicio=1&adc-motor01=incapacidad');
    assert.equal(await page.locator('#adcInicio').isVisible(),true);assert.equal(await page.locator('#profile').isVisible(),false);
    assert.match(await page.locator('#adcInicioTitle').innerText(),/Hola, profe/);
    assert.equal(await page.locator('#adcInicio .adc-start-card').count(),3);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),draft);
    const initialTheme=await page.locator('html').getAttribute('data-theme');
    await page.locator('#adcThemeSwitch').focus();await page.keyboard.press('Space');await page.keyboard.press('Space');
    assert.equal(await page.locator('html').getAttribute('data-theme'),initialTheme);
    for(const width of [320,390,768,1024,1440]){
      await page.setViewportSize({width,height:1000});
      for(const theme of ['light','dark']){
        if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#adcThemeSwitch').click();
        assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
        assert.equal(await page.locator('#adcThemeSwitch').innerText(),'Modo claro\nModo oscuro');
        assert.equal(await page.locator('#adcThemeSwitch').getAttribute('aria-checked'),String(theme==='dark'));
        const track=await page.locator('.adc-start-theme-track').boundingBox(),knob=await page.locator('.adc-start-theme-track>span').boundingBox();
        assert.ok(theme==='dark'?knob.x>track.x+20:knob.x<track.x+5);
        assert.equal(await page.evaluate(()=>localStorage.getItem('adc-login-theme')),theme);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Sin desborde a ${width}/${theme}`);
        assert.equal(Math.round((await page.locator('.adc-start-header').boundingBox()).width),width);
        const navButtons=await page.locator('.adc-start-header .adc-main-nav button').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}}));
        for(let i=0;i<navButtons.length;i++)for(let j=i+1;j<navButtons.length;j++){
          const a=navButtons[i],b=navButtons[j];assert.equal(a.x<b.right&&b.x<a.right&&a.y<b.bottom&&b.y<a.bottom,false,'Pestañas sin superposición');
        }
        const cards=await page.locator('#adcInicio .adc-start-card').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width}}));
        if(width<761)assert.ok(cards[1].y>cards[0].y);else assert.equal(Math.round(cards[1].y),Math.round(cards[0].y));
        if([390,1440].includes(width))await page.screenshot({path:path.join(output,`inicio-${width}-${theme}.png`),fullPage:true});
      }
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('#adcInicio [data-adc-start-target=profile]').first().click();assert.equal(await page.locator('#profile').isVisible(),true);
    await page.locator('#perfilNombres').fill('Ana María');await page.locator('#adcTabInicio').click();assert.match(await page.locator('#adcInicioTitle').innerText(),/Hola, Ana/);
    await page.locator('#adcInicio [data-adc-start-target=tramites]').last().click();assert.equal(await page.locator('#adcTramitesMenu').isVisible(),true);assert.equal(await page.locator('#adcInicio').isVisible(),false);
    await page.locator('#adcTabInicio').click();await page.locator('#adcInicio [data-adc-start-target=calendar]').click();assert.equal(await page.locator('#adcCalendar').isVisible(),true);
    await page.locator('#adcTabTramites2').click();assert.equal(await page.locator('#adcTramites2').isVisible(),true);assert.equal(await page.locator('#adcTramitesMenu').isVisible(),false);
    await page.locator('[data-adc-start-pilot]').click();assert.equal(await page.locator('#adcOfficialForm').getAttribute('data-adc-form-id'),'incapacidad');
    assert.equal(await page.locator('#adcTabTramites2').getAttribute('aria-current'),'page');
    assert.equal(await page.locator('[data-adc-field=apellido]').inputValue(),'Prueba inicio');
    await page.locator('.adc-mt2-document-back').click();assert.equal(await page.locator('#adcTramites2').isVisible(),true);
    await page.locator('[data-adc-start-pilot]').click();
    await page.evaluate(()=>{window.inicioStore=adcUserStorage;window.adcUserStorage={...adcUserStorage,setItem(){throw Error('Cuota simulada')}}});
    await page.locator('[data-adc-field=apellido]').fill('Cambio protegido');await page.locator('#adcTabInicio').click();
    assert.equal(await page.locator('#adcOfficialForm').isVisible(),true);assert.equal(await page.locator('#adcInicio').isVisible(),false);
    await page.evaluate(()=>window.adcUserStorage=inicioStore);await page.locator('#adcTabInicio').click();assert.equal(await page.locator('#adcInicio').isVisible(),true);
    assert.equal(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key)).values.apellido,'Cambio protegido');
    await page.locator('#adcProfileBtn').click();assert.equal(await page.locator('#adcProfileMenu').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#adcProfileMenu').isVisible(),false);
    assert.equal(await page.evaluate(()=>localStorage.getItem('adc-official-form-cf01-draft-v1')),'conservar');
    assert.deepEqual(errors,[]);console.log('Capturas de Inicio: '+output);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../docs/prototipos/inicio-original.html'))).digest('hex'),'a4f69a00f74fbff8ac26ca5db14c0ee3a75a85cd20170e044b5e7e5dfbf72129');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
