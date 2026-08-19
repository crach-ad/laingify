// KCSB Computing — Year 1 (ages 5–6, EARLY band). Cambridge Primary Stage 1.
// Toolbelt: ScratchJr, paint and drawing tools.
//
// Early-band rule: nothing to type. Every module = a short "learn" card read
// aloud by the grown-up, a hands-on build, ONE photo checkpoint (a grown-up
// can take it) and ONE voice-note checkpoint ("tell me about it"). Both
// criteria are evidence-based, so the badge arrives the moment the voice note
// is saved — the finish card is a single big button.

import { block, photoCriterion, audioCriterion } from "../seed-lib.mjs";
import { STRAND } from "./strands.mjs";

const Y = "Y1";

// Every Year 1 module shares the same shape; this keeps the 8 definitions
// short and guarantees the checkpoint ↔ criterion labels line up.
function early({ strand, title, summary, badgeName, badgeIcon, badgeDescription, learn, build, photo, voice }) {
  return {
    topic: STRAND[strand],
    title: `${Y} · ${title}`,
    summary,
    badgeName,
    badgeIcon,
    badgeDescription,
    contentJson: JSON.stringify([
      block("heading", { text: title }),
      block("text", { kind: "learn", minutes: 3, ...learn }),
      block("heading", { text: "Let's build!" }),
      block("text", { kind: "build", minutes: 15, ...build }),
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
  // CS — Inputs and outputs; everyday machines
  early({
    strand: "CS",
    title: "Inputs & Outputs Machine",
    summary: "Every machine has a way IN and a way OUT. Find the inputs and outputs on toasters, tablets and toys — then draw a machine of your own.",
    badgeName: "Machine Mapper",
    badgeIcon: "⚙️",
    badgeDescription: "Identified inputs and outputs on everyday machines and drew a labelled machine.",
    learn: {
      text: "A machine needs something to go IN before something comes OUT. Press a button on the toaster — IN. Warm toast pops up — OUT!\n\nTap the tablet screen — IN. A picture appears — OUT. Buttons, switches and touchscreens are INPUTS. Lights, sounds and screens are OUTPUTS.",
      tip: "Grown-up: hold up a torch. Ask 'what goes in?' (finger on the switch) and 'what comes out?' (light). Then try a tablet and a toy with buttons.",
    },
    build: {
      text: "Find inputs and outputs:",
      actions: [
        "Pick three machines in the room — a tablet, a toy, a light switch, a kettle",
        "For each one, POINT at the input (where you press or touch) and say 'IN!'",
        "Then point at the output (light, sound, picture, heat) and say 'OUT!'",
        "Draw your own made-up machine. Put a big button for IN and something fun for OUT — a song, a rainbow, a cupcake!",
      ],
      tip: "Grown-up: label the drawing IN and OUT with arrows as the child points. A machine with two inputs (button + microphone) is a great stretch.",
    },
    photo: {
      label: "My machine drawing photo",
      description: "A photo of the child's drawing of a machine with its input and output shown.",
      text: "Take a photo of your machine drawing — show us the IN part and the OUT part.",
    },
    voice: {
      label: "Voice note: in and out",
      description: "The child names one machine, what goes in and what comes out.",
      text: "Press the big button and tell me: what is your machine, what goes IN, and what comes OUT?",
    },
  }),

  // CT — Everyday algorithms; order matters
  early({
    strand: "CT",
    title: "Recipe for a Sandwich",
    summary: "A recipe is a list of steps — an algorithm! Put the sandwich steps in order and find out what happens when you mix them up.",
    badgeName: "Step Sequencer",
    badgeIcon: "🥪",
    badgeDescription: "Ordered the steps of an everyday algorithm and showed that the order matters.",
    learn: {
      text: "An ALGORITHM is a list of steps to get something done. Brushing your teeth is an algorithm. Getting dressed is an algorithm. Making a sandwich is an algorithm!\n\nBut the steps have to be in the right ORDER. Put your shoes on before your socks? Silly! Put the jam on before the bread? Sticky hands!",
      tip: "Grown-up: actually make (or mime) the sandwich following the child's steps EXACTLY — if they forget 'open the jar', act stuck. Laughs teach the lesson.",
    },
    build: {
      text: "Make your sandwich algorithm:",
      actions: [
        "Get the picture cards (or draw them): bread, butter, jam, knife, plate, 'put together', 'eat!'",
        "Lay the cards out in a line, left to right, in the order you would do them",
        "Ask a grown-up to be the robot chef and follow your cards exactly. Did it work?",
        "Now SWAP two cards. Is the sandwich still right? Put them back in the best order",
      ],
      tip: "Grown-up: ask 'what would happen if we did THIS one first?' and let the child predict before you act it out.",
    },
    photo: {
      label: "Sandwich steps photo",
      description: "A photo of the child's picture cards laid out in order.",
      text: "Take a photo of your sandwich cards in a line — first step on the left, last step on the right.",
    },
    voice: {
      label: "Voice note: why order matters",
      description: "The child says their steps in order and what went wrong when two were swapped.",
      text: "Press the button and say your sandwich steps in order — then tell me what went silly when you swapped two of them.",
    },
  }),

  // P — Recreate algorithms as simple programs (ScratchJr)
  early({
    strand: "P",
    title: "ScratchJr: Make the Cat Dance",
    summary: "Turn your dance steps into a real program! Snap blocks together in ScratchJr so the cat jumps, spins and says hello.",
    badgeName: "Block Snapper",
    badgeIcon: "🐱",
    badgeDescription: "Recreated a simple algorithm as a sequence of ScratchJr blocks and ran it.",
    learn: {
      text: "In ScratchJr the cat does what your BLOCKS say. Snap a blue arrow block on — the cat moves. Snap a 'jump' block — the cat hops! Snap them in a row and the cat does them one after another.\n\nFirst you plan the dance with your body. Then you build it with blocks. Then tap the green flag — and the cat copies YOU!",
      tip: "Grown-up: start every script with the yellow 'green flag' block. Blocks must touch each other to join — show a gap, then snap it shut.",
    },
    build: {
      text: "Build the cat's dance:",
      actions: [
        "Stand up and make a three-move dance: step right, jump, spin. Say it out loud",
        "Open ScratchJr → tap the house → tap the + to start a new project",
        "Drag the yellow 'green flag' block into the bottom area. Snap a blue 'move right' block to it, then 'jump', then 'turn'",
        "Tap the green flag at the top. Did the cat do YOUR dance? Add a purple 'say' block so the cat says hello at the end",
      ],
      tip: "Grown-up: if the cat goes the wrong way, ask 'which block do we change?' — fixing one block is the very first bit of debugging.",
    },
    photo: {
      label: "Cat dance program screenshot",
      description: "A screenshot or photo of the ScratchJr project showing the blocks.",
      text: "Take a screenshot (or a photo of the screen) showing your blocks snapped together and the cat.",
    },
    voice: {
      label: "Voice note: my cat's dance",
      description: "The child names the blocks they used, in order.",
      text: "Press the button and tell me which blocks you snapped together for the cat's dance — first, then, last.",
    },
  }),

  // MD — Devices sort and organise data
  early({
    strand: "MD",
    title: "The Sorting Machine",
    summary: "Sort toys by hand, then watch a device sort the same things in a blink — and find out why computers need a rule to sort by.",
    badgeName: "Data Organiser",
    badgeIcon: "📊",
    badgeDescription: "Sorted objects by a rule and saw how a device organises the same data.",
    learn: {
      text: "Last year you sorted toys into piles. Computers sort too — photos by date, songs by name, games by favourites. They are SUPER fast, but they still need a RULE.\n\nToday you are the sorting machine first — then the tablet has a go. Who is faster? Who makes mistakes?",
      tip: "Grown-up: any app that sorts works — the Photos app by date, a music app A–Z, or a simple sorting game. The point is 'the device did the same job, with a rule'.",
    },
    build: {
      text: "You sort, then the device sorts:",
      actions: [
        "Tip out a box of toy animals or coloured bricks. Choose a rule: colour, size, or kind",
        "Sort them into piles. Count how many in each pile — write the numbers on sticky notes",
        "Now take one photo of each toy on the tablet. Ask a grown-up to help you sort the photos by colour or name in the Photos app",
        "Did the tablet make the same piles as you? Which was faster — you or the tablet?",
      ],
      tip: "Grown-up: a pictogram on the whiteboard (one sticker per toy, columns per colour) bridges hand-sorting and screen-sorting nicely.",
    },
    photo: {
      label: "Sorted piles photo",
      description: "A photo of the sorted objects with their counts.",
      text: "Take a photo of your sorted piles from above, with the sticky-note numbers showing.",
    },
    voice: {
      label: "Voice note: my sorting rule",
      description: "The child explains their rule and how the device sorted the same things.",
      text: "Press the button and tell me: what was your sorting rule, and how did the tablet sort your photos?",
    },
  }),

  // DC — Devices connect; the internet
  early({
    strand: "DC",
    title: "How Does the Picture Get There?",
    summary: "Send a picture from one tablet to another and follow its journey — through the air, down the wires and across the internet.",
    badgeName: "Picture Sender",
    badgeIcon: "🌐",
    badgeDescription: "Sent a picture between devices and described the connection it travelled along.",
    learn: {
      text: "When you send a drawing to a friend's tablet, it doesn't fly there by magic. It goes into your tablet, zooms through the air to a box called a ROUTER, along wires, and pops out on your friend's screen.\n\nAll those wires and boxes joined together, all over the world, are called the INTERNET. It is how devices connect to each other.",
      tip: "Grown-up: point out the actual wifi router in the building if you can. 'That box is the door to the internet.'",
    },
    build: {
      text: "Send a picture and map its journey:",
      actions: [
        "Draw a quick picture on the tablet. With a grown-up's help, send it to another tablet across the room (shared album, message, or AirDrop)",
        "Wait for it to arrive. Did it look the same? How long did it take?",
        "On a big piece of paper, draw the journey: your tablet → wifi waves → the router box → wires → your friend's tablet",
        "Walk the journey: hold your drawing, walk to the 'router' (a chair), then to your friend. You ARE the picture!",
      ],
      tip: "Grown-up: a string between two tablets is a lovely physical 'connection'. Talk about wifi as an invisible string.",
    },
    photo: {
      label: "Picture journey map photo",
      description: "A photo of the child's drawing of the picture's journey between devices.",
      text: "Take a photo of your journey map — tablet, wifi, router, wires, friend's tablet.",
    },
    voice: {
      label: "Voice note: the picture's journey",
      description: "The child describes how the picture travelled from one device to another.",
      text: "Press the button and tell me: how did your picture get from YOUR tablet to your friend's tablet? What did it travel through?",
    },
  }),

  // TC — Log on, save files, type words
  early({
    strand: "TC",
    title: "Log On, Type, Save",
    summary: "Log on all by yourself, type your name and a sentence, and SAVE it so it's still there tomorrow.",
    badgeName: "Keyboard Captain",
    badgeIcon: "⌨️",
    badgeDescription: "Logged on, typed words using the keyboard and saved a file with a name.",
    learn: {
      text: "Computers need to know who you are — that's LOGGING ON. Then you can TYPE with the keyboard: find the letters, press the big space bar between words, press the arrow-shaped key to rub out.\n\nWhen you finish, you must SAVE. Saving puts your work in a safe place with a NAME, so you can find it again tomorrow. If you don't save — poof, it's gone!",
      tip: "Grown-up: practise finding the letters of the child's name on the keyboard first. Capital letters come later — lowercase is fine today.",
    },
    build: {
      text: "Log on, type, save:",
      actions: [
        "Find your name on the log-on screen and tap it (or type your user name with a grown-up)",
        "Open the writing app. Type your name. Find the space bar — it's the longest key!",
        "Type one sentence about something you like: 'i like dogs'. Use the delete key if a letter is wrong",
        "Tap Save (or File → Save). Give it a name: your name plus 'day1'. Close the app, then open it again — is your sentence still there?",
      ],
      tip: "Grown-up: let them do the save tap themselves and name the file. Re-opening it is the 'aha' — 'it remembered!'",
    },
    photo: {
      label: "My typed words screenshot",
      description: "A screenshot or photo of the saved file showing the child's name and sentence.",
      text: "Take a screenshot (or photo of the screen) of your saved writing — your name and your sentence.",
    },
    voice: {
      label: "Voice note: how I saved it",
      description: "The child says what they typed and what saving does.",
      text: "Press the button and tell me: what did you type, and why do we press Save?",
    },
  }),

  // SW — Passwords; ask an adult, report
  early({
    strand: "SW",
    title: "Ask an Adult",
    summary: "Learn the two safety rules every computer user knows: keep your password secret, and if something online feels wrong — stop and tell a grown-up.",
    badgeName: "Safe Reporter",
    badgeIcon: "🙋",
    badgeDescription: "Explained keeping a password secret and knows to stop and tell an adult when something online feels wrong.",
    learn: {
      text: "Rule 1: your password is a SECRET. Only you and your grown-up know it.\n\nRule 2: sometimes online something pops up that is scary, rude, or asks you for your name or address. When that happens: STOP. Don't tap. Turn the screen over. TELL a grown-up. You are never in trouble for telling — you are being clever and safe.",
      tip: "Grown-up: never ask the child to share a real password here — they use a made-up one. Practise the phrase 'I'll stop and tell a grown-up' out loud together.",
    },
    build: {
      text: "Safety superhero practice:",
      actions: [
        "Make up a pretend password with a grown-up — something silly like 'jelly-rocket'. Whisper it. Don't tell your friend!",
        "Play 'pop-up': a grown-up holds up cards — a happy game, a scary picture, a box asking 'what is your address?'. For each one, say THUMBS UP (fine) or STOP AND TELL (not fine)",
        "Practise the three moves: STOP → turn the screen over → find a grown-up and say 'something felt wrong'",
        "Draw a poster of YOU being a safety superhero with the words STOP and TELL",
      ],
      tip: "Grown-up: name the trusted adults — teacher, parent, carer — so 'tell a grown-up' has real faces.",
    },
    photo: {
      label: "Safety superhero poster photo",
      description: "A photo of the child's STOP and TELL poster.",
      text: "Take a photo of your safety superhero poster.",
    },
    voice: {
      label: "Voice note: what I do if something feels wrong",
      description: "The child says who knows their password and what to do if something online feels wrong (no real passwords!).",
      text: "Press the button and tell me: who knows your password? And what do you do if something on the screen feels wrong? (Don't say a real password!)",
    },
  }),

  // DW — Connected websites; kinds of computers
  early({
    strand: "DW",
    title: "Kinds of Computers",
    summary: "Laptops, tablets, phones, smart watches — so many kinds of computers! Paint three of them and discover how websites link together.",
    badgeName: "Tech Painter",
    badgeIcon: "🎨",
    badgeDescription: "Named different kinds of computers and showed that websites connect to each other.",
    learn: {
      text: "A computer doesn't have to be a big box on a desk. A tablet is a computer. A phone is a computer. A smart watch, a games console, the big screen at the front — all computers, just different shapes and sizes.\n\nAnd when you look at a website, it has buttons that jump to OTHER websites. Websites are all joined together, like a giant web — that's why it's called the World Wide WEB!",
      tip: "Grown-up: on a child-safe website, tap a link together and say 'we jumped to a different page — they're connected'.",
    },
    build: {
      text: "Paint and connect:",
      actions: [
        "Open the paint app. Paint THREE different kinds of computers — a laptop, a tablet, a phone, a watch, a console — you choose",
        "Give each one a label (ask a grown-up to help type or write it)",
        "With a grown-up, visit a website you use at school. Find a button or picture that jumps to another page. Tap it! Tap another!",
        "Add to your painting: draw lines between your three computers to show they can all visit the same website",
      ],
      tip: "Grown-up: 'Which of these have YOU used?' makes it personal. The lines = 'they all connect to the web'.",
    },
    photo: {
      label: "Kinds of computers painting",
      description: "A screenshot or photo of the child's painting of three kinds of computers.",
      text: "Take a screenshot (or photo) of your painting with your three computers.",
    },
    voice: {
      label: "Voice note: my three computers",
      description: "The child names the three kinds of computers they painted and says how websites connect.",
      text: "Press the button and tell me: what three kinds of computers did you paint? And what happened when you tapped a button on the website?",
    },
  }),
];
