export const PRACTICES = ["all", "home", "top", "bottom"];
export const PACES = ["easy", "medium", "hard"];
export type Climb = { id: string; practice: string; pace: string; leaps: number; correct: number; attempts: number; streak: number; elapsed: number };
export function validClimb(value: unknown): value is Climb {
  if (!value || typeof value !== "object") return false;
  const s = value as Climb;
  return typeof s.id === "string" && /^[0-9a-f-]{36}$/i.test(s.id) &&
    PRACTICES.includes(s.practice) && PACES.includes(s.pace) && s.leaps === 150 &&
    Number.isSafeInteger(s.correct) && s.correct >= 230 && s.correct <= s.attempts &&
    Number.isSafeInteger(s.attempts) && s.attempts >= 230 && s.attempts <= 50000 &&
    Number.isSafeInteger(s.streak) && s.streak >= 1 && s.streak <= 150 &&
    Number.isSafeInteger(s.elapsed) && s.elapsed >= 12000 && s.elapsed <= 86400000;
}
export function validUsername(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{2,20}$/.test(value);
}
export type ClassClimb = Climb & { learnerId: string; classId: string; username: string };
export function rankClimbs(rows: ClassClimb[], classId: string, practice: string, pace: string) {
  const best = new Map<string, ClassClimb>();
  const compare = (a: ClassClimb, b: ClassClimb) => (b.correct / b.attempts) - (a.correct / a.attempts) || b.streak - a.streak || a.elapsed - b.elapsed || a.id.localeCompare(b.id);
  for (const stored of rows) {
    // Relaxed climbs (before the difficulties) had easy's rules; steady and speedy didn't fall, so they aren't ranked.
    const row = stored.pace === "relaxed" ? { ...stored, pace: "easy" } : stored;
    if (!validClimb(row) || row.classId !== classId || row.practice !== practice || row.pace !== pace || !validUsername(row.username)) continue;
    const prev = best.get(row.learnerId);
    if (!prev || compare(row, prev) < 0) best.set(row.learnerId, row);
  }
  return [...best.values()].sort(compare).slice(0, 20);
}
