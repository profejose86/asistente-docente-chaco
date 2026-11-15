const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {audit}=require('../tools/auditar-arquitectura.cjs');
const root=path.resolve(__dirname,'..');
test('Arquitectura: referencias presentes, dependencias comunes antes de consumidores y secretos excluidos',()=>{
 const result=audit();assert.deepEqual(result.missing,[]);
 assert.deepEqual(result.duplicateLoads,[]);assert.deepEqual(result.prefixUnsafe,[]);assert.deepEqual(result.caseCollisions,[]);
 for(const entry of result.entries){
  if(entry.file==='index.html'){
   const storage=entry.scripts.indexOf('assets/js/servicios/almacenamiento-usuario.js'),sync=entry.scripts.indexOf('assets/js/servicios/sincronizacion-usuario.js'),ui=entry.scripts.indexOf('assets/js/interfaz/sincronizacion.js');
   assert.ok(storage>=0&&storage<sync&&sync<ui&&ui<entry.scripts.indexOf('assets/js/interfaz/sesion.js'));
   assert.ok(storage<entry.scripts.indexOf('assets/js/core/estado.js'));
  }
  const motor=entry.file==='index.html'?'assets/js/editor/editor.js':'assets/js/acceso/editor.js';
  assert.ok(entry.scripts.indexOf('assets/js/editor/comun.js')>=0);
  assert.ok(entry.scripts.indexOf('assets/js/editor/comun.js')<entry.scripts.indexOf(motor));
  assert.ok(entry.scripts.indexOf('assets/js/editor/ajustes-proyecto-datos.js')<entry.scripts.indexOf('assets/js/editor/ajustes-proyecto.js'));
  const css=entry.file==='index.html'?'assets/css/editor/editor.css':'assets/css/acceso/editor.css';
  assert.ok(entry.styles.indexOf('assets/css/editor/base.css')<entry.styles.indexOf(css));
 }
 assert.ok(result.modules.every(module=>!module.file.includes('.env')));
 for(const file of ['assets/js/editor/editor.js','assets/js/acceso/editor.js']){
  const source=fs.readFileSync(path.join(root,file),'utf8');assert.match(source,/adcEditorCommon\.createRegistry/);assert.match(source,/adcEditorCommon\.createHelpers/);assert.doesNotMatch(source,/function cleanHtml\(/);
 }
 for(const file of ['tools/importar-ajustes.cjs','tools/local-editor-bridge.cjs'])assert.match(fs.readFileSync(path.join(root,file),'utf8'),/require\('\.\/ajustes-store\.cjs'\)/);
});

test('Auditoría: CSS, comillas, cargas equivalentes y prefijo Pages con recursos aislados',()=>{
 const os=require('node:os'),fixture=fs.mkdtempSync(path.join(os.tmpdir(),'adc-architecture-'));
 try{
  fs.mkdirSync(path.join(fixture,'assets'));
  fs.writeFileSync(path.join(fixture,'index.html'),`<!-- <img src="ausente.png"> --><script src='assets/app.js?v=1'></script><script src="assets/app.js?v=2"></script><link href='assets/base.css'><a href='/ADC_Ingreso_Editable.html'>Ingreso</a><img src='assets/no.png'><img src='https://example.test/image.png'>`);
  fs.writeFileSync(path.join(fixture,'ADC_Ingreso_Editable.html'),'');
  fs.writeFileSync(path.join(fixture,'assets/app.js'),`fetch('assets/falta.pdf');`);
  fs.writeFileSync(path.join(fixture,'assets/base.css'),`/* url(no-comentario.png) */ a{background:url('imagen%20uno.png')} b{background:url(data:image/png;base64,AAAA)} @import "faltante.css";`);
  fs.writeFileSync(path.join(fixture,'assets/imagen uno.png'),'imagen');
  fs.writeFileSync(path.join(fixture,'assets/copia.png'),'imagen');
  const result=audit(fixture);
  assert.deepEqual(result.missing.map(ref=>ref.to).sort(),['assets/falta.pdf','assets/faltante.css','assets/no.png']);
  assert.deepEqual(result.duplicateLoads,[{from:'index.html',to:'assets/app.js',kind:'script'}]);
  assert.deepEqual(result.prefixUnsafe,[{from:'index.html',value:'/ADC_Ingreso_Editable.html',kind:'a'}]);
  assert.ok(result.identicalAssets.some(group=>group.includes('assets/imagen uno.png')&&group.includes('assets/copia.png')));
 }finally{fs.rmSync(fixture,{recursive:true,force:true});}
});
