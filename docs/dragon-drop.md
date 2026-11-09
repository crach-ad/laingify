# Ember Jet: Hangar Escape

Ember Jet is a 3D flight game at `/play/dragon-drop`. Grab the dragon and drag vertically to steer; release to hover. Arrow keys offer an alternative. Pause automatically when leaving the window. Three hits end a flight; cyan shields absorb one collision. Cruise and Rush have separate boards.

## Content

- Hangar 07 from 0m, Reactor Core from 400m, Crystal Caverns from 900m. Lighting, scenery and colour change at each boundary.
- Twelve obstacle patterns include low/high sweeps, vertical gates, rotating beams, paired bars and a crystal passage. Each leaves a safe corridor. Missiles warn for 1.8 seconds before launching at a fixed altitude.
- Nine missions range from 100 metres and 12 coins to 1,500 metres, 60 coins and a 12-coin chain. Each target is achieved within one flight; completed missions persist across class sessions.

## Production

Uses the existing PostgreSQL Prisma client and LearnerEvent model; no schema migration. The signed learner session from the production app determines class and learner identity. Access requires current roster membership and an assigned `Ember Jet: Hangar Escape` module in that class's organization.

API start requests create server-owned run IDs and nickname/mode records. Finish requests validate class scope, ownership, elapsed time, distance/coin limits and recomputed score. Results are idempotent. Rankings retain each learner’s best run by correct skill actions, then accuracy, then flight points, distance and elapsed time. Older flight-only runs remain stored but are excluded from the skill leaderboard. Responses expose nicknames, scores and a `you` flag rather than learner IDs. Results remain client-reported practice scores, not verified competitive assessments.

Pending saves are retained in device storage scoped to the learner/class; a different sign-in cannot submit them. Retry them from the start/result screen. Unfinished flights themselves do not resume after reload.

## Assign classes

```sh
node --env-file=.env prisma/enable-ember-jet.mjs
node --env-file=.env prisma/enable-ember-jet.mjs --apply
```

The first command previews; the second upserts this module and appends missing assignments to exactly the current Letter Leaper classes. It preserves rosters, existing assignments and learner work. Deploy the game before applying assignments. The project opens the game directly; it bypasses the lesson, screenshot and reflection workflow.

## Local prototype

```sh
npm run dragon:setup
npm run dev:dragon
```

The explicit development-only flag uses `/api/dragon-drop/local` and separate SQLite storage. That local API and SQLite files are excluded from the production release snapshot; the public class page has no SQLite dependency.

## Validation

```sh
node --test tests/ember-*.test.mjs tests/dragon-flight.test.mjs
npx tsc --noEmit
```

Tests cover session/roster/module scope, cross-class isolation, server run ownership, idempotent saves, score bounds, mission thresholds, 12 obstacle patterns and 10-minute physics simulations at 30/60/120Hz. Browser checks cover real left clicks, native right-click menus, pointer-captured drag-and-drop, native text selection, repeated-check rejection, partial credit, difficulty progression and desktop/narrow layouts. Legacy physics tests remain as regression coverage for helpers; flight now uses drag steering. Physical touch devices still merit a classroom pilot.

## Release base

Prepared against production commit `86abb0e7692f85836298dd0a37103e67bcb2d749`, preserving newer live changes absent from the working checkout. Production snapshot: `/private/tmp/ember-jet-release`. Do not deploy the older working checkout wholesale.

## Live rollout — 9 November 2026

- Live: https://laingify.vercel.app/play/dragon-drop (requires class sign-in).
- Deployment: `dpl_CdBL7oNe9aCdphd4aCW1aVjBgMo5` / `laingify-q2i68wo5u-crachad-laings-projects.vercel.app`.
- Assigned to the same 20 Letter Leaper classes: 11 Windsor and 9 KCSB.
- Production build and 10 focused tests passed. Live PIN sign-in, class page, start, finish, idempotent retry, leaderboard, scope rejection and revoked-roster rejection were verified with an isolated temporary class; all QA records were removed.
- Rollback deployment if required: `dpl_7TGqvAJBG4Tn8PgL6xn9FfQKMDLA`. Rolling back code also requires hiding Ember Jet assignments to avoid links to a missing route.
- The standalone local SQLite scores are not imported into class leaderboards.

