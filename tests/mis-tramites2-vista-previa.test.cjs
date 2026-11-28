const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

test('MT2: vista previa en miniatura bajo demanda para sugerencias, destacados, teclado y touch', { timeout: 120000 }, async () => {
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
    assert.equal(formAssetRequests.some(p => p.includes('DP-01') || p.includes('miniaturas/') || p.endsWith('.pdf')), false, 'No debe descargar miniaturas ni PDFs al cargar Inicio');
    formAssetRequests.length = 0;

    await page.locator('#adcTabTramites2').click();
    assert.equal(formAssetRequests.length, 0, 'No debe descargar imágenes o PDFs al entrar a Mis trámites sin hover');

    const root = page.locator('#adcTramites2');
    const input = root.locator('#adcMT2Search');
    const suggestions = root.locator('#adcMT2Suggestions');
    const priority = root.locator('[data-mt2-priority]');
    const card = root.locator('#adcMT2PreviewCard');
    const modal = root.locator('#adcMT2PreviewModal');

    // 1. Sugerencia de formulario con imagen real bajo demanda (DP-01)
    await input.fill('DP-01');
    const dpOption = suggestions.getByRole('option').filter({ hasText: 'Formulario · DP-01' });
    await dpOption.hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    await page.waitForFunction(() => {
      const img = document.querySelector('#adcMT2PreviewCard img');
      return Boolean(img && img.complete && img.naturalWidth > 0);
    });
    assert.ok(formAssetRequests.some(p => p.endsWith('/DP-01-pagina-1.png')), 'Debe cargar DP-01-pagina-1.png al hacer hover');
    assert.equal(formAssetRequests.some(p => p.endsWith('.pdf')), false, 'No debe descargar PDFs durante hover');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Sin desborde horizontal con popover visible en 1440');
    await page.screenshot({ path: path.join(screenshotDir, 'mt2-preview-suggestion-light.png') });

    // Salida limpia del hover tras retardo de cierre
    await page.mouse.move(5, 5);
    await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true);

    // 2. Sugerencia de formulario sin PNG (IL-01): esquema estructurado con secciones reales
    await input.fill('IL-01');
    await suggestions.getByRole('option').filter({ hasText: 'Formulario · IL-01' }).hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    const ilText = await card.innerText();
    assert.match(ilText, /Período e institución/);
    assert.match(ilText, /Licencias informadas/);
    assert.equal(await card.locator('.mt2-preview-doc').count(), 1);
    await page.mouse.move(5, 5);
    await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true);

    // 3. Sugerencia de Motivo: Enfermedad muestra miniatura real del formulario DL-01 (nunca IL-01); Traslado indica pendiente
    await input.fill('enfermedad');
    await suggestions.getByRole('option').filter({ hasText: 'Enfermedad o lesión común' }).hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    await page.waitForFunction(() => {
      const img = document.querySelector('#adcMT2PreviewCard img');
      return Boolean(img && img.src.includes('miniaturas/dl01.png') && img.complete && img.naturalWidth > 0);
    });
    const illnessPreview = await card.innerText();
    assert.match(illnessPreview, /Vista previa del recorrido/);
    assert.match(illnessPreview, /DL-01/);
    assert.equal(/IL-01/.test(illnessPreview), false, 'Motivo Enfermedad no debe mostrar IL-01');
    const cardBounds = await card.boundingBox();
    assert.ok(cardBounds && cardBounds.y >= 0 && cardBounds.y + cardBounds.height <= 1000, 'El popover y sus botones deben quedar íntegramente visibles dentro del alto del viewport');
    await page.screenshot({ path: path.join(screenshotDir, 'mt2-preview-enfermedad-dl01.png') });

    await card.getByRole('button', { name: 'Ver completo', exact: true }).click();
    await page.waitForSelector('#adcMT2PreviewModal[open]');
    await page.waitForFunction(() => {
      const img = document.querySelector('#adcMT2PreviewModal img');
      return Boolean(img && img.src.includes('miniaturas/dl01.png') && img.complete && img.naturalWidth > 0);
    });
    assert.equal(await modal.locator('.mt2-preview-zoombar').isVisible(), true);
    const widthFitBox = await modal.locator('img').boundingBox();
    assert.ok(widthFitBox.width >= 600, 'La imagen inicia ajustada a un ancho amplio y legible');
    const zoomOutTextInitial = await modal.locator('[data-mt2-zoom-output]').innerText();
    await modal.locator('[data-mt2-zoom=in]').click();
    const zoomedBox = await modal.locator('img').boundingBox();
    assert.ok(zoomedBox.width > widthFitBox.width, 'Botón + debe ampliar la imagen');
    assert.notEqual(await modal.locator('[data-mt2-zoom-output]').innerText(), zoomOutTextInitial);
    await modal.locator('[data-mt2-zoom=out]').click();
    const afterOutBox = await modal.locator('img').boundingBox();
    assert.ok(afterOutBox.width < zoomedBox.width, 'Botón - debe alejar la imagen');
    await modal.locator('[data-mt2-zoom=fit]').click();
    const mediaBox = await modal.locator('.mt2-preview-modal-media').boundingBox();
    const fitPageBox = await modal.locator('img').boundingBox();
    assert.ok(fitPageBox.height <= mediaBox.height + 2, 'Ajustar hoja encuadra toda la página en pantalla');
    await modal.locator('[data-mt2-zoom=width]').click();
    assert.ok((await modal.locator('img').boundingBox()).width >= 600, 'Ajustar ancho vuelve al ancho amplio');
    await page.keyboard.press('Escape');
    assert.equal(await modal.isVisible(), false);

    await priority.locator('[data-mt2-form=dl01]').hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    await page.waitForFunction(() => {
      const img = document.querySelector('#adcMT2PreviewCard img');
      return Boolean(img && img.src.includes('miniaturas/dl01.png') && img.complete && img.naturalWidth > 0);
    });
    await page.mouse.move(5, 5);
    await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true);

    for (const [queryText, optionText, expectedThumb] of [
      ['DJ-01', 'Formulario · DJ-01', 'miniaturas/dj01.png'],
      ['DJ-02', 'Formulario · DJ-02', 'miniaturas/dj02.png'],
      ['OL-01', 'Formulario · OL-01', 'miniaturas/ol01.png']
    ]) {
      await input.fill(queryText);
      await suggestions.getByRole('option').filter({ hasText: optionText }).hover();
      await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
      await page.waitForFunction(suffix => {
        const img = document.querySelector('#adcMT2PreviewCard img');
        return Boolean(img && img.src.includes(suffix) && img.complete && img.naturalWidth > 0);
      }, expectedThumb);
      await page.mouse.move(5, 5);
      await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true);
    }

    await input.fill('traslado');
    await suggestions.getByRole('option').filter({ hasText: 'Motivo' }).filter({ hasText: 'Traslado transitorio por razones de salud' }).hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    assert.match(await card.innerText(), /Asociación automática pendiente/);
    await page.mouse.move(5, 5);
    await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true);

    // 4. Formularios destacados: hover, puente hacia el popover, Ver completo (modal) y Abrir formulario en modo oscuro
    await page.locator('#adcThemeSwitch').click();
    await input.fill('DP-01');
    const dpPriority = priority.locator('[data-mt2-form=dp01]');
    await dpPriority.hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    const cardBox = await card.boundingBox();
    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.waitForTimeout(320);
    assert.equal(await card.isVisible(), true, 'Mover el mouse hacia el popover debe mantenerlo abierto');
    await page.screenshot({ path: path.join(screenshotDir, 'mt2-preview-priority-dark.png') });

    await card.getByRole('button', { name: 'Ver completo', exact: true }).click();
    await page.waitForSelector('#adcMT2PreviewModal[open]');
    assert.equal(await modal.isVisible(), true);
    await page.screenshot({ path: path.join(screenshotDir, 'mt2-preview-modal.png') });
    await modal.locator('[data-mt2-zoom=in]').click();
    await page.screenshot({ path: path.join(screenshotDir, 'mt2-preview-modal-zoomed.png') });
    await page.keyboard.press('Escape');
    assert.equal(await modal.isVisible(), false);

    // Previsualizar (hover + modal) no altera localStorage
    assert.deepEqual(
      await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([k]) => !['adc-login-theme', 'adc_theme', 'adc-official-form-dp01-draft-v1'].includes(k)))),
      initialStorage
    );

    // Abrir formulario directamente desde el popover
    await dpPriority.hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    await card.getByRole('button', { name: 'Abrir formulario', exact: true }).click();
    assert.equal(await card.isVisible(), false);
    assert.equal(await page.locator('#adcOfficialForm').isVisible(), true);
    assert.equal(await page.locator('body').getAttribute('data-adc-mt2-document'), 'dp01');
    await page.locator('.adc-mt2-document-back').click();

    // Regresar al tema claro para probar teclado y resolución intermedia 1280px
    await page.locator('#adcThemeSwitch').click();
    await page.setViewportSize({ width: 1280, height: 900 });
    await input.fill('DP-01');
    await input.press('ArrowDown');
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    const cardRect1280 = await card.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    });
    assert.ok(cardRect1280.left >= 0 && cardRect1280.right <= 1280, 'Popover contenido dentro de 1280px');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.keyboard.press('Escape');
    assert.equal(await card.isVisible(), false, 'Escape debe ocultar el popover');

    // Al salir de Mis trámites hacia Inicio debe ocultarse cualquier popover activo
    await input.fill('DP-01');
    await input.press('ArrowDown');
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    // 5. Catálogo completo de formularios (docentes y administrativos): hover, cambio de pestaña y apertura
    await input.fill('');
    await page.setViewportSize({ width: 1440, height: 1000 });
    const catalog = root.locator('#adcMT2Catalog');
    for (const [formId, expectedImg] of [
      ['dj01', 'miniaturas/dj01.png'],
      ['ol01', 'miniaturas/ol01.png'],
      ['sc01', 'SC-01-plantilla.png']
    ]) {
      const catCard = catalog.locator(`[data-mt2-form="${formId}"]`);
      await catCard.scrollIntoViewIfNeeded();
      await catCard.hover();
      await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
      await page.waitForFunction(suffix => {
        const img = document.querySelector('#adcMT2PreviewCard img');
        return Boolean(img && img.src.includes(suffix) && img.complete && img.naturalWidth > 0);
      }, expectedImg);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Sin desborde en catálogo hover (${formId})`);
      if (formId === 'dj01') {
        await page.waitForFunction(() => {
          const imgs = [...document.querySelectorAll('#adcMT2PreviewCard img')];
          return imgs.length === 2
            && imgs[0].src.includes('miniaturas/dj01.png')
            && imgs[1].src.includes('miniaturas/dj01-pagina-2.png')
            && imgs.every(img => img.complete && img.naturalWidth > 0);
        });
        assert.match(await card.innerText(), /2 hojas/);
        await page.screenshot({ path: path.join(screenshotDir, 'mt2-preview-dj01-hover.png') });
        await card.getByRole('button', { name: 'Ver completo', exact: true }).click();
        await page.waitForSelector('#adcMT2PreviewModal[open]');
        await page.waitForFunction(() => {
          const imgs = [...document.querySelectorAll('#adcMT2PreviewModal img')];
          return imgs.length === 2
            && imgs[0].src.includes('miniaturas/dj01.png')
            && imgs[1].src.includes('miniaturas/dj01-pagina-2.png')
            && imgs.every(img => img.complete && img.naturalWidth > 0);
        });
        const wBefore = await modal.locator('img').evaluateAll(imgs => imgs.map(el => el.getBoundingClientRect().width));
        await page.screenshot({ path: path.join(screenshotDir, 'mt2-preview-dj01-modal.png') });
        await modal.locator('[data-mt2-zoom=in]').click();
        const wAfter = await modal.locator('img').evaluateAll(imgs => imgs.map(el => el.getBoundingClientRect().width));
        assert.ok(wAfter[0] > wBefore[0] && wAfter[1] > wBefore[1], 'El zoom escala ambas hojas de DJ-01');
        await modal.locator('[data-mt2-zoom=fit]').click();
        await modal.locator('[data-mt2-zoom=width]').click();
        await page.keyboard.press('Escape');
        assert.equal(await modal.isVisible(), false);
      }
      if (formId === 'ol01') {
        await page.screenshot({ path: path.join(screenshotDir, 'mt2-preview-catalog-hover.png') });
      }
      await page.mouse.move(5, 5);
      await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true);
    }

    // Cambiar a Formularios para administrativos oculta el popover previo y permite previsualizar DL-01, DP-01 e IL-01
    await catalog.locator('[data-mt2-form=dj01]').hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    await root.getByRole('tab', { name: 'Formularios para administrativos', exact: true }).click();
    assert.equal(await card.isVisible(), false, 'Cambiar de pestaña debe ocultar la vista previa anterior');

    for (const [formId, expectedImg] of [
      ['dl01', 'miniaturas/dl01.png'],
      ['dp01', 'DP-01-pagina-1.png']
    ]) {
      const catCard = catalog.locator(`[data-mt2-form="${formId}"]`);
      await catCard.scrollIntoViewIfNeeded();
      await catCard.hover();
      await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
      await page.waitForFunction(suffix => {
        const img = document.querySelector('#adcMT2PreviewCard img');
        return Boolean(img && img.src.includes(suffix) && img.complete && img.naturalWidth > 0);
      }, expectedImg);
      await page.mouse.move(5, 5);
      await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true);
    }

    await catalog.locator('[data-mt2-form=il01]').scrollIntoViewIfNeeded();
    await catalog.locator('[data-mt2-form=il01]').hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    assert.match(await card.innerText(), /Período e institución/);
    await page.mouse.move(5, 5);
    await page.waitForFunction(() => document.getElementById('adcMT2PreviewCard')?.hidden === true);

    await catalog.locator('[data-mt2-form=dp01]').hover();
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    await card.getByRole('button', { name: 'Abrir formulario', exact: true }).click();
    assert.equal(await card.isVisible(), false);
    assert.equal(await page.locator('#adcOfficialForm').isVisible(), true);
    await page.locator('.adc-mt2-document-back').click();

    await page.locator('#adcTabInicio').click();
    await page.locator('#adcTabTramites2').click();
    await input.fill('DP-01');
    await input.press('ArrowDown');
    await page.waitForSelector('#adcMT2PreviewCard:not([hidden])');
    await page.locator('#adcTabInicio').click();
    assert.equal(await card.isVisible(), false);

    assert.deepEqual(
      await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([k]) => !['adc-login-theme', 'adc_theme', 'adc-official-form-dp01-draft-v1'].includes(k)))),
      initialStorage
    );
    await context.close();

    // 6. Dispositivo táctil (390px): tap en sugerencia no dispara popover hover; botón táctil en destacados y catálogo abre modal
    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const touchPage = await touchContext.newPage();
    touchPage.on('pageerror', err => errors.push(err.message));
    await touchContext.route(/^https:\/\//, route => route.abort());
    await touchContext.route('**/assets/datos/ajustes-pagina.json', route =>
      route.fulfill({ json: require('../assets/js/editor/ajustes-proyecto-datos.js').empty() })
    );
    await touchPage.goto(url);
    await touchPage.locator('#adcTabTramites2').tap();
    await touchPage.locator('#adcMT2Search').fill('DP-01');
    await touchPage.locator('#adcTramites2 [data-mt2-priority] .mt2-touch-preview-btn').first().tap();
    await touchPage.waitForSelector('#adcMT2PreviewModal[open]');
    assert.equal(await touchPage.locator('#adcMT2PreviewCard').isVisible(), false);
    assert.equal(await touchPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await touchPage.locator('#adcMT2PreviewModal').getByRole('button', { name: 'Cerrar', exact: true }).tap();
    await touchPage.locator('#adcMT2Search').fill('');
    const catTouchBtn = touchPage.locator('#adcMT2Catalog .mt2-touch-preview-btn').first();
    assert.equal(await catTouchBtn.isVisible(), true, 'Botón Vista previa visible en catálogo táctil');
    await catTouchBtn.tap();
    await touchPage.waitForSelector('#adcMT2PreviewModal[open]');
    assert.equal(await touchPage.locator('#adcMT2PreviewCard').isVisible(), false);
    await touchPage.locator('#adcMT2PreviewModal').getByRole('button', { name: 'Cerrar', exact: true }).tap();
    await touchContext.close();

    assert.deepEqual(errors, []);
    console.log('Capturas MT2 Vista Previa:', screenshotDir);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
