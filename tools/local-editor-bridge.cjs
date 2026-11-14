const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const defaultRoot=path.resolve(__dirname,'..'),limit=12e6;
const {fail,saveLayout,revision}=require('./ajustes-store.cjs');
function createBridge({root=defaultRoot,origins=['http://localhost:8765','http://127.0.0.1:8765']}={}){
 const allowed=new Set(origins.map(origin=>{
  const url=new URL(origin);if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.protocol!=='http:'||url.origin!==origin)throw Error('El origen debe ser HTTP local sin ruta.');return origin;
 }));
 const tokens=new Map();
 const server=http.createServer(async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  try{
   const port=server.address().port;
   if(!['127.0.0.1:'+port,'localhost:'+port,'[::1]:'+port].includes(req.headers.host))fail(403,'Host no permitido.');
   const origin=req.headers.origin;
   if(!allowed.has(origin))fail(403,'Origen no permitido. Abrí ADC en localhost.');
   res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
   if(req.method==='OPTIONS'){
    res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, X-ADC-Editor-Token');res.setHeader('Access-Control-Max-Age','300');return send(204,{});
   }
   if(req.url==='/session'&&req.method==='GET'){
    if(!tokens.has(origin))tokens.set(origin,crypto.randomBytes(32).toString('hex'));
    return send(200,{token:tokens.get(origin),project:'ADC',automaticGitCommit:false});
   }
   if(req.url!=='/commit-local'||req.method!=='POST')fail(404,'Endpoint no encontrado.');
   const token=req.headers['x-adc-editor-token'];if(typeof token!=='string'||token!==tokens.get(origin))fail(403,'Conectá el editor local antes de guardar.');
   if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))fail(415,'Se requiere application/json.');
   if(Number(req.headers['content-length'])>limit)fail(413,'Los ajustes superan los 12 MB.');
   let bytes=0,chunks=[];
   for await(const chunk of req){bytes+=chunk.length;if(bytes>limit)fail(413,'Los ajustes superan los 12 MB.');chunks.push(chunk);}
   let payload;try{payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail(400,'JSON inválido.');}
   if(!payload||Array.isArray(payload)||Object.keys(payload).some(key=>!['changes','expectedRevision'].includes(key))||!/^[a-f0-9]{64}$/.test(payload.expectedRevision||''))fail(400,'Solicitud de ajustes inválida.');
   let result;try{result=saveLayout(root,payload.changes,payload.expectedRevision);}catch(error){if(!error.status)error.status=400;throw error;}
   send(200,{ok:true,...result,message:'Guardado en los archivos locales. No se hizo git commit ni push.'});
  }catch(error){if(!res.headersSent)send(error.status||500,{ok:false,message:error.status?error.message:'No se pudo guardar. Revisá los permisos del proyecto.'});}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;
 return server;
}
if(require.main===module){
 const origins=(process.env.ADC_EDITOR_ORIGINS||'http://localhost:8765,http://127.0.0.1:8765').split(',').map(s=>s.trim());
 const server=createBridge({origins});server.on('error',error=>{console.error('Puente ADC: '+error.message);process.exitCode=1;});
 server.listen(3005,'127.0.0.1',()=>console.log('Puente ADC: http://localhost:3005/commit-local. Sólo guarda ajustes visuales; sin commit ni push.'));
}
module.exports={createBridge,saveLayout,revision};