### Direct launch update

Clicking the assigned Ember Jet project now redirects from `/learn/[moduleId]` to `/play/dragon-drop` before lesson progress or evidence is loaded. Existing sign-in and class-assignment checks remain. The game back link returns to `/learn/topic/mouse-skills`.

### Dragon colours

Start-screen choices: Ember (orange), Ocean (blue), Orchid (purple), Mint (green), Rose (pink), Storm (slate). Each recolours the 3D body, head, wings and accents. The idle model previews the selected colour. The choice is remembered on that device and has no effect on scoring or difficulty. Colour selection and persistence were checked in the browser.

The direct-launch update was deployed as `dpl_EUzoJDNmGBLQ518uzHSGw5apySeZ`; a live signed-in project-link test confirmed it redirects to the game without creating lesson progress. Its temporary test records were removed.

Colour-picker production deployment: `dpl_FudiSmp8wSyj61h1FVhXfGXDbd2x` (`laingify-gm1js92f0-crachad-laings-projects.vercel.app`). Includes the direct-project launch fix and six persistent device-local colour choices.

### Mouse-skills update

Live deployment: `dpl_8GkKw3VB8omiVkakKQSHQjASWDoy` (`laingify-dl77wb6zm-crachad-laings-projects.vercel.app`).

The first docking challenge starts immediately; another opens every 60 metres. Choose all four skills or focused practice on the start screen. Each station requires three successful actions and pauses the world without a timer. Mixed practice rotates left click, right click, drag-and-drop and highlighting, increasing difficulty after each full rotation; focused practice increases after each station. There are three levels: smaller click targets, more menu options, smaller drop sockets with decoys, and longer text selections. Skip retains attempts and partial credit. Pausing preserves the current exercise.

Highlighting checks the native selection within the message, clears it after success and requests a new target. Right-click practice requires opening a context menu then choosing its requested action. Touch and keyboard alternatives are counted separately. Results track correct actions, attempts, assisted actions and highest completed level per skill in existing Prisma event records. These practice counters are client reported, not proctored assessments.

17 focused tests and both workspace/release TypeScript checks passed. Production build succeeded. Live isolated sign-in/save/retry/leaderboard tests verified persisted skill totals and levels, scope isolation and revoked roster rejection. QA records were removed. Existing direct launch and six dragon colours remain. Local SQLite still stores flight results only; persistent skill history is available in the class edition.

### Continuous 3D mouse-skills gameplay (supersedes docking stations)

MouseStation is no longer mounted. The Three scene now owns hovering interactable objects, raycast click targets, pointer-captured crystal dragging and world-projected selectable signals. The hangar, hazards, timer and distance keep moving during every skill. A signal holds its own position while selecting for usability; it does not pause the game.

- Left click a gold orb to remove active lasers and missiles.
- Right click a shield drone to activate protection.
- Drag a crystal into the 3D ring and release to charge a shield.
- Highlight the requested words on the floating signal to clear a safe passage.

Each action immediately updates the existing skill report. Three successes per skill advance a level, up to three; targets and drop tolerances shrink and signals request longer phrases. Introductory targets pace the dragon steadily; higher levels move gently. Unused encounters expire after 24 seconds and count as a missed attempt; interacted-with failures are already counted. Focused practice and mixed rotation remain available. Manual/blur pause remains; no activity automatically pauses play. Right-click practice requires a mouse/trackpad context click.

Browser verification completed all four real gestures in a single uninterrupted flight: distance advanced from 75m at the orb reward to 337m at the decoded signal. Each reward and skill count appeared in the HUD. TypeScript and 14 focused rules/API tests passed. The production candidate includes the existing class-access and Prisma persistence implementation.

Continuous gameplay release: `dpl_2DaZgyWr5aRKMvB2krPTKs5drKM4` / `laingify-2up81iu1r-crachad-laings-projects.vercel.app`. Production build and type checking passed.
