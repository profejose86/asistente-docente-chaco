const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os'),fs=require('node:fs');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const fixture=fs.readFileSync(path.join(__dirname,'fixtures/contact-icon.html'),'utf8');

test('Cuenta visual aislada: clic, teclado, toque y ARIA; acciones sin efectos reales',async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({hasTouch:true}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',route=>{requests.push(route.request().url());return route.abort();});
  await page.setContent(fixture);
  const trigger=page.locator('#adcProfileBtn'),panel=page.locator('#adcProfileMenu');
  assert.equal(await panel.isVisible(),false);
  assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  assert.equal(await trigger.getAttribute('aria-controls'),'adcProfileMenu');
  for(let i=0;i<3;i++){
   await trigger.click();assert.equal(await panel.isVisible(),true);assert.equal(await trigger.getAttribute('aria-expanded'),'true');
   await trigger.click();assert.equal(await panel.isVisible(),false);assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  }
  await trigger.focus();await page.keyboard.press('Enter');assert.equal(await panel.isVisible(),true);
  await page.keyboard.press('Space');assert.equal(await panel.isVisible(),false);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:600});
   await trigger.tap();assert.equal(await panel.isVisible(),true);
   const box=await panel.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width);
   await trigger.tap();assert.equal(await panel.isVisible(),false);
  }
  await trigger.click();
  await page.locator('#adcSyncBtn').click();await page.locator('#adcLogoutBtn').click();
  assert.equal(await panel.isVisible(),true);assert.equal(page.url(),'about:blank');
  assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'adc-contact-icon-'));
  await page.setViewportSize({width:390,height:400});
  await page.screenshot({path:path.join(output,'contact-icon.png')});
  console.log('Captura de prueba: '+path.join(output,'contact-icon.png'));
 }finally{await browser.close();}
});
