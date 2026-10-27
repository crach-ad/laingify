import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireLearner } from '@/lib/learner';
import MouseGame from '../MouseGame';
export const metadata = { title: 'Mouse Meadow · Class module | Laingify' };
export default async function MouseClassPage() {
  const { learner, klass } = await requireLearner();
  const assignment = await prisma.classModule.findFirst({ where: { classId: klass.id, module: { orgId: klass.orgId, title: 'Mouse Meadow', topic: 'Mouse Skills' } }, select: { moduleId: true } });
  if (!assignment) notFound();
  await prisma.moduleProgress.upsert({ where: { learnerId_moduleId: { learnerId: learner.id, moduleId: assignment.moduleId } }, create: { learnerId: learner.id, moduleId: assignment.moduleId, status: 'IN_PROGRESS' }, update: {} });
  return <MouseGame signedIn returnHref={`/learn/${assignment.moduleId}`} />;
}
