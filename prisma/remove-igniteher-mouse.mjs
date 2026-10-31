// Removes only class assignments, preserving the module and all student work.
// Dry run by default; pass --apply for the user-authorized live removal.
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const where = { class: { org: { name: 'IgniteHer' } }, module: { title: 'Mouse Meadow', topic: 'Mouse Skills', org: { name: 'IgniteHer' } } };
  const before = await p.classModule.findMany({ where, select: { id: true, classId: true, moduleId: true, order: true } });
  console.log(JSON.stringify({ assignments: before, apply: process.argv.includes('--apply') }));
  if (process.argv.includes('--apply')) {
    const result = await p.classModule.deleteMany({ where });
    if (await p.classModule.count({ where })) throw new Error('Assignments remain.');
    console.log(JSON.stringify({ removedAssignments: result.count, studentWorkPreserved: true }));
  }
} finally { await p.$disconnect(); }
