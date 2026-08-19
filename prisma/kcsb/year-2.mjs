// KCSB Computing — Year 2 (ages 6–7, EARLY band). Cambridge Primary Stage 2.
// Toolbelt: ScratchJr → Scratch, cameras.
//
// Early-band rule: nothing to type. Every module = a short "learn" card read
// aloud by the grown-up, one or two hands-on build cards, ONE photo checkpoint
// (a grown-up can take it) and ONE voice-note checkpoint ("tell me about it").
// Both criteria are evidence-based, so the badge arrives the moment the voice
// note is saved — the finish card is a single big button.

import { block, photoCriterion, audioCriterion } from "../seed-lib.mjs";
import { STRAND } from "./strands.mjs";

const Y = "Y2";

// Same shape as Reception, plus an optional second build card (`build2`) and
// an optional extra block (`extra`, e.g. a Scratch script) between them.
function early({ strand, title, summary, badgeName, badgeIcon, badgeDescription, learn, build, extra, build2, photo, voice }) {
  return {
    topic: STRAND[strand],
    title: `${Y} · ${title}`,
    summary,
    badgeName,
    badgeIcon,
    badgeDescription,
    contentJson: JSON.stringify([
      block("heading", { text: title }),
      block("text", { kind: "learn", minutes: 4, ...learn }),
      block("heading", { text: "Let's build!" }),
      block("text", { kind: "build", minutes: 15, ...build }),
      ...(extra ? [extra] : []),
      ...(build2 ? [block("text", { kind: "build", minutes: 10, ...build2 })] : []),
      block("checkpoint", { capture: "photo", criterionLabel: photo.label, text: photo.text }),
      block("checkpoint", { capture: "audio", criterionLabel: voice.label, text: voice.text }),
    ]),
    criteria: {
      create: [
        photoCriterion(1, photo.label, photo.description),
        audioCriterion(2, voice.label, voice.description),
      ],
    },
  };
}

