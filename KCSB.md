# KCSB Computing (Reception → Year 8) — build plan

Source: *KCSB Computing Long-Term Plan (Reception–Year 8) · Cambridge CIE · Overview* (CSV, Aug 2026).
Cambridge foundations: Primary Computing 0059 (Stages 1–6), Primary Digital Literacy 0072, Lower Secondary Computing 0860 (Stages 7–8), Lower Secondary Digital Literacy 0082; Reception informally aligned to Cambridge Early Years.
Signature pedagogy: project-based, build-first; Learn → Build → Reflect → Share; talking short, building long; **every unit ends in a tangible artifact** — which is exactly what a module + badge + portfolio already is in this app.

## 1. Shape of the build

| Source concept | App object | Notes |
|---|---|---|
| KCSB (the school) | **new `Org`** — keeps `seed:kcsb` fully separate from the Abaco camp; `wipeOrg` never crosses orgs | `context: "community"` (school); name **KCSB Computing** |
| Year group (Reception … Year 8) | **one `Class` each → 9 classes** | own class code, own band, own ordered module list, own roster |
| Strand / program component (CT, P, MD, DC, CS, TC, SW, DW) | **`Module.topic`** — 8 topic cards on every learner dashboard | same 8 topic names in every year → consistent spiral |
| Cell in the grid (strand × year) | **one project `Module`** — 72 total | title must be unique per org (seed upserts by title) → titles carry the year, e.g. `Y3 · Break It Down` |
| "Toolbelt escalation" row | not a module — it's the tool each year's P / CS modules are built on | Bee-Bot → ScratchJr → Scratch → micro:bit → MakeCode Arcade → Python/Tinkercad → Python/Arduino/v0 |
| Weekly rhythm Learn → Build → Reflect → Share | block `kind: "learn"` / `"build"` text cards → photo/audio **checkpoints** → **wrap-up** → portfolio/badge | already how every Abaco module is written |

### Classes

| Class | Code | Band | Why |
|---|---|---|---|
| Reception | `KCSB-R` | EARLY | ages 4–5 — teacher-led, voice + photo only, no typed wrap-up |
| Year 1 | `KCSB-1` | EARLY | |
| Year 2 | `KCSB-2` | EARLY | |
| Year 3 | `KCSB-3` | YOUTH | 7–8 yrs; first typed wrap-ups (kept short) |
| Year 4 | `KCSB-4` | YOUTH | |
| Year 5 | `KCSB-5` | YOUTH | |
| Year 6 | `KCSB-6` | YOUTH | |
| Year 7 | `KCSB-7` | TEEN | 11–12 yrs; TEEN tone ("some domain terms") fits lower-secondary better than YOUTH |
| Year 8 | `KCSB-8` | TEEN | |

`minAuthTier`: **0** (open — name + selfie, pupils self-register), matching the camp. Can be raised to 1 (PIN) per class later without reseeding.

### Module order inside each class
Default sequence (same every year, so the spiral is visible): **CS → CT → P → MD → DC → TC → SW → DW** — "what is a computer" first, the two programming strands back-to-back, then data/networks, then the three Digital Literacy strands. The overview's note says DL strands are "woven into units where flagged DL on the year tabs" — if you can export the **per-year tabs**, their term order and DL flags replace this default.

### Evidence model by band
| Band | Checkpoints | Wrap-up |
|---|---|---|
| EARLY (R–Y2/3) | 1 photo of the artifact (teacher/TA can take it) + 1 voice note ("tell me what you made") | **voice note**, not text — `audioCriterion`; no `prompt` block |
| YOUTH (Y4–6) | 1–2 photos/screenshots + 1 voice note | short typed wrap-up (What worked / What challenged you / What would you improve) — existing ≥40 chars / ≥8 words fallback |
| TEEN (Y7–8) | screenshot(s) of code/doc + 1 voice note explaining a concept | typed wrap-up, Cambridge-flavoured ("explain the algorithm you used") |

Existing block types available: `heading`, `text` (learn/build, actions, tip/warn), `checkpoint` (photo/audio), `prompt`, `scratch`, `code`, `circuit` (AVR sim), `knex`, `slides`, `image`, `video`, `embed`, `trackpick`. Python modules will use `code` blocks (not executable in-browser — learners run in Replit/IDLE; we could add a Pyodide runner later). micro:bit/MakeCode: `embed` of the MakeCode editor. Bee-Bot/unplugged: photo checkpoints.

