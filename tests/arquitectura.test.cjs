const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {audit}=require('../tools/auditar-arquitectura.cjs');
const root=path.resolve(__dirname,'..');
test('Arquitectura: referencias presentes, dependencias comunes antes de consumidores y secretos excluidos',()=>{
 const result=audit();assert.deepEqual(result.missing,[]);
 for(const entry of result.entries){
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
