# Letter Leaper typing progress

Letter Leaper is a classroom typing-progress tool. Students keep playing the
six-terrain adventure (100 letter leaps to the moon, then 50 word leaps to the
stars). Teachers get per-student evidence about accuracy, fluency, difficult
keys, and practice habits. This document is the design, the event contract,
the metric definitions, and the rollout notes. `docs/letter-leaper.md` covers
the original Windsor module.

## Journeys

**Teacher.**
1. In the Instructor Console, choose **＋ New typing classroom**. Enter a class
   name, age band, practice settings, and student names. This creates the class
   with PIN sign-in, assigns Letter Leaper, and gives each student a 4-digit PIN.
2. For an existing class, open it and choose **⌨️ Typing**. Then:
   - Assign Letter Leaper if it isn't assigned.
   - Set the practice: all letters or one keyboard row; easy, medium or hard
     (see the 3D doc's *Difficulty* section); and
     letters only (100), words only (50), or the full adventure (150).
   - Turn on PIN sign-in, and add students.
3. Share the class code, or the entry link `/join?code=CODE`, and print the PIN
   cards.
4. The **⌨️ Typing** page is the class dashboard. Filter it by date range,
   practice, keys, pace, and input. Open a student's record, then a session's
   detail. Export CSV of the current filters.

**Student.** Join the class and sign in with a PIN. Open the Keyboard Skills
module, then **Play Letter Leaper**. The page shows:
- the assigned practice
- their own recent progress
- a start or resume action

**Practice settings.** Settings are separate from recording:
- **When the teacher has saved settings,** every player on the roster gets
  them locked in the game, whether or not their practice is recorded. That
  includes name-only sign-ins.
- **When the teacher hasn't,** players choose their letters and difficulty, as in
  the original Windsor module. Verified players' sessions record what they
  actually chose, and resuming such a climb locks the game to that climb's
  settings until it ends.

**After every session,** finished or not, the student sees one thing that
improved, one thing to practise next, and a short summary. The feedback always
uses that session's own final numbers. If the feedback request is slow or
fails, the game falls back to them. If the student has started another climb
by the time it resolves, nothing is shown over it. Progress is about their own improvement. The class leaderboard
is still available as a secondary feature. The Top-5 panel is hidden on the
intro screen, and the nickname is optional.

**Guests.** Public play (`/play/typing`, `?mode=public`) never loads the
tracker or leaderboard clients, so it makes no API calls. The page says guest
play isn't saved. Guest play can't reach a class report: uploads need a signed
learner session, and a practice ticket that is only issued to signed-in
learners.

## Identity and access

- **Signed cookies.** Learner and instructor cookies are HMAC-signed
  (`lib/signed-token.ts`). Editing or forging an id no longer works. Old
  unsigned cookies are ignored, so everyone signs in once after deploy.
- **How the student signed in.** The learner session records the sign-in
  method:
  - `pin`, `nfc`, `register` (the device the profile was created on) — verified
  - `name` (typed an existing name in an open class), `roster` — not verified

  **Typing progress is recorded only for verified sign-ins.** A display name
  alone can't add to or change another student's record. Name-only sign-ins
  can still play, with the teacher's settings, but they never receive tracking
  credentials (practice ticket, queue key, or resume). The student page
  explains why nothing is being saved, and the existing leaderboard flow is
  unchanged.
- **Windsor and other open classes are unchanged** until a teacher presses
  **Turn on PIN sign-in**. That gives PINs to students without one and switches
  the class to roster-plus-PIN sign-in. Self-registration then stops, and the
  teacher adds new students. No student work changes.
- **PIN lockout.** Five wrong PINs for one learner within 15 minutes lock that
  learner's PIN sign-in for the rest of the window (`SignInFailure`). Each
  attempt is recorded before it is checked, so parallel guesses can't get past
  the limit. Because class rosters are visible to anyone with the class code,
  someone could deliberately lock a student out for 15 minutes; the teacher can
  wait it out, and nothing else is affected.
- **Upload checks.** The server takes identity from the signed cookie and
  re-checks the current roster and the class's Letter Leaper assignment. The
  practice ticket (signed `{learner, class, module}`, embedded in the game URL
  fragment) must match the cookie. Client-supplied learner ids are never used.
- **Teachers.** Instructors see a class only if it's in one of their orgs (the
  existing console rule). A student record is only visible through a class
  that student is on. CSV exports use the same checks and the same filters.
  Learners can read only their own sessions, and only after a verified
  sign-in: a name-only sign-in sees no saved progress
  (`/api/typing/session/[id]`, `/play/letter-leaper`).

