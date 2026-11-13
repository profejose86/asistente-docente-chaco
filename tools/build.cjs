const fs=require('node:fs'),path=require('node:path');
const {readEnv,publicConfig}=require('./env.cjs');
const root=path.resolve(__dirname,'..');
async function build(){
  const config=publicConfig(readEnv(root));
  await require('esbuild').build({entryPoints:[path.join(root,'assets/js/servicios/supabaseClient.js')],bundle:true,format:'iife',platform:'browser',target:['chrome110','firefox115','safari16'],outfile:path.join(root,'assets/js/servicios/supabase-runtime.js'),minify:true,legalComments:'eof'});
  fs.writeFileSync(path.join(root,'assets/datos/config-publica.js'),'// Configuración pública generada; no agregar secretos.\nwindow.adcConfig=Object.freeze('+JSON.stringify(config)+');\n');
  return config;
}
if(require.main===module)build().then(config=>console.log('ADC compilado. Modo: '+config.authMode+'; entorno: staging.')).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={build};
