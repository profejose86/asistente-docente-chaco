// Servidor demo en loopback. No compila, no escribe configuración ni usa Supabase.
const http=require('node:http');
const {createServer}=require('./dev-server.cjs');
const {serve,script}=require('../tests/support/demo-config.cjs');
function createMotor01Server(){
  const normal=createServer().listeners('request')[0];
  return http.createServer((req,res)=>{
    if(!req.url.startsWith('/adc/'))return res.writeHead(404).end();
    if(new URL(req.url,'http://localhost').pathname==='/adc/assets/datos/config-publica.js'){
      res.setHeader('Content-Type','application/javascript');res.setHeader('Cache-Control','no-store');
      return res.end(script.replace('});',',motor01Pilot:true});'));
    }
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
