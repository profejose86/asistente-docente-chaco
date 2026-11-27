function adcTramiteLabel(name){return tramites.find(t=>t[0]===name)?.[3]||name;}
let adcLastCatalogTrigger=null;
let adcLastTramiteView='tramites';
const adcNavGuards=new Set();
const adcNavListeners=new Set();
let adcCurrentView=null;
function adcRegisterNavHook(collection,fn){
 if(typeof fn!=='function')return ()=>{};
 collection.add(fn);
 return ()=>collection.delete(fn);
}
function adcOpenLastTramite(){window.tab(adcLastTramiteView)}
function adcBackToTramites(){
 window.tab('tramites');
 const target=adcLastCatalogTrigger;
 const list=target?.list?$(target.list):null;
 const matching=list&&[...list.querySelectorAll('[data-adc-tramite]')].find(option=>option.dataset.adcTramite===target.name);
 (matching||$('buscar'))?.focus();
}
function adcToggleTramites(force){const menu=$('adcTramitesMenu');const open=Boolean(force);menu?.classList.toggle('hide',!open);$('adcTramitesToggle')?.setAttribute('aria-expanded',String(open));}
function tab(t){
 const requested=t==='transfer'?'dj':t;
 const previous=adcCurrentView;
 for(const guard of adcNavGuards){
  if(guard(requested,previous)===false)return false;
 }
 if(t==='transfer'){
  const notice=$('adcTransferNotice');if(notice)notice.hidden=true;
  if(typeof djSubtab==='function')djSubtab('new');
  if(typeof adcDjSetMode==='function')adcDjSetMode('transfer');
 }
 t=requested;
 $('adcBD02')?.classList.toggle('hide',t!=='bd02');
 $('adcSC01')?.classList.toggle('hide',t!=='sc01');
 $('tabSC01')?.classList.toggle('alt',t!=='sc01');
 $('adcOfficialForm')?.classList.toggle('hide',t!=='official');
 $('adcCalendar')?.classList.toggle('hide',t!=='calendar');
 if($('tabCalendar'))$('tabCalendar').className=t==='calendar'?'':'alt';
 if(t==='calendar'&&typeof adcCalendarOpen==='function')adcCalendarOpen();
 $('profile')?.classList.toggle('hide',t!=='profile');
 $('license')?.classList.toggle('hide',t!=='license');
 if($('tabP'))$('tabP').className=t==='profile'?'':'alt';
 if($('tabL'))$('tabL').className=t==='license'?'':'alt';
 $('dj')?.classList.toggle('hide',t!=='dj');
 $('dj02')?.classList.toggle('hide',t!=='dj02');
 if($('tabDJ02'))$('tabDJ02').className=t==='dj02'?'':'alt';
 if($('tabDJ'))$('tabDJ').className=t==='dj'?'':'alt';
 const tramites=['tramites','license','dj','dj02','ol01','sc01','official','bd02'].includes(t);
 $('adcOL')?.classList.toggle('hide',t!=='ol01');
 if(typeof adcDocsOnTab==='function'&&$('adcDocsDock'))adcDocsOnTab(t);
 if(tramites)adcLastTramiteView=t;
 if($('adcTramitesToggle'))$('adcTramitesToggle').className=tramites?'':'alt';
 adcToggleTramites(t==='tramites');
 $('adcTramiteBack')?.classList.toggle('hide',t!=='dj'&&t!=='dj02');
 if(t==='license'&&typeof review==='function')review();
 if(t==='dj'){if(typeof adcDjTransferMode==='function'&&adcDjTransferMode()&&typeof adcTransferOpen==='function')adcTransferOpen();if(typeof djRender==='function')djRender();}
 if(t==='dj02'&&typeof dj02Open==='function')dj02Open();
 if(t==='profile'&&typeof djProfileExtras==='function')djProfileExtras();
 adcCurrentView=t;
 for(const listener of adcNavListeners)listener(t,previous);
 return true;
}
window.tab=tab;
window.adcNavigation=Object.freeze({
 go:(next)=>window.tab(next),
 current:()=>adcCurrentView,
 registerGuard:(fn)=>adcRegisterNavHook(adcNavGuards,fn),
 onNavigate:(fn)=>adcRegisterNavHook(adcNavListeners,fn)
});
