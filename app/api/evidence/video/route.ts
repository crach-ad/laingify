import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { signToken, verifyToken } from '@/lib/signed-token';
import { recomputeEvidenceCriteria, assembleProjectIfComplete } from '@/lib/completion';
import { storage, videoConfig, objectPath, VIDEO_BUCKET, VIDEO_LIMIT, VIDEO_TYPES } from '@/lib/video-storage';

type Ticket = { id: string; learner: string; classId: string; module: string; criterion: string; size: number; mime: string; name: string; exp: number };
export async function POST(req: Request) {
  if (req.headers.get('origin') !== new URL(req.url).origin) return NextResponse.json({ error: 'Cross-site request.' }, { status: 403 });
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Sign in to upload your video.' }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const ticket = b.action === 'finish' && typeof b.ticket === 'string' ? verifyToken<Ticket>('video-upload', b.ticket) : null;
  if (b.action === 'finish' && (!ticket || ticket.exp < Date.now() || ticket.learner !== s.learnerId || ticket.classId !== s.classId)) return NextResponse.json({ error: 'Upload expired. Please choose the video again.' }, { status: 403 });
  const moduleId = ticket?.module ?? String(b.moduleId ?? '');
  const criterionId = ticket?.criterion ?? String(b.criterionId ?? '');
  const [roster, assigned, criterion] = await Promise.all([
    prisma.rosterEntry.findFirst({ where: { classId: s.classId, learnerId: s.learnerId } }),
    prisma.classModule.findUnique({ where: { classId_moduleId: { classId: s.classId, moduleId } } }),
    prisma.criterion.findFirst({ where: { id: criterionId, moduleId, requiresEvidenceType: 'VIDEO' } }),
  ]);
  if (!roster || !assigned || !criterion) return NextResponse.json({ error: 'Video activity not found.' }, { status: 404 });
  try {
    if (b.action === 'start') {
      if (!Number.isSafeInteger(b.size) || b.size <= 0 || b.size > VIDEO_LIMIT || !VIDEO_TYPES.includes(b.mime)) return NextResponse.json({ error: 'Choose an MP4, WebM, or MOV video up to 50 MB.' }, { status: 400 });
      const t: Ticket = { id: randomUUID(), learner: s.learnerId, classId: s.classId, module: moduleId, criterion: criterionId, size: b.size, mime: b.mime, name: String(b.name || 'Pitch video').slice(0, 160), exp: Date.now() + 2 * 60 * 60 * 1000 };
      const path = objectPath(t.learner, t.module, t.criterion, t.id);
      const result = await storage(`/object/upload/sign/${VIDEO_BUCKET}/${path}`, 'POST', {});
      return NextResponse.json({ ticket: signToken('video-upload', t), uploadUrl: videoConfig().base + result.url });
    }
    if (b.action !== 'finish' || !ticket) return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    const path = objectPath(ticket.learner, ticket.module, ticket.criterion, ticket.id);
    const info = await storage(`/object/info/${VIDEO_BUCKET}/${path}`);
    const size = Number(info.metadata?.size ?? info.size);
    const mime = info.metadata?.mimetype ?? info.contentType;
    if (size !== ticket.size || size > VIDEO_LIMIT || !VIDEO_TYPES.includes(mime)) return NextResponse.json({ error: 'Uploaded video does not match. Please upload it again.' }, { status: 400 });
    const url = `/api/evidence/video/${ticket.id}`;
    const evidence = await prisma.evidence.upsert({ where: { id: ticket.id }, update: {}, create: { id: ticket.id, learnerId: s.learnerId, moduleId, criterionId, type: 'VIDEO', url, caption: ticket.name } });
    await recomputeEvidenceCriteria(s.learnerId, moduleId);
    const result = await assembleProjectIfComplete(s.learnerId, moduleId);
    return NextResponse.json({ evidence, complete: result.complete });
  } catch {
    return NextResponse.json({ error: 'Could not save the video. Please retry; if it continues, ask your teacher.' }, { status: 503 });
  }
}
