
/* v0.9.16.19c — Modo Candado: guía amable, indicadores y horas por día. */
(function(){
 const weekdays=['Lunes','Martes','Miércoles','Jueves','Viernes'];
 const get=()=>typeof djEntries==='function'?djEntries():[];
 const minutes=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s||'')?Number(s.slice(0,2))*60+Number(s.slice(3)):null;
 function issues(){
  const all=get(),result=[],global=[];
  for(const x of all){
   const arr=x.e.djIntervals||[];
   for(let d=0;d<5;d++){
    const declared=Number(x.e.schedule?.[d]||0),rows=arr.map((v,index)=>({v,index})).filter(o=>Number(o.v.day)===d);
    const completed=rows.filter(o=>minutes(o.v.start)!==null&&minutes(o.v.end)!==null&&minutes(o.v.end)>minutes(o.v.start));
    const actual=completed.reduce((n,o)=>n+minutes(o.v.end)-minutes(o.v.start),0);
    if(declared===0&&!rows.length)continue;
    if(x.e.type!=='cargo'&&(declared!==rows.length||actual!==declared*40)){
     result.push({uid:x.key,inst:x.i.id,day:d,declared,count:rows.length,completed:completed.length,actual,rows:rows.map(o=>o.index),id:'H|'+x.key+'|'+d});
    }
   }
   arr.forEach((v,index)=>{const a=minutes(v.start),b=minutes(v.end);if(a!==null&&b!==null&&b>a&&x.e.type!=='cargo'&&b-a!==40)global.push({uid:x.key,index});});
  }
  const intervals=all.flatMap(x=>(x.e.djIntervals||[]).map((v,index)=>({uid:x.key,index,day:Number(v.day),a:minutes(v.start),b:minutes(v.end)})).filter(v=>v.a!==null&&v.b!==null&&v.b>v.a));
  for(let i=0;i<intervals.length;i++)for(let j=i+1;j<intervals.length;j++){
   const a=intervals[i],b=intervals[j];if(a.day!==b.day)continue;
   const same=a.uid===b.uid&&a.a===b.a&&a.b===b.b;
   if(same||Math.max(a.a,b.a)<Math.min(a.b,b.b)){global.push({uid:a.uid,index:a.index},{uid:b.uid,index:b.index});}
  }
  for(const x of all){const rows=(x.e.djIntervals||[]).map((v,index)=>({v,index}));for(let d=0;d<5;d++){
   const day=rows.filter(o=>Number(o.v.day)===d&&minutes(o.v.start)!==null&&minutes(o.v.end)!==null).sort((a,b)=>minutes(a.v.start)-minutes(b.v.start));
   for(let j=1;j<day.length;j++)if(minutes(day[j].v.start)-minutes(day[j-1].v.end)>60)global.push({uid:x.key,index:day[j].index},{uid:x.key,index:day[j-1].index});
  }}
  return {hours:result,intervals:global};
 }
 function card(){
  const root=document.getElementById('instituciones');if(!root)return null;
  let el=root.querySelector('.adc-profile-review-link');const {hours,intervals}=issues();const problem=hours.length||intervals.length;
  if(!problem){el?.remove();return null;}
  if(!el){el=document.createElement('div');el.className='adc-profile-review-link';root.prepend(el)}
  el.id='adc-friendly-review';el.innerHTML='<div><b>Te recomiendo que revises tus horarios</b><p>Hay horarios que te conviene verificar en este momento.</p><p>Podés seguir cargando libremente. La revisión detallada está en tu Declaración Jurada.</p></div><button type="button" class="alt">Ir a revisar Declaración Jurada →</button>';
  el.querySelector('button').onclick=()=>{tab('dj');djSubtab('new');document.querySelector('#djCargoList .adc-conflict-actions, #adc-hour-notices')?.scrollIntoView({behavior:'smooth',block:'start'});};
  return el;
 }
 function profilePaint(){
  const root=document.getElementById('instituciones');if(!root)return;
  const {hours,intervals}=issues();card();
  root.querySelectorAll('.adc-friendly-mark').forEach(n=>n.remove());
  const marks=new Set(intervals.map(v=>v.uid+'|'+v.index));
  // Las diferencias H se señalan UNA sola vez en el encabezado de horas, no en cada día o intervalo.
  for(const x of get()){
   const wrap=[...root.querySelectorAll('[data-profile-schedule]')].find(n=>n.dataset.profileSchedule===x.key);if(!wrap)continue;
   const rows=[...wrap.querySelectorAll('.dj-hours')];
   rows.forEach((row,index)=>{if(!marks.has(x.key+'|'+index))return;const btn=document.createElement('button');btn.type='button';btn.className='adc-friendly-mark';btn.textContent='!';btn.title='Hay un horario para revisar. Ir al aviso general';btn.setAttribute('aria-label','Ir a la recomendación de revisar horarios');btn.onclick=()=>{const target=card();if(!target)return;target.scrollIntoView({behavior:'smooth',block:'center'});target.classList.remove('adc-friendly-flash');void target.offsetWidth;target.classList.add('adc-friendly-flash')};row.append(btn)});
   // Una sola alarma H junto a «Cantidad de horas cátedra por día», aunque afecte varios días.
   if(hours.some(h=>h.uid===x.key)){
    const panel=wrap.closest('[data-cargo-panel]')||wrap.parentElement;
    const heading=[...panel.querySelectorAll('.small,div')].find(n=>n.children.length===0&&n.textContent.includes('Cantidad de horas cátedra por día'));
    if(heading){
     const btn=document.createElement('button');btn.type='button';btn.className='adc-friendly-mark adc-hour-header-mark';btn.textContent='!';
     btn.title='La cantidad de horas declaradas no coincide con los intervalos. Ir al aviso general';
     btn.setAttribute('aria-label','Revisar diferencia entre horas cátedra declaradas e intervalos');
     btn.onclick=()=>{const target=card();if(!target)return;target.scrollIntoView({behavior:'smooth',block:'center'});target.classList.remove('adc-friendly-flash');void target.offsetWidth;target.classList.add('adc-friendly-flash')};
     heading.append(btn);
    }
   }
  }
 }
 function jumpHours(h){
  tab('profile');const instButton=document.querySelector('[data-inst-toggle="'+h.inst+'"]');if(instButton?.getAttribute('aria-expanded')==='false')instButton.click();
  const cargoButton=[...document.querySelectorAll('[data-cargo-toggle]')].find(b=>b.dataset.cargoToggle===h.uid);if(cargoButton?.getAttribute('aria-expanded')==='false')cargoButton.click();
  const target=cargoButton?.closest('[data-inst-panel]')?.querySelector('[data-cargo-panel="'+CSS.escape(h.uid)+'"]')||document.querySelector('[data-cargo-panel="'+CSS.escape(h.uid)+'"]');
  const schedule=target?.querySelectorAll('input,select');const dayInput=[...schedule||[]].find(el=>el.getAttribute('onchange')?.includes('updD')&&el.getAttribute('onchange')?.includes(','+h.day+','));
  (dayInput||cargoButton||instButton)?.scrollIntoView({behavior:'smooth',block:'center'});dayInput?.focus({preventScroll:true});
 }
 function djHoursPaint(){
  document.getElementById('adc-hour-notices')?.remove();document.querySelectorAll('.adc-hour-jump').forEach(n=>n.remove());
  const host=document.getElementById('djCargoList');if(!host)return;
  const {hours}=issues();if(!hours.length)return;
  const panel=document.createElement('div');panel.id='adc-hour-notices';panel.className='adc-conflict-actions';
  const cargoTitle=h=>{const x=get().find(x=>x.key===h.uid);if(!x)return 'Cargo sin identificar';const e=x.e;const name=e.type==='cargo'?(e.cargoName||'Cargo'):(e.subject||'Asignatura');const course=typeof djCourseDisplay==='function'?String(djCourseDisplay(e)||'').trim():'';return course?name+' · '+course:name;};
  const safe=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  panel.innerHTML=hours.map((h,i)=>'<div class="adc-conflict-card" id="adc-hour-'+i+'" tabindex="-1" style="--adc-pair-color:#a16207"><div class="adc-conflict-title"><span class="adc-conflict-label">H'+(i+1)+'</span> Horas cátedra para revisar · '+weekdays[h.day]+'</div><div class="adc-h-course"><b>Curso o cargo:</b> '+safe(cargoTitle(h))+'</div><p>Declaraste <b>'+h.declared+' hora(s) cátedra</b> ('+(h.declared*40)+' minutos). Cargaste <b>'+h.count+' intervalo(s)</b>, de los cuales '+h.completed+' tienen horarios completos válidos; suman <b>'+h.actual+' minutos</b>. <br><b>Diferencia respecto de lo declarado:</b> '+(h.declared*40-h.actual===0?'0 minutos':Math.abs(h.declared*40-h.actual)+' minutos '+(h.declared*40>h.actual?'menos':'más')+' de clase')+'. Revisá la cantidad y la duración de los intervalos.</p><div class="adc-conflict-buttons"><button type="button" class="adc-hour-go" data-h="'+i+'">Modificar cantidad de horas cátedra</button><button type="button" class="adc-hour-interval" data-h="'+i+'">Revisar intervalos</button></div></div>').join('');
  host.prepend(panel);
  panel.querySelectorAll('.adc-hour-go').forEach(b=>b.onclick=()=>jumpHours(hours[Number(b.dataset.h)]));
  panel.querySelectorAll('.adc-hour-interval').forEach(b=>b.onclick=()=>{
   const h=hours[Number(b.dataset.h)];
   // Abrir institución y subdesplegable del curso exacto antes de buscar el intervalo.
   const group=[...host.querySelectorAll('[data-dj-group]')].find(n=>n.dataset.djGroup===String(h.inst));
   const groupToggle=group?.querySelector('.dj-accordion-toggle');
   if(groupToggle?.getAttribute('aria-expanded')==='false'||group?.dataset.djOpen==='false')groupToggle?.click();
   const course=[...host.querySelectorAll('[data-dj-course]')].find(n=>n.dataset.djCourse===h.uid);
   const courseToggle=course?.querySelector('[data-dj-course-toggle]');
   if(courseToggle?.getAttribute('aria-expanded')==='false')courseToggle.click();
   const inputs=[...course?.querySelectorAll('[data-dj-interval][data-field="start"]')||[]];
   const input=inputs.find(n=>Number(n.dataset.index)===h.rows[0])||inputs.find(n=>Number(n.closest('.dj-hours')?.querySelector('[data-field="day"]')?.value)===h.day);
   const target=input?.closest('.dj-hours')||courseToggle||groupToggle||panel;
   target.scrollIntoView({behavior:'smooth',block:'center'});
   target.classList.remove('adc-friendly-flash');void target.offsetWidth;target.classList.add('adc-friendly-flash');
   input?.focus({preventScroll:true});
  });
  for(const h of hours){const x=get().find(x=>x.key===h.uid);if(!x)continue;const btn=[...host.querySelectorAll('[data-cargo-toggle]')].find(n=>n.dataset.cargoToggle===h.uid);const label=btn||[...host.querySelectorAll('[data-dj-group] .dj-accordion-toggle')].find(n=>n.closest('[data-dj-group]')?.dataset.djGroup===String(h.inst));if(!label)continue;const i=hours.indexOf(h);const jump=document.createElement('button');jump.type='button';jump.className='adc-hour-jump';jump.textContent='H'+(i+1);jump.title='Leer advertencia de horas cátedra';jump.onclick=e=>{e.stopPropagation();const target=document.getElementById('adc-hour-'+i);target?.scrollIntoView({behavior:'smooth',block:'center'});target?.focus({preventScroll:true});target?.classList.add('adc-friendly-flash')};label.after(jump)}
 }
 // Confirmation when adding beyond declared hours for that day; never silently add.
 function checkAdd(uid,original){const x=get().find(x=>x.key===uid);if(!x)return;
  const next=adcNext40Interval(x.e.djIntervals||[]),day=Number(next.day),declared=Number(x.e.schedule?.[day]||0),count=(x.e.djIntervals||[]).filter(v=>Number(v.day)===day).length;
  if(x.e.type!=='cargo'&&day>=0&&day<5&&count>=declared){
   const action=window.confirm('Para '+weekdays[day]+' declaraste '+declared+' hora(s) cátedra y ya tenés '+count+' intervalo(s).\n\nAceptar: agregar otro intervalo igualmente.\nCancelar: no agregar y revisar la cantidad de horas declaradas.');
   if(!action){const h={uid,inst:x.i.id,day};jumpHours(h);return;}
  }
  return original(uid);
 }
 const oldAdd=profileIntervalAdd;profileIntervalAdd=function(uid){const r=checkAdd(uid,oldAdd);profilePaint();return r};
 const oldDjAdd=djAddInterval;djAddInterval=function(uid){const r=checkAdd(uid,oldDjAdd);profilePaint();djHoursPaint();return r};
 const oldRender=render;render=function(...args){const r=oldRender.apply(this,args);profilePaint();return r};
 const oldExtras=djProfileExtras;djProfileExtras=function(...args){const r=oldExtras.apply(this,args);profilePaint();return r};
 const oldRefresh=profileRefreshWarnings;profileRefreshWarnings=function(...args){const r=oldRefresh.apply(this,args);profilePaint();return r};
 const oldChange=profileIntervalChange;profileIntervalChange=function(...args){const r=oldChange.apply(this,args);profilePaint();djHoursPaint();return r};
 const oldUpdD=updD;updD=function(...args){const r=oldUpdD.apply(this,args);profilePaint();djHoursPaint();return r};
 const oldDJ=djRender;djRender=function(...args){const r=oldDJ.apply(this,args);djHoursPaint();return r};
 profilePaint();
})();

