const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');

if (path.dirname(output) !== root || path.basename(output) !== 'dist') {
  throw new Error('La carpeta de salida no es la esperada.');
}

const publicFiles = [
  'index.html',
  'biblioteca.html',
  'buscar.html',
  'cronologia.html',
  'lectura.html',
  'manifest.json',
  'manifest-es.json',
  'manifest-en.json',
  'manifest-de.json',
  'sw.js',
  'LICENSE',
  'THIRD_PARTY_NOTICES.md'
];

const publicDirectories = ['assets', 'content', 'css', 'js'];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const relativePath of publicFiles) {
  const source = path.join(root, relativePath);
  if (!fs.existsSync(source)) throw new Error(`Falta el archivo público: ${relativePath}`);
  fs.copyFileSync(source, path.join(output, relativePath));
}

for (const relativePath of publicDirectories) {
  const source = path.join(root, relativePath);
  if (!fs.existsSync(source)) throw new Error(`Falta la carpeta pública: ${relativePath}`);
  fs.cpSync(source, path.join(output, relativePath), { recursive: true });
}

fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(`✅ Sitio público preparado en ${path.relative(root, output)}/`);
