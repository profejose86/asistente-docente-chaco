const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/structure-manifest.json'), 'utf8'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
let reconstructed = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// Las versiones de caché mantienen la referencia al mismo recurso local.
reconstructed = reconstructed.replace(/((?:src|href)="assets\/[^"?]+)\?[^\"]*"/g, '$1"');
const changed = [];

for (const block of manifest.blocks) {
  const files = block.parts || [block.file];
  const content = files.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('');
  if (hash(content) !== block.sha256) changed.push(files.join(', '));
  const contiguous = reconstructed.includes(block.replacement);
  if (!contiguous) {
    // Los módulos nuevos pueden intercalarse entre las partes históricas.
    // Verificamos presencia y orden sin regenerar el manifiesto de referencia.
    assert.ok(block.parts, `Referencia ausente: ${block.file}`);
    let previous = -1;
    for (const file of files) {
      const reference = `<script src="${file}"></script>`;
      const position = reconstructed.indexOf(reference);
      assert.ok(position > previous, `Referencia ausente o fuera de orden: ${file}`);
      previous = position;
    }
  }
  if (block.type.toLowerCase() === 'script') {
    for (const file of files) new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
  }
  if (contiguous) reconstructed = reconstructed.replace(block.replacement, () => block.opening + content + block.closing);
  else for (const file of files) {
    reconstructed = reconstructed.replace(`<script src="${file}"></script>`,() => block.opening + fs.readFileSync(path.join(root,file),'utf8') + block.closing);
  }
}
if (process.argv.includes('--baseline')) {
  assert.equal(hash(reconstructed), manifest.sourceSha256, 'La reconstrucción difiere de la referencia inicial.');
}
console.log('OK: recursos del manifiesto presentes y sintaxis de los scripts.');
console.log(changed.length ? 'Bloques con cambios funcionales respecto de la extracción: ' + changed.join('; ') : 'Todos los bloques coinciden con la extracción inicial.');
console.log('Reconstrucción de referencia inicial: ' + (hash(reconstructed) === manifest.sourceSha256 ? 'idéntica' : 'con diferencias. Usar --baseline para exigir igualdad.'));
