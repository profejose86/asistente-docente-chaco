const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context={window:{adcMnc:{geometry:{start:.15,end:.85,thickness:.5*72/25.4}}}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'assets/js/documentos/pdf-campos.js'),'utf8'),context);
const make=(value,setting={},marked=false)=>context.window.adcPdfOverlay.layout({
  template:{pages:[{width:612,height:1008}],fields:{dato:{x:100,top:200,width:100,height:14,...setting}}},
  fields:[{key:'dato',path:'dato',label:'Dato',type:'text'}],values:{dato:value},marked:new Set(marked?['dato']:[]),presented:(_,value)=>value,
  font:{widthOfTextAtSize:(text,size)=>text.length*size*.5}
});
test('PDF original: MNC centrada al 70% y grosor exacto de 0,5 mm',()=>{
  const result=make('',{},true),line=result.pages[0][0];
  assert.equal(line.start.x,115);assert.equal(line.end.x,185);assert.equal(line.start.y,line.end.y);
  assert.equal(line.thickness,.5*72/25.4);assert.equal(result.fields[0].y,794);
  assert.equal(make('').pages[0].length,0);
});
test('PDF original: ajuste localizado hasta 7 puntos, recuperación y aviso sin recortar',()=>{
  assert.equal(make('Corto').fields[0].size,12);
  const fitted=make('Un texto algo largo');assert.ok(fitted.fields[0].size>=7&&fitted.fields[0].size<12);
  assert.equal(make('Corto').fields[0].size,12);
  const long=make('X'.repeat(200));assert.ok(long.errors.length);assert.equal(long.pages[0].length,0);
});
test('PDF original: año impreso protegido y casilleros de códigos completos',()=>{
  const setting={dateParts:[{x:100,width:20},{x:125,width:20},{x:150,width:40}],printedYear:2009};
  assert.equal(make('2009-03-02',setting).errors.length,0);
  assert.ok(make('2026-03-02',setting).errors.length);
  const approved=make('2026-03-02',{...setting,replacePrintedYear:{x:150,top:200,width:25,height:12}});
  assert.equal(approved.errors.length,0);
  assert.equal(approved.pages[0][0].kind,'rectangle');
  assert.equal(approved.pages[0].filter(command=>command.kind==='text').length,3);
  assert.equal(approved.pages[0].at(-1).text,'2026');
  assert.equal(make('12345',{digits:5}).pages[0].length,5);
  assert.ok(make('123456',{digits:5}).errors.length);
});
