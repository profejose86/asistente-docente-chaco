(() => {
 const brand=document.querySelector('.adc-brand');if(!brand)return;
 const full=brand.querySelector('.adc-full-title'),short=brand.querySelector('.adc-short-title');
 const measure=()=>{
  brand.style.setProperty('--adc-title-width',full.getBoundingClientRect().width+'px');
  brand.style.setProperty('--adc-short-width',short.getBoundingClientRect().width+'px');
 };
 measure();new ResizeObserver(measure).observe(full);new ResizeObserver(measure).observe(short);
 // Quienes prefieren movimiento reducido conservan el nombre completo.
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setTimeout(()=>brand.classList.add('is-compact'),5000);
})();
