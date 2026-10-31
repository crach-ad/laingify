// Additive rollout: never resets classes, rosters, work, or existing assignments.
// Preview: node --env-file=.env prisma/enable-mouse-meadow.mjs --all
// Apply:   node --env-file=.env prisma/enable-mouse-meadow.mjs --all --apply
// One class: replace --all with --class-code=CODE
import { PrismaClient } from '@prisma/client';
import { moduleWriter, checkCheckpoints } from './seed-lib.mjs';
import { createMouseMeadowModule, MOUSE_MEADOW_TITLE } from './mouse-meadow-module.mjs';
const prisma = new PrismaClient();
try {
  const code = process.argv.find(arg => arg.startsWith('--class-code='))?.split('=')[1];
  if ((!code && !process.argv.includes('--all')) || (code && process.argv.includes('--all'))) throw new Error('Choose --all or --class-code=CODE.');
  const classes = await prisma.class.findMany({ where: { ...(code ? { classCode: code.toUpperCase() } : {}), org: { name: { not: 'IgniteHer' } } }, select: { id: true, orgId: true } });
  if (!classes.length) throw new Error('No matching classes.');
  const orgIds = [...new Set(classes.map(row => row.orgId))];
  console.log(JSON.stringify({ module: MOUSE_MEADOW_TITLE, organizations: orgIds.length, classes: classes.length, apply: process.argv.includes('--apply') }));
  if (process.argv.includes('--apply')) {
    for (const orgId of orgIds) {
      await prisma.$transaction(async tx => {
        const write = moduleWriter(tx, { id: orgId }, true);
        const mod = await createMouseMeadowModule(({ blocks, criteria, ...data }) => write({ ...data, contentJson: JSON.stringify(blocks), criteria: { create: criteria } }));
        await checkCheckpoints(tx, [mod]);
        for (const klass of classes.filter(row => row.orgId === orgId)) {
          const last = await tx.classModule.aggregate({ where: { classId: klass.id }, _max: { order: true } });
          await tx.classModule.upsert({ where: { classId_moduleId: { classId: klass.id, moduleId: mod.id } }, update: {}, create: { classId: klass.id, moduleId: mod.id, order: (last._max.order ?? -1) + 1 } });
        }
      }, { timeout: 30000 });
    }
    const assignments = await prisma.classModule.count({ where: { classId: { in: classes.map(row => row.id) }, module: { title: MOUSE_MEADOW_TITLE } } });
    if (assignments !== classes.length) throw new Error('Assignment verification failed.');
    console.log(JSON.stringify({ verifiedAssignments: assignments }));
  }
} finally { await prisma.$disconnect(); }
