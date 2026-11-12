// Geometría y controles compartidos de Marcar No Corresponde.
(() => {
  const geometry = Object.freeze({start:0.15,end:0.85,mm:0.5,thickness:0.5*72/25.4});
  const originals = new WeakMap();
  let nextId = 0;
  function eligible(field) {
    return field.mnc !== false && field.maxLength !== 1 && ['text','email','tel','url','number','date','textarea','select','search'].includes(field.type || 'text') && (!field.required || field.allowMnc === true);
  }
  function help(button,tooltip) {
    let showTimer,hideTimer;
    const hide = () => {clearTimeout(showTimer);clearTimeout(hideTimer);tooltip.hidden=true;};
    const show = () => {
      hide();
      showTimer=setTimeout(()=>{tooltip.hidden=false;hideTimer=setTimeout(hide,1500);},150);
    };
    button.addEventListener('pointerenter',show);
    button.addEventListener('pointerleave',hide);
    button.addEventListener('focus',show);
    button.addEventListener('blur',hide);
  }
  function apply(input,marked,{allowRequired=false}={}) {
    if (!originals.has(input)) originals.set(input,{required:input.required,readOnly:input.readOnly,disabled:input.disabled});
    const prior=originals.get(input);
    if (marked && (!eligible({type:input.tagName==='TEXTAREA'?'textarea':input.tagName==='SELECT'?'select':input.type,maxLength:input.maxLength,required:prior.required,allowMnc:allowRequired}) || input.value.trim())) return false;
    input.required=prior.required&&!marked;
    input.readOnly=marked||prior.readOnly;
    if(input.tagName==='SELECT')input.disabled=marked||prior.disabled;
    input.toggleAttribute('data-adc-mnc-marked',marked);
    if(marked)input.setCustomValidity('');
    return true;
  }
  function drawPdf(page,box,options=geometry) {
    const y=page.getHeight()-box.y-box.height/2;
    page.drawLine({start:{x:box.x+box.width*options.start,y},end:{x:box.x+box.width*options.end,y},color:PDFLib.rgb(0,0,0),thickness:options.thickness});
  }
  function bind(input,{marked=false,allowRequired=false,canMark=()=>true,onChange=()=>{}}={}) {
    if(input.adcMnc)return input.adcMnc;
    if(!eligible({type:input.tagName==='TEXTAREA'?'textarea':input.tagName==='SELECT'?'select':input.type,maxLength:input.maxLength,required:input.required,allowMnc:allowRequired}))return null;
    let host=input.closest('.adc-ol-field');
    if(!host){host=document.createElement('span');input.before(host);host.append(input);}
    host.classList.add('adc-mnc-control');
    const button=document.createElement('button'),line=document.createElement('span'),tooltip=document.createElement('span');
    button.type='button';button.className='adc-mnc-button';button.textContent='X';
    tooltip.className='adc-mnc-tooltip';tooltip.id=`adc-mnc-help-${++nextId}`;tooltip.setAttribute('role','tooltip');tooltip.textContent='Tachar si no corresponde';tooltip.hidden=true;
    button.setAttribute('aria-describedby',tooltip.id);
    line.className='adc-mnc-line';line.hidden=true;line.setAttribute('aria-hidden','true');
    host.append(button,line,tooltip);help(button,tooltip);
    let state=false;
    function refresh(){
      button.hidden=!state&&(!!input.value.trim()||!canMark());
      button.setAttribute('aria-pressed',String(state));
      const label=input.getAttribute('aria-label')||input.closest('label')?.firstChild?.textContent||input.name||'campo';
      button.setAttribute('aria-label',`${state?'Quitar marca de':'Marcar no corresponde en'} ${label.trim()}`);
      line.hidden=!state;
    }
    function set(value,notify=true){
      if(value&&!canMark())return false;
      if(!apply(input,value,{allowRequired}))return false;
      state=value;refresh();if(notify)onChange(state);return true;
    }
    button.addEventListener('click',()=>set(!state));
    input.addEventListener('input',refresh);
    input.addEventListener('change',refresh);
    const controller={set,refresh,get marked(){return state;},button,line};
    input.adcMnc=controller;
    if(marked)input.value='';
    set(marked,false);
    return controller;
  }
  window.adcMnc=Object.freeze({geometry,eligible,help,apply,drawPdf,bind});
})();
