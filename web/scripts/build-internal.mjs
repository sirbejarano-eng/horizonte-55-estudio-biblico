import { spawnSync } from "node:child_process";
import path from "node:path";

// Exportación de revisión: incluye estudios internos sin cambiar su estado editorial.
const nextBin = path.resolve("node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env: { ...process.env, H55_INCLUDE_DRAFT_STUDIES: "1" },
});
if (result.status !== 0) process.exit(result.status ?? 1);
const normalized = spawnSync(process.execPath, [path.resolve("scripts", "fix-static-rsc.mjs")], { stdio: "inherit" });
process.exit(normalized.status ?? 1);
