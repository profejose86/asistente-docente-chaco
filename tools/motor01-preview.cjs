// Servidor demo en loopback. No compila, no escribe configuración ni usa Supabase.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {createServer}=require('./dev-server.cjs');
const {serve,script}=require('../tests/support/demo-config.cjs');
const materialesDir=path.resolve(__dirname,'../materiales');

function serveMateriales(req,res){
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/adc/__vpi-materiales/manifest.json'){
    let files=[];
    if(fs.existsSync(materialesDir)){
      files=fs.readdirSync(materialesDir,{withFileTypes:true})
        .filter(entry=>entry.isFile()&&!entry.isSymbolicLink()&&/\.pdf$/i.test(entry.name))
        .map(entry=>entry.name)
        .sort((a,b)=>a.localeCompare(b,'es'))
        .map(name=>({name,size:fs.statSync(path.join(materialesDir,name)).size,url:'__vpi-materiales/file/'+encodeURIComponent(name)}));
    }
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.end(JSON.stringify({files}));
    return true;
  }
  const prefix='/adc/__vpi-materiales/file/';
  if(pathname.startsWith(prefix)){
    if(!fs.existsSync(materialesDir))return res.writeHead(404).end(),true;
    let name;try{name=decodeURIComponent(pathname.slice(prefix.length));}catch{return res.writeHead(400).end(),true;}
    if(!name||path.basename(name)!==name||!/\.pdf$/i.test(name))return res.writeHead(403).end(),true;
    const target=path.resolve(materialesDir,name);
    let resolved;try{resolved=fs.realpathSync(target);}catch{return res.writeHead(404).end(),true;}
    if(!resolved.startsWith(materialesDir+path.sep))return res.writeHead(403).end(),true;
    fs.readFile(resolved,(error,data)=>{
      if(error)return res.writeHead(404).end();
      res.setHeader('Content-Type','application/pdf');
      res.setHeader('Cache-Control','no-store');
      res.setHeader('X-Content-Type-Options','nosniff');
      res.end(data);
    });
    return true;
  }
  return false;
}

function createMotor01Server(){
  const normal=createServer().listeners('request')[0];
  return http.createServer((req,res)=>{
    if(!req.url.startsWith('/adc/'))return res.writeHead(404).end();
    if(new URL(req.url,'http://localhost').pathname==='/adc/assets/datos/config-publica.js'){
      res.setHeader('Content-Type','application/javascript');res.setHeader('Cache-Control','no-store');
      return res.end(script.replace('});',',motor01Pilot:true});'));
    }
    if(serveMateriales(req,res))return;
    if(serve(req,res))return;
    req.url=req.url.slice(4);normal(req,res);
  });
}
if(require.main===module){
  const server=createMotor01Server();
  server.on('error',error=>{console.error(error.message);process.exitCode=1});
  server.listen(8912,'127.0.0.1',()=>console.log('Prueba local con datos ficticios: http://127.0.0.1:8912/adc/index.html?adc-preview=1&adc-motor01=incapacidad'));
}
module.exports={createMotor01Server};
