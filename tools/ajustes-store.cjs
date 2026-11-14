// Unica escritura del registro visual: importador y puente comparten validacion y respaldo.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const contract=require('../assets/js/editor/ajustes-proyecto-datos.js');
const limit=12e6;
const revision=page=>crypto.createHash('sha256').update(JSON.stringify(page)).digest('hex');
function fail(status,message){const error=Error(message);error.status=status;throw error;}
function safePath(root,relative){
 const base=fs.realpathSync(root),parts=relative.split('/');let current=base;
 for(const part of parts){current=path.join(current,part);if(fs.existsSync(current)&&fs.lstatSync(current).isSymbolicLink())fail(400,'No se admiten enlaces en la ruta de guardado.');}
 if(!current.startsWith(base+path.sep))fail(400,'Ruta fuera del proyecto.');return current;
}
function readLayout(root){
 const target=safePath(root,'assets/datos/ajustes-pagina.json');
 return {target,raw:fs.readFileSync(target,'utf8'),get document(){return contract.validate(JSON.parse(this.raw));}};
}
function persistChanges(root,changes,{expectedRevision,check=false,singleScope=false}={}){
 contract.validate(changes);
 const scopes=Object.keys(changes.pages);if(singleScope&&scopes.length!==1)fail(400,'Guardá una sola pantalla por vez.');
 const scope=scopes[0],current=readLayout(root),document=current.document;
 if(expectedRevision!==undefined&&revision(document.pages[scope]||contract.empty().pages[scope])!==expectedRevision)fail(409,'Esta pantalla cambió en el proyecto. Recargá y revisá los cambios antes de volver a guardar.');
 for(const name of scopes)document.pages[name]=changes.pages[name];contract.validate(document);
 const contents=JSON.stringify(document,null,2)+'\n';if(Buffer.byteLength(contents)>limit)fail(413,'El registro completo supera los 12 MB.');
 if(check||JSON.stringify(current.document)===JSON.stringify(document))return {scope,revision:scope?revision(document.pages[scope]):null,changed:false};
 const directory=safePath(root,'.adc-tools/editor-backups');fs.mkdirSync(directory,{recursive:true});
 // Verificar otra vez después de crear las carpetas y antes de escribir.
 safePath(root,'.adc-tools/editor-backups');
 const backup=path.join(directory,Date.now()+'-'+crypto.randomUUID()+'.json');
 fs.writeFileSync(backup,current.raw,{encoding:'utf8',flag:'wx'});
 const temporary=current.target+'.'+crypto.randomUUID()+'.tmp';
 try{
  fs.writeFileSync(temporary,contents,{encoding:'utf8',flag:'wx'});
  if(fs.readFileSync(current.target,'utf8')!==current.raw)fail(409,'El archivo cambió durante el guardado. Volvé a revisar.');
  fs.renameSync(temporary,current.target);
 }finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
 return {scope,revision:revision(document.pages[scope]),changed:true,file:'assets/datos/ajustes-pagina.json',backup:path.relative(root,backup).replaceAll(path.sep,'/')};
}
function saveLayout(root,changes,expectedRevision){return persistChanges(root,changes,{expectedRevision,singleScope:true});}
module.exports={revision,fail,safePath,readLayout,persistChanges,saveLayout};
