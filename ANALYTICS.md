# Learning analytics — build plan

Goal: turn weekly platform use (KCSB year groups + camps) into three things —
**live step-level data capture**, an **Insights view in the instructor console**,
and **recurring reports** (weekly class digest, termly per-learner report).

Principles
- **First-party only.** Learners are minors: all data stays in our Postgres. No GA/Mixpanel/pixels, no IP or user-agent storage. Events carry only learnerId / moduleId / step info.
- **Capture before display.** Every week without the event log is unrecoverable step-level data, so Phase A ships first even though Phase B is the visible payoff.
- **Server-rendered charts.** No chart library — inline SVG/CSS in server components, matching the existing `.bar` aesthetic. Zero new client JS beyond the event beacon.

What we already have (no changes needed): `ModuleProgress.startedAt/completedAt`,
`Evidence.createdAt` (per checkpoint), `Submission.createdAt` + `AutoFeedback`
met/missing, `CriterionStatus.updatedAt`, `Learner.createdAt`, `SpriteInteraction`
(sprite chats, `answerSeeking` flag). Known dead column: `ModuleProgress.timeOnTaskSeconds`
is never written — Phase A brings it to life.

---

## Phase A — Event capture (schema + API + instrumentation)

### A1. Schema (`prisma db push`, additive — no migration risk)

```prisma
model LearnerEvent {
  id        String   @id @default(cuid())
  learner   Learner  @relation(fields: [learnerId], references: [id])
  learnerId String
  moduleId  String?
  // session_start | step_view | step_done | track_pick | checkpoint_saved |
  // checkpoint_retry | audio_recorded | wrapup_submitted | module_done
  type      String
  // JSON: { step, heading, track, dwellMs, durationMs, attempt, words }
  meta      String   @default("{}")
  createdAt DateTime @default(now())

  @@index([learnerId, createdAt])
  @@index([moduleId, type, createdAt])
}
```

Plus `events LearnerEvent[]` on `Learner`.

### A2. `POST /api/event`
- Auth: learner session cookie (same as `/api/evidence`); reject if none.
- Whitelist `type` against the list above; clamp `meta` to 2 KB; never trust client learnerId (use the session).
- **Side effect:** on `step_view` events carrying `dwellMs`, increment
  `ModuleProgress.timeOnTaskSeconds` by `min(dwellMs, 5 min)` — the cap keeps
  an abandoned open tab from recording an hour of "work". This resurrects the
  dead column with no schema change.
- Batching: accept a single event or an array (the client flushes queues).

### A3. Client instrumentation (Tutorial.tsx + join flow)
Small `lib/track.ts` helper: `track(type, meta)` queues events and flushes with
`navigator.sendBeacon` (fallback `fetch keepalive`) — fire-and-forget, never
blocks the UI, silently drops on failure.

| Where (existing code) | Event | meta |
|---|---|---|
| module page load (server, where `ModuleProgress` is created) | `session_start` | — (server-side `prisma.learnerEvent.create`, no client code) |
| every `setStep` transition + `beforeunload`/`visibilitychange` | `step_view` | `{ step, dwellMs }` — dwell measured only while tab visible |
| `capture()` success (photo/audio saved) | `checkpoint_saved` | `{ step, criterionLabel, type }` |
| `capture()` retry of an already-done checkpoint | `checkpoint_retry` | `{ step, attempt }` |
| audio recorder stop | `audio_recorded` | `{ durationMs }` |
| `setTrack` (trackpick card) | `track_pick` | `{ track }` |
| `submitReflection` success | `wrapup_submitted` | `{ words, passed }` |
| completion (`data.complete` true) | `module_done` | — |

Nothing is sampled; volume is tiny (a class of 30 doing a module ≈ a few
hundred rows/week).

### A4. Verify
Headless-CDP walk of one module (join → steps → checkpoint → finish), then
assert the expected event rows + `timeOnTaskSeconds > 0` in the DB; clean up
the test learner (existing pattern).

---

## Phase B — Insights in the instructor console

### B1. `lib/insights.ts` — pure query layer (all per-class, org-checked)

