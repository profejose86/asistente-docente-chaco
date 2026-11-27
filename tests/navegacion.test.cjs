const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {chromium}=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'..');

function createDomStub(){
  const elements=new Map();
  const makeClassList=initial=>{
    const classes=new Set(initial);
    return {
      toggle(cls,force){
        if(force===undefined){
          if(classes.has(cls)){classes.delete(cls);return false;}
          classes.add(cls);return true;
        }
        if(force){classes.add(cls);return true;}
        classes.delete(cls);return false;
      },
      contains(cls){return classes.has(cls);}
    };
  };
  const hiddenPanels=new Set(['adcBD02','adcSC01','adcOfficialForm','adcCalendar','license','dj','dj02','adcOL','adcTramitesMenu','adcTramiteBack']);
  const $=id=>{
    if(!elements.has(id)){
      const initial=hiddenPanels.has(id)?['hide']:[];
      elements.set(id,{
        id,
        hidden:false,
        className:'',
        dataset:{},
        focused:false,
        attrs:{},
        classList:makeClassList(initial),
        setAttribute(k,v){this.attrs[k]=String(v);},
        querySelectorAll(){return [];},
        focus(){this.focused=true;}
      });
    }
    return elements.get(id);
  };
  return {$,elements};
}

test('adcNavigation: guardias, oyentes, desuscripción y normalización de transfer en aislamiento',()=>{
  const {$,elements}=createDomStub();
  const calls=[];
  let transferMode=false;
  const ctx={
    window:{},
    tramites:[['dl01','','','Licencias']],
    $,
    djSubtab:v=>calls.push(['djSubtab',v]),
    adcDjSetMode:m=>{calls.push(['adcDjSetMode',m]);transferMode=m==='transfer';},
    adcDjTransferMode:()=>{calls.push(['adcDjTransferMode']);return transferMode;},
    adcTransferOpen:()=>calls.push(['adcTransferOpen']),
    djRender:()=>calls.push(['djRender']),
    adcCalendarOpen:()=>calls.push(['adcCalendarOpen']),
    review:()=>calls.push(['review']),
    dj02Open:()=>calls.push(['dj02Open']),
    djProfileExtras:()=>calls.push(['djProfileExtras'])
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/interfaz/navegacion.js'),'utf8'),ctx);

  const nav=ctx.window.adcNavigation;
  assert.equal(Object.isFrozen(nav),true);
  assert.deepEqual(Object.keys(nav).sort(),['current','go','onNavigate','registerGuard']);
  assert.equal(nav.current(),null);

  const noopGuard=nav.registerGuard(null);
  const noopListener=nav.onNavigate('x');
  assert.equal(typeof noopGuard,'function');
  assert.equal(typeof noopListener,'function');
  noopGuard();
  noopListener();

  const listenerEvents=[];
  const offListener=nav.onNavigate((current,previous)=>listenerEvents.push([current,previous]));

  assert.equal(nav.go('profile'),true);
  assert.equal(nav.current(),'profile');
  assert.deepEqual(calls,[['djProfileExtras']]);
  assert.deepEqual(listenerEvents,[['profile',null]]);

  const guard1Calls=[];
  const guard2Calls=[];
  nav.registerGuard((requested,previous)=>{guard1Calls.push([requested,previous]);});
  const offGuard=nav.registerGuard((requested,previous)=>{guard2Calls.push([requested,previous]);return false;});

  assert.equal(ctx.window.tab('calendar'),false);
  assert.deepEqual(guard1Calls,[['calendar','profile']]);
  assert.deepEqual(guard2Calls,[['calendar','profile']]);
  assert.equal(nav.current(),'profile');
  assert.equal($('adcCalendar').classList.contains('hide'),true);
  assert.equal(calls.some(c=>c[0]==='adcCalendarOpen'),false);
  assert.deepEqual(listenerEvents,[['profile',null]]);

  assert.equal(ctx.window.tab('transfer'),false);
  assert.deepEqual(guard1Calls,[['calendar','profile'],['dj','profile']]);
  assert.deepEqual(guard2Calls,[['calendar','profile'],['dj','profile']]);
  assert.equal($('adcTransferNotice').hidden,false);
  assert.equal(calls.some(c=>['djSubtab','adcDjSetMode','adcTransferOpen','djRender'].includes(c[0])),false);

  offGuard();
  assert.equal(ctx.window.tab('transfer'),true);
  assert.equal($('adcTransferNotice').hidden,true);
  assert.equal($('dj').classList.contains('hide'),false);
  assert.equal(nav.current(),'dj');
  assert.deepEqual(calls.slice(1),[
    ['djSubtab','new'],
    ['adcDjSetMode','transfer'],
    ['adcDjTransferMode'],
    ['adcTransferOpen'],
    ['djRender']
  ]);
  assert.deepEqual(listenerEvents,[['profile',null],['dj','profile']]);

  offListener();
  assert.equal(nav.go('tramites'),true);
  assert.equal(nav.current(),'tramites');
  assert.deepEqual(listenerEvents,[['profile',null],['dj','profile']]);
});

test('adcNavigation en Chrome: bloqueo y apertura real de DJ-01 en modo traslado sin envolver window.tab',{timeout:60000},async()=>{
  const server=require('../tools/motor01-preview.cjs').createMotor01Server();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https:\/\//,route=>route.abort());
    await page.route('**/assets/datos/ajustes-pagina.json',route=>route.fulfill({json:require('../assets/js/editor/ajustes-proyecto-datos.js').empty()}));
    await page.goto(`http://127.0.0.1:${server.address().port}/adc/index.html?adc-preview=1`);
    await page.evaluate(()=>{
      addInst({name:'EES Prueba',office:'100',level:'Secundario',entries:[{type:'asignatura',subject:'Historia',year:'1',division:'1',revista:'Titular',turno:'Mañana',schedule:[2,0,0,0,0,0,0]}]});
    });

    const result=await page.evaluate(()=>{
      tab('profile');
      const guardCalls=[];
      const listenerCalls=[];
      const offListener=adcNavigation.onNavigate((next,prev)=>listenerCalls.push([next,prev]));
      const offGuard=adcNavigation.registerGuard((next,prev)=>{
        guardCalls.push([next,prev]);
        return false;
      });
      const blocked=tab('transfer');
      const djHiddenWhileBlocked=document.getElementById('dj').classList.contains('hide');
      const djModeWhileBlocked=document.getElementById('adcDjMode').value;
      const listenerCallsWhileBlocked=[...listenerCalls];

      offGuard();
      const allowed=adcNavigation.go('transfer');
      const current=adcNavigation.current();
      offListener();
      return {blocked,djHiddenWhileBlocked,djModeWhileBlocked,listenerCallsWhileBlocked,allowed,current,guardCalls,listenerCalls};
    });

    assert.equal(result.blocked,false);
    assert.deepEqual(result.guardCalls,[['dj','profile']]);
    assert.equal(result.djHiddenWhileBlocked,true);
    assert.notEqual(result.djModeWhileBlocked,'transfer');
    assert.deepEqual(result.listenerCallsWhileBlocked,[]);

    assert.equal(result.allowed,true);
    assert.equal(result.current,'dj');
    assert.deepEqual(result.listenerCalls,[['dj','profile']]);

    assert.equal(await page.locator('#dj').isVisible(),true);
    assert.equal(await page.locator('#profile').isVisible(),false);
    assert.equal(await page.locator('#adcDjMode').inputValue(),'transfer');
    assert.equal(await page.locator('#adcTransferForm').isVisible(),true);
    assert.match(await page.locator('#adcTransferOrigins').innerText(),/EES Prueba/);
    assert.deepEqual(errors,[]);
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