## Data model (migration `20261026120000_typing_progress`, additive only)

| Table | Purpose |
|---|---|
| `TypingAssignment` | A class's practice settings (letter set, pace = difficulty, scope). Absent = all letters, easy, full. Rows saved with the old names read as relaxed → easy, steady → medium, speedy → hard. |
| `TypingSession` | One row per session, including partial ones. Deleted along with its learner or class (cascade), so org wipes and deletion requests work. Holds the settings played, input method, game and measurement version, start / last activity / end, status and end reason, start and furthest leap, client clocks (active, pause, animation, hidden), derived totals, and `summaryJson` (per-phase stats, per-key counts, confusions, timing samples, ignored-input counts). The summary is recomputed from all stored events on every upload, and survives event retention. |
| `TypingEvent` | Append-only events. The client UUID is the primary key and `(sessionId, seq)` is unique, so retries are idempotent. |
| `SignInFailure` | Failed PIN attempts for the lockout. Kept out of `LearnerEvent`, because every `LearnerEvent` counts as activity in insights and attendance. |

Existing tables are untouched. The legacy leaderboard (`LearnerEvent`
`leaper_profile` / `leaper_score`) keeps working. Its completed climbs appear on
the student record as **Legacy leaderboard results**. No session or per-key
history is inferred from them.

## Event contract (measurement version 1)

Producer: `public/games/letter-leaper/tracker.js` (class mode only). The game
itself is split into a rules engine, HTML UI, and a scene renderer; see
`docs/letter-leaper-3d.md` and `docs/letter-leaper-visuals.md`. Since then, `gameVersion` also names the
renderer (`…-3d`, `…-phaser` or `…-classic`), and `stage` events follow the 20-leap
environment bands. Consumer:
`POST /api/typing/batch`. Validation lives in `lib/typing-events.ts`.

```jsonc
{
  "ticket": "v1.…",               // from the class page; must match the sign-in
  "session": { "id": "uuid", "letterSet": "home", "pace": "medium", "scope": "full",
               "hints": false, "gameVersion": "2026.10.1", "measurementVersion": 1,
               "startedAt": 1761480000000 },
  "clocks":  { "activeMs": 0, "pauseMs": 0, "animationMs": 0, "hiddenMs": 0 },   // cumulative
  "ignored": { "repeat": 0, "modifier": 0, "composition": 0, "paste": 0, "nonletter": 0, "busy": 0 },
  "events":  [ { "id": "uuid", "seq": 0, "t": 0, "type": "session_start", "leap": 0, "resumed": false } ]
}
```

| type | fields | when |
|---|---|---|
| `session_start` | `leap`, `resumed` | Start, or resume after a reload or return |
| `target` | `target` (1–3 letters), `kind` (letter/word), `leap` | A target is presented |
| `key` | `exp`, `got`, `pos`, `ok`, `rt`, `src` (kbd/screen) | An accepted character attempt |
| `complete` | `target`, `leap` | A target is fully typed (the leap starts) |
| `timeout` | `target`, `pos`, `rt` | A timed target ran out. No keystroke is invented. |
| `pause` / `resume` | `reason` (user, hidden, help, moon, leaderboard) | Pausing and resuming |
| `stage` | `stage`, `leap` | A terrain transition |
| `end` | `reason` (completed, exited), `leap` | Finish, or back to base camp |
| `connection` | `state` (lost, restored) | Uploads failed, then recovered |

- `seq` is consecutive per session. `t` is a monotonic session clock in ms.
  It continues across a resume. `at` is the device's wall-clock time (epoch
  ms). The server uses it, clamped to the session start and the present, for
  "last activity" and "ended at".
- `rt` is **active** milliseconds since the game was last ready for input on
  that target (target shown, previous keystroke, or resume).
- **Batches.** At most 200 events per batch, 64 KB per request. A session can
  be uploaded for up to 14 days after it started, and `t`, `rt`, and the clocks
  are bounded by the same window. Long waits are legitimate and the idle cap
  discounts them, so they aren't rejected. Device clocks up to a day fast are
  tolerated, and times are clamped to the present.
- **Ordering.** Times must not go backwards by `seq`. The first event must be
  `session_start`, and `ok` must equal `exp === got`.
