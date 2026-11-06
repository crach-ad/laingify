// Topic grouping for the learner dashboard: modules carry a `topic` string;
// the dashboard shows one card per topic and each topic page lists its
// project modules. Slugs are derived (not stored), so both sides use this.
export const LETTER_LEAPER_PLAY_PATH = "/play/letter-leaper/full";

// Letter Leaper is a standalone activity at the end of every class's topics.
export function dashboardTopicOrder(a: { name: string }, b: { name: string }): number {
  return Number(a.name === "Letter Leaper") - Number(b.name === "Letter Leaper");
}

export function slugifyTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Bebras sets share one standalone dashboard area across year groups.
export function moduleTopic(module: { title: string; topic: string }): string {
  if (module.title === "Letter Leaper: Moonbound") return "Letter Leaper";
  return /^Bebras (?:Juniors 202[45]|Castors 202[45])$/.test(module.title) && module.topic === "Computational Thinking"
    ? "Bebras challenges" : module.topic || module.title;
}
