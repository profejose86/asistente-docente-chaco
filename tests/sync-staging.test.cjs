const {test}=require('node:test'),assert=require('node:assert/strict');
const {assertIsolated}=require('../tools/sync-staging.cjs');
test('Staging: bloquea producción y sólo permite referencias independientes',()=>{
 const production={SUPABASE_PROJECT_REF:'aaaaaaaaaaaaaaaaaaaa',SUPABASE_URL:'https://bbbbbbbbbbbbbbbbbbbb.supabase.co'};
 assert.throws(()=>assertIsolated(production.SUPABASE_PROJECT_REF,production),/producción/);
 assert.throws(()=>assertIsolated('bbbbbbbbbbbbbbbbbbbb',production),/producción/);
 assert.throws(()=>assertIsolated('tdjbpgoelqvuoaydinxo',production),/producción/);
 assert.throws(()=>assertIsolated('invalid',production),/inválida/);
 assert.equal(assertIsolated('cccccccccccccccccccc',production),'cccccccccccccccccccc');
});
