// Winners Camp trial seed. ONLY touches the "Winners Camp" org — the PDI demo
// org (and anything else) is left alone. Re-run any time to reset the camp:
//   npm run seed:camp
//
// ⚠️  Re-running DELETES all camper work in this org. Don't run mid-trial.

import { PrismaClient } from "@prisma/client";
import { wipeOrg } from "./org-wipe.mjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// EDIT ME: the real roster. Placeholders until the actual list arrives —
// paste the 40 real first names (plus last initial if two share a name).
// ---------------------------------------------------------------------------
const CAMPERS = Array.from({ length: 40 }, (_, i) => `Camper ${String(i + 1).padStart(2, "0")}`);

// Instructor sign-in for the camp org.
const INSTRUCTOR = {
  displayName: "Coach Crachad",
  email: "crachad.laing@gmail.com",
  pin: "4321",
};

const ORG_NAME = "Winners Camp";
const block = (type, props) => ({ type, ...props });

async function main() {
  console.log("Seeding Winners Camp (org-scoped — other orgs untouched)…");
  await wipeOrg(prisma, ORG_NAME);

  const camp = await prisma.org.create({
    data: { name: ORG_NAME, context: "community" },
  });

  // --- Module 1: step-by-step tutorial with capture checkpoints -------------
  // Checkpoint blocks reference criteria by exact label (criterionLabel).
  const module1 = await prisma.module.create({
    data: {
      orgId: camp.id,
      title: "Winners Camp, Module 1",
      summary:
        "Design day! Sketch an idea, build it in TinkerCAD, and capture your work as you go — it all lands in your portfolio.",
      badgeName: "Day 1 Winner",
      badgeIcon: "🏆",
      badgeDescription: "Sketched, built, and presented a first 3D design.",
      contentJson: JSON.stringify([
        block("heading", { text: "Welcome to Winners Camp!" }),
        block("text", {
          text: "Today you become a designer. Real designers don't start on a computer — they start with a quick messy sketch, then build it in 3D. By the end of today you'll have your own design saved in your portfolio.",
        }),
        block("heading", { text: "Step 1 — Sketch it" }),
        block("text", {
          text: "Your mission: design a name tag or keychain that is totally YOU. Grab paper and a pencil. Draw the shape, write your name on it, add one thing you love (a star, a ball, a cat — anything). Don't make it perfect. Make it yours.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Photo of your sketch",
          text: "Hold your sketch up and take a photo of it (or upload one). This is page one of your portfolio!",
        }),
        block("heading", { text: "Step 2 — Build it in 3D" }),
        block("text", {
          text: "Open TinkerCAD and start a new design. Drag a box onto the workplane and squash it flat — that's your tag. Use the text tool to add your name. Then add the shape from your sketch. Tip: holes are shapes too — use a hole cylinder to make the keyring loop!",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Screenshot of your 3D build",
          text: "Take a screenshot of your TinkerCAD build so far and upload it. It doesn't need to be finished — show your progress!",
        }),
        block("heading", { text: "Step 3 — Make it yours" }),
        block("text", {
          text: "Now push it further: change the colors, stretch the letters, stack shapes, try the ruler tool to make it exactly 80 mm wide. If something goes wrong, undo is your best friend. Designers experiment!",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note about your build",
          text: "Press record and answer out loud: What did you build today? What was the trickiest part, and how did you figure it out?",
        }),
        block("heading", { text: "Almost done!" }),
        block("prompt", {
          text: "Last step coming up: a short written wrap-up. Then your portfolio builds itself from everything you captured today.",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Photo of your sketch",
            description: "A photo of the paper sketch.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 0,
          },
          {
            label: "Screenshot of your 3D build",
            description: "A screenshot of the TinkerCAD design in progress.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 1,
          },
          {
            label: "Voice note about your build",
            description: "A recorded reflection: what they built and what was tricky.",
            checkType: "AUTO",
            requiresEvidenceType: "AUDIO",
            required: true,
            order: 2,
          },
          {
            label: "Written wrap-up",
            description: "A short written reflection on the day.",
            checkType: "AUTO",
            required: true,
            order: 3,
          },
        ],
      },
    },
  });

  const klass = await prisma.class.create({
    data: {
      orgId: camp.id,
      name: "Winners Camp",
      classCode: "CAMP01",
      band: "YOUTH",
      minAuthTier: 0, // click your name — no PIN
      modules: { create: [{ moduleId: module1.id, order: 0 }] },
    },
  });

  for (const displayName of CAMPERS) {
    const learner = await prisma.learner.create({
      data: { displayName, band: "YOUTH" },
    });
    await prisma.rosterEntry.create({
      data: { classId: klass.id, learnerId: learner.id },
    });
  }

  await prisma.instructor.create({
    data: { ...INSTRUCTOR, orgId: camp.id },
  });

  console.log("Winners Camp seeded.");
  console.log(`  Class code: CAMP01 — ${CAMPERS.length} campers, click-name access (no PIN)`);
  console.log(`  Module: "Winners Camp, Module 1" (sketch photo → build screenshot → voice note → wrap-up)`);
  console.log(`  Instructor: ${INSTRUCTOR.email} / PIN ${INSTRUCTOR.pin}`);
  if (CAMPERS[0].startsWith("Camper ")) {
    console.log("  ⚠️  Roster is placeholder names — edit CAMPERS in prisma/seed-camp.mjs and re-run.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
