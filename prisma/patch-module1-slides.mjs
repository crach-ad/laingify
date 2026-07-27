// In-place content patch: swap Module 1's GIF image blocks for pausable slide
// players. Touches ONLY the module contentJson — no camper data, safe mid-camp.
//   node prisma/patch-module1-slides.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLIDES = {
  "/tutorial/keychain/step1_body.gif": {
    urls: [1, 2, 3, 4, 5].map((i) => `/tutorial/keychain/slides/s1_${i}.jpg`),
    text: "Follow along slide by slide — ⏸ to pause, ‹ › to go at your own pace.",
  },
  "/tutorial/keychain/step2_name.gif": {
    urls: [1, 2, 3, 4, 5, 6, 7].map((i) => `/tutorial/keychain/slides/s2_${i}.jpg`),
    text: "Follow along: TEXT → your name → Height 4 → Align. Pause anytime with ⏸.",
  },
  "/tutorial/keychain/step3_hole.gif": {
    urls: [1, 2, 3, 4, 5, 6].map((i) => `/tutorial/keychain/slides/s3_${i}.jpg`),
    text: "Follow along: Hole cylinder → corner → Group. Pause anytime with ⏸.",
  },
};

async function main() {
  const module1 = await prisma.module.findFirst({
    where: { org: { name: "Winners Camp" }, title: { contains: "Module 1" } },
  });
  if (!module1) throw new Error("Module 1 not found.");

  const blocks = JSON.parse(module1.contentJson);
  let patched = 0;
  const next = blocks.map((b) => {
    if (b.type === "image" && SLIDES[b.url]) {
      patched++;
      return { type: "slides", ...SLIDES[b.url] };
    }
    if (b.type === "slides") return b; // already patched — idempotent
    return b;
  });

  await prisma.module.update({
    where: { id: module1.id },
    data: { contentJson: JSON.stringify(next) },
  });
  console.log(`Patched ${patched} image block(s) → slide players. No camper data touched.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
