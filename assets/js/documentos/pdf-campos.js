// Coordenadas en puntos del PDF, desde la esquina superior izquierda.
// No reconstruye el documento: agrega exclusivamente los valores y marcas.
(() => {
  function layout({template,fields,values,marked,presented,font}) {
    const width=template.pages[0].width,height=template.pages[0].height;
    const result={width,height,pages:template.pages.map(()=>[]),fields:[],actions:[],errors:[]};
    const black={type:'RGB',red:0,green:0,blue:0};
    function draw(value,box,x,top,maxWidth,size) {
      let fitted=size;
      while(fitted>7&&font.widthOfTextAtSize(value,fitted)>maxWidth-4)fitted=Math.max(7,fitted-.25);
      if(font.widthOfTextAtSize(value,fitted)>maxWidth-4){result.errors.push(`${box.field.label}: el texto no entra a 7 puntos. Conservá el dato y revisá cómo presentarlo.`);return;}
      result.pages[box.page].push({kind:'text',text:value,x:x+2,y:height-top-fitted*.82,size:fitted,font:{name:'regular'},color:black,fieldValue:box.field.path});
      box.size=Math.min(box.size,fitted);
    }
    for(const field of fields){
      const setting=template.fields[field.path];if(!setting)continue;
      const box={...setting,field,page:setting.page||0,y:height-setting.top-setting.height,size:setting.fontSize||12,lines:['']};
      result.fields.push(box);
      const commands=result.pages[box.page];
      if(setting.replacePrintedYear){
        const patch=setting.replacePrintedYear;
        commands.push({kind:'rectangle',x:patch.x,y:height-patch.top-patch.height,width:patch.width,height:patch.height,color:{type:'RGB',red:1,green:1,blue:1}});
      }
      if(setting.options){
        const selected=values[field.path];
        for(const option of setting.options)if(option.value===selected){
          const x=option.x+1,y=height-option.top-8;
          commands.push({kind:'line',start:{x,y},end:{x:x+7,y:y+7},thickness:1,color:black},{kind:'line',start:{x,y:y+7},end:{x:x+7,y},thickness:1,color:black});
        }
        continue;
      }
      if(marked.has(field.path)){
        const g=window.adcMnc.geometry,y=box.y+box.height/2;
        commands.push({kind:'line',start:{x:box.x+box.width*g.start,y},end:{x:box.x+box.width*g.end,y},color:black,thickness:g.thickness});continue;
      }
      const value=String(presented(field,values[field.path])||'');if(!value)continue;
      if(setting.dateParts){
        const [year,month,day]=value.split('-');
        if(setting.printedYear&&!setting.replacePrintedYear&&Number(year)!==setting.printedYear){result.errors.push(`${field.label}: el original tiene ${setting.printedYear} impreso. Necesitamos aprobar su corrección antes de exportar esta fecha.`);}
        [day,month,year].forEach((part,index)=>{if(index===2&&setting.printedYear&&!setting.replacePrintedYear)return;const segment=setting.dateParts[index];draw(part||'',box,segment.x,setting.top,segment.width,box.size);});
      }else if(setting.digits){
        if(value.length>setting.digits)result.errors.push(`${field.label}: admite ${setting.digits} casilleros. El dato completo se conserva en el borrador.`);
        else [...value].forEach((character,index)=>draw(character,box,box.x+index*box.width/setting.digits,setting.top,box.width/setting.digits,box.size));
      }else if(setting.multiline||field.type==='textarea'){
        let lines=[''];
        for(const word of value.split(/\s+/)){
          const index=lines.length-1,next=[lines[index],word].filter(Boolean).join(' ');
          if(font.widthOfTextAtSize(next,box.size)>box.width-4&&lines[index])lines.push(word);else lines[index]=next;
        }
        const maxLines=Math.floor(box.height/(box.size+2));
        if(lines.length>maxLines){
          let size=box.size;
          while(size>7){size=Math.max(7,size-.25);lines=[''];for(const word of value.split(/\s+/)){const index=lines.length-1,next=[lines[index],word].filter(Boolean).join(' ');if(font.widthOfTextAtSize(next,size)>box.width-4&&lines[index])lines.push(word);else lines[index]=next;}if(lines.length*(size+2)<=box.height)break;}
          box.size=size;
        }
        if(lines.length*(box.size+2)>box.height)result.errors.push(`${field.label}: el texto no entra a 7 puntos. El borrador conserva el contenido completo.`);
        else lines.forEach((line,index)=>draw(line,box,box.x,setting.top+index*(box.size+2),box.width,box.size));
        box.lines=lines;
      }else draw(value,box,box.x,setting.top,box.width,box.size);
    }
    return result;
  }
  window.adcPdfOverlay=Object.freeze({layout});
})();
