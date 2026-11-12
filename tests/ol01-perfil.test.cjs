const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/tramites/ol01.js'), 'utf8');
const start = source.indexOf('function adcOLSyncTeacherProfile(');
const end = source.indexOf("$('adcOL').addEventListener('change'", start);
const profile = Object.fromEntries(Object.entries({
  perfilApellidos: 'Docente', perfilNombres: 'Prueba', dni: '12345678',
  sexo: 'F', perfilDomicilio: 'Calle de prueba', perfilLocalidad: 'Localidad'
}).map(([key, value]) => [key, { value }]));
profile.adcOLTitle = { focus() {} };
let invalidations = 0;
let paperUpdates = 0;
const fields = Object.fromEntries([
  'teacherSurname', 'teacherGiven', 'teacherDni', 'teacherSex',
  'teacherAddress', 'teacherLocality', 'place', 'reason'
].map(key => [key, { value: '' }]));
fields.reason.value = 'Borrador conservado';
const context = {
  adcOLForm: { elements: fields, reset() { throw new Error('No debe reiniciar el mismo borrador'); } },
  adcOLDraftKey: 'standalone',
  $: id => profile[id],
  adcOLInvalidate: () => invalidations++,
  adcOLPaperVariant: () => paperUpdates++,
  tab: () => {}
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
context.adcOLStart(false);
assert.equal(fields.teacherSurname.value, 'Docente');
assert.equal(fields.teacherGiven.value, 'Prueba');
assert.equal(fields.teacherDni.value, '12345678');
assert.equal(fields.teacherSex.value, 'F');
assert.equal(fields.teacherAddress.value, 'Calle de prueba');
assert.equal(fields.teacherLocality.value, 'Localidad');
assert.equal(fields.place.value, 'Localidad');
assert.equal(fields.reason.value, 'Borrador conservado');
assert.equal(invalidations, 1);
context.adcOLStart(false);
assert.equal(invalidations, 1);
profile.perfilNombres.value = 'Nombre actualizado';
profile.sexo.value = 'M';
context.adcOLStart(false);
assert.equal(fields.teacherGiven.value, 'Nombre actualizado');
assert.equal(fields.teacherSex.value, 'M');
assert.equal(invalidations, 2);
profile.perfilDomicilio.value = '';
context.adcOLStart(false);
assert.equal(fields.teacherAddress.value, '');
assert.equal(paperUpdates, 4);
console.log('OK: autocompletado de seis campos, reapertura, actualización, vaciado e invalidación del PDF sin reiniciar el borrador.');
