(() => {
  const url = new URL(window.location.href);
  const local = url.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (local && url.searchParams.get('adc-preview') !== '1') {
    window.location.replace(new URL('ADC_Ingreso_Editable.html', url).href);
  }
})();
