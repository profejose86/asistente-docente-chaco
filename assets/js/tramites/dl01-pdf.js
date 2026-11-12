const adcPDFRequestFields=['desde','hasta','escuelaSelect','presentacion','pago','justifica','disposicion','adcDueloRelation','nombre','dni','sexo'];
let adcPDFRequest=null;

function adcPDFRequestKey(){
 const values=adcPDFRequestFields.map(id=>$(id).value);
 const school=inst.find(i=>String(i.id)===$('escuelaSelect').value);
 return JSON.stringify([selected,values,school]);
}

function adcInvalidatePDF(force=false){
 if(!adcPDFRequest||(!force&&adcPDFRequest.key===adcPDFRequestKey()))return;
 if(adcPDFRequest.url)URL.revokeObjectURL(adcPDFRequest.url);
 adcPDFRequest=null;
 $('pdfResult').replaceChildren();
}

let adcDLGuided;
let adcDLPersonalEditor;
async function generatePDF(){
 if(!adcDL01Ready.has(selected))return alert(selected?'Formulario por confirmar para este trámite.':'Elegí primero un trámite.');
 if(!adcDLPersonalEditor){
  adcDLPersonalEditor=document.createElement('fieldset');
  adcDLPersonalEditor.innerHTML='<legend>Datos del docente pendientes</legend>';
  for(const [id,label] of [['perfilApellidos','Apellido'],['perfilNombres','Nombres'],['dni','DNI']]){
   const wrapper=document.createElement('label'),input=document.createElement('input');
   wrapper.textContent=label;input.dataset.dlProfile=id;input.setAttribute('aria-label',label);wrapper.append(input);adcDLPersonalEditor.append(wrapper);
   input.addEventListener('input',()=>adcSetSharedField(id,input.value));
  }
  $('pdfResult').before(adcDLPersonalEditor);
 }
 for(const input of adcDLPersonalEditor.querySelectorAll('input'))input.value=$(input.dataset.dlProfile).value;
 adcDLPersonalEditor.hidden=Boolean($('nombre').value.trim()&&$('dni').value.trim());
 if(!adcDLGuided)adcDLGuided=adcGuidedValidation.create({root:$('license'),collect:()=>{
  const controls=adcGuidedValidation.controls($('license'));
  const dates=['desde','hasta'].filter(key=>!$(key).value).map(key=>({key,label:key==='desde'?'Fecha de inicio':'Fecha de finalización',controls:[$(key)]}));
  const personal=[];
  if(!$('nombre').value.trim())personal.push({key:'nombre',label:'Apellido y nombres del docente',controls:[...adcDLPersonalEditor.querySelectorAll('input')].slice(0,2)});
  if(!$('dni').value.trim())personal.push({key:'dni',label:'DNI del docente',controls:[adcDLPersonalEditor.querySelector('[data-dl-profile=dni]')]});
  return [...personal,...controls.filter(item=>!['desde','hasta'].includes(item.key)),...dates];
 }});
 if(!await adcDLGuided.review())return;
 if(classify()==='inasistencia'&&$('desde').value&&$('hasta').value&&(!date($('desde').value)||$('hasta').value!==$('desde').value))
  return alert('La inasistencia justificada debe tener la misma fecha en Desde y Hasta.');
 if(!window.PDFLib)return alert('No se cargó la biblioteca PDF. Se necesita conexión para cargar pdf-lib.');
 if(classify()==='inasistencia'&&!$('justifica').value)$('justifica').value='si';
 const r=review();
 const calendarSnapshot=window.adcDateSnapshot?.();
 if(selected==='Asuntos particulares'&&r.messages.some(x=>x.includes('Asuntos particulares')))return alert('Asuntos particulares: corregí la situación de revista y la forma de pago antes de generar el DL-01.');
 if(($('dni').value&&!adcPersonalValid($('dni').value,7,8))||(['desde','hasta'].some(id=>$(id).value&&!date($(id).value)))||($('desde').value&&$('hasta').value&&$('hasta').value<$('desde').value))return alert('Corregí los datos inválidos indicados antes de generar.');
 r.i=r.i||{};
 const dueloRelation=selected==='Duelo'?adcDueloRelation():null;
 if(selected==='Duelo'&&(!dueloRelation||$('pago').value!=='con'||r.rows.some(({e})=>!adcDueloCode(e.revista,dueloRelation)[0])))
  return alert('Revisá el parentesco, la situación de revista y la forma de pago antes de generar el permiso por Duelo.');
 if(adcPDFRequest?.url)URL.revokeObjectURL(adcPDFRequest.url);
 $('pdfResult').replaceChildren();
 const request={key:adcPDFRequestKey(),url:null};
 adcPDFRequest=request;
 const historyDni=adcPersonalDigits($('dni').value);
 const historyReason=selected, historyPay=$('pago').value;
 const historyUnit=(r.i?.name||'').trim();
 const historyDates={desde:$('desde').value,hasta:$('hasta').value};
 const historyRecords=r.rows.map(({e})=>{
  const [,ref]=historyReason==='Duelo'?adcDueloCode(e.revista,dueloRelation):mapping(e,historyReason,historyPay), [articulo,inciso='']=ref.split('-');
  return {articulo,inciso,motivo:dj02Motivo(historyReason),...historyDates,unidad:historyUnit,disposicion:''};
 });
 try{
  const {PDFDocument,StandardFonts,rgb}=PDFLib, ink=rgb(0,0,0);
  const out=await PDFDocument.create(),font=await out.embedFont(StandardFonts.HelveticaBold);
  const name=splitName($('nombre').value),clarification=[name.given,name.surname].filter(Boolean).join(' ');
  const H=1008.12;
  // All coordinates in original PDF points from upper left, verified against red-box guides.
  function text(page,rect,value,sz=10,left=false){let t=pdfText(value);if(!t)return;
   // PDF standard font does not support arbitrary Unicode; normalize for the prototype.
   t=t.replace(/[^\x20-\x7E\xA0-\xFF]/g,'');
   let size=sz;while(size>5.5&&font.widthOfTextAtSize(t,size)>rect[2]-4)size-=0.25;
   const width=font.widthOfTextAtSize(t,size);
   if(left&&width>rect[2]-4)size*=(rect[2]-4)/width;
   const x=left?rect[0]+2:rect[0]+(rect[2]-width)/2;
   let top=rect[1]+(rect[3]-size)/2+0.5;
   page.drawText(t,{x,y:H-top-size,font,size,color:ink});
  }
  function crossBox(page,r){let pad=2.2;const line={color:ink,thickness:1.6};page.drawLine({start:{x:r[0]+pad,y:H-r[1]-pad},end:{x:r[0]+r[2]-pad,y:H-r[1]-r[3]+pad},...line});page.drawLine({start:{x:r[0]+pad,y:H-r[1]-r[3]+pad},end:{x:r[0]+r[2]-pad,y:H-r[1]-pad},...line})}
  function dash(page,r){const h=Number.isFinite(r[3])?r[3]:13.3;const y=H-r[1]-h/2;page.drawLine({start:{x:r[0]+3,y},end:{x:r[0]+r[2]-3,y},color:ink,thickness:1.4})}
  function unused(page,top,bottom){page.drawLine({start:{x:39,y:H-top},end:{x:590,y:H-bottom},color:ink,thickness:2});page.drawLine({start:{x:39,y:H-bottom},end:{x:590,y:H-top},color:ink,thickness:2})}
  function rect(x,y,w,h=13.3){return [x,y,w,h]}
  // Cada plantilla tiene celdas diferentes. Se elige el diseño explícitamente,
  // nunca por la posición Y (que cambia según el bloque/cargo).
  function dateCells(page,dateValue,x,y,layout){
   if(!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue))return;
   const [yr,mo,day]=dateValue.split('-');
   const specs={
    periodoUna:[[0,0,24.5,13.3],[28.4,0,19.2,13.3],[53,0.7,46,13.3]],
    periodoDos:[[0,0,26,13.3],[32.4,0.7,26,13.3],[63,0,56.8,13.3]],
    pieUna:[[0,0,15.7,13.3],[22.1,0,13.9,13.3],[40.6,0,34,14]],
    pieDos:[[0,0,26,13.3],[32.4,0.7,26,13.3],[63.1,0,56.8,13.3]]
   };
   const cells=specs[layout];if(!cells)throw Error('Formato de fecha desconocido: '+layout);
   [day,mo,yr].forEach((v,i)=>{const [dx,dy,w,h]=cells[i];text(page,rect(x+dx,y+dy+0.5,w,h-0.5),v,10)});
  }

  function fillSlot(page,two,slot,obj){const e=obj.e,c=window.adcAcademic.parts(e),legal=dueloRelation?adcDueloCode(e.revista,dueloRelation):mapping(e),kind=classify();
   const description=kind==='inasistencia'?'Justificada':selected==='Exámenes'?'LIC. X EXAMEN':selected;
   const cargo=e.type==='cargo',codigoCargo=dl01CodigoCargo(e,r.i);
   function courseField(box,value){
    if(cargo)dash(page,box);
    else text(page,box,value);
   }
   const y=slot.y,dx=slot.dx||0; // each row has its own measured offset
   if(two){
    text(page,rect(166.4+dx,y,94.9),codigoCargo);
    text(page,rect(337.5+dx,y-.5,221.6),'Hs. Cátedras');
    courseField(rect(72.6+dx,y+19.2,38.7),ordinalDL01(c.year,'year'));
    courseField(rect(229.4+dx,y+19.2,92.8),ordinalDL01(c.division,'division'));
    text(page,rect(376.5+dx,y+19.2,70.7),turnoNormalizado(e.turno)||'Sin definir',9);
    courseField(rect(532.1+dx,y+19.2,43.2),obj.h);
    text(page,rect(113.7+dx,y+39,392.1),cargo?e.cargoName:e.subject,9.5,cargo||selected==='Asuntos particulares');
    let status={Titular:[227.6,61.5],Interino:[316.1,62.2],Suplente:[413.7,61.5]};
    if(status[e.revista])crossBox(page,rect(status[e.revista][0]+dx,y+status[e.revista][1],14.4));
    const rows={licencia:[77.7,78.2],permiso:[95.7,97.6],inasistencia:[118.5,118.5]};
    let z=rows[kind]||rows.licencia;
    text(page,rect((kind==='inasistencia'?169.6:162.6)+dx,y+z[0],49.6),legal[0]);
    text(page,rect((kind==='inasistencia'?256.7:265.5)+dx,y+z[1],kind==='inasistencia'?39.6:47.4),legal[1]);
    text(page,rect((kind==='inasistencia'?361.9:393.9)+dx,y+z[1],kind==='inasistencia'?90.9:153.4),description,kind==='permiso'&&description==='Duelo'?12:description==='Asuntos particulares'?10.5:8.5);
    if(kind!=='licencia')for(let rr of [[162.6+dx,y+77.7,49.6],[265.5+dx,y+78.2,47.4],[393.9+dx,y+78.2,153.4]])dash(page,rr);
    if(kind!=='permiso')for(let rr of [[160.9+dx,y+95.7,57.9],[262.8+dx,y+97.6,59.4],[391.3+dx,y+97.6,166.9]])dash(page,rr);
    if(kind!=='inasistencia')for(let rr of [[176.3+dx,y+118.5,38.9],[256.7+dx,y+118.5,39.6],[361.9+dx,y+118.1,90.9]])dash(page,rr);
    if(kind==='inasistencia'&&$('justifica').value)crossBox(page,rect(($('justifica').value==='si'?518.2:555.5)+dx,y+121,14.3));
    let pay={con:255.4,sin:403.2,medio:550.2};if(pay[$('pago').value]!==undefined)crossBox(page,rect(pay[$('pago').value]+dx,y+141,14.3));
    dateCells(page,$('desde').value,204.4+dx,y+158.9,'periodoDos');
    dateCells(page,$('hasta').value,377.2+dx,y+158.1,'periodoDos');
   }else{
    text(page,rect(142.4+dx,y,83.7),codigoCargo);
    text(page,rect(288.7+dx,y,174.2),'Hs. Cátedras');
    courseField(rect(64.3+dx,y+17.4,38.7),ordinalDL01(c.year,'year'));
    courseField(rect(198.2+dx,y+18.2,81.4),ordinalDL01(c.division,'division'));
    text(page,rect(318+dx,y+17.4,65.5),turnoNormalizado(e.turno)||'Sin definir',9);
    courseField(rect(448.9+dx,y+18.2,43.2),obj.h);
    text(page,rect(96+dx,y+35.4,392.1),cargo?e.cargoName:e.subject,9.5,cargo||selected==='Asuntos particulares');
    let status={Titular:196.1,Interino:268.5,Suplente:350.4};if(status[e.revista]!==undefined)crossBox(page,rect(status[e.revista]+dx,y+56.7,14.4));
    const row=kind==='licencia'?70:kind==='permiso'?88:105;
    text(page,rect((kind==='inasistencia'?145.6:138.6)+dx,y+row,49.6),legal[0]);text(page,rect((kind==='inasistencia'?233.8:226.1)+dx,y+row,kind==='inasistencia'?47.2:47.4),legal[1]);text(page,rect((kind==='inasistencia'?337.1:333.9)+dx,y+row,kind==='inasistencia'?90.9:153.4),description,kind==='permiso'&&description==='Duelo'?12:description==='Asuntos particulares'?10.5:8.5);
    if(kind!=='licencia')for(let rr of [[138.6+dx,y+70,49.6],[226.1+dx,y+70,47.4],[333.9+dx,y+70.5,153.4]])dash(page,rr);
    if(kind!=='permiso')for(let rr of [[136.9+dx,y+88,49.6],[224.9+dx,y+88.5,47.4],[333.9+dx,y+88.5,153.4]])dash(page,rr);
    if(kind!=='inasistencia')for(let rr of [[154.1+dx,y+105.7,42.4],[233.8+dx,y+105.7,47.4],[337.1+dx,y+105.2,90.9]])dash(page,rr);
    if(kind==='inasistencia'&&$('justifica').value)crossBox(page,rect(($('justifica').value==='si'?489.2:522)+dx,y+108.8,14.4));
    let pay={con:218.3,sin:341.1,medio:462.9};if(pay[$('pago').value]!==undefined)crossBox(page,rect(pay[$('pago').value]+dx,y+126.5,14.4));
    dateCells(page,$('desde').value,176.6+dx,y+142.5,'periodoUna');
    dateCells(page,$('hasta').value,319.9+dx,y+142.5,'periodoUna');
   }
  }
  let pagesGenerated=0,warnings=[];
  for(let start=0;start<Math.max(1,r.rows.length);start+=5){
   let batch=r.rows.slice(start,start+5),two=batch.length>2;
   let template=await PDFDocument.load(bytes(two?TEMPLATE_TWO:TEMPLATE_ONE));
   let copied=await out.copyPages(template,two?[0,1]:[0]);let pgs=copied.map(p=>out.addPage(p));
   let p=pgs[0];
   if(two){text(p,rect(268.2,156.4,203.6),name.surname);text(p,rect(91.9,176.9,224.6),name.given);text(p,rect(79.2,197.8,207.9),$('dni').value.replace(/\D/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.'));text(p,rect(138.5,218,213.5),r.i.office);text(p,rect(143.8,238.2,212),r.i.name);text(p,rect(455.1,239.1,128.1),r.i.level);if($('sexo').value)crossBox(p,rect($('sexo').value==='F'?363.3:400.5,201,14.4));}
   else{text(p,rect(231.4,174.5,203.6),name.surname);text(p,rect(89.3,192.7,191.2),name.given);text(p,rect(76.9,209.8,152),$('dni').value.replace(/\D/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.'));text(p,rect(119.3,226.6,175.7),r.i.office);text(p,rect(129.1,243.8,167.8),r.i.name);text(p,rect(385.4,244.8,107.1),r.i.level);if($('sexo').value)crossBox(p,rect($('sexo').value==='F'?307.4:340.1,213.4,14.4));}
   const slots=two?[{pi:0,y:292.5,dx:0},{pi:0,y:511.9,dx:-.5},{pi:0,y:732,dx:0},{pi:1,y:37.9,dx:-.1},{pi:1,y:261.3,dx:0}]:[{pi:0,y:295,dx:0},{pi:0,y:508.9,dx:0}];
   batch.forEach((obj,k)=>{
    // ISO dates are calculated from the actual scheduled weekdays, not inferred from total period.
    let a=date($('desde').value),b=date($('hasta').value),days=[];
    for(let day=new Date(a);day<=b;day.setDate(day.getDate()+1)){let w=(day.getDay()+6)%7;if(w<5&&Number(obj.e.schedule[w]||0)>0)days.push([day.getFullYear(),String(day.getMonth()+1).padStart(2,'0'),String(day.getDate()).padStart(2,'0')].join('-'))}
    fillSlot(pgs[slots[k].pi],two,slots[k],{...obj,datesISO:days});
   });
   // All completely unused cargo blocks receive the two large diagonal strokes.
   for(let k=batch.length;k<slots.length;k++){let slot=slots[k];if(two){let ranges=[[725,911],[29,231],[252,454]];let range=k===2?ranges[0]:k===3?ranges[1]:ranges[2];unused(pgs[slot.pi],...range)}else{unused(pgs[0],487,683)}}
   let last=pgs[pgs.length-1];
   if(two){dateCells(last,calendarSnapshot?.values.presentacion??$('presentacion').value,77.5,815.5,'pieDos');text(last,rect(347.5,865.1,201.4,18.2),clarification)}
   else{dateCells(last,calendarSnapshot?.values.presentacion??$('presentacion').value,75.3,782.8,'pieUna');text(last,rect(334.6,810.6,153.5,18.2),clarification)}
   pagesGenerated+=pgs.length;
  }
  if($('sexo').value==='M')warnings.push('La leyenda impresa «Apellido de soltera» sigue en el PDF original. Se requiere una plantilla masculina limpia para eliminarla sin tapar otros elementos.');
  const pdf=await out.save();
  adcInvalidatePDF();
  if(adcPDFRequest!==request)return;
  const url=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));
  request.url=url;
  $('pdfResult').innerHTML=`<div class="status" style="margin-top:12px"><b>PDF generado: ${pagesGenerated} página(s).</b><br><a id="downloadPDF" download="DL01_borrador_docente_v097.pdf" href="${url}">Descargar formulario DL-01 completado</a><p class="small">Calibración v0.9.7 sobre plantilla original. Revisar códigos y datos antes de presentar.</p></div>${warnings.map(w=>'<div class="warning">'+esc(w)+'</div>').join('')}<iframe id="preview" title="Vista previa DL-01"></iframe>`;
  if(calendarSnapshot)window.adcStoreIssuedDates?.(calendarSnapshot);
  if(historyReason==='Inasistencias (justificada)'){
   const note=document.createElement('p');
   note.className='warning';
   note.textContent='Las inasistencias justificadas quedan fuera del registro del DJ-02.';
   $('downloadPDF').after(note);
  }else if(historyReason&&historyUnit&&historyRecords.length){
   const unique=historyRecords.filter((record,index)=>historyRecords.findIndex(other=>dj02SameRecord(record,other))===index);
   const draft={id:JSON.stringify([historyDni,unique]),dni:historyDni,records:unique};
   try{
    const stored=dj02Stored();
    const pending=stored.pending||[];
    if(!pending.some(item=>item.id===draft.id)&&!unique.every(record=>(stored.rows||[]).some(row=>dj02SameRecord(row,record)))){
     localStorage.setItem('adc_dj02_v1',JSON.stringify({...stored,pending:[...pending,draft]}));
    }
   }catch(e){
    const warning=document.createElement('p');
    warning.textContent='El trámite no pudo guardarse como pendiente en este navegador.';
    $('downloadPDF').after(warning);
   }
   const note=document.createElement('p');note.className='small';
   note.textContent='Revisá esta solicitud en DJ-02 y confirmala cuando la licencia haya sido otorgada.';
   const link=document.createElement('button');link.type='button';link.className='alt';link.textContent='Revisar en DJ-02';
   link.onclick=()=>tab('dj02');
   $('downloadPDF').after(note,link);
  }
  $('preview').src=url;
 }catch(e){console.error(e);alert('No se pudo generar el PDF: '+e.message)}
}


