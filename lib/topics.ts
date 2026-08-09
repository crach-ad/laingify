// Topic grouping for the learner dashboard: modules carry a `topic` string;
// the dashboard shows one card per topic and each topic page lists its
// project modules. Slugs are derived (not stored), so both sides use this.

export function slugifyTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
