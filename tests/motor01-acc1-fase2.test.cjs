const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

test('MOTOR-01 Fase 2: ACC1 doble barra idéntica, vista preliminar, impresión y borrador aislado', { timeout: 120000 }, async () => {
  const server = require('../tools/motor01-preview.cjs').createMotor01Server();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'adc-acc1-fase2-'));

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await context.route(/^https:\/\//, route => route.abort());
    await context.route('**/assets/datos/ajustes-pagina.json', route =>
      route.fulfill({ json: require('../assets/js/editor/ajustes-proyecto-datos.js').empty() })
    );

    const url = `http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1&adc-inicio=1`;
    await page.goto(url);

    // Sembrar borradores productivos para verificar aislamiento absoluto.
    await page.evaluate(() => {
      localStorage.setItem('adc-official-form-dp01-draft-v1', 'PRODUCTIVO_DP01_INTACTO');
      localStorage.setItem('adc_v08', JSON.stringify({ nombre: 'Docente Test' }));
    });

    // Verificar clasificación no sincronizable de clave experimental.
    assert.equal(await page.evaluate(() => adcUserStorage.syncable('adc-motor01-exp-draft-v1:dp01')), false);

    await page.locator('#adcTabTramites2').click();
    await page.locator('#adcVpiMaestroTab').click();

    const topBar = page.locator('[data-acc1-top] .acc1-group');
    const bottomBar = page.locator('[data-acc1-bottom] .acc1-group');
    const topBox = await topBar.boundingBox();
    const hostBox = await page.locator('.vpi-maestro-host').boundingBox();
    const bottomBox = await bottomBar.boundingBox();

    assert.ok(topBox.y + topBox.height <= hostBox.y + 1, 'Barra ACC1 superior encima del visor');
    assert.ok(bottomBox.y >= hostBox.y + hostBox.height - 1, 'Barra ACC1 inferior debajo del visor');

    // Identidad visual/funcional de botones en ambas barras y deshabilitación sin documento.
    const labels = bar => bar.locator('button[data-acc1-action]').allInnerTexts().then(list => list.map(t => t.trim()));
    const expectedLabels = ['Ver Vista Preliminar', 'Descargar PDF Completado', 'Imprimir', 'Guardar cambios', 'Limpiar formulario'];
    assert.deepEqual(await labels(topBar), expectedLabels);
    assert.deepEqual(await labels(bottomBar), expectedLabels);
    for (const action of ['preview', 'download', 'print', 'save', 'clear']) {
      assert.equal(await topBar.locator(`[data-acc1-action="${action}"]`).isDisabled(), true);
      assert.equal(await bottomBar.locator(`[data-acc1-action="${action}"]`).isDisabled(), true);
    }

    // Cargar DP-01.
    await page.locator('[data-vpi-doc="dp01"]').click();
    await page.waitForFunction(() => adcMotor01Maestro.getDiagnostics()?.renderedCanvases === 1);

    // Descargar PDF Completado sigue deshabilitado con explicación clara (Fase 3 / MNC-01).
    assert.equal(await topBar.locator('[data-acc1-action="download"]').isDisabled(), true);
    assert.equal(await bottomBar.locator('[data-acc1-action="download"]').isDisabled(), true);
    assert.match(await topBar.locator('[data-acc1-note]').innerText(), /Fase 3 \(MNC-01\)/);
    assert.equal(await topBar.locator('[data-acc1-action="clear"]').isDisabled(), true);

    // Vista Preliminar desde barra superior e inferior, y cierre al cambiar de PDF.
    await topBar.locator('[data-acc1-action="preview"]').click();
    const previewWrap = page.locator('[data-acc1-preview]');
    assert.equal(await previewWrap.isVisible(), true);
    assert.match(await previewWrap.locator('iframe').getAttribute('src'), /^blob:/);
    await previewWrap.getByRole('button', { name: 'Cerrar vista preliminar' }).click();
    assert.equal(await previewWrap.isVisible(), false);

    await bottomBar.locator('[data-acc1-action="preview"]').click();
    assert.equal(await previewWrap.isVisible(), true);

    // Cambiar a Formulario N°6 revoca vista preliminar anterior y actualiza contexto ACC1.
    await page.locator('[data-vpi-doc="form-6"]').click();
    await page.waitForFunction(() => adcMotor01Maestro.getDiagnostics()?.activeId === 'form-6' && adcMotor01Maestro.getDiagnostics()?.renderedCanvases === 1);
    assert.equal(await previewWrap.isVisible(), false);
    assert.match(await topBar.locator('[data-acc1-status]').innerText(), /Formulario N°6/);

    // Guardar borrador experimental de Formulario N°6 y volver a DP-01.
    await topBar.locator('[data-acc1-action="save"]').click();
    assert.ok(await page.evaluate(() => adcMotor01Drafts.has('form-6')));
    await page.locator('[data-vpi-doc="dp01"]').click();
    await page.waitForFunction(() => adcMotor01Maestro.getDiagnostics()?.activeId === 'dp01' && adcMotor01Maestro.getDiagnostics()?.renderedCanvases === 1);

    // Imprimir en DP-01 prepara el iframe oculto con blob PDF real.
    await topBar.locator('[data-acc1-action="print"]').click();
    await page.waitForFunction(() => document.querySelector('.acc1-print-frame')?.dataset.acc1PrintState === 'ready');
    assert.match(await page.locator('.acc1-print-frame').getAttribute('src'), /^blob:/);

    // Guardar cambios en DP-01 refleja estado real en ambas barras y no toca productivos.
    await bottomBar.locator('[data-acc1-action="save"]').click();
    assert.equal(await topBar.locator('[data-acc1-status]').getAttribute('data-save-state'), 'local');
    assert.equal(await bottomBar.locator('[data-acc1-status]').getAttribute('data-save-state'), 'local');
    assert.ok(await page.evaluate(() => adcMotor01Drafts.has('dp01')));
    assert.equal(await page.evaluate(() => localStorage.getItem('adc-official-form-dp01-draft-v1')), 'PRODUCTIVO_DP01_INTACTO');

    // Error real de guardado refleja state=error en ambas barras sin perder el borrador previo.
    await page.evaluate(() => {
      window.__acc1BackupStore = window.adcUserStorage;
      window.adcUserStorage = { ...window.__acc1BackupStore, setItem() { throw new Error('Cuota simulada'); } };
    });
    await topBar.locator('[data-acc1-action="save"]').click();
    assert.equal(await topBar.locator('[data-acc1-status]').getAttribute('data-save-state'), 'error');
    assert.equal(await bottomBar.locator('[data-acc1-status]').getAttribute('data-save-state'), 'error');
    await page.evaluate(() => { window.adcUserStorage = window.__acc1BackupStore; delete window.__acc1BackupStore; });

    // Capturas antes de limpiar (estado local guardado visible en claro/oscuro, escritorio/móvil).
    await bottomBar.locator('[data-acc1-action="save"]').click();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 950 });
      for (const theme of ['dark', 'light']) {
        if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('#adcThemeSwitch').click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Sin desborde a ${width}/${theme}`);
        await page.screenshot({ path: path.join(output, `acc1-fase2-${width}-${theme}.png`) });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });

    // Limpiar formulario pide confirmación; cancelar conserva y confirmar borra solo DP-01 experimental.
    await topBar.locator('[data-acc1-action="clear"]').click();
    const dialog = page.locator('.acc1-confirm');
    assert.equal(await dialog.isVisible(), true);
    await dialog.locator('[data-acc1-confirm="cancel"]').click();
    assert.equal(await dialog.isVisible(), false);
    assert.ok(await page.evaluate(() => adcMotor01Drafts.has('dp01')));

    await bottomBar.locator('[data-acc1-action="clear"]').click();
    assert.equal(await dialog.isVisible(), true);
    await dialog.locator('[data-acc1-confirm="yes"]').click();
    assert.equal(await page.evaluate(() => adcMotor01Drafts.has('dp01')), false);
    assert.equal(await page.evaluate(() => adcMotor01Drafts.has('form-6')), true, 'Otro borrador experimental intacto');
    assert.equal(await page.evaluate(() => localStorage.getItem('adc-official-form-dp01-draft-v1')), 'PRODUCTIVO_DP01_INTACTO');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('adc_v08')).nombre), 'Docente Test');
    assert.equal(await topBar.locator('[data-acc1-action="clear"]').isDisabled(), true);

    assert.deepEqual(errors, []);
    console.log('Capturas ACC1 Fase 2:', output);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
