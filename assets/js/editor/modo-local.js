// Marca sólo el acceso al puente local. ADC Studio también puede abrirse online.
if(location.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname))document.documentElement.dataset.adcLocalEditor='';
