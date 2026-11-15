try{
 const saved=localStorage.getItem('adc-login-theme')??localStorage.getItem('adc_theme');
 document.documentElement.dataset.theme=saved==='dark'?'dark':'light';
}catch{}
