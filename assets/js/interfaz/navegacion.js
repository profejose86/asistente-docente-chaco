function adcTramiteLabel(name){return tramites.find(t=>t[0]===name)?.[3]||name;}
let adcLastCatalogTrigger=null;
let adcLastTramiteView='tramites';
function adcOpenLastTramite(){tab(adcLastTramiteView)}
function adcBackToTramites(){
 tab('tramites');
 const target=adcLastCatalogTrigger;
 const matching=target&&[...$(target.list).querySelectorAll('[data-adc-tramite]')].find(option=>option.dataset.adcTramite===target.name);
 (matching||$('buscar')).focus();
}
function adcToggleTramites(force){const menu=$('adcTramitesMenu');const open=force;menu.classList.toggle('hide',!open);$('adcTramitesToggle').setAttribute('aria-expanded',String(open));}
function tab(t){$('adcBD02')?.classList.toggle('hide',t!=='bd02');$('adcSC01')?.classList.toggle('hide',t!=='sc01');$('tabSC01')?.classList.toggle('alt',t!=='sc01');$('adcOfficialForm')?.classList.toggle('hide',t!=='official');if(t==='transfer'){t='dj';$('adcTransferNotice').hidden=true;djSubtab('new');adcDjSetMode('transfer');}$('adcCalendar').classList.toggle('hide',t!=='calendar');$('tabCalendar').className=t==='calendar'?'':'alt';if(t==='calendar')adcCalendarOpen();$('profile').classList.toggle('hide',t!=='profile');$('license').classList.toggle('hide',t!=='license');$('tabP').className=t==='profile'?'':'alt';$('tabL').className=t==='license'?'':'alt';$('dj').classList.toggle('hide',t!=='dj');$('dj02').classList.toggle('hide',t!=='dj02');$('tabDJ02').className=t==='dj02'?'':'alt';$('tabDJ').className=t==='dj'?'':'alt';const tramites=['tramites','license','dj','dj02','ol01','sc01','official','bd02'].includes(t);$('adcOL')?.classList.toggle('hide',t!=='ol01');if(typeof adcDocsOnTab==='function'&&$('adcDocsDock'))adcDocsOnTab(t);if(tramites)adcLastTramiteView=t;$('adcTramitesToggle').className=tramites?'':'alt';adcToggleTramites(t==='tramites');$('adcTramiteBack').classList.toggle('hide',t!=='dj'&&t!=='dj02');if(t==='license')review();if(t==='dj'){if(adcDjTransferMode())adcTransferOpen();djRender();}if(t==='dj02')dj02Open();if(t==='profile')djProfileExtras()}
