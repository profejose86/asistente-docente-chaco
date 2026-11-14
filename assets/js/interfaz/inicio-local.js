(() => {
  if(window.adcConfig?.authMode==='supabase'){
    document.documentElement.classList.add('adc-auth-pending');
    // Si falla la carga del adaptador, no permitir que los módulos antiguos
    // vuelvan a escribir en las claves compartidas sin aislamiento de cuenta.
    if(!window.adcUserStorage){
      const unavailable=()=>{throw Error('No se cargó el almacenamiento privado. Recargá la página.');};
      window.adcUserStorage=Object.freeze({getItem:()=>null,setItem:unavailable,removeItem:unavailable,bind:unavailable,scope:()=>null,lock(){}});
    }
    return;
  }
  const url = new URL(window.location.href);
  // Acceso de demostración durante la revisión local y en GitHub Pages.
  // Este parámetro controla la navegación, no autentica al usuario.
  if (url.searchParams.get('adc-preview') !== '1') {
    window.location.replace(new URL('ADC_Ingreso_Editable.html', url).href);
  }
})();
