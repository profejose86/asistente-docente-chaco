const deployment=require('../config/publicacion.json');
function authSettings(env,previous={},online=false){
 const value=online?deployment.siteUrl:env.ADC_SITE_URL||'http://127.0.0.1:8765/';
 const url=new URL(value);
 if(url.username||url.password||url.search||url.hash||url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error('ADC_SITE_URL debe ser una URL HTTPS válida, salvo localhost.');
 if(!url.pathname.endsWith('/'))url.pathname+='/';
 const callbacks=[new URL('ADC_Ingreso_Editable.html',url).href,new URL('ADC_Ingreso_Editable.html?flow=recovery',url).href,'http://127.0.0.1:8765/**','http://localhost:8765/**'];
 const redirects=[...new Set([...(previous.uri_allow_list||'').split(',').map(value=>value.trim()).filter(Boolean),...callbacks])];
 const settings={site_url:url.href,uri_allow_list:redirects.join(','),mailer_autoconfirm:env.ADC_EMAIL_CONFIRMATIONS_REQUIRED==='false',password_min_length:12};
 const smtpKeys=['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASSWORD','SMTP_SENDER_EMAIL'];
 const present=smtpKeys.filter(key=>env[key]);
 if(present.length&&present.length!==smtpKeys.length)throw Error('Faltan variables SMTP. No se aplicará una configuración de correo incompleta.');
 if(present.length){
  if(!['465','587','2525'].includes(String(env.SMTP_PORT)))throw Error('Puerto SMTP no admitido. Usá el puerto indicado por tu proveedor (465, 587 o 2525).');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.SMTP_SENDER_EMAIL))throw Error('Remitente SMTP inválido.');
  Object.assign(settings,{smtp_host:env.SMTP_HOST,smtp_port:String(env.SMTP_PORT),smtp_user:env.SMTP_USER,smtp_pass:env.SMTP_PASSWORD,smtp_admin_email:env.SMTP_SENDER_EMAIL,smtp_sender_name:env.SMTP_SENDER_NAME||'Asistente Docente Chaco'});
 }
 return settings;
}
module.exports={authSettings};
