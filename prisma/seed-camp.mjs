// Winners Camp trial seed — aligned with the two-day STEM & AI execution plan
// (ages 11–14, Lightbot · Tinkercad · Canva; keychain on Day 1, fidget
// clicker + structural analysis on Day 2).
//
// ONLY touches the "Winners Camp" org — the PDI demo org is left alone.
// Re-run any time to reset the camp:   npm run seed:camp
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

  // ==========================================================================
  // MODULE 1 · DAY 1 — Name tag keychain (Tinkercad only)
  // Step-by-step build instructions with screenshot uploads and short audio
  // questions for reinforcement and student perspective. The Lightbot coding
  // block runs separately in the room and never gates this module.
  // ==========================================================================
  const module1 = await prisma.module.create({
    data: {
      orgId: camp.id,
      title: "Winners Camp, Module 1 — Name Tag Keychain",
      summary:
        "Day 1 build: design a personalized name tag keychain in Tinkercad, step by step. It prints tonight — you hold it tomorrow.",
      badgeName: "Keychain Creator",
      badgeIcon: "🔑",
      badgeDescription: "Designed a personalized, printable name tag keychain in Tinkercad.",
      contentJson: JSON.stringify([
        block("heading", { text: "Let's build your keychain" }),
        block("text", {
          text: "You've already warmed up your coding brain this morning — now you become a designer. 3D printing turns a drawing on screen into a real object: the printer melts plastic and stacks it layer by layer, bottom to top. By the end of this hour your design goes in the print queue, prints overnight, and lands in your hand tomorrow morning.",
        }),

        block("heading", { text: "Step 1 — The tag body" }),
        block("text", {
          text: "Log in to Tinkercad and start a new design. Drag a box onto the workplane and set it to exactly 60 × 22 × 3 mm in the shape panel — type the numbers, don't eyeball them. Then round it off: use the rounded-box shape, or soften the corners with four cylinders (3 mm corner radius).",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Tag body screenshot",
          text: "Screenshot your rounded tag body with the shape panel visible, so you can see your exact measurements.",
        }),

        block("heading", { text: "Step 2 — Your name, raised" }),
        block("text", {
          text: "Add the text tool, type YOUR name, and raise it 1 mm above the face of the tag. Then use Align to center it perfectly — select both shapes first, then click the little dots. Dragging by eye is never quite centered; Align always is.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: why raise the name?",
          text: "Quick thinking question — press record and answer: Why do we raise the name 1 mm above the tag instead of leaving it flat? What would the printer do if the letters had zero height?",
        }),

        block("heading", { text: "Step 3 — Hole, group, make it yours" }),
        block("text", {
          text: "The keyring hole: add a 4 mm cylinder, switch it to Hole, and place it 6 mm from the short edge. Group everything — now it's one solid piece. Then personalize: stretch the letters, add a shape you love, try a pattern along the edge. Two rules of print-ready design: keep everything at least 2 mm thick, and keep the bottom flat. It prints flat — 0.2 mm layers, 15% infill, no supports.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Finished keychain screenshot",
          text: "Screenshot your finished keychain — raised name, keyring hole, and your personal touches all visible. Then export it as an STL and drop it in the class print queue folder: the printer is the bottleneck, so export as soon as you're happy!",
        }),

        block("heading", { text: "Almost done!" }),
        block("prompt", {
          text: "Last step: a short written wrap-up — how you made the keychain yours, and what was trickiest. Then your portfolio builds itself from everything you captured today.",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Tag body screenshot",
            description: "The rounded 60 × 22 × 3 mm tag body, with the shape panel visible.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 0,
          },
          {
            label: "Voice note: why raise the name?",
            description:
              "Reinforcement question: why the name is raised 1 mm rather than flat.",
            checkType: "AUTO",
            requiresEvidenceType: "AUDIO",
            required: true,
            order: 1,
          },
          {
            label: "Finished keychain screenshot",
            description:
              "The completed keychain: raised name, 4 mm keyring hole, personalization.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 2,
          },
          {
            label: "Written wrap-up",
            description: "A short written reflection on the build (perspective).",
            checkType: "AUTO",
            required: true,
            order: 3,
          },
        ],
      },
    },
  });

  // ==========================================================================
  // MODULE 2 · DAY 2 — Fidget clicker (Tinkercad only)
  // Step-by-step build with screenshot uploads and reinforcement/perspective
  // audio questions. The structural-analysis discussion feeds one audio
  // question here; the Canva game-design block runs separately in the room.
  // ==========================================================================
  const module2 = await prisma.module.create({
    data: {
      orgId: camp.id,
      title: "Winners Camp, Module 2 — Fidget Clicker",
      summary:
        "Day 2 build: a two-part fidget clicker with real moving parts — housing, spring arm, and a button with 0.4 mm clearance. It either clicks or it doesn't.",
      badgeName: "Clicker Engineer",
      badgeIcon: "🛠️",
      badgeDescription:
        "Designed a two-part fidget clicker with a flexing spring arm and working clearance in Tinkercad.",
      contentJson: JSON.stringify([
        block("heading", { text: "Day 2 — Print reveal!" }),
        block("text", {
          text: "This morning you're holding yesterday's keychain — made by you, printed overnight. Look closely at yours and a neighbor's: can you see the layer lines? Any rough spots? That's print quality, and it'll matter today. This build is harder: a toy with MOVING parts. It will either click… or it won't. That's engineering.",
        }),

        block("heading", { text: "Step 1 — The housing" }),
        block("text", {
          text: "The clicker is two parts: a housing with a springy arm, and a button that snaps in. Start with the housing: a 40 mm disc, 10 mm tall. Then hollow it out with a 36 mm hole cylinder — line it up with Align before you group, so the walls come out an even 2 mm all the way around.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Housing screenshot",
          text: "Screenshot your hollowed housing. Tip: switch to the top view — you should see a clean 2 mm ring.",
        }),

        block("heading", { text: "Step 2 — The spring arm" }),
        block("text", {
          text: "Cut a slot into the housing for the spring arm, and keep the arm exactly 2 mm thick. That number is the whole game: thick enough to survive being pressed a thousand times, thin enough to flex. That flex IS the click.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: the 2 mm arm",
          text: "Quick thinking question — press record and answer: The spring arm is exactly 2 mm. What do you think happens if you make it much thicker? What if it's much thinner?",
        }),

        block("heading", { text: "Step 3 — The button and the gap" }),
        block("text", {
          text: "Model the button: a 14 mm cap on a stem, with the stem 0.4 mm narrower than its slot. That tiny gap is called CLEARANCE — too tight and it jams, too loose and it rattles. 0.4 mm is the sweet spot for our printers. Test-fit visually from the front view BEFORE you group anything. Then export both parts as one STL, labeled with your name, and into the print queue it goes — both parts print flat, 0.2 mm layers, supports off.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Finished clicker screenshot",
          text: "Screenshot your clicker from the front view showing both parts and the gap between them. If a neighbor can spot your clearance, you've modeled it right.",
        }),

        block("heading", { text: "One more question" }),
        block("text", {
          text: "You've now designed for strength (the arm), for movement (the clearance), and yesterday for printing flat. In the structure session we asked: after a storm, the shops are closed and the ferry hasn't run — what could you print to hold a building together?",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: the bracket bet",
          text: "From the bracket test: which bracket broke first, and WHY? And name one thing you'd print for your house before hurricane season.",
        }),

        block("heading", { text: "You made it!" }),
        block("prompt", {
          text: "Final step of camp: a written wrap-up of your two days. Then download your portfolio — two builds, your voice, all in one timeline.",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Housing screenshot",
            description: "The hollowed 40 mm housing with even 2 mm walls.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 0,
          },
          {
            label: "Voice note: the 2 mm arm",
            description:
              "Reinforcement question: what happens if the spring arm is thicker or thinner than 2 mm.",
            checkType: "AUTO",
            requiresEvidenceType: "AUDIO",
            required: true,
            order: 1,
          },
          {
            label: "Finished clicker screenshot",
            description:
              "Front view showing both parts and the 0.4 mm clearance gap.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 2,
          },
          {
            label: "Voice note: the bracket bet",
            description:
              "Perspective question from the structure session: which bracket failed first and why, plus a hurricane-season print idea.",
            checkType: "AUTO",
            requiresEvidenceType: "AUDIO",
            required: true,
            order: 3,
          },
          {
            label: "Written wrap-up",
            description: "A short written reflection on the two days of camp.",
            checkType: "AUTO",
            required: true,
            order: 4,
          },
        ],
      },
    },
  });

  const klass = await prisma.class.create({
    data: {
      orgId: camp.id,
      name: "Winners Camp",
      classCode: "HAPPY",
      band: "TEEN", // ages 11–14
      minAuthTier: 0, // click your name — no PIN
      modules: {
        create: [
          { moduleId: module1.id, order: 0 },
          { moduleId: module2.id, order: 1 },
        ],
      },
    },
  });

  for (const displayName of CAMPERS) {
    const learner = await prisma.learner.create({
      data: { displayName, band: "TEEN" },
    });
    await prisma.rosterEntry.create({
      data: { classId: klass.id, learnerId: learner.id },
    });
  }

  await prisma.instructor.create({
    data: { ...INSTRUCTOR, orgId: camp.id },
  });

  // Sanity check: every checkpoint must reference an existing criterion label,
  // and every evidence-backed criterion must have a checkpoint.
  for (const mod of [module1, module2]) {
    const blocks = JSON.parse(mod.contentJson);
    const criteria = await prisma.criterion.findMany({ where: { moduleId: mod.id } });
    const labels = new Set(criteria.map((c) => c.label));
    const checkpointLabels = blocks
      .filter((b) => b.type === "checkpoint")
      .map((b) => b.criterionLabel);
    for (const l of checkpointLabels) {
      if (!labels.has(l)) throw new Error(`"${mod.title}": checkpoint references missing criterion "${l}"`);
    }
    for (const c of criteria.filter((c) => c.requiresEvidenceType)) {
      if (!checkpointLabels.includes(c.label))
        throw new Error(`"${mod.title}": criterion "${c.label}" has no checkpoint`);
    }
  }

  console.log("Winners Camp seeded.");
  console.log(`  Class code: HAPPY — ${CAMPERS.length} campers, click-name access (no PIN), ages 11–14`);
  console.log('  Module 1 (Day 1): Name Tag Keychain — 2 build screenshots + 1 audio question + wrap-up');
  console.log('  Module 2 (Day 2): Fidget Clicker — 2 build screenshots + 2 audio questions + wrap-up');
  console.log('  (Lightbot and Canva run separately in the room — modules never gate on them.)');
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
