import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'web');
const allowed = new Set([
  path.join(root, 'lib', 'local-storage.ts'),
  path.join(root, 'components', 'SiteDocument.tsx'), // script mínimo previo a React, protegido con try/catch
]);
const offenders = [];
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'out') continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (/\.(ts|tsx)$/.test(entry.name) && !allowed.has(file)) {
      const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
      lines.forEach((line, index) => {
        if (/\blocalStorage\.(getItem|setItem|removeItem|clear)\b/.test(line)) offenders.push(`${path.relative(root, file)}:${index + 1}`);
      });
    }
  }
}
visit(root);
if (offenders.length) throw new Error(`Accesos a localStorage fuera de la capa común:\n${offenders.join('\n')}`);
console.log('✅ Acceso web a localStorage centralizado y protegido.');
