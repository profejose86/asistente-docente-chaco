
{
 const theme=document.getElementById('adcThemeSwitch');
 const root=document.documentElement;
 const status=document.getElementById('adcLoginStatus');
 // Modo de demostración explícito para revisar el ingreso también online.
 const localPreview=window.adcConfig?.authMode!=='supabase';
 if(localPreview){
  document.getElementById('adcLoginForm').noValidate=true;
  for(const input of document.querySelectorAll('#adcLoginForm input'))input.required=false;
  status.textContent='Modo de demostración, sin autenticación real. Podés ingresar sin completar datos.';
 }
 function setTheme(dark){
  root.dataset.theme=dark?'dark':'light';
  theme.setAttribute('aria-checked',String(dark));
 }
 try{setTheme(localStorage.getItem('adc-login-theme')==='dark')}catch{}
 theme.addEventListener('click',()=>{
  setTheme(root.dataset.theme!=='dark');
  try{localStorage.setItem('adc-login-theme',root.dataset.theme)}catch{}
 });
 document.getElementById('adcGoogle').addEventListener('click',()=>{status.textContent='El acceso con Google todavía está sin conectar en esta prueba.'});
 document.getElementById('adcLoginForm').addEventListener('submit',event=>{
  event.preventDefault();
  if(localPreview){
   window.location.assign(new URL('index.html?adc-preview=1',window.location.href).href);
   return;
  }
  status.textContent='Ingreso de demostración. El sistema de cuentas todavía está sin conectar.';
 });
 const loginForm=document.getElementById('adcLoginForm');
 const signupForm=document.getElementById('adcSignupForm');
 const signupPrompt=document.getElementById('adcSignupPrompt');
 const title=document.getElementById('adcLoginTitle');
 const separator=document.querySelector('.adc-separator');
 const openSignup=document.getElementById('adcOpenSignup');
 function showSignup(show){
  loginForm.hidden=show;
  signupPrompt.hidden=show;
  signupForm.hidden=!show;
  title.textContent=show?'Creá tu cuenta':'Ingresá a tu cuenta';
  separator.textContent=show?'o registrate con tu correo':'o ingresá con tu correo';
  status.textContent='';
  if(show) signupForm.querySelector('input').focus();
  else {
   signupForm.reset();
   openSignup.focus();
  }
 }
 openSignup.addEventListener('click',()=>showSignup(true));
 document.getElementById('adcBackToLogin').addEventListener('click',()=>showSignup(false));
 signupForm.addEventListener('submit',event=>{
  event.preventDefault();
  signupForm.querySelector('input[type=password]').value='';
  status.textContent='Registro de demostración. La creación de cuentas estará disponible al conectar el sistema de cuentas.';
 });
 document.getElementById('adcRecover').addEventListener('click',()=>{status.textContent='La recuperación de contraseña estará disponible al conectar el sistema de cuentas.'});
}
