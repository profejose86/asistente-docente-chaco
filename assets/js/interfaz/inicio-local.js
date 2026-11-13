(() => {
  const url = new URL(window.location.href);
  // Acceso de demostración durante la revisión local y en GitHub Pages.
  // Este parámetro controla la navegación, no autentica al usuario.
  if (url.searchParams.get('adc-preview') !== '1') {
    window.location.replace(new URL('ADC_Ingreso_Editable.html', url).href);
  }
})();
