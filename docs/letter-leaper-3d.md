# Letter Leaper 3D scene

Letter Leaper's default scene is drawn with three.js
(`public/games/letter-leaper/scene-3d.js`). It replaces only the graphics.
The rules (`core.js`), the HTML around the game (`ui.js`), classroom tracking
(`tracker.js`), the leaderboard and teacher settings are unchanged. That covers
the 100 letter leaps to the moon, the 50 word leaps to the stars, the six
environments, the paces, the practice rows and the letter case.

## How it loads

`ui.js` picks the renderer:

1. **3D (default):** loads `art.js` (used here only for the synthesized sounds),
   then `scene-3d.js` as an ES module. The scene reports `__leaperScene.ready`
   once its models have loaded.
2. **Phaser (`scene-phaser.js`):** used automatically if the 3D scene fails,
   for example a model download error, or isn't ready within 20 s.
   `?renderer=phaser` also selects it.
3. **Classic DOM scene:** used without WebGL, or with `?renderer=classic`.

`gameVersion` names the renderer (`2026.10.2-3d`, `-phaser` or `-classic`),
so sessions show which scene was used.

three.js is copied into `vendor/three/` by `npm run vendor:three`, in the same
way as Phaser. The import map in `index.html` points `three` at it.

## What the scene draws

- **The path:** one floating platform per leap, alternating sides and rising.
  The moon landing (leap 100) and the final star (150) sit on the centre line.
  Only the platforms near Milo exist at any time; the rest are recycled.
- **Environments:** each platform belongs to the environment Milo leaps
  from, as in the 2D scenes. Sky, fog, light and backdrops cross-fade over the
  last two leaps of each band.

  | Leaps | Look |
  |---|---|
  | 0–20 | Jungle islands, side islands with trees, canopy below, rolling hills, fireflies, framing leaves |
  | 20–40 | Snowy rock islands with pines, a mountain range, snowfall |
  | 40–60 | Cloud platforms over a cloud sea, the sun |
  | 60–80 | Glass platforms in a sunset sky with Earth's curve below |
  | 80–100 | Asteroid platforms among stars; Earth shrinks behind and the moon grows ahead. Milo wears a helmet from 80. |
  | 100 | Moon surface with a flag |
  | 100–150 | Crystal platforms in deep space with the moon below; the final star brightens ahead |

- **Milo:** `models/milo.glb` with clips Idle (breathing and blinking),
  Anticipate, Air, Land, Celebrate and Oops, blended with cross-fades.
  - A correct final letter starts Anticipate immediately.
  - The leap follows a controlled arc inside the rules' jump time, with no physics.
  - A miss or timeout plays Oops.
  - The moon and the stars play Celebrate.
- **Target card:** HTML positioned over the next platform. It shows the
  letter or word in the chosen case, with typed letters marked, and a timer
  bar for the steady and speedy paces. It's `aria-hidden`; the keyboard
  panel's prompt stays the accessible one.
- **Framing:** at the intro, Milo stands beside the welcome text; on narrow
  screens he stands at the bottom. During milestones he moves clear of the
  dialogs. On tall, narrow screens the camera pulls back.

## Motion, sound and quality

- **Calm motion** (the in-game toggle, or the device's reduced-motion
  setting) means:
  - short leaps with no arc;
  - a camera that moves only at landings;
  - no bobbing, swaying or particles;
  - instant celebrations.
- **Sound** is off by default. When turned on, the synthesized sounds from
  `art.js` play through Web Audio, created on that click.
- **Quality:**
  - The pixel ratio is capped at 1.75.
  - If the average frame takes over 26 ms for 3 s, the scene switches to
    1× pixels with no shadows or ambient particles (`__leaperScene.quality === 'low'`).

## Assets and licences

| Asset | Source | Licence |
|---|---|---|
| `models/milo.glb`, `models/islands.glb`, `models/scenery.glb` | Original, modelled in code by `scripts/build-leaper-3d-assets.mjs` (`npm run assets:leaper3d`; reproducible) | Project-owned |
| Other environment pieces (clouds, pines, glass, crystals, asteroids, Earth, moon, star) | Built in code at runtime in `scene-3d.js` | Project-owned |
| Sounds | Synthesized (`art.js`) | Project-owned |
| three.js 0.185.1 (`vendor/three/`) | npm `three` | MIT (`vendor/three/LICENSE`) |

All 3D art is **provisional**: original, code-modelled, low-poly artwork. An
artist-made `milo.glb` can replace the current one if it keeps the clip names.
The download is about 0.95 MB of three.js and scene scripts (about 240 KB
compressed) plus 1.9 MB of models (about 0.4 MB compressed).

## Performance

These figures come only from headless Chrome on an Apple M4 laptop (October 2026):
- 60 fps (95th-percentile frame 16.8 ms) in the jungle, clouds and stars.
- The same at 1280×800, at a 390×844 phone size, and at 1366×768 with the
  CPU slowed 4×. That slowdown doesn't slow the GPU.

It has **not** been tested on a Chromebook or a real phone. The automatic quality
drop and the Phaser fallback exist for slower devices.

The earlier React prototype route, `/play/letter-leaper-3d`, now redirects to `/play/typing`.

## Falling platforms (local preview, not in production)

Branch `letter-leaper-falls` adds an opt-in rule set. It's active only with
`?mode=public&falls=1` and the 3D scene, for example at `/play/letter-leaper-3d`
on that branch. Classroom play, its practice settings and the default game
are unchanged.

- **Deadline:** each letter must be typed within 7 seconds of typing time. In
  a word, each letter gets its own 7 seconds.
  - The clock is `core.js`'s active clock, the same one the rules and the
    countdown read (`deadlineLeft()`). It runs only while Milo is ready and
    input is accepted, never while paused, in a hidden tab, or during a leap,
    fall or recovery.
- **Warning:** after 5 seconds the platform wobbles, more strongly over the
  last 2 seconds. The card shows a countdown badge, turning orange and then
  red, with an orange-to-red ring around Milo's platform. A text message
  ("Quick — the platform is wobbling!") means no sound is needed. In calm
  motion there's no wobble: only the outline, ring and countdown.
- **At 7 seconds:** the platform drops with Milo. This is recorded once as a
  `timeout` (not a keystroke). An answer arriving at or after 7 seconds is a
  timeout.
- **Wrong letter:** one incorrect `key` attempt. Milo jumps, falls short and
  drops out of view.
- **During any fall:** further keys are ignored (`busy`), and nothing advances.
- **Recovery:** after 1.5 s (0.7 s in calm motion), Milo is back on a restored
  platform for the same leap with "Try again!" or "A little quicker this time!".
  A fresh target appears and its 7 seconds start then.
- **Tracking:** no new tracking event types. Falls and recoveries are view
  events only, and the preview is public play, so nothing is uploaded.

Tests: `tests/letter-leaper-falls.test.mjs`.
