const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

test('MOTOR-01 Fase 1: VPI-01 experimental aislado, bajo demanda, tiradores, gestos y candado admin', { timeout: 120000 }, async () => {
  const server = require('../tools/motor01-preview.cjs').createMotor01Server();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'adc-vpi-fase1-'));

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    const pdfRequests = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('request', req => {
      if (/\.pdf(?:[?#]|$)/i.test(req.url())) pdfRequests.push(new URL(req.url()).pathname);
    });

    await context.route(/^https:\/\//, route => route.abort());
    await context.route('**/assets/datos/ajustes-pagina.json', route =>
      route.fulfill({ json: require('../assets/js/editor/ajustes-proyecto-datos.js').empty() })
    );

    const url = `http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1&adc-inicio=1&adc-motor01=incapacidad`;
    await page.goto(url);
    const initialStorage = await page.evaluate(() => ({ ...localStorage }));
    await page.locator('#tabP').click();
    const initialProfileWrapMaxWidth = await page.evaluate(() => getComputedStyle(document.querySelector('body > .wrap')).maxWidth);
    const initialProfileWidth = Math.round((await page.locator('#profile').boundingBox()).width);

    // Entrar a Mis trámites y verificar que todavía no se descargó ningún PDF.
    await page.locator('#adcTabTramites2').click();
    assert.equal(pdfRequests.length, 0, 'No debe descargar PDFs antes de seleccionar uno');
    assert.equal(await page.locator('#adcVpiMaestroTab').isVisible(), true);

    await page.locator('#adcVpiMaestroTab').click();
    assert.equal(await page.locator('#adcVpiMaestro').isVisible(), true);
    await page.waitForFunction(() => document.querySelectorAll('#adcVpiMaestro [data-vpi-doc]').length >= 46);
    assert.equal(pdfRequests.length, 0);

    // Verificar barra lateral izquierda separada del visor, apilada verticalmente y con buscador.
    assert.equal((await page.locator('#adcVpiSidebarTitle').innerText()).trim(), '¿Qué formulario estás buscando?');
    const sidebarBox = await page.locator('.vpi-maestro-sidebar').boundingBox();
    const stageBox = await page.locator('.vpi-maestro-stage-col').boundingBox();
    assert.ok(stageBox.x - (sidebarBox.x + sidebarBox.width) >= 16, 'Catálogo lateral separado visualmente del visor');
    const docBoxes = await page.locator('#adcVpiMaestro [data-vpi-doc]').evaluateAll(nodes =>
      nodes.slice(0, 6).map(el => {
        const r = el.getBoundingClientRect();
        const small = el.querySelector('small')?.getBoundingClientRect();
        return { y: r.y, bottom: r.bottom, fits: el.scrollHeight <= el.clientHeight + 1, innerMargin: small ? r.bottom - small.bottom : 99 };
      })
    );
    assert.ok(docBoxes[1].y >= docBoxes[0].bottom - 1 && docBoxes[2].y >= docBoxes[1].bottom - 1, 'Botones apilados uno encima del otro');
    assert.ok(docBoxes.every(b => b.fits && b.innerMargin >= 6), 'Texto contenido holgadamente dentro de cada caja');

    await page.locator('[data-vpi-filter]').fill('N°1');
    assert.ok(await page.locator('#adcVpiMaestro [data-vpi-doc]').count() < 10);
    await page.locator('[data-vpi-doc="raw:06-FORMULARIO-N°1-Ingreso-de-Datos-del-Agente.pdf"]').click();
    await page.waitForFunction(() => window.adcMotor01Maestro?.getDiagnostics()?.activeId === 'raw:06-FORMULARIO-N°1-Ingreso-de-Datos-del-Agente.pdf' && window.adcMotor01Maestro.getDiagnostics().renderedCanvases === 1);
    await page.locator('[data-vpi-filter]').fill('');
    assert.ok(await page.locator('#adcVpiMaestro [data-vpi-doc]').count() >= 46);
    pdfRequests.length = 0;

    // 1. Cargar DP-01 vertical bajo demanda.
    await page.locator('[data-vpi-doc="dp01"]').click();
    await page.waitForFunction(() => window.adcMotor01Maestro?.getDiagnostics()?.activeId === 'dp01' && window.adcMotor01Maestro.getDiagnostics().renderedCanvases === 1);
    const dpDiag = await page.evaluate(() => adcMotor01Maestro.getDiagnostics());
    assert.equal(dpDiag.widthPt, 612);
    assert.equal(Math.round(dpDiag.heightPt), 1008);
    assert.deepEqual(pdfRequests, ['/adc/assets/formularios/DP-01.pdf']);

    // Verificar que el canvas tiene contenido pintado real.
    const canvasPixels = await page.locator('[data-vpi-shell] canvas').evaluate(canvas => {
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < data.length; i += 16) {
        if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) return true;
      }
      return false;
    });
    assert.equal(canvasPixels, true, 'El canvas de DP-01 debe estar renderizado');

    const shell = page.locator('[data-vpi-shell]');
    const viewport = shell.locator('.vpi-viewport');
    const slider = shell.locator('[data-vpi-zoom-slider]');
    const initialShellWidth = (await shell.boundingBox()).width;

    // 2. Cambiar a Formulario N°6 horizontal: libera DP-01 y NO auto-expande el contenedor.
    await page.locator('[data-vpi-doc="form-6"]').click();
    await page.waitForFunction(() => window.adcMotor01Maestro?.getDiagnostics()?.activeId === 'form-6' && window.adcMotor01Maestro.getDiagnostics().renderedCanvases === 1);
    const f6Diag = await page.evaluate(() => adcMotor01Maestro.getDiagnostics());
    assert.equal(Math.round(f6Diag.widthPt), 1008);
    assert.equal(Math.round(f6Diag.heightPt), 612);
    assert.ok(f6Diag.releasedCount >= 1);
    assert.equal(pdfRequests.length, 2);
    assert.ok(Math.abs((await shell.boundingBox()).width - initialShellWidth) <= 1, 'No auto-expandir por orientación horizontal');

    // 3. Zoom manual (+, -, slider, rueda, pinza) y automático (ancho / pantalla).
    await shell.locator('[data-vpi-action="width"]').click();
    const widthPercent = await page.evaluate(() => adcMotor01Maestro.getDiagnostics().percent);
    await shell.locator('[data-vpi-action="page"]').click();
    assert.equal(await page.evaluate(() => adcMotor01Maestro.getDiagnostics().zoomMode), 'page');
    await shell.locator('[data-vpi-action="in"]').click();
    const afterIn = await page.evaluate(() => adcMotor01Maestro.getDiagnostics().percent);
    assert.ok(afterIn > 25 && (await page.evaluate(() => adcMotor01Maestro.getDiagnostics().zoomMode)) === 'manual');
    await shell.locator('[data-vpi-action="out"]').click();
    assert.ok(await page.evaluate(() => adcMotor01Maestro.getDiagnostics().percent) < afterIn);

    await slider.evaluate(el => { el.value = '160'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal(await shell.locator('[data-vpi-zoom-output]').innerText(), '160 %');
    const vpBox = await viewport.boundingBox();
    await page.mouse.move(vpBox.x + vpBox.width / 2, vpBox.y + vpBox.height / 2);
    await page.mouse.wheel(0, -150);
    const afterWheel = await page.evaluate(() => adcMotor01Maestro.getDiagnostics().percent);
    assert.ok(afterWheel > 160);

    await viewport.evaluate(el => {
      const touches = d => [
        new Touch({ identifier: 1, target: el, clientX: 200, clientY: 220 }),
        new Touch({ identifier: 2, target: el, clientX: 200 + d, clientY: 220 })
      ];
      el.dispatchEvent(new TouchEvent('touchstart', { touches: touches(60), bubbles: true, cancelable: true }));
      el.dispatchEvent(new TouchEvent('touchmove', { touches: touches(30), bubbles: true, cancelable: true }));
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
    });
    assert.ok((await page.evaluate(() => adcMotor01Maestro.getDiagnostics().percent)) < afterWheel);

    // 4. Pan libre con mouse en 4 direcciones y única barra vertical derecha.
    assert.equal(await shell.locator('.vpi-vertical-scroll').count(), 1);
    await slider.evaluate(el => { el.value = '190'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    const startScroll = await viewport.evaluate(el => ({ l: el.scrollLeft, t: el.scrollTop }));
    const cx = vpBox.x + vpBox.width / 2;
    const cy = vpBox.y + vpBox.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    assert.equal(await shell.evaluate(el => el.classList.contains('vpi-grabbing')), true);
    await page.mouse.move(cx - 100, cy - 90, { steps: 4 });
    await page.mouse.up();
    const movedDownRight = await viewport.evaluate(el => ({ l: el.scrollLeft, t: el.scrollTop }));
    assert.ok(movedDownRight.l > startScroll.l && movedDownRight.t > startScroll.t, 'Pan diagonal hacia abajo-derecha');

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy + 50, { steps: 4 });
    await page.mouse.up();
    const movedUpLeft = await viewport.evaluate(el => ({ l: el.scrollLeft, t: el.scrollTop }));
    assert.ok(movedUpLeft.l < movedDownRight.l && movedUpLeft.t < movedDownRight.t, 'Pan diagonal hacia arriba-izquierda');

    // 5. Tiradores laterales superiores: anchos intermedios, teclado, y preservación de zoom manual vs ajuste automático.
    const rightHandle = shell.locator('.vpi-resize-right');
    const leftHandle = shell.locator('.vpi-resize-left');
    await rightHandle.scrollIntoViewIfNeeded();
    const rBox = await rightHandle.boundingBox();
    const beforeManualWidth = (await shell.boundingBox()).width;
    await slider.evaluate(el => { el.value = '135'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.mouse.move(rBox.x + rBox.width / 2, rBox.y + rBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(rBox.x + rBox.width / 2 - 70, rBox.y + rBox.height / 2, { steps: 5 });
    await page.mouse.up();
    const narrowedWidth = (await shell.boundingBox()).width;
    assert.ok(narrowedWidth < beforeManualWidth - 40 && narrowedWidth > 320, 'Ancho intermedio al arrastrar hacia adentro');
    assert.equal(await page.evaluate(() => adcMotor01Maestro.getDiagnostics().percent), 135, 'Zoom manual preservado al redimensionar');

    // Arrastrar tirador izquierdo hacia afuera para ampliar gradualmente.
    await leftHandle.scrollIntoViewIfNeeded();
    const lBox = await leftHandle.boundingBox();
    await page.mouse.move(lBox.x + lBox.width / 2, lBox.y + lBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(lBox.x + lBox.width / 2 - 40, lBox.y + lBox.height / 2, { steps: 4 });
    await page.mouse.up();
    const widenedWidth = (await shell.boundingBox()).width;
    assert.ok(widenedWidth > narrowedWidth + 20, 'Ampliación gradual desde tirador izquierdo');
    assert.equal(await page.evaluate(() => adcMotor01Maestro.getDiagnostics().percent), 135, 'Zoom manual sigue preservado');

    // Alternativa por teclado en tirador derecho.
    await rightHandle.focus();
    await page.keyboard.press('ArrowLeft');
    const afterKeyWidth = (await shell.boundingBox()).width;
    assert.ok(afterKeyWidth < widenedWidth);

    // En modo Ajustar al ancho sí recalcula escala al cambiar contenedor.
    await shell.locator('[data-vpi-action="width"]').click();
    const fitScaleBefore = await page.evaluate(() => adcMotor01Maestro.getDiagnostics().scale);
    await rightHandle.focus();
    await page.keyboard.press('Shift+ArrowRight');
    const fitScaleAfter = await page.evaluate(() => adcMotor01Maestro.getDiagnostics().scale);
    assert.ok(fitScaleAfter > fitScaleBefore, 'Ajustar al ancho recalcula escala al ampliar contenedor');

    // 5b. Tiradores inferiores de redimensionamiento vertical (↕): estirar hacia abajo, volver hacia arriba, teclado, doble clic y sin solapamiento.
    const bottomLeft = shell.locator('.vpi-resize-bottom-left');
    const bottomRight = shell.locator('.vpi-resize-bottom-right');
    assert.equal(await bottomLeft.isVisible(), true);
    assert.equal(await bottomRight.isVisible(), true);
    await bottomRight.scrollIntoViewIfNeeded();

    const overlapCheck = await page.evaluate(() => {
      const bar = document.querySelector('[data-vpi-shell] .vpi-bottom-bar')?.getBoundingClientRect();
      const bl = document.querySelector('.vpi-resize-bottom-left')?.getBoundingClientRect();
      const br = document.querySelector('.vpi-resize-bottom-right')?.getBoundingClientRect();
      const accBottom = document.querySelector('[data-acc1-bottom]')?.getBoundingClientRect();
      const disjoint = (a, b) => !a || !b || a.bottom <= b.top + 1 || a.top >= b.bottom - 1 || a.right <= b.left + 1 || a.left >= b.right - 1;
      return {
        aboveBottomAcc: accBottom ? Math.max(bl.bottom, br.bottom) <= accBottom.top + 1 : true,
        clearOfZoomBar: disjoint(bl, bar) && disjoint(br, bar)
      };
    });
    assert.equal(overlapCheck.aboveBottomAcc, true, 'Tiradores inferiores no invaden la barra ACC1 inferior');
    assert.equal(overlapCheck.clearOfZoomBar, true, 'Tiradores inferiores no tapan la barra inferior de zoom');

    const defaultHeight = Math.round((await shell.boundingBox()).height);
    await shell.locator('[data-vpi-zoom-slider]').evaluate(el => { el.value = '115'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    const brBox = await bottomRight.boundingBox();
    await page.mouse.move(brBox.x + brBox.width / 2, brBox.y + brBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(brBox.x + brBox.width / 2, brBox.y + brBox.height / 2 + 120, { steps: 6 });
    await page.mouse.up();

    const stretchedHeight = Math.round((await shell.boundingBox()).height);
    assert.ok(stretchedHeight >= defaultHeight + 90, 'Arrastrar tirador inferior hacia abajo estira la caja del visor');
    assert.equal(await page.evaluate(() => adcMotor01Maestro.getDiagnostics().percent), 115, 'Zoom manual conservado al estirar verticalmente');
    assert.equal(await page.evaluate(() => adcMotor01Maestro.getDiagnostics().sessionHeight), stretchedHeight);

    const blBox = await bottomLeft.boundingBox();
    await page.mouse.move(blBox.x + blBox.width / 2, blBox.y + blBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(blBox.x + blBox.width / 2, blBox.y + blBox.height / 2 - 80, { steps: 5 });
    await page.mouse.up();
    const reducedHeight = Math.round((await shell.boundingBox()).height);
    assert.ok(reducedHeight <= stretchedHeight - 50 && reducedHeight > defaultHeight, 'Arrastrar tirador inferior hacia arriba achica progresivamente');

    await page.locator('[data-vpi-doc="dp01"]').click();
    await page.waitForFunction(() => window.adcMotor01Maestro?.getDiagnostics()?.activeId === 'dp01');
    assert.equal(Math.round((await shell.boundingBox()).height), reducedHeight, 'Alto elegido conservado en sesión al cambiar de PDF');

    await shell.locator('[data-vpi-action="page"]').click();
    const pageScaleBefore = await page.evaluate(() => adcMotor01Maestro.getDiagnostics().scale);
    await bottomLeft.focus();
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    const pageScaleAfter = await page.evaluate(() => adcMotor01Maestro.getDiagnostics().scale);
    assert.ok(pageScaleAfter > pageScaleBefore, 'Ajustar a pantalla recalcula escala al estirar verticalmente');

    await bottomLeft.dblclick();
    assert.equal(await page.evaluate(() => adcMotor01Maestro.getDiagnostics().sessionHeight), null, 'Doble clic en tirador inferior restaura alto por defecto');

    // 6. Pantalla completa: barra inferior, Escape, doble clic, doble toque y botón flotante.
    await shell.evaluate(el => { el.requestFullscreen = () => Promise.reject(new Error('Fallback prueba')); });
    await shell.locator('[data-vpi-action="fullscreen"]').click();
    assert.equal(await shell.evaluate(el => el.classList.contains('vpi-expanded')), true);
    await page.keyboard.press('Escape');
    assert.equal(await shell.evaluate(el => el.classList.contains('vpi-expanded')), false);

    await viewport.dispatchEvent('dblclick');
    assert.equal(await shell.evaluate(el => el.classList.contains('vpi-expanded')), true);
    await shell.locator('.vpi-floating-fullscreen').click();
    assert.equal(await shell.evaluate(el => el.classList.contains('vpi-expanded')), false);

    await viewport.evaluate(el => {
      for (let i = 0; i < 2; i++) {
        const t = new Touch({ identifier: 1, target: el, clientX: 80, clientY: 90 });
        el.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], bubbles: true }));
        el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], bubbles: true, cancelable: true }));
      }
    });
    assert.equal(await shell.evaluate(el => el.classList.contains('vpi-expanded')), true);
    await page.keyboard.press('Escape');
    assert.equal(await shell.evaluate(el => el.classList.contains('vpi-expanded')), false);

    // 6b. Cargar DJ-02 horizontal oficial desde el catálogo ADC de VPI Maestro.
    await page.locator('[data-vpi-doc="dj02"]').click();
    await page.waitForFunction(() => window.adcMotor01Maestro?.getDiagnostics()?.activeId === 'dj02' && window.adcMotor01Maestro.getDiagnostics().renderedCanvases === 1);
    const dj02Diag = await page.evaluate(() => adcMotor01Maestro.getDiagnostics());
    assert.equal(Math.round(dj02Diag.widthPt), 1008);
    assert.equal(Math.round(dj02Diag.heightPt), 612);
    assert.equal(dj02Diag.pageCount, 1);
    assert.ok(pdfRequests.includes('/adc/assets/formularios/DJ-02.pdf'));
    const dj02Pixels = await page.locator('[data-vpi-shell] canvas').evaluate(canvas => {
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < data.length; i += 16) {
        if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) return true;
      }
      return false;
    });
    assert.equal(dj02Pixels, true, 'El canvas de DJ-02 debe estar renderizado');

    // 7. Claro / oscuro y móvil 390px sin desborde horizontal.
    await page.locator('[data-vpi-doc="dp01"]').click();
    await page.waitForFunction(() => window.adcMotor01Maestro?.getDiagnostics()?.activeId === 'dp01' && window.adcMotor01Maestro.getDiagnostics().renderedCanvases === 1);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 950 });
      for (const theme of ['light', 'dark']) {
        if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('#adcThemeSwitch').click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Sin desborde a ${width}/${theme}`);
        await page.screenshot({ path: path.join(output, `vpi-fase1-${width}-${theme}.png`) });
      }
    }
    if (await page.locator('html').getAttribute('data-theme') !== (initialStorage['adc-login-theme'] || 'light')) {
      await page.locator('#adcThemeSwitch').click();
    }

    // 8. Descargar de memoria y salida de Mis trámites liberan todo sin alterar localStorage ni productivos.
    await page.locator('[data-vpi-unload]').click();
    const afterUnload = await page.evaluate(() => adcMotor01Maestro.getDiagnostics());
    assert.equal(afterUnload.activeId, null);
    assert.equal(afterUnload.activeCanvases, 0);

    await page.locator('[data-vpi-doc="dp01"]').click();
    await page.waitForFunction(() => window.adcMotor01Maestro?.getDiagnostics()?.activeId === 'dp01');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('#tabP').click();
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('body > .wrap')).maxWidth), initialProfileWrapMaxWidth, 'Salir de VPI Maestro hacia Mi perfil docente restaura max-width original');
    assert.equal(Math.round((await page.locator('#profile').boundingBox()).width), initialProfileWidth, 'Mi perfil docente conserva exactamente su ancho original');
    await page.locator('#adcTabInicio').click();
    const afterNav = await page.evaluate(() => adcMotor01Maestro.getDiagnostics());
    assert.equal(afterNav.activeId, null);
    assert.equal(afterNav.activeCanvases, 0);
    assert.deepEqual(
      await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([k]) => !['adc-login-theme', 'adc_theme'].includes(k)))),
      initialStorage
    );
    assert.deepEqual(errors, []);

    // 9. Candado admin en modo supabase (tester autenticado NO ve VPI Maestro; admin sí).
    for (const [role, expectedVisible] of [['tester', false], ['admin', true]]) {
      const supaContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const supaPage = await supaContext.newPage();
      supaPage.setDefaultTimeout(15000);
      const userObj = {
        id: role === 'admin' ? '11111111-1111-4111-8111-111111111111' : '22222222-2222-4222-8222-222222222222',
        aud: 'authenticated',
        role: 'authenticated',
        email: role === 'admin' ? 'prof.josemiguelgomez@gmail.com' : role + '@test.local',
        app_metadata: role === 'admin' ? { provider: 'email', adc_role: 'admin' } : { provider: 'email', adc_role: 'tester' },
        user_metadata: {}
      };
      const header = Buffer.from('{"alg":"HS256"}').toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: userObj.id, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
      const session = {
        access_token: `${header}.${payload}.sig`,
        refresh_token: 'fixture',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: userObj
      };
      await supaPage.route('**/assets/datos/config-publica.js*', route => route.fulfill({
        contentType: 'application/javascript',
        body: 'window.adcConfig = Object.freeze({ authMode: "supabase", supabaseUrl: "https://adc-admin-test.supabase.co", supabaseAnonKey: "sb_publishable_test", googleAuthEnabled: false, emailConfirmationsRequired: false, passwordRecoveryEnabled: false, motor01Pilot: false });'
      }));
      await supaPage.route('**/assets/datos/ajustes-pagina.json', route =>
        route.fulfill({ json: require('../assets/js/editor/ajustes-proyecto-datos.js').empty() })
      );
      await supaPage.route('https://adc-admin-test.supabase.co/**', route => {
        const reqPath = new URL(route.request().url()).pathname;
        if (reqPath.endsWith('/user')) return route.fulfill({ status: 200, contentType: 'application/json', json: userObj });
        if (reqPath === '/rest/v1/adc_tester_profiles') return route.fulfill({ status: 200, contentType: 'application/json', json: { id: userObj.id, display_name: '', created_at: '2026-01-01', updated_at: '2026-01-01' } });
        if (reqPath === '/rest/v1/adc_user_records') return route.fulfill({ status: 200, contentType: 'application/json', json: [] });
        return route.fulfill({ status: 200, contentType: 'application/json', json: {} });
      });
      await supaPage.addInitScript(({ s }) => {
        localStorage.setItem('adc-supabase-auth', JSON.stringify(s));
        localStorage.setItem('adc-auth-local-owner', s.user.id);
      }, { s: session });
      await supaPage.goto(`http://127.0.0.1:${server.address().port}/adc/index.html`, { waitUntil: 'domcontentloaded' });
      await supaPage.waitForSelector('#adcTabTramites2');
      await supaPage.locator('#adcTabTramites2').click();
      await supaPage.waitForTimeout(300);
      assert.equal(await supaPage.locator('#adcVpiMaestroTab').isVisible(), expectedVisible, `Visibilidad de VPI Maestro para ${role}`);
      await supaContext.close();
    }

    console.log('Capturas VPI Fase 1:', output);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
