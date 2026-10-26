import { block, photoCriterion, wrapUpCriterion, wrapUpPrompt } from "./seed-lib.mjs";

export const LETTER_LEAPER_TITLE = "Letter Leaper: Moonbound";
// `teacher` names the class's teacher in the learner-facing text (Windsor's
// seed and enable script keep the default).
export function createLetterLeaperModule(projectModule, { teacher = "Ms. Smith" } = {}) {
  return projectModule({
    topic: "Keyboard Skills",
    title: LETTER_LEAPER_TITLE,
    summary: "Help Milo climb through six worlds: 100 letter leaps to the moon, then 50 short-word leaps to the stars.",
    badgeName: "Star Typist",
    badgeIcon: "🌟",
    badgeDescription: "Practised accurate letter and short-word typing and reflected on a jungle-to-stars adventure.",
    blocks: [
      block("heading", { text: "Small leaps, stronger typing" }),
      block("text", {
        kind: "learn", minutes: 2,
        text: `Sit comfortably and find the letters on your keyboard. Accuracy comes before speed. Choose a nickname for your class leaderboard—do not use your full name.\n\nStart in Relaxed mode. Choose All letters, or practise one keyboard row if ${teacher} asks you to. The highlighted key helps you find your next letter.`,
      }),
      block("text", {
        kind: "build", minutes: 15,
        text: "Open the game in a new tab so you have room to play. Keep this module open to collect your work afterwards.",
        actions: [
          "Type the letter on the glowing platform. A correct answer earns one leap.",
          "Watch the terrain change: jungle, snowy peaks, clouds, edge of space, moon, and starfield.",
          "At leap 100, celebrate your moon landing. Continue with 20 two-letter words, then 30 three-letter words to reach the stars at leap 150.",
          "Type every letter in a word in order. A mistake keeps your correct letters; try the next letter again.",
          "Take breaks with Escape. If time runs out in class, capture how far you got before closing the game.",
        ],
        tip: "When you sign in with your PIN, every practice — finished or not — saves to your learning record, and you can resume an unfinished climb. Without a PIN, an unfinished climb only stays in the open game tab. A completed climb also goes on your class leaderboard.",
      }),
      block("link", { url: "/play/letter-leaper", text: "Play Letter Leaper" }),
      block("checkpoint", {
        capture: "photo", criterionLabel: "Typing adventure screenshot",
        text: "Upload a screenshot of your moon landing, star finish, or the progress you reached today. Include the leap counter and accuracy when possible. Caption it with your practice mode and something you improved.",
      }),
      block("heading", { text: "Reflect on your typing" }),
      wrapUpPrompt(`Which letters or words were tricky? What helped you type more accurately? Younger learners can ask ${teacher} to help them write their answer.`),
    ],
    criteria: [
      photoCriterion(0, "Typing adventure screenshot", "A screenshot of today's typing progress, with practice mode and an improvement noted."),
      wrapUpCriterion(1, "Names a typing challenge and a strategy for improving accuracy."),
    ],
  });
}
