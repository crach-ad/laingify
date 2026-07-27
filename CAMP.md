# Winners Camp — day-of runbook

**App:** https://laingify.vercel.app (use this HTTPS URL — camera & mic won't work over plain HTTP)

## Logins

| Who | How |
|---|---|
| Campers, first time | laingify.vercel.app → code **HAPPY** → type their name → "I'm new here" → selfie |
| Campers, returning | code **HAPPY** → type the SAME name → "I'm coming back" |
| Coach | laingify.vercel.app/instruct/login → **crachad.laing@gmail.com** / PIN **4321** |

Names are the account code: unique per class (case doesn't matter). Two kids with the
same first name — the second one adds a last initial ("Maya B"); the app tells them so.

## Day 1 state (as prepped)

- Empty roster: campers self-register as they arrive (no name list needed)
- **Module 1 (Name Tag Keychain) only** — Module 2 is seeded but hidden from the class
- Tutorial has annotated step GIFs; checkpoints: 2 screenshots + 1 voice note + written wrap-up
- Written wrap-up needs ≥ 40 characters AND ≥ 8 words to pass (deterministic fallback; no AI key set)
- Portfolio: kids get View + Download buttons at the finish screen; earned badge on the dashboard also opens it
- Coach console: review queue + roster progress; each camper's profile has portfolio view/download

## Enable Module 2 on Day 2 morning (safe mid-camp)

```
node prisma/enable-module2.mjs
```
Assigns the Clicky Fidget module to the class without touching any camper data.
(Module 2's step GIFs are still to be captured — finish before Day 2.)

## Do / Don't during camp

- ✅ `node prisma/enable-module2.mjs` — safe anytime
- ✅ Coach approves/reviews from the console — safe
- ❌ `npm run seed:camp` — DESTROYS all camper work
- ❌ `npm run seed:demo` — safe for camp data (different org) but don't confuse the two

## If something goes wrong

- A camper on a broken device: they can tap their name on ANY device — work follows the name, not the device
- Voice note fails (no mic permission): browser will show a mic prompt; if denied, Settings → Site permissions → allow microphone, reload
- Photo checkpoint on laptops: "Take/choose photo" opens a file picker — screenshots work (Cmd+Shift+4 on Mac, Snipping Tool on Windows)
- The dev machine isn't needed: everything runs on Vercel + Supabase
