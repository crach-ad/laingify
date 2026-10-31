// Add only this module and its IgniteHer class assignments. Never run a full seed.
// Preview: node --env-file=.env prisma/enable-inspire-her-showcase.mjs
// Apply:   node --env-file=.env prisma/enable-inspire-her-showcase.mjs --apply
import { PrismaClient } from '@prisma/client';
import { moduleWriter, checkCheckpoints } from './seed-lib.mjs';
import { inspireHerShowcaseData, INSPIRE_HER_TITLE } from './inspire-her-showcase-module.mjs';
import { elevatorPitchAnalysisData, PITCH_ANALYSIS_TITLE } from './elevator-pitch-analysis-module.mjs';
const prisma = new PrismaClient();
try {
  const orgs = await prisma.org.findMany({ where: { name: 'IgniteHer' }, include: { classes: { select: { id: true, name: true } } } });
  if (orgs.length !== 1 || !orgs[0].classes.length) throw new Error('Expected one IgniteHer organization with assigned classes.');
  const org = orgs[0];
  console.log(JSON.stringify({ modules: [PITCH_ANALYSIS_TITLE, INSPIRE_HER_TITLE], topic: 'Empowerment Series', classes: org.classes.map(c => c.name), apply: process.argv.includes('--apply') }));
  if (process.argv.includes('--apply')) {
    await prisma.$transaction(async tx => {
      const write = moduleWriter(tx, org, true);
      const pitch = await write(elevatorPitchAnalysisData());
      const mod = await write(inspireHerShowcaseData());
      await checkCheckpoints(tx, [pitch, mod]);
      for (const klass of org.classes) {
        const last = await tx.classModule.aggregate({ where: { classId: klass.id }, _max: { order: true } });
        // Append the two cards together, preserving all other assignments.
        const order = (last._max.order ?? -1) + 1;
        for (const [offset, item] of [pitch, mod].entries()) {
          await tx.classModule.upsert({ where: { classId_moduleId: { classId: klass.id, moduleId: item.id } }, update: { order: order + offset }, create: { classId: klass.id, moduleId: item.id, order: order + offset } });
        }
      }
      console.log(JSON.stringify({ pitchModuleId: pitch.id, showcaseModuleId: mod.id, requiredCheckpoints: 10, assignedClasses: org.classes.length }));
    }, { timeout: 30000 });
  }
} finally { await prisma.$disconnect(); }
