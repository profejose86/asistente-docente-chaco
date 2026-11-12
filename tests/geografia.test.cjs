const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/perfil/geografia.js'), 'utf8');
const handlers = {};
const makeField = value => ({value, dataset:{}, addEventListener(type,handler) {this[`on${type}`] = handler;}});
const profile = {
  perfilLocalidad: makeField('Barranqueras'),
  perfilCodigoPostal: makeField(''),
  perfilDepartamento: makeField('')
};
const document = {
  getElementById: id => profile[id] || null,
  addEventListener(type,handler) {handlers[type] = handler;}
};
const window = {addEventListener() {}};
const context = {document,window};
vm.createContext(context);
vm.runInContext(source,context);
const updateProfile = () => handlers.input({target:profile.perfilLocalidad});

window.adcAplicarGeografiaPerfil();
assert.equal(profile.perfilCodigoPostal.value, '3503');
assert.equal(profile.perfilDepartamento.value, 'San Fernando');
profile.perfilLocalidad.value = 'Resistencia';
updateProfile();
assert.equal(profile.perfilCodigoPostal.value, '3500');
assert.equal(profile.perfilDepartamento.value, 'San Fernando');
profile.perfilCodigoPostal.value = '9999';
profile.perfilLocalidad.value = 'Localidad desconocida';
updateProfile();
assert.equal(profile.perfilCodigoPostal.value, '9999');
assert.equal(profile.perfilDepartamento.value, '');
assert.deepEqual(JSON.parse(JSON.stringify(window.adcBuscarGeografiaChaco('Vilelas'))), {
  postal:'3503',department:'San Fernando'
});

const locality = makeField('');
const postal = makeField('');
const department = makeField('');
window.adcVincularGeografiaChaco(locality,postal,department);
const setLocality = value => {
  locality.value = value;
  locality.oninput();
};
setLocality('Charata');
assert.equal(postal.value, '3730');
assert.equal(department.value, 'Chacabuco');
postal.value = '1234';
setLocality('Resistencia');
assert.equal(postal.value, '1234');
assert.equal(department.value, 'San Fernando');
setLocality('Localidad desconocida');
assert.equal(postal.value, '1234');
assert.equal(department.value, '');

console.log('OK: códigos postales, departamentos, alias, localidades desconocidas y conservación de datos manuales.');
