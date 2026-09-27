import fs from "node:fs";
import path from "node:path";

const output = path.resolve("out");
let fixed = 0;

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (!entry.isDirectory()) continue;
    // Next exporta estos recursos como árboles de carpetas, aunque el cliente los solicita
    // como un único nombre separado por puntos. Incluye variantes como __next.!KGVzKQ y
    // __next.en; ambas deben aplanarse para que la navegación interna no produzca 404.
    if (entry.name.startsWith("__next.")) {
      const files = [];
      const collect = (current) => {
        for (const child of fs.readdirSync(current, { withFileTypes: true })) {
          const childPath = path.join(current, child.name);
          if (child.isDirectory()) collect(childPath);
          else files.push(childPath);
        }
      };
      collect(absolute);
      for (const source of files) {
        const relative = path.relative(absolute, source).split(path.sep).join(".");
        const destination = path.join(directory, `${entry.name}.${relative}`);
        if (fs.existsSync(destination)) throw new Error(`La normalización RSC sobrescribiría ${destination}`);
        fs.renameSync(source, destination);
        fixed++;
      }
      fs.rmSync(absolute, { recursive: true, force: true });
      continue;
    }
    visit(absolute);
  }
}

if (!fs.existsSync(output)) throw new Error("No existe web/out; ejecuta Next antes de normalizar la exportación.");
visit(output);
console.log(`✅ Navegación estática normalizada: ${fixed} recursos RSC.`);
