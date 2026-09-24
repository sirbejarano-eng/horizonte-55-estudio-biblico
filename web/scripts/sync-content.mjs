// Copia el catálogo bíblico de la raíz del repositorio a public/content/ para que la búsqueda
// (que se ejecuta en el navegador) pueda descargarlo. La fuente única sigue siendo ../content/.
import fs from "node:fs";
import path from "node:path";

const source = path.resolve("..", "content", "books-es-onbv.json");
const targetDir = path.resolve("public", "content");
fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, path.join(targetDir, "books-es-onbv.json"));
console.log("✅ Catálogo copiado a public/content/");
