// Extraído de Asistente_Docente_Chaco_v0_9_16_60(2).html.
// Montar una vez, después de insertar ol-01.html y cargar el catálogo.
export function montarOL01({
  root,
  getInstitutions,
  getSelectedReason,
  showOL01,
  backToTramites,
  tramites,
  adcTramiteLabel,
  norm,
  mapping,
  affected,
  adcDueloRelations,
  adcDueloCode,
  adcDueloRelation,
  isCalendarClosed,
  date,
  fmt,
  pdfText,
  adcPersonalValid,
  adcPersonalFormat,
  getPdfLib = () => window.PDFLib,
  getHostField = id => document.getElementById(id)
}) {
  if (!root || root.id !== 'adcOL') throw Error('Montá el fragmento OL-01 antes de inicializarlo.');
  const $ = id => id === 'adcOL' ? root : root.querySelector('#' + id) || getHostField(id);
  const assetUrl = name => new URL('./plantillas/' + name, import.meta.url).href;
  const adcOLForm = $('adcOLForm');
  let adcOLUrl = '', adcOLGeneration = 0;
  $('adcOLBack').addEventListener('click', backToTramites);
  function adcOLInvalidate(){
   adcOLGeneration++;
   if(adcOLUrl)URL.revokeObjectURL(adcOLUrl);
   adcOLUrl='';$('adcOLPreview').replaceChildren();
  }
  function adcOLPosts(schoolId,contextual=false){
   const group=$('adcOLPosts');group.replaceChildren();
   const school=getInstitutions().find(i=>String(i.id)===schoolId);
   const relevant=contextual&&schoolId===$('escuelaSelect').value?new Set(affected().map(row=>row.e)):null;
   for(const [index,entry] of (school?.entries||[]).entries()){
    const cargo=adcOLCargo(entry);if(!cargo)continue;
    const label=document.createElement('label'),box=document.createElement('input');
    box.type='checkbox';box.setAttribute('form','adcOLForm');box.name='post';box.value=String(index);box.checked=!relevant?.size||relevant.has(entry);
    box.setAttribute('aria-label','Incluir '+cargo);
    for(const value of [school.name,cargo,entry.revista||'']){
     const span=document.createElement('span');span.textContent=value;span.title=value;label.append(span);
    }
    label.children[1].prepend(box);group.append(label);
   }
  }
  function adcOLCargo(e){return e.type==='cargo'?e.cargoName:[e.subject,e.course].filter(Boolean).join(' · ')}
  const adcOLConfirmedReason='Enfermedad o lesión común';
  function adcOLResolve(reason,school,entries,pay,relation){
   if(!reason)return {message:'1. Confirmá un motivo de la lista.'};
   if(!school)return {message:'2. Elegí en qué escuela vas a presentar la solicitud.'};
   if(!entries.length)return {message:'Elegí al menos un cargo u hora cátedra.'};
   if(reason==='Exámenes'){
    const excluded=entries.filter(e=>e.revista==='Suplente');
    if(excluded.length)return {message:'Exámenes no corresponde a estos cargos suplentes: '+excluded.map(adcOLCargo).join(', ')+'. Desmarcalos para continuar con los cargos titulares o interinos.'};
   }
   const rows=entries.map(e=>{
    const blood={Titular:['381','320-C'],Interino:['382','334-B'],Suplente:['383','343-B']};
    const [code,article]=reason==='Duelo'?adcDueloCode(e.revista,relation):reason==='Donación de sangre'?blood[e.revista]||['','']:mapping(e,reason,pay);
    return {code,article,description:adcTramiteLabel(reason),label:adcOLCargo(e)+' · '+(e.revista||'Sin situación de revista')};
   });
   if(rows.some(row=>!row.code||!row.article))return {message:reason==='Duelo'&&!relation?'Encuadre pendiente: confirmá el parentesco del fallecido.':'Encuadre pendiente de verificar para el motivo y los cargos seleccionados.'};
   const first=rows[0];
   if(rows.some(row=>row.code!==first.code||row.article!==first.article||row.description!==first.description))
    return {message:'Encuadres distintos. Seleccioná cargos compatibles: '+rows.map(row=>row.label+' ('+row.code+' / '+row.article+')').join('; ')};
   const confirmed=[adcOLConfirmedReason,'Exámenes'].includes(reason)&&['superior','terciario'].includes(norm(school.level).trim());
   const previewOnly=norm(school.level).trim()==='secundario';
   return {row:first,confirmed,previewOnly,message:previewOnly?'Nivel Secundario: vista previa de prueba, no válida para presentar.':confirmed?'Encuadre tomado del DL-01 según la situación de revista seleccionada.':'Encuadre disponible. Uso del OL-01 pendiente de confirmar para este motivo y nivel.'};
  }
  function adcOLSelection(){
   const data=new FormData(adcOLForm),school=getInstitutions().find(i=>String(i.id)===adcOLForm.elements.school.value);
   const entries=data.getAll('post').map(index=>school?.entries[Number(index)]).filter(Boolean);
   return {school,entries,rule:adcOLResolve(data.get('catalogReason'),school,entries,$('pago').value,adcOLRelation())};
  }
  const adcOLCatalog=tramites.filter(row=>/licencias|permisos/i.test(row[1])&&!/^inasistencias?\b/i.test(row[0]));
  const adcOLQuery=$('adcOLQuery'),adcOLSuggestions=$('adcOLSuggestions');
  const adcOLFields=adcOLForm.elements;
  let adcOLAutoUntil='';
  function adcOLFind(query){
   const tokens=norm(query).trim().split(/\s+/).filter(Boolean);
   return adcOLCatalog.map(row=>{
    const title=norm(adcTramiteLabel(row[0])),words=norm(row.join(' '));
    const score=tokens.every(t=>words.includes(t))?tokens.filter(t=>title.includes(t)).length: -1;
    return {row,score};
   }).filter(item=>item.score>=0).sort((a,b)=>b.score-a.score).map(item=>item.row);
  }
  function adcOLSuggest(){
   adcOLSuggestions.replaceChildren();
   for(const row of adcOLFind(adcOLQuery.value)){
    const button=document.createElement('button');button.type='button';button.className='alt';
    button.textContent=adcTramiteLabel(row[0])+' · '+row[1];
    button.onclick=()=>adcOLPick(row[0],true);adcOLSuggestions.append(button);
   }
   if(!adcOLSuggestions.children.length)adcOLSuggestions.textContent='Sin coincidencias.';
   adcOLSuggestions.hidden=false;
  }
  function adcOLPick(reason,guide=false){
   adcOLFields.catalogReason.value=reason;
   adcOLQuery.value=reason?adcTramiteLabel(reason):'';
   adcOLFields.reason.value=adcOLQuery.value;
   adcOLSuggestions.hidden=true;
   adcOLFields.bereavement.value='';
   adcOLSyncRule();adcOLInvalidate();
   if(guide){adcOLFields.school.classList.add('adc-ol-step-next');adcOLFields.school.focus()}
  }
  function adcOLRelation(){
   const query=norm(adcOLFields.bereavement.value).trim();
   return adcDueloRelations.find(([name,,aliases=''])=>[norm(name),...norm(aliases).split(' ').filter(Boolean)].includes(query));
  }
  function adcOLBereavementEnd(start,days,school,isClosed){
   if(!date(start)||!days)return '';
   for(let d=new Date(start+'T12:00:00Z'),i=0;i<366;i++,d.setUTCDate(d.getUTCDate()+1)){
    const iso=d.toISOString().slice(0,10);
    if(![0,6].includes(d.getUTCDay())&&!isClosed(iso,school)&&!--days)return iso;
   }
   return '';
  }
  function adcOLBereavement(rule,school){
   const f=adcOLFields,isDuelo=f.catalogReason.value==='Duelo',active=isDuelo&&f.mode.value!=='relative',relation=adcOLRelation();
   $('adcOLKin').hidden=!active;
   f.bereavement.disabled=!active;
   if(f.until.value===adcOLAutoUntil)f.until.value='';
   adcOLAutoUntil='';
   const lines=f.reason.value.split('\n');
   const prefix='Parentesco del fallecido: ';
   if(lines[0]?.startsWith(prefix))lines.shift();
   if(lines[1]?.startsWith(prefix))lines.splice(1,1);
   if(active&&relation){
    if(lines[0]?.trim()!=='Duelo'){
     if(!lines[0]?.trim())lines.shift();
     lines.unshift('Duelo');
    }
    lines.splice(1,0,prefix+relation[0]);
   }
   f.reason.value=lines.join('\n');
   if(!active||!relation||!rule.row||!school)return '';
   const days=[0,8,2,1][relation[1]];
   adcOLAutoUntil=adcOLBereavementEnd(f.from.value,days,school,isCalendarClosed);
   if(adcOLAutoUntil)f.until.value=adcOLAutoUntil;
   return days+' día(s) hábiles.'+(adcOLAutoUntil?' Hasta estimado: '+fmt(adcOLAutoUntil)+' según el calendario cargado.':' Elegí Desde para calcular Hasta.');
  }
  adcOLQuery.addEventListener('focus',adcOLSuggest);
  adcOLQuery.addEventListener('input',()=>{
   adcOLFields.catalogReason.value='';adcOLSyncRule();adcOLInvalidate();adcOLSuggest();
  });
  adcOLQuery.addEventListener('keydown',event=>{
   if(event.key==='Escape'){adcOLSuggestions.hidden=true;return}
   if(!['ArrowDown','Enter'].includes(event.key))return;
   event.preventDefault();
   if(adcOLSuggestions.hidden)adcOLSuggest();
   const first=adcOLSuggestions.querySelector('button');
   if(event.key==='Enter')first?.click();else first?.focus();
  });
  adcOLSuggestions.addEventListener('keydown',event=>{
   if(event.key==='Escape'){adcOLQuery.focus();adcOLSuggestions.hidden=true;return}
   const next=event.key==='ArrowDown'?event.target.nextElementSibling:event.key==='ArrowUp'?event.target.previousElementSibling:null;
   if(next){event.preventDefault();next.focus()}
  });
  document.addEventListener('click',event=>{if(event.target!==adcOLQuery&&!adcOLSuggestions.contains(event.target))adcOLSuggestions.hidden=true});
  $('adcOLKinOptions').replaceChildren(...adcDueloRelations.flatMap(([name,,aliases=''])=>[new Option(name,name),...aliases.split(' ').filter(Boolean).map(alias=>new Option(name,alias))]));
  function adcOLSyncRule(){
   const fields=adcOLForm.elements,{school,rule}=adcOLSelection();
   fields.law.value=rule.row?.code||'';fields.article.value=rule.row?.article||'';fields.description.value=rule.row?.description||'';
   $('adcOLRuleStatus').textContent=[rule.message,adcOLBereavement(rule,school)].filter(Boolean).join('\n');
   $('adcOLRuleStatus').className=rule.confirmed?'status':'warning';
   fields.school.disabled=!fields.catalogReason.value;
   fields.school.classList.toggle('adc-ol-step-next',Boolean(fields.catalogReason.value&&!school));
  }
  let adcOLDraftKey=null;
  function adcOLMode(){
   const fields=adcOLForm.elements,relative=fields.mode.value==='relative';
   for(const key of ['reason','from','until','law','article','description'])fields[key].disabled=relative;
   for(const key of ['surname','given','dni','address','relation'])fields[key].disabled=!relative;
   for(const input of fields.sex)input.disabled=!relative;
   $('adcOLReasonCross').toggleAttribute('hidden',!relative);$('adcOLRelativeCross').toggleAttribute('hidden',relative);
  }
  function adcOLPaperVariant(){
   $('adcOLPaperImage').src=assetUrl(adcOLForm.elements.teacherSex.value==='M'?'ol-01-masculino.png':'ol-01-general.png');
  }
  function adcOLStart(contextual){
   const key=contextual?JSON.stringify([getSelectedReason(),$('escuelaSelect').value,$('desde').value,$('hasta').value]):'standalone';
   if(adcOLDraftKey===key){showOL01();$('adcOLTitle').focus();return}
   adcOLDraftKey=key;adcOLInvalidate();adcOLForm.reset();
   const fields=adcOLForm.elements;
   fields.school.replaceChildren(new Option('Elegí una institución',''),...getInstitutions().map(i=>new Option(i.name,String(i.id))));
   if(contextual){
    fields.school.value=$('escuelaSelect').value;fields.reason.value=adcTramiteLabel(getSelectedReason());
    fields.from.value=$('desde').value;fields.until.value=$('hasta').value;

   }
   adcOLAutoUntil='';
   const reason=contextual&&adcOLCatalog.some(row=>row[0]===getSelectedReason())?getSelectedReason():'';
   fields.catalogReason.value=reason;adcOLQuery.value=reason?adcTramiteLabel(reason):'';
   adcOLSuggestions.hidden=true;
   if(reason==='Duelo')fields.bereavement.value=adcDueloRelation()?.[0]||'';
   adcOLPosts(fields.school.value,contextual);adcOLSyncRule();
   for(const [key,id] of Object.entries({teacherSurname:'perfilApellidos',teacherGiven:'perfilNombres',teacherDni:'dni',teacherSex:'sexo',teacherAddress:'perfilDomicilio',teacherLocality:'perfilLocalidad'}))
    fields[key].value=$(id).value;
   fields.place.value=$('perfilLocalidad').value;
   adcOLMode();adcOLPaperVariant();$('adcOLStatus').textContent='';
   $('adcOLSource').textContent=contextual?'Datos tomados de la solicitud. Podés ajustarlos para este OL-01.':'Completá la solicitud con los datos de tu perfil docente.';
   showOL01();$('adcOLTitle').focus();
  }
  $('adcOL').addEventListener('change',event=>{
   const name=event.target.name;
   if(name==='school'){adcOLPosts(event.target.value);adcOLFields.school.classList.remove('adc-ol-step-next')}
   if(name==='bereavement'&&adcOLRelation())adcOLFields.bereavement.value=adcOLRelation()[0];
   if(['school','post','bereavement','from','mode'].includes(name))adcOLSyncRule();
  });
  for(const input of adcOLForm.elements.teacherSex)input.addEventListener('change',adcOLPaperVariant);
  $('adcOL').addEventListener('input',()=>{
   adcOLMode();
   adcOLInvalidate();$('adcOLStatus').textContent='';
  });
  function adcOLDraw(page,font,values){
   function put(value,x,top,w,center=false,size=10){
    const text=pdfText(value).replace(/[\r\n]+/g,' ').replace(/[^\x20-\x7e\xa0-\xff]/g,'?');
    if(!text)return;
    const fitted=Math.min(size,size*w/font.widthOfTextAtSize(text,size));
    if(fitted<5)throw Error('Un dato supera el espacio disponible. Abrevialo para generar el OL-01.');
    const width=font.widthOfTextAtSize(text,fitted);
    page.drawText(text,{x:x+(center?(w-width)/2:0),y:page.getHeight()-top,size:fitted,font});
   }
   function markSex(value,male,female,top){
    if(value!=='M'&&value!=='F')return;
    const x=value==='M'?male:female,y=page.getHeight()-top;
    for(const sign of [-1,1])page.drawLine({start:{x:x-3.6,y:y-3.6*sign},end:{x:x+3.6,y:y+3.6*sign},thickness:1.05});
   }
   put(values.surname,94,144,296);put(values.given,96,175,294);
   put(values.dni,83,199,167,true);markSex(values.sex,312.9,342,201.8);
   put(values.address,96,227,310);put(values.locality,96,254,310);put(values.school,130,280,272);
   const lines=[[578,144,210],[435,164,355],[435,179,355],[435,194,355],[435,209,355],[435,222,355],[435,237,355],[435,252,355]];
   const paragraphs=(values.reason||'').split(/\r?\n/).map(line=>line.trim().split(/\s+/).filter(Boolean));
   for(const [x,y,w] of lines){
    if(!paragraphs.length)break;
    const words=paragraphs[0];
    let line='';
    while(words.length&&font.widthOfTextAtSize(pdfText([line,words[0]].filter(Boolean).join(' ')).replace(/[^\x20-\x7e\xa0-\xff]/g,'?'),10)<=w)
     line=[line,words.shift()].filter(Boolean).join(' ');
    if(!line&&words.length)line=words.shift();
    put(line,x,y,w);
    if(!words.length)paragraphs.shift();
   }
   if(paragraphs.some(words=>words.length))throw Error('El motivo supera el espacio del formulario. Resumilo para continuar.');
   put(values.from,494,273,100,true);put(values.until,664,273,125,true);
   put(values.law,461,293,42,true);put(values.article,559,293,38,true);put(values.description,671,293,121,false,9);
   function cell(value,x,y,width,center=false){
    const text=pdfText(value).replace(/[^\x20-\x7e\xa0-\xff]/g,'?');
    if(font.widthOfTextAtSize(text,8)<=width){put(text,x,y,width,center,8);return}
    const words=text.split(/\s+/), lines=['',''];
    for(let i=0;i<2;i++){
     while(words.length&&font.widthOfTextAtSize([lines[i],words[0]].filter(Boolean).join(' '),6.3)<=width)
      lines[i]=[lines[i],words.shift()].filter(Boolean).join(' ');
    }
    if(words.length){put(text,x,y,width,center,8);return}
    put(lines[0],x,y-3.2,width,center,6.3);put(lines[1],x,y+3.2,width,center,6.3);
   }
   values.entries.forEach((entry,index)=>{
    const y=371+index*14.72;
    cell(values.school,40,y,141);cell(entry.cargo,189,y,126);cell(entry.revista,323,y,91,true);
   });
   put(values.place,458,505,78,true);put(values.signDate,539,505,80,true);
   if(values.previewOnly)put('VISTA PREVIA DE PRUEBA - NIVEL SECUNDARIO - NO VÁLIDA PARA PRESENTAR',36,29,768,true,11);
   if(values.cross){
    const [x,top,right,bottom]=values.relative?[421.9,127.55,804.4,308.75]:[422.8,320.9,805.3,489];
    const h=page.getHeight();
    if(values.relative)page.drawLine({start:{x,y:h-top},end:{x:right,y:h-bottom},thickness:1.3});
    page.drawLine({start:{x,y:h-bottom},end:{x:right,y:h-top},thickness:1.3});
   }
   if(values.relative){
    const r=values.relative;
    put(r.surname,479,357,292);put(r.given,482,388,293);put(r.dni,473,412,166,true);
    markSex(r.sex,699,728.1,415.8);
    put(r.address,481,441,305);put(r.relation,534,467,251);
   }
  }
  adcOLForm.addEventListener('submit',async event=>{
   event.preventDefault();adcOLInvalidate();const generation=adcOLGeneration;
   const note=$('adcOLStatus'),fields=adcOLForm.elements;
   const v=Object.fromEntries(new FormData(adcOLForm)),{school,entries:posts,rule}=adcOLSelection();
   const relative=v.mode==='relative';
   function missing(key,message){
    note.textContent=message;
    const field=fields[key];
    (field?.focus?field:field?.[0])?.focus();
   }
   if(!v.catalogReason){missing('catalogReason','Confirmá un motivo de la lista.');adcOLQuery.focus();return}
   if(!school){missing('school','Elegí en qué escuela vas a presentar la solicitud.');return}
   if(!rule.confirmed&&!rule.previewOnly){note.textContent=rule.message;return}
   const surname=v.teacherSurname.trim(),given=v.teacherGiven.trim();
   if(!surname||!given||!adcPersonalValid(v.teacherDni,7,8)){note.textContent='Completá apellido, nombres y DNI en la plantilla.';return}
   const entries=posts.map(e=>({cargo:adcOLCargo(e),revista:e.revista||''}));
   if(entries.length>12){note.textContent='El OL-01 admite hasta 12 filas.';return}
   if(!relative){
    for(const [key,label] of [['reason','Motivo'],['from','Desde'],['until','Hasta'],['law','Ley N.º'],['article','Artículo N.º'],['description','Descripción']]){
     if(!v[key]?.trim()){missing(key,'Completá '+label+'.');return}
    }
    if(!date(v.from)||!date(v.until)||v.until<v.from){missing('until','Revisá el rango de fechas.');return}
    if(v.law.trim()!==rule.row.code||v.article.trim()!==rule.row.article){missing('law','El código y el artículo deben coincidir con el encuadre del cargo seleccionado.');return}
   }else{
    for(const [key,label] of [['surname','Apellido'],['given','Nombres'],['dni','DNI'],['sex','Sexo'],['address','Domicilio'],['relation','Parentesco'],['place','Lugar'],['signDate','Fecha de firma']]){
     if(!v[key]?.trim()){missing(key,'Completá '+label+'.');return}
    }
    if(!adcPersonalValid(v.dni,7,8)){missing('dni','Ingresá un DNI válido del pariente.');return}
   }
   if(!getPdfLib()){note.textContent='Se necesita conexión para cargar la biblioteca PDF.';return}
   const displayDate=iso=>iso.split('-').reverse().join('/');
   try{
    const {PDFDocument,StandardFonts}=getPdfLib();
    const template=await fetch(assetUrl(v.teacherSex==='M'?'ol-01-masculino.pdf':'ol-01-general.pdf'));
    if(!template.ok)throw Error('No se pudo cargar la plantilla.');
    const pdf=await PDFDocument.load(await template.arrayBuffer());const font=await pdf.embedFont(StandardFonts.HelveticaBold);
    adcOLDraw(pdf.getPage(0),font,{...v,cross:true,previewOnly:rule.previewOnly,reason:v.reason||'',surname,given,school:school.name,entries,dni:adcPersonalFormat(v.teacherDni,'dni'),sex:v.teacherSex,address:v.teacherAddress,locality:v.teacherLocality,from:v.from?displayDate(v.from):'',until:v.until?displayDate(v.until):'',signDate:v.signDate?displayDate(v.signDate):'',relative:v.mode==='relative'?{...v,dni:adcPersonalFormat(v.dni,'dni')}:null});
    const result=await pdf.save();if(generation!==adcOLGeneration)return;
    adcOLUrl=URL.createObjectURL(new Blob([result],{type:'application/pdf'}));
    const link=document.createElement('a');link.href=adcOLUrl;link.download='OL-01_solicitud_de_licencia.pdf';link.textContent='Descargar OL-01';
    const open=document.createElement('a');open.href=adcOLUrl;open.target='_blank';open.rel='noopener';open.textContent='Abrir PDF para imprimir';
    const actions=document.createElement('div');actions.className='toolbar';actions.append(link,open);
    const preview=document.createElement('iframe');preview.title='Vista previa de impresión del OL-01';preview.src=adcOLUrl;
    $('adcOLPreview').append(actions,preview);
    note.textContent=rule.previewOnly?'Vista previa de prueba para Secundario. No válida para presentar.':'Vista previa de impresión lista.';
    $('adcOLPreview').scrollIntoView({block:'start'});
   }catch(error){if(generation===adcOLGeneration)note.textContent='No se pudo generar el OL-01. '+error.message}
  });

  const adc43Zooms=[];
  function adc43Fit(){
   for(const item of adc43Zooms){
    const papers=[...item.host.querySelectorAll(item.selector)];
    if(!papers.length||!item.host.clientWidth)continue;
    papers.forEach(paper=>paper.style.zoom='1');
    const widest=Math.max(...papers.map(paper=>paper.offsetWidth));
    const fit=Math.min(1,(item.host.clientWidth-4)/widest);
    if(!Number.isFinite(fit)||fit<=0)continue;
    const percent=item.scale===null?Math.max(45,Math.floor(fit*100)):Math.round(item.scale*100);
    papers.forEach(paper=>paper.style.zoom=String(percent/100));
    item.label.textContent=(item.scale===null?'Automático · ':'')+percent+' %';
    if(item.slider)item.slider.value=String(percent);
   }
  } function zoom(host,selector){
    if(!host)return;
    const bar=document.createElement('div');bar.className='toolbar adc43-zoom';
    bar.setAttribute('aria-label','Zoom del formulario');
    const item={host,selector,scale:null,label:document.createElement('output')};
    for(const [text,delta] of [['−',-.1],['+',.1],['Ajustar al ancho',0],['Restablecer',null]]){
     const b=document.createElement('button');b.type='button';b.className='alt';b.textContent=text;
     b.onclick=()=>{
      const paper=host.querySelector(selector);
      if(!paper)return;
      item.scale=delta?Math.max(.45,Math.min(1.10,(Number(paper.style.zoom)||1)+delta)):null;
      if(!delta){host.scrollLeft=0;host.scrollTop=0}
      adc43Fit();
     };bar.append(b);
    }
    bar.append(item.label);host.after(bar);host.style.overflowX='auto';adc43Zooms.push(item);
    new MutationObserver(adc43Fit).observe(host,{childList:true});
    // Add the slider after the design editor indexes the original elements.
    queueMicrotask(()=>{
     const slider=document.createElement('input');slider.type='range';slider.min='45';slider.max='110';slider.step='1';
     slider.setAttribute('aria-label','Zoom de la vista previa');
     slider.addEventListener('input',()=>{item.scale=Number(slider.value)/100;adc43Fit()});
     item.slider=slider;bar.prepend(slider);
     if(typeof ResizeObserver!=='undefined')new ResizeObserver(adc43Fit).observe(host);
     adc43Fit();
    });
   } zoom($('adcOL').querySelector('.adc-ol-scroll'),'.adc-ol-paper');
   const sheet=$('adcOLSheet');
   const resetSheet=()=>{sheet.style.width='';sheet.style.marginLeft='';adc43Fit()};
   sheet.querySelector('.adc43-zoom button:last-of-type')?.addEventListener('click',resetSheet);
   for(const [id,left] of [['adcOLLeft',true],['adcOLRight',false]]){
    const handle=$(id);let drag;
    handle.onpointerdown=event=>{
     if(event.button!==0)return;
     const rect=sheet.getBoundingClientRect();
     drag={id:event.pointerId,x:event.clientX,left:rect.left,right:rect.right,margin:parseFloat(sheet.style.marginLeft)||0};
     handle.setPointerCapture(event.pointerId);
    };
    handle.onpointermove=event=>{
     if(drag?.id!==event.pointerId)return;
     const delta=event.clientX-drag.x,min=Math.min(380,document.documentElement.clientWidth-16);
     const edge=left?Math.max(8,Math.min(drag.left+delta,drag.right-min)):Math.max(drag.left+min,Math.min(drag.right+delta,document.documentElement.clientWidth-8));
     sheet.style.width=(left?drag.right-edge:edge-drag.left)+'px';
     if(left)sheet.style.marginLeft=(drag.margin+edge-drag.left)+'px';
     adc43Fit();
    };
    handle.onlostpointercapture=()=>{drag=null};
    handle.ondblclick=resetSheet;
   }
   window.addEventListener('resize',resetSheet);
  return { abrir: adcOLStart, ajustarVista: adc43Fit, invalidarVistaPrevia: adcOLInvalidate };
}