## 2. The 72 modules (title → artifact)

Titles are working names; `topic` is the strand. Each row = one module with its own badge. Depth is the CSV cell for that year; tool is the toolbelt row.

### Reception (`KCSB-R`, EARLY · Bee-Bot, touch drawing) — all voice + photo
| Strand | Module | Artifact |
|---|---|---|
| CS | R · Computer Hunt | photo/drawing of 3 "computers all around us" + voice |
| CT | R · Simon Says, Robot Style | photo of a picture-card instruction path a partner followed |
| P | R · Bee-Bot to the Treasure | photo of Bee-Bot on the route it was programmed to drive + voice |
| MD | R · Sort the Toy Box | photo of objects sorted into groups + voice "how did you sort?" |
| DC | R · Can You Hear Me? | photo of two devices "talking" (tablet call / walkie-talkie) + voice |
| TC | R · My First Photo | a photo the child took themselves + a touch drawing |
| SW | R · The Secret Word | voice note: why passwords keep things safe (never the actual password) |
| DW | R · Devices at Home and School | drawing of devices at home vs school, photo |

### Year 1 (`KCSB-1`, EARLY · ScratchJr, paint)
| Strand | Module | Artifact |
|---|---|---|
| CS | Y1 · Inputs & Outputs Machine | labelled drawing of an everyday machine (inputs / outputs) |
| CT | Y1 · Recipe for a Sandwich | photo of ordered picture cards; voice: "what if we swap two steps?" |
| P | Y1 · ScratchJr: Make the Cat Dance | screenshot of the ScratchJr program + voice |
| MD | Y1 · The Sorting Machine | photo: objects sorted by hand, then the same data sorted on a device |
| DC | Y1 · How Does the Picture Get There? | drawing of two devices connected via "the internet" |
| TC | Y1 · Log On, Type, Save | screenshot of a saved file with their name + a typed sentence |
| SW | Y1 · Ask an Adult | voice note: what to do when something online feels wrong |
| DW | Y1 · Kinds of Computers | paint picture of 3 kinds of computers / a website they know |

### Year 2 (`KCSB-2`, EARLY · ScratchJr → Scratch; cameras)
| Strand | Module | Artifact |
|---|---|---|
| CS | Y2 · Computers vs Humans | labelled hardware drawing + voice: one thing computers do better, one humans do better |
| CT | Y2 · Robot Teacher | photo of a precise step list + voice predicting the output |
| P | Y2 · Build, Test, Debug: My Scratch Story | Scratch screenshot + voice about the bug they fixed |
| MD | Y2 · Class Survey Pictogram | photo/screenshot of the pictogram |
| DC | Y2 · Wired or Wireless? | photo of devices sorted wired / wireless + voice |
| TC | Y2 · Folders and a Mini Movie | screenshot of a named folder holding their photo + video |
| SW | Y2 · Who Am I Online? | poster photo: account / identity rules |
| DW | Y2 · The Internet Is a Network | photo of a string-and-cup / yarn network model |

### Year 3 (`KCSB-3` · Scratch; spreadsheets; slides) — first typed wrap-ups
| Strand | Module | Artifact |
|---|---|---|
| CS | Y3 · Hardware, Software & Robots | slide sorting hardware/software + IoT/robot examples |
| CT | Y3 · Break It Down | photo of a decomposition map; voice: which algorithm was more efficient and why |
| P | Y3 · Two-Sprite Scratch Game | screenshot + voice + wrap-up |
| MD | Y3 · My First Spreadsheet | screenshot: cells formatted + a filter applied |
| DC | Y3 · Network Tour & Secret Cipher | photo from the school network tour + a ciphered message |
| TC | Y3 · Type It, Find It | typing-test screenshot + keyword search results |
| SW | Y3 · Safe Group Chat Rules | poster: personal info + group-chat rules |
| DW | Y3 · What's It For? | slide: content has a purpose; how tech has changed |

