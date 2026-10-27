export const SKILLS = [
  { id: 'aim', name: 'Gentle landing', action: 'Move onto the butterfly and stay for a moment.', icon: '🦋', tip: 'Practise stopping the pointer on a large target.' },
  { id: 'click', name: 'Flower finder', action: 'Click the flower once to collect it.', icon: '🌼', tip: 'Practise one gentle click without moving the mouse.' },
  { id: 'double', name: 'Hidden treasure', action: 'Double-click the acorn to open it.', icon: '🌰', tip: 'Keep the mouse still and click twice quickly.' },
  { id: 'right', name: 'Secret garden', action: 'Right-click the mushroom to reveal its magic.', icon: '🍄', tip: 'Practise choosing the right mouse button.' },
  { id: 'drag', name: 'Build a meadow', action: 'Hold the flower, drag it to the matching outline, then let go.', icon: '🌻', tip: 'Practise holding the button until the piece reaches its outline.' },
] as const;
export type Skill = typeof SKILLS[number]['id'];
export type Attempt = { skill: Skill; level: number; success: boolean; ms: number; input: 'mouse' | 'pen' | 'touch'; reason: 'hit' | 'miss' | 'wrong-button' | 'early-release' };
export type MouseRecord = { sessionId: string; kind: 'start' | 'attempt' | 'end'; sequence: number; attempt?: Attempt };
export const LEVELS = ['Explore', 'Grow', 'Shine'];
export function validRecord(v: unknown): v is MouseRecord {
  if (!v || typeof v !== 'object') return false;
  const r = v as MouseRecord;
  if (typeof r.sessionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(r.sessionId) || !Number.isInteger(r.sequence) || r.sequence < 0 || r.sequence > 10000) return false;
  if (r.kind === 'start') return r.sequence === 0 && r.attempt === undefined;
  if (r.kind === 'end') return r.sequence > 0 && r.attempt === undefined;
  const a = r.attempt;
  return r.kind === 'attempt' && r.sequence > 0 && !!a && SKILLS.some(s => s.id === a.skill) && Number.isInteger(a.level) && a.level >= 0 && a.level < LEVEL_COUNT && typeof a.success === 'boolean' && Number.isInteger(a.ms) && a.ms >= 0 && a.ms <= 3600000 && ['mouse', 'pen', 'touch'].includes(a.input) && ['hit', 'miss', 'wrong-button', 'early-release'].includes(a.reason) && a.success === (a.reason === 'hit');
}
export function summarize(attempts: Attempt[], levelCount = LEVEL_COUNT) {
  return SKILLS.map(skill => {
    const rows = attempts.filter(a => a.skill === skill.id);
    const hits = rows.filter(a => a.success);
    const mastered = Array.from({ length: levelCount }, (_, i) => i).filter(level => {
      const group = rows.filter(a => a.level === level);
      return group.filter(a => a.success).length >= (levelCount === 3 ? 4 : levelConfig(level).goal) && group.filter(a => a.success).length / group.length >= .8;
    });
    return { ...skill, attempts: rows.length, hits: hits.length, accuracy: rows.length ? Math.round(hits.length / rows.length * 100) : null, meanMs: hits.length ? Math.round(hits.reduce((n, a) => n + a.ms, 0) / hits.length) : null, level: mastered.length ? Math.max(...mastered) + 1 : 0, proficiency: !rows.length ? 'Not observed' : mastered.includes(levelCount - 1) ? 'Secure in this session' : mastered.length ? 'Developing' : 'Practising' };
  });
}

export const LEVEL_COUNT = 15;
export function levelConfig(level: number) {
  return { size: Math.round(88 - level * 3), goal: 4 + Math.floor(level / 4), dwell: Math.round(450 + level * 29), dropRadius: 62 - level * 2 };
}
// Score each skill/level once; additional retries cannot farm unlimited points.
export function sessionScore(attempts: Attempt[]) {
  let score = 0;
  let completed = 0;
  for (const skill of SKILLS) for (let level = 0; level < LEVEL_COUNT; level++) {
    const goal = levelConfig(level).goal;
    let hits = 0, tries = 0;
    for (const a of attempts) {
      if (a.skill !== skill.id || a.level !== level) continue;
      tries++;
      if (a.success) { hits++; if (hits <= goal) score += 10 + level * 2; }
      if (hits >= goal && hits / tries >= .8) { score += Math.round(hits / tries * 100); completed++; break; }
    }
  }
  return { score, completed };
}
export type MeadowScore = { learnerId: string; sessionId: string; score: number; completed: number };
export function rankMeadowScores(rows: MeadowScore[]) {
  const best = new Map<string, MeadowScore>();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.score) || row.score <= 0 || !Number.isSafeInteger(row.completed) || row.completed < 0 || row.completed > 75) continue;
    const previous = best.get(row.learnerId);
    if (!previous || row.score > previous.score || (row.score === previous.score && row.completed > previous.completed)) best.set(row.learnerId, row);
  }
  return [...best.values()].sort((a, b) => b.score - a.score || b.completed - a.completed || a.learnerId.localeCompare(b.learnerId));
}
