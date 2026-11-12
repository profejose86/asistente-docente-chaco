
(()=>{
 const root=document.documentElement,button=document.getElementById('adcThemeSwitch');
 function apply(dark){
  root.dataset.theme=dark?'dark':'light';
  button.setAttribute('aria-checked',String(dark));
 }
 apply(root.dataset.theme==='dark');
 button.addEventListener('click',()=>{
  const dark=root.dataset.theme!=='dark';
  apply(dark);
  try{localStorage.setItem('adc_theme',root.dataset.theme)}catch{}
 });
})();
