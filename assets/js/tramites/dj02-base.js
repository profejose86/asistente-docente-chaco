
/* DJ-02 19m: datos aislados; sin interferencia en DJ-01 ni DL-01. */
const dj02Fields=['Apellido','Nombre','Dni','Sexo','Domicilio','Localidad','Titulo','Otorgado','Registro','Clase','Antiguedad','Presentada'];
let dj02Records=[];let dj02Loaded=false;
function dj02Val(k){return document.getElementById('dj02'+k)?.value||''}
function dj02Set(k,v){const e=document.getElementById('dj02'+k);if(e)e.value=v||''}
function dj02FromProfile(){const name=document.getElementById('nombre')?.value||'';const parts=name.split(',');dj02Set('Apellido',parts.length>1?parts[0].trim():'');dj02Set('Nombre',parts.length>1?parts.slice(1).join(',').trim():name.trim());for(const [a,b] of Object.entries({Dni:'dni',Sexo:'sexo',Domicilio:'perfilDomicilio',Localidad:'perfilLocalidad',Titulo:'perfilTitulo',Otorgado:'perfilOtorgado',Registro:'perfilRegistro',Clase:'perfilClase',Antiguedad:'perfilAntiguedadVista'}))dj02Set(a,document.getElementById(b)?.value||'');dj02Render()}
function dj02Open(){if(!dj02Loaded){dj02Loaded=true;try{const d=JSON.parse(localStorage.getItem('adc_dj02_v1')||'null');if(d){dj02Fields.forEach(k=>dj02Set(k,d.fields?.[k]));dj02Records=Array.isArray(d.rows)?d.rows:[];}else dj02FromProfile()}catch(e){dj02FromProfile()}}dj02Render()}
function dj02Add(){const unidad=$('dj02HistoryFilter').value;dj02Records.push({articulo:'',inciso:'',motivo:'',desde:'',hasta:'',disposicion:'',unidad});dj02Render()}
function dj02Change(i,k,v){const row=dj02Records[i];
 if(!row)return;
 if((k==='motivo'||k==='unidad')&&row[k]!==v&&row.catalogoDJ02){
  Object.assign(row,{articulo:'',inciso:'',catalogoDJ02:false});
  const fields=$('dj02Rows').querySelector('[data-row="'+i+'"]');
  if(fields)for(const key of ['articulo','inciso'])fields.querySelector('[data-field="'+key+'"]').value='';
 }
 if(k==='articulo'||k==='inciso')row.catalogoDJ02=false;
 row[k]=v;dj02Preview();
 const notice=$('dj02Rows').querySelector('[data-row="'+i+'"] .dj02-exam-link');
 if(notice)notice.hidden=norm(row.motivo)!=='examenes'||!dj02ExamCargos(row.unidad).length;}