### Year 4 (`KCSB-4`, YOUTH · Scratch 3 + micro:bit MakeCode)
| Strand | Module | Artifact |
|---|---|---|
| CS | Y4 · Control Systems & File Sizes | control-system model photo + file-size table |
| CT | Y4 · Loops, Loops, Loops | Scratch screenshot using repetition + a sub-routine (custom block) |
| P | Y4 · micro:bit Name Badge & Dice | photo of the micro:bit running (MakeCode embed in the tutorial) |
| MD | Y4 · Card-File Database | screenshot: fields with data types, first records |
| DC | Y4 · WWW vs Internet; Caesar Wheel | photo of cipher wheel + decoded message; voice: WWW ≠ internet |
| TC | Y4 · A Richer Document | screenshot: document with a table + URLs |
| SW | Y4 · Strong Passwords, Content Lasts | password-strength checklist results (never a real password) |
| DW | Y4 · Spot the Fake | false-information checklist applied to 3 examples |

### Year 5 (`KCSB-5`, YOUTH · micro:bit sensors; podcasting; Sheets)
| Strand | Module | Artifact |
|---|---|---|
| CS | Y5 · Binary, IPO & Meet AI | binary-bracelet photo + input-process-output diagram |
| CT | Y5 · Choose Your Path | flowchart with selection, variables, operators |
| P | Y5 · micro:bit Sensor Gadget | photo/video of a temperature / step / light sensor program running |
| MD | Y5 · Validated Sheet, What-If? | Sheets screenshot: validated cells + a what-if change |
| DC | Y5 · Packets & Routes | photo of packet-relay game; voice: what an IP address is |
| TC | Y5 · Podcast Episode | **audio evidence** — the podcast segment + an edited cover image |
| SW | Y5 · Privacy Settings & Standing Up | privacy-settings audit screenshot |
| DW | Y5 · Instant Communication, Tech for Good | podcast segment / slide on tech helping society |

### Year 6 (`KCSB-6`, YOUTH · MakeCode Arcade; databases; flowcharts)
| Strand | Module | Artifact |
|---|---|---|
| CS | Y6 · Processor, Storage & Autonomous Robots | labelled teardown photo + voice on autonomous robots |
| CT | Y6 · Flowchart It | flowchart with sub-routines + variables |
| P | Y6 · Arcade Game with a Plan | project plan photo + prototype + MakeCode Arcade screenshot |
| MD | Y6 · Form → Database | capture form + single-table database screenshot |
| DC | Y6 · Bandwidth & Secure Transmission | bandwidth experiment data + encryption demo |
| TC | Y6 · Hyperlinked Document to a Brief | link/screenshot of the document |
| SW | Y6 · Your Digital Footprint | footprint map photo |
| DW | Y6 · Copyright & Disruptive Tech | one-slide pitch |

### Year 7 (`KCSB-7`, TEEN · Python 3; Tinkercad CAD + 3D printing)
| Strand | Module | Artifact |
|---|---|---|
| CS | Y7 · Logic Gates, Binary & AI | Tinkercad Circuits gate screenshot + truth table; AI-application card |
| CT | Y7 · Flowcharts with AND / OR / NOT | flowchart + truth table |
| P | Y7 · Blocks to Python | code screenshot: types, variables, input/output |
| MD | Y7 · Models, Simulations & Primary Keys | spreadsheet model screenshot |
| DC | Y7 · IP, URL, DNS & Secure Sites | DNS trace screenshot; voice: HTTPS + encryption |
| TC | Y7 · Cloud Docs: Track Changes & Advanced Search | screenshot |
| SW | Y7 · Your Record Follows You | written reflection + poster |
| DW | Y7 · Citation, Fair Use & Future Tech | a correctly cited document |
| (toolbelt) | Y7 · Tinkercad → 3D Print | **reuse/adapt Abaco "Design a 3D-Printable Product"** — either a 9th module or folded into CS |

### Year 8 (`KCSB-8`, TEEN · Python 3; Arduino; AI-assisted app building)
| Strand | Module | Artifact |
|---|---|---|
| CS | Y8 · ASCII, OS, AI in Robotics & AR | ASCII decode + Arduino/AR demo photo (**reuse Abaco circuit-sim modules**) |
| CT | Y8 · Pseudocode & Linear Search | pseudocode + trace table |
| P | Y8 · Robust Python | code + test plan screenshot; voice on iteration/libraries |
| MD | Y8 · Validation Rules & What-If | screenshot |
| DC | Y8 · PAN / LAN / WAN; Firewalls & Antivirus | network diagram photo |
| TC | Y8 · Templates & Master Documents | screenshot |
| SW | Y8 · Permissions, Metadata & Privacy | metadata audit screenshot |
| DW | Y8 · Source Validity, Work & IoT | AI-assisted (v0) app screenshot + written |

