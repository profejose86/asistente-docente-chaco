const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'..');
test('Ajustes: cinco clics/toques o Tab, aislamiento por pestaña, recarga y cierre de sesión',async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({hasTouch:true});
  await context.route('https://adc-test.example/adc/**',route=>{
   const relative=new URL(route.request().url()).pathname.slice('/adc/'.length);
   if(relative==='assets/datos/config-publica.js')return route.fulfill({contentType:'application/javascript',body:require('./support/demo-config.cjs').script});
   const file=path.join(root,relative);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();
  });
  const page=await context.newPage();await page.goto('https://adc-test.example/adc/ADC_Ingreso_Editable.html');
  const gear=page.locator('#adcDesignGear'),panel=page.locator('#adcDesignPanel');
  assert.equal(await gear.evaluate(e=>getComputedStyle(e).opacity),'0');
  for(let i=0;i<4;i++)await gear.click();
  assert.equal(await gear.evaluate(e=>getComputedStyle(e).opacity),'0');assert.equal(await panel.isVisible(),false);
  await gear.click();assert.equal(await gear.getAttribute('data-adc-locked'),null);assert.equal(await panel.isVisible(),false);
  await gear.click();assert.equal(await panel.isVisible(),true);
  await page.reload();assert.equal(await gear.getAttribute('data-adc-locked'),null);
  const other=await context.newPage();await other.goto('https://adc-test.example/adc/ADC_Ingreso_Editable.html');
  assert.notEqual(await other.locator('#adcDesignGear').getAttribute('data-adc-locked'),null);
  for(let i=0;i<5;i++)await other.keyboard.press('Tab');assert.equal(await other.locator('#adcDesignGear').getAttribute('data-adc-locked'),null);
  await page.locator('#adcDesignGear').click();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('adc:auth-changed',{detail:{event:'SIGNED_OUT'}})));
  assert.notEqual(await gear.getAttribute('data-adc-locked'),null);assert.equal(await panel.isVisible(),false);
  for(let i=0;i<5;i++)await gear.tap();assert.equal(await gear.getAttribute('data-adc-locked'),null);
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('adc:auth-changed',{detail:{event:'SIGNED_IN',userId:'otra-cuenta'}})));
  assert.notEqual(await gear.getAttribute('data-adc-locked'),null);
  assert.equal(await page.evaluate(()=>localStorage.getItem('adc-adjustments-tab-session')),null);
 }finally{await browser.close();}
});
