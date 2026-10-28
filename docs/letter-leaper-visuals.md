# Letter Leaper visuals (Phaser scene — now the fallback)

> Since October 2026 the default scene is the three.js renderer
> (`scene-3d.js`, see `docs/letter-leaper-3d.md`). This Phaser scene is the
> automatic fallback when the 3D scene can't start, and `?renderer=phaser`
> still selects it.

Letter Leaper's Phaser scene is drawn with Phaser 4. The rules, the HTML
interface, and classroom tracking are separate from it, so visual changes
don't touch analytics.

## Structure (`public/games/letter-leaper/`)

| File | Role |
|---|---|
| `core.js` | The only game rules: targets, letter and word boundaries, timers, streak and accuracy, scopes, pause/moon/finish states, the active-time clock, and the tracking hooks. No DOM, no drawing. It emits view events and exposes read-only state. |
| `ui.js` | Ordinary, accessible HTML around the game: stats bar, prompt, on-screen keyboard, intro form, pause/moon/finish dialogs, and the sound and calm-motion toggles (remembered per device). It also handles keyboard capture, the classroom integration (`window.leaper`, tracker and leaderboard loading), and loading a renderer. |
| `scene-phaser.js` | Phaser renderer: camera, layered environments, platforms, the target sign, particles, and sound. |
| `milo.js` | Milo's layered character rig and animations. |
| `art.js` | Asset definitions: environment palettes and layer recipes, platform styles, celestial bodies, Milo's parts, and sound recipes. |
| `scene-classic.js` | The previous DOM renderer. Used for comparison (`?renderer=classic`) and automatically if WebGL isn't available, or neither canvas scene starts. |
| `tracker.js`, `leaderboard.js` | Classroom tracking and the legacy leaderboard. Unchanged apart from reading the new renderer-tagged game version. |
| `vendor/` | Phaser 4.2.1 (`phaser.min.js`) and its MIT licence. Refresh it with `npm run vendor:phaser`. |

Renderers only follow `core.js` events and read its state; they can't change
rules, clocks, or events. `tests/letter-leaper-core.test.mjs` runs the rules in
Node with a fake clock.

## Analytics guarantees

- **Event contract unchanged** (measurement version 1). The same hooks fire in
  the same order, and one accepted input produces one `key` event.
- **Session identity, deduplication, offline queues, resume, and shared-device
  isolation** are untouched (`tracker.js` is unchanged).
- **Typing time counts only while the game accepts answers.** These are
  excluded:
  - the jump (still 410 ms, or 80 ms in calm mode), which contains Milo's
    anticipation, takeoff, flight, and landing
  - pauses and hidden-tab time
  - the moon celebration, which happens during the moon pause
  - the star celebration, which happens after the session ends

  Milo's settle after landing and the environment transitions never block
  input.
- **Game version:** `gameVersion` is now `2026.10.2-phaser` or
  `2026.10.2-classic`, so sessions show which renderer was used.
- **Stage events:** stage IDs are the backend's six names. The environment
  boundaries moved to every 20 leaps, so `stage` events now fire at 20, 40, 60,
  80, and 100 (previously 20, 40, 65, 100, and 125). Stage events aren't used
  in any metric.

| Leaps | Environment | Stage ID |
|---|---|---|
| 1–20 | Jungle canopy | `jungle` |
| 21–40 | Misty mountains | `mountains` |
| 41–60 | Cloud peaks | `clouds` |
| 61–80 | High atmosphere (sunset, Earth below) | `atmosphere` |
| 81–100 | Near space; lands on the moon at 100 | `moon` |
| 101–150 | Moon to the stars; finishes on a star at 150 | `stars` |

## Visual system

- **Milo:** a layered rig (legs, body, arms, head, ears, eyes with pupils and
  lids, swappable mouths, a seven-segment tail, and a space helmet from leap
  80).
  - Idle: breathing, blinking, curious glances, and tail sway.
  - Jumps: anticipation, a stretch on takeoff, a tuck in the air with the tail
    trailing, then a squash on landing and a settle.
  - Reactions: a nod for a correct letter, a "hmm" head-scratch for a mistake,
    and a shrug for a timeout. There's never a flinch or a red flash.
  - Celebrations: three hops and a planted flag on the moon; floating with
    arms wide on the star.
- **Environments:** a sky gradient with keyframes over altitude, plus each
  environment's parallax layers (horizons, tiling fields, edge foliage) with
  restrained drift.
  - Environments cross-fade over the 20-leap boundaries.
  - The sun, Earth (receding with altitude), the moon (overhead, then below),
    and the destination star follow the climb.
  - Ambient particles are sparse (at most 12 per environment).
