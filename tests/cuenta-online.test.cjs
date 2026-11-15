const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'..');

test('Cuenta en la entrada normal: avatar responsive, teclado y tema compartido con login',async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({hasTouch:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const base='https://adc-account.example/adc/';
  await page.route(base+'**',route=>{
   const file=decodeURIComponent(new URL(route.request().url()).pathname.slice(5));
   if(file==='assets/datos/config-publica.js')return route.fulfill({contentType:'application/javascript',body:require('./support/demo-config.cjs').script});
   const absolute=path.resolve(root,file);
   return absolute.startsWith(root+path.sep)&&fs.existsSync(absolute)?route.fulfill({path:absolute}):route.abort();
  });
  await page.goto(base+'ADC_Ingreso_Editable.html');
  const theme=page.locator('#adcThemeSwitch');
  await theme.click();assert.equal(await theme.getAttribute('aria-checked'),'true');
  await page.goto(base+'index.html?adc-preview=1');
  assert.equal(await theme.getAttribute('aria-checked'),'true');
  assert.equal(await page.locator('#adcProfileBtn').count(),1);
  const trigger=page.locator('#adcProfileBtn'),menu=page.locator('#adcProfileMenu');
  const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  for(const width of [280,320,390,600,601,768,1024,1099,1100,1440,1920]){
   await page.setViewportSize({width,height:900});
   for(const dark of [false,true]){
    if((await theme.getAttribute('aria-checked')==='true')!==dark)await theme.click();
    const accountBox=await trigger.boundingBox(),themeBox=await theme.boundingBox();
    assert.equal(overlaps(accountBox,themeBox),false);
    assert.equal(overlaps(accountBox,await page.locator('h1').boundingBox()),false);
    if(width<1100)assert.equal(overlaps(accountBox,await page.locator('.adc-theme-header').boundingBox()),false);
    const avatar=await trigger.locator('.adc-avatar').boundingBox();
    assert.equal(avatar.width,55);assert.equal(avatar.height,49);
    assert.equal(await trigger.evaluate(node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)');
    await trigger.tap();
    assert.equal(await trigger.getAttribute('aria-expanded'),'true');
    const box=await menu.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width&&box.y+box.height<=900);
    await page.keyboard.press('Escape');assert.equal(await menu.isVisible(),false);
    assert.equal(await trigger.evaluate(node=>node===document.activeElement),true);
   }
  }
  await page.setViewportSize({width:1440,height:900});
  await trigger.focus();await page.keyboard.press('Enter');await page.keyboard.press('Tab');
  assert.equal(await page.locator('#adcLogoutBtn').evaluate(node=>node===document.activeElement),true);
  await page.keyboard.press('Escape');
  await theme.click();const saved=await theme.getAttribute('aria-checked');
  await page.goto(base+'ADC_Ingreso_Editable.html');assert.equal(await theme.getAttribute('aria-checked'),saved);
  await page.goto(base+'index.html?adc-preview=1');
  const output=path.join(root,'.adc-tools/cuenta-online');fs.mkdirSync(output,{recursive:true});
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:900});await trigger.click();
   await page.screenshot({path:path.join(output,width+'.png')});await page.keyboard.press('Escape');
  }
  await page.evaluate(()=>{localStorage.removeItem('adc-login-theme');localStorage.setItem('adc_theme','dark')});
  await page.reload();assert.equal(await theme.getAttribute('aria-checked'),'true');
  await trigger.click();await page.locator('#adcLogoutBtn').click();await page.waitForURL(base+'ADC_Ingreso_Editable.html');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
