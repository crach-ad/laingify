# Demo crib sheet — Product Design & Innovation

Mock deployment of the 13-week girls' STEM program (per `overview 2.0.pdf`):
six modules matching the six learning areas, two cohorts, mid-semester state.

Start the app: `npm run dev` → http://localhost:3000
Reset to this exact state anytime: `npm run seed`

## Credentials

| Who | Where | Login |
|---|---|---|
| Learner (star) | `/join` | code **PDI-C1** → **Ada** → PIN **1234** |
| Any other girl | `/join` | code PDI-C1 or PDI-C2 → pick name → PIN 1234 |
| Instructor | `/instruct/login` | **rivera@pdi.org** / PIN **4321** |

## Suggested arc

1. **Learner view** — join as Ada: 2 of 6 badges earned (CAD Cadet, Maker),
   Circuits & Sensors in progress. Open it: lesson, breadboard photo evidence,
   auto-feedback, and a discussion thread (learner → Sprite hint → instructor
   reply about voltage sag). The Sprite chat bubble works live.
2. **Instructor view** — sign in as Ms. Rivera: **5 items in the review queue**
   plus roster progress for both cohorts (Cohort 02 is the untouched spring
   intake). Every roster name clicks through to a **learner profile** — stats,
   badge rail, per-module progress, assembled portfolio, latest evidence
   (Ada's and Priya's are the rich ones).
   - *Priya · Capstone* is the showpiece: lap-time trial log (42.4 → 33.2 s,
     one variable per trial — the portfolio artifact from the prospectus),
     vehicle photo, code explanation.
3. **The live moment** — open *Ada · Circuits & Sensors*, press **Approve** on
   the reviewed criterion → module completes, project assembles. Switch to
   Ada's tab, refresh: **third badge appears**.
   (Any of the 5 queue items works the same; Ada's is the scripted one.)

## Queue contents after seeding

- Ada — Circuits & Sensors (HYBRID confirm)
- Priya — Capstone: Line-Following Vehicle (RUBRIC lap check)
- Amara — Print & Assemble (RUBRIC QC)
- Zoe — Design in CAD (RUBRIC; her write-up is thin — good "not yet" example)
- Lucía — Circuits & Sensors (HYBRID confirm)

## Gotchas

- Visiting a module page as a learner **starts its progress clock** (its
  reviewed criterion then joins the queue). Re-seed if you want pristine state.
- No `GEMINI_API_KEY` set → Sprite/feedback use the deterministic fallback;
  substantive text (≥ 40 chars) passes auto-criteria. Set the key in `.env`
  for live AI replies.
