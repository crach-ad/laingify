// Create (or recreate) "Test Camper" in the Winners Camp class with BOTH
// modules fully completed — for testing portfolio generation end to end.
//   node prisma/test-camper.mjs
// Safe to re-run (replaces the previous Test Camper). Removed entirely by
// `npm run seed:camp`, which resets the whole camp org.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const NAME = "Test Camper";

// --- tiny asset generators (all data URLs, fully self-contained) -----------

function svgDataUrl(svg) {
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

const figure = (label, body) =>
  svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <rect width="640" height="400" fill="#101216"/>
  <rect x="14" y="14" width="612" height="372" fill="none" stroke="rgba(255,255,255,0.15)"/>
  <text x="30" y="46" fill="#8a909b" font-family="monospace" font-size="14" letter-spacing="2">${label}</text>
  ${body}
</svg>`);

const tagBody = figure(
  "TAG BODY · 60 × 22 × 3 · R3",
  `<rect x="170" y="160" width="300" height="110" rx="18" fill="#e23d3d" stroke="#B6F24D" stroke-width="3"/>
   <line x1="170" y1="300" x2="470" y2="300" stroke="#6b7280" stroke-dasharray="4 4"/>
   <text x="320" y="322" fill="#8a909b" font-family="monospace" font-size="13" text-anchor="middle">60 mm</text>`,
);

const finishedTag = figure(
  "FINISHED KEYCHAIN · RAISED NAME + 4MM HOLE",
  `<rect x="150" y="150" width="340" height="125" rx="20" fill="#e23d3d" stroke="#B6F24D" stroke-width="3"/>
   <circle cx="185" cy="180" r="9" fill="#101216" stroke="#B6F24D" stroke-width="2"/>
   <text x="330" y="230" fill="#7d1f1f" font-family="Arial Black, sans-serif" font-size="52" text-anchor="middle" stroke="#B6F24D" stroke-width="1">TEST</text>
   <text x="320" y="330" fill="#8a909b" font-family="monospace" font-size="13" text-anchor="middle">READY TO PRINT · NO SUPPORTS</text>`,
);

const housing = figure(
  "CLICKER HOUSING · 40MM · 2MM WALLS",
  `<circle cx="320" cy="205" r="105" fill="none" stroke="#e2a13d" stroke-width="14"/>
   <circle cx="320" cy="205" r="70" fill="none" stroke="#B6F24D" stroke-width="2" stroke-dasharray="6 5"/>
   <rect x="300" y="90" width="40" height="30" fill="#101216" stroke="#e2a13d" stroke-width="3"/>
   <text x="320" y="350" fill="#8a909b" font-family="monospace" font-size="13" text-anchor="middle">TOP VIEW · EVEN 2 MM RING</text>`,
);

const clicker = figure(
  "FINISHED CLICKER · 0.4MM CLEARANCE",
  `<circle cx="250" cy="205" r="100" fill="none" stroke="#e2a13d" stroke-width="12"/>
   <rect x="228" y="95" width="44" height="26" fill="#101216" stroke="#B6F24D" stroke-width="2"/>
   <circle cx="455" cy="205" r="48" fill="#7c5cff" stroke="#B6F24D" stroke-width="2"/>
   <rect x="440" y="250" width="30" height="34" fill="#7c5cff"/>
   <text x="320" y="350" fill="#8a909b" font-family="monospace" font-size="13" text-anchor="middle">FRONT VIEW · SPOT THE GAP</text>`,
);

const avatar = svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
  <rect width="240" height="240" fill="#181b21"/>
  <circle cx="120" cy="92" r="46" fill="#B6F24D"/>
  <path d="M40 218 Q120 140 200 218 L200 240 L40 240 Z" fill="#B6F24D"/>
  <circle cx="103" cy="86" r="7" fill="#101216"/><circle cx="137" cy="86" r="7" fill="#101216"/>
  <path d="M100 110 Q120 126 140 110" stroke="#101216" stroke-width="5" fill="none" stroke-linecap="round"/>
</svg>`);

