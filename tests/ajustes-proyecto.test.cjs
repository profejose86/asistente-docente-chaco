const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const contract=require('../assets/js/editor/ajustes-proyecto-datos.js');
const fixture=()=>({schema:contract.schema,pages:{ingreso:{editorSchema:contract.scopes.ingreso,operations:[{kind:'style',target:'project:#adcLoginTitle',color:'#123456'}],targets:{'project:#adcLoginTitle':{tag:'h2',id:'adcLoginTitle'}}}}});
test('Contrato: referencias estables, medidas y acciones permitidas',()=>{
  assert.equal(contract.validate(fixture()).pages.ingreso.operations.length,1);
  for(const change of [op=>op.target='base-1',op=>op.kind='script',op=>op.width=6000,op=>op.onclick='evil']){
    const data=fixture();change(data.pages.ingreso.operations[0]);assert.throws(()=>contract.validate(data));
  }
  const data=fixture();delete data.pages.ingreso.targets['project:#adcLoginTitle'];assert.throws(()=>contract.validate(data));
});
test('Importador: incorpora una pantalla, conserva la otra y permite comprobar sin escribir',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'adc-layout-import-'));
  try{
    for(const file of ['tools/importar-ajustes.cjs','assets/js/editor/ajustes-proyecto-datos.js','assets/datos/ajustes-pagina.json']){
      fs.mkdirSync(path.dirname(path.join(temp,file)),{recursive:true});fs.copyFileSync(path.join(root,file),path.join(temp,file));
    }
    const input=path.join(temp,'export.json'),target=path.join(temp,'assets/datos/ajustes-pagina.json');fs.writeFileSync(input,JSON.stringify(fixture()));
    const before=fs.readFileSync(target,'utf8');
    const run=(...args)=>spawnSync(process.execPath,[path.join(temp,'tools/importar-ajustes.cjs'),input,...args],{encoding:'utf8'});
    assert.equal(run('--check').status,0);assert.equal(fs.readFileSync(target,'utf8'),before);
    assert.equal(run().status,0);const saved=JSON.parse(fs.readFileSync(target,'utf8'));
    assert.deepEqual(saved.pages.pagina,JSON.parse(before).pages.pagina);assert.deepEqual(saved.pages.ingreso,fixture().pages.ingreso);
    fs.writeFileSync(input,'{}');assert.equal(run().status,1);assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),saved);
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('Chrome: carga, exportación, deshacer, borrador prioritario y recuperación',async()=>{
  const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/assets/datos/ajustes-pagina.json',route=>route.fulfill({json:fixture()}));
    const url=`http://127.0.0.1:${server.address().port}/ADC_Ingreso_Editable.html`;
    await page.goto(url);await page.waitForFunction(()=>document.querySelector('#adcLoginTitle').style.color==='rgb(18, 52, 86)');
    await page.locator('#adcDesignGear').click();
    const download=page.waitForEvent('download');await page.locator('[data-project-export]').click();
    const data=contract.validate(JSON.parse(fs.readFileSync(await (await download).path(),'utf8')));
    assert.deepEqual(data.pages.ingreso,fixture().pages.ingreso);
    assert.equal(await page.evaluate(()=>{
      const form=document.createElement('section');form.id='adcOfficialForm';form.dataset.adcFormId='dp01';
      const field=document.createElement('input');field.id='sharedField';form.append(field);document.body.append(form);
      const description=adcProjectLayout.describe(field);
      const correct=adcProjectLayout.resolve(description.reference,description.identity)===field;
      form.dataset.adcFormId='otro';
      const isolated=adcProjectLayout.resolve(description.reference,description.identity)===null;
      form.remove();return correct&&isolated;
    }),true);
    await page.locator('[data-act=undo]').click();assert.equal(await page.locator('#adcLoginTitle').evaluate(node=>node.style.color),'');
    await page.locator('[data-act=redo]').click();assert.equal(await page.locator('#adcLoginTitle').evaluate(node=>node.style.color),'rgb(18, 52, 86)');
    await page.evaluate(()=>{localStorage.setItem('adc-login-design-draft',JSON.stringify({schema:'adc-login-design-v1',operations:[]}));localStorage.setItem('adc-profile-test','conservar');});
    await page.reload();await page.waitForSelector('[data-project-export]',{state:'attached'});
    assert.equal(await page.locator('#adcLoginTitle').evaluate(node=>node.style.color),'');
    await page.locator('#adcDesignGear').click();await page.getByRole('button',{name:'Usar ajustes del proyecto',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#adcLoginTitle').style.color==='rgb(18, 52, 86)');
    await page.locator('#adcDesignGear').click();await page.getByRole('button',{name:'Recuperar borrador anterior',exact:true}).click();
    await page.waitForFunction(()=>localStorage.getItem('adc-login-design-draft')!==null);
    assert.equal(await page.evaluate(()=>localStorage.getItem('adc-profile-test')),'conservar');
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