function dj02Remove(i){dj02Records.splice(i,1);dj02Render()}
function dj02Institutions(){
 return [...new Set(inst.map(i=>String(i.name||'').trim()).filter(Boolean))];
}
function dj02Options(values,placeholder,current){
 const options=[new Option(placeholder,''),...values.map(value=>new Option(value,value))];
 if(current&&!values.includes(current))options.push(new Option(current+' (guardada anteriormente)',current));
 return options;
}
function dj02Motivo(reason){
 return reason==='Enfermedad o lesión común'?'Licencia por lesión o enfermedad común':reason;
}
function dj02Distance(a,b){
 let row=Array.from({length:b.length+1},(_,i)=>i);
 for(const [i,char] of [...a].entries()){
  const next=[i+1];
  for(const [j,other] of [...b].entries())next.push(Math.min(next[j]+1,row[j+1]+1,row[j]+Number(char!==other)));
  row=next;
 }
 return row[b.length];
}
function dj02Suggestions(input,i){
 const query=norm(input.value).match(/[a-z0-9]+/g)||[];
 const box=input.parentElement.querySelector('.dj02-matches');
 const unit=dj02Records[i].unidad;
 const statuses=[...new Set(inst.filter(school=>school.name.trim()===unit).flatMap(school=>school.entries.map(entry=>entry.revista)).filter(status=>['Titular','Interino','Suplente'].includes(status)))];
 const matches=query.length?tramites.filter(([reason,category,keywords])=>{
  const words=norm([dj02Motivo(reason),reason,category,keywords].join(' ')).match(/[a-z0-9]+/g)||[];
  return query.every(term=>words.some(word=>word.startsWith(term)||(term.length>=4&&dj02Distance(word,term)<=1)));
 }):[];
 box.replaceChildren(...matches.flatMap(([reason])=>{
  const variants=statuses.flatMap(revista=>{
   const refs=['con','sin'].map(pay=>mapping({revista},reason,pay)[1]);
   return [...new Set(refs.filter(Boolean))].map(ref=>[ref,revista]);
  });
  return (variants.length?variants:[['','']]).map(([ref,revista])=>{
   const button=document.createElement('button');
   button.type='button';
   button.className='alt';
   button.textContent=dj02Motivo(reason)+(ref?' · '+ref+(statuses.length>1?' · '+revista:''):'');
   button.onclick=()=>dj02SelectMotivo(i,JSON.stringify([reason,ref]));
   return button;
  });
 }));
 box.hidden=!matches.length;
}
function dj02ExamCargos(unidad){
 if(!unidad)return [];
 return inst.filter(school=>school.name.trim()===unidad.trim()).flatMap(school=>
  school.entries.filter(entry=>entry.revista==='Suplente').map(entry=>({school,entry})));
}
function dj02ExamNotice(i){
 const cargos=dj02ExamCargos(dj02Records[i]?.unidad);
 if(!cargos.length)return;
 const dialog=$('dj02ExamDialog');
 $('dj02ExamCargos').replaceChildren(...cargos.map(({school,entry})=>{
  const button=document.createElement('button');
  button.type='button';
  button.className='alt';
  const label=entry.cargoName||[entry.subject,entry.course].filter(Boolean).join(' ')||'Cargo suplente';
  button.textContent='Verificar situación de revista · '+label;
  button.onclick=()=>{
   dialog.close();
   tab('profile');
   const panel=document.querySelector('[data-inst-panel="'+school.id+'"]');
   if(panel?.hidden)perfilToggleInstitucion(school.id);
   const cargo=panel?.querySelector('[data-cargo-panel="'+CSS.escape(entry.djUid)+'"]');
   if(cargo?.hidden)perfilToggleCargo(entry.djUid);
   const target=cargo?.querySelector('[data-revista-i]')||cargo||panel;
   target?.scrollIntoView({block:'center'});
   target?.focus();
   const back=document.createElement('button');
   back.type='button';
   back.className='alt';
   back.id='dj02ReturnFromProfile';
   back.textContent='Volver al antecedente del DJ-02';
   $(back.id)?.remove();
   back.onclick=()=>{
    back.remove();
    tab('dj02');
    $('dj02Rows').querySelector('[data-row="'+i+'"] [data-field="motivo"]')?.focus();
   };
   $('profile').prepend(back);
  };
  return button;
 }));
 if(!dialog.open)dialog.showModal();
}
function dj02SelectMotivo(i,value){
 if(!value||!dj02Records[i])return;
 const [reason,ref]=JSON.parse(value), [article,inciso='']=ref.split('-');
 Object.assign(dj02Records[i],{motivo:dj02Motivo(reason),articulo:article,inciso,catalogoDJ02:true});
 dj02Render();
 if(reason==='Exámenes')dj02ExamNotice(i);
}
function dj02Render(){
 const el=$('dj02Rows'), filter=$('dj02HistoryFilter'), institutionNames=dj02Institutions();
 const historyNames=[...new Set([...institutionNames,...dj02Records.map(r=>r.unidad).filter(Boolean)])];
 const previous=filter.value;
 filter.replaceChildren(...dj02Options(historyNames,'Todas las instituciones',previous));
 filter.value=previous;
 $('dj02Instituciones').replaceChildren(...institutionNames.map(name=>new Option(name,name)));
 const columns=[['articulo','Artículo','text'],['inciso','Descripción / inciso','text'],['motivo','Motivo','text'],['desde','Desde','date'],['hasta','Hasta','date'],['disposicion','Disposición N.º','text'],['unidad','Unidad educativa','text']];
 el.innerHTML=dj02Records.map((r,i)=>{
  if(previous&&r.unidad!==previous)return '';
  return '<div class="dj02-entry" data-row="'+i+'">'+columns.map(([key,label,type])=>{
   const attrs={motivo:' placeholder="Escribí tu motivo"',disposicion:' placeholder="Completá si ya tenés la disposición"',unidad:' list="dj02Instituciones"'};
   const extra=key==='motivo'?'<span class="dj02-matches" role="group" aria-label="Coincidencias del nomenclador" hidden></span>':'';
   const update=key==='motivo'?';dj02Suggestions(this,'+i+')':key==='unidad'?';dj02Suggestions(this.closest(&quot;.dj02-entry&quot;).querySelector(&quot;[data-field=motivo]&quot;),'+i+')':'';

   return '<label>'+label+'<input data-field="'+key+'" type="'+type+'" value="'+esc(r[key]||'')+'"'+(attrs[key]||'')+' oninput="dj02Change('+i+',&quot;'+key+'&quot;,this.value)'+update+'">'+extra+'</label>'+(key==='motivo'?'<button type="button" class="alt dj02-exam-link" '+(norm(r.motivo||'')==='examenes'&&dj02ExamCargos(r.unidad).length?'':'hidden ')+'onclick="dj02ExamNotice('+i+')">Revisar aviso de exámenes</button>':'');
  }).join('')+'<button class="danger" type="button" title="Quitar antecedente" onclick="dj02Remove('+i+')">×</button></div>';
 }).join('')||'<p class="small">Todavía no hay antecedentes para esta selección.</p>';
 dj02RenderPending();
 dj02Preview();
}
function dj02Stored(){
 try{return JSON.parse(localStorage.getItem('adc_dj02_v1')||'null')||{}}
 catch(e){return {}}
}
function dj02SameRecord(row,record){
 return ['articulo','inciso','motivo','desde','hasta','unidad'].every(k=>String(row[k]||'').trim()===record[k]);
}
function dj02ExcludedPending(draft){
 return draft.records.some(record=>/^inasistencias?\s*(?:\(justificada\)|justificada)$/i.test(String(record.motivo||'').trim()));
}
function dj02RenderPending(){
 const root=$('dj02Pending'), dni=adcPersonalDigits($('dni').value), filter=$('dj02HistoryFilter').value;
 root.replaceChildren();
 for(const draft of (dj02Stored().pending||[])){
  if(adcPersonalDigits(draft.dni)!==dni||!draft.records.length||dj02ExcludedPending(draft))continue;
  const {motivo,unidad,desde,hasta}=draft.records[0];
  if(filter&&filter!==unidad)continue;
  const line=document.createElement('p'), button=document.createElement('button');
  line.textContent='DL-01 pendiente de confirmación · '+motivo+' · '+unidad+' · '+dj02Date(desde)+' al '+dj02Date(hasta)+' ';
  button.type='button';
  button.className='alt';
  button.textContent='Confirmar como otorgada';
  button.onclick=()=>dj02ConfirmDL01(button,draft);
  line.append(button);
  root.append(line);
 }
}
function dj02ConfirmDL01(button,draft){
 if(dj02ExcludedPending(draft))return alert('Las inasistencias justificadas quedan fuera del DJ-02.');
 if(adcPersonalDigits(draft.dni)!==adcPersonalDigits($('dni').value))return alert('El perfil cambió. Volvé a generar el DL-01.');
 if(!confirm('¿Confirmás que esta licencia fue otorgada? Se guardará en los antecedentes del DJ-02.'))return;
 dj02Open();
 const fields=Object.fromEntries(dj02Fields.map(k=>[k,dj02Val(k)]));
 const rows=[...dj02Records];
 for(const record of draft.records){
  if(!rows.some(row=>dj02SameRecord(row,record)))rows.push(record);
 }
 try{
  const stored=dj02Stored();
  const pending=(stored.pending||[]).filter(item=>item.id!==draft.id);
  localStorage.setItem('adc_dj02_v1',JSON.stringify({...stored,fields,rows,pending}));
 }catch(e){return alert('No se pudo guardar el antecedente en este navegador.')}
 dj02Records=rows;
 dj02Render();
 button.disabled=true;
 button.textContent='Licencia otorgada · guardada en DJ-02';
}
function dj02Preview(){const el=document.getElementById('dj02Preview');if(!el)return;const safe=v=>esc(v||'');const names=dj02Fields.map(k=>'<strong>'+({Dni:'DNI',Titulo:'Título',Otorgado:'Otorgado por',Registro:'N.º de registro',Antiguedad:'Antigüedad',Presentada:'Presentada ante'}[k]||k)+':</strong> '+safe(dj02Val(k))).join(' &nbsp; | &nbsp; ');el.innerHTML='<div style="text-align:center"><strong>PROVINCIA DEL CHACO — FORMULARIO DJ-02</strong><h3>DECLARACIÓN JURADA DE LICENCIAS</h3><p>DECLARO BAJO JURAMENTO QUE LOS DATOS CONSIGNADOS SEGUIDAMENTE SON CIERTOS</p></div><p style="line-height:2">'+names+'</p><table><thead><tr><th>Artículo</th><th>Descripción</th><th>Motivos de la licencia</th><th>Desde</th><th>Hasta</th><th>Resolución / Disposición N.º</th><th>Unidad educativa</th></tr></thead><tbody>'+dj02Records.map(r=>'<tr>'+['articulo','inciso','motivo','desde','hasta','disposicion','unidad'].map(k=>'<td>'+safe(r[k])+'</td>').join('')+'</tr>').join('')+'</tbody></table><p style="margin-top:45px;text-align:center">____________________________<br>FIRMA DEL DOCENTE</p>'}
function dj02Save(){const fields=Object.fromEntries(dj02Fields.map(k=>[k,dj02Val(k)]));try{localStorage.setItem('adc_dj02_v1',JSON.stringify({...dj02Stored(),fields,rows:dj02Records}));alert('DJ-02 guardado en este navegador.')}catch(e){alert('No se pudo guardar el DJ-02. Exportá tus datos por otro medio.')}}
function dj02Print(){dj02Preview();if(!adcCheckDJ02Print())return;document.body.classList.add('dj02-print-mode');window.print();setTimeout(()=>document.body.classList.remove('dj02-print-mode'),1200)}
window.addEventListener('afterprint',()=>document.body.classList.remove('dj02-print-mode'));
