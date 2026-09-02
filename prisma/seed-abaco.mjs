// Abaco Future Ready Academy STEM & AI Camp — learner-ready seed.
// Built from the Volunteer & Instructor Playbook v1.0 (the outline), expanded
// into step-by-step tutorials a student can follow on their own device:
// exact clicks, exact measurements, real code, concrete missions.
//
// Six modules matching the weekly learning journey:
//   1 Foundations of Coding      → interactive programs
//   2 CAD & Manufacturing        → 3D-printed object
//   3 Programmable Electronics   → working Arduino project
//   4 VR & AR                    → immersive experience
//   5 AI & Digital Safety        → AI-assisted project
//   6 Final Showcase             → Shark Tank presentation
//
// ONLY touches the Abaco org (and removes the retired "Winners Camp" org on
// first run) — the PDI demo org is left alone.
//
// Two modes:
//   npm run seed:abaco      — full reset. ⚠️  DELETES all student work. Never mid-camp.
//   npm run content:update  — SAFE content update: modules are upserted in place
//                             (matched by title), learners and their work untouched.
//                             Renaming a module's title creates a NEW module —
//                             keep titles stable once camp starts.

import { PrismaClient } from "@prisma/client";
import { wipeOrg } from "./org-wipe.mjs";
import { createKnexModules } from "./knex-modules.mjs";
import { createRodocodoModule, createComputeItModule } from "./coding-modules.mjs";
import {
  block,
  wrapUpPrompt,
  wrapUpCriterion,
  photoCriterion,
  audioCriterion,
  moduleWriter,
  syncClassModules,
  checkCheckpoints,
} from "./seed-lib.mjs";

const prisma = new PrismaClient();

const INSTRUCTOR = {
  displayName: "Coach Crachad",
  email: "crachad.laing@gmail.com",
  pin: "4321",
};

const ORG_NAME = "Abaco Future Ready Academy";
const CLASS_NAME = "STEM & AI Camp";
const CLASS_CODE = "FUTURE";

// Safe content-update mode: upsert modules in place, never touch learners.
const UPDATE = process.argv.includes("--update");

// Compile an Arduino sketch to AVR hex via Wokwi's free build service (the
// real arduino-cli toolchain). Runs once per sketch at seed time, so learners'
// browsers only ever load the finished hex — no runtime compile dependency.
async function compileHex(sketch) {
  const res = await fetch("https://hexi.wokwi.com/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sketch }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.hex) {
    throw new Error(
      "Arduino sketch failed to compile via hexi.wokwi.com:\n" +
        (data.stderr || data.stdout || `HTTP ${res.status}`),
    );
  }
  return data.hex;
}


