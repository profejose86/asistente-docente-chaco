// MBIT conecta el catálogo real con los accesos existentes; no abre ni guarda formularios.
(() => {
  const {search,codeKey}=adcMBITSearch;
  const menu=document.getElementById('adcTramitesMenu');
  const input=document.getElementById('buscar'),category=document.getElementById('categoria');
  const catalog=menu.querySelector('.adc-form-catalog'),matches=document.getElementById('adcFormMatches');
  const registered=new Map();
  const metadata=window.adcFormSearchMetadata||{};
  function decorate(button,record) {
    button.classList.add('adc-mbit-card');
    if(button.dataset.mbitDecorated===record.title+'|'+record.code+'|'+record.actionLabel)return;
    const title=document.createElement('strong'),code=document.createElement('small'),action=document.createElement('small');
    title.textContent=record.title;code.textContent=record.code;code.className='adc-mbit-code';
    action.textContent=record.actionLabel;action.className='adc-mbit-action';
    button.replaceChildren(title,code,action);button.dataset.mbitDecorated=record.title+'|'+record.code+'|'+record.actionLabel;
    button.setAttribute('aria-label',[record.title,record.code,record.actionLabel].filter(Boolean).join(' — '));
  }
  function records() {
    const forms=window.adcOfficialFormsData||[];
    const result=[];
    for(const card of catalog.querySelectorAll('.adc-form-grid > button')) {
      const custom=registered.get(card.dataset.mbitRegistry);
      if(custom){card.hidden=!['available','published','ready'].includes(custom.status);if(!card.hidden){decorate(card,custom);result.push({...custom,card});}continue;}
      const source=forms.find(form=>form.id===card.dataset.adcOfficialForm);
      const code=source?.code||card.querySelector('small')?.textContent||'';
      const id=source?.id||codeKey(code).replace(/:(\d+)$/,(_,number)=>number.padStart(2,'0'))||card.id;
      const extra=metadata[id]||{};
      const record={id,code,title:source?.catalogTitle||card.querySelector('strong')?.textContent||'',officialName:source?.title||extra.officialName||'',category:source?.searchCategory||card.closest('details').querySelector('summary').textContent.trim(),keywords:[...(source?.keywords||[]),...(extra.keywords||[])],status:source?.status||'available',actionLabel:codeKey(code)==='dl:1'?'Elegir motivo':card.querySelector('small:last-child')?.textContent||'Abrir formulario',card};
      if(!['available','published','ready'].includes(record.status)){card.hidden=true;continue;}
      card.hidden=false;decorate(card,record);result.push(record);
    }
    for(const record of registered.values())if(!result.some(item=>item.id===record.id))result.push(record);
    return result;
  }
  function addCategories(list) {
    for(const record of list)if(record.category&&![...category.options].some(option=>option.value===record.category))category.add(new Option(record.category,record.category));
  }
  function replaceStable(host,nodes) {
    if(host.children.length===nodes.length&&nodes.every((node,index)=>host.children[index]===node))return;
    for(const node of [...host.children])if(!nodes.includes(node))node.remove();
    nodes.forEach((node,index)=>{if(host.children[index]!==node)host.insertBefore(node,host.children[index]||null);});
  }
  const clear=document.createElement('button');clear.type='button';clear.className='alt adc-mbit-clear';clear.textContent='Limpiar búsqueda';
  clear.addEventListener('click',()=>{input.value='';render();input.focus();});input.after(clear);
  input.setAttribute('aria-controls','adcFormMatches listaTramites');input.autocomplete='off';
  input.addEventListener('keydown',event=>{if(event.key==='Escape'){input.value='';render();}});
  const count=document.getElementById('contador');count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.setAttribute('aria-atomic','true');
  const empty=document.createElement('p');empty.className='small adc-mbit-empty';empty.hidden=true;empty.textContent='No encontramos trámites ni formularios con esa búsqueda. Probá con otro nombre, palabra clave o código';document.getElementById('listaTramites').after(empty);
  function render() {
    const list=records();addCategories(list);
    const query=input.value,cat=category.value,dl=codeKey(query)==='dl:1',typo=codeKey(query)==='bl:1';
    const filtered=search(list,query,cat);
    const showMatches=Boolean(query.trim()||cat);
    catalog.hidden=showMatches;
    clear.hidden=!query;
    category.disabled=false;
    document.getElementById('adcFormQuestion').hidden=!dl;
    document.getElementById('adcFormTypo').hidden=!typo;
    document.getElementById('adcFormTypo').onclick=()=>{input.value='DL-01';render();document.getElementById('adcFormMotivo').focus();};
    const previous=new Map([...matches.children].map(node=>[node.dataset.mbitId,node]));
    const cards=showMatches?filtered.map(record=>{
      let node=previous.get(record.id);
      if(!node){
        node=record.card?record.card.cloneNode(true):document.createElement('button');
        node.removeAttribute('id');node.type='button';node.dataset.mbitId=record.id;
        if(record.open)node.onclick=record.open;
        if(codeKey(record.code)==='dl:1')node.onclick=()=>{input.value='DL-01';render();document.getElementById('adcFormMotivo').focus();};
      }
      decorate(node,record);return node;
    }):[];
    replaceStable(matches,cards);
    document.getElementById('adcFormSearch').hidden=!cards.length&&!dl&&!typo;
    const motives=tramites.map(t=>({id:`reason:${t[0]}`,title:t[3],officialName:t[0],category:t[1],keywords:[t[2]],status:'available',source:t}));
    const found=typo?[]:search(dl?motives.filter(item=>adcDL01Ready.has(item.source[0])):motives,dl?document.getElementById('adcFormMotivo').value:query,cat);
    const host=document.getElementById('listaTramites'),oldReasons=new Map([...host.children].map(node=>[node.dataset.adcTramite,node]));
    replaceStable(host,found.map(({source:t})=>{
      let button=oldReasons.get(t[0]);
      if(!button){button=document.createElement('button');button.type='button';button.dataset.adcTramite=t[0];const title=document.createElement('span'),detail=document.createElement('small');title.textContent=t[3];detail.textContent=t[1];button.append(title,detail);}
      button.setAttribute('aria-pressed',String(selected===t[0]));return button;
    }));
    host.hidden=!found.length;
    const portions=[];
    if(found.length)portions.push(`${found.length} ${found.length===1?'motivo':'motivos'}`);
    if(filtered.length)portions.push(`${filtered.length} ${filtered.length===1?'formulario':'formularios'}`);
    count.textContent=portions.length?`${portions.join(' y ')} ${found.length+filtered.length===1?'encontrado':'encontrados'}`:'';
    empty.hidden=Boolean(found.length||filtered.length||typo);
  }
  function register(record) {
    if(!record.id||!record.title||typeof record.open!=='function')throw new Error('El registro MBIT requiere id, título y acción de apertura.');
    if(records().some(item=>(item.id===record.id||(codeKey(record.code)&&codeKey(item.code)===codeKey(record.code)))&&!registered.has(item.id)))throw new Error('El formulario ya está registrado en el catálogo. Amplíá sus metadatos existentes.');
    const item={code:'',category:'Formularios docentes',keywords:[],status:'available',actionLabel:'Abrir formulario',...record};
    registered.set(record.id,item);
    let card=[...catalog.querySelectorAll('[data-mbit-registry]')].find(card=>card.dataset.mbitRegistry===record.id);
    let group=[...catalog.querySelectorAll('details')].find(group=>group.querySelector('summary').textContent===item.category);
    if(!group){group=document.createElement('details');group.open=true;const title=document.createElement('summary'),grid=document.createElement('div');title.textContent=item.category;grid.className='adc-form-grid';group.append(title,grid);catalog.append(group);}
    if(!card){card=document.createElement('button');card.type='button';card.dataset.mbitRegistry=record.id;}
    group.querySelector('.adc-form-grid').append(card);
    card.onclick=item.open;decorate(card,item);render();
  }
  window.adcMBIT=Object.freeze({render,register,records});render();
})();