- **Retries.** A retry with the same id at the same `seq` is skipped. A
  different event at a stored `seq` is rejected (409).
- **Response codes** the tracker acts on:
  - `ok` — drop the batch from the queue
  - `signed-out` / `other-learner` — keep it for its own learner
  - `rejected` — drop it
  - otherwise — retry with backoff (2 s → 30 s)

**What is observed.**
- Only keystrokes on the game page while a target is on screen and the game is
  accepting answers. Never names, the nickname field, dialogs, or other pages.
- Ignored input is counted by kind, never as an attempt, and without the key
  value: shortcuts (Ctrl/Cmd/Alt), held-key repeats, IME composition, paste,
  non-letter keys, and keys pressed mid-leap.
- On-screen key taps are recorded as `src: "screen"`.

**Reliability.**
- **Batching.** Events queue in `localStorage` under an opaque key per learner
  **and class** (`leaper-progress:v1:<hash>`). A learner on two rosters has two
  queues, and each uploads only with its own class's ticket. They upload every 4 s while playing, at once on
  session end, and with `keepalive` when the page is hidden or closed.
- **Resume.** A reload resumes the same session. The game offers *Resume at
  leap N*, from the device queue or from the server, and continues `seq` and
  the clocks.
- **Shared devices.** Each queue only uploads with its own learner's ticket,
  and the server also requires the signed-in learner to match. If Ann's
  practice is still queued when Bo signs in, it waits on the device and uploads
  next time Ann signs in there. It is never attributed to Bo.
- **Expiry.** Queues expire after 14 days. Finished, uploaded entries are
  cleared on the next load.

## Metrics (`lib/typing-metrics.ts`, `lib/typing-report.ts`)

Letter practice and word practice are measured as separate **phases**.

**Response time** is the sum of `rt` over accepted attempts and timeouts. Any
single wait is counted up to **30 s** (the idle cap). The excess is reported as
idle time and excluded. Pauses, the moon break, hidden-tab time, and jump
animations are outside the game's active clock, so they never enter `rt`. Each
is reported separately on the session page.

