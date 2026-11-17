import { getInstructor } from '@/lib/instructor';
import { prisma } from '@/lib/db';
import { authorizedRewriteClass, lockReflection } from '@/lib/reflection-rewrite';

export async function POST(req: Request) {
  const auth = await getInstructor();
  if (!auth) return Response.json({ error: 'Sign in as an instructor.' }, { status: 401 });
  const origin = req.headers.get('origin');
  const url = new URL(req.url);
  if (origin && origin !== `${url.protocol}//${req.headers.get('host') || url.host}`) {
    return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body || !['learnerId', 'moduleId', 'evidenceId'].every(k => typeof body[k] === 'string' && body[k].length > 0 && body[k].length < 200)) {
    return Response.json({ error: 'Select an audio reflection.' }, { status: 400 });
  }
  try {
    const status = await prisma.$transaction(async db => {
      await lockReflection(db, body.learnerId, body.moduleId);
      if (!await authorizedRewriteClass(db, auth.orgIds, body.learnerId, body.moduleId)) return 403;
      const evidence = await db.evidence.findFirst({ where: { id: body.evidenceId, learnerId: body.learnerId, moduleId: body.moduleId, type: { in: ['AUDIO', 'TEXT'] } } });
      if (!evidence?.criterionId) return 409;
      const criterion = await db.criterion.findFirst({ where: { id: evidence.criterionId, moduleId: body.moduleId, requiresEvidenceType: { in: ['AUDIO', 'TEXT'] } } });
      if (!criterion) return 409;
      const where = { learnerId: body.learnerId, moduleId: body.moduleId, criterionId: criterion.id, type: evidence.type };
      const latest = await db.evidence.findFirst({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
      if (latest?.id !== evidence.id) return 409;
      // Clear this recording checkpoint, including older takes, so they cannot
      // silently satisfy it again. Other checkpoints and written work remain.
      await db.evidence.deleteMany({ where });
      await db.criterionStatus.upsert({
        where: { learnerId_criterionId: { learnerId: body.learnerId, criterionId: criterion.id } },
        create: { learnerId: body.learnerId, criterionId: criterion.id, status: 'NOT_STARTED', decidedBy: 'instructor' },
        update: { status: 'NOT_STARTED', decidedBy: 'instructor' },
      });
      await db.moduleProgress.updateMany({ where: { learnerId: body.learnerId, moduleId: body.moduleId }, data: { status: 'IN_PROGRESS', completedAt: null } });
      return 200;
    }, { isolationLevel: 'Serializable' });
    if (status === 403) return Response.json({ error: 'You cannot reset this reflection.' }, { status });
    if (status === 409) return Response.json({ error: 'This recording has changed. Refresh the review before resetting it.' }, { status });
    return Response.json({ ok: true, awaitingRewrite: true });
  } catch {
    return Response.json({ error: 'Could not reset the recording. Refresh the review and try again.' }, { status: 409 });
  }
}
