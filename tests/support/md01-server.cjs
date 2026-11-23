const {createServer}=require('../../tools/dev-server.cjs');
function createMd01Server(){
 const server=createServer(),normal=server.listeners('request')[0];server.removeAllListeners('request');
 server.on('request',(req,res)=>{
  if(!req.url.startsWith('/adc/'))return res.writeHead(404).end();
  if(require('./demo-config.cjs').serve(req,res))return;
  req.url=req.url.slice(4);normal(req,res);
 });return server;
}
module.exports={createMd01Server};
