const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

test('MT2: popover vertical arriba/abajo, retardo interactivo, multipágina con zoom, teclado y doble tap táctil', { timeout: 120000 }, async () => {
  const server = require('../tools/motor01-preview.cjs').createMotor01Server();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const screenshotDir = process.env.ADC_MT2_PREVIEW_SHOTS || fs.mkdtempSync(path.join(os.tmpdir(), 'adc-mt2-preview-'));
  fs.mkdirSync(screenshotDir, { recursive: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);

    const errors = [];
    const formAssetRequests = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('request', req => {
      const p = new URL(req.url()).pathname;
      if (/\/assets\/formularios\/.*\.(?:png|jpg|webp|pdf)$/i.test(p)) formAssetRequests.push(p);
    });

    await context.route(/^https:\/\//, route => route.abort());
    await context.route('**/assets/datos/ajustes-pagina.json', route =>
      route.fulfill({ json: require('../assets/js/editor/ajustes-proyecto-datos.js').empty() })
    );

    const url = `http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1&adc-inicio=1&adc-motor01=incapacidad`;
    await page.goto(url);
    const initialStorage = await page.evaluate(() => ({ ...localStorage }));
    assert.equal(formAssetRequests.some(p => p.includes('DP-01') || p.includes('miniaturas/') || p.endsWith('.pdf')), false);
    formAssetRequests.length = 0;

    await page.locator('#adcTabTramites2').click();
    assert.equal(formAssetRequests.length, 0, 'No debe descargar miniaturas antes de previsualizar');

    const root = page.locator('#adcTramites2');
    const input = root.locator('#adcMT2Search');
    const suggestions = root.locator('#adcMT2Suggestions');
    const catalog = root.locator('#adcMT2Catalog');
    const card = root.locator('#adcMT2PreviewCard');
    const modal = root.locator('#adcMT2PreviewModal');

    // 1. Sugerencias: IL-01 (esquema), Enfermedad -> DL-01 (nunca IL-01) y Traslado pendiente
    await input.fill('IL-01');
    await suggestions.getByRole('option').filter({ hasText: 'Formulario · IL-01' }).hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    const ilText = await card.innerText();
    assert.match(ilText, /Período e institución/);
    assert.match(ilText, /Licencias informadas/);
    assert.equal(await card.locator('.mt2-preview-doc').count(), 1);
    await page.mouse.move(5, 5);
    await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true, null, { timeout: 600 });

    await input.fill('enfermedad');
    await suggestions.getByRole('option').filter({ hasText: 'Enfermedad o lesión común' }).hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    await page.waitForFunction(() => {
      const img = document.querySelector('#adcMT2PreviewCard img');
      return Boolean(img && img.src.includes('miniaturas/dl01.png') && img.complete && img.naturalWidth > 0);
    });
    const illnessPreview = await card.innerText();
    assert.match(illnessPreview, /DL-01/);
    assert.equal(/IL-01/.test(illnessPreview), false, 'Motivo Enfermedad no debe mostrar IL-01');
    await page.mouse.move(5, 5);
    await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true, null, { timeout: 600 });

    await input.fill('traslado');
    await suggestions.getByRole('option').filter({ hasText: 'Motivo' }).filter({ hasText: 'Traslado transitorio por razones de salud' }).hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    assert.match(await card.innerText(), /Asociación automática pendiente/);
    await page.mouse.move(5, 5);
    await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true, null, { timeout: 600 });

    // 2. Catálogo: popover estrictamente arriba/abajo, sin tapar vecina, cruce interactivo hacia el popup (DJ-01 2 hojas + zoom)
    await input.fill('');
    const dj01Card = catalog.locator('[data-mt2-form="dj01"]');
    const neighborCard = catalog.locator('.mt2-card').nth(1);
    await dj01Card.scrollIntoViewIfNeeded();
    await dj01Card.hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll('#adcMT2PreviewCard img')];
      return imgs.length === 2 && imgs.every(i => i.complete && i.naturalWidth > 0);
    });
    const side = await card.getAttribute('data-side');
    assert.ok(side === 'top' || side === 'bottom', `Se esperaba popover arriba/abajo y fue ${side}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    const cardBox = await card.boundingBox();
    const neighborBox = await neighborCard.boundingBox();
    const overlapsNeighbor = !(cardBox.y + cardBox.height <= neighborBox.y || cardBox.y >= neighborBox.y + neighborBox.height);
    assert.equal(overlapsNeighbor, false, 'Popover vertical nunca cubre la tarjeta vecina de la misma fila');

    // Cruce del mouse hacia el popup dentro del retardo breve (180ms): permanece abierto > 260ms
    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.waitForTimeout(260);
    assert.equal(await card.isVisible(), true, 'El popup permanece abierto al posicionar el mouse encima');
    await page.screenshot({ path: path.join(screenshotDir, 'mt2-preview-dj01-vertical.png') });

    // Ver completo dentro del popup abre modal con ambas hojas de DJ-01 y zoom
    await card.getByRole('button', { name: 'Ver completo', exact: true }).click();
    await page.waitForSelector('#adcMT2PreviewModal[open]');
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll('#adcMT2PreviewModal img')];
      return imgs.length === 2 && imgs.every(i => i.complete && i.naturalWidth > 0);
    });
    const wBefore = await modal.locator('img').evaluateAll(imgs => imgs.map(el => el.getBoundingClientRect().width));
    await modal.locator('[data-mt2-zoom=in]').click();
    const wAfter = await modal.locator('img').evaluateAll(imgs => imgs.map(el => el.getBoundingClientRect().width));
    assert.ok(wAfter[0] > wBefore[0] && wAfter[1] > wBefore[1]);
    await modal.locator('[data-mt2-zoom=fit]').click();
    await modal.locator('[data-mt2-zoom=width]').click();
    await page.keyboard.press('Escape');
    assert.equal(await modal.isVisible(), false);

    // Salida al espacio libre oculta el popup tras retardo breve (<= 500 ms) y pasar a la tarjeta vecina cambia inmediatamente
    await dj01Card.hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    const titleFirst = await card.locator('.mt2-preview-caption strong').innerText();
    await neighborCard.hover();
    await page.waitForFunction(prev => {
      const el = document.querySelector('#adcMT2PreviewCard .mt2-preview-caption strong');
      return Boolean(el && el.textContent !== prev);
    }, titleFirst);
    await page.mouse.move(5, 5);
    await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true, null, { timeout: 500 });

    // 3. Tema oscuro + cambio de pestaña oculta popover + Abrir formulario DP-01 desde el popup
    await page.locator('#adcThemeSwitch').click();
    await dj01Card.hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    await root.getByRole('tab', { name: 'Formularios para administrativos', exact: true }).click();
    assert.equal(await card.isVisible(), false, 'Cambiar de pestaña debe ocultar el popover');

    await catalog.locator('[data-mt2-form=dp01]').hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    const dpCardBox = await card.boundingBox();
    await page.mouse.move(dpCardBox.x + dpCardBox.width / 2, dpCardBox.y + dpCardBox.height / 2);
    await page.waitForTimeout(260);
    assert.equal(await card.isVisible(), true);
    await page.screenshot({ path: path.join(screenshotDir, 'mt2-preview-dp01-dark.png') });
    await card.getByRole('button', { name: 'Abrir formulario', exact: true }).click();
    assert.equal(await card.isVisible(), false);
    assert.equal(await page.locator('#adcOfficialForm').isVisible(), true);
    await page.locator('.adc-mt2-document-back').click();

    // 4. Tema claro, 1280x900 teclado (ArrowDown + Escape) y volver a Inicio oculta popover
    await page.locator('#adcThemeSwitch').click();
    await page.setViewportSize({ width: 1280, height: 900 });
    await input.fill('DP-01');
    await input.press('ArrowDown');
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    const rect1280 = await card.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right };
    });
    assert.ok(rect1280.left >= 0 && rect1280.right <= 1280, 'Popover contenido en 1280px');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.keyboard.press('Escape');
    assert.equal(await card.isVisible(), false);

    await input.fill('DP-01');
    await input.press('ArrowDown');
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    await page.locator('#adcTabInicio').click();
    assert.equal(await card.isVisible(), false, 'Salir de Mis trámites oculta el popover');

    assert.equal(formAssetRequests.some(p => p.endsWith('.pdf')), false, 'No debe descargar PDFs durante vistas previas');
    assert.deepEqual(
      await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([k]) => !['adc-login-theme', 'adc_theme', 'adc-official-form-dp01-draft-v1'].includes(k)))),
      initialStorage
    );
    await context.close();

    // 5. Dispositivo táctil (390px): 1er tap abre vista previa, 2do tap en la misma tarjeta abre el formulario
    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const touchPage = await touchContext.newPage();
    touchPage.on('pageerror', err => errors.push(err.message));
    await touchContext.route(/^https:\/\//, route => route.abort());
    await touchContext.route('**/assets/datos/ajustes-pagina.json', route =>
      route.fulfill({ json: require('../assets/js/editor/ajustes-proyecto-datos.js').empty() })
    );
    await touchPage.goto(url);
    await touchPage.locator('#adcTabTramites2').tap();
    await touchPage.getByRole('tab', { name: 'Formularios para administrativos', exact: true }).tap();
    const dpTouchCard = touchPage.locator('#adcMT2Catalog [data-mt2-form=dp01]');
    await dpTouchCard.tap();
    await touchPage.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    assert.equal(await touchPage.locator('#adcOfficialForm').isVisible(), false, '1er tap muestra preview sin abrir todavía');
    assert.equal(await touchPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await dpTouchCard.tap();
    assert.equal(await touchPage.locator('#adcOfficialForm').isVisible(), true, '2do tap sobre la misma tarjeta abre el formulario');
    await touchPage.locator('.adc-mt2-document-back').tap();
    await touchContext.close();

    assert.deepEqual(errors, []);
    console.log('Capturas MT2 Vista Previa:', screenshotDir);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
