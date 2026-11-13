// Lee una exportación revisable y reemplaza únicamente su pantalla en el registro.
const fs=require('node:fs'),path=require('node:path');
const contract=require('../assets/js/editor/ajustes-proyecto-datos.js');
const root=path.resolve(__dirname,'..');
function incorporate(file,{check=false}={}){
  const source=path.resolve(file);
  if(fs.statSync(source).size>12e6)throw Error('La exportación supera los 12 MB.');
  const incoming=contract.validate(JSON.parse(fs.readFileSync(source,'utf8').replace(/^\uFEFF/,'')));
  const target=path.join(root,'assets/datos/ajustes-pagina.json');
  if(fs.lstatSync(target).isSymbolicLink())throw Error('El registro de ajustes no puede ser un enlace.');
  const document=contract.validate(JSON.parse(fs.readFileSync(target,'utf8')));
  for(const [scope,page] of Object.entries(incoming.pages))document.pages[scope]=page;
  contract.validate(document);
  const summary=Object.entries(incoming.pages).map(([scope,page])=>({pantalla:scope,ajustes:page.operations.length}));
  if(!check){
    const temporary=target+'.tmp';
    fs.writeFileSync(temporary,JSON.stringify(document,null,2)+'\n',{encoding:'utf8',flag:'wx'});
    try{fs.renameSync(temporary,target);}catch(error){fs.unlinkSync(temporary);throw error;}
  }
  return summary;
}
if(require.main===module){
  try{
    const args=process.argv.slice(2),check=args.includes('--check'),files=args.filter(arg=>arg!=='--check');
    if(files.length!==1)throw Error('Uso: node tools/importar-ajustes.cjs "ruta/al/archivo.json" [--check]');
    const summary=incorporate(files[0],{check});
    console.log(check?'Exportación válida. Sin escribir archivos.':'Ajustes incorporados localmente. No se hizo commit ni push.');
    console.log(JSON.stringify(summary));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={incorporate};
