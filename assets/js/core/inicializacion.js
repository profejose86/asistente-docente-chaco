const djRenderOriginal=render;render=function(){djRenderOriginal();djProfileExtras()};

try{djInstitutionOrder=JSON.parse(localStorage.getItem('adc_dj_institution_order')||'[]');if(!Array.isArray(djInstitutionOrder))djInstitutionOrder=[];djPresentedAt=localStorage.getItem('adc_dj_presented_at')||'';}catch(e){djInstitutionOrder=[];djPresentedAt='';}
renderTramites();renderFrecuentes();$('elegido').textContent='Trámite inicial: Enfermedad o lesión común';
addInst();
tab('profile');
window.addEventListener('DOMContentLoaded',()=>{
 try{
  const raw=localStorage.getItem('adc_v08');
  if(!raw)return;
  const saved=JSON.parse(raw);
  if(!saved)return;
  validateProfileBackup(saved);
  applyData(saved);
  if(!inst.length)addInst();
 }catch(error){console.error('No se pudo restaurar el perfil guardado.',error);}
});
