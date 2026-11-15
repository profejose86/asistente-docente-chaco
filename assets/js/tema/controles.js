
(()=>{
 const root=document.documentElement,button=document.getElementById('adcThemeSwitch');
 // Conservar los índices históricos del editor antes de presentar el selector aprobado.
 document.addEventListener('DOMContentLoaded',()=>{
  const content=document.getElementById('adcSharedThemeContent');
  if(content){button.replaceChildren(content.content.cloneNode(true));button.setAttribute('aria-label','Tema oscuro');}
 },{once:true});
 function apply(dark){
  root.dataset.theme=dark?'dark':'light';
  button.setAttribute('aria-checked',String(dark));
 }
 apply(root.dataset.theme==='dark');
 button.addEventListener('click',()=>{
  const dark=root.dataset.theme!=='dark';
  apply(dark);
  try{localStorage.setItem('adc-login-theme',root.dataset.theme)}catch{}
 });
})();
