import {createClient} from '@supabase/supabase-js';

// Sólo claves públicas. Nunca incorporar service_role, tokens de gestión o claves secretas.
const config=window.adcConfig||{authMode:'demo'};
const realAuth=config.authMode==='supabase';
let client=null,configurationError=null;
try{
  if(realAuth){
    if(!config.supabaseUrl||!config.supabaseAnonKey)throw Error('Falta configurar Supabase.');
    if(config.supabaseAnonKey.startsWith('sb_secret_'))throw Error('No se admiten claves secretas en el navegador.');
    client=createClient(config.supabaseUrl,config.supabaseAnonKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce',storageKey:'adc-supabase-auth'}
    });
  }
}catch(error){configurationError=error;}
const fail=()=>{if(!client)throw configurationError||Error('Supabase todavía no está configurado.');return client;};
const value=result=>{if(result.error)throw result.error;return result.data;};
const callback=(recovery=false)=>{
  const url=new URL('ADC_Ingreso_Editable.html',location.href);
  if(recovery)url.searchParams.set('flow','recovery');return url.href;
};
async function user(){
  const api=fail(),session=value(await api.auth.getSession()).session;
  if(!session)return null;
  return value(await api.auth.getUser()).user;
}
const isAdminUser=candidate=>candidate?.app_metadata?.adc_role==='admin';
async function isAdmin(){return isAdminUser(await user());}
async function ensureTesterProfile(authenticated){
  const api=fail();
  const select=()=>api.from('adc_tester_profiles').select('id,display_name,created_at,updated_at').eq('id',authenticated.id);
  const row=value(await select().maybeSingle());
  if(row)return row;
  const inserted=await api.from('adc_tester_profiles').insert({id:authenticated.id,display_name:''}).select('id,display_name,created_at,updated_at').single();
  if(inserted.error?.code==='23505')return value(await select().single());
  return value(inserted);
}
async function profile(){
  const authenticated=await user();if(!authenticated)throw Error('Iniciá sesión para consultar tu cuenta.');
  return ensureTesterProfile(authenticated);
}
async function syncSession(owner){
  const api=fail(),session=value(await api.auth.getSession()).session;
  if(!session)throw Error('La sesión terminó.');
  // Fijar el token de esta operación: un cambio de cuenta concurrente no debe
  // enviar el documento anterior usando las credenciales de la cuenta nueva.
  const authenticated=value(await api.auth.getUser(session.access_token)).user;
  if(authenticated?.id!==owner)throw Error('La cuenta cambió.');
  return {api,token:session.access_token};
}
const syncRecords={
  async list(owner){
    const {api,token}=await syncSession(owner),rows=[];let after='';
    for(;;){
      let query=api.from('adc_user_records').select('owner_id,record_key,schema_version,revision,payload,deleted,updated_at').eq('owner_id',owner).order('record_key').limit(200);
      if(after)query=query.gt('record_key',after);
      const page=value(await query.setHeader('Authorization','Bearer '+token));rows.push(...page);
      if(page.length<200)return rows;after=page.at(-1).record_key;
    }
  },
  async put(owner,key,raw,revision){
    const {api,token}=await syncSession(owner);
    const result=value(await api.rpc('adc_sync_put',{p_key:key,p_raw:raw,p_expected_revision:revision,p_schema_version:1}).setHeader('Authorization','Bearer '+token));
    return Array.isArray(result)?result[0]:result;
  }
};
let recovery=new URL(location.href).searchParams.get('flow')==='recovery'||location.hash.includes('type=recovery');
if(client)client.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY')recovery=true;
  // No consultar Postgres dentro de este callback: evita bloqueos del cliente Auth.
  window.dispatchEvent(new CustomEvent('adc:auth-changed',{detail:{event,userId:session?.user?.id||null,isAdmin:isAdminUser(session?.user)}}));
});
window.adcAuth={
  mode:realAuth?'supabase':'demo',configured:!!client,error:configurationError,
  ready:client?client.auth.getSession().then(result=>{value(result);return true;}):Promise.resolve(!realAuth),
  isRecovery:()=>recovery,
  user,isAdmin,isAdminUser,profile,syncRecords,
  async signIn(email,password){return value(await fail().auth.signInWithPassword({email,password}));},
  async signUp(email,password){return value(await fail().auth.signUp({email,password,options:{emailRedirectTo:callback()}}));},
  async signOut(){return value(await fail().auth.signOut({scope:'local'}));},
  async resetPassword(email){
    if(config.passwordRecoveryEnabled===false)throw Error('La recuperación por correo todavía no está disponible en este piloto. Contactá al administrador de ADC.');
    return value(await fail().auth.resetPasswordForEmail(email,{redirectTo:callback(true)}));
  },
  async updatePassword(password){const result=value(await fail().auth.updateUser({password}));recovery=false;return result;},
  async signInWithGoogle(){
    if(!config.googleAuthEnabled)throw Error('Google no está habilitado en este entorno. Ingresá con correo y contraseña.');
    return value(await fail().auth.signInWithOAuth({provider:'google',options:{redirectTo:callback()}}));
  },
  async saveTesterName(displayName){
    const authenticated=await user();if(!authenticated)throw Error('Iniciá sesión.');
    const name=String(displayName).trim();if(name.length>80)throw Error('El nombre admite hasta 80 caracteres.');
    await ensureTesterProfile(authenticated);return value(await fail().from('adc_tester_profiles').update({display_name:name}).eq('id',authenticated.id).select('id,display_name,created_at,updated_at').single());
  }
};
