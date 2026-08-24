// The fifteen K'NEX Engineering project modules — shared between orgs
// (Abaco camp, Windsor School). Each is a step-by-step interactive 3D build
// (knex blocks) with a photo checkpoint and written wrap-up.
//
// `projectModule` is the caller's org-bound creator: ({topic, title, summary,
// badgeName, badgeIcon, badgeDescription, blocks, criteria}) => Module.

import { block, wrapUpPrompt, wrapUpCriterion, photoCriterion, audioCriterion } from "./seed-lib.mjs";

export async function createKnexModules(projectModule) {

  // ==========================================================================
  // MODULE 7 — K'NEX Engineering
  // Ten step-by-step builds rendered as interactive 3D models (knex blocks).
  // Geometry lives on a unit grid (y up, ground y = 0); rod colors map to
  // K'NEX sizes automatically (unit rod = blue, unit-square diagonal = yellow).
  // ==========================================================================
  const P = (x, y, z) => [x, y, z];
  // Rods around a closed loop of points / along an open chain of points.
  const loop = (pts) => pts.map((p, i) => [p, pts[(i + 1) % pts.length]]);
  const chain = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
  // Corner points of an axis-aligned square at height y, and its four rods.
  const corners = (x, z, y, s = 1) => [P(x, y, z), P(x + s, y, z), P(x + s, y, z + s), P(x, y, z + s)];
  const sq = (x, z, y, s = 1) => loop(corners(x, z, y, s));
  // Vertical rods lifting each point from y0 to y1.
  const lift = (pts, y0, y1) => pts.map((p) => [P(p[0], y0, p[2]), P(p[0], y1, p[2])]);

  const hexAt = (cy, z) =>
    [0, 60, 120, 180, 240, 300].map((a) =>
      P(Math.round(Math.cos((a * Math.PI) / 180) * 100) / 100, cy + Math.round(Math.sin((a * Math.PI) / 180) * 100) / 100, z),
    );

  const knex = (props) => block("knex", props);

  const KNEX = "K'NEX Engineering";
  const knexPhoto = (label, hint) =>
    block("checkpoint", {
      capture: "photo",
      criterionLabel: label,
      text: `Photo of your real K'NEX build — or a screenshot of the finished 3D model if there's no kit at your station. ${hint}`,
    });

  const k1 = await projectModule({
    topic: KNEX,
    title: "The Perfect Cube",
    summary: "Twelve rods, eight connectors — the atom of engineering.",
    badgeName: "Cube Cracker",
    badgeIcon: "🟦",
    badgeDescription: "Built the foundational cube and discovered why squares wobble.",
    blocks: [
      block("heading", { text: "Welcome to the build zone" }),
      block("text", {
        kind: "learn",
        minutes: 3,
        text: "Engineers don't start with math — they start with their hands. Each K'NEX project sneaks a real engineering idea into your fingers.\n\nEvery project has a 3D guide: tap each step to add pieces, then DRAG the model to spin it and see it from every side.\n\nRod colors in the guide = rod sizes in your kit (green is shortest, then white, blue, yellow, red, gray is longest). Grab rods of matching sizes — exact colors don't matter as long as lengths match.",
        tip: "Sort your pieces into piles by size BEFORE you start. Every real builder does — it doubles your speed.",
      }),
      block("heading", { text: "Build the cube" }),
      knex({
        kind: "build",
        minutes: 5,
        builds: [
          { text: "Lay a square flat on the table: four rods, four corner connectors", rods: sq(0, 0, 0) },
          { text: "Stand a rod straight up from each corner", rods: lift(corners(0, 0, 0), 0, 1) },
          { text: "Close the top with four more rods — a perfect cube", rods: sq(0, 0, 1) },
        ],
        text: "Twelve rods, eight connectors, one cube. This is the atom of engineering — almost everything you build starts as a cube or a square. Now make it real, and notice something: it wobbles. Remember that.",
      }),
      knexPhoto("Cube photo", "Caption: what happens when you push it sideways?"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Why do you think the cube wobbles when you push it sideways?"),
    ],
    criteria: [
      photoCriterion(0, "Cube photo", "The completed cube — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on the first build."),
    ],
  });

  const k2 = await projectModule({
    topic: KNEX,
    title: "The Tent",
    summary: "The unbreakable shape: why triangles hold up the world.",
    badgeName: "Triangle Tamer",
    badgeIcon: "⛺",
    badgeDescription: "Built a triangular prism and discovered why triangles cannot be bent out of shape.",
    blocks: [
      block("heading", { text: "Build the tent" }),
      knex({
        kind: "build",
        minutes: 6,
        builds: [
          { text: "Base rectangle: two long rods for the sides, two short for the ends", rods: loop([P(0, 0, 0), P(2, 0, 0), P(2, 0, 1), P(0, 0, 1)]) },
          { text: "Front triangle: two rods from the front corners up to a single peak", rods: [[P(0, 0, 0), P(0, 0.87, 0.5)], [P(0, 0, 1), P(0, 0.87, 0.5)]] },
          { text: "Back triangle: same at the other end", rods: [[P(2, 0, 0), P(2, 0.87, 0.5)], [P(2, 0, 1), P(2, 0.87, 0.5)]] },
          { text: "The ridge: one long rod connecting the two peaks", rods: [[P(0, 0.87, 0.5), P(2, 0.87, 0.5)]] },
        ],
        text: "Push down on your tent — it doesn't budge. Push sideways on your cube — it folds. The triangle is the ONLY shape that can't change without breaking a side. That's why you see triangles in every bridge, crane, and roof on Earth.",
      }),
      knexPhoto("Tent photo", "Caption: where do you see triangles in it?"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Where else have you seen triangles holding something up?"),
    ],
    criteria: [
      photoCriterion(0, "Tent photo", "The completed tent (triangular prism) — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on triangles."),
    ],
  });

  const k3 = await projectModule({
    topic: KNEX,
    title: "The Watchtower",
    summary: "Three stories tall — and bracing turns wobble into rigid.",
    badgeName: "Tower Builder",
    badgeIcon: "🗼",
    badgeDescription: "Built a three-story braced tower and explained why diagonal bracing works.",
    blocks: [
      block("heading", { text: "Build the watchtower" }),
      knex({
        kind: "build",
        minutes: 10,
        builds: [
          { text: "Base square on the table", rods: sq(0, 0, 0) },
          { text: "Four uprights + the first-floor square", rods: [...lift(corners(0, 0, 0), 0, 1), ...sq(0, 0, 1)] },
          { text: "Brace story one: a diagonal across each wall — four triangles born instantly", rods: [[P(0, 0, 0), P(1, 1, 0)], [P(1, 0, 0), P(1, 1, 1)], [P(1, 0, 1), P(0, 1, 1)], [P(0, 0, 1), P(0, 1, 0)]] },
          { text: "Story two: uprights + square", rods: [...lift(corners(0, 0, 0), 1, 2), ...sq(0, 0, 2)] },
          { text: "Brace story two — slant the diagonals the OTHER way", rods: [[P(1, 1, 0), P(0, 2, 0)], [P(1, 1, 1), P(1, 2, 0)], [P(0, 1, 1), P(1, 2, 1)], [P(0, 1, 0), P(0, 2, 1)]] },
          { text: "The crow's nest: one more story on top", rods: [...lift(corners(0, 0, 0), 2, 3), ...sq(0, 0, 3)] },
        ],
        text: "Build story one WITHOUT the diagonal first and wiggle it. Then add the diagonals and wiggle again. Feel that? Engineers call it bracing — you just turned wobbly squares into rigid triangles. Skyscrapers do exactly this.",
      }),
      knexPhoto("Tower photo", "Caption: how tall is it in centimeters?"),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: strongest shape",
        text: "Press record and answer like an engineer: which SHAPE makes structures strong, and WHY does it work? Use your tower as the example.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What changed when you added the diagonals?"),
    ],
    criteria: [
      photoCriterion(0, "Tower photo", "The completed three-story braced tower — real K'NEX or the finished 3D model."),
      audioCriterion(1, "Voice note: strongest shape", "Explains why triangles make structures strong, using the tower as the example."),
      wrapUpCriterion(2, "Written reflection on bracing."),
    ],
  });

  const k4 = await projectModule({
    topic: KNEX,
    title: "The Truss Bridge",
    summary: "A real Warren truss you can load-test with books.",
    badgeName: "Bridge Engineer",
    badgeIcon: "🌉",
    badgeDescription: "Built a Warren truss bridge and load-tested it like a real structural engineer.",
    blocks: [
      block("heading", { text: "Build the bridge" }),
      knex({
        kind: "build",
        minutes: 12,
        builds: [
          { text: "The deck: two rails of four rods each, tied with five cross rods", rods: [...chain([P(0, 0, 0), P(1, 0, 0), P(2, 0, 0), P(3, 0, 0), P(4, 0, 0)]), ...chain([P(0, 0, 1), P(1, 0, 1), P(2, 0, 1), P(3, 0, 1), P(4, 0, 1)]), ...[0, 1, 2, 3, 4].map((x) => [P(x, 0, 0), P(x, 0, 1)])] },
          { text: "Zigzag one side: up-down-up-down between the deck and the peaks", rods: chain([P(0, 0, 0), P(0.5, 0.87, 0), P(1, 0, 0), P(1.5, 0.87, 0), P(2, 0, 0), P(2.5, 0.87, 0), P(3, 0, 0), P(3.5, 0.87, 0), P(4, 0, 0)]) },
          { text: "Zigzag the other side to match", rods: chain([P(0, 0, 1), P(0.5, 0.87, 1), P(1, 0, 1), P(1.5, 0.87, 1), P(2, 0, 1), P(2.5, 0.87, 1), P(3, 0, 1), P(3.5, 0.87, 1), P(4, 0, 1)]) },
          { text: "Top chords along the peaks + four roof cross rods", rods: [...chain([P(0.5, 0.87, 0), P(1.5, 0.87, 0), P(2.5, 0.87, 0), P(3.5, 0.87, 0)]), ...chain([P(0.5, 0.87, 1), P(1.5, 0.87, 1), P(2.5, 0.87, 1), P(3.5, 0.87, 1)]), ...[0.5, 1.5, 2.5, 3.5].map((x) => [P(x, 0.87, 0), P(x, 0.87, 1)])] },
        ],
        text: "This zigzag pattern is called a Warren truss — count the triangles you just made. Rest your bridge between two chairs and GENTLY load it with books. Guess first: how many books before it gives? Real bridges are tested exactly this way (with robots, not books).",
      }),
      knexPhoto("Bridge photo", "Bonus: mid-load-test with books on it!"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("How many books did it hold — and where did it start to bend first?"),
    ],
    criteria: [
      photoCriterion(0, "Bridge photo", "The completed Warren truss bridge — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on the load test."),
    ],
  });

  const k5 = await projectModule({
    topic: KNEX,
    title: "The Chair",
    summary: "Strength FOR somebody: design meets engineering.",
    badgeName: "Furniture Designer",
    badgeIcon: "🪑",
    badgeDescription: "Designed a braced chair and connected structure to human-centered design.",
    blocks: [
      block("heading", { text: "Build the chair" }),
      knex({
        kind: "build",
        minutes: 6,
        builds: [
          { text: "Four legs + the seat square one level up", rods: [...lift(corners(0, 0, 0), 0, 1), ...sq(0, 0, 1)] },
          { text: "Backrest: two uprights on the back edge + a top bar", rods: [[P(0, 1, 1), P(0, 2, 1)], [P(1, 1, 1), P(1, 2, 1)], [P(0, 2, 1), P(1, 2, 1)]] },
          { text: "One diagonal across the backrest — no wobbly chairs allowed", rods: [[P(0, 1, 1), P(1, 2, 1)]] },
        ],
        text: "Design isn't just strength — it's strength FOR SOMEBODY. A chair holds a person: legs take the weight, the brace stops the sway. Look at the chair you're sitting on right now. Find its braces. (They're there.)",
      }),
      knexPhoto("Chair photo", "Caption: what would you change to make it comfier?"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Find a brace on a real chair near you — where was it hiding?"),
    ],
    criteria: [
      photoCriterion(0, "Chair photo", "The completed braced chair — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on design for people."),
    ],
  });

  const k6 = await projectModule({
    topic: KNEX,
    title: "The Windmill",
    summary: "Your first machine: a frame that stands and a rotor that spins.",
    badgeName: "Wind Catcher",
    badgeIcon: "🌀",
    badgeDescription: "Built a windmill with a braced tower and a free-spinning rotor — a frame plus a moving part.",
    blocks: [
      block("heading", { text: "Build the windmill" }),
      knex({
        kind: "build",
        minutes: 10,
        builds: [
          { text: "Tower base: square, uprights, square", rods: [...sq(0, 0, 0), ...lift(corners(0, 0, 0), 0, 1), ...sq(0, 0, 1)] },
          { text: "Tower top: one more story + two diagonals for bracing", rods: [...lift(corners(0, 0, 0), 1, 2), ...sq(0, 0, 2), [P(0, 1, 0), P(1, 2, 0)], [P(1, 1, 1), P(0, 2, 1)]] },
          { text: "Roof point: four rods to a peak · then the axle rod pointing out the front", rods: [[P(0, 2, 0), P(0.5, 2.87, 0.5)], [P(1, 2, 0), P(0.5, 2.87, 0.5)], [P(1, 2, 1), P(0.5, 2.87, 0.5)], [P(0, 2, 1), P(0.5, 2.87, 0.5)], [P(0.5, 2.87, 0.5), P(0.5, 2.87, -0.5)]] },
          { text: "The blades: four rods in an X on the front hub", rods: [[P(0.5, 2.87, -0.5), P(1.5, 3.87, -0.5)], [P(0.5, 2.87, -0.5), P(-0.5, 3.87, -0.5)], [P(0.5, 2.87, -0.5), P(1.5, 1.87, -0.5)], [P(0.5, 2.87, -0.5), P(-0.5, 1.87, -0.5)]] },
        ],
        text: "Your first MACHINE — it has a frame (the tower) and a moving part (the rotor). On the real build, put the blades on a single connector so they spin free. Blow on it. You just built what powers whole countries.",
      }),
      knexPhoto("Windmill photo", "Bonus: catch the blades mid-spin!"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What makes the rotor different from every other part you've built so far?"),
    ],
    criteria: [
      photoCriterion(0, "Windmill photo", "The completed windmill with rotor — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on frames and moving parts."),
    ],
  });

  const k7 = await projectModule({
    topic: KNEX,
    title: "The Ferris Wheel",
    summary: "Wheels, axles, and spokes that share the load.",
    badgeName: "Wheel Wright",
    badgeIcon: "🎡",
    badgeDescription: "Built a ferris wheel with hexagonal wheels, an axle, and A-frame stands.",
    blocks: [
      block("heading", { text: "Build the ferris wheel" }),
      knex({
        kind: "build",
        minutes: 14,
        builds: [
          { text: "Two A-frame stands + the axle between them", rods: [[P(1, 0, 0), P(0, 1.2, 0)], [P(-1, 0, 0), P(0, 1.2, 0)], [P(1, 0, 1), P(0, 1.2, 1)], [P(-1, 0, 1), P(0, 1.2, 1)], [P(0, 1.2, 0), P(0, 1.2, 1)]] },
          { text: "Wheel one: six spokes from the axle, six rim rods around", rods: [...hexAt(1.2, 0).map((v) => [P(0, 1.2, 0), v]), ...loop(hexAt(1.2, 0))] },
          { text: "Wheel two: the same at the other end of the axle", rods: [...hexAt(1.2, 1).map((v) => [P(0, 1.2, 1), v]), ...loop(hexAt(1.2, 1))] },
          { text: "Cabin bars: six rods joining rim to rim — that's where the seats hang", rods: hexAt(1.2, 0).map((v, i) => [v, hexAt(1.2, 1)[i]]) },
        ],
        text: "A wheel is just a polygon with lots of spokes — yours has six, a bike has 36, but it's the same idea: every spoke shares the load. On the real build, let the wheel spin on the axle and give it a push. Symmetry is what makes it turn smooth.",
      }),
      knexPhoto("Ferris wheel photo", "Bonus: hang tiny riders (paper clips) from the cabin bars!"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Why do more spokes make a wheel stronger?"),
    ],
    criteria: [
      photoCriterion(0, "Ferris wheel photo", "The completed ferris wheel — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on wheels and load sharing."),
    ],
  });

  const k8 = await projectModule({
    topic: KNEX,
    title: "The Rocket",
    summary: "Wide base, low center of gravity — why rockets don't tip.",
    badgeName: "Rocket Builder",
    badgeIcon: "🚀",
    badgeDescription: "Built a stable rocket and tested how fins and a wide base prevent tipping.",
    blocks: [
      block("heading", { text: "Build the rocket" }),
      knex({
        kind: "build",
        minutes: 8,
        builds: [
          { text: "Body stage one: square, uprights, square", rods: [...sq(0, 0, 0), ...lift(corners(0, 0, 0), 0, 1), ...sq(0, 0, 1)] },
          { text: "Body stage two: keep stacking", rods: [...lift(corners(0, 0, 0), 1, 2), ...sq(0, 0, 2)] },
          { text: "Nose cone: four rods meeting at the tip", rods: [[P(0, 2, 0), P(0.5, 2.87, 0.5)], [P(1, 2, 0), P(0.5, 2.87, 0.5)], [P(1, 2, 1), P(0.5, 2.87, 0.5)], [P(0, 2, 1), P(0.5, 2.87, 0.5)]] },
          { text: "Landing fins: four rods angling from outside the base up to the first story", rods: [[P(-0.5, 0, -0.5), P(0, 1, 0)], [P(1.5, 0, -0.5), P(1, 1, 0)], [P(1.5, 0, 1.5), P(1, 1, 1)], [P(-0.5, 0, 1.5), P(0, 1, 1)]] },
        ],
        text: "Why don't rockets tip over on the pad? A WIDE BASE. Your fins spread the footprint and guard the center of gravity. Test it: nudge the top of your rocket. Then remove the fins and nudge again.",
      }),
      knexPhoto("Rocket photo", "Caption: fins on or fins off — which survived the nudge test?"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What did the nudge test show about the fins?"),
    ],
    criteria: [
      photoCriterion(0, "Rocket photo", "The completed rocket with landing fins — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on stability."),
    ],
  });

  const k9 = await projectModule({
    topic: KNEX,
    title: "The Catapult",
    summary: "A lever, a fulcrum, and stored energy — ancient engineering.",
    badgeName: "Siege Engineer",
    badgeIcon: "🏰",
    badgeDescription: "Built a working lever-based catapult and connected it to the six simple machines.",
    blocks: [
      block("heading", { text: "Build the catapult" }),
      knex({
        kind: "build",
        minutes: 10,
        builds: [
          { text: "Base frame: two long rails + two short ends", rods: loop([P(0, 0, 0), P(2, 0, 0), P(2, 0, 1), P(0, 0, 1)]) },
          { text: "Two triangles rising from the rails — peaks in the middle", rods: [[P(0, 0, 0), P(1, 0.87, 0)], [P(2, 0, 0), P(1, 0.87, 0)], [P(0, 0, 1), P(1, 0.87, 1)], [P(2, 0, 1), P(1, 0.87, 1)]] },
          { text: "The axle: two short rods meeting at a center connector between the peaks", rods: [[P(1, 0.87, 0), P(1, 0.87, 0.5)], [P(1, 0.87, 0.5), P(1, 0.87, 1)]] },
          { text: "The throwing arm: two rods through the axle — bucket end high, handle end resting low", rods: [[P(1, 0.87, 0.5), P(2.2, 1.74, 0.5)], [P(1, 0.87, 0.5), P(-0.2, 0, 0.5)]] },
        ],
        text: "This is a LEVER — one of the six ancient machines. The axle is the fulcrum; a short push down on the long end becomes a fast flick at the bucket end. On the real build let the arm pivot, tape a bottle cap on as the bucket, and launch something soft. Measure your record.",
      }),
      knexPhoto("Catapult photo", "Caption: your longest launch in centimeters."),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What made your launches go farther — and what's the fulcrum on your build?"),
    ],
    criteria: [
      photoCriterion(0, "Catapult photo", "The completed catapult — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on levers."),
    ],
  });

  const k10 = await projectModule({
    topic: KNEX,
    title: "The Sky Crane",
    summary: "Cantilevers and tension: the grand finale on every skyline.",
    badgeName: "Crane Operator",
    badgeIcon: "🏗️",
    badgeDescription: "Built a tower crane with a cantilevered jib held by tension ties — the capstone K'NEX build.",
    blocks: [
      block("heading", { text: "Build the sky crane" }),
      knex({
        kind: "build",
        minutes: 14,
        builds: [
          { text: "Tower story one: square, uprights, square, one diagonal", rods: [...sq(0, 0, 0), ...lift(corners(0, 0, 0), 0, 1), ...sq(0, 0, 1), [P(0, 0, 0), P(1, 1, 0)]] },
          { text: "Stories two and three — alternate the diagonals as you go", rods: [...lift(corners(0, 0, 0), 1, 2), ...sq(0, 0, 2), [P(1, 1, 0), P(0, 2, 0)], ...lift(corners(0, 0, 0), 2, 3), ...sq(0, 0, 3), [P(0, 2, 0), P(1, 3, 0)]] },
          { text: "The jib: two rails reaching out front + a short counterjib out back, tied with cross rods", rods: [...chain([P(1, 3, 0), P(2, 3, 0), P(3, 3, 0)]), ...chain([P(1, 3, 1), P(2, 3, 1), P(3, 3, 1)]), [P(2, 3, 0), P(2, 3, 1)], [P(3, 3, 0), P(3, 3, 1)], [P(0, 3, 0), P(-1, 3, 0)], [P(0, 3, 1), P(-1, 3, 1)], [P(-1, 3, 0), P(-1, 3, 1)]] },
          { text: "Mast peak + tie rods — long rods hold the jib up like cables", rods: [[P(0, 3, 0), P(0.5, 3.87, 0.5)], [P(1, 3, 0), P(0.5, 3.87, 0.5)], [P(1, 3, 1), P(0.5, 3.87, 0.5)], [P(0, 3, 1), P(0.5, 3.87, 0.5)], [P(0.5, 3.87, 0.5), P(3, 3, 0)], [P(0.5, 3.87, 0.5), P(3, 3, 1)], [P(0.5, 3.87, 0.5), P(-1, 3, 0)], [P(0.5, 3.87, 0.5), P(-1, 3, 1)]] },
        ],
        text: "The jib sticks WAY out with nothing under it — that's a cantilever. It doesn't fall because the tie rods PULL back against the counterjib, like a see-saw frozen in balance. Every tower crane on every skyline works exactly like the one in your hands. Hang a small weight from the jib tip and find the crane's limit.",
      }),
      knexPhoto("Crane photo", "Bonus: mid-lift, with something hanging from the jib!"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Which build would you make BIGGER with a thousand pieces — and what would keep it from collapsing?"),
    ],
    criteria: [
      photoCriterion(0, "Crane photo", "The completed tower crane — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on cantilevers and tension."),
    ],
  });

  // --- Creatures: flat rod-drawings and 3D animals, inspired by the classic
  // K'NEX Imagine "Creatures" models (our own simplified geometry). Flat
  // builds sit at y=0.1 — kids build them lying on the table, like the manual.
  const FLAT = 0.1;
  const F = (x, z) => P(x, FLAT, z);

  const k11 = await projectModule({
    topic: KNEX,
    title: "The Fox Face",
    summary: "Your first creature: a fox face drawn entirely with rods, flat on the table.",
    badgeName: "Shape Shifter",
    badgeIcon: "🦊",
    badgeDescription: "Drew a recognizable creature face using only straight rods and angles.",
    blocks: [
      block("heading", { text: "Draw with rods" }),
      block("text", {
        kind: "learn",
        minutes: 2,
        text: "New kind of build: a FLAT one. You're not building up — you're drawing a picture on the table using rods as lines. Artists call this a wireframe. Every video game character starts life exactly this way.",
        tip: "Flat builds are quick — nail this fox, then try inventing your own animal face after.",
      }),
      knex({
        kind: "build",
        minutes: 6,
        builds: [
          { text: "The brow: three rods straight across the top", rods: [[F(0, 4), F(1, 4)], [F(1, 4), F(3, 4)], [F(3, 4), F(4, 4)]] },
          { text: "Ears: a rod up and a diagonal back down, each side", rods: [[F(0, 4), F(0, 5)], [F(0, 5), F(1, 4)], [F(4, 4), F(4, 5)], [F(4, 5), F(3, 4)]] },
          { text: "Cheeks: down each side, then diagonals toward the chin", rods: [[F(0, 4), F(0, 3)], [F(0, 3), F(1, 2)], [F(4, 4), F(4, 3)], [F(4, 3), F(3, 2)]] },
          { text: "The snout: two diagonals meeting at the nose, plus the muzzle bar", rods: [[F(1, 2), F(2, 1)], [F(3, 2), F(2, 1)], [F(1, 2), F(3, 2)]] },
        ],
        text: "Fourteen rods and suddenly it's a fox. Notice what your brain just did — it filled in the fur, the eyes, everything. Good design gives the eye just enough lines and lets imagination do the rest.",
      }),
      knexPhoto("Fox face photo", "Caption: what did YOU add to yours?"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What's the fewest lines you think you'd need to draw a different animal — and which animal?"),
    ],
    criteria: [
      photoCriterion(0, "Fox face photo", "The flat fox-face rod drawing — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on drawing with lines."),
    ],
  });

  const k12 = await projectModule({
    topic: KNEX,
    title: "The Butterfly",
    summary: "Two mirror-image wings — build one side, then flip everything for the other.",
    badgeName: "Wing Maker",
    badgeIcon: "🦋",
    badgeDescription: "Built a symmetric butterfly and used mirror symmetry like a designer.",
    blocks: [
      block("heading", { text: "Build the butterfly" }),
      knex({
        kind: "build",
        minutes: 8,
        builds: [
          { text: "The body: three rods in a line up the middle", rods: [[F(0, 0), F(0, 1)], [F(0, 1), F(0, 2)], [F(0, 2), F(0, 3)]] },
          { text: "Antennae: two diagonals from the head, spreading apart", rods: [[F(0, 3), F(1, 4)], [F(0, 3), F(-1, 4)]] },
          { text: "Right wings: a big diamond up top, a twin diamond below — they share a corner", rods: [[F(0, 2), F(1, 3)], [F(1, 3), F(2, 2)], [F(2, 2), F(1, 1)], [F(1, 1), F(0, 2)], [F(0, 0), F(1, 1)], [F(1, 1), F(2, 0)], [F(2, 0), F(1, -1)], [F(1, -1), F(0, 0)]] },
          { text: "Left wings: the exact same diamonds, MIRRORED", rods: [[F(0, 2), F(-1, 3)], [F(-1, 3), F(-2, 2)], [F(-2, 2), F(-1, 1)], [F(-1, 1), F(0, 2)], [F(0, 0), F(-1, 1)], [F(-1, 1), F(-2, 0)], [F(-2, 0), F(-1, -1)], [F(-1, -1), F(0, 0)]] },
        ],
        text: "Cover one half with your hand — the other half is its perfect reflection. That's MIRROR SYMMETRY, and nature is obsessed with it: butterflies, faces, airplanes. When you built the left side, your hands already knew what to do. That's why.",
      }),
      knexPhoto("Butterfly photo", "Caption: is anything on yours NOT symmetric?"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Why do you think airplanes have to be symmetric like your butterfly?"),
    ],
    criteria: [
      photoCriterion(0, "Butterfly photo", "The symmetric butterfly — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on symmetry."),
    ],
  });

  const k13 = await projectModule({
    topic: KNEX,
    title: "The Cat",
    summary: "A sitting cat in outline — the biggest rod drawing yet, with a whisker star.",
    badgeName: "Line Artist",
    badgeIcon: "🐱",
    badgeDescription: "Composed a full creature outline from head to tail using rods as lines.",
    blocks: [
      block("heading", { text: "Build the cat" }),
      knex({
        kind: "build",
        minutes: 10,
        builds: [
          { text: "The head: an outline of eight rods, two ears on top", rods: [[F(0, 4), F(1, 4)], [F(1, 4), F(2, 4)], [F(2, 4), F(2, 5)], [F(2, 5), F(2, 6)], [F(2, 6), F(1, 6)], [F(1, 6), F(0, 6)], [F(0, 6), F(0, 5)], [F(0, 5), F(0, 4)], [F(0, 6), F(0, 7)], [F(0, 7), F(1, 6)], [F(2, 6), F(2, 7)], [F(2, 7), F(1, 6)]] },
          { text: "The whisker star: four diagonals from the center of the face to its corners", rods: [[F(1, 5), F(0, 4)], [F(1, 5), F(2, 4)], [F(1, 5), F(0, 6)], [F(1, 5), F(2, 6)]] },
          { text: "The body: chest down the front, base along the bottom, back up behind", rods: [[F(0, 4), F(0, 3)], [F(0, 3), F(0, 2)], [F(0, 2), F(0, 1)], [F(0, 1), F(0, 0)], [F(0, 0), F(1, 0)], [F(1, 0), F(2, 0)], [F(2, 0), F(3, 0)], [F(3, 0), F(3, 1)], [F(3, 1), F(3, 2)], [F(3, 2), F(3, 3)], [F(3, 3), F(2, 4)]] },
          { text: "Front leg + tail: an inner leg line, and a tail sweeping out the back", rods: [[F(1, 0), F(1, 1)], [F(1, 1), F(1, 2)], [F(3, 0), F(4, 0)], [F(4, 0), F(5, 1)]] },
        ],
        text: "Thirty-one rods, one very dignified cat. The haunch — that single diagonal from the back up to the head — is what makes it read as 'sitting'. One line changed the whole pose. Try removing it and see.",
      }),
      knexPhoto("Cat photo", "Caption: what one line would you change about the pose?"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Which single rod matters most to the cat's pose, and why?"),
    ],
    criteria: [
      photoCriterion(0, "Cat photo", "The sitting-cat rod outline — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on outlines and poses."),
    ],
  });

  const k14 = await projectModule({
    topic: KNEX,
    title: "The Spider",
    summary: "Eight legs, all alike: radial symmetry holds the body off the ground.",
    badgeName: "Leg Engineer",
    badgeIcon: "🕷️",
    badgeDescription: "Built a spider whose eight identical bent legs suspend the body — radial symmetry as structure.",
    blocks: [
      block("heading", { text: "Build the spider" }),
      knex({
        kind: "build",
        minutes: 10,
        builds: [
          { text: "The body: head, thorax, abdomen — a line of two rods floating at leg height", rods: [[P(-1, 0.7, 0), P(0, 0.7, 0)], [P(0, 0.7, 0), P(1, 0.7, 0)]] },
          { text: "Fangs: two short diagonals from the head, down and apart", rods: [[P(-1, 0.7, 0), P(-1.6, 0.1, 0.4)], [P(-1, 0.7, 0), P(-1.6, 0.1, -0.4)]] },
          { text: "Right legs: four legs from the thorax — each arches UP to a knee, then DOWN to a foot", rods: [[P(0, 0.7, 0), P(0.8, 1.1, 0.8)], [P(0.8, 1.1, 0.8), P(1.5, 0, 1.5)], [P(0, 0.7, 0), P(0.3, 1.1, 1)], [P(0.3, 1.1, 1), P(0.5, 0, 1.9)], [P(0, 0.7, 0), P(-0.3, 1.1, 1)], [P(-0.3, 1.1, 1), P(-0.5, 0, 1.9)], [P(0, 0.7, 0), P(-0.8, 1.1, 0.8)], [P(-0.8, 1.1, 0.8), P(-1.5, 0, 1.5)]] },
          { text: "Left legs: the same four, mirrored to the other side", rods: [[P(0, 0.7, 0), P(0.8, 1.1, -0.8)], [P(0.8, 1.1, -0.8), P(1.5, 0, -1.5)], [P(0, 0.7, 0), P(0.3, 1.1, -1)], [P(0.3, 1.1, -1), P(0.5, 0, -1.9)], [P(0, 0.7, 0), P(-0.3, 1.1, -1)], [P(-0.3, 1.1, -1), P(-0.5, 0, -1.9)], [P(0, 0.7, 0), P(-0.8, 1.1, -0.8)], [P(-0.8, 1.1, -0.8), P(-1.5, 0, -1.5)]] },
        ],
        text: "Spin it around: the body never touches the ground — eight bent legs hold it up, each one a tiny arch. One leg is weak. Eight identical legs sharing the load? That's a structure. Same trick as the ferris wheel's spokes, wearing a costume.",
      }),
      knexPhoto("Spider photo", "Bonus: perch it somewhere that'll surprise someone."),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("How is the spider's leg trick like the ferris wheel's spokes?"),
    ],
    criteria: [
      photoCriterion(0, "Spider photo", "The eight-legged spider — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on radial symmetry."),
    ],
  });

  const k15 = await projectModule({
    topic: KNEX,
    title: "The Giraffe",
    summary: "Four legs, a long neck, and a balance problem to solve.",
    badgeName: "Neck Architect",
    badgeIcon: "🦒",
    badgeDescription: "Built a standing giraffe and reasoned about balance when weight reaches up and out.",
    blocks: [
      block("heading", { text: "Build the giraffe" }),
      knex({
        kind: "build",
        minutes: 10,
        builds: [
          { text: "Four long legs standing at the corners, joined by the body frame", rods: [[P(0, 0, 0), P(0, 2, 0)], [P(0, 0, 1), P(0, 2, 1)], [P(2, 0, 0), P(2, 2, 0)], [P(2, 0, 1), P(2, 2, 1)], [P(0, 2, 0), P(2, 2, 0)], [P(0, 2, 1), P(2, 2, 1)], [P(0, 2, 0), P(0, 2, 1)], [P(2, 2, 0), P(2, 2, 1)]] },
          { text: "The neck: two rods from the shoulders meeting, then one more reaching higher", rods: [[P(0, 2, 0), P(-0.5, 3, 0.5)], [P(0, 2, 1), P(-0.5, 3, 0.5)], [P(-0.5, 3, 0.5), P(-1, 4, 0.5)]] },
          { text: "The head: one rod forward — and a tail diagonal out the back", rods: [[P(-1, 4, 0.5), P(-1.7, 4, 0.5)], [P(2, 2, 0.5), P(2.7, 1.3, 0.5)]] },
        ],
        text: "The neck leans FORWARD, past the front legs — so why doesn't it tip? Look where the legs are: the body and tail hang back, balancing the neck like a see-saw. Real giraffes solve this exact problem. So did your sky crane. Test it: how far can you lean the neck before it wants to fall?",
      }),
      knexPhoto("Giraffe photo", "Caption: how far past the front legs does the head reach?"),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What did the giraffe borrow from the sky crane?"),
    ],
    criteria: [
      photoCriterion(0, "Giraffe photo", "The standing giraffe with its long neck — real K'NEX or the finished 3D model."),
      wrapUpCriterion(1, "Written reflection on balance."),
    ],
  });

  return [k1, k2, k3, k4, k5, k6, k7, k8, k9, k10, k11, k12, k13, k14, k15];
}
