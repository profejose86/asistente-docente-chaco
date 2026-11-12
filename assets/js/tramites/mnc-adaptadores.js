// Campos opcionales de los formularios históricos que tienen salida documental.
(() => {
  const keys=['teacherAddress','teacherLocality','place','signDate'];
  const controls=new Map();
  let draftKey='standalone';
  function persist(){
    const values={},marked=[];
    for(const [key,control] of controls){values[key]=adcOLFields[key].value;if(control.marked)marked.push(key);}
    try{localStorage.setItem('adc-ol01-mnc-'+draftKey,JSON.stringify({values,marked}));}catch{}
  }
  for(const key of keys){
    const input=adcOLFields[key];
    controls.set(key,adcMnc.bind(input,{
      canMark:()=>!['place','signDate'].includes(key)||adcOLFields.mode.value!=='relative',
      onChange:()=>{input.required=['place','signDate'].includes(key)&&adcOLFields.mode.value==='relative';persist();adcOLInvalidate();}
    }));
    input.addEventListener('input',persist);
    input.addEventListener('change',persist);
  }
  adcOLForm.addEventListener('change',()=>{
    for(const [key,control] of controls){
      adcOLFields[key].required=['place','signDate'].includes(key)&&adcOLFields.mode.value==='relative';
      control.refresh();
    }
  });
  const open=adcOLStart;
  adcOLStart=function(contextual){
    if(adcOLDraftKey!==null)persist();
    const next=contextual?JSON.stringify([selected,$('escuelaSelect').value,$('desde').value,$('hasta').value]):'standalone';
    for(const control of controls.values())control.set(false,false);
    draftKey=next;
    open(contextual);
    let draft;
    try{draft=JSON.parse(localStorage.getItem('adc-ol01-mnc-'+draftKey)||'null');}catch{}
    for(const [key,control] of controls){
      if(draft?.marked?.includes(key)){
        adcOLFields[key].value='';control.set(true,false);
      }else if(draft?.values&&Object.hasOwn(draft.values,key)&&!['teacherAddress','teacherLocality'].includes(key))adcOLFields[key].value=String(draft.values[key]||'');
      control.refresh();
    }
  };
  const draw=adcOLDraw;
  adcOLDraw=function(page,font,values){
    draw(page,font,values);
    const boxes={teacherAddress:{x:96,y:213,width:310,height:17},teacherLocality:{x:96,y:240,width:310,height:17},place:{x:458,y:491,width:78,height:17},signDate:{x:539,y:491,width:80,height:17}};
    for(const [key,control] of controls)if(control.marked)adcMnc.drawPdf(page,boxes[key]);
  };
})();
