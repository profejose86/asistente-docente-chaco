const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const contract=require('../assets/js/editor/ajustes-proyecto-datos.js');
const root=path.resolve(__dirname,'..');
const adminId='11111111-1111-4111-8111-111111111111';
const testerId='22222222-2222-4222-8222-222222222222';
const ghEndpoint='https://api.github.com/repos/profejose86/asistente-docente-chaco/contents/assets/datos/ajustes-pagina.json';

function makeSession(user){
  const header=Buffer.from('{"alg":"HS256"}').toString('base64url');
  const payload=Buffer.from(JSON.stringify({sub:user.id,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
  return {access_token:[header,payload,'sig'].join('.'),refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user};
}

const makeUser=(id,role,{email}={})=>({
  id,aud:'authenticated',role:'authenticated',
  email:email||(role==='admin'?'prof.josemiguelgomez@gmail.com':'tester@example.test'),
  app_metadata:role==='admin'?{provider:'email',providers:['email'],adc_role:'admin'}:{provider:'email',providers:['email']},
  user_metadata:{}
});

test('ADC Studio online: restringido a admin verificado y Push to GitHub con CAS y token solo local',{timeout:90000},async()=>{
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(error,data)=>{
      if(error)return res.writeHead(404).end();
      res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
      res.end(data);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const localBase='https://adc-online.example/';
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const baseDoc=contract.empty();
  baseDoc.pages.ingreso.operations.push({kind:'text',target:'project:#adcLoginTitle',html:'Ingreso preservado'});
  baseDoc.pages.ingreso.targets['project:#adcLoginTitle']={tag:'h1',id:'adcLoginTitle'};
  let remoteDoc=structuredClone(baseDoc);
  let remoteSha='sha-inicial-001';
  const githubPuts=[];

  async function setupPage(role,{spoofLocal=false,authError=false,email}={}){
    const context=await browser.newContext({viewport:{width:1500,height:1100},hasTouch:true});
    const page=await context.newPage();
    page.setDefaultTimeout(15000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const serverUser=role==='admin'?makeUser(adminId,'admin',{email}):makeUser(testerId,'tester',{email});
    const storedUser=spoofLocal?makeUser(testerId,'admin'):serverUser;
    await page.addInitScript(({s})=>{
      if(!localStorage.getItem('fixture-seeded')){
        localStorage.setItem('adc-supabase-auth',JSON.stringify(s));
        localStorage.setItem('adc-auth-local-owner',s.user.id);
        localStorage.setItem('fixture-seeded','true');
      }
    },{s:makeSession(storedUser)});

    await context.route(localBase+'**',async route=>{
      const url=new URL(route.request().url());
      if(url.pathname==='/assets/datos/config-publica.js'){
        return route.fulfill({contentType:'application/javascript',body:'window.adcConfig=Object.freeze('+JSON.stringify({authMode:'supabase',supabaseUrl:'https://adc-admin-test.supabase.co',supabaseAnonKey:'sb_publishable_test',googleAuthEnabled:false,emailConfirmationsRequired:false,passwordRecoveryEnabled:false})+');'});
      }
      if(url.pathname==='/assets/datos/ajustes-pagina.json'){
        return route.fulfill({contentType:'application/json',json:remoteDoc});
      }
      const res=await fetch('http://127.0.0.1:'+server.address().port+url.pathname);
      return route.fulfill({status:res.status,headers:{'Content-Type':res.headers.get('content-type')||'application/octet-stream'},body:Buffer.from(await res.arrayBuffer())});
    });

    await context.route('https://adc-admin-test.supabase.co/**',route=>{
      const req=route.request(),pathname=new URL(req.url()).pathname;
      const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',json:body});
      if(pathname.endsWith('/user'))return authError?json({message:'Fallo auth'},500):json(serverUser);
      if(pathname.endsWith('/logout'))return route.fulfill({status:204});
      if(pathname==='/rest/v1/adc_tester_profiles')return json({id:serverUser.id,display_name:'',created_at:'2026-01-01',updated_at:'2026-01-01'});
      if(pathname==='/rest/v1/adc_user_records')return json([]);
      return json({message:'Ruta inesperada'},500);
    });

    await context.route(ghEndpoint+'**',async route=>{
      const req=route.request();
      assert.equal(req.headers().authorization,'Bearer github_pat_test_123456');
      if(req.method()==='GET'){
        const raw=JSON.stringify(remoteDoc,null,2)+'\n';
        return route.fulfill({status:200,contentType:'application/json',json:{sha:remoteSha,content:Buffer.from(raw,'utf8').toString('base64')}});
      }
      if(req.method()==='PUT'){
        const body=req.postDataJSON();
        assert.equal(body.branch,'main');
        assert.equal(body.sha,remoteSha);
        const next=JSON.parse(Buffer.from(body.content,'base64').toString('utf8'));
        remoteDoc=contract.validate(next);
        remoteSha='sha-updated-'+(githubPuts.length+1);
        githubPuts.push({body,doc:remoteDoc});
        return route.fulfill({status:200,contentType:'application/json',json:{content:{sha:remoteSha},commit:{sha:'abcdef1234567890'}}});
      }
      return route.fulfill({status:405});
    });

    return {context,page,errors};
  }

  try{
    // 1. Tester normal (incluso alterando localStorage) no puede revelar la tuerquita ni editar el login.
    const tester=await setupPage('tester',{spoofLocal:true});
    await tester.page.goto(localBase+'index.html');
    await tester.page.waitForSelector('#adcSessionBar');
    const testerGear=tester.page.locator('#adcDesignGear');
    assert.notEqual(await testerGear.getAttribute('data-adc-forbidden'),null);
    assert.equal(await testerGear.evaluate(el=>getComputedStyle(el).display),'none');
    for(let i=0;i<6;i++)await tester.page.keyboard.press('Tab');
    assert.notEqual(await testerGear.getAttribute('data-adc-forbidden'),null);
    assert.notEqual(await testerGear.getAttribute('data-adc-locked'),null);
    assert.equal(await tester.page.locator('[data-push-github]').count(),1);
    assert.equal(await tester.page.locator('[data-push-github]').isVisible(),false);
    // Un tester no-admin con ?adc-studio=1 en login sigue siendo redirigido a index.html.
    await tester.page.goto(localBase+'ADC_Ingreso_Editable.html?adc-studio=1');
    await tester.page.waitForURL(localBase+'index.html');
    assert.deepEqual(tester.errors,[]);
    await tester.context.close();

    // 2. Admin fallando verificación remota permanece bloqueado (fail-closed).
    const broken=await setupPage('tester',{authError:true});
    await broken.page.goto(localBase+'index.html');
    await broken.page.waitForSelector('#adcAuthGate');
    assert.notEqual(await broken.page.locator('#adcDesignGear').getAttribute('data-adc-forbidden'),null);
    await broken.context.close();

    // 2b. Otro correo con adc_role='admin' o el correo admin sin adc_role='admin' siguen bloqueados.
    const otherAdmin=await setupPage('admin',{email:'otro-admin@example.test'});
    await otherAdmin.page.goto(localBase+'index.html');
    await otherAdmin.page.waitForSelector('#adcSessionBar');
    assert.equal(await otherAdmin.page.evaluate(()=>adcEditorAccess.isAdmin()),false);
    assert.notEqual(await otherAdmin.page.locator('#adcDesignGear').getAttribute('data-adc-forbidden'),null);
    await otherAdmin.context.close();

    const nonRoleOwner=await setupPage('tester',{email:'prof.josemiguelgomez@gmail.com'});
    await nonRoleOwner.page.goto(localBase+'index.html');
    await nonRoleOwner.page.waitForSelector('#adcSessionBar');
    assert.equal(await nonRoleOwner.page.evaluate(()=>adcEditorAccess.isAdmin()),false);
    assert.notEqual(await nonRoleOwner.page.locator('#adcDesignGear').getAttribute('data-adc-forbidden'),null);
    await nonRoleOwner.context.close();

    // 3. Admin verificado (prof.josemiguelgomez@gmail.com): en index.html la tuerquita es SIEMPRE visible (sin 5 clics).
    const admin=await setupPage('admin');
    await admin.page.goto(localBase+'index.html');
    await admin.page.waitForSelector('#adcSessionBar');
    const gear=admin.page.locator('#adcDesignGear'),panel=admin.page.locator('#adcDesignPanel');
    assert.equal(await admin.page.locator('html').getAttribute('data-adc-local-editor'),null);
    await admin.page.waitForFunction(()=>!document.getElementById('adcDesignGear').hasAttribute('data-adc-forbidden'));
    assert.equal(await admin.page.evaluate(()=>adcEditorAccess.isAdmin()),true);
    assert.equal(await gear.getAttribute('data-adc-locked'),null);
    assert.equal(await gear.evaluate(el=>getComputedStyle(el).opacity),'1');
    await gear.click();
    assert.equal(await panel.isVisible(),true);
    assert.equal(await admin.page.locator('#adcDesignPanel button:not([title])').count(),0);
    assert.equal(await admin.page.locator('[data-commit-local]').count(),0);
    assert.equal(await admin.page.locator('[data-studio-local-disabled]').isVisible(),false);
    const pushBtn=admin.page.locator('[data-push-github]');
    assert.equal(await pushBtn.isVisible(),true);

    // Primer clic sin token abre la pestaña de Proyecto y despliega la configuración del token.
    await pushBtn.click();
    assert.equal(await admin.page.locator('#adcStudioTab-proyecto').getAttribute('aria-selected'),'true');
    assert.equal(await admin.page.locator('[data-github-config]').evaluate(d=>d.open),true);

    await admin.page.locator('[data-github-token-input]').fill('github_pat_test_123456');
    await admin.page.locator('[data-github-token-save]').click();
    const tokenKey='adc-auth-github-token:'+adminId;
    assert.equal(await admin.page.evaluate(k=>localStorage.getItem(k),tokenKey),'github_pat_test_123456');
    assert.equal(await admin.page.evaluate(k=>adcUserStorage.category(k),tokenKey),null);

    // Aplicar cambio de color institucional y publicar directo en GitHub.
    await admin.page.locator('[data-studio-theme=primary]').fill('#123456');
    await admin.page.getByRole('button',{name:'Aplicar colores',exact:true}).click();
    await pushBtn.click();
    await admin.page.waitForFunction(()=>document.querySelector('[data-push-github]')?.dataset.saveState==='saved');
    assert.equal(githubPuts.length,1);
    assert.deepEqual(githubPuts[0].doc.pages.ingreso,baseDoc.pages.ingreso);
    assert.ok(githubPuts[0].doc.pages.pagina.operations.some(op=>op.kind==='theme'&&op.primary==='#123456'));

    // Segundo clic sin nuevos cambios informa sin cambios nuevos y no envía PUT.
    await pushBtn.click();
    await admin.page.waitForFunction(()=>document.querySelector('[data-push-github]')?.dataset.saveState==='unchanged');
    assert.equal(githubPuts.length,1);

    // Si alguien modificó la misma pantalla en GitHub externamente, rechaza sobrescribir (CAS).
    remoteDoc.pages.pagina.operations.push({kind:'style',target:'project:#profile',color:'#654321'});
    await admin.page.locator('[data-studio-theme=primary]').fill('#654321');
    await admin.page.getByRole('button',{name:'Aplicar colores',exact:true}).click();
    await pushBtn.click();
    await admin.page.waitForFunction(()=>document.querySelector('[data-push-github]')?.dataset.saveState==='error');
    assert.match(await admin.page.locator('[data-push-github-feedback]').innerText(),/cambió en GitHub/);
    assert.equal(githubPuts.length,1);

    // El admin puede abrir ADC_Ingreso_Editable.html?adc-studio=1: la tuerquita está en esquina superior derecha e INVISIBLE hasta 5 clics.
    await admin.page.goto(localBase+'ADC_Ingreso_Editable.html?adc-studio=1');
    await admin.page.waitForFunction(()=>!document.getElementById('adcDesignGear').hasAttribute('data-adc-forbidden'));
    assert.equal(admin.page.url(),localBase+'ADC_Ingreso_Editable.html?adc-studio=1');
    assert.notEqual(await admin.page.locator('#adcDesignGear').getAttribute('data-adc-locked'),null);
    assert.equal(await admin.page.locator('#adcDesignGear').evaluate(el=>getComputedStyle(el).opacity),'0');
    const loginGearBox=await admin.page.locator('#adcDesignGear').boundingBox();
    assert.ok(loginGearBox.x+loginGearBox.width>=1500-24&&loginGearBox.y<=24,'Tuerquita de login en esquina superior derecha');
    for(let i=0;i<5;i++)await admin.page.locator('#adcDesignGear').click();
    assert.equal(await admin.page.locator('#adcDesignGear').getAttribute('data-adc-locked'),null);
    assert.equal(await admin.page.locator('#adcDesignGear').evaluate(el=>getComputedStyle(el).opacity),'1');

    // Al cerrar sesión real desde la aplicación, la tuerquita vuelve a prohibirse y ocultarse.
    await admin.page.goto(localBase+'index.html');
    await admin.page.waitForSelector('#adcSessionBar');
    await admin.page.waitForFunction(()=>!document.getElementById('adcDesignGear').hasAttribute('data-adc-forbidden'));
    await admin.page.locator('#adcProfileBtn').click();
    await admin.page.locator('#adcLogoutBtn').click();
    await admin.page.waitForURL(localBase+'ADC_Ingreso_Editable.html');
    assert.notEqual(await admin.page.locator('#adcDesignGear').getAttribute('data-adc-forbidden'),null);
    assert.equal(await admin.page.locator('[data-push-github]').isVisible(),false);

    assert.deepEqual(admin.errors,[]);
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