export const modules = [
  // CS — Hardware terms; computers vs humans
  early({
    strand: "CS",
    title: "Computers vs Humans",
    summary: "Learn the real names for the parts of a computer — then have a race: what can a computer do better than you, and what can YOU do better than a computer?",
    badgeName: "Parts Expert",
    badgeIcon: "🖥️",
    badgeDescription: "Named the main hardware parts of a computer and compared what computers and humans each do best.",
    learn: {
      text: "A computer is made of PARTS, and every part has a name. The SCREEN (monitor) shows you things. The KEYBOARD is for typing. The MOUSE or your FINGER points. The SPEAKER makes sound. The CAMERA sees. Inside is the PROCESSOR — the brain that follows instructions.\n\nComputers are super fast at some things. But humans are better at others — like being kind, or having ideas!",
      tip: "Grown-up: point at each part on a real laptop or tablet as you say its name. Let the child repeat it.",
    },
    build: {
      text: "Label the parts:",
      actions: [
        "Draw a big computer (laptop or tablet) on paper — or take a photo of a real one and put it on the table",
        "Make little labels: SCREEN, KEYBOARD, MOUSE, SPEAKER, CAMERA. Stick or point each label to the right part",
        "Find one MORE part we didn't name — a button? a plug? a light? Give it a label too",
      ],
      tip: "Grown-up: say 'hardware' once — it just means the parts you can touch.",
    },
    build2: {
      text: "Now the race — computer vs human!",
      actions: [
        "Maths race: a grown-up types 57 + 38 on a calculator while you work it out. Who wins?",
        "Drawing race: ask a drawing app to draw a dog with one tap, then draw your OWN dog. Whose is more fun?",
        "Kindness test: can the computer give your friend a hug? Can you?",
        "Make two piles of cards: 'Computer is better at' and 'Humans are better at'",
      ],
      tip: "Grown-up: the aim is 'computers are fast and exact, humans are creative and caring' — not 'computers are cleverer'.",
    },
    photo: {
      label: "Labelled computer photo",
      description: "A photo of the child's labelled computer drawing or the labelled real device.",
      text: "Take a photo of your computer with all its labels on — make sure we can read them!",
    },
    voice: {
      label: "Voice note: computer or human?",
      description: "The child names two hardware parts and says one thing computers do better and one thing humans do better.",
      text: "Press the button and tell me two parts of a computer and what they do. Then: one thing a computer is better at, and one thing YOU are better at!",
    },
  }),

  // CT — Precise linear algorithms; predict outputs
  early({
    strand: "CT",
    title: "Robot Teacher",
    summary: "Write an exact step-by-step algorithm for a job like making a jam sandwich — then watch a 'robot' follow it and guess what will happen BEFORE it does.",
    badgeName: "Algorithm Author",
    badgeIcon: "📋",
    badgeDescription: "Wrote a precise linear algorithm and predicted what would happen when it was followed exactly.",
    learn: {
      text: "An ALGORITHM is a list of steps to do a job — in order, one after the other. Robots follow algorithms EXACTLY. If you say 'put jam on the bread' but forget 'open the jar', the robot will rub the closed jar on the bread!\n\nGood programmers PREDICT: before the robot moves, they say what they think will happen. Then they watch and check.",
      tip: "Grown-up: be the most literal robot in the world. It's funnier AND it teaches precision.",
    },
    build: {
      text: "Write the algorithm:",
      actions: [
        "Choose a job: make a jam sandwich, brush teeth, or put on a coat",
        "Draw or write each step on its own card. Tiny steps! 'Pick up knife' is one step, 'open the jar' is another",
        "Lay the cards in a line, left to right. Number them 1, 2, 3…",
        "Point at the cards and say your PREDICTION: 'I think the robot will make a sandwich with jam inside'",
      ],
    },
    build2: {
      text: "Test it on the robot:",
      actions: [
        "A grown-up (or friend) is the robot. They do EXACTLY what each card says — nothing extra",
        "Did it go wrong? Laugh, then FIX the card. Add a step or swap two cards",
        "Run it again until the job works. Was your prediction right?",
      ],
      tip: "Grown-up: 'predict → run → check → fix' is the whole of computer science in miniature.",
    },
    photo: {
      label: "Algorithm cards photo",
      description: "A photo of the child's numbered step cards in order (or the robot following them).",
      text: "Take a photo of your algorithm — all the numbered cards in a line, in order.",
    },
    voice: {
      label: "Voice note: my prediction",
      description: "The child says what they predicted would happen and whether it did, and names one step they fixed.",
      text: "Press the button and tell me: what did you think the robot would do? Did it happen? Which step did you have to fix?",
    },
  }),

  // P — Build, test, debug block programs
  early({
    strand: "P",
    title: "Build, Test, Debug: My Scratch Story",
    summary: "Make a character move and talk in Scratch — and when it goes wrong (it will!), hunt down the bug and squash it like a real programmer.",
    badgeName: "Bug Squasher",
    badgeIcon: "🐞",
    badgeDescription: "Built a short block program, tested it, and found and fixed a bug.",
    learn: {
      text: "In Scratch you build programs by snapping BLOCKS together, like LEGO. Each block is one instruction. The green flag means GO.\n\nA BUG is a mistake in a program — the computer does what you SAID, not what you MEANT. When you find a bug and fix it, that's called DEBUGGING. Every programmer in the world does it every day!",
      tip: "Grown-up: ScratchJr on a tablet is perfect too — use the blue 'move' arrows and the purple 'say' block.",
    },
    build: {
      text: "Build the story:",
      actions: [
        "Open Scratch (scratch.mit.edu → Create) or ScratchJr. You'll see the cat",
        "Drag 'when green flag clicked' onto the script area",
        "Snap on 'move 10 steps', then 'say Hello! for 2 seconds', then 'move 10 steps' again",
        "Click the green flag. Does the cat move, talk, move?",
      ],
    },
    extra: block("scratch", {
      text: "when green flag clicked\nmove (10) steps\nsay [Hello!] for (2) seconds\nmove (10) steps",
      tip: "Change 10 to 50. Now change 'Hello!' to your name. Click the flag each time — that's TESTING.",
    }),
    build2: {
      text: "Now squash a bug:",
      actions: [
        "A grown-up secretly changes ONE block — maybe 'move 10' becomes 'move -10', or the 'say' block is pulled off",
        "Click the flag. What's wrong? Look at the blocks one by one until you spot the change",
        "Fix it! Click the flag again to TEST that it works",
        "Swap: YOU plant a bug for your grown-up to find",
      ],
      tip: "Grown-up: keep the bug small and visible — a changed number or a missing block.",
    },
    photo: {
      label: "Scratch story screenshot",
      description: "A screenshot or photo of the child's program with the cat moving or talking.",
      text: "Take a screenshot (or a photo of the screen) showing your blocks AND your cat.",
    },
    voice: {
      label: "Voice note: the bug I squashed",
      description: "The child describes what the bug was and how they fixed it.",
      text: "Press the button and tell me: what went wrong in your program, how did you find it, and how did you fix it?",
    },
  }),

  // MD — Class surveys and pictograms
  early({
    strand: "MD",
    title: "Class Survey Pictogram",
    summary: "Ask your class a question, collect the answers with tally marks, and turn them into a pictogram that answers the question at a glance.",
    badgeName: "Survey Star",
    badgeIcon: "📊",
    badgeDescription: "Collected survey data with tallies and presented it as a pictogram.",
    learn: {
      text: "Information you collect is called DATA. A SURVEY is when you ask lots of people the same question. 'What's your favourite fruit?' Apple, banana, apple, grapes, apple…\n\nA PICTOGRAM shows data with pictures — one 🍎 for each person who said apple. Now you can SEE the winner without counting!",
      tip: "Grown-up: keep the question to 3 or 4 choices so the pictogram stays clear.",
    },
    build: {
      text: "Collect the data:",
      actions: [
        "Choose a question with 3–4 answers: favourite fruit? favourite colour? how do you get to school?",
        "Make a tally sheet: each answer on its own line",
        "Ask everyone in the class (or at home). Each answer = one tally mark |. Five = ||||",
        "Count each line and write the total",
      ],
    },
    build2: {
      text: "Make the pictogram:",
      actions: [
        "On paper (or in a drawing app): one row per answer, with its word or picture at the start",
        "Draw one small picture for EACH person — 6 people said apple = 6 apples. Keep them the same size, in a neat line",
        "Look! Which row is longest? That's the most popular answer",
        "Bonus: do it on a tablet in a pictogram app or with stickers",
      ],
      tip: "Grown-up: ask 'How many MORE chose apple than banana?' — reading the pictogram is the skill.",
    },
    photo: {
      label: "Pictogram photo",
      description: "A photo or screenshot of the finished pictogram (tally sheet visible if possible).",
      text: "Take a photo of your pictogram — and put your tally sheet next to it if you can.",
    },
    voice: {
      label: "Voice note: what my data says",
      description: "The child states the survey question, the most popular answer, and how many chose it.",
      text: "Press the button and tell me: what was your question, which answer won, and how many people chose it?",
    },
  }),

  // DC — Wired vs wireless; sharing info
  early({
    strand: "DC",
    title: "Wired or Wireless?",
    summary: "Follow the cables, then spot the invisible wifi — and find out that information can travel both ways to share a picture with a friend.",
    badgeName: "Connection Finder",
    badgeIcon: "🔌",
    badgeDescription: "Sorted devices into wired and wireless connections and shared information between devices.",
    learn: {
      text: "Some devices are joined with WIRES — a cable you can see and touch, like the one from the computer to the big screen. Others are WIRELESS — they talk through the air using wifi or Bluetooth, with no cable at all.\n\nBoth ways can SHARE information: a photo, a message, a song. Today you'll find both kinds and share something.",
      tip: "Grown-up: let the child physically follow a cable with a finger from one end to the other.",
    },
    build: {
      text: "Connection hunt:",
      actions: [
        "Walk around the room with a grown-up. Find 3 things joined by a WIRE — follow the cable to see what it connects",
        "Find 3 things that work WIRELESSLY — a tablet, a wireless mouse, headphones, a smart speaker",
        "Make two hoops on the floor: WIRED and WIRELESS. Put each device (or a picture of it) in the right hoop",
        "Tricky one: a laptop on wifi that is plugged into a charger — which hoop? (Hint: the charger is power, not information!)",
      ],
    },
    build2: {
      text: "Share something:",
      actions: [
        "Take a photo on one tablet. With a grown-up, send it to another tablet (AirDrop, a shared folder, or a message)",
        "Did it arrive? Was that wired or wireless?",
        "Now try a wire: plug a tablet or camera into a computer and look at the photo on the big screen",
      ],
      tip: "Grown-up: the takeaway is 'information travels through wires OR through the air — both work'.",
    },
    photo: {
      label: "Wired and wireless hoops photo",
      description: "A photo of devices sorted into wired and wireless groups.",
      text: "Take a photo of your two hoops with the devices sorted into WIRED and WIRELESS.",
    },
    voice: {
      label: "Voice note: wired or wireless",
      description: "The child names one wired and one wireless device and says how the shared photo travelled.",
      text: "Press the button and tell me: one thing that uses a wire, one thing that is wireless, and how did your photo get to the other tablet?",
    },
  }),

  // TC — Folders; capture photos and video
  early({
    strand: "TC",
    title: "Folders and a Mini Movie",
    summary: "Make your own folder, film a tiny movie, snap a photo — and put them all away tidily so you can find them next week.",
    badgeName: "Movie Maker",
    badgeIcon: "🎬",
    badgeDescription: "Captured a photo and a short video and saved them into a named folder.",
    learn: {
      text: "A FOLDER on a computer is like a drawer with a label. You put your photos, videos and drawings inside so they don't get lost in a big messy pile.\n\nToday you make a folder with YOUR name on it, then fill it with a photo and a mini movie you record yourself.",
      tip: "Grown-up: show Files (or Photos → Albums) once. A folder named after the child is the first 'mine' moment on a computer.",
    },
    build: {
      text: "Make your folder:",
      actions: [
        "Open the Files app (or Photos). Find the + or 'New folder' button",
        "Name it with your name — type it or ask a grown-up to help with the letters",
        "Open it. Empty! Let's fill it",
      ],
    },
    build2: {
      text: "Film and snap:",
      actions: [
        "Open the camera. Switch to VIDEO. Press record, say your name and show something you made, press stop. 10 seconds is plenty!",
        "Switch back to PHOTO. Take one good photo of your desk or your build",
        "Move (or save) both into YOUR folder. Open the folder — can you see both inside?",
        "Play your movie back. Too wobbly? Record a second take — movie makers always do",
      ],
      tip: "Grown-up: hold the device with two hands and count to three before recording — steadier video, happier child.",
    },
    photo: {
      label: "My folder photo",
      description: "A screenshot of the child's named folder showing their photo and video inside (or a photo of the screen).",
      text: "Take a screenshot (or a photo of the screen) of YOUR folder with your photo and your movie inside it.",
    },
    voice: {
      label: "Voice note: how I saved it",
      description: "The child explains what a folder is for and how they recorded their video.",
      text: "Press the button and tell me: why did you make a folder? And how did you record your mini movie — what did you press?",
    },
  }),

  // SW — Accounts and identity online
  early({
    strand: "SW",
    title: "Who Am I Online?",
    summary: "Design your own safe online character — a fun username and an avatar — and learn which things about YOU must stay private.",
    badgeName: "Safe Me",
    badgeIcon: "🎭",
    badgeDescription: "Created a safe online identity (username and avatar) and identified information that must stay private.",
    learn: {
      text: "When you log in to a game or a learning app, that's your ACCOUNT. It has a USERNAME (your online name) and maybe a picture called an AVATAR. People online see your username — NOT your real self.\n\nSome things are PRIVATE: your full name, your address, your school, your birthday, your photo. Those stay with you and your grown-ups. A safe username is fun and made-up — 'RocketPanda7', not your real name.",
      tip: "Grown-up: ask the child to sort 'my favourite colour' (fine to share) vs 'my address' (private) — the sorting is the learning.",
    },
    build: {
      text: "Make your safe online character:",
      actions: [
        "Invent a username: an animal + a colour + a number, like BlueOtter5. NOT your real name!",
        "Draw (or build in a drawing app) an avatar for your character — a silly face, a robot, a monster. Not a photo of you",
        "Make a 'private' box: draw or write the things that stay secret — full name, address, school, birthday",
        "Make a 'share' box: things that are fine — favourite game, favourite colour, your avatar",
      ],
    },
    build2: {
      text: "The stranger test:",
      actions: [
        "A grown-up pretends to be someone in a game: 'Hi! What's your real name? Where do you live?'",
        "Practise the answer: 'I don't share that. I'll ask my grown-up.'",
        "Try it three times with different questions. Get faster each time!",
      ],
      tip: "Grown-up: praise the refusal loudly — saying 'no' to a friendly stranger is the hardest part.",
    },
    photo: {
      label: "Username and avatar photo",
      description: "A photo of the child's made-up username, avatar drawing and private/share boxes.",
      text: "Take a photo of your username, your avatar and your PRIVATE and SHARE boxes.",
    },
    voice: {
      label: "Voice note: what stays private",
      description: "The child says their made-up username, names two private things, and says what to do if a stranger asks.",
      text: "Press the button and tell me your made-up username, two things that must stay PRIVATE, and what you say if someone online asks for them.",
    },
  }),

  // DW — The internet as a network
  early({
    strand: "DW",
    title: "The Internet Is a Network",
    summary: "Build the internet out of string and cups! Pass a message from computer to computer and see how a network lets everyone talk to everyone.",
    badgeName: "Network Builder",
    badgeIcon: "🕸️",
    badgeDescription: "Modelled the internet as a network of connected computers and traced how a message travels across it.",
    learn: {
      text: "A NETWORK is lots of computers joined together so they can pass things along. The INTERNET is the biggest network in the world — millions and millions of computers, all joined up.\n\nWhen you send a message, it doesn't fly straight to your friend. It hops from computer to computer — like passing a note across a classroom — until it arrives.",
      tip: "Grown-up: the word to land is 'network' = 'joined up'. Let the string model do the explaining.",
    },
    build: {
      text: "Build a network:",
      actions: [
        "Get 5 or 6 friends (or cups on the table). Each one is a COMPUTER — give each a name",
        "Join them with string: everyone should be connected to at least TWO others, so there are lots of paths",
        "Send a 'message' (a bead, a folded note) from one computer to a far one — it must travel ALONG the strings, hop by hop",
        "Now cut (or drop) one string. Can the message still get there a different way? That's why the internet has lots of paths!",
      ],
    },
    build2: {
      text: "Draw your network:",
      actions: [
        "On paper, draw each computer as a circle with its name",
        "Draw the strings as lines between them",
        "Draw the route your message took with a bright colour — and a second route for when a string was cut",
      ],
      tip: "Grown-up: the picture they draw is a real network diagram — the same thing engineers draw.",
    },
    photo: {
      label: "Network model photo",
      description: "A photo of the string-and-cup network or the child's network drawing with the message route.",
      text: "Take a photo of your string network — or your drawing with the message's route coloured in.",
    },
    voice: {
      label: "Voice note: how the message travelled",
      description: "The child says what a network is and describes the hops their message took.",
      text: "Press the button and tell me: what is a network? And how did your message get across — which computers did it hop through?",
    },
  }),
];
