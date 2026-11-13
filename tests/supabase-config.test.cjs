const {test}=require('node:test'),assert=require('node:assert/strict');
const {publicConfig}=require('../tools/env.cjs');
test('Configuración: sólo publica claves anon/publishable, falla cerrada y no mezcla demo y credenciales',()=>{
 const base={ADC_AUTH_MODE:'supabase',SUPABASE_URL:'https://adc-test.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_test'};
 assert.equal(publicConfig(base).authMode,'supabase');
 for(const key of ['sb_secret_test','sbp_management',Buffer.from('header').toString('base64url')+'.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.signature'])assert.throws(()=>publicConfig({...base,SUPABASE_ANON_KEY:key}));
 assert.throws(()=>publicConfig({...base,ADC_AUTH_MODE:'demo'}));
 assert.throws(()=>publicConfig({...base,SUPABASE_ANON_KEY:''}));
 assert.throws(()=>publicConfig({...base,SUPABASE_URL:'http://remote.invalid'}));
 assert.equal(publicConfig({...base,SUPABASE_URL:'http://127.0.0.1:54321'}).supabaseUrl,'http://127.0.0.1:54321');
 assert.deepEqual(Object.keys(publicConfig({...base,SUPABASE_ACCESS_TOKEN:'NO_PUBLICAR'})).sort(),['authMode','emailConfirmationsRequired','environment','googleAuthEnabled','passwordRecoveryEnabled','supabaseAnonKey','supabaseUrl']);
});
