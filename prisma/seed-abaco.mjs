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
// Re-run any time to reset:   npm run seed:abaco
//
// ⚠️  Re-running DELETES all student work in this org. Don't run mid-camp.

import { PrismaClient } from "@prisma/client";
import { wipeOrg } from "./org-wipe.mjs";

const prisma = new PrismaClient();

const INSTRUCTOR = {
  displayName: "Coach Crachad",
  email: "crachad.laing@gmail.com",
  pin: "4321",
};

const ORG_NAME = "Abaco Future Ready Academy";
const CLASS_NAME = "STEM & AI Camp";
const CLASS_CODE = "FUTURE";

const block = (type, props) => ({ type, ...props });

// Every module ends the same way: a written wrap-up built on the playbook's
// three reflection questions.
const wrapUpPrompt = (extra = "") =>
  block("prompt", {
    text:
      "Last step — your written wrap-up. Answer the three questions: What worked? What challenged you? What would you improve?" +
      (extra ? " " + extra : "") +
      " Then your portfolio builds itself from everything you captured today.",
  });

const wrapUpCriterion = (order, description) => ({
  label: "Written wrap-up",
  description,
  checkType: "AUTO",
  required: true,
  order,
});

const photoCriterion = (order, label, description) => ({
  label,
  description,
  checkType: "AUTO",
  requiresEvidenceType: "PHOTO",
  required: true,
  order,
});

const audioCriterion = (order, label, description) => ({
  label,
  description,
  checkType: "AUTO",
  requiresEvidenceType: "AUDIO",
  required: true,
  order,
});

