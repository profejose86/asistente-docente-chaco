const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/structure-manifest.json'), 'utf8'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
let reconstructed = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const changed = [];

for (const block of manifest.blocks) {
  const files = block.parts || [block.file];
  const content = files.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('');
  if (hash(content) !== block.sha256) changed.push(files.join(', '));
  assert.ok(reconstructed.includes(block.replacement), `Referencia ausente: ${block.file}`);
  if (block.type.toLowerCase() === 'script') {
    for (const file of files) new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
  }
  reconstructed = reconstructed.replace(block.replacement, () => block.opening + content + block.closing);
}
if (process.argv.includes('--baseline')) {
  assert.equal(hash(reconstructed), manifest.sourceSha256, 'La reconstrucción difiere de la referencia inicial.');
}
console.log('OK: recursos del manifiesto presentes y sintaxis de los scripts.');
console.log(changed.length ? 'Bloques con cambios funcionales respecto de la extracción: ' + changed.join('; ') : 'Todos los bloques coinciden con la extracción inicial.');
console.log('Reconstrucción de referencia inicial: ' + (hash(reconstructed) === manifest.sourceSha256 ? 'idéntica' : 'con diferencias. Usar --baseline para exigir igualdad.'));
