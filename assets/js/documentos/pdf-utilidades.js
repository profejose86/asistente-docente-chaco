function bytes(b64){let raw=atob(b64),a=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return a}
function pdfText(s){return String(s??'').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\u00a0/g,' ').trim()}
function adcPdfDrawBlankLine(page,field,{start=0.1,end=0.9,thickness=0.7}={}){
 const y=page.getHeight()-field.y-field.height/2;
 page.drawLine({start:{x:field.x+field.width*start,y},end:{x:field.x+field.width*end,y},color:PDFLib.rgb(0,0,0),thickness});
}
function splitName(value){let v=String(value||'').trim();if(v.includes(',')){let [surname,...given]=v.split(',');return {surname:surname.trim(),given:given.join(',').trim()}}let bits=v.split(/\s+/);if(bits.length<2)return {surname:v,given:''};return {surname:bits[0],given:bits.slice(1).join(' ')}}
function splitCourse(v){
  // El año es TEXTO: conservar 1°, 1º, 1er, 1ro, Primero, etc. sin convertir a número.
  // El JSON histórico guarda año y división juntos en `course`.
  let x=String(v??'').trim();
  if(!x)return {year:'',division:''};
  let m=x.match(/^(\S+)\s+(.+)$/);
  if(m)return {year:m[1],division:m[2].trim()};
  // Compatibilidad con cursos antiguos sin espacio: "1°3ra".
  m=x.match(/^(\d+[°º])(\S+)$/);
  if(m)return {year:m[1],division:m[2]};
  return {year:x,division:''};
}
// Únicamente presentación ordinal de Año y División en el DL-01.
function ordinalDL01(value,part){
 const raw=String(value??'').trim();
 const match=raw.match(/^(\d+)(?:[ºª°]|\.?[oa]|ro|ra|er)?$/i);
 return match ? match[1]+(part==='year'?'º':'ª') : raw;
}
