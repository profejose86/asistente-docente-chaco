(() => {
 if(window.adcConfig?.authMode!=='supabase')return;
 const auth=window.adcAuth,status=document.getElementById('adcLoginStatus');
 const login=document.getElementById('adcLoginForm'),signup=document.getElementById('adcSignupForm');
 const landing=()=>new URL('index.html',location.href).href;
 const message=(text,error=false)=>{status.textContent=text;status.dataset.error=String(error);};
 const email=document.getElementById('adcLoginEmail'),password=document.getElementById('adcLoginPassword');
 email.autocomplete='username';password.autocomplete='current-password';
 for(const input of document.querySelectorAll('#adcLoginCard input[type=password]'))input.minLength=12;
 message(window.adcConfig.emailConfirmationsRequired===false?'Prueba piloto: creá tu cuenta e ingresá directamente, sin confirmar el correo. Tus borradores permanecen en este dispositivo.':'Entorno de prueba ADC. Ingresá con tu cuenta. Los borradores de formularios permanecen en este dispositivo.');
 let busy=false;
 function friendly(error){
  if(error?.code==='invalid_credentials')return 'Correo o contraseña incorrectos.';
  if(error?.code==='email_not_confirmed')return 'Confirmá tu correo antes de ingresar.';
  if(['over_email_send_rate_limit','over_request_rate_limit'].includes(error?.code))return 'Se alcanzó el límite de intentos. Esperá unos minutos y volvé a probar.';
  if(error?.code==='signup_disabled')return 'El registro está cerrado en este entorno de prueba.';
  if(error?.code==='weak_password')return 'Elegí una contraseña más segura, de al menos 12 caracteres.';
  if(/fetch|network/i.test(error?.message||''))return 'No se pudo conectar. Revisá la conexión y la configuración de Supabase.';
  return error?.message||'No se pudo completar la operación.';
 }
 async function action(fn){
  if(busy)return;busy=true;
  const buttons=[...document.querySelectorAll('#adcLoginCard button')],previous=buttons.map(button=>button.disabled);buttons.forEach(button=>button.disabled=true);
  try{if(!auth?.configured)throw auth?.error||Error('Falta configurar Supabase.');await fn();}catch(error){message(friendly(error),true);}finally{buttons.forEach((button,index)=>button.disabled=previous[index]);busy=false;}
 }
 // Captura antes de los handlers históricos de demostración.
 const intercept=(node,type,run)=>node.addEventListener(type,event=>{event.preventDefault();event.stopImmediatePropagation();run();},true);
 intercept(login,'submit',()=>{
  if(!login.reportValidity())return;
  action(async()=>{message('Ingresando…');try{await auth.signIn(email.value.trim(),password.value);location.assign(landing());}finally{password.value='';}});
 });
 intercept(signup,'submit',()=>{
  if(!signup.reportValidity())return;
  action(async()=>{message('Creando tu cuenta…');const input=document.getElementById('adcSignupPassword');try{const result=await auth.signUp(document.getElementById('adcSignupEmail').value.trim(),input.value);if(result.session)location.assign(landing());else message('Si el registro corresponde, recibirás un correo. Abrí el enlace en este mismo navegador para confirmar tu cuenta.');}finally{input.value='';}});
 });
 intercept(document.getElementById('adcGoogle'),'click',()=>action(()=>auth.signInWithGoogle()));
 intercept(document.getElementById('adcRecover'),'click',()=>{
  if(window.adcConfig.passwordRecoveryEnabled===false){message('La recuperación por correo todavía no está disponible en este piloto. Contactá al administrador de ADC.');return;}
  if(!email.value.trim()||!email.checkValidity()){message('Escribí un correo válido para recuperar tu contraseña.',true);email.focus();return;}
  action(async()=>{await auth.resetPassword(email.value.trim());message('Si el correo corresponde a una cuenta, recibirás las instrucciones para recuperarla.');});
 });
 const recovery=document.createElement('form');recovery.id='adcRecoveryForm';recovery.hidden=true;
 recovery.innerHTML='<label>Nueva contraseña<input type="password" minlength="12" required autocomplete="new-password" aria-label="Nueva contraseña"></label><button class="adc-login" type="submit">Guardar nueva contraseña</button>';
 status.before(recovery);
 recovery.addEventListener('submit',event=>{event.preventDefault();if(!recovery.reportValidity())return;action(async()=>{try{await auth.updatePassword(recovery.querySelector('input').value);await auth.signOut();location.replace(new URL('ADC_Ingreso_Editable.html',location.href).href);}finally{recovery.reset();}});});
 async function resume(){
  try{
   if(!auth?.configured)throw auth?.error||Error('Falta configurar Supabase.');await auth.ready;
   if(auth.isRecovery()){login.hidden=true;signup.hidden=true;document.getElementById('adcSignupPrompt').hidden=true;document.getElementById('adcGoogle').hidden=true;recovery.hidden=false;document.getElementById('adcLoginTitle').textContent='Elegí una nueva contraseña';message('Usá una contraseña de al menos 12 caracteres.');return;}
   if(await auth.user())location.replace(landing());
  }catch(error){message(friendly(error),true);}
 }
 window.addEventListener('adc:auth-changed',event=>{if(event.detail?.event==='PASSWORD_RECOVERY')resume();});
 resume();
})();
