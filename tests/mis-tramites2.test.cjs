const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
test('MT2-01: búsqueda local editable, catálogo y asistente explícito sin alterar datos',{timeout:120000},async()=>{
  const server=require('../tools/motor01-preview.cjs').createMotor01Server();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true}),output=fs.mkdtempSync(path.join(os.tmpdir(),'adc-mt2-'));
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https:\/\//,r=>r.abort());await page.route('**/assets/datos/ajustes-pagina.json',r=>r.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1&adc-inicio=1&adc-motor01=incapacidad`);
    const snapshot=()=>page.evaluate(()=>{
      // El editor puede añadir style="" al cambiar el ancho; no altera estilos ni datos.
      const html=selector=>{const copy=document.querySelector(selector).cloneNode(true);for(const node of copy.querySelectorAll('[style]'))if(!node.getAttribute('style').trim())node.removeAttribute('style');return copy.innerHTML};
      return {storage:Object.fromEntries(Object.entries(localStorage).filter(([key])=>!['adc-login-theme','adc_theme'].includes(key))),legacy:html('#adcTramitesMenu'),home:html('#adcInicio'),profile:html('#profile'),values:[...document.querySelectorAll('#profile input,#profile select,#adcTramitesMenu input,#adcTramitesMenu select')].map(el=>[el.id,el.value,el.checked])};
    });
    const before=await snapshot();await page.locator('#adcTabTramites2').click();
    const root=page.locator('#adcTramites2'),input=root.locator('#adcMT2Search'),dialog=root.locator('.mt2-dialog'),catalog=root.locator('#adcMT2Catalog'),suggestions=root.locator('#adcMT2Suggestions');
    assert.deepEqual(errors,[]);assert.equal(await dialog.isVisible(),false);assert.equal(await catalog.isVisible(),true);assert.ok(await catalog.locator('[data-mt2-form]').count()>0);
    assert.equal(await input.evaluate(el=>el.classList.contains('mt2-search-start')),true);assert.equal(await input.evaluate(el=>getComputedStyle(el).animationName),'adcMT2SearchPulse');
    const all=await page.locator('#adcTramitesMenu .adc-form-grid > button').count();assert.equal(await root.locator('.mt2-total').innerText(),`${all} formularios`);
    const query=async value=>{await input.fill(value);assert.equal(await dialog.isVisible(),false)};
    await input.click();assert.equal(await input.evaluate(el=>el.classList.contains('mt2-search-start')),false);assert.equal(await dialog.isVisible(),false);await input.pressSequentially('enfermedad');assert.equal(await dialog.isVisible(),false);
    assert.ok(await suggestions.getByRole('option').count()>0);assert.equal(await catalog.isVisible(),true);
    const priority=root.locator('[data-mt2-priority]');assert.equal(await priority.locator('[data-mt2-form=dl01]').count(),1);assert.equal(await priority.locator('[data-mt2-form=dl01]').getAttribute('class'),'mt2-card mt2-card-gold');
    assert.match(await priority.innerText(),/confirmá el motivo/);assert.equal(await root.locator('[data-mt2-form]').evaluateAll(nodes=>new Set(nodes.map(el=>el.dataset.mt2Form)).size===nodes.length),true);
    assert.equal(await suggestions.getByRole('option').evaluateAll(nodes=>new Set(nodes.map(node=>node.textContent)).size===nodes.length),true);
    await query('asuntos particulares');await suggestions.getByRole('option').filter({hasText:'Asuntos particulares'}).click();
    assert.equal(await dialog.isVisible(),true);assert.equal(await dialog.locator('.mt2-question h3').count(),1);assert.match(await dialog.innerText(),/situación de revista/);
    assert.equal(await dialog.evaluate(el=>getComputedStyle(el).borderColor),'rgb(214, 104, 36)');
    await dialog.getByRole('button',{name:'Cerrar asistente',exact:true}).click();assert.equal(await input.inputValue(),'asuntos particulares');assert.equal(await catalog.isVisible(),true);
    await query('asuntos particulares');await suggestions.getByRole('option').filter({hasText:'Asuntos particulares'}).click();await dialog.getByRole('button',{name:'Titular',exact:true}).click();
    assert.equal(await dialog.locator('.mt2-question h3').count(),1);assert.match(await dialog.locator('.mt2-question').innerText(),/DL-01|Licencias y permisos/);
    await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);assert.equal(await input.inputValue(),'asuntos particulares');
    await query('asuntos particulares');await suggestions.getByRole('option').filter({hasText:'Asuntos particulares'}).click();
    assert.match(await dialog.locator('.mt2-progress').innerText(),/Revisión del recorrido/);await page.keyboard.press('Escape');
    await query('duelo');await input.press('ArrowDown');await input.press('Enter');assert.equal(await dialog.isVisible(),true);
    await dialog.getByRole('button',{name:'Titular',exact:true}).click();assert.match(await dialog.locator('.mt2-question h3').innerText(),/vínculo/);
    await dialog.getByRole('button',{name:'Pregunta anterior',exact:true}).click();assert.match(await dialog.locator('.mt2-question h3').innerText(),/revista/);
    await dialog.getByRole('button',{name:'Titular',exact:true}).click();await dialog.locator('select').selectOption('Madre');await dialog.getByRole('button',{name:'Continuar',exact:true}).click();assert.match(await dialog.locator('.mt2-result-code').innerText(),/DL-01/);await page.keyboard.press('Escape');
    await query('examen');await suggestions.getByRole('option').filter({hasText:'Motivo'}).filter({hasText:'Exámenes'}).click();await dialog.getByRole('button',{name:'Suplente',exact:true}).click();assert.match(await dialog.innerText(),/requiere revisión/);assert.equal(await dialog.locator('.mt2-result-code').count(),0);await page.keyboard.press('Escape');
    await query('traslado');await suggestions.getByRole('option').filter({hasText:'Motivo'}).filter({hasText:'Traslado transitorio por razones de salud'}).click();assert.match(await dialog.innerText(),/institución te indicó/);await dialog.getByRole('button',{name:'No lo sé todavía',exact:true}).click();assert.match(await dialog.innerText(),/no está configurada/);await page.keyboard.press('Escape');
    for(const code of ['DL-01','DJ-02']){await query(code);assert.equal(await priority.locator('[data-mt2-form]').first().getAttribute('data-mt2-form'),code==='DL-01'?'dl01':'dj02');const option=suggestions.getByRole('option').filter({hasText:`Formulario · ${code}`});assert.equal(await option.count(),1);await option.click();assert.equal(await dialog.isVisible(),false);assert.match(await root.locator('[data-mt2-selected]').innerText(),new RegExp(code));}
    await query('Donación de sangre');assert.equal(await priority.locator('[data-mt2-form=dl01]').count(),0);
    await query('zzzzzzsincoincidencias');assert.equal(await priority.locator('[data-mt2-form]').count(),0);
    await query('DJ-02');await input.press('ArrowUp');assert.ok(await input.getAttribute('aria-activedescendant'));await input.press('Enter');assert.equal(await dialog.isVisible(),false);
    await query('');assert.equal(await catalog.isVisible(),true);assert.equal(await suggestions.isVisible(),false);
    const tabs=root.getByRole('tab');assert.equal(await tabs.count(),2);await tabs.nth(1).click();assert.ok(await catalog.locator('[data-mt2-form=dp01]').count());assert.equal(await catalog.locator('[data-mt2-form=incapacidad]').count(),0);
    await tabs.nth(1).press('ArrowLeft');assert.equal(await tabs.nth(0).getAttribute('aria-selected'),'true');assert.equal(await catalog.locator('[data-mt2-form=incapacidad]').count(),1);
    const first=catalog.locator('.mt2-card').first();const plain=await first.evaluate(el=>getComputedStyle(el).backgroundColor);await first.hover();await page.waitForTimeout(220);assert.notEqual(await first.evaluate(el=>getComputedStyle(el).backgroundColor),plain);assert.equal(await first.evaluate(el=>getComputedStyle(el).borderColor),'rgb(214, 104, 36)');
    await page.mouse.move(0,0);await page.waitForTimeout(220);assert.equal(await first.evaluate(el=>getComputedStyle(el).backgroundColor),plain);await first.focus();assert.equal(await first.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await first.evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    await page.locator('#adcTabInicio').click();await page.locator('#adcTabTramites2').click();assert.equal(await input.evaluate(el=>el.classList.contains('mt2-search-start')),true);assert.equal(await input.evaluate(el=>getComputedStyle(el).animationName),'none');assert.equal(await input.evaluate(el=>getComputedStyle(el).borderColor),'rgb(214, 104, 36)');
    for(const width of [320,390,768,1440]){
      await page.setViewportSize({width,height:1000});
      for(const theme of ['light','dark']){
        if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#adcThemeSwitch').click();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Sin desborde ${width}/${theme}`);
        const contrast=await root.locator('.mt2-panel h2').evaluateAll(nodes=>{
          const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(v=>{v=Number(v)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};
          return nodes.map(el=>{const a=luminance(getComputedStyle(el).color),b=luminance(getComputedStyle(el.closest('.mt2-panel')).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
        });assert.ok(contrast.every(value=>value>=4.5),'Títulos dorados con contraste mínimo 4.5:1');
        const boxes=await root.locator('.mt2-frequent,.mt2-search,.mt2-catalog').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right}}));
        if(width>760){assert.ok(boxes[0].right<=boxes[1].x);assert.ok(boxes[1].y<boxes[2].y)}else assert.ok(boxes[1].y<boxes[0].y&&boxes[0].y<boxes[2].y);
        if([390,1440].includes(width))await page.screenshot({path:path.join(output,`mt2-${width}-${theme}.png`),fullPage:true});
        if([390,1440].includes(width)){await query('DJ-02');assert.equal(await priority.locator('[data-mt2-form=dj02]').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(output,`destacados-${width}-${theme}.png`),fullPage:true});await query('');}
        if(width===390){await query('asuntos particulares');await suggestions.getByRole('option').filter({hasText:'Asuntos particulares'}).click();assert.equal(await dialog.isVisible(),true);if(await dialog.getByRole('button',{name:'Revisar respuestas',exact:true}).count())await dialog.getByRole('button',{name:'Revisar respuestas',exact:true}).click();const box=await dialog.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390);assert.equal(await dialog.evaluate(el=>getComputedStyle(el).borderColor),'rgb(214, 104, 36)');await page.screenshot({path:path.join(output,`asistente-${theme}.png`)});await dialog.getByRole('button',{name:'Cerrar asistente',exact:true}).click();await query('');}
      }
    }
    await page.locator('#adcTabInicio').click();
    const after=await snapshot();assert.deepEqual(after.storage,before.storage);assert.deepEqual(after.values,before.values);assert.equal(after.home,before.home);
    for(const part of ['legacy','profile'])assert.ok(after[part]===before[part],part+' preservado');
    const touch=await browser.newPage({viewport:{width:390,height:1000},hasTouch:true});
    await touch.route(/^https:\/\//,r=>r.abort());await touch.route('**/assets/datos/ajustes-pagina.json',r=>r.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    await touch.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1&adc-inicio=1&adc-motor01=incapacidad`);
    await touch.locator('#adcTabTramites2').tap();await touch.locator('#adcMT2Search').fill('asuntos particulares');
    await touch.locator('#adcMT2Suggestions').getByRole('option').filter({hasText:'Asuntos particulares'}).tap();assert.equal(await touch.locator('#adcTramites2 .mt2-dialog').isVisible(),true);
    await touch.getByRole('button',{name:'Cerrar asistente',exact:true}).tap();assert.equal(await touch.locator('#adcMT2Search').inputValue(),'asuntos particulares');await touch.close();
    await page.locator('#adcTabTramites2').click();await query('DJ-02');await suggestions.getByRole('option').filter({hasText:'Formulario · DJ-02'}).click();await root.locator('[data-mt2-selected] button').click();assert.equal(await page.locator('#dj02').isVisible(),true);
    await page.locator('#adcTabTramites2').click();await query('traslado');await suggestions.getByRole('option').filter({hasText:'Motivo'}).filter({hasText:'Traslado transitorio por razones de salud'}).click();await dialog.getByRole('button',{name:'Revisar respuestas',exact:true}).click();await dialog.getByRole('button',{name:/^DJ-02/}).click();await dialog.getByRole('button',{name:'Abrir DJ-02',exact:true}).click();
    assert.equal(await page.locator('#dj02').isVisible(),true);assert.equal(await page.locator('#adcDJ02FromSelector').isVisible(),true);assert.equal(await page.locator('body').getAttribute('data-adc-mt2-reason'),'Traslado transitorio por razones de salud');
    assert.deepEqual(errors,[]);console.log('Capturas MT2: '+output);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
