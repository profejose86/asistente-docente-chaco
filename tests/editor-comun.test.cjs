const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
test('Editor común: saneamiento seguro, identidad/estado originales y registros aislados por pantalla',async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();await page.setContent('<main><h2 id="title" style="color:red">Título</h2><details id="details" open><summary>Sección</summary></details></main><button id="gear">Ajustes</button><aside id="panel"></aside>');
  await page.addScriptTag({content:fs.readFileSync(path.resolve(__dirname,'../assets/js/editor/comun.js'),'utf8')});
  const result=await page.evaluate(()=>{
   const panel=document.getElementById('panel'),gear=document.getElementById('gear'),title=document.getElementById('title'),details=document.getElementById('details');
   const registry=adcEditorCommon.createRegistry({panel,gear,selector:'main,h2,details,summary,button,aside'});
   const second=adcEditorCommon.createRegistry({panel,gear,selector:'main,h2,details,summary,button,aside'});
   const helpers=adcEditorCommon.createHelpers(panel),host=document.createElement('div');
   host.append(helpers.cleanHtml('<b>Dato</b><script>window.evil=1</script><a href="javascript:alert(1)" onclick="alert(1)">Malo</a><a href="https://example.test/">Bien</a><img src=x onerror=alert(1)>',false));
   const section=adcEditorCommon.makeSection({id:'new-test',title:'Nueva',fold:true,open:true},registry.register);
   return {html:host.innerHTML,script:!!host.querySelector('script'),event:!!host.querySelector('[onclick]'),bad:host.querySelector('a').hasAttribute('href'),good:host.querySelectorAll('a')[1].getAttribute('href'),originalStyle:registry.originals.get(title),originalOpen:registry.originalDetailsOpen.get(details),roundtrip:registry.resolve(registry.keyFor(title))===title,isolated:registry.keys!==second.keys,section:section.outerHTML,numeric:[helpers.numeric(2),helpers.numeric(Infinity),helpers.numeric('2'),helpers.numeric(5001)],rect:adcEditorCommon.rect(2,3,4,5)};
  });
  assert.equal(result.script,false);assert.equal(result.event,false);assert.equal(result.bad,false);assert.equal(result.good,'https://example.test/');assert.match(result.html,/<b>Dato<\/b>/);
  assert.equal(result.originalStyle,'color:red');assert.equal(result.originalOpen,true);assert.equal(result.roundtrip,true);assert.equal(result.isolated,true);assert.match(result.section,/<details[^>]*open/);assert.deepEqual(result.numeric,[true,false,false,false]);assert.deepEqual(result.rect,{left:2,top:3,width:4,height:5,right:6,bottom:8});
 }finally{await browser.close();}
});
