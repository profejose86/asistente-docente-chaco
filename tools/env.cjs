const fs=require('node:fs'),path=require('node:path');
function readEnv(root=path.resolve(__dirname,'..'),environment=process.env){
  const result={};
  for(const name of ['.env','.env.local']){
    const file=path.join(root,name);if(!fs.existsSync(file))continue;
    for(const line of fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){
      const match=line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);if(!match)continue;
      let value=match[2];if(/^(["']).*\1$/.test(value))value=value.slice(1,-1);else value=value.replace(/\s+#.*$/,'');result[match[1]]=value;
    }
  }
  return {...result,...environment};
}
function publicConfig(env){
  const url=(env.SUPABASE_URL||'').trim(),key=(env.SUPABASE_ANON_KEY||'').trim();
  const mode=env.ADC_AUTH_MODE||'supabase';
  if(!['demo','supabase'].includes(mode))throw Error('ADC_AUTH_MODE debe ser demo o supabase.');
  if(mode==='demo'&&(url||key))throw Error('Hay credenciales configuradas: usá ADC_AUTH_MODE=supabase para evitar un ingreso sin autenticación.');
  if(mode==='supabase'){
    if(!url||!key)throw Error('Completá SUPABASE_URL y SUPABASE_ANON_KEY en .env.local.');
    const parsed=new URL(url);
    if(parsed.protocol!=='https:'&&!(parsed.protocol==='http:'&&['localhost','127.0.0.1'].includes(parsed.hostname)))throw Error('Supabase requiere HTTPS salvo en localhost.');
    if(parsed.username||parsed.password||parsed.search||parsed.hash||parsed.pathname!=='/')throw Error('SUPABASE_URL debe ser la URL base del proyecto.');
    if(!key.startsWith('sb_publishable_')){
      let payload;try{payload=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString('utf8'));}catch{}
      if(!payload||payload.role!=='anon')throw Error('Sólo se admite una clave publishable o anon. Nunca service_role, sb_secret ni un token de gestión.');
    }
  }
  return {authMode:mode,supabaseUrl:url.replace(/\/$/,''),supabaseAnonKey:key,googleAuthEnabled:env.ADC_GOOGLE_AUTH_ENABLED==='true',emailConfirmationsRequired:env.ADC_EMAIL_CONFIRMATIONS_REQUIRED!=='false',passwordRecoveryEnabled:env.ADC_PASSWORD_RECOVERY_ENABLED!=='false',environment:'staging'};
}
module.exports={readEnv,publicConfig};