| Function | Source | Answers |
|---|---|---|
| `weeklyActive(classId, weeks)` | Evidence/Submission/LearnerEvent timestamps | distinct learners active per ISO week; WoW retention (of last week's active, how many returned) |
| `moduleFunnel(classId)` | ModuleProgress + CriterionStatus + Project | per module: started → some checkpoints → all checkpoints → wrap-up → badge, with drop-off % |
| `stepPacing(moduleId)` | LearnerEvent `step_view` dwell (fallback: Evidence.createdAt gaps) | median + p90 minutes per step → the stall step |
| `timeOnTask(classId)` | ModuleProgress.timeOnTaskSeconds | median session/module time; fits-in-a-lesson check |
| `writingGrowth(classId)` | Submissions | words per wrap-up per learner over weeks; flags gibberish (passed but < N real words) |
| `strandCoverage(classId)` | Projects × Module.topic | learner × strand badge matrix |
| `trackMix(classId)` | `track_pick` events | beginner/intermediate/advanced share per module |
| `needsAttention(classId)` | all of the above | stalled > 14 days mid-module; ≥2 failed wrap-up attempts; active-weeks streak broken |

Every function returns plain serializable data so the same layer feeds pages,
digests, and term reports.

### B2. UI
- **`/instruct/class/[id]?view=insights`** — third tab (📊 Insights) beside
  Projects/Roster: weekly-active bar chart (last 10 weeks), needs-attention
  list (links to learner pages), module funnel table with drop-off bars,
  writing-growth sparkline per learner, strand-coverage matrix.
- **Module preview page** gains a "Pacing" card: median minutes per step once
  events exist (hidden until there's data).
- **Console home**: one line per class card — "12 active this week ↑3".
- Charts: server-rendered inline SVG (bars, sparklines, heatmap cells) with the
  existing CSS variables; no client JS.

### B3. Verify
Render against the camp class (real Aug data lights up weekly-active, funnel,
writing metrics immediately) + a KCSB class (empty states).

---

## Phase C — Recurring reports

### C1. Weekly class digest — `scripts/weekly-digest.mjs` (`npm run digest`)
- For each class with activity that week: actives + WoW change, badges earned
  (who/what), needs-attention list, stall step of the week, notable wrap-up
  quotes.
- Output: `reports/<year>-W<week>/<class>.md` (+ a self-contained `.html`
  reusing the portfolio-html styling). Same "generated artifact, not committed"
  stance as `student-work/` — `reports/` goes in `.gitignore`.
- Scheduling: run manually after each teaching day at first; optional later — a
  Vercel cron hitting a `/api/digest` route, or a local `/schedule` job. Not in
  scope for the first cut.

### C2. Termly per-learner report — `scripts/term-report.mjs`
- One self-contained HTML per learner (KCSB parents/records): strand-coverage
  matrix, badges timeline, writing-growth chart, total time-on-task, links to
  (or inlined) portfolio pages. Builds on `lib/insights.ts` + `portfolio-html.ts`.
- `--class KCSB-3 --from 2026-09-01 --to 2026-12-11` style flags.

---

## Sequencing

| Step | Depends on | Size |
|---|---|---|
| A1 schema + A2 API | — | S |
| A3 instrumentation | A2 | M |
| A4 verify | A3 | S |
| B1 query layer (non-event metrics first) | — (parallel with A) | M |
| B2 insights tab + console line | B1 | M |
| C1 weekly digest | B1 | S |
| B1 event-based metrics (pacing, tracks) + B2 pacing card | A4 + data accruing | S |
| C2 term report | B1 | M |

Phases A and B1/B2 can be built in the same pass (A first so events start
flowing); C1 right after; C2 anytime before term end.

## Decisions taken
- Dwell cap 5 min per step event; "active" = any event/evidence/submission that ISO week.
- No third-party analytics; no new client deps; charts are server-side SVG.
- Event rows are append-only; no PII beyond existing learner ids.

## Status — shipped 2026-08-21

- **A** `LearnerEvent` table live (db push), `/api/event` (batch, whitelist, 5-min dwell cap → `timeOnTaskSeconds`), `lib/track.ts` beacon, Tutorial instrumented. Verified via API tests + headless browser walk.
- **B** `lib/insights.ts` (weekly actives/retention, funnel, writing growth, coverage, pacing, track mix, needs-attention); 📊 Insights tab on the class page; "active this week" on console cards; pacing card on module preview (appears once events accrue).
- **C** `npm run digest [-- --week 2026-W33 --org …]` → `reports/<week>/…` per class with activity; `npm run report:term -- --class CODE [--from --to]` → per-learner HTML. `reports/` + `student-work/` gitignored.

## Phase D — teacher analysis workbench (designed 2026-08-21)

Build out the four core questions from passive charts into drill-downs a
teacher can act on. Rule: **every number resolves to names** — a metric you
can't turn into "which kids?" isn't analysis. All server-rendered; drill-downs
use native <details>/<summary>, so still zero client JS.

| Question | Build-out |
|---|---|
| Are kids coming back? | **Attendance register**: one row per learner, a dot per week (last 10), grouped by join-week cohort with per-cohort retention; inactive-streak sorting |
| Which projects work/stall? | **Expandable funnel**: each stage of each module opens to the named learners sitting in it (started-but-no-evidence, evidence-but-no-wrap-up, …), linking to profiles |
| Where do they get stuck? | **Step analytics** on the module page: per step — views, median/p90 dwell, retry count, and who is currently on it (latest step_view per learner). Step numbers follow the learner's chosen track. |
| Fits a lesson slot? | **Lesson-fit card**: time-on-task distribution buckets (0–15/15–30/30–45/45–60/60+ min) + % finishing within the slot; `?lesson=45` to change the slot length |

Plus **CSV export** (`/instruct/class/[id]/export?what=engagement|funnel|times`)
so a teacher can pivot in Sheets — the escape hatch for any analysis we didn't
predict.

## Open questions (defaults in parentheses)
1. Retention window for raw events — keep forever or roll up after a year? (keep; volume is tiny)
2. Digest day for KCSB (Friday) and whether camp classes are included (yes, while active)
3. Term dates for the first term report (needed only when C2 runs)
