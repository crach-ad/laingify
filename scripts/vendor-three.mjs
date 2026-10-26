// Copies the parts of three.js the Letter Leaper 3D scene uses into the
// static game folder (it runs outside the Next.js bundle, like Phaser):
//   node scripts/vendor-three.mjs
// The version is whatever `three` is installed (package.json); the import map
// in public/games/letter-leaper/index.html points "three" at the copy.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules/three");
const to = join(root, "public/games/letter-leaper/vendor/three");
const files = [
  "build/three.module.min.js",
  "build/three.core.min.js",
  "examples/jsm/loaders/GLTFLoader.js",
  "examples/jsm/utils/BufferGeometryUtils.js",
  "examples/jsm/utils/SkeletonUtils.js",
  "LICENSE",
];
for (const f of files) {
  mkdirSync(dirname(join(to, f)), { recursive: true });
  copyFileSync(join(from, f), join(to, f));
}
const { version } = JSON.parse(readFileSync(join(from, "package.json"), "utf8"));
writeFileSync(join(to, "README.txt"), `three.js ${version} (MIT, see LICENSE), copied from node_modules by scripts/vendor-three.mjs.\n`);
console.log(`three.js ${version} → ${to}`);
