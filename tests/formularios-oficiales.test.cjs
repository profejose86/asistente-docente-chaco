const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

const root = path.resolve(__dirname,'..');
const runtime = path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/tramites/formularios-oficiales-datos.js'),'utf8'),context);
const forms = context.window.adcOfficialFormsData;

test('Los 26 esquemas conservan fuentes, claves únicas y requisitos esenciales',() => {
  assert.equal(forms.length,26);
  assert.equal(new Set(forms.map(form => form.id)).size,26);
  for (const form of forms) {
    assert.match(form.sourceUrl,/^https:\/\/(dirdocumentacion\.educacion\.chaco\.gob\.ar|drive\.google\.com|docs\.google\.com)\//);
    const keys = form.sections.flatMap(section => section.fields.map(field => field.key));
    assert.equal(new Set(keys).size,keys.length,form.id);
    const fields = form.sections.flatMap(section => section.fields.flatMap(field => field.type === 'repeat' ? field.fields : field));
    assert.ok(fields.some(field => field.required),`${form.id} necesita datos esenciales`);
    assert.ok(form.notices.length,form.id);
    for (const field of fields.filter(field => field.signature)) assert.equal(field.mnc,false);
  }
});

test('MNC excluye campos obligatorios, dígitos, firmas y controles de opción',() => {
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/core/mnc.js'),'utf8'),context);
  const mnc = context.window.adcMnc;
  for (const field of [{type:'radio'},{type:'checkbox'},{type:'choices'},{type:'checks'},{required:true},{maxLength:1},{mnc:false}]) {
    assert.equal(mnc.eligible(field),false,JSON.stringify(field));
  }
  assert.equal(mnc.eligible({required:true,allowMnc:true}),true);
  assert.equal(mnc.geometry.start,0.15);
  assert.equal(mnc.geometry.end,0.85);
  assert.equal(mnc.geometry.thickness,0.5*72/25.4);
});

let playwright;
try { playwright = require('playwright'); }
catch { try { playwright = require(path.join(runtime,'playwright')); } catch {} }
const pdfLibrary = path.join(runtime,'pdf-lib/dist/pdf-lib.min.js');

test('Chrome verifica formularios, borradores, MNC, filas, validación y PDF',{
  skip:!playwright || !fs.existsSync(pdfLibrary) ? 'Requiere Playwright, Chrome y pdf-lib del runtime local.' : false,
  timeout:180000
},async t => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(),'adc-form-tests-'));
  const server = http.createServer((request,response) => {
    const url = new URL(request.url,'http://localhost');
    const file = path.resolve(root,'.'+decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root+path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file,(error,bytes) => {
      if (error) { response.writeHead(404).end(); return; }
      response.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.pdf':'application/pdf','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
      response.end(bytes);
    });
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await playwright.chromium.launch({channel:'chrome',headless:true});
    const page = await browser.newPage({acceptDownloads:true});
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    await page.route('**/*',route => {
      if (route.request().url().includes('cdn.jsdelivr.net/npm/pdf-lib')) return route.fulfill({path:pdfLibrary,contentType:'application/javascript'});
      if (route.request().url().startsWith('http://127.0.0.1:') || route.request().url().startsWith('blob:')) return route.continue();
      return route.abort();
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?adc-preview=1`);
    await page.waitForFunction(() => window.PDFLib && document.querySelectorAll('[data-adc-official-form]').length === 26);
    const open = id => page.evaluate(id => document.querySelector(`[data-adc-official-form="${id}"]`).click(),id);
    async function fillRequired() {
      // Conditions can rebuild controls. Resolve the current DOM on each pass.
      for (let pass=0; pass<3; pass++) await page.evaluate(() => {
        for (const input of [...document.querySelectorAll('#adcOfficialForm [data-adc-field]')]) {
          if (!input.isConnected || input.disabled) continue;
          if (input.type === 'radio') {
            if (!document.querySelector(`input[name="${input.name}"]:checked`)) { input.checked=true; input.dispatchEvent(new Event('change',{bubbles:true})); }
          } else if (input.type === 'checkbox') {
            if (!input.checked) { input.checked=true; input.dispatchEvent(new Event('change',{bubbles:true})); }
          } else if ((input.required || input.dataset.adcField.endsWith('.jurisdiccionNueva')) && !input.value) {
            input.value = input.tagName === 'SELECT' ? input.options[1].value : input.type === 'date' ? '2026-11-12' : /dni|documento/i.test(input.dataset.adcField) ? '12345678' : input.type === 'number' ? '1' : 'Dato de prueba';
            input.dispatchEvent(new Event('input',{bubbles:true}));
          }
        }
      });
    }
    // DP-01 se revisa como PDF preparado, sin habilitar aún el esquema histórico.
    for (const form of forms.filter(form => !['bd02','dp01'].includes(form.id))) await t.test(form.id,async() => {
      await open(form.id);
      assert.ok(await page.locator('.adc-document-page').count(),`${form.id} se muestra al abrir`);
      await page.locator('[data-adc-document-pending]').click();
      assert.ok(await page.evaluate(() => document.activeElement.hasAttribute('data-adc-field')));
      await page.locator('[data-adc-official-action="download"]').first().click();
      assert.equal(await page.locator('.adc-review[data-adc-review-stage=summary]:not([hidden])').count(),1); await page.getByRole('button',{name:'Cancelar',exact:true}).click();
      await fillRequired();
      if (form.id === 'il01') {
        await page.locator('[data-adc-field="anio"]').fill('2026');
        await page.locator('[data-adc-field="anio"]').press('Tab');
        assert.equal(await page.locator('[data-adc-field="anio"]').inputValue(),'2026');
      }
      for (const group of form.sections) for (const top of group.fields) {
        const academic = top.type === 'repeat' ? top.fields.map(field => ({...field,path:`${top.key}.0.${field.key}`})) : [{...top,path:top.key}];
        for (const field of academic.filter(field => field.academicPart)) {
          const input = page.locator(`[data-adc-field="${field.path}"]`);
          if (!await input.count()) continue;
          const raw = field.academicPart === 'division' ? '2' : '3';
          await input.fill(raw); await input.press('Tab');
          assert.equal(await input.inputValue(),raw === '2' ? '2.ª' : '3°');
          assert.equal(await page.evaluate(({id,key})=>JSON.parse(localStorage.getItem(`adc-official-form-${id}-draft-v1`)).values[key],{id:form.id,key:field.path}),raw);
        }
      }
      for (const width of [320,390,1440]) {
        await page.setViewportSize({width,height:900});
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,`${form.id} a ${width}px`);
      }
      const mnc = page.locator('#adcOfficialForm [data-adc-mnc]:visible').first();
      let markedKey;
      if (await mnc.count()) {
        const key = await mnc.getAttribute('data-adc-mnc');
        await mnc.click();
        await page.locator('[data-adc-official-back]').click();
        await open(form.id);
        const input = page.locator(`[data-adc-field="${key}"]`);
        assert.equal(await input.isEditable(),false);
        assert.equal(await page.locator(`[data-adc-mnc="${key}"]`).getAttribute('aria-pressed'),'true');
        const line = page.locator(`[data-adc-mnc-line="${key}"]`);
        assert.equal(await line.isVisible(),true);
        const ratio = await line.evaluate(line => line.getBoundingClientRect().width/line.parentElement.getBoundingClientRect().width);
        assert.ok(Math.abs(ratio-.7)<.001);
        await page.locator(`[data-adc-mnc="${key}"]`).click();
        assert.equal(await input.isEditable(),true);
        await page.locator(`[data-adc-mnc="${key}"]`).click();
        markedKey = key;
      }
      await page.evaluate(() => {
        window.testPdfLines = [];
        window.testPdfBoxes = [];
        if (PDFLib.PDFPage.prototype.testOriginalDrawLine) return;
        const original = PDFLib.PDFPage.prototype.drawLine;
        PDFLib.PDFPage.prototype.testOriginalDrawLine = original;
        PDFLib.PDFPage.prototype.drawLine = function(options) { window.testPdfLines.push(options); return original.call(this,options); };
        const rectangle = PDFLib.PDFPage.prototype.drawRectangle;
        PDFLib.PDFPage.prototype.drawRectangle = function(options) {window.testPdfBoxes.push(options);return rectangle.call(this,options);};
      });
      const download = page.waitForEvent('download');
      await page.locator('[data-adc-official-action="download"]').first().click();
      await (await download).saveAs(path.join(output,form.id+'.pdf'));
      const positions = await page.evaluate(() => {
        const paper=document.querySelector('[data-adc-page="1"]').getBoundingClientRect();
        const field=document.querySelector('.adc-document-field').getBoundingClientRect();
        const unit=595.28/paper.width;
        return {screen:{x:(field.left-paper.left)*unit,y:841.89-(field.bottom-paper.top)*unit,width:field.width*unit,height:field.height*unit},pdf:testPdfBoxes[0]};
      });
      for (const key of ['x','y','width','height']) assert.ok(Math.abs(positions.screen[key]-positions.pdf[key])<.1,`${form.id} coincide en ${key}`);
      const optionPosition = await page.evaluate(() => {
        const input=document.querySelector('#adcOfficialForm input[type="radio"],#adcOfficialForm input[type="checkbox"]');
        if (!input) return true;
        const bounds=input.getBoundingClientRect();
        const paper=[...document.querySelectorAll('.adc-document-page')].map(page=>page.getBoundingClientRect()).find(page=>bounds.top>=page.top && bounds.bottom<=page.bottom);
        const unit=595.28/paper.width;
        const box={x:(bounds.left-paper.left)*unit,y:841.89-(bounds.bottom-paper.top)*unit,width:bounds.width*unit,height:bounds.height*unit};
        return testPdfBoxes.some(pdf=>['x','y','width','height'].every(key=>Math.abs(pdf[key]-box[key])<.1));
      });
      assert.equal(optionPosition,true,`${form.id} conserva la posición de sus opciones`);
      if (markedKey) {
        const lines = await page.evaluate(() => testPdfLines.filter(line => Math.abs(line.thickness-0.5*72/25.4)<1e-10));
        assert.ok(lines.length,form.id);
        assert.ok(Math.abs((lines[0].end.x-lines[0].start.x)/(595.28-84)-.7)<1e-10);
        assert.equal(lines[0].start.y,lines[0].end.y);
        await page.locator(`[data-adc-mnc="${markedKey}"]`).click();
      }
      if (form.id === 'sr01') {
        await page.evaluate(() => {document.activeElement.blur();document.querySelector('.adc-document-viewport').scrollTop=0;});
        await page.locator('.adc-document-viewport').screenshot({path:path.join(output,'lienzo-escritorio.png')});
      }
      for (const group of form.sections) for (const repeat of group.fields.filter(field => field.type === 'repeat')) {
        const container = page.locator('.adc-official-repeat').filter({has:page.getByRole('heading',{name:repeat.label,exact:true})});
        while (await container.locator('.adc-official-repeat-row').count()<3) await container.locator(':scope > button').click();
        const child = repeat.fields.find(field => field.type === 'text' && !field.signature);
        if (!child) continue;
        for (let index=0; index<3; index++) await page.locator(`[data-adc-field="${repeat.key}.${index}.${child.key}"]`).fill(`FILA_${index}`);
        const rowMnc = container.locator('.adc-official-repeat-row').first().locator('[data-adc-mnc]:visible').first();
        let rowMarkedChild;
        if (await rowMnc.count()) {
          rowMarkedChild = (await rowMnc.getAttribute('data-adc-mnc')).split('.').slice(2).join('.');
          await rowMnc.click();
        }
        await container.getByRole('button',{name:`Bajar ${repeat.label.toLowerCase()} 1`,exact:true}).click();
        assert.equal(await page.locator(`[data-adc-field="${repeat.key}.0.${child.key}"]`).inputValue(),'FILA_1');
        if (rowMarkedChild) assert.equal(await page.locator(`[data-adc-mnc="${repeat.key}.1.${rowMarkedChild}"]`).getAttribute('aria-pressed'),'true');
        await container.getByRole('button',{name:`Quitar ${repeat.label.toLowerCase()} 2`,exact:true}).click();
        assert.equal(await page.locator(`[data-adc-field="${repeat.key}.1.${child.key}"]`).inputValue(),'FILA_2');
        await open(form.id);
        assert.equal(await page.locator(`[data-adc-field="${repeat.key}.1.${child.key}"]`).inputValue(),'FILA_2');
      }
    });
    await t.test('BD-02 sobre el PDF adjunto, dos páginas y borrador independiente',async() => {
      await page.evaluate(() => {
        inst=[{id:900,name:'ESCUELA DE PRUEBA N.º 100',office:'1438',level:'Primario',localidad:'Resistencia',entries:[{djUid:'primero-bd02',type:'cargo',cargoCode:'123',cargoName:'Maestro de grado',revista:'Interino',turno:'Mañana',course:'',schedule:[0,0,0,0,0,0,0]}]}];
        for (const [id,value] of Object.entries({perfilApellidos:'Prueba',perfilNombres:'Docente',dni:'12345678',sexo:'M'})) {
          const input=document.getElementById(id);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
        }
        localStorage.setItem('adc_v08',JSON.stringify(data()));
      });
      await open('bd02');
      assert.equal(await page.locator('#adcBD02').isVisible(),true);
      assert.equal(await page.locator('#adcOfficialForm').isHidden(),true);
      assert.equal(await page.locator('#adcBD02 .adc-bd02-page>img').count(),2);
      assert.equal(await page.locator('[data-bd02-field="apellido"]').inputValue(),'Prueba');
      await page.locator('[data-bd02-school]').selectOption('900');
      assert.equal(await page.locator('[data-bd02-entry]').count(),1);
      await page.locator('[data-bd02-entry]').check();
      assert.equal(await page.locator('[data-bd02-field="codigoOficina"]').inputValue(),'1438');
      assert.equal(await page.locator('[data-bd02-field="cargos.0.descripcionCargo"]').inputValue(),'Maestro de grado');
      assert.equal(await page.locator('[data-bd02-unused]:visible').count(),4);
      assert.equal(await page.locator('[data-bd02-unused="1"] line').first().getAttribute('stroke-width'),String(72/25.4));
      assert.equal(await page.locator('[data-bd02-mnc="numeroDisposicion"]').count(),0);
      await page.locator('[data-bd02-action="preview"]').first().click();
      assert.match(await page.locator('.adc-review:not([hidden])').textContent(),/Hay datos pendientes/);
      assert.equal(await page.locator('[data-bd02-preview] iframe').count(),0);
      await page.getByRole('button',{name:'Cancelar',exact:true}).click();
      assert.equal(await page.locator('.adc-review:not([hidden])').isHidden(),true);
      await page.locator('[data-bd02-action="preview"]').first().click();
      await page.locator('[data-adc-review-continue]').click();
      await page.waitForSelector('[data-bd02-preview] iframe');
      const surname = page.locator('[data-bd02-field="apellido"]');
      assert.equal(Number(await surname.getAttribute('data-bd02-font-size')),12);
      await surname.fill('W'.repeat(27));
      const reduced = Number(await surname.getAttribute('data-bd02-font-size'));
      assert.ok(reduced >= 7 && reduced < 12, `Ajuste individual: ${reduced} pt`);
      assert.equal(Number(await page.locator('[data-bd02-field="nombres"]').getAttribute('data-bd02-font-size')),12);
      const longDownload = page.waitForEvent('download');
      await page.locator('[data-bd02-action="download"]').first().click();
      await page.waitForSelector('.adc-review:not([hidden])');
      await page.locator('[data-adc-review-continue]').click();
      await (await longDownload).saveAs(path.join(output,'BD-02-tipografia-larga.pdf'));
      const pdfApi = require(path.join(runtime,'pdf-lib'));
      const fittedPdf = await pdfApi.PDFDocument.load(fs.readFileSync(path.join(output,'BD-02-tipografia-larga.pdf')));
      const appearances = fittedPdf.context.enumerateIndirectObjects().flatMap(([, object]) => object instanceof pdfApi.PDFRawStream ? [Buffer.from(pdfApi.decodePDFRawStream(object).decode()).toString('latin1')] : []);
      assert.ok(appearances.some(stream => stream.includes(` ${reduced} Tf`)), 'El PDF conserva el tamaño calculado en pantalla');
      await surname.fill('Prueba');
      assert.equal(Number(await surname.getAttribute('data-bd02-font-size')),12);
      assert.equal(await page.locator('[data-bd02-field="numeroDisposicion"]').inputValue(),'');
      await page.locator('[data-bd02-field="numeroDisposicion"]').fill('1234/26');
      await page.locator('[data-bd02-field="actuacionSimple.serie"]').fill('123');
      await page.locator('[data-bd02-field="actuacionSimple.numero"]').fill('12345678');
      await page.locator('[data-bd02-field="actuacionSimple.anio"]').fill('12345');
      await page.locator('[data-bd02-calendar="cargos.0.fechaAlta"]').fill('2024-03-01');
      await page.locator('[data-bd02-calendar="cargos.0.fechaBaja"]').fill('2026-11-12');
      await page.locator('[data-bd02-calendar="fecha"]').fill('2026-11-12');
      for (let digit=0;digit<5;digit++) await page.locator(`[data-bd02-field="cargos.0.codigoMotivo.${digit}"]`).fill(String(digit+1));
      await page.evaluate(()=>{
        const transfer=new DataTransfer();transfer.setData('text','01234');
        document.querySelector('[data-bd02-field="cargos.0.codigoMotivo.0"]').dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:transfer}));
      });
      assert.equal(await page.locator('[data-bd02-field="cargos.0.codigoMotivo.0"]').inputValue(),'0');
      for (let digit=0;digit<5;digit++) await page.locator(`[data-bd02-field="cargos.0.codigoMotivo.${digit}"]`).fill(String(digit+1));
      await page.locator('[data-bd02-field="cargos.0.instrumentoAlta"]').fill('Disp. 25/2024');
      await page.locator('[data-bd02-field="cargos.0.descripcionMotivo"]').fill('Cese de funciones');
      await page.locator('[data-bd02-field="observaciones"]').fill('Datos ficticios para revisar la alineación.');
      await page.locator('[data-bd02-field="notificacion"]').fill('12/11/2026');
      assert.equal(await page.locator('[data-bd02-mnc="apellido"]').count(),0);
      assert.equal(await page.locator('[data-bd02-mnc^="cargos.0.codigoMotivo"]').count(),0);
      await page.locator('[data-bd02-mnc="cargos.0.especialidad"]').click();
      assert.equal(await page.locator('[data-bd02-field="cargos.0.especialidad"]').isEditable(),false);
      await page.locator('[data-bd02-mnc="cargos.0.especialidad"]').click();
      assert.equal(await page.locator('[data-bd02-field="cargos.0.especialidad"]').isEditable(),true);
      await page.locator('[data-bd02-mnc="cargos.0.especialidad"]').click();
      await page.locator('[data-bd02-action="preview"]').first().click();
      await page.waitForSelector('[data-bd02-preview] iframe');
      await page.locator('[data-bd02-field="apellido"]').fill('APELLIDO '.repeat(100));
      assert.equal(await page.locator('[data-bd02-preview]').isHidden(),true);
      await page.locator('[data-bd02-action="download"]').first().click();
      assert.match(await page.locator('[data-bd02-status]').textContent(),/excede su casillero/);
      assert.equal(await page.locator('[data-bd02-field="apellido"]').inputValue(),'APELLIDO '.repeat(100));
      await page.locator('[data-bd02-field="apellido"]').fill('Prueba');
      await page.reload();await open('bd02');
      assert.equal(await page.locator('[data-bd02-field="cargos.0.codigoMotivo.4"]').inputValue(),'5');
      assert.equal(await page.locator('[data-bd02-field="cargos.0.especialidad"]').isEditable(),false);
      for (const width of [320,390,1440]) {
        await page.setViewportSize({width,height:1100});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      }
      await page.locator('[data-bd02-field="numeroDisposicion"]').fill('');
      await page.locator('[data-bd02-action="print"]').first().click();
      assert.equal(await page.locator('.adc-review:not([hidden])').isVisible(),true);
      await page.getByRole('button',{name:'Cancelar',exact:true}).click();
      const download=page.waitForEvent('download');
      await page.locator('[data-bd02-action="download"]').first().click();
      assert.equal(await page.locator('.adc-review:not([hidden])').isVisible(),true);
      await page.locator('[data-adc-review-continue]').click();
      const result=path.join(output,'BD-02-ejemplo.pdf');await(await download).saveAs(result);
      const {PDFDocument}=require(path.join(runtime,'pdf-lib'));
      const original=await PDFDocument.load(fs.readFileSync(path.join(root,'assets/formularios/BD-02.pdf')));
      const completed=await PDFDocument.load(fs.readFileSync(result));
      assert.equal(completed.getPageCount(),2);
      assert.equal(completed.catalog.has(require(path.join(runtime,'pdf-lib')).PDFName.of('AcroForm')),false);
      assert.equal(completed.getForm().getFields().length,0);
      completed.getPages().forEach(page=>assert.equal(page.node.Annots()?.size() || 0,0));
      original.getPages().forEach((source,index)=>assert.deepEqual(completed.getPages()[index].getSize(),source.getSize()));
      assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'assets/formularios/BD-02.pdf'))).digest('hex'),'cca9e0b1d1630a809e6faf4881d94680d557337bbb0450dbdcee17ca9ad7beff');
      if (process.env.ADC_BD02_REVIEW_DIR) fs.copyFileSync(result,path.join(process.env.ADC_BD02_REVIEW_DIR,'BD-02-ejemplo.pdf'));
      await page.evaluate(()=>{document.activeElement.blur();document.querySelector('.adc-bd02-viewport').scrollTop=0;});
      await page.locator('.adc-bd02-viewport').screenshot({path:path.join(output,'BD-02-lienzo.png')});
      // Selección parcial, reordenamiento de bloques y conservación de correcciones/MNC.
      await page.evaluate(() => {
        inst[0].entries.push({djUid:'segundo-bd02',type:'asignatura',subject:'Matemática',course:'2 3',adcCourseParts:{year:'2',division:'3'},revista:'Titular',turno:'Tarde',schedule:[2,1,0,0,0,0,0],djPeriods:[{desde:'2023-04-05'}]});
        localStorage.setItem('adc_v08',JSON.stringify(data()));
        window.adcBD02Open();
      });
      await page.locator('[data-bd02-entry="segundo-bd02"]').check();
      assert.equal(await page.locator('[data-bd02-field="cargos.1.asignatura"]').inputValue(),'Matemática');
      assert.equal(await page.locator('[data-bd02-field="cargos.1.fechaAlta.day"]').inputValue(),'05');
      assert.equal(await page.locator('[data-bd02-field="cargos.1.horas"]').inputValue(),'3');
      assert.equal(await page.locator('[data-bd02-field="cargos.1.anio"]').inputValue(),'2°');
      assert.equal(await page.locator('[data-bd02-field="cargos.1.division"]').inputValue(),'3.ª');
      await page.locator('[data-bd02-field="cargos.1.asignatura"]').fill('Matemática corregida');
      await page.locator('[data-bd02-entry]').first().uncheck();
      assert.equal(await page.locator('[data-bd02-field="cargos.0.asignatura"]').inputValue(),'Matemática corregida');
      assert.equal(await page.locator('[data-bd02-unused]:visible').count(),4);
      await page.locator('[data-bd02-entry]').first().check();
      assert.equal(await page.locator('[data-bd02-field="cargos.1.descripcionCargo"]').inputValue(),'Maestro de grado');
      assert.equal(await page.locator('[data-bd02-field="cargos.1.especialidad"]').isEditable(),false);
      await page.reload(); await open('bd02');
      assert.equal(await page.locator('[data-bd02-entry]:checked').count(),2);
      assert.equal(await page.locator('[data-bd02-field="cargos.0.asignatura"]').inputValue(),'Matemática corregida');
      await page.evaluate(()=>{const input=document.getElementById('perfilApellidos');input.value='Perfil actualizado';input.dispatchEvent(new Event('input',{bubbles:true}));});
      assert.equal(await page.locator('[data-bd02-field="apellido"]').inputValue(),'Prueba');
      while (await page.locator('[data-bd02-conflicts]').getByRole('button',{name:'Conservar mi dato',exact:true}).count()) await page.locator('[data-bd02-conflicts]').getByRole('button',{name:'Conservar mi dato',exact:true}).first().click();
      assert.equal(await page.locator('[data-bd02-conflicts]').textContent(),'');
      assert.equal(await page.locator('[data-bd02-field="aclaracion"]').inputValue(),'Docente Prueba');
      const oldDraft={values:{apellido:'Anterior',nombres:'Docente',dni:'12345678',sexo:'M','cargos.0.establecimiento':'Unidad anterior','cargos.0.codigoOficina':'1111','cargos.0.categoria':'Primera','cargos.0.codigoCargo':'111','cargos.0.cargo':'Maestro','cargos.0.situacionRevista':'Interino','cargos.0.fechaAlta':'2024-03-01','cargos.0.fechaBaja':'2026-11-12','cargos.0.codigoMotivo':'123456','cargos.5.cargo':'Cargo excedente conservado'},marked:['cargos.0.especialidad'],rowCounts:{cargos:6}};
      await page.evaluate(draft=>{
        localStorage.removeItem('adc-bd02-borrador-v1');
        localStorage.setItem('adc-official-form-bd02-draft-v1',JSON.stringify(draft));
      },oldDraft);
      await page.reload();await open('bd02');
      assert.equal(await page.locator('[data-bd02-field="apellido"]').inputValue(),'Anterior');
      assert.equal(await page.locator('[data-bd02-field="categoria"]').inputValue(),'Primera');
      assert.equal(await page.locator('[data-bd02-field="cargos.0.especialidad"]').isEditable(),false);
      assert.match(await page.locator('[data-bd02-review]').textContent(),/más de cinco cargos/);
      assert.match(await page.locator('[data-bd02-review]').textContent(),/supera los cinco casilleros/);
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('adc-official-form-bd02-draft-v1'))),oldDraft);
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('adc-bd02-borrador-v1')).legacySnapshot),oldDraft);
    });
    await t.test('Máxima 2 cambia institución, conserva originales y exporta ordinales',async() => {
      await page.evaluate(() => {
        inst = [1,2].map(n=>({id:n,name:`Escuela ordinal ${n}`,office:'1438',level:'Secundario',entries:[{djUid:`ordinal-${n}`,type:'asignatura',subject:'Matemática',course:n===1?'1 1':'3º 2da',revista:'Interino',turno:'Mañana',schedule:[2,0,0,0,0,0,0],djPeriods:[]}]}));
        localStorage.setItem('adc_v08',JSON.stringify(data()));
        localStorage.removeItem('adc-bd02-borrador-v1');
        localStorage.removeItem('adc-official-form-bd02-draft-v1');
      });
      await page.reload(); await open('bd02');
      const original = await page.evaluate(()=>localStorage.getItem('adc_v08'));
      for (const [id,year,division] of [['1','1°','1.ª'],['2','3°','2.ª']]) {
        await page.locator('[data-bd02-school]').selectOption(id);
        await page.locator('[data-bd02-entry]').check();
        assert.equal(await page.locator('[data-bd02-field="cargos.0.anio"]').inputValue(),year);
        assert.equal(await page.locator('[data-bd02-field="cargos.0.division"]').inputValue(),division);
      }
      const download = page.waitForEvent('download');
      await page.locator('[data-bd02-action="download"]').first().click();
      await page.locator('[data-adc-review-continue]').click();
      await (await download).saveAs(path.join(output,'BD-02-cursos.pdf'));
      assert.equal(await page.evaluate(()=>localStorage.getItem('adc_v08')),original);
      await page.reload(); await open('bd02');
      assert.equal(await page.locator('[data-bd02-field="cargos.0.anio"]').inputValue(),'3°');
      assert.equal(await page.locator('[data-bd02-field="cargos.0.division"]').inputValue(),'2.ª');
    });
    await t.test('Máxima 1 guía BD-02 real, agrupa fecha y cancela sin abrir PDF',async()=>{
      await page.locator('[data-bd02-action="preview"]').first().click();
      await page.getByRole('button',{name:'Revisar pendientes',exact:true}).click();
      assert.equal(await page.evaluate(()=>document.activeElement.dataset.bd02Field),'numeroDisposicion');
      await page.locator('[data-bd02-field="numeroDisposicion"]').fill('12/26');
      await page.getByRole('button',{name:'Guardar y siguiente',exact:true}).click();
      assert.match(await page.locator('.adc-review:not([hidden]) h3').textContent(),/Fecha de alta/);
      assert.equal(await page.locator('#adcBD02 .adc-review-missing').count(),3);
      await page.screenshot({path:path.join(output,'revision-guiada-escritorio.png')});
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:path.join(output,'revision-guiada-celular.png')});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.getByRole('button',{name:'Cancelar',exact:true}).click();
      assert.equal(await page.locator('#adcBD02 .adc-review-missing').count(),0);
      assert.equal(await page.locator('[data-bd02-preview] iframe').count(),0);
      assert.equal(await page.locator('[data-bd02-field="numeroDisposicion"]').inputValue(),'12/26');
      await page.setViewportSize({width:1440,height:1100});
    });
    await t.test('Máxima 1 permite SC-01 incompleto y DL-01 sin período inventado',async()=>{
      await page.evaluate(()=>window.adcSC01Open());
      await page.locator('[data-adc-sc01-action="preview"]').first().click();
      await page.waitForSelector('.adc-review[data-adc-review-stage=summary]:not([hidden])');
      await page.getByRole('button',{name:'Continuar igual',exact:true}).click();
      await page.waitForSelector('#adcSC01Preview iframe');
      await page.locator('[data-adc-sc01-action="download"]').first().click();
      const scDownload=page.waitForEvent('download');
      await page.getByRole('button',{name:'Continuar igual',exact:true}).click();
      await(await scDownload).saveAs(path.join(output,'SC-01-incompleto.pdf'));
      await page.evaluate(()=>{tab('license');choose('Enfermedad o lesión común');$('desde').value='';$('hasta').value='';$('escuelaSelect').value=String(inst[0].id);generatePDF();});
      await page.waitForSelector('.adc-review[data-adc-review-stage=summary]:not([hidden])');
      await page.getByRole('button',{name:'Continuar igual',exact:true}).click();
      await page.waitForSelector('#pdfResult iframe');
      assert.equal(await page.locator('#desde').inputValue(),'');
      assert.equal(await page.locator('#hasta').inputValue(),'');
    });
    await t.test('Máxima 1 integra OL-01 y las impresiones de DJ-01 y DJ-02',async()=>{
      await page.evaluate(()=>{
        adcOLStart(false);adcOLForm.elements.school.value=String(inst[0].id);
        adcOLForm.elements.school.dispatchEvent(new Event('change',{bubbles:true}));
        adcOLPick('Enfermedad o lesión común');
        adcOLForm.elements.from.value='';adcOLForm.elements.until.value='';
        adcOLForm.requestSubmit();
      });
      await page.waitForSelector('.adc-review[data-adc-review-stage=summary]:not([hidden])');
      await page.getByRole('button',{name:'Continuar igual',exact:true}).click();
      await page.waitForSelector('#adcOLPreview iframe');
      assert.equal(await page.evaluate(()=>adcOLForm.elements.from.value),'');
      await page.evaluate(()=>{window.testPrintCalls=0;window.print=()=>testPrintCalls++;tab('dj');djRender();djPrint();});
      await page.waitForSelector('.adc-review[data-adc-review-stage=summary]:not([hidden])');
      await page.getByRole('button',{name:'Cancelar',exact:true}).click();
      assert.equal(await page.evaluate(()=>testPrintCalls),0);
      await page.evaluate(()=>{djPrint();});
      await page.getByRole('button',{name:'Continuar igual',exact:true}).click();
      await page.waitForFunction(()=>testPrintCalls===1);
      await page.evaluate(()=>{
        localStorage.setItem('adc_dj02_v1',JSON.stringify({fields:{Dni:$('dni').value},rows:[{articulo:'111',motivo:'Enfermedad',unidad:inst[0].name,desde:'2026-01-01',hasta:'2026-01-02'}]}));
        tab('dj02');dj02Open();dj02Print();
      });
      await page.waitForSelector('.adc-review[data-adc-review-stage=summary]:not([hidden])');
      await page.getByRole('button',{name:'Cancelar',exact:true}).click();
      assert.equal(await page.evaluate(()=>testPrintCalls),1);
      await page.evaluate(()=>{dj02Print();});
      await page.getByRole('button',{name:'Continuar igual',exact:true}).click();
      await page.waitForFunction(()=>testPrintCalls===2);
      await page.evaluate(()=>{document.body.classList.remove('dj-print-mode','dj02-print-mode')});
    });
    await t.test('Máxima 1: guía, edición, omisión, fechas agrupadas, cancelación y continuación',async()=>{
      await page.evaluate(()=>{
        const root=document.createElement('section');root.id='reviewFixture';
        root.innerHTML='<label>Nombre<input name="name" required></label><fieldset><legend>Fecha de alta</legend><input name="day" aria-label="Día" required><input name="month" aria-label="Mes" required><input name="year" aria-label="Año" required></fieldset><label><input type="checkbox" name="enabled" checked>Activar sección</label><label>Dato condicional<input name="conditional" required></label><label>Opcional<input name="optional"></label>';
        document.body.append(root);
        root.elements=Object.fromEntries([...root.querySelectorAll('input')].map(input=>[input.name,input]));
        root.addEventListener('change',()=>root.elements.conditional.disabled=!root.elements.enabled.checked);
        window.fixtureSaves=0;
        window.fixtureReview=adcGuidedValidation.create({root,save:()=>fixtureSaves++,collect:()=>{
          const items=adcGuidedValidation.controls(root);
          const date=items.filter(item=>['day','month','year'].includes(item.key));
          return [...items.filter(item=>item.key==='name'),...(date.length?[{key:'date',label:'Fecha de alta — Cargo 1',controls:date.flatMap(item=>item.controls)}]:[]),...items.filter(item=>!['day','month','year','name'].includes(item.key))];
        }});
        window.startReview=(guided=false)=>{window.fixtureResult=undefined;fixtureReview.review({guided}).then(value=>window.fixtureResult=value)};
        startReview();
      });
      const panel=page.locator('.adc-review:not([hidden])');
      assert.match(await panel.textContent(),/Encontramos 3 campos/);
      await panel.getByRole('button',{name:'Revisar pendientes',exact:true}).click();
      assert.equal(await page.evaluate(()=>document.activeElement.name),'name');
      await panel.getByRole('button',{name:'Editar',exact:true}).click();
      await page.locator('#reviewFixture [name=name]').fill('Ana');
      await panel.getByRole('button',{name:'Guardar y siguiente',exact:true}).click();
      assert.match(await panel.textContent(),/Fecha de alta — Cargo 1/);
      assert.equal(await page.locator('#reviewFixture .adc-review-missing').count(),3);
      await page.locator('#reviewFixture [name=day]').fill('12');
      await panel.getByRole('button',{name:'Seguir igual',exact:true}).click();
      assert.match(await panel.textContent(),/Dato condicional/);
      await page.locator('#reviewFixture [name=enabled]').uncheck();
      await panel.getByRole('button',{name:'Guardar y siguiente',exact:true}).click();
      assert.match(await panel.textContent(),/Revisión finalizada/);
      await panel.getByRole('button',{name:'Ver vista preliminar',exact:true}).click();
      assert.equal(await page.evaluate(()=>fixtureResult),true);
      assert.equal(await page.locator('#reviewFixture [name=day]').inputValue(),'12');
      assert.equal(await page.locator('#reviewFixture .adc-review-missing').count(),0);
      await page.evaluate(()=>startReview());
      assert.match(await panel.textContent(),/Encontramos 1 campo/);
      await panel.getByRole('button',{name:'Cancelar',exact:true}).click();
      assert.equal(await page.evaluate(()=>fixtureResult),false);
      await page.setViewportSize({width:390,height:844});
      await page.evaluate(()=>startReview(true));
      const bounds=await panel.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=390);
      await panel.getByRole('button',{name:'Cancelar',exact:true}).click();
      assert.equal(await page.locator('#reviewFixture [name=name]').inputValue(),'Ana');
      await page.evaluate(()=>startReview());
      await panel.getByRole('button',{name:'Continuar igual',exact:true}).click();
      assert.equal(await page.evaluate(()=>fixtureResult),true);
      await page.locator('#reviewFixture [name=month]').fill('01');
      await page.locator('#reviewFixture [name=year]').fill('2026');
      await page.evaluate(()=>startReview());
      assert.equal(await page.evaluate(()=>fixtureResult),true);
      assert.equal(await panel.count(),0);
      assert.equal(await page.evaluate(()=>fixtureSaves),2);
      await page.locator('#reviewFixture').evaluate(node=>node.remove());
      await page.setViewportSize({width:1440,height:1100});
    });
    await open('interinos');
    await fillRequired();
    await page.locator('[data-adc-field="correo"]').fill('invalido');
    await page.locator('[data-adc-official-action="preview"]').first().click();
    assert.match(await page.locator('[data-adc-official-status]').textContent(),/obligatorios/);
    await page.locator('[data-adc-field="correo"]').fill('prueba@example.org');
    await page.locator('[data-adc-field="domicilio"]').fill('PALABRA '.repeat(900)+'FIN_DOMICILIO');
    await page.locator('[data-adc-official-action="preview"]').first().click();
    await page.waitForSelector('[data-adc-official-preview] iframe');
    await page.locator('[data-adc-field="domicilio"]').fill('Modificado');
    assert.equal(await page.locator('[data-adc-official-preview]').isHidden(),true);
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Ajustar al ancho',exact:true}).click();
    const beforeZoom = await page.locator('[data-adc-zoom-value]').textContent();
    await page.getByRole('button',{name:'Aumentar zoom',exact:true}).click();
    assert.notEqual(await page.locator('[data-adc-zoom-value]').textContent(),beforeZoom);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth>innerWidth),false);
    await page.getByRole('button',{name:'Ajustar al ancho',exact:true}).click();
    assert.equal(await page.locator('[data-adc-zoom-value]').textContent(),beforeZoom);
    await page.evaluate(() => {document.activeElement.blur();document.querySelector('.adc-document-viewport').scrollTop=0;});
    await page.locator('.adc-document-viewport').screenshot({path:path.join(output,'lienzo-celular.png')});
    await open('sr01');
    await fillRequired();
    await page.locator('[data-adc-field="domicilio"]').fill('PALABRA '.repeat(900)+'FIN_DOMICILIO');
    await page.locator('[data-adc-field="noJustificada"]').fill('OBSERVACION '.repeat(900)+'FIN_OBSERVACION');
    const download = page.waitForEvent('download');
    await page.locator('[data-adc-official-action="download"]').first().click();
    await (await download).saveAs(path.join(output,'texto-largo.pdf'));
    const continuation = page.locator('.adc-document-continuation').first();
    assert.ok(await continuation.count());
    await continuation.click();
    assert.ok(await page.evaluate(() => document.activeElement.hasAttribute('data-adc-field')));
    // Required exceptions stay confined to their official form. Profile changes preserve optional MNC.
    await open('sr01');
    await page.locator('[data-adc-field="domicilio"]').fill('');
    await page.locator('[data-adc-mnc="domicilio"]').click();
    await page.evaluate(() => { const profile=document.getElementById('perfilDomicilio'); profile.value='Calle del perfil'; profile.dispatchEvent(new Event('input',{bubbles:true})); });
    assert.equal(await page.locator('[data-adc-field="domicilio"]').inputValue(),'');
    assert.equal(await page.locator('[data-adc-field="domicilio"]').isEditable(),false);
    await page.reload();
    await open('sr01');
    assert.equal(await page.locator('[data-adc-field="domicilio"]').isEditable(),false);
    await t.test('DP-01 preparado: documento intacto, acciones y borrador histórico conservado', async () => {
      const key = 'adc-official-form-dp01-draft-v1';
      const previous = JSON.stringify({schemaVersion:2,values:{apellido:'Corrección histórica'},marked:['codigoAnexo']});
      await page.evaluate(({key,previous}) => localStorage.setItem(key,previous),{key,previous});
      await open('dp01');
      assert.equal(await page.locator('#adcOfficialForm').getAttribute('data-adc-document-mode'),'original');
      assert.match(await page.locator('[data-adc-official-notices]').textContent(),/2009/);
      assert.equal(await page.locator('#adcOfficialForm [data-adc-field]').count(),0);
      assert.equal(await page.locator('#adcOfficialForm [data-adc-mnc]').count(),0);
      assert.equal(await page.locator('[data-adc-document-pending]').isVisible(),false);
      await page.waitForFunction(() => document.querySelector('.adc-prepared-pdf-page')?.naturalWidth > 0);
      assert.equal(await page.locator('.adc-prepared-pdf-page').evaluate(image => image.complete && image.naturalWidth > 0),true);
      for (const width of [320,390,1440]) {
        await page.setViewportSize({width,height:1000});
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
      }
      for (const index of [0,1]) {
        const download = page.waitForEvent('download');
        await page.locator('[data-adc-official-action="download"]').nth(index).click();
        const result = await download;
        assert.equal(result.suggestedFilename(),'DP-01_original.pdf');
        assert.deepEqual(fs.readFileSync(await result.path()),fs.readFileSync(path.join(root,'assets/formularios/DP-01.pdf')));
        await page.locator('[data-adc-official-action="preview"]').nth(index).click();
        const bytes = await page.locator('[data-adc-official-preview] iframe').evaluate(async frame => Array.from(new Uint8Array(await (await fetch(frame.src)).arrayBuffer())));
        assert.deepEqual(Buffer.from(bytes),fs.readFileSync(path.join(root,'assets/formularios/DP-01.pdf')));
      }
      await page.evaluate(() => {
        window.testPreparedPrints = [];
        window.testPreparedOriginalOpen = window.open;
        window.open = url => {window.testPreparedPrints.push(url); return {addEventListener:(_,callback)=>callback(),print:()=>window.testPreparedPrintCalled=true};};
      });
      for (const index of [0,1]) await page.locator('[data-adc-official-action="print"]').nth(index).click();
      await page.waitForFunction(() => window.testPreparedPrintCalled);
      assert.equal(await page.evaluate(() => testPreparedPrints.length),2);
      const printed = await page.evaluate(async () => Array.from(new Uint8Array(await (await fetch(testPreparedPrints[1])).arrayBuffer())));
      assert.deepEqual(Buffer.from(printed),fs.readFileSync(path.join(root,'assets/formularios/DP-01.pdf')));
      await page.evaluate(() => {window.open = window.testPreparedOriginalOpen;});
      assert.equal(await page.evaluate(key => localStorage.getItem(key),key),previous);
      await page.locator('[data-adc-official-back]').click();
      await open('dp01');
      assert.equal(await page.locator('.adc-prepared-pdf-page').count(),1);
      await open('sr01');
      assert.equal(await page.locator('#adcOfficialForm').getAttribute('data-adc-document-mode'),'editable');
      assert.ok(await page.locator('#adcOfficialForm [data-adc-field]').count());
      assert.equal(await page.locator('[data-adc-official-mnc-help]').isVisible(),true);
    });
    await open('form-5');
    await page.locator('[data-adc-field="opcion"][value="Renuncia"]').check();
    await page.locator('[data-adc-field="opcion"][value="Activo / jubilado"]').check();
    assert.equal(await page.locator('[data-adc-field="opcion"]:checked').count(),1);
    // A corrected draft remains intact until the user explicitly adopts the changed profile.
    await page.evaluate(() => {
      localStorage.removeItem('adc-official-form-beneficiarios-draft-v1');
      document.getElementById('perfilApellidos').value='Apellido del perfil';
    });
    await open('beneficiarios');
    assert.equal(await page.locator('[data-adc-field="apellido"]').inputValue(),'Apellido del perfil');
    assert.match(await page.locator('[data-adc-field="apellido"]').getAttribute('title'),/Perfil Docente/);
    await page.locator('[data-adc-field="apellido"]').fill('Corrección local');
    await page.evaluate(() => {const field=document.getElementById('perfilApellidos');field.value='Perfil actualizado';field.dispatchEvent(new Event('input',{bubbles:true}));});
    assert.equal(await page.locator('[data-adc-field="apellido"]').inputValue(),'Corrección local');
    await page.locator('[data-adc-profile-conflicts]').getByRole('button',{name:'Conservar en el formulario',exact:true}).click();
    await open('beneficiarios');
    assert.equal(await page.locator('.adc-profile-conflict').count(),0);
    await page.evaluate(() => {const field=document.getElementById('perfilApellidos');field.value='Otro apellido del perfil';field.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.locator('[data-adc-profile-conflicts]').getByRole('button',{name:'Usar dato del perfil',exact:true}).click();
    assert.equal(await page.locator('[data-adc-field="apellido"]').inputValue(),'Otro apellido del perfil');
    await page.evaluate(() => {document.activeElement.blur();document.documentElement.dataset.theme='dark';});
    assert.equal(await page.locator('.adc-document-page').first().evaluate(page=>getComputedStyle(page).backgroundColor),'rgb(255, 255, 255)');
    await page.locator('[data-adc-field="apellido"]').focus();
    assert.equal(await page.locator('[data-adc-field="apellido"]').evaluate(input=>getComputedStyle(input).color),'rgb(20, 26, 33)');
    await page.evaluate(() => {document.activeElement.blur();document.documentElement.dataset.theme='light';});
    // Old single-agent N4 drafts migrate once and retain later edits.
    await page.evaluate(() => localStorage.setItem('adc-official-form-form-4-draft-v1',JSON.stringify({values:{apellido:'APELLIDO ANTERIOR',nombres:'Nombre',dni:'12345678',jurisdiccionActual:'Actual',jurisdiccionNueva:'Nueva'},marked:['jurisdiccionAlternativa'],touched:['apellido']})));
    await open('form-4');
    assert.equal(await page.locator('[data-adc-field="agentes.0.apellido"]').inputValue(),'APELLIDO ANTERIOR');
    assert.equal(await page.locator('[data-adc-mnc="agentes.0.jurisdiccionAlternativa"]').getAttribute('aria-pressed'),'true');
    await page.locator('[data-adc-field="agentes.0.apellido"]').fill('');
    await open('form-4');
    assert.equal(await page.locator('[data-adc-field="agentes.0.apellido"]').inputValue(),'');
    assert.deepEqual(errors,[]);
    console.log(`PDF de prueba para inspección visual: ${output}`);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
