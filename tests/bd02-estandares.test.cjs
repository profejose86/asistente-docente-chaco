const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const runtime = path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium} = require(path.join(runtime, 'playwright'));

test('BD-02: VPI-01 con activación por doble gesto y edición independiente', {timeout:120000}, async () => {
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
    const page = await browser.newPage({viewport:{width:1440, height:1000}, hasTouch:true});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https:\/\//, route => route.abort());
    await page.route('**/assets/datos/ajustes-pagina.json', route => route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`);
    await page.locator('#perfilApellidos').fill('Prueba');
    await page.locator('#perfilNombres').fill('Ana');
    await page.locator('#dni').fill('30123456');
    await page.evaluate(() => localStorage.setItem('adc_v08', JSON.stringify(data())));
    assert.deepEqual(errors, []);
    await page.evaluate(() => adcBD02Open());
    const section = page.locator('#adcBD02');
    const viewer = section.locator('.adc-pdf-viewer');
    const viewport = section.locator('.adc-bd02-viewport');
    const nav = section.locator('.adc-pdf-navigation');
    const slider = nav.locator('input');
    const field = key => section.locator(`[data-bd02-field="${key}"]`);
    const setZoom = value => slider.evaluate((node, next) => {
      node.value = String(next);
      node.dispatchEvent(new Event('input', {bubbles:true}));
    }, value);
    assert.equal(await nav.isVisible(), true);
    await setZoom(200);
    await nav.locator('[data-viewer-action=in]').click();
    assert.equal(await slider.inputValue(), '200');
    await setZoom(25);
    await nav.locator('[data-viewer-action=out]').click();
    assert.equal(await slider.inputValue(), '25');
    await slider.focus();
    await slider.press('ArrowRight');
    assert.equal(await slider.inputValue(), '26');
    await setZoom(150);
    await viewport.scrollIntoViewIfNeeded();
    const box = await viewport.boundingBox();
    await page.mouse.move(box.x + 12, box.y + 35);
    await page.mouse.wheel(0, -100);
    await page.waitForFunction(() => Number(document.querySelector('#adcBD02 .adc-pdf-navigation input').value) > 150);
    assert.ok(Number(await slider.inputValue()) > 150);
    await viewport.evaluate(node => {node.scrollTop = 220; node.scrollLeft = 120;});
    const before = await viewport.evaluate(node => node.scrollTop);
    await page.mouse.move(box.x + 12, box.y + 35);
    await page.mouse.down();
    await page.mouse.move(box.x + 35, box.y + 85, {steps:5});
    await page.mouse.up();
    assert.ok(await viewport.evaluate(node => node.scrollTop) < before);
    await viewer.evaluate(node => node.requestFullscreen = undefined);
    const originalUrl = page.url();
    await page.evaluate(() => history.replaceState({bd02Test:'estado previo'}, ''));
    await viewport.dblclick({position:{x:12, y:100}});
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), true);
    await viewport.dblclick({position:{x:12, y:100}});
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), false);
    await page.waitForFunction(() => history.state?.bd02Test === 'estado previo' && !history.state.adcPdfFullscreen);
    await viewport.dblclick({position:{x:12, y:100}});
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('#adcBD02 .adc-pdf-viewer').classList.contains('adc-pdf-expanded'));
    assert.equal(page.url(), originalUrl);
    assert.equal(await section.isVisible(), true);
    assert.equal(await field('apellido').inputValue(), 'Prueba');
    // También se comprueba Atrás con Fullscreen API nativa de Chrome.
    await viewer.evaluate(node => delete node.requestFullscreen);
    await nav.locator('[data-viewer-action=fullscreen]').click();
    await page.waitForFunction(() => document.fullscreenElement?.closest('#adcBD02'));
    await page.goBack();
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.equal(page.url(), originalUrl);
    assert.deepEqual(await page.evaluate(() => history.state), {bd02Test:'estado previo'});
    await viewer.evaluate(node => node.requestFullscreen = undefined);
    await viewport.dblclick({position:{x:12, y:100}});
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !history.state?.adcPdfFullscreen);
    await field('apellido').dblclick();
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), false);
    await field('apellido').fill('Prueba editada');
    assert.equal(await field('apellido').inputValue(), 'Prueba editada');
    for (const width of [390, 1440]) {
      await page.setViewportSize({width, height:1000});
      await nav.locator('[data-viewer-action=width]').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await viewer.locator('.adc-pdf-scroll').isVisible(), false);
      assert.equal(await viewport.evaluate(node => getComputedStyle(node).overflowY), 'auto');
      for (const theme of ['light', 'dark']) {
        await page.locator('html').evaluate((node, value) => node.dataset.theme = value, theme);
        assert.equal(await nav.isVisible(), true);
      }
    }
    await page.evaluate(() => {
      const target = document.querySelector('#adcBD02 .adc-bd02-viewport');
      const touch = new Touch({identifier:1, target, clientX:25, clientY:100});
      for (let i = 0; i < 2; i++) {
        target.dispatchEvent(new TouchEvent('touchstart', {touches:[touch], changedTouches:[touch], bubbles:true, cancelable:true}));
        target.dispatchEvent(new TouchEvent('touchend', {touches:[], changedTouches:[touch], bubbles:true, cancelable:true}));
      }
    });
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), true);
    await page.evaluate(() => {
      const target = document.querySelector('#adcBD02 .adc-bd02-viewport');
      const touch = new Touch({identifier:1, target, clientX:25, clientY:100});
      for (let i = 0; i < 2; i++) {
        target.dispatchEvent(new TouchEvent('touchstart', {touches:[touch], changedTouches:[touch], bubbles:true, cancelable:true}));
        target.dispatchEvent(new TouchEvent('touchend', {touches:[], changedTouches:[touch], bubbles:true, cancelable:true}));
      }
    });
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), false);
    await page.waitForFunction(() => !history.state?.adcPdfFullscreen);
    await page.keyboard.press('Escape');
    // ACC1 conserva las claves históricas y reconoce fallos de escritura.
    for (const name of ['preview', 'download', 'print']) {
      assert.equal(await section.locator(`[data-bd02-action=${name}] svg`).count(), 2);
    }
    const save = section.locator('[data-bd02-draft-action=save]');
    const clear = section.locator('[data-bd02-draft-action=clear]');
    const dialog = section.locator('.adc-incapacidad-confirm');
    assert.equal(await save.count(), 2);
    assert.equal(await clear.count(), 2);
    let downloads = 0;
    page.on('download', () => downloads++);
    await field('observaciones').fill('Borrador BD-02');
    await section.locator('[data-bd02-mnc=categoria]').click();
    await save.first().click();
    assert.deepEqual(await section.locator('[data-adc-draft-status]').allTextContents(), ['Guardado en este dispositivo', 'Guardado en este dispositivo']);
    await page.reload();
    await page.evaluate(() => adcBD02Open());
    assert.equal(await field('observaciones').inputValue(), 'Borrador BD-02');
    assert.equal(await section.locator('[data-bd02-mnc=categoria]').getAttribute('aria-pressed'), 'true');
    const observationMnc = section.locator('[data-bd02-mnc=observaciones]');
    const mncDialog = section.locator('dialog').filter({has:page.locator('[data-bd02-mnc-confirm]')});
    await observationMnc.click();
    await mncDialog.getByRole('button', {name:'Cancelar', exact:true}).click();
    assert.equal(await field('observaciones').inputValue(), 'Borrador BD-02');
    await observationMnc.click();
    await mncDialog.getByRole('button', {name:'Sí, marcar No corresponde', exact:true}).click();
    assert.equal(await field('observaciones').inputValue(), '');
    assert.equal(await field('observaciones').isEditable(), false);
    const line = section.locator('[data-bd02-mnc-line=observaciones]');
    assert.ok(Math.abs(await line.evaluate(node => node.getBoundingClientRect().width / node.parentElement.getBoundingClientRect().width) - .7) < .001);
    await page.reload();
    await page.evaluate(() => adcBD02Open());
    assert.equal(await observationMnc.getAttribute('aria-pressed'), 'true');
    assert.equal(await section.locator('[data-review-key="mnc-restore-observaciones"]').getAttribute('data-severity'), 'suggestion');
    await observationMnc.click();
    assert.equal(await field('observaciones').inputValue(), 'Borrador BD-02');
    assert.equal(await field('observaciones').isEditable(), true);
    const preserved = await page.evaluate(() => {
      localStorage.setItem('adc-official-form-bd02-draft-v1', JSON.stringify({values:{observaciones:'Histórico que no debe reaparecer'}}));
      localStorage.setItem('adc-official-form-cf01-draft-v1', 'Otro documento');
      return {profile:localStorage.getItem('adc_v08'), other:localStorage.getItem('adc-official-form-cf01-draft-v1')};
    });
    await clear.first().click();
    await dialog.getByRole('button', {name:'Cancelar', exact:true}).click();
    assert.equal(await field('observaciones').inputValue(), 'Borrador BD-02');
    const draft = await page.evaluate(() => localStorage.getItem('adc-bd02-borrador-v1'));
    await page.evaluate(() => {
      window.bd02Store = adcUserStorage;
      window.adcUserStorage = {...adcUserStorage, setItem() {throw Error('Fallo simulado');}};
    });
    await save.last().click();
    assert.match(await section.locator('[data-adc-draft-status]').first().innerText(), /Error al guardar/);
    await clear.last().click();
    await dialog.getByRole('button', {name:'Sí, limpiar formulario', exact:true}).click();
    assert.equal(await field('observaciones').inputValue(), 'Borrador BD-02');
    assert.equal(await page.evaluate(() => localStorage.getItem('adc-bd02-borrador-v1')), draft);
    await page.evaluate(() => window.adcUserStorage = bd02Store);
    await clear.last().click();
    await dialog.getByRole('button', {name:'Sí, limpiar formulario', exact:true}).click();
    assert.equal(await field('observaciones').inputValue(), '');
    assert.equal(await field('apellido').inputValue(), 'Prueba');
    assert.equal(await section.locator('[data-bd02-mnc=categoria]').getAttribute('aria-pressed'), 'false');
    assert.deepEqual(await page.evaluate(() => ({profile:localStorage.getItem('adc_v08'), other:localStorage.getItem('adc-official-form-cf01-draft-v1')})), preserved);
    await page.reload();
    await page.evaluate(() => adcBD02Open());
    assert.equal(await field('observaciones').inputValue(), '');
    assert.equal(downloads, 0);
    // REV-01 usa las reglas reales y conduce a la selección pendiente.
    const review = section.locator('.adc-interinos-review');
    assert.equal(await review.isVisible(), true);
    await page.setViewportSize({width:390, height:1000});
    await page.waitForFunction(() => document.querySelector('#adcBD02 .adc-interinos-review-toggle').getAttribute('aria-expanded') === 'false');
    const toggle = review.locator('.adc-interinos-review-toggle');
    const pendingCount = Number(await review.getAttribute('data-pending-count'));
    await toggle.click();
    await review.locator('[data-review-key=establecimiento]').getByRole('button', {name:'Ir al campo', exact:true}).click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await section.locator('[data-bd02-school]').evaluate(node => node === document.activeElement), true);
    await section.locator('[data-bd02-action=preview]').first().click();
    assert.equal(await section.locator('[data-bd02-preview] iframe').count(), 0);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    await review.getByRole('button', {name:'Cerrar revisión ×', exact:true}).click();
    assert.equal(Number(await review.getAttribute('data-pending-count')), pendingCount);
    await page.evaluate(() => {
      inst = [{id:901, name:'Escuela ficticia', office:'1438', level:'Primario', entries:[{djUid:'cargo-prueba', type:'cargo', cargoCode:'123', cargoName:'Maestro de grado', revista:'Interino', turno:'Mañana'}]}];
      adcBD02Open();
    });
    await section.locator('[data-bd02-school]').selectOption('901');
    await section.locator('[data-bd02-entry]').check();
    assert.equal(await field('cargos.0.descripcionCargo').inputValue(), 'Maestro de grado');
    await field('dni').fill('abc');
    await toggle.click();
    assert.equal(await review.locator('[data-review-key=dni]').getAttribute('data-severity'), 'blocking');
    await review.locator('[data-review-key=dni]').getByRole('button', {name:'Ir al campo'}).click();
    assert.equal(await field('dni').evaluate(node => node === document.activeElement), true);
    assert.equal(await field('dni').evaluate(node => node.classList.contains('adc-bd02-review-focus')), true);
    await field('dni').fill('30123456');
    assert.equal(await review.locator('[data-review-key=dni]').count(), 0);
    const output = path.join(root, '.adc-tools/bd02');
    fs.mkdirSync(output, {recursive:true});
    for (const width of [390, 1440]) {
      await page.setViewportSize({width, height:1000});
      await nav.locator('[data-viewer-action=width]').click();
      for (const theme of ['light', 'dark']) {
        await page.locator('html').evaluate((node, value) => node.dataset.theme = value, theme);
        await section.screenshot({path:path.join(output, `${width}-${theme}.png`)});
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
