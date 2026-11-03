# Bebras Juniors 2025 in Laingify

The classroom module contains the 15 captured UK Bebras 2025 Junior challenges in their original order. Source graphics and question text are credited to UK Bebras / Raspberry Pi Foundation. The classroom player is Laingify code, with no external scripts, iframe submissions, or Bebras login dependency.

Students enter through **Mouse Meadow → Bebras challenges** at `/play/mouse/bebras`. The standalone Bebras module card is hidden from learner topic lists and instructor project cards. The existing assignment remains as an internal access and reporting record, preserving all student results. Previously shared `/play/bebras` and module links redirect to the tab. They may move between questions, save and revisit answers, and submit early after confirming unanswered questions. The timer records elapsed time, without a deadline. The original choice/text/number, placement, grid-selection and road-selection interactions are supported. Placements also support selecting an item and then a destination for touch and keyboard access.

Answers are saved automatically every 15 seconds while visible, as well as on navigation and Finish. A local draft protects unsent edits; failed saves block navigation. Reload resumes the latest session. A finished session is immutable; a retake starts a separate history entry. The answer key stays server-side; answers and original explanations become available after Finish. Teacher preview is explicitly labeled and writes no learner records.

## Outcomes

The class console has a **Bebras outcomes** link at `/instruct/class/[classId]/bebras`. It includes the latest session for every roster learner (including not started), per-challenge correctness and thinking skills, answer revisions, visits, active time, elapsed time, all session history, and a CSV export. Teacher access is scoped to their organizations; learner access requires current roster membership and assignment.

Elapsed time includes breaks. Active time is a server-timestamp estimate based on 15-second heartbeats while the page is visible and used in the last 60 seconds; gaps over 30 seconds are excluded. Active time is not an attention measure. Each run is a `LearnerEvent` of type `bebras_session`; mutation is serialized using a transaction advisory lock and protected by a version check. No schema migration is required. Finish updates module completion and writes a submission summary; correctly solved criteria remain marked MET across retakes. Completion indicates a submitted session, not a perfect score.

## Source correction

Fair's published explanation says C → 5, but the illustration and height rule both give C → 4. The green-hatted beaver is 6 units tall and stilt 4 is 7 units, giving the target 13. The scored mapping is A → 6, B → 2, C → 4, D → 1, E → 3. This correction is shown in the answer review.

## Assignment

`node --env-file=/path/to/.env prisma/enable-bebras-kcsb.mjs` previews the matching KCSB Year 6 classes. Add `--apply` to upsert the module and 15 criteria and append its class assignment. The script never removes assignments or resets learner work. Subsequent standard content updates preserve this additive module. Current target: KCSB Computing / Year 6 / KCSB-6.

## Validation

- `node --experimental-strip-types --test tests/bebras.test.mjs`
- `BEBRAS_TEST_BASE_URL=http://localhost:3108 node --env-file=/path/to/.env --experimental-strip-types tests/bebras-api.mjs` (isolated test org; removes only created test records)
- `npx tsc --noEmit`, scoped ESLint, production build, and browser teacher preview.

The protected explanation route traces `content/bebras/explanations/*.png` into its deployment bundle. Student question graphics are public; explanation screenshots are served only after authorized completion.

## Castors 2025 — KCSB-3

The same Mouse Meadow tab also supports the 12 Castors challenges captured from
UK Bebras review mode on 3 November 2026. The assigned module selects the question
set; learners cannot choose a different set through request parameters. KCSB-3
(Year 3) receives **Bebras Castors 2025**; existing Year 6 assignments and sessions
remain Juniors. Legacy sessions without `setId` continue to use Juniors.

Castors includes Alex’s treasure, Beautiful drawings, Polite Beavers, Magic
house, Cube, Chung cake, Robot rug, Planes, Rubber rings, Parking at the party,
Avoiding the clouds, and Painted trees, in that order. Beautiful drawings supports
dragging and a select-then-place alternative for touch and keyboard users. Original
question and choice images are local; explanations remain protected until finish.

Preview the additive assignment with:
`node --env-file=/path/to/.env prisma/enable-bebras-kcsb.mjs --castors`
Add `--apply` to assign only the class with code KCSB-3 in KCSB Computing. This does
not reset work or remove other assignments. Deploy the multi-set app before
students use the new assignment.

The existing instructor outcomes, per-question active time, elapsed completion
time without cutoff, answer revisions, session history, and CSV export adapt to
12 questions. To exercise the isolated integration test for this set, pass
`BEBRAS_TEST_SET=castors` along with `BEBRAS_TEST_BASE_URL`.
