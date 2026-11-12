document.addEventListener('click',function(ev){const b=ev.target.closest('button');if(!b)return;const t=(b.textContent||'').toLowerCase();if(/presentar|imprimir/.test(t)){const profile=document.getElementById('profile');if(profile)profile.classList.add('adc-attempted');}});
// Aviso exclusivamente orientativo: nunca altera fechas ni impide generar el DL-01.
let adcAvisoFechaDescartado='';
function adcClaveAvisoFecha(){return ['desde','hasta','presentacion'].map(id=>document.getElementById(id)?.value||'').join('|');}
function adcOcultarAvisoFecha(){adcAvisoFechaDescartado=adcClaveAvisoFecha();document.getElementById('adcPresentacionAviso')?.classList.add('hide');}
function adcActualizarAvisoFecha(){
 const desde=document.getElementById('desde')?.value, hasta=document.getElementById('hasta')?.value, fecha=document.getElementById('presentacion')?.value;
 const aviso=document.getElementById('adcPresentacionAviso');if(!aviso)return;
 const coincide=Boolean(desde&&hasta&&fecha&&desde<=hasta&&fecha>=desde&&fecha<=hasta);
 aviso.classList.toggle('hide',!coincide||adcAvisoFechaDescartado===adcClaveAvisoFecha());
}
['desde','hasta','presentacion'].forEach(id=>{
 const campo=document.getElementById(id);
 if(campo){campo.addEventListener('input',adcActualizarAvisoFecha);campo.addEventListener('change',adcActualizarAvisoFecha);}
});
