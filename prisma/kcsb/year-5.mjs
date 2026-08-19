// KCSB Computing — Year 5 (ages 9–10, YOUTH band). Cambridge Primary Stage 5.
// Toolbelt: micro:bit sensors, podcasting, Google Sheets.
//
// Youth-band shape: learn card → build card(s) with tappable actions →
// photo/screenshot checkpoint → voice-note checkpoint → typed wrap-up
// (What worked? What challenged you? What would you improve?).

import { block, photoCriterion, audioCriterion, wrapUpCriterion, wrapUpPrompt } from "../seed-lib.mjs";
import { STRAND } from "./strands.mjs";

const Y = "Y5";
const MAKECODE = "https://makecode.microbit.org/#editor";

export const modules = [
  // CS — Binary intro; input-process-output; AI appears
  {
    topic: STRAND.CS,
    title: `${Y} · Binary, IPO & Meet AI`,
    summary: "Crack the secret language of every computer — ones and zeros — make a binary bracelet of your initial, map a gadget as input → process → output, and meet your first AI.",
    badgeName: "Binary Brain",
    badgeIcon: "🧮",
    badgeDescription: "Converted letters to binary, modelled a device as input → process → output, and described what makes an AI different from ordinary software.",
    contentJson: JSON.stringify([
      block("heading", { text: "Everything is ones and zeros" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "Inside a computer there are no letters, colours or songs — only tiny switches that are ON (1) or OFF (0). Eight switches in a row make one BYTE, and each pattern of eight stands for something: 01000001 is the letter A.\n\nEvery gadget does the same three things with those ones and zeros: INPUT (a key press, a sensor reading) → PROCESS (the chip works it out) → OUTPUT (screen, speaker, motor). An AI is software whose PROCESS step learned from examples instead of being written rule-by-rule.",
        tip: "Say 'one-zero-one' not 'a hundred and one' — binary numbers are patterns, not amounts (yet).",
      }),
      block("heading", { text: "Step 1 — Binary bracelet" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Make a bracelet that spells your initial in binary:",
        actions: [
          "Look up your first initial on the class ASCII chart — A = 01000001, B = 01000010, C = 01000011… (each letter is the one before, plus 1)",
          "Two bead colours: one for 1, one for 0. Thread the eight beads in order — left to right, no swaps",
          "Swap bracelets with a partner. Decode theirs using the chart. Did you get their initial?",
          "Extension: add a second letter — 16 beads. How many beads for your whole name?",
        ],
        tip: "Lost count? Group beads in fours — 0100 0001 is much easier to read than 01000001.",
      }),
      block("heading", { text: "Step 2 — Input, process, output" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Pick a device: a calculator, a games console, a smart speaker, a microwave. Draw three boxes with arrows:",
        actions: [
          "INPUT box: what goes IN? (buttons, microphone, camera, sensor)",
          "PROCESS box: what does the chip decide or work out?",
          "OUTPUT box: what comes OUT? (screen, sound, light, movement)",
          "Star the box where an AI would live. A smart speaker's PROCESS understands your words — that part learned from millions of voices",
        ],
        tip: "Try it on yourself: ears = input, brain = process, mouth = output. Computers copied us.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Binary bracelet & IPO photo",
        text: "Photo your bracelet next to your INPUT → PROCESS → OUTPUT drawing. Make sure all eight beads show.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: ones, zeros and AI",
        text: "Record yourself: read your bracelet out loud as eight ones and zeros, say which letter it is, then explain in one sentence what makes an AI different from a normal program.",
      }),
      wrapUpPrompt("Name one thing around you that you now think has a computer inside."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Binary bracelet & IPO photo", "Eight-bead binary bracelet plus an input → process → output diagram."),
        audioCriterion(2, "Voice note: ones, zeros and AI", "Reads the binary pattern, names the letter, and distinguishes AI from ordinary software."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // CT — Selection, variables, operators
  {
    topic: STRAND.CT,
    title: `${Y} · Choose Your Path`,
    summary: "Design a choose-your-own-adventure on paper using IF/THEN/ELSE, a score variable and comparison operators — the thinking behind every game you've played.",
    badgeName: "Decision Designer",
    badgeIcon: "🔀",
    badgeDescription: "Planned an algorithm with selection, a variable that changes, and comparison operators — and traced it to predict the result.",
    contentJson: JSON.stringify([
      block("heading", { text: "Computers that choose" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "So far your algorithms went in a straight line. Real programs BRANCH: IF it's raining THEN take a coat ELSE take sunglasses. That's SELECTION.\n\nTo decide, a program checks a VARIABLE — a named box that holds a value that can change, like score or lives. It compares it with an OPERATOR: = (equal), > (more than), < (less than). 'IF score > 10 THEN you win.'",
        tip: "A variable is a box with a LABEL on it. The label stays the same; what's inside changes.",
      }),
      block("heading", { text: "Step 1 — Map your adventure" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "On A3 paper, design a 'find the treasure' adventure as a flowchart:",
        actions: [
          "Start box: 'gold = 0'. That's your variable with its starting value",
          "Draw at least THREE diamonds — decisions written as questions: 'Take the bridge or the cave?', 'Is gold > 5?'",
          "Each diamond has TWO arrows out, labelled yes/no (or left/right). At least one arrow must CHANGE gold: 'gold = gold + 3'",
          "The last diamond must use an operator to decide the ending: 'IF gold > 5 THEN Treasure! ELSE Try again'",
        ],
        tip: "Rectangles do things, diamonds ask questions, arrows show where to go next. Every path must reach an ending.",
      }),
      block("heading", { text: "Step 2 — Trace it like a computer" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Swap flowcharts with a partner and be the computer:",
        actions: [
          "Put a counter on Start. Write 'gold = 0' on a scrap of paper",
          "Follow the arrows, answering every diamond. Each time gold changes, cross it out and write the new value — that's a trace table",
          "Which ending did you reach? Now go back and choose differently at ONE diamond. Does the ending change?",
          "Find a path where gold is EXACTLY 5 — does '> 5' send it to Treasure? That's why operators matter",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Adventure flowchart photo",
        text: "Photo your flowchart — decisions, yes/no arrows, the gold variable and your trace table all visible.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: if, variable, operator",
        text: "Record yourself: point to one IF in your flowchart and read it aloud, say what your variable is and how it changes, and explain why > 5 and = 5 give different answers.",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Adventure flowchart photo", "Flowchart with at least three decisions, a variable that changes, and a comparison operator."),
        audioCriterion(2, "Voice note: if, variable, operator", "Explains selection, a variable and a comparison operator from their own flowchart."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // P — Selection and variables; sensor coding
  {
    topic: STRAND.P,
    title: `${Y} · micro:bit Sensor Gadget`,
    summary: "Code a micro:bit that reacts to the real world: a step counter with a variable, then a temperature or light alarm that uses IF to decide.",
    badgeName: "Sensor Coder",
    badgeIcon: "🌡️",
    badgeDescription: "Programmed a micro:bit to read a sensor, store a value in a variable, and use selection to respond.",
    contentJson: JSON.stringify([
      block("heading", { text: "A computer that feels" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "Last year your micro:bit showed things. This year it SENSES things. It has a thermometer, a light sensor, a compass and an accelerometer (the shake/tilt sensor) built in.\n\nA sensor program is always the same pattern: READ the sensor → STORE the reading in a variable → IF the variable is past a limit THEN do something. Input → process → output, running forever.",
        tip: "The simulator has sliders for temperature and light — drag them to test without leaving your desk.",
      }),
      block("heading", { text: "Step 1 — Step counter" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Open MakeCode (below) → New Project → 'steps':",
        actions: [
          "Variables → Make a Variable → 'steps'. In 'on start': set steps to 0",
          "Input → 'on shake'. Inside: change steps by 1, then Basic → show number steps",
          "Input → 'on button A pressed': set steps to 0 (a reset button)",
          "Shake the simulator or the real board 10 times. Does it show 10? That's your variable counting",
        ],
        tip: "'change steps by 1' means steps = steps + 1 — the same as your flowchart's gold = gold + 3.",
      }),
      block("embed", { url: MAKECODE }),
      block("heading", { text: "Step 2 — Temperature alarm" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "New project 'alarm':",
        actions: [
          "Make a variable 'temp'. In 'forever': set temp to Input → temperature (°C)",
          "Logic → 'if … then … else'. Condition: temp > 25. Then: show icon ☀️ and Music → play tone. Else: show icon ✓",
          "Test in the simulator: drag the temperature slider above 25. Alarm! Below: tick",
          "Challenge: swap temperature for light level and make a 'lights off' reminder. What limit works in your classroom?",
        ],
        warn: "Holding a finger on the chip warms it by a degree or two — slowly. Warm hands or a hairdryer on low beat breathing on it.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Sensor gadget running photo",
        text: "Photo the micro:bit (or simulator) reacting to its sensor — alarm on or counter showing — with your blocks visible if you can.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: read, store, decide",
        text: "Record yourself: which sensor did your gadget read, what variable stored it, and what did the IF block check? What happens when the reading goes over the limit?",
      }),
      wrapUpPrompt("What would you add a sensor to in your house?"),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Sensor gadget running photo", "micro:bit or simulator running a sensor program with a variable and selection."),
        audioCriterion(2, "Voice note: read, store, decide", "Explains the sensor, the variable and the IF condition in their program."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // MD — Validated cells; what-if changes
  {
    topic: STRAND.MD,
    title: `${Y} · Validated Sheet, What-If?`,
    summary: "Build a class-party budget in Google Sheets that refuses bad data, totals itself with formulas, and answers 'what if?' the moment you change a number.",
    badgeName: "Spreadsheet Strategist",
    badgeIcon: "📊",
    badgeDescription: "Used data validation to protect cells, built formulas that update automatically, and ran what-if changes to make a decision.",
    contentJson: JSON.stringify([
      block("heading", { text: "A sheet that thinks" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "A spreadsheet is more than a table. FORMULAS (=B2*C2) do the maths for you and update instantly. VALIDATION stops wrong data getting in — no letters in a price box, no quantity over 100. Together they let you ask WHAT IF: what if we buy cheaper cups? What if 5 more people come? Change one cell, watch everything else follow.",
        tip: "Every formula starts with = . Forget it and the sheet thinks you typed words.",
      }),
      block("heading", { text: "Step 1 — Build the budget" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Google Sheets → blank sheet → 'Class party budget':",
        actions: [
          "Row 1 headings: Item, Price each (£), Quantity, Cost (£). Rows 2–7: six items (cups, crisps, juice, balloons, cake, music)",
          "In D2 type =B2*C2 and press Enter. Grab the little blue square and drag it down to D7 — the formula copies itself",
          "In D9 type =SUM(D2:D7). Label C9 'Total'. Change a price — does the total move by itself?",
          "Format column B and D as currency (Format → Number → Currency)",
        ],
      }),
      block("heading", { text: "Step 2 — Validate, then ask what if" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Protect the sheet from bad data, then use it to decide:",
        actions: [
          "Select C2:C7 → Data → Data validation → Criteria: number between 1 and 100 → Reject input. Try typing 500 or 'lots' — the sheet says no",
          "Select B2:B7 → validation: number greater than 0. Try a negative price",
          "Write a budget limit in B11 (say £40). In C11: =IF(D9>B11,\"Over budget!\",\"OK\")",
          "WHAT IF: you're over budget. Change ONE number at a time — cheaper juice? fewer balloons? — until C11 says OK. Write down which change worked",
        ],
        tip: "Change only one cell per what-if — then you know exactly which change made the difference.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Budget sheet screenshot",
        text: "Screenshot your sheet showing the total formula, the validation warning (try a bad value first!) or the IF message.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: validation and what-if",
        text: "Record yourself: what does your validation rule stop, what formula works out the total, and which what-if change got you under budget?",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Budget sheet screenshot", "Spreadsheet with formulas, validation and a what-if result visible."),
        audioCriterion(2, "Voice note: validation and what-if", "Explains a validation rule, a formula and the what-if decision."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // DC — IP addresses, packets, routes
  {
    topic: STRAND.DC,
    title: `${Y} · Packets & Routes`,
    summary: "Discover how a photo crosses the internet: chopped into packets, stamped with IP addresses, and raced along different routes — then play it out across the classroom.",
    badgeName: "Packet Pilot",
    badgeIcon: "📦",
    badgeDescription: "Explained IP addresses and packets and modelled how data is split, routed and reassembled across a network.",
    contentJson: JSON.stringify([
      block("heading", { text: "Chopped up and sent in pieces" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "Every device on the internet has an IP ADDRESS — a number like 192.168.1.7 — that works like a house address. When you send a photo, it isn't sent whole: it's chopped into small PACKETS, each stamped with the sender's and receiver's IP address and a number saying which piece it is.\n\nPackets don't all take the same road. ROUTERS pass each one along whichever route is free, and the receiving device puts them back in order. Lose a packet? It just asks for that one again.",
        tip: "Type 'what is my IP' into a search engine — that number is your school's front door on the internet.",
      }),
      block("heading", { text: "Step 1 — Packet relay game" }),
      block("text", {
        kind: "build",
        minutes: 20,
        text: "In groups of six: one SENDER, one RECEIVER, four ROUTERS standing between them in a diamond:",
        actions: [
          "Sender draws a simple picture on a card, cuts it into 4 pieces. On the BACK of each piece write: TO: receiver's IP, FROM: sender's IP, PACKET 1 of 4 (2 of 4…)",
          "Sender hands packets to ANY router — one at a time, not all to the same person. Routers pass packets along to another router or the receiver, never backwards",
          "Receiver lays the packets out using the numbers and rebuilds the picture. Did every piece arrive? In order?",
          "Round 2: the teacher 'cuts a cable' — one router sits down. Can packets still get through by another route? Round 3: a packet goes missing — receiver asks for 'packet 3 again'",
        ],
        tip: "Make up IP addresses for your group: 10.0.0.1, 10.0.0.2… Real ones are four numbers 0–255 with dots between.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Packet relay photo",
        text: "Photo your rebuilt picture with the packet backs showing TO / FROM IP addresses and packet numbers.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: IP, packets, routes",
        text: "Record yourself: what is an IP address for, why is a photo sent as packets instead of in one piece, and what happened when a router sat down?",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Packet relay photo", "Reassembled picture with addressed, numbered packets."),
        audioCriterion(2, "Voice note: IP, packets, routes", "Explains IP addresses, packets and routing around a broken link."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // TC — File transfer; image editing (podcasting)
  {
    topic: STRAND.TC,
    title: `${Y} · Podcast Episode`,
    summary: "Plan, record and publish a two-minute podcast segment with an edited cover image — and move the files between devices like a real producer.",
    badgeName: "Podcast Producer",
    badgeIcon: "🎙️",
    badgeDescription: "Recorded and edited a short podcast segment, edited a cover image, and transferred files between devices and folders.",
    contentJson: JSON.stringify([
      block("heading", { text: "You're on air" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "A podcast is just an audio file with a plan behind it. Producers write a short script, record in a quiet spot, trim the umms, and add a cover image. Then the files have to MOVE — from the recording device to a shared drive to the editor's computer — without getting lost or renamed into 'Untitled (3)'.\n\nToday you make a two-minute episode segment about something you love, and your voice note IS the recording.",
        tip: "Good file names say what, who and when: 'podcast-space-rocks-amira-v2.m4a'. Future you will say thanks.",
      }),
      block("heading", { text: "Step 1 — Plan and record" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "In pairs (host + guest, then swap):",
        actions: [
          "Write a 5-line plan: intro ('Welcome to…'), topic in one sentence, two interesting facts or a mini-interview, a question for listeners, sign-off",
          "Find a quiet corner. Record a practice take with the tablet's voice recorder. Listen back — too quiet? too fast?",
          "Record the real take: aim for 1–2 minutes. One restart is allowed — producers do it all the time",
          "Save it with a proper file name, then transfer it: AirDrop / shared drive / USB into a folder called 'Podcast' — and check it plays from there",
        ],
      }),
      block("heading", { text: "Step 2 — Cover image" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Every episode needs artwork:",
        actions: [
          "Take a photo that fits your topic, or choose a free-to-use image",
          "Open it in an image editor (Photos, Canva, Pixlr, Paint 3D): crop it SQUARE, adjust brightness, add your podcast name as text",
          "Export as JPG or PNG into the same 'Podcast' folder as your audio. Two files, one folder, sensible names",
        ],
        tip: "Square is the podcast shape — apps show covers as squares, so anything else gets chopped.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Podcast cover & folder screenshot",
        text: "Upload your edited square cover image — or a screenshot of your 'Podcast' folder showing both files with their proper names.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Podcast segment recording",
        text: "This IS your episode: press record and perform your 1–2 minute segment from your plan — intro, topic, facts, question, sign-off.",
      }),
      wrapUpPrompt("Who would you interview for episode two?"),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Podcast cover & folder screenshot", "Edited square cover image, or folder showing the transferred, well-named audio and image files."),
        audioCriterion(2, "Podcast segment recording", "A 1–2 minute podcast segment following a plan: intro, topic, content, sign-off."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // SW — Privacy settings; cyberbullying
  {
    topic: STRAND.SW,
    title: `${Y} · Privacy Settings & Standing Up`,
    summary: "Audit the privacy settings on a game or app, lock down what strangers can see, and practise the four moves that stop cyberbullying: don't reply, save, block, tell.",
    badgeName: "Privacy Guardian",
    badgeIcon: "🔒",
    badgeDescription: "Reviewed and improved privacy settings and explained what to do if they or a friend is bullied online.",
    contentJson: JSON.stringify([
      block("heading", { text: "Who can see you?" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "Every app has PRIVACY SETTINGS: who can see your profile, who can message you, whether your location is shared. The defaults are often 'everyone'. You can change them — and you should.\n\nCYBERBULLYING is being mean on purpose, repeatedly, online. It's never the target's fault. The four moves: DON'T REPLY (it feeds it), SAVE the evidence (screenshot), BLOCK the person, TELL a trusted adult. If you see it happening to someone else, be an upstander — don't join in, and report it.",
        warn: "Use the class demo account or a blank practice profile for the audit — never change settings on a real account without a parent or teacher.",
      }),
      block("heading", { text: "Step 1 — Privacy audit" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "On the demo account (a game, a video app or a school account), make an audit sheet with three columns: Setting / Now / Should be:",
        actions: [
          "Find Settings → Privacy (or Safety). List at least five settings: who can see my profile, who can message me, who can see my friends list, location sharing, who can comment",
          "Write what each one is set to NOW",
          "Decide what it SHOULD be for someone your age — 'Friends only' or 'Nobody' beats 'Everyone' almost every time — and change it",
          "Find the Block and Report buttons. Where are they? How many taps away?",
        ],
        tip: "Can't find a setting? Search the settings page for the word 'privacy' — most apps hide it two menus deep on purpose.",
      }),
      block("heading", { text: "Step 2 — Standing up" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Role-play in threes (target, bully's message on a card, upstander):",
        actions: [
          "The target receives a mean message card. Walk through the four moves out loud: don't reply → screenshot → block → tell. Who would you tell at school? At home?",
          "The upstander sees it in a group chat. Script two things they could say or do that help without fighting back",
          "Swap roles. Then write the four moves on a card for your planner",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Privacy audit photo",
        text: "Photo your audit sheet (Setting / Now / Should be) — or a screenshot of the demo account's privacy page after you fixed it.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: settings and the four moves",
        text: "Record yourself: which setting did you change and why, and say the four moves for cyberbullying — plus who YOU would tell.",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Privacy audit photo", "Audit sheet or settings screenshot showing at least five privacy settings reviewed."),
        audioCriterion(2, "Voice note: settings and the four moves", "Justifies a settings change and recalls the four responses to cyberbullying."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // DW — Instant communication; tech helps society
  {
    topic: STRAND.DW,
    title: `${Y} · Instant Communication, Tech for Good`,
    summary: "Race a message around the world by letter, phone and internet, then investigate one technology that is genuinely helping people — and pitch it in a one-minute news slot.",
    badgeName: "Tech for Good Reporter",
    badgeIcon: "🌍",
    badgeDescription: "Compared how instant communication changed over time and reported on a technology that helps society.",
    contentJson: JSON.stringify([
      block("heading", { text: "From weeks to milliseconds" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "Two hundred years ago a letter to Australia took three months by ship. The telegraph made it minutes. The phone made it a conversation. Today a video call is INSTANT and free, and a message reaches a billion people in a second.\n\nThat speed changes how the world works: doctors read scans from another continent, farmers check the weather on a phone, and a deaf friend can join a class through live captions. Technology helping society is real — and so is knowing when instant isn't better (think before you send).",
      }),
      block("heading", { text: "Step 1 — The message race" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Make a timeline strip of how a 'Happy Birthday' message could travel London → Nassau:",
        actions: [
          "Five boxes in order: 1820 ship letter, 1870 telegraph, 1950 telephone, 2000 email, today video call",
          "Under each box write: how long it takes, and what you can send (words? voice? face?)",
          "Circle the biggest jump. Which invention made the biggest difference to a family living far apart?",
        ],
        tip: "The jump from 'weeks' to 'minutes' (telegraph) was bigger than 'minutes' to 'instant' — ask why.",
      }),
      block("heading", { text: "Step 2 — Tech for good news slot" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Choose one technology that helps people — hurricane warning apps, hearing aids, translation apps, telemedicine, flood sensors, prosthetic limbs from 3D printers:",
        actions: [
          "Find two facts about it from two different sources (write the URLs down)",
          "Plan a one-minute news report: what it is, who it helps, how it works in one sentence, one thing that could go wrong or be unfair",
          "Make one slide or poster to hold up during your report: a title, one image, one big number",
          "Rehearse once with a partner — they time you and ask one question",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Timeline & news slide photo",
        text: "Photo your message-race timeline together with your tech-for-good slide or poster.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: one-minute news report",
        text: "Record your one-minute news report: the technology, who it helps, how it works, and one downside — then say which invention on your timeline mattered most.",
      }),
      wrapUpPrompt("Is instant always better? Give one example where it isn't."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Timeline & news slide photo", "Communication timeline plus a slide/poster for a technology that helps society."),
        audioCriterion(2, "Voice note: one-minute news report", "Reports on a helpful technology with a benefit, how it works, and a downside."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },
];
