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
  // MODULE 1 · DAY 1 — Name tag keychain
  // Coding intro (Lightbot) → Tinkercad basics → the first printed object.
  // ==========================================================================
  const module1 = await prisma.module.create({
    data: {
      orgId: camp.id,
      title: "Winners Camp, Module 1 — Name Tag Keychain",
      summary:
        "Day 1: crack coding puzzles in Lightbot, learn Tinkercad, and design a personalized name tag keychain that prints tonight.",
      badgeName: "Keychain Creator",
      badgeIcon: "🔑",
      badgeDescription:
        "Solved coding challenges and designed a personalized, printable name tag keychain in Tinkercad.",
      contentJson: JSON.stringify([
        block("heading", { text: "Welcome to Winners Camp!" }),
        block("text", {
          text: "Over two days you'll code, design in 3D, and walk away with two printed objects you made yourself. Today: think like a programmer, then design like an engineer. Your keychain prints overnight — you'll hold it tomorrow morning.",
        }),

        block("heading", { text: "Part 1 — Think in code" }),
        block("text", {
          text: "Code is instructions a computer follows exactly — no guessing, no 'you know what I mean.' In Lightbot, you ARE the compiler: plan the robot's moves, run them, watch where your plan breaks, fix it. That loop — plan, run, debug — is how all software gets built.",
        }),
        block("text", {
          text: "Work through the Lightbot challenges. When you get stuck, that's the good part: read what the robot actually did (not what you wanted), find the first wrong move, and change only that. Spot a repeating pattern? That's what functions are for.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Lightbot victory screenshot",
          text: "Beat a level that took you more than one try, then screenshot it (or snap a photo of your screen). That level is proof you debugged like a programmer.",
        }),

        block("heading", { text: "Part 2 — From code to objects" }),
        block("text", {
          text: "3D printing turns a drawing on screen into a real thing: the printer melts plastic and stacks it layer by layer, bottom to top. Engineers print car parts, doctors print bone models, and after a storm, a printer can make the small parts shops have run out of. Today, it makes your keychain.",
        }),

        block("heading", { text: "Part 3 — Build your keychain" }),
        block("text", {
          text: "Log in to Tinkercad and start a new design. Step 1: drag a box onto the workplane and set it to exactly 60 × 22 × 3 mm in the shape panel. Step 2: round it off — use the rounded-box shape, or soften the corners with four cylinders (3 mm corner radius).",
        }),
        block("text", {
          text: "Step 3: add the text tool, type YOUR name, and raise it 1 mm above the face — then center it perfectly with Align. Step 4: the keyring hole — a 4 mm cylinder switched to Hole, placed 6 mm from the short edge. Group everything. One solid piece, ready to print.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Keychain build screenshot",
          text: "Screenshot your keychain in Tinkercad — name raised, hole placed. It doesn't need to be perfect yet: show your progress!",
        }),
        block("text", {
          text: "Make it yours: stretch the letters, add a shape you love, try a pattern along the edge. Two rules of print-ready design: keep everything at least 2 mm thick, and keep the bottom flat — it prints flat, 0.2 mm layers, 15% infill, no supports. Done? Export as STL and drop it in the class print queue folder — the printer is the bottleneck, so export as soon as you're happy.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: my design choices",
          text: "Press record and answer out loud: How did you personalize your keychain? And what was the trickiest part of Lightbot or Tinkercad today — how did you crack it?",
        }),

        block("heading", { text: "Almost done!" }),
        block("prompt", {
          text: "Last step: a short written wrap-up of Day 1. Then your portfolio builds itself from everything you captured today — and tomorrow you'll design something with moving parts.",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Lightbot victory screenshot",
            description: "A screenshot or photo of a completed Lightbot challenge.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 0,
          },
          {
            label: "Keychain build screenshot",
            description:
              "Tinkercad keychain in progress: 60 × 22 × 3 mm body, raised name, 4 mm keyring hole.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 1,
          },
          {
            label: "Voice note: my design choices",
            description: "A recorded reflection: how they personalized the tag and what was tricky.",
            checkType: "AUTO",
            requiresEvidenceType: "AUDIO",
            required: true,
            order: 2,
          },
          {
            label: "Written wrap-up",
            description: "A short written reflection on Day 1.",
            checkType: "AUTO",
            required: true,
            order: 3,
          },
        ],
      },
    },
  });

  // ==========================================================================
  // MODULE 2 · DAY 2 — Fidget clicker, structure, and game design
  // A build that either works or doesn't, the hurricane-resilience session,
  // and the first game asset.
  // ==========================================================================
  const module2 = await prisma.module.create({
    data: {
      orgId: camp.id,
      title: "Winners Camp, Module 2 — Fidget Clicker",
      summary:
        "Day 2: design a two-part fidget clicker with real moving parts, learn why printed parts break (and what that means in hurricane season), then create your first game asset.",
      badgeName: "Clicker Engineer",
      badgeIcon: "🛠️",
      badgeDescription:
        "Designed a two-part toy with working clearance, explained structural strength, and created a game asset.",
      contentJson: JSON.stringify([
        block("heading", { text: "Day 2 — Print reveal!" }),
        block("text", {
          text: "This morning you're holding yesterday's keychain — made by you, printed overnight. Look closely at yours and a neighbor's: can you see the layer lines? Any rough spots or stringy bits? That's print quality, and today you'll learn what causes it. Today's build is harder: a toy with MOVING parts. It will either click… or it won't. That's engineering.",
        }),

        block("heading", { text: "Part 1 — Build the fidget clicker" }),
        block("text", {
          text: "The clicker is two parts: a housing with a springy arm, and a button that snaps in. Step 1: build the housing — a 40 mm disc, 10 mm tall, then hollow it with a 36 mm hole cylinder so the walls are 2 mm. Step 2: cut a slot for the spring arm, and keep the arm exactly 2 mm thick — thick enough to survive, thin enough to flex. That flex IS the click.",
        }),
        block("text", {
          text: "Step 3: model the button — a 14 mm cap on a stem, and make the stem 0.4 mm narrower than its slot. That tiny gap is called CLEARANCE. Too tight and it jams; too loose and it rattles. 0.4 mm is the sweet spot for our printers. Step 4: test-fit visually from the front view before you group anything. Step 5: export both parts as one STL, labeled with your name.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Clicker build screenshot",
          text: "Screenshot your clicker from the front view showing both parts and the gap between them. If a neighbor can spot your clearance, you've modeled it right.",
        }),

        block("heading", { text: "Part 2 — Why parts break" }),
        block("text", {
          text: "Here's the framing question: after a storm, the shops are closed and the ferry hasn't run — what could you print to hold a building together? To answer it, you need to know why printed parts fail. Three big ideas: (1) Force travels through a part along a LOAD PATH — thicken that route, the rest can stay light. (2) Printed parts are strong ACROSS layers but weak BETWEEN them — a bracket loaded along its layer lines peels apart like string cheese. (3) Past about 45°, plastic has nothing to sit on — add supports (temporary scaffolding that marks the surface) or just reorient the part.",
        }),
        block("text", {
          text: "Bonus tricks engineers use: extra wall perimeters buy far more strength than extra infill for the same plastic. And a rectangle folds where a triangle doesn't — one small corner gusset can double a bracket's stiffness. In The Bahamas, hurricane resilience is mostly about CONNECTIONS, not walls: roofs lift off when the fasteners between roof, wall, and foundation give way. Hurricane straps, gusset plates, shutter brackets — that's exactly the family of shapes you've been modelling, and exactly what runs out of stock before a storm. (Honest limits: PLA creeps in island heat, so printed parts are prototypes and spares — not certified structural fasteners. But shutter clips, cable clamps, and replacement latches when supply lines are down? Printing wins.)",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: the bracket bet",
          text: "We tested three printed brackets: flat, upright with supports, and flat with a gusset. Record your answer: Which broke first and WHY? And name one thing you'd print for your house before hurricane season.",
        }),

        block("heading", { text: "Part 3 — Enter the game" }),
        block("text", {
          text: "Coding, design, structure — now they meet game development. Every game is built from ASSETS: characters, obstacles, backgrounds, power-ups. Open Canva and create one asset for our shared game library. Make it bold and simple — it needs to read clearly at small size. Export it with a transparent background if you can.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Game asset screenshot",
          text: "Screenshot or export your Canva game asset and upload it. It joins the class library — someone's game will use YOUR art.",
        }),

        block("heading", { text: "You made it!" }),
        block("prompt", {
          text: "Final step of camp: a written wrap-up of your two days. Then download your portfolio — two builds, your voice, your art, all in one timeline.",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Clicker build screenshot",
            description:
              "Tinkercad clicker: 40 mm housing with 2 mm walls, button with 0.4 mm clearance, front-view test fit.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 0,
          },
          {
            label: "Voice note: the bracket bet",
            description:
              "A recorded explanation of which bracket failed first and why (layer direction / load path), plus a hurricane-season print idea.",
            checkType: "AUTO",
            requiresEvidenceType: "AUDIO",
            required: true,
            order: 1,
          },
          {
            label: "Game asset screenshot",
            description: "The Canva game asset contributed to the shared class library.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 2,
          },
          {
            label: "Written wrap-up",
            description: "A short written reflection on the two days of camp.",
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
  console.log('  Module 1 (Day 1): Name Tag Keychain — Lightbot ✓ + build ✓ + voice note + wrap-up');
  console.log('  Module 2 (Day 2): Fidget Clicker — build ✓ + bracket-bet voice note + game asset ✓ + wrap-up');
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
