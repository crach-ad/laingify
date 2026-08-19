// KCSB Computing — Year 6 (ages 10–11, YOUTH band). Cambridge Primary Stage 6.
// Toolbelt: MakeCode Arcade, databases, flowcharts.
//
// Youth-band shape: learn card → build card(s) with tappable actions →
// photo/screenshot checkpoint → voice-note checkpoint → typed wrap-up
// (What worked? What challenged you? What would you improve?).

import { block, photoCriterion, audioCriterion, wrapUpCriterion, wrapUpPrompt } from "../seed-lib.mjs";
import { STRAND } from "./strands.mjs";

const Y = "Y6";
const ARCADE = "https://arcade.makecode.com/#editor";

export const modules = [
  // CS — Processor and storage; autonomous robots
  {
    topic: STRAND.CS,
    title: `${Y} · Processor, Storage & Autonomous Robots`,
    summary: "Open up a computer (on paper or for real), label the processor and the storage, then work out what an autonomous robot needs to decide things by itself.",
    badgeName: "Inside-the-Box Explorer",
    badgeIcon: "🧠",
    badgeDescription: "Identified the processor and storage in a computer, explained their jobs, and described what makes a robot autonomous.",
    contentJson: JSON.stringify([
      block("heading", { text: "Brain and memory" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "Every computer — laptop, phone, games console, Mars rover — has a PROCESSOR (the CPU) that does the thinking, and STORAGE that remembers things even when the power is off.\n\nThe CPU follows billions of instructions a second but forgets everything when switched off. Storage (an SSD, a hard drive, a memory card) is slow by comparison but keeps your files. Between them sits RAM: fast short-term memory the CPU works in.\n\nAn AUTONOMOUS robot adds sensors to that recipe: it senses, the processor decides, the motors act — with no human driving it.",
        tip: "Speed vs. memory: the CPU is the chef, RAM is the worktop, storage is the fridge.",
      }),
      block("heading", { text: "Step 1 — Label the insides" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Your teacher has an old computer or a large photo of one opened up. In pairs:",
        actions: [
          "Find the CPU (usually under a fan or heatsink), the RAM sticks, and the storage drive",
          "Stick labels on (or draw the board and label it): CPU, RAM, storage, power supply, and the ports you recognise",
          "Next to each label write its JOB in five words or fewer — 'does the thinking', 'keeps files when off'",
          "Find one number for each: how many GHz is the CPU? How many GB of RAM? How many GB or TB of storage?",
        ],
        tip: "GHz = billions of instruction-steps per second. GB = billions of bytes. Same prefix, completely different things being counted.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Labelled computer photo",
        text: "Photo your labelled computer (or labelled drawing) — CPU, RAM and storage must all be marked.",
      }),
      block("heading", { text: "Step 2 — What makes a robot autonomous?" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Pick a real autonomous robot: a robot vacuum, a self-driving car, a Mars rover, a warehouse robot.",
        actions: [
          "Draw a three-box diagram: SENSORS → PROCESSOR → MOTORS/ACTIONS. Fill in what yours uses (camera? bump sensor? lidar?)",
          "Write ONE decision the processor makes — 'IF the bump sensor is pressed THEN reverse and turn'",
          "Write one situation where it would NOT be autonomous (a human with a remote control)",
        ],
        tip: "Autonomous = decides by itself. Remote-controlled = a human decides. The robot can look identical from outside.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: CPU, storage, autonomy",
        text: "Record yourself: what does the CPU do, what does storage do, and what does your chosen robot sense and decide by itself?",
      }),
      wrapUpPrompt("Mention one job you'd trust an autonomous robot to do — and one you wouldn't."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Labelled computer photo", "Photo of a computer (or drawing) with CPU, RAM and storage labelled."),
        audioCriterion(2, "Voice note: CPU, storage, autonomy", "Explains processor vs storage and what makes a robot autonomous."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // CT — Flowcharts; sub-routines, variables
  {
    topic: STRAND.CT,
    title: `${Y} · Flowchart It`,
    summary: "Plan a program before you build it: draw a flowchart with decisions, a variable that changes, and a sub-routine box you can reuse.",
    badgeName: "Flowchart Planner",
    badgeIcon: "🔀",
    badgeDescription: "Designed an algorithm as a flowchart using the standard shapes, a variable and a named sub-routine.",
    contentJson: JSON.stringify([
      block("heading", { text: "Think first, code second" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "A flowchart is an algorithm drawn as shapes: an OVAL for start/stop, a RECTANGLE for a step, a DIAMOND for a decision (yes/no), a PARALLELOGRAM for input/output. Arrows show the order.\n\nTwo power-ups: a VARIABLE (a named box that holds a value — score, lives, count) and a SUB-ROUTINE (a named mini-flowchart you can call from the main one, so 'check answer' is drawn once and used many times).",
        tip: "If you can't draw it as a flowchart, you can't code it yet. Professionals sketch first.",
      }),
      block("heading", { text: "Step 1 — Flowchart a guessing game" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Design 'Guess my number' on paper (or in a diagram app like draw.io / Google Drawings):",
        actions: [
          "Start oval → rectangle 'set secret to a random number 1–10' → rectangle 'set guesses to 0'",
          "Parallelogram 'input guess' → rectangle 'add 1 to guesses' (your variable changing!)",
          "Diamond 'guess = secret?' — YES arrow goes to output 'You win in [guesses] tries' → Stop. NO arrow loops back to 'input guess'",
          "Add a second diamond before looping back: 'guess too high?' → output 'Lower!' else output 'Higher!'",
        ],
        tip: "Every diamond needs exactly two arrows out, labelled YES and NO. Trace it with a finger and a pretend number — does it ever get stuck?",
      }),
      block("heading", { text: "Step 2 — Pull out a sub-routine" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "Your 'give a hint' logic is used every loop — make it a sub-routine:",
        actions: [
          "Draw a SECOND small flowchart titled 'GIVE HINT' containing the too-high/too-low diamond and its two outputs",
          "In the main chart, replace that section with one rectangle with double side-lines: 'GIVE HINT'",
          "Count the shapes in your main chart before and after. Fewer? That's why programmers love sub-routines",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Flowchart photo",
        text: "Photo or screenshot both flowcharts — the main game and the GIVE HINT sub-routine — with your variable visible.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: diamonds and sub-routines",
        text: "Record yourself: what does a diamond shape mean, which variable changes in your chart and when, and why did you make GIVE HINT a sub-routine?",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Flowchart photo", "Main flowchart plus a sub-routine flowchart, showing a variable and decisions."),
        audioCriterion(2, "Voice note: diamonds and sub-routines", "Explains decision shapes, the variable, and the purpose of the sub-routine."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // P — Procedures, prototypes, project plans
  {
    topic: STRAND.P,
    title: `${Y} · Arcade Game with a Plan`,
    summary: "Run a real game project: write a one-page plan, build a playable prototype in MakeCode Arcade using your own procedures, test it, and improve it.",
    badgeName: "Game Producer",
    badgeIcon: "🕹️",
    badgeDescription: "Planned, prototyped and iterated a MakeCode Arcade game using named procedures (functions).",
    contentJson: JSON.stringify([
      block("heading", { text: "Plan → prototype → test → improve" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "Real games start as a one-page PLAN: what's the goal, how do you win, how do you lose, what does the player control? Then a PROTOTYPE — the ugliest version that actually plays — then testing and improving.\n\nMakeCode Arcade lets you build a real handheld game with blocks. A PROCEDURE (Arcade calls them Functions) is a named chunk of your code — 'spawn enemy', 'lose a life' — that you write once and call whenever you need it.",
        tip: "A prototype with a grey square for a hero that plays well beats a beautiful hero that does nothing.",
      }),
      block("heading", { text: "Step 1 — The one-page plan" }),
      block("text", {
        kind: "build",
        minutes: 10,
        text: "On paper, fill in five lines:",
        actions: [
          "GOAL: what is the player trying to do? (collect 10 coins / survive 30 seconds / reach the exit)",
          "CONTROLS: which buttons do what?",
          "WIN and LOSE: the exact condition for each",
          "SPRITES: hero, enemy, collectable — list them",
          "THREE BUILD STEPS in order: what will you build first, second, third? First = the smallest playable thing",
        ],
      }),
      block("heading", { text: "Step 2 — Prototype in Arcade" }),
      block("text", {
        kind: "build",
        minutes: 25,
        text: "Open MakeCode Arcade (below) → New Project. Build step 1 of your plan:",
        actions: [
          "Sprites → 'set mySprite to sprite [draw a quick square] of kind Player'. Controller → 'move mySprite with buttons'. Press play — you can move. That's your prototype!",
          "Advanced → Functions → Make a Function called 'spawnCoin': inside, create a sprite of kind Food at a random position",
          "Call 'spawnCoin' from 'on start'. Sprites → 'on sprite of kind Player overlaps otherSprite of kind Food': destroy otherSprite, change score by 1, call 'spawnCoin' again",
          "Add Info → 'start countdown 30 s'. Now you have a win condition. Play it. Is it too easy? Add an enemy sprite that 'follows mySprite'",
          "Test with a partner for 2 minutes. Write down ONE thing to improve — then improve it",
        ],
        warn: "Save often (the project name in the bottom bar). Closing the tab without a name loses your work.",
      }),
      block("embed", { url: ARCADE }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Plan and prototype photo",
        text: "Photo your one-page plan next to a screenshot of your game running — your Function block should be visible in the code.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: my procedure and my improvement",
        text: "Record yourself: what does your 'spawnCoin' procedure do, why did you make it a procedure instead of copying blocks, and what did you improve after testing?",
      }),
      wrapUpPrompt("Which step of your plan would you build next if you had another hour?"),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Plan and prototype photo", "The written plan plus the running Arcade prototype with a function visible."),
        audioCriterion(2, "Voice note: my procedure and my improvement", "Explains the procedure's purpose and one improvement made after testing."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // MD — Capture forms; single-table databases
  {
    topic: STRAND.MD,
    title: `${Y} · Form → Database`,
    summary: "Design a form that captures clean data from your class, watch every answer land as a record in a single-table database, then sort and filter for real answers.",
    badgeName: "Data Collector",
    badgeIcon: "📋",
    badgeDescription: "Built a data-capture form with suitable question types and used the resulting single-table database to answer questions.",
    contentJson: JSON.stringify([
      block("heading", { text: "Good data starts with good questions" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "A DATA-CAPTURE FORM is how a database gets filled: every question becomes a FIELD, every person who submits becomes a RECORD. Choose the question type carefully — a dropdown gives you tidy data ('Year 6'), a free-text box gives you 'year six', 'Yr6', 'six'… which you can't sort or count.\n\nOne table, many records, each with the same fields: that's a SINGLE-TABLE DATABASE.",
        tip: "Ask yourself for every question: will I want to COUNT, SORT or FILTER on this? Then make it a choice, not a text box.",
      }),
      block("heading", { text: "Step 1 — Build the form" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "In Google Forms (or Microsoft Forms), make a survey about your class — breakfast, travel to school, favourite lesson:",
        actions: [
          "Add 6 questions. At least: one multiple-choice, one dropdown, one number (use a short-answer with number validation), one yes/no, one date or time",
          "Mark the ones that matter as Required so you never get blank records",
          "Preview it and fill it in yourself once — was any question confusing? Fix it",
          "Share the link with your class (or a group of 8+). Collect the responses",
        ],
      }),
      block("heading", { text: "Step 2 — Interrogate the database" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Responses → open in Sheets. That sheet IS your database — one row per record.",
        actions: [
          "Data → Create a filter. Filter one field (only people who walk to school). How many records?",
          "Sort by your number field, largest first. Who is top?",
          "Write two questions your database can answer and answer them with a filter or sort. Write one it CAN'T answer — what field would you need to add?",
        ],
        tip: "Count how many different spellings you got in any free-text box. That's why the dropdown fields are the ones you can actually use.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Form and database screenshot",
        text: "Screenshot your form questions AND the responses sheet with a filter or sort applied.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: question types and records",
        text: "Record yourself: which question type gave you the cleanest data and why, what is a record in your database, and one question your data answered.",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Form and database screenshot", "The capture form and the resulting table with a filter/sort applied."),
        audioCriterion(2, "Voice note: question types and records", "Justifies question types and explains records/fields in the result."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // DC — Bandwidth; secure transmission
  {
    topic: STRAND.DC,
    title: `${Y} · Bandwidth & Secure Transmission`,
    summary: "Measure how fast data really moves through your school network, then prove why a message must be scrambled before it travels — with a lock-and-key game.",
    badgeName: "Network Investigator",
    badgeIcon: "📶",
    badgeDescription: "Measured and compared bandwidth, and explained why encryption is needed for data travelling over a network.",
    contentJson: JSON.stringify([
      block("heading", { text: "How wide is the pipe?" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "BANDWIDTH is how much data can travel through a connection each second — measured in megabits per second (Mbps). A wider pipe = a bigger file arrives sooner. Bandwidth is shared: thirty tablets streaming video on one wifi router each get a thin slice.\n\nAnd while data travels it can be seen by anyone on the path. That's why SECURE TRANSMISSION scrambles it first (encryption) so only the person with the key can unscramble it. The padlock in your browser means exactly that.",
        tip: "Bits vs bytes: speed is in megaBITS (Mb), file sizes in megaBYTES (MB). 8 bits = 1 byte, so a 100 Mbps line moves about 12.5 MB per second.",
      }),
      block("heading", { text: "Step 1 — Measure bandwidth" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Make a results table: Where / Time / Download Mbps / Upload Mbps.",
        actions: [
          "Run a speed test (your teacher will say which site) at your desk on wifi. Record download and upload",
          "Run it again at a different spot — near the router, far corridor, a wired computer if you have one. Record",
          "Run one more at a busy moment (everyone in class tests at once on '3, 2, 1'). What happened to the number?",
          "Work out: at your slowest result, how long would a 2,000 MB film take? (MB × 8 ÷ Mbps = seconds)",
        ],
        tip: "Wired almost always beats wifi, and 'everyone at once' almost always drops the number. If it didn't, ask why.",
      }),
      block("heading", { text: "Step 2 — The lock-and-key game" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "In threes: Sender, Postie, Receiver.",
        actions: [
          "Round 1: Sender writes a secret on a card and passes it to Receiver VIA Postie. Postie reads it aloud. Oops — that's unencrypted data on a network",
          "Round 2: Sender and Receiver agree a key (a Caesar shift or a simple substitution) WITHOUT Postie hearing. Sender encrypts, Postie carries it and reads it aloud — gibberish. Receiver decrypts",
          "Round 3: swap roles. Then discuss — what if Postie overheard the key?",
          "Add a row to your table: which websites you visited today showed the padlock (https) and which didn't",
        ],
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Bandwidth results photo",
        text: "Photo your results table — the speed-test numbers, the film calculation, and your encrypted card.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: bandwidth and the padlock",
        text: "Record yourself: what is bandwidth and what changed it in your tests; and why does the padlock matter when you type a password into a website?",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Bandwidth results photo", "Speed-test results table, a time calculation and the encrypted message."),
        audioCriterion(2, "Voice note: bandwidth and the padlock", "Explains bandwidth factors and why transmission must be encrypted."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // TC — Hyperlinked documents to a brief
  {
    topic: STRAND.TC,
    title: `${Y} · Hyperlinked Document to a Brief`,
    summary: "Work to a client brief like a real designer: produce a multi-page guide with a clickable contents page, links between pages, and links out to sources.",
    badgeName: "Brief Crusher",
    badgeIcon: "🔗",
    badgeDescription: "Produced a multi-page hyperlinked document that meets every requirement of a written brief.",
    contentJson: JSON.stringify([
      block("heading", { text: "What a brief is" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "A BRIEF is a list of what a client needs: audience, purpose, must-haves. Designers are judged on whether they hit EVERY line of it, not on whether it looks nice.\n\nToday's brief: 'A guide for new Year 3 pupils to our school. Four pages. A contents page where every line is a clickable link to its page. Each page links back to contents. At least two links to outside websites. Headings, one image per page, a friendly tone.'",
        tip: "Print the brief and tick each line as you meet it. Missed lines are what clients notice first.",
      }),
      block("heading", { text: "Step 1 — Structure" }),
      block("text", {
        kind: "build",
        minutes: 8,
        text: "In Google Docs or Word:",
        actions: [
          "Page 1: title + a 'Contents' heading with three lines: Our Day, Where Things Are, Clubs & Fun",
          "Insert → Page break. Give each of the next three pages its heading using Heading 1 style (that matters for linking)",
          "Write 3–5 friendly sentences on each page for a nervous Year 3. Add one image per page",
        ],
      }),
      block("heading", { text: "Step 2 — Wire the links" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Now make it clickable:",
        actions: [
          "On the contents page, select 'Our Day' → Insert → Link → choose 'Headings' (Docs) or 'Place in this document' (Word) → pick the Our Day heading. Repeat for the other two",
          "At the bottom of each page add the words 'Back to contents' and link it to the Contents heading",
          "On any page add two links to real outside websites (the school site, a local library, a club's page). Type the name, link the URL",
          "TEST every link by clicking it — in Docs use Ctrl/Cmd+click. Fix any that go nowhere",
          "Go down the brief line by line and tick it off",
        ],
        tip: "A link that reads 'click here' tells the reader nothing. Link the words that say where it goes.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Hyperlinked guide screenshot",
        text: "Screenshot your contents page with the links visible (hover/underline) and one inner page with its 'Back to contents' link and an outside link.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: meeting the brief",
        text: "Record yourself going through the brief: name each requirement and say how your document meets it — and which one was hardest.",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Hyperlinked guide screenshot", "Contents page with internal links plus an inner page with back-link and external links."),
        audioCriterion(2, "Voice note: meeting the brief", "Checks the document against each requirement of the brief."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // SW — Digital footprint; safe behaviour
  {
    topic: STRAND.SW,
    title: `${Y} · Your Digital Footprint`,
    summary: "Map the trail you leave online — what you post, what apps collect, what others post about you — and set three rules that keep the trail one you'd be proud of.",
    badgeName: "Footprint Mapper",
    badgeIcon: "👣",
    badgeDescription: "Mapped the sources of a digital footprint and set out safe, responsible online behaviours.",
    contentJson: JSON.stringify([
      block("heading", { text: "The trail you can't see" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "Every time you go online you leave a DIGITAL FOOTPRINT. Some of it is ACTIVE — things you choose to post, comments, photos, usernames. Some is PASSIVE — things collected without you noticing: which videos you watched, where your phone was, what you searched for.\n\nFootprints are hard to erase and easy to copy. Future teachers, coaches and employers can find them. Safe behaviour means thinking about the trail BEFORE you make it — and knowing what to do when something goes wrong.",
        tip: "Quick test before posting anything: would you be happy if it was read out in assembly with your name on it?",
      }),
      block("heading", { text: "Step 1 — Map your footprint" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "On a big sheet, draw a footprint outline and split it into two halves: ACTIVE / PASSIVE.",
        actions: [
          "ACTIVE: list every place you (or your family for you) have posted something — game usernames, class blog, photos shared in family chats, comments",
          "PASSIVE: list what apps might collect — search history, location, watch history, voice-assistant recordings. Not sure? Look at one app's privacy page with a partner",
          "Circle in red anything that shows your full name, school, or where you live. Those are the high-risk prints",
          "Draw an arrow from each red item to what you could do about it (change username, ask an adult to change a setting, untag)",
        ],
      }),
      block("heading", { text: "Step 2 — Three rules and a plan" }),
      block("text", {
        kind: "build",
        minutes: 8,
        text: "Underneath your map write:",
        actions: [
          "Three rules for safe online behaviour you'll actually keep (e.g. 'no real name in usernames', 'check with an adult before sharing photos of others')",
          "Your 'something went wrong' plan: if someone is unkind, asks for personal details, or shares something of yours — STOP, don't reply, SCREENSHOT, TELL a trusted adult. Name the adult",
        ],
        tip: "Including other people in your posts adds to THEIR footprint. Ask before you tag or share.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Footprint map photo",
        text: "Photo your footprint map with the active/passive halves, red circles, and your three rules.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: active, passive, and my plan",
        text: "Record yourself: give one example of an active footprint and one passive, explain why one of your red circles is a risk, and say your 'something went wrong' plan.",
      }),
      wrapUpPrompt(),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Footprint map photo", "Active/passive footprint map with risks circled and three rules."),
        audioCriterion(2, "Voice note: active, passive, and my plan", "Distinguishes active and passive footprints and states a safe-behaviour plan."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },

  // DW — Copyright; disruptive technology
  {
    topic: STRAND.DW,
    title: `${Y} · Copyright & Disruptive Tech`,
    summary: "Find out who owns the pictures, music and code you use, build a 'can I use it?' checklist — then pitch a technology that turned a whole industry upside down.",
    badgeName: "Rights & Disruption Analyst",
    badgeIcon: "⚖️",
    badgeDescription: "Applied copyright and licence rules to real media choices and explained how a disruptive technology changed an industry.",
    contentJson: JSON.stringify([
      block("heading", { text: "Who owns it?" }),
      block("text", {
        kind: "learn",
        minutes: 5,
        text: "COPYRIGHT means the person who made something — a photo, a song, a game, a drawing — owns it. Using it without permission is copying, even if it's 'just on Google Images'. Some creators give permission up front with a LICENCE like Creative Commons (CC) — often 'use it free, but credit me'.\n\nA DISRUPTIVE TECHNOLOGY is one that doesn't just improve an industry but replaces it: streaming replaced CDs and video shops; digital cameras replaced film; ride apps changed taxis. Each created new jobs and destroyed old ones.",
        tip: "Free to VIEW is not free to USE. The licence tells you the difference.",
      }),
      block("heading", { text: "Step 1 — The 'can I use it?' checklist" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "You're making a poster about your favourite animal and need an image and a soundtrack for the digital version.",
        actions: [
          "Search for an image three ways: normal image search; image search with 'Creative Commons licences' filter; a site like Pixabay/Unsplash/Wikimedia Commons. For each, write: can I use it? what must I do (credit? no changes? not for selling?)",
          "Pick one image you CAN use and write its credit line exactly as the licence asks ('Photo by ___, CC BY 4.0')",
          "Do the same for a music clip (a CC-licensed track site your teacher names)",
          "Turn your notes into a 5-line checklist anyone in your class could follow",
        ],
      }),
      block("heading", { text: "Step 2 — The disruption pitch" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Choose one disruptive technology: streaming, smartphones, digital photos, online shopping, ride-hailing, 3D printing.",
        actions: [
          "Make a one-slide pitch: BEFORE (how it used to work) → THE TECH → AFTER (what changed)",
          "Add one winner (a job or business that grew) and one loser (one that shrank)",
          "Finish with your prediction: what's the next thing it might disrupt?",
        ],
        tip: "Copyright and disruption meet in the middle: streaming exists partly because copying music became so easy. Mention that and you've understood both.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Checklist and pitch photo",
        text: "Photo or screenshot your 'can I use it?' checklist with your credited image, next to your disruption slide.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: licence and disruption",
        text: "Record yourself: what does copyright mean, what did the licence on your chosen image let you do, and how did your technology disrupt its industry?",
      }),
      wrapUpPrompt("Name one thing you'll do differently next time you need an image."),
    ]),
    criteria: {
      create: [
        photoCriterion(1, "Checklist and pitch photo", "A licence checklist with a correctly credited image plus the disruption slide."),
        audioCriterion(2, "Voice note: licence and disruption", "Explains copyright/licensing and how a technology disrupted an industry."),
        wrapUpCriterion(3, "What worked, what challenged you, what you'd improve."),
      ],
    },
  },
];
