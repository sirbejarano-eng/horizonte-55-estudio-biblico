const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');

function assertExists(relativePath) {
  if (!fs.existsSync(path.join(output, relativePath))) {
    throw new Error(`Falta en la publicación: ${relativePath}`);
  }
}

function collectFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(prefix, entry.name);
    return entry.isDirectory()
      ? collectFiles(path.join(directory, entry.name), relativePath)
      : [relativePath.replaceAll('\\', '/')];
  });
}

try {
  assertExists('index.html');
  assertExists('sw.js');
  assertExists('manifest.json');
  assertExists('content/books.json');
  assertExists('content/books-es-onbv.json');
  assertExists('content/books-en.json');
  assertExists('content/books-de.json');
  assertExists('assets/hero-background.jpg');
  assertExists('.nojekyll');

  const forbidden = ['vendor', 'tests', 'tools', 'docs', 'node_modules', '.git'];
  for (const relativePath of forbidden) {
    if (fs.existsSync(path.join(output, relativePath))) {
      throw new Error(`La publicación no debe incluir: ${relativePath}`);
    }
  }

  const serviceWorker = fs.readFileSync(path.join(output, 'sw.js'), 'utf8');
  const appShellMatch = serviceWorker.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  if (!appShellMatch) throw new Error('No se pudo leer APP_SHELL de sw.js.');
  const appShellPaths = [...appShellMatch[1].matchAll(/'\.\/(.*?)'/g)].map((match) => match[1]);
  for (const relativePath of appShellPaths.filter(Boolean)) assertExists(relativePath);

  const files = collectFiles(output);
  console.log(`✅ Publicación verificada: ${files.length} archivos, sin fuentes ni herramientas internas.`);
} catch (error) {
  console.error('❌ Validación de publicación fallida:', error.message);
  process.exit(1);
}
