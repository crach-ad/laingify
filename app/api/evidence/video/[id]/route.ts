import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getInstructor } from '@/lib/instructor';
import { storage, videoConfig, objectPath, VIDEO_BUCKET } from '@/lib/video-storage';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await prisma.evidence.findUnique({ where: { id } });
  if (!e || e.type !== 'VIDEO' || !e.criterionId) return new NextResponse('Not found', { status: 404 });
  const s = await getSession();
  let allowed = false;
  if (s?.learnerId === e.learnerId) {
    const [roster, assigned] = await Promise.all([
      prisma.rosterEntry.findFirst({ where: { classId: s.classId, learnerId: s.learnerId } }),
      prisma.classModule.findUnique({ where: { classId_moduleId: { classId: s.classId, moduleId: e.moduleId } } }),
    ]);
    allowed = !!roster && !!assigned;
  }
  if (!allowed) {
    const mod = await prisma.module.findUnique({ where: { id: e.moduleId }, select: { orgId: true } });
    allowed = !!mod && !!(await getInstructor())?.orgIds.includes(mod.orgId);
  }
  if (!allowed) return new NextResponse('Not found', { status: 404 });
  try {
    const path = objectPath(e.learnerId, e.moduleId, e.criterionId, e.id);
    const result = await storage(`/object/sign/${VIDEO_BUCKET}/${path}`, 'POST', { expiresIn: 600 });
    return NextResponse.redirect(videoConfig().base + result.signedURL, { status: 307, headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch { return new NextResponse('Video temporarily unavailable. Please reload.', { status: 503 }); }
}
