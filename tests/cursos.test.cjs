const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/core/cursos.js'),'utf8'),context);
const academic = context.window.adcAcademic;
test('Máxima 2: ordinales académicos, variantes y estilos oficiales', () => {
  for (const value of [1,'1°','1º','1er','1°°']) assert.equal(academic.part(value,'year'),'1°');
  assert.equal(academic.part('3','year'),'3°');
  for (const value of [1,'1ra','1.ª','1ª','1ra ra']) assert.equal(academic.part(value,'division'),'1.ª');
  assert.equal(academic.part(2,'section'),'2.ª');
  assert.equal(academic.part('2da da','division',{divisionStyle:'abbreviated'}),'2da');
  assert.equal(academic.part('3ra','division',{divisionStyle:'bare'}),'3ª');
});
test('Máxima 2: perfiles nuevos e históricos sin mutar datos originales', () => {
  const entry = {course:'2 1',adcCourseParts:{year:'2',division:'1'}};
  const before = JSON.stringify(entry);
  assert.equal(academic.course(entry,{labeled:true}),'2° Año — 1.ª División');
  for (const value of ['2 1','2º 1ra','2°1ra','2° Año — 1.ª División']) assert.equal(academic.course(value),'2° 1.ª');
  assert.equal(academic.course('13',{legacyPacked:true}),'1° 3.ª');
  assert.equal(academic.course('13'),'13°');
  assert.equal(academic.course({year:'3',section:'A'}),'3° A');
  assert.equal(JSON.stringify(entry),before);
});
test('Máxima 2: números administrativos y valores no ordinales permanecen intactos', () => {
  for (const value of ['2026','3 años','Primero','A','01/03/2026']) assert.equal(academic.part(value,'year'),value);
  for (const context of ['calendar','seniority','resolution']) assert.equal(academic.part('3',context),'3');
});
