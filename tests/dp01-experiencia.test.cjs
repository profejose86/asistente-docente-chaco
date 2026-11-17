const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const runtime = path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium} = require(path.join(runtime, 'playwright'));

test('DP-01: visor y acciones reutilizados, borrador y limpieza aislada', {timeout:120000}, async () => {
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
    const page = await browser.newPage({viewport:{width:1440, height:1000}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https:\/\//, route => route.abort());
    await page.route('**/assets/datos/ajustes-pagina.json', route => route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`);
    await page.locator('#perfilApellidos').fill('Prueba');
    await page.locator('#perfilNombres').fill('Ana');
    await page.locator('#dni').fill('30123456');
    await page.evaluate(() => localStorage.setItem('adc_v08', JSON.stringify(data())));
    const open = async id => {
      await page.evaluate(() => tab('tramites'));
      await page.locator(`.adc-form-catalog [data-adc-official-form="${id}"]`).click();
    };
    await open('dp01');
    const field = key => page.locator(`[data-adc-field="${key}"]`);
    const viewer = page.locator('.adc-pdf-viewer');
    const navigation = viewer.locator('.adc-pdf-navigation');
    const range = navigation.locator('input');
    const setZoom = async value => range.evaluate((node, next) => {
      node.value = String(next);
      node.dispatchEvent(new Event('input', {bubbles:true}));
    }, value);
    const zoom = async () => Number(await range.inputValue());

    // VPI-01: límites, teclado, rueda y desplazamiento sin alterar campos.
    assert.equal(await navigation.isVisible(), true);
    await setZoom(200);
    await navigation.locator('[data-viewer-action=in]').click();
    assert.equal(await zoom(), 200);
    await setZoom(25);
    await navigation.locator('[data-viewer-action=out]').click();
    assert.equal(await zoom(), 25);
    await range.focus();
    await range.press('ArrowRight');
    assert.equal(await zoom(), 26);
    await setZoom(100);
    const viewport = page.locator('#adcOfficialForm .adc-document-viewport');
    await viewport.scrollIntoViewIfNeeded();
    const box = await viewport.boundingBox();
    await page.mouse.move(box.x + 12, box.y + 30);
    await page.mouse.wheel(0, -100);
    assert.ok(await zoom() > 100);
    assert.equal(await viewer.locator('.adc-pdf-scroll').isVisible(), false);
    assert.equal(await field('apellido').inputValue(), 'Prueba');

    // La entrada rápida usa la misma pantalla completa, sólo en el fondo de DP-01.
    await viewer.evaluate(node => node.requestFullscreen = undefined);
    await viewport.dblclick({position:{x:12, y:30}});
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), true);
    await page.keyboard.press('Escape');
    await field('apellido').dblclick();
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), false);
    await page.evaluate(() => {
      const target = document.querySelector('#adcOfficialForm .adc-document-viewport');
      const touch = new Touch({identifier:1, target, clientX:25, clientY:100});
      const tap = () => {
        target.dispatchEvent(new TouchEvent('touchstart', {touches:[touch], changedTouches:[touch], bubbles:true, cancelable:true}));
        target.dispatchEvent(new TouchEvent('touchend', {touches:[], changedTouches:[touch], bubbles:true, cancelable:true}));
      };
      tap();tap();
    });
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), true);
    await page.keyboard.press('Escape');

    // ACC1: ambos juegos de controles y persistencia sin generar archivos.
    for (const action of ['preview', 'download', 'print']) {
      assert.equal(await page.locator(`[data-adc-official-action=${action}] svg`).count(), 2);
    }
    const save = page.locator('[data-adc-draft-action=save]');
    const clear = page.locator('[data-adc-draft-action=clear]');
    assert.equal(await save.count(), 2);
    assert.equal(await clear.count(), 2);
    let downloads = 0;
    page.on('download', () => downloads++);
    await field('observaciones').fill('Borrador de prueba DP-01');
    await save.first().click();
    assert.ok((await page.locator('[data-adc-draft-status]').allTextContents()).every(text => text.includes('guardado en este dispositivo')));
    await page.reload();
    await open('dp01');
    assert.equal(await field('observaciones').inputValue(), 'Borrador de prueba DP-01');
    const savedDraft = await page.evaluate(() => localStorage.getItem('adc-official-form-dp01-draft-v1'));
    await page.evaluate(() => {
      window.dp01OriginalStorage = adcUserStorage;
      window.adcUserStorage = {...adcUserStorage, setItem() { throw Error('Error simulado de almacenamiento'); }};
    });
    await save.last().click();
    assert.ok((await page.locator('[data-adc-draft-status]').allTextContents()).every(text => text.includes('No se pudo guardar')));
    await clear.first().click();
    await page.locator('.adc-incapacidad-confirm').getByRole('button', {name:'Sí, limpiar formulario', exact:true}).click();
    assert.equal(await field('observaciones').inputValue(), 'Borrador de prueba DP-01');
    assert.equal(await page.evaluate(() => localStorage.getItem('adc-official-form-dp01-draft-v1')), savedDraft);
    await page.evaluate(() => window.adcUserStorage = dp01OriginalStorage);
    const preserved = await page.evaluate(() => {
      localStorage.setItem('adc-official-form-cf01-draft-v1', 'otro borrador de prueba');
      return {profile:localStorage.getItem('adc_v08'), other:localStorage.getItem('adc-official-form-cf01-draft-v1')};
    });
    const dialog = page.locator('.adc-incapacidad-confirm');
    await clear.first().click();
    await dialog.getByRole('button', {name:'Cancelar', exact:true}).click();
    assert.equal(await field('observaciones').inputValue(), 'Borrador de prueba DP-01');
    await clear.last().click();
    await dialog.getByRole('button', {name:'Sí, limpiar formulario', exact:true}).click();
    assert.equal(await field('observaciones').inputValue(), '');
    assert.equal(await field('apellido').inputValue(), 'Prueba');
    assert.deepEqual(await page.evaluate(() => ({profile:localStorage.getItem('adc_v08'), other:localStorage.getItem('adc-official-form-cf01-draft-v1')})), preserved);
    await page.reload();
    await open('dp01');
    assert.equal(await field('observaciones').inputValue(), '');
    assert.equal(downloads, 0);
    for (const width of [390, 1440]) {
      await page.setViewportSize({width, height:1000});
      await navigation.locator('[data-viewer-action=width]').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      for (const theme of ['light', 'dark']) {
        await page.locator('html').evaluate((node, value) => node.dataset.theme = value, theme);
        assert.equal(await navigation.isVisible(), true);
        const output = path.join(root, '.adc-tools/dp01');
        fs.mkdirSync(output, {recursive:true});
        await page.locator('#adcOfficialForm').screenshot({path:path.join(output, `etapas-1-2-${width}-${theme}.png`)});
      }
    }
    await open('form-3');
    assert.equal(await navigation.isVisible(), false);
    assert.equal(await save.first().isVisible(), false);
    await open('incapacidad');
    await viewport.dblclick({position:{x:12, y:30}});
    assert.equal(await viewer.evaluate(node => node.classList.contains('adc-pdf-expanded')), false);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
