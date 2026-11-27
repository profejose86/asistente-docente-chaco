const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const { clickGear, clickTool } = require('./support/ajustes.cjs');

async function pagePoint(pageLocator, xPct, yPct) {
  const r = await pageLocator.boundingBox();
  return {
    x: r.x + (xPct / 100) * r.width,
    y: r.y + (yPct / 100) * r.height
  };
}

test('MOTOR-01 TIJ-01: tijera inteligente por dos puntos, geometría invariante al zoom, cancelación, deshacer y aislamiento', { timeout: 120000 }, async () => {
  const server = require('../tools/motor01-preview.cjs').createMotor01Server();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adc-tij01-'));

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await context.route(/^https:\/\//, route => route.abort());
    await context.route('**/assets/datos/ajustes-pagina.json', route =>
      route.fulfill({ json: require('../assets/js/editor/ajustes-proyecto-datos.js').empty() })
    );

    const url = `http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1&adc-inicio=1&adc-motor01=incapacidad`;
    await page.goto(url);
    await page.evaluate(() => {
      localStorage.setItem('adc_dj02_v1', JSON.stringify({ sentinel: 'productivo-intacto' }));
    });
    const initialProd = await page.evaluate(() => localStorage.getItem('adc_dj02_v1'));

    // Abrir Mis trámites -> VPI Maestro -> DP-01 (vertical)
    await page.locator('#adcTabTramites2').click();
    await page.locator('#adcVpiMaestroTab').click();
    await page.locator('[data-vpi-doc="dp01"]').click();
    await page.waitForFunction(() => window.adcMotor01Maestro?.getDiagnostics()?.activeId === 'dp01' && window.adcMotor01Maestro.getDiagnostics().renderedCanvases === 1);

    const initialPdfBytes = await page.evaluate(() => Array.from(document.querySelector('#adcVpiMaestro') ? adcMotor01Tijera.getState().boxes.map(b => b.id) : []));
    assert.deepEqual(initialPdfBytes, ['tij-box-1', 'tij-box-2', 'tij-box-3']);
    const initialPdfCheck = await page.evaluate(async () => {
      const res = await fetch('assets/formularios/DP-01.pdf');
      const buf = new Uint8Array(await res.arrayBuffer());
      return { length: buf.length, head: Array.from(buf.slice(0, 16)) };
    });

    // Abrir tuerquita administrativa y activar Tijera
    const gear = page.locator('#adcDesignGear');
    await clickGear(page);
    await page.locator('#adcDesignPanel').waitFor({ state: 'visible' });
    const splitBtn = page.locator('#adcDesignPanel [data-act="split"]');
    await clickTool(page, splitBtn);
    assert.equal(await splitBtn.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => adcMotor01Tijera.isActive()), true);

    const vpiPage = page.locator('#adcVpiMaestro .vpi-page').first();
    const shell = page.locator('#adcVpiMaestro [data-vpi-shell]');
    const viewport = shell.locator('.vpi-viewport');
    await shell.evaluate(el => el.scrollIntoView({ block: 'center' }));

    // Pruebas 1, 2, 4: Primer clic marca A SIN cortar; mover mouse muestra guía discontinua y resalta caja afectada.
    const ptA1 = await pagePoint(vpiPage, 5, 25);
    await page.mouse.click(ptA1.x, ptA1.y);
    assert.equal(await page.evaluate(() => adcMotor01Tijera.getState().boxes.length), 3, 'El primer clic nunca corta');
    assert.ok(await page.evaluate(() => adcMotor01Tijera.getState().pointA !== null), 'El primer clic fija punto A');
    assert.equal(await vpiPage.locator('.tij-point-a').count(), 1, 'Marcador visible en punto A');

    const hoverB1 = await pagePoint(vpiPage, 50, 25);
    await page.mouse.move(hoverB1.x, hoverB1.y);
    assert.equal(await vpiPage.locator('.tij-guide-line.is-valid').count(), 1, 'Línea guía sigue al cursor');
    assert.equal(await vpiPage.locator('[data-tij-box-id="tij-box-1"].is-affected').count(), 1, 'Resalta tij-box-1 intersectada');
    assert.equal(await vpiPage.locator('[data-tij-box-id="tij-box-3"].is-affected').count(), 0, 'No resalta tij-box-3 fuera del segmento');

    // Prueba 3 y 5: Segundo clic ejecuta corte horizontal en tij-box-1 sin afectar tij-box-2 ni tij-box-3; muestra línea confirmada breve y mantiene Tijera activa.
    await page.mouse.click(hoverB1.x, hoverB1.y);
    const afterH1 = await page.evaluate(() => adcMotor01Tijera.getState());
    assert.equal(afterH1.active, true, 'Tijera sigue activa tras el corte');
    assert.equal(afterH1.pointA, null, 'Limpia puntos A/B tras cortar');
    assert.equal(afterH1.boxes.length, 4);
    assert.equal(await vpiPage.locator('.tij-confirm-line').count(), 1, 'Muestra brevemente la línea definitiva');

    const b1 = afterH1.boxes.find(b => b.id === 'tij-box-1');
    const b1p2 = afterH1.boxes.find(b => b.id === 'tij-box-1-p2');
    const b3 = afterH1.boxes.find(b => b.id === 'tij-box-3');
    assert.equal(b1.value, 'Dato titular 1', 'Primera mitad conserva contenido');
    assert.equal(b1p2.value, '', 'Segunda mitad inicia vacía');
    assert.equal(Math.round((b1.y + b1.h) * 100) / 100, Math.round(b1p2.y * 100) / 100, 'Sin huecos ni superposiciones');
    assert.equal(b3.h, 14, 'Caja fuera del segmento finito intacta');

    // Prueba 10 (parcial): Cancelar con Esc limpia punto A sin cortar y mantiene Tijera activa en el primer Esc.
    const escA = await pagePoint(vpiPage, 5, 45);
    await page.mouse.click(escA.x, escA.y);
    assert.ok(await page.evaluate(() => adcMotor01Tijera.getState().pointA !== null));
    await page.keyboard.press('Escape');
    const afterEsc = await page.evaluate(() => adcMotor01Tijera.getState());
    assert.equal(afterEsc.pointA, null, 'Esc cancela punto A pendiente');
    assert.equal(afterEsc.boxes.length, 4, 'Esc no modifica cajas');
    assert.equal(afterEsc.active, true, 'Esc conserva Tijera lista tras cancelar A pendiente');

    // Prueba 7: Corte diagonal rechazado sin geometrías inválidas ni polígonos.
    const diagA = await pagePoint(vpiPage, 12, 16);
    const diagB = await pagePoint(vpiPage, 44, 34);
    await page.mouse.click(diagA.x, diagA.y);
    await page.mouse.move(diagB.x, diagB.y);
    assert.equal(await vpiPage.locator('.tij-guide-line.is-invalid').count(), 1, 'Guía diagonal marcada inválida');
    await page.mouse.click(diagB.x, diagB.y);
    assert.equal(await page.evaluate(() => adcMotor01Tijera.getState().boxes.length), 4, 'Diagonal no modifica cajas');
    assert.match(await page.locator('#adcDesignPanel [data-status]').innerText(), /diagonal/i);

    // Prueba 6b: Rechazo atómico cuando alguna caja intersectada quedaría menor a 16 px.
    const smallPlan = await page.evaluate(() => adcMotor01Tijera.computeCutPlan({
      pageNumber: 1,
      pageWidth: 816,
      pageHeight: 1344,
      pointA: { x: 5, y: 18.6 },
      pointB: { x: 95, y: 18.6 },
      boxes: adcMotor01Tijera.getState().boxes
    }));
    assert.equal(smallPlan.valid, false);
    assert.equal(smallPlan.reason, 'too-small');

    // Pruebas 6 y 11: Corte vertical sobre múltiples cajas simultáneas y Deshacer/Rehacer atómicos.
    await viewport.evaluate(el => { el.scrollTop = 130; });
    await page.waitForTimeout(50);
    const vertA = await pagePoint(vpiPage, 28, 14);
    const vertB = await pagePoint(vpiPage, 28, 54);
    await page.mouse.click(vertA.x, vertA.y);
    await page.mouse.move(vertB.x, vertB.y);
    assert.equal(await vpiPage.locator('.tij-box.is-affected').count(), 3, 'Atraviesa tij-box-1, tij-box-1-p2 y tij-box-2');
    await page.mouse.click(vertB.x, vertB.y);
    const afterMultiV = await page.evaluate(() => adcMotor01Tijera.getState().boxes);
    assert.equal(afterMultiV.length, 7, 'Divide 3 cajas en una sola operación vertical');
    assert.equal(new Set(afterMultiV.map(b => b.id)).size, 7, 'IDs únicos tras corte múltiple');

    // Deshacer todo el corte múltiple con un solo clic en Deshacer y Rehacer luego.
    await page.locator('#adcDesignPanel [data-act="undo"]').click();
    assert.equal(await page.evaluate(() => adcMotor01Tijera.getState().boxes.length), 4, 'Un solo Deshacer revierte todas las cajas del corte');
    await page.locator('#adcDesignPanel [data-act="redo"]').click();
    assert.equal(await page.evaluate(() => adcMotor01Tijera.getState().boxes.length), 7, 'Rehacer restaura íntegramente el corte');

    // Pruebas 8 y 9: Misma precisión geométrica con zoom 25%, 100%, 200%, PDF desplazado, redimensionado y pantalla completa.
    await clickTool(page, splitBtn); // Re-activar Tijera (Undo/Redo dejan herramienta en '')
    await shell.evaluate(el => el.scrollIntoView({ block: 'center' }));
    const slider = shell.locator('[data-vpi-zoom-slider]');
    for (const pct of ['25', '100', '200']) {
      await slider.evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, pct);
      await page.waitForTimeout(80);
      await viewport.evaluate((el, v) => {
        if (v === '25') { el.scrollTop = 0; el.scrollLeft = 0; return; }
        el.scrollTop = Math.max(0, Math.round(el.scrollHeight * 0.25 - el.clientHeight / 2));
        el.scrollLeft = Math.max(0, Math.round(el.scrollWidth * 0.7 - el.clientWidth / 2));
      }, pct);
      const xStart = pct === '25' ? 55 : 52;
      const xEnd = pct === '25' ? 95 : 85;
      const basePt = await pagePoint(vpiPage, xStart, 25);
      await page.mouse.click(basePt.x, basePt.y);
      const endPt = await pagePoint(vpiPage, xEnd, 25);
      await page.mouse.move(endPt.x, endPt.y);
      assert.equal(await page.evaluate(() => adcMotor01Tijera.getState().lastPlan?.valid), true, `Plan válido a zoom ${pct}%`);
      if (pct === '200') {
        // Confirmar corte real en tij-box-3 bajo zoom 200% + scroll (mantiene precisión de coordenadas)
        await page.mouse.click(endPt.x, endPt.y);
      } else {
        await page.keyboard.press('Escape');
      }
    }
    const boxesAfter200 = await page.evaluate(() => adcMotor01Tijera.getState().boxes);
    assert.ok(boxesAfter200.some(b => b.id === 'tij-box-3-p2'), 'Corte exacto bajo zoom 200% y scroll sobre tij-box-3');

    // Contenedor redimensionado y pantalla completa fallback
    await page.evaluate(() => adcMotor01Maestro && document.querySelector('[data-vpi-resize="right"]')?.focus());
    await page.keyboard.press('Shift+ArrowRight');
    await shell.evaluate(el => { el.requestFullscreen = () => Promise.reject(new Error('Fallback')); });
    await shell.locator('[data-vpi-action="page"]').click();
    await shell.locator('[data-vpi-action="fullscreen"]').click();
    assert.equal(await shell.evaluate(el => el.classList.contains('vpi-expanded')), true);
    const fsA = await pagePoint(vpiPage, 55, 45);
    const fsB = await pagePoint(vpiPage, 95, 45);
    // Trazar sin cajas en y=45 lado derecho no corta pero calcula coordenadas en pantalla completa sin errores.
    await page.mouse.click(fsA.x, fsA.y);
    await page.mouse.move(fsB.x, fsB.y);
    assert.equal(await page.evaluate(() => adcMotor01Tijera.getState().pointA?.x > 50), true);
    await shell.locator('.vpi-floating-fullscreen').click();

    // Seguridad: clic en controles ACC1 o sidebar no inicia cortes ni genera errores.
    await page.keyboard.press('Escape'); // limpia A
    const accBtn = page.locator('[data-acc1-top] [data-acc1-action="save"]');
    const accBox = await accBtn.boundingBox();
    await page.mouse.click(accBox.x + accBox.width / 2, accBox.y + accBox.height / 2);
    assert.equal(await page.evaluate(() => adcMotor01Tijera.getState().pointA), null, 'Controles ACC1 nunca inician cortes');

    // Prueba 13: Al desactivar Tijera (segundo clic en Tijera y al cerrar tuerquita), el Pan vuelve a funcionar normalmente.
    await slider.evaluate(el => { el.value = '150'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await viewport.evaluate(el => { el.scrollLeft = 100; });
    await splitBtn.click(); // Desactiva Tijera manteniendo panel abierto
    assert.equal(await page.evaluate(() => adcMotor01Tijera.isActive()), false);
    const vpBox = await viewport.boundingBox();
    await page.mouse.move(vpBox.x + vpBox.width / 2, vpBox.y + vpBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(vpBox.x + vpBox.width / 2 - 40, vpBox.y + vpBox.height / 2);
    await page.mouse.up();
    assert.ok(await viewport.evaluate(el => el.scrollLeft > 100), 'Pan del visor funciona tras desactivar Tijera');

    // Cambiar de herramienta cancela corte pendiente y al cerrar panel / cambiar documento limpia todo.
    await clickTool(page, splitBtn);
    const cancelA = await pagePoint(vpiPage, 12, 22);
    await page.mouse.click(cancelA.x, cancelA.y);
    await clickTool(page, '[data-act="section"]');
    assert.equal(await page.evaluate(() => adcMotor01Tijera.getState().pointA), null, 'Cambiar de herramienta cancela corte pendiente');
    await gear.click(); // cierra tuerquita
    assert.equal(await vpiPage.locator('.tij-guide-line,.tij-point-a').count(), 0);

    // Prueba 12: Cambiar de documento y comprobar que ni PDFs ni formularios productivos fueron alterados.
    const afterPdfCheck = await page.evaluate(async () => {
      const res = await fetch('assets/formularios/DP-01.pdf');
      const buf = new Uint8Array(await res.arrayBuffer());
      return { length: buf.length, head: Array.from(buf.slice(0, 16)) };
    });
    assert.deepEqual(afterPdfCheck, initialPdfCheck, 'PDF oficial DP-01 inalterado');
    await page.locator('[data-vpi-doc="form-6"]').click();
    await page.waitForFunction(() => window.adcMotor01Maestro?.getDiagnostics()?.activeId === 'form-6');
    assert.equal(await page.evaluate(() => localStorage.getItem('adc_dj02_v1')), initialProd, 'Borradores productivos intactos');
    assert.deepEqual(errors, []);

    await page.screenshot({ path: path.join(outDir, 'tij01-ok.png') });
    console.log('Capturas TIJ-01:', outDir);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
