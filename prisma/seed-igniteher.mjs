// IgniteHer STEM Program — learner-ready seed.
// Forked from prisma/seed-abaco.mjs: same content library (Abaco Future Ready
// Academy's STEM & AI Camp curriculum), ported wholesale to a new org so
// IgniteHer gets its own instructors, class, and roster from day one. Content
// blocks below are intentionally identical to seed-abaco.mjs — if you're
// updating curriculum content, consider whether it should change in both.
//
// Six modules matching the weekly learning journey:
//   1 Foundations of Coding      → interactive programs
//   2 CAD & Manufacturing        → 3D-printed object
//   3 Programmable Electronics   → working Arduino or micro:bit project
//   4 VR & AR                    → immersive experience
//   5 AI & Digital Safety        → AI-assisted project
//   6 Final Showcase             → Shark Tank presentation
//
// ONLY touches the IgniteHer org — every other org is left alone.
//
// Two modes:
//   npm run seed:igniteher           — full reset. ⚠️  DELETES all student work. Never mid-program.
//   npm run content:update:igniteher — SAFE content update: modules are upserted in place
//                             (matched by title), learners and their work untouched.
//                             Renaming a module's title creates a NEW module —
//                             keep titles stable once the program starts.

import { PrismaClient } from "@prisma/client";
import { wipeOrg } from "./org-wipe.mjs";
import { createKnexModules } from "./knex-modules.mjs";
import { createRodocodoModule, createComputeItModule } from "./coding-modules.mjs";
import { electronicsModules } from "./electronics-modules.mjs";
import {
  block,
  wrapUpPrompt,
  wrapUpCriterion,
  photoCriterion,
  audioCriterion,
  textCriterion,
  moduleWriter,
  syncClassModules,
  checkCheckpoints,
} from "./seed-lib.mjs";

const prisma = new PrismaClient();

const INSTRUCTORS = [
  { displayName: "Coach Crachad", email: "crachad@lainglaing.com", pin: "1234" },
  { displayName: "Coach Pam", email: "pam@lainglaing.com", pin: "5678" },
];

const ORG_NAME = "IgniteHer";
const CLASS_NAME = "IgniteHer STEM Program";
const CLASS_CODE = "IGNITE";

// Safe content-update mode: upsert modules in place, never touch learners.
const UPDATE = process.argv.includes("--update");


