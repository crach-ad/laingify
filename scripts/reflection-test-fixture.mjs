import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export function requireLocalReflectionDatabase() {
  for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    const url = new URL(value || 'invalid:');
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== '55439' || url.pathname !== '/reflection_test') {
      throw Error('Fixtures and tests require localhost:55439/reflection_test. Production databases are refused.');
    }
  }
}
export async function createFixture(prefix = `test-${randomUUID()}`) {
  requireLocalReflectionDatabase();
  const db = new PrismaClient();
  try {
    const org = await db.org.create({ data: { id: `${prefix}-org`, name: `${prefix} Windsor Test School`, context: 'community' } });
    const otherOrg = await db.org.create({ data: { id: `${prefix}-outside-org`, name: `${prefix} Other School` } });
    const instructor = await db.instructor.create({ data: { id: `${prefix}-teacher`, orgId: org.id, displayName: 'Pam Test Instructor', email: `${prefix}@example.test`, pin: '8642' } });
    const outsider = await db.instructor.create({ data: { id: `${prefix}-outsider`, orgId: otherOrg.id, displayName: 'Other Test Instructor', email: `${prefix}-other@example.test`, pin: '8642' } });
    const klass = await db.class.create({ data: { id: `${prefix}-class`, orgId: org.id, name: 'WSR Reflection Test', classCode: `WSR-${prefix.toUpperCase()}`, band: 'YOUTH', minAuthTier: 1 } });
    const nonWsr = await db.class.create({ data: { id: `${prefix}-nonwsr`, orgId: org.id, name: 'Other class', classCode: `OTHER-${prefix.toUpperCase()}`, band: 'YOUTH' } });
    const makeModule = async (suffix, tutorial) => db.module.create({ data: {
      id: `${prefix}-${suffix}`, orgId: org.id, title: tutorial ? 'Bridge building reflection' : 'Design journal reflection', summary: 'An isolated sample module for reflection rewrite testing.', topic: 'Reflection testing', badgeName: 'Test Builder',
      contentJson: JSON.stringify(tutorial ? [{ type: 'heading', text: 'Build a bridge' }, { type: 'checkpoint', capture: 'photo', text: 'Show your bridge.', criterionLabel: 'Photo evidence' }, { type: 'prompt', text: 'Describe what you changed and what you learned.' }] : [{ type: 'text', text: 'Describe how you tested and improved your design.' }, { type: 'prompt', text: 'Reflect on your design.' }]),
      criteria: { create: [{ id: `${prefix}-${suffix}-photo`, label: 'Photo evidence', requiresEvidenceType: 'PHOTO' }, { id: `${prefix}-${suffix}-text`, label: 'Written reflection' }] },
    } });
    const module = await makeModule('module', true), workspace = await makeModule('workspace', false), unassigned = await makeModule('unassigned', false);
    for (const classId of [klass.id, nonWsr.id]) for (const moduleId of [module.id, workspace.id]) await db.classModule.create({ data: { classId, moduleId } });
    const learners = {};
    for (const [name, classId] of [['Avery', klass.id], ['Blake', klass.id], ['Casey', klass.id], ['Drew', nonWsr.id]]) {
      const learner = await db.learner.create({ data: { id: `${prefix}-${name.toLowerCase()}`, displayName: `${name} Test`, band: 'YOUTH', sprite: { create: { name: 'Test Sprite' } } } });
      await db.rosterEntry.create({ data: { classId, learnerId: learner.id } });
      learners[name] = learner;
      for (const m of [module, workspace]) {
        await db.moduleProgress.create({ data: { learnerId: learner.id, moduleId: m.id, status: 'COMPLETED', completedAt: new Date('2026-11-01T12:00:00Z'), timeOnTaskSeconds: 420 } });
        await db.project.create({ data: { learnerId: learner.id, moduleId: m.id, summary: 'Existing test project — preserve this.', evidenceJson: '[]' } });
        await db.criterionStatus.createMany({ data: ['photo', 'text'].map(suffix => ({ learnerId: learner.id, criterionId: `${m.id}-${suffix}`, status: 'MET', decidedBy: 'system' })) });
        await db.evidence.create({ data: { learnerId: learner.id, moduleId: m.id, criterionId: `${m.id}-photo`, type: 'PHOTO', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="60"%3E%3Crect width="100" height="60" fill="green"/%3E%3C/svg%3E', caption: 'Preserved test evidence' } });
        await db.submission.create({ data: { id: `${learner.id}-${m.id}-older`, learnerId: learner.id, moduleId: m.id, content: 'An older reflection that must be preserved.', createdAt: new Date('2026-10-01T12:00:00Z'), feedback: { create: { summary: 'Older feedback to preserve.' } } } });
        await db.submission.create({ data: { id: `${learner.id}-${m.id}-checkpoint`, learnerId: learner.id, moduleId: m.id, criterionId: `${m.id}-photo`, content: 'An unrelated checkpoint submission.', feedback: { create: { summary: 'Checkpoint feedback to preserve.' } } } });
        await db.submission.create({ data: { id: `${learner.id}-${m.id}-reflection`, learnerId: learner.id, moduleId: m.id, content: 'My original reflection describes how I built a bridge and tested how much weight it holds.', feedback: { create: { summary: 'Original automated feedback.' } } } });
      }
    }
    return { org, otherOrg, instructor, outsider, klass, nonWsr, module, workspace, unassigned, learners };
  } finally { await db.$disconnect(); }
}
if (process.argv[1]?.endsWith('/reflection-test-fixture.mjs')) {
  const fixture = await createFixture(`preview-${Date.now()}`);
  console.log(JSON.stringify(fixture, null, 2));
}
