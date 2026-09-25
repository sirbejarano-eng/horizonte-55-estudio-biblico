import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/sin-conexion/", "/en/offline/", "/de/offline/"] },
    sitemap: "https://biblia.horizonte55.com/sitemap.xml",
  };
}
