# Letter Leaper 3D — local prototype

A ten-leap, one-environment (jungle) 3D preview of Letter Leaper at
`/play/letter-leaper-3d`. It is a **local preview for review**: it is not linked
from any page, is marked `noindex`, saves nothing, and sends no events anywhere.
The existing game (`/play/typing`, `/play/letter-leaper`) is unchanged.

## How it fits together

| Concern | Where | Notes |
| --- | --- | --- |
| Rules | `public/games/letter-leaper/core.js` (unchanged) via `lib/leaper3d/core.ts` | The deployed rules engine's source runs in a function scope, so each mount gets its own instance that is disposed on unmount. No second copy of the rules; the 100/150 milestones are untouched. |
| Ten-leap session | `lib/leaper3d/preview.ts` | Start, pause, hidden-tab pause, restart, and the goal. The run ends right after the tenth landing (an `exited` end event), before more typing time can accrue. |
| Input | `lib/leaper3d/input.ts` | Same rules as the 2D `ui.js`: form controls are never read; shortcuts, IME composition, held-key repeats, non-letters and keys pressed mid-leap are ignored. Escape pauses. |
| Tracking | `lib/leaper3d/tracking.ts` | `TrackingAdapter` over the same event contract (`core.js` hooks). Only a `preview` adapter exists: in-memory, no network code. |
| Rendering | `app/play/letter-leaper-3d/Scene.tsx` | React Three Fiber + Drei, loaded client-only. Reads the engine each frame; never changes game state. |
| Animation | `Scene.tsx` (`createAnimator`, `Milo`) | GLB clips with cross-fades; the leap arc is a controlled trajectory driven by `core.jumpProgress()` (no physics). |
| HTML UI | `app/play/letter-leaper-3d/Leaper3D.tsx` | Prompt, progress, accuracy, status, controls, on-screen keys, loading / asset-error / no-WebGL states. |
| Sound | `lib/leaper3d/sound.ts` | Off by default; synthesized tones, AudioContext created only when the player turns sound on. |

Typing time is `core.js`'s own active clock: it runs only while input is
accepted, and excludes leaps, celebration, pauses, loading and hidden tabs.

## Controls

- Type the letter on the card (or tap it on the on-screen keys) → one leap.
- **Esc** or **Pause** pauses; switching tabs pauses automatically.
- **Restart**, **Sound on/off**, **Calm motion** (shorter leaps, no bobbing; forced on when the
  device asks for reduced motion), **Lower effects** (no shadows, DPR 1, fewer particles;
  also switched on automatically if the frame rate drops).
- Development only: `?inspect=1` shows the event inspector (removed from production builds).

## Assets and licences

| Asset | Source | Licence |
| --- | --- | --- |
| `public/games/letter-leaper-3d/milo.glb` | Original, modelled in code by `scripts/build-leaper-3d-assets.mjs` | Project-owned |
| `public/games/letter-leaper-3d/islands.glb` | Same script | Project-owned |
| `public/games/letter-leaper-3d/scenery.glb` | Same script | Project-owned |
| Sounds | Synthesized at runtime (`lib/leaper3d/sound.ts`) | Project-owned |
| three 0.185.1 (already a dependency) | npm | MIT |
| @react-three/fiber 9.8.1, @react-three/drei 10.7.9 | npm | MIT |

Drei's transitive packages are MIT, apart from Apache-2.0 (`@mediapipe/tasks-vision`, `draco3d`,
`hls.js`, `promise-worker-transferable`), BSD-3-Clause (`ieee754`) and ISC (`potpack`), all
permissive. No downloaded models, textures, fonts or audio files are used, and nothing was purchased.

Rebuild the models with `npm run assets:leaper3d`. The output is seeded and byte-identical between runs.

## Provisional art and known limitations

- **All 3D art is provisional.** Milo is a code-modelled, low-poly character with a node
  hierarchy (hips, limbs, head, seven-joint tail) and node-animation clips: Idle (breathing and
  blinking), Anticipate, Air, Land, Celebrate and Oops. It is not a skinned mesh made by a
  character artist. A replacement `milo.glb` works if it keeps those clip names.
- One environment only (jungle). The other five environments are out of scope.
- The 3D preview runs ten leaps; it does not include the 100 and 150 climbs, words, or saved progress.
- R3F 9.8.1 logs a `THREE.Clock` deprecation warning with three 0.185 (library-internal, harmless).
- The route's JavaScript (three.js, R3F, Drei and the scene) is about 350 KB gzipped, plus 1.9 MB
  of GLB files (about 0.4 MB gzipped). Both load only on this route.
- Performance was measured only on an Apple M4 laptop in headless Chrome (see the PR or review
  notes). It has **not** been tested on a Chromebook or a real phone.
