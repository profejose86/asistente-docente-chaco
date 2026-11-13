// Los servidores de prueba nunca publican .env ni usan el proyecto real.
const script='window.adcConfig=Object.freeze({authMode:"demo",supabaseUrl:"",supabaseAnonKey:"",googleAuthEnabled:false,environment:"test"});';
function serve(request,response){
 let pathname;try{pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);}catch{response.writeHead(400).end();return true;}
 if(pathname.split(/[\\/]/).some(part=>part.startsWith('.')||['node_modules','tools','supabase'].includes(part.toLowerCase()))){response.writeHead(403).end();return true;}
 if(pathname.endsWith('/assets/datos/config-publica.js')){response.setHeader('Content-Type','application/javascript');response.end(script);return true;}
 return false;
}
module.exports={script,serve};
