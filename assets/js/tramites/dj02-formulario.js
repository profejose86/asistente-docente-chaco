
/* 19p: full DOM reconstruction; text auto-fits to the real dimensions of each cell. */
(function(){
 const safe=v=>esc(String(v??''));
 const fld=(label,key,tall=false,sub='')=>'<div class="dj02-person-line'+(tall?' dj02-tall':'')+'"><label>'+label+'</label><div class="dj02-person-value">'+dj02Rect(0,0,100,100,dj02Val(key),'dj02-person dj02-fit')+'</div>'+(sub?'<small>'+sub+'</small>':'')+'</div>';
 function makeCell(r,k){let v=r[k]||'';if(k==='desde'||k==='hasta')v=dj02Date(v);return '<td><div class="dj02-cell dj02-fit '+(k==='motivo'?'dj02-motivo ':'')+'" title="'+safe(v)+'">'+safe(v)+'</div></td>'}
 function render(){
  const el=document.getElementById('dj02Preview');if(!el)return;
  const recipient=$('dj02Presentada'), institutions=dj02Institutions();
  const current=recipient.value;
  recipient.replaceChildren(...dj02Options(institutions,'Seleccioná una institución',current));
  recipient.value=current||(institutions.length===1?institutions[0]:'');
  dj02MissingNotice();
  const keys=['articulo','inciso','motivo','desde','hasta','disposicion','unidad'];
  let rows='';for(let i=0;i<14;i++){const r=dj02Records[i]||{};rows+='<tr>'+keys.map(k=>makeCell(r,k)).join('')+'</tr>'}
  el.innerHTML='<div class="dj02-paper">'+
  '<div class="dj02-native-header"><div>PROVINCIA DEL CHACO<br>MINISTERIO DE EDUCACIÓN, CULTURA, CIENCIA Y TECNOLOGÍA</div><div class="dj02-title">FORMULARIO DJ-02<br>DECLARACIÓN JURADA DE LICENCIAS</div></div>'+
  '<div class="dj02-oath">DECLARO BAJO JURAMENTO QUE LOS DATOS CONSIGNADOS SEGUIDAMENTE SON CIERTOS:</div>'+
  '<div class="dj02-formarea"><div class="dj02-personal"><h4>Declaración Jurada de:</h4>'+
  fld('Apellido/s:','Apellido',true,'(Si es mujer, apellido de soltera)')+fld('Nombre/s:','Nombre')+fld('D.N.I. N.º:','Dni')+fld('Sexo:','Sexo')+fld('Domicilio:','Domicilio')+fld('Localidad:','Localidad')+fld('Título que posee:','Titulo',true)+fld('Otorgado por:','Otorgado')+
  '<div style="display:flex;gap:7px">'+fld('N.º de Registro:','Registro')+fld('Clase:','Clase')+'</div>'+fld('Antigüedad:','Antiguedad')+fld('Presentada ante:','Presentada')+'<div class="dj02-venue">Establecimiento<br>en el que se entrega</div></div>'+
  '<table class="dj02-license-table"><colgroup><col style="width:8%"><col style="width:12%"><col style="width:30%"><col style="width:10%"><col style="width:10%"><col style="width:13%"><col style="width:17%"></colgroup><thead><tr><th colspan="2">Licencias relacionadas con el pedido,<br>otorgadas con anterioridad</th><th rowspan="2">Motivos de la licencia</th><th rowspan="2">Desde<br>Fecha</th><th rowspan="2">Hasta<br>Fecha</th><th rowspan="2">Resolución /<br>Disposición N.º</th><th rowspan="2">Unidad Educativa</th></tr><tr><th>Artículo</th><th>Descripción</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
  '<div class="dj02-footer"><div class="dj02-sign">____________________________<br>FIRMA DEL DOCENTE</div><div class="dj02-warning">La no declaración de licencias determinará la aplicación de sanciones establecidas en la Ley específica en vigencia.</div></div></div>';
  adcCheckDJ02Print();
  const warn=document.getElementById('dj02Overflow');if(warn)warn.textContent=dj02Records.length>14?'ATENCIÓN: hay '+dj02Records.length+' antecedentes, pero el DJ-02 tiene 14 renglones. Los excedentes no se imprimirán; no presentes este formulario hasta resolver la continuación.':'';
  requestAnimationFrame(()=>fitAll(el));
 }
 function fitAll(el){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
  el.querySelectorAll('.dj02-fit').forEach(node=>{
   const text=node.textContent.trim();if(!text)return;
   const rect=node.getBoundingClientRect();const availableWidth=Math.max(5,rect.width-5),availableHeight=Math.max(6,rect.height-3);
   const personal=node.classList.contains('dj02-person');
   const start=personal?16:13,min=personal?8:7;
   let chosen=min,lines=1;
   for(let fs=start;fs>=min;fs-=.5){
    ctx.font='700 '+fs+'px Arial';const words=text.split(/\s+/);let line='',count=1,tooWide=false;
    for(const word of words){const trial=line?line+' '+word:word;
     if(ctx.measureText(trial).width<=availableWidth){line=trial;continue}
     if(ctx.measureText(word).width>availableWidth){tooWide=true;break}
     count++;line=word;
    }
    if(!tooWide&&count*fs*1.12<=availableHeight){chosen=fs;lines=count;break}
   }
   node.style.fontSize=chosen+'px';node.style.lineHeight='1.12';node.style.whiteSpace='normal';node.style.overflowWrap='anywhere';
   if(ctx.measureText(text).width>availableWidth&&chosen===min&&lines===1)node.title='Texto extenso: '+text;
  });
 }
 window.dj02Preview=render;
 window.addEventListener('beforeprint',()=>{const el=document.getElementById('dj02Preview');if(el)fitAll(el)});
})();
