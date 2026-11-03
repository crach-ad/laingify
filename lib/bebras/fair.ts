// Positions remain compatible with existing saved Fair answers.
export const fairBeavers = [
  { name: 'A · red hat', height: 12 },
  { name: 'B · yellow hat', height: 9 },
  { name: 'C · green hat', height: 6 },
  { name: 'D · blue hat', height: 10 },
  { name: 'E · purple hat', height: 11 },
];
export const fairStilts = [3, 4, 2, 7, 8, 1];
export function fairSlots(value: unknown): string[] {
  const seen = new Set<string>();
  return fairStilts.map((_, i) => {
    const name = Array.isArray(value) ? value[i] : '';
    if (!fairBeavers.some(b => b.name === name) || seen.has(name)) return '';
    seen.add(name);
    return name;
  });
}
// An occupied destination sends its previous occupant back to the starting area.
export function placeFair(value: unknown, name: string, destination: number): string[] {
  const slots = fairSlots(value);
  if (!fairBeavers.some(b => b.name === name) || destination < -1 || destination >= slots.length || !Number.isInteger(destination)) return slots;
  const next = slots.map(v => v === name ? '' : v);
  if (destination >= 0) next[destination] = name;
  return next;
}
