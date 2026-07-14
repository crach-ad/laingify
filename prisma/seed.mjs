import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Content blocks are a simple ordered list rendered by the learner UI.
const block = (type, props) => ({ type, ...props });

// Mock "figure" images for seeded evidence: small technical-drawing style SVGs
// (graphite background, lime line-work) encoded as data URLs, matching how the
// app stores photo evidence inline for the MVP.
function figure(kind, label) {
  const shapes = {
    cad: `<g stroke="#B6F24D" fill="none" stroke-width="2">
      <path d="M200 220 L320 160 L440 220 L320 280 Z"/>
      <path d="M200 220 L200 280 L320 340 L440 280 L440 220"/>
      <path d="M320 280 L320 340"/>
      <path d="M250 190 L250 130 L390 130 L390 190" stroke-dasharray="6 5"/>
    </g>
    <line x1="200" y1="360" x2="440" y2="360" stroke="#6b7280" stroke-dasharray="3 4"/>
    <text x="320" y="382" fill="#8a909b" font-family="monospace" font-size="13" text-anchor="middle">142 mm</text>`,
    part: `<g stroke="#B6F24D" fill="none" stroke-width="2">
      <rect x="220" y="170" width="200" height="120" rx="14"/>
      <rect x="250" y="200" width="60" height="60" rx="8"/>
      <rect x="330" y="200" width="60" height="60" rx="30"/>
    </g>
    <text x="320" y="330" fill="#8a909b" font-family="monospace" font-size="13" text-anchor="middle">PLA · 0.2 mm LAYERS · 15% INFILL</text>`,
    circuit: `<g stroke="#B6F24D" fill="none" stroke-width="2">
      <rect x="180" y="180" width="280" height="110" rx="10"/>
      <line x1="210" y1="180" x2="210" y2="140"/><line x1="260" y1="180" x2="260" y2="140"/>
      <line x1="310" y1="180" x2="310" y2="140"/><line x1="360" y1="180" x2="360" y2="140"/>
      <circle cx="210" cy="130" r="8"/><circle cx="260" cy="130" r="8"/>
      <rect x="295" y="112" width="30" height="20" rx="4"/><rect x="345" y="112" width="30" height="20" rx="4"/>
      <line x1="180" y1="235" x2="130" y2="235"/><line x1="460" y1="235" x2="510" y2="235"/>
    </g>
    <text x="320" y="330" fill="#8a909b" font-family="monospace" font-size="13" text-anchor="middle">UNO · HC-SR04 · SERVO ON PIN 9</text>`,
    vehicle: `<g stroke="#B6F24D" fill="none" stroke-width="2">
      <path d="M180 260 L220 220 L300 205 L400 205 L450 240 L460 260 Z"/>
      <rect x="250" y="175" width="110" height="35" rx="8"/>
      <circle cx="240" cy="270" r="24"/><circle cx="400" cy="270" r="24"/>
      <circle cx="240" cy="270" r="9"/><circle cx="400" cy="270" r="9"/>
      <line x1="300" y1="300" x2="340" y2="300" stroke-dasharray="4 4"/>
    </g>
    <text x="320" y="345" fill="#8a909b" font-family="monospace" font-size="13" text-anchor="middle">TWIN IR SENSORS · FRONT MOUNT</text>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <rect width="640" height="400" fill="#101216"/>
    <rect x="14" y="14" width="612" height="372" fill="none" stroke="rgba(255,255,255,0.12)"/>
    <text x="30" y="44" fill="#8a909b" font-family="monospace" font-size="13" letter-spacing="2">${label}</text>
    ${shapes[kind]}
  </svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

async function main() {
  console.log("Seeding Laing Learning — Product Design & Innovation…");

  // Wipe (dev only) for idempotent re-seeds.
  await prisma.message.deleteMany();
  await prisma.discussionThread.deleteMany();
  await prisma.autoFeedback.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.criterionStatus.deleteMany();
  await prisma.spriteInteraction.deleteMany();
  await prisma.project.deleteMany();
  await prisma.moduleProgress.deleteMany();
  await prisma.criterion.deleteMany();
  await prisma.classModule.deleteMany();
  await prisma.rosterEntry.deleteMany();
  await prisma.sprite.deleteMany();
  await prisma.module.deleteMany();
  await prisma.class.deleteMany();
  await prisma.learner.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.org.deleteMany();

  // ---- Org: the program --------------------------------------------------
  // A thirteen-week program taking girls from a blank sketch to a working,
  // programmed, 3D-printed product (per the program prospectus).
  const pdi = await prisma.org.create({
    data: { name: "Product Design & Innovation", context: "community" },
  });

  // ---- Modules: one per learning area, ending in the capstone -------------
  // 01 · DIGITAL — CAD & 3D modeling
  const cad = await prisma.module.create({
    data: {
      orgId: pdi.id,
      title: "Design in CAD",
      summary:
        "Sketch an idea, model it in TinkerCAD, then rebuild it parametrically in OnShape — dimensioned and ready for manufacture.",
      badgeName: "CAD Cadet",
      badgeIcon: "📐",
      badgeDescription: "Modeled and dimensioned a manufacturable part in CAD.",
      contentJson: JSON.stringify([
        block("heading", { text: "Design in CAD" }),
        block("text", {
          text: "Every product you own started as a sketch. Engineers turn sketches into CAD models — precise, dimensioned 3D geometry a machine can manufacture. This week you move from paper to TinkerCAD, then to OnShape, the same parametric CAD used in industry.",
        }),
        block("text", {
          text: "Step 1: Sketch your part on paper and mark the three dimensions that matter most. Step 2: Model it in TinkerCAD to get the shape right. Step 3: Rebuild it in OnShape with real dimensions and constraints. Step 4: Check wall thickness — nothing thinner than 2 mm if we're going to print it.",
        }),
        block("prompt", {
          text: "Upload a screenshot of your finished model, then explain the dimensions you chose and why the part can actually be printed.",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Screenshot of your CAD model",
            description: "Upload a clear screenshot or render of your model in TinkerCAD or OnShape.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 0,
          },
          {
            label: "Explain your dimensions",
            description:
              "Which dimensions did you fix first, and why? Mention at least one constraint that keeps the sketch from breaking.",
            checkType: "AUTO",
            required: true,
            order: 1,
          },
          {
            label: "Ready to manufacture (reviewed)",
            description:
              "Your instructor confirms the model is printable: wall thickness, overhangs, and tolerances all workable.",
            checkType: "RUBRIC",
            required: true,
            order: 2,
          },
        ],
      },
    },
    include: { criteria: { orderBy: { order: "asc" } } },
  });

  // 06 · PRODUCTION — lean manufacturing
  const print = await prisma.module.create({
    data: {
      orgId: pdi.id,
      title: "Print & Assemble",
      summary:
        "Manufacture your part on the 3D printer, finish it, and assemble it — then think like a factory: less material, same strength.",
      badgeName: "Maker",
      badgeIcon: "🖨️",
      badgeDescription: "Manufactured, finished, and quality-checked a 3D-printed part.",
      contentJson: JSON.stringify([
        block("heading", { text: "Print & Assemble" }),
        block("text", {
          text: "A CAD model is a promise; a printed part is proof. You'll slice your model, choose infill and layer height, and run it on the classroom printer. Then comes the part engineers call QC — quality control: does the real part match the drawing?",
        }),
        block("text", {
          text: "Step 1: Slice your model — start at 0.2 mm layers, 15% infill. Step 2: Print and watch the first layers; most failures happen there. Step 3: Remove supports and check critical dimensions with calipers. Step 4: Could you use less material and keep the strength? That's lean manufacturing.",
        }),
        block("prompt", {
          text: "Upload a photo of your printed part, then reflect: what would you change about material use or print settings on the next batch?",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Photo of your printed part",
            description: "A clear photo of the finished part, supports removed.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 0,
          },
          {
            label: "Reflect on material & quality",
            description:
              "What would you change — infill, orientation, layer height — to use less material or improve the surface?",
            checkType: "AUTO",
            required: true,
            order: 1,
          },
          {
            label: "Passes QC (reviewed)",
            description: "Your instructor measures the part against your drawing and confirms it's within tolerance.",
            checkType: "RUBRIC",
            required: true,
            order: 2,
          },
        ],
      },
    },
    include: { criteria: { orderBy: { order: "asc" } } },
  });

  // 02 · HARDWARE — programmable electronics
  const circuits = await prisma.module.create({
    data: {
      orgId: pdi.id,
      title: "Circuits & Sensors",
      summary:
        "Breadboard your first circuits, wire a distance sensor to an Arduino, and make something in the real world respond.",
      badgeName: "Circuit Starter",
      badgeIcon: "🔌",
      badgeDescription: "Built and explained a working sensor circuit on a breadboard.",
      contentJson: JSON.stringify([
        block("heading", { text: "Circuits & Sensors" }),
        block("text", {
          text: "Electronics is how your product senses and acts on the world. This week: current, voltage, and resistance on a breadboard — then an Arduino, an ultrasonic distance sensor, and an LED that reacts when something comes close.",
        }),
        block("text", {
          text: "Step 1: Build the LED circuit — don't forget the resistor. Step 2: Wire the HC-SR04 sensor: VCC, GND, TRIG, ECHO. Step 3: Load the starter sketch and open the serial monitor to watch live readings. Step 4: Make the LED come on under 20 cm.",
        }),
        block("prompt", {
          text: "Upload a photo of your breadboard, then explain how the sensor measures distance and what your circuit does with that reading.",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Photo of your breadboard",
            description: "A clear photo of the wired circuit — sensor, LED, and Arduino visible.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 0,
          },
          {
            label: "Explain your circuit",
            description:
              "How does the ultrasonic sensor measure distance? What happens in your circuit when the reading drops below the threshold?",
            checkType: "AUTO",
            required: true,
            order: 1,
          },
          {
            label: "Circuit works reliably (reviewed)",
            description:
              "Auto-checked from your explanation, then confirmed in person: the circuit responds correctly ten times in a row.",
            checkType: "HYBRID",
            required: true,
            order: 2,
          },
        ],
      },
    },
    include: { criteria: { orderBy: { order: "asc" } } },
  });

  // 03 · SOFTWARE — coding & logic
  const code = await prisma.module.create({
    data: {
      orgId: pdi.id,
      title: "Code the Machine",
      summary:
        "Move from MakeCode blocks to real C/C++ in the Arduino IDE — variables, loops, and functions that drive hardware.",
      badgeName: "Code Pilot",
      badgeIcon: "💻",
      badgeDescription: "Wrote and explained a C/C++ program that controls hardware.",
      contentJson: JSON.stringify([
        block("heading", { text: "Code the Machine" }),
        block("text", {
          text: "You've built the body; now write the brain. We start in MakeCode blocks so the logic is visible, then translate the same program into C/C++ in the Arduino IDE — the language professional firmware is written in.",
        }),
        block("text", {
          text: "Step 1: Build the logic in blocks: read sensor → decide → act. Step 2: Translate to C/C++ — declare variables, write the loop(), pull repeated code into a function. Step 3: Break it on purpose and read the error. Debugging is the real skill.",
        }),
        block("prompt", {
          text: "Paste your program as text evidence, then explain your variables and what happens on each pass through the loop.",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Paste your program",
            description: "Submit your working sketch as text evidence — comments welcome.",
            checkType: "AUTO",
            requiresEvidenceType: "TEXT",
            required: true,
            order: 0,
          },
          {
            label: "Explain variables & loops",
            description:
              "Name your key variables and walk through one full pass of loop(): what is read, what is decided, what acts?",
            checkType: "AUTO",
            required: true,
            order: 1,
          },
          {
            label: "Program responds to the sensor (reviewed)",
            description:
              "Auto-checked from your write-up, then confirmed live: changing the sensor input changes the behavior.",
            checkType: "HYBRID",
            required: true,
            order: 2,
          },
        ],
      },
    },
    include: { criteria: { orderBy: { order: "asc" } } },
  });

  // 05 · DATA — sensing & analysis
  const data = await prisma.module.create({
    data: {
      orgId: pdi.id,
      title: "Data Detectives",
      summary:
        "Collect real readings from your sensors, find the trend in beginner Python, and let the data argue for a design change.",
      badgeName: "Data Detective",
      badgeIcon: "📊",
      badgeDescription: "Collected sensor data and used the trend to justify a design change.",
      contentJson: JSON.stringify([
        block("heading", { text: "Data Detectives" }),
        block("text", {
          text: "Engineers don't guess — they measure. Your circuit already produces a stream of numbers. This week you capture them, plot them in beginner Python, and ask: what is the data telling me to change?",
        }),
        block("text", {
          text: "Step 1: Log 30 seconds of sensor readings from the serial monitor. Step 2: Paste them into the Python notebook and plot. Step 3: Find the pattern — noise, drift, a threshold that's too tight. Step 4: Propose one design change the data supports.",
        }),
        block("prompt", {
          text: "Log your readings as text evidence, then describe the trend you found and the design change it justifies.",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Log your readings",
            description: "Paste your captured sensor data (or a summary table) as text evidence.",
            checkType: "AUTO",
            requiresEvidenceType: "TEXT",
            required: true,
            order: 0,
          },
          {
            label: "Describe the trend",
            description: "What pattern did you find, and what might explain it?",
            checkType: "AUTO",
            required: true,
            order: 1,
          },
          {
            label: "Analysis drives a design change (reviewed)",
            description: "Your instructor confirms the proposed change genuinely follows from the data.",
            checkType: "RUBRIC",
            required: true,
            order: 2,
          },
        ],
      },
    },
    include: { criteria: { orderBy: { order: "asc" } } },
  });

  // CAPSTONE — the full pipeline in one product (prospectus sample project)
  const capstone = await prisma.module.create({
    data: {
      orgId: pdi.id,
      title: "Capstone: Line-Following Vehicle",
      summary:
        "The full pipeline in one product: CAD a chassis, print it, wire twin IR sensors, program the follow logic, and race the clock.",
      badgeName: "Road Ready",
      badgeIcon: "🚗",
      badgeDescription: "Designed, built, programmed, and tuned a working line-following vehicle.",
      contentJson: JSON.stringify([
        block("heading", { text: "Capstone: Line-Following Vehicle" }),
        block("text", {
          text: "Everything comes together. You'll design a chassis in CAD with mounts for two IR sensors, print and assemble it, wire the electronics, and write the logic that keeps it on the line: if the left sensor loses the edge, turn right; if the right loses it, turn left; otherwise drive.",
        }),
        block("text", {
          text: "Then you tune. Run timed laps, log each trial, and change one thing at a time — threshold, speed, sensor spacing. Your lap table is your evidence that engineering iteration works.",
        }),
        block("prompt", {
          text: "Upload a photo of your finished vehicle, log your lap times as text evidence, and explain how your code decides when to turn.",
        }),
      ]),
      criteria: {
        create: [
          {
            label: "Photo of your finished vehicle",
            description: "The assembled vehicle — chassis, sensors, and wiring visible.",
            checkType: "AUTO",
            requiresEvidenceType: "PHOTO",
            required: true,
            order: 0,
          },
          {
            label: "Lap-time trials",
            description: "Log at least three timed laps as text evidence, noting what you changed between trials.",
            checkType: "AUTO",
            requiresEvidenceType: "TEXT",
            required: true,
            order: 1,
          },
          {
            label: "How does your code decide to turn?",
            description: "Walk through your follow loop: the readings, the threshold, and the action each case triggers.",
            checkType: "AUTO",
            required: true,
            order: 2,
          },
          {
            label: "Vehicle completes the course (reviewed)",
            description: "Your instructor watches a full clean lap — no hands, no derail.",
            checkType: "RUBRIC",
            required: true,
            order: 3,
          },
        ],
      },
    },
    include: { criteria: { orderBy: { order: "asc" } } },
  });

  const modules = [cad, print, circuits, code, data, capstone];

  // ---- Cohorts -------------------------------------------------------------
  const cohort1 = await prisma.class.create({
    data: {
      orgId: pdi.id,
      name: "Cohort 01 · Autumn",
      classCode: "PDI-C1",
      band: "TEEN",
      minAuthTier: 1,
      modules: { create: modules.map((m, i) => ({ moduleId: m.id, order: i })) },
    },
  });
  const cohort2 = await prisma.class.create({
    data: {
      orgId: pdi.id,
      name: "Cohort 02 · Spring",
      classCode: "PDI-C2",
      band: "TEEN",
      minAuthTier: 1,
      modules: { create: modules.map((m, i) => ({ moduleId: m.id, order: i })) },
    },
  });

  // ---- Learners --------------------------------------------------------------
  const girl = (displayName, sprite) =>
    prisma.learner.create({
      data: {
        displayName,
        band: "TEEN",
        pin: "1234",
        ...(sprite ? { sprite: { create: sprite } } : {}),
      },
    });

  // Cohort 01 — mid-semester, varied progress.
  const ada = await girl("Ada", { name: "Volt", personality: "curious", color: "#B6F24D", avatar: "⚡" });
  const priya = await girl("Priya", { name: "Gizmo", personality: "playful", color: "#6EA8FF", avatar: "🤖" });
  const amara = await girl("Amara");
  const zoe = await girl("Zoe");
  const lucia = await girl("Lucía");
  const mei = await girl("Mei");
  const nia = await girl("Nia");
  const sofia = await girl("Sofia");
  const fatima = await girl("Fatima");
  const imani = await girl("Imani");
  const grace = await girl("Grace");
  const hana = await girl("Hana");
  const cohort1Girls = [ada, priya, amara, zoe, lucia, mei, nia, sofia, fatima, imani, grace, hana];
  await prisma.rosterEntry.createMany({
    data: cohort1Girls.map((l) => ({ classId: cohort1.id, learnerId: l.id })),
  });

  // Cohort 02 — fresh spring intake, no work yet.
  const cohort2Girls = [];
  for (const name of ["Layla", "Rosa", "Aaliyah", "Elif", "Noor", "Carmen", "Tess", "Yuki"]) {
    cohort2Girls.push(await girl(name));
  }
  await prisma.rosterEntry.createMany({
    data: cohort2Girls.map((l) => ({ classId: cohort2.id, learnerId: l.id })),
  });

  // ---- Instructor -------------------------------------------------------------
  await prisma.instructor.create({
    data: { displayName: "Ms. Rivera", email: "rivera@pdi.org", pin: "4321", orgId: pdi.id },
  });

  // ---- Seeded work & progress --------------------------------------------------
  const met = (learnerId, criterionId, decidedBy = "system") =>
    prisma.criterionStatus.create({ data: { learnerId, criterionId, status: "MET", decidedBy } });
  const inProgress = (learnerId, criterionId, decidedBy = "system") =>
    prisma.criterionStatus.create({ data: { learnerId, criterionId, status: "IN_PROGRESS", decidedBy } });
  const progress = (learnerId, moduleId, status, timeOnTaskSeconds) =>
    prisma.moduleProgress.create({
      data: {
        learnerId,
        moduleId,
        status,
        timeOnTaskSeconds,
        ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    });

  // A module fully completed earlier in the term: all criteria met, project
  // assembled, badge on the dashboard. Mirrors what assembleProjectIfComplete
  // produces at runtime.
  async function completed(learner, module, summary, evidenceRows) {
    const evidence = [];
    for (const row of evidenceRows) {
      evidence.push(await prisma.evidence.create({ data: { learnerId: learner.id, moduleId: module.id, ...row } }));
    }
    for (const c of module.criteria) {
      await met(learner.id, c.id, c.checkType === "AUTO" ? "system" : "instructor");
    }
    await progress(learner.id, module.id, "COMPLETED", 4200 + Math.floor(module.title.length * 60));
    await prisma.project.create({
      data: {
        learnerId: learner.id,
        moduleId: module.id,
        summary,
        evidenceJson: JSON.stringify(evidence.map((e) => e.id)),
      },
    });
  }

  const submissionWithFeedback = async (learner, module, content, fb) => {
    const s = await prisma.submission.create({
      data: { learnerId: learner.id, moduleId: module.id, content },
    });
    await prisma.autoFeedback.create({
      data: {
        submissionId: s.id,
        summary: fb.summary,
        metJson: JSON.stringify(fb.metIds),
        missingJson: JSON.stringify(fb.missingIds ?? []),
        nextSteps: fb.nextSteps ?? "",
      },
    });
  };

  // --- Ada: the demo learner. Two badges earned; Circuits & Sensors awaiting
  // instructor confirmation (HYBRID) — approve it live to award badge three.
  await completed(
    ada,
    cad,
    "Ada completed \"Design in CAD\" and earned the CAD Cadet badge. She modeled a two-piece sensor enclosure in OnShape, fully dimensioned with a constrained base sketch, and confirmed 2 mm minimum walls for printing.",
    [
      {
        type: "PHOTO",
        url: figure("cad", "FIG. 01 — SENSOR ENCLOSURE · CAD ISO"),
        caption: "Sensor enclosure in OnShape — base sketch fully constrained",
      },
    ],
  );
  await completed(
    ada,
    print,
    "Ada completed \"Print & Assemble\" and earned the Maker badge. Her enclosure printed within tolerance on the second attempt after she reoriented the part to remove supports, cutting material use by a fifth.",
    [
      {
        type: "PHOTO",
        url: figure("part", "FIG. 02 — PRINTED ENCLOSURE · TOP"),
        caption: "Second print — reoriented 90° so the lid needs no supports",
      },
    ],
  );
  await progress(ada.id, circuits.id, "IN_PROGRESS", 3100);
  await prisma.evidence.create({
    data: {
      learnerId: ada.id,
      moduleId: circuits.id,
      type: "PHOTO",
      url: figure("circuit", "FIG. 03 — BREADBOARD · UNO + HC-SR04"),
      caption: "Distance sensor wired to the Uno, LED on pin 13",
    },
  });
  await met(ada.id, circuits.criteria[0].id); // photo evidence criterion
  await submissionWithFeedback(
    ada,
    circuits,
    "The HC-SR04 sends out an ultrasonic ping from one speaker and listens for the echo with the other. Distance = time for the echo to come back × speed of sound ÷ 2 (it travels there and back). My sketch reads that distance every 100 ms, and when it drops below 20 cm it sets pin 13 HIGH so the LED turns on. One problem: the LED flickers when my servo runs at the same time.",
    {
      summary:
        "Brilliant explanation, Ada — you've got the physics (halving the round trip!) and the logic exactly right.",
      metIds: [circuits.criteria[1].id, circuits.criteria[2].id],
      nextSteps:
        "That flicker is a real engineering clue — think about what the servo and LED share. Ask your instructor about decoupling at Saturday's session.",
    },
  );
  await met(ada.id, circuits.criteria[1].id);
  await inProgress(ada.id, circuits.criteria[2].id); // HYBRID: pre-screen passed, awaiting Ms. Rivera
  const adaThread = await prisma.discussionThread.create({
    data: {
      learnerId: ada.id,
      moduleId: circuits.id,
      seed: "My LED flickers when the servo runs at the same time.",
    },
  });
  for (const m of [
    { authorRole: "LEARNER", body: "My LED flickers whenever the servo moves. The wiring looks right — why would that happen?" },
    {
      authorRole: "SPRITE",
      body: "Great observation, Ada! ⚡ Here's a clue instead of an answer: the servo and the LED are drinking from the same cup. What happens to everyone else at the table when one guest gulps? Look at what the two circuits share.",
    },
    {
      authorRole: "LEARNER",
      body: "Ohh — they share the 5V rail! So when the servo draws a lot of current the voltage dips and the LED browns out?",
    },
    {
      authorRole: "INSTRUCTOR",
      body: "Exactly right, Ada. That dip is called voltage sag. Bring your board on Saturday — we'll add a capacitor across the rail (decoupling) and you can watch the flicker disappear on the scope.",
    },
  ]) {
    await prisma.message.create({ data: { threadId: adaThread.id, ...m } });
  }

  // --- Priya: CAD done; deep in the capstone with the exact portfolio artifact
  // from the prospectus (lap-time trials) — RUBRIC lap check in the queue.
  await completed(
    priya,
    cad,
    "Priya completed \"Design in CAD\" and earned the CAD Cadet badge. She modeled a vehicle chassis with twin front IR sensor mounts, dimensioned at 142 mm wheelbase.",
    [
      {
        type: "PHOTO",
        url: figure("cad", "FIG. 01 — CHASSIS · CAD ISO · 142 MM"),
        caption: "Chassis with twin IR mounts — 142 mm wheelbase",
      },
    ],
  );
  await progress(priya.id, capstone.id, "IN_PROGRESS", 9800);
  await prisma.evidence.create({
    data: {
      learnerId: priya.id,
      moduleId: capstone.id,
      type: "PHOTO",
      url: figure("vehicle", "FIG. 04.A — LINE FOLLOWER · ASSEMBLED"),
      caption: "Assembled and wired — twin IR sensors front-mounted",
    },
  });
  await prisma.evidence.create({
    data: {
      learnerId: priya.id,
      moduleId: capstone.id,
      type: "TEXT",
      text:
        "TRIAL LAPS — one change per trial\n" +
        "Trial 01 — 42.4 s (baseline)\n" +
        "Trial 02 — 38.1 s (−4.3) raised threshold 350→420, fewer false turns\n" +
        "Trial 03 — 35.0 s (−3.1) narrowed sensor spacing 4 mm\n" +
        "Trial 04 — 33.2 s (−1.8) speed 160→180 on straights only",
      caption: "Lap log — every trial changed exactly one variable",
    },
  });
  await met(priya.id, capstone.criteria[0].id);
  await met(priya.id, capstone.criteria[1].id);
  await submissionWithFeedback(
    priya,
    capstone,
    "My loop reads both IR sensors with analogRead. White floor reflects a lot (high value), the black line absorbs (low). If the left sensor drops below my threshold (420) the car is drifting left over the line, so I turn right. If the right drops, I turn left. Otherwise drive straight. I log millis() and both readings every loop so I can tune the threshold from real data instead of guessing.",
    {
      summary:
        "Priya, this is textbook engineering iteration — one variable per trial and nine seconds off your lap time.",
      metIds: [capstone.criteria[2].id],
      nextSteps: "You're ready for the course check — show Ms. Rivera a clean lap on Saturday.",
    },
  );
  await met(priya.id, capstone.criteria[2].id);
  // RUBRIC course check: not yet decided → sits in the review queue.
  const priyaThread = await prisma.discussionThread.create({
    data: {
      learnerId: priya.id,
      moduleId: capstone.id,
      seed: "Trial 04 gained less than trial 02 — diminishing returns?",
    },
  });
  for (const m of [
    {
      authorRole: "LEARNER",
      body: "Each change helps less than the one before — trial 02 saved 4.3 s but trial 04 only 1.8 s. Is that normal or am I running out of ideas?",
    },
    {
      authorRole: "SPRITE",
      body: "You've spotted something real engineers graph all the time, Priya! 🤖 Instead of an answer, a question: which part of the lap is your car slowest at now? Watch one lap and only look at the corners. Where does the time actually live?",
    },
  ]) {
    await prisma.message.create({ data: { threadId: priyaThread.id, ...m } });
  }

  // --- Amara: Maker badge in progress — QC review pending.
  await completed(
    amara,
    cad,
    "Amara completed \"Design in CAD\" and earned the CAD Cadet badge. She modeled a phone stand with a parametric angle she can regenerate for any device.",
    [
      {
        type: "PHOTO",
        url: figure("cad", "FIG. 01 — PHONE STAND · CAD ISO"),
        caption: "Parametric phone stand — angle driven by one variable",
      },
    ],
  );
  await progress(amara.id, print.id, "IN_PROGRESS", 2600);
  await prisma.evidence.create({
    data: {
      learnerId: amara.id,
      moduleId: print.id,
      type: "PHOTO",
      url: figure("part", "FIG. 02 — PHONE STAND · FIRST PRINT"),
      caption: "First print at 15% infill — slight lift on the back corner",
    },
  });
  await met(amara.id, print.criteria[0].id);
  await submissionWithFeedback(
    amara,
    print,
    "My first print lifted at one corner because the bed was cold on that side. Next batch I'd add a brim and rotate the part 45° so the long edge isn't against the door draft. I'd also drop infill from 15% to 10% — the stand only takes compression, so I think it keeps its strength. I want to test that though, not just assume it.",
    {
      summary: "Great diagnosis, Amara — and 'test it, don't assume it' is exactly the mindset of this program.",
      metIds: [print.criteria[1].id],
      nextSteps: "Bring the lifted print to QC too — failed parts teach the most.",
    },
  );
  await met(amara.id, print.criteria[1].id);
  // RUBRIC QC pending → queue.

  // --- Zoe: just started CAD — photo up, write-up still thin.
  await progress(zoe.id, cad.id, "IN_PROGRESS", 900);
  await prisma.evidence.create({
    data: {
      learnerId: zoe.id,
      moduleId: cad.id,
      type: "PHOTO",
      url: figure("cad", "FIG. 01 — KEYRING TAG · TINKERCAD"),
      caption: "First model — keyring tag in TinkerCAD",
    },
  });
  await met(zoe.id, cad.criteria[0].id);
  await submissionWithFeedback(zoe, cad, "I made it 40 mm long because that felt right.", {
    summary: "A solid start, Zoe — your tag is modeled and uploaded, which is the hard first step.",
    metIds: [],
    missingIds: [cad.criteria[1].id],
    nextSteps:
      "Tell us more about the decisions: why 40 mm? What did you constrain so the shape can't accidentally stretch? Two or three sentences is plenty.",
  });
  await inProgress(zoe.id, cad.criteria[1].id);

  // --- Lucía: circuits underway — second HYBRID confirmation in the queue.
  await completed(
    lucia,
    cad,
    "Lucía completed \"Design in CAD\" and earned the CAD Cadet badge. She modeled a cable tidy in OnShape with a fully constrained profile sketch.",
    [
      {
        type: "PHOTO",
        url: figure("cad", "FIG. 01 — CABLE TIDY · CAD ISO"),
        caption: "Cable tidy — profile sketch fully constrained",
      },
    ],
  );
  await progress(lucia.id, circuits.id, "IN_PROGRESS", 2400);
  await prisma.evidence.create({
    data: {
      learnerId: lucia.id,
      moduleId: circuits.id,
      type: "PHOTO",
      url: figure("circuit", "FIG. 03 — BREADBOARD · LIGHT SENSOR"),
      caption: "Photoresistor divider driving the LED threshold",
    },
  });
  await met(lucia.id, circuits.criteria[0].id);
  await submissionWithFeedback(
    lucia,
    circuits,
    "I used a photoresistor instead of the distance sensor. It forms a voltage divider with a 10k resistor, so when the light drops, the voltage at A0 rises. My sketch reads A0 and turns the LED on above 600 — an automatic night light. It works every time I cover the sensor.",
    {
      summary: "Lucía, swapping in a different sensor and still nailing the divider logic shows real understanding.",
      metIds: [circuits.criteria[1].id, circuits.criteria[2].id],
      nextSteps: "Show Ms. Rivera the ten-in-a-row test to lock in the reviewed criterion.",
    },
  );
  await met(lucia.id, circuits.criteria[1].id);
  await inProgress(lucia.id, circuits.criteria[2].id); // HYBRID awaiting confirmation

  // --- Mei, Nia, Sofia: CAD badge earned, next module not yet started.
  await completed(
    mei,
    cad,
    "Mei completed \"Design in CAD\" and earned the CAD Cadet badge. She modeled a planter with a drainage lattice generated by a linear pattern.",
    [{ type: "PHOTO", url: figure("cad", "FIG. 01 — PLANTER · CAD ISO"), caption: "Planter with patterned drainage lattice" }],
  );
  await completed(
    nia,
    cad,
    "Nia completed \"Design in CAD\" and earned the CAD Cadet badge. She modeled a headphone hook dimensioned to her desk edge with a 2.5 mm wall.",
    [{ type: "PHOTO", url: figure("cad", "FIG. 01 — DESK HOOK · CAD ISO"), caption: "Desk hook — 2.5 mm walls throughout" }],
  );
  await completed(
    sofia,
    cad,
    "Sofia completed \"Design in CAD\" and earned the CAD Cadet badge. She modeled a two-part dice tower with aligned pin joints.",
    [{ type: "PHOTO", url: figure("cad", "FIG. 01 — DICE TOWER · CAD ISO"), caption: "Two-part dice tower with pin joints" }],
  );

  // Fatima, Imani, Grace, Hana — enrolled, not started (0% on the roster view).

  console.log("Seed complete — Product Design & Innovation (13-week program).");
  console.log("");
  console.log("  Cohort 01 · Autumn  code PDI-C1 (learner PIN 1234)");
  console.log("    Ada    — 2 badges, Circuits & Sensors awaiting instructor ✓ (demo approve → 3rd badge)");
  console.log("    Priya  — capstone lap-check in queue (lap-time trials mirror the prospectus)");
  console.log("    Amara  — Print & Assemble QC in queue · Zoe — early CAD work · Lucía — circuit check in queue");
  console.log("    Mei/Nia/Sofia — CAD badge earned · Fatima/Imani/Grace/Hana — not started");
  console.log("  Cohort 02 · Spring  code PDI-C2 — fresh intake, no work yet");
  console.log("");
  console.log("  Instructor: rivera@pdi.org / PIN 4321  →  /instruct (5 items in the review queue)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
