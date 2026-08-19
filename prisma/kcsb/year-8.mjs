// KCSB Computing — Year 8 (ages 12–13, TEEN band). Cambridge Lower Secondary
// Stage 8. Toolbelt: Python 3, Arduino, AI-assisted app building (v0).
//
// Teen-band shape: learn card → build card(s) with actions → screenshot/photo
// checkpoint → voice-note checkpoint → typed wrap-up with a Cambridge-style
// ask (explain the algorithm, justify the design, evaluate the result).
// Python is run in IDLE / Replit / Trinket — the `code` blocks are reference
// listings the learner types and runs themselves.

import { block, photoCriterion, audioCriterion, wrapUpCriterion, wrapUpPrompt } from "../seed-lib.mjs";
import { STRAND } from "./strands.mjs";

const Y = "Y8";

export const modules = [
  // CS — ASCII; OS and utilities; AI in robotics; AR
  {
    topic: STRAND.CS,
    title: `${Y} · ASCII, the OS & Machines That See`,
    summary: "Decode text the way a CPU does, audit what your operating system actually does for you, wire a real Arduino sensor — and see where AI in robotics and AR take it next.",
    badgeName: "Systems Engineer",
    badgeIcon: "🧠",
    badgeDescription: "Encoded and decoded ASCII, described the role of an OS and its utilities, wired an Arduino input, and explained an AI/AR application.",
    contentJson: JSON.stringify([
      block("heading", { text: "Everything is a number" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "A CPU only stores numbers. So every character you type has a number: in ASCII, 'A' is 65, 'a' is 97, space is 32, '0' is 48. Your name is a list of numbers that a font turns back into shapes.\n\nThe OPERATING SYSTEM (Windows, macOS, iOS, Android, Linux) sits between programs and hardware: it schedules the processor, manages memory and files, and talks to devices. UTILITIES are its toolkit — disk clean-up, backup, task manager, antivirus, compression.",
        tip: "Uppercase and lowercase differ by exactly 32 — flip one bit and 'A' becomes 'a'. That's not a coincidence; it was designed.",
      }),
      block("heading", { text: "Step 1 — Encode a message" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Using an ASCII table (search 'ASCII table' or run the Python below):",
        actions: [
          "Write your first name as ASCII decimal codes, e.g. AVA → 65 86 65",
          "Convert each code to 8-bit binary (65 → 01000001). That is literally how it sits in RAM",
          "Swap with a partner and decode each other's names. Then decode: 72 105 33",
        ],
      }),
      block("code", {
        text: "name = input(\"Name: \")\nfor ch in name:\n    print(ch, ord(ch), format(ord(ch), \"08b\"))",
        tip: "ord() gives the code; chr(72) goes the other way. Run it in IDLE or Trinket.",
      }),
      block("heading", { text: "Step 2 — OS and utilities audit" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "On a school computer:",
        actions: [
          "Open the task manager / Activity Monitor. Which five processes use the most CPU and memory? Which one is the OS itself?",
          "Find three utilities (disk clean-up, backup, antivirus, zip) and write one line on what each does and WHY the OS ships it",
        ],
      }),
      block("heading", { text: "Step 3 — Wire a sensor to an Arduino" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "An Arduino is a computer without an OS — your sketch IS the whole program. Wire a light sensor:",
        actions: [
          "LDR (light sensor) one leg to 5V, other leg to A0. A 10 kΩ resistor from A0 to GND (a voltage divider)",
          "LED long leg to pin 13 via a 220 Ω resistor, short leg to GND",
          "Sketch: read analogRead(A0); if it drops below your threshold, digitalWrite(13, HIGH). Upload, cover the sensor — the LED should light",
          "Print the readings to Serial Monitor and note the value in light and in shadow",
        ],
        warn: "Unplug USB before rewiring. Never connect 5V straight to GND.",
      }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "A robot that reads a sensor and acts is exactly what you just built. AI in robotics replaces your fixed threshold with a learned model — a warehouse robot recognising a box, a car spotting a pedestrian. AUGMENTED REALITY does the reverse: the computer reads the camera and draws onto the real world (Snapchat filters, IKEA Place, surgical overlays).",
        tip: "Same pipeline every time: sensor → process → act. The 'process' step is what AI changes.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "ASCII and Arduino photo",
        text: "Photo your encoded name in binary next to your wired Arduino (or its Serial Monitor readings).",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: OS, sensor, AI",
        text: "Record yourself: what does an operating system do that your Arduino sketch had to do itself? And name one AI-in-robotics or AR application and what it senses.",
      }),
      wrapUpPrompt("Include: how ASCII represents text, and one risk and one benefit of AI controlling a robot."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "ASCII and Arduino photo", "Binary-encoded name plus the wired Arduino sensor circuit or its readings."),
        audioCriterion(2, "Voice note: OS, sensor, AI", "Explains the role of an OS and describes an AI/AR application."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve; ASCII and AI reflection."),
      ],
    },
  },

  // CT — Pseudocode; linear search; decomposition
  {
    topic: STRAND.CT,
    title: `${Y} · Pseudocode & Linear Search`,
    summary: "Decompose a real problem, write it in Cambridge-style pseudocode, and trace a linear search by hand before you ever touch a keyboard.",
    badgeName: "Algorithm Architect",
    badgeIcon: "📐",
    badgeDescription: "Decomposed a problem, expressed a linear search in pseudocode, and traced it with a trace table.",
    contentJson: JSON.stringify([
      block("heading", { text: "Think first, type second" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "PSEUDOCODE is structured English for algorithms — no language rules, but INPUT, OUTPUT, IF…THEN…ENDIF, FOR…NEXT, WHILE…ENDWHILE are fixed. Examiners read it; so will your future self.\n\nLINEAR SEARCH: look at each item in turn until you find the target or run out. Simple, always works, slow for big lists. DECOMPOSITION: split a big task into parts you can solve separately.",
        tip: "Cambridge pseudocode uses ← for assignment: total ← total + 1.",
      }),
      block("heading", { text: "Step 1 — Decompose" }),
      block("text", {
        kind: "build",
        minutes: 8,
        text: "Problem: 'Find whether a pupil is on the school bus list and say which seat.' Break it down:",
        actions: [
          "Write the sub-problems as a numbered list (get the name; go through the list; compare; report found/not found; report the position)",
          "Circle which sub-problem is a search. Which are input, which are output?",
        ],
      }),
      block("heading", { text: "Step 2 — Write the pseudocode" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "On paper (or in a doc), write the linear search:",
        actions: [
          "Declare the list: names ← [\"Ali\", \"Bea\", \"Cy\", \"Dev\", \"Eli\"]",
          "INPUT target. found ← FALSE. FOR i ← 0 TO 4: IF names[i] = target THEN OUTPUT \"Seat\", i; found ← TRUE; ENDIF. NEXT i",
          "IF found = FALSE THEN OUTPUT \"Not on the bus\". Add a way to STOP early once found — what keyword does that need?",
        ],
        tip: "Indent every block. A marker should be able to see where each IF and FOR ends.",
      }),
      block("heading", { text: "Step 3 — Trace it" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Make a trace table with columns: i / names[i] / names[i] = target? / found / OUTPUT.",
        actions: [
          "Trace a search for \"Dev\". One row per loop turn. How many comparisons?",
          "Trace a search for \"Zed\". How many comparisons now? That's the WORST case",
          "Write one sentence: how does the number of comparisons grow as the list grows?",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Pseudocode and trace table photo",
        text: "Photo your pseudocode and the completed trace table side by side.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: explain linear search",
        text: "Record yourself explaining linear search to someone who's never coded — then say its worst case and when you'd want a better algorithm.",
      }),
      wrapUpPrompt("Explain the algorithm you wrote, and how decomposition helped before you wrote it."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Pseudocode and trace table photo", "Pseudocode for a linear search plus a trace table for two inputs."),
        audioCriterion(2, "Voice note: explain linear search", "Explains linear search, its worst case and its limits."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve; explain the algorithm."),
      ],
    },
  },

  // P — Robust Python: iteration, libraries, test plans
  {
    topic: STRAND.P,
    title: `${Y} · Robust Python`,
    summary: "Write a Python program that loops, uses a library, refuses bad input — and prove it works with a proper test plan, the way real developers do.",
    badgeName: "Python Developer",
    badgeIcon: "🐍",
    badgeDescription: "Built a Python program using iteration and an imported library, with input validation and a documented test plan.",
    contentJson: JSON.stringify([
      block("heading", { text: "Working is not the same as robust" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "A program that works when YOU use it is a demo. A program that survives a bored Year 7 typing 'banana' into a number box is ROBUST. Robust code ITERATES (loops) instead of copy-pasting, IMPORTS libraries instead of reinventing, VALIDATES input, and comes with a TEST PLAN: normal data, boundary data, erroneous data — and the expected result for each.",
        tip: "Write the test plan BEFORE the code. It tells you what 'finished' means.",
      }),
      block("heading", { text: "Step 1 — Iterate over a list" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Open IDLE, Replit or Trinket and type (don't paste — your fingers need the syntax):",
        actions: ["Run it. Add two more scores. Change the pass mark. Make it print the highest score using max()"],
      }),
      block("code", {
        text: "scores = [72, 45, 88, 59, 91]\npass_mark = 50\npassed = 0\nfor s in scores:\n    if s >= pass_mark:\n        passed += 1\nprint(\"Passed:\", passed, \"of\", len(scores))\nprint(\"Average:\", sum(scores) / len(scores))",
        tip: "for s in scores visits every item — no index needed. That's iteration over a list.",
      }),
      block("heading", { text: "Step 2 — Use a library and validate input" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Build a dice-guessing game that can't be crashed:",
        actions: [
          "import random at the top; the computer rolls random.randint(1, 6)",
          "Wrap input() in a while True loop with try/except — if the text isn't a number, say so and ask again",
          "Also reject numbers outside 1–6. Count the guesses and report them at the end",
        ],
      }),
      block("code", {
        text: "import random\n\nsecret = random.randint(1, 6)\nguesses = 0\nwhile True:\n    text = input(\"Guess 1-6: \")\n    try:\n        guess = int(text)\n    except ValueError:\n        print(\"That's not a whole number.\")\n        continue\n    if guess < 1 or guess > 6:\n        print(\"Out of range.\")\n        continue\n    guesses += 1\n    if guess == secret:\n        print(\"Correct in\", guesses, \"guesses!\")\n        break\n    print(\"Nope - try again.\")",
        tip: "try/except is the difference between 'crashed with ValueError' and 'politely asked again'.",
      }),
      block("heading", { text: "Step 3 — Test plan" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Make a table: Test no. / Input / Type (normal, boundary, erroneous) / Expected / Actual / Pass?",
        actions: [
          "At least 6 tests: e.g. 3 (normal), 1 and 6 (boundary), 0 and 7 (erroneous), 'six' (erroneous)",
          "Run every one. Record the ACTUAL result honestly — a failed test you fix is worth more than a fake pass",
          "Extension: import math and add a 'hint' that prints math.floor(secret / 2) after three wrong guesses",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Python and test plan screenshot",
        text: "Screenshot your code running, plus your filled-in test plan table.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: why it's robust",
        text: "Record yourself: which line stops a crash on bad input, why you used a loop instead of repeating code, and what the library gave you for free.",
      }),
      wrapUpPrompt("Name one test that failed at first and what you changed."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Python and test plan screenshot", "Running program plus a test plan with normal, boundary and erroneous data."),
        audioCriterion(2, "Voice note: why it's robust", "Explains validation, iteration and the use of a library."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve; a failed test and its fix."),
      ],
    },
  },

  // MD — Validation rules; what-if analysis
  {
    topic: STRAND.MD,
    title: `${Y} · Validation Rules & What-If`,
    summary: "Build a spreadsheet that refuses garbage — range, type, list and length checks — then use it to answer real what-if questions for a school event.",
    badgeName: "Data Validator",
    badgeIcon: "✅",
    badgeDescription: "Applied validation rules to a data model and used what-if analysis to compare scenarios.",
    contentJson: JSON.stringify([
      block("heading", { text: "Garbage in, garbage out" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "VALIDATION is the computer checking data is SENSIBLE before accepting it: a RANGE check (age 11–18), a TYPE check (number not text), a LIST check (only Y7/Y8/Y9), a LENGTH check (postcode 6–8 characters), a PRESENCE check (not blank). It can't tell if data is TRUE — that's verification — only if it's plausible.\n\nWHAT-IF ANALYSIS: change one input (ticket price, number of guests) and watch every formula update — a model you can interrogate.",
      }),
      block("heading", { text: "Step 1 — Build the model" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Plan a school disco in Google Sheets / Excel:",
        actions: [
          "Inputs block (yellow cells): ticket price, expected attendance, DJ cost, hall cost, snacks per person",
          "Formulas: income = price × attendance; costs = DJ + hall + snacks × attendance; profit = income − costs",
          "Name the input cells (Data → Named ranges) so formulas read like English",
        ],
      }),
      block("heading", { text: "Step 2 — Add validation" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Data → Data validation on each input:",
        actions: [
          "Price: number between 1 and 20 (range). Attendance: whole number 0–400 (range + type). Snack choice: dropdown from a list (list check)",
          "Set 'Reject input' with a custom error message that tells the user HOW to fix it",
          "Test it: try 'ten', −5, 999. Screenshot one rejection",
        ],
        tip: "A good error message says what's allowed — 'Enter a number from 1 to 20' — not just 'Invalid'.",
      }),
      block("heading", { text: "Step 3 — Ask what-if" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Use the model to decide:",
        actions: [
          "What-if 1: price £3 vs £5 — how many tickets must sell to break even at each?",
          "What-if 2: the DJ doubles their fee — what price keeps profit above £200?",
          "Record each scenario in a small table: inputs changed → profit",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Validated model screenshot",
        text: "Screenshot your model showing a validation rejection AND your what-if results table.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: validation vs verification",
        text: "Record yourself: name three validation checks you used and what each stops; then explain why validation can't catch a wrong-but-plausible number.",
      }),
      wrapUpPrompt("State the recommendation your what-if analysis supports, with the numbers."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Validated model screenshot", "Spreadsheet model with validation rules and what-if scenarios."),
        audioCriterion(2, "Voice note: validation vs verification", "Names validation checks and distinguishes validation from verification."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve; the what-if recommendation."),
      ],
    },
  },

  // DC — PAN / LAN / WAN; firewalls, antivirus
  {
    topic: STRAND.DC,
    title: `${Y} · PAN, LAN, WAN & the Defenders`,
    summary: "Map the networks you move through every day — from your earbuds to the other side of the planet — and learn what firewalls and antivirus actually block.",
    badgeName: "Network Defender",
    badgeIcon: "🧱",
    badgeDescription: "Classified networks as PAN/LAN/WAN, drew a labelled network diagram, and explained the roles of a firewall and antivirus.",
    contentJson: JSON.stringify([
      block("heading", { text: "Three sizes of network" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "PAN — Personal Area Network: your phone ↔ earbuds ↔ watch, Bluetooth, a few metres. LAN — Local Area Network: one building, the school's switches, wifi access points and server. WAN — Wide Area Network: LANs joined across cities and oceans; the internet is the biggest WAN.\n\nA FIREWALL is a gatekeeper on the boundary: it allows or blocks traffic by rules (port, address, direction). ANTIVIRUS lives on the device: it scans files and behaviour for known malware signatures and suspicious patterns. Different jobs — you need both.",
        tip: "Firewall = bouncer at the door. Antivirus = security guard walking the floor.",
      }),
      block("heading", { text: "Step 1 — Classify" }),
      block("text", {
        kind: "build",
        minutes: 8,
        text: "List 10 connections you used this week (earbuds, school wifi, a video call to a cousin abroad, a console online…).",
        actions: ["Tag each PAN / LAN / WAN. Justify any you weren't sure about", "Which ones cross a firewall? Mark them"],
      }),
      block("heading", { text: "Step 2 — Draw the school network" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "On paper or in a drawing tool, draw a labelled diagram:",
        actions: [
          "Devices (laptops, tablets, printer) → wifi access point / switch → server → router → firewall → the internet (WAN)",
          "Add a PAN: a teacher's phone to their earbuds. Show where it does NOT touch the LAN",
          "Draw a 'bad packet' arriving from the internet. Where is it stopped? Draw a malicious file on a USB stick — where is THAT caught?",
        ],
      }),
      block("heading", { text: "Step 3 — Defender rules" }),
      block("text", {
        kind: "build",
        minutes: 8,
        text: "Write three firewall rules in plain English (e.g. 'Block all incoming connections except web traffic to the school website') and three things antivirus would flag.",
        actions: ["Compare with a partner — which rule would break something pupils need?"],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Network diagram photo",
        text: "Photo your labelled PAN/LAN/WAN diagram with the firewall and antivirus marked.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: firewall vs antivirus",
        text: "Record yourself: give one example each of a PAN, a LAN and a WAN, then explain the difference between what a firewall stops and what antivirus stops.",
      }),
      wrapUpPrompt("Say which single defence you'd add to a home network first and why."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Network diagram photo", "Labelled diagram showing PAN, LAN, WAN, firewall and antivirus placement."),
        audioCriterion(2, "Voice note: firewall vs antivirus", "Classifies networks and distinguishes firewall from antivirus."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve; a justified defence."),
      ],
    },
  },

  // TC — Templates and master documents
  {
    topic: STRAND.TC,
    title: `${Y} · Templates & Master Documents`,
    summary: "Stop formatting by hand: build a reusable template with styles, placeholders and a locked header, then generate a whole set of documents from one master.",
    badgeName: "Template Engineer",
    badgeIcon: "🧩",
    badgeDescription: "Designed a document template with styles and placeholders and produced consistent documents from a master.",
    contentJson: JSON.stringify([
      block("heading", { text: "Design once, reuse forever" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "A TEMPLATE is a document with the design decided — fonts, colours, heading styles, logo, page numbers — and the content left blank. A MASTER DOCUMENT is the single source every copy is generated from: change the master, every new copy inherits the change. Clubs, newsletters, certificates and reports all work this way.\n\nStyles are the engine: if 'Heading 1' is defined once, changing it re-formats every heading in every document built from the template.",
        tip: "If you're pressing Ctrl+B and picking a font size by hand, you're doing the template's job for it.",
      }),
      block("heading", { text: "Step 1 — Build the template" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "In Google Docs or Word, create a club newsletter template:",
        actions: [
          "Define styles: Title, Heading 1, Heading 2, Normal — pick one font pair and two colours. Apply them, don't format by hand",
          "Header: club name + logo placeholder. Footer: page number + 'Issue [NUMBER]'",
          "Body: placeholders in square brackets — [LEAD STORY], [DATE], [PHOTO], [CONTACT]",
          "Save it as a template (Docs: File → Make a copy each time, or Word: Save as .dotx)",
        ],
      }),
      block("heading", { text: "Step 2 — Generate from the master" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Produce two issues from the same master:",
        actions: [
          "Make two copies. Fill the placeholders with different content — same look, zero re-formatting",
          "Now change Heading 1's colour in the MASTER. Make a third copy — did the change carry through? Explain what would happen to the two older copies",
          "Extension: Word's mail merge or a Docs add-on — generate 5 personalised certificates from a spreadsheet of names",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Template and issues screenshot",
        text: "Screenshot your template (placeholders visible) next to two finished issues made from it.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: why templates",
        text: "Record yourself: what is the difference between a template and a master document, and what did using styles save you compared with formatting by hand?",
      }),
      wrapUpPrompt("Evaluate your template: what would a new user still get wrong?"),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Template and issues screenshot", "A styled template with placeholders and documents generated from it."),
        audioCriterion(2, "Voice note: why templates", "Explains templates, master documents and the role of styles."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve; evaluate the template."),
      ],
    },
  },

  // SW — Permissions, metadata and privacy
  {
    topic: STRAND.SW,
    title: `${Y} · Permissions, Metadata & Privacy`,
    summary: "Audit what your apps are allowed to see, uncover the hidden data inside a photo, and decide what you'd actually let leave your device.",
    badgeName: "Privacy Auditor",
    badgeIcon: "🔎",
    badgeDescription: "Audited app permissions, extracted and interpreted photo metadata, and justified privacy decisions.",
    contentJson: JSON.stringify([
      block("heading", { text: "What leaves your phone without asking twice" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "PERMISSIONS are the gates an app must ask to open: camera, microphone, location, contacts, photos. A torch app asking for your contacts is a red flag. METADATA is data about data: a photo carries the date, the camera model, and often the exact GPS location it was taken — invisible in the picture, readable by anyone you send it to.\n\nPRIVACY is the choices you make about both: what you allow, what you strip, what you post.",
        warn: "Do this audit on your OWN device or a school one — never on someone else's without permission.",
      }),
      block("heading", { text: "Step 1 — Permissions audit" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Settings → Privacy (or Apps → Permissions):",
        actions: [
          "Make a table: app / permissions granted / does it NEED each one to do its job? (Y/N) / action (keep, restrict to 'while using', revoke)",
          "Audit at least 6 apps. Find one permission you'd revoke and do it (school device: just record the decision)",
        ],
      }),
      block("heading", { text: "Step 2 — Read a photo's metadata" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Take a test photo of your desk (no people) and inspect it:",
        actions: [
          "Phone: photo info / details. Computer: Get Info / Properties → Details. Note the date, device, dimensions and whether a LOCATION is present",
          "Find the setting that stops location being saved in photos — and the 'share without location' option when sending",
          "Send the photo to yourself via a messaging app, then inspect the received copy. What metadata survived? What was stripped?",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Permissions and metadata audit photo",
        text: "Photo or screenshot your permissions table and the metadata view of your test photo (location blurred if present).",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: a permission I revoked",
        text: "Record yourself: one permission you'd revoke and why, what metadata your photo carried, and one rule you'll follow before posting images from now on.",
      }),
      wrapUpPrompt("Justify one privacy setting you changed — and one you deliberately kept."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Permissions and metadata audit photo", "Permissions audit table plus the metadata view of a test photo."),
        audioCriterion(2, "Voice note: a permission I revoked", "Justifies a permission decision and interprets photo metadata."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve; justified privacy choices."),
      ],
    },
  },

  // DW — Source validity; changing workplace; IoT
  {
    topic: STRAND.DW,
    title: `${Y} · Source Validity, Work & IoT`,
    summary: "Rate sources like a researcher, map how IoT and AI are changing real jobs — then build a working app about it with an AI assistant (v0) and judge what it got right.",
    badgeName: "Future Builder",
    badgeIcon: "🚀",
    badgeDescription: "Evaluated source validity, analysed the changing workplace and IoT, and built an AI-assisted app prototype.",
    contentJson: JSON.stringify([
      block("heading", { text: "Who said so — and should you believe them?" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "SOURCE VALIDITY: authority (who wrote it, what's their expertise?), currency (when?), accuracy (do others agree? are there citations?), purpose (inform, sell, persuade?). An AI chatbot is a source too — fluent is not the same as correct.\n\nThe INTERNET OF THINGS — sensors in fridges, tractors, traffic lights, heart monitors — is reshaping jobs: some disappear, most change, new ones appear (data analyst, robot technician, prompt engineer). Today you research it and then build something with an AI assistant.",
      }),
      block("heading", { text: "Step 1 — Rate three sources" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Question: 'How will IoT change farming (or nursing, or delivery) jobs by 2035?'",
        actions: [
          "Find three sources: a news article, an organisation's report, and an AI chatbot answer",
          "Score each 1–5 on authority, currency, accuracy, purpose. Record the URL/date and one quote",
          "Write the answer you'd stand behind — and name which source you trusted least and why",
        ],
        tip: "Ask the chatbot for its sources, then check whether they exist. That test alone is worth the lesson.",
      }),
      block("heading", { text: "Step 2 — Build it with v0" }),
      block("text", {
        kind: "build",
        minutes: 20,
        text: "Go to v0.dev (a free account may be needed — ask your teacher) and prompt an app that shows your findings:",
        actions: [
          "Prompt: 'Build a one-page app called Future of [job]: three cards (today / 2035 / new skills), an IoT sensor list, and a sources section with links.' Be specific — vague prompts give vague apps",
          "Iterate twice: fix something it got wrong, add a feature it missed. Keep a note of each prompt you sent",
          "Paste your REAL sources into the sources section. Check every fact the AI wrote against your notes — edit or delete anything it invented",
        ],
        warn: "The AI writes confident placeholder 'facts'. Your job is to be the editor: nothing ships unless you verified it.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Source ratings and app screenshot",
        text: "Screenshot your source-rating table and your running v0 app with the sources section visible.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: trust and the changing workplace",
        text: "Record yourself: which source you trusted least and why, one job IoT is changing and how, and one thing the AI got wrong that you had to fix.",
      }),
      wrapUpPrompt("Evaluate: was the AI assistant a tool or a crutch for you — and what evidence do you have?"),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Source ratings and app screenshot", "Rated sources plus the AI-assisted app with verified sources."),
        audioCriterion(2, "Voice note: trust and the changing workplace", "Evaluates source validity, the changing workplace and an AI error corrected."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve; evaluate the AI assistance."),
      ],
    },
  },
];