- **Target sign:** a cream sign with dark ink (contrast ≥ 4.5:1).
  - Completed letters are green, the current letter is dark and underlined,
    and the remaining letters are muted.
  - Medium and hard show a countdown bar.
  - The HTML prompt below the scene repeats the target.
- **Letter case:** students choose "Uppercase · ABC" or "Lowercase · abc" in
  the start form. The choice is remembered per device and applies to the sign,
  the prompt, the on-screen keys, hints, row names, and the moon card. It's
  display-only: typing is case-insensitive either way, so it doesn't affect
  measurement and isn't recorded. Teachers can't lock it yet; that would need
  a classroom setting.
- **Sound:** off by default and remembered. Sounds start only after user
  interaction (Phaser unlocks audio on the first gesture). They're soft
  synthesized tones for correct letters, takeoff, landing, mistakes, timeouts,
  and both milestones.
- **Calm mode:** follows the OS reduced-motion setting, or the in-game ≈
  toggle.
  - Calm mode keeps: blinking and breathing, the reactions, and the milestone
    cards.
  - Calm mode drops: ambient particles, landing dust, drift, camera follow
    (the camera moves at landing instead), squash and stretch, celebration
    zoom, sparkles, and the card delays.
  - Parallax is halved.
  - There are no flashing effects and no screen shake.
- **Mobile:** on narrow screens the intro form flows in the page, and Milo
  waits in a strip reserved below it, so nothing overlaps. The scene, HUD, and
  on-screen keyboard fit at 390 px with no horizontal scroll.
- **Milestones:** the moon card sits low in the scene with no blur, and the
  finish card fades in after the star celebration. In both, the button
  continues and skips the celebration. Calm mode shows them immediately.

## Budgets and measured results

All measurements were taken with headless Chrome on the development machine,
during real play with key presses. CPU throttling slows the CPU but not the
GPU, so these numbers prove CPU headroom, not weak-GPU performance. The
renderer drops to 1× resolution and turns off ambient particles by itself if
frames average over 26 ms.

| Budget | Target | Measured |
|---|---|---|
| Frame time, laptop profile (1440×900 @2×) | p95 ≤ 16.7 ms | median 16.7, p95 16.7, p99 16.8 ms; 0.1% of frames > 33 ms |
| Frame time, Chromebook proxy (1366×768 @1×, CPU ÷4) | p95 ≤ 33 ms | median 16.7, p95 16.7, p99 16.8 ms; 0% > 33 ms |
| Frame time, Chromebook proxy (1366×768 @1.25×, CPU ÷6) | p95 ≤ 33 ms | median 16.7, p95 16.7, p99 16.8 ms; 0% > 33 ms |
| Worst frame across a full 150-leap journey (CPU ÷4) | < 100 ms | 50 ms, once (closing the moon dialog); otherwise ≤ 16.8 ms |
| Texture memory (generated textures) | ≤ 40 MB peak | 16.7 MB peak; environments load 5 leaps ahead and unload behind |
| Live particles | ≤ 40 | 38 peak (the star celebration) |
| Scene ready after page load | ≤ 1.5 s | 0.3–0.6 s locally |
| Download | — | Phaser 1.38 MB (355 KB gzip) + game scripts 89 KB (27 KB gzip). **No image downloads**: the Phaser scene doesn't load the classic scene's 4.7 MB of PNG backgrounds. |

## Assets and licences

| Asset | Source | Licence |
|---|---|---|
| Phaser 4.2.1 | npm `phaser` (phaser.io) | MIT, © Richard Davey, Phaser Studio Inc. (`vendor/PHASER-LICENSE.md`) |
| Milo, environments, platforms, bodies, particles | Original, generated procedurally by `art.js` for Laingify | Project-owned. **Provisional artwork.** |
| Sound effects | Original, synthesized by `art.js` (`Art.synth`) | Project-owned. **Provisional.** |
| DM Sans, Space Grotesk (UI and sign text) | Google Fonts (already used by the game) | SIL Open Font License 1.1 |
| `jungle.png`, `terrains.png` | Unchanged from the original game; only the classic renderer uses them | As before |

**Replacing the provisional art.** Renderers request textures by key with a
logical size (`Art.canvasFor` and `Art.sizeOf`). Final illustrations can
replace any key with an image of the same proportions, loaded through Phaser's
loader, without changing the rig, the scene, or the rules.

## Known limitations

- Performance was measured in headless Chrome. It hasn't been checked on a
  physical Chromebook GPU.
- On first load, the art is generated on the main thread: about 14 MB of
  canvases, and each later environment is built 5 leaps ahead. That causes the
  one ~50 ms frame noted above.
- Phaser's sound manager creates an audio context at load. It stays suspended,
  and nothing plays, until a user gesture with sound turned on.
- The artwork is provisional procedural vector art. It's consistent and
  original, but it isn't hand-illustrated.
