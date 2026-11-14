const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {createBridge,revision}=require('../tools/local-editor-bridge.cjs');
const contract=require('../assets/js/editor/ajustes-proyecto-datos.js');
const fixture=()=>({schema:contract.schema,pages:{ingreso:{editorSchema:contract.scopes.ingreso,operations:[{kind:'text',target:'project:#adcLoginTitle',html:'Ingreso de prueba'}],targets:{'project:#adcLoginTitle':{tag:'h2',id:'adcLoginTitle'}}}}});
test('Puente: guarda fuente, respaldo, aislamiento de pantalla, conflictos y rechazo de peticiones no autorizadas',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'adc-editor-bridge-')),origin='http://localhost:8765';
 fs.mkdirSync(path.join(root,'assets/datos'),{recursive:true});
 const target=path.join(root,'assets/datos/ajustes-pagina.json'),original=contract.empty();fs.writeFileSync(target,JSON.stringify(original));
 const server=createBridge({root});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  for(const badOrigin of [null,'https://profejose86.github.io','http://evil.example','http://localhost.evil.example:8765']){
   const r=await fetch(base+'/session',{headers:badOrigin?{Origin:badOrigin}:{}});assert.equal(r.status,403);
  }
  const request=async(payload,{token,host}={})=>fetch(base+'/commit-local',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{'X-ADC-Editor-Token':token}:{}),...(host?{Host:host}:{})},body:JSON.stringify(payload)});
  const changes=fixture(),payload={changes,expectedRevision:revision(original.pages.ingreso)};
  assert.equal((await request(payload)).status,403);
  const session=await fetch(base+'/session',{headers:{Origin:origin}}).then(r=>r.json());
  const badHost=await new Promise((resolve,reject)=>{const r=http.get(base+'/session',{headers:{Host:'attacker.example',Origin:origin}},res=>{res.resume();resolve(res.statusCode);});r.on('error',reject);});assert.equal(badHost,403);
  assert.equal((await request({...payload,file:'../../outside.html'},{token:session.token})).status,400);
  const invalid=structuredClone(payload);invalid.changes.pages.ingreso.operations[0].kind='script';
  assert.equal((await request(invalid,{token:session.token})).status,400);
  assert.deepEqual(JSON.parse(fs.readFileSync(target)),original);
  const savedResponse=await request(payload,{token:session.token});assert.equal(savedResponse.status,200);const saved=await savedResponse.json();
  assert.equal(saved.changed,true);assert.deepEqual(JSON.parse(fs.readFileSync(target)).pages.pagina,original.pages.pagina);
  assert.deepEqual(JSON.parse(fs.readFileSync(target)).pages.ingreso,changes.pages.ingreso);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,saved.backup))),original);
  assert.equal((await request(payload,{token:session.token})).status,409);
  const repeated=await request({...payload,expectedRevision:saved.revision},{token:session.token}).then(r=>r.json());assert.equal(repeated.changed,false);
  assert.equal(fs.readdirSync(path.join(root,'.adc-tools/editor-backups')).length,1);
  const preflight=await fetch(base+'/commit-local',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,x-adc-editor-token'}});
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
  assert.equal(fs.existsSync(path.join(root,'.git')),false);
 }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});}
});
test('Puente: sólo acepta orígenes loopback explícitos',()=>{
 assert.throws(()=>createBridge({origins:['https://example.com']}));
 assert.throws(()=>createBridge({origins:['http://localhost:8765/path']}));
});
