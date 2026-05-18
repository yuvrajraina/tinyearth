import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "src/assets/textures");
const target = resolve(root, "dist/assets/textures");

rmSync(target, { force: true, recursive: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
