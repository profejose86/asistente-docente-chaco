// Vista local aislada: sirve la web existente e inserta el ejemplo después del editor.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {script:demoConfig}=require('../tests/support/demo-config.cjs');
const root=path.resolve(__dirname,'..'),fixture=fs.readFileSync(path.join(root,'tests/fixtures/contact-icon.html'),'utf8');
const markup=fixture.split('<!-- Componente visual ADC -->')[1].split('</main>')[0];
const css=fixture.split('/* CSS principal suministrado */')[1].split('</style>')[0];
const behavior=fixture.match(/<script>([\s\S]*?)<\/script>/)[1];
const login=fs.readFileSync(path.join(root,'ADC_Ingreso_Editable.html'),'utf8');
const themeMarkup=login.match(/<button[^>]*id="adcThemeSwitch"[\s\S]*?<\/button>/)[0];
const loginCss=fs.readFileSync(path.join(root,'assets/css/acceso/ingreso.css'),'utf8');
const themeCss=loginCss.slice(loginCss.indexOf('#adcThemeSwitch{'),loginCss.indexOf('@media(max-width:460px)')).replaceAll('#adcThemeSwitch','html[data-theme] body > #adcThemeSwitch');
const loginBehavior=fs.readFileSync(path.join(root,'assets/js/acceso/ingreso.js'),'utf8');
const themeBehavior=`(()=>{const theme=document.getElementById('adcThemeSwitch'),root=document.documentElement;${loginBehavior.slice(loginBehavior.indexOf(' function setTheme('),loginBehavior.indexOf(" document.getElementById('adcGoogle')"))}})();`;
const previewCss=fs.readFileSync(path.join(root,'tests/fixtures/contact-icon-web.css'),'utf8');
const injection=`document.addEventListener('DOMContentLoaded',()=>{
 const style=document.createElement('style');style.textContent=${JSON.stringify(css+'\n'+themeCss+'\n'+previewCss)};document.head.append(style);
 document.body.insertAdjacentHTML('beforeend',${JSON.stringify(markup)});
 const personal=document.querySelector('#profile > section');personal.classList.add('adc-preview-personal');
 document.getElementById('perfilApellidos').placeholder='Ej.: Pérez';document.getElementById('perfilNombres').placeholder='Ej.: Juan Pablo';
 // Fecha completa en la prueba visual; el contrato histórico sigue recibiendo el año.
 const legacyYear=document.getElementById('perfilClase'),year=legacyYear.closest('label');
 for(const node of year.childNodes)if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim()){node.textContent='Fecha de nacimiento';break;}
 const birth=document.createElement('input');birth.id='perfilNacimiento';birth.type='text';birth.inputMode='numeric';birth.placeholder='dd/mm/aaaa';birth.maxLength=10;birth.setAttribute('aria-label','Fecha de nacimiento, día mes y año');
 legacyYear.before(birth);legacyYear.type='hidden';
 birth.addEventListener('input',adcSyncBirthDate);
 const cellLabel=document.createElement('label'),cell=document.createElement('input');cell.id='perfilCelular';cell.type='tel';cell.autocomplete='tel';cell.placeholder='Ej.: 3624539175';cellLabel.append(document.createTextNode('Celular'),cell);personal.querySelector('.fields').append(cellLabel);
 const titleSource=document.getElementById('perfilTitulo'),title=document.createElement('textarea');title.id='perfilTituloEdicion';title.rows=1;title.placeholder=titleSource.placeholder;titleSource.before(title);titleSource.type='hidden';
 const resizeTitle=()=>{title.style.height='42px';title.style.height=Math.max(42,Math.min(64,title.scrollHeight+2))+'px'};
 title.addEventListener('input',()=>{titleSource.value=title.value;titleSource.dispatchEvent(new Event('input',{bubbles:true}));resizeTitle()});
 title.addEventListener('change',()=>titleSource.dispatchEvent(new Event('change',{bubbles:true})));
 for(const label of personal.querySelectorAll('label')){
  const caption=document.createElement('span');caption.className='adc-preview-caption';
  while(label.firstChild&&!['INPUT','SELECT','TEXTAREA'].includes(label.firstChild.nodeName))caption.append(label.firstChild);
  label.prepend(caption);
 }
 const arrangeProfile=()=>{
  const phone=document.getElementById('perfilTelefonoFijo'),address=personal.querySelector('.adc-profile-address .fields');
  if(!phone||!address)return false;
  const fields=personal.querySelector('.fields');fields.classList.add('adc-preview-personal-grid');
  const positions={perfilNacimiento:'birth',sexo:'sex',correo:'email',perfilCelular:'phone',perfilTitulo:'title',perfilRegistro:'registration',perfilOtorgado:'issuer',perfilAntiguedadVista:'seniority',perfilInicioActividad:'start'};
  for(const [id,area] of Object.entries(positions)){const label=document.getElementById(id).closest('label');label.style.gridArea=area;fields.append(label);}
  for(const id of ['perfilDomicilio','perfilNumeroCalle','perfilUnidad','perfilManzana','perfilBarrio','perfilLocalidad','perfilCodigoPostal','perfilDepartamento']){
   const label=document.getElementById(id).closest('label');label.dataset.adcAddressField=id;label.style.removeProperty('grid-area');address.append(label);
  }
  const labels={perfilUnidad:'Depto., casa, UF y N.º',perfilManzana:'Manzana, torre, parcela',sexo:'Sexo',correo:'Correo electrónico',perfilAntiguedadVista:'Antigüedad docente',perfilInicioActividad:'Inicio de actividad docente (opcional)'};
  for(const label of personal.querySelectorAll('label')){
   let caption=label.querySelector('.adc-preview-caption');if(!caption){caption=document.createElement('span');caption.className='adc-preview-caption';while(label.firstChild&&!['INPUT','SELECT','TEXTAREA'].includes(label.firstChild.nodeName))caption.append(label.firstChild);label.prepend(caption);}
   const id=label.querySelector('input:not([type=hidden]),select')?.id;
   if(labels[id]){for(const node of caption.childNodes)if(node.nodeType===Node.TEXT_NODE){node.textContent=labels[id];break;}}
  }
  document.getElementById('perfilDomicilio').placeholder='Calle, Av., S/N';phone.placeholder='Ej.: 3624539175';
  const titleRow=document.createElement('div');titleRow.className='adc-preview-title-row';fields.append(titleRow);
  for(const id of ['perfilTitulo','perfilRegistro']){const label=document.getElementById(id).closest('label');label.style.removeProperty('grid-area');titleRow.append(label);}
  const previous=document.createElement('details');previous.className='adc-preview-old-phone';const summary=document.createElement('summary');summary.textContent='Teléfono fijo guardado anteriormente';previous.append(summary,phone.closest('label'));address.parentElement.after(previous);
  const legacyHint=document.createElement('small');legacyHint.className='small';birth.after(legacyHint);
  window.adcPreviewRefreshProfile=()=>{title.value=titleSource.value;resizeTitle();previous.hidden=!phone.value;legacyHint.textContent=!birth.value&&legacyYear.value?'Año conservado del perfil anterior: '+adcPersonalDigits(legacyYear.value)+'. Completá día y mes para registrar tu fecha.':'';legacyHint.hidden=!legacyHint.textContent;};
  adcRestorePersonalExtras(adcPersonalExtra);adcPrefillAccountEmail();
  const required=[['perfilTituloEdicion','Título que posee'],['perfilRegistro','N.º de registro'],['perfilOtorgado','Otorgado por'],['perfilAntiguedadVista','Antigüedad docente']];
  for(const [id] of required){const control=document.getElementById(id);control.required=true;control.closest('label').dataset.previewRequired='';const caption=control.closest('label').querySelector('.adc-preview-caption');for(const mark of control.closest('label').querySelectorAll('[data-adc-pending],#antiguedadAlerta'))caption.append(mark);}
  document.getElementById('perfilDomicilio').closest('label').querySelectorAll('[data-adc-pending]').forEach(mark=>mark.hidden=true);
  const review=adcGuidedValidation.createBlocking({root:personal,collect:()=>[...(birth.value&&!birth.checkValidity()?[{key:'perfilNacimiento',message:birth.validationMessage,controls:[birth]}]:[]),...required.filter(([id])=>!document.getElementById(id).value.trim()).map(([id,label])=>({key:id,message:'Completá '+label.toLowerCase()+'.',controls:[document.getElementById(id)]}))]});
  const previousTab=window.tab;window.tab=function(next){if(next!=='profile'&&!document.getElementById('profile').classList.contains('hide')&&!review.check())return;review.cancel();return previousTab.apply(this,arguments)};
  // Acceso directo de revisión sólo en este servidor demo, sin tocar autenticación ni rutas públicas.
  const requestedForm=new URL(location.href).searchParams.get('adc-form');if(['form-3','form-6','bd07'].includes(requestedForm)){
   previousTab('tramites');requestAnimationFrame(()=>document.querySelector('[data-adc-official-form='+requestedForm+']')?.click());
  }
  window.addEventListener('resize',resizeTitle);
  return true;
 };
 if(!arrangeProfile()){const observer=new MutationObserver(()=>{if(arrangeProfile())observer.disconnect()});observer.observe(personal,{childList:true,subtree:true});}
 ${behavior}
 trigger.type='button';trigger.setAttribute('aria-label','Mi cuenta docente');
 const close=()=>{panel.hidden=true;trigger.setAttribute('aria-expanded','false')};
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){close();trigger.focus()}});
 document.addEventListener('click',event=>{if(!event.target.closest('.adc-account'))close()});
 const sync=document.getElementById('adcSyncBtn');sync.disabled=true;sync.title='Ruta pendiente de definir';
 const logout=document.getElementById('adcLogoutBtn'),status=document.createElement('p');status.setAttribute('role','status');status.hidden=true;panel.append(status);
 logout.addEventListener('click',async()=>{
  logout.disabled=true;status.hidden=true;
  try{
   if(window.adcAuth?.configured){window.adcSyncUI?.stop();await window.adcAuth.signOut();}
   location.replace(new URL('ADC_Ingreso_Editable.html',location.href).href);
  }catch{status.textContent='No se pudo cerrar la sesión. Revisá la conexión y volvé a intentar.';status.hidden=false;logout.disabled=false;}
 });
});`;
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.pdf':'application/pdf','.woff':'font/woff','.woff2':'font/woff2'};
function createServer(){return http.createServer((req,res)=>{
 let route;try{route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return res.writeHead(400).end();}
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(route==='/preview-component.js'){res.setHeader('Content-Type',types['.js']);return res.end(injection);}
 if(route==='/assets/datos/config-publica.js'){res.setHeader('Content-Type',types['.js']);return res.end(demoConfig);}
 if(route==='/assets/js/tema/controles.js'){res.setHeader('Content-Type',types['.js']);return res.end(themeBehavior);}
 if(route==='/assets/js/tema/inicial.js'){res.setHeader('Content-Type',types['.js']);return res.end(fs.readFileSync(path.join(root,'assets/js/tema/inicial.js'),'utf8').replace('adc_theme','adc-login-theme'));}
 if(route==='/'||route==='/index.html'){
  res.setHeader('Content-Type',types['.html']);return res.end(fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<button[^>]*id="adcThemeSwitch"[\s\S]*?<\/button>/,themeMarkup).replace('</body>','<script src="preview-component.js"></script></body>'));
 }
 if(route==='/ADC_Ingreso_Editable.html'){res.setHeader('Content-Type',types['.html']);return res.end(login);}
 if(!route.startsWith('/assets/')||route.split(/[\\/]/).some(part=>part.startsWith('.'))||!types[path.extname(route)])return res.writeHead(404).end();
 const file=path.resolve(root,'.'+route);
 if(!file.startsWith(path.join(root,'assets')+path.sep))return res.writeHead(403).end();
 let real;try{real=fs.realpathSync(file);}catch{return res.writeHead(404).end();}
 if(!real.startsWith(path.join(root,'assets')+path.sep))return res.writeHead(403).end();
 res.setHeader('Content-Type',types[path.extname(file)]);
 fs.readFile(real,(error,data)=>error?res.writeHead(404).end():res.end(data));
});}
if(require.main===module)createServer().listen(8891,'127.0.0.1',()=>console.log('Vista aislada de ADC: http://127.0.0.1:8891/index.html?adc-preview=1'));
module.exports={createServer};
