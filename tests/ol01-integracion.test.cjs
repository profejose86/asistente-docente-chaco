const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const root=path.resolve(__dirname,'..');
const runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(path.join(runtime,'playwright'));
const {PDFDocument}=require(path.join(runtime,'pdf-lib'));

test('OL-01 distribuye íntegros los cinco activos aportados',()=>{
 for(const name of ['ol-01-general.pdf','ol-01-masculino.pdf','ol-01-general.png','ol-01-masculino.png','ADC-Carlito.ttf']){
  const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  assert.equal(hash(path.join(root,'assets/formularios/ol01',name)),hash(path.join(root,'OL-01/plantillas',name)),name);
 }
});

test('OL-01 en Chrome integra perfil, escuelas, licencias, MNC y las dos plantillas PDF',{timeout:90000},async()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'adc-ol01-'));
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{
   if(error){res.writeHead(404).end();return;}
   res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.pdf':'application/pdf','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');
   res.end(data);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100},acceptDownloads:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
   if(route.request().url().includes('cdn.jsdelivr.net/npm/pdf-lib'))return route.fulfill({path:path.join(runtime,'pdf-lib/dist/pdf-lib.min.js'),contentType:'application/javascript'});
   if(route.request().url().startsWith('http://127.0.0.1:')||route.request().url().startsWith('blob:'))return route.continue();
   return route.abort();
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  try{
   await page.waitForFunction(()=>window.PDFLib&&typeof adcOLStart==='function');
  }catch(error){
   throw new Error(`${error.message} OL-01 startup errors: ${errors.join(' | ')||'none'}`);
  }
  assert.equal(await page.locator('#adcOL .adc-ol-pdf-actions').count(),2);
  assert.ok(!await page.locator('#adcOLSignDateHint').textContent().then(text=>text.includes('Elegí una institución')));
  await page.evaluate(()=>{
   inst=[{id:901,name:'Instituto Superior de Prueba',level:'Superior',entries:[
    {djUid:'ol-cargo-1',type:'cargo',cargoName:'Profesor de prueba',revista:'Interino',schedule:[1,0,0,0,0,0,0]},
    {djUid:'ol-cargo-2',type:'hs',subject:'Matemática',course:'2 1',adcCourseParts:{year:'2',division:'1'},revista:'Interino',schedule:[1,0,0,0,0,0,0]}
   ]}];
   for(const [id,value] of Object.entries({perfilApellidos:'Docente',perfilNombres:'Prueba',dni:'12345678',sexo:'F',perfilDomicilio:'Av. Perfil 123',perfilLocalidad:'Resistencia'}))document.getElementById(id).value=value;
   adcOLStart(false);
  });
  const institution=page.locator('#adcOL [name=school]');
  assert.equal(await institution.isEnabled(),true,'Presentada ante debe funcionar antes de elegir una licencia');
  await institution.selectOption('901');
  assert.equal(await page.locator('#adcOLPosts input[name=post]').count(),2);
  assert.match(await page.locator('#adcOLPosts').textContent(),/Profesor de prueba/);
  assert.match(await page.locator('#adcOLPosts').textContent(),/Matemática/);
  await page.evaluate(()=>{
   inst.push({id:903,name:'Segunda institución',level:'Superior',entries:[{djUid:'otro-cargo',type:'cargo',cargoName:'Bibliotecario',revista:'Titular'}]});
   adcOLStart(false);
  });
  await institution.selectOption('903');
  assert.equal(await page.locator('#adcOLPosts input[name=post]').count(),1);
  assert.match(await page.locator('#adcOLPosts').textContent(),/Bibliotecario/);
  assert.doesNotMatch(await page.locator('#adcOLPosts').textContent(),/Matemática|Profesor de prueba/);
  await institution.selectOption('901');
  await page.evaluate(()=>{inst.pop();adcOLStart(false);});
  await page.evaluate(()=>{
   adcOLPick('Enfermedad o lesión común');
   adcOLFields.school.value='901';adcOLFields.school.dispatchEvent(new Event('change',{bubbles:true}));
   adcOLFields.from.value='2026-11-12';adcOLFields.until.value='2026-11-13';
   adcOLFields.until.dispatchEvent(new Event('input',{bubbles:true}));
   adcOLFields.until.dispatchEvent(new Event('change',{bubbles:true}));
  });
  assert.equal(await page.locator('[name=teacherSurname]').inputValue(),'Docente');
  const topActions=await page.locator('.adc-ol-actions-top').boundingBox();
  const sheet=await page.locator('#adcOLSheet').boundingBox();
  assert.ok(topActions.y+topActions.height<=sheet.y,'Las acciones superiores deben preceder al formulario');
  assert.equal(await page.locator('[name=teacherGiven]').inputValue(),'Prueba');
  assert.match(await page.locator('#adcOLPosts').textContent(),/2°.*1\.ª/);
  assert.equal(await page.locator('[name=law]').inputValue(),'113');
  await page.evaluate(()=>{
   adcOLFields.teacherAddress.value='';
   adcOLFields.teacherAddress.adcMnc.set(true);
   adcOLFields.teacherAddress.value='Domicilio de prueba';
   document.querySelector('#adcOLPosts input').checked=false;
   inst[0].entries.reverse();
   inst.push({id:902,name:'Otra escuela de prueba',level:'Superior',entries:[]});
   adcOLStart(false);
  });
  assert.equal(await page.locator('[name=school] option').count(),3);
  assert.equal(await page.locator('[name=school]').inputValue(),'901');
  assert.equal(await page.locator('#adcOLPosts input').first().isChecked(),true);
  assert.equal(await page.locator('#adcOLPosts input').last().isChecked(),false);
  assert.equal(await page.evaluate(()=>adcOLFields.teacherAddress.adcMnc.marked),true);
  await page.waitForFunction(()=>{const image=document.getElementById('adcOLPaperImage');return image.complete&&image.naturalWidth>0;});
  await page.locator('#adcOLTitle').scrollIntoViewIfNeeded();
  const edge=await page.locator('#adcOLLeft').boundingBox();
  assert.ok(edge.width<60&&edge.height<60,'El ajuste heredado del editor no debe cubrir el formulario con el tirador');
  await page.screenshot({path:path.join(output,'OL-01-escritorio.png')});
  assert.equal(await page.locator('#adcOLFamilyPeriodLabel').isVisible(),false);
  const [directDownload]=await Promise.all([
   page.waitForEvent('download'),page.locator('[data-ol-action="download"]').click()
  ]);
  const directPdf=await PDFDocument.load(fs.readFileSync(await directDownload.path()));
  assert.equal(directPdf.getPageCount(),1,'La barra superior debe generar y descargar sin vista previa previa');
  await page.evaluate(()=>{
   window.olPrintCalls=0;
   window.olOriginalPrint=adcOLPrintPdf;
   adcOLPrintPdf=()=>window.olPrintCalls++;
  });
  await page.locator('[data-ol-action="print"]').press('Enter');
  assert.equal(await page.evaluate(()=>window.olPrintCalls),1);
  await page.locator('#adcOLPrint').press('Enter');
  assert.equal(await page.evaluate(()=>window.olPrintCalls),2);
  await page.evaluate(()=>{adcOLPrintPdf=window.olOriginalPrint;});
  for(const sex of ['F','M']){
   const previous=await page.evaluate(()=>document.querySelector('#adcOLPreview iframe')?.src||null);
   await page.evaluate(sex=>{adcOLFields.teacherSex.value=sex;adcOLFields.teacherSex[0].dispatchEvent(new Event('change',{bubbles:true}));},sex);
   await page.locator('.adc-ol-pdf-actions').nth(sex==='F'?0:1).getByRole('button',{name:'Ver vista preliminar',exact:true}).click();
   try{
    await page.waitForFunction(previous=>{const frame=document.querySelector('#adcOLPreview iframe');return frame&&frame.src!==previous;},previous,{timeout:5000});
   }catch(error){
    const status=await page.locator('#adcOLStatus').textContent();
    const ruleStatus=await page.locator('#adcOLRuleStatus').textContent();
    const dateHint=await page.locator('#adcOLSignDateHint').textContent();
    const pending=await page.locator('#adcOL [form="adcOLForm"]').evaluateAll(fields=>fields.filter(field=>!field.disabled&&!field.value?.trim()).map(field=>field.name||field.id));
    const review=await page.locator('.adc-review:visible').textContent();
    throw new Error(`${error.message} Status: ${status}; rule: ${ruleStatus}; date: ${dateHint}; pending: ${pending.join(',')}; review: ${review}`);
   }
   assert.match(await page.locator('#adcOLPaperImage').getAttribute('src'),sex==='M'?/masculino\.png$/:/general\.png$/);
   await page.waitForFunction(()=>{const image=document.getElementById('adcOLPaperImage');return image.complete&&image.naturalWidth>0;});
   const pdfFile=path.join(output,`OL-01-${sex}.pdf`);
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#adcOLDownload').click()]);
   await download.saveAs(pdfFile);
   const pdf=await PDFDocument.load(fs.readFileSync(pdfFile));
   const template=await PDFDocument.load(fs.readFileSync(path.join(root,'assets/formularios/ol01',sex==='M'?'ol-01-masculino.pdf':'ol-01-general.pdf')));
   assert.equal(pdf.getPageCount(),1);
   assert.deepEqual(pdf.getPage(0).getSize(),template.getPage(0).getSize());
  }
  assert.equal(await page.locator('#adcOL .adc43-zoom').count(),1);

  assert.equal(await page.locator('#adcOLDownload').isEnabled(),true);
  assert.equal(await page.locator('#adcOLPrint').isEnabled(),true);
  await page.locator('#adcOL [name=teacherGiven]').fill('Nombre modificado');
  assert.equal(await page.locator('#adcOLPreview iframe').count(),0);
  assert.equal(await page.locator('#adcOLDownload').isEnabled(),true);
  assert.equal(await page.locator('#adcOLPrint').isEnabled(),true);
  assert.match(await page.locator('#adcOLStatus').textContent(),/vista preliminar nueva/);
  const [regeneratedDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#adcOLDownload').click()]);
  assert.ok(fs.statSync(await regeneratedDownload.path()).size>1000);

  await page.evaluate(()=>{
   inst[0].entries=[
    {djUid:'ol-family-titular',type:'cargo',cargoName:'Cargo titular',revista:'Titular',schedule:[1,0,0,0,0,0,0]},
    {djUid:'ol-family-interino',type:'cargo',cargoName:'Cargo interino',revista:'Interino',schedule:[0,1,0,0,0,0,0]}
   ];
   inst[1].entries=[
    {djUid:'ol-family-suplente',type:'cargo',cargoName:'Cargo suplente',revista:'Suplente',schedule:[0,1,0,0,0,0,0]}
   ];
   adcOLStart(false);
  });
  await page.locator('#adcOLQuery').fill('pariente enfermo');
  assert.equal(await page.locator('#adcOLSuggestions button').count(),1);
  await page.locator('#adcOLQuery').press('ArrowDown');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'adcOLFamilyPeriod');
  await page.locator('#adcOL [name=school]').selectOption('');
  assert.equal(await page.locator('#adcOLFamilyPeriodLabel').isVisible(),true);
  assert.match(await page.locator('#adcOLFamilyInfo').textContent(),/28 días por año/);
  await page.locator('#adcOLFamilyPeriod').selectOption('initial');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'adcOLFamilySchool');
  await page.locator('#adcOLFamilySchool').selectOption('902');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'adcOLFamilyDays');
  await page.locator('#adcOLFamilyDays').fill('2');
  await page.locator('#adcOLFamilyDays').press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.name),'teacherSurname');
  await page.locator('#adcOLFamilyDays').fill('');
  await page.locator('#adcOLFamilySchool').selectOption('901');
  assert.equal(await page.locator('#adcOL [name=school]').inputValue(),'901');
  const questionLabels=await page.locator('#adcOLFamilyPeriodLabel,#adcOLFamilySchoolLabel,#adcOLFamilyDaysLabel').evaluateAll(labels=>labels.map(label=>label.textContent.trim().slice(0,2)));
  assert.deepEqual(questionLabels,['2.','3.','4.']);
  assert.equal(await page.locator('#adcOLFamilyPeriod').inputValue(),'initial');
  assert.equal(await page.locator('#adcOL [name=mode][value=relative]').isChecked(),true);
  assert.equal(await page.locator('#adcOL [name=reason]').isDisabled(),true);
  assert.equal(await page.locator('#adcOL [name=from]').isEnabled(),true);
  assert.equal(await page.locator('#adcOL [name=until]').isEnabled(),true);
  assert.equal(await page.locator('#adcOL [name=law]').isEnabled(),true);
  assert.equal(await page.locator('#adcOL [name=article]').isEnabled(),true);
  assert.equal(await page.locator('#adcOLReasonCross').isVisible(),true);
  assert.equal(await page.locator('#adcOLRelativeCross').isVisible(),false);
  assert.match(await page.locator('#adcOLRuleStatus').textContent(),/encuadres distintos o no compatibles/);
  assert.equal(await page.locator('#adcOLFamilyPeriodLabel').isVisible(),true);

  await page.locator('#adcOLFamilyPeriod').selectOption('initial');
  await page.locator('#adcOLPosts input[name=post]').nth(1).uncheck();
  await page.locator('#adcOLFamilyPeriod').selectOption('initial');
  assert.match(await page.locator('#adcOLFamilyInfo').textContent(),/28 días por año/);
  await page.locator('#adcOLFamilyPeriod').selectOption('extension');
  assert.equal(await page.locator('#adcOL [name=law]').inputValue(),'152');
  assert.match(await page.locator('#adcOLFamilyInfo').textContent(),/30 días por año/);
  await page.locator('#adcOLFamilyPeriod').selectOption('initial');
  assert.equal(await page.locator('#adcOL [name=law]').inputValue(),'151');
  assert.equal(await page.locator('#adcOL [name=article]').inputValue(),'309-D');
  await page.locator('#adcOLPosts input[name=post]').nth(0).uncheck();
  await page.locator('#adcOLPosts input[name=post]').nth(1).check();
  assert.equal(await page.locator('#adcOL [name=law]').inputValue(),'155');
  assert.match(await page.locator('#adcOLFamilyInfo').textContent(),/10 días por año.*4 meses/s);
  await page.locator('#adcOLPosts input[name=post]').nth(0).check();
  await page.locator('#adcOLPosts input[name=post]').nth(1).uncheck();
  await page.locator('#adcOLFamilyDays').fill('3');
  await page.locator('#adcOL [name=from]').fill('2026-11-12');
  assert.equal(await page.locator('#adcOL [name=until]').inputValue(),'2026-11-14');
  await page.locator('#adcOL > section').first().screenshot({path:path.join(output,'OL-01-familiar-preguntas.png')});
  await page.locator('#adcOLFamilyDays').fill('1');
  assert.equal(await page.locator('#adcOL [name=until]').inputValue(),'2026-11-12');
  await page.locator('#adcOLFamilyDays').fill('29');
  assert.equal(await page.locator('#adcOL [name=until]').inputValue(),'');
  assert.match(await page.locator('#adcOLFamilyInfo').textContent(),/entre 1 y 28/);
  await page.locator('#adcOLFamilyDays').fill('2');
  await page.locator('#adcOL [name=from]').fill('2028-02-28');
  assert.equal(await page.locator('#adcOL [name=until]').inputValue(),'2028-02-29');
  await page.locator('#adcOL [name=from]').fill('2026-12-31');
  assert.equal(await page.locator('#adcOL [name=until]').inputValue(),'2027-01-01');
  await page.locator('#adcOL [name=until]').fill('2027-01-03');
  await page.locator('#adcOL [name=from]').fill('2026-12-30');
  assert.equal(await page.locator('#adcOL [name=until]').inputValue(),'2027-01-03');
  assert.match(await page.locator('#adcOLFamilyInfo').textContent(),/ajustada manualmente/);
  await page.locator('#adcOLFamilyDays').fill('');
  await page.locator('#adcOL [name=from]').fill('2026-11-12');
  await page.locator('#adcOL [name=until]').fill('2026-11-13');
  assert.equal(await page.locator('#adcOL [name=signDate]').inputValue(),'2026-11-16');
  assert.match(await page.locator('#adcOLSignDateHint').textContent(),/Sugerencia/);
  await page.locator('#adcOL [name=signDate]').fill('2026-11-19');
  await page.locator('#adcOL [name=school]').selectOption('902');
  assert.equal(await page.locator('#adcOLFamilySchool').inputValue(),'902');
  assert.equal(await page.locator('#adcOLFamilyPeriod').inputValue(),'initial');
  assert.match(await page.locator('#adcOLFamilyInfo').textContent(),/5 días por año.*4 meses/s);
  assert.equal(await page.locator('#adcOL [name=law]').inputValue(),'156');
  assert.equal(await page.locator('#adcOL [name=article]').inputValue(),'340-E');
  assert.equal(await page.locator('#adcOL [name=signDate]').inputValue(),'2026-11-19');
  assert.match(await page.locator('#adcOLSignDateHint').textContent(),/Nueva sugerencia.*17\/11\/2026/);
  await page.evaluate(()=>{
   inst[1].entries[0].schedule=[0,0,0,0,0,0,0];
   adcOLSyncRule();
  });
  assert.match(await page.locator('#adcOLSignDateHint').textContent(),/Completá los horarios de Otra escuela de prueba/);
  assert.equal(await page.locator('#adcOL [name=signDate]').inputValue(),'2026-11-19');
  assert.equal(await page.locator('#adcOL [name=signDate]').isEnabled(),true);

  await page.evaluate(()=>{
   window.__adcOLTestSchools=inst;
   inst=[];
   adcOLStart(false);
  });
  assert.equal(await page.locator('#adcOLNoSchools').isVisible(),true);
  assert.match(await page.locator('#adcOLNoSchools').textContent(),/Mi perfil docente/);
  await page.evaluate(()=>{
   inst=window.__adcOLTestSchools;
   delete window.__adcOLTestSchools;
   adcOLStart(false);
  });

  await page.locator('#adcOLBack').click();
  await page.locator('#buscar').fill('pariente enfermo');
  const familyResult=page.locator('#listaTramites [data-adc-tramite="Enfermedad de un miembro del grupo familiar"]');
  assert.equal(await familyResult.count(),1);
  await familyResult.click();
  await page.waitForFunction(()=>!document.getElementById('adcOL').classList.contains('hide'));
  assert.equal(await page.locator('#adcOL [name=mode][value=relative]').isChecked(),true);
  await page.locator('#adcOL [name=school]').selectOption('901');
  await page.locator('#adcOLPosts input[name=post]').nth(1).uncheck();
  await page.locator('#adcOLFamilyPeriod').selectOption('initial');
  await page.locator('#adcOL [name=from]').fill('2026-11-12');
  await page.locator('#adcOL [name=until]').fill('2026-11-13');
  await page.locator('#adcOL [name=signDate]').fill('2026-11-19');
  await page.locator('#adcOL [name=surname]').fill('Pérez');
  await page.locator('#adcOL [name=given]').fill('Ana');
  await page.locator('#adcOL [name=dni]').fill('12345678');
  await page.locator('#adcOL [name=sex][value="F"]').check();
  await page.locator('#adcOL [name=relation]').fill('ma');
  await page.locator('#adcOL [name=relation]').dispatchEvent('change');
  assert.equal(await page.locator('#adcOL [name=relation]').inputValue(),'Madre');
  await page.locator('#adcOLUseProfileAddress').click();
  assert.equal(await page.locator('#adcOL [name=address]').inputValue(),'Av. Perfil 123');
  assert.equal(await page.locator('#adcOLUseProfileAddress').getAttribute('aria-pressed'),'true');
  const addressBox=await page.locator('#adcOL [name=address]').boundingBox();
  const addressButton=await page.locator('#adcOLUseProfileAddress').boundingBox();
  assert.ok(Math.abs(addressButton.x-addressBox.x)<2&&addressButton.y+addressButton.height<=addressBox.y+1);
  await page.locator('#adcOLUseProfileAddress').click();
  assert.equal(await page.locator('#adcOL [name=address]').inputValue(),'');
  assert.equal(await page.locator('#adcOL [name=address]').isEditable(),true);
  await page.locator('#adcOL [name=address]').fill('Domicilio escrito manualmente');
  assert.equal(await page.locator('#adcOLUseProfileAddress').getAttribute('aria-pressed'),'false');
  await page.locator('#adcOLUseProfileAddress').click();
  assert.equal(await page.locator('#adcOL [name=address]').inputValue(),'Av. Perfil 123');
  assert.ok(await page.locator('#adcOLFamilyRelationOptions option').evaluateAll(options=>options.some(option=>option.value==='ma')&&options.some(option=>option.value==='pa')&&options.some(option=>option.value==='hi')));

  await page.evaluate(()=>adcOLForm.requestSubmit());
  await page.waitForFunction(()=>document.querySelector('#adcOLPreview iframe'));
  assert.equal(await page.locator('#adcOLDownload').isEnabled(),true);
  assert.equal(await page.locator('#adcOLPrint').isEnabled(),true);
  const familyPdfFile=path.join(output,'OL-01-pariente.pdf');
  const [familyDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#adcOLDownload').click()]);
  await familyDownload.saveAs(familyPdfFile);
  const familyPdf=await PDFDocument.load(fs.readFileSync(familyPdfFile));
  const familyContent=familyPdf.getPage(0).node.Contents().asArray()
   .map(reference=>zlib.inflateSync(familyPdf.context.lookup(reference).getContents()).toString('latin1')).join('\n');
  for(const value of ['Instituto Superior de Prueba','12/11/2026','13/11/2026','151','309-D','Enfermedad de un miembro del grupo familiar','Pérez','Ana','12.345.678','Av. Perfil 123','Madre','Resistencia','19/11/2026']){
   const encoded='<'+Buffer.from(value,'latin1').toString('hex').toUpperCase()+'> Tj';
   assert.ok(familyContent.includes(encoded),'El PDF debe contener el campo '+value);
  }
  const upperCross=familyContent.match(/435 ([\d.]+) m\n435 [\d.]+ m\n805 ([\d.]+) l/);
  const signDatePosition=familyContent.match(/1 0 0 1 553\.98 ([\d.]+) Tm\n<31392F31312F32303236> Tj/);
  assert.ok(upperCross&&signDatePosition,'El PDF debe ubicar el tachado superior y Lugar y fecha.');
  assert.ok(Math.min(Number(upperCross[1]),Number(upperCross[2]))>Number(signDatePosition[1])+100,'El tachado superior no debe cruzar Lugar y fecha.');
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true);
  await page.locator('#adcOL').screenshot({path:path.join(output,'OL-01-celular.png')});

  await page.locator('#adcOL [name=address]').fill('Domicilio actualizado');
  assert.equal(await page.locator('#adcOLPreview iframe').count(),0);
  assert.equal(await page.locator('#adcOLDownload').isEnabled(),true);
  assert.equal(await page.locator('#adcOLPrint').isEnabled(),true);
  await page.route('**/assets/formularios/ol01/*.pdf',route=>route.fulfill({status:404,body:'No disponible'}));
  await page.evaluate(()=>adcOLForm.requestSubmit());
  await page.waitForFunction(()=>document.getElementById('adcOLStatus').textContent.includes('plantilla (404)'));
  assert.equal(await page.locator('#adcOLPreview iframe').count(),0);
  assert.deepEqual(errors,[]);
  console.log('Muestras OL-01 para revisión visual:',output);
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
});