async function main() {
  let org;
  if (UPDATE) {
    org = await prisma.org.findFirst({ where: { name: ORG_NAME } });
    if (!org) throw new Error("Org not found — run the full seed once first: npm run seed:igniteher");
    console.log("Content-update mode: upserting modules in place — learners and their work are untouched.");
  } else {
    console.log("Seeding IgniteHer (org-scoped — other orgs untouched)…");
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
  // Fidget clicker: the body is supplied with the light and battery missing —
  // learners place the two parts at exact heights. Each part is shown as a
  // spinnable 3D render (public/models/fidget-clicker/*.stl).
  // Title kept from the original product module — moduleWriter upserts by title.
  // ==========================================================================
  const module2 = await createModule({
      orgId: org.id,
      topic: "CAD & Manufacturing",
      title: "Design a 3D-Printable Product",
      summary:
        "Finish a light-up fidget clicker in Tinkercad: place the battery holder and the LED at exact heights, ready to print.",
      badgeName: "Product Designer",
      badgeIcon: "🧊",
      badgeDescription:
        "Completed a light-up fidget clicker in CAD by placing parts at exact measurements.",
      contentJson: JSON.stringify([
        block("heading", { text: "Light up the fidget clicker" }),
        block("model", {
          kind: "learn",
          minutes: 2,
          url: "/models/fidget-clicker/clicker-body.stl",
          text: "This is the fidget clicker — with the light and the battery missing. Your job: put them in, at exactly the right heights.",
          tip: "Drag the model to spin it, scroll to zoom.",
        }),
        block("link", {
          kind: "build",
          minutes: 1,
          text: "Join our Tinkercad class",
          url: "https://www.tinkercad.com/joinclass/JA9N6AAZE",
          tip: "This takes you straight into IgniteHer's Tinkercad class — no separate account setup needed.",
        }),

        block("heading", { text: "Step 1 — Battery Holder" }),
        block("model", {
          kind: "build",
          minutes: 5,
          url: "/models/fidget-clicker/battery-holder.stl",
          text: "Battery Holder — 7 mm above the workplane. The X and Y position doesn't matter.",
          actions: [
            "Select the Battery Holder",
            "Raise it so it sits 7 mm above the workplane",
          ],
        }),

        block("heading", { text: "Step 2 — LED" }),
        block("model", {
          kind: "build",
          minutes: 5,
          url: "/models/fidget-clicker/led.stl",
          text: "LED — 10 mm above the workplane. The X and Y position doesn't matter.",
          actions: [
            "Select the LED",
            "Raise it so it sits 10 mm above the workplane",
          ],
        }),
        block("heading", { text: "Compare with the finished clicker" }),
        block("model", {
          kind: "build",
          minutes: 3,
          url: "/models/fidget-clicker/final-clicker.stl",
          text: "This is the finished clicker with the battery holder and LED in place. Spin it and compare it with yours before you take your screenshot.",
          actions: [
            "Is your battery holder 7 mm above the workplane?",
            "Is your LED 10 mm above the workplane?",
            "Anything different? Fix it in Tinkercad, then come back",
          ],
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Print-ready design screenshot",
          allowModel: true,
          text: "Screenshot your fidget clicker with the battery holder and LED in place. BONUS: attach the .stl file you exported — your portfolio will show it as a spinnable 3D model!",
        }),

        block("heading", { text: "Reflect & share" }),
        wrapUpPrompt(),
      ]),
      criteria: {
        create: [
          photoCriterion(0, "Print-ready design screenshot", "The fidget clicker with the battery holder at 7 mm and the LED at 10 mm above the workplane."),
          wrapUpCriterion(1, "Written reflection on the design-and-make process."),
        ],
      },
  });

  // A small project module: one project, its own badge, its own checkpoints.
  // `board` only matters for topics that span more than one hardware track
  // (Programmable Electronics: arduino vs microbit) — everything else can
  // leave it at the default.
  const projectModule = ({ topic, board = "arduino", title, summary, badgeName, badgeIcon, badgeDescription, blocks, criteria }) =>
    createModule({
      orgId: org.id,
      topic,
      board,
      title,
      summary,
      badgeName,
      badgeIcon,
      badgeDescription,
      contentJson: JSON.stringify(blocks),
      criteria: { create: criteria },
    });

  // ==========================================================================
  // MODULE 3 — Programmable Electronics
  // Both tracks (8 Arduino + 8 micro:bit projects) from the shared spine in
  // prisma/electronics-modules.mjs — KCSB seeds the same projects.
  // ==========================================================================
  const electronics = [];
  for (const def of await electronicsModules()) electronics.push(await createModule(def));
  const [e1, e2, e3, e4, e5, e6, e7, e8, m1, m2, m3, m4, m5, m6, m7, m8] = electronics;

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
  // Removed from the class (2026-10-03) — still defined here so it can be
  // re-added to `modules` below; nothing assigns it while it's left out.
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
  // ==========================================================================
  // "Human in the Loop" — a growing topic that hosts every AI module. Builds
  // on MODULE 5's safety/prompting basics with focused, hands-on AI-building
  // projects. First one: prompt engineering by building a real playable game
  // with v0. More modules land under this same topic over time.
  // (Kept in sync with the same module in seed-abaco.mjs.)
  // ==========================================================================
  const HITL = "Human in the Loop";

  const hitl1 = await createModule({
      orgId: org.id,
      topic: HITL,
      title: "Prompt Engineer a Game",
      summary:
        "Build a real playable game by prompting v0 — write a strong first prompt, playtest it like an engineer, then iterate your way to something good.",
      badgeName: "Prompt Engineer",
      badgeIcon: "🕹️",
      badgeDescription:
        "Sketched a game concept as planning context, wrote a structured prompt to generate it with v0, playtested it, and iterated with specific follow-up prompts until it worked.",
      contentJson: JSON.stringify([
        block("heading", { text: "You're still the engineer" }),
        block("text", {
          kind: "learn",
          minutes: 3,
          text: "AI can now write working software from a description. That doesn't remove you from the loop — it changes your job. You're not typing every line anymore; you're the one deciding WHAT to build, judging what's wrong, and steering it there. That's PROMPT ENGINEERING, and it's a real skill, not luck.\n\nToday you'll build a real, playable game — not with blocks or by hand, but by prompting.",
          tip: "'Human in the loop' means a person stays in charge of checking and directing the AI's work, every step. You're that person today.",
        }),

        block("heading", { text: "Meet v0" }),
        block("text", {
          kind: "learn",
          minutes: 2,
          text: "v0.dev (by Vercel) turns a written description into a real, running web app — you type what you want, it writes the code and shows you a live preview you can click and play, right in the browser. No setup, no install.",
          tip: "You can always ask v0 to show you the code it wrote — you don't have to read it today, but it's there.",
        }),

        block("heading", { text: "Anatomy of a game prompt" }),
        block("text", {
          kind: "learn",
          minutes: 5,
          text: "Compare:\n\n❌ WEAK: \"make me a game\" → something generic, half-broken, not what you pictured.\n\n✅ STRONG: \"A whack-a-mole game. 9 holes in a 3x3 grid. A mole pops up in a random hole every 800ms and disappears after 1 second. Click a mole before it disappears to score a point. Show the score at the top. 30-second timer; when it hits 0, show 'Game Over' and a Restart button. Bright, cartoonish style.\" → something you can actually play.\n\nFive ingredients for a game prompt:\n1. WHAT — the exact mechanic (whack-a-mole, dodge the falling blocks, memory-match cards…)\n2. RULES — how you score, win, or lose\n3. CONTROLS — click, tap, arrow keys?\n4. STYLE — colors, mood, theme\n5. MUST-INCLUDES — score display, restart button, timer, title screen\n\nA quick sketch or diagram of your game before you type anything makes all five ingredients easier to nail down — you can't describe what you haven't pictured yet.",
          tip: "Specific numbers beat vague words. '800ms' beats 'fast'. '9 holes in a 3x3 grid' beats 'some holes'.",
        }),

        block("heading", { text: "Step 1 — Sketch it first" }),
        block("text", {
          kind: "create",
          minutes: 8,
          text: "Before you type a single word to v0, draw your game idea on paper — boxes, arrows, stick figures, whatever gets the idea out of your head. A sketch turns a vague 'a fun game' into specific details you can actually describe.",
          actions: [
            "Pick ONE small game you can realistically get working today: whack-a-mole, a reaction-time clicker, a memory-match card flip, a simple dodge-the-obstacle game",
            "Sketch the game screen: where's the play area, the score, any buttons",
            "Label the parts — what moves, what the player clicks or taps, what happens when they win or lose",
            "Circle the ONE mechanic that matters most — that becomes your WHAT",
          ],
          tip: "This is what engineers call a spec — a plan made before you build. Keep it next to you — you'll turn it straight into your prompt.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Context sketch photo",
          text: "Photo of your hand-drawn sketch or diagram — your game plan, made before you wrote any prompt.",
        }),

        block("heading", { text: "Step 2 — Prompt your first draft" }),
        block("text", {
          kind: "create",
          minutes: 15,
          text: "Go to v0.dev with your sketch next to you:",
          actions: [
            "Look back at your sketch — turn each labeled part into a sentence",
            "Write your prompt using all five ingredients — WHAT, RULES, CONTROLS, STYLE, MUST-INCLUDES",
            "Generate, and watch it build in the live preview pane",
            "Play it once. DON'T fix anything yet — we want the raw first draft for your portfolio",
          ],
          tip: "Keep the game idea SMALL. A tiny game that fully works beats an ambitious one that's half broken.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "First draft screenshot",
          text: "Screenshot v0's first generated game running in the preview pane. In the caption, paste the exact prompt you used.",
        }),

        block("heading", { text: "Playtest like an engineer" }),
        block("text", {
          kind: "build",
          minutes: 8,
          text: "Play your own game three times, hunting for problems — exactly like debugging a circuit or a sketch, just at a different layer.",
          actions: [
            "Play it 3 times. Make a short list of what's broken, missing, or confusing",
            "Rank your list — pick the TOP 2 problems to fix first",
            "For each one, describe EXACTLY what's wrong ('the score doesn't reset on Restart') — not just 'it's buggy'",
          ],
          tip: "A precise bug description IS most of the fix — for a human debugging OR an AI fixing it for you.",
        }),

        block("heading", { text: "Iterate — the real skill" }),
        block("text", {
          kind: "create",
          minutes: 15,
          text: "Fix your top problems one at a time. After each prompt, re-test before moving to the next:",
          actions: [
            "Send one specific follow-up prompt per fix: 'The score doesn't reset when I click Restart — fix that so it goes back to 0'",
            "Play again. Did it actually fix it, or just change something else?",
            "Repeat for your second problem",
            "Time allowing: ask for one enhancement, not just a fix — 'add a high score that persists between rounds'",
          ],
          tip: "A good first prompt is a lucky guess. A good FIFTH prompt — built on what you learned from playtesting — is a skill. That's the part that transfers to every AI tool you'll ever use.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: what you iterated and why",
          text: "Press record: describe one specific bug or gap you found playtesting, the follow-up prompt you used to fix it, and whether it actually worked on the first try.",
        }),

        block("heading", { text: "Make it yours" }),
        block("text", {
          kind: "create",
          minutes: 8,
          text: "v0 doesn't know you. Add the part it couldn't have generated on its own.",
          actions: [
            "Give it a real title and theme — not the generic one v0 picked",
            "Change one visual detail so it looks like YOUR game, not a template",
            "Set yourself a target score and try to beat it",
          ],
          tip: "The test: you should be able to point at exactly what YOU added or fixed, and why — that's your thinking on top of the AI's draft.",
        }),
        block("checkpoint", {
          capture: "photo",
          criterionLabel: "Final playable game screenshot",
          text: "Screenshot your finished game mid-play — score and your title/theme visible.",
        }),

        block("heading", { text: "Reflect & share" }),
        wrapUpPrompt(
          "Which prompt made the biggest difference — your very first one, or a later fix? What does that tell you about how AI-assisted building actually works?",
        ),
      ]),
      criteria: {
        create: [
          photoCriterion(0, "Context sketch photo", "A hand-drawn sketch or diagram planning the game's layout and mechanic, made before prompting."),
          photoCriterion(1, "First draft screenshot", "v0's first generated game, with the five-ingredient prompt used to create it."),
          audioCriterion(2, "Voice note: what you iterated and why", "A specific bug found playtesting, the fix prompt used, and whether it worked."),
          photoCriterion(3, "Final playable game screenshot", "The finished, playable game with the student's own title/theme and a visible score."),
          wrapUpCriterion(4, "Written reflection on which prompt mattered most and why."),
        ],
      },
  });

  // MODULE 6 — Final Showcase (Shark Tank)
  // Removed from the class (2026-10-03) — still defined here so it can be
  // re-added to `modules` below; nothing assigns it while it's left out.
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

  // ==========================================================================
  // EMPOWERMENT SERIES
  // One question, answered in writing — the final prompt card carries the
  // reflection form inline, so there's nothing else to click through.
  // ==========================================================================
  const empower1 = await createModule({
      orgId: org.id,
      topic: "Empowerment Series",
      title: "Series 1",
      summary: "Reflect on today's Empowerment session in your own words.",
      badgeName: "Empowered",
      badgeIcon: "🌟",
      badgeDescription: "Reflected on the key takeaways from an Empowerment Series session.",
      contentJson: JSON.stringify([
        block("heading", { text: "Empowerment Series — Session 1" }),
        block("checkpoint", {
          capture: "photo",
          optional: true,
          criterionLabel: "Session photo",
          text: "Want to add a photo from today's session? This one's optional — tap Skip if not.",
        }),
        block("prompt", { text: "What were the key takeaways from the session today?" }),
      ]),
      criteria: {
        create: [
          { ...photoCriterion(0, "Session photo", "Optional photo from the session."), required: false },
          wrapUpCriterion(1, "Written answer: the key takeaways from the session."),
        ],
      },
  });

  const empower3 = await createModule({
      orgId: org.id,
      topic: "Empowerment Series",
      title: "Series 2",
      summary: "Reflect on today's Empowerment session in your own words.",
      badgeName: "Empowered II",
      badgeIcon: "💫",
      badgeDescription: "Reflected on the key takeaways from a second Empowerment Series session.",
      contentJson: JSON.stringify([
        block("heading", { text: "Empowerment Series — Session 2" }),
        block("checkpoint", {
          capture: "photo",
          optional: true,
          criterionLabel: "Session photo",
          text: "Want to add a photo from today's session? This one's optional — tap Skip if not.",
        }),
        block("prompt", { text: "What were the key takeaways from the session today?" }),
      ]),
      criteria: {
        create: [
          { ...photoCriterion(0, "Session photo", "Optional photo from the session."), required: false },
          wrapUpCriterion(1, "Written answer: the key takeaways from the session."),
        ],
      },
  });

  // Product elevator pitch: each girl pitches a product from the program's
  // design-and-print list — to a customer (sell it) or an investor (fund it).
  // Product list itself is handed out in the room, not hard-coded here.
  const empower2 = await createModule({
      orgId: org.id,
      topic: "Empowerment Series",
      title: "Product Elevator Pitch",
      summary: "Pick the product you'll design and 3D print, then pitch it in 60 seconds — to sell it or to win investment.",
      badgeName: "Pitch Ready",
      badgeIcon: "🎤",
      badgeDescription: "Wrote and delivered a 60-second elevator pitch for her own product.",
      contentJson: JSON.stringify([
        block("heading", { text: "Your product, in 60 seconds" }),
        block("text", {
          kind: "learn",
          minutes: 3,
          text: "An elevator pitch is what you'd say if you stepped into an elevator with the one person who could change everything for your idea — and you only had until the doors opened.\n\nAbout 60 seconds. No slides. Just you, your product, and why it matters.\n\nToday you'll build one for the product you're going to design and 3D print.",
          tip: "Confident doesn't mean loud. It means you know exactly what you're saying — and that comes from practice, not personality.",
        }),

        block("heading", { text: "Step 1 — Pick your product" }),
        block("checkpoint", {
          capture: "choice",
          criterionLabel: "My product",
          text: "Which product will you design, 3D print, and pitch? Pick the one YOU would buy, use, or give someone — then tap Next.",
          options: [
            "Phone stand / holder",
            "Cup holder",
            "Lip gloss holder",
            "Mini desktop / stationery organizer",
            "3D-printed bracelet",
            "Fidget toy",
            "Mini figurine",
            "Jewelry tray",
            "Charm / cable charm",
            "Articulated model",
            "Mini plant pot",
          ],
        }),

        block("heading", { text: "Step 2 — Sell it, or fund it?" }),
        block("text", {
          kind: "learn",
          minutes: 3,
          text: "Every pitch has a listener and an ask. Choose yours:\n\n🛍️ SELL IT — you're talking to a CUSTOMER. They care about: what it does for ME, what it costs, why it's better than what I have.\n\n💰 FUND IT — you're talking to an INVESTOR. They care about: how many people need this, what it costs to make, what you'll sell it for, and what their money will help you do.",
          tip: "Not sure? Pick FUND IT — it makes you think about your numbers, and that makes the customer pitch easy later.",
        }),

        block("heading", { text: "Step 3 — Know your numbers" }),
        block("text", {
          kind: "build",
          minutes: 8,
          text: "Investors always ask about money. Get three numbers ready:",
          actions: [
            "COST — what one costs to make. 3D-printing plastic is roughly 2 cents per gram; a small print is often 20–50 grams. Add anything else it needs (a magnet, a battery, packaging)",
            "PRICE — what you'd sell one for. It must be more than the cost, and a real person must happily pay it",
            "THE ASK — customers: 'Buy one for $___.' Investors: 'I'm looking for $___ to make my first ___ units.'",
          ],
          tip: "A rough number you can explain beats a perfect number you can't. 'About a dollar to make, sells for eight' is a great answer.",
        }),

        block("heading", { text: "Step 4 — Write the pitch" }),
        block("checkpoint", {
          capture: "fields",
          criterionLabel: "Written pitch",
          text: "Build your pitch one part at a time. Each box already starts the sentence — you finish it. Together, the six parts ARE your pitch.",
          tip: "The hook matters most. If they don't nod at your question, they won't hear the rest.",
          fields: [
            {
              label: "Hook",
              hint: "A question about the problem that your listener will answer YES to.",
              starter: "Have you ever ",
              placeholder: "Have you ever lost your lip gloss at the bottom of your bag?",
            },
            {
              label: "Problem",
              hint: "Who has this problem, and why it's annoying.",
              placeholder: "Most girls I know carry three or four lip glosses, and they're always rolling around loose.",
            },
            {
              label: "Solution",
              hint: "Your name, your product's real name (not just 'lip gloss holder'), and what it is.",
              starter: "I'm ",
              placeholder: "I'm Maya, and I designed GlossGo — a clip-on holder for four lip glosses.",
            },
            {
              label: "Why mine",
              hint: "What makes it better than what people use now.",
              starter: "Unlike ",
              placeholder: "Unlike a makeup bag, it clips right onto your backpack strap.",
            },
            {
              label: "Numbers",
              hint: "What one costs to make, and what you'll sell it for (from Step 3).",
              starter: "It costs about ",
              placeholder: "It costs about $1 to make and sells for $8.",
            },
            {
              label: "The ask",
              hint: "Customer: ask them to buy. Investor: ask for an amount and say what it pays for.",
              placeholder: "I'm looking for $100 to print my first 50 GlossGos.",
            },
          ],
        }),

        block("heading", { text: "Step 5 — Say it out loud" }),
        block("text", {
          kind: "build",
          minutes: 10,
          text: "Pitches are spoken, not read. Practise in pairs:",
          actions: [
            "Say it to a partner three times — each time, look at your notes less",
            "Time it: aim for 45–60 seconds",
            "Partner gives feedback: one thing that worked, one thing to make stronger",
            "Swap — then say yours one more time with the fix",
          ],
          tip: "Stand tall, feet planted, eyes on your listener. Slow down on your product name and your ask — those are the words they need to remember.",
        }),
        block("checkpoint", {
          capture: "audio",
          criterionLabel: "Voice note: my elevator pitch",
          text: "Press record and deliver your elevator pitch, start to finish. One take is fine — real beats perfect.",
        }),
        block("checkpoint", {
          capture: "photo",
          optional: true,
          criterionLabel: "Product sketch",
          text: "Got a sketch of your product, or a first design? Add a photo — optional, tap Skip if not.",
        }),

        block("heading", { text: "Reflect" }),
        block("prompt", {
          text: "How did it feel to pitch your own idea out loud? What would you change before pitching it to a real customer or investor?",
        }),
      ]),
      criteria: {
        create: [
          textCriterion(0, "My product", "The product she chose from the design-and-print list."),
          textCriterion(1, "Written pitch", "A complete pitch: hook, problem, solution, why it's better, numbers, and a clear ask."),
          audioCriterion(2, "Voice note: my elevator pitch", "The full elevator pitch delivered out loud, about 60 seconds."),
          { ...photoCriterion(3, "Product sketch", "Optional sketch or early design of the product."), required: false },
          wrapUpCriterion(4, "Reflection on pitching her own idea and what she'd improve."),
        ],
      },
  });

  const modules = [module1, fc2, fc3, module2, cad2, e1, e2, e3, e4, e5, e6, e7, e8, m1, m2, m3, m4, m5, m6, m7, m8, module4, hitl1, k1, k2, k3, k4, k5, k6, k7, k8, k9, k10, k11, k12, k13, k14, k15, empower1, empower2, empower3];

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

    for (const instructor of INSTRUCTORS) {
      await prisma.instructor.create({
        data: { ...instructor, orgId: org.id },
      });
    }
  }

  await checkCheckpoints(prisma, modules);

  console.log("IgniteHer seeded (learner-ready content).");
  console.log(`  Class: ${CLASS_NAME} — code ${CLASS_CODE}, empty roster, students self-register (name + selfie)`);
  console.log(`  Modules assigned (all ${modules.length}, in order):`);
  for (const m of modules) console.log(`    ${m.badgeIcon} ${m.title} → "${m.badgeName}" badge`);
  console.log("  Each project module: quick checkpoints + a written wrap-up; every project earns a badge.");
  for (const instructor of INSTRUCTORS) console.log(`  Instructor: ${instructor.email} / PIN ${instructor.pin}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
