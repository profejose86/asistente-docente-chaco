const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(runtime,'playwright'));
const {PDFDocument}=require(path.join(runtime,'pdf-lib'));

test('Incapacidad: original editable, visor piloto, borrador y PDF independiente del zoom',{timeout:120000},async()=>{
  const output=path.join(root,'.adc-tools/incapacidad');
  fs.mkdirSync(output,{recursive:true});
  const server=http.createServer((req,res)=>{
    if(require('./support/demo-config.cjs').serve(req,res))return;
    const url=new URL(req.url,'http://localhost');
    if(!url.pathname.startsWith('/adc/'))return res.writeHead(404).end();
    const file=path.resolve(root,decodeURIComponent(url.pathname.slice(5)));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(error,data)=>{
      if(error)return res.writeHead(404).end();
      res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
      res.end(data);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100},acceptDownloads:true,hasTouch:true});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route(/^https:\/\//,route=>route.abort());
    await page.route('**/assets/datos/ajustes-pagina.json',route=>route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`);
    await page.locator('#perfilApellidos').fill('Pérez');
    await page.locator('#perfilNombres').fill('Juan Pablo');
    await page.locator('#dni').fill('30123456');
    const open=async(id='incapacidad')=>{
      await page.evaluate(()=>tab('tramites'));
      await page.locator(`.adc-form-catalog [data-adc-official-form="${id}"]`).click();
    };
    await open();
    const field=key=>page.locator(`[data-adc-field="${key}"]`);
    const frame=page.locator('.adc-pdf-viewer');
    const viewport=page.locator('#adcOfficialForm .adc-document-viewport');
    const nav=frame.locator('.adc-pdf-navigation');
    const zoom=()=>nav.locator('input').inputValue().then(Number);
    const action=name=>nav.locator(`[data-viewer-action="${name}"]`);
    const setZoom=async(percent)=>{
      await nav.locator('input').evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},percent);
    };
    assert.equal(await page.locator('[data-adc-official-title]').innerText(),'Formulario de Solicitud de Beneficio de Incapacidad');
    assert.equal(await field('apellido').inputValue(),'Pérez');
    assert.equal(await field('nombres').inputValue(),'Juan Pablo');
    assert.equal(await field('firmaAsegurado').count(),0);
    assert.equal(await page.locator('[data-adc-official-action=preview]').count(),2);
    for(const action of ['preview','download','print']){
      const buttons=page.locator(`[data-adc-official-action="${action}"]`);
      assert.equal(await buttons.count(),2);
      for(const button of await buttons.all()){
        const icon=button.locator('svg');
        assert.equal(await icon.count(),1);assert.equal(await icon.isVisible(),true);
        assert.equal(await icon.getAttribute('data-adc-action-icon'),action);
        assert.equal(await icon.getAttribute('aria-hidden'),'true');
      }
    }
    const alignments={apellido:'center',nombres:'center',dni:'center',fechaNacimiento:'center',ministerio:'left',reparticion:'left',dependencia:'left',lugarServicios:'left',provincia:'left',ocupacion:'left',funcion:'center',domicilio:'left',seguroObligatorio:'center',seguroColectivo:'center',seguroAdicional:'center',total:'center',lugar:'center',fecha:'center',fechaCese:'center',lugarCertificacion:'right',fechaCertificacion:'left'};
    for(const [key,alignment] of Object.entries(alignments)){
      assert.equal(await field(key).evaluate(node=>getComputedStyle(node).textAlign),alignment,key);
      assert.ok(await field(key).evaluate(node=>Math.abs(parseFloat(getComputedStyle(node).fontSize)*72/96-11)<.001),key);
    }
    for(const [key,value] of Object.entries({fechaNacimiento:'1986-10-25',ministerio:'Educación',reparticion:'Región educativa',dependencia:'EES N°83',lugarServicios:'Resistencia',provincia:'Chaco',ocupacion:'Docente',funcion:'Profesor de Matemática',seguroObligatorio:'150000',seguroColectivo:'200000',seguroAdicional:'50000',total:'400000',domicilio:'Av. San Martín 123',lugar:'Rcia.',fecha:'2026-11-15',fechaCese:'2026-10-31',lugarCertificacion:'Rcia.',fechaCertificacion:'2026-11-15'}))await field(key).fill(value);
    await field('funcion').fill('Profesor de Matemática\nEducación secundaria');
    await field('fechaCertificacion').press('Tab');
    await field('ocupacion').fill('');
    await page.locator('[data-adc-mnc=ocupacion]').click();
    await page.waitForFunction(()=>!document.querySelector('[data-adc-official-status]').dataset.adcLayoutError);
    await page.evaluate(()=>document.activeElement.blur());
    await setZoom(100);
    await action('in').click();assert.equal(await zoom(),110);
    await action('out').click();assert.equal(await zoom(),100);
    await nav.locator('input').focus();await nav.locator('input').press('ArrowRight');assert.equal(await zoom(),101);
    await setZoom(200);await action('in').click();assert.equal(await zoom(),200);
    await setZoom(25);await action('out').click();assert.equal(await zoom(),25);
    await setZoom(150);
    assert.equal(await frame.locator('.adc-pdf-scroll').isVisible(),false);
    assert.equal(await viewport.evaluate(node=>getComputedStyle(node).overflowY),'auto');
    assert.equal(await viewport.evaluate(node=>getComputedStyle(node).scrollbarWidth),'auto');
    await viewport.focus();await viewport.press('Control+End');
    assert.ok(await viewport.evaluate(node=>node.scrollTop>=node.scrollHeight-node.clientHeight-2));
    await frame.screenshot({path:path.join(output,'barra-unica.png')});
    let box=await viewport.boundingBox();
    await page.mouse.move(box.x+25,box.y+60);await page.mouse.wheel(0,-100);
    assert.ok(await zoom()>150);
    await viewport.evaluate(node=>{node.scrollTop=240;node.scrollLeft=180});
    const before=await viewport.evaluate(node=>({top:node.scrollTop,left:node.scrollLeft}));
    await page.mouse.move(box.x+25,box.y+60);await page.mouse.down();
    await page.mouse.move(box.x+65,box.y+110,{steps:5});await page.mouse.up();
    const after=await viewport.evaluate(node=>({top:node.scrollTop,left:node.scrollLeft}));
    assert.ok(after.top<before.top);assert.ok(after.left<before.left);
    await frame.locator('.adc-pdf-scroll').evaluate(input=>{input.value='50';input.dispatchEvent(new Event('input',{bubbles:true}))});
    assert.ok(await viewport.evaluate(node=>Math.abs(node.scrollTop/(node.scrollHeight-node.clientHeight)-.5)<.02));
    await action('page').click();
    assert.ok(await page.locator('[data-adc-official-sheet]').evaluate(node=>node.getBoundingClientRect().height<=node.closest('.adc-document-viewport').clientHeight+1));
    await action('width').click();
    const oldZoom=await zoom();
    const inputBox=await field('apellido').boundingBox();
    await page.mouse.move(inputBox.x+5,inputBox.y+5);await page.mouse.wheel(0,-30);
    assert.equal(await zoom(),oldZoom);
    await field('apellido').fill('Pérez corregido');
    await page.evaluate(()=>document.activeElement.blur());
    await page.mouse.move(2,2);await page.waitForTimeout(2000);
    assert.equal(await nav.evaluate(node=>getComputedStyle(node).opacity),'0');
    await viewport.focus();await viewport.press('Tab');
    await nav.locator('input').focus();await page.waitForTimeout(1900);
    assert.equal(await nav.evaluate(node=>getComputedStyle(node).opacity),'1');
    await action('fullscreen').click();
    assert.equal(await frame.evaluate(node=>document.fullscreenElement===node),true);
    await action('fullscreen').click();
    assert.equal(await page.evaluate(()=>Boolean(document.fullscreenElement)),false);
    // Fallback de pantalla completa en navegadores sin requestFullscreen.
    await frame.evaluate(node=>node.requestFullscreen=undefined);
    await action('fullscreen').click();assert.ok(await frame.evaluate(node=>node.classList.contains('adc-pdf-expanded')));
    assert.equal(await frame.evaluate(node=>Number(getComputedStyle(node).zIndex)>Number(getComputedStyle(document.getElementById('adcSessionBar')).zIndex)),true);
    await page.keyboard.press('Escape');assert.equal(await frame.evaluate(node=>node.classList.contains('adc-pdf-expanded')),false);
    await setZoom(100);
    await page.evaluate(()=>{
      window.incapacityDraws=[];
      const original=PDFLib.PDFPage.prototype.drawText;
      PDFLib.PDFPage.prototype.drawText=function(text,options){incapacityDraws.push({text,x:options.x,y:options.y,size:options.size,font:options.font.name});return original.call(this,text,options)};
      const originalLine=PDFLib.PDFPage.prototype.drawLine;
      PDFLib.PDFPage.prototype.drawLine=function(options){incapacityDraws.push({kind:'line',start:options.start,end:options.end,thickness:options.thickness});return originalLine.call(this,options)};
    });
    const download=async(name)=>{
      const pending=page.waitForEvent('download');
      await page.locator('[data-adc-official-action=download]').first().click();
      await(await pending).saveAs(path.join(output,name));
    };
    await download('completado.pdf');
    const draws=await page.evaluate(()=>incapacityDraws.splice(0));
    const alignment=await page.evaluate(async()=>{
      const document=await PDFLib.PDFDocument.create();
      const font=await document.embedFont(PDFLib.StandardFonts.Helvetica);
      const canvas=window.document.querySelector('canvas.adc-document-page');
      const commands=JSON.parse(canvas.adcCommandsKey.slice(canvas.adcCommandsKey.indexOf(':')+1));
      const settings=adcPreparedPdfForms.incapacidad.fields;
      return commands.filter(command=>command.kind==='text'&&command.fieldValue).map(command=>{
        const box=settings[command.fieldValue];
        const width=font.widthOfTextAtSize(command.text,command.size);
        let expectedX=box.x+2;
        if(box.textAlign==='center')expectedX=box.x+(box.width-width)/2;
        if(box.textAlign==='right')expectedX=box.x+box.width-2-width;
        if(command.fieldValue==='fechaNacimiento'){
          const part=box.dateParts.find(segment=>Math.abs(command.x-(segment.x+(segment.width-width)/2))<.001);
          expectedX=part?command.x:NaN;
        }
        return {key:command.fieldValue,text:command.text,x:command.x,y:command.y,size:command.size,expectedX};
      });
    });
    for(const command of alignment){
      assert.ok(Math.abs(command.x-command.expectedX)<.001,command.key);
      assert.ok(command.size>=8&&command.size<=11,command.key);
      const exported=draws.find(item=>item.text===command.text&&Math.abs(item.x-command.x)<.001&&Math.abs(item.y-command.y)<.001);
      assert.ok(exported,command.key);assert.equal(exported.font,'Helvetica');assert.equal(exported.size,command.size);
    }
    for(const [key,align] of [['apellido','center'],['ministerio','left'],['lugarCertificacion','right'],['funcion','center']]){
      await field(key).focus();
      const style=await field(key).evaluate(node=>({align:getComputedStyle(node).textAlign,family:getComputedStyle(node).fontFamily,weight:getComputedStyle(node).fontWeight,size:parseFloat(getComputedStyle(node).fontSize)*72/96}));
      assert.equal(style.align,align);assert.match(style.family,/Helvetica/);assert.equal(style.weight,'400');
      assert.ok(style.size>=7.999&&style.size<=11.001,JSON.stringify({key,...style}));
    }
    assert.equal(alignment.filter(command=>command.key==='funcion').length,2);
    assert.equal(new Set(alignment.filter(command=>command.key==='funcion').map(command=>command.size)).size,1);
    await page.locator('[data-adc-official-action=preview]').first().click();
    await page.waitForSelector('[data-adc-official-preview] iframe');
    assert.deepEqual(await page.evaluate(()=>incapacityDraws.splice(0)),draws);
    const previewUrl=await page.locator('[data-adc-official-preview] iframe').getAttribute('src');
    await page.locator('[data-adc-official-action=preview]').last().click();
    await page.waitForFunction(previous=>{
      const frame=document.querySelector('[data-adc-official-preview] iframe');
      return frame&&frame.src!==previous;
    },previewUrl);
    assert.deepEqual(await page.evaluate(()=>incapacityDraws.splice(0)),draws);
    await setZoom(200);await download('completado-zoom-200.pdf');
    assert.deepEqual(await page.evaluate(()=>incapacityDraws.splice(0)),draws);
    const pdf=await PDFDocument.load(fs.readFileSync(path.join(output,'completado.pdf')));
    assert.equal(pdf.getPageCount(),1);assert.deepEqual(pdf.getPage(0).getSize(),{width:612.12,height:1008.12});
    assert.equal(pdf.getForm().getFields().length,0);
    assert.ok(draws.some(item=>item.text==='1986'));
    assert.ok(draws.some(item=>item.text==='....'));
    assert.ok(draws.some(item=>item.kind==='line'&&Math.abs(item.thickness-.5*72/25.4)<1e-8&&Math.abs(item.end.x-item.start.x-157*.7)<1e-8));
    assert.equal(await page.locator('[data-adc-mnc=ocupacion]').getAttribute('aria-pressed'),'true');
    await field('apellido').fill('M'.repeat(30));
    await page.waitForFunction(()=>parseFloat(document.querySelector('[data-adc-field=apellido]').style.fontSize)<11*96/72);
    assert.ok(await field('apellido').evaluate(node=>parseFloat(node.style.fontSize)>=8*96/72));
    await field('apellido').fill('X'.repeat(1000));
    await page.waitForFunction(()=>document.querySelector('[data-adc-official-status]').dataset.adcLayoutError==='true');
    assert.match(await page.locator('[data-adc-official-status]').innerText(),/8 puntos/);
    assert.equal((await field('apellido').inputValue()).length,1000);
    await field('apellido').fill('Pérez corregido');
    await field('funcion').fill('Una línea\nOtra línea\nTercera línea\nCuarta línea');
    await page.waitForFunction(()=>document.querySelector('[data-adc-official-status]').dataset.adcLayoutError==='true');
    assert.match(await page.locator('[data-adc-official-status]').innerText(),/8 puntos/);
    assert.match(await field('funcion').inputValue(),/Cuarta línea/);
    await field('funcion').fill('Profesor de Matemática\nEducación secundaria');
    await field('funcion').press('Tab');
    await page.evaluate(()=>{
      window.savedIncapacityOpen=window.open;
      window.open=()=>({addEventListener(event,callback){callback();},print(){window.incapacityPrintRequested=true;}});
    });
    await page.locator('[data-adc-official-action=print]').first().click();
    await page.waitForFunction(()=>window.incapacityPrintRequested===true);
    assert.deepEqual(await page.evaluate(()=>incapacityDraws.splice(0)),draws);
    await page.evaluate(()=>window.open=window.savedIncapacityOpen);
    await field('fechaNacimiento').fill('2001-10-25');
    await page.waitForFunction(()=>!document.querySelector('[data-adc-official-status]').dataset.adcLayoutError);
    await download('nacimiento-2001.pdf');
    assert.ok(await page.evaluate(()=>incapacityDraws.splice(0).some(command=>command.text==='2001')));
    await field('fechaNacimiento').fill('1986-10-25');
    for(const width of [320,390,1440]){
      await page.setViewportSize({width,height:1000});await action('width').click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      const frameBox=await frame.boundingBox(),navBox=await nav.boundingBox(),viewBox=await viewport.boundingBox();
      assert.ok(navBox.y+navBox.height<=frameBox.y+frameBox.height+1);
      assert.ok(navBox.y>=viewBox.y+viewBox.height);
      if(width===390){
        await frame.screenshot({path:path.join(output,'visor-movil.png')});
        await setZoom(100);
        await viewport.scrollIntoViewIfNeeded();
        const touchBox=await viewport.boundingBox();
        const session=await page.context().newCDPSession(page);
        const x=touchBox.x+25,y=touchBox.y+100;
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y-30,id:1},{x,y:y+30,id:2}]});
        await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-50,id:1},{x,y:y+50,id:2}]});
        await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        assert.ok(await zoom()>100,'El gesto de dos dedos amplía la vista');
        await viewport.evaluate(node=>node.scrollTop=100);
        const touchBefore=await viewport.evaluate(node=>node.scrollTop);
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y+60,id:1}]});
        for(let delta=10;delta<=60;delta+=10)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+60-delta,id:1}]});
        await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await page.waitForTimeout(150);
        assert.ok(await viewport.evaluate(node=>node.scrollTop)>touchBefore,'Un dedo desplaza el documento');
        await session.detach();
      }
    }
    await page.locator('html').evaluate(node=>node.dataset.theme='dark');
    await frame.screenshot({path:path.join(output,'visor-oscuro.png')});
    await page.locator('html').evaluate(node=>node.dataset.theme='light');
    await setZoom(100);await viewport.evaluate(node=>{node.scrollTop=0;node.scrollLeft=0});
    await frame.screenshot({path:path.join(output,'visor-claro.png')});
    await page.reload();await open();assert.equal(await field('apellido').inputValue(),'Pérez corregido');
    await setZoom(100);await action('in').click();assert.equal(await zoom(),110);
    await open('form-3');assert.equal(await nav.isVisible(),false);
    await open();await setZoom(100);await action('in').click();assert.equal(await zoom(),110);
    await page.evaluate(()=>{
      const original=adcPreparedPdfForms.incapacidad;
      window.adcPreparedPdfForms={...adcPreparedPdfForms,incapacidad:{...original,pages:[...original.pages,...original.pages]}};
    });
    await open();await setZoom(100);
    assert.equal(await page.locator('.adc-prepared-background').count(),2);
    await viewport.evaluate(node=>node.scrollTop=node.scrollHeight);
    await page.waitForFunction(()=>Number(document.querySelector('.adc-pdf-scroll').value)>99);
    await page.evaluate(()=>localStorage.setItem('adc-official-form-incapacidad-draft-v1',JSON.stringify({schemaVersion:2,values:{apellido:'Histórico',nombres:'Agente',dni:'30123456',fechaNacimiento:'25/10/1986',firmaAsegurado:'Firma anterior',solicitud:'Manifestación anterior'},touched:['apellido']})));
    await open();assert.equal(await field('apellido').inputValue(),'Histórico');
    assert.equal(await field('fechaNacimiento').inputValue(),'1986-10-25');
    assert.match(await page.locator('[data-adc-official-notices]').innerText(),/Firma anterior/);
    assert.match(await page.locator('[data-adc-official-notices]').innerText(),/Manifestación anterior/);
    await page.evaluate(()=>{
      const original=adcPreparedPdfForms.incapacidad;
      window.adcPreparedPdfForms={...adcPreparedPdfForms,incapacidad:{...original,pages:original.pages.slice(0,1)}};
    });
    await open();
    const saveButtons=page.locator('[data-adc-draft-action=save]');
    const clearButtons=page.locator('[data-adc-draft-action=clear]');
    const indicators=page.locator('[data-adc-draft-status]');
    const dialog=page.locator('.adc-incapacidad-confirm');
    assert.equal(await saveButtons.count(),2);assert.equal(await clearButtons.count(),2);assert.equal(await indicators.count(),2);
    let draftDownloads=0;page.on('download',()=>draftDownloads++);
    await field('ministerio').evaluate(node=>node.value='Guardado manual inmediato');
    await page.locator('[data-adc-mnc=provincia]').click();
    await page.evaluate(()=>{
      window.originalIncapacityStore=adcUserStorage;
      window.adcUserStorage={...adcUserStorage,setItem(key,value){
        if(key==='adc-official-form-incapacidad-draft-v1')window.incapacitySavingShown=[...document.querySelectorAll('[data-adc-draft-status]')].every(node=>node.textContent==='Guardando…');
        return originalIncapacityStore.setItem(key,value);
      }};
    });
    await saveButtons.first().click();
    assert.equal(await page.evaluate(()=>incapacitySavingShown),true);
    assert.deepEqual(await indicators.allTextContents(),['Borrador guardado en este dispositivo','Borrador guardado en este dispositivo']);
    const savedDraft=await page.evaluate(()=>localStorage.getItem('adc-official-form-incapacidad-draft-v1'));
    assert.equal(JSON.parse(savedDraft).values.ministerio,'Guardado manual inmediato');
    assert.ok(JSON.parse(savedDraft).marked.includes('provincia'));
    await page.evaluate(()=>window.adcUserStorage={...originalIncapacityStore,setItem(){throw Error('Cuota simulada')}});
    await saveButtons.last().click();
    assert.ok((await indicators.allTextContents()).every(text=>text.includes('No se pudo guardar')));
    assert.equal(await page.evaluate(()=>localStorage.getItem('adc-official-form-incapacidad-draft-v1')),savedDraft);
    await clearButtons.first().click();await dialog.getByRole('button',{name:'Sí, limpiar formulario',exact:true}).click();
    assert.equal(await field('ministerio').inputValue(),'Guardado manual inmediato');
    assert.equal(await page.evaluate(()=>localStorage.getItem('adc-official-form-incapacidad-draft-v1')),savedDraft);
    await page.evaluate(()=>window.adcUserStorage=originalIncapacityStore);
    await clearButtons.first().click();
    assert.equal(await dialog.isVisible(),true);
    assert.match(await dialog.innerText(),/¿Querés limpiar los datos de este formulario\?/);
    await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('adc-official-form-incapacidad-draft-v1')),savedDraft);
    assert.equal(await page.locator('[data-adc-mnc=provincia]').getAttribute('aria-pressed'),'true');
    await clearButtons.last().click();await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);
    await page.evaluate(()=>{
      document.getElementById('perfilApellidos').value='Pérez del perfil';
      document.getElementById('perfilNombres').value='Ana';
      document.getElementById('dni').value='30123456';
      localStorage.setItem('adc_v08',JSON.stringify(data()));
    });
    const preserved=await page.evaluate(()=>({profile:localStorage.getItem('adc_v08'),other:localStorage.getItem('adc-official-form-form-3-draft-v1'),name:document.getElementById('perfilApellidos').value}));
    await clearButtons.last().click();await dialog.getByRole('button',{name:'Sí, limpiar formulario',exact:true}).click();
    assert.equal(await field('ministerio').inputValue(),'');
    assert.equal(await field('apellido').inputValue(),preserved.name);
    assert.equal(await field('nombres').inputValue(),'Ana');
    assert.equal((await field('dni').inputValue()).replace(/\D/g,''),'30123456');
    assert.equal(await page.locator('[data-adc-mnc=provincia]').getAttribute('aria-pressed'),'false');
    const cleaned=await page.evaluate(()=>JSON.parse(localStorage.getItem('adc-official-form-incapacidad-draft-v1')));
    assert.deepEqual(cleaned.marked,[]);assert.equal(cleaned.values.firmaAsegurado,undefined);
    assert.doesNotMatch(await page.locator('[data-adc-official-notices]').innerText(),/Firma anterior|Manifestación anterior/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('adc_v08')),preserved.profile);
    assert.equal(await page.evaluate(()=>localStorage.getItem('adc-official-form-form-3-draft-v1')),preserved.other);
    await page.reload();await open();assert.equal(await field('ministerio').inputValue(),'');
    assert.equal(await field('apellido').inputValue(),preserved.name);
    await field('ministerio').fill('Guardado desde abajo');await saveButtons.last().click();
    assert.ok((await indicators.allTextContents()).every(text=>text==='Borrador guardado en este dispositivo'));
    await page.reload();await open();assert.equal(await field('ministerio').inputValue(),'Guardado desde abajo');
    for(const width of [320,390,1440]){
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      for(const toolbar of await page.locator('.adc-incapacidad-draft-tools').all()){
        assert.equal(await toolbar.isVisible(),true);
        const previous=await toolbar.evaluate(node=>node.previousElementSibling.classList.contains('adc-official-actions'));
        assert.equal(previous,true);
      }
      for(const theme of ['light','dark']){
        await page.locator('html').evaluate((node,value)=>node.dataset.theme=value,theme);
        const heights=[];
        for(const row of await page.locator('.adc-official-actions').all()){
          const boxes=await row.locator('button').evaluateAll(buttons=>buttons.map(button=>{
            const rect=button.getBoundingClientRect(),icon=button.querySelector('svg').getBoundingClientRect();
            return {height:rect.height,iconCentered:Math.abs(rect.y+rect.height/2-icon.y-icon.height/2)<1};
          }));
          assert.ok(boxes.every(box=>box.iconCentered));
          heights.push(boxes.map(box=>box.height));
        }
        assert.deepEqual(heights[0],heights[1]);
        if(width===1440)assert.ok(heights[0].every(height=>height===heights[0][0]));
        for(const action of ['save','clear']){
          for(const button of await page.locator(`[data-adc-draft-action="${action}"]`).all())assert.equal(await button.locator('svg').isVisible(),true);
        }
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      }
    }
    await page.setViewportSize({width:1200,height:1000});
    await page.locator('html').evaluate(node=>node.dataset.theme='dark');
    await page.locator('#adcOfficialForm').screenshot({path:path.join(output,'guardar-limpiar-oscuro.png')});
    assert.equal(draftDownloads,0);
    await open('form-3');
    assert.equal(await page.locator('[data-adc-action-icon]').count(),0);
    assert.equal(await saveButtons.first().isVisible(),false);assert.equal(await clearButtons.first().isVisible(),false);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/formularios/Incapacidad.pdf'))).digest('hex'),'485c8224765c7a5e8b5edadb458618307cb329a98691fce543d6a7742cbc2ce0');
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
