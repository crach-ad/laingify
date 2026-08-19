// KCSB Computing — Reception (ages 4–5, EARLY band). Informally aligned to
// Cambridge Early Years. Toolbelt: Bee-Bot floor robots, touch drawing.
//
// Early-band rule: nothing to type. Every module = a short "learn" card read
// aloud by the grown-up, a hands-on build, ONE photo checkpoint (a grown-up
// can take it) and ONE voice-note checkpoint ("tell me about it"). Both
// criteria are evidence-based, so the badge arrives the moment the voice note
// is saved — the finish card is a single big button.

import { block, photoCriterion, audioCriterion } from "../seed-lib.mjs";
import { STRAND } from "./strands.mjs";

const Y = "R";

// Every Reception module shares the same shape; this keeps the 8 definitions
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
  // CS — Spot computers all around us
  early({
    strand: "CS",
    title: "Computer Hunt",
    summary: "Go on a hunt for the computers hiding all around the classroom and at home — and find out what makes something a computer.",
    badgeName: "Computer Spotter",
    badgeIcon: "🔍",
    badgeDescription: "Found and named computers in everyday places and said what they do.",
    learn: {
      text: "Computers are everywhere! Some are big, like the one on the teacher's desk. Some are tiny, like the one inside a phone. Some hide inside things — a microwave, a car, a toy that talks.\n\nA computer is a machine that follows instructions. Let's find some!",
      tip: "Grown-up: read this aloud, then ask — 'Is a book a computer? Is a tablet? How do you know?'",
    },
    build: {
      text: "Hunt time! Find THREE computers.",
      actions: [
        "Walk around the room (or your house) with a grown-up and point at things that might be computers",
        "For each one, ask: does it follow instructions? does it have a screen or buttons?",
        "Pick your three favourites and put them (or a picture of them) together on the table",
        "Draw your favourite one on paper — don't forget its buttons or screen",
      ],
      tip: "Grown-up: a tablet, a phone, a smart speaker, a till, a microwave, a car dashboard and a Bee-Bot all count.",
    },
    photo: {
      label: "Computer hunt photo",
      description: "A photo of the three computers found (or the drawing of the favourite one).",
      text: "Take a photo of your three computers — or your drawing of the best one. Ask a grown-up to help hold the tablet steady.",
    },
    voice: {
      label: "Voice note: what does it do?",
      description: "The child names one computer they found and says what it does.",
      text: "Press the big button and tell me: what is your favourite computer that you found, and what does it DO?",
    },
  }),

  // CT — Follow simple spoken instructions in play
  early({
    strand: "CT",
    title: "Simon Says, Robot Style",
    summary: "Be a robot! Follow instructions exactly, then give your own — and find out why the ORDER of instructions matters.",
    badgeName: "Instruction Follower",
    badgeIcon: "🤖",
    badgeDescription: "Followed and gave a sequence of simple spoken instructions, one step at a time.",
    learn: {
      text: "A robot only does what it is TOLD. It can't guess. If you say 'jump' it jumps. If you say 'sit' it sits. If you forget a step, the robot gets stuck!\n\nToday you will be the robot — and then you will be the boss.",
      tip: "Grown-up: model it first. Say 'stand up, clap twice, sit down' and do EXACTLY that — even the silly bits.",
    },
    build: {
      text: "Robot game, with a friend:",
      actions: [
        "Friend is the boss, you are the robot. Boss says ONE instruction at a time: 'stand up', 'turn around', 'clap', 'touch your nose'",
        "Robot does EXACTLY that — nothing more, nothing less",
        "Swap! Now YOU are the boss. Give three instructions in a row",
        "Lay out picture cards (arrow, hand, star…) in a row to SHOW your three instructions in order",
      ],
      tip: "Grown-up: try swapping two cards and ask 'is it still the same dance?' — that's 'order matters'.",
    },
    photo: {
      label: "Instruction cards photo",
      description: "A photo of the child's row of instruction cards (or them acting out a step).",
      text: "Take a photo of your row of instruction cards, all in order. Left to right!",
    },
    voice: {
      label: "Voice note: my instructions",
      description: "The child says their three instructions aloud, in order.",
      text: "Press the button and say your three robot instructions in order — first, then, last.",
    },
  }),

  // P — Drive a floor robot along a route
  early({
    strand: "P",
    title: "Bee-Bot to the Treasure",
    summary: "Program a Bee-Bot floor robot to drive along a route to the treasure — your first real program!",
    badgeName: "Bee-Bot Driver",
    badgeIcon: "🐝",
    badgeDescription: "Planned and entered a sequence of Bee-Bot button presses to reach a target.",
    learn: {
      text: "Bee-Bot is a robot that only understands four things: forward, back, turn left, turn right. You press the buttons, then press GO — and it does your whole plan at once.\n\nIf it goes the wrong way, that's okay! Press the X (clear) and try again. Every programmer fixes mistakes.",
      tip: "Grown-up: one press = one square forward. Turns spin on the spot — they do NOT move forward. That surprises everyone the first time.",
    },
    build: {
      text: "Get Bee-Bot to the treasure:",
      actions: [
        "Put Bee-Bot on the mat at START. Put the treasure (a sticker, a toy) 2 or 3 squares away",
        "Walk it with your finger first: 'forward, forward, turn…'. Count the squares out loud",
        "Press X to clear. Now press the buttons for your plan — say each one as you press it",
        "Press GO! Did it reach the treasure? If not: X, fix ONE thing, try again",
        "Got it? Move the treasure somewhere harder and do it again",
      ],
      tip: "Grown-up: if there's no Bee-Bot, use a toy car and the child IS the robot — still press pretend buttons and say the plan first.",
    },
    photo: {
      label: "Bee-Bot at the treasure photo",
      description: "A photo of Bee-Bot (or the toy) on the route, having reached the target.",
      text: "Take a photo of Bee-Bot sitting on the treasure — with the mat showing where it came from.",
    },
    voice: {
      label: "Voice note: my Bee-Bot plan",
      description: "The child says the button presses they used, in order.",
      text: "Press the button and tell me which buttons you pressed to get there — forward, forward, turn…? Say them in order.",
    },
  }),

  // MD — Sort objects into groups together
  early({
    strand: "MD",
    title: "Sort the Toy Box",
    summary: "Tip out the toy box and sort everything into groups — by colour, by size, by what it is. That's what computers do with data!",
    badgeName: "Super Sorter",
    badgeIcon: "🧺",
    badgeDescription: "Sorted a collection of objects into groups and explained the rule used.",
    learn: {
      text: "Sorting means putting things that are the SAME together. Red bricks here, blue bricks there. Big ones here, small ones there.\n\nComputers sort all day long — photos, songs, names — and they always need a RULE. Today you choose the rule.",
      tip: "Grown-up: ask for the rule before they start ('how will you decide which pile?') and again at the end.",
    },
    build: {
      text: "Sort it out:",
      actions: [
        "Tip out a box of mixed things — bricks, buttons, toy animals, crayons",
        "Choose a rule: by COLOUR? by SIZE? by what it IS?",
        "Make a pile (or a hoop) for each group and sort everything. Every single thing must find a home",
        "Now try a DIFFERENT rule and sort again — do the piles change?",
      ],
      tip: "Grown-up: something that fits two groups (a big red brick when sorting by colour AND size) is a brilliant talking point.",
    },
    photo: {
      label: "Sorted groups photo",
      description: "A photo of the objects sorted into clear groups.",
      text: "Take a photo of your sorted piles from above — so we can see every group.",
    },
    voice: {
      label: "Voice note: my sorting rule",
      description: "The child explains the rule they sorted by.",
      text: "Press the button and tell me your rule: how did you decide which pile each thing went in?",
    },
  }),

  // DC — Devices talk to each other
  early({
    strand: "DC",
    title: "Can You Hear Me?",
    summary: "Make two devices talk to each other — a call, a message, a walkie-talkie — and discover that machines can send things through the air.",
    badgeName: "Message Sender",
    badgeIcon: "📡",
    badgeDescription: "Sent a message between two devices and described how it travelled.",
    learn: {
      text: "When you video-call Grandma, your tablet talks to her tablet. Your voice goes in one device, zooms through the air (or through wires), and comes out of the other one — even if she is far away!\n\nDevices talking to each other is how messages, photos and videos get around.",
      tip: "Grown-up: two classroom tablets on a video call across the room is perfect. Walkie-talkies or a string telephone work too.",
    },
    build: {
      text: "Send a message between two devices:",
      actions: [
        "With a grown-up, set up two devices that can talk (a video call between two tablets, or two walkie-talkies)",
        "Stand far apart — other side of the room! Say hello. Can your friend hear you?",
        "Send a drawing or a silly face. Did it arrive on the other device?",
        "Try it with a string telephone (two cups and string). Does it work with the string loose? Tight?",
      ],
      tip: "Grown-up: the takeaway is simple — 'the message travels from this device to that one'.",
    },
    photo: {
      label: "Two devices talking photo",
      description: "A photo of the two devices (or the string telephone) in use.",
      text: "Take a photo of your two devices talking to each other — or your string telephone.",
    },
    voice: {
      label: "Voice note: how did it get there?",
      description: "The child describes how their message travelled from one device to the other.",
      text: "Press the button and tell me: how did your hello get from YOUR device to your friend's device?",
    },
  }),

  // TC — First taps, clicks and photos
  early({
    strand: "TC",
    title: "My First Photo",
    summary: "Tap, swipe and click like a pro — then take your very own photo and make a touch drawing on the tablet.",
    badgeName: "Tablet Tapper",
    badgeIcon: "📸",
    badgeDescription: "Used taps and swipes to take a photo and make a digital drawing.",
    learn: {
      text: "Tablets listen to your fingers. TAP to choose. SWIPE to move. PINCH to make things big or small.\n\nToday you take a photo by yourself — and draw a picture with your finger.",
      tip: "Grown-up: show the camera button once, then hands off. Wobbly photos are part of learning.",
    },
    build: {
      text: "Tap, snap, draw:",
      actions: [
        "Open the camera. Find the big round button. Point at something you like",
        "Hold still… TAP! Look at your photo. Too dark? Too blurry? Take another one",
        "Open the drawing app. Pick a colour by tapping it. Draw with your finger",
        "Try a thick line and a thin line. Try two colours. Give your picture a name",
      ],
      tip: "Grown-up: any paint app works — the skills are tap to choose, drag to draw, and finding the undo button.",
    },
    photo: {
      label: "My photo or drawing",
      description: "A photo the child took themselves, or a screenshot of their touch drawing.",
      text: "Upload the photo YOU took — or a picture of your drawing on the tablet.",
    },
    voice: {
      label: "Voice note: how I did it",
      description: "The child says which taps/swipes they used to take the photo or draw.",
      text: "Press the button and tell me: what did you tap to take your photo? How did you choose your colours?",
    },
  }),

  // SW — Passwords keep things safe
  early({
    strand: "SW",
    title: "The Secret Word",
    summary: "Find out why tablets and games ask for a password — a secret word that keeps YOUR things safe.",
    badgeName: "Safety Star",
    badgeIcon: "🔐",
    badgeDescription: "Explained that a password is a secret that keeps things safe and should not be shared.",
    learn: {
      text: "A password is a SECRET WORD. It locks your tablet like a key locks a door. Only people who know the secret can get in.\n\nWho should know YOUR password? You — and your grown-up. Not your friends. Not strangers. That's how it stays safe.",
      tip: "Grown-up: never ask the child to say or show a real password here — they invent a pretend one for the game.",
    },
    build: {
      text: "The secret-word game:",
      actions: [
        "Make a pretend treasure box (a shoebox). Choose a pretend secret word with your grown-up — something silly like 'purple-banana'",
        "Your friend wants to open the box. Do they know the secret word? No? Then the box stays shut!",
        "Now draw a picture of a lock and the things that a password keeps safe — your photos, your games, your drawings",
        "Practise saying: 'My password is a secret. I only tell my grown-up.'",
      ],
    },
    photo: {
      label: "Lock drawing photo",
      description: "A photo of the child's drawing of a lock and the things a password protects.",
      text: "Take a photo of your lock drawing.",
    },
    voice: {
      label: "Voice note: why passwords are secret",
      description: "The child says who should know their password and why (no real passwords!).",
      text: "Press the button and tell me: who is allowed to know your password, and why do we keep it secret? (Don't say a real password!)",
    },
  }),

  // DW — Devices at home and school
  early({
    strand: "DW",
    title: "Devices at Home and School",
    summary: "Draw the devices you use at home and the ones you use at school — and spot which ones are the same.",
    badgeName: "Device Detective",
    badgeIcon: "🏠",
    badgeDescription: "Identified digital devices used at home and at school and what each is for.",
    learn: {
      text: "At school we have tablets, a big screen, maybe a Bee-Bot. At home you might have a TV, a phone, a games console, a smart speaker that plays songs.\n\nThey are all DEVICES — machines that help us do things. Which ones do you use?",
      tip: "Grown-up: ask 'what do we USE it for?' — watching, talking, playing, learning.",
    },
    build: {
      text: "Make a two-sided picture:",
      actions: [
        "Fold a paper in half. Write (or ask a grown-up to write) HOME on one side and SCHOOL on the other",
        "On HOME, draw the devices you use there. On SCHOOL, draw the ones here",
        "Circle any device that is on BOTH sides",
        "Next to each device, draw what you do with it — a song note, a game, a face for calling",
      ],
    },
    photo: {
      label: "Home and school devices photo",
      description: "A photo of the child's two-sided devices drawing.",
      text: "Take a photo of your HOME and SCHOOL picture with all your devices.",
    },
    voice: {
      label: "Voice note: my favourite device",
      description: "The child names a device and says what they use it for.",
      text: "Press the button and tell me: which device is your favourite, and what do you use it for?",
    },
  }),
];
