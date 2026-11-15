const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createServer}=require('../tools/dev-server.cjs');

test('Servidor local: sólo entradas y assets públicos, incluso al resolver enlaces',async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'adc-dev-server-'));
  const server=createServer(directory);
  try{
    fs.mkdirSync(path.join(directory,'assets'));
    fs.mkdirSync(path.join(directory,'config'));
    fs.mkdirSync(path.join(directory,'assets','.private'));
    fs.writeFileSync(path.join(directory,'index.html'),'inicio');
    fs.writeFileSync(path.join(directory,'ADC_Ingreso_Editable.html'),'ingreso');
    fs.writeFileSync(path.join(directory,'assets','app.js'),'window.demo=true;');
    fs.writeFileSync(path.join(directory,'config','internal.json'),'interno');
    fs.writeFileSync(path.join(directory,'assets','.private','data.json'),'privado');
    fs.symlinkSync(path.join(directory,'config'),path.join(directory,'assets','linked'),'junction');
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base='http://127.0.0.1:'+server.address().port;
    for(const route of ['/','/index.html','/ADC_Ingreso_Editable.html','/assets/app.js?v=1']){
      const response=await fetch(base+route);
      assert.equal(response.status,200,route);
      assert.equal(response.headers.get('x-content-type-options'),'nosniff');
      await response.text();
    }
    for(const route of ['/config/internal.json','/package.json','/docs/structure-manifest.json','/.env','/assets/.private/data.json','/assets/linked/internal.json','/assets/%2eprivate/data.json','/assets/%2e%2e/config/internal.json']){
      const response=await fetch(base+route);
      assert.equal(response.status,403,route);
      await response.text();
    }
    assert.equal((await fetch(base+'/assets/missing.js')).status,404);
  }finally{
    await new Promise(resolve=>server.close(resolve));
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
