(() => {
 const card=document.getElementById('adcLoginCard');
 if(!card)return;
 const controls=[];
 for(const input of card.querySelectorAll('input[type="password"]')){
  const wrapper=document.createElement('span');wrapper.className='adc-password-field';
  input.before(wrapper);wrapper.append(input);
  const button=document.createElement('button');button.type='button';button.className='adc-password-toggle';
  button.setAttribute('aria-controls',input.id||(input.id='adcRecoveryPassword'));
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="adc-eye-slash" d="m3 3 18 18"/></svg>';
  function show(visible){
   input.type=visible?'text':'password';
   button.setAttribute('aria-label',visible?'Ocultar contraseña':'Mostrar contraseña');
   button.setAttribute('aria-pressed',String(visible));
   button.title=visible?'Ocultar contraseña':'Mostrar contraseña';
  }
  show(false);button.addEventListener('click',()=>show(input.type==='password'));
  wrapper.append(button);controls.push(()=>show(false));
 }
 const hide=()=>controls.forEach(reset=>reset());
 card.addEventListener('submit',hide,true);
 for(const id of ['adcOpenSignup','adcBackToLogin'])document.getElementById(id)?.addEventListener('click',hide);
 window.addEventListener('pagehide',hide);
})();
