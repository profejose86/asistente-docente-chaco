const {test}=require('node:test'),assert=require('node:assert/strict');
const {createProject}=require('../tools/configurar-supabase.cjs');
test('Gestión simulada: organización Free, contraseña única local y reutilización sin duplicar proyectos',async()=>{
 const ref='abcdefghijklmnopqrst',writes=[],calls=[];let exists=false,plan='free';
 const request=async(endpoint,method='GET',body)=>{
  calls.push({endpoint,method,body});
  if(endpoint==='/organizations')return [{id:'org-id',slug:'org-slug'}];
  if(endpoint==='/organizations/org-slug')return {plan};
  if(endpoint==='/projects'&&method==='GET')return exists?[{ref,name:'Asistente Docente Chaqueño - Staging',organization_slug:'org-slug',status:'ACTIVE_HEALTHY'}]:[];
  if(endpoint==='/projects'&&method==='POST')return {ref,status:'COMING_UP'};
  throw Error('Unexpected endpoint');
 };
 const result=await createProject({env:{},request,write:value=>writes.push(value)});
 assert.equal(result.created,true);assert.equal(result.project,ref);
 const creation=calls.find(call=>call.method==='POST');assert.equal(creation.body.plan,'free');assert.equal(creation.body.organization_slug,'org-slug');assert.ok(creation.body.db_pass.length>=40);
 assert.equal(writes[0].SUPABASE_DB_PASSWORD,creation.body.db_pass);assert.equal(writes[1].SUPABASE_PROJECT_REF,ref);assert.equal(JSON.stringify(result).includes(creation.body.db_pass),false);
 exists=true;calls.length=0;writes.length=0;
 assert.equal((await createProject({env:{},request,write:value=>writes.push(value)})).created,false);assert.equal(calls.some(call=>call.method==='POST'),false);assert.equal(writes.some(value=>value.SUPABASE_DB_PASSWORD),false);
 plan='pro';await assert.rejects(createProject({env:{},request,write:()=>{}}),/Free/);
});
