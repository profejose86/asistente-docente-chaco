const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {build}=require('./build.cjs'),{readEnv}=require('./env.cjs');
const deployment=require('../config/publicacion.json'),root=path.resolve(__dirname,'..');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex').slice(0,12);
async function prepare(){
 const config=await build();
 if(config.authMode!=='supabase')throw Error('La publicación online requiere Supabase; no se publicará el modo demo.');
 const target=path.resolve(root,'dist');
 if(path.dirname(target)!==root||path.basename(target)!=='dist'||fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw Error('Destino de publicación inseguro.');
 fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target);
 const env=readEnv(root),secrets=['SUPABASE_ACCESS_TOKEN','SUPABASE_DB_PASSWORD','SUPABASE_SERVICE_ROLE_KEY','SMTP_PASSWORD'].map(key=>env[key]).filter(value=>value&&value.length>=8);
 function copy(source,destination){
  const stat=fs.lstatSync(source);if(stat.isSymbolicLink())throw Error('No se publican enlaces simbólicos: '+path.relative(root,source));
  if(stat.isDirectory()){
   fs.mkdirSync(destination,{recursive:true});for(const entry of fs.readdirSync(source)){if(entry.startsWith('.'))continue;copy(path.join(source,entry),path.join(destination,entry));}return;
  }
  const bytes=fs.readFileSync(source);if(secrets.some(secret=>bytes.includes(Buffer.from(secret))))throw Error('Se detectó una credencial privada en un recurso público.');
  fs.copyFileSync(source,destination);
 }
 copy(path.join(root,'assets'),path.join(target,'assets'));
 for(const name of ['index.html','ADC_Ingreso_Editable.html']){
  const html=fs.readFileSync(path.join(root,name),'utf8').replace(/\b(src|href)="(assets\/[^"?]+)(?:\?[^"\s]*)?"/g,(match,attribute,resource)=>{
   const asset=path.resolve(root,resource);if(!asset.startsWith(root+path.sep)||!fs.existsSync(asset))throw Error('Falta un recurso: '+resource);
   return attribute+'="'+resource+'?v='+hash(fs.readFileSync(asset))+'"';
  });
  fs.writeFileSync(path.join(target,name),html);
 }
 fs.writeFileSync(path.join(target,'.nojekyll'),'');
 fs.writeFileSync(path.join(target,'404.html'),'<!doctype html><html lang="es"><meta charset="utf-8"><title>ADC · Página no encontrada</title><h1>Página no encontrada</h1><p><a href="'+deployment.siteUrl+'">Volver a Asistente Docente Chaco</a></p></html>');
 let commit=process.env.GITHUB_SHA||null,branch=process.env.GITHUB_REF_NAME||null;
 try{commit||=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();branch||=execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();}catch{}
 const info={commit,branch,environment:'staging',authMode:config.authMode,siteUrl:deployment.siteUrl};
 fs.writeFileSync(path.join(target,'build-info.json'),JSON.stringify(info,null,2)+'\n');
 return info;
}
if(require.main===module)prepare().then(info=>console.log('Publicación preparada: '+JSON.stringify(info))).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={prepare};
