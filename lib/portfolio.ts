// Assemble the portfolio timeline for one learner × module.

import { prisma } from "@/lib/db";
import { evaluateModule } from "@/lib/completion";
import type { PortfolioData } from "@/components/PortfolioView";

export async function buildPortfolio(
  learnerId: string,
  moduleId: string,
): Promise<PortfolioData | null> {
  const [learner, module] = await Promise.all([
    prisma.learner.findUnique({ where: { id: learnerId } }),
    prisma.module.findUnique({ where: { id: moduleId }, include: { org: true } }),
  ]);
  if (!learner || !module) return null;

  const [{ complete }, evidence, submissions, project] = await Promise.all([
    evaluateModule(learnerId, moduleId),
    prisma.evidence.findMany({ where: { learnerId, moduleId }, orderBy: { createdAt: "asc" } }),
    prisma.submission.findMany({
      where: { learnerId, moduleId },
      orderBy: { createdAt: "asc" },
      include: { feedback: true },
    }),
    prisma.project.findUnique({ where: { learnerId_moduleId: { learnerId, moduleId } } }),
  ]);

  const items = [
    ...evidence.map((e) => ({
      id: e.id,
      kind: "evidence" as const,
      type: e.type,
      text: e.text,
      url: e.url,
      caption: e.caption,
      createdAt: e.createdAt,
    })),
    ...submissions.map((s) => ({
      id: s.id,
      kind: "submission" as const,
      text: s.content,
      feedbackSummary: s.feedback?.summary ?? null,
      createdAt: s.createdAt,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return {
    learner: { displayName: learner.displayName, photoUrl: learner.photoUrl },
    module: {
      title: module.title,
      summary: module.summary,
      badgeName: module.badgeName,
      badgeIcon: module.badgeIcon,
    },
    orgName: module.org.name,
    complete,
    projectSummary: project?.summary ?? null,
    items,
  };
}
