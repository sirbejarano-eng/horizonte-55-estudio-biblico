// Copia a public/ lo que la versión actual ya tiene en la raíz del repositorio, para no duplicarlo
// en git: el catálogo bíblico (lo descarga la búsqueda) y los mapas e ilustraciones de los estudios.
import fs from "node:fs";
import path from "node:path";

const copy = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

// Los cuatro catálogos (ONBV, RV1909, inglés y alemán): la búsqueda descarga el de la edición activa.
const catalogs = ["books-es-onbv.json", "books.json", "books-en.json", "books-de.json"];
for (const name of catalogs) copy(path.resolve("..", "content", name), path.resolve("public", "content", name));

const assetsDir = path.resolve("..", "assets");
const images = fs.readdirSync(assetsDir).filter((name) => /^(mapa|contexto)-.+\.webp$/.test(name));
for (const name of images) copy(path.join(assetsDir, name), path.resolve("public", "assets", name));

console.log(`✅ Catálogo y ${images.length} imágenes copiados a public/`);
