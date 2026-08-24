// Shared coding-platform modules (multiple orgs). Pattern: explain → play →
// screenshot proof → student-critic wrap-up.

import { block, wrapUpPrompt, wrapUpCriterion, photoCriterion, audioCriterion } from "./seed-lib.mjs";

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
