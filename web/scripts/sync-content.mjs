// Copia a public/ lo que la versión actual ya tiene en la raíz del repositorio, para no duplicarlo
// en git: el catálogo bíblico (lo descarga la búsqueda) y los mapas e ilustraciones de los estudios.
import fs from "node:fs";
import path from "node:path";

const copy = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

// Los cuatro catálogos (ONBV, RV1909, inglés y alemán): la búsqueda descarga el de la edición activa.
const catalogs = { onbv: "books-es-onbv.json", rv1909: "books.json", en: "books-en.json", de: "books-de.json" };
for (const [edition, name] of Object.entries(catalogs)) {
  const source = path.resolve("..", "content", name);
  copy(source, path.resolve("public", "content", name));
  // Índice ligero (título y nº de capítulos por libro) para el selector de la página de lectura.
  const { books } = JSON.parse(fs.readFileSync(source, "utf8"));
  const index = books.map((book) => ({ id: book.id, title: book.title, chapters: book.chapters.length }));
  fs.writeFileSync(path.resolve("public", "content", `index-${edition}.json`), JSON.stringify(index));
}

const assetsDir = path.resolve("..", "assets");
const images = fs.readdirSync(assetsDir).filter((name) => /^((mapa|contexto)-.+\.webp|icon-(en|de)\.png)$/.test(name));
for (const name of images) copy(path.join(assetsDir, name), path.resolve("public", "assets", name));

console.log(`✅ Catálogo y ${images.length} imágenes copiados a public/`);
