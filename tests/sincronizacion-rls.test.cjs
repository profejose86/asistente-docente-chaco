const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
test('Sync PostgreSQL: RLS, propietario inmutable, CAS, versiones y borrado entre dos cuentas',async()=>{
 const db=new PGlite(),a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated;insert into auth.users values('${a}'),('${b}');`);
  await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/202611140001_adc_user_records.sql'),'utf8'));
  await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/202611140002_adc_sync_conflict_http.sql'),'utf8'));
  assert.match((await db.query("select pg_get_functiondef('public.adc_sync_put(text,text,bigint,integer)'::regprocedure) as sql")).rows[0].sql,/PT409/);
  assert.deepEqual((await db.query("select relrowsecurity,relforcerowsecurity from pg_class where oid='public.adc_user_records'::regclass")).rows[0],{relrowsecurity:true,relforcerowsecurity:true});
  assert.equal((await db.query("select count(*)::int n from pg_policies where tablename='adc_user_records'")).rows[0].n,4);
  await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${a}',false);`);
  let result=await db.query('select * from public.adc_sync_put($1,$2,$3)', ['adc_v08','{"inst":[]}',0]);assert.equal(Number(result.rows[0].revision),1);assert.equal(result.rows[0].owner_id,a);
  await assert.rejects(db.query('select * from public.adc_sync_put($1,$2,$3)',['adc_v08','{"inst":[],"nombre":"stale"}',0]),/ADC_SYNC_CONFLICT/);
  result=await db.query('select * from public.adc_sync_put($1,$2,$3)',['adc_v08','{"inst":[],"nombre":"nuevo"}',1]);assert.equal(Number(result.rows[0].revision),2);
  await assert.rejects(db.query('select * from public.adc_sync_put($1,$2,$3)',['adc_v08','"stale"',1]),/ADC_SYNC_CONFLICT/);
  await assert.rejects(db.query('insert into public.adc_user_records(owner_id,record_key,payload) values($1,$2,$3)',[b,'adc_v08','{"raw":"x"}']),/row.level security/i);
  await assert.rejects(db.query('update public.adc_user_records set owner_id=$1',[b]),/permission denied/i);
  await assert.rejects(db.query('update public.adc_user_records set revision=1'),/permission denied/i);
  await assert.rejects(db.query('select * from public.adc_sync_put($1,$2,$3,$4)',['adc_v08','x',2,9]),/check constraint/i);
  await db.exec(`select set_config('request.jwt.claim.sub','${b}',false);`);
  assert.equal((await db.query('select * from public.adc_user_records')).rows.length,0);
  assert.equal((await db.query('update public.adc_user_records set payload=$1 where owner_id=$2 returning *',['{"raw":"intruso"}',a])).rows.length,0);
  assert.equal((await db.query('delete from public.adc_user_records where owner_id=$1 returning *',[a])).rows.length,0);
  result=await db.query('select * from public.adc_sync_put($1,$2,$3)',['adc_v08','{"inst":[],"nombre":"B"}',0]);assert.equal(result.rows[0].owner_id,b);assert.equal(Number(result.rows[0].revision),1);
  await db.exec(`select set_config('request.jwt.claim.sub','${a}',false);`);
  result=await db.query('select * from public.adc_sync_put($1,$2,$3)',['adc_v08',null,2]);assert.equal(result.rows[0].deleted,true);assert.equal(Number(result.rows[0].revision),3);
  await db.query('select * from public.adc_sync_put($1,$2,$3)',['adc.calendar.v1','{"events":[]}',0]);
  assert.equal((await db.query("delete from public.adc_user_records where record_key='adc.calendar.v1' returning owner_id")).rows[0].owner_id,a);
  await db.exec("select set_config('request.jwt.claim.sub','',false);");assert.equal((await db.query('select * from public.adc_user_records')).rows.length,0);
  await assert.rejects(db.query('select * from public.adc_sync_put($1,$2,$3)',['adc_v08','x',0]),/ADC_AUTH_REQUIRED/);
  await db.exec('reset role;set role anon;');await assert.rejects(db.query('select * from public.adc_user_records'),/permission denied/i);await assert.rejects(db.query('select * from public.adc_sync_put($1,$2,$3)',['adc_v08','x',0]),/permission denied/i);
 }finally{await db.close()}
});
