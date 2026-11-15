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
 const modules=[],references=[],chunks=new Map(),fileSet=new Set(files),contentHashes=new Map();
 const prefixUnsafe=[];
 function reference(file,value,kind,base=path.posix.dirname(file)){
  value=value.trim();
  if(!value||/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value))return;
  value=value.split(/[?#]/)[0];if(!value)return;
  if(value.startsWith('/'))prefixUnsafe.push({from:file,value,kind});
  try{value=decodeURIComponent(value);}catch{}
  const target=path.posix.normalize(value.startsWith('/')?value.slice(1):path.posix.join(base,value));
  references.push({from:file,to:target,kind,exists:fileSet.has(target)});
 }
 for(const file of files){
  if(['docs/arquitectura-inventario.json','docs/arquitectura-mapa.md'].includes(file))continue;
  if(file.startsWith('assets/')&&!file.startsWith('assets/vendor/')){
   const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
   if(!contentHashes.has(hash))contentHashes.set(hash,[]);contentHashes.get(hash).push(file);
  }
  if(file.startsWith('assets/vendor/'))continue;
  if(!textExtensions.has(path.extname(file)))continue;
  const source=fs.readFileSync(path.join(root,file),'utf8'),generated=file==='assets/js/servicios/supabase-runtime.js';
  if(file.endsWith('.html'))for(const match of source.replace(/<!--[\s\S]*?-->/g,'').matchAll(/<(script|link|img|a|iframe|source)\b[^>]*?\b(?:src|href)\s*=\s*(["'])(.*?)\2/gi)){
   reference(file,match[3],match[1].toLowerCase());
  }
  if(file.endsWith('.css')){
   const css=source.replace(/\/\*[\s\S]*?\*\//g,'');
   for(const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/gi))reference(file,match[1]??match[2]??match[3],'css-url');
   for(const match of css.matchAll(/@import\s+['"]([^'"]+)['"]/gi))reference(file,match[1],'css-import');
  }
  if(!generated&&/\.(?:js|cjs)$/.test(file)){
   // El catálogo y los adaptadores web resuelven estos literales desde la entrada HTML.
   if(file.startsWith('assets/'))for(const match of source.matchAll(/['"](assets\/[\w./% -]+\.(?:js|css|json|png|jpe?g|webp|svg|pdf|woff2?|ttf)(?:[?#][^'"\s]*)?)['"]/g))reference(file,match[1],'web-asset','.');
   for(const match of source.matchAll(/(?:require\(\s*|new URL\(\s*|import\(\s*)['"](\.[^'"]+)['"]/g)){
    reference(file,match[1],'literal-module');
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
  .filter(items=>items.every(item=>!item.file.startsWith('tests/')));
 const entries=['ADC_Ingreso_Editable.html','index.html'].map(file=>({file,scripts:references.filter(ref=>ref.from===file&&ref.kind==='script').map(ref=>ref.to),styles:references.filter(ref=>ref.from===file&&ref.kind==='link').map(ref=>ref.to)}));
 const missing=references.filter(ref=>!ref.exists);
 const duplicateLoads=[];
 for(const entry of entries)for(const kind of ['script','link']){
  const seen=new Set();
  for(const ref of references.filter(ref=>ref.from===entry.file&&ref.kind===kind)){
   if(seen.has(ref.to))duplicateLoads.push({from:entry.file,to:ref.to,kind});seen.add(ref.to);
  }
 }
 const caseGroups=new Map();for(const file of files){const key=file.toLowerCase();if(!caseGroups.has(key))caseGroups.set(key,[]);caseGroups.get(key).push(file);}
 const caseCollisions=[...caseGroups.values()].filter(group=>group.length>1);
 const identicalAssets=[...contentHashes.values()].filter(group=>group.length>1);
 // Una dependencia de npm o una plantilla dinámica no se etiqueta como archivo sin uso.
 return {schema:'adc-architecture-v2',exclusions:[...ignored,'.env*','assets/vendor/ (sólo inventario de nombres)'],files,entries,modules,references,missing,duplicateLoads,prefixUnsafe,caseCollisions,identicalAssets,
  duplicateWindows:{method:'Ocho líneas consecutivas normalizadas; candidatos, no equivalencia semántica ni porcentaje de cobertura.',candidates:duplicates},
  summary:{files:files.length,ownTextModules:modules.length,ownJavaScript:modules.filter(m=>/\.(js|cjs)$/.test(m.file)&&!m.generated).length,vendorFiles:files.filter(file=>file.startsWith('assets/vendor/')).length,missingLiteralReferences:missing.length,duplicateLoads:duplicateLoads.length,prefixUnsafe:prefixUnsafe.length,caseCollisions:caseCollisions.length,identicalAssetGroups:identicalAssets.length}};
}
function markdown(data){
 const lines=['# Mapa de archivos y dependencias de ADC','','Generado con `npm run architecture:audit`. Complementa la auditoría razonada en [arquitectura-auditoria.md](arquitectura-auditoria.md). El inventario JSON contiene nombres de archivos, módulos, funciones, claves de almacenamiento y referencias; no contiene datos de usuarios ni credenciales.','','## Entradas web',''];
 for(const entry of data.entries){lines.push('### '+entry.file,'','Scripts en orden de carga:','',...entry.scripts.map(file=>'- `'+file+'`'),'','Hojas de estilo en orden de carga:','',...entry.styles.map(file=>'- `'+file+'`'),'');}
 lines.push('## Módulos de código propio','','| Archivo | Líneas | Funciones con nombre | API global publicada |','| --- | ---: | ---: | --- |');
 for(const module of data.modules.filter(m=>/\.(js|cjs|py|sql)$/.test(m.file)))lines.push('| `'+module.file+'` | '+module.lines+' | '+(module.generated?'generado':module.functions.length)+' | '+module.globals.map(name=>'`'+name+'`').join(', ')+' |');
 lines.push('','## Consumidores de recursos y módulos','','| Destino | Referenciado desde |','| --- | --- |');
 const consumers=new Map();
 for(const ref of data.references){
  if(!consumers.has(ref.to))consumers.set(ref.to,new Set());
  consumers.get(ref.to).add(ref.from);
 }
 for(const [target,sources] of [...consumers].sort(([a],[b])=>a.localeCompare(b)))lines.push('| `'+target+'` | '+[...sources].map(source=>'`'+source+'`').join(', ')+' |');
 lines.push('','## Referencias literales ausentes','',...(data.missing.length?data.missing.map(ref=>'- `'+ref.from+'` → `'+ref.to+'`'):['Ninguna en el alcance del análisis.']),'','## Límites','','El grafo estático no resuelve destinos calculados, `onclick` heredados ni todos los accesos por variables. Las rutas funcionales se documentan en la auditoría; los archivos sin referencias literales no se borran automáticamente. `docs/structure-manifest.json` es una referencia histórica y no define por sí solo la arquitectura vigente.','');
 lines.push('## Integridad de rutas y recursos','','| Control | Hallazgos |','| --- | ---: |',
  '| Cargas repetidas de scripts/links por entrada | '+data.duplicateLoads.length+' |',
  '| Rutas desde la raíz incompatibles con un prefijo Pages | '+data.prefixUnsafe.length+' |',
  '| Archivos cuya ruta sólo difiere en mayúsculas | '+data.caseCollisions.length+' |',
  '| Grupos de recursos propios idénticos (SHA-256) | '+data.identicalAssets.length+' |','',
  'Se revisan atributos HTML con comillas simples/dobles, enlaces de navegación y recursos CSS (`url`/`@import`). Se excluyen comentarios y destinos externos, embebidos o fragmentos. Los recursos idénticos son candidatos de revisión, nunca una autorización de borrado. El inventario incluye todas las coincidencias de ocho líneas detectadas por este método; no demuestra equivalencia de comportamiento.','');
 return lines.join('\n');
}
if(require.main===module){
 const result=audit();
 if(!process.argv.includes('--check')){
  fs.writeFileSync(path.join(defaultRoot,'docs/arquitectura-inventario.json'),JSON.stringify(result,null,2)+'\n');
  fs.writeFileSync(path.join(defaultRoot,'docs/arquitectura-mapa.md'),markdown(result));
 }
 console.log(JSON.stringify(result.summary));
 const failures=[...result.missing,...result.duplicateLoads,...result.prefixUnsafe,...result.caseCollisions];
 if(failures.length){console.log(JSON.stringify(failures));process.exitCode=1;}
}
module.exports={audit,markdown};
