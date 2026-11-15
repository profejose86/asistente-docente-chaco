const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'..');

test('Perfil normal: distribución, nacimiento, celular, respaldo y precarga de documentos',async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  const base='https://adc-profile.example/adc/';
  await page.route(base+'**',route=>{
   const file=decodeURIComponent(new URL(route.request().url()).pathname.slice(5));
   if(file==='assets/datos/config-publica.js')return route.fulfill({contentType:'application/javascript',body:require('./support/demo-config.cjs').script});
   const absolute=path.resolve(root,file);
   return absolute.startsWith(root+path.sep)&&fs.existsSync(absolute)?route.fulfill({path:absolute}):route.abort();
  });
  await page.goto(base+'index.html?adc-preview=1');
  const personal=page.locator('#profile > section').first();
  assert.equal(await page.locator('#perfilClase').getAttribute('type'),'hidden');
  assert.equal(await page.locator('#perfilNacimiento').getAttribute('placeholder'),'dd/mm/aaaa');
  assert.equal(await page.locator('#perfilCelular').getAttribute('type'),'tel');
  for(const [id,label] of [['sexo','Sexo'],['correo','Correo electrónico'],['perfilCelular','Celular']])assert.match(await page.locator('#'+id).locator('..').innerText(),new RegExp('^'+label));
  const rows=[['perfilApellidos','perfilNombres','dni'],['perfilNacimiento','sexo'],['correo','perfilCelular'],['perfilTituloEdicion','perfilRegistro'],['perfilAntiguedadVista','perfilInicioActividad'],['perfilDomicilio','perfilNumeroCalle'],['perfilUnidad','perfilManzana','perfilBarrio'],['perfilLocalidad','perfilCodigoPostal','perfilDepartamento']];
  for(const width of [320,390,768,900,1440]){
   await page.setViewportSize({width,height:1100});
   for(const theme of ['light','dark']){
    await page.locator('html').evaluate((node,value)=>node.dataset.theme=value,theme);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    for(const row of rows){
     const boxes=await Promise.all(row.map(id=>page.locator('#'+id).boundingBox()));
     assert.ok(boxes.every(box=>box.height===42));
     if(width>=768)assert.ok(boxes.every(box=>Math.abs(box.y-boxes[0].y)<1),row.join(','));
    }
   }
  }
  await page.locator('#perfilApellidos').fill('Pérez');await page.locator('#perfilNombres').fill('Ana');await page.locator('#dni').fill('30123456');
  await page.locator('#perfilNacimiento').fill('31/02/1986');assert.equal(await page.locator('#perfilNacimiento').evaluate(node=>node.checkValidity()),false);
  await page.locator('#perfilNacimiento').fill('29/02/2000');assert.equal(await page.locator('#perfilNacimiento').evaluate(node=>node.checkValidity()),true);
  assert.equal(await page.evaluate(()=>djPerfilPage2().clase),'2000');
  await page.evaluate(async()=>{window.adcAuth={configured:true,ready:Promise.resolve(),user:async()=>({id:'test',email:'cuenta@example.test'})};await adcPrefillAccountEmail()});
  assert.equal(await page.locator('#correo').inputValue(),'cuenta@example.test');
  await page.locator('#correo').fill('corregido@example.test');await page.evaluate(()=>adcPrefillAccountEmail());
  assert.equal(await page.locator('#correo').inputValue(),'corregido@example.test');
  const title='Profesor de Educación Secundaria en Ciencias de la Educación con orientación en acompañamiento de trayectorias escolares';
  for(const [id,value] of Object.entries({perfilCelular:'3624539175',perfilTituloEdicion:title,perfilRegistro:'1234',perfilOtorgado:'Instituto docente',perfilAntiguedadVista:'8',perfilDomicilio:'Av. Prueba',perfilNumeroCalle:'123',perfilUnidad:'2A',perfilManzana:'5',perfilBarrio:'Centro',perfilLocalidad:'Resistencia'}))await page.locator('#'+id).fill(value);
  await page.evaluate(()=>{document.getElementById('perfilTelefonoFijo').value='0114567890';adcPreviewRefreshProfile();save()});
  const snapshot=await page.evaluate(()=>{const value=data();validateProfileBackup(value);applyData(value);return data()});
  assert.equal(snapshot.perfilDJ.nacimiento,'2000-02-29');assert.equal(snapshot.perfilDJ.clase,'2000');assert.equal(snapshot.perfilDJ.celular,'3624539175');
  assert.equal(snapshot.perfilDJ.telefonoFijo,'0114567890');assert.equal(snapshot.perfilDJ.titulo,title);
  assert.ok(Math.abs((await page.locator('#perfilTituloEdicion').boundingBox()).width-12*96/2.54)<1);
  assert.ok((await page.locator('#perfilTituloEdicion').boundingBox()).height>42);
  await page.reload();assert.equal(await page.locator('#perfilNacimiento').inputValue(),'29/02/2000');
  assert.equal(await page.locator('#perfilCelular').inputValue(),'3624539175');assert.equal(await page.locator('#perfilTituloEdicion').inputValue(),title);
  assert.equal(await page.locator('#correo').inputValue(),'corregido@example.test');
  await page.evaluate(()=>adcSC01Open());
  for(const [key,value] of Object.entries({apellido:'Pérez',nombres:'Ana',calle:'Av. Prueba',numeroCalle:'123',unidad:'2A',manzana:'5',barrio:'Centro',telefonoFijo:'0114567890'}))assert.equal(await page.locator(`#adcSC01Sheet [name="${key}"]`).inputValue(),value);
  await page.evaluate(()=>{tab('profile');const old=data();applyData({...old,perfilDJ:{...old.perfilDJ,nacimiento:'',clase:'1983'}})});
  assert.equal(await page.locator('#perfilNacimiento').inputValue(),'');assert.match(await page.locator('#perfilNacimiento').locator('..').innerText(),/1983/);
  assert.equal(await page.evaluate(()=>djPerfilPage2().clase),'1983');
  assert.equal(await page.evaluate(()=>new Set([...document.querySelectorAll('[id]')].map(node=>node.id)).size===document.querySelectorAll('[id]').length),true);
  const output=path.join(root,'.adc-tools/perfil-normal');fs.mkdirSync(output,{recursive:true});
  for(const width of [390,1440]){await page.setViewportSize({width,height:1100});await personal.screenshot({path:path.join(output,width+'.png')});}
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
