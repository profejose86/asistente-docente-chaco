const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={window:{}};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/tramites/busqueda-inteligente.js'),'utf8'),context);
const engine=context.window.adcMBITSearch;
const sample=[{id:'bd01',code:'BD-01',title:'Causal de baja',keywords:['formulario de baja'],category:'Administración'}, {id:'bd02',code:'BD-02',title:'Disposición de baja',keywords:['disposición'],category:'Administración'}, {id:'dj01',code:'DJ-01',title:'Cargos y horarios',keywords:['declaración jurada'],category:'Docentes'}];
test('MBIT normaliza códigos de todas las familias sin modificar los originales',()=>{
 for(const query of ['BD-02','BD 02','BD_02','BD02','bd02','bd-02','bd 2','BD2','formulario BD02'])assert.equal(engine.search(sample,query)[0].id,'bd02',query);
 for(const query of ['DJ-01','DJ 01','DJ_01','DJ01','dj1'])assert.equal(engine.search(sample,query)[0].id,'dj01',query);
 assert.equal(sample[1].code,'BD-02');assert.equal(engine.search(sample,'BD03').length,0);
});
test('MBIT distingue coincidencias exactas, sinónimos, parciales y errores pequeños',()=>{
 for(const query of ['DISPOSICIÓN DE BAJA','disposicion de baja','disposicion   baja','dispo','disposicon de baja'])assert.equal(engine.search(sample,query)[0].id,'bd02',query);
 assert.equal(engine.search(sample,'declaracion jurada')[0].id,'dj01');
 assert.equal(engine.search(sample,'baja').length,2);
 assert.equal(engine.search(sample,'xyzsinresultado').length,0);
 assert.equal(engine.search(sample,'disposicion de baja','Docentes').length,0);
 assert.ok(engine.rank(sample[1],'disposicion de baja')>engine.rank(sample[1],'disposicon de baja'));
 assert.equal(engine.search([...sample,sample[1]],'baja').length,2);
 assert.equal(engine.search([{...sample[1],status:'draft'}],'BD02').length,0);
});
test('MBIT reconoce prefijos y segmentos numéricos sin cambiar filtros ni relevancia exacta',()=>{
 const records=[...sample,{id:'bd07',code:'BD-07',title:'Opción de seguros',category:'Docentes'},
  {id:'dl02',code:'DL-02',title:'Interrupción de licencia',category:'Administración'},
  {id:'long',code:'ZZ-102',title:'Otra numeración',category:'Administración'},
  {id:'hidden',code:'BD-03',title:'No publicado',status:'draft'}];
 const ids=query=>Array.from(engine.search(records,query),record=>record.id);
 for(const query of ['bd','BD','bd-0','BD_0','bd 0'])assert.deepEqual(ids(query),['bd01','bd02','bd07'],query);
 for(const query of ['bd-02','bd02','bd 02','bd_02'])assert.deepEqual(ids(query),['bd02'],query);
 assert.deepEqual(ids('bd-01'),['bd01']);
 assert.deepEqual(ids('02'),['bd02','dl02','long']);
 assert.equal(engine.search(records,'bd','Administración').length,2);
 assert.equal(engine.search(records,'bd-0','Docentes')[0].id,'bd07');
 assert.deepEqual(ids('dispo'),['bd02']);assert.deepEqual(ids('baja'),['bd01','bd02']);
 assert.equal(new Set(ids('bd')).size,ids('bd').length);
 assert.equal(records[0].code,'BD-01');
});
const runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
let playwright;try{playwright=require('playwright')}catch{try{playwright=require(path.join(runtime,'playwright'))}catch{}}
test('MBIT en Chrome: predicción, tarjetas, categorías, temas, teclado, catálogo y accesos', {skip:!playwright,timeout:120000},async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.pdf':'application/pdf'})[path.extname(file)]||'application/octet-stream');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'adc-mbit-'));
 try{
  browser=await playwright.chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
   if(route.request().url().includes('cdn.jsdelivr.net/npm/pdf-lib'))return route.fulfill({path:path.join(runtime,'pdf-lib/dist/pdf-lib.min.js'),contentType:'application/javascript'});
   return route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort();
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?adc-preview=1`);await page.waitForFunction(()=>window.adcMBIT);
  await page.evaluate(()=>tab('tramites'));
  const search=page.locator('#buscar'),cards=page.locator('#adcFormMatches>button');
  const frequent=await page.locator('#adc43Frequent').innerHTML();
  const usage=await page.evaluate(()=>localStorage.getItem('adc_v07_usage'));
  for(const query of ['bd','BD','bd-0']){
   await search.fill(query);
   assert.deepEqual((await cards.locator('.adc-mbit-code').allTextContents()).sort(),['BD-01','BD-02','BD-07']);
  }
  await search.fill('bd');await search.press('End');await search.press('-');
  assert.equal(await cards.count(),3);
  await search.press('0');assert.equal(await cards.count(),3);
  await search.press('2');assert.equal(await cards.count(),1);
  assert.equal(await cards.first().getAttribute('data-adc-official-form'),'bd02');
  await search.fill('bd-01');assert.equal(await cards.first().getAttribute('data-adc-official-form'),'bd01');
  await search.fill('02');
  const numeric=await cards.locator('.adc-mbit-code').allTextContents();
  assert.ok(numeric.includes('BD-02')&&numeric.includes('DJ-02')&&numeric.includes('DL-02'));
  assert.equal(new Set(await cards.evaluateAll(nodes=>nodes.map(node=>node.dataset.mbitId))).size,await cards.count());
  await page.locator('#categoria').selectOption('Formularios docentes');await search.fill('bd-0');
  assert.deepEqual(await cards.locator('.adc-mbit-code').allTextContents(),['BD-07']);
  await page.locator('#categoria').selectOption('Formularios para administrativos');
  assert.deepEqual((await cards.locator('.adc-mbit-code').allTextContents()).sort(),['BD-01','BD-02']);
  await page.locator('#categoria').selectOption('');
  for(const query of ['BD-02','BD 02','BD_02','BD02','bd02','bd 2','BD2']){
   await search.fill(query);assert.equal(await cards.first().getAttribute('data-adc-official-form'),'bd02');
   assert.equal(await cards.count(),1);assert.match(await page.locator('#contador').textContent(),/1 formulario encontrado/);
   assert.equal(await search.inputValue(),query);
  }
  for(const [query,code] of [['dj1','DJ-01'],['DJ 02','DJ-02'],['sc1','SC-01'],['seguros','BD-07'],['seguro','BD-07'],['disposicion de baja','BD-02'],['disposicon de baja','BD-02']]){
   await search.fill(query);assert.equal(await cards.first().locator('.adc-mbit-code').textContent(),code,query);
  }
  await search.fill('declaracion jurada');assert.equal(await cards.count(),2);
  await search.fill('baja');assert.ok(await cards.count()>=2);
  assert.equal(await cards.evaluateAll(nodes=>new Set(nodes.map(node=>node.dataset.mbitId)).size),await cards.count());
  const first=await cards.first().elementHandle();await search.fill('baja ');assert.equal(await cards.first().evaluate((node,previous)=>node===previous,first),true);
  await page.locator('#categoria').selectOption('Formularios para administrativos');assert.equal(await search.inputValue(),'baja ');
  assert.ok(await cards.count()>0);
  await page.locator('#categoria').selectOption('Permisos');assert.equal(await cards.count(),0);
  assert.equal(await page.locator('.adc-mbit-empty').isVisible(),true);
  await page.locator('#categoria').selectOption('');await search.fill('xyzsinresultado');
  assert.match(await page.locator('.adc-mbit-empty').textContent(),/No encontramos trámites ni formularios/);
  await search.fill('seguros');await search.press('Tab');
  await page.getByRole('button',{name:'Limpiar búsqueda',exact:true}).click();assert.equal(await search.inputValue(),'');
  assert.equal(await page.locator('#adc43Frequent').innerHTML(),frequent);assert.equal(await page.evaluate(()=>localStorage.getItem('adc_v07_usage')),usage);
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   for(const width of [390,1440]){
    await page.setViewportSize({width,height:1000});await search.fill('seguro');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const card=cards.first();
    assert.equal(await card.evaluate(node=>node.scrollHeight<=node.clientHeight+1),true);
    const boxes=await card.evaluate(node=>[...node.children].map(child=>{const b=child.getBoundingClientRect();return {top:b.top,bottom:b.bottom}}));
    assert.ok(boxes[0].bottom<=boxes[1].top&&boxes[1].bottom<=boxes[2].top);
    await card.focus();assert.equal(await card.evaluate(node=>node.matches(':focus-visible')),true);
    await page.screenshot({path:path.join(output,`mbit-${theme}-${width}.png`),animations:'disabled'});
   }
  }
  await page.emulateMedia({reducedMotion:'reduce'});await cards.first().hover();assert.equal(await cards.first().evaluate(node=>getComputedStyle(node).transitionDuration),'0s');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await search.hover();await cards.first().hover();
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#adcFormMatches>button')).transform!=='none');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#adcFormMatches>button')).borderColor==='rgb(141, 195, 255)');
  assert.equal(await page.evaluate(()=>{try{adcMBIT.register({id:'bd02',code:'BD-02',title:'Duplicado',open:()=>{}});return false;}catch{return true;}}),true);
  await page.evaluate(()=>{adcMBIT.register({id:'test-new',code:'ZZ-09',title:'Formulario de prueba',keywords:['prueba nueva'],category:'Formularios docentes',status:'draft',open:()=>window.testMBITOpened=true});});
  await search.fill('zz9');assert.equal(await cards.count(),0);
  await page.evaluate(()=>adcMBIT.register({id:'test-new',code:'ZZ-09',title:'Formulario de prueba',keywords:['prueba nueva'],category:'Formularios docentes',status:'published',open:()=>window.testMBITOpened=true}));
  assert.equal(await cards.count(),1);await cards.first().press('Enter');assert.equal(await page.evaluate(()=>testMBITOpened),true);
  const all=await page.evaluate(()=>adcMBIT.records().filter(record=>record.id!=='test-new').map(record=>({id:record.id,code:record.code,title:record.title})));
  for(const record of all){
   await page.evaluate(()=>tab('tramites'));await search.fill(record.code||record.title);
   const card=page.locator('#adcFormMatches>button').filter({has:page.getByText(record.title,{exact:true})}).first();
   await card.click();
   if(record.id==='dl01')assert.equal(await page.locator('#adcFormQuestion').isVisible(),true);
   else assert.equal(await page.locator('#adcTramitesMenu').evaluate(node=>node.classList.contains('hide')),true,record.id);
  }
  assert.deepEqual(errors,[]);
  console.log(`Aperturas verificadas: ${all.length}. Capturas MBIT: ${output}`);
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
