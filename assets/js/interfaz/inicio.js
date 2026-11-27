// Fachada en revisión: las rutas, los datos y los documentos pertenecen a ADC.
(() => {
  const inicioParam=new URL(location.href).searchParams.get('adc-inicio');
  if(window.adcConfig?.authMode==='supabase'?inicioParam==='0':inicioParam!=='1')return;
  document.addEventListener('DOMContentLoaded',()=>{
    const wrap=document.querySelector('body > .wrap'),nav=wrap.querySelector('.adc-main-nav');
    const header=document.createElement('header');header.className='adc-start-header';
    const icon=(paths)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
    const icons={
      home:icon('<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>'),
      profile:icon('<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
      forms:icon('<path d="M14 3H6a2 2 0 0 0-2 2v15a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9zM14 3v6h6M8 13h8M8 17h6"/>'),
      calendar:icon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h1m3 0h1m3 0h1"/>'),
      lab:icon('<path d="M9 3h6m-5 0v6l-6 10a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3M7 15h10"/>')
    };
    const button=(label,view)=>{const el=document.createElement('button');el.type='button';el.textContent=label;el.dataset.adcStartTarget=view;return el};
    const homeTab=button('Inicio','inicio');homeTab.id='adcTabInicio';homeTab.insertAdjacentHTML('afterbegin',icons.home);nav.prepend(homeTab);
    const labTab=button('Mis trámites 2','tramites2');labTab.id='adcTabTramites2';nav.querySelector('#adcTramitesToggle').after(labTab);
    for(const [id,view] of [['tabP','profile'],['adcTramitesToggle','tramites'],['tabCalendar','calendar']])document.getElementById(id).dataset.adcStartTarget=view;
    const masthead=document.createElement('div');masthead.className='adc-start-masthead';
    const brand=button('','inicio');brand.className='adc-start-brand';brand.setAttribute('aria-label','ADC · Ir al inicio');
    brand.innerHTML='<span class="adc-start-emblem" aria-hidden="true"><svg viewBox="0 0 36 36"><path d="M18 5v12m-5.2-9 10.4 6m0-6-10.4 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M7 22c5 0 8 1.5 11 4 3-2.5 6-4 11-4v4.5c-5 0-8 1.5-11 4-3-2.5-6-4-11-4z" fill="currentColor"/></svg></span><strong>ADC</strong><span class="adc-start-brand-copy">Asistente Docente Chaco<small>Formularios · Trámites · Gestiones</small></span>';
    const tools=document.createElement('div');tools.className='adc-start-tools';
    const themeSwitch=document.getElementById('adcThemeSwitch');
    if(themeSwitch)tools.append(themeSwitch);
    masthead.append(brand,nav,tools);header.append(masthead);document.body.insertBefore(header,wrap);
    document.body.classList.add('adc-inicio-shell');
    const moveAccount=()=>{const bar=document.getElementById('adcSessionBar');if(!bar)return false;if(bar.parentElement!==tools)tools.append(bar);return true};
    if(!moveAccount()){const observer=new MutationObserver(()=>{if(moveAccount())observer.disconnect()});observer.observe(document.body,{childList:true})}

    const home=document.createElement('section');home.id='adcInicio';home.className='adc-start-view';home.setAttribute('aria-labelledby','adcInicioTitle');
    home.innerHTML=`<div class="adc-start-welcome"><div class="adc-start-welcome-copy"><p class="adc-start-eyebrow">Panel principal · Provincia del Chaco</p><h1 id="adcInicioTitle" tabindex="-1">¡Hola, profe! Tus trámites y tu agenda, en un solo lugar.</h1><p class="adc-start-lead">Un espacio para acompañarte en tu tarea docente. Tus datos a mano, tus formularios organizados y más tiempo para enseñar.</p></div><button type="button" class="adc-start-primary" data-adc-start-target="tramites">${icons.forms}Buscar un formulario</button></div>
      <div class="adc-start-cards">
        <button type="button" class="adc-start-card" data-adc-start-target="profile"><span class="adc-start-card-icon">${icons.profile}</span><h2>Mi perfil docente</h2><p>Revisá tus datos personales, instituciones y cargos. Completalos una vez y reutilizalos en tus formularios.</p><span class="adc-start-card-footer"><span data-adc-start-institutions>Tu información docente</span><strong>Ingresar</strong></span></button>
        <button type="button" class="adc-start-card adc-start-card-featured" data-adc-start-target="tramites"><span class="adc-start-card-icon">${icons.forms}</span><h2>Mis trámites</h2><p>Encontrá el formulario que necesitás, continuá con tus datos guardados y revisá el documento antes de presentarlo.</p><span class="adc-start-card-footer"><span data-adc-start-count>Catálogo de formularios</span><strong>Ingresar</strong></span></button>
        <button type="button" class="adc-start-card" data-adc-start-target="calendar"><span class="adc-start-card-icon">${icons.calendar}</span><h2>Mi agenda</h2><p>Consultá el calendario escolar y organizá tus anotaciones personales para acompañar cada etapa del año.</p><span class="adc-start-card-footer"><span>Tu calendario escolar y personal</span><strong>Ingresar</strong></span></button>
      </div><div class="adc-start-help"><span class="adc-start-help-icon">${icons.home}</span><div><strong>Vamos paso a paso.</strong><p>Si es tu primera visita, empezá por tu perfil. Después elegí el trámite que necesitás: estamos para hacerlo más simple.</p></div><button type="button" class="adc-start-text-button" data-adc-start-target="profile">Revisar mi perfil</button></div>`;
    const lab=document.createElement('section');lab.id='adcTramites2';lab.className='adc-start-view hide';lab.setAttribute('aria-labelledby','adcTramites2Title');
    lab.innerHTML=`<div class="adc-start-welcome"><div><p class="adc-start-eyebrow">Espacio de prueba</p><h1 id="adcTramites2Title" tabindex="-1">Mis trámites 2</h1><p class="adc-start-lead">Construimos una forma más simple de trabajar con tus formularios, paso a paso.</p></div><span class="adc-start-lab-icon">${icons.lab}</span></div><div class="adc-start-lab-grid"><div class="adc-start-lab-card"><span class="adc-start-card-icon">${icons.forms}</span><h2>Solicitud de beneficio de incapacidad</h2><p>El primer formulario conectado a la prueba. Conserva su PDF original, sus campos y el guardado existente.</p><button type="button" class="adc-start-primary" data-adc-start-pilot>Probar INCAPACIDAD</button><p class="adc-start-caption">Usá únicamente datos ficticios en la vista local.</p></div><div class="adc-start-lab-note"><h2>Un nuevo recorrido, con la misma confianza.</h2><p>Mis trámites conserva el catálogo y los accesos habituales. En esta sección revisamos la apertura, el guardado y el cierre antes de sumar otros formularios.</p><p>El visor maestro está en desarrollo. Esta pantalla no lo presenta como terminado.</p><button type="button" class="adc-start-text-button" data-adc-start-target="tramites">Ir al catálogo habitual</button></div></div><p data-adc-start-status role="status" aria-live="polite"></p>`;
    wrap.prepend(home,lab);
    const refresh=()=>{
      const name=document.getElementById('perfilNombres')?.value.trim().split(/\s+/)[0];
      document.getElementById('adcInicioTitle').textContent=`¡Hola, ${name||'profe'}! Tus trámites y tu agenda, en un solo lugar.`;
      const schools=typeof inst==='undefined'?[]:inst.filter(item=>item.name?.trim());
      home.querySelector('[data-adc-start-institutions]').textContent=schools.length?`${schools.length} ${schools.length===1?'institución vinculada':'instituciones vinculadas'}`:'Completá tu perfil para empezar';
      const count=document.querySelectorAll('.adc-form-catalog .adc-form-grid > button:not(:disabled)').length;
      home.querySelector('[data-adc-start-count]').textContent=count?`${count} formularios en el catálogo`:'Explorá el catálogo de formularios';
    };
    const navHost=window.adcNavigation;
    let documentArea='tramites';
    const syncStartView=next=>{
      const from=document.body.dataset.adcStartView;
      home.classList.toggle('hide',next!=='inicio');lab.classList.toggle('hide',next!=='tramites2');
      document.body.dataset.adcStartView=next;
      if(next==='official'&&from!=='official')documentArea=from==='tramites2'?'tramites2':'tramites';
      const selected=next==='official'?documentArea:next;
      const back=document.querySelector('[data-adc-official-back]');if(back)back.textContent=documentArea==='tramites2'?'← Volver a Mis trámites 2':'← Volver a Mis trámites';
      for(const el of nav.querySelectorAll('[data-adc-start-target]')){
        const active=el.dataset.adcStartTarget===selected;el.classList.toggle('adc-start-nav-active',active);
        if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
      }
      if(next==='inicio'||next==='tramites2'){refresh();document.getElementById(next==='inicio'?'adcInicioTitle':'adcTramites2Title').focus({preventScroll:true});window.scrollTo(0,0)}
    };
    if(navHost?.onNavigate)navHost.onNavigate(syncStartView);
    else{
      const previousTab=window.tab;
      window.tab=function(next){
        const result=previousTab.apply(this,arguments);if(result===false)return false;
        syncStartView(next);
        return result;
      };
    }
    document.addEventListener('click',event=>{
      if(documentArea==='tramites2'&&document.body.dataset.adcStartView==='official'&&event.target.closest('[data-adc-official-back]')){
        event.preventDefault();event.stopImmediatePropagation();window.tab('tramites2');
      }
    },true);
    document.addEventListener('click',event=>{
      const target=event.target.closest('[data-adc-start-target]');
      // Los botones históricos mantienen sus handlers originales.
      if(target&&![ 'tabP','adcTramitesToggle','tabCalendar' ].includes(target.id))window.tab(target.dataset.adcStartTarget);
      if(event.target.closest('[data-adc-start-pilot]')){
        const status=lab.querySelector('[data-adc-start-status]');
        if(!window.adcMotor01Pilot){status.textContent='Esta prueba se abre desde el servidor local de Inicio. El catálogo habitual sigue disponible.';return;}
        const result=window.adcMotor01Pilot.abrir();
        if(result.estado!=='abierto')status.textContent='No se pudo abrir el formulario. Conservá tus cambios y revisá el aviso de guardado.';
      }
    });
    document.addEventListener('input',event=>{if(event.target.id==='perfilNombres')refresh()});
    window.addEventListener('adc:user-storage',refresh);
    window.tab('inicio');
  },{once:true});
})();
