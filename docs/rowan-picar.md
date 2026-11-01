# Lessons with Rowan: PiCar-Pro

An additive private class under Coach Crachad's main instructor account
(`crachad.laing@gmail.com`), in the Private Lessons organization. Class code:
`ROWAN`. Rowan has a PIN-protected roster profile; setup generates the initial
PIN once and preserves existing learners, PINs, evidence, and assignments on reruns.
Both Coach Crachad logins (including `crachad@lainglaing.com`, when present)
receive access to this same private organization without changing their other access.

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
Instructor class/module previews show one block or assembly task at a time,
with Next/Back buttons, a position indicator, and horizontal touch swipes.
Parts, diagrams, and actions stay together for each assembly task. Coach notes
and class analytics are collapsed below the tutorial; preview navigation never
submits learner work. Other project previews keep their existing overview.
On returning
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
