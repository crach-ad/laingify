// KCSB Computing — Year 4 (ages 8–9, YOUTH band). Cambridge Primary Stage 4.
// Toolbelt: Scratch 3 + micro:bit (MakeCode).
//
// Youth-band shape: learn card → build card(s) with tappable actions →
// photo/screenshot checkpoint → voice-note checkpoint → typed wrap-up
// (What worked? What challenged you? What would you improve?).

import { block, photoCriterion, audioCriterion, wrapUpCriterion, wrapUpPrompt } from "../seed-lib.mjs";
import { STRAND } from "./strands.mjs";

const Y = "Y4";
const MAKECODE = "https://makecode.microbit.org/#editor";

export const modules = [
  // CS — Control systems; file sizes
  {
    topic: STRAND.CS,
    title: `${Y} · Control Systems & File Sizes`,
    summary: "Build a model of a control system — sensor → decision → action — and discover why a photo is thousands of times bigger than a text message.",
    badgeName: "Systems Thinker",
    badgeIcon: "🎛️",
    badgeDescription: "Modelled a control system (input → process → output) and compared file sizes using the right units.",
    contentJson: JSON.stringify([
      block("heading", { text: "Machines that decide" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "A control system is a machine that SENSES something, DECIDES, then ACTS — all by itself. Automatic doors sense you, decide 'someone's here', open. A thermostat senses cold, decides 'too cold', turns the heating on.\n\nEvery control system has the same three parts: INPUT (sensor) → PROCESS (decision) → OUTPUT (action).",
        tip: "Spot three control systems on the way into school tomorrow. Traffic lights count.",
      }),
      block("heading", { text: "Build a control-system model" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Pick one: automatic door, traffic light, greenhouse fan, or a burglar alarm. Make a card model of it:",
        actions: [
          "Cut three cards: INPUT, PROCESS, OUTPUT. Draw the sensor on the first, the rule on the second ('IF hot THEN…'), the action on the third",
          "Arrange them left to right with arrows. Add a fourth card if your system has feedback (the fan cools the room → the sensor reads cooler → the fan stops)",
          "Test it with a partner: they say 'it's 30°C' — walk them through what your system does, card by card",
        ],
        tip: "Write the rule as IF … THEN … — that's exactly how you'll program it on a micro:bit later this year.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Control-system model photo",
        text: "Photo your INPUT → PROCESS → OUTPUT cards laid out in order, arrows and all.",
      }),
      block("heading", { text: "How big is a file?" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Files are measured in bytes. 1,000 bytes ≈ 1 KB (kilobyte), 1,000 KB ≈ 1 MB (megabyte), 1,000 MB ≈ 1 GB (gigabyte).",
        actions: [
          "On a school computer or tablet, find the size of: a text document, a photo, a song, and a short video (right-click → Get Info / Properties, or look in Files)",
          "Write them in a table, biggest to smallest, with the right unit",
          "Work out roughly how many text documents fit inside one photo",
        ],
        tip: "A 2 MB photo and a 2 KB text file differ by a THOUSAND times — say the units out loud so you don't mix them up.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: sense, decide, act",
        text: "Record yourself explaining your control system in three steps — what it senses, what it decides, what it does — and which of your files was biggest and why.",
      }),
      wrapUpPrompt("Mention one control system you'd like to build for real."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Control-system model photo", "Photo of the input → process → output model."),
        audioCriterion(2, "Voice note: sense, decide, act", "Explains the system's input, process and output, and compares file sizes."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // CT — Repetition, iteration, sub-routines
  {
    topic: STRAND.CT,
    title: `${Y} · Loops, Loops, Loops`,
    summary: "Stop repeating yourself! Use repeat loops and a custom block (a sub-routine) in Scratch to draw patterns with a fraction of the code.",
    badgeName: "Loop Master",
    badgeIcon: "🔁",
    badgeDescription: "Used repetition and a named sub-routine to make an algorithm shorter and clearer.",
    contentJson: JSON.stringify([
      block("heading", { text: "Why programmers hate repeating themselves" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "Drawing a square: move, turn, move, turn, move, turn, move, turn. Eight blocks. Or: REPEAT 4 [move, turn]. Two blocks, same square.\n\nA LOOP repeats instructions. A SUB-ROUTINE (Scratch calls it 'My Blocks') gives a chunk of code a NAME so you can reuse it — 'draw square' — instead of copying it.",
      }),
      block("heading", { text: "Step 1 — Draw a square with a loop" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "In Scratch, add the Pen extension (bottom-left button), then:",
        actions: ["Drag 'pen down' under a 'when green flag clicked'", "Add 'repeat 4' and put 'move 100 steps' + 'turn 90 degrees' inside it", "Click the flag. One square!"],
      }),
      block("scratch", {
        text: "when green flag clicked\npen down\nrepeat (4)\nmove (100) steps\nturn right (90) degrees\nend",
        tip: "Change 4 → 6 and 90 → 60. What shape? That's iteration — same loop, different numbers.",
      }),
      block("heading", { text: "Step 2 — Make it a sub-routine" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Turn your square into a named block:",
        actions: [
          "My Blocks → Make a Block → call it 'draw square' → OK",
          "Drag your repeat-4 loop under the new 'define draw square' hat",
          "Now: when flag clicked → repeat 12 [draw square, turn 30 degrees]. Click the flag — a flower!",
          "Challenge: add a number input to 'draw square' so it can draw any size",
        ],
        tip: "Count your blocks. A 12-square flower without loops would be ~100 blocks. You used about 8.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Loop pattern screenshot",
        text: "Screenshot your pattern AND your code — the 'define draw square' block must be visible.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: what a loop saves",
        text: "Record yourself: what does the repeat block do, what does 'draw square' do, and how many blocks did they save you?",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Loop pattern screenshot", "Pattern drawn by a loop with a custom block visible."),
        audioCriterion(2, "Voice note: what a loop saves", "Explains repetition and the purpose of a sub-routine."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // P — Loops + first micro:bit programs
  {
    topic: STRAND.P,
    title: `${Y} · micro:bit Name Badge & Dice`,
    summary: "Your first physical computing: program a micro:bit to scroll your name, then shake it to roll a dice — with real loops on a real chip.",
    badgeName: "micro:bit Maker",
    badgeIcon: "💡",
    badgeDescription: "Wrote, downloaded and ran micro:bit programs using events and a forever loop.",
    contentJson: JSON.stringify([
      block("heading", { text: "A computer the size of a biscuit" }),
      block("text", {
        kind: "learn",
        minutes: 3,
        text: "A micro:bit has 25 LEDs, two buttons, a shake sensor, and a tiny brain. You program it in MakeCode with blocks just like Scratch — then DOWNLOAD the program onto the chip and it runs on its own, no computer needed.",
        tip: "No micro:bit at your desk? The simulator on the left of MakeCode runs your program exactly the same.",
      }),
      block("heading", { text: "Step 1 — Name badge" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Open MakeCode (below) → New Project → name it 'badge'.",
        actions: [
          "Delete 'on start'. Into 'forever' drag Basic → 'show string' and type your name",
          "Add 'show icon' ❤️ after it. Watch the simulator scroll your name, then the heart, forever",
          "Plug in a micro:bit → Download → drag the .hex file onto the MICROBIT drive (or pair in the browser)",
        ],
        tip: "'forever' IS a loop — it repeats your blocks for as long as the micro:bit has power.",
      }),
      block("embed", { url: MAKECODE }),
      block("heading", { text: "Step 2 — Shake for a dice" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "New project 'dice':",
        actions: [
          "Input → 'on shake'. Inside: Basic → 'show number' with Math → 'pick random 1 to 6'",
          "Shake the simulator (or the real board). A new number each time!",
          "Upgrade: use 'show leds' inside 'if … then … else' to draw real dice dots for 1, 2 and 3",
        ],
        warn: "Only unplug the micro:bit once the yellow light stops flashing — that's the download finishing.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "micro:bit running photo",
        text: "Photo the micro:bit (or the simulator) showing your name or a dice roll — with your blocks visible if you can.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: forever and on shake",
        text: "Record yourself: what does the 'forever' block do? What does 'on shake' wait for? Which one is a loop and which is an event?",
      }),
      wrapUpPrompt("What would you make the micro:bit do next?"),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "micro:bit running photo", "micro:bit or simulator running the learner's program."),
        audioCriterion(2, "Voice note: forever and on shake", "Distinguishes a loop (forever) from an event (on shake)."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // MD — Data types, fields, first databases
  {
    topic: STRAND.MD,
    title: `${Y} · Card-File Database`,
    summary: "Build your first database — a card file of dinosaurs, footballers or pets — with fields, data types and records you can search.",
    badgeName: "Data Builder",
    badgeIcon: "🗂️",
    badgeDescription: "Designed fields with suitable data types and built a searchable set of records.",
    contentJson: JSON.stringify([
      block("heading", { text: "Records, fields, types" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "A database is a box of cards. Each card is a RECORD (one dinosaur). Each line on the card is a FIELD (name, length, diet). Every field has a DATA TYPE: text, number, yes/no, date.\n\nGet the types right and the computer can sort by length, filter meat-eaters, or find every dinosaur discovered before 1900.",
        tip: "Rule of thumb: if you'd ever want to ADD it up or put it in order, it's a number, not text.",
      }),
      block("heading", { text: "Step 1 — Design the card" }),
      block("text", {
        kind: "build",
        minutes: 8,
        text: "Pick a topic with at least 8 things to record. On paper, design one blank card:",
        actions: [
          "Write 5–6 field names down the left: Name, Length (m), Diet, Period, Discovered (year), Has feathers?",
          "Next to each, write its data type: text / number / yes-no / date",
          "Fill in ONE record by hand to check your fields make sense",
        ],
      }),
      block("heading", { text: "Step 2 — Build it digitally" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "In Google Sheets (or Excel, or a database app), one row per record, one column per field:",
        actions: [
          "Row 1: your field names. Rows 2–9: at least 8 records",
          "Format the number column as Number, the year column as Number, and use TRUE/FALSE for yes-no",
          "Data → Create a filter. Filter to show only meat-eaters. Sort by length, biggest first",
          "Ask your partner a question your database can answer — and answer it with a filter",
        ],
        tip: "If 'Length' is typed as '12 m' the sort breaks — the unit lives in the field NAME, only the number goes in the cell.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Database screenshot",
        text: "Screenshot your records with a filter or sort applied.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: fields and types",
        text: "Record yourself naming two of your fields, their data types, and why you chose them.",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Database screenshot", "At least 8 records with typed fields and a filter/sort applied."),
        audioCriterion(2, "Voice note: fields and types", "Names fields and justifies their data types."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // DC — WWW vs internet; Caesar cipher
  {
    topic: STRAND.DC,
    title: `${Y} · WWW vs Internet & the Caesar Wheel`,
    summary: "Untangle the internet from the World Wide Web, then build a Caesar cipher wheel and send a secret message only your partner can read.",
    badgeName: "Code Breaker",
    badgeIcon: "🛞",
    badgeDescription: "Explained the difference between the internet and the web and encrypted/decrypted a message with a Caesar shift.",
    contentJson: JSON.stringify([
      block("heading", { text: "Two different things" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "The INTERNET is the wires, cables and wifi that connect computers all over the world — the roads. The WORLD WIDE WEB is the websites that travel along those roads — the cars. Email, video calls and online games also use the internet but are NOT the web.\n\nAnd because messages travel across roads anyone can watch, people have hidden them in codes for 2,000 years. Julius Caesar shifted every letter along the alphabet.",
      }),
      block("heading", { text: "Step 1 — Build the wheel" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Two paper circles, one smaller than the other, pinned at the centre:",
        actions: [
          "Write A–Z around the edge of BOTH circles, evenly spaced (26 letters — use a ruler or a template)",
          "Pin them together. Turn the inner wheel 3 places so inner A sits under outer D. That's a shift of 3",
          "Encrypt HELLO: find each letter on the outer wheel, write the inner one. H→K, E→H, L→O, L→O, O→R → KHOOR",
        ],
      }),
      block("heading", { text: "Step 2 — Send a secret" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "With a partner:",
        actions: [
          "Agree a secret shift (1–25). Each write a 5-word message and encrypt it",
          "Swap. Decrypt your partner's message by turning the wheel BACK",
          "Now hand your message to a THIRD person who doesn't know the shift — how long until they crack it by trying every shift?",
        ],
        tip: "There are only 25 possible shifts — that's why Caesar's cipher is a great start but real websites use much stronger encryption.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Cipher wheel photo",
        text: "Photo your wheel set to your shift, with your encrypted message next to it.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: internet vs web",
        text: "Record yourself: what's the difference between the internet and the web? And how does the Caesar wheel turn a letter into a secret one?",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Cipher wheel photo", "Cipher wheel plus an encrypted message."),
        audioCriterion(2, "Voice note: internet vs web", "Distinguishes internet from web and explains the shift."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // TC — Richer documents; tables; URLs
  {
    topic: STRAND.TC,
    title: `${Y} · A Richer Document`,
    summary: "Write a one-page fact file with headings, a table, an image and working links — a document that looks like a real publication.",
    badgeName: "Document Designer",
    badgeIcon: "📄",
    badgeDescription: "Produced a formatted document with headings, a table, an image and hyperlinks to sources.",
    contentJson: JSON.stringify([
      block("heading", { text: "More than words" }),
      block("text", {
        kind: "learn",
        minutes: 3,
        text: "A plain page of text is hard to read. Real documents use HEADINGS so you can skim, TABLES so numbers line up, IMAGES so you can see, and LINKS (URLs) so readers can check where facts came from.\n\nA URL is a web address: https://www.bbc.co.uk/newsround — the part after https:// is the site, the rest is the page.",
      }),
      block("heading", { text: "Build a fact file" }),
      block("text", {
        kind: "build",
        minutes: 25,
        text: "In Google Docs or Word, make a one-page fact file about an animal, planet or country:",
        actions: [
          "Title at the top using the Title style. Three sections with Heading 2 style: Facts, Numbers, Find out more",
          "Under Numbers: Insert → Table, 3 columns × 4 rows (e.g. Fact / Value / Unit). Fill it in",
          "Insert → Image: one picture that is free to use (search with 'Creative Commons' or use the built-in image search)",
          "Under Find out more: two links. Type the site name, select it, Insert → Link, paste the URL. Click to test both",
          "Make it look good: one font, headings bolder than body text, table lines neat",
        ],
        tip: "Styles (Title, Heading 2) aren't just pretty — they let you build a contents page automatically later.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Fact-file screenshot",
        text: "Screenshot your whole page — headings, table, image and links visible.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: what a URL tells you",
        text: "Record yourself reading one of your URLs aloud and explaining which part is the website and why you included links at all.",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Fact-file screenshot", "Document with headings, a table, an image and links."),
        audioCriterion(2, "Voice note: what a URL tells you", "Explains the parts of a URL and the purpose of linking sources."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // SW — Strong passwords; content lasts
  {
    topic: STRAND.SW,
    title: `${Y} · Strong Passwords, Content Lasts`,
    summary: "Learn the recipe for a password that takes centuries to crack — and why anything posted online should be treated as permanent.",
    badgeName: "Password Pro",
    badgeIcon: "🛡️",
    badgeDescription: "Built and tested strong passphrases and explained why online content can last forever.",
    contentJson: JSON.stringify([
      block("heading", { text: "Long beats clever" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "'password1' is cracked in under a second. 'Purple-Tiger-Bounces-42!' takes longer than the universe has existed. The secret is LENGTH plus a mix — three random words, a number, a symbol.\n\nAnd once something is posted online — a photo, a comment — it can be copied, screenshotted and saved by anyone. Even if you delete it, a copy may last forever. Think before you post.",
        warn: "Never type a REAL password into any website to 'test' it — only pretend ones in this lesson.",
      }),
      block("heading", { text: "Step 1 — Password lab" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Make a results table with two columns: Password / How strong?",
        actions: [
          "Invent 5 PRETEND passwords: a pet's name, a birthday, a single word, three random words, three words + number + symbol",
          "Rate each one using the class checklist (length 12+? mix of letters/numbers/symbols? not a dictionary word? not personal info?)",
          "Rewrite the weakest one into a strong passphrase. Say it — can you remember it? That's the point of passphrases",
        ],
        tip: "A passphrase you can picture — 'Purple Tiger Bounces' — is easy to remember and brutally hard to guess.",
      }),
      block("heading", { text: "Step 2 — Content lasts" }),
      block("text", {
        kind: "build",
        minutes: 8,
        text: "In pairs, act it out:",
        actions: [
          "Partner A 'posts' a drawing (passes a note). Partner B copies it and passes it on. A then says 'delete!' — how many copies exist now?",
          "List three things you'd be happy for ANYONE to see in ten years — and three you wouldn't. Only the first list belongs online",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Password lab photo",
        text: "Photo your results table — pretend passwords only, with their ratings and your improved passphrase.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: strong and permanent",
        text: "Record yourself: what makes a password strong (don't say a real one!), and why should you treat anything you post as permanent?",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Password lab photo", "Results table of pretend passwords rated for strength."),
        audioCriterion(2, "Voice note: strong and permanent", "Explains password strength and the permanence of online content."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // DW — False information; online communities
  {
    topic: STRAND.DW,
    title: `${Y} · Spot the Fake`,
    summary: "Become a fact detective: test real and fake web pages with a five-question checklist, and learn how online communities help — and sometimes mislead.",
    badgeName: "Fact Detective",
    badgeIcon: "🕵️",
    badgeDescription: "Applied a checklist to judge whether online information is reliable and described how online communities work.",
    contentJson: JSON.stringify([
      block("heading", { text: "Not everything online is true" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "Anyone can publish a web page — including people who are joking, selling something, or wrong. Detectives ask five questions: WHO wrote it? WHEN? Does another trusted site AGREE? Does it want me to feel ANGRY or SCARED? Does the picture MATCH the story?\n\nOnline communities (a Minecraft forum, a class chat, a fan group) are people helping each other — but the same five questions apply to what people post there.",
      }),
      block("heading", { text: "Detective work" }),
      block("text", {
        kind: "build",
        minutes: 20,
        text: "Your teacher will give you three web pages or posts (at least one is fake — e.g. the Pacific Northwest Tree Octopus).",
        actions: [
          "Make a grid: three pages across the top, the five detective questions down the side",
          "Fill every box with a tick, a cross, or a question mark — and one sentence of evidence",
          "Verdict for each page: Reliable / Not sure / Fake. Compare with your partner — do you agree?",
          "Bonus: find the REAL website that debunks your fake one and write down its URL",
        ],
        tip: "'Not sure' is a perfectly good verdict — good detectives check a second source before they decide.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Detective grid photo",
        text: "Photo your completed grid with the three verdicts.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: how I spotted the fake",
        text: "Record yourself: which page was fake, which TWO clues gave it away, and what would you tell a friend who was about to share it?",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Detective grid photo", "Completed five-question grid with verdicts for three sources."),
        audioCriterion(2, "Voice note: how I spotted the fake", "Identifies the fake source and the clues used."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },
];
