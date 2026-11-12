const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/documentos/pdf-utilidades.js'), 'utf8');
const context = {PDFLib:{rgb:(r,g,b)=>[r,g,b]}};
vm.createContext(context);
vm.runInContext(source,context);
let line;
context.adcPdfDrawBlankLine({getHeight:()=>1008,drawLine:value=>{line=value;}},{x:40,y:322,width:172,height:12},{start:0.15,end:0.98});

assert.deepEqual(JSON.parse(JSON.stringify(line.start)),{x:65.8,y:680});
assert.deepEqual(JSON.parse(JSON.stringify(line.end)),{x:208.56,y:680});
assert.deepEqual(JSON.parse(JSON.stringify(line.color)),[0,0,0]);
assert.equal(line.thickness,0.5*72/25.4);

context.adcPdfDrawBlankLine({getHeight:()=>1008,drawLine:value=>{line=value;}},{x:40,y:322,width:172,height:12},{start:0.15,end:0.85,thickness:0.5*72/25.4});
assert.deepEqual(JSON.parse(JSON.stringify(line.start)),{x:65.8,y:680});
assert.deepEqual(JSON.parse(JSON.stringify(line.end)),{x:186.2,y:680});
assert.equal(line.thickness,0.5*72/25.4);
console.log('OK: las líneas opcionales se dibujan en negro con las proporciones configuradas.');
