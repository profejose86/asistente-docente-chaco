// Inventario reproducible del código propio. Nunca lee .env, perfiles ni respaldos.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const defaultRoot=path.resolve(__dirname,'..');
const ignored=new Set(['.git','.adc-tools','node_modules','dist','tmp','output','materiales']);
const textExtensions=new Set(['.js','.cjs','.css','.html','.json','.md','.sql','.yml','.cmd','.py']);
function audit(root=defaultRoot){
 const files=[];
 function walk(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
   if(ignored.has(entry.name)||entry.name.startsWith('.env'))continue;
   const absolute=path.join(directory,entry.name);if(entry.isSymbolicLink())continue;
   if(entry.isDirectory())walk(absolute);else files.push(path.relative(root,absolute).replaceAll(path.sep,'/'));
  }
 }
 walk(root);
 const modules=[],references=[],chunks=new Map();
 for(const file of files){
  if(['docs/arquitectura-inventario.json','docs/arquitectura-mapa.md'].includes(file))continue;
  if(file.startsWith('assets/vendor/'))continue;
  if(!textExtensions.has(path.extname(file)))continue;
  const source=fs.readFileSync(path.join(root,file),'utf8'),generated=file==='assets/js/servicios/supabase-runtime.js';
  if(file.endsWith('.html'))for(const match of source.matchAll(/<(script|link|img)\b[^>]*\b(?:src|href)="([^"]+)"/g)){
   const value=match[2].split(/[?#]/)[0];if(/^(?:https?:|data:|#)/.test(value))continue;
   const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),value));
   references.push({from:file,to:target,kind:match[1],exists:files.includes(target)});
  }
  if(!generated&&/\.(?:js|cjs)$/.test(file)){
   for(const match of source.matchAll(/(?:require\(\s*|new URL\(\s*|import\(\s*)['"](\.[^'"]+)['"]/g)){
    const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));
    references.push({from:file,to:target,kind:'literal-module',exists:files.includes(target)});
   }
   const lines=source.split(/\r?\n/);
   for(let i=0;i<=lines.length-8;i++){
    const normalized=lines.slice(i,i+8).map(line=>line.trim()).join('\n');
    if(normalized.length<180)continue;
    const key=crypto.createHash('sha256').update(normalized).digest('hex');
    if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push({file,line:i+1});
   }
  }
  modules.push({file,bytes:Buffer.byteLength(source),lines:source.split(/\r?\n/).length,generated,
   functions:generated?[]:[...source.matchAll(/\b(?:async\s+)?function\s+([\w$]+)\s*\(/g)].map(match=>match[1]),
   globals:generated?[]:[...new Set([...source.matchAll(/window\.([\w$]+)\s*=/g)].map(match=>match[1]))],
   storageKeys:generated?[]:[...new Set([...source.matchAll(/(?:getItem|setItem|removeItem)\(['"]([^'"]+)['"]/g)].map(match=>match[1]))]
  });
 }
 const duplicates=[...chunks.values()].filter(items=>new Set(items.map(item=>item.file)).size>1)
  .filter(items=>items.every(item=>!item.file.startsWith('tests/'))).slice(0,80);
 const entries=['ADC_Ingreso_Editable.html','index.html'].map(file=>({file,scripts:references.filter(ref=>ref.from===file&&ref.kind==='script').map(ref=>ref.to),styles:references.filter(ref=>ref.from===file&&ref.kind==='link').map(ref=>ref.to)}));
 const missing=references.filter(ref=>!ref.exists);
 // Una dependencia de npm o una plantilla dinámica no se etiqueta como archivo sin uso.
 return {schema:'adc-architecture-v1',exclusions:[...ignored,'.env*','assets/vendor/ (sólo inventario de nombres)'],files,entries,modules,references,missing,
  duplicateWindows:{method:'Ocho líneas consecutivas normalizadas; candidatos, no equivalencia semántica ni porcentaje de cobertura.',candidates:duplicates},
  summary:{files:files.length,ownTextModules:modules.length,ownJavaScript:modules.filter(m=>/\.(js|cjs)$/.test(m.file)&&!m.generated).length,vendorFiles:files.filter(file=>file.startsWith('assets/vendor/')).length,missingLiteralReferences:missing.length}};
}
function markdown(data){
 const lines=['# Mapa de archivos y dependencias de ADC','','Generado con `npm run architecture:audit`. Complementa la auditoría razonada en [arquitectura-auditoria.md](arquitectura-auditoria.md). El inventario JSON contiene nombres de archivos, módulos, funciones, claves de almacenamiento y referencias; no contiene datos de usuarios ni credenciales.','','## Entradas web',''];
 for(const entry of data.entries){lines.push('### '+entry.file,'','Scripts en orden de carga:','',...entry.scripts.map(file=>'- `'+file+'`'),'','Hojas de estilo en orden de carga:','',...entry.styles.map(file=>'- `'+file+'`'),'');}
 lines.push('## Módulos de código propio','','| Archivo | Líneas | Funciones con nombre |','| --- | ---: | ---: |');
 for(const module of data.modules.filter(m=>/\.(js|cjs|py|sql)$/.test(m.file)))lines.push('| `'+module.file+'` | '+module.lines+' | '+(module.generated?'generado':module.functions.length)+' |');
 lines.push('','## Referencias literales ausentes','',...(data.missing.length?data.missing.map(ref=>'- `'+ref.from+'` → `'+ref.to+'`'):['Ninguna en el alcance del análisis.']),'','## Límites','','El grafo estático no resuelve destinos calculados, `onclick` heredados ni todos los accesos por variables. Las rutas funcionales se documentan en la auditoría; los archivos sin referencias literales no se borran automáticamente. `docs/structure-manifest.json` es una referencia histórica y no define por sí solo la arquitectura vigente.','');
 return lines.join('\n');
}
if(require.main===module){
 const result=audit();
 if(!process.argv.includes('--check')){
  fs.writeFileSync(path.join(defaultRoot,'docs/arquitectura-inventario.json'),JSON.stringify(result,null,2)+'\n');
  fs.writeFileSync(path.join(defaultRoot,'docs/arquitectura-mapa.md'),markdown(result));
 }
 console.log(JSON.stringify(result.summary));
 if(result.missing.length){console.log(JSON.stringify(result.missing));process.exitCode=1;}
}
module.exports={audit,markdown};