// Playable ~1.4s WAV (two soft beeps) so the portfolio audio player works.
function beepWav() {
  const rate = 8000;
  const secs = 1.4;
  const n = Math.floor(rate * secs);
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const on = (t > 0.05 && t < 0.55) || (t > 0.75 && t < 1.3);
    const env = on ? Math.sin(Math.PI * ((t < 0.6 ? t - 0.05 : t - 0.75) / 0.5)) : 0;
    const s = Math.round(Math.sin(2 * Math.PI * 523 * t) * env * 12000);
    data.writeInt16LE(s, i * 2);
  }
  const hdr = Buffer.alloc(44);
  hdr.write("RIFF", 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write("WAVEfmt ", 8);
  hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22);
  hdr.writeUInt32LE(rate, 24); hdr.writeUInt32LE(rate * 2, 28); hdr.writeUInt16LE(2, 32);
  hdr.writeUInt16LE(16, 34); hdr.write("data", 36); hdr.writeUInt32LE(data.length, 40);
  return "data:audio/wav;base64," + Buffer.concat([hdr, data]).toString("base64");
}

// ---------------------------------------------------------------------------

async function completeModule(learner, module, work) {
  const criteria = await prisma.criterion.findMany({
    where: { moduleId: module.id },
    orderBy: { order: "asc" },
  });
  let when = work.start;
  const tick = () => (when = new Date(when.getTime() + 9 * 60 * 1000));

  for (const c of criteria) {
    const w = work.byLabel[c.label];
    if (w?.photo) {
      await prisma.evidence.create({
        data: {
          learnerId: learner.id, moduleId: module.id, criterionId: c.id,
          type: "PHOTO", url: w.photo, caption: w.caption ?? null, createdAt: tick(),
        },
      });
    }
    if (w?.audio) {
      await prisma.evidence.create({
        data: {
          learnerId: learner.id, moduleId: module.id, criterionId: c.id,
          type: "AUDIO", url: w.audio, text: w.transcript ?? null,
          caption: w.caption ?? null, createdAt: tick(),
        },
      });
    }
    await prisma.criterionStatus.create({
      data: { learnerId: learner.id, criterionId: c.id, status: "MET", decidedBy: "system" },
    });
  }

  const submission = await prisma.submission.create({
    data: { learnerId: learner.id, moduleId: module.id, content: work.wrapUp, createdAt: tick() },
  });
  await prisma.autoFeedback.create({
    data: {
      submissionId: submission.id,
      summary: work.feedback,
      metJson: JSON.stringify(criteria.map((c) => c.id)),
      missingJson: "[]",
      nextSteps: "",
    },
  });
  await prisma.moduleProgress.create({
    data: {
      learnerId: learner.id, moduleId: module.id, status: "COMPLETED",
      startedAt: work.start, completedAt: tick(), timeOnTaskSeconds: 3300,
    },
  });
  const evidence = await prisma.evidence.findMany({
    where: { learnerId: learner.id, moduleId: module.id },
  });
  await prisma.project.create({
    data: {
      learnerId: learner.id,
      moduleId: module.id,
      summary:
        `${NAME} completed "${module.title}" and earned the ${module.badgeName} badge. ` +
        `They demonstrated: ${criteria.map((c) => c.label).join("; ")}. ` +
        `This project assembles ${evidence.length} piece(s) of evidence and 1 submission(s) into a finished artifact.`,
      evidenceJson: JSON.stringify(evidence.map((e) => e.id)),
    },
  });
}

