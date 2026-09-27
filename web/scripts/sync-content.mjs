// Copia a public/ lo que la versión actual ya tiene en la raíz del repositorio, para no duplicarlo
// en git: el catálogo bíblico (lo descarga la búsqueda) y los mapas e ilustraciones de los estudios.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const copy = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

// Los cuatro catálogos (ONBV, RV1909, inglés y alemán): la búsqueda descarga el de la edición activa.
const catalogs = { onbv: "books-es-onbv.json", rv1909: "books.json", en: "books-en.json", de: "books-de.json" };
const catalogVersions = {};
for (const [edition, name] of Object.entries(catalogs)) {
  const source = path.resolve("..", "content", name);
  copy(source, path.resolve("public", "content", name));
  catalogVersions[edition] = createHash("sha256").update(fs.readFileSync(source)).digest("hex").slice(0, 16);
  // Índice ligero (título y nº de capítulos por libro) para el selector de la página de lectura.
  const { books } = JSON.parse(fs.readFileSync(source, "utf8"));
  const index = books.map((book) => ({ id: book.id, title: book.title, chapters: book.chapters.length }));
  fs.writeFileSync(path.resolve("public", "content", `index-${edition}.json`), JSON.stringify(index));
}

const generated = `// Generado por scripts/sync-content.mjs a partir del contenido real de cada catálogo.
// No editar manualmente: el hash cambia automáticamente cuando cambia su archivo fuente.
export const CATALOG_VERSIONS = ${JSON.stringify(catalogVersions, null, 2)} as const;
`;
const versionFile = path.resolve("lib", "catalog-versions.generated.ts");
if (!fs.existsSync(versionFile) || fs.readFileSync(versionFile, "utf8") !== generated) fs.writeFileSync(versionFile, generated);

const assetsDir = path.resolve("..", "assets");
const images = fs.readdirSync(assetsDir).filter((name) => /^((mapa|contexto)-.+\.webp|icon-(en|de)\.png)$/.test(name));
for (const name of images) copy(path.join(assetsDir, name), path.resolve("public", "assets", name));

console.log(`✅ Catálogo y ${images.length} imágenes copiados a public/`);
