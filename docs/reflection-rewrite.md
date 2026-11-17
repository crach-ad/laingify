# WSR reflection rewrite preview

Feature branch: `codex/reflection-rewrite`. Publishing was approved on 17 November 2026. The preview setup below is local-only; never apply its test bootstrap SQL to production.

## Current preview

- Instructor sign-in: http://127.0.0.1:3138/instruct/login
- Fictional instructor: `pam-preview@example.test`, PIN `8642`
- Learner sign-in: http://127.0.0.1:3138/join?code=WSR-PREVIEW
- Class: `WSR-PREVIEW`; select **Avery Test**, **Blake Test**, or **Casey Test**.
- Both **Bridge building reflection** (checkpoint tutorial) and **Design journal reflection** (standard workspace) already have completed work.
- Avery's review: http://127.0.0.1:3138/instruct/review/preview-1794919240811-avery/preview-1794919240811-module
- Avery's learner module: http://127.0.0.1:3138/learn/preview-1794919240811-module

These links work only on the machine running this preview. No public deployment or tunnel was created.

## Manual test

1. Sign in as the test instructor and open Avery's review link. Choose **Reopen reflection**.
2. Read the confirmation. Cancel once to confirm nothing changes; reopen and choose **Confirm reopen**.
3. Check **Awaiting rewritten reflection**. The photo, prior work, and awarded project are retained.
4. Open the learner sign-in in another tab and select Avery Test. Open the learner module link; it should show **Rewrite your reflection**, even though the module was completed.
5. Write a new reflection (at least ten characters) and submit. The preview's deterministic feedback recognizes responses of at least 40 characters and eight words as substantive.
6. Refresh the instructor review. The replacement and new feedback appear, and the awaiting status clears.
7. Repeat using the standard Design journal module and another learner. Old instructor tabs must never remove a newer reflection; refresh when prompted.

## Scope and data behavior

- Only module-level written `Submission` records (`criterionId = null`) are reflections. Text evidence and criterion-specific submissions are never reset by this action.
- Server authorization requires a signed-in instructor, an organization they manage, a WSR-prefixed class in that organization containing the learner, and this module assigned to that same class and organization.
- A transaction removes only the exact selected reflection and its feedback and creates an audit/rewrite-request record. Historical reflection text is not retained in the request.
- Older submissions, their feedback, evidence, criterion statuses, projects/badges, and lesson progress are preserved. The pending request overrides completion for the reflection UI without erasing the existing award or progress.
- Reopen and submission persistence take the same PostgreSQL transaction advisory lock for the learner/module pair. A stale submission ID is rejected; repeated requests for an already reopened ID are harmless. Submission state is rechecked after automated feedback generation. Concurrent rewrite submissions consume the pending request once.
- New reflection, feedback, criterion updates, and clearing the request are committed together. Original completion timestamps are preserved.
- Instructor review, review queue, learner profile, and class/module view show the awaiting status. Both learner module renderers reopen their forms.

## Local database and restart

Database: `postgresql://reflection_dev@127.0.0.1:55439/reflection_test`.
The PostgreSQL cluster is `/private/tmp/laingify-reflection-db`, bound only to loopback.
The worktree `.env.local` contains only local test settings and a test session secret; it is ignored by Git. No production environment file was loaded.

From this worktree:

```sh
pg_ctl -D /private/tmp/laingify-reflection-db -l /private/tmp/laingify-reflection-postgres.log -o '-p 55439 -h 127.0.0.1 -k /private/tmp' start
npm run dev -- --webpack --hostname 127.0.0.1 --port 3138
```

Skip the first command if PostgreSQL is already running. To stop this test cluster, use `pg_ctl -D /private/tmp/laingify-reflection-db stop`.

The new `20261117090000_reflection_rewrite` migration was applied with `prisma migrate deploy` to this database. The repository's older migrations omit some existing schema fields/tables (module topic, sprite customization, instructor organization access, attendance, learner events). `tests/fixtures/reflection-baseline.sql` reconciled those **only in this fresh test database** after applying migrations. It is a test bootstrap fixture, not an additional production migration.

Fixture creation is guarded against any destination other than `localhost:55439/reflection_test`:

```sh
node --env-file=.env.local scripts/reflection-test-fixture.mjs
```

It adds a fresh synthetic organization and prints its credentials/IDs; it never resets existing records.

## Verification

```sh
REFLECTION_TEST_URL=http://127.0.0.1:3138 node --env-file=.env.local --test tests/reflection-rewrite-api.test.mjs
npm run build
```

Integration tests refuse non-loopback app URLs and non-test database URLs. They cover authorization failures, WSR/assignment restrictions, cross-origin requests, preservation, completed modules in both renderers, end-to-end replacement/feedback, duplicate instructor requests, stale instructor and learner requests, and concurrent learner resubmissions.

Limitations: feedback testing uses the existing deterministic fallback with no Gemini key; live AI responses were not exercised. Browser inspection confirmed the review controls; the in-app browser stalled on the original native confirmation popup, so confirmation now uses an accessible in-page modal. Full interactive verification of that replacement modal remains a manual preview check. Production schema readiness must be reviewed separately before any approved release.
