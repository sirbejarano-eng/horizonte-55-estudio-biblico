import { execFileSync } from "node:child_process";
import path from "node:path";
import type { NextConfig } from "next";

// Copia catálogo, mapas e ilustraciones a public/ cada vez que arranca Next (dev o build),
// aunque se lance con `npx next dev` en lugar de `npm run dev`.
execFileSync(process.execPath, [path.resolve("scripts", "sync-content.mjs")], { stdio: "inherit" });

// Exportación estática: `next build` genera la carpeta out/ con una página HTML por capítulo,
// lista para GitHub Pages (sin servidor). Por eso no hay optimización de imágenes en tiempo real.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Esta app vive en web/ dentro del repositorio: se fija la raíz para evitar el aviso de "varios lockfiles".
  turbopack: { root: path.resolve() },
};

export default nextConfig;
