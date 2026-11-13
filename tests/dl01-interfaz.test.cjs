const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const root = path.resolve(__dirname,'..');
const modules = path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium} = require(path.join(modules,'playwright'));

test('DL-01: perfil, instituciones, cursos, calendario, cálculos y responsive',async () => {
  const server = http.createServer((request,response) => {
    if(require('./support/demo-config.cjs').serve(request,response))return;
    const file = path.resolve(root,'.'+new URL(request.url,'http://localhost').pathname);
    if (!file.startsWith(root+path.sep)) return response.writeHead(403).end();
    fs.readFile(file,(error,bytes) => {
      if (error) return response.writeHead(404).end();
      response.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.pdf':'application/pdf'})[path.extname(file)] || 'application/octet-stream');
      response.end(bytes);
    });
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    await page.clock.setFixedTime(new Date('2026-11-13T12:00:00Z'));
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    await page.route('**/*',route => {
      // Todas las dependencias PDF deben funcionar desde ADC, sin ningún CDN.
      return route.request().url().startsWith('http://127.0.0.1:') || route.request().url().startsWith('blob:') ? route.continue() : route.abort();
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?adc-preview=1`);
    await page.evaluate(() => {
      inst=[];
      addInst({name:'IES San Fernando Rey',office:'1438',level:'Superior',entries:[
        {type:'asignatura',subject:'Matemática',course:'2 1',revista:'Titular',turno:'Mañana',schedule:[2,2,0,0,0,0,0],djIntervals:[{day:0,start:'08:00',end:'10:00'},{day:1,start:'08:00',end:'10:00'}]},
        {type:'cargo',cargoName:'Bibliotecario',cargoCode:'123',revista:'Interino',turno:'Tarde',schedule:[1,0,0,0,0,0,0],djIntervals:[{day:0,start:'14:00',end:'15:00'}]}
      ]});
      adcSetSharedField('perfilApellidos','Prueba');adcSetSharedField('perfilNombres','Docente');adcSetSharedField('dni','12345678');
      localStorage.setItem('adc_v08',JSON.stringify(data()));
      tab('tramites');
    });
    const saved = await page.evaluate(()=>localStorage.getItem('adc_v08'));
    await page.locator('.adc-form-catalog #tabL').click();
    await page.locator('#listaTramites [data-adc-tramite]').filter({hasText:'Enfermedad o lesión común'}).click();
    assert.ok(await page.locator('#escuelaSelect').inputValue());
    assert.match(await page.locator('#adcDL01ProfileSummary').textContent(),/Prueba/);
    assert.match(await page.locator('#adcDL01ProfileSummary').textContent(),/Matemática/);
    assert.match(await page.locator('#adcDL01ProfileSummary').textContent(),/Bibliotecario/);
    assert.equal(await page.locator('#adcSharedCalendar').getAttribute('open'),'');
    assert.equal(await page.locator('#adcSharedYear').inputValue(),'2026');
    await page.locator('#desde').fill('2026-11-16');await page.locator('#desde').press('Tab');
    await page.locator('#hasta').fill('2026-11-17');await page.locator('#hasta').press('Tab');
    assert.match(await page.locator('#review').textContent(),/Días corridos: 2/);
    assert.match(await page.locator('#adcDL01ProfileSummary').textContent(),/Incluido en el período/);
    assert.ok(await page.locator('#presentacion').inputValue());
    // Las fechas manuales y el perfil original no se reemplazan al recalcular.
    await page.locator('#presentacion').fill('2026-12-10');await page.locator('#presentacion').press('Tab');
    await page.evaluate(()=>review());
    assert.equal(await page.locator('#presentacion').inputValue(),'2026-12-10');
    assert.equal(await page.evaluate(()=>localStorage.getItem('adc_v08')),saved);
    // Recupera los cálculos ya existentes de inasistencia y Duelo.
    await page.evaluate(()=>choose('Inasistencias (justificada)'));
    assert.equal(await page.locator('#hasta').inputValue(),await page.locator('#desde').inputValue());
    assert.equal(await page.locator('#hasta').evaluate(input=>input.readOnly),true);
    await page.evaluate(()=>{choose('Duelo');$('adcDueloRelation').value='Prima hermana';$('desde').value='2026-12-01';$('hasta').value='';adcDueloSuggest();});
    assert.equal(await page.locator('#hasta').inputValue(),'2026-12-01');
    assert.match(await page.locator('#adcCalExplanation').textContent(),/1 días/);
    // Selección de fechas real desde el calendario.
    await page.evaluate(()=>choose('Enfermedad o lesión común'));
    await page.locator('#adcCalMonths [data-month-action="11"]').click();
    await page.locator('#adcCalMonths [data-date="2026-12-01"]').click();
    await page.locator('#adcCalMonths [data-date="2026-12-02"]').click();
    assert.equal(await page.locator('#desde').inputValue(),'2026-12-01');
    assert.equal(await page.locator('#hasta').inputValue(),'2026-12-02');
    for (const width of [320,390,768,1440]) {
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`ancho ${width}`);
      const geometry = await page.evaluate(() => ({
        button:document.querySelector('#license>section>button').getBoundingClientRect().height,
        heading:document.querySelector('.adc-request-heading').getBoundingClientRect().height,
        calendar:document.querySelector('#adcSharedCalendar').getBoundingClientRect().height
      }));
      assert.ok(geometry.button<90,`botón sin altura heredada a ${width}`);
      assert.ok(geometry.heading-geometry.calendar<100,`sin hueco vacío a ${width}`);
    }
    // Otra institución muestra exclusivamente sus cursos y mantiene la elección explícita.
    await page.evaluate(()=>addInst({name:'Escuela segunda',level:'Secundario',entries:[{subject:'Historia',course:'3 2',revista:'Suplente',turno:'Tarde',schedule:[0,1,0,0,0,0,0]}]}));
    const schools = await page.locator('#escuelaSelect option').evaluateAll(options=>options.map(option=>({value:option.value,text:option.textContent})));
    await page.locator('#escuelaSelect').selectOption(schools.find(option=>option.text==='Escuela segunda').value);
    assert.match(await page.locator('#adcDL01ProfileSummary').textContent(),/Historia/);
    assert.doesNotMatch(await page.locator('#adcDL01ProfileSummary').textContent(),/Matemática|Bibliotecario/);
    await page.locator('#escuelaSelect').selectOption(schools.find(option=>option.text==='IES San Fernando Rey').value);
    const state = () => page.evaluate(()=>JSON.stringify([selected,...['escuelaSelect','desde','hasta','presentacion','pago'].map(id=>$(id).value)]));
    const expectedState = await state();
    // Los tres caminos vuelven a la misma solicitud, sin borrar datos ni crear otra.
    for (const route of ['reason','code','catalog','requirements']) {
      if (route === 'requirements') {
        await page.locator('#adcDocsRows .adc-doc-action').filter({hasText:'DL-01'}).click();
      } else {
        await page.evaluate(()=>tab('tramites'));
        await page.locator('#buscar').fill('');
        if (route === 'catalog') await page.locator('.adc-form-catalog #tabL').click();
        else {
          await page.locator('#buscar').fill(route === 'code' ? 'DL-01' : 'enfermedad comun');
          if (route === 'code') await page.locator('#adcFormMatches>button').filter({hasText:'DL-01'}).click();
          else await page.locator('#listaTramites [data-adc-tramite]').filter({hasText:'Enfermedad o lesión común'}).click();
        }
      }
      assert.equal(await page.locator('#license').isVisible(),true,route);
      assert.equal(await state(),expectedState,`${route} conserva la solicitud`);
      await page.locator('#adcConfiguredDL01').click();
      await page.waitForSelector('#pdfResult iframe[src]');
      await page.waitForFunction(()=>!document.getElementById('adcConfiguredDL01').disabled);
      assert.match(await page.locator('#adcDL01GenerationStatus').textContent(),/DL-01 listo/);
      const preview = await page.locator('#pdfResult iframe').evaluate(async frame => {
        const bytes = await (await fetch(frame.src)).arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(bytes);
        return {pages:pdf.getPageCount(),size:pdf.getPage(0).getSize(),bytes:bytes.byteLength,top:frame.getBoundingClientRect().top,height:frame.getBoundingClientRect().height};
      });
      assert.equal(preview.pages,1);
      assert.ok(Math.abs(preview.size.height-1008)<1);
      assert.ok(preview.bytes>10000);
      assert.ok(preview.top<1000 && preview.height>=360,'vista previa visible y amplia');
    }
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#downloadPDF').click();
    const download = await downloadEvent;
    const output = fs.mkdtempSync(path.join(os.tmpdir(),'adc-dl01-preview-'));
    await download.saveAs(path.join(output,'DL-01-completado.pdf'));
    console.log(`DL-01 de prueba para revisión visual: ${output}`);
    // Un error previo al dibujo también devuelve un aviso y rehabilita el botón.
    await page.evaluate(()=>{window.testOriginalReview=review;review=()=>{throw new Error('Fallo de prueba controlado');};});
    await page.locator('#adcConfiguredDL01').click();
    await page.waitForFunction(()=>!document.getElementById('adcConfiguredDL01').disabled);
    assert.match(await page.locator('#adcDL01GenerationStatus').textContent(),/Fallo de prueba controlado/);
    await page.evaluate(()=>{review=window.testOriginalReview;});
    // Tres cursos afectados usan la plantilla original de dos páginas.
    await page.evaluate(()=>{
      const base=inst[0].entries.find(entry=>entry.type==='asignatura');
      for(let index=0;index<2;index++)inst[0].entries.push({...base,djUid:`extra-${index}`,subject:`Materia ${index+2}`,course:`${index+3} 1`});
      render();$('escuelaSelect').value=String(inst[0].id);review();
    });
    const oldPreview = await page.locator('#pdfResult iframe').count() ? await page.locator('#pdfResult iframe').getAttribute('src') : null;
    await page.locator('#adcConfiguredDL01').click();
    await page.waitForFunction(old => {
      const frame=document.querySelector('#pdfResult iframe[src]');
      return frame&&frame.src!==old&&!document.getElementById('adcConfiguredDL01').disabled;
    },oldPreview);
    assert.equal(await page.locator('#pdfResult iframe').evaluate(async frame=>(await PDFLib.PDFDocument.load(await(await fetch(frame.src)).arrayBuffer())).getPageCount()),2);
    const twoPagesDownload=page.waitForEvent('download');
    await page.locator('#downloadPDF').click();
    await(await twoPagesDownload).saveAs(path.join(output,'DL-01-dos-paginas.pdf'));
    assert.deepEqual(errors,[]);
  } finally {
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
