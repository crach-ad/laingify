// Copies the pinned Phaser build (and its MIT licence) into the static game,
// which loads it without a bundler: public/games/letter-leaper/vendor/.
// Run after changing the phaser version in package.json: npm run vendor:phaser
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";

const from = new URL("../node_modules/phaser/", import.meta.url);
const to = new URL("../public/games/letter-leaper/vendor/", import.meta.url);
const { version } = JSON.parse(readFileSync(new URL("package.json", from), "utf8"));
copyFileSync(new URL("dist/phaser.min.js", from), new URL("phaser.min.js", to));
copyFileSync(new URL("LICENSE.md", from), new URL("PHASER-LICENSE.md", to));
writeFileSync(new URL("README.txt", to), `Phaser ${version} (https://phaser.io, https://github.com/phaserjs/phaser)\nMIT License, (c) Richard Davey, Phaser Studio Inc. See PHASER-LICENSE.md.\nCopied from node_modules/phaser/dist by \`npm run vendor:phaser\`; keep in step with package.json.\n`);
console.log(`Vendored Phaser ${version}.`);