async function main() {
  console.log("Seeding Abaco Future Ready Academy (org-scoped — other orgs untouched)…");
  await wipeOrg(prisma, "Winners Camp"); // retire the old camp org + its users
  await wipeOrg(prisma, ORG_NAME);

  const org = await prisma.org.create({
    data: { name: ORG_NAME, context: "community" },
  });

  // ==========================================================================
  // MODULE 1 — Foundations of Coding
  // Spine: a complete Scratch chase game, block by block. Intermediate and
  // advanced tracks get their own concrete steps at each stage.
  // ==========================================================================
  const module1 = await prisma.module.create({
    data: {
      orgId: org.id,
      title: "Module 1 — Foundations of Coding",
      summary:
        "Build a real game today: a chase game in Scratch — or a webpage, or Swift — using events, loops, and variables like a real programmer.",
      badgeName: "Code Explorer",
      badgeIcon: "💻",
      badgeDescription:
        "Built and extended an interactive program using algorithms, sequencing, events, and loops.",
      contentJson: JSON.stringify([
        block("heading", { text: "You're a programmer today" }),
        block("text", {
          text: "Every app, game, and website started as an idea in someone's head — then they wrote instructions a computer could follow. That's all code is: exact instructions, in exact order.\n\nToday you build a real GAME: a chase game where you steer a character with the arrow keys to catch something that keeps escaping. Score counter included. By the end you'll have used the four big ideas of programming — events, sequencing, loops, and variables — without even noticing.",
        }),

        block("heading", { text: "Pick your track" }),
        block("text", {
          text: "The next steps walk you through the Scratch build, click by click. If you've coded before, pick a bigger challenge — every step also has your version:\n\n🟢 BEGINNER · Scratch — drag-and-drop blocks. Start here if you're new. This is the main path.\n\n🟡 INTERMEDIATE · Web (HTML/CSS/JavaScript) — real code in the browser. Open codepen.io and click Start Coding (no account needed).\n\n🔴 ADVANCED · Swift Playgrounds — Apple's real programming language. Open the Swift Playgrounds app → 'Get Started with Code'.",
        }),

        block("heading", { text: "Step 1 — Set the stage" }),
        block("text", {
          text: "🟢 Scratch: Go to scratch.mit.edu and click Create. You'll see the cat sprite and an empty stage.\n1. Bottom-right, click the round Choose a Backdrop button and pick one you like.\n2. Hover the cat-face Choose a Sprite button, click the magnifying glass, and add a SECOND sprite — something catchable (Star, Butterfly, Crab…).\n3. Drag your two sprites apart so they're not touching.\n\n🟡 Web: In CodePen, type this in the HTML panel:\n<h1>Catch the Star</h1>\n<button id=\"star\">⭐</button>\n<p>Score: <span id=\"score\">0</span></p>\n\n🔴 Swift: Complete the first two pages of 'Get Started with Code' (Commands, then Functions) — moveForward(), turnLeft(), collectGem().",
        }),

        block("heading", { text: "Step 2 — Events: make the arrow keys work" }),
        block("text", {
          text: "An EVENT is 'WHEN this happens, DO that'. Every game is a pile of events.\n\n🟢 Scratch: Click the CAT, then the Code tab. From the yellow Events drawer, drag out 'when [space] key pressed' — then change [space] to [right arrow]. Snap on two blue Motion blocks. Build exactly this stack:",
        }),
        block("scratch", {
          text: "when [right arrow v] key pressed\npoint in direction (90)\nmove (10) steps",
        }),
        block("text", {
          text: "Now make three more stacks, one per arrow key:\n• left arrow → point in direction -90 → move 10 steps\n• up arrow → point in direction 0 → move 10 steps\n• down arrow → point in direction 180 → move 10 steps\nTest it: click the stage, press the arrows. Your cat obeys you. If it flips upside down going left: click the sprite's Direction and choose the left-right arrows icon.\n\n🟡 Web: In the JS panel:\ndocument.getElementById(\"star\").onclick = function () {\n  alert(\"Caught me? Not yet!\");\n};\nClick the button — that's an event handler.\n\n🔴 Swift: Do the For Loops page. Notice: 'for i in 1...4' is Scratch's 'repeat 4' in real syntax.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Program running screenshot",
          text: "Screenshot your program running — Scratch: your cat mid-move with your event blocks visible on the right. Web: your page with the button. Swift: a completed puzzle. This is proof the computer is following YOUR instructions.",
        }),

        block("heading", { text: "Step 3 — Loops: make the star run away" }),
        block("text", {
          text: "A LOOP repeats instructions so you don't have to. 'Forever' is the heartbeat of every game — the game loop.\n\n🟢 Scratch: Click your STAR sprite (its code is separate from the cat's!) and build this:",
        }),
        block("scratch", {
          text: "when green flag clicked\nforever\nglide (1) secs to (random position v)\nend",
        }),
        block("text", {
          text: "Click the green flag. The star now teleport-glides forever — try to catch it with your cat. Too hard? Change 1 sec to 2. Too easy? 0.5.\n\n🟡 Web: Make the star run away in JS:\nconst star = document.getElementById(\"star\");\nsetInterval(function () {\n  star.style.position = \"absolute\";\n  star.style.left = Math.random() * 300 + \"px\";\n  star.style.top = Math.random() * 300 + 100 + \"px\";\n}, 1000);\nsetInterval = a loop that runs every 1000 milliseconds.\n\n🔴 Swift: Do the While Loops page — 'keep going until a condition changes'.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: explain a loop",
          text: "Press record and answer in your own words: What is a loop, and where does YOUR game use one? What would you have to do if loops didn't exist?",
        }),

        block("heading", { text: "Step 4 — Variables: keep score" }),
        block("text", {
          text: "A VARIABLE is a box with a name that stores a number that can change. Score, lives, high score, speed — all variables.\n\n🟢 Scratch: Orange Variables drawer → Make a Variable → name it: score\nThen on the STAR sprite, build this (the 'touching' block lives in light-blue Sensing):",
        }),
        block("scratch", {
          text: "when green flag clicked\nset [score v] to (0)\nforever\nif <touching (Cat v)?> then\nchange [score v] by (1)\nstart sound (Pop v)\ngo to (random position v)\nend\nend",
        }),
        block("text", {
          text: "Play it! Every catch: +1, pop, and the star escapes. You just wrote game logic: a loop, checking a condition, updating a variable.\n\n🟡 Web: Add scoring to your click handler:\nlet score = 0;\nstar.onclick = function () {\n  score = score + 1;\n  document.getElementById(\"score\").textContent = score;\n};\n\n🔴 Swift: Do the Variables page, then keep a gem count as you solve.",
        }),

        block("heading", { text: "Step 5 — Extend challenge: make it YOURS" }),
        block("text", {
          text: "Creativity over correctness. Add at least ONE feature nobody told you exactly how to build (experimenting and half-breaking things is the point):\n\n• A 30-second timer — hint: make a 'time' variable, set to 30, forever: wait 1 second, change by -1, and 'if time = 0 then stop all'.\n• A second escaping sprite worth 5 points.\n• A 'speed boost' — the star glides faster every 5 points.\n• Sound and costume effects on every catch.\n• Web track: make the star SHRINK every catch, or dodge AWAY from your mouse.\n• Swift track: finish the Conditional Code page and use if/else in a puzzle.\n\nStuck? Ask yourself the two debugging questions: 'What did I expect this block to do?' and 'What happened instead?' The gap between those answers is where the bug lives.",
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
    },
  });

  // ==========================================================================
  // MODULE 2 — Computer-Aided Design & Manufacturing
  // Spine: skill-builder keychain with exact measurements (proven at camp),
  // then apply the same skills to a chosen product.
  // ==========================================================================
  const module2 = await prisma.module.create({
    data: {
      orgId: org.id,
      title: "Module 2 — CAD & Manufacturing",
      summary:
        "Learn real CAD moves in Tinkercad with exact measurements, then design your own printable product — keychain, fidget, phone stand, or a hurricane-resilience tool.",
      badgeName: "Product Designer",
      badgeIcon: "🧊",
      badgeDescription:
        "Designed a 3D-printable product in CAD using shapes, alignment, grouping, holes, and real measurements.",
      contentJson: JSON.stringify([
        block("heading", { text: "From idea to object" }),
        block("text", {
          text: "Yesterday you made a screen do things. Today you make a THING. CAD (computer-aided design) is how every manufactured product around you started — designed on screen, measured exactly, then made real. The 3D printer builds your design by melting plastic and stacking it layer by layer, bottom to top, 0.2 mm at a time.\n\nFirst you'll learn the five core CAD moves on a quick build. Then you'll use them to design your own product for the printer.",
        }),

        block("heading", { text: "Step 1 — Get set up in Tinkercad" }),
        block("text", {
          text: "1. Go to tinkercad.com and sign in (use the class login if your coach gave one).\n2. Click + Create → 3D Design. You're looking at the blue workplane — the printer's bed.\n3. Learn the camera in 20 seconds: RIGHT-drag to orbit around, scroll to zoom, press F to frame whatever's selected. Try all three now.\n\nOne rule all day: TYPE your measurements, never eyeball them. Manufacturing runs on exact numbers.",
        }),

        block("heading", { text: "Step 2 — Skill builder: the tag" }),
        block("text", {
          text: "Quick build to learn the moves — a name tag keychain:\n\n1. Drag a red Box onto the workplane.\n2. Click it, then click a white corner handle and look at the little number boxes: type Length 60, Width 22, Height 3.\n3. In the shape panel (top right), set Radius to 3 — the corners round off. Smooth corners aren't just pretty; sharp printed corners snag and crack.\n\nThat's move #1: exact dimensions.",
        }),

        block("heading", { text: "Step 3 — Raised text + perfect centering" }),
        block("text", {
          text: "1. From the shapes panel, drag the TEXT shape onto your tag and type YOUR name in the shape panel.\n2. Set its Height to 4. Your tag is 3 tall, so the letters rise exactly 1 mm above the face — enough to see and feel, not enough to snap off.\n3. Shrink the text with a corner handle until it fits with a border around it.\n4. Now the pro move — ALIGN: select both shapes (drag a box around everything, or Ctrl/Cmd+A), press L, then click the two middle dots. Dragging by eye is never centered. Align always is.\n\nMoves #2 and #3: combining shapes, aligning precisely.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Design in progress screenshot",
          text: "Screenshot your tag with your raised name centered on it, shape panel visible so the measurements show.",
        }),

        block("heading", { text: "Step 4 — Holes and grouping" }),
        block("text", {
          text: "1. Drag a Cylinder onto the workplane. Set it to 4 × 4 × 10.\n2. In the shape panel, switch it from Solid to HOLE — it turns see-through. Hole shapes CUT instead of add.\n3. Move it into the top-left corner of your tag, clear of the letters. If it floats above the tag, press D — that drops any shape flat onto the workplane so the hole cuts all the way through.\n4. Select everything (Ctrl/Cmd+A) and Group (Ctrl/Cmd+G). One solid piece, with a keyring hole through it.\n\nMoves #4 and #5: holes and grouping. That's the whole CAD toolkit — everything else is combinations.",
        }),

        block("heading", { text: "Step 5 — Tolerances: the secret of parts that FIT" }),
        block("text", {
          text: "Here's what separates a model that looks right from a product that works:\n\nIf a printed peg must fit a printed hole, they can NOT be the same size — plastic isn't perfect, and same-size parts jam solid. Designers leave a small gap called CLEARANCE: about 0.5 mm all the way around. A 10 mm peg gets a 10.5–11 mm hole. A lid for a 50 mm box is 51 mm inside.\n\nA keyring needs the same thinking: our hole is 4 mm because a keyring wire is ~1–2 mm — room to thread and swing. If the hole were exactly wire-sized, you could never get the ring in.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: measurements matter",
          text: "Press record and answer: Why can't a printed peg and its hole be exactly the same size? What's clearance, and what would happen without it?",
        }),

        block("heading", { text: "Step 6 — Now design YOUR product" }),
        block("text", {
          text: "Pick ONE and build it with the five moves you just learned. Sketch on paper first — two minutes, boxes and circles are fine. Real designers always start on paper.\n\n🔑 CUSTOM KEYCHAIN — evolve your tag: different outline (try the Heart or Star shapes), an emoji-style icon from the shape library, engraved text (make the TEXT a Hole, sink it 1 mm).\n\n📱 PHONE STAND — Box 1: base, 70 × 90 × 8. Box 2: back rest, 70 × 80 × 8 — select it, grab the curved rotate arrow, and rotate it back 25° (type the number!), then plant it on the base. Box 3: a lip on the base front, 70 × 8 × 12, so the phone can't slide off. Align everything on the center line, group, done. Test-fit against a real phone before you print!\n\n🌀 FIDGET — a spinning disc: Cylinder 45 × 45 × 6 with sides maxed for smoothness, a 12 mm center hole, and 4–6 small holes or shapes arranged around the edge for grip. Or stack + group any satisfying shape sandwich — just keep it ≥ 6 mm thick so it feels solid.\n\n🌀🏠 HURRICANE-RESILIENCE TOOL — something that helps your community prepare or recover. Ideas: an emergency whistle keychain (Tube shape + small mouthpiece box + air slot hole — loud and always on your keys), a labeled clip for sealing supply bags (two 60 × 10 × 4 arms), a name tag for emergency kits and coolers. Design for real use: chunky, ≥ 3 mm walls, nothing delicate.",
        }),

        block("heading", { text: "Step 7 — The manufacturer's checklist" }),
        block("text", {
          text: "Before ANY design goes to the printer, run this exact checklist (real factories do the same):\n\n✅ Nothing floating — every part sits ON the workplane (select, press D).\n✅ Nothing thinner than 2 mm — thin parts snap.\n✅ Bottom is flat — it prints without supports.\n✅ Everything that should be one piece is Grouped.\n✅ Check it from the top, front, and side views (click the view cube corners).\n\nThen: Export (top right) → .STL → save with your name in the filename → drop it in the class print queue. The printer is the bottleneck — export as soon as you're happy!",
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
    },
  });

  // ==========================================================================
  // MODULE 3 — Programmable Electronics
  // Spine: built-in LED blink → external LED → push button, with real wiring
  // and real sketches. Wokwi simulator path throughout.
  // ==========================================================================
  const module3 = await prisma.module.create({
    data: {
      orgId: org.id,
      title: "Module 3 — Programmable Electronics",
      summary:
        "Wire it, code it, fix it: make LEDs blink, read a real button, and debug like an engineer — on a real Arduino or free in the browser.",
      badgeName: "Circuit Builder",
      badgeIcon: "⚡",
      badgeDescription:
        "Wired and programmed working Arduino circuits with inputs and outputs, and debugged them hands-on.",
      contentJson: JSON.stringify([
        block("heading", { text: "Code you can touch" }),
        block("text", {
          text: "So far your code lived on a screen. Today it controls electricity.\n\nAn Arduino is a tiny computer the size of a cracker. It reads INPUTS (buttons, sensors) and switches OUTPUTS (LEDs, motors, buzzers). Your microwave, a game controller, a traffic light — inside, they all work exactly like what you build today.\n\nNo Arduino at your station? No problem: wokwi.com simulates everything free in the browser — click 'Arduino Uno' under Starter Templates and you get a virtual board, parts, and code editor. Every step today works there too.",
        }),

        block("heading", { text: "Safety first — every single time" }),
        block("text", {
          text: "Three rules, no exceptions:\n\n1. Wire with the power OFF (USB unplugged). Plug in only after you've checked the circuit.\n2. Check POLARITY: electricity flows + to −, and some parts only work one way. An LED's LONG leg is + (positive); the short leg goes to ground (GND).\n3. LEDs always get a resistor (220 Ω — red-red-brown stripes). Without it, the LED burns out. The resistor is a speed bump for electricity.\n\nAnd the volunteer rule applies to you too: read the diagram YOURSELF. The person who wires the circuit is the person who learns.",
        }),

        block("heading", { text: "Step 1 — First blink (no wiring needed)" }),
        block("text", {
          text: "The Arduino has a tiny LED built into the board, wired to pin 13. Let's control it:\n\n1. Open the Arduino IDE (arduino.cc/en/software) — or your Wokwi project.\n2. Plug in the board via USB (IDE: Tools → Board 'Arduino Uno', Tools → Port → the one that mentions USB).\n3. Type the sketch below, then click Upload (the → arrow). In Wokwi, just press the green Play button.\n\nWatch the little LED marked 'L' blink once per second. You are now programming hardware.",
        }),
        block("code", {
          text: "void setup() {\n  pinMode(13, OUTPUT);   // pin 13 will push power out\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);  // LED on\n  delay(1000);             // wait 1000 ms = 1 second\n  digitalWrite(13, LOW);   // LED off\n  delay(1000);\n}",
        }),
        block("text", {
          text: "Now OWN it — change the numbers and re-upload:\n• delay(100) → panic blink.\n• delay(2000) → lighthouse.\n• Make a heartbeat: two quick blinks, then a long pause (hint: you'll need four digitalWrite lines and four delays).\n\nNotice: loop() runs forever — it's the same 'forever' loop from your Scratch game. delay(1000) is a variable you're tuning. Same ideas, new world.",
        }),
        block("heading", { text: "No board yet? Try it RIGHT HERE" }),
        block("embed", {
          url: "https://wokwi.com/projects/new/arduino-uno",
          text: "A live Arduino simulator with the Blink sketch preloaded — press the green ▶ Play button and watch the on-board LED. Change the delays and press Play again. This is Wokwi (wokwi.com); everything today also works in here.",
        }),

        block("heading", { text: "Step 2 — Wire a REAL LED" }),
        block("text", {
          text: "Now bring the blink off the board. Unplug the USB first!\n\nBreadboard secret: the 5 holes in each numbered row are connected inside. Two parts in the same row = wired together.\n\n1. Push the LED into the breadboard: long leg in row 10, short leg in row 12.\n2. Resistor (220 Ω): one end in row 10 (same row as the long leg), other end in row 5.\n3. Jumper wire from Arduino pin 8 → row 5.\n4. Jumper wire from Arduino GND → row 12.\nThe path: pin 8 → resistor → long leg → LED → short leg → GND.\n\n5. In your sketch, change BOTH 13s to 8. Plug in, upload — your first real circuit blinks. (Wokwi: click +, add LED and resistor, wire the same way by dragging.)",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Working circuit photo",
          text: "Photo of your circuit with the LED lit or mid-blink — wiring visible. Wokwi screenshots count! Caption: which pin you used.",
        }),

        block("heading", { text: "Step 3 — When it doesn't work (and it won't)" }),
        block("text", {
          text: "Circuits fail in honest ways. When yours does, DON'T shotgun random changes — hunt in order, one check at a time:\n\n1. Power: is the board's ON light lit?\n2. Polarity: is the LED's long leg on the resistor side? (Backwards LED = nothing, forever.)\n3. Rows: are the parts REALLY in the rows you think? Count the holes.\n4. Code: does the pin number in the sketch match the pin the wire is actually in?\n5. The part: swap in a different LED — parts do die.\n\nThat patient hunt is the actual skill. Engineers call it debugging; it's most of the job.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: debugging story",
          text: "Press record and tell today's debugging story: what didn't work, and how you tracked it down step by step? (Nothing broke? Then explain which of the five checks you'd run first and why.)",
        }),

        block("heading", { text: "Step 4 — Inputs: read a push button" }),
        block("text", {
          text: "Time for the other half: INPUT. Unplug, then:\n\n1. Push the button across the breadboard's center gap (legs in rows 20 and 22).\n2. Jumper from pin 2 → row 20.\n3. Jumper from GND → row 22.\n\nKeep your LED on pin 8, and upload this sketch:",
        }),
        block("code", {
          text: "void setup() {\n  pinMode(8, OUTPUT);\n  pinMode(2, INPUT_PULLUP);   // button pin; PULLUP = no extra resistor needed\n}\n\nvoid loop() {\n  if (digitalRead(2) == LOW) {   // LOW means PRESSED (pullup logic is flipped)\n    digitalWrite(8, HIGH);\n  } else {\n    digitalWrite(8, LOW);\n  }\n}",
        }),
        block("text", {
          text: "Hold the button: light. Release: dark. You've built the complete loop every smart device runs: sense → decide → act.\n\nLevel up if there's time:\n🚦 TRAFFIC LIGHT — red, yellow, green LEDs on pins 8, 9, 10 (each with its own resistor + GND). Sequence them with digitalWrite + delay: green 5 s → yellow 2 s → red 5 s, forever.\n🌡️ TEMPERATURE LOGGER — TMP36 sensor: flat side facing you, legs = 5V, A0, GND. Read with analogRead(A0), print with Serial.println(), watch live in Tools → Serial Monitor. Pinch the sensor and watch the number rise!",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Extended project photo",
          text: "Photo of your input build working — button, traffic light, or sensor — code visible on screen if you can. Caption: which one you built.",
        }),

        block("heading", { text: "Reflect & share" }),
        wrapUpPrompt("Include the moment something finally worked — what fixed it?"),
      ]),
      criteria: {
        create: [
          photoCriterion(0, "Working circuit photo", "A powered, working LED circuit (external LED, wired with resistor) — real or simulated."),
          audioCriterion(1, "Voice note: debugging story", "A debugging story: what failed and the step-by-step hunt that found it."),
          photoCriterion(2, "Extended project photo", "The input build: push button, traffic light, or temperature sensor."),
          wrapUpCriterion(3, "Written reflection on building and debugging hardware."),
        ],
      },
    },
  });

  // ==========================================================================
  // MODULE 4 — Virtual & Augmented Reality
  // Concrete missions per app, then a creation with a no-headset fallback.
  // ==========================================================================
  const module4 = await prisma.module.create({
    data: {
      orgId: org.id,
      title: "Module 4 — Virtual & Augmented Reality",
      summary:
        "Three guided expeditions — deep ocean, deep space, deep history — then design an immersive experience of your own.",
      badgeName: "Reality Explorer",
      badgeIcon: "🥽",
      badgeDescription:
        "Explored immersive VR/AR experiences and connected them to real-world fields where the technology changes the work.",
      contentJson: JSON.stringify([
        block("heading", { text: "Go somewhere impossible" }),
        block("text", {
          text: "Today you don't look at a screen — you step through it. Immersive tech puts you places no bus can take you: the surface of Mars, inside a beating heart, a city from 500 years ago.\n\nThe plan: three short expeditions with specific missions, then YOU become the builder and design an immersive experience of your own. As you explore, keep one question running: what makes this feel REAL — the scale? the sound? being able to look anywhere?",
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
          text: "Google Arts & Culture: artsandculture.google.com\n\nYour missions (10 minutes):\n1. Search 'Machu Picchu' → open the Street View-style tour and walk the terraces. Look UP.\n2. Search 'Great Barrier Reef' — dive it.\n3. Free choice: find one place or museum that connects to something YOU care about (search anything — 'space', 'sharks', 'Junkanoo', 'pyramids').\n\nAs you go: which of these could a classroom in Abaco never visit in person — and now just did?",
        }),

        block("heading", { text: "Expedition 2 — The solar system, live" }),
        block("text", {
          text: "NASA Eyes: eyes.nasa.gov → 'Eyes on the Solar System'\n\nThis isn't animation — it's live NASA data. Your missions (10 minutes):\n1. Fly to Mars: search Mars, then zoom until you can see surface features.\n2. Find a real spacecraft: search 'Perseverance' — that rover is on Mars RIGHT NOW; this is where it is.\n3. Use the time slider (bottom) to fast-forward the planets a year in ten seconds.\n4. On the way back: visit Earth and find the Bahamas from space.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Expedition screenshot",
          text: "Screenshot the most surprising place you visited on either expedition. Caption: where you are and what surprised you.",
        }),

        block("heading", { text: "Where does immersive tech change real work?" }),
        block("text", {
          text: "Now think like a builder, not a tourist. Real examples happening today:\n\n🏥 MEDICINE — surgeons rehearse a rare operation in VR the night before touching the patient. Mistake cost: zero.\n🏗️ ARCHITECTURE — clients walk through a building that doesn't exist yet and say 'move that wall' before concrete is poured.\n🎓 EDUCATION — a school that can't afford a lab dissects a virtual heart, visits Mars at 9am and the reef at 10.\n⚙️ ENGINEERING — mechanics learn a jet engine by pulling apart a virtual one that can't break.\n🎬 ENTERTAINMENT — concerts and games happen in places that could never physically exist.\n\nThe pattern: immersive tech wins wherever 'being there' beats 'reading about it' — and where real practice is expensive, dangerous, or impossible.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: immersive tech at work",
          text: "Press record: pick ONE field — education, medicine, engineering, architecture, or entertainment — and explain how immersive tech changes how that work gets done. Give one concrete example (borrow one of ours or invent your own).",
        }),

        block("heading", { text: "Create — design YOUR immersive experience" }),
        block("text", {
          text: "Consumers visit worlds; creators build them. Your build (pick by equipment):\n\n🎨 HEADSET OR TABLET: Open Brush (openbrush.app) — paint in 3D. Build one scene: a reef, your street, a creature, an invention. Walk around it as you paint.\n\n📋 NO HEADSET? Storyboard the VR experience YOU would build for your community — on paper or in Canva (canva.com → 'Storyboard'). Three panels:\n1. ARRIVE — the first thing visitors see and hear when they put on the headset.\n2. EXPLORE — what they can move toward, look inside, discover.\n3. DO — the one thing they can interact with (grab, press, change). Interaction is what makes VR different from a movie!\n\nIdea sparks: dive the reef before and after a hurricane · walk Marsh Harbour in 1920 · shrink to ant size in a garden · train boat-safety skills in a storm simulator.",
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
    },
  });

  // ==========================================================================
  // MODULE 5 — Artificial Intelligence & Digital Safety
  // Worked prompt examples, a concrete build flow, and a verification step.
  // ==========================================================================
  const module5 = await prisma.module.create({
    data: {
      orgId: org.id,
      title: "Module 5 — AI & Digital Safety",
      summary:
        "Learn what AI actually is, write prompts that work, verify what it tells you — then build a real project with AI that's still 100% yours.",
      badgeName: "AI Navigator",
      badgeIcon: "🤖",
      badgeDescription:
        "Used AI tools responsibly to assist a real project — strong prompts, verified output, and their own thinking on top.",
      contentJson: JSON.stringify([
        block("heading", { text: "What is AI, really?" }),
        block("text", {
          text: "In your own words, by end of day, you should be able to answer: What is AI? What is generative AI? What is a model?\n\nHere's the honest version:\n• An AI MODEL is a program that studied millions of examples (text, images, code) and learned the patterns in them.\n• GENERATIVE AI uses those patterns to produce NEW things — it predicts what should come next, word by word or pixel by pixel.\n• It doesn't 'know' facts the way you do. It predicts. That's why it can write a poem in seconds AND confidently state something false (people call these hallucinations).\n\nBoth halves matter: it's an astonishing tool, and it needs a human checking it. Today, that human is you.",
        }),

        block("heading", { text: "The rules that keep you safe" }),
        block("text", {
          text: "Non-negotiable, every AI tool, every time:\n\n🔑 Never share passwords.\n🙈 Never share personal information — your full name, address, school, phone number. Yours or anyone else's.\n✅ Verify AI-generated information before you trust or repeat it.\n©️ Respect copyright — AI output isn't automatically yours to use anywhere.\n🧠 AI assists your thinking — it doesn't replace it.\n\nOne more: if an AI conversation ever feels weird or too personal — close it and tell an adult. AI is a tool, not a friend.",
        }),

        block("heading", { text: "Your AI toolbox" }),
        block("text", {
          text: "Different tools, different strengths:\n\n💬 ChatGPT (chatgpt.com) — research, writing, code, brainstorming.\n📚 Claude (claude.ai) — long documents, careful reasoning, planning.\n🔍 Perplexity (perplexity.ai) — research WITH sources shown; great for fact-checking.\n🌐 v0 (v0.dev) — type a description, get a working website.\n🎨 Canva Magic Studio (canva.com) — AI design: posters, presentations, images.\n💎 Gemini (gemini.google.com) — Google ecosystem work.\n\nToday you'll use at least two: one to CREATE and one to VERIFY.",
        }),

        block("heading", { text: "Prompting is a skill — here's the anatomy" }),
        block("text", {
          text: "The AI can't read your mind; it can only read your prompt. Compare:\n\n❌ WEAK: \"make me a poster\"\n→ generic clip-art junk.\n\n✅ STRONG: \"Make a poster for a hurricane-preparedness kit aimed at families in Abaco, Bahamas. Bright beach colors, bold friendly style. Must include: a checklist of 5 essential items, a short memorable slogan, space at the bottom for a logo.\"\n→ something you can actually use.\n\nThe formula — four ingredients:\n1. WHAT you want (poster / webpage / plan / paragraph)\n2. WHO it's for (audience!)\n3. STYLE (colors, tone, mood)\n4. MUST-INCLUDES (the details that matter)\n\nAnd the fifth secret ingredient: ITERATE. Your second prompt ('make the slogan shorter, change blue to teal') matters more than your first.",
        }),

        block("heading", { text: "Build block — create your first draft" }),
        block("text", {
          text: "Pick a project — ideally something your Shark Tank team can actually use:\n\n📄 A poster or flyer for your product → Canva: search 'Magic Design', paste your prompt.\n🌐 A landing page for your product → v0.dev: describe the page ('A clean landing page for a student-invented storm whistle, with a hero section, 3 feature cards, and a big orange Get One button').\n🎤 Pitch help → ChatGPT or Claude: 'Give me 5 catchy name ideas and a 2-sentence pitch for [your product], aimed at [your audience].'\n\nWrite your prompt with all four ingredients. Generate. Don't fix anything yet — we want the raw first draft for your portfolio.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "AI first draft screenshot",
          text: "Screenshot the AI's FIRST draft, untouched. In the caption, paste the prompt you used — draft and prompt together tell the story.",
        }),

        block("heading", { text: "Iterate, then VERIFY" }),
        block("text", {
          text: "Round two:\n\n1. ITERATE — tell the AI two specific changes ('shorten the slogan to 5 words', 'make the colors match Bahamian flag colors'). Watch it improve. Specific beats vague, every time.\n\n2. VERIFY — find one FACT in your draft (a claim, a statistic, safety advice…). Check it: paste it into Perplexity (which shows sources) or find it on a trusted site (for hurricane facts, try nema.gov.bs or noaa.gov). If the AI got it wrong or made it up — congratulations, you caught a hallucination. Fix it in your draft and be proud: THAT's responsible AI use.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: what makes a good prompt",
          text: "Press record and answer: What makes a good prompt? Use YOUR before-and-after from today — what did you add or change that made the result better?",
        }),

        block("heading", { text: "Make it YOURS" }),
        block("text", {
          text: "The AI draft is raw material, not the finished work. Now add the part no AI has: what YOU know.\n\n• Fix what's generic — the AI has never been to Abaco; you live there. Swap the stock details for real ones.\n• Add your voice — the joke, the phrase, the design touch that sounds like you.\n• Apply your verification — the corrected facts.\n\nThe test: your final version should be BETTER than the AI's draft, and you should be able to point at exactly what you changed and why. That difference is your thinking — the thing AI assists but never replaces.",
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
    },
  });

  // ==========================================================================
  // MODULE 6 — Final Showcase (Shark Tank)
  // Slide-by-slide deck template, fill-in-the-blank pitch, rehearsal drill.
  // ==========================================================================
  const module6 = await prisma.module.create({
    data: {
      orgId: org.id,
      title: "Module 6 — Shark Tank Showcase",
      summary:
        "Turn the week into a pitch: a five-slide deck, a 30-second hook, a live demo — presented Shark Tank style to real judges.",
      badgeName: "Shark Tank Star",
      badgeIcon: "🦈",
      badgeDescription:
        "Presented a complete project — problem, solution, prototype, and business pitch — at the final showcase.",
      contentJson: JSON.stringify([
        block("heading", { text: "Showcase day" }),
        block("text", {
          text: "This week you coded, designed, wired, explored, and created with AI. Today your team puts it together and pitches it to judges — Shark Tank style.\n\nEvery pitch must cover six things:\n1. The PROBLEM you chose\n2. Your SOLUTION\n3. Your CAD model\n4. Your prototype\n5. The AI tools you used — and what YOU added on top\n6. The BUSINESS pitch — who needs this, and why would they pay?\n\nFormat: 3–5 minutes, every teammate speaks, then judges' questions. Judges will name one thing that worked and one thing to improve — that's how feedback is supposed to sound.",
        }),

        block("heading", { text: "Build the deck — five slides, no more" }),
        block("text", {
          text: "Open Canva → Presentation. Big pictures, few words — you are the show, slides are the backdrop. The template:\n\n🎬 SLIDE 1 — TEAM & NAME: product name, team name, one strong image (your CAD render or prototype photo!). One line: what it is.\n\n😫 SLIDE 2 — THE PROBLEM: make the judges FEEL it. A photo, a true story, or one hard-hitting number. End with the question your product answers.\n\n💡 SLIDE 3 — THE SOLUTION: your product, big. What it does in 2–3 bullet points, and what makes it different.\n\n🛠️ SLIDE 4 — HOW WE BUILT IT: your week in one slide — CAD screenshot, circuit photo, AI draft vs. YOUR final version. Judges love seeing the journey.\n\n💰 SLIDE 5 — THE BUSINESS: who buys it (be specific — 'families preparing hurricane kits', not 'everyone'), what it costs to make (3D print material is cheap — pennies per gram), what you'd charge, and your ask ('We're seeking $200 to print our first 50 units').",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Pitch materials screenshot",
          text: "Screenshot your strongest slide — usually the problem or solution slide. Caption: your team name and the problem you chose.",
        }),

        block("heading", { text: "The 30-second hook" }),
        block("text", {
          text: "If the whole pitch had to fit in 30 seconds, what survives? Nail the short version and the long version gets sharper. Fill in the blanks:\n\n\"Have you ever ___[the problem, as a question they'll say YES to]___?\nWe're ___[team name]___, and we built ___[product name]___ — a ___[what it is in five words]___.\nIt ___[the one thing it does best]___.\nWe made it real this week with ___[CAD / 3D printing / code / AI]___,\nand we believe every ___[who needs it]___ in Abaco should have one.\"\n\nSay it out loud three times. Cut every word you stumble on. Investors — and judges — remember the team that can say it simply.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: 30-second pitch",
          text: "Press record and deliver your 30-second pitch — problem, product, why it matters. One take is fine; real beats perfect. (Bonus: this recording IS practice for the stage.)",
        }),

        block("heading", { text: "The demo — nothing beats a real thing" }),
        block("text", {
          text: "Judges holding your 3D print beats any slide. Plan the demo like a pit crew:\n\n1. WHAT: pick the single best 60 seconds — the print in hand, the circuit responding, the game being played, the website live.\n2. WHO: one teammate DRIVES the demo while another NARRATES. Decide now, not on stage.\n3. BACKUP: tech fails on stage — it's a law of nature. Screenshot everything; if the live demo dies, you calmly show the photos and keep talking.\n4. HANDOFFS: practice the physical hand-over of the prototype to the judges. 'Pass it around — that clicked switch is a real keyboard switch we designed the housing for.'",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Prototype photo",
          text: "Photo of your prototype demo-ready — or your full team with prototype in hand. This is the cover shot of your camp portfolio!",
        }),

        block("heading", { text: "Rehearse like it's real" }),
        block("text", {
          text: "Two full run-throughs, minimum. The drill:\n\n⏱️ Time it — under 5 minutes or judges cut you off.\n🗣️ Every teammate speaks — hand off with names ('...and Maya will show you how we built it').\n👀 Eyes up — talk to the judges, not the screen. If you need notes, one card with bullet words, not sentences.\n❓ Prep for questions — judges always ask: 'How much would it cost to make?', 'Who did what on the team?', 'What would you do next?'. Decide your answers now.\n\nThen breathe. You built something real this week. The pitch is just showing it.",
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
    },
  });

  const modules = [module1, module2, module3, module4, module5, module6];

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

  // Sanity check: every checkpoint must reference an existing criterion label,
  // and every evidence-backed criterion must have a checkpoint.
  for (const mod of modules) {
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

  console.log("Abaco Future Ready Academy seeded (learner-ready content).");
  console.log(`  Class: ${CLASS_NAME} — code ${CLASS_CODE}, empty roster, students self-register (name + selfie)`);
  console.log("  Modules assigned (all 6, in weekly order):");
  for (const m of modules) console.log(`    ${m.badgeIcon} ${m.title} → "${m.badgeName}" badge`);
  console.log("  Each module: 2 photo checkpoints + 1 voice note + written wrap-up (3-question reflection).");
  console.log(`  Instructor: ${INSTRUCTOR.email} / PIN ${INSTRUCTOR.pin}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
