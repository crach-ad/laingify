// Org-scoped wipe: removes ONE org and everything that belongs to it, leaving
// every other org's data untouched. Learners are only deleted if their entire
// roster lives inside this org (shared learners survive).
export async function wipeOrg(prisma, orgName) {
  const org = await prisma.org.findFirst({
    where: { name: orgName },
    include: { classes: true, modules: true },
  });
  if (!org) return;

  const classIds = org.classes.map((c) => c.id);
  const moduleIds = org.modules.map((m) => m.id);
  const roster = await prisma.rosterEntry.findMany({ where: { classId: { in: classIds } } });
  const rosterLearnerIds = [...new Set(roster.map((r) => r.learnerId))];
  const exclusive = [];
  for (const id of rosterLearnerIds) {
    const elsewhere = await prisma.rosterEntry.count({
      where: { learnerId: id, classId: { notIn: classIds } },
    });
    if (elsewhere === 0) exclusive.push(id);
  }
  const criteria = await prisma.criterion.findMany({ where: { moduleId: { in: moduleIds } } });
  const critIds = criteria.map((c) => c.id);
  const byLearnerOrModule = {
    OR: [{ learnerId: { in: exclusive } }, { moduleId: { in: moduleIds } }],
  };

  await prisma.message.deleteMany({ where: { thread: byLearnerOrModule } });
  await prisma.discussionThread.deleteMany({ where: byLearnerOrModule });
  await prisma.autoFeedback.deleteMany({ where: { submission: byLearnerOrModule } });
  await prisma.submission.deleteMany({ where: byLearnerOrModule });
  await prisma.evidence.deleteMany({ where: byLearnerOrModule });
  await prisma.criterionStatus.deleteMany({
    where: { OR: [{ learnerId: { in: exclusive } }, { criterionId: { in: critIds } }] },
  });
  await prisma.spriteInteraction.deleteMany({ where: byLearnerOrModule });
  await prisma.project.deleteMany({ where: byLearnerOrModule });
  await prisma.moduleProgress.deleteMany({ where: byLearnerOrModule });
  await prisma.classModule.deleteMany({ where: { classId: { in: classIds } } });
  await prisma.criterion.deleteMany({ where: { id: { in: critIds } } });
  await prisma.rosterEntry.deleteMany({ where: { classId: { in: classIds } } });
  await prisma.sprite.deleteMany({ where: { learnerId: { in: exclusive } } });
  await prisma.learner.deleteMany({ where: { id: { in: exclusive } } });
  await prisma.module.deleteMany({ where: { id: { in: moduleIds } } });
  await prisma.instructor.deleteMany({ where: { orgId: org.id } });
  await prisma.class.deleteMany({ where: { id: { in: classIds } } });
  await prisma.org.delete({ where: { id: org.id } });
}
