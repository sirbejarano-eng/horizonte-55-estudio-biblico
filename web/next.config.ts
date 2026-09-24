import type { NextConfig } from "next";

// Exportación estática: `next build` genera la carpeta out/ con una página HTML por capítulo,
// lista para GitHub Pages (sin servidor). Por eso no hay optimización de imágenes en tiempo real.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
