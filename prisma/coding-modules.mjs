// Shared coding-platform modules (multiple orgs). Pattern: explain → play →
// screenshot proof → student-critic wrap-up.

import { block, wrapUpPrompt, wrapUpCriterion, photoCriterion, audioCriterion, textCriterion } from "./seed-lib.mjs";

// Rodocodo Quest — extracted verbatim from the camp seed (title must stay
// stable: content updates match by title).
export function createRodocodoModule(projectModule, topic = "Foundations of Coding") {
  // Rodocodo (Foundations of Coding) — platform-play module: short explanation,
  // level progress captured by screenshot, and student-perspective feedback.
  // Pattern for future platform modules: explain → play → screenshot → review.
  return projectModule({
    topic,
    title: "Rodocodo Quest",
    summary: "Puzzle your way through Rodocodo's levels — every puzzle you beat is a real program you wrote.",
    badgeName: "Code Quester",
    badgeIcon: "🕹️",
    badgeDescription: "Completed Rodocodo coding levels using sequences, loops, and functions, and reviewed the platform as a critic.",
    blocks: [
      block("heading", { text: "Rodocodo — coding as a game" }),
      block("text", {
        kind: "learn",
        minutes: 3,
        text: "Rodocodo turns programming into puzzles: you give a character step-by-step commands to reach the goal. Every level you beat IS a program — you wrote it, the computer ran it.\n\nAs the levels climb, the game sneaks in the big ideas: SEQUENCES (steps in order), LOOPS (repeat without repeating yourself), and FUNCTIONS (name a recipe, reuse it everywhere). The same ideas from your Scratch game — new world.",
        tip: "Stuck on a level? That's the game working. Read what your program ACTUALLY does, not what you meant it to do — that's debugging.",
      }),
      block("text", {
        kind: "build",
        minutes: 25,
        text: "Get playing:",
        actions: [
          "Go to rodocodo.com and log in (your instructor has the class login)",
          "Start from the first world and work upward — no skipping",
          "Beat at least 10 levels (or finish your first world)",
          "When a loop or function block appears, USE it — shorter programs beat long ones",
        ],
        tip: "Race a neighbour to the same level, then compare programs. Same puzzle, different code — both right. That's programming.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Rodocodo progress screenshot",
        text: "Screenshot of your Rodocodo progress screen showing your completed levels — at least 10 levels or a finished world. Caption: the trickiest level number and why.",
      }),
      block("heading", { text: "Your review — the student's perspective" }),
      block("text", {
        kind: "reflect",
        minutes: 4,
        text: "Companies pay serious money for what you have right now: a student's honest opinion. Think like a reviewer:",
        actions: [
          "What was the most fun part — and what made it fun?",
          "Where did it get hard? Was hard fun or frustrating?",
          "What would you change about Rodocodo if you ran the company?",
          "Would you recommend it to a friend learning to code? Why or why not?",
        ],
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: Rodocodo review",
        text: "Press record and give your honest 60-second review: most fun part, hardest part, one thing you'd change, and would you recommend it — like you're telling the people who made it.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Name one idea from Rodocodo (sequence, loop, or function) and where it showed up in a level you beat."),
    ],
    criteria: [
      photoCriterion(0, "Rodocodo progress screenshot", "Rodocodo progress screen with at least 10 levels or a completed world."),
      audioCriterion(1, "Voice note: Rodocodo review", "An honest student review: fun, difficulty, one change, recommendation."),
      wrapUpCriterion(2, "Written reflection connecting a coding idea to a level."),
    ],
  });
}

// Blockly Maze — wraps the free /play/blocks game (built with the Blockly
// library) as a module: play embedded, prove it with a screenshot, reflect.
export function createBlocklyMazeModule(projectModule, topic = "Foundations of Coding") {
  return projectModule({
    topic,
    title: "Blockly Maze",
    summary: "Drive a robot through three mazes with drag-and-drop code blocks — sequences, turns, and your first loop.",
    badgeName: "Maze Master",
    badgeIcon: "🧩",
    badgeDescription: "Programmed a robot through three mazes using sequences, turns, and a repeat loop.",
    blocks: [
      block("heading", { text: "Program the robot" }),
      block("text", {
        kind: "learn",
        minutes: 2,
        text: "The robot only does EXACTLY what your blocks say — nothing more. Drag blocks from the left, snap them into one stack, press Run.\n\nLevel 3 has a secret: a repeat block can replace a whole pile of move blocks. Fewer blocks = better code — that's how real programmers think.",
        tip: "If the game feels cramped below, open laingify.vercel.app/play/blocks in its own tab for more room.",
      }),
      block("heading", { text: "Play — beat all three mazes" }),
      block("embed", { url: "/play/blocks" }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Maze victory screenshot",
        text: "Beat all three levels, then screenshot the trophy screen (or your Level 3 'Solved in N blocks!' message) and upload it here.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("How did the repeat block make your Level 3 program shorter?"),
    ],
    criteria: [
      photoCriterion(0, "Maze victory screenshot", "Proof of the trophy screen or a solved level."),
      wrapUpCriterion(1, "Written reflection: sequences, turns, and the repeat loop."),
    ],
  });
}

// Compute It — Toxicode's execution-tracing game (compute-it.toxicode.fr):
// no writing code, just reading it. Given pseudocode (right(), if, while) the
// learner predicts and walks a token across a grid to check their reading.
// Difficulty ramps every 10 levels (sequence → if/else → while), so this
// module gates on a short written reflection at each of those three points
// instead of a single end screenshot.
export function createComputeItModule(projectModule, topic = "Foundations of Coding") {
  return projectModule({
    topic,
    title: "Compute It",
    summary: "Read the code, move the dot — trace pseudocode through 30 levels of sequences, conditionals, and loops.",
    badgeName: "Code Tracer",
    badgeIcon: "🔍",
    badgeDescription: "Traced pseudocode execution across 30 Compute It levels, reasoning through sequences, conditionals, and while loops.",
    blocks: [
      block("heading", { text: "Compute It — read the code, move the dot" }),
      block("text", {
        kind: "learn",
        minutes: 3,
        text: "Every level so far, YOU wrote the code. Compute It flips that: the code is already written, and your job is to read it and figure out exactly what it does — no running it to find out, no guessing.\n\nEach puzzle shows a grid of circles and some pseudocode: right(), left(), up(), down() move the highlighted dot one step. Read the whole thing first, predict where the dot ends up, THEN move it step by step to check yourself.",
        tip: "This skill is called tracing, and it's what real programmers do to find bugs — reading code carefully, one line at a time, instead of just staring at it hoping to spot the problem.",
      }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Levels 1–10 warm up with sequences — straight lines of moves, no decisions yet:",
        actions: [
          "Press the play arrow to start Compute It",
          "For each level, read every line of pseudocode before touching anything",
          "Predict where the dot will end up, then move it step by step to check",
          "Complete levels 1 through 10",
        ],
        tip: "Wrong prediction? That's useful information, not a failure — go back and find exactly which line you misread.",
      }),
      block("embed", { url: "https://compute-it.toxicode.fr/" }),
      block("checkpoint", {
        capture: "text",
        criterionLabel: "Reflection: levels 1–10",
        text: "You just finished levels 1–10. In your own words, what do right(), left(), up(), and down() each do? What's your strategy for getting a puzzle right on the first try — read first, or move first, and why?",
      }),
      block("heading", { text: "Levels 11–20 — decisions" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "Now the code starts making decisions. An if only takes its steps WHEN a condition is true — usually the color of the circle the dot is standing on:",
        actions: [
          "Notice the colored condition next to if — that's what's being checked",
          "Trace carefully: does the dot's current circle match, or not?",
          "Complete levels 11 through 20 (if, then if/else)",
        ],
        tip: "if/else means exactly one branch runs, never both and never neither — figure out which one before you move.",
      }),
      block("checkpoint", {
        capture: "text",
        criterionLabel: "Reflection: levels 11–20",
        text: "Levels 11–20 introduced if (and if/else). Explain in your own words what an if does in code, and describe one puzzle where the color under the dot changed what happened next.",
      }),
      block("heading", { text: "Levels 21–30 — loops that repeat until told to stop" }),
      block("text", {
        kind: "build",
        minutes: 15,
        text: "The last stretch adds while loops: the code inside repeats AS LONG AS a condition stays true, then stops the moment it's false.",
        actions: [
          "Before moving, figure out what condition the while is checking",
          "Trace one full loop pass at a time — don't skip ahead",
          "Finish levels 21 through 30 — level 30 is the hardest puzzle in the game, take your time",
        ],
        tip: "A while loop is just an if that keeps checking itself again after each pass — if you can trace if, you can trace while.",
      }),
      block("checkpoint", {
        capture: "text",
        criterionLabel: "Reflection: levels 21–30",
        text: "What does a while loop do differently from just writing the same command over and over by hand? Why might a while loop be smarter — or safer — than repeating code yourself?",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Name one Compute It level that tricked you at first, and explain the exact line of code you misread."),
    ],
    criteria: [
      textCriterion(0, "Reflection: levels 1–10", "Explains right/left/up/down and a tracing strategy, after completing levels 1–10."),
      textCriterion(1, "Reflection: levels 11–20", "Explains what if does and describes a color-conditioned puzzle, after completing levels 11–20."),
      textCriterion(2, "Reflection: levels 21–30", "Explains what a while loop does differently from manual repetition, after completing levels 21–30."),
      wrapUpCriterion(3, "Written reflection naming a tricky level and the misread line."),
    ],
  });
}
