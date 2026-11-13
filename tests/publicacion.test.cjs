const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {authSettings}=require('../tools/supabase-auth-settings.cjs'),{prepare}=require('../tools/publicar.cjs');
const root=path.resolve(__dirname,'..');
test('Auth online: callbacks de Pages y localhost, sin bajar la confirmación ni publicar SMTP',()=>{
 const settings=authSettings({}, {uri_allow_list:'https://anterior.example/callback'},true);
 assert.equal(settings.site_url,'https://profejose86.github.io/asistente-docente-chaco/');
 assert.ok(settings.uri_allow_list.includes('asistente-docente-chaco/ADC_Ingreso_Editable.html?flow=recovery'));
 assert.ok(settings.uri_allow_list.includes('http://127.0.0.1:8765/**'));
 assert.ok(settings.uri_allow_list.includes('https://anterior.example/callback'));
 assert.equal(settings.mailer_autoconfirm,false);
 assert.equal(authSettings({ADC_EMAIL_CONFIRMATIONS_REQUIRED:'false'}, {},true).mailer_autoconfirm,true);
 assert.throws(()=>authSettings({SMTP_HOST:'smtp.example.test'}, {},true),/incompleta/);
 assert.throws(()=>authSettings({ADC_SITE_URL:'http://inseguro.example'},{}),/HTTPS/);
 const smtp=authSettings({SMTP_HOST:'smtp.example.test',SMTP_PORT:'587',SMTP_USER:'user',SMTP_PASSWORD:'test-only',SMTP_SENDER_EMAIL:'adc@example.test'}, {},true);
 assert.equal(smtp.smtp_pass,'test-only');assert.equal(smtp.smtp_admin_email,'adc@example.test');
});
test('Artefacto online: sólo web, sin variables privadas ni administración y con caché por contenido',async()=>{
 const info=await prepare();assert.equal(info.authMode,'supabase');
 const directory=path.join(root,'dist');
 assert.deepEqual(fs.readdirSync(directory).sort(),['.nojekyll','404.html','ADC_Ingreso_Editable.html','assets','build-info.json','index.html'].sort());
 for(const file of ['.env.local','.env.example','.git','tools','supabase','node_modules','tests','docs'])assert.equal(fs.existsSync(path.join(directory,file)),false);
 const html=fs.readFileSync(path.join(directory,'ADC_Ingreso_Editable.html'),'utf8');
 assert.match(html,/assets\/datos\/config-publica\.js\?v=[a-f0-9]{12}/);
 assert.match(html,/assets\/js\/servicios\/supabase-runtime\.js\?v=[a-f0-9]{12}/);
 assert.doesNotMatch(fs.readFileSync(path.join(directory,'assets/datos/config-publica.js'),'utf8'),/sb_secret_|sbp_/);
 assert.equal(JSON.parse(fs.readFileSync(path.join(directory,'build-info.json'),'utf8')).siteUrl,info.siteUrl);
});
