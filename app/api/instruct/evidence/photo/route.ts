import { getInstructor } from '@/lib/instructor';
import { prisma } from '@/lib/db';
import { authorizedRewriteClass, lockReflection } from '@/lib/reflection-rewrite';

export async function DELETE(req: Request) {
  const auth = await getInstructor();
  if (!auth) return Response.json({ error: 'Sign in as an instructor.' }, { status: 401 });
  const url = new URL(req.url);
  const origin = req.headers.get('origin');
  if (origin && origin !== `${url.protocol}//${req.headers.get('host') || url.host}`) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || !['learnerId', 'moduleId', 'evidenceId'].every(key => typeof body[key] === 'string' && body[key].length > 0 && body[key].length < 200)) return Response.json({ error: 'Select a photo to delete.' }, { status: 400 });
  try {
    const status = await prisma.$transaction(async db => {
      await lockReflection(db, body.learnerId, body.moduleId);
      if (!await authorizedRewriteClass(db, auth.orgIds, body.learnerId, body.moduleId)) return 403;
      const photo = await db.evidence.findFirst({ where: { id: body.evidenceId, learnerId: body.learnerId, moduleId: body.moduleId, type: 'PHOTO' } });
      if (!photo) return 404;
      // Delete only the selected photo; a repeated old request cannot remove
      // another upload or a replacement submitted in the meantime.
      await db.evidence.delete({ where: { id: photo.id } });
      const [criteria, remaining] = await Promise.all([
        db.criterion.findMany({ where: { moduleId: body.moduleId, requiresEvidenceType: 'PHOTO' } }),
        db.evidence.findMany({ where: { learnerId: body.learnerId, moduleId: body.moduleId, type: 'PHOTO' } }),
      ]);
      let reopened = false;
      for (const criterion of criteria) {
        if (photo.criterionId && photo.criterionId !== criterion.id) continue;
        if (remaining.some(item => !item.criterionId || item.criterionId === criterion.id)) continue;
        await db.criterionStatus.upsert({
          where: { learnerId_criterionId: { learnerId: body.learnerId, criterionId: criterion.id } },
          create: { learnerId: body.learnerId, criterionId: criterion.id, status: 'NOT_STARTED', decidedBy: 'instructor' },
          update: { status: 'NOT_STARTED', decidedBy: 'instructor' },
        });
        reopened = true;
      }
      if (reopened) await db.moduleProgress.updateMany({ where: { learnerId: body.learnerId, moduleId: body.moduleId }, data: { status: 'IN_PROGRESS', completedAt: null } });
      return 200;
    }, { isolationLevel: 'Serializable' });
    if (status !== 200) return Response.json({ error: status === 403 ? 'You cannot delete this photo.' : 'This photo is no longer available. Refresh the review.' }, { status });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Could not delete the photo. Refresh the review and try again.' }, { status: 409 });
  }
}
