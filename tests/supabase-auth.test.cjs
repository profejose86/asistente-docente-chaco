const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const id='11111111-1111-4111-8111-111111111111';
const config={authMode:'supabase',supabaseUrl:'https://adc-auth-test.supabase.co',supabaseAnonKey:'sb_publishable_test',googleAuthEnabled:false};
const user={id,aud:'authenticated',role:'authenticated',email:'tester@example.test',email_confirmed_at:'2026-01-01T00:00:00Z',app_metadata:{provider:'email',providers:['email']},user_metadata:{}};
const token=()=>[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({sub:id,aud:'authenticated',role:'authenticated',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'test-signature'].join('.');
const session=()=>({access_token:token(),refresh_token:'test-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user});
test('SDK oficial en Chrome: registro, login real, guard, perfil mínimo, recuperación, cierre y cuenta compartida',async()=>{
 const server=http.createServer((req,res)=>{
    if(require('./support/demo-config.cjs').serve(req,res))return;
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage(),errors=[],requests=[];let profile=null;
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/assets/datos/config-publica.js*',route=>route.fulfill({contentType:'application/javascript',body:'window.adcConfig='+JSON.stringify(config)}));
  await page.route('https://adc-auth-test.supabase.co/**',async route=>{
   const req=route.request(),url=new URL(req.url()),method=req.method(),body=req.postDataJSON();requests.push({path:url.pathname,method,body});
   const json=(value,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'x-supabase-api-version':'2024-01-01','access-control-expose-headers':'X-Supabase-Api-Version'},json:value});
   if(url.pathname.endsWith('/token'))return body?.email==='incorrecto@example.test'?json({code:'invalid_credentials',msg:'Invalid login credentials'},400):json(session());
   if(url.pathname.endsWith('/signup'))return json(user);
   if(url.pathname.endsWith('/user'))return json(user);
   if(url.pathname.endsWith('/logout'))return route.fulfill({status:204});
   if(url.pathname.endsWith('/recover'))return json({});
   if(url.pathname==='/rest/v1/adc_tester_profiles'){
    if(method==='POST')profile={...body,created_at:'2026-01-01',updated_at:'2026-01-01'};
    if(method==='PATCH')profile={...profile,...body};
    return json(req.headers().accept?.includes('vnd.pgrst.object')?profile:profile?[profile]:[]);
   }
   return json({message:'Unexpected request'},500);
  });
  await page.goto(base+'index.html?adc-preview=1');await page.waitForURL(base+'ADC_Ingreso_Editable.html');
  assert.equal(await page.locator('#adcLoginForm').evaluate(form=>form.noValidate),false);
  await page.locator('#adcOpenSignup').click();await page.locator('#adcSignupEmail').fill('tester@example.test');await page.locator('#adcSignupPassword').fill('Prueba-Segura-2026');await page.locator('#adcSignupForm button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#adcLoginStatus').textContent.includes('recibirás un correo'));
  assert.equal(await page.locator('#adcSignupPassword').inputValue(),'');
  await page.locator('#adcBackToLogin').click();await page.locator('#adcLoginEmail').fill('incorrecto@example.test');await page.locator('#adcLoginPassword').fill('Prueba-Segura-2026');await page.locator('#adcLoginForm button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#adcLoginStatus').textContent.includes('incorrectos'),null,{timeout:5000}).catch(async error=>{throw Error(JSON.stringify({status:await page.locator('#adcLoginStatus').textContent(),errors,requests:requests.map(({path,method})=>({path,method}))}));});
  assert.equal(await page.locator('#adcLoginPassword').inputValue(),'');
  await page.locator('#adcLoginEmail').fill('tester@example.test');await page.locator('#adcRecover').click();await page.waitForFunction(()=>document.querySelector('#adcLoginStatus').textContent.includes('recuperarla'));
  await page.locator('#adcGoogle').click();await page.waitForFunction(()=>document.querySelector('#adcLoginStatus').textContent.includes('Google no está habilitado'));
  await page.locator('#adcLoginPassword').fill('Prueba-Segura-2026');await page.locator('#adcLoginForm button[type=submit]').click();await page.waitForURL(base+'index.html');
  const claim=page.getByRole('button',{name:'Usar mis datos de este navegador'});await page.waitForFunction(()=>document.querySelector('#adcSessionBar')||document.querySelector('#adcAuthGate button'));
  if(await claim.isVisible())await claim.click();await page.waitForSelector('#adcSessionBar');
  assert.deepEqual(Object.keys(profile).sort(),['created_at','display_name','id','updated_at']);
  assert.equal(await page.evaluate(()=>localStorage.getItem('adc-auth-local-owner')),id);
  await page.evaluate(()=>adcAuth.saveTesterName('Tester de ADC'));assert.equal(profile.display_name,'Tester de ADC');
  await page.locator('#adcSessionBar button').click();await page.waitForURL(base+'ADC_Ingreso_Editable.html');
  // La URL recovery conserva el flujo en lugar de enviar al usuario a index.
  await page.evaluate(({session})=>localStorage.setItem('adc-supabase-auth',JSON.stringify(session)),{session:session()});
  await page.goto(base+'ADC_Ingreso_Editable.html?flow=recovery');await page.waitForSelector('#adcRecoveryForm');
  await page.getByRole('textbox',{name:'Nueva contraseña',exact:true}).fill('Nueva-Prueba-Segura-2026');await page.locator('#adcRecoveryForm button').click();await page.waitForURL(base+'ADC_Ingreso_Editable.html');
  assert.ok(requests.some(req=>req.path.endsWith('/user')&&req.method==='PUT'));
  // No mostrar datos si el navegador pertenece a otra cuenta; conservarlos.
  await page.evaluate(({session})=>{localStorage.setItem('adc-supabase-auth',JSON.stringify(session));localStorage.setItem('adc-auth-local-owner','otra-cuenta');localStorage.setItem('adc_v08','{"privado":"conservar"}');},{session:session()});
  await page.goto(base+'index.html?adc-preview=1');await page.waitForSelector('#adcAuthGate');
  assert.match(await page.locator('#adcAuthGate').textContent(),/otra cuenta/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('adc_v08')),'{"privado":"conservar"}');
  assert.ok(await page.locator('html').evaluate(node=>node.classList.contains('adc-auth-pending')));
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
