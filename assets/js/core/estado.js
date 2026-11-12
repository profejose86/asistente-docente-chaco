const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const days=['Lun','Mar','Mié','Jue','Vie'];let inst=[],nextId=1,selected='Enfermedad o lesión común',usage={};try{usage=JSON.parse(localStorage.getItem('adc_v07_usage')||'{}')}catch(e){};
for(const old of ['Inasistencias','Inasistencia (justificada)','Inasistencia por lluvia']){if(usage[old]){usage['Inasistencias (justificada)']=(usage['Inasistencias (justificada)']||0)+usage[old];delete usage[old];}}
