// Assemble the portfolio for one learner × module: work grouped by the
// criterion (tutorial step) it satisfied, in the order the steps appear.

import { prisma } from "@/lib/db";
import { evaluateModule } from "@/lib/completion";
import type { PortfolioData, PortfolioSection } from "@/components/PortfolioView";

export async function buildPortfolio(
  learnerId: string,
  moduleId: string,
): Promise<PortfolioData | null> {
  const [learner, module] = await Promise.all([
    prisma.learner.findUnique({ where: { id: learnerId } }),
    prisma.module.findUnique({ where: { id: moduleId }, include: { org: true } }),
  ]);
  if (!learner || !module) return null;

  const [{ complete }, criteria, evidence, submissions, project] = await Promise.all([
    evaluateModule(learnerId, moduleId),
    prisma.criterion.findMany({ where: { moduleId }, orderBy: { order: "asc" } }),
    prisma.evidence.findMany({ where: { learnerId, moduleId }, orderBy: { createdAt: "asc" } }),
    prisma.submission.findMany({
      where: { learnerId, moduleId },
      orderBy: { createdAt: "asc" },
      include: { feedback: true },
    }),
    prisma.project.findUnique({ where: { learnerId_moduleId: { learnerId, moduleId } } }),
  ]);

  const evidenceItems = evidence.map((e) => ({
    id: e.id,
    kind: "evidence" as const,
    type: e.type,
    text: e.text,
    url: e.url,
    caption: e.caption,
    createdAt: e.createdAt,
  }));

  // One section per criterion that has work attached, in step order.
  const sections: PortfolioSection[] = [];
  for (const c of criteria) {
    const items = evidenceItems.filter((i) => evidence.find((e) => e.id === i.id)?.criterionId === c.id);
    if (items.length > 0) sections.push({ title: c.label, items });
  }
  // Evidence not tied to a step.
  const untagged = evidenceItems.filter((i) => !evidence.find((e) => e.id === i.id)?.criterionId);
  if (untagged.length > 0) sections.push({ title: "More of my work", items: untagged });
  // Written submissions (the wrap-up) close the portfolio.
  if (submissions.length > 0) {
    sections.push({
      title: "My wrap-up",
      items: submissions.map((s) => ({
        id: s.id,
        kind: "submission" as const,
        text: s.content,
        feedbackSummary: s.feedback?.summary ?? null,
        createdAt: s.createdAt,
      })),
    });
  }

  const photoCount = evidence.filter((e) => e.type === "PHOTO").length;
  const audioCount = evidence.filter((e) => e.type === "AUDIO").length;
  const wordCount = submissions.reduce((n, s) => n + s.content.split(/\s+/).filter(Boolean).length, 0);
  const dates = [...evidence.map((e) => e.createdAt), ...submissions.map((s) => s.createdAt)];

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
    sections,
    stats: { photoCount, audioCount, wordCount },
    finishedAt: dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null,
  };
}
