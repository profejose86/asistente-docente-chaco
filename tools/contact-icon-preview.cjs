// Vista local aislada: sirve la web existente e inserta el ejemplo después del editor.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {script:demoConfig}=require('../tests/support/demo-config.cjs');
const root=path.resolve(__dirname,'..'),fixture=fs.readFileSync(path.join(root,'tests/fixtures/contact-icon.html'),'utf8');
const markup=fixture.split('<!-- Componente visual ADC -->')[1].split('</main>')[0];
const css=fixture.split('/* CSS principal suministrado */')[1].split('</style>')[0];
const behavior=fixture.match(/<script>([\s\S]*?)<\/script>/)[1];
const login=fs.readFileSync(path.join(root,'ADC_Ingreso_Editable.html'),'utf8');
const themeMarkup=login.match(/<button[^>]*id="adcThemeSwitch"[\s\S]*?<\/button>/)[0];
const themeCss=fs.readFileSync(path.join(root,'assets/css/interfaz/selector-tema.css'),'utf8');
const themeBehavior=fs.readFileSync(path.join(root,'assets/js/tema/controles.js'),'utf8');
const previewCss=fs.readFileSync(path.join(root,'tests/fixtures/contact-icon-web.css'),'utf8');
const injection=`document.addEventListener('DOMContentLoaded',()=>{
 const style=document.createElement('style');style.textContent=${JSON.stringify(css+'\n'+themeCss+'\n'+previewCss)};document.head.append(style);
 document.body.insertAdjacentHTML('beforeend',${JSON.stringify(markup)});
 const personal=document.querySelector('#profile > section'),birth=document.getElementById('perfilNacimiento');
 const required=[['perfilTituloEdicion','Título que posee'],['perfilRegistro','N.º de registro'],['perfilOtorgado','Otorgado por'],['perfilAntiguedadVista','Antigüedad docente']];
  const review=adcGuidedValidation.createBlocking({root:personal,collect:()=>[...(birth.value&&!birth.checkValidity()?[{key:'perfilNacimiento',message:birth.validationMessage,controls:[birth]}]:[]),...required.filter(([id])=>!document.getElementById(id).value.trim()).map(([id,label])=>({key:id,message:'Completá '+label.toLowerCase()+'.',controls:[document.getElementById(id)]}))]});
  const previousTab=window.tab;window.tab=function(next){if(next!=='profile'&&!document.getElementById('profile').classList.contains('hide')&&!review.check())return;review.cancel();return previousTab.apply(this,arguments)};
  // Acceso directo de revisión sólo en este servidor demo, sin tocar autenticación ni rutas públicas.
  const requestedForm=new URL(location.href).searchParams.get('adc-form');if(['form-3','form-6','bd07'].includes(requestedForm)){
   previousTab('tramites');requestAnimationFrame(()=>document.querySelector('[data-adc-official-form='+requestedForm+']')?.click());
  }
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
