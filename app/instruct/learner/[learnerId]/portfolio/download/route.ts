import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getInstructor } from "@/lib/instructor";
import { buildPortfolio } from "@/lib/portfolio";
import { renderCombinedPortfolioHtml, combinedPortfolioFilename } from "@/lib/portfolio-html";

// Instructor download of a learner's FULL portfolio: every completed module
// in one self-contained HTML file (printable to PDF from any browser).
export async function GET(
  _req: Request,
  ctx: RouteContext<"/instruct/learner/[learnerId]/portfolio/download">,
) {
  const auth = await getInstructor();
  if (!auth) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { learnerId } = await ctx.params;
  const learner = await prisma.learner.findUnique({
    where: { id: learnerId },
    include: { roster: { include: { class: true } } },
  });
  const rosterEntry = learner?.roster.find((r) => auth.orgIds.includes(r.class.orgId));
  if (!learner || !rosterEntry)
    return NextResponse.json({ error: "Not found." }, { status: 404 });

  const [classModules, projects, progress] = await Promise.all([
    prisma.classModule.findMany({
      where: { classId: rosterEntry.classId },
      orderBy: { order: "asc" },
    }),
    prisma.project.findMany({ where: { learnerId } }),
    prisma.moduleProgress.findMany({ where: { learnerId, status: "COMPLETED" } }),
  ]);
  const completedIds = new Set([
    ...projects.map((p) => p.moduleId),
    ...progress.map((p) => p.moduleId),
  ]);
  const completedInOrder = classModules.filter((cm) => completedIds.has(cm.moduleId));
  if (completedInOrder.length === 0)
    return NextResponse.json({ error: "No completed projects yet." }, { status: 404 });

  const datas = (
    await Promise.all(completedInOrder.map((cm) => buildPortfolio(learnerId, cm.moduleId)))
  ).filter((d): d is NonNullable<typeof d> => Boolean(d));

  return new NextResponse(renderCombinedPortfolioHtml(datas), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${combinedPortfolioFilename(learner.displayName)}"`,
    },
  });
}
