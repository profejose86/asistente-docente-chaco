const {test}=require('node:test'),assert=require('node:assert/strict');
const {assertIsolated}=require('../tools/sync-staging.cjs');
test('Staging: Google y recuperación requieren configuración propia y completa',()=>{
 const {stagingAuthOptions}=require('../tools/sync-staging.cjs');
 const disabled=stagingAuthOptions({GOOGLE_CLIENT_ID:'production',SMTP_HOST:'production'});
 assert.equal(disabled.googleEnabled,false);assert.equal(disabled.passwordRecoveryEnabled,false);
 assert.throws(()=>stagingAuthOptions({ADC_STAGING_GOOGLE_CLIENT_ID:'123.apps.googleusercontent.com'}),/ambas/);
 assert.throws(()=>stagingAuthOptions({ADC_STAGING_SMTP_HOST:'smtp.example.test'}),/SMTP/);
 const enabled=stagingAuthOptions({ADC_STAGING_GOOGLE_CLIENT_ID:'123.apps.googleusercontent.com',ADC_STAGING_GOOGLE_CLIENT_SECRET:'fixture-only',ADC_STAGING_SMTP_HOST:'smtp.example.test',ADC_STAGING_SMTP_PORT:'587',ADC_STAGING_SMTP_USER:'fixture',ADC_STAGING_SMTP_PASSWORD:'fixture-only',ADC_STAGING_SMTP_SENDER_EMAIL:'adc@example.test'});
 assert.equal(enabled.googleEnabled,true);assert.equal(enabled.passwordRecoveryEnabled,true);assert.equal(enabled.patch.external_google_enabled,true);
 assert.ok(enabled.patch.uri_allow_list.includes('ADC_Ingreso_Editable?flow=recovery'));
 assert.equal(enabled.patch.smtp_host,'smtp.example.test');
});
test('Staging: bloquea producción y sólo permite referencias independientes',()=>{
 const production={SUPABASE_PROJECT_REF:'aaaaaaaaaaaaaaaaaaaa',SUPABASE_URL:'https://bbbbbbbbbbbbbbbbbbbb.supabase.co'};
 assert.throws(()=>assertIsolated(production.SUPABASE_PROJECT_REF,production),/producción/);
 assert.throws(()=>assertIsolated('bbbbbbbbbbbbbbbbbbbb',production),/producción/);
 assert.throws(()=>assertIsolated('tdjbpgoelqvuoaydinxo',production),/producción/);
 assert.throws(()=>assertIsolated('invalid',production),/inválida/);
 assert.equal(assertIsolated('cccccccccccccccccccc',production),'cccccccccccccccccccc');
});
