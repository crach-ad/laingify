import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

type Db = Prisma.TransactionClient;
export class ReflectionConflict extends Error {}

// Reopen and submission writes share this transaction-scoped lock. Locking a
// submission row alone would not protect against a newly inserted reflection.
export async function lockReflection(db: Db, learnerId: string, moduleId: string) {
  await db.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${JSON.stringify([learnerId, moduleId])}, 0))`;
}

export async function reflectionSnapshot(db: Db, learnerId: string, moduleId: string) {
  const [latest, pending] = await Promise.all([
    db.submission.findFirst({ where: { learnerId, moduleId, criterionId: null }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
    db.reflectionRewriteRequest.findFirst({ where: { learnerId, moduleId, fulfilledAt: null } }),
  ]);
  return { latest, pending };
}

export async function authorizedRewriteClass(db: Db, orgIds: string[], learnerId: string, moduleId: string) {
  const assignedModule = await db.module.findUnique({ where: { id: moduleId }, select: { orgId: true } });
  if (!assignedModule || !orgIds.includes(assignedModule.orgId)) return null;
  return db.class.findFirst({ where: {
    orgId: assignedModule.orgId,
    classCode: { startsWith: 'WSR-' },
    roster: { some: { learnerId } },
    modules: { some: { moduleId } },
  } });
}

export async function reopenReflection(input: { orgIds: string[]; instructorId: string; learnerId: string; moduleId: string; submissionId: string }) {
  return prisma.$transaction(async db => {
    await lockReflection(db, input.learnerId, input.moduleId);
    const klass = await authorizedRewriteClass(db, input.orgIds, input.learnerId, input.moduleId);
    if (!klass) return { forbidden: true as const };
    const prior = await db.reflectionRewriteRequest.findUnique({ where: { removedSubmissionId: input.submissionId } });
    if (prior) {
      if (prior.learnerId !== input.learnerId || prior.moduleId !== input.moduleId) return { forbidden: true as const };
      // A retried old action can never delete its replacement.
      return { request: prior, alreadyReopened: true };
    }
    const { latest, pending } = await reflectionSnapshot(db, input.learnerId, input.moduleId);
    if (pending || !latest || latest.id !== input.submissionId || !latest.content.trim()) {
      throw new ReflectionConflict('This reflection has changed. Refresh the page before reopening it.');
    }
    const request = await db.reflectionRewriteRequest.create({ data: {
      learnerId: input.learnerId, moduleId: input.moduleId, classId: klass.id,
      instructorId: input.instructorId, removedSubmissionId: latest.id,
    } });
    await db.autoFeedback.deleteMany({ where: { submissionId: latest.id } });
    await db.submission.delete({ where: { id: latest.id } });
    return { request, alreadyReopened: false };
  });
}
