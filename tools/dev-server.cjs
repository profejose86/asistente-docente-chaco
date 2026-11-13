const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {build}=require('./build.cjs');
const root=path.resolve(__dirname,'..');
async function start(){
  await build();
  const port=Number(process.env.PORT||8765);
  const server=http.createServer((req,res)=>{
    let requested;try{requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return res.writeHead(400).end();}
    const segments=requested.split(/[\\/]/).filter(Boolean);
    if(segments.some(part=>part.startsWith('.')||['node_modules','tools','tests','supabase'].includes(part.toLowerCase())))return res.writeHead(403).end();
    const file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
    if(!file.startsWith(root+path.sep)||!['.html','.js','.mjs','.css','.json','.png','.jpg','.jpeg','.webp','.svg','.pdf','.ttf','.woff','.woff2','.pfb','.wasm'].includes(path.extname(file)))return res.writeHead(403).end();
    let resolved;try{resolved=fs.realpathSync(file);}catch{return res.writeHead(404).end();}
    if(!resolved.toLowerCase().startsWith(root.toLowerCase()+path.sep))return res.writeHead(403).end();
    fs.readFile(resolved,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.pdf':'application/pdf','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(data);});
  });
  server.listen(port,'127.0.0.1',()=>console.log('ADC staging local: http://127.0.0.1:'+port+'/ADC_Ingreso_Editable.html'));
}
start().catch(error=>{console.error(error.message);process.exitCode=1;});
