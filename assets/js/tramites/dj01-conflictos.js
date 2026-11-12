
/* v0.9.16.18: decisiones por conflicto, colores y recuadros de edición. */
(function(){
 const EXAM_MESSAGE='Trámite no disponible. No corresponde a docentes suplentes. La licencia por exámenes es para titulares e interinos.';
 const palette=['#dc2626','#7c3aed','#0369a1','#b45309','#0f766e','#be185d'];
 const time=t=>/^\d{2}:\d{2}$/.test(t||'')?Number(t.slice(0,2))*60+Number(t.slice(3)):null;
 const rawKey='adc_v091618_ack';
 let acknowledgements={};try{acknowledgements=JSON.parse(localStorage.getItem(rawKey)||'{}')||{}}catch(e){}
 const escHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const allEntries=()=>typeof djEntries==='function'?djEntries():[];
 const intervalSignature=(v)=>[Number(v.day),v.start||'',v.end||''].join(':');
 function conflicts(){
  const groups=new Map(),result=[];
  allEntries().forEach(x=>(x.e.djIntervals||[]).forEach((v,index)=>{
   const a=time(v.start),b=time(v.end);if(a===null||b===null||b<=a)return;
   const rawDay=String(v.day??'').trim();if(!/^[0-6]$/.test(rawDay))return;const day=Number(rawDay);if(!groups.has(day))groups.set(day,[]);
   groups.get(day).push({uid:x.key,index,day,a,b,aLabel:(v.start||'')+'–'+(v.end||''),signature:intervalSignature(v),isCargo:x.e.type==='cargo'});
  }));
  const make=(type,day,a,b,minutes)=>{
   const ends=[a,b].map(v=>v.uid+'@'+v.index+'@'+v.signature);
   const id=type+'|'+day+'|'+ends.slice().sort().join('|');
   result.push({type,day,a,b,minutes,id});
  };
  for(const [day,rows] of groups){
   rows.sort((a,b)=>a.a-b.a||a.b-b.b||a.uid.localeCompare(b.uid));
   for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
    if(rows[j].a>=rows[i].b)break;
    const mins=Math.min(rows[i].b,rows[j].b)-rows[j].a;
    if(mins>0 && !(rows[i].uid===rows[j].uid&&rows[i].a===rows[j].a&&rows[i].b===rows[j].b))make('overlap',day,rows[i],rows[j],mins);
   }
   for(const v of rows){
     if(!v.isCargo&&v.b-v.a!==40)make('duration',day,v,v,v.b-v.a);
   }
   for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
     if(rows[i].uid===rows[j].uid&&rows[i].a===rows[j].a&&rows[i].b===rows[j].b)make('duplicate',day,rows[i],rows[j],0);
   }
   const byCargo=new Map();for(const v of rows){if(!byCargo.has(v.uid))byCargo.set(v.uid,[]);byCargo.get(v.uid).push(v)}
   for(const entries of byCargo.values())for(let i=1;i<entries.length;i++){
    const previous=entries.slice(0,i).reduce((best,v)=>!best||v.b>best.b?v:best,null);
    const gap=entries[i].a-previous.b;
    if(gap>60)make('gap',day,previous,entries[i],gap);
   }
  }
  result.sort((a,b)=>a.day-b.day||a.a.a-b.a.a||a.b.a-b.b.a||a.type.localeCompare(b.type));
  const counts={overlap:0,duration:0,gap:0,duplicate:0};for(const c of result){const prefix={overlap:'C',duration:'D',gap:'S',duplicate:'R'}[c.type];c.label=prefix+(++counts[c.type])}
  return result;
 }
 function active(){return conflicts().filter(c=>!acknowledgements[c.id])}
 function saveAcknowledgement(id){acknowledgements[id]=true;localStorage.setItem(rawKey,JSON.stringify(acknowledgements));paint()}
 function mark(host){if(!host)return;let el=host.querySelector(':scope > .adc-conflict-badge');if(!el){el=document.createElement('span');el.className='adc-conflict-badge';el.textContent='❗';el.title='Hay advertencias de horarios pendientes';host.append(el)}}
 function clear(){document.querySelectorAll('.adc-conflict-row,.adc-preview-conflict,.adc-conflict-pair,.adc-conflict-cell').forEach(el=>{el.classList.remove('adc-conflict-row','adc-preview-conflict','adc-conflict-pair','adc-conflict-cell');el.style.removeProperty('--adc-pair-color');el.style.removeProperty('box-shadow')});document.querySelectorAll('.adc-conflict-badge,.adc-conflict-message,.adc-conflict-hint,.adc-conflict-actions,.adc-pair-tag').forEach(el=>el.remove())}
 function paint(){
  clear();const cs=active();if(!cs.length)return;
  const byInterval=new Map(),affected=new Set(),instIds=new Set();
  cs.forEach((c,i)=>{c.color=c.type==='duration'?'#d97706':c.type==='gap'?'#2563eb':c.type==='duplicate'?'#0f766e':palette[i%palette.length];for(const v of [c.a,c.b]){
   const key=v.uid+'|'+v.index;if(!byInterval.has(key))byInterval.set(key,[]);if(!byInterval.get(key).some(existing=>existing.id===c.id))byInterval.get(key).push(c);affected.add(v.uid);
  }});
  for(const x of allEntries())if(affected.has(x.key))instIds.add(String(x.i.id));
  for(const [selector,attr] of [['#djCargoList','data-dj-interval']]){
   const root=document.querySelector(selector);if(!root)continue;
   root.querySelectorAll('.dj-hours').forEach(row=>{
    const input=row.querySelector('['+attr+'][data-field="start"]');if(!input)return;
    const items=byInterval.get(input.getAttribute(attr)+'|'+input.dataset.index);if(!items)return;
    row.classList.add('adc-conflict-row');
    const clocks=row.querySelectorAll('.adc-24-clock');clocks.forEach(clock=>{
     clock.classList.add('adc-conflict-pair');clock.style.setProperty('--adc-pair-color',items[0].color);
    });
    const badges=document.createElement('span');badges.className='adc-pair-tag';badges.innerHTML=items.map(c=>'<button type="button" class="adc-jump-notice" data-adc-jump="'+escHTML(c.id)+'" style="--adc-pair-color:'+c.color+'" title="Leer advertencia '+c.label+'">'+c.label+'</button>').join('');row.append(badges);
   });
  }
  for(const x of allEntries())if(affected.has(x.key)){
   const btn=[...document.querySelectorAll('[data-horarios-toggle]')].find(e=>e.dataset.horariosToggle===x.key);if(btn)mark(btn);
   const panel=btn?.closest('[data-cargo-panel]');if(panel){const outer=panel.previousElementSibling;if(outer&&outer.matches('button'))mark(outer)}
  }
  // El perfil no recibe marcas de conflicto: solo acceso a revisión.
  document.querySelectorAll('#djCargoList [data-dj-group]').forEach(g=>{if(instIds.has(String(g.dataset.djGroup)))mark(g.querySelector('.dj-accordion-toggle'))});
  const sheet=document.getElementById('djSheet1');if(sheet&&!adcDjTransferMode()){
   const rows=[...sheet.querySelectorAll('tbody tr')],selected=djOrderedEntries().filter(djSelected);
   rows.forEach((tr,i)=>{
    const x=selected[i];if(!x||!affected.has(x.key))return;
    tr.classList.add('adc-preview-conflict');
    for(let day=0;day<5;day++){
     const td=tr.children[3+day];if(!td)continue;
     const dayIntervals=(x.e.djIntervals||[]).map((v,index)=>({v,index})).filter(o=>Number(o.v.day)===day);
     const spans=[...td.querySelectorAll('span')];
     dayIntervals.forEach((o,j)=>{
      const matches=byInterval.get(x.key+'|'+o.index)||[];if(!matches.length||!spans[j])return;
      spans[j].classList.add('adc-conflict-cell');spans[j].style.setProperty('--adc-pair-color',matches[0].color);
      const badge=document.createElement('small');badge.className='adc-pair-tag';badge.innerHTML=matches.map(c=>'<button type="button" class="adc-jump-notice" data-adc-jump="'+escHTML(c.id)+'" style="--adc-pair-color:'+c.color+'" title="Leer advertencia '+c.label+'">'+c.label+'</button>').join('');spans[j].after(badge);
     });
    }
   });
  }
  // A single decision card for each independent conflict. Buttons remain side by side.
  const hosts=[document.querySelector('#djCargoList')];
  for(const host of hosts){if(!host)continue;const panel=document.createElement('div');panel.className='adc-conflict-actions';
   panel.innerHTML=cs.map(c=>{
    const overlap=c.type==='overlap';const title={overlap:'Superposición de horarios detectada',gap:'Separación prolongada entre intervalos',duration:'Duración de hora cátedra para revisar',duplicate:'Posible intervalo duplicado'}[c.type];
    const msg={overlap:'Se detectó una superposición de <b>'+c.minutes+' minutos</b> entre intervalos del '+days[c.day]+'.',gap:'Hay <b>'+c.minutes+' minutos</b> de separación entre intervalos del '+days[c.day]+'.',duration:'El intervalo '+c.a.aLabel+' dura <b>'+c.minutes+' minutos</b>; se esperan 40 minutos.',duplicate:'El intervalo '+c.a.aLabel+' aparece dos veces en el mismo cargo y día.'}[c.type];
    return '<div class="adc-conflict-card" tabindex="-1" data-adc-notice="'+escHTML(c.id)+'" style="--adc-pair-color:'+c.color+'"><div class="adc-conflict-title"><span class="adc-conflict-label">'+c.label+'</span> ⚠ '+title+'</div><p>'+msg+'</p><div class="adc-conflict-buttons"><button type="button" class="adc-acknowledge" data-adc-ack="'+escHTML(c.id)+'">'+(c.type==='gap'?'No aplica':'Entiendo. Deseo continuar')+'</button><button type="button" class="adc-resolve" data-adc-resolve="'+escHTML(c.id)+'">Voy a corregirlo</button></div></div>';
   }).join('');host.prepend(panel);
   // Navegación a la explicación, sin alterar los botones de decisión.
   document.querySelectorAll('#djCargoList [data-adc-jump],#djSheet1 [data-adc-jump]').forEach(b=>{
    b.onclick=()=>{const target=[...panel.querySelectorAll('[data-adc-notice]')].find(n=>n.dataset.adcNotice===b.dataset.adcJump);if(!target)return;target.scrollIntoView({behavior:'smooth',block:'center'});target.focus({preventScroll:true});target.classList.add('adc-notice-target');setTimeout(()=>target.classList.remove('adc-notice-target'),1800)};
   });
   document.querySelectorAll('#djCargoList .adc-conflict-badge').forEach(b=>{b.setAttribute('role','button');b.tabIndex=0;b.title='Ir a las advertencias de horarios';const go=()=>{panel.scrollIntoView({behavior:'smooth',block:'start'});panel.querySelector('.adc-conflict-card')?.focus({preventScroll:true})};b.onclick=go;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
   panel.querySelectorAll('[data-adc-ack]').forEach(b=>b.onclick=()=>saveAcknowledgement(b.dataset.adcAck));
   panel.querySelectorAll('[data-adc-resolve]').forEach(b=>b.onclick=()=>{
    const c=cs.find(v=>v.id===b.dataset.adcResolve);if(!c)return;
    const root=host.closest('#profile')?'#profile':'#djCargoList';
    const attr=root==='#profile'?'data-pi':'data-dj-interval';
    const input=[...document.querySelectorAll(root+' ['+attr+'][data-field="start"]')].find(n=>n.getAttribute(attr)===c.a.uid&&Number(n.dataset.index)===c.a.index);
    const row=input?.closest('.dj-hours');
    if(row){const hidden=row.closest('[hidden], [data-dj-open="false"]');if(hidden){const group=hidden.closest('[data-dj-group]');const toggle=group?.querySelector('.dj-accordion-toggle');if(toggle)toggle.click()}row.scrollIntoView({behavior:'smooth',block:'center'});row.querySelector('select')?.focus({preventScroll:true})}
   });
  }
 }
 const oldRender=render;render=function(...args){const result=oldRender.apply(this,args);paint();return result};
 const oldDJ=djRender;djRender=function(...args){const result=oldDJ.apply(this,args);paint();return result};
 const oldExtras=djProfileExtras;djProfileExtras=function(...args){const result=oldExtras.apply(this,args);paint();return result};
 const oldRefresh=profileRefreshWarnings;profileRefreshWarnings=function(...args){const result=oldRefresh.apply(this,args);paint();return result};
 function isSubstitute(){const id=document.getElementById('escuelaSelect')?.value;const school=inst.find(i=>String(i.id)===String(id));return !!school&&school.entries.some(e=>e.revista==='Suplente')}
 function notice(popup){const blocked=selected==='Exámenes'&&isSubstitute();const existing=document.getElementById('adcExamNotice');if(existing)existing.remove();if(blocked){const el=document.createElement('div');el.id='adcExamNotice';el.className='adc-exam-notice';el.setAttribute('role','alert');el.textContent=EXAM_MESSAGE;document.getElementById('elegido')?.insertAdjacentElement('afterend',el);if(popup)alert(EXAM_MESSAGE)}return blocked}
 const oldChoose=choose;choose=function(t){const result=oldChoose(t);notice(t==='Exámenes');return result};
 const oldReview=review;review=function(...args){const result=oldReview.apply(this,args);if(selected==='Exámenes'&&isSubstitute()&&!result.messages.includes(EXAM_MESSAGE)){result.messages.push(EXAM_MESSAGE);const box=document.getElementById('review')?.querySelector('div');if(box){box.className='warning';box.insertAdjacentHTML('afterbegin','<b>'+EXAM_MESSAGE+'</b><br>')}}notice(false);return result};
 document.getElementById('escuelaSelect')?.addEventListener('change',()=>notice(selected==='Exámenes'));
 const oldGenerate=generatePDF;generatePDF=async function(...args){if(notice(true))return;return oldGenerate.apply(this,args)};
  // v0.9.16.19: asistencia discreta en Perfil, revisión completa en DJ-01.
  const originalPaint=paint;
  function profileAccess(){
    const root=document.getElementById('instituciones');if(!root)return;
    root.querySelectorAll('.adc-profile-review-link').forEach(n=>n.remove());
    const problems=active();if(!problems.length)return;
    const box=document.createElement('div');box.className='adc-profile-review-link';
    box.innerHTML='<div><b>¿Querés revisar tus horarios?</b><p>Podés seguir cargando libremente. Hay horarios que conviene verificar en la vista previa de tu Declaración Jurada.</p></div><button type="button" class="alt">Revisar en Declaración Jurada →</button>';
    box.querySelector('button').onclick=()=>{tab('dj');djSubtab('new');const target=problems[0]?.a?.uid;const x=allEntries().find(e=>e.key===target);if(x){djAccordionOpen.add(String(x.i.id));djRender();}document.getElementById('djCargoList')?.scrollIntoView({behavior:'smooth',block:'start'})};
    root.prepend(box);
  }
  const oldProfileRender=render;render=function(...args){const result=oldProfileRender.apply(this,args);profileAccess();return result};
  const oldProfileExtras=djProfileExtras;djProfileExtras=function(...args){const result=oldProfileExtras.apply(this,args);profileAccess();return result};
  const oldSetProfile=profileIntervalChange;profileIntervalChange=function(...args){const result=oldSetProfile.apply(this,args);profileAccess();return result};
  const oldAck=saveAcknowledgement;saveAcknowledgement=function(id){oldAck(id);profileAccess()};
  profileAccess();
 paint();
})();