## 3. Code plan

1. **`prisma/seed-lib.mjs`** — extract from `seed-abaco.mjs` (no behavior change): `block`, `createModule` (upsert-by-title + criteria retire), `photoCriterion` / `audioCriterion` / `wrapUpCriterion` / `wrapUpPrompt`, the checkpoint↔criterion sanity check, and the class-module sync. `seed-abaco.mjs` switches to importing them.
2. **`prisma/kcsb/`** — one content file per year (`reception.mjs`, `year-1.mjs` … `year-8.mjs`), each exporting `{ className, classCode, band, modules: [...] }`. Keeps files ~300–600 lines instead of one 8k-line seed.
3. **`prisma/seed-kcsb.mjs`** — creates the KCSB org + 9 classes + instructor; `--update` upserts modules in place (same safety semantics as `content:update`); `--year 3` to seed/update a single year. npm scripts: `seed:kcsb`, `content:update:kcsb`.
4. **Instructor access** — `Instructor.email` is globally unique, so the camp coach account can't also live in the KCSB org. Options: (a) second instructor row with a `+kcsb` email alias — zero code; (b) schema change to `@@unique([orgId, email])` + org picker at login. Recommend (a) to start.
5. **Instructor console** already iterates all classes in the org (`app/instruct/page.tsx`), so 9 year-group panels work as-is; may want collapse/filter once there are 9.
6. **Phasing**
   - **Phase 0 — scaffold (1 pass):** org, 9 classes, all 72 modules with title, summary, topic, badge, criteria, and a 4–6 card outline (learn → build → checkpoint → wrap-up). Dashboards look complete; every module is doable end-to-end.
   - **Phase 1 — deepen, year by year:** full step-by-step tutorials with exact clicks/code (Abaco depth), MakeCode/Scratch embeds, Python `code` blocks. Order by which year group starts first.
   - **Phase 2 — polish:** step GIFs/images, Pyodide runner for Python modules, per-year tabs → term ordering + DL weaving.

## 4. Decisions taken (Aug 19 2026)

| Question | Decision |
|---|---|
| Org name | **KCSB Computing** |
| Sign-in | Open — name + selfie, `minAuthTier: 0` |
| Rosters | Pupils self-register with the class code as they sign up |
| Instructor | The existing coach account (`crachad.laing@gmail.com`) sees KCSB classes and every learner — via the new `Instructor.accessOrgs` relation (home org stays Abaco) |
| Modules per year | 8 (one per strand) — 72 total |
| Bands | R–Y2 EARLY · Y3–Y6 YOUTH · Y7–Y8 TEEN |
| Per-year tabs | Not available yet — built from the overview; term order is the default CS → CT → P → MD → DC → TC → SW → DW |

## 5. Status — Phase 0 scaffold is live

- `prisma/seed-lib.mjs` — shared helpers (`block`, criterion helpers, `moduleWriter`, `syncClassModules`, `checkCheckpoints`); `seed-abaco.mjs` now imports them.
- `prisma/kcsb/strands.mjs` — the 8 strand names, default order, year/code/band table.
- `prisma/kcsb/{reception,year-1…year-8}.mjs` — 72 modules, 6–14 cards each (learn → build → photo checkpoint → voice checkpoint → wrap-up), unique titles and badge names.
- `prisma/seed-kcsb.mjs` — `npm run seed:kcsb` (full reset of the KCSB org only) · `npm run content:update:kcsb` (safe upsert) · `-- --year 3` to limit either to one year.
- Tutorial: a module whose criteria are all evidence-based (Early band) now finishes with a single "Get my badge" button instead of a typed-reflection form.
- Instructor console: lists classes from every org the instructor can access, org name shown per class when there is more than one.

Class codes: `KCSB-R`, `KCSB-1` … `KCSB-8`. Learners: laingify.vercel.app → class code → name → "I'm new here" → selfie (skippable).

### Next (Phase 1+)
- Deepen year by year to Abaco tutorial depth (exact clicks, screenshots/GIFs, more `scratch`/`code` blocks) — start with whichever year group begins first.
- Export the per-year tabs → re-order modules per term and weave the DL flags.
- Pyodide runner for the Y7/Y8 Python `code` blocks; MakeCode embeds already work.
- Deploy: `prisma db push` has been run against the shared Supabase DB (new `_InstructorAccess` join table); Vercel deploy picks up the code changes.
