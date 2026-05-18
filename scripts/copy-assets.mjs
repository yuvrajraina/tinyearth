import { copyFileSync, cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const source = resolve(root, "src/assets/textures");
const target = resolve(dist, "assets/textures");
const types = resolve(root, "src/index.d.ts");

for (const entry of readdirSync(dist)) {
  if (entry !== "react-earth-lite.js") {
    rmSync(resolve(dist, entry), { force: true, recursive: true });
  }
}

mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
copyFileSync(types, resolve(dist, "index.d.ts"));
