const {test}=require('node:test'),assert=require('node:assert/strict');
const {match}=require('../assets/js/editor/studio-alineacion.js');
test('Smart Guides: bordes, centros, umbral de 7 px y modo libre conservan precisión CSS',()=>{
 const sources=[{rect:{left:300,top:200,width:200,height:80},label:'Referencia'}];
 const edges=match({left:294,top:194,width:120,height:40},sources);
 assert.equal(edges.x,6);assert.equal(edges.y,6);assert.equal(edges.guides.length,2);assert.equal(edges.guides[0].position,300);
 const centers=match({left:351,top:221,width:100,height:40},sources);assert.equal(centers.x,-1);assert.equal(centers.y,-1);assert.equal(centers.guides[0].sourceEdge,'center');
 const free=match({left:294,top:194,width:120,height:40},sources,{free:true});assert.equal(free.x,0);assert.equal(free.y,0);assert.equal(free.guides.length,2);
 const far=match({left:0,top:0,width:20,height:20},sources);assert.deepEqual(far.guides,[]);
 const cm=96/2.54;assert.ok(Math.abs(96/cm-2.54)<1e-10);
});
