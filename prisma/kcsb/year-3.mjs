// KCSB Computing — Year 3 (ages 7–8, YOUTH band). Cambridge Primary Stage 3.
// Toolbelt: Scratch, spreadsheets, slides.
//
// First year with a typed wrap-up — the ask is gentle (a few sentences), the
// reading level simple. Shape: learn card → build card(s) with tappable
// actions → photo/screenshot checkpoint → voice-note checkpoint → wrap-up.

import { block, photoCriterion, audioCriterion, wrapUpCriterion, wrapUpPrompt } from "../seed-lib.mjs";
import { STRAND } from "./strands.mjs";

const Y = "Y3";

export const modules = [
  // CS — Hardware vs software; IoT and robots
  {
    topic: STRAND.CS,
    title: `${Y} · Hardware, Software & Robots`,
    summary: "Sort the parts you can touch from the parts you can't, then meet the robots and smart gadgets that mix both — and build a slide to show it.",
    badgeName: "Tech Sorter",
    badgeIcon: "🧩",
    badgeDescription: "Sorted hardware from software and described how robots and smart devices use both.",
    contentJson: JSON.stringify([
      block("heading", { text: "Touch it or not?" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "HARDWARE is every part of a computer you can TOUCH — screen, keyboard, mouse, the box inside, the camera. SOFTWARE is the part you can't touch — the games, apps and programs that tell the hardware what to do.\n\nA robot vacuum is hardware (wheels, brushes, bump sensor) running software (the rule 'if I bump something, turn'). Smart gadgets that talk to the internet — a doorbell camera, a smart light — are called the Internet of Things, or IoT.",
        tip: "Quick test: can you drop it on your foot? Then it's hardware.",
      }),
      block("heading", { text: "Step 1 — Sort the cards" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Your teacher has a pile of picture cards (or write your own on sticky notes):",
        actions: [
          "Make two hoops on the table: HARDWARE and SOFTWARE",
          "Sort every card. Keyboard? Hardware. Scratch? Software. Tablet? Hardware. Minecraft? Software",
          "Find ONE thing that is tricky — a smart speaker? a robot? Talk with your partner: which bits are hardware and which are software?",
        ],
        tip: "Every robot needs BOTH: hardware to move and sense, software to decide. Neither works alone.",
      }),
      block("heading", { text: "Step 2 — Make a slide" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Open Google Slides (or PowerPoint) and make ONE slide:",
        actions: [
          "Title: 'Hardware and Software'",
          "Left side: three pictures of hardware. Right side: three pictures of software (search 'icon' + the name, or draw them)",
          "At the bottom, add a picture of one robot or smart gadget and write: 'Hardware: … Software: …'",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Hardware and software slide",
        text: "Screenshot your finished slide — both sides and your robot at the bottom.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: my robot's two halves",
        text: "Press record and tell me: what is hardware, what is software, and what are the hardware and software parts of YOUR robot or gadget?",
      }),
      wrapUpPrompt("Two or three sentences is perfect."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Hardware and software slide", "Slide sorting hardware from software with a robot/IoT example."),
        audioCriterion(2, "Voice note: my robot's two halves", "Explains hardware vs software using a robot or smart device."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // CT — Decompose tasks; efficient algorithms
  {
    topic: STRAND.CT,
    title: `${Y} · Break It Down`,
    summary: "Take a big job — making a birthday party, tidying the classroom — and chop it into small steps. Then find the FASTEST set of steps that still works.",
    badgeName: "Step Splitter",
    badgeIcon: "🪓",
    badgeDescription: "Decomposed a task into smaller parts and compared two algorithms to find the more efficient one.",
    contentJson: JSON.stringify([
      block("heading", { text: "Big jobs are just lots of small jobs" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "'Plan a birthday party' feels huge. But it's really: pick a day → write invitations → choose food → choose games → decorate. Breaking a big job into small jobs is called DECOMPOSING. Programmers do it before writing any code.\n\nAnd there is usually more than one way to do a job. An algorithm that gets the same result in FEWER steps is more EFFICIENT.",
        tip: "If a step still feels big, break THAT one down too.",
      }),
      block("heading", { text: "Step 1 — Decompose it" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Pick a big job: make a sandwich, get ready for school, or clean the fish tank.",
        actions: [
          "Write the big job in a bubble in the middle of a sheet of paper",
          "Draw branches to 4–6 smaller jobs. Give each one a short name",
          "Under each small job, write 2–3 tiny steps. Your paper is now a decomposition map!",
        ],
      }),
      block("heading", { text: "Step 2 — Race two algorithms" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Now find the fastest way. Take 10 coloured cubes mixed up in a cup.",
        actions: [
          "Algorithm A: pick up one cube, walk it to the matching colour pile, walk back. Repeat. Count your steps (or time it)",
          "Algorithm B: tip them all out, sort them where they land, carry each PILE to its place. Count your steps",
          "Which one took fewer steps? That's the more efficient algorithm. Write both counts on your map",
        ],
        tip: "Both algorithms get the same sorted piles. Efficient just means 'less work for the same result'.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Decomposition map photo",
        text: "Photo your decomposition map with the two algorithm step-counts written on it.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: the faster way",
        text: "Press record: what big job did you break down, and which of your two algorithms was more efficient — and why?",
      }),
      wrapUpPrompt("A few sentences is plenty."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Decomposition map photo", "Decomposition map with step counts for two algorithms."),
        audioCriterion(2, "Voice note: the faster way", "Explains decomposition and which algorithm was more efficient."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // P — Multi-object Scratch games
  {
    topic: STRAND.P,
    title: `${Y} · Two-Sprite Scratch Game`,
    summary: "Build a real game in Scratch with TWO sprites that do different things — steer one with the arrow keys while the other runs away — and keep score.",
    badgeName: "Game Builder",
    badgeIcon: "🎮",
    badgeDescription: "Programmed two sprites with their own scripts, using events, a loop and a score variable.",
    contentJson: JSON.stringify([
      block("heading", { text: "One game, two characters" }),
      block("text", {
        kind: "learn",
        minutes: 3,
        text: "In Scratch every character is a SPRITE, and every sprite has its OWN code. The cat listens for the arrow keys. The apple bounces around on its own. Put them together and you have a game.\n\nToday: the cat chases the apple. Touch it → score goes up → apple jumps away.",
        tip: "Click on a sprite in the bottom-right to see and edit ITS code. The code belongs to the sprite you've picked.",
      }),
      block("heading", { text: "Step 1 — Steer the cat" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Go to scratch.mit.edu → Create. The cat is already there.",
        actions: [
          "Click the Cat sprite. Build this script, then make three more for the other arrows (left, up, down)",
          "Press the green flag and try the keys. The cat should move in all four directions",
        ],
      }),
      block("scratch", {
        text: "when [right arrow v] key pressed\npoint in direction (90)\nmove (10) steps",
        tip: "Left is direction -90, up is 0, down is 180. If the cat flips upside down, click its Direction and pick the left-right arrows icon.",
      }),
      block("heading", { text: "Step 2 — The runaway apple" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Add a second sprite: Choose a Sprite (bottom-right) → search 'Apple'. Click the Apple sprite, then:",
        actions: [
          "Build this script so the apple glides around forever",
          "Press the flag. Chase it with the cat. Can you catch it?",
        ],
      }),
      block("scratch", {
        text: "when green flag clicked\nforever\nglide (1) secs to (random position v)\nend",
        tip: "Too hard to catch? Change 1 sec to 2. Too easy? Try 0.5.",
      }),
      block("heading", { text: "Step 3 — Keep score" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Still on the Apple sprite: Variables → Make a Variable → call it 'score'. Then build:",
        actions: [
          "This script checks all the time: touching the cat? Score goes up 1 and the apple jumps away",
          "Play for 30 seconds. What's your high score? Challenge a friend",
        ],
      }),
      block("scratch", {
        text: "when green flag clicked\nset [score v] to (0)\nforever\nif <touching (Cat v)?> then\nchange [score v] by (1)\ngo to (random position v)\nend\nend",
        tip: "Two sprites, each with their own jobs. That's how every big game works — just with hundreds of sprites.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Game screenshot",
        text: "Screenshot your game running — both sprites on stage and the score showing.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: who does what",
        text: "Press record: what does the cat's code do, what does the apple's code do, and what makes the score go up?",
      }),
      wrapUpPrompt("Say what you would add to your game next."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Game screenshot", "Game running with two sprites and a visible score."),
        audioCriterion(2, "Voice note: who does what", "Explains each sprite's script and how the score changes."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // MD — Spreadsheets: cells, formats, filters
  {
    topic: STRAND.MD,
    title: `${Y} · My First Spreadsheet`,
    summary: "Turn a class survey into a spreadsheet — type into cells, make numbers look like numbers, colour the headings, and use a filter to answer questions in seconds.",
    badgeName: "Cell Captain",
    badgeIcon: "📊",
    badgeDescription: "Entered data into cells, formatted a spreadsheet and used a filter to answer a question.",
    contentJson: JSON.stringify([
      block("heading", { text: "A grid that thinks" }),
      block("text", {
        kind: "learn",
        minutes: 3,
        text: "A spreadsheet is a giant grid. Each box is a CELL with a name — A1 is column A, row 1. You can type words or numbers into cells, make them bold or coloured (that's FORMATTING), and use a FILTER to show only the rows you want.\n\nIt's like a notebook that can sort and search itself.",
        tip: "Click any cell and look at the top-left — it tells you the cell's name, like B4.",
      }),
      block("heading", { text: "Step 1 — Collect and type" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Survey 8 classmates: favourite fruit, and how many pets they have. Then open Google Sheets (or Excel):",
        actions: [
          "In A1 type 'Name', B1 'Favourite fruit', C1 'Pets'",
          "Type one classmate per row underneath — rows 2 to 9",
          "Click cell C5 (or any cell) and say its name out loud. Spreadsheets talk in cell names",
        ],
      }),
      block("heading", { text: "Step 2 — Format and filter" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Make it clear, then ask it a question:",
        actions: [
          "Select row 1 → make it BOLD and give it a fill colour. Make the columns wider so nothing is squashed",
          "Select column C → Format as Number. Numbers should line up on the right",
          "Select all your data → Data → Create a filter. Click the filter arrow on 'Favourite fruit' and show ONLY 'apple'. How many people?",
          "Try another question: filter Pets to show only 0. Who has no pets?",
        ],
        tip: "A filter doesn't delete anything — it just hides rows. Clear the filter and everyone comes back.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Spreadsheet screenshot",
        text: "Screenshot your spreadsheet with the bold coloured heading row and a filter switched on.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: cells and filters",
        text: "Press record: what is a cell, and what question did your filter answer?",
      }),
      wrapUpPrompt("Short sentences are fine."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Spreadsheet screenshot", "Formatted spreadsheet with a filter applied."),
        audioCriterion(2, "Voice note: cells and filters", "Explains what a cell is and what the filter showed."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // DC — School network tour; simple ciphers
  {
    topic: STRAND.DC,
    title: `${Y} · Network Tour & Secret Cipher`,
    summary: "Follow the cables and wifi around school to see how the computers are joined up, then write a message in a secret code that only your partner can read.",
    badgeName: "Network Navigator",
    badgeIcon: "🗺️",
    badgeDescription: "Described how devices in school connect into a network and encoded a message with a simple cipher.",
    contentJson: JSON.stringify([
      block("heading", { text: "Joined-up computers" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "A NETWORK is computers joined together so they can share things — the printer, the internet, your saved files. In school the joins are CABLES (the sockets in the wall) and WIFI (invisible radio from the little boxes on the ceiling). They all lead back to a cupboard full of blinking lights — the server room.\n\nBecause messages travel through shared wires, people sometimes hide them in a CIPHER — a secret code. We'll make a simple one.",
        tip: "Look up! Those white boxes on the ceiling are wifi access points.",
      }),
      block("heading", { text: "Step 1 — Network tour" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Walk the school with your teacher. Bring a clipboard:",
        actions: [
          "Find a wall socket with a network cable. Where does the cable go? Draw it",
          "Find a wifi box. Count how many you pass. Draw them on your map too",
          "Find the printer everyone shares. Which classrooms can print to it?",
          "Draw your map: classrooms, cables, wifi boxes, and arrows back to the server room",
        ],
      }),
      block("heading", { text: "Step 2 — Secret cipher" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Make a simple code with a partner — swap each letter for the NEXT one in the alphabet (A→B, B→C, … Z→A):",
        actions: [
          "Write the alphabet in a line, and the shifted alphabet underneath it. That's your key",
          "Write a 3-word message. Swap every letter using your key. HELLO becomes IFMMP",
          "Swap with your partner and decode theirs. Then show it to someone WITHOUT the key — can they read it?",
        ],
        tip: "Both of you need the SAME key or it won't work — that's true of every secret code ever made.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Network map and cipher photo",
        text: "Photo your network map and your coded message side by side.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: how school is connected",
        text: "Press record: how do the computers in school join up, and how does your cipher hide a message?",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Network map and cipher photo", "School network map plus an encoded message."),
        audioCriterion(2, "Voice note: how school is connected", "Describes the school network and explains the cipher."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // TC — Typing fluency; keyword search
  {
    topic: STRAND.TC,
    title: `${Y} · Type It, Find It`,
    summary: "Train your fingers to type with both hands, then learn the keyword trick that makes a search engine find exactly what you mean.",
    badgeName: "Keyboard Kid",
    badgeIcon: "⌨️",
    badgeDescription: "Practised two-handed typing and used well-chosen keywords to find information online.",
    contentJson: JSON.stringify([
      block("heading", { text: "Fingers and keywords" }),
      block("text", {
        kind: "learn",
        minutes: 3,
        text: "Good typists use BOTH hands and don't look down. Left hand lives on A S D F, right hand on J K L ; — feel the little bumps on F and J. That's home row.\n\nAnd searching is a skill too. A search engine matches WORDS. 'Tell me about big cats that live in jungles' works worse than 'jungle big cats'. Short, exact keywords win.",
        tip: "Type slowly and correctly first. Speed comes by itself.",
      }),
      block("heading", { text: "Step 1 — Typing practice" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Open a typing game (your teacher will show you which one):",
        actions: [
          "Put your fingers on home row — bumps under your pointing fingers",
          "Do the home-row lesson, then the top-row lesson. Try not to look at the keys",
          "Do the one-minute test. Write down your words per minute. Do it again — did it go up?",
        ],
      }),
      block("heading", { text: "Step 2 — Keyword hunt" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Your teacher gives you three questions (e.g. 'How tall is a giraffe?'). For each one:",
        actions: [
          "Circle the 2–3 most important words in the question. Those are your keywords",
          "Type ONLY the keywords into the search box. Look at the first few results",
          "Write the answer and the name of the website you found it on",
          "Try one question with the whole sentence instead — are the results better or worse?",
        ],
        tip: "If the answer isn't there, change a keyword — 'height' instead of 'tall'.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Typing score and keyword sheet",
        text: "Photo your typing score next to your keyword sheet with the three answers.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: my best keywords",
        text: "Press record: where do your fingers rest when you type, and which keywords found your best answer?",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Typing score and keyword sheet", "Typing test result plus keyword search answers."),
        audioCriterion(2, "Voice note: my best keywords", "Describes home-row typing and keyword choices."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // SW — Personal info; safe group chats
  {
    topic: STRAND.SW,
    title: `${Y} · Safe Group Chat Rules`,
    summary: "Work out what counts as personal information, then write the rules for a kind, safe group chat — and make a poster the whole class can follow.",
    badgeName: "Chat Guardian",
    badgeIcon: "💬",
    badgeDescription: "Identified personal information to keep private and set rules for safe, kind group chats.",
    contentJson: JSON.stringify([
      block("heading", { text: "What's private?" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "PERSONAL INFORMATION is anything that tells a stranger who you are or where to find you: your full name, your address, your school, your phone number, your passwords, photos of your house. That stays private — especially online.\n\nGroup chats are fun, but messages go to EVERYONE at once and can be screenshotted. So: be kind, keep private things private, and tell a grown-up if something feels wrong.",
        warn: "If anyone in a chat asks for your address, school or a photo of you — stop and tell a trusted adult.",
      }),
      block("heading", { text: "Step 1 — Private or fine to share?" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Sort these cards with a partner: favourite colour, home address, best football team, school name, a pet's name, phone number, a joke, a password, a photo of your front door.",
        actions: [
          "Two piles: PRIVATE and FINE TO SHARE",
          "Talk about the tricky ones. Is a pet's name private? What if it's also your password?",
          "Add two cards of your own",
        ],
      }),
      block("heading", { text: "Step 2 — Chat rules poster" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Make a poster of FIVE rules for a safe group chat. Start each rule with a verb:",
        actions: [
          "Write rules like 'Be kind', 'Keep private things private', 'Don't share photos of others without asking', 'Leave or tell an adult if it feels wrong', 'Think before you send'",
          "Draw a picture for each rule so even someone who can't read yet gets it",
          "Sign it — your poster, your promise",
        ],
        tip: "A good rule is one you could explain to a younger child in one breath.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Chat rules poster photo",
        text: "Photo your finished poster with all five rules.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: private and kind",
        text: "Press record: name two pieces of personal information you'd never share, and say your favourite chat rule and why.",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Chat rules poster photo", "Poster with five safe-chat rules."),
        audioCriterion(2, "Voice note: private and kind", "Names private information and explains a chat rule."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // DW — Content has a purpose; tech changes
  {
    topic: STRAND.DW,
    title: `${Y} · What's It For?`,
    summary: "Every website, video and advert is made for a reason — to teach, to sell, to make you laugh. Spot the purpose, then build a timeline of how technology has changed.",
    badgeName: "Purpose Spotter",
    badgeIcon: "🎯",
    badgeDescription: "Identified the purpose of online content and showed how technology has changed over time.",
    contentJson: JSON.stringify([
      block("heading", { text: "Why was this made?" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "Nothing online just 'happens'. Someone made it for a PURPOSE: to INFORM (a news page), to PERSUADE (an advert), to ENTERTAIN (a funny video), to HELP (a how-to). Knowing the purpose helps you decide how much to trust it.\n\nAnd the technology itself keeps changing. Your grandparents had no internet. Your parents had phones that only made calls. What will YOU have?",
        tip: "Ask: who made this, and what do they want me to do after I see it?",
      }),
      block("heading", { text: "Step 1 — Purpose sort" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Your teacher shows you six pieces of content (a cereal advert, a weather page, a cartoon clip, a recipe…):",
        actions: [
          "For each one, write its purpose: inform, persuade, entertain, or help",
          "Write ONE clue that told you — bright colours and a price? Persuade. Steps and numbers? Help",
          "Which one would you trust most for facts? Why?",
        ],
      }),
      block("heading", { text: "Step 2 — Tech timeline slide" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "In Google Slides, make a timeline on one slide:",
        actions: [
          "Draw a line across the slide. Add four points: 'When my grandparents were my age', 'When my parents were my age', 'Now', 'When I'm grown up'",
          "Above each point, add a picture and a word: how did people talk to friends far away? listen to music? find out a fact?",
          "For the last point, draw or describe YOUR invention",
        ],
        tip: "Ask a grown-up at home about their first phone or computer — real answers make the best timelines.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Timeline slide screenshot",
        text: "Screenshot your timeline slide with all four points.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: purpose and change",
        text: "Press record: pick one piece of content and say what it was FOR and how you knew. Then tell me one way technology has changed.",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Timeline slide screenshot", "Slide showing a technology-change timeline."),
        audioCriterion(2, "Voice note: purpose and change", "Identifies content purpose and describes a technology change."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },
];
