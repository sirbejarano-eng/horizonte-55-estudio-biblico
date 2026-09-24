// Prepara dist/ para GitHub Pages a partir de la versión Next.js (web/).
// La versión anterior (HTML + JS en la raíz) deja de publicarse; sus direcciones antiguas
// (lectura.html?book=…, biblioteca.html, contexto-*.html…) siguen funcionando porque web/public
// incluye páginas que redirigen a las nuevas.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const web = path.join(root, 'web');
const output = path.join(root, 'dist');

if (path.dirname(output) !== root || path.basename(output) !== 'dist') {
  throw new Error('La carpeta de salida no es la esperada.');
}

// next build copia antes catálogos e imágenes (web/scripts/sync-content.mjs) y genera web/out/.
execSync('npm run build', { cwd: web, stdio: 'inherit' });

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(path.join(web, 'out'), output, { recursive: true });

for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}

// Sin este archivo GitHub Pages (Jekyll) ignoraría la carpeta _next/ y la web quedaría sin JavaScript ni estilos.
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(`✅ Sitio público preparado en ${path.relative(root, output)}/`);