| Metric | Definition |
|---|---|
| Correct CPM | correct accepted characters ÷ response time (min) |
| Attempted CPM | all accepted character attempts ÷ response time (min) |
| Accuracy | correct attempts ÷ all accepted attempts (timeouts aren't attempts) |
| Correct short words / min | completed words ÷ word-phase response time (min). These are 2–3 letter game words, **not** a standardized WPM. |
| First-attempt target accuracy | targets completed with no wrong key and no timeout ÷ targets resolved (completed or timed out) |
| Per-key accuracy | per expected key: attempts, correct, wrong keys, timeouts. Miss rate = (wrong + timeouts) ÷ samples. |
| Key confusions | expected key → pressed key → count. Timeouts never create a confusion. |
| Response timing | median time to the first character of a target (first attempt only); median gap between correct letters inside a word |
| Timeout rate, recovery | timeouts ÷ targets resolved; share of attempts right after a wrong key (same target) that were correct |
| Engagement | sessions, active practice minutes (accepting-input time minus idle excess), practice days, finished vs partial/interrupted sessions |
| Progress over time | per comparable group: the latest half of sessions (≤3) vs the half before, pooled; change in accuracy (points) and correct CPM, with session and attempt counts shown |

**Comparable sessions** share a phase, the keys in play (letter set; words
always use the whole keyboard), difficulty (hints follow it; relaxed sessions
compare with easy, the only older pace with the same rules), and input method
(physical keyboard, on-screen keys, or mixed).

**Sample-size thresholds.**
- A session phase needs **20+ attempts** to count toward trends.
- A trend needs **2+ qualifying sessions**.
- A key needs **8+ samples** to be ranked or coloured on the heatmap.

Below these thresholds the UI says **not enough data**.

**Session states.** Finished, ended early, in progress, or **interrupted** (no
end and no activity for 30 minutes).

**Teaching suggestion.** Fixed rules, no AI. The first rule that applies wins,
and the suggestion always cites its numbers:
1. Under 40 attempts: not enough data.
2. Medium or hard with ≥20% timeouts: suggest easy. This rule comes first,
   because timeouts make every timed-out key look hard.
3. Up to two keys with a ≥15% miss rate in the latest comparable group (last 3
   sessions): *"Practise F and G on easy; these keys had the highest
   error rate across the last 3 comparable sessions."*
4. ≥95% accuracy over 60+ attempts: suggest the next step up.
5. Otherwise: keep a steady routine.

**Student feedback.** One improvement, compared only with the student's own
previous comparable session. One next key, with its keyboard row. A summary of
leaps, accuracy, and minutes.

### Limitations

- **Client-reported data.** This is practice data the game reports. It is not a
  proctored assessment, and a determined student could fabricate uploads for
  their own record. Validation bounds values, order, and timing, but can't
  prove honesty.
- **Not a typing test.** Game CPM measures recognising a displayed letter and
  finding its key, not continuous passage typing. Don't compare it with WPM
  norms. No age-based proficiency labels are applied.
- **Approximate timing.** Timing comes from the game's animation frames
  (about 16 ms resolution). The active clock counts real time up to 1 s per
  frame, so slow devices aren't under-timed. A device that sleeps pauses along
  with the game.
- **Input method.** Input method is per session. "On-screen keys" includes
  mouse clicks on the on-screen keyboard as well as touch.
- **No inferences about the student.** Nothing here infers disability,
  diagnosis, intelligence, or motivation, and the UI doesn't either.
- **Moon break.** The moon break counts as pause time, not practice time.
- **Hints follow difficulty.** Easy always lights up the next key; medium and
  hard never do. New sessions must use easy, medium or hard; sessions played
  before the difficulties keep their old pace and labels (relaxed, steady,
  speedy, falls) and never resume.

## Retention

- **Events.** `TypingEvent` rows are kept for **180 days** after the session
  started, then deleted. The session keeps its summary and shows that detailed
  events were removed.
- **Summaries.** `TypingSession` summaries are kept for **3 years**, then
  deleted.
- **Deletion requests.** `--learner <id>` deletes all of one learner's typing
  sessions and events.
- **PIN attempts.** `SignInFailure` rows are only needed for the 15-minute
  lockout, and the same script clears them after a day.

```sh
node --env-file=.env scripts/purge-typing-events.mjs            # dry run
node --env-file=.env scripts/purge-typing-events.mjs --apply
node --env-file=.env scripts/purge-typing-events.mjs --learner <learnerId> --apply
```

No IP addresses, user agents, or free text are stored with typing data.

## Rollout

1. **Set `SESSION_SECRET`** (a long random string) in Vercel production
   before deploying.
   - Without it, the signing key is derived from `DATABASE_URL`. That works,
     but signs everyone out whenever the database password rotates.
   - **Impact:** existing cookies are unsigned, so every student and teacher
     signs in once after this deploys. Students in PIN classes need their PIN;
     open classes sign in by name as before.
2. **Apply the typing migration** to production before deploying the code:
   `prisma/migrations/20261026120000_typing_progress/migration.sql`.
   - It is additive: four new tables (`TypingAssignment`, `TypingSession`,
     `TypingEvent`, `SignInFailure`), with foreign keys that cascade from
     `Learner` and `Class`. Existing tables and rows are unchanged.
   - Run the SQL file itself (for example in the Supabase SQL editor).
   - Don't use `prisma migrate deploy`. Production's migration history
     doesn't match the migrations folder (`20260917…` and `20260921…` were
     applied without being recorded), so it would fail.
   - Don't use `prisma db push`. It makes production match whatever schema is
     checked out, including unrelated uncommitted changes.
   - Afterwards, optionally record it:
     `prisma migrate resolve --applied 20261026120000_typing_progress`.
3. **Merge and deploy.**
4. **Windsor:** its classes keep name-only sign-in, so existing Windsor
   students' play stays unrecorded until PIN sign-in is turned on. To start
   recording, open each class's ⌨️ Typing page, press **Turn on PIN sign-in**,
   and print the PIN cards. New students are then added by the teacher.
5. **Optional:** schedule `scripts/purge-typing-events.mjs --apply` monthly.

## Checks

```sh
node --test tests/*.test.mjs                       # unit tests (integration and browser skipped)
TYPING_IT_BASE=http://localhost:3000 DATABASE_URL=postgresql://…@localhost:…/db \
  node --test tests/typing-integration.test.mjs    # API, auth, dedupe — local DB only
# Real game in headless Chrome (start Chrome with --remote-debugging-port=9333):
TYPING_IT_BASE=… TYPING_CDP=http://localhost:9333 DATABASE_URL=…localhost… \
  node --test tests/letter-leaper-browser.test.mjs
npx tsc --noEmit && npm run build
```
