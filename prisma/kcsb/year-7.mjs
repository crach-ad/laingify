// KCSB Computing — Year 7 (ages 11–12, TEEN band). Cambridge Lower Secondary
// Stage 7. Toolbelt: Python 3, Tinkercad (Circuits + CAD → 3D printing).
//
// Teen-band shape: learn card → build card(s) with actions → screenshot/photo
// checkpoint → voice-note checkpoint explaining the concept → typed wrap-up
// with a Cambridge-flavoured ask. Python is run in IDLE, Replit or Trinket —
// the `code` blocks here are the reference source, not an in-browser runner.

import { block, photoCriterion, audioCriterion, wrapUpCriterion, wrapUpPrompt } from "../seed-lib.mjs";
import { STRAND } from "./strands.mjs";

const Y = "Y7";
const TINKERCAD = "https://www.tinkercad.com/dashboard";

export const modules = [
  // CS — Logic gates; binary data; AI applications (+ Tinkercad CAD step)
  {
    topic: STRAND.CS,
    title: `${Y} · Logic Gates, Binary & AI`,
    summary: "Wire real AND, OR and NOT gates in Tinkercad Circuits, prove them with truth tables, see how everything a computer stores is binary — then model a gate housing in Tinkercad CAD.",
    badgeName: "Gate Keeper",
    badgeIcon: "🔌",
    badgeDescription: "Built and tested logic gates, derived truth tables, represented data in binary and produced a simple 3D model.",
    contentJson: JSON.stringify([
      block("heading", { text: "Everything is a switch" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "Inside every processor are billions of tiny switches. A switch is either ON (1) or OFF (0) — that's binary. Combine switches and you get LOGIC GATES: AND outputs 1 only if BOTH inputs are 1; OR outputs 1 if EITHER is; NOT flips the input.\n\nFrom those three gates you can build an adder, a memory cell, a whole computer. Today you build them for real. And AI? It's the same gates, arranged to find patterns in enormous amounts of binary data — photos, speech, text.",
        tip: "A TRUTH TABLE lists every possible input combination and the output. Two inputs → four rows. Always.",
      }),
      block("heading", { text: "Step 1 — Gates in Tinkercad Circuits" }),
      block("text", {
        kind: "build",
        minutes: 20,
        text: "Open Tinkercad → Circuits → Create new Circuit.",
        actions: [
          "Drag in a 9V battery, two slide switches, an LED and a 220 Ω resistor",
          "AND gate by hand: wire the two switches in SERIES with the LED — the LED only lights when BOTH switches are on. Start the simulation and flick every combination",
          "OR gate: rewire the switches in PARALLEL — now EITHER switch lights it",
          "Write the truth table for each (A, B, Output — four rows). Then search the components for the '74HC04' NOT gate chip and use it to invert one switch",
        ],
        tip: "Series = AND, parallel = OR. Say it until it sticks — it's the physical reason gates behave the way they do.",
      }),
      block("embed", { url: TINKERCAD }),
      block("heading", { text: "Step 2 — Binary and a 3D housing" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Two short tasks:",
        actions: [
          "Binary: write your age, then the number 200, in 8-bit binary (128 64 32 16 8 4 2 1). Convert 01001011 back to decimal",
          "CAD: in Tinkercad → 3D Designs, model a small box (40 × 25 × 15 mm) with a 5 mm round hole for an LED — a housing for your gate. Drag a Box, then a Cylinder set to 'Hole', align, Group",
          "AI: name one AI application you used this week (maps, autocorrect, a recommendation) and write down what binary data it must have learned from",
        ],
        warn: "Only export the STL for printing if your teacher confirms the printer queue — the Abaco 3D-print module covers slicing and printing in full.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Logic gate circuit screenshot",
        text: "Screenshot your Tinkercad circuit mid-simulation with the LED lit, plus your hand-written truth tables (one photo or two).",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: AND, OR, NOT and binary",
        text: "Record yourself: explain the difference between AND and OR using your switches, what NOT does, and read 200 in 8-bit binary aloud.",
      }),
      wrapUpPrompt("Explain, as if to a Year 5 pupil, why series switches behave like AND."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Logic gate circuit screenshot", "Tinkercad circuit simulating a gate, with truth tables."),
        audioCriterion(2, "Voice note: AND, OR, NOT and binary", "Explains gate behaviour and reads a binary number correctly."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve — and the series/AND explanation."),
      ],
    },
  },

  // CT — Flowcharts with logic AND / OR / NOT
  {
    topic: STRAND.CT,
    title: `${Y} · Flowcharts with AND, OR & NOT`,
    summary: "Design an algorithm as a proper flowchart — standard symbols, decision diamonds with compound conditions — and trace it to prove it works before any code is written.",
    badgeName: "Flow Architect",
    badgeIcon: "🔀",
    badgeDescription: "Drew flowcharts with standard symbols and AND/OR/NOT conditions, and verified them with trace tables.",
    contentJson: JSON.stringify([
      block("heading", { text: "Think first, code second" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "A FLOWCHART is an algorithm you can see. Ovals start and stop. Rectangles are processes. Parallelograms are input/output. Diamonds are DECISIONS with a Yes and a No arrow.\n\nReal decisions are rarely one condition. 'Can I go on the ride?' is height ≥ 120 AND age ≥ 8. 'Is the shop open?' is weekday OR Saturday-morning. 'Can I skip the queue?' is NOT (a member). Compound conditions belong in one diamond.",
        tip: "Every arrow must end somewhere and there must be exactly one Stop. If you can't trace a path from Start to Stop, the algorithm has a bug.",
      }),
      block("heading", { text: "Step 1 — Design" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Pick one: a theme-park ride gate, a school-uniform checker, or a vending machine that only accepts coins ≥ 10p AND has stock. Draw it on paper or in draw.io:",
        actions: [
          "Start oval → input parallelogram(s) for each value you need",
          "At least TWO decision diamonds. One must use AND or OR; one must use NOT",
          "Every diamond has a labelled Yes and No arrow; outputs are parallelograms; one Stop",
        ],
      }),
      block("heading", { text: "Step 2 — Trace it" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "A trace table proves the chart with data:",
        actions: [
          "Columns: each input, each condition's result (True/False), the output",
          "Run four test cases through the chart with your finger — include one that hits the NOT path and one that makes the AND fail",
          "Did any case loop forever or end with no output? Fix the chart, re-trace",
          "Swap with a partner: trace THEIR chart with your own test data and try to break it",
        ],
        tip: "Testers choose inputs right at the boundary — height exactly 120, age exactly 8. That's where bugs hide.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Flowchart and trace table photo",
        text: "Photo your finished flowchart with the trace table next to it.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: walking a decision",
        text: "Record yourself walking through ONE test case aloud — name each symbol, say whether the compound condition was True or False, and where it ended.",
      }),
      wrapUpPrompt("State the compound condition you used and why it needed AND/OR/NOT rather than a single comparison."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Flowchart and trace table photo", "Flowchart with standard symbols and compound conditions, plus trace table."),
        audioCriterion(2, "Voice note: walking a decision", "Traces one case through the flowchart, naming the symbols and conditions."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve — plus the compound-condition explanation."),
      ],
    },
  },

  // P — Blocks to Python: types, variables, I/O
  {
    topic: STRAND.P,
    title: `${Y} · Blocks to Python`,
    summary: "Leave the blocks behind: write your first real Python programs with input, output, variables and data types — and meet your first error messages.",
    badgeName: "Python Initiate",
    badgeIcon: "🐍",
    badgeDescription: "Wrote and ran text-based Python programs using variables, data types, input() and print().",
    contentJson: JSON.stringify([
      block("heading", { text: "Same ideas, typed" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "Everything you did in Scratch has a Python twin. 'say' → print(). 'ask and wait' → input(). A variable is still a named box — but Python cares what TYPE is in the box: a str (text), an int (whole number), a float (decimal), a bool (True/False).\n\nYou'll type your code in IDLE, Replit or Trinket and press Run. Python reads it top to bottom and stops dead at the first mistake — with a message that tells you the line number. Read it. It's trying to help.",
        tip: "Indentation and capital letters matter. Print is not print. A missing bracket is the #1 beginner error — check them in pairs.",
      }),
      block("heading", { text: "Step 1 — Hello, variables" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "New file. Type this exactly, run it, then change the name and age:",
        actions: ["Save as greet.py", "Run (F5 in IDLE, ▶ in Replit/Trinket)", "Change the values and run again"],
      }),
      block("code", {
        text: 'name = "Ada"\nage = 11\nprint("Hello, " + name)\nprint("Next year you will be", age + 1)\nprint(type(name), type(age))',
        tip: "The last line prints <class 'str'> and <class 'int'>. Python KNOWS the types — that's why \"Hello, \" + age would crash: you can't glue text to a number.",
      }),
      block("heading", { text: "Step 2 — Input and output" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Now make it interactive. input() always gives you a str — convert with int() when you need a number:",
        actions: ["Save as calc.py and run it", "Type a number when asked. Then type a word — read the error message", "Add a third question: their favourite number as a float, and print it doubled"],
      }),
      block("code", {
        text: 'name = input("What is your name? ")\nyears = int(input("How old are you? "))\nmonths = years * 12\nprint(name, "has been alive for about", months, "months")\nis_teen = years >= 13\nprint("Teenager?", is_teen)',
        tip: "is_teen is a bool — True or False. Comparison operators (>=, ==, !=) always produce one. You'll feed these into if statements in Year 8.",
      }),
      block("heading", { text: "Step 3 — Your own program" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Write a 6–10 line program of your own — a tuck-shop total, a dog-years converter, a mad-lib story. It must use:",
        actions: ["At least one input() and at least two print()", "A str, an int AND a float variable", "One calculation", "Meaningful variable names — total_cost, not x"],
        warn: "Run it at least three times with different inputs. A program that only works once isn't finished.",
      }),
      block("code", {
        text: '# Example: dog years\ndog_name = input("Dog\'s name? ")\nhuman_years = int(input("Age in human years? "))\ndog_years = human_years * 7.0\nprint(dog_name, "is about", dog_years, "in dog years")',
        tip: "Lines starting with # are comments — Python ignores them, humans don't. Start every file with one that says what it does.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Python program screenshot",
        text: "Screenshot your own program's code AND its output after a run — both visible.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: types and input",
        text: "Record yourself: name your three variables and their data types, explain why input() needed int(), and describe one error message you got and how you fixed it.",
      }),
      wrapUpPrompt("Explain the purpose of each variable in your program and which data type it holds."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Python program screenshot", "Learner's own Python program with code and output visible."),
        audioCriterion(2, "Voice note: types and input", "Names variable types, explains int(input()), and describes fixing an error."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve — plus the variable/type explanation."),
      ],
    },
  },

  // MD — Models and simulations; primary keys
  {
    topic: STRAND.MD,
    title: `${Y} · Models, Simulations & Primary Keys`,
    summary: "Build a spreadsheet model that predicts the future of a school tuck shop, run what-if simulations on it — and learn why every real database row needs a primary key.",
    badgeName: "Model Maker",
    badgeIcon: "📈",
    badgeDescription: "Built a spreadsheet model with formulas, ran what-if simulations, and explained the role of a primary key.",
    contentJson: JSON.stringify([
      block("heading", { text: "A model is a question machine" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "A MODEL is a simplified version of something real, built from rules. A spreadsheet model uses formulas as the rules: profit = sales × price − costs. Change one input and every answer updates — that's a SIMULATION: 'what if the price goes up 20p?'\n\nModels live on data, and data lives in tables. Every row in a proper table has a PRIMARY KEY — a field that is unique for every record (a student ID, an ISBN, a product code) so two 'Sam Khan's can never be confused.",
        tip: "Weather forecasts, Formula 1 pit strategy and vaccine roll-outs all start as a model like the one you're about to build.",
      }),
      block("heading", { text: "Step 1 — Build the model" }),
      block("text", {
        kind: "build",
        minutes: 20,
        text: "In Google Sheets or Excel, model a tuck shop for 5 school days:",
        actions: [
          "Columns: Product ID (primary key — e.g. P001), Product, Cost price, Sell price, Units per day. Add 5 products. Make sure no two IDs match",
          "Formulas: Profit per unit = sell − cost; Daily profit = units × profit per unit; Weekly profit = daily × 5. Use cell references, never typed-in numbers",
          "Bottom row: =SUM() of weekly profit. Format money as currency",
          "Put the inputs you want to experiment with (price, units) in their own highlighted cells so the model is easy to drive",
        ],
        tip: "If you change a price and the total doesn't move, a formula somewhere contains a number instead of a reference. Hunt it down.",
      }),
      block("heading", { text: "Step 2 — Simulate" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Run three what-if scenarios and record the weekly profit for each:",
        actions: [
          "Scenario A: every sell price +10p. Scenario B: units per day −20%. Scenario C: drop the least profitable product entirely",
          "Add a small results table: Scenario / Weekly profit / Change vs baseline",
          "Try to duplicate a Product ID and think: which product would a sales report now be talking about? That's why primary keys must be unique",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Spreadsheet model screenshot",
        text: "Screenshot the model showing formulas (Ctrl+` / Cmd+` toggles formula view) or the scenarios table — Product ID column visible.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: what-if and primary keys",
        text: "Record yourself: which scenario made the most profit and why, what makes your spreadsheet a MODEL rather than a list, and what the primary key is for.",
      }),
      wrapUpPrompt("Name one simplification your model makes that the real tuck shop doesn't."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Spreadsheet model screenshot", "Model with formulas / scenarios and a primary-key column."),
        audioCriterion(2, "Voice note: what-if and primary keys", "Interprets a scenario and explains model vs list and the purpose of a primary key."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve — plus one simplification the model makes."),
      ],
    },
  },

  // DC — IP / URL / DNS; encryption; secure sites
  {
    topic: STRAND.DC,
    title: `${Y} · IP, URL, DNS & Secure Sites`,
    summary: "Follow a web request from the address bar to a server and back: URLs, DNS lookups, IP addresses — and how HTTPS encryption stops anyone reading it on the way.",
    badgeName: "Packet Tracer",
    badgeIcon: "🌐",
    badgeDescription: "Explained how URLs, DNS and IP addresses locate a server, and how encryption secures a site.",
    contentJson: JSON.stringify([
      block("heading", { text: "What happens when you press Enter" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "You type a URL: https://www.bbc.co.uk/newsround. Computers don't use names — they use IP ADDRESSES like 151.101.0.81. So your device asks DNS (the internet's phone book) 'what's the IP for www.bbc.co.uk?', gets the number, and sends the request there.\n\nThe https:// part matters: the S means the connection is ENCRYPTED. Your request is scrambled with a key only you and the server share, so the café wifi, your ISP and anyone in between see gibberish. The padlock in the address bar is the proof.",
        tip: "URL = protocol + domain + path. https:// + www.bbc.co.uk + /newsround. Learn to split it on sight.",
      }),
      block("heading", { text: "Step 1 — Look it up yourself" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Open a terminal (Command Prompt on Windows, Terminal on Mac) or use an online DNS lookup tool if the network blocks it:",
        actions: [
          "Type nslookup www.bbc.co.uk — write down the IP address(es) it returns. Try two more sites",
          "Paste one IP straight into the browser address bar. Does the site load? (Some do, some redirect — note what happened)",
          "In the browser, click the padlock on an https site → view the certificate. Who issued it? Until when is it valid?",
          "Find one http:// (no S) site. What does the browser warn?",
        ],
      }),
      block("heading", { text: "Step 2 — Encrypt a message" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Keys are the heart of HTTPS. Model it with a partner:",
        actions: [
          "Agree a secret key (a number 1–25). Encrypt a 6-word message with a Caesar shift of that key",
          "Pass it via a third person (the 'wifi'). Can they read it? Your partner decrypts it with the key",
          "Now discuss: how did you share the key without the 'wifi' hearing it? That problem is what real HTTPS solves with public-key cryptography",
        ],
        tip: "Caesar is easy to crack; HTTPS uses keys hundreds of digits long. The IDEA is identical — the maths is just much bigger.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "DNS lookup screenshot",
        text: "Screenshot your nslookup results (or the online lookup) and the certificate padlock panel — one or two images.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: from URL to server",
        text: "Record yourself narrating the journey: URL → DNS → IP → server → back, and say why the padlock means the café wifi can't read your page.",
      }),
      wrapUpPrompt("Split one URL you used into protocol, domain and path."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "DNS lookup screenshot", "DNS lookup output and/or a site certificate panel."),
        audioCriterion(2, "Voice note: from URL to server", "Narrates URL → DNS → IP → server and explains encryption's purpose."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve — plus a URL broken into its parts."),
      ],
    },
  },

  // TC — Cloud storage; track changes; advanced search
  {
    topic: STRAND.TC,
    title: `${Y} · Cloud Docs, Track Changes & Advanced Search`,
    summary: "Work like a real team: co-write a document in the cloud, suggest and review edits with track changes, and find exactly the right source with advanced search operators.",
    badgeName: "Cloud Collaborator",
    badgeIcon: "☁️",
    badgeDescription: "Collaborated on a cloud document using suggestions/track changes and version history, and used advanced search operators.",
    contentJson: JSON.stringify([
      block("heading", { text: "Where is your file, really?" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "CLOUD STORAGE means your file lives on a server in a data centre, not on this laptop — so you can open it from any device and two people can edit it at once. Because everyone's typing into the same file, teams use SUGGESTING mode (Google Docs) or TRACK CHANGES (Word): edits show up as proposals the owner accepts or rejects, and VERSION HISTORY lets you rewind.\n\nFinding sources is a skill too. \"exact phrase\" in quotes, site:bbc.co.uk to search one site, -word to exclude, filetype:pdf for documents.",
      }),
      block("heading", { text: "Step 1 — Collaborate" }),
      block("text", {
        kind: "build",
        minutes: 18,
        text: "In pairs, in Google Docs (or Word Online):",
        actions: [
          "Partner A creates a doc 'Should phones be allowed at school?' and shares it with B as Editor. Both write two sentences",
          "Switch to Suggesting (pencil icon → Suggesting) / Review → Track Changes. B rewrites one of A's sentences; A rewrites one of B's",
          "Each of you accept one suggestion and reject one — with a comment explaining why",
          "Open File → Version history. Name the current version 'Draft 1'. Look at who changed what",
        ],
        tip: "Never delete a teammate's words in editing mode. Suggest — then they decide. That's how professional writing works.",
      }),
      block("heading", { text: "Step 2 — Search like a researcher" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Find evidence for your doc using three operators:",
        actions: [
          "site:gov.uk phones school — a government source",
          "\"mobile phone ban\" -opinion — the exact phrase, excluding opinion pieces",
          "phones classroom study filetype:pdf — an actual report",
          "Paste the best link for each into the doc as a hyperlink, with one line on why it's trustworthy",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Track-changes screenshot",
        text: "Screenshot the document with suggestions/track changes and a comment visible — or the version history panel.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: cloud and search operators",
        text: "Record yourself: where is your file actually stored, why did you use Suggesting instead of just editing, and which search operator found the best source?",
      }),
      wrapUpPrompt("Give one advantage and one risk of storing schoolwork in the cloud."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Track-changes screenshot", "Shared document showing suggestions / track changes or version history."),
        audioCriterion(2, "Voice note: cloud and search operators", "Explains cloud storage, suggesting mode, and a search operator used."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve — plus one cloud advantage and one risk."),
      ],
    },
  },

  // SW — Personal responsibility; your record follows you
  {
    topic: STRAND.SW,
    title: `${Y} · Your Record Follows You`,
    summary: "Audit your own digital record, trace how one post can travel, and write the personal-responsibility rules you'd actually stand by — because what you do online now is read later by people you haven't met yet.",
    badgeName: "Digital Citizen",
    badgeIcon: "🧭",
    badgeDescription: "Evaluated the permanence and reach of online actions and set out personal rules for responsible behaviour.",
    contentJson: JSON.stringify([
      block("heading", { text: "Nothing is private by default" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "Every account, post, like, search and message adds to a record that can outlast the app it was made in. Screenshots escape private chats. Deleted posts survive in backups and other people's saves. Schools, sports clubs and — in a few years — employers and universities DO look.\n\nThis isn't about fear. It's about RESPONSIBILITY: you own your actions online exactly as you do offline, and the smart move is to act as if the person you'll be at 18 is reading over your shoulder.",
        warn: "Do NOT share real passwords, private messages or other people's posts in this lesson. Use made-up examples.",
      }),
      block("heading", { text: "Step 1 — The journey of a post" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "On paper, map where one message can go:",
        actions: [
          "Write a made-up post in the centre: 'Mr X's lesson was a waste of time 😴'. Draw the sender",
          "Draw every hop it could take: group chat → screenshot → another chat → a parent → the school → the teacher. Add a time to each hop",
          "Now add the 'years later' branch: a backup, a search result, a friend's old phone",
          "Count the people who could see it within 24 hours. Compare with how many the sender INTENDED",
        ],
        tip: "The intended audience is almost never the actual audience. Design your posts for the actual one.",
      }),
      block("heading", { text: "Step 2 — My responsibility rules" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Write your own five rules — specific, not slogans:",
        actions: [
          "e.g. 'Before I send anything about a person, I ask: would I say it to their face with their parent listening?'",
          "One rule must be about what you do when SOMEONE ELSE posts something harmful (report, don't forward)",
          "One must be about accounts and passwords (2-step verification, never sharing logins — even with a best friend)",
          "Design it as a poster or a phone lock-screen image you'd actually use",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Post-journey map and rules photo",
        text: "Photo your journey map and your five rules (one or two photos).",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: taking responsibility",
        text: "Record yourself: how many people could see the post within a day, which of your five rules matters most to you, and what you'd do if a friend forwarded something hurtful about a classmate.",
      }),
      wrapUpPrompt("Describe one thing you'll do differently online from today."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Post-journey map and rules photo", "Map of how a post spreads plus five personal responsibility rules."),
        audioCriterion(2, "Voice note: taking responsibility", "Reflects on reach, chosen rules, and a bystander response."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve — plus one concrete change."),
      ],
    },
  },

  // DW — Citation and fair use; future tech
  {
    topic: STRAND.DW,
    title: `${Y} · Citation, Fair Use & Future Tech`,
    summary: "Research an emerging technology and publish a properly cited briefing — quoting fairly, crediting images, and judging which predictions are hype.",
    badgeName: "Cited Source",
    badgeIcon: "📚",
    badgeDescription: "Produced a researched briefing with correct citations, fair-use quoting and credited media on a future technology.",
    contentJson: JSON.stringify([
      block("heading", { text: "Use other people's work — properly" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "Copying someone's words or images without credit is plagiarism. Using them WITH credit, in small amounts, for study or comment is FAIR USE. The tool is the CITATION: who wrote it, what it's called, where it lives, when you read it. Quotes go in quotation marks; ideas you rewrite still need a citation; images need a licence check (Creative Commons, public domain) and a credit line.\n\nYour topic is the future: driverless cars, brain–computer interfaces, lab-grown meat, quantum computers, AI tutors. Half of what's written about them is marketing. Citing lets a reader check which half.",
        tip: "Simple citation format: Author/Organisation (Year). Title. Site name. URL. Accessed date. Consistency matters more than the exact style.",
      }),
      block("heading", { text: "Step 1 — Research with a source log" }),
      block("text", {
        kind: "build",
        minutes: 18,
        text: "Choose one future technology. Keep a source log as you read:",
        actions: [
          "Find four sources: one news site, one company or university page, one video, one critic or sceptic. Log each: who, what, where (URL), when accessed",
          "Copy ONE short quote (under 25 words) from one source, in quotation marks — note the exact page/time stamp",
          "Find one image you're allowed to use (search tools → usage rights → Creative Commons) and note its licence and creator",
          "Mark each source H (hype), E (evidence) or M (mixed) with one line of reasoning",
        ],
      }),
      block("heading", { text: "Step 2 — Publish the briefing" }),
      block("text", {
        kind: "build",
        minutes: 20,
        text: "One page, in Docs or Slides:",
        actions: [
          "Title, then three sections: What it is / What it could change by 2040 / What the sceptics say",
          "Your quote, in quotation marks, with an in-text reference like (BBC, 2026)",
          "The image, with a credit line beneath it: creator, licence",
          "A References list at the end with all four sources in the same format",
        ],
        warn: "A paragraph pasted from a website with a citation at the end is still copying — rewrite in your own words, cite the idea.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Cited briefing screenshot",
        text: "Screenshot your briefing showing the in-text citation, the image credit and the References list.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: fair use and hype",
        text: "Record yourself: what makes your quote fair use rather than plagiarism, how you checked the image licence, and which of your sources you trust least and why.",
      }),
      wrapUpPrompt("Explain one difference between citing a quote and citing an idea you rewrote."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Cited briefing screenshot", "Briefing with in-text citation, credited image and references list."),
        audioCriterion(2, "Voice note: fair use and hype", "Explains fair use, licence checking and source reliability."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve — plus quote vs paraphrase citation."),
      ],
    },
  },
];
