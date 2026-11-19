# Lessons with Rowan: PiCar-Pro

An additive private class under Coach Crachad's main instructor account
(`crachad.laing@gmail.com`), in the Private Lessons organization. Class code:
`ROWAN`. Rowan has a PIN-protected roster profile; setup generates the initial
PIN once and preserves existing learners, PINs, evidence, and assignments on reruns.

The project is six ordered modules in the PiCar-Pro topic. Together they cover
48 assembly tasks and all 62 pages of the user-supplied Adeept Lesson 6 manual:
arm, chassis, head, body, wiring, and cover. Each task has a parts list, numbered
actions, and manually controlled source diagrams. Diagrams can be enlarged and
zoomed. Each lesson ends with a photo checkpoint and reflection. Coach-only
RUBRIC criteria cover servo preparation, wiring inspection, and final assembly.
Uploading a photo does not satisfy those coach approvals.

## Source

`public/tutorial/picar-pro/assembly-manual.pdf` is an unchanged copy of the
supplied PDF. `source.json` records its checksum. `page-01.jpg` through
`page-62.jpg` are cropped renderings; page references use the PDF page numbers.
Adeept attribution and a link to the original page are shown with each task.

The provided manual requires the separate Lesson 5 servo-centering procedure;
that lesson was not supplied and is not invented here. Construction is unpowered
following servo preparation. Assembly orientations (90, 180, and 30 degrees),
free pivots, camera spacer differences, servo A-E to CH0-CH4 mapping, D/E cable
colors, and MPU6050 placement are called out explicitly. The course does not
include battery preparation, software installation, or powered driving tests.

## Additive setup

```sh
node --env-file=.env prisma/enable-rowan-picar.mjs
node --env-file=.env prisma/enable-rowan-picar.mjs --apply
```

The preview is read-only. Apply verifies Coach Crachad, refuses another class's
use of `ROWAN`, creates the private organization and class, grants access without
changing the instructor's home organization, and upserts only these modules.
No reset, migration, deletion, or broad content seed is used.

Deploy the AssemblyStep renderer and assets before applying to a live database.
Instructor class/module previews render the same assembly visuals. On returning
to an assembly lesson, the player resumes at its last recorded analytics step,
clamped before the first unfinished checkpoint. If no step is recorded, it starts
at the beginning instead of skipping construction to an upload. Other tutorial
modules keep their existing resume behavior.

## Checks

```sh
node --test tests/picar-pro.test.mjs
npx tsc --noEmit
npm run build -- --webpack
```

## Visual restoration — 19 November 2026

The database retained all six lessons and 48 assembly blocks, but production
`00a41f8` lacked the assembly renderer and its assets (the diagram URL returned
404). Restore the original renderer, all 62 diagrams and the unchanged PDF from
`69d21d1`, and wire assembly blocks into both learner and instructor views.
Apply the saved-step behavior to assembly lessons while retaining current
instructor reset, reflection rewrite and completion handling. No data reseed or
learner-record changes are required.

`tests/picar-rendering.test.mjs` renders the actual Tutorial and AssemblyStep
components to verify diagrams, controls, parts, actions and saved-step resume.
This complements the original coverage for all 48 tasks and source-file integrity.
