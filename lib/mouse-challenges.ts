export type Point = { x: number; y: number };
export type DragLayout = { source: Point; destination: Point; waypoints: Point[] };
export const TARGET_SPOTS: Point[] = [
  { x: 26, y: 23 }, { x: 74, y: 23 }, { x: 26, y: 50 },
  { x: 74, y: 50 }, { x: 26, y: 77 }, { x: 74, y: 77 },
];
export function nextTarget(previous: Point, random = Math.random): Point {
  const choices = TARGET_SPOTS.filter(p => Math.hypot(p.x - previous.x, p.y - previous.y) > 30);
  return choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
}
export function decoyPositions(target: Point, count: number): Point[] {
  return TARGET_SPOTS.filter(p => Math.hypot(p.x - target.x, p.y - target.y) > 20).slice(0, count);
}
export function nextDragLayout(level: number, previous?: DragLayout, random = Math.random): DragLayout {
  const left = previous ? previous.source.x > 50 : random() < .5;
  const inset = 35 - Math.min(level, 9);
  const near = inset + random() * 2, far = 100 - inset - random() * 2;
  const top = 27 + random() * 7, bottom = 66 - random() * 7;
  const source = { x: left ? near : far, y: level < 3 ? 46 + random() * 8 : left ? top : bottom };
  const destination = { x: left ? far : near, y: level < 3 ? source.y : left ? bottom : top };
  const waypoints = level < 6 ? [] : level < 12
    ? [{ x: 50, y: left ? 72 : 28 }]
    : [{ x: source.x, y: destination.y }, { x: destination.x, y: source.y }];
  return { source, destination, waypoints };
}
// Check the whole pointer segment so fast movement cannot jump over a ring.
export function crossesRing(from: Point, to: Point, center: Point, radius: number) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((center.x - from.x) * dx + (center.y - from.y) * dy) / length)) : 0;
  return Math.hypot(from.x + t * dx - center.x, from.y + t * dy - center.y) <= radius;
}
export function completedDrag(visited: number, required: number, release: Point, destination: Point, radius: number) {
  return visited === required && Math.hypot(release.x - destination.x, release.y - destination.y) <= radius;
}
