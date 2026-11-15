const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os'),fs=require('node:fs');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const {createServer}=require('../tools/contact-icon-preview.cjs');
test('Preview web: cuenta en esquina, tema del login, teclado y menú sin recortes',async()=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({hasTouch:true}),page=await context.newPage(),errors=[],remote=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():(remote.push(route.request().url()),route.abort()));
  const url=`http://127.0.0.1:${server.address().port}/index.html?adc-preview=1`;
  await page.goto(url);
  const trigger=page.locator('#adcProfileBtn'),menu=page.locator('#adcProfileMenu'),theme=page.locator('#adcThemeSwitch');
  const intersects=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  for(const width of [280,320,360,390,460,600,601,768,1024,1099,1100,1250,1440,1920]){
   await page.setViewportSize({width,height:800});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   for(const dark of [false,true]){
    if((await theme.getAttribute('aria-checked'))!==String(dark))await theme.click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),dark?'dark':'light');
    assert.equal(await theme.locator(dark?'.theme-dark':'.theme-light').first().isVisible(),true);
    assert.equal(await theme.evaluate(e=>getComputedStyle(e).backgroundColor),dark?'rgb(38, 53, 77)':'rgb(241, 245, 251)');
    const accountBox=await trigger.boundingBox(),themeBox=await theme.boundingBox(),heading=await page.locator('h1').boundingBox();
    const avatarBox=await trigger.locator('.adc-avatar').boundingBox();assert.equal(avatarBox.width,55);assert.equal(avatarBox.height,49);
    if(width===1920){const px=96/2.54;assert.ok(Math.abs(avatarBox.x-47.94*px)<.1);assert.ok(Math.abs(avatarBox.y-.64*px)<.1);assert.ok(Math.abs(themeBox.x-37.41*px)<.1);assert.ok(Math.abs(themeBox.y-.64*px)<.1);}
    if(width<1900)assert.ok(width-accountBox.x-accountBox.width<=33);assert.ok(accountBox.y<=31);
    assert.equal(await trigger.evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
    assert.equal(await trigger.evaluate(e=>getComputedStyle(e).boxShadow),'none');
    if(width<1100){const header=await page.locator('.adc-theme-header').boundingBox();assert.ok(header.y>=Math.max(accountBox.y+accountBox.height,themeBox.y+themeBox.height));}
    assert.equal(intersects(accountBox,themeBox),false);assert.equal(intersects(accountBox,heading),false);assert.equal(intersects(themeBox,heading),false);
    await trigger.tap();assert.equal(await menu.isVisible(),true);assert.equal(await trigger.getAttribute('aria-expanded'),'true');
    const box=await menu.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width&&box.y>=accountBox.y+accountBox.height&&box.y+box.height<=800);
    assert.equal(await menu.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),true);
    await page.keyboard.press('Escape');assert.equal(await menu.isVisible(),false);assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
   }
  }
  await trigger.focus();await page.keyboard.press('Enter');assert.equal(await menu.isVisible(),true);
  assert.equal(await page.locator('#adcSyncBtn').isDisabled(),true);
  await page.keyboard.press('Tab');assert.equal(await page.locator('#adcLogoutBtn').evaluate(e=>e===document.activeElement),true);
  await page.locator('h1').click();assert.equal(await menu.isVisible(),false);
  await theme.click();const saved=await theme.getAttribute('aria-checked');await page.reload();assert.equal(await theme.getAttribute('aria-checked'),saved);
  assert.equal(await page.evaluate(()=>localStorage.getItem('adc_theme')),null);
  assert.deepEqual(remote,[]);assert.deepEqual(errors,[]);
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'adc-contact-web-'));
  for(const width of [390,1440]){await page.setViewportSize({width,height:900});await trigger.click();await page.screenshot({path:path.join(output,`${width}.png`)});await page.keyboard.press('Escape');}
  console.log('Capturas web: '+output);
  for(const width of [390,900,1440]){
   await page.setViewportSize({width,height:1100});
   const rows=[['perfilApellidos','perfilNombres','dni'],['perfilNacimiento','sexo'],['correo','perfilCelular'],['perfilTituloEdicion','perfilRegistro'],['perfilAntiguedadVista','perfilInicioActividad'],['perfilDomicilio','perfilNumeroCalle'],['perfilUnidad','perfilManzana','perfilBarrio'],['perfilLocalidad','perfilCodigoPostal','perfilDepartamento']];
   for(const row of rows){
    const boxes=await Promise.all(row.map(id=>page.locator('#'+id).boundingBox()));
    for(const box of boxes)assert.equal(box.height,42);
    if(width>=900)for(const box of boxes)assert.ok(Math.abs(box.y-boxes[0].y)<1,`Fila desalineada: ${row} a ${width}px`);
   }
   await page.locator('#sexo').hover();
   if(width>=900)assert.ok(Math.abs((await page.locator('#perfilNacimiento').boundingBox()).y-(await page.locator('#sexo').boundingBox()).y)<1);
  }
  assert.match(await page.locator('#perfilClase').locator('..').innerText(),/Fecha de nacimiento/);
  assert.match(await page.locator('#sexo').locator('..').locator('.adc-preview-caption').innerText(),/^Sexo\s*\*$/);
  for(const id of ['perfilTituloEdicion','perfilRegistro','perfilOtorgado','perfilAntiguedadVista'])assert.equal(await page.locator('#'+id).locator('..').locator('.adc-preview-caption').innerText().then(t=>(t.match(/\*/g)||[]).length),1);
  await page.locator('#tabCalendar').click();assert.equal(await page.locator('#profile').isVisible(),true);assert.equal(await page.locator('.adc-pending-card').last().isVisible(),true);
  await page.evaluate(async()=>{window.adcAuth={configured:true,ready:Promise.resolve(),user:async()=>({id:'test',email:'cuenta@example.test'})};await adcPrefillAccountEmail()});
  assert.equal(await page.locator('#correo').inputValue(),'cuenta@example.test');
  await page.locator('#correo').fill('corregido@example.test');await page.evaluate(()=>adcPrefillAccountEmail());assert.equal(await page.locator('#correo').inputValue(),'corregido@example.test');
  await page.locator('#perfilApellidos').fill('Pérez');await page.locator('#perfilNombres').fill('Juan Pablo');await page.locator('#dni').focus();
  assert.match(await page.locator('#nombre').inputValue(),/Pérez/);assert.match(await page.locator('#nombre').inputValue(),/Juan Pablo/);
  await page.locator('#perfilNacimiento').fill('25/08/1986');assert.equal((await page.locator('#perfilClase').inputValue()).replace(/\D/g,''),'1986');
  await page.locator('#perfilNacimiento').fill('31/02/1986');assert.equal(await page.locator('#perfilNacimiento').evaluate(e=>e.checkValidity()),false);
  await page.locator('#perfilNacimiento').fill('29/02/1900');assert.equal(await page.locator('#perfilNacimiento').evaluate(e=>e.checkValidity()),false);
  await page.locator('#perfilNacimiento').fill('01/01/2999');assert.equal(await page.locator('#perfilNacimiento').evaluate(e=>e.checkValidity()),false);
  await page.locator('#perfilNacimiento').fill('29/02/2000');assert.equal(await page.locator('#perfilNacimiento').evaluate(e=>e.checkValidity()),true);
  for(const [id,value] of Object.entries({perfilDomicilio:'Av. Prueba',perfilNumeroCalle:'123',perfilUnidad:'2A',perfilManzana:'5',perfilBarrio:'Centro',perfilCelular:'3624539175',perfilTituloEdicion:'Profesor en Ciencias de la Educación con orientación en enseñanza y acompañamiento de trayectorias escolares',perfilRegistro:'1234',perfilOtorgado:'Instituto de prueba',perfilAntiguedadVista:'8'}))await page.locator('#'+id).fill(value);
  await page.evaluate(()=>{document.getElementById('perfilTelefonoFijo').value='0114567890'});
  const savedProfile=await page.evaluate(()=>{const snapshot=data();validateProfileBackup(snapshot);applyData(snapshot);return data()});
  assert.equal(savedProfile.perfilDJ.domicilio,'Av. Prueba');assert.equal(savedProfile.perfilDJ.numeroCalle,'123');assert.equal(savedProfile.perfilDJ.unidad,'2A');assert.equal(savedProfile.perfilDJ.telefonoFijo,'0114567890');assert.equal(savedProfile.perfilDJ.celular,'3624539175');assert.equal(savedProfile.perfilDJ.nacimiento,'2000-02-29');assert.equal(savedProfile.perfilDJ.clase,'2000');assert.match(savedProfile.nombre,/Pérez/);
  assert.equal(await page.evaluate(()=>djPerfilPage2().clase),'2000');
  assert.equal(await page.locator('#perfilNacimiento').inputValue(),'29/02/2000');assert.equal(await page.locator('#perfilCelular').inputValue(),'3624539175');
  assert.ok(Math.abs((await page.locator('#perfilTituloEdicion').boundingBox()).width-12*96/2.54)<1);assert.ok((await page.locator('#perfilTituloEdicion').boundingBox()).height>42);
  for(const id of ['perfilDomicilio','perfilLocalidad','perfilTelefonoFijo','perfilClase'])assert.equal(await page.locator('#'+id).count(),1);
  await page.setViewportSize({width:1000,height:1100});await page.locator('.adc-preview-personal').screenshot({path:path.join(output,'datos-personales.png')});
  await page.evaluate(()=>adcSC01Open());
  for(const [name,value] of Object.entries({apellido:'Pérez',nombres:'Juan Pablo',calle:'Av. Prueba',numeroCalle:'123',unidad:'2A',manzana:'5',barrio:'Centro',telefonoFijo:'0114567890'}))assert.equal(await page.locator('#adcSC01Sheet [name="'+name+'"]').inputValue(),value);
  await page.evaluate(()=>tab('profile'));
  await page.evaluate(()=>{const snapshot=data();applyData({...snapshot,perfilDJ:{...snapshot.perfilDJ,nacimiento:'',clase:'1983'}})});
  assert.equal(await page.locator('#perfilNacimiento').inputValue(),'');assert.equal((await page.locator('#perfilClase').inputValue()).replace(/\D/g,''),'1983');
  assert.match(await page.locator('#perfilNacimiento').locator('..').innerText(),/1983/);
  await page.locator('#perfilNacimiento').fill('25/08/1986');
  await page.evaluate(()=>adcUserStorage.setItem('adc_v08',JSON.stringify(data())));await page.reload();
  assert.equal(await page.locator('#perfilNacimiento').inputValue(),'25/08/1986');assert.equal(await page.locator('#perfilCelular').inputValue(),'3624539175');
  assert.equal(await page.locator('#correo').inputValue(),'corregido@example.test');assert.match(await page.locator('#perfilTituloEdicion').inputValue(),/trayectorias escolares/);
  assert.equal((await page.locator('#perfilClase').inputValue()).replace(/\D/g,''),'1986');
  // Error de cierre: no navegar ni informar éxito; permitir reintento.
  await page.evaluate(()=>{window.adcAuth={configured:true,signOut:async()=>{throw Error('red de prueba')}}});
  await trigger.click();await page.locator('#adcLogoutBtn').click();
  assert.equal(page.url(),url);assert.match(await menu.locator('[role=status]').innerText(),/No se pudo cerrar/);
  assert.equal(await page.locator('#adcLogoutBtn').isEnabled(),true);
  // El adaptador existente se invoca una vez antes de volver al login.
  await page.evaluate(()=>{window.logoutCalls=0;window.adcAuth.signOut=async()=>{window.logoutCalls++;sessionStorage.setItem('test-logout-calls',String(window.logoutCalls))}});
  await page.locator('#adcLogoutBtn').click();await page.waitForURL('**/ADC_Ingreso_Editable.html');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('test-logout-calls')),'1');
  assert.equal(await page.locator('#adcLoginForm').isVisible(),true);
  // En demo, sin una sesión Supabase, también permite regresar al ingreso.
  await page.goto(url);await trigger.click();await page.locator('#adcLogoutBtn').click();await page.waitForURL('**/ADC_Ingreso_Editable.html');
  assert.deepEqual(remote,[]);assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