async function main() {
  let org;
  if (UPDATE) {
    org = await prisma.org.findFirst({ where: { name: ORG_NAME } });
    if (!org) throw new Error("Org not found — run the full seed once first: npm run seed:abaco");
    console.log("Content-update mode: upserting modules in place — learners and their work are untouched.");
  } else {
    console.log("Seeding Abaco Future Ready Academy (org-scoped — other orgs untouched)…");
    await wipeOrg(prisma, "Winners Camp"); // retire the old camp org + its users
    await wipeOrg(prisma, ORG_NAME);
    org = await prisma.org.create({
      data: { name: ORG_NAME, context: "community" },
    });
  }

  // Create (full seed) or upsert-by-title (content update) — see seed-lib.mjs.
  const createModule = moduleWriter(prisma, org, UPDATE);

  // ==========================================================================
  // MODULE 1 — Foundations of Coding
  // Spine: a complete Scratch chase game, block by block. Intermediate and
  // advanced tracks get their own concrete steps at each stage.
  // ==========================================================================
  const module1 = await createModule({
      orgId: org.id,
      topic: "Foundations of Coding",
      title: "Build Your First Game",
      summary:
        "Build a real game today: a chase game in Scratch — or a webpage, or Swift — using events, loops, and variables like a real programmer.",
      badgeName: "Code Explorer",
      badgeIcon: "💻",
      badgeDescription:
        "Built and extended an interactive program using algorithms, sequencing, events, and loops.",
      // v2 flow: short cards, tappable action checklists, tip/warn callouts,
      // and track-tagged blocks — the tutorial reshapes itself per learner.
      contentJson: JSON.stringify([
        block("heading", { text: "You're a programmer today" }),
        block("text", {
          kind: "learn",
          minutes: 2,
          text: "Every app and game you've ever used is just instructions a computer follows — exact instructions, in exact order. Today you write your own.\n\nBy the end of this module you'll have built a real GAME: steer a character with the arrow keys, chase something that keeps escaping, rack up a live score.",
          tip: "You'll use the four big ideas behind ALL software — events, sequencing, loops, and variables — without even noticing.",
        }),

        block("heading", { text: "Pick your track" }),
        block("trackpick", {
          text: "Three tracks, one room. Pick the one that fits you — not sure? Start Beginner, you can level up this afternoon.",
        }),

        // ---- Step 1: set the stage -----------------------------------------
        block("heading", { text: "Step 1 — Set the stage" }),
        block("text", {
          track: "beginner",
          kind: "build",
          minutes: 5,
          text: "Build your game world:",
          actions: [
            "Go to scratch.mit.edu and click Create — you'll see the cat and an empty stage",
            "Bottom-right: click Choose a Backdrop and pick one you like",
            "Hover Choose a Sprite → magnifying glass → add something catchable (Star, Butterfly, Crab…)",
            "Drag the two sprites apart so they're not touching",
          ],
          tip: "Two sprites and a backdrop — that's a game world. Everything else is behavior.",
        }),
        block("text", {
          track: "intermediate",
          kind: "build",
          minutes: 5,
          text: "Set up your page:",
          actions: [
            "Open codepen.io and click Start Coding (no account needed)",
            "In the HTML panel type: <h1>Catch the Star</h1>",
            "Add the star: <button id=\"star\">⭐</button>",
            "Add the score line: <p>Score: <span id=\"score\">0</span></p>",
          ],
          tip: "The id attributes are handles — your JavaScript will grab the star and the score by name.",
        }),
        block("text", {
          track: "advanced",
          kind: "build",
          minutes: 5,
          text: "Boot up the real thing:",
          actions: [
            "Open the Swift Playgrounds app → 'Get Started with Code'",
            "Complete the Commands page — moveForward(), turnLeft(), collectGem()",
            "Complete the Functions page — bundle commands into your own function",
          ],
          tip: "Swift is the language iPhone apps are written in. These puzzles are the same thinking as Scratch — in professional syntax.",
        }),

        // ---- Step 2: events ------------------------------------------------
        block("heading", { text: "Step 2 — Events: make it respond" }),
        block("text", {
          track: "beginner",
          kind: "learn",
          minutes: 8,
          text: "An EVENT is 'WHEN this happens, DO that'. Every game is a pile of events. Give your CAT arrow-key controls:",
          actions: [
            "Click the CAT, then the Code tab",
            "Events drawer (yellow): drag out 'when [space] key pressed' — change space to right arrow",
            "Motion drawer (blue): snap on 'point in direction 90', then 'move 10 steps'",
            "Make three more stacks: left arrow → -90 · up arrow → 0 · down arrow → 180",
            "Test it — click the stage and press the arrows!",
          ],
        }),
        block("scratch", {
          track: "beginner",
          text: "when [right arrow v] key pressed\npoint in direction (90)\nmove (10) steps",
          tip: "Cat flips upside down going left? Click the sprite's Direction and choose the left-right arrows icon.",
        }),
        block("text", {
          track: "intermediate",
          kind: "learn",
          minutes: 8,
          text: "An EVENT is 'WHEN this happens, DO that'. In the browser, events are handlers. Type this in the JS panel:",
        }),
        block("code", {
          track: "intermediate",
          text: "document.getElementById(\"star\").onclick = function () {\n  alert(\"Caught me? Not yet!\");\n};",
          tip: "Click the button. That function you wrote? It's an event handler — the same idea as Scratch's 'when clicked' hat blocks.",
        }),
        block("text", {
          track: "advanced",
          kind: "learn",
          minutes: 8,
          text: "Work through the For Loops page.",
          actions: [
            "Complete the For Loops puzzles",
            "Read one of your solutions out loud — 'for i in 1...4' is Scratch's 'repeat 4' in real syntax",
          ],
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Program running screenshot",
          text: "Screenshot your program running — your code visible if you can. This is proof the computer is following YOUR instructions.",
        }),

        // ---- Step 3: loops -------------------------------------------------
        block("heading", { text: "Step 3 — Loops: the chase begins" }),
        block("text", {
          track: "beginner",
          kind: "build",
          minutes: 6,
          text: "A LOOP repeats instructions so you don't have to — 'forever' is the heartbeat of every game. Make the star run away:",
          actions: [
            "Click your STAR sprite — its code is separate from the cat's!",
            "Events: 'when green flag clicked'",
            "Control drawer (orange): snap a 'forever' block under it",
            "Motion: put 'glide 1 secs to random position' INSIDE the forever",
            "Click the green flag and try to catch it!",
          ],
        }),
        block("scratch", {
          track: "beginner",
          text: "when green flag clicked\nforever\nglide (1) secs to (random position v)\nend",
          tip: "Too hard? Change 1 sec to 2. Too easy? 0.5. That number is game balancing — real designers tune it for days.",
        }),
        block("text", {
          track: "intermediate",
          kind: "build",
          minutes: 6,
          text: "A LOOP repeats instructions so you don't have to. Make the star teleport away every second:",
        }),
        block("code", {
          track: "intermediate",
          text: "const star = document.getElementById(\"star\");\nsetInterval(function () {\n  star.style.position = \"absolute\";\n  star.style.left = Math.random() * 300 + \"px\";\n  star.style.top = Math.random() * 300 + 100 + \"px\";\n}, 1000);",
          tip: "setInterval IS a loop — it runs your function every 1000 milliseconds, forever. Try 500. Try 200. Now it's a game.",
        }),
        block("text", {
          track: "advanced",
          kind: "build",
          minutes: 6,
          text: "Work through the While Loops page — 'keep going UNTIL something changes'.",
          actions: [
            "Complete the While Loops puzzles",
            "Spot the difference: for-loops repeat a known number of times, while-loops repeat until a condition flips",
          ],
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: explain a loop",
          text: "Press record and answer in your own words: What is a loop, and where does YOUR game use one? What would you have to do if loops didn't exist?",
        }),

        // ---- Step 4: variables ---------------------------------------------
        block("heading", { text: "Step 4 — Variables: keep score" }),
        block("text", {
          track: "beginner",
          kind: "build",
          minutes: 8,
          text: "A VARIABLE is a named box that stores a number that can change — score, lives, speed. Wire up scoring on the STAR sprite:",
          actions: [
            "Variables drawer (orange): Make a Variable → name it 'score'",
            "Build the script below — the 'touching' block lives in light-blue Sensing",
            "Play it! Every catch: +1, a pop, and the star escapes",
          ],
        }),
        block("scratch", {
          track: "beginner",
          text: "when green flag clicked\nset [score v] to (0)\nforever\nif <touching (Cat v)?> then\nchange [score v] by (1)\nstart sound (Pop v)\ngo to (random position v)\nend\nend",
          tip: "Look at what you just wrote: a loop, checking a condition, updating a variable. That's real game logic — the same shape as any video game ever made.",
        }),
        block("text", {
          track: "intermediate",
          kind: "build",
          minutes: 8,
          text: "A VARIABLE is a named box storing a value that changes. Add scoring:",
        }),
        block("code", {
          track: "intermediate",
          text: "let score = 0;\nstar.onclick = function () {\n  score = score + 1;\n  document.getElementById(\"score\").textContent = score;\n};",
          tip: "Two things happen on every click: the variable changes, then the page shows the new value. State → display. Every app you use works this way.",
        }),
        block("text", {
          track: "advanced",
          kind: "build",
          minutes: 8,
          text: "Work through the Variables page.",
          actions: [
            "Complete the Variables puzzles",
            "Keep a running gem count as you solve — you're doing state management",
          ],
        }),

        // ---- Step 5: extend -------------------------------------------------
        block("heading", { text: "Step 5 — Make it YOURS" }),
        block("text", {
          kind: "create",
          minutes: 15,
          text: "Creativity over correctness. Add at least ONE feature nobody told you exactly how to build — pick something slightly too hard:\n\n• A 30-second timer (hint: a 'time' variable, minus 1 every second, 'stop all' at 0)\n• A second escaping sprite worth 5 points\n• A speed boost — the star moves faster every 5 points\n• Sound and costume effects on every catch\n• Web track: the star SHRINKS every catch, or dodges AWAY from your mouse\n• Swift track: finish Conditional Code and use if/else in a puzzle",
          warn: "It WILL break at some point — that's the plan. Ask the two debugging questions: 'What did I expect this to do?' and 'What happened instead?' The gap between those answers is where the bug lives.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Extended feature screenshot",
          text: "Screenshot your game showing the feature YOU added — code visible if you can. In the caption, say what you added.",
        }),

        block("heading", { text: "Reflect & share" }),
        wrapUpPrompt("Include which track you chose and the one bug that taught you the most."),
      ]),
      criteria: {
        create: [
          photoCriterion(0, "Program running screenshot", "The game running with working event-driven controls (or the track equivalent)."),
          audioCriterion(1, "Voice note: explain a loop", "Reinforcement: what a loop is and where their program uses one."),
          photoCriterion(2, "Extended feature screenshot", "The program with one self-chosen feature added (timer, second sprite, speed-up…)."),
          wrapUpCriterion(3, "Written reflection: what worked, what challenged you, what you'd improve."),
        ],
      },
  });

  // ==========================================================================
  // MODULE 2 — Computer-Aided Design & Manufacturing
  // Spine: skill-builder keychain with exact measurements (proven at camp),
  // then apply the same skills to a chosen product.
  // ==========================================================================
  const module2 = await createModule({
      orgId: org.id,
      topic: "CAD & Manufacturing",
      title: "Design a 3D-Printable Product",
      summary:
        "Learn real CAD moves in Tinkercad with exact measurements, then design your own printable product — keychain, fidget, phone stand, or a hurricane-resilience tool.",
      badgeName: "Product Designer",
      badgeIcon: "🧊",
      badgeDescription:
        "Designed a 3D-printable product in CAD using shapes, alignment, grouping, holes, and real measurements.",
      contentJson: JSON.stringify([
        block("heading", { text: "From idea to object" }),
        block("text", {
          kind: "learn",
          minutes: 2,
          text: "Yesterday you made a screen do things. Today you make a THING.\n\nCAD (computer-aided design) is how every manufactured product around you started — designed on screen, measured exactly, then made real. First you'll learn the five core CAD moves on a quick build, then use them to design your own product.",
          tip: "The 3D printer builds your design by melting plastic and stacking it layer by layer, bottom to top, 0.2 mm at a time.",
        }),

        block("heading", { text: "Step 1 — Get set up in Tinkercad" }),
        block("text", {
          kind: "build",
          minutes: 3,
          text: "Get into the workshop:",
          actions: [
            "Go to tinkercad.com and sign in (class login if your coach gave one)",
            "Click + Create → 3D Design — the blue workplane is the printer's bed",
            "Learn the camera: RIGHT-drag to orbit, scroll to zoom, press F to frame — try all three now",
          ],
          tip: "One rule all day: TYPE your measurements, never eyeball them. Manufacturing runs on exact numbers.",
        }),

        block("heading", { text: "Step 2 — Skill builder: the tag" }),
        block("text", {
          kind: "build",
          minutes: 5,
          text: "A quick build to learn the moves — a name tag:",
          actions: [
            "Drag a red Box onto the workplane",
            "Click a white corner handle and type the numbers: Length 60, Width 22, Height 3",
            "In the shape panel, set Radius to 3 — the corners round off",
          ],
          tip: "Smooth corners aren't just pretty — sharp printed corners snag and crack. That's move #1: exact dimensions.",
        }),

        block("heading", { text: "Step 3 — Raised text, perfect centering" }),
        block("text", {
          kind: "build",
          minutes: 6,
          text: "Put your name on it — the pro way:",
          actions: [
            "Drag the TEXT shape onto your tag and type YOUR name in the shape panel",
            "Set its Height to 4 — the tag is 3 tall, so letters rise exactly 1 mm above the face",
            "Shrink the text with a corner handle until it fits with a border around it",
            "ALIGN: select everything (Ctrl/Cmd+A), press L, click the two middle dots",
          ],
          tip: "Dragging by eye is never quite centered. Align always is. Moves #2 and #3: combining shapes, aligning precisely.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Design in progress screenshot",
          text: "Screenshot your tag with your raised name centered on it, shape panel visible so the measurements show.",
        }),

        block("heading", { text: "Step 4 — Holes and grouping" }),
        block("text", {
          kind: "build",
          minutes: 5,
          text: "Cut the keyring hole and make it one piece:",
          actions: [
            "Drag a Cylinder in and set it to 4 × 4 × 10",
            "Shape panel: switch it from Solid to HOLE — it turns see-through",
            "Move it to the top-left corner, clear of your letters — press D if it floats",
            "Select everything (Ctrl/Cmd+A) and Group (Ctrl/Cmd+G)",
          ],
          tip: "Moves #4 and #5: holes and grouping. That's the whole CAD toolkit — everything else is combinations.",
        }),

        block("heading", { text: "Step 5 — Tolerances: why parts FIT" }),
        block("text", {
          kind: "learn",
          minutes: 3,
          text: "Here's what separates a model that looks right from a product that works:\n\nIf a printed peg must fit a printed hole, they can NOT be the same size — plastic isn't perfect, and same-size parts jam solid. Designers leave a small gap called CLEARANCE: about 0.5 mm all around. A 10 mm peg gets a 10.5–11 mm hole.",
          tip: "Your keyring hole is 4 mm because keyring wire is 1–2 mm — room to thread and swing. Exactly wire-sized, and the ring would never go in.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: measurements matter",
          text: "Press record and answer: Why can't a printed peg and its hole be exactly the same size? What's clearance, and what would happen without it?",
        }),

        block("heading", { text: "Step 6 — Now design YOUR product" }),
        block("text", {
          kind: "create",
          minutes: 25,
          text: "Pick ONE and build it with the five moves you just learned:\n\n🔑 CUSTOM KEYCHAIN — evolve your tag: a new outline (Heart, Star), an icon from the shape library, engraved text (make the TEXT a Hole, sink it 1 mm).\n\n📱 PHONE STAND — base Box 70 × 90 × 8 · back rest Box 70 × 80 × 8, rotated back 25° (type the number!) · a lip on the front, 70 × 8 × 12, so the phone can't slide. Align on the center line, group. Test against a real phone!\n\n🌀 FIDGET — spinning disc: Cylinder 45 × 45 × 6, sides maxed, a 12 mm center hole, small shapes around the edge for grip. Keep it ≥ 6 mm thick so it feels solid.\n\n🌀🏠 HURRICANE-RESILIENCE TOOL — help your community prepare or recover: an emergency whistle keychain (Tube + mouthpiece box + air-slot hole), a supply-bag sealing clip (two 60 × 10 × 4 arms), a name tag for emergency kits. Chunky, ≥ 3 mm walls, nothing delicate.",
          tip: "Sketch it on paper first — two minutes, boxes and circles are fine. Real designers always start on paper.",
        }),

        block("heading", { text: "Step 7 — The manufacturer's checklist" }),
        block("text", {
          kind: "build",
          minutes: 5,
          text: "Before ANY design goes to the printer, run the exact checklist real factories use:",
          actions: [
            "Nothing floating — every part sits ON the workplane (select, press D)",
            "Nothing thinner than 2 mm — thin parts snap",
            "Bottom is flat — it prints without supports",
            "Everything that should be one piece is Grouped",
            "Check it from the top, front, AND side views (click the view cube corners)",
            "Export (top right) → .STL → your name in the filename → class print queue",
          ],
          warn: "The printer is the bottleneck for the whole class — export as soon as you're happy, not at the last minute!",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Print-ready design screenshot",
          allowModel: true,
          text: "Screenshot your finished, print-ready product from a good angle. Caption: which product you chose and one design decision you made on purpose. BONUS: attach the .stl file you exported — your portfolio will show your design as a real, spinnable 3D model!",
        }),

        block("heading", { text: "Reflect & share" }),
        wrapUpPrompt("Include why you chose your product and what you'd change in version 2."),
      ]),
      criteria: {
        create: [
          photoCriterion(0, "Design in progress screenshot", "The skill-builder tag: exact dimensions, raised centered text, shape panel visible."),
          audioCriterion(1, "Voice note: measurements matter", "Reinforcement: clearance and why exact measurements matter for printed parts."),
          photoCriterion(2, "Print-ready design screenshot", "The chosen product — grouped, flat, ≥2 mm walls, ready to export as STL."),
          wrapUpCriterion(3, "Written reflection on the design-and-make process."),
        ],
      },
  });

  // ==========================================================================
  // MODULE 3 — Programmable Electronics
  // Spine: built-in LED blink → external LED → push button, with real wiring
  // and real sketches. Wokwi simulator path throughout.
  // ==========================================================================
  // The exact sketches the tutorial teaches, compiled to hex once here so the
  // in-page simulator (circuit blocks) can run them instantly in the browser.
  const SKETCH = {
    blink13:
      "void setup() {\n  pinMode(13, OUTPUT);   // pin 13 will push power out\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);  // LED on\n  delay(1000);             // wait 1000 ms = 1 second\n  digitalWrite(13, LOW);   // LED off\n  delay(1000);\n}",
    blink8:
      "void setup() {\n  pinMode(8, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);\n  delay(1000);\n  digitalWrite(8, LOW);\n  delay(1000);\n}",
    button:
      "void setup() {\n  pinMode(8, OUTPUT);\n  pinMode(2, INPUT_PULLUP);   // button pin; PULLUP = no extra resistor needed\n}\n\nvoid loop() {\n  if (digitalRead(2) == LOW) {   // LOW means PRESSED (pullup logic is flipped)\n    digitalWrite(8, HIGH);\n  } else {\n    digitalWrite(8, LOW);\n  }\n}",
    traffic:
      "void setup() {\n  pinMode(8, OUTPUT);   // red\n  pinMode(9, OUTPUT);   // yellow\n  pinMode(10, OUTPUT);  // green\n}\n\nvoid loop() {\n  digitalWrite(10, HIGH);  delay(5000);  digitalWrite(10, LOW);  // green 5 s\n  digitalWrite(9, HIGH);   delay(2000);  digitalWrite(9, LOW);   // yellow 2 s\n  digitalWrite(8, HIGH);   delay(5000);  digitalWrite(8, LOW);   // red 5 s\n}",
    tmp36:
      'void setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int reading = analogRead(A0);\n  float voltage = reading * 5.0 / 1024.0;\n  float tempC = (voltage - 0.5) * 100.0;   // TMP36 formula\n  Serial.print("Temp: ");\n  Serial.print(tempC);\n  Serial.println(" C");\n  delay(500);\n}',
    police:
      "void setup() {\n  pinMode(8, OUTPUT);   // red\n  pinMode(9, OUTPUT);   // blue\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);  digitalWrite(9, LOW);\n  delay(150);\n  digitalWrite(8, LOW);   digitalWrite(9, HIGH);\n  delay(150);\n}",
    toggle:
      "bool lightOn = false;   // the flashlight remembers its state\n\nvoid setup() {\n  pinMode(8, OUTPUT);\n  pinMode(2, INPUT_PULLUP);\n}\n\nvoid loop() {\n  if (digitalRead(2) == LOW) {          // pressed\n    lightOn = !lightOn;                 // flip it\n    digitalWrite(8, lightOn ? HIGH : LOW);\n    while (digitalRead(2) == LOW) {}    // wait for your finger to lift\n    delay(50);                          // debounce\n  }\n}",
    heatalarm:
      'void setup() {\n  pinMode(8, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int reading = analogRead(A0);\n  float tempC = (reading * 5.0 / 1024.0 - 0.5) * 100.0;\n  Serial.print("Temp: ");\n  Serial.println(tempC);\n  if (tempC > 30) {                // too hot — sound the alarm!\n    digitalWrite(8, HIGH);  delay(200);\n    digitalWrite(8, LOW);   delay(200);\n  } else {\n    digitalWrite(8, LOW);\n    delay(200);\n  }\n}',
  };
  console.log("Compiling Module 3 Arduino sketches via hexi.wokwi.com…");
  const HEX = Object.fromEntries(
    await Promise.all(
      Object.entries(SKETCH).map(async ([name, src]) => [name, await compileHex(src)]),
    ),
  );

  // A small project module: one project, its own badge, its own checkpoints.
  const projectModule = ({ topic, title, summary, badgeName, badgeIcon, badgeDescription, blocks, criteria }) =>
    createModule({
      orgId: org.id,
      topic,
      title,
      summary,
      badgeName,
      badgeIcon,
      badgeDescription,
      contentJson: JSON.stringify(blocks),
      criteria: { create: criteria },
    });

  const ELECTRONICS = "Programmable Electronics";

  const e1 = await projectModule({
    topic: ELECTRONICS,
    title: "First Blink",
    summary: "Take control of the Arduino's on-board LED — your first code that touches hardware.",
    badgeName: "First Spark",
    badgeIcon: "⚡",
    badgeDescription: "Programmed real hardware for the first time: uploaded a sketch and controlled the Arduino's on-board LED.",
    blocks: [
      block("heading", { text: "Code you can touch" }),
      block("text", {
        kind: "learn",
        minutes: 2,
        text: "So far your code lived on a screen. Today it controls electricity.\n\nAn Arduino is a tiny computer the size of a cracker. It reads INPUTS (buttons, sensors) and switches OUTPUTS (LEDs, motors, buzzers). Your microwave, a game controller, a traffic light — inside, they all work exactly like what you build today.",
        tip: "No Arduino at your station? The in-page simulator (and wokwi.com) behaves exactly like the real thing — every step works there too.",
      }),
      block("heading", { text: "Safety first — every single time" }),
      block("text", {
        kind: "learn",
        minutes: 2,
        text: "Three rules, no exceptions:\n\n⚡ Wire with the power OFF (USB unplugged). Plug in only after you've checked the circuit.\n\n➕ Check POLARITY: electricity flows + to −. An LED's LONG leg is + (positive); the short leg goes to ground (GND).\n\n🚧 LEDs always get a resistor (220 Ω — red-red-brown stripes). It's a speed bump for electricity; without it, the LED burns out.",
        warn: "Read the diagram YOURSELF — the person who wires the circuit is the person who learns.",
      }),
      block("heading", { text: "First blink (no wiring needed)" }),
      block("text", {
        kind: "build",
        minutes: 8,
        text: "The Arduino has a tiny LED built into the board, wired to pin 13. Take control of it:",
        actions: [
          "Open the Arduino IDE (arduino.cc/en/software) — or your Wokwi project",
          "Plug in via USB · Tools → Board 'Arduino Uno' · Tools → Port → the USB one",
          "Type the sketch on the next card, then click Upload (the → arrow) — in Wokwi, press green Play",
          "Watch the little LED marked 'L' blink once per second",
        ],
        tip: "That blink means the board is running YOUR instructions. You are now programming hardware.",
      }),
      block("code", {
        text: SKETCH.blink13,
      }),
      block("text", {
        kind: "build",
        minutes: 5,
        text: "Now OWN it — change the numbers and re-upload:",
        actions: [
          "delay(100) → panic blink",
          "delay(2000) → lighthouse",
          "Make a heartbeat: two quick blinks, then a long pause (hint: four digitalWrite lines, four delays)",
        ],
        tip: "Notice: loop() runs forever — the same 'forever' loop from your game. delay(1000) is a variable you're tuning. Same ideas, new world.",
      }),
      block("heading", { text: "See it run RIGHT HERE" }),
      block("circuit", {
        kind: "build",
        minutes: 3,
        sketch: SKETCH.blink13,
        hex: HEX.blink13,
        text: "This is a real Arduino simulator running the exact sketch above. Press ▶ Run and watch the tiny 'L' LED near the middle of the board blink once per second — that's pin 13.",
        tip: "No board at your station? This simulator (and wokwi.com) behaves exactly like the real thing.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Blink photo",
        text: "Photo of the blinking LED — your real board's 'L' light, or a screenshot of the simulator running right here. Caption: which delay numbers you tried.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What did changing the delay numbers teach you about how the code runs?"),
    ],
    criteria: [
      photoCriterion(0, "Blink photo", "The on-board LED blinking — real board or the in-page simulator."),
      wrapUpCriterion(1, "Written reflection on running code on hardware for the first time."),
    ],
  });

  const e2 = await projectModule({
    topic: ELECTRONICS,
    title: "Wire a Real LED",
    summary: "Bring the blink off the board: breadboard, resistor, polarity — and the debugging hunt every engineer runs.",
    badgeName: "Circuit Builder",
    badgeIcon: "💡",
    badgeDescription: "Wired a working LED circuit on a breadboard with correct polarity and a resistor, and debugged it hands-on.",
    blocks: [
      block("heading", { text: "Wire a REAL LED" }),
      block("circuit", {
        kind: "build",
        minutes: 12,
        parts: [
          { id: "led1", kind: "led", pin: 8, color: "red", label: "LED", at: "10a", catAt: "12a" },
          { id: "r1", kind: "resistor", at: "5b", toAt: "10b", label: "220 Ω" },
        ],
        wires: [
          { id: "w-sig", from: "8", to: "5a", color: "#f59e0b" },
          { id: "w-gnd", from: "GND.1", to: "12b", color: "#1f2937" },
        ],
        steps: [
          { text: "UNPLUG the USB first — always wire with the power off", add: [] },
          { text: "LED into the breadboard: long leg row 10, short leg row 12", add: ["led1"] },
          { text: "Resistor (220 Ω): one end row 10 (with the long leg), other end row 5", add: ["r1"] },
          { text: "Jumper from Arduino pin 8 → row 5", add: ["w-sig"] },
          { text: "Jumper from Arduino GND → row 12", add: ["w-gnd"] },
          { text: "In your sketch change BOTH 13s to 8 · plug in · upload", add: [] },
        ],
        sketch: SKETCH.blink8,
        hex: HEX.blink8,
        text: "Bring the blink off the board. Tap through the checklist to wire the circuit on screen — the same moves, in the same order, you'll make on the real breadboard. When it's complete, press ▶ Run. If your real build doesn't match this, jump to the debugging hunt below.",
        tip: "Breadboard secret: the 5 holes in each numbered row are connected inside — two parts in the same row are wired together. The path is a circle: pin 8 → resistor → long leg → LED → short leg → GND.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Working circuit photo",
        text: "Photo of your circuit with the LED lit or mid-blink — wiring visible. Simulator screenshots count! Caption: which pin you used.",
      }),
      block("heading", { text: "When it doesn't work (and it won't)" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "Circuits fail in honest ways. When yours does, DON'T shotgun random changes — run the hunt in order, one check at a time:",
        actions: [
          "Power: is the board's ON light lit?",
          "Polarity: long leg on the resistor side? (Backwards LED = nothing, forever)",
          "Rows: are the parts REALLY in the rows you think? Count the holes",
          "Code: does the pin number in the sketch match the pin the wire is in?",
          "The part: swap in a different LED — parts do die",
        ],
        tip: "That patient hunt is the actual skill. Engineers call it debugging — it's most of the job.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: debugging story",
        text: "Press record and tell today's debugging story: what didn't work, and how you tracked it down step by step? (Nothing broke? Then explain which of the five checks you'd run first and why.)",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Include the moment something finally worked — what fixed it?"),
    ],
    criteria: [
      photoCriterion(0, "Working circuit photo", "A powered, working LED circuit (external LED, wired with resistor) — real or simulated."),
      audioCriterion(1, "Voice note: debugging story", "A debugging story: what failed and the step-by-step hunt that found it."),
      wrapUpCriterion(2, "Written reflection on building and debugging the circuit."),
    ],
  });

  const e3 = await projectModule({
    topic: ELECTRONICS,
    title: "Push-Button Light",
    summary: "Read the world: a push button controls your LED — sense, decide, act.",
    badgeName: "Input Master",
    badgeIcon: "🔘",
    badgeDescription: "Read a real-world input with digitalRead and used it to control an output — the sense → decide → act loop.",
    blocks: [
      block("heading", { text: "Inputs: wire a push button" }),
      block("circuit", {
        kind: "build",
        minutes: 10,
        parts: [
          { id: "led1", kind: "led", pin: 8, color: "red", label: "LED", at: "10a", catAt: "12a" },
          { id: "r1", kind: "resistor", at: "5b", toAt: "10b", label: "220 Ω" },
          { id: "btn1", kind: "pushbutton", pin: 2, label: "Button", cols: [20, 22] },
        ],
        wires: [
          { id: "w-sig8", from: "8", to: "5a", color: "#f59e0b" },
          { id: "w-gnd-led", from: "GND.1", to: "12b", color: "#1f2937" },
          { id: "w-sig2", from: "2", to: "20a", color: "#3b82f6" },
          { id: "w-gnd-btn", from: "GND.1", to: "22j", color: "#1f2937" },
        ],
        steps: [
          { text: "Unplug the USB before touching any wires", add: [] },
          { text: "Your LED circuit stays exactly as it was — pin 8, resistor, GND", add: ["led1", "r1", "w-sig8", "w-gnd-led"] },
          { text: "Push the button across the center gap — legs in rows 20 and 22", add: ["btn1"] },
          { text: "Jumper from Arduino pin 2 → row 20", add: ["w-sig2"] },
          { text: "Jumper from GND → row 22 (bottom half of the board)", add: ["w-gnd-btn"] },
          { text: "Wiring done — plug back in. The code that reads it comes next", add: [] },
        ],
        sketch: SKETCH.button,
        hex: HEX.button,
        text: "Time for the other half: INPUT. Hardware first, code second — wire the button step by step, the same moves you'll make on the real breadboard. Then press ▶ Run to check the circuit: click and HOLD the button: light. Let go: dark.",
      }),
      block("heading", { text: "Now the code that reads it" }),
      block("code", {
        kind: "build",
        minutes: 5,
        text: SKETCH.button,
        actions: [
          "Type this sketch into your IDE (or your Wokwi project)",
          "Upload it to your wired-up board",
          "Hold the button — light. Let go — dark",
        ],
        tip: "digitalRead(2) checks your finger 16 million times a second. INPUT_PULLUP keeps the pin HIGH until the button connects it to GND — that's why PRESSED reads LOW.",
      }),
      block("text", {
        kind: "learn",
        minutes: 2,
        text: "Hold the button: light. Release: dark. You've built the complete loop every smart device runs: sense → decide → act.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Working button photo",
        text: "Photo of your button build working — real or simulated, code visible if you can. Caption: what happens when you hold the button.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Explain in your own words why LOW means PRESSED with INPUT_PULLUP."),
    ],
    criteria: [
      photoCriterion(0, "Working button photo", "The push-button circuit controlling the LED — real or simulated."),
      wrapUpCriterion(1, "Written reflection on reading inputs."),
    ],
  });

  const e4 = await projectModule({
    topic: ELECTRONICS,
    title: "Traffic Light",
    summary: "Three LEDs, one sequence: green, yellow, red — forever.",
    badgeName: "Traffic Controller",
    badgeIcon: "🚦",
    badgeDescription: "Sequenced multiple outputs with digitalWrite and delay to run a real traffic-light cycle.",
    blocks: [
      block("heading", { text: "🚦 Build the full circuit" }),
      block("text", {
        kind: "build",
        minutes: 3,
        text: "Red, yellow, green LEDs on pins 8, 9, 10 — each with its own resistor and its own GND jumper. The sketch sequences them: green 5 s → yellow 2 s → red 5 s, forever.",
        tip: "It's the LED circuit you already know, three times over. Build one color at a time and test as you go.",
      }),
      block("circuit", {
        kind: "create",
        minutes: 6,
        parts: [
          { id: "led-r", kind: "led", pin: 8, color: "red", label: "red", at: "6a", catAt: "8a" },
          { id: "r-r", kind: "resistor", at: "3b", toAt: "6b" },
          { id: "led-y", kind: "led", pin: 9, color: "yellow", label: "yellow", at: "15a", catAt: "17a" },
          { id: "r-y", kind: "resistor", at: "12b", toAt: "15b" },
          { id: "led-g", kind: "led", pin: 10, color: "green", label: "green", at: "24a", catAt: "26a" },
          { id: "r-g", kind: "resistor", at: "21b", toAt: "24b" },
        ],
        wires: [
          { id: "w-r-sig", from: "8", to: "3a", color: "#ef4444" },
          { id: "w-r-gnd", from: "GND.1", to: "8b", color: "#1f2937" },
          { id: "w-y-sig", from: "9", to: "12a", color: "#eab308" },
          { id: "w-y-gnd", from: "GND.1", to: "17b", color: "#1f2937" },
          { id: "w-g-sig", from: "10", to: "21a", color: "#22c55e" },
          { id: "w-g-gnd", from: "GND.1", to: "26b", color: "#1f2937" },
        ],
        steps: [
          { text: "RED light: LED long leg row 6, short leg row 8 · resistor row 6 → row 3", add: ["led-r", "r-r"] },
          { text: "Wire red: pin 8 → row 3 · GND → row 8", add: ["w-r-sig", "w-r-gnd"] },
          { text: "YELLOW light: LED long leg row 15, short leg row 17 · resistor row 15 → row 12", add: ["led-y", "r-y"] },
          { text: "Wire yellow: pin 9 → row 12 · GND → row 17", add: ["w-y-sig", "w-y-gnd"] },
          { text: "GREEN light: LED long leg row 24, short leg row 26 · resistor row 24 → row 21", add: ["led-g", "r-g"] },
          { text: "Wire green: pin 10 → row 21 · GND → row 26", add: ["w-g-sig", "w-g-gnd"] },
        ],
        sketch: SKETCH.traffic,
        hex: HEX.traffic,
        text: "Three LED circuits side by side — same recipe, three times. Build it, then ▶ Run: green 5 s → yellow 2 s → red 5 s, forever.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Traffic light photo",
        text: "Photo of your traffic light mid-cycle — real or simulated. Caption: which color was lit when you snapped it.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("How would you add a flashing-yellow night mode?"),
    ],
    criteria: [
      photoCriterion(0, "Traffic light photo", "The three-LED traffic light running its sequence — real or simulated."),
      wrapUpCriterion(1, "Written reflection on sequencing outputs."),
    ],
  });

  const e5 = await projectModule({
    topic: ELECTRONICS,
    title: "Temperature Logger",
    summary: "A TMP36 sensor + the Serial Monitor: watch live temperature data stream from your code.",
    badgeName: "Data Logger",
    badgeIcon: "🌡️",
    badgeDescription: "Read an analog sensor, converted raw readings to real units, and streamed live data over Serial.",
    blocks: [
      block("heading", { text: "🌡️ Be the experiment" }),
      block("text", {
        kind: "build",
        minutes: 3,
        text: "TMP36 temperature sensor: flat side facing you, legs = 5V, A0, GND. Read it with analogRead(A0), convert to degrees, print with Serial.println(), and watch live in Tools → Serial Monitor.",
        tip: "Pinch the sensor between your fingers and watch the number rise — you're the experiment!",
      }),
      block("circuit", {
        kind: "create",
        minutes: 5,
        parts: [{ id: "tmp1", kind: "tmp36", label: "TMP36 — A0", at: "15a" }],
        wires: [
          { id: "w-5v", from: "5V", to: "14e", color: "#ef4444" },
          { id: "w-a0", from: "A0", to: "15e", color: "#a855f7" },
          { id: "w-gnd", from: "GND.2", to: "16e", color: "#1f2937" },
        ],
        steps: [
          { text: "TMP36 into the breadboard, flat side facing you — legs in rows 14, 15, 16", add: ["tmp1"] },
          { text: "Left leg is power: 5V → row 14", add: ["w-5v"] },
          { text: "Middle leg is the signal: A0 → row 15", add: ["w-a0"] },
          { text: "Right leg is ground: GND → row 16", add: ["w-gnd"] },
        ],
        sketch: SKETCH.tmp36,
        hex: HEX.tmp36,
        text: "Wire the sensor, press ▶ Run, then drag the temperature slider — that's you pinching the sensor. The Serial Monitor shows exactly what you'll see in Tools → Serial Monitor on the real thing.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Sensor build photo",
        text: "Photo of your sensor build with the Serial Monitor showing readings — real or simulated. Caption: the temperature it read.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What was the highest temperature you measured, and how did you make it climb?"),
    ],
    criteria: [
      photoCriterion(0, "Sensor build photo", "The TMP36 circuit streaming readings to the Serial Monitor — real or simulated."),
      wrapUpCriterion(1, "Written reflection on reading sensor data."),
    ],
  });

  const e6 = await projectModule({
    topic: ELECTRONICS,
    title: "Police Flasher",
    summary: "Two LEDs taking turns at 150 ms — patterns and timing.",
    badgeName: "Flash Master",
    badgeIcon: "🚨",
    badgeDescription: "Built an alternating two-LED flasher and tuned its timing pattern.",
    blocks: [
      block("heading", { text: "🚨 Red, blue, red, blue" }),
      block("circuit", {
        kind: "create",
        minutes: 8,
        parts: [
          { id: "led-r", kind: "led", pin: 8, color: "red", label: "red", at: "6a", catAt: "8a" },
          { id: "r-r", kind: "resistor", at: "3b", toAt: "6b" },
          { id: "led-b", kind: "led", pin: 9, color: "blue", label: "blue", at: "15a", catAt: "17a" },
          { id: "r-b", kind: "resistor", at: "12b", toAt: "15b" },
        ],
        wires: [
          { id: "w-r-sig", from: "8", to: "3a", color: "#ef4444" },
          { id: "w-r-gnd", from: "GND.1", to: "8b", color: "#1f2937" },
          { id: "w-b-sig", from: "9", to: "12a", color: "#3b82f6" },
          { id: "w-b-gnd", from: "GND.1", to: "17b", color: "#1f2937" },
        ],
        steps: [
          { text: "RED LED: long leg row 6, short leg row 8 · resistor row 6 → row 3", add: ["led-r", "r-r"] },
          { text: "Wire red: pin 8 → row 3 · GND → row 8", add: ["w-r-sig", "w-r-gnd"] },
          { text: "BLUE LED: long leg row 15, short leg row 17 · resistor row 15 → row 12", add: ["led-b", "r-b"] },
          { text: "Wire blue: pin 9 → row 12 · GND → row 17", add: ["w-b-sig", "w-b-gnd"] },
        ],
        sketch: SKETCH.police,
        hex: HEX.police,
        text: "Red, blue, red, blue — each LED gets 150 ms. Challenge for your real build: make it strobe (two quick red flashes, then two quick blue). Hint: four digitalWrite pairs.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Flasher photo",
        text: "Photo of your flasher mid-flash — real or simulated. Caption: your delay numbers.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What pattern did you invent when you changed the delays?"),
    ],
    criteria: [
      photoCriterion(0, "Flasher photo", "The alternating two-LED flasher running — real or simulated."),
      wrapUpCriterion(1, "Written reflection on timing patterns."),
    ],
  });

  const e7 = await projectModule({
    topic: ELECTRONICS,
    title: "Toggle Flashlight",
    summary: "Press on, press off — one variable that remembers. That's state.",
    badgeName: "Switch Wizard",
    badgeIcon: "🔦",
    badgeDescription: "Used a state variable to turn a momentary button into a real on/off switch.",
    blocks: [
      block("heading", { text: "🔦 Same wiring, brand-new brain" }),
      block("circuit", {
        kind: "create",
        minutes: 8,
        parts: [
          { id: "led1", kind: "led", pin: 8, color: "red", label: "LED", at: "10a", catAt: "12a" },
          { id: "r1", kind: "resistor", at: "5b", toAt: "10b", label: "220 Ω" },
          { id: "btn1", kind: "pushbutton", pin: 2, label: "Button", cols: [20, 22] },
        ],
        wires: [
          { id: "w-sig8", from: "8", to: "5a", color: "#f59e0b" },
          { id: "w-gnd-led", from: "GND.1", to: "12b", color: "#1f2937" },
          { id: "w-sig2", from: "2", to: "20a", color: "#3b82f6" },
          { id: "w-gnd-btn", from: "GND.1", to: "22j", color: "#1f2937" },
        ],
        steps: [
          { text: "The LED circuit you know by heart: LED rows 10/12, resistor to row 5, pin 8 → row 5, GND → row 12", add: ["led1", "r1", "w-sig8", "w-gnd-led"] },
          { text: "Button across the gap at rows 20/22 · pin 2 → row 20 · GND → row 22 (bottom half)", add: ["btn1", "w-sig2", "w-gnd-btn"] },
        ],
        sketch: SKETCH.toggle,
        hex: HEX.toggle,
        text: "Same wiring as the push-button project — completely different behavior. Click the button once: light stays ON. Click again: off. The magic is one variable that remembers. That's how every light switch, TV remote, and power button works.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Flashlight photo",
        text: "Photo of your toggle flashlight ON with your finger OFF the button — that's the proof it remembers. Real or simulated.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Explain lightOn = !lightOn to a friend who's never coded."),
    ],
    criteria: [
      photoCriterion(0, "Flashlight photo", "The toggle flashlight holding its state — LED on with the button released."),
      wrapUpCriterion(1, "Written reflection on state and memory."),
    ],
  });

  const e8 = await projectModule({
    topic: ELECTRONICS,
    title: "Heat Alarm",
    summary: "Sensor + LED + a decision: flash the alarm when it gets too hot.",
    badgeName: "Alarm Engineer",
    badgeIcon: "🔥",
    badgeDescription: "Combined an analog sensor with an output and a threshold decision — a complete sense → decide → act device.",
    blocks: [
      block("heading", { text: "🔥 Sense → decide → act" }),
      block("circuit", {
        kind: "create",
        minutes: 8,
        parts: [
          { id: "tmp1", kind: "tmp36", label: "TMP36 — A0", at: "15a" },
          { id: "led1", kind: "led", pin: 8, color: "red", label: "alarm", at: "22a", catAt: "24a" },
          { id: "r1", kind: "resistor", at: "19b", toAt: "22b" },
        ],
        wires: [
          { id: "w-5v", from: "5V", to: "14e", color: "#ef4444" },
          { id: "w-a0", from: "A0", to: "15e", color: "#a855f7" },
          { id: "w-gnd-t", from: "GND.2", to: "16e", color: "#1f2937" },
          { id: "w-sig", from: "8", to: "19a", color: "#f59e0b" },
          { id: "w-gnd-led", from: "GND.1", to: "24b", color: "#1f2937" },
        ],
        steps: [
          { text: "TMP36 into the breadboard, flat side facing you — legs in rows 14, 15, 16", add: ["tmp1"] },
          { text: "Sensor wires: 5V → row 14 · A0 → row 15 · GND → row 16", add: ["w-5v", "w-a0", "w-gnd-t"] },
          { text: "Alarm LED: long leg row 22, short leg row 24 · resistor row 22 → row 19", add: ["led1", "r1"] },
          { text: "Wire the alarm: pin 8 → row 19 · GND → row 24", add: ["w-sig", "w-gnd-led"] },
        ],
        sketch: SKETCH.heatalarm,
        hex: HEX.heatalarm,
        text: "Run it, then drag the slider past 30°C — the alarm LED starts flashing. Under 30, silence. This is a real thermostat, a fire alarm, a fever thermometer: sense → decide → act. Challenge: change the danger line to 35.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Heat alarm photo",
        text: "Photo of your alarm FLASHING with the temperature reading visible — real or simulated. Caption: your danger threshold.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What other alarms could this same sense → decide → act loop build?"),
    ],
    criteria: [
      photoCriterion(0, "Heat alarm photo", "The heat alarm triggering above the threshold — real or simulated."),
      wrapUpCriterion(1, "Written reflection on thresholds and decisions."),
    ],
  });

  // Cricut sticker project (CAD & Manufacturing) — Pamela's "Sticker Design
  // Challenge" brief, visual-first: each card leads with its poster tile
  // (public/tutorial/sticker/*), text kept to captions and checklists.
  const cad2 = await projectModule({
    topic: "CAD & Manufacturing",
    title: "Sticker Design Challenge",
    summary: "Design it. Test it. Sell it! A Canva sticker, market-tested by real people, cut on the Cricut — priced like a business.",
    badgeName: "Sticker Boss",
    badgeIcon: "🏷️",
    badgeDescription: "Designed a sticker to a brief, ran real market research, costed production, cut it on the Cricut, and priced it with a business case.",
    blocks: [
      block("heading", { text: "Design it. Test it. Sell it!" }),
      block("text", {
        kind: "learn",
        minutes: 2,
        url: "/tutorial/sticker/header.jpg",
        text: "Today you're a designer AND a business. Design in Canva, test with real customers, manufacture on the Cricut, set a price.",
        tip: "Great stickers are SIMPLE — if you can't read it from across the room, it's not done yet.",
      }),

      block("heading", { text: "The design brief" }),
      block("text", {
        kind: "build",
        minutes: 12,
        url: "/tutorial/sticker/rules.jpg",
        text: "Open Canva → Create a design → small square (1080 × 1080). Hit all four rules:",
        actions: [
          "Text — at least one word or phrase",
          "An image — Canva graphic, your own illustration, or both",
          "Two different fonts",
          "At least four colours that work together",
        ],
      }),

      block("heading", { text: "Pro move: steal a colour" }),
      block("text", {
        kind: "build",
        minutes: 4,
        url: "/tutorial/sticker/colorpicker.jpg",
        text: "Computers name every colour with a HEX code.",
        actions: [
          "Search \"Color Picker\" on Google · find a colour you love",
          "Copy its HEX code (the # number)",
          "Canva → colour panel → + → paste it. That exact colour is now yours",
        ],
        tip: "Designers rarely invent colours — they collect them.",
      }),

      block("heading", { text: "Four versions — no favourites yet" }),
      block("text", {
        kind: "create",
        minutes: 12,
        url: "/tutorial/sticker/variations.jpg",
        text: "One design is a guess; four is an experiment. Duplicate your page three times — each version changes at least THREE of: colours, font, image, layout.",
        tip: "The version YOU like least might be the one everyone buys. Happens constantly in real design.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Four designs photo",
        text: "Screenshot of all four sticker variations side by side in Canva. Caption: which one YOU think will win.",
      }),

      block("heading", { text: "Market research" }),
      block("text", {
        kind: "build",
        minutes: 15,
        url: "/tutorial/sticker/research.jpg",
        text: "Show your four designs to at least 10 people around the room. Keep a tally: which version, WHY (their words), and suggestions.",
        tip: "Don't defend your design while they talk — just listen and write. The customer is telling you how to make money.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: market results",
        text: "Press record and report like a founder: which design won the vote, why people said they chose it, and one change you'll make because of the feedback. Did YOUR favourite win?",
      }),

      block("heading", { text: "What does it cost to make?" }),
      block("text", {
        kind: "build",
        minutes: 10,
        url: "/tutorial/sticker/costs.jpg",
        text: "Research each item on the list, then write the number down: \"one sticker costs me about $___ to make.\" Every price decision starts from that number.",
      }),

      block("heading", { text: "Manufacture it — Cricut time" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Take the WINNING design (the market's pick — not necessarily yours) into production:",
        actions: [
          "Canva: Share → Download → PNG",
          "Cricut Design Space: New Project → Upload → your PNG",
          "Resize to real sticker size (5–8 cm) · choose Print Then Cut",
          "Print onto sticker paper · stick the sheet to the mat · load it",
          "Let the Cricut find the cut lines and cut — then peel your sticker!",
        ],
        warn: "Ask an instructor before the cut — mats and blades are shared equipment, and sticker paper only feeds one way.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Finished sticker photo",
        text: "Photo of your finished, peeled sticker — in your hand or stuck somewhere legal. Caption: what you'd improve in version two.",
      }),

      block("heading", { text: "Become the business owner" }),
      block("text", {
        kind: "create",
        minutes: 5,
        url: "/tutorial/sticker/price.jpg",
        text: "Using your costs, your research, and your quality: choose a realistic price. It must cover your cost — and a real person must happily pay it. Write it on a sticky note next to your sticker and be ready to defend it.",
        tip: "Sticker maths: costs $0.40, sells for $3.00 — that margin pays for your time, your mistakes, and your next roll of paper.",
      }),

      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Include your final price and the one sentence you'd use to convince a stranger to buy your sticker."),
    ],
    criteria: [
      photoCriterion(0, "Four designs photo", "All four sticker design variations, each changing at least three of: colours, font, image, layout."),
      audioCriterion(1, "Voice note: market results", "Reports the market-research results: winning design, customers' reasons, and a change based on feedback."),
      photoCriterion(2, "Finished sticker photo", "The finished sticker, printed and cut on the Cricut."),
      wrapUpCriterion(3, "Written reflection including the selling price and the pitch for it."),
    ],
  });

  const fc2 = await createRodocodoModule(projectModule);
  const fc3 = await createComputeItModule(projectModule);

  // ==========================================================================
  // MODULE 4 — Virtual & Augmented Reality
  // Concrete missions per app, then a creation with a no-headset fallback.
  // ==========================================================================
  const module4 = await createModule({
      orgId: org.id,
      topic: "Virtual & Augmented Reality",
      title: "Three VR Expeditions",
      summary:
        "Three guided expeditions — deep ocean, deep space, deep history — then design an immersive experience of your own.",
      badgeName: "Reality Explorer",
      badgeIcon: "🥽",
      badgeDescription:
        "Explored immersive VR/AR experiences and connected them to real-world fields where the technology changes the work.",
      contentJson: JSON.stringify([
        block("heading", { text: "Go somewhere impossible" }),
        block("text", {
          kind: "learn",
          minutes: 2,
          text: "Today you don't look at a screen — you step through it. Immersive tech puts you places no bus can take you: the surface of Mars, inside a beating heart, a city from 500 years ago.\n\nThe plan: guided expeditions with specific missions, then YOU become the builder and design an immersive experience of your own.",
          tip: "Keep one question running all day: what makes this feel REAL — the scale? the sound? being able to look anywhere?",
        }),
        block("heading", { text: "Postcards from space — all real photos" }),
        block("slides", {
          urls: [
            "/tutorial/space/bahamas-from-iss.jpg",
            "/tutorial/space/perseverance-selfie.jpg",
            "/tutorial/space/cosmic-cliffs-webb.jpg",
            "/tutorial/space/earthrise.jpg",
          ],
          text: "Real NASA photographs: The Bahamas from the Space Station (find Abaco!) · Perseverance's selfie WITH its helicopter, on Mars · Webb's 'Cosmic Cliffs' — stars being born 7,600 light-years away · 'Earthrise', 1968 — the first time humans watched Earth rise over another world. Today you visit places like these.",
        }),

        block("heading", { text: "Expedition 1 — Wonders of the world" }),
        block("text", {
          kind: "build",
          minutes: 10,
          text: "Destination: Google Arts & Culture — artsandculture.google.com. Your missions:",
          actions: [
            "Search 'Machu Picchu' → open the Street View-style tour → walk the terraces. Look UP",
            "Search 'Great Barrier Reef' — dive it",
            "Free choice: find one place that connects to something YOU care about — 'space', 'sharks', 'Junkanoo', 'pyramids'…",
          ],
          tip: "As you go: which of these could a classroom in Abaco never visit in person — and now just did?",
        }),

        block("heading", { text: "Expedition 2 — The solar system, live" }),
        block("text", {
          kind: "build",
          minutes: 10,
          text: "Destination: NASA Eyes — eyes.nasa.gov → 'Eyes on the Solar System'. This isn't animation — it's live NASA data. Your missions:",
          actions: [
            "Fly to Mars: search Mars, zoom until you can see surface features",
            "Find a real spacecraft: search 'Perseverance' — that rover is on Mars RIGHT NOW, and this is where",
            "Use the time slider (bottom) to fast-forward the planets a year in ten seconds",
            "On the way home: visit Earth and find the Bahamas from space",
          ],
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Expedition screenshot",
          text: "Screenshot the most surprising place you visited on either expedition. Caption: where you are and what surprised you.",
        }),

        block("heading", { text: "Where does immersive tech change real work?" }),
        block("text", {
          kind: "learn",
          minutes: 5,
          text: "Now think like a builder, not a tourist. Real examples happening today:\n\n🏥 MEDICINE — surgeons rehearse a rare operation in VR the night before touching the patient. Mistake cost: zero.\n\n🏗️ ARCHITECTURE — clients walk through a building that doesn't exist yet and say 'move that wall' before concrete is poured.\n\n🎓 EDUCATION — a school that can't afford a lab dissects a virtual heart, visits Mars at 9am and the reef at 10.\n\n⚙️ ENGINEERING — mechanics learn a jet engine by pulling apart a virtual one that can't break.\n\n🎬 ENTERTAINMENT — concerts and games in places that could never physically exist.",
          tip: "The pattern: immersive tech wins wherever 'being there' beats 'reading about it' — and where real practice is expensive, dangerous, or impossible.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: immersive tech at work",
          text: "Press record: pick ONE field — education, medicine, engineering, architecture, or entertainment — and explain how immersive tech changes how that work gets done. Give one concrete example (borrow one of ours or invent your own).",
        }),

        block("heading", { text: "Create — design YOUR immersive experience" }),
        block("text", {
          kind: "create",
          minutes: 20,
          text: "Consumers visit worlds; creators build them. Pick by equipment:\n\n🎨 HEADSET OR TABLET — Open Brush (openbrush.app): paint one 3D scene — a reef, your street, a creature, an invention. Walk around it as you paint.\n\n📋 NO HEADSET — storyboard the VR experience YOU would build for your community, on paper or in Canva (search 'Storyboard'). Three panels:",
          actions: [
            "Panel 1 · ARRIVE — the first thing visitors see and hear when the headset goes on",
            "Panel 2 · EXPLORE — what they can move toward, look inside, discover",
            "Panel 3 · DO — the one thing they can interact with (grab, press, change)",
          ],
          tip: "Idea sparks: dive the reef before and after a hurricane · walk Marsh Harbour in 1920 · shrink to ant size in a garden · a boat-safety storm simulator. Interaction is what makes VR different from a movie!",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Your immersive creation",
          text: "Screenshot or photo of what you made — your 3D painting or your three-panel storyboard. Caption: what it is and who it's for.",
        }),

        block("heading", { text: "Reflect & share" }),
        wrapUpPrompt("Include the place that surprised you most and why."),
      ]),
      criteria: {
        create: [
          photoCriterion(0, "Expedition screenshot", "The most surprising place visited during the guided expeditions."),
          audioCriterion(1, "Voice note: immersive tech at work", "One field where immersive technology changes the work, with a concrete example."),
          photoCriterion(2, "Your immersive creation", "An original creation: an Open Brush scene or a three-panel VR experience storyboard."),
          wrapUpCriterion(3, "Written reflection on the immersive technology experience."),
        ],
      },
  });

  // ==========================================================================
  // MODULE 5 — Artificial Intelligence & Digital Safety
  // Worked prompt examples, a concrete build flow, and a verification step.
  // ==========================================================================
  const module5 = await createModule({
      orgId: org.id,
      topic: "AI & Digital Safety",
      title: "Build a Project with AI",
      summary:
        "Learn what AI actually is, write prompts that work, verify what it tells you — then build a real project with AI that's still 100% yours.",
      badgeName: "AI Navigator",
      badgeIcon: "🤖",
      badgeDescription:
        "Used AI tools responsibly to assist a real project — strong prompts, verified output, and their own thinking on top.",
      contentJson: JSON.stringify([
        block("heading", { text: "What is AI, really?" }),
        block("text", {
          kind: "learn",
          minutes: 4,
          text: "By end of day you should be able to answer in your own words: What is AI? What is generative AI? What is a model?\n\nThe honest version:\n\n🧠 An AI MODEL is a program that studied millions of examples (text, images, code) and learned the patterns in them.\n\n✨ GENERATIVE AI uses those patterns to produce NEW things — it predicts what should come next, word by word or pixel by pixel.\n\n❗ It doesn't 'know' facts the way you do. It predicts. That's why it can write a poem in seconds AND confidently state something false (a hallucination).",
          tip: "Both halves matter: it's an astonishing tool, and it needs a human checking it. Today, that human is you.",
        }),

        block("heading", { text: "The rules that keep you safe" }),
        block("text", {
          kind: "learn",
          minutes: 3,
          text: "Non-negotiable, every AI tool, every time:\n\n🔑 Never share passwords.\n\n🙈 Never share personal information — full name, address, school, phone number. Yours or anyone else's.\n\n✅ Verify AI-generated information before you trust or repeat it.\n\n©️ Respect copyright — AI output isn't automatically yours to use anywhere.\n\n🧠 AI assists your thinking — it doesn't replace it.",
          warn: "If an AI conversation ever feels weird or too personal — close it and tell an adult. AI is a tool, not a friend.",
        }),

        block("heading", { text: "Your AI toolbox" }),
        block("text", {
          kind: "learn",
          minutes: 3,
          text: "Different tools, different strengths:\n\n💬 ChatGPT (chatgpt.com) — research, writing, code, brainstorming.\n\n📚 Claude (claude.ai) — long documents, careful reasoning, planning.\n\n🔍 Perplexity (perplexity.ai) — research WITH sources shown; great for fact-checking.\n\n🌐 v0 (v0.dev) — type a description, get a working website.\n\n🎨 Canva Magic Studio (canva.com) — AI design: posters, presentations, images.\n\n💎 Gemini (gemini.google.com) — Google ecosystem work.",
          tip: "Today you'll use at least two: one to CREATE and one to VERIFY.",
        }),

        block("heading", { text: "Prompting is a skill — here's the anatomy" }),
        block("text", {
          kind: "learn",
          minutes: 5,
          text: "The AI can't read your mind; it can only read your prompt. Compare:\n\n❌ WEAK: \"make me a poster\" → generic clip-art junk.\n\n✅ STRONG: \"Make a poster for a hurricane-preparedness kit aimed at families in Abaco, Bahamas. Bright beach colors, bold friendly style. Must include: a checklist of 5 essential items, a short memorable slogan, space at the bottom for a logo.\" → something you can actually use.\n\nThe formula — four ingredients:\n1. WHAT you want (poster / webpage / plan / paragraph)\n2. WHO it's for (audience!)\n3. STYLE (colors, tone, mood)\n4. MUST-INCLUDES (the details that matter)",
          tip: "The fifth secret ingredient: ITERATE. Your second prompt ('make the slogan shorter, change blue to teal') matters more than your first.",
        }),

        block("heading", { text: "Build block — create your first draft" }),
        block("text", {
          kind: "create",
          minutes: 15,
          text: "Pick a project — ideally something your Shark Tank team can actually use:\n\n📄 Poster or flyer → Canva: search 'Magic Design', paste your prompt.\n\n🌐 Landing page → v0.dev: describe it ('A clean landing page for a student-invented storm whistle, with a hero section, 3 feature cards, and a big orange Get One button').\n\n🎤 Pitch help → ChatGPT or Claude: 'Give me 5 catchy name ideas and a 2-sentence pitch for [your product], aimed at [your audience].'",
          actions: [
            "Pick your project and your tool",
            "Write your prompt with all four ingredients — WHAT, WHO, STYLE, MUST-INCLUDES",
            "Generate — and DON'T fix anything yet",
          ],
          tip: "We want the raw first draft for your portfolio — the before picture.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "AI first draft screenshot",
          text: "Screenshot the AI's FIRST draft, untouched. In the caption, paste the prompt you used — draft and prompt together tell the story.",
        }),

        block("heading", { text: "Iterate, then VERIFY" }),
        block("text", {
          kind: "build",
          minutes: 10,
          text: "Round two — make it better, then make it TRUE:",
          actions: [
            "ITERATE: tell the AI two specific changes ('shorten the slogan to 5 words', 'match Bahamian flag colors')",
            "VERIFY: find one FACT in your draft — a claim, a statistic, safety advice",
            "Check it in Perplexity (shows sources) or a trusted site — hurricane facts: nema.gov.bs or noaa.gov",
            "Wrong or made up? Fix it in your draft",
          ],
          tip: "If you caught the AI inventing something — congratulations, that's a hallucination, and catching it is EXACTLY what responsible AI use looks like.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: what makes a good prompt",
          text: "Press record and answer: What makes a good prompt? Use YOUR before-and-after from today — what did you add or change that made the result better?",
        }),

        block("heading", { text: "Make it YOURS" }),
        block("text", {
          kind: "create",
          minutes: 10,
          text: "The AI draft is raw material, not the finished work. Add the part no AI has: what YOU know.",
          actions: [
            "Fix what's generic — the AI has never been to Abaco; you live there. Swap stock details for real ones",
            "Add your voice — the joke, the phrase, the design touch that sounds like you",
            "Apply your verification — the corrected facts",
          ],
          tip: "The test: your final should be BETTER than the AI's draft, and you should be able to point at exactly what you changed and why. That difference is your thinking — the thing AI assists but never replaces.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Final version with your edits",
          text: "Screenshot your FINAL version. Caption: the two or three things YOU changed from the AI draft, and why.",
        }),

        block("heading", { text: "Reflect & share" }),
        wrapUpPrompt("Include one safety rule in your own words, and the fact you verified (or the hallucination you caught!)."),
      ]),
      criteria: {
        create: [
          photoCriterion(0, "AI first draft screenshot", "The AI-generated first draft, with the four-ingredient prompt used to create it."),
          audioCriterion(1, "Voice note: what makes a good prompt", "What makes a good prompt, illustrated with a before/after from the day."),
          photoCriterion(2, "Final version with your edits", "The final project showing the student's own edits and verification on top of the AI draft."),
          wrapUpCriterion(3, "Written reflection including a safety rule in the student's own words."),
        ],
      },
  });

  // ==========================================================================
  // MODULE 6 — Final Showcase (Shark Tank)
  // Slide-by-slide deck template, fill-in-the-blank pitch, rehearsal drill.
  // ==========================================================================
  const module6 = await createModule({
      orgId: org.id,
      topic: "Shark Tank Showcase",
      title: "Pitch Your Project",
      summary:
        "Turn the week into a pitch: a five-slide deck, a 30-second hook, a live demo — presented Shark Tank style to real judges.",
      badgeName: "Shark Tank Star",
      badgeIcon: "🦈",
      badgeDescription:
        "Presented a complete project — problem, solution, prototype, and business pitch — at the final showcase.",
      contentJson: JSON.stringify([
        block("heading", { text: "Showcase day" }),
        block("text", {
          kind: "learn",
          minutes: 3,
          text: "This week you coded, designed, wired, explored, and created with AI. Today your team puts it together and pitches it to judges — Shark Tank style.\n\nEvery pitch must cover six things:\n1. The PROBLEM you chose\n2. Your SOLUTION\n3. Your CAD model\n4. Your prototype\n5. The AI tools you used — and what YOU added on top\n6. The BUSINESS pitch — who needs this, and why would they pay?",
          tip: "Format: 3–5 minutes, every teammate speaks, then judges' questions. Judges name one thing that worked and one to improve — that's how feedback is supposed to sound.",
        }),

        block("heading", { text: "Build the deck — five slides, no more" }),
        block("text", {
          kind: "build",
          minutes: 30,
          text: "Open Canva → Presentation. Big pictures, few words — YOU are the show, slides are the backdrop. Build them in order:",
          actions: [
            "🎬 SLIDE 1 · TEAM & NAME — product name, team name, one strong image (CAD render or prototype photo), one line on what it is",
            "😫 SLIDE 2 · THE PROBLEM — make the judges FEEL it: a photo, a true story, or one hard-hitting number. End with the question your product answers",
            "💡 SLIDE 3 · THE SOLUTION — your product, big. What it does in 2–3 bullets, and what makes it different",
            "🛠️ SLIDE 4 · HOW WE BUILT IT — the week in one slide: CAD screenshot, circuit photo, AI draft vs. YOUR final",
            "💰 SLIDE 5 · THE BUSINESS — who buys it (be specific!), cost to make, your price, and your ask ('We're seeking $200 to print our first 50 units')",
          ],
          tip: "Judges love seeing the journey — slide 4 is where your checkpoint photos from all week become pitch material.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Pitch materials screenshot",
          text: "Screenshot your strongest slide — usually the problem or solution slide. Caption: your team name and the problem you chose.",
        }),

        block("heading", { text: "The 30-second hook" }),
        block("text", {
          kind: "create",
          minutes: 10,
          text: "If the whole pitch had to fit in 30 seconds, what survives? Nail the short version and the long version gets sharper. Fill in the blanks:\n\n\"Have you ever ___[the problem, as a question they'll say YES to]___?\nWe're ___[team name]___, and we built ___[product name]___ — a ___[what it is in five words]___.\nIt ___[the one thing it does best]___.\nWe made it real this week with ___[CAD / 3D printing / code / AI]___,\nand we believe every ___[who needs it]___ in Abaco should have one.\"",
          actions: [
            "Fill in every blank with your team",
            "Say it out loud three times",
            "Cut every word you stumble on",
          ],
          tip: "Investors — and judges — remember the team that can say it simply.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: 30-second pitch",
          text: "Press record and deliver your 30-second pitch — problem, product, why it matters. One take is fine; real beats perfect. (Bonus: this recording IS practice for the stage.)",
        }),

        block("heading", { text: "The demo — nothing beats a real thing" }),
        block("text", {
          kind: "build",
          minutes: 15,
          text: "Judges holding your 3D print beats any slide. Plan the demo like a pit crew:",
          actions: [
            "WHAT: pick the single best 60 seconds — print in hand, circuit responding, game playing, website live",
            "WHO: one teammate DRIVES the demo, another NARRATES — decide now, not on stage",
            "BACKUP: screenshot everything now, in case the live demo dies",
            "HANDOFF: practice physically passing the prototype to the judges",
          ],
          warn: "Tech fails on stage — it's a law of nature. When it does, you calmly show the photos and keep talking. That recovery impresses judges more than a perfect demo.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Prototype photo",
          text: "Photo of your prototype demo-ready — or your full team with prototype in hand. This is the cover shot of your camp portfolio!",
        }),

        block("heading", { text: "Rehearse like it's real" }),
        block("text", {
          kind: "build",
          minutes: 20,
          text: "Two full run-throughs, minimum. The drill:",
          actions: [
            "⏱️ Time it — under 5 minutes or judges cut you off",
            "🗣️ Every teammate speaks — hand off with names ('…and Maya will show you how we built it')",
            "👀 Eyes up — talk to the judges, not the screen. Notes = one card, bullet words only",
            "❓ Prep the three questions judges always ask: cost to make? who did what? what's next?",
          ],
          tip: "Then breathe. You built something real this week. The pitch is just showing it.",
        }),

        block("heading", { text: "After the pitch — reflect on the week" }),
        wrapUpPrompt(
          "This one's about the WHOLE week: what you built, the moment you're proudest of, and what you want to learn next.",
        ),
      ]),
      criteria: {
        create: [
          photoCriterion(0, "Pitch materials screenshot", "A key slide from the five-slide deck: team, problem, or solution."),
          audioCriterion(1, "Voice note: 30-second pitch", "The team's 30-second pitch: problem, solution, why it matters."),
          photoCriterion(2, "Prototype photo", "The physical or on-screen prototype, demo-ready."),
          wrapUpCriterion(3, "Written reflection on the whole week of camp."),
        ],
      },
  });
  const [k1, k2, k3, k4, k5, k6, k7, k8, k9, k10, k11, k12, k13, k14, k15] = await createKnexModules(projectModule);

  const modules = [module1, fc2, fc3, module2, cad2, e1, e2, e3, e4, e5, e6, e7, e8, module4, module5, module6, k1, k2, k3, k4, k5, k6, k7, k8, k9, k10, k11, k12, k13, k14, k15];

  if (UPDATE) {
    // Sync class assignments to the seed's module list and order.
    const klass = await prisma.class.findFirst({ where: { orgId: org.id, classCode: CLASS_CODE } });
    if (!klass) throw new Error("Class not found — run the full seed once first.");
    await syncClassModules(prisma, klass.id, modules);
  } else {
    await prisma.class.create({
      data: {
        orgId: org.id,
        name: CLASS_NAME,
        classCode: CLASS_CODE,
        band: "TEEN",
        minAuthTier: 0, // open self-registration: name + selfie, like the camp
        modules: {
          create: modules.map((m, i) => ({ moduleId: m.id, order: i })),
        },
      },
    });

    await prisma.instructor.create({
      data: { ...INSTRUCTOR, orgId: org.id },
    });
  }

  await checkCheckpoints(prisma, modules);

  console.log("Abaco Future Ready Academy seeded (learner-ready content).");
  console.log(`  Class: ${CLASS_NAME} — code ${CLASS_CODE}, empty roster, students self-register (name + selfie)`);
  console.log(`  Modules assigned (all ${modules.length}, in order):`);
  for (const m of modules) console.log(`    ${m.badgeIcon} ${m.title} → "${m.badgeName}" badge`);
  console.log("  Each project module: quick checkpoints + a written wrap-up; every project earns a badge.");
  console.log(`  Instructor: ${INSTRUCTOR.email} / PIN ${INSTRUCTOR.pin}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