async function main() {
  const org = await prisma.org.findFirst({ where: { name: "Winners Camp" } });
  if (!org) throw new Error("Winners Camp org not found — run npm run seed:camp first.");
  const klass = await prisma.class.findFirst({ where: { orgId: org.id } });
  const modules = await prisma.module.findMany({ where: { orgId: org.id }, orderBy: { title: "asc" } });
  const [m1, m2] = modules;

  // Replace any previous test camper (scoped delete).
  const old = await prisma.learner.findFirst({
    where: { displayName: NAME, roster: { some: { classId: klass.id } } },
  });
  if (old) {
    await prisma.message.deleteMany({ where: { thread: { learnerId: old.id } } });
    await prisma.discussionThread.deleteMany({ where: { learnerId: old.id } });
    await prisma.autoFeedback.deleteMany({ where: { submission: { learnerId: old.id } } });
    await prisma.submission.deleteMany({ where: { learnerId: old.id } });
    await prisma.evidence.deleteMany({ where: { learnerId: old.id } });
    await prisma.criterionStatus.deleteMany({ where: { learnerId: old.id } });
    await prisma.spriteInteraction.deleteMany({ where: { learnerId: old.id } });
    await prisma.project.deleteMany({ where: { learnerId: old.id } });
    await prisma.moduleProgress.deleteMany({ where: { learnerId: old.id } });
    await prisma.rosterEntry.deleteMany({ where: { learnerId: old.id } });
    await prisma.sprite.deleteMany({ where: { learnerId: old.id } });
    await prisma.learner.delete({ where: { id: old.id } });
  }

  const learner = await prisma.learner.create({
    data: { displayName: NAME, band: "TEEN", photoUrl: avatar },
  });
  await prisma.rosterEntry.create({ data: { classId: klass.id, learnerId: learner.id } });

  const wav = beepWav();
  const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000);
  const today = new Date(Date.now() - 2.5 * 60 * 60 * 1000);

  await completeModule(learner, m1, {
    start: yesterday,
    byLabel: {
      "Tag body screenshot": { photo: tagBody, caption: "My tag body — typed 60, 22, 3 exactly" },
      "Voice note: why raise the name?": {
        audio: wav,
        transcript:
          "If the letters had zero height the printer would have nothing to build — they'd just be flat in the tag. Raising them 1 millimeter means the nozzle prints one extra layer on top, so you can feel the name.",
      },
      "Finished keychain screenshot": { photo: finishedTag, caption: "Finished! Rounded corners, raised name, hole in the corner" },
    },
    wrapUp:
      "Today I built my first ever 3D model! I made my name tag with rounded corners and put the keyring hole in the top-left corner so it doesn't touch my letters. The trickiest part was the Align tool — I kept clicking the wrong dot until I watched the GIF again. I can't believe it prints TONIGHT.",
    feedback:
      "What a first build! You used exact measurements, solved the Align puzzle yourself, and your hole placement is smart — that's real design thinking.",
  });

  await completeModule(learner, m2, {
    start: today,
    byLabel: {
      "Housing screenshot": { photo: housing, caption: "Top view — you can see the even 2 mm ring" },
      "Voice note: the 2 mm arm": {
        audio: wav,
        transcript:
          "If the arm is way thicker it won't bend at all — you'd push and nothing happens. If it's too thin it would snap after a few clicks. Two millimeters is right in the middle: bendy but strong.",
      },
      "Finished clicker screenshot": { photo: clicker, caption: "Front view — the 0.4 mm gap is just visible" },
      "Voice note: the bracket bet": {
        audio: wav,
        transcript:
          "The upright bracket broke first because the weight pulled along the layer lines and it peeled apart like string cheese. Before hurricane season I would print shutter clips for my grandma's windows.",
      },
    },
    wrapUp:
      "Day 2 was harder but better. My clicker actually CLICKS — the 0.4 millimeter gap worked first try. The bracket test was my favorite part because I bet on the wrong bracket and now I get why layer direction matters. Two days, two things I made myself.",
    feedback:
      "You designed a moving part that worked on the first print — that's rare! And your bracket explanation nails the big idea of layer direction. Brilliant camp, Test Camper.",
  });

  console.log(`"${NAME}" created with both modules completed.`);
  console.log("  Learner view: /join → code HAPPY → pick 'Test Camper' (no PIN)");
  console.log("  → dashboard badges 🔑🛠️ open each portfolio; finish screens link too");
  console.log("  Instructor view: /instruct → roster → Test Camper → View portfolio");
  console.log("  Cleanup: re-running this script replaces them; npm run seed:camp removes them.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
