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
          text: "Log in to Tinkercad and start a new design. Drag a box onto the workplane and set it to exactly 60 × 22 × 3 mm in the shape panel — type the numbers, don't eyeball them. Then round it off: set the Radius to 3 in the shape panel.",
        }),
        block("image", {
          url: "/tutorial/keychain/step1_body.gif",
          text: "Watch: drag the box in, type 60 × 22 × 3, then Radius 3 for rounded corners.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Tag body screenshot",
          text: "Screenshot your rounded tag body with the shape panel visible, so you can see your exact measurements.",
        }),

        block("heading", { text: "Step 2 — Your name, raised" }),
        block("text", {
          text: "Drag the TEXT shape onto your tag and type YOUR name. Set its Height to 4 — your tag is 3 tall, so the letters rise exactly 1 mm above the face. Shrink it with a corner handle until it fits, then use Align to center it perfectly: select both shapes (Ctrl/Cmd+A), press L, and click the middle dots. Dragging by eye is never quite centered; Align always is.",
        }),
        block("image", {
          url: "/tutorial/keychain/step2_name.gif",
          text: "Watch: add TEXT, type your name, Height 4, then Align → middle dots to center it.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: why raise the name?",
          text: "Quick thinking question — press record and answer: Why do we raise the name 1 mm above the tag instead of leaving it flat? What would the printer do if the letters had zero height?",
        }),

        block("heading", { text: "Step 3 — Hole, group, make it yours" }),
        block("text", {
          text: "The keyring hole: add a 4 mm cylinder, switch it to Hole, and tuck it into the top-left corner of the tag — clear of your letters. If it floats above the tag, press D to drop it onto the workplane so it cuts all the way through. Group everything — now it's one solid piece. Then personalize: stretch the letters, add a shape you love. Two rules of print-ready design: keep everything at least 2 mm thick, and keep the bottom flat. It prints flat — 0.2 mm layers, 15% infill, no supports.",
        }),
        block("image", {
          url: "/tutorial/keychain/step3_hole.gif",
          text: "Watch: 4 mm cylinder → Hole → into the corner → Group. The hole cuts clean through.",
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
  // MODULE 2 · DAY 2 — Circular clicky fidget (Tinkercad only)
  // Based on the "Design a Circular Clicky Fidget" tutorial: a real keyboard
  // switch clicks inside a three-part circular body. The socket/cap cutout
  // templates are supplied on the workplane and are Scaling-Locked — students
  // must never resize them. Checkpoints are screenshots + short audio
  // questions; the structure session and Canva run separately in the room.
  // ==========================================================================
  const module2 = await prisma.module.create({
    data: {
      orgId: camp.id,
      title: "Winners Camp, Module 2 — Clicky Fidget",
      summary:
        "Day 2 build: a circular fidget clicker with a REAL keyboard switch inside — three printed parts, a moving button, and your own logo on the front.",
      badgeName: "Clicker Engineer",
      badgeIcon: "🛠️",
      badgeDescription:
        "Designed a three-part circular fidget clicker with working clearance, mechanical cutouts, and a custom logo.",
      contentJson: JSON.stringify([
        block("heading", { text: "Day 2 — Print reveal!" }),
        block("text", {
          text: "This morning you're holding yesterday's keychain — made by you, printed overnight. Look at the layer lines: that's how your fidget will be built too. Today's project CLICKS: a real keyboard switch lives inside it. You'll design three parts — a Back Plate, a Front Frame, and a moving Clicker Button with YOUR logo on it.",
        }),
        block("heading", { text: "Check your workplane first" }),
        block("text", {
          text: "Your teacher has already put three special things on your workplane: the SOCKET cutout (a square hole for the switch), the CAP cutout (a cross-shaped hole for the button), and a logo. The two cutouts are locked so they can't be resized — their sizes must stay EXACT or the switch won't fit. Move them, never stretch them.",
        }),

        block("heading", { text: "Part 1 — The Back Plate" }),
        block("text", {
          text: "Drag a Cylinder onto the workplane and set it to Width 50, Length 50, Height 4. Then open its shape panel and push Sides up to the maximum — that's what makes the circle smooth instead of chunky when it prints. Rename it 'Back Plate' (double-click the name in the shape panel). Naming parts is what real designers do — you're about to have six shapes on screen.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Back Plate screenshot",
          text: "Screenshot your Back Plate with the shape panel open — 50 × 50 × 4, sides maxed, renamed.",
        }),

        block("heading", { text: "Part 2 — The Front Frame" }),
        block("text", {
          text: "Select the Back Plate and press Ctrl+D (duplicate) — a perfect copy. Move the copy aside and rename it 'Front Frame'. Change its Height to 6. Now make its opening: drag in another cylinder, set it to 42 × 42 × 7, and switch it to HOLE. Select the Front Frame and the hole together, press L, and click the middle dots in both directions so the hole is dead-center. Then Ctrl+G — the hole cuts through and you have a ring.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Front Frame ring screenshot",
          text: "Screenshot your Front Frame from the top view — a clean ring with a 42 mm opening in the middle.",
        }),

        block("heading", { text: "Part 3 — The moving button" }),
        block("text", {
          text: "One more cylinder: 41 × 41 × 4.25, sides maxed. Rename it 'Clicker Button'. Notice: the button is 41 and the frame opening is 42. That missing millimeter is CLEARANCE — about half a millimeter of breathing room all the way around, so the button can move without jamming.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: the clearance question",
          text: "Press record and answer: The opening is 42 mm and the button is 41 mm. Why don't we just make them the same size? What would happen if we did?",
        }),

        block("heading", { text: "Part 4 — The click mechanism" }),
        block("text", {
          text: "Now the locked templates. SOCKET cutout: move it over the Back Plate, select both, press L, center it both ways, and check from the side view that it pokes all the way through the plate — then Ctrl+G to cut. CAP cutout: move it over the Clicker Button and center it the same way. Before grouping, set the Snap Grid (bottom-right) to 0.5 mm and raise the cutout 0.5 mm so it doesn't punch through the button's face. Check it from the side view, then Ctrl+G.",
        }),

        block("heading", { text: "Part 5 — Your logo" }),
        block("text", {
          text: "Move the logo over your Clicker Button. Hold Shift and resize from a corner so it doesn't stretch — keep it 30 mm or less, with space around the edge. Select logo + button, press L, center both ways. Then choose your style: ENGRAVED (switch the logo to Hole, height 0.5, lower it 0.5 into the face) or RAISED (keep it Solid, height about 1, sitting on top). Either way, finish with Ctrl+G.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Button with logo screenshot",
          text: "Screenshot your Clicker Button with the logo centered on it. Tell us in the caption: engraved or raised?",
        }),

        block("heading", { text: "Part 6 — The fit check" }),
        block("text", {
          text: "Move the Clicker Button into the Front Frame's opening, select both, press L and center — but DO NOT group them! Look closely: there should be a thin, even gap all the way around the button. If it touches anywhere, shrink the button a touch (41 → 40.5). Your three parts — Back Plate, Front Frame, Clicker Button — must stay separate forever: they print as three pieces and snap together with the real switch inside.",
        }),
        block("heading", { text: "Part 7 — Ready to print" }),
        block("text", {
          text: "Spread your three parts side by side, flat on the workplane — nothing floating, nothing overlapping. Check from the top, front, and side views: logo centered, cutouts centered, button smaller than the opening, templates never resized. This is the exact checklist a real manufacturer runs before hitting print.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Final layout screenshot",
          text: "Screenshot all three parts laid out flat, side by side, ready for printing. This is the money shot for your portfolio!",
        }),

        block("heading", { text: "You made it!" }),
        block("prompt", {
          text: "Final step of camp: a short written wrap-up of your two days. Then download your portfolio — and after printing, you'll snap the cap on the switch, drop the switch in the Back Plate, set the button, attach the frame… and CLICK.",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Back Plate screenshot",
            description: "50 × 50 × 4 cylinder, sides maxed, renamed Back Plate.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 0,
          },
          {
            label: "Front Frame ring screenshot",
            description: "The duplicated 6 mm frame with the centered 42 mm opening cut through.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 1,
          },
          {
            label: "Voice note: the clearance question",
            description:
              "Reinforcement question: why the 41 mm button needs a 42 mm opening (clearance).",
            checkType: "AUTO",
            requiresEvidenceType: "AUDIO",
            required: true,
            order: 2,
          },
          {
            label: "Button with logo screenshot",
            description: "The Clicker Button with a centered engraved or raised logo (≤ 30 mm).",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 3,
          },
          {
            label: "Final layout screenshot",
            description:
              "All three separate parts laid flat side by side, cutouts centered, ready to print.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 4,
          },
          {
            label: "Written wrap-up",
            description: "A short written reflection on the two days of camp.",
            checkType: "AUTO",
            required: true,
            order: 5,
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
  console.log('  Module 2 (Day 2): Clicky Fidget — 4 build screenshots + 1 audio question + wrap-up');
  console.log('  (Lightbot, Canva, and the bracket test run in the room — modules never gate on them.)');
  console.log('  ⚠️  Module 2 requires the teacher-supplied workplane: socket cutout, cap cutout, logo.');
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
