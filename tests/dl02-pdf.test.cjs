const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const runtime = path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium} = require(path.join(runtime, 'playwright'));
const {PDFDocument} = require(path.join(runtime, 'pdf-lib'));

test('DL-02: PDF original íntegro, campos, visor, borrador, limpieza y revisión', {timeout:120000}, async () => {
  const output = path.join(root, '.adc-tools/dl02');
  fs.mkdirSync(output, {recursive:true});
  const original = fs.readFileSync(path.join(root, 'assets/formularios/DL-02.pdf'));
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'), 'd14c189630e5ae6d7ceb9c811bc8c02305d72352bdf7c502df63f07a1a0ab0cf');
  const server = http.createServer((request, response) => {
    if (require('./support/demo-config.cjs').serve(request, response)) return;
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (!pathname.startsWith('/adc/')) return response.writeHead(404).end();
    const file = path.resolve(root, decodeURIComponent(pathname.slice(5)));
    if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
    fs.readFile(file, (error, data) => {
      if (error) return response.writeHead(404).end();
      response.setHeader('Content-Type', ({'.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.pdf':'application/pdf'})[path.extname(file)] || 'application/octet-stream');
      response.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({channel:'chrome', headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1500, height:1000}, acceptDownloads:true, hasTouch:true});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https:\/\//, route => route.abort());
    await page.route('**/assets/datos/ajustes-pagina.json', route => route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`);
    for (const [id,value] of Object.entries({perfilApellidos:'Prueba',perfilNombres:'Ana',dni:'30123456'})) await page.locator('#'+id).fill(value);
    await page.locator('#sexo').selectOption('F');
    await page.evaluate(() => localStorage.setItem('adc_v08', JSON.stringify(data())));
    const open = async () => {
      await page.evaluate(() => tab('tramites'));
      await page.locator('.adc-form-catalog [data-adc-official-form=dl02]').click();
    };
    await open();
    const section = page.locator('#adcOfficialForm');
    const field = key => section.locator(`[data-adc-field="${key}"]`);
    const viewer = section.locator('.adc-pdf-viewer');
    const viewport = section.locator('.adc-document-viewport');
    const nav = viewer.locator('.adc-pdf-navigation');
    const action = name => section.locator(`[data-adc-official-action=${name}]`);
    assert.equal(await section.locator('.adc-prepared-background').count(), 2);
    assert.equal(await field('apellido').inputValue(), 'Prueba');
    assert.equal(await field('nombres').inputValue(), 'Ana');
    assert.equal((await field('dni').inputValue()).replace(/\D/g,''), '30123456');
    assert.equal(await section.locator('[data-adc-field=sexo][value=F]').isChecked(), true);
    for (const name of ['preview','download','print']) assert.equal(await action(name).locator('svg').count(), 2);
    for (const name of ['save','clear']) assert.equal(await section.locator(`[data-adc-draft-action=${name}]`).count(), 2);
    await field('numeroDisposicion').fill('123/26');
    await field('interrupciones.0.codigoCargo').fill('123');
    await field('interrupciones.0.descripcionCargo').fill('Profesor');
    await section.locator('[data-adc-field="interrupciones.0.revista"][value=Interino]').check();
    await field('interrupciones.0.fechaInterrupcion').fill('2026-11-17');
    await field('interrupciones.0.instrumento').fill('Res. 1');
    const organizer = section.locator('[data-prepared-repeat=interrupciones]');
    for (let index=1;index<5;index++) {
      await organizer.evaluate(node => node.open=true);
      await organizer.locator('[data-adc-repeat-add=interrupciones]').click();
      await field(`interrupciones.${index}.codigoCargo`).fill(String(123+index));
      await field(`interrupciones.${index}.descripcionCargo`).fill(`Cargo ${index+1}`);
      await section.locator(`[data-adc-field="interrupciones.${index}.revista"][value=Titular]`).check();
    }
    await organizer.evaluate(node => node.open=false);
    await section.locator('[data-adc-mnc="interrupciones.0.asignatura"]').click();
    await section.locator('[data-adc-draft-action=save]').first().click();
    await page.reload();
    await open();
    assert.equal(await field('numeroDisposicion').inputValue(), '123/26');
    assert.equal(await section.locator('[data-adc-mnc="interrupciones.0.asignatura"]').getAttribute('aria-pressed'), 'true');
    const download = async name => {
      const pending = page.waitForEvent('download');
      await action('download').first().click();
      const file = path.join(output, name);
      await (await pending).saveAs(file);
      return PDFDocument.load(fs.readFileSync(file));
    };
    const pdf = await download('DL-02-completado.pdf');
    const source = await PDFDocument.load(original);
    assert.equal(pdf.getPageCount(), 2);
    function contents(document, page) {
      const value = page.node.Contents();
      return (value.asArray ? value.asArray() : [value]).map(item => Buffer.from(document.context.lookup(item).getContents()));
    }
    for (let index=0;index<2;index++) {
      assert.deepEqual(pdf.getPage(index).getSize(), source.getPage(index).getSize());
      const streams = contents(pdf, pdf.getPage(index));
      for (const stream of contents(source, source.getPage(index))) assert.ok(streams.some(candidate => candidate.equals(stream)), 'El contenido original de cada página se conserva íntegro');
    }
    assert.equal(pdf.getForm().getFields().length, 0);
    await action('preview').first().click();
    await page.waitForSelector('[data-adc-official-preview] iframe');
    await page.evaluate(() => {
      window.dl02OriginalOpen = window.open;
      window.open = () => ({addEventListener(event, callback) {callback();}, print() {window.dl02PrintRequested=true;}});
    });
    await action('print').first().click();
    await page.waitForFunction(() => window.dl02PrintRequested === true);
    await page.evaluate(() => window.open = dl02OriginalOpen);
    const zoom = nav.locator('input');
    for (const value of [25,200]) {
      await zoom.evaluate((node, next) => {node.value=String(next);node.dispatchEvent(new Event('input',{bubbles:true}));}, value);
      assert.equal(await zoom.inputValue(), String(value));
    }
    const zoomPdf = await download('DL-02-zoom-200.pdf');
    for (let index=0;index<2;index++) assert.deepEqual(contents(zoomPdf,zoomPdf.getPage(index)), contents(pdf,pdf.getPage(index)), 'El zoom conserva exactamente los comandos del PDF');
    const floating = viewer.locator('.adc-pdf-floating-fullscreen');
    await viewer.evaluate(node => node.requestFullscreen = undefined);
    await floating.click();
    assert.equal(await floating.getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Escape');
    await viewport.dblclick({position:{x:12,y:100}});
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), true);
    await viewport.dblclick({position:{x:12,y:100}});
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), false);
    await field('apellido').dblclick();
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), false);
    await page.evaluate(() => {
      getSelection().removeAllRanges();
      const target = document.querySelector('#adcOfficialForm .adc-document-viewport');
      const touch = new Touch({identifier:1,target,clientX:25,clientY:100});
      window.dl02TouchResults = [];
      for (let pair=0;pair<2;pair++) {
        for (let tap=0;tap<2;tap++) {
          target.dispatchEvent(new TouchEvent('touchstart',{touches:[touch],changedTouches:[touch],bubbles:true,cancelable:true}));
          target.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[touch],bubbles:true,cancelable:true}));
        }
        dl02TouchResults.push(target.parentElement.classList.contains('adc-pdf-expanded'));
      }
    });
    assert.deepEqual(await page.evaluate(() => dl02TouchResults), [true,false]);
    assert.equal(await page.evaluate(() => Boolean(history.state?.adcPdfFullscreen)), false);
    for (const width of [390,1500]) {
      await page.setViewportSize({width,height:1000});
      await nav.locator('[data-viewer-action=width]').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await viewer.locator('.adc-pdf-scroll').isVisible(), false);
      const viewportBox = await viewport.boundingBox();
      const buttonBox = await floating.boundingBox();
      assert.ok(buttonBox.y >= viewportBox.y && buttonBox.y + buttonBox.height <= viewportBox.y + viewportBox.height);
      for (const theme of ['light','dark']) {
        await page.locator('html').evaluate((node,value) => node.dataset.theme=value, theme);
        await viewport.evaluate(node => {node.scrollTop=0;node.scrollLeft=0;});
        await page.evaluate(() => window.scrollTo(0,0));
        await section.screenshot({path:path.join(output, `${width}-${theme}.png`)});
      }
    }
    await field('dni').fill('abc');
    await action('preview').first().click();
    const review = section.locator('.adc-interinos-review');
    await review.locator('[data-review-key=dni]').getByRole('button',{name:'Ir al campo',exact:true}).click();
    assert.equal(await field('dni').evaluate(node => node === document.activeElement), true);
    assert.equal(await field('dni').evaluate(node => node.classList.contains('adc-dl02-review-focus')), true);
    await field('dni').fill('30123456');
    assert.equal(await review.locator('[data-review-key=dni]').count(), 0);
    await section.locator('[data-adc-draft-action=clear]').first().click();
    await section.locator('.adc-incapacidad-confirm').getByRole('button',{name:'Sí, limpiar formulario',exact:true}).click();
    assert.equal(await field('numeroDisposicion').inputValue(), '');
    assert.equal(await field('apellido').inputValue(), 'Prueba');
    await page.reload();await open();
    assert.equal(await field('numeroDisposicion').inputValue(), '');
    // Borradores anteriores de varias instituciones se conservan para revisar.
    await page.evaluate(() => localStorage.setItem('adc-official-form-dl02-draft-v1', JSON.stringify({
      schemaVersion:2,
      values:{apellido:'Prueba',nombres:'Ana',dni:'30123456','interrupciones.0.establecimiento':'Escuela anterior','interrupciones.1.establecimiento':'Otra escuela','interrupciones.0.situacionRevista':'INTERINO'},
      rowCounts:{interrupciones:2},
      touched:['apellido','nombres','dni']
    })));
    await page.reload();await open();
    assert.equal(await field('interrupciones.0.establecimiento').inputValue(), 'Escuela anterior');
    assert.equal(await field('interrupciones.1.establecimiento').inputValue(), 'Otra escuela');
    assert.equal(await field('interrupciones.0.situacionRevista').inputValue(), 'INTERINO');
    await action('preview').first().click();
    assert.equal(await section.locator('[data-adc-official-preview] iframe').count(), 0);
    assert.ok(await section.locator('.adc-interinos-review [data-severity=blocking]').count() > 0);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
