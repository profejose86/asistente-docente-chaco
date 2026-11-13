const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('C:/Users/CONECTIA BA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
test('Ingreso demo: rutas locales y Pages conservan el directorio y evitan bucles', () => {
 const source = fs.readFileSync(path.join(root, 'assets/js/interfaz/inicio-local.js'), 'utf8');
 for (const base of ['file:///C:/PaginaDocente/', 'http://127.0.0.1:8765/', 'https://profejose86.github.io/asistente-docente-chaco/']) {
  let target;
  vm.runInNewContext(source, { URL, window: { location: { href: base + 'index.html', replace: value => target = value } } });
  assert.equal(target, base + 'ADC_Ingreso_Editable.html');
  target = undefined;
  vm.runInNewContext(source, { URL, window: { location: { href: base + 'index.html?adc-preview=1', replace: value => target = value } } });
  assert.equal(target, undefined);
 }
});
test('Ingreso demo online: aviso, acceso sin datos, registro, temas y ancho movil', async () => {
 const browser = await chromium.launch({ channel: 'chrome', headless: true });
 try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('https://adc-test.example/adc/**', route => {
   const relative = decodeURIComponent(new URL(route.request().url()).pathname.slice('/adc/'.length));
   if (relative === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<h1>ADC demo</h1>' });
   const file = path.join(root, relative);
   return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
  });
  await page.goto('https://adc-test.example/adc/ADC_Ingreso_Editable.html');
  assert.match(await page.locator('#adcLoginStatus').textContent(), /demostraci/);
  assert.equal(await page.locator('#adcLoginForm').evaluate(f => f.noValidate), true);
  await page.locator('#adcThemeSwitch').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.locator('#adcOpenSignup').click();
  assert.ok(await page.locator('#adcSignupEmail').getAttribute('required') !== null);
  await page.locator('#adcBackToLogin').click();
  for (const width of [320, 390, 768, 1440]) {
   await page.setViewportSize({ width, height: 1000 });
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  await page.locator('#adcLoginForm button[type=submit]').click();
  await page.waitForURL('https://adc-test.example/adc/index.html?adc-preview=1');
  assert.deepEqual(errors, []);
 } finally { await browser.close(); }
});
