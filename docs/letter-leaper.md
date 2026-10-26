# Letter Leaper for Windsor

The `Keyboard Skills` module opens `/play/letter-leaper` in a new tab, then
collects a progress screenshot and a written reflection through the existing
Laingify tutorial and portfolio flow. The game has 100 letter leaps to the moon
and 50 word leaps to the stars, across six terrains.

## Source and hosting

The game assets in `public/games/letter-leaper` were imported from the local
standalone Letter Leaper project's `public` directory. They include its later
username and leaderboard UI. Laingify serves its own copy; students do not need
access to the private ChatGPT Site. The standalone project is unchanged.

`leaderboard.js` calls `/api/letter-leaper` instead of the standalone Worker.
The API uses the current Laingify session, verifies current class roster and
module assignment, and scopes profiles and scores to that class. Nicknames and
completed runs use the existing `LearnerEvent` model (`leaper_profile` and
`leaper_score`); no schema migration is needed. Runs are idempotent by class,
learner, and run ID. Best runs rank by accuracy, streak, then elapsed time.
These are client-reported practice results, not proctored assessments. The
existing Laingify cookie-session trust model applies.

A completed climb saves to the class leaderboard; module completion still uses
screenshot evidence and the reflection, allowing Pam to accept a younger
learner's partial progress.

Per-session typing progress (including partial climbs), the teacher dashboard,
and PIN sign-in for recording it are described in `docs/letter-leaper-progress.md`.
Windsor's open, name-only classes play as before but aren't recorded until PIN
sign-in is turned on for the class.

## Enable safely

Deploy the route and assets before assigning the module in the live database.
Inspect first:

```sh
node --env-file=.env prisma/enable-letter-leaper-windsor.mjs
```

Apply the targeted update:

```sh
node --env-file=.env prisma/enable-letter-leaper-windsor.mjs --apply
```

The script verifies Windsor and Pam, upserts only this module and its criteria,
and appends missing assignments to Windsor's `WSR-` classes in a transaction.
It does not reset the organization, remove other assignments, or modify learner
work. Re-running it preserves assignment order and learner evidence.
`seed-windsor.mjs` also includes this module for future seed/content refreshes.
Do not run the full Windsor reset to install this module.

## Checks

```sh
node --test tests/letter-leaper.test.mjs
npx tsc --noEmit
npm run build
```
