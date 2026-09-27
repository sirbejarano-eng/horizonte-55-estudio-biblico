import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const catalogs = { onbv: 'books-es-onbv.json', rv1909: 'books.json', en: 'books-en.json', de: 'books-de.json' };
const generated = fs.readFileSync(path.join(root, 'web/lib/catalog-versions.generated.ts'), 'utf8');
const match = generated.match(/CATALOG_VERSIONS\s*=\s*(\{[\s\S]*?\})\s*as const/);
if (!match) throw new Error('No se pudo leer el registro generado de versiones de catálogo.');
const versions = JSON.parse(match[1]);
for (const [edition, file] of Object.entries(catalogs)) {
  const expected = createHash('sha256').update(fs.readFileSync(path.join(root, 'content', file))).digest('hex').slice(0, 16);
  if (versions[edition] !== expected) throw new Error(`${edition}: hash ${versions[edition]} no coincide con ${expected}`);
}
console.log('✅ Versiones de catálogo derivadas automáticamente de sus archivos.');
