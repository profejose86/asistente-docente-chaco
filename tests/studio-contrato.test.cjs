const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const contract=require('../assets/js/editor/ajustes-proyecto-datos.js'),{persistChanges,revision}=require('../tools/ajustes-store.cjs');
const fixture=()=>({schema:contract.schema,pages:{ingreso:{editorSchema:contract.scopes.ingreso,targets:{'project:#adcLoginCanvas':{tag:'main',id:'adcLoginCanvas'}},operations:[
 {kind:'theme',target:'project:#adcLoginCanvas',primary:'#345678',accent:'#d9822b',stamp:'1794650400000'},
 {kind:'studioGuide',target:'project:#adcLoginCanvas',id:'new-guide',axis:'x',left:200,top:100,length:400},
 {kind:'preset',target:'project:#adcLoginCanvas',id:'new-alert',variant:'alert',title:'Aviso',body:'Verificar'},
 {kind:'duplicate',target:'new-alert',id:'new-copy'},
 {kind:'placeholder',target:'new-alert',text:'Ejemplo'},
 {kind:'labelText',target:'new-alert',text:'Apellido'},
 {kind:'studioFormat',target:'new-alert',backgroundColor:'#2453a3',borderWidth:'1px',fontFamily:'Arial',fontSize:'14px'},
 {kind:'studioLayer',target:'new-alert',direction:'front',level:600},
 {kind:'studioLock',target:'new-alert',locked:true}
 ]}}});
test('Studio: contrato v1 conserva nuevas acciones y rechaza colores, guías y presets inválidos',()=>{
 assert.equal(contract.validate(fixture()).schema,'adc-project-layout-v1');
 for(const change of [data=>data.pages.ingreso.operations[0].primary='url(javascript:1)',data=>data.pages.ingreso.operations[0].stamp=123,data=>data.pages.ingreso.operations[1].axis='z',data=>data.pages.ingreso.operations[1].length=10,data=>data.pages.ingreso.operations[2].variant='script']){const data=fixture();change(data);assert.throws(()=>contract.validate(data));}
});
test('Studio: guardado fuente y recuperación conservan tema, guía, preset, copia y la otra pantalla',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'adc-studio-store-'));fs.mkdirSync(path.join(root,'assets/datos'),{recursive:true});const target=path.join(root,'assets/datos/ajustes-pagina.json'),initial=contract.empty();fs.writeFileSync(target,JSON.stringify(initial));
 try{const data=fixture(),result=persistChanges(root,data,{expectedRevision:revision(initial.pages.ingreso),singleScope:true});assert.equal(result.changed,true);const recovered=contract.validate(JSON.parse(fs.readFileSync(target)));assert.deepEqual(recovered.pages.ingreso,data.pages.ingreso);assert.deepEqual(recovered.pages.pagina,initial.pages.pagina);}finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('Studio avanzado: contrato rechaza CSS activo, capas y candados invalidos',()=>{
 for(const op of [{kind:'studioFormat',backgroundColor:'url(https://example.org)'},{kind:'studioFormat',fontFamily:'Arial;display:none'},{kind:'studioLayer',direction:'other',level:1},{kind:'studioLock',locked:'false'},{kind:'placeholder',text:42}]){const data=fixture();data.pages.ingreso.operations.push({target:'new-alert',...op});assert.throws(()=>contract.validate(data));}
});
